# Lumen Studio Flow v0.2.41

完全免费、为爱发电的本地 AI 绘画工作台。Electron + ComfyUI + Anima，本地优先，不上传素材。

## 修复

- **重绘提示张数**：用参考图（img2img）生成多张时，自动修正只修第一张并用单图替换整批，导致提示始终「完成 1 张」。
  现在逐张精修、按下标替换，张数保持不变，提示与张数一致。
- **不再自动添加参考图**：此前选「2.5D 厚涂」会把内置预览图自动塞进参考槽。该行为已彻底移除——
  任何画风都不会自动添加参考图，只有你主动拖入/选择才会加载。
- **精修沿用主图模型**：以前精修固定读配置里的 2.9B，而主图可能是 Anima Base，导致修补区域和整图风格不一致。
  现在精修使用与主图相同的模型。

## 2.5D 厚涂：改成「伪 3D」而不是油画

之前把「厚涂」理解成笔触，风格词里有 `thick painting / painterly brushwork`，出来的画面偏油画、发糊。
正确的是**伪 3D 立体感**，所以风格词改为：

```text
3D anime figure render, pseudo-3D shading, soft global illumination, ambient occlusion,
subsurface scattering, glossy specular skin, volumetric light, rim light, studio lighting,
depth of field, cinematic bokeh, smooth surfaces, physically based rendering look
```

负面词同步加入 `oil painting, brush strokes, canvas texture, impasto`，防止又滑回油画。

风格列表：

```text
2.5D 厚涂   伪 3D 立体感，光影扎实、细节清晰（主力）
2.5D 柔光   同样伪 3D，但光线更柔、散景更重，接近 reference-2.5d.png 的夜景色调
```

两个风格都**不加载 LoRA**，也都**不会自动加参考图**。

## 关于「生成变快 / 质量下降」

排查结论：**没有任何外部调用**。所有请求都发往本机 `http://127.0.0.1:8188`，模型全部来自本地
`models/`，配置 `engine=local`，外部 API 分支只有在设置里把引擎切到 `api` 时才启用；近期执行的
工作流里也没有 LoRA 节点。

观感差异的原因：0.2.39 把「2.5D 厚涂」整体换成了柔光/油画化风格词，柔光意味着更少硬边、更低局部对比，
看起来就像「糊了、快了」。本版已按上面的伪 3D 方向重写，并保留柔光作为可选项。

## 推荐参数

```text
画风：2.5D 厚涂（要更柔选 2.5D 柔光）
参考图：原图（构图/动作）　　画幅：3:4（896×1152）
性能档：自定义　　步数 32　CFG 4.5　重绘幅度 0.88　种子：固定　数量 1
自动识别画风：关　　自动修正足部：按需（精修范围选小/极近，轮次两次更稳）
```

## 安装

发布包是单安装器。首次启动如果缺少 ComfyUI / Python，会弹出“一键部署完整环境”，自动下载约 8GB 的 ComfyUI、Python、Anima Base、Qwen3、VAE 和节点。

离线用户可使用 `build_offline_bundle.ps1` 生成独立完整运行环境包，安装后在设置中指向解压目录。

1. 运行 `Lumen-Studio-Flow-Setup-0.2.41.exe`
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
