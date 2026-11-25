# Lumen Studio Flow v0.2.62

完全免费、为爱发电的本地 AI 绘画工作台。Electron + ComfyUI + Anima，本地优先，不上传素材。

## 角色库扩充：2450 → 15,988

数据来源：danbooru 角色标签库（40,931 个角色，取热度 ≥100 的 13,538 个补进来，去重后与原有 2,450 条合并）。

```text
原有 2450 条：带完整属性标签（发色/瞳色/发型/服装），中文名人工整理
新增 13538 条：canonical 英文 tag + 作品名 + 别名 + 热度
             其中 776 条补了「双校验通过」的中文名
```

中文名的校验方法（避免错名匹配错角色）：

```text
第一轮：模型翻中文 → 再让模型翻回英文 tag → 与原 tag 比对（800 条通过）
第二轮：模型判断题「『晓美焰』= akemi homura (magical girl) 吗？」→ 只认 true
两轮都通过且全库唯一 → 才写入（最终 776 条）
```

因为新条目没有属性标签，注入时会明确标注：

```text
attributes: unknown（本库只有 canonical 名，发色/瞳色/服装请按官方设定，不确定就写进未确认）
```

## 中文输入识别率提升

```text
1. 中文名分词匹配
   库里「惣流·明日香·兰格雷」这类带分隔的名字会拆成片段，
   用户只写「明日香」也能命中，不必写全名。

2. 兜底解析（库里确实没有时）
   让本地模型给出候选 canonical tag，再回本地库校验是否真实存在；
   存在才采信，不存在就当没识别到。
   例：晓美焰 → akemi homura (magical girl) ✔
       明日香 → souryuu asuka langley ✔
       艾伦耶格尔 → eren yeager ✔
```

## 修复：非人形角色被写成 1girl

旧的质量前缀把 `1girl, solo` 写死，导致「皮卡丘」也输出 `1girl`。

现在前缀不含人数，人数由识别步骤决定：

```text
人形角色 → 1girl / 1boy / solo
非人形（宝可梦、动物、机械、物件）→ solo + 该对象，禁止写 1girl
输出前自检新增：非人形角色是否被误写成 1girl
```

## 覆盖范围说明

danbooru 以动画 / 游戏 / 漫画角色为主，**真人影视角色覆盖有限**（好莱坞真人片基本没有，
特摄、部分电影改编动画有）。这是数据源本身的边界，不是软件限制。

## 安装

1. 运行 `Lumen-Studio-Flow-Setup-0.2.62.exe`
2. 首次启动自动部署 ComfyUI + Python + Anima Base + Qwen3 + VAE

GitHub：https://github.com/7ather-LX/lumen-studio-flow
