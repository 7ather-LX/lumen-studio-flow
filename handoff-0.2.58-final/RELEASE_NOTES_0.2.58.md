# Lumen Studio Flow v0.2.58

完全免费、为爱发电的本地 AI 绘画工作台。Electron + ComfyUI + Anima，本地优先，不上传素材。

## 新增：高清化支持导入本机图片

高清化页面新增「导入本机图片」：

```text
支持 PNG / JPG / WEBP
选图后显示缩略图与文件大小
开始高清化 → 超分结果自动写入作品库（作品栏立即可见）
文件名保留原名：xxx-hd2x.png
详情页会标记「高清化 N× · AI 模型」并记录 imported / 原始文件名
```

导入的图沿用页面上的倍数与引擎设置（默认动漫专用模型、2×），
输出同样只做超分、不经过采样器，画面内容不会变。

## 修复：侧栏编号与位置不一致

「高清化」编号是 10，却排在 08 工作流与 09 使用说明之间。
现在顺序为 01…09 之后才是 10。

## 安装

发布包是单安装器。首次启动如果缺少 ComfyUI / Python，会弹出“一键部署完整环境”，自动下载约 8GB 的 ComfyUI、Python、Anima Base、Qwen3、VAE 和节点。

离线用户可使用 `build_offline_bundle.ps1` 生成独立完整运行环境包，安装后在设置中指向解压目录。

1. 运行 `Lumen-Studio-Flow-Setup-0.2.58.exe`
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
