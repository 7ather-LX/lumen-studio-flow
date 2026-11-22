#!/usr/bin/env python3
"""Run a controlled img2img variable matrix against the same poolside reference."""
from __future__ import annotations

import time
from pathlib import Path

import requests

SERVER = "http://127.0.0.1:8188"
ROOT = Path(r"F:\DSH WORKSPACE\lumen-flow")
SOURCE = ROOT / "reference-poolside-ardan.jpg"
OUT = ROOT / "training" / "output" / "reference-variables"
OUT.mkdir(parents=True, exist_ok=True)

CHESHIRE = (
    "masterpiece, best quality, score_7, safe, 1girl, solo, "
    "cheshire (azur lane), azur lane, black hair, streaked hair, blue highlights, "
    "short hair, blue eyes, fake animal ears, maid headdress, detailed skin, detailed hands"
)
POOL = (
    "white bikini, open white shirt, sitting on pool edge, poolside, night, "
    "city lights bokeh, water reflections, wet skin, wet hair, glossy skin, "
    "semi-realistic anime, 2.5D, soft shading, cinematic lighting, detailed skin"
)
BED = (
    "lying on bed, on back, white bedding, bedroom, warm lamp light, "
    "white bikini, semi-realistic anime, 2.5D, soft shading, cinematic lighting"
)
CLOSE = (
    "upper body close-up, face focus, poolside, night, city lights bokeh, "
    "semi-realistic anime, 2.5D, soft shading, cinematic lighting, detailed skin"
)
FULL = (
    "full body, standing, poolside, night, city lights bokeh, white bikini, "
    "semi-realistic anime, 2.5D, soft shading, cinematic lighting"
)
NEG = (
    "brown hair, green eyes, horse ears, horse tail, mejiro ardan, umamusume, "
    "lowres, bad anatomy, bad hands, extra fingers, text, watermark, 3D render, CGI, "
    "deformed face, asymmetrical eyes"
)
STYLE = {
    "none": ("", "", 0.0),
    "ririko": ("ririko_anima_v2.safetensors", "ririko_cel_style, anime cel shading, flat colors, clean lineart", 0.7),
    "25d": ("25d_anima_v4.safetensors", "25d_semi_style, semi-realistic anime, glossy skin, detailed rendering", 0.65),
    "mushroom": ("mushroom_anima_v2.safetensors", "mushroom_moe_style, moe anime, soft pastel colors, gentle shading", 0.65),
    "bili25d": ("bilibili_2_5d_semi_anima_v1.safetensors", "bilibili_2_5d_semi_style, semi-realistic anime, polished rendering", 0.65),
}


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


def build(image_name: str, prompt: str, denoise: float, seed: int, style: str, extra: str = "") -> dict:
    style_lora, style_text, style_strength = STYLE[style]
    nodes = {
        "1": {"class_type": "UNETLoader", "inputs": {"unet_name": "Anima-2.9B-preview-v1.safetensors", "weight_dtype": "default"}},
        "2": {"class_type": "CLIPLoader", "inputs": {"clip_name": "qwen_3_06b_base.safetensors", "type": "stable_diffusion", "device": "default"}},
        "3": {"class_type": "VAELoader", "inputs": {"vae_name": "qwen_image_vae.safetensors"}},
        "4": {"class_type": "CLIPTextEncode", "inputs": {"text": f"{CHESHIRE}, {style_text}, {prompt}, {extra}".replace(", ,", ","), "clip": ["2", 0]}},
        "5": {"class_type": "CLIPTextEncode", "inputs": {"text": NEG, "clip": ["2", 0]}},
        "6": {"class_type": "LoadImage", "inputs": {"image": image_name}},
        "7": {"class_type": "ImageScale", "inputs": {"image": ["6", 0], "upscale_method": "lanczos", "width": 768, "height": 1024, "crop": "center"}},
        "8": {"class_type": "VAEEncode", "inputs": {"pixels": ["7", 0], "vae": ["3", 0]}},
        "10": {"class_type": "KSampler", "inputs": {"model": ["1", 0], "positive": ["4", 0], "negative": ["5", 0], "latent_image": ["8", 0], "seed": seed, "steps": 30, "cfg": 4, "sampler_name": "er_sde", "scheduler": "simple", "denoise": denoise}},
        "11": {"class_type": "VAEDecode", "inputs": {"samples": ["10", 0], "vae": ["3", 0]}},
        "12": {"class_type": "SaveImage", "inputs": {"images": ["11", 0], "filename_prefix": "ref-vars"}},
    }
    model_ref = ["1", 0]
    if style_lora:
        nodes["20"] = {"class_type": "LoraLoaderModelOnly", "inputs": {"model": model_ref, "lora_name": style_lora, "strength_model": style_strength}}
        model_ref = ["20", 0]
    if extra:
        if "hand_study_style" in extra:
            nodes["21"] = {"class_type": "LoraLoaderModelOnly", "inputs": {"model": model_ref, "lora_name": "hand_anima_v1.safetensors", "strength_model": 0.55}}
            model_ref = ["21", 0]
        if "foot_study_style" in extra:
            nodes["22"] = {"class_type": "LoraLoaderModelOnly", "inputs": {"model": model_ref, "lora_name": "foot_anima_v4.safetensors", "strength_model": 0.5}}
            model_ref = ["22", 0]
    nodes["10"]["inputs"]["model"] = model_ref
    return nodes


def run(image_name: str, name: str, prompt: str, denoise: float, seed: int, style: str, extra: str = "") -> None:
    response = requests.post(f"{SERVER}/prompt", json={"prompt": build(image_name, prompt, denoise, seed, style, extra)}, timeout=60)
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
    image_name = upload()
    # Strength matrix: same reference, same seed, fixed style none.
    for denoise, label in ((0.5, "strength-50"), (0.62, "strength-62")):
        run(image_name, label, POOL, denoise, 20275001, "none")
    # Style matrix at the better identity strength.
    for style in ("ririko", "25d", "mushroom", "bili25d"):
        run(image_name, f"style-{style}-62", POOL, 0.62, 20275001, style)
    # Scene / camera prompts, 25D style, same seed.
    run(image_name, "scene-bed-25d-55", BED, 0.55, 20275001, "25d")
    run(image_name, "camera-close-25d-55", CLOSE, 0.55, 20275001, "25d")
    run(image_name, "camera-full-25d-55", FULL, 0.55, 20275001, "25d")
    # Anatomy LoRAs.
    run(image_name, "lora-hand-25d-55", POOL, 0.55, 20275001, "25d", "hand_study_style")
    run(image_name, "lora-foot-25d-55", POOL, 0.55, 20275001, "25d", "foot_study_style")
    # Seed sensitivity.
    run(image_name, "seed-alt-25d-62", POOL, 0.62, 20275999, "25d")


if __name__ == "__main__":
    main()
