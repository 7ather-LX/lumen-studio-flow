#!/usr/bin/env python3
"""Import the Chinese AI pose/costume/portrait gallery into a local Lumen reference library.

The upstream repository is MIT for code only. Its img/, thumbs/ and data/ assets
remain copyright their original authors and are non-commercial. This script
therefore never downloads or redistributes assets; point it at a copy you already
have and it builds a local catalog and optionally copies thumbnails.

Usage:
  python scripts/import_pose_gallery.py --source F:\\path\\to\\ai-pose-gallery-zh
  python scripts/import_pose_gallery.py --source ... --copy-thumbs
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
from pathlib import Path

POSE_OVERRIDES = {
    "单腿侧高抬": "standing on one leg, one leg raised to the side, high side kick, V-shape, balancing",
    "S形站姿": "standing, S-curve pose, hips pushed to the side, weight on one leg",
    "手背托腮前倾": "hand under chin, leaning forward, upper body, elbow supported",
    "四肢着地": "all fours, on hands and knees, looking down",
}

def clean_pose_tags(text: str) -> str:
    parts = re.split(r"[,，]", str(text or ""))
    out = []
    seen = set()
    for part in parts:
        value = re.sub(r"\s+", " ", part.strip())
        if not value or re.search(r"[\u4e00-\u9fff]", value):
            continue
        key = value.lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(value)
    return ", ".join(out)


def load(path: Path):
    if not path.exists():
        return []
    try:
        return json.loads(path.read_text(encoding="utf-8-sig"))
    except Exception as exc:
        print(f"Skipping invalid metadata: {path.name}: {exc}")
        return []


def tags_text(item: dict) -> str:
    tags = item.get("标签") or []
    keywords = item.get("关键词") or ""
    search = item.get("检索") or ""
    return ", ".join([str(t) for t in tags] + ([keywords] if keywords else [])) or search


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True, help="Path to an ai-pose-gallery-zh checkout")
    parser.add_argument("--dest", default=r"F:\DSH WORKSPACE\lumen-flow\references\pose-gallery-import")
    parser.add_argument("--copy-thumbs", action="store_true", help="Copy thumbnails into dest/thumbs")
    args = parser.parse_args()

    source = Path(args.source)
    dest = Path(args.dest)
    dest.mkdir(parents=True, exist_ok=True)
    data = source / "data"
    pose_keywords = {}
    for keyword_file in ["pose-keywords-v2.json", "pose-keywords.json"]:
        try:
            pose_keywords = json.loads((source / keyword_file).read_text(encoding="utf-8"))
            break
        except Exception:
            pass
    angle_tags = {"正面": "from front", "俯视": "from above", "仰视": "from below", "侧面": "from side", "斜侧": "three-quarter view"}
    pose_fallback = {"站姿": "standing", "坐姿": "sitting", "跪姿": "kneeling", "躺姿": "lying", "蹲姿": "squatting", "趴姿": "prone", "仰卧": "supine"}
    entries: list[dict] = []

    def add(kind: str, item: dict, name_key: str, category_key: str, thumb_key: str = "缩略图") -> None:
        name = str(item.get(name_key) or item.get("id") or "")
        category = str(item.get(category_key) or kind)
        thumb = str(item.get(thumb_key) or "")
        entry = {
            "id": f"{kind}:{item.get('id', len(entries))}",
            "kind": kind,
            "name": name,
            "category": category,
            "tags": item.get("标签") or [],
            "keywords": item.get("关键词") or "",
            "prompt": tags_text(item),
            "thumb": thumb,
            "depthThumb": f"thumbs/depth/{item.get('id')}.webp" if kind == "pose" else "",
            "source": "anhao/ai-pose-gallery-zh",
            "license": "non-commercial reference; images remain with original authors",
        }
        if kind == "pose":
            key = f"{item.get('体系', '')}|{item.get('姿势编号', '')}"
            pose_tags = pose_keywords.get(key, "")
            pose_tags = clean_pose_tags(pose_tags)
            for phrase, override in POSE_OVERRIDES.items():
                if phrase in str(item.get("姿势名称", "")):
                    pose_tags = override
                    break
            if not pose_tags:
                pose_tags = pose_fallback.get(str(item.get("分类", "")), "pose reference")
            angle = angle_tags.get(str(item.get("角度", "")), "")
            entry["prompt"] = ", ".join([x for x in [pose_tags, angle] if x])
            entry["depth"] = True
        if args.copy_thumbs and thumb:
            src = source / thumb
            if src.exists():
                target = dest / "thumbs" / kind / src.name
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(src, target)
                entry["localThumb"] = str(target)
        entries.append(entry)

    for item in load(data / "pose-zh.json"):
        add("pose", item, "姿势名称", "体系")
    for item in load(data / "costume-zh.json"):
        add("costume", item, "服装名称", "分类")
    for item in load(data / "portrait-zh.json"):
        add("portrait", item, "标题", "分区")

    for extra, kind, name_key, category_key in [
        ("costume-anime-zh.json", "costume-anime", "服装名称", "分类"),
        ("costume-gia-anime-zh.json", "costume-anime", "服装名称", "分类"),
        ("costume-shisei-zh.json", "costume-history", "服装名称", "分类"),
    ]:
        for item in load(data / extra):
            add(kind, item, name_key, category_key)

    payload = {
        "source": "https://github.com/anhao/ai-pose-gallery-zh",
        "license": "Code MIT; img/thumbs/data assets are original-author non-commercial references and are not redistributed by Lumen.",
        "count": len(entries),
        "entries": entries,
    }
    (dest / "catalog.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Imported {len(entries)} metadata entries -> {dest / 'catalog.json'}")
    print("Images were not copied unless --copy-thumbs was supplied.")
    print("Do not redistribute the upstream images without permission.")


if __name__ == "__main__":
    main()
