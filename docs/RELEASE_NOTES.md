# Lumen Studio Flow v0.1.0

新的独立项目：**ComfyUI + Anima** 驱动的单屏动漫出图工具。

原版 Lumen Studio 继续保留原功能；Flow 不覆盖原项目。

## 本次完成

- 本地 ComfyUI 0.46.0 部署
- Anima Base v1.0 模型接入
  - `anima-base-v1.0.safetensors`
  - `qwen_3_06b_base.safetensors`
  - `qwen_image_vae.safetensors`
- 简化工作流：

```text
UNETLoader -> CLIPLoader -> CLIPTextEncode
-> EmptyLatentImage -> KSampler -> VAEDecode -> SaveImage
```

- 新 UI：单屏提示词、画幅、步数、CFG、数量、种子
- 本地输出画廊
- ComfyUI 健康检查与一键启动
- 自定义 ComfyUI 目录 / 模型文件名
- 便携版与源码包

## 实测

本机 CPU 环境：

- ComfyUI 0.46.0
- Anima Base v1.0
- 768 × 768
- 20 steps
- CFG 4
- euler / simple
- 用时约 14 分 47 秒

应用内实测（512 × 512 / 10 steps）：

![Flow app result](app-result.png)

高分辨率测试：

![Anima 测试](anima-hero.png)

NVIDIA GPU 会明显更快；模型和 ComfyUI 的 CUDA Python 需要单独安装。

## 安装

1. 解压 `Lumen-Studio-Flow-0.1.0-portable.zip`
2. 运行 `electron.exe`
3. 在设置里指定 ComfyUI 目录
4. 确认 Anima 三个模型文件
5. 生成

完整步骤见 [SETUP.md](SETUP.md)。

## 不包含

- ComfyUI 本体
- Anima / Qwen / VAE 模型
- 原 Lumen 的角色参考库、脚部修复、LoRA 训练
- 任何第三方角色图片

## 免责声明

- 与角色/作品版权方无隶属关系
- 模型、提示词、生成结果由使用者负责
- 不要重新分发第三方图片或模型
- 软件按现状提供
