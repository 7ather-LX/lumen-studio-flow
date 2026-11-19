"use strict";

const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");

let mainWindow = null;
let comfyProcess = null;
let comfyLog = null;

const DEFAULT_CONFIG = {
  engine: "local",
  comfyUrl: "http://127.0.0.1:8188",
  comfyDir: "F:\\DSH WORKSPACE\\lumen-flow\\comfy",
  pythonExe: "",
  modelMode: "anima",
  checkpoint: "",
  unet: "anima-base-v1.0.safetensors",
  clip: "qwen_3_06b_base.safetensors",
  vae: "qwen_image_vae.safetensors",
  lora: "",
  loraStrength: 1,
  refAdapterName: "anima_ref_adapter_v2_r64.safetensors",
  steps: 30,
  cfg: 4,
  hires: false,
  hiresScale: 1.5,
  hiresSteps: 10,
  faceDetail: false,
  faceSteps: 8,
  apiUrl: "https://api.openai.com/v1",
  apiModel: "gpt-image-1",
  apiKey: "",
};

function dataRoot() {
  return path.join(app.getPath("appData"), "Lumen Studio Flow");
}

function outputDir() {
  return path.join(dataRoot(), "outputs");
}

function configPath() {
  return path.join(dataRoot(), "config.json");
}

function ensureDirs() {
  fs.mkdirSync(outputDir(), { recursive: true });
}

function readConfig() {
  ensureDirs();
  try {
    return { ...DEFAULT_CONFIG, ...JSON.parse(fs.readFileSync(configPath(), "utf8")) };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

function writeConfig(patch) {
  ensureDirs();
  const next = { ...readConfig(), ...patch };
  fs.writeFileSync(configPath(), JSON.stringify(next, null, 2), "utf8");
  return next;
}

function send(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, payload);
  }
}

function normalizeComfyDir(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const candidates = [raw, path.join(raw, "ComfyUI_windows_portable")];
  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, "ComfyUI", "main.py"))) return candidate;
    if (fs.existsSync(path.join(candidate, "main.py"))) return candidate;
  }
  return raw;
}

async function comfyFetch(base, route, options = {}, timeout = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(`${base.replace(/\/$/, "")}${route}`, {
      ...options,
      signal: controller.signal,
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`ComfyUI ${response.status}: ${text.slice(0, 500)}`);
    }
    return response;
  } finally {
    clearTimeout(timer);
  }
}

async function health(config) {
  try {
    const response = await comfyFetch(config.comfyUrl, "/system_stats", {}, 5000);
    const data = await response.json();
    return {
      ok: true,
      devices: data.devices || [],
      system: data.system || {},
      url: config.comfyUrl,
    };
  } catch (error) {
    return { ok: false, error: error?.message || String(error), url: config.comfyUrl };
  }
}

async function listModels() {
  const config = readConfig();
  const info = await comfyFetch(config.comfyUrl, "/object_info", {}, 20000).then((response) => response.json());
  const options = (node, input) => {
    const required = info?.[node]?.input?.required?.[input];
    const first = Array.isArray(required) ? required[0] : null;
    return Array.isArray(first) ? first.filter((value) => typeof value === "string") : [];
  };
  return {
    checkpoints: options("CheckpointLoaderSimple", "ckpt_name"),
    unets: options("UNETLoader", "unet_name"),
    clips: options("CLIPLoader", "clip_name"),
    vaes: options("VAELoader", "vae_name"),
    loras: options("LoraLoaderModelOnly", "lora_name"),
  };
}

function previewWorkflow(payload) {
  const config = readConfig();
  const built = buildWorkflow(config, payload);
  return {
    workflow: built.workflow,
    meta: {
      modelMode: config.modelMode,
      checkpoint: config.checkpoint,
      seed: built.seed,
      width: built.width,
      height: built.height,
    },
  };
}

async function startComfy() {
  const config = readConfig();
  const root = normalizeComfyDir(config.comfyDir);
  const embeddedPython = path.join(root, "python_embeded", "python.exe");
  const python = config.pythonExe && fs.existsSync(config.pythonExe) ? config.pythonExe : embeddedPython;
  const portableScript = path.join(root, "ComfyUI", "main.py");
  const sourceScript = path.join(root, "main.py");
  const script = fs.existsSync(portableScript) ? portableScript : sourceScript;
  if (!fs.existsSync(python) || !fs.existsSync(script)) {
    throw new Error(`Cannot find ComfyUI: ${root}\nSelect the folder containing ComfyUI.`);
  }
  if (comfyProcess && !comfyProcess.killed) {
    return { ok: true, running: true, reused: true };
  }
  const logPath = path.join(dataRoot(), "comfyui.log");
  comfyLog = fs.createWriteStream(logPath, { flags: "a" });
  comfyLog.write(`\n\n=== ${new Date().toISOString()} start ===\n`);
  const args = [
    script,
    "--listen",
    "127.0.0.1",
    "--port",
    new URL(config.comfyUrl).port || "8188",
    "--preview-method",
    "none",
  ];
  const extra = path.join(root, "extra_model_paths.yaml");
  if (fs.existsSync(extra)) args.push("--extra-model-paths-config", extra);
  comfyProcess = spawn(python, args, {
    cwd: root,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  comfyProcess.stdout.pipe(comfyLog);
  comfyProcess.stderr.pipe(comfyLog);
  comfyProcess.on("exit", (code) => {
    comfyLog?.write(`=== exited ${code} ===\n`);
    comfyProcess = null;
  });
  for (let index = 0; index < 90; index += 1) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const status = await health(config);
    if (status.ok) return { ok: true, running: true, status };
  }
  throw new Error("ComfyUI request failed");
}

function buildWorkflow(config, payload, initImageName = "") {
  const width = Math.max(256, Math.min(2048, Number(payload.width) || 1024));
  const height = Math.max(256, Math.min(2048, Number(payload.height) || 1024));
  const steps = Math.max(1, Math.min(80, Number(payload.steps) || config.steps || 30));
  const cfg = Math.max(1, Math.min(20, Number(payload.cfg) || config.cfg || 4));
  const batch = Math.max(1, Math.min(4, Number(payload.batch) || 1));
  const hires = Boolean(payload.hires);
  const hiresScale = Math.max(1.1, Math.min(2, Number(payload.hiresScale) || config.hiresScale || 1.5));
  const hiresSteps = Math.max(4, Math.min(30, Number(payload.hiresSteps) || config.hiresSteps || 10));
  const seed = Number.isFinite(Number(payload.seed)) && Number(payload.seed) >= 0
    ? Math.floor(Number(payload.seed))
    : Math.floor(Math.random() * 2 ** 31);
  const prompt = String(payload.prompt || "").trim();
  const negative = String(payload.negative || "worst quality, low quality, blurry, jpeg artifacts").trim();
  if (!prompt) throw new Error("Prompt is empty");

  const useCheckpoint = config.modelMode === "checkpoint" && config.checkpoint;
  const workflow = {};
  let modelRef;
  let clipRef;
  let vaeRef;
  if (useCheckpoint) {
    workflow[1] = { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: config.checkpoint } };
    modelRef = ["1", 0];
    clipRef = ["1", 1];
    vaeRef = ["1", 2];
  } else {
    workflow[1] = {
      class_type: "UNETLoader",
      inputs: { unet_name: config.unet, weight_dtype: "default" },
    };
    workflow[2] = {
      class_type: "CLIPLoader",
      inputs: { clip_name: config.clip, type: "stable_diffusion", device: "default" },
    };
    workflow[3] = {
      class_type: "VAELoader",
      inputs: { vae_name: config.vae },
    };
    modelRef = ["1", 0];
    clipRef = ["2", 0];
    vaeRef = ["3", 0];
  }
  workflow[4] = {
    class_type: "CLIPTextEncode",
    inputs: { text: prompt, clip: clipRef },
  };
  workflow[5] = {
    class_type: "CLIPTextEncode",
    inputs: { text: negative, clip: clipRef },
  };
  workflow[6] = {
    class_type: "EmptyLatentImage",
    inputs: { width, height, batch_size: batch },
  };
  workflow[7] = {
    class_type: "KSampler",
    inputs: {
      model: modelRef,
      positive: ["4", 0],
      negative: ["5", 0],
      latent_image: ["6", 0],
      seed,
      steps,
      cfg,
      sampler_name: "euler",
      scheduler: "simple",
      denoise: 1,
    },
  };
  workflow[8] = {
    class_type: "VAEDecode",
    inputs: { samples: ["7", 0], vae: vaeRef },
  };
  workflow[9] = {
    class_type: "SaveImage",
    inputs: { images: ["8", 0], filename_prefix: "LumenFlow" },
  };

  if (initImageName && payload.referenceMode === "ref-adapter" && !useCheckpoint) {
    workflow[30] = { class_type: "LoadImage", inputs: { image: initImageName } };
    workflow[33] = {
      class_type: "AnimaRefAdapter",
      inputs: {
        model: modelRef,
        vae: vaeRef,
        image: ["30", 0],
        lora_name: config.refAdapterName || "anima_ref_adapter_v2_r64.safetensors",
        ref_guidance: 4.5,
        correction: "apg",
        strength: 1,
        ref_end: 0.85,
        ref_megapixels: 1,
      },
    };
    workflow[7].inputs.model = ["33", 0];
    modelRef = ["33", 0];
  } else if (initImageName) {
    workflow[30] = { class_type: "LoadImage", inputs: { image: initImageName } };
    workflow[31] = {
      class_type: "ImageScale",
      inputs: {
        image: ["30", 0],
        upscale_method: "lanczos",
        width,
        height,
        crop: "center",
      },
    };
    workflow[32] = {
      class_type: "VAEEncode",
      inputs: { pixels: ["31", 0], vae: vaeRef },
    };
    workflow[7].inputs.latent_image = ["32", 0];
    workflow[7].inputs.denoise = Math.max(0.2, Math.min(0.8, Number(payload.denoise) || 0.45));
  }
  if (config.lora) {
    const strength = Math.max(0, Math.min(2, Number(config.loraStrength) || 1));
    if (useCheckpoint) {
      workflow[10] = {
        class_type: "LoraLoader",
        inputs: {
          model: modelRef,
          clip: clipRef,
          lora_name: config.lora,
          strength_model: strength,
          strength_clip: strength,
        },
      };
      modelRef = ["10", 0];
      clipRef = ["10", 1];
      workflow[4].inputs.clip = clipRef;
      workflow[5].inputs.clip = clipRef;
    } else {
      workflow[10] = {
        class_type: "LoraLoaderModelOnly",
        inputs: { model: modelRef, lora_name: config.lora, strength_model: strength },
      };
      modelRef = ["10", 0];
    }
    workflow[7].inputs.model = modelRef;
  }
  if (hires) {
    workflow[20] = {
      class_type: "LatentUpscaleBy",
      inputs: {
        samples: ["7", 0],
        upscale_method: "nearest-exact",
        scale_by: hiresScale,
      },
    };
    workflow[21] = {
      class_type: "KSampler",
      inputs: {
        model: modelRef,
        positive: ["4", 0],
        negative: ["5", 0],
        latent_image: ["20", 0],
        seed,
        steps: hiresSteps,
        cfg,
        sampler_name: "euler",
        scheduler: "simple",
        denoise: 0.35,
      },
    };
    workflow[22] = {
      class_type: "VAEDecode",
      inputs: { samples: ["21", 0], vae: vaeRef },
    };
    workflow[9].inputs.images = ["22", 0];
  }
  return {
    workflow,
    seed,
    width: Math.round(width * (hires ? hiresScale : 1)),
    height: Math.round(height * (hires ? hiresScale : 1)),
    steps: steps + (hires ? hiresSteps : 0),
    cfg,
    batch,
    hires,
  };
}

async function runComfy(payload) {
  const config = readConfig();
  let status = await health(config);
  if (!status.ok) {
    send("flow:progress", { stage: "Working...", progress: 0 });
    await startComfy();
    status = await health(config);
  }
  if (!status.ok) throw new Error("ComfyUI request failed");

  let initImageName = "";
  if (payload.initImage) {
    send("flow:progress", { stage: "Uploading reference...", progress: 0.01 });
    initImageName = await uploadDataUrl(config, payload.initImage);
  }
  const built = payload.customWorkflow && typeof payload.customWorkflow === "object"
    ? {
        workflow: payload.customWorkflow,
        seed: Number(payload.seed) || 0,
        width: Number(payload.width) || 1024,
        height: Number(payload.height) || 1024,
      }
    : buildWorkflow(config, payload, initImageName);
  const clientId = `lumen-flow-${Date.now()}`;
  send("flow:progress", { stage: "Working...", progress: 0.02, seed: built.seed });
  const submit = await comfyFetch(
    config.comfyUrl,
    "/prompt",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: built.workflow, client_id: clientId }),
    },
    20000,
  ).then((response) => response.json());
  if (submit?.error) throw new Error(JSON.stringify(submit.error));
  const promptId = submit.prompt_id;
  if (!promptId) throw new Error("ComfyUI request failed");

  let entry = null;
  const started = Date.now();
  for (let index = 0; index < 600; index += 1) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const response = await comfyFetch(config.comfyUrl, `/history/${promptId}`, {}, 8000);
    const history = await response.json();
    entry = history?.[promptId];
    if (entry) {
      if (entry.status?.status_str === "error") {
        throw new Error("ComfyUI request failed");
      }
      break;
    }
    if (Date.now() - started > 15 * 60 * 1000) throw new Error("ComfyUI request failed");
    send("flow:progress", {
      stage: "Working...",
      progress: Math.min(0.95, 0.06 + (index / 600) * 0.9),
    });
  }
  if (!entry) throw new Error("ComfyUI request failed");

  const images = [];
  for (const output of Object.values(entry.outputs || {})) {
    for (const image of output.images || []) {
      const query = new URLSearchParams({
        filename: image.filename,
        subfolder: image.subfolder || "",
        type: image.type || "output",
      });
      const response = await comfyFetch(config.comfyUrl, `/view?${query.toString()}`, {}, 30000);
      const buffer = Buffer.from(await response.arrayBuffer());
      const name = `flow-${Date.now()}-${images.length + 1}.png`;
      const filePath = path.join(outputDir(), name);
      await fsp.writeFile(filePath, buffer);
      images.push({
        name,
        path: filePath,
        url: `data:image/png;base64,${buffer.toString("base64")}`,
      });
    }
  }
  if (payload.faceDetail && images.length) {
    try {
      images[0] = await detailFace(
        config,
        images[0].path,
        built.width,
        built.height,
        String(payload.prompt || ""),
      );
    } catch (error) {
      send("flow:progress", {
        stage: `Face detailer skipped: ${error?.message || error}`,
        progress: 0.98,
      });
    }
  }
  send("flow:progress", { stage: "Working...", progress: 1 });
  return { images, seed: built.seed, promptId, width: built.width, height: built.height };
}

async function uploadComfyImage(config, filePath) {
  const buffer = await fsp.readFile(filePath);
  const form = new FormData();
  form.append("image", new Blob([buffer], { type: "image/png" }), path.basename(filePath));
  form.append("overwrite", "true");
  const response = await comfyFetch(
    config.comfyUrl,
    "/upload/image",
    { method: "POST", body: form },
    30000,
  );
  const data = await response.json();
  return data.name || data.filename || path.basename(filePath);
}

async function uploadDataUrl(config, dataUrl) {
  const match = /^data:image\/[a-z0-9.+-]+;base64,(.+)$/i.exec(String(dataUrl || ""));
  if (!match) throw new Error("Reference image is not a data URL");
  const buffer = Buffer.from(match[1], "base64");
  const inputDir = path.join(dataRoot(), "inputs");
  fs.mkdirSync(inputDir, { recursive: true });
  const filePath = path.join(inputDir, `reference-${Date.now()}.png`);
  await fsp.writeFile(filePath, buffer);
  return uploadComfyImage(config, filePath);
}

function buildFaceWorkflow(config, imageName, width, height, prompt) {
  const faceWidth = Math.max(128, Math.round(width * 0.55));
  const faceHeight = Math.max(128, Math.round(height * 0.42));
  const x = Math.max(0, Math.round((width - faceWidth) / 2));
  const y = Math.max(0, Math.round(height * 0.04));
  return {
    1: { class_type: "LoadImage", inputs: { image: imageName } },
    2: {
      class_type: "ImageCrop",
      inputs: { image: ["1", 0], width: faceWidth, height: faceHeight, x, y },
    },
    3: {
      class_type: "ImageScale",
      inputs: { image: ["2", 0], upscale_method: "lanczos", width: 512, height: 512, crop: "disabled" },
    },
    4: { class_type: "UNETLoader", inputs: { unet_name: config.unet, weight_dtype: "default" } },
    5: {
      class_type: "CLIPLoader",
      inputs: { clip_name: config.clip, type: "stable_diffusion", device: "default" },
    },
    6: { class_type: "VAELoader", inputs: { vae_name: config.vae } },
    7: {
      class_type: "CLIPTextEncode",
      inputs: { text: `${prompt}, detailed face, symmetrical eyes, sharp eyes`, clip: ["5", 0] },
    },
    8: {
      class_type: "CLIPTextEncode",
      inputs: { text: "blurry face, asymmetric eyes, deformed face, text, watermark", clip: ["5", 0] },
    },
    9: { class_type: "VAEEncode", inputs: { pixels: ["3", 0], vae: ["6", 0] } },
    10: {
      class_type: "KSampler",
      inputs: {
        model: ["4", 0],
        positive: ["7", 0],
        negative: ["8", 0],
        latent_image: ["9", 0],
        seed: Math.floor(Math.random() * 2 ** 31),
        steps: Math.max(4, Math.min(20, Number(config.faceSteps) || 8)),
        cfg: 4,
        sampler_name: "euler",
        scheduler: "simple",
        denoise: 0.35,
      },
    },
    11: { class_type: "VAEDecode", inputs: { samples: ["10", 0], vae: ["6", 0] } },
    14: {
      class_type: "SolidMask",
      inputs: { value: 1, width: 512, height: 512 },
    },
    15: {
      class_type: "FeatherMask",
      inputs: { mask: ["14", 0], left: 32, top: 32, right: 32, bottom: 32 },
    },
    12: {
      class_type: "ImageCompositeMasked",
      inputs: { destination: ["1", 0], source: ["11", 0], x, y, resize_source: false, mask: ["15", 0] },
    },
    13: { class_type: "SaveImage", inputs: { images: ["12", 0], filename_prefix: "LumenFace" } },
    _crop: { width: faceWidth, height: faceHeight, x, y },
  };
}

async function detailFace(config, imagePath, width, height, prompt) {
  const imageName = await uploadComfyImage(config, imagePath);
  const built = buildFaceWorkflow(config, imageName, width, height, prompt);
  delete built._crop;
  send("flow:progress", { stage: "Face detailer...", progress: 0.7 });
  const response = await comfyFetch(
    config.comfyUrl,
    "/prompt",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: built, client_id: `lumen-face-${Date.now()}` }),
    },
    20000,
  ).then((item) => item.json());
  if (response?.error) throw new Error(JSON.stringify(response.error));
  const promptId = response.prompt_id;
  let entry = null;
  for (let index = 0; index < 300; index += 1) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const history = await comfyFetch(config.comfyUrl, `/history/${promptId}`, {}, 8000).then((item) => item.json());
    entry = history?.[promptId];
    if (entry) break;
    if (index > 240) throw new Error("Face detailer timeout");
  }
  const output = Object.values(entry?.outputs || {}).flatMap((item) => item.images || [])[0];
  if (!output) throw new Error("Face detailer returned no image");
  const query = new URLSearchParams({
    filename: output.filename,
    subfolder: output.subfolder || "",
    type: output.type || "output",
  });
  const finalResponse = await comfyFetch(config.comfyUrl, `/view?${query.toString()}`, {}, 30000);
  const buffer = Buffer.from(await finalResponse.arrayBuffer());
  const filePath = path.join(outputDir(), `flow-${Date.now()}-face.png`);
  await fsp.writeFile(filePath, buffer);
  return { name: path.basename(filePath), path: filePath, url: `data:image/png;base64,${buffer.toString("base64")}` };
}

function apiSize(width, height) {
  const ratio = width / height;
  if (ratio > 1.2) return "1792x1024";
  if (ratio < 0.85) return "1024x1792";
  return "1024x1024";
}

async function runApi(payload) {
  const config = readConfig();
  if (!config.apiUrl || !config.apiKey) {
    throw new Error("API mode needs an endpoint and API key in Settings.");
  }
  const width = Math.max(256, Math.min(2048, Number(payload.width) || 1024));
  const height = Math.max(256, Math.min(2048, Number(payload.height) || 1024));
  const batch = Math.max(1, Math.min(4, Number(payload.batch) || 1));
  const prompt = String(payload.prompt || "").trim();
  if (!prompt) throw new Error("Prompt is empty");
  const endpoint = /\/images\/generations$/i.test(config.apiUrl)
    ? config.apiUrl
    : `${config.apiUrl.replace(/\/$/, "")}/images/generations`;
  send("flow:progress", { stage: "Requesting external image API...", progress: 0.1 });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 180000);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.apiModel,
        prompt,
        n: batch,
        size: apiSize(width, height),
      }),
      signal: controller.signal,
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`API ${response.status}: ${text.slice(0, 600)}`);
    }
    const data = await response.json();
    const items = Array.isArray(data.data) ? data.data : [];
    if (!items.length) throw new Error("API returned no images");
    const images = [];
    for (const item of items) {
      let buffer;
      if (item.b64_json) {
        buffer = Buffer.from(item.b64_json, "base64");
      } else if (item.url) {
        const imageResponse = await fetch(item.url, { signal: controller.signal });
        if (!imageResponse.ok) throw new Error(`API image download ${imageResponse.status}`);
        buffer = Buffer.from(await imageResponse.arrayBuffer());
      } else {
        continue;
      }
      const name = `api-${Date.now()}-${images.length + 1}.png`;
      const filePath = path.join(outputDir(), name);
      await fsp.writeFile(filePath, buffer);
      images.push({
        name,
        path: filePath,
        url: `data:image/png;base64,${buffer.toString("base64")}`,
      });
    }
    if (!images.length) throw new Error("API returned no usable image data");
    send("flow:progress", { stage: "Done", progress: 1 });
    return { images, seed: 0, width, height, api: true };
  } finally {
    clearTimeout(timer);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1380,
    height: 900,
    minWidth: 1040,
    minHeight: 700,
    backgroundColor: "#090b0a",
    title: "Lumen Studio Flow",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });
  mainWindow.loadFile(path.join(__dirname, "renderer", "index.html"));
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  ensureDirs();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (comfyProcess && !comfyProcess.killed) {
    try {
      comfyProcess.kill();
    } catch {
      // ignore
    }
  }
});

ipcMain.handle("flow:config:get", () => readConfig());
ipcMain.handle("flow:config:set", (_event, patch) => writeConfig(patch));
ipcMain.handle("flow:health", () => health(readConfig()));
ipcMain.handle("flow:models", () => listModels());
ipcMain.handle("flow:workflow:preview", (_event, payload) => previewWorkflow(payload));
ipcMain.handle("flow:start", async () => startComfy());
ipcMain.handle("flow:generate", async (_event, payload) => {
  const config = readConfig();
  return config.engine === "api" ? runApi(payload) : runComfy(payload);
});

ipcMain.handle("flow:choose-dir", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
    title: "Select ComfyUI folder",
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle("flow:list-outputs", async () => {
  ensureDirs();
  const names = (await fsp.readdir(outputDir()))
    .filter((name) => /\.(png|jpe?g|webp)$/i.test(name))
    .sort()
    .reverse()
    .slice(0, 30);
  const items = [];
  for (const name of names) {
    const filePath = path.join(outputDir(), name);
    const stat = await fsp.stat(filePath);
    const buffer = await fsp.readFile(filePath);
    const ext = path.extname(name).slice(1);
    items.push({
      name,
      path: filePath,
      mtime: stat.mtimeMs,
      url: `data:image/${ext === "jpg" ? "jpeg" : ext};base64,${buffer.toString("base64")}`,
    });
  }
  return items;
});

ipcMain.handle("flow:reveal", async (_event, target) => {
  if (typeof target === "string" && fs.existsSync(target)) shell.showItemInFolder(target);
  return true;
});

ipcMain.handle("flow:open-external", async (_event, url) => {
  if (typeof url === "string" && /^https?:\/\//.test(url)) await shell.openExternal(url);
  return true;
});

