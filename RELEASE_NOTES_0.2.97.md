# Lumen Studio Flow v0.2.97

完全免费、为爱发电的本地 AI 绘画工作台。Electron + ComfyUI + Anima，本地优先，不上传素材。

## 「总是两个角色」的真正原因：整段 AI JSON 被当成了提示词

查了你最近几张作品的元数据，问题很清楚：

```text
prompt: masterpiece, best quality, score_7, safe,
{ "character": "keqing (genshin impact), k (nikke)", ...,
  "prompt": "... 1girl, solo, keqing ...",
  "negative_prompt": "... 2girls, multiple girls, animal ears ..." },
no shoes, cinematic rendering, ...
```

也就是说：**AI 返回的整段 JSON 被粘进了正向提示词框**。于是

```text
1. JSON 里的 "character": "keqing (genshin impact), k (nikke)" → 两个角色名进了正向
2. JSON 里的 negative_prompt 文本里含 2girls / multiple girls / animal ears
   → 这些词作为「正向文字」被模型读到，当然画两个人、还带兽耳
3. 你后来加的负向词再多，也压不过正向里明明白白写着的 2girls
```

不是标签面板残留，也不是负向没生效——是正向被 JSON 污染了。

## 修复 1：生成前强制清洗（main 进程，绕不过去）

```text
① 提示词里出现 JSON → 解析出 prompt / negative_prompt，丢掉 JSON 结构体
   前后残留的文字保留为普通标签
② 正向里夹带 "negative:" / "NEGATIVE：" / "negative_prompt:" 段 → 整段截断
   （这段内容并入负向）
③ 人数冲突：同时有 1girl/solo 和 2girls/multiple girls → 保留单人，多人写进负向
④ 单人声明下出现多个角色 tag → 只留第一个，其余写进负向（wrong character）
```

生成时进度条会提示「已从粘贴的 JSON 中提取提示词」或「单人请求：已移除多余角色 xxx」。

## 修复 2：粘贴时就自动拆分

在提示词框里粘贴整段 AI JSON：

```text
自动把 prompt 写进正向、negative_prompt 写进负向
提示「识别到 AI JSON：已自动拆分为正向 / 负向提示词」
```

不会再出现「JSON 躺在正向框里」的情况。

## 修复 3：单测覆盖真实案例

```text
scripts/qa-sanitize.cjs  6/6
  PASS 粘进来的 JSON → 提取 prompt 并剔除 JSON 残留
  PASS 1girl + 2girls 冲突 → 保留单人
  PASS 正向夹带 negative: 段 → 截断
  PASS 单人多角色 → 只留第一个
  PASS 正常单人提示词 → 不被改动
  PASS 双人请求 → 不误删（真要多人的情况不会被打断）
```

回归：qa-prompts 10/10、qa-appearance 5/5、qa-traits 6/6、qa-sanitize 6/6。

## 你现在该怎么做

```text
1. 升级到 0.2.97
2. 提示词框里那段 JSON 直接清空（或者重新粘一次，会自动拆分）
3. 正常写：1girl, solo, keqing (genshin impact), 紫发紫瞳, 姿势…
```

## 安装

1. 运行 `Lumen-Studio-Flow-Setup-0.2.97.exe`
2. 首次启动自动部署 ComfyUI + Python + Anima Base + Qwen3 + VAE

GitHub：https://github.com/7ather-LX/lumen-studio-flow
