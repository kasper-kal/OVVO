import { STOPS, distanceFromPosition, getStop, hasBoard } from '../data/stops';
import type { Stop } from '../data/types';

/** A point to measure an empty-field shortlist from: the app's one location answer. */
export type StopOrigin = { lat: number; lon: number } | null;

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
 * and an empty field offers the favourites followed by **the closest stops to the traveller**.
 *
 * Both the inline combobox and the full-screen picker call this, so the two can never
 * disagree about what a query matches. It ranks **favourites** only: the board's pins are a
 * different list for a different purpose, and a stop pinned to the board has no claim on a
 * From/To field (see the heart/pin note in `state/AppState.tsx`).
 *
 * The empty-field shortlist used to be a hard-coded list of six big stations
 * (`POPULAR_STOP_IDS`) — a sample-data fact wearing the same coat round 11 cleaned off the board
 * page. It is now the same rule the rest of the app follows (`MATCHING_PLAN` rule 2): the
 * favourites, then the nearest stops that have a board, measured from `origin` — the app's single
 * location answer (a device fix, else the IP estimate, else nothing). With no origin there is no
 * second list to show: an empty field is the traveller's own favourites and a prompt to type.
 */
export function rankStops(
  query: string,
  favouriteStopIds: string[],
  options: { origin?: StopOrigin; limit?: number } = {},
): Stop[] {
  const { origin = null, limit = 8 } = options;
  const normalised = query.trim().toLowerCase();
  if (!normalised) {
    const favourites = favouriteStopIds
      .map((stopId) => getStop(stopId))
      .filter((s): s is Stop => Boolean(s));
    if (!origin) return favourites.slice(0, limit);
    const nearest = STOPS.map((stop) => ({ stop, metres: distanceFromPosition(stop, origin.lat, origin.lon) }))
      .filter((entry) => hasBoard(entry.stop) && !favouriteStopIds.includes(entry.stop.id))
      .sort((a, b) => a.metres - b.metres)
      .map((entry) => entry.stop);
    return [...favourites, ...nearest].slice(0, limit);
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
