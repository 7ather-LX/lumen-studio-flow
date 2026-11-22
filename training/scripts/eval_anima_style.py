#!/usr/bin/env python3
"""Fixed-seed Anima LoRA consistency smoke test.

Run with the training venv:
  .venv-train\Scripts\python.exe training\scripts\eval_anima_style.py \
    --lora models/loras/ririko_anima_v2.safetensors --trigger ririko_cel_style
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
KOHYA = Path(r"F:\DSH WORKSPACE\kohya-src\kohya-ss-sd-scripts-cb70b96")
OUT = ROOT / "training" / "eval" / "anima"
SCENES = {
    "bed": "lying on bed, on back, head on pillow, bedroom, night, warm lamp light",
    "pool": "white bikini, sitting on pool edge, poolside, night, city lights bokeh",
    "cafe": "white blouse, sitting at cafe table, indoors, window, day",
    "street": "black coat, standing on city street, night, neon reflections",
}
BASE = (
    "masterpiece, best quality, score_7, safe, 1girl, solo, cheshire (azur lane), "
    "azur lane, black hair, streaked hair, blue highlights, short hair, blue eyes, "
    "fake animal ears, maid headdress"
)


def dhash(image: Image.Image, size: int = 8) -> str:
    gray = image.convert("L").resize((size + 1, size), Image.Resampling.LANCZOS)
    arr = np.asarray(gray, dtype=np.int16)
    value = 0
    for bit in (arr[:, 1:] > arr[:, :-1]).flatten():
        value = (value << 1) | int(bit)
    return f"{value:016x}"


def distance(a: str, b: str) -> int:
    return (int(a, 16) ^ int(b, 16)).bit_count()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--lora", required=True)
    parser.add_argument("--trigger", required=True)
    parser.add_argument("--name", default="anima_lora")
    parser.add_argument("--steps", type=int, default=16)
    parser.add_argument("--seed", type=int, default=20261119)
    args = parser.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    rows = []
    for scene, scene_prompt in SCENES.items():
        target = OUT / f"{args.name}_{scene}.png"
        prompt = f"{BASE}, {args.trigger}, {scene_prompt}"
        command = [
            sys.executable,
            str(KOHYA / "anima_minimal_inference.py"),
            "--dit", str(ROOT / "models" / "diffusion_models" / "anima-base-v1.0.safetensors"),
            "--text_encoder", str(ROOT / "models" / "text_encoders" / "qwen_3_06b_base.safetensors"),
            "--vae", str(ROOT / "models" / "vae" / "qwen_image_vae.safetensors"),
            "--lora_weight", str(ROOT / args.lora),
            "--lora_multiplier", "0.75",
            "--prompt", prompt,
            "--negative_prompt", "white hair, silver hair, lowres, bad anatomy, bad hands, missing toes, text, watermark",
            "--image_size", "512", "768",
            "--infer_steps", str(args.steps),
            "--save_path", str(OUT / "raw" / scene),
            "--seed", str(args.seed),
        ]
        subprocess.run(command, check=True, cwd=KOHYA)
        candidates = sorted((OUT / "raw" / scene).rglob("*.png"), key=lambda path: path.stat().st_mtime)
        if not candidates:
            continue
        image = Image.open(candidates[-1]).convert("RGB")
        image.save(target)
        rows.append({"scene": scene, "file": str(target), "dhash": dhash(image)})
    pairs = []
    for index, left in enumerate(rows):
        for right in rows[index + 1:]:
            pairs.append({"a": left["scene"], "b": right["scene"], "distance": distance(left["dhash"], right["dhash"])})
    report = {"lora": args.lora, "trigger": args.trigger, "seed": args.seed, "steps": args.steps, "images": rows, "pairwise": pairs}
    (OUT / f"{args.name}_report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    make_sheet(rows, OUT / f"{args.name}_sheet.png")
    print(json.dumps(report, ensure_ascii=False, indent=2))


def make_sheet(rows: list[dict], destination: Path, thumb: int = 220) -> None:
    if not rows:
        return
    sheet = Image.new("RGB", (thumb * len(rows), thumb + 24), (16, 18, 16))
    draw = ImageDraw.Draw(sheet)
    for index, row in enumerate(rows):
        image = Image.open(row["file"]).convert("RGB")
        image.thumbnail((thumb, thumb))
        sheet.paste(image, (index * thumb, 0))
        draw.text((index * thumb + 4, thumb + 4), row["scene"], fill=(210, 255, 120))
    sheet.save(destination)


if __name__ == "__main__":
    main()
