# Lumen Studio Flow v0.2.36

完全免费、为爱发电的本地 AI 绘画工作台。Electron + ComfyUI + Anima，本地优先，不上传素材。

## 本次更新

- **AI 一起写**：本地 CPU / GPU 双模式关键词助手
- GPU 模式：9B Q4 首次回复约 10 秒，聊天时自动暂停 ComfyUI，生成前释放 AI
- 可在设置中切换本地 AI / 外部 OpenAI 兼容 API / 关闭
- 本地 AI 支持一键下载 Qwen2.5 0.5B + llama.cpp CPU 运行时（约 520MB）
- 本地 CPU 模式不占显存；本地 GPU 模式优先速度
- 生成图片前自动停止本地 AI，释放内存
- 本地 AI 严格输出 JSON，未指定的角色 / 作品 / 画风 / 画师留空
- 一次性填入创作区
- 姿势 / 服装目录：6,162 条中文元数据，姿势英文标签已清洗去重
- 左侧栏改为完整导航；修复页面双滚动条
- 姿势库支持 Depth 路径，图片需本地导入

- 中文提示词检索增强：角色名、作品名、场景词和动作词支持中文识别与翻译
- 双参考流程：构图参考 + 角色参考，支持 Anima Ref Adapter 锁定角色
- 默认一次生成 3 张，低显存档除外
- 自动识别显存，快速档 / 质量档 / 低显存档
- `--lowvram`、`--reserve-vram 1` 低显存启动
- 参考库：角色 / 手部 / 脚部 / 画风 / 构图
- 旧 Studio 安全提示词库
- 训练素材：常见类型 + 自定义类型、显示名、触发词、词汇说明
- 作品页：勾选、全选、收藏、批量再加工
- 界面字号缩放、输出目录、外部 API 设置
- 关闭软件自动结束由软件启动的 ComfyUI 进程树，释放显存/内存
- 详细软件内使用说明
- 柴郡 / 近江复杂角色参考与 Wiki 官方参考

## 安装

发布包是单安装器。首次启动如果缺少 ComfyUI / Python，会弹出“一键部署完整环境”，自动下载约 8GB 的 ComfyUI、Python、Anima Base、Qwen3、VAE 和节点。

离线用户可使用 `build_offline_bundle.ps1` 生成独立完整运行环境包，安装后在设置中指向解压目录。

1. 运行 `Lumen-Studio-Flow-Setup-0.2.36.exe`
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

