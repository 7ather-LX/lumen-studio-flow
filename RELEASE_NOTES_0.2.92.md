# Lumen Studio Flow v0.2.92

完全免费、为爱发电的本地 AI 绘画工作台。Electron + ComfyUI + Anima，本地优先，不上传素材。

## 修复：高清化后小窗口预览发糊、有颗粒感

根因不是显示缩放，而是**高清化时锐化过猛**：USM 90% + 边缘增强 18% 把高层细节（线条、蕾丝、发丝）拉成高频噪点，缩略图一缩小就变成颗粒。

三处修：

```text
1. 锐化减弱：USM 90% → 55%，阈值 2 → 4，边缘增强 18% → 6%，对比 1.04 → 1.02
2. 生成真实缩略图：列表返回 thumbUrl（520px JPEG，轻微抗锯齿），
   画廊与高清化选图都使用缩略图，不再用 4K 原图直接缩
3. 缩略图缓存在 outputs\.thumbs\，源文件更新后自动重建
```

已为现有 108 张作品预生成缩略图，重开软件即可看到差别。

## 角色外观库：覆盖率 28.7%，新增批量导入/导出

### 进度

```text
总条目 15,990
有外观   4,588（28.7%）
  ├ 换装继承    2,433
  ├ 首词继承    1,208（同名前缀且外观唯一时）
  ├ 策展条目      60（碧蓝航线 / 明日方舟 / 赛马娘 / 原神 / 蔚蓝档案 / Fate …）
  └ 原有基础库   2,130
```

本轮新增策展（示例）：

```text
伊丽莎白女王  blonde hair, twintails, red eyes, flat chest
威尔士亲王    blonde hair, long hair, blue eyes, large breasts
提尔比茨      silver hair, long hair, blue eyes, large breasts
圣路易斯      blonde hair, long hair, blue eyes, large breasts
弗里德里希    white hair, long hair, red eyes, huge breasts
乌尔里希      black hair, long hair, red eyes, large breasts
阿兹玛        black hair, long hair, red eyes, large breasts
闪耀（方舟）  blonde hair, long hair, blue eyes, large breasts
华法琳        white hair, long hair, red eyes, flat chest
白面鸮        white hair, long hair, blue eyes, medium breasts
目白赖恩      black hair, long hair, blue eyes, horse ears
目白布莱特    brown hair, long hair, green eyes, horse ears
```

### 新增：批量导入 / 导出

设置页 → 角色外观库：

```text
批量导入（每行一条）：
  warspite (azur lane), blonde hair, long hair, purple eyes, flat chest
  belfast (azur lane), white hair, long hair, blue eyes, large breasts
  也支持直接粘贴 JSON：{"角色tag": ["blonde hair", "blue eyes"]}

导出全部：一键下载当前所有覆盖为 CSV，方便备份/移交
```

配套待填清单：Release 附件里的 `character-appearance-template.csv`，
含六个主要作品共 649 个「热度高但缺外观」的角色，填好后直接粘进批量导入。

## 关于「全部角色自动补全」

试过三条自动路线，都因准确率不可接受而放弃：

```text
公开图库反推 → 厌战被推成兽耳、贝尔法斯特被推成红瞳双马尾
本地模型批量写 → 出现过角色错配
首词模糊匹配 → 只在「外观唯一」时才敢用（已采用，1,208 条）
```

所以现在的原则是：**能确认的写进去，不能确认的明确标记缺外观并提示补图**。

## 回归

```text
qa-prompts 10/10    qa-traits 6/6
```

## 安装

1. 运行 `Lumen-Studio-Flow-Setup-0.2.92.exe`
2. 首次启动自动部署 ComfyUI + Python + Anima Base + Qwen3 + VAE

GitHub：https://github.com/7ather-LX/lumen-studio-flow
