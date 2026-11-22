# 导入 AI 姿势 / 服装参考库

来源：[anhao/ai-pose-gallery-zh](https://github.com/anhao/ai-pose-gallery-zh)

## 版权边界

该仓库：

```text
代码 / 构建文件：MIT
img/、thumbs/、data/ 图片与原始数据：原作者所有，非 MIT，仅限个人学习与非商业参考
```

Lumen Studio Flow 不把图库图片打进 GitHub 安装包，也不重新分发图片。

## 只导入元数据

把仓库放到本地任意目录，然后：

```powershell
python scripts/import_pose_gallery.py --source "D:\ai-pose-gallery-zh"
```

输出：

```text
references/pose-gallery-import/catalog.json
```

包含：

```text
姿势、服装、人像、中国历代服装
分类、中文名、标签、英文关键词、原始缩略图路径
```

## 同时复制缩略图

仅在你有权保留这些图片时使用：

```powershell
python scripts/import_pose_gallery.py --source "D:\ai-pose-gallery-zh" --copy-thumbs
```

输出会包含：

```text
references/pose-gallery-import/thumbs/pose/
references/pose-gallery-import/thumbs/costume/
references/pose-gallery-import/thumbs/portrait/
```

## 不要做

```text
不要把图片打进 GitHub Release
不要倒卖
不要重新分发
不要移除原作者署名
```

原作者与维护者：

- 原始姿势 / 服装 / 人像：ギア（@giaaibusi）
- 中文整理与工程：Anhao
- 二次元服装：たき AI / CharaDB
