# Lumen Studio Flow v0.2.80

完全免费、为爱发电的本地 AI 绘画工作台。Electron + ComfyUI + Anima，本地优先，不上传素材。

## 修复：AI 乱塞角色与作品（尼姬、波拉…）

你那条「两个柴郡」的输入暴露了 5 个叠加缺陷，逐条修：

### ① 短名字符串误匹配 → `sin (nikke)`

```text
旧逻辑：名字只要「出现在文本里」就算命中
"satin" 里含 "sin" → 命中 sin (nikke)
现在：英文名必须词边界、且长度 ≥4；中文名用包含匹配
```

### ② 作品短名满天飞 → `ib | ll | nt | ef | air`

```text
旧逻辑：作品名一律做子串匹配，库里存在 ib / ll / nt / ef / air 这类短作品名
        任何文本都会命中，WORK_HINT 直接被污染
现在：中文作品名（原神、碧蓝航线…）用包含匹配；
      英文作品名必须词边界且长度 ≥6
```

### ③ 作品名把同作品的其他角色带进来 → `pola (azur lane)`

```text
波拉的中文名是「波拉（碧蓝航线）」，分词后「碧蓝航线」出现在你的文本里
→ 命中波拉
现在：匹配前先把作品名从文本里抹掉，再拆角色
```

### ④ 人数与 solo 冲突（这条最致命）

```text
AI 输出 "2girls, solo"，而生成层看到 solo 就往负面注入 2girls / multiple girls
→ 模型同时收到「画两个」和「不要两个」，只能画成一坨
现在两侧都修：
  生成层：检测到 2girls/2boys/multiple girls 就不注入多人负面，并删掉 solo/1girl
  后处理：prompt 有 2girls 时删 solo，并把负面里的人数字段清除
```

### ⑤ 场景臆造（室内却写树影阳光）

```text
AI 规则新增：场景元素必须来自用户描述，卧室/床上不允许出现
dappled sunlight / tree shade / outdoors
```

## AI 规则同步

```text
- 只能使用用户明确提到的角色，character 字段不得出现其他角色
- 角色数量必须与用户一致：两个 → 2girls（不写 solo）；一个 → 1girl, solo
- 场景不得与用户描述冲突
- 自检新增：是否混入未提及角色 / 人数与 solo 是否并存 / 场景是否冲突
```

## 实测（真实本地模型 + 真实后处理）

输入：两个相同的碧蓝航线柴郡，一白一黑内衣，俯身亲吻胸前，卧室床上

```text
character: cheshire (azur lane)          ← 只有一个，无 nikke/波拉
work:      azur lane
prompt:    2girls, cheshire (azur lane), white bra …, black bra …, 动作串, bedroom, bed
           无 solo、无 dappled sunlight / tree shade
negative:  11 项基础 + 反向颜色，无 2girls（不再自我拆台）
```

## 安装

1. 运行 `Lumen-Studio-Flow-Setup-0.2.80.exe`
2. 首次启动自动部署 ComfyUI + Python + Anima Base + Qwen3 + VAE

GitHub：https://github.com/7ather-LX/lumen-studio-flow
