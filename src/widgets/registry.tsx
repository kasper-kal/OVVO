import type { ComponentType } from 'react';
import { useMemo, useState } from 'react';
import { DEFAULT_HOME_WIDGETS, REQUIRED_WIDGETS } from './defaults';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../state/AppState';
import { SearchForm } from '../components/journey/SearchForm';
import { StopCombobox } from '../components/journey/StopCombobox';
import { BoardList } from '../components/stops/BoardList';
import { Button, Chip, Dialog, IconButton, Pill } from '../components/ui/primitives';
import { Icon, ModeIcon } from '../components/ui/Icons';
import { STOPS, getStop, hasBoard, stopLabel } from '../data/stops';
import { NETWORK, linesAtStop } from '../data/network';
import { MAP_POINT, mapCorridors } from '../data/map';
import { OPERATORS, operatorName } from '../data/operators';
import { DISRUPTIONS, disruptionsForStop } from '../data/disruptions';
import { boardForStop, busiestStops } from '../data/departures';
import { describePreferences, modeLabel } from '../data/preferences';
import { endLabel } from '../data/journeyEngine';
import { useMinuteNow } from '../lib/useMinuteNow';
import { useFormat } from '../lib/useFormat';
import { useT } from '../lib/useT';
import type { PublicMode, Stop, TravelMode } from '../data/types';
import { plural } from '../lib/format';

/**
 * Home-screen widget catalogue.
 *
 * Widgets are declared here and rendered by HomePage inside a shared frame, so
 * adding one to the home screen is a matter of listing its id. Only the four
 * `defaultOn` widgets are shown on a fresh install; the rest are available from
 * "Add widget".
 */
export type WidgetSpan = 4 | 6 | 8 | 12;

export const WIDGET_CATEGORIES: WidgetDefinition['category'][] = [
  'Plan',
  'Travel information',
  'Yours',
  'About',
];

export interface WidgetDefinition {
  id: string;
  title: string;
  description: string;
  category: 'Plan' | 'Travel information' | 'Yours' | 'About';
  span: WidgetSpan;
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

/** A handful of names: a label per stop is unreadable. */
const MAP_LABEL_LIMIT = 5;
/** The label type is the stylesheet's `.map-canvas--widget .map-stop text` size, in canvas units. */
const MAP_LABEL_FONT = 2.6;
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
export function NetworkMap() {
  const t = useT();
  const [params] = useSearchParams();
  const [mode, setMode] = useState<'all' | PublicMode>('all');
  const navigate = useNavigate();
  const { findJourney } = useApp();
  const requestedStop = getStop(params.get('stop') ?? undefined);
  const requestedJourney = findJourney(params.get('journey') ?? undefined);

  const lines = useMemo(() => NETWORK.filter((line) => mode === 'all' || line.mode === mode), [mode]);

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
    for (const [stopId] of [...calls.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))) {
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
  }, [lines, mode]);

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

  const highlighted = new Set<string>();
  if (requestedStop) highlighted.add(requestedStop.id);
  if (requestedJourney) {
    requestedJourney.legs.forEach((leg) => {
      highlighted.add(leg.fromStopId);
      highlighted.add(leg.toStopId);
    });
  }

  const toPoints = (stopIds: string[]) =>
    stopIds
      .map((stopId) => MAP_POINT(stopId))
      .filter((point): point is { x: number; y: number } => Boolean(point))
      .map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`)
      .join(' ');

  return (
    <div className="stack-4">
      <div className="row-wrap chip-group chip-group--compact" role="group" aria-label={t('Map route filter')}>
        {MODE_CHOICES.map((choice) => (
          <Chip key={choice.value} selected={mode === choice.value} onClick={() => setMode(choice.value)}>
            <span className={`map-legend__swatch map-legend__swatch--${choice.value}`} aria-hidden="true" />
            {t(choice.label)}
          </Chip>
        ))}
      </div>

      <svg
        className="map-canvas map-canvas--widget"
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
              <circle r={highlighted.has(stopId) ? 1.9 : 1.1} />
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
    </div>
  );
}

/** The same map, in the home screen's own widget chrome. */
function MapWidget() {
  return <NetworkMap />;
}

/**
 * Favourited journeys, managed inside the widget: a filled heart per journey
 * un-fills and asks for confirmation before the journey is removed.
 */
function FavouritedJourneysWidget() {
  const t = useT();
  const { savedJourneys, startSearch, preferences, removeSavedJourney } = useApp();
  const navigate = useNavigate();
  const format = useFormat();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const pending = savedJourneys.find((entry) => entry.id === pendingId);

  return (
    <div className="stack-2">
      {savedJourneys.length === 0 ? (
        <p className="t-sm t-faint">{t('Nothing favourited yet.')}</p>
      ) : (
        <ul className="stack-1">
          {savedJourneys.map((entry) => (
            <li key={entry.id} className="list-row list-row--static">
              <span className="stack-1 grow">
                <span className="t-strong t-sm">
                  {endLabel(entry.query, 'from')} <Icon name="arrowRight" size={13} />{' '}
                  {endLabel(entry.query, 'to')}
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
                Plan
              </Button>
              <IconButton
                icon={pendingId === entry.id ? 'heart' : 'heartFilled'}
                label={
                  pendingId === entry.id
                    ? `${endLabel(entry.query, 'from')} to ${endLabel(entry.query, 'to')} — waiting for confirmation`
                    : `Unfavourite ${endLabel(entry.query, 'from')} to ${endLabel(entry.query, 'to')}`
                }
                active
                aria-pressed={pendingId !== entry.id}
                onClick={() => setPendingId(entry.id)}
              />
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={Boolean(pending)}
        title="Unfavourite this journey?"
        description="Are you sure you want to unfavourite this journey? It disappears from this widget; the search itself is untouched."
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
              Yes, unfavourite it
            </Button>
            <Button variant="ghost" onClick={() => setPendingId(null)}>
              Cancel
            </Button>
          </>
        }
      >
        <p className="t-sm">
          {pending
            ? `${endLabel(pending.query, 'from')} → ${endLabel(pending.query, 'to')}`
            : ''}
        </p>
      </Dialog>
    </div>
  );
}

/**
 * The searches the traveller kept, managed inside the widget: a cross removes one, and a
 * single button forgets them all after a confirmation.
 *
 * Nothing lands here on its own. Searching used to write every search — and every re-plan —
 * into this browser's history, so the widget filled with journeys nobody had asked to keep.
 * A search is kept from the results screen, where the traveller can see what they are keeping.
 */
function RecentSearchesWidget() {
  const t = useT();
  const { recentSearches, removeRecentSearch, clearRecentSearches, startSearch, preferences } = useApp();
  const navigate = useNavigate();
  const format = useFormat();
  const [confirmClear, setConfirmClear] = useState(false);

  return (
    <div className="stack-2">
      {recentSearches.length === 0 ? (
        <p className="t-sm t-faint">{t('Nothing kept yet — keep a search from its results to put it here.')}</p>
      ) : (
        <>
          <ul className="stack-1">
            {recentSearches.map((entry) => (
              <li key={entry.id} className="list-row list-row--static">
                <span className="stack-1 grow">
                  <span className="t-strong t-sm">
                    {endLabel(entry.query, 'from')} <Icon name="arrowRight" size={13} />{' '}
                    {endLabel(entry.query, 'to')}
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
                  Repeat
                </Button>
                <IconButton
                  icon="close"
                  label={`Delete ${endLabel(entry.query, 'from')} to ${endLabel(entry.query, 'to')} from recent searches`}
                  onClick={() => removeRecentSearch(entry.id)}
                />
              </li>
            ))}
          </ul>
          <div className="row-wrap">
            <Button size="sm" variant="ghost" icon="trash" onClick={() => setConfirmClear(true)}>
              Delete all recent searches
            </Button>
            <span className="t-sm t-faint">{recentSearches.length} stored in this browser</span>
          </div>
        </>
      )}

      <Dialog
        open={confirmClear}
        title="Delete all recent searches?"
        description="Every stored search is removed from this browser. Pins, favourited journeys and preferences stay as they are."
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
              Yes, delete them
            </Button>
            <Button variant="ghost" onClick={() => setConfirmClear(false)}>
              Cancel
            </Button>
          </>
        }
      >
        <p className="t-sm">{recentSearches.length} recent search(es) will be removed.</p>
      </Dialog>
    </div>
  );
}

/**
 * Next departures: **one** station, chosen once when the card is placed.
 *
 * The card used to be a stop field that stayed, and asking again every glance is the wrong shape for
 * a home screen: "no one wants to type in the departure each time if they just want a quick glance".
 * So **once it is tied to a station the card is not a control at all** — the station's name, its next
 * four departures and a way to the full board, and nothing to type in or dismiss.
 *
 * While it is *not* tied, the field is simply **there, in the card** — the same box, one line of
 * explanation above it, no button and no overlay: a button whose only job is to reveal a search box
 * is two steps where the card can offer the box itself.
 *
 * The binding lives in `widgetStations` under this widget's id, which is also what makes the
 * change path work the way the traveller described it: **remove the widget and add it again** to
 * tie a new one to a different station. `removeHomeWidget` deletes the entry, so the card that
 * comes back asks rather than quietly keeping the old answer.
 */
function NextDeparturesWidget() {
  const { widgetStations, setWidgetStation } = useApp();
  const format = useFormat();
  const t = useT();

  const bound = getStop(widgetStations['next-departures'] ?? undefined);
  /* A stored id whose stop has a board, or nothing. An address bound by hand in a browser's
     storage is not a card that can be drawn, so it counts as unbound and asks again. */
  const stop = bound && hasBoard(bound) ? bound : undefined;
  const stopId = stop?.id ?? null;
  const minutes = useClockMinutes();
  const board = useMemo(
    () => (stopId ? boardForStop(stopId, { fromMinutes: minutes, limit: 4 }) : []),
    [stopId, minutes],
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
          id="next-departures-stop"
          label={t('Station for this card')}
          hideLabel
          value={null}
          onSelect={(next) => {
            if (next) setWidgetStation('next-departures', next.id);
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
      <span className="t-sm t-muted">
        {t('{stop} · from {time}', { stop: stopLabel(stopId), time: format.time(minutes) })}
      </span>
      <BoardList departures={board} limit={4} />
      {/* A control, not a line of muted text: the same action the stop page offers wears the
          same words and the same board glyph wherever it appears. */}
      <Link to={`/departures?stop=${stopId}`} className="btn btn--sm">
        <Icon name="board" size={15} />
        Open the full board
      </Link>
    </div>
  );
}

function AlertsWidget() {
  const severityTone = { severe: 'coral', warning: 'butter', info: 'sage' } as const;
  const counts = {
    severe: DISRUPTIONS.filter((alert) => alert.severity === 'severe').length,
    warning: DISRUPTIONS.filter((alert) => alert.severity === 'warning').length,
    info: DISRUPTIONS.filter((alert) => alert.severity === 'info').length,
  };
  return (
    <div className="stack-2">
      <div className="row-wrap">
        <Pill tone="coral">{counts.severe} major</Pill>
        <Pill tone="butter">{counts.warning} disruptions</Pill>
        <Pill tone="sage">{counts.info} information</Pill>
      </div>
      <ul className="stack-1">
        {DISRUPTIONS.slice(0, 3).map((alert) => (
          <li key={alert.id} className="row-3">
            <span className={`status-dot status-dot--${severityTone[alert.severity]}`} />
            <Link to={`/disruptions/${alert.id}`} className="t-sm grow">
              {alert.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function QuickActionsWidget() {
  const links = [
    { to: '/departures', label: 'Departure boards', icon: 'board' as const },
    { to: '/stops', label: 'Stations & stops', icon: 'station' as const },
    { to: '/preferences', label: 'Travel preferences', icon: 'sliders' as const },
    { to: '/settings', label: 'Settings', icon: 'settings' as const },
  ];
  return (
    <div className="row-wrap">
      {links.map((link) => (
        <Link key={link.to} to={link.to} className="btn btn--sm">
          <Icon name={link.icon} size={15} />
          {link.label}
        </Link>
      ))}
    </div>
  );
}

function RightNowWidget() {
  const t = useT();
  const minutes = useClockMinutes();
  const format = useFormat();
  const { settings, search, startSearch, preferences, pushToast } = useApp();
  const navigate = useNavigate();
  return (
    <div className="stack-2">
      <div className="stack-1">
        <span className="t-h2 t-mono-num">{format.time(minutes)}</span>
        <span className="t-sm t-muted">Current time in this browser.</span>
      </div>
      <Button
        icon="clock"
        onClick={() => {
          if (!search) {
            pushToast('Plan a journey first — then you can re-run it from now', 'warning');
            return;
          }
          startSearch({ ...search.query, date: new Date().toISOString().slice(0, 10), time: minutes, preferences });
          navigate('/results');
        }}
      >
        {t('Re-run my search from now')}
      </Button>
      <span className="t-sm t-faint">
        {settings.defaultOriginStopId
          ? t('Default origin: {stop}', { stop: stopLabel(settings.defaultOriginStopId) })
          : t('No default origin set — pick one in Settings.')}
      </span>
    </div>
  );
}

function PreferencesSummaryWidget() {
  const t = useT();
  const { preferences } = useApp();
  return (
    <div className="stack-2">
      <ul className="row-wrap pill-list">
        {describePreferences(preferences, t).map((part) => (
          <li key={part} className="pill">
            {part}
          </li>
        ))}
      </ul>
      <Link to="/preferences" className="t-sm t-muted tap-target">
        {t('Change travel preferences')}
      </Link>
    </div>
  );
}

function ModeActivityWidget() {
  const modes: TravelMode[] = ['train', 'bus', 'tram', 'metro', 'ferry'];
  return (
    <ul className="stack-1">
      {modes.map((mode) => {
        const lines = NETWORK.filter((line) => line.mode === mode);
        return (
          <li key={mode} className="row-3">
            <ModeIcon mode={mode} size={16} />
            <span className="t-sm grow">{modeLabel(mode)}</span>
            <span className="t-sm t-muted">{plural(lines.length, 'service')}</span>
          </li>
        );
      })}
    </ul>
  );
}

function OperatorsWidget() {
  return (
    <ul className="stack-1">
      {OPERATORS.map((operator) => (
        <li key={operator.id} className="row-3">
          <span className="t-sm grow">
            <span className="t-strong">{operator.shortName}</span> · {operator.name}
          </span>
          <span className="row">
            {operator.modes.map((mode) => (
              <ModeIcon key={mode} mode={mode} size={14} />
            ))}
          </span>
        </li>
      ))}
    </ul>
  );
}

function StopSearchWidget() {
  const navigate = useNavigate();
  const t = useT();
  const [value, setValue] = useState<Stop | null>(null);
  return (
    <div className="stack-2">
      <StopCombobox
        id="widget-stop-search"
        label="Find a stop"
        value={value}
        onSelect={(stop) => {
          setValue(stop);
          if (stop) navigate(`/stops/${stop.id}`);
        }}
        placeholder={`Search ${STOPS.length} stations, stops and landmarks`}
      />
      {/*
       * Labelled a *sample*, because it is one: these three are the busiest stops in the
       * demonstration network, not anything the traveller chose. Unlabelled they read as a
       * suggestion the app is making about where they are, which is how "why is it always
       * Amsterdam Centraal" starts. `LinesHereWidget` already names its sample the same way.
       */}
      <div className="stack-1">
        <span className="t-sm t-faint">{t('Busiest sample stops')}</span>
        <div className="row-wrap">
          {busiestStops(3).map((id) => (
            <Chip key={id} icon="station" onClick={() => navigate(`/stops/${id}`)}>
              {stopLabel(id)}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  );
}

function LocalDataWidget() {
  const { savedJourneys, recentSearches, favouriteStopIds, boardStopIds, resetLocalData, pushToast } = useApp();
  return (
    <div className="stack-2">
      <ul className="stack-1 t-sm">
        <li className="between">
          <span>Favourite stops</span>
          <span className="t-strong">{favouriteStopIds.length}</span>
        </li>
        <li className="between">
          <span>Stops pinned to the board</span>
          <span className="t-strong">{boardStopIds.length}</span>
        </li>
        <li className="between">
          <span>Favourited journeys</span>
          <span className="t-strong">{savedJourneys.length}</span>
        </li>
        <li className="between">
          <span>Recent searches</span>
          <span className="t-strong">{recentSearches.length}</span>
        </li>
      </ul>
      <Button
        size="sm"
        variant="ghost"
        icon="trash"
        onClick={() => {
          resetLocalData();
          pushToast('All locally stored data has been removed');
        }}
      >
        Remove all stored data
      </Button>
    </div>
  );
}

function AboutWidget() {
  const { settings } = useApp();
  return (
    <div className="stack-2">
      <p className="t-sm">
        OVVO is an independent Dutch public transport journey planner. Search a stop, compare the options and
        save the journeys you take often.
      </p>
      <ul className="stack-1 t-sm">
        <li className="row-3">
          <span className="status-dot" />
          Timetables, delays, platforms and alerts run on the service data in this app.
        </li>
        <li className="row-3">
          <span className="status-dot" />
          The geographic map is the map widget on your home screen.
        </li>
        <li className="row-3">
          <span className="status-dot" />
          Favourites, board pins, favourited journeys, recent searches and preferences stay in this browser.
        </li>
      </ul>
      <span className="t-sm t-muted">
        Display: {settings.density === 'compact' ? 'compact' : 'comfortable'} ·{' '}
        {settings.timeFormat === '24h' ? '24-hour' : '12-hour'} clock ·{' '}
        {settings.dateFormat === 'short' ? 'dd-mm-yyyy' : 'descriptive'} dates
      </span>
    </div>
  );
}

function PinnedStopsWidget() {
  const { favouriteStopIds, toggleFavourite } = useApp();
  const navigate = useNavigate();
  if (favouriteStopIds.length === 0) {
    return (
      <p className="t-sm t-faint">
        Heart a stop from its page and it is listed here for one-tap planning.
      </p>
    );
  }
  return (
    <ul className="stack-1">
      {favouriteStopIds.slice(0, 4).map((stopId) => (
        <li key={stopId} className="list-row list-row--static">
          {/**
           * This row's marker is gone on purpose. Every row in this widget is a pinned stop, so
           * a pin on each of them said nothing the widget's own name had not already said — and
           * it was the last place a `pin` was drawn as a marker rather than as the control
           * (W3C COGA: a glyph that is both a label and a marker promises two things).
           */}
          <Link to={`/stops/${stopId}`} className="t-sm t-strong grow">
            {stopLabel(stopId)}
          </Link>
          <Button
            size="sm"
            /* `route`: this plans a journey from the stop. It wore the crosshair, which is the
               *use my location* glyph. */
            icon="route"
            onClick={() => {
              /*
               * The destination is the traveller's to choose. This used to run a search to a
               * hard-coded `amsterdam-centraal` (and to `utrecht-centraal` when the pin *was*
               * Amsterdam), which invented a destination nobody asked for; now it opens the
               * planner with this stop as the origin — the same `?from=` route the stop page
               * uses — and waits for them to say where to.
               */
              navigate(`/?from=${stopId}`);
            }}
          >
            Plan from here
          </Button>
          {/**
           * The same control as everywhere else — the heart, trailing, filled while it is a
           * favourite. Every row in this widget is a favourite, so it is always filled; it is
           * here to be the way *out*, which is what the heart emptying says.
           */}
          <IconButton
            icon="heart"
            label={`Remove ${stopLabel(stopId)} from favourites`}
            active
            className="glyph-toggle"
            onClick={() => toggleFavourite(stopId)}
          />
        </li>
      ))}
    </ul>
  );
}

function LinesHereWidget() {
  const t = useT();
  const busiest = busiestStops(1)[0];
  const lines = busiest ? linesAtStop(busiest).slice(0, 6) : [];
  return (
    <div className="stack-2">
      {/*
       * Named as a *sample*, like the shortlist below it: this stop is the busiest in the
       * demonstration network, not anywhere the traveller is. The label goes through the
       * translator with every other interface line, because "which stop is this about" is
       * interface text even when the stop's own name is data.
       */}
      <span className="t-sm t-muted">
        {t('Busiest sample stop: {stop}', { stop: busiest ? stopLabel(busiest) : '—' })}
      </span>
      <ul className="stack-1">
        {lines.map((line) => (
          <li key={line.id} className="row-3">
            <ModeIcon mode={line.mode} size={16} />
            <span className="t-sm grow">{line.name}</span>
            <span className="t-sm t-muted">{operatorName(line.operatorId)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AlertsAtPinsWidget() {
  const { favouriteStopIds } = useApp();
  const alerts = favouriteStopIds.flatMap((stopId) => disruptionsForStop(stopId));
  const unique = alerts.filter((alert, index, list) => list.findIndex((item) => item.id === alert.id) === index);
  if (favouriteStopIds.length === 0) {
    return <p className="t-sm t-faint">Heart a stop and any alert affecting it shows up here.</p>;
  }
  return unique.length === 0 ? (
    <p className="t-sm t-muted">No alerts affect your favourite stops right now.</p>
  ) : (
    <ul className="stack-1">
      {unique.slice(0, 4).map((alert) => (
        <li key={alert.id}>
          <Link to={`/disruptions/${alert.id}`} className="row t-sm">
            <Icon name="alert" size={14} />
            {alert.title}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/* --------------------------------------------------------------- the catalogue */

const DEFINITIONS: WidgetDefinition[] = [
  {
    id: 'planner',
    title: 'Plan a journey',
    description: 'Where are you going? Departing today, right now.',
    category: 'Plan',
    span: 12,
    Body: PlannerWidget,
  },
  {
    id: 'map',
    title: 'Network map',
    description: 'Every route, filtered by mode.',
    category: 'Plan',
    // Eight columns: the map is capped at 480px square, so a wider card only adds empty
    // margins either side of it, and the four that are left beside it are exactly a
    // one-line card's width — the default layout fills its rows without a stretched card.
    span: 8,
    Body: MapWidget,
  },
  {
    id: 'favourited-journeys',
    title: 'Favourited journeys',
    description: 'The journeys you saved, one tap to repeat.',
    category: 'Yours',
    span: 4,
    Body: FavouritedJourneysWidget,
  },
  {
    id: 'recent-searches',
    title: 'Recent searches',
    description: 'The searches you kept, one tap to repeat.',
    category: 'Yours',
    span: 6,
    Body: RecentSearchesWidget,
  },
  {
    id: 'next-departures',
    title: 'Next departures',
    description: 'The next departures from the station this card is tied to.',
    category: 'Travel information',
    span: 6,
    Body: NextDeparturesWidget,
  },
  {
    id: 'alerts',
    title: 'Alerts right now',
    description: 'How many alerts are active, and the top three.',
    category: 'Travel information',
    span: 6,
    Body: AlertsWidget,
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
    id: 'quick-actions',
    title: 'Quick actions',
    description: 'Jump straight to boards, stops, alerts and settings.',
    category: 'Plan',
    span: 6,
    Body: QuickActionsWidget,
  },
  {
    id: 'right-now',
    title: 'Right now',
    description: 'The current time and a one-tap re-run of your search from now.',
    category: 'Plan',
    span: 4,
    Body: RightNowWidget,
  },
  {
    id: 'preferences-summary',
    title: 'Your travel preferences',
    description: 'The modes and limits shaping every search.',
    category: 'Yours',
    span: 6,
    Body: PreferencesSummaryWidget,
  },
  {
    id: 'pinned-stops',
    title: 'Favourite stops',
    description: 'The stops you hearted, ready as an origin.',
    category: 'Yours',
    span: 4,
    Body: PinnedStopsWidget,
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
    id: 'mode-activity',
    title: 'Services per mode',
    description: 'How many services each mode has.',
    category: 'Travel information',
    span: 4,
    Body: ModeActivityWidget,
  },
  {
    id: 'lines-here',
    title: 'Lines at the busiest stop',
    description: 'The services calling at the busiest stop.',
    category: 'Travel information',
    span: 4,
    Body: LinesHereWidget,
  },
  {
    id: 'operators',
    title: 'Operators',
    description: 'The operators and the modes they run.',
    category: 'Travel information',
    span: 4,
    Body: OperatorsWidget,
  },
  {
    id: 'local-data',
    title: 'Stored on this device',
    description: 'What this browser keeps, and a way to clear it.',
    category: 'About',
    span: 4,
    Body: LocalDataWidget,
  },
  {
    id: 'about',
    title: 'About OVVO',
    description: 'How OVVO works.',
    category: 'About',
    span: 6,
    Body: AboutWidget,
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
