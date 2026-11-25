# Lumen Studio Flow v0.2.66

完全免费、为爱发电的本地 AI 绘画工作台。Electron + ComfyUI + Anima，本地优先，不上传素材。

## 修复：单人生成却出现一群角色

你给的 Silence Suzuka 用例里，画面正前方是目标角色，背后挤满了其他马娘。

查证过程：

```text
1. 代码里没有「自动挂角色参考」的逻辑（只有你手动选角色/拖图时才挂）
2. 把参考库 187 张 + 角色目录 7 张全部用姿态模型逐张数人：
   疑似多人 8 张，其中 7 张是特写误判（肢体被识别成第二个人），
   只有 1 张是真的重复拼图 —— 所以库里并没有群像参考图
3. 真正原因：提示词写了 1girl / solo，但负面里只有模糊的「2 girls」，
   压不住「umamusume」这类自带群像倾向的题材
```

修复（生成侧硬约束）：

```text
提示词含 solo / 1girl / 1boy 时，自动注入：
  2girls, 2boys, multiple girls, multiple boys, crowd, group,
  character sheet, multiple views, duplicate, extra person, background characters
不再依赖模型自己写「2 girls」这种不规范写法。
```

## 新增：参考图「裁单人」

参考库每张卡片新增「裁单人」按钮：

```text
检测：本地姿态模型数人（IOU 去重）
多人：裁出主体单人（外扩 14% / 12%），原图备份到 _archive\ref-orig\
单人：直接提示「已经是单人了」，不做改动
```

这样你从 Wiki / 设定集拿到合影时，可以一键裁成单角色再挂参考。

## 关于库本身

审计结果：194 张里只有 1 张是真的重复拼图（ref_seed_033），其余「多人」都是特写误判。
所以这次没有批量改你的参考图——只在需要时手动裁切，避免误伤。

## 安装

1. 运行 `Lumen-Studio-Flow-Setup-0.2.66.exe`
2. 首次启动自动部署 ComfyUI + Python + Anima Base + Qwen3 + VAE

GitHub：https://github.com/7ather-LX/lumen-studio-flow
