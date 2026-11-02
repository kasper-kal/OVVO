/**
 * **The Fold: the one object the whole film is drawn with.**
 *
 * A ribbon of folded paper, built from flat SVG bands rather than a 3D engine. It is the only thing
 * on screen that carries colour, and it is the only thing that never stops moving. A page changes by
 * folding this into its next pose, never by sliding a slide.
 *
 * The bands are deliberately thin: the black ground has to stay the page, and a wall of colour
 * behind white type is the thing the first version of this rebuild got wrong. What makes it read as
 * folded paper is the gap between the bands, the gradient turning panel by panel, and a hairline of
 * light along each fold.
 */

import { useId } from 'react';
import type { CSSProperties } from 'react';
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
  angle: number;
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
    return { face, bevel, edge, angle: pose.tilt + i * 9 };
  });
}

function mapBox(stops: StoryStop[]): { x: number; y: number; w: number; h: number } {
  if (stops.length === 0) return { x: 0, y: 0, w: 100, h: 100 };
  const xs = stops.map((stop) => stop.x);
  const ys = stops.map((stop) => stop.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const padX = Math.max(10, (maxX - minX) * 0.16);
  const padY = Math.max(10, (maxY - minY) * 0.16);
  return { x: minX - padX, y: minY - padY, w: maxX - minX + padX * 2, h: maxY - minY + padY * 2 };
}

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
  const uid = useId().replace(/[:]/g, '');
  const active = POSES[pose];

  if (map && map.routes.length > 0) {
    const box = mapBox(map.stops);
    const unit = box.w / 100;
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
            viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
            preserveAspectRatio="xMidYMid meet"
            focusable="false"
          >
            {map.routes.map((route, at) => {
              const dx = route.x2 - route.x1;
              const dy = route.y2 - route.y1;
              const span = Math.hypot(dx, dy) || 1;
              const bend = (at === 0 ? 0.1 : at === 1 ? 0.16 : 0.22) * span * (at % 2 === 0 ? 1 : -1);
              const cx = (route.x1 + route.x2) / 2 - (dy / span) * bend;
              const cy = (route.y1 + route.y2) / 2 + (dx / span) * bend;
              const d = `M ${route.x1} ${route.y1} Q ${cx} ${cy} ${route.x2} ${route.y2}`;
              return (
                <g key={`route-${at}`}>
                  {route.count > 1 ? (
                    <>
                      <path className="wr-map__halo" d={d} style={{ '--i': at } as CSSProperties} />
                      <path className="wr-map__glow" d={d} style={{ '--i': at } as CSSProperties} />
                    </>
                  ) : null}
                  <path
                    className={`wr-map__route${at === 0 ? ' is-first' : ''}`}
                    d={d}
                    pathLength={1}
                    style={{ '--i': at } as CSSProperties}
                  />
                </g>
              );
            })}
            {map.stops.map((stop, at) => (
              <g
                key={`stop-${at}`}
                className="wr-map__stop"
                style={{ '--i': at } as CSSProperties}
              >
                <circle className="wr-map__ring" cx={stop.x} cy={stop.y} r={unit * 2.6} />
                <circle className="wr-map__dot" cx={stop.x} cy={stop.y} r={unit * 1.1} />
              </g>
            ))}
            {map.labels.map((label) => {
              const dx = label.x - centre.x;
              const dy = label.y - centre.y;
              const span = Math.hypot(dx, dy) || 1;
              const outX = (dx / span) * unit * 5;
              const outY = (dy / span) * unit * 5;
              return (
                <line
                  key={`tick-${label.name}`}
                  className="wr-map__tick"
                  x1={label.x}
                  y1={label.y}
                  x2={label.x + outX}
                  y2={label.y + outY}
                />
              );
            })}
          </svg>
          <div className="wr-map__names">
            {map.labels.map((label) => {
              const left = Math.min(88, Math.max(12, ((label.x - box.x) / box.w) * 100));
              const raw = Math.min(90, Math.max(6, ((label.y - box.y) / box.h) * 100));
              /* A name under the sentence is a name nobody reads, so the middle band is kept clear. */
              const top = raw > 38 && raw < 64 ? (raw < 51 ? 34 : 68) : raw;
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
          <defs>
            {panels.map((panel, at) => (
              <linearGradient
                key={`grad-${at}`}
                id={`${uid}-g${at}`}
                x1="0"
                y1="0"
                x2="1"
                y2="1"
                gradientTransform={`rotate(${panel.angle} 0.5 0.5)`}
              >
                {/*
                  * The look's own four colours, in an order that can be seen: its accent as the light,
                  * its ink as the middle, its page as the deep. Worn literally, page first, the folds
                  * were four shades of near black and the page read as empty.
                  */}
                <stop offset="0%" style={{ stopColor: wear ? wear[3] : 'var(--act-light)' }} />
                <stop offset="52%" style={{ stopColor: wear ? wear[2] : 'var(--act-mid)' }} />
                <stop offset="100%" style={{ stopColor: wear ? wear[0] : 'var(--act-deep)' }} />
              </linearGradient>
            ))}
          </defs>
          {panels.map((panel, at) => (
            <g key={`panel-${at}`} className="wr-fold__panel" style={{ '--i': at } as CSSProperties}>
              <path d={panel.face} fill={`url(#${uid}-g${at})`} />
              <path d={panel.bevel} fill={wear ? wear[(at + 2) % 4] : 'var(--act-deep)'} opacity={0.4} />
              <path d={panel.edge} fill="none" stroke="rgba(255,255,255,0.24)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
