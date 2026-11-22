#!/usr/bin/env python3
"""Pure hand/foot anatomy probes against the trained hand/foot LoRAs."""
from __future__ import annotations

import time
from pathlib import Path

import requests

SERVER = "http://127.0.0.1:8188"
ROOT = Path(r"F:\DSH WORKSPACE\lumen-flow")
OUT = ROOT / "training" / "output" / "anatomy-probes"
OUT.mkdir(parents=True, exist_ok=True)
HAND = (
    "masterpiece, best quality, score_7, safe, hand focus, close-up of a single hand, "
    "five fingers, individual fingers, knuckles, fingernails, wrist, pale skin, "
    "soft studio lighting, dark background, hand_study_style, detailed anatomy, clean lineart"
)
FOOT = (
    "masterpiece, best quality, score_7, safe, foot focus, close-up of bare feet, "
    "soles, five toes, individual toes, foot arch, ankle, pale skin, "
    "soft studio lighting, dark background, foot_study_style, detailed anatomy, clean lineart"
)
NEG = (
    "missing fingers, four fingers, three fingers, fused fingers, extra fingers, "
    "missing toes, four toes, three toes, fused toes, extra toes, bad hands, bad feet, "
    "bad anatomy, lowres, text, watermark, 3D render, CGI, deformed"
)


def build(prompt: str, lora: str, strength: float, seed: int, prefix: str) -> dict:
    return {
        "1": {"class_type": "UNETLoader", "inputs": {"unet_name": "Anima-2.9B-preview-v1.safetensors", "weight_dtype": "default"}},
        "2": {"class_type": "CLIPLoader", "inputs": {"clip_name": "qwen_3_06b_base.safetensors", "type": "stable_diffusion", "device": "default"}},
        "3": {"class_type": "VAELoader", "inputs": {"vae_name": "qwen_image_vae.safetensors"}},
        "4": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["2", 0]}},
        "5": {"class_type": "CLIPTextEncode", "inputs": {"text": NEG, "clip": ["2", 0]}},
        "6": {"class_type": "EmptyLatentImage", "inputs": {"width": 640, "height": 640, "batch_size": 1}},
        "7": {"class_type": "LoraLoaderModelOnly", "inputs": {"model": ["1", 0], "lora_name": lora, "strength_model": strength}},
        "8": {"class_type": "KSampler", "inputs": {"model": ["7", 0], "positive": ["4", 0], "negative": ["5", 0], "latent_image": ["6", 0], "seed": seed, "steps": 24, "cfg": 4, "sampler_name": "er_sde", "scheduler": "simple", "denoise": 1}},
        "9": {"class_type": "VAEDecode", "inputs": {"samples": ["8", 0], "vae": ["3", 0]}},
        "10": {"class_type": "SaveImage", "inputs": {"images": ["9", 0], "filename_prefix": prefix}},
    }


def run(name: str, prompt: str, lora: str, strength: float, seed: int) -> None:
    response = requests.post(f"{SERVER}/prompt", json={"prompt": build(prompt, lora, strength, seed, name)}, timeout=60)
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
    image = next(iter(result["outputs"].values()))["images"][0]
    response = requests.get(f"{SERVER}/view", params=image, timeout=120)
    response.raise_for_status()
    target = OUT / f"{name}.png"
    target.write_bytes(response.content)
    print("saved", target)


def main() -> None:
    for i, seed in enumerate((20276001, 20276002, 20276003), 1):
        run(f"hand-{i}", HAND, "hand_anima_v1.safetensors", 0.6, seed)
    for i, seed in enumerate((20276101, 20276102, 20276103), 1):
        run(f"foot-{i}", FOOT, "foot_anima_v4.safetensors", 0.55, seed)


if __name__ == "__main__":
    main()
