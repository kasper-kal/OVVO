/**
 * Battery saving, decided by the device's own battery.
 *
 * Two steps, both automatic and both reversible:
 *
 *   • **save** at **20% or less** — the movement goes. Every transition and animation in the
 *     stylesheet is cut to nothing (the same thing the reduced-motion switch asks for, without
 *     being a preference), the skeleton shimmer stops shimmering, a search that would have held
 *     its place with a spinner answers at once, and a deep link scrolls instead of gliding.
 *   • **super** at **10% or less** — everything that is not "when does the bus go". No motion, no
 *     frosted glass, no shadows, no network request spent on the convenience location estimate,
 *     and the home screen is drawn with only the cards that answer the question (see
 *     `essential` in `widgets/registry.tsx`).
 *
 * Above the threshold the app goes back exactly as it was: these are states the browser reports,
 * not preferences, so nothing is stored and nothing has to be undone by hand. Plugging the phone
 * in clears the mode immediately — a charge is the one time the app may spend what it likes.
 *
 * ## The thresholds have a little give
 *
 * `level` arrives in 1% steps and flickers while a phone is under load (and some devices report a
 * level a point either side of where they settled). Without hysteresis a phone resting on 20%
 * would enter and leave save mode on consecutive readings — visible as the interface blinking in
 * and out of stillness. So a mode is entered *at* its threshold and left only once the level is
 * two points above it: leave save above 22%, leave super above 12%.
 *
 * ## Not every browser reports a battery
 *
 * `navigator.getBattery` is Chromium's (Chrome, Edge, Opera, Samsung Internet). Safari does not
 * implement it and Firefox removed it, so on those the app simply never enters a mode —
 * `supported` says which happened, and Settings names the fact rather than pretending a mode is
 * on. Nothing here is required for the app to work: every mode is a subtraction from the full
 * interface, so a browser without the API gets the full one.
 */

export type PowerMode = 'off' | 'save' | 'super';

export interface PowerState {
  mode: PowerMode;
  /** The level the battery reported, 0–1, or null when this browser has no battery to report. */
  level: number | null;
  charging: boolean;
  /** False when this browser cannot report a battery at all (Safari, Firefox). */
  supported: boolean;
}

/** Save mode begins here: a fifth of the battery is left. */
export const SAVE_AT = 0.2;

/** Super saving begins here: a tenth. */
export const SUPER_AT = 0.1;

/**
 * How far above a threshold the level must climb before its mode is left, as a fraction of full
 * charge — two percentage points, which is more than the flicker a reading has and less than a
 * step a person would notice.
 */
export const RELEASE_MARGIN = 0.02;

export const NO_BATTERY: PowerState = { mode: 'off', level: null, charging: false, supported: false };

/**
 * Which mode a reading puts the app in, given the mode it was already in.
 *
 * Pure, and separate from the browser call, because the interesting part is the hysteresis — and
 * because it is the one piece of this that can be checked without a device.
 */
export function powerModeFor(previous: PowerMode, level: number | null, charging: boolean): PowerMode {
  /* A device on a charger is not running down, whatever the percentage says. */
  if (level === null || charging) return 'off';

  /*
   * Leaving a mode takes the level being clear of its threshold; entering one takes the threshold
   * itself. The two are written as one expression per mode so a level can only ever step one
   * stage up or down, never jump from super to off because the reading fell past two margins.
   */
  if (previous === 'super') {
    if (level <= SUPER_AT + RELEASE_MARGIN) return 'super';
    return level <= SAVE_AT + RELEASE_MARGIN ? 'save' : 'off';
  }
  if (previous === 'save') {
    if (level <= SUPER_AT) return 'super';
    return level <= SAVE_AT + RELEASE_MARGIN ? 'save' : 'off';
  }
  if (level <= SUPER_AT) return 'super';
  return level <= SAVE_AT ? 'save' : 'off';
}

/** The part of `BatteryManager` this app reads — no timings, which are fingerprinting surface. */
interface BatteryManagerLike {
  readonly level: number;
  readonly charging: boolean;
  addEventListener(type: string, listener: () => void): void;
  removeEventListener(type: string, listener: () => void): void;
}

/**
 * Watch the battery and report every change of mode or level, starting with the current reading.
 *
 * Returns its own teardown. `levelchange` fires as the level moves (and on plugging in and out,
 * on the browsers that coalesce them); the charge state is read on every event rather than
 * subscribed to separately, because a build that skipped one listener would sit in save mode on a
 * phone that is plugged in.
 *
 * A browser without the API is reported once, as `NO_BATTERY`, and never again.
 */
export function watchBattery(onChange: (state: PowerState) => void): () => void {
  if (typeof navigator === 'undefined') {
    onChange(NO_BATTERY);
    return () => {};
  }
  const nav = navigator as Navigator & { getBattery?: () => Promise<BatteryManagerLike> };
  if (typeof nav.getBattery !== 'function') {
    onChange(NO_BATTERY);
    return () => {};
  }

  let manager: BatteryManagerLike | null = null;
  let mode: PowerMode = 'off';
  let stopped = false;

  const read = () => {
    if (stopped || !manager) return;
    mode = powerModeFor(mode, manager.level, manager.charging);
    onChange({ mode, level: manager.level, charging: manager.charging, supported: true });
  };

  void nav
    .getBattery()
    .then((battery) => {
      if (stopped) return;
      manager = battery;
      read();
      battery.addEventListener('levelchange', read);
      battery.addEventListener('chargingchange', read);
    })
    .catch(() => {
      /* A permission policy or a browser that exposes the name but refuses the call: the app
         keeps its full interface, which is what it did before this existed. */
      if (!stopped) onChange(NO_BATTERY);
    });

  return () => {
    stopped = true;
    if (!manager) return;
    manager.removeEventListener('levelchange', read);
    manager.removeEventListener('chargingchange', read);
  };
}
