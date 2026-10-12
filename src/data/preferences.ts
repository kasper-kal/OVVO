import type { TravelMode } from './types';

/** Travel preferences — used both by the planner form and the results engine. */
export interface Preferences {
  /** Modes the traveller is willing to use. */
  allowedModes: TravelMode[];
  /** Modes to avoid even when they are allowed. */
  avoidedModes: TravelMode[];
  maxWalkingMinutes: number;
  maxTransfers: number;
  /** Accessibility */
  stepFreeOnly: boolean;
  needAssistance: boolean;
  lowFloorBoarding: boolean;
  /** Trade-offs */
  preferFewerTransfers: boolean;
  preferLessWalking: boolean;
  /** Bicycle */
  bikeMode: 'none' | 'foldable' | 'ovFiets' | 'own';
  allowBikeOnBoard: boolean;
}

export const PT_MODES: Exclude<TravelMode, 'walk' | 'bike'>[] = ['train', 'bus', 'tram', 'metro', 'ferry'];

export const TRANSFER_OPTIONS = [
  { value: 0, label: 'No transfers' },
  { value: 1, label: 'Maximum 1 transfer' },
  { value: 2, label: 'Maximum 2 transfers' },
  { value: 3, label: 'Maximum 3 transfers' },
  { value: 4, label: 'No limit' },
];

export const WALK_OPTIONS = [
  { value: 5, label: 'Up to 5 minutes' },
  { value: 10, label: 'Up to 10 minutes' },
  { value: 15, label: 'Up to 15 minutes' },
  { value: 20, label: 'Up to 20 minutes' },
  { value: 30, label: 'Up to 30 minutes' },
  { value: 45, label: 'No limit' },
];

export const BIKE_OPTIONS: { value: Preferences['bikeMode']; label: string; hint: string }[] = [
  { value: 'none', label: 'No bicycle', hint: 'Walking access only.' },
  { value: 'foldable', label: 'Folding bicycle', hint: 'A folding bicycle is taken on board free of charge.' },
  { value: 'ovFiets', label: 'Rental bicycle (OV-fiets)', hint: 'Rent a bicycle at the station for the last part of the journey.' },
  { value: 'own', label: 'Own bicycle', hint: 'The prototype adds a bicycle leg where a marked bicycle path exists.' },
];

export const DEFAULT_PREFERENCES: Preferences = {
  allowedModes: ['train', 'bus', 'tram', 'metro', 'ferry'],
  avoidedModes: [],
  maxWalkingMinutes: 20,
  maxTransfers: 2,
  stepFreeOnly: false,
  needAssistance: false,
  lowFloorBoarding: false,
  preferFewerTransfers: false,
  preferLessWalking: false,
  bikeMode: 'none',
  allowBikeOnBoard: true,
};

export function describePreferences(preferences: Preferences): string[] {
  const parts: string[] = [];
  parts.push(
    preferences.allowedModes.length
      ? `Modes: ${preferences.allowedModes.join(', ')}`
      : 'No transport modes selected',
  );
  if (preferences.avoidedModes.length) parts.push(`Avoiding: ${preferences.avoidedModes.join(', ')}`);
  parts.push(`Walking up to ${preferences.maxWalkingMinutes} min`);
  parts.push(preferences.maxTransfers >= 4 ? 'Unlimited transfers' : `Max ${preferences.maxTransfers} transfer(s)`);
  if (preferences.stepFreeOnly) parts.push('Step-free route required');
  if (preferences.needAssistance) parts.push('Assistance requested');
  if (preferences.lowFloorBoarding) parts.push('Low-floor boarding preferred');
  if (preferences.preferFewerTransfers) parts.push('Prefers fewer transfers');
  if (preferences.preferLessWalking) parts.push('Prefers less walking');
  if (preferences.bikeMode !== 'none') parts.push(`Bicycle: ${preferences.bikeMode}`);
  return parts;
}
