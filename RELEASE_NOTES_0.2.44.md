# Lumen Studio Flow v0.2.44

完全免费、为爱发电的本地 AI 绘画工作台。Electron + ComfyUI + Anima，本地优先，不上传素材。

## 2.5D 柔光：治的是「高光用力过猛」

上一版把柔光往低对比、降饱和方向调，那是错的——那会滑向 3D 建模感，属于 **2.5D 厚涂** 的区间。
真正问题是 **高光过曝、镜面过强**，皮肤看起来像塑料。

本版做法：保留原来的柔光基调（柔光 GI、次表面、彩色轮廓光、散景），只收敛高光：

```text
正向：glossy specular skin  →  subtle specular highlights, natural skin sheen,
                              controlled highlights, soft matte finish
负向新增：harsh highlights, blown highlights, overexposed highlights,
          strong specular, wet plastic, plastic skin, latex,
          glossy plastic, excessive reflection, glow bloom, harsh reflections
```

实测（同参考图、同 seed、重绘 0.82）：

```text
CFG 4.5 + 含蓄高光词   皮肤不再泛塑料、高光受控，最接近参考  ← 推荐
CFG 4.0 / 3.5          偏灰、偏平，滑向 3D 建模感（那是「2.5D 厚涂」的区间）
```

所以柔光保持 **CFG 4.5**、重绘 **0.80–0.85**，风格提示里已写明。

> 两个风格的定位现在很清楚：
> **2.5D 厚涂** = 3D 建模质感（你已认可，优先级后延）
> **2.5D 柔光** = 柔光 + 自然高光的插画感（当前主攻）

## 安装

发布包是单安装器。首次启动如果缺少 ComfyUI / Python，会弹出“一键部署完整环境”，自动下载约 8GB 的 ComfyUI、Python、Anima Base、Qwen3、VAE 和节点。

离线用户可使用 `build_offline_bundle.ps1` 生成独立完整运行环境包，安装后在设置中指向解压目录。

1. 运行 `Lumen-Studio-Flow-Setup-0.2.44.exe`
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
