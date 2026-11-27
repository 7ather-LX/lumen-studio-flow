# 安装验证脚本：在任意 Windows 机器上跑一遍，输出体检报告
# 用法：powershell -ExecutionPolicy Bypass -File verify-install.ps1

$ErrorActionPreference = "SilentlyContinue"
$lines = @()
function Add-Line($text) { $script:lines += $text; Write-Host $text }

Add-Line "=== Lumen Studio Flow 安装体检 ==="
Add-Line ("时间: " + (Get-Date).ToString("yyyy-MM-dd HH:mm:ss"))
Add-Line ("系统: " + (Get-CimInstance Win32_OperatingSystem).Caption + " " + (Get-CimInstance Win32_OperatingSystem).Version)

# 1. 硬件
$cpu = Get-CimInstance Win32_Processor | Select-Object -First 1
$ram = [math]::Round((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB, 1)
Add-Line ("CPU: " + $cpu.Name.Trim() + " / 核心 " + $cpu.NumberOfCores)
Add-Line ("内存: " + $ram + " GB")
$gpus = @(Get-CimInstance Win32_VideoController | Select-Object -ExpandProperty Name)
Add-Line ("显卡: " + ($gpus -join " | "))
$nvidia = @($gpus | Where-Object { $_ -match "NVIDIA" }).Count -gt 0
Add-Line ("NVIDIA 显卡: " + $(if ($nvidia) { "有（CUDA 可用）" } else { "无（将使用 CPU 模式）" }))
if ($nvidia) {
  $smi = & nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv,noheader 2>$null
  Add-Line ("nvidia-smi: " + ($smi -join " / "))
}
$freeDisk = [math]::Round((Get-PSDrive C).Free / 1GB, 1)
Add-Line ("C 盘剩余: " + $freeDisk + " GB")

# 2. 安装位置
$candidates = @(
  "$env:LOCALAPPDATA\Programs\Lumen Studio Flow",
  "$env:ProgramFiles\Lumen Studio Flow",
  "${env:ProgramFiles(x86)}\Lumen Studio Flow"
)
$installed = $candidates | Where-Object { Test-Path (Join-Path $_ "Lumen Studio Flow.exe") }
if ($installed) {
  foreach ($dir in $installed) {
    $exe = Join-Path $dir "Lumen Studio Flow.exe"
    Add-Line ("安装目录: " + $dir)
    Add-Line ("版本: " + (Get-Item $exe).VersionInfo.ProductVersion)
    Add-Line ("文件数: " + (Get-ChildItem $dir -Recurse -File).Count + " / 大小 " + [math]::Round(((Get-ChildItem $dir -Recurse -File | Measure-Object Length -Sum).Sum / 1MB), 1) + " MB")
    Add-Line ("卸载程序: " + $(if (Test-Path (Join-Path $dir "Uninstall Lumen Studio Flow.exe")) { "有" } else { "缺失" }))
  }
} else {
  Add-Line "安装目录: 未找到（可能装在自定义路径，请手动确认）"
}

# 3. 快捷方式
foreach ($lnkDir in @("$env:USERPROFILE\Desktop", "$env:PUBLIC\Desktop", "$env:APPDATA\Microsoft\Windows\Start Menu\Programs")) {
  Get-ChildItem $lnkDir -Filter "*Lumen*.lnk" | ForEach-Object {
    $sh = New-Object -ComObject WScript.Shell
    $s = $sh.CreateShortcut($_.FullName)
    Add-Line ("快捷方式: " + $_.FullName + " -> " + $s.TargetPath + " | 图标 " + $s.IconLocation)
  }
}

# 4. 注册表卸载项
$regPaths = @(
  "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*",
  "HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*",
  "HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*"
)
$found = Get-ItemProperty $regPaths | Where-Object { $_.DisplayName -like "*Lumen*" }
if ($found) {
  foreach ($item in $found) { Add-Line ("注册表: " + $item.DisplayName + " " + $item.DisplayVersion + " | 卸载命令 " + $item.UninstallString) }
} else {
  Add-Line "注册表: 未找到卸载项（免安装版属正常）"
}

# 5. 数据目录与运行时
$data = "$env:APPDATA\Lumen Studio Flow"
if (Test-Path $data) {
  $size = [math]::Round(((Get-ChildItem $data -Recurse -File | Measure-Object Length -Sum).Sum / 1GB), 2)
  Add-Line ("数据目录: " + $data + " / " + $size + " GB")
  Add-Line ("  作品文件: " + (Get-ChildItem (Join-Path $data "outputs") -File -Filter *.png).Count)
  $log = Join-Path $data "comfyui.log"
  if (Test-Path $log) { Add-Line ("  comfyui.log 最后一行: " + (Get-Content $log -Tail 1)) }
} else {
  Add-Line ("数据目录: 尚未创建（未首次启动过？）：" + $data)
}

# 6. 端口
$port = Get-NetTCPConnection -LocalPort 8188 -State Listen
Add-Line ("ComfyUI 端口 8188: " + $(if ($port) { "监听中" } else { "未监听（软件未启动引擎）" }))

# 7. 是否在意外位置生成了文件
$stray = @()
foreach ($probe in @("C:\", "$env:USERPROFILE\Documents", "$env:USERPROFILE\Desktop")) {
  $stray += Get-ChildItem $probe -File -Filter "*lumen*" -ErrorAction SilentlyContinue | Where-Object { $_.Extension -ne ".lnk" }
}
if ($stray.Count) { Add-Line ("疑似散落文件: " + (($stray | ForEach-Object { $_.FullName }) -join "; ")) } else { Add-Line "散落文件检查: 干净（仅桌面快捷方式）" }

Add-Line "=== 体检结束 ==="
$out = Join-Path $env:USERPROFILE "Desktop\lumen-verify-report.txt"
$lines | Set-Content $out -Encoding UTF8
Write-Host ""
Write-Host ("报告已保存: " + $out)
