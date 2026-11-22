# Lumen Studio Flow 工作规范（生成 / 验证 / 清理图片）

> 本文件是所有对话的硬性约束，优先级高于“方便”。来源：用户 2026-11-22 指定。
> 违反过的教训：曾启动 UI、用 CDP 点「生成」、把测试图写进 `outputs` 污染作品栏、留下几十张废案。

## 0. 一句话版本

```text
后台 ComfyUI + HTTP API + 独立实验目录 + 小批量 + 立即筛选 + 立即清理 + 不碰用户数据
```

## 1. 不要启动软件 UI

- 不要运行 `Lumen Studio Flow.exe`，不要开 Electron 窗口，不要 Playwright / CDP 点按钮，不要截图
- ComfyUI 是后台 HTTP 服务，不需要 UI

只这样启动 ComfyUI：

```powershell
Start-Process -FilePath 'F:\DSH WORKSPACE\.venv\Scripts\python.exe' `
  -ArgumentList '"F:\DSH WORKSPACE\lumen-flow\comfy\main.py"','--listen','127.0.0.1','--port','8188' `
  -WorkingDirectory 'F:\DSH WORKSPACE\lumen-flow\comfy' -WindowStyle Hidden
Invoke-WebRequest http://127.0.0.1:8188/system_stats -UseBasicParsing
```

## 2. 不要调用软件的 generate IPC / UI 生成

`bridge.generate` / `window.flow.generate` / 点「生成」都会把图写进
`F:\DSH WORKSPACE\lumen-flow\outputs` 并生成同名 `.json`，直接出现在软件「作品」栏。

正确做法：直接请求 ComfyUI

```text
POST http://127.0.0.1:8188/prompt
GET  http://127.0.0.1:8188/history/{prompt_id}
GET  http://127.0.0.1:8188/view?filename=...&subfolder=...&type=output
```

## 3. 图片只写实验目录

```text
F:\DSH WORKSPACE\lumen-flow\training\output\_experiments\<日期>\
```

绝不写 `F:\DSH WORKSPACE\lumen-flow\outputs`（那是作品栏）。
ComfyUI 的默认输出在 `comfy\output`，与作品栏不同目录，用 `filename_prefix` 分子目录：

```json
"filename_prefix": "experiments/2026-11-22-thick/test-a"
```

## 4. 命名规则

```text
一个实验一个目录 / 一个版本一个前缀 / 一个 seed 一个文件名
2.5d-thick-green-d80-seed1601600.png
2.5d-thick-mejiro-d88-seed1601600-feetdetail.png
```

禁止：`image.png`、`output.png`、`test.png`、`1.png`。

## 5. 小批量 + 立即筛选 + 立即清理

- 每批 1–3 张，出联系表，留 1 张，其余立即删
- 删前确认绝对路径，只删 `comfy\output\experiments\...` 和 `training\output\_experiments\...`
- 误入 `outputs` 的：确认带测试前缀后，`.png` 与同名 `.json` 一起删；不确定不要批量删

## 6. 用 Python 脚本，不要 UI 自动化

现成脚本：`scripts\comfy_experiment.py`（本项目已提供）

```powershell
F:\DSH WORKSPACE\.venv\Scripts\python.exe F:\DSH WORKSPACE\lumen-flow\scripts\comfy_experiment.py `
  --ref "F:\DSH WORKSPACE\lumen-flow\training\references\mejiro-ardan-ref.jpg" `
  --prompt-file "...\prompts\mejiro-ardan.txt" --negative-file "...\prompts\mejiro-negative.txt" `
  --style-tags 2.5d-thick --denoise 0.88 --steps 32 --cfg 4.5 --seed 1601600 `
  --width 896 --height 1152 --tag mejiro-d88 --feet-detail
```

它会：上传参考图 → 建 workflow → 轮询 → 存到实验目录 → 写参数 json（`--feet-detail` 时再做一次局部脚部精修）。

## 7. 批量实验控制规模

```text
探测：steps 12–18 / batch 1 / 512×768 / 3–5 个 seed
定稿：steps 26–32 / batch 1–3 / 最终分辨率
```

不要一上来 batch 8 / 1024×1536 / hires / 几十个 seed。

## 8. ComfyUI 只启动一次

发了就复用，只发新的 `/prompt`。收工再关：

```powershell
Get-Process python | Where-Object { $_.Path -like '*DSH WORKSPACE*' } | Stop-Process -Force
```

## 9. 联系表每批只做一张

用 PIL 拼图，存实验目录，不要每张图截一次图，不要放进 `outputs`。

## 10. 选图标准

留：角色正确、动作正确、画风正确、手脚无明显结构错误、构图完整。
删：角色/发色/瞳色错、多手多脚、脸崩、构图残缺、纯探 seed。
最终只留：**1 张最终图 + 1 张对比图 + 1 份参数 json**。

## 11. 参数必须记录

每张保留图旁边一个同名 `.json`：

```json
{
  "model": "anima-base-v1.0.safetensors", "lora": null, "style": "2.5d-thick",
  "denoise": 0.88, "steps": 32, "cfg": 4.5, "seed": 1601600,
  "width": 896, "height": 1152,
  "reference": "training/references/mejiro-ardan-ref.jpg",
  "feet_detail": true, "feet_denoise": 0.45,
  "prompt": "...", "negative": "..."
}
```

## 12. 只有用户明确要求才测 UI

启动最小化、用 `--remote-debugging-port`、不开浏览器、不截图、测完立即关闭、不点「生成」。

## 13. 不要污染用户资产（绝对禁止）

```text
references\library    （含 library.json 与自定义分类“小穴”）
pussy\
training\references
用户角色源文件（user-characters-source.json / character_aliases_extra.json / characters-source.json）
lumen-flow\outputs    （用户作品）
```

## 14. 每次任务结束必须清理

检查 `comfy\output\experiments`、`training\output\_experiments`、`lumen-flow\outputs`。
保留：最终图、对比图、参数 json。删除：中间 seed、失败图、重复图、临时上传图。

## 15. 汇报格式

```text
生成图路径 / 保留图路径 / 删除数量 / 参数 / 是否污染 outputs
```

## 16. 出现以下行为立即制止

```text
启动软件窗口 / 打开浏览器 / 点生成按钮 / 写进 lumen-flow\outputs /
不删废案 / 生成几十张不筛选 / 修改 references\library
```
