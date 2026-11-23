# Lumen Studio Flow v0.2.49

完全免费、为爱发电的本地 AI 绘画工作台。Electron + ComfyUI + Anima，本地优先，不上传素材。

## 画风演示图：全部重做（24 张）

上一版只有两张 2.5D 修好了，而且有两处设定错误：**给角色加了马耳**、**泡澡还戴着贝雷帽**。
本版全部推翻重做，并且把「立正站姿」换成不同镜头与姿势。

角色设定（按你给的原始立绘，无马耳、无马尾）：

```text
long brown hair, green eyes, green beret with gold horseshoe emblem,
green double-breasted military uniform, white collar, yellow bow,
brass buttons, black belt, black tights, green heels
```

镜头 / 姿势（每个画风不同）：

```text
anima-base     坐窗台、侧身、手抚头发
follow-prompt  三分之四侧身、手插腰
anime-cel      坐木长椅、低角度仰拍
painterly      靠栏杆、背身回望、逆光
gal-3d         坐皮沙发、翘腿、看手机
ririko-cel     走廊行走、回头
mushroom-moe   森林蹲下采蘑菇、抬头
bilibili-cel   俯视、抬头看书
bilibili-25d   半身、手扶帽檐
bilibili-moe   抱膝坐地板、歪头
25d-lora       侧脸特写、发丝逆光
target-25d     三分之四转体、手放心口
manga-bw       仰角、伸手、速度线
ink-wash       竹林撑伞、水墨
ukiyo-e        和伞、波纹装饰背景
retro          咖啡厅托腮、窗光
pastel         草地仰躺、花瓣
lineart        回头、风衣翻飞、黑白线稿
chibi          Q 版跳跃、举手
cinematic      天台黄昏、中景、城市天际线
illustration   花田捧花、花瓣飘
cyberpunk      雨夜霓虹巷、侧目
2.5D 厚涂 / 柔光   温泉回眸（不戴帽、头发披散、无马耳）
```

风格标签全部取自 `app.js` 里该画风的**真实标签**，LoRA 也按真实强度加载
（gal-3d 0.55 / ririko-cel 0.8 / mushroom-moe 0.8 / bilibili 系列 0.75 / 25d-lora 0.75 / target-25d 0.45）。

修正过程中的两轮返工：

```text
1. 第一版太写实 CG → 加 anime face / large anime eyes，负面加 photorealistic
2. lineart 出彩色、ink-wash 不像水墨、cinematic 人物太小 → 分别补 monochrome 词、
   sumi-e 词、改中景，并各加专属负面
```

预览统一缩到 600/860 宽 + 256 色量化，24 张共 6.8MB（原 23MB），肉眼几乎无差。

## 安装

发布包是单安装器。首次启动如果缺少 ComfyUI / Python，会弹出“一键部署完整环境”，自动下载约 8GB 的 ComfyUI、Python、Anima Base、Qwen3、VAE 和节点。

离线用户可使用 `build_offline_bundle.ps1` 生成独立完整运行环境包，安装后在设置中指向解压目录。

1. 运行 `Lumen-Studio-Flow-Setup-0.2.49.exe`
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
