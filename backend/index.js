// Minimal Cloudflare Worker for generating and resolving short URLs.
// Bind a KV namespace named "LINKS" to persist mappings.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return withCors(new Response(null, { status: 204 }));
    }

    if (request.method === "POST" && url.pathname === "/") {
      return withCors(await handlePost(request, env.LINKS));
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

async function handlePost(request, LINKS) {
  let data;
  try {
    data = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ status: 400, error: "Invalid JSON" }),
      {
        status: 400,
        headers: { "content-type": "application/json" },
      }
    );
  }

  const url = data && data.url;
  if (
    typeof url !== "string" ||
    (!url.startsWith("http://") && !url.startsWith("https://"))
  ) {
    return new Response(JSON.stringify({ status: 400, error: "Invalid url" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  if (!checkUrl(url)) {
    return new Response(JSON.stringify({ status: 400, error: "Unsafe url" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  const key = await generateKey(LINKS);
  await LINKS.put(key, url);
  return new Response(JSON.stringify({ status: 200, key: `/${key}` }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

async function checkUrl(url) {
  let raw = JSON.stringify({
    client: { clientId: "Url-Shorten-Worker", clientVersion: "1.0.7" },
    threatInfo: {
      threatTypes: [
        "MALWARE",
        "SOCIAL_ENGINEERING",
        "POTENTIALLY_HARMFUL_APPLICATION",
        "UNWANTED_SOFTWARE",
      ],
      platformTypes: ["ANY_PLATFORM"],
      threatEntryTypes: ["URL"],
      threatEntries: [{ url: url }],
    },
  });

  let requestOptions = {
    method: "POST",
    body: raw,
    redirect: "follow",
  };

  if (!env.GOOGLE_API_KEY) {
    return true;
  }
  result = await fetch(
    "https://safebrowsing.googleapis.com/v4/threatMatches:find?key=" +
      env.GOOGLE_API_KEY,
    requestOptions
  );
  result = await result.json();
  console.log(result);
  if (Object.keys(result).length === 0) {
    return true;
  } else {
    return false;
  }
}

async function generateKey(LINKS, length = 6) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  while (true) {
    const arr = new Uint8Array(length);
    crypto.getRandomValues(arr);
    const key = Array.from(arr)
      .map((i) => chars[i % chars.length])
      .join("");
    const exists = await LINKS.get(key);
    if (!exists) {
      return key;
    }
  }
}
