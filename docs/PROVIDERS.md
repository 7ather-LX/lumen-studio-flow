# 本地与外部 API

Flow 的默认原则：**本地优先，不消耗积分**。

```text
默认：ComfyUI + Anima，本机 GPU/CPU
可选：外部图片 API，适合没有本地大模型的机器
```

## 本地模式

- 不需要账号
- 不按张计费
- 没有云端排队
- 生成图、提示词、模型都在本机
- 需要 ComfyUI + Anima 模型

## 外部 API 模式

在设置里切换：

```text
运行方式 -> 外部 API
```

请求格式：

```http
POST {apiUrl}/images/generations
Authorization: Bearer {apiKey}
Content-Type: application/json

{
  "model": "...",
  "prompt": "...",
  "n": 1,
  "size": "1024x1024"
}
```

Flow 会解析：

- `data[].b64_json`
- `data[].url`

并保存到本机作品库。

## 预设

| 预设 | URL | 模型 |
| --- | --- | --- |
| OpenAI Images | https://api.openai.com/v1 | gpt-image-1 |
| 硅基流动 | https://api.siliconflow.cn/v1 | Kwai-Kolors/Kolors |
| 智谱 CogView | https://open.bigmodel.cn/api/paas/v4 | cogview-3-flash |
| 火山方舟 Seedream | https://ark.cn-beijing.volces.com/api/v3 | doubao-seedream-3-0-t2i-250415 |
| MiniMax | https://api.minimax.chat/v1 | image-01 |

不是所有平台都完全兼容 OpenAI Images 协议；如果 404/参数错误，以平台文档为准。

## 隐私

- API Key 保存在本机 `config.json`
- Flow 本身没有云端中转
- 只有切换到外部 API 时，提示词才会发送到对应平台
- 本地模式不会上传提示词或图片

## 免费/开源替代

不想用外部 API、又跑不动 Anima 时：

- 降低分辨率/步数
- 用 ComfyUI 的低显存模式
- 换更小的动漫模型
- 用 CPU 慢慢跑

Flow 不会因为本地生成而收取积分。
