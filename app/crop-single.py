#!/usr/bin/env python
"""检测参考图人数；多人时裁出主体单人（不改原图，由调用方决定是否替换）。

用法：python crop-single.py <输入> <输出>
输出 JSON：
  {"ok": true, "people": 2, "saved": "...", "bbox": [x0,y0,x1,y1]}
  {"ok": false, "reason": "single", "people": 1}
"""
import json
import sys
from pathlib import Path


def fail(reason, **kw):
    print(json.dumps({"ok": False, "reason": reason, **kw}, ensure_ascii=False))
    sys.exit(0)


def main():
    if len(sys.argv) < 3:
        fail("usage: crop-single.py <in> <out>")
    src, dst = Path(sys.argv[1]), Path(sys.argv[2])
    if not src.exists():
        fail(f"not found: {src}")

    import numpy as np
    import onnxruntime as ort
    from PIL import Image

    here = Path(__file__).resolve().parent
    model = None
    for cand in (here / "parsing" / "yolov8n-pose.onnx", here / "models" / "yolov8n-pose.onnx"):
        if cand.exists():
            model = cand
            break
    if not model:
        fail("model missing: yolov8n-pose.onnx")

    sess = ort.InferenceSession(str(model), providers=["CPUExecutionProvider"])
    name = sess.get_inputs()[0].name

    im = Image.open(src).convert("RGB")
    W, H = im.size
    size = 640
    s = min(size / W, size / H)
    nw, nh = int(round(W * s)), int(round(H * s))
    canvas = Image.new("RGB", (size, size), (114, 114, 114))
    px, py = (size - nw) // 2, (size - nh) // 2
    canvas.paste(im.resize((nw, nh), Image.BILINEAR), (px, py))
    arr = (np.asarray(canvas, dtype=np.float32) / 255.0).transpose(2, 0, 1)[None, ...]
    pred = sess.run(None, {name: arr})[0][0].T

    boxes = []
    for row in pred:
        conf = float(row[4])
        if conf < 0.30:
            continue
        cx, cy, bw, bh = (float(v) for v in row[:4])
        x0 = (cx - bw / 2 - px) / s
        y0 = (cy - bh / 2 - py) / s
        x1 = (cx + bw / 2 - px) / s
        y1 = (cy + bh / 2 - py) / s
        boxes.append((conf, (x0, y0, x1, y1)))
    boxes.sort(key=lambda b: -b[0])

    def iou(a, b):
        ix0, iy0 = max(a[0], b[0]), max(a[1], b[1])
        ix1, iy1 = min(a[2], b[2]), min(a[3], b[3])
        iw, ih = max(0.0, ix1 - ix0), max(0.0, iy1 - iy0)
        inter = iw * ih
        if inter <= 0:
            return 0.0
        ua = (a[2] - a[0]) * (a[3] - a[1]) + (b[2] - b[0]) * (b[3] - b[1]) - inter
        return inter / ua if ua > 0 else 0.0

    kept = []
    for _, box in boxes:
        if all(iou(box, other) < 0.5 for other in kept):
            kept.append(box)

    people = len(kept)
    if people <= 1:
        fail("single", people=people)

    x0, y0, x1, y1 = kept[0]
    mx, my = (x1 - x0) * 0.14, (y1 - y0) * 0.12
    cx0, cy0 = max(0, int(x0 - mx)), max(0, int(y0 - my))
    cx1, cy1 = min(W, int(x1 + mx)), min(H, int(y1 + my))
    if cx1 - cx0 < 128 or cy1 - cy0 < 128:
        fail("crop too small", people=people)
    dst.parent.mkdir(parents=True, exist_ok=True)
    im.crop((cx0, cy0, cx1, cy1)).save(dst)
    print(json.dumps({"ok": True, "people": people, "saved": str(dst), "bbox": [cx0, cy0, cx1, cy1]}, ensure_ascii=False))


if __name__ == "__main__":
    main()
