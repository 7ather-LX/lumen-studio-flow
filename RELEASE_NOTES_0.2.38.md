# Lumen Studio Flow v0.2.38

完全免费、为爱发电的本地 AI 绘画工作台。Electron + ComfyUI + Anima，本地优先，不上传素材。

## 本次更新

- **局部精修可选择部位**：自动判断 / 脚部 / 手部 / 脚 + 手。手部会注入五指令牌与六指负面词
- **局部精修可选择区域**：下半部 / 中部 / 上半部 / 左侧 / 右侧。特写构图脚不在下方时不再裁空
- 精修工作流抽成独立模块 `detail-workflow.cjs`，可在不启动界面的情况下离线断言与实图验证
- 精修贴回仍是羽化混合，只改选中区域，脸、手、构图不受影响
- 生成后自动修正的提示词不再重复堆叠（部位词改由模块统一注入）

## 2.5D 厚涂参数结论（固定 seed 实测）

```text
denoise 0.60–0.75  头发洗成灰白、构图不稳 —— 不可用
denoise 0.80       头发仍带原图深棕/黑
denoise 0.85       转蓝但偏紫、发丝偏暗
denoise 0.88–0.90  干净浅蓝，推荐（旧对话成功值 0.88）
```

推荐组合：2.5D 厚涂 + 参考图 img2img + 自定义档 32 步 / CFG 4.5 / 0.88 / seed 1601600，
关闭「自动识别画风」。低于 0.85 会残留原图发色。

## 安装

发布包是单安装器。首次启动如果缺少 ComfyUI / Python，会弹出“一键部署完整环境”，自动下载约 8GB 的 ComfyUI、Python、Anima Base、Qwen3、VAE 和节点。

离线用户可使用 `build_offline_bundle.ps1` 生成独立完整运行环境包，安装后在设置中指向解压目录。

1. 运行 `Lumen-Studio-Flow-Setup-0.2.38.exe`
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
