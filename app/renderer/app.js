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
    characterImage: "",
    referenceLibrary: [],
    referenceSize: null,
    referenceAutoSize: true,
    customWorkflow: null,
    trainingQueue: [],
    styleLoras: { "gal-3d": "make25d_type2_v100.safetensors" },
    models: { checkpoints: [], unets: [], clips: [], vaes: [], loras: [] },
    config: null,
    health: null,
    images: [],
    selectedPaths: new Set(),
    results: [],
    detailZoom: 1,
    detailPanX: 0,
    detailPanY: 0,
    aiMessages: [],
    aiLastAnswer: "",
    aiBusy: false,
    aiStreaming: false,
    aiDraft: "",
    catalog: [],
    catalogLoaded: false,
    referenceCategories: [],
    referenceShowAll: false,
    textureImage: "",
    styleReferenceLoading: false,
    promptRecipes: [],
    editingPromptId: null,
    favorites: new Set(JSON.parse(localStorage.getItem("lumen-favorites") || "[]")),
    hiddenMode: "visible",
    upscaleSource: null,
    upscaleResult: null,
    repairTarget: null,
    repairRect: null,
    characterCatalog: null,
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

  const STYLE_MODELS = {
    "anima-base": { unet: "anima-base-v1.0.safetensors" },
    painterly: { unet: "anima-base-v1.0.safetensors", lora: "25d_anima_v4.safetensors", loraStrength: 0.55 },
    "2.5d-thick": { unet: "anima-base-v1.0.safetensors" },
    "2.5d-thick-soft": { unet: "anima-base-v1.0.safetensors" },
    "gal-3d": { modelMode: "checkpoint", checkpoint: "MeinaMix-V10.safetensors" },
    "ririko-cel": { unet: "anima-base-v1.0.safetensors" },
    "mushroom-moe": { unet: "anima-base-v1.0.safetensors" },
    "25d-lora": { unet: "anima-base-v1.0.safetensors" },
    "target-25d": { unet: "anima-base-v1.0.safetensors" },
  };

  const STYLES = {
    "anima-base": {
      label: "Anima 基础",
      artists: [],
      tags: "",
      hint: "Anima 基础：不加载画风 LoRA，保留基础模型的原生动漫插画质感",
      negative: "flat color, cel shading, lineart only, flat lighting, comic panel",
      lora: "",
      loraStrength: 0,
    },
    "follow-prompt": {
      label: "跟随提示词",
      artists: [],
      tags: "",
      hint: "跟随提示词：不额外注入画风 LoRA，完全按当前提示词生成",
      lora: "",
      loraStrength: 0,
    },
    "anime-cel": {
      label: "平面赛璐珞",
      artists: [],
      tags: "masterpiece, best quality, highres, absurdres, ultra detailed, anime cel shading, two-tone shading, crisp cel shadows, detailed shading, ambient occlusion, rim light, detailed eyes, detailed hair, detailed fabric, detailed folds, soft cinematic lighting, japanese anime key visual",
      negative: "flat lighting, no shadows, simple shading, low detail, blurry, sketch, unfinished, plain background, glossy skin, 3d render, cgi, realistic, photographic",
      hint: "平面赛璐珞：平涂色块 + 清晰外轮廓 + 有限色板；画师参考  / ",
    },
    "2.5d-thick": {
      label: "2.5D 厚涂",
      artists: [],
      tags: "2.5D, semi-realistic anime, 3D anime figure render, pseudo-3D shading, soft global illumination, ambient occlusion, subsurface scattering, glossy specular skin, volumetric light, rim light, studio lighting, depth of field, cinematic bokeh, smooth surfaces, physically based rendering look, ultra detailed",
      hint: "2.5D 厚涂：伪 3D 立体感（体积光/环境光遮蔽/次表面/镜面高光），不是油画笔触；参考图 img2img，重绘 0.85–0.90",
      negative: "oil painting, brush strokes, canvas texture, impasto, flat shading, cel shading, lineart only, flat lighting, comic panel",
      lora: "",
      loraStrength: 0,
    },
    "2.5d-thick-soft": {
      label: "2.5D 柔光",
      artists: [],
      tags: "2.5D, semi-realistic anime, pseudo-3D shading, anime illustration rendering, soft global illumination, ambient occlusion, subsurface scattering, diffuse reflection, soft broad highlights, soft-edged specular, gentle skin sheen, semi-matte skin, smooth diffuse shading, even skin lighting, detailed individual hair strands, silky hair, natural hair flow, wispy strands, layered hair, matte hair with gentle sheen, hair strands catching soft light, anime hair shading, warm rim light, cool rim light, soft ambient light, cinematic bokeh, depth of field, high detail",
      hint: "2.5D 柔光：身体漫反射 + 头发去塑料感（发丝/柔和光泽）。建议 CFG 4.5、重绘 0.80–0.85",
      negative: "mirror reflection, sharp specular spot, hard highlight edge, wet plastic, glossy plastic, latex, blown highlights, overexposed highlights, glow bloom, plastic sheen, plastic hair, sculpted hair, helmet hair, hard hair highlights, glossy hair, metal hair, bright white highlight streak on hair, hard specular band on hair, clumped hair, hair blob, solid hair mass, resin hair, toy hair, cel shading, lineart only",
      lora: "",
      loraStrength: 0,
    },
    painterly: {
      label: "2.5D 半写实",
      artists: [],
      tags: "semi-realistic anime, soft cel shading, clean anime rendering, delicate lineart, soft gradients, glossy skin, detailed skin, 2.5D",
      hint: "2.5D 半写实：干净动画渲染 + 柔和渐变 + 细腻皮肤，不是厚涂油画；画师参考  / ",
    },
    "gal-3d": {
      label: "Galgame 3D",
      artists: [],
      tags: "semi-realistic anime, 2.5D, soft shading, glossy skin, detailed skin, cinematic lighting, depth of field",
      hint: "Galgame/3DCG 2.5D：使用 make25d 风格 LoRA；需要 Checkpoint 模型",
      lora: "make25d_type2_v100.safetensors",
      loraStrength: 0.55,
    },
    "ririko-cel": {
      label: "清透赛璐珞",
      tags: "ririko_cel_style, anime cel shading, flat colors, clean lineart, crisp shadow edges, bright clean colors, detailed hands, detailed toes",
      hint: "清透赛璐珞：平涂色块、清晰外轮廓、明确阴影边缘",
      lora: "ririko_anima_v2.safetensors",
      loraStrength: 0.8,
    },
    "mushroom-moe": {
      label: "柔和萌系",
      tags: "mushroom_moe_style, moe anime, cute stylized proportions, soft colorful shading, glossy highlights, playful props, clean anime rendering",
      hint: "柔和萌系：柔和上色、萌系比例、明亮配色",
      lora: "mushroom_anima_v2.safetensors",
      loraStrength: 0.8,
    },
    "bilibili-cel": {
      label: "B站精选赛璐珞",
      tags: "bilibili_flat_cel_style, score_9, score_8, highres, absurdres, ultra detailed, anime cel shading, clean lineart, crisp shadow edges, detailed fabric",
      hint: "B站精选 · 赛璐珞：Anima + bilibili_flat_cel LoRA",
      lora: "bilibili_flat_cel_anima_v1.safetensors",
      loraStrength: 0.75,
    },
    "bilibili-25d": {
      label: "B站精选2.5D",
      tags: "bilibili_2_5d_semi_style, score_9, score_8, highres, absurdres, ultra detailed, 2.5D, semi-realistic anime, blending, subsurface scattering, side lighting, prime lens, foreground blur",
      hint: "B站精选 · 2.5D：Anima + bilibili_2_5d LoRA",
      lora: "bilibili_2_5d_semi_anima_v1.safetensors",
      loraStrength: 0.75,
    },
    "bilibili-moe": {
      label: "B站精选萌系",
      tags: "bilibili_moe_2d_style, score_9, score_8, highres, absurdres, ultra detailed, moe anime, soft colorful shading, glossy highlights, clean anime rendering",
      hint: "B站精选 · 萌系：Anima + bilibili_moe_2d LoRA",
      lora: "bilibili_moe_2d_anima_v1.safetensors",
      loraStrength: 0.75,
    },
    "25d-lora": {
      label: "2.5D LoRA",
      tags: "25d_semi_style, 2.5D, semi-realistic anime, score_9, score_8, score_7, highres, absurdres, ultra detailed, soft shading, soft gradients, detailed skin, side lighting, medium wide shot, off-center composition, prime lens, foreground blur, cinematic lighting",
      hint: "2.5D 半写实：Anima + 25d_anima_v1 LoRA；公共 2.5D 参考训练",
      lora: "25d_anima_v4.safetensors",
      loraStrength: 0.75,
    },
    "target-25d": {
      label: "目标 2.5D",
      tags: "target_25d_style, 2.5D anime, semi-realistic anime, soft airbrushed shading, glossy skin, detailed eyes, detailed hair, cinematic lighting, clean soft lineart, polished illustration",
      hint: "目标 2.5D：25d_anima_v5，柔光皮肤与半写实质感",
      lora: "25d_anima_v5.safetensors",
      loraStrength: 0.45,
    },
    "manga-bw": {
      label: "黑白日式漫画",
      artists: [],
      tags: "black and white manga, screentone, high contrast ink, panel composition, monochrome, screentones",
      hint: "黑白日漫：网点纸 + 高对比墨线 + 分镜感；画师参考  / ",
    },
    "ink-wash": {
      label: "水墨风",
      artists: [],
      tags: "ink wash painting, sumi-e, flowing brush strokes, negative space, muted paper texture, japanese ink",
      hint: "水墨：墨色晕染 + 留白 + 纸纹；画师参考 ",
    },
    retro: {
      label: "90 年代复古赛璐珞",
      artists: [],
      tags: "1990s anime, retro cel, film grain, muted colors, vintage animation, hand-painted background",
      hint: "复古赛璐珞：90 年代动画色偏 + 颗粒 + 手绘背景；画师参考 ",
    },
    pastel: {
      label: "柔和粉彩",
      artists: [],
      tags: "soft pastel colors, airy lighting, delicate lineart, dreamy atmosphere, light watercolor texture",
      hint: "柔和粉彩：低饱和 + 空气感 + 轻水彩；画师参考 ",
    },
    lineart: {
      label: "精细线稿",
      artists: [],
      tags: "fine lineart, monochrome, detailed ink illustration, hatching, concept art, clean contours",
      hint: "精细线稿：细密排线 + 干净轮廓 + 概念设定感；画师参考 ",
    },
    "ukiyo-e": {
      label: "浮世绘",
      artists: [],
      tags: "ukiyo-e, woodblock print, flat perspective, wave patterns, traditional japanese colors, bold outlines",
      hint: "浮世绘：木版画平视构图 + 传统配色 + 装饰性波纹；画师参考 ",
    },
    chibi: {
      label: "Q 版",
      artists: [],
      tags: "chibi, super deformed, cute, simple shapes, thick outlines, pastel palette",
      hint: "Q 版：大头小身 + 简化造型 + 粗轮廓；画师参考 ",
    },
    cinematic: {
      label: "电影光影",
      artists: [],
      tags: "cinematic lighting, dramatic shadows, volumetric light, film still, detailed background, anamorphic",
      hint: "电影光影：体积光 + 强明暗 + 电影镜头感；画师参考 ",
    },
    illustration: {
      label: "日系插画",
      artists: [],
      tags: "Japanese illustration, soft painterly rendering, detailed eyes, elegant composition, rich colors",
      hint: "日系插画：柔和上色 + 精细眼睛 + 华丽构图；画师参考 ",
    },
    cyberpunk: {
      label: "赛博霓虹",
      artists: [],
      tags: "cyberpunk, neon lights, high contrast, futuristic city, chromatic aberration, night scene",
      hint: "赛博霓虹：霓虹灯 + 高对比 + 未来都市；画师参考 ",
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
    { pattern: /下雪|雪天|雪景|雪花|snowfall|snowy/i, tags: ["snow"] },
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

  // Common Chinese names / aliases that are not present in the English booru catalog.
  const ZH_CHARACTER_ALIASES = [
    { pattern: /\u76ee\u767d\u963f\u5c14\u4e39|\u76ee\u767d\u963f\u723e\u4e39|\u76ee\u767d\u963f\u4e39|\u963f\u4e39|mejiro[ _]ardan/i, tag: "mejiro ardan (umamusume)" },
    { pattern: /\u8fd1\u6c5f|\u304a\u3046\u307f|oumi/i, tag: "oumi (azur lane)" },
    { pattern: /\u67f4\u90e1|\u30c1\u30a7\u30b7\u30e3\u30fc|cheshire/i, tag: "cheshire (azur lane)" },
    { pattern: /\u76ee\u767d\u9ea6\u6606|\u9ea6\u6606|mejiro[ _]mcqueen/i, tag: "mejiro mcqueen (umamusume)" },
    { pattern: /\u4e1c\u6d77\u5e1d\u738b|\u6771\u6d77\u5e1d\u738b|tokai[ _]teio/i, tag: "tokai teio (umamusume)" },
    { pattern: /\u7279\u522b\u5468|\u7279\u5225\u9031|special[ _]week/i, tag: "special week (umamusume)" },
    { pattern: /\u65e0\u58f0\u94c3\u9e7f|\u7121\u8072\u9234\u9e7f|silence[ _]suzuka/i, tag: "silence suzuka (umamusume)" },
    { pattern: /\u5f85\u517c\u798f\u6765|\u4ee3\u517c\u798f\u6765|\u5f85\u517c\u798f\u4f86|\u30de\u30c1\u30ab\u30cd\u30d5\u30af\u30ad\u30bf\u30eb|matikane[ _]?fukukitaru|fukukitaru/i, tag: "matikanefukukitaru (umamusume)" },
  ];

  const ZH_SCENE_TAGS = [
    { pattern: /\u6811\u836b|\u6811\u9634|\u6811\u4e0b|\u6811\u5f71|\u6797\u836b/i, tags: ["under tree", "tree shade", "dappled sunlight", "leaves"] },
    { pattern: /\u5fae\u7b11|\u7b11|\u7b11\u5bb9/i, tags: ["smile"] },
    { pattern: /\u7ad9\u7acb|\u7ad9\u7740|\u7ad9\u5728|\u7ad9\u59ff/i, tags: ["standing"] },
    { pattern: /\u8d5b\u9a6c\u5a18|\u8cfd\u99ac\u5a18|umamusume/i, tags: ["umamusume", "horse girl"] },
    { pattern: /\u6cf3\u6c60|\u6c60\u8fb9|\u6c34\u6c60/i, tags: ["poolside", "pool"] },
    { pattern: /\u591c\u665a|\u591c\u666f|\u665a\u4e0a/i, tags: ["night", "city lights"] },
    { pattern: /\u8eba\u5728\u5e8a\u4e0a|\u8eba\u5e8a|\u8eba\u7740|\u8db4\u5e8a/i, tags: ["lying", "on bed"] },
    { pattern: /\u5750\u5728\u5e8a\u4e0a|\u5750\u5728\u5e8a|\u5750\u5e8a/i, tags: ["sitting", "on bed"] },
    { pattern: /\u542b\u60c5\u8109\u8109|\u6df1\u60c5|\u6e29\u67d4\u5730\u770b/i, tags: ["looking at viewer", "affectionate gaze", "gentle smile"] },
    { pattern: /\u5750\u5728\u6905\u5b50|\u5750\u6905\u5b50|on chair/i, tags: ["sitting", "on chair", "chair"] },
    { pattern: /\u53cc\u817f\u81ea\u7136\u5206\u5f00|\u817f\u5206\u5f00|legs apart/i, tags: ["legs apart", "relaxed legs"] },
    { pattern: /\u7741\u4e00\u53ea\u773c|\u95ed\u4e00\u53ea\u773c|one eye closed|wink/i, tags: ["one eye closed", "looking at viewer"] },
    { pattern: /\u624b\u653e\u5634\u5507|\u624b\u6307\u653e\u5634\u5507|hand to mouth|finger to lips/i, tags: ["hand to mouth", "finger to lips"] },
    { pattern: /\u4f4e\u5934\u4fef\u89c6|\u4fef\u89c6|looking down/i, tags: ["head down", "looking down"] },
    { pattern: /\u8d85\u4f4e\u89d2\u5ea6|\u4ef0\u62cd|from below|low angle/i, tags: ["from below", "extreme low angle"] },
    { pattern: /\u7279\u5199\u8db3\u90e8|\u8db3\u90e8\u7279\u5199|foot focus|feet close-up/i, tags: ["feet focus", "close-up on feet"] },
    { pattern: /\u767d\u8272\u4e1d\u889c|\u767d\u4e1d|white pantyhose|white stockings/i, tags: ["white pantyhose", "white stockings"] },
    { pattern: /\u4e0d\u7a7f\u978b|no shoes|barefoot/i, tags: ["no shoes", "barefoot"] },
    { pattern: /\u6e29\u99a8\u6c1b\u56f4|cozy atmosphere|warm atmosphere/i, tags: ["cozy atmosphere", "warm background"] },
    { pattern: /\u8d85\u9ad8\u6e05|\u6781\u81f4\u7ec6\u8282|ultra detailed|cinematic rendering/i, tags: ["ultra detailed", "cinematic rendering"] },
    { pattern: /9[:：]16|9x16|vertical composition/i, tags: ["vertical composition"] },
  ];

  function translateChinesePrompt(text) {
    const value = String(text || "");
    const tags = [];
    for (const entry of ZH_SCENE_TAGS) {
      if (entry.pattern.test(value)) tags.push(...entry.tags);
    }
    for (const alias of ZH_CHARACTER_ALIASES) {
      if (!alias.pattern.test(value)) continue;
      const entry = CHARACTERS.find((item) => item.tag === alias.tag);
      if (entry) tags.push(entry.tag, entry.work, ...(entry.tags || []));
    }
    return [...new Set(tags)];
  }

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
    if (!hits.length) {
      for (const alias of ZH_CHARACTER_ALIASES) {
        if (!alias.pattern.test(value)) continue;
        const entry = CHARACTERS.find((item) => item.tag === alias.tag);
        if (entry) { hits.push({ entry, hit: alias.pattern.source }); break; }
      }
    }
    const uniqueHits = [];
    const seenHits = new Set();
    for (const item of hits) {
      if (seenHits.has(item.entry.tag)) continue;
      seenHits.add(item.entry.tag);
      uniqueHits.push(item.entry);
    }
    const narrowed = uniqueHits.filter((entry) => {
      const work = String(entry.work || "").toLowerCase();
      const workZh = String(entry.work_zh || "").toLowerCase();
      return (work && value.includes(work)) || (workZh && value.includes(workZh));
    });
    return narrowed.length ? narrowed : uniqueHits;
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
      for (const tag of candidates[0].tags || []) {
        if (!["1girl", "1boy", "solo", "2girls", "2boys"].includes(tag) && !tags.includes(tag)) {
          tags.push(tag);
        }
      }
    }
    if (/2\.5D|2.5d|厚涂|半写实/i.test(idea)) applyStyle("painterly");
    else if (/黑白|日式漫画|manga/i.test(idea)) applyStyle("manga-bw");
    else if (/水墨|ink wash/i.test(idea)) applyStyle("ink-wash");
    else if (/赛璐珞|cel/i.test(idea)) applyStyle("anime-cel");
    for (const entry of [...IDEA_TAGS, ...ZH_SCENE_TAGS]) {
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
    const freePrompt = clean($("#prompt")?.value);
    const translatedPromptTags = translateChinesePrompt(freePrompt);
    const textureNote = clean($("#textureNote")?.value);
    const artist = artistRaw ? (artistRaw.startsWith("@") ? artistRaw : `@${artistRaw}`) : "";
    const styleTags = style?.tags || "";
    const styleArtists = [];
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
    // Free/advanced prompt is first-class input; structured fields are optional.
    const merged = [quality, freePrompt, translatedPromptTags.join(", "), subject, work, artistPart, tags, textureNote, natural]
      .filter(Boolean)
      .join(", ");
    const seen = new Set();
    return merged
      .split(",")
      .map((part) => part.trim())
      .filter((part) => {
        if (!part) return false;
        const key = part.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .join(", ");
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
    if (!view) return;
    state.view = view;
    document.querySelectorAll(".view").forEach((node) => node.classList.remove("active"));
    const targetView = document.querySelector(`#view-${view}`);
    if (targetView) targetView.classList.add("active");
    document.querySelectorAll(".nav-item").forEach((node) => node.classList.toggle("active", node.dataset.view === view));
    const title = $("#viewTitle");
    if (title) {
      title.textContent = view === "gallery" ? "Archive" : view === "upscale" ? "Upscale" : "Create";
    }
    if (view === "gallery") void loadGallery();
    if (view === "upscale") void loadUpscaleSources();
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

  function setupCollapsiblePanels() {
    document.querySelectorAll("[data-collapse]").forEach((panel) => {
      const head = panel.querySelector(".panel-head");
      if (!head || head.querySelector(".collapse-toggle")) return;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "mini-button collapse-toggle";
      if (panel.dataset.collapse === "closed") panel.classList.add("collapsed");
      const sync = () => {
        button.textContent = panel.classList.contains("collapsed") ? "展开" : "收起";
        button.setAttribute("aria-expanded", String(!panel.classList.contains("collapsed")));
      };
      sync();
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        panel.classList.toggle("collapsed");
        sync();
      });
      head.appendChild(button);
    });
  }

  function applyUiScale(value) {
    const scale = Math.max(0.8, Math.min(1.4, Number(value) || 1));
    document.body.style.zoom = String(scale);
    $("#fontScaleValue").textContent = `${Math.round(scale * 100)}%`;
  }

  function applyAspect(aspect) {
    state.aspect = aspect;
    document.querySelectorAll(".aspect").forEach((node) => node.classList.toggle("active", node.dataset.aspect === aspect));
    $("#sizeHint").textContent = ASPECTS[aspect].label;
  }

  function resolvePerformanceProfile() {
    const requested = $("#performanceProfile")?.value || "auto";
    const device = state.health?.devices?.[0] || {};
    const free = Number(device.vram_free) || 0;
    let mode = requested;
    if (mode === "auto") {
      mode = free > 0 && free < 3.5 * 1024 ** 3 ? "low" : "quality";
    }
    if (mode === "fast") {
      return { mode, unet: "anima-base-v1.0.safetensors", steps: 20, cfg: 4, hires: false, hiresScale: 1, batch: 1, label: "快速档" };
    }
    if (mode === "low") {
      return { mode, unet: "anima-base-v1.0.safetensors", steps: 16, cfg: 3.5, hires: false, hiresScale: 1, batch: 1, label: "低显存" };
    }
    if (mode === "custom") {
      // 自定义：完全用手动滑杆，不做任何覆盖
      return { mode: "custom", unet: "anima-base-v1.0.safetensors", steps: null, cfg: null, hires: null, hiresScale: 1, batch: null, label: "自定义" };
    }
    return { mode: "quality", unet: "Anima-2.9B-preview-v1.safetensors", steps: 24, cfg: 3.5, hires: true, hiresScale: 1.15, batch: 1, label: "质量档" };
  }

  function applyPerformanceProfile() {
    const profile = resolvePerformanceProfile();
    const hint = $("#performanceHint");
    if (hint) hint.textContent = `${profile.label} · ${profile.unet.includes("2.9B") ? "2.9B" : "旧 Anima"}`;
    return profile;
  }

  function applyStyle(style) {
    state.style = style;
    document.querySelectorAll(".chip").forEach((node) => node.classList.toggle("active", node.dataset.style === style));
    const hint = $("#styleHint");
    if (hint) hint.textContent = STYLES[style]?.hint || "";
    const defaultStrength = STYLE_MODELS[style]?.loraStrength ?? STYLES[style]?.loraStrength ?? 0;
    if ($("#styleStrength")) {
      $("#styleStrength").value = String(defaultStrength);
      $("#styleStrengthValue").textContent = Number(defaultStrength).toFixed(2);
    }
    updateAnimaPreview();
  }

  const STYLE_DETECTORS = [
    { pattern: /anima\s*\u57fa\u7840|\u57fa\u7840\u6a21\u578b|anima base/i, style: "anima-base" },
    { pattern: /@[a-z0-9_]+|\u753b\u5e08/i, style: "follow-prompt" },
    { pattern: /\u67d4\u5149\u539a\u6d82|soft thick/i, style: "2.5d-thick-soft" },
    { pattern: /\u539a\u6d82|2\.5d\s*\u539a\u6d82|thick painting/i, style: "2.5d-thick" },
    { pattern: /2\.5d|\u534a\u5199\u5b9e|semi-realistic/i, style: "painterly" },
    { pattern: /\u8d5b\u749e\u73de|cel[ -]?shading|flat colors/i, style: "anime-cel" },
    { pattern: /\u840c\u7cfb|moe anime|chibi/i, style: "mushroom-moe" },
    { pattern: /\u539a\u6d82|painterly|oil painting/i, style: "painterly" },
    { pattern: /\u9ed1\u767d|manga|screentone|monochrome/i, style: "manga-bw" },
    { pattern: /\u6c34\u58a8|ink wash/i, style: "ink-wash" },
    { pattern: /\u8d5b\u535a|cyberpunk|neon/i, style: "cyberpunk" },
  ];

  function detectStyleFromPrompt(text) {
    const value = String(text || "");
    for (const item of STYLE_DETECTORS) {
      if (item.pattern.test(value)) return item.style;
    }
    return "";
  }

  let autoStyleTimer = null;
  function maybeAutoStyle() {
    if (!$("#autoStyle")?.checked) return;
    clearTimeout(autoStyleTimer);
    autoStyleTimer = setTimeout(() => {
      const detected = detectStyleFromPrompt($("#prompt")?.value || "");
      if (detected && detected !== state.style) applyStyle(detected);
    }, 450);
  }

  function renderResult(image) {
    state.currentImage = image;
    const stage = $("#resultStage");
    stage.innerHTML = `<img src="${image.url}" alt="Lumen Flow output" />`;
    $("#resultMeta").textContent = `Anima · ${image.width || ""} × ${image.height || ""}`;
    $("#resultActions").classList.remove("hidden");
    document.querySelectorAll(".result-thumb").forEach((node) => {
      node.classList.toggle("active", node.dataset.path === image.path);
    });
  }

  function renderResults(images) {
    state.results = images || [];
    const thumbs = $("#resultThumbs");
    if (!images?.length) {
      thumbs.innerHTML = "";
      return;
    }
    thumbs.innerHTML = images
      .map((image, index) => `<button class="result-thumb" data-index="${index}" data-path="${escapeHtml(image.path)}"><img src="${image.url}" alt="result ${index + 1}" /><span>${index + 1}</span></button>`)
      .join("");
    thumbs.querySelectorAll(".result-thumb").forEach((node) => {
      node.addEventListener("click", () => {
        const image = images[Number(node.dataset.index)];
        if (image) renderResult(image);
      });
    });
    renderResult(images[0]);
  }

  function applyDetailTransform() {
    const img = $("#imageDetailPreview");
    if (!img) return;
    img.style.transform = `translate(${state.detailPanX}px, ${state.detailPanY}px) scale(${state.detailZoom})`;
    const value = $("#imageDetailZoomValue");
    if (value) value.textContent = `${Math.round(state.detailZoom * 100)}%`;
  }

  function resetDetailZoom() {
    state.detailZoom = 1;
    state.detailPanX = 0;
    state.detailPanY = 0;
    applyDetailTransform();
  }

  function setDetailZoom(next) {
    state.detailZoom = Math.max(0.25, Math.min(8, Number(next) || 1));
    applyDetailTransform();
  }

  function openImageDetail(image) {
    state.detailImage = image;
    $("#imageDetailPreview").src = image.url;
    $("#imageDetailName").textContent = image.name || "";
    $("#imageDetailTime").textContent = image.createdAt ? new Date(image.createdAt).toLocaleString() : (image.mtime ? new Date(image.mtime).toLocaleString() : "");
    $("#imageDetailMode").textContent = image.upscaled
      ? `高清化 ${image.factor || ""}${image.factor ? "×" : ""} · ${String(image.engine || "").startsWith("model:") ? "AI 模型" : "Lanczos"}`
      : (image.api ? "外部 API" : "本地生成");
    $("#imageDetailPrompt").textContent = image.prompt || "这张图没有保存提示词。";
    $("#imageDetailNegative").textContent = image.negativePrompt || "—";
    $("#imageDetailSize").textContent = image.width && image.height
      ? (image.upscaled && image.sourceWidth
        ? `${image.sourceWidth} × ${image.sourceHeight} → ${image.width} × ${image.height}`
        : `${image.width} × ${image.height}`)
      : "—";
    $("#imageDetailSteps").textContent = image.steps ?? "—";
    $("#imageDetailCfg").textContent = image.cfg ?? "—";
    $("#imageDetailSeed").textContent = image.seed ?? "—";
    $("#imageDetailModel").textContent = image.model || "—";
    $("#imageDetailNotes").value = localStorage.getItem(`lumen-note:${image.path}`) || "";
    const rating = Number(localStorage.getItem(`lumen-rating:${image.path}`) || 0);
    $("#imageDetailStars").textContent = `${"★".repeat(rating)}${"☆".repeat(5 - rating)}`;
    $("#imageDetailStars").dataset.rating = String(rating);
    const fav = state.favorites.has(image.path);
    $("#imageDetailFav").textContent = fav ? "★ 已收藏" : "☆ 收藏";
    $("#imageDetailFav").classList.toggle("active", fav);
    resetDetailZoom();
    $("#imageDetailModal").classList.remove("hidden");
  }

  function saveDetailNotes() {
    const image = state.detailImage;
    if (!image) return;
    localStorage.setItem(`lumen-note:${image.path}`, $("#imageDetailNotes").value);
    toast("笔记已保存。");
  }

  function updateGallerySelection() {
    const count = $("#gallerySelectedCount");
    if (count) count.textContent = `${state.selectedPaths.size} 已选`;
  }

async function setHiddenFor(names, hidden) {
    if (!bridge || !names.length) return;
    try {
      await bridge.hiddenSet({ names, hidden });
      state.selectedPaths.clear();
      toast(`${hidden ? "已隐藏" : "已取消隐藏"} ${names.length} 张。`);
      await loadGallery();
    } catch (error) {
      toast(error?.message || String(error));
    }
  }

  function applyGalleryMode(mode) {
    state.hiddenMode = mode === "hidden" ? "hidden" : "visible";
    state.selectedPaths.clear();
    $("#galleryModeVisible")?.classList.toggle("active", state.hiddenMode === "visible");
    $("#galleryModeHidden")?.classList.toggle("active", state.hiddenMode === "hidden");
    $("#galleryHideSelected")?.classList.toggle("hidden", state.hiddenMode === "hidden");
    $("#galleryUnhideSelected")?.classList.toggle("hidden", state.hiddenMode !== "hidden");
    void loadGallery();
  }

let upscaleEngineFilled = false;

  function fillUpscaleEngines(info) {
    if (!info?.models?.length) return;
    const labelFor = (name) => {
      if (/anime/i.test(name)) return `动漫专用超分（${name}）`;
      if (/x2/i.test(name)) return `通用超分 2x（${name}）`;
      if (/x4/i.test(name)) return `通用超分 4x（${name}）`;
      return `AI 超分（${name}）`;
    };
    const preferred = info.models.find((name) => /anime/i.test(name)) || info.models[0];
    const select = $("#upscaleEngine");
    if (select && (!upscaleEngineFilled || select.options.length <= 1)) {
      select.innerHTML = [
        ...info.models.map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(labelFor(name))}</option>`),
        '<option value="lanczos">Lanczos 快速（仅像素放大，细节不增强）</option>',
      ].join("");
      select.value = preferred || "lanczos";
    }
    const autoEngine = $("#autoUpscaleEngine");
    if (autoEngine && autoEngine.options.length <= 1) {
      autoEngine.innerHTML = [
        '<option value="">自动（优先 AI 模型）</option>',
        ...info.models.map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`),
        '<option value="lanczos">Lanczos（快速）</option>',
      ].join("");
    }
    upscaleEngineFilled = true;
  }

  async function initUpscaleEngines() {
    if (!bridge) return;
    try {
      fillUpscaleEngines(await bridge.upscaleInfo());
    } catch {}
  }

  async function loadUpscaleSources() {
    if (!bridge) return;
    try {
      const info = await bridge.upscaleInfo();
      fillUpscaleEngines(info);
      const hint = $("#upscaleModelHint");
      if (hint) hint.style.display = info?.models?.length ? "none" : "block";
      const images = await bridge.listOutputs({ mode: "visible" });
      const grid = $("#upscaleSources");
      if (!grid) return;
      if (!images.length) {
        grid.innerHTML = '<div class="gallery-empty">还没有作品可加工。</div>';
        return;
      }
      grid.innerHTML = images.slice(0, 24).map((image) => `
        <div class="gallery-item" data-upscale-path="${escapeHtml(image.path)}" data-upscale-name="${escapeHtml(image.name)}">
          <img src="${image.url}" alt="${escapeHtml(image.name)}" loading="lazy" />
          <span class="gallery-caption"><span>${escapeHtml(image.name)}</span><span>${image.width || ""}x${image.height || ""}</span></span>
        </div>`).join("");
      grid.querySelectorAll("[data-upscale-path]").forEach((node) => {
        node.addEventListener("click", () => {
          grid.querySelectorAll(".gallery-item").forEach((item) => item.classList.remove("selected"));
          node.classList.add("selected");
          state.upscaleSource = { path: node.dataset.upscalePath, name: node.dataset.upscaleName };
          $("#upscaleImportBox")?.classList.add("hidden");
          const status = $("#upscaleStatus");
          if (status) status.textContent = `已选择：${node.dataset.upscaleName}`;
        });
      });
    } catch (error) {
      toast(error?.message || String(error));
    }
  }

function upscaleSettings() {
    const factor = Number($("#upscaleFactor")?.value || 2);
    const engine = String($("#upscaleEngine")?.value || "lanczos");
    return { factor, model: engine === "lanczos" ? "" : engine };
  }

  async function upscaleWorks(names, options = {}) {
    if (!bridge || !names.length) return [];
    const { factor, model } = options.factor ? options : upscaleSettings();
    const results = [];
    const total = names.length;
    for (let index = 0; index < total; index += 1) {
      const name = names[index];
      try {
        state.upscaleStatus = `高清化 ${index + 1}/${total}：${name}`;
        const node = $("#upscaleStatus");
        if (node) node.textContent = state.upscaleStatus;
        const result = await bridge.upscale({ name, factor, model });
        // 从「隐藏作品」页发起时，新生成的高清副本也保持隐藏
        if (state.hiddenMode === "hidden" && result?.name) {
          try { await bridge.hiddenSet({ names: [result.name], hidden: true }); } catch {}
        }
        results.push(result);
      } catch (error) {
        toast(`${name} 高清化失败：${error?.message || error}`);
      }
    }
    if (results.length) {
      state.upscaleResult = results[results.length - 1];
      const img = $("#upscaleResultImage");
      const info = $("#upscaleResultInfo");
      const last = results[results.length - 1];
      if (img) img.src = last.url;
      if (info) {
        info.textContent = `${last.name} · ${last.sourceWidth}x${last.sourceHeight} → ${last.width}x${last.height} · ${last.engine === "lanczos" ? "Lanczos" : "AI 模型"}`;
      }
      $("#upscaleResult")?.classList.remove("hidden");
      toast(`高清化完成，共 ${results.length} 张（原图保留）。`);
      await loadGallery();
    }
    return results;
  }

function setupUpscaleImport() {
    const button = $("#pickUpscaleFile");
    const input = $("#upscaleFileInput");
    if (!button || !input) return;
    button.addEventListener("click", () => input.click());
    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (!file) return;
      if (!/^image\/(png|jpeg|webp)$/i.test(file.type)) {
        toast("只支持 PNG / JPG / WEBP 图片。");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        state.upscaleSource = { dataUrl: String(reader.result || ""), name: file.name };
        const box = $("#upscaleImportBox");
        const img = $("#upscaleImportPreview");
        const label = $("#upscaleImportName");
        if (img) img.src = String(reader.result || "");
        if (label) label.textContent = `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} MB`;
        box?.classList.remove("hidden");
        document.querySelectorAll("#upscaleSources .gallery-item").forEach((item) => item.classList.remove("selected"));
        const status = $("#upscaleStatus");
        if (status) status.textContent = `已导入：${file.name}（高清化后自动进作品库）`;
      };
      reader.readAsDataURL(file);
    });
  }

  async function runUpscale() {
    if (!bridge) return;
    const source = state.upscaleSource;
    if (!source?.name) {
      toast("请先点选一张作品。");
      return;
    }
    const button = $("#runUpscale");
    const status = $("#upscaleStatus");
    const factor = Number($("#upscaleFactor")?.value || 2);
    const engine = String($("#upscaleEngine")?.value || "lanczos");
    const model = engine === "lanczos" ? "" : engine;
    if (button) button.disabled = true;
    if (status) status.textContent = `高清化中（${factor}x）…`;
    try {
      const result = source.dataUrl
      ? await bridge.upscale({ dataUrl: source.dataUrl, sourceName: source.name, factor, model })
      : await bridge.upscale({ name: source.name, factor, model });
      state.upscaleResult = result;
      const img = $("#upscaleResultImage");
      const info = $("#upscaleResultInfo");
      if (img) img.src = result.url;
      if (info) {
        info.textContent = `${result.name} · ${result.sourceWidth}x${result.sourceHeight} → ${result.width}x${result.height} · ${result.engine === "lanczos" ? "Lanczos" : "AI 模型"}`;
      }
      $("#upscaleResult")?.classList.remove("hidden");
      if (status) status.textContent = "完成，已保存到作品栏。";
      await loadGallery();
    } catch (error) {
      if (status) status.textContent = "高清化失败";
      toast(error?.message || String(error));
    } finally {
      if (button) button.disabled = false;
    }
  }

// ---------- 局部修正（框选修复 / 擦除） ----------
  function repairUi() {
    return {
      modal: $("#repairModal"),
      stage: $("#repairStage"),
      img: $("#repairImage"),
      sel: $("#repairSelection"),
      status: $("#repairStatus"),
      mode: $("#repairMode"),
      denoise: $("#repairDenoise"),
      denoiseValue: $("#repairDenoiseValue"),
      prompt: $("#repairPrompt"),
      run: $("#runRepair"),
    };
  }

  function openRepair(image) {
    const ui = repairUi();
    if (!ui.modal || !image) return;
    state.repairTarget = image;
    state.repairRect = null;
    ui.sel?.classList.add("hidden");
    if (ui.img) ui.img.src = image.url;
    if (ui.status) ui.status.textContent = "先在图上框选区域";
    if (ui.mode) ui.mode.value = "repair";
    if (ui.denoise) ui.denoise.value = "0.5";
    if (ui.denoiseValue) ui.denoiseValue.textContent = "50%";
    if (ui.prompt) ui.prompt.value = "";
    ui.modal.classList.remove("hidden");
  }

  function setupRepairDrag() {
    const ui = repairUi();
    if (!ui.stage || !ui.img) return;
    let drag = null;
    const toNatural = (event) => {
      const box = ui.img.getBoundingClientRect();
      const scale = (ui.img.naturalWidth || box.width) / Math.max(1, box.width);
      return {
        x: Math.max(0, Math.min(box.width, event.clientX - box.left)) * scale,
        y: Math.max(0, Math.min(box.height, event.clientY - box.top)) * scale,
        box,
        scale,
      };
    };

    ui.stage.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      const p = toNatural(event);
      drag = { startX: p.x, startY: p.y, ...p };
      ui.sel.classList.remove("hidden");
      ui.sel.style.left = "0px";
      ui.sel.style.top = "0px";
      ui.sel.style.width = "0px";
      ui.sel.style.height = "0px";
      ui.stage.setPointerCapture?.(event.pointerId);
    });
    ui.stage.addEventListener("pointermove", (event) => {
      if (!drag) return;
      const p = toNatural(event);
      const x0 = Math.min(drag.startX, p.x);
      const y0 = Math.min(drag.startY, p.y);
      const x1 = Math.max(drag.startX, p.x);
      const y1 = Math.max(drag.startY, p.y);
      const left = x0 / p.scale;
      const top = y0 / p.scale;
      ui.sel.style.left = `${left}px`;
      ui.sel.style.top = `${top}px`;
      ui.sel.style.width = `${(x1 - x0) / p.scale}px`;
      ui.sel.style.height = `${(y1 - y0) / p.scale}px`;
      state.repairRect = { x: Math.round(x0), y: Math.round(y0), w: Math.round(x1 - x0), h: Math.round(y1 - y0) };
      if (ui.status) {
        ui.status.textContent = `已框选 ${state.repairRect.w} × ${state.repairRect.h}（原图像素）`;
      }
    });
    const end = (event) => {
      if (!drag) return;
      drag = null;
      ui.stage.releasePointerCapture?.(event.pointerId);
      if (state.repairRect && (state.repairRect.w < 24 || state.repairRect.h < 24)) {
        state.repairRect = null;
        ui.sel.classList.add("hidden");
        if (ui.status) ui.status.textContent = "选区太小，请重新框选";
      }
    };
    ui.stage.addEventListener("pointerup", end);
    ui.stage.addEventListener("pointercancel", end);
  }

  async function runRepair() {
    const ui = repairUi();
    const image = state.repairTarget;
    if (!bridge || !image) return;
    if (!state.repairRect) {
      toast("请先在图上框选要修正的区域。");
      return;
    }
    const mode = ui.mode?.value === "erase" ? "erase" : "repair";
    const strength = Number(ui.denoise?.value || (mode === "erase" ? 0.15 : 0.5));
    if (ui.run) ui.run.disabled = true;
    if (ui.status) ui.status.textContent = mode === "erase" ? "正在擦除…" : "正在修复…";
    try {
      const res = await bridge.repairRegion({
        name: image.name,
        rect: state.repairRect,
        mode,
        prompt: String(ui.prompt?.value || ""),
        denoise: strength,
        blend: strength,
      });
      if (res?.ok) {
        ui.modal.classList.add("hidden");
        toast(`修正完成：${res.item?.name || "已保存"}`);
        await loadGallery();
      } else {
        throw new Error("修正未返回结果");
      }
    } catch (error) {
      if (ui.status) ui.status.textContent = "修正失败";
      toast(error?.message || String(error));
    } finally {
      if (ui.run) ui.run.disabled = false;
    }
  }

  async function loadGallery() {
    if (!bridge) return;
    try {
      const images = await bridge.listOutputs({ mode: state.hiddenMode });
      state.images = images;
      const grid = $("#galleryGrid");
      if (!images.length) {
        grid.innerHTML = state.hiddenMode === "hidden"
          ? '<div class="gallery-empty">没有隐藏的作品。</div>'
          : '<div class="gallery-empty">还没有作品。</div>';
        updateGallerySelection();
        return;
      }
      grid.innerHTML = images
        .map(
          (image) => `
            <div class="gallery-item" data-path="${escapeHtml(image.path)}">
              <input class="gallery-check" type="checkbox" data-path="${escapeHtml(image.path)}" ${state.selectedPaths.has(image.path) ? "checked" : ""} />
              <button class="gallery-fav ${state.favorites.has(image.path) ? "active" : ""}" data-fav="${escapeHtml(image.path)}">★</button>
              <img src="${image.url}" alt="${escapeHtml(image.name)}" loading="lazy" />
              <span class="gallery-caption"><span>${escapeHtml(image.name)}</span><span>OPEN</span></span>
            </div>`,
        )
        .join("");
      grid.querySelectorAll(".gallery-check").forEach((node) => {
        node.addEventListener("click", (event) => {
          event.stopPropagation();
          if (node.checked) state.selectedPaths.add(node.dataset.path); else state.selectedPaths.delete(node.dataset.path);
          updateGallerySelection();
        });
      });
      grid.querySelectorAll(".gallery-fav").forEach((node) => {
        node.addEventListener("click", (event) => {
          event.stopPropagation();
          const path = node.dataset.fav;
          if (state.favorites.has(path)) state.favorites.delete(path); else state.favorites.add(path);
          localStorage.setItem("lumen-favorites", JSON.stringify([...state.favorites]));
          node.classList.toggle("active", state.favorites.has(path));
        });
      });
      grid.querySelectorAll(".gallery-item").forEach((node) => {
        node.addEventListener("click", () => {
          const image = images.find((entry) => entry.path === node.dataset.path) || null;
          if (image) openImageDetail(image);
        });
      });
      updateGallerySelection();
    } catch (error) {
      toast(error?.message || String(error));
    }
  }

  function renderTrainingQueue() {
    const grid = $("#trainingGrid");
    if (!grid) return;
    grid.innerHTML = state.trainingQueue
      .map(
        (item, index) => `<div class="training-thumb"><img src="${item.dataUrl}" alt="" /><button data-training-remove="${index}">×</button></div>`,
      )
      .join("");
  }

  function addTrainingFiles(files) {
    const list = [...(files || [])].filter((file) => file.type.startsWith("image/")).slice(0, 20 - state.trainingQueue.length);
    let pending = list.length;
    if (!pending) return;
    for (const file of list) {
      const reader = new FileReader();
      reader.onload = () => {
        state.trainingQueue.push({ name: file.name, dataUrl: String(reader.result || "") });
        pending -= 1;
        if (pending === 0) renderTrainingQueue();
      };
      reader.readAsDataURL(file);
    }
  }

  async function ingestTrainingQueue() {
    if (!state.trainingQueue.length) {
      toast("先加入素材。");
      return;
    }
    try {
      const selected = $("#trainingLabel").value;
      const customLabel = selected === "custom" ? $("#trainingCustomLabel").value.trim().toLowerCase() : "";
      if (selected === "custom" && !/^[a-z0-9][a-z0-9_-]{1,48}$/.test(customLabel)) {
        toast("自定义类型只能使用小写字母、数字、下划线或连字符。");
        return;
      }
      const result = await bridge.ingestTraining({
        label: selected === "custom" ? customLabel : selected,
        customLabel,
        displayName: $("#trainingDisplayName").value.trim(),
        trigger: $("#trainingTrigger").value.trim(),
        description: $("#trainingDescription").value.trim(),
        items: state.trainingQueue,
      });
      $("#trainingPathHint").textContent = `已入库 ${result.count} 张：${result.dir}`;
      state.trainingQueue = [];
      renderTrainingQueue();
      toast(`已入库 ${result.count} 张训练素材。`);
    } catch (error) {
      toast(error?.message || String(error));
    }
  }

  function workflowPayload() {
    const style = STYLES[state.style];
    const prompt = state.animaMode
      ? composeAnimaPrompt(style)
      : [$("#prompt").value.trim(), styleSuffix(style)].filter(Boolean).join(", ");
    const aspect = ASPECTS[state.aspect];
    const seedValue = Number($("#seed").value);
    return {
      prompt,
      negative: [$("#negative").value.trim(), style?.negative || ""].filter(Boolean).join(", "),
      width: aspect.width,
      height: aspect.height,
      steps: Number($("#steps").value),
      cfg: Number($("#cfg").value),
      batch: Number($("#batch").value),
      seed: Number.isFinite(seedValue) && seedValue >= 0 ? Math.floor(seedValue) : -1,
      hires: Boolean($("#hires")?.checked),
      hiresScale: 1.25,
      hiresSteps: 10,
      lora: STYLE_MODELS[state.style]?.lora || state.styleLoras?.[state.style] || STYLES[state.style]?.lora || "",
      loraStrength: STYLE_MODELS[state.style]?.loraStrength ?? STYLES[state.style]?.loraStrength ?? 1,
    };
  }

  function renderWorkflowNodes(workflow) {
    const box = $("#workflowNodes");
    if (!box) return;
    box.innerHTML = Object.entries(workflow || {})
      .map(
        ([id, node]) => `<div class="workflow-node"><b>${escapeHtml(id)}</b><span>${escapeHtml(
          node?.class_type || "?",
        )}</span></div>`,
      )
      .join("");
  }

  async function refreshWorkflowPreview() {
    try {
      const result = await bridge.previewWorkflow(workflowPayload());
      $("#workflowJson").value = JSON.stringify(result.workflow, null, 2);
      renderWorkflowNodes(result.workflow);
    } catch (error) {
      toast(error?.message || String(error));
    }
  }

  function openWorkflow() {
    $("#useCustomWorkflow").checked = Boolean(state.customWorkflow);
    if (state.customWorkflow) {
      $("#workflowJson").value = JSON.stringify(state.customWorkflow, null, 2);
      renderWorkflowNodes(state.customWorkflow);
    } else {
      void refreshWorkflowPreview();
    }
    $("#workflowModal").classList.remove("hidden");
  }

  function ensureRandomCharacter() {
    if (!state.animaMode || state.characterImage || state.forcedCharacter) return false;
    if (String($("#animaSubject")?.value || "").trim()) return false;
    if (characterCandidates($("#prompt")?.value || "").length) return false;
    const pool = CHARACTERS.filter((entry) => entry.tag && Array.isArray(entry.tags) && entry.tags.length);
    if (!pool.length) return false;
    const entry = pool[Math.floor(Math.random() * pool.length)];
    $("#animaSubject").value = `1girl, solo, ${entry.tag}`;
    $("#animaWork").value = entry.work || "";
    const current = String($("#animaTags")?.value || "").split(",").map((item) => item.trim()).filter(Boolean);
    for (const tag of entry.tags) if (!current.includes(tag)) current.push(tag);
    $("#animaTags").value = current.join(", ");
    toast(`未指定角色，随机角色：${entry.zh || entry.name || entry.tag}`);
    return true;
  }

  async function generate() {
    if (!bridge || state.busy) return;
    ensureRandomCharacter();
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
    const performance = applyPerformanceProfile();
    let steps = Number($("#steps").value);
    let cfg = Number($("#cfg").value);
    let batch = Number($("#batch").value);
    let hires = Boolean($("#hires")?.checked);
    let hiresScale = 1.25;
    const faceDetail = Boolean($("#faceDetail")?.checked);
    const denoise = Number($("#denoise")?.value || 0.5);
    const referenceMode = $("#referenceMode")?.value || "img2img";
    if (performance && performance.mode !== "custom") {
      steps = performance.steps;
      cfg = performance.cfg;
      batch = performance.mode === "low" ? 1 : batch;
      hires = performance.hires;
      hiresScale = performance.hiresScale;
    }
    // Match the source framing instead of center-cropping it into a fixed aspect.
    let outputWidth = aspect.width;
    let outputHeight = aspect.height;
    if (state.initImage && state.referenceAutoSize && state.referenceSize) {
      const source = state.referenceSize;
      const scale = Math.min(1, 1024 / source.width, 1024 / source.height);
      outputWidth = Math.max(256, Math.round((source.width * scale) / 64) * 64);
      outputHeight = Math.max(256, Math.round((source.height * scale) / 64) * 64);
    }
    const seedValue = Number($("#seed").value);
    const seed = Number.isFinite(seedValue) && seedValue >= 0 ? Math.floor(seedValue) : -1;
    const styleNegative = style?.negative || "";
    const negative = [$("#negative").value.trim(), styleNegative].filter(Boolean).join(", ");
    setBusy(true);
    updateProgress({ stage: "连接 ComfyUI...", progress: 0 });
    $("#resultMeta").textContent = "生成中";
    try {
      const res = await bridge.generate({
        prompt,
        negative,
        width: outputWidth,
        height: outputHeight,
        steps,
        cfg,
        batch,
        seed,
        unet: STYLE_MODELS[state.style]?.unet || performance?.unet || state.config?.unet,
        modelMode: STYLE_MODELS[state.style]?.modelMode || state.config?.modelMode || "anima",
        checkpoint: STYLE_MODELS[state.style]?.checkpoint || state.config?.checkpoint || "",
        performanceProfile: performance?.mode || "quality",
        hires,
        hiresScale,
        hiresSteps: 10,
        faceDetail,
        initImage: state.initImage,
        characterImage: state.characterImage,
        characterGuidance: Number($("#characterStrength")?.value || 5),
        textureImage: state.textureImage,
        textureGuidance: 3.5,
        textureStrength: Number($("#textureStrength")?.value || 0.65),
        textureNote: $("#textureNote")?.value.trim() || "",
        characterStrength: 1,
        denoise,
        referenceMode,
        autoCorrect: Boolean(state.initImage) && $("#autoRepair")?.checked !== false,
        detailPart: $("#detailPart")?.value || "auto",
        detailRegion: $("#detailRegion")?.value || "bottom",
        detailZoom: Number($("#detailZoom")?.value || 1),
        detailPasses: Number($("#detailPasses")?.value || 1),
        repairNote: $("#repairNote")?.value.trim() || "",
        refGuidance: Number($("#adapterStrength")?.value || 4.5),
        refStrength: 1,
        refEnd: 0.85,
        hiresDenoise: 0.32,
        lora: STYLE_MODELS[state.style]?.lora || state.styleLoras?.[state.style] || style?.lora || "",
        loraStrength: Number($("#styleStrength")?.value ?? STYLE_MODELS[state.style]?.loraStrength ?? style?.loraStrength ?? 1),
        customWorkflow: state.customWorkflow,
        autoUpscale: Boolean($("#autoUpscale")?.checked),
        upscaleFactor: Number($("#autoUpscaleFactor")?.value || 2),
        upscaleModel: (() => {
          const value = String($("#autoUpscaleEngine")?.value || "");
          return value === "lanczos" ? "" : value;
        })(),
      });
      if (res?.images?.length) {
        renderResults(res.images);
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

  function populateSelect(selector, values, current) {
    const node = $(selector);
    if (!node) return;
    const unique = [...new Set([current, ...(values || [])].filter(Boolean))];
    node.innerHTML = unique
      .map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)
      .join("");
    if (current) node.value = current;
  }

  async function loadModelOptions() {
    const hint = $("#modelListHint");
    try {
      const models = await bridge.models();
      state.models = models;
      populateSelect("#settingUnet", models.unets, state.config?.unet);
      populateSelect("#settingClip", models.clips, state.config?.clip);
      populateSelect("#settingVae", models.vaes, state.config?.vae);
      populateSelect("#settingCheckpoint", models.checkpoints, state.config?.checkpoint);
      populateSelect("#settingLora", models.loras, state.config?.lora);
      if (hint) hint.textContent = `已读取：${models.checkpoints.length} checkpoints · ${models.loras.length} LoRA`;
    } catch (error) {
      if (hint) hint.textContent = `模型列表读取失败：${error?.message || error}`;
    }
  }

  function applyModelMode() {
    const mode = $("#settingModelMode")?.value || "anima";
    $("#animaModelFields")?.classList.toggle("hidden", mode !== "anima");
    $("#checkpointFields")?.classList.toggle("hidden", mode !== "checkpoint");
  }

  function syncLlmSettings() {
    const mode = $("#settingLlmMode")?.value || "local";
    $("#llmLocalFields")?.classList.toggle("hidden", mode !== "local");
    $("#llmExternalFields")?.classList.toggle("hidden", mode !== "external");
  }

  function openSettings() {
    if (!state.config) return;
    $("#settingEngine").value = state.config.engine || "local";
    $("#settingUrl").value = state.config.comfyUrl || "";
    $("#settingDir").value = state.config.comfyDir || "";
    $("#settingOutputDir").value = state.config.outputDir || "";
    $("#settingFontScale").value = state.config.fontScale || 1;
    $("#settingLlmMode").value = state.config.llmMode || "local";
    $("#settingLlmDevice").value = state.config.llmDevice || "gpu";
    $("#settingLlmModel").value = state.config.llmModel || "";
    $("#settingLlmBin").value = state.config.llmBin || "";
    $("#settingLlmApiUrl").value = state.config.llmApiUrl || "";
    $("#settingLlmApiModel").value = state.config.llmApiModel || "";
    $("#settingLlmApiKey").value = "";
    syncLlmSettings();
    applyUiScale(state.config.fontScale || 1);
    $("#settingPython").value = state.config.pythonExe || "";
    $("#settingModelMode").value = state.config.modelMode || "anima";
    $("#performanceProfile").value = state.config.performanceProfile || "auto";
    $("#settingLowVram").checked = Boolean(state.config.lowVram);
    $("#settingApiUrl").value = state.config.apiUrl || "";
    $("#settingApiModel").value = state.config.apiModel || "";
    $("#settingApiKey").value = "";
    $("#settingLoraStrength").value = state.config.loraStrength || 1;
    $("#loraStrengthValue").textContent = Number($("#settingLoraStrength").value).toFixed(1);
    $("#settingUnet").value = state.config.unet || "";
    $("#settingClip").value = state.config.clip || "";
    $("#settingVae").value = state.config.vae || "";
    $("#settingLora").value = state.config.lora || "";
    $("#apiFields").classList.toggle("hidden", (state.config.engine || "local") !== "api");
    applyModelMode();
    populateSelect("#settingUnet", state.models.unets, state.config.unet);
    populateSelect("#settingClip", state.models.clips, state.config.clip);
    populateSelect("#settingVae", state.models.vaes, state.config.vae);
    populateSelect("#settingCheckpoint", state.models.checkpoints, state.config.checkpoint);
    populateSelect("#settingLora", state.models.loras, state.config.lora);
    $("#settingsModal").classList.remove("hidden");
    void loadModelOptions();
  }

  async function saveSettings() {
    if (!bridge) return;
    const patch = {
      engine: $("#settingEngine").value,
      comfyUrl: $("#settingUrl").value.trim() || "http://127.0.0.1:8188",
      comfyDir: $("#settingDir").value.trim(),
      outputDir: $("#settingOutputDir").value.trim(),
      fontScale: Number($("#settingFontScale").value),
      pythonExe: $("#settingPython").value.trim(),
      modelMode: $("#settingModelMode").value,
      performanceProfile: $("#performanceProfile").value,
      lowVram: $("#settingLowVram").checked,
      checkpoint: $("#settingCheckpoint").value,
      unet: $("#settingUnet").value.trim(),
      clip: $("#settingClip").value.trim(),
      vae: $("#settingVae").value.trim(),
      lora: $("#settingLora").value,
      loraStrength: Number($("#settingLoraStrength").value),
      apiUrl: $("#settingApiUrl").value.trim(),
      apiModel: $("#settingApiModel").value.trim(),
      llmMode: $("#settingLlmMode").value,
      llmDevice: $("#settingLlmDevice").value,
      llmModel: $("#settingLlmModel").value.trim(),
      llmBin: $("#settingLlmBin").value.trim(),
      llmApiUrl: $("#settingLlmApiUrl").value.trim(),
      llmApiModel: $("#settingLlmApiModel").value.trim(),
    };
    const apiKey = $("#settingApiKey").value.trim();
    if (apiKey) patch.apiKey = apiKey;
    const llmApiKey = $("#settingLlmApiKey").value.trim();
    if (llmApiKey) patch.llmApiKey = llmApiKey;
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

  async function loadReferenceLibrary() {
    if (!bridge) return;
    try {
      state.referenceLibrary = await bridge.listReferences();
      renderReferenceLibrary();
      renderCustomCategoryList();
    } catch (error) {
      toast(error?.message || String(error));
    }
  }

  function renderReferenceLibrary() {
    const grid = $("#referenceGrid");
    if (!grid) return;
    grid.innerHTML = "";
    const allItems = [...state.referenceLibrary].reverse();
    const items = state.referenceShowAll ? allItems : allItems.slice(0, 48);
    if ($("#referenceDisplayInfo")) {
      $("#referenceDisplayInfo").textContent = `显示最近 ${items.length} / ${allItems.length} 张`;
      $("#referenceShowAll").classList.toggle("hidden", allItems.length <= 48);
      $("#referenceShowAll").textContent = state.referenceShowAll ? "收起" : "显示全部";
    }
    for (const item of items) {
      const card = document.createElement("div");
      card.className = "reference-card";
      const img = document.createElement("img");
      img.src = item.url;
      img.alt = item.name;
      const name = document.createElement("div");
      name.className = "ref-name";
      name.textContent = `${item.category} · ${item.name}`;
      const actions = document.createElement("div");
      actions.className = "ref-actions";
      actions.innerHTML = `<button data-ref-use="composition" data-ref-id="${item.id}">构图</button><button data-ref-use="character" data-ref-id="${item.id}">角色</button><button data-ref-use="foot" data-ref-id="${item.id}">足部</button><button data-ref-use="fabric" data-ref-id="${item.id}">质感</button><button data-ref-use="remove" data-ref-id="${item.id}">删除</button>`;
      card.append(img, name, actions);
      grid.append(card);
    }
    if (!state.referenceLibrary.length) {
      grid.innerHTML = '<p class="hint">暂无参考图。选择分类后添加图片。</p>';
    }
  }

  async function useReferenceItem(id, role) {
    const item = state.referenceLibrary.find((entry) => entry.id === id);
    if (!item) return;
    const data = await bridge.readReferenceData({ id });
    if (role === "character") {
      state.characterImage = data;
      $("#characterPreview").src = data;
      $("#characterPreview").classList.remove("hidden");
      $("#characterEmpty").classList.add("hidden");
      $("#characterClear").classList.remove("hidden");
      $("#referenceModal").classList.add("hidden");
      toast("已设为角色参考。");
      return;
    }
    if (role === "foot" || role === "fabric") {
      state.textureImage = data;
      $("#texturePreview").src = data;
      $("#texturePreview").classList.remove("hidden");
      $("#textureEmpty").classList.add("hidden");
      $("#textureClear").classList.remove("hidden");
      $("#textureNote").value = role === "foot"
        ? "参考足部结构与脚趾数量，不作为构图主体"
        : "参考丝袜和布料质感，不作为构图主体";
      const tags = role === "foot"
        ? "detailed toes, five toes per foot, accurate toe count, clean foot anatomy, detailed soles"
        : "white thighhighs, sheer stocking texture, ribbed fabric, detailed legwear";
      const current = $("#prompt").value.trim();
      $("#prompt").value = [current, tags].filter(Boolean).join(", ");
      updateAnimaPreview();
      $("#referenceModal").classList.add("hidden");
      toast(role === "foot" ? "已载入足部质感参考。" : "已载入丝袜质感参考。");
      return;
    }
    state.initImage = data;
    state.referenceAutoSize = true;
    $("#referencePreview").src = data;
    $("#referencePreview").classList.remove("hidden");
    $("#referenceEmpty").classList.add("hidden");
    $("#referenceClear").classList.remove("hidden");
    const probe = new Image();
    probe.onload = () => {
      state.referenceSize = { width: probe.naturalWidth, height: probe.naturalHeight };
      $("#referenceMeta").textContent = `参考库 ${probe.naturalWidth} × ${probe.naturalHeight} · 画幅跟随参考图`;
      $("#sizeHint").textContent = "跟随参考图";
    };
    probe.src = data;
    $("#referenceModal").classList.add("hidden");
    toast("已设为构图 / 画风参考。");
  }

  async function loadPromptRecipes() {
    try {
      if (!state.promptRecipes?.length) {
        const response = await fetch("./prompt-recipes.json");
        state.promptRecipes = await response.json();
      }
      const custom = JSON.parse(localStorage.getItem("lumen-prompt-recipes") || "[]");
      state.promptRecipes = [...state.promptRecipes.filter((item) => item.source !== "custom"), ...custom];
      renderPromptRecipes();
    } catch (error) {
      toast(error?.message || String(error));
    }
  }

  function savePromptRecipes() {
    const custom = state.promptRecipes.filter((item) => item.source === "custom");
    localStorage.setItem("lumen-prompt-recipes", JSON.stringify(custom));
  }

  function renderPromptRecipes() {
    const list = $("#promptList");
    if (!list) return;
    const query = String($("#promptSearch")?.value || "").trim().toLowerCase();
    const items = (state.promptRecipes || []).filter((recipe) => {
      if (!query) return true;
      return [recipe.name, recipe.prompt, recipe.negative].join(" ").toLowerCase().includes(query);
    });
    list.innerHTML = items.length ? items.map((recipe) => `
      <div class="prompt-item">
        <div class="prompt-head">
          <strong>${escapeHtml(recipe.name || "未命名提示词")}</strong>
          <button class="mini-button" data-prompt-use="${escapeHtml(recipe.id)}">套用</button>
          <button class="mini-button" data-prompt-edit="${escapeHtml(recipe.id)}">编辑</button>
          ${recipe.source === "custom" ? `<button class="mini-button" data-prompt-delete="${escapeHtml(recipe.id)}">删除</button>` : ""}
        </div>
        <div class="prompt-text">${escapeHtml(String(recipe.prompt || ""))}</div>
      </div>`).join("") : '<p class="hint">没有匹配的提示词。</p>';
  }

  function savePromptRecipe() {
    const name = String($("#promptRecipeName")?.value || "").trim();
    const prompt = String($("#promptRecipeText")?.value || "").trim();
    const negative = String($("#promptRecipeNegative")?.value || "").trim();
    if (!prompt) { toast("先填写正向提示词。"); return; }
    const id = state.editingPromptId || `custom_${Date.now()}`;
    const recipe = { id, name: name || "自定义提示词", prompt, negative, style: "custom", source: "custom" };
    const existing = state.promptRecipes.findIndex((item) => item.id === id);
    if (existing >= 0) state.promptRecipes[existing] = recipe; else state.promptRecipes.push(recipe);
    savePromptRecipes();
    state.editingPromptId = null;
    $("#promptRecipeName").value = "";
    $("#promptRecipeText").value = "";
    $("#promptRecipeNegative").value = "";
    $("#savePromptRecipe").textContent = "保存提示词";
    renderPromptRecipes();
    toast("提示词已保存。");
  }

  function deletePromptRecipe(id) {
    state.promptRecipes = state.promptRecipes.filter((item) => item.id !== id);
    savePromptRecipes();
    renderPromptRecipes();
    toast("提示词已删除。");
  }

  function editPromptRecipe(id) {
    const recipe = state.promptRecipes.find((item) => item.id === id);
    if (!recipe) return;
    state.editingPromptId = recipe.source === "custom" ? id : null;
    $("#promptRecipeName").value = recipe.name || "";
    $("#promptRecipeText").value = recipe.prompt || "";
    $("#promptRecipeNegative").value = recipe.negative || "";
    $("#savePromptRecipe").textContent = recipe.source === "custom" ? "更新提示词" : "另存为自定义";
  }

  function applyPromptRecipe(id) {
    const recipe = state.promptRecipes.find((item) => item.id === id);
    if (!recipe) return;
    $("#prompt").value = recipe.prompt || "";
    $("#negative").value = recipe.negative || "";
    updateAnimaPreview();
    $("#promptModal").classList.add("hidden");
    toast("提示词已套用。");
  }

  const AI_SYSTEM_PROMPT = `你是 Anima 提示词编译器，不是聊天助手。用户用一句简单中文描述画面，你把它编译成 Anima / 2.5D 动漫模型可直接使用的高质量英文提示词。

【第一步：逐项识别（缺失就留空，绝不编造）】
1 人数（1girl / 1boy / 2girls）
2 角色名
3 作品名
4 发色、发型（长度、发髻、辫子）
5 瞳色
6 耳 / 尾 / 头饰：必须区分「真兽耳」「猫耳头饰」「发髻」「发饰」
7 服装、鞋袜、配饰
8 动作、姿势、手势
9 镜头、构图、视角
10 场景、环境
11 光线、氛围
12 画风（赛璐珞 / 2.5D / 萌系 / 厚涂，只能选一个主画风）

【角色识别规则（最重要）】
- 如果消息里出现 CHARACTER_FACTS，那是本地角色库的权威数据：
  · 带 tags 的条目：发色、瞳色、发型、头饰、服装必须直接照抄那些标签，一个字都不许改，也不许用你自己的记忆覆盖。
  · 标注 attributes: unknown 的条目（库里只有 canonical 名）：可以用官方设定补外观，但宁可少写也不要写错；不确定的特征写进 notes 的「未确认」。
- 没有 CHARACTER_FACTS 时，用官方设定常识；仍不确定的特征不要写死，写进 notes 的「未确认」。
- 猫耳头饰、锥形发髻绝不能写成 real cat ears / animal ears。
- 绝不把一个角色的发色、瞳色、服装混到另一个角色身上。
- **只能有一个角色 tag**：同一角色的不同版本（如 souryuu asuka langley 与 asuka langley shikinami）也算冲突，只能保留最贴合用户描述的那个。
- 作品必须用真实存在的 canonical work tag（例：neon genesis evangelion、genshin impact），不确定就留空，禁止臆造（如 "eva: evangelion"）。
- 不要往 prompt 里塞与主体无关的其他作品角色（例：画怪物猎人时不要出现 hunter (bloodborne)）。
- 用户没指定角色时，不要自动补一个角色。

【标签顺序（严格按这个顺序拼 prompt）】
质量前缀 → 人数与角色 → 作品 → 外观（发色/发型/瞳色/头饰/耳尾） → 服装/配饰/状态 → 动作/姿势 → 镜头/构图 → 场景/环境 → 光线/氛围 → 画风/渲染 → 细节强化

【质量前缀（固定开头，不含人数）】
masterpiece, best quality, score_7, safe, ultra detailed, very aesthetic,
紧随其后才是人数与角色：人形角色写 1girl / 1boy / solo；非人形角色（宝可梦、怪物、动物、机械、物件）只写 solo + 该对象，绝对不要写 1girl/1boy，
  也不要写 detailed hair / detailed hands / hair between eyes 这类人类专属细节，负面里同样不要堆发色瞳色。

【词汇规范】
- 动作要具体：standing, hands on hips, akimbo, arms crossed, sitting, kneeling, leaning back, looking at viewer, gentle smile, blush
- 镜头要具体：full body, upper body, close-up, medium shot, wide shot, vertical composition, from above, from below, from front, from side
- 场景要用可执行标签：under tree, tree shade, dappled sunlight, sunlight through leaves, indoor, window light, city street, night
- 禁止「好看的构图」「优雅氛围」这类无法执行的描述，一律换成具体标签。

【画风：默认 anima base】
- 用户没有明确指定画风时：style 留空，prompt 里不要堆 2.5D / 赛璐珞 词，只保留必要的质量与细节词（anima base 本身就是主打画风）。
- 用户明确要画风时才用对应词块，二选一不要混：
  2.5D：2.5D anime, semi-realistic anime, soft airbrushed shading, glossy skin, detailed eyes, clean soft lineart, cinematic lighting, subtle gradients
  赛璐珞：anime cel shading, flat colors, clean lineart, crisp shadow edges, limited palette

【细节强化（默认带上）】
detailed eyes, detailed hair, detailed hands, detailed skin, clean soft lineart

【负面词规则】
1 固定前缀：worst quality, low quality, blurry, jpeg artifacts, text, watermark
2 结构：bad anatomy, bad hands, extra fingers, missing fingers, fused fingers, bad feet, extra toes, missing toes, deformed face, asymmetrical eyes
3 角色相关：wrong character, wrong hair color, wrong eye color
4 「反向颜色」：把该角色【不正确】的发色/瞳色写进负面。例如紫发紫瞳，就写 blue hair, green hair, blonde hair, blue eyes, red eyes, green eyes
5 兽耳/帽子：real cat ears, animal ears, cat tail, hat, cap, beret, sunglasses
6 **禁止把角色的标志性服装/配饰写进负面**（例：明日香的 plugsuit / red bodysuit），
  除非用户明确说要换装；否则等于禁止模型画出该角色本人。
7 负面里出现的颜色，prompt 里绝不能同时出现（自相矛盾）。
8 只在确实相关时才加，不要堆无关词。

【输出格式（必须严格遵守）】
只输出一个 JSON 对象，不要 Markdown、不要解释、不要代码块：
{"character":"","work":"","style":"","artist":"","prompt":"","negative_prompt":"","notes":""}

字段要求：
- character：canonical 角色 tag（如 keqing (genshin impact)），识别不到就空字符串
- work：作品 tag（如 genshin impact），识别不到就空
- style：用户明确要画风时填（2.5D / anime cel shading 等），否则空
- artist：只有用户明确点名画师时才填
- prompt：英文标签，逗号分隔，**至少 45 个标签**，必须包含动作、镜头、场景、光线、画风、细节强化；不要重复质量词
- negative_prompt：按上面规则组合，**至少 20 个标签**
- notes：中文，分点写「识别依据 / 防错点 / 未确认项 / 一致性检查」；
  只写与本图相关的内容，不要套用固定模板句（例如人形角色不要写「非人形无需额外标签」）

【输出前自检（不通过就重写）】
- 角色名与作品名是否都在
- 发色、瞳色是否与 CHARACTER_FACTS 完全一致（这是最常错的一项）
- 猫耳/发髻是否被误写成真兽耳
- 人数是否矛盾、是否混入第二个角色
- 服装是否被换错
- prompt 是否 ≥ 45 个标签、是否含动作+镜头+场景+光线+画风
- 非人形角色是否被误写成 1girl
- prompt 里是否出现了两个角色 tag（含同角色不同版本）
- 负面里是否误封了该角色的标志性服装
- prompt 与 negative 是否有同词冲突
- negative 是否 ≥ 20 个标签、是否含反向颜色

【示例】
用户：我想画原神里的刻晴，站立叉腰，站在树下
CHARACTER_FACTS 给了：purple eyes, purple hair, cone hair bun, long hair, twintails, hair ornament
输出 prompt 示范：
masterpiece, best quality, score_7, safe, ultra detailed, very aesthetic, 1girl, solo, keqing (genshin impact), genshin impact, purple hair, long hair, twintails, cone hair bun, hair ornament, purple eyes, purple dress, high collar, detached sleeves, gold trim, purple thighhighs, electro vision, standing, hands on hips, akimbo, straight posture, confident expression, looking at viewer, full body, vertical composition, from front, under tree, tree trunk, leaves, tree shade, dappled sunlight, sunlight through leaves, natural sunlight, soft shadows, warm ambient light, 2.5D anime, semi-realistic anime, soft airbrushed shading, glossy skin, detailed eyes, detailed hair, detailed hands, clean soft lineart, cinematic lighting, subtle gradients`;

  async function loadCharacterCatalog() {
    if (state.characterCatalog) return state.characterCatalog;
    const read = async (file) => {
      try {
        const response = await fetch(file);
        const data = await response.json();
        const rows = Array.isArray(data?.characters) ? data.characters : (Array.isArray(data) ? data : []);
        return rows;
      } catch {
        return [];
      }
    };
    const [main, extra] = await Promise.all([read("./characters.json"), read("./characters-extra.json")]);
    state.characterCatalog = [...main, ...extra];
    return state.characterCatalog;
  }

async function characterFactsByTag(tag) {
    const rows = await loadCharacterCatalog();
    const want = String(tag || "").toLowerCase().trim();
    if (!want) return "";
    const norm = (value) => String(value || "").toLowerCase().replace(/[_]/g, " ").replace(/\s+/g, " ").trim();
    const target = norm(want);
    let best = null;
    for (const row of rows) {
      const names = [row.tag, row.name, ...(row.aliases || [])].filter(Boolean).map(norm);
      if (names.includes(target)) { best = row; break; }
      if (!best && names.some((name) => name && (target.includes(name) || name.includes(target)))) best = row;
    }
    if (!best) return "";
    const tags = Array.isArray(best.tags) ? best.tags.filter(Boolean) : [];
    return [
      `CANONICAL: ${best.tag}`,
      `work: ${best.work || ""}`,
      best.zh ? `zh: ${best.zh}` : "",
      tags.length
        ? `tags: ${tags.join(", ")}`
        : "attributes: unknown（本库只有 canonical 名，发色/瞳色/服装请按官方设定，不确定就写进未确认）",
    ].filter(Boolean).join(" | ");
  }

  async function characterFactsFor(text) {
    const rows = await loadCharacterCatalog();
    const query = String(text || "").toLowerCase();
    if (!rows.length || !query) return "";
    const scored = [];
    for (const row of rows) {
      const zhFull = String(row.zh || "").toLowerCase();
      const zhParts = String(row.zh || "")
        .split(/[·・,，/／()（）\s]+/)
        .filter((part) => part.length >= 3);   // 只有 >=3 字的片段才算（「猎人」这种 2 字通用词不算）
      const names = [row.tag, row.name, ...(row.aliases || []), ...(row.pinyin || [])]
        .filter(Boolean)
        .map((item) => String(item).toLowerCase());
      let hit = 0;
      if (zhFull.length >= 2 && query.includes(zhFull)) hit = Math.max(hit, zhFull.length * 4);
      for (const part of zhParts) {
        if (query.includes(part)) hit = Math.max(hit, part.length * 3);
      }
      for (const name of names) {
        if (name.length >= 3 && query.includes(name)) hit = Math.max(hit, name.length * 3);
      }
      if (!hit) continue;
      scored.push({ row, hit, pop: Number(row.pop) || 0 });
    }
    if (!scored.length) return "";
    scored.sort((a, b) => b.hit - a.hit || b.pop - a.pop);
    return scored.slice(0, 2).map(({ row }) => {
      const tags = Array.isArray(row.tags) ? row.tags.filter(Boolean) : [];
      const parts = [
        `CANONICAL: ${row.tag}`,
        `work: ${row.work || ""}`,
        row.zh ? `zh: ${row.zh}` : "",
        tags.length
          ? `tags: ${tags.join(", ")}`
          : "attributes: unknown（本库只有 canonical 名，发色/瞳色/服装请按官方设定，不确定就写进未确认）",
      ].filter(Boolean);
      return parts.join(" | ");
    }).join("\n");
  }

  function renderAiMessages() {
    const box = $("#aiChatMessages");
    if (!box) return;
    box.innerHTML = "";
    for (const msg of state.aiMessages) {
      const div = document.createElement("div");
      div.className = `ai-message ${msg.role === "user" ? "user" : "assistant"}`;
      div.textContent = msg.content;
      box.appendChild(div);
    }
    box.scrollTop = box.scrollHeight;
  }

  async function refreshAiStatus() {
    try {
      const status = await bridge.llmStatus();
      $("#aiChatStatus").textContent = status.running ? status.label : "本地 AI 未启动 · 首次发送时加载";
    } catch {
      $("#aiChatStatus").textContent = "本地 AI 状态未知";
    }
  }

  async function openAiPrompt() {
    if (state.busy) { toast("图片生成中，完成后再打开 AI 关键词。"); return; }
    $("#aiPromptModal").classList.remove("hidden");
    if (!state.aiMessages.length) {
      state.aiMessages = [{
        role: "assistant",
        content: "告诉我你想画什么。没有明确要求的角色、作品、画风、画师会留空，不猜不随机。",
      }];
      renderAiMessages();
    }
    await refreshAiStatus();
  }

  const DEFAULT_REFERENCE_CATEGORIES = [
    { value: "character", label: "角色", description: "角色脸型、发型、瞳色、服装身份参考" },
    { value: "hand", label: "手部", description: "手指、手势、手部解剖参考" },
    { value: "foot", label: "脚部", description: "脚趾、足弓、鞋袜与脚部姿态参考" },
    { value: "foot_real", label: "足部写实", description: "真实足部结构、脚趾数量与足弓参考" },
    { value: "fabric", label: "丝袜 / 布料", description: "丝袜、过膝袜、布料褶皱与透明质感参考" },
    { value: "style", label: "画风", description: "上色、线条、渲染与材质参考" },
    { value: "composition", label: "构图", description: "镜头、姿势、画面布局参考" },
    { value: "custom_uncategorized", label: "未分类", description: "删除自定义分类后自动归档的参考图" },
  ];

  function loadReferenceCategories() {
    let custom = [];
    try { custom = JSON.parse(localStorage.getItem("lumen-reference-categories") || "[]"); } catch {}
    state.referenceCategories = [...DEFAULT_REFERENCE_CATEGORIES, ...(Array.isArray(custom) ? custom : [])];
  }

  function renderReferenceCategories() {
    const select = $("#referenceCategory");
    if (!select) return;
    loadReferenceCategories();
    select.innerHTML = state.referenceCategories
      .map((item) => `<option value="${escapeHtml(item.value)}">${escapeHtml(item.label)}</option>`)
      .join("");
  }

  function renderCustomCategoryList() {
    const box = $("#referenceCustomList");
    if (!box) return;
    const custom = state.referenceCategories.filter((item) => item.value.startsWith("custom_") && item.value !== "custom_uncategorized");
    box.innerHTML = custom.length ? custom.map((item) => {
      const count = (state.referenceLibrary || []).filter((ref) => ref.category === item.value).length;
      return `<div class="reference-custom-row"><div><b>${escapeHtml(item.label)}</b> <small>${escapeHtml(item.type || inferReferenceType(item.label, item.description))} · ${count} 张</small></div><button data-delete-category="${escapeHtml(item.value)}">删除分类</button></div>`;
    }).join("") : "";
  }

  async function deleteReferenceCategory(value) {
    const category = state.referenceCategories.find((item) => item.value === value);
    if (!category) return;
    const refs = (state.referenceLibrary || []).filter((ref) => ref.category === value);
    if (refs.length) {
      const ok = confirm(`“${category.label}”内有 ${refs.length} 张参考图。\n删除分类后图片会移到“未分类”，不会被删除。继续？`);
      if (!ok) return;
      await bridge.setReferenceCategory({ ids: refs.map((ref) => ref.id), category: "custom_uncategorized", categoryType: "custom" });
    }
    let custom = [];
    try { custom = JSON.parse(localStorage.getItem("lumen-reference-categories") || "[]"); } catch {}
    custom = custom.filter((item) => item.value !== value);
    localStorage.setItem("lumen-reference-categories", JSON.stringify(custom));
    renderReferenceCategories();
    $("#referenceCategory").value = "character";
    syncReferenceCategoryMode();
    await loadReferenceLibrary();
    toast("分类已删除。");
  }

  function inferReferenceType(label, description = "") {
    const text = `${label} ${description}`.toLowerCase();
    if (/表情|情绪|脸|face|expression|emotion/.test(text)) return "expression";
    if (/手|指|hand|finger|palm/.test(text)) return "hand";
    if (/脚|足|趾|foot|toe|sole/.test(text)) return "foot";
    if (/兽|动物|生物|species|animal|creature|monster/.test(text)) return "species";
    if (/服装|衣|裙|鞋|袜|outfit|clothes|dress|shoe|sock/.test(text)) return "outfit";
    if (/姿势|动作|pose|action|gesture/.test(text)) return "pose";
    if (/场景|背景|环境|scene|background|environment/.test(text)) return "scene";
    if (/材质|纹理|material|texture/.test(text)) return "material";
    if (/画风|风格|渲染|style|render|painting/.test(text)) return "style";
    if (/角色|人物|character|person/.test(text)) return "character";
    return "custom";
  }

  function currentReferenceCategory() {
    const value = $("#referenceCategory")?.value || "character";
    return state.referenceCategories.find((item) => item.value === value) || { value, label: value, description: "", type: inferReferenceType(value) };
  }

  function syncReferenceCategoryMode() {
    const select = $("#referenceCategory");
    if (!select) return;
    const category = currentReferenceCategory();
    const isCustom = String(category.value).startsWith("custom_");
    const field = select.closest("label");
    if (field) field.classList.toggle("hidden", isCustom);
    let info = $("#referenceCustomInfo");
    if (!info) {
      info = document.createElement("div");
      info.id = "referenceCustomInfo";
      info.className = "dir-row hidden";
      info.innerHTML = '<span class="modal-note" id="referenceCustomType"></span><button class="text-button" id="resetReferenceCategory">改用内置分类</button>';
      $("#addReferenceCategory")?.parentElement?.after(info);
      $("#resetReferenceCategory")?.addEventListener("click", () => {
        select.value = "character";
        syncReferenceCategoryMode();
      });
    }
    info.classList.toggle("hidden", !isCustom);
    if (isCustom) {
      const type = category.type || inferReferenceType(category.label, category.description);
      $("#referenceCustomType").textContent = `自定义分类类型：${type} · ${category.description || "未填写说明"}`;
    }
  }

  function addReferenceCategory() {
    const label = String($("#referenceCustomCategory")?.value || "").trim();
    const description = String($("#referenceCustomDesc")?.value || "").trim();
    if (!label) { toast("先填写分类名称。"); return; }
    const value = `custom_${label.replace(/[^\w\u4e00-\u9fff-]+/g, "_").slice(0, 40)}`;
    const custom = state.referenceCategories.filter((item) => !DEFAULT_REFERENCE_CATEGORIES.some((base) => base.value === item.value));
    const type = inferReferenceType(label, description);
    if (!custom.some((item) => item.label === label)) custom.push({ value, label, description, type });
    localStorage.setItem("lumen-reference-categories", JSON.stringify(custom));
    renderReferenceCategories();
    $("#referenceCategory").value = value;
    syncReferenceCategoryMode();
    $("#referenceCustomCategory").value = "";
    $("#referenceCustomDesc").value = "";
    renderCustomCategoryList();
    toast("已添加自定义分类。");
  }

  async function referenceContextFor(text) {
    const catalog = await loadCatalog();
    const query = String(text || "").toLowerCase();
    if (!query || !catalog.length) return "";
    const terms = query.split(/[\s,，。;；:：/]+/).filter((item) => item.length >= 2);
    const score = (entry) => {
      const haystack = [entry.name, entry.category, entry.prompt, entry.keywords, ...(entry.tags || [])]
        .join(" ").toLowerCase();
      let value = 0;
      for (const term of terms) if (haystack.includes(term)) value += term.length;
      return value;
    };
    const customLines = state.referenceCategories
      .filter((item) => item.description)
      .map((item) => `[custom-category:${item.type || inferReferenceType(item.label, item.description)}] ${item.label}: ${item.description}`);
    const ranked = catalog
      .filter((entry) => entry.kind === "pose" || entry.kind === "costume")
      .map((entry) => ({ entry, score: score(entry) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);
    if (!ranked.length) return "";
    return [...customLines, ...ranked.map(({ entry }) =>
      `[${entry.kind}] ${entry.name} | ${entry.category} | ${entry.prompt || entry.keywords || ""}`
    )].join("\n");
  }

  function isDegenerateAnswer(text) {
    let body = String(text || "").trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
    const first = body.indexOf("{");
    const last = body.lastIndexOf("}");
    if (first >= 0 && last > first) body = body.slice(first, last + 1);
    try {
      const data = JSON.parse(body);
      const keys = ["character", "work", "style", "artist", "prompt", "negative_prompt", "notes"];
      return keys.every((key) => !String(data?.[key] ?? "").trim());
    } catch {
      return false;
    }
  }

// 用角色库事实做确定性兜底：补 canonical tag、补发色/瞳色、注入反向颜色负面
  const HAIR_COLORS = ["blonde", "brown", "black", "blue", "green", "red", "pink", "purple", "silver", "white", "orange", "grey", "aqua"];
  const EYE_COLORS = ["blue", "green", "red", "purple", "golden", "yellow", "pink", "orange", "grey", "aqua", "brown"];

  function splitTags(value) {
    return String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
  }

  function cleanTagValue(value) {
    return String(value || "")
      .replace(/^[\s"'`]+|[\s"'`,;。、]+$/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  const STYLE_BLOCK_TAGS = [
    "2.5d anime", "semi-realistic anime", "soft airbrushed shading", "glossy skin",
    "clean soft lineart", "cinematic lighting", "subtle gradients",
    "anime cel shading", "flat colors", "crisp shadow edges", "limited palette",
  ];

  const HUMAN_DETAIL_TAGS = ["detailed hair", "detailed hands", "detailed skin", "hair between eyes"];

  // 用角色库 + 规则做确定性清洗（模型不可靠的部分全部在后处理里纠正）
  async function enforceCharacterFacts(text, factsText, userText) {
    let body = String(text || "").trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
    const first = body.indexOf("{");
    const last = body.lastIndexOf("}");
    if (first < 0 || last <= first) return text;
    let data;
    try { data = JSON.parse(body.slice(first, last + 1)); } catch { return text; }

    const canonical = cleanTagValue((factsText.match(/CANONICAL:\s*([^|\n]+)/) || [])[1] || "");
    const factsTags = splitTags((factsText.match(/tags:\s*([^\n]+)/) || [])[1] || "");
    const factsWork = cleanTagValue((factsText.match(/work:\s*([^|\n]+)/) || [])[1] || "");

    let promptTags = splitTags(data.prompt);
    const negativeTags = splitTags(data.negative_prompt);
    const lower = (list) => list.map((item) => item.toLowerCase());
    const has = (list, tag) => lower(list).includes(String(tag).toLowerCase());

    // ① 画风：用户没点名就不要 2.5D / 赛璐珞（默认 anima base）
    const askedStyle = /2\.5d|赛璐璐|赛璐珞|厚涂|cel shading|thick paint|画风指定|用水墨|浮世绘|Q版|赛博朋克/i.test(String(userText || ""));
    if (!askedStyle) {
      data.style = "";
      promptTags = promptTags.filter((tag) => !STYLE_BLOCK_TAGS.includes(tag.toLowerCase()));
    }

    // ② 角色 canonical + 作品必须来自库（不许臆造作品名）
    data.character = cleanTagValue(data.character) || canonical;
    if (canonical) data.character = canonical;
    data.work = factsWork || cleanTagValue(data.work);

    // ③ 单调性：prompt 里不允许出现负面词（自相矛盾）
    const negativeSet = new Set(lower(negativeTags));
    promptTags = promptTags.filter((tag) => !negativeSet.has(tag.toLowerCase()));

    // ③b 负面不许封角色本人的服装/特征（库里给的 tags 与负面冲突时，删负面）
    if (factsTags.length) {
      const factsSet = new Set(factsTags.map((t) => t.toLowerCase().replace(/_/g, " ").trim()));
      for (let i = negativeTags.length - 1; i >= 0; i -= 1) {
        const key = negativeTags[i].toLowerCase().replace(/_/g, " ").trim();
        if (factsSet.has(key)) negativeTags.splice(i, 1);
      }
      // 服装类同义：facts 里有 bodysuit/plugsuit 时，负面里的 plugsuit / bodysuit 一律去掉
      if (factsTags.some((t) => /bodysuit|plugsuit/i.test(t))) {
        for (let i = negativeTags.length - 1; i >= 0; i -= 1) {
          if (/plugsuit|bodysuit/i.test(negativeTags[i])) negativeTags.splice(i, 1);
        }
      }
    }

    // ④ 只能有一个角色 tag：库里认得出来的角色标签，只保留 canonical（无 facts 时保留模型给的主角色）
    {
      const rows = await loadCharacterCatalog();
      const known = new Set();
      for (const row of rows) {
        for (const name of [row.tag, row.name, ...(row.aliases || [])].filter(Boolean)) {
          known.add(String(name).toLowerCase().replace(/_/g, " ").trim());
        }
      }
      const primary = (canonical || cleanTagValue(data.character)).toLowerCase().replace(/_/g, " ").trim();
      promptTags = promptTags.filter((tag) => {
        const key = tag.toLowerCase().replace(/_/g, " ").trim();
        return !known.has(key) || key === primary;
      });
      // canonical 存在时，去掉同角色的变体 tag（如 asuka langley (neon genesis evangelion)）
      if (canonical) {
        const tokens = canonical.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 4);
        promptTags = promptTags.filter((tag) => {
          if (tag.toLowerCase().replace(/_/g, " ").trim() === canonical.toLowerCase()) return true;
          const lower = tag.toLowerCase();
          const hits = tokens.filter((w) => lower.includes(w)).length;
          return !(tokens.length >= 2 && hits >= 2);
        });
      }
      if (canonical && !has(promptTags, canonical)) {
        const soloIndex = promptTags.findIndex((item) => item.toLowerCase() === "solo");
        promptTags.splice(soloIndex >= 0 ? soloIndex + 1 : promptTags.length, 0, canonical);
      }
    }

    // ⑤ 非人形：去掉人类专属细节与人数词
    const humanSubject = /(^|,|\s)(1girl|1boy|2girls|2boys)(,|\s|$)/i.test(promptTags.join(", "));
    if (!humanSubject) {
      promptTags = promptTags.filter((tag) => !HUMAN_DETAIL_TAGS.includes(tag.toLowerCase()));
      promptTags = promptTags.filter((tag) => !/^detailed (hair|hands)$/i.test(tag));
    }

    // ⑥ 发色 / 瞳色必须原样出现，并补反向颜色负面
    for (const tag of factsTags) {
      const isHairColor = /^(blonde|brown|black|blue|green|red|pink|purple|silver|white|orange|grey|aqua|lavender)\s+hair$/i.test(tag);
      const isEyeColor = /^(blue|green|red|purple|golden|yellow|pink|orange|grey|aqua|brown|lavender)\s+eyes$/i.test(tag);
      if ((isHairColor || isEyeColor) && humanSubject && !has(promptTags, tag)) promptTags.push(tag);
    }
    const hairColors = factsTags.filter((t) => /hair/.test(t)).flatMap((t) => HAIR_COLORS.filter((c) => t.startsWith(c)));
    const eyeColors = factsTags.filter((t) => /eyes?$/.test(t)).flatMap((t) => EYE_COLORS.filter((c) => t.startsWith(c)));
    if (humanSubject && hairColors.length) {
      for (const color of HAIR_COLORS) {
        if (hairColors.includes(color)) continue;
        const tag = `${color} hair`;
        if (!has(negativeTags, tag)) negativeTags.push(tag);
      }
    }
    if (humanSubject && eyeColors.length) {
      for (const color of EYE_COLORS) {
        if (eyeColors.includes(color)) continue;
        const tag = `${color} eyes`;
        if (!has(negativeTags, tag)) negativeTags.push(tag);
      }
    }

    data.prompt = [...new Set(promptTags)].join(", ");
    data.negative_prompt = [...new Set(negativeTags)].join(", ");
    data.character = cleanTagValue(data.character);
    data.work = cleanTagValue(data.work);
    return JSON.stringify(data, null, 2);
  }

  async function sendAiChat() {
    const input = $("#aiChatInput");
    const text = input.value.trim();
    if (!text || state.aiBusy || state.busy) return;
    state.aiBusy = true;
    input.value = "";
    state.aiMessages.push({ role: "user", content: text });
    state.aiMessages.push({ role: "assistant", content: "" });
    state.aiDraft = "";
    state.aiStreaming = true;
    renderAiMessages();
    $("#aiChatStatus").textContent = "正在生成…";
    try {
      const referenceContext = await referenceContextFor(text);
      let characterFacts = await characterFactsFor(text);
      if (!characterFacts) {
        // 库里没匹配到：让模型给出候选 canonical tag，再回库验证（存在才采信）
        try {
          const guess = await bridge.llmResolveTag({ text });
          if (guess) characterFacts = await characterFactsByTag(guess);
        } catch {}
      }
      const systemContent = [
        AI_SYSTEM_PROMPT,
        characterFacts ? `CHARACTER_FACTS (authoritative — copy hair/eyes/costume tags verbatim):\n${characterFacts}` : "",
        referenceContext ? `REFERENCE_LIBRARY (use these exact tags when relevant):\n${referenceContext}` : "",
      ].filter(Boolean).join("\n\n");
      // 只发送有内容的轮次：末尾的空 assistant 占位会被模型当成续写起点，导致字段被挖空
      const history = state.aiMessages.filter((msg) => String(msg.content || "").trim());
      const buildMessages = (extra) => [
        { role: "system", content: systemContent },
        ...history,
        ...(extra ? [extra] : []),
      ].slice(-14);
      let res = await bridge.llmChat({ messages: buildMessages(null) });
      let finalText = res?.content || state.aiDraft || "没有返回内容。";
      finalText = await enforceCharacterFacts(finalText, characterFacts, text);
      if (isDegenerateAnswer(finalText)) {
        $("#aiChatStatus").textContent = "输出为空字段，重试一次…";
        res = await bridge.llmChat({
          messages: buildMessages({ role: "user", content: "上一次输出所有字段都是空的。请按 JSON 结构重新完整填写，不要留空字段、不要解释。" }),
        });
        if (res?.content) finalText = await enforceCharacterFacts(res.content, characterFacts, text);
      }
      state.aiLastAnswer = finalText;
      const last = state.aiMessages[state.aiMessages.length - 1];
      if (last?.role === "assistant") last.content = finalText;
      renderAiMessages();
      $("#aiChatStatus").textContent = res?.status?.label || "本地 AI 已启动";
    } catch (error) {
      const last = state.aiMessages[state.aiMessages.length - 1];
      const message = `本地 AI 请求失败：${error?.message || error}`;
      if (last?.role === "assistant") last.content = message;
      else state.aiMessages.push({ role: "assistant", content: message });
      renderAiMessages();
      $("#aiChatStatus").textContent = "请求失败";
    } finally {
      state.aiBusy = false;
      state.aiStreaming = false;
    }
  }

  function fillAiPrompt() {
    let text = String(state.aiLastAnswer || "").trim();
    text = text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) text = text.slice(firstBrace, lastBrace + 1);
    try {
      const data = JSON.parse(text);
      if (data.prompt) $("#prompt").value = data.prompt;
      if (data.negative_prompt) $("#negative").value = data.negative_prompt;
      updateAnimaPreview();
      $("#aiPromptModal").classList.add("hidden");
      toast("已填入创作区。");
    } catch {
      toast("没有找到可用的 JSON 格式提示词。");
    }
  }

  async function loadCatalog() {
    if (state.catalogLoaded) return state.catalog;
    try {
      const response = await fetch("./reference-catalog.json");
      const data = await response.json();
      state.catalog = Array.isArray(data.entries) ? data.entries : [];
    } catch {
      state.catalog = [];
    }
    state.catalogLoaded = true;
    return state.catalog;
  }

  function renderCatalog() {
    const grid = $("#catalogGrid");
    if (!grid) return;
    const query = String($("#catalogSearch")?.value || "").trim().toLowerCase();
    const kind = $("#catalogKind")?.value || "";
    const items = state.catalog.filter((entry) => {
      if (kind && entry.kind !== kind) return false;
      if (!query) return true;
      return [entry.name, entry.category, entry.prompt, entry.keywords, ...(entry.tags || [])]
        .join(" ").toLowerCase().includes(query);
    }).slice(0, 80);
    grid.innerHTML = items.length
      ? items.map((entry) => `<button class="catalog-card" data-catalog-id="${entry.id}">${entry.localThumb ? `<img src="file:///${entry.localThumb.replace(/\\/g, "/")}" alt="" />` : ""}<b>${escapeHtml(entry.name)}</b><small>${escapeHtml(entry.category)} · ${escapeHtml(entry.prompt)}</small></button>`).join("")
      : '<div class="gallery-empty">没有匹配结果。</div>';
    grid.querySelectorAll(".catalog-card").forEach((node) => {
      node.addEventListener("click", () => {
        const entry = state.catalog.find((item) => item.id === node.dataset.catalogId);
        if (!entry) return;
        const current = $("#prompt").value.trim();
        const addition = entry.keywords || entry.prompt || entry.name;
        $("#prompt").value = [current, addition].filter(Boolean).join(", ");
        updateAnimaPreview();
        $("#catalogModal").classList.add("hidden");
        toast("参考标签已追加到提示词。");
      });
    });
  }

  async function openCatalog() {
    await loadCatalog();
    $("#catalogModal").classList.remove("hidden");
    renderCatalog();
  }

  async function refreshRuntimeState() {
    try {
      const runtime = await bridge.checkRuntime();
      const text = runtime.ready
        ? `运行环境已就绪 · ${runtime.comfyDir}`
        : "未检测到完整运行环境，请一键部署";
      if ($("#runtimeSetupStatus")) $("#runtimeSetupStatus").textContent = text;
      if (!runtime.ready) $("#runtimeSetupModal")?.classList.remove("hidden");
      return runtime;
    } catch {
      return null;
    }
  }

  async function installRuntimeFlow() {
    const button = $("#startRuntimeInstall");
    const settingsButton = $("#installRuntimeButton");
    const root = String($("#runtimeRoot")?.value || "F:\\LumenFlow").trim();
    for (const node of [button, settingsButton]) {
      if (!node) continue;
      node.disabled = true;
      node.textContent = "部署中…";
    }
    try {
      const result = await bridge.installRuntime({ root });
      state.config = await bridge.getConfig();
      $("#runtimeSetupStatus").textContent = `运行环境已就绪 · ${result.comfyDir}`;
      $("#runtimeSetupModal").classList.add("hidden");
      toast("完整运行环境部署完成。");
      await checkHealth();
    } catch (error) {
      toast(`部署失败：${error?.message || error}`);
    } finally {
      if (button) { button.disabled = false; button.textContent = "开始部署"; }
      if (settingsButton) { settingsButton.disabled = false; settingsButton.textContent = "一键部署完整环境"; }
    }
  }

  function setupStylePreview() {
    const files = {
      "follow-prompt": "follow-prompt", "anima-base": "anima-base", "anime-cel": "anime-cel", painterly: "painterly",
      "2.5d-thick": "2.5d-thick", "2.5d-thick-soft": "2.5d-thick-soft",
      "gal-3d": "gal-3d", "ririko-cel": "ririko-cel", "mushroom-moe": "mushroom-moe",
      "bilibili-cel": "bilibili-cel", "bilibili-25d": "bilibili-25d", "bilibili-moe": "bilibili-moe",
      "25d-lora": "25d-lora", "target-25d": "target-25d", "manga-bw": "manga-bw",
      "ink-wash": "ink-wash", retro: "retro", pastel: "pastel", lineart: "lineart",
      "ukiyo-e": "ukiyo-e", chibi: "chibi", cinematic: "cinematic",
      illustration: "illustration", cyberpunk: "cyberpunk",
    };
    const referenceStyles = new Set();
    const popover = $("#stylePreviewPopover");
    const hide = () => popover?.classList.add("hidden");
    const show = (chip) => {
      if (chip.dataset.style === "follow-prompt") { hide(); return; }
      const file = files[chip.dataset.style];
      if (!file || !popover) return;
      $("#stylePreviewImage").src = `./style-previews/${file}.png`;
      $("#stylePreviewName").textContent = chip.textContent.trim();
      $("#stylePreviewKind").textContent = referenceStyles.has(chip.dataset.style) ? "风格参考图" : "画风演示";
      popover.classList.remove("hidden");
      const rect = chip.getBoundingClientRect();
      const width = 252;
      const height = 338;
      let left = Math.max(8, Math.min(window.innerWidth - width - 8, rect.left));
      let top = rect.bottom + 8;
      if (top + height > window.innerHeight - 8) top = Math.max(8, rect.top - height - 8);
      popover.style.left = `${left}px`;
      popover.style.top = `${top}px`;
    };
    document.querySelectorAll(".chip[data-style]").forEach((chip) => {
      chip.addEventListener("mouseenter", () => show(chip));
      chip.addEventListener("mouseleave", hide);
      chip.addEventListener("focus", () => show(chip));
      chip.addEventListener("blur", hide);
    });
  }

  async function bind() {
    document.querySelectorAll(".nav-item").forEach((node) => {
      node.addEventListener("click", () => {
        if (node.dataset.view) setView(node.dataset.view);
      });
    });
    document.querySelectorAll(".aspect").forEach((node) => {
      node.addEventListener("click", () => {
        state.referenceAutoSize = false;
        applyAspect(node.dataset.aspect);
        if (state.initImage) {
          $("#referenceMeta").textContent = "参考图已加载 · 当前画幅按右侧画幅按钮";
        }
      });
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
        const probe = new Image();
        probe.onload = () => {
          state.referenceSize = { width: probe.naturalWidth, height: probe.naturalHeight };
          state.referenceAutoSize = true;
          $("#referenceMeta").textContent = `参考图 ${probe.naturalWidth} × ${probe.naturalHeight} · 画幅跟随参考图`;
          $("#sizeHint").textContent = "跟随参考图";
        };
        probe.src = state.initImage;
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
    $("#cancelReference").addEventListener("click", () => $("#referenceClear").click());
    $("#referenceClear").addEventListener("click", (event) => {
      event.stopPropagation();
      state.initImage = "";
      state.referenceSize = null;
      state.referenceAutoSize = true;
      $("#referencePreview").src = "";
      $("#referencePreview").classList.add("hidden");
      $("#referenceEmpty").classList.remove("hidden");
      $("#referenceClear").classList.add("hidden");
      $("#referenceMeta").textContent = "未选择参考图 · 当前按所选画幅生成";
      $("#sizeHint").textContent = ASPECTS[state.aspect]?.label || "";
    });
    const setCharacterFile = (file) => {
      if (!file || !file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        state.characterImage = String(reader.result || "");
        $("#characterPreview").src = state.characterImage;
        $("#characterPreview").classList.remove("hidden");
        $("#characterEmpty").classList.add("hidden");
        $("#characterClear").classList.remove("hidden");
        toast("角色参考已加载；生成时会锁定角色。");
      };
      reader.readAsDataURL(file);
    };
    $("#characterDrop").addEventListener("click", () => $("#characterInput").click());
    $("#characterInput").addEventListener("change", (event) => setCharacterFile(event.target.files?.[0]));
    $("#characterDrop").addEventListener("dragover", (event) => {
      event.preventDefault();
      $("#characterDrop").classList.add("dragging");
    });
    $("#characterDrop").addEventListener("dragleave", () => $("#characterDrop").classList.remove("dragging"));
    $("#characterDrop").addEventListener("drop", (event) => {
      event.preventDefault();
      $("#characterDrop").classList.remove("dragging");
      setCharacterFile(event.dataTransfer?.files?.[0]);
    });
    $("#cancelCharacter").addEventListener("click", () => $("#characterClear").click());
    $("#characterClear").addEventListener("click", (event) => {
      event.stopPropagation();
      state.characterImage = "";
      $("#characterPreview").src = "";
      $("#characterPreview").classList.add("hidden");
      $("#characterEmpty").classList.remove("hidden");
      $("#characterClear").classList.add("hidden");
    });
    $("#characterStrength").addEventListener("input", () => {
      $("#characterStrengthValue").textContent = Number($("#characterStrength").value).toFixed(1);
    });
    const setTextureFile = (file) => {
      if (!file || !file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        state.textureImage = String(reader.result || "");
        $("#texturePreview").src = state.textureImage;
        $("#texturePreview").classList.remove("hidden");
        $("#textureEmpty").classList.add("hidden");
        $("#textureClear").classList.remove("hidden");
        toast("质感 / 部位参考已加载。");
      };
      reader.readAsDataURL(file);
    };
    $("#textureDrop").addEventListener("click", () => $("#textureInput").click());
    $("#textureInput").addEventListener("change", (event) => setTextureFile(event.target.files?.[0]));
    $("#textureDrop").addEventListener("dragover", (event) => {
      event.preventDefault();
      $("#textureDrop").classList.add("dragging");
    });
    $("#textureDrop").addEventListener("dragleave", () => $("#textureDrop").classList.remove("dragging"));
    $("#textureDrop").addEventListener("drop", (event) => {
      event.preventDefault();
      $("#textureDrop").classList.remove("dragging");
      setTextureFile(event.dataTransfer?.files?.[0]);
    });
    $("#cancelTexture").addEventListener("click", () => $("#textureClear").click());
    $("#textureClear").addEventListener("click", (event) => {
      event.stopPropagation();
      state.textureImage = "";
      $("#texturePreview").src = "";
      $("#texturePreview").classList.add("hidden");
      $("#textureEmpty").classList.remove("hidden");
      $("#textureClear").classList.add("hidden");
    });
    $("#textureStrength").addEventListener("input", () => {
      $("#textureStrengthValue").textContent = Number($("#textureStrength").value).toFixed(2);
    });
    $("#denoise").addEventListener("input", () => {
      $("#denoiseValue").textContent = `${Math.round(Number($("#denoise").value) * 100)}%`;
    });
    const applyRefinePreset = (mode) => {
      const presets = {
        light: { denoise: "0.25", referenceMode: "img2img", hires: true, cfg: "3.5", steps: "30", styleStrength: "0.5" },
        style: { denoise: "0.5", referenceMode: "img2img", hires: true, cfg: "3.5", steps: "30", styleStrength: "0" },
        compose: { denoise: "0.4", referenceMode: "img2img", hires: true, cfg: "3.5", steps: "30", styleStrength: "0.5" },
        borrow: { denoise: "0.62", referenceMode: "img2img", hires: false, cfg: "3.5", steps: "30", styleStrength: "0.6" },
        adapter: { denoise: "0.4", referenceMode: "ref-adapter", hires: true, cfg: "3.5", steps: "30", styleStrength: "0.5" },
      };
      const preset = presets[mode];
      if (!preset) return;
      $("#denoise").value = preset.denoise;
      $("#denoiseValue").textContent = `${Math.round(Number(preset.denoise) * 100)}%`;
      $("#referenceMode").value = preset.referenceMode;
      $("#hires").checked = preset.hires;
      if (preset.cfg) $("#cfg").value = preset.cfg;
      if (preset.steps) $("#steps").value = preset.steps;
      if (preset.styleStrength) {
        $("#styleStrength").value = preset.styleStrength;
        $("#styleStrengthValue").textContent = preset.styleStrength;
      }
      if (mode === "style") applyStyle("target-25d");
      $("#adapterControls").classList.toggle("hidden", preset.referenceMode !== "ref-adapter");
      document.querySelectorAll("[data-refine]").forEach((node) => {
        node.classList.toggle("active", node.dataset.refine === mode);
      });
    };
    document.querySelectorAll("[data-refine]").forEach((node) => {
      node.addEventListener("click", () => applyRefinePreset(node.dataset.refine));
    });
    const GEAR_PRESETS = {
      detail: { denoise: "0.30", styleStrength: "0.35", note: "轻修细节：只补细节，不动构图与配色。" },
      texture: { denoise: "0.45", styleStrength: "0.55", note: "保构图换质感：构图基本不变，材质和光影重画。" },
      recast: { denoise: "0.70", styleStrength: "0.75", note: "换角色保构图：保留动作与机位，角色可以换掉。" },
      "recast-style": { denoise: "0.88", styleStrength: "1", note: "换角色+2.5D 厚涂：参考图只当构图/动作，角色与质感重画。低于 0.8 会残留原图发色。" },
    };
    const applyGearPreset = (mode) => {
      const preset = GEAR_PRESETS[mode];
      const hint = $("#presetGearHint");
      if (!preset) {
        if (hint) hint.textContent = "自定义：重绘幅度与风格强度完全由滑杆决定。";
        return;
      }
      $("#denoise").value = preset.denoise;
      $("#denoiseValue").textContent = `${Math.round(Number(preset.denoise) * 100)}%`;
      if ($("#styleStrength")) {
        $("#styleStrength").value = preset.styleStrength;
        $("#styleStrengthValue").textContent = preset.styleStrength;
      }
      if (hint) hint.textContent = preset.note;
    };
    $("#presetGear")?.addEventListener("change", () => applyGearPreset($("#presetGear").value));
    const COMPOSITION_PRESETS = {
      closeup: { aspect: "3:4", denoise: "0.88", note: "特写：3:4（896×1152）· 重绘 88%。低于 0.8 会残留原图发色。" },
      half: { aspect: "2:3", denoise: "0.82", note: "半身：2:3（832×1216）· 重绘 82%。实测 0.75–0.85 构图稳定，0.90 开始漂。" },
      full: { aspect: "16:9", denoise: "0.75", note: "全身/全景：16:9（1216×688）· 重绘 75%。实测 0.85 以上会缩小人物、偏色。" },
    };
    const applyCompositionPreset = (mode) => {
      const preset = COMPOSITION_PRESETS[mode];
      const hint = $("#compositionHint");
      if (!preset) {
        if (hint) hint.textContent = "自定义：画幅与重绘幅度完全由你决定。";
        return;
      }
      applyAspect(preset.aspect);
      $("#denoise").value = preset.denoise;
      $("#denoiseValue").textContent = `${Math.round(Number(preset.denoise) * 100)}%`;
      if (hint) hint.textContent = preset.note;
    };
    $("#compositionPreset")?.addEventListener("change", () => applyCompositionPreset($("#compositionPreset").value));
    $("#referenceMode").addEventListener("change", () => {
      $("#adapterControls").classList.toggle("hidden", $("#referenceMode").value !== "ref-adapter");
    });
    $("#adapterStrength").addEventListener("input", () => {
      $("#adapterStrengthValue").textContent = Number($("#adapterStrength").value).toFixed(1);
    });
    $("#styleStrength").addEventListener("input", () => {
      $("#styleStrengthValue").textContent = Number($("#styleStrength").value).toFixed(2);
    });
    $("#aiPromptButton").addEventListener("click", () => void openAiPrompt());
    $("#closeAiPrompt").addEventListener("click", async () => {
      $("#aiPromptModal").classList.add("hidden");
      await bridge?.stopLlm();
      await refreshAiStatus();
    });
    $("#aiChatSend").addEventListener("click", () => void sendAiChat());
    $("#aiChatInput").addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        void sendAiChat();
      }
    });
    $("#aiChatClear").addEventListener("click", () => {
      state.aiMessages = [];
      state.aiLastAnswer = "";
      renderAiMessages();
    });
    $("#aiChatStop").addEventListener("click", async () => {
      await bridge?.stopLlm();
      await refreshAiStatus();
      toast("本地 AI 已释放。");
    });
    $("#aiChatFill").addEventListener("click", fillAiPrompt);
    $("#prompt").addEventListener("input", () => { maybeAutoStyle(); updateAnimaPreview(); });
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
    $("#performanceProfile").addEventListener("change", () => applyPerformanceProfile());
    $("#generateButton").addEventListener("click", () => void generate());
    $("#refreshGallery").addEventListener("click", () => void loadGallery());
    $("#galleryModeVisible")?.addEventListener("click", () => applyGalleryMode("visible"));
    $("#galleryModeHidden")?.addEventListener("click", () => applyGalleryMode("hidden"));
    $("#galleryBatchUpscale")?.addEventListener("click", async () => {
      const names = [...state.selectedPaths].map((item) => item.split(/[\\/]/).pop()).filter(Boolean);
      if (!names.length) { toast("先勾选要高清化的作品。"); return; }
      const label = state.hiddenMode === "hidden" ? "隐藏作品" : "作品";
      toast(`开始批量高清化 ${names.length} 张${label}（原图保留）…`);
      await upscaleWorks(names);
    });
    $("#imageDetailRepair")?.addEventListener("click", () => {
      const image = state.detailImage;
      if (!image) return;
      $("#imageDetailModal").classList.add("hidden");
      openRepair(image);
    });
    $("#closeRepair")?.addEventListener("click", () => $("#repairModal")?.classList.add("hidden"));
    $("#repairModal")?.addEventListener("click", (event) => {
      if (event.target.id === "repairModal") $("#repairModal").classList.add("hidden");
    });
    $("#repairMode")?.addEventListener("change", () => {
      const erase = $("#repairMode").value === "erase";
      $("#repairDenoise").value = erase ? "0.15" : "0.5";
      $("#repairDenoiseValue").textContent = erase ? "15%" : "50%";
    });
    $("#repairDenoise")?.addEventListener("input", () => {
      const value = Number($("#repairDenoise").value || 0);
      $("#repairDenoiseValue").textContent = `${Math.round(value * 100)}%`;
    });
    $("#runRepair")?.addEventListener("click", () => void runRepair());
    setupRepairDrag();
    $("#imageDetailUpscale")?.addEventListener("click", async () => {
      const image = state.detailImage;
      if (!image) return;
      $("#imageDetailModal").classList.add("hidden");
      await upscaleWorks([image.name]);
    });
    $("#galleryHideSelected")?.addEventListener("click", () => {
      const names = [...state.selectedPaths].map((item) => item.split(/[\\/]/).pop()).filter(Boolean);
      if (!names.length) { toast("先勾选要隐藏的作品。"); return; }
      void setHiddenFor(names, true);
    });
    $("#galleryUnhideSelected")?.addEventListener("click", () => {
      const names = [...state.selectedPaths].map((item) => item.split(/[\\/]/).pop()).filter(Boolean);
      if (!names.length) { toast("先勾选要恢复的作品。"); return; }
      void setHiddenFor(names, false);
    });
    $("#imageDetailHide")?.addEventListener("click", async () => {
      const image = state.detailImage;
      if (!image) return;
      const hidden = state.hiddenMode !== "hidden";
      $("#imageDetailModal").classList.add("hidden");
      await setHiddenFor([image.name], hidden);
    });
    $("#refreshUpscaleSources")?.addEventListener("click", () => void loadUpscaleSources());
    $("#installUpscaleModels")?.addEventListener("click", async () => {
      const button = $("#installUpscaleModels");
      if (button) button.disabled = true;
      try {
        const res = await bridge.upscaleInstallModels();
        if (res?.failed?.length) {
          toast(`有 ${res.failed.length} 个模型下载失败，可从 ${res.dir} 手动放入。`);
        } else {
          toast(`已安装 ${res?.installed?.length || 0} 个放大模型。`);
        }
        await loadUpscaleSources();
      } catch (error) {
        toast(error?.message || String(error));
      } finally {
        if (button) button.disabled = false;
      }
    });
    $("#openUpscaleDir")?.addEventListener("click", () => void bridge.upscaleOpenDir());
    $("#runUpscale")?.addEventListener("click", () => void runUpscale());
    setupUpscaleImport();
    $("#gallerySelectAll").addEventListener("click", () => {
      state.selectedPaths = new Set(state.images.map((image) => image.path));
      document.querySelectorAll(".gallery-check").forEach((node) => { node.checked = true; });
      updateGallerySelection();
    });
    $("#galleryFavorite").addEventListener("click", () => {
      for (const path of state.selectedPaths) state.favorites.add(path);
      localStorage.setItem("lumen-favorites", JSON.stringify([...state.favorites]));
      document.querySelectorAll(".gallery-fav").forEach((node) => node.classList.toggle("active", state.favorites.has(node.dataset.fav)));
      toast("已收藏选中作品。");
    });
    $("#closeImageDetail").addEventListener("click", () => $("#imageDetailModal").classList.add("hidden"));
    $("#imageDetailModal").addEventListener("click", (event) => {
      if (event.target.id === "imageDetailModal") $("#imageDetailModal").classList.add("hidden");
    });
    $("#imageDetailFav").addEventListener("click", () => {
      const image = state.detailImage;
      if (!image) return;
      if (state.favorites.has(image.path)) state.favorites.delete(image.path); else state.favorites.add(image.path);
      localStorage.setItem("lumen-favorites", JSON.stringify([...state.favorites]));
      $("#imageDetailFav").textContent = state.favorites.has(image.path) ? "★ 已收藏" : "☆ 收藏";
      $("#imageDetailFav").classList.toggle("active", state.favorites.has(image.path));
      document.querySelectorAll(".gallery-fav").forEach((node) => node.classList.toggle("active", state.favorites.has(node.dataset.fav)));
    });
    $("#imageDetailExpand").addEventListener("click", () => {
      const card = document.querySelector("#imageDetailModal .image-detail-card");
      card?.classList.toggle("detail-expanded");
      resetDetailZoom();
    });
    $("#imageDetailZoomIn").addEventListener("click", () => setDetailZoom(state.detailZoom * 1.25));
    $("#imageDetailZoomOut").addEventListener("click", () => setDetailZoom(state.detailZoom / 1.25));
    $("#imageDetailFit").addEventListener("click", resetDetailZoom);
    $("#imageDetailPreview").addEventListener("dblclick", resetDetailZoom);
    const previewWrap = $("#imageDetailPreviewWrap");
    previewWrap.addEventListener("wheel", (event) => {
      event.preventDefault();
      setDetailZoom(state.detailZoom * (event.deltaY < 0 ? 1.12 : 0.89));
    }, { passive: false });
    let detailDrag = null;
    previewWrap.addEventListener("pointerdown", (event) => {
      if (event.target.closest(".detail-image-tools, .detail-zoom-controls")) return;
      detailDrag = { x: event.clientX - state.detailPanX, y: event.clientY - state.detailPanY };
      previewWrap.classList.add("dragging");
      previewWrap.setPointerCapture?.(event.pointerId);
    });
    previewWrap.addEventListener("pointermove", (event) => {
      if (!detailDrag) return;
      state.detailPanX = event.clientX - detailDrag.x;
      state.detailPanY = event.clientY - detailDrag.y;
      applyDetailTransform();
    });
    const stopDetailDrag = () => { detailDrag = null; previewWrap.classList.remove("dragging"); };
    previewWrap.addEventListener("pointerup", stopDetailDrag);
    previewWrap.addEventListener("pointercancel", stopDetailDrag);
    $("#imageDetailDownload").addEventListener("click", () => {
      const image = state.detailImage;
      if (!image) return;
      const link = document.createElement("a");
      link.href = image.url;
      link.download = image.name || "lumen.png";
      link.click();
    });
    $("#imageDetailCopyPrompt").addEventListener("click", async () => {
      const text = state.detailImage?.prompt || "";
      if (text) await navigator.clipboard.writeText(text);
      toast("提示词已复制。");
    });
    $("#imageDetailReuse").addEventListener("click", () => {
      const image = state.detailImage;
      if (!image) return;
      if (image.prompt) $("#prompt").value = image.prompt;
      if (image.negativePrompt) $("#negative").value = image.negativePrompt;
      if (image.seed !== undefined && image.seed !== null) $("#seed").value = String(image.seed);
      $("#imageDetailModal").classList.add("hidden");
      setView("create");
      toast("已复用提示词、负面词和种子。");
    });
    $("#imageDetailSaveNotes").addEventListener("click", saveDetailNotes);
    $("#imageDetailStars").addEventListener("click", (event) => {
      const image = state.detailImage;
      if (!image) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const rating = Math.max(1, Math.min(5, Math.ceil(((event.clientX - rect.left) / rect.width) * 5)));
      localStorage.setItem(`lumen-rating:${image.path}`, String(rating));
      event.currentTarget.textContent = `${"★".repeat(rating)}${"☆".repeat(5 - rating)}`;
    });
    $("#imageDetailRefine").addEventListener("click", () => {
      if (!state.detailImage) return;
      state.currentImage = state.detailImage;
      $("#refineButton").click();
      $("#imageDetailModal").classList.add("hidden");
      document.querySelector("#imageDetailModal .image-detail-card")?.classList.remove("detail-expanded");
      setView("create");
      setTimeout(() => {
        const note = $("#repairNote");
        if (!note) return;
        note.disabled = false;
        note.readOnly = false;
        note.scrollIntoView({ block: "center", behavior: "smooth" });
        note.focus({ preventScroll: true });
      }, 120);
    });
    $("#imageDetailCharacter").addEventListener("click", () => {
      if (!state.detailImage) return;
      state.characterImage = state.detailImage.url;
      $("#characterPreview").src = state.characterImage;
      $("#characterPreview").classList.remove("hidden");
      $("#characterEmpty").classList.add("hidden");
      $("#characterClear").classList.remove("hidden");
      $("#imageDetailModal").classList.add("hidden");
      setView("create");
      toast("已设为角色参考。");
    });
    $("#imageDetailReveal").addEventListener("click", () => {
      if (state.detailImage) void bridge.reveal(state.detailImage.path);
    });
    $("#imageDetailDelete").addEventListener("click", async () => {
      const image = state.detailImage;
      if (!image || !confirm("确认删除这张作品？此操作不可恢复。")) return;
      await bridge.deleteOutput({ name: image.name });
      $("#imageDetailModal").classList.add("hidden");
      await loadGallery();
    });
    $("#galleryBatchRefine").addEventListener("click", () => {
      const first = state.images.find((image) => state.selectedPaths.has(image.path));
      if (!first) { toast("先勾选作品。"); return; }
      state.currentImage = first;
      $("#refineButton").click();
      toast(`已载入第一张选中作品，共 ${state.selectedPaths.size} 张。`);
    });
    $("#galleryBatchDelete").addEventListener("click", async () => {
      const selected = state.images.filter((image) => state.selectedPaths.has(image.path));
      if (!selected.length) { toast("先勾选要删除的作品。"); return; }
      if (!confirm(`确认删除选中的 ${selected.length} 张作品？此操作不可恢复。`)) return;
      for (const image of selected) {
        await bridge.deleteOutput({ name: image.name });
      }
      state.selectedPaths.clear();
      await loadGallery();
      toast(`已删除 ${selected.length} 张作品。`);
    });
    $("#settingLlmMode").addEventListener("change", syncLlmSettings);
    $("#installLocalAi").addEventListener("click", async () => {
      const button = $("#installLocalAi");
      button.disabled = true;
      button.textContent = "下载中…";
      try {
        const res = await bridge.setupLocalAi();
        $("#settingLlmModel").value = res.config?.llmModel || res.model || "";
        $("#settingLlmBin").value = res.config?.llmBin || res.bin || "";
        toast("本地 AI 已安装并配置。");
      } catch (error) {
        toast(`本地 AI 安装失败：${error?.message || error}`);
      } finally {
        button.disabled = false;
        button.textContent = "下载 / 安装本地 AI";
      }
    });
    $("#catalogButton").addEventListener("click", () => void openCatalog());
    $("#closeCatalog").addEventListener("click", () => $("#catalogModal").classList.add("hidden"));
    $("#catalogSearch").addEventListener("input", renderCatalog);
    $("#catalogKind").addEventListener("change", renderCatalog);
    $("#settingsButton").addEventListener("click", openSettings);
    $("#closeSettings").addEventListener("click", () => $("#settingsModal").classList.add("hidden"));
    $("#cancelSettings").addEventListener("click", () => $("#settingsModal").classList.add("hidden"));
    $("#saveSettings").addEventListener("click", () => void saveSettings());
    $("#settingFontScale").addEventListener("input", () => applyUiScale($("#settingFontScale").value));
    $("#browseDir").addEventListener("click", async () => {
      const selected = await bridge?.chooseDir();
      if (selected) $("#settingDir").value = selected;
    });
    $("#settingEngine").addEventListener("change", () => {
      $("#apiFields").classList.toggle("hidden", $("#settingEngine").value !== "api");
    });
    $("#settingModelMode").addEventListener("change", applyModelMode);
    $("#refreshModels").addEventListener("click", () => void loadModelOptions());
    $("#settingLoraStrength").addEventListener("input", () => {
      $("#loraStrengthValue").textContent = Number($("#settingLoraStrength").value).toFixed(1);
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
    $("#workflowButton").addEventListener("click", openWorkflow);
    $("#closeWorkflow").addEventListener("click", () => $("#workflowModal").classList.add("hidden"));
    $("#cancelWorkflow").addEventListener("click", () => $("#workflowModal").classList.add("hidden"));
    $("#refreshWorkflow").addEventListener("click", () => void refreshWorkflowPreview());
    $("#resetWorkflow").addEventListener("click", () => {
      state.customWorkflow = null;
      $("#useCustomWorkflow").checked = false;
      void refreshWorkflowPreview();
    });
    $("#applyWorkflow").addEventListener("click", () => {
      if (!$("#useCustomWorkflow").checked) {
        state.customWorkflow = null;
        $("#workflowModal").classList.add("hidden");
        toast("已恢复默认工作流。");
        return;
      }
      try {
        const parsed = JSON.parse($("#workflowJson").value);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("工作流必须是 JSON 对象");
        state.customWorkflow = parsed;
        $("#workflowModal").classList.add("hidden");
        toast("自定义工作流已启用。");
      } catch (error) {
        toast(`工作流 JSON 无效：${error?.message || error}`);
      }
    });
    $("#trainingButton").addEventListener("click", () => {
      $("#trainingModal").classList.remove("hidden");
      renderTrainingQueue();
    });
    $("#closeTraining").addEventListener("click", () => $("#trainingModal").classList.add("hidden"));
    $("#cancelTraining").addEventListener("click", () => $("#trainingModal").classList.add("hidden"));
    $("#trainingDrop").addEventListener("click", () => $("#trainingFiles").click());
    $("#trainingFiles").addEventListener("change", (event) => {
      addTrainingFiles(event.target.files);
      event.target.value = "";
    });
    $("#trainingDrop").addEventListener("dragover", (event) => {
      event.preventDefault();
      $("#trainingDrop").classList.add("dragging");
    });
    $("#trainingDrop").addEventListener("dragleave", () => $("#trainingDrop").classList.remove("dragging"));
    $("#trainingDrop").addEventListener("drop", (event) => {
      event.preventDefault();
      $("#trainingDrop").classList.remove("dragging");
      addTrainingFiles(event.dataTransfer?.files);
    });
    $("#trainingGrid").addEventListener("click", (event) => {
      const index = event.target?.dataset?.trainingRemove;
      if (index === undefined) return;
      state.trainingQueue.splice(Number(index), 1);
      renderTrainingQueue();
    });
    $("#clearTraining").addEventListener("click", () => {
      state.trainingQueue = [];
      renderTrainingQueue();
    });
    $("#ingestTraining").addEventListener("click", () => void ingestTrainingQueue());
    $("#referenceLibraryButton").addEventListener("click", () => {
      renderReferenceCategories();
      syncReferenceCategoryMode();
      renderCustomCategoryList();
      $("#referenceModal").classList.remove("hidden");
      void loadReferenceLibrary();
    });
    $("#addReferenceCategory").addEventListener("click", addReferenceCategory);
    $("#referenceCategory").addEventListener("change", syncReferenceCategoryMode);
    $("#referenceCustomList").addEventListener("click", (event) => {
      const button = event.target.closest("[data-delete-category]");
      if (button) void deleteReferenceCategory(button.dataset.deleteCategory);
    });
    $("#closeReference").addEventListener("click", () => $("#referenceModal").classList.add("hidden"));
    $("#referenceShowAll").addEventListener("click", () => {
      state.referenceShowAll = !state.referenceShowAll;
      renderReferenceLibrary();
    });
    $("#referenceAddButton").addEventListener("click", () => $("#referenceLibraryInput").click());
    $("#openReferenceFolder").addEventListener("click", () => void bridge?.openReferences());
    $("#referenceLibraryInput").addEventListener("change", async (event) => {
      const files = [...(event.target.files || [])];
      const category = $("#referenceCategory").value;
      for (const file of files) {
        const dataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ""));
          reader.readAsDataURL(file);
        });
        await bridge.addReference({ category, name: file.name, dataUrl });
      }
      event.target.value = "";
      await loadReferenceLibrary();
      toast(`已加入 ${files.length} 张参考图。`);
    });
    $("#referenceGrid").addEventListener("click", async (event) => {
      const button = event.target.closest("[data-ref-use]");
      if (!button) return;
      const id = button.dataset.refId;
      if (button.dataset.refUse === "remove") {
        await bridge.removeReference({ id });
        await loadReferenceLibrary();
        return;
      }
      await useReferenceItem(id, button.dataset.refUse);
    });
    $("#promptLibraryButton").addEventListener("click", () => {
      $("#promptModal").classList.remove("hidden");
      void loadPromptRecipes();
    });
    $("#closePrompt").addEventListener("click", () => $("#promptModal").classList.add("hidden"));
    $("#savePromptRecipe").addEventListener("click", savePromptRecipe);
    $("#promptSearch").addEventListener("input", renderPromptRecipes);
    $("#promptList").addEventListener("click", (event) => {
      const use = event.target.closest("[data-prompt-use]");
      const edit = event.target.closest("[data-prompt-edit]");
      const del = event.target.closest("[data-prompt-delete]");
      if (use) applyPromptRecipe(use.dataset.promptUse);
      else if (edit) editPromptRecipe(edit.dataset.promptEdit);
      else if (del) deletePromptRecipe(del.dataset.promptDelete);
    });
    $("#helpButton").addEventListener("click", () => $("#helpModal").classList.remove("hidden"));
    $("#closeHelp").addEventListener("click", () => $("#helpModal").classList.add("hidden"));
    $("#revealButton").addEventListener("click", () => {
      if (state.currentImage) void bridge.reveal(state.currentImage.path);
    });
    $("#refineButton").addEventListener("click", () => {
      if (!state.currentImage?.url) return;
      state.initImage = state.currentImage.url;
      // Reuse the source prompt so a good image can be refined instead of restarted.
      if (state.currentImage.prompt) $("#prompt").value = state.currentImage.prompt;
      if (state.currentImage.negativePrompt) $("#negative").value = state.currentImage.negativePrompt;
      if (state.currentImage.seed !== undefined && state.currentImage.seed !== null) {
        $("#seed").value = String(state.currentImage.seed);
      }
      state.referenceSize = {
        width: Number(state.currentImage.width) || null,
        height: Number(state.currentImage.height) || null,
      };
      state.referenceAutoSize = Boolean(state.referenceSize.width && state.referenceSize.height);
      $("#referencePreview").src = state.initImage;
      $("#referencePreview").classList.remove("hidden");
      $("#referenceEmpty").classList.add("hidden");
      $("#referenceClear").classList.remove("hidden");
      $("#referenceMode").value = "img2img";
      $("#adapterControls").classList.add("hidden");
      $("#denoise").value = "0.4";
      $("#denoiseValue").textContent = "40%";
      $("#referenceMeta").textContent = state.referenceAutoSize
        ? `当前结果图 ${state.referenceSize.width} × ${state.referenceSize.height} · 画幅跟随结果图`
        : "当前结果图已放入参考图";
      toast("当前图已放入参考图；默认 40% 保构图重绘。");
    });
    $("#borrowButton").addEventListener("click", () => {
      if (!state.currentImage?.url) return;
      state.initImage = state.currentImage.url;
      state.referenceAutoSize = false;
      $("#referencePreview").src = state.initImage;
      $("#referencePreview").classList.remove("hidden");
      $("#referenceEmpty").classList.add("hidden");
      $("#referenceClear").classList.remove("hidden");
      $("#referenceMode").value = "ref-adapter";
      $("#adapterControls").classList.remove("hidden");
      $("#denoise").value = "0.4";
      $("#denoiseValue").textContent = "40%";
      $("#referenceMeta").textContent = "角色参考：保留参考图角色，场景按提示词重写";
      toast("已切换为角色参考；改写提示词中的场景，再生成。");
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
    applyUiScale(state.config.fontScale || 1);
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

  async function loadStyleLoras() {
    try {
      const response = await fetch(new URL("style-loras.json", window.location.href), { cache: "no-store" });
      if (!response.ok) return;
      const mapping = await response.json();
      if (mapping && typeof mapping === "object") {
        state.styleLoras = { ...state.styleLoras, ...mapping };
      }
    } catch {
      // keep built-in fallback
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    void loadStyleLoras();
    applyAspect("1:1");
    setupCollapsiblePanels();
    void initUpscaleEngines();
    (async () => {
      try {
        const version = await bridge.version();
        const label = $("#appVersionLabel");
        if (label && version) label.textContent = `v${version} · local first`;
      } catch {}
    })();
    applyStyle("anime-cel");
    updateAnimaPreview();
    bridge?.onLlmToken?.(({ token }) => {
      if (!state.aiStreaming || !token) return;
      state.aiDraft += token;
      const last = state.aiMessages[state.aiMessages.length - 1];
      if (!last || last.role !== "assistant") return;
      last.content = state.aiDraft;
      const box = $("#aiChatMessages");
      const node = box?.lastElementChild;
      if (node) {
        node.textContent = state.aiDraft;
        box.scrollTop = box.scrollHeight;
      }
    });
    void bind();
    setupStylePreview();
    renderReferenceCategories();
    void refreshRuntimeState();
  });
})();
