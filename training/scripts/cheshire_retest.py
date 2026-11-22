#!/usr/bin/env python3
"""Three-seed Cheshire retest: complex character ref, pool composition, no style flattening."""
from __future__ import annotations

import time
from pathlib import Path

import requests

SERVER = "http://127.0.0.1:8188"
ROOT = Path(r"F:\DSH WORKSPACE\lumen-flow")
OUT = ROOT / "training" / "output" / "cheshire-retest"
OUT.mkdir(parents=True, exist_ok=True)
POS = (
    "masterpiece, best quality, score_7, safe, 1girl, solo, cheshire (azur lane), azur lane, "
    "black hair, aqua hair, blue hair, streaked hair, two-tone hair, short hair, aqua eyes, blue eyes, "
    "cat-ear headdress, fake animal ears, maid headdress, target_25d_style, 2.5D anime, "
    "semi-realistic anime, soft airbrushed shading, glossy skin, detailed eyes, detailed hair, "
    "cinematic lighting, white bikini, open white shirt, sitting on pool edge, poolside, night, "
    "city lights bokeh, water reflections, wet skin, detailed hands"
)
NEG = (
    "hat, cap, beret, top hat, black hat, sunglasses, eyewear, goggles, real cat ears, animal ears, "
    "horse ears, brown hair, green eyes, mejiro ardan, umamusume, flat cel shading, harsh outlines, "
    "plastic skin, lowres, bad anatomy, bad hands, extra fingers, text, watermark, 3D render, CGI"
)


def upload(path: Path, name: str, mime: str) -> str:
    with path.open("rb") as handle:
        r = requests.post(f"{SERVER}/upload/image", files={"image": (name, handle, mime)}, data={"overwrite": "true", "type": "input"}, timeout=60)
    r.raise_for_status()
    return r.json()["name"]


def build(comp: str, char: str, seed: int) -> dict:
    return {
        "1": {"class_type": "UNETLoader", "inputs": {"unet_name": "Anima-2.9B-preview-v1.safetensors", "weight_dtype": "default"}},
        "2": {"class_type": "CLIPLoader", "inputs": {"clip_name": "qwen_3_06b_base.safetensors", "type": "stable_diffusion", "device": "default"}},
        "3": {"class_type": "VAELoader", "inputs": {"vae_name": "qwen_image_vae.safetensors"}},
        "4": {"class_type": "CLIPTextEncode", "inputs": {"text": POS, "clip": ["2", 0]}},
        "5": {"class_type": "CLIPTextEncode", "inputs": {"text": NEG, "clip": ["2", 0]}},
        "6": {"class_type": "LoadImage", "inputs": {"image": comp}},
        "7": {"class_type": "ImageScale", "inputs": {"image": ["6", 0], "upscale_method": "lanczos", "width": 768, "height": 1024, "crop": "center"}},
        "8": {"class_type": "VAEEncode", "inputs": {"pixels": ["7", 0], "vae": ["3", 0]}},
        "9": {"class_type": "LoadImage", "inputs": {"image": char}},
        "10": {"class_type": "AnimaRefAdapter", "inputs": {"model": ["1", 0], "vae": ["3", 0], "image": ["9", 0], "lora_name": "anima_ref_adapter_v2_r64.safetensors", "ref_guidance": 5.5, "correction": "apg", "strength": 1, "ref_end": 0.9, "ref_megapixels": 1}},
        "11": {"class_type": "KSampler", "inputs": {"model": ["10", 0], "positive": ["4", 0], "negative": ["5", 0], "latent_image": ["8", 0], "seed": seed, "steps": 30, "cfg": 3.5, "sampler_name": "er_sde", "scheduler": "simple", "denoise": 0.5}},
        "12": {"class_type": "VAEDecode", "inputs": {"samples": ["11", 0], "vae": ["3", 0]}},
        "13": {"class_type": "SaveImage", "inputs": {"images": ["12", 0], "filename_prefix": "cheshire-retest"}},
    }


def main() -> None:
    comp = upload(ROOT / "reference-poolside-ardan.jpg", "pool-composition.jpg", "image/jpeg")
    char = upload(ROOT / "references" / "canonical" / "zero-cheshire-2.png", "cheshire-complex.png", "image/png")
    for i, seed in enumerate((20282001, 20282002, 20282003), 1):
        r = requests.post(f"{SERVER}/prompt", json={"prompt": build(comp, char, seed)}, timeout=60)
        r.raise_for_status()
        pid = r.json()["prompt_id"]
        deadline = time.time() + 900
        result = None
        while time.time() < deadline:
            data = requests.get(f"{SERVER}/history/{pid}", timeout=30).json()
            if pid in data:
                result = data[pid]
                break
            time.sleep(2)
        if not result:
            raise TimeoutError(pid)
        image = next(iter(result["outputs"].values()))["images"][0]
        response = requests.get(f"{SERVER}/view", params=image, timeout=120)
        response.raise_for_status()
        target = OUT / f"cheshire-{i}.png"
        target.write_bytes(response.content)
        print(target)


if __name__ == "__main__":
    main()
