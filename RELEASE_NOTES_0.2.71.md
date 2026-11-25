# Lumen Studio Flow v0.2.71

完全免费、为爱发电的本地 AI 绘画工作台。Electron + ComfyUI + Anima，本地优先，不上传素材。

## 马赛克策略：关闭打码，开启全开

按你的要求做成两条互斥的硬规则。

### NSFW 关闭

```text
1. 提示词强制加 safe
2. 若提示词含成人关键词（中英双语词表），追加 censored, mosaic censoring
3. 负面追加 nude / nipples / genitals / explicit / uncensored
4. 出图后自动打码：
   用姿态模型定位胸部与胯部（肩-胯-膝关键点推算），
   像素化 + 轻微模糊，一次盖住两处；定位失败则用画面中央带兜底
   打码后改写 json 元数据：censored=true / censorMode / censorBoxes
5. 局部修正（修复/擦除）后同样再次打码，避免修完就“露出来”
```

### NSFW 开启

```text
1. 移除提示词里的 safe
2. 主动清理所有打码相关词：censored / mosaic censoring / bar censor /
   pixelated / pixelation / censor bar / mosaic（正向与负向都清）
3. 反向压制模型自带的打码倾向：负面追加 censored, mosaic censoring, pixelated, censor bar
4. 不做任何后处理，输出原图
```

## 实测

```text
姿态定位：768×1024 直立人像 → 命中胸部与胯部两个框
          胸框 ≈ [301,245,467,451]，胯框 ≈ [270,463,476,602]
打码效果：像素块清晰可辨，不是淡淡一层
兜底路径：检测不到人时使用中央带（胸 20%–48%、胯 52%–80%）
```

## 安装

1. 运行 `Lumen-Studio-Flow-Setup-0.2.71.exe`
2. 首次启动自动部署 ComfyUI + Python + Anima Base + Qwen3 + VAE

GitHub：https://github.com/7ather-LX/lumen-studio-flow
