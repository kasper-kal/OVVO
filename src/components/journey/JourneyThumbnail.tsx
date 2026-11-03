import { Link } from 'react-router-dom';
import { MAP_POINT } from '../../data/map';
import { useT } from '../../lib/useT';
import type { Journey } from '../../data/types';

/**
 * **A small drawing of the journey, beside its title.**
 *
 * 9292 opens a journey with a thumbnail of the route and an arrow in its corner that opens the map.
 * Without one the page began with two place names and no picture of what the trip looks like, and
 * the only way to the map was a pill three rows down.
 *
 * It is drawn from the same canvas the map screen draws from, so the thumbnail and the map agree:
 * the route is the legs' own stops, fitted into the square, with a ring at the start and a square at
 * the end (the app's own rule for the two ends of a journey).
 */
export function JourneyThumbnail({ journey }: { journey: Journey }) {
  const t = useT();

  /* Every stop the journey touches, in order, without repeats of the same platform-level stop. */
  const ids: string[] = [];
  for (const leg of journey.legs) {
    if (!ids.includes(leg.fromStopId)) ids.push(leg.fromStopId);
    for (const stop of leg.intermediateStops ?? []) {
      if (!ids.includes(stop.stopId)) ids.push(stop.stopId);
    }
    if (!ids.includes(leg.toStopId)) ids.push(leg.toStopId);
  }
  const points = ids
    .map((id) => MAP_POINT(id))
    .filter((point): point is { x: number; y: number } => Boolean(point));
  if (points.length < 2) return null;

  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const span = Math.max(Math.max(...xs) - minX, Math.max(...ys) - minY) || 1;
  /* Eight units of air on every side, so no mark touches the frame. */
  const pad = 10;
  const scale = (100 - pad * 2) / span;
  const offsetX = pad + ((100 - pad * 2) - (Math.max(...xs) - minX) * scale) / 2;
  const offsetY = pad + ((100 - pad * 2) - (Math.max(...ys) - minY) * scale) / 2;
  const placed = points.map((point) => ({
    x: offsetX + (point.x - minX) * scale,
    y: offsetY + (point.y - minY) * scale,
  }));
  const path = placed.map((point, index) => `${index ? 'L' : 'M'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ');
  const first = placed[0];
  const last = placed[placed.length - 1];

  return (
    <Link to={`/map?journey=${journey.id}`} className="journey-thumb" aria-label={t('Show on map')}>
      <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
        <path d={path} className="journey-thumb__line" />
        <circle cx={first.x} cy={first.y} r="5" className="journey-thumb__start" />
        <rect x={last.x - 4.4} y={last.y - 4.4} width="8.8" height="8.8" className="journey-thumb__end" />
      </svg>
      <span className="journey-thumb__expand" aria-hidden="true">
        <svg viewBox="0 0 16 16" focusable="false">
          <path d="M4.5 11.5 11.5 4.5M11.5 4.5H6.4M11.5 4.5v5.1" />
        </svg>
      </span>
    </Link>
  );
}
