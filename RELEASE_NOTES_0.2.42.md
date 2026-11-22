# Lumen Studio Flow v0.2.42

完全免费、为爱发电的本地 AI 绘画工作台。Electron + ComfyUI + Anima，本地优先，不上传素材。

## 新增：构图档位

按构图一次设好画幅与推荐重绘幅度：

```text
特写 / 脸与局部   3:4  · 896×1152 · 重绘 88%
半身              2:3  · 832×1216 · 重绘 82%
全身 / 全景       16:9 · 1216×688 · 重绘 75%
```

依据是这轮的固定 seed 实测（24 步 / CFG 4.5 / 2.5D 伪 3D）：

```text
特写：0.80 残留原图深棕/黑发；0.85 偏紫；0.88–0.90 干净
半身：0.75 与 0.85 构图基本保持；0.90 发量膨胀、道具移位
全身：0.75 构图最稳；0.85 人物缩小、偏紫；0.90 明显跑色
```

两条重要经验（已写进使用说明）：

1. **全景不要用 0.85 以上**——提示词会压过参考图，人物缩小跑色，甚至整张被重画成特写。
2. **提示词里的构图词必须和目标构图一致**（close-up / cowboy shot / full body），否则再低的 denoise 也留不住构图。
   实测反例：用「close-up, face focus」去跑半身参考图，0.75 就开始崩构图。

## 使用说明

「8. 参数说明」补充构图档位与上面两条经验。

## 安装

发布包是单安装器。首次启动如果缺少 ComfyUI / Python，会弹出“一键部署完整环境”，自动下载约 8GB 的 ComfyUI、Python、Anima Base、Qwen3、VAE 和节点。

离线用户可使用 `build_offline_bundle.ps1` 生成独立完整运行环境包，安装后在设置中指向解压目录。

1. 运行 `Lumen-Studio-Flow-Setup-0.2.42.exe`
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
