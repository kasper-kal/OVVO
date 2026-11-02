/**
 * **Passkeys, from the page's side.**
 *
 * The browser makes the key and shows the face, the fingerprint or the PIN. Everything here is
 * bookkeeping around that: ask the Worker for the question, hand the question to the browser, hand
 * the answer back, and turn the answer into either an added passkey or a signed-in account.
 *
 * One thing is deliberately not here: any decision about who the traveller is. That is checked in
 * the Worker, against the public key it stored, and the browser is never believed.
 */

import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
import { signInWithCustomToken, updateProfile, type UserCredential } from 'firebase/auth';
import { auth } from './firebase';

export type PasskeyInfo = { id: string; name: string; addedAt: string; lastUsedAt: string | null };

/** True when this browser can make and use a passkey at all. */
export function passkeysSupported(): boolean {
  return typeof window !== 'undefined' && typeof window.PublicKeyCredential === 'function';
}

/** A failure that carries the reason the Worker gave, so the screen can say something useful. */
function fail(code: string): never {
  const error = new Error(code);
  error.name = 'PasskeyError';
  throw error;
}

function needAuth() {
  const instance = auth();
  if (!instance) fail('passkey/unavailable');
  return instance;
}

async function bearer(): Promise<string> {
  const user = auth()?.currentUser;
  if (!user) fail('passkey/signed-out');
  return user.getIdToken();
}

async function post<T>(path: string, body: unknown, signedIn: boolean): Promise<T> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (signedIn) headers.authorization = `Bearer ${await bearer()}`;
  let response: Response;
  try {
    response = await fetch(path, { method: 'POST', headers, body: JSON.stringify(body) });
  } catch {
    fail('passkey/network');
  }
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) fail(data.error ? `passkey/${data.error}` : 'passkey/failed');
  return data;
}

/** Whether the site has passkeys switched on, and how many devices one account may have. */
export async function passkeyStatus(): Promise<{ available: boolean; max: number }> {
  try {
    const response = await fetch('/api/passkey/status', { headers: { accept: 'application/json' } });
    if (!response.ok) return { available: false, max: 0 };
    const body = (await response.json()) as { available?: boolean; max?: number };
    return { available: Boolean(body.available), max: typeof body.max === 'number' ? body.max : 5 };
  } catch {
    return { available: false, max: 0 };
  }
}

/*
 * **Asking the browser for a key, with a sentence when it cannot.**
 *
 * A cancelled prompt is not a fault: it is somebody changing their mind, and it must read like
 * that rather than like an error code. The two names below are the browser's own, and both mean
 * the same thing to a traveller: nothing was made, nothing was signed in.
 */
function browserRefusal(error: unknown): never {
  const name = (error as { name?: string } | null)?.name ?? '';
  if (name === 'NotAllowedError' || name === 'AbortError') fail('passkey/cancelled');
  if (name === 'InvalidStateError') fail('passkey/exists');
  if (name === 'NotSupportedError' || name === 'SecurityError') fail('passkey/unsupported');
  fail('passkey/failed');
}

type Options = { id: string; options: unknown };

/** Add a passkey to the account that is signed in now. */
export async function addPasskey(label: string): Promise<void> {
  const start = await post<Options>('/api/passkey/register/options', {}, true);
  let response: unknown;
  try {
    response = await startRegistration({ optionsJSON: start.options as never });
  } catch (error) {
    browserRefusal(error);
  }
  await post('/api/passkey/register/verify', { id: start.id, response, label }, true);
}

/**
 * **Make a new account whose only key is the passkey on this device.**
 *
 * No email and no password, so there is nothing to wait for in an inbox. The name is asked once,
 * because an account with no name cannot be recognised in the list of devices later.
 */
export async function createAccountWithPasskey(firstName: string, lastName: string): Promise<void> {
  const name = [firstName.trim(), lastName.trim()].filter((part) => part.length > 0).join(' ');
  if (name.length === 0) fail('passkey/name');

  const start = await post<Options>('/api/passkey/register/options', { name }, false);
  let response: unknown;
  try {
    response = await startRegistration({ optionsJSON: start.options as never });
  } catch (error) {
    browserRefusal(error);
  }
  const done = await post<{ customToken?: string }>(
    '/api/passkey/register/verify',
    { id: start.id, response, label: 'This device' },
    false,
  );
  if (!done.customToken) fail('passkey/failed');

  const credential: UserCredential = await signInWithCustomToken(needAuth(), done.customToken);
  /*
   * The name travels inside the token, and Firebase adopts it on the way in. This is the belt to
   * that pair of braces: if the account arrives without a name for any reason, it is set here, so
   * the traveller is never shown a blank line where their name should be.
   */
  if (!credential.user.displayName) await updateProfile(credential.user, { displayName: name });
}

/**
 * **Sign in with a passkey that is already on this device, or one the system offers.**
 *
 * Nothing is typed first. On a new phone the system either has the key already, through iCloud or
 * Google, or offers a code to scan with the old phone, and both of those are the phone's own work
 * rather than ours. What comes back here is only ever the answer to our question.
 */
export async function signInWithPasskey(): Promise<void> {
  const start = await post<Options>('/api/passkey/signin/options', {}, false);
  let response: unknown;
  try {
    response = await startAuthentication({ optionsJSON: start.options as never });
  } catch (error) {
    browserRefusal(error);
  }
  const done = await post<{ customToken?: string }>(
    '/api/passkey/signin/verify',
    { id: start.id, response },
    false,
  );
  if (!done.customToken) fail('passkey/failed');
  await signInWithCustomToken(needAuth(), done.customToken);
}

/** The passkeys this account holds, newest last. */
export async function listPasskeys(): Promise<{ max: number; passkeys: PasskeyInfo[] }> {
  let response: Response;
  try {
    response = await fetch('/api/passkey/list', {
      headers: { authorization: `Bearer ${await bearer()}`, accept: 'application/json' },
    });
  } catch {
    fail('passkey/network');
  }
  if (!response.ok) fail('passkey/list');
  const body = (await response.json()) as { max?: number; passkeys?: PasskeyInfo[] };
  return { max: typeof body.max === 'number' ? body.max : 5, passkeys: body.passkeys ?? [] };
}

export async function removePasskey(id: string): Promise<void> {
  await post('/api/passkey/remove', { id }, true);
}

/** Called while an account is being deleted, so no passkey is left behind on the server. */
export async function forgetAllPasskeys(): Promise<void> {
  if (!auth()?.currentUser) return;
  try {
    await post('/api/passkey/erase', {}, true);
  } catch {
    /* the account is going anyway; a leftover row points at nothing */
  }
}

/** Turns a failure above into a sentence somebody can act on. */
export function explainPasskeyError(error: unknown): string {
  const code = error instanceof Error && error.name === 'PasskeyError' ? error.message : '';
  switch (code) {
    case 'passkey/not-configured':
      return 'Passkeys are not switched on for this site yet. Use Google, a password or a sign-in link.';
    case 'passkey/cancelled':
      return 'That was cancelled. Nothing was changed.';
    case 'passkey/unsupported':
      return 'This browser cannot make a passkey. Try another browser, or sign in the usual way.';
    case 'passkey/exists':
      return 'This device already has a passkey for your OVVO ID.';
    case 'passkey/limit':
      return 'You already have the most passkeys allowed. Remove one before adding another.';
    case 'passkey/challenge':
    case 'passkey/verify':
      return 'That passkey did not check out. Try again.';
    case 'passkey/unknown':
      return 'This device has no passkey for OVVO. Sign in the usual way, then add one.';
    case 'passkey/signed-out':
      return 'Sign in first, then add a passkey.';
    case 'passkey/network':
      return 'Network error. Check your connection.';
    case 'passkey/name':
      return 'Enter your name first.';
    default:
      return 'That did not work. Please try again.';
  }
}
