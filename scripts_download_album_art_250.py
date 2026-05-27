#!/usr/bin/env python3
import csv
import json
import re
import time
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

import requests
from requests.adapters import HTTPAdapter
from requests.exceptions import RequestException
from urllib3.util.retry import Retry

CSV_PATH = Path("/Users/kaps/Downloads/Cleaned May 26 Collection - Sheet1-2.csv")
OUT_DIR = Path("/Users/kaps/Downloads/album-art-250")
CACHE_PATH = OUT_DIR / "mbid_cache.json"
REPORT_PATH = OUT_DIR / "download_report.csv"

MB_SEARCH_URL = "https://musicbrainz.org/ws/2/release-group/"
CAA_URL_TEMPLATE = "https://coverartarchive.org/release-group/{mbid}/front-250"
USER_AGENT = "kaps-music-album-art-fetcher/1.0 (contact: you@example.com)"
RETRY_CACHED_NO_MATCH = True

OUT_DIR.mkdir(parents=True, exist_ok=True)


def build_session() -> requests.Session:
    session = requests.Session()
    retry = Retry(
        total=5,
        connect=5,
        read=5,
        status=5,
        backoff_factor=0.6,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET"],
        raise_on_status=False,
    )
    adapter = HTTPAdapter(max_retries=retry)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    session.headers.update({"User-Agent": USER_AGENT})
    return session


SESSION = build_session()


def safe_name(s: str) -> str:
    s = re.sub(r"[\\/*?:\"<>|]", "_", s.strip())
    return re.sub(r"\s+", " ", s)


def dedupe_keep_order(items):
    seen = set()
    out = []
    for item in items:
        if item and item not in seen:
            seen.add(item)
            out.append(item)
    return out


def normalize_spaces(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()


def artist_candidates(artist: str):
    artist = normalize_spaces(artist)
    candidates = [artist]

    # "青葉市子 [Ichiko Aoba]" -> "青葉市子" and "Ichiko Aoba"
    bracket_match = re.search(r"\[([^\]]+)\]", artist)
    if bracket_match:
        alias = normalize_spaces(bracket_match.group(1))
        no_bracket = normalize_spaces(re.sub(r"\s*\[[^\]]+\]\s*", " ", artist))
        candidates.extend([no_bracket, alias])

    return dedupe_keep_order(candidates)


def album_candidates(album: str):
    album = normalize_spaces(album)
    candidates = [album]

    # "うたびこ (Utabiko)" -> "うたびこ"
    no_round = normalize_spaces(re.sub(r"\s*\([^)]*\)\s*$", "", album))
    # "タイトル（Romanized）" -> "タイトル"
    no_full = normalize_spaces(re.sub(r"\s*（[^）]*）\s*$", "", album))
    candidates.extend([no_round, no_full])

    return dedupe_keep_order(candidates)


def query_release_group(query: str):
    try:
        r = SESSION.get(
            MB_SEARCH_URL,
            params={"query": query, "fmt": "json", "limit": 1},
            timeout=20,
        )
    except RequestException:
        return None, "mb_request_error"
    if r.status_code != 200:
        return None, f"mb_status_{r.status_code}"
    try:
        data = r.json()
    except ValueError:
        return None, "mb_bad_json"
    rgs = data.get("release-groups", [])
    if not rgs:
        return None, "mb_no_match"
    return rgs[0]["id"], "ok"


def load_pairs():
    pairs = set()
    with CSV_PATH.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            artist = (row.get("Artist") or "").strip()
            album = (row.get("Album") or "").strip()
            if not artist or not album or album == "0":
                continue
            pairs.add((artist, album))
    return sorted(pairs)

def load_cache():
    if CACHE_PATH.exists():
        return json.loads(CACHE_PATH.read_text(encoding="utf-8"))
    return {}

def save_cache(cache):
    CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")


def lookup_mbid(artist, album):
    saw_request_error = False

    for a in artist_candidates(artist):
        for b in album_candidates(album):
            queries = [
                f'releasegroup:"{b}" AND artist:"{a}"',
                f'releasegroup:{b} AND artist:{a}',
            ]
            for q in queries:
                mbid, status = query_release_group(q)
                if status == "ok":
                    return mbid, status
                if status == "mb_request_error":
                    saw_request_error = True

    if saw_request_error:
        return None, "mb_request_error"
    return None, "mb_no_match"


def download_cover(artist, album, mbid):
    url = CAA_URL_TEMPLATE.format(mbid=mbid)
    fname = f"{safe_name(artist)} - {safe_name(album)}.jpg"
    out = OUT_DIR / fname
    if out.exists():
        return "exists", out.name
    try:
        r = SESSION.get(url, timeout=30, allow_redirects=True)
    except RequestException:
        return "caa_request_error", out.name
    if r.status_code == 200 and r.headers.get("content-type", "").startswith("image/"):
        out.write_bytes(r.content)
        return "downloaded", out.name
    if r.status_code == 404:
        return "caa_not_found", out.name
    return f"caa_status_{r.status_code}", out.name

def main():
    pairs = load_pairs()
    cache = load_cache()
    report_rows = []

    # 1) MB lookups (rate-limited ~1 req/sec)
    for artist, album in pairs:
        key = f"{artist}|||{album}"
        recalc_no_match = (
            RETRY_CACHED_NO_MATCH
            and key in cache
            and cache[key].get("lookup_status") == "mb_no_match"
        )
        if key not in cache or recalc_no_match:
            mbid, status = lookup_mbid(artist, album)
            cache[key] = {"mbid": mbid, "lookup_status": status}
            time.sleep(1.1)
        report_rows.append({
            "artist": artist,
            "album": album,
            "mbid": cache[key]["mbid"] or "",
            "lookup_status": cache[key]["lookup_status"],
            "download_status": "",
            "file": "",
        })
    save_cache(cache)

    # 2) CAA downloads (parallel)
    tasks = []
    with ThreadPoolExecutor(max_workers=12) as ex:
        for i, row in enumerate(report_rows):
            mbid = row["mbid"]
            if mbid:
                tasks.append((i, ex.submit(download_cover, row["artist"], row["album"], mbid)))
        for i, fut in tasks:
            status, fname = fut.result()
            report_rows[i]["download_status"] = status
            report_rows[i]["file"] = fname

    # 3) report
    with REPORT_PATH.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["artist", "album", "mbid", "lookup_status", "download_status", "file"])
        w.writeheader()
        w.writerows(report_rows)

    downloaded = sum(1 for r in report_rows if r["download_status"] == "downloaded")
    exists = sum(1 for r in report_rows if r["download_status"] == "exists")
    print(f"Done. downloaded={downloaded}, already_exists={exists}, total_rows={len(report_rows)}")
    print(f"Output dir: {OUT_DIR}")
    print(f"Report: {REPORT_PATH}")
    print(f"Cache: {CACHE_PATH}")

if __name__ == "__main__":
    main()
