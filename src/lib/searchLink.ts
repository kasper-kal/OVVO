import { getStop } from '../data/stops';
import { DEFAULT_RESULTS_FILTER, type ResultsFilter, type SearchQuery } from '../data/journeyEngine';
import { MODE_OPTIONS } from '../data/preferences';
import type { PlannerSearchState } from '../state/types';
import type { SortMode, TimeMode } from '../data/types';

/**
 * **A search, written into its own address.**
 *
 * `/results/<id>` is one search told in full: both ends, the date and time, whether that time is a
 * departure or an arrival, how far the window has been paged, how the list is sorted, and which
 * result filters are on. Everything a reload, a bookmark or a pasted link needs to put the same
 * list back on the screen.
 *
 * The app used to hold a search in memory only, so a refresh emptied the screen — while that very
 * screen promised the results "will survive a refresh". There is nothing to *store* here and so
 * nothing to go stale: `planJourneys` is deterministic, and the same query always returns the same
 * journeys (that is already why each journey's id is built from the date and its departure). The
 * address describes the question again, and the answer is recomputed.
 *
 * **Why an opaque id rather than a readable slug.** A generated id cannot collide with a stop's
 * own name, needs no escaping, and survives an address that is a real street name with spaces,
 * commas and accents in it — which is exactly what `fromLabel`/`toLabel` carry when the traveller
 * searched from their own address. Base64url is the encoding a path segment can hold untouched.
 *
 * **Preferences are not in it, on purpose.** A search captures the traveller's travel preferences
 * when it is made, so it can be replayed; a *link* should honour the preferences of whoever opens
 * it, so the traveller's own walking limit is never overruled by a stranger's. The list a friend
 * sees is therefore the same search under their rules — one or two journeys may differ, and that
 * is the honest answer rather than a bug.
 */

/** What the address holds. Preferences are supplied by whoever opens it — see the note above. */
export interface DecodedSearch {
  query: Omit<SearchQuery, 'preferences'>;
  windowOffsetMinutes: number;
  sortMode: SortMode;
  filter: ResultsFilter;
}

const SORT_MODES: SortMode[] = ['best', 'fastest', 'fewestTransfers', 'leastWalking', 'cheapest', 'latestDeparture'];

/* An address is a path segment, so this is base64url; UTF-8 first, because a label can be
   "s-Hertogenbosch" or a street with an accent in it, and `btoa` only speaks Latin-1. */
function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(id: string): string | null {
  try {
    const padded = id.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

/** Short keys, and a default left out: a plain search's address stays around 90 characters. */
interface Payload {
  v: 1;
  f: string;
  t: string;
  fl?: string;
  tl?: string;
  fa?: number;
  ta?: number;
  d: string;
  m: number;
  tm: TimeMode;
  w?: number;
  s?: SortMode;
  /** modes, directOnly, delayedOnly, hideCancelled, operators — omitted when it is the default. */
  fi?: [string, 0 | 1, 0 | 1, 0 | 1, string];
}

const isDefaultFilter = (filter: ResultsFilter) =>
  filter.modes.length === 0 &&
  !filter.directOnly &&
  !filter.delayedOnly &&
  filter.hideCancelled === DEFAULT_RESULTS_FILTER.hideCancelled &&
  filter.operatorIds.length === 0;

/** The search, as the id in its address. */
export function encodeSearchLink(
  state: Pick<PlannerSearchState, 'query' | 'windowOffsetMinutes' | 'sortMode' | 'filter'>,
): string {
  const { query, windowOffsetMinutes, sortMode, filter } = state;
  const payload: Payload = {
    v: 1,
    f: query.fromStopId,
    t: query.toStopId,
    d: query.date,
    m: query.time,
    tm: query.timeMode,
  };
  if (query.fromLabel) payload.fl = query.fromLabel;
  if (query.toLabel) payload.tl = query.toLabel;
  if (query.fromAccessMetres) payload.fa = query.fromAccessMetres;
  if (query.toAccessMetres) payload.ta = query.toAccessMetres;
  if (windowOffsetMinutes) payload.w = windowOffsetMinutes;
  if (sortMode !== 'best') payload.s = sortMode;
  if (!isDefaultFilter(filter)) {
    payload.fi = [
      filter.modes.join(','),
      filter.directOnly ? 1 : 0,
      filter.delayedOnly ? 1 : 0,
      filter.hideCancelled ? 1 : 0,
      filter.operatorIds.join(','),
    ];
  }
  return toBase64Url(JSON.stringify(payload));
}

/**
 * The search an address names, or `null` when it does not name one.
 *
 * Every field is checked, because an address is something a stranger can type: an id that names a
 * stop the network does not have, a date that is not a date, or a sort that is not one of the six
 * is refused rather than half-believed. The screen then says so, in words, instead of drawing a
 * list of nothing.
 */
export function decodeSearchLink(id: string): DecodedSearch | null {
  const text = fromBase64Url(id);
  if (!text) return null;
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return null;
  }
  if (!raw || typeof raw !== 'object') return null;
  const payload = raw as Partial<Payload>;
  if (payload.v !== 1) return null;

  if (typeof payload.f !== 'string' || typeof payload.t !== 'string') return null;
  if (!getStop(payload.f) || !getStop(payload.t)) return null;
  if (payload.f === payload.t && !payload.fa && !payload.ta) return null;

  if (typeof payload.d !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(payload.d)) return null;
  if (typeof payload.m !== 'number' || !Number.isInteger(payload.m) || payload.m < 0 || payload.m > 1439) return null;
  if (payload.tm !== 'depart' && payload.tm !== 'arrive') return null;

  const windowOffsetMinutes =
    typeof payload.w === 'number' && Number.isFinite(payload.w)
      ? Math.max(-240, Math.min(240, Math.round(payload.w)))
      : 0;
  const sortMode: SortMode = SORT_MODES.includes(payload.s as SortMode) ? (payload.s as SortMode) : 'best';

  let filter: ResultsFilter = { ...DEFAULT_RESULTS_FILTER, modes: [], operatorIds: [] };
  if (payload.fi) {
    const [modes, directOnly, delayedOnly, hideCancelled, operators] = payload.fi;
    if (typeof modes !== 'string' || typeof operators !== 'string') return null;
    filter = {
      modes: modes
        ? (modes.split(',').filter((mode): mode is ResultsFilter['modes'][number] =>
            MODE_OPTIONS.some((option) => option === mode),
          ))
        : [],
      operatorIds: operators ? operators.split(',') : [],
      directOnly: directOnly === 1,
      delayedOnly: delayedOnly === 1,
      hideCancelled: hideCancelled === 1,
    };
  }

  const query: Omit<SearchQuery, 'preferences'> = {
    fromStopId: payload.f,
    toStopId: payload.t,
    date: payload.d,
    time: payload.m,
    timeMode: payload.tm,
  };
  if (typeof payload.fl === 'string' && payload.fl) query.fromLabel = payload.fl;
  if (typeof payload.tl === 'string' && payload.tl) query.toLabel = payload.tl;
  if (typeof payload.fa === 'number' && payload.fa > 0) query.fromAccessMetres = payload.fa;
  if (typeof payload.ta === 'number' && payload.ta > 0) query.toAccessMetres = payload.ta;

  return { query, windowOffsetMinutes, sortMode, filter };
}
