import type { ResultsFilter, SearchQuery } from '../data/journeyEngine';
import type { Journey, SortMode, TimeMode } from '../data/types';

/** Light, dark, or whatever the device is set to. */
export type ThemeChoice = 'system' | 'light' | 'dark';

/** The languages the interface is written in. */
export type Language = 'en' | 'nl';

export interface Settings {
  /** The shape of this object when it was last written, so a changed default can reach a
      browser that already stored the old one. See `migrateSettings`. */
  version: number;
  /** Which appearance to draw: the two the app ships, or whatever the device asks for. */
  theme: ThemeChoice;
  /** The language the interface is written in. */
  language: Language;
  /** 24-hour ("14:05") or 12-hour ("2:05 pm") clock. */
  timeFormat: '24h' | '12h';
  /** Fixed dd-mm-yyyy dates or descriptive dates ("Tuesday 14 October"). */
  dateFormat: 'short' | 'long';
  /** Row and card spacing. */
  density: 'comfortable' | 'compact';
  /** Strengthens ink and hairline contrast. */
  highContrast: boolean;
  /** Disables spring/tactile transforms. */
  reduceMotion: boolean;
  /** Which option the planner starts with. */
  defaultTimeMode: TimeMode;
  /** Prefilled origin for the planner. */
  defaultOriginStopId: string | null;
}

export const SETTINGS_VERSION = 2;

export const DEFAULT_SETTINGS: Settings = {
  version: SETTINGS_VERSION,
  theme: 'system',
  language: 'en',
  timeFormat: '24h',
  dateFormat: 'long',
  density: 'comfortable',
  highContrast: false,
  reduceMotion: false,
  defaultTimeMode: 'depart',
  defaultOriginStopId: null,
};

/**
 * How stored settings are brought forward.
 *
 * One step per version, and the stamp that makes a changed default reach a browser that already
 * stored the old one. It has one step behind it and none in front of it now: `boardAutoRefresh`
 * was moved from its old default of `0` (off) up to `5` here, and the setting itself has since
 * been **removed** — the board is a live screen at a fixed 5 seconds, with no control to slow it
 * down (see `BOARD_REFRESH_SECONDS` in `DeparturesPage`). A stale `boardAutoRefresh` left in a
 * browser's stored settings is simply ignored.
 */
export function migrateSettings(stored: Partial<Settings>): Partial<Settings> {
  return { ...stored, version: SETTINGS_VERSION };
}

export interface SavedJourney {
  id: string;
  signature: string;
  title: string;
  savedAt: number;
  query: SearchQuery;
  journey: Journey;
  windowOffsetMinutes: number;
}

export interface RecentSearch {
  id: string;
  query: SearchQuery;
  at: number;
}

export interface PlannerSearchState {
  query: SearchQuery;
  windowOffsetMinutes: number;
  sortMode: SortMode;
  filter: ResultsFilter;
}

/**
 * A widget's width, in columns of the home screen's 12-column grid: 4 is a third, 6 a half, 8
 * two-thirds, 12 the full width. Every widget offers all four, but only above its own device
 * threshold — each widget declares the narrowest screen at which resizing helps it (see
 * `resizeFrom` in `widgets/registry.tsx`), and below that it is drawn full width with no corner.
 */
export type WidgetWidth = 4 | 6 | 8 | 12;

/**
 * A widget's height, as a tier rather than a number of pixels: how much the widget **shows**.
 * A compact card lists two rows, a standard one four, a tall one everything — the card always
 * ends where its content ends, so nothing is clipped and nothing scrolls inside a card.
 */
export type WidgetTier = 'compact' | 'standard' | 'tall';

export interface WidgetSize {
  w: WidgetWidth;
  h: WidgetTier;
}

/** Whether the traveller has answered the location prompt (asked once, on first open). */
export type LocationConsent = 'unknown' | 'granted' | 'denied';

export interface UserLocation {
  lat: number;
  lon: number;
  /** Reported accuracy of the fix, in metres. */
  accuracy: number;
  /** Epoch milliseconds when the fix was taken. */
  at: number;
}
