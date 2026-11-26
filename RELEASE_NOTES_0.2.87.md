# Lumen Studio Flow v0.2.87

完全免费、为爱发电的本地 AI 绘画工作台。Electron + ComfyUI + Anima，本地优先，不上传素材。

## 贝尔法斯特三张图的问题：猫耳、异瞳、多余角色

这次的现象都能对上：三张图像是**柴郡**（猫耳 + 橙蓝异瞳），而不是贝尔法斯特；
第二、三张还出现了其他角色的小头像。根因是提示词里混进了角色本身没有的特征与多余角色。

### 修复 1：按角色设定禁用「不存在的特征」

```text
角色库事实里没有的特征，会自动进「禁用表」并强制压制：
  animal ears / cat ears / fox ears / wolf ears / horse ears /
  cat tail / tail / kemonomimi / horns / heterochromia

生成时（main 进程，确定性执行）：
  从正向提示词里删掉这些标签
  写进负面提示词最前面
```

所以即使提示词被某处带进了 `cat ears`，也不会真的长猫耳。

### 修复 2：点击不符设定的标签会提醒

```text
在 NSFW 标签面板点「兽耳」时，如果角色库显示该角色没有兽耳
→ 弹提示「这个特征与该角色设定不符」，仍允许你写（你说了算），但不再默默生效
```

### 修复 3：多余角色——重试后仍多人则裁到主体

```text
原有：出图后数人 → 多人自动重跑（最多 2 次）
新增：重跑后仍然多于 1 人 → 自动裁到画面主体（最大人物框）
      元数据记录 croppedToSubject / cropBox
      单人请求基本不会再出现「旁边多几个人」
```

### 修复 4：异瞳兜底再收紧

```text
库事实只有一种瞳色时，正向提示词里其它瞳色一律删除并写进负面
（贝尔法斯特 → 只保留 blue eyes）
```

## 回归测试

```text
node scripts/qa-prompts.cjs   →  10/10 通过
```

## 安装

1. 运行 `Lumen-Studio-Flow-Setup-0.2.87.exe`
2. 首次启动自动部署 ComfyUI + Python + Anima Base + Qwen3 + VAE

GitHub：https://github.com/7ather-LX/lumen-studio-flow
