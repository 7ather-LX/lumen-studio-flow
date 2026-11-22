# Bilibili Library — Morning Report

## Crawl

```text
300 / 300 columns
2548 images
66 artists
```

Archived:

```text
training/_archive/bilibili_reference_images_20261120.zip
```

## Classification

```text
flat_cel   2137
2_5d_semi   195
moe_2d       20
manga       196
unknown       0
```

Applied:

- title/style keywords
- same-artist style propagation
- game CG / guidebook fallback to 2.5D
- idol/anime collections fallback to flat cel

577 images were fallback-classified as `flat_cel` and marked `fallback=true` for manual review.

## Grouped style LoRAs

```text
bilibili_flat_cel_anima_v1     200 images
bilibili_2_5d_semi_anima_v1    109 images
bilibili_moe_2d_anima_v1        13 images
```

## Flow presets

```text
B站精选赛璐珞
B站精选2.5D
B站精选萌系
```

## GitHub

Release v0.2.6:

- Setup
- Portable
- Source
- training share
- LoRA pack
- Bilibili library/report

No original images.

## Remaining

- 577 unknown images need manual review
- Bilibili moe/2.5D LoRAs still need more clean samples
- toe/foot and stocking texture unresolved
