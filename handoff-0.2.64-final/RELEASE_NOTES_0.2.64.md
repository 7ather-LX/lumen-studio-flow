# Lumen Studio Flow v0.2.64

完全免费、为爱发电的本地 AI 绘画工作台。Electron + ComfyUI + Anima，本地优先，不上传素材。

## 新增：国漫 / 网文角色补录（首发《斗罗大陆》）

danbooru 几乎不覆盖国漫网文，所以这类角色会走「按字面猜」的坑。
你给的例子正好撞上：**「罗三炮」被猜成了大炮**。

已联网查证官方设定并录入：

```text
罗三炮（玉小刚的变异武魂，斗罗大陆）
  似狗似猪、身长腰围一米五以上、通体淡紫色毛发、耳朵耷拉、
  深蓝色大眼睛、猪鼻、四条短粗腿、头顶有鼓包（退化龙角）
  攻击方式是放屁（一天三次）——所以「炮」不是火炮
```

## 防字面猜测（通用规则）

```text
中文名不要按字面具象化：很多国漫/网文角色名取自招式、器物或俗称。
遇到库外中文名，先判断它是生物/器物/功法；无法确定就只写用户给的形态描述，
并在 notes 写「未收录，形态未确认」，禁止凭名字臆造。
```

## 修复：负面词爆炸

模型有时会吐几百个无关负面词（一条龙图能写出「不符合作物种类的斑点条纹」这种）。

现在改为**确定性构建**：

```text
基础缺陷（15 项固定）
+ 角色纠错（wrong character / hair color / eye color，仅在库命中时）
+ 反向颜色（角色没有的发色瞳色）
+ 非人形排除（1girl / 1boy / human / humanoid / long hair）
+ 模型补充最多 6 个且不与 prompt 冲突的词
```

## 其他改进

```text
库里的人物/生物特征会自动补进 prompt（最多 6 个），
  罗三炮的输出因此带上了 floppy ears / pig nose / short stubby legs / bump on head
非人形时清洗 notes 里误写的人类特征（猫耳、发髻、发色、瞳色）
```

## 罗三炮用例结果

```text
prompt: solo, luo san pao, creature, quadruped, small animal, pale purple fur,
        fluffy body, floppy ears, big dark blue eyes, pig nose, short stubby legs,
        bump on head, cute, chibi proportions, standing, ... 
negative: 只有 32 项（含 1girl/1boy/human/humanoid/long hair 排除）
style: 空（anima base）
```

## 安装

1. 运行 `Lumen-Studio-Flow-Setup-0.2.64.exe`
2. 首次启动自动部署 ComfyUI + Python + Anima Base + Qwen3 + VAE

GitHub：https://github.com/7ather-LX/lumen-studio-flow
