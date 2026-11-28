from pathlib import Path

p = Path(r"F:\DSH WORKSPACE\lumen-flow\app\main.cjs")
lines = p.read_text(encoding="utf-8").split("\n")

start = next(i for i, l in enumerate(lines) if l.startswith("function resolveLlmModelPath(config) {"))
end = next(i for i in range(start, len(lines)) if lines[i].strip() == "}" and i > start)

new_block = '''function resolveLlmModelPath(config) {
  const configured = String(config.llmModel || "").trim();
  if (configured && fs.existsSync(configured)) return configured;
  const dirs = [
    path.join(dataRoot(), "models", "llm"),
    path.join(app.getAppPath(), "..", "models", "llm"),
    path.join(process.resourcesPath || "", "models", "llm"),
  ].filter(Boolean);
  const candidates = [configured, ...(IS_LITE ? dirs : []), LLM_MODEL, ...(IS_LITE ? [] : dirs)].filter(Boolean);
  for (const candidate of candidates) {
    try {
      if (!fs.existsSync(candidate)) continue;
      const stat = fs.statSync(candidate);
      if (stat.isFile() && /\\.gguf$/i.test(candidate)) return candidate;
      if (stat.isDirectory()) {
        const all = fs.readdirSync(candidate).filter((name) => /\\.gguf$/i.test(name)).sort();
        if (!all.length) continue;
        // Lite 优先 3B，避免误用 9B
        const preferred = IS_LITE ? all.find((name) => /coder-3b|qwen2\\.5-3b/i.test(name)) : "";
        return path.join(candidate, preferred || all[0]);
      }
    } catch {}
  }
  return configured || LLM_MODEL;
}'''

lines[start:end + 1] = new_block.split("\n")
p.write_text("\n".join(lines), encoding="utf-8")
print("resolveLlmModelPath replaced")

# build-variant：按真实 HTML 写法替换默认值
b = Path(r"F:\DSH WORKSPACE\lumen-flow\scripts\build-variant.cjs")
bt = b.read_text(encoding="utf-8")
if 'value="low" selected' not in bt:
    bt = bt.replace('''  html = html.replace("LUMEN STUDIO / FLOW", "LUMEN STUDIO / FLOW LITE");''',
'''  html = html.replace("LUMEN STUDIO / FLOW", "LUMEN STUDIO / FLOW LITE");
  // Lite 默认：低显存档、1 张、20 步
  html = html.replace('<option value="auto">自动识别</option>',
    '<option value="low" selected>低显存 · 512×768</option><option value="auto">自动识别</option>');
  html = html.replace('<input type="range" id="steps" min="8" max="60" value="30" />',
    '<input type="range" id="steps" min="8" max="60" value="20" />');
  html = html.replace('<input type="range" id="batch" min="1" max="10" value="3" />',
    '<input type="range" id="batch" min="1" max="10" value="1" />');''')
    b.write_text(bt, encoding="utf-8")
    print("build-variant defaults patched")
