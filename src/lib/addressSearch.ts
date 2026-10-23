/**
 * Finding an address by typing it.
 *
 * The picker could only *name* the position the device reported — `reverseGeocode` — so a street
 * address typed into a From/To field was searched against the stop file and answered "No stops
 * match". Reported exactly that way, with a screenshot of `rijksstraatweg 7` and Hoofddorp Station
 * above it: the app knew about addresses, but only ones it went and found itself.
 *
 * OpenStreetMap's Nominatim is the same lookup the reverse search uses, asked the other way round,
 * so there is still one map database and one naming rule (`composeAddress`). It is asked only while
 * the traveller is typing a query that could be an address — three characters or more — and one
 * request per settled keystroke, not per keystroke.
 *
 * Everything about it is allowed to fail, exactly like the reverse lookup: a blocked network, a
 * slow host, a rate limit. Each returns an empty list and the field keeps the stop results it
 * already had, which is what it did before this existed.
 */
import { composeAddress, type AddressParts } from './reverseGeocode';

/** One place the lookup found, named the way a person writes it down. */
export interface AddressHit {
  /** "Rijksstraatweg 7, Haarlem" */
  label: string;
  lat: number;
  lon: number;
}

/** Nominatim wants an identifiable caller and is not a CDN; six seconds is generous. */
const TIMEOUT_MS = 6000;

/** Five: a picker is a shortlist, and the stop list below it is already one. */
const LIMIT = 5;

/**
 * Two characters, and the lookup starts.
 *
 * It was three, and the delay before the first request made a field being typed into read as a
 * field that found nothing: reported as "should search for it earlier" with `Rijkss` in the box and
 * "No stops match" under it. `rijks` does answer — two streets, before the typo landed — so the
 * shortlist now begins a keystroke sooner and the debounce is a quarter of a second.
 */
export const ADDRESS_MIN_LENGTH = 2;

/**
 * What has already been asked.
 *
 * The lookup is rate-limited by the service and by politeness, and the same query comes back
 * constantly — a Backspace and a retyped letter, a field reopened on the street just chosen.
 * Answered queries are kept for the session (`Map` dies with the tab), so only new text costs a
 * request. Ten entries is more than a From/To field ever needs.
 */
const CACHE_LIMIT = 10;
const cache = new Map<string, AddressHit[]>();

function remember(query: string, hits: AddressHit[]): AddressHit[] {
  cache.set(query, hits);
  if (cache.size > CACHE_LIMIT) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  return hits;
}

const ENDPOINT = 'https://nominatim.openstreetmap.org/search';

interface SearchResult {
  lat: string;
  lon: string;
  display_name?: string;
  address?: AddressParts;
}

/**
 * Addresses matching what has been typed, best first — or an empty list.
 *
 * Resolves, never rejects: the caller draws stops whether or not the map database answered.
 */
export async function searchAddresses(query: string): Promise<AddressHit[]> {
  const trimmed = query.trim();
  if (trimmed.length < ADDRESS_MIN_LENGTH) return [];
  const key = trimmed.toLowerCase();
  const known = cache.get(key);
  if (known) return known;
  if (typeof fetch !== 'function') return [];

  const params = new URLSearchParams({
    format: 'jsonv2',
    addressdetails: '1',
    /* This is a Dutch planner, and Nominatim is global: without the filter "Hoofddorp" also
       answers places in Belgium and Germany. */
    countrycodes: 'nl',
    limit: String(LIMIT),
    q: trimmed,
  });

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${ENDPOINT}?${params.toString()}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return [];
    const body = (await response.json()) as SearchResult[] | { error?: string };
    if (!Array.isArray(body)) return [];
    const seen = new Set<string>();
    const hits: AddressHit[] = [];
    for (const result of body) {
      const lat = Number(result.lat);
      const lon = Number(result.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
      const label = composeAddress({ ...result.address, display_name: result.display_name });
      if (!label) continue;
      /* The same street twice (a house, its gate, its car park) is one row, not three. */
      const key = label.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      hits.push({ label, lat, lon });
    }
    return remember(key, hits);
  } catch {
    return [];
  } finally {
    window.clearTimeout(timer);
  }
}
