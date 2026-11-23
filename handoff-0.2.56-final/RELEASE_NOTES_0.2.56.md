# Lumen Studio Flow v0.2.56

完全免费、为爱发电的本地 AI 绘画工作台。Electron + ComfyUI + Anima，本地优先，不上传素材。

## 画风演示图：取消颜色量化，修正偏色

之前为了压体积把预览图做了 256 色量化，副作用是**颜色被压偏**——2.5D 柔光那张的绿眼被压成了青蓝。

现在：

```text
人物类 18 张重新导出：不量化、RGB 直出，竖图 720 宽、横图 1000 宽
风景类 6 张保持原图不动
总体积 6.8MB → 17.3MB（换回准确颜色）
```

同时确认 2.5D 两张演示图都是「3D 手办 + 柔光 / 3D 建模」方向：

```text
2.5D 厚涂   平整、哑光、建模感强
2.5D 柔光   体积光 + 轮廓光 + 湿皮肤反光，绿眼肤色准确
```

两者都是原创角色：棕长发、绿眼、不戴帽、无马耳。

## 安装

发布包是单安装器。首次启动如果缺少 ComfyUI / Python，会弹出“一键部署完整环境”，自动下载约 8GB 的 ComfyUI、Python、Anima Base、Qwen3、VAE 和节点。

离线用户可使用 `build_offline_bundle.ps1` 生成独立完整运行环境包，安装后在设置中指向解压目录。

1. 运行 `Lumen-Studio-Flow-Setup-0.2.56.exe`
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
