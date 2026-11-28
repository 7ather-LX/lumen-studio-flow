# Lumen Studio Flow Lite v1.0.0

完全免费、本地优先的 **轻量版** AI 绘画软件。为低配笔记本和没有独立显卡的机器准备。

> 和主线（Lumen Studio Flow）是两条独立产品线，共用一套绘画引擎，但默认参数、提示词模型、体积都做了瘦身。

## 这版轻在哪

| 项目 | 主线 | Lite |
|---|---|---|
| 提示词模型 | 9B（5.2 GB） | **Qwen2.5-Coder-3B（2.0 GB）** |
| 提示词显存 | ~5.3 GB | **~2.1 GB** |
| 提示词速度 | 约 5.6 秒/次 | **约 2–4 秒/次（CPU 也可 2–3 秒）** |
| 默认性能档 | 自动（按显存选） | **低显存档 512×768** |
| 默认步数 / 张数 | 30 步 / 3 张 | **20 步 / 1 张** |
| 默认高清修复 | 按档位 | **关闭** |
| 画图模型 | Anima 2.9B / Base | **Anima Base** |

省下的主要是提示词模型：安装后首次部署少下 3.2 GB，6 GB 显存的笔记本可以同时挂 LLM 和画图。

## 能跑在什么机器上

```text
NVIDIA 4–6 GB 显存   推荐配置，512×768 十几秒一张
AMD / Intel 核显     自动 CPU 模式，一张几分钟，能出图
内存 8 GB 起         建议 16 GB
硬盘 15 GB           模型 + 作品
```

## 和主线的关系

```text
同一套 ComfyUI 引擎、同一套角色库、同样的提示词与标签系统
Lite 只是默认值更保守 + 提示词模型更小，功能一个不少
两条线的数据目录彼此独立（Lumen Studio Flow / Lumen Studio Flow Lite），可以同时装
```

## 安装

1. 下载 `Lumen-Studio-Flow-Lite-Setup-1.0.0.exe`，双击安装，桌面会有琥珀色图标的快捷方式
2. 第一次启动自动部署引擎与模型（比主线少约 3 GB）
3. 想要本地 AI 写提示词，再跑一次：

```powershell
powershell -ExecutionPolicy Bypass -File bootstrap_models.ps1 -LlmModel coder-3b
```

## 实测（同一套提示词任务）

```text
Qwen2.5-Coder-3B Q4   6 例中 5 例通过，平均 4.4 秒（中位 2 秒）
9B 主线模型           6 例全过，平均 5.6 秒
结论：3B 够用，胜在体积小、显存低、速度快；极复杂场景略逊于 9B
```

## 回归

```text
qa-flow 24/24 · qa-prompts 10/10 · qa-appearance 5/5 · qa-traits 6/6 · qa-sanitize 6/6
合计 51 项
```

## 已知差异

```text
Lite 不做自动高清修复，需要时手动点「高清化」
提示词偶发 JSON 格式抖动，软件会自动重试一次
```

GitHub：https://github.com/7ather-LX/lumen-studio-flow
