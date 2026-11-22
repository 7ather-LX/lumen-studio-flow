# Build an optional offline bundle

This script creates a single offline runtime archive for machines without reliable internet.
The GitHub release still ships the small app installer; the offline archive is distributed separately.

Run from PowerShell:

```powershell
.\build_offline_bundle.ps1 -Root "F:\DSH WORKSPACE\lumen-flow" -Output "F:\LumenFlow-offline.7z"
```

Contents:

```text
comfy/                         ComfyUI source
models/                        Anima / Qwen / VAE / LoRA
.venv/                         Python environment used by this machine
runtime-plugins/               Anima custom nodes
release/Lumen-Studio-Flow-Setup-0.2.6.exe
OFFLINE_README.txt
```

The archive is intentionally not uploaded to GitHub because it is tens of gigabytes.
