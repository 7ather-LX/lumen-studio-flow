#!/usr/bin/env python3
"""Accept one batch of artist/style images without polluting the curated set.

Example:
  python training/scripts/ingest_batch.py --artist Ririko --style flat_cel --files "C:/incoming/*.jpg"

Creates:
  training/inbox/<style>/batch_<timestamp>/
  training/inbox/<style>/batch_<timestamp>/batch_manifest.jsonl
  training/inbox/<style>/batch_<timestamp>/batch_sheet.png
"""
from __future__ import annotations

import argparse
import hashlib
import json
import shutil
from datetime import datetime
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageStat
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
INBOX = ROOT / "training" / "inbox"
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}


def dhash(image: Image.Image, size: int = 8) -> str:
    gray = image.convert("L").resize((size + 1, size), Image.Resampling.LANCZOS)
    arr = np.asarray(gray, dtype=np.int16)
    value = 0
    for bit in (arr[:, 1:] > arr[:, :-1]).flatten():
        value = (value << 1) | int(bit)
    return f"{value:016x}"


def hamming(left: str, right: str) -> int:
    return (int(left, 16) ^ int(right, 16)).bit_count()


def sharpness(image: Image.Image) -> float:
    return float(ImageStat.Stat(image.convert("L").filter(ImageFilter.FIND_EDGES)).mean[0])


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--artist", required=True)
    parser.add_argument("--style", default="flat_cel")
    parser.add_argument("--files", nargs="+", required=True)
    parser.add_argument("--batch", default="")
    args = parser.parse_args()
    batch = args.batch or datetime.now().strftime("%Y%m%d_%H%M%S")
    target_dir = INBOX / args.style / f"batch_{batch}"
    target_dir.mkdir(parents=True, exist_ok=True)
    rows = []
    hashes = []
    for raw in args.files:
        path = Path(raw)
        if not path.is_file() or path.suffix.lower() not in IMAGE_EXTS:
            continue
        with Image.open(path) as opened:
            image = opened.convert("RGB")
            width, height = image.size
            digest = dhash(image)
            duplicate = any(hamming(digest, other) <= 6 for other in hashes)
            hashes.append(digest)
            destination = target_dir / f"{args.artist}_{len(rows):03d}_{hashlib.sha1(str(path).encode()).hexdigest()[:6]}{path.suffix.lower()}"
            image.save(destination, quality=95, subsampling=0)
            rows.append(
                {
                    "file": str(destination),
                    "source": str(path),
                    "artist": args.artist,
                    "style": args.style,
                    "batch": batch,
                    "width": width,
                    "height": height,
                    "sharpness": round(sharpness(image), 2),
                    "near_duplicate": duplicate,
                    "dhash": digest,
                }
            )
    manifest = target_dir / "batch_manifest.jsonl"
    manifest.write_text("\n".join(json.dumps(row, ensure_ascii=False) for row in rows) + "\n", encoding="utf-8")
    make_sheet(rows, target_dir / "batch_sheet.png")
    print(json.dumps({"batch": batch, "count": len(rows), "duplicates": sum(1 for r in rows if r["near_duplicate"]), "dir": str(target_dir)}, ensure_ascii=False))


def make_sheet(rows: list[dict], destination: Path, thumb: int = 180) -> None:
    if not rows:
        return
    columns = 6
    cell = thumb + 8
    sheet = Image.new("RGB", (columns * cell, ((len(rows) + columns - 1) // columns) * cell), (16, 18, 16))
    for index, row in enumerate(rows):
        image = Image.open(row["file"]).convert("RGB")
        image.thumbnail((thumb, thumb), Image.Resampling.LANCZOS)
        x = (index % columns) * cell + 4
        y = (index // columns) * cell + 4
        sheet.paste(image, (x, y))
    sheet.save(destination)


if __name__ == "__main__":
    main()
