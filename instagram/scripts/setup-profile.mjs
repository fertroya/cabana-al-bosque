import "dotenv/config";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { loadContent } from "./lib/render.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function copyToClipboard(text) {
  try {
    execSync("pbcopy", { input: text });
    return true;
  } catch {
    return false;
  }
}

function setupProfile() {
  const content = loadContent();
  const { profile } = content;

  const bioPath = join(ROOT, "export", "bio.txt");
  writeFileSync(bioPath, profile.bio, "utf8");

  const copied = copyToClipboard(profile.bio);

  console.log("═══ Perfil de Instagram ═══\n");
  console.log(`Nombre:   ${profile.name}`);
  console.log(`Usuario:  @${profile.username}`);
  console.log(`Website:  ${profile.website}`);
  console.log("\nBio:\n");
  console.log(profile.bio);
  console.log("\n──────────────────────────");

  if (copied) {
    console.log("✓ Bio copiada al portapapeles (macOS)");
  } else {
    console.log(`✓ Bio guardada en ${bioPath}`);
  }

  console.log("\nPasos manuales (Instagram no permite cambiar bio vía API):");
  console.log("1. Abrí https://www.instagram.com/accounts/edit/");
  console.log("2. Pegá la bio (Cmd+V)");
  console.log(`3. Website: ${profile.website}`);
  console.log("4. Foto de perfil: subí images/profile-caricature.png o instagram/export/profile.png");
  console.log("   (ejecutá 'npm run export' primero si no existe)");
}

setupProfile();
