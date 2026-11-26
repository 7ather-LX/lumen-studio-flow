# Lumen Studio Flow v0.2.89

完全免费、为爱发电的本地 AI 绘画工作台。Electron + ComfyUI + Anima，本地优先，不上传素材。

## 厌战被画成「蓝发双马尾」：根因是库里有名字没有外观

审计结果：

```text
基础库 2452 条：2130 条有外观标签，322 条只有名字
扩充库 13538 条：0 条有外观标签 ← 全部只有名字
```

厌战（warspite (azur_lane)）正好落在扩充库里，所以模型只拿到一个名字，
外观全靠自由发挥，于是画出了蓝发双马尾。

## 修复 1：写进权威设定（厌战）

依据萌娘百科「碧蓝航线:厌战」页面（金发、紫瞳、围巾、手套、无下装、白丝、贫乳）：

```text
warspite (azur_lane) →
  1girl, blonde hair, long hair, purple eyes, flat chest,
  scarf, white gloves, white pantyhose, military uniform,
  epaulettes, no skirt, hairband, mini crown
```

## 修复 2：外观未收录时不再「悄悄乱画」

```text
角色事实里没有外观标签时：
  1. 事实文本改为 MISSING_ATTRIBUTES 明确指令：禁止编造发色/瞳色/服装
  2. 发送时弹提示：
     「该角色的外观未收录在本地库，生成结果可能与其官方设定有偏差；
       建议上传角色参考图。」
```

也就是说：能查到的角色按库设定画；查不到的会**提前告诉你**，而不是生成后再发现错了。

## 关于自动补全：我试过，但放弃了

试了从公开图库（Konachan）反推外观标签：

```text
厌战 → 金发 + 紫瞳 + 兽耳 + 双马尾（兽耳是错的）
贝尔法斯特 → 白毛/灰毛 + 红瞳/紫瞳 + 双马尾（红瞳、双马尾都是错的）
```

原因是同作品多人图会把别的角色的发色瞳色带进来，即使加 solo 过滤也不干净。
**这种数据补进去比空着更糟**，所以只保留人工核对过的条目。

## 后续怎么补角色

```text
优先补你在用的角色：把角色名发我，我用萌娘百科/官方立绘核对后写进库；
批量补全需要一个可靠数据源，目前没有比人工核对更稳的办法。
```

## 安装

1. 运行 `Lumen-Studio-Flow-Setup-0.2.89.exe`
2. 首次启动自动部署 ComfyUI + Python + Anima Base + Qwen3 + VAE

GitHub：https://github.com/7ather-LX/lumen-studio-flow
