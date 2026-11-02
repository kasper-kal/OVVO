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

import { MAP_POINT } from '../data/map';
import { getStop } from '../data/stops';
import type { Language } from '../state/types';
import { formatDuration } from './format';
import { styleById, stylePhotoPath } from './styles';
import type { YearTally } from './wrapped';
import type { Track } from './wrappedSound';

/** The colour a chapter is painted in. Each is a token, so the look still shows through. */
export type Tone = 'ink' | 'cream' | 'sage' | 'coral';

export type ChapterKind =
  | 'cover'
  | 'number'
  | 'route'
  | 'bars'
  | 'arc'
  | 'chips'
  | 'stretch'
  | 'word'
  | 'map'
  | 'pass'
  | 'close';

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
  /** One dot per journey, for the chapter that counts them. */
  dots?: number;
  /** The photograph of the look that was worn, when that look has one. */
  photo?: string;
  /**
   * The year drawn as a map.
   *
   * Every line is a pair the traveller actually planned, plotted from the same schematic coordinates
   * the home map uses, so the shape on the page is the shape of their year rather than a decoration
   * shaped like a map. `count` is how many times that pair was planned, so the busiest line can be
   * drawn heavier than the rest.
   */
  map?: {
    routes: { x1: number; y1: number; x2: number; y2: number; count: number }[];
    stops: { x: number; y: number }[];
  };
  /**
   * The personality as a thing you could hold: a year pass with the name on it.
   *
   * The name alone on a page was a label. A pass carries the reason it was issued, the year it is
   * good for and the three facts it was earned with, which is the difference between being called
   * something and being shown why.
   */
  pass?: { name: string; evidence: string; facts: string[] };
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

  /*
   * **The character the year gives you.**
   *
   * A year of numbers is a spreadsheet; the same year with a name is a story about a person. Every
   * figure below is already in the tally, and the persona is the one habit that stands out most —
   * the latest hour, the same pair, the same platform, the fewest changes — rather than a label
   * invented for the mood. The strongest evidence wins, and a year too even to have a habit says so
   * instead of being given a flattering one.
   */
  const nightRuns = runs.filter((run) => run.hour >= 20 || run.hour < 6).length;
  const uniqueOrigins = origins.size;
  const clock = `${peak < 10 ? '0' : ''}${peak}:00`;
  const habits = [
    { name: 'The Night Owl Express', share: nightRuns / runs.length, floor: 0.18,
      line: `${nightRuns} of ${runs.length} journeys set off in the evening, after the day was done.` },
    { name: `${clock} Regular`, share: pair ? pair.count / runs.length : 0, floor: 0.4,
      line: `${pair?.count ?? 0} of them the same pair of stations, over and over, like a heartbeat.` },
    { name: 'The Station Collector', share: uniqueOrigins / 6, floor: 0.66,
      line: `${uniqueOrigins} different stations set you off this year.` },
    { name: 'The Straight-Through Type', share: directShare, floor: 0.6,
      line: `${directPct}% of your journeys had no change at all. You pick the line that stays on the rails.` },
    { name: `${clock} Regular`, share: runs.length ? hours[peak] / runs.length : 0, floor: 0.2,
      line: `${hours[peak]} journeys left in the ${clock} hour, more than any other hour of the week.` },
  ];
  const strongest = habits
    .filter((habit) => habit.share >= habit.floor)
    .sort((a, b) => b.share - a.share)[0];
  const persona = strongest ?? {
    name: 'The Steady Traveller',
    line: 'No single habit owns this year: you went when the day asked, and kept moving.',
  };

  /* The hours that went into the journeys, which is the one number a year can be proud of. */
  const totalMinutes = runs.reduce((sum, run) => sum + (run.minutes ?? 0), 0);
  const totalHours = Math.round(totalMinutes / 60);
  const workingDays = Math.round(totalHours / 8);

  /*
   * **The year, plotted.**
   *
   * The seven pairs planned most often, drawn between the schematic positions of their two stations,
   * plus a dot for every station the year touched. Nothing is placed by hand: a journey that was not
   * planned cannot appear here, and a station nobody used cannot be a dot.
   */
  const stationsUsed = new Set<string>();
  for (const run of runs) {
    stationsUsed.add(run.from);
    stationsUsed.add(run.to);
  }
  const mapRoutes = topEntries(pairs, 7)
    .map((entry) => {
      const [from, to] = entry.value.split('→');
      const a = MAP_POINT(from);
      const b = MAP_POINT(to);
      if (!a || !b) return null;
      return { x1: a.x, y1: a.y, x2: b.x, y2: b.y, count: entry.count };
    })
    .filter((line): line is { x1: number; y1: number; x2: number; y2: number; count: number } => Boolean(line));
  const mapStops = [...stationsUsed]
    .map((id) => MAP_POINT(id))
    .filter((point): point is { x: number; y: number } => Boolean(point));

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
      /* The year drawn as itself: one dot per journey, behind the number that counts them. */
      dots: runs.length,
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
          /*
           * The two stations are printed on the rail itself, huge, so the sentence would only say
           * them again. The count keeps its unit and nothing else is repeated.
           */
          line: pair.count === 1 ? 'time' : 'times',
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
      id: 'persona',
      kind: 'pass',
      tone: 'ink',
      track: 'hip-hop-anthem',
      kicker: 'Your travel personality',
      big: persona.name,
      line: persona.line,
      /* The pass is the page: the name, why it was issued, and what earns it. */
      pass: {
        name: persona.name,
        evidence: persona.line,
        facts: [
          `${runs.length} journeys`,
          `${stationsUsed.size} ${stationsUsed.size === 1 ? 'station' : 'stations'}`,
          `${totalHours} ${totalHours === 1 ? 'hour' : 'hours'} in transit`,
        ],
      },
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
          ? 'One journey, and it had no changes at all.'
          : `${direct} of ${runs.length} journeys had no changes at all.`,
      arc: directShare,
    },
    longest.minutes
      ? {
          id: 'longest',
          kind: 'stretch',
          tone: 'coral',
          track: 'hip-hop-anthem',
          kicker: 'The long haul',
          big: formatDuration(longest.minutes, language),
          line: 'the longest trip you planned this year.',
          route: { from: nameOf(longest.from), to: nameOf(longest.to), count: 1 },
        }
      : null,
    mapRoutes.length
      ? {
          id: 'map',
          kind: 'map',
          tone: 'ink',
          track: 'afrobeat',
          kicker: 'The year on the map',
          big: '',
          /* The lines are named by the count in the sentence, because a map with a caption is a map. */
          line: `${mapRoutes.length} ${
            mapRoutes.length === 1 ? 'route' : 'routes'
          } across ${stationsUsed.size} stations, drawn only from journeys you planned.`,
          map: { routes: mapRoutes, stops: mapStops },
        }
      : null,
    named
      ? {
          id: 'look',
          kind: 'word',
          tone: 'cream',
          track: 'dark-trap',
          kicker: 'The look you wore',
          big: named,
          /* The days are the number the chapter turns on, so they get the size a number gets. */
          count: wearDays,
          line: 'in this look.',
          /* The page wears the look too: its own photograph, full bleed, behind the words. */
          photo: lookList[0] ? stylePhotoPath(lookList[0].value) : undefined,
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
          /* The count belongs to the line above it, so it is in the sentence, not left out of it. */
          line:
            lineList[0].count === 1
              ? '1 journey on it.'
              : `${lineList[0].count} journeys on it.`,
          /* A bare "22" on a board row is not an answer: the row says what the number counts. */
          chips: lineList
            .slice(1)
            .map((item) => ({
              label: item.value,
              detail: item.count === 1 ? '1 journey' : `${item.count} journeys`,
            })),
          hearts: tally.hearts,
          boards: tally.boards.length,
        }
      : null,
    totalMinutes > 0
      ? {
          id: 'hours',
          kind: 'number',
          tone: 'coral',
          track: 'electro-dance',
          kicker: 'The time you gave the journey',
          big: String(totalHours),
          count: totalHours,
          line:
            totalHours === 1
              ? 'hour in transit this year.'
              : `hours in transit this year${workingDays >= 1 ? `, ${workingDays} full working days of it` : ''}.`,
          dots: runs.length,
        }
      : null,
    {
      id: 'close',
      kind: 'close',
      tone: 'ink',
      track: 'acoustic',
      kicker: String(year),
      big: 'That was the year.',
      line: 'Every number here is yours: the journeys you planned in OVVO this year, and nothing else.',
      /* The last line is a door, not a disclaimer: the deck used to end by apologising for itself. */
      note: 'See you next December for the next one.',
    },
  ];

  return story.filter((chapter): chapter is Chapter => Boolean(chapter));
}
