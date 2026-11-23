# Lumen Studio Flow v0.2.55

完全免费、为爱发电的本地 AI 绘画工作台。Electron + ComfyUI + Anima，本地优先，不上传素材。

## 修复：高清化后丢失生成参数

现象：高清化出来的作品，详情页里提示词、步数、CFG、种子、模型全是空。

原因：高清化时写的新 json 只记录了放大信息，没有继承原图的生成元数据。

修复：

```text
1. 高清化写 json 时先读取原图同名 json，整份继承
   （prompt / negativePrompt / seed / steps / cfg / model / lora …）
   再叠加放大字段：upscaled / source / factor / engine / sourceWidth / sourceHeight / width / height
2. 详情页在放大作品上额外显示：
   模式行：高清化 2× · AI 模型
   尺寸行：832 × 1216 → 1664 × 2432
```

注意：**在此之前已经高清化过的旧文件**，其 json 已经被覆盖，参数无法追回；
重新高清化一次即可带上完整信息（原图仍在的话）。

## 安装

发布包是单安装器。首次启动如果缺少 ComfyUI / Python，会弹出“一键部署完整环境”，自动下载约 8GB 的 ComfyUI、Python、Anima Base、Qwen3、VAE 和节点。

离线用户可使用 `build_offline_bundle.ps1` 生成独立完整运行环境包，安装后在设置中指向解压目录。

1. 运行 `Lumen-Studio-Flow-Setup-0.2.55.exe`
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
