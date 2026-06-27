function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function buildDailyStoryHtml(story) {
  const src = `/images/${story.image}`;
  const weatherBadge = story.weatherLine
    ? `<div class="weather-badge">${escapeHtml(story.weatherLine)}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="es-AR">
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --teal: #2f4f57;
      --accent: #e8a54b;
      --white: #ffffff;
      --serif: "Cormorant Garamond", Georgia, serif;
      --sans: "Montserrat", sans-serif;
    }
    body { margin: 0; background: #fff; }
    .canvas.story {
      width: 1080px;
      height: 1920px;
      position: relative;
      overflow: hidden;
      font-family: var(--sans);
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
      background: linear-gradient(to top, rgba(15,23,42,0.88) 0%, rgba(15,23,42,0.35) 50%, rgba(15,23,42,0.15) 100%);
    }
    .canvas .logo-bar {
      position: absolute;
      top: 0; left: 0; right: 0;
      padding: 48px 60px;
      background: linear-gradient(to bottom, rgba(47,79,87,0.9), transparent);
    }
    .canvas .logo-bar span {
      color: #fff;
      font-size: 26px;
      font-weight: 600;
      letter-spacing: 3px;
    }
    .weather-badge {
      position: absolute;
      top: 120px;
      right: 60px;
      background: rgba(255,255,255,0.92);
      color: var(--teal);
      font-size: 24px;
      font-weight: 600;
      padding: 18px 28px;
      border-radius: 12px;
      max-width: 480px;
      text-align: right;
      line-height: 1.35;
    }
    .canvas .content {
      position: absolute;
      left: 0; right: 0; bottom: 300px;
      padding: 0 70px;
      color: var(--white);
    }
    .canvas .eyebrow {
      font-size: 28px;
      font-weight: 600;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: var(--accent);
      margin-bottom: 20px;
    }
    .canvas h2 {
      font-family: var(--serif);
      font-size: 82px;
      font-weight: 700;
      line-height: 1.05;
      margin: 0 0 28px;
    }
    .canvas p {
      font-size: 34px;
      line-height: 1.45;
      margin: 0;
      opacity: 0.95;
    }
    .canvas .cta {
      position: absolute;
      bottom: 90px;
      left: 70px;
      right: 70px;
      background: var(--accent);
      color: #1e293b;
      text-align: center;
      font-weight: 700;
      font-size: 34px;
      padding: 34px;
      border-radius: 12px;
    }
  </style>
</head>
<body>
  <div class="canvas story" id="export-story">
    <img class="bg" src="${src}" alt="">
    <div class="overlay"></div>
    <div class="logo-bar"><span>CABAÑA AL BOSQUE</span></div>
    ${weatherBadge}
    <div class="content">
      <div class="eyebrow">${escapeHtml(story.eyebrow)}</div>
      <h2>${escapeHtml(story.title)}</h2>
      <p>${escapeHtml(story.subtitle)}</p>
    </div>
    <div class="cta">${escapeHtml(story.cta)}</div>
  </div>
</body>
</html>`;
}
