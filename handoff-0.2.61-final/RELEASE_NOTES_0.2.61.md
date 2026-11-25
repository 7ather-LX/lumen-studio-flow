# Lumen Studio Flow v0.2.61

完全免费、为爱发电的本地 AI 绘画工作台。Electron + ComfyUI + Anima，本地优先，不上传素材。

## AI 关键词助手：重写成真正的「提示词编译器」

旧版只有 7 条规则，输出 10~14 个标签，还会把角色事实写错（刻晴被写成青发绿眼）。

三处改造：

```text
1. 系统提示词重写
   12 项必识别清单（人数/角色/作品/发色/发型/瞳色/耳尾头饰/服装/动作/镜头/场景/光线/画风）
   强制标签顺序 + 质量前缀 + 画风块（2.5D / 赛璐珞二选一）
   要求 prompt ≥ 45 个标签、negative ≥ 20 个标签，输出前自检

2. 注入本地角色库（治本）
   输入出现角色名（中文/英文/别名/拼音）→ 从内置 2450 个角色里匹配
   把 canonical tag 与发色/瞳色/发型/服装标签作为「权威事实」注入
   提示词要求照抄，不许用模型记忆覆盖

3. 确定性兜底（不靠模型自觉）
   character 缺失 → 自动补 canonical tag
   prompt 缺发色/瞳色 → 自动补
   negative 自动追加「反向颜色」：紫发紫瞳就写 blue hair / green hair 等
```

同句实测（我想画原神刻晴，站立叉腰，站在树下）：

```text
旧版：14 个标签，青发绿眼（错），无镜头无光线
新版：50 个标签，purple hair / purple eyes（正确），
      hands on hips / akimbo / under tree / dappled sunlight /
      2.5D 画风块 / detailed hands，负面 26 个标签
```

模型参数：temperature 0.55 → 0.40，max_tokens 1600 → 2600。

## 其他设备可用性

```text
放大模型可一键安装
  高清化页检测不到模型时显示提示 +「安装放大模型（约 145MB）」
  三个模型实测可直接下载（17.1MB / 63.9MB / 64.0MB，带 3 次重试与体积校验）
  失败可「打开模型目录」手动放入；Lanczos 兜底始终可用

自动部位检测
  初始化脚本新增 pip install onnxruntime，新设备装完即可用「自动区域」
  安装失败静默回退到比例区域，不阻塞出图
```

## 已知限制

本地模型是纯文本模型，**不支持读图**。「给 AI 发图片生成提示词」需要视觉模型，本机没有。

## 安装

1. 运行 `Lumen-Studio-Flow-Setup-0.2.61.exe`
2. 安装会创建桌面快捷方式
3. 首次启动会自动部署 ComfyUI + Python + Anima Base + Qwen3 + VAE
4. 在设置中确认 ComfyUI / Python / 输出目录

## 模型与 LoRA

- 25d_anima_v5
- hand_anima_v1
- foot_anima_v4
- fabric_anima_v3

GitHub：https://github.com/7ather-LX/lumen-studio-flow
