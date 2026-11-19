# Anima 画师 / 风格库

Flow 0.1.2 起，风格不再是简单滤镜，而是以 **@画师 + 风格 tags** 的 Anima 提示词预设计入。

## 使用方式

选择风格后，Flow 会自动把画师的 `@tag` 放进「04 @画师」段，把画风 tags 放进「05 普通标签」段，最终仍遵守：

```text
质量/安全 -> 人数与角色 -> 作品 -> @画师 -> 普通标签 -> 自然语言
```

「04 @画师」里用户自己填的画师会和风格画师合并。

## 当前风格

| 风格 | 画师参考 | 主要 tags |
| --- | --- | --- |
| 平面赛璐珞 | @kantoku / @yoneyama_mai | anime cel shading, flat colors, bold clean lineart, limited palette |
| 2.5D 厚涂 | @wlop / @mika_pikazo | semi-realistic anime, painterly rendering, thick brushwork, volumetric lighting |
| 黑白日式漫画 | @fujimoto_tatsuki / @asano_inio | black and white manga, screentone, high contrast ink, panel composition |
| 水墨风 | @kawanabe_kyosai | ink wash painting, sumi-e, flowing brush strokes, negative space |
| 90 年代复古赛璐珞 | @yamada_akihiro | 1990s anime, retro cel, film grain, muted colors |
| 柔和粉彩 | @atdan | soft pastel colors, airy lighting, delicate lineart |
| 精细线稿 | @lack | fine lineart, monochrome, hatching, clean contours |
| 浮世绘 | @hokusai | ukiyo-e, woodblock print, flat perspective, wave patterns |
| Q 版 | @fuzichoco | chibi, super deformed, cute, thick outlines |
| 电影光影 | @redjuice | cinematic lighting, dramatic shadows, volumetric light |
| 日系插画 | @fuzichoco | Japanese illustration, soft painterly rendering, detailed eyes |
| 赛博霓虹 | @redjuice | cyberpunk, neon lights, chromatic aberration, futuristic city |

## 重要说明

这些是 **提示词层的画师/风格引用**，不是针对某个画师训练的 LoRA。

优点：

- 零训练成本
- 可随时切换
- 不复制原图

限制：

- Anima 是否认识某个画师 tag，取决于模型训练数据
- 画师 tag 不一定稳定，需要配合风格 tags
- 不要把画师作品原图打包进软件或仓库

## 扩充方法

在 `app/renderer/app.js` 的 `STYLES` 中增加：

```js
"style-id": {
  label: "显示名",
  artists: ["@artist_tag"],
  tags: "style tags, lighting, line quality",
  hint: "中文风格说明"
}
```

同时把按钮加到 `index.html` 的 `styleChips`。

## 版权

画师名字和风格参考只用于提示词描述。  
不要把公开平台上的原图、训练集或画师 LoRA 重新分发。
