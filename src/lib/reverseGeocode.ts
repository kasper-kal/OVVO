/**
 * Naming the position a device reports.
 *
 * The picker used to answer "use my current location" with the nearest stop — a station
 * name, which is not where the traveller is standing. The coordinates the browser gives
 * us are exact; turning them into a street address needs a lookup against a map database,
 * because nothing in this build's own data knows street names.
 *
 * OpenStreetMap's Nominatim is that lookup: no key, one request, and the same data the
 * map world is built on. It is the only thing in this app that leaves the browser, so it
 * is asked for exactly one thing — the address of one point — and only after the traveller
 * taps "Use my current location" and grants a fix.
 *
 * Everything about it is allowed to fail: a blocked network, a slow host, a point in the
 * middle of a field. Each of those returns `null` and the picker falls back to the nearest
 * stop, which is what it did before this existed.
 */

/** Attribution for the address the lookup returns; OpenStreetMap's licence requires it. */
export const ADDRESS_ATTRIBUTION = 'Address © OpenStreetMap contributors';

/** Nominatim wants an identifiable caller and is not a CDN; six seconds is generous. */
const TIMEOUT_MS = 6000;

const ENDPOINT = 'https://nominatim.openstreetmap.org/reverse';

export interface AddressParts {
  house_number?: string;
  road?: string;
  pedestrian?: string;
  footway?: string;
  path?: string;
  square?: string;
  neighbourhood?: string;
  suburb?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  postcode?: string;
  display_name?: string;
}

/**
 * The shortest thing that still names a place: "Prinsengracht 263, Amsterdam".
 *
 * Nominatim's own `display_name` is a full descending path — "Dam, Centrum, Amsterdam,
 * Noord-Holland, Nederland, 1012 NP, Nederland" — which is a paragraph in a picker row and
 * repeats the city. Street, number and city is what a person writes down, so that is what
 * is composed here; a point that resolves to a neighbourhood or a park (no street in its
 * address) keeps the first two parts of the display name instead.
 */
export function composeAddress(parts: AddressParts): string | null {
  const street = parts.house_number ? `${parts.road ?? parts.pedestrian ?? ''} ${parts.house_number}`.trim() : parts.road ?? parts.pedestrian ?? parts.footway ?? parts.path ?? parts.square;
  const city = parts.city ?? parts.town ?? parts.village ?? parts.municipality ?? parts.suburb ?? parts.neighbourhood;

  if (street && city) return `${street}, ${city}`;
  if (street) return street;

  if (parts.display_name) {
    const segments = parts.display_name.split(',').map((segment) => segment.trim());
    const named = segments.filter((segment) => !/^\d{4}\s?[A-Z]{2}$/.test(segment) && segment !== 'Nederland');
    if (named.length) return named.slice(0, 2).join(', ');
  }
  return null;
}

/**
 * The street address of a point, or `null` if it cannot be named right now.
 *
 * Resolves — never rejects — so callers can treat "no address" and "no network" the same.
 *
 * **One failed request gets a second one.** When this returns null the picker falls back to the
 * nearest stop's own name, and the nearest stop to a city centre is usually the station named
 * after that city — which is how a lookup that simply timed out (or was rate-limited) turns into
 * "it said the city instead of my adress". A transient failure is worth 250ms and one more try
 * before the row settles for a place name that answers a different question.
 */
export async function reverseGeocode(position: { lat: number; lon: number }): Promise<string | null> {
  const first = await lookup(position);
  if (first) return first;
  await new Promise((resolve) => {
    window.setTimeout(resolve, RETRY_DELAY_MS);
  });
  return lookup(position);
}

/** How long to wait before the second attempt, so a rate limit has a chance to lift. */
const RETRY_DELAY_MS = 250;

async function lookup(position: { lat: number; lon: number }): Promise<string | null> {
  if (typeof fetch !== 'function') return null;
  const url = `${ENDPOINT}?format=jsonv2&zoom=18&addressdetails=1&lat=${position.lat}&lon=${position.lon}`;
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return null;
    const body = (await response.json()) as { address?: AddressParts; display_name?: string; error?: string };
    if (body.error) return null;
    return composeAddress({ ...body.address, display_name: body.display_name });
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}
