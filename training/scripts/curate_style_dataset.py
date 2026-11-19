#!/usr/bin/env python3
"""Curate a local style dataset for LoRA training.

No network access. Drop images into training/inbox/<style_label>/ and run:

  python training/scripts/curate_style_dataset.py

Labels:
  galgame_3d       galgame / 3DCG semi-realistic
  2_5d_semi        painterly 2.5D
  flat_cel         clean cel / anime
  oil_photoreal    oil painting or photoreal (not used for galgame LoRA)

Outputs:
  training/dataset/images/<label>/*.jpg
  training/dataset/manifest.jsonl
  training/dataset/rejects.jsonl
  training/dataset/contact_sheet.png
"""
from __future__ import annotations

import argparse
import hashlib
import json
import shutil
from collections import Counter, defaultdict
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageStat

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_INBOX = ROOT / "training" / "inbox"
DEFAULT_OUT = ROOT / "training" / "dataset"
VALID_LABELS = {"galgame_3d", "2_5d_semi", "flat_cel", "oil_photoreal"}
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}


def dhash(image: Image.Image, size: int = 8) -> str:
    gray = image.convert("L").resize((size + 1, size), Image.Resampling.LANCZOS)
    arr = np.asarray(gray, dtype=np.int16)
    bits = (arr[:, 1:] > arr[:, :-1]).flatten()
    value = 0
    for bit in bits:
        value = (value << 1) | int(bit)
    return f"{value:016x}"


def hamming(left: str, right: str) -> int:
    return (int(left, 16) ^ int(right, 16)).bit_count()


def sharpness(image: Image.Image) -> float:
    gray = image.convert("L")
    edges = gray.filter(ImageFilter.FIND_EDGES)
    return float(ImageStat.Stat(edges).mean[0])


def brightness(image: Image.Image) -> float:
    return float(ImageStat.Stat(image.convert("L")).mean[0])


def normalize_label(value: str) -> str:
    key = value.strip().lower().replace("-", "_").replace(" ", "_")
    aliases = {
        "gal": "galgame_3d",
        "galgame": "galgame_3d",
        "3dcg": "galgame_3d",
        "galgame3d": "galgame_3d",
        "2.5d": "2_5d_semi",
        "2_5d": "2_5d_semi",
        "25d": "2_5d_semi",
        "cel": "flat_cel",
        "flat": "flat_cel",
        "oil": "oil_photoreal",
        "photoreal": "oil_photoreal",
    }
    return aliases.get(key, key)


def iter_images(source: Path) -> list[tuple[Path, str]]:
    found: list[tuple[Path, str]] = []
    ignored = {"batch_sheet.png", "contact_sheet.png", "sheet.png"}
    for path in source.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in IMAGE_EXTS:
            continue
        if path.name.lower() in ignored or path.name.lower().endswith("_sheet.png"):
            continue
        label = "unlabeled"
        for parent in path.parents:
            candidate = normalize_label(parent.name)
            if candidate in VALID_LABELS:
                label = candidate
                break
        found.append((path, label))
    return sorted(found)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, default=DEFAULT_INBOX)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--min-side", type=int, default=512)
    parser.add_argument("--min-sharpness", type=float, default=6.0)
    parser.add_argument("--max-hamming", type=int, default=6)
    args = parser.parse_args()

    image_dir = args.out / "images"
    image_dir.mkdir(parents=True, exist_ok=True)
    manifest_path = args.out / "manifest.jsonl"
    reject_path = args.out / "rejects.jsonl"
    accepted: list[dict] = []
    rejected: list[dict] = []
    hashes: list[str] = []
    counts: Counter[str] = Counter()

    for path, label in iter_images(args.source):
        reason = ""
        try:
            with Image.open(path) as raw:
                image = raw.convert("RGB")
                width, height = image.size
                if min(width, height) < args.min_side:
                    reason = f"side<{args.min_side}"
                elif max(width, height) / max(1, min(width, height)) > 3.0:
                    reason = "extreme_aspect"
                elif sharpness(image) < args.min_sharpness:
                    reason = "blurry"
                digest = dhash(image)
                if not reason and any(hamming(digest, other) <= args.max_hamming for other in hashes):
                    reason = "near_duplicate"
                if reason:
                    rejected.append({"source": str(path), "label": label, "reason": reason})
                    continue
                hashes.append(digest)
                target = image_dir / label / f"{label}_{len(accepted):04d}_{hashlib.sha1(str(path).encode()).hexdigest()[:8]}.jpg"
                target.parent.mkdir(parents=True, exist_ok=True)
                image.save(target, quality=95, subsampling=0)
                accepted.append(
                    {
                        "file": str(target),
                        "source": str(path),
                        "label": label,
                        "width": width,
                        "height": height,
                        "sharpness": round(sharpness(image), 2),
                        "brightness": round(brightness(image), 1),
                        "dhash": digest,
                    }
                )
                counts[label] += 1
        except Exception as error:  # noqa: BLE001
            rejected.append({"source": str(path), "label": label, "reason": f"error:{error}"})

    with manifest_path.open("w", encoding="utf-8") as handle:
        for row in accepted:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")
    with reject_path.open("w", encoding="utf-8") as handle:
        for row in rejected:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")

    make_contact_sheet(accepted, args.out / "contact_sheet.png")
    print(json.dumps({"accepted": len(accepted), "rejected": len(rejected), "labels": counts}, ensure_ascii=False))


def make_contact_sheet(rows: list[dict], destination: Path, thumb: int = 180) -> None:
    if not rows:
        return
    columns = 6
    cell = thumb + 8
    header = 20
    rows_count = (len(rows) + columns - 1) // columns
    sheet = Image.new("RGB", (columns * cell, rows_count * (cell + header)), (16, 18, 16))
    draw = ImageDraw.Draw(sheet)
    for index, row in enumerate(rows):
        image = Image.open(row["file"]).convert("RGB")
        image.thumbnail((thumb, thumb), Image.Resampling.LANCZOS)
        x = (index % columns) * cell + 4
        y = (index // columns) * (cell + header) + 4
        sheet.paste(image, (x, y))
        draw.text((x, y + thumb + 3), row["label"][:24], fill=(210, 255, 120))
    sheet.save(destination)


if __name__ == "__main__":
    main()
