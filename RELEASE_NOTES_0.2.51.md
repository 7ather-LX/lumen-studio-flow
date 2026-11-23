# Lumen Studio Flow v0.2.51

完全免费、为爱发电的本地 AI 绘画工作台。Electron + ComfyUI + Anima，本地优先，不上传素材。

## 修复：AI 关键词助手输出空字段

现象：输入完整描述后，返回的 JSON 七个字段全是空字符串。

定位过程（用本机 llama-server 逐项复现）：

```text
A 带 json_schema（非流式）        正常，字段完整
B 不带 response_format            正常
C 带 json_object                  正常
D 流式 + 无参考库                 正常
E 流式 + 参考库注入               正常
F 历史里带一条空骨架回复          正常
H 完全复刻 app 的 messages 序列   字段被挖空（character/style/notes 空）
I 去掉末尾的空 assistant 占位     正常
```

根因：发送前先把「占位的空 assistant 消息」塞进了 messages。本地模型会把它当成续写起点，
于是从空壳往下写，字段自然被挖空。这个问题只在本地小模型上明显，外部 API 一般会忽略空消息。

修复：

```text
1. 发送前过滤掉所有 content 为空的轮次（占位消息不再进入请求）
2. 输出若七个字段全空，自动带一句提示重试一次
```

## 修复：画风演示图误换风景图

上一版把 6 个本该是**风景/抽象**的演示图（电影光影、黑白漫画、精细线稿、水墨、复古、浮世绘）
换成了人物图。现已从仓库历史恢复原图：cinematic / ink-wash / lineart / manga-bw / retro / ukiyo-e。

人物类演示图保持不变，仍统一使用原创角色。

## 待办

2.5D 柔光演示图目前只做到「角色正确、无马耳、不戴帽」，但**2.5D 质感不足**，
需要继续调，暂不再改动软件内的那张。

## 安装

发布包是单安装器。首次启动如果缺少 ComfyUI / Python，会弹出“一键部署完整环境”，自动下载约 8GB 的 ComfyUI、Python、Anima Base、Qwen3、VAE 和节点。

离线用户可使用 `build_offline_bundle.ps1` 生成独立完整运行环境包，安装后在设置中指向解压目录。

1. 运行 `Lumen-Studio-Flow-Setup-0.2.51.exe`
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
