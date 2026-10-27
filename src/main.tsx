import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/layout/ErrorBoundary';
import { watchInstallPrompt } from './lib/install';
import { installManifest } from './lib/manifest';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/map.css';

/**
 * **An address that still carries a `#/` is an old address, not an error.**
 *
 * The app used `HashRouter` until now, so every link anybody saved, bookmarked or sent to a friend
 * looked like `/#/stops/utrecht-centraal`. The router reads real paths now, and a pathless page
 * with a hash on the end would land those old links on the home screen — the right app, the wrong
 * screen, and nothing on it to explain itself.
 *
 * So the address is translated once, before anything is drawn: `/` + the part after the `#`. It is
 * `replaceState`, not `assign`, so the browser keeps its history entry and the traveller's back
 * button still goes where it went before — one entry, the right address, no extra hop. The query
 * string is carried across too, because it is the part that was *not* in the hash.
 */
function translateLegacyHash() {
  const { hash } = window.location;
  if (!hash.startsWith('#/')) return;
  window.history.replaceState(null, '', hash.slice(1) + window.location.search);
}

translateLegacyHash();

/**
 * **The browser's install offer is caught before React draws.**
 *
 * Chromium fires `beforeinstallprompt` once, and it can arrive a few hundred milliseconds after
 * the page is parsed — before the first screen has mounted. A listener attached in an effect can
 * therefore miss it on a slow phone and catch it on a fast one, which is the worst kind of bug to
 * have. So the listeners are attached here, at module load, and the event is kept in `lib/install`
 * until the traveller's own banner is ready to use it.
 */
watchInstallPrompt();

/**
 * **And the manifest that makes the app installable is handed over from inside the page.**
 *
 * A host that answers `/manifest.json` with anything but the file (a preview proxy, a catch-all
 * page, a security challenge) leaves Chrome unable to read it, and Chrome's answer is the one in
 * its own menu: "this app cannot be installed". Building the same manifest here and linking it as
 * a `blob:` URL takes the file's delivery out of the browser's way (`lib/manifest`).
 */
void installManifest();

/**
 * **The offline strip keeps its promise across a reload.**
 *
 * `public/sw.js` keeps the shell, so a page opened with no network draws the app instead of the
 * browser's error page — which is the one thing the strip could not honestly claim before. Two
 * conditions, both deliberate: the build only (`import.meta.env.PROD`), because in development the
 * modules change on every keystroke and a cache in front of them would serve yesterday's code; and
 * after `load`, so registering never competes with the first paint for the connection.
 *
 * A failure here is logged and otherwise ignored. Offline support is an improvement, not a
 * dependency: the app is local, and a browser that refuses a worker (private mode, an old WebView)
 * must not be given a broken app because of it.
 */
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker
      .register('/sw.js')
      .catch((error) => console.warn('[ovvo] service worker not registered', error));
  });
}

/**
 * **The "browser is too old" note is taken down by the app itself.**
 *
 * `index.html` shows it when its own check says this browser cannot read the bundle. The check is
 * two exact questions (modules, and whether the code parses), so it should never be wrong — but a
 * guess about an old browser is not worth a working traveller's screen, and one line here makes
 * that impossible: if the app got this far, it can run, and the note has no business being there.
 */
document.getElementById('too-old')?.remove();

const container = document.getElementById('root');
if (!container) throw new Error('Root container missing from index.html');

createRoot(container).render(
  <StrictMode>
    {/*
      The outermost boundary, outside the app's state provider and its router on purpose: the
      thing that throws may be either of them, and then there is no shell to draw. Everything
      inside is caught here, and the card it shows is OVVO's own (`layout/ErrorScreen`).
    */}
    <ErrorBoundary variant="page" resetOnAddress>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
