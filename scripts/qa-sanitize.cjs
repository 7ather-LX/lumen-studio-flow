// 提示词清洗单测：复现用户实际粘进来的 JSON 情况
const fs = require("node:fs");
const path = require("node:path");
const L = "F:\\DSH WORKSPACE\\lumen-flow";
const main = fs.readFileSync(path.join(L, "app", "main.cjs"), "utf8");
const start = main.indexOf("function extractJsonPrompt(");
const end = main.indexOf("// ---------- 外观注入");
const CODE = main.slice(start, end);
const api = new Function(`${CODE}\n return { sanitizePromptText };`)();

const JSON_CASE = `masterpiece, best quality, score_7, safe, { "character": "keqing (genshin impact), k (nikke)", "work": "genshin impact", "style": "", "artist": "", "prompt": "masterpiece, ultra detailed, 1girl, solo, keqing (genshin impact), genshin impact, kneeling, on bed, purple hair, purple eyes", "negative_prompt": "worst quality, 2girls, multiple girls, animal ears, hat", "notes": "" }, no shoes, cinematic rendering`;

const CASES = [
  {
    name: "粘进来的 JSON → 提取 prompt 并剔除 JSON 残留",
    prompt: JSON_CASE,
    negative: "",
    check: (out) => out.prompt.includes("keqing (genshin impact)") &&
      !out.prompt.includes('"character"') &&
      !out.prompt.includes("negative_prompt") &&
      out.negative.includes("2girls"),
  },
  {
    name: "1girl + 2girls 冲突 → 保留单人",
    prompt: "1girl, solo, keqing (genshin impact), 2girls, multiple girls, bed",
    negative: "",
    check: (out) => !/2girls|multiple girls/i.test(out.prompt) && out.negative.includes("2girls"),
  },
  {
    name: "正向夹带 negative: 段 → 截断",
    prompt: "1girl, solo, keqing (genshin impact), bed negative: worst quality, 2girls",
    negative: "",
    check: (out) => !/worst quality/i.test(out.prompt) && out.prompt.includes("bed"),
  },
  {
    name: "单人多角色 → 只留第一个",
    prompt: "1girl, solo, keqing (genshin impact), k (nikke), bed",
    negative: "",
    check: (out) => out.prompt.includes("keqing (genshin impact)") &&
      !out.prompt.includes("k (nikke)") &&
      out.negative.includes("k (nikke)"),
  },
  {
    name: "正常单人提示词 → 不被改动",
    prompt: "1girl, solo, chapayev (azur lane), blue hair, qipao, lying on pool table",
    negative: "worst quality, low quality",
    check: (out) => out.prompt.includes("blue hair") && out.prompt.includes("pool table") && !/2girls/i.test(out.negative),
  },
  {
    name: "双人请求 → 不误删",
    prompt: "2girls, multiple girls, keqing (genshin impact), k (nikke), bed",
    negative: "",
    check: (out) => out.prompt.includes("2girls") && out.prompt.includes("k (nikke)"),
  },
];

let pass = 0;
for (const item of CASES) {
  const out = api.sanitizePromptText(item.prompt, item.negative);
  const ok = Boolean(item.check(out));
  if (ok) pass += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${item.name}`);
  if (!ok) console.log(`      prompt: ${out.prompt.slice(0, 160)}\n      negative: ${out.negative.slice(0, 120)}`);
}
console.log(`\n${pass}/${CASES.length} 通过`);
process.exit(pass === CASES.length ? 0 : 1);
