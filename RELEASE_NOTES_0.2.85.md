# Lumen Studio Flow v0.2.85

完全免费、为爱发电的本地 AI 绘画工作台。Electron + ComfyUI + Anima，本地优先，不上传素材。

## 贝尔法斯特测试暴露的 5 个问题，全部修复

### ① `"character": "belfast (azur lane), undefined"`

模型自己吐了 `undefined`。现在两处清理：

```text
填入创作区时：删掉 character 里的 undefined / null / none / n/a
聊天显示时：同样清理（不再让用户看到 undefined）
```

### ② 用户要 side-lying，模型却写 standing / hands on hips

```text
现在：用户提到 lying / sitting / kneeling / 躺 / 坐 / 跪 / 趴 时
     删除 standing / hands on hips / akimbo / straight posture / walking / running
     并把这些词加进负面
同时：用户写的「角色姿势：…」标签会被提到角色 tag 后面（权重更靠前）
```

### ③ 场景明明是客厅沙发，却出现 under tree / dappled sunlight

```text
室内词表扩充：客厅 / 沙发 / 餐厅 / living room / sofa / couch …
命中后删除：tree / leaves / dappled sunlight / sunlight / blue sky / forest / beach …
并把 outdoors 加进负面
```

### ④ 一张异瞳、一张兽耳异瞳

根因是**角色库里贝尔法斯特同时写了 blue eyes 和 purple eyes**（历史脏数据）。

```text
数据修复：345 条「多重瞳色且无 heterochromia」的条目，只保留第一个瞳色
         贝尔法斯特 → 只剩 blue eyes；顺带去掉了重复的 maid
后处理兜底：库里有唯一瞳色时，删除 prompt 里其它瞳色并加进负面
```

### ⑤ NSFW 标签面板误亮

面板按提示词自动勾选，但把 `standing / full body / from side / long hair` 这类
**通用词**也点亮了，看起来像「乱勾选」。现在这些通用词不再高亮，只对
服装、动作、表情、场景、人数这类真有意义的标签生效。

## 默认值调整

```text
画面比例默认：1:1 → 3:4（896×1152，更适合人物）
张数默认：3 张（原本就是 3）
默认风格词增强（线条不变，只加表现力）：
  professional illustration, dynamic composition, depth of field,
  vibrant colors, high contrast, detailed eyes
```

## 安装

1. 运行 `Lumen-Studio-Flow-Setup-0.2.85.exe`
2. 首次启动自动部署 ComfyUI + Python + Anima Base + Qwen3 + VAE

GitHub：https://github.com/7ather-LX/lumen-studio-flow
