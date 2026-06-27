import { createServer } from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { buildDailyStoryHtml } from "./daily-story-html.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = join(__dirname, "..", "..", "..");
const EXPORT_DIR = join(__dirname, "..", "..", "export", "daily");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

async function startStaticServer() {
  return new Promise((resolve, reject) => {
    const server = createServer(async (req, res) => {
      try {
        const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
        const filePath = join(SITE_ROOT, urlPath);
        if (!filePath.startsWith(SITE_ROOT)) {
          res.writeHead(403);
          res.end();
          return;
        }
        const data = await readFile(filePath);
        const type = MIME[extname(filePath).toLowerCase()] || "application/octet-stream";
        res.writeHead(200, { "Content-Type": type });
        res.end(data);
      } catch {
        res.writeHead(404);
        res.end();
      }
    });
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({ server, baseUrl: `http://127.0.0.1:${port}` });
    });
  });
}

export async function exportDailyStory(story) {
  await mkdir(EXPORT_DIR, { recursive: true });

  const html = buildDailyStoryHtml(story);
  const renderName = `_daily-${story.id}.html`;
  const renderPath = join(EXPORT_DIR, renderName);
  await writeFile(renderPath, html);

  const { server, baseUrl } = await startStaticServer();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });

  try {
    await page.goto(`${baseUrl}/instagram/export/daily/${renderName}`, { waitUntil: "load", timeout: 60000 });
    await page.waitForSelector("#export-story img", { state: "attached", timeout: 10000 });
    await page.waitForFunction(() => {
      const img = document.querySelector("#export-story img");
      return img?.complete && img.naturalWidth > 0;
    }, { timeout: 60000 });

    const outFile = `${story.id}.png`;
    const outPath = join(EXPORT_DIR, outFile);
    await page.locator("#export-story").screenshot({ path: outPath, type: "png" });
    return { outPath, outFile, publicPath: `daily/${outFile}` };
  } finally {
    await browser.close();
    server.close();
  }
}
