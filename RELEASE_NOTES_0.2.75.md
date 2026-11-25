# Lumen Studio Flow v0.2.75

完全免费、为爱发电的本地 AI 绘画工作台。Electron + ComfyUI + Anima，本地优先，不上传素材。

## 修复：生成时报 ReferenceError: nsfwOn is not defined

这是 v0.2.71 加打码时的低级错误：

```text
nsfwOn 只在 buildWorkflow() 里声明过
但「出图后自动打码」这段代码在 runComfy() 里，直接引用了 nsfwOn
→ 只要点生成就 ReferenceError，跟 NSFW 开不开无关（你开着也一样失败）
```

修复：

```text
1. 在 runComfy() 里单独计算 nsfwOn（读 payload 或配置，默认 true）
2. 打码整段加固：nsfwOn 计算、成人词判断、每张打码都各自 try/catch
   打码是附加环节，任何异常都不会再影响已经生成好的图片
   —— 宁可这张不打码，也不能让你拿不到图
```

## 顺带说明

我试过引入「变量作用域静态检查」来防这类错误，但粗糙实现的误报太多（把函数参数当成变量声明），
没有意义，所以撤掉了。当前保留的检查是：

```text
node --check   语法必须通过
id 校验        所有 $("#id") 引用的元素必须在 index.html 里
函数校验       所有 addEventListener 引用的函数必须已定义
```

## 安装

1. 运行 `Lumen-Studio-Flow-Setup-0.2.75.exe`
2. 首次启动自动部署 ComfyUI + Python + Anima Base + Qwen3 + VAE

GitHub：https://github.com/7ather-LX/lumen-studio-flow
