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

import { geoDistanceMetres, getStop } from '../data/stops';
import { MAP_POINT } from '../data/map';
import type { Language } from '../state/types';
import { formatDuration } from './format';
import { styleById, stylePhotoPath } from './styles';
import { busiestDay, longestStreak, rankedStops, type TravelStreak, type YearTally } from './wrapped';
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
  | 'name'
  | 'ranked'
  | 'day'
  | 'eras'
  | 'map'
  | 'awards'
  | 'bookends'
  | 'distance'
  | 'comparison'
  | 'crew'
  | 'close';

export interface EraPhase {
  /** The style id, so the timeline can use that look's own accent. */
  id: string;
  /** The look's name and the season it belonged to, e.g. "Nostalgia spring". */
  name: string;
  /** First and last day the look was worn in this run of days. */
  start: number;
  end: number;
  /** How many recorded days this era lasted. */
  days: number;
}

export interface MapStop {
  id: string;
  name: string;
  /** Position on the map module's 0–100 canvas. */
  x: number;
  y: number;
  /** How often this stop appeared at either end of a journey. */
  count: number;
}

export interface MapRoute {
  from: MapStop;
  to: MapStop;
  count: number;
  /** The pair the year returned to most. */
  top: boolean;
}

export interface ChapterMap {
  stops: MapStop[];
  routes: MapRoute[];
  topStopId: string | null;
  topRoute: { fromId: string; toId: string; count: number } | null;
  topLine: string | null;
  places: number;
  routeCount: number;
}

export interface YearAward {
  id: string;
  title: string;
  /** The number or short phrase the award is built on. */
  stat: string;
  /** What that number means. */
  statLabel: string;
  line: string;
  facts: Array<{ label: string; value: string }>;
}

export interface YearBookend {
  at: number;
  hour: number;
  from: string;
  to: string;
}

export interface ChapterDistance {
  /** Straight-line kilometres between stops OVVO could place. */
  km: number;
  knownRuns: number;
  totalRuns: number;
  /** Estimated emissions from the simple, conservative comparison in the chapter. */
  carKg: number;
  transitKg: number;
  avoidedKg: number;
}

export interface RankedRow {
  /** The stop's name, as the app spells it. */
  name: string;
  /** The letter on the row's tile: we have no photographs, so the place is drawn. */
  initial: string;
  /** How many journeys stood at this stop, either end. */
  count: number;
}

export interface BusiestDayCard {
  at: number;
  count: number;
  /** The day in the deck's language: "14 March", "14 maart". */
  date: string;
}

export interface CrewSummary {
  journeys: number;
  topLine: string | null;
  traveller: string | null;
  era: string | null;
  lines: string[];
}

export interface YearComparison {
  previousYear: number;
  journeys: number;
  previousJourneys: number;
  /** Stops used this year that last year's tally never touched. */
  newStations: string[];
  newStationCount: number;
  /** Stops that appeared in both years, the old favourites. */
  returningStations: number;
  /** Look ids worn in both years, named in the current language. */
  survivedThemes: string[];
}

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
  /** Journeys per calendar month, January first, for the year ring. */
  months?: number[];
  /** The photograph of the look that was worn, when that look has one. */
  photo?: string;
  /** The looks in the order they were worn, for the year's era timeline. */
  eras?: EraPhase[];
  /** The year's own web of journeys, for the map chapter. */
  map?: ChapterMap;
  /** The five places used most, in order, for the ranked chapter. */
  ranked?: RankedRow[];
  /** The one day the year did the most travelling, for the day chapter. */
  day?: BusiestDayCard;
  /** The longest run of days with a journey. The film does not say it yet; the share card prints it. */
  streak?: TravelStreak;
  /** The playful awards the year earned. */
  awards?: YearAward[];
  /** The first and last journey, for the quiet bookend chapter. */
  bookends?: { first: YearBookend; last: YearBookend };
  /** Planned distance and the deliberately cautious car comparison. */
  distance?: ChapterDistance;
  /** The safe aggregates a friend can compare with. */
  crew?: CrewSummary;
  /** The same deck's previous year, when there is one to compare against. */
  comparison?: YearComparison;
}

/** How many journeys are enough to make a story. */
export const DECK_MIN_RUNS = 5;

const nameOf = (id: string): string => getStop(id)?.name ?? id;

function lookName(id: string, language: Language): string | null {
  try {
    const style = styleById(id);
    return language === 'nl' ? style.nameNl : style.name;
  } catch {
    return null;
  }
}

const SEASONS = {
  en: ['winter', 'spring', 'summer', 'autumn'],
  nl: ['winter', 'lente', 'zomer', 'herfst'],
} as const;

/** The season a date belongs to, in the language the deck is speaking. */
function seasonOf(at: number, language: Language): string {
  const month = new Date(at).getMonth();
  const index = month === 11 || month <= 1 ? 0 : month <= 4 ? 1 : month <= 7 ? 2 : 3;
  return SEASONS[language][index];
}

/**
 * **The year as a sequence of looks.**
 *
 * A wear line is written once a day, so a run of the same id is one era and a different id starts
 * the next one. The name pairs the look with the season at the middle of its run, which is the
 * difference between a settings log and a chapter a person would recognise: "Nostalgia spring" is
 * a period of their year, not a theme they clicked.
 */
function erasFor(wears: YearTally['wears'], language: Language): EraPhase[] {
  const sorted = [...wears].sort((a, b) => a.at - b.at);
  const phases: Array<Omit<EraPhase, 'name'>> = [];
  for (const wear of sorted) {
    const last = phases[phases.length - 1];
    if (last && last.id === wear.id) {
      last.end = wear.at;
      last.days += 1;
    } else {
      phases.push({ id: wear.id, start: wear.at, end: wear.at, days: 1 });
    }
  }
  return phases.map((phase) => {
    const name = lookName(phase.id, language) ?? phase.id;
    const middle = phase.start + (phase.end - phase.start) / 2;
    return { ...phase, name: `${name} ${seasonOf(middle, language)}` };
  });
}

function topEntries<T extends string>(counts: Map<T, number>, limit: number): Array<{ value: T; count: number }> {
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/** How many journeys a year needs before it can be said what kind of traveller it made. */
export const NAME_MIN_RUNS = 6;

/*
 * The comparison is deliberately simple and conservative: a petrol car with one occupant and an
 * average public-transport passenger. It is an illustration, not a measurement of a trip.
 */
const CAR_KG_PER_KM = 0.17;
const TRANSIT_KG_PER_KM = 0.05;

interface Nameplate {
  /** What the year made them, in a few words. */
  name: string;
  /** The sentence that turns the tally into that claim. */
  line: string;
  /** The journeys that earn it, printed under it. */
  chips: { label: string; detail: string }[];
}

/**
 * **Who the year made you.**
 *
 * Every other chapter counts something. This one says what the counting adds up to, so it is the only
 * chapter that speaks about the traveller rather than about the tally. That is the part of Wrapped
 * that actually pulls: not the colour or the movement, but being named. A name only works if the year
 * earned it, so each claim needs a real share of the journeys, and the journeys that prove it are
 * printed beside it. A year too thin to point anywhere gets no chapter at all rather than a
 * flattering guess.
 *
 * The claims are the six shapes a year of journeys can honestly take: the one trip taken again and
 * again, the same start every time, the trip with nothing to change on, the early start, the late
 * one, and the year that kept going somewhere new. None of them needs a majority, because a real year
 * is mixed; each is measured against the floor that makes it worth saying, and the claim that clears
 * its own floor by the widest margin is the one that names the year.
 */
function nameplateFor({
  runs,
  pair,
  secondPairCount,
  topOrigin,
  topOriginCount,
  destinations,
  direct,
  peak,
  beforeNine,
  afterSix,
  latestHour,
  longestMinutes,
  language,
}: {
  runs: number;
  pair: { from: string; to: string; count: number } | null;
  secondPairCount: number;
  topOrigin: string | null;
  topOriginCount: number;
  destinations: number;
  direct: number;
  peak: number;
  beforeNine: number;
  afterSix: number;
  latestHour: number;
  longestMinutes?: number;
  language: Language;
}): Nameplate | null {
  if (runs < NAME_MIN_RUNS) return null;

  const clock = (hour: number) => `${hour < 10 ? '0' : ''}${hour}:00`;
  const share = (count: number) => count / runs;
  /* How far past the floor a claim sits, so the strongest shape of the year wins rather than the
     first one in this list. A share of 0.7 against a floor of 0.35 is twice the claim it needs. */
  const candidates: Array<Nameplate & { strength: number }> = [];

  if (pair && pair.count >= 4 && pair.count >= 1.8 * Math.max(1, secondPairCount)) {
    candidates.push({
      strength: share(pair.count) / 0.35,
      name: 'The Regular',
      line: 'One trip again and again, and you know exactly which.',
      chips: [
        { label: `${pair.from} to ${pair.to}`, detail: `${pair.count} journeys` },
        { label: 'The next most repeated trip', detail: `${secondPairCount} journeys` },
        ...(topOrigin ? [{ label: 'Where you set off', detail: topOrigin }] : []),
      ],
    });
  }

  if (topOrigin && topOriginCount >= 4 && share(topOriginCount) >= 0.6) {
    candidates.push({
      strength: share(topOriginCount) / 0.6,
      name: 'The Creature of Habit',
      line: 'More often than not, the day began at the same station.',
      chips: [
        { label: 'Where you set off', detail: `${topOriginCount} of ${runs}` },
        { label: 'Different destinations', detail: `${destinations}` },
        ...(pair ? [{ label: 'The trip you took most', detail: `${pair.count} journeys` }] : []),
      ],
    });
  }

  if (direct >= 4 && share(direct) >= 0.5) {
    candidates.push({
      strength: share(direct) / 0.5,
      name: 'The Straight-Through',
      /* The row prints the number, so the sentence says what it means instead of repeating it. */
      line: 'The change-free journey was your default.',
      chips: [
        ...(longestMinutes
          ? [{ label: 'The longest trip', detail: formatDuration(longestMinutes, language) }]
          : []),
        { label: 'Journeys with no changes', detail: `${direct} of ${runs}` },
        ...(topOrigin ? [{ label: 'Where you set off', detail: topOrigin }] : []),
      ],
    });
  }

  if (beforeNine >= 4 && share(beforeNine) >= 0.35 && beforeNine > afterSix) {
    candidates.push({
      strength: share(beforeNine) / 0.35,
      name: 'The Early Riser',
      line: 'You left before the city was properly awake.',
      chips: [
        { label: 'Before nine', detail: `${beforeNine} of ${runs}` },
        { label: 'Your usual hour', detail: clock(peak) },
        { label: 'After six', detail: `${afterSix} of ${runs}` },
      ],
    });
  }

  if (afterSix >= 4 && share(afterSix) >= 0.35 && afterSix > beforeNine) {
    candidates.push({
      strength: share(afterSix) / 0.35,
      name: 'The Night Owl',
      line: 'You travelled after the day was done.',
      chips: [
        { label: 'After six', detail: `${afterSix} of ${runs}` },
        { label: 'Your latest hour', detail: clock(latestHour) },
        { label: 'Before nine', detail: `${beforeNine} of ${runs}` },
      ],
    });
  }

  if (destinations >= 6 && share(destinations) >= 0.5) {
    candidates.push({
      strength: share(destinations) / 0.5,
      name: 'The Explorer',
      line: 'Half of your journeys went somewhere different.',
      chips: [
        { label: 'Different destinations', detail: `${destinations}` },
        ...(pair ? [{ label: 'The trip you repeated most', detail: `${pair.count} times` }] : []),
        ...(topOrigin ? [{ label: 'Where you set off from', detail: topOrigin }] : []),
      ],
    });
  }

  let best: (Nameplate & { strength: number }) | null = null;
  for (const candidate of candidates) {
    if (!best || candidate.strength > best.strength) best = candidate;
  }
  return best ? { name: best.name, line: best.line, chips: best.chips } : null;
}

function comparisonFor({
  year,
  runs,
  tally,
  previous,
  language,
}: {
  year: number;
  runs: YearTally['runs'];
  tally: YearTally;
  previous?: YearTally;
  language: Language;
}): YearComparison | null {
  if (!previous || previous.runs.length === 0) return null;

  const stops = (source: YearTally['runs']) => {
    const found = new Set<string>();
    for (const run of source) {
      if (getStop(run.from)) found.add(run.from);
      if (getStop(run.to)) found.add(run.to);
    }
    return found;
  };
  const currentStops = stops(runs);
  const previousStops = stops(previous.runs);
  const newStations = [...currentStops]
    .filter((id) => !previousStops.has(id))
    .map(nameOf);
  const returningStations = [...currentStops].filter((id) => previousStops.has(id)).length;
  const previousThemes = new Set(previous.wears.map((wear) => wear.id));
  const survivedThemes = [...new Set(tally.wears.map((wear) => wear.id))]
    .filter((id) => previousThemes.has(id))
    .flatMap((id) => lookName(id, language) ?? [])
    .slice(0, 4);

  return {
    previousYear: year - 1,
    journeys: runs.length,
    previousJourneys: previous.runs.length,
    newStations: newStations.slice(0, 8),
    newStationCount: newStations.length,
    returningStations,
    survivedThemes,
  };
}

export function buildStory({
  year,
  tally,
  previous,
  language,
}: {
  year: number;
  tally: YearTally;
  previous?: YearTally;
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
        kicker: 'OVVO Yearbook',
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
  const months = new Array<number>(12).fill(0);
  const looks = new Map<string, number>();
  const lines = new Map<string, number>();
  const stopCounts = new Map<string, number>();
  let plannedKm = 0;
  let placedRuns = 0;
  let direct = 0;
  let longest = runs[0];

  for (const run of runs) {
    pairs.set(`${run.from}→${run.to}`, (pairs.get(`${run.from}→${run.to}`) ?? 0) + 1);
    origins.set(run.from, (origins.get(run.from) ?? 0) + 1);
    hours[Math.max(0, Math.min(23, run.hour))] += 1;
    months[new Date(run.at).getMonth()] += 1;
    if ((run.changes ?? 1) === 0) direct += 1;
    if ((run.minutes ?? 0) > (longest.minutes ?? 0)) longest = run;
    for (const line of run.lines ?? []) lines.set(line, (lines.get(line) ?? 0) + 1);
    const fromStop = getStop(run.from);
    const toStop = getStop(run.to);
    if (fromStop) stopCounts.set(run.from, (stopCounts.get(run.from) ?? 0) + 1);
    if (toStop) stopCounts.set(run.to, (stopCounts.get(run.to) ?? 0) + 1);
    if (fromStop && toStop) {
      plannedKm += geoDistanceMetres(fromStop, toStop) / 1000;
      placedRuns += 1;
    }
  }
  for (const wear of tally.wears) looks.set(wear.id, (looks.get(wear.id) ?? 0) + 1);

  const [pair] = topEntries(pairs, 1);
  const [pairFrom, pairTo] = (pair?.value ?? '→').split('→');
  const originList = topEntries(origins, 3);
  const peak = hours.indexOf(Math.max(...hours));
  const lookList = topEntries(looks, 1);
  const wearDays = lookList[0]?.count ?? 0;
  const named = lookList[0] ? lookName(lookList[0].value, language) : null;
  const lineList = topEntries(lines, 3);
  const eraList = erasFor(tally.wears, language);
  const stopsOnMap: MapStop[] = topEntries(stopCounts, 60)
    .flatMap((entry) => {
      const point = MAP_POINT(entry.value);
      if (!point) return [];
      return [{ id: entry.value, name: nameOf(entry.value), x: point.x, y: point.y, count: entry.count }];
    });
  const mapByStop = new Map(stopsOnMap.map((stop) => [stop.id, stop]));
  const mapRoutes: MapRoute[] = topEntries(pairs, 26).flatMap((entry) => {
    const [fromId, toId] = entry.value.split('→');
    const from = mapByStop.get(fromId);
    const to = mapByStop.get(toId);
    if (!from || !to) return [];
    return [{ from, to, count: entry.count, top: pair?.value === entry.value }];
  });
  const topStop = topEntries(stopCounts, 1)[0]?.value ?? null;
  const directShare = runs.length ? direct / runs.length : 0;
  const directPct = Math.round(directShare * 100);
  const topStopName = topStop ? nameOf(topStop) : null;
  const topStopCount = topStop ? stopCounts.get(topStop) ?? 0 : 0;
  const destinations = new Set(runs.map((run) => run.to)).size;
  const beforeNine = hours.slice(0, 9).reduce((sum, count) => sum + count, 0);
  const afterSix = hours.slice(18).reduce((sum, count) => sum + count, 0);
  const latestHour = hours.reduce((at, count, hour) => (count > 0 ? hour : at), 0);
  const secondPair = topEntries(pairs, 2)[1];
  const hourLabel = (hour: number) => `${hour < 10 ? '0' : ''}${hour}:00`;
  const awards: YearAward[] = [];

  /* The year's own awards. Each one has a number a person can quote back to a friend. */
  if (runs.length) {
    awards.push({
      id: 'sprint',
      title: `Most likely to sprint for the ${hourLabel(peak)}`,
      stat: hourLabel(peak),
      statLabel: 'your busiest hour',
      line: `${hours[peak]} ${hours[peak] === 1 ? 'journey' : 'journeys'} asked to leave then, more than any other hour.`,
      facts: [
        { label: 'Journeys then', value: String(hours[peak]) },
        { label: 'Before nine', value: `${beforeNine} of ${runs.length}` },
      ],
    });
  }

  if (topStopName) {
    awards.push({
      id: 'station',
      title: 'Station main character',
      stat: String(topStopCount),
      statLabel: 'appearances',
      line: `${topStopName} was at one end of your year ${topStopCount} ${topStopCount === 1 ? 'time' : 'times'}.`,
      facts: [
        { label: 'The station', value: topStopName },
        { label: 'Places in your year', value: String(destinations) },
      ],
    });
  }

  if (direct > 0) {
    awards.push({
      id: 'changes',
      title: 'Best at avoiding changes',
      stat: `${directPct}%`,
      statLabel: 'change-free',
      line: `${direct} of ${runs.length} journeys had no changes at all.`,
      facts: [
        { label: 'Change-free', value: `${direct} of ${runs.length}` },
        { label: 'Longest trip', value: longest.minutes ? formatDuration(longest.minutes, language) : 'Not recorded' },
      ],
    });
  }

  if (lineList[0] && lineList[0].count >= 2) {
    awards.push({
      id: 'loyal',
      title: 'Most loyal to one line',
      stat: lineList[0].value,
      statLabel: 'your line',
      line: `${lineList[0].count} journeys on it, more than any other line.`,
      facts: [
        { label: 'Journeys on it', value: String(lineList[0].count) },
        { label: 'Your top route', value: pair ? `${nameOf(pairFrom)} to ${nameOf(pairTo)}` : 'Not enough journeys' },
      ],
    });
  }

  const firstRun = runs[0];
  const lastRun = runs[runs.length - 1];
  const plate = nameplateFor({
    runs: runs.length,
    pair: pair ? { from: nameOf(pairFrom), to: nameOf(pairTo), count: pair.count } : null,
    secondPairCount: secondPair?.count ?? 0,
    topOrigin: originList[0] ? nameOf(originList[0].value) : null,
    topOriginCount: originList[0]?.count ?? 0,
    destinations,
    direct,
    peak,
    beforeNine,
    afterSix,
    latestHour,
    longestMinutes: longest.minutes,
    language,
  });
  const carKg = plannedKm * CAR_KG_PER_KM;
  const transitKg = plannedKm * TRANSIT_KG_PER_KM;
  const avoidedKg = Math.max(0, carKg - transitKg);
  const crewSummary: CrewSummary = {
    journeys: runs.length,
    topLine: lineList[0]?.value ?? null,
    traveller: plate?.name ?? null,
    era: eraList.length ? eraList[eraList.length - 1].name : null,
    lines: topEntries(lines, 5).map((entry) => entry.value),
  };
  const comparison = comparisonFor({ year, runs, tally, previous, language });

  /*
   * **Five names, one date.**
   *
   * The readers in `lib/wrapped` answer with ids and moments; the deck is the only place that knows
   * the app's words for a place, so the naming happens here and the share sheet receives the same
   * list rather than looking it up a second time. That is what makes "the card prints what the list
   * showed" a fact about the data instead of a hope about two pieces of code agreeing.
   */
  const rankRows: RankedRow[] = rankedStops(tally, 5).map((entry) => {
    const name = nameOf(entry.id);
    return { name, initial: name.trim().charAt(0).toUpperCase(), count: entry.count };
  });
  const busiest = busiestDay(tally);
  const streak = longestStreak(tally);
  const busiestDate = busiest
    ? new Intl.DateTimeFormat(language === 'nl' ? 'nl-NL' : 'en-GB', {
        day: 'numeric',
        month: 'long',
      }).format(busiest.at)
    : '';

  const story: Array<Chapter | null> = [
    {
      id: 'cover',
      kind: 'cover',
      tone: 'ink',
      track: 'luxury-anthem',
      kicker: 'OVVO Yearbook',
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
      months,
      line: runs.length === 1 ? 'journey planned in OVVO.' : 'journeys planned in OVVO.',
    },
    plate
      ? {
          id: 'name',
          kind: 'name',
          tone: 'sage',
          /* A name is a reveal rather than a count, so it gets the mid-tempo piece. */
          track: 'melodic-trap',
          kicker: 'The traveller you were',
          big: plate.name,
          line: plate.line,
          chips: plate.chips,
        }
      : null,
    mapRoutes.length
      ? {
          id: 'map',
          kind: 'map',
          tone: 'ink',
          track: 'electro-dance',
          kicker: 'Your year as a map',
          big: `${stopsOnMap.length} places`,
          line: 'A year of journeys, drawn between the stops you used.',
          map: {
            stops: stopsOnMap,
            routes: mapRoutes,
            topStopId: topStop,
            topRoute:
              pair && mapByStop.has(pairFrom) && mapByStop.has(pairTo)
                ? { fromId: pairFrom, toId: pairTo, count: pair.count }
                : null,
            topLine: lineList[0]?.value ?? null,
            places: stopsOnMap.length,
            routeCount: mapRoutes.length,
          },
        }
      : null,
    plannedKm > 0
      ? {
          id: 'distance',
          kind: 'distance',
          tone: 'sage',
          track: 'electropop',
          kicker: 'Distance and CO2',
          big: `${plannedKm >= 10 ? Math.round(plannedKm) : plannedKm.toFixed(1)} km`,
          line: 'Planned as the crow flies, from the journeys OVVO could place.',
          distance: {
            km: plannedKm,
            knownRuns: placedRuns,
            totalRuns: runs.length,
            carKg,
            transitKg,
            avoidedKg,
          },
        }
      : null,
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
    rankRows.length >= 3
      ? {
          id: 'ranked',
          kind: 'ranked',
          tone: 'ink',
          track: 'afrobeat',
          kicker: 'Your top five',
          big: `${rankRows.length} places`,
          line: `${rankRows.length} places, in the order you used them.`,
          ranked: rankRows,
        }
      : null,
    busiest && busiest.count >= 2
      ? {
          id: 'day',
          kind: 'day',
          tone: 'cream',
          track: 'acoustic',
          kicker: 'Your busiest day',
          big: busiestDate,
          /* No counting figure: the day is stated, not counted up to. */
          line: `${busiest.count} ${busiest.count === 1 ? 'journey' : 'journeys'} on one day.`,
          day: { at: busiest.at, count: busiest.count, date: busiestDate },
          streak: streak ?? undefined,
        }
      : null,
    eraList.length
      ? {
          id: 'eras',
          kind: 'eras',
          tone: 'cream',
          track: 'indie-pop',
          kicker: 'Your OVVO era',
          big: eraList.length === 1 ? eraList[0].name : `${eraList.length} eras`,
          line: 'The looks you lived in, in the order you wore them.',
          eras: eraList,
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
          /* The number the line carried, so the page can give it the size it earned. */
          count: lineList[0].count,
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
    awards.length
      ? {
          id: 'awards',
          kind: 'awards',
          tone: 'cream',
          track: 'afrobeat',
          kicker: 'The trophy case',
          big: 'Your trophies',
          line: `${awards.length} awards your journeys earned.`,
          awards,
        }
      : null,
    {
      id: 'bookends',
      kind: 'bookends',
      tone: 'ink',
      track: 'acoustic',
      kicker: 'First and last',
      big: 'The year, bookended',
      line: 'The first journey you planned, and the last one.',
      bookends: {
        first: {
          at: firstRun.at,
          hour: firstRun.hour,
          from: nameOf(firstRun.from),
          to: nameOf(firstRun.to),
        },
        last: {
          at: lastRun.at,
          hour: lastRun.hour,
          from: nameOf(lastRun.from),
          to: nameOf(lastRun.to),
        },
      },
    },
    comparison
      ? {
          id: 'comparison',
          kind: 'comparison',
          tone: 'cream',
          track: 'indie-pop',
          kicker: 'Year over year',
          big:
            comparison.journeys === comparison.previousJourneys
              ? 'Exactly the same'
              : comparison.journeys > comparison.previousJourneys
                ? `+${comparison.journeys - comparison.previousJourneys} ${
                    comparison.journeys - comparison.previousJourneys === 1 ? 'journey' : 'journeys'
                  }`
                : `${comparison.previousJourneys - comparison.journeys} fewer`,
          line: `Against ${comparison.previousYear}, from the tally you kept.`,
          comparison,
        }
      : null,
    {
      id: 'crew',
      kind: 'crew',
      tone: 'sage',
      track: 'electro-dance',
      kicker: 'Travel crew',
      big: 'Compare your year',
      line: 'Share a code with a friend. Only counts, lines and looks travel.',
      crew: crewSummary,
    },
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
