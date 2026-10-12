import type { ResultsFilter, SearchQuery } from '../data/journeyEngine';
import type { Journey, SortMode, TimeMode } from '../data/types';

export interface Settings {
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
  /** Show or hide the "simulated data" badges across the prototype. */
  showDemoBadges: boolean;
  /** Departure board auto-refresh interval in seconds (0 = off). */
  boardAutoRefresh: 0 | 30 | 60;
  /** Which option the planner starts with. */
  defaultTimeMode: TimeMode;
  /** Prefilled origin for the planner. */
  defaultOriginStopId: string | null;
}

export const DEFAULT_SETTINGS: Settings = {
  timeFormat: '24h',
  dateFormat: 'long',
  density: 'comfortable',
  highContrast: false,
  reduceMotion: false,
  showDemoBadges: true,
  boardAutoRefresh: 0,
  defaultTimeMode: 'depart',
  defaultOriginStopId: null,
};

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
