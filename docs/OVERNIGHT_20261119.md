# Overnight Build 2026-11-19

## Running

### Bilibili crawler

```text
training/scripts/crawl_bilibili_images.mjs
```

- reads `training/bilibili_columns.json`
- opens all 300 columns in the agent browser
- extracts article images from the DOM
- skips columns whose title has explicit-content keywords
- saves under `training/_crawl/bilibili/<style>/<column>/`
- writes `training/_crawl/bilibili/manifest.jsonl`
- writes `DONE.json` when finished

### Classifier

```text
training/scripts/finalize_bilibili_library.ps1
training/scripts/classify_bilibili_library.py
```

Waits for the crawler, then writes:

```text
training/bilibili_library.json
docs/BILIBILI_LIBRARY.md
```

The report groups by:

- style: `flat_cel`, `2_5d_semi`, `moe_2d`, `manga`, `unknown`
- artist parsed from the column title
- image counts

## Already completed

- `25d_anima_v4.safetensors`
- `anatomy_anima_v1.safetensors`
- `foot_anima_v1.safetensors`
- `fabric_anima_v1.safetensors`
- `ririko_anima_v2.safetensors`
- `mushroom_anima_v2.safetensors`
- default batch = 3
- AnimaRefAdapter tested with `reference-2.5d.png`
- Windows installer with desktop shortcut
- GitHub release v0.2.5 with LoRA/training share

## Morning check

```text
F:\DSH WORKSPACE\lumen-flow\docs\BILIBILI_LIBRARY.md
F:\DSH WORKSPACE\lumen-flow\training\bilibili_library.json
F:\DSH WORKSPACE\lumen-flow\training\_crawl\finalize.log
```

## Caveat

Bilibili may rate-limit or return pages without images.  
Only non-explicit columns are used for training.  
Classification is automated; artist/style labels need a final manual pass.
