# Lumen Studio Flow 交接包

更新时间：2026-11-22（19:40 发布 0.2.39）  
当前版本：`0.2.39`  
项目目录：`F:\DSH WORKSPACE\lumen-flow`  
工作区：`F:\DSH WORKSPACE`  
主进程：`app/main.cjs`  
渲染层：`app/renderer/app.js`、`index.html`、`styles.css`  
GitHub：https://github.com/7ather-LX/lumen-studio-flow  
最新 Release：https://github.com/7ather-LX/lumen-studio-flow/releases/tag/v0.2.39

---

## 0. 新对话如何开始

### 0.1 使用同一个工作区

```text
F:\DSH WORKSPACE
```

不要换工作区。

### 0.2 第一条消息

```text
继续 Lumen Studio Flow。
先读取 F:\DSH WORKSPACE\lumen-flow\HANDOFF_CURRENT.md
和 F:\DSH WORKSPACE\lumen-flow\WORKSPACE_MAP.md
以及 F:\DSH WORKSPACE\lumen-flow\WORK_RULES.md（工作规范，必须遵守）。
当前版本 0.2.39，先确认项目状态，再继续。
```

### 0.3 不要依赖 Hindsight

跨对话记忆插件未配置成功，本次不使用。

交接以这三个文件为准：

```text
HANDOFF_CURRENT.md
WORKSPACE_MAP.md
WORK_RULES.md
```

不要假设新对话自动知道旧上下文。

### 0.4 新对话先确认

1. 源码版本是否为 `0.2.39`
2. 本机安装是否为 `0.2.39`
3. GitHub latest 是否为 `v0.2.39`
4. `references/library/library.json` 是否仍有 191 张参考图
5. 自定义分类“小穴”是否仍有 29 张
6. `app/renderer/characters.js` 是否仍包含 `yukikaze (azur lane)`

### 0.5 工作规范（必须遵守，见 WORK_RULES.md）

```text
不要启动软件 UI、不要用 Playwright/CDP 点「生成」、不要调 bridge.generate
图片只写 training\output\_experiments\<日期>\
绝不写 lumen-flow\outputs（那是用户作品栏）
每批 1–3 张，立即筛选、立即删废案
最终只留 1 张最终图 + 1 张对比图 + 1 份参数 json
不碰 references\library / pussy\ / training\references / 用户角色源文件 / 自定义“小穴”
```

现成脚本：`scripts\comfy_experiment.py`（唯一推荐的出图方式）

---

## 1. 项目是什么

本地优先动漫图像工作室：

```text
Electron + ComfyUI
+ Anima Base v1.0 / Anima 2.9B
+ Qwen3 0.6B text encoder
+ Qwen Image VAE
+ Anima Ref Adapter
```

主要能力：

- 参考图 img2img / 角色参考 / 质感参考
- 中文提示词编译
- 角色库与作品识别
- 画风预设与画风预览
- 本地 AI 提示词助手（流式输出、重复惩罚）
- 足部/丝袜/手部修正
- 训练素材
- 工作流预览
- 一键运行时部署与离线包

---

## 2. 关键路径

### 应用

```text
F:\DSH WORKSPACE\lumen-flow\app
```

本机安装：

```text
C:\Users\25576\AppData\Local\Programs\Lumen Studio Flow
```

桌面快捷方式：

```text
C:\Users\25576\Desktop\Lumen Studio Flow.lnk
```

### ComfyUI

```text
F:\DSH WORKSPACE\lumen-flow\comfy
```

启动：

```powershell
F:\DSH WORKSPACE\.venv\Scripts\python.exe `
  "F:\DSH WORKSPACE\lumen-flow\comfy\main.py" `
  --listen 127.0.0.1 --port 8188
```

健康检查：

```powershell
Invoke-WebRequest http://127.0.0.1:8188/system_stats -UseBasicParsing
```

### 模型

```text
models\unet\anima-base-v1.0.safetensors
models\unet\Anima-2.9B-preview-v1.safetensors
models\clip\qwen_3_06b_base.safetensors
models\vae\qwen_image_vae.safetensors
models\checkpoints\MeinaMix-V10.safetensors
models\loras\
```

### 用户参考库

```text
references\library
references\library\library.json
```

**只在本地，不进入 GitHub/安装包。**

当前（2026-11-22 清理 29 条僵尸元数据后，应用内实测 191）：

```text
总参考图 191
foot 85
fabric 38
character 16
style 10
hand 8
foot_real 5
自定义分类“小穴” 29
```

清理说明：原有 220 条记录中有 29 条 `character` 记录的 `file` 指向不存在文件（重复导入留下的僵尸记录），
其原图在 `pussy\`、同一张图已在自定义分类“小穴”中正常存在（SHA256 逐条一致）。
已只删除这 29 条元数据，**没有删任何图片**。备份与清单：

```text
_archive\library-backup-20261122\library.json.20261122-173613.bak
_archive\library-backup-20261122\deleted-29-records.json
_archive\library-backup-20261122\cleanup-zombie-records.js
```

### 用户参考资产

```text
style-source-character.png
style-source-landscape.webp
training\references\semi25d_style_ref.jpg
training\references\gal_style_ref.jpg
training\references\pool_style_ref.jpg
training\references\target_whitehair_style.jpg
training\references\mejiro-ardan-ref.jpg
```

这些是用户给本地校准用的参考图，**不要上传、不要打进安装包、不要删除**。

---

## 3. 当前版本与发布

```text
源码：0.2.39
本机安装：0.2.39
GitHub latest：v0.2.39
```

Release 附件（v0.2.39 共 11 个）：

```text
Lumen-Studio-Flow-Setup-0.2.39.exe
Lumen-Studio-Flow-0.2.39.exe
character-data-v0.2.35.zip
loras-share-v0.2.6.zip
bootstrap_models.ps1
build_offline_bundle.ps1
OFFLINE_BUNDLE.md
REFERENCE_IMPORT.md
import_pose_gallery.py
README.md
RELEASE_NOTES_0.2.39.md
```

说明：

- `latest.yml` 与 `blockmap` 只留在本地 `release\`，不随 Release 上传（沿用 v0.2.35 惯例；应用内无 autoUpdater）
- 旧版本已删除，只保留 v0.2.39
- `character-data` 最新产出仍是 `v0.2.35`，**0.2.36 / 0.2.37 未单独产出数据包**（角色数据无变化）

---

## 4. 最近完成的工作

### 4.1 角色库

- 雪风 `yukikaze (azur lane)` 已加入
- `characters.json` 与 `characters.js` 已同步
- 应用读取的是 `characters.js`

已验证：

```text
我想画一个碧蓝航线里面的雪风，坐在床上，含情脉脉的看着镜头
→ yukikaze (azur lane)
→ azur lane
→ 不再出现 snow / lying
```

### 4.2 参考库

- 构图、角色、质感三个独立参考槽
- 每个槽位有明确的取消按钮
- 质感/部位参考支持自定义说明
- 参考库默认只显示最近 48 张，可“显示全部”
- 自定义分类“小穴”保留

### 4.3 AI 提示词助手

- 流式输出
- 重复惩罚
- 本地 JSON Schema
- 禁用思考链

### 4.4 画风预览

- 所有角色画风预览改为绿色角色生成图
- 风景画风使用风景参考
- 不再使用柴郡、芙莉莲、泳装角色等版权角色作为内置参考
- 黑白日漫/线稿强制灰度
- 2.5D LoRA 与 2.5D 厚涂使用不同预览

### 4.5 赛璐珞改进

第一优先级 `anime-cel` 已验收通过。

新增：

```text
two-tone shading
crisp cel shadows
ambient occlusion
rim light
detailed eyes / hair / fabric / folds
soft cinematic lighting
```

负面词：

```text
flat lighting
no shadows
simple shading
low detail
sketch
unfinished
```

验证图：

```text
cel-improve-contact.png
```

### 4.6 2.5D 厚涂

已新增独立的 `2.5d-thick` 风格。

工作流：

```text
Anima Base
+ 参考图 img2img
+ denoise 0.70
+ 2.5D 厚涂提示词
+ 负面压制 flat color / cel shading
```

内置预览：

```text
app\renderer\style-previews\2.5d-thick.png
```

`25d-lora` 已恢复独立预览，不再和厚涂共用同一张图。

### 4.7 Mejiro Ardan 复杂特写验证

参考图：

```text
training\references\mejiro-ardan-ref.jpg
```

生成结果：

```text
training\output\mejiro-ardan-final.png
mejiro-ardan-final-contact.png
```

结果：

- 角色替换为目白阿尔丹
- 浅蓝长发
- 紫瞳、心形瞳孔
- 马耳、马尾、皇冠编发
- 保留舔足动作
- 保留手部、黑色造型工具
- 保留面部特写和视角
- 2.5D 厚涂质感成立

最终采用：

```text
896 × 1152
denoise 0.88
Anima Base
无 LoRA
```

低 denoise 会残留原图棕发/黑发，因此最终用了 0.88。

### 4.8 0.2.37：参数可控 + 脚趾局部精修

起因：用户拿旧对话的成功图在软件里复现不出来，且脚趾出现多趾/脱节。

定位到的 4 个「静默改参数」问题（均已修）：

```text
自动识别画风        → 提示词含 2.5D/semi-realistic 会把「2.5D 厚涂」顶成「2.5D 半写实」
参考图自动跟画幅     → 先点画幅再拖参考图，画幅会被冲掉（顺序必须是先参考图后画幅）
性能档强制覆盖       → 自动/快速/质量档强制改 steps/cfg/batch/hires，滑杆无效
种子回填            → 生成后写回输入框，下一张沿用，构图漂移
```

0.2.37 的改动：

```text
新增 性能档「自定义 · 用手动参数」   → 完全听滑杆
新增 「生成后自动修正足部/手部细节」开关 → 可关，只出首遍
重绘幅度 step 0.05 → 0.01            → 0.88 可精确输入
repairFeet 整图重绘 → 局部精修        → 裁剪下半部 80%×50% → 放大 1024 重绘(0.45) → 缩回 → 羽化 80px 贴回
脚趾提示词/负面强化                  → 五趾/趾序/大趾在内侧/趾甲对齐；六趾/脱节/趾序错乱
```

复刻验证（软件内，ComfyUI 实执行）：`steps=32 cfg=4.5 denoise=0.88 seed=1601600 896×1152`，单遍、无 hires，
与旧对话结果构图与质感一致。对比图：`_archive\compare-reproduced.png`、`_archive\compare-toes-0237.png`。

### 4.9 环境坑：从 F: 盘直接运行的 exe 写不进 AppData

用 `release-dev\win-unpacked`（在 F:）直接跑，主进程写 `AppData\Roaming\Lumen Studio Flow\inputs` 会 EPERM，
表现为「生成即失败、进度 1%」。装到 C: 的实例正常。本地测试构建请先复制到 C: 盘再运行。

---

### 4.10 0.2.38：精修可配置 + 工作流模块化

```text
新增 精修部位：自动 / 脚部 / 手部 / 脚+手（手部注入五指令牌与六指负面）
新增 精修区域：下半部 / 中部 / 上半部 / 左侧 / 右侧
精修工作流抽成 app\detail-workflow.cjs（纯函数，不依赖 electron）
  → 可离线断言（20 组区域计算 + 节点一致性），也可直接向 ComfyUI 出图验证
electron-builder.yml 的 files 加入 detail-workflow.cjs（否则不会打进 asar）
```

离线验证（未启 UI）：

```text
node 断言：5 区域 × 4 种画幅 = 20 组，全部 8 对齐且在界内；工作流只含数字节点键
实图验证：同一张 896×1152 图上跑 bottom / middle / top，三处改动互不重叠
```

稳定性网格补齐（固定 seed 1601600）：

```text
探测 16 步 / 512×768：0.60 / 0.65 / 0.70 / 0.75 → 头发全部洗成灰白、构图不稳，不可用
定稿 32 步 / 896×1152：0.80 残留深棕黑发；0.85 偏紫；0.88 干净浅蓝（推荐）
```

联系表：`training\output\_experiments\2026-11-22\contact-denoise-all.png`、`contact-detail-regions.png`

### 4.11 0.2.39：质感对齐 + 档位化 + 精修范围

目标质感参考：`reference-2.5d.png`（注意：文件实为 JPEG，扩展名却是 .png，读取要先按实际格式解码）。

对比后确定差距：旧 2.5D 厚涂偏「赛璐珞 + 高对比」，目标是「柔光 + 彩色轮廓光 + 次表面透光 + 弱线条 + 散景」。

```text
2.5D 厚涂风格词已换成 v2：
2.5D, semi-realistic anime, thick painting, painterly brushwork, soft airbrushed shading,
subsurface scattering, glossy soft skin, translucent skin, warm rim light, cool rim light,
soft ambient light, cinematic bokeh, depth of field, delicate soft lineart, clean soft rendering,
rich skin tones, polished illustration, high detail
```

试过 `25d_anima_v4` LoRA 0.35：发色被带脏，不如纯风格词，**结论是不上 LoRA**。

同时新增：

```text
出图档位：轻修 30% / 保构图换质感 45% / 换角色保构图 70% / 换角色+2.5D 厚涂 88%（推荐）/ 自定义
精修范围：大 / 中 / 小 / 极近（越小放大倍数越高，趾头越清楚）
精修轮次：单次 / 两次（0.45 → 0.30）
使用说明新增「8. 参数说明」：重绘幅度、风格 LoRA 强度、步数、CFG、种子、档位、精修逐项解释
```

脚趾实测（同一张图，zoom × denoise）：

```text
zoom1.0 d0.45（旧默认）  趾头挤在一起，最长趾与脚掌脱节
zoom0.5  d0.45           趾头分得开，每趾有甲
zoom0.5  d0.35           结构相近，边缘更软
zoom0.35 d0.45           放大 4.1x，细节更多但容易把手指当成趾
二次 0.45→0.30           趾列最整齐，代价是多一次采样
```

结论：**小范围 + 两次** 是目前最稳组合；这类强透视 + 舌头遮挡的构图仍非 100% 可靠。

图标：桌面快捷方式改为指向 `resources\icon.ico` 并刷新图标缓存
（旧快捷方式指向 exe,0，Windows 图标缓存未刷新时会显示 Electron 默认的原子图标）。

联系表：`contact-style-compare.png`、`contact-toe-params.png`

---

## 5. 画风定义

```text
anima-base
  Anima Base v1.0，无 LoRA

anime-cel
  Anima Base，强化赛璐珞阴影/细节

painterly
  Anima Base + 25d_anima_v4 0.55

2.5d-thick
  参考图 img2img，denoise 0.70，自动载入内置绿色厚涂参考

gal-3d
  MeinaMix-V10 + make25d_type2_v100 0.55

ririko-cel
  Anima Base + ririko_anima_v2 0.8

mushroom-moe
  Anima Base + mushroom_anima_v2 0.8
```

关键修复：

- 切换画风时会设置对应 LoRA 强度
- `painterly` 真正传入 25d LoRA
- 默认负面词不再包含 `hat, cap, beret`
- `workflowPayload()` 和实际生成一致

---

## 6. 文件整理

文件说明：

```text
WORKSPACE_MAP.md
```

已归档：

```text
_archive\cleanup-2026-11-22
_archive\handoff-drafts
_archive\dev-scripts-2026-11-22.zip
_archive\dev-scripts2-2026-11-22.zip
_archive\visual-tests-2026-11-22.zip
_archive\visual-assets-2026-11-22.zip
_archive\old-release-notes-2026-11-22
```

已删除：

- 旧版 0.1.x / 0.2.0–0.2.38 安装包与 blockmap
- 旧版 character-data 0.2.6–0.2.34
- 旧 loras-share 0.2.4 / 0.2.5
- 旧日志与 0 字节临时文件
- 旧交接文档

保留：

```text
character-data-v0.2.35.zip（最新；0.2.36 起未单独产出）
loras-share-v0.2.6.zip
release\ 当前版本（0.2.39 Setup / portable / blockmap + latest.yml + win-unpacked）
current style verification images
```

`app.asar` 仍被进程占用时可能残留，进程完全退出后可删除。

---

## 7. 已知问题

### P0：2.5D 厚涂质感与稳定性

0.2.37 起参数完全可控（性能档「自定义」），已确认可复刻旧对话结果：

```text
画风 2.5D 厚涂 · 参考图 img2img · 3:4（896×1152）
自定义档：步数 32 / CFG 4.5 / 重绘幅度 0.88 / 数量 1
固定种子（旧对话成功值为 1601600）
自动识别画风：关　自动修正足部：按需
```

0.2.39 起风格词换成 v2（柔光 + 彩色轮廓光 + 次表面透光 + 弱线条），更接近
`reference-2.5d.png` 的目标质感；实测加 `25d_anima_v4` LoRA 0.35 会把发色带脏，**不上 LoRA**。

固定 seed 实测（896×1152 / 32 步 / CFG4.5）：

```text
0.60–0.75  头发洗成灰白、构图不稳（不可用）
0.80       头发仍是原图深棕/黑
0.85       转蓝但偏紫、发丝偏暗
0.88–0.90  干净浅蓝（推荐）
```

结论：换角色的稳定区间 **0.88–0.90**。联系表：`_experiments\2026-11-22\contact-denoise-all.png`、
`contact-style-compare.png`。

仍待办：按构图类型（特写 / 半身 / 全景）建立分档参数表；半身与全景尚未系统测。

### P1：足部/脚趾

局部精修（0.2.37 起）：裁区域 → 放大到 1024 重绘 → 缩回 → 羽化贴回；脸/手/构图不受影响。

0.2.38 起可选：

```text
精修部位：自动 / 脚部 / 手部 / 脚+手
精修区域：下半部 / 中部 / 上半部 / 左侧 / 右侧
```

0.2.39 起再加两项（对趾列影响最大）：

```text
精修范围：大 / 中 / 小 / 极近   范围越小放大倍数越高（4x），趾头/指头越清楚
精修轮次：单次 / 两次            两次 = 0.45 后再 0.30，趾列更整齐
```

实测（896×1152，同 seed）：

```text
zoom1.0 d0.45（旧默认）  趾头挤在一起，最长趾与脚掌脱节
zoom0.5  d0.45           趾头分得开，每趾有甲（当前最稳单次组合）
二次 0.45→0.30           趾列最整齐，代价多一次采样
zoom0.35 d0.45           放大 4.1x，细节更多但易把手指当成趾
```

区域验证：下半只改脚、中部改嘴/舌、上半改头发眼睛，互不干扰 →
`contact-detail-regions.png`；脚趾参数对比 → `contact-toe-params.png`。

仍需改进：

- 区域/范围仍是比例，不是内容检测；极端构图（脚在正中、多只脚）仍可能裁偏
- 强透视 + 舌头/手指遮挡时仍会翻车，需 ControlNet 或部位检测模型
- 只处理单张（batch>1 时按首张处理）

### P1：复杂手部与道具

手部已可用同一套局部精修（部位选「手部」或「脚+手」），但复杂遮挡/道具交互仍会轻微变形，
后续可加 ControlNet 或更大裁剪倍数。

### P2：旧实验画风

`25d-lora`、`target-25d` 仍偏实验性。建议后续收进“实验画风”分类，不要和主画风混在一起。

---

## 8. 常用命令

### 版本

```powershell
(Get-Content "F:\DSH WORKSPACE\lumen-flow\app\package.json" | ConvertFrom-Json).version
```

### ComfyUI

```powershell
Invoke-WebRequest http://127.0.0.1:8188/system_stats -UseBasicParsing
```

### GitHub

```powershell
gh release list --repo 7ather-LX/lumen-studio-flow --limit 3
```

### 构建

```powershell
$env:PATH='C:\Users\25576\.workbuddy\binaries\node\versions\22.22.2-6;C:\Users\25576\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin;F:\DSH WORKSPACE\lumen-flow\bin;'+$env:PATH
Set-Location 'F:\DSH WORKSPACE'
.\node_modules\.bin\electron-builder.cmd --projectDir 'F:\DSH WORKSPACE\lumen-flow\app' --config 'F:\DSH WORKSPACE\lumen-flow\app\electron-builder.yml' --win nsis portable --publish never
```

---

## 9. 禁止事项

- 不要删除或修改原始 Lumen Studio
- 不要动 `references\library` 与自定义“小穴”分类
- 不要上传用户参考图/版权角色图到 GitHub
- 不要把 `references\library` 打进安装包
- 不要只改 `characters.json` 而不同步 `characters.js`
- 不要在 Release 说明中重新加入视频段落
- 不要用纯 LoRA 文生图宣称能稳定复刻 2.5D 厚涂
- 不要在未验证实际工作流时只改预览图

---

## 10. 交接完成标志

新对话应能回答：

1. 当前版本？→ `0.2.39`
2. 项目路径？→ `F:\DSH WORKSPACE\lumen-flow`
3. 最新 Release？→ `v0.2.39`
4. 用户参考库多少张？→ 191（已清理 29 条僵尸元数据），自定义“小穴”29
5. 2.5D 厚涂怎么复刻旧对话结果？→ 2.5D 厚涂 + 参考图 + 自定义档 32 步 / CFG4.5 / 0.88 / seed 1601600，关自动画风
6. 脚趾怎么修？→ 局部精修（勾“自动修正足部/手部细节”），可选部位（脚/手/脚+手）与区域（下半/中部/上半/左/右）
7. anime-cel 是否通过？→ 通过，强化阴影/细节/负面词
8. 哪些文件绝对不能动？→ 原始 Lumen Studio、references/library、自定义分类、用户训练素材
