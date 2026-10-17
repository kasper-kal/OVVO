import { MODE_LABELS } from '../lib/format';
import type { PublicMode, TravelMode } from './types';

/**
 * Travel preferences — used both by the planner form and the results engine.
 *
 * One list of modes: a mode is either allowed or not used at all. The separate
 * "avoid" list was dropped because allowing and avoiding had the identical
 * effect on the results.
 */
export interface Preferences {
  /** Modes the traveller is willing to use, including walking and cycling. */
  allowedModes: TravelMode[];
  maxWalkingMinutes: number;
  maxTransfers: number;
  /** Trade-offs */
  preferFewerTransfers: boolean;
  preferLessWalking: boolean;
  /**
   * How the traveller reaches the first stop and leaves the last one. Walking and cycling
   * are the app's two access modes (see `ACCESS_MODE_HINTS`), and they are answered at the
   * two ends of the journey rather than as another allowed/not-allowed mode — the two
   * chips on the results screen. A journey whose access leg is a bicycle one is only
   * offered when the departure end asks for it, and the same at the arrival end.
   */
  accessFrom: AccessMode;
  accessTo: AccessMode;
}


/** Every mode the traveller can switch on or off, in the order shown in the UI. */
export const MODE_OPTIONS: TravelMode[] = ['train', 'bus', 'tram', 'metro', 'ferry', 'walk', 'bike'];

/** Walking and cycling are access modes, so they are described differently. */
export const ACCESS_MODE_HINTS: Partial<Record<TravelMode, string>> = {
  walk: 'Walk to, from and between stops.',
  bike: 'Cycle short access and egress legs where a marked bicycle path exists.',
};

export const PT_MODES: PublicMode[] = ['train', 'bus', 'tram', 'metro', 'ferry'];

/** The personal modes that can reach or leave a stop. */
export type AccessMode = 'walk' | 'bike';

export const ACCESS_MODES: { value: AccessMode; label: string; hint: string }[] = [
  { value: 'walk', label: 'Walking', hint: ACCESS_MODE_HINTS.walk ?? '' },
  { value: 'bike', label: 'Bicycle', hint: ACCESS_MODE_HINTS.bike ?? '' },
];

/** The name shown for a mode. Kept as a function so every call site reads the same. */
export function modeLabel(mode: TravelMode): string {
  return MODE_LABELS[mode];
}

export const TRANSFER_OPTIONS = [
  { value: 0, label: 'No transfers' },
  { value: 1, label: 'Maximum 1 transfer' },
  { value: 2, label: 'Maximum 2 transfers' },
  { value: 3, label: 'Maximum 3 transfers' },
  { value: 4, label: 'No limit' },
];

export const MAX_WALKING_MINUTES = 45;

export const DEFAULT_PREFERENCES: Preferences = {
  allowedModes: ['train', 'bus', 'tram', 'metro', 'ferry', 'walk', 'bike'],
  maxWalkingMinutes: 20,
  maxTransfers: 2,
  preferFewerTransfers: false,
  preferLessWalking: false,
  // Walking, unless the traveller says otherwise: the planner used to put a bicycle leg at
  // the start or the end of a quarter of its journeys because allowing cycling implied
  // cycling. Cycling is now opt-in, per end.
  accessFrom: 'walk',
  accessTo: 'walk',
};

export function describePreferences(
  preferences: Preferences,
  /** The interface's own text lookup, injected so this stays a pure data module. */
  say: (key: string) => string = (key) => key,
): string[] {
  const parts: string[] = [];
  parts.push(
    preferences.allowedModes.length
      ? say('Modes: {list}').replace('{list}', preferences.allowedModes.map((mode) => say(modeLabel(mode))).join(', '))
      : say('No transport modes selected'),
  );
  if (!preferences.allowedModes.includes('walk')) parts.push(say('Walking turned off'));
  parts.push(
    preferences.maxWalkingMinutes >= MAX_WALKING_MINUTES
      ? say('No walking limit')
      : say('Walking up to {minutes} min').replace('{minutes}', String(preferences.maxWalkingMinutes)),
  );
  parts.push(
    preferences.maxTransfers >= 4
      ? say('Unlimited transfers')
      : say(preferences.maxTransfers === 1 ? 'Max {count} transfer' : 'Max {count} transfers').replace(
          '{count}',
          String(preferences.maxTransfers),
        ),
  );
  if (preferences.preferFewerTransfers) parts.push(say('Prefers fewer transfers'));
  if (preferences.preferLessWalking) parts.push(say('Prefers less walking'));
  return parts;
}
