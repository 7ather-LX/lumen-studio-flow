#!/usr/bin/env python3
"""Reference-driven img2img: keep the poolside composition, replace Ardan with Cheshire."""
from __future__ import annotations

import json
import time
from pathlib import Path

import requests
from PIL import Image

SERVER = "http://127.0.0.1:8188"
ROOT = Path(r"F:\DSH WORKSPACE\lumen-flow")
OUT = ROOT / "training" / "output" / "reference-transfer"
OUT.mkdir(parents=True, exist_ok=True)
SOURCE = ROOT / "reference-poolside-ardan.jpg"

POSITIVE = (
    "masterpiece, best quality, score_7, safe, 1girl, solo, "
    "cheshire (azur lane), azur lane, black hair, streaked hair, blue highlights, "
    "short hair, blue eyes, fake animal ears, maid headdress, "
    "white bikini, open white shirt, sitting on pool edge, poolside, night, "
    "city lights bokeh, water reflections, wet skin, wet hair, glossy skin, "
    "semi-realistic anime, 2.5D, soft shading, cinematic lighting, detailed skin, "
    "detailed hands"
)
NEGATIVE = (
    "brown hair, green eyes, horse ears, horse tail, mejiro ardan, umamusume, "
    "lowres, bad anatomy, bad hands, extra fingers, text, watermark, 3D render, CGI, "
    "deformed face, asymmetrical eyes"
)


def upload(path: Path, name: str) -> str:
    with path.open("rb") as handle:
        response = requests.post(
            f"{SERVER}/upload/image",
            files={"image": (name, handle, "image/jpeg")},
            data={"overwrite": "true", "type": "input"},
            timeout=60,
        )
    response.raise_for_status()
    return response.json()["name"]


def build(image_name: str, denoise: float, seed: int) -> dict:
    return {
        "1": {"class_type": "UNETLoader", "inputs": {"unet_name": "Anima-2.9B-preview-v1.safetensors", "weight_dtype": "default"}},
        "2": {"class_type": "CLIPLoader", "inputs": {"clip_name": "qwen_3_06b_base.safetensors", "type": "stable_diffusion", "device": "default"}},
        "3": {"class_type": "VAELoader", "inputs": {"vae_name": "qwen_image_vae.safetensors"}},
        "4": {"class_type": "CLIPTextEncode", "inputs": {"text": POSITIVE, "clip": ["2", 0]}},
        "5": {"class_type": "CLIPTextEncode", "inputs": {"text": NEGATIVE, "clip": ["2", 0]}},
        "6": {"class_type": "LoadImage", "inputs": {"image": image_name}},
        "7": {"class_type": "ImageScale", "inputs": {"image": ["6", 0], "upscale_method": "lanczos", "width": 768, "height": 1024, "crop": "center"}},
        "8": {"class_type": "VAEEncode", "inputs": {"pixels": ["7", 0], "vae": ["3", 0]}},
        "9": {"class_type": "LoraLoaderModelOnly", "inputs": {"model": ["1", 0], "lora_name": "25d_anima_v4.safetensors", "strength_model": 0.6}},
        "10": {"class_type": "KSampler", "inputs": {"model": ["9", 0], "positive": ["4", 0], "negative": ["5", 0], "latent_image": ["8", 0], "seed": seed, "steps": 30, "cfg": 4, "sampler_name": "er_sde", "scheduler": "simple", "denoise": denoise}},
        "11": {"class_type": "VAEDecode", "inputs": {"samples": ["10", 0], "vae": ["3", 0]}},
        "12": {"class_type": "SaveImage", "inputs": {"images": ["11", 0], "filename_prefix": "ref-transfer"}},
    }


def main() -> None:
    stamp = str(int(time.time()))
    image_name = upload(SOURCE, f"ardan-pool-ref-{stamp}.jpg")
    for label, denoise, seed in (("light", 0.38, 20274001), ("balance", 0.5, 20274002), ("strong", 0.62, 20274003)):
        response = requests.post(f"{SERVER}/prompt", json={"prompt": build(image_name, denoise, seed)}, timeout=60)
        response.raise_for_status()
        prompt_id = response.json()["prompt_id"]
        deadline = time.time() + 600
        result = None
        while time.time() < deadline:
            data = requests.get(f"{SERVER}/history/{prompt_id}", timeout=30).json()
            if prompt_id in data:
                result = data[prompt_id]
                break
            time.sleep(2)
        if not result:
            raise TimeoutError(prompt_id)
        node = next(iter(result["outputs"].values()))
        image = node["images"][0]
        response = requests.get(f"{SERVER}/view", params=image, timeout=120)
        response.raise_for_status()
        target = OUT / f"cheshire-ref-pool-{label}.png"
        target.write_bytes(response.content)
        print("saved", target, "denoise", denoise)


if __name__ == "__main__":
    main()
