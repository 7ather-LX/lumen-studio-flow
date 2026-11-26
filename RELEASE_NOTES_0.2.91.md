# Lumen Studio Flow v0.2.91

完全免费、为爱发电的本地 AI 绘画工作台。Electron + ComfyUI + Anima，本地优先，不上传素材。

## 角色外观库：覆盖率 21%，并修掉 697 处发色冲突

### 新增「继承」：换装版本自动沿用本体外观

扩充库里大量条目是**同一角色的不同皮肤/换装**（如 `belfast (iridescent rosa) (azur lane)`）：

```text
规则：把 xxx (装扮) (作品) 还原成 xxx (作品)，从基础库继承外观
只继承：发色 / 发型 / 瞳色 / 身材 / 兽耳尾巴 / 光环，不继承衣服
结果：补全 1225 条
```

### 全库审计结果

```text
总条目 15990，有外观 3358（21.0%）
有外观但缺发色：1
有外观但缺瞳色：51
发色多色冲突（无双色/挑染标注）：697 → 已修正为保留第一个发色
```

修正示例：

```text
博丽灵梦  brown + black   → 保留 brown
魂魄妖梦  white + grey    → 保留 white
藤原妹红  white + grey    → 保留 white
玛修      pink + purple   → 保留 pink
```

### 仍需你补的部分

```text
剩下 12632 条只有名字（大多是 danbooru 冷门条目）。
发送这些角色时会提示「外观未收录」，你可以：
  1. 设置页 → 角色外观库 → 写一条（永久生效，存 %APPDATA%\Lumen Studio Flow\character-appearance.json）
  2. 或直接上传角色参考图
```

## 设置页：角色外观库（0.2.90 起）

```text
输入角色名（中文或英文 tag）+ 外观标签 → 保存
列表可查看 / 删除
生成时优先于内置库，main 进程的特征判定也读这份数据
```

## 回归

```text
qa-prompts 10/10    qa-traits 6/6
```

## 安装

1. 运行 `Lumen-Studio-Flow-Setup-0.2.91.exe`
2. 首次启动自动部署 ComfyUI + Python + Anima Base + Qwen3 + VAE

GitHub：https://github.com/7ather-LX/lumen-studio-flow
