# Lumen Studio Flow v0.2.95

完全免费、为爱发电的本地 AI 绘画工作台。Electron + ComfyUI + Anima，本地优先，不上传素材。

## 三张图全错：两个根因

### 根因 1：提示词里的 `white hair` 盖过了库数据

我给你的那串提示词里写了 `white hair`（当时库数据还是错的）。
软件只在你手写提示词时才不管库——**库从来没参与过生成**。

修复：生成时强制注入角色库外观

```text
main 进程匹配提示词里的角色 → 取出库中外观标签 →
  1. 删掉与之冲突的发色（你写 white hair，库里是 blue hair → 删 white hair）
  2. 删掉冲突的瞳色
  3. 补齐缺失的外观（blue hair / blue eyes / large breasts …）插在角色 tag 之后
未知角色不动；齐刘海/服装/姿势等其它标签保持原样
```

单测（scripts/qa-appearance.cjs，5/5）：

```text
PASS 恰巴耶夫：提示词白发 → 库内蓝发
PASS 恰巴耶夫：缺外观     → 自动补 blue hair / blue eyes / large breasts
PASS 贝尔法斯特：红瞳     → 改成蓝瞳
PASS 未知角色             → 不改动
PASS 服装姿势标签         → 不被破坏
```

### 根因 2：多人没有被压住

```text
单人请求时，负向词自动加重：
  multiple girls:1.35, 2girls:1.35, crowd:1.25,
  background characters:1.25, character sheet:1.2
```

另外补上肢体缺陷负面（多腿/融合肢体是预览模型常见问题）：

```text
extra legs, extra limbs, fused limbs, malformed limbs, missing legs, conjoined
```

## 恰巴耶夫数据（已修正）

```text
blue hair, long hair, blue eyes, large breasts
中文名：恰巴耶夫
```

## 回归

```text
qa-prompts 10/10    qa-appearance 5/5    qa-traits 6/6
```

## 下一步建议

以前那串提示词可以继续用，`white hair` 会被自动改掉。要验证库生效，看「作品详情」里的提示词：
如果里面是 `blue hair`，说明注入生效了。

## 安装

1. 运行 `Lumen-Studio-Flow-Setup-0.2.95.exe`
2. 首次启动自动部署 ComfyUI + Python + Anima Base + Qwen3 + VAE

GitHub：https://github.com/7ather-LX/lumen-studio-flow
