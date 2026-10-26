import { METRES_PER_UNIT, requireStop, stopLabel, STOPS, walkMinutesBetween } from './stops';
import {
  BIKE_SPEED_FACTOR,
  directions,
  isInService,
  NETWORK,
  nextDeparture,
  WALK_EDGE_MAX_MINUTES,
  WALK_EDGES,
} from './network';
import { disruptionForLeg } from './disruptions';
import { seededRandom } from '../lib/random';
import { MAX_WALKING_MINUTES, MODE_OPTIONS, modeLabel } from './preferences';
import type { Preferences } from './preferences';
import type {
  IntermediateStop,
  Journey,
  Leg,
  PublicMode,
  SortMode,
  TimeMode,
  TravelMode,
} from './types';

/**
 * The journey planner.
 *
 * Plans over the network data in this app: it is pure and synchronous, so a live
 * timetable source only has to feed it data.
 *
 * Implementation: a small time-dependent RAPTOR-style search that scans each
 * service line in both directions, adds a round per boarding, and relaxes
 * walking (and optional bicycle) links between nearby stops.
 */

export interface SearchQuery {
  fromStopId: string;
  toStopId: string;
  /**
   * What the traveller actually named for each end, when that is not the stop's own name —
   * today only "use my current location", which resolves to a street address while the
   * journey is still planned from the nearest stop. Absent for every other way of choosing,
   * so the stop's own name is the label by default.
   */
  fromLabel?: string;
  toLabel?: string;
  /**
   * How far that named place is from the stop the journey is planned from, in metres.
   *
   * "Use my current location" answers two questions at once: the address the traveller is at,
   * and the nearest stop a journey can be planned from. Usually those are two different places
   * and the stop is simply where the plan starts. But when the address is nearest to the very
   * stop the *other* end names, both ends collapse to one stop id — and the trip is not
   * nothing, it is the distance between the address and that stop. Present only for an end
   * that is a place rather than a stop, so its absence is what says "this end is a stop".
   */
  fromAccessMetres?: number;
  toAccessMetres?: number;
  /** yyyy-mm-dd */
  date: string;
  /** minutes since midnight */
  time: number;
  timeMode: TimeMode;
  /** Preferences captured with the search so it can be replayed later. */
  preferences: Preferences;
}

/**
 * The name of one end of a search for display: the address the traveller named, when they
 * named one, otherwise the stop's own name. Everyone that prints a search's two ends goes
 * through this, so a location-based origin reads the same on the planner card, the results
 * screen and the recent-searches list.
 */
export function endLabel(query: Pick<SearchQuery, 'fromStopId' | 'toStopId' | 'fromLabel' | 'toLabel'>, side: 'from' | 'to'): string {
  const named = side === 'from' ? query.fromLabel : query.toLabel;
  return named ?? stopLabel(side === 'from' ? query.fromStopId : query.toStopId);
}

export interface ResultsFilter {
  modes: PublicMode[];
  directOnly: boolean;
  delayedOnly: boolean;
  hideCancelled: boolean;
  operatorIds: string[];
}

export const DEFAULT_RESULTS_FILTER: ResultsFilter = {
  modes: [],
  directOnly: false,
  delayedOnly: false,
  /*
   * **A cancelled journey is not an option, so it is not in the list.**
   *
   * It was shown by default, with a filter to hide it — so the first thing a traveller read was an
   * itinerary that cannot be made ("if this stops the journey from being possible IT SHOULDNT even
   * be on the list"). The switch stays, because a traveller may want to see what is cancelled; the
   * default is the answer, not the question.
   */
  hideCancelled: true,
  operatorIds: [],
};

interface RawStep {
  kind: 'ride' | 'walk' | 'bike';
  mode: TravelMode;
  fromStopId: string;
  toStopId: string;
  departMinute: number;
  arriveMinute: number;
  lineId?: string;
  directionIndex?: 0 | 1;
  boardIndex?: number;
  alightIndex?: number;
}

interface ParentLabel {
  kind: 'ride' | 'walk';
  mode: TravelMode;
  prevRound: number;
  fromStopIdx: number;
  lineId?: string;
  directionIndex?: 0 | 1;
  boardIndex?: number;
  alightIndex?: number;
  departMinute: number;
  arriveMinute: number;
}

interface PlanRequest {
  fromStopId: string;
  toStopId: string;
  departAfter: number;
  maxTransfers: number;
  transferBuffer: number;
  restrictWalkMinutes: number;
  allowWalkAccess?: boolean;
  excludeLineIds?: string[];
  /** The departure end asked to cycle to the first stop. */
  bikeFromOrigin?: boolean;
  /** The arrival end asked to cycle from the last stop. */
  bikeIntoDestination?: boolean;
}

interface FoundPlan {
  steps: RawStep[];
  arrival: number;
  depart: number;
}

const stopIndex = new Map(STOPS.map((s, i) => [s.id, i]));
const MAX_ROUNDS = 7;

function setWalkLabel(
  roundBest: number[],
  roundParents: (ParentLabel | undefined)[],
  round: number,
  fromIdx: number,
  toIdx: number,
  minutes: number,
  mode: TravelMode,
) {
  const fromTime = roundBest[fromIdx];
  if (!Number.isFinite(fromTime)) return;
  const arrive = fromTime + minutes;
  if (arrive < roundBest[toIdx]) {
    roundBest[toIdx] = arrive;
    roundParents[toIdx] = {
      kind: 'walk',
      mode,
      prevRound: round,
      fromStopIdx: fromIdx,
      departMinute: fromTime,
      arriveMinute: arrive,
    };
  }
}

/**
 * Where the ends of the search are, and whether either of them asked to cycle. Bicycle
 * labels are per end: only the link out of the origin and the link into the destination
 * can ever be bicycle ones.
 */
interface EndModes {
  bikeFromOrigin: boolean;
  bikeIntoDestination: boolean;
  originIdx: number;
  targetIdx: number;
}

function relaxWalkLinks(
  roundBest: number[],
  roundParents: (ParentLabel | undefined)[],
  round: number,
  restrictWalkMinutes: number,
  allowWalk: boolean,
  ends: EndModes,
) {
  for (let pass = 0; pass < 3; pass += 1) {
    let improved = false;
    for (const edge of WALK_EDGES) {
      const from = stopIndex.get(edge.fromStopId);
      const to = stopIndex.get(edge.toStopId);
      if (from === undefined || to === undefined) continue;
      /*
       * The single link from the origin straight to the destination is left out of the
       * search. That link is the whole journey, and the whole-way option — the foot trip,
       * or the bicycle trip when both ends asked for one — is added once by the caller,
       * with its own departure time. Letting the search walk it filled the list with the
       * same journey repeated at five-minute intervals, and where the link was much faster
       * than any service it produced that journey *instead of* the services.
       */
      if (from === ends.originIdx && to === ends.targetIdx) continue;
      // Walking is only used when it is switched on and within the traveller's own limit.
      if (allowWalk && edge.minutes <= restrictWalkMinutes) {
        const before = roundBest[to];
        setWalkLabel(roundBest, roundParents, round, from, to, edge.minutes, 'walk');
        if (roundBest[to] < before) improved = true;
      }
      /*
       * Cycling is an end mode, not a way across the network: a bicycle label is only ever
       * put on the link out of the origin and on the link into the destination, and only
       * when that end asked for one. Labelling *every* walk link with a bicycle used to
       * make both ends of every plan a bicycle leg, so asking for a bicycle at the start
       * then deleted the plans whose *end* was a bicycle — fourteen options collapsed to
       * one, and the second, bicycle-free pass existed only to hide that.
       */
      const bikeAccess = ends.bikeFromOrigin && from === ends.originIdx;
      const bikeEgress = ends.bikeIntoDestination && to === ends.targetIdx;
      if ((bikeAccess || bikeEgress) && edge.minutes <= WALK_EDGE_MAX_MINUTES) {
        const before = roundBest[to];
        setWalkLabel(roundBest, roundParents, round, from, to, Math.max(1, Math.round(edge.minutes / BIKE_SPEED_FACTOR)), 'bike');
        if (roundBest[to] < before) improved = true;
      }
    }
    if (!improved) break;
  }
}

function runSearch(request: PlanRequest): FoundPlan | undefined {
  const origin = stopIndex.get(request.fromStopId);
  const target = stopIndex.get(request.toStopId);
  if (origin === undefined || target === undefined || origin === target) return undefined;

  const n = STOPS.length;
  const rounds = Math.min(MAX_ROUNDS, Math.max(2, request.maxTransfers + 3));
  const best: number[] = new Array(n).fill(Number.POSITIVE_INFINITY);
  best[origin] = request.departAfter;
  const parentTracks: (ParentLabel | undefined)[][] = [];
  const excluded = request.excludeLineIds ?? [];

  for (let round = 1; round <= rounds; round += 1) {
    const roundBest = best.slice();
    const roundParents: (ParentLabel | undefined)[] = new Array(n).fill(undefined);

    for (const line of NETWORK) {
      if (excluded.includes(line.id)) continue;
      for (const dir of directions(line)) {
        let onboard: { departTime: number; boardIdx: number } | null = null;
        for (let i = 0; i < dir.stops.length; i += 1) {
          const idx = stopIndex.get(dir.stops[i]);
          if (idx === undefined) continue;
          const chainArrival = onboard
            ? onboard.departTime + (dir.cum[i] - dir.cum[onboard.boardIdx])
            : Number.POSITIVE_INFINITY;
          const previous = best[idx]; // best of the previous round only
          if (Number.isFinite(previous) && previous < chainArrival) {
            const buffer = round === 1 && idx === origin ? 0 : request.transferBuffer;
            const departure = nextDeparture(line, previous + buffer);
            if (isInService(line, departure)) onboard = { departTime: departure, boardIdx: i };
          }
          if (onboard) {
            const arrive = onboard.departTime + (dir.cum[i] - dir.cum[onboard.boardIdx]);
            if (arrive < roundBest[idx]) {
              const boardStopIdx = stopIndex.get(dir.stops[onboard.boardIdx]);
              if (boardStopIdx !== undefined) {
                roundBest[idx] = arrive;
                roundParents[idx] = {
                  kind: 'ride',
                  mode: line.mode,
                  prevRound: round - 1,
                  fromStopIdx: boardStopIdx,
                  lineId: line.id,
                  directionIndex: dir.index,
                  boardIndex: onboard.boardIdx,
                  alightIndex: i,
                  departMinute: onboard.departTime,
                  arriveMinute: arrive,
                };
              }
            }
          }
        }
      }
    }

    relaxWalkLinks(roundBest, roundParents, round, request.restrictWalkMinutes, request.allowWalkAccess ?? true, {
      bikeFromOrigin: request.bikeFromOrigin ?? false,
      bikeIntoDestination: request.bikeIntoDestination ?? false,
      originIdx: origin,
      targetIdx: target,
    });

    for (let i = 0; i < n; i += 1) best[i] = roundBest[i];
    parentTracks.push(roundParents);
  }

  if (!Number.isFinite(best[target])) return undefined;

  const steps: RawStep[] = [];
  let round = parentTracks.length;
  let current = target;
  let guard = 0;
  while (current !== origin && guard < 80) {
    guard += 1;
    let usedRound = round;
    let label: ParentLabel | undefined;
    while (usedRound >= 1) {
      label = parentTracks[usedRound - 1]?.[current];
      if (label) break;
      usedRound -= 1;
    }
    if (!label) return undefined;
    steps.unshift({
      kind: label.kind === 'ride' ? 'ride' : label.mode === 'bike' ? 'bike' : 'walk',
      mode: label.mode,
      fromStopId: STOPS[label.fromStopIdx].id,
      toStopId: STOPS[current].id,
      departMinute: label.departMinute,
      arriveMinute: label.arriveMinute,
      lineId: label.lineId,
      directionIndex: label.directionIndex,
      boardIndex: label.boardIndex,
      alightIndex: label.alightIndex,
    });
    current = label.fromStopIdx;
    round = label.prevRound;
  }
  if (current !== origin || steps.length === 0) return undefined;
  return { steps, depart: steps[0].departMinute, arrival: steps[steps.length - 1].arriveMinute };
}

/* ------------------------------------------------------------- leg building */

const PLATFORM_STEP = 2;

function platformAt(stopId: string, mode: TravelMode, seedKey: string, offset = 0): string {
  const stop = requireStop(stopId);
  const rng = seededRandom('platform', stopId, mode, seedKey, offset);
  const pool = stop.platforms.length ? stop.platforms : ['1'];
  return pool[Math.floor(rng() * pool.length) % pool.length];
}

function distanceMetres(fromStopId: string, toStopId: string): number {
  const a = requireStop(fromStopId);
  const b = requireStop(toStopId);
  return Math.round(Math.hypot(a.coordinates.x - b.coordinates.x, a.coordinates.y - b.coordinates.y) * METRES_PER_UNIT);
}

function buildLeg(step: RawStep, query: SearchQuery, index: number): Leg {
  const legId = `leg-${hashlessId(query.date, step, index)}`;
  const base: Leg = {
    id: legId,
    mode: step.mode,
    fromStopId: step.fromStopId,
    toStopId: step.toStopId,
    departure: step.departMinute,
    arrival: step.arriveMinute,
    distanceMetres: distanceMetres(step.fromStopId, step.toStopId),
  };

  if (step.kind !== 'ride' || !step.lineId) {
    const minutes = Math.max(1, step.arriveMinute - step.departMinute);
    return {
      ...base,
      distanceMetres: distanceMetres(step.fromStopId, step.toStopId),
      message: step.mode === 'bike' ? `Cycle about ${minutes} min` : undefined,
      stepFree: true,
    };
  }

  const line = NETWORK.find((l) => l.id === step.lineId);
  if (!line) return { ...base, message: 'Service details unavailable' };
  const dir = directions(line).find((d) => d.index === step.directionIndex) ?? directions(line)[0];
  const boardIdx = step.boardIndex ?? 0;
  const alightIdx = step.alightIndex ?? dir.stops.length - 1;
  const intermediate: IntermediateStop[] = [];
  for (let i = boardIdx + 1; i < alightIdx; i += 1) {
    intermediate.push({
      stopId: dir.stops[i],
      arrival: step.departMinute + (dir.cum[i] - dir.cum[boardIdx]),
      departure: step.departMinute + (dir.cum[i] - dir.cum[boardIdx]),
      platform: platformAt(dir.stops[i], line.mode, line.id, i),
    });
  }

  const headsignStopId = dir.stops[dir.stops.length - 1];
  const headsign = requireStop(headsignStopId).name;
  const rng = seededRandom('leg', line.id, step.fromStopId, step.toStopId, query.date, step.departMinute);
  const disruption = disruptionForLeg(line.id, step.fromStopId, step.toStopId);
  const delayRoll = rng();
  let delayMinutes = 0;
  let cancelled = false;
  if (disruption) {
    if (disruption.type === 'cancellation' && delayRoll < 0.25) cancelled = true;
    else if (delayRoll < 0.6) delayMinutes = 3 + Math.round(rng() * (disruption.severity === 'severe' ? 11 : 5));
  } else if (delayRoll < 0.18) {
    delayMinutes = 1 + Math.round(rng() * 4);
  }

  const hour = Math.floor(step.departMinute / 60) % 24;
  const peak = (hour >= 7 && hour < 9) || (hour >= 16 && hour < 19);
  const fromStop = requireStop(step.fromStopId);
  const toStop = requireStop(step.toStopId);

  return {
    ...base,
    arrival: step.arriveMinute + delayMinutes,
    platform: platformAt(step.fromStopId, line.mode, line.id, boardIdx),
    arrivalPlatform: platformAt(step.toStopId, line.mode, line.id, alightIdx + 100),
    lineId: line.id,
    lineNumber: line.number,
    lineName: line.name,
    operatorId: line.operatorId,
    headsign,
    headsignStopId,
    intermediateStops: intermediate.length ? intermediate : undefined,
    delayMinutes: delayMinutes || undefined,
    cancelled: cancelled || undefined,
    message: disruption ? `Alert: ${disruption.title}` : undefined,
    disruptionId: disruption?.id,
    stepFree: fromStop.accessibility.stepFree && toStop.accessibility.stepFree && line.mode !== 'ferry',
    bikeAllowed: line.mode === 'ferry' || line.mode === 'metro' || !peak,
  };
}

function hashlessId(date: string, step: RawStep, index: number): string {
  const parts = [date, step.kind, step.mode, step.fromStopId, step.toStopId, step.departMinute, step.lineId ?? '', index];
  let hash = 2166136261;
  for (const part of parts) {
    const text = String(part);
    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
  }
  return (hash >>> 0).toString(36);
}

/* ------------------------------------------------------- journey assembly */

function planSignature(steps: RawStep[], date: string): string {
  return [
    date,
    ...steps.map((s) => `${s.kind}:${s.lineId ?? s.mode}:${s.fromStopId}>${s.toStopId}@${s.departMinute}`),
  ].join('|');
}

function fareFor(legs: Leg[]): Journey['fare'] {
  let eur = 0;
  for (const leg of legs) {
    if (leg.mode === 'walk' || leg.mode === 'bike') continue;
    const km = (leg.distanceMetres ?? distanceMetres(leg.fromStopId, leg.toStopId)) / 1000;
    if (leg.mode === 'train') eur += 0.6 + km * 0.16;
    else if (leg.mode === 'ferry') eur += 0.2;
    else eur += 0.6 + km * 0.18;
  }
  if (eur === 0) return { eur: 0, label: 'Walking only · no ticket needed' };
  const rounded = Math.max(2.3, Math.round(eur * 20) / 20);
  return { eur: rounded, label: 'Indicative single fare' };
}

function assembleJourney(steps: RawStep[], query: SearchQuery, index: number): Journey {
  const legs = steps
    .map((step, i) => buildLeg(step, query, index + i))
    .sort((a, b) => a.departure - b.departure);
  const rideLegs = legs.filter((l) => l.mode !== 'walk' && l.mode !== 'bike');
  const departure = legs[0]?.departure ?? 0;
  const arrival = legs.reduce((max, l) => Math.max(max, l.arrival), departure);
  const walkMinutes = legs.filter((l) => l.mode === 'walk').reduce((sum, l) => sum + (l.arrival - l.departure), 0);
  const transfers = Math.max(0, rideLegs.length - 1);
  const signature = planSignature(steps, query.date);
  const rng = seededRandom('journey', signature);
  /*
   * Crowding follows the clock, not a coin.
   *
   * The level used to be the average of twelve uniform samples, which has a mean of 0.5 and a
   * spread narrow enough that "really busy" (above 0.7) almost never happened: a review of eight
   * searches and every option on each page found only "Expected quiet" and "Expected fairly
   * busy", so the third level existed in the type and never on the screen. A journey in the
   * morning or evening peak now starts from a busier base, so all three levels occur — still
   * sampled, still the same seeded generator, and still a reading of the journey the engine
   * built (its own departure time), not of the real world.
   */
  const clock = departure % 1440;
  const peak = (clock >= 420 && clock < 570) || (clock >= 960 && clock < 1110);
  const occupancyHistory = Array.from({ length: 12 }, () =>
    Math.round(Math.min(1, (peak ? 0.35 : 0.05) + rng() * 0.8) * 100) / 100,
  );
  const average = occupancyHistory.reduce((a, b) => a + b, 0) / occupancyHistory.length;
  const delayMinutes = legs.reduce((max, l) => Math.max(max, l.delayMinutes ?? 0), 0);
  const cancelled = legs.some((l) => l.cancelled);
  const disruptionIds = [...new Set(legs.map((l) => l.disruptionId).filter((id): id is string => Boolean(id)))];

  return {
    id: `j-${hashlessId(query.date, steps[0], index + 991)}`,
    signature,
    legs,
    departure,
    arrival,
    durationMinutes: Math.max(1, arrival - departure),
    transfers,
    walkMinutes,
    modes: [...new Set(legs.map((l) => l.mode))],
    operatorIds: [...new Set(rideLegs.map((l) => l.operatorId).filter((id): id is string => Boolean(id)))],
    fare: fareFor(legs),
    occupancy: average < 0.4 ? 'quiet' : average < 0.7 ? 'moderate' : 'busy',
    occupancyHistory,
    stepFree: legs.every((l) => l.stepFree !== false),
    bikeAllowed: rideLegs.every((l) => l.bikeAllowed !== false),
    realtime: false,
    delayMinutes,
    cancelled,
    disruptionIds,
    source: 'demo',
  };
}

/* ------------------------------------------------ an address as an end */

/** A steady walking pace: 80 metres a minute is 4.8 km/h. */
const WALK_METRES_PER_MINUTE = 80;

/**
 * The trip between the two ends when they resolve to **one** stop.
 *
 * An address and a station are two places even when one stop answers for both. "Rijksstraatweg 9,
 * Haarlem" resolves to Haarlem station because that is the stop nearest to it, so a search to
 * Haarlem is not an empty search — it is the distance from the address to the station, walked or
 * cycled. Refusing it ("origin and destination must be different stops") told the traveller their
 * own address *was* the station; handing it to the stop-to-stop search produced a one-minute walk
 * from Haarlem to Haarlem, because two identical stops are no distance apart.
 *
 * The address is carried on the leg as its own name, so the itinerary reads
 * "Rijksstraatweg 9, Haarlem → Haarlem" rather than the stop twice, and the distance is the one
 * the picker already measured — a straight line from the device fix to the stop, which is what
 * "1.5 km away" in that panel means.
 *
 * A place at *each* end (two addresses that happen to share a nearest stop) is measured out and
 * back through that stop: the only geometry two distances can support.
 */
function planAccessJourney(query: SearchQuery, windowOffset: number, preferences: Preferences): Journey[] {
  const metresFrom = query.fromAccessMetres;
  const metresTo = query.toAccessMetres;
  if (metresFrom === undefined && metresTo === undefined) return [];
  const metres = Math.max(1, Math.round((metresFrom ?? 0) + (metresTo ?? 0)));

  /*
   * The mode is the one the place end asked for: "by bicycle" at the departure end is the
   * bicycle leg *out of the address*, which here is the whole journey. Walking is the default,
   * and a mode the traveller switched off is never used — the results screen's own relaxations
   * are what offer to switch it back on.
   */
  const askedBike =
    (metresFrom === undefined || preferences.accessFrom === 'bike') &&
    (metresTo === undefined || preferences.accessTo === 'bike');
  const canWalk = preferences.allowedModes.includes('walk');
  const canBike = preferences.allowedModes.includes('bike');
  /* Cycling is never invented: an end that did not ask for a bicycle does not get one, the same
     rule every other bicycle leg in this file follows. */
  const mode: 'walk' | 'bike' | undefined = askedBike && canBike ? 'bike' : canWalk ? 'walk' : undefined;
  if (!mode) return [];

  const pace = mode === 'bike' ? WALK_METRES_PER_MINUTE * BIKE_SPEED_FACTOR : WALK_METRES_PER_MINUTE;
  const minutes = Math.max(1, Math.round(metres / pace));
  const wanted = query.time + windowOffset;
  const departure = query.timeMode === 'depart' ? wanted : Math.max(0, wanted - minutes);
  const arrival = departure + minutes;
  /* Whichever end the address answered for keeps its own name; the other end is the stop. */
  const fromLabel = query.fromAccessMetres !== undefined ? query.fromLabel : undefined;
  const toLabel = query.toAccessMetres !== undefined ? query.toLabel : undefined;

  const leg: Leg = {
    id: `leg-access-${hashlessId(query.date, { kind: mode, mode, fromStopId: query.fromStopId, toStopId: query.toStopId, departMinute: departure, arriveMinute: arrival }, 3)}`,
    mode,
    fromStopId: query.fromStopId,
    toStopId: query.toStopId,
    fromLabel,
    toLabel,
    departure,
    arrival,
    distanceMetres: metres,
    message: mode === 'bike' ? `Cycle about ${minutes} min` : undefined,
    stepFree: true,
  };

  return [
    {
      id: `j-access-${hashlessId(query.date, { kind: mode, mode, fromStopId: query.fromStopId, toStopId: query.toStopId, departMinute: departure, arriveMinute: arrival }, 11)}`,
      signature: `accessonly|${query.date}|${query.fromStopId}>${query.toStopId}@${departure}`,
      legs: [leg],
      departure,
      arrival,
      durationMinutes: minutes,
      transfers: 0,
      walkMinutes: mode === 'walk' ? minutes : 0,
      modes: [mode],
      operatorIds: [],
      fare: { eur: 0, label: mode === 'bike' ? 'Cycling only' : 'Walking only' },
      occupancy: 'quiet',
      occupancyHistory: Array.from({ length: 12 }, () => 0.15),
      stepFree: true,
      bikeAllowed: true,
      realtime: false,
      delayMinutes: 0,
      cancelled: false,
      disruptionIds: [],
      source: 'demo',
    },
  ];
}

/**
 * **The walk from the address to the stop it is planned from.**
 *
 * An address is not its nearest station, and until this existed the planner treated it as one: a
 * search from "Rijksstraatweg 7, Haarlem" (1.5 km from Haarlem Station) to Hoofddorp produced a
 * bus that left Haarlem Station at the requested minute, with the address printed above it and no
 * walk anywhere — reported with a screenshot: *"it also treats adresses like the closest station"*.
 *
 * So the access leg is real now. It is the first leg of the journey (and the last, for an address
 * at the arrival end), with the address as its own name and its own distance, and the search runs
 * from the time the traveller can actually be at the stop: leave at 21:30 from home, be at the
 * station at 21:49, catch the 21:54. Arriving by 22:00 at an address means the service has to be
 * at the stop by 21:41, so that search runs earlier by the same amount.
 *
 * Its mode is the one that end asked for — walking unless the traveller chose a bicycle — and a
 * mode that is switched off in preferences is never invented.
 */
interface AccessLeg {
  mode: 'walk' | 'bike';
  metres: number;
  minutes: number;
}

function accessLegFor(metres: number | undefined, mode: 'walk' | 'bike'): AccessLeg | undefined {
  if (metres === undefined || !Number.isFinite(metres) || metres <= 0) return undefined;
  const pace = mode === 'bike' ? WALK_METRES_PER_MINUTE * BIKE_SPEED_FACTOR : WALK_METRES_PER_MINUTE;
  return { mode, metres, minutes: Math.max(1, Math.round(metres / pace)) };
}

/**
 * The journey with its two access legs attached, and its span widened by them.
 *
 * The first leg ends exactly when the service at the stop leaves, and the last begins when the
 * last service arrives — the walk is not padding, it is the part of the trip the traveller does
 * themselves. Walking minutes and the mode list are recomputed because everything downstream reads
 * them: the card's chain, the walking budget in the filters, and the sort.
 */
function withAccessLegs(
  journey: Journey,
  query: SearchQuery,
  access: { from?: AccessLeg; to?: AccessLeg },
): Journey {
  if (!access.from && !access.to) return journey;
  const legs: Leg[] = [...journey.legs];

  if (access.from) {
    const stop = legs[0];
    legs.unshift({
      id: `leg-access-from-${journey.id}`,
      mode: access.from.mode,
      fromStopId: query.fromStopId,
      toStopId: query.fromStopId,
      /* The address is where this leg starts, so it is the leg's own departure name. */
      fromLabel: query.fromLabel,
      departure: stop.departure - access.from.minutes,
      arrival: stop.departure,
      distanceMetres: access.from.metres,
      message: access.from.mode === 'bike' ? `Cycle about ${access.from.minutes} min` : undefined,
      stepFree: true,
    });
  }

  if (access.to) {
    const stop = legs[legs.length - 1];
    legs.push({
      id: `leg-access-to-${journey.id}`,
      mode: access.to.mode,
      fromStopId: query.toStopId,
      toStopId: query.toStopId,
      toLabel: query.toLabel,
      departure: stop.arrival,
      arrival: stop.arrival + access.to.minutes,
      distanceMetres: access.to.metres,
      message: access.to.mode === 'bike' ? `Cycle about ${access.to.minutes} min` : undefined,
      stepFree: true,
    });
  }

  const departure = legs[0].departure;
  const arrival = legs.reduce((max, leg) => Math.max(max, leg.arrival), departure);
  return {
    ...journey,
    legs,
    departure,
    arrival,
    durationMinutes: Math.max(1, arrival - departure),
    walkMinutes: legs
      .filter((leg) => leg.mode === 'walk')
      .reduce((sum, leg) => sum + (leg.arrival - leg.departure), 0),
    modes: [...new Set(legs.map((leg) => leg.mode))],
    /* The same two stops with and without a walk from an address are two different journeys, and
       a saved one must not answer for the other. */
    signature: `${journey.signature}|${access.from ? `af${access.from.metres}` : ''}${access.to ? `at${access.to.metres}` : ''}`,
  };
}

/* ----------------------------------------------------------- plan search */

export interface PlanOptions {
  /** Shift the requested time window by this many minutes (earlier/later browsing). */
  windowOffsetMinutes?: number;
  maxJourneys?: number;
}

export function planJourneys(query: SearchQuery, options: PlanOptions = {}): Journey[] {
  const preferences = query.preferences;
  const windowOffset = options.windowOffsetMinutes ?? 0;
  const maxJourneys = options.maxJourneys ?? 14;
  /*
   * One stop at both ends has nothing for the stop-to-stop search to plan: it would find the
   * same place twice. When one of the ends is a **place** — an address the picker resolved to
   * that stop — the trip does exist and is answered here. With two genuine stops sharing an id
   * it is a search with no answer, which is not a journey.
   */
  if (query.fromStopId === query.toStopId) {
    return planAccessJourney(query, windowOffset, preferences).slice(0, maxJourneys);
  }
  const allowBikeAccess = preferences.allowedModes.includes('bike');
  /**
   * Cycling is decided per end: the departure end asks for a bicycle leg or it does not,
   * and so does the arrival end. Nothing else in the search changes with this choice —
   * the planner walks exactly the same links — so there is one plan per departure offset
   * and not a bicycle and a bicycle-free one.
   */
  const bikeFromOrigin = allowBikeAccess && preferences.accessFrom === 'bike';
  const bikeIntoDestination = allowBikeAccess && preferences.accessTo === 'bike';
  /*
   * When an end asked to cycle, the search is run twice: once with that end's link
   * labelled as a bicycle one, and once without it. The search keeps a single best path to
   * each stop, so where a bicycle beats every service over the whole trip the bicycle pass
   * arrives at the destination on a bicycle and the services it could be combined with are
   * not in that path at all — the second pass is what keeps them in the list.
   */
  const bikePasses = bikeFromOrigin || bikeIntoDestination ? [true, false] : [false];
  const allowWalkAccess = preferences.allowedModes.includes('walk');
  const walkLimit = allowWalkAccess
    ? Math.min(MAX_WALKING_MINUTES, Math.max(5, preferences.maxWalkingMinutes))
    : 0;
  const restrictWalk = preferences.preferLessWalking ? Math.min(walkLimit, 10) : walkLimit;
  const transferBuffer = preferences.preferFewerTransfers ? 9 : 2;

  /*
   * The walk (or cycle) from each address end to the stop it resolved to, and how far the search
   * window moves because of it. A departure from home at 21:30 cannot catch a 21:30 train, and an
   * arrival at an address by 22:00 has to be off the train before the walk.
   */
  const accessModeFrom: 'walk' | 'bike' | undefined =
    preferences.accessFrom === 'bike' && allowBikeAccess ? 'bike' : allowWalkAccess ? 'walk' : undefined;
  const accessModeTo: 'walk' | 'bike' | undefined =
    preferences.accessTo === 'bike' && allowBikeAccess ? 'bike' : allowWalkAccess ? 'walk' : undefined;
  const accessFrom = accessModeFrom ? accessLegFor(query.fromAccessMetres, accessModeFrom) : undefined;
  const accessTo = accessModeTo ? accessLegFor(query.toAccessMetres, accessModeTo) : undefined;
  const accessShift =
    query.timeMode === 'depart' ? (accessFrom?.minutes ?? 0) : -(accessTo?.minutes ?? 0);

  // A one-hour window of departure offsets, so the list shows several real
  // service instances rather than one repeated option.
  const offsets = query.timeMode === 'depart'
    ? [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60]
    : [0, -5, -10, -15, -20, -25, -30, -35, -40, -45, -50, -55, -60];

  const plans: FoundPlan[] = [];
  const seen = new Set<string>();

  const collect = (plan: FoundPlan | undefined) => {
    if (!plan) return;
    const signature = planSignature(plan.steps, query.date);
    if (seen.has(signature)) return;
    seen.add(signature);
    plans.push(plan);
  };

  const variantSets = [
    { maxTransfers: preferences.maxTransfers, transferBuffer, restrictWalk, excludeLineIds: [] as string[] },
    { maxTransfers: Math.max(0, preferences.maxTransfers - 1), transferBuffer: transferBuffer + 6, restrictWalk, excludeLineIds: [] as string[] },
    { maxTransfers: preferences.maxTransfers, transferBuffer, restrictWalk: Math.min(restrictWalk, 8), excludeLineIds: [] as string[] },
  ];

  let bestFirstLine: string | undefined;

  for (const offset of offsets) {
    const requestTime = Math.round(query.time + windowOffset + offset + accessShift);
    if (requestTime < 0 || requestTime > 1439) continue;
    for (const variant of variantSets) {
      for (const pass of bikePasses) {
        const plan = runSearch({
          fromStopId: query.fromStopId,
          toStopId: query.toStopId,
          departAfter: requestTime,
          maxTransfers: variant.maxTransfers,
          transferBuffer: variant.transferBuffer,
          restrictWalkMinutes: variant.restrictWalk,
          excludeLineIds: variant.excludeLineIds,
          allowWalkAccess,
          bikeFromOrigin: bikeFromOrigin && pass,
          bikeIntoDestination: bikeIntoDestination && pass,
        });
        collect(plan);
        if (!bestFirstLine && plan) {
          bestFirstLine = plan.steps.find((s) => s.lineId)?.lineId;
        }
      }
    }
  }

  // Alternative corridor: when the list is dominated by one service, plan the
  // same search while avoiding the lines of the fastest option.
  // Alternative corridors: when the list is dominated by one service, plan the
  // same search while avoiding the lines already found, so the results show
  // genuinely different options (for example a slower Sprinter instead of the
  // fastest Intercity) rather than the same service at a later time.
  if (plans.length < 12 && bestFirstLine) {
    const avoidSoFar = new Set<string>();
    for (let round = 0; round < 2; round += 1) {
      const byArrival = [...plans].sort((a, b) => a.arrival - b.arrival);
      for (const plan of byArrival) {
        const lines = plan.steps.map((step) => step.lineId).filter((id): id is string => Boolean(id));
        if (lines.length === 0 || lines.every((id) => avoidSoFar.has(id))) continue;
        lines.forEach((id) => avoidSoFar.add(id));
        break;
      }
      if (avoidSoFar.size === 0) break;
      const before = plans.length;
      for (const offset of offsets.slice(0, 8)) {
        const requestTime = Math.round(query.time + windowOffset + offset + accessShift);
        if (requestTime < 0 || requestTime > 1439) continue;
        for (const pass of bikePasses) {
          collect(
            runSearch({
              fromStopId: query.fromStopId,
              toStopId: query.toStopId,
              departAfter: requestTime,
              maxTransfers: Math.max(1, preferences.maxTransfers),
              transferBuffer,
              restrictWalkMinutes: restrictWalk,
              excludeLineIds: [...avoidSoFar],
              allowWalkAccess,
              bikeFromOrigin: bikeFromOrigin && pass,
              bikeIntoDestination: bikeIntoDestination && pass,
            }),
          );
        }
      }
      if (plans.length === before) break;
    }
  }

  /*
   * Plans with no service in them are dropped. They are walks or cycles over the same link
   * set, and the whole-way option below already covers that trip once: the search can find
   * one link, or two links end to end, or the same one at every departure offset, and all
   * of them together buried the services under the same journey repeated.
   */
  let journeys = plans
    .map((plan, index) => assembleJourney(plan.steps, query, index))
    .filter((journey) => journey.legs.some((leg) => leg.mode !== 'walk' && leg.mode !== 'bike'));

  /*
   * The whole-way option: the trip with no service in it, offered once. It is a foot trip
   * when either end is a walking one — and when both ends asked to cycle it is the same
   * trip on a bicycle instead, which is the option that mode implies and the faster of the
   * two over the same link. It is not offered twice, at five-minute intervals, because a
   * traveller on foot or on a bicycle leaves when they like.
   */
  const fromStop = requireStop(query.fromStopId);
  const toStop = requireStop(query.toStopId);
  const directWalk = walkMinutesBetween(fromStop, toStop);
  const bothEndsCycle = bikeFromOrigin && bikeIntoDestination;
  const bicycleWholeWay = bothEndsCycle && directWalk <= WALK_EDGE_MAX_MINUTES;
  const alreadyWalkOnly = journeys.some((j) => j.legs.length === 1 && j.legs[0].mode === 'walk');
  if (!alreadyWalkOnly && allowWalkAccess && !bothEndsCycle && directWalk <= walkLimit && directWalk <= 25) {
    const depart = query.time + windowOffset;
    const walkLeg: Leg = {
      id: `leg-walk-direct-${directWalk}`,
      mode: 'walk',
      fromStopId: query.fromStopId,
      toStopId: query.toStopId,
      departure: depart,
      arrival: depart + directWalk,
      distanceMetres: distanceMetres(query.fromStopId, query.toStopId),
      stepFree: fromStop.accessibility.stepFree && toStop.accessibility.stepFree,
    };
    const includeWalkOnly = query.timeMode === 'depart' ? walkLeg.arrival >= query.time : walkLeg.arrival <= query.time;
    if (includeWalkOnly) {
      journeys.push({
        id: `j-walk-${hashlessId(query.date, { kind: 'walk', mode: 'walk', fromStopId: query.fromStopId, toStopId: query.toStopId, departMinute: depart, arriveMinute: walkLeg.arrival }, 7)}`,
        signature: `walkonly|${query.date}|${query.fromStopId}>${query.toStopId}@${depart}`,
        legs: [walkLeg],
        departure: depart,
        arrival: walkLeg.arrival,
        durationMinutes: directWalk,
        transfers: 0,
        walkMinutes: directWalk,
        modes: ['walk'],
        operatorIds: [],
        fare: { eur: 0, label: 'Walking only' },
        occupancy: 'quiet',
        occupancyHistory: Array.from({ length: 12 }, () => 0.15),
        stepFree: walkLeg.stepFree ?? true,
        bikeAllowed: true,
        realtime: false,
        delayMinutes: 0,
        cancelled: false,
        disruptionIds: [],
        source: 'demo',
      });
    }
  }

  const alreadyBikeOnly = journeys.some((j) => j.legs.length === 1 && j.legs[0].mode === 'bike');
  if (!alreadyBikeOnly && bicycleWholeWay) {
    const depart = query.time + windowOffset;
    const bikeMinutes = Math.max(1, Math.round(directWalk / BIKE_SPEED_FACTOR));
    const bikeLeg: Leg = {
      id: `leg-bike-direct-${bikeMinutes}`,
      mode: 'bike',
      fromStopId: query.fromStopId,
      toStopId: query.toStopId,
      departure: depart,
      arrival: depart + bikeMinutes,
      distanceMetres: distanceMetres(query.fromStopId, query.toStopId),
      stepFree: fromStop.accessibility.stepFree && toStop.accessibility.stepFree,
    };
    const includeBikeOnly = query.timeMode === 'depart' ? bikeLeg.arrival >= query.time : bikeLeg.arrival <= query.time;
    if (includeBikeOnly) {
      journeys.push({
        id: `j-bike-${hashlessId(query.date, { kind: 'bike', mode: 'bike', fromStopId: query.fromStopId, toStopId: query.toStopId, departMinute: depart, arriveMinute: bikeLeg.arrival }, 7)}`,
        signature: `bikeonly|${query.date}|${query.fromStopId}>${query.toStopId}@${depart}`,
        legs: [bikeLeg],
        departure: depart,
        arrival: bikeLeg.arrival,
        durationMinutes: bikeMinutes,
        transfers: 0,
        walkMinutes: 0,
        modes: ['bike'],
        operatorIds: [],
        fare: { eur: 0, label: 'Cycling only' },
        occupancy: 'quiet',
        occupancyHistory: Array.from({ length: 12 }, () => 0.15),
        stepFree: bikeLeg.stepFree ?? true,
        bikeAllowed: true,
        realtime: false,
        delayMinutes: 0,
        cancelled: false,
        disruptionIds: [],
        source: 'demo',
      });
    }
  }

  /*
   * Cycling is opt-in, per end: the access leg (the first) is only a bicycle one when the
   * departure end asks for it, and the egress leg (the last) only when the arrival end
   * does. Bicycle legs *between* stops stay governed by `allowedModes` the way every other
   * mode is.
   *
   * The rule is applied *before* the list is cut to length. Cutting first and filtering
   * afterwards threw most of the list away: the best fourteen of a search where bicycle
   * links exist are mostly bicycle-led, so a walk/walk search could come back with a
   * single option out of a possible fourteen.
   */
  /*
   * Both ends now carry their own walk, so everything below — the bicycle-per-end rule, the sort,
   * the walking budget, the card's chain — reads a journey that starts at the address it was
   * asked from.
   */
  if (accessFrom || accessTo) {
    journeys = journeys.map((journey) => withAccessLegs(journey, query, { from: accessFrom, to: accessTo }));
  }

  const perEnd = journeys.filter((journey) => {
    const first = journey.legs[0]?.mode;
    const last = journey.legs[journey.legs.length - 1]?.mode;
    if (first === 'bike' && preferences.accessFrom !== 'bike') return false;
    if (last === 'bike' && preferences.accessTo !== 'bike') return false;
    return true;
  });
  /*
   * Bicycle labels only sit on the two ends, so this rule is a guard rather than the
   * mechanism: a bicycle first leg cannot exist unless the departure end asked for one.
   * It still keeps the unfiltered list if it would ever empty it, because choosing a mode
   * must never be how the results disappear.
   */
  journeys = perEnd.length > 0 ? perEnd : journeys;
  journeys = sortJourneys(journeys, 'best').slice(0, maxJourneys);
  return withLabels(journeys, preferences);
}

/* --------------------------------------------------- sorting, filters, labels */

export function sortJourneys(journeys: Journey[], sort: SortMode, preferences?: Preferences): Journey[] {
  const list = [...journeys];
  const penalty = (j: Journey) => {
    const transferWeight = preferences?.preferFewerTransfers ? 12 : 4;
    const walkWeight = preferences?.preferLessWalking ? 3 : 1.5;
    return j.durationMinutes + j.transfers * transferWeight + j.walkMinutes * walkWeight;
  };
  switch (sort) {
    case 'fastest':
      return list.sort((a, b) => a.durationMinutes - b.durationMinutes || a.transfers - b.transfers);
    case 'fewestTransfers':
      return list.sort((a, b) => a.transfers - b.transfers || a.durationMinutes - b.durationMinutes);
    case 'leastWalking':
      return list.sort((a, b) => a.walkMinutes - b.walkMinutes || a.durationMinutes - b.durationMinutes);
    case 'cheapest':
      return list.sort((a, b) => a.fare.eur - b.fare.eur || a.durationMinutes - b.durationMinutes);
    case 'latestDeparture':
      return list.sort((a, b) => b.departure - a.departure || a.durationMinutes - b.durationMinutes);
    default:
      return list.sort((a, b) => penalty(a) - penalty(b) || a.departure - b.departure);
  }
}

function rideModesOf(journey: Journey): PublicMode[] {
  return [...new Set(journey.legs.filter((l) => l.mode !== 'walk' && l.mode !== 'bike').map((l) => l.mode as PublicMode))];
}

/** Applies both the traveller's preferences and the result-page filters. */
export function filterJourneys(
  journeys: Journey[],
  filter: ResultsFilter,
  preferences: Preferences,
): Journey[] {
  return journeys.filter((journey) => {
    const modes = rideModesOf(journey);
    if (modes.some((m) => !preferences.allowedModes.includes(m))) return false;
    if (preferences.maxTransfers < 4 && journey.transfers > preferences.maxTransfers) return false;
    if (journey.walkMinutes > preferences.maxWalkingMinutes) return false;
    if (filter.modes.length && (modes.length === 0 || modes.some((m) => !filter.modes.includes(m)))) return false;
    if (filter.directOnly && journey.transfers !== 0) return false;
    if (filter.delayedOnly && journey.delayMinutes <= 0 && !journey.cancelled) return false;
    if (filter.hideCancelled && journey.cancelled) return false;
    if (filter.operatorIds.length && !journey.operatorIds.some((id) => filter.operatorIds.includes(id))) return false;
    return true;
  });
}

/**
 * Why did nothing match? Re-plans the search with one preference relaxed at a
 * time and returns only the relaxations that actually produce journeys, so the
 * results page can offer the fix inline instead of sending the traveller back
 * to the preferences screen.
 */
export interface RelaxSuggestion {
  id: string;
  label: string;
  patch: Partial<Preferences>;
  journeys: number;
}

export function suggestRelaxations(query: SearchQuery, filter: ResultsFilter): RelaxSuggestion[] {
  const preferences = query.preferences;
  const candidates: RelaxSuggestion[] = [];

  if (!preferences.allowedModes.includes('walk')) {
    candidates.push({
      id: 'walk',
      label: 'Turn walking back on',
      patch: { allowedModes: [...preferences.allowedModes, 'walk'] },
      journeys: 0,
    });
  }
  for (const mode of MODE_OPTIONS) {
    if (mode === 'walk' || preferences.allowedModes.includes(mode)) continue;
    candidates.push({
      id: `mode-${mode}`,
      label: `Allow ${modeLabel(mode).toLowerCase()}`,
      patch: { allowedModes: [...preferences.allowedModes, mode] },
      journeys: 0,
    });
  }
  if (preferences.allowedModes.includes('walk') && preferences.maxWalkingMinutes < MAX_WALKING_MINUTES) {
    candidates.push({
      id: 'walk-limit',
      label: `Raise the walking limit to ${MAX_WALKING_MINUTES} min`,
      patch: { maxWalkingMinutes: MAX_WALKING_MINUTES },
      journeys: 0,
    });
  }
  if (preferences.maxTransfers < 4) {
    candidates.push({
      id: 'transfers',
      label: 'Allow more transfers',
      patch: { maxTransfers: 4 },
      journeys: 0,
    });
  }

  const suggestions: RelaxSuggestion[] = [];
  for (const candidate of candidates.slice(0, 8)) {
    const patched: Preferences = { ...preferences, ...candidate.patch };
    const planned = planJourneys({ ...query, preferences: patched });
    const matching = filterJourneys(planned, filter, patched).length;
    if (matching > 0) suggestions.push({ ...candidate, journeys: matching });
  }
  return suggestions.sort((a, b) => b.journeys - a.journeys);
}

/** Marks the stand-out option per metric, so the results list can highlight them. */
export function withLabels(journeys: Journey[], preferences: Preferences): Journey[] {
  if (journeys.length === 0) return journeys;
  const list = journeys.map((j) => ({ ...j, label: undefined }));
  const fastest = [...list].sort((a, b) => a.durationMinutes - b.durationMinutes)[0];
  const mark = (journey: Journey, label: NonNullable<Journey['label']>) => {
    if (!journey.label) journey.label = label;
  };
  mark(fastest, 'fastest');
  const direct = list.find((j) => j.transfers === 0);
  if (direct && fastest.transfers > 0) mark(direct, 'direct');
  const fewest = [...list].sort((a, b) => a.transfers - b.transfers)[0];
  if (fewest.transfers < fastest.transfers) mark(fewest, 'fewestTransfers');
  const leastWalking = [...list].sort((a, b) => a.walkMinutes - b.walkMinutes)[0];
  if (leastWalking.walkMinutes < fastest.walkMinutes - 2) mark(leastWalking, 'leastWalking');
  if (preferences.preferFewerTransfers && fewest !== fastest) mark(fewest, 'fewestTransfers');
  if (preferences.preferLessWalking && leastWalking !== fastest) mark(leastWalking, 'leastWalking');
  return list;
}

export const JOURNEY_LABELS: Record<NonNullable<Journey['label']>, string> = {
  fastest: 'Fastest',
  fewestTransfers: 'Fewest transfers',
  leastWalking: 'Least walking',
  direct: 'Direct',
};

/** Rebuilds a journey for a saved search (used to restore bookmarked journeys). */
export function findJourneyById(query: SearchQuery, id: string, windowOffsetMinutes = 0): Journey | undefined {
  return planJourneys(query, { windowOffsetMinutes }).find((j) => j.id === id);
}

/** Broad category of a departure/ journey for board filtering. */
export function modeGroupLabel(mode: TravelMode): string {
  switch (mode) {
    case 'walk': return 'Walking';
    case 'bike': return 'Bicycle';
    case 'train': return 'Train';
    case 'bus': return 'Bus';
    case 'tram': return 'Tram';
    case 'metro': return 'Metro';
    case 'ferry': return 'Ferry';
    default: return 'Other';
  }
}

export const PLATFORM_STRIDE = PLATFORM_STEP;
