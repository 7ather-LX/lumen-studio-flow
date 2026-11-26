# Lumen Studio Flow v0.2.79

完全免费、为爱发电的本地 AI 绘画工作台。Electron + ComfyUI + Anima，本地优先，不上传素材。

## 修复：高清化报 ReferenceError: sharpened is not defined

v0.2.78 引入「高清化后强化细节」时，我把代码插到了错误的函数里。

```text
main.cjs 里有两处 await fsp.copyFile(files[0].path, outPath)：
  L2073  属于 repairRegion（局部修正）
  L2264  属于 upscaleImage（高清化）
我的替换命中了第一处（repairRegion），于是：
  - let sharpened 声明在 repairRegion 里
  - 元数据里的 sharpened 却在 upscaleImage 用
  → 高清化一执行就 ReferenceError
```

修复：

```text
1. 删除误插在 repairRegion 的强化块（局部修正不该被这件事影响）
2. 按「函数定位」而不是「首次字符串匹配」插入：
   先找到 async function upscaleImage( 的位置，再找该函数内的 copyFile，
   把强化块插在它后面
3. 校验：let sharpened 与使用它的元数据同属 upscaleImage（已确认）
```

## 顺带说明

修复方式从「全局字符串替换」改成「先定位函数、再在函数内部替换」，这次的验证也按函数归属来查：

```text
L2258 let sharpened = false;       → 属于 upscaleImage
L2285 sharpened,                   → 属于 upscaleImage
L1318 function enhanceDetail(...)  → 定义存在
```

## 高清化现在的完整链路

```text
读原图 → 上传 → UpscaleModelLoader → ImageUpscaleWithModel →
ImageScale(lanczos) → SaveImage →
【新增】enhance-detail.py：USM 锐化 + 边缘增强 + 对比/饱和微调 →
写元数据（upscaled=true / sharpened=true / 倍率 / 引擎 / 尺寸）
```

## 安装

1. 运行 `Lumen-Studio-Flow-Setup-0.2.79.exe`
2. 首次启动自动部署 ComfyUI + Python + Anima Base + Qwen3 + VAE

GitHub：https://github.com/7ather-LX/lumen-studio-flow
