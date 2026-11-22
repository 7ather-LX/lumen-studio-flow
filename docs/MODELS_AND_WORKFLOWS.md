# 模型与工作流

Flow 不再只绑定 Anima。

## 1. 模型模式

设置里可选：

```text
Anima（UNET + CLIP + VAE）
标准 Checkpoint（SD1.5 / SDXL）
```

### Anima

使用：

```text
UNETLoader
CLIPLoader
VAELoader
```

当前默认。

### 标准 Checkpoint

使用：

```text
CheckpointLoaderSimple
-> MODEL
-> CLIP
-> VAE
```

适用于 MeinaMix、Anything、SDXL 等单文件 checkpoint。

模型文件放到：

```text
ComfyUI/models/checkpoints/
```

Flow 的模型列表通过 ComfyUI `/object_info` 读取。

## 2. LoRA

设置里选择 LoRA 文件和强度：

```text
0.0 – 1.5
```

- Checkpoint 模式：使用 `LoraLoader`，同时作用于 MODEL 和 CLIP
- Anima 模式：使用 `LoraLoaderModelOnly`

LoRA 放到：

```text
ComfyUI/models/loras/
```

如果列表为空，点「刷新模型列表」。

## 3. 工作流默认隐藏

普通用户只看到：

```text
提示词 -> 画幅 -> 生成
```

不显示 ComfyUI 节点图。

## 4. 工作流编辑界面

左下角「工作流」打开：

- 节点列表
- 完整 ComfyUI API JSON
- 刷新默认工作流
- 恢复默认
- 使用自定义工作流

只有勾选「使用自定义工作流」时，生成才会提交自定义 JSON。

自定义工作流不会自动应用：

- Hires Fix
- 参考图
- Face Detailer

这些逻辑由默认工作流控制。

## 5. 默认工作流

Anima：

```text
UNETLoader + CLIPLoader + VAELoader
-> CLIPTextEncode x2
-> EmptyLatentImage
-> KSampler
-> VAEDecode
-> SaveImage
```

Checkpoint：

```text
CheckpointLoaderSimple
-> CLIPTextEncode x2
-> EmptyLatentImage
-> KSampler
-> VAEDecode
-> SaveImage
```

## 6. 自定义工作流示例

从工作流窗口复制 JSON，修改节点参数后贴回，勾选启用。

注意：

- 必须是 ComfyUI API 格式
- 节点 id 不要重复
- 不保证所有节点都存在于你的 ComfyUI
- 自定义工作流出错时先恢复默认

## 7. 参考图两种方式

参考图面板里可以选：

```text
img2img：借构图 / 画风
Anima Ref Adapter：锁角色，场景听提示词
```

### img2img

适合：

- 借参考图的光影、色调、构图
- 不要求角色完全一致

风险：

- 参考图的发色、服装、场景会被带进来

### Anima Ref Adapter

参考图只提供角色特征，提示词决定场景。

需要：

- ComfyUI 自定义节点 `ComfyUI-Anima-Ref-Adapter`
- `models/loras/anima_ref_adapter_v2_r64.safetensors`

Flow 会把参考图接到：

```text
LoadImage -> AnimaRefAdapter -> KSampler
```

提示词可以只写场景，例如：

```text
bedroom, lying on bed, night, lamp light, white bikini
```

CPU 下每步会明显变慢；建议 GPU。

## 8. 模型许可

- Anima、MeinaMix、SDXL 等模型分别遵循自己的许可证
- LoRA 的授权由训练者决定
- Flow 不重新分发模型权重
- 用户需自行确认商用/再分发权限
