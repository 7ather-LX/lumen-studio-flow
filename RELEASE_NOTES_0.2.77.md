# Lumen Studio Flow v0.2.77

完全免费、为爱发电的本地 AI 绘画工作台。Electron + ComfyUI + Anima，本地优先，不上传素材。

## 1. 默认画面风格（线条明朗 + 画面丰富）

按你发来的两张优秀案例，把这组词设为默认，每张图自动带上：

```text
film still, detailed background, anamorphic, anime cel shading,
flat colors, bold clean lineart, limited palette, 2D animation key visual
```

```text
- 已经有就不重复追加（你自己写过也不会重复）
- 想换风格（比如厚涂 2.5D），把这组词换成对应词块即可
- AI 编译器也同步知道这组默认词
```

## 2. 修复：标签被追加到「负向提示词」位置

原来点标签是**追加到文本框最末尾**。如果你的提示词末尾是负向内容，标签就跟着变成负面了。

现在改为**插入正向段落的前部**：

```text
跳过开头的质量词（masterpiece, best quality, score_7, safe, ultra detailed…）
再跳过人数词（1girl / solo / 2girls…）
把标签插在这之后 —— 也就是主体与细节之前，永远不会落到负向区域
```

实测：

```text
输入：masterpiece, best quality, score_7, safe, ultra detailed, very aesthetic,
      1girl, solo, keqing (genshin impact), purple hair, worst quality, blurry
点「浴室」后：…, 1girl, solo, bathroom, steam, keqing (genshin impact), purple hair, …
```

## 3. 修复：AI 把「原神」的作品写成「胜利女神尼姬」

根因有三个，逐个修：

```text
① 多角色没拆开
   「芭芭拉和琴」被当成一个整体，只识别出一个人
   → 现在按 和/与/跟/、/， 拆分，逐个匹配，最多 3 个角色

② 单字中文名匹配不到
   「琴」只有一个字，被长度过滤挡住
   → 现在允许单字名，但只有整段完全相等才命中（避免「猎人」这类误匹配）

③ 缺少作品提示
   现在会把「原神 → genshin impact」这种映射直接写进事实里：
   WORK_HINT: genshin impact（用户明确提到的作品，work 字段必须填这个）
   → 后处理阶段强制覆盖模型猜的作品名，写错也会被改回来
```

另外补了 11 个原神角色的中文名（芭芭拉、琴、胡桃、雷电将军、钟离、甘雨、魈、
可莉、菲谢尔、莫娜、七七…），并给 `jean` / `barbara` 这类原来中文名空着的
基础条目补上了权威译名。

> 试过用本地模型批量补译名，但出现了「芭芭拉 → boo tao」这种错配，
> 已回滚，只保留人工确认的条目。宁可少，不能错。

实测输出：

```text
CANONICAL: barbara (genshin impact) | work: genshin impact | zh: 芭芭拉 | tags: 1girl, blue eyes, blonde hair, twintails, white dress…
CANONICAL: jean (genshin impact)    | work: genshin impact | zh: 琴   | tags: 1girl, blue eyes, blonde hair, ponytail, hair bow…
WORK_HINT: genshin impact
```

## 安装

1. 运行 `Lumen-Studio-Flow-Setup-0.2.77.exe`
2. 首次启动自动部署 ComfyUI + Python + Anima Base + Qwen3 + VAE

GitHub：https://github.com/7ather-LX/lumen-studio-flow
