# Lumen Studio Flow v0.3.4

完全免费、为爱发电的本地 AI 绘画工作台。Electron + ComfyUI + Anima，本地优先，不上传素材。

## 修复：角色库误匹配（宣传片录制时发现）

```text
现象：提示词里写 knight / castle 这类通用词，程序会误判成某个角色，
      并把该角色的发色瞳色整套注入，画面直接变成另一个角色。

原因：匹配时把角色的短别名也算进去了（alias 里存在 knight、castle 这类词）。

修复：只按「规范角色名」和「中文名」匹配，短别名不再参与。
      单测 5/5 通过，未匹配到角色时提示词保持原样。
```

## 修复：默认风格词导致画面过饱和

```text
现象：默认风格里同时有 vibrant colors / high contrast / limited palette，
      叠加后画面被压成霓虹海报色，肤色发紫。

修复：移除这三个词，保留 cel shading、flat colors、clean lineart、
      depth of field、detailed eyes 等不影响色彩的风格锚点。
```

## 其他

```text
高清化：恢复为独立生成高清版本，原图保留（0.3.2 起）
重修功能：已整体取消（0.3.1 起）
删除作品：图片、元数据、缩略图、隐藏标记一并清理
```

## 回归

```text
qa-flow 24/24 · qa-prompts 10/10 · qa-appearance 5/5 · qa-traits 6/6 · qa-sanitize 6/6
合计 51 项
```

## 安装

1. 运行 `Lumen-Studio-Flow-Setup-0.3.4.exe`
2. 首次启动自动部署 ComfyUI + Python + Anima Base + Qwen3 + VAE

GitHub：https://github.com/7ather-LX/lumen-studio-flow
