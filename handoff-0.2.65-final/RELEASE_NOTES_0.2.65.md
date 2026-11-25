# Lumen Studio Flow v0.2.65

完全免费、为爱发电的本地 AI 绘画工作台。Electron + ComfyUI + Anima，本地优先，不上传素材。

## 修复：局部修正「擦除」报 PermissionError

现象：

```text
Error: 擦除失败： PermissionError: [Errno 13] Permission denied:
'C:\Users\...\AppData\Local\Temp\lumen-erase-1795606266818.png'
```

根因（本机复现确认）：

```text
Electron 的 app.getPath("temp") → C:\Users\...\AppData\Local\Temp
python 的 tempfile.gettempdir() → F:\DSH WORKSPACE
两者不一致，而且 C 盘的 Local\Temp / Roaming 目录对 python 进程都不可写（实测）
中间文件路径由 Electron 决定、写入由 python 执行 → 必然失败
```

修复：

```text
1. 新增 writableTempDir()：按顺序探测
   outputs\_tmp  →  outputs  →  %APPDATA%\Lumen Studio Flow\tmp  →  Electron temp  →  系统 tmp
   每个候选都做真实写探针（建目录 + 写 + 删），第一个成功的才用
2. 擦除中间文件优先落在「作品同盘的 outputs\_tmp」（实测只有这里 python 可写）
3. 仍然是权限错误时，自动回退到 outputs 根目录再试一次，并把两个路径写进报错信息
4. 高清化 / 导入图片的临时文件同样改走 writableTempDir()
5. 作品栏只列 outputs 根下的文件，_tmp 子目录与点开头文件不会出现在作品栏
6. region-erase.py 增加显式错误上报，权限问题会返回可读原因而不是堆栈
```

验证：

```text
outputs\_tmp      写入 OK（擦除成功）
outputs 根         写入 OK
Local\Temp        FAIL（已复现，故不再使用）
Roaming\...\tmp   FAIL（同上）
```

## 安装

1. 运行 `Lumen-Studio-Flow-Setup-0.2.65.exe`
2. 首次启动自动部署 ComfyUI + Python + Anima Base + Qwen3 + VAE

GitHub：https://github.com/7ather-LX/lumen-studio-flow
