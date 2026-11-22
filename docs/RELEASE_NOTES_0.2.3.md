# Lumen Studio Flow v0.2.3

训练素材入口、2.5D LoRA、B 站画师目录。

## 新增

### 软件内训练素材入口

```text
左下角 -> 训练素材
```

支持：

- 多选 / 拖入图片
- 选择风格标签
- 写入 F 盘 `training/inbox/<label>/batch_*`
- 不上传、不进 GitHub

只接收已经裁切好的安全素材。

### 2.5D 独立 LoRA

```text
25d_anima_v2.safetensors
```

数据来源：

- 公共 2.5D / 写实向作品 21 张
- 全部 `rating:safe`
- 单独标签 `2_5d_semi`
- 不和 Ririko 赛璐珞混训

训练：

```text
1 epoch 初始 + 2 epoch 续训 = 3 epoch
```

### Mushroom 续训

```text
mushroom_anima_v2.safetensors
```

```text
1 epoch 初始 + 2 epoch 续训 = 3 epoch
```

### Ririko 续训

```text
ririko_anima_v2.safetensors
```

```text
1 epoch 初始 + 2 epoch 续训 = 3 epoch
```

## 软件内风格

新增：

```text
2.5D LoRA
```

已有：

```text
Ririko 赛璐珞
Mushroom 萌系
Galgame 3D
```

## B 站画师目录

已建立：

```text
training/bilibili_columns.json
```

来源：未名之时「画师推荐」合集。

```text
300 个专栏
```

当前分类：

```text
flat_cel     62
moe_2d        1
2_5d_semi     4
manga        24
unknown     209
```

只保存标题、链接、摘要和分类；图片和成人内容不进入发布包。

## 已知问题

- 2.5D 仍没有完全达到参考图质感
- 床上脚趾/脚掌细节仍不足
- Ririko/Mushroom/2.5D 都是 3 epoch 的基线
- B 站目录分类需要人工复核

## 下载

不包含 LoRA、训练图片、模型、B 站图片或 ComfyUI 本体。
