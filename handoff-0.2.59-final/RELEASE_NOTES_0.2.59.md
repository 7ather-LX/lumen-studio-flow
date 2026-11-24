# Lumen Studio Flow v0.2.59

完全免费、为爱发电的本地 AI 绘画工作台。Electron + ComfyUI + Anima，本地优先，不上传素材。

## 新增：局部修正（框选修复 / 擦除）

作品详情页新增「🩹 局部修正」：在图上拖出矩形，针对那一块做处理，不动其他区域。

```text
修复细节   重新生成框内内容（适合手指/脚趾结构错、五官崩、局部糊）
擦除对象   用邻近最平整的像素覆盖框内内容，再把边界羽化融合
           （适合去掉多余人物、杂物、水印块）
```

关键点：

```text
修复：走已有的局部重绘链路（裁剪 → 1024 重绘 → 缩放贴回，羽化合成）
      默认 0.50 强度，可在弹窗里调
擦除：先用 app/region-erase.py 做确定性克隆填补（纯像素，不生成）
      再按需低幅度融合（默认 15%），所以不会把区域重画成别的东西
两种结果都另存为 <原名>-fix.png，写进作品库并记录 fixMode / fixRect / 来源
```

实测（你发的那张上下两格图）：

```text
上半脚趾：修复后五个趾头分开、顺序正常
下半多余小人：擦除后完全消失，边缘羽化自然
```

## 修复：新作品排在列表最底部

作品列表原来按文件名排序，所以高清化/导入/修正产生的新文件（名字带后缀）会排到后面。
改为**按修改时间倒序**，新的永远在最上方。

## 安装

发布包是单安装器。首次启动如果缺少 ComfyUI / Python，会弹出“一键部署完整环境”，自动下载约 8GB 的 ComfyUI、Python、Anima Base、Qwen3、VAE 和节点。

离线用户可使用 `build_offline_bundle.ps1` 生成独立完整运行环境包，安装后在设置中指向解压目录。

1. 运行 `Lumen-Studio-Flow-Setup-0.2.59.exe`
2. 安装会创建桌面快捷方式
3. 运行 `bootstrap_models.ps1` 自动拉取 Anima Base / Qwen3 / VAE
4. 将 `Anima-2.9B-preview-v1.safetensors` 放入 `models/diffusion_models`
5. 在设置中确认 ComfyUI / Python / F 盘输出目录

## 本地生成

本地 ComfyUI 生成无次数限制；外部 API 仅在 `engine=api` 时使用。

## 模型与 LoRA

- 25d_anima_v5
- hand_anima_v1
- foot_anima_v4
- fabric_anima_v3

GitHub：https://github.com/7ather-LX/lumen-studio-flow
