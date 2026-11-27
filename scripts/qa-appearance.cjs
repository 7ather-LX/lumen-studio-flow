// 外观注入单测：库里正确的发色/瞳色必须压过提示词里的错误值
const fs = require("node:fs");
const path = require("node:path");
const L = "F:\\DSH WORKSPACE\\lumen-flow";
const main = fs.readFileSync(path.join(L, "app", "main.cjs"), "utf8");
const start = main.indexOf("function appearancePath() {");
const end = main.indexOf("function buildWorkflow(config, payload,");
const CODE = main.slice(start, end);
const factory = new Function("fs", "path", "__dirname", "dataRoot",
  `${CODE}\n return { analyzeCharacterTraits, injectAppearance };`);
const api = factory(fs, path, path.join(L, "app"), () => path.join(L, "app", "renderer"));

const CASES = [
  {
    name: "恰巴耶夫：提示词白发 → 库内在蓝发",
    prompt: "masterpiece, 1girl, solo, chapayev (azur lane), white hair, long hair, red china dress",
    expect: (out) => out.includes("blue hair") && !/white hair/.test(out),
  },
  {
    name: "恰巴耶夫：缺外观 → 自动补",
    prompt: "masterpiece, 1girl, solo, chapayev (azur lane), red china dress, lying on pool table",
    expect: (out) => out.includes("blue hair") && out.includes("blue eyes") && out.includes("large breasts"),
  },
  {
    name: "贝尔法斯特：提示词红瞳 → 库内蓝瞳",
    prompt: "1girl, solo, belfast (azur lane), red eyes, white hair, maid",
    expect: (out) => out.includes("blue eyes") && !/red eyes/.test(out),
  },
  {
    name: "未知角色 → 不改动",
    prompt: "1girl, solo, totally unknown character, white hair",
    expect: (out) => out.includes("white hair"),
  },
  {
    name: "齐刘海不破坏其它标签",
    prompt: "1girl, solo, chapayev (azur lane), qipao, black pantyhose, barefoot",
    expect: (out) => out.includes("qipao") && out.includes("black pantyhose") && out.includes("barefoot"),
  },
];

let pass = 0;
for (const item of CASES) {
  const matched = api.analyzeCharacterTraits(item.prompt).rows || [];
  const result = matched.length ? api.injectAppearance(item.prompt, matched[0].tags).prompt : item.prompt;
  const ok = Boolean(item.expect(result));
  if (ok) pass += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${item.name}`);
  if (!ok) console.log(`      → ${result}`);
}
console.log(`\n${pass}/${CASES.length} 通过`);
process.exit(pass === CASES.length ? 0 : 1);
