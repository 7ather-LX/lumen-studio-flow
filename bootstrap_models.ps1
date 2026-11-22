# Lumen Studio Flow - one-step local setup
# Run from an elevated PowerShell if ComfyUI needs to be installed on a protected path.
param(
  [string]$Root = "F:\DSH WORKSPACE\lumen-flow"
)

$ErrorActionPreference = "Stop"
$models = Join-Path $Root "models"
$comfy = Join-Path $Root "comfy"
New-Item -ItemType Directory -Force $models,$comfy | Out-Null

function Get-File($Url, $Dest) {
  if (Test-Path $Dest) { Write-Host "exists: $Dest"; return }
  New-Item -ItemType Directory -Force (Split-Path $Dest) | Out-Null
  Write-Host "download: $Url"
  Invoke-WebRequest -Uri $Url -OutFile $Dest -UseBasicParsing
}

Get-File "https://hf-mirror.com/circlestone-labs/Anima/resolve/main/split_files/diffusion_models/anima-base-v1.0.safetensors" "$models\diffusion_models\anima-base-v1.0.safetensors"
Get-File "https://hf-mirror.com/circlestone-labs/Anima/resolve/main/split_files/text_encoders/qwen_3_06b_base.safetensors" "$models\text_encoders\qwen_3_06b_base.safetensors"
Get-File "https://hf-mirror.com/circlestone-labs/Anima/resolve/main/split_files/vae/qwen_image_vae.safetensors" "$models\vae\qwen_image_vae.safetensors"

$two9 = "$models\diffusion_models\Anima-2.9B-preview-v1.safetensors"
if (-not (Test-Path $two9)) {
  Write-Host "Anima 2.9B is not publicly redistributed by this script." -ForegroundColor Yellow
  Write-Host "Place Anima-2.9B-preview-v1.safetensors here: $two9"
}

if (-not (Test-Path "$comfy\main.py")) {
  Write-Host "ComfyUI is missing. Install ComfyUI 0.46 portable into $comfy" -ForegroundColor Yellow
  Write-Host "or point Settings -> ComfyUI directory at an existing install."
}

Write-Host "Base Anima setup complete. Add 2.9B and ComfyUI if they are still missing." -ForegroundColor Green
