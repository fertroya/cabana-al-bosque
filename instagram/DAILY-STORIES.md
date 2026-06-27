# Story diaria automática

Una historia por día con foto de la galería, copy generado por **Gemma (visión)** en un **modo editorial distinto cada día**, y pronóstico visible solo cuando el texto lo usa.

## Modos editoriales (rotación semanal)

| Día | Modo | Clima en el copy |
|-----|------|------------------|
| Lun | Plan del día | Obligatorio |
| Mar | Detalle que vende | Solo si encaja |
| Mié | Tip de anfitrión | Solo si encaja |
| Jue | Para quién es | Solo si encaja |
| Vie | Entorno Dos Valles | Solo si encaja |
| Sáb | Pregunta | Solo si encaja |
| Dom | Micro-historia | Solo si encaja |

Configuración: `scripts/lib/story-modes.mjs`.

### Sticker de pronóstico

El badge blanco arriba a la derecha **solo aparece si el subtitle menciona el clima** (nieve, lluvia, grados, etc.). Formato: `dom 29 jun · 5° máx · 0° mín · Nublado`.

Si el copy no habla del tiempo, no hay sticker — aunque Open-Meteo se consulte para contexto del LLM o para elegir foto (lunes).

## Copy con Ollama (recomendado en local)

El pipeline envía la foto + brief (modo, tema, clima opcional) a **Ollama** con visión (`gemma4:12b`). Gemma devuelve `usesWeather: true/false` según si el texto usa el pronóstico.

```bash
ollama serve
cd instagram
npm run daily-story:dry
```

Si Ollama no responde, hay **fallback por modo** (plantillas distintas, no siempre clima).

Cada story guarda metadata en `export/daily/story-daily-YYYY-MM-DD.json` (`mode`, `usesWeather`, `copySource`).

El CTA del botón es **「Reservá → link en bio」**; el enlace real va en el Website del perfil (Airbnb en `content.json`).

## Comandos

```bash
cd instagram
npm run sync-pool          # sincroniza fotos desde galeria.html y el-entorno.html
npm run daily-story:dry    # vista previa (sin exportar)
npm run daily-story        # genera PNG + JSON en export/daily/
npm run daily-story:publish # publica la de hoy (imagen ya en GitHub Pages)
```

## Flujo manual (un solo comando)

```bash
npm run daily-story        # exporta → commit+push → espera Pages → publica en IG
```

Por defecto hace **git add → commit → push** de la story y luego publica. Para desactivar: `--no-git` o `AUTO_GIT_PUSH=0`.

```bash
npm run daily-story -- --no-publish   # solo exportar
npm run daily-story -- --no-git       # no tocar git (modo anterior)
```

## Automatización (GitHub Actions)

Workflow: `.github/workflows/instagram-daily-story.yml`  
Horario: **10:00 Argentina** todos los días.

En CI no hay Ollama → `OLLAMA_DISABLED=1` y copy por fallback. Para historias con copy de visión, generá localmente y commiteá el PNG + JSON antes del cron, o ejecutá el workflow manualmente después de pushear.

### Secrets en el repo (Settings → Secrets)

| Secret | Valor |
|--------|--------|
| `META_ACCESS_TOKEN` | Token de Instagram API |
| `INSTAGRAM_USER_ID` | `17841446164390059` |

## Pool de fotos

- ~48 fotos de `images/galeria/`, `images/entorno/` y raíz
- Selección por clima + tema (`pick-photo.mjs`); rotación sin repetir
- Categorías: `cabaña`, `exterior`, `noche`, `club`, `actividades`, `spa`, `gastronomia`
- La Salamandra = restaurante del country (`theme: gastronomia`), no el living

## Pronóstico

Open-Meteo para Dos Valles / Bariloche (gratis, sin API key).

## Archivos

| Archivo | Rol |
|---------|-----|
| `story-pool.json` | Catálogo de fotos |
| `scripts/lib/story-modes.mjs` | Modos editoriales + lógica del sticker clima |
| `scripts/lib/story-brief.mjs` | Brief foto + modo + clima |
| `scripts/lib/ollama-client.mjs` | Cliente Ollama con visión |
| `scripts/lib/story-copy.mjs` | Orquestación Ollama + validación + fallback |
| `export/daily/story-daily-YYYY-MM-DD.png` | Story generada |
| `export/daily/story-daily-YYYY-MM-DD.json` | Copy y metadata |
| `export/published-stories.json` | Log anti-duplicados |
