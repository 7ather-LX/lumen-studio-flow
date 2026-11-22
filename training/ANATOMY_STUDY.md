# Anatomy Study Dataset

用途：脚部、手部、丝袜、布料、姿势结构。只接收非露骨裁切图。

## 目录

```text
training/inbox/anatomy_study/batch_*/
training/dataset/images/anatomy_study/
```

## 标签

```text
anatomy_study
trigger: anatomy_study_style
```

## 入库

软件左下角：

```text
训练素材 -> 人体/手部/脚部
```

或命令行：

```powershell
.venv\Scripts\python.exe training\scripts\ingest_batch.py `
  --artist local --style anatomy_study --batch 01 --files <cropped images>
```

## 清洗和 caption

```powershell
.venv\Scripts\python.exe training\scripts\curate_style_dataset.py
.venv\Scripts\python.exe training\scripts\caption_style_dataset.py `
  --only-label anatomy_study --trigger anatomy_study_style
```

## 训练

```powershell
Set-ExecutionPolicy -Scope Process Bypass -Force
.\training\scripts\train_anima_anatomy.ps1 -Epochs 3 -Rank 16
```

## 参考要求

- 5 趾清晰
- 脚掌/脚背/脚踝结构
- 手部指节
- 丝袜网纹、接缝、脚趾处受力
- 床单/裙摆/布料褶皱
- 非露骨、已裁切
