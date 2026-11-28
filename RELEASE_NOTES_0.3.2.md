# Lumen Studio Flow v0.3.2

完全免费、为爱发电的本地 AI 绘画工作台。Electron + ComfyUI + Anima，本地优先，不上传素材。

## 高清化恢复为「独立生成高清版本」，不再覆盖原图

上一版把"覆盖原图"的逻辑错用到了高清化上，这次撤回：

```text
高清化 → 生成 xxx-hd2x.png / xxx-hd4x.png，原图完整保留
批量高清化 → 同样保留原图，只新增高清版本
重修（面部精修 / 自动修正 / 局部修正）→ 已在 0.3.1 整体取消，不受影响
```

画廊里会同时看到原图和高清版，这是一直以来的正常行为。

## 回归

```text
qa-flow 24/24（含：高清化保留原图、重修已取消）
qa-prompts 10/10 · qa-appearance 5/5 · qa-traits 6/6 · qa-sanitize 6/6
合计 51 项
```

## 安装

1. 运行 `Lumen-Studio-Flow-Setup-0.3.2.exe`
2. 首次启动自动部署 ComfyUI + Python + Anima Base + Qwen3 + VAE

GitHub：https://github.com/7ather-LX/lumen-studio-flow
