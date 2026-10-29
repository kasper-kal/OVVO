/** Thin, failure-tolerant localStorage wrapper. Everything stays on this device. */

const PREFIX = 'ov-planner:v1:';

export function readStored<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
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
  } catch {
    /* storage full or unavailable — the prototype keeps working in memory */
  }
}

export function clearStored(): void {
  if (typeof window === 'undefined') return;
  try {
    Object.keys(window.localStorage)
      .filter((key) => key.startsWith(PREFIX))
      .forEach((key) => window.localStorage.removeItem(key));
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
} as const;
