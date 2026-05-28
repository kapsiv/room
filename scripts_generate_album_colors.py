#!/usr/bin/env python3
import argparse
import csv
import re
import unicodedata
from collections import Counter
from pathlib import Path

from PIL import Image


def safe_name(s: str) -> str:
    s = re.sub(r"[\\/*?:\"<>|]", "_", s.strip())
    return re.sub(r"\s+", " ", s)


def normalize_match_text(s: str) -> str:
    s = unicodedata.normalize("NFKD", s)
    s = "".join(ch for ch in s if not unicodedata.combining(ch))
    s = s.lower()
    s = re.sub(r"[\\/*?:\"<>|]+", " ", s)
    s = re.sub(r"['’`]+", "", s)
    s = re.sub(r"[^a-z0-9 ]+", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def album_candidates(album: str):
    values = [album.strip()]
    values.append(re.sub(r"\s*\([^)]*\)\s*", " ", album).strip())
    values.append(re.sub(r"\s*（[^）]*）\s*", " ", album).strip())
    seen = set()
    out = []
    for v in values:
        if not v:
            continue
        if v in seen:
            continue
        seen.add(v)
        out.append(v)
    return out


def rgb_to_hex(rgb):
    r, g, b = rgb
    return f"#{r:02x}{g:02x}{b:02x}"


def clamp_u8(value: float) -> int:
    return max(0, min(255, int(round(value))))


def average_rgb(pixels):
    total = len(pixels)
    r = sum(p[0] for p in pixels) / total
    g = sum(p[1] for p in pixels) / total
    b = sum(p[2] for p in pixels) / total
    return (clamp_u8(r), clamp_u8(g), clamp_u8(b))


def dominant_rgb_quantized(pixels, step=16):
    if step <= 0:
        raise ValueError("step must be > 0")
    bins = Counter(
        ((p[0] // step) * step, (p[1] // step) * step, (p[2] // step) * step)
        for p in pixels
    )
    dom = bins.most_common(1)[0][0]
    # Shift bin center so dominant color is less dark-biased.
    offset = step // 2
    return (
        clamp_u8(dom[0] + offset),
        clamp_u8(dom[1] + offset),
        clamp_u8(dom[2] + offset),
    )


def mixed_rgb(avg_rgb, dom_rgb, dominant_weight=0.6):
    avg_weight = 1.0 - dominant_weight
    return (
        clamp_u8(avg_rgb[0] * avg_weight + dom_rgb[0] * dominant_weight),
        clamp_u8(avg_rgb[1] * avg_weight + dom_rgb[1] * dominant_weight),
        clamp_u8(avg_rgb[2] * avg_weight + dom_rgb[2] * dominant_weight),
    )


def compute_colors(image_path: Path, sample_size=80, dominant_weight=0.6, quant_step=16):
    with Image.open(image_path) as img:
        rgb = img.convert("RGB").resize((sample_size, sample_size), Image.Resampling.BILINEAR)
        pixels = list(rgb.get_flattened_data())
    avg = average_rgb(pixels)
    dom = dominant_rgb_quantized(pixels, step=quant_step)
    mixed = mixed_rgb(avg, dom, dominant_weight=dominant_weight)
    return {
        "avg_rgb": avg,
        "avg_hex": rgb_to_hex(avg),
        "dominant_rgb": dom,
        "dominant_hex": rgb_to_hex(dom),
        "mixed_rgb": mixed,
        "mixed_hex": rgb_to_hex(mixed),
    }


def build_image_index(album_art_dir: Path):
    by_norm_pair = {}
    by_norm_artist = {}
    for p in album_art_dir.iterdir():
        if not p.is_file():
            continue
        if p.suffix.lower() not in (".jpg", ".jpeg", ".png", ".webp"):
            continue
        stem = p.stem
        if " - " not in stem:
            continue
        artist, album = stem.split(" - ", 1)
        na = normalize_match_text(artist)
        nb = normalize_match_text(album)
        by_norm_pair.setdefault((na, nb), p)
        by_norm_artist.setdefault(na, []).append((nb, p))
    return by_norm_pair, by_norm_artist


def find_image_file(album_art_dir: Path, artist: str, album: str, image_index):
    by_norm_pair, by_norm_artist = image_index

    # 1) Fast exact filename lookup first.
    base = safe_name(f"{artist} - {album}")
    for ext in (".jpg", ".jpeg", ".png", ".webp"):
        candidate = album_art_dir / f"{base}{ext}"
        if candidate.exists():
            return candidate

    # 2) Normalized pair lookup with candidate album variants.
    norm_artist = normalize_match_text(artist)
    for album_variant in album_candidates(album):
        norm_album = normalize_match_text(album_variant)
        direct = by_norm_pair.get((norm_artist, norm_album))
        if direct:
            return direct

    # 3) Fuzzy fallback within the same artist.
    artist_files = by_norm_artist.get(norm_artist, [])
    if not artist_files:
        return None

    target_candidates = [normalize_match_text(a) for a in album_candidates(album)]
    compact_candidates = [re.sub(r"[^a-z0-9]+", "", c) for c in target_candidates]

    for target, compact in zip(target_candidates, compact_candidates):
        for candidate_album, candidate_path in artist_files:
            candidate_compact = re.sub(r"[^a-z0-9]+", "", candidate_album)
            if compact and compact == candidate_compact:
                return candidate_path
            if target and (
                target in candidate_album or candidate_album in target
            ) and min(len(target), len(candidate_album)) >= 8:
                return candidate_path

    return None


def read_collection_rows(csv_path: Path):
    with csv_path.open("r", encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def unique_artist_album(rows):
    seen = set()
    pairs = []
    for row in rows:
        artist = (row.get("Artist") or "").strip()
        album = (row.get("Album") or "").strip()
        if not artist or not album:
            continue
        key = (artist, album)
        if key in seen:
            continue
        seen.add(key)
        pairs.append(key)
    return pairs


def write_album_colors_csv(output_path: Path, album_rows):
    fieldnames = [
        "Artist",
        "Album",
        "ImageFile",
        "Status",
        "AlbumColorHex",
        "AverageHex",
        "DominantHex",
    ]
    with output_path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(album_rows)


def write_collection_with_color_csv(output_path: Path, collection_rows, color_map):
    fieldnames = list(collection_rows[0].keys())
    if "AlbumColorHex" not in fieldnames:
        fieldnames.append("AlbumColorHex")
    with output_path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in collection_rows:
            artist = (row.get("Artist") or "").strip()
            album = (row.get("Album") or "").strip()
            row["AlbumColorHex"] = color_map.get((artist, album), "")
            writer.writerow(row)


def main():
    parser = argparse.ArgumentParser(
        description="Compute album cover colors and augment collection CSV."
    )
    parser.add_argument(
        "--collection-csv",
        default="public/data/collection.csv",
        help="Path to source collection CSV",
    )
    parser.add_argument(
        "--album-art-dir",
        default="/Users/kaps/Downloads/collectiv-albums",
        help="Folder containing cover files named 'Artist - Album.jpg'",
    )
    parser.add_argument(
        "--out-album-colors",
        default="public/data/album_colours.csv",
        help="Output album-level colors CSV",
    )
    parser.add_argument(
        "--out-collection-with-colors",
        default="public/data/collection_with_colours.csv",
        help="Output CSV path for collection-with-colors export",
    )
    parser.add_argument(
        "--collection-output-granularity",
        choices=["album", "track"],
        default="album",
        help="Whether out-collection-with-colors should be one row per album or per track",
    )
    parser.add_argument(
        "--dominant-weight",
        type=float,
        default=0.6,
        help="Weight for dominant color in final mix (0-1). Default: 0.6",
    )
    parser.add_argument(
        "--sample-size",
        type=int,
        default=80,
        help="Resize covers to N x N before analysis. Default: 80",
    )
    parser.add_argument(
        "--quant-step",
        type=int,
        default=16,
        help="Dominant-color quantization step (1-64 recommended). Default: 16",
    )
    args = parser.parse_args()

    collection_csv = Path(args.collection_csv).expanduser().resolve()
    album_art_dir = Path(args.album_art_dir).expanduser().resolve()
    out_album_colors = Path(args.out_album_colors).expanduser().resolve()
    out_collection = Path(args.out_collection_with_colors).expanduser().resolve()

    rows = read_collection_rows(collection_csv)
    if not rows:
        raise SystemExit("Collection CSV is empty.")

    pairs = unique_artist_album(rows)
    image_index = build_image_index(album_art_dir)
    album_rows = []
    color_map = {}

    for artist, album in pairs:
        image_path = find_image_file(album_art_dir, artist, album, image_index)
        if not image_path:
            album_rows.append(
                {
                    "Artist": artist,
                    "Album": album,
                    "ImageFile": "",
                    "Status": "missing_image",
                    "AlbumColorHex": "",
                    "AverageHex": "",
                    "DominantHex": "",
                }
            )
            continue

        colors = compute_colors(
            image_path,
            sample_size=args.sample_size,
            dominant_weight=args.dominant_weight,
            quant_step=args.quant_step,
        )
        album_rows.append(
            {
                "Artist": artist,
                "Album": album,
                "ImageFile": image_path.name,
                "Status": "ok",
                "AlbumColorHex": colors["mixed_hex"],
                "AverageHex": colors["avg_hex"],
                "DominantHex": colors["dominant_hex"],
            }
        )
        color_map[(artist, album)] = colors["mixed_hex"]

    out_album_colors.parent.mkdir(parents=True, exist_ok=True)
    out_collection.parent.mkdir(parents=True, exist_ok=True)
    write_album_colors_csv(out_album_colors, album_rows)
    if args.collection_output_granularity == "album":
        write_album_colors_csv(out_collection, album_rows)
    else:
        write_collection_with_color_csv(out_collection, rows, color_map)

    missing = sum(1 for r in album_rows if r["Status"] != "ok")
    print(f"Albums processed: {len(album_rows)}")
    print(f"Albums with color: {len(album_rows) - missing}")
    print(f"Albums missing image: {missing}")
    print(f"Album colors CSV: {out_album_colors}")
    print(
        f"Collection CSV with colors ({args.collection_output_granularity}-level): {out_collection}"
    )


if __name__ == "__main__":
    main()
