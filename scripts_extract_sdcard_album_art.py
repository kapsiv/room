#!/usr/bin/env python3
import csv
import re
import shutil
import subprocess
import unicodedata
from pathlib import Path
from tempfile import NamedTemporaryFile

from mutagen import File as MutagenFile

ABSENT_CSV = Path("/Users/kaps/Downloads/album-art-250/absent_albums.csv")
SD_MUSIC_ROOT = Path("/Volumes/Music SD/Music")
OUT_DIR = Path("/Users/kaps/Downloads/album-art-250/from-sdcard")
REPORT_PATH = OUT_DIR / "sdcard_extract_report.csv"

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".gif", ".tif", ".tiff"}
AUDIO_EXTS = {".mp3", ".flac", ".m4a", ".mp4", ".aac", ".ogg", ".opus", ".wav", ".aiff", ".alac"}


def safe_name(value: str) -> str:
    value = re.sub(r'[\\/*?:"<>|]', "_", (value or "").strip())
    return re.sub(r"\s+", " ", value).strip()


def normalize_for_match(value: str) -> str:
    text = unicodedata.normalize("NFKD", value or "")
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    text = text.lower()
    text = text.replace("&", " and ")
    text = re.sub(r"[’'`]", "", text)
    text = re.sub(r"[^0-9a-z\u3040-\u30ff\u4e00-\u9fff\uac00-\ud7a3]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def dedupe(items):
    seen = set()
    out = []
    for item in items:
        if item and item not in seen:
            seen.add(item)
            out.append(item)
    return out


def artist_candidates(artist: str):
    artist = (artist or "").strip()
    candidates = [artist]
    m = re.search(r"\[([^\]]+)\]", artist)
    if m:
        alias = m.group(1).strip()
        no_bracket = re.sub(r"\s*\[[^\]]+\]\s*", " ", artist).strip()
        candidates.extend([alias, no_bracket])
    return dedupe([c for c in candidates if c])


def album_candidates(album: str):
    album = (album or "").strip()
    candidates = [album]

    # Strip trailing transliteration parentheses
    candidates.append(re.sub(r"\s*\([^)]*\)\s*$", "", album).strip())
    candidates.append(re.sub(r"\s*（[^）]*）\s*$", "", album).strip())

    # Keep content inside trailing parentheses as additional candidate
    m1 = re.search(r"\(([^)]*)\)\s*$", album)
    if m1:
        candidates.append(m1.group(1).strip())
    m2 = re.search(r"（([^）]*)）\s*$", album)
    if m2:
        candidates.append(m2.group(1).strip())

    return dedupe([c for c in candidates if c])


def build_dir_index(root: Path):
    dirs = [p for p in root.rglob("*") if p.is_dir()]
    index = {}
    for d in dirs:
        name_norm = normalize_for_match(d.name)
        if not name_norm:
            continue
        index.setdefault(name_norm, []).append(d)
    return dirs, index


def score_path(path: Path, album_norm: str, artist_norms: list[str]) -> int:
    score = 0
    base_norm = normalize_for_match(path.name)
    full_norm = normalize_for_match(path.as_posix())

    if base_norm == album_norm:
        score += 100
    elif album_norm and (album_norm in base_norm or base_norm in album_norm):
        score += 40

    for a in artist_norms:
        if not a:
            continue
        if a in full_norm:
            score += 20
            break
    # Prefer shallower paths for canonical album folders
    score -= len(path.parts)
    return score


def find_album_dir(all_dirs, dir_index, artist: str, album: str):
    artist_norms = [normalize_for_match(a) for a in artist_candidates(artist)]
    album_norms = [normalize_for_match(a) for a in album_candidates(album)]
    album_norms = [a for a in album_norms if a]

    candidates = []
    for an in album_norms:
        candidates.extend(dir_index.get(an, []))

    if not candidates:
        # Fallback: substring search
        for d in all_dirs:
            base_norm = normalize_for_match(d.name)
            if any(an and (an in base_norm or base_norm in an) for an in album_norms):
                candidates.append(d)

    if not candidates:
        return None

    best = max(candidates, key=lambda p: score_path(p, album_norms[0] if album_norms else "", artist_norms))
    return best


def image_priority(path: Path) -> int:
    name = path.name.lower()
    # Smaller score means higher priority
    order = [
        "cover.jpg", "cover.jpeg", "folder.jpg", "folder.jpeg", "front.jpg", "front.jpeg",
        "albumart.jpg", "albumart.jpeg",
    ]
    for i, target in enumerate(order):
        if name == target:
            return i
    if "cover" in name:
        return 20
    if "folder" in name:
        return 21
    if "front" in name:
        return 22
    if "art" in name:
        return 25
    return 50


def find_cover_image(album_dir: Path):
    imgs = [p for p in album_dir.rglob("*") if p.is_file() and p.suffix.lower() in IMAGE_EXTS]
    if not imgs:
        # Fallback: check nearby parent dirs for shared artwork files.
        parent_candidates = []
        p1 = album_dir.parent
        p2 = p1.parent if p1 else None
        for parent in [p1, p2]:
            if not parent or not parent.exists():
                continue
            for file in parent.iterdir():
                if file.is_file() and file.suffix.lower() in IMAGE_EXTS:
                    parent_candidates.append(file)
        if not parent_candidates:
            return None
        parent_candidates.sort(key=lambda p: (image_priority(p), len(p.parts), p.name.lower()))
        return parent_candidates[0]
    imgs.sort(key=lambda p: (image_priority(p), len(p.parts), p.name.lower()))
    return imgs[0]


def extract_embedded_cover(album_dir: Path):
    audio_files = [
        p for p in album_dir.rglob("*")
        if p.is_file() and p.suffix.lower() in AUDIO_EXTS
    ]
    audio_files.sort(key=lambda p: (len(p.parts), p.name.lower()))

    for track in audio_files:
        try:
            audio = MutagenFile(track)
        except Exception:
            continue
        if not audio:
            continue

        # FLAC pictures
        pics = getattr(audio, "pictures", None)
        if pics:
            pic = pics[0]
            mime = (getattr(pic, "mime", "") or "").lower()
            ext = ".jpg" if "jpeg" in mime else ".png"
            with NamedTemporaryFile(delete=False, suffix=ext) as tmp:
                tmp.write(pic.data)
                return Path(tmp.name)

        tags = getattr(audio, "tags", None)
        if not tags:
            continue

        # MP3 ID3 APIC
        try:
            apics = tags.getall("APIC")
        except Exception:
            apics = []
        if apics:
            apic = apics[0]
            mime = (getattr(apic, "mime", "") or "").lower()
            ext = ".jpg" if "jpeg" in mime else ".png"
            with NamedTemporaryFile(delete=False, suffix=ext) as tmp:
                tmp.write(apic.data)
                return Path(tmp.name)

        # MP4/M4A cover
        covr = tags.get("covr")
        if covr:
            raw = bytes(covr[0])
            with NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
                tmp.write(raw)
                return Path(tmp.name)

    return None


def convert_to_jpg(src: Path, dst_jpg: Path) -> bool:
    # Use macOS sips to avoid extra Python deps.
    cmd = ["sips", "-s", "format", "jpeg", str(src), "--out", str(dst_jpg)]
    res = subprocess.run(cmd, capture_output=True, text=True)
    return res.returncode == 0 and dst_jpg.exists()


def copy_or_convert(src: Path, dst_jpg: Path):
    ext = src.suffix.lower()
    if ext in {".jpg", ".jpeg"}:
        shutil.copy2(src, dst_jpg)
        return "copied_jpg"
    ok = convert_to_jpg(src, dst_jpg)
    if ok:
        return "converted_to_jpg"
    fallback = dst_jpg.with_suffix(ext if ext else ".img")
    shutil.copy2(src, fallback)
    return f"copied_original_ext_{ext or 'unknown'}"


def main():
    if not SD_MUSIC_ROOT.exists():
        raise SystemExit(f"SD music root not found: {SD_MUSIC_ROOT}")
    if not ABSENT_CSV.exists():
        raise SystemExit(f"Missing absent csv: {ABSENT_CSV}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    all_dirs, dir_index = build_dir_index(SD_MUSIC_ROOT)

    rows = list(csv.DictReader(ABSENT_CSV.open("r", encoding="utf-8-sig", newline="")))
    report_rows = []

    for row in rows:
        artist = (row.get("artist") or "").strip()
        album = (row.get("album") or "").strip()
        expected_filename = f"{safe_name(artist)} - {safe_name(album)}.jpg"
        out_path = OUT_DIR / expected_filename

        album_dir = find_album_dir(all_dirs, dir_index, artist, album)
        if not album_dir:
            report_rows.append({
                "artist": artist,
                "album": album,
                "status": "album_dir_not_found",
                "source_album_dir": "",
                "source_image": "",
                "output_file": "",
            })
            continue

        cover = find_cover_image(album_dir)
        temp_cover = None
        if not cover:
            temp_cover = extract_embedded_cover(album_dir)
            cover = temp_cover
        if not cover:
            report_rows.append({
                "artist": artist,
                "album": album,
                "status": "cover_not_found_in_album_dir",
                "source_album_dir": str(album_dir),
                "source_image": "",
                "output_file": "",
            })
            continue

        status = copy_or_convert(cover, out_path)
        if temp_cover and temp_cover.exists():
            try:
                temp_cover.unlink()
            except OSError:
                pass
        report_rows.append({
            "artist": artist,
            "album": album,
            "status": status,
            "source_album_dir": str(album_dir),
            "source_image": str(cover),
            "output_file": str(out_path if out_path.exists() else out_path.with_suffix(cover.suffix.lower())),
        })

    with REPORT_PATH.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=["artist", "album", "status", "source_album_dir", "source_image", "output_file"],
        )
        writer.writeheader()
        writer.writerows(report_rows)

    copied = sum(1 for r in report_rows if r["status"] in {"copied_jpg", "converted_to_jpg"})
    print(f"Rows processed: {len(report_rows)}")
    print(f"Covers copied/converted: {copied}")
    print(f"Output folder: {OUT_DIR}")
    print(f"Report: {REPORT_PATH}")


if __name__ == "__main__":
    main()
