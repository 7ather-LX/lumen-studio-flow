# Lumen Studio Flow v0.2.67

完全免费、为爱发电的本地 AI 绘画工作台。Electron + ComfyUI + Anima，本地优先，不上传素材。

## 修复：参考图「裁单人」不再改动原图

上一版裁单人会把原图替换掉（虽有备份），这对你一张张导入的参考库不合适。

现在改为**非破坏性**：

```text
点「裁单人」→ 检测到多人时，裁出主体单人另存为一条新参考
            名称加后缀「· 单人」，备注写明来源（N 人 → 1 人）
            原文件、原条目、原分类完全不动
检测到单人  → 直接提示，不产生任何文件
```

所以部位参考（足部 / 手部 / 丝袜 / 自定义）即使点了也只会新增副本，不会影响你现有的图。

## 单人硬约束（上一版已加，这里复述）

提示词含 `solo / 1girl / 1boy` 时，自动注入 `2girls, multiple girls, crowd, group, character sheet, duplicate, extra person, background characters` 等负面，
不再依赖模型自己写「2 girls」这种不规范写法。

## 库审计结论（供参考）

```text
194 张（library 187 + characters 7）逐张数人
疑似多人 8 张：7 张是特写误判（肢体被当成第二人），1 张是真重复拼图
→ 你的库基本是干净的单人图，这次没有批量改动任何文件
```

## 安装

1. 运行 `Lumen-Studio-Flow-Setup-0.2.67.exe`
2. 首次启动自动部署 ComfyUI + Python + Anima Base + Qwen3 + VAE

GitHub：https://github.com/7ather-LX/lumen-studio-flow
