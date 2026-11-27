# Lumen Studio Flow · 本地 AI 绘画工作台

完全免费、本地优先的 AI 动漫绘画软件。基于 Electron + ComfyUI + Anima，**所有生成都在你自己的电脑上完成，图片和素材不上传任何服务器**。

---

## 一、下载

到 [Releases](https://github.com/7ather-LX/lumen-studio-flow/releases/latest) 页面，按需要选一个：

| 文件 | 适合谁 | 说明 |
|---|---|---|
| `Lumen-Studio-Flow-Setup-x.y.z.exe` | **推荐**，绝大多数人 | 安装版，可选安装路径，自动建桌面快捷方式，可卸载 |
| `Lumen-Studio-Flow-x.y.z.exe` | 想放 U 盘 / 不想安装 | 免安装单文件版，双击即用 |
| `character-appearance-template.csv` | 想补角色外观的人 | 649 个热门角色待填表，填好后在软件内批量导入 |

> 只下载**最新一个 Release**。旧版本不需要保留，覆盖安装即可升级。

---

## 二、系统要求

| 项目 | 最低 | 推荐 |
|---|---|---|
| 系统 | Windows 10 64 位 | Windows 11 64 位 |
| 显卡 | 无独显也能跑（CPU，很慢） | NVIDIA RTX 3060 12GB 及以上 |
| 显存 | — | 8GB+（6GB 可用低显存档） |
| 内存 | 16 GB | 32 GB |
| 磁盘 | 20 GB 可用空间 | 40 GB（含模型与作品） |
| 网络 | 首次启动需要联网下载运行时 | — |

**显卡说明**

- **NVIDIA**：开箱即用，自动安装 CUDA 版运行时。
- **AMD / Intel 核显 / 无独显**：安装程序会自动改装 CPU 版 PyTorch，软件能跑，但一张图可能要几分钟到十几分钟。界面右上角会显示 `CPU 模式`。
- **苹果 / Linux**：目前只提供 Windows x64 安装包。

---

## 三、安装步骤（标准流程）

### 1. 运行安装程序

双击 `Lumen-Studio-Flow-Setup-x.y.z.exe`。

- 若出现「Windows 已保护你的电脑」：点 **更多信息 → 仍要运行**（安装包未做付费代码签名）。
- 安装界面可以**自定义安装路径**（默认 `C:\Users\<你>\AppData\Local\Programs\Lumen Studio Flow`）。
  建议路径只用英文、不要放在 C 盘根目录或需要管理员权限的目录。

### 2. 完成安装

安装程序会自动：

- 创建**桌面快捷方式** `Lumen Studio Flow`
- 创建开始菜单项
- 不修改系统 PATH，不写注册表启动项

### 3. 首次启动

双击桌面图标。首次启动会**自动部署运行时**（只有第一次需要）：

```
下载 ComfyUI 便携版（约 300 MB）
下载 Anima 模型 / 文本编码器 / VAE（约 4 GB，走 hf-mirror 镜像）
安装 Python 依赖（CPU 机器会额外安装 CPU 版 PyTorch）
```

进度会显示在界面左下角。**中途不要关闭软件**，网络慢时可能需要 10–30 分钟。
部署失败可以重开软件重试，已下载的部分不会重复下载。

### 4. 确认可用

启动后看左侧「ENGINE」卡片：

- 显示 **在线** + 显卡型号 → 正常
- 显示 **CPU 模式** → 也能用，只是慢
- 显示 **离线** → 点「启动本地引擎」，或看下文 FAQ

然后到「创作」页：输入提示词 → 设 3:4、3 张 → 点生成。出图即安装成功。

---

## 四、文件都放在哪（不会乱放）

| 内容 | 位置 |
|---|---|
| 程序本体 | 你选择的安装目录（默认 `%LOCALAPPDATA%\Programs\Lumen Studio Flow`） |
| 配置、作品、角色外观、参考库、日志 | `%APPDATA%\Lumen Studio Flow\` |
| 运行时（ComfyUI + 模型） | 默认在 `%APPDATA%\Lumen Studio Flow\runtime`（可在设置里改到其他盘） |

安装包**只写这两个目录**：安装目录 + `%APPDATA%\Lumen Studio Flow`。
不在桌面、文档、C 盘根目录散落文件；卸载时只删安装目录，**作品数据默认保留**。

卸载：设置 → 应用 → Lumen Studio Flow → 卸载，或运行安装目录里的 `Uninstall Lumen Studio Flow.exe`。

---

## 五、免安装版

`Lumen-Studio-Flow-x.y.z.exe` 双击即用，不安装、不建快捷方式。
数据同样写到 `%APPDATA%\Lumen Studio Flow\`，删掉这个 exe 就算移除程序，作品还在。

---

## 六、低配置 / 无独显怎么调

设置页 → 性能档：

| 档位 | 适用 |
|---|---|
| 快速档 | 老显卡（GTX 10 系）、想快点出图 |
| 低显存 | 6GB 及以下显存 |
| 质量档 | 8GB+ 显存 |
| 自定义 | 手动控制步数/CFG/高清修复 |

再配合：

- 画面比例选 1:1 或 3:4，别用更高分辨率起步
- 张数设 1
- 关闭「高清修复」「面部精修」
- 无独显机器：只建议出 512×768、1 张，单张数分钟属正常

---

## 七、常见问题

**Q：模型/运行时下载失败**
首次部署走 `hf-mirror.com`（国内镜像）。失败就重开软件重试；也可以手动运行安装目录下 `resources\bootstrap_runtime.ps1`。

**Q：ComfyUI 一直离线**
1. 看 `%APPDATA%\Lumen Studio Flow\comfyui.log` 末尾报错
2. 检查端口 8188 是否被占用：`netstat -ano | findstr 8188`
3. 杀毒软件可能拦截 python 子进程，加信任

**Q：生成很慢 / 一张要很久**
先看右上角是「在线」还是「CPU 模式」。CPU 模式属正常现象；NVIDIA 显卡请确认驱动已更新，并在设置里选「质量档」。

**Q：提示 `PortAudio` / `onnxruntime` 缺失**
自动部位检测会退回预设区域，不影响主流程。想要精确检测可在运行时里 `pip install onnxruntime`。

**Q：安装路径能不能放在中文目录**
可以，但更推荐纯英文路径，避免个别 Python 依赖解析异常。

**Q：一张图都生成不出来，提示显存不足**
换「低显存」档、分辨率降到 512×768、张数 1，或在设置里开启显存保留。

---

## 八、升级

下新版本安装包 → 直接覆盖安装。作品、配置、角色外观库都在 `%APPDATA%`，不会被覆盖。
GitHub 上只保留最新一个 Release，旧版不需要留。

---

## 九、隐私

- 生成、放大、修复全部在本机完成
- 不收集数据、不上传图片
- 只有「AI 写提示词」可选用本地 llama.cpp 或你自己的 OpenAI 兼容 API（默认本地）

---

## 十、反馈

- 问题 / 建议：[Issues](https://github.com/7ather-LX/lumen-studio-flow/issues)
- 角色外观缺失或写错：在软件「设置 → 角色外观库」改，或提 Issue 附角色名
