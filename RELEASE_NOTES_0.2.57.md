# Lumen Studio Flow v0.2.57

完全免费、为爱发电的本地 AI 绘画工作台。Electron + ComfyUI + Anima，本地优先，不上传素材。

## 修复：2.5D 柔光悬停不出预览图

现象：鼠标停在「2.5D 柔光」上只弹出浏览器原生的文字提示，没有预览图。

原因：悬停预览靠一张「画风 key → 文件名」的映射表，表里**漏了 `2.5d-thick-soft` 这一项**，
代码取不到文件名就直接 return 了，所以弹窗从未显示。

修复：把 `2.5d-thick-soft` 补进映射表，并逐个核对了 24 个画风：
现在 24 个 chip 全部有对应预览文件，没有遗漏。

## 修复：左下角版本号写着 v0.2.36

版本号是写死在 HTML 里的旧字符串，安装新版本也不会变（容易误判自己在跑旧版）。

现在改为启动时通过 `app.getVersion()` 读取真实版本，显示在左下角。

## 安装

发布包是单安装器。首次启动如果缺少 ComfyUI / Python，会弹出“一键部署完整环境”，自动下载约 8GB 的 ComfyUI、Python、Anima Base、Qwen3、VAE 和节点。

离线用户可使用 `build_offline_bundle.ps1` 生成独立完整运行环境包，安装后在设置中指向解压目录。

1. 运行 `Lumen-Studio-Flow-Setup-0.2.57.exe`
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
