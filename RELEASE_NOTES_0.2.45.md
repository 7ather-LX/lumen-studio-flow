# Lumen Studio Flow v0.2.45

完全免费、为爱发电的本地 AI 绘画工作台。Electron + ComfyUI + Anima，本地优先，不上传素材。

## 2.5D 柔光：把镜面反射换成漫反射

上一版只是「收敛」高光，本质还是镜面。这版按参考图的做法，直接把皮肤改成 **漫反射**：

```text
正向：diffuse reflection, soft diffuse highlights, matte skin,
      smooth diffuse shading, even skin lighting
负向：specular highlights, mirror reflection, glossy skin, wet skin shine,
      harsh reflected light, plastic sheen, latex, blown highlights,
      overexposed highlights, glow bloom
```

实测（同参考图 / seed / 重绘 0.82 / CFG 4.5）：

```text
H2 含蓄镜面   皮肤仍带柔光斑
H3 纯漫反射   胸口/腹部/大腿的镜面斑块消失，皮肤均匀柔和，最接近参考  ← 采用
```

风格定位不变：

```text
2.5D 厚涂   3D 建模质感（已认可，优先级后延）
2.5D 柔光   漫反射插画质感，CFG 4.5、重绘 0.80–0.85，当前主攻
```

## 安装

发布包是单安装器。首次启动如果缺少 ComfyUI / Python，会弹出“一键部署完整环境”，自动下载约 8GB 的 ComfyUI、Python、Anima Base、Qwen3、VAE 和节点。

离线用户可使用 `build_offline_bundle.ps1` 生成独立完整运行环境包，安装后在设置中指向解压目录。

1. 运行 `Lumen-Studio-Flow-Setup-0.2.45.exe`
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
