import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { DEFAULT_PREFERENCES, type Preferences } from '../data/preferences';
import { DEFAULT_RESULTS_FILTER, planJourneys, type SearchQuery } from '../data/journeyEngine';
import { setCustomStopNames, stopLabel } from '../data/stops';
import type { Journey, SortMode } from '../data/types';
import { clearStored, readStored, STORAGE_KEYS, writeStored } from '../lib/storage';
import {
  fetchApproximateLocation,
  readFreshApproximateLocation,
  type ApproximateLocation,
} from '../lib/approximateLocation';
import { DEFAULT_HOME_WIDGETS, REQUIRED_WIDGETS, migrateHomeWidgets } from '../widgets/defaults';
import { NO_BATTERY, watchBattery, type PowerState } from '../lib/power';
import { applyBackground } from '../lib/background';
import { applySelection } from '../lib/selection';
import { paletteFor } from '../lib/palette';
import { translate } from '../lib/i18n';
import {
  DEFAULT_SETTINGS,
  migrateSettings,
  type LocationConsent,
  type PlannerSearchState,
  type RecentSearch,
  type SavedJourney,
  type Settings,
  type UserLocation,
} from './types';

export interface Toast {
  id: string;
  message: string;
  tone?: 'default' | 'success' | 'warning';
}

/**
 * A position to measure distances from, and where it came from. The provenance travels with the
 * coordinates because the two are not equivalent claims: a device fix is where the traveller is,
 * an IP estimate is where their network appears to be.
 */
export interface NearestOrigin {
  lat: number;
  lon: number;
  source: 'device' | 'ip';
}

interface AppContextValue {
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  resetSettings: () => void;
  /**
   * The appearance actually being drawn, with `system` already resolved to the device's own
   * answer, so a screen that reports it cannot disagree with the one on the glass.
   */
  appearance: 'light' | 'dark';

  /**
   * Battery saving as the device reports it (see `lib/power.ts`): `save` at 20%, `super` at 10%,
   * `off` above that or while charging.
   *
   * In the store rather than in a hook of its own because three things read it — the document's
   * `data-power` (which the stylesheet obeys), the home grid (which thins itself out in super),
   * and Settings (which names the mode) — and they must agree about which mode the traveller is
   * in. It is not a preference: nothing here is stored.
   */
  power: PowerState;

  preferences: Preferences;
  updatePreferences: (patch: Partial<Preferences>) => void;
  resetPreferences: () => void;

  /**
   * Stops hearted as favourites — they lead every stop list and are offered first.
   *
   * A *favourite* is a place the traveller likes. It used to be called a pin, which collided
   * with the departure board's pin: that one answers "which stops should the board show?".
   * Two questions, two controls, two storage slots; the heart belongs here.
   */
  favouriteStopIds: string[];
  isFavourite: (stopId: string) => boolean;
  toggleFavourite: (stopId: string) => boolean;

  /**
   * The traveller's own names for stops they favourited, keyed by stop id.
   *
   * Only Settings writes this (the rename list there is the one place a name is given), and every
   * label in the app reads it through `stopName`/`stopLabel`, so a renamed address reads as
   * "Work" wherever it appears rather than on one screen only.
   */
  customStopNames: Record<string, string>;
  /** Give a favourite a name of the traveller's own; an empty name restores the official one. */
  renameStop: (stopId: string, name: string) => void;

  /** Stops pinned to the departure board. Complete on purpose — the board is its list. */
  boardStopIds: string[];
  isOnBoard: (stopId: string) => boolean;
  toggleBoardStop: (stopId: string) => boolean;
  /** Replace the board's list in one write, which is what the multi-stop picker does. */
  setBoardStops: (stopIds: string[]) => void;

  savedJourneys: SavedJourney[];
  isJourneySaved: (signature: string) => boolean;
  saveJourney: (journey: Journey, query: SearchQuery, windowOffsetMinutes: number) => void;
  removeSavedJourney: (id: string) => void;

  recentSearches: RecentSearch[];
  /**
   * Keep a search in this browser's own history. It is not called by searching — see
   * `startSearch` — only by the traveller asking for it.
   */
  keepSearch: (query: SearchQuery) => void;
  removeRecentSearch: (id: string) => void;
  clearRecentSearches: () => void;

  search: PlannerSearchState | null;
  journeys: Journey[];
  startSearch: (query: SearchQuery) => void;
  updateSearchQuery: (patch: Partial<SearchQuery>) => void;
  shiftWindow: (deltaMinutes: number) => void;
  setSortMode: (mode: SortMode) => void;
  setFilter: (patch: Partial<PlannerSearchState['filter']>) => void;
  resetFilter: () => void;
  clearSearch: () => void;
  findJourney: (journeyId: string | undefined) => Journey | undefined;

  toasts: Toast[];
  pushToast: (message: string, tone?: Toast['tone']) => void;
  dismissToast: (id: string) => void;

  resetLocalData: () => void;

  /** Device location: asked for once on first open, then kept for nearest-stop lookups. */
  locationConsent: LocationConsent;
  setLocationConsent: (value: LocationConsent) => void;
  userLocation: UserLocation | null;
  /** Requests a fresh device fix. Resolves on success, rejects with a readable message. */
  requestLocation: () => Promise<UserLocation>;
  /** The network's estimate of where this browser is, or null when it has none. */
  approximateLocation: ApproximateLocation | null;
  /**
   * True while that estimate has been asked for and has not answered yet. A screen that offers a
   * "closest to me" list waits on this rather than drawing a no-location answer first.
   */
  approximateLocationPending: boolean;
  /**
   * What "nearest me" means, in one place: the device's own fix when we have one, otherwise the
   * approximate estimate. Any screen that sorts by distance reads this rather than deciding for
   * itself which answer wins — and `source` is what lets it say which one it used.
   */
  nearestOrigin: NearestOrigin | null;

  /** Home-screen widget layout. */
  homeWidgets: string[];
  addHomeWidget: (id: string) => void;
  removeHomeWidget: (id: string) => void;
  /**
   * The size the traveller gave each widget, keyed by id.
   *
   * Only resized widgets have an entry, so the registry stays the one place a default is
   * declared. Cleared when the widget is removed: a card that comes back is a new card.
   */
  /**
   * The station each widget is tied to, keyed by widget id — and the way it is set.
   *
   * A card that watches one station (the next-departures card) makes that choice **once**, when it
   * is placed, and never asks again: a home screen is for glancing at, not for searching on. The
   * binding is written here rather than by the widget itself so that removing the widget can drop
   * it — which is how a different station is chosen.
   */
  widgetStations: Record<string, string>;
  setWidgetStation: (widgetId: string, stopId: string) => void;
  /** Put one widget at a slot, shifting the rest — the drag on the home screen. */
  moveHomeWidget: (id: string, toIndex: number) => void;
  /* Put back an arrangement that a reset threw away — the undo the layout menu offers. */
  restoreHomeLayout: (ids: string[]) => void;
  resetHomeWidgets: () => void;
  /**
   * Whether the home screen is being customised, and the layout menu the header opens.
   *
   * Both used to live inside `HomePage`, which was fine while every control for them was on the
   * page. The Done and + controls are in the **shell's header** now — the two places an iOS home
   * screen puts its Edit and Done — so the mode has to be readable from both screens, and one
   * value in the store is what keeps "am I editing" from being answered twice.
   */
  homeEditing: boolean;
  setHomeEditing: (editing: boolean) => void;
  homeMenuOpen: boolean;
  setHomeMenuOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

let toastCounter = 0;

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => ({
    ...DEFAULT_SETTINGS,
    ...migrateSettings(readStored<Partial<Settings>>(STORAGE_KEYS.settings, {})),
  }));
  const [preferences, setPreferences] = useState<Preferences>(() => ({
    ...DEFAULT_PREFERENCES,
    ...readStored<Partial<Preferences>>(STORAGE_KEYS.preferences, {}),
  }));
  const [favouriteStopIds, setFavouriteStopIds] = useState<string[]>(() =>
    // Same storage slot the old "favourite locations" used, so saved hearts survive.
    readStored<string[]>(STORAGE_KEYS.favouriteStops, []),
  );
  /*
   * The board's pins, with the one-way migration: a browser that has only ever stored the single
   * stop the board was last opened on (`board-stop`, which this app wrote long before the board
   * could hold more than one) starts with that stop pinned, rather than an empty board. The
   * array slot is the truth once it exists — including when it exists and is empty, which is a
   * traveller who unpinned everything and must not be handed their old stop back.
   */
  const [customStopNames, setCustomStopNamesState] = useState<Record<string, string>>(() => {
    const stored = readStored<Record<string, string>>(STORAGE_KEYS.stopNames, {});
    setCustomStopNames(stored);
    return stored;
  });
  const [boardStopIds, setBoardStopIdsState] = useState<string[]>(() => {
    const stored = readStored<string[] | null>(STORAGE_KEYS.boardStopIds, null);
    if (Array.isArray(stored)) return stored;
    const remembered = readStored<string | null>(STORAGE_KEYS.boardStop, null);
    return remembered ? [remembered] : [];
  });
  /*
   * The battery, watched from the first render.
   *
   * `powerModeFor` is the whole rule and it runs in `watchBattery`; this holds the answer. The
   * first reading arrives a microtask after mount, so a phone that opens the app at 8% draws one
   * frame of the full interface and then settles into super saving — worth it, because asking
   * before the first paint would mean holding the app back on an API that may never answer.
   */
  const [power, setPower] = useState<PowerState>(NO_BATTERY);
  useEffect(() => watchBattery(setPower), []);
  const [savedJourneys, setSavedJourneys] = useState<SavedJourney[]>(() =>
    readStored<SavedJourney[]>(STORAGE_KEYS.savedJourneys, []),
  );
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>(() =>
    readStored<RecentSearch[]>(STORAGE_KEYS.recentSearches, []),
  );
  /*
   * A stored layout is brought forward on load: cards that were merged are folded into the card
   * that replaced them, and a duplicate is dropped. Only the merge is done here — an id that no
   * longer exists is left in storage and simply not drawn (`widgetById` filters it), so a card that
   * comes back to the catalogue comes back to the layout it left.
   */
  const [homeWidgets, setHomeWidgets] = useState<string[]>(() =>
    migrateHomeWidgets(readStored<string[]>(STORAGE_KEYS.homeWidgets, DEFAULT_HOME_WIDGETS)),
  );
  const [widgetStations, setWidgetStations] = useState<Record<string, string>>(() =>
    readStored<Record<string, string>>(STORAGE_KEYS.widgetStations, {}),
  );
  /*
   * Not stored, on purpose. Customising is a mode you are in, not a preference: opening the app
   * tomorrow should not start on a screen of − badges.
   */
  const [homeEditing, setHomeEditing] = useState(false);
  const [homeMenuOpen, setHomeMenuOpen] = useState(false);
  /*
   * No search is restored on a new visit.
   *
   * This used to read `STORAGE_KEYS.lastSearch` out of localStorage and hand the previous
   * session's From/To back to the planner, so the card opened with two stops nobody had
   * chosen that visit ("The 2 locations shouldn't stay here from a previous visit"). A search
   * belongs to the visit that ran it: the planner, the results screen and every widget read
   * this state, so starting it at null makes all of them open empty, each with its own honest
   * empty state — the results screen already says "No search has been run in this browser yet",
   * and the recent-searches widget is where a previous search is offered back, deliberately,
   * one tap away. History you asked to keep; prefilling is history you did not.
   */
  const [search, setSearch] = useState<PlannerSearchState | null>(null);
  const [locationConsent, setLocationConsent] = useState<LocationConsent>(() =>
    readStored<LocationConsent>(STORAGE_KEYS.locationConsent, 'unknown'),
  );
  const [userLocation, setUserLocation] = useState<UserLocation | null>(() =>
    readStored<UserLocation | null>(STORAGE_KEYS.locationFix, null),
  );
  /*
   * The approximate estimate is read from its cache and then refreshed once, whether or not the
   * device ever answers — the order was "the IP call gets made if you decline or accept location
   * both", and having it ready is what makes it a fallback rather than a second question. The
   * cache is a day old at most, so this is one request per browser per day, not one per visit.
   */
  const [approximateLocation, setApproximateLocation] = useState<ApproximateLocation | null>(() =>
    readFreshApproximateLocation(),
  );
  /*
   * Whether the estimate has been asked for and has not answered yet, so a screen can *wait* for
   * it instead of answering "there is no location" for a moment and then correcting itself. The
   * stop picker's closest-stops section reads it; without it that section would open as the
   * popular-stops fallback and swap under the traveller's thumb half a second later.
   */
  const [approximateLocationPending, setApproximateLocationPending] = useState(approximateLocation === null);
  useEffect(() => {
    /*
     * Super saving does not spend a request — nor wake the radio for one — on a convenience.
     * The estimate only ranks "closest stops" lists; a traveller watching a 6% battery wants the
     * departure board, not a nicer ordering of a picker. The mode is read here rather than in a
     * dependency on the whole state so that a level change (which arrives every percent) cannot
     * re-run a request that is already in flight; leaving super re-runs it, because `mode` is in
     * the list.
     */
    if (power.mode === 'super') {
      setApproximateLocationPending(false);
      return undefined;
    }
    if (approximateLocation) return undefined;
    let cancelled = false;
    void fetchApproximateLocation().then((fix) => {
      if (cancelled) return;
      if (fix) setApproximateLocation(fix);
      setApproximateLocationPending(false);
    });
    return () => {
      cancelled = true;
    };
  }, [approximateLocation, power.mode]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const sessionJourneys = useRef(new Map<string, Journey>());
  /*
   * `pushToast` is handed to call sites all over the app and must keep one identity, so it reads
   * the live language and settings out of refs instead of taking them as dependencies.
   */
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  /* ------------------------------------------------------------- persistence */
  useEffect(() => writeStored(STORAGE_KEYS.settings, settings), [settings]);
  useEffect(() => writeStored(STORAGE_KEYS.preferences, preferences), [preferences]);
  useEffect(() => writeStored(STORAGE_KEYS.favouriteStops, favouriteStopIds), [favouriteStopIds]);
  useEffect(() => writeStored(STORAGE_KEYS.boardStopIds, boardStopIds), [boardStopIds]);
  useEffect(() => {
    writeStored(STORAGE_KEYS.stopNames, customStopNames);
    /* The label helpers read this map directly, so it is handed over on every change — a rename
       is a render out, not a reload. */
    setCustomStopNames(customStopNames);
  }, [customStopNames]);
  useEffect(() => writeStored(STORAGE_KEYS.savedJourneys, savedJourneys), [savedJourneys]);
  useEffect(() => writeStored(STORAGE_KEYS.recentSearches, recentSearches), [recentSearches]);
  useEffect(() => writeStored(STORAGE_KEYS.homeWidgets, homeWidgets), [homeWidgets]);
  useEffect(() => writeStored(STORAGE_KEYS.widgetStations, widgetStations), [widgetStations]);
  useEffect(() => writeStored(STORAGE_KEYS.locationConsent, locationConsent), [locationConsent]);
  useEffect(() => writeStored(STORAGE_KEYS.locationFix, userLocation), [userLocation]);

  /* ------------------------------------------- settings -> document adapters */
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.density = settings.density === 'compact' ? 'compact' : 'comfortable';
    root.dataset.contrast = settings.highContrast ? 'high' : 'normal';
    root.dataset.motion = settings.reduceMotion ? 'reduced' : 'full';
  }, [settings.density, settings.highContrast, settings.reduceMotion]);

  /*
   * Battery saving is drawn by the stylesheet, so the mode is written where CSS can read it — one
   * attribute, exactly like the motion switch above, and the whole of the reduction lives in
   * `styles/base.css` and two rules in `components.css`. `data-motion` and this are independent on
   * purpose: asking for less motion is a preference, a low battery is a fact, and either can be
   * true without the other.
   */
  useEffect(() => {
    document.documentElement.dataset.power = power.mode;
  }, [power.mode]);

  /*
   * Appearance. `system` follows the device and keeps following it — a traveller who leaves the
   * setting alone gets the machine's own answer, and the machine can change its mind at dusk
   * without a reload — while an explicit light or dark is written and left alone.
   *
   * The resolution is **state, not an effect-local variable**, so the appearance that is drawn and
   * the appearance any screen *says* is on come from one expression. The settings screen has to
   * name it ("Dark — from your device"), and a second copy of this rule inside that card would be
   * a claim about the interface rather than the interface: correct today, and free to drift the
   * moment either line changed.
   */
  const [systemDark, setSystemDark] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches,
  );

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onSystemChange = () => setSystemDark(media.matches);
    media.addEventListener('change', onSystemChange);
    return () => media.removeEventListener('change', onSystemChange);
  }, []);

  const appearance: 'light' | 'dark' =
    settings.theme === 'system' ? (systemDark ? 'dark' : 'light') : settings.theme;

  useEffect(() => {
    document.documentElement.dataset.theme = appearance;
  }, [appearance]);

  /*
   * The selection colour, written where `::selection` reads it.
   *
   * Keyed to the appearance as well as to the setting because a named choice resolves *through
   * its token*: coral, butter, sage and the rest are re-declared for dark, and a colour that did
   * not follow the theme would be the one part of the page ignoring it. The theme attribute is
   * written by the effect above, which runs first, so the tokens read here are the new ones.
   */
  /*
   * Both effects below read the palette **for the appearance being drawn**, not the light one:
   * each appearance keeps its own page, widget and selection colours (`lib/palette.ts`), and the
   * appearance is the key that decides which half is in force.
   */
  const palette = paletteFor(settings, appearance);

  useEffect(() => {
    applySelection(palette.selectionColor, palette.selectionCustom);
  }, [palette.selectionColor, palette.selectionCustom, appearance]);

  /*
   * The page's colour and the widgets' colour — two choices, each derived into a palette.
   *
   * Keyed to the appearance for the same reason the selection is: "readable" depends on which ink
   * is in force, so the same navy washes the page in light and fills the cards in dark, and the
   * ink ramp, the accent and the map's cut are all measured again. The theme attribute is written
   * by the effect above, so the tokens read here are the new ones. Raised contrast is in the list
   * for the same reason: it strengthens the inks the measurement is made against.
   */
  useEffect(() => {
    applyBackground({
      background: settings.background,
      backgroundColour: palette.backgroundColour,
      backgroundImage: settings.backgroundImage,
      /* Where in the picture the frame sits, so a screen of another shape keeps the subject in
         view (`lib/photoCrop.ts`, `cropFocus`). */
      backgroundCrop: settings.backgroundCrop,
      cardTreatment: settings.cardTreatment,
      primaryColour: palette.primaryColour,
      selectionColour: palette.selectionColor,
      selectionCustom: palette.selectionCustom,
      /* The ramp is derived at two strengths (see `lib/background.ts`): with a page colour in force
         the raised-contrast tokens in `tokens.css` are beaten on source order, so the setting has to
         reach the derivation itself or the switch does nothing. */
      highContrast: settings.highContrast,
    });
  }, [
    settings.background,
    palette.backgroundColour,
    settings.backgroundImage,
    settings.backgroundCrop,
    settings.cardTreatment,
    palette.primaryColour,
    palette.selectionColor,
    palette.selectionCustom,
    appearance,
    settings.highContrast,
  ]);

  /* The document's own language, so screen readers, hyphenation and the browser's spelling all
     agree with the interface. */
  useEffect(() => {
    document.documentElement.lang = settings.language;
  }, [settings.language]);


  /* -------------------------------------------------------------- journey planner */
  const journeys = useMemo(() => {
    if (!search) return [];
    return planJourneys(
      { ...search.query, preferences },
      { windowOffsetMinutes: search.windowOffsetMinutes },
    );
  }, [search, preferences]);

  useEffect(() => {
    journeys.forEach((journey) => sessionJourneys.current.set(journey.id, journey));
  }, [journeys]);

  const pushToast = useCallback((message: string, tone: Toast['tone'] = 'default') => {
    toastCounter += 1;
    const id = `toast-${toastCounter}`;
    const text = translate(settingsRef.current.language, message);
    setToasts((current) => [...current, { id, message: text, tone }].slice(-3));
    window.setTimeout(() => setToasts((current) => current.filter((t) => t.id !== id)), 3600);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const requestLocation = useCallback(
    () =>
      new Promise<UserLocation>((resolve, reject) => {
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
          setLocationConsent('denied');
          reject(new Error('This browser cannot provide a location.'));
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const fix: UserLocation = {
              lat: position.coords.latitude,
              lon: position.coords.longitude,
              accuracy: Math.round(position.coords.accuracy),
              at: Date.now(),
            };
            setUserLocation(fix);
            setLocationConsent('granted');
            resolve(fix);
          },
          () => {
            setLocationConsent('denied');
            reject(new Error('Location access was not granted.'));
          },
          /*
           * `maximumAge: 0` because every caller of this is an explicit tap: "Use my current
           * location", asked twice from two places, has to answer with where the device is now.
           * A minute-old cached position used to be handed back for up to a minute, which for a
           * traveller on the move is a fix from a street they have already left — and a coarse
           * cached reading is also what turns a street address into nothing more than a city
           * name, because the lookup is then naming a point hundreds of metres from where they
           * stand. High accuracy and no reuse is the honest pair for a button that says "now".
           */
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
        );
      }),
    [],
  );

  const recordSearch = useCallback((query: SearchQuery) => {
    setRecentSearches((current) => {
      const id = searchEntryId(query);
      const entry: RecentSearch = { id, query, at: Date.now() };
      return [entry, ...current.filter((item) => item.id !== id)].slice(0, 12);
    });
  }, []);

  /*
   * Searching is not saving.
   *
   * `startSearch` used to write every query it was given into the search history, so simply
   * planning a journey — and re-planning it from "Try one hour later", from a favourite, from a
   * recent search, or from the alerts list's own re-run — left an entry behind in this browser and
   * in the Recent searches widget and the settings manifest, without ever being asked ("it keeps
   * saving the journey you searched, even when you leave the results"). A search now has to be
   * kept: `keepSearch` is that act, and the results screen is where it is offered.
   */
  const startSearch = useCallback((query: SearchQuery) => {
    setSearch({ query, windowOffsetMinutes: 0, sortMode: 'best', filter: DEFAULT_RESULTS_FILTER });
  }, []);

  /*
   * One rule for "nearest me", in one place: the device's own fix wins, and the approximate
   * estimate is what is left when there is no usable one. Every screen that sorts by distance
   * reads this, so they cannot disagree about which answer is the better one.
   */
  const nearestOrigin = useMemo<NearestOrigin | null>(() => {
    if (userLocation) return { lat: userLocation.lat, lon: userLocation.lon, source: 'device' };
    if (approximateLocation) return { lat: approximateLocation.lat, lon: approximateLocation.lon, source: 'ip' };
    return null;
  }, [userLocation, approximateLocation]);

  const value: AppContextValue = {
    settings,
    updateSettings: (patch) => setSettings((current) => ({ ...current, ...patch })),
    resetSettings: () => setSettings(DEFAULT_SETTINGS),
    appearance,
    power,

    preferences,
    updatePreferences: (patch) => setPreferences((current) => ({ ...current, ...patch })),
    resetPreferences: () => setPreferences(DEFAULT_PREFERENCES),

    favouriteStopIds,
    isFavourite: (stopId) => favouriteStopIds.includes(stopId),
    /*
     * No toast. The heart fills when it is a favourite and empties when it is not — the
     * traveller's own example of a message announcing something the control they just touched
     * had already said. The stop also moves to the top of the stops list, which is the second half
     * of what the message was claiming.
     */
    toggleFavourite: (stopId) => {
      let added = false;
      setFavouriteStopIds((current) => {
        if (current.includes(stopId)) return current.filter((id) => id !== stopId);
        added = true;
        return [stopId, ...current];
      });
      return added;
    },

    boardStopIds,
    isOnBoard: (stopId) => boardStopIds.includes(stopId),
    /*
     * Appended, not prepended: the boards on the departures page follow the order the stops were
     * pinned in, which is the order the traveller built. Removal is the same one-way filter.
     */
    toggleBoardStop: (stopId) => {
      let added = false;
      setBoardStopIdsState((current) => {
        if (current.includes(stopId)) return current.filter((id) => id !== stopId);
        added = true;
        return [...current, stopId];
      });
      return added;
    },
    setBoardStops: (stopIds) => setBoardStopIdsState([...new Set(stopIds)]),

    customStopNames,
    renameStop: (stopId, name) => {
      const trimmed = name.trim().slice(0, 40);
      setCustomStopNamesState((current) => {
        const next = { ...current };
        if (trimmed) next[stopId] = trimmed;
        else delete next[stopId];
        return next;
      });
    },

    savedJourneys,
    isJourneySaved: (signature) => savedJourneys.some((item) => item.signature === signature),
    saveJourney: (journey, query, windowOffsetMinutes) => {
      setSavedJourneys((current) => {
        const existing = current.find((item) => item.signature === journey.signature);
        if (existing) return current.filter((item) => item.signature !== journey.signature);
        const entry: SavedJourney = {
          id: journey.id,
          signature: journey.signature,
          title: `${stopLabel(query.fromStopId)} → ${stopLabel(query.toStopId)}`,
          savedAt: Date.now(),
          query,
          journey,
          windowOffsetMinutes,
        };
        return [entry, ...current].slice(0, 40);
      });
      /* No toast: the button's own glyph fills (`check` on a saved journey, `bookmark` when it is
         not) and the entry appears in or leaves the Favourited journeys widget. */
    },
    /* Likewise: the row leaves the list it was in. */
    removeSavedJourney: (id) => {
      setSavedJourneys((current) => current.filter((item) => item.id !== id));
    },

    recentSearches,
    keepSearch: recordSearch,
    /* And these two: the list the control sits next to is the confirmation. */
    removeRecentSearch: (id) => {
      setRecentSearches((current) => current.filter((item) => item.id !== id));
    },
    clearRecentSearches: () => {
      setRecentSearches([]);
    },

    search,
    journeys,
    startSearch,
    updateSearchQuery: (patch) => {
      setSearch((current) => {
        if (!current) return current;
        const query = { ...current.query, ...patch };
        return { ...current, query };
      });
    },
    shiftWindow: (deltaMinutes) => {
      setSearch((current) =>
        current
          ? { ...current, windowOffsetMinutes: Math.max(-240, Math.min(240, current.windowOffsetMinutes + deltaMinutes)) }
          : current,
      );
    },
    setSortMode: (mode) => setSearch((current) => (current ? { ...current, sortMode: mode } : current)),
    setFilter: (patch) =>
      setSearch((current) => (current ? { ...current, filter: { ...current.filter, ...patch } } : current)),
    resetFilter: () => setSearch((current) => (current ? { ...current, filter: DEFAULT_RESULTS_FILTER } : current)),
    clearSearch: () => setSearch(null),
    findJourney: (journeyId) => {
      if (!journeyId) return undefined;
      return (
        sessionJourneys.current.get(journeyId) ??
        journeys.find((j) => j.id === journeyId) ??
        savedJourneys.find((item) => item.id === journeyId)?.journey
      );
    },

    toasts,
    pushToast,
    dismissToast,

    homeWidgets,
    addHomeWidget: (id) => setHomeWidgets((current) => (current.includes(id) ? current : [...current, id])),
    removeHomeWidget: (id) => {
      if (REQUIRED_WIDGETS.includes(id)) return;
      setHomeWidgets((current) => current.filter((item) => item !== id));
      /*
       * The widget's own station goes with it, and that is the whole of how a different station is
       * chosen: the card that comes back is a new card, and it asks again.
       */
      setWidgetStations((current) => {
        if (!(id in current)) return current;
        const next = { ...current };
        delete next[id];
        return next;
      });
    },
    widgetStations,
    setWidgetStation: (widgetId, stopId) =>
      setWidgetStations((current) => (current[widgetId] === stopId ? current : { ...current, [widgetId]: stopId })),
    /* A move, not a swap: the widget lands in the slot it was dropped on and the ones between
       step along, which is what a home screen does when you drag one icon over another. A slot
       past the end is clamped rather than ignored, because the drop point is always inside the
       grid. Same id, same position → the same array back, so nothing is written for a tap. */
    moveHomeWidget: (id, toIndex) =>
      setHomeWidgets((current) => {
        const from = current.indexOf(id);
        if (from < 0) return current;
        const to = Math.max(0, Math.min(current.length - 1, toIndex));
        if (to === from) return current;
        const next = [...current];
        next.splice(from, 1);
        next.splice(to, 0, id);
        return next;
      }),
    /*
     * A reset also drops the bindings of the widgets it takes away. The layout going back to the
     * default leaves no station-bound card on the screen, and a binding for a card that is not
     * there is a choice the traveller can no longer see — worse, it would answer for the card
     * they add later, which is exactly what this design says must be asked. (Bindings for widgets
     * that survive the reset stay: a reset is a layout, not a deletion.)
     */
    homeEditing,
    setHomeEditing: (editing) => {
      setHomeEditing(editing);
      /* Closing the mode closes anything it opened: a menu that outlives the mode it belongs to
         would be a control for a screen that is no longer being edited. */
      if (!editing) setHomeMenuOpen(false);
    },
    homeMenuOpen,
    setHomeMenuOpen,

    restoreHomeLayout: (ids) => setHomeWidgets(ids),
    /*
     * The reset no longer deletes a chosen station.
     *
     * It did, and the audit's point was that the deletion is what made the reset unrecoverable: a
     * station chosen for a card is the traveller's data, not a layout preference, and a card that
     * comes back should come back as it was (31.2). Removing a card still drops its binding — that
     * is the documented way to rebind it — but resetting the arrangement does not.
     */
    resetHomeWidgets: () => setHomeWidgets(DEFAULT_HOME_WIDGETS),

    locationConsent,
    setLocationConsent,
    userLocation,
    requestLocation,
    approximateLocation,
    approximateLocationPending,
    nearestOrigin,

    resetLocalData: () => {
      clearStored();
      setSettings(DEFAULT_SETTINGS);
      setPreferences(DEFAULT_PREFERENCES);
      setFavouriteStopIds([]);
      setBoardStopIdsState([]);
      setCustomStopNamesState({});
      setHomeWidgets(DEFAULT_HOME_WIDGETS);
      setWidgetStations({});
      setSavedJourneys([]);
      setRecentSearches([]);
      setSearch(null);
      /* `unknown` re-opened the first-visit location sheet in the same frame, so removing
         everything read as the app forgetting in order to ask again (11.11). The answer was
         already given; Settings is where it is changed. */
      setLocationConsent('denied');
      setUserLocation(null);
      /* The estimate goes with everything else: it is this browser's data, and "remove all" is
         the one instruction that has to mean all of it. */
      setApproximateLocation(null);
      pushToast('All locally stored data has been removed');
    },
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/**
 * How a search is identified in this browser's history: its two ends.
 *
 * In one place because two screens need it to agree: the history writes it, and the results screen
 * asks whether the search it is showing is already in there — a second spelling of this string
 * would make "kept" mean nothing.
 *
 * A place is named by what the traveller named it, not by the stop it resolved to: an address and
 * the station nearest to it share a stop id, so "Rijksstraatweg 9, Haarlem → Haarlem" and the
 * return trip had the same id and one of them silently read as already saved.
 */
export function searchEntryId(query: SearchQuery): string {
  return `${query.fromLabel ?? query.fromStopId}->${query.toLabel ?? query.toStopId}`;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside <AppProvider>');
  return context;
}
