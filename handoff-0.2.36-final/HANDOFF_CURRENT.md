# Lumen Studio Flow 交接包

更新时间：2026-11-22（17:30 发布 0.2.36）  
当前版本：`0.2.36`  
项目目录：`F:\DSH WORKSPACE\lumen-flow`  
工作区：`F:\DSH WORKSPACE`  
主进程：`app/main.cjs`  
渲染层：`app/renderer/app.js`、`index.html`、`styles.css`  
GitHub：https://github.com/7ather-LX/lumen-studio-flow  
最新 Release：https://github.com/7ather-LX/lumen-studio-flow/releases/tag/v0.2.36

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
和 F:\DSH WORKSPACE\lumen-flow\WORKSPACE_MAP.md。
当前版本 0.2.36，先确认项目状态，再继续。
```

### 0.3 不要依赖 Hindsight

跨对话记忆插件未配置成功，本次不使用。

交接以这两个文件为准：

```text
HANDOFF_CURRENT.md
WORKSPACE_MAP.md
```

不要假设新对话自动知道旧上下文。

### 0.4 新对话先确认

1. 源码版本是否为 `0.2.36`
2. 本机安装是否为 `0.2.36`
3. GitHub latest 是否为 `v0.2.36`
4. `references/library/library.json` 是否仍有 220 张参考图
5. 自定义分类“小穴”是否仍有 29 张
6. `app/renderer/characters.js` 是否仍包含 `yukikaze (azur lane)`

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
源码：0.2.36
本机安装：0.2.36
GitHub latest：v0.2.36
```

Release 附件（v0.2.36 共 11 个）：

```text
Lumen-Studio-Flow-Setup-0.2.36.exe
Lumen-Studio-Flow-0.2.36.exe
character-data-v0.2.35.zip
loras-share-v0.2.6.zip
bootstrap_models.ps1
build_offline_bundle.ps1
OFFLINE_BUNDLE.md
REFERENCE_IMPORT.md
import_pose_gallery.py
README.md
RELEASE_NOTES_0.2.36.md
```

说明：

- `latest.yml` 与 `blockmap` 只留在本地 `release\`，不随 Release 上传（沿用 v0.2.35 惯例；应用内无 autoUpdater）
- 旧版本已删除，只保留 v0.2.36
- `character-data` 最新产出仍是 `v0.2.35`，**0.2.36 未单独产出数据包**（角色数据无变化）

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

- 旧版 0.1.x / 0.2.0–0.2.35 安装包与 blockmap
- 旧版 character-data 0.2.6–0.2.34
- 旧 loras-share 0.2.4 / 0.2.5
- 旧日志与 0 字节临时文件
- 旧交接文档

保留：

```text
character-data-v0.2.35.zip（最新；0.2.36 未单独产出）
loras-share-v0.2.6.zip
release\ 当前版本（0.2.36 Setup / portable / blockmap + latest.yml + win-unpacked）
current style verification images
```

`app.asar` 仍被进程占用时可能残留，进程完全退出后可删除。

---

## 7. 已知问题

### P0：2.5D 厚涂仍在持续调

当前 0.70 的绿色预览可用，但还不是所有构图都稳定。需要继续固定 seed 对比：

```text
denoise 0.60 / 0.65 / 0.70 / 0.75
```

### P1：足部/脚趾

5 趾仍会偶发融合/多趾。需要局部重绘或 ControlNet，单纯提示词不够。

### P1：复杂手部与道具

Mejiro 特写里手部/工具仍有轻微变形。复杂交互需要局部修正。

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

1. 当前版本？→ `0.2.36`
2. 项目路径？→ `F:\DSH WORKSPACE\lumen-flow`
3. 最新 Release？→ `v0.2.36`
4. 用户参考库多少张？→ 191（已清理 29 条僵尸元数据），自定义“小穴”29
5. 2.5D 厚涂怎么做？→ 参考图 img2img + denoise 0.70，不是纯 LoRA（应用内选该画风会自动载入内置参考并把滑杆设为 0.62，可手动调）
6. anime-cel 是否通过？→ 通过，强化阴影/细节/负面词
7. 哪些文件绝对不能动？→ 原始 Lumen Studio、references/library、自定义分类、用户训练素材
