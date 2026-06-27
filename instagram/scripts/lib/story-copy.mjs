import { buildStoryBrief } from "./story-brief.mjs";
import { isOllamaAvailable, generateStoryCopyWithOllama } from "./ollama-client.mjs";
import { STORY_CTA } from "./brand-context.mjs";
import {
  formatWeatherBadge,
  resolveUsesWeather,
  textUsesWeather,
} from "./story-modes.mjs";

export async function buildDailyStoryCopy({ photo, weather, dateStr }) {
  const brief = buildStoryBrief({ photo, weather, dateStr });

  if (await isOllamaAvailable()) {
    try {
      const generated = await generateStoryCopyWithOllama(brief);
      const validated = validateCopy(generated, brief);
      if (validated) {
        return finalizeCopy(validated, brief, weather, dateStr, "ollama");
      }
    } catch (err) {
      console.warn(`⚠ Ollama: ${err.message} — usando fallback`);
    }
  } else {
    console.warn("⚠ Ollama no disponible — usando fallback (instalá y ejecutá: ollama serve)");
  }

  const fallback = buildFallbackCopy(brief);
  return finalizeCopy(fallback, brief, weather, dateStr, "fallback");
}

function finalizeCopy(copy, brief, weather, dateStr, copySource) {
  const usesWeather = resolveUsesWeather({
    mode: brief.mode,
    subtitle: copy.subtitle,
    llmFlag: copy.usesWeather,
    weather,
  });

  return {
    title: copy.title,
    subtitle: copy.subtitle,
    eyebrow: copy.eyebrow,
    mode: brief.mode.id,
    modeLabel: brief.mode.label,
    usesWeather,
    weatherLine: usesWeather ? formatWeatherBadge(dateStr, weather) : null,
    cta: STORY_CTA.label,
    copySource,
  };
}

function validateCopy(raw, brief) {
  if (!raw?.title || !raw?.subtitle || !raw?.eyebrow) return null;

  const title = clean(raw.title, brief.constraints.maxTitleChars);
  const subtitle = clean(raw.subtitle, brief.constraints.maxSubtitleChars);
  const eyebrow = clean(raw.eyebrow, 48);
  const usesWeather = raw.usesWeather === true;

  if (title.length < 4 || subtitle.length < 30) return null;

  if (brief.mode.weatherRequired && !textUsesWeather(subtitle, brief.weather)) {
    return null;
  }

  return { title, subtitle, eyebrow, usesWeather };
}

function buildFallbackCopy(brief) {
  const builders = {
    "plan-dia": fallbackPlanDia,
    detalle: fallbackDetalle,
    "tip-anfitrion": fallbackTip,
    "para-quien": fallbackParaQuien,
    entorno: fallbackEntorno,
    pregunta: fallbackPregunta,
    "micro-historia": fallbackMicroHistoria,
  };

  const build = builders[brief.mode.id] || fallbackPlanDia;
  return build(brief);
}

function fallbackPlanDia(brief) {
  const { photo, weather } = brief;
  const title = weatherTitle(weather) || photo.displayTitle;
  const subtitle = clean(planDiaPhrase(photo, weather), brief.constraints.maxSubtitleChars);
  return {
    title,
    subtitle,
    eyebrow: eyebrowFor(brief),
    usesWeather: true,
  };
}

function fallbackDetalle(brief) {
  const { photo } = brief;
  const detail = detailForPhoto(photo);
  return {
    title: photo.displayTitle || "Un detalle",
    subtitle: clean(`${detail} Es lo primero que te abraza al entrar.`, brief.constraints.maxSubtitleChars),
    eyebrow: eyebrowFor(brief),
    usesWeather: false,
  };
}

function fallbackTip(brief) {
  const { photo } = brief;
  const tips = {
    cabaña: "En días grises, encendé la luz cálida del living antes de bajar: cambia toda la casa.",
    exterior: "La parrilla queda mejor si encendés el fuego un rato antes de que baje el sol.",
    club: "Preguntá en administración por horarios de pileta y clases del club antes de salir.",
    spa: "Llevá abrigo liviano: del gimnasio a la pileta climatizada se pasa en segundos.",
    gastronomia: "La Salamandra pide reserva; coordiná el acceso con la administración del barrio.",
    actividades: "Con calzado cómodo alcanza: los senderos de Dos Valles empiezan a pocos minutos.",
    noche: "De noche el barrio se siente distinto: silencio, luces cálidas y cielo despejado.",
  };
  const tip = tips[photo.theme] || tips.cabaña;
  return {
    title: "Tip de anfitrión",
    subtitle: clean(tip, brief.constraints.maxSubtitleChars),
    eyebrow: eyebrowFor(brief),
    usesWeather: false,
  };
}

function fallbackParaQuien(brief) {
  const { photo } = brief;
  const profiles = {
    gastronomia: "Para una cena especial sin manejar: reservá en La Salamandra y volvé caminando.",
    spa: "Para quien quiere moverse sin salir del country: gimnasio, pileta y relax a pasos.",
    actividades: "Para familias activas: senderos, canchas y espacio para cansarse y descansar.",
    cabaña: "Para familias o pareja: dos dormitorios, living amplio y bosque alrededor.",
    exterior: "Para quienes extrañan el patio: parrilla, jardín y bosque en la puerta.",
    noche: "Para escapadas en pareja: la cabaña iluminada y el silencio del barrio.",
  };
  return {
    title: "¿Para quién es?",
    subtitle: clean(profiles[photo.theme] || profiles.cabaña, brief.constraints.maxSubtitleChars),
    eyebrow: eyebrowFor(brief),
    usesWeather: false,
  };
}

function fallbackEntorno(brief) {
  const { photo } = brief;
  const lines = {
    gastronomia: "La Salamandra Pulpería está en el country: cocina patagónica sin alejarte de la cabaña.",
    spa: "Pileta climatizada y gimnasio con vista a la montaña — amenities de Dos Valles.",
    actividades: "Senderos, MTB y canchas: el country entero es parte de la estadía.",
    club: "Seguridad 24 hs y amenities del barrio privado, a minutos de la cabaña.",
    exterior: "Patio, parrilla y bosque: afuera empieza la experiencia Dos Valles.",
    cabaña: "La cabaña está adentro del country: pileta, gimnasio y restaurante a pasos.",
  };
  return {
    title: photo.displayTitle || "Dos Valles",
    subtitle: clean(lines[photo.theme] || lines.cabaña, brief.constraints.maxSubtitleChars),
    eyebrow: eyebrowFor(brief),
    usesWeather: false,
  };
}

function fallbackPregunta(brief) {
  const { photo } = brief;
  const questions = {
    gastronomia: "¿Team cena en La Salamandra o cocina en la cabaña con vista al bosque?",
    spa: "¿Primero pileta o primero gimnasio después de un día en la montaña?",
    actividades: "¿Sendero tranquilo o partido en las canchas del club?",
    exterior: "¿Asado en el patio o chocolate caliente adentro?",
    noche: "¿Te quedás mirando las luces de la cabaña o salís a ver el cielo?",
    cabaña: "¿Desayuno largo en el living o salida temprano al cerro?",
  };
  return {
    title: photo.displayTitle || "Tu escapada",
    subtitle: clean(questions[photo.theme] || questions.cabaña, brief.constraints.maxSubtitleChars),
    eyebrow: eyebrowFor(brief),
    usesWeather: false,
  };
}

function fallbackMicroHistoria(brief) {
  const { photo } = brief;
  const stories = {
    gastronomia: "Llegás de noche, cenás en La Salamandra y volvés caminando bajo el cielo de Dos Valles.",
    noche: "Apagás el auto, encendés la luz del living y el bosque se queda afuera, lejos del ruido.",
    exterior: "Abrís la puerta del patio y el olor a leña y pino te recibe antes que nadie.",
    cabaña: "Dejás la valija en el living y, por un segundo, Bariloche entero puede esperar.",
    spa: "Terminás el día en la pileta del club y volvés a la cabaña con el cuerpo liviano.",
    actividades: "Volvés del sendero con las piernas cansadas y el living te espera como refugio.",
  };
  return {
    title: "Un instante",
    subtitle: clean(stories[photo.theme] || stories.cabaña, brief.constraints.maxSubtitleChars),
    eyebrow: eyebrowFor(brief),
    usesWeather: false,
  };
}

function planDiaPhrase(photo, weather) {
  const openers = {
    snow: `Mañana nieva y este ${spaceName(photo)} invita a quedarse adentro`,
    cold: `Con ${weather.tempMax}° y frío patagónico, ${spaceName(photo)} es el plan`,
    rain: `Con lluvia y ${weather.tempMax}°, ${spaceName(photo)} se siente refugio`,
    sunny: `Con ${weather.tempMax}° y sol, ${spaceName(photo)} es el comienzo del día`,
    cloudy: `Cielo nublado y ${weather.tempMax}°: ${spaceName(photo)} manda el ritmo`,
    mild: `En un día de ${weather.tempMax}°, ${spaceName(photo)} marca la jornada`,
  };
  const opener = openers[weather.kind] || openers.mild;
  const cierre =
    photo.theme === "gastronomia"
      ? "y La Salamandra redondea la tarde."
      : photo.theme === "spa"
        ? "y la pileta del club cierra perfecto."
        : "y Dos Valles sigue afuera.";
  return `${opener}, ${cierre}`;
}

function weatherTitle(weather) {
  const map = {
    snow: "Nieve en camino",
    cold: "Frío de refugio",
    rain: "Día de quedarse adentro",
    sunny: "Sol en el bosque",
    cloudy: "Nublado y abrigado",
  };
  return map[weather.kind] || null;
}

function spaceName(photo) {
  if (photo.tags?.includes("living")) return "el living";
  if (photo.tags?.includes("cocina")) return "la cocina";
  if (photo.tags?.includes("dormitorio")) return "el descanso";
  return "este rincón";
}

function detailForPhoto(photo) {
  const map = {
    living: "La luz del living entra suave y el bosque queda enmarcado en la ventana.",
    cocina: "La cocina mira al verde y el desayuno se alarga sin apuro.",
    dormitorio: "El silencio del dormitorio se siente antes de apagar la luz.",
    exterior: "El patio abraza la cabaña y el bosque empieza en la puerta.",
    noche: "Las luces cálidas convierten la noche en refugio.",
    gastronomia: "El hogar de piedra y la mesa preparada hablan de cena patagónica.",
    spa: "La vista a la montaña desde el club cambia el ánimo del día.",
    actividades: "El sendero y el verde invitan a salir un rato más.",
  };
  for (const tag of photo.tags || []) {
    if (map[tag]) return map[tag];
  }
  return map[photo.theme] || "Cada rincón tiene un detalle que se queda en la memoria.";
}

function eyebrowFor(brief) {
  const place = {
    salamandra: "La Salamandra · Dos Valles",
    "dos-valles": "Dos Valles · Bariloche",
    cabaña: "Cabaña al Bosque",
  }[brief.photo.location] || "Bariloche";
  return `${place} · ${brief.dateLabel}`;
}

function clean(text, maxLen) {
  return String(text)
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "")
    .replace(/\s+/g, " ")
    .replace(/^["']|["']$/g, "")
    .trim()
    .slice(0, maxLen);
}
