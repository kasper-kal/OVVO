/**
 * **Real journeys, computed in the browser from the timetable files.**
 *
 * The files under `/graph/<day>/` are built by `scripts/gtfs/build-graph.mjs` from the official
 * Dutch timetable. Nothing here invents a time: a journey is a chain of real scheduled connections
 * read out of those files.
 *
 * The search runs in the browser rather than in a server function, deliberately. A free server
 * function allows about ten milliseconds of processor time, which a national journey search exceeds;
 * a browser has no such ceiling, and the files are ordinary static downloads, which cost nothing.
 * So the user's own machine does the work and no server is needed at all.
 *
 * The search itself is a **connection scan**: connections sorted by departure, one pass, earliest
 * arrival wins. It is exhaustive, so it cannot quietly return a worse journey than the timetable
 * allows — the property the fast route search still lacks.
 */

export interface PlanLeg {
  mode: 'train' | 'bus' | 'tram' | 'metro' | 'ferry' | 'walk';
  line: string;
  headsign: string;
  operator: string;
  fromName: string;
  toName: string;
  fromPlatform: string;
  toPlatform: string;
  /** Minutes since midnight. */
  departure: number;
  arrival: number;
  /** The feed's own identifier for this vehicle, so a live delay can be looked up. */
  tripId: string | null;
}

export interface PlanJourney {
  legs: PlanLeg[];
  departure: number;
  arrival: number;
  durationMinutes: number;
  transfers: number;
}

export interface PlanPlace {
  id: number;
  name: string;
  platforms: number;
}

export interface PlanDay {
  date: string;
  stops: number;
  connections: number;
  trips: number;
}

const BASE = '/graph';
const RECORD_BYTES = 20;
const MIN_TRANSFER_SECONDS = 120;
const INF = 2 ** 30;

interface Slice {
  from: Uint32Array;
  to: Uint32Array;
  dep: Uint32Array;
  arr: Uint32Array;
  trip: Uint32Array;
}

interface DayGraph {
  day: string;
  stops: [string, string, number, number, number, string][];
  stations: [string, number[]][];
  tripInfo: [string, string, string, string][];
  /** The feed's trip identifiers, indexed by internal trip number, for joining live delays. */
  tripIds: string[];
  placePlatforms: number[][];
  placeOfStop: Uint32Array;
  placeNames: string[];
  walkFrom: Uint32Array;
  walkTo: Uint32Array;
  walkSeconds: Uint16Array;
  tripCount: number;
  slices: Map<string, Slice>;
  sliceFiles: { file: string; from: number; to: number }[];
}

const dayCache = new Map<string, Promise<DayGraph>>();
let indexCache: Promise<PlanDay[]> | null = null;

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE}/${path}`, { cache: 'force-cache' });
  if (!response.ok) throw new Error(`${path} answered ${response.status}`);
  return (await response.json()) as T;
}

/** Which service days have been built, newest first. */
export function loadGraphIndex(): Promise<PlanDay[]> {
  if (!indexCache) {
    indexCache = fetchJson<{ days: PlanDay[] }>('index.json').then((index) => index.days);
  }
  return indexCache;
}

export function loadDay(day: string): Promise<DayGraph> {
  const cached = dayCache.get(day);
  if (cached) return cached;

  const loading = (async () => {
    const manifestResponse = await fetch(`${BASE}/${day}/manifest.json`);
    if (!manifestResponse.ok) throw new Error(`the timetable for ${day} has not been built`);
    const manifest = (await manifestResponse.json()) as {
      trips: number;
      stops: { file: string };
      stations: { file: string };
      places: { file: string };
      tripsInfo: { file: string };
      tripIds: { file: string };
      walks: { file: string; links: number };
      slices: { files: { file: string; from: number; to: number }[] };
    };

    const [stops, stations, places, tripInfo, tripIdsText, walksResponse] = await Promise.all([
      fetchJson<DayGraph['stops']>(`${day}/${manifest.stops.file}`),
      fetchJson<DayGraph['stations']>(`${day}/${manifest.stations.file}`),
      fetchJson<number[][]>(`${day}/${manifest.places.file}`),
      fetchJson<DayGraph['tripInfo']>(`${day}/${manifest.tripsInfo.file}`),
      fetch(`${BASE}/${day}/${manifest.tripIds.file}`, { cache: 'force-cache' }).then((response) => response.text()),
      fetch(`${BASE}/${day}/${manifest.walks.file}`).then((response) => response.arrayBuffer()),
    ]);

    const linkCount = manifest.walks.links;
    const walkFrom = new Uint32Array(linkCount);
    const walkTo = new Uint32Array(linkCount);
    const walkSeconds = new Uint16Array(linkCount);
    const walkView = new DataView(walksResponse);
    for (let link = 0; link < linkCount; link += 1) {
      walkFrom[link] = walkView.getUint32(link * 10, true);
      walkTo[link] = walkView.getUint32(link * 10 + 4, true);
      walkSeconds[link] = walkView.getUint16(link * 10 + 8, true);
    }

    /* A place is one physical station: every platform of every station group in it. */
    const placePlatforms = places.map((members) => members.flatMap((station) => stations[station]?.[1] ?? []));
    /*
     * A place's name is its **shortest** member name. Taking the longest gave "Groningen,
     * Hoofdstation (Perron A1)" for the station everyone calls Groningen, and the picker offered
     * that instead of the station itself.
     */
    const placeNames = places.map((members) => {
      const named = members
        .map((station) => stations[station]?.[0] ?? '')
        .filter(Boolean)
        .sort((a, b) => a.length - b.length);
      return named[0] ?? '';
    });

    /*
     * Which place each platform belongs to. Used to suppress "walks" that are really the same
     * station: a change of platform is not a leg, and drawing it as one added a minute and a
     * meaningless line to every journey.
     */
    const stationPlace = new Uint32Array(stations.length);
    places.forEach((members, place) => {
      for (const station of members) stationPlace[station] = place;
    });
    const placeOfStop = new Uint32Array(stops.length);
    for (let index = 0; index < stops.length; index += 1) {
      placeOfStop[index] = stationPlace[stops[index][4]] ?? 0;
    }

    return {
      day,
      stops,
      placeOfStop,
      stations,
      tripInfo,
      tripIds: tripIdsText.split('\n'),
      placePlatforms,
      placeNames,
      walkFrom,
      walkTo,
      walkSeconds,
      tripCount: manifest.trips,
      slices: new Map(),
      sliceFiles: manifest.slices.files,
    };
  })();

  dayCache.set(day, loading);
  return loading;
}

/** The station picker: every place, named, once the day's files are loaded. */
export function placesOf(graph: DayGraph): PlanPlace[] {
  return graph.placeNames.map((name, id) => ({ id, name, platforms: graph.placePlatforms[id].length }));
}

async function sliceFor(graph: DayGraph, file: string): Promise<Slice> {
  const cached = graph.slices.get(file);
  if (cached) return cached;
  const response = await fetch(`${BASE}/${graph.day}/${file}`, { cache: 'force-cache' });
  if (!response.ok) throw new Error(`${file} answered ${response.status}`);
  const buffer = await response.arrayBuffer();
  const view = new DataView(buffer);
  const count = Math.floor(buffer.byteLength / RECORD_BYTES);
  const slice: Slice = {
    from: new Uint32Array(count),
    to: new Uint32Array(count),
    dep: new Uint32Array(count),
    arr: new Uint32Array(count),
    trip: new Uint32Array(count),
  };
  for (let at = 0; at < count; at += 1) {
    slice.from[at] = view.getUint32(at * RECORD_BYTES, true);
    slice.to[at] = view.getUint32(at * RECORD_BYTES + 4, true);
    slice.dep[at] = view.getUint32(at * RECORD_BYTES + 8, true);
    slice.arr[at] = view.getUint32(at * RECORD_BYTES + 12, true);
    slice.trip[at] = view.getUint32(at * RECORD_BYTES + 16, true);
  }
  graph.slices.set(file, slice);
  return slice;
}

/**
 * The whole path, not just the arrival time, so a journey can be described leg by leg.
 *
 * Each connection records **the connection the traveller was on before it** at the moment that
 * connection was used. A chain of those records is one consistent journey by construction: it was
 * consistent when it was written. Rebuilding a chain from per-stop "best" pointers instead produced
 * journeys that left a station before arriving there, because a later improvement rewrote a pointer
 * an earlier chain depended on.
 */
async function searchPath(graph: DayGraph, origin: number, destination: number, startSeconds: number): Promise<BuiltPath | null> {
  const windowSeconds = 6 * 3600;
  const needed = graph.sliceFiles.filter((slice) => slice.to > startSeconds && slice.from < startSeconds + windowSeconds);
  const parts = await Promise.all(needed.map((slice) => sliceFor(graph, slice.file)));

  const total = parts.reduce((sum, part) => sum + part.dep.length, 0);
  const from = new Uint32Array(total);
  const to = new Uint32Array(total);
  const dep = new Uint32Array(total);
  const arr = new Uint32Array(total);
  const trip = new Uint32Array(total);
  let offset = 0;
  for (const part of parts) {
    from.set(part.from, offset);
    to.set(part.to, offset);
    dep.set(part.dep, offset);
    arr.set(part.arr, offset);
    trip.set(part.trip, offset);
    offset += part.dep.length;
  }

  const originStops = graph.placePlatforms[origin] ?? [];
  const destinationStops = new Set(graph.placePlatforms[destination] ?? []);

  const best = new Int32Array(graph.stops.length).fill(INF);
  const labelConn = new Int32Array(graph.stops.length).fill(-1);
  const tripArrival = new Int32Array(graph.tripCount).fill(INF);
  const tripLastConn = new Int32Array(graph.tripCount).fill(-1);
  /* -2 means "this connection was never used", -1 means "this is where the journey began". */
  const pred = new Int32Array(total).fill(-2);
  let bestArrival = INF;
  let bestStop = -1;

  for (const stop of originStops) best[stop] = startSeconds;

  const settle = (stop: number, arrival: number) => {
    if (arrival < best[stop]) best[stop] = arrival;
    if (destinationStops.has(stop) && arrival < bestArrival) {
      bestArrival = arrival;
      bestStop = stop;
    }
  };

  for (let pass = 0; pass < 4; pass += 1) {
    for (let index = 0; index < dep.length; index += 1) {
      if (dep[index] < startSeconds) continue;
      if (dep[index] > startSeconds + windowSeconds) break;
      if (dep[index] > bestArrival) break;

      const tripNumber = trip[index];
      const ridingThrough = tripArrival[tripNumber] !== INF;
      const ready = ridingThrough ? tripArrival[tripNumber] : best[from[index]] + MIN_TRANSFER_SECONDS;
      if (ready > dep[index] || arr[index] >= best[to[index]]) continue;

      /* Staying on the vehicle, or getting on a new one: either way, remember what came before. */
      pred[index] = ridingThrough ? tripLastConn[tripNumber] : labelConn[from[index]];
      best[to[index]] = arr[index];
      labelConn[to[index]] = index;
      tripArrival[tripNumber] = arr[index];
      tripLastConn[tripNumber] = index;
      settle(to[index], arr[index]);
    }

    /* Walking between nearby stops, then scan again: a platform is not a journey. */
    let changed = false;
    for (let link = 0; link < graph.walkFrom.length; link += 1) {
      const base = graph.walkFrom[link];
      const candidate = best[base] + graph.walkSeconds[link];
      if (candidate >= best[graph.walkTo[link]]) continue;
      best[graph.walkTo[link]] = candidate;
      labelConn[graph.walkTo[link]] = labelConn[base];
      /* The label is mirrored so the ride chain stays continuous through the walk. */
      settle(graph.walkTo[link], candidate);
      changed = true;
    }
    if (!changed && bestArrival !== INF) break;
  }

  if (bestArrival === INF || bestStop < 0) return null;

  /*
   * Rides only. Transfers are worked out *between* consecutive rides, from the stop one arrives at
   * to the stop the next one boards at. Rebuilding walks from mirrored labels could end the chain at
   * a different station from the one the traveller started at, and printed a journey beginning at
   * Centraal for a search that began at Oorsprongpark.
   */
  const steps: PathStep[] = [];
  let connection = labelConn[bestStop];
  for (let guard = 0; connection >= 0 && guard < 200; guard += 1) {
    steps.push({ kind: 'ride', index: connection });
    connection = pred[connection];
  }
  steps.reverse();
  return { seconds: bestArrival, steps, from, to, dep, arr, trip };
}

type PathStep = { kind: 'ride'; index: number } | { kind: 'walk'; index: number };

interface BuiltPath {
  seconds: number;
  steps: PathStep[];
  from: Uint32Array;
  to: Uint32Array;
  dep: Uint32Array;
  arr: Uint32Array;
  trip: Uint32Array;
}

/** Turn the connections into legs: one leg per vehicle, with the line and both ends named. */
/** The walking time between two stops, if the graph has a link for it. */
function walkBetween(graph: DayGraph, fromStop: number, toStop: number): number | null {
  if (fromStop === toStop) return 0;
  for (let link = 0; link < graph.walkFrom.length; link += 1) {
    if (graph.walkFrom[link] === fromStop && graph.walkTo[link] === toStop) return graph.walkSeconds[link];
  }
  return null;
}

function toJourney(graph: DayGraph, path: BuiltPath): PlanJourney | null {
  if (path.steps.length === 0) return null;

  const rideLeg = (first: number, last: number): PlanLeg => {
    const info = graph.tripInfo[path.trip[first]] ?? ['', '', 'bus', ''];
    const startStop = graph.stops[path.from[first]];
    const endStop = graph.stops[path.to[last]];
    return {
      mode: (info[2] as PlanLeg['mode']) || 'bus',
      line: info[0] || '',
      headsign: info[1] || '',
      operator: info[3] || '',
      fromName: startStop?.[1] ?? '',
      toName: endStop?.[1] ?? '',
      fromPlatform: startStop?.[5] ?? '',
      toPlatform: endStop?.[5] ?? '',
      departure: Math.floor(path.dep[first] / 60),
      arrival: Math.floor(path.arr[last] / 60),
      tripId: graph.tripIds[path.trip[first]] ?? null,
    };
  };

  /* Consecutive connections of one vehicle are one ride. */
  const rides: { first: number; last: number }[] = [];
  let rideStart: number | null = null;
  let rideLast = -1;
  for (const step of path.steps) {
    if (step.kind !== 'ride') continue;
    if (rideStart === null) {
      rideStart = step.index;
    } else if (path.trip[step.index] !== path.trip[rideStart]) {
      rides.push({ first: rideStart, last: rideLast });
      rideStart = step.index;
    }
    rideLast = step.index;
  }
  if (rideStart !== null) rides.push({ first: rideStart, last: rideLast });
  if (rides.length === 0) return null;

  const legs: PlanLeg[] = [];
  for (let index = 0; index < rides.length; index += 1) {
    const ride = rides[index];

    if (index > 0) {
      const arrivedAt = path.to[rides[index - 1].last];
      const boardsAt = path.from[ride.first];
      const samePlace = graph.placeOfStop[arrivedAt] === graph.placeOfStop[boardsAt];
      const walking = samePlace ? 0 : walkBetween(graph, arrivedAt, boardsAt);
      if (walking !== null && walking > 0) {
        const start = legs[legs.length - 1].arrival;
        const minutes = Math.max(1, Math.round(walking / 60));
        legs.push({
          mode: 'walk',
          line: '',
          headsign: '',
          operator: '',
          fromName: graph.stops[arrivedAt]?.[1] ?? '',
          toName: graph.stops[boardsAt]?.[1] ?? '',
          fromPlatform: '',
          toPlatform: '',
          departure: start,
          arrival: start + minutes,
          tripId: null,
        });
      }
    }

    legs.push(rideLeg(ride.first, ride.last));
  }

  const departure = legs[0].departure;
  const arrival = legs[legs.length - 1].arrival;
  return {
    legs,
    departure,
    arrival,
    durationMinutes: arrival - departure,
    transfers: Math.max(0, rides.length - 1),
  };
}

const dayBefore = (day: string): string => {
  const date = new Date(`${day.slice(0, 4)}-${day.slice(4, 6)}-${day.slice(6, 8)}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, '0')}${String(date.getUTCDate()).padStart(2, '0')}`;
};

/**
 * The journeys to show: the earliest, then the next after it, a few times over.
 *
 * **After midnight the timetable is still yesterday's.** A bus leaving at 03:08 on a Saturday night
 * is stored as 27:08 in Saturday's service day, and a Sunday search at 02:08 never reaches it — which
 * is why a quiet night produced a first journey four hours later, with no live delay to show. So a
 * search in the small hours also runs against the previous service day, at the time plus a day, and
 * the two answers are merged in departure order.
 */
export async function planRealJourneys(day: string, origin: number, destination: number, startMinutes: number): Promise<PlanJourney[]> {
  const searches: { day: string; startSeconds: number }[] = [{ day, startSeconds: startMinutes * 60 }];
  if (startMinutes < 4 * 60) searches.push({ day: dayBefore(day), startSeconds: (startMinutes + 24 * 60) * 60 });

  const journeys: PlanJourney[] = [];
  for (const search of searches) {
    let graph;
    try {
      graph = await loadDay(search.day);
    } catch {
      /* That day was never built; the search still has the day in front of it. */
      continue;
    }
    let start = search.startSeconds;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const path = await searchPath(graph, origin, destination, start);
      if (!path) break;
      const journey = toJourney(graph, path);
      if (!journey) break;
      const duplicate = journeys.some(
        (seen) => seen.departure % 1440 === journey.departure % 1440 && seen.arrival % 1440 === journey.arrival % 1440,
      );
      if (!duplicate) journeys.push(journey);
      start = journey.legs[0].departure * 60 + 60;
    }
  }

  journeys.sort((left, right) => left.departure - right.departure || left.arrival - right.arrival);
  return journeys.slice(0, 4);
}

/** Search can be slow on a cold cache; this warms the files a day needs. */
export async function warmDay(day: string): Promise<void> {
  const graph = await loadDay(day);
  await Promise.all(graph.sliceFiles.slice(0, 1).map((slice) => sliceFor(graph, slice.file)));
}
