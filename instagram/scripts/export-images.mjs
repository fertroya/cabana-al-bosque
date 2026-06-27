import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { buildExportHtml, getExportTargets, loadContent } from "./lib/render.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const EXPORT_DIR = join(__dirname, "..", "export");
const SITE_ROOT = join(__dirname, "..", "..");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".json": "application/json",
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

async function exportImages() {
  const content = loadContent();
  const html = buildExportHtml(content);
  const targets = getExportTargets(content);

  mkdirSync(EXPORT_DIR, { recursive: true });

  const { server, baseUrl } = await startStaticServer();
  const renderPath = join(EXPORT_DIR, "_render.html");
  writeFileSync(renderPath, html);

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 2400 } });

  try {
    await page.goto(`${baseUrl}/instagram/export/_render.html`, { waitUntil: "networkidle" });
    await page.waitForFunction(() => {
      const imgs = [...document.querySelectorAll("img")];
      return imgs.length > 0 && imgs.every((img) => img.complete && img.naturalWidth > 0);
    }, { timeout: 30000 });

    for (const target of targets) {
      const el = page.locator(target.selector);
      await el.scrollIntoViewIfNeeded();

      const outPath = join(EXPORT_DIR, target.file);
      await el.screenshot({
        path: outPath,
        type: "png",
        omitBackground: false,
      });

      console.log(`✓ ${target.file} (${target.width}×${target.height})`);
    }
  } finally {
    await browser.close();
    server.close();
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    files: targets.map((t) => t.file),
  };
  writeFileSync(join(EXPORT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));

  console.log(`\n${targets.length} imágenes en instagram/export/`);
}

exportImages().catch((err) => {
  console.error("Error exportando imágenes:", err.message);
  process.exit(1);
});
