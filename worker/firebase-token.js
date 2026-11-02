/**
 * **A Firebase session, handed to somebody who just proved a passkey.**
 *
 * Firebase has no passkey of its own, so when a passkey checks out it is this Worker that says
 * who the traveller is. Firebase will not take our word for it either: it wants a token signed
 * with the project's own service account key. That key lives in one place only, a Worker secret
 * called `FIREBASE_SERVICE_ACCOUNT`, and never in this repository.
 *
 * Nothing else on the site uses it. Signing in with Google, a password or a link goes through
 * Firebase directly and needs none of this. If the secret is missing, passkeys simply report that
 * they are not switched on yet, and everything else keeps working.
 */

/** Where a custom token is addressed. Fixed by Google, not a choice. */
const AUDIENCE =
  'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit';

/** A custom token may live for at most an hour. This one is spent within seconds. */
const LIFETIME_SECONDS = 60 * 60;

function bytesToBase64Url(bytes) {
  let binary = '';
  const view = new Uint8Array(bytes);
  for (let index = 0; index < view.length; index += 1) binary += String.fromCharCode(view[index]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function jsonToBase64Url(value) {
  return bytesToBase64Url(new TextEncoder().encode(JSON.stringify(value)));
}

/** True when this Worker was given a usable service account key. */
export function signingConfigured(env) {
  const raw = env.FIREBASE_SERVICE_ACCOUNT;
  if (typeof raw !== 'string' || raw.trim().length === 0) return false;
  try {
    const account = JSON.parse(raw);
    return typeof account.client_email === 'string' && typeof account.private_key === 'string';
  } catch {
    return false;
  }
}

function pemToBytes(pem) {
  const body = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

/*
 * **The imported key is kept between requests.** Importing an RSA key is the expensive part of
 * signing one token, and a Worker instance answers many requests before it is recycled. The id
 * alongside it is what makes a rotation safe: a different key means a different id, so the stale
 * key is dropped rather than used.
 */
let cachedKey = null;
let cachedId = '';

async function signingKey(account) {
  const id = `${account.private_key_id ?? ''}:${account.client_email}`;
  if (cachedKey !== null && cachedId === id) return cachedKey;
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToBytes(account.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  cachedKey = key;
  cachedId = id;
  return key;
}

/**
 * Mint a custom token for one person. `uid` is the account's own id: an existing one when a
 * passkey is being added, or a freshly made one when the passkey is the whole account.
 */
export async function mintCustomToken(env, uid, name) {
  const account = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  if (typeof account.private_key_id === 'string') header.kid = account.private_key_id;

  const claims = {
    iss: account.client_email,
    sub: account.client_email,
    aud: AUDIENCE,
    iat: now,
    exp: now + LIFETIME_SECONDS,
    uid,
  };
  const displayName = typeof name === 'string' ? name.trim().slice(0, 60) : '';
  if (displayName.length > 0) claims.name = displayName;

  const unsigned = `${jsonToBase64Url(header)}.${jsonToBase64Url(claims)}`;
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    await signingKey(account),
    new TextEncoder().encode(unsigned),
  );
  return `${unsigned}.${bytesToBase64Url(signature)}`;
}
