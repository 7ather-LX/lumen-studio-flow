# Lumen Studio Flow v0.2.90

完全免费、为爱发电的本地 AI 绘画工作台。Electron + ComfyUI + Anima，本地优先，不上传素材。

## 新增：角色外观库（外观我们自己写，不让模型猜）

设置页新增「角色外观库」。你可以直接为任意角色写入外貌标签：

```text
角色名：厌战   （中文或英文 tag 都行，例如 warspite (azur lane)）
外观标签：blonde hair, long hair, purple eyes, flat chest
```

```text
- 保存后写入 %APPDATA%\Lumen Studio Flow\character-appearance.json
- 生成时优先使用这里的数据，覆盖内置库
- 衣服不用写：头发、瞳色、发型、身材、兽耳尾巴这些写清就够
- 列表里可以随时删除某条覆盖
```

### 已内置 38 条外观（不含衣服）

```text
碧蓝航线：厌战、企业、拉菲、绫波、高雄、爱宕、赤城、加贺、大凤、
        欧根亲王、俾斯麦、胡德、光辉、独角兽、可畏、天狼星、贝尔法斯特
舰C：大和、岛风、金刚、吹雪、夕立、时雨
原神：钟离、胡桃、雷电将军、纳西妲、芙宁娜、刻晴、甘雨、魈、可莉、莫娜、菲谢尔
蔚蓝档案：白子、日奈、爱丽丝
Fate：阿尔托莉雅
```

例如：

```text
厌战   → blonde hair, long hair, purple eyes, flat chest
贝尔法斯特 → white hair, long hair, blue eyes, large breasts
钟离   → brown hair, long hair, amber eyes
白子   → grey hair, long hair, blue eyes, wolf ears, halo
```

## 清理

```text
删除了「从公开图库反推外观」的脚本与噪声输出：
  它会把同作品其他角色的发色瞳色带进来（厌战被推成兽耳、贝尔法斯特被推成红瞳双马尾）
  这种数据比空着更糟，已整体移除
默认模型路径改为空字符串，交给自动发现（models\llm / 原路径 / 用户数据目录）
```

## 关于「外观未收录」的角色

```text
扩充库还有 13000+ 条只有名字。这类角色发送时会提示：
「该角色的外观未收录在本地库，生成结果可能与其官方设定有偏差；建议上传角色参考图。」
解决办法：在设置页写一条该角色的外观，或用参考图。
```

## 回归

```text
qa-prompts 10/10    qa-traits 6/6
```

## 安装

1. 运行 `Lumen-Studio-Flow-Setup-0.2.90.exe`
2. 首次启动自动部署 ComfyUI + Python + Anima Base + Qwen3 + VAE

GitHub：https://github.com/7ather-LX/lumen-studio-flow
