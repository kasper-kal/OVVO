/**
 * **How long something takes to come down a link of a given speed.**
 *
 * The app has one real request (the Wikipedia card) and a great deal of local data, so a "WiFi
 * speed" is not something it measures — it is something the developer panel can claim, and this is
 * the arithmetic that turns the claim into a wait. It is deliberately exact: megabits are decimal
 * (1 Mbps is 1,000,000 bits per second, which is what a provider sells and what a speed test
 * prints), bytes are bytes, and the answer is the milliseconds the whole thing takes.
 *
 * Nothing here knows where the bytes came from. The callers pass the size of the answer they are
 * actually about to show, so a longer journey list is a longer wait at the same speed, which is the
 * one property that makes the number mean anything.
 */

/**
 * **What the app itself weighs, so a reload can be timed honestly.**
 *
 * A reload is the one navigation that downloads OVVO: the script and the stylesheet, and nothing
 * else, because every screen is already inside them. The browser gets them compressed, so the
 * number below is the gzipped size of the production build's JavaScript and CSS, measured with
 * `gzip -9` over `dist/assets` (249 kB at the time of writing). It is a fact about the build, not a
 * guess: re-measure it when the bundle grows enough to matter, and the waits below follow.
 */
export const APP_WIRE_BYTES = 248_644;

/** A single megabit, in bytes. */
const BYTES_PER_MEGABIT = 1_000_000 / 8;

/** How many bytes a string occupies as UTF-8, which is what would cross the wire. */
export function byteLength(text: string): number {
  if (typeof TextEncoder === 'undefined') return text.length;
  return new TextEncoder().encode(text).length;
}

/*
 * **The speed the panel will claim, and the longest wait a timer can take.**
 *
 * The field has a bottom end for a reason: below a hundredth of a megabit the reload is minutes long
 * and nobody can read anything from it. A typed number is therefore brought inside this range before
 * it is stored, and a stored number is brought inside it again on load, so an old absurd value cannot
 * outlive the rule.
 *
 * The other number is the browser's own ceiling. A `setTimeout` delay above 2^31-1 milliseconds
 * overflows and fires at once, which is exactly what a speed like 0.00000005 did: the arithmetic said
 * months and the app opened on the next tick. Anything longer than this is cut to it.
 */
export const CLAIM_MIN_MBPS = 0.01;
export const CLAIM_MAX_MBPS = 10_000;
export const MAX_TIMER_MS = 2_147_483_647;

/** A claimed speed brought inside the panel's range, or null for no claim at all. */
export function clampSpeed(mbps: number | null): number | null {
  if (mbps === null || !Number.isFinite(mbps) || mbps <= 0) return null;
  return Math.min(CLAIM_MAX_MBPS, Math.max(CLAIM_MIN_MBPS, mbps));
}

/** The milliseconds `bytes` take at `mbps` megabits per second; zero for a speed that is not set. */
export function transferMs(bytes: number, mbps: number | null): number {
  if (mbps === null || !Number.isFinite(mbps) || mbps <= 0) return 0;
  if (!Number.isFinite(bytes) || bytes <= 0) return 0;
  return Math.round((bytes / BYTES_PER_MEGABIT / mbps) * 1000);
}
