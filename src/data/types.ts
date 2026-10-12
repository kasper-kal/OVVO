/**
 * Domain types for the OV Planner prototype.
 *
 * Everything in `src/data` is CLEARLY LABELLED DEMONSTRATION DATA. The shapes
 * below match the vocabulary a real transport-data provider would use, so the
 * mock layer can be swapped for a live service without touching the UI.
 */

export type TravelMode = 'walk' | 'train' | 'bus' | 'tram' | 'metro' | 'ferry' | 'bike';

/** Modes that can be used by a public transport leg (walking/bike are excluded). */
export type PublicMode = Exclude<TravelMode, 'walk' | 'bike'>;

export type StopType = 'station' | 'busstop' | 'tramstop' | 'metrostop' | 'ferrystop' | 'airport' | 'landmark';

export interface Coordinates {
  /** Illustrative position on the prototype's own 0–100 canvas (NOT geo-accurate). */
  x: number;
  y: number;
}

export interface Accessibility {
  stepFree: boolean;
  lift: boolean;
  tactilePaving: boolean;
  assistance: boolean;
  lowFloorBoarding: boolean;
}

export interface Stop {
  id: string;
  name: string;
  city: string;
  /** Example stop/station identifier, e.g. an NS station code. */
  code: string;
  type: StopType;
  modes: TravelMode[];
  platforms: string[];
  region: string;
  coordinates: Coordinates;
  facilities: string[];
  accessibility: Accessibility;
  bikeParking: boolean;
  ovFiets: boolean;
  operatorIds: string[];
  servesCity: string;
}

export interface Operator {
  id: string;
  name: string;
  shortName: string;
  modes: PublicMode[];
}

/** A marketable service, e.g. "Intercity 800" or "GVB tram 2". */
export interface Line {
  id: string;
  mode: PublicMode;
  /** Service number shown on the vehicle, e.g. "800", "2", "F3". */
  number: string;
  name: string;
  operatorId: string;
  /** Minutes between two departures of this service. */
  headway: number;
  /** Ordered stop ids in the "A" direction. */
  stops: string[];
  nightOnly?: boolean;
}

export interface IntermediateStop {
  stopId: string;
  arrival: number;
  departure: number;
  platform?: string;
}

export interface Leg {
  id: string;
  mode: TravelMode;
  /** Stop where the leg starts / ends. */
  fromStopId: string;
  toStopId: string;
  /** Minutes since midnight, local time. */
  departure: number;
  arrival: number;
  platform?: string;
  arrivalPlatform?: string;
  lineId?: string;
  lineNumber?: string;
  lineName?: string;
  operatorId?: string;
  headsign?: string;
  intermediateStops?: IntermediateStop[];
  delayMinutes?: number;
  cancelled?: boolean;
  message?: string;
  /** Walking legs: distance in illustrative metres. */
  distanceMetres?: number;
  disruptionId?: string;
  stepFree?: boolean;
  bikeAllowed?: boolean;
}

export interface Fare {
  eur: number;
  label: string;
}

export interface Journey {
  id: string;
  /** stable-ish signature used for persistence across reloads */
  signature: string;
  legs: Leg[];
  /** Minutes since midnight. */
  departure: number;
  arrival: number;
  durationMinutes: number;
  transfers: number;
  walkMinutes: number;
  modes: TravelMode[];
  operatorIds: string[];
  fare: Fare;
  label?: 'fastest' | 'fewestTransfers' | 'leastWalking' | 'direct';
  occupancy: 'quiet' | 'moderate' | 'busy';
  occupancyHistory: number[];
  stepFree: boolean;
  bikeAllowed: boolean;
  realtime: false;
  delayMinutes: number;
  cancelled: boolean;
  disruptionIds: string[];
  source: 'demo';
}

export type DisruptionType = 'delay' | 'cancellation' | 'works' | 'platformChange' | 'crowding' | 'weather';
export type DisruptionSeverity = 'info' | 'warning' | 'severe';

export interface Disruption {
  id: string;
  type: DisruptionType;
  severity: DisruptionSeverity;
  title: string;
  description: string;
  advice: string;
  affectedStopIds: string[];
  affectedLineIds: string[];
  operatorIds: string[];
  modes: PublicMode[];
  /** Minutes since midnight for the demo day. */
  startsAt: number;
  endsAt: number;
  source: 'demo';
}

export interface Departure {
  id: string;
  stopId: string;
  mode: PublicMode;
  lineId: string;
  lineNumber: string;
  operatorId: string;
  destinationStopId: string;
  destinationLabel: string;
  planned: number;
  expected: number;
  platform: string;
  delayMinutes: number;
  cancelled: boolean;
  accessible: boolean;
  disruptionId?: string;
  /** direction index within the line (0 = A direction, 1 = B direction) */
  directionIndex: 0 | 1;
  source: 'demo';
}

export interface TimeWindow {
  date: string; // yyyy-mm-dd
  minutes: number; // minutes since midnight
}

export type SortMode = 'best' | 'fastest' | 'fewestTransfers' | 'leastWalking' | 'cheapest' | 'latestDeparture';
export type TimeMode = 'depart' | 'arrive';
