/**
 * **The story: ten screens, one object, one sentence each.**
 *
 * The deck used to be a dashboard wearing a film's clothes: twelve chapters, each with a kicker, a
 * huge figure and a label under it. This is the rebuild described in `WRAPPED-REBUILD.md`. Every
 * screen carries one sentence, one line under it, and a pose for the one object the whole story is
 * drawn with. The colour changes at the boundary between acts, never between pages.
 *
 * Nothing here invents a figure. Each chapter is filled from `YearTally` and from nothing else, and
 * a year too thin for a story still gets two honest screens instead of ten dressed up ones.
 */

import { getStop } from '../data/stops';
import type { Language } from '../state/types';
import { formatDuration, pad } from './format';
import { styleById } from './styles';
import type { YearTally } from './wrapped';

/** The three acts, and the only three hues the film uses. */
export type Act = 1 | 2 | 3;

/** The six poses of the Fold. Each is a fold of the same ribbon, never a new object. */
export type PoseId = 'tunnel' | 'fan' | 'wall' | 'slice' | 'lane' | 'burst' | 'tower' | 'beam';

export type ChapterId =
  | 'cover'
  | 'total'
  | 'pair'
  | 'hour'
  | 'direct'
  | 'longest'
  | 'map'
  | 'look'
  | 'hours'
  | 'close';

export interface StoryRoute {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  count: number;
}

export interface StoryStop {
  x: number;
  y: number;
}

export interface StoryLabel {
  x: number;
  y: number;
  name: string;
}

export interface Chapter {
  id: ChapterId;
  act: Act;
  pose: PoseId;
  /** The sentence on the page. At most nine words, figure already inside it. */
  sentence: string;
  /** The one line under it. At most twelve words. */
  caption: string;
  /** The figure inside the sentence, when there is one, so it can be counted up as it lands. */
  figure?: { value: number; from?: number; suffix?: string };
  /** Where the words sit, so two pages never share a composition. */
  layout?: 'mid' | 'top' | 'low' | 'left';
  /** How long the page stands, in milliseconds. Absent on the cover and the close. */
  hold?: number;
  /** The share text for this page. Absent means this page has no share control. */
  share?: string;
  /** The look's own four colours, on the look page only. */
  wear?: [string, string, string, string];
  /** The year's routes, on the map page only. */
  map?: {
    routes: StoryRoute[];
    stops: StoryStop[];
    labels: StoryLabel[];
    topOrigin: string;
  };
  /** Twenty four hours of journeys, on the hours page only. */
  hours?: { bars: number[]; peak: number };
}

/** How many journeys are enough to make a story. Below this, the deck tells the truth in two cards. */
export const DECK_MIN_RUNS = 5;

const nameOf = (id: string): string => getStop(id)?.name ?? id;

/** A station's short name, so a map label reads as a place rather than a heading. */
const shortLabel = (name: string): string => name.replace(/ (Centraal|Station|Airport)$/, '');

/** A station where it really is, in degrees. The map page draws this, not the schematic canvas. */
function stationPoint(id: string): { x: number; y: number } | null {
  const geo = getStop(id)?.geo;
  return geo ? { x: geo.lon, y: geo.lat } : null;
}

function lookName(id: string): string | null {
  try {
    const style = styleById(id) as { name?: string } | null | undefined;
    return style?.name ?? null;
  } catch {
    return null;
  }
}

function lookColours(id: string): [string, string, string, string] | null {
  try {
    const style = styleById(id) as { light?: string[] } | null | undefined;
    const quad = style?.light;
    if (!quad || quad.length !== 4) return null;
    return [quad[0], quad[1], quad[2], quad[3]];
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

/** The name of the habit the year shows, said as one short line rather than a badge. */
function habitCaption({
  nightRuns,
  runs,
  pairCount,
  uniqueOrigins,
  directShare,
  peakCount,
}: {
  nightRuns: number;
  runs: number;
  pairCount: number;
  uniqueOrigins: number;
  directShare: number;
  peakCount: number;
}): string {
  /*
   * A habit earns the caption only when it clears its own floor comfortably. The hour page is about
   * the hour, so a year whose habits are ordinary keeps the hour's line instead of being handed a
   * personality it did not earn.
   */
  const habits = [
    { score: nightRuns / runs / 0.18, line: 'Evening is when the city is yours.' },
    { score: pairCount / runs / 0.4, line: 'One journey, known by heart.' },
    { score: Math.min(1, uniqueOrigins / 6) / 0.66, line: 'Your year starts from all of them.' },
    { score: directShare / 0.6, line: 'You let the changes go.' },
    { score: peakCount / runs / 0.2, line: 'The city has a schedule. So, apparently, do you.' },
  ];
  const strongest = habits.filter((habit) => habit.score >= 1).sort((a, b) => b.score - a.score)[0];
  return strongest && strongest.score >= 1.8
    ? strongest.line
    : 'The city has a schedule. So, apparently, do you.';
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

  /*
   * **A thin year is not a story, and it says so.**
   *
   * Two screens, on the same black ground and with the same object, so it still looks like the film
   * it belongs to. Nothing is padded and no number is invented to fill a page.
   */
  if (runs.length < DECK_MIN_RUNS) {
    return [
      {
        id: 'cover',
        act: 1,
        pose: 'beam',
      layout: 'mid',
        sentence: 'OVVO Wrapped',
        caption: 'Your year, in motion.',
      },
      {
        id: 'close',
        act: 1,
        pose: 'burst',
      layout: 'low',
        sentence: runs.length === 0 ? 'No journeys yet.' : `${runs.length} journeys this year.`,
        caption:
          runs.length === 0
            ? 'Plan a few, and this becomes a story.'
            : 'That is not a year to make a story of yet.',
      },
    ];
  }

  const pairs = new Map<string, number>();
  const origins = new Map<string, number>();
  const hours = new Array<number>(24).fill(0);
  const looks = new Map<string, number>();
  let direct = 0;
  let longest = runs[0];
  let totalMinutes = 0;

  for (const run of runs) {
    pairs.set(`${run.from}\u2192${run.to}`, (pairs.get(`${run.from}\u2192${run.to}`) ?? 0) + 1);
    origins.set(run.from, (origins.get(run.from) ?? 0) + 1);
    hours[Math.max(0, Math.min(23, run.hour))] += 1;
    if ((run.changes ?? 1) === 0) direct += 1;
    if ((run.minutes ?? 0) > (longest.minutes ?? 0)) longest = run;
    totalMinutes += run.minutes ?? 0;
  }
  for (const wear of tally.wears) looks.set(wear.id, (looks.get(wear.id) ?? 0) + 1);

  const [pair] = topEntries(pairs, 1);
  const [pairFrom, pairTo] = (pair?.value ?? '\u2192').split('\u2192');
  const originList = topEntries(origins, 3);
  const peak = hours.indexOf(Math.max(...hours));
  const peakCount = hours[peak] ?? 0;
  const clock = `${pad(peak)}:00`;
  const lookList = topEntries(looks, 1);
  const wearDays = lookList[0]?.count ?? 0;
  const worn = lookList[0] ? lookList[0].value : null;
  const named = worn ? lookName(worn) : null;
  const wear = worn ? lookColours(worn) : null;
  const uniqueOrigins = origins.size;
  const directPct = Math.round((direct / runs.length) * 100);
  const totalHours = Math.round(totalMinutes / 60);
  const films = Math.max(1, Math.round(totalHours / 1.6));

  const nightRuns = runs.filter((run) => run.hour >= 20 || run.hour < 6).length;
  const captionForHabit = habitCaption({
    nightRuns,
    runs: runs.length,
    pairCount: pair?.count ?? 0,
    uniqueOrigins,
    directShare: direct / runs.length,
    peakCount,
  });

  /* The year, plotted on the country: only the pairs that were actually planned, at their real stations. */
  const stationsUsed = new Set<string>();
  for (const run of runs) {
    stationsUsed.add(run.from);
    stationsUsed.add(run.to);
  }
  const mapRoutes = topEntries(pairs, 7)
    .map((entry) => {
      const [from, to] = entry.value.split('\u2192');
      const a = stationPoint(from);
      const b = stationPoint(to);
      if (!a || !b) return null;
      return { x1: a.x, y1: a.y, x2: b.x, y2: b.y, count: entry.count };
    })
    .filter((line): line is StoryRoute => Boolean(line));
  const mapStops = [...stationsUsed]
    .map((id) => stationPoint(id))
    .filter((point): point is StoryStop => Boolean(point));

  /* Three names, on the three stops furthest from the middle, so they never pile up. */
  const centre = mapStops.reduce(
    (acc, stop) => ({ x: acc.x + stop.x / Math.max(1, mapStops.length), y: acc.y + stop.y / Math.max(1, mapStops.length) }),
    { x: 0, y: 0 },
  );
  const labelIds = [...stationsUsed]
    .filter((id) => stationPoint(id))
    .sort((a, b) => {
      const pa = stationPoint(a);
      const pb = stationPoint(b);
      if (!pa || !pb) return 0;
      return Math.hypot(pb.x - centre.x, pb.y - centre.y) - Math.hypot(pa.x - centre.x, pa.y - centre.y);
    })
    .slice(0, 3);
  const mapLabels = labelIds
    .map((id) => {
      const point = stationPoint(id);
      return point ? { x: point.x, y: point.y, name: shortLabel(nameOf(id)) } : null;
    })
    .filter((label): label is StoryLabel => Boolean(label));

  const story: Array<Chapter | null> = [
    {
      id: 'cover',
      act: 1,
      pose: 'beam',
      layout: 'mid',
      sentence: 'OVVO Wrapped',
      caption: 'Your year, in motion.',
    },
    {
      id: 'total',
      act: 1,
      pose: 'tower',
      layout: 'left',
      sentence: `You planned ${runs.length} journeys this year.`,
      caption: 'Every one of them started with a search.',
      figure: { value: runs.length },
      hold: 5200,
      share: `I planned ${runs.length} journeys in OVVO in ${year}.`,
    },
    pair
      ? {
          id: 'pair',
          act: 1,
          pose: 'wall',
      layout: 'top',
          sentence: `${pair.count} times, ${nameOf(pairFrom)} to ${nameOf(pairTo)}.`,
          caption: 'The line you kept coming back to.',
          figure: { value: pair.count },
          hold: 5000,
          share: `${pair.count} of my ${runs.length} journeys in ${year} were ${nameOf(pairFrom)} to ${nameOf(pairTo)}.`,
        }
      : null,
    {
      id: 'hour',
      act: 2,
      pose: 'fan',
      layout: 'low',
      sentence: `${clock} is your hour. ${peakCount} journeys left in it.`,
      caption: captionForHabit,
      figure: { value: peakCount },
      hold: 5000,
      share: `My year in OVVO kept starting at ${clock}. ${peakCount} journeys left in that hour.`,
    },
    {
      id: 'direct',
      act: 2,
      pose: 'slice',
      layout: 'left',
      sentence: `${directPct}% of your journeys went straight through.`,
      caption: `${direct} of ${runs.length}, with no changes at all.`,
      /* The sentence already carries the sign, so the counter must not add a second one. */
      figure: { value: directPct },
      hold: 5000,
      share: `${directPct}% of my OVVO journeys in ${year} had no changes.`,
    },
    longest.minutes
      ? {
          id: 'longest',
          act: 2,
          pose: 'lane',
      layout: 'top',
          sentence: `Your longest trip took ${formatDuration(longest.minutes, language)}.`,
          caption: `${nameOf(longest.from)} to ${nameOf(longest.to)}, with ${
            longest.changes ?? 0
          } changes.`,
          hold: 5200,
          share: `My longest OVVO trip in ${year}: ${nameOf(longest.from)} to ${nameOf(
            longest.to,
          )}, ${formatDuration(longest.minutes, language)}.`,
        }
      : null,
    mapRoutes.length
      ? {
          id: 'map',
          act: 3,
          pose: 'lane',
      layout: 'low',
          sentence: `${mapRoutes.length} routes. ${stationsUsed.size} stations. One year.`,
          caption: originList.length ? `Most of it began at ${nameOf(originList[0].value)}.` : 'Every line drawn from a journey you planned.',
          figure: { value: mapRoutes.length },
          hold: 6000,
          share: `My ${year} in OVVO: ${mapRoutes.length} routes across ${stationsUsed.size} stations.`,
          map: {
            routes: mapRoutes,
            stops: mapStops,
            labels: mapLabels,
            topOrigin: originList.length ? nameOf(originList[0].value) : '',
          },
        }
      : null,
    named && wear
      ? {
          id: 'look',
          act: 3,
          pose: 'tower',
      layout: 'mid',
          sentence: `You wore ${named} for ${wearDays} days.`,
          caption: 'Long enough to call it a uniform.',
          figure: { value: wearDays },
          hold: 5200,
          share: `I wore ${named} for ${wearDays} days of ${year}.`,
          wear,
        }
      : null,
    totalHours > 0
      ? {
          id: 'hours',
          act: 3,
          pose: 'fan',
      layout: 'top',
          sentence: `${totalHours} hours on the move.`,
          caption: `About ${films} films, if the train Wi-Fi holds.`,
          figure: { value: totalHours },
          hold: 5600,
          share: `${totalHours} hours in transit with OVVO in ${year}. About ${films} films.`,
          hours: { bars: hours, peak },
        }
      : null,
    {
      id: 'close',
      act: 1,
      pose: 'burst',
      layout: 'low',
      sentence: `That was ${year}.`,
      caption: tally.hearts
        ? `${tally.hearts} stops hearted along the way. See you next December.`
        : 'Every number here is yours. See you next December.',
    },
  ];

  return story.filter((chapter): chapter is Chapter => Boolean(chapter));
}
