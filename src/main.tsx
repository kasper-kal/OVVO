import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/layout/ErrorBoundary';
import { watchInstallPrompt } from './lib/install';
import { installManifest } from './lib/manifest';
import './styles/tokens.css';
import './styles/fonts.css';
import './styles/base.css';
import './styles/components.css';
import './styles/map.css';
import './styles/styles-panel.css';

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
 * **The app restores scroll itself, so the browser must not.**
 *
 * Two things were moving the page after a route change, and they disagree: the app puts every new
 * screen at its top (and a screen you go back to where you left it, by history entry — see
 * `layout/AppShell`), while the browser performs its own restoration on the same events. Whichever
 * ran last won, so a reset could land on a home screen already nudged down by the offset of the
 * screen before it. With `manual`, there is one owner of this and it is the app.
 */
if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';

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
 * **And the manifest is checked, with a rebuilt copy only if the site's own does not arrive.**
 *
 * A host that answers `/manifest.json` with anything but the file (a preview proxy, a catch-all
 * page, a security challenge) leaves Chrome unable to read it, and Chrome's answer is the one in
 * its own menu: "this app cannot be installed". Building the same manifest in the page and linking
 * it as a `blob:` URL takes the file's delivery out of the browser's way (`lib/manifest`) - but a
 * rebuilt manifest installs as a Chrome shortcut rather than a real app, so it is only used when
 * the file is genuinely unusable.
 */
void installManifest();

/**
 * **The offline strip keeps its promise across a reload, and the install offer depends on this.**
 *
 * `public/sw.js` keeps the shell, so a page opened with no network draws the app instead of the
 * browser's error page — which is the one thing the strip could not honestly claim before. It is
 * registered in the build only (`import.meta.env.PROD`), because in development the modules change
 * on every keystroke and a cache in front of them would serve yesterday's code.
 *
 * **It used to wait for `load`, and that was wrong.** Chrome's published note on its install
 * criteria says the algorithm that shows the install prompt still asks for a worker with a
 * `fetch` handler, even though installing from the browser menu no longer does
 * (developer.chrome.com/blog/update-install-criteria). Waiting for `load` meant the first visit of
 * a new traveller had no worker at all when Chrome made up its mind, so the offer never came and
 * the banner had nothing to spend: it fell back to written instructions on the one visit where the
 * traveller was most likely to install. Registering straight away fixes the order of those two
 * events, and the cost is one small request that the page was going to make anyway.
 *
 * A failure here is logged and otherwise ignored. Offline support is an improvement, not a
 * dependency: the app is local, and a browser that refuses a worker (private mode, an old WebView)
 * must not be given a broken app because of it.
 *
 * **`updateViaCache: 'none'`, and this one line cost a phone an installable app.** By default the
 * browser may answer its own request for `sw.js` from the HTTP cache, so a worker fetched once
 * keeps being the worker, and every fix below it waits for a cache that never expires. Chrome is
 * the one that has to install this app, so Chrome must read the current worker and the current
 * manifest, not what a cache remembers of them.
 */
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  void navigator.serviceWorker
    .register('/sw.js', { updateViaCache: 'none' })
    .catch((error) => console.warn('[ovvo] service worker not registered', error));
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

/*
 * **The mark in `index.html` is taken down by the app, once the app has drawn.**
 *
 * The splash exists because the one wait left in this app is the first one: every screen is in
 * this script, so a tap is never a request, but the script itself takes a moment to arrive and
 * nothing on the page can draw it (see the comment on `#splash` in `index.html`).
 *
 * **It is held for a beat even when the app is ready.** A splash that appears and vanishes inside
 * a frame is a flicker, and a flicker reads as a fault; a mark that is shown for about a third of
 * a second reads as the app opening. The hold is measured from the moment the mark appeared
 * (`window.__ovvoSplash`, set in `index.html`), so a slow load is not held any longer than it
 * already was, and a fast one is not cut shorter than the eye can follow.
 *
 * The removal is a fade and then a delete: the fade so the first screen is not revealed with a
 * cut, the delete so a full-screen layer is not left sitting over the page for the rest of the
 * session. Reduced motion and the app's own switch take the fade out (`index.html`'s stylesheet
 * reads `data-motion`, which the state provider has already written by the time this runs).
 */
function takeDownSplash(): void {
  const splash = document.getElementById('splash');
  if (!splash) return;
  const shownAt = (window as unknown as { __ovvoSplash?: number }).__ovvoSplash ?? 0;
  const remaining = Math.max(0, 320 - (Date.now() - shownAt));
  window.setTimeout(() => {
    splash.setAttribute('data-leaving', '');
    window.setTimeout(() => splash.remove(), 260);
  }, remaining);
}

/* Two frames, so the mark leaves a screen the app has actually painted rather than one it is
   still assembling. */
window.requestAnimationFrame(() => window.requestAnimationFrame(takeDownSplash));
