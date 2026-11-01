/**
 * **Checking a Firebase sign-in token inside the Worker, without the Admin SDK.**
 *
 * The browser gets a signed token from Firebase when somebody signs in. The Worker cannot take
 * the browser's word for who that is, so it checks the signature itself: Google publishes the
 * public half of the signing key, the token says which key signed it, and the maths either holds
 * or it does not. No secret is stored on the server for this, which is why the Admin SDK is not
 * needed — it would add megabytes to a Worker for one checked signature.
 *
 * Three things are checked, and each one closes a real hole:
 *
 *   - **the signature**, so a token cannot be written by hand;
 *   - **`aud`**, the project it was made for, so a token from somebody else's Firebase project is
 *     not accepted here;
 *   - **`exp`**, so an old token found in a log cannot be replayed for ever.
 *
 * The keys are kept in memory for an hour. Google rotates them rarely, and a rotation costs one
 * extra request rather than a failure: an unknown key id triggers a fresh fetch.
 */

const CERTS_URL =
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

/** How long a fetched key set is trusted, in milliseconds. */
const KEY_TTL_MS = 60 * 60 * 1000;

/** Tokens are valid for an hour; this in-memory cache follows the same rhythm. */
const CLOCK_SKEW_SECONDS = 60;

let cached = { keys: null, fetchedAt: 0 };

/** Base64url to bytes — the token's three parts are all base64url, not base64. */
function base64UrlToBytes(part) {
  const padded = part.length % 4 === 0 ? part : part + '='.repeat(4 - (part.length % 4));
  const normal = padded.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(normal);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function decodeJson(part) {
  return JSON.parse(new TextDecoder().decode(base64UrlToBytes(part)));
}

/**
 * The public keys, by key id.
 *
 * `force` is for the one case that matters: a token naming a key we have never seen. That is what
 * a rotation looks like from here, and refetching turns "everyone is signed out until the cache
 * expires" into one extra request.
 */
async function signingKeys(force = false) {
  const fresh = cached.keys && Date.now() - cached.fetchedAt < KEY_TTL_MS;
  if (fresh && !force) return cached.keys;

  const response = await fetch(CERTS_URL);
  if (!response.ok) throw new Error(`certificates answered ${response.status}`);
  const body = await response.json();

  const keys = new Map();
  for (const jwk of body.keys ?? []) {
    const key = await crypto.subtle.importKey(
      'jwk',
      { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256', ext: true },
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify'],
    );
    keys.set(jwk.kid, key);
  }
  cached = { keys, fetchedAt: Date.now() };
  return keys;
}

/**
 * Verify a token and return who it belongs to, or `null`.
 *
 * Returning `null` rather than throwing keeps the caller honest: every refusal looks the same from
 * outside, and no error message tells a stranger which of the four checks they failed.
 */
export async function verifyIdToken(token, projectId) {
  if (typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  let header;
  let payload;
  try {
    header = decodeJson(parts[0]);
    payload = decodeJson(parts[1]);
  } catch {
    return null;
  }

  if (header.alg !== 'RS256' || typeof header.kid !== 'string') return null;

  let key = (await signingKeys()).get(header.kid);
  if (!key) key = (await signingKeys(true)).get(header.kid);
  if (!key) return null;

  let valid = false;
  try {
    valid = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      key,
      base64UrlToBytes(parts[2]),
      new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
    );
  } catch {
    return null;
  }
  if (!valid) return null;

  const now = Math.floor(Date.now() / 1000);
  if (payload.aud !== projectId) return null;
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) return null;
  if (typeof payload.exp !== 'number' || payload.exp + CLOCK_SKEW_SECONDS < now) return null;
  if (typeof payload.iat === 'number' && payload.iat - CLOCK_SKEW_SECONDS > now) return null;
  if (typeof payload.sub !== 'string' || payload.sub.length === 0) return null;

  return {
    uid: payload.sub,
    email: typeof payload.email === 'string' ? payload.email : null,
    name: typeof payload.name === 'string' ? payload.name : null,
  };
}
