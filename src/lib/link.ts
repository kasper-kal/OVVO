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

/** A single megabit, in bytes. */
const BYTES_PER_MEGABIT = 1_000_000 / 8;

/** How many bytes a string occupies as UTF-8, which is what would cross the wire. */
export function byteLength(text: string): number {
  if (typeof TextEncoder === 'undefined') return text.length;
  return new TextEncoder().encode(text).length;
}

/** The milliseconds `bytes` take at `mbps` megabits per second; zero for a speed that is not set. */
export function transferMs(bytes: number, mbps: number | null): number {
  if (mbps === null || !Number.isFinite(mbps) || mbps <= 0) return 0;
  if (!Number.isFinite(bytes) || bytes <= 0) return 0;
  return Math.round((bytes / BYTES_PER_MEGABIT / mbps) * 1000);
}
