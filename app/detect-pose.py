#!/usr/bin/env python
"""用 YOLOv8n-pose 定位脚/手，输出局部精修用的矩形（像素坐标）。

用法：
  python detect-pose.py <图片路径> <feet|hands|auto>
输出（stdout，最后一行）：
  {"ok": true, "part": "feet", "x": 117, "y": 244, "w": 477, "h": 420, "conf": 0.65}
失败时：
  {"ok": false, "reason": "..."}

纯本地推理（onnxruntime CPU），不联网。
"""
import json
import sys
from pathlib import Path

MODEL_NAME = "yolov8n-pose.onnx"


def fail(reason):
    print(json.dumps({"ok": False, "reason": reason}, ensure_ascii=False))
    sys.exit(0)


def model_path():
    here = Path(__file__).resolve().parent
    for candidate in (
        here / "parsing" / MODEL_NAME,
        here / "models" / MODEL_NAME,
        here / MODEL_NAME,
    ):
        if candidate.exists():
            return candidate
    return None


def main():
    if len(sys.argv) < 3:
        fail("usage: detect-pose.py <image> <feet|hands|auto>")
    image_path = Path(sys.argv[1])
    part_req = sys.argv[2].lower()
    if not image_path.exists():
        fail(f"image not found: {image_path}")

    mp = model_path()
    if not mp:
        fail(f"model not found: {MODEL_NAME}")

    try:
        import numpy as np
        import onnxruntime as ort
        from PIL import Image
    except Exception as exc:  # noqa: BLE001
        fail(f"missing dependency: {exc}")

    try:
        sess = ort.InferenceSession(str(mp), providers=["CPUExecutionProvider"])
        name = sess.get_inputs()[0].name
        im = Image.open(image_path).convert("RGB")
        w, h = im.size

        size = 640
        s = min(size / w, size / h)
        nw, nh = int(round(w * s)), int(round(h * s))
        canvas = Image.new("RGB", (size, size), (114, 114, 114))
        px, py = (size - nw) // 2, (size - nh) // 2
        canvas.paste(im.resize((nw, nh), Image.BILINEAR), (px, py))
        arr = np.asarray(canvas, dtype=np.float32) / 255.0
        arr = arr.transpose(2, 0, 1)[None, ...]
        pred = sess.run(None, {name: arr})[0][0].T
        scores = pred[:, 4]
        best = int(np.argmax(scores))
        conf = float(scores[best])
        if conf < 0.25:
            fail(f"no person detected (conf={conf:.2f})")
        kp = pred[best, 5:].reshape(17, 3)
        pts = []
        for x, y, v in kp:
            pts.append((float((x - px) / s), float((y - py) / s), float(v)))
    except Exception as exc:  # noqa: BLE001
        fail(f"inference failed: {exc}")

    def vis(i):
        return pts[i] if pts[i][2] > 0.3 else None

    l_wrist, r_wrist = vis(9), vis(10)
    l_ankle, r_ankle = vis(15), vis(16)
    l_sh, r_sh = vis(5), vis(6)
    unit = abs(l_sh[0] - r_sh[0]) if (l_sh and r_sh) else w * 0.18

    def boxes():
        out = {}
        if l_ankle or r_ankle:
            xs = [p[0] for p in (l_ankle, r_ankle) if p]
            ys = [p[1] for p in (l_ankle, r_ankle) if p]
            cx, cy = sum(xs) / len(xs), sum(ys) / len(ys)
            half = max(unit * 1.5, w * 0.12)
            out["feet"] = (cx - half, cy - half * 0.9, cx + half, cy + half * 1.5)
        if l_wrist or r_wrist:
            xs = [p[0] for p in (l_wrist, r_wrist) if p]
            ys = [p[1] for p in (l_wrist, r_wrist) if p]
            cx, cy = sum(xs) / len(xs), sum(ys) / len(ys)
            half = max(unit * 1.1, w * 0.09)
            out["hands"] = (cx - half, cy - half, cx + half, cy + half)
        return out

    found = boxes()
    order = ["feet", "hands"] if part_req in ("feet", "auto") else ["hands", "feet"]
    picked = None
    for key in order:
        if key in found:
            picked = key
            break
    if not picked:
        fail("no feet/hands keypoints")
    x0, y0, x1, y1 = found[picked]
    x0, y0 = max(0, x0), max(0, y0)
    x1, y1 = min(w, x1), min(h, y1)
    bw, bh = x1 - x0, y1 - y0
    if bw < 32 or bh < 32:
        fail("detected region too small")
    print(json.dumps({
        "ok": True, "part": picked, "conf": round(conf, 3),
        "x": round(x0), "y": round(y0), "w": round(bw), "h": round(bh),
        "image_w": w, "image_h": h,
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
