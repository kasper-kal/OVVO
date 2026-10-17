import { getStop, STOPS } from './stops';
import { NETWORK } from './network';
import type { PublicMode, TravelMode } from './types';

/**
 * Where a stop sits on the map module's 0–100 canvas.
 *
 * The schematic position (`Stop.coordinates`) is refitted once so the network fills the
 * frame, and nothing else in the map's geometry is computed anywhere else — the home map
 * widget and the full-screen map picker both draw from this.
 */
export const MAP_POINT: (stopId: string) => MapPoint | null = (() => {
  const xs = STOPS.map((stop) => stop.coordinates.x);
  const ys = STOPS.map((stop) => stop.coordinates.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const scale = Math.min(86 / (maxX - minX), 86 / (maxY - minY));
  const offX = (100 - (maxX - minX) * scale) / 2;
  const offY = (100 - (maxY - minY) * scale) / 2;
  return (stopId: string) => {
    const stop = getStop(stopId);
    if (!stop) return null;
    return {
      x: offX + (stop.coordinates.x - minX) * scale,
      y: offY + (stop.coordinates.y - minY) * scale,
    };
  };
})();

export interface MapPoint {
  x: number;
  y: number;
}

/**
 * The lines a 0–100 canvas is drawn from: forty-one services share a handful of
 * corridors, so the same polyline is painted once per corridor per mode rather than
 * once per service (which came out near-black, and dragged the whole page sideways
 * when a name was placed for each one).
 *
 * This is the drawing, not the statistics — a caller that needs "how many services call
 * here" must count the services themselves.
 */
export function mapCorridors(mode: 'all' | PublicMode = 'all'): { id: string; mode: TravelMode; stops: string[] }[] {
  const seen = new Set<string>();
  return NETWORK.filter((line) => mode === 'all' || line.mode === mode).filter((line) => {
    const key = `${line.mode}|${[...line.stops].sort().join('>')}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
