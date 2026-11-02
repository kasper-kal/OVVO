import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/layout/ErrorBoundary';
import { watchInstallPrompt } from './lib/install';
import { installManifest } from './lib/manifest';
import { APP_WIRE_BYTES, MAX_TIMER_MS, transferMs } from './lib/link';
import { getDevOverrides, setDevOverrides } from './lib/dev';
import { beginAccountSync } from './lib/account';
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
watchSplash();

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
 * **The account starts watching the store before the first screen is drawn.**
 *
 * A traveller who is already signed in should find their things on a new device without having to
 * visit Settings first, and a change made anywhere in the app should reach the server without a
 * screen having to remember to send it. Both come from one place: `lib/account` follows the
 * storage funnel and the sign-in state, and sending is its business, not a screen's.
 */
void beginAccountSync();

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
 * **An old copy of the app replaces itself, once, instead of living on.**
 *
 * The worker keeps the shell so the app opens offline. The cost of that arrived on 1 November 2026:
 * a browser holding the page from before a deploy kept drawing **the previous build** - old labels,
 * a settings card that had already been rewritten - because nothing told it a newer one existed.
 * A reload served the cached page again, so from the outside it looked as if the deploy had not
 * happened. It had; the page was simply never asked to check.
 *
 * Two things fix the cause. On every load the worker is asked to look for a newer version of
 * itself, and when one takes control the page reloads **once**, so the traveller sees the build
 * that exists rather than the one in their pocket. The reload only happens when a worker was
 * already in charge, so a first visit is not reloaded for no reason.
 */
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  const hadWorker = navigator.serviceWorker.controller !== null;
  let reloading = false;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadWorker || reloading) return;
    reloading = true;
    window.location.reload();
  });

  window.addEventListener('load', () => {
    void navigator.serviceWorker
      .getRegistration()
      .then((registration) => registration?.update().catch(() => {}))
      .catch(() => {});
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

/**
 * **The mark never sits there without saying anything.**
 *
 * The splash is taken down by the app once it has drawn, and `index.html` removes it after ninety
 * seconds as a last resort. Neither helps somebody looking at a logo now: the first says nothing
 * until the wait is over, and the second arrives long after a person has decided the site is broken.
 * This is the sentence in between. If the app has not drawn after twenty seconds, the mark gains one
 * line and a Reload button, so a stuck start is something to read instead of something to wait out.
 *
 * It writes its own styles rather than borrowing the app's: this runs when the app is the thing that
 * has not arrived, so nothing here may depend on it.
 */
function watchSplash(): void {
  window.setTimeout(() => {
    const splash = document.getElementById('splash');
    const root = document.getElementById('root');
    if (!splash || (root && root.childElementCount > 0)) return;
    const note = document.createElement('div');
    note.setAttribute('role', 'status');
    /* The splash itself lets taps through, so this line has to take its own back for the button. */
    note.style.cssText =
      'position:absolute;bottom:12vh;left:24px;right:24px;text-align:center;font-family:system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.45;color:#3f3c37;pointer-events:auto;';
    const line = document.createElement('p');
    line.style.margin = '0 0 12px';
    line.textContent = 'OVVO has not finished opening. Reloading the page usually starts it.';
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Reload';
    button.style.cssText =
      'padding:10px 20px;border-radius:999px;border:1px solid #c9c5bb;background:#ffffff;color:#18181b;font:inherit;font-weight:600;';
    button.addEventListener('click', () => window.location.reload());
    note.append(line, button);
    splash.appendChild(note);
  }, 20000);
}

const container = document.getElementById('root');
if (!container) throw new Error('Root container missing from index.html');

/**
 * **The claimed link speed, at the one moment a page really downloads this app.**
 *
 * Moving between screens costs nothing: every screen is already in the bundle, so a tap is drawn in
 * the frame it happens in and no speed can slow it down. A *reload* is different. It asks the host
 * for the app again, and on a slow connection that request is the long one — so when the panel
 * claims a speed, the wait here is the time the bundle it just downloaded would have taken at that
 * speed (`APP_WIRE_BYTES`), counted from the start of the navigation and not from this line.
 *
 * The mark in `index.html` stays up for the whole wait, which is exactly what a reload on that link
 * looks like: the page arrives, the drawing is already there, and the app itself takes its time.
 * Nothing else in the app waits for a speed it did not earn (see `lib/link`).
 */
/*
 * **Cut to what a timer can hold.**
 *
 * The arithmetic is exact, and at a speed of 0.00000005 it is longer than 2^31-1 milliseconds, which
 * a browser's timer overflows into an immediate call: the panel claimed months and the app opened in a
 * blink. The claimed speed is clamped in the panel, and the wait is clamped here as well, so a stale
 * stored value cannot produce the same silence.
 */
/*
 * **A claimed slow link is a wait, not a lockout.**
 *
 * The arithmetic is exact, and at the slowest speed the panel allows it says three minutes and
 * twenty seconds. Held in full, that is a logo standing still on a site that is otherwise instant,
 * which reads as a page that has failed rather than one that is slow.
 *
 * Reproduced on the live site on 2 November 2026: a remembered claim of 0.01 Mbps kept the mark up
 * past thirty seconds with nothing drawn behind it, and reloading could not get past it, because
 * the claim is remembered across reloads by design (`lib/dev`). The mark is now held for at most
 * eight seconds, and the claimed speed still slows every other wait it was written for.
 */
const MAX_BOOT_WAIT_MS = 8000;
const bootWait = Math.min(
  MAX_BOOT_WAIT_MS,
  MAX_TIMER_MS - 1,
  Math.max(0, transferMs(APP_WIRE_BYTES, getDevOverrides().wifiMbps) - performance.now()),
);

function mount(): void {
  createRoot(container as HTMLElement).render(
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

  /* Two frames, so the mark leaves a screen the app has actually painted rather than one it is
     still assembling. */
  window.requestAnimationFrame(() => window.requestAnimationFrame(takeDownSplash));
}

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

/**
 * **"Skip wait", and only while there is a wait to skip.**
 *
 * A claimed slow link is held at the start of the app and nowhere else, which is the one moment
 * there is no screen to reach the panel from: the thing that would switch the claim off is the thing
 * the claim is holding. So the mark carries the way out. Pressing it clears the stored speed, the
 * same switch the panel's own control throws, and opens the app at once, so the next reload is
 * normal as well and a forgotten test value cannot cost two visits.
 *
 * It appears only when a speed is claimed (`getDevOverrides().wifiMbps`). With no claim the app has
 * nothing to wait for, and a button that did nothing would be worse than no button at all.
 */
function offerSkipWait(open: () => void): void {
  if (getDevOverrides().wifiMbps === null) return;
  const splash = document.getElementById('splash');
  if (!splash) return;

  /* The mark is decorative and hidden from screen readers; a button inside it would be reachable by
     keyboard and invisible to a reader, so the mark becomes part of the page for as long as it
     carries this control. */
  splash.removeAttribute('aria-hidden');

  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = 'Skip wait';
  /* Positioned and styled here rather than by the app's stylesheet: this is shown while the app is
     still the thing that has not arrived. The mark lets taps through, so this takes its own back. */
  button.style.cssText =
    'position:absolute;bottom:12vh;left:50%;transform:translateX(-50%);padding:11px 22px;border-radius:999px;border:1px solid #c9c5bb;background:#ffffff;color:#18181b;font-family:system-ui,-apple-system,sans-serif;font-size:15px;font-weight:600;line-height:1.2;pointer-events:auto;cursor:pointer;';
  button.addEventListener('click', () => {
    setDevOverrides({ wifiMbps: null });
    open();
  });
  splash.appendChild(button);
}

/* One opening only: the timer and the button can both arrive, and a second `createRoot` on the same
   container would draw the app twice. */
let booted = false;
let bootTimer = 0;

function open(): void {
  if (booted) return;
  booted = true;
  window.clearTimeout(bootTimer);
  mount();
}

if (bootWait > 0) {
  bootTimer = window.setTimeout(open, bootWait);
  offerSkipWait(open);
} else open();
