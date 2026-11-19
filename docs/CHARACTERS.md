# 角色识别与同名消歧

Flow 0.1.4 起，提示词生成器会先做角色识别，再拼标准提示词。

## 数据

内置 2383 个角色条目，来源于 MIT 许可的公开 Anima 角色库：

- https://github.com/lingdongbudong/Comfyui-Anima-Wardrobe-V4

只使用文本字段：

- 角色英文名 / Danbooru tag
- 作品英文名
- 中文名（部分手工补充）
- 别名

不包含角色缩略图、原画或模型权重。

## 示例

输入：

```text
我想画一个2.5D的躺在床上的柴郡
```

识别为：

```text
角色：柴郡
tag：cheshire (azur lane)
作品：azur lane
风格：2.5D 厚涂
动作：lying, bed
```

最终字段：

```text
1girl, solo, cheshire (azur lane)
azur lane
@wlop, @mika_pikazo
lying, bed, semi-realistic anime, painterly rendering...
```

## 同名角色

像“爱丽丝”这种名字，Flow 不会随便选一个。

它会列出：

```text
爱丽丝·玛格特罗伊德 · 东方Project
爱丽丝（蔚蓝档案） · 蔚蓝档案
爱丽丝（梦游仙境） · 爱丽丝梦游仙境
爱丽丝·泰姆菲尔德 · 绝区零
爱丽丝·滋贝鲁库 · 刀剑神域
爱丽丝（NIKKE） · 胜利女神：NIKKE
```

用户点选后才会写入角色和作品。

## 带作品名直接消歧

```text
碧蓝航线的柴郡
```

如果别名和作品同时出现，会优先选该作品下的角色。

## 限制

- 中文别名不是 100% 覆盖；未收录的中文名需要手填英文角色 tag
- 角色 tag 是否被 Anima 认识取决于模型训练数据
- 只做角色名解析，不做图像识别
- 同名角色必须让用户选择，不自动猜

## 版权

角色名、作品名归各自权利人所有。  
本数据库只用于本地提示词生成，不分发角色图片。
