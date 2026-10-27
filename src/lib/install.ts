import { useCallback, useSyncExternalStore } from 'react';
import { readStored, STORAGE_KEYS, writeStored } from './storage';

/**
 * **Installing OVVO on a home screen, in the two ways a browser allows it.**
 *
 * A phone can run a website as an app: its own icon, its own window, no address bar. The site
 * cannot ask for that itself. What it can do is be *installable* (a manifest and a service worker,
 * see `public/manifest.json` and `public/sw.js`) and then offer the traveller the button, which is
 * what this file is for.
 *
 * There are two browsers to satisfy, and they do not meet in the middle:
 *
 *   1. **Chromium** (Chrome, Edge, Samsung Internet, and Chrome on Android) fires
 *      `beforeinstallprompt` when the page has proved it can be installed, and hands the page an
 *      event it may `prompt()` **once**. If nobody calls `preventDefault()`, the browser draws its
 *      own mini bar at the foot of the screen. That bar is what this feature replaces, so the event
 *      is caught here, kept, and spent only on the traveller's own tap.
 *   2. **iOS Safari** fires nothing, ever. It has no install API; the only route is the Share
 *      sheet. So the app shows the button there on its own recognisance, and the button opens
 *      instructions instead of a prompt (`components/ui/InstallBanner`).
 *
 * **Why a store outside React.** `beforeinstallprompt` arrives once, early, often before the app
 * has drawn a screen: a listener attached in a component's effect can be attached too late, and the
 * offer is then lost for the whole visit with nothing on screen to say why. So the listeners are
 * attached by `watchInstallPrompt()` at module load (`main.tsx`) and the answer is kept here, where
 * a component mounting a moment later can still read it.
 *
 * Nothing in this file talks to a server, and the only thing it remembers is whether the traveller
 * has already said no (`STORAGE_KEYS.install`), which is what makes the banner a first-visit thing.
 * That answer is kept **in the store beside the event**, not in the banner's own state: the reset
 * (`resetInstallOffer`) has to reach it, and a `useState` inside a mounted component cannot be
 * reached from anywhere — which is exactly why a reset used to leave the banner hidden.
 */

/** The event Chromium fires. It is real, standard behaviour, and in none of the DOM types. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface InstallState {
  /** Bumped on every change, because `useSyncExternalStore` compares the snapshot by identity. */
  version: number;
  /** The browser's offer, kept for the traveller's own button. Usable exactly once. */
  deferred: BeforeInstallPromptEvent | null;
  /** Already installed, or open right now as an installed app. */
  installed: boolean;
  /** The traveller has answered the banner: it does not come back on this device. */
  refused: boolean;
}

let state: InstallState = {
  version: 0,
  deferred: null,
  installed: false,
  /* Read once, here rather than in a component, so the whole app shares one answer. */
  refused: readStored(STORAGE_KEYS.install, false),
};
const listeners = new Set<() => void>();

function publish(patch: Partial<Omit<InstallState, 'version'>>) {
  state = { ...state, ...patch, version: state.version + 1 };
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return state;
}

/** Open as an installed app rather than as a page in a browser tab. */
function isStandalone() {
  if (typeof window === 'undefined') return false;
  const modes = ['standalone', 'fullscreen', 'minimal-ui'] as const;
  if (modes.some((mode) => window.matchMedia(`(display-mode: ${mode})`).matches)) return true;
  /* iOS Safari's own flag, which is the only one it ever set. */
  return (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

/** An iPhone or an iPad, whatever the browser inside it is called. */
export function isIosDevice() {
  if (typeof navigator === 'undefined') return false;
  const { userAgent, maxTouchPoints } = navigator;
  if (/iPad|iPhone|iPod/.test(userAgent)) return true;
  /*
   * iPadOS 13 and later say they are a Mac, because they would rather have the desktop site. No Mac
   * has a touch screen, so a "Mac" reporting more than one touch point is an iPad.
   */
  return /Macintosh/.test(userAgent) && maxTouchPoints > 1;
}

/**
 * **Only Safari can put a site on an iPhone's home screen.**
 *
 * Every browser on iOS is WebKit wearing a different name, and the ones that are not Safari have no
 * Share sheet with that option in it. Chrome on iOS is the usual case: `CriOS`, and no way to
 * install. Telling that traveller to look for a Share button would send them to a menu that cannot
 * do it.
 */
export function isIosSafari() {
  if (!isIosDevice()) return false;
  return !/CriOS|FxiOS|EdgiOS|OPiOS|YaBrowser/.test(navigator.userAgent);
}

/**
 * Start listening for the browser's offer.
 *
 * Called once, from `main.tsx`, before React draws anything: the event can arrive within a few
 * hundred milliseconds of the page being parsed, and an offer that arrives before the listener is
 * a feature that works on a fast phone and not on a slow one.
 */
export function watchInstallPrompt() {
  if (typeof window === 'undefined') return;

  window.addEventListener('beforeinstallprompt', (event) => {
    /* The browser's own mini bar is replaced by the app's banner, so it must not be drawn. */
    event.preventDefault();
    publish({ deferred: event as BeforeInstallPromptEvent });
  });

  /* Fired after an install completes, whichever route the traveller took. */
  window.addEventListener('appinstalled', () => {
    publish({ deferred: null, installed: true });
  });

  if (isStandalone()) publish({ installed: true });
}

/**
 * **Forget that the banner was ever answered, for a reset.**
 *
 * Called by `resetLocalData` (`state/AppState.tsx`), whose promise is that OVVO treats the
 * traveller as somebody new. The stored flag goes with the rest of the storage wipe; this clears
 * the copy the running app is holding, which is the half that a wipe alone cannot reach. Whether
 * the banner is then on screen depends on the browser: an offer still in hand is drawn at once,
 * and an offer already spent in this visit can only come back on the next page load, because
 * Chromium hands the page that event once per load.
 */
export function resetInstallOffer() {
  publish({ refused: false });
}

/**
 * Put the answer away.
 *
 * The store is the single copy: writing storage here as well keeps the next visit quiet even if
 * this tab is reloaded before anything else touches it.
 */
function refuse() {
  writeStored(STORAGE_KEYS.install, true);
  publish({ refused: true });
}

export interface InstallOffer {
  /** Show the banner: not refused before, not installed, and there is something to offer. */
  visible: boolean;
  /** iOS Safari, where the button opens instructions rather than a prompt. */
  needsIosHelp: boolean;
  /** Ask the browser to install. Resolves after the traveller answers. */
  install: () => Promise<void>;
  /** Refuse for good: the banner does not come back on the next visit. */
  dismiss: () => void;
}

/**
 * The banner's state and its two actions.
 *
 * `install` is deliberately allowed to be an empty promise on a browser with nothing to offer: a
 * button that is on screen is a promise that pressing it does something, and the only case where
 * there is no event to spend is iOS, where the button opens the instructions instead.
 */
export function useInstallPrompt(): InstallOffer {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const ios = isIosSafari();

  const dismiss = useCallback(() => refuse(), []);

  const install = useCallback(async () => {
    const event = snapshot.deferred;
    if (!event) return;
    /* Cleared first: the event may be spent once, and a second press must not try again. */
    publish({ deferred: null });
    try {
      await event.prompt();
      await event.userChoice;
    } catch (error) {
      /* A browser that refuses the prompt has not installed anything; say so and carry on. */
      console.warn('[ovvo] install prompt was not shown', error);
      return;
    }
    /*
     * The flow is finished, whichever way the traveller answered, and the offer is spent. The
     * refusal is remembered so a later visit does not raise a banner over a question that has
     * already been answered, and so nothing appears again if an older browser fires a fresh event.
     */
    dismiss();
  }, [dismiss, snapshot.deferred]);

  return {
    visible: !snapshot.refused && !snapshot.installed && (snapshot.deferred !== null || ios),
    needsIosHelp: ios,
    install,
    dismiss,
  };
}
