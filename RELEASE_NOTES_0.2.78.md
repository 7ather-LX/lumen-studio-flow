# Lumen Studio Flow v0.2.78

完全免费、为爱发电的本地 AI 绘画工作台。Electron + ComfyUI + Anima，本地优先，不上传素材。

## 压制「水彩 / 凌乱 / 糊成一坨」的画风

你描述的问题有三个来源，全部处理：

### ① 正向词被画风词带偏 → 自动剔除

除非你明确要水彩/水墨/厚涂，否则生成前会从这个提示词里删掉：

```text
watercolor / watercolour / gouache / painterly / painterly brushwork /
oil painting / brush strokes / messy lines / rough lineart / sketchy lineart /
rough sketch / soft focus / hazy / blurry lines / muddy colors / impressionist
```

### ② 负面缺少针对性压制 → 固定注入

每张图负面都追加：

```text
watercolor, painterly, oil painting, brush strokes, messy lines,
rough lineart, sketchy, soft focus, hazy, blurry lines, muddy colors, impressionist
```

### ③ 高清化后过度平滑 → 新增细节强化

放大后自动跑一次「线条与细节强化」：

```text
非锐化掩模（半径随分辨率自适应 1.2–4.0，强度 90%）
边缘增强混合 18%（让线稿更实）
对比 +4%、饱和 +3%（锐化后不发灰）
可用 payload.sharpen=false 关闭（默认开启）
```

## 默认风格再收紧

在原有默认组里补了两个词，明确「线条优先」：

```text
film still, detailed background, anamorphic, anime cel shading, flat colors,
bold clean lineart, crisp lineart, sharp outlines, limited palette,
2D animation key visual
```

## AI 编译器同步

提示词里新增「线条与质感底线」：

```text
必须：bold clean lineart, crisp lineart, sharp outlines, flat colors, clean color fills
禁止：watercolor, painterly, brush strokes, messy lines, rough lineart, sketchy,
     soft focus, hazy, muddy colors, blurry lines, impressionist
判断标准：放大后线条依然清晰、色块分明；出现「水彩晕开 / 笔触凌乱 / 颜色糊成一坨」即不合格
```

## 安装

1. 运行 `Lumen-Studio-Flow-Setup-0.2.78.exe`
2. 首次启动自动部署 ComfyUI + Python + Anima Base + Qwen3 + VAE

GitHub：https://github.com/7ather-LX/lumen-studio-flow
