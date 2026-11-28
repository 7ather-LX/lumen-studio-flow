"""生成 Lite 版品牌资源：琥珀色图标 + 独立配色。"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

APP = Path(r"F:\DSH WORKSPACE\lumen-flow\app")
ACCENT = (255, 196, 107)
ACCENT_DIM = (201, 154, 79)
BG = (18, 14, 10)


def icon(size: int) -> Image.Image:
    img = Image.new("RGBA", (size * 4, size * 4), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    s = size * 4
    r = int(s * 0.24)
    # 圆角底
    for i in range(s):
        t = i / s
        col = (
            int(BG[0] + (34 - BG[0]) * t),
            int(BG[1] + (26 - BG[1]) * t),
            int(BG[2] + (16 - BG[2]) * t),
            255,
        )
        d.line([(0, i), (s, i)], fill=col)
    mask = Image.new("L", (s, s), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, s - 1, s - 1], r, fill=255)
    base = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    base.paste(img, (0, 0), mask)
    d = ImageDraw.Draw(base)
    # 琥珀色描边
    d.rounded_rectangle([2, 2, s - 3, s - 3], r, outline=ACCENT + (200,), width=max(2, s // 96))
    # 字母 L
    font = ImageFont.truetype(r"C:\Windows\Fonts\msyhbd.ttc", int(s * 0.52))
    box = d.textbbox((0, 0), "L", font=font)
    w, h = box[2] - box[0], box[3] - box[1]
    d.text(((s - w) / 2 - box[0], (s - h) / 2 - box[1] - s * 0.04), "L", font=font, fill=ACCENT + (255,))
    # 右上角闪电点
    d.polygon([(s * 0.70, s * 0.16), (s * 0.82, s * 0.16), (s * 0.74, s * 0.30), (s * 0.80, s * 0.30),
               (s * 0.66, s * 0.48), (s * 0.70, s * 0.32), (s * 0.64, s * 0.32)], fill=(255, 255, 255, 235))
    return base.resize((size, size), Image.LANCZOS)


big = icon(512)
big.save(APP / "icon-lite-512.png")
icon(256).save(APP / "icon-lite-256.png")
icon(256).save(APP / "icon-lite.png")
big.save(APP / "icon-lite.ico", sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
print("icons ok")

css = (APP / "renderer" / "styles.css").read_text(encoding="utf-8")
css = css.replace("--lime: #d6ff79;", f"--lime: #{ACCENT[0]:02x}{ACCENT[1]:02x}{ACCENT[2]:02x};")
css = css.replace("--lime-dim: #9fbf58;", f"--lime-dim: #{ACCENT_DIM[0]:02x}{ACCENT_DIM[1]:02x}{ACCENT_DIM[2]:02x};")
(APP / "renderer" / "styles-lite.css").write_text(css, encoding="utf-8")
print("styles-lite.css ok")
