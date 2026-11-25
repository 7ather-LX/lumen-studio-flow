#!/usr/bin/env python
"""数一张图里有几个人（YOLOv8n-pose + IOU 去重）。输出 {"people": n}"""
import json
import sys
from pathlib import Path


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"people": -1, "reason": "usage: count-people.py <image>"}))
        return 0
    src = Path(sys.argv[1])
    if not src.exists():
        print(json.dumps({"people": -1, "reason": "not found"}))
        return 0
    try:
        import numpy as np
        import onnxruntime as ort
        from PIL import Image
    except Exception as exc:  # noqa: BLE001
        print(json.dumps({"people": -1, "reason": f"missing dep: {exc}"}))
        return 0

    here = Path(__file__).resolve().parent
    model = None
    for cand in (here / "parsing" / "yolov8n-pose.onnx", here / "models" / "yolov8n-pose.onnx"):
        if cand.exists():
            model = cand
            break
    if not model:
        print(json.dumps({"people": -1, "reason": "model missing"}))
        return 0

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
        if conf < 0.35:
            continue
        cx, cy, bw, bh = (float(v) for v in row[:4])
        boxes.append((conf, ((cx - bw / 2 - px) / s, (cy - bh / 2 - py) / s, (cx + bw / 2 - px) / s, (cy + bh / 2 - py) / s)))
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
    print(json.dumps({"people": len(kept)}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
