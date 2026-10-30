import { useEffect, useMemo, useRef, useState } from 'react';
import { MAP_POINT, mapCorridors } from '../../data/map';
import { STOPS, getStop } from '../../data/stops';
import { rankStops } from '../../lib/stopSearch';
import { dismissKeyboard } from '../../lib/dismissKeyboard';
import { useApp } from '../../state/AppState';
import { FullScreen } from '../ui/FullScreen';
import { Button, IconButton } from '../ui/primitives';
import { Icon, ModeIcon } from '../ui/Icons';
import { useT } from '../../lib/useT';
import type { Stop } from '../../data/types';
import { plural } from '../../lib/format';

/** How much of the 0–100 canvas is on screen. Smaller is closer in. */
const MIN_VIEW = 12;
const MAX_VIEW = 130;

interface View {
  /** Canvas point under the centre of the screen — where the pin is. */
  cx: number;
  cy: number;
  /** Side of the square of canvas that fills the screen. */
  size: number;
}

/**
 * The map screen: pick a stop by sliding the map until the pin is where you want it.
 *
 * The pin never moves. The map does, and whatever stop is nearest the pin is the one
 * named in the sheet — which is how the 9292 map picker works and why there is no
 * "tap the exact dot" interaction here.
 *
 * The surface is the schematic network this build ships with (no streets, no basemap —
 * the drawing comes from `data/map`). Everything around it is already the shape a real
 * basemap needs: a view (centre + scale) in the drawing's own units, a fixed pin, a
 * nearest-feature lookup and a confirm step, so dropping a tile layer under the SVG is a
 * change to `MapSurface` alone.
 */
export function MapPicker({
  side,
  centreOn,
  onPick,
  onClose,
}: {
  side: 'from' | 'to';
  /** The stop that end already holds, so the map opens where the traveller left off. */
  centreOn?: Stop | null;
  onPick: (side: 'from' | 'to', stop: Stop) => void;
  onClose: () => void;
}) {
  const { favouriteStopIds, nearestOrigin } = useApp();
  const t = useT();
  const start = centreOn ? MAP_POINT(centreOn.id) : null;
  const [view, setView] = useState<View>({ cx: start?.x ?? 50, cy: start?.y ?? 50, size: 100 });
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; cx: number; cy: number } | null>(null);
  /*
   * The confirm control, so a pick made in the search field can hand the keyboard to it instead
   * of dropping it on `<body>` (28.5).
   */
  const selectRef = useRef<HTMLDivElement>(null);
  /*
   * The surface's own size, kept current: the drawing's label is sized in canvas units, and the
   * number of screen pixels a unit is worth is `max(width, height) / view.size` (28.4). Without
   * this the name of the chosen stop was 7.7px on a 320px phone and 36.8px on a desktop.
   */
  const [surface, setSurface] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const node = surfaceRef.current;
    if (!node) return undefined;
    const read = () => {
      const rect = node.getBoundingClientRect();
      setSurface({ width: rect.width, height: rect.height });
    };
    read();
    const observer = new ResizeObserver(read);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const corridors = useMemo(() => mapCorridors('all'), []);
  const matches = query.trim() ? rankStops(query, favouriteStopIds, { origin: nearestOrigin, limit: 5 }) : [];

  /** The stop under the pin: the nearest one to the centre of the view. */
  const nearest = useMemo(() => {
    let best: { stop: Stop; distance: number } | null = null;
    for (const stop of STOPS) {
      const point = MAP_POINT(stop.id);
      if (!point) continue;
      const distance = Math.hypot(point.x - view.cx, point.y - view.cy);
      if (!best || distance < best.distance) best = { stop, distance };
    }
    return best?.stop ?? null;
  }, [view.cx, view.cy]);

  const chosen = pickedId ? getStop(pickedId) ?? nearest : nearest;
  const point = chosen ? MAP_POINT(chosen.id) : null;

  const pxPerUnit = () => {
    const rect = surfaceRef.current?.getBoundingClientRect();
    if (!rect) return 1;
    return Math.max(rect.width, rect.height) / view.size;
  };

  const centreOnStop = (stop: Stop) => {
    const next = MAP_POINT(stop.id);
    if (!next) return;
    setView((current) => ({ ...current, cx: next.x, cy: next.y }));
    setPickedId(stop.id);
    setQuery('');
    setSearching(false);
    /*
     * The search answered: the field is emptied and a stop is picked. The keyboard closes — the map
     * and the sheet below it are what the traveller is looking at — but the focus the phone would
     * have dropped goes to the control that confirms the pick, so a keyboard user continues from
     * inside the screen instead of tabbing back in from the top of the app (28.5).
     */
    dismissKeyboard();
    window.requestAnimationFrame(() =>
      selectRef.current?.querySelector('button')?.focus({ preventScroll: true }),
    );
  };

  const zoom = (factor: number) => {
    setView((current) => ({ ...current, size: Math.min(MAX_VIEW, Math.max(MIN_VIEW, current.size * factor)) }));
  };

  return (
    <FullScreen
      title={t('Choose a stop on the map')}
      label={t('Choose a stop on the map')}
      onClose={onClose}
      right={
        <IconButton
          /* `focus`, not the crosshair: this fits the drawing in view, it does not locate
             anyone. `location` is the two *use my location* controls only. */
          icon="focus"
          label={t('Centre the network')}
          className="map-picker__recentre"
          onClick={() => setView({ cx: 50, cy: 50, size: 100 })}
        />
      }
    >
      <div className="map-picker">
        <div
          className="map-picker__surface"
          ref={surfaceRef}
          onPointerDown={(event) => {
            /*
             * The zoom pair sits inside the draggable surface, and the surface captured the pointer
             * on `pointerdown` — so the `pointerup` went to the surface, the button never received
             * a `click`, and the only way to zoom out of a too-close map was the keyboard (28.2).
             * A press that starts on a control is that control's, not the map's.
             */
            if ((event.target as HTMLElement).closest('.map-picker__zoom')) return;
            event.currentTarget.setPointerCapture(event.pointerId);
            drag.current = { x: event.clientX, y: event.clientY, cx: view.cx, cy: view.cy };
          }}
          onPointerMove={(event) => {
            if (!drag.current) return;
            const scale = pxPerUnit();
            const nextCx = drag.current.cx - (event.clientX - drag.current.x) / scale;
            const nextCy = drag.current.cy - (event.clientY - drag.current.y) / scale;
            setView((current) => ({
              ...current,
              cx: Math.min(100, Math.max(0, nextCx)),
              cy: Math.min(100, Math.max(0, nextCy)),
            }));
            setPickedId(null);
          }}
          onPointerUp={() => {
            drag.current = null;
          }}
          onPointerCancel={() => {
            drag.current = null;
          }}
          onWheel={(event) => {
            event.preventDefault();
            zoom(event.deltaY > 0 ? 1.12 : 1 / 1.12);
          }}
          role="application"
          aria-label={t('Network map. Drag to move the map; the stop nearest the pin is chosen.')}
        >
          {/* MapSurface: the schematic drawing today, a tile layer under it tomorrow. */}
          <svg
            className="map-canvas map-picker__canvas"
            viewBox={`${view.cx - view.size / 2} ${view.cy - view.size / 2} ${view.size} ${view.size}`}
            preserveAspectRatio="xMidYMid slice"
            role="img"
            aria-label={`${t('Network map')}, ${plural(STOPS.length, t('stop'), t('stops'))}`}
          >
            {corridors.map((line) => (
              <polyline
                key={line.id}
                className={`map-route map-route--${line.mode}`}
                points={line.stops
                  .map((stopId) => MAP_POINT(stopId))
                  .filter((dot): dot is { x: number; y: number } => Boolean(dot))
                  .map((dot) => `${dot.x.toFixed(2)},${dot.y.toFixed(2)}`)
                  .join(' ')}
              />
            ))}
            {STOPS.map((stop) => {
              const dot = MAP_POINT(stop.id);
              if (!dot) return null;
              const isChosen = chosen?.id === stop.id;
              return (
                <g
                  key={stop.id}
                  className={`map-stop${isChosen ? ' map-stop--selected' : ''}`}
                  transform={`translate(${dot.x.toFixed(2)} ${dot.y.toFixed(2)})`}
                >
                  <circle r={isChosen ? 1.9 : 1.1} />
                </g>
              );
            })}
            {chosen && point ? (
              <g className="map-stop map-picker__label" transform={`translate(${point.x.toFixed(2)} ${point.y.toFixed(2)})`}>
                <text
                  x={2.6}
                  y={0}
                  textAnchor="start"
                  dominantBaseline="middle"
                  /*
                    12px on screen at any width and any zoom, converted into canvas units. A
                    style, not the SVG presentation attribute: the stylesheet's own
                    `font-size: 2.6px` outranked the attribute and left the name at 7.7px on a
                    phone and 36.8px on a desktop (28.4).
                  */
                  style={{
                    fontSize:
                      surface.width && surface.height
                        ? 12 / (Math.max(surface.width, surface.height) / view.size)
                        : undefined,
                  }}
                >
                  {chosen.name.replace(`${chosen.city}, `, '')}
                </text>
              </g>
            ) : null}
          </svg>

          <span className="map-pin" aria-hidden="true">
            <span className="map-pin__dot" />
            <span className="map-pin__tail" />
          </span>

          <div className="map-picker__zoom">
            <IconButton icon="plus" label={t('Zoom in')} onClick={() => zoom(1 / 1.4)} />
            <IconButton icon="minus" label={t('Zoom out')} onClick={() => zoom(1.4)} />
          </div>
        </div>

        <div className="map-picker__sheet">
          <div className="map-picker__search">
            <Icon name="search" size={18} />
            <input
              className="map-picker__search-field"
              type="text"
              autoComplete="off"
              placeholder={t('Search for a stop')}
              /* A placeholder is not a name: it vanishes the moment anything is typed (28.5). */
              aria-label={t('Search for a stop')}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setSearching(true);
              }}
              onFocus={() => setSearching(true)}
            />
            {query ? <IconButton icon="close" label={t('Clear the search')} onClick={() => setQuery('')} /> : null}
          </div>

          {searching && matches.length > 0 ? (
            <ul className="picker__list map-picker__matches">
              {matches.map((stop) => (
                <li key={stop.id} className="picker__item">
                  <button type="button" className="picker-row" onClick={() => centreOnStop(stop)}>
                    <span className="picker-row__marker">
                      <Icon name="station" size={18} />
                    </span>
                    <span className="stack-1 grow">
                      <span className="picker-row__name">{stop.name}</span>
                      <span className="picker-row__meta">
                        {stop.city} · {stop.code}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          {chosen ? (
            <div className="map-picker__chosen">
              <span className="picker-row__marker">
                {/* The teardrop: a *place* on the map, never a control (`mapPin`). */}
                <Icon name="mapPin" size={20} />
              </span>
              <span className="stack-1 grow">
                <span className="picker-row__name">{chosen.name}</span>
                <span className="picker-row__meta">
                  {chosen.city} · {chosen.code} ·{' '}
                  {chosen.modes
                    .filter((mode) => mode !== 'walk' && mode !== 'bike')
                    .slice(0, 3)
                    .map((mode) => (
                      <ModeIcon key={mode} mode={mode} size={14} />
                    ))}
                </span>
              </span>
            </div>
          ) : (
            <p className="picker-row__meta">{t('No stop is placed on the map.')}</p>
          )}

          <div ref={selectRef} className="map-picker__confirm">
            <Button
              variant="surface"
              icon="check"
              block
              disabled={!chosen}
              onClick={() => {
                if (!chosen) return;
                /*
                 * The same act as `centreOnStop` above, for the button that answers the screen:
                 * this map is closing and the pair is complete, so the keyboard goes before the
                 * hand-off. A finger on this button does not blur the search field by itself —
                 * a phone does not focus buttons — so without this the caret stayed in the field
                 * that was about to be unmounted, and the keyboard came out over the results.
                 */
                dismissKeyboard();
                onPick(side, chosen);
              }}
            >
              {t('Select this stop')}
            </Button>
          </div>
        </div>
      </div>
    </FullScreen>
  );
}
