#!/usr/bin/env python
"""高清化后的细节强化：USM 锐化 + 线条增强 + 轻微对比，压制「糊成一坨」。

用法：python enhance-detail.py <in> <out> [strength]
strength: 0.0–2.0，默认 1.0
"""
import json
import sys
from pathlib import Path


def main():
    if len(sys.argv) < 3:
        print(json.dumps({"ok": False, "reason": "usage: enhance-detail.py <in> <out> [strength]"}))
        return 0
    src, dst = Path(sys.argv[1]), Path(sys.argv[2])
    strength = float(sys.argv[3]) if len(sys.argv) > 3 else 1.0
    if not src.exists():
        print(json.dumps({"ok": False, "reason": "not found"}))
        return 0
    try:
        from PIL import Image, ImageEnhance, ImageFilter
    except Exception as exc:  # noqa: BLE001
        print(json.dumps({"ok": False, "reason": f"missing PIL: {exc}"}))
        return 0

    im = Image.open(src).convert("RGB")

    # 1) 非锐化掩模：半径随分辨率放大，避免大图上锐化无感
    radius = max(1.2, min(4.0, im.width / 900))
    percent = int(55 * max(0.2, min(2.0, strength)))
    threshold = 4
    sharp = im.filter(ImageFilter.UnsharpMask(radius=radius, percent=percent, threshold=threshold))

    # 2) 边缘增强：让线稿更「实」，但同时压一点毛刺
    edges = sharp.filter(ImageFilter.EDGE_ENHANCE_MORE)
    sharp = Image.blend(sharp, edges, 0.06 * max(0.2, min(2.0, strength)))

    # 3) 轻微对比与饱和回正（避免锐化后发灰）
    sharp = ImageEnhance.Contrast(sharp).enhance(1.02)
    sharp = ImageEnhance.Color(sharp).enhance(1.01)

    dst.parent.mkdir(parents=True, exist_ok=True)
    sharp.save(dst)
    print(json.dumps({"ok": True, "radius": round(radius, 2), "percent": percent, "strength": strength}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
