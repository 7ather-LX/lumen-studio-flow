// 全流程静态审计：检查关键不变量，防止回归
const fs = require("node:fs");
const path = require("node:path");
const L = "F:\\DSH WORKSPACE\\lumen-flow";
const main = fs.readFileSync(path.join(L, "app", "main.cjs"), "utf8").replace(/\r\n/g, "\n");
const app = fs.readFileSync(path.join(L, "app", "renderer", "app.js"), "utf8").replace(/\r\n/g, "\n");
const html = fs.readFileSync(path.join(L, "app", "renderer", "index.html"), "utf8");

const checks = [];
const add = (name, fn) => checks.push({ name, fn });

// ---------- 1. 提示词清洗顺序 ----------
add("buildWorkflow 里 sanitize 在 appearance 之前", () => {
  const s = main.indexOf("sanitizePromptText(prompt, negative)");
  const a = main.indexOf("injectAppearance(prompt, matched[0].tags)");
  return s > 0 && a > s;
});

add("buildWorkflow 返回生效后的 prompt / negative", () => {
  const block = main.slice(main.indexOf("    workflow,\n    seed,"));
  const head = block.slice(0, 400);
  return /^    workflow,\n    seed,/.test(block) && /\n    prompt,\n    negative,/.test(head);
});

add("元数据记录生效提示词且保留 rawPrompt", () => {
  return main.includes("prompt: String(built.prompt || payload.prompt || \"\")") &&
    main.includes("rawPrompt: String(payload.prompt || \"\")");
});

// ---------- 2. 参数一致性 ----------
add("性能档不再覆盖步数/CFG", () => {
  return !/steps = performance\.steps/.test(app) && !/cfg = performance\.cfg/.test(app);
});

add("元数据包含 batch / hires / totalSteps", () => {
  return main.includes("batch: built.batch") && main.includes("totalSteps: built.totalSteps") && main.includes("hires: built.hires");
});

add("画面尺寸都是 64 的倍数", () => {
  const m = app.match(/const ASPECTS = \{[\s\S]*?\n  \};/);
  if (!m) return false;
  const nums = [...m[0].matchAll(/width:\s*(\d+),\s*height:\s*(\d+)/g)];
  return nums.length >= 4 && nums.every(([, w, h]) => Number(w) % 64 === 0 && Number(h) % 64 === 0);
});

// ---------- 3. 单人约束 ----------
add("单人时负向自动加权反群像", () => {
  return main.includes("multiple girls:1.35") && main.includes("background characters:1.25");
});

add("单人检测使用生效提示词", () => {
  return main.includes("const soloWanted = /(^|,|\\s)(solo|1girl|1boy)(,|\\s|$)/i.test(String(built.prompt");
});

add("多人仍会出现时裁到主体", () => {
  return main.includes("cropToPrimarySubject(config, images[index].path)");
});

// ---------- 4. 标签面板 ----------
add("标签面板不再自动勾选（只认手动）", () => {
  return app.includes("nsfwTagState.selected") && !/const active = promptHasTag\(item\.tag\)/.test(app);
});

// ---------- 5. 角色处理 ----------
add("角色外观注入 + 特征禁用都在主进程", () => {
  return main.includes("injectAppearance(prompt, matched[0].tags)") && main.includes("analyzeCharacterTraits(prompt).forbidden");
});

// ---------- 6. 输出与画廊 ----------
add("画廊使用缩略图且缩略图缓存目录被忽略", () => {
  return app.includes("image.thumbUrl || image.url") && main.includes("function thumbDir()");
});

add("作品按修改时间倒序", () => {
  return main.includes(".sort((a, b) => b.mtime - a.mtime");
});

add("元数据与图片同名写出", () => {
  return main.includes('filePath.replace(/\\.png$/i, ".json")');
});

// ---------- 7. 错误与取消 ----------
add("ComfyUI 未启动会自动拉起", () => {
  return main.includes("await startComfy()") && main.includes("if (!status.ok) throw new Error");
});

add("生成流程不再包含面部精修与自动修正", () => {
  return !main.includes("payload.faceDetail && images.length") &&
    !main.includes("needsCorrection") &&
    app.includes("autoCorrect: false");
});

add("删除作品时清理缩略图与隐藏标记", () => {
  return main.includes("path.join(thumbDir(), name.replace(") && main.includes("readHiddenWorks()");
});

add("批量高清不删原图、不改覆盖", () => {
  return main.includes("upscaleImage(config, { name: original.name, factor, model })") &&
    !main.includes("overwrite: true") && !main.includes("safeToRemove");
});

add("高清化保留原图，生成独立高清版本", () => {
  const keepsOriginal = !main.includes("options?.overwrite") && !main.includes("await fsp.copyFile(outPath, sourcePath)");
  const writesHd = main.includes("const outName = `${baseName}-hd${factor}x.png`");
  return keepsOriginal && writesHd;
});

add("重修流程已取消（无自动修正/面部精修入口）", () => {
  return !html.includes("imageDetailRepair") && !html.includes("autoRepair") && !html.includes("repairModal");
});

add("生成有超时保护", () => {
  return main.includes("15 * 60 * 1000");
});

add("取消按钮有 IPC", () => {
  return main.includes("flow:cancel") && app.includes("bridge.cancel");
});

// ---------- 8. 运行时路径可移植 ----------
add("运行时/输出/参考库路径不再写死盘符", () => {
  return main.includes("function resolveComfyDir(config)") &&
    !/outputDir: "F:/.test(main) &&
    !/comfyDir: "F:/.test(main) &&
    !/referenceDir: "F:/.test(main);
});

// ---------- 9. 无 GPU ----------
add("无 NVIDIA 时自动装 CPU torch 并提示", () => {
  const ps = fs.readFileSync(path.join(L, "app", "bootstrap_runtime.ps1"), "utf8");
  return ps.includes("download.pytorch.org/whl/cpu") && app.includes("CPU 模式");
});

let pass = 0;
for (const item of checks) {
  let ok = false;
  try { ok = Boolean(item.fn()); } catch { ok = false; }
  if (ok) pass += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${item.name}`);
}
console.log(`\n${pass}/${checks.length} 通过`);
process.exit(pass === checks.length ? 0 : 1);
