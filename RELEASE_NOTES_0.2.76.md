# Lumen Studio Flow v0.2.76

完全免费、为爱发电的本地 AI 绘画工作台。Electron + ComfyUI + Anima，本地优先，不上传素材。

## NSFW 开关取消：始终开启，永不自动打码

你说得对，这个开关带来的问题比价值多。按你的要求整体移除：

```text
删除 1：面板里的「NSFW 工作流」开关（不再有开/关状态）
删除 2：生成后自动打码的整套逻辑（姿态定位、像素化、兜底带）
删除 3：局部修正完成后的二次打码
删除 4：censor-mosaic.py 脚本与打包条目
删除 5：成人关键词检测（ADULT_RE / CHEST_RE）与相关负面注入
```

保留并固定为「始终开启」的行为：

```text
提示词里移除 safe 标签
移除所有打码相关词（正向 + 负向）：censored / mosaic censoring /
  bar censor / pixelated / pixelation / censor bar / mosaic
负面追加：censored, mosaic censoring, pixelated, censor bar
  —— 主动压制模型自己画马赛克条的倾向
```

面板标题行现在显示：

```text
NSFW 标签设置      始终开启 · 不打码      [▾ 展开]
```

## 影响

```text
- 不再有任何 NSFW 相关报错路径（生成链路里已无该分支）
- 出图永远是原图，不会出现自动马赛克
- 成人标签面板仍然可用，自动识别勾选、折叠都保留
```

## 安装

1. 运行 `Lumen-Studio-Flow-Setup-0.2.76.exe`
2. 首次启动自动部署 ComfyUI + Python + Anima Base + Qwen3 + VAE

GitHub：https://github.com/7ather-LX/lumen-studio-flow
