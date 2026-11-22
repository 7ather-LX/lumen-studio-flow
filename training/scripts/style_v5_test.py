#!/usr/bin/env python3
"""Style-preserving reference test for the new target-2.5D style LoRA."""
from __future__ import annotations

import time
from pathlib import Path

import requests

SERVER = "http://127.0.0.1:8188"
ROOT = Path(r"F:\DSH WORKSPACE\lumen-flow")
SOURCE = ROOT / "reference-poolside-ardan.jpg"
OUT = ROOT / "training" / "output" / "style-v5"
OUT.mkdir(parents=True, exist_ok=True)
POS = (
    "masterpiece, best quality, score_7, safe, 1girl, solo, cheshire (azur lane), azur lane, "
    "black hair, streaked hair, blue highlights, short hair, blue eyes, fake animal ears, maid headdress, "
    "target_25d_style, 2.5D anime, semi-realistic anime, soft airbrushed shading, glossy skin, "
    "detailed eyes, detailed hair, cinematic lighting, clean soft lineart, white bikini, open white shirt, "
    "sitting on pool edge, poolside, night, city lights bokeh, water reflections, wet skin, detailed hands"
)
NEG = (
    "brown hair, green eyes, horse ears, horse tail, mejiro ardan, umamusume, flat cel shading, "
    "harsh outlines, plastic skin, oversaturated, lowres, bad anatomy, bad hands, extra fingers, "
    "text, watermark, 3D render, CGI"
)


def upload() -> str:
    with SOURCE.open("rb") as handle:
        response = requests.post(
            f"{SERVER}/upload/image",
            files={"image": ("reference-poolside-ardan.jpg", handle, "image/jpeg")},
            data={"overwrite": "true", "type": "input"},
            timeout=60,
        )
    response.raise_for_status()
    return response.json()["name"]


def build(image_name: str, lora: str, strength: float, hires: bool) -> dict:
    nodes = {
        "1": {"class_type": "UNETLoader", "inputs": {"unet_name": "Anima-2.9B-preview-v1.safetensors", "weight_dtype": "default"}},
        "2": {"class_type": "CLIPLoader", "inputs": {"clip_name": "qwen_3_06b_base.safetensors", "type": "stable_diffusion", "device": "default"}},
        "3": {"class_type": "VAELoader", "inputs": {"vae_name": "qwen_image_vae.safetensors"}},
        "4": {"class_type": "CLIPTextEncode", "inputs": {"text": POS, "clip": ["2", 0]}},
        "5": {"class_type": "CLIPTextEncode", "inputs": {"text": NEG, "clip": ["2", 0]}},
        "6": {"class_type": "LoadImage", "inputs": {"image": image_name}},
        "7": {"class_type": "ImageScale", "inputs": {"image": ["6", 0], "upscale_method": "lanczos", "width": 768, "height": 1024, "crop": "center"}},
        "8": {"class_type": "VAEEncode", "inputs": {"pixels": ["7", 0], "vae": ["3", 0]}},
        "9": {"class_type": "LoraLoaderModelOnly", "inputs": {"model": ["1", 0], "lora_name": lora, "strength_model": strength}},
        "10": {"class_type": "KSampler", "inputs": {"model": ["9", 0], "positive": ["4", 0], "negative": ["5", 0], "latent_image": ["8", 0], "seed": 20278001, "steps": 30, "cfg": 3.5, "sampler_name": "er_sde", "scheduler": "simple", "denoise": 0.5}},
        "11": {"class_type": "VAEDecode", "inputs": {"samples": ["10", 0], "vae": ["3", 0]}},
        "12": {"class_type": "SaveImage", "inputs": {"images": ["11", 0], "filename_prefix": "style-base"}},
    }
    if hires:
        nodes["20"] = {"class_type": "LatentUpscaleBy", "inputs": {"samples": ["10", 0], "upscale_method": "bicubic", "scale_by": 1.25}}
        nodes["21"] = {"class_type": "KSampler", "inputs": {"model": ["9", 0], "positive": ["4", 0], "negative": ["5", 0], "latent_image": ["20", 0], "seed": 20278001, "steps": 12, "cfg": 3.5, "sampler_name": "er_sde", "scheduler": "simple", "denoise": 0.28}}
        nodes["22"] = {"class_type": "VAEDecode", "inputs": {"samples": ["21", 0], "vae": ["3", 0]}}
        nodes["12"]["inputs"]["images"] = ["22", 0]
    return nodes


def run(name: str, lora: str, strength: float, hires: bool) -> None:
    image_name = upload()
    response = requests.post(f"{SERVER}/prompt", json={"prompt": build(image_name, lora, strength, hires)}, timeout=60)
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
    target = OUT / f"{name}.png"
    target.write_bytes(response.content)
    print("saved", target)


def main() -> None:
    run("25d-v4-base", "25d_anima_v4.safetensors", 0.45, False)
    run("25d-v5-base", "25d_anima_v5.safetensors", 0.45, False)
    run("25d-v5-hires", "25d_anima_v5.safetensors", 0.45, True)


if __name__ == "__main__":
    main()
