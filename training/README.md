# Flow 风格训练工具

目标：训练一个 **Galgame 3D / 2.5D 风格 LoRA**，训练后自动接入 Flow 的 `Galgame 3D` 风格。

## 目录

```text
training/
  references/       用户参考图，仅本地，不发布
  inbox/            原始收集图，按风格分类
    galgame_3d/
    2_5d_semi/
    flat_cel/
    oil_photoreal/
  dataset/          清洗后的训练集
  output/           训练输出
  configs/
    galgame3d_sd15.toml
  scripts/
    curate_style_dataset.py
    caption_style_dataset.py
    train_style_lora.ps1
    integrate_style_lora.py
    eval_character_consistency.py
  style_baselines.json
```

## 风格基线

见 `style_baselines.json`：

| 标签 | 说明 | 目标 |
| --- | --- | --- |
| `galgame_3d` | Galgame / 3DCG 立绘，柔和高光、皮肤、头发 | **主训练集** |
| `2_5d_semi` | 半写实 2.5D 厚涂 | 备选 |
| `flat_cel` | 平面赛璐珞 | 不用于主训练 |
| `oil_photoreal` | 油画 / 写实 | 负面基线 |

当前 `Galgame 3D` 先用公开 `make25d_type2_v100` LoRA，训练完成后替换为自训 LoRA。

## 数据集要求

- 20–50 张起步，推荐 40–80 张
- 最短边 ≥ 512
- 同一风格，避免混入大量不同画师
- 不要只用 1–2 张参考图训练
- 不把角色名/画师名写进 style caption
- 参考图里的角色可以是任何角色，但 caption 只描述风格

## 步骤

### 1. 收集

把图片放到：

```text
training/inbox/galgame_3d/
```

其他风格同理。

前端可以用 `ego-browser` 浏览 Civitai / Pixiv / B 站教程；下载图只留在本地。

### 2. 清洗

```powershell
.\.venv\Scripts\python.exe training\scripts\curate_style_dataset.py
```

会：

- 过滤小图、极端比例、模糊图
- dHash 去重
- 输出 `dataset/images/galgame_3d/`
- 输出 `manifest.jsonl` / `rejects.jsonl`
- 生成 `contact_sheet.png` 供人工检查

### 3. Caption

```powershell
.\.venv\Scripts\python.exe training\scripts\caption_style_dataset.py
```

写入：

```text
galgame3d_style, galgame 3d, soft shading, ...
```

### 4. 训练

需要 GPU 和 kohya_ss：

```powershell
.\training\scripts\train_style_lora.ps1 `
  -Kohya "F:\DSH WORKSPACE\kohya_ss" `
  -Integrate
```

`-Integrate` 会在训练结束后：

- 把 LoRA 复制到 `models/loras/galgame3d_v1.safetensors`
- 写入 `app/renderer/style-loras.json`
- 重新打包 `app.asar`

### 5. 固定 seed 一致性测试

```powershell
.\.venv\Scripts\python.exe training\scripts\eval_character_consistency.py --steps 8
```

输出：

```text
training/eval/sheet.png
training/eval/report.json
```

四个场景：床、泳池、咖啡店、街道；同 seed、同角色 tags、同风格。

检查视角死板：

```powershell
.\.venv\Scripts\python.exe training\scripts\eval_character_consistency.py --matrix views --steps 8
```

四个视角：

```text
front / three_quarter / side / above
```

指标是 dHash 距离，只用于回归对比，不是人脸识别。

## 注意

- 训练集和参考图不进入 GitHub 发布包
- 不提交 `training/dataset`、`training/output`、`training/references`
- LoRA 权重不随 Flow 分发
