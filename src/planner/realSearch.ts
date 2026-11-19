import { STOPS, getStop } from '../data/stops';
import { OPERATORS } from '../data/operators';
import { loadDay, loadGraphIndex, planRealJourneys, placesOf, type PlanJourney, type PlanPlace } from './graph';
import type { Journey, Leg, TravelMode } from '../data/types';
import type { SearchQuery } from '../data/journeyEngine';

/**
 * **A real search, from the question alone.**
 *
 * `/plan` used to be the only place that could turn a question into timetable journeys, because it
 * held the two places it had picked and the day it had loaded. A pasted `/results/...` link has
 * neither: it has the two ends' ids and labels and a date. This module rebuilds the missing half ,
 * the timetable's own places for those names, the day's graph, and the same planner, so the same
 * link answers on any browser instead of falling back to the demonstration engine.
 *
 * The conversion below is the same one the planner page used; it moved here so there is one copy.
 * A journey is still the app's `Journey`, so the cards and the journey page do not know whether it
 * came from the planner or from a link.
 */

const pad = (value: number) => String(value).padStart(2, '0');

const isoToDayKey = (date: string) => date.replace(/-/g, '');

export const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const modeLabel = (mode: string) => {
  if (mode === 'walk') return 'Walk';
  if (mode === 'train') return 'Train';
  if (mode === 'metro') return 'Metro';
  if (mode === 'tram') return 'Tram';
  if (mode === 'ferry') return 'Ferry';
  return 'Bus';
};

/**
 * The app's own stop for a planner place, when there is one.
 *
 * The feed writes places its own way: "Groningen" for "Groningen Station", and "Amsterdam, Station
 * Bijlmer ArenA" for "Amsterdam Bijlmer ArenA". Comparing the words left after dropping the word
 * "station" and all punctuation matches both without a table of aliases.
 */
export function appStopFor(name: string) {
  const direct = STOPS.find((stop) => stop.name === name);
  if (direct) return direct;
  const key = (text: string) => text.toLowerCase().replace(/\bstation\b/g, '').replace(/[^a-z0-9]/g, '');
  return STOPS.find((stop) => key(stop.name) === key(name));
}

function operatorIdFor(name: string) {
  return OPERATORS.find((operator) => operator.name === name || operator.shortName === name)?.id;
}

/** The plain name of one end of a search, for matching it against the timetable's places. */
export function endName(query: SearchQuery, side: 'from' | 'to'): string {
  const label = side === 'from' ? query.fromLabel : query.toLabel;
  if (label) return label;
  const id = side === 'from' ? query.fromStopId : query.toStopId;
  return getStop(id)?.name ?? id.replace(/^tt-/, '').replace(/-/g, ' ');
}

/** One real journey, in the shape every journey card and journey page already understands. */
export function toJourney(plan: PlanJourney, index: number, date: string): Journey {
  const first = plan.legs[0];
  const last = plan.legs[plan.legs.length - 1];
  const fromStop = appStopFor(first.fromName);
  const toStop = appStopFor(last.toName);
  const id = `tt-${date}-${slugify(fromStop?.id ?? first.fromName)}-${slugify(toStop?.id ?? last.toName)}-${plan.departure}-${index}`;

  const legs: Leg[] = plan.legs.map((leg, legIndex) => {
    const from = appStopFor(leg.fromName);
    const to = appStopFor(leg.toName);
    return {
      id: `${id}-${legIndex}`,
      mode: leg.mode as TravelMode,
      fromStopId: from?.id ?? `tt-${slugify(leg.fromName)}`,
      toStopId: to?.id ?? `tt-${slugify(leg.toName)}`,
      /* A label is how a leg names a place that has no page of its own. When the stop is in the
         app, leaving this unset gives the leg a link instead of a word. */
      fromLabel: from ? undefined : leg.fromName,
      toLabel: to ? undefined : leg.toName,
      departure: leg.departure,
      arrival: leg.arrival,
      platform: leg.fromPlatform || undefined,
      arrivalPlatform: leg.toPlatform || undefined,
      lineName: leg.mode === 'walk' ? undefined : leg.line || modeLabel(leg.mode),
      lineNumber: leg.mode === 'walk' ? undefined : leg.line || undefined,
      /* The feed's headsign can be empty; "Direction" with nothing after it is worse than naming
         the stop this leg actually reaches. */
      headsign: leg.mode === 'walk' ? undefined : leg.headsign || leg.toName,
      operatorId: leg.mode === 'walk' ? undefined : operatorIdFor(leg.operator),
    };
  });

  const rides = plan.legs.filter((leg) => leg.mode !== 'walk');

  return {
    id,
    signature: id,
    legs,
    departure: plan.departure,
    arrival: plan.arrival,
    durationMinutes: plan.durationMinutes,
    transfers: plan.transfers,
    walkMinutes: plan.legs
      .filter((leg) => leg.mode === 'walk')
      .reduce((total, leg) => total + Math.max(0, leg.arrival - leg.departure), 0),
    modes: [...new Set(rides.map((leg) => leg.mode as TravelMode))],
    operatorIds: [...new Set(rides.map((leg) => operatorIdFor(leg.operator)).filter((id): id is string => Boolean(id)))],
    /* The timetable has no fare and no crowding: both are left empty rather than invented. */
    fare: { eur: 0, label: '' },
    realtime: false,
    delayMinutes: 0,
    cancelled: false,
    disruptionIds: [],
    source: 'timetable',
  };
}

/** The timetable place for a name, compared the same way the stop lookup compares one. */
function placeFor(places: PlanPlace[], name: string): PlanPlace | null {
  const key = (text: string) => text.toLowerCase().replace(/\bstation\b/g, '').replace(/[^a-z0-9]/g, '');
  const wanted = key(name);
  return places.find((place) => key(place.name) === wanted) ?? null;
}

/**
 * Plan the real journeys a stored search names.
 *
 * Throws when the day is not built or a name cannot be found; the results screen says so in words.
 * An empty list is a real answer, there is no connection at that time, and is not an error.
 */
export async function journeysForQuery(query: SearchQuery): Promise<Journey[]> {
  const day = isoToDayKey(query.date);
  const available = await loadGraphIndex();
  if (!available.some((entry) => entry.date === day)) {
    throw new Error('The timetable for that day is not built on this machine yet.');
  }
  const graph = await loadDay(day);
  const places = placesOf(graph);
  const from = placeFor(places, endName(query, 'from'));
  const to = placeFor(places, endName(query, 'to'));
  if (!from || !to) {
    throw new Error('One of those places is not in this timetable.');
  }
  const found = await planRealJourneys(day, from.id, to.id, query.time);
  return found.map((journey, index) => toJourney(journey, index, query.date));
}

/** The stop id a planner place gets in a search: the app's own when it has one. */
export function stopIdForPlace(place: { name: string }, id?: string): string {
  return id ?? `tt-${slugify(place.name)}`;
}

export { pad };
