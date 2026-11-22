param(
  [string]$Kohya = "F:\DSH WORKSPACE\kohya_ss",
  [string]$Config = "F:\DSH WORKSPACE\lumen-flow\training\configs\galgame3d_sd15.toml",
  [string]$Python = "F:\DSH WORKSPACE\.venv\Scripts\python.exe",
  [switch]$Integrate
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command nvidia-smi -ErrorAction SilentlyContinue)) {
  throw "No NVIDIA GPU detected. This training config expects CUDA."
}
nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv,noheader

if (-not (Test-Path (Join-Path $Kohya "train_network.py"))) {
  throw "kohya_ss train_network.py not found under $Kohya"
}
if (-not (Test-Path $Config)) {
  throw "Training config not found: $Config"
}

Push-Location $Kohya
try {
  & $Python -m accelerate.commands.launch `
    --num_cpu_threads_per_process 4 `
    train_network.py `
    --config_file $Config
  if ($LASTEXITCODE -ne 0) { throw "Training failed with exit code $LASTEXITCODE" }
} finally {
  Pop-Location
}

$trained = "F:\DSH WORKSPACE\lumen-flow\training\output\galgame3d_v1.safetensors"
if (-not (Test-Path $trained)) {
  throw "Training finished but output missing: $trained"
}

if ($Integrate) {
  & $Python "F:\DSH WORKSPACE\lumen-flow\training\scripts\integrate_style_lora.py" `
    --lora $trained --name "galgame3d_v1.safetensors" --rebuild
}
Write-Host "Done. Output: $trained"
