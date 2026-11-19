# Lumen Studio Flow v0.1.3

给不会写提示词的用户准备的版本。

## 内置提示词生成器

在「ANIMA / STRUCTURED PROMPT」里输入一句中文或英文：

```text
银发红瞳的少女，黑色水手服，坐在樱花树下的长椅上，春天，柔和光线，安静的微笑
```

点「生成标准提示词」，Flow 会生成：

```text
masterpiece, best quality, score_7, safe,
1girl, solo,
@kantoku, @yoneyama_mai,
silver hair, red eyes, sailor suit, sitting, smile, calm,
cherry blossoms, under tree, bench, soft lighting,
anime cel shading, flat colors, bold clean lineart,
The character is sitting in a scene with cherry blossoms and bench,
and the mood feels cheerful with soft lighting.
```

不需要联网、不需要 API Key、不需要登录。

## 识别范围

- 发色 / 发型 / 眼睛
- 服装 / 鞋袜 / 配饰
- 动作 / 情绪
- 场景 / 天气 / 时间
- 光线 / 镜头

## 同时保留

- 12 种画师风格预设
- 本地 ComfyUI + Anima
- 可选外部 API
- 结构化顺序和 `@画师` 检查

## 未完成

- 不是在线大模型，复杂句子只能识别关键词
- 不包含画师 LoRA 权重
- 不包含第三方图片
- 外部 API 的真实平台仍需用户 Key

## 验证

- 提示词顺序通过
- 中文描述生成字段通过
- 12 种风格 + 画师标签通过
- 本地 ComfyUI 生成通过
