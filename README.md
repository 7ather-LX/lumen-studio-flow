# Lumen Studio Flow

**Lumen Studio Flow** is a separate, focused anime image studio built around a local **ComfyUI + Anima** pipeline.

**Local first:** the default mode runs entirely on your machine, with no credits, queue or remote moderation. An optional external image API can be configured for machines that cannot run a local model.

It is not a replacement for the original Lumen Studio. The original project keeps its multi-engine, reference-library and local-learning workflow. Flow is a new project with a different goal:

```text
one prompt -> one frame -> one local ComfyUI workflow
```

![Flow UI](docs/flow-app.png)

## Why a new project

The original Lumen Studio grew around Diffusers, IP-Adapter references, feet repair and cloud providers. Flow deliberately removes that complexity from the main path:

- ComfyUI does the execution
- Anima + Qwen3 text encoder does the image generation
- Lumen Studio Flow only exposes the controls a normal user needs
- The generated image is always saved locally

## Features

- Local ComfyUI backend (default, no credits)
- Optional external image API
- **Local AI prompt assistant**: CPU-only llama.cpp, does not consume GPU VRAM
- **Optional OpenAI-compatible prompt API** for machines without a local GGUF
- One-click local AI download (Qwen2.5 0.5B GGUF + llama.cpp CPU runtime, about 520 MB)
- Strict prompt JSON: character / work / style / artist left empty when not specified
- Structured Anima prompt: quality -> subject -> series -> @artist -> tags -> natural language
- Built-in offline prompt generator (Chinese/English idea -> Anima tags)
- Chinese character and scene recognition
- Character disambiguation (2400+ entries)
- Hires Fix, prompt checker, and img2img reference workflow
- Multi-image results with thumbnail switching
- Batch 1–10, batch select / favorite / delete / reprocess
- Hover style previews for every style preset
- Pose / costume / portrait catalog with 6,162 Chinese metadata entries and English pose tags
- Sidebar shortcuts for create, gallery, pose/costume, reference, prompt, settings, training, workflow, help
- Anima or standard Checkpoint + LoRA
- Hidden-by-default ComfyUI workflow editor
- 1:1 / 3:4 / 2:3 / 16:9 frames
- Steps / CFG / seed / performance profiles
- Local output gallery with metadata, ratings, notes, and detail zoom
- One-click ComfyUI health check and launch
- No account, no cloud, no remote queue

## AI prompt assistant

Open **Create -> AI 一起写**, describe the image, then click **填入创作区**.

Two modes are available in **Settings -> AI 关键词模式**:

| Mode | Requirement | VRAM / speed |
| --- | --- | --- |
| Local GPU | Local GGUF + llama.cpp; ComfyUI pauses while chatting | 9B Q4 ≈ 6 GB, first reply ~10 s |
| Local CPU | One-click download, about 520 MB | 0 VRAM, slower |
| External API | OpenAI-compatible URL, model, key | 0, network latency |

In GPU mode the app pauses ComfyUI before loading the assistant, then releases the assistant before image sampling. The two models are never kept resident at the same time. CPU mode uses `--n-gpu-layers 0` and never touches VRAM. The app never requires an account or a cloud subscription.

### Local setup

1. Open Settings
2. Choose `本地 AI（CPU，不占显存）`
3. Choose `GPU 加速` or `CPU`
4. Click `下载 / 安装本地 AI` if you need the small model and runtime
5. Wait for the download to finish
6. Use **AI 一起写**

For a larger model, point `本地模型 GGUF` and `llama-server 路径` at your own files. The assistant supports any llama.cpp-compatible GGUF.

### External API setup

1. Choose `外部 OpenAI 兼容 API`
2. Fill API URL, model, and key
3. The key is stored only in the local config file

## One installer, first-run setup

The GitHub release contains one app installer:

```text
Lumen-Studio-Flow-Setup-0.2.36.exe
```

On first launch, if ComfyUI or Python is missing, the app offers:

```text
一键部署完整环境
```

It downloads ComfyUI portable, Python, Anima Base, Qwen3 text encoder, Qwen Image VAE, and the required custom nodes into `F:\LumenFlow` (configurable). The download is about 8 GB.

This keeps the GitHub release below the 2 GB per-asset limit while still giving normal users a one-click setup.

### Optional offline bundle

For offline machines, maintainers can build a full runtime archive from:

```text
comfy/
models/
.venv/ or ComfyUI portable python_embeded/
runtime-plugins/
```

and distribute it outside GitHub (HuggingFace, object storage, or physical media). The app supports pointing `ComfyUI 目录` and `Python` at that extracted runtime.

## Requirements

- Windows 10/11
- ComfyUI (portable or source)
- Python environment for ComfyUI
- Optional for AI prompt assistant: local llama.cpp runtime + a GGUF model, or an OpenAI-compatible API

- Anima model files:

```text
ComfyUI/models/diffusion_models/anima-base-v1.0.safetensors
ComfyUI/models/text_encoders/qwen_3_06b_base.safetensors
ComfyUI/models/vae/qwen_image_vae.safetensors
```

If you use the portable `ComfyUI_windows_portable` layout, point Flow at its root. If you use a source checkout, point Flow at the folder containing `main.py`.

## Reference material

- Bilibili series: https://www.bilibili.com/video/BV1CcuH6sESW
- ComfyUI Anima guide: https://docs.comfy.org/tutorials/image/anima/anima
- Anima workflow template: https://github.com/Comfy-Org/workflow_templates
- Anima model card: https://huggingface.co/circlestone-labs/Anima

The Flow workflow is a simplified subset of the official Anima template:
UNET + Qwen3 CLIP + VAE + KSampler + SaveImage. No custom nodes are required.

## Docs

- [Setup / local deployment](docs/SETUP.md)
- [Optional offline bundle](docs/OFFLINE_BUNDLE.md)
- [Pose / costume reference import](docs/REFERENCE_IMPORT.md)
- [Anima prompt format](docs/PROMPT_FORMAT.md)
- [Built-in prompt generator](docs/PROMPT_GENERATOR.md)
- [Character recognition and disambiguation](docs/CHARACTERS.md)
- [Reference image comparison](docs/REFERENCE_COMPARE.md)
- [Models and workflow editor](docs/MODELS_AND_WORKFLOWS.md)
- [2.5D / Galgame style LoRA](docs/STYLE_LORA.md)
- [Installed plugins and tools](docs/PLUGINS.md)
- [Keep Anima composition, refine quality](docs/QUALITY_REFINE.md)
- [Style training toolkit](training/README.md)
- [B站画师推荐目录](docs/BILIBILI_COLUMNS.md)
- [v0.2.4 release notes](docs/RELEASE_NOTES_0.2.4.md)
- [训练数据分享](F:/DSH%20WORKSPACE/lumen-flow/training/TRAINING_SHARE.md)
- [Artist / style library](docs/STYLE_LIBRARY.md)
- [Local vs external API](docs/PROVIDERS.md)
- [v0.1.2 release notes](docs/RELEASE_NOTES_0.1.2.md)

## Model sources

- Anima: https://huggingface.co/circlestone-labs/Anima
- ComfyUI: https://github.com/Comfy-Org/ComfyUI
- ComfyUI Anima workflows: https://github.com/Comfy-Org/workflow_templates

The model files are not included in this repository.

## Development

```powershell
# from this folder
npm install
npm run dev
```

The app expects a running ComfyUI at `http://127.0.0.1:8188` unless launched from the app's "start local engine" button.

## Simplified workflow

The app submits this graph to ComfyUI:

```text
UNETLoader(Anima)
CLIPLoader(Qwen3, stable_diffusion)
VAELoader(qwen_image_vae)
CLIPTextEncode(positive / negative)
EmptyLatentImage
KSampler(euler / simple)
VAEDecode
SaveImage
```

No custom nodes are required for the base workflow.

## Differences from the original Lumen Studio

| | Lumen Studio | Lumen Studio Flow |
| --- | --- | --- |
| Main engine | Diffusers / cloud / ComfyUI | ComfyUI first |
| Anime model | MeinaMix | Anima |
| UI | Full studio | One-screen flow |
| References | Character / body library | Later, optional |
| Training | Not included | Not included |
| Goal | Platform | Focused anime generator |

## License

MIT for the Flow app. ComfyUI, Anima and model files follow their own licenses.

## Disclaimer

Use the software at your own risk. You are responsible for the prompts you enter, the images you generate and the rights attached to any reference or model you use.
