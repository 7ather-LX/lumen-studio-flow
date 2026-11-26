#!/usr/bin/env node
/**
 * 提示词后处理回归测试：覆盖同类通病。
 * 用法：node scripts/qa-prompts.cjs
 */
const fs = require("node:fs");
const path = require("node:path");

const L = path.resolve(__dirname, "..");
const appJs = fs.readFileSync(path.join(L, "app", "renderer", "app.js"), "utf8");
const fS = appJs.indexOf("  function containsName(haystack, name) {");
const FE = appJs.slice(fS, appJs.indexOf("  function renderAiMessages() {", fS));
const eS = appJs.indexOf("  const HAIR_COLORS = [");
const ENF = appJs.slice(eS, appJs.indexOf("  async function sendAiChat() {", eS));
const base = JSON.parse(fs.readFileSync(path.join(L, "app", "renderer", "characters.json"), "utf8")).characters || [];
const extra = JSON.parse(fs.readFileSync(path.join(L, "app", "renderer", "characters-extra.json"), "utf8")).characters || [];
const api = new Function("loadCharacterCatalog", `${FE}\n${ENF}\n return { characterFactsFor, enforceCharacterFacts };`)(async () => [...base, ...extra]);

const EYE = ["blue", "green", "red", "purple", "golden", "yellow", "pink", "orange", "grey", "aqua", "brown", "gray"];
const has = (text, needle) => new RegExp(needle, "i").test(text);

function makeAi(prompt, character, negative) {
  return JSON.stringify({
    character,
    work: "",
    style: "",
    artist: "",
    prompt,
    negative_prompt: negative || "worst quality, low quality, blurry, animal ears, cat ears, hat",
    notes: "",
  });
}

const CASES = [
  {
    name: "室内不出现户外光",
    user: "客厅沙发上的女孩",
    ai: makeAi("masterpiece, 1girl, solo, under tree, tree shade, dappled sunlight, leaves, living room, sofa"),
    checks: (d) => !has(d.prompt, "under tree|tree shade|dappled sunlight|leaves"),
  },
  {
    name: "躺姿不保留站立",
    user: "角色姿势：side-lying, one leg bent\n场景：卧室",
    ai: makeAi("masterpiece, 1girl, solo, standing, hands on hips, akimbo, side-lying, bedroom"),
    checks: (d) => !has(d.prompt, "\\bstanding\\b|akimbo|hands on hips") && has(d.prompt, "side-lying"),
  },
  {
    name: "瞳色不冲突（贝尔法斯特）",
    user: "画碧蓝航线的贝尔法斯特",
    ai: makeAi("masterpiece, 1girl, solo, belfast (azur lane), blue eyes, purple eyes, white hair"),
    checks: (d) => {
      const found = EYE.filter((c) => new RegExp(`(^|,\\s*)${c} eyes(,|$)`, "i").test(d.prompt));
      return found.length <= 1;
    },
  },
  {
    name: "剔除 undefined",
    user: "画一个女孩",
    ai: makeAi("masterpiece, 1girl, solo, 1girl, undefined", "foo, undefined"),
    checks: (d) => !has(d.character + d.prompt, "undefined"),
  },
  {
    name: "单人请求不出现多人",
    user: "画一个女孩",
    ai: makeAi("masterpiece, 1girl, solo, cat ears, hat"),
    checks: (d) => has(d.prompt, "1girl") && !has(d.prompt, "2girls"),
  },
  {
    name: "双人请求保留 2girls 且无 solo",
    user: "两个相同的碧蓝航线的柴郡 2girl\n场景：卧室",
    ai: makeAi("masterpiece, 2girls, solo, cheshire (azur lane), bedroom, bed", "cheshire (azur lane)"),
    checks: (d) => has(d.prompt, "2girls") && !has(d.prompt, "\\bsolo\\b"),
  },
  {
    name: "未提及角色被剔除",
    user: "画碧蓝航线的柴郡",
    ai: makeAi("masterpiece, 1girl, solo, cheshire (azur lane), sin (nikke), bedroom", "cheshire (azur lane), sin (nikke)"),
    checks: (d) => !has(d.prompt, "sin \\(nikke\\)") && !has(d.character, "sin \\(nikke\\)"),
  },
  {
    name: "正向与负面不冲突",
    user: "画一个女孩",
    ai: makeAi("masterpiece, 1girl, solo, blurry, bad anatomy", undefined, "blurry, bad anatomy, low quality"),
    checks: (d) => !has(d.prompt, "\\bblurry\\b") && !has(d.prompt, "bad anatomy"),
  },
  {
    name: "非人形不写 1girl",
    user: "画罗三炮",
    ai: makeAi("masterpiece, 1girl, solo, creature, luo san pao"),
    checks: (d) => !has(d.prompt, "1girl"),
  },
  {
    name: "水彩凌乱词被压制",
    user: "画一个女孩",
    ai: makeAi("masterpiece, 1girl, solo, watercolor, painterly, brush strokes, messy lines"),
    checks: (d) => !has(d.prompt, "watercolor|painterly|brush strokes|messy lines"),
  },
];

(async () => {
  let pass = 0;
  for (const item of CASES) {
    const facts = await api.characterFactsFor(item.user);
    const clean = await api.enforceCharacterFacts(item.ai, facts, item.user);
    let d = {};
    try { d = JSON.parse(clean); } catch {}
    let ok = false;
    try { ok = Boolean(item.checks(d)); } catch { ok = false; }
    if (ok) pass += 1;
    console.log(`${ok ? "PASS" : "FAIL"}  ${item.name}`);
    if (!ok) console.log(`      prompt: ${String(d.prompt || "").slice(0, 200)}`);
  }
  console.log(`\n${pass}/${CASES.length} 通过`);
  process.exit(pass === CASES.length ? 0 : 1);
})();
