import { requireStop, walkMinutesBetween, STOPS, getStop } from './stops';
import type { Line, PublicMode } from './types';

/**
 * Transit network data.
 *
 * Corridors follow the Dutch network; ride times and service windows are the
 * figures this build ships with. The shapes match a real timetable source, so a
 * live feed can replace this module without touching the interface.
 */

export interface NetworkLine extends Line {
  /** Cumulative ride minutes from the first stop of `stops`. */
  cum: number[];
  /** Ride minutes per segment (length = stops.length - 1). */
  segments: number[];
  speedKmh: number;
  /** Service window in minutes since midnight. */
  serviceStart: number;
  serviceEnd: number;
}

interface LineSeed {
  id: string;
  mode: PublicMode;
  number: string;
  name: string;
  operatorId: string;
  headway: number;
  stops: string[];
  nightOnly?: boolean;
  serviceStart?: number;
  serviceEnd?: number;
  speedKmh?: number;
}

function speedFor(seed: LineSeed): number {
  if (seed.speedKmh) return seed.speedKmh;
  if (seed.nightOnly) return 55;
  switch (seed.mode) {
    case 'train':
      if (seed.number.startsWith('8') || seed.number.startsWith('9')) return 108; // Intercity
      if (seed.number.startsWith('1') || seed.number.startsWith('3')) return 100;
      if (seed.number.startsWith('4') || seed.number.startsWith('5')) return 72; // Sprinter
      if (seed.number.startsWith('6') || seed.number.startsWith('7')) return 78;
      return 68; // stoptrein
    case 'metro':
      return 40;
    case 'tram':
      return 22;
    case 'bus':
      return 27;
    case 'ferry':
      return 15;
    default:
      return 30;
  }
}

/** 1 illustrative canvas unit ≈ 2 km. */
const KM_PER_UNIT = 2;

function segmentMinutes(a: string, b: string, speedKmh: number, mode: PublicMode): number {
  const from = requireStop(a);
  const to = requireStop(b);
  const km = Math.hypot(from.coordinates.x - to.coordinates.x, from.coordinates.y - to.coordinates.y) * KM_PER_UNIT;
  const ride = (km / speedKmh) * 60;
  const dwell = mode === 'train' ? 2.5 : mode === 'metro' ? 1.2 : mode === 'tram' || mode === 'bus' ? 1.4 : 2;
  return Math.max(mode === 'train' ? 4 : 2, Math.round(ride + dwell));
}

const SEEDS: LineSeed[] = [
  // --- Intercity (NS) -------------------------------------------------------
  { id: 'ic-800', mode: 'train', number: '800', name: 'Intercity 800', operatorId: 'ns', headway: 30, stops: ['maastricht', 'eindhoven-centraal', 'den-bosch', 'utrecht-centraal', 'amsterdam-centraal', 'alkmaar'] },
  { id: 'ic-900', mode: 'train', number: '900', name: 'Intercity 900', operatorId: 'ns', headway: 30, stops: ['amsterdam-centraal', 'schiphol-airport', 'rotterdam-centraal', 'breda', 'eindhoven-centraal'] },
  { id: 'ic-700', mode: 'train', number: '700', name: 'Intercity 700', operatorId: 'ns', headway: 30, stops: ['groningen', 'zwolle', 'amersfoort-centraal', 'utrecht-centraal', 'amsterdam-zuid', 'schiphol-airport'] },
  { id: 'ic-500', mode: 'train', number: '500', name: 'Intercity 500', operatorId: 'ns', headway: 30, stops: ['den-haag-centraal', 'leiden-centraal', 'schiphol-airport', 'amsterdam-centraal', 'almere-centrum', 'zwolle', 'groningen'] },
  { id: 'ic-300', mode: 'train', number: '300', name: 'Intercity 300', operatorId: 'ns', headway: 30, stops: ['arnhem-centraal', 'utrecht-centraal', 'amsterdam-centraal', 'alkmaar'] },
  { id: 'ic-1100', mode: 'train', number: '1100', name: 'Intercity 1100', operatorId: 'ns', headway: 30, stops: ['den-haag-centraal', 'rotterdam-centraal', 'breda', 'tilburg', 'eindhoven-centraal'] },
  { id: 'ic-3600', mode: 'train', number: '3600', name: 'Intercity 3600', operatorId: 'ns', headway: 30, stops: ['zwolle', 'deventer', 'arnhem-centraal', 'nijmegen'] },

  // --- Sprinter / stoptrein ------------------------------------------------
  { id: 'sp-4000', mode: 'train', number: '4000', name: 'Sprinter 4000', operatorId: 'ns', headway: 15, stops: ['alkmaar', 'zaandam', 'amsterdam-centraal', 'amsterdam-sloterdijk', 'haarlem', 'leiden-centraal', 'den-haag-centraal', 'delft', 'rotterdam-centraal'] },
  { id: 'sp-5000', mode: 'train', number: '5000', name: 'Sprinter 5000', operatorId: 'ns', headway: 30, stops: ['den-haag-centraal', 'zoetermeer', 'gouda', 'utrecht-centraal', 'amersfoort-centraal', 'apeldoorn', 'deventer', 'zwolle'] },
  { id: 'sp-6000', mode: 'train', number: '6000', name: 'Sprinter 6000', operatorId: 'ns', headway: 15, stops: ['utrecht-centraal', 'hilversum', 'amsterdam-muiderpoort', 'amsterdam-centraal'] },
  { id: 'sp-7000', mode: 'train', number: '7000', name: 'Sprinter 7000', operatorId: 'ns', headway: 15, stops: ['amsterdam-centraal', 'amsterdam-amstel', 'amsterdam-zuid', 'amsterdam-bijlmer-arena', 'utrecht-vaartsche-rijn', 'utrecht-centraal', 'utrecht-lunetten'] },
  { id: 'st-rs20', mode: 'train', number: 'RS20', name: 'Stoptrein RS20', operatorId: 'arriva', headway: 30, stops: ['maastricht', 'helmond', 'eindhoven-centraal', 'den-bosch', 'utrecht-centraal'], serviceEnd: 1410 },
  { id: 'st-rs30', mode: 'train', number: 'RS30', name: 'Stoptrein RS30', operatorId: 'arriva', headway: 30, stops: ['groningen', 'groningen-noord', 'leeuwarden'], serviceStart: 330, serviceEnd: 1380 },
  { id: 'sp-1900', mode: 'train', number: '1900', name: 'Intercity 1900', operatorId: 'ns', headway: 30, stops: ['vlissingen', 'dordrecht', 'rotterdam-centraal', 'schiedam-centrum', 'den-haag-centraal'], serviceStart: 330, serviceEnd: 1380 },
  { id: 'st-rs10', mode: 'train', number: 'RS10', name: 'Stoptrein RS10', operatorId: 'keolis', headway: 30, stops: ['zwolle', 'deventer', 'apeldoorn', 'amersfoort-centraal'], serviceEnd: 1410 },
  { id: 'st-rs5', mode: 'train', number: 'RS5', name: 'Stoptrein RS5', operatorId: 'keolis', headway: 30, stops: ['leeuwarden', 'zwolle'], serviceStart: 330 },

  // --- Metro ----------------------------------------------------------------
  { id: 'm52', mode: 'metro', number: '52', name: 'Metro 52 Noord–Zuid', operatorId: 'gvb', headway: 6, stops: ['amsterdam-noord', 'amsterdam-centraal', 'amsterdam-zuid'], serviceStart: 330, serviceEnd: 1470 },
  { id: 'm51', mode: 'metro', number: '51', name: 'Metro 51', operatorId: 'gvb', headway: 8, stops: ['amsterdam-centraal', 'amsterdam-amstel', 'amsterdam-zuid', 'amsterdam-bijlmer-arena'], serviceStart: 330, serviceEnd: 1440 },
  { id: 'm54', mode: 'metro', number: '54', name: 'Metro 54', operatorId: 'gvb', headway: 8, stops: ['amsterdam-centraal', 'amsterdam-amstel', 'amsterdam-bijlmer-arena'], serviceStart: 330, serviceEnd: 1440 },
  { id: 're-metro-e', mode: 'metro', number: 'E', name: 'Metro E', operatorId: 'ret', headway: 10, stops: ['den-haag-centraal', 'schiedam-centrum', 'rotterdam-centraal', 'rotterdam-blaak', 'rotterdam-alexander'], serviceStart: 330, serviceEnd: 1440 },
  { id: 'ret-metro-a', mode: 'metro', number: 'A', name: 'Metro A', operatorId: 'ret', headway: 10, stops: ['rotterdam-alexander', 'rotterdam-blaak', 'schiedam-centrum'], serviceStart: 340, serviceEnd: 1430 },

  // --- Tram -----------------------------------------------------------------
  { id: 't2', mode: 'tram', number: '2', name: 'Tram 2', operatorId: 'gvb', headway: 8, stops: ['amsterdam-centraal', 'amsterdam-dam', 'amsterdam-leidseplein', 'amsterdam-museumplein', 'amsterdam-zuid'], serviceStart: 340, serviceEnd: 1440 },
  { id: 't4', mode: 'tram', number: '4', name: 'Tram 4', operatorId: 'gvb', headway: 10, stops: ['amsterdam-centraal', 'amsterdam-dam', 'amsterdam-muiderpoort'], serviceStart: 340, serviceEnd: 1430 },
  { id: 't5', mode: 'tram', number: '5', name: 'Tram 5', operatorId: 'gvb', headway: 10, stops: ['amsterdam-centraal', 'amsterdam-museumplein', 'amstelveen-busstation'], serviceStart: 340, serviceEnd: 1420 },
  { id: 'htm-t1', mode: 'tram', number: '1', name: 'Tram 1', operatorId: 'htm', headway: 10, stops: ['den-haag-centraal', 'den-haag-hs', 'delft'], serviceStart: 340, serviceEnd: 1420 },
  { id: 'ret-t24', mode: 'tram', number: '24', name: 'Tram 24', operatorId: 'ret', headway: 10, stops: ['rotterdam-centraal', 'rotterdam-blaak', 'schiedam-centrum'], serviceStart: 340, serviceEnd: 1420 },
  { id: 'ret-t8', mode: 'tram', number: '8', name: 'Tram 8', operatorId: 'ret', headway: 10, stops: ['rotterdam-centraal', 'rotterdam-blaak'], serviceStart: 340, serviceEnd: 1410 },

  // --- Bus ------------------------------------------------------------------
  { id: 'b22', mode: 'bus', number: '22', name: 'Bus 22', operatorId: 'ebs', headway: 15, stops: ['amsterdam-centraal', 'zaandam', 'zaanse-schans', 'alkmaar'], serviceEnd: 1350 },
  { id: 'b316', mode: 'bus', number: '316', name: 'Bus 316', operatorId: 'ebs', headway: 20, stops: ['amsterdam-noord', 'volendam', 'zaandam'], serviceEnd: 1350 },
  { id: 'b347', mode: 'bus', number: '347', name: 'Bus 347', operatorId: 'connexxion', headway: 15, stops: ['haarlem', 'hoofddorp', 'schiphol-airport'], serviceEnd: 1380 },
  { id: 'b15', mode: 'bus', number: '15', name: 'Bus 15', operatorId: 'connexxion', headway: 20, stops: ['alkmaar', 'haarlem'], serviceEnd: 1320 },
  { id: 'b7', mode: 'bus', number: '7', name: 'Bus 7', operatorId: 'qbuzz', headway: 12, stops: ['utrecht-centraal', 'utrecht-overvecht', 'utrecht-lunetten'], serviceEnd: 1380 },
  { id: 'b28', mode: 'bus', number: '28', name: 'Bus 28', operatorId: 'qbuzz', headway: 15, stops: ['utrecht-centraal', 'utrecht-vaartsche-rijn', 'utrecht-domtoren'], serviceEnd: 1380 },
  { id: 'b300', mode: 'bus', number: '300', name: 'Brabantliner 300', operatorId: 'arriva', headway: 15, stops: ['breda', 'tilburg', 'den-bosch', 'eindhoven-centraal'], serviceEnd: 1380 },
  { id: 'b400', mode: 'bus', number: '400', name: 'Q-link 400', operatorId: 'qbuzz', headway: 10, stops: ['groningen', 'groningen-noord'], serviceEnd: 1380 },
  { id: 'b40', mode: 'bus', number: '40', name: 'Bus 40', operatorId: 'ret', headway: 15, stops: ['rotterdam-centraal', 'rotterdam-blaak', 'rotterdam-alexander'], serviceEnd: 1380 },
  { id: 'b55', mode: 'bus', number: '55', name: 'Bus 55', operatorId: 'connexxion', headway: 20, stops: ['hilversum', 'amersfoort-centraal', 'apeldoorn'], serviceEnd: 1320 },
  { id: 'b350', mode: 'bus', number: '350', name: 'Bus 350', operatorId: 'arriva', headway: 30, stops: ['leeuwarden', 'groningen'], serviceStart: 360, serviceEnd: 1320 },
  { id: 'n851', mode: 'bus', number: 'N851', name: 'Nachtnet N851', operatorId: 'ns', headway: 60, stops: ['rotterdam-centraal', 'den-haag-centraal', 'schiphol-airport', 'amsterdam-centraal', 'utrecht-centraal'], nightOnly: true, serviceStart: 0, serviceEnd: 330 },

  // --- Ferry ----------------------------------------------------------------
  { id: 'f3', mode: 'ferry', number: 'F3', name: 'Ferry F3', operatorId: 'gvb', headway: 10, stops: ['amsterdam-centraal', 'amsterdam-buiksloterweg'], serviceStart: 330, serviceEnd: 1440 },
  { id: 'w20', mode: 'ferry', number: '20', name: 'Waterbus 20', operatorId: 'aquabus', headway: 30, stops: ['rotterdam-erasmusbrug', 'dordrecht'], serviceStart: 420, serviceEnd: 1320 },
];

export const NETWORK: NetworkLine[] = SEEDS.map((seed) => {
  const speedKmh = speedFor(seed);
  const segments = seed.stops.slice(1).map((stopId, i) => segmentMinutes(seed.stops[i], stopId, speedKmh, seed.mode));
  const cum = [0];
  segments.forEach((minutes) => cum.push(cum[cum.length - 1] + minutes));
  const night = seed.nightOnly ?? false;
  return {
    ...seed,
    cum,
    segments,
    speedKmh,
    nightOnly: night,
    serviceStart: seed.serviceStart ?? (night ? 0 : 300),
    serviceEnd: seed.serviceEnd ?? (night ? 330 : 1470),
  };
});

const lineMap = new Map(NETWORK.map((l) => [l.id, l]));

export function getLine(id: string | undefined): NetworkLine | undefined {
  return id ? lineMap.get(id) : undefined;
}

export function lineLabel(id: string | undefined): string {
  const line = getLine(id);
  if (!line) return 'Unknown service';
  return `${modeWord(line.mode)} ${line.number}`;
}

function modeWord(mode: PublicMode): string {
  switch (mode) {
    case 'train': return 'Train';
    case 'bus': return 'Bus';
    case 'tram': return 'Tram';
    case 'metro': return 'Metro';
    case 'ferry': return 'Ferry';
  }
}

export function linesAtStop(stopId: string): NetworkLine[] {
  return NETWORK.filter((l) => l.stops.includes(stopId) && (getStop(stopId)?.modes ?? []).includes(l.mode));
}

/** Ordered stop sequences for both directions of a line. */
export function directions(line: NetworkLine): { index: 0 | 1; stops: string[]; cum: number[] }[] {
  const reversed = [...line.stops].reverse();
  const last = line.cum[line.cum.length - 1];
  const revCum = [...line.cum].reverse().map((c) => last - c);
  return [
    { index: 0, stops: line.stops, cum: line.cum },
    { index: 1, stops: reversed, cum: revCum },
  ];
}

/** First departure of the service window at or after `afterMinutes` (headway based). */
export function nextDeparture(line: NetworkLine, afterMinutes: number): number {
  const start = line.serviceStart;
  if (afterMinutes < start) return start;
  const steps = Math.ceil((afterMinutes - start) / line.headway);
  return start + steps * line.headway;
}

export function isInService(line: NetworkLine, minutes: number): boolean {
  const t = ((minutes % 1440) + 1440) % 1440;
  return t >= line.serviceStart && t <= line.serviceEnd;
}

/**
 * The reach of the walk-link network, in walking minutes. Walking itself is capped by
 * the traveller's own limit; this is the outer bound the link set is built at, and it
 * is also what a bicycle link is allowed to span (at bicycle speed, so roughly six
 * minutes of riding) — a bicycle that could only reach as far as a walk was not a
 * bicycle, which is why the walk/bicycle choice changed nothing on a normal search.
 */
export const WALK_EDGE_MAX_MINUTES = 20;

/** Riding is this many times faster than walking on the same link. */
export const BIKE_SPEED_FACTOR = 3.2;

/** Walking edges between nearby stops — used for transfer and access legs. */
export interface WalkEdge {
  fromStopId: string;
  toStopId: string;
  minutes: number;
}

export const WALK_EDGES: WalkEdge[] = (() => {
  const edges: WalkEdge[] = [];
  for (const a of STOPS) {
    for (const b of STOPS) {
      if (a.id === b.id) continue;
      const minutes = walkMinutesBetween(a, b);
      if (minutes <= WALK_EDGE_MAX_MINUTES) edges.push({ fromStopId: a.id, toStopId: b.id, minutes });
    }
  }
  return edges;
})();

export function walkEdge(fromStopId: string, toStopId: string): WalkEdge | undefined {
  return WALK_EDGES.find((e) => e.fromStopId === fromStopId && e.toStopId === toStopId);
}
