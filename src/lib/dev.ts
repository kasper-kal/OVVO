import { useSyncExternalStore } from 'react';
import { readStored, writeStored } from './storage';
import { setClockOffset } from './format';
import { setBatteryAbsent, setBatteryOverride } from './power';
import { setRollVariant } from './random';
import { DISRUPTIONS, setDevDisruptions } from '../data/disruptions';

/**
 * **What this browser pretends the device is.**
 *
 * The developer panel's whole job is to answer the questions a real phone asks badly: what does the
 * app do at 4%? On a Sunday in December? With the network gone? Waiting for the battery to drop to
 * the threshold is not a way to test the threshold, so the panel overrides what the app reads and
 * nothing else. Every override feeds the same code the device feeds: the battery goes through
 * `powerModeFor`, the clock goes through the app's own clock helpers, the connection through
 * `useOnline`. There is no second path for testing, so what is tested is what ships.
 *
 * ## Three rules
 *
 * 1. **An override is a lie about a fact, never a setting of its own.** `battery: null` means the
 *    device's own battery, not "off"; `clockOffset: null` means the device's own clock. Switching
 *    the mode off in Settings clears all of it, so a forgotten simulation cannot outlive the switch.
 * 2. **It is remembered across reloads.** A reload is the ordinary way to test a first visit, and a
 *    simulation that vanished on the refresh would be a simulation you cannot test anything with.
 *    It lives in the same store as everything else, so "remove all stored data" takes it too.
 * 3. **It is written where the app already reads.** The battery override is handed to `lib/power`,
 *    the clock offset to `lib/format`, and the two components that ask the browser read the store
 *    directly. No screen knows this module exists beyond the panel itself.
 */

export interface DevOverrides {
  /** 0–1, or null for the device's own battery. */
  battery: number | null;
  charging: boolean;
  /** Milliseconds the app's clock is moved, or null for the device's own time. */
  clockOffset: number | null;
  /** True when the app should behave as if the network is gone; null for the browser's answer. */
  offline: boolean | null;
  /** True when the app should behave as if the browser cannot report a battery at all. */
  noBattery: boolean;
  /** True for a network with nothing wrong with it: every alert gone. */
  calm: boolean;
  /** The one alert the app shows, or null for the whole list. */
  alertId: string | null;
  /** Which drawing of the network's rolls is in force. Zero is the app's own. */
  rollVariant: number;
  /** True when the results hold their loading shape long enough to be looked at. */
  slow: boolean;
  /** The link speed the app believes it has, in megabits per second, or null for no claim. */
  wifiMbps: number | null;
  /** True when every focused control wears the focus ring, not only the keyboard's own. */
  focusRings: boolean;
}

export const NO_OVERRIDES: DevOverrides = {
  battery: null,
  charging: false,
  clockOffset: null,
  offline: null,
  noBattery: false,
  calm: false,
  alertId: null,
  rollVariant: 0,
  slow: false,
  wifiMbps: null,
  focusRings: false,
};

/** The storage slot, read through the same guard as every other slot. */
const KEY = 'dev';

let state: DevOverrides = { ...NO_OVERRIDES, ...readStored<Partial<DevOverrides>>(KEY, {}) };
const listeners = new Set<() => void>();

/**
 * Push the overrides into the two places the app already reads them from.
 *
 * Called once on load, before the first frame, and once per change, so the simulated battery is in
 * force for the first render after a reload rather than arriving a tick later.
 */
function apply(): void {
  setClockOffset(state.clockOffset);
  setBatteryOverride(
    state.battery === null ? null : { level: state.battery, charging: state.charging },
  );
  setBatteryAbsent(state.noBattery);
  setRollVariant(state.rollVariant);
  /*
   * **Nothing wrong with the network, or one thing wrong with it.**
   *
   * Both are the same list the screens read, narrowed before it leaves this module: an empty list
   * for a calm day, a single alert when one is being looked at, and null for the shipped network.
   * The boards and journeys read it through `disruptions()`, so they cannot go on delaying a service
   * for an alert that the alert list no longer shows.
   */
  setDevDisruptions(
    state.calm
      ? []
      : state.alertId
        ? DISRUPTIONS.filter((alert) => alert.id === state.alertId)
        : null,
  );
  /*
   * The focus switch is a stylesheet question, so it is written where the stylesheet reads it — one
   * attribute, the same way the appearance and the battery mode are handed over.
   */
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.focus = state.focusRings ? 'always' : 'normal';
  }
}

function emit(): void {
  listeners.forEach((listener) => listener());
}

export function getDevOverrides(): DevOverrides {
  return state;
}

export function subscribeDev(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Merge a patch, keep it, and let every screen that reads the store redraw. */
export function setDevOverrides(patch: Partial<DevOverrides>): void {
  state = { ...state, ...patch };
  writeStored(KEY, state);
  apply();
  emit();
}

/** Put the device's own facts back, and forget the simulation. */
export function clearDevOverrides(): void {
  state = { ...NO_OVERRIDES };
  writeStored(KEY, state);
  apply();
  emit();
}

/** The overrides, as a hook, for the two components that read the browser themselves. */
export function useDev(): DevOverrides {
  return useSyncExternalStore(subscribeDev, getDevOverrides, getDevOverrides);
}

/* Live from the first import: a reload resumes the simulation before the first frame. */
apply();
