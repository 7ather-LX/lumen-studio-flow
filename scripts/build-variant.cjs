#!/usr/bin/env node
/**
 * 多产品线构建：
 *   node scripts/build-variant.cjs legacy   # 主线（青柠绿）
 *   node scripts/build-variant.cjs pro      # Pro（青蓝）
 *   node scripts/build-variant.cjs lite     # Lite（琥珀，轻量版 v1.0.0）
 *
 * 构建时临时替换图标 / 配色 / 品牌文案 / 版本号，构建结束后自动还原。
 */
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const APP = path.join(ROOT, "app");
const variant = (process.argv[2] || "legacy").toLowerCase();
if (!["legacy", "pro", "lite"].includes(variant)) {
  console.error("usage: node scripts/build-variant.cjs legacy|pro|lite");
  process.exit(2);
}

const pkgPath = path.join(APP, "package.json");
const iconPath = path.join(APP, "icon.ico");
const htmlPath = path.join(APP, "renderer", "index.html");
const restores = [];
const backup = (file) => {
  const data = fs.readFileSync(file);
  restores.push(() => fs.writeFileSync(file, data));
};
const restoreAll = () => {
  while (restores.length) {
    try { restores.pop()(); } catch {}
  }
};

const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
const version = pkg.version;
const cli = [
  "--projectDir", APP,
  "--config", path.join(APP, "electron-builder.yml"),
  "--win", "nsis", "portable",
  "--publish", "never",
];

if (variant === "pro") {
  const iconPro = path.join(APP, "icon-pro.ico");
  if (!fs.existsSync(iconPro)) throw new Error("icon-pro.ico 缺失");
  backup(iconPath);
  fs.copyFileSync(iconPro, iconPath);
  backup(htmlPath);
  const html = fs.readFileSync(htmlPath, "utf8").replace("styles.css", "styles-pro.css");
  fs.writeFileSync(htmlPath, html, "utf8");
  cli.push("-c.productName=Lumen Studio Flow Pro");
  cli.push("-c.appId=studio.lumen.flow.pro");
  cli.push("-c.extraMetadata.lumenVariant=pro");
  cli.push("-c.artifactName=Lumen-Studio-Flow-Pro-${version}.${ext}");
  cli.push("-c.nsis.artifactName=Lumen-Studio-Flow-Pro-Setup-${version}.${ext}");
  cli.push("-c.nsis.shortcutName=Lumen Studio Flow Pro");
}

if (variant === "lite") {
  const iconLite = path.join(APP, "icon-lite.ico");
  if (!fs.existsSync(iconLite)) throw new Error("icon-lite.ico 缺失，先运行 scripts/make-lite-assets.py");
  backup(iconPath);
  fs.copyFileSync(iconLite, iconPath);

  backup(htmlPath);
  let html = fs.readFileSync(htmlPath, "utf8");
  html = html.replace("styles.css", "styles-lite.css");
  html = html.replace("<title>Lumen Studio Flow</title>", "<title>Lumen Studio Flow Lite</title>");
  html = html.replace("<strong>Lumen</strong>", "<strong>Lumen</strong>");
  html = html.replace("<small>STUDIO FLOW</small>", "<small>STUDIO FLOW · LITE</small>");
  html = html.replace("LUMEN STUDIO / FLOW", "LUMEN STUDIO / FLOW LITE");
  // Lite 默认：低显存档、1 张、20 步
  html = html.replace('<option value="auto">自动识别</option>',
    '<option value="low" selected>低显存 · 512×768</option><option value="auto">自动识别</option>');
  html = html.replace('<input type="range" id="steps" min="8" max="60" value="30" />',
    '<input type="range" id="steps" min="8" max="60" value="20" />');
  html = html.replace('<input type="range" id="batch" min="1" max="10" value="3" />',
    '<input type="range" id="batch" min="1" max="10" value="1" />');
  fs.writeFileSync(htmlPath, html, "utf8");

  // Lite 用 1.0.0 作为新产品线版本
  backup(pkgPath);
  const litePkg = { ...pkg, version: "1.0.0", lumenVariant: "lite", productName: "Lumen Studio Flow Lite" };
  fs.writeFileSync(pkgPath, JSON.stringify(litePkg, null, 2), "utf8");

  cli.push("-c.productName=Lumen Studio Flow Lite");
  cli.push("-c.appId=studio.lumen.flow.lite");
  cli.push("-c.extraMetadata.lumenVariant=lite");
  cli.push("-c.artifactName=Lumen-Studio-Flow-Lite-${version}.${ext}");
  cli.push("-c.win.artifactName=Lumen-Studio-Flow-Lite-${version}.${ext}");
  cli.push("-c.nsis.artifactName=Lumen-Studio-Flow-Lite-Setup-${version}.${ext}");
  cli.push("-c.nsis.shortcutName=Lumen Studio Flow Lite");
}

const rawBin = path.join(ROOT, "..", "node_modules", ".bin", "electron-builder.cmd");
const bin = rawBin;
console.log(`[build-variant] ${variant} v${variant === "lite" ? "1.0.0" : version}`);
const quote = (v) => (/[\s()&]/.test(String(v)) ? `"${String(v)}"` : String(v));
const cmdLine = [bin, ...cli].map(quote).join(" ");
const result = spawnSync(cmdLine, {
  stdio: "inherit",
  cwd: path.join(ROOT, ".."),
  shell: true,
});
restoreAll();
process.exit(result.status ?? 1);
