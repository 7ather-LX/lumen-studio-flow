# Lumen Studio Flow v0.2.86

完全免费、为爱发电的本地 AI 绘画工作台。Electron + ComfyUI + Anima，本地优先，不上传素材。

## 贝尔法斯特测试：4 个问题修完，并补了系统性回归测试

你怀疑「这类问题是通病」是对的。我把它写成了 10 条自动回归用例（`scripts/qa-prompts.cjs`），
跑一遍就能发现同类问题，而不是等你逐个撞出来。

### 修复 1：负向提示词里的词不再点亮 NSFW 标签

```text
规则：某标签只要出现在「负向提示词」里，面板就绝不点亮它
      （正向、负向同时存在时也不点亮，避免误以为是自己选的）
底部「提示词中已包含 N 个标签」的汇总同样排除负向词
```

### 修复 2：prompt 里的 `undefined`（之前只清了 character）

```text
现在 prompt / negative / character 三处都清理 undefined、null、none、n/a
```

### 修复 3：非人形角色被写 1girl

```text
库事实里出现 creature / quadruped / dragon / monster / robot 等，或事实本身没有 1girl/1boy 时
→ 删除 1girl / 1boy / 2girls / solo 与人类专属细节（detailed hair / hands / skin）
实测：罗三炮 → 不再出现 1girl
```

### 修复 4：AI 输出自带水彩 / 笔触类词

```text
以前只在生成层压制，AI 输出仍带 watercolor / painterly / brush strokes / messy lines
现在 AI 后处理也删掉，并写进负面（用户明确要水彩时除外）
```

### 顺带（v0.2.85 的改动一并发布）

```text
- 用户给出 lying / sitting / 躺 / 坐 等姿势时，删除 standing / hands on hips / akimbo
  并把用户「角色姿势：…」标签提到角色 tag 之后
- 室内词表扩充：客厅 / 沙发 / 餐厅 / living room / sofa / couch
  命中后删除 tree / leaves / dappled sunlight / sunlight / blue sky / forest / beach
- 瞳色唯一：库里有明确瞳色时，删除其它瞳色（贝尔法斯特 → 只留 blue eyes）
- 角色库数据修复：345 条多重瞳色且无 heterochromia 的条目只保留第一个瞳色
- NSFW 面板不再高亮通用词（standing / full body / from side / long hair …）
- 默认画面比例 1:1 → 3:4（896×1152），默认张数 3 张
- 默认风格补充表现力词：professional illustration / dynamic composition /
  depth of field / vibrant colors / high contrast / detailed eyes
```

## 回归测试（10/10 通过）

```text
PASS 室内不出现户外光          PASS 单人请求不出现多人
PASS 躺姿不保留站立            PASS 双人请求保留 2girls 且无 solo
PASS 瞳色不冲突（贝尔法斯特）   PASS 未提及角色被剔除
PASS 剔除 undefined            PASS 正向与负面不冲突
PASS 非人形不写 1girl          PASS 水彩凌乱词被压制
```

以后每次发版前我都会先跑这套用例。

## 安装

1. 运行 `Lumen-Studio-Flow-Setup-0.2.86.exe`
2. 首次启动自动部署 ComfyUI + Python + Anima Base + Qwen3 + VAE

GitHub：https://github.com/7ather-LX/lumen-studio-flow
