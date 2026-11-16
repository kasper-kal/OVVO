import type { CSSProperties } from 'react';
import { MAP_POINT, mapCorridors } from '../../data/map';
import { STOPS } from '../../data/stops';
import type { ChapterMap } from '../../lib/wrappedDeck';
import { useT } from '../../lib/useT';

/*
 * **The year, drawn as a country.**
 *
 * The deck already has a rail for one repeated journey. This chapter is the other half of that
 * idea: every journey the year recorded, at once, with the route that kept coming back and the
 * station that kept appearing picked out. It opens on the whole network and then moves in on the
 * part of it that belongs to the traveller.
 *
 * All positions come from the app's existing map canvas (`data/map`), so this is the same
 * geography the map picker and the home widget use. Nothing is geocoded again here.
 */

interface Point {
  id: string;
  name: string;
  x: number;
  y: number;
}

const ALL_STOPS: Point[] = STOPS.flatMap((stop) => {
  const point = MAP_POINT(stop.id);
  return point ? [{ id: stop.id, name: stop.name, x: point.x, y: point.y }] : [];
});

/* The whole network, faint, so the traveller's web has a country around it. */
const GHOST_LINES: Array<{ id: string; points: string }> = mapCorridors('all').flatMap((line, index) => {
  const points = line.stops
    .map((stopId) => MAP_POINT(stopId))
    .filter((point): point is NonNullable<typeof point> => Boolean(point));
  if (points.length < 2) return [];
  return [
    {
      id: `${line.mode}-${index}`,
      points: points.map((point) => `${point.x},${point.y}`).join(' '),
    },
  ];
});

function routePath(from: Point, to: Point): string {
  const length = Math.max(1, Math.hypot(to.x - from.x, to.y - from.y));
  const bend = Math.min(8, length * 0.12);
  const midX = (from.x + to.x) / 2 - ((to.y - from.y) / length) * bend;
  const midY = (from.y + to.y) / 2 + ((to.x - from.x) / length) * bend;
  return `M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`;
}

function shortLabel(name: string): string {
  const clean = name.replace(/ Station$/, '');
  return clean.length > 21 ? `${clean.slice(0, 19)}...` : clean;
}

export function WrappedMapChapter({
  data,
  big,
  line,
}: {
  data: ChapterMap;
  big: string;
  line: string;
}) {
  const t = useT();
  const used = new Set(data.stops.map((stop) => stop.id));
  const topStop = data.stops.find((stop) => stop.id === data.topStopId) ?? data.stops[0];
  const topRoute = data.routes.find((route) => route.top) ?? data.routes[0];
  const labels = [...data.stops].sort((a, b) => b.count - a.count).slice(0, 3);

  const xs = data.stops.map((stop) => stop.x);
  const ys = data.stops.map((stop) => stop.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spread = Math.max(16, maxX - minX, maxY - minY);
  const zoom = Math.min(2.35, Math.max(1, 78 / spread));
  const centreX = (minX + maxX) / 2;
  const centreY = (minY + maxY) / 2;

  return (
    <section className="wrapped-map" aria-label={t('Map of your year')}>
      <header className="wrapped-map__head">
        <p className="wrapped-map__big">{big}</p>
        <p className="wrapped-map__line">{line}</p>
      </header>

      <div className="wrapped-map__frame">
        <svg
          className="wrapped-map__canvas"
          viewBox="0 0 100 100"
          role="img"
          aria-label={t('Your year drawn between {count} stops', { count: data.places })}
          focusable="false"
        >
          <g
            className="wrapped-map__camera"
            style={
              {
                '--map-zoom': zoom.toFixed(2),
                transformOrigin: `${centreX}% ${centreY}%`,
              } as CSSProperties
            }
          >
            <g className="wrapped-map__ghost" aria-hidden="true">
              {GHOST_LINES.map((line) => (
                <polyline key={line.id} points={line.points} />
              ))}
              {ALL_STOPS.filter((stop) => !used.has(stop.id)).map((stop) => (
                <circle key={stop.id} cx={stop.x} cy={stop.y} r="0.72" />
              ))}
            </g>

            <g className="wrapped-map__routes" aria-hidden="true">
              {data.routes.map((route, index) => (
                <path
                  key={`${route.from.id}-${route.to.id}`}
                  d={routePath(route.from, route.to)}
                  pathLength={1}
                  className={`wrapped-map__route${route.top ? ' is-top' : ''}`}
                  style={
                    {
                      '--delay': `${index * 48}ms`,
                      strokeWidth: route.top ? 1.15 : 0.3 + Math.min(0.6, route.count / 18),
                    } as CSSProperties
                  }
                />
              ))}
            </g>

            <g className="wrapped-map__stops" aria-hidden="true">
              {data.stops.map((stop) => (
                <circle
                  key={stop.id}
                  cx={stop.x}
                  cy={stop.y}
                  r={stop.id === data.topStopId ? 1.85 : 0.8 + Math.min(1.05, stop.count * 0.1)}
                  className={stop.id === data.topStopId ? 'is-top' : undefined}
                />
              ))}
              {topStop ? (
                <>
                  <circle
                    className="wrapped-map__pulse"
                    cx={topStop.x}
                    cy={topStop.y}
                    r="2.4"
                  />
                  <circle
                    className="wrapped-map__pulse wrapped-map__pulse--late"
                    cx={topStop.x}
                    cy={topStop.y}
                    r="2.4"
                  />
                </>
              ) : null}
            </g>

            <g className="wrapped-map__labels">
              {labels.map((stop) => {
                const right = stop.x < 66;
                return (
                  <text
                    key={stop.id}
                    x={stop.x + (right ? 2.6 : -2.6)}
                    y={stop.y - 1.8}
                    textAnchor={right ? 'start' : 'end'}
                    className={stop.id === data.topStopId ? 'is-top' : undefined}
                  >
                    {shortLabel(stop.name)}
                  </text>
                );
              })}
            </g>
          </g>
        </svg>

        <div className="wrapped-map__legend">
          <span>
            <i className="wrapped-map__swatch wrapped-map__swatch--line" aria-hidden="true" />
            {t('Most used line')} <strong>{data.topLine ?? t('No line stood out')}</strong>
          </span>
          <span>
            <i className="wrapped-map__swatch wrapped-map__swatch--stop" aria-hidden="true" />
            {t('Top station')} <strong>{topStop?.name ?? t('Not enough journeys')}</strong>
          </span>
        </div>
      </div>

      <p className="wrapped-map__foot">
        {topRoute
          ? t('{count} journeys between {from} and {to}.', {
              count: topRoute.count,
              from: topRoute.from.name,
              to: topRoute.to.name,
            })
          : t('Every route here is one you planned.')}
      </p>
    </section>
  );
}
