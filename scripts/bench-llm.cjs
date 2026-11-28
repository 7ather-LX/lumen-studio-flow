#!/usr/bin/env node
/**
 * LLM 提示词编译基准：用 app.js 的真实 system prompt + 角色事实，跑同一组用例。
 * 用法：node scripts/bench-llm.cjs --port 8099 --label coder-3b
 */
const fs = require("node:fs");
const path = require("node:path");

const args = process.argv.slice(2);
const argOf = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const PORT = Number(argOf("port", 8091));
const LABEL = argOf("label", "model");

const L = path.resolve(__dirname, "..");
const appJs = fs.readFileSync(path.join(L, "app", "renderer", "app.js"), "utf8");

// 提取真实 system prompt
const s = appJs.indexOf("const AI_SYSTEM_PROMPT = `");
const e = appJs.indexOf("`;", s);
const SYSTEM = appJs.slice(s + "const AI_SYSTEM_PROMPT = `".length, e);

// 提取角色事实/后处理函数
const fS = appJs.indexOf("  function containsName(haystack, name) {");
const FE = appJs.slice(fS, appJs.indexOf("  function renderAiMessages() {", fS));
const eS = appJs.indexOf("  const HAIR_COLORS = [");
const ENF = appJs.slice(eS, appJs.indexOf("  async function sendAiChat() {", eS));
const base = JSON.parse(fs.readFileSync(path.join(L, "app", "renderer", "characters.json"), "utf8")).characters || [];
const extra = JSON.parse(fs.readFileSync(path.join(L, "app", "renderer", "characters-extra.json"), "utf8")).characters || [];
const api = new Function("loadCharacterCatalog", `${FE}\n${ENF}\n return { characterFactsFor, enforceCharacterFacts };`)(
  async () => [...base, ...extra],
);

const CASES = [
  { name: "单人·碧蓝航线厌战", text: "画碧蓝航线的厌战，穿白色军装，站在甲板上，仰视", expectChar: "warspite (azur lane)" },
  { name: "单人·恰巴耶夫", text: "画碧蓝航线的恰巴耶夫，红色中式旗袍，黑丝，光脚，躺在台球桌上", expectChar: "chapayev (azur lane)" },
  { name: "双人·柴郡x2", text: "两个相同的碧蓝航线柴郡 2girl，坐在海边的长椅上，白天", expectChar: "cheshire (azur lane)" },
  { name: "pose 冲突", text: "画一个银发红瞳的少女，侧躺在沙发上，看着镜头", expectChar: "" },
  { name: "室内场景", text: "画一个黑发少女，坐在客厅沙发上看书，暖光", expectChar: "" },
  { name: "非角色场景", text: "画一张黄昏的海边风景，没有人物，电影感", expectChar: "" },
];

async function chat(messages) {
  const body = {
    model: "bench",
    messages,
    temperature: 0.4,
    top_p: 0.9,
    max_tokens: 2600,
    stream: false,
    repeat_penalty: 1.08,
    chat_template_kwargs: { enable_thinking: false },
  };
  const started = Date.now();
  const res = await fetch(`http://127.0.0.1:${PORT}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(300000),
  });
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content || "";
  return { content, ms: Date.now() - started };
}

function parseJson(text) {
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first < 0 || last <= first) return null;
  try {
    return JSON.parse(text.slice(first, last + 1));
  } catch {
    return null;
  }
}

(async () => {
  console.log(`=== ${LABEL} (port ${PORT}) ===`);
  let pass = 0;
  let totalMs = 0;
  for (const c of CASES) {
    const facts = await api.characterFactsFor(c.text);
    const messages = [
      { role: "system", content: SYSTEM },
      { role: "user", content: `用户描述：${c.text}\n\n${facts}\n\n请输出 JSON。` },
    ];
    let result = { ok: false, reason: "", ms: 0, json: null };
    try {
      const { content, ms } = await chat(messages);
      result.ms = ms;
      totalMs += ms;
      const json = parseJson(content);
      result.json = json;
      if (!json) {
        result.reason = "JSON 解析失败";
      } else {
        const clean = await api.enforceCharacterFacts(JSON.stringify(json), facts, c.text);
        const data = JSON.parse(clean);
        const prompt = String(data.prompt || "");
        const problems = [];
        if (/undefined|null/i.test(prompt + String(data.character || ""))) problems.push("含 undefined");
        if (c.expectChar && !prompt.toLowerCase().includes(c.expectChar.toLowerCase())) problems.push(`角色缺失(${data.character || "空"})`);
        if (/侧躺|lying/i.test(c.text) && /\bstanding\b/i.test(prompt)) problems.push("姿势冲突");
        if (/客厅|沙发/i.test(c.text) && /tree|sunlight|outdoor/i.test(prompt)) problems.push("户外词混入");
        if (/没有人物/i.test(c.text) && /1girl|1boy/i.test(prompt)) problems.push("无人场景写了人物");
        result.ok = problems.length === 0;
        result.reason = problems.join(" / ") || "ok";
        result.promptLen = prompt.length;
      }
    } catch (error) {
      result.reason = String(error.message || error).slice(0, 80);
    }
    if (result.ok) pass += 1;
    console.log(`${result.ok ? "PASS" : "FAIL"}  ${c.name}  ${(result.ms / 1000).toFixed(1)}s  ${result.reason}`);
    if (result.json) console.log(`      char=${result.json.character} | prompt=${String(result.json.prompt || "").slice(0, 70)}…`);
  }
  console.log(`\n${LABEL}: ${pass}/${CASES.length} 通过，平均 ${(totalMs / CASES.length / 1000).toFixed(1)}s/例`);
})();
