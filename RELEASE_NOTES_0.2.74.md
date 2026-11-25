# Lumen Studio Flow v0.2.74

完全免费、为爱发电的本地 AI 绘画工作台。Electron + ComfyUI + Anima，本地优先，不上传素材。

## 严重回归修复：姿势库空白 + 所有按钮失效

你截图里的现象（姿势库点开是空的、参考库/提示词/设置/训练素材/工作流/使用说明点击无反应）是同一个根因：

```text
我在 v0.2.72 重写 NSFW 标签面板时，用「从 syncNsfwPanel 替换到 openCatalog」
的方式改代码，而这两个函数之间正好夹着 renderCatalog 函数
→ renderCatalog 被整段删掉了
→ 姿势库渲染时抛 ReferenceError，网格为空
→ 后续初始化被异常打断，大量按钮的绑定没走到，于是全都没反应
```

修复：

```text
1. 恢复 renderCatalog（含分类筛选、按分类排序、卡片显示「分类 · 提示词」）
   这次放在文件末尾，函数声明会提升，避免再被区间替换误删
2. 静态校验：
   所有 addEventListener 引用的函数都存在（201 个函数，无缺失）
   所有 $("#id") 引用的元素都在 index.html 里（仅 faceDetail/flowToast 为可选）
```

## NSFW 开关收进标签面板

按你的要求，开关不再放在右侧输出区：

```text
位置：创作页 → NSFW 标签设置 → 标题行右侧
形式：拨动开关 + 状态文字（开 / 关（自动打码））
右侧输出区原来的那一行已移除（保留隐藏字段供生成逻辑读取）
```

完整标题行长这样：

```text
NSFW 标签设置        [●  NSFW 工作流]  开        [▾ 展开]
```

点标题行空白处收起/展开，点开关只切换开关（不会误触折叠）。

## 安装

1. 运行 `Lumen-Studio-Flow-Setup-0.2.74.exe`
2. 首次启动自动部署 ComfyUI + Python + Anima Base + Qwen3 + VAE

GitHub：https://github.com/7ather-LX/lumen-studio-flow
