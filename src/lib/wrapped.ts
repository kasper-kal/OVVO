/**
 * **The year's tally, a diary, not a drawer.**
 *
 * `recent-searches` is a dozen pairs and `search-history` forgets the ninth repeat of the same
 * trip, which is what a list is for. Wrapped needs the opposite: a small record of *every* run,
 * kept so that in December it can answer "how many times did you cross the country this year"
 * without inventing a number. One line per run, one line per look worn, one line per board opened.
 *
 * What it never holds: a name, an email, an address. The stop ids and the labels are the two ends
 * of a trip, which is what the cards speak about and all they speak about.
 *
 * **The year is the calendar year**, and a run is filed under the year it happened in rather than
 * under the year it was asked about: a search on 30 December for a trip on 2 January is a December
 * run, because the searching is the thing being counted. The 2026 card therefore closes at
 * 31 December 2026, 23:59 and never moves again.
 *
 * It lives in the same store as the favourites, so a signed-in traveller carries the year from
 * device to device the same way they carry everything else. Nothing here talks to the network.
 */

import { STORAGE_KEYS, readStored, writeStored } from './storage';

/** How many runs are kept. A year of hard use is a few hundred; this is a lid, not a plan. */
const MAX_RUNS = 2000;
/** How many "this look was worn today" lines are kept, one a day is all it can add. */
const MAX_WEARS = 400;

/** One search the traveller ran, as the tally needs it and nothing more. */
export interface YearRun {
  /** When the search was run, epoch milliseconds. The year it is filed under comes from this. */
  at: number;
  /** The two ends, as the traveller named them: an address stays an address. */
  from: string;
  to: string;
  /** The hour the journey was asked to start, 0–23, the hour a card can talk about. */
  hour: number;
  /** Filled in when the results land: how many times changed, how long, on which lines. */
  changes?: number;
  minutes?: number;
  lines?: string[];
}

/** One day a look was worn. Kept as days rather than as a click count, because wearing a look is
    not something anybody clicks, it is what they left the app in. */
export interface YearWear {
  at: number;
  id: string;
}

export interface YearTally {
  version: 1;
  runs: YearRun[];
  wears: YearWear[];
  /** Boards pinned, as the stop and the moment. */
  boards: { at: number; stopId: string }[];
  /** Stops hearted. A count, because a heart is one act and the list already exists elsewhere. */
  hearts: number;
}

const EMPTY: YearTally = { version: 1, runs: [], wears: [], boards: [], hearts: 0 };

export function readTally(): YearTally {
  const stored = readStored<Partial<YearTally>>(STORAGE_KEYS.wrapped, {});
  return {
    version: 1,
    runs: Array.isArray(stored.runs) ? stored.runs : [],
    wears: Array.isArray(stored.wears) ? stored.wears : [],
    boards: Array.isArray(stored.boards) ? stored.boards : [],
    hearts: typeof stored.hearts === 'number' ? stored.hearts : 0,
  };
}

function writeTally(next: YearTally): void {
  writeStored(STORAGE_KEYS.wrapped, next);
}

/** The calendar year a moment belongs to, in the traveller's own timezone. */
export function yearOf(at: number): number {
  return new Date(at).getFullYear();
}

/** One search run. Called by `startSearch`, which is the only thing that runs a search. */
export function recordRun(run: YearRun): void {
  const tally = readTally();
  writeTally({ ...tally, runs: [...tally.runs, run].slice(-MAX_RUNS) });
}

/**
 * The results for the newest run, once they exist.
 *
 * A run is written the moment it is started, when nothing is known but the two ends and the hour.
 * This fills in what the journey list then answers, changes, minutes, lines, on the newest run
 * that has no minutes yet and was started in the last five minutes. That window is what keeps a
 * late answer from landing on a run from yesterday, and the "no minutes yet" test is what keeps the
 * same list from being counted twice when the screen re-renders.
 */
export function noteRunOutcome(outcome: { changes: number; minutes: number; lines: string[] }): void {
  const tally = readTally();
  const now = Date.now();
  let target = -1;
  for (let index = tally.runs.length - 1; index >= 0; index -= 1) {
    const run = tally.runs[index];
    if (run.minutes === undefined && now - run.at < 5 * 60 * 1000) {
      target = index;
      break;
    }
  }
  if (target < 0) return;
  const runs = tally.runs.slice();
  runs[target] = { ...runs[target], ...outcome };
  writeTally({ ...tally, runs });
}

/** A board pinned. Bounded to the same lid as the runs, one entry per pin. */
export function recordBoard(stopId: string): void {
  const tally = readTally();
  writeTally({ ...tally, boards: [...tally.boards, { at: Date.now(), stopId }].slice(-MAX_RUNS) });
}

/** A stop hearted. Only ever called when a heart is *added*, never when one is taken back. */
export function recordHeart(): void {
  const tally = readTally();
  writeTally({ ...tally, hearts: tally.hearts + 1 });
}

/**
 * The look being worn today.
 *
 * Called when the app opens and when the look changes. It writes at most one line a day, so the
 * count answers "how many days did you wear this" rather than "how often did you tap it", and a
 * traveller who never opens the look picker still has a look with a whole year on it.
 */
export function noteWear(styleId: string): void {
  const now = Date.now();
  const tally = readTally();
  const day = new Date(now).toDateString();
  const last = tally.wears[tally.wears.length - 1];
  if (last && last.id === styleId && new Date(last.at).toDateString() === day) return;
  /* Changing the look twice in one day is two looks worn, so an earlier line for today is replaced
     rather than added to: the day goes to the look that ended it. */
  const wears = tally.wears.filter((wear) => new Date(wear.at).toDateString() !== day || wear.id !== styleId);
  writeTally({ ...tally, wears: [...wears, { at: now, id: styleId }].slice(-MAX_WEARS) });
}

/** The tally for one calendar year, which is what every card reads. */
export function tallyFor(year: number): YearTally {
  const tally = readTally();
  const inYear = (at: number) => yearOf(at) === year;
  return {
    version: 1,
    runs: tally.runs.filter((run) => inYear(run.at)),
    wears: tally.wears.filter((wear) => inYear(wear.at)),
    boards: tally.boards.filter((board) => inYear(board.at)),
    hearts: tally.hearts,
  };
}

/** The years this browser has anything for, newest first, the years a card can be offered. */
export function tallyYears(): number[] {
  const tally = readTally();
  const years = new Set<number>();
  for (const run of tally.runs) years.add(yearOf(run.at));
  for (const wear of tally.wears) years.add(yearOf(wear.at));
  for (const board of tally.boards) years.add(yearOf(board.at));
  return [...years].sort((a, b) => b - a);
}

/*
 * **Three questions the cards ask that a total cannot answer.**
 *
 * Every card before this one counted the year as a whole: how many, how far, which hour. Wrapped
 * also picks things out, five names in order, one date, a run of days, because a total is a fact
 * and a ranking is a story. These three readers are the only place those answers come from, they
 * are pure, and they take a tally rather than reading storage, so the demo year and a real one give
 * the answers by exactly the same route.
 */

/** A day with no clock on it: two searches on one day are one day. */
function dayOf(at: number): number {
  const date = new Date(at);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export interface RankedStop {
  id: string;
  count: number;
}

/**
 * **The five places the year used most.**
 *
 * A stop counts once for every journey it stood at either end of, which is what "the place you kept
 * going back to" means. Ties are broken by id rather than by chance, so the list is the same list
 * every time the page is opened and the closing card can print exactly what the film showed.
 */
export function rankedStops(tally: YearTally, limit = 5): RankedStop[] {
  const counts = new Map<string, number>();
  for (const run of tally.runs) {
    for (const id of [run.from, run.to]) {
      if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count || a.id.localeCompare(b.id))
    .slice(0, limit);
}

export interface BusiestDay {
  at: number;
  count: number;
}

/** **One day, with a number on it.** The day with the most journeys; a tie goes to the earlier one. */
export function busiestDay(tally: YearTally): BusiestDay | null {
  const counts = new Map<number, number>();
  for (const run of tally.runs) {
    const day = dayOf(run.at);
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  let best: BusiestDay | null = null;
  for (const [at, count] of counts) {
    if (!best || count > best.count || (count === best.count && at < best.at)) best = { at, count };
  }
  return best;
}

export interface TravelStreak {
  days: number;
  first: number;
  last: number;
}

/**
 * **The longest run of days in a row with a journey.**
 *
 * Days are compared as calendar days rather than as twenty-four-hour gaps, so a run through a clock
 * change is still a run. A single day is a streak of one rather than nothing: the traveller did go.
 */
export function longestStreak(tally: YearTally): TravelStreak | null {
  const days = [...new Set(tally.runs.map((run) => dayOf(run.at)))].sort((a, b) => a - b);
  if (!days.length) return null;
  let best: TravelStreak = { days: 1, first: days[0], last: days[0] };
  let run = 1;
  for (let index = 1; index < days.length; index += 1) {
    const next = new Date(days[index - 1]);
    next.setDate(next.getDate() + 1);
    if (next.getTime() === days[index]) {
      run += 1;
      if (run > best.days) {
        best = { days: run, first: days[index - run + 1], last: days[index] };
      }
    } else {
      run = 1;
    }
  }
  return best;
}

/** **Empty the year.** One control, one action: the tally starts again with nothing in it. */
export function clearTally(): void {
  writeTally(EMPTY);
}
