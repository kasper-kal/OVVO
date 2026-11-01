/**
 * **Firebase, set up once, and only if this build was given the keys.**
 *
 * The six values below are public: Google hands them to every browser that loads the page, and
 * they are useless without the sign-in service on the other end. They arrive at build time from
 * `.env` and are copied into the bundle.
 *
 * If they are missing — a build with no `.env`, which is the state of a fresh clone — the app
 * still works. Sign-in is switched off in the account card instead of throwing on every screen,
 * and that is a deliberate choice: a site that cannot sign you in is a site with a broken button,
 * not a site with a broken everything.
 */

import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

/* Vite's own `import.meta.env` typing is not installed in this project, so it is described here. */
const env = import.meta.env as unknown as Record<string, string | undefined>;

const config = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

/** True when this build carries a usable Firebase configuration. */
export const firebaseConfigured = Boolean(config.apiKey && config.projectId && config.appId);

/** The address the app is served from, used to build the email-link return address. */
export const siteOrigin = env.VITE_SITE_ORIGIN ?? window.location.origin;

let app: FirebaseApp | null = null;

/**
 * The app is created on first use rather than at import.
 *
 * `initializeApp` throws when the config is empty, and a thrown error at import time would take
 * the whole bundle with it. Called from the account card, it either works or the card says why.
 */
export function firebase(): FirebaseApp | null {
  if (!firebaseConfigured) return null;
  if (!app) app = initializeApp(config);
  return app;
}

export function auth(): Auth | null {
  const instance = firebase();
  return instance ? getAuth(instance) : null;
}
