$ErrorActionPreference = 'Stop'
$root = 'F:\DSH WORKSPACE\lumen-flow\comfy'
$python = 'F:\DSH WORKSPACE\.venv\Scripts\python.exe'
& $python "$root\main.py" --listen 127.0.0.1 --port 8188 --lowvram --preview-method none
