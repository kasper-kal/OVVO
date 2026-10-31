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
 *   • **last** at **1% or less** — the last drop, which is super and then one thing more: the clock
 *     stops. The times on screen keep the minute they were read in, so nothing wakes the page once
 *     a minute for a number nobody asked to change, and the home screen is **one card: the
 *     planner**. A board says when the bus goes from the stop you are standing at, which you can
 *     read off the stop itself; the route to somewhere else is the thing a phone at one percent
 *     cannot show you by looking around. There is no way back inside the app — a control everyone
 *     presses out of habit is the same as no mode at all — so it ends only on a charger or above
 *     3%.
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

export type PowerMode = 'off' | 'save' | 'super' | 'last';

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

/** Last drop begins here: the final percent. */
export const LAST_AT = 0.01;

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
/** The modes in order of how much they take away. A higher index is a thinner interface. */
const MODE_ORDER: PowerMode[] = ['off', 'save', 'super', 'last'];

/** Where each mode begins. `off` has no threshold: it is what is left above all of them. */
const ENTER_AT: Partial<Record<PowerMode, number>> = { save: SAVE_AT, super: SUPER_AT, last: LAST_AT };

export function powerModeFor(previous: PowerMode, level: number | null, charging: boolean): PowerMode {
  /* A device on a charger is not running down, whatever the percentage says. */
  if (level === null || charging) return 'off';

  /* The mode this level would put the app in, ignoring what it was already in. */
  const target: PowerMode =
    level <= LAST_AT ? 'last' : level <= SUPER_AT ? 'super' : level <= SAVE_AT ? 'save' : 'off';
  if (target === previous) return previous;

  /*
   * **Falling is immediate; climbing has to clear the threshold it is leaving.** A reading that
   * drops past a line puts the app in the thinner mode at once — a phone at 1% should not wait two
   * points for a mode that saves it. Climbing back is the direction that flickers, so it waits for
   * the level to be clear of the threshold by `RELEASE_MARGIN`, which is what stops a phone resting
   * on 20% from blinking the whole interface in and out of stillness.
   */
  if (MODE_ORDER.indexOf(target) > MODE_ORDER.indexOf(previous)) return target;
  const leaving = ENTER_AT[previous];
  if (leaving !== undefined && level <= leaving + RELEASE_MARGIN) return previous;
  return target;
}

/** True for every mode that is supervised by the 10% rules, `last` included. */
export const isSuper = (mode: PowerMode): boolean => mode === 'super' || mode === 'last';

/** True only at the final percent, where the clock stops and one card is left. */
export const isLast = (mode: PowerMode): boolean => mode === 'last';

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
/** What the developer panel says the battery is, or null for the device's own reading. */
export interface BatteryReading {
  level: number;
  charging: boolean;
}

let override: BatteryReading | null = null;
const overrideListeners = new Set<() => void>();

/**
 * **Pretend the phone has a different battery, without a second code path.**
 *
 * The developer panel's fake battery goes into the same `read()` the device's own events go into,
 * so 20%, 10%, 1% and the two-point margin are the rules that ship rather than a copy of them kept
 * beside the panel. Passing null hands the device's reading back on the next event, and on the
 * next frame for a browser that has no battery at all.
 */
export function setBatteryOverride(next: BatteryReading | null): void {
  override = next;
  overrideListeners.forEach((listener) => listener());
}

export function watchBattery(onChange: (state: PowerState) => void): () => void {
  if (typeof navigator === 'undefined') {
    onChange(NO_BATTERY);
    return () => {};
  }
  const nav = navigator as Navigator & { getBattery?: () => Promise<BatteryManagerLike> };

  let manager: BatteryManagerLike | null = null;
  let mode: PowerMode = 'off';
  let stopped = false;

  /*
   * One reading, two sources. An override is a fact about the battery as far as this module is
   * concerned, so it is read exactly as a real one is: through the same hysteresis, with the same
   * result, and it is reported as `supported` even in a browser that has no battery API, which is
   * the whole reason the panel exists.
   */
  const read = () => {
    if (stopped) return;
    const source = override ?? (manager ? { level: manager.level, charging: manager.charging } : null);
    if (!source) {
      onChange(NO_BATTERY);
      return;
    }
    mode = powerModeFor(mode, source.level, source.charging);
    onChange({ mode, level: source.level, charging: source.charging, supported: true });
  };

  overrideListeners.add(read);
  if (override) read();

  const stop = () => {
    stopped = true;
    overrideListeners.delete(read);
    if (!manager) return;
    manager.removeEventListener('levelchange', read);
    manager.removeEventListener('chargingchange', read);
  };

  if (typeof nav.getBattery !== 'function') {
    /* No battery to read: a simulated one is the only reading this browser will ever have. */
    read();
    return stop;
  }

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

  return stop;
}
