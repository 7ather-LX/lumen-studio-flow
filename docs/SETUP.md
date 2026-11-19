# Lumen Studio Flow — 本地部署与使用

## 1. 它是什么

Lumen Studio Flow 是独立于原 Lumen Studio 的新项目：

- 原版：Diffusers / 云端 / IP-Adapter / 参考库
- Flow：**ComfyUI + Anima**，一屏完成「提示词 → 画面」

Flow 不内置模型，也不内置 ComfyUI 本体。

## 2. 目录

```text
lumen-flow/
  app/                  Electron + 原生前端
  comfy/                ComfyUI 源码
  models/
    diffusion_models/anima-base-v1.0.safetensors
    text_encoders/qwen_3_06b_base.safetensors
    vae/qwen_image_vae.safetensors
  docs/
  README.md
```

## 3. 安装 ComfyUI

### 方式 A：官方便携包

1. 下载 `ComfyUI_windows_portable_nvidia.7z`
2. 解压到任意目录，例如：

```text
D:\ComfyUI_windows_portable
```

3. 双击 `run_nvidia_gpu.bat`

### 方式 B：源码

```powershell
git clone https://github.com/Comfy-Org/ComfyUI
cd ComfyUI
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
python main.py --listen 127.0.0.1 --port 8188
```

Flow 同时支持这两种布局。

## 4. 模型

Anima 文件：

```text
anima-base-v1.0.safetensors
qwen_3_06b_base.safetensors
qwen_image_vae.safetensors
```

放到：

```text
ComfyUI/models/diffusion_models/anima-base-v1.0.safetensors
ComfyUI/models/text_encoders/qwen_3_06b_base.safetensors
ComfyUI/models/vae/qwen_image_vae.safetensors
```

也可以让 ComfyUI 使用外部模型目录。新建：

```yaml
lumen:
  base_path: F:\DSH WORKSPACE\lumen-flow\models
  diffusion_models: diffusion_models
  text_encoders: text_encoders
  vae: vae
```

启动：

```powershell
python main.py --listen 127.0.0.1 --port 8188 `
  --extra-model-paths-config F:\DSH WORKSPACE\lumen-flow\comfy\extra_model_paths.yaml
```

模型来源：

- https://huggingface.co/circlestone-labs/Anima
- https://modelscope.cn/models/circlestone-labs/Anima

## 5. 启动 Flow

### 开发

```powershell
cd F:\DSH WORKSPACE\lumen-flow\app
npm install
npm run dev
```

### 便携版

解压 `Lumen-Studio-Flow-*.exe`，运行即可。

首次打开：

1. 左侧 ComfyUI 状态显示「在线」或点击「启动本地引擎」
2. 设置里确认目录
3. 输入提示词
4. 生成

## 6. 设置说明

| 字段 | 说明 |
| --- | --- |
| 地址 | `http://127.0.0.1:8188` |
| 目录 | ComfyUI 源码根目录，或 `ComfyUI_windows_portable` 根目录 |
| UNET | `anima-base-v1.0.safetensors` |
| CLIP | `qwen_3_06b_base.safetensors` |
| VAE | `qwen_image_vae.safetensors` |
| LoRA | 可选，留空 |

Flow 会根据目录自动找：

```text
<dir>/ComfyUI/main.py
<dir>/main.py
```

## 7. 操作

```text
提示词 -> 选画幅 -> 步数 / CFG / 数量 / 种子 -> 生成
```

推荐：

- 512：CPU 或低显存
- 768：12GB 显存
- 1024：8GB+ 显存，30 步

Anima 基础工作流：

```text
30 步 / CFG 4 / euler / simple
```

想更快可以试 12–20 步，但细节会下降。

## 8. 常见问题

### 找不到 ComfyUI

设置里的目录必须包含：

```text
ComfyUI/main.py
```

或直接包含 `main.py`。

### 模型找不到

检查 ComfyUI 控制台：

```text
Checkpoint file not found
```

或模型路径不在 `extra_model_paths.yaml`。

### 显存不足

- 降分辨率
- batch 1
- ComfyUI 加 `--lowvram`
- 关闭其他占显存程序

### 生成很慢

CPU 模式 20 步、768 可能需要十几分钟。  
建议使用 NVIDIA GPU 和 ComfyUI 的 CUDA 版 Python。

### 画面全黑/全灰

检查 VAE 是否是 `qwen_image_vae.safetensors`，以及模型是否完整。

## 9. 与原版的区别

| | Lumen Studio | Lumen Studio Flow |
| --- | --- | --- |
| 引擎 | Diffusers / 云 / ComfyUI | ComfyUI |
| 主模型 | MeinaMix | Anima |
| 界面 | 完整工作室 | 单屏 |
| 参考库 | 有 | 暂不包含 |
| 目标 | 平台 | 专注出图 |

## 10. 免责声明

- 与角色/作品版权方无隶属关系
- 模型、参考图、生成内容由使用者负责
- 不要重新分发第三方图片或模型
- 软件按现状提供，不保证生成结果
