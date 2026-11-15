import { getStop, requireStop, STOPS } from './stops';
import { directions, getLine, isInService, NETWORK, nextDeparture, linesAtStop } from './network';
import { disruptionForLeg } from './disruptions';
import { OPERATORS } from './operators';
import { seededRandom } from '../lib/random';
import { BOARDS } from './generated/boards';
import { SAMPLE_DATA_ALLOWED } from '../lib/dataMode';
import type { Departure, PublicMode } from './types';

/**
 * Departure boards.
 *
 * Times are generated from the network in `./network`. The interface only reads
 * `Departure` objects, so a live feed can replace this generator directly.
 */

export interface BoardOptions {
  /** Minutes since midnight the board starts showing. */
  fromMinutes: number;
  limit?: number;
  /** Bumping the tick rebuilds the board ("refresh"). */
  tick?: number;
  modeFilter?: Departure['mode'][];
  lineQuery?: string;
  destinationQuery?: string;
}

/** The service day the real feed is indexed under, in local time. */
function todayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
}

/**
 * **A board read out of the real timetable, or nothing.**
 *
 * The generated data holds scheduled departures for the stops the app knows, for the service days
 * the feed was built for. It carries no delay: a scheduled time is not a prediction, and calling
 * one "on time" would be inventing a fact. Realtime is a separate feed and a separate step.
 */
function boardFromTimetable(stopId: string, options: BoardOptions): Departure[] {
  const rows = BOARDS[stopId]?.[todayKey()];
  if (!rows || rows.length === 0) return [];
  const from = options.fromMinutes;
  const named = (headsign: string) => STOPS.find((candidate) => candidate.id !== stopId && headsign.startsWith(candidate.name));
  const here = getStop(stopId)?.name ?? '';
  return rows
    /* A trip that ends here has no onward departure: its headsign is this station, which read as
       "Utrecht Centraal → Utrecht Centraal" on the board. The sample generator already drops its
       terminus; the real feed needs the same rule. */
    .filter((row) => !here || !row.d.startsWith(here))
    .map<Departure>((row) => {
      const planned = Math.round(row.s / 60);
      const destination = named(row.d);
      /* The feed names operators in its own spelling (`NS`, `Arriva`); the app's operator id is
         the join key every badge and colour reads. Matching here is what stops a row printing
         "Onbekend" for an operator the app actually knows. */
      const operator = OPERATORS.find(
        (entry) => entry.id === row.o || entry.shortName === row.o || entry.name === row.o,
      );
      return {
        id: `tt-${stopId}-${row.s}-${row.l}`,
        stopId,
        mode: (row.m as PublicMode) ?? 'bus',
        lineId: `tt-${row.l}`,
        lineNumber: row.l,
        operatorId: operator?.id ?? '',
        destinationStopId: destination?.id ?? '',
        destinationLabel: row.d || destination?.name || '',
        planned,
        expected: planned,
        platform: row.p,
        delayMinutes: 0,
        cancelled: false,
        accessible: false,
        directionIndex: 0,
        source: 'timetable',
        tripId: row.t,
      };
    })
    .filter((departure) => departure.planned >= from - 1)
    .sort((a, b) => a.planned - b.planned)
    .slice(0, options.limit ?? 24);
}

export function boardForStop(stopId: string, options: BoardOptions): Departure[] {
  const stop = getStop(stopId);
  if (!stop) return [];
  /* Real first. A stop the feed knows is never answered with invented times. */
  const real = boardFromTimetable(stopId, options);
  if (real.length > 0) return real;
  if (!SAMPLE_DATA_ALLOWED) return [];
  const limit = options.limit ?? 24;
  const from = options.fromMinutes;
  const lines = linesAtStop(stopId);
  const entries: Departure[] = [];

  for (const line of lines) {
    for (const dir of directions(line)) {
      const index = dir.stops.indexOf(stopId);
      if (index < 0) continue;
      const isTerminus = index === dir.stops.length - 1;
      if (isTerminus && dir.stops.length > 1) continue; // arriving services only
      const destinationStopId = dir.stops[dir.stops.length - 1];
      let departure = nextDeparture(line, from);
      for (let i = 0; i < 6 && entries.length < limit * 3; i += 1) {
        if (!isInService(line, departure)) break;
        entries.push(makeDeparture(line.id, dir.index, stopId, destinationStopId, departure));
        departure += line.headway;
        if (departure > 1440 + 180) break;
      }
    }
  }

  return entries.sort((a, b) => a.expected - b.expected || a.planned - b.planned).slice(0, limit);
}

/**
 * One line's board at one stop — the screen a line row in "Lines calling here" opens (F20).
 *
 * `boardForStop` cannot answer this: it builds every line's departures and only then cuts the
 * list to `limit`, so a line that is not among a busy stop's first dozen services would come
 * back empty. This walks just this line's two directions, from the same `nextDeparture` and the
 * same `makeDeparture` the stop board uses, so a delay, a cancellation and a platform are the
 * same facts on both screens.
 */
export function boardForLine(lineId: string, stopId: string, options: BoardOptions): Departure[] {
  const line = getLine(lineId);
  const stop = getStop(stopId);
  if (!line || !stop) return [];
  /* The real feed is indexed by stop, not by the app's line ids, so a single line's board cannot
   * be answered from it yet. Rather than mix the two, a build without sample data shows nothing. */
  if (!SAMPLE_DATA_ALLOWED) return [];
  const limit = options.limit ?? 24;
  const entries: Departure[] = [];

  for (const dir of directions(line)) {
    const index = dir.stops.indexOf(stopId);
    if (index < 0) continue;
    /* The terminus only receives traffic: a service ending here has no departure to show. */
    if (index === dir.stops.length - 1 && dir.stops.length > 1) continue;
    const destinationStopId = dir.stops[dir.stops.length - 1];
    let departure = nextDeparture(line, options.fromMinutes);
    for (let i = 0; i < 10 && entries.length < limit * 2; i += 1) {
      if (!isInService(line, departure)) break;
      entries.push(makeDeparture(line.id, dir.index, stopId, destinationStopId, departure));
      departure += line.headway;
      if (departure > 1440 + 180) break;
    }
  }

  return entries.sort((a, b) => a.expected - b.expected || a.planned - b.planned).slice(0, limit);
}

function makeDeparture(
  lineId: string,
  directionIndex: 0 | 1,
  stopId: string,
  destinationStopId: string,
  planned: number,
): Departure {
  const line = getLine(lineId);
  /*
   * **A refresh must not change what the board says.**
   *
   * The refresh counter (`BoardOptions.tick`) used to be part of this seed, so every five seconds —
   * and every time the tab came back to the front, which ticks immediately — a service was re-rolled
   * and could turn from on time into late, or from cancelled into running. The board's own line then
   * went from "4 delays in this window" to "1 delay in this window" with nothing having happened on
   * the line: a refresh is a repaint, and a fact about a departure is not a repaint.
   */
  const rng = seededRandom('departure', lineId, directionIndex, stopId, planned);
  const disruption = disruptionForLeg(lineId, stopId, destinationStopId);
  const roll = rng();
  let delayMinutes = 0;
  let cancelled = false;
  if (disruption) {
    if (disruption.type === 'cancellation' && roll < 0.3) cancelled = true;
    else if (roll < 0.7) delayMinutes = 3 + Math.round(rng() * (disruption.severity === 'severe' ? 12 : 6));
  } else if (roll < 0.16) {
    delayMinutes = 1 + Math.round(rng() * 4);
  }

  const platforms = requireStop(stopId).platforms;
  const platform = platforms[Math.floor(rng() * platforms.length) % platforms.length] ?? '1';
  const stop = requireStop(stopId);

  return {
    id: `dep-${lineId}-${directionIndex}-${planned}-${stopId}`,
    stopId,
    mode: line?.mode ?? 'bus',
    lineId,
    lineNumber: line?.number ?? '?',
    operatorId: line?.operatorId ?? 'ns',
    destinationStopId,
    destinationLabel: requireStop(destinationStopId).name,
    planned,
    expected: planned + delayMinutes,
    platform,
    delayMinutes,
    cancelled,
    accessible: stop.accessibility.stepFree && stop.accessibility.lowFloorBoarding,
    disruptionId: disruption?.id,
    directionIndex,
    source: 'demo',
  };
}

/** Filtering happens on the local demonstration data, never on a remote feed. */
export function filterDepartures(departures: Departure[], options: BoardOptions): Departure[] {
  const modes = options.modeFilter ?? [];
  const lineQuery = (options.lineQuery ?? '').trim().toLowerCase();
  const destinationQuery = (options.destinationQuery ?? '').trim().toLowerCase();
  return departures.filter((d) => {
    if (modes.length && !modes.includes(d.mode)) return false;
    if (lineQuery && !`${d.lineNumber} ${d.destinationLabel}`.toLowerCase().includes(lineQuery)) return false;
    if (destinationQuery && !d.destinationLabel.toLowerCase().includes(destinationQuery)) return false;
    return true;
  });
}

/** Stops with the most departures per hour — used for the departure-board shortcuts. */
export function busiestStops(limit = 6): string[] {
  const counts = new Map<string, number>();
  for (const line of NETWORK) {
    for (const stopId of line.stops) counts.set(stopId, (counts.get(stopId) ?? 0) + Math.round(60 / line.headway));
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([stopId]) => stopId);
}
