"use strict";

const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const { spawn, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const fsp = require("node:fs/promises");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

let mainWindow = null;
let comfyProcess = null;
let comfyLog = null;

const LLM_PORT = Number(process.env.LUMEN_LLM_PORT || 8091);
const LLM_BIN = process.env.LUMEN_LLM_BIN || "F:\\novel\\llama-cpp\\llama-server.exe";
const LLM_MODEL = process.env.LUMEN_LLM_MODEL || "F:\\novel\\DeepSeek-V4-Pro-Qwen3.5-9B-UNCENSORED-heretic.Q4_K_M.gguf";
let llmProcess = null;
let llmStartPromise = null;

const LLM_RESPONSE_FORMAT = {
  type: "json_schema",
  json_schema: {
    name: "lumen_prompt",
    schema: {
      type: "object",
      properties: {
        character: { type: "string" },
        work: { type: "string" },
        style: { type: "string" },
        artist: { type: "string" },
        prompt: { type: "string" },
        negative_prompt: { type: "string" },
        notes: { type: "string" },
      },
      required: ["character", "work", "style", "artist", "prompt", "negative_prompt", "notes"],
      additionalProperties: false,
    },
  },
};

const DEFAULT_CONFIG = {
  engine: "local",
  comfyUrl: "http://127.0.0.1:8188",
  comfyDir: "F:\\DSH WORKSPACE\\lumen-flow\\comfy",
  pythonExe: "",
  modelMode: "anima",
  performanceProfile: "auto",
  lowVram: false,
  reserveVram: 1,
  checkpoint: "",
  unet: "anima-base-v1.0.safetensors",
  clip: "qwen_3_06b_base.safetensors",
  vae: "qwen_image_vae.safetensors",
  lora: "",
  loraStrength: 1,
  refAdapterName: "anima_ref_adapter_v2_r64.safetensors",
  steps: 30,
  cfg: 4,
  sampler: "er_sde",
  scheduler: "simple",
  hires: false,
  hiresScale: 1.25,
  hiresSteps: 10,
  faceDetail: false,
  faceSteps: 8,
  apiUrl: "https://api.openai.com/v1",
  apiModel: "gpt-image-1",
  apiKey: "",
  llmMode: "local",
  llmModel: "F:\\novel\\DeepSeek-V4-Pro-Qwen3.5-9B-UNCENSORED-heretic.Q4_K_M.gguf",
  llmBin: "F:\\novel\\llama-cpp\\llama-server.exe",
  llmDevice: "gpu",
  llmApiUrl: "https://api.openai.com/v1",
  llmApiKey: "",
  llmApiModel: "gpt-4o-mini",
  outputDir: "F:\\DSH WORKSPACE\\lumen-flow\\outputs",
  referenceDir: "F:\\DSH WORKSPACE\\lumen-flow\\references\\library",
};

function dataRoot() {
  return path.join(app.getPath("appData"), "Lumen Studio Flow");
}

function outputDir() {
  const config = rawConfig();
  return config.outputDir || DEFAULT_CONFIG.outputDir || path.join(dataRoot(), "outputs");
}

function referenceLibraryRoot() {
  const config = readConfig();
  return config.referenceDir || path.join(__dirname, "..", "references", "library");
}

function referenceLibraryIndex() {
  const file = path.join(referenceLibraryRoot(), "library.json");
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return [];
  }
}

function writeReferenceLibrary(items) {
  const root = referenceLibraryRoot();
  fs.mkdirSync(root, { recursive: true });
  fs.writeFileSync(path.join(root, "library.json"), JSON.stringify(items, null, 2), "utf8");
}

function listReferences() {
  return referenceLibraryIndex().map((item) => ({
    ...item,
    url: pathToFileURL(path.join(referenceLibraryRoot(), item.file)).toString(),
  }));
}

async function addReference(payload) {
  const category = String(payload.category || "style");
  const raw = String(payload.dataUrl || "");
  const match = raw.match(/^data:image\/[a-zA-Z0-9.+-]+;base64,(.+)$/);
  if (!match) throw new Error("Invalid image data");
  const root = referenceLibraryRoot();
  fs.mkdirSync(root, { recursive: true });
  const id = `ref_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const ext = String(payload.name || "").toLowerCase().endsWith(".png") ? ".png" : ".jpg";
  const file = `${id}${ext}`;
  fs.writeFileSync(path.join(root, file), Buffer.from(match[1], "base64"));
  const items = referenceLibraryIndex();
  items.unshift({
    id,
    category,
    categoryType: String(payload.categoryType || ""),
    name: String(payload.name || "reference"),
    file,
    note: String(payload.note || ""),
    createdAt: new Date().toISOString(),
  });
  writeReferenceLibrary(items);
  return listReferences();
}

async function readReferenceData(payload) {
  const item = referenceLibraryIndex().find((entry) => entry.id === payload.id);
  if (!item) throw new Error("Reference not found");
  const bytes = fs.readFileSync(path.join(referenceLibraryRoot(), item.file));
  return `data:image/${item.file.endsWith(".png") ? "png" : "jpeg"};base64,${bytes.toString("base64")}`;
}

function trainingRoot() {
  return path.resolve(process.env.LUMEN_TRAINING_DIR || "F:\\DSH WORKSPACE\\lumen-flow\\training");
}

function ingestTrainingBatch(payload) {
  const commonLabels = new Set([
    "flat_cel", "moe_2d", "2_5d_semi", "anatomy_study", "galgame_3d",
    "hand_study", "foot_study", "fabric_study", "character_ref", "style_ref"
  ]);
  const rawLabel = String(payload?.label || "").trim();
  const customLabel = String(payload?.customLabel || "").trim().toLowerCase();
  const label = customLabel || rawLabel;
  if (!/^[a-z0-9][a-z0-9_-]{1,48}$/.test(label)) {
    throw new Error("素材类型只能使用小写字母、数字、下划线或连字符");
  }
  if (!commonLabels.has(label) && !payload?.customLabel) {
    throw new Error("Unknown training style label");
  }
  const items = Array.isArray(payload?.items) ? payload.items : [];
  if (!items.length) throw new Error("No training images");
  const stamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
  const dir = path.join(trainingRoot(), "inbox", label, `batch_${stamp}`);
  fs.mkdirSync(dir, { recursive: true });
  const rows = [];
  items.slice(0, 40).forEach((item, index) => {
    const match = /^data:image\/([a-z0-9.+-]+);base64,(.+)$/i.exec(String(item?.dataUrl || ""));
    if (!match) return;
    const ext = match[1].toLowerCase() === "jpeg" ? "jpg" : match[1].toLowerCase();
    if (!["png", "jpg", "webp"].includes(ext)) return;
    const buffer = Buffer.from(match[2], "base64");
    if (buffer.length > 30 * 1024 * 1024) return;
    const name = String(item?.name || `image-${index}`).replace(/[^\w.-]+/g, "_").slice(0, 60);
    const file = path.join(dir, `${String(index).padStart(3, "0")}_${name}.${ext}`);
    fs.writeFileSync(file, buffer);
    rows.push({ file, label, name, bytes: buffer.length, source: "flow-intake" });
  });
  if (!rows.length) throw new Error("No valid training images");
  const labelMeta = {
    label,
    displayName: String(payload?.displayName || label),
    trigger: String(payload?.trigger || `${label}_style`),
    description: String(payload?.description || ""),
    common: commonLabels.has(label),
    updatedAt: new Date().toISOString(),
  };
  const labelFile = path.join(trainingRoot(), "labels.json");
  let labels = [];
  try { labels = JSON.parse(fs.readFileSync(labelFile, "utf8")); } catch {}
  labels = labels.filter((entry) => entry.label !== label);
  labels.push(labelMeta);
  fs.writeFileSync(labelFile, JSON.stringify(labels, null, 2), "utf8");
  fs.writeFileSync(path.join(dir, "label.json"), JSON.stringify(labelMeta, null, 2), "utf8");
  fs.writeFileSync(path.join(dir, "batch_manifest.jsonl"), rows.map((row) => JSON.stringify(row)).join("\n") + "\n", "utf8");
  return { ok: true, count: rows.length, dir, label: labelMeta };
}

function configPath() {
  return path.join(dataRoot(), "config.json");
}

function ensureDirs() {
  fs.mkdirSync(outputDir(), { recursive: true });
}

function rawConfig() {
  try {
    return JSON.parse(fs.readFileSync(configPath(), "utf8"));
  } catch {
    return {};
  }
}

function readConfig() {
  ensureDirs();
  try {
    return { ...DEFAULT_CONFIG, ...rawConfig() };
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
  const pythonCandidates = [
    config.pythonExe,
    path.join(root, "python_embeded", "python.exe"),
    path.join(root, ".venv", "Scripts", "python.exe"),
    path.resolve(root, "..", ".venv", "Scripts", "python.exe"),
    path.resolve(root, "..", "..", ".venv", "Scripts", "python.exe"),
    path.join(root, "venv", "Scripts", "python.exe"),
    path.join(root, "python.exe"),
  ].filter(Boolean);
  const python = pythonCandidates.find((candidate) => fs.existsSync(candidate)) || "";
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
  if (config.lowVram) args.push("--lowvram", "--reserve-vram", String(config.reserveVram || 1));
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

function buildWorkflow(config, payload, initImageName = "", characterImageName = "", textureImageName = "") {
  const width = Math.max(256, Math.min(2048, Number(payload.width) || 1024));
  const height = Math.max(256, Math.min(2048, Number(payload.height) || 1024));
  const steps = Math.max(1, Math.min(80, Number(payload.steps) || config.steps || 30));
  const cfg = Math.max(1, Math.min(20, Number(payload.cfg) || config.cfg || 4));
  const batch = Math.max(1, Math.min(10, Number(payload.batch) || 1));
  const hires = Boolean(payload.hires);
  const hiresScale = Math.max(1.1, Math.min(2, Number(payload.hiresScale) || config.hiresScale || 1.5));
  const hiresSteps = Math.max(4, Math.min(30, Number(payload.hiresSteps) || config.hiresSteps || 10));
  const modelMode = String(payload.modelMode || config.modelMode || "anima");
  const checkpoint = String(payload.checkpoint || config.checkpoint || "");
  const useCheckpoint = modelMode === "checkpoint" && checkpoint;
  const samplerName = String(payload.sampler || config.sampler || (useCheckpoint ? "euler" : "er_sde"));
  const schedulerName = String(payload.scheduler || config.scheduler || "simple");
  const seed = Number.isFinite(Number(payload.seed)) && Number(payload.seed) >= 0
    ? Math.floor(Number(payload.seed))
    : Math.floor(Math.random() * 2 ** 31);
  let prompt = String(payload.prompt || "").trim();
  let negative = String(payload.negative || "worst quality, low quality, blurry, jpeg artifacts").trim();
  if (/feet|foot|toes|barefoot|footwear|足|脚|丝袜|裸足/i.test(prompt)) {
    prompt += ", detailed toes, five toes per foot, accurate toe count, clean foot anatomy, detailed soles";
    negative += ", missing toes, extra toes, fused toes, deformed feet, bad feet";
  }
  if (!prompt) throw new Error("Prompt is empty");

  const workflow = {};
  let modelRef;
  let clipRef;
  let vaeRef;
  if (useCheckpoint) {
    workflow[1] = { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: checkpoint } };
    modelRef = ["1", 0];
    clipRef = ["1", 1];
    vaeRef = ["1", 2];
  } else {
    workflow[1] = {
      class_type: "UNETLoader",
      inputs: { unet_name: payload.unet || config.unet, weight_dtype: "default" },
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
      sampler_name: samplerName,
      scheduler: schedulerName,
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
        ref_guidance: Math.max(1, Math.min(10, Number(payload.refGuidance) || 4.5)),
        correction: "apg",
        strength: Math.max(0, Math.min(1.5, Number(payload.refStrength) || 1)),
        ref_end: Math.max(0.2, Math.min(1, Number(payload.refEnd) || 0.85)),
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
    // A single img2img latent otherwise decodes to one image even when batch_size > 1.
    if (batch > 1) {
      workflow[34] = {
        class_type: "RepeatLatentBatch",
        inputs: { samples: ["32", 0], amount: batch },
      };
      workflow[7].inputs.latent_image = ["34", 0];
    }
    // 0.15 = conservative detail repair, 0.9 = deliberate recomposition.
    workflow[7].inputs.denoise = Math.max(0.15, Math.min(0.9, Number(payload.denoise) || 0.45));
  }
  const loraName = payload.lora || config.lora;
  if (loraName) {
    const strength = Math.max(0, Math.min(2, Number(payload.loraStrength ?? config.loraStrength) || 1));
    if (useCheckpoint) {
      workflow[10] = {
        class_type: "LoraLoader",
        inputs: {
          model: modelRef,
          clip: clipRef,
          lora_name: loraName,
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
        inputs: { model: modelRef, lora_name: loraName, strength_model: strength },
      };
      modelRef = ["10", 0];
    }
    workflow[7].inputs.model = modelRef;
  }
  if (characterImageName) {
    workflow[40] = { class_type: "LoadImage", inputs: { image: characterImageName } };
    workflow[41] = {
      class_type: "AnimaRefAdapter",
      inputs: {
        model: modelRef,
        vae: vaeRef,
        image: ["40", 0],
        lora_name: config.refAdapterName || "anima_ref_adapter_v2_r64.safetensors",
        ref_guidance: Math.max(1, Math.min(10, Number(payload.characterGuidance) || 5)),
        correction: "apg",
        strength: Math.max(0, Math.min(1.5, Number(payload.characterStrength) || 1)),
        ref_end: 0.9,
        ref_megapixels: 1,
      },
    };
    modelRef = ["41", 0];
    workflow[7].inputs.model = modelRef;
  }
  if (hires) {
    workflow[20] = {
      class_type: "LatentUpscaleBy",
      inputs: {
        samples: ["7", 0],
        upscale_method: "bicubic",
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
        sampler_name: samplerName,
        scheduler: schedulerName,
        denoise: Math.max(0.15, Math.min(0.6, Number(payload.hiresDenoise) || 0.32)),
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

function llmStatus() {
  const config = readConfig();
  return {
    running: Boolean(llmProcess),
    port: LLM_PORT,
    model: config.llmModel || LLM_MODEL,
    bin: config.llmBin || LLM_BIN,
    mode: config.llmMode || "local",
    device: config.llmDevice || "gpu",
    label: config.llmMode === "external" ? "外部 API" : ((config.llmDevice || "gpu") === "gpu" ? "本地 GPU 加速 · 生成前暂停 ComfyUI" : "本地 CPU · 不占显存"),
  };
}

async function llmHealthy() {
  try {
    const response = await fetch(`http://127.0.0.1:${LLM_PORT}/health`, { signal: AbortSignal.timeout(1500) });
    return response.ok;
  } catch {
    return false;
  }
}

async function stopComfyForLlm() {
  if (!comfyProcess?.pid) return;
  try {
    if (process.platform === "win32") spawnSync("taskkill", ["/PID", String(comfyProcess.pid), "/T", "/F"], { windowsHide: true });
    else comfyProcess.kill("SIGTERM");
  } catch {}
  comfyProcess = null;
  await new Promise((resolve) => setTimeout(resolve, 1500));
}

async function startLlm() {
  const config = readConfig();
  if ((config.llmMode || "local") === "external") return llmStatus();
  if (await llmHealthy()) return llmStatus();
  if (llmStartPromise) return llmStartPromise;
  const bin = config.llmBin || LLM_BIN;
  const model = config.llmModel || LLM_MODEL;
  if (!fs.existsSync(bin)) throw new Error("本地 AI 运行时不存在，请在设置中配置 llama-server 路径");
  if (!fs.existsSync(model)) throw new Error("本地 AI 模型不存在，请在设置中配置 GGUF 路径");
  llmStartPromise = (async () => {
    await stopLlm();
    const useGpu = (config.llmDevice || "gpu") === "gpu";
    if (useGpu) await stopComfyForLlm();
    const cores = Math.max(4, Math.min(16, (os.cpus()?.length || 8) - 2));
    llmProcess = spawn(bin, [
      "--model", model,
      "--host", "127.0.0.1",
      "--port", String(LLM_PORT),
      "--ctx-size", "4096",
      "--n-gpu-layers", useGpu ? "99" : "0",
      "--threads", String(cores),
      "--no-webui",
    ], { windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
    llmProcess.stdout?.on("data", () => {});
    llmProcess.stderr?.on("data", () => {});
    for (let i = 0; i < 240; i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (await llmHealthy()) return llmStatus();
      if (!llmProcess || llmProcess.exitCode !== null) throw new Error("本地 AI 启动失败");
    }
    throw new Error("本地 AI 启动超时");
  })();
  try {
    return await llmStartPromise;
  } finally {
    llmStartPromise = null;
  }
}

async function stopLlm() {
  if (!llmProcess) return;
  try {
    if (process.platform === "win32") spawnSync("taskkill", ["/PID", String(llmProcess.pid), "/T", "/F"], { windowsHide: true });
    else llmProcess.kill("SIGTERM");
  } catch {}
  llmProcess = null;
}

function runtimePaths() {
  const packaged = app.isPackaged;
  return {
    script: packaged ? path.join(process.resourcesPath, "bootstrap_runtime.ps1") : path.join(__dirname, "bootstrap_runtime.ps1"),
    plugins: packaged ? path.join(process.resourcesPath, "runtime-plugins") : path.join(__dirname, "runtime-plugins"),
  };
}

function runtimeCheck() {
  const config = readConfig();
  const root = normalizeComfyDir(config.comfyDir);
  const python = [
    config.pythonExe,
    path.join(root, "python_embeded", "python.exe"),
    path.join(root, ".venv", "Scripts", "python.exe"),
    path.resolve(root, "..", ".venv", "Scripts", "python.exe"),
    path.resolve(root, "..", "..", ".venv", "Scripts", "python.exe"),
    path.join(root, "venv", "Scripts", "python.exe"),
    path.join(root, "python.exe"),
  ].find((candidate) => candidate && fs.existsSync(candidate)) || "";
  const script = [
    path.join(root, "ComfyUI", "main.py"),
    path.join(root, "main.py"),
  ].find((candidate) => fs.existsSync(candidate)) || "";
  return { ready: Boolean(python && script), comfyDir: root, pythonExe: python, script };
}

async function installRuntime(payload) {
  const { execFile } = require("node:child_process");
  const { promisify } = require("node:util");
  const run = promisify(execFile);
  const paths = runtimePaths();
  if (!fs.existsSync(paths.script)) throw new Error("安装脚本缺失，请重新安装应用");
  const root = String(payload?.root || (fs.existsSync("F:\\") ? "F:\\LumenFlow" : path.join(dataRoot(), "runtime")));
  await run("powershell.exe", [
    "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", paths.script,
    "-Root", root, "-Plugins", paths.plugins,
  ], { windowsHide: true, timeout: 2 * 60 * 60 * 1000, maxBuffer: 1024 * 1024 * 8 });
  const metaPath = path.join(root, "runtime.json");
  let meta = {};
  try { meta = JSON.parse(fs.readFileSync(metaPath, "utf8")); } catch {}
  const comfyDir = meta.comfyDir || path.join(root, "ComfyUI_windows_portable");
  const pythonExe = meta.pythonExe || path.join(comfyDir, "python_embeded", "python.exe");
  writeConfig({
    comfyDir,
    pythonExe,
    unet: meta.unet || "anima-base-v1.0.safetensors",
    clip: meta.clip || "qwen_3_06b_base.safetensors",
    vae: meta.vae || "qwen_image_vae.safetensors",
  });
  return { ok: true, comfyDir, pythonExe, meta, runtime: runtimeCheck() };
}

async function setupLocalLlm() {
  const { execFile } = require("node:child_process");
  const { promisify } = require("node:util");
  const run = promisify(execFile);
  const dir = path.join(dataRoot(), "llm");
  const model = path.join(dir, "qwen2.5-0.5b-instruct-q4_k_m.gguf");
  const runtimeDir = path.join(dir, "llama-cpu");
  fs.mkdirSync(dir, { recursive: true });
  const ps = (command) => run("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", command], { windowsHide: true, timeout: 30 * 60 * 1000, maxBuffer: 1024 * 1024 * 8 });
  if (!fs.existsSync(model) || fs.statSync(model).size < 100_000_000) {
    const url = "https://hf-mirror.com/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf";
    await ps(`$ProgressPreference='SilentlyContinue'; Invoke-WebRequest -Uri '${url}' -OutFile '${model.replace(/'/g, "''")}' -UseBasicParsing`);
  }
  let server = path.join(runtimeDir, "llama-server.exe");
  if (!fs.existsSync(server)) {
    const zip = path.join(dir, "llama-cpu.zip");
    const url = "https://github.com/ggml-org/llama.cpp/releases/download/b12600/llama-b12600-bin-win-cpu-x64.zip";
    await ps(`$ProgressPreference='SilentlyContinue'; Invoke-WebRequest -Uri '${url}' -OutFile '${zip.replace(/'/g, "''")}' -UseBasicParsing; Expand-Archive -LiteralPath '${zip.replace(/'/g, "''")}' -DestinationPath '${runtimeDir.replace(/'/g, "''")}' -Force`);
    const found = [];
    const walk = (folder) => {
      for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
        const full = path.join(folder, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.name.toLowerCase() === "llama-server.exe") found.push(full);
      }
    };
    walk(runtimeDir);
    if (!found.length) throw new Error("本地 AI 运行时解压失败");
    server = found[0];
  }
  const next = writeConfig({ llmMode: "local", llmModel: model, llmBin: server });
  return { ...llmStatus(), config: next };
}

function sendLlmToken(token) {
  if (!token) return;
  try {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send("flow:llm:token", { token });
  } catch {}
}

async function readLlmStream(response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/event-stream") || !response.body) {
    const data = await response.json();
    return data?.choices?.[0]?.message?.content || "";
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let content = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() || "";
    for (const event of events) {
      for (const line of event.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const raw = line.slice(5).trim();
        if (!raw || raw === "[DONE]") continue;
        try {
          const data = JSON.parse(raw);
          const delta = data?.choices?.[0]?.delta?.content || "";
          if (delta) { content += delta; sendLlmToken(delta); }
        } catch {}
      }
    }
  }
  return content;
}

async function chatLlm(payload) {
  const config = readConfig();
  const messages = Array.isArray(payload?.messages) ? payload.messages.slice(-12) : [];
  if ((config.llmMode || "local") === "external") {
    if (!config.llmApiUrl) throw new Error("请先在设置中填写外部 AI API 地址");
    const base = String(config.llmApiUrl).replace(/\/+$/, "");
    const response = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(config.llmApiKey ? { Authorization: `Bearer ${config.llmApiKey}` } : {}),
      },
      body: JSON.stringify({
        model: config.llmApiModel || "gpt-4o-mini",
        messages,
        temperature: 0.55,
        max_tokens: 1200,
        stream: true,
        frequency_penalty: 0.35,
        presence_penalty: 0.2,
      }),
      signal: AbortSignal.timeout(180000),
    });
    if (!response.ok) throw new Error(`外部 AI 请求失败 (${response.status})`);
    const content = await readLlmStream(response);
    return { content, status: llmStatus() };
  }
  await startLlm();
  const response = await fetch(`http://127.0.0.1:${LLM_PORT}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "lumen-local",
      messages,
      temperature: 0.55,
      top_p: 0.9,
      max_tokens: 1600,
      stream: true,
      repeat_penalty: 1.12,
      repeat_last_n: 256,
      chat_template_kwargs: { enable_thinking: false },
      response_format: LLM_RESPONSE_FORMAT,
    }),
    signal: AbortSignal.timeout(180000),
  });
  if (!response.ok) throw new Error(`本地 AI 请求失败 (${response.status})`);
  const content = await readLlmStream(response);
  return { content, status: llmStatus() };
}

async function runComfy(payload) {
  // CPU LLM still holds several GB of RAM; release it while sampling.
  await stopLlm();
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
  let characterImageName = "";
  if (payload.characterImage) {
    send("flow:progress", { stage: "Uploading character reference...", progress: 0.015 });
    characterImageName = await uploadDataUrl(config, payload.characterImage);
  }
  let textureImageName = "";
  if (payload.textureImage) {
    send("flow:progress", { stage: "Uploading texture reference...", progress: 0.018 });
    textureImageName = await uploadDataUrl(config, payload.textureImage);
  }
  const built = payload.customWorkflow && typeof payload.customWorkflow === "object"
    ? {
        workflow: payload.customWorkflow,
        seed: Number(payload.seed) || 0,
        width: Number(payload.width) || 1024,
        height: Number(payload.height) || 1024,
      }
    : buildWorkflow(config, payload, initImageName, characterImageName, textureImageName);
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
      const metadata = {
        name,
        prompt: String(payload.prompt || ""),
        negativePrompt: String(payload.negative || ""),
        seed: built.seed,
        steps: built.steps,
        cfg: built.cfg,
        width: built.width,
        height: built.height,
        model: payload.unet || config.unet,
        lora: payload.lora || config.lora || "",
        performanceProfile: payload.performanceProfile || "manual",
        createdAt: new Date().toISOString(),
      };
      await fsp.writeFile(filePath.replace(/\.png$/i, ".json"), JSON.stringify(metadata, null, 2), "utf8");
      images.push({
        name,
        path: filePath,
        url: `data:image/png;base64,${buffer.toString("base64")}`,
        ...metadata,
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
  const repairNote = String(payload.repairNote || "").trim();
  const needsCorrection = payload.autoCorrect && !payload.skipFootRepair && images.length &&
    (repairNote || /feet|foot|toes|barefoot|footwear|足|脚|丝袜|裸足/i.test(String(payload.prompt || "")));
  if (needsCorrection) {
    // 逐张精修，保持张数不变（旧实现只修第一张并用单图替换整批，导致提示「完成 1 张」）
    for (let index = 0; index < images.length; index += 1) {
      try {
        send("flow:progress", {
          stage: `Detail correction ${index + 1}/${images.length}...`,
          progress: 0.95 + (0.04 * (index + 1)) / images.length,
        });
        const repaired = await repairFeet({
          path: images[index].path,
          prompt: payload.prompt,
          negativePrompt: payload.negative,
          repairNote,
          width: built.width,
          height: built.height,
          steps: built.steps,
          cfg: built.cfg,
          seed: built.seed,
          batch: 1,
          unet: payload.unet,
          detailPart: payload.detailPart,
          detailRegion: payload.detailRegion,
          detailZoom: payload.detailZoom,
          detailPasses: payload.detailPasses,
        });
        if (repaired?.images?.length) images[index] = repaired.images[0];
      } catch (error) {
        send("flow:progress", {
          stage: `Detail skipped (${index + 1}/${images.length}): ${error?.message || error}`,
          progress: 0.98,
        });
      }
    }
  }
  if (payload.autoUpscale && images.length) {
    const factor = Math.max(1, Math.min(4, Number(payload.upscaleFactor) || 2));
    const model = String(payload.upscaleModel || "") || pickBestUpscaleModel(config);
    for (let index = 0; index < images.length; index += 1) {
      try {
        send("flow:progress", {
          stage: `Upscaling ${index + 1}/${images.length} (${factor}x)...`,
          progress: 0.985,
        });
        const original = images[index];
        const upgraded = await upscaleImage(config, { name: original.name, factor, model });
        images[index] = upgraded;
        // 低清原图与它的元数据一起删除，作品栏里只留高清结果
        try { await fsp.unlink(original.path); } catch {}
        try { await fsp.unlink(original.path.replace(/\.[^.]+$/, ".json")); } catch {}
      } catch (error) {
        send("flow:progress", {
          stage: `Upscale skipped (${index + 1}/${images.length}): ${error?.message || error}`,
          progress: 0.99,
        });
      }
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

const detailWorkflow = require("./detail-workflow.cjs");

// 局部精修：按区域裁切 → 放大重绘 → 缩回 → 羽化贴回原图。
// 区域 / 部位由 payload.detailRegion、payload.detailPart 决定（renderer 传）。
function resolvePythonForTools(config) {
  const root = String(config?.comfyDir || "");
  const candidates = [
    config?.pythonExe,
    root && path.join(root, "python_embeded", "python.exe"),
    root && path.join(root, ".venv", "Scripts", "python.exe"),
    root && path.resolve(root, "..", ".venv", "Scripts", "python.exe"),
    root && path.resolve(root, "..", "..", ".venv", "Scripts", "python.exe"),
    root && path.join(root, "venv", "Scripts", "python.exe"),
    root && path.join(root, "python.exe"),
  ].filter(Boolean);
  return candidates.find((candidate) => fs.existsSync(candidate)) || "";
}

function detectPartRect(config, imagePath, part) {
  const script = app.isPackaged
    ? path.join(process.resourcesPath, "detect-pose.py")
    : path.join(__dirname, "detect-pose.py");
  if (!fs.existsSync(script)) return null;
  const python = resolvePythonForTools(config);
  if (!python) return null;
  try {
    const result = spawnSync(python, [script, imagePath, part], {
      encoding: "utf8",
      timeout: 90000,
      windowsHide: true,
    });
    const lines = String(result.stdout || "").trim().split(/\r?\n/);
    const last = lines[lines.length - 1] || "";
    const parsed = JSON.parse(last);
    if (!parsed?.ok) {
      send("flow:progress", { stage: `Detect skipped: ${parsed?.reason || "unknown"}`, progress: 0.96 });
      return null;
    }
    return { x: parsed.x, y: parsed.y, width: parsed.w, height: parsed.h, part: parsed.part, conf: parsed.conf };
  } catch (error) {
    send("flow:progress", { stage: `Detect skipped: ${error?.message || error}`, progress: 0.96 });
    return null;
  }
}

async function detailPartLocal(config, options) {
  const imageName = await uploadComfyImage(config, options.path);
  const built = detailWorkflow.buildDetailWorkflow({
    config,
    imageName,
    width: options.width,
    height: options.height,
    prompt: options.prompt,
    negative: options.negative,
    seed: options.seed,
    steps: options.steps,
    cfg: options.cfg,
    denoise: options.denoise,
    region: options.region || "bottom",
    part: options.part || "feet",
    zoom: Number(options.zoom) || 1,
    rect: options.rect || null,
    filenamePrefix: "LumenDetail",
  });
  send("flow:progress", { stage: "Detail pass...", progress: 0.97 });
  const response = await comfyFetch(
    config.comfyUrl,
    "/prompt",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: built.workflow, client_id: `lumen-detail-${Date.now()}` }),
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
    if (index > 260) throw new Error("Detail pass timeout");
  }
  const output = Object.values(entry?.outputs || {}).flatMap((item) => item.images || [])[0];
  if (!output) throw new Error("Detail pass returned no image");
  const query = new URLSearchParams({
    filename: output.filename,
    subfolder: output.subfolder || "",
    type: output.type || "output",
  });
  const finalResponse = await comfyFetch(config.comfyUrl, `/view?${query.toString()}`, {}, 30000);
  const buffer = Buffer.from(await finalResponse.arrayBuffer());
  const filePath = path.join(outputDir(), `flow-${Date.now()}-detail.png`);
  await fsp.writeFile(filePath, buffer);
  return { name: path.basename(filePath), path: filePath, url: `data:image/png;base64,${buffer.toString("base64")}` };
}

async function repairFeet(payload) {
  const imagePath = String(payload?.path || "");
  if (!imagePath || !fs.existsSync(imagePath)) throw new Error("Image not found");
  // 精修沿用主图模型：主图若是 Anima Base，精修也用 Base，避免局部风格与整图不一致
  const baseConfig = readConfig();
  const config = payload.unet ? { ...baseConfig, unet: String(payload.unet) } : baseConfig;
  const repairNote = String(payload.repairNote || "").trim();
  const focus = repairNote || String(payload.prompt || "");
  const hasFeet = /feet|foot|toes|barefoot|足|脚|丝袜|裸足/i.test(focus);
  const hasHands = /hand|finger|手|指/i.test(focus);
  const requestedPart = String(payload.detailPart || "").trim();
  const part =
    requestedPart && requestedPart !== "auto"
      ? requestedPart
      : hasFeet && hasHands
        ? "both"
        : hasFeet
          ? "feet"
          : hasHands
            ? "hands"
            : "feet";
  // 部位正向/负向词由 detail-workflow.cjs 按 part 注入，这里只补画面上下文。
  const prompt = [
    String(payload.prompt || ""),
    repairNote ? `correction request: ${repairNote}` : "",
    /face|eye|脸|眼|表情/i.test(focus) ? "detailed face, symmetrical eyes, natural facial expression" : "",
  ]
    .filter(Boolean)
    .join(", ");
  const negative = String(payload.negativePrompt || "worst quality, low quality, blurry");
  const seedValue = Number(payload.seed);
  const passes = Math.max(1, Math.min(2, Number(payload.detailPasses) || 1));
  const zoom = Math.max(0.2, Math.min(1, Number(payload.detailZoom) || 1));
  const requestedRegion = String(payload.detailRegion || "bottom");
  // auto：先用位姿模型定位脚/手，失败则回退到所选区域
  let rect = null;
  if (requestedRegion === "auto") {
    send("flow:progress", { stage: "Detecting feet/hands...", progress: 0.96 });
    rect = detectPartRect(config, imagePath, part);
  }
  const region = requestedRegion;
  const baseDenoise = Math.max(0.25, Math.min(0.6, Number(payload.detailDenoise) || 0.45));
  let source = imagePath;
  let image = null;
  for (let pass = 0; pass < passes; pass += 1) {
    image = await detailPartLocal(config, {
      path: source,
      width: Math.max(256, Number(payload.width) || 1024),
      height: Math.max(256, Number(payload.height) || 1024),
      prompt,
      negative,
      region,
      part,
      zoom,
      rect,
      seed: Number.isFinite(seedValue) && seedValue >= 0 ? Math.floor(seedValue) : Math.floor(Math.random() * 2 ** 31),
      steps: Math.max(8, Math.min(40, Number(payload.steps) || 24)),
      cfg: Math.max(1, Math.min(10, Number(payload.cfg) || 4)),
      denoise: pass === 0 ? baseDenoise : Math.max(0.25, baseDenoise - 0.15),
    });
    if (!image?.path) break;
    source = image.path;
  }
  return { images: [image], seed: seedValue };
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
  const batch = Math.max(1, Math.min(10, Number(payload.batch) || 1));
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
      const metadata = {
        name,
        prompt: String(payload.prompt || ""),
        negativePrompt: String(payload.negative || ""),
        seed: built.seed,
        steps: built.steps,
        cfg: built.cfg,
        width: built.width,
        height: built.height,
        model: payload.unet || config.unet,
        lora: payload.lora || config.lora || "",
        performanceProfile: payload.performanceProfile || "manual",
        createdAt: new Date().toISOString(),
      };
      await fsp.writeFile(filePath.replace(/\.png$/i, ".json"), JSON.stringify(metadata, null, 2), "utf8");
      images.push({
        name,
        path: filePath,
        url: `data:image/png;base64,${buffer.toString("base64")}`,
        ...metadata,
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
    icon: path.join(__dirname, "renderer", "icon.png"),
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
  try { if (llmProcess?.pid) spawnSync("taskkill", ["/PID", String(llmProcess.pid), "/T", "/F"], { windowsHide: true }); } catch {}
  if (comfyProcess && comfyProcess.pid) {
    try {
      if (process.platform === "win32") {
        spawnSync("taskkill", ["/PID", String(comfyProcess.pid), "/T", "/F"], { windowsHide: true });
      } else {
        comfyProcess.kill("SIGTERM");
      }
    } catch {
      // best effort: closing the app must not be blocked by a child process
    }
    comfyProcess = null;
  }
});

ipcMain.handle("flow:version", () => app.getVersion());
ipcMain.handle("flow:config:get", () => readConfig());
ipcMain.handle("flow:config:set", (_event, patch) => writeConfig(patch));
ipcMain.handle("flow:health", () => health(readConfig()));
ipcMain.handle("flow:models", () => listModels());
ipcMain.handle("flow:training:ingest", (_event, payload) => ingestTrainingBatch(payload));
ipcMain.handle("flow:workflow:preview", (_event, payload) => previewWorkflow(payload));
ipcMain.handle("flow:references:list", () => listReferences());
ipcMain.handle("flow:references:add", (_event, payload) => addReference(payload));
ipcMain.handle("flow:references:data", (_event, payload) => readReferenceData(payload));
ipcMain.handle("flow:references:set-category", (_event, payload) => {
  const ids = new Set((payload?.ids || []).map(String));
  const category = String(payload?.category || "custom_uncategorized");
  const categoryType = String(payload?.categoryType || "custom");
  const items = referenceLibraryIndex().map((entry) =>
    ids.has(entry.id) ? { ...entry, category, categoryType } : entry
  );
  writeReferenceLibrary(items);
  return listReferences();
});
ipcMain.handle("flow:references:remove", (_event, payload) => {
  const items = referenceLibraryIndex();
  const item = items.find((entry) => entry.id === payload.id);
  if (item) {
    try { fs.unlinkSync(path.join(referenceLibraryRoot(), item.file)); } catch {}
    writeReferenceLibrary(items.filter((entry) => entry.id !== payload.id));
  }
  return listReferences();
});
ipcMain.handle("flow:references:open", () => shell.openPath(referenceLibraryRoot()));
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

ipcMain.handle("flow:runtime:install", (_event, payload) => installRuntime(payload));
ipcMain.handle("flow:runtime:check", () => runtimeCheck());
ipcMain.handle("flow:llm:setup", () => setupLocalLlm());
ipcMain.handle("flow:llm:status", () => llmStatus());
ipcMain.handle("flow:llm:start", () => startLlm());
ipcMain.handle("flow:llm:stop", () => stopLlm());
ipcMain.handle("flow:llm:chat", (_event, payload) => chatLlm(payload));

// ---------- 隐藏作品 ----------
function hiddenWorksPath() {
  return path.join(dataRoot(), "hidden-works.json");
}

function readHiddenWorks() {
  try {
    const raw = JSON.parse(fs.readFileSync(hiddenWorksPath(), "utf8"));
    return new Set(Array.isArray(raw) ? raw.filter((name) => typeof name === "string") : []);
  } catch {
    return new Set();
  }
}

async function writeHiddenWorks(set) {
  await fsp.mkdir(dataRoot(), { recursive: true });
  const list = [...set].sort();
  await fsp.writeFile(hiddenWorksPath(), JSON.stringify(list, null, 2), "utf8");
  return list;
}

async function setHiddenWorks(payload) {
  const names = (Array.isArray(payload?.names) ? payload.names : [payload?.name])
    .map((name) => path.basename(String(name || "")))
    .filter((name) => /\.(png|jpe?g|webp)$/i.test(name));
  const hidden = readHiddenWorks();
  const makeHidden = payload?.hidden !== false;
  for (const name of names) {
    if (makeHidden) hidden.add(name); else hidden.delete(name);
  }
  await writeHiddenWorks(hidden);
  return { hidden: [...hidden] };
}

// ---------- 局部修正（框选：修复 / 擦除） ----------
function regionEraseScript() {
  return app.isPackaged
    ? path.join(process.resourcesPath, "region-erase.py")
    : path.join(__dirname, "region-erase.py");
}

async function repairRegion(payload) {
  const config = readConfig();
  const name = path.basename(String(payload?.name || ""));
  if (!/\.(png|jpe?g|webp)$/i.test(name)) throw new Error("Invalid image name");
  const sourcePath = path.join(outputDir(), name);
  if (!fs.existsSync(sourcePath)) throw new Error("找不到要修正的图片");

  const rect = payload?.rect || {};
  const rw = Math.max(16, Math.round(Number(rect.w) || 0));
  const rh = Math.max(16, Math.round(Number(rect.h) || 0));
  const rx = Math.max(0, Math.round(Number(rect.x) || 0));
  const ry = Math.max(0, Math.round(Number(rect.y) || 0));
  if (!rw || !rh) throw new Error("请先在图上框选要修正的区域");

  const mode = payload?.mode === "erase" ? "erase" : "repair";
  const blend = Math.max(0, Math.min(0.9, Number(payload?.blend) || 0));

  await ensureComfyReady(config);
  const buffer = await fsp.readFile(sourcePath);
  const size = readImageSize(buffer);
  if (!size?.width || !size?.height) throw new Error("无法读取图片尺寸");

  let workingPath = sourcePath;
  let tempFiles = [];
  if (mode === "erase") {
    const script = regionEraseScript();
    if (!fs.existsSync(script)) throw new Error("擦除脚本缺失，请重新安装应用");
    const python = resolvePythonForTools(config);
    if (!python) throw new Error("找不到 Python，无法执行擦除");
    const outPath = path.join(app.getPath("temp"), `lumen-erase-${Date.now()}.png`);
    const result = spawnSync(
      python,
      [script, sourcePath, outPath, String(rx), String(ry), String(rw), String(rh), String(payload?.donor || "auto")],
      { encoding: "utf8", timeout: 120000, windowsHide: true },
    );
    if (!fs.existsSync(outPath)) {
      throw new Error(`擦除失败：${String(result?.stderr || result?.stdout || "").slice(-200)}`);
    }
    workingPath = outPath;
    tempFiles.push(outPath);
  }

  const uploadName = await uploadComfyImage(config, workingPath);
  const prefix = `LumenFix${Date.now()}`;
  const defaultPrompt = mode === "erase"
    ? "long hair strands, soft blurred background, natural lighting, no people"
    : "detailed anatomy, five fingers, five toes, natural shapes, clean lines, same lighting";
  const built = detailWorkflow.buildDetailWorkflow({
    config,
    imageName: uploadName,
    width: size.width,
    height: size.height,
    prompt: String(payload?.prompt || defaultPrompt),
    negative: String(payload?.negative || "extra fingers, extra toes, fused digits, deformed, blurry, text, watermark"),
    seed: Number(payload?.seed) || Math.floor(Math.random() * 1e9),
    steps: Math.max(8, Math.min(60, Number(payload?.steps) || 24)),
    cfg: Number(payload?.cfg) || 4.5,
    denoise: mode === "erase" ? Math.min(0.9, blend) : Math.max(0.15, Math.min(0.9, Number(payload?.denoise) || 0.5)),
    region: "auto",
    part: "hands",
    zoom: 1,
    rect: { x: rx, y: ry, width: rw, height: rh },
    filenamePrefix: prefix,
  });

  if (mode === "erase" && blend <= 0.001) {
    // 不需要融合：直接把克隆填补的结果作为成品
    const baseName = name.replace(/\.[^.]+$/, "");
    const outName = `${baseName}-fix.png`;
    const outPath = path.join(outputDir(), outName);
    await fsp.copyFile(workingPath, outPath);
    const meta = {
      ...(await readOutputMeta(sourcePath)),
      name: outName,
      fixed: true,
      fixMode: "erase",
      fixRect: { x: rx, y: ry, w: rw, h: rh },
      source: name,
      width: size.width,
      height: size.height,
      createdAt: new Date().toISOString(),
    };
    await fsp.writeFile(outPath.replace(/\.[^.]+$/, ".json"), JSON.stringify(meta, null, 2), "utf8");
    tempFiles.forEach((file) => { try { fs.unlinkSync(file); } catch {} });
    return { ok: true, item: { name: outName, path: outPath, url: `data:image/png;base64,${(await fsp.readFile(outPath)).toString("base64")}`, ...meta } };
  }

  const files = await runWorkflowRaw(config, built.workflow);
  if (!files.length) throw new Error("修正没有输出结果");
  const baseName = name.replace(/\.[^.]+$/, "");
  const outName = `${baseName}-fix.png`;
  const outPath = path.join(outputDir(), outName);
  await fsp.copyFile(files[0].path, outPath);
  const meta = {
    ...(await readOutputMeta(sourcePath)),
    name: outName,
    fixed: true,
    fixMode: mode,
    fixRect: { x: rx, y: ry, w: rw, h: rh },
    fixDenoise: mode === "erase" ? blend : Math.max(0.15, Math.min(0.9, Number(payload?.denoise) || 0.5)),
    source: name,
    width: size.width,
    height: size.height,
    createdAt: new Date().toISOString(),
  };
  await fsp.writeFile(outPath.replace(/\.[^.]+$/, ".json"), JSON.stringify(meta, null, 2), "utf8");
  tempFiles.forEach((file) => { try { fs.unlinkSync(file); } catch {} });
  return {
    ok: true,
    item: {
      name: outName,
      path: outPath,
      url: `data:image/png;base64,${(await fsp.readFile(outPath)).toString("base64")}`,
      ...meta,
    },
  };
}

async function readOutputMeta(imagePath) {
  try {
    return JSON.parse(await fsp.readFile(imagePath.replace(/\.[^.]+$/, ".json"), "utf8")) || {};
  } catch {
    return {};
  }
}

// ---------- 高清化（只改分辨率，不经过采样器） ----------
function readImageSize(buffer) {
  try {
    if (buffer.length > 24 && buffer[0] === 0x89 && buffer.toString("ascii", 1, 4) === "PNG") {
      return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
    }
    if (buffer.length > 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
      let offset = 2;
      while (offset + 9 < buffer.length) {
        if (buffer[offset] !== 0xff) { offset += 1; continue; }
        const marker = buffer[offset + 1];
        const length = buffer.readUInt16BE(offset + 2);
        if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
          return { width: buffer.readUInt16BE(offset + 7), height: buffer.readUInt16BE(offset + 5) };
        }
        offset += 2 + length;
      }
    }
    if (buffer.length > 30 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") {
      if (buffer.toString("ascii", 12, 16) === "VP8X") {
        return { width: 1 + buffer.readUIntLE(24, 3), height: 1 + buffer.readUIntLE(27, 3) };
      }
    }
  } catch {}
  return null;
}

function upscaleModelDir(config) {
  return path.join(normalizeComfyDir(config.comfyDir), "models", "upscale_models");
}

function listUpscaleModels(config) {
  try {
    return fs.readdirSync(upscaleModelDir(config)).filter((name) => /\.(pth|safetensors|onnx)$/i.test(name));
  } catch {
    return [];
  }
}

function pickBestUpscaleModel(config) {
  const models = listUpscaleModels(config);
  if (!models.length) return "";
  return models.find((name) => /anime/i.test(name)) || models.find((name) => /x4/i.test(name)) || models[0];
}

function buildUpscaleWorkflow({ imageName, width, height, factor, model, filenamePrefix }) {
  const targetW = Math.max(64, Math.round((width * factor) / 2) * 2);
  const targetH = Math.max(64, Math.round((height * factor) / 2) * 2);
  const nodes = {
    "1": { class_type: "LoadImage", inputs: { image: imageName } },
    "5": { class_type: "SaveImage", inputs: { images: ["4", 0], filename_prefix: filenamePrefix } },
  };
  if (model) {
    nodes["2"] = { class_type: "UpscaleModelLoader", inputs: { model_name: model } };
    nodes["3"] = { class_type: "ImageUpscaleWithModel", inputs: { upscale_model: ["2", 0], image: ["1", 0] } };
    nodes["4"] = { class_type: "ImageScale", inputs: { image: ["3", 0], upscale_method: "lanczos", width: targetW, height: targetH, crop: "disabled" } };
  } else {
    nodes["4"] = { class_type: "ImageScale", inputs: { image: ["1", 0], upscale_method: "lanczos", width: targetW, height: targetH, crop: "disabled" } };
  }
  return { workflow: nodes, width: targetW, height: targetH };
}

async function ensureComfyReady(config) {
  let status = await health(config);
  if (status.ok) return;
  send("flow:progress", { stage: "Starting ComfyUI...", progress: 0.02 });
  await startComfy();
  status = await health(config);
  if (!status.ok) throw new Error("ComfyUI request failed");
}

async function runWorkflowRaw(config, workflow) {
  const clientId = `lumen-raw-${Date.now()}`;
  const submit = await comfyFetch(
    config.comfyUrl,
    "/prompt",
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: workflow, client_id: clientId }) },
    20000,
  ).then((response) => response.json());
  if (submit?.error) throw new Error(JSON.stringify(submit.error));
  const promptId = submit.prompt_id;
  if (!promptId) throw new Error("ComfyUI request failed");
  let entry = null;
  const started = Date.now();
  for (let index = 0; index < 600; index += 1) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    const history = await (await comfyFetch(config.comfyUrl, `/history/${promptId}`, {}, 8000)).json();
    entry = history?.[promptId];
    if (entry) {
      if (entry.status?.status_str === "error") throw new Error("ComfyUI request failed");
      break;
    }
    if (Date.now() - started > 10 * 60 * 1000) throw new Error("ComfyUI request failed");
  }
  if (!entry) throw new Error("ComfyUI request failed");
  const outDir = path.join(app.getPath("temp"), `lumen-raw-${Date.now()}`);
  await fsp.mkdir(outDir, { recursive: true });
  const files = [];
  for (const output of Object.values(entry.outputs || {})) {
    for (const image of output.images || []) {
      const query = new URLSearchParams({ filename: image.filename, subfolder: image.subfolder || "", type: image.type || "output" });
      const response = await comfyFetch(config.comfyUrl, `/view?${query.toString()}`, {}, 30000);
      const buffer = Buffer.from(await response.arrayBuffer());
      const filePath = path.join(outDir, `hd-${files.length + 1}.png`);
      await fsp.writeFile(filePath, buffer);
      files.push({ path: filePath, buffer });
    }
  }
  return files;
}

async function upscaleImage(config, options) {
  const factor = Math.max(1, Math.min(4, Number(options?.factor) || 2));
  const model = String(options?.model || "");
  let sourcePath = "";
  if (options?.name) {
    const name = path.basename(String(options.name));
    if (!/\.(png|jpe?g|webp)$/i.test(name)) throw new Error("Invalid image name");
    sourcePath = path.join(outputDir(), name);
  } else if (options?.dataUrl) {
    const match = String(options.dataUrl).match(/^data:image\/(png|jpe?g|webp);base64,(.+)$/);
    if (!match) throw new Error("Invalid image data");
    const ext = match[1] === "jpeg" ? "jpg" : match[1];
    const rawName = String(options?.sourceName || "").trim();
    const safeStem = rawName
      ? rawName.replace(/\.[^.]+$/, "").replace(/[\\/:*?"<>|\s]+/g, "-").slice(0, 60)
      : `imported-${Date.now()}`;
    sourcePath = path.join(app.getPath("temp"), `${safeStem}.${ext}`);
    await fsp.writeFile(sourcePath, Buffer.from(match[2], "base64"));
  }
  if (!sourcePath || !fs.existsSync(sourcePath)) throw new Error("找不到要高清化的图片");

  await ensureComfyReady(config);
  const buffer = await fsp.readFile(sourcePath);
  const size = readImageSize(buffer);
  if (!size?.width || !size?.height) throw new Error("无法读取图片尺寸");

  const tmpIn = path.join(app.getPath("temp"), `lumen-hd-in-${Date.now()}${path.extname(sourcePath)}`);
  await fsp.writeFile(tmpIn, buffer);
  const imageName = await uploadComfyImage(config, tmpIn);
  const prefix = `LumenHD${Date.now()}`;
  const built = buildUpscaleWorkflow({ imageName, width: size.width, height: size.height, factor, model, filenamePrefix: prefix });
  const files = await runWorkflowRaw(config, built.workflow);
  if (!files.length) throw new Error("高清化没有输出结果");

  await fsp.mkdir(outputDir(), { recursive: true });
  const baseName = path.basename(sourcePath).replace(/\.[^.]+$/, "");
  const outName = `${baseName}-hd${factor}x.png`;
  const outPath = path.join(outputDir(), outName);
  await fsp.copyFile(files[0].path, outPath);
  // 继承原图元数据（提示词 / 步数 / CFG / 种子 / 模型等），再叠加放大信息
  let sourceMeta = {};
  try {
    sourceMeta = JSON.parse(await fsp.readFile(sourcePath.replace(/\.[^.]+$/, ".json"), "utf8"));
  } catch {}
  if (!sourceMeta || typeof sourceMeta !== "object" || Array.isArray(sourceMeta)) sourceMeta = {};
  const imported = Boolean(options?.dataUrl);
  const meta = {
    ...sourceMeta,
    name: outName,
    imported,
    ...(imported ? { sourceName: String(options?.sourceName || path.basename(sourcePath)) } : {}),
    prompt: sourceMeta.prompt ?? "",
    negativePrompt: sourceMeta.negativePrompt ?? "",
    seed: sourceMeta.seed ?? null,
    steps: sourceMeta.steps ?? null,
    cfg: sourceMeta.cfg ?? null,
    model: sourceMeta.model ?? "",
    lora: sourceMeta.lora ?? "",
    upscaled: true,
    source: path.basename(sourcePath),
    factor,
    engine: model ? `model:${model}` : "lanczos",
    sourceWidth: sourceMeta.sourceWidth || size.width,
    sourceHeight: sourceMeta.sourceHeight || size.height,
    width: built.width,
    height: built.height,
    createdAt: new Date().toISOString(),
  };
  await fsp.writeFile(outPath.replace(/\.[^.]+$/, ".json"), JSON.stringify(meta, null, 2), "utf8");
  return {
    name: outName,
    path: outPath,
    url: `data:image/png;base64,${(await fsp.readFile(outPath)).toString("base64")}`,
    hidden: readHiddenWorks().has(outName),
    ...meta,
  };
}

ipcMain.handle("flow:list-outputs", async (_event, payload) => {
  ensureDirs();
  const mode = payload?.mode === "hidden" ? "hidden" : "visible";
  const hiddenSet = readHiddenWorks();
  // 按修改时间倒序（新建/高清化/修正的作品才会出现在最上方）
  const allNames = (await fsp.readdir(outputDir())).filter((name) => /\.(png|jpe?g|webp)$/i.test(name));
  const withTime = [];
  for (const name of allNames) {
    if (mode === "hidden" ? !hiddenSet.has(name) : hiddenSet.has(name)) continue;
    let mtime = 0;
    try { mtime = (await fsp.stat(path.join(outputDir(), name))).mtimeMs; } catch {}
    withTime.push({ name, mtime });
  }
  const names = withTime
    .sort((a, b) => b.mtime - a.mtime || b.name.localeCompare(a.name))
    .slice(0, 60)
    .map((item) => item.name);
  const items = [];
  for (const name of names) {
    const filePath = path.join(outputDir(), name);
    const stat = await fsp.stat(filePath);
    const buffer = await fsp.readFile(filePath);
    const ext = path.extname(name).slice(1);
    let metadata = {};
    try {
      metadata = JSON.parse(await fsp.readFile(filePath.replace(/\.[^.]+$/, ".json"), "utf8"));
    } catch {}
    items.push({
      name,
      path: filePath,
      mtime: stat.mtimeMs,
      url: `data:image/${ext === "jpg" ? "jpeg" : ext};base64,${buffer.toString("base64")}`,
      hidden: hiddenSet.has(name),
      ...metadata,
    });
  }
  return items;
});

ipcMain.handle("flow:delete-output", async (_event, payload) => {
  const name = path.basename(String(payload?.name || ""));
  if (!name || !/\.(png|jpe?g|webp)$/i.test(name)) throw new Error("Invalid output name");
  const target = path.join(outputDir(), name);
  const resolved = path.resolve(target);
  if (!resolved.startsWith(path.resolve(outputDir()) + path.sep)) throw new Error("Invalid path");
  try { await fsp.unlink(resolved); } catch {}
  try { await fsp.unlink(resolved.replace(/\.[^.]+$/, ".json")); } catch {}
  return { ok: true };
});

ipcMain.handle("flow:hidden:list", () => ({ hidden: [...readHiddenWorks()] }));
ipcMain.handle("flow:hidden:set", (_event, payload) => setHiddenWorks(payload));
ipcMain.handle("flow:upscale", async (_event, payload) => upscaleImage(readConfig(), payload));
ipcMain.handle("flow:repair-region", async (_event, payload) => repairRegion(payload));
ipcMain.handle("flow:upscale:info", () => ({ models: listUpscaleModels(readConfig()) }));
ipcMain.handle("flow:repair-feet", async (_event, payload) => repairFeet(payload));

ipcMain.handle("flow:reveal", async (_event, target) => {
  if (typeof target === "string" && fs.existsSync(target)) shell.showItemInFolder(target);
  return true;
});

ipcMain.handle("flow:open-external", async (_event, url) => {
  if (typeof url === "string" && /^https?:\/\//.test(url)) await shell.openExternal(url);
  return true;
});

