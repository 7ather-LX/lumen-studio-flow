#!/usr/bin/env python3
"""Zero-shot CLIP classification for the Bilibili image library.

This is intentionally local-only: it reads images on disk and writes labels.
"""
from __future__ import annotations

import json
import os
from pathlib import Path

os.environ.setdefault("HF_HOME", r"F:\DSH WORKSPACE\.hf")
os.environ.setdefault("HF_ENDPOINT", "https://hf-mirror.com")

import torch
from PIL import Image
from transformers import CLIPModel, CLIPProcessor

ROOT = Path(r"F:\DSH WORKSPACE\lumen-flow")
CRAWL = ROOT / "training" / "_crawl" / "bilibili"
LIB = ROOT / "training" / "bilibili_library.json"
OUT = ROOT / "training" / "bilibili_clip.json"

STYLE_PROMPTS = [
    "flat cel shaded anime illustration, clean line art, 2D anime, crisp shadows",
    "2.5D semi-realistic anime illustration, soft gradients, painterly skin, cinematic",
    "moe anime illustration, cute stylized, pastel colors, glossy highlights",
    "3D game CG render, realistic 3D character, volumetric lighting",
    "black and white manga page, screentone, comic panel",
]
STYLE_NAMES = ["flat_cel", "2_5d_semi", "moe_2d", "cg_3d", "manga"]
SAFETY_PROMPTS = [
    "safe anime illustration, fully clothed, non-explicit",
    "explicit adult content, nudity, genitals",
]
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"


def main() -> None:
    model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32", use_safetensors=True).to(DEVICE).eval()
    processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
    text = processor(text=STYLE_PROMPTS, return_tensors="pt", padding=True).to(DEVICE)
    safety = processor(text=SAFETY_PROMPTS, return_tensors="pt", padding=True).to(DEVICE)
    with torch.no_grad():
        text_features = model.get_text_features(**text)
        if hasattr(text_features, "pooler_output"):
            text_features = text_features.pooler_output
        text_features = text_features / text_features.norm(dim=-1, keepdim=True)
        safety_features = model.get_text_features(**safety)
        if hasattr(safety_features, "pooler_output"):
            safety_features = safety_features.pooler_output
        safety_features = safety_features / safety_features.norm(dim=-1, keepdim=True)

    files = sorted(CRAWL.rglob("*"))
    files = [p for p in files if p.is_file() and p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp", ".avif"}]
    print("images", len(files), "device", DEVICE)
    rows = []
    batch_size = 16
    for start in range(0, len(files), batch_size):
        batch = files[start:start + batch_size]
        images = []
        valid = []
        for path in batch:
            try:
                image = Image.open(path).convert("RGB")
                images.append(image)
                valid.append(path)
            except Exception:
                continue
        if not images:
            continue
        inputs = processor(images=images, return_tensors="pt").to(DEVICE)
        with torch.no_grad():
            features = model.get_image_features(**inputs)
            if hasattr(features, "pooler_output"):
                features = features.pooler_output
            features = features / features.norm(dim=-1, keepdim=True)
            style_scores = (features @ text_features.T).softmax(dim=-1)
            safety_scores = (features @ safety_features.T).softmax(dim=-1)
        for index, path in enumerate(valid):
            scores = style_scores[index].detach().cpu()
            safety_value = safety_scores[index, 1].item()
            best = int(scores.argmax())
            rows.append({
                "file": str(path),
                "style": STYLE_NAMES[best],
                "style_confidence": round(float(scores[best]), 4),
                "style_scores": {name: round(float(scores[i]), 4) for i, name in enumerate(STYLE_NAMES)},
                "explicit_score": round(safety_value, 4),
            })
        if (start // batch_size) % 10 == 0:
            print("processed", min(start + batch_size, len(files)), "/", len(files))
    OUT.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")

    by_file = {row["file"]: row for row in rows}
    library = json.loads(LIB.read_text(encoding="utf-8"))
    for row in library["images"]:
        clip = by_file.get(row.get("file"))
        if clip:
            row["clip_style"] = clip["style"]
            row["clip_confidence"] = clip["style_confidence"]
            row["explicit_score"] = clip["explicit_score"]
    library["clip_classified"] = len(rows)
    library["clip_styles"] = {}
    for row in rows:
        library["clip_styles"][row["style"]] = library["clip_styles"].get(row["style"], 0) + 1
    LIB.write_text(json.dumps(library, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"classified": len(rows), "styles": library["clip_styles"]}, ensure_ascii=False))


if __name__ == "__main__":
    main()
