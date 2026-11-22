$ErrorActionPreference = "Stop"
$root = "F:\DSH WORKSPACE\lumen-flow"
$donePath = Join-Path $root "training\_crawl\bilibili\LIBRARY_DONE.json"
$libraryPath = Join-Path $root "training\bilibili_library.json"
$python = "F:\DSH WORKSPACE\.venv\Scripts\python.exe"
$train = Join-Path $root "training\scripts\train_anima_bilibili_style.ps1"
$log = Join-Path $root "training\_crawl\train.log"

while (-not (Test-Path $donePath)) {
  Add-Content $log "$(Get-Date -Format o) waiting for crawler DONE"
  Start-Sleep -Seconds 60
}
while (-not (Test-Path $libraryPath)) {
  Add-Content $log "$(Get-Date -Format o) waiting for bilibili_library.json"
  Start-Sleep -Seconds 60
}
Add-Content $log "$(Get-Date -Format o) library ready"

$libraryPath = Join-Path $root "training\bilibili_training_images.json"
$library = Get-Content -LiteralPath $libraryPath -Raw -Encoding utf8 | ConvertFrom-Json
$styles = @("flat_cel", "2_5d_semi", "moe_2d")
$manifest = @()
foreach ($style in $styles) {
  $rows = @($library | Where-Object { $_.style -eq $style })
  if ($rows.Count -lt 4) {
    Add-Content $log "skip $style ($($rows.Count))"
    continue
  }
  $inbox = Join-Path $root "training\inbox\$style\batch_bilibili"
  New-Item -ItemType Directory -Force $inbox | Out-Null
  $rows | Select-Object -First 160 | ForEach-Object {
    if (Test-Path $_.file) { Copy-Item $_.file $inbox -Force }
  }
  $manifest += [pscustomobject]@{ style = $style; source_images = $rows.Count; used = @(Get-ChildItem $inbox -File).Count }
  Add-Content $log "$(Get-Date -Format o) prepared $style"
}

& $python (Join-Path $root "training\scripts\curate_style_dataset.py") *>> $log
foreach ($style in $styles) {
  $dir = Join-Path $root "training\dataset\images\$style"
  if (-not (Test-Path $dir)) { continue }
  $count = @(Get-ChildItem $dir -File | Where-Object { $_.Extension -match "^\.(jpg|jpeg|png|webp)$" }).Count
  if ($count -lt 4) { continue }
  & $python (Join-Path $root "training\scripts\caption_style_dataset.py") --only-label $style --trigger "bilibili_${style}_style" *>> $log
  Set-ExecutionPolicy -Scope Process Bypass -Force
  & $train -Style $style -Epochs 1 -Rank 16 -BlocksToSwap 8 -Repeats 5
  $model = Join-Path $root "training\output\bilibili_$style\bilibili_${style}_anima_v1.safetensors"
  if (Test-Path $model) { Copy-Item $model (Join-Path $root "models\loras\bilibili_${style}_anima_v1.safetensors") -Force }
}

$manifest | ConvertTo-Json -Depth 4 | Set-Content (Join-Path $root "training\bilibili_style_manifest.json") -Encoding utf8
Add-Content $log "$(Get-Date -Format o) pipeline done"






