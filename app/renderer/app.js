(() => {
  const bridge = window.flow;
  const $ = (selector) => document.querySelector(selector);
  const state = {
    view: "create",
    aspect: "1:1",
    style: "anime-cel",
    config: null,
    health: null,
    images: [],
    currentImage: null,
    busy: false,
    progressUnsubscribe: null,
  };

  const ASPECTS = {
    "1:1": { width: 1024, height: 1024, label: "1024 × 1024" },
    "3:4": { width: 896, height: 1152, label: "896 × 1152" },
    "2:3": { width: 832, height: 1216, label: "832 × 1216" },
    "16:9": { width: 1216, height: 688, label: "1216 × 688" },
  };

  const STYLES = {
    "anime-cel": "anime cel shading, clean lineart, flat colors, limited palette, 2D animation key visual",
    cinematic: "cinematic lighting, dramatic shadows, volumetric light, film still, detailed background",
    lineart: "fine lineart, monochrome, detailed ink illustration, high contrast",
    illustration: "Japanese illustration, soft painterly rendering, detailed eyes, elegant composition",
  };

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[char]);
  }

  function toast(message) {
    let node = $("#flowToast");
    if (!node) {
      node = document.createElement("div");
      node.id = "flowToast";
      Object.assign(node.style, {
        position: "fixed",
        right: "28px",
        bottom: "26px",
        zIndex: "50",
        maxWidth: "420px",
        padding: "12px 15px",
        border: "1px solid rgba(214,255,121,.3)",
        borderRadius: "8px",
        background: "#11160f",
        color: "#eef4ec",
        fontSize: "11px",
        lineHeight: "1.6",
        boxShadow: "0 18px 50px rgba(0,0,0,.45)",
        opacity: "0",
        transform: "translateY(8px)",
        transition: "220ms ease",
      });
      document.body.appendChild(node);
    }
    node.textContent = message;
    requestAnimationFrame(() => {
      node.style.opacity = "1";
      node.style.transform = "translateY(0)";
    });
    clearTimeout(node._timer);
    node._timer = setTimeout(() => {
      node.style.opacity = "0";
      node.style.transform = "translateY(8px)";
    }, 4200);
  }

  function setView(view) {
    state.view = view;
    document.querySelectorAll(".view").forEach((node) => node.classList.remove("active"));
    document.querySelectorAll(".nav-item").forEach((node) => node.classList.toggle("active", node.dataset.view === view));
    const title = $("#viewTitle");
    if (title) title.textContent = view === "gallery" ? "Archive" : "Create";
    if (view === "gallery") void loadGallery();
  }

  function setStatus(ok, label, detail) {
    const dot = $("#engineDot");
    const statusLabel = $("#engineLabel");
    const statusDetail = $("#engineDetail");
    if (dot) {
      dot.classList.toggle("ok", Boolean(ok));
      dot.classList.toggle("loading", label === "检测中" || label === "启动中");
    }
    if (statusLabel) statusLabel.textContent = label;
    if (statusDetail) statusDetail.textContent = detail || "";
  }

  async function checkHealth() {
    if (!bridge) {
      setStatus(false, "不可用", "Electron bridge 未加载");
      return;
    }
    setStatus(false, "检测中", "正在连接 ComfyUI");
    try {
      const health = await bridge.health();
      state.health = health;
      if (health.ok) {
        const device = health.devices?.[0] || {};
        const name = device.name || "本地 GPU";
        const vram = device.vram_total ? `${Math.round(device.vram_total / 1024 ** 3)} GB` : "--";
        setStatus(true, "在线", `${name} · ${vram}`);
        $("#gpuLabel").textContent = name.replace(/^cuda:\d+\s*/, "").slice(0, 22);
      } else {
        setStatus(false, "离线", health.error || "ComfyUI 未启动");
        $("#gpuLabel").textContent = "--";
      }
    } catch (error) {
      setStatus(false, "离线", error?.message || String(error));
    }
  }

  function setBusy(busy) {
    state.busy = busy;
    const button = $("#generateButton");
    button.disabled = busy;
    button.querySelector("span").textContent = busy ? "生成中…" : "生成图片";
    $("#progressWrap").classList.toggle("hidden", !busy);
  }

  function updateProgress({ stage, progress }) {
    const percent = Math.round(Math.max(0, Math.min(1, Number(progress) || 0)) * 100);
    $("#progressBar").style.width = `${percent}%`;
    $("#progressPercent").textContent = `${percent}%`;
    $("#progressStage").textContent = stage || "生成中";
  }

  function applyAspect(aspect) {
    state.aspect = aspect;
    document.querySelectorAll(".aspect").forEach((node) => node.classList.toggle("active", node.dataset.aspect === aspect));
    $("#sizeHint").textContent = ASPECTS[aspect].label;
  }

  function applyStyle(style) {
    state.style = style;
    document.querySelectorAll(".chip").forEach((node) => node.classList.toggle("active", node.dataset.style === style));
  }

  function renderResult(image) {
    state.currentImage = image;
    const stage = $("#resultStage");
    stage.innerHTML = `<img src="${image.url}" alt="Lumen Flow output" />`;
    $("#resultMeta").textContent = `Anima · ${image.width || ""} × ${image.height || ""}`.replace(" × ", " × ");
    $("#resultActions").classList.remove("hidden");
  }

  async function loadGallery() {
    if (!bridge) return;
    try {
      const images = await bridge.listOutputs();
      state.images = images;
      const grid = $("#galleryGrid");
      if (!images.length) {
        grid.innerHTML = '<div class="gallery-empty">还没有作品。</div>';
        return;
      }
      grid.innerHTML = images
        .map(
          (image) => `
            <button class="gallery-item" data-path="${escapeHtml(image.path)}">
              <img src="${image.url}" alt="${escapeHtml(image.name)}" loading="lazy" />
              <span class="gallery-caption"><span>${escapeHtml(image.name)}</span><span>OPEN</span></span>
            </button>`,
        )
        .join("");
      grid.querySelectorAll(".gallery-item").forEach((node) => {
        node.addEventListener("click", () => {
          state.currentImage = images.find((image) => image.path === node.dataset.path) || null;
          if (state.currentImage) {
            setView("create");
            renderResult(state.currentImage);
          }
        });
      });
    } catch (error) {
      toast(error?.message || String(error));
    }
  }

  async function generate() {
    if (!bridge || state.busy) return;
    const prompt = $("#prompt").value.trim();
    if (!prompt) {
      $("#prompt").focus();
      toast("先写提示词。");
      return;
    }
    const aspect = ASPECTS[state.aspect];
    const steps = Number($("#steps").value);
    const cfg = Number($("#cfg").value);
    const batch = Number($("#batch").value);
    const seedValue = Number($("#seed").value);
    const seed = Number.isFinite(seedValue) && seedValue >= 0 ? Math.floor(seedValue) : -1;
    const negative = $("#negative").value.trim();
    const style = STYLES[state.style] || "";
    setBusy(true);
    updateProgress({ stage: "连接 ComfyUI...", progress: 0 });
    $("#resultMeta").textContent = "生成中";
    try {
      const res = await bridge.generate({
        prompt: style ? `${prompt}, ${style}` : prompt,
        negative,
        width: aspect.width,
        height: aspect.height,
        steps,
        cfg,
        batch,
        seed,
      });
      if (res?.images?.length) {
        renderResult(res.images[0]);
        $("#resultMeta").textContent = `${res.images.length} 张 · seed ${res.seed}`;
        $("#seed").value = String(res.seed);
        toast(`生成完成，共 ${res.images.length} 张。`);
        await loadGallery();
      } else {
        throw new Error("没有返回图片");
      }
    } catch (error) {
      $("#resultMeta").textContent = "失败";
      toast(error?.message || String(error));
    } finally {
      setBusy(false);
    }
  }

  function openSettings() {
    if (!state.config) return;
    $("#settingUrl").value = state.config.comfyUrl || "";
    $("#settingDir").value = state.config.comfyDir || "";
    $("#settingPython").value = state.config.pythonExe || "";
    $("#settingUnet").value = state.config.unet || "";
    $("#settingClip").value = state.config.clip || "";
    $("#settingVae").value = state.config.vae || "";
    $("#settingLora").value = state.config.lora || "";
    $("#settingsModal").classList.remove("hidden");
  }

  async function saveSettings() {
    if (!bridge) return;
    const patch = {
      comfyUrl: $("#settingUrl").value.trim() || "http://127.0.0.1:8188",
      comfyDir: $("#settingDir").value.trim(),
      pythonExe: $("#settingPython").value.trim(),
      unet: $("#settingUnet").value.trim(),
      clip: $("#settingClip").value.trim(),
      vae: $("#settingVae").value.trim(),
      lora: $("#settingLora").value.trim(),
    };
    try {
      state.config = await bridge.setConfig(patch);
      $("#settingsModal").classList.add("hidden");
      toast("设置已保存。");
      await checkHealth();
    } catch (error) {
      toast(error?.message || String(error));
    }
  }

  async function bind() {
    document.querySelectorAll(".nav-item").forEach((node) => {
      node.addEventListener("click", () => setView(node.dataset.view));
    });
    document.querySelectorAll(".aspect").forEach((node) => {
      node.addEventListener("click", () => applyAspect(node.dataset.aspect));
    });
    document.querySelectorAll(".chip").forEach((node) => {
      node.addEventListener("click", () => applyStyle(node.dataset.style));
    });
    $("#prompt").addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        void generate();
      }
    });
    $("#steps").addEventListener("input", () => {
      $("#stepsValue").textContent = $("#steps").value;
    });
    $("#cfg").addEventListener("input", () => {
      $("#cfgValue").textContent = Number($("#cfg").value).toFixed(1).replace(".0", "");
    });
    $("#batch").addEventListener("input", () => {
      $("#batchValue").textContent = $("#batch").value;
    });
    $("#randomSeed").addEventListener("click", () => {
      $("#seed").value = String(Math.floor(Math.random() * 2 ** 31));
    });
    $("#negativeToggle").addEventListener("click", () => {
      $("#negative").classList.toggle("hidden");
    });
    $("#generateButton").addEventListener("click", () => void generate());
    $("#refreshGallery").addEventListener("click", () => void loadGallery());
    $("#settingsButton").addEventListener("click", openSettings);
    $("#closeSettings").addEventListener("click", () => $("#settingsModal").classList.add("hidden"));
    $("#cancelSettings").addEventListener("click", () => $("#settingsModal").classList.add("hidden"));
    $("#saveSettings").addEventListener("click", () => void saveSettings());
    $("#browseDir").addEventListener("click", async () => {
      const selected = await bridge?.chooseDir();
      if (selected) $("#settingDir").value = selected;
    });
    $("#engineStart").addEventListener("click", async () => {
      if (!bridge) return;
      setStatus(false, "启动中", "正在拉起 ComfyUI");
      try {
        await bridge.start();
        await checkHealth();
        toast("ComfyUI 已启动。");
      } catch (error) {
        setStatus(false, "离线", error?.message || String(error));
        toast(error?.message || String(error));
      }
    });
    $("#helpButton").addEventListener("click", () => $("#helpModal").classList.remove("hidden"));
    $("#closeHelp").addEventListener("click", () => $("#helpModal").classList.add("hidden"));
    $("#revealButton").addEventListener("click", () => {
      if (state.currentImage) void bridge.reveal(state.currentImage.path);
    });
    $("#reuseSeed").addEventListener("click", () => {
      if (state.currentImage?.seed) $("#seed").value = String(state.currentImage.seed);
      toast("已复用当前种子。");
    });

    if (!bridge) {
      toast("请通过 Electron 启动 Lumen Studio Flow。");
      return;
    }
    state.config = await bridge.getConfig();
    $("#steps").value = state.config.steps || 30;
    $("#stepsValue").textContent = $("#steps").value;
    $("#cfg").value = state.config.cfg || 4;
    $("#cfgValue").textContent = Number($("#cfg").value).toFixed(1).replace(".0", "");
    state.progressUnsubscribe = bridge.onProgress(updateProgress);
    await checkHealth();
    await loadGallery();
    setInterval(() => void checkHealth(), 15000);
  }

  document.addEventListener("DOMContentLoaded", () => {
    applyAspect("1:1");
    applyStyle("anime-cel");
    void bind();
  });
})();
