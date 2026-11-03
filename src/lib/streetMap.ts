/**
 * **The real streets, under the drawing.**
 *
 * Everything in the app until now was drawn: a schematic canvas with no roads on it, and walks
 * joined by a straight dashed line that crossed canals it would never cross. Items 13 and 14 ask
 * for the opposite: a walk drawn *along the real streets*, and a ride opened on a street map.
 *
 * The map is OpenStreetMap's own tiles, and the walking line is OpenStreetMap's own foot router,
 * both used directly from the browser with no account and no key. Both answer with CORS open, so
 * there is no proxy and no secret to keep. What each place *is* comes from the stop's real position,
 * which the app has held since the geo table was added.
 *
 * A route is cached by its two ends: a journey page asks for the same walk every time it is drawn,
 * and a second tap on the same walk does not ask the router again. When the router is slow or down,
 * the line falls back to the straight one and says so — a drawing that lies about being a route is
 * worse than a drawing that admits it is a sketch.
 */
import { getStop } from '../data/stops';

/** Latitude then longitude, the order Leaflet draws in. */
export type Point = [number, number];

export interface WalkStep {
  /** The street the step follows, or an empty string where the map has no name. */
  street: string;
  metres: number;
}

export interface WalkRoute {
  points: Point[];
  metres: number;
  seconds: number;
  steps: WalkStep[];
  /** True when the router did not answer and the line is the straight sketch. */
  fallback: boolean;
}

const FOOT_ROUTER = 'https://routing.openstreetmap.de/routed-foot/route/v1/foot';
const cache = new Map<string, WalkRoute>();

export function pointOf(stopId: string | undefined): Point | undefined {
  const stop = getStop(stopId);
  return stop ? [stop.geo.lat, stop.geo.lon] : undefined;
}

/** The straight line between two stops, used as the sketch when no route can be fetched. */
export function straightLine(fromStopId: string, toStopId: string): Point[] {
  const a = pointOf(fromStopId);
  const b = pointOf(toStopId);
  return a && b ? [a, b] : [];
}

function keyOf(fromStopId: string, toStopId: string): string {
  return `${fromStopId}>${toStopId}`;
}

/**
 * A walking route between two stops, along the real streets.
 *
 * `steps=true` is what makes **Navigeer** possible: the router returns each street it turns into,
 * with the distance along it, so the walk can be read out one street at a time instead of being one
 * grey sentence.
 */
export async function walkingRoute(fromStopId: string, toStopId: string): Promise<WalkRoute> {
  const key = keyOf(fromStopId, toStopId);
  const hit = cache.get(key);
  if (hit) return hit;

  const a = pointOf(fromStopId);
  const b = pointOf(toStopId);
  const sketch: WalkRoute = {
    points: a && b ? [a, b] : [],
    metres: 0,
    seconds: 0,
    steps: [],
    fallback: true,
  };
  if (!a || !b) return sketch;

  const url =
    `${FOOT_ROUTER}/${a[1]},${a[0]};${b[1]},${b[0]}` +
    '?overview=full&geometries=geojson&steps=true&alternatives=false';
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    clearTimeout(timer);
    if (!response.ok) return sketch;
    const body = (await response.json()) as {
      routes?: {
        distance: number;
        duration: number;
        geometry: { coordinates: [number, number][] };
        legs?: { steps?: { name?: string; distance?: number }[] }[];
      }[];
    };
    const route = body.routes?.[0];
    if (!route?.geometry?.coordinates?.length) return sketch;
    const walked: WalkRoute = {
      /* GeoJSON gives longitude first; Leaflet wants latitude first. */
      points: route.geometry.coordinates.map(([lon, lat]) => [lat, lon] as Point),
      metres: Math.round(route.distance),
      seconds: Math.round(route.duration),
      steps: (route.legs?.[0]?.steps ?? [])
        .map((step) => ({
          street: (step.name ?? '').trim(),
          metres: Math.round(step.distance ?? 0),
        }))
        /* A router names the same street again at every bridge and crossing it passes; one street
           should be one step, not two with the same name. */
        .filter((step, index, all) => step.street !== all[index - 1]?.street),
      fallback: false,
    };
    cache.set(key, walked);
    return walked;
  } catch {
    return sketch;
  }
}

/**
 * A ride, drawn through the stops it calls at.
 *
 * A train does not follow the street router, so its line joins the stations it stops at — which is
 * exactly what the traveller needs from a leg on a map: where it starts, where it calls, where it
 * ends. The stops in between are already on the leg.
 */
export function rideLine(leg: {
  fromStopId: string;
  toStopId: string;
  intermediateStops?: { stopId: string }[];
}): Point[] {
  const ids = [
    leg.fromStopId,
    ...(leg.intermediateStops ?? []).map((stop) => stop.stopId),
    leg.toStopId,
  ];
  return ids.map((id) => pointOf(id)).filter((point): point is Point => Boolean(point));
}
