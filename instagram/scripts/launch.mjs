import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const publish = process.argv.includes("--publish");

function run(script, extraArgs = []) {
  const result = spawnSync("node", [join(__dirname, script), ...extraArgs], {
    cwd: ROOT,
    stdio: "inherit",
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log("1/3 Exportando imágenes...\n");
run("export-images.mjs");

console.log("\n2/3 Configurando perfil (bio + instrucciones)...\n");
run("setup-profile.mjs");

if (publish) {
  console.log("\n3/3 Publicando posts y stories...\n");
  run("publish.mjs");
} else {
  console.log("\n3/3 Publicación omitida.");
  console.log("   Cuando las imágenes estén en GitHub Pages, ejecutá:");
  console.log("   npm run publish:dry   # simular");
  console.log("   npm run publish       # publicar de verdad");
}
