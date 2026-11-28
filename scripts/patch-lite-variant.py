"""为 Lite 变体打补丁：主进程默认参数、构建脚本、HTML 品牌、模型下载目录。"""
from pathlib import Path

L = Path(r"F:\DSH WORKSPACE\lumen-flow")
APP = L / "app"

# ---------- 1) main.cjs：变体识别 + Lite 默认值 ----------
mp = APP / "main.cjs"
t = mp.read_text(encoding="utf-8")
if "LUMEN_VARIANT" not in t:
    anchor = 'const { pathToFileURL } = require("node:url");'
    assert anchor in t
    t = t.replace(anchor, anchor + '''

// 产品变体：legacy（默认）/ pro / lite，由构建时写入 package.json
const LUMEN_VARIANT = (() => {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, "package.json"), "utf8"));
    return String(pkg.lumenVariant || "legacy").toLowerCase();
  } catch {
    return "legacy";
  }
})();
const IS_LITE = LUMEN_VARIANT === "lite";
''', 1)

    # Lite 默认配置：低配档、步数 20、3B 模型、上下文 4096
    cfg_anchor = "function dataRoot() {"
    assert cfg_anchor in t
    t = t.replace(cfg_anchor, '''// Lite 版默认值：低配档 + 3B 提示词模型
if (IS_LITE) {
  Object.assign(DEFAULT_CONFIG, {
    performanceProfile: "low",
    steps: 20,
    cfg: 4,
    hires: false,
    hiresScale: 1.2,
    hiresSteps: 6,
    unet: "anima-base-v1.0.safetensors",
    llmCtxSize: 4096,
    llmModel: "qwen2.5-coder-3b-instruct-q4_k_m.gguf",
  });
}

''' + cfg_anchor, 1)

    # Lite 版优先使用 3B 模型
    old = '''  const candidates = [
    configured,
    LLM_MODEL,'''
    new = '''  const candidates = [
    configured,
    ...(IS_LITE ? [path.join(dataRoot(), "models", "llm", "qwen2.5-coder-3b-instruct-q4_k_m.gguf")] : []),
    LLM_MODEL,'''
    assert old in t, "llm candidates anchor missing"
    t = t.replace(old, new, 1)
    mp.write_text(t, encoding="utf-8")
    print("main.cjs patched")

# ---------- 2) index.html：Lite 品牌（构建时也会替换） ----------
hp = APP / "renderer" / "index.html"
ht = hp.read_text(encoding="utf-8")
if "LITE_MARKER" not in ht:
    ht = ht.replace("<title>Lumen Studio Flow</title>", "<title>Lumen Studio Flow</title><!--LITE_MARKER-->", 1)
    hp.write_text(ht, encoding="utf-8")
    print("index.html marker added")

# ---------- 3) 模型下载目录：加 3B 选项 ----------
bp = L / "bootstrap_models.ps1"
bt = bp.read_text(encoding="utf-8")
if "coder-3b" not in bt:
    old = '"qwen3-14b"  = @{'
    idx = bt.find(old)
    assert idx > 0, "catalog anchor missing"
    line_end = bt.find("\n", idx)
    entry = ('\n"coder-3b"  = @{ Url = "https://hf-mirror.com/Qwen/Qwen2.5-Coder-3B-Instruct-GGUF/resolve/main/qwen2.5-coder-3b-instruct-q4_k_m.gguf"; File = "qwen2.5-coder-3b-instruct-q4_k_m.gguf"; Size = 2.0 }')
    bt = bt[:line_end + 1] + entry + bt[line_end + 1:]
    bt = bt.replace('[string]$LlmModel = ""   # 可选：llama-3b-8b | qwen3-14b | 留空则跳过',
                    '[string]$LlmModel = ""   # 可选：coder-3b（轻量）| llama-9b | qwen3-14b | 留空则跳过')
    bp.write_text(bt, encoding="utf-8")
    print("bootstrap catalog patched")
