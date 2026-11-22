# Lumen Studio Flow v0.1.2

本地优先的动漫出图工具更新。

## 本地优先

默认模式：

```text
ComfyUI + Anima，本机运行
```

- 不按张收积分
- 没有云端排队
- 提示词和图片不上传
- 不依赖平台审核

## 可选外部 API

设置里新增：

```text
运行方式：本地 ComfyUI / 外部 API
```

适合没有本地大模型的机器。

预设：

- OpenAI Images
- 硅基流动
- 智谱 CogView
- 火山方舟 Seedream
- MiniMax image-01

API Key 只保存在本机。外部 API 的费用和审核由平台负责，Flow 不收积分。

## ANIMA 标准提示词

新增结构化输入：

```text
质量/安全 -> 人数与角色 -> 作品 -> @画师 -> 普通标签 -> 自然语言
```

例如：

```text
masterpiece, best quality, score_7, safe, 1girl, solo, frieren,
sousou no frieren, @kantoku, sitting under tree, reading book,
forest, dappled sunlight, She looks peaceful and slightly sleepy.
```

画师漏写 `@` 会提示并自动补上。

## 画师风格库

新增 12 种风格预设，每种带 `@画师` 和风格 tags：

- 平面赛璐珞
- 2.5D 厚涂
- 黑白日式漫画
- 水墨风
- 90 年代复古赛璐珞
- 柔和粉彩
- 精细线稿
- 浮世绘
- Q 版
- 电影光影
- 日系插画
- 赛博霓虹

这些是**提示词层的画师/风格引用**，不是画师 LoRA 训练。

## 已验证

- 本地 ComfyUI + Anima 生成通过
- Flow 应用内生成通过
- 本地 mock 图片 API 端到端通过
- 风格提示词拼接顺序通过

## 未包含

- ComfyUI 本体
- Anima / Qwen / VAE 模型
- 画师 LoRA 权重
- 第三方画师原图

## 免责声明

画师名字只用于风格提示词描述。  
生成内容、模型许可和平台审核由使用者负责。
