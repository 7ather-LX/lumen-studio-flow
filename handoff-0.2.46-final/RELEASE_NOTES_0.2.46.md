# Lumen Studio Flow v0.2.46

完全免费、为爱发电的本地 AI 绘画工作台。Electron + ComfyUI + Anima，本地优先，不上传素材。

## 2.5D 柔光：头发去塑料感

身体的高光在 0.2.45 已经合格，这版专治**头发像 3D 手办**的问题。

根因：风格词里有 `3D anime figure render`，它会把头发当成建模体渲染，出现成片的硬高光带。

改法：

```text
移除：3D anime figure render
换成：anime illustration rendering + 发丝类词
      detailed individual hair strands, silky hair, natural hair flow,
      wispy strands, layered hair, matte hair with gentle sheen,
      hair strands catching soft light, anime hair shading
负面加：plastic hair, sculpted hair, helmet hair, hard hair highlights,
        glossy hair, metal hair, bright white highlight streak on hair,
        hard specular band on hair, clumped hair, hair blob, resin hair, toy hair
```

实测（同参考图 / seed / 重绘 0.82 / CFG 4.5）：

```text
H4 原始          刘海一条贯穿式硬高光，头发成块
H5 加发丝词       发丝分得开，高光仍偏硬
H6 去 3D 手办词   硬高光带基本消失，发丝可见，最接近参考  ← 采用
```

## 安装

发布包是单安装器。首次启动如果缺少 ComfyUI / Python，会弹出“一键部署完整环境”，自动下载约 8GB 的 ComfyUI、Python、Anima Base、Qwen3、VAE 和节点。

离线用户可使用 `build_offline_bundle.ps1` 生成独立完整运行环境包，安装后在设置中指向解压目录。

1. 运行 `Lumen-Studio-Flow-Setup-0.2.46.exe`
2. 安装会创建桌面快捷方式
3. 运行 `bootstrap_models.ps1` 自动拉取 Anima Base / Qwen3 / VAE
4. 将 `Anima-2.9B-preview-v1.safetensors` 放入 `models/diffusion_models`
5. 在设置中确认 ComfyUI / Python / F 盘输出目录

## 本地生成

本地 ComfyUI 生成无次数限制；外部 API 仅在 `engine=api` 时使用。

## 模型与 LoRA

- 25d_anima_v5
- hand_anima_v1
- foot_anima_v4
- fabric_anima_v3

GitHub：https://github.com/7ather-LX/lumen-studio-flow
