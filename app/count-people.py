#!/usr/bin/env python
"""数一张图里有几个人：640 全图 + 2x2 放大分块，合并去重（能抓到背景小人物）。"""
import json
import sys
from pathlib import Path


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"people": -1}))
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

    def detect(crop_box, conf_min, tag):
        ox, oy = crop_box[0], crop_box[1]
        tw, th = crop_box[2] - crop_box[0], crop_box[3] - crop_box[1]
        is_tile = tag == "tile"
        sub = im.crop(crop_box) if crop_box != (0, 0, W, H) else im
        w, h = sub.size
        size = 640
        s = min(size / w, size / h)
        nw, nh = int(round(w * s)), int(round(h * s))
        canvas = Image.new("RGB", (size, size), (114, 114, 114))
        px, py = (size - nw) // 2, (size - nh) // 2
        canvas.paste(sub.resize((nw, nh), Image.BILINEAR), (px, py))
        arr = (np.asarray(canvas, dtype=np.float32) / 255.0).transpose(2, 0, 1)[None, ...]
        pred = sess.run(None, {name: arr})[0][0].T
        out = []
        for row in pred:
            conf = float(row[4])
            if conf < conf_min:
                continue
            cx, cy, bw, bh = (float(v) for v in row[:4])
            x0 = (cx - bw / 2 - px) / s + ox
            y0 = (cy - bh / 2 - py) / s + oy
            x1 = (cx + bw / 2 - px) / s + ox
            y1 = (cy + bh / 2 - py) / s + oy
            if is_tile:
                # 分块里被边缘切断的框（同一人的局部）直接丢掉，只留完整小人
                edge = 2.0
                if x0 <= ox + edge or y0 <= oy + edge or x1 >= ox + tw - edge or y1 >= oy + th - edge:
                    continue
            out.append((conf, (x0, y0, x1, y1), tag))
        return out

    def iou(a, b):
        ix0, iy0 = max(a[0], b[0]), max(a[1], b[1])
        ix1, iy1 = min(a[2], b[2]), min(a[3], b[3])
        iw, ih = max(0.0, ix1 - ix0), max(0.0, iy1 - iy0)
        inter = iw * ih
        if inter <= 0:
            return 0.0
        ua = (a[2] - a[0]) * (a[3] - a[1]) + (b[2] - b[0]) * (b[3] - b[1]) - inter
        return inter / ua if ua > 0 else 0.0

    boxes = []
    boxes += detect((0, 0, W, H), 0.35, "full")
    # 2x2 分块：放大背景细节，能抓到远处小人
    half_w, half_h = int(W * 0.55), int(H * 0.55)
    for ty in (0, H - half_h):
        for tx in (0, W - half_w):
            boxes += detect((tx, ty, tx + half_w, ty + half_h), 0.30, "tile")

    def area(box):
        return max(0.0, box[2] - box[0]) * max(0.0, box[3] - box[1])

    def containment(inner, outer):
        """inner 被 outer 覆盖的比例"""
        ix0, iy0 = max(inner[0], outer[0]), max(inner[1], outer[1])
        ix1, iy1 = min(inner[2], outer[2]), min(inner[3], outer[3])
        inter = max(0.0, ix1 - ix0) * max(0.0, iy1 - iy0)
        a = area(inner)
        return inter / a if a > 0 else 0.0

    # 大框优先；只有「同尺度的局部框」才并入，避免把背景小人当重复框
    boxes.sort(key=lambda b: (-area(b[1]), -b[0]))
    kept = []
    for conf, box, tag in boxes:
        duplicate = False
        for other, _ in kept:
            if iou(box, other) >= 0.45:
                duplicate = True
                break
            small, big = (box, other) if area(box) <= area(other) else (other, box)
            ratio = area(small) / area(big) if area(big) > 0 else 0.0
            # 明显更小的框（背景人头）不合并；同量级的局部框才合并
            if ratio >= 0.45 and containment(small, big) >= 0.8:
                duplicate = True
                break
        if not duplicate:
            kept.append((box, tag))

    print(json.dumps({"people": len(kept), "sources": sorted({tag for _, tag in kept})}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
