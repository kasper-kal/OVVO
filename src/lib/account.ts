/**
 * **The account, and the small amount of work it takes to carry a traveller's things to another
 * device.**
 *
 * Everything OVVO remembers already lives in this browser under one prefix (`lib/storage`). When
 * somebody signs in, that same handful of values is sent to the server as a single document and
 * read back on the next phone, so a saved journey or a year of Wrapped is not left behind when a
 * browser is cleared.
 *
 * Three rules keep it honest:
 *
 *   - **The account is the copy that counts, once a device has met it.** A device that has never
 *     synced keeps what it has and the gaps are filled from the account, so signing in cannot empty
 *     a phone that was already in use. From then on, when the account has moved on, this device
 *     adopts it whole: a favourite removed on the other phone is removed here too, instead of being
 *     quietly pushed back to the server on the next save.
 *   - **A save is never a blind overwrite.** Every save names the revision it was built on, so a
 *     second device arriving a second late is told to merge rather than allowed to erase.
 *   - **Nothing is sent until somebody signs in.** Signed out, the app is exactly what it was: a
 *     local app with no account and no traffic.
 */

import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  deleteUser,
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendSignInLinkToEmail,
  signInWithEmailAndPassword,
  signInWithEmailLink,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { auth } from './firebase';
import { STORAGE_PREFIX, announceStored, onStoredChange } from './storage';

/** Where the address for a half-finished email-link sign-in is kept, while the mail is in flight. */
const LINK_EMAIL_KEY = STORAGE_PREFIX + 'account-email';

/** The revision of the server's copy this browser last read or wrote. Never sent as content. */
const REV_KEY = STORAGE_PREFIX + 'cloud-rev';

function needAuth() {
  const instance = auth();
  if (!instance) throw new Error('no-firebase');
  return instance;
}

/* ------------------------------------------------------------------ the account */

export function watchAccount(next: (user: User | null) => void): () => void {
  const instance = auth();
  if (!instance) {
    next(null);
    return () => {};
  }
  return onAuthStateChanged(instance, next);
}

export async function signInWithGoogle(): Promise<void> {
  await signInWithPopup(needAuth(), new GoogleAuthProvider());
}

export async function signInWithPassword(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(needAuth(), email.trim(), password);
}

/**
 * **Making an account asks a name, because a name is what the account is for.**
 *
 * The first name is required and the second is not, exactly as asked. Both go into the account's
 * own display name rather than into a table of ours: Firebase keeps it with the account, so it
 * follows the traveller to the next device without a column, a migration or a second place to keep
 * it in step.
 */
export async function createAccount(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
): Promise<void> {
  const credential = await createUserWithEmailAndPassword(needAuth(), email.trim(), password);
  const name = [firstName.trim(), lastName.trim()].filter((part) => part.length > 0).join(' ');
  if (name.length > 0) await updateProfile(credential.user, { displayName: name });
}

export async function sendResetMail(email: string): Promise<void> {
  await sendPasswordResetEmail(needAuth(), email.trim());
}

/**
 * **A sign-in link in the post, instead of a password to remember.**
 *
 * The address it comes back to has to be on the site itself and has to be listed in Firebase, so
 * the mail points at `/auth/finish` on the deployed address, which is the page that completes the
 * sign-in (`pages/AuthFinishPage`).
 */
export async function sendSignInLink(email: string): Promise<void> {
  const address = email.trim();
  await sendSignInLinkToEmail(needAuth(), address, {
    url: `${window.location.origin}/auth/finish`,
    handleCodeInApp: true,
  });
  try {
    window.localStorage.setItem(LINK_EMAIL_KEY, address);
  } catch {
    /* the finish page asks for the address again if this fails */
  }
}

export function isEmailLinkHere(): boolean {
  const instance = auth();
  return instance ? isSignInWithEmailLink(instance, window.location.href) : false;
}

export function rememberedLinkEmail(): string {
  try {
    return window.localStorage.getItem(LINK_EMAIL_KEY) ?? '';
  } catch {
    return '';
  }
}

export async function finishEmailLink(email: string): Promise<void> {
  await signInWithEmailLink(needAuth(), email.trim(), window.location.href);
  try {
    window.localStorage.removeItem(LINK_EMAIL_KEY);
  } catch {
    /* nothing to clean up */
  }
}

/**
 * **Deleting the account, in the order that cannot lose anything.**
 *
 * The copy on the server goes first and the account goes second. If the second step is refused -
 * Firebase demands a fresh sign-in for a deletion, which is the right rule - the traveller is told
 * to sign in again rather than being left with a half-deleted account and no explanation.
 */
export async function deleteAccount(): Promise<'ok' | 'recent-sign-in' | 'failed'> {
  const user = auth()?.currentUser;
  if (!user) return 'failed';

  await eraseRemote();
  try {
    await deleteUser(user);
    return 'ok';
  } catch (error) {
    const code = (error as { code?: string } | null)?.code ?? '';
    return code === 'auth/requires-recent-login' ? 'recent-sign-in' : 'failed';
  }
}

export async function signOutNow(): Promise<void> {
  const instance = auth();
  if (instance) await signOut(instance);
}

/** Turns Firebase's error codes into a sentence somebody can act on. */
export function explainAuthError(error: unknown): string {
  const code = (error as { code?: string } | null)?.code ?? '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password.';
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/missing-email':
      return 'Enter your email address.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Try again later.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Google sign-in was cancelled.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is disabled.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized for sign-in.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection.';
    case 'auth/invalid-action-code':
    case 'auth/expired-action-code':
      return 'This link is invalid or has expired.';
    case 'no-firebase':
      return 'Sign-in is unavailable in this build.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

/* ---------------------------------------------------------------- the sync itself */

export type CloudDoc = Record<string, unknown>;

/** Everything this browser remembers, as one document. Keys are the storage names. */
export function localDoc(): CloudDoc {
  const doc: CloudDoc = {};
  try {
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (!key || !key.startsWith(STORAGE_PREFIX)) continue;
      const name = key.slice(STORAGE_PREFIX.length);
      if (name === 'cloud-rev' || name === 'account-email') continue;
      const raw = window.localStorage.getItem(key);
      if (raw === null) continue;
      try {
        doc[name] = JSON.parse(raw);
      } catch {
        /* not a value this app wrote; leave it alone */
      }
    }
  } catch {
    /* storage unavailable */
  }
  return doc;
}

/**
 * The values that describe *this* device rather than the traveller: where they said the phone may
 * be, and whether they have already been asked about installing the app. They travel in the
 * document because it is the simplest thing to send, but they are never taken back from it - an
 * answer given on a tablet is not an answer given here.
 */
const DEVICE_ONLY = new Set(['location-consent', 'location-fix', 'approximate-location', 'install-asked']);

/**
 * **Read the account's copy into this browser**, either by filling gaps or by adopting it whole.
 *
 * `fill` is for the first connection: a device that has been used signed out keeps every answer it
 * already has. `adopt` is for a device that has synced before and is behind - the account is the
 * copy that counts, so a removed favourite stays removed instead of being resurrected by an old
 * local list on the next save.
 */
export function applyRemote(doc: CloudDoc, mode: 'fill' | 'adopt' = 'fill'): boolean {
  let changed = false;
  for (const [name, value] of Object.entries(doc)) {
    if (DEVICE_ONLY.has(name)) continue;
    const key = STORAGE_PREFIX + name;
    let existing: string | null = null;
    try {
      existing = window.localStorage.getItem(key);
    } catch {
      existing = null;
    }
    const next = JSON.stringify(value);
    if (mode === 'fill' && existing !== null) continue;
    if (existing === next) continue;
    try {
      window.localStorage.setItem(key, next);
      changed = true;
    } catch {
      /* full or blocked */
    }
  }
  if (changed) announceStored();
  return changed;
}

function saveRev(rev: number): void {
  try {
    window.localStorage.setItem(REV_KEY, JSON.stringify(rev));
  } catch {
    /* nothing depends on it being stored */
  }
}

/** The account's revision this browser last read or wrote, or `null` if it never has. */
function readRev(): number | null {
  try {
    const raw = window.localStorage.getItem(REV_KEY);
    return raw === null ? null : (JSON.parse(raw) as number);
  } catch {
    return null;
  }
}

async function call<T>(path: string, init: RequestInit, user: User): Promise<{ status: number; body: T }> {
  const token = await user.getIdToken();
  const response = await fetch(path, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
  });
  let body: T;
  try {
    body = (await response.json()) as T;
  } catch {
    body = {} as T;
  }
  return { status: response.status, body };
}

let syncing = false;

/**
 * One pass: read the server's copy, take from it whatever this browser is missing, then send
 * everything back. Running it after every local change is cheap — the document is a few
 * kilobytes — and it removes the question of whether something was saved.
 */
export async function syncNow(): Promise<'signed-out' | 'ok' | 'failed'> {
  const user = auth()?.currentUser;
  if (!user) return 'signed-out';
  if (syncing) return 'ok';
  syncing = true;
  try {
    const pulled = await call<{ rev: number; doc: CloudDoc }>('/api/me', { method: 'GET' }, user);
    if (pulled.status !== 200) return 'failed';

    const remote = pulled.body;
    const known = readRev();
    const serverRev = remote.rev ?? 0;
    /*
     * **Stale here, current there: the account wins.**
     *
     * A device that has synced before and is behind adopts the account's copy as it stands, which
     * is what makes a deletion on one phone a deletion everywhere. A device that has never synced
     * keeps its own answers and only has gaps filled, so the first sign-in cannot empty it.
     */
    applyRemote(remote.doc ?? {}, known !== null && serverRev > known ? 'adopt' : 'fill');

    const saved = await save(serverRev, user);
    return saved ? 'ok' : 'failed';
  } catch {
    return 'failed';
  } finally {
    syncing = false;
  }
}

async function save(baseRev: number, user: User): Promise<boolean> {
  const attempt = await call<{ rev: number; doc?: CloudDoc }>(
    '/api/sync',
    { method: 'PUT', body: JSON.stringify({ baseRev, doc: localDoc() }) },
    user,
  );
  if (attempt.status === 200) {
    saveRev(attempt.body.rev);
    return true;
  }
  if (attempt.status !== 409) return false;

  /*
   * **Somebody else wrote in between.** The server sends back the copy that won, so the gaps it
   * has are filled in here and the save is tried once more on top of its revision. Once, not in a
   * loop: a third writer is not a race this app needs to win, and a retry that never ends is worse
   * than a save that waits for the next change.
   */
  const current = (attempt.body ?? {}) as { rev?: number; doc?: CloudDoc };
  applyRemote(current.doc ?? {});
  saveRev(current.rev ?? 0);
  const retry = await call<{ rev: number }>(
    '/api/sync',
    { method: 'PUT', body: JSON.stringify({ baseRev: current.rev ?? 0, doc: localDoc() }) },
    user,
  );
  if (retry.status === 200) {
    saveRev(retry.body.rev);
    return true;
  }
  return false;
}

/** Erase the copy on the server. The browser keeps its own; the account stays. */
export async function eraseRemote(): Promise<boolean> {
  const user = auth()?.currentUser;
  if (!user) return false;
  try {
    const response = await call<{ rev: number }>('/api/sync', { method: 'DELETE' }, user);
    if (response.status === 200) {
      saveRev(0);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

let started = false;

/**
 * **Follow the account, and follow every write.**
 *
 * `onStoredChange` is the funnel every stored value already passes through, so one subscription
 * here covers favourites, saved journeys, searches, the board and the year — including things
 * added later, which is the point of hooking the funnel rather than the list.
 *
 * The wait of a second and a half is a bus, not a timer: a traveller tapping a heart should not
 * mean one request per tap, and nothing is lost if the tab closes in between, because the next
 * sign-in sends the whole document anyway.
 */
export function beginAccountSync(): void {
  if (started) return;
  started = true;

  let timer: number | null = null;
  onStoredChange(() => {
    if (timer !== null) window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      timer = null;
      void syncNow();
    }, 1500);
  });

  watchAccount((user) => {
    if (user) void syncNow();
  });
}
