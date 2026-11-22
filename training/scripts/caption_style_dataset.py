#!/usr/bin/env python3
"""Write simple style captions next to curated images.

For a style LoRA, captions should be SHORT and mostly style-only. Character
tags belong in the generation prompt, not in the style dataset captions.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_MANIFEST = ROOT / "training" / "dataset" / "manifest.jsonl"
TRIGGER = "galgame3d_style"

CAPTIONS = {
    "galgame_3d": "galgame 3d, soft shading, glossy skin, detailed hair, soft lighting, semi-realistic anime, clean rendering",
    "2_5d_semi": "2.5d, semi-realistic anime, soft painterly shading, detailed skin, cinematic light",
    "flat_cel": "anime cel shading, flat colors, clean lineart, crisp highlights",
    "moe_2d": "moe anime, cute stylized proportions, soft colorful shading, glossy highlights, playful props, clean anime rendering",
    "realistic_anime": "realistic anime, detailed skin, detailed hands, detailed feet, anatomy study, soft shading, cinematic light, clean rendering",
    "anatomy_study": "anatomy study, detailed hands, detailed feet, five toes, foot soles, finger structure, fabric folds, sheer stockings texture, close-up reference",
    "foot_study": "foot study, five toes, individual toes, detailed foot soles, foot arch, ankle, bare feet, correct toe count",
    "fabric_study": "fabric study, sheer black pantyhose, nylon texture, fabric weave, lace trim, cloth folds, stocking texture, close-up reference",
    "hand_study": "hand study, detailed hands, five fingers, knuckles, fingernails, wrist, correct finger count, close-up anatomy reference",
    "oil_photoreal": "photorealistic, oil painting texture, heavy brushwork",
}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--trigger", default=TRIGGER)
    parser.add_argument("--only-label", default="galgame_3d")
    args = parser.parse_args()
    rows = [json.loads(line) for line in args.manifest.read_text(encoding="utf-8").splitlines() if line.strip()]
    written = 0
    for row in rows:
        if args.only_label and row["label"] != args.only_label:
            continue
        image = Path(row["file"])
        caption = f"{args.trigger}, {CAPTIONS.get(row['label'], 'anime illustration')}"
        image.with_suffix(".txt").write_text(caption, encoding="utf-8")
        written += 1
    print(f"wrote {written} captions with trigger {args.trigger}")


if __name__ == "__main__":
    main()

