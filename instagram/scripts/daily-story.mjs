import "dotenv/config";
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { fetchTodayWeather } from "./lib/weather.mjs";
import { buildDailyStoryCopy } from "./lib/story-copy.mjs";
import {
  loadPublishedLog,
  wasPublishedOnDate,
  appendPublished,
} from "./lib/published-log.mjs";
import { exportDailyStory } from "./lib/export-daily-story.mjs";
import { createAndPublishMedia, verifyPublicImage } from "./lib/instagram-api.mjs";
import { pickPhoto } from "./lib/pick-photo.mjs";
import { modeForDate } from "./lib/story-modes.mjs";
import { findRepoRoot, syncFilesToRemote } from "./lib/git-publish.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const REPO_ROOT = findRepoRoot(ROOT);

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const publishOnly = args.includes("--publish-only");
const skipPublish = args.includes("--no-publish");
const noGit = args.includes("--no-git");
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

function storyAssetPaths(storyId) {
  return [
    `instagram/export/daily/${storyId}.png`,
    `instagram/export/daily/${storyId}.json`,
  ];
}

async function ensureImageOnGitHubPages({ storyId, dateStr, imageUrl }) {
  if (await verifyPublicImage(imageUrl)) return;

  if (process.env.GITHUB_ACTIONS === "true") {
    console.log("Esperando que GitHub Pages sirva la imagen...");
    await waitForPublicUrl(imageUrl);
    return;
  }

  if (noGit || process.env.AUTO_GIT_PUSH === "0") {
    console.log(`\n⚠ Imagen aún no pública: ${imageUrl}`);
    console.log("Hacé git add instagram/export/daily/ && git push, luego:");
    console.log(`  npm run daily-story:publish -- --date=${dateStr}`);
    console.log("\n(Omití --no-git para commit+push automático)");
    process.exit(1);
  }

  console.log("\nSubiendo story a GitHub Pages (git add → commit → push)...");
  syncFilesToRemote(
    REPO_ROOT,
    storyAssetPaths(storyId),
    `Instagram: story diaria ${dateStr}`
  );

  console.log("Esperando que GitHub Pages sirva la imagen...");
  await waitForPublicUrl(imageUrl);
}

function pushPublishedLog(dateStr) {
  if (noGit || process.env.AUTO_GIT_PUSH === "0" || process.env.GITHUB_ACTIONS === "true") {
    return;
  }

  try {
    syncFilesToRemote(
      REPO_ROOT,
      ["instagram/export/published-stories.json"],
      `Instagram: log story ${dateStr}`
    );
  } catch (err) {
    console.warn(`⚠ No se pudo pushear el log: ${err.message}`);
  }
}

function exportPaths(storyId) {
  return {
    png: join(ROOT, "export", "daily", `${storyId}.png`),
    json: join(ROOT, "export", "daily", `${storyId}.json`),
  };
}

function storyAssetsExist(storyId) {
  const { png } = exportPaths(storyId);
  return existsSync(png);
}

async function generateAndExportStory({ dateStr, storyId, log }) {
  const pool = loadPool();
  const weather = await fetchTodayWeather(dateStr);
  const mode = modeForDate(dateStr);
  const photo = pickPhoto(pool, log, dateStr, weather, mode);
  const copy = await buildDailyStoryCopy({ photo, weather, dateStr });

  const story = {
    id: storyId,
    date: dateStr,
    image: photo.image,
    title: copy.title,
    subtitle: copy.subtitle,
    eyebrow: copy.eyebrow,
    weatherLine: copy.weatherLine,
    cta: copy.cta,
    mode: copy.mode,
    usesWeather: copy.usesWeather,
    weather,
  };

  console.log("═══ Story diaria ═══\n");
  console.log(`Fecha:   ${dateStr}`);
  console.log(`Modo:    ${copy.modeLabel}`);
  console.log(`Foto:    ${photo.image}`);
  console.log(`Tema:    ${photo.theme} (${photo.location})`);
  console.log(`Clima:   ${weather.summary}${copy.usesWeather ? " → en copy y sticker" : " → sin sticker"}`);
  console.log(`Título:  ${copy.title}`);
  console.log(`Texto:   ${copy.subtitle}`);
  console.log(`Copy:    ${copy.copySource}\n`);

  const exported = await exportDailyStory(story);
  console.log(`✓ Exportada: instagram/export/${exported.publicPath}`);

  const copyPath = join(ROOT, "export", "daily", `${storyId}.json`);
  mkdirSync(dirname(copyPath), { recursive: true });
  writeFileSync(
    copyPath,
    JSON.stringify(
      {
        id: storyId,
        copySource: copy.copySource,
        mode: copy.mode,
        usesWeather: copy.usesWeather,
        photo: photo.image,
        theme: photo.theme,
        weather: copy.usesWeather ? weather.summary : null,
        weatherBadge: copy.weatherLine,
        title: copy.title,
        subtitle: copy.subtitle,
        eyebrow: copy.eyebrow,
        cta: copy.cta,
      },
      null,
      2
    )
  );

  return { story, publicPath: exported.publicPath, photo, copy };
}

async function main() {
  const dateStr = dateArg || todayInArgentina();
  const storyId = `story-daily-${dateStr}`;
  const log = loadPublishedLog();

  if (wasPublishedOnDate(log, dateStr) && !dryRun && !args.includes("--force")) {
    console.log(`Ya se publicó una story el ${dateStr}. Nada que hacer.`);
    return;
  }

  let publicPath;
  let story;

  const forceRegenerate = args.includes("--force") && !publishOnly;
  const mustGenerate =
    !publishOnly || forceRegenerate || !storyAssetsExist(storyId);

  if (mustGenerate) {
    if (publishOnly && !storyAssetsExist(storyId)) {
      console.log(`No hay export para ${dateStr} — generando antes de publicar...\n`);
    } else if (publishOnly && forceRegenerate) {
      console.log(`Regenerando story ${dateStr} (--force)...\n`);
    }

    if (dryRun) {
      const pool = loadPool();
      const weather = await fetchTodayWeather(dateStr);
      const mode = modeForDate(dateStr);
      const photo = pickPhoto(pool, log, dateStr, weather, mode);
      const copy = await buildDailyStoryCopy({ photo, weather, dateStr });
      console.log("═══ Story diaria ═══\n");
      console.log(`Fecha:   ${dateStr}`);
      console.log(`Modo:    ${copy.modeLabel}`);
      console.log(`Foto:    ${photo.image}`);
      console.log(`Título:  ${copy.title}`);
      console.log(`Texto:   ${copy.subtitle}`);
      console.log("(dry-run — no se exportó ni publicó)");
      return;
    }

    ({ story, publicPath } = await generateAndExportStory({ dateStr, storyId, log }));
  } else {
    publicPath = `daily/${storyId}.png`;
    console.log(`Usando export existente: instagram/export/${publicPath}`);
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

  await ensureImageOnGitHubPages({ storyId, dateStr, imageUrl });

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
  pushPublishedLog(dateStr);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
