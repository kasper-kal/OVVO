/**
 * Is this phone quick enough to be given the full interface?
 *
 * **No browser will tell us.** Safari reports no chip name and no amount of memory, and it never
 * names the iPhone model either — the string it sends says "iPhone" for an XR and for a 15 alike.
 * Chrome on Android volunteers a memory figure, but it is rounded to a power of two and clamped,
 * so a 1 GB phone can honestly report 2, and the number says nothing about how fast the cores are
 * anyway. Asking the device to describe itself is not the way to this answer.
 *
 * So it is measured instead: the same fixed piece of work, on the device, timed three times and
 * the best of them kept. That is the thing that actually matters — a hot phone, a phone with a
 * dozen tabs open, or a phone in battery saver is slow whatever its chip is called, and this
 * notices all three.
 *
 * **The work is the shape of what the app does with a list** — integer arithmetic with a modulo,
 * and a little string building — not a synthetic benchmark of something this app never runs.
 *
 * ## Where the threshold comes from
 *
 * Measured on the build machine (a fast desktop, so an optimistic floor), same loop scaled to the
 * size below: **2 ms** at full speed, **8 ms** with the processor slowed four times, **43 ms**
 * slowed twenty times. Twelve is the line: slower than six times a fast desktop, which is where
 * the paint work this switches off starts to cost more than it is worth. A real cheap phone is
 * likely to land around the middle of that range — the honest note is that this wants a second
 * look on real hardware, and the number is one constant to move when it gets one.
 */
const WORK = 400_000;
const SAMPLES = 3;

/** The line between "full interface" and "still interface". See the note above. */
export const SLOW_ABOVE_MS = 12;

/* Written so the work cannot be optimised away: a loop whose result nothing reads is a loop the
   engine is entitled to delete, which would time nothing and call every phone fast. A property on
   an object outside the loop is a side effect the engine has to keep — and unlike a local `let`,
   it is not an unused variable either. */
const work = { value: 0 };

function sample(): number {
  let x = 12345;
  let text = '';
  const started = performance.now();
  for (let i = 0; i < WORK; i += 1) {
    x = (x * 31 + i) % 1000003;
    if (i % 40000 === 0) text += x.toString(36);
  }
  work.value = x + text.length;
  return performance.now() - started;
}

/**
 * The best of a few runs, in milliseconds.
 *
 * The best rather than the average on purpose: the first run includes the cost of warming up the
 * engine, and any one run can be interrupted by whatever else the phone is doing. The fastest run
 * is the closest thing to "what this device can do when it is left alone", and a device that is
 * briefly busy should not be declared slow for the rest of the visit.
 */
export function measureDeviceSpeed(): number {
  if (typeof performance === 'undefined' || typeof performance.now !== 'function') return 0;
  let best = Number.POSITIVE_INFINITY;
  for (let run = 0; run < SAMPLES; run += 1) best = Math.min(best, sample());
  return Number.isFinite(best) ? best : 0;
}

/** True when this device is slow enough that the still interface is the kinder one. */
export function deviceIsSlow(): boolean {
  return measureDeviceSpeed() > SLOW_ABOVE_MS;
}
