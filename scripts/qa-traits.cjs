// 主进程特征禁用逻辑的单测（从 main.cjs 抽取 analyzeCharacterTraits）
const fs = require("node:fs");
const path = require("node:path");
const L = "F:\\DSH WORKSPACE\\lumen-flow";
const main = fs.readFileSync(path.join(L, "app", "main.cjs"), "utf8");
const start = main.indexOf("function appearancePath() {");
const end = main.indexOf("function buildWorkflow(config, payload,");
const CODE = main.slice(start, end);

const factory = new Function("fs", "path", "__dirname", "dataRoot",
  `${CODE}\n return { analyzeCharacterTraits, TRAIT_TAGS };`);
const api = factory(fs, path, path.join(L, "app"), () => path.join(L, "app", "renderer"));

const CASES = [
  { prompt: "1girl, solo, belfast (azur lane), maid headdress, cat ears", expect: { ears: false } },
  { prompt: "1girl, solo, cheshire (azur lane), fake animal ears, maid", expect: { ears: true } },
  { prompt: "1girl, solo, belfast (azur lane), heterochromia", expect: { heterochromia: false } },
  { prompt: "1girl, solo, keqing (genshin impact)", expect: { ears: false, tail: false } },
  // 库里查不到该角色时不做限制（预期 null）
  { prompt: "1girl, solo, some unknown character, fox ears", expect: null },
  { prompt: "masterpiece, no character", expect: null },
];

let pass = 0;
for (const item of CASES) {
  const result = api.analyzeCharacterTraits(item.prompt);
  if (!item.expect) {
    const ok = result.forbidden.length === 0;
    console.log(`${ok ? "PASS" : "FAIL"}  ${item.prompt}  (no match → no forbidden)`);
    if (ok) pass += 1;
    continue;
  }
  let ok = true;
  for (const [key, shouldPresent] of Object.entries(item.expect)) {
    const present = Boolean(result.present && result.present[key]);
    if (present !== shouldPresent) ok = false;
  }
  console.log(`${ok ? "PASS" : "FAIL"}  ${item.prompt}`);
  if (!ok) console.log("      present:", JSON.stringify(result.present), "forbidden:", result.forbidden.slice(0, 5));
  if (ok) pass += 1;
}
console.log(`\n${pass}/${CASES.length} 通过`);
process.exit(pass === CASES.length ? 0 : 1);
