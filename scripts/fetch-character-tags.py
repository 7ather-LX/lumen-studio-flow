"""从 Konachan 图库反推角色外观标签。

用法：
  python scripts/fetch-character-tags.py --probe "warspite_(azur_lane)"
  python scripts/fetch-character-tags.py --apply --min-pop 500 --limit 400
"""
import argparse
import json
import re
import time
import urllib.parse
import urllib.request
from collections import Counter
from pathlib import Path

L = Path(__file__).resolve().parent.parent
API = "https://konachan.net/post.json"

HAIR = r"(blonde|brown|black|blue|green|red|pink|purple|silver|white|orange|grey|gray|aqua|two-tone|multicolored|streaked)\s+hair"
HAIR_STYLE = r"(long|short|very long|medium|absurdly long)\s+hair|twintails|ponytail|braid|french braid|bun|bob cut|hime cut|drill hair|side ponytail|twin braids|hair intakes|bangs|blunt bangs|ahoge|hair between eyes"
EYES = r"(blue|green|red|purple|golden|yellow|pink|orange|grey|gray|aqua|brown)\s+eyes|heterochromia|eyepatch"
EARS = r"(animal|cat|fox|wolf|horse|rabbit|fake|elf|pointy)\s+ears|kemonomimi|horns"
TAIL = r"tail"
BODY = r"(large|huge|medium|small|flat)\s+breasts|cleavage|collarbone|navel|thick thighs|toned"
OUTFIT = (
    r"(maid|military|school|sailor|serafuku|nurse|police|kimono|china|qipao|wedding|evening|"
    r"swimsuit|bikini|leotard|bodysuit|plugsuit|armor|dress|uniform|coat|cape|hood|hat|cap|beret|"
    r"headdress|headband|ribbon|bow|necktie|choker|collar|gloves|thighhighs|pantyhose|stockings|"
    r"boots|heels|skirt|apron|eyewear|sunglasses|goggles|hair ornament|hairclip|hair flower|"
    r"hairband|ear covers|halo|wings|sword|spear|shield|gun|staff)s?\b"
)
WHITELIST = re.compile(f"^({HAIR}|{HAIR_STYLE}|{EYES}|{EARS}|{TAIL}|{BODY}|{OUTFIT})$", re.I)

DROP = {
    "long_hair", "short_hair", "solo", "1girl", "1boy", "looking_at_viewer", "smile",
    "simple_background", "white_background", "transparent_background", "signature",
}


def fetch(tag: str, limit: int = 24):
    """优先只要 solo 单图：多人图会把别的角色的发色瞳色混进来。"""
    attempts = [f"{tag} solo", f"{tag} 1girl", tag]
    best = []
    for query in attempts:
        url = f"{API}?tags={urllib.parse.quote(query)}&limit={limit}&safe_mode=0"
        req = urllib.request.Request(url, headers={"User-Agent": "LumenStudioFlow/1.0 (character tag research)"})
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                raw = resp.read().decode("utf-8", "ignore")
            data = json.loads(raw)
        except Exception:
            continue
        posts = [str(item.get("tags") or "").split() for item in data]
        if len(posts) > len(best):
            best = posts
        if len(best) >= 8:
            break
        time.sleep(0.8)
    return best


def derive(tag: str, limit: int = 24):
    try:
        posts = fetch(tag, limit)
    except Exception as exc:  # noqa: BLE001
        return {"tag": tag, "error": str(exc), "tags": []}
    counter = Counter()
    for tags in posts:
        for t in set(tags):
            if t in DROP:
                continue
            normalized = t.replace("_", " ")
            if "(" in normalized or ")" in normalized:
                continue  # 别的角色/作品标签
            if WHITELIST.match(normalized):
                counter[normalized] += 1
    # 出现频率 >= 30% 且不超过 16 个
    threshold = max(2, int(len(posts) * 0.3))
    chosen = [name for name, count in counter.most_common(24) if count >= threshold][:16]
    return {"tag": tag, "posts": len(posts), "tags": chosen, "counts": dict(counter.most_common(10))}


def probe(tag: str):
    result = derive(tag)
    print(json.dumps(result, ensure_ascii=False, indent=1))


def apply(min_pop: int, limit: int, works: list[str] | None):
    base_path = L / "app" / "renderer" / "characters.json"
    extra_path = L / "app" / "renderer" / "characters-extra.json"
    changed = 0
    for path in (base_path, extra_path):
        data = json.loads(path.read_text(encoding="utf-8"))
        rows = data["characters"]
        targets = []
        for row in rows:
            tags = row.get("tags")
            has = isinstance(tags, list) and any(str(t).strip() for t in tags)
            if has:
                continue
            if (row.get("pop") or 0) < min_pop:
                continue
            if works and str(row.get("work") or "").lower() not in works:
                continue
            targets.append(row)
        targets = targets[:limit]
        print(f"{path.name}: 目标 {len(targets)} 条")
        for index, row in enumerate(targets, 1):
            result = derive(str(row.get("tag")))
            if result.get("tags"):
                row["tags"] = result["tags"]
                row["tags_source"] = "konachan"
                changed += 1
            if index % 20 == 0:
                path.write_text(json.dumps(data, ensure_ascii=False, indent=1 if path.name == "characters.json" else None,
                                           separators=None if path.name == "characters.json" else (",", ":")),
                                encoding="utf-8")
                print(f"  {index}/{len(targets)}，已补 {changed}")
            time.sleep(1.1)
        path.write_text(json.dumps(data, ensure_ascii=False,
                                   indent=1 if path.name == "characters.json" else None,
                                   separators=None if path.name == "characters.json" else (",", ":")),
                        encoding="utf-8")
    print(f"完成，补全 {changed} 条")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--probe")
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--min-pop", type=int, default=500)
    parser.add_argument("--limit", type=int, default=400)
    parser.add_argument("--works", nargs="*")
    args = parser.parse_args()
    if args.probe:
        probe(args.probe)
    elif args.apply:
        apply(args.min_pop, args.limit, args.works)
    else:
        parser.print_help()
