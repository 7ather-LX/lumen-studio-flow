# Lumen Studio Flow v0.2.83

完全免费、为爱发电的本地 AI 绘画工作台。Electron + ComfyUI + Anima，本地优先，不上传素材。

## 关于「思考模式」的实测结论：关闭更好

同一组用例（9B Q4，CUDA，同一 system prompt）跑两遍：

```text
                         通过     总耗时    总 token
思考关闭（/no_think）     3/4      22.5s      1,543
思考开启                  1/4     299.0s     21,315
```

原因很直接：思考模式每次要烧 5,000–5,500 token 的推理内容，
把 `max_tokens` 吃光，最终 JSON 被截断 → 反而更容易输出不完整。

**结论：保持关闭**（v0.2.82 起已默认关闭，v0.2.83 沿用）。

```text
关闭方式：system 消息追加 /no_think + chat_template_kwargs.enable_thinking = false
```

## 修复：AI 没写角色 tag 时，角色被补到末尾

柴郡那条输出里，模型压根没写 `cheshire (azur lane)`，后处理才发现并补——但补在了末尾，
还重复堆了 `maid` + `maid headdress`。三处修：

```text
① 角色 tag 紧跟人数词：2girls, cheshire (azur lane), …（不再吊在最后）
② 库特征补入时做包含关系去重：已有 maid headdress 就不再补 maid
③ 室内场景剔除户外光：卧室/床上/室内 → 删掉 under tree / tree shade /
   dappled sunlight / natural sunlight / outdoors / forest / sky 等，
   并把 outdoors 加进负面（AI 和生成层都做一遍）
```

实测（真实模型 + 真实后处理）：

```text
character: cheshire (azur lane)
prompt:    masterpiece, …, 2girls, cheshire (azur lane), maid headdress, …
checks:    有角色 ✔  角色紧跟人数词 ✔  2girls ✔  无 solo ✔  白黑内衣 ✔  无户外光 ✔
```

## 安装

1. 运行 `Lumen-Studio-Flow-Setup-0.2.83.exe`
2. 首次启动自动部署 ComfyUI + Python + Anima Base + Qwen3 + VAE

GitHub：https://github.com/7ather-LX/lumen-studio-flow
