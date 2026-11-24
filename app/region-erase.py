#!/usr/bin/env python
"""框选擦除：用邻近最平整的区域覆盖选中矩形，边界羽化。

用法：
  python region-erase.py <输入图片> <输出图片> <x> <y> <w> <h>

原理：不调用任何生成模型，纯像素克隆 + 羽化融合，
      所以不会「重画成别的东西」。之后可由调用方决定是否再做低幅度融合。
"""
import sys


def main() -> int:
    if len(sys.argv) < 7:
        print("usage: region-erase.py <in> <out> <x> <y> <w> <h>")
        return 2
    src_path, out_path = sys.argv[1], sys.argv[2]
    x, y, w, h = (int(v) for v in sys.argv[3:7])

    from PIL import Image, ImageFilter

    im = Image.open(src_path).convert("RGB")
    W, H = im.size
    x = max(0, min(W - 8, x))
    y = max(0, min(H - 8, y))
    w = max(8, min(W - x, w))
    h = max(8, min(H - y, h))

    wanted = sys.argv[7].lower() if len(sys.argv) > 7 else "auto"
    donors = {
        "up": (x, y - h, x + w, y),
        "down": (x, y + h, x + w, y + h * 2),
        "left": (x - w, y, x, y + h),
        "right": (x + w, y, x + w * 2, y + h),
    }
    order = {"auto": ["up", "down", "left", "right"]}.get(wanted, [wanted])
    candidates = []
    for name in order:
        box = donors.get(name)
        if not box:
            continue
        bx0, by0, bx1, by1 = box
        if bx0 < 0 or by0 < 0 or bx1 > W or by1 > H:
            continue
        candidates.append((name, box))
    if not candidates:
        candidates.append(("down", (min(W - w, x), max(0, min(H - h, y + h)), min(W, x + w), min(H, y + 2 * h))))

    _, donor_box = candidates[0]
    donor = im.crop(donor_box).resize((w, h), Image.LANCZOS)

    # 若供体与目标紧邻，翻转一下，避免出现明显重复纹理
    if donor_box[0] == x:
        donor = donor.transpose(Image.FLIP_TOP_BOTTOM)
    else:
        donor = donor.transpose(Image.FLIP_LEFT_RIGHT)

    mask = Image.new("L", (w, h), 255)
    px = mask.load()
    feather = max(6, min(48, int(min(w, h) * 0.12)))
    for i in range(feather):
        v = int(255 * i / feather)
        for k in range(w):
            px[k, i] = min(px[k, i], v)
            px[k, h - 1 - i] = min(px[k, h - 1 - i], v)
        for k in range(h):
            px[i, k] = min(px[i, k], v)
            px[w - 1 - i, k] = min(px[w - 1 - i, k], v)
    mask = mask.filter(ImageFilter.GaussianBlur(max(2, feather // 4)))

    out = im.copy()
    out.paste(donor.filter(ImageFilter.GaussianBlur(1.5)), (x, y), mask)
    out.save(out_path)
    print(f'{{"ok": true, "donor": "{candidates[0][0]}", "rect": [{x}, {y}, {w}, {h}], "saved": "{out_path}"}}')
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
