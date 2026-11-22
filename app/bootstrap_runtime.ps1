param(
  [string]$Root = "F:\LumenFlow",
  [string]$Plugins = ""
)
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"
New-Item -ItemType Directory -Force $Root | Out-Null

function Download($Url, $Dest) {
  if (Test-Path $Dest) { return }
  Write-Host "Downloading $Url"
  New-Item -ItemType Directory -Force (Split-Path $Dest) | Out-Null
  Invoke-WebRequest -Uri $Url -OutFile $Dest -UseBasicParsing
}

$sevenZip = Join-Path $Root "7zr.exe"
Download "https://www.7-zip.org/a/7zr.exe" $sevenZip

$portable = Join-Path $Root "ComfyUI_windows_portable"
$comfy = Join-Path $portable "ComfyUI"
$python = Join-Path $portable "python_embeded\python.exe"
if (-not (Test-Path (Join-Path $comfy "main.py"))) {
  $archive = Join-Path $Root "ComfyUI_windows_portable_nvidia.7z"
  Download "https://github.com/comfyanonymous/ComfyUI/releases/download/v0.46.0/ComfyUI_windows_portable_nvidia.7z" $archive
  Write-Host "Extracting ComfyUI portable..."
  & $sevenZip x $archive "-o$Root" -y | Out-Null
  if (-not (Test-Path (Join-Path $comfy "main.py"))) {
    throw "ComfyUI portable extraction failed"
  }
}

$modelRoot = Join-Path $comfy "models"
Download "https://hf-mirror.com/circlestone-labs/Anima/resolve/main/split_files/diffusion_models/anima-base-v1.0.safetensors" (Join-Path $modelRoot "diffusion_models\anima-base-v1.0.safetensors")
Download "https://hf-mirror.com/circlestone-labs/Anima/resolve/main/split_files/text_encoders/qwen_3_06b_base.safetensors" (Join-Path $modelRoot "text_encoders\qwen_3_06b_base.safetensors")
Download "https://hf-mirror.com/circlestone-labs/Anima/resolve/main/split_files/vae/qwen_image_vae.safetensors" (Join-Path $modelRoot "vae\qwen_image_vae.safetensors")

if ($Plugins -and (Test-Path $Plugins)) {
  $nodes = Join-Path $comfy "custom_nodes"
  New-Item -ItemType Directory -Force $nodes | Out-Null
  Copy-Item (Join-Path $Plugins "*") $nodes -Recurse -Force
}

$meta = [ordered]@{
  comfyDir = $portable
  pythonExe = $python
  unet = "anima-base-v1.0.safetensors"
  clip = "qwen_3_06b_base.safetensors"
  vae = "qwen_image_vae.safetensors"
  installedAt = (Get-Date).ToString("o")
}
$meta | ConvertTo-Json | Set-Content (Join-Path $Root "runtime.json") -Encoding UTF8
Write-Host "Runtime ready: $portable"
