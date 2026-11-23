# Lumen Studio Flow v0.2.54

完全免费、为爱发电的本地 AI 绘画工作台。Electron + ComfyUI + Anima，本地优先，不上传素材。

## 新增：作品页也能高清化

之前只有「高清化」独立页面能放大，现在补上两处入口：

```text
作品详情页 → ✨ 高清化          单张直接放大，原图保留
作品页批处理 → 批量高清化        勾选多张后一次放大，逐张显示进度
隐藏作品页 → 批量高清化          同样可用；生成的高清副本自动保持隐藏
```

引擎与倍数沿用「高清化」页面上的设置（默认动漫专用模型、2×），无需重复选择。
启动时就会加载引擎列表，所以在任何页面点高清化都会走 AI 模型，不会退回 Lanczos。

删除语义不变：

```text
作品页 / 详情页 / 隐藏页发起 → 原图保留，新增 xxx-hd{倍数}x.png
创作页勾选「自动高清化」     → 超分成功后才删除低清原图
```

## 安装

发布包是单安装器。首次启动如果缺少 ComfyUI / Python，会弹出“一键部署完整环境”，自动下载约 8GB 的 ComfyUI、Python、Anima Base、Qwen3、VAE 和节点。

离线用户可使用 `build_offline_bundle.ps1` 生成独立完整运行环境包，安装后在设置中指向解压目录。

1. 运行 `Lumen-Studio-Flow-Setup-0.2.54.exe`
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
