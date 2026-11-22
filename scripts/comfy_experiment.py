#!/usr/bin/env python
"""Lumen Studio Flow — 后台 ComfyUI 实验脚本（不启动 UI、不写 outputs）

用法示例：
  python comfy_experiment.py \
    --ref "F:\\DSH WORKSPACE\\lumen-flow\\training\\references\\mejiro-ardan-ref.jpg" \
    --prompt-file prompt.txt --negative-file negative.txt \
    --denoise 0.88 --seed 1601600 --width 896 --height 1152 \
    --style-tags 2.5d-thick --tag "mejiro-d88" --feet-detail

输出：
  training\\output\\_experiments\\<日期>\\<tag>-seed<seed>.png
  training\\output\\_experiments\\<日期>\\<tag>-seed<seed>.json   （参数记录）
  training\\output\\_experiments\\<日期>\\contact-<tag>.png        （--contact 时）

规则：
  - 只写实验目录，绝不写 lumen-flow\\outputs（那是软件作品栏）
  - 一个实验一个目录，一个版本一个前缀
  - 生成后立即筛选，废案立即删除
"""
from __future__ import annotations

import argparse
import datetime as _dt
import json
import time
import urllib.parse
import urllib.request
from pathlib import Path

LUMEN = Path(r"F:\DSH WORKSPACE\lumen-flow")
SERVER = "http://127.0.0.1:8188"

STYLE_TAGS = {
    "none": "",
    "2.5d-thick-soft": (
        "2.5D, semi-realistic anime, 3D anime figure render, pseudo-3D shading, soft global illumination, "
        "ambient occlusion, subsurface scattering, glossy specular skin, translucent skin, warm rim light, "
        "cool rim light, soft ambient light, volumetric light, cinematic bokeh, depth of field, "
        "smooth surfaces, physically based rendering look, high detail"
    ),
    "2.5d-thick": (
        "2.5D, semi-realistic anime, 3D anime figure render, pseudo-3D shading, soft global illumination, "
        "ambient occlusion, subsurface scattering, glossy specular skin, volumetric light, rim light, "
        "studio lighting, depth of field, cinematic bokeh, smooth surfaces, "
        "physically based rendering look, ultra detailed"
    ),
    "anime-cel": (
        "masterpiece, best quality, highres, absurdres, ultra detailed, anime cel shading, two-tone shading, "
        "crisp cel shadows, detailed shading, ambient occlusion, rim light, detailed eyes, detailed hair, "
        "detailed fabric, detailed folds, soft cinematic lighting, japanese anime key visual"
    ),
    # 对齐 reference-2.5d.png 的质感：大幅柔光、彩色轮廓光、次表面透光、几乎没有硬线条
    "2.5d-thick-v2": (
        "2.5D, semi-realistic anime, thick painting, painterly brushwork, soft airbrushed shading, "
        "subsurface scattering, glossy soft skin, translucent skin, warm rim light, cool rim light, "
        "soft ambient light, cinematic bokeh, depth of field, delicate soft lineart, clean soft rendering, "
        "rich skin tones, polished illustration, high detail"
    ),
}


def http_json(url: str, payload: dict | None = None, timeout: int = 60):
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(
        url, data=data, headers={"Content-Type": "application/json"} if data else {}
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode())


def upload_image(path: Path) -> str:
    boundary = "----lumenexperiment"
    body = b""
    body += f"--{boundary}\r\nContent-Disposition: form-data; name=\"overwrite\"\r\n\r\ntrue\r\n".encode()
    body += (
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"image\"; "
        f"filename=\"{path.name}\"\r\nContent-Type: image/png\r\n\r\n"
    ).encode()
    body += path.read_bytes() + b"\r\n"
    body += f"--{boundary}--\r\n".encode()
    req = urllib.request.Request(
        f"{SERVER}/upload/image",
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        return json.loads(resp.read().decode())["name"]


def align8(value: float) -> int:
    return max(8, round(value / 8) * 8)


def base_nodes(prompt: str, negative: str, seed: int, steps: int, cfg: float):
    return {
        "4": {"class_type": "UNETLoader", "inputs": {"unet_name": "anima-base-v1.0.safetensors", "weight_dtype": "default"}},
        "5": {"class_type": "CLIPLoader", "inputs": {"clip_name": "qwen_3_06b_base.safetensors", "type": "stable_diffusion", "device": "default"}},
        "6": {"class_type": "VAELoader", "inputs": {"vae_name": "qwen_image_vae.safetensors"}},
        "7": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["5", 0]}},
        "8": {"class_type": "CLIPTextEncode", "inputs": {"text": negative, "clip": ["5", 0]}},
        "_seed": seed,
        "_steps": steps,
        "_cfg": cfg,
    }


def build_img2img(image_name: str, width: int, height: int, prompt: str, negative: str,
                  seed: int, steps: int, cfg: float, denoise: float, prefix: str) -> dict:
    wf = base_nodes(prompt, negative, seed, steps, cfg)
    wf.pop("_seed"), wf.pop("_steps"), wf.pop("_cfg")
    wf.update({
        "1": {"class_type": "LoadImage", "inputs": {"image": image_name}},
        "2": {"class_type": "ImageScale", "inputs": {"image": ["1", 0], "upscale_method": "lanczos", "width": width, "height": height, "crop": "center"}},
        "9": {"class_type": "VAEEncode", "inputs": {"pixels": ["2", 0], "vae": ["6", 0]}},
        "10": {"class_type": "KSampler", "inputs": {
            "model": ["4", 0], "positive": ["7", 0], "negative": ["8", 0], "latent_image": ["9", 0],
            "seed": seed, "steps": steps, "cfg": cfg, "sampler_name": "er_sde", "scheduler": "simple",
            "denoise": denoise}},
        "11": {"class_type": "VAEDecode", "inputs": {"samples": ["10", 0], "vae": ["6", 0]}},
        "12": {"class_type": "SaveImage", "inputs": {"images": ["11", 0], "filename_prefix": prefix}},
    })
    return wf


def build_feet_detail(image_name: str, width: int, height: int, prompt: str, negative: str,
                      seed: int, steps: int, cfg: float, denoise: float, prefix: str,
                      zoom: float = 1.0) -> dict:
    """局部精修：裁区域 → 放大 1024 → 重绘 → 缩回 → 羽化贴回。zoom 越小裁剪越紧、放大倍数越高。"""
    scale = max(0.2, min(1.0, zoom))
    region_w = min(width, align8(width * 0.8 * scale))
    region_h = min(height, align8(height * 0.5 * scale))
    base_cx = (0.1 + 0.8 / 2) * width
    base_cy = (0.45 + 0.5 / 2) * height
    x = max(0, min(width - region_w, align8(base_cx - region_w / 2)))
    y = max(0, min(height - region_h, align8(base_cy - region_h / 2)))
    ratio = region_w / region_h
    tw, th = 1024, align8(1024 / ratio)
    if th > 1024:
        th, tw = 1024, align8(1024 * ratio)
    feather = max(24, align8(min(region_w, region_h) * 0.14))
    wf = base_nodes(prompt, negative, seed, steps, cfg)
    wf.pop("_seed"), wf.pop("_steps"), wf.pop("_cfg")
    wf.update({
        "1": {"class_type": "LoadImage", "inputs": {"image": image_name}},
        "2": {"class_type": "ImageCrop", "inputs": {"image": ["1", 0], "width": region_w, "height": region_h, "x": x, "y": y}},
        "3": {"class_type": "ImageScale", "inputs": {"image": ["2", 0], "upscale_method": "lanczos", "width": tw, "height": th, "crop": "disabled"}},
        "9": {"class_type": "VAEEncode", "inputs": {"pixels": ["3", 0], "vae": ["6", 0]}},
        "10": {"class_type": "KSampler", "inputs": {
            "model": ["4", 0], "positive": ["7", 0], "negative": ["8", 0], "latent_image": ["9", 0],
            "seed": seed, "steps": steps, "cfg": cfg, "sampler_name": "er_sde", "scheduler": "simple",
            "denoise": denoise}},
        "11": {"class_type": "VAEDecode", "inputs": {"samples": ["10", 0], "vae": ["6", 0]}},
        "16": {"class_type": "ImageScale", "inputs": {"image": ["11", 0], "upscale_method": "lanczos", "width": region_w, "height": region_h, "crop": "disabled"}},
        "14": {"class_type": "SolidMask", "inputs": {"value": 1, "width": region_w, "height": region_h}},
        "15": {"class_type": "FeatherMask", "inputs": {"mask": ["14", 0], "left": feather, "top": feather, "right": feather, "bottom": feather}},
        "12": {"class_type": "ImageCompositeMasked", "inputs": {"destination": ["1", 0], "source": ["16", 0], "x": x, "y": y, "resize_source": False, "mask": ["15", 0]}},
        "13": {"class_type": "SaveImage", "inputs": {"images": ["12", 0], "filename_prefix": prefix}},
    })
    return wf


def apply_lora(workflow: dict, lora: str, strength: float) -> dict:
    """插入 LoraLoader 并改接 model/clip。"""
    if not lora:
        return workflow
    workflow["20"] = {
        "class_type": "LoraLoader",
        "inputs": {
            "model": ["4", 0],
            "clip": ["5", 0],
            "lora_name": lora,
            "strength_model": strength,
            "strength_clip": strength,
        },
    }
    for key in ("7", "8"):
        if key in workflow:
            workflow[key]["inputs"]["clip"] = ["20", 1]
    for key, node in workflow.items():
        if node.get("class_type") == "KSampler":
            node["inputs"]["model"] = ["20", 0]
    return workflow


def run_workflow(workflow: dict, out_dir: Path, out_name: str, timeout_s: int = 600) -> Path:
    pid = http_json(f"{SERVER}/prompt", {"prompt": workflow, "client_id": f"exp-{int(time.time())}"})["prompt_id"]
    for _ in range(timeout_s):
        time.sleep(1)
        entry = http_json(f"{SERVER}/history/{pid}").get(pid)
        if not entry:
            continue
        images = [img for out in entry.get("outputs", {}).values() for img in out.get("images", [])]
        if not images:
            raise RuntimeError("workflow finished without image")
        img = images[0]
        q = urllib.parse.urlencode({
            "filename": img["filename"], "subfolder": img.get("subfolder", ""), "type": img.get("type", "output")})
        with urllib.request.urlopen(f"{SERVER}/view?{q}", timeout=120) as resp:
            data = resp.read()
        target = out_dir / out_name
        target.write_bytes(data)
        return target
    raise TimeoutError("workflow timeout")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--ref", required=True, help="参考图路径（img2img）")
    ap.add_argument("--prompt", default="")
    ap.add_argument("--prompt-file")
    ap.add_argument("--negative", default="")
    ap.add_argument("--negative-file")
    ap.add_argument("--style-tags", default="none", choices=sorted(STYLE_TAGS))
    ap.add_argument("--denoise", type=float, default=0.7)
    ap.add_argument("--steps", type=int, default=28)
    ap.add_argument("--cfg", type=float, default=4.5)
    ap.add_argument("--seed", type=int, default=1601600)
    ap.add_argument("--width", type=int, default=896)
    ap.add_argument("--height", type=int, default=1152)
    ap.add_argument("--tag", required=True, help="文件名前缀，例如 mejiro-d88")
    ap.add_argument("--date", default=_dt.date.today().isoformat())
    ap.add_argument("--feet-detail", action="store_true", help="生成后再跑一次局部脚部精修")
    ap.add_argument("--feet-denoise", type=float, default=0.45)
    ap.add_argument("--feet-zoom", type=float, default=1.0, help="精修范围：1.0=大范围，0.5=只修脚")
    ap.add_argument("--lora", default="", help="LoRA 文件名，例如 25d_anima_v4.safetensors")
    ap.add_argument("--lora-strength", type=float, default=0.4)
    args = ap.parse_args()

    prompt = Path(args.prompt_file).read_text(encoding="utf-8").strip() if args.prompt_file else args.prompt
    negative = Path(args.negative_file).read_text(encoding="utf-8").strip() if args.negative_file else args.negative
    tags = STYLE_TAGS[args.style_tags]
    prompt = ", ".join(x for x in [prompt, tags] if x)
    if not prompt:
        raise SystemExit("prompt is empty")

    exp_dir = LUMEN / "training" / "output" / "_experiments" / args.date
    exp_dir.mkdir(parents=True, exist_ok=True)

    ref = Path(args.ref)
    name = upload_image(ref)

    base_out = exp_dir / f"{args.tag}-seed{args.seed}.png"
    wf = build_img2img(name, args.width, args.height, prompt, negative, args.seed, args.steps, args.cfg,
                       args.denoise, f"experiments/{args.date}-{args.tag}/{args.tag}")
    apply_lora(wf, args.lora, args.lora_strength)
    produced = run_workflow(wf, exp_dir, base_out.name)
    print("generated:", produced)

    if args.feet_detail:
        name2 = upload_image(produced)
        detail_prompt = (f"{prompt}, detailed toes, exactly five toes per foot, correct toe order, "
                         f"big toe on inner side, even toe spacing, toenails aligned, clean foot anatomy, "
                         f"detailed sole, realistic feet")
        detail_negative = (f"{negative}, extra toes, six toes, missing toes, fused toes, merged toes, "
                           f"detached toe, wrong toe order, deformed foot, bad feet")
        feet_out = exp_dir / f"{args.tag}-seed{args.seed}-feetdetail.png"
        wf2 = build_feet_detail(name2, args.width, args.height, detail_prompt, detail_negative,
                                args.seed, args.steps, args.cfg, args.feet_denoise,
                                f"experiments/{args.date}-{args.tag}/{args.tag}-feet",
                                zoom=args.feet_zoom)
        apply_lora(wf2, args.lora, args.lora_strength)
        print("feet detail:", run_workflow(wf2, exp_dir, feet_out.name))

    meta = {
        "model": "anima-base-v1.0.safetensors",
        "lora": None,
        "style": args.style_tags,
        "denoise": args.denoise,
        "steps": args.steps,
        "cfg": args.cfg,
        "seed": args.seed,
        "width": args.width,
        "height": args.height,
        "reference": str(ref),
        "feet_detail": args.feet_detail,
        "feet_denoise": args.feet_denoise if args.feet_detail else None,
        "prompt": prompt,
        "negative": negative,
    }
    (exp_dir / f"{args.tag}-seed{args.seed}.json").write_text(
        json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
    print("params:", exp_dir / f"{args.tag}-seed{args.seed}.json")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
