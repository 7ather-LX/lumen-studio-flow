# Lumen Studio Flow v0.2.47

完全免费、为爱发电的本地 AI 绘画工作台。Electron + ComfyUI + Anima，本地优先，不上传素材。

## 新增：精修区域「自动（检测脚/手位置）」

以前精修只能按比例切（下半部 / 中部 / 左侧…），遇到「脚抬到画面中上部」「多只脚」就会切空。
现在用本地位姿模型自动找位置：

```text
模型：YOLOv8n-pose（ONNX，12.9 MB，随安装包一起分发）
推理：onnxruntime CPU，纯本地，不联网、不上传
输出：按手腕 / 脚踝关键点算出脚、手区域，再交给局部精修
回退：检测失败或环境缺 onnxruntime 时，自动退回你选的比例区域，不报错
```

实测（1176×664 的沙发图，脚在画面左中）：

```text
比例预设（下半部）  x=117 y=298 w=941 h=332   → 切掉脚的上一半
自动检测            x=117 y=244 w=477 h=420   → 完整覆盖双脚
```

配置要求：软件调用的是 ComfyUI 用的同一个 Python，需要该环境装有 `onnxruntime`。
本机已安装（1.32.0）；其他机器没装时会安静回退到比例区域。

## 使用

参考图下方的「精修区域」新增最后一项：**自动（检测脚/手位置）**。
建议搭配「精修部位 = 自动/脚部」「精修范围 = 小/极近」。

## 安装

发布包是单安装器。首次启动如果缺少 ComfyUI / Python，会弹出“一键部署完整环境”，自动下载约 8GB 的 ComfyUI、Python、Anima Base、Qwen3、VAE 和节点。

离线用户可使用 `build_offline_bundle.ps1` 生成独立完整运行环境包，安装后在设置中指向解压目录。

1. 运行 `Lumen-Studio-Flow-Setup-0.2.47.exe`
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
