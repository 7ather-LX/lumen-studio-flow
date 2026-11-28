# Lumen Studio Flow v0.3.0

完全免费、为爱发电的本地 AI 绘画工作台。Electron + ComfyUI + Anima，本地优先，不上传素材。

## 按你的要求：衍生图不再单独存在，直接覆盖原图

```text
取消上一版的「显示衍生图」开关（不再多一个框、不多占内存）

高清化    → 结果覆盖原图，不再产生 xxx-hd2x.png 副本
局部修正  → 结果覆盖原图，不再产生 xxx-fix.png 副本
面部精修  → 结果覆盖原图（上一版已实现）

元数据同步更新：upscaled / fixed / faceDetail 标记写在原图自己的 .json 里
```

一条作品就是一条，画廊不会再出现同款多份。

## 已帮你合并历史副本

```text
10 个冗余的 -hd3x / -hd2x 副本（原图仍在）→ 移到 _archive\merged-derivatives-*
45 个 -hd2x（原图已被旧版删除，是唯一版本）→ 保留，不动
现有作品 99 张，全部图文成对
```

> 那 45 张之所以只有高清版，是旧版批量高清会删除原图。现在改成覆盖后，这个情况不会再出现。

## 回归

```text
qa-flow 22/22（新增：高清/修正覆盖原图、不留副本、无衍生开关）
qa-prompts 10/10 · qa-appearance 5/5 · qa-traits 6/6 · qa-sanitize 6/6
合计 49 项
```

## 安装

1. 运行 `Lumen-Studio-Flow-Setup-0.3.0.exe`
2. 首次启动自动部署 ComfyUI + Python + Anima Base + Qwen3 + VAE

GitHub：https://github.com/7ather-LX/lumen-studio-flow
