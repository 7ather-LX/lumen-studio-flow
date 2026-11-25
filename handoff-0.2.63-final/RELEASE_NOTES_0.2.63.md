# Lumen Studio Flow v0.2.63

完全免费、为爱发电的本地 AI 绘画工作台。Electron + ComfyUI + Anima，本地优先，不上传素材。

## AI 输出质量：又修了 7 处

你给的三个测试我逐条复现，问题分为「模型乱写」和「库数据错」两类，分别处理。

```text
1. 画风一律 2.5D
   默认改为 anima base：style 留空，prompt 不再堆 2.5D 词；
   只有用户明确说画风才用对应词块。

2. 明日香出现两个角色 tag
   prompt 里同时有 souryuu asuka langley 与 asuka langley shikinami（TV 版 vs 新剧场版）
   现在：库内角色 tag 只保留一个，同角色的变体写法也会被清掉。

3. 作品名臆造（eva: evangelion）
   有角色库命中时，work 一律用库里的 canonical work；没命中则保留模型输出。

4. 负面封杀角色本人服装（plugsuit / red bodysuit / interface headset）
   现在：库里的角色特征标签与负面冲突时，从负面里删掉；
   服装类同义词（bodysuit / plugsuit）整体豁免。

5. prompt 与 negative 同词冲突（brown hair 两边都有）
   现在：prompt 里出现的词如果在负面里，直接删掉。

6. 非人形主体被写 1girl / detailed hair / detailed hands
   现在：无人称主体自动去掉人类专属细节与人数词。

7. 混入其他作品角色（怪物猎人 → hunter (bloodborne)）
   根因是匹配规则太松：库里「猎人 (血源诅咒)」的 zh 前缀「猎人」命中了用户输入的「怪物猎人」。
   现在：中文片段只在 ≥3 字时才参与匹配，2 字通用词不算。
```

## 角色库数据修正

```text
souryuu asuka langley
  作品原来错写成 "goddess of victory: nikke" → 改为 neon genesis evangelion
  发色标签里多余的 brown hair 清掉，补 red bodysuit / 中文名
新增 asuka langley shikinami（新剧场版明日香）
  之前库里没有，导致「EVA 明日香」要么匹配不到、要么匹配到错的版本
hunter (bloodborne)
  中文名从「猎人」改为「血源猎人」，避免再被「怪物猎人」误命中
```

## 三个用例的最终结果

```text
刻晴    44 标签 / 风格空（anima base）/ 紫发紫瞳 / 无冲突
明日香  39 标签 / work=neon genesis evangelion / 橙发蓝瞳 / 负面不再封 plugsuit
奇怪龙  42 标签 / solo（非人形）/ 无血源猎人 / 无 1girl
```

## 安装

1. 运行 `Lumen-Studio-Flow-Setup-0.2.63.exe`
2. 首次启动自动部署 ComfyUI + Python + Anima Base + Qwen3 + VAE

GitHub：https://github.com/7ather-LX/lumen-studio-flow
