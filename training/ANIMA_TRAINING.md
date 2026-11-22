# Anima LoRA 训练（Ririko flat-cel）

## 目标

训练：

```text
Anima Base v1.0
+ Ririko flat-cel style LoRA
```

保留 Anima 的角色、构图和视角能力，只替换画风。

## 环境

- GPU：RTX 4070 SUPER 12GB
- 训练环境：`F:\DSH WORKSPACE\.venv-train`
- PyTorch：2.5.1 + CUDA 12.1
- 训练器：`kohya-ss/sd-scripts` 的 `anima_train_network.py`

验证：

```powershell
.\.venv-train\Scripts\python.exe -c "import torch; print(torch.__version__, torch.cuda.is_available())"
```

应为：

```text
2.5.1+cu121 True
```

## 数据

```text
training/dataset/images/flat_cel/   95 张
caption trigger: ririko_cel_style
dataset config: training/configs/anima_ririko_dataset.toml
```

## 训练

```powershell
.\training\scripts\train_anima_ririko.ps1
```

默认：

```text
rank 32
alpha 16
epochs 10
lr 1e-4
blocks_to_swap 8
```

显存不足时：

```text
--blocks_to_swap 12 / 16
--network_dim 16
--network_alpha 8
```

## 训练后

输出：

```text
training/output/anima_ririko/ririko_anima_v1.safetensors
```

接入 Flow：

```powershell
.\.venv\Scripts\python.exe training\scripts\integrate_style_lora.py `
  --lora training\output\anima_ririko\ririko_anima_v1.safetensors `
  --name ririko_anima_v1.safetensors `
  --rebuild
```

然后 Flow：

```text
模型模式：Anima
风格：Galgame 3D / Ririko
```

## 注意

- Anima 的 LoRA 模块是 `networks.lora_anima`，不是普通 SD1.5 LoRA
- 不要用 `make25d` 这种 SD1.5 LoRA 加载到 Anima
- 训练数据不进入 GitHub 发布包
- 训练权重不随 Flow 分发


## 实测结果

### Ririko flat-cel

```text
dataset: 95 张
steps: 950
epochs: 1
loss: ~0.099
output: ririko_anima_v1.safetensors (91.8 MB)
```

### MushroomMirror 萌系

```text
dataset: 15 张
steps: 150
epochs: 1
output: mushroom_anima_v1.safetensors (91.8 MB)
```

两者都只跑了 1 epoch，是首次可用的风格基线，不是最终质量。
