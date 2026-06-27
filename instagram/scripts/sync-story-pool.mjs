import { readFileSync, writeFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const INSTAGRAM_ROOT = join(__dirname, "..");
const SITE_ROOT = join(__dirname, "..", "..");

function isValidImage(path) {
  try {
    return statSync(path).size > 10_000;
  } catch {
    return false;
  }
}

function parseGaleria(html) {
  const items = [];
  const re = /<figure class="gallery-item[^"]*" data-category="([^"]+)"[\s\S]*?src="images\/([^"]+)"[\s\S]*?<figcaption>([^<]+)<\/figcaption>/g;
  let m;
  while ((m = re.exec(html))) {
    const [, category, image, caption] = m;
    if (!image.includes("galeria/")) continue;
    items.push({ image, category, caption: caption.trim(), source: "galeria" });
  }
  return items;
}

function parseEntorno(html) {
  const items = [];
  const re = /src="images\/(entorno\/[^"]+)"[\s\S]*?<figcaption>([^<]+)<\/figcaption>/g;
  let m;
  const seen = new Set();
  while ((m = re.exec(html))) {
    const [, image, caption] = m;
    if (seen.has(image)) continue;
    seen.add(image);
    items.push({
      image,
      category: "entorno",
      caption: caption.trim(),
      source: "entorno",
    });
  }
  return items;
}

function parseRootExtras() {
  const extras = [
    { image: "living-vista-bosque.jpg", category: "casa", caption: "Living con vista al bosque", source: "casa" },
    { image: "living-hogar.jpg", category: "casa", caption: "Living hogareño", source: "casa" },
    { image: "exterior-jardin.jpg", category: "exterior", caption: "Jardín y bosque", source: "casa" },
    { image: "exterior-asado.jpg", category: "exterior", caption: "Parrilla y patio", source: "casa" },
    { image: "exterior-noche.jpg", category: "noche", caption: "Cabaña de noche", source: "casa" },
    { image: "cocina.jpg", category: "casa", caption: "Cocina equipada", source: "casa" },
    { image: "comedor.jpg", category: "casa", caption: "Comedor", source: "casa" },
  ];
  return extras.filter((e) => isValidImage(join(SITE_ROOT, "images", e.image)));
}

function dedupe(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (seen.has(item.image)) return false;
    seen.add(item.image);
    return isValidImage(join(SITE_ROOT, "images", item.image));
  });
}

function enrich(items) {
  return items.map((item) => ({
    ...item,
    tags: inferTags(item),
  }));
}

function inferTags(item) {
  const c = item.caption.toLowerCase();
  const tags = [item.category];
  if (/noche|nocturn|anochecer/.test(c)) tags.push("noche");
  if (/living|hogar/.test(c)) tags.push("living");
  if (/cocina|comedor/.test(c)) tags.push("cocina");
  if (/dormitorio|kingsize|cuarto/.test(c)) tags.push("dormitorio");
  if (/baño|banera|bano/.test(c)) tags.push("bano");
  if (/parrilla|patio|exterior|jardín|jardín|bosque/.test(c)) tags.push("exterior");
  if (/pileta|gimnasio|spa|relax/.test(c)) tags.push("spa");
  if (/cancha|sendero|mtb|verde/.test(c)) tags.push("actividades");
  if (/salamandra|gastronomía|gastronomia|bife|pulpería|pulperia/.test(c)) tags.push("gastronomia");
  if (item.source === "entorno" && item.image.includes("salamandra")) tags.push("gastronomia");
  if (item.source === "entorno" && item.image.includes("spa")) tags.push("spa");
  if (/escritorio|lectura/.test(c)) tags.push("workation");
  return [...new Set(tags)];
}

const galeriaHtml = readFileSync(join(SITE_ROOT, "galeria.html"), "utf8");
const entornoHtml = readFileSync(join(SITE_ROOT, "el-entorno.html"), "utf8");

const pool = dedupe([
  ...parseGaleria(galeriaHtml),
  ...parseEntorno(entornoHtml),
  ...parseRootExtras(),
]);

const output = {
  generatedAt: new Date().toISOString(),
  count: pool.length,
  note: "Pixieset bloqueado por Cloudflare; pool sincronizado desde galería local.",
  photos: enrich(pool),
};

writeFileSync(join(INSTAGRAM_ROOT, "story-pool.json"), JSON.stringify(output, null, 2));
console.log(`✓ story-pool.json — ${pool.length} fotos`);
