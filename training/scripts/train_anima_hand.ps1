param(
  [string]$Kohya = "F:\DSH WORKSPACE\kohya-src\kohya-ss-sd-scripts-cb70b96",
  [string]$Python = "F:\DSH WORKSPACE\.venv-train\Scripts\python.exe",
  [int]$Epochs = 10,
  [int]$Rank = 32,
  [int]$BlocksToSwap = 8
)

$ErrorActionPreference = "Stop"
$root = "F:\DSH WORKSPACE\lumen-flow"

if (-not (Test-Path $Python)) { throw "Training venv missing: $Python" }
if (-not (Test-Path (Join-Path $Kohya "anima_train_network.py"))) { throw "Anima trainer missing under $Kohya" }

& $Python -c "import torch; assert torch.cuda.is_available(), 'CUDA torch not available'; print(torch.__version__, torch.cuda.get_device_name(0))"

Push-Location $Kohya
try {
  & $Python -m accelerate.commands.launch `
    --num_cpu_threads_per_process 4 `
    anima_train_network.py `
    --pretrained_model_name_or_path="$root\models\diffusion_models\anima-base-v1.0.safetensors" `
    --qwen3="$root\models\text_encoders\qwen_3_06b_base.safetensors" `
    --vae="$root\models\vae\qwen_image_vae.safetensors" `
    --t5_tokenizer_path="$Kohya\configs\t5_old" `
    --dataset_config="$root\training\configs\anima_hand_dataset.toml" `
    --output_dir="$root\training\output\anima_hand" `
    --output_name="hand_anima_v1" `
    --save_model_as=safetensors `
    --network_module=networks.lora_anima `
    --network_dim=$Rank `
    --network_alpha=16 `
    --network_train_unet_only `
    --learning_rate=1e-4 `
    --optimizer_type="AdamW" `
    --lr_scheduler="cosine" `
    --lr_warmup_steps=50 `
    --timestep_sampling="sigmoid" `
    --discrete_flow_shift=1.0 `
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
  if ($LASTEXITCODE -ne 0) { throw "Anima training failed with exit code $LASTEXITCODE" }
} finally {
  Pop-Location
}

Write-Host "Done: $root\training\output\anima_hand\hand_anima_v1.safetensors"


