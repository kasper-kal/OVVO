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
  favourites: 'favourites',
  savedJourneys: 'saved-journeys',
  recentSearches: 'recent-searches',
  lastSearch: 'last-search',
} as const;
