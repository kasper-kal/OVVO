/**
 * **Whether this build is allowed to invent data.**
 *
 * OVVO has two kinds of information: what a real source said, and what the prototype made up so
 * the screens could be designed. The second kind is useful and must never be mistaken for the
 * first. So one switch decides it, and every generator reads that switch rather than the setting
 * of the day:
 *
 *   - **`npm run dev`** — sample data is on. It is how the app is designed and reviewed.
 *   - **a production build** — sample data is **off** unless the build was made with
 *     `VITE_ALLOW_DEMO=1`, which is a deliberate act for a public demo, not the default.
 *
 * With it off, a screen that has no real source shows an honest empty or unavailable state
 * instead of a plausible one. A missing answer is a fact; an invented answer is a lie.
 */
export const SAMPLE_DATA_ALLOWED: boolean =
  import.meta.env.DEV || import.meta.env.VITE_ALLOW_DEMO === '1';

/** True when the traveller is looking at invented data anywhere on the screen. */
export function isSample(source: string): boolean {
  return source === 'demo';
}
