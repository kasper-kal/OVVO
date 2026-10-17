import { STOPS, getStop } from '../data/stops';
import type { Stop } from '../data/types';

/** Stops offered when nothing has been typed — a stable, recognisable shortlist. */
const POPULAR_STOP_IDS = [
  'amsterdam-centraal',
  'utrecht-centraal',
  'rotterdam-centraal',
  'schiphol-airport',
  'den-haag-centraal',
  'eindhoven-centraal',
];

function score(stop: Stop, query: string): number {
  const haystack = `${stop.name} ${stop.city} ${stop.code}`.toLowerCase();
  if (!query) return 0;
  if (haystack.startsWith(query)) return 3;
  if (stop.name.toLowerCase().startsWith(query)) return 2;
  if (haystack.includes(query)) return 1;
  return -1;
}

/**
 * The one stop search: favourite stops always sit at the top of the list, whatever is typed,
 * and an empty field offers the favourites followed by the familiar big stations.
 *
 * Both the inline combobox and the full-screen picker call this, so the two can never
 * disagree about what a query matches. It ranks **favourites** only: the board's pins are a
 * different list for a different purpose, and a stop pinned to the board has no claim on a
 * From/To field (see the heart/pin note in `state/AppState.tsx`).
 */
export function rankStops(query: string, favouriteStopIds: string[], limit = 8): Stop[] {
  const normalised = query.trim().toLowerCase();
  if (!normalised) {
    const favourites = favouriteStopIds
      .map((stopId) => getStop(stopId))
      .filter((s): s is Stop => Boolean(s));
    const popular = POPULAR_STOP_IDS.map((stopId) => getStop(stopId)).filter((s): s is Stop => Boolean(s));
    return [
      ...favourites,
      ...popular.filter((p) => !favourites.some((f) => f.id === p.id)),
    ].slice(0, limit);
  }
  const matches = STOPS.map((stop) => ({ stop, rank: score(stop, normalised) }))
    .filter((entry) => entry.rank > 0)
    .sort((a, b) => b.rank - a.rank || a.stop.name.localeCompare(b.stop.name, 'nl'))
    .map((entry) => entry.stop);
  return [
    ...matches.filter((stop) => favouriteStopIds.includes(stop.id)),
    ...matches.filter((stop) => !favouriteStopIds.includes(stop.id)),
  ].slice(0, limit);
}
