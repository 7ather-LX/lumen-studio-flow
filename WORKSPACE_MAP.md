# Lumen Studio Flow 工作区文件地图

更新时间：2026-11-22（16:55 复核版本）  
当前版本：`0.2.36`（源码 / 本机安装 / GitHub latest 三者一致）

这不是交接包。交接包等画风问题处理完后再写。  
本文件用于说明哪些文件是什么、哪些绝对不能动、哪些已经归档/清理。

---

## 1. 两个 Lumen 项目

### 原始 Lumen Studio

```text
F:\DSH WORKSPACE
```

根目录下的这些属于原始项目/工具链，**不要删除、不要改动**：

```text
src
public
scripts
release
package.json
pnpm-lock.yaml
pnpm-workspace.yaml
vite.config.mts
tsconfig.json
setup_bypass.ps1
SECURITY.md
README.md
```

根目录的 `pip-unpack-*`、`torchinductor_*`、`pytest-of-*` 是 Python/测试缓存，可日后清理，但不属于 Flow 应用。

### Lumen Studio Flow

```text
F:\DSH WORKSPACE\lumen-flow
```

这是当前正在开发的应用。

---

## 2. Flow 的核心目录

### 2.1 应用源码

```text
lumen-flow\app
```

- `app\main.cjs`：Electron 主进程、ComfyUI 工作流、文件 IPC
- `app\preload.cjs`：渲染层安全桥
- `app\renderer\`：界面、画风、提示词、参考库
- `app\renderer\style-previews\`：画风缩略图
- `app\bootstrap_runtime.ps1`：首次运行部署
- `app\runtime-plugins\`：Anima 插件

### 2.2 模型与推理

```text
lumen-flow\models
lumen-flow\comfy
```

- `models\unet`：Anima Base / Anima 2.9B
- `models\clip`：Qwen3 0.6B
- `models\vae`：Qwen Image VAE
- `models\loras`：画风/角色/足部/手部 LoRA
- `comfy`：ComfyUI 本体与运行输出

**不要删除模型、LoRA、ComfyUI。**

### 2.3 用户参考库

```text
lumen-flow\references\library
lumen-flow\references\library\library.json
```

这是用户自己导入的参考图库。

**绝对不要删除、移动、覆盖。**

特别保护：

```text
自定义分类“小穴”
foot / foot_real / fabric 分类
用户后来追加的参考图
```

参考图只保存在本机，不进入 GitHub / 安装包。

### 2.4 训练素材

```text
lumen-flow\training
```

包含用户训练素材、风格参考、训练输出。

**除确认过的临时输出外，不要删除。**

### 2.5 本地角色数据

```text
lumen-flow\user-characters-source.json
lumen-flow\character_aliases_extra.json
```

这是用户自定义角色/别名来源。

**不要删除，也不要重新生成覆盖。**

应用实际读取：

```text
lumen-flow\app\renderer\characters.js
```

修改角色后必须同步 `characters.json` 和 `characters.js`。

---

## 3. 用户提供的参考资产（保护）

```text
lumen-flow\style-source-character.png
lumen-flow\style-source-landscape.webp
lumen-flow\training\references\semi25d_style_ref.jpg
lumen-flow\training\references\gal_style_ref.jpg
lumen-flow\training\references\pool_style_ref.jpg
lumen-flow\training\references\target_whitehair_style.jpg
```

这些是用户给的风格参考，只用于本地校准。

**不要打进安装包，也不要上传 GitHub。**

版权角色参考图同样只允许本地使用。

---

## 4. 已归档 / 已清理

清理日期：2026-11-22

已归档：

```text
lumen-flow\_archive\cleanup-2026-11-22
lumen-flow\_archive\handoff-drafts
lumen-flow\_archive\dev-scripts-2026-11-22.zip
lumen-flow\_archive\dev-scripts2-2026-11-22.zip
lumen-flow\_archive\visual-tests-2026-11-22.zip
lumen-flow\_archive\visual-assets-2026-11-22.zip
```

包括：

- 旧交接文档 `HANDOFF_2026-11-20.md`
- 上一版交接包草稿 `HANDOFF_CURRENT_v0.2.33.md`
- 旧 handoff 文件夹
- 406 + 100 个一次性开发脚本
- 旧的对比图/测试图/旧风格预览
- 旧版发布说明

已删除：

```text
旧 Lumen Studio Flow 0.1.x / 0.2.0–0.2.35 安装包、blockmap 和源码 zip
旧 character-data-v0.2.6–v0.2.34
旧 loras-share-v0.2.4 / v0.2.5
旧 app.asar（如未被进程锁定）
旧日志/错误文件（被占用的除外）
0 字节临时文件
```

保留：

```text
release\ 只留当前版本（0.2.36 Setup / portable / blockmap + latest.yml + win-unpacked）
character-data-v0.2.35（最新产出；0.2.36 未单独产出数据包）
character-data-v0.2.35.zip（已校验：zip = 目录 = app\renderer 四文件哈希一致）
loras-share-v0.2.6
handoff-0.2.36-final（原 handoff-0.2.35-final 已重命名）
```

### 当前根目录保留的图片

```text
amiya-base-compare.png
cel-improve-contact.png
style-green-final-contact.png
style-verification-contact.png
style-source-character.png
style-source-landscape.webp
reference-2.5d.png
reference-poolside-ardan.jpg
old-bed-white.png
old-bed-black.png
old-bed-bare.png
```

其中 `style-source-*`、`reference-*`、`old-bed-*` 是用户参考资产，不要删除。

---

## 5. 开发脚本 / 测试文件

根目录有大量一次性脚本：

```text
add_*.py
patch_*.py
bump_*.py
make_*.py
test_*.py
test-*.mjs
check_*.py
fix_*.py
update_*.py
upload_*.py
```

这些是历史开发过程的补丁脚本，不应作为产品源码。

后续统一归档到：

```text
lumen-flow\_archive\dev-scripts
```

保留：

```text
bootstrap_models.ps1
build_offline_bundle.ps1
start-comfy.ps1
scripts\import_pose_gallery.py
```

---

## 6. 当前已知垃圾 / 待清理

以下不是用户数据，可清理：

- 根目录测试截图：`style-*.png`、`cheshire-*.png`、`old-bed-*.png`、`anima29b-*.png`
- 根目录测试对比图：`*-contact.png`、`*-compare.png`
- `comfy\output` 下的测试输出
- `outputs` 中已被选定的测试图以外的重复图
- 旧根目录 `*.log`、`*.err`
- 被锁定的 `comfy-manual.log/.err`，需先停 ComfyUI

保留为展示/验证：

```text
style-verification-contact.png
cel-improve-contact.png
style-green-final-contact.png
amiya-base-compare.png
```

---

## 7. 当前版本相关

```text
源码：0.2.36
本机安装：0.2.36（用 `win-unpacked` 覆盖部署，安装器在本机不生效，见 §9）
GitHub latest：v0.2.36（已发布，11 个附件）
```

最新 Release：

```text
https://github.com/7ather-LX/lumen-studio-flow/releases/tag/v0.2.36
```

### 版本差异记录（2026-11-22 复核 → 已收敛）

发布前核对到源码已 bump 到 `0.2.36`，而当时本机与 GitHub 仍是 `0.2.35`。处理结果：

```text
源码 package.json         0.2.36
release\ 构建产物         0.2.36（Setup / portable / blockmap / win-unpacked）
release\latest.yml        0.2.36（sha512 与安装包实测一致）
本机安装 exe              0.2.35 → 0.2.36
GitHub latest             v0.2.35 → v0.2.36
```

结论：

- `0.2.36` 已构建、已发布到 GitHub、已安装到本机，三者一致
- 发布顺序为先建 `v0.2.36` 并验证附件，再删 `v0.2.35`，更新链路未断档
- GitHub 上只剩 `v0.2.36` 一个 release（`v0.2.35` 已删除，`v0.2.25` 更早已删）
- `character-data` 最新产出仍为 `v0.2.35`，**0.2.36 未单独产出数据包**（角色数据无变化）

---

## 8. 画风状态

### 已通过

```text
mushroom-moe
ririko-cel
anime-cel（0.2.35 改进后）
```

### 未通过

```text
2.5d-thick
```

`2.5d-thick` 仍需参考图 img2img，不能只靠 LoRA。

### 当前优先级

1. 继续修 2.5D 厚涂
2. 清理根目录测试文件
3. 整理最终交接包

---

## 9. 本机安装与启动注意事项（2026-11-22 实测）

### 9.1 在 DSH/agent 里启动应用必须先清掉 `ELECTRON_RUN_AS_NODE`

DSH 自身是 Electron，它的环境里带着：

```text
ELECTRON_RUN_AS_NODE=1
```

继承这个变量去启动 Lumen 时，Electron 会退化成纯 Node，`require("electron")` 拿不到 API，
表现为**进程秒退、无窗口、退出码 0 或 9、没有任何日志**（主进程报
`TypeError: Cannot read properties of undefined (reading 'whenReady')`）。

启动前必须：

```powershell
Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
Start-Process "C:\Users\25576\AppData\Local\Programs\Lumen Studio Flow\Lumen Studio Flow.exe"
```

### 9.2 NSIS 安装器在本机不生效，用 `win-unpacked` 部署

`release\Lumen-Studio-Flow-Setup-0.2.36.exe` 直接运行（`/S` 静默或 GUI、有无沙箱、全新目录）
都是**退出码 0 但不写任何文件**，也不产生卸载注册项。因此本机 0.2.36 是用

```text
release\win-unpacked\  →  C:\Users\25576\AppData\Local\Programs\Lumen Studio Flow\
```

整目录覆盖部署的（122 个文件 / 350MB），桌面快捷方式用 WScript.Shell 重建指向同一 exe。

因此本机**没有卸载注册项**，控制面板/设置里可能不显示 Lumen Studio Flow；升级时同样覆盖 `win-unpacked` 即可。

### 9.3 0.2.35 回滚副本

部署 0.2.36 前把旧安装目录整体改名保留：

```text
C:\Users\25576\AppData\Local\Programs\Lumen Studio Flow.0.2.35.bak
```

GitHub 上 `v0.2.35` release 已删除，这份目录是本机唯一的 0.2.35 回滚来源，确认 0.2.36 稳定后再手动删除。
