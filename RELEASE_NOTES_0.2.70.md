# Lumen Studio Flow v0.2.70

完全免费、为爱发电的本地 AI 绘画工作台。Electron + ComfyUI + Anima，本地优先，不上传素材。

## 新增：成人标签面板（130+ 中文标签）

你给的 [ComfyUI-NSFW-PromptSelector](https://github.com/weekii8282/ComfyUI-NSFW-PromptSelector) 我看了，它的核心价值不是节点本身，而是**中文标签库 + 预设**。我们不需要它的 ComfyUI 节点（我们的工作流是代码直接构建的，加节点反而多一层依赖），所以按同样思路做了一套自己的：

```text
位置：创作页（启用 NSFW 工作流时显示）
分组：人数与关系 / 体型与特征 / 服装 / 动作与姿势 /
      表情与状态 / 场景与光线 / 镜头与画质
数量：130+ 条，中文显示、英文写入
交互：点击追加到提示词、自动去重、支持搜索、可清空已选
```

示例：

```text
点「猫耳」      → 提示词追加 cat ears
点「过膝袜」    → 追加 thighhighs
点「浴室」      → 追加 bathroom, steam
搜「束缚」      → 过滤出 束缚 / 项圈 / 捆绑 / 眼罩
```

标签内容是我们自己整理的（对齐 danbooru 常见写法），没有直接复制该仓库文件——它没有 license，直接搬运有授权风险。

## 与已有功能的联动

```text
NSFW 工作流关 → 面板隐藏，提示词强制 safe，并追加 nsfw / nude 等负面
NSFW 工作流开 → 面板显示，自动移除提示词里的 safe 标签
```

## 教程同步更新

`docs/tutorial/index.html` 增加第 20 节「成人标签面板」，包含用法与「一次别点太多」的建议。

## 安装

1. 运行 `Lumen-Studio-Flow-Setup-0.2.70.exe`
2. 首次启动自动部署 ComfyUI + Python + Anima Base + Qwen3 + VAE

GitHub：https://github.com/7ather-LX/lumen-studio-flow
