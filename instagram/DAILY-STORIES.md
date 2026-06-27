# Story diaria automática

Una historia por día con foto de la galería + pronóstico de Bariloche + amenity del barrio.

## Comandos

```bash
cd instagram
npm run sync-pool          # sincroniza fotos desde galeria.html y el-entorno.html
npm run daily-story:dry    # vista previa (sin exportar)
npm run daily-story        # genera PNG en export/daily/
npm run daily-story:publish # publica la de hoy (imagen ya en GitHub Pages)
```

## Flujo manual

```bash
npm run daily-story
git add instagram/export/daily/ instagram/story-pool.json
git push
# esperar ~1 min GitHub Pages
npm run daily-story:publish
```

## Automatización (GitHub Actions)

Workflow: `.github/workflows/instagram-daily-story.yml`  
Horario: **10:00 Argentina** todos los días.

### Secrets en el repo (Settings → Secrets)

| Secret | Valor |
|--------|--------|
| `META_ACCESS_TOKEN` | Token de Instagram API |
| `INSTAGRAM_USER_ID` | `17841446164390059` |

## Pool de fotos

- ~45 fotos de `images/galeria/`, `images/entorno/` y raíz
- Rotación sin repetir hasta agotar el ciclo
- Pixieset no importable automáticamente (Cloudflare); fotos ya migradas a galería local

## Pronóstico

Open-Meteo para Dos Valles / Bariloche (gratis, sin API key).  
El texto combina clima del día con un amenity relacionado (pileta, gimnasio, senderos, Salamandra, etc.).

## Archivos

| Archivo | Rol |
|---------|-----|
| `story-pool.json` | Catálogo de fotos |
| `export/daily/story-daily-YYYY-MM-DD.png` | Story generada |
| `export/published-stories.json` | Log anti-duplicados |
