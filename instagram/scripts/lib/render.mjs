import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");

export function loadContent() {
  const raw = readFileSync(join(ROOT, "content.json"), "utf8");
  return JSON.parse(raw);
}

export function imagePath(filename) {
  return `/images/${filename}`;
}

export function awardImagePath() {
  return "/images/booking-award-2026.png";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderPhotoOverlay(item) {
  const src = imagePath(item.image);
  return `
    <div class="canvas" id="export-${item.id}">
      <img class="bg" src="${src}" alt="">
      <div class="overlay"></div>
      <div class="logo-bar"><span>CABAÑA AL BOSQUE</span></div>
      <div class="content">
        <div class="eyebrow">${escapeHtml(item.eyebrow)}</div>
        <h2>${escapeHtml(item.title)}</h2>
        <p>${escapeHtml(item.subtitle)}</p>
      </div>
    </div>`;
}

function renderAward(item) {
  const src = awardImagePath();
  return `
    <div class="canvas award" id="export-${item.id}">
      <div class="content">
        <img class="award-img" src="${src}" alt="Booking Award">
        <div class="eyebrow award-eyebrow">Traveller Review Awards 2026</div>
        <div class="score">9,9</div>
        <h2>Reconocidos por nuestros huéspedes</h2>
        <p class="award-sub">Booking.com · Cabaña al Bosque, Bariloche</p>
      </div>
    </div>`;
}

function renderSolidTeal(item) {
  return `
    <div class="canvas solid-teal" id="export-${item.id}">
      <div class="content">
        <div class="badge">${escapeHtml(item.badge)}</div>
        <h2>${escapeHtml(item.title)}</h2>
        <p>${escapeHtml(item.subtitle).replaceAll("\n", "<br>")}</p>
      </div>
    </div>`;
}

function renderFeatures(item) {
  const items = item.features.map((f) => `<li>${escapeHtml(f)}</li>`).join("");
  return `
    <div class="canvas features" id="export-${item.id}">
      <div class="content">
        <h2>${escapeHtml(item.title)}</h2>
        <ul>${items}</ul>
      </div>
    </div>`;
}

function renderStory(item) {
  const src = imagePath(item.image);
  return `
    <div class="canvas story" id="export-${item.id}">
      <img class="bg" src="${src}" alt="">
      <div class="overlay"></div>
      <div class="content">
        <div class="eyebrow">${escapeHtml(item.eyebrow)}</div>
        <h2>${escapeHtml(item.title)}</h2>
        <p>${escapeHtml(item.subtitle)}</p>
      </div>
      <div class="cta">${escapeHtml(item.cta)}</div>
    </div>`;
}

function renderHighlight(item) {
  return `
    <div class="canvas highlight" id="export-${item.id}">
      <span>${escapeHtml(item.label)}</span>
    </div>`;
}

function renderProfile() {
  const src = imagePath("profile-caricature.png");
  return `
    <div class="canvas profile-photo" id="export-profile">
      <img src="${src}" alt="Cabaña al Bosque">
    </div>`;
}

function renderPost(item) {
  switch (item.type) {
    case "photo-overlay":
      return renderPhotoOverlay(item);
    case "award":
      return renderAward(item);
    case "solid-teal":
      return renderSolidTeal(item);
    case "features":
      return renderFeatures(item);
    default:
      throw new Error(`Tipo de post desconocido: ${item.type}`);
  }
}

export function buildExportHtml(content) {
  const blocks = [
    renderProfile(),
    ...content.highlights.map(renderHighlight),
    ...content.posts.map(renderPost),
    ...content.stories.map(renderStory),
  ].join("\n");

  return `<!DOCTYPE html>
<html lang="es-AR">
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --blue: #046bd2;
      --teal: #2f4f57;
      --accent: #e8a54b;
      --white: #ffffff;
      --bg-soft: #f0f5fa;
      --text-dark: #1e293b;
      --serif: "Cormorant Garamond", Georgia, serif;
      --sans: "Montserrat", sans-serif;
    }
    body { margin: 0; background: #ffffff; }
    .stage { position: relative; }
    .canvas {
      width: 1080px;
      height: 1080px;
      position: relative;
      overflow: hidden;
      font-family: var(--sans);
      margin: 0;
    }
    .canvas img.bg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .canvas .overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(15,23,42,0.82) 0%, rgba(15,23,42,0.25) 45%, transparent 70%);
    }
    .canvas .content {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      padding: 80px;
      color: var(--white);
    }
    .canvas .eyebrow {
      font-size: 28px;
      font-weight: 600;
      letter-spacing: 4px;
      text-transform: uppercase;
      color: var(--accent);
      margin-bottom: 20px;
    }
    .canvas h2 {
      font-family: var(--serif);
      font-size: 72px;
      font-weight: 700;
      line-height: 1.1;
      margin: 0 0 24px;
    }
    .canvas p { font-size: 32px; line-height: 1.45; margin: 0; opacity: 0.95; max-width: 85%; }
    .canvas .logo-bar {
      position: absolute;
      top: 0; left: 0; right: 0;
      padding: 48px 60px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: linear-gradient(to bottom, rgba(47,79,87,0.85), transparent);
    }
    .canvas .logo-bar span { color: #fff; font-size: 26px; font-weight: 600; letter-spacing: 3px; }
    .canvas .badge {
      background: var(--accent);
      color: var(--text-dark);
      font-weight: 700;
      font-size: 28px;
      padding: 16px 32px;
      border-radius: 8px;
      display: inline-block;
      margin-bottom: 24px;
    }
    .canvas.solid-teal { background: var(--teal); }
    .canvas.solid-teal .content {
      position: static;
      padding: 100px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      height: 100%;
    }
    .canvas.solid-teal h2 { font-size: 80px; }
    .canvas.award { background: var(--bg-soft); }
    .canvas.award .content {
      position: static;
      padding: 80px;
      text-align: center;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: var(--text-dark);
    }
    .canvas.award h2 { color: var(--teal); font-size: 64px; }
    .canvas.award .score { font-size: 120px; font-weight: 700; color: var(--blue); line-height: 1; margin: 20px 0; }
    .canvas.award img.award-img { width: 320px; margin-bottom: 40px; }
    .canvas.award .award-eyebrow { color: var(--blue); }
    .canvas.award .award-sub { color: var(--text-dark); opacity: 0.8; }
    .canvas.features { background: var(--white); }
    .canvas.features .content {
      position: static;
      padding: 80px;
      color: var(--text-dark);
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .canvas.features h2 { color: var(--teal); font-size: 64px; }
    .canvas.features ul { list-style: none; padding: 0; margin: 40px 0 0; font-size: 36px; line-height: 2; }
    .canvas.features li::before { content: "✓ "; color: var(--accent); font-weight: 700; }
    .canvas.highlight {
      background: var(--teal);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .canvas.highlight span {
      color: #fff;
      font-size: 48px;
      font-weight: 600;
      letter-spacing: 2px;
      text-align: center;
      padding: 40px;
    }
    .canvas.profile-photo {
      width: 1080px;
      height: 1080px;
      overflow: hidden;
    }
    .canvas.profile-photo img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .canvas.story { width: 1080px; height: 1920px; }
    .canvas.story .content { padding: 100px 70px; }
    .canvas.story h2 { font-size: 88px; }
    .canvas.story p { font-size: 40px; max-width: 100%; }
    .canvas.story .cta {
      position: absolute;
      bottom: 120px;
      left: 70px;
      right: 70px;
      background: var(--accent);
      color: var(--text-dark);
      text-align: center;
      font-weight: 700;
      font-size: 36px;
      padding: 36px;
      border-radius: 12px;
    }
  </style>
</head>
<body>
  <div class="stage">
    ${blocks}
  </div>
</body>
</html>`;
}

export function getExportTargets(content) {
  const targets = [
    { id: "profile", selector: "#export-profile", file: "profile.png", width: 1080, height: 1080 },
    ...content.highlights.map((h) => ({
      id: h.id,
      selector: `#export-${h.id}`,
      file: `${h.id}.png`,
      width: 1080,
      height: 1080,
    })),
    ...content.posts.map((p) => ({
      id: p.id,
      selector: `#export-${p.id}`,
      file: `${p.id}.png`,
      width: 1080,
      height: 1080,
    })),
    ...content.stories.map((s) => ({
      id: s.id,
      selector: `#export-${s.id}`,
      file: `${s.id}.png`,
      width: 1080,
      height: 1920,
    })),
  ];
  return targets;
}
