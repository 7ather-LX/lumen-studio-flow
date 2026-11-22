#!/usr/bin/env python3
"""Generate Cheshire bed/pool tests on Anima 2.9B with style + foot/fabric LoRAs."""
from __future__ import annotations

import json
import time
from pathlib import Path

import requests

SERVER = "http://127.0.0.1:8188"
ROOT = Path(r"F:\DSH WORKSPACE\lumen-flow")
OUT = ROOT / "training" / "output" / "joint-tests"
OUT.mkdir(parents=True, exist_ok=True)

BASE = (
    "masterpiece, best quality, score_7, safe, 1girl, solo, "
    "cheshire (azur lane), azur lane, black hair, streaked hair, blue highlights, "
    "short hair, blue eyes, fake animal ears, maid headdress, detailed skin, "
    "detailed hands, detailed toes, detailed foot soles, foot_study_style, fabric_study_style"
)
BED = (
    "lying on bed, on back, head on pillow, bedroom, warm lamp light, white bedding, "
    "books, phone, low angle from foot of bed, feet in foreground, white apron, black dress, "
    "black pantyhose, sheer black tights, detailed bedding"
)
POOL = (
    "white bikini, sitting on pool edge, poolside, night, city lights bokeh, water reflections, "
    "feet in water, wet skin, wet hair, full body"
)
NEG = (
    "white hair, silver hair, missing toes, four toes, three toes, fused toes, extra toes, "
    "bad feet, bad anatomy, bad hands, extra fingers, lowres, text, watermark, 3D render, CGI"
)
STYLES = [
    ("ririko", "ririko_anima_v2.safetensors", 0.75, "ririko_cel_style, anime cel shading, flat colors, clean lineart, crisp shadow edges"),
    ("25d", "25d_anima_v4.safetensors", 0.7, "25d_semi_style, semi-realistic anime, soft shading, glossy skin, detailed rendering"),
    ("mushroom", "mushroom_anima_v2.safetensors", 0.7, "mushroom_moe_style, moe anime, soft pastel colors, gentle shading"),
]


def queue(prompt: dict) -> str:
    response = requests.post(f"{SERVER}/prompt", json={"prompt": prompt}, timeout=60)
    response.raise_for_status()
    return response.json()["prompt_id"]


def wait(prompt_id: str, timeout: int = 600) -> dict:
    deadline = time.time() + timeout
    while time.time() < deadline:
        data = requests.get(f"{SERVER}/history/{prompt_id}", timeout=30).json()
        if prompt_id in data:
            return data[prompt_id]
        time.sleep(2)
    raise TimeoutError(prompt_id)


def build(style_lora: str, strength: float, style_text: str, scene: str, seed: int) -> dict:
    return {
        "1": {"class_type": "UNETLoader", "inputs": {"unet_name": "Anima-2.9B-preview-v1.safetensors", "weight_dtype": "default"}},
        "2": {"class_type": "CLIPLoader", "inputs": {"clip_name": "qwen_3_06b_base.safetensors", "type": "stable_diffusion", "device": "default"}},
        "3": {"class_type": "VAELoader", "inputs": {"vae_name": "qwen_image_vae.safetensors"}},
        "4": {"class_type": "CLIPTextEncode", "inputs": {"text": f"{BASE}, {style_text}, {scene}", "clip": ["2", 0]}},
        "5": {"class_type": "CLIPTextEncode", "inputs": {"text": NEG, "clip": ["2", 0]}},
        "6": {"class_type": "EmptyLatentImage", "inputs": {"width": 512, "height": 768, "batch_size": 1}},
        "7": {"class_type": "LoraLoaderModelOnly", "inputs": {"model": ["1", 0], "lora_name": style_lora, "strength_model": strength}},
        "8": {"class_type": "LoraLoaderModelOnly", "inputs": {"model": ["7", 0], "lora_name": "foot_anima_v4.safetensors", "strength_model": 0.55}},
        "9": {"class_type": "LoraLoaderModelOnly", "inputs": {"model": ["8", 0], "lora_name": "fabric_anima_v3.safetensors", "strength_model": 0.4}},
        "10": {"class_type": "KSampler", "inputs": {"model": ["9", 0], "positive": ["4", 0], "negative": ["5", 0], "latent_image": ["6", 0], "seed": seed, "steps": 24, "cfg": 4, "sampler_name": "er_sde", "scheduler": "simple", "denoise": 1}},
        "11": {"class_type": "VAEDecode", "inputs": {"samples": ["10", 0], "vae": ["3", 0]}},
        "12": {"class_type": "SaveImage", "inputs": {"images": ["11", 0], "filename_prefix": f"joint-{style_lora.split('_')[0]}-{scene[:4]}"}},
    }


def main() -> None:
    index = 0
    for style_name, lora, strength, style_text in STYLES:
        for scene_name, scene in (("bed", BED), ("pool", POOL)):
            index += 1
            prompt_id = queue(build(lora, strength, style_text, scene, 20273000 + index))
            result = wait(prompt_id)
            node = next(iter(result["outputs"].values()))
            image = node["images"][0]
            response = requests.get(f"{SERVER}/view", params=image, timeout=120)
            response.raise_for_status()
            target = OUT / f"cheshire-{style_name}-{scene_name}.png"
            target.write_bytes(response.content)
            print("saved", target)


if __name__ == "__main__":
    main()
