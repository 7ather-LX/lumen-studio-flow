# Lumen Studio Flow v0.2.84 · Legacy（旧模型终极版）

完全免费、为爱发电的本地 AI 绘画工作台。Electron + ComfyUI + Anima，本地优先，不上传素材。

> 这是搭载旧提示词模型（DeepSeek-V4-Pro-Qwen3.5-9B）的最后一版。
> 后续新模型将以新产品线单独发布，这一版会保留在 Releases 里供下载。

## 本地 AI 上下文：4096 → 8192（可调）

之前写死 `--ctx-size 4096`，带角色事实与多轮对话时容易被截断：

```text
现在默认 8192，可在设置里调到 32768
GPU 模式自动附加 --flash-attn on（同样显存能装更长上下文）
配置项：llmCtxSize
```

## 模型自动发现

设置里的模型路径不存在时（换机器、换模型文件），会自动在以下位置找 `.gguf`：

```text
配置路径（存在则优先）
F:\novel\...（沿用旧默认）
<用户数据>\models\llm\
<安装目录>\models\llm\
```

避免「换台机器就提示模型不存在」。

## 模型自带下载（新机器友好）

`bootstrap_models.ps1` 新增可选参数：

```powershell
.\bootstrap_models.ps1 -LlmModel qwen3-14b   # 下载 14B（8.38GB）
.\bootstrap_models.ps1 -LlmModel llama-9b    # 下载 8B abliterated（4.68GB）
```

下载走 hf-mirror，落地到 `models\llm\`，并提示去设置里选中该文件。

## 本版基准（旧 9B，CUDA，思考关闭）

```text
PASS 厌战x2    8.6s  → warspite (azur lane)
PASS 柴郡x2    6.7s  → cheshire (azur lane)
PASS 芙莉莲     6.0s  → frieren (sousou no frieren)
PASS 场景遵循   5.7s  → 雨天便利店霓虹灯，无户外树影
合计 4/4，26.9s，平均 6.7s/次
```

## 安装

1. 运行 `Lumen-Studio-Flow-Setup-0.2.84.exe`
2. 首次启动自动部署 ComfyUI + Python + Anima Base + Qwen3 + VAE

GitHub：https://github.com/7ather-LX/lumen-studio-flow
