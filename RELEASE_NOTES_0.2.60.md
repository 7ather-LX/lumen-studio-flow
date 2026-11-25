# Lumen Studio Flow v0.2.60

完全免费、为爱发电的本地 AI 绘画工作台。Electron + ComfyUI + Anima，本地优先，不上传素材。

## AI 关键词助手：重写为真正的「提示词编译器」

旧版只有 7 条规则，输出 10~14 个标签，还出现角色事实错误（刻晴被写成青发绿眼）。

本版三处改造：

```text
1. 系统提示词重写
   12 项必识别清单（人数/角色/作品/发色/发型/瞳色/耳尾头饰/服装/动作/镜头/场景/光线/画风）
   强制标签顺序 + 质量前缀 + 画风块（2.5D / 赛璐珞二选一）
   要求 prompt ≥ 45 个标签、negative ≥ 20 个标签
   输出前自检清单，不合格重写

2. 注入本地角色库（关键）
   输入里出现角色名（中文/英文/别名/拼音）→ 从内置 2450 个角色里匹配
   把 canonical tag 与该角色的发色/瞳色/发型/服装标签作为「权威事实」注入
   提示词明确要求：照抄，不许用模型记忆覆盖

3. 确定性兜底（不依赖模型自觉）
   character 字段缺失 → 自动补 canonical tag
   prompt 缺发色/瞳色标签 → 自动补
   negative 自动追加「反向颜色」：紫发紫瞳就把 blue hair / green hair 等写进负面
```

同一句输入的实测对比：

```text
输入：我想画一个原神里的刻晴，角色站立叉腰，站在树下

旧版：14 个标签，青发绿眼（错），无镜头/无光线
新版：50 个标签，purple hair / purple eyes（正确），
      含 hands on hips / akimbo / under tree / dappled sunlight /
      2.5D 画风块 / detailed hands，负面 26 个标签
```

模型参数同步调整：temperature 0.55 → 0.40，max_tokens 1600 → 2600，静默思考关闭。

## 其他设备可用性

```text
放大模型自动安装
  高清化页在检测不到模型时显示提示，可一键「安装放大模型（约 145MB）」
  优先 hf-mirror，失败回退 GitHub releases；也可「打开模型目录」手动放入
  下载失败不影响使用：Lanczos 兜底照常可用

自动部位检测
  初始化脚本新增 pip install onnxruntime，新设备装完即可用「自动区域」
  安装失败时静默回退到比例区域，不阻塞
```

## 已知限制

本地模型是纯文本模型，**不支持读图**。「给 AI 发图片生成提示词」需要视觉模型，本机没有；
如需该能力，要额外部署一个 VLM（体积数 GB），可另行评估。

## 安装

发布包是单安装器。首次启动如果缺少 ComfyUI / Python，会弹出“一键部署完整环境”。

1. 运行 `Lumen-Studio-Flow-Setup-0.2.60.exe`
2. 安装会创建桌面快捷方式
3. 首次启动会自动部署 ComfyUI + Python + Anima Base + Qwen3 + VAE
4. 在设置中确认 ComfyUI / Python / F 盘输出目录

## 模型与 LoRA

- 25d_anima_v5
- hand_anima_v1
- foot_anima_v4
- fabric_anima_v3

GitHub：https://github.com/7ather-LX/lumen-studio-flow
