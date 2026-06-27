const AMENITY_BY_KIND = {
  snow: [
    "A 20 min de Cerro Catedral · Invierno en la Patagonia",
    "Pileta climatizada y gimnasio del club · Calor después del frío",
    "Salón de relax con hogar a leña en el SPA del barrio",
    "Living con chimenea · Sentite en casa, lejos de casa",
  ],
  cold: [
    "Gimnasio con vista en Dos Valles · Movimiento con buen clima adentro",
    "La Salamandra Pulpería a pasos · Cena patagónica calentita",
    "WiFi y escritorio · Ideal para workation invernal",
    "Dormitorios listos para descansar después del día en la nieve",
  ],
  rain: [
    "Cocina completa · Día perfecto para cocinar en familia",
    "Living acogedor · Lluvia afuera, calma adentro",
    "Gimnasio y SPA del barrio · Plan B bajo techo",
    "La Salamandra · Parrilla y gastronomía sin salir del country",
  ],
  sunny: [
    "Pileta del barrio · Aprovechá el sol en Dos Valles",
    "Senderos y MTB en el bosque · Naturaleza a un paso",
    "Patio con parrilla · Asado con vista al bosque",
    "Canchas de tenis y fútbol · Actividades al aire libre",
  ],
  mild: [
    "Espacios verdes del club · Caminata entre pinos",
    "Bosque y senderos · Club de Campo Dos Valles",
    "Seguridad 24 hs · Tranquilidad para toda la familia",
    "A 15 min del centro · Naturaleza sin alejarte de todo",
  ],
  cloudy: [
    "Entre el bosque y la montaña · Bariloche en cualquier clima",
    "Living luminoso · Luz natural todo el día",
    "Explorá el entorno · Lagos y cerros cerca",
    "Reservá tu próxima escapada · Link en bio",
  ],
};

const NIGHT_LINES = [
  "Fachada iluminada · Noches tranquilas en el bosque",
  "Seguridad 24 hs · Descansá con tranquilidad",
  "El bosque de noche · Magia patagónica en Dos Valles",
];

function captionKeywords(caption) {
  const c = caption.toLowerCase();
  const tags = [];
  if (/noche|nocturn|anochecer|ilumin/.test(c)) tags.push("noche");
  if (/living|hogar|chimenea/.test(c)) tags.push("living");
  if (/cocina|comedor/.test(c)) tags.push("cocina");
  if (/dormitorio|kingsize|cuarto/.test(c)) tags.push("dormitorio");
  if (/baño|banera|bano/.test(c)) tags.push("bano");
  if (/parrilla|patio|exterior|jardín|jardin|bosque/.test(c)) tags.push("exterior");
  if (/escritorio|lectura/.test(c)) tags.push("workation");
  if (/pileta|gimnasio|spa|salón|salon/.test(c)) tags.push("spa");
  if (/cancha|sendero|mtb|verde|club/.test(c)) tags.push("actividades");
  if (/salamandra|gastronomía|gastronomia/.test(c)) tags.push("gastronomia");
  return tags;
}

function pickAmenity(kind, photo, dateStr) {
  const tags = [...(photo.tags || captionKeywords(photo.caption))];
  if (photo.image?.includes("salamandra")) tags.push("gastronomia");
  if (photo.image?.includes("spa-") || photo.image?.includes("pileta")) tags.push("spa");

  if (photo.category === "noche" || tags.includes("noche")) {
    const i = hash(dateStr) % NIGHT_LINES.length;
    return NIGHT_LINES[i];
  }

  const pool = AMENITY_BY_KIND[kind] || AMENITY_BY_KIND.mild;

  const scored = pool.map((line, idx) => {
    let score = hash(`${dateStr}-${idx}`) % 100;
    if (tags.includes("exterior") && /pileta|parrilla|sendero|cancha/i.test(line)) score += 40;
    if (tags.includes("living") && /living|chimenea|calma/i.test(line)) score += 40;
    if (tags.includes("cocina") && /cocina|familia/i.test(line)) score += 40;
    if (tags.includes("spa") && /pileta|gimnasio|SPA/i.test(line)) score += 50;
    if (tags.includes("gastronomia") && /Salamandra|gastronomía/i.test(line)) score += 50;
    if (tags.includes("workation") && /WiFi|escritorio/i.test(line)) score += 40;
    if (tags.includes("dormitorio") && /Dormitorio|descansar/i.test(line)) score += 35;
    return { line, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].line;
}

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

export function buildDailyStoryCopy({ photo, weather, dateStr }) {
  const amenity = pickAmenity(weather.kind, photo, dateStr);
  const title = photo.caption;
  const subtitle = amenity;

  return {
    eyebrow: `Bariloche · ${formatDateShort(dateStr)}`,
    title,
    subtitle,
    weatherLine: weather.summary,
    cta: "Reservá → link en bio",
  };
}

function formatDateShort(dateStr) {
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "short" });
}
