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
 * **Is this page inside another page?**
 *
 * The preview panel here, and plenty of other places a site is shown, draw it inside a frame. A
 * browser will not install a page it is showing inside another page, and it does not offer an
 * install there either. The banner still has one useful thing to say in that case, so this is
 * asked rather than guessed at: reading `top` throws when the frame belongs to another origin,
 * which is itself a frame.
 */
function isFramed() {
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

/**
 * **A browser that can install, even when it has not offered to.**
 *
 * Chrome, Edge, Samsung Internet and Opera all put apps on a home screen; Firefox and desktop
 * Safari do not. The offer event is the easy case, but it is not the only case: Chrome decides for
 * itself whether to hand the page that event, and it withholds it in a frame, in a private window,
 * and on a site it thinks the traveller has already answered for. When it does, the banner used to
 * vanish completely and there was nothing on screen to say an app was even possible.
 *
 * So the browsers that *can* install are recognised, and the banner's button then explains the way
 * in rather than pretending to have an offer to spend.
 */
function canInstall() {
  if (typeof navigator === 'undefined') return false;
  const brands = (navigator as Navigator & { userAgentData?: { brands?: { brand: string }[] } })
    .userAgentData?.brands;
  if (brands?.length) return brands.some(({ brand }) => /Chromium|Chrome|Edge|Opera|Samsung/i.test(brand));
  /* No `userAgentData` (Safari, Firefox, older Chromium): the name in the user agent is all there is. */
  return /Chrome\/|Chromium|Edg\/|OPR\/|SamsungBrowser/.test(navigator.userAgent);
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
  /*
   * `installed` is **re-read**, not trusted. It latches for the rest of the session when an install
   * finishes (`appinstalled`), and the tab somebody resets in is not the installed app: before
   * this line, a reset after an install left the banner hidden until the tab was closed, which is
   * exactly what was reported. Reading `isStandalone()` puts the answer back to what this window
   * really is: an ordinary tab offers the app again, and the app itself still offers nothing.
   */
  publish({ refused: false, installed: isStandalone() });
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

/**
 * **How this browser can put OVVO on a home screen.**
 *
 *   - `prompt`: Chromium handed the page an offer. The button spends it, and the browser installs.
 *   - `safari`: an iPhone or iPad on Safari, where the only route is the Share sheet.
 *   - `menu`: a browser that can install but did not offer: Chromium without the event, or another
 *     browser on iOS. The button explains where the item is in that browser's own menu.
 *   - `frame`: the page is inside another page, where no install is possible at all. The button
 *     opens OVVO in its own tab, which is the one step that makes installing possible.
 */
export type InstallRoute = 'prompt' | 'safari' | 'menu' | 'frame';

export interface InstallOffer {
  /** Show the banner: not refused before, not installed, and this browser can install at all. */
  visible: boolean;
  /** What pressing the button will do. */
  route: InstallRoute;
  /**
   * Ask the browser to install, or put the page in its own tab first when it is framed.
   * Resolves after the traveller answers.
   */
  install: () => Promise<void>;
  /** Refuse for good: the banner does not come back on the next visit. */
  dismiss: () => void;
}

/**
 * The banner's state and its actions.
 *
 * `route` is worked out here rather than in the component so the two halves cannot disagree: the
 * button, the instructions and the decision to draw the banner all read the same answer.
 */
export function useInstallPrompt(): InstallOffer {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const iosSafari = isIosSafari();
  const framed = isFramed();
  const ios = isIosDevice();

  const route: InstallRoute = snapshot.deferred
    ? 'prompt'
    : framed
      ? 'frame'
      : iosSafari
        ? 'safari'
        : 'menu';

  const dismiss = useCallback(() => refuse(), []);

  const install = useCallback(async () => {
    /*
     * Inside another page there is nothing to install and no prompt to call: the browser refuses
     * to install a framed document. Opening the same address in its own tab is the way out, and it
     * is a real action on a real button rather than an explanation of one.
     */
    if (framed) {
      window.open(window.location.href, '_blank', 'noopener,noreferrer');
      return;
    }
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
  }, [dismiss, framed, snapshot.deferred]);

  return {
    /*
     * On screen on the first visit of any browser that can install, not only when an offer happens
     * to be in hand. The old rule hid the banner on every browser that stayed quiet, which is most
     * of them outside a plain Chrome tab, and a feature nobody can see is not a feature.
     */
    visible: !snapshot.refused && !snapshot.installed && (canInstall() || iosSafari || ios),
    route,
    install,
    dismiss,
  };
}
