# Lumen Studio Flow v0.2.37

完全免费、为爱发电的本地 AI 绘画工作台。Electron + ComfyUI + Anima，本地优先，不上传素材。

## 本次更新

- **脚趾/足部修正改为局部精修**：不再整图重绘。现在会裁出脚部区域 → 放大到 1024 重绘 → 缩放回原尺寸 → 羽化贴回，构图、脸、手完全不受影响
- 脚趾提示词强化：五趾、趾序正确、大趾在内侧、趾甲对齐、趾间距均匀
- 脚趾负面词强化：六趾、趾头断开、趾序错乱、趾头融合
- **性能档新增「自定义 · 用手动参数」**：步数 / CFG / 数量 / 高清放大不再被档位强制覆盖
- **新增「生成后自动修正足部/手部细节」开关**：不需要二次修正时可以关掉，只出首遍原图
- 重绘幅度滑杆精度 5% → 1%，0.85 / 0.88 / 0.90 现在可以精确输入
- 修复：参考图加载后再点画幅按钮，画幅会正确覆盖「跟随参考图」

## 2.5D 厚涂推荐参数（照参考图换角色）

```text
画风：2.5D 厚涂
参考图：原图（构图/动作参考）
画幅：3:4（896 × 1152）
性能档：自定义
步数：32　CFG：4.5　重绘幅度：0.88
种子：固定（例如 1601600）
数量：1
自动识别画风：关
自动修正足部：按需
```

低于 0.85 会残留原图头发颜色，0.88–0.90 最稳。

## 安装

发布包是单安装器。首次启动如果缺少 ComfyUI / Python，会弹出“一键部署完整环境”，自动下载约 8GB 的 ComfyUI、Python、Anima Base、Qwen3、VAE 和节点。

离线用户可使用 `build_offline_bundle.ps1` 生成独立完整运行环境包，安装后在设置中指向解压目录。

1. 运行 `Lumen-Studio-Flow-Setup-0.2.37.exe`
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
