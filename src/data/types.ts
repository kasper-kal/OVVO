/**
 * Domain types for OVVO.
 *
 * The shapes match the vocabulary a transport-data provider uses, so the seed
 * data in `src/data` can be swapped for a live service without touching the UI.
 */

export type TravelMode = 'walk' | 'train' | 'bus' | 'tram' | 'metro' | 'ferry' | 'bike';

/** Modes that can be used by a public transport leg (walking/bike are excluded). */
export type PublicMode = Exclude<TravelMode, 'walk' | 'bike'>;

export type StopType = 'station' | 'busstop' | 'tramstop' | 'metrostop' | 'ferrystop' | 'airport' | 'landmark';

export interface Coordinates {
  /** Schematic position on the app's 0–100 canvas (NOT geo-accurate). */
  x: number;
  y: number;
}

export interface GeoPosition {
  /** WGS84 latitude. */
  lat: number;
  /** WGS84 longitude. */
  lon: number;
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
  /** Schematic position used by the map and the layout maths. */
  coordinates: Coordinates;
  /** Real WGS84 position, used for distance, walking and "near me" lookups. */
  geo: GeoPosition;
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
  /**
   * The traveller's own name for an end that is not a stop — an address a device fix resolved
   * to — printed instead of the stop's name. Absent on every leg of a journey between stops,
   * so the stop's own name is what a leg reads unless a place answered for it.
   */
  fromLabel?: string;
  toLabel?: string;
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
  /**
   * The stop that headsign names.
   *
   * The direction a service runs in is named after its terminus, and that terminus is a station
   * with a page — so the leg keeps the id beside the words, and the pill that prints them can be
   * a way to look at where the vehicle is going. Optional: a journey saved by an older build has
   * the name and not this, and a leg without it prints the words as plain text.
   */
  headsignStopId?: string;
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
  /** Minutes since midnight. */
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
