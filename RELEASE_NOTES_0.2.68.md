# Lumen Studio Flow v0.2.68

完全免费、为爱发电的本地 AI 绘画工作台。Electron + ComfyUI + Anima，本地优先，不上传素材。

## 修复：单人提示词仍出群像

你给的用例（Silence Suzuka，7 张全带人群）我做了对照实验：

```text
纯提示词（832×1216，seed 424001）        数人 = 1
提示词 + anime-cel 画风词（含 key visual）  数人 = 1
群像提示词（crowd / audience / 6girls）    数人 = 9   ← 检测器有效
```

也就是说：**只靠这条提示词我复现不出群像**，所以更可能是会话里还挂着一张含多人的参考图
（「以当前图重绘」或「借鉴这张」留下的），那样每张都会继承人群。

不管原因是什么，现在加了三道防线：

```text
1. 负面前置
   crowd / group / multiple girls / character sheet / audience 等移到负面最前面
   （负面太长会被编码器截断，原来放在末尾等于没写）

2. 生成后单人校验（核心）
   声明 solo / 1girl 时，逐张用姿态模型数人：
     >1 人 → 自动重跑（最多 2 次）
     第 2 次重跑会额外剥掉 prompt 里的 key visual / ensemble / poster / group shot，
     并补 single character focus, simple background
   重跑结果覆盖回同一张，元数据记录 singleRetry 次数
   两次仍多人 → 保留但明确提示「Still N people after retries」

3. 参考图多人告警
   带参考图生成时先数人，>1 人直接提示：
   「参考图检测到 N 人，会带到结果里，建议先在参考库点『裁单人』」
```

## 说明

单人校验需要 python + onnxruntime（首次部署已自动安装），
检测不到环境时会静默跳过，不影响出图。

## 安装

1. 运行 `Lumen-Studio-Flow-Setup-0.2.68.exe`
2. 首次启动自动部署 ComfyUI + Python + Anima Base + Qwen3 + VAE

GitHub：https://github.com/7ather-LX/lumen-studio-flow
