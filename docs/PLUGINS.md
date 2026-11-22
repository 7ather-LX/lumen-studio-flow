# 已安装插件与可用工具

## DSH 侧

| 插件 | 用途 |
| --- | --- |
| `dsh-ego-browser` | 打开 B 站、Civitai、GitHub 页面，截图、下载、登录态 |
| `dshmarket` | 可视化插件市场，安装新插件 |
| `dsh-better-sidebar` | 文件树、编辑器、变更、任务侧栏 |
| `dsh-rewind-plugin` | 会话回退 + 工作区文件恢复 |
| `hindsight` | 项目长期记忆 |
| `dsh-whale-widget` | 余额/用量小挂件，和画图无关 |

### 最有用的

看教程、找 LoRA、找参考图：

```text
ego-browser
```

读本地文件、查 JSON、改代码：

```text
better-sidebar
```

## ComfyUI 侧

当前 `custom_nodes`：

```text
ComfyUI-Anima-Ref-Adapter
```

当前模型：

```text
models/checkpoints/MeinaMix-V10.safetensors
models/diffusion_models/anima-base-v1.0.safetensors
models/loras/anima_ref_adapter_v2_r64.safetensors
models/loras/make25d_type2_v100.safetensors
```

## 已确认可用

- Anima 文生图
- MeinaMix Checkpoint 文生图
- LoRA 加载
- 2.5D 风格 LoRA
- Anima Ref Adapter 节点
- 工作流 JSON 预览/编辑
- 参考图 img2img
- Hires Fix

## 目前缺少

- FaceDetailer / ADetailer
- IP-Adapter
- ControlNet 常用模型
- 人脸检测 / 分割
- 角色 LoRA

这些需要额外安装 custom node 和模型；不是当前 ComfyUI 自带。
