# Lumen Studio Flow v0.2.82

完全免费、为爱发电的本地 AI 绘画工作台。Electron + ComfyUI + Anima，本地优先，不上传素材。

## 本地 AI 提速：关闭 Qwen3 的「思考」

Qwen3 系模型默认会先输出一段思考再回答，在本地提示词编译场景纯属浪费：

```text
关闭前：一次编译 ~900 token（其中一半是思考）
关闭后：~450 token
```

现在对 Qwen 系模型自动在 system 消息末尾追加 `/no_think`，外部 API 分支同样处理。

## 模型 A/B 实测（RTX 4070 SUPER 12GB，均走 CUDA）

```text
                        厌战x2      柴郡x2      芙莉莲        总耗时
当前 9B (Q4_K_M)        PASS 7.0s   PASS 5.9s   PASS 5.5s     18.3s
Qwen3-8B-abliterated    PASS 6.7s   PASS 6.2s   FAIL 5.2s     18.1s
```

结论：

```text
- 两者在 GPU 上速度几乎一样（约 6 秒/次，83 tok/s）
- 8B 在冷门角色上反而更弱（芙莉莲识别为空），没有换的理由
- 之前「AI 很慢」的真正原因是 llama-server 跑在 CPU 上（--n-gpu-layers 0），
  软件默认参数是 99（GPU），生成前还会 stopLlm() 让出显存
```

## 提醒

```text
不要在软件之外手动常驻一个 llama-server：
软件检测到 8091 已在监听会直接复用，于是一直跑在那个实例上（可能是 CPU 模式）。
需要释放显存时用界面里的「释放本地 AI」，或直接关掉软件。
```

## 安装

1. 运行 `Lumen-Studio-Flow-Setup-0.2.82.exe`
2. 首次启动自动部署 ComfyUI + Python + Anima Base + Qwen3 + VAE

GitHub：https://github.com/7ather-LX/lumen-studio-flow
