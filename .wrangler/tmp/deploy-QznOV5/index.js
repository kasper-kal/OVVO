var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker/auth.js
var CERTS_URL = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";
var KEY_TTL_MS = 60 * 60 * 1e3;
var CLOCK_SKEW_SECONDS = 60;
var cached = { keys: null, fetchedAt: 0 };
function base64UrlToBytes(part) {
  const padded = part.length % 4 === 0 ? part : part + "=".repeat(4 - part.length % 4);
  const normal = padded.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(normal);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}
__name(base64UrlToBytes, "base64UrlToBytes");
function decodeJson(part) {
  return JSON.parse(new TextDecoder().decode(base64UrlToBytes(part)));
}
__name(decodeJson, "decodeJson");
async function signingKeys(force = false) {
  const fresh = cached.keys && Date.now() - cached.fetchedAt < KEY_TTL_MS;
  if (fresh && !force) return cached.keys;
  const response = await fetch(CERTS_URL);
  if (!response.ok) throw new Error(`certificates answered ${response.status}`);
  const body = await response.json();
  const keys = /* @__PURE__ */ new Map();
  for (const jwk of body.keys ?? []) {
    const key = await crypto.subtle.importKey(
      "jwk",
      { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: "RS256", ext: true },
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"]
    );
    keys.set(jwk.kid, key);
  }
  cached = { keys, fetchedAt: Date.now() };
  return keys;
}
__name(signingKeys, "signingKeys");
async function verifyIdToken(token, projectId) {
  if (typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  let header;
  let payload;
  try {
    header = decodeJson(parts[0]);
    payload = decodeJson(parts[1]);
  } catch {
    return null;
  }
  if (header.alg !== "RS256" || typeof header.kid !== "string") return null;
  let key = (await signingKeys()).get(header.kid);
  if (!key) key = (await signingKeys(true)).get(header.kid);
  if (!key) return null;
  let valid = false;
  try {
    valid = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      key,
      base64UrlToBytes(parts[2]),
      new TextEncoder().encode(`${parts[0]}.${parts[1]}`)
    );
  } catch {
    return null;
  }
  if (!valid) return null;
  const now = Math.floor(Date.now() / 1e3);
  if (payload.aud !== projectId) return null;
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) return null;
  if (typeof payload.exp !== "number" || payload.exp + CLOCK_SKEW_SECONDS < now) return null;
  if (typeof payload.iat === "number" && payload.iat - CLOCK_SKEW_SECONDS > now) return null;
  if (typeof payload.sub !== "string" || payload.sub.length === 0) return null;
  return {
    uid: payload.sub,
    email: typeof payload.email === "string" ? payload.email : null,
    name: typeof payload.name === "string" ? payload.name : null
  };
}
__name(verifyIdToken, "verifyIdToken");

// worker/index.js
var MAX_DOC_BYTES = 200 * 1024;
var json = /* @__PURE__ */ __name((body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
}), "json");
function crossOrigin(request, url) {
  const origin = request.headers.get("origin");
  return origin !== null && origin !== url.origin;
}
__name(crossOrigin, "crossOrigin");
async function identify(request, env) {
  const header = request.headers.get("authorization") ?? "";
  if (!header.toLowerCase().startsWith("bearer ")) return null;
  const token = header.slice(7).trim();
  if (token.length === 0) return null;
  try {
    return await verifyIdToken(token, env.FIREBASE_PROJECT_ID || "ovvo-vibecreations");
  } catch (error) {
    console.error("[api] token check failed", error);
    return null;
  }
}
__name(identify, "identify");
async function readProfile(env, uid) {
  const row = await env.DB.prepare(
    "SELECT email, doc, rev, updated_at FROM travel_sync WHERE uid = ?1"
  ).bind(uid).first();
  if (!row) return { rev: 0, doc: {}, updatedAt: null, email: null };
  let doc = {};
  try {
    doc = JSON.parse(row.doc);
  } catch {
    doc = {};
  }
  return { rev: row.rev, doc, updatedAt: row.updated_at, email: row.email };
}
__name(readProfile, "readProfile");
async function saveProfile(request, env, claims) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "body" }, 400);
  }
  if (!body || typeof body !== "object" || typeof body.doc !== "object" || body.doc === null) {
    return json({ error: "doc" }, 400);
  }
  const doc = JSON.stringify(body.doc);
  if (new TextEncoder().encode(doc).length > MAX_DOC_BYTES) return json({ error: "too-big" }, 413);
  const baseRev = Number.isFinite(body.baseRev) ? Math.max(0, Math.trunc(body.baseRev)) : 0;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const current = await readProfile(env, claims.uid);
  if (current.rev === 0) {
    if (baseRev !== 0) return json({ error: "stale", ...current }, 409);
    await env.DB.prepare(
      "INSERT INTO travel_sync (uid, email, doc, rev, updated_at) VALUES (?1, ?2, ?3, 1, ?4)"
    ).bind(claims.uid, claims.email, doc, now).run();
    return json({ rev: 1, doc: body.doc, updatedAt: now });
  }
  if (baseRev !== current.rev) return json({ error: "stale", ...current }, 409);
  await env.DB.prepare(
    "UPDATE travel_sync SET doc = ?2, email = ?3, rev = rev + 1, updated_at = ?4 WHERE uid = ?1 AND rev = ?5"
  ).bind(claims.uid, doc, claims.email, now, current.rev).run();
  const after = await readProfile(env, claims.uid);
  return json(after);
}
__name(saveProfile, "saveProfile");
async function api(request, env, url) {
  if (url.pathname === "/api/health") return json({ ok: true });
  if (request.method !== "GET" && request.method !== "HEAD" && crossOrigin(request, url)) {
    return json({ error: "origin" }, 403);
  }
  const claims = await identify(request, env);
  if (!claims) return json({ error: "unauthorized" }, 401);
  if (url.pathname === "/api/me" && request.method === "GET") {
    const profile = await readProfile(env, claims.uid);
    return json({
      uid: claims.uid,
      email: claims.email,
      rev: profile.rev,
      doc: profile.doc,
      updatedAt: profile.updatedAt
    });
  }
  if (url.pathname === "/api/sync" && request.method === "PUT") {
    return saveProfile(request, env, claims);
  }
  if (url.pathname === "/api/sync" && request.method === "DELETE") {
    await env.DB.prepare("DELETE FROM travel_sync WHERE uid = ?1").bind(claims.uid).run();
    return json({ rev: 0, doc: {} });
  }
  return json({ error: "not-found" }, 404);
}
__name(api, "api");
var index_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      try {
        return await api(request, env, url);
      } catch (error) {
        console.error("[api]", error);
        return json({ error: "server" }, 500);
      }
    }
    return env.ASSETS.fetch(request);
  }
};
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
