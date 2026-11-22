# 萌系小人批量提示词规范

用途：持有一批角色立绘时，保持角色身份和服装，批量生成统一风格的萌系小人。

## 一、批量数据表

每个角色一行：

```csv
id,character_tag,work_tag,hair,eyes,features,outfit,ref_image,seed
cheshire,cheshire (azur lane),azur lane,black hair with aqua streaks,blue eyes,"cat-ear headdress, fake animal ears, maid headdress",white maid outfit,refs/cheshire.png,1001
oumi,oumi (azur lane),azur lane,black hair,red eyes,"fox ears, fox tail",black bikini,refs/oumi.png,1002
```

字段说明：

```text
character_tag：角色 canonical tag，必填
work_tag：作品 tag，必填
hair：发色 + 发型
eyes：瞳色
features：兽耳、尾巴、头饰、特殊饰品
outfit：默认服装
ref_image：角色干净立绘路径
seed：每个角色固定种子，便于比较
```

## 二、通用正向提示词

```text
masterpiece, best quality, score_7, safe,
1girl, solo, single character,
{character_tag}, {work_tag},
{hair}, {eyes}, {features},
{outfit},
mushroom_moe_style, moe anime,
chibi, cute stylized proportions,
three heads tall, big head, small body,
short arms, short legs, simplified hands,
standing, full body, front view,
looking at viewer, gentle smile,
soft colorful shading, glossy highlights,
clean anime rendering,
simple white background, centered composition
```

## 三、通用负面提示词

```text
worst quality, low quality, blurry, jpeg artifacts,
text, watermark, signature,
realistic proportions, tall, long legs, mature body,
muscular, bad anatomy, bad hands, extra fingers,
missing fingers, fused fingers, deformed face,
asymmetrical eyes, multiple views, multiple characters,
cropped, out of frame
```

## 四、极 Q 版本

只替换风格段：

```text
mushroom_moe_style, moe anime,
chibi, super deformed, two heads tall,
huge head, tiny body, stubby arms and legs,
simplified mitten hands,
sticker style, simple white background
```

## 五、参数

```text
画风：柔和萌系
LoRA：mushroom_anima_v2
LoRA 强度：0.75–0.85
步数：26–30
CFG：3.5
尺寸：768 × 1024
数量：3
高清放大：关闭
参考方式：Anima Ref Adapter
角色锁定强度：5–6
```

## 六、重绘时

```text
参考图：角色立绘
参考方式：角色参考 / Anima Ref Adapter
重绘幅度：0.55–0.65
种子：每个角色固定
```

如果服装丢失，在 prompt 里保留：

```text
same outfit, same color scheme, same accessories
```

不要只写角色名，模型不会自动记住所有服装细节。

## 七、批量变体

同一角色三张只改变：

```text
表情
手势
轻微站姿
头部角度
```

不要改变：

```text
发色
瞳色
兽耳类型
服装
角色身份
```

## 八、给 AI 的批量生成指令

```text
你是批量萌系角色提示词生成器。
我会给你一张角色清单，每行包含 character_tag、work_tag、hair、eyes、features、outfit。

请为每个角色输出一行 CSV，列为：
id, prompt, negative, seed, ref_image

prompt 必须使用固定模板：
masterpiece, best quality, score_7, safe, 1girl, solo, single character,
{character_tag}, {work_tag}, {hair}, {eyes}, {features}, {outfit},
mushroom_moe_style, moe anime, chibi, cute stylized proportions,
three heads tall, big head, small body, short arms, short legs,
simplified hands, standing, full body, front view, looking at viewer,
gentle smile, soft colorful shading, glossy highlights,
clean anime rendering, simple white background, centered composition

negative 固定为：
worst quality, low quality, blurry, jpeg artifacts, text, watermark,
realistic proportions, tall, long legs, mature body, bad anatomy,
bad hands, extra fingers, missing fingers, deformed face,
asymmetrical eyes, multiple views, multiple characters, cropped

seed 每个角色固定，三张变体可以 seed+1、seed+2。
不要输出解释，只输出 CSV。
```

## 九、检查表

```text
[ ] 角色 tag 和作品 tag 都在
[ ] 发色正确
[ ] 瞳色正确
[ ] 兽耳/头饰类型正确
[ ] 服装没有换错
[ ] 没有出现两个角色
[ ] 没有变成普通萌系路人
[ ] 头身比是三头身左右
[ ] 手部没有明显融合
```
