import { DISRUPTIONS } from '../data/disruptions';
import type { Disruption } from '../data/types';
import { useDev } from './dev';

/** An empty list that keeps one identity, so a calm day does not read as a new list every frame. */
const NONE: Disruption[] = [];

/**
 * **The alerts on screen right now.**
 *
 * The same two questions the panel answers about the list — a calm day, or one alert at a time —
 * asked of the screens. It reads the same store the panel writes, so a switch there redraws every
 * screen that lists an alert, and `disruptions()` in `data/disruptions` answers the same way for the
 * code that is not a component (boards, journeys, the shell's own count).
 */
export function useDisruptions(): Disruption[] {
  const dev = useDev();
  if (dev.calm) return NONE;
  if (dev.alertId) return DISRUPTIONS.filter((alert) => alert.id === dev.alertId);
  return DISRUPTIONS;
}
