# Lumen Studio Flow - one-step local setup
# Run from an elevated PowerShell if ComfyUI needs to be installed on a protected path.
param(
  [string]$Root = "F:\DSH WORKSPACE\lumen-flow",
  [string]$LlmModel = ""   # 可选：llama-3b-8b | qwen3-14b | 留空则跳过
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

# ---------- 可选：本地提示词模型（llama.cpp GGUF） ----------
$LLM_CATALOG = @{
  "llama-9b"   = @{ Url = "https://hf-mirror.com/mradermacher/Qwen3-8B-abliterated-GGUF/resolve/main/Qwen3-8B-abliterated.Q4_K_M.gguf"; File = "Qwen3-8B-abliterated.Q4_K_M.gguf"; Size = 4.68 }
  "qwen3-8b"   = @{ Url = "https://hf-mirror.com/mradermacher/Qwen3-8B-abliterated-GGUF/resolve/main/Qwen3-8B-abliterated.Q4_K_M.gguf"; File = "Qwen3-8B-abliterated.Q4_K_M.gguf"; Size = 4.68 }
  "qwen3-14b"  = @{ Url = "https://hf-mirror.com/unsloth/Qwen3-14B-GGUF/resolve/main/Qwen3-14B-Q4_K_M.gguf"; File = "Qwen3-14B-Q4_K_M.gguf"; Size = 8.38 }
}

if ($LlmModel) {
  $entry = $LLM_CATALOG[$LlmModel.ToLower()]
  if (-not $entry) {
    Write-Host "Unknown -LlmModel '$LlmModel'. Available: $($LLM_CATALOG.Keys -join ', ')" -ForegroundColor Yellow
  } else {
    $llmDir = Join-Path $Root "models\llm"
    $dest = Join-Path $llmDir $entry.File
    if (Test-Path $dest) {
      Write-Host "exists: $dest"
    } else {
      New-Item -ItemType Directory -Force $llmDir | Out-Null
      Write-Host ("downloading LLM {0} (~{1} GB) ..." -f $entry.File, $entry.Size)
      & curl.exe -L --fail --retry 3 --retry-delay 3 -o $dest $entry.Url
      if (Test-Path $dest) {
        Write-Host "LLM ready: $dest" -ForegroundColor Green
      } else {
        Write-Host "LLM download failed. Set Settings -> 本地 AI 模型 to the GGUF path manually." -ForegroundColor Yellow
      }
    }
    Write-Host "Point Settings -> 本地 AI 模型 at: $dest"
  }
} else {
  Write-Host "提示：加 -LlmModel qwen3-14b（或 llama-9b）可自动下载本地提示词模型。" -ForegroundColor DarkGray
}

Write-Host "Base Anima setup complete. Add 2.9B and ComfyUI if they are still missing." -ForegroundColor Green
