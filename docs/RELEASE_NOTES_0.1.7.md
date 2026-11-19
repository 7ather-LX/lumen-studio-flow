# Lumen Studio Flow v0.1.7

模型自由与工作流编辑。

## 新增

### 不再是 Anima 单模型

设置里新增：

```text
Anima
标准 Checkpoint（SD1.5 / SDXL）
```

标准 Checkpoint 使用：

```text
CheckpointLoaderSimple -> MODEL / CLIP / VAE
```

已用 MeinaMix 实测通过。

### LoRA

设置里可选 LoRA 和强度：

```text
0.0 – 1.5
```

- Checkpoint 模式：LoraLoader，同时作用于 MODEL 和 CLIP
- Anima 模式：LoraLoaderModelOnly
- 模型列表从 ComfyUI `/object_info` 读取

### 模型列表

设置里「刷新模型列表」可以读取：

- checkpoints
- diffusion_models
- text_encoders
- vae
- loras

### Anima Ref Adapter（可选）

参考图支持两种方式：

```text
img2img：借构图 / 画风
Anima Ref Adapter：锁角色，场景听提示词
```

需要本地安装：

- `ComfyUI-Anima-Ref-Adapter`
- `anima_ref_adapter_v2_r64.safetensors`

CPU 下很慢；建议 GPU。

### 工作流编辑

左下角「工作流」打开：

- 节点列表
- 完整 API JSON
- 刷新默认
- 恢复默认
- 使用自定义工作流

默认不显示工作流；普通用户仍然只看到提示词、画幅、生成。

## 实测

- Anima 模式：通过
- Checkpoint 模式（MeinaMix）：通过
- 工作流预览：通过
- 自定义工作流 JSON：接口已接入
- Hires / 参考图 / 角色识别：保留

## 未完成

- Face Detailer：固定裁切版本会破坏画面，已从 UI 移除
- 角色 LoRA 训练器
- IP-Adapter / Anima LLLite

## 下载

不包含模型、ComfyUI 本体或第三方图片。
