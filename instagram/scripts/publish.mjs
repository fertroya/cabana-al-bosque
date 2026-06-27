import "dotenv/config";
import { createAndPublishMedia, verifyPublicImage } from "./lib/instagram-api.mjs";
import { loadContent } from "./lib/render.mjs";

const dryRun = process.argv.includes("--dry-run");

function requireEnv(name, { optionalDryRun = false } = {}) {
  const value = process.env[name];
  if (!value) {
    if (optionalDryRun && dryRun) return "";
    throw new Error(`Falta ${name} en .env (copiá .env.example)`);
  }
  return value;
}

function publicUrl(base, filename) {
  return `${base.replace(/\/$/, "")}/${filename}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function publishBatch() {
  const token = requireEnv("META_ACCESS_TOKEN", { optionalDryRun: true });
  const instagramUserId = requireEnv("INSTAGRAM_USER_ID", { optionalDryRun: true });
  const publicBase = process.env.PUBLIC_BASE_URL || "https://fertroya.github.io/cabana-al-bosque/instagram/export";
  const intervalMinutes = Number(process.env.POST_INTERVAL_MINUTES || "30");

  const content = loadContent();
  const posts = content.posts.filter((p) => p.publish);
  const stories = content.stories.filter((s) => s.publish);

  console.log(dryRun ? "═══ Simulación de publicación ═══\n" : "═══ Publicando en Instagram ═══\n");

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const imageUrl = publicUrl(publicBase, `${post.id}.png`);

    if (dryRun) {
      console.log(`[POST ${i + 1}/${posts.length}] ${post.id}`);
      console.log(`  URL: ${imageUrl}`);
      console.log(`  Caption: ${post.caption.slice(0, 80)}...`);
      continue;
    }

    const ok = await verifyPublicImage(imageUrl);
    if (!ok) {
      throw new Error(
        `Imagen no accesible: ${imageUrl}\n` +
          "Ejecutá 'npm run export', commiteá instagram/export/ y hacé push a GitHub Pages antes de publicar."
      );
    }

    console.log(`Publicando post ${i + 1}/${posts.length}: ${post.id}...`);
    const mediaId = await createAndPublishMedia({
      instagramUserId,
      token,
      imageUrl,
      caption: post.caption,
      mediaType: "IMAGE",
    });
    console.log(`✓ Post publicado (media id: ${mediaId})`);

    if (i < posts.length - 1 && intervalMinutes > 0) {
      const waitMs = intervalMinutes * 60 * 1000;
      console.log(`  Esperando ${intervalMinutes} min antes del siguiente post...`);
      await sleep(waitMs);
    } else if (i < posts.length - 1) {
      await sleep(5000);
    }
  }

  for (let i = 0; i < stories.length; i++) {
    const story = stories[i];
    const imageUrl = publicUrl(publicBase, `${story.id}.png`);

    if (dryRun) {
      console.log(`[STORY ${i + 1}/${stories.length}] ${story.id}`);
      console.log(`  URL: ${imageUrl}`);
      continue;
    }

    const ok = await verifyPublicImage(imageUrl);
    if (!ok) {
      throw new Error(`Imagen no accesible: ${imageUrl}`);
    }

    console.log(`Publicando story ${i + 1}/${stories.length}: ${story.id}...`);
    const mediaId = await createAndPublishMedia({
      instagramUserId,
      token,
      imageUrl,
      mediaType: "STORIES",
    });
    console.log(`✓ Story publicada (media id: ${mediaId})`);
    await sleep(5000);
  }

  console.log("\nListo.");
}

publishBatch().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
