/**
 * **The year's tally — a diary, not a drawer.**
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
/** How many "this look was worn today" lines are kept — one a day is all it can add. */
const MAX_WEARS = 400;

/** One search the traveller ran, as the tally needs it and nothing more. */
export interface YearRun {
  /** When the search was run, epoch milliseconds. The year it is filed under comes from this. */
  at: number;
  /** The two ends, as the traveller named them: an address stays an address. */
  from: string;
  to: string;
  /** The hour the journey was asked to start, 0–23 — the hour a card can talk about. */
  hour: number;
  /** Filled in when the results land: how many times changed, how long, on which lines. */
  changes?: number;
  minutes?: number;
  lines?: string[];
}

/** One day a look was worn. Kept as days rather than as a click count, because wearing a look is
    not something anybody clicks — it is what they left the app in. */
export interface YearWear {
  at: number;
  id: string;
}

export interface YearTally {
  version: 1;
  runs: YearRun[];
  wears: YearWear[];
  /** Boards opened, as the stop and the moment. */
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
 * This fills in what the journey list then answers — changes, minutes, lines — on the newest run
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

/** A board opened. Bounded to the same lid as the runs, one entry per open. */
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

/** The years this browser has anything for, newest first — the years a card can be offered. */
export function tallyYears(): number[] {
  const tally = readTally();
  const years = new Set<number>();
  for (const run of tally.runs) years.add(yearOf(run.at));
  for (const wear of tally.wears) years.add(yearOf(wear.at));
  for (const board of tally.boards) years.add(yearOf(board.at));
  return [...years].sort((a, b) => b - a);
}

/** **Empty the year.** One control, one action: the tally starts again with nothing in it. */
export function clearTally(): void {
  writeTally(EMPTY);
}
