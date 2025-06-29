// Minimal Cloudflare Worker for generating and resolving short URLs with
// Google Safe Browsing validation.
// Bind a KV namespace named "LINKS" and set the secret GOOGLE_API_KEY.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return withCors(new Response(null, { status: 204 }));
    }

    if (request.method === "POST" && url.pathname === "/") {
      return withCors(await handlePost(request, env.LINKS, env));
    }

    if (request.method === "GET") {
      const key = url.pathname.slice(1);
      if (key) {
        const target = await env.LINKS.get(key);
        if (target) {
          return Response.redirect(target, 302);
        }
      }
      return new Response("Not found", { status: 404 });
    }

    return new Response("Method not allowed", { status: 405 });
  },
};

function withCors(response) {
  Object.entries(corsHeaders).forEach(([k, v]) => response.headers.set(k, v));
  return response;
}

async function handlePost(request, LINKS, env) {
  let data;
  try {
    data = await request.json();
  } catch {
    return jsonError(400, "Invalid JSON");
  }

  const url = data?.url;
  if (
    typeof url !== "string" ||
    (!url.startsWith("http://") && !url.startsWith("https://"))
  ) {
    return jsonError(400, "Invalid url");
  }

  let isSafe;
  try {
    isSafe = await checkUnsafeUrl(url, env);
  } catch (err) {
    console.error("Safe‑Browsing lookup failed:", err);
    isSafe = true;
  }

  if (!isSafe) {
    return jsonError(400, "Unsafe url");
  }

  const key = await generateKey(LINKS);
  await LINKS.put(key, url);
  return new Response(JSON.stringify({ status: 200, key: `/${key}` }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function jsonError(code, message) {
  return new Response(JSON.stringify({ status: code, error: message }), {
    status: code,
    headers: { "content-type": "application/json" },
  });
}

async function checkUnsafeUrl(url, env) {
  if (!env?.GOOGLE_API_KEY) {
    console.warn("GOOGLE_API_KEY is missing – skipping Safe‑Browsing check");
    return true;
  }

  const body = JSON.stringify({
    client: { clientId: "Url-Shorten-Worker", clientVersion: "1.0.8" },
    threatInfo: {
      threatTypes: [
        "MALWARE",
        "SOCIAL_ENGINEERING",
        "POTENTIALLY_HARMFUL_APPLICATION",
        "UNWANTED_SOFTWARE",
      ],
      platformTypes: ["ANY_PLATFORM"],
      threatEntryTypes: ["URL"],
      threatEntries: [{ url }],
    },
  });

  const res = await fetch(
    `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${encodeURIComponent(
      env.GOOGLE_API_KEY.trim(),
    )}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    },
  );

  if (!res.ok) throw new Error(`Safe‑Browsing API ${res.status}`);

  const json = await res.json();
  return Object.keys(json).length === 0;
}

async function generateKey(LINKS, length = 6) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  while (true) {
    const arr = crypto.getRandomValues(new Uint8Array(length));
    const key = Array.from(arr, (x) => chars[x % chars.length]).join("");
    if (!(await LINKS.get(key))) return key;
  }
}
