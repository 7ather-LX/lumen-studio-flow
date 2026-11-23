# Lumen Studio Flow v0.2.53

完全免费、为爱发电的本地 AI 绘画工作台。Electron + ComfyUI + Anima，本地优先，不上传素材。

## 修复：自动高清化没走 AI 模型

上一版「自动高清化」只传了倍数、没传引擎，主进程于是退回 Lanczos（纯插值，不够清晰）。

现在：

```text
默认：自动选择最好的模型（优先动漫专用 RealESRGAN_x4plus_anime_6B）
也可在开关旁手动指定：动漫模型 / 通用 4x / 通用 2x / Lanczos
主进程兜底：未传模型时同样优先选动漫模型，其次 4x，最后任意可用模型
```

## 删除语义（已核对代码，确认无误）

```text
创作页勾选「自动高清化」→ 生成后超分，成功后才删除低清原图与它的 json
作品栏 / 高清化页手动放大 → 只新增 xxx-hd{倍数}x.png，原图保留，两张都在作品栏
超分失败 → 原图不删（catch 兜住）
```

全文件只有 4 处删除调用：自动高清化 2 处（原图 + json）、删除作品 1 处、参考图移除 1 处。

## 安装

发布包是单安装器。首次启动如果缺少 ComfyUI / Python，会弹出“一键部署完整环境”，自动下载约 8GB 的 ComfyUI、Python、Anima Base、Qwen3、VAE 和节点。

离线用户可使用 `build_offline_bundle.ps1` 生成独立完整运行环境包，安装后在设置中指向解压目录。

1. 运行 `Lumen-Studio-Flow-Setup-0.2.53.exe`
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
