#!/usr/bin/env python3
"""Copy a trained LoRA into Flow and point the Galgame 3D style at it.

Example:
  python training/scripts/integrate_style_lora.py \
    --lora training/output/galgame3d_v1.safetensors \
    --name galgame3d_v1.safetensors \
    --rebuild
"""
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LORA_DIR = ROOT / "models" / "loras"
STYLE_JSON = ROOT / "app" / "renderer" / "style-loras.json"
ASAR_OUT = ROOT / "app.asar"
APP_DIR = ROOT / "app"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--lora", type=Path, required=True)
    parser.add_argument("--name", default="galgame3d_v1.safetensors")
    parser.add_argument("--style", default="gal-3d")
    parser.add_argument("--rebuild", action="store_true")
    args = parser.parse_args()
    source = args.lora.resolve()
    if not source.exists():
        raise SystemExit(f"LoRA not found: {source}")
    LORA_DIR.mkdir(parents=True, exist_ok=True)
    destination = LORA_DIR / args.name
    shutil.copy2(source, destination)
    mapping = {}
    if STYLE_JSON.exists():
        try:
            mapping = json.loads(STYLE_JSON.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            mapping = {}
    mapping[args.style] = args.name
    STYLE_JSON.write_text(json.dumps(mapping, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"copied {destination}")
    print(f"updated {STYLE_JSON}: {mapping}")
    if args.rebuild:
        asar = Path(r"F:\DSH WORKSPACE\node_modules\.pnpm\@electron+asar@3.4.1\node_modules\@electron\asar")
        script = (
            "const asar=require(process.argv[1]);"
            f"asar.createPackage(process.argv[2],process.argv[3]).then(()=>console.log('app.asar rebuilt'))"
        )
        subprocess.run(
            ["node", "-e", script, str(asar), str(APP_DIR), str(ASAR_OUT)],
            check=True,
        )


if __name__ == "__main__":
    main()
