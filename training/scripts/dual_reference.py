#!/usr/bin/env python3
"""Dual-reference test: pool composition + Cheshire character reference + 2.5D style LoRA."""
from __future__ import annotations

import time
from pathlib import Path

import requests

SERVER = "http://127.0.0.1:8188"
ROOT = Path(r"F:\DSH WORKSPACE\lumen-flow")
OUT = ROOT / "training" / "output" / "dual-reference"
OUT.mkdir(parents=True, exist_ok=True)


def upload(path: Path, name: str, mime: str) -> str:
    with path.open("rb") as handle:
        response = requests.post(
            f"{SERVER}/upload/image",
            files={"image": (name, handle, mime)},
            data={"overwrite": "true", "type": "input"},
            timeout=60,
        )
    response.raise_for_status()
    return response.json()["name"]


def main() -> None:
    composition = upload(ROOT / "reference-poolside-ardan.jpg", "composition-pool.jpg", "image/jpeg")
    character = upload(ROOT / "references" / "canonical" / "cheshire-canonical.png", "character-cheshire.png", "image/png")
    prompt = {
        "1": {"class_type": "UNETLoader", "inputs": {"unet_name": "Anima-2.9B-preview-v1.safetensors", "weight_dtype": "default"}},
        "2": {"class_type": "CLIPLoader", "inputs": {"clip_name": "qwen_3_06b_base.safetensors", "type": "stable_diffusion", "device": "default"}},
        "3": {"class_type": "VAELoader", "inputs": {"vae_name": "qwen_image_vae.safetensors"}},
        "4": {"class_type": "CLIPTextEncode", "inputs": {"text": "masterpiece, best quality, score_7, safe, 1girl, solo, cheshire (azur lane), azur lane, black hair, blue highlights, blue eyes, fake animal ears, maid headdress, target_25d_style, 2.5D anime, semi-realistic anime, soft airbrushed shading, glossy skin, white bikini, open white shirt, sitting on pool edge, poolside, night, city lights bokeh, water reflections, wet skin, detailed hands", "clip": ["2", 0]}},
        "5": {"class_type": "CLIPTextEncode", "inputs": {"text": "brown hair, green eyes, horse ears, horse tail, tail, cat tail, animal tail, real animal ears, mejiro ardan, umamusume, flat cel shading, harsh outlines, plastic skin, lowres, bad anatomy, bad hands, extra fingers, text, watermark, 3D render, CGI", "clip": ["2", 0]}},
        "6": {"class_type": "LoadImage", "inputs": {"image": composition}},
        "7": {"class_type": "ImageScale", "inputs": {"image": ["6", 0], "upscale_method": "lanczos", "width": 768, "height": 1024, "crop": "center"}},
        "8": {"class_type": "VAEEncode", "inputs": {"pixels": ["7", 0], "vae": ["3", 0]}},
        "9": {"class_type": "LoraLoaderModelOnly", "inputs": {"model": ["1", 0], "lora_name": "25d_anima_v5.safetensors", "strength_model": 0.45}},
        "10": {"class_type": "LoadImage", "inputs": {"image": character}},
        "11": {"class_type": "AnimaRefAdapter", "inputs": {"model": ["9", 0], "vae": ["3", 0], "image": ["10", 0], "lora_name": "anima_ref_adapter_v2_r64.safetensors", "ref_guidance": 5, "correction": "apg", "strength": 1, "ref_end": 0.9, "ref_megapixels": 1}},
        "12": {"class_type": "KSampler", "inputs": {"model": ["11", 0], "positive": ["4", 0], "negative": ["5", 0], "latent_image": ["8", 0], "seed": 20279001, "steps": 30, "cfg": 3.5, "sampler_name": "er_sde", "scheduler": "simple", "denoise": 0.5}},
        "13": {"class_type": "VAEDecode", "inputs": {"samples": ["12", 0], "vae": ["3", 0]}},
        "14": {"class_type": "SaveImage", "inputs": {"images": ["13", 0], "filename_prefix": "dual-ref"}},
    }
    response = requests.post(f"{SERVER}/prompt", json={"prompt": prompt}, timeout=60)
    response.raise_for_status()
    prompt_id = response.json()["prompt_id"]
    deadline = time.time() + 900
    result = None
    while time.time() < deadline:
        data = requests.get(f"{SERVER}/history/{prompt_id}", timeout=30).json()
        if prompt_id in data:
            result = data[prompt_id]
            break
        time.sleep(2)
    if not result:
        raise TimeoutError(prompt_id)
    image = next(iter(result["outputs"].values()))["images"][0]
    response = requests.get(f"{SERVER}/view", params=image, timeout=120)
    response.raise_for_status()
    target = OUT / "cheshire-dual-ref.png"
    target.write_bytes(response.content)
    print("saved", target)


if __name__ == "__main__":
    main()
