"use strict";

// 局部精修工作流（脚部 / 手部）。
// 纯函数模块：不依赖 electron，可用 node 直接调用做离线验证。
// 由 main.cjs 引用，renderer 通过 payload.detailRegion / payload.detailPart 传参。

const REGION_PRESETS = {
  bottom: { label: "下半部", x: 0.1, y: 0.45, w: 0.8, h: 0.5 },
  middle: { label: "中部", x: 0.1, y: 0.25, w: 0.8, h: 0.5 },
  top: { label: "上半部", x: 0.1, y: 0.04, w: 0.8, h: 0.5 },
  left: { label: "左侧", x: 0.02, y: 0.2, w: 0.58, h: 0.6 },
  right: { label: "右侧", x: 0.4, y: 0.2, w: 0.58, h: 0.6 },
};

const PART_PROMPTS = {
  feet: {
    positive:
      "detailed toes, exactly five toes per foot, correct toe order, big toe on inner side, even toe spacing, toenails aligned, clean foot anatomy, detailed sole, realistic feet",
    negative:
      "extra toes, six toes, missing toes, fused toes, merged toes, detached toe, wrong toe order, deformed foot, bad feet",
  },
  hands: {
    positive:
      "detailed hands, exactly five fingers per hand, correct finger order, thumb on inner side, even knuckle spacing, fingernails aligned, clean hand anatomy, realistic hands",
    negative:
      "extra fingers, six fingers, missing fingers, fused fingers, merged fingers, detached thumb, wrong finger order, deformed hand, bad hands",
  },
  both: {
    positive:
      "detailed toes, exactly five toes per foot, correct toe order, detailed hands, exactly five fingers per hand, clean hand and foot anatomy",
    negative:
      "extra toes, six toes, fused toes, extra fingers, six fingers, fused fingers, deformed feet, deformed hands, bad anatomy",
  },
};

function align8(value) {
  const n = Math.round(Number(value) / 8) * 8;
  return Math.max(8, n);
}

function regionFor(mode, width, height, zoom = 1) {
  const preset = REGION_PRESETS[mode] || REGION_PRESETS.bottom;
  const scale = Math.max(0.2, Math.min(1, Number(zoom) || 1));
  let w = Math.min(width, align8(width * preset.w * scale));
  let h = Math.min(height, align8(height * preset.h * scale));
  // 围绕基础区域中心收缩，保证放大倍数提升而中心不变
  const baseCx = (preset.x + preset.w / 2) * width;
  const baseCy = (preset.y + preset.h / 2) * height;
  const x = Math.max(0, Math.min(width - w, align8(baseCx - w / 2)));
  const y = Math.max(0, Math.min(height - h, align8(baseCy - h / 2)));
  return { x, y, width: w, height: h };
}

function fitTarget(region) {
  const ratio = region.width / region.height;
  let tw = 1024;
  let th = align8(tw / ratio);
  if (th > 1024) {
    th = 1024;
    tw = align8(th * ratio);
  }
  return { width: tw, height: th };
}

function buildDetailWorkflow(options) {
  const {
    config,
    imageName,
    width,
    height,
    prompt,
    negative,
    seed,
    steps,
    cfg,
    denoise,
    region = "bottom",
    part = "feet",
    zoom = 1,
    filenamePrefix = "LumenDetail",
  } = options;
  const area = regionFor(region, width, height, zoom);
  const target = fitTarget(area);
  const feather = Math.max(24, align8(Math.min(area.width, area.height) * 0.14));
  const partPrompt = PART_PROMPTS[part] || PART_PROMPTS.feet;
  const positive = [prompt, partPrompt.positive].filter(Boolean).join(", ");
  const negativeAll = [negative, partPrompt.negative].filter(Boolean).join(", ");

  const workflow = {
    1: { class_type: "LoadImage", inputs: { image: imageName } },
    2: {
      class_type: "ImageCrop",
      inputs: { image: ["1", 0], width: area.width, height: area.height, x: area.x, y: area.y },
    },
    3: {
      class_type: "ImageScale",
      inputs: {
        image: ["2", 0],
        upscale_method: "lanczos",
        width: target.width,
        height: target.height,
        crop: "disabled",
      },
    },
    4: { class_type: "UNETLoader", inputs: { unet_name: config.unet, weight_dtype: "default" } },
    5: {
      class_type: "CLIPLoader",
      inputs: { clip_name: config.clip, type: "stable_diffusion", device: "default" },
    },
    6: { class_type: "VAELoader", inputs: { vae_name: config.vae } },
    7: { class_type: "CLIPTextEncode", inputs: { text: positive, clip: ["5", 0] } },
    8: { class_type: "CLIPTextEncode", inputs: { text: negativeAll, clip: ["5", 0] } },
    9: { class_type: "VAEEncode", inputs: { pixels: ["3", 0], vae: ["6", 0] } },
    10: {
      class_type: "KSampler",
      inputs: {
        model: ["4", 0],
        positive: ["7", 0],
        negative: ["8", 0],
        latent_image: ["9", 0],
        seed,
        steps,
        cfg,
        sampler_name: "er_sde",
        scheduler: "simple",
        denoise,
      },
    },
    11: { class_type: "VAEDecode", inputs: { samples: ["10", 0], vae: ["6", 0] } },
    16: {
      class_type: "ImageScale",
      inputs: {
        image: ["11", 0],
        upscale_method: "lanczos",
        width: area.width,
        height: area.height,
        crop: "disabled",
      },
    },
    14: { class_type: "SolidMask", inputs: { value: 1, width: area.width, height: area.height } },
    15: {
      class_type: "FeatherMask",
      inputs: { mask: ["14", 0], left: feather, top: feather, right: feather, bottom: feather },
    },
    12: {
      class_type: "ImageCompositeMasked",
      inputs: {
        destination: ["1", 0],
        source: ["16", 0],
        x: area.x,
        y: area.y,
        resize_source: false,
        mask: ["15", 0],
      },
    },
    13: { class_type: "SaveImage", inputs: { images: ["12", 0], filename_prefix: filenamePrefix } },
  };

  return { workflow, area, target: target, feather, positive, negative: negativeAll };
}

module.exports = { REGION_PRESETS, PART_PROMPTS, align8, regionFor, fitTarget, buildDetailWorkflow };
