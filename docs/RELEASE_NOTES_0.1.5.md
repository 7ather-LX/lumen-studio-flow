# Lumen Studio Flow v0.1.5

P0 第一轮：角色库扩容、拼音识别、Hires Fix、提示词检查。

## 角色库扩容

- 角色条目：2400+
- 新增热门游戏：
  - 原神
  - 崩坏：星穹铁道
  - 绝区零
  - 碧蓝航线
  - 蔚蓝档案
  - 明日方舟
  - Fate
  - 赛马娘
  - NIKKE
  - 鸣潮
  - 战双帕弥什
  - 东方Project
- 新增热门动漫：
  - 火影忍者
  - 海贼王
  - 咒术回战
  - 鬼灭之刃
  - 葬送的芙莉莲
  - 间谍过家家
  - 电锯人
  - 莉可丽丝
  - Re:从零开始
  - 刀剑神域
  - 我推的孩子
  - 孤独摇滚

支持中文名、英文名、拼音和别名。

示例：

```text
柴郡 / 碧蓝航线的柴郡 -> cheshire (azur lane)
chaijun -> 柴郡
爱丽丝 -> 多作品候选
```

## 拼音

为中文别名生成拼音：

```text
柴郡 -> chai jun / chaijun
```

## Hires Fix

设置面板新增「Hires 1.5x」：

```text
512 基础图
-> 1.5x latent upscale
-> 低 denoise 二次采样
-> 768 输出
```

比直接 1024 一次生成更省显存。

## 提示词检查

生成前会检查：

- 是否有质量词
- 是否有 @画师
- 是否有重复 tag

示例：

```text
检查：顺序与基础结构正常
```

## 仍待完成

- Face Detailer 还没有接入
- 角色参考图 / IP-Adapter / Anima LLLite 还没有接入
- 角色 LoRA 训练器还没有接入

## 实测

- 柴郡识别 + 2.5D + 躺床 + 生成通过
- Hires 1.5x 工作流通过
- 同名角色选择通过
- 拼音匹配通过

![Cheshire](cheshire-test-2.png)
