#!/usr/bin/env python3
"""Fixed-seed character consistency test through ComfyUI.

Generates the same character in several scenes with one seed and measures
perceptual similarity. This is not face-ID; it is a fast regression test.

Example:
  python training/scripts/eval_character_consistency.py --steps 8
"""
from __future__ import annotations

import argparse
import json
import time
from pathlib import Path

import numpy as np
import requests
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
BASE = "http://127.0.0.1:8188"
OUT = ROOT / "training" / "eval"

CHARACTER = (
    "1girl, solo, cheshire (azur lane), azur lane, black hair, blue highlights, "
    "streaked hair, short hair, blue eyes, fake animal ears, maid headdress"
)
STYLE = (
    "galgame 3d, 2.5D, semi-realistic anime, soft shading, glossy skin, "
    "detailed hair, soft lighting, clean rendering"
)
SCENES = {
    "bed": "maid, white apron, black dress, lying on bed, head on pillow, bedroom, night, lamp light",
    "pool": "white bikini, sitting on pool edge, poolside, night, city lights bokeh",
    "cafe": "white blouse, sitting at cafe table, indoors, window, day",
    "street": "black coat, standing on city street, night, neon reflections",
}
VIEWS = {
    "front": "front view, looking at viewer",
    "three_quarter": "three-quarter view, looking to the side",
    "side": "from side, profile",
    "above": "from above, looking up",
}
BED_SCENE = SCENES["bed"]
NEGATIVE = (
    "white hair, silver hair, oil painting, impasto, thick brush strokes, "
    "flat cel shading, lowres, bad anatomy, text, watermark"
)


def dhash(image: Image.Image, size: int = 8) -> str:
    gray = image.convert("L").resize((size + 1, size), Image.Resampling.LANCZOS)
    arr = np.asarray(gray, dtype=np.int16)
    value = 0
    for bit in (arr[:, 1:] > arr[:, :-1]).flatten():
        value = (value << 1) | int(bit)
    return f"{value:016x}"


def distance(left: str, right: str) -> int:
    return (int(left, 16) ^ int(right, 16)).bit_count()


def workflow(prompt: str, scene: str, seed: int, steps: int, width: int, height: int) -> dict:
    return {
        "1": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "MeinaMix-V10.safetensors"}},
        "10": {
            "class_type": "LoraLoader",
            "inputs": {
                "model": ["1", 0],
                "clip": ["1", 1],
                "lora_name": "make25d_type2_v100.safetensors",
                "strength_model": 0.55,
                "strength_clip": 0.55,
            },
        },
        "2": {"class_type": "CLIPTextEncode", "inputs": {"text": f"{prompt}, {scene}", "clip": ["10", 1]}},
        "3": {"class_type": "CLIPTextEncode", "inputs": {"text": NEGATIVE, "clip": ["10", 1]}},
        "4": {"class_type": "EmptyLatentImage", "inputs": {"width": width, "height": height, "batch_size": 1}},
        "5": {
            "class_type": "KSampler",
            "inputs": {
                "model": ["10", 0],
                "positive": ["2", 0],
                "negative": ["3", 0],
                "latent_image": ["4", 0],
                "seed": seed,
                "steps": steps,
                "cfg": 6,
                "sampler_name": "euler",
                "scheduler": "simple",
                "denoise": 1,
            },
        },
        "6": {"class_type": "VAEDecode", "inputs": {"samples": ["5", 0], "vae": ["1", 2]}},
        "7": {"class_type": "SaveImage", "inputs": {"images": ["6", 0], "filename_prefix": "LumenConsistency"}},
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--seed", type=int, default=20261119)
    parser.add_argument("--steps", type=int, default=8)
    parser.add_argument("--width", type=int, default=512)
    parser.add_argument("--height", type=int, default=768)
    parser.add_argument("--matrix", choices=["scenes", "views"], default="scenes")
    args = parser.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    session = requests.Session()
    session.trust_env = False
    prompt = f"masterpiece, best quality, score_7, safe, {CHARACTER}, {STYLE}"
    jobs = (
        {f"bed_{name}": f"{BED_SCENE}, {view}" for name, view in VIEWS.items()}
        if args.matrix == "views"
        else SCENES
    )
    results = []
    for name, scene in jobs.items():
        body = {"prompt": workflow(prompt, scene, args.seed, args.steps, args.width, args.height), "client_id": "consistency"}
        response = session.post(f"{BASE}/prompt", json=body, timeout=60)
        response.raise_for_status()
        prompt_id = response.json()["prompt_id"]
        for _ in range(600):
            time.sleep(1)
            history = session.get(f"{BASE}/history/{prompt_id}", timeout=30).json().get(prompt_id)
            if not history:
                continue
            for output in history.get("outputs", {}).values():
                for image in output.get("images", []):
                    content = session.get(
                        f"{BASE}/view",
                        params={"filename": image["filename"], "subfolder": image.get("subfolder", ""), "type": image.get("type", "output")},
                        timeout=60,
                    ).content
                    target = OUT / f"{name}.png"
                    target.write_bytes(content)
                    image_obj = Image.open(target).convert("RGB")
                    results.append({"scene": name, "file": str(target), "dhash": dhash(image_obj)})
            break
    tests = []
    for index, left in enumerate(results):
        for right in results[index + 1 :]:
            tests.append({"a": left["scene"], "b": right["scene"], "distance": distance(left["dhash"], right["dhash"])})
    report = {"seed": args.seed, "steps": args.steps, "images": results, "pairwise": tests}
    (OUT / "report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    make_sheet(results, OUT / "sheet.png")
    print(json.dumps(report, ensure_ascii=False, indent=2))


def make_sheet(results: list[dict], destination: Path, thumb: int = 220) -> None:
    if not results:
        return
    width = thumb * len(results)
    sheet = Image.new("RGB", (width, thumb + 24), (16, 18, 16))
    draw = ImageDraw.Draw(sheet)
    for index, row in enumerate(results):
        image = Image.open(row["file"]).convert("RGB")
        image.thumbnail((thumb, thumb))
        sheet.paste(image, (index * thumb, 0))
        draw.text((index * thumb + 4, thumb + 4), row["scene"], fill=(210, 255, 120))
    sheet.save(destination)


if __name__ == "__main__":
    main()
