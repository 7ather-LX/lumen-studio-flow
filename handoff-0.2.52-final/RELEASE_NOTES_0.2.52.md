# Lumen Studio Flow v0.2.52

完全免费、为爱发电的本地 AI 绘画工作台。Electron + ComfyUI + Anima，本地优先，不上传素材。

## 新增：高清化加工（独立页面）

侧栏新增「高清化」一栏，和创作界面完全分开。

```text
放大引擎（已随机器安装 3 个 Real-ESRGAN 模型）
  动漫专用超分   RealESRGAN_x4plus_anime_6B（默认，线条干净不添噪点）
  通用超分 4x    RealESRGAN_x4plus（细节纹理更多）
  通用超分 2x    RealESRGAN_x2plus
  快速           Lanczos 纯像素放大（不增强细节，仅作兜底）
放大倍数 2x / 3x / 4x
```

**关于「不改内容」**：整条链路只有 `LoadImage → UpscaleModelLoader → ImageUpscaleWithModel → ImageScale → SaveImage`，
**没有任何采样器（KSampler），不做重绘**，所以角色、风格、构图、细节走向都不会变，只是把像素放大并补足清晰度。

实测（832×1216 的原图）：

```text
源图             1.15 MB
Lanczos 2x       3.01 MB  0.8s
动漫模型 2x      3.34 MB  3.2s
通用模型 2x      4.26 MB  6.5s
```

体积按倍数增长，细节比纯插值更实（发丝、睫毛、水珠边缘更清楚）。

## 新增：自动高清化（创作页）

「输出」面板新增开关：

```text
自动高清化（生成后自动放大，低清图自动删除）  倍数 2x / 3x / 4x
```

勾选后：生成完成 → 自动逐张超分 → 高清图进作品栏 → **低清原图与它的元数据立即删除**，
所以作品栏里不会出现低清版本。

## 新增：隐藏作品

- 作品页顶部新增「作品 / 隐藏作品」两个页签，**隐藏作品单独一页显示，不会和正常作品混在一起**
- 批量：勾选多张 → 隐藏选中 / 取消隐藏
- 单张：作品详情页「隐藏此作品」

隐藏记录保存在 `%APPDATA%\Lumen Studio Flow\hidden-works.json`，只记录文件名，不删除任何文件。

## 其他

2.5D 柔光演示图换成「3D 手办感 + 柔光」版本（体积光、湿皮肤反光、轮廓光），2.5D 质感回到参考图水准。

## 安装

发布包是单安装器。首次启动如果缺少 ComfyUI / Python，会弹出“一键部署完整环境”，自动下载约 8GB 的 ComfyUI、Python、Anima Base、Qwen3、VAE 和节点。

离线用户可使用 `build_offline_bundle.ps1` 生成独立完整运行环境包，安装后在设置中指向解压目录。

1. 运行 `Lumen-Studio-Flow-Setup-0.2.52.exe`
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
