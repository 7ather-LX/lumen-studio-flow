param(
  [Parameter(Mandatory=$true)][string]$Style,
  [string]$Root = "F:\DSH WORKSPACE\lumen-flow",
  [int]$Epochs = 1,
  [int]$Rank = 16,
  [int]$BlocksToSwap = 8,
  [int]$Repeats = 5,
  [string]$Kohya = "F:\DSH WORKSPACE\kohya-src\kohya-ss-sd-scripts-cb70b96",
  [string]$Python = "F:\DSH WORKSPACE\.venv-train\Scripts\python.exe"
)

$ErrorActionPreference = "Stop"
$config = Join-Path $Root "training\configs\anima_bilibili_$Style.toml"
$output = Join-Path $Root "training\output\bilibili_$Style"
@"
[general]
enable_bucket = true
bucket_no_upscale = true
caption_extension = ".txt"

[[datasets]]
batch_size = 1
resolution = [512, 768]

[[datasets.subsets]]
image_dir = "F:/DSH WORKSPACE/lumen-flow/training/dataset/images/$Style"
num_repeats = $Repeats
caption_extension = ".txt"
"@ | Set-Content -LiteralPath $config -Encoding utf8
& $Python -c "from pathlib import Path; p=Path(r'$config'); p.write_text(p.read_text(encoding='utf-8-sig'),encoding='utf-8')"

Push-Location $Kohya
try {
  & $Python -m accelerate.commands.launch `
    --num_cpu_threads_per_process 4 `
    anima_train_network.py `
    --pretrained_model_name_or_path="$Root\models\diffusion_models\anima-base-v1.0.safetensors" `
    --qwen3="$Root\models\text_encoders\qwen_3_06b_base.safetensors" `
    --vae="$Root\models\vae\qwen_image_vae.safetensors" `
    --t5_tokenizer_path="$Kohya\configs\t5_old" `
    --dataset_config="$config" `
    --output_dir="$output" `
    --output_name="bilibili_${Style}_anima_v1" `
    --save_model_as=safetensors `
    --network_module=networks.lora_anima `
    --network_dim=$Rank `
    --network_alpha=16 `
    --network_train_unet_only `
    --learning_rate=1e-4 `
    --optimizer_type="AdamW" `
    --lr_scheduler="cosine" `
    --lr_warmup_steps=30 `
    --timestep_sampling="sigmoid" `
    --max_train_epochs=$Epochs `
    --save_every_n_epochs=1 `
    --mixed_precision="bf16" `
    --gradient_checkpointing `
    --cache_latents `
    --cache_text_encoder_outputs `
    --vae_chunk_size=64 `
    --vae_disable_cache `
    --qwen_image_vae_2d `
    --blocks_to_swap=$BlocksToSwap `
    --max_data_loader_n_workers=2 `
    --seed=20261119
  if ($LASTEXITCODE -ne 0) { throw "training failed for $Style" }
} finally {
  Pop-Location
}
Write-Host "Done: $output/bilibili_${Style}_anima_v1.safetensors"
