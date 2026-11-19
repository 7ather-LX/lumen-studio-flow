# Anima 标准提示词格式

Anima 对提示词顺序比普通 SD 模型敏感。Flow 0.1.1 起默认使用结构化输入。

## 顺序

```text
质量/安全
-> 人数与角色
-> 作品
-> @画师
-> 普通标签
-> 自然语言
```

## 示例

```text
masterpiece, best quality, score_7, safe,
1girl, solo, frieren,
sousou no frieren,
@kantoku,
sitting under tree, reading book, forest, dappled sunlight,
She looks peaceful and slightly sleepy.
```

换成 Flow 的单行提交：

```text
masterpiece, best quality, score_7, safe, 1girl, solo, frieren, sousou no frieren, @kantoku, sitting under tree, reading book, forest, dappled sunlight, She looks peaceful and slightly sleepy.
```

## 各段说明

### 1. 质量/安全

推荐：

```text
masterpiece, best quality, score_7, safe
```

`score_7` 是 Anima 的质量标签；`safe` 是安全标签。不要把它放到角色后面。

### 2. 人数与角色

```text
1girl, solo, frieren
```

- 人数：`1girl` / `1boy` / `2girls`
- 单人：`solo`
- 角色：标准角色 tag

多角色：

```text
2girls, frieren, fern
```

### 3. 作品

```text
sousou no frieren
```

作品名要和角色 tag 使用同一套拼写。不要只写中文名。

### 4. @画师

**画师标签前面必须有 `@`。**

```text
@kantoku
```

多位画师：

```text
@kantoku, @mika_pikazo
```

Flow 会自动检查；如果漏了 `@`，会提示并在最终提示词里补上。

### 5. 普通标签

```text
sitting under tree, reading book, forest, dappled sunlight
```

包括：

- 动作
- 服装
- 场景
- 光线
- 构图
- 风格

这些标签放在画师之后、自然语言之前。

### 6. 自然语言

```text
She looks peaceful and slightly sleepy.
```

自然语言放最后，用完整句子描述情绪、氛围或构图意图。  
不要把它插在角色和作品之间。

## Flow 里的操作

1. 保持「启用结构化」勾选
2. 分别填写 01–06
3. 看下方「最终提示词」预览
4. 点生成

普通标签里 Flow 会自动加入风格预设（赛璐珞 / 电影光影等），位置在自然语言之前。

## 常见错误

### 画师没有 @

错误：

```text
kantoku
```

正确：

```text
@kantoku
```

### 顺序颠倒

错误：

```text
sitting under tree, masterpiece, frieren, @kantoku, safe
```

正确：

```text
masterpiece, best quality, score_7, safe, 1girl, solo, frieren, @kantoku, sitting under tree
```

### 作品名缺失

角色名越独特，越建议带作品名：

```text
frieren, sousou no frieren
```

### 自然语言放太前

自然语言放最后。前面用 booru 风格标签更稳定。

## 快速模板

```text
masterpiece, best quality, score_7, safe,
1girl, solo, <character>,
<series>,
@<artist>,
<pose>, <outfit>, <scene>, <lighting>,
<one natural-language sentence>.
```
