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
 * A keystroke is not a spelling test.
 *
 * Reported with `Rijkss` in the From field and "No stops match" under it: six characters, one of
 * them typed twice, and a field that knows about `Rijksmuseum` answered nothing at all. The search
 * compared substrings, so one extra letter at the end of a word ended the search — which is the
 * state every field is in while it is being typed into.
 *
 * So when nothing matches as written, the same search runs again allowing **one typo** (two once
 * the word is eight letters long): a letter added, dropped or typed as its neighbour. `Rijkss`
 * then finds `Rijksmuseum` instead of apologising, and because the inline combobox, the map picker
 * and the full-screen picker all call `rankStops`, they learn it together.
 *
 * Only when nothing matched. A fuzzy pass on every keystroke would put a half-remembered station
 * above the one that was typed exactly, and the field's first job is still to answer what it was
 * asked.
 */

/** Below four letters a typo is the whole word: "each" is one edit from "ach". */
const FUZZY_MIN_LENGTH = 4;

/**
 * How far apart two words are, in single letters typed, and never more than `max` + 1.
 *
 * The textbook Levenshtein table, cut short: a row that is already further than `max` from every
 * prefix of the other word can only get further, so the count stops there. Sixty-odd stops of four
 * letters is nothing, but a query typed once per keystroke should still not build a table it will
 * throw away.
 */
function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    const current: number[] = [i];
    let best = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const value = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
      current.push(value);
      if (value < best) best = value;
    }
    if (best > max) return max + 1;
    previous = current;
  }
  return previous[b.length];
}

/**
 * The word `query` was reaching for, or `null` when it is not close to one.
 *
 * Answering with *the form that matched* rather than a yes/no, because the two used forms are
 * different facts: `Rijksmusem` is the whole word with a letter missing (so the word is the
 * answer), while `Rijkss` is one letter too many on top of a five-letter beginning (`rijks`) and
 * there is no word in the file it spells — the beginning is the honest answer, and it is what the
 * row is matched on.
 */
function fuzzyWord(query: string, word: string, max: number): string | null {
  if (word.length < FUZZY_MIN_LENGTH) return null;
  if (editDistance(query, word, max) <= max) return word;
  /* A query can be shorter than the word it is spelling: `Rijkss` is one keystroke past the
     beginning of `rijksmuseum`, so the beginnings within one letter of it are tried too. */
  for (const length of [query.length - 1, query.length, query.length + 1]) {
    if (length < FUZZY_MIN_LENGTH || length >= word.length) continue;
    const prefix = word.slice(0, length);
    if (editDistance(query, prefix, max) <= max) return prefix;
  }
  return null;
}

/**
 * How many letters separate a whole query from a stop, one word at a time — or `null`.
 *
 * A query is a phrase, and a phrase is near a stop when **every** word in it is near a word in
 * the stop's name or city: "Utrech Centraal" is two typos away from a station, "Utrech" alone
 * would be too. The total is what orders the fallback list, so the closest spelling leads.
 */
function fuzzyScore(stop: Stop, words: string[], max: number): number | null {
  const tokens = `${stop.name} ${stop.city}`
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  if (!tokens.length) return null;
  let total = 0;
  for (const word of words) {
    let best = max + 1;
    for (const token of tokens) {
      const form = fuzzyWord(word, token, max);
      if (!form) continue;
      const distance = editDistance(word, form, max);
      if (distance < best) best = distance;
    }
    if (best > max) return null;
    total += best;
  }
  return total;
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
 *
 * A query that matches nothing as written is searched once more with a typo allowed (see the note
 * above `FUZZY_MIN_LENGTH`); that pass is the last thing it tries, never a competitor to the query
 * that was actually typed.
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
  if (matches.length) {
    return [
      ...matches.filter((stop) => favouriteStopIds.includes(stop.id)),
      ...matches.filter((stop) => !favouriteStopIds.includes(stop.id)),
    ].slice(0, limit);
  }
  if (normalised.length < FUZZY_MIN_LENGTH) return [];
  /* One typo, or two in a long word — "Amsterdm" is one keystroke from a station and
     "Amsetrdam" is two, and both are the same mistake seen from different thumbs. */
  const max = normalised.length >= 8 ? 2 : 1;
  const words = normalised.split(/\s+/).filter(Boolean);
  const near = STOPS.map((stop) => ({ stop, distance: fuzzyScore(stop, words, max) }))
    .filter((entry): entry is { stop: Stop; distance: number } => entry.distance !== null)
    .sort((a, b) => a.distance - b.distance || a.stop.name.localeCompare(b.stop.name, 'nl'))
    .map((entry) => entry.stop);
  return [
    ...near.filter((stop) => favouriteStopIds.includes(stop.id)),
    ...near.filter((stop) => !favouriteStopIds.includes(stop.id)),
  ].slice(0, limit);
}
