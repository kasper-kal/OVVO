/**
 * **The story: the year told in chapters rather than in cards.**
 *
 * A deck of eight answers read as a dashboard: same shape, same type, a number and a line. This is
 * the same year told as a short film. Each chapter is one idea, one number, one sentence, and a
 * visual that only that chapter has: a route that draws itself, an hour of the day lit up, an arc
 * that fills to a share, a line that stretches to a long journey.
 *
 * Every figure comes from `lib/wrapped` and from nothing else. Nothing is compared with other
 * travellers, nothing is extrapolated, and an almost empty year gets one honest chapter instead of
 * nine dressed up ones.
 */

import { getStop } from '../data/stops';
import type { Language } from '../state/types';
import { formatDuration } from './format';
import { styleById } from './styles';
import type { YearTally } from './wrapped';
import type { Track } from './wrappedSound';

/** The colour a chapter is painted in. Each is a token, so the look still shows through. */
export type Tone = 'ink' | 'cream' | 'sage' | 'coral';

export type ChapterKind = 'cover' | 'number' | 'route' | 'bars' | 'arc' | 'chips' | 'close';

export interface Chapter {
  id: string;
  kind: ChapterKind;
  tone: Tone;
  /**
   * The piece of music under this chapter.
   *
   * Chosen by mood rather than by order, so the story leans where it should: the cover opens on the
   * grandest track, the line you kept coming back to gets the warmest groove, the look you wore gets
   * the darkest one, and the last screen resolves on an acoustic guitar instead of a drop.
   */
  track: Track;
  /** The small line above the number. */
  kicker: string;
  /** What the chapter says, large. */
  big: string;
  /** When the big thing is a number, it counts up to this instead of appearing. */
  count?: number;
  /** The sentence under it. */
  line: string;
  /** An optional quieter line, for the closing chapter. */
  note?: string;
  /** A route to draw: two ends and how many times it was planned. */
  route?: { from: string; to: string; count: number };
  /** Twenty-four hours, each with how many journeys asked to leave in it. */
  bars?: number[];
  /** Which hour is the tallest, so the bar can be picked out. */
  peak?: number;
  /** 0–1, how much of the arc is filled. */
  arc?: number;
  /** Short labelled facts, for the chapters that are lists. */
  chips?: { label: string; detail: string }[];
  hearts?: number;
  boards?: number;
}

/** How many journeys are enough to make a story. */
export const DECK_MIN_RUNS = 5;

const nameOf = (id: string): string => getStop(id)?.name ?? id;

function lookName(id: string): string | null {
  try {
    const style = styleById(id) as { name?: string } | null | undefined;
    return style?.name ?? null;
  } catch {
    return null;
  }
}

function topEntries<T extends string>(counts: Map<T, number>, limit: number): Array<{ value: T; count: number }> {
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function buildStory({
  year,
  tally,
  language,
}: {
  year: number;
  tally: YearTally;
  language: Language;
}): Chapter[] {
  const runs = [...tally.runs].sort((a, b) => a.at - b.at);

  if (runs.length < DECK_MIN_RUNS) {
    return [
      {
        id: 'cover',
        kind: 'cover',
        tone: 'ink',
        track: 'luxury-anthem',
        kicker: 'OVVO Wrapped',
        big: String(year),
        line: 'Your year in journeys you planned.',
      },
      {
        id: 'thin',
        kind: 'close',
        tone: 'cream',
        /* A thin year gets the quietest piece there is: no fanfare for a story that has not happened. */
        track: 'acoustic',
        kicker: String(year),
        big: String(runs.length),
        count: runs.length,
        line:
          runs.length === 1
            ? 'journey planned this year. That is not a year to make a story of yet.'
            : 'journeys planned this year. That is not a year to make a story of yet.',
        note: 'Nothing has been invented to fill the space. Plan a few more and come back.',
      },
    ];
  }

  const pairs = new Map<string, number>();
  const origins = new Map<string, number>();
  const hours = new Array<number>(24).fill(0);
  const looks = new Map<string, number>();
  const lines = new Map<string, number>();
  let direct = 0;
  let longest = runs[0];

  for (const run of runs) {
    pairs.set(`${run.from}→${run.to}`, (pairs.get(`${run.from}→${run.to}`) ?? 0) + 1);
    origins.set(run.from, (origins.get(run.from) ?? 0) + 1);
    hours[Math.max(0, Math.min(23, run.hour))] += 1;
    if ((run.changes ?? 1) === 0) direct += 1;
    if ((run.minutes ?? 0) > (longest.minutes ?? 0)) longest = run;
    for (const line of run.lines ?? []) lines.set(line, (lines.get(line) ?? 0) + 1);
  }
  for (const wear of tally.wears) looks.set(wear.id, (looks.get(wear.id) ?? 0) + 1);

  const [pair] = topEntries(pairs, 1);
  const [pairFrom, pairTo] = (pair?.value ?? '→').split('→');
  const originList = topEntries(origins, 3);
  const peak = hours.indexOf(Math.max(...hours));
  const lookList = topEntries(looks, 1);
  const wearDays = lookList[0]?.count ?? 0;
  const named = lookList[0] ? lookName(lookList[0].value) : null;
  const lineList = topEntries(lines, 3);
  const directShare = runs.length ? direct / runs.length : 0;
  const directPct = Math.round(directShare * 100);

  const story: Array<Chapter | null> = [
    {
      id: 'cover',
      kind: 'cover',
      tone: 'ink',
      track: 'luxury-anthem',
      kicker: 'OVVO Wrapped',
      big: String(year),
      line: 'Your year in journeys you planned.',
    },
    {
      id: 'total',
      kind: 'number',
      tone: 'ink',
      track: 'electro-dance',
      kicker: 'The year in one number',
      big: String(runs.length),
      count: runs.length,
      line: runs.length === 1 ? 'journey planned in OVVO.' : 'journeys planned in OVVO.',
    },
    pair
      ? {
          id: 'pair',
          kind: 'route',
          tone: 'coral',
          track: 'afrobeat',
          kicker: 'The line you kept coming back to',
          big: String(pair.count),
          count: pair.count,
          line: `${pair.count === 1 ? 'time' : 'times'} from ${nameOf(pairFrom)} to ${nameOf(pairTo)}.`,
          route: { from: nameOf(pairFrom), to: nameOf(pairTo), count: pair.count },
        }
      : null,
    originList.length
      ? {
          id: 'origin',
          kind: 'chips',
          tone: 'cream',
          track: 'indie-pop',
          kicker: 'Where you set off',
          big: nameOf(originList[0].value),
          line: `${originList[0].count} ${originList[0].count === 1 ? 'journey began' : 'journeys began'} here.`,
          chips: originList.slice(1).map((item) => ({
            label: nameOf(item.value),
            detail: `${item.count}`,
          })),
        }
      : null,
    {
      id: 'hour',
      kind: 'bars',
      tone: 'sage',
      track: 'electropop',
      kicker: 'Your hour',
      big: `${peak < 10 ? '0' : ''}${peak}:00`,
      line: `${hours[peak]} ${hours[peak] === 1 ? 'journey' : 'journeys'} asked to leave in that hour, more than any other.`,
      bars: hours,
      peak,
    },
    {
      id: 'direct',
      kind: 'arc',
      tone: 'ink',
      track: 'melodic-trap',
      kicker: 'Straight through',
      big: `${directPct}%`,
      count: directPct,
      line:
        direct === 1
          ? 'of your journeys had no changes at all. One clean run.'
          : `of your journeys had no changes at all. ${direct} of ${runs.length}.`,
      arc: directShare,
    },
    longest.minutes
      ? {
          id: 'longest',
          kind: 'number',
          tone: 'coral',
          track: 'hip-hop-anthem',
          kicker: 'The long haul',
          big: formatDuration(longest.minutes, language),
          line: `on the way to ${nameOf(longest.to)}, the longest trip you planned.`,
        }
      : null,
    named
      ? {
          id: 'look',
          kind: 'number',
          tone: 'cream',
          track: 'dark-trap',
          kicker: 'The look you wore',
          big: named,
          line: `${wearDays} ${wearDays === 1 ? 'day' : 'days'} in this look.`,
        }
      : null,
    lineList.length
      ? {
          id: 'lines',
          kind: 'chips',
          tone: 'sage',
          track: 'rap-anthem',
          kicker: 'Your lines',
          big: lineList[0].value,
          line: lineList[0].count === 1 ? 'journey on it.' : 'journeys on it.',
          chips: lineList.slice(1).map((item) => ({ label: item.value, detail: `${item.count}` })),
          hearts: tally.hearts,
          boards: tally.boards.length,
        }
      : null,
    {
      id: 'close',
      kind: 'close',
      tone: 'ink',
      track: 'acoustic',
      kicker: String(year),
      big: 'That was the year.',
      line: 'Every number here comes from journeys you planned in this app, and nothing else.',
      note: 'OVVO counts what you planned, not what you caught. It never sees you get on.',
    },
  ];

  return story.filter((chapter): chapter is Chapter => Boolean(chapter));
}
