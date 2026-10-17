/**
 * Where the traveller probably is, when the device will not say.
 *
 * The stops list is sorted nearest-first, and the device's own answer is the good one — but it
 * may be refused, unavailable, or simply never asked for, and "sorted by city name" is not an
 * answer to "what is near me". So the browser's own network address is asked instead, once a
 * day, and the estimate it returns is kept.
 *
 * It is **approximate and allowed to be wrong**: an IP address locates a network, not a person,
 * and a mobile connection can land a hundred kilometres away. The rule that keeps that
 * acceptable is that the app never presents it as a device fix — the screen says which one it
 * used, in the traveller's own language, and the device fix always wins when there is one.
 *
 * Two services are asked, in order, because one of them rate-limits by the caller's address and a
 * browser on a shared connection can be the caller that gets the 429: `ipwho.is`, then
 * `freeipapi.com`. Both are HTTPS, CORS-open, keyless and signup-free, so a static frontend with
 * no server can call them directly. Measured while building this: over the same minute, from the
 * same machine, `ipwho.is` answered **200 to curl and 429 to the browser** (a CORS request), while
 * `freeipapi.com` answered **200 in the browser** — which is exactly why the second one exists.
 * `ipapi.co` was tried and answered 429 too, so it is not in the list.
 *
 * A failure is silent by design: the sort keeps whatever it had, and nothing is announced for a
 * convenience that did not arrive.
 */

import { STORAGE_KEYS, readStored, writeStored } from './storage';

interface Provider {
  readonly name: string;
  readonly url: string;
  readonly read: (body: Record<string, unknown>) => { lat: number; lon: number } | null;
}

const PROVIDERS: readonly Provider[] = [
  {
    name: 'ipwho.is',
    url: 'https://ipwho.is/',
    read: (body) => {
      if (body.success === false) return null;
      /* `latitude`/`longitude`, with the short spellings accepted for safety. */
      return coordinates(body.latitude ?? body.lat, body.longitude ?? body.lon);
    },
  },
  {
    name: 'freeipapi.com',
    url: 'https://freeipapi.com/api/json',
    read: (body) => coordinates(body.latitude, body.longitude),
  },
];

function coordinates(lat: unknown, lon: unknown): { lat: number; lon: number } | null {
  const latitude = Number(lat);
  const longitude = Number(lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  /* Null Island is what a service returns when it has nothing to say. */
  if (latitude === 0 && longitude === 0) return null;
  return { lat: latitude, lon: longitude };
}

const TIMEOUT_MS = 6000;
const FRESH_FOR_MS = 24 * 60 * 60 * 1000;

export interface ApproximateLocation {
  lat: number;
  lon: number;
  /** When the estimate was taken, so a day-old one is not trusted for longer. */
  at: number;
  source: 'ip';
}

/** The estimate this browser already has, or null when there is none or it has gone stale. */
export function readFreshApproximateLocation(): ApproximateLocation | null {
  const stored = readApproximateLocation();
  if (!stored) return null;
  if (!Number.isFinite(stored.lat) || !Number.isFinite(stored.lon)) return null;
  if (!Number.isFinite(stored.at) || Date.now() - stored.at > FRESH_FOR_MS) return null;
  return stored;
}

export function readApproximateLocation(): ApproximateLocation | null {
  const stored = readStored<ApproximateLocation | null>(STORAGE_KEYS.approximateLocation, null);
  if (!stored || typeof stored !== 'object') return null;
  return stored.source === 'ip' ? stored : null;
}

export function writeApproximateLocation(fix: ApproximateLocation): void {
  writeStored(STORAGE_KEYS.approximateLocation, fix);
}

/**
 * Ask the network where it thinks we are. Resolves `null` on every kind of failure — a blocked
 * request, no network, a rate limit, a body that is not the shape we expect — because the caller
 * has nothing different to do about any of them.
 */
/**
 * One request per call site is a lie in React: an effect that mounts twice asks twice, and two
 * screens reading this would each ask. The promise is held, so whatever asks while an answer is
 * outstanding joins it, and the providers are tried once. Cleared when it settles, so a later
 * visit whose cache has aged out asks again.
 */
let inFlight: Promise<ApproximateLocation | null> | null = null;

export function fetchApproximateLocation(): Promise<ApproximateLocation | null> {
  if (typeof fetch !== 'function') return Promise.resolve(null);
  inFlight ??= askProviders().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function askProviders(): Promise<ApproximateLocation | null> {
  for (const provider of PROVIDERS) {
    const fix = await askProvider(provider);
    if (fix) {
      writeApproximateLocation(fix);
      return fix;
    }
  }
  return null;
}

async function askProvider(provider: Provider): Promise<ApproximateLocation | null> {
  try {
    const response = await fetch(provider.url, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) return null;
    const body: unknown = await response.json();
    if (!body || typeof body !== 'object') return null;
    const point = provider.read(body as Record<string, unknown>);
    if (!point) return null;
    return { lat: point.lat, lon: point.lon, at: Date.now(), source: 'ip' };
  } catch {
    return null;
  }
}
