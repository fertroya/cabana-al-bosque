import "dotenv/config";
import { discoverInstagramUserId } from "./lib/instagram-api.mjs";

async function main() {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) {
    console.error("Configurá META_ACCESS_TOKEN en .env primero.");
    process.exit(1);
  }

  const matches = await discoverInstagramUserId(token);

  if (!matches.length) {
    console.log("No se encontró cuenta de Instagram Business vinculada a ninguna página de Facebook.");
    console.log("\nVerificá que:");
    console.log("1. La cuenta de Instagram sea Profesional (Empresa)");
    console.log("2. Esté vinculada a una Página de Facebook");
    console.log("3. El token tenga permisos pages_show_list e instagram_basic");
    process.exit(1);
  }

  console.log("Cuentas de Instagram encontradas:\n");
  for (const m of matches) {
    console.log(`  Página:      ${m.pageName}`);
    console.log(`  Page ID:     ${m.pageId}`);
    console.log(`  IG User ID:  ${m.instagramUserId}  ← copiá esto a INSTAGRAM_USER_ID en .env`);
    console.log("");
  }
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
