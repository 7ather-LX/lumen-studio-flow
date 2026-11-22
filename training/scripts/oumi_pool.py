#!/usr/bin/env python3
"""Oumi poolside test: composition reference + Oumi character reference + target 2.5D."""
from __future__ import annotations

import time
from pathlib import Path

import requests

SERVER = "http://127.0.0.1:8188"
ROOT = Path(r"F:\DSH WORKSPACE\lumen-flow")
OUT = ROOT / "training" / "output" / "oumi-test"
OUT.mkdir(parents=True, exist_ok=True)
POS = (
    "masterpiece, best quality, score_7, safe, 1girl, solo, oumi (azur lane), azur lane, "
    "black hair, red eyes, fox ears, fox tail, target_25d_style, 2.5D anime, semi-realistic anime, "
    "soft airbrushed shading, glossy skin, detailed eyes, detailed hair, cinematic lighting, "
    "white bikini, open white shirt, sitting on pool edge, poolside, night, city lights bokeh, "
    "water reflections, wet skin, detailed hands"
)
NEG = (
    "sunglasses, eyewear, goggles, hat, cap, beret, top hat, cat ears, maid headdress, headdress, brown hair, blue eyes, cheshire (azur lane), "
    "mejiro ardan, horse ears, horse tail, flat cel shading, harsh outlines, plastic skin, "
    "lowres, bad anatomy, bad hands, extra fingers, text, watermark, 3D render, CGI"
)


def upload(path: Path, name: str, mime: str) -> str:
    with path.open("rb") as handle:
        r = requests.post(
            f"{SERVER}/upload/image",
            files={"image": (name, handle, mime)},
            data={"overwrite": "true", "type": "input"},
            timeout=60,
        )
    r.raise_for_status()
    return r.json()["name"]


def build(comp: str, char: str, seed: int, hires: bool = False) -> dict:
    nodes = {
        "1": {"class_type": "UNETLoader", "inputs": {"unet_name": "Anima-2.9B-preview-v1.safetensors", "weight_dtype": "default"}},
        "2": {"class_type": "CLIPLoader", "inputs": {"clip_name": "qwen_3_06b_base.safetensors", "type": "stable_diffusion", "device": "default"}},
        "3": {"class_type": "VAELoader", "inputs": {"vae_name": "qwen_image_vae.safetensors"}},
        "4": {"class_type": "CLIPTextEncode", "inputs": {"text": POS, "clip": ["2", 0]}},
        "5": {"class_type": "CLIPTextEncode", "inputs": {"text": NEG, "clip": ["2", 0]}},
        "6": {"class_type": "LoadImage", "inputs": {"image": comp}},
        "7": {"class_type": "ImageScale", "inputs": {"image": ["6", 0], "upscale_method": "lanczos", "width": 768, "height": 1024, "crop": "center"}},
        "8": {"class_type": "VAEEncode", "inputs": {"pixels": ["7", 0], "vae": ["3", 0]}},
        "9": {"class_type": "LoraLoaderModelOnly", "inputs": {"model": ["1", 0], "lora_name": "25d_anima_v5.safetensors", "strength_model": 0.0}},
        "10": {"class_type": "LoadImage", "inputs": {"image": char}},
        "11": {"class_type": "AnimaRefAdapter", "inputs": {"model": ["9", 0], "vae": ["3", 0], "image": ["10", 0], "lora_name": "anima_ref_adapter_v2_r64.safetensors", "ref_guidance": 5.5, "correction": "apg", "strength": 1, "ref_end": 0.9, "ref_megapixels": 1}},
        "12": {"class_type": "KSampler", "inputs": {"model": ["11", 0], "positive": ["4", 0], "negative": ["5", 0], "latent_image": ["8", 0], "seed": seed, "steps": 30, "cfg": 3.5, "sampler_name": "er_sde", "scheduler": "simple", "denoise": 0.5}},
        "13": {"class_type": "VAEDecode", "inputs": {"samples": ["12", 0], "vae": ["3", 0]}},
        "14": {"class_type": "SaveImage", "inputs": {"images": ["13", 0], "filename_prefix": "oumi-nostyle"}},
    }
    if hires:
        nodes["20"] = {"class_type": "LatentUpscaleBy", "inputs": {"samples": ["12", 0], "upscale_method": "bicubic", "scale_by": 1.15}}
        nodes["21"] = {"class_type": "KSampler", "inputs": {"model": ["11", 0], "positive": ["4", 0], "negative": ["5", 0], "latent_image": ["20", 0], "seed": seed, "steps": 10, "cfg": 3.5, "sampler_name": "er_sde", "scheduler": "simple", "denoise": 0.25}}
        nodes["22"] = {"class_type": "VAEDecode", "inputs": {"samples": ["21", 0], "vae": ["3", 0]}}
        nodes["14"]["inputs"]["images"] = ["22", 0]
    return nodes


def main() -> None:
    comp = upload(ROOT / "reference-poolside-ardan.jpg", "pool-composition.jpg", "image/jpeg")
    char = upload(ROOT / "references" / "canonical" / "oumi" / "oumi-character.png", "oumi-character.png", "image/png")
    for i, seed in enumerate((20281001, 20281002, 20281003), 1):
        r = requests.post(f"{SERVER}/prompt", json={"prompt": build(comp, char, seed, hires=(i == 1))}, timeout=60)
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
        target = OUT / f"oumi-nostyle-{i}.png"
        target.write_bytes(response.content)
        print(target)


if __name__ == "__main__":
    main()
