/**
 * Thin, failure-tolerant localStorage wrapper.
 *
 * Values live in this browser first — that is what makes the app work with no account and no
 * network — and follow the account when one is signed in (`lib/account` sends the whole store as
 * one document and adopts it when the account has moved on).
 */

const PREFIX = 'ov-planner:v1:';

/** The same prefix, for the one caller that has to read the whole store as a document (`lib/account`). */
export const STORAGE_PREFIX = PREFIX;

/**
 * **Every stored write goes through here on its way out.**
 *
 * The account sync needs to know that something changed without being told what, or by whom: a
 * heart, a saved journey, a search, the year's tally. Subscribing to the funnel means a value
 * added next month is synced without anybody remembering to hook it up.
 */
const listeners = new Set<() => void>();

/** Tell anything listening that values have changed from outside a normal write (a sync landing). */
export function announceStored(): void {
  for (const listener of listeners) listener();
}

export function onStoredChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/*
 * **A value that was removed stays removed.**
 *
 * Removing the departure alarm deleted its key, and the alarm came back anyway the moment the
 * screen was left and opened again: the store is written by more than the control that owns a
 * value — the account sync adopts a copy of the store from the server, and a second tab writes what
 * it has — so a key that is merely deleted is a key that can be handed back, and an "adopt the
 * account's copy" with an older revision put the alarm straight back. Deleting the value is
 * therefore not enough: the deletion has to be remembered too, so a copy of the store that still
 * contains it does not become the truth.
 *
 * `readStored` answers with the fallback for a name on this list, and only a deliberate write
 * through `writeStored` takes the name off it. The list is capped and lives in the same store, so it
 * is cleared with everything else.
 */
const REMOVED_KEY = 'removed-keys';
let removedCache: string[] | null = null;

function removedNames(): string[] {
  if (removedCache) return removedCache;
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(PREFIX + REMOVED_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    removedCache = Array.isArray(parsed) ? parsed.filter((name): name is string => typeof name === 'string') : [];
  } catch {
    removedCache = [];
  }
  return removedCache;
}

function setRemovedNames(names: string[]): void {
  removedCache = names;
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PREFIX + REMOVED_KEY, JSON.stringify(names));
  } catch {
    /* storage full or unavailable: the in-memory list still holds this session */
  }
}

export function readStored<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  if (removedNames().includes(key)) return fallback;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as T;
    if (parsed === null || parsed === undefined) return fallback;
    return parsed;
  } catch {
    return fallback;
  }
}

export function writeStored<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
    /* A deliberate write is what brings a removed name back into force. */
    if (removedNames().includes(key)) setRemovedNames(removedNames().filter((name) => name !== key));
    for (const listener of listeners) listener();
  } catch {
    /* storage full or unavailable — the prototype keeps working in memory */
  }
}

/**
 * Delete one value.
 *
 * The alarm needs it: "remove this alarm" has to mean the minute is gone, not that a flag beside it
 * is set. A key that is absent and a key holding `null` read the same through `readStored`, but only
 * one of them stays gone when the store is synced or inspected.
 */
export function removeStored(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(PREFIX + key);
    /* The deletion is remembered, or the next copy of the store hands the value back (see above). */
    if (!removedNames().includes(key)) setRemovedNames([...removedNames(), key].slice(-60));
    for (const listener of listeners) listener();
  } catch {
    /* ignore */
  }
}

export function clearStored(): void {
  if (typeof window === 'undefined') return;
  try {
    Object.keys(window.localStorage)
      .filter((key) => key.startsWith(PREFIX))
      .forEach((key) => window.localStorage.removeItem(key));
    removedCache = [];
  } catch {
    /* ignore */
  }
}

export const STORAGE_KEYS = {
  settings: 'settings',
  preferences: 'preferences',
  // Value unchanged on purpose: this slot held the old "favourite locations".
  favouriteStops: 'favourites',
  /*
   * Stops pinned to the departure board — a different idea from a favourite, so a different
   * slot. A heart marks a place you like (it leads your lists and your search); a pin marks a
   * place whose board you want on the departures screen. Kept apart so unpinning the board
   * cannot quietly empty the favourites list, or the reverse.
   */
  boardStopIds: 'board-stops',
  /*
   * The traveller's own names for stops they favourited ("Work", "Home", "Closest bus
   * station"). A different slot from the favourites list itself, so removing every name cannot
   * lose a favourite, and removing a favourite leaves the stored name for the day it comes back.
   */
  stopNames: 'stop-names',
  savedJourneys: 'saved-journeys',
  /* Searches the traveller kept: "Home → Work", saved from the results screen. */
  recentSearches: 'recent-searches',
  /*
   * Searches the traveller *ran*, newest first, written by `startSearch` rather than by a control.
   * A slot of its own because keeping a search and running one are different acts with different
   * lists: the kept pair survives a hundred runs, and the history forgets the ninth run of it.
   */
  searchHistory: 'search-history',
  /*
   * No `lastSearch` slot any more. It held the previous session's From/To and was read back on
   * every visit, which is what put two stops the traveller had not chosen *this* visit into the
   * planner card (reported with a screenshot). The recent-searches list above is the history the
   * traveller asked to keep and can re-run; a prefill is a history they did not ask for.
   */
  /*
   * The stop the departure board was last asked for. Written only by the traveller's own choice —
   * a `?stop=` they followed, or a stop they picked on the board — never by a default, so this
   * slot cannot become "the app always opens on Amsterdam Centraal".
   */
  boardStop: 'board-stop',
  homeWidgets: 'home-widgets',
  /*
   * The station a home-screen widget is tied to, keyed by widget id.
   *
   * A card that watches one place has to remember which place, and asking on the card is the wrong
   * shape for it: a quick glance should not need a search first. The choice is made once, when the
   * card asks for it, and written here; removing the widget deletes its entry (see
   * `removeHomeWidget`, in `state/AppState.tsx`), and the card that is added back asks again
   * instead of quietly keeping the old answer.
   */
  widgetStations: 'widget-stations',
  locationConsent: 'location-consent',
  locationFix: 'location-fix',
  /*
   * Where the *network* thinks this browser is, from the address the request arrived from — an
   * approximate fallback for the stops list's nearest-first sort, kept for a day. Separate from
   * `locationFix` on purpose: a device fix and an IP estimate are not the same claim, and the
   * screen that uses them says which one it used.
   */
  approximateLocation: 'approximate-location',
  /*
   * That the traveller has already been asked about installing the app on their home screen, and
   * said no (or finished the install). The install banner is a first-visit thing
   * (`lib/install`), so this slot is the whole of that memory: once it is set the banner does not
   * come back, and clearing the app's stored data brings it back with everything else.
   */
  install: 'install-asked',
  /*
   * **The year's tally** (`lib/wrapped`): one line per search run, per board opened, per day a look
   * was worn, written from the day the tally started so a December card has a year to read. It is
   * an ordinary slot rather than a device-only one, because a signed-in traveller should find their
   * year on their other phone, exactly like their favourites.
   */
  wrapped: 'wrapped',
} as const;
