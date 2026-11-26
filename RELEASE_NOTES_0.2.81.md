# Lumen Studio Flow v0.2.81

完全免费、为爱发电的本地 AI 绘画工作台。Electron + ComfyUI + Anima，本地优先，不上传素材。

## 修复：厌战被写成 `winston (azur lane)`

根因不是模型不认识，而是**库里没有中文名**：

```text
warspite (azur lane) 在库里存在，但 zh 字段是空的
→ 「厌战」匹配不到任何条目
→ 模型只能自己猜，猜成了 winston (azur lane)
```

### ① 补录 48 个舰娘中文名

```text
碧蓝航线：厌战、柴郡、企业、贝尔法斯特、光辉、独角兽、拉菲、绫波、雪风、
        高雄、爱宕、大凤、赤城、加贺、翔鹤、瑞鹤、长门、陆奥、俾斯麦、
        提尔比茨、胡德、声望、反击、欧根亲王、齐柏林伯爵、埃塞克斯、
        圣地亚哥、巴尔的摩、布莱默顿、无畏、可畏、胜利、天狼星、狄多、
        谢菲尔德、火奴鲁鲁、圣路易斯、海伦娜、孟菲斯、让·巴尔、黎塞留、
        敦刻尔克、江风、青叶、利托里奥、维托里奥·维内托、罗恩、扎拉、波拉
舰C：大和、武藏、岛风、金刚、比叡、榛名、雾岛、吹雪、夕立、时雨、凤翔、龙骧
```

### ② 同名角色按作品加权

「厌战」在舰C 和碧蓝航线都有，之前会随机命中舰C版：

```text
现在：用户提到「碧蓝航线」→ 作品匹配的条目 +45 分
实测：厌战 → warspite (azur lane) | work: azur lane ✔
```

### ③ AI 规则：以当前消息为准 + 属性未知不许编

```text
- 历史消息里的角色不得沿用（上一轮聊柴郡、这一轮说厌战，就只写厌战）
- CHARACTER_FACTS 标注 attributes: unknown 时，不得凭印象编造发色/瞳色/服装，
  只写通用描述并在「未确认项」注明
- 自检新增对应两条
```

### 实测（真实本地模型 + 真实后处理）

```text
输入：两个相同的碧蓝航线的厌战，一白一黑内衣，俯身亲吻胸前，卧室床上

character: warspite (azur lane)     ✔
work:      azur lane                ✔
prompt:    2girls, warspite (azur lane), white bra …, black bra …, 动作串, bedroom, bed
           无 solo、无其他角色、无编造发色瞳色
notes:     明确写出「attributes unknown，未强行编造颜色」
```

## 关于速度：软件默认走 GPU

```text
软件启动本地 AI 的参数：--n-gpu-layers 99（显卡加速）
生成前会自动 stopLlm() 让出显存，互不抢占
实测 RTX 4070 SUPER：73 tok/s（CPU 模式只有约十分之一）
提醒：不要额外手动开一个 llama-server，软件会复用那个实例，导致一直在 CPU 上跑
```

## 安装

1. 运行 `Lumen-Studio-Flow-Setup-0.2.81.exe`
2. 首次启动自动部署 ComfyUI + Python + Anima Base + Qwen3 + VAE

GitHub：https://github.com/7ather-LX/lumen-studio-flow
