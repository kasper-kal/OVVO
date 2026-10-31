/**
 * **A switchboard for the things that normally look after themselves.**
 *
 * The weather layer (`layout/Atmosphere`) answers to the date and the forecast, which means the
 * only honest way to look at the fireworks in June was to wait until December. Developer mode adds
 * one panel that overrides that answer — a mood held here, above the calendar and above the sky —
 * and three buttons for the jokes that need a gesture, so each of them can be seen on demand.
 *
 * Nothing in this file is stored. Reloading the page puts the atmosphere back under the calendar's
 * control, which is the right default for a switch that exists to check a drawing: a simulation
 * left on would be an app that rains in July because somebody closed a panel in January.
 *
 * The three events are the jokes' own front doors. They are dispatched on the window rather than
 * called through a store because each one lives where the gesture lives — the tram belongs to the
 * dock, the punch to the journey's platform tags, the grey row to the search field — and a button
 * in another screen should not have to hold a reference into any of them.
 */

import type { Mood } from './atmosphere';

/** `null` — no simulation, so the calendar and the forecast are in charge again. */
export type Simulation = Mood | null;

let forcedMood: Simulation = null;
const listeners = new Set<() => void>();

export function getForcedMood(): Simulation {
  return forcedMood;
}

export function setForcedMood(next: Simulation): void {
  forcedMood = next;
  listeners.forEach((listener) => listener());
}

/** The store shape `useSyncExternalStore` wants: a subscribe that returns its own removal. */
export function subscribeSimulation(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const TRAM_EVENT = 'ovvo:tram';
export const PUNCH_EVENT = 'ovvo:punch';
export const NEIGHBOURS_EVENT = 'ovvo:neighbours';

export function replayTram(): void {
  window.dispatchEvent(new Event(TRAM_EVENT));
}

export function punchTickets(): void {
  window.dispatchEvent(new Event(PUNCH_EVENT));
}

export function showNeighbours(): void {
  window.dispatchEvent(new Event(NEIGHBOURS_EVENT));
}
