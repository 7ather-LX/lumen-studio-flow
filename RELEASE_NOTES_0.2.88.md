# Lumen Studio Flow v0.2.88

完全免费、为爱发电的本地 AI 绘画工作台。Electron + ComfyUI + Anima，本地优先，不上传素材。

## 为什么上一版没生效：检测器看不到背景小人

你那张图里背景有一整排人脸，但姿态模型在 640 分辨率下**只认出了 1 个人**
（小头像不构成完整人形框），于是「多人重跑」「裁到主体」这两条防线从来没触发。

修复分三层：

### ① 多人检测升级（多尺度）

```text
全图 640 检测 + 2x2 放大分块检测（抓背景小人）
分块里被边缘切断的框丢弃（避免把同一个人的局部算成第二个人）
同量级且互相包含的框合并，明显更小的框保留（背景人头要计数）
```

实测：

```text
你的群像图        1 人 → 5 人（能触发重跑/裁切）
普通单人图        3 人 → 1 人（不再误报）
群像测试图        9 人（正常）
```

### ② 特征禁用下沉到主进程（手写提示词也生效）

以前只有「AI 编译器 → 填入创作区」这条路径会计算禁用特征，手写提示词就漏了。

```text
现在 main 进程直接读取角色库，按提示词里的角色匹配：
  - 猫耳/兽耳/马耳/兔耳/精灵耳
  - 尾巴、角、异瞳
  角色本人没有的特征 → 从正向提示词删除 + 写进负面最前面
兼容写法：fake animal ears / horse ears / cat tail / kemonomimi / pointy ears
```

### ③ 新增特征单测

```text
scripts/qa-traits.cjs
PASS 贝尔法斯特 + cat ears        → 判定「无耳」，禁用
PASS 柴郡 + fake animal ears      → 判定「有耳」，放行
PASS 贝尔法斯特 + heterochromia   → 判定「无异瞳」，禁用
PASS 刻晴                         → 无耳无尾，禁用
PASS 无角色提示词                  → 不做限制
6/6 通过
```

## 当前双重回归

```text
node scripts/qa-prompts.cjs  → 10/10
node scripts/qa-traits.cjs   → 6/6
```

## 安装

1. 运行 `Lumen-Studio-Flow-Setup-0.2.88.exe`
2. 首次启动自动部署 ComfyUI + Python + Anima Base + Qwen3 + VAE

GitHub：https://github.com/7ather-LX/lumen-studio-flow
