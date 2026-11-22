import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";

const ROOT = "F:/DSH WORKSPACE/lumen-flow";
const CATALOG = path.join(ROOT, "training/bilibili_columns.json");
const OUT = path.join(ROOT, "training/_crawl/bilibili");
const LIMIT = Number(process.env.CRAWL_LIMIT || 0);
const MAX_PER_ARTICLE = Number(process.env.CRAWL_MAX_IMAGES || 30);
const SKIP = /(瑁镐綋|鍏ㄨ８|鎬т氦|鍋氱埍|鍙ｄ氦|闃磋寧|闃撮亾|鑲夋|绮炬恫|鑲涗氦|涔变鸡|porn|nsfw|r18|18\+)/i;
const ALLOWED_LABELS = new Set(["2_5d_semi", "flat_cel", "moe_2d", "manga", "unknown"]);

const catalog = JSON.parse(fs.readFileSync(CATALOG, "utf8").replace(/^\uFEFF/, ""));
const columns = catalog.columns.slice(0, LIMIT > 0 ? LIMIT : undefined);
fs.mkdirSync(OUT, { recursive: true });
const manifestPath = path.join(OUT, "manifest.jsonl");
const manifest = fs.createWriteStream(manifestPath, { flags: "a", encoding: "utf8" });

const browser = await chromium.connectOverCDP("http://127.0.0.1:9666");
const context = browser.contexts()[0];
const page = context.pages()[0];
let downloaded = 0;
let skipped = 0;

for (let index = 0; index < columns.length; index++) {
  const column = columns[index];
  const title = String(column.title || "");
  const label = ALLOWED_LABELS.has(column.label) ? column.label : "unknown";
  if (SKIP.test(title)) {
    skipped++;
    continue;
  }
  const dir = path.join(OUT, label, String(column.id));
  fs.mkdirSync(dir, { recursive: true });
  try {
    await page.goto(`https://www.bilibili.com/read/cv${column.id}`, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    await page.waitForTimeout(1200);
    const liveTitle = (await page.title()) || title;
    for (let scroll = 0; scroll < 4; scroll++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight * 2));
      await page.waitForTimeout(500);
    }
    const urls = await page.evaluate(() =>
      Array.from(new Set(
        Array.from(document.images)
          .flatMap((image) => [image.currentSrc, image.src, image.dataset?.src])
          .filter((url) => url && /hdslb\.com\/bfs\/(?:article|new_dyn)\//.test(url)),
      )),
    );
    const picks = urls.filter((url) => !/@80w|@96w|@160w|avatar|face|banner/.test(url)).slice(0, MAX_PER_ARTICLE);
    const rows = [];
    for (let i = 0; i < picks.length; i++) {
      const url = picks[i];
      try {
        const response = await fetch(url, { headers: { Referer: "https://www.bilibili.com/" } });
        if (!response.ok) continue;
        const buffer = Buffer.from(await response.arrayBuffer());
        if (buffer.length < 12000) continue;
        const clean = url.split("?")[0];
        const extMatch = /\.(png|jpe?g|webp|avif)$/i.exec(clean);
        const ext = extMatch ? extMatch[1].toLowerCase().replace("jpeg", "jpg") : "jpg";
        const file = path.join(dir, `${String(i).padStart(3, "0")}.${ext}`);
        fs.writeFileSync(file, buffer);
        rows.push({ id: column.id, title: liveTitle, label, file, source: url, bytes: buffer.length });
        downloaded++;
      } catch {}
    }
    for (const row of rows) manifest.write(JSON.stringify(row) + "\n");
    manifest.write(JSON.stringify({ id: column.id, title: liveTitle, label, event: "page", images: rows.length }) + "\n");
  } catch (error) {
    manifest.write(JSON.stringify({ id: column.id, title, label, event: "error", error: String(error) }) + "\n");
  }
  if ((index + 1) % 10 === 0) {
    console.log(`crawled ${index + 1}/${columns.length}; images=${downloaded}; skipped=${skipped}`);
  }
  await page.waitForTimeout(800);
}

manifest.end();
fs.writeFileSync(path.join(OUT, "DONE.json"), JSON.stringify({ columns: columns.length, images: downloaded, skipped, finished: new Date().toISOString() }, null, 2));
await browser.close();
console.log(JSON.stringify({ columns: columns.length, images: downloaded, skipped }));

