# Lumen Studio Flow v0.2.0

风格训练工具链。

## 新增

### 数据集整理

```text
training/scripts/curate_style_dataset.py
```

- 过滤小图、极端比例、模糊图
- dHash 去重
- 按风格标签归类
- 输出 manifest、rejects、contact sheet

### Caption

```text
training/scripts/caption_style_dataset.py
```

风格 LoRA 只写风格，不写角色名。

### 训练配置

```text
training/configs/galgame3d_sd15.toml
```

SD1.5 + kohya_ss，输出：

```text
training/output/galgame3d_v1.safetensors
```

### 自动接入

```text
training/scripts/integrate_style_lora.py
```

训练后：

- 复制到 `models/loras/galgame3d_v1.safetensors`
- 更新 `app/renderer/style-loras.json`
- 重新打包 `app.asar`

Flow 的 `Galgame 3D` 风格会自动读取新的 LoRA。

### 固定 seed 一致性测试

```text
training/scripts/eval_character_consistency.py
```

四个场景：

```text
bed / pool / cafe / street
```

同 seed、同角色 tags、同风格，输出：

```text
training/eval/sheet.png
training/eval/report.json
```

4 步冒烟测试已跑通。dHash 距离只能做回归参考，不是人脸识别。

## 风格基线

见 `training/style_baselines.json`：

```text
galgame_3d      主训练集
2_5d_semi       备选
flat_cel        不用于主训练
oil_photoreal   负面基线
```

## 当前问题

- 还没有足够数据，暂未正式训练
- 成功训练需要 GPU + 20–50 张同风格图
- 当前仍使用公开 `make25d_type2_v100` 作为 Galgame 3D 基线
- 角色脸一致性仍未解决

## 下载

训练集、参考图、LoRA 权重不进入发布包。
