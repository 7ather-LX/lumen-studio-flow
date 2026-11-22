# Lumen Studio Flow v0.2.43

完全免费、为爱发电的本地 AI 绘画工作台。Electron + ComfyUI + Anima，本地优先，不上传素材。

## 2.5D 柔光：朝参考图再进一步

针对 pool 参考图重调了柔光风格词，解决旧版「太塑料、太霓虹」的问题：

```text
去掉：volumetric light / glossy specular skin / 强 neon 描述
加入：soft diffuse lighting, gentle rim light, atmospheric haze,
      muted colors, low contrast, pastel tone, filmic color grading,
      soft skin shading, mild specular highlights, natural skin texture
负面新增：oversaturated, neon glow, plastic skin, latex, harsh highlights,
          high contrast, glossy plastic, harsh shadows
```

实测对比（同一参考图、同 seed、重绘 0.82）：

```text
CFG 4.5  塑料感、霓虹过饱和（旧版）
CFG 4.0  饱和度与对比明显下降，最接近参考图  ← 推荐
CFG 3.5  更平更灰，画面发闷
```

所以柔光风格的提示词建议 **CFG 4.0**、重绘 **0.80–0.85**（已写进风格提示）。

## 界面简化：次要面板默认折叠

创作页太长的问题，现在这些面板默认收起，右上角「展开/收起」随时打开：

- 标准提示词顺序（ANIMA 结构化提示词）
- 角色参考（可选）
- 质感 / 部位参考（可选）
- 简化工作流

核心操作（提示词、画风、参考图、画幅、档位、输出）保持展开，页面长度约减半。

## 安装

发布包是单安装器。首次启动如果缺少 ComfyUI / Python，会弹出“一键部署完整环境”，自动下载约 8GB 的 ComfyUI、Python、Anima Base、Qwen3、VAE 和节点。

离线用户可使用 `build_offline_bundle.ps1` 生成独立完整运行环境包，安装后在设置中指向解压目录。

1. 运行 `Lumen-Studio-Flow-Setup-0.2.43.exe`
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
