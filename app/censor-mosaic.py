#!/usr/bin/env python
"""按姿态定位给敏感区域打马赛克（NSFW 关闭模式使用）。

用法：python censor-mosaic.py <in> <out> [both|pelvis|chest] [block]
输出 JSON：{"ok": true, "boxes": [[x0,y0,x1,y1], ...], "mode": "pose|fallback"}
"""
import json
import sys
from pathlib import Path


def fail(reason, **kw):
    print(json.dumps({"ok": False, "reason": reason, **kw}, ensure_ascii=False))
    sys.exit(0)


def mosaic(im, box, block):
    """强马赛克：像素化 + 模糊，确保一眼看出被遮挡。"""
    from PIL import ImageFilter

    x0, y0, x1, y1 = box
    x0, y0 = max(0, int(x0)), max(0, int(y0))
    x1, y1 = min(im.width, int(x1)), min(im.height, int(y1))
    if x1 - x0 < 12 or y1 - y0 < 12:
        return
    region = im.crop((x0, y0, x1, y1))
    w, h = region.size
    small = region.resize((max(1, w // block), max(1, h // block)), 0)
    pixel = small.resize((w, h), 0).filter(ImageFilter.GaussianBlur(radius=max(1.0, block * 0.10)))
    im.paste(pixel, (x0, y0))


def main():
    if len(sys.argv) < 3:
        fail("usage: censor-mosaic.py <in> <out> [both|pelvis|chest] [block]")
    src, dst = Path(sys.argv[1]), Path(sys.argv[2])
    mode_arg = sys.argv[3] if len(sys.argv) > 3 else "both"
    block_arg = int(sys.argv[4]) if len(sys.argv) > 4 else 0
    if not src.exists():
        fail(f"not found: {src}")

    from PIL import Image

    im = Image.open(src).convert("RGB")
    W, H = im.size
    boxes = []
    method = "pose"

    try:
        import numpy as np
        import onnxruntime as ort

        here = Path(__file__).resolve().parent
        model = None
        for cand in (here / "parsing" / "yolov8n-pose.onnx", here / "models" / "yolov8n-pose.onnx"):
            if cand.exists():
                model = cand
                break
        if model:
            sess = ort.InferenceSession(str(model), providers=["CPUExecutionProvider"])
            name = sess.get_inputs()[0].name
            size = 640
            s = min(size / W, size / H)
            nw, nh = int(round(W * s)), int(round(H * s))
            canvas = Image.new("RGB", (size, size), (114, 114, 114))
            px, py = (size - nw) // 2, (size - nh) // 2
            canvas.paste(im.resize((nw, nh), Image.BILINEAR), (px, py))
            arr = (np.asarray(canvas, dtype=np.float32) / 255.0).transpose(2, 0, 1)[None, ...]
            pred = sess.run(None, {name: arr})[0][0].T

            best = None
            for row in pred:
                conf = float(row[4])
                if conf < 0.35:
                    continue
                if best is None or conf > best[0]:
                    best = (conf, row)

            if best is not None:
                kpts = best[1][5:].reshape(-1, 3)

                def pt(idx):
                    x, y, c = float(kpts[idx][0]), float(kpts[idx][1]), float(kpts[idx][2])
                    if c < 0.30:
                        return None
                    return ((x - px) / s, (y - py) / s)

                shoulders = [p for p in (pt(5), pt(6)) if p]
                hips = [p for p in (pt(11), pt(12)) if p]
                knees = [p for p in (pt(13), pt(14)) if p]

                if hips:
                    hip_x = sum(p[0] for p in hips) / len(hips)
                    hip_y = sum(p[1] for p in hips) / len(hips)
                    knee_y = sum(p[1] for p in knees) / len(knees) if knees else hip_y + H * 0.15
                    span = max(24.0, abs(knee_y - hip_y))
                    if mode_arg in ("both", "pelvis"):
                        boxes.append((hip_x - span * 0.52, hip_y - span * 0.18, hip_x + span * 0.52, hip_y + span * 0.52))
                if shoulders and hips and mode_arg in ("both", "chest"):
                    sx0 = min(p[0] for p in shoulders)
                    sx1 = max(p[0] for p in shoulders)
                    sy = max(p[1] for p in shoulders)
                    hy = sum(p[1] for p in hips) / len(hips)
                    width = (sx1 - sx0) * 1.2
                    cx = (sx0 + sx1) / 2
                    boxes.append((cx - width / 2, sy - (hy - sy) * 0.05, cx + width / 2, sy + (hy - sy) * 0.8))
    except Exception:
        boxes = []

    if not boxes:
        method = "fallback"
        if mode_arg in ("both", "chest"):
            boxes.append((W * 0.28, H * 0.20, W * 0.72, H * 0.48))
        if mode_arg in ("both", "pelvis"):
            boxes.append((W * 0.30, H * 0.52, W * 0.70, H * 0.80))

    block = block_arg if block_arg > 0 else max(12, int(W / 26))
    for box in boxes:
        mosaic(im, box, block)

    dst.parent.mkdir(parents=True, exist_ok=True)
    im.save(dst)
    print(json.dumps({"ok": True, "mode": method, "boxes": [[int(v) for v in b] for b in boxes], "block": block}, ensure_ascii=False))


if __name__ == "__main__":
    main()
