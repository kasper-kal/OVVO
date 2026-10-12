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
import type { Journey, SortMode } from '../data/types';
import { clearStored, readStored, STORAGE_KEYS, writeStored } from '../lib/storage';
import {
  DEFAULT_SETTINGS,
  type PlannerSearchState,
  type RecentSearch,
  type SavedJourney,
  type Settings,
} from './types';

export interface Toast {
  id: string;
  message: string;
  tone?: 'default' | 'success' | 'warning';
}

interface AppContextValue {
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  resetSettings: () => void;

  preferences: Preferences;
  updatePreferences: (patch: Partial<Preferences>) => void;
  resetPreferences: () => void;

  favouriteStopIds: string[];
  isFavourite: (stopId: string) => boolean;
  toggleFavourite: (stopId: string) => boolean;

  savedJourneys: SavedJourney[];
  isJourneySaved: (signature: string) => boolean;
  saveJourney: (journey: Journey, query: SearchQuery, windowOffsetMinutes: number) => void;
  removeSavedJourney: (id: string) => void;

  recentSearches: RecentSearch[];
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
}

const AppContext = createContext<AppContextValue | null>(null);

let toastCounter = 0;

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => ({
    ...DEFAULT_SETTINGS,
    ...readStored<Partial<Settings>>(STORAGE_KEYS.settings, {}),
  }));
  const [preferences, setPreferences] = useState<Preferences>(() => ({
    ...DEFAULT_PREFERENCES,
    ...readStored<Partial<Preferences>>(STORAGE_KEYS.preferences, {}),
  }));
  const [favouriteStopIds, setFavouriteStopIds] = useState<string[]>(() =>
    readStored<string[]>(STORAGE_KEYS.favourites, []),
  );
  const [savedJourneys, setSavedJourneys] = useState<SavedJourney[]>(() =>
    readStored<SavedJourney[]>(STORAGE_KEYS.savedJourneys, []),
  );
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>(() =>
    readStored<RecentSearch[]>(STORAGE_KEYS.recentSearches, []),
  );
  const [search, setSearch] = useState<PlannerSearchState | null>(() => {
    const stored = readStored<SearchQuery | null>(STORAGE_KEYS.lastSearch, null);
    if (!stored || !stored.fromStopId || !stored.toStopId) return null;
    return {
      query: { ...stored, preferences: { ...DEFAULT_PREFERENCES, ...stored.preferences } },
      windowOffsetMinutes: 0,
      sortMode: 'best',
      filter: DEFAULT_RESULTS_FILTER,
    };
  });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const sessionJourneys = useRef(new Map<string, Journey>());

  /* ------------------------------------------------------------- persistence */
  useEffect(() => writeStored(STORAGE_KEYS.settings, settings), [settings]);
  useEffect(() => writeStored(STORAGE_KEYS.preferences, preferences), [preferences]);
  useEffect(() => writeStored(STORAGE_KEYS.favourites, favouriteStopIds), [favouriteStopIds]);
  useEffect(() => writeStored(STORAGE_KEYS.savedJourneys, savedJourneys), [savedJourneys]);
  useEffect(() => writeStored(STORAGE_KEYS.recentSearches, recentSearches), [recentSearches]);
  useEffect(() => {
    if (search) writeStored(STORAGE_KEYS.lastSearch, search.query);
  }, [search]);

  /* ------------------------------------------- settings -> document adapters */
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.density = settings.density === 'compact' ? 'compact' : 'comfortable';
    root.dataset.contrast = settings.highContrast ? 'high' : 'normal';
    root.dataset.motion = settings.reduceMotion ? 'reduced' : 'full';
  }, [settings.density, settings.highContrast, settings.reduceMotion]);

  /* ------------------------------------------------------------ demo planner */
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
    setToasts((current) => [...current, { id, message, tone }].slice(-3));
    window.setTimeout(() => setToasts((current) => current.filter((t) => t.id !== id)), 3600);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const recordSearch = useCallback((query: SearchQuery) => {
    setRecentSearches((current) => {
      const id = `${query.fromStopId}->${query.toStopId}`;
      const entry: RecentSearch = { id, query, at: Date.now() };
      return [entry, ...current.filter((item) => item.id !== id)].slice(0, 12);
    });
  }, []);

  const startSearch = useCallback(
    (query: SearchQuery) => {
      setSearch({ query, windowOffsetMinutes: 0, sortMode: 'best', filter: DEFAULT_RESULTS_FILTER });
      recordSearch(query);
    },
    [recordSearch],
  );

  const value: AppContextValue = {
    settings,
    updateSettings: (patch) => setSettings((current) => ({ ...current, ...patch })),
    resetSettings: () => setSettings(DEFAULT_SETTINGS),

    preferences,
    updatePreferences: (patch) => setPreferences((current) => ({ ...current, ...patch })),
    resetPreferences: () => setPreferences(DEFAULT_PREFERENCES),

    favouriteStopIds,
    isFavourite: (stopId) => favouriteStopIds.includes(stopId),
    toggleFavourite: (stopId) => {
      let added = false;
      setFavouriteStopIds((current) => {
        if (current.includes(stopId)) return current.filter((id) => id !== stopId);
        added = true;
        return [stopId, ...current];
      });
      pushToast(added ? 'Added to favourite locations' : 'Removed from favourite locations', added ? 'success' : 'default');
      return added;
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
          title: `${query.fromStopId} → ${query.toStopId}`,
          savedAt: Date.now(),
          query,
          journey,
          windowOffsetMinutes,
        };
        return [entry, ...current].slice(0, 40);
      });
      const wasSaved = savedJourneys.some((item) => item.signature === journey.signature);
      pushToast(wasSaved ? 'Journey removed from saved journeys' : 'Journey saved on this device', wasSaved ? 'default' : 'success');
    },
    removeSavedJourney: (id) => {
      setSavedJourneys((current) => current.filter((item) => item.id !== id));
      pushToast('Journey removed from saved journeys');
    },

    recentSearches,
    removeRecentSearch: (id) => {
      setRecentSearches((current) => current.filter((item) => item.id !== id));
      pushToast('Search removed from history');
    },
    clearRecentSearches: () => {
      setRecentSearches([]);
      pushToast('Recent searches cleared');
    },

    search,
    journeys,
    startSearch,
    updateSearchQuery: (patch) => {
      setSearch((current) => {
        if (!current) return current;
        const query = { ...current.query, ...patch };
        writeStored(STORAGE_KEYS.lastSearch, query);
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

    resetLocalData: () => {
      clearStored();
      setSettings(DEFAULT_SETTINGS);
      setPreferences(DEFAULT_PREFERENCES);
      setFavouriteStopIds([]);
      setSavedJourneys([]);
      setRecentSearches([]);
      setSearch(null);
      pushToast('All locally stored prototype data has been removed');
    },
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside <AppProvider>');
  return context;
}
