# Lumen Studio Flow 交接包

更新时间：2026-11-24（21:40 发布 0.2.59）  
当前版本：`0.2.59`  
项目目录：`F:\DSH WORKSPACE\lumen-flow`  
工作区：`F:\DSH WORKSPACE`  
主进程：`app/main.cjs`  
渲染层：`app/renderer/app.js`、`index.html`、`styles.css`  
GitHub：https://github.com/7ather-LX/lumen-studio-flow  
最新 Release：https://github.com/7ather-LX/lumen-studio-flow/releases/tag/v0.2.59

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
当前版本 0.2.59，先确认项目状态，再继续。
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

1. 源码版本是否为 `0.2.52`
2. 本机安装是否为 `0.2.52`
3. GitHub latest 是否为 `v0.2.52`
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
源码：0.2.59
本机安装：0.2.59
GitHub latest：v0.2.59
```

Release 附件（v0.2.59 共 11 个）：

```text
Lumen-Studio-Flow-Setup-0.2.59.exe
Lumen-Studio-Flow-0.2.59.exe
character-data-v0.2.35.zip
loras-share-v0.2.6.zip
bootstrap_models.ps1
build_offline_bundle.ps1
OFFLINE_BUNDLE.md
REFERENCE_IMPORT.md
import_pose_gallery.py
README.md
RELEASE_NOTES_0.2.59.md
```

说明：

- `latest.yml` 与 `blockmap` 只留在本地 `release\`，不随 Release 上传（沿用 v0.2.35 惯例；应用内无 autoUpdater）
- 旧版本已删除，只保留 v0.2.59
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

### 4.12 0.2.40 / 0.2.41：三个 bug + 2.5D 改成伪 3D

用户反馈三件事，逐条定位：

```text
1) 重绘（img2img）出 3 张，提示却永远「完成 1 张」
   原因：needsCorrection 只对 images[0] 做局部精修，然后用 repaired.images（1 张）
         splice 掉整批 → 张数塌成 1。非 img2img 不触发修正，所以无此 bug。
   修复：逐张精修、按下标替换，张数保持不变；进度显示 1/N。

2) 选「2.5D 厚涂」会自动往参考槽塞内置预览图
   原因：ensureStyleReference() 在该画风下自动 fetch style-previews/2.5d-thick.png 当参考。
   修复：整个函数与调用一起删除。任何画风都不再自动添加参考，只有用户主动拖入/选择才加载。

3) 精修区域风格与整图不一致
   原因：repairFeet 里 config = readConfig()，精修固定用配置里的 2.9B；
        主图若走 Anima Base（2.5D 系列都 pin 了 base），同图两模型混用。
   修复：repairFeet 接受 payload.unet，精修沿用主图模型。
```

关于「变快 + 质量下降」的排查结论：

```text
- 无外包：config engine=local，全部请求打 http://127.0.0.1:8188，
  模型来自本地 models/，ComfyUI history 里未出现任何 LoRA 节点（强度 0，不加载）
- 真因：0.2.39 把 2.5D 厚涂的风格词整体换成「柔光版」。
  柔光 = 少硬边 + 低局部对比，观感就是「糊一点、快一点」
- 处理：恢复旧 2.5D 厚涂；柔光版独立为「2.5D 柔光厚涂」，两个风格并存由用户选
```

新增风格：

```text
2.5d-thick-soft  2.5D 柔光厚涂
  标签：柔光 / 彩色轮廓光 / 次表面透光 / 弱线条 / 散景
  预览：app\renderer\style-previews\2.5d-thick-soft.png（用真实 v2 输出裁的预览）
  自动画风识别：提示词含「柔光厚涂 / soft thick」→ 该风格
```

后续待办（本轮没做，原因已确认）：

```text
部位检测：本地没有检测/分割模型（models 下无 yolo/sam/onnx 检测器），
          要么下载轻量模型（需联网，需用户同意），要么继续用比例区域
ControlNet：本地同样没有 controlnet 权重，ComfyUI 也只有 Anima 2.9B / Ref Adapter 两个自定义节点
          → 要做必须先下载可用的 controlnet（体量 GB 级，且需确认与 Qwen/Anima 兼容）
分档表：特写数据已齐（0.60–0.90）；半身/全景还缺，需要不同构图的参考图各跑一组
```

---

### 4.13 0.2.42：构图档位 + 半身/全景参数表

用户提供了三张构图参考（全身沙发、半身便利店、角色设定图），用来补「半身 / 全景」参数表。

```text
特写（脸/局部）  3:4  896×1152   0.88–0.90
半身            2:3  832×1216   0.75–0.85（推荐 0.82）
全身 / 全景      16:9 1216×688   0.70–0.78（推荐 0.75）
```

实测（24 步 / CFG4.5 / seed 1601600 / 2.5D 伪 3D 风格词）：

```text
特写：0.80 残留原图深棕/黑发；0.85 偏紫；0.88 干净
半身：0.75 与 0.85 构图基本保持；0.90 发量膨胀、道具移位
全身：0.75 构图最稳；0.85 人物缩小偏紫；0.90 明显跑色
```

**关键教训（比 denoise 更重要）**：

```text
提示词里的构图词会跟 denoise 抢构图。
第一次测半身/全景时误用了「close-up, face focus」的提示词，
结果 0.75 就把半身图重画成特写、全景直接崩成脸特写——数据全部作废。
改成「cowboy shot / half body」「full body, sitting on sofa」之后，
同一批 denoise 才呈现上面这条正常梯度。
```

所以文档和软件里都写明：**构图词必须和目标构图一致**，否则再低的 denoise 也留不住构图。

软件改动：

```text
新增「构图档位」下拉：特写 / 半身 / 全身·全景 / 自定义
  选中后同时设置画幅（3:4 / 2:3 / 16:9）与推荐重绘幅度，并给出提示文案
使用说明「8. 参数说明」补充构图档位与上述教训
```

联系表：

```text
contact-ladder-half2.png   半身：参考 + 0.75/0.85/0.90
contact-ladder-full2.png   全身：参考 + 0.75/0.85/0.90
```

参考图副本放在 `_experiments\2026-11-22\refs\`（原文件未改动）。

---

### 4.14 0.2.43：柔光对齐参考 + 界面折叠

用户目标参考：pool 夜景图（柔光、低对比、含蓄高光）。用户明确 **2.5D 厚涂（伪 3D）已达标，优先级后延**，
主攻 2.5D 柔光。

对比发现的差距：

```text
旧柔光：volumetric light + glossy specular skin + neon 词 → 塑料感、霓虹过饱和、高对比
目标：  柔漫射光、低对比、pastel、含蓄高光、自然皮肤质感
```

改动：

```text
正向（2.5d-thick-soft）：soft diffuse lighting, gentle rim light, atmospheric haze,
      muted colors, low contrast, pastel tone, filmic color grading,
      soft skin shading, subsurface scattering, mild specular highlights, natural skin texture
负向：oversaturated, neon glow, plastic skin, latex, harsh highlights, high contrast,
      glossy plastic, harsh shadows
```

CFG 实测（同参考图、同 seed、重绘 0.82）：

```text
CFG 4.5  塑料感 / 霓虹过饱和
CFG 4.0  最接近参考（推荐）
CFG 3.5  偏灰发闷
```

界面简化：

```text
新增面板折叠：data-collapse="closed" 的面板默认收起，右上角「展开/收起」切换
收起：标准提示词顺序 / 角色参考 / 质感·部位参考 / 简化工作流
实现：panel.collapsed > *:not(.panel-head) { display:none } + setupCollapsiblePanels()
```

联系表：`contact-soft-v3.png`（参考 / v1 / v3-cfg4.0 / v3-cfg3.5）

---

### 4.15 0.2.44 / 0.2.45：柔光的高光——从镜面到「宽而软」

用户两次纠偏，最终结论很明确：

```text
1) v1（CFG 4.5）基调是对的，塑料感来自高光过曝，不是「不够柔」
2) CFG 4.0 / 3.5 是 3D 建模感，属于「2.5D 厚涂」的区间，不能算柔光
3) 目标是：把镜面反射改成参考图那种漫反射，但**不能过头到没有高光**
```

迭代过程：

```text
H1  只加高光负面词                仍偏塑料，白高光条纹明显
H2  subtle specular / skin sheen  仍带柔光斑，镜面残留
H3  纯漫反射 / matte skin          过头：胸口腹部大腿完全没有高光，皮肤发死
H4  diffuse reflection
    + soft broad highlights
    + soft-edged specular
    + gentle skin sheen + semi-matte   ← 采用：有高光但宽而软，最接近参考
```

最终风格词：

```text
正向：diffuse reflection, soft broad highlights, soft-edged specular,
      gentle skin sheen, semi-matte skin, smooth diffuse shading, even skin lighting
负向：mirror reflection, sharp specular spot, hard highlight edge,
      wet plastic, glossy plastic, latex, blown highlights, glow bloom
```

定位（写进风格提示）：

```text
2.5D 厚涂   3D 建模质感（已认可，优先级后延）
2.5D 柔光   宽而软高光的插画质感，CFG 4.5、重绘 0.80–0.85，当前主攻
```

联系表：`contact-soft-h4.png`（参考 / H2 / H3 过头 / H4 采用）

---

### 4.16 0.2.46：柔光的头发去塑料感

用户反馈：身体已合格，但**头发仍像 3D 手办**（成块 + 贯穿式硬高光带）。

根因：柔光风格词里带 `3D anime figure render`，它会把头发当建模体渲染。

迭代：

```text
H4  原始                     刘海一条贯穿硬高光，头发成块
H5  + 发丝词                发丝分得开，高光仍偏硬
H6  - 3D 手办词
    + anime illustration rendering
    + 发丝/柔光词
    + 头发专用负面           ← 采用：硬高光带基本消失，发丝可见
```

采用的正向词：

```text
anime illustration rendering
detailed individual hair strands, silky hair, natural hair flow, wispy strands, layered hair,
matte hair with gentle sheen, hair strands catching soft light, anime hair shading
```

采用的头发负面：

```text
plastic hair, sculpted hair, helmet hair, hard hair highlights, glossy hair, metal hair,
bright white highlight streak on hair, hard specular band on hair,
clumped hair, hair blob, solid hair mass, resin hair, toy hair
```

注意：`3D anime figure render` 从**柔光**里移除了，但仍保留在**2.5D 厚涂**里——
厚涂的定位就是 3D 建模质感，柔光要的是插画感。

联系表：`contact-hair-h6.png`（参考 / H4 / H5 / H6）

---

### 4.17 0.2.47：精修区域「自动」——位姿检测定位脚/手

用户同意联网下载（100G 虚拟内存已给），于是落地「部位检测替代比例预设」。

选型与理由：

```text
YOLOv8n-pose（ONNX，12.9MB）
  - 单文件、CPU 就能跑，不需要 torch / ultralytics
  - 输出 17 个 COCO 关键点，其中 9/10 手腕、15/16 脚踝正好是脚/手的锚点
onnxruntime（CPU，15.9MB wheel）
  - 只做本地推理，不发任何请求
```

安装方式（本机已做）：

```text
pip 的网络通道在本卡住了 → 直接抓 pypi wheel 再本地装：
  https://pypi.org/pypi/onnxruntime/json → 取 cp312 win_amd64 wheel
  python -m pip install --no-index --no-deps <wheel>
结果：onnxruntime 1.32.0
```

集成：

```text
app\detect-pose.py            检测脚本（读图片 → 打印 JSON 矩形）
app\parsing\yolov8n-pose.onnx 模型（electron-builder extraResources 打包）
main.cjs detectPartRect()     spawnSync 调 python，90s 超时，失败安静回退
detail-workflow.cjs regionFor 支持显式 rect（检测结果优先于比例预设）
UI 精修区域新增「自动（检测脚/手位置）」
```

验证：

```text
1. 脚本单独跑三张图：沙发图 feet x117 y244 w477 h420 / 站姿图 hands / 生成图 feet 均在正确位置
2. 打包后的 resources\detect-pose.py + resources\parsing\*.onnx 也能正常出结果
3. 用该 rect 跑局部精修：area {x:120,y:240,w:480,h:424} → 1024x904，只重绘脚部、构图不变
4. 对比比例预设：沙发图预设会切掉脚的上半，检测框完整覆盖
```

注意：软件用的是 ComfyUI 那个 Python，需要该环境有 onnxruntime；缺了会回退到比例区域，不报错。

---

### 4.18 0.2.48：画风演示图用错角色（回归修复）

用户指出：鼠标悬停画风会显示演示图，为了避免用他人角色引起纠纷，演示图统一用原创角色
（绿军装 / 绿贝雷 + 马蹄徽 / 棕长发 / 绿眼）。但两个文件是错的。

```text
2.5d-thick.png        目白阿尔丹（我调伪 3D 时换上去的实验输出，忘了换回）
2.5d-thick-soft.png   目白阿尔丹（同上）
其余 22 张             都是原创角色，正常
```

修复方式（用用户给的两段温泉提示词，只换角色）：

```text
1girl, solo, original character, horse girl,
long dark brown hair, green eyes, green beret with gold horseshoe emblem,
horse ears, horse tail, medium breasts,
from behind, looking over shoulder, looking at viewer, hand on own shoulder,
bathing, hot spring, outdoor bath, wet skin, wet hair, water droplets,
upper body, close-up, three-quarter view, wooden background, soft warm lighting, cinematic
```

两个风格各自追加**软件里当前的真实标签**（从 app.js 直接取，保证演示图与出图一致）：

```text
2.5d-thick       伪 3D：3D anime figure render / pseudo-3D shading / GI / AO / SSS /
                 glossy specular skin / volumetric light / DOF
2.5d-thick-soft  柔光：anime illustration rendering / diffuse reflection /
                 soft broad highlights / soft-edged specular / 发丝三连 / matte hair
```

顺带补的两个工具改动：

```text
comfy_experiment.py 支持 --ref 留空走 text2img（新增 build_txt2img + EmptyLatentImage）
```

产出：

```text
experiments\2026-11-23\oc-thick-seed20261123.png   2.5D 厚涂预览源图
experiments\2026-11-23\oc-soft-seed20261123.png    2.5D 柔光预览源图
contact-oc-previews.png                            原始角色 / 厚涂 / 柔光 三栏对比
contact-all-previews.png                           24 张预览总览（确认只有两张错）
```

预览统一缩到 640 宽后写入 `app\renderer\style-previews\`。

---

### 4.19 0.2.49：24 张画风演示图全部重做

用户指出 0.2.48 的两个 2.5D 预览有两处设定错误，并要求其余画风也换掉「立正站姿」。

错误：

```text
1. 给角色加了「马耳 / 马尾」——原始立绘根本不是马娘，那只贝雷帽上的马蹄是校徽
2. 泡澡场景还戴着贝雷帽
```

正确角色设定：

```text
long brown hair, green eyes, green beret with gold horseshoe emblem,
green double-breasted military uniform, white collar, yellow bow,
brass buttons, black belt, black tights, green heels
```

生成方式：

```text
scripts 里的 _archive/gen-style-previews.py
  - 从 app.js 直接抽 22 个画风的真实 tags / negative / lora / 强度
  - 每个画风配不同镜头与姿势（坐窗台 / 低角度 / 走廊回头 / 沙发翘腿 /
    森林蹲下 / 俯视 / 特写侧脸 / 仰角 / 竹林撑伞 / 咖啡厅 / 仰躺 / 跳跃 /
    天台中景 / 花田 / 霓虹巷 / 温泉回眸 …）
  - text2img，30 步，CFG 4.5，LoRA 按真实强度加载
```

返工两轮：

```text
第一版太写实 CG  → 加 anime face / large anime eyes，负面加 photorealistic
lineart 出彩色 / ink-wash 不像水墨 / cinematic 人物太小
  → lineart 补 monochrome 词与专属负面；ink-wash 补 sumi-e；
    cinematic 改中景
```

体积：23MB → 6.8MB（缩到 600/860 宽 + 256 色量化），肉眼几乎无差。

### 4.20 0.2.50：自动区域脚部定位 + 局部重绘能力边界

问题：请求「脚」但只检测到手时会返回手框；抬腿时框会落在小腿甚至躯干上。

修法（`app\detect-pose.py`）：

```text
脚踝可见        → 用脚踝做紧框
脚踝不可见      → 用 踝/膝/胯 包围盒，按肩宽上扩 1.0×、下扩 1.5×
请求 feet 时    → 永远给 feet 框，不再误返回 hands
```

三张图复测：沙发图 477×420（完整包住抬起的双脚）、站姿半身退化为下半部宽框、
特写图 645×404。

**局部重绘能力边界实测**（同一张脚部粘连的图）：

```text
原图                       上脚趾数粘连
A 比例区域 + 大范围 + 1 次 0.45   趾头分得开一些，结构不变
B 比例区域 + 0.35 + 2 次 0.42     区域仅 344×120，装不下两只脚，几乎无效
C 理想框（手工包住双脚）
   0.42 / 0.55                    比 A 略好，仍只是分离度改善
```

结论：**局部 img2img 只能改善清晰度与趾头分离，改不了趾数 / 趾序这类结构错误**。
要修结构需要深度或线稿类的约束（ControlNet 级）或脚部专用检测分割模型。
另外「小范围」不能盲目调太小，区域要真的装得下目标，建议 0.6–0.8 起。

证据图：

```text
contact-previews-new.png    24 张预览总览
contact-toe-test.png        原图 / A / B
contact-toe-oracle.png      原图 / A / C(0.42) / C(0.55)
```

---

### 4.21 0.2.51：AI 关键词空字段 + 演示图误换风景图

**AI 关键词助手返回全空 JSON**

用户输入「崩坏星穹铁道的流萤 + 姿势」，返回七个字段全空。

排查方法：直接对应用同款的本地 llama-server（端口 8091，`F:\novel` 下的
DeepSeek-V4-Pro-Qwen3.5-9B Q4_K_M）逐项复现。

```text
A 带 json_schema 非流式        正常
B 不带 response_format         正常
C 带 json_object               正常（但慢 18s）
D 流式 + 无参考库              正常
E 流式 + 参考库注入            正常
F 历史里带一条空骨架回复       正常
H 完全复刻 app 的 messages     字段被挖空（character/style/notes 空）
I 去掉末尾的空 assistant 占位  正常
```

根因：`sendAiChat` 在请求前先 push 一条 `{role:"assistant", content:""}` 占位，
它被模型当成「续写起点」，于是从空壳往下写。外部 API 会忽略空消息，本地小模型不会。

修复：

```text
1. 发送前过滤掉 content 为空的轮次
2. 新增 isDegenerateAnswer()：七个字段全空时带提示重试一次
```

**演示图误换风景图**

0.2.49 把 6 个本该是风景/抽象的演示图换成了人物：

```text
cinematic / ink-wash / lineart / manga-bw / retro / ukiyo-e
```

已用 `git checkout 1b5ff5d^ -- <path>` 从历史恢复，字节大小与原图一致
（1038 / 978 / 666 / 549 / 1070 / 1129 KB）。人物类演示图保持不动。

**遗留**：2.5D 柔光演示图只做到「角色正确、无马耳、不戴帽」，2.5D 质感不足，
继续调，暂不改软件内那张。

---

### 4.22 0.2.52：高清化加工 + 隐藏作品 + 柔光演示图

**高清化（必须只放大、不改内容）**

用户要求：输出图片像素偏低，需要高清化；**不能变角色、风格、场景**；体积要按倍数增长（1MB → 约 3MB）。

实现原则：整条链路不含采样器。

```text
LoadImage → UpscaleModelLoader → ImageUpscaleWithModel → ImageScale(lanczos, 目标尺寸) → SaveImage
兜底（无模型时）：LoadImage → ImageScale(lanczos) → SaveImage
```

没有 KSampler、没有 denoise，所以画面内容不会重新生成。

模型（用 `gh release download` 从 xinntao/Real-ESRGAN 取得，放在 `comfy\models\upscale_models\`）：

```text
RealESRGAN_x4plus_anime_6B.pth   17.1MB   动漫专用，线条干净
RealESRGAN_x4plus.pth            63.9MB   通用，纹理更多
RealESRGAN_x2plus.pth            64.0MB   通用 2x
```

实测（832×1216 源图）：

```text
源图 1.15MB → Lanczos 2x 3.01MB / 动漫模型 2x 3.34MB / 通用模型 2x 4.26MB
耗时 0.8s / 3.2s / 6.5s
```

踩过的坑：`gh api ... > file.pth` 在 PowerShell 里会写成 UTF-16，体积翻倍且文件损坏
（17.1MB 变 32.6MB）。改用 `gh release download --dir` 后正常，并用文件头 `50 4B`（zip）校验。

**隐藏作品**

```text
存储：%APPDATA%\Lumen Studio Flow\hidden-works.json（只存文件名，不删文件）
列表：flow:list-outputs 带 mode=visible|hidden，先过滤再截断 60 张
UI  ：作品页「作品 / 隐藏作品」两个页签 → 隐藏作品单独一页，不混合显示
     勾选多张 → 隐藏选中 / 取消隐藏；详情页有「隐藏此作品」
```

**自动高清化**

创作页「输出」面板新增开关 + 倍数。`generate` 里在高清化阶段逐张放大，
成功后把低清原图与同名 json 一起删除，只把高清结果返回给作品栏。

**柔光演示图**

换成 `3D 手办感 + 柔光`（体积光、轮廓光、湿皮肤反光），仍走 `2.5d-thick-soft` 标签。

---

### 4.23 0.2.58：高清化支持导入本机图片 + 侧栏顺序

**侧栏顺序**

「高清化」编号是 10，却排在 08 工作流与 09 使用说明之间。现在 01…09 之后才是 10。

**导入本机图片**

高清化页面新增「导入本机图片」（PNG / JPG / WEBP）：

```text
选图 → 显示缩略图 + 文件名 + 体积
开始高清化 → 超分 → 结果写入作品库（作品栏立即可见）
输出名：原文件名-hd{倍数}x.png
元数据：imported=true、sourceName=<原始文件名>、沿用同一套放大字段
```

主进程侧改动：

```text
upscaleImage 支持 options.dataUrl + options.sourceName
  临时文件名用 sourceName 净化后的词干（去扩展名、非法字符替换为 -、截断 60 字）
  meta.imported / meta.sourceName 记录来源，便于详情页追溯
```

渲染侧改动：

```text
pickUpscaleFile → 触发隐藏的 <input type=file>
FileReader 读成 dataURL → state.upscaleSource = { dataUrl, name }
runUpscale 分流：dataUrl 走导入分支，否则按作品名
点击作品网格会清空导入预览，避免来源混淆
```

---

### 4.24 0.2.59：局部修正（框选修复 / 擦除）+ 列表排序修正

**列表排序**

`listOutputs` 原来按文件名排序再反转，高清化/导入/修正产生的文件带后缀，会排到列表底部。
改为按 `mtime` 倒序（mtime 相同再按名字），新文件永远在最上方。

**局部修正**

用户给了一张两格图：上半脚趾结构错乱、下半右下角多出一个多余小人，要求软件能修。

结论：**两种问题需要两条不同链路**。

```text
修复（改内容）：裁剪 rect → 放大到 1024 → img2img（denoise 0.5）→ 缩回 → 羽化贴回
擦除（删内容）：纯像素克隆填补 + 轻微融合，绝不交给扩散模型自由发挥
```

擦除为什么不能只用重绘：实测把「背景/头发」写成提示词、denoise 0.95 去重绘那块，
模型直接**画了一只脚**出来（因为它看到周围都是脚）。改成先用邻近像素覆盖、再低幅度融合后，
多余小人干净消失。

实现：

```text
app/region-erase.py     克隆填补脚本
  候选供体：正上 → 正下 → 左 → 右（可用第 7 参数指定方向）
  供体做翻转避免明显重复纹理，高斯模糊 1.5，边界羽化 min(w,h)*0.12
main.cjs repairRegion()
  mode=erase  → 调 python 脚本 → 若 blend<=0 直接出成品；否则再走一次低 denoise 融合
  mode=repair → 直接走 detailWorkflow（rect + prompt + denoise）
  成品另存 <原名>-fix.png，元数据记 fixed / fixMode / fixRect / source
渲染层
  详情页「🩹 局部修正」→ 弹窗内拖框选 → 模式（修复/擦除）+ 强度 + 可选提示词
  擦除默认强度 15%，修复默认 50%
```

实测数据：

```text
上半脚趾修复（denoise 0.52）：五个趾头分开、顺序正常
下半擦除（blend 0.15）：多余小人完全消失，边缘自然过渡
```

证据图：`contact-repair.png`（脚趾前后）、`contact-erase-final.png`（擦除前后）。

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
  参考图 img2img；不加载 LoRA；不自动添加任何参考图
  定位：**伪 3D 立体感**，不是油画笔触
  风格词：3D anime figure render / pseudo-3D shading / soft global illumination /
          ambient occlusion / subsurface scattering / glossy specular skin /
          volumetric light / rim light / studio lighting / depth of field
  负面：oil painting, brush strokes, canvas texture, impasto（防止滑回油画）
  适用：想要立体、光影扎实、细节清晰的 2.5D

2.5d-thick-soft
  同上伪 3D，但光线更柔、散景更重（接近 reference-2.5d.png 的夜景色调）
  额外：cool rim light, soft ambient light, translucent skin, cinematic bokeh
  适用：想要柔光夜景氛围
  预览：app\renderer\style-previews\2.5d-thick-soft.png

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

- 旧版 0.1.x / 0.2.0–0.2.58 安装包与 blockmap
- 旧版 character-data 0.2.6–0.2.34
- 旧 loras-share 0.2.4 / 0.2.5
- 旧日志与 0 字节临时文件
- 旧交接文档

保留：

```text
character-data-v0.2.35.zip（最新；0.2.36 起未单独产出）
loras-share-v0.2.6.zip
release\ 当前版本（0.2.59 Setup / portable / blockmap + latest.yml + win-unpacked）
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

1. 当前版本？→ `0.2.59`
2. 项目路径？→ `F:\DSH WORKSPACE\lumen-flow`
3. 最新 Release？→ `v0.2.59`
4. 用户参考库多少张？→ 191（已清理 29 条僵尸元数据），自定义“小穴”29
5. 2.5D 厚涂怎么复刻旧对话结果？→ 2.5D 厚涂 + 参考图 + 自定义档 32 步 / CFG4.5 / 0.88 / seed 1601600，关自动画风
6. 脚趾怎么修？→ 局部精修（勾“自动修正足部/手部细节”），可选部位（脚/手/脚+手）与区域（下半/中部/上半/左/右）
7. anime-cel 是否通过？→ 通过，强化阴影/细节/负面词
8. 哪些文件绝对不能动？→ 原始 Lumen Studio、references/library、自定义分类、用户训练素材
