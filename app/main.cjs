"use strict";

const { app, BrowserWindow, dialog, ipcMain, shell, nativeImage } = require("electron");
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
const LLM_BIN = process.env.LUMEN_LLM_BIN || "";
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
  comfyDir: "",
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
  nsfwWorkflow: true,
  llmMode: "local",
  llmModel: "",
  llmBin: "",
  llmDevice: "gpu",
  llmCtxSize: 8192,
  llmApiUrl: "https://api.openai.com/v1",
  llmApiKey: "",
  llmApiModel: "gpt-4o-mini",
  outputDir: "",
  referenceDir: "",
};

// ---------- 本机资源自动发现（避免写死路径） ----------
function resolveLlmBin(config) {
  const candidates = [
    config?.llmBin,
    process.env.LUMEN_LLM_BIN,
    path.join(dataRoot(), "models", "llm", "llama-server.exe"),
    path.join(path.dirname(app.getPath("exe")), "models", "llm", "llama-server.exe"),
    "F:\\novel\\llama-cpp\\llama-server.exe",
    "C:\\llama.cpp\\llama-server.exe",
  ].filter(Boolean);
  for (const candidate of candidates) {
    try {
      if (candidate && fs.existsSync(candidate)) return candidate;
    } catch {}
  }
  return "";
}

function dataRoot() {
  return path.join(app.getPath("appData"), "Lumen Studio Flow");
}

function outputDir() {
  const config = rawConfig();
  return config.outputDir || DEFAULT_CONFIG.outputDir || path.join(dataRoot(), "outputs");
}

function referenceLibraryRoot() {
  const config = readConfig();
  return config.referenceDir || path.join(dataRoot(), "references", "library") || path.join(__dirname, "..", "references", "library");
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

// 默认运行时位置：%APPDATA%\Lumen Studio Flow\runtime（可由用户改）
function defaultRuntimeDir() {
  return path.join(dataRoot(), "runtime");
}

function resolveComfyDir(config) {
  const configured = normalizeComfyDir(config?.comfyDir);
  if (configured) return configured;
  const candidates = [
    path.join(defaultRuntimeDir(), "ComfyUI_windows_portable"),
    path.join(defaultRuntimeDir(), "ComfyUI"),
    defaultRuntimeDir(),
  ];
  for (const candidate of candidates) {
    try {
      if (fs.existsSync(path.join(candidate, "ComfyUI", "main.py"))) return candidate;
      if (fs.existsSync(path.join(candidate, "main.py"))) return candidate;
    } catch {}
  }
  return defaultRuntimeDir();
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
  const root = resolveComfyDir(config);
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

// ---------- 角色外观覆盖（用户/策展数据，优先于内置库） ----------
function appearancePath() {
  return path.join(dataRoot(), "character-appearance.json");
}

function readAppearances() {
  try {
    const raw = fs.readFileSync(appearancePath(), "utf8");
    const data = JSON.parse(raw);
    return data && typeof data === "object" && !Array.isArray(data) ? data : {};
  } catch {
    return {};
  }
}

function writeAppearances(data) {
  try {
    fs.mkdirSync(dataRoot(), { recursive: true });
    fs.writeFileSync(appearancePath(), JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch {
    return false;
  }
}

// key 归一化：小写、去多余空格
function normalizeCharKey(name) {
  return String(name || "").toLowerCase().replace(/[_]+/g, " ").replace(/\s+/g, " ").trim();
}

// ---------- 角色特征禁用（主进程兜底，手写提示词也生效） ----------
let traitCatalogCache = null;
function loadTraitCatalog() {
  if (traitCatalogCache) return traitCatalogCache;
  const rows = [];
  for (const name of ["characters.json", "characters-extra.json"]) {
    try {
      const file = path.join(__dirname, "renderer", name);
      const data = JSON.parse(fs.readFileSync(file, "utf8"));
      if (Array.isArray(data?.characters)) rows.push(...data.characters);
    } catch {}
  }
  traitCatalogCache = rows;
  return rows;
}

const TRAIT_TAGS = [
  "animal ears", "cat ears", "fox ears", "wolf ears", "horse ears", "rabbit ears",
  "cat tail", "tail", "kemonomimi", "horns", "heterochromia", "elf ears", "pointy ears",
];

function containsToken(text, needle) {
  const haystack = String(text || "").toLowerCase();
  const word = String(needle || "").toLowerCase().trim();
  if (!word) return false;
  if (/[\u4e00-\u9fa5]/.test(word)) return word.length >= 2 && haystack.includes(word);
  if (word.length < 4) return false;
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`).test(haystack);
}

// 返回：命中的角色行 + 该角色不该出现的特征
function analyzeCharacterTraits(prompt) {
  const rows = loadTraitCatalog();
  if (!rows.length) return { rows: [], forbidden: [] };
  // 应用外观覆盖：覆盖里有的角色，用覆盖标签替换内置标签
  const overrides = readAppearances();
  if (Object.keys(overrides).length) {
    for (const row of rows) {
      const key = normalizeCharKey(row.tag);
      const extra = overrides[key] || overrides[normalizeCharKey(row.zh)];
      if (extra && Array.isArray(extra.tags) && extra.tags.length) {
        row.tags = extra.tags.slice();
      }
    }
  }
  const matched = [];
  for (const row of rows) {
    const names = [row.tag, row.name, row.zh, ...(row.aliases || [])].filter(Boolean);
    if (names.some((name) => containsToken(prompt, name))) matched.push(row);
    if (matched.length >= 3) break;
  }
  if (!matched.length) return { rows: [], forbidden: [] };
  // 用「类别」判断，兼容 fake animal ears / horse ears / cat tail 等写法
  const present = {
    ears: false,
    tail: false,
    horns: false,
    heterochromia: false,
  };
  for (const row of matched) {
    for (const tag of Array.isArray(row.tags) ? row.tags : []) {
      const low = String(tag).toLowerCase();
      if (/\b(animal|cat|fox|wolf|horse|rabbit|fake|elf|pointy)\b.*\bears?\b|\bkemonomimi\b/.test(low)) present.ears = true;
      if (/\btail\b/.test(low)) present.tail = true;
      if (/\bhorns?\b/.test(low)) present.horns = true;
      if (/heterochromia/.test(low)) present.heterochromia = true;
    }
  }
  const forbidden = [];
  if (!present.ears) forbidden.push("animal ears", "cat ears", "fox ears", "wolf ears", "horse ears", "kemonomimi");
  if (!present.tail) forbidden.push("cat tail", "tail");
  if (!present.horns) forbidden.push("horns");
  if (!present.heterochromia) forbidden.push("heterochromia");
  return { rows: matched, forbidden, present };
}

// ---------- 提示词清洗：粘进来的 JSON / 负向段 / 人数冲突 ----------
function extractJsonPrompt(text) {
  const raw = String(text || "");
  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first < 0 || last <= first) return null;
  const slice = raw.slice(first, last + 1);
  try {
    const data = JSON.parse(slice);
    if (!data || typeof data !== "object" || Array.isArray(data)) return null;
    const prompt = typeof data.prompt === "string" ? data.prompt : "";
    const negative = typeof data.negative_prompt === "string" ? data.negative_prompt : "";
    if (!prompt.trim()) return null;
    return { prompt, negative, character: String(data.character || ""), before: raw.slice(0, first), after: raw.slice(last + 1) };
  } catch {
    return null;
  }
}

// 去掉提示词里的负向段落（"negative:" / "NEGATIVE：" / "negative_prompt" 之后的内容）
function stripInlineNegative(text) {
  let out = String(text || "");
  const markers = [/\bnegative_prompt\b\s*[:：]?/i, /\bnegative\s*[:：]/i, /\bnegative\b\s*[:：]/i, /负面(提示词)?\s*[:：]/];
  for (const marker of markers) {
    const match = marker.exec(out);
    if (match && match.index > 0) {
      out = out.slice(0, match.index);
    }
  }
  return out;
}

// 单人/多人冲突：以明确写法为准，冲突的一方进负面
function reconcileHeadcount(promptTags, negative) {
  const lower = promptTags.map((tag) => tag.toLowerCase());
  const single = lower.some((tag) => tag === "1girl" || tag === "1boy" || tag === "solo");
  const multi = lower.filter((tag) => /^(2girls|3girls|multiple girls|2boys|multiple boys|group)$/.test(tag));
  if (single && multi.length) {
    const keepSolo = !lower.includes("solo") ? [...promptTags, "solo"] : promptTags;
    const cleaned = keepSolo.filter((tag) => !/^(2girls|3girls|multiple girls|2boys|multiple boys)$/i.test(tag));
    for (const tag of multi) {
      if (!new RegExp(`(^|,\\s*)${tag}(,|$)`, "i").test(negative)) negative = `${tag}, ${negative}`;
    }
    return { promptTags: cleaned, negative };
  }
  return { promptTags, negative };
}

// 单人声明下只保留第一个角色，其余角色进负面
function collapseCharacters(promptTags, negative) {
  const lower = promptTags.map((tag) => tag.toLowerCase());
  const single = lower.some((tag) => tag === "1girl" || tag === "1boy" || tag === "solo");
  if (!single) return { promptTags, negative, dropped: [] };
  const charTags = promptTags.filter((tag) => /\([^)]+\)\s*$/.test(tag) && !/^\d+girls?|^\d+boys?/i.test(tag));
  if (charTags.length <= 1) return { promptTags, negative, dropped: [] };
  const keep = charTags[0];
  const dropped = charTags.slice(1);
  const cleaned = promptTags.filter((tag) => tag === keep || !dropped.includes(tag));
  for (const tag of dropped) {
    if (!negative.toLowerCase().includes(tag.toLowerCase())) negative = `${tag} (wrong character), ${negative}`;
  }
  return { promptTags: cleaned, negative, dropped };
}

function sanitizePromptText(prompt, negative) {
  let text = String(prompt || "");
  let neg = String(negative || "");
  const extracted = extractJsonPrompt(text);
  if (extracted) {
    const around = `${extracted.before} ${extracted.after}`.replace(/[{}\[\]"]/g, " ").replace(/\s+/g, " ").trim();
    text = around ? `${extracted.prompt}, ${around}` : extracted.prompt;
    // JSON 里的角色字段只作参考，真正的角色以 prompt 内为准
    if (extracted.negative) {
      neg = neg ? `${neg}, ${extracted.negative}` : extracted.negative;
    }
  }
  text = stripInlineNegative(text);
  let tags = text.split(",").map((tag) => tag.trim()).filter(Boolean);
  const reconciled = reconcileHeadcount(tags, neg);
  tags = reconciled.promptTags;
  neg = reconciled.negative;
  const collapsed = collapseCharacters(tags, neg);
  tags = collapsed.promptTags;
  neg = collapsed.negative;
  return { prompt: tags.join(", "), negative: neg, droppedCharacters: collapsed.dropped, extractedJson: Boolean(extracted) };
}

// ---------- 外观注入：角色库的外观标签强制写进提示词 ----------
const APPEARANCE_TAG_RE = /^(?:(?:blonde|brown|black|blue|green|red|pink|purple|silver|white|orange|grey|gray|aqua)\s+hair|(?:long|short|very long|medium|absurdly long)\s+hair|twintails|ponytail|braid|french braid|bun|bob cut|hime cut|drill hair|side ponytail|twin braids|hair intakes|blunt bangs|ahoge|hair between eyes|(?:blue|green|red|purple|golden|yellow|pink|orange|grey|gray|aqua|brown|amber)\s+eyes|small breasts|medium breasts|large breasts|huge breasts|flat chest|cleavage|collarbone|navel|thick thighs|toned|animal ears|cat ears|fox ears|wolf ears|horse ears|rabbit ears|fake animal ears|kemonomimi|horns|cat tail|tail|halo|wings|elf ears|pointy ears|heterochromia)$/i;

const HAIR_COLORS = ["blonde", "brown", "black", "blue", "green", "red", "pink", "purple", "silver", "white", "orange", "grey", "gray", "aqua"];
const EYE_COLORS = ["blue", "green", "red", "purple", "golden", "yellow", "pink", "orange", "grey", "gray", "aqua", "brown", "amber"];

function appearanceTagsOf(tags) {
  return (tags || []).map((tag) => String(tag).trim().toLowerCase()).filter((tag) => APPEARANCE_TAG_RE.test(tag));
}

// 把库里的外观写进提示词：删掉冲突的发色/瞳色，插入正确标签
function injectAppearance(prompt, tags) {
  const appearance = appearanceTagsOf(tags);
  if (!appearance.length) return { prompt, added: [] };
  const wantHair = appearance.filter((tag) => /^(blonde|brown|black|blue|green|red|pink|purple|silver|white|orange|grey|gray|aqua) hair$/.test(tag));
  const wantEyes = appearance.filter((tag) => /^(blue|green|red|purple|golden|yellow|pink|orange|grey|gray|aqua|brown|amber) eyes$/.test(tag));

  let parts = prompt.split(",").map((item) => item.trim()).filter(Boolean);
  const lower = parts.map((item) => item.toLowerCase());

  // 1) 删掉与库冲突的发色（库里有明确发色时）
  if (wantHair.length) {
    parts = parts.filter((item, index) => {
      const low = lower[index];
      const isHairColor = HAIR_COLORS.some((color) => low === `${color} hair`);
      return !isHairColor || wantHair.includes(low);
    });
  }
  // 2) 删掉与库冲突的瞳色
  if (wantEyes.length) {
    parts = parts.filter((item, index) => {
      const low = lower[index];
      const isEyeColor = EYE_COLORS.some((color) => low === `${color} eyes`);
      return !isEyeColor || wantEyes.includes(low);
    });
  }
  // 3) 补进缺失的外观标签（插在角色 tag 之后更靠前的位置）
  const have = new Set(parts.map((item) => item.toLowerCase()));
  const missing = appearance.filter((tag) => !have.has(tag));
  if (missing.length) {
    const insertAt = Math.min(parts.length, 8);
    parts = [...parts.slice(0, insertAt), ...missing, ...parts.slice(insertAt)];
  }
  return { prompt: parts.join(", "), added: missing };
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
  const CENSOR_TAGS = ["censored", "mosaic censoring", "bar censor", "pixelated", "pixelation", "censor bar", "mosaic"];

// 单人硬约束：声明 solo/1girl 时把「多人」负面前置
  // （负面太长会被编码器截断，放末尾等于没写）
  // 始终不打码：移除 safe 与所有打码相关词，并反向压制模型自带的打码倾向
  prompt = prompt.replace(/(^|,\s*)safe(,|$)/gi, "$1$2").replace(/,\s*,/g, ",").replace(/^,\s*/, "").trim();
  {
    const stripCensor = (text) => {
      let out = String(text || "");
      for (const tag of CENSOR_TAGS) {
        out = out.replace(new RegExp(`(^|,\\s*)${tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(,|$)`, "gi"), "$1$2");
      }
      return out.replace(/,\s*,/g, ",").replace(/^,\s*/, "").replace(/,\s*$/, "").trim();
    };
    prompt = stripCensor(prompt);
    negative = stripCensor(negative);
    if (!/(^|,\s*)uncensored(,|$)/i.test(negative)) {
      negative += ", censored, mosaic censoring, pixelated, censor bar";
    }
  }

  // 人数一致性：多人请求时不注入「多人」负面，并删掉矛盾的 solo / 1girl
  const multiRequested = /(^|,\s*)(2girls|2boys|3girls|3boys|multiple girls|multiple boys|group)(,|$)/i.test(prompt);
  if (multiRequested) {
    prompt = prompt
      .replace(/(^|,\s*)solo(,|$)/gi, "$1$2")
      .replace(/(^|,\s*)1girl(,|$)/gi, "$1$2")
      .replace(/(^|,\s*)1boy(,|$)/gi, "$1$2")
      .replace(/,\s*,/g, ",").replace(/^,\s*/, "").replace(/,\s*$/, "").trim();
    // 反向：负面里如果写了人数限制，删掉，否则模型被要求「不要两个人」
    negative = negative
      .replace(/(^|,\s*)(2girls|2boys|multiple girls|multiple boys|crowd|duplicate)(,|$)/gi, "$1$2")
      .replace(/,\s*,/g, ",").replace(/^,\s*/, "").replace(/,\s*$/, "").trim();
  }
  // ⓪ 清洗：粘进来的 JSON、负向段、人数冲突、多余角色
  try {
    const cleaned = sanitizePromptText(prompt, negative);
    prompt = cleaned.prompt;
    negative = cleaned.negative;
    if (cleaned.extractedJson) {
      try { send("flow:progress", { stage: "已从粘贴的 JSON 中提取提示词", progress: 0.02 }); } catch {}
    }
    if (cleaned.droppedCharacters?.length) {
      try { send("flow:progress", { stage: `单人请求：已移除多余角色 ${cleaned.droppedCharacters.join(", ")}`, progress: 0.03 }); } catch {}
    }
  } catch {}

  // ① 用角色库里的外观强制纠正提示词（手写也能生效）
  try {
    const matched = analyzeCharacterTraits(prompt).rows || [];
    if (matched.length) {
      const result = injectAppearance(prompt, matched[0].tags);
      prompt = result.prompt;
    }
  } catch {}

  // 角色设定禁止的特征（兽耳/尾巴/异瞳…）：从正向删掉，写进负面
  {
    const fromPayload = Array.isArray(payload.forbiddenTags)
      ? payload.forbiddenTags.map((tag) => String(tag || "").trim().toLowerCase()).filter(Boolean)
      : [];
    let fromCatalog = [];
    try {
      fromCatalog = analyzeCharacterTraits(prompt).forbidden;
    } catch {
      fromCatalog = [];
    }
    const forbidden = [...new Set([...fromPayload, ...fromCatalog])];
    if (forbidden.length) {
      let cleaned = prompt;
      for (const tag of forbidden) {
        const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        cleaned = cleaned.replace(new RegExp(`(^|,\\s*)${escaped}(,|$)`, "gi"), "$1$2");
      }
      prompt = cleaned.replace(/,\s*,/g, ",").replace(/^,\s*/, "").replace(/,\s*$/, "").trim();
      const missing = forbidden.filter((tag) => !new RegExp(`(^|,\\s*)${tag}(,|$)`, "i").test(negative));
      if (missing.length) negative = `${missing.join(", ")}, ${negative}`;
    }
  }

  if (!multiRequested && /(^|,|\s)(solo|1girl|1boy)(,|\s|$)/i.test(prompt)) {
    // 单人请求：加重反群像权重
    const antiCrowd = ["multiple girls:1.35", "2girls:1.35", "crowd:1.25", "background characters:1.25", "character sheet:1.2"];
    for (const tag of antiCrowd) {
      if (!new RegExp(`(^|,\\s*)${tag.split(":")[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\s*:|,|$)`, "i").test(negative)) {
        negative = `${tag}, ${negative}`;
      }
    }
  }

  const soloRequested = !multiRequested && /(^|,|\s)(solo|1girl|1boy)(,|\s|$)/i.test(prompt);
  if (soloRequested) {
    const crowdNegatives = [
      "2girls", "multiple girls", "crowd", "group", "character sheet",
      "multiple views", "duplicate", "extra person", "background characters", "audience",
    ];
    const missing = crowdNegatives.filter((tag) => !new RegExp(`(^|,\\s*)${tag}(,|$)`, "i").test(negative));
    if (missing.length) negative = `${missing.join(", ")}, ${negative}`;
  }
  if (/feet|foot|toes|barefoot|footwear|足|脚|丝袜|裸足/i.test(prompt)) {
    prompt += ", detailed toes, five toes per foot, accurate toe count, clean foot anatomy, detailed soles";
    negative += ", missing toes, extra toes, fused toes, deformed feet, bad feet";
  }
  // 场景一致性：室内请求不要出现户外光景（AI 偶尔会自作主张加树影阳光）
  {
    const indoor = /卧室|床上|床|室内|房间|浴室|浴室|客厅|教室|办公室|bedroom|indoor|bed\b|bathroom|room/i.test(prompt);
    if (indoor) {
      const OUTDOOR = [
        "under tree", "tree shade", "tree trunk", "dappled sunlight", "sunlight through leaves",
        "natural sunlight", "outdoors", "forest", "sky", "clouds", "grass field", "beach",
      ];
      let cleaned = prompt;
      for (const tag of OUTDOOR) {
        cleaned = cleaned.replace(new RegExp(`(^|,\\s*)${tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(,|$)`, "gi"), "$1$2");
      }
      const next = cleaned.replace(/,\s*,/g, ",").replace(/^,\s*/, "").replace(/,\s*$/, "").trim();
      if (next !== prompt) {
        prompt = next;
        negative += ", outdoors, tree, sunlight through leaves, dappled sunlight";
      }
    }
  }

  // 反水彩/反凌乱：除非用户明确要水彩，否则剔除这类正向词并压制
  {
    const askedWatercolor = /水彩|水粉|水墨|watercolo?r|gouache|ink wash|painterly|厚涂/i.test(String(payload.prompt || ""));
    const MESSY_TAGS = [
      "watercolor", "watercolour", "watercolor (medium)", "gouache",
      "painterly", "painterly brushwork", "oil painting", "brush strokes",
      "messy lines", "rough lineart", "sketchy lineart", "rough sketch",
      "soft focus", "hazy", "blurry lines", "muddy colors", "impressionist",
    ];
    if (!askedWatercolor) {
      let cleaned = prompt;
      for (const tag of MESSY_TAGS) {
        cleaned = cleaned.replace(new RegExp(`(^|,\\s*)${tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(,|$)`, "gi"), "$1$2");
      }
      prompt = cleaned.replace(/,\s*,/g, ",").replace(/^,\s*/, "").replace(/,\s*$/, "").trim();
      negative += ", watercolor, painterly, oil painting, brush strokes, messy lines, rough lineart, sketchy, soft focus, hazy, blurry lines, muddy colors, impressionist";
    }
  }

  // 默认画面风格：线条明朗 + 画面丰富（用户可自行删掉，已存在则不重复追加）
  {
    const DEFAULT_STYLE = [
      "film still", "detailed background", "anamorphic", "anime cel shading",
      "flat colors", "bold clean lineart", "crisp lineart", "sharp outlines",
      "limited palette", "2D animation key visual",
      "professional illustration", "dynamic composition", "depth of field",
      "vibrant colors", "high contrast", "detailed eyes",
    ];
    const lowerPrompt = `, ${prompt.toLowerCase()}, `;
    const missing = DEFAULT_STYLE.filter((tag) => !lowerPrompt.includes(`, ${tag}, `));
    if (missing.length) prompt = `${prompt}, ${missing.join(", ")}`;
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
    prompt,
    negative,
    steps,
    totalSteps: steps + (hires ? hiresSteps : 0),
    hiresSteps: hires ? hiresSteps : 0,
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
    bin: resolveLlmBin(config) || LLM_BIN,
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

// 本地模型自动发现：设置里的路径不存在时，回到 models\llm 下找任意 gguf
function resolveLlmModelPath(config) {
  const configured = String(config.llmModel || "").trim();
  if (configured && fs.existsSync(configured)) return configured;
  const candidates = [
    configured,
    LLM_MODEL,
    path.join(app.getPath("userData"), "models", "llm"),
    path.join(process.resourcesPath || "", "models", "llm"),
    path.join(app.getAppPath(), "..", "models", "llm"),
  ].filter(Boolean);
  for (const candidate of candidates) {
    try {
      if (!fs.existsSync(candidate)) continue;
      const stat = fs.statSync(candidate);
      if (stat.isFile() && /\.gguf$/i.test(candidate)) return candidate;
      if (stat.isDirectory()) {
        const found = fs.readdirSync(candidate).filter((name) => /\.gguf$/i.test(name)).sort();
        if (found.length) return path.join(candidate, found[0]);
      }
    } catch {}
  }
  return configured || LLM_MODEL;
}

async function startLlm() {
  const config = readConfig();
  if ((config.llmMode || "local") === "external") return llmStatus();
  if (await llmHealthy()) return llmStatus();
  if (llmStartPromise) return llmStartPromise;
  const bin = resolveLlmBin(config) || LLM_BIN;
  const model = resolveLlmModelPath(config);
  if (!fs.existsSync(bin)) throw new Error("本地 AI 运行时不存在，请在设置中配置 llama-server 路径");
  if (!fs.existsSync(model)) throw new Error("本地 AI 模型不存在，请在设置中配置 GGUF 路径");
  llmStartPromise = (async () => {
    await stopLlm();
    const useGpu = (config.llmDevice || "gpu") === "gpu";
    if (useGpu) await stopComfyForLlm();
    const cores = Math.max(4, Math.min(16, (os.cpus()?.length || 8) - 2));
    // 上下文长度：默认 8192（4096 在带角色事实/多轮对话时容易截断）；可在设置里调大到 32768
    const rawCtx = Number(config.llmCtxSize) || 8192;
    const ctxSize = Math.max(2048, Math.min(32768, Math.round(rawCtx / 512) * 512));
    const args = [
      "--model", model,
      "--host", "127.0.0.1",
      "--port", String(LLM_PORT),
      "--ctx-size", String(ctxSize),
      "--n-gpu-layers", useGpu ? "99" : "0",
      "--threads", String(cores),
      "--no-webui",
    ];
    // 显卡模式下开 flash attention：同样显存能容纳更长上下文
    if (useGpu) args.push("--flash-attn", "on");
    llmProcess = spawn(bin, args, { windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
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
  const root = resolveComfyDir(config);
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

// ---------- 参考图单人裁切 ----------
function tutorialPath() {
  return app.isPackaged
    ? path.join(process.resourcesPath, "tutorial", "index.html")
    : path.join(__dirname, "..", "docs", "tutorial", "index.html");
}

async function openTutorial() {
  const file = tutorialPath();
  if (!fs.existsSync(file)) throw new Error("教程文件缺失，请重新安装应用");
  await shell.openPath(file);
  return { ok: true, file };
}

function cropSingleScript() {
  return app.isPackaged
    ? path.join(process.resourcesPath, "crop-single.py")
    : path.join(__dirname, "crop-single.py");
}

async function cropReferenceToSingle(payload) {
  const config = readConfig();
  const id = String(payload?.id || "");
  const items = listReferences();
  const item = items.find((entry) => entry.id === id) || items.find((entry) => entry.file === payload?.file);
  if (!item) throw new Error("找不到这张参考图");

  const script = cropSingleScript();
  if (!fs.existsSync(script)) throw new Error("裁切脚本缺失，请重新安装应用");
  const python = resolvePythonForTools(config);
  if (!python) throw new Error("找不到 Python，无法裁切");

  const source = path.join(referenceLibraryRoot(), item.file);
  if (!fs.existsSync(source)) throw new Error("参考图文件不存在");
  const outPath = path.join(writableTempDir(), `ref-single-${Date.now()}${path.extname(item.file) || ".png"}`);
  const result = spawnSync(python, [script, source, outPath], { encoding: "utf8", timeout: 120000, windowsHide: true });
  const line = String(result.stdout || "").trim().split(/\r?\n/).pop() || "";
  let parsed = {};
  try { parsed = JSON.parse(line); } catch {}
  if (!parsed?.ok) {
    if (parsed?.reason === "single") return { ok: false, reason: "single", people: parsed.people || 1 };
    throw new Error(`裁切失败：${parsed?.reason || String(result.stderr || "").slice(-160)}`);
  }

  // 不覆盖原图：另存为一条新的单人参考（原条目保持原样）
  const root = referenceLibraryRoot();
  const newId = `ref_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const newFile = `${newId}.png`;
  await fsp.copyFile(outPath, path.join(root, newFile));
  try { await fsp.unlink(outPath); } catch {}
  const nextItems = referenceLibraryIndex();
  nextItems.unshift({
    id: newId,
    category: item.category,
    categoryType: item.categoryType || "",
    name: `${item.name || "reference"} · 单人`,
    file: newFile,
    note: `从 ${item.name || item.file} 裁出的单人版（${parsed.people} 人 → 1 人）`,
    createdAt: new Date().toISOString(),
  });
  writeReferenceLibrary(nextItems);
  return { ok: true, people: parsed.people, file: newFile, source: item.file, bbox: parsed.bbox };
}

function LUMEN_ARCHIVE_DIR() {
  return path.join(path.dirname(app.getAppPath()), "_archive");
}

// 运行时探测真正可写的临时目录（Electron 的 temp 与 python 的 TEMP 可能不一致）
function writableTempDir() {
  const candidates = [
    path.join(outputDir(), "_tmp"),   // 与作品同盘，python 一定有写权限（实测 C 盘 temp 不可写）
    outputDir(),
    path.join(dataRoot(), "tmp"),
    app.getPath("temp"),
    os.tmpdir(),
  ];
  for (const dir of candidates) {
    if (!dir) continue;
    try {
      fs.mkdirSync(dir, { recursive: true });
      const probe = path.join(dir, `.lumen-write-probe-${process.pid}-${Date.now()}`);
      fs.writeFileSync(probe, "ok");
      fs.unlinkSync(probe);
      return dir;
    } catch {}
  }
  return os.tmpdir();
}

// 角色名解析：让模型给出最可能的 canonical tag，再由本地库验证是否真实存在
async function resolveCharacterTag(text) {
  const config = readConfig();
  if ((config.llmMode || "local") === "external") return "";
  await startLlm();
  try {
    const response = await fetch(`http://127.0.0.1:${LLM_PORT}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "lumen-local",
        messages: [
          { role: "system", content: "从用户这句话里找出角色名，输出它对应的英文 danbooru 角色 tag。只输出 tag 本身，不要引号、不要解释。例：晓美焰→akemi homura (magical girl)；明日香→souryuu asuka langley；艾伦耶格尔→eren yeager；刻晴→keqing (genshin impact)。不确定就输出空字符串。" },
          { role: "user", content: String(text || "").slice(0, 500) },
        ],
        temperature: 0.0,
        max_tokens: 48,
        stream: false,
        chat_template_kwargs: { enable_thinking: false },
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) return "";
    const data = await response.json();
    const raw = String(data?.choices?.[0]?.message?.content || "").trim();
    return raw.replace(/^["'`]+|["'`]+$/g, "").replace(/\s+/g, " ").toLowerCase().slice(0, 80);
  } catch {
    return "";
  }
}

// Qwen3 系模型默认会「先思考再回答」，白烧一半 token；本地场景直接关掉
function withNoThink(messages, modelPath) {
  if (!/qwen/i.test(String(modelPath || ""))) return messages;
  return messages.map((msg, index) => (
    index === 0 && msg.role === "system"
      ? { ...msg, content: `${msg.content}\n\n/no_think` }
      : msg
  ));
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
        messages: withNoThink(messages, resolveLlmModelPath(config)),
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
      messages: withNoThink(messages, resolveLlmModelPath(config)),
      temperature: 0.4,
      top_p: 0.9,
      max_tokens: 2600,
      stream: true,
      repeat_penalty: 1.08,
      repeat_last_n: 512,
      chat_template_kwargs: { enable_thinking: false },
      response_format: LLM_RESPONSE_FORMAT,
    }),
    signal: AbortSignal.timeout(180000),
  });
  if (!response.ok) throw new Error(`本地 AI 请求失败 (${response.status})`);
  const content = await readLlmStream(response);
  return { content, status: llmStatus() };
}

// 当前生成任务（用于取消）
const activeJob = { promptId: "", aborted: false };

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
    try {
      const tempRef = path.join(writableTempDir(), `ref-check-${Date.now()}.png`);
      const base64 = String(payload.initImage).split(",").pop() || "";
      await fsp.writeFile(tempRef, Buffer.from(base64, "base64"));
      const refPeople = countPeople(config, tempRef);
      try { await fsp.unlink(tempRef); } catch {}
      if (refPeople > 1 && /(^|,|\s)(solo|1girl|1boy)(,|\s|$)/i.test(String(payload.prompt || ""))) {
        send("flow:progress", {
          stage: `注意：参考图检测到 ${refPeople} 人，会带到结果里。建议先在参考库点「裁单人」。`,
          progress: 0.015,
        });
      }
    } catch {}
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
  activeJob.promptId = promptId;
  activeJob.aborted = false;

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
    if (activeJob.aborted) throw new Error("已取消生成");
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
        prompt: String(built.prompt || payload.prompt || ""),
        negativePrompt: String(built.negative || payload.negative || ""),
        rawPrompt: String(payload.prompt || ""),
        seed: built.seed,
        steps: built.steps,
        totalSteps: built.totalSteps,
        hires: built.hires,
        hiresSteps: built.hiresSteps,
        cfg: built.cfg,
        batch: built.batch,
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
  // 单人校验：声明 solo/1girl 时逐张数人，多于 1 人自动重跑（最多 2 次）
  const soloWanted = /(^|,|\s)(solo|1girl|1boy)(,|\s|$)/i.test(String(built.prompt || payload.prompt || ""));
  if (soloWanted && images.length && String(payload.engine || config.engine || "local") !== "api") {
    const boost = "2girls, multiple girls, crowd, group, character sheet, duplicate, extra person, background characters, audience";
    for (let index = 0; index < images.length; index += 1) {
      let people = countPeople(config, images[index].path);
      let attempt = 0;
      while (people > 1 && attempt < 2) {
        attempt += 1;
        send("flow:progress", {
          stage: `Single-subject check: ${people} people, retrying (${attempt}/2)...`,
          progress: 0.96,
        });
        try {
          let retryPrompt = String(built.prompt || payload.prompt || "");
          if (attempt >= 2) {
            retryPrompt = retryPrompt
              .replace(/,?\s*(japanese\s+)?anime\s+key\s+visual/gi, "")
              .replace(/,?\s*key\s+visual/gi, "")
              .replace(/,?\s*(ensemble|cast|poster|group shot)/gi, "")
              .trim();
            if (!/simple background|single character/i.test(retryPrompt)) {
              retryPrompt += ", single character focus, simple background";
            }
          }
          const retryPayload = {
            ...payload,
            prompt: retryPrompt,
            batch: 1,
            seed: Math.floor(Math.random() * 2 ** 31),
            negative: `${boost}, key visual, ensemble cast, ${built.negative || payload.negative || ""}`,
          };
          const retryBuilt = buildWorkflow(config, retryPayload, initImageName, characterImageName, textureImageName);
          const files = await runWorkflowRaw(config, retryBuilt.workflow);
          if (files.length) {
            await fsp.writeFile(images[index].path, files[0].buffer);
            images[index].url = `data:image/png;base64,${files[0].buffer.toString("base64")}`;
            images[index].seed = retryBuilt.seed;
            images[index].singleRetry = attempt;
            await fsp.writeFile(
              images[index].path.replace(/\.png$/i, ".json"),
              JSON.stringify({
                name: images[index].name,
                prompt: String(retryBuilt.prompt || payload.prompt || ""),
                negativePrompt: String(retryBuilt.negative || retryPayload.negative || ""),
                rawPrompt: String(payload.prompt || ""),
                seed: retryBuilt.seed,
                steps: retryBuilt.steps,
                cfg: retryBuilt.cfg,
                width: retryBuilt.width,
                height: retryBuilt.height,
                model: payload.unet || config.unet,
                singleRetry: attempt,
                createdAt: new Date().toISOString(),
              }, null, 2),
              "utf8",
            );
            people = countPeople(config, images[index].path);
          }
        } catch (error) {
          send("flow:progress", {
            stage: `Single-subject retry failed: ${error?.message || error}`,
            progress: 0.97,
          });
          break;
        }
      }
      if (people > 1) {
        send("flow:progress", { stage: `仍检测到 ${people} 人，正在裁到主体…`, progress: 0.98 });
        try {
          const crop = cropToPrimarySubject(config, images[index].path);
          if (crop.ok) {
            const buffer = await fsp.readFile(images[index].path);
            images[index].url = `data:image/png;base64,${buffer.toString("base64")}`;
            images[index].croppedToSubject = true;
            const metaPath = images[index].path.replace(/\.png$/i, ".json");
            try {
              const meta = JSON.parse(await fsp.readFile(metaPath, "utf8"));
              meta.croppedToSubject = true;
              meta.cropBox = crop.box;
              await fsp.writeFile(metaPath, JSON.stringify(meta, null, 2), "utf8");
            } catch {}
            people = countPeople(config, images[index].path);
          }
        } catch {}
        if (people > 1) {
          send("flow:progress", { stage: `仍有 ${people} 人（已尽力）`, progress: 0.985 });
        }
      }
    }
  }

  const repairNote = String(payload.repairNote || "").trim();
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
        const upgraded = await upscaleImage(config, { name: original.name, factor, model, overwrite: true });
        images[index] = upgraded;
      } catch (error) {
        send("flow:progress", {
          stage: `Upscale skipped (${index + 1}/${images.length}): ${error?.message || error}`,
          progress: 0.99,
        });
      }
    }
  }
  send("flow:progress", { stage: "Working...", progress: 1 });
  activeJob.promptId = "";
  return { images, seed: built.seed, promptId, width: built.width, height: built.height };
}

function enhanceDetailScript() {
  return app.isPackaged
    ? path.join(process.resourcesPath, "enhance-detail.py")
    : path.join(__dirname, "enhance-detail.py");
}

// 高清化后做一次线条/细节强化，避免放大后糊成一坨
function enhanceDetail(config, imagePath, strength = 1.0) {
  const script = enhanceDetailScript();
  if (!fs.existsSync(script)) return { ok: false, reason: "script missing" };
  const python = resolvePythonForTools(config);
  if (!python) return { ok: false, reason: "python missing" };
  const tmp = path.join(writableTempDir(), `enhance-${Date.now()}${path.extname(imagePath) || ".png"}`);
  const result = spawnSync(python, [script, imagePath, tmp, String(strength)], { encoding: "utf8", timeout: 180000, windowsHide: true });
  if (!fs.existsSync(tmp)) {
    return { ok: false, reason: String(result?.stderr || result?.stdout || "").slice(-140) };
  }
  try {
    fs.copyFileSync(tmp, imagePath);
  } finally {
    try { fs.unlinkSync(tmp); } catch {}
  }
  return { ok: true };
}

// 仍然检测到多人时，裁到画面主体（只留一个人），保证单人请求不出多余角色
function cropToPrimarySubject(config, imagePath) {
  const script = cropSingleScript();
  if (!fs.existsSync(script)) return { ok: false, reason: "script missing" };
  const python = resolvePythonForTools(config);
  if (!python) return { ok: false, reason: "python missing" };
  const tmp = path.join(writableTempDir(), `crop-${Date.now()}${path.extname(imagePath) || ".png"}`);
  const result = spawnSync(python, [script, imagePath, tmp], { encoding: "utf8", timeout: 120000, windowsHide: true });
  if (!fs.existsSync(tmp)) {
    return { ok: false, reason: String(result?.stderr || result?.stdout || "").slice(-140) };
  }
  try {
    fs.copyFileSync(tmp, imagePath);
  } finally {
    try { fs.unlinkSync(tmp); } catch {}
  }
  let parsed = {};
  try { parsed = JSON.parse(String(result.stdout || "").trim().split(/\r?\n/).pop() || "{}"); } catch {}
  return { ok: Boolean(parsed?.ok), people: parsed?.people || 0, box: parsed?.bbox };
}

function countPeopleScript() {
  return app.isPackaged
    ? path.join(process.resourcesPath, "count-people.py")
    : path.join(__dirname, "count-people.py");
}

function countPeople(config, imagePath) {
  const script = countPeopleScript();
  if (!fs.existsSync(script)) return -1;
  const python = resolvePythonForTools(config);
  if (!python) return -1;
  try {
    const result = spawnSync(python, [script, imagePath], { encoding: "utf8", timeout: 60000, windowsHide: true });
    const line = String(result.stdout || "").trim().split(/\r?\n/).pop() || "";
    const parsed = JSON.parse(line);
    return Number.isFinite(parsed?.people) ? parsed.people : -1;
  } catch {
    return -1;
  }
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
ipcMain.handle("flow:references:crop-single", (_event, payload) => cropReferenceToSingle(payload));
ipcMain.handle("flow:tutorial:open", () => openTutorial());
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
ipcMain.handle("flow:llm:resolve-tag", (_event, payload) => resolveCharacterTag(payload?.text));
ipcMain.handle("flow:cancel", async () => {
  activeJob.aborted = true;
  try {
    const config = readConfig();
    await comfyFetch(config.comfyUrl, "/interrupt", { method: "POST", body: "{}", headers: { "Content-Type": "application/json" } }, 5000);
    await comfyFetch(config.comfyUrl, "/queue", { method: "POST", body: JSON.stringify({ clear: true }), headers: { "Content-Type": "application/json" } }, 5000);
  } catch {}
  return { ok: true };
});

ipcMain.handle("flow:character:appearance:list", () => readAppearances());
ipcMain.handle("flow:character:appearance:set", (_event, payload) => {
  const key = normalizeCharKey(payload?.name);
  const tags = Array.isArray(payload?.tags)
    ? payload.tags.map((tag) => String(tag || "").trim()).filter(Boolean)
    : String(payload?.tags || "").split(",").map((tag) => tag.trim()).filter(Boolean);
  if (!key || !tags.length) return { ok: false, reason: "name/tags required" };
  const data = readAppearances();
  data[key] = { tags, updatedAt: new Date().toISOString() };
  const ok = writeAppearances(data);
  return { ok, count: Object.keys(data).length };
});
ipcMain.handle("flow:character:appearance:remove", (_event, payload) => {
  const key = normalizeCharKey(payload?.name);
  const data = readAppearances();
  if (data[key]) delete data[key];
  const ok = writeAppearances(data);
  return { ok, count: Object.keys(data).length };
});

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

// ---------- 放大模型安装（其他设备首次使用时补齐） ----------
const UPSCALE_MODEL_SOURCES = [
  {
    name: "RealESRGAN_x4plus_anime_6B.pth",
    urls: [
      "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.2.4/RealESRGAN_x4plus_anime_6B.pth",
    ],
    minBytes: 10 * 1024 * 1024,
  },
  {
    name: "RealESRGAN_x4plus.pth",
    urls: [
      "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth",
    ],
    minBytes: 40 * 1024 * 1024,
  },
  {
    name: "RealESRGAN_x2plus.pth",
    urls: [
      "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.1/RealESRGAN_x2plus.pth",
    ],
    minBytes: 40 * 1024 * 1024,
  },
];

async function downloadTo(url, dest, minBytes = 1024 * 1024, tries = 3) {
  let lastError = null;
  for (let attempt = 1; attempt <= tries; attempt += 1) {
    try {
      const response = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(20 * 60 * 1000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length < minBytes) throw new Error(`文件过小（${buffer.length} 字节）`);
      await fsp.writeFile(dest, buffer);
      return buffer.length;
    } catch (error) {
      lastError = error;
      if (attempt < tries) await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
    }
  }
  throw lastError || new Error("下载失败");
}

async function installUpscaleModels() {
  const config = readConfig();
  const dir = upscaleModelDir(config);
  await fsp.mkdir(dir, { recursive: true });
  const existing = listUpscaleModels(config);
  const installed = [];
  const failed = [];
  for (let index = 0; index < UPSCALE_MODEL_SOURCES.length; index += 1) {
    const item = UPSCALE_MODEL_SOURCES[index];
    if (existing.includes(item.name)) {
      installed.push(item.name);
      continue;
    }
    send("flow:progress", {
      stage: `下载放大模型 ${index + 1}/${UPSCALE_MODEL_SOURCES.length}：${item.name}`,
      progress: (index + 1) / (UPSCALE_MODEL_SOURCES.length + 1),
    });
    let done = false;
    for (const url of item.urls) {
      try {
        await downloadTo(url, path.join(dir, item.name), item.minBytes || 1024 * 1024);
        installed.push(item.name);
        done = true;
        break;
      } catch (error) {
        send("flow:progress", {
          stage: `下载失败（换下一个源）：${item.name}`,
          progress: (index + 1) / (UPSCALE_MODEL_SOURCES.length + 1),
        });
      }
    }
    if (!done) failed.push(item.name);
  }
  return { installed, failed, dir };
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
    const outPath = path.join(writableTempDir(), `lumen-erase-${Date.now()}.png`);
    const runErase = (target) => spawnSync(
      python,
      [script, sourcePath, target, String(rx), String(ry), String(rw), String(rh), String(payload?.donor || "auto")],
      { encoding: "utf8", timeout: 120000, windowsHide: true },
    );
    let result = runErase(outPath);
    if (!fs.existsSync(outPath)) {
      const detail = String(result?.stderr || result?.stdout || "");
      if (/Permission|Errno 13|no write permission/i.test(detail)) {
        // 权限兜底：直接写到输出目录根下（与作品同权限）
        const fallback = path.join(outputDir(), `.lumen-erase-${Date.now()}.png`);
        result = runErase(fallback);
        if (fs.existsSync(fallback)) {
          workingPath = fallback;
          tempFiles.push(fallback);
        } else {
          throw new Error(`擦除失败（无写权限，已尝试 ${path.dirname(outPath)} 与 ${outputDir()}）：${detail.slice(-160)}`);
        }
      } else {
        throw new Error(`擦除失败：${detail.slice(-200)}`);
      }
    } else {
      workingPath = outPath;
      tempFiles.push(outPath);
    }
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
    const outName = path.basename(sourcePath);
    const outPath = sourcePath;
    await fsp.copyFile(workingPath, outPath);
    const meta = {
      ...(await readOutputMeta(sourcePath)),
      name: outName,
      fixed: true,
      fixMode: "erase",
      fixRect: { x: rx, y: ry, w: rw, h: rh },
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
  const outName = path.basename(sourcePath);
  const outPath = sourcePath;
  await fsp.copyFile(files[0].path, outPath);
  const meta = {
    ...(await readOutputMeta(sourcePath)),
    name: outName,
    fixed: true,
    fixMode: mode,
    fixRect: { x: rx, y: ry, w: rw, h: rh },
    fixDenoise: mode === "erase" ? blend : Math.max(0.15, Math.min(0.9, Number(payload?.denoise) || 0.5)),
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
  return path.join(resolveComfyDir(config), "models", "upscale_models");
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
  const outDir = path.join(writableTempDir(), `lumen-raw-${Date.now()}`);
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
    sourcePath = path.join(writableTempDir(), `${safeStem}.${ext}`);
    await fsp.writeFile(sourcePath, Buffer.from(match[2], "base64"));
  }
  if (!sourcePath || !fs.existsSync(sourcePath)) throw new Error("找不到要高清化的图片");

  await ensureComfyReady(config);
  const buffer = await fsp.readFile(sourcePath);
  const size = readImageSize(buffer);
  if (!size?.width || !size?.height) throw new Error("无法读取图片尺寸");

  const tmpIn = path.join(writableTempDir(), `lumen-hd-in-${Date.now()}${path.extname(sourcePath)}`);
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
  // 放大后强化线条与细节（可由 options.sharpen = false 关闭）
  let sharpened = false;
  if (options?.sharpen !== false) {
    try {
      const result = enhanceDetail(config, outPath, Number(options?.sharpenStrength) || 1.0);
      sharpened = Boolean(result?.ok);
    } catch {}
  }
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
    sharpened,
    source: path.basename(sourcePath),
    factor,
    engine: model ? `model:${model}` : "lanczos",
    sourceWidth: sourceMeta.sourceWidth || size.width,
    sourceHeight: sourceMeta.sourceHeight || size.height,
    width: built.width,
    height: built.height,
    createdAt: new Date().toISOString(),
  };
  // 覆盖模式（默认）：高清结果直接替换原图，不再保留 -hd 副本
  const overwrite = options?.overwrite !== false;
  if (overwrite && path.resolve(outPath) !== path.resolve(sourcePath)) {
    const finalMeta = {
      ...meta,
      name: path.basename(sourcePath),
      upscaled: true,
      upscaledFrom: path.basename(outPath),
      source: undefined,
    };
    await fsp.copyFile(outPath, sourcePath);
    await fsp.writeFile(sourcePath.replace(/\.[^.]+$/, ".json"), JSON.stringify(finalMeta, null, 2), "utf8");
    try { await fsp.unlink(outPath); } catch {}
    try { await fsp.unlink(outPath.replace(/\.[^.]+$/, ".json")); } catch {}
    try { fs.unlinkSync(tmpIn); } catch {}
    // 覆盖后立刻重建缩略图，避免画廊还显示旧图
    try { await ensureThumb(sourcePath, path.basename(sourcePath)); } catch {}
    return {
      name: path.basename(sourcePath),
      path: sourcePath,
      url: `data:image/png;base64,${(await fsp.readFile(sourcePath)).toString("base64")}`,
      hidden: readHiddenWorks().has(path.basename(sourcePath)),
      ...finalMeta,
    };
  }
  await fsp.writeFile(outPath.replace(/\.[^.]+$/, ".json"), JSON.stringify(meta, null, 2), "utf8");
  return {
    name: outName,
    path: outPath,
    url: `data:image/png;base64,${(await fsp.readFile(outPath)).toString("base64")}`,
    hidden: readHiddenWorks().has(outName),
    ...meta,
  };
}

// ---------- 缩略图（画廊/结果小窗用，避免大图直接缩放导致颗粒感） ----------
function thumbDir() {
  return path.join(outputDir(), ".thumbs");
}

async function ensureThumb(filePath, name) {
  try {
    const dir = thumbDir();
    await fsp.mkdir(dir, { recursive: true });
    const target = path.join(dir, `${name.replace(/\.[^.]+$/, "")}.jpg`);
    const statSrc = await fsp.stat(filePath);
    let need = true;
    try {
      const statThumb = await fsp.stat(target);
      need = statThumb.mtimeMs < statSrc.mtimeMs;
    } catch {}
    if (need) {
      const image = nativeImage.createFromPath(filePath);
      if (image.isEmpty()) return "";
      const size = image.getSize();
      const width = Math.min(520, size.width || 520);
      const resized = image.resize({ width, quality: "good" });
      await fsp.writeFile(target, resized.toJPEG(90));
    }
    return `file:///${target.replace(/\\/g, "/")}`;
  } catch {
    return "";
  }
}

ipcMain.handle("flow:list-outputs", async (_event, payload) => {
  ensureDirs();
  const mode = payload?.mode === "hidden" ? "hidden" : "visible";
  const hiddenSet = readHiddenWorks();
  // 按修改时间倒序（新建/高清化/修正的作品才会出现在最上方）
  const allNames = (await fsp.readdir(outputDir(), { withFileTypes: true }))
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => /\.(png|jpe?g|webp)$/i.test(name) && !name.startsWith("."));
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
    const thumbUrl = await ensureThumb(filePath, name);
    const derived = Boolean(metadata.upscaled || metadata.faceDetail || metadata.fixed || metadata.source);
    items.push({
      name,
      path: filePath,
      mtime: stat.mtimeMs,
      derived,
      thumbUrl,
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
  // 缩略图缓存与隐藏标记一并清理，避免残留占空间
  try { await fsp.unlink(path.join(thumbDir(), name.replace(/\.[^.]+$/, ".jpg"))); } catch {}
  try {
    const hidden = readHiddenWorks();
    if (hidden.delete(name)) setHiddenWorks({ hidden: [...hidden], add: [], remove: [] });
  } catch {}
  return { ok: true };
});

ipcMain.handle("flow:hidden:list", () => ({ hidden: [...readHiddenWorks()] }));
ipcMain.handle("flow:hidden:set", (_event, payload) => setHiddenWorks(payload));
ipcMain.handle("flow:upscale", async (_event, payload) => upscaleImage(readConfig(), payload));
ipcMain.handle("flow:repair-region", async (_event, payload) => repairRegion(payload));
ipcMain.handle("flow:upscale:info", () => ({ models: listUpscaleModels(readConfig()) }));
ipcMain.handle("flow:upscale:install", () => installUpscaleModels());
ipcMain.handle("flow:upscale:open-dir", async () => {
  const dir = upscaleModelDir(readConfig());
  await fsp.mkdir(dir, { recursive: true });
  await shell.openPath(dir);
  return { dir };
});
ipcMain.handle("flow:repair-feet", async (_event, payload) => repairFeet(payload));

ipcMain.handle("flow:reveal", async (_event, target) => {
  if (typeof target === "string" && fs.existsSync(target)) shell.showItemInFolder(target);
  return true;
});

ipcMain.handle("flow:open-external", async (_event, url) => {
  if (typeof url === "string" && /^https?:\/\//.test(url)) await shell.openExternal(url);
  return true;
});

