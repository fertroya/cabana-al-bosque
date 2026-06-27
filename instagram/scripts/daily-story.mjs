import "dotenv/config";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { fetchTodayWeather } from "./lib/weather.mjs";
import { buildDailyStoryCopy } from "./lib/story-copy.mjs";
import {
  loadPublishedLog,
  savePublishedLog,
  wasPublishedOnDate,
  appendPublished,
  getUsedImages,
} from "./lib/published-log.mjs";
import { exportDailyStory } from "./lib/export-daily-story.mjs";
import { createAndPublishMedia, verifyPublicImage } from "./lib/instagram-api.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const publishOnly = args.includes("--publish-only");
const skipPublish = args.includes("--no-publish");
const dateArg = args.find((a) => a.startsWith("--date="))?.split("=")[1];

function todayInArgentina() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date());
}

function loadPool() {
  const raw = readFileSync(join(ROOT, "story-pool.json"), "utf8");
  return JSON.parse(raw).photos;
}

function pickPhoto(pool, log, dateStr) {
  const used = getUsedImages(log);
  let available = pool.filter((p) => !used.has(p.image));
  if (available.length === 0) {
    console.log("ℹ Ciclo completo — reiniciando rotación de fotos");
    available = pool;
  }
  const dayNum = Math.floor(new Date(`${dateStr}T12:00:00-03:00`).getTime() / 86400000);
  return available[dayNum % available.length];
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForPublicUrl(url, timeoutMs = 180000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await verifyPublicImage(url)) return;
    await sleep(10000);
  }
  throw new Error(`Timeout esperando URL pública: ${url}`);
}

async function main() {
  const dateStr = dateArg || todayInArgentina();
  const storyId = `story-daily-${dateStr}`;
  const log = loadPublishedLog();

  if (wasPublishedOnDate(log, dateStr) && !dryRun) {
    console.log(`Ya se publicó una story el ${dateStr}. Nada que hacer.`);
    return;
  }

  let publicPath;
  let story;

  if (!publishOnly) {
    const pool = loadPool();
    const photo = pickPhoto(pool, log, dateStr);
    const weather = await fetchTodayWeather(dateStr);
    const copy = buildDailyStoryCopy({ photo, weather, dateStr });

    story = {
      id: storyId,
      date: dateStr,
      image: photo.image,
      ...copy,
      weather,
    };

    console.log("═══ Story diaria ═══\n");
    console.log(`Fecha:   ${dateStr}`);
    console.log(`Foto:    ${photo.image}`);
    console.log(`Clima:   ${weather.summary}`);
    console.log(`Título:  ${copy.title}`);
    console.log(`Texto:   ${copy.subtitle}\n`);

    if (dryRun) {
      console.log("(dry-run — no se exportó ni publicó)");
      return;
    }

    const exported = await exportDailyStory(story);
    publicPath = exported.publicPath;
    console.log(`✓ Exportada: instagram/export/${publicPath}`);
  } else {
    publicPath = `daily/${storyId}.png`;
  }

  if (skipPublish || dryRun) return;

  const token = process.env.META_ACCESS_TOKEN;
  const instagramUserId = process.env.INSTAGRAM_USER_ID;
  if (!token || !instagramUserId) {
    console.log("\nPara publicar, configurá META_ACCESS_TOKEN e INSTAGRAM_USER_ID en .env");
    console.log("Luego: git push (para subir la imagen) y npm run daily-story:publish");
    return;
  }

  const publicBase = (process.env.PUBLIC_BASE_URL || "https://fertroya.github.io/cabana-al-bosque/instagram/export").replace(/\/$/, "");
  const imageUrl = `${publicBase}/${publicPath}`;

  if (process.env.GITHUB_ACTIONS === "true") {
    console.log("Esperando que GitHub Pages sirva la imagen...");
    await waitForPublicUrl(imageUrl);
  } else {
    const ok = await verifyPublicImage(imageUrl);
    if (!ok) {
      console.log(`\n⚠ Imagen aún no pública: ${imageUrl}`);
      console.log("Hacé git add instagram/export/daily/ && git push, luego:");
      console.log(`  npm run daily-story:publish -- --date=${dateStr}`);
      return;
    }
  }

  console.log(`Publicando story: ${imageUrl}`);
  const mediaId = await createAndPublishMedia({
    instagramUserId,
    token,
    imageUrl,
    mediaType: "STORIES",
  });

  if (!wasPublishedOnDate(log, dateStr)) {
    appendPublished(log, {
      date: dateStr,
      storyId,
      image: story?.image || publicPath,
      mediaId,
      publishedAt: new Date().toISOString(),
    });
  }

  console.log(`✓ Story publicada (media id: ${mediaId})`);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
