# Training Share

发布包只放：

- 标签/caption `.txt`
- 数据集 manifest
- 训练配置 `.toml`
- 训练脚本
- 训练好的 LoRA `.safetensors`
- 报告与统计

不放：

- 原始参考图
- 用户私图
- B 站/Pixiv 原图
- 模型本体
- ComfyUI 本体

## 本地压缩

训练完成后把参考图压成：

```text
training/_archive/reference_images_YYYYMMDD.zip
```

然后删除工作目录里的展开图片，节省 F 盘空间。

## 发布 LoRA

```text
ririko_anima_v2.safetensors
mushroom_anima_v2.safetensors
25d_anima_v3.safetensors
anatomy_anima_v1.safetensors
```

LoRA 是训练产物，不含原图。

## 数据集元数据

```text
training/configs/*.toml
training/dataset/manifest.jsonl
training/dataset/captions/*
training/bilibili_columns*.json
```

## 注意

- 不发布任何露骨内容
- 不发布原图
- 训练数据仅用于本地模型
- 画师版权归原作者；分享只包含标签和训练产物
