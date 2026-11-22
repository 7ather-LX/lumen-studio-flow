param(
  [string]$Root = "F:\DSH WORKSPACE\lumen-flow",
  [string]$Output = "F:\LumenFlow-offline.7z"
)
$ErrorActionPreference = "Stop"
$sevenZip = Join-Path $Root "7zr.exe"
if (-not (Test-Path $sevenZip)) {
  Invoke-WebRequest -Uri "https://www.7-zip.org/a/7zr.exe" -OutFile $sevenZip -UseBasicParsing
}
$venv = Join-Path (Split-Path $Root -Parent) ".venv"
$staging = Join-Path $env:TEMP "lumen-offline-readme"
New-Item -ItemType Directory -Force $staging | Out-Null
@"
Lumen Studio Flow offline bundle

1. Extract this archive to a fixed folder, for example F:\LumenFlow.
2. Run release\Lumen-Studio-Flow-Setup-0.2.6.exe.
3. Open Settings and set:
   ComfyUI directory: <extract>\comfy
   Python: <extract>\.venv\Scripts\python.exe
   Output directory: <extract>\outputs
4. Do not move the folder after installation.
"@ | Set-Content (Join-Path $staging "OFFLINE_README.txt") -Encoding UTF8

$items = @(
  (Join-Path $Root "comfy"),
  (Join-Path $Root "models"),
  (Join-Path $Root "runtime-plugins"),
  $venv,
  (Join-Path $Root "release")
)
$existing = $items | Where-Object { Test-Path $_ }
& $sevenZip a -t7z -mx=3 $Output @existing (Join-Path $staging "OFFLINE_README.txt")
Write-Host "Created $Output"
