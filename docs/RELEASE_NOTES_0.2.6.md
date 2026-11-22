# Lumen Studio Flow v0.2.6

B站画师库、分组风格 LoRA、安装包与简单关键词预设。

## B站画师库

已抓取：

```text
300 个专栏
2548 张图片
66 个画师
```

分类：

```text
flat_cel  2137
2_5d_semi  195
moe_2d      20
manga      196
unknown      0
```

577 张无法自动判断的作品已回退为 `flat_cel` 并标记 `fallback=true`，保留人工复核可能。

报告：

```text
docs/BILIBILI_LIBRARY.md
training/bilibili_library.json
```

## 分组风格 LoRA

```text
bilibili_flat_cel_anima_v1
bilibili_2_5d_semi_anima_v1
bilibili_moe_2d_anima_v1
```

这是第一版干净样本基线；样本量仍小，后续继续扩量。

## 简单关键词风格

Flow 新风格：

```text
B站精选赛璐珞
B站精选2.5D
B站精选萌系
```

对应 trigger：

```text
bilibili_flat_cel_style
bilibili_2_5d_semi_style
bilibili_moe_2d_style
```

## 安装包

```text
Lumen-Studio-Flow-Setup-0.2.6.exe
```

- 可选安装目录
- 自动桌面快捷方式
- 自动开始菜单快捷方式

## 数据分享

```text
training-share-v0.2.6.zip
loras-share-v0.2.6.zip
bilibili-library-v0.2.6.zip
```

包含：

- captions、manifest
- 训练配置、脚本
- B站画师/风格目录
- 训练好的 LoRA

不包含原始图片。

## 仍未完成

- B站 unknown 的人工复核
- 分组 LoRA 样本量不足
- 多脚趾
- 丝袜纹理质量
