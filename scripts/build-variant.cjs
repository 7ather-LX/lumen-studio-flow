#!/usr/bin/env node
/**
 * 双产品线构建：
 *   node scripts/build-variant.cjs legacy   # 旧模型终极版（青柠绿）
 *   node scripts/build-variant.cjs pro      # 新产品线（青蓝）
 *
 * Pro 版会临时替换：图标(icon.ico)、界面配色(styles.css→styles-pro.css)、
 * 产品名 / appId / 安装包文件名；构建结束后自动还原，源码仓库保持原样。
 */
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const APP = path.join(ROOT, "app");
const variant = (process.argv[2] || "legacy").toLowerCase();
if (!["legacy", "pro"].includes(variant)) {
  console.error("usage: node scripts/build-variant.cjs legacy|pro");
  process.exit(2);
}

const pkgPath = path.join(APP, "package.json");
const version = JSON.parse(fs.readFileSync(pkgPath, "utf8")).version;
const iconPath = path.join(APP, "icon.ico");
const iconProPath = path.join(APP, "icon-pro.ico");
const htmlPath = path.join(APP, "renderer", "index.html");

const restores = [];
function backup(file) {
  const data = fs.readFileSync(file);
  restores.push(() => fs.writeFileSync(file, data));
}
function restoreAll() {
  while (restores.length) {
    try { restores.pop()(); } catch {}
  }
}

if (variant === "pro") {
  if (!fs.existsSync(iconProPath)) throw new Error("icon-pro.ico 缺失，先运行品牌资源生成脚本");
  backup(iconPath);
  fs.copyFileSync(iconProPath, iconPath);

  backup(htmlPath);
  const html = fs.readFileSync(htmlPath, "utf8");
  fs.writeFileSync(htmlPath, html.replace("styles.css", "styles-pro.css"), "utf8");
}

const args = [
  path.join(ROOT, "..", "node_modules", ".bin", "electron-builder.cmd"),
];
if (process.platform !== "win32") args[0] = "electron-builder";

const cli = [
  "--projectDir", APP,
  "--config", path.join(APP, "electron-builder.yml"),
  "--win", "nsis", "portable",
  "--publish", "never",
];
if (variant === "pro") {
  cli.push("-c.productName=Lumen Studio Flow Pro");
  cli.push("-c.appId=studio.lumen.flow.pro");
  cli.push('-c.artifactName=Lumen-Studio-Flow-Pro-${version}.${ext}');
  cli.push('-c.nsis.artifactName=Lumen-Studio-Flow-Pro-Setup-${version}.${ext}');
}

console.log(`[build-variant] ${variant} v${version}`);
const result = spawnSync(args[0], [...args.slice(1), ...cli], {
  stdio: "inherit",
  cwd: path.join(ROOT, ".."),
  shell: process.platform === "win32",
});
restoreAll();
process.exit(result.status ?? 1);
