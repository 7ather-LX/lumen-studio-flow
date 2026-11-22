import comfy.model_detection

# Store the original UNet config detection function
orig_detect_unet_config = comfy.model_detection.detect_unet_config

def patched_detect_unet_config(state_dict, key_prefix, metadata=None):
    try:
        dit_config = orig_detect_unet_config(state_dict, key_prefix, metadata)
    except Exception as e:
        raise e

    try:
        if dit_config is not None and dit_config.get("image_model") == "anima":
            max_block = -1
            prefix = f"{key_prefix}blocks."

            # Scan keys to detect actual block count
            for k in state_dict.keys():
                if k.startswith(prefix):
                    parts = k[len(prefix):].split(".")
                    if parts and parts[0].isdigit():
                        max_block = max(max_block, int(parts[0]))

            if max_block != -1:
                actual_blocks = max_block + 1
                if actual_blocks != dit_config.get("num_blocks"):
                    print(f"[Anima 2.9B Patch] Dynamically patching Anima blocks from {dit_config.get('num_blocks')} to {actual_blocks}")
                    dit_config["num_blocks"] = actual_blocks
    except Exception as patch_err:
        print(f"[Anima 2.9B Patch] Warning: Failed to apply dynamic block patch: {patch_err}")

    return dit_config

# Apply patch
try:
    comfy.model_detection.detect_unet_config = patched_detect_unet_config
    print("[Anima 2.9B Patch] Successfully loaded ComfyUI model patch.")
except Exception as init_err:
    print(f"[Anima 2.9B Patch] Error: Failed to load ComfyUI model patch: {init_err}")

# ComfyUI Custom Node registrations
NODE_CLASS_MAPPINGS = {}
NODE_DISPLAY_NAME_MAPPINGS = {}
