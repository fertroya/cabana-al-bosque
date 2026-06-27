const API_VERSION = "v22.0";

function getApiBase() {
  return process.env.INSTAGRAM_API_BASE === "facebook"
    ? `https://graph.facebook.com/${API_VERSION}`
    : `https://graph.instagram.com/${API_VERSION}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function api(path, { method = "GET", token, body } = {}) {
  const url = new URL(`${getApiBase()}${path}`);
  url.searchParams.set("access_token", token);

  const options = { method };
  if (body) {
    options.headers = { "Content-Type": "application/json" };
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error?.message || `API error ${res.status}`);
  }
  return data;
}

async function waitForContainer(containerId, token, { timeoutMs = 120000 } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const status = await api(`/${containerId}?fields=status_code`, { token });
    if (status.status_code === "FINISHED") return;
    if (status.status_code === "ERROR") {
      throw new Error(`Container ${containerId} failed processing`);
    }
    await sleep(3000);
  }
  throw new Error(`Timeout waiting for container ${containerId}`);
}

export async function createAndPublishMedia({
  instagramUserId,
  token,
  imageUrl,
  caption,
  mediaType = "IMAGE",
}) {
  const params = new URLSearchParams({
    image_url: imageUrl,
    access_token: token,
  });

  if (caption) params.set("caption", caption);
  if (mediaType === "STORIES") params.set("media_type", "STORIES");

  const createRes = await fetch(`${getApiBase()}/${instagramUserId}/media?${params}`, {
    method: "POST",
  });
  const created = await createRes.json();
  if (!createRes.ok || created.error) {
    throw new Error(created.error?.message || "Failed to create media container");
  }

  await waitForContainer(created.id, token);

  const publishRes = await fetch(
    `${getApiBase()}/${instagramUserId}/media_publish?creation_id=${created.id}&access_token=${token}`,
    { method: "POST" }
  );
  const published = await publishRes.json();
  if (!publishRes.ok || published.error) {
    throw new Error(published.error?.message || "Failed to publish media");
  }

  return published.id;
}

export async function discoverInstagramUserId(token) {
  // Instagram Login API (app tipo CabanaAlBosqueSync-IG)
  try {
    const prev = process.env.INSTAGRAM_API_BASE;
    process.env.INSTAGRAM_API_BASE = "instagram";
    const me = await api("/me?fields=user_id,username", { token });
    process.env.INSTAGRAM_API_BASE = prev;
    if (me.user_id) {
      return [{
        pageName: me.username ? `@${me.username}` : "Instagram",
        instagramUserId: me.user_id,
      }];
    }
  } catch {
    // fallback: Facebook Login + Página vinculada
  }

  const prev = process.env.INSTAGRAM_API_BASE;
  process.env.INSTAGRAM_API_BASE = "facebook";
  const pages = await api("/me/accounts?fields=id,name,instagram_business_account", { token });
  process.env.INSTAGRAM_API_BASE = prev;
  const matches = [];

  for (const page of pages.data || []) {
    const ig = page.instagram_business_account;
    if (ig?.id) {
      matches.push({
        pageId: page.id,
        pageName: page.name,
        instagramUserId: ig.id,
      });
    }
  }

  return matches;
}

export async function verifyPublicImage(url) {
  const res = await fetch(url, { method: "HEAD" });
  return res.ok;
}
