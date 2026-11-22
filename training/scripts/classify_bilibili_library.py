#!/usr/bin/env python3
"""Turn the raw Bilibili crawl manifest into an artist/style library report."""
from __future__ import annotations

import json
import re
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(r"F:\DSH WORKSPACE\lumen-flow")
TITLES = ROOT / "training" / "bilibili_titles.json"
CRAWL = ROOT / "training" / "_crawl" / "bilibili"
MANIFEST = CRAWL / "manifest.jsonl"
OUT = ROOT / "training" / "bilibili_library.json"
REPORT = ROOT / "docs" / "BILIBILI_LIBRARY.md"


def artist_from_title(title: str) -> str:
    text = re.sub(r"^【[^】]+】", "", title or "").strip()
    token = re.split(r"[\s\-_/|]+", text)[0].strip()
    return token[:48] or "unknown"


def style_from_title(title: str) -> str:
    text = title or ""
    if re.search(r"2\.5D|2\.5d|半写实|写实|厚涂|光影|质感|体积感|CG|3D|渲染", text):
        return "2_5d_semi"
    if re.search(r"短漫|漫画|四格", text):
        return "manga"
    if re.search(r"萌|可爱|萝莉|Q版|猫耳|女仆", text):
        return "moe_2d"
    if re.search(r"赛璐珞|平涂|动画|TV|原画|线稿|图集|画集", text):
        return "flat_cel"
    if re.search(r"LoveLive|MyGo|BanG|Girls|Link!|学园偶像|學園偶像|偶像", text, re.I):
        return "flat_cel"
    if re.search(r"CG|3D|设定集|設定集|公式|guidebook", text, re.I):
        return "2_5d_semi"
    return "unknown"


def main() -> None:
    title_map = {}
    if TITLES.exists():
        title_map = {
            str(item["id"]): item["title"]
            for item in json.loads(TITLES.read_text(encoding="utf-8-sig"))
        }
    rows = []
    if MANIFEST.exists():
        for line in MANIFEST.read_text(encoding="utf-8", errors="ignore").splitlines():
            try:
                row = json.loads(line)
            except json.JSONDecodeError:
                continue
            if row.get("event") or not row.get("file"):
                continue
            rows.append(row)

    by_style = defaultdict(list)
    by_artist = defaultdict(list)
    for row in rows:
        title = title_map.get(str(row.get("id")), row.get("title", ""))
        style = style_from_title(title)
        artist = artist_from_title(title)
        row["style"] = style
        row["title"] = title
        row["artist"] = artist
        by_style[style].append(row)
        by_artist[artist].append(row)

    # Propagate a known style from other columns by the same artist.
    artist_styles = {
        artist: Counter(item["style"] for item in items if item["style"] != "unknown")
        for artist, items in by_artist.items()
    }
    for row in rows:
        row["fallback"] = False
        if row["style"] == "unknown":
            known = artist_styles.get(row["artist"])
            if known:
                row["style"] = known.most_common(1)[0][0]
            else:
                # Publication/fanbook/artbook default; flagged for review.
                row["style"] = "flat_cel"
                row["fallback"] = True
    by_style = defaultdict(list)
    by_artist = defaultdict(list)
    for row in rows:
        by_style[row["style"]].append(row)
        by_artist[row["artist"]].append(row)

    library = {
        "source": "Bilibili UP 298252208",
        "total_images": len(rows),
        "fallback_flat_cel": sum(1 for row in rows if row.get("fallback")),
        "styles": {key: len(value) for key, value in sorted(by_style.items())},
        "artists": {
            key: {
                "count": len(value),
                "styles": Counter(item["style"] for item in value).most_common(),
            }
            for key, value in sorted(by_artist.items(), key=lambda item: len(item[1]), reverse=True)
        },
        "images": rows,
    }
    OUT.write_text(json.dumps(library, ensure_ascii=False, indent=2), encoding="utf-8")
    lines = ["# Bilibili Artist / Style Library", "", f"Total downloaded images: **{len(rows)}**", "", f"Fallback-classified as flat_cel: **{library['fallback_flat_cel']}**", "", "## Styles"]
    for key, value in sorted(by_style.items(), key=lambda item: len(item[1]), reverse=True):
        lines.append(f"- `{key}`: {len(value)}")
    lines += ["", "## Top artists"]
    for key, value in sorted(by_artist.items(), key=lambda item: len(item[1]), reverse=True)[:80]:
        lines.append(f"- `{key}`: {len(value)}")
    REPORT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(json.dumps({"images": len(rows), "styles": library["styles"], "artists": len(by_artist)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
