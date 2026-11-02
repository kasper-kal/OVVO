/**
 * **The Fold: the one object the whole film is drawn with.**
 *
 * A ribbon of folded card, built from flat SVG bands rather than a 3D engine. It is the only thing
 * on screen that carries colour, and it is the only thing that never stops moving. A page changes by
 * folding this into its next pose, never by sliding a slide.
 *
 * The bands are flat fills, not gradients: the deep tone carries the page, the mid tone is the
 * fold's edge and the light tone is the hairline. A gradient on top of a photograph-free black page
 * is how the first rebuild turned into a haze; flat panels keep the edges crisp and the white type
 * legible at every point of the drift.
 */

import type { CSSProperties } from 'react';
import { NL_BOUNDS, NL_OUTLINE } from '../../data/nlGeo';
import type { PoseId, StoryLabel, StoryRoute, StoryStop } from '../../lib/wrappedDeck';

const W = 390;
const H = 844;

interface Pose {
  id: PoseId;
  hinge: number;
  tilt: number;
  fold: number;
  spread: number;
  lean: number;
  twist: number;
}

const POSES: Record<PoseId, Pose> = {
  tunnel: { id: 'tunnel', hinge: 0.5, tilt: -8, fold: 5, spread: 1.15, lean: 0.2, twist: 0.55 },
  fan: { id: 'fan', hinge: 0.47, tilt: 14, fold: 4, spread: 0.95, lean: -0.4, twist: 0.3 },
  wall: { id: 'wall', hinge: 0.55, tilt: -18, fold: 6, spread: 1.2, lean: 0, twist: -0.2 },
  slice: { id: 'slice', hinge: 0.44, tilt: 26, fold: 3, spread: 1.2, lean: 0.55, twist: 0.7 },
  lane: { id: 'lane', hinge: 0.58, tilt: 0, fold: 4, spread: 0.6, lean: -0.15, twist: 0.1 },
  burst: { id: 'burst', hinge: 0.5, tilt: -26, fold: 3, spread: 1.35, lean: 0.3, twist: 1 },
};

interface Panel {
  face: string;
  bevel: string;
  edge: string;
}

/**
 * The bands, in viewBox units.
 *
 * The height of a fold grows with `spread`, so a wide pose is a thicker ribbon and a narrow one is a
 * thread, while the gaps stay the same. That is what keeps black between the folds on every pose.
 */
function panelsOf(pose: Pose): Panel[] {
  const bandHeight = H * 0.075 * (0.8 + pose.spread * 0.5);
  const gap = H * 0.06;
  const step = bandHeight + gap;
  const span = pose.fold * step - gap;
  const top = H * pose.hinge - span / 2;
  const slope = Math.tan((pose.tilt * Math.PI) / 180) * bandHeight * 0.85;

  return Array.from({ length: pose.fold }, (_, i) => {
    const y = top + i * step;
    const lean = pose.lean * 22 * Math.sin((i + 1) * 0.85);
    const offset = pose.twist * i * 7;
    const x0 = -40 + offset;
    const x1 = W + 40 + offset;
    const topY = y + slope + lean;
    const bottomY = y + bandHeight - slope * 0.2 + lean;
    const face = `M ${x0} ${topY} L ${x1} ${topY - slope * 2} L ${x1} ${bottomY - slope} L ${x0} ${bottomY} Z`;
    const bevel = `M ${x1 - 16} ${topY - slope * 2 + 2} L ${x1} ${topY - slope * 2} L ${x1} ${
      bottomY - slope
    } L ${x1 - 16} ${bottomY - slope + 2} Z`;
    const edge = `M ${x0} ${topY} L ${x1} ${topY - slope * 2}`;
    return { face, bevel, edge };
  });
}

/** The country, in the same degree space as the stations, with north up. */
const MAP_BOX = {
  x: NL_BOUNDS.west - 0.06,
  y: -NL_BOUNDS.north - 0.05,
  w: NL_BOUNDS.east - NL_BOUNDS.west + 0.12,
  h: NL_BOUNDS.north - NL_BOUNDS.south + 0.1,
};
const FLIP = (lat: number): number => -lat;
const LAND = NL_OUTLINE.map((ring) => ring.map(([lon, lat]) => `${lon},${FLIP(lat)}`).join(' '));

interface FoldProps {
  pose: PoseId;
  /** The look's four colours, so the object can wear the theme instead of photographing it. */
  wear?: [string, string, string, string];
  map?: { routes: StoryRoute[]; stops: StoryStop[]; labels: StoryLabel[] };
  hours?: { bars: number[]; peak: number };
  /** A second copy, drawn behind, used for the pose it is folding away from. */
  leaving?: boolean;
}

export function Fold({ pose, wear, map, hours, leaving = false }: FoldProps) {
  const active = POSES[pose];

  if (map && map.routes.length > 0) {
    const unit = MAP_BOX.w / 100;
    const centre = map.stops.reduce(
      (acc, stop) => ({
        x: acc.x + stop.x / Math.max(1, map.stops.length),
        y: acc.y + stop.y / Math.max(1, map.stops.length),
      }),
      { x: 0, y: 0 },
    );

    return (
      <div className={`wr-fold wr-fold--map${leaving ? ' is-leaving' : ''}`} data-pose={pose} aria-hidden="true">
        <div className="wr-fold__panels">
          <svg
            className="wr-fold__svg wr-map"
            viewBox={`${MAP_BOX.x} ${MAP_BOX.y} ${MAP_BOX.w} ${MAP_BOX.h}`}
            preserveAspectRatio="xMidYMid meet"
            focusable="false"
          >
            {LAND.map((points, at) => (
              <polygon key={`land-${at}`} className="wr-map__land" points={points} />
            ))}
            {map.routes.map((route, at) => {
              const x1 = route.x1;
              const y1 = FLIP(route.y1);
              const x2 = route.x2;
              const y2 = FLIP(route.y2);
              const dx = x2 - x1;
              const dy = y2 - y1;
              const span = Math.hypot(dx, dy) || 1;
              const bend = (at === 0 ? 0.08 : at === 1 ? 0.13 : 0.18) * span * (at % 2 === 0 ? 1 : -1);
              const cx = (x1 + x2) / 2 - (dy / span) * bend;
              const cy = (y1 + y2) / 2 + (dx / span) * bend;
              const d = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
              return (
                <g key={`route-${at}`}>
                  <path className="wr-map__casing" d={d} style={{ '--i': at } as CSSProperties} />
                  <path
                    className={`wr-map__route${at === 0 ? ' is-first' : ''}`}
                    d={d}
                    pathLength={1}
                    style={{ '--i': at } as CSSProperties}
                  />
                </g>
              );
            })}
            {map.labels.map((label) => {
              const dx = label.x - centre.x;
              const dy = label.y - centre.y;
              const span = Math.hypot(dx, dy) || 1;
              return (
                <line
                  key={`tick-${label.name}`}
                  className="wr-map__tick"
                  x1={label.x}
                  y1={FLIP(label.y)}
                  x2={label.x + (dx / span) * unit * 4}
                  y2={FLIP(label.y) + (dy / span) * unit * 4}
                />
              );
            })}
          </svg>
          <div className="wr-map__names">
            {/* Stations are fixed-size dots in HTML: an SVG circle here scaled itself unpredictably. */}
            {map.stops.map((stop, at) => (
              <i
                key={`pin-${at}`}
                className="wr-map__pin"
                style={{
                  left: `${((stop.x - MAP_BOX.x) / MAP_BOX.w) * 100}%`,
                  top: `${((FLIP(stop.y) - MAP_BOX.y) / MAP_BOX.h) * 100}%`,
                  animationDelay: `${240 + at * 80}ms`,
                }}
              />
            ))}
            {map.labels.map((label) => {
              const left = Math.min(84, Math.max(16, ((label.x - MAP_BOX.x) / MAP_BOX.w) * 100));
              const top = Math.min(88, Math.max(8, ((FLIP(label.y) - MAP_BOX.y) / MAP_BOX.h) * 100));
              return (
                <span
                  key={label.name}
                  className={`wr-map__name${left > 50 ? ' is-right' : ''}`}
                  style={{ left: `${left}%`, top: `${top}%` }}
                >
                  {label.name}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (hours) {
    const tallest = Math.max(1, ...hours.bars);
    const floor = 706;
    return (
      <div className={`wr-fold wr-fold--hours${leaving ? ' is-leaving' : ''}`} data-pose={pose} aria-hidden="true">
        <div className="wr-fold__panels">
          <svg className="wr-fold__svg wr-hours" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" focusable="false">
            {hours.bars.map((value, at) => {
              const height = 20 + (value / tallest) * 165;
              return (
                <rect
                  key={at}
                  className={`wr-hours__bar${at === hours.peak ? ' is-peak' : ''}`}
                  x={9 + at * 15.7}
                  y={floor - height}
                  width={11}
                  height={height}
                  rx={3}
                  style={{ '--i': at } as CSSProperties}
                />
              );
            })}
          </svg>
        </div>
      </div>
    );
  }

  const panels = panelsOf(active);
  return (
    <div className={`wr-fold${leaving ? ' is-leaving' : ''}`} data-pose={pose} aria-hidden="true">
      <div className="wr-fold__panels">
        <svg className="wr-fold__svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" focusable="false">
          {panels.map((panel, at) => (
            <g key={`panel-${at}`} className="wr-fold__panel" style={{ '--i': at } as CSSProperties}>
              <path d={panel.face} fill={wear ? wear[0] : 'var(--act-deep)'} />
              <path d={panel.bevel} fill={wear ? wear[2] : 'var(--act-mid)'} />
              <path d={panel.edge} fill="none" stroke={wear ? wear[3] : 'var(--act-light)'} strokeWidth={1.5} vectorEffect="non-scaling-stroke" opacity={0.9} />
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
