/**
 * **Passkeys, checked in the Worker rather than trusted from the browser.**
 *
 * A passkey is a key pair the traveller's phone or computer makes and keeps. The browser shows a
 * face, a fingerprint or a PIN, and hands back a signed answer. That answer is worthless until the
 * server checks it against the public half of the key it stored the first time, so every check
 * below is done here: the signature, the challenge that was issued minutes earlier, the address
 * the key was made for, and the counter that tells a copied key from a real one.
 *
 * Four things are kept in the database and nothing else:
 *
 *   - the credential id, which is what the phone names the key by;
 *   - the public key, so a signature can be checked;
 *   - the counter and the backup flag, which say how the key behaves;
 *   - whose account it belongs to, and the label they gave the device.
 *
 * A challenge is a short-lived row: made when the browser asks to start, deleted the moment it is
 * used, and refused after five minutes. That is what stops an old answer from being replayed.
 */

import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import { identify } from './auth.js';
import { mintCustomToken, signingConfigured } from './firebase-token.js';
import { turnstilePassed } from './turnstile.js';

const RP_NAME = 'OVVO';

/** Five devices is already generous for one account, and the label list stays readable. */
const MAX_PASSKEYS = 5;

/** A challenge is good for five minutes, which is one prompt on a phone. */
const CHALLENGE_MS = 5 * 60 * 1000;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

function bytesToBase64Url(bytes) {
  let binary = '';
  const view = new Uint8Array(bytes);
  for (let index = 0; index < view.length; index += 1) binary += String.fromCharCode(view[index]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(part) {
  const padded = part.length % 4 === 0 ? part : part + '='.repeat(4 - (part.length % 4));
  const binary = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

async function readJson(request) {
  try {
    const body = await request.json();
    return body !== null && typeof body === 'object' ? body : {};
  } catch {
    return {};
  }
}

/**
 * **The address a passkey is allowed to have been made on.**
 *
 * The request's own origin is the answer, and in production that is the only one. Development and
 * preview sit behind a proxy that talks plain HTTP to this Worker while the browser is on HTTPS,
 * so the secure form of the same host is accepted as well: same host, same site, the stricter
 * scheme. Nothing else is ever on the list, which is what keeps an answer made for another site
 * from being accepted here.
 */
function expectedOrigins(url) {
  const origins = [url.origin];
  if (url.protocol === 'http:') origins.push(`https://${url.host}`);
  return origins;
}

function transportsOf(row) {
  if (typeof row.transports !== 'string' || row.transports.length === 0) return undefined;
  return row.transports.split(',').filter((part) => part.length > 0);
}

async function passkeysOf(env, uid) {
  const result = await env.DB.prepare(
    'SELECT id, name, transports, created_at, last_used_at FROM passkey WHERE uid = ?1 ORDER BY created_at',
  )
    .bind(uid)
    .all();
  return result.results ?? [];
}

async function forgetChallenge(env, id) {
  await env.DB.prepare('DELETE FROM passkey_challenge WHERE id = ?1').bind(id).run();
}

async function rememberChallenge(env, challenge, kind, uid, name) {
  const id = crypto.randomUUID();
  const now = Date.now();
  await env.DB.prepare(
    'INSERT INTO passkey_challenge (id, challenge, kind, uid, name, expires_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)',
  )
    .bind(id, challenge, kind, uid, name, now + CHALLENGE_MS)
    .run();
  /* Old rows are swept on the way past rather than by a timer: nothing else needs a clock here. */
  await env.DB.prepare('DELETE FROM passkey_challenge WHERE expires_at < ?1').bind(now).run();
  return id;
}

async function challengeOf(env, id) {
  if (typeof id !== 'string' || id.length === 0) return null;
  const row = await env.DB.prepare(
    'SELECT id, challenge, kind, uid, name, expires_at FROM passkey_challenge WHERE id = ?1',
  )
    .bind(id)
    .first();
  if (!row) return null;
  if (row.expires_at < Date.now()) {
    await forgetChallenge(env, row.id);
    return null;
  }
  return row;
}

/* ---------------------------------------------------------------- adding a passkey */

/**
 * **Start adding a passkey: to an account that is already signed in, or as a new account.**
 *
 * With a bearer token this is an existing traveller adding a device. Without one it is a new
 * account whose only key is the passkey itself, and the account id is made here so the passkey is
 * never left pointing at nothing.
 */
async function registerOptions(request, env, url, claims) {
  const body = await readJson(request);
  const displayName = typeof body.name === 'string' ? body.name.trim().slice(0, 60) : '';
  const signedIn = claims !== null;
  /*
   * **A passkey is only worth making when it can sign you in.** The site reports passkeys as off
   * until the service account key is in place, so nothing may be registered before then either.
   * Otherwise a traveller ends up with a real key on the device, a list that says the feature is
   * off, and a sign-in button that is nowhere to be seen.
   */
  if (!signingConfigured(env)) return json({ error: 'not-configured' }, 503);

  /*
   * **A new account passes the bot check first.** It is the only door that asks the traveller for
   * nothing at all, which is exactly why it is worth scripting: every other way in costs an email
   * or a password first. Adding a device to an account already signed in sits behind that account,
   * so it is not asked again.
   */
  if (!signedIn) {
    const passed = await turnstilePassed(
      env,
      body.turnstileToken,
      request.headers.get('cf-connecting-ip'),
    );
    if (!passed) return json({ error: 'turnstile' }, 403);
  }

  let uid;
  let userName;
  let userDisplayName;
  const kind = signedIn ? 'add' : 'new';

  if (signedIn) {
    uid = claims.uid;
    userName = claims.email ?? claims.name ?? uid;
    userDisplayName = claims.name ?? claims.email ?? 'OVVO traveller';
    const existing = await passkeysOf(env, uid);
    if (existing.length >= MAX_PASSKEYS) return json({ error: 'limit' }, 409);
  } else {
    if (displayName.length === 0) return json({ error: 'name' }, 400);
    uid = crypto.randomUUID();
    userName = displayName;
    userDisplayName = displayName;
  }

  const existing = await passkeysOf(env, uid);
  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: url.hostname,
    userName,
    userDisplayName,
    userID: new TextEncoder().encode(uid),
    attestationType: 'none',
    excludeCredentials: existing.map((row) => ({
      id: row.id,
      transports: transportsOf(row),
    })),
    /*
     * A discoverable key is what makes signing in possible without typing anything first: the
     * phone offers the key by itself, and the server learns who it is from the key. A passkey that
     * is not discoverable could only be used by somebody who already knew the account.
     */
    authenticatorSelection: { residentKey: 'required', userVerification: 'preferred' },
  });

  const id = await rememberChallenge(env, options.challenge, kind, uid, signedIn ? '' : displayName);
  return json({ id, options });
}

/**
 * **Finish adding a passkey.** The browser's answer is checked against the challenge that was
 * issued, so an answer for another site or another moment cannot be pasted in.
 */
async function registerVerify(request, env, url, claims) {
  const body = await readJson(request);
  const row = await challengeOf(env, body.id);
  if (!row || (row.kind !== 'add' && row.kind !== 'new')) return json({ error: 'challenge' }, 400);

  if (row.kind === 'add' && (claims === null || claims.uid !== row.uid)) {
    return json({ error: 'unauthorized' }, 401);
  }
  if (row.kind === 'new' && claims !== null) return json({ error: 'unauthorized' }, 401);

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: body.response,
      expectedChallenge: row.challenge,
      expectedOrigin: expectedOrigins(url),
      expectedRPID: url.hostname,
    });
  } catch (error) {
    console.error('[passkey] registration refused', error);
    return json({ error: 'verify' }, 400);
  }
  if (!verification.verified || !verification.registrationInfo) return json({ error: 'verify' }, 400);

  const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
  const label =
    typeof body.label === 'string' && body.label.trim().length > 0
      ? body.label.trim().slice(0, 40)
      : 'This device';

  await env.DB.prepare(
    `INSERT OR REPLACE INTO passkey
       (id, uid, name, public_key, counter, transports, device_type, backed_up, created_at, last_used_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, NULL)`,
  )
    .bind(
      credential.id,
      row.uid,
      label,
      bytesToBase64Url(credential.publicKey),
      credential.counter ?? 0,
      Array.isArray(credential.transports) ? credential.transports.join(',') : '',
      credentialDeviceType ?? 'singleDevice',
      credentialBackedUp ? 1 : 0,
      new Date().toISOString(),
    )
    .run();

  await forgetChallenge(env, row.id);

  if (row.kind !== 'new') return json({ ok: true, id: credential.id });

  if (!signingConfigured(env)) return json({ error: 'not-configured' }, 503);
  try {
    const customToken = await mintCustomToken(env, row.uid, row.name);
    return json({ ok: true, id: credential.id, customToken });
  } catch (error) {
    console.error('[passkey] custom token failed', error);
    return json({ error: 'not-configured' }, 503);
  }
}

/* ------------------------------------------------------------- signing in with one */

/**
 * **Nothing is asked before the key is offered.** No email box, no account name: the phone shows
 * the passkeys it holds for this site and the server works out whose account it is from the key
 * that comes back.
 */
async function signInOptions(env, url) {
  if (!signingConfigured(env)) return json({ error: 'not-configured' }, 503);
  const options = await generateAuthenticationOptions({
    rpID: url.hostname,
    userVerification: 'preferred',
  });
  const id = await rememberChallenge(env, options.challenge, 'signin', null, null);
  return json({ id, options });
}

async function signInVerify(request, env, url) {
  const body = await readJson(request);
  const row = await challengeOf(env, body.id);
  if (!row || row.kind !== 'signin') return json({ error: 'challenge' }, 400);

  const credentialId = typeof body.response?.id === 'string' ? body.response.id : '';
  const stored = await env.DB.prepare(
    'SELECT id, uid, public_key, counter, transports FROM passkey WHERE id = ?1',
  )
    .bind(credentialId)
    .first();
  if (!stored) return json({ error: 'unknown' }, 400);

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: body.response,
      expectedChallenge: row.challenge,
      expectedOrigin: expectedOrigins(url),
      expectedRPID: url.hostname,
      credential: {
        id: stored.id,
        publicKey: base64UrlToBytes(stored.public_key),
        counter: stored.counter,
        transports: transportsOf(stored),
      },
    });
  } catch (error) {
    console.error('[passkey] sign-in refused', error);
    return json({ error: 'verify' }, 400);
  }
  if (!verification.verified) return json({ error: 'verify' }, 400);

  /*
   * **The counter is written from the answer, not from what we had.** A key that is copied to a
   * second device can end up behind its own count, and the check inside the library is what makes
   * that visible. Storing the new value keeps the next sign-in honest.
   */
  await env.DB.prepare('UPDATE passkey SET counter = ?2, last_used_at = ?3 WHERE id = ?1')
    .bind(stored.id, verification.authenticationInfo.newCounter, new Date().toISOString())
    .run();
  await forgetChallenge(env, row.id);

  try {
    const customToken = await mintCustomToken(env, stored.uid);
    return json({ ok: true, customToken });
  } catch (error) {
    console.error('[passkey] custom token failed', error);
    return json({ error: 'not-configured' }, 503);
  }
}

/* ------------------------------------------------------------------- the routes */

export async function passkeyRoute(request, env, url) {
  if (url.pathname === '/api/passkey/status' && request.method === 'GET') {
    return json({ available: signingConfigured(env), max: MAX_PASSKEYS });
  }

  const claims = await identify(request, env);

  if (url.pathname === '/api/passkey/list' && request.method === 'GET') {
    if (!claims) return json({ error: 'unauthorized' }, 401);
    const rows = await passkeysOf(env, claims.uid);
    return json({
      max: MAX_PASSKEYS,
      passkeys: rows.map((row) => ({
        id: row.id,
        name: row.name,
        addedAt: row.created_at,
        lastUsedAt: row.last_used_at,
      })),
    });
  }

  if (url.pathname === '/api/passkey/register/options' && request.method === 'POST') {
    return registerOptions(request, env, url, claims);
  }

  if (url.pathname === '/api/passkey/register/verify' && request.method === 'POST') {
    return registerVerify(request, env, url, claims);
  }

  if (url.pathname === '/api/passkey/signin/options' && request.method === 'POST') {
    return signInOptions(env, url);
  }

  if (url.pathname === '/api/passkey/signin/verify' && request.method === 'POST') {
    return signInVerify(request, env, url);
  }

  if (url.pathname === '/api/passkey/remove' && request.method === 'POST') {
    if (!claims) return json({ error: 'unauthorized' }, 401);
    const body = await readJson(request);
    const id = typeof body.id === 'string' ? body.id : '';
    if (id.length === 0) return json({ error: 'id' }, 400);
    await env.DB.prepare('DELETE FROM passkey WHERE id = ?1 AND uid = ?2')
      .bind(id, claims.uid)
      .run();
    return json({ ok: true });
  }

  /* Called while an account is being deleted, so no passkey is left pointing at nothing. */
  if (url.pathname === '/api/passkey/erase' && request.method === 'POST') {
    if (!claims) return json({ error: 'unauthorized' }, 401);
    await env.DB.prepare('DELETE FROM passkey WHERE uid = ?1').bind(claims.uid).run();
    return json({ ok: true });
  }

  return json({ error: 'not-found' }, 404);
}
