# Lumen Studio Flow v0.2.96

完全免费、为爱发电的本地 AI 绘画工作台。Electron + ComfyUI + Anima，本地优先，不上传素材。

## 一、GitHub 介绍页重写（含标准下载/安装流程）

README 现在按「新用户第一次打开」的顺序写：

```text
一、下载        安装版 / 免安装版 / 角色外观模板 该选哪个
二、系统要求    系统、显卡、显存、内存、磁盘、网络（含 GPU 分支说明）
三、安装步骤    运行安装包 → 自定义路径 → 桌面快捷方式 → 首次启动部署 → 确认可用
四、文件都放哪  安装目录 + %APPDATA%\Lumen Studio Flow，不在别处散落；卸载保留作品
五、免安装版
六、低配置      性能档 / 分辨率 / 张数建议
七、常见问题    下载失败、离线、很慢、端口占用、路径中文
八、升级        覆盖安装，数据不丢
九、隐私
十、反馈
```

## 二、为「换一台电脑也能用」做的修复

审计发现三处写死了本机路径，在别的电脑上会直接失效：

```text
1. comfyDir 默认 "F:\DSH WORKSPACE\lumen-flow\comfy"
2. outputDir / referenceDir 默认 F:\ 下的绝对路径
3. llmBin（llama.cpp）默认 F:\novel\...\llama-server.exe
```

修复：

```text
全部改为空默认 + 自动发现：
  运行时   %APPDATA%\Lumen Studio Flow\runtime\ComfyUI_windows_portable
  作品     %APPDATA%\Lumen Studio Flow\outputs
  参考库   %APPDATA%\Lumen Studio Flow\references\library
  llama    用户数据 / 安装目录 / 常见路径，找不到就跳过 AI 编译（不影响出图）
```

## 三、无 NVIDIA 显卡 / 其他品牌显卡

```text
安装脚本现在先检测显卡：
  有 NVIDIA → 用 portable 自带 CUDA 运行时（原样）
  无 NVIDIA → 自动改装 CPU 版 PyTorch（torch/torchvision/torchaudio cpu 轮子）
              并在 runtime.json 记 device=cpu
界面表现：
  检测不到 CUDA 设备时，状态显示「CPU 模式 · 未检测到 NVIDIA 显卡，生成会很慢」
```

## 四、跨设备验证：我做到了哪一步

**已在本机静态验证**

```text
安装包配置（electron-builder.yml）：
  oneClick: false                      → 有安装向导
  allowToChangeInstallationDirectory    → 可以选择安装路径
  createDesktopShortcut: always         → 必建桌面快捷方式
  perMachine: false                     → 装到当前用户目录，不需要管理员权限
  deleteAppDataOnUninstall: false       → 卸载保留作品数据
程序写入范围：仅 安装目录 + %APPDATA%\Lumen Studio Flow
```

**未能在此环境完成**：静默安装（安装器需要交互界面，本机无桌面交互权限），
以及真实第二台设备上的运行测试（这里没有第二台机器）。

所以配了一个体检脚本 `scripts/verify-install.ps1`：在任意 Windows 机器上运行，输出：

```text
CPU / 内存 / 显卡型号 / 是否 NVIDIA / 驱动版本
安装目录 / 版本 / 文件数 / 大小 / 卸载程序是否存在
桌面与开始菜单快捷方式（含目标路径与图标）
注册表卸载项
数据目录大小 / 作品数量 / ComfyUI 日志最后一行
端口 8188 状态
是否在桌面、文档、C 盘根目录散落文件
```

本机跑通的结果（作为脚本自检）：

```text
CPU AMD Ryzen 5 7500F / 31.6 GB / RTX 4070 SUPER + 驱动 610.74
安装目录 ...\Programs\Lumen Studio Flow / 133 文件 / 370.2 MB
快捷方式 → 正确指向 exe，图标正确
数据目录 0.43 GB / 52 张作品 / ComfyUI 日志正常
端口 8188 监听中
散落文件：干净
```

## 四、低端设备支持程度

```text
能用，但要按档位调：
  快速档（GTX 10 系 / 6GB 显存）  → 出图可用
  低显存档（≤6GB）                → 512×768，1 张
  CPU 模式（无独显 / AMD / Intel）→ 单张数分钟到十几分钟，建议 512×768 起
```

CPU 模式不是"支持但不推荐"而是"确实能出图"，只是慢。README 里写清了预期。

## 安装

1. 运行 `Lumen-Studio-Flow-Setup-0.2.96.exe`
2. 首次启动自动部署 ComfyUI + Python + Anima Base + Qwen3 + VAE

GitHub：https://github.com/7ather-LX/lumen-studio-flow
