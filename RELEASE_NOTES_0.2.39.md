# Lumen Studio Flow v0.2.39

完全免费、为爱发电的本地 AI 绘画工作台。Electron + ComfyUI + Anima，本地优先，不上传素材。

## 本次更新

### 2.5D 厚涂质感对齐参考图

风格词改为「柔光 + 彩色轮廓光 + 次表面透光 + 弱线条」组合，皮肤更透、边缘更柔、背景更散景，
更接近 `reference-2.5d.png` 的目标质感（不再偏赛璐珞硬边）。

### 出图档位（新增）

一次设好「重绘幅度 + 风格强度」，不用再手动试：

```text
轻修细节           重绘 30%
保构图换质感       重绘 45%
换角色保构图       重绘 70%
换角色 + 2.5D 厚涂  重绘 88%（推荐）
自定义             不干预滑杆
```

### 局部精修增强

- 新增 **精修范围**：大范围 / 中范围 / 小范围 / 极近。范围越小放大倍数越高，趾头、指头看得越清
- 新增 **精修轮次**：单次 / 两次。两次会在第一次结果上再修一遍（denoise 0.45 → 0.30），趾列更稳
- 精修部位 / 精修区域 沿用 0.2.38

### 使用说明

新增「8. 参数说明」：重绘幅度、风格 LoRA 强度、步数、CFG、种子、出图档位、精修各项到底管什么、
什么时候该调、调多少合适，都写清楚了。

### 图标修复

桌面快捷方式改为指向安装目录内的 `resources\icon.ico`，并刷新 Windows 图标缓存，
不再出现「桌面是黑白原子、应用内是黄黑开关」不一致的问题。

## 2.5D 厚涂推荐参数

```text
画风：2.5D 厚涂　　参考图：原图（构图/动作）
画幅：3:4（896×1152）　　性能档：自定义
步数 32　CFG 4.5　重绘幅度 0.88　种子：固定　数量 1
自动识别画风：关　　自动修正足部：按需（范围选小范围 + 两次）
```

## 安装

发布包是单安装器。首次启动如果缺少 ComfyUI / Python，会弹出“一键部署完整环境”，自动下载约 8GB 的 ComfyUI、Python、Anima Base、Qwen3、VAE 和节点。

离线用户可使用 `build_offline_bundle.ps1` 生成独立完整运行环境包，安装后在设置中指向解压目录。

1. 运行 `Lumen-Studio-Flow-Setup-0.2.39.exe`
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
