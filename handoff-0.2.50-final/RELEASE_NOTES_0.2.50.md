# Lumen Studio Flow v0.2.50

完全免费、为爱发电的本地 AI 绘画工作台。Electron + ComfyUI + Anima，本地优先，不上传素材。

## 自动区域：脚部定位更稳

「自动（检测脚/手位置）」在两处会误判，本版修正：

```text
1. 请求「脚」但只检测到手时，之前会返回手的框 → 现在脚永远有自己的框：
   脚踝可见 → 用脚踝做紧框；脚踝不可见（抬腿/遮挡）→ 用踝/膝/胯的包围盒向上扩
2. 抬腿时脚在膝盖上方，旧逻辑会把框放在小腿甚至躯干上 → 现按肩宽比例上扩
```

实测三张图：

```text
沙发图（脚抬到画面左中）  按脚踝紧框 477×420，完整覆盖双脚
站姿半身（脚不可见）      退化到下半部宽框，不再误返回手
特写图（脚在画面底部）    按脚踝紧框 645×404
```

## 顺带验证：局部重绘能做到什么程度

同一张图（脚抬在沙发上、趾头粘连）对比了四种做法：

```text
原图                     上脚趾数粘连
大范围 0.45 一次          趾头分得开一些，结构不变
理想框 0.42 / 0.55       比大范围略好，仍然只是「分离度」改善
极小范围 0.35 两次        区域只有 344×120，装不下两只脚，几乎无效
```

结论：**局部 img2img 只能改善细节清晰度与趾头分离，改不了趾数与趾序这类结构错误**。
要修结构，需要深度/线稿约束（ControlNet 级）或脚部专用的检测分割模型，单靠重绘幅度没用。
另外「小范围」不能盲目设太小——区域必须真的装得下目标，建议 0.6–0.8 起调。

## 安装

发布包是单安装器。首次启动如果缺少 ComfyUI / Python，会弹出“一键部署完整环境”，自动下载约 8GB 的 ComfyUI、Python、Anima Base、Qwen3、VAE 和节点。

离线用户可使用 `build_offline_bundle.ps1` 生成独立完整运行环境包，安装后在设置中指向解压目录。

1. 运行 `Lumen-Studio-Flow-Setup-0.2.50.exe`
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
