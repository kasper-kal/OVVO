import { METRES_PER_UNIT, requireStop, STOPS, walkMinutesBetween } from './stops';
import { directions, isInService, NETWORK, nextDeparture, WALK_EDGES } from './network';
import { disruptionForLeg } from './disruptions';
import { seededRandom } from '../lib/random';
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
 * The prototype's own simulated timetable planner.
 *
 * IMPORTANT: this plans over demonstration data only. It does not contact a
 * routing service, a real timetable or a vehicle feed, and every journey it
 * produces is presented in the UI as simulated information.
 *
 * Implementation: a small time-dependent RAPTOR-style search that scans each
 * service line in both directions, adds a round per boarding, and relaxes
 * walking (and optional bicycle) links between nearby stops.
 */

export interface SearchQuery {
  fromStopId: string;
  toStopId: string;
  /** yyyy-mm-dd */
  date: string;
  /** minutes since midnight */
  time: number;
  timeMode: TimeMode;
  /** Preferences captured with the search so it can be replayed later. */
  preferences: Preferences;
}

export interface ResultsFilter {
  modes: PublicMode[];
  directOnly: boolean;
  stepFreeOnly: boolean;
  delayedOnly: boolean;
  hideCancelled: boolean;
  operatorIds: string[];
}

export const DEFAULT_RESULTS_FILTER: ResultsFilter = {
  modes: [],
  directOnly: false,
  stepFreeOnly: false,
  delayedOnly: false,
  hideCancelled: false,
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
  excludeLineIds?: string[];
  allowBikeAccess?: boolean;
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

function relaxWalkLinks(
  roundBest: number[],
  roundParents: (ParentLabel | undefined)[],
  round: number,
  restrictWalkMinutes: number,
  allowBike: boolean,
) {
  for (let pass = 0; pass < 3; pass += 1) {
    let improved = false;
    for (const edge of WALK_EDGES) {
      if (edge.minutes > restrictWalkMinutes) continue;
      const from = stopIndex.get(edge.fromStopId);
      const to = stopIndex.get(edge.toStopId);
      if (from === undefined || to === undefined) continue;
      const before = roundBest[to];
      setWalkLabel(roundBest, roundParents, round, from, to, edge.minutes, 'walk');
      if (roundBest[to] < before) improved = true;
      if (allowBike && edge.minutes <= 8) {
        const bikeBefore = roundBest[to];
        setWalkLabel(roundBest, roundParents, round, from, to, Math.max(1, Math.round(edge.minutes / 3.2)), 'bike');
        if (roundBest[to] < bikeBefore) improved = true;
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

    relaxWalkLinks(
      roundBest,
      roundParents,
      round,
      request.restrictWalkMinutes,
      request.allowBikeAccess ?? false,
    );

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
      message: step.mode === 'bike' ? `Cycle about ${minutes} min (demonstration leg)` : undefined,
      stepFree: true,
    };
  }

  const line = NETWORK.find((l) => l.id === step.lineId);
  if (!line) return { ...base, message: 'Service details unavailable in this demo' };
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

  const headsign = requireStop(dir.stops[dir.stops.length - 1]).name;
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
    intermediateStops: intermediate.length ? intermediate : undefined,
    delayMinutes: delayMinutes || undefined,
    cancelled: cancelled || undefined,
    message: disruption ? `Example alert: ${disruption.title}` : undefined,
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
  return { eur: rounded, label: 'Indicative demo fare · single journey' };
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
  const occupancyHistory = Array.from({ length: 12 }, () => Math.round(rng() * 100) / 100);
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
  const allowBikeAccess = preferences.bikeMode !== 'none';
  const walkLimit = Math.min(45, Math.max(5, preferences.maxWalkingMinutes));
  const restrictWalk = preferences.preferLessWalking ? Math.min(walkLimit, 10) : walkLimit;
  const transferBuffer = preferences.preferFewerTransfers ? 9 : 2;

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
    const requestTime = Math.round(query.time + windowOffset + offset);
    if (requestTime < 0 || requestTime > 1439) continue;
    for (const variant of variantSets) {
      const plan = runSearch({
        fromStopId: query.fromStopId,
        toStopId: query.toStopId,
        departAfter: requestTime,
        maxTransfers: variant.maxTransfers,
        transferBuffer: variant.transferBuffer,
        restrictWalkMinutes: variant.restrictWalk,
        excludeLineIds: variant.excludeLineIds,
        allowBikeAccess,
      });
      collect(plan);
      if (!bestFirstLine && plan) {
        bestFirstLine = plan.steps.find((s) => s.lineId)?.lineId;
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
        const requestTime = Math.round(query.time + windowOffset + offset);
        if (requestTime < 0 || requestTime > 1439) continue;
        collect(
          runSearch({
            fromStopId: query.fromStopId,
            toStopId: query.toStopId,
            departAfter: requestTime,
            maxTransfers: Math.max(1, preferences.maxTransfers),
            transferBuffer,
            restrictWalkMinutes: restrictWalk,
            excludeLineIds: [...avoidSoFar],
            allowBikeAccess,
          }),
        );
      }
      if (plans.length === before) break;
    }
  }

  let journeys = plans.map((plan, index) => assembleJourney(plan.steps, query, index));

  // Pure walking option when the two stops are close enough to walk anyway.
  const fromStop = requireStop(query.fromStopId);
  const toStop = requireStop(query.toStopId);
  const directWalk = walkMinutesBetween(fromStop, toStop);
  const alreadyWalkOnly = journeys.some((j) => j.legs.length === 1 && j.legs[0].mode === 'walk');
  if (!alreadyWalkOnly && directWalk <= walkLimit && directWalk <= 25) {
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
    if (modes.some((m) => preferences.avoidedModes.includes(m))) return false;
    if (modes.some((m) => !preferences.allowedModes.includes(m))) return false;
    if (preferences.maxTransfers < 4 && journey.transfers > preferences.maxTransfers) return false;
    if (journey.walkMinutes > preferences.maxWalkingMinutes) return false;
    if (preferences.stepFreeOnly && !journey.stepFree) return false;
    if (preferences.needAssistance) {
      const needsAssistance = journey.legs.some(
        (l) => l.mode === 'train' && !requireStop(l.fromStopId).accessibility.assistance,
      );
      if (needsAssistance) return false;
    }
    if (preferences.lowFloorBoarding) {
      const lowFloorOk = journey.legs.every(
        (l) => !l.lineId || requireStop(l.fromStopId).accessibility.lowFloorBoarding,
      );
      if (!lowFloorOk) return false;
    }
    if (filter.modes.length && (modes.length === 0 || modes.some((m) => !filter.modes.includes(m)))) return false;
    if (filter.directOnly && journey.transfers !== 0) return false;
    if (filter.stepFreeOnly && !journey.stepFree) return false;
    if (filter.delayedOnly && journey.delayMinutes <= 0 && !journey.cancelled) return false;
    if (filter.hideCancelled && journey.cancelled) return false;
    if (filter.operatorIds.length && !journey.operatorIds.some((id) => filter.operatorIds.includes(id))) return false;
    return true;
  });
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
