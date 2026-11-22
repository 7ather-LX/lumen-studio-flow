#!/usr/bin/env python3
"""Create a canonical-tag Cheshire character reference for RefAdapter tests."""
from __future__ import annotations

import time
from pathlib import Path

import requests

SERVER = "http://127.0.0.1:8188"
ROOT = Path(r"F:\DSH WORKSPACE\lumen-flow")
OUT = ROOT / "references" / "canonical"
OUT.mkdir(parents=True, exist_ok=True)
POS = (
    "masterpiece, best quality, score_7, safe, 1girl, solo, cheshire (azur lane), azur lane, "
    "maid, maid headdress, fake animal ears, cat-ear headdress, folded headdress, "
    "black hair, aqua hair, blue hair, streaked hair, two-tone hair, short hair, "
    "aqua eyes, blue eyes, large breasts, upper body, looking at viewer, "
    "white background, official character reference, clean lineart, flat colors"
)
NEG = (
    "real cat ears, animal ears, horse ears, brown hair, silver hair, white hair, "
    "extra ears, lowres, bad anatomy, text, watermark, 3D render, CGI"
)


def build(seed: int) -> dict:
    return {
        "1": {"class_type": "UNETLoader", "inputs": {"unet_name": "Anima-2.9B-preview-v1.safetensors", "weight_dtype": "default"}},
        "2": {"class_type": "CLIPLoader", "inputs": {"clip_name": "qwen_3_06b_base.safetensors", "type": "stable_diffusion", "device": "default"}},
        "3": {"class_type": "VAELoader", "inputs": {"vae_name": "qwen_image_vae.safetensors"}},
        "4": {"class_type": "CLIPTextEncode", "inputs": {"text": POS, "clip": ["2", 0]}},
        "5": {"class_type": "CLIPTextEncode", "inputs": {"text": NEG, "clip": ["2", 0]}},
        "6": {"class_type": "EmptyLatentImage", "inputs": {"width": 512, "height": 768, "batch_size": 1}},
        "7": {"class_type": "KSampler", "inputs": {"model": ["1", 0], "positive": ["4", 0], "negative": ["5", 0], "latent_image": ["6", 0], "seed": seed, "steps": 24, "cfg": 4, "sampler_name": "er_sde", "scheduler": "simple", "denoise": 1}},
        "8": {"class_type": "VAEDecode", "inputs": {"samples": ["7", 0], "vae": ["3", 0]}},
        "9": {"class_type": "SaveImage", "inputs": {"images": ["8", 0], "filename_prefix": "canonical-cheshire"}},
    }


def main() -> None:
    for i, seed in enumerate((20280001, 20280002, 20280003, 20280004), 1):
        r = requests.post(f"{SERVER}/prompt", json={"prompt": build(seed)}, timeout=60)
        r.raise_for_status()
        pid = r.json()["prompt_id"]
        deadline = time.time() + 300
        result = None
        while time.time() < deadline:
            data = requests.get(f"{SERVER}/history/{pid}", timeout=30).json()
            if pid in data:
                result = data[pid]
                break
            time.sleep(2)
        image = next(iter(result["outputs"].values()))["images"][0]
        response = requests.get(f"{SERVER}/view", params=image, timeout=120)
        response.raise_for_status()
        target = OUT / f"canonical-cheshire-{i}.png"
        target.write_bytes(response.content)
        print(target)


if __name__ == "__main__":
    main()
