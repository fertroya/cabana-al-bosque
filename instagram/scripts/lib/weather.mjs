/** Dos Valles / Bariloche — Open-Meteo (sin API key) */
const LAT = -41.1834;
const LON = -71.3375;
const TZ = "America/Argentina/Buenos_Aires";

const WMO = {
  0: "Despejado",
  1: "Mayormente despejado",
  2: "Parcialmente nublado",
  3: "Nublado",
  45: "Niebla",
  48: "Niebla con escarcha",
  51: "Llovizna leve",
  53: "Llovizna",
  55: "Llovizna intensa",
  61: "Lluvia leve",
  63: "Lluvia",
  65: "Lluvia intensa",
  71: "Nevada leve",
  73: "Nevada",
  75: "Nevada intensa",
  77: "Granizo",
  80: "Chaparrones",
  81: "Chaparrones fuertes",
  82: "Tormenta",
  85: "Nevadas dispersas",
  86: "Nevadas fuertes",
  95: "Tormenta eléctrica",
};

export function weatherKind(code, tempMax) {
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
  if ([61, 63, 65, 51, 53, 55, 80, 81, 82, 95].includes(code)) return "rain";
  if ([0, 1].includes(code) && tempMax >= 14) return "sunny";
  if ([0, 1, 2].includes(code)) return "mild";
  if ([3, 45, 48].includes(code)) return "cloudy";
  if (tempMax < 6) return "cold";
  return "mild";
}

export async function fetchTodayWeather(dateStr) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(LAT));
  url.searchParams.set("longitude", String(LON));
  url.searchParams.set("timezone", TZ);
  url.searchParams.set("forecast_days", "7");
  url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min");

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo error ${res.status}`);
  const data = await res.json();

  const idx = data.daily.time.indexOf(dateStr);
  const i = idx >= 0 ? idx : 0;

  const code = data.daily.weather_code[i];
  const tempMax = Math.round(data.daily.temperature_2m_max[i]);
  const tempMin = Math.round(data.daily.temperature_2m_min[i]);

  return {
    date: data.daily.time[i],
    code,
    label: WMO[code] || "Variable",
    tempMax,
    tempMin,
    kind: weatherKind(code, tempMax),
    summary: `${tempMax}° máx · ${tempMin}° mín · ${WMO[code] || "Variable"}`,
  };
}
