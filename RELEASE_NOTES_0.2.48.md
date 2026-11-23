# Lumen Studio Flow v0.2.48

完全免费、为爱发电的本地 AI 绘画工作台。Electron + ComfyUI + Anima，本地优先，不上传素材。

## 修复：画风演示图用错角色

鼠标悬停画风选项时会显示风格演示图。为避免使用他人角色引起纠纷，演示图统一使用原创角色
（绿军装 / 绿贝雷+马蹄徽 / 棕长发 / 绿眼），但有两个文件是错的：

```text
2.5d-thick.png       显示的是别的角色（目白阿尔丹）
2.5d-thick-soft.png  显示的是别的角色（目白阿尔丹）
```

原因：这两个文件在调 2.5D 质感时被我换成了实验输出，忘了换回原创角色。已修正。

现在 24 张演示图**全部**是同一个原创角色：

```text
2.5D 厚涂   温泉回眸 · 伪 3D 立体感（体积光 / 环境光遮蔽 / 次表面 / 镜面高光）
2.5D 柔光   温泉回眸 · 漫反射皮肤 + 柔和高光 + 发丝质感
其余 22 种画风   保持原本的立绘风格演示
```

生成用词依据你给的两段温泉提示词，只把角色替换成原创角色（棕长发 / 绿眼 / 绿贝雷马蹄徽 /
马耳马尾），风格词直接取软件内该画风当前的真实标签，所以演示图与实际出图一致。

## 安装

发布包是单安装器。首次启动如果缺少 ComfyUI / Python，会弹出“一键部署完整环境”，自动下载约 8GB 的 ComfyUI、Python、Anima Base、Qwen3、VAE 和节点。

离线用户可使用 `build_offline_bundle.ps1` 生成独立完整运行环境包，安装后在设置中指向解压目录。

1. 运行 `Lumen-Studio-Flow-Setup-0.2.48.exe`
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
