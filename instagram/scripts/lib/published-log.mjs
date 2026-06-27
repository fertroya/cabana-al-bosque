import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOG_PATH = join(__dirname, "..", "..", "export", "published-stories.json");

export function loadPublishedLog() {
  if (!existsSync(LOG_PATH)) {
    return { published: [] };
  }
  return JSON.parse(readFileSync(LOG_PATH, "utf8"));
}

export function savePublishedLog(log) {
  mkdirSync(dirname(LOG_PATH), { recursive: true });
  writeFileSync(LOG_PATH, JSON.stringify(log, null, 2));
}

export function wasPublishedOnDate(log, dateStr) {
  return log.published.some((e) => e.date === dateStr);
}

export function appendPublished(log, entry) {
  log.published.push(entry);
  savePublishedLog(log);
}

export function getUsedImages(log) {
  return new Set(log.published.map((e) => e.image));
}
