/** Small deterministic PRNG helpers so the demo data is stable between reloads. */

export function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * **Which variation of the rolls this app is drawing.**
 *
 * Delays, cancellations and platforms are rolled from the things that identify a departure (the
 * line, the direction, the stop, the planned minute), which makes them stable between reloads and
 * refreshes — but also makes the one board that showed a cancelled Sprinter a board you cannot ask
 * for again, and a reported row a row that has to be hunted for.
 *
 * The developer panel's number is folded into every seed, so one number names one version of the
 * whole network: note it, and the same rows come back on any reload, on any device. Zero is the
 * app's own drawing, the one it had before the panel could ask.
 */
let rollVariant = 0;

export function setRollVariant(next: number): void {
  rollVariant = Math.max(0, Math.round(Number.isFinite(next) ? next : 0));
}

export function getRollVariant(): number {
  return rollVariant;
}

export function seededRandom(...parts: (string | number)[]): () => number {
  return mulberry32(hashString([...parts, `v${rollVariant}`].join('|')));
}

export function pick<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length) % items.length];
}

export function shortId(prefix: string, ...parts: (string | number)[]): string {
  return `${prefix}-${hashString(parts.join('|')).toString(36)}`;
}
