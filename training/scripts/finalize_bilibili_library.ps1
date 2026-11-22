$ErrorActionPreference = "Stop"
$root = "F:\DSH WORKSPACE\lumen-flow"
$done = Join-Path $root "training\_crawl\bilibili\DONE.json"
$log = Join-Path $root "training\_crawl\finalize.log"
while (-not (Test-Path $done)) {
  Add-Content $log "$(Get-Date -Format o) waiting for crawler"
  Start-Sleep -Seconds 60
}
Add-Content $log "$(Get-Date -Format o) crawler done"
& "F:\DSH WORKSPACE\.venv\Scripts\python.exe" "$root\training\scripts\classify_bilibili_library.py" *>> $log
Add-Content $log "$(Get-Date -Format o) classification done"\nSet-Content (Join-Path $root "training\\_crawl\\bilibili\\LIBRARY_DONE.json") (Get-Date -Format o) -Encoding utf8

