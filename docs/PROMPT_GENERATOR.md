# 内置提示词生成器

Flow 0.1.3 起内置一个**不联网、不登录**的 Anima 提示词生成器。

用户只需要写一句中文或英文描述，Flow 会把它拆成 Anima 标准顺序：

```text
质量/安全 -> 人数与角色 -> 作品 -> @画师 -> 普通标签 -> 自然语言
```

## 使用

1. 在「ANIMA / STRUCTURED PROMPT」里勾选「启用结构化」
2. 在「不会写提示词？用一句话描述」输入：

```text
银发红瞳的少女，黑色水手服，坐在樱花树下的长椅上，春天，柔和光线，安静的微笑
```

3. 点「生成标准提示词」
4. 检查 01–06 字段，必要时修改
5. 点生成

## 生成结果示例

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

## 能识别的关键词

- 发色：银发、白发、黑发、金发、粉发、蓝发、红发、棕发
- 发型：长发、短发、双马尾、马尾
- 眼睛：红瞳、蓝瞳、金瞳、绿瞳、异色瞳
- 服装：水手服、校服、连衣裙、和服、黑丝、白丝、眼镜、帽子、围巾
- 动作：坐、站、躺、看书、回头、伸手、跑
- 情绪：微笑、安静、困、悲伤
- 场景：樱花、森林、树下、长椅、海边、教室、咖啡厅、城市、夜晚、雨天、雪
- 光线：柔光、逆光、电影光、阳光、霓虹、斑驳
- 镜头：全身、半身、特写、俯视、低角度

## 限制

- 这是本地规则 + 标签库，不是在线大模型
- 复杂中文句子可能只识别到部分关键词
- 未识别的角色名需要手动填到「02 人数与角色」或「03 作品」
- 生成后建议检查「04 @画师」和「05 普通标签」

## 为什么不用在线生成器

- 不需要登录
- 不需要 API Key
- 不需要联网
- 不会把用户的描述发到外部
- 失败时可以直接手改字段

如果用户配置了外部 API，仍然可以使用外部 LLM 生成提示词；内置生成器只是默认方案。
