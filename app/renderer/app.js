(() => {
  const bridge = window.flow;
  const $ = (selector) => document.querySelector(selector);
  const state = {
    view: "create",
    aspect: "1:1",
    style: "anime-cel",
    animaMode: true,
    forcedCharacter: null,
    initImage: "",
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
    "anime-cel": {
      label: "平面赛璐珞",
      artists: ["@kantoku", "@yoneyama_mai"],
      tags: "anime cel shading, flat colors, bold clean lineart, limited palette, 2D animation key visual",
      hint: "平面赛璐珞：平涂色块 + 清晰外轮廓 + 有限色板；画师参考 @kantoku / @yoneyama_mai",
    },
    painterly: {
      label: "2.5D 厚涂",
      artists: ["@wlop", "@mika_pikazo"],
      tags: "semi-realistic anime, painterly rendering, thick brushwork, soft volumetric lighting, detailed skin, 2.5D",
      hint: "2.5D 厚涂：体积光 + 厚笔触 + 半写实皮肤；画师参考 @wlop / @mika_pikazo",
    },
    "manga-bw": {
      label: "黑白日式漫画",
      artists: ["@fujimoto_tatsuki", "@asano_inio"],
      tags: "black and white manga, screentone, high contrast ink, panel composition, monochrome, screentones",
      hint: "黑白日漫：网点纸 + 高对比墨线 + 分镜感；画师参考 @fujimoto_tatsuki / @asano_inio",
    },
    "ink-wash": {
      label: "水墨风",
      artists: ["@kawanabe_kyosai"],
      tags: "ink wash painting, sumi-e, flowing brush strokes, negative space, muted paper texture, japanese ink",
      hint: "水墨：墨色晕染 + 留白 + 纸纹；画师参考 @kawanabe_kyosai",
    },
    retro: {
      label: "90 年代复古赛璐珞",
      artists: ["@yamada_akihiro"],
      tags: "1990s anime, retro cel, film grain, muted colors, vintage animation, hand-painted background",
      hint: "复古赛璐珞：90 年代动画色偏 + 颗粒 + 手绘背景；画师参考 @yamada_akihiro",
    },
    pastel: {
      label: "柔和粉彩",
      artists: ["@atdan"],
      tags: "soft pastel colors, airy lighting, delicate lineart, dreamy atmosphere, light watercolor texture",
      hint: "柔和粉彩：低饱和 + 空气感 + 轻水彩；画师参考 @atdan",
    },
    lineart: {
      label: "精细线稿",
      artists: ["@lack"],
      tags: "fine lineart, monochrome, detailed ink illustration, hatching, concept art, clean contours",
      hint: "精细线稿：细密排线 + 干净轮廓 + 概念设定感；画师参考 @lack",
    },
    "ukiyo-e": {
      label: "浮世绘",
      artists: ["@hokusai"],
      tags: "ukiyo-e, woodblock print, flat perspective, wave patterns, traditional japanese colors, bold outlines",
      hint: "浮世绘：木版画平视构图 + 传统配色 + 装饰性波纹；画师参考 @hokusai",
    },
    chibi: {
      label: "Q 版",
      artists: ["@fuzichoco"],
      tags: "chibi, super deformed, cute, simple shapes, thick outlines, pastel palette",
      hint: "Q 版：大头小身 + 简化造型 + 粗轮廓；画师参考 @fuzichoco",
    },
    cinematic: {
      label: "电影光影",
      artists: ["@redjuice"],
      tags: "cinematic lighting, dramatic shadows, volumetric light, film still, detailed background, anamorphic",
      hint: "电影光影：体积光 + 强明暗 + 电影镜头感；画师参考 @redjuice",
    },
    illustration: {
      label: "日系插画",
      artists: ["@fuzichoco"],
      tags: "Japanese illustration, soft painterly rendering, detailed eyes, elegant composition, rich colors",
      hint: "日系插画：柔和上色 + 精细眼睛 + 华丽构图；画师参考 @fuzichoco",
    },
    cyberpunk: {
      label: "赛博霓虹",
      artists: ["@redjuice"],
      tags: "cyberpunk, neon lights, high contrast, futuristic city, chromatic aberration, night scene",
      hint: "赛博霓虹：霓虹灯 + 高对比 + 未来都市；画师参考 @redjuice",
    },
  };

  function clean(value) {
    return String(value || "").replace(/\s+/g, " ").replace(/,\s*,/g, ",").trim().replace(/^,|,$/g, "");
  }

  const IDEA_TAGS = [
    { pattern: /银发|白发|silver hair|white hair/i, tags: ["silver hair"] },
    { pattern: /黑发|black hair/i, tags: ["black hair"] },
    { pattern: /金发|blonde|blond hair/i, tags: ["blonde hair"] },
    { pattern: /粉发|pink hair/i, tags: ["pink hair"] },
    { pattern: /蓝发|blue hair/i, tags: ["blue hair"] },
    { pattern: /红发|red hair/i, tags: ["red hair"] },
    { pattern: /棕发|brown hair/i, tags: ["brown hair"] },
    { pattern: /双马尾|twintails/i, tags: ["twintails"] },
    { pattern: /长发|long hair/i, tags: ["long hair"] },
    { pattern: /短发|short hair/i, tags: ["short hair"] },
    { pattern: /马尾|ponytail/i, tags: ["ponytail"] },
    { pattern: /红瞳|红眼|red eyes/i, tags: ["red eyes"] },
    { pattern: /蓝瞳|蓝眼|blue eyes/i, tags: ["blue eyes"] },
    { pattern: /金瞳|金眼|yellow eyes|golden eyes/i, tags: ["yellow eyes"] },
    { pattern: /绿瞳|绿眼|green eyes/i, tags: ["green eyes"] },
    { pattern: /异色瞳|heterochromia/i, tags: ["heterochromia"] },
    { pattern: /水手服|sailor suit|sailor uniform/i, tags: ["sailor suit"] },
    { pattern: /校服|school uniform/i, tags: ["school uniform"] },
    { pattern: /连衣裙|dress|裙子/i, tags: ["dress"] },
    { pattern: /和服|kimono/i, tags: ["kimono"] },
    { pattern: /黑丝|black pantyhose|black tights/i, tags: ["black pantyhose"] },
    { pattern: /白丝|white pantyhose|white tights/i, tags: ["white pantyhose"] },
    { pattern: /眼镜|glasses/i, tags: ["glasses"] },
    { pattern: /帽子|hat/i, tags: ["hat"] },
    { pattern: /围巾|scarf/i, tags: ["scarf"] },
    { pattern: /坐|sitting|sit down/i, tags: ["sitting"] },
    { pattern: /站|standing|stand up/i, tags: ["standing"] },
    { pattern: /躺|lying|lie down/i, tags: ["lying"] },
    { pattern: /看书|reading book|读书/i, tags: ["reading book"] },
    { pattern: /回头|looking back/i, tags: ["looking back"] },
    { pattern: /伸手|reaching out/i, tags: ["reaching out"] },
    { pattern: /跑|running/i, tags: ["running"] },
    { pattern: /微笑|smile|笑笑/i, tags: ["smile"] },
    { pattern: /安静|calm|peaceful/i, tags: ["calm"] },
    { pattern: /困|sleepy|睡意/i, tags: ["sleepy"] },
    { pattern: /悲伤|sad|难过/i, tags: ["sad"] },
    { pattern: /樱花|cherry blossom|sakura/i, tags: ["cherry blossoms"] },
    { pattern: /森林|forest|树林/i, tags: ["forest"] },
    { pattern: /树下|under tree/i, tags: ["under tree"] },
    { pattern: /长椅|bench/i, tags: ["bench"] },
    { pattern: /床|bed/i, tags: ["bed"] },
    { pattern: /海边|ocean|beach|海滩/i, tags: ["ocean", "beach"] },
    { pattern: /教室|classroom/i, tags: ["classroom"] },
    { pattern: /咖啡厅|cafe|咖啡店/i, tags: ["cafe"] },
    { pattern: /城市|city|街道/i, tags: ["city"] },
    { pattern: /夜晚|night/i, tags: ["night"] },
    { pattern: /雨天|rain|下雨/i, tags: ["rain"] },
    { pattern: /雪|snow/i, tags: ["snow"] },
    { pattern: /柔光|soft light|柔和光线/i, tags: ["soft lighting"] },
    { pattern: /逆光|backlight/i, tags: ["backlight"] },
    { pattern: /电影光|cinematic lighting/i, tags: ["cinematic lighting"] },
    { pattern: /阳光|sunlight|日光/i, tags: ["sunlight"] },
    { pattern: /霓虹|neon/i, tags: ["neon lights"] },
    { pattern: /斑驳|dappled/i, tags: ["dappled sunlight"] },
    { pattern: /全身|full body/i, tags: ["full body"] },
    { pattern: /半身|upper body/i, tags: ["upper body"] },
    { pattern: /特写|close-up|closeup/i, tags: ["close-up"] },
    { pattern: /俯视|from above/i, tags: ["from above"] },
    { pattern: /低角度|from below/i, tags: ["from below"] },
    { pattern: /芙莉莲|frieren/i, tags: ["frieren"], character: "frieren" },
    { pattern: /葬送的芙莉莲|sousou no frieren/i, tags: [], work: "sousou no frieren" },
  ];

  const CHARACTERS = Array.isArray(window.ANIMA_CHARACTERS) ? window.ANIMA_CHARACTERS : [];

  function characterCandidates(idea) {
    const value = String(idea || "").toLowerCase();
    const hits = [];
    const compactValue = value.replace(/\s+/g, "");
    for (const entry of CHARACTERS) {
      const aliases = [entry.name, entry.tag, entry.zh, ...(entry.aliases || [])]
        .filter(Boolean)
        .map((item) => String(item).toLowerCase());
      let hit = aliases.find((alias) => alias.length >= 2 && value.includes(alias));
      if (!hit) {
        hit = (entry.pinyin || []).find((pinyin) => {
          const compact = String(pinyin).toLowerCase().replace(/\s+/g, "");
          return compact.length >= 3 && compactValue.includes(compact);
        });
      }
      if (hit) hits.push({ entry, hit });
    }
    const unique = [];
    const seen = new Set();
    for (const item of hits) {
      if (seen.has(item.entry.tag)) continue;
      seen.add(item.entry.tag);
      unique.push(item.entry);
    }
    const narrowed = unique.filter((entry) => {
      const work = String(entry.work || "").toLowerCase();
      const workZh = String(entry.work_zh || "").toLowerCase();
      return (work && value.includes(work)) || (workZh && value.includes(workZh));
    });
    return narrowed.length ? narrowed : unique;
  }

  function renderCharacterChoices(entries) {
    const box = $("#characterChoices");
    if (!box) return;
    box.classList.remove("hidden");
    box.innerHTML = "<small>找到多个同名角色，请选择作品：</small>" + entries
      .map(
        (entry) =>
          `<button data-tag="${escapeHtml(entry.tag)}">${escapeHtml(entry.zh || entry.name)} · ${escapeHtml(
            entry.work_zh || entry.work,
          )}</button>`,
      )
      .join("");
    box.querySelectorAll("button").forEach((node) => {
      node.addEventListener("click", () => {
        const entry = CHARACTERS.find((item) => item.tag === node.dataset.tag);
        if (entry) {
          state.forcedCharacter = entry;
          box.classList.add("hidden");
          generateIdeaPrompt();
        }
      });
    });
  }

  function countForIdea(idea) {
    if (/两个女孩|2girls|two girls/i.test(idea)) return "2girls";
    if (/两个男孩|2boys|two boys/i.test(idea)) return "2boys";
    if (/男孩|1boy|boy/i.test(idea)) return "1boy, solo";
    return "1girl, solo";
  }

  function applyCharacter(entry, idea) {
    $("#animaSubject").value = `${countForIdea(idea)}, ${entry.tag}`;
    $("#animaWork").value = entry.work || "";
    updateAnimaPreview();
    toast(`已识别角色：${entry.zh || entry.name} · ${entry.work_zh || entry.work}`);
  }

  function generateIdeaPrompt() {
    const idea = String($("#ideaInput")?.value || "").trim();
    if (!idea) {
      toast("先用一句话描述画面。");
      return;
    }
    const tags = [];
    let character = "";
    let work = "";
    const candidates = state.forcedCharacter ? [state.forcedCharacter] : characterCandidates(idea);
    state.forcedCharacter = null;
    if (candidates.length > 1) {
      renderCharacterChoices(candidates);
      toast("这个角色名对应多部作品，请在下方选择。");
      return;
    }
    if (candidates.length === 1) {
      character = candidates[0].tag;
      work = candidates[0].work || "";
    }
    if (/2\.5D|2.5d|厚涂|半写实/i.test(idea)) applyStyle("painterly");
    else if (/黑白|日式漫画|manga/i.test(idea)) applyStyle("manga-bw");
    else if (/水墨|ink wash/i.test(idea)) applyStyle("ink-wash");
    else if (/赛璐珞|cel/i.test(idea)) applyStyle("anime-cel");
    for (const entry of IDEA_TAGS) {
      if (!entry.pattern.test(idea)) continue;
      for (const tag of entry.tags) if (!tags.includes(tag)) tags.push(tag);
      if (entry.character) character = entry.character;
      if (entry.work) work = entry.work;
    }
    const countMatch = idea.match(/两个女孩|2girls|two girls/i)
      ? "2girls"
      : idea.match(/两个男孩|2boys|two boys/i)
        ? "2boys"
        : idea.match(/男孩|1boy|boy/i)
          ? "1boy, solo"
          : "1girl, solo";
    const subject = [countMatch, character].filter(Boolean).join(", ");
    $("#animaSubject").value = subject;
    $("#animaWork").value = work;
    const uniqueTags = [...new Set(tags.filter((tag) => !subject.includes(tag)))];
    if (uniqueTags.length) $("#animaTags").value = uniqueTags.join(", ");
    if (!$("#animaQuality").value.trim()) {
      $("#animaQuality").value = "masterpiece, best quality, score_7, safe";
    }
    const sceneWords = tags.filter((tag) => /forest|cherry|ocean|classroom|cafe|city|night|rain|snow|bench/.test(tag));
    const moodMap = { calm: "peaceful", sleepy: "sleepy", sad: "melancholic", smile: "cheerful" };
    const moodTag = tags.find((tag) => /calm|sleepy|sad|smile/.test(tag)) || "calm";
    const mood = moodMap[moodTag] || "quiet";
    const light = tags.find((tag) => /light|sunlight|backlight|neon|dappled/.test(tag)) || "soft light";
    const pose = tags.includes("lying") ? "lying" : tags.includes("sitting") ? "sitting" : "standing";
    const place = tags.includes("bed") && pose === "lying" ? " on a bed" : "";
    const sceneRest = sceneWords.filter((tag) => !(place && tag === "bed"));
    const scenePhrase = sceneRest.length ? ` in a scene with ${sceneRest.join(" and ")}` : "";
    $("#animaNatural").value = `The character is ${pose}${place}${scenePhrase}, and the mood feels ${mood} with ${light}.`;
    updateAnimaPreview();
    toast("已生成标准提示词，可以继续修改。");
  }

  const API_PRESETS = {
    openai: { url: "https://api.openai.com/v1", model: "gpt-image-1" },
    siliconflow: { url: "https://api.siliconflow.cn/v1", model: "Kwai-Kolors/Kolors" },
    zhipu: { url: "https://open.bigmodel.cn/api/paas/v4", model: "cogview-3-flash" },
    volcengine: { url: "https://ark.cn-beijing.volces.com/api/v3", model: "doubao-seedream-3-0-t2i-250415" },
    minimax: { url: "https://api.minimax.chat/v1", model: "image-01" },
  };

  function applyEngineUI() {
    const engine = state.config?.engine || "local";
    const apiFields = $("#apiFields");
    if (apiFields) apiFields.classList.toggle("hidden", engine !== "api");
    const start = $("#engineStart");
    if (start) start.classList.toggle("hidden", engine === "api");
    if (engine === "api") {
      setStatus(true, "外部 API", state.config?.apiUrl || "未配置");
    }
  }

  function styleSuffix(style) {
    if (!style) return "";
    return [...(style.artists || []), style.tags].filter(Boolean).join(", ");
  }

  function composeAnimaPrompt(style = null) {
    const quality = clean($("#animaQuality")?.value);
    const subject = clean($("#animaSubject")?.value);
    const work = clean($("#animaWork")?.value);
    const artistRaw = clean($("#animaArtist")?.value);
    const tagsRaw = clean($("#animaTags")?.value);
    const natural = String($("#animaNatural")?.value || "").trim();
    const artist = artistRaw ? (artistRaw.startsWith("@") ? artistRaw : `@${artistRaw}`) : "";
    const styleTags = style?.tags || "";
    const styleArtists = style?.artists || [];
    const seenArtists = new Set();
    const artistPart = [...styleArtists, artist]
      .filter(Boolean)
      .filter((value) => {
        const key = value.toLowerCase();
        if (seenArtists.has(key)) return false;
        seenArtists.add(key);
        return true;
      })
      .join(", ");
    const tags = [tagsRaw, styleTags].filter(Boolean).join(", ");
    return [quality, subject, work, artistPart, tags, natural].filter(Boolean).join(", ");
  }

  function validateAnimaPrompt(text) {
    const issues = [];
    if (!/masterpiece|best quality|score_\d/i.test(text)) {
      issues.push("缺少质量词（masterpiece / best quality / score_7）");
    }
    if (!text.includes("@")) {
      issues.push("缺少 @画师");
    }
    const tags = text.split(",").map((tag) => tag.trim().toLowerCase()).filter(Boolean);
    const seen = new Set();
    const duplicates = new Set();
    for (const tag of tags) {
      if (tag.length > 24) continue;
      if (seen.has(tag)) duplicates.add(tag);
      seen.add(tag);
    }
    if (duplicates.size) issues.push(`重复 tag：${[...duplicates].slice(0, 3).join(", ")}`);
    return issues;
  }

  function updateAnimaPreview() {
    const preview = $("#animaPreview");
    const warning = $("#animaWarning");
    const check = $("#animaCheck");
    if (!preview) return;
    const artistRaw = clean($("#animaArtist")?.value);
    const style = STYLES[state.style];
    const composed = state.animaMode
      ? composeAnimaPrompt(style)
      : [$("#prompt").value.trim(), styleSuffix(style)].filter(Boolean).join(", ");
    preview.textContent = composed || "填写上方字段后自动生成最终提示词";
    if (warning) warning.classList.toggle("hidden", !(state.animaMode && artistRaw && !artistRaw.startsWith("@")));
    if (check) {
      const issues = state.animaMode ? validateAnimaPrompt(composed) : [];
      check.textContent = issues.length ? `检查：${issues.join("；")}` : "检查：顺序与基础结构正常";
      check.classList.toggle("warn", issues.length > 0);
    }
    return composed;
  }

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
    if (state.config?.engine === "api") {
      applyEngineUI();
      $("#gpuLabel").textContent = "API";
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
    const hint = $("#styleHint");
    if (hint) hint.textContent = STYLES[style]?.hint || "";
    updateAnimaPreview();
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
    const style = STYLES[state.style];
    const prompt = state.animaMode
      ? composeAnimaPrompt(style)
      : [$("#prompt").value.trim(), styleSuffix(style)].filter(Boolean).join(", ");
    if (!prompt) {
      $("#prompt").focus();
      toast("先写提示词，或在 ANIMA 标准提示词里填写角色。");
      return;
    }
    const aspect = ASPECTS[state.aspect];
    const steps = Number($("#steps").value);
    const cfg = Number($("#cfg").value);
    const batch = Number($("#batch").value);
    const hires = Boolean($("#hires")?.checked);
    const faceDetail = Boolean($("#faceDetail")?.checked);
    const denoise = Number($("#denoise")?.value || 0.45);
    const seedValue = Number($("#seed").value);
    const seed = Number.isFinite(seedValue) && seedValue >= 0 ? Math.floor(seedValue) : -1;
    const negative = $("#negative").value.trim();
    setBusy(true);
    updateProgress({ stage: "连接 ComfyUI...", progress: 0 });
    $("#resultMeta").textContent = "生成中";
    try {
      const res = await bridge.generate({
        prompt,
        negative,
        width: aspect.width,
        height: aspect.height,
        steps,
        cfg,
        batch,
        seed,
        hires,
        hiresScale: 1.5,
        hiresSteps: 10,
        faceDetail,
        initImage: state.initImage,
        denoise,
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
    $("#settingEngine").value = state.config.engine || "local";
    $("#settingUrl").value = state.config.comfyUrl || "";
    $("#settingDir").value = state.config.comfyDir || "";
    $("#settingPython").value = state.config.pythonExe || "";
    $("#settingApiUrl").value = state.config.apiUrl || "";
    $("#settingApiModel").value = state.config.apiModel || "";
    $("#settingApiKey").value = "";
    $("#settingUnet").value = state.config.unet || "";
    $("#settingClip").value = state.config.clip || "";
    $("#settingVae").value = state.config.vae || "";
    $("#settingLora").value = state.config.lora || "";
    $("#apiFields").classList.toggle("hidden", (state.config.engine || "local") !== "api");
    $("#settingsModal").classList.remove("hidden");
  }

  async function saveSettings() {
    if (!bridge) return;
    const patch = {
      engine: $("#settingEngine").value,
      comfyUrl: $("#settingUrl").value.trim() || "http://127.0.0.1:8188",
      comfyDir: $("#settingDir").value.trim(),
      pythonExe: $("#settingPython").value.trim(),
      unet: $("#settingUnet").value.trim(),
      clip: $("#settingClip").value.trim(),
      vae: $("#settingVae").value.trim(),
      lora: $("#settingLora").value.trim(),
      apiUrl: $("#settingApiUrl").value.trim(),
      apiModel: $("#settingApiModel").value.trim(),
    };
    const apiKey = $("#settingApiKey").value.trim();
    if (apiKey) patch.apiKey = apiKey;
    try {
      state.config = await bridge.setConfig(patch);
      $("#settingsModal").classList.add("hidden");
      toast("设置已保存。");
      applyEngineUI();
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
      node.addEventListener("click", () => {
        applyStyle(node.dataset.style);
        updateAnimaPreview();
      });
    });
    $("#animaMode").addEventListener("change", (event) => {
      state.animaMode = event.target.checked;
      $("#animaFields").classList.toggle("disabled", !state.animaMode);
      updateAnimaPreview();
    });
    ["#animaQuality", "#animaSubject", "#animaWork", "#animaArtist", "#animaTags", "#animaNatural"].forEach((selector) => {
      const node = $(selector);
      if (node) node.addEventListener("input", updateAnimaPreview);
    });
    $("#generatePrompt").addEventListener("click", generateIdeaPrompt);
    $("#copyAnima").addEventListener("click", async () => {
      const text = updateAnimaPreview();
      try {
        await navigator.clipboard.writeText(text);
        toast("最终提示词已复制。");
      } catch {
        toast(text);
      }
    });
    const setReferenceFile = (file) => {
      if (!file || !file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        state.initImage = String(reader.result || "");
        $("#referencePreview").src = state.initImage;
        $("#referencePreview").classList.remove("hidden");
        $("#referenceEmpty").classList.add("hidden");
        $("#referenceClear").classList.remove("hidden");
        toast("参考图已加载，只在本机使用。");
      };
      reader.readAsDataURL(file);
    };
    $("#referenceDrop").addEventListener("click", () => $("#referenceInput").click());
    $("#referenceInput").addEventListener("change", (event) => setReferenceFile(event.target.files?.[0]));
    $("#referenceDrop").addEventListener("dragover", (event) => {
      event.preventDefault();
      $("#referenceDrop").classList.add("dragging");
    });
    $("#referenceDrop").addEventListener("dragleave", () => $("#referenceDrop").classList.remove("dragging"));
    $("#referenceDrop").addEventListener("drop", (event) => {
      event.preventDefault();
      $("#referenceDrop").classList.remove("dragging");
      setReferenceFile(event.dataTransfer?.files?.[0]);
    });
    $("#referenceClear").addEventListener("click", (event) => {
      event.stopPropagation();
      state.initImage = "";
      $("#referencePreview").src = "";
      $("#referencePreview").classList.add("hidden");
      $("#referenceEmpty").classList.remove("hidden");
      $("#referenceClear").classList.add("hidden");
    });
    $("#denoise").addEventListener("input", () => {
      $("#denoiseValue").textContent = `${Math.round(Number($("#denoise").value) * 100)}%`;
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
    $("#settingEngine").addEventListener("change", () => {
      $("#apiFields").classList.toggle("hidden", $("#settingEngine").value !== "api");
    });
    $("#apiPreset").addEventListener("change", () => {
      const preset = API_PRESETS[$("#apiPreset").value];
      if (!preset) return;
      $("#settingApiUrl").value = preset.url;
      $("#settingApiModel").value = preset.model;
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
    applyEngineUI();
    $("#steps").value = state.config.steps || 30;
    $("#stepsValue").textContent = $("#steps").value;
    if ($("#hires")) $("#hires").checked = Boolean(state.config.hires);
    if ($("#faceDetail")) $("#faceDetail").checked = Boolean(state.config.faceDetail);
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
    updateAnimaPreview();
    void bind();
  });
})();
