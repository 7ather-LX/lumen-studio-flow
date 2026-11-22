# Lumen Studio Flow v0.2.4

批量出图、训练数据分享、人体结构 LoRA、2.5D 扩量。

## 默认一次 3 张

生成数量默认改为：

```text
3 张
```

仍然可以手动调到 1–4 张。

## 人体结构 / 丝袜 / 足部

新增：

```text
anatomy_anima_v1.safetensors
anatomy_study_style
```

训练数据：

- 9 张安全裁切参考
- 足部、丝袜、腿部
- 3 epoch

## 2.5D 扩量

2.5D 数据：

```text
57 张公共安全参考
+ 5 张 B 站专栏参考
= 62 张
```

训练：

```text
25d_anima_v2
+ 1 epoch（62 张）
= 25d_anima_v3
```

## 训练数据分享

发布包新增：

```text
training-share-v0.2.4.zip
loras-share-v0.2.4.zip
```

包含：

- captions
- manifest
- 训练配置
- 训练脚本
- 评估报告
- B 站目录
- 训练好的 LoRA

不包含：

- 原始参考图
- 用户私图
- B 站/Pixiv 原图
- 模型本体
- ComfyUI 本体

## 本地 AI

Flow 默认：

```text
engine: local
ComfyUI: http://127.0.0.1:8188
```

使用本机 GPU，不依赖外部 API。

## 床上柴郡

新增 3 张固定 seed 变体：

```text
cheshire-final-bed-v4a/b/c.png
```

问题：

- 丝袜纹理仍不足
- 脚趾数量仍可能错误
- 需要更多正确 5 趾参考和足部专用训练，不能只靠 prompt

## B 站目录

```text
300 个专栏
```

分类结果仍需人工复核；B 站接口限流时只保留标题/摘要分类。

## 下载

不包含原图、模型、ComfyUI、成人内容。


## Windows 安装包

新增：

```text
Lumen-Studio-Flow-Setup-0.2.4.exe
```

安装时：

- 可选择安装目录
- 自动建立桌面快捷方式
- 自动建立开始菜单快捷方式
- 默认当前用户安装，不需要管理员权限

便携版仍然保留，但不会自动创建桌面快捷方式。
