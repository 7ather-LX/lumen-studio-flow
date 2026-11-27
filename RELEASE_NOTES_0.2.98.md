# Lumen Studio Flow v0.2.98

完全免费、为爱发电的本地 AI 绘画工作台。Electron + ComfyUI + Anima，本地优先，不上传素材。

## 全流程审计：19 项检查，修掉 3 个真问题

新增 `scripts/qa-flow.cjs`，把整条链路的关键不变量写成自动检查（现在 19/19 通过）：

```text
1  清洗顺序：sanitize → 外观注入 → 特征禁用 → 反群像
2  生成结果返回生效后的 prompt / negative
3  元数据记录生效提示词，并保留 rawPrompt
4  性能档不再覆盖步数/CFG
5  元数据包含 batch / hires / totalSteps
6  所有画面尺寸都是 64 的倍数
7  单人时负向自动加权反群像
8  单人检测使用生效提示词
9  仍多人时裁到主体
10 标签面板只认手动
11 外观注入 + 特征禁用都在主进程
12 画廊使用缩略图
13 作品按修改时间倒序
14 元数据与图片同名写出
15 ComfyUI 未启动会自动拉起
16 生成有 15 分钟超时
17 取消按钮有 IPC
18 运行时/输出/参考库路径不写死盘符
19 无 NVIDIA 时自动装 CPU torch 并提示
```

### 修复 1：详情页显示的不是真正送出的提示词

```text
之前：元数据存 payload.prompt（你粘进来的原始文本，含 JSON/错误发色）
现在：存 built.prompt / built.negative（清洗+外观注入后的最终提示词）
      同时保留 rawPrompt 方便对照
```

所以你以后在详情页看到的，就是模型真正收到的内容。

### 修复 2：生成过程无法取消

```text
之前：点生成只能等，最长 15 分钟
现在：生成中按钮变成「取消生成」，点一下发送 /interrupt + 清空队列
      轮询里检测到取消会立刻中止并提示
```

### 修复 3：16:9 尺寸不是 64 的倍数

```text
之前：1216 × 688（688 / 64 = 10.75）→ 部分模型会报错或自动改尺寸
现在：1344 × 768（都整除 64）
```

## 上一版（0.2.97）的提示词清洗一并生效

```text
粘进来的 AI JSON → 拆成正向/负向，不再把 "2girls" 当正向词
正向夹带 negative: 段 → 截断
1girl 与 2girls 冲突 → 保留单人
单人声明下多个角色 → 只留第一个
```

## 测试总览

```text
qa-flow       19/19
qa-prompts    10/10
qa-appearance  5/5
qa-traits      6/6
qa-sanitize    6/6
合计 46 项自动检查
```

## 安装

1. 运行 `Lumen-Studio-Flow-Setup-0.2.98.exe`
2. 首次启动自动部署 ComfyUI + Python + Anima Base + Qwen3 + VAE

GitHub：https://github.com/7ather-LX/lumen-studio-flow
