import type { ComponentType } from 'react';
import { useMemo, useState } from 'react';
import { DEFAULT_HOME_WIDGETS, REQUIRED_WIDGETS } from './defaults';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../state/AppState';
import { SearchForm } from '../components/journey/SearchForm';
import { StopCombobox } from '../components/journey/StopCombobox';
import { BoardList } from '../components/stops/BoardList';
import { StopLink } from '../components/stops/StopLink';
import { Button, Chip, Dialog, IconButton } from '../components/ui/primitives';
import { Icon, MODE_ICON_NAME } from '../components/ui/Icons';
import type { IconName } from '../components/ui/Icons';
import {
  STOPS,
  customStopName,
  distanceFromPosition,
  formatDistance,
  getStop,
  hasBoard,
  stopLabel,
} from '../data/stops';
import { NETWORK } from '../data/network';
import { MAP_POINT, mapCorridors } from '../data/map';
import { disruptionForLeg, disruptionsForStop } from '../data/disruptions';
import { boardForStop } from '../data/departures';
import { modeLabel } from '../data/preferences';
import { endLabel } from '../data/journeyEngine';
import { useMinuteNow } from '../lib/useMinuteNow';
import { useFormat } from '../lib/useFormat';
import { useT } from '../lib/useT';
import { alertWords } from '../lib/disruptionText';
import type { PublicMode, Stop } from '../data/types';
import type { WidgetWidth } from '../state/types';

/**
 * Home-screen widget catalogue.
 *
 * Widgets are declared here and rendered by HomePage inside a shared frame, so
 * adding one to the home screen is a matter of listing its id. The `defaultOn`
 * widgets (see `./defaults`) are what a fresh install shows; everything here is
 * available from "Add widget".
 *
 * The catalogue was cut from seventeen cards to nine by the widget audit
 * (`WIDGET-AUDIT.md`): a card earns its place by holding something of the
 * traveller's or doing something for them, and seven cards did neither — a count
 * of the sample network, a credits list, an About page, navigation on top of the
 * navigation, and one settings echo. The two "your journeys" lists were merged
 * (they were two default cards listing the same kind of thing), and the network
 * news card became the alerts that touch the journeys you kept.
 */
export type WidgetSpan = WidgetWidth;

/**
 * A widget with nothing in it yet, drawn as a block rather than a line.
 *
 * These cards used to hold one faint sentence at the top of a 208px box — "my god all that
 * whitespace is ugly", with two photographs of exactly that — because a size tier used to set the
 * card's height and an empty card had no rows to spend it on. With the sizes gone a card is as tall
 * as its contents, so the mark and the sentence are what it is: a card waiting for something rather
 * than a card that failed to load. No action button: the four widgets this is used in are filled from other
 * screens (a journey's heart, a saved search, a stop's heart), and a button here would be a
 * second way to do what the screen it links to already does.
 */
function WidgetEmpty({ icon, line, hint }: { icon: IconName; line: string; hint?: string }) {
  return (
    <div className="widget-empty">
      <span className="widget-empty__icon" aria-hidden="true">
        <Icon name={icon} size={20} />
      </span>
      <p className="widget-empty__line t-sm t-muted">{line}</p>
      {/* Where the thing comes from, as a second sentence — the answer to "so how do I get one"
          that an empty card owes the traveller, and the difference between a card that is empty
          and a card that looks unfinished. */}
      {hint ? <p className="widget-empty__hint t-sm t-faint">{hint}</p> : null}
    </div>
  );
}

/** What a trimmed list is missing, said out loud rather than left to be guessed at. */
function TrimNote({ total, shown }: { total: number; shown: number }) {
  const t = useT();
  if (total <= shown) return null;
  return <span className="t-sm t-faint">{t('{count} more, not shown at this size', { count: total - shown })}</span>;
}

export const WIDGET_CATEGORIES: WidgetDefinition['category'][] = [
  'Plan',
  'Travel information',
  'Yours',
];

export interface WidgetDefinition {
  id: string;
  title: string;
  description: string;
  category: 'Plan' | 'Travel information' | 'Yours';
  span: WidgetSpan;
  /**
   * Kept on the home screen in super energy saving, when everything else is not drawn.
   *
   * The test is not "is this card nice" but "can the question — *when does the bus go?* — be
   * answered without it": the planner to name the journey, the card tied to a station that lists
   * its departures, and the stops the traveller hearted to get to that card. Every other widget is
   * a way of browsing, not a way of finding out, so it is not drawn at 6% battery. A card that is
   * not marked is hidden by that mode (and comes back the moment the phone is charged).
   */
  essential?: boolean;
  /** Widgets that cannot be removed (set from `./defaults`). */
  required?: boolean;
  /** Shown on a fresh install (set from `./defaults`). */
  defaultOn?: boolean;
  Body: ComponentType;
}

/* ------------------------------------------------------------------ helpers */

/*
 * One clock for every widget, aligned to the minute (see `lib/useMinuteNow.ts`).
 *
 * This was an interval that fired every 30 seconds from whenever the widget mounted, and the
 * minute was read in the render: the clock could be up to 30 seconds behind, then a whole minute
 * behind after the tab slept, which is what the traveller saw as "the website often has the time
 * wrong". A widget is a clock; it re-reads at :00.
 */
function useClockMinutes(): number {
  return useMinuteNow();
}

const MODE_CHOICES: { value: 'all' | PublicMode; label: string }[] = [
  { value: 'all', label: 'All routes' },
  { value: 'bus', label: 'Bus' },
  { value: 'train', label: 'Train' },
  { value: 'tram', label: 'Tram' },
  { value: 'metro', label: 'Metro' },
  { value: 'ferry', label: 'Ferry' },
];

/* -------------------------------------------------------------- the widgets */

function PlannerWidget() {
  return <SearchForm />;
}

/**
 * **The two ends of a kept search, each one a way to its stop.**
 *
 * "Utrecht Centraal → Amsterdam Centraal" is the most-read line on the home screen — it is how a
 * saved search and a saved journey name themselves — and both of those words are places with a
 * page. They were plain text, so the only way to look at one of them was to plan the journey again
 * and find it on the results screen.
 *
 * An end that is an address rather than a stop keeps its words and gets no link: it has no page
 * (`StopLink`'s second rule, and the reason `endLabel` exists).
 */
function QueryEnds({ query }: { query: Parameters<typeof endLabel>[0] }) {
  const end = (side: 'from' | 'to') => {
    const stopId = side === 'from' ? query.fromStopId : query.toStopId;
    const label = endLabel(query, side);
    return stopId ? <StopLink stopId={stopId} label={label} /> : <>{label}</>;
  };
  return (
    <>
      {end('from')} <Icon name="arrowRight" size={13} /> {end('to')}
    </>
  );
}

/** A handful of names: a label per stop is unreadable. */
const MAP_LABEL_LIMIT = 5;
/*
 * The label type, in canvas units — and the **worst case**, not the desktop case.
 *
 * The stylesheet draws this type larger on a phone (3.4 units of a 0–100 canvas, which is the only
 * size that is legible at 320–430) and smaller on a wide plate, where 3.4 units would be 25px of
 * bold text. This constant is what the collision boxes below are built from, so it takes the
 * phone size everywhere: the desktop then has more air around each name than its own type needs,
 * which costs a name or two and never paints one on another. The audit's 3.78px phone labels and
 * its 14 overlapping pairs (3.2, 5.3) both came from these two numbers disagreeing with the ink.
 */
const MAP_LABEL_FONT = 3.4;
/** Air kept between two names and between a name and the frame edge, in canvas units. */
const MAP_LABEL_PAD = 1;
/**
 * How far a name's box must stay from a stop's centre, in canvas units. A dot is r 1
 * plus its 0.4 stroke (r 1.9 when highlighted), so 1.5 units left the ink touching the
 * circle — on screen that measured 0.0px of air and read as text printed on a station.
 * 2.6 keeps roughly one unit of clear space around the largest dot.
 */
const MAP_LABEL_DOT = 2.6;

/**
 * A name's width in canvas units. The label type is sized in canvas units (2.6 of the
 * 0-100 canvas), so it scales with the drawing rather than with the viewport — which
 * means a width measured here holds at every screen size. Measured with the real font
 * at 100px and scaled down, because a canvas will not measure a 2.6px font usefully.
 */
const mapLabelWidth = (() => {
  let context: CanvasRenderingContext2D | null = null;
  let started = false;
  return (name: string): number => {
    /* Without a DOM (server rendering, tests) fall back to an average glyph width. */
    if (typeof document === 'undefined') return name.length * MAP_LABEL_FONT * 0.62;
    if (!started) {
      started = true;
      const family = getComputedStyle(document.body)?.fontFamily;
      context = document.createElement('canvas').getContext('2d');
      if (context) context.font = `600 100px ${family || 'system-ui, sans-serif'}`;
    }
    if (!context) return name.length * MAP_LABEL_FONT * 0.62;
    return (context.measureText(name).width / 100) * MAP_LABEL_FONT;
  };
})();

interface LabelBox {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/** Where a name is drawn relative to its stop, and the rectangle it then occupies. */
interface LabelPlacement {
  textAnchor: 'start' | 'end';
  dx: number;
  dy: number;
  box: LabelBox;
}

/**
 * Every position a name may take, best first: beside the dot, then above it, then below,
 * then two lines above, then two lines below. The second line of each pair exists
 * because the dense Randstad leaves no legal spot beside a busy junction, and a name two
 * lines away from its dot beats no name at all. Which side comes first depends on where
 * the stop sits on the canvas, so names lean inwards rather than off the edge.
 *
 * 3.4 units tall: the measured box of a 2.6-unit name (1.0em of ascent+descent plus
 * the 0.55-unit paint-order stroke), centred on the baseline the renderer uses.
 */
function mapLabelPlacements(point: { x: number; y: number }, name: string): LabelPlacement[] {
  const width = mapLabelWidth(name);
  const preferred: ('left' | 'right')[] = point.x > 55 ? ['left', 'right'] : ['right', 'left'];
  const candidates: { side: 'left' | 'right'; dx: number; dy: number }[] = [];
  for (const dx of [2.4, 5]) {
    for (const dy of [0.8, -2.6, 4.2, -5.9, 7.5]) {
      for (const side of preferred) candidates.push({ side, dx, dy });
    }
  }
  return candidates.map(({ side, dx: offset, dy }) => {
    const dx = side === 'right' ? offset : -offset;
    const left = side === 'right' ? point.x + dx : point.x + dx - width;
    return {
      textAnchor: side === 'right' ? 'start' : 'end',
      dx,
      dy,
      box: { left, right: left + width, top: point.y + dy - 1.7, bottom: point.y + dy + 1.7 },
    };
  });
}

/** Rectangles overlap once they are closer than a single pad in either direction. */
function boxesClash(a: LabelBox, b: LabelBox): boolean {
  return (
    a.left < b.right + MAP_LABEL_PAD &&
    b.left < a.right + MAP_LABEL_PAD &&
    a.top < b.bottom + MAP_LABEL_PAD &&
    b.top < a.bottom + MAP_LABEL_PAD
  );
}

/** The nearest point of a box to a dot: names must clear the dots they sit beside. */
function boxHitsDot(box: LabelBox, dot: { x: number; y: number }): boolean {
  const x = Math.min(Math.max(dot.x, box.left), box.right);
  const y = Math.min(Math.max(dot.y, box.top), box.bottom);
  return Math.hypot(dot.x - x, dot.y - y) < MAP_LABEL_DOT;
}

/** A corridor, as drawn: one segment per hop between two stops. */
type Segment = [{ x: number; y: number }, { x: number; y: number }];

/** Do two segments cross? Proper orientation test, so a shared endpoint does not count. */
function segmentsCross(a: Segment, b: Segment): boolean {
  const side = (o: { x: number; y: number }, p: { x: number; y: number }, q: { x: number; y: number }) =>
    (p.x - o.x) * (q.y - o.y) - (p.y - o.y) * (q.x - o.x);
  const d1 = side(b[0], b[1], a[0]);
  const d2 = side(b[0], b[1], a[1]);
  const d3 = side(a[0], a[1], b[0]);
  const d4 = side(a[0], a[1], b[1]);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

/**
 * How many corridors run through a name's box. A hair is taken off the box first: a
 * line grazing its edge is not a line through the text. Measured before this rule
 * existed: "Rotterdam Centraal" had a corridor crossing 26 sampled points inside its
 * box at 390px (2.4px of travel) and "Zwolle" four.
 */
function boxCrossesLine(box: LabelBox, segments: Segment[]): number {
  const inset = 0.25;
  const left = box.left + inset;
  const right = box.right - inset;
  const top = box.top + inset;
  const bottom = box.bottom - inset;
  if (right <= left || bottom <= top) return 0;
  const corners = [
    { x: left, y: top },
    { x: right, y: top },
    { x: right, y: bottom },
    { x: left, y: bottom },
  ];
  const edges: Segment[] = corners.map((corner, index) => [corner, corners[(index + 1) % corners.length]] as Segment);
  let crossings = 0;
  for (const segment of segments) {
    for (const edge of edges) {
      if (segmentsCross(segment, edge)) {
        crossings += 1;
        break;
      }
    }
  }
  return crossings;
}

/**
 * The network map itself: every line drawn between the stops it calls at, positioned from
 * the stops' real coordinates, filtered by mode. Stops open their own page; a stop or journey
 * that asked for the map is highlighted.
 *
 * A component of its own because **two screens draw it**: the home screen's widget and the map's
 * own screen (`pages/MapPage.tsx`). The highlighting, the corridor thinning and the label
 * placement are the same work in both, and a second copy of a map would be a second map.
 */
export function NetworkMap({
  priority = [],
  variant = 'widget',
}: {
  priority?: string[];
  /*
   * `widget` is the home card and the glimpse it draws; `screen` is `/map`, where the point is to
   * look at the drawing properly. The two used to be one class, so the screen inherited the
   * widget's 16:9 plate and letterboxed a square drawing into 37% of it (3.1). The screen also
   * gains the list of stops below the canvas: a picture is not a way to reach a stop with a
   * keyboard.
   */
  variant?: 'widget' | 'screen';
}) {
  const t = useT();
  const [params] = useSearchParams();
  const [mode, setMode] = useState<'all' | PublicMode>('all');
  const navigate = useNavigate();
  const { findJourney } = useApp();
  const requestedStop = getStop(params.get('stop') ?? undefined);
  const requestedJourney = findJourney(params.get('journey') ?? undefined);

  const lines = useMemo(() => NETWORK.filter((line) => mode === 'all' || line.mode === mode), [mode]);

  /*
   * A card's own stops are drawn as selected: on a home screen, "highlighted" means "yours".
   *
   * The same list ranks the names, so the stops the drawing is *about* — your hearted stops, the
   * stop this screen was opened for, the two ends of the journey — are named before the network's
   * busiest junctions. They were highlighted and unnamed (3.2).
   */
  const wantedStops = useMemo(() => {
    const ids = [...priority];
    if (requestedStop) ids.push(requestedStop.id);
    if (requestedJourney) {
      requestedJourney.legs.forEach((leg) => {
        ids.push(leg.fromStopId, leg.toStopId);
      });
    }
    return [...new Set(ids)].filter(Boolean);
  }, [priority, requestedStop, requestedJourney]);
  const highlighted = new Set<string>(wantedStops);

  const drawn = useMemo(() => {
    const calls = new Map<string, number>();
    for (const line of lines) {
      for (const stopId of line.stops) calls.set(stopId, (calls.get(stopId) ?? 0) + 1);
    }
    /* Busiest junctions first, but never two names on top of each other. A fixed
       point-to-point distance does not do that: the names are wider than any distance
       that also keeps them apart vertically, so two points far enough apart still
       painted overlapping text. Test the rectangles the names actually occupy —
       including which side of their stop each one is anchored to — instead. */
    const dots = [...calls.keys()]
      .map((stopId) => MAP_POINT(stopId))
      .filter((point): point is { x: number; y: number } => Boolean(point));

    /* Forty-one services share a handful of corridors, so the same polyline used to be
       painted once per service and the network came out near-black. One polyline per
       corridor per mode: a filter that picks one mode still shows all of it. The
       corridor list itself is shared with the full-screen map picker. */
    const corridors = mapCorridors(mode);
    const segments: Segment[] = [];
    for (const line of corridors) {
      let previous: { x: number; y: number } | null = null;
      for (const stopId of line.stops) {
        const point = MAP_POINT(stopId);
        if (!point) continue;
        if (previous) segments.push([previous, point]);
        previous = point;
      }
    }

    const labelled: (LabelPlacement & { stopId: string })[] = [];
    /*
     * The labels, in the order the traveller would care about them: the stops handed in by the
     * card (`priority` — hearted, then nearest), and only then the busiest junctions of the
     * network. The home widget passes its traveller's stops; the map screen passes nothing and
     * keeps the network's own order.
     */
    /*
     * Selected stops are ranked with the priority list: a journey's own two ends, and the stop the
     * screen was opened for, were never named — Amsterdam and Utrecht Centraal were exactly the two
     * names a map of *that* journey did not draw (3.2).
     */
    const rank = (stopId: string) => {
      const index = wantedStops.indexOf(stopId);
      return index === -1 ? Number.MAX_SAFE_INTEGER : index;
    };
    for (const [stopId] of [...calls.entries()].sort(
      (a, b) => rank(a[0]) - rank(b[0]) || b[1] - a[1] || a[0].localeCompare(b[0]),
    )) {
      const point = MAP_POINT(stopId);
      const stop = getStop(stopId);
      if (!point || !stop) continue;
      const legal = mapLabelPlacements(point, stop.name.replace(`${stop.city}, `, '')).filter((candidate) => {
        const { box } = candidate;
        /* A name pushed past the frame is worse than no name. */
        if (box.left < MAP_LABEL_PAD || box.right > 100 - MAP_LABEL_PAD) return false;
        if (labelled.some((other) => boxesClash(box, other.box))) return false;
        return !dots.some((dot) => boxHitsDot(box, dot));
      });
      if (!legal.length) continue;
      /* Of the positions that are legal, take the first no corridor runs through; if
         every one of them is crossed, take the one crossed least. */
      let placement = legal[0];
      let crossings = boxCrossesLine(placement.box, segments);
      for (const candidate of legal.slice(1)) {
        if (crossings === 0) break;
        const next = boxCrossesLine(candidate.box, segments);
        if (next < crossings) {
          placement = candidate;
          crossings = next;
        }
      }
      labelled.push({ ...placement, stopId });
      if (labelled.length === MAP_LABEL_LIMIT) break;
    }
    return { stopIds: [...calls.keys()], labelled, corridors };
  }, [lines, mode, priority, wantedStops]);

  const journeyPath = useMemo(() => {
    if (!requestedJourney) return null;
    const points = requestedJourney.legs
      .map((leg) => MAP_POINT(leg.fromStopId))
      .filter((point): point is { x: number; y: number } => Boolean(point));
    const last = requestedJourney.legs[requestedJourney.legs.length - 1];
    const end = last ? MAP_POINT(last.toStopId) : null;
    if (end) points.push(end);
    return points.length > 1 ? points : null;
  }, [requestedJourney]);

  const toPoints = (stopIds: string[]) =>
    stopIds
      .map((stopId) => MAP_POINT(stopId))
      .filter((point): point is { x: number; y: number } => Boolean(point))
      .map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`)
      .join(' ');

  return (
    <div className="stack-4">
      <div className="row-wrap chip-group chip-group--compact" role="group" aria-label={t('Map route filter')}>
        {/*
          **A mode's chip wears its mode's glyph, in its mode's colour.**

          These were six words beside a coloured dash. The dash was the route key — the map draws
          each mode in that colour — but a colour is not a name, and a traveller who cannot tell
          sage from butter had six identical marks to choose between. The glyph says *what* it is;
          the colour it is painted in still says *which line on the map*. The dash is gone because
          a chip with two marks before its word reads as two things.
        */}
        {MODE_CHOICES.map((choice) => (
          <Chip
            key={choice.value}
            selected={mode === choice.value}
            onClick={() => setMode(choice.value)}
            className={`map-mode-chip map-mode-chip--${choice.value}`}
            icon={choice.value === 'all' ? 'route' : MODE_ICON_NAME[choice.value]}
          >
            {t(choice.label)}
          </Chip>
        ))}
      </div>

      <svg
        className={`map-canvas${variant === 'widget' ? ' map-canvas--widget' : ' map-canvas--screen'}`}
        viewBox="0 0 100 100"
        role="img"
        aria-label={t('Network map: {scope}, {count} stops', { scope: t(mode === 'all' ? 'all routes' : '{mode} routes only', { mode: mode === 'all' ? '' : modeLabel(mode) }), count: drawn.stopIds.length })}
      >
        {(() => {
          return drawn.corridors.map((line) => {
            const points = toPoints(line.stops);
            return points ? <polyline key={line.id} className={`map-route map-route--${line.mode}`} points={points} /> : null;
          });
        })()}
        {journeyPath ? (
          <polyline
            className="map-route map-route--highlight"
            points={journeyPath.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' ')}
          />
        ) : null}
        {drawn.stopIds.map((stopId) => {
          const point = MAP_POINT(stopId);
          const stop = getStop(stopId);
          if (!point || !stop) return null;
          const classes = ['map-stop', highlighted.has(stopId) ? 'map-stop--selected' : ''].filter(Boolean).join(' ');
          return (
            <g
              key={stopId}
              className={classes}
              transform={`translate(${point.x.toFixed(2)} ${point.y.toFixed(2)})`}
              onClick={() => navigate(`/stops/${stopId}`)}
            >
              <title>{stop.name}</title>
              {/* A 44px finger cannot hit 2.9px. The dots grow to 1.6 / 2.4 canvas units and
                  the stylesheet stops overriding the radius (3.3, 5.3); the pointer still gets a
                  forgiving target from the wrapper's own padding below. */}
              <circle r={highlighted.has(stopId) ? 2.4 : 1.6} />
            </g>
          );
        })}
        {drawn.labelled.map(({ stopId, dx, dy, textAnchor }) => {
          const point = MAP_POINT(stopId);
          const stop = getStop(stopId);
          if (!point || !stop) return null;
          return (
            <g key={`label-${stopId}`} className="map-stop" transform={`translate(${point.x.toFixed(2)} ${point.y.toFixed(2)})`}>
              <text x={dx} y={dy} textAnchor={textAnchor}>
                {stop.name.replace(`${stop.city}, `, '')}
              </text>
            </g>
          );
        })}
      </svg>
      {variant === 'screen' ? (
        /*
         * The drawing is one `role="img"`: its 54 dots are presentational, so a keyboard could
         * never reach a stop and a screen reader was offered a sentence and nothing else (3.3).
         * A list is what a map cannot be — every stop on it, in the same order the drawing names
         * them, each one a real link. Closed by default, so the screen still opens on the map.
         */
        <details className="map-stops">
          <summary className="map-stops__summary">
            {t('All {count} stops on this map', { count: drawn.stopIds.length })}
          </summary>
          <ul className="map-stops__list">
            {[...drawn.stopIds]
              .map((id) => getStop(id))
              .filter((stop): stop is NonNullable<typeof stop> => Boolean(stop))
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((stop) => (
                <li key={stop.id}>
                  <Link to={`/stops/${stop.id}`} className="map-stops__link">
                    {stop.name}
                  </Link>
                </li>
              ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

/**
 * The map, in the home screen's own widget chrome — and **drawing the traveller's world**.
 *
 * The audit measured this as the largest card in the catalogue (563px) whose five labels were the
 * five busiest junctions in the demonstration network: Alkmaar, Zwolle, Den Haag Centraal,
 * Rotterdam Centraal, Eindhoven Centraal. None of them was the traveller's stop, none was near
 * them, and nothing on the drawing belonged to them — a picture of the country where the card
 * should be a picture of their journey. So the card now hands the map **its** stops to label and
 * highlight, in this order: the stops they hearted, then the stops nearest them (the device fix,
 * else the network estimate), and only then whatever is left. A traveller who has chosen nothing
 * and shared no location still gets the busiest junctions, because a map with no names is worse.
 *
 * The card's own size is the traveller's business (the corner offers three heights); the drawing
 * earns its height by being theirs.
 */
function MapWidget() {
  const t = useT();
  const { favouriteStopIds, nearestOrigin } = useApp();
  const near = useMemo(
    () =>
      nearestOrigin
        ? [...STOPS]
            .map((stop) => ({ id: stop.id, metres: distanceFromPosition(stop, nearestOrigin.lat, nearestOrigin.lon) }))
            .sort((a, b) => a.metres - b.metres)
            .map((entry) => entry.id)
        : [],
    [nearestOrigin],
  );
  /*
   * The names under the drawing, each one a way to its stop.
   *
   * "Your stops: Haarlem · Zaandam" was a sentence about the card's own subject, printed as
   * plain words: the drawing beside it answers "which", and no part of the line let you go and
   * look at one of them. The separator stays a separator, and every name is a word-link.
   */
  const names = (ids: string[]) =>
    ids.slice(0, 3).map((id, index) => (
      <span key={id}>
        {index ? ' · ' : ''}
        <StopLink stopId={id} />
      </span>
    ));
  /* Five, because five is what a 390px drawing can carry without two names colliding. */
  const priority = useMemo(
    () => [...favouriteStopIds, ...near].filter((id, index, list) => list.indexOf(id) === index).slice(0, 5),
    [favouriteStopIds, near],
  );
  return (
    <>
      <NetworkMap priority={priority} />
      {/*
        The names, in words, under the drawing.
        A label on the canvas is best-effort by geometry: a 29-unit-wide station name beside a
        junction ringed with dots has no legal spot at 390px, and the two busiest stations in this
        network — Amsterdam Centraal and Utrecht Centraal — have never carried one. So the card
        says whose world it is drawing in text that cannot collide: the stops you hearted, or,
        when there are none, the ones nearest you. The drawing marks them; this line names them.
      */}
      {favouriteStopIds.length ? (
        <p className="t-sm t-muted">
          {t('Your stops:')} {names(favouriteStopIds)}
        </p>
      ) : near.length ? (
        <p className="t-sm t-muted">
          {t('Near you:')} {names(near)}
        </p>
      ) : null}
    </>
  );
}

/**
 * **Your journeys** — saved journeys and saved searches, in one card.
 *
 * They were two widgets, both on by default, both empty on a fresh browser: 83px each of
 * *"Nothing favourited yet."* and *"Nothing kept yet. Keep a search from its results…"*,
 * explaining two halves of the same idea on the first screen. The audit's verdict was **merge**,
 * and it is right for a reason beyond pixels — they list the same thing, journeys you have run,
 * at two granularities:
 *
 *   • a **saved journey** is one result, with its own times and its heart on the results screen;
 *   • a **saved search** is the pair of stops, kept from the results bar to run again any day.
 *
 * So one card, two headings, and each row repeats its own thing (`Plan` re-plans the journey it
 * was saved from, `Repeat` runs the pair again). Both empty is one empty state explaining both,
 * rather than two cards each apologising for half of it. The rows per section are capped by tier
 * so the card stays a glance at every height, and the whole-list controls stay where they were:
 * a heart with a confirmation for a journey, a cross per saved search and one clear-all.
 *
 * The widget id is **`your-journeys`**; a stored layout naming either of the two old ids is folded
 * into it on load (`./defaults.ts`, `migrateHomeWidgets`), so nobody loses the card they had.
 */
function YourJourneysWidget() {
  const t = useT();
  const {
    savedJourneys,
    recentSearches,
    removeSavedJourney,
    removeRecentSearch,
    clearRecentSearches,
    startSearch,
    preferences,
  } = useApp();
  const navigate = useNavigate();
  const format = useFormat();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const pending = savedJourneys.find((entry) => entry.id === pendingId);
  const perSection = 2;
  const journeysShown = savedJourneys.slice(0, perSection);
  const searchesShown = recentSearches.slice(0, perSection);

  if (savedJourneys.length === 0 && recentSearches.length === 0) {
    return (
      <WidgetEmpty
        icon="bookmark"
        line={t('A saved search is a pair of stops you keep. A saved journey is one result with its own times.')}
        hint={t('Heart a result on the results screen, or save the search from the bar above the list.')}
      />
    );
  }

  return (
    <div className="stack-2">
      {savedJourneys.length ? (
        <div className="stack-1">
          <span className="field__label">{t('Saved journeys')}</span>
          <ul className="stack-1">
            {journeysShown.map((entry) => (
              <li key={entry.id} className="list-row list-row--static">
                <span className="stack-1 grow">
                  <span className="t-strong t-sm">
                    <QueryEnds query={entry.query} />
                  </span>
                  <span className="t-sm t-faint">
                    {format.date(entry.query.date, 'dayMonth')} · {format.time(entry.query.time)}
                  </span>
                </span>
                <Button
                  size="sm"
                  icon="route"
                  onClick={() => {
                    startSearch({ ...entry.query, preferences });
                    navigate('/results');
                  }}
                >
                  {t('Plan')}
                </Button>
                <IconButton
                  icon={pendingId === entry.id ? 'heart' : 'heartFilled'}
                  label={
                    pendingId === entry.id
                      ? `${endLabel(entry.query, 'from')} to ${endLabel(entry.query, 'to')} , waiting for confirmation`
                      : `Unfavourite ${endLabel(entry.query, 'from')} to ${endLabel(entry.query, 'to')}`
                  }
                  /* No `active`: this control chooses its own glyph — solid while the journey is
                     kept, outline while a removal is waiting for confirmation — and `active` would
                     send the outline one back through `pressedIcon` as a filled heart. */
                  aria-pressed={pendingId !== entry.id}
                  onClick={() => setPendingId(entry.id)}
                />
              </li>
            ))}
          </ul>
          <TrimNote total={savedJourneys.length} shown={journeysShown.length} />
        </div>
      ) : null}

      {recentSearches.length ? (
        <div className="stack-1">
          <span className="field__label">{t('Saved searches')}</span>
          <ul className="stack-1">
            {searchesShown.map((entry) => (
              <li key={entry.id} className="list-row list-row--static">
                <span className="stack-1 grow">
                  <span className="t-strong t-sm">
                    <QueryEnds query={entry.query} />
                  </span>
                  <span className="t-sm t-faint">
                    {format.date(entry.query.date, 'dayMonth')} · {format.time(entry.query.time)}
                  </span>
                </span>
                <Button
                  size="sm"
                  icon="search"
                  onClick={() => {
                    startSearch({ ...entry.query, preferences });
                    navigate('/results');
                  }}
                >
                  {t('Repeat')}
                </Button>
                <IconButton
                  icon="close"
                  label={`Delete ${endLabel(entry.query, 'from')} to ${endLabel(entry.query, 'to')} from your saved searches`}
                  onClick={() => removeRecentSearch(entry.id)}
                />
              </li>
            ))}
          </ul>
          <div className="row-wrap">
            <Button size="sm" variant="ghost" icon="trash" onClick={() => setConfirmClear(true)}>
              {t('Delete all saved searches')}
            </Button>
            <span className="t-sm t-faint">
              {t('{count} stored in this browser', { count: recentSearches.length })}
            </span>
          </div>
          <TrimNote total={recentSearches.length} shown={searchesShown.length} />
        </div>
      ) : null}

      <Dialog
        open={Boolean(pending)}
        title={t('Unfavourite this journey?')}
        description={t('It disappears from this widget; the search itself is untouched.')}
        onClose={() => setPendingId(null)}
        footer={
          <>
            <Button
              variant="accent"
              icon="heart"
              onClick={() => {
                if (pendingId) removeSavedJourney(pendingId);
                setPendingId(null);
              }}
            >
              {t('Yes, unfavourite it')}
            </Button>
            <Button variant="ghost" onClick={() => setPendingId(null)}>
              {t('Cancel')}
            </Button>
          </>
        }
      >
        {/*
          Which journey. Two saved journeys on the same pair of stops — today 08:30 and 18:00 — are
          an ordinary pair, and both questions used to read exactly the same, so the sheet asked
          the traveller to confirm removing a journey it never named (25.2). The times it was saved
          with are the fact that tells the two rows apart.
        */}
        {pending ? (
          <div className="stack-1">
            <p className="t-sm">
              <QueryEnds query={pending.query} />
            </p>
            <p className="t-sm t-muted">
              {format.date(pending.query.date, 'dayMonth')} · {format.time(pending.journey.departure)} →{' '}
              {format.time(pending.journey.arrival)}
            </p>
          </div>
        ) : null}
      </Dialog>

      <Dialog
        open={confirmClear}
        title={t('Delete all saved searches?')}
        description={t('Every saved search is removed from this browser. Pins, saved journeys and preferences stay as they are.')}
        onClose={() => setConfirmClear(false)}
        footer={
          <>
            <Button
              variant="accent"
              icon="trash"
              onClick={() => {
                clearRecentSearches();
                setConfirmClear(false);
              }}
            >
              {t('Yes, delete them')}
            </Button>
            <Button variant="ghost" onClick={() => setConfirmClear(false)}>
              {t('Cancel')}
            </Button>
          </>
        }
      >
        <p className="t-sm">
          {/* One saved search is the commonest case, and "1 saved searches" was the one wording
              in the sheet that named the number (26.2). */}
          {recentSearches.length === 1
            ? t('1 saved search will be removed.')
            : t('{count} saved searches will be removed.', { count: recentSearches.length })}
        </p>
      </Dialog>
    </div>
  );
}

function NextDeparturesWidget({ binding = 'next-departures' }: { binding?: string }) {
  const { widgetStations, setWidgetStation } = useApp();
  const format = useFormat();
  const t = useT();

  const bound = getStop(widgetStations[binding] ?? undefined);
  /* A stored id whose stop has a board, or nothing. An address bound by hand in a browser's
     storage is not a card that can be drawn, so it counts as unbound and asks again. */
  const stop = bound && hasBoard(bound) ? bound : undefined;
  const stopId = stop?.id ?? null;
  const minutes = useClockMinutes();
  const rows = 4;
  const board = useMemo(
    () => (stopId ? boardForStop(stopId, { fromMinutes: minutes, limit: rows }) : []),
    [stopId, minutes, rows],
  );

  if (!stopId) {
    return (
      <div className="stack-2">
        <p className="t-sm t-muted">
          {t('Pick one station for this card. It keeps showing it, so a glance never has to search.')}
        </p>
        <StopCombobox
          /*
           * The home screen already puts `widget-next-departures` on the section around this body,
           * so the field takes a name of its own.
           *
           * The visible label is hidden because the sentence above it already says what this field
           * is for, and the field's name is not lost with it: `StopCombobox` falls back to
           * `aria-label` when `hideLabel` is set.
           */
          id={`${binding}-stop`}
          label={t('Station for this card')}
          hideLabel
          value={null}
          onSelect={(next) => {
            if (next) setWidgetStation(binding, next.id);
          }}
          placeholder={t('Search a station or stop')}
          filter={hasBoard}
          emptyHint={t('Only a station or stop has a departure board.')}
        />
      </div>
    );
  }

  return (
    <div className="stack-2">
      {/* The station this card is tied to, as the way to its page — the card names one station
          and never offered a way to look at it. */}
      <span className="t-sm t-muted">
        <StopLink stopId={stopId} /> · {t('from {time}', { time: format.time(minutes) })}
      </span>
      <BoardList departures={board} limit={rows} />
      {/* A control, not a line of muted text: the same action the stop page offers wears the
          same words and the same board glyph wherever it appears. */}
      <Link to={`/departures?stop=${stopId}`} className="btn btn--sm">
        <Icon name="board" size={15} />
        {t('Open the full board')}
      </Link>
    </div>
  );
}

/**
 * Alerts that touch **the journeys you kept** — not the network's news.
 *
 * This card used to be the national picture: "2 major / 5 disruptions / 7 information" and the
 * first three alerts in the list, which is what the Disruptions page shows in full and what the
 * dock's own badge already counts. The audit's verdict was blunt: *keep it only as the personal
 * version*. So it now answers the question a commuter actually has — **is my journey affected?**
 * — by asking the engine's own rule for every leg of every saved journey
 * (`disruptionForLeg`: this line, through these stops), which is data the app already computes and
 * had never put on a home screen.
 *
 * A journey with no alert is not a journey with nothing to say, so the card also counts what is
 * *going well*: it says how many of your journeys are clear. Nothing is invented — an alert exists
 * only if the disruption data names the line and one of the leg's stops.
 */
function AlertsOnSavedWidget() {
  const t = useT();
  const { savedJourneys } = useApp();
  const rows = 3;
  const hits = useMemo(() => {
    const seen = new Set<string>();
    const out: { id: string; title: string; journey: string }[] = [];
    for (const entry of savedJourneys) {
      const name = `${endLabel(entry.query, 'from')} → ${endLabel(entry.query, 'to')}`;
      for (const leg of entry.journey.legs) {
        const alert = disruptionForLeg(leg.lineId, leg.fromStopId, leg.toStopId);
        if (!alert || seen.has(alert.id)) continue;
        seen.add(alert.id);
        out.push({ id: alert.id, title: alertWords(t, alert).title, journey: name });
      }
    }
    return out;
  }, [savedJourneys]);

  if (savedJourneys.length === 0) {
    return (
      <WidgetEmpty
        icon="alert"
        line={t('Heart a journey and any alert that touches it shows up here.')}
        hint={t('A saved journey is one result on the results screen, with its own times.')}
      />
    );
  }
  if (hits.length === 0) {
    return (
      <p className="t-sm t-muted">
        {t('No alerts touch the journeys you kept. All {count} are running as planned.', {
          count: savedJourneys.length,
        })}
      </p>
    );
  }
  return (
    <>
      <ul className="stack-1">
        {hits.slice(0, rows).map((hit) => (
          <li key={hit.id} className="stack-1">
            <Link to={`/disruptions/${hit.id}`} className="row t-sm t-strong">
              <Icon name="alert" size={14} />
              {hit.title}
            </Link>
            {/* Which journey of yours it is about — the half the old card could never say. */}
            <span className="t-sm t-faint">{hit.journey}</span>
          </li>
        ))}
      </ul>
      <TrimNote total={hits.length} shown={Math.min(hits.length, rows)} />
      <Link to="/disruptions" className="t-sm t-muted tap-target">
        {t('All alerts')}
      </Link>
    </>
  );
}

/**
 * Re-run the search you have on screen, from now.
 *
 * It used to lead with a large clock — the operating system's own clock face, in a 188px card, at
 * the top of the home screen — and the audit's line was that a clock is already drawn above the
 * traveller's thumb. The clock is gone; the one thing only this app can do with the current time
 * is kept: take the pair you are looking at and ask it again from this minute, which is what you
 * want when a timetable has moved on under a search you left open. Nothing else is on the card, so
 * it is small at every tier and there is nothing left to shrink.
 */
function RightNowWidget() {
  const t = useT();
  const minutes = useClockMinutes();
  const { search, startSearch, preferences } = useApp();
  const navigate = useNavigate();
  return (
    <div className="stack-2">
      {/* Drawn only when there is a search to re-run. On an empty home it rendered and did nothing
          at all when pressed — no navigation, no overlay, no text change (1.2). */}
      {search ? (
        <Button
          icon="clock"
          onClick={() => {
            startSearch({ ...search.query, date: new Date().toISOString().slice(0, 10), time: minutes, preferences });
            navigate('/results');
          }}
        >
          {t('Re-run my search from now')}
        </Button>
      ) : null}
      <span className="t-sm t-faint">
        {search
          ? t('{from} to {to}, starting at this minute.', {
              from: endLabel(search.query, 'from'),
              to: endLabel(search.query, 'to'),
            })
          : t('Nothing to re-run yet. Plan a journey first.')}
      </span>
    </div>
  );
}

/**
 * Find a stop — the field, and nothing else.
 *
 * It carried three chips of the busiest stops in the demonstration network, labelled a *sample*,
 * which the audit cut for exactly the reason the label existed: they are a fact about demo data
 * that no traveller has a relationship with, and they contradict this project's own rule that
 * nothing suggests a stop the traveller did not choose. The field is the widget; it opens the
 * planner's own picker, which already knows their favourites, their recent stops and — when
 * they allow it — where they are.
 */
function StopSearchWidget() {
  const navigate = useNavigate();
  const t = useT();
  const [value, setValue] = useState<Stop | null>(null);
  return (
    <StopCombobox
      /* Not `widget-stop-search`: that is the widget section's own id, and the duplicate made
         `getElementById` return the section, so the label pointed at nothing and the field had no
         name (32.4). */
      id="widget-stop-search-field"
      label={t('Find a stop')}
      value={value}
      onSelect={(stop) => {
        setValue(stop);
        if (stop) navigate(`/stops/${stop.id}`);
      }}
      placeholder={t('Search {count} stations, stops and landmarks', { count: STOPS.length })}
    />
  );
}

/**
 * The stops you hearted, one link per row.
 *
 * Each row used to carry three controls — the name, **Plan from here** and a heart — inside a card
 * whose whole premise is that a list of your own stops *is* the shortcut: twelve controls in 327px
 * for a list of four names. The audit's trim: the name is the row, tapping it opens the stop, and
 * the two actions that were repeated per row live where they always have — the stop page has the
 * heart, and the planner is one tap away in the dock. The list is shorter, quieter, and every row
 * is still one tap to a stop.
 */
function PinnedStopsWidget() {
  const t = useT();
  const { favouriteStopIds } = useApp();
  const shown = favouriteStopIds.slice(0, 4);
  if (favouriteStopIds.length === 0) {
    return <WidgetEmpty icon="heart" line={t('Heart a stop from its page and it is listed here for one-tap planning.')} />;
  }
  return (
    <>
      <ul className="stack-1">
        {shown.map((stopId) => (
          <li key={stopId} className="list-row list-row--static">
            <Link to={`/stops/${stopId}`} className="t-sm t-strong grow">
              {stopLabel(stopId)}
            </Link>
            <Icon name="arrowRight" size={15} className="t-faint" />
          </li>
        ))}
      </ul>
      <TrimNote total={favouriteStopIds.length} shown={shown.length} />
    </>
  );
}

function AlertsAtPinsWidget() {
  const t = useT();
  const { favouriteStopIds } = useApp();
  const alerts = favouriteStopIds.flatMap((stopId) => disruptionsForStop(stopId));
  const unique = alerts.filter((alert, index, list) => list.findIndex((item) => item.id === alert.id) === index);
  const rows = 3;
  if (favouriteStopIds.length === 0) {
    return <WidgetEmpty icon="alert" line={t('Heart a stop and any alert affecting it shows up here.')} />;
  }
  return (
    <>
      {unique.length === 0 ? (
        <p className="t-sm t-muted">{t('No alerts affect your favourite stops right now.')}</p>
      ) : (
        <>
          <ul className="stack-1">
            {unique.slice(0, rows).map((alert) => (
              <li key={alert.id}>
                <Link to={`/disruptions/${alert.id}`} className="row t-sm">
                  <Icon name="alert" size={14} />
                  {alertWords(t, alert).title}
                </Link>
              </li>
            ))}
          </ul>
          <TrimNote total={unique.length} shown={Math.min(unique.length, rows)} />
        </>
      )}
      {/* The way out the audit asked for: a personal card must not be a dead end when the
          traveller wants the rest of the picture. */}
      <Link to="/disruptions" className="t-sm t-muted tap-target">
        {t('All alerts')}
      </Link>
    </>
  );
}

/* ---------------------------------------------------- the six the audit asked for */

/**
 * **Your commute** — the saved journey you take most, counted down rather than listed.
 *
 * Built only from what the app already computes: the journey you hearted (its query, its walk to
 * the station) and the departure board at its origin, read at the same minute every other card
 * reads (`useClockMinute`). The one thing this card can say that the next-departures card cannot is
 * **when to leave** — the train's time minus the walk the planner already measured. Nothing is
 * invented: with no saved journey the card asks for one, and with no service left in the window it
 * says so rather than showing a time from yesterday.
 */
function CommuteWidget() {
  const t = useT();
  const format = useFormat();
  const minutes = useClockMinutes();
  const rows = 2;
  const { savedJourneys, preferences, startSearch } = useApp();
  const navigate = useNavigate();

  const entries = useMemo(
    () =>
      savedJourneys.slice(0, rows).map((entry) => {
        const ride = entry.journey.legs.find((leg) => leg.mode !== 'walk' && leg.mode !== 'bike');
        const board = boardForStop(entry.query.fromStopId, { fromMinutes: minutes, limit: 40 });
        const next = ride ? board.find((departure) => departure.lineId === ride.lineId) : board[0];
        return { entry, next };
      }),
    [savedJourneys, rows, minutes],
  );

  if (savedJourneys.length === 0) {
    return (
      <WidgetEmpty
        icon="route"
        line={t('Heart the journey you take every morning and this card counts down to it.')}
        hint={t('A saved journey is one result on the results screen, with its own times.')}
      />
    );
  }

  return (
    <div className="stack-2">
      <ul className="stack-1">
        {entries.map(({ entry, next }) => {
          const leaveIn = next ? next.expected - minutes - entry.journey.walkMinutes : null;
          return (
            <li key={entry.id} className="list-row list-row--static">
              <span className="stack-1 grow">
                <span className="t-strong t-sm">
                  <QueryEnds query={entry.query} />
                </span>
                <span className="t-sm t-faint">
                  {next
                    ? leaveIn !== null && leaveIn > 0
                      ? t('Next {time} · leave in {minutes} min', {
                          time: format.time(next.expected),
                          minutes: leaveIn,
                        })
                      : t('Next {time} · leave now', { time: format.time(next.expected) })
                    : t('No service left in this window today.')}
                </span>
              </span>
              <Button
                size="sm"
                icon="route"
                onClick={() => {
                  startSearch({ ...entry.query, preferences });
                  navigate('/results');
                }}
              >
                {t('Plan')}
              </Button>
            </li>
          );
        })}
      </ul>
      <TrimNote total={savedJourneys.length} shown={entries.length} />
    </div>
  );
}

/**
 * **Stops near you** — a few stops and when the next thing leaves each of them.
 *
 * The audit's honest replacement for a map of the whole country: the traveller walking to a stop
 * wants the stop, how far it is, and the next departure — three facts the app already has
 * (`nearestOrigin`, `distanceFromPosition`, `boardForStop`). Places without a board are left out,
 * the same `hasBoard` rule every other surface uses, because "180 m" to a museum answers a
 * question nobody asked at a bus stop.
 */
function NearbyStopsWidget() {
  const t = useT();
  const format = useFormat();
  const minutes = useClockMinutes();
  const rows = 3;
  const { nearestOrigin } = useApp();

  const near = useMemo(() => {
    if (!nearestOrigin) return [];
    const { lat, lon } = nearestOrigin;
    return STOPS.map((stop) => ({ stop, metres: distanceFromPosition(stop, lat, lon) }))
      .filter((entry) => hasBoard(entry.stop))
      .sort((a, b) => a.metres - b.metres)
      .slice(0, rows)
      .map((entry) => ({
        ...entry,
        next: boardForStop(entry.stop.id, { fromMinutes: minutes, limit: 1 })[0],
      }));
  }, [nearestOrigin, rows, minutes]);

  if (!nearestOrigin) {
    return (
      <WidgetEmpty
        icon="location"
        line={t('Turn on location and the stops around you appear here.')}
        hint={t('Settings can turn location on; the card never invents where you are.')}
      />
    );
  }

  return (
    <div className="stack-2">
      <span className="field__label">
        {t(nearestOrigin.source === 'device' ? 'Closest to your device location' : 'Closest to an approximate IP location')}
      </span>
      <ul className="stack-1">
        {near.map(({ stop, metres, next }) => (
          <li key={stop.id} className="list-row list-row--static">
            <span className="stack-1 grow">
              <Link to={`/stops/${stop.id}`} className="t-strong t-sm tap-target">
                {customStopName(stop.id) ?? stop.name}
              </Link>
              <span className="t-sm t-faint">
                {formatDistance(metres)} ·{' '}
                {next ? t('next at {time}', { time: format.time(next.expected) }) : t('no departure in this window')}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * **Facilities at your stations** — the audit called it *Accessibility at your stations* and built
 * it from `stop.accessibility`.
 *
 * It is built from `facilities` instead, and the name says facilities, because of a later order than
 * the audit: *"get rid of ALL accessibility descriptions EVERYWHERE"* — the step-free, lift, tactile
 * paving and low-floor claims were removed from every surface that drew one, on the grounds that the
 * app does not know the traveller and should not promise them a step-free journey. A widget is not
 * exempt from an order about every surface. What is left is the fact the data really holds — the
 * facilities a stop lists — per stop the traveller hearted.
 */
function FacilitiesWidget() {
  const t = useT();
  const rows = 3;
  const { favouriteStopIds } = useApp();
  const stops = favouriteStopIds
    .map((stopId) => getStop(stopId))
    .filter((stop): stop is Stop => Boolean(stop))
    .slice(0, rows);

  if (stops.length === 0) {
    return (
      <WidgetEmpty
        icon="heart"
        line={t('Heart a stop and its facilities are listed here.')}
        hint={t('The heart on a stop card is the one that fills this card.')}
      />
    );
  }

  return (
    <div className="stack-2">
      <ul className="stack-1">
        {stops.map((stop) => (
          <li key={stop.id} className="stack-1">
            <Link to={`/stops/${stop.id}`} className="t-strong t-sm tap-target">
              {customStopName(stop.id) ?? stop.name}
            </Link>
            <span className="t-sm t-faint">
              {stop.facilities.length
                ? stop.facilities.map((facility) => t(facility)).join(' · ')
                : t('No facilities listed for this stop.')}
            </span>
          </li>
        ))}
      </ul>
      <TrimNote total={favouriteStopIds.length} shown={stops.length} />
    </div>
  );
}

/**
 * **What it costs** — the fare next to the time, for the search on screen or the journeys you kept.
 *
 * Money is the second question after time, and the engine already ranks on both (`sortJourneys` has
 * a cheapest mode and a fastest one). The card does not re-plan anything: it reads the journeys the
 * app is already holding and names the two ends of the trade-off — the quickest option and the
 * cheapest one, with their own times and fares.
 */
function CostWidget() {
  const t = useT();
  const format = useFormat();
  const { journeys, savedJourneys, search } = useApp();
  const options = journeys.length ? journeys : savedJourneys.map((entry) => entry.journey);

  const fastest = options.reduce<(typeof options)[number] | null>(
    (best, journey) => (!best || journey.durationMinutes < best.durationMinutes ? journey : best),
    null,
  );
  const cheapest = options.reduce<(typeof options)[number] | null>(
    (best, journey) => (!best || journey.fare.eur < best.fare.eur ? journey : best),
    null,
  );

  if (!fastest || !cheapest) {
    return (
      <WidgetEmpty
        icon="ticket"
        line={t('Plan a journey and its fare appears here beside its time.')}
        hint={t('Every result already carries a price; this card just puts the two next to each other.')}
      />
    );
  }

  const row = (label: string, journey: (typeof options)[number]) => (
    <li className="list-row list-row--static">
      <span className="stack-1 grow">
        <span className="t-strong t-sm">{label}</span>
        <span className="t-sm t-faint">
          {format.time(journey.departure)} → {format.time(journey.arrival)} ·{' '}
          {format.duration(journey.durationMinutes)}
        </span>
      </span>
      <span className="t-strong">€{journey.fare.eur.toFixed(2)}</span>
    </li>
  );

  return (
    <div className="stack-2">
      {search ? <span className="field__label">{t('This search')}</span> : <span className="field__label">{t('Your saved journeys')}</span>}
      <ul className="stack-1">
        {row(t('Fastest'), fastest)}
        {cheapest.id !== fastest.id ? row(t('Cheapest'), cheapest) : null}
      </ul>
    </div>
  );
}

/**
 * **Last service home** — the one timetable fact people look up late.
 *
 * The board generator runs deliberately past midnight (to 27:00), so "the last one" is a real
 * answer rather than a guess: the card asks the origin stop for its late-evening board and names
 * the last three services still running. Nothing is invented, and when the data has nothing left it
 * says so.
 */
function LastServiceWidget() {
  const t = useT();
  const format = useFormat();
  const minutes = useClockMinutes();
  const rows = 3;
  const { savedJourneys } = useApp();
  const entry = savedJourneys[0];

  const late = useMemo(() => {
    if (!entry) return [];
    return boardForStop(entry.query.fromStopId, { fromMinutes: 1380, limit: 60 })
      .filter((departure) => departure.expected <= 1440 + 180)
      .sort((a, b) => a.expected - b.expected)
      .slice(-rows)
      .reverse();
  }, [entry, rows]);

  if (!entry) {
    return (
      <WidgetEmpty
        icon="clock"
        line={t('Heart the journey home and this card knows its last service.')}
        hint={t('The last departures are read from the same board the departure screen draws.')}
      />
    );
  }

  return (
    <div className="stack-2">
      <span className="field__label">
        {t('Last services from')} <StopLink stopId={entry.query.fromStopId} />
      </span>
      {late.length ? (
        <ul className="stack-1">
          {late.map((departure) => (
            <li key={departure.id} className="list-row list-row--static">
              <span className="t-strong t-sm grow">
                {departure.destinationLabel}
                {departure.lineNumber ? ` · ${departure.lineNumber}` : ''}
              </span>
              <span className="t-mono-num">{format.time(departure.expected)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="t-sm t-muted">{t('No late service from this stop in the data.')}</p>
      )}
      <span className="t-sm t-faint">{t('Read at {time}, the same minute the board uses.', { time: format.time(minutes) })}</span>
    </div>
  );
}

/** The second tied board: the same card, bound to its own station. */
function SecondBoardWidget() {
  return <NextDeparturesWidget binding="second-board" />;
}

/* --------------------------------------------------------------- the catalogue */

const DEFINITIONS: WidgetDefinition[] = [
  {
    id: 'planner',
    title: 'Plan a journey',
    description: 'Where are you going? Departing today, right now.',
    category: 'Plan',
    span: 12,
    essential: true,
    /* A form: two stop rows. Below a tablet it is the whole point of the screen, so it keeps the
       full width. */
    Body: PlannerWidget,
  },
  {
    id: 'next-departures',
    title: 'Next departures',
    description: 'The next departures from the station this card is tied to.',
    category: 'Travel information',
    span: 6,
    essential: true,
    Body: NextDeparturesWidget,
  },
  {
    id: 'pinned-stops',
    title: 'Favourite stops',
    description: 'The stops you hearted, one tap each.',
    category: 'Yours',
    /*
     * Half the screen, so the default row is exactly two cards.
     *
     * It was four columns beside a six-column "Next departures", and 6 + 4 is ten of twelve: the
     * row ended with two columns of empty page down the right-hand side at every desktop width,
     * which reads as a card that failed to load rather than as a layout. A list of a few stops is
     * happy at half the page — its rows are short — and 6 + 6 fills the row exactly.
     */
    span: 6,
    essential: true,
    Body: PinnedStopsWidget,
  },
  {
    id: 'your-journeys',
    title: 'Your journeys',
    description: 'The journeys you saved and the searches you kept, ready to run again.',
    category: 'Yours',
    span: 6,
    Body: YourJourneysWidget,
  },
  {
    id: 'alerts',
    title: 'Alerts on your journeys',
    description: 'Only the alerts that touch a journey you saved.',
    category: 'Travel information',
    span: 6,
    Body: AlertsOnSavedWidget,
  },
  {
    id: 'alerts-at-pins',
    title: 'Alerts at your favourite stops',
    description: 'Only the alerts that touch stops you hearted.',
    category: 'Travel information',
    span: 6,
    Body: AlertsAtPinsWidget,
  },
  {
    id: 'right-now',
    title: 'Re-run from now',
    description: 'Run the search you are looking at again, starting at this minute.',
    category: 'Plan',
    span: 4,
    Body: RightNowWidget,
  },
  {
    id: 'stop-search',
    title: 'Find a stop',
    description: 'Search every stop from here.',
    category: 'Travel information',
    span: 4,
    Body: StopSearchWidget,
  },
  {
    id: 'commute',
    title: 'Your commute',
    description: 'The journey you take most, counted down: the next service and when to leave.',
    category: 'Yours',
    span: 6,
    Body: CommuteWidget,
  },
  {
    id: 'nearby-stops',
    title: 'Stops near you',
    description: 'The closest stops that have a board, how far they are, and when the next one leaves.',
    category: 'Travel information',
    span: 4,
    Body: NearbyStopsWidget,
  },
  {
    id: 'facilities',
    title: 'Facilities at your stations',
    description: 'What each stop you hearted lists: facilities, bicycle parking, OV-fiets.',
    category: 'Yours',
    span: 4,
    Body: FacilitiesWidget,
  },
  {
    id: 'cost',
    title: 'What it costs',
    description: 'The quickest option and the cheapest one, with their fares, side by side.',
    category: 'Plan',
    span: 4,
    Body: CostWidget,
  },
  {
    id: 'last-service',
    title: 'Last service home',
    description: 'The last departures from the stop your saved journey starts at.',
    category: 'Travel information',
    span: 4,
    Body: LastServiceWidget,
  },
  {
    id: 'second-board',
    title: 'A second departure board',
    description: 'Another station\u2019s next departures, beside the first card.',
    category: 'Travel information',
    span: 6,
    Body: SecondBoardWidget,
  },
  {
    id: 'map',
    title: 'Network map',
    description: 'Every route, with your own stops named and picked out.',
    category: 'Plan',
    /*
     * Half the page — not eight columns.
     *
     * Eight plus six is fourteen, so the **commonest cards in the catalogue could never sit beside
     * the map**: a half-width card dropped to the next row and left the four columns next to the
     * map standing empty, which is the complaint that produced this. Six is the width that shares a
     * row with another six, and the drawing is landscape on a card this size (16:9 on a wide
     * screen), so nothing is lost by giving the map less of the page: at eight columns it was
     * mostly water and margin.
     */
    span: 6,
    Body: MapWidget,
  },
];

/** Every widget, with the required/default flags applied from `./defaults`. */
export const WIDGETS: WidgetDefinition[] = DEFINITIONS.map((widget) => ({
  ...widget,
  required: REQUIRED_WIDGETS.includes(widget.id),
  defaultOn: DEFAULT_HOME_WIDGETS.includes(widget.id),
})).sort(
  (a, b) =>
    Number(Boolean(b.defaultOn)) - Number(Boolean(a.defaultOn)) ||
    WIDGET_CATEGORIES.indexOf(a.category) - WIDGET_CATEGORIES.indexOf(b.category),
);

export function widgetById(id: string): WidgetDefinition | undefined {
  return WIDGETS.find((widget) => widget.id === id);
}
