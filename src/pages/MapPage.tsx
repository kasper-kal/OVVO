import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../state/AppState';
import { PageHeader } from '../components/layout/AppShell';
import { STOPS, getStop, stopLabel } from '../data/stops';
import { linesAtStop } from '../data/network';
import {
  Banner,
  Button,
  Card,
  Chip,
  DemoBadge,
  EmptyState,
  IconButton,
  Panel,
  Pill,
  Segmented,
} from '../components/ui/primitives';
import { Icon, ModeIcon } from '../components/ui/Icons';
import { useFormat } from '../lib/useFormat';
import type { Journey, TravelMode } from '../data/types';

/**
 * Illustrative map — a schematic drawing of the demonstration network.
 * No external tiles, vehicle feeds or map APIs are used, and the layout is
 * deliberately not geographically accurate.
 */

const ROUTE_CLASS: Record<TravelMode, string> = {
  train: 'map-route',
  metro: 'map-route map-route--metro',
  tram: 'map-route map-route--tram',
  bus: 'map-route map-route--bus',
  ferry: 'map-route map-route--ferry',
  walk: 'map-route--walk',
  bike: 'map-route--walk',
};

type StopView = 'all' | 'stations' | 'favourites';

export function MapPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { journeys, search, preferences, favouriteStopIds, toggleFavourite, startSearch, pushToast } = useApp();
  const format = useFormat();

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [stopView, setStopView] = useState<StopView>('all');
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [selectedJourneyId, setSelectedJourneyId] = useState<string | null>(params.get('journey'));
  const [showVehicles, setShowVehicles] = useState(true);
  const [tick, setTick] = useState(0);

  const selectedJourney: Journey | undefined = useMemo(
    () => journeys.find((journey) => journey.id === selectedJourneyId),
    [journeys, selectedJourneyId],
  );

  useEffect(() => {
    if (!showVehicles || !selectedJourney) return undefined;
    const timer = window.setInterval(() => setTick((value) => value + 1), 1400);
    return () => window.clearInterval(timer);
  }, [showVehicles, selectedJourney]);

  const visibleStops = useMemo(() => {
    if (stopView === 'stations') return STOPS.filter((stop) => stop.type === 'station' || stop.type === 'airport');
    if (stopView === 'favourites')
      return STOPS.filter((stop) => favouriteStopIds.includes(stop.id));
    return STOPS;
  }, [stopView, favouriteStopIds]);

  const viewSize = 100 / zoom;
  const viewBox = `${pan.x} ${pan.y} ${viewSize} ${viewSize}`;
  const selectedStop = getStop(selectedStopId ?? undefined);

  /**
   * Label plan: the selected stop and stops on the chosen route always carry a
   * label; busier interchanges get one when it does not overlap a label that was
   * already placed. At higher zoom levels every visible stop is labelled.
   */
  const labelledStopIds = useMemo(() => {
    const boxes: [number, number, number, number][] = [];
    const placed = new Set<string>();
    const onRouteIds = new Set(
      selectedJourney ? selectedJourney.legs.flatMap((leg) => [leg.fromStopId, leg.toStopId]) : [],
    );
    const candidates = [...visibleStops].sort((a, b) => {
      const rank = (stop: typeof a) =>
        stop.id === selectedStopId ? 3 : onRouteIds.has(stop.id) ? 2 : linesAtStop(stop.id).length >= 3 ? 1 : 0;
      return rank(b) - rank(a) || a.name.localeCompare(b.name);
    });
    for (const stop of candidates) {
      const rank =
        stop.id === selectedStopId ? 3 : onRouteIds.has(stop.id) ? 2 : linesAtStop(stop.id).length >= 3 ? 1 : 0;
      const forceLabel = rank >= 2;
      if (rank === 0 && zoom < 1.5) continue;
      const width = stop.name.length * 1.15 + 1.6;
      const x1 = stop.coordinates.x + 2.1;
      const y1 = stop.coordinates.y - 1.7;
      const box: [number, number, number, number] = [x1, y1, x1 + width, y1 + 3.2];
      const overlaps = boxes.some(
        (other) => !(box[2] < other[0] || box[0] > other[2] || box[3] < other[1] || box[1] > other[3]),
      );
      if (overlaps && !forceLabel) continue;
      boxes.push(box);
      placed.add(stop.id);
    }
    return placed;
  }, [visibleStops, selectedJourney, selectedStopId, zoom]);

  const clampPan = (next: { x: number; y: number }, nextZoom = zoom) => {
    const size = 100 / nextZoom;
    return {
      x: Math.max(0, Math.min(100 - size, next.x)),
      y: Math.max(0, Math.min(100 - size, next.y)),
    };
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const routeSegments = (journey: Journey) =>
    journey.legs.map((leg) => {
      const a = getStop(leg.fromStopId);
      const b = getStop(leg.toStopId);
      if (!a || !b) return null;
      return { leg, a, b };
    });

  return (
    <div className="stack" style={{ gap: 'var(--s-6)' }}>
      <PageHeader
        title="Illustrative network map"
        description="A schematic drawing of the prototype's own stop list. Positions, lines and vehicles are invented for the demo and are not geographically accurate."
        breadcrumbs={[{ label: 'Planner', to: '/' }, { label: 'Map' }]}
        badge={<DemoBadge label="Illustrative map" />}
        actions={
          <>
            <Button icon="zoomOut" onClick={resetView}>
              Reset view
            </Button>
            {selectedJourney ? (
              <Link to={`/journey/${selectedJourney.id}`} className="btn btn--primary">
                <Icon name="route" size={16} />
                Back to journey details
              </Link>
            ) : null}
          </>
        }
      />

      <Banner tone="hairline" icon="info" title="This map is a schematic, not a geographical map">
        It uses no external map tiles, no vehicle feeds and no map APIs. Stops are placed on a schematic canvas so the
        interface can be evaluated.
      </Banner>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div className="map-shell stack-2">
          <div className="between wrap">
            <Segmented
              ariaLabel="Map view"
              value={stopView}
              onChange={setStopView}
              options={[
                { value: 'all', label: 'All stops' },
                { value: 'stations', label: 'Stations' },
                { value: 'favourites', label: 'Favourites' },
              ]}
            />
            <div className="row-wrap">
              <Chip selected={showVehicles} onClick={() => setShowVehicles((value) => !value)} icon="bus">
                Vehicle markers
              </Chip>
              <IconButton
                icon="zoomIn"
                label="Zoom in"
                variant="surface"
                onClick={() => {
                  const nextZoom = Math.min(2.5, Number((zoom + 0.5).toFixed(1)));
                  setZoom(nextZoom);
                  setPan((current) => clampPan(current, nextZoom));
                }}
              />
              <IconButton
                icon="zoomOut"
                label="Zoom out"
                variant="surface"
                onClick={() => {
                  const nextZoom = Math.max(1, Number((zoom - 0.5).toFixed(1)));
                  setZoom(nextZoom);
                  setPan((current) => clampPan(current, nextZoom));
                }}
              />
            </div>
          </div>

          <svg className="map-canvas" viewBox={viewBox} role="img" aria-label="Illustrative map of the demonstration network">
            <rect x="0" y="0" width="100" height="100" className="map-water" />
            <path className="map-land" d="M12 2 L88 2 L90 46 L72 62 L86 96 L26 98 L9 76 L4 46 Z" />
            <path className="map-river" d="M20 92 C32 78 30 60 44 52 C58 44 56 28 70 20" />
            <path className="map-river" d="M12 42 C26 44 34 46 44 52 C56 60 66 62 78 60" />

            {selectedJourney
              ? routeSegments(selectedJourney).map((segment) =>
                  segment ? (
                    <line
                      key={segment.leg.id}
                      className={ROUTE_CLASS[segment.leg.mode]}
                      x1={segment.a.coordinates.x}
                      y1={segment.a.coordinates.y}
                      x2={segment.b.coordinates.x}
                      y2={segment.b.coordinates.y}
                    />
                  ) : null,
                )
              : null}

            {visibleStops.map((stop) => {
              const isFavourite = favouriteStopIds.includes(stop.id);
              const isSelected = selectedStopId === stop.id;
              const isOnRoute = Boolean(
                selectedJourney?.legs.some((leg) => leg.fromStopId === stop.id || leg.toStopId === stop.id),
              );
              const size = isSelected ? 1.9 : isOnRoute ? 1.6 : 1.2;
              const classes = [
                'map-stop',
                stop.type === 'landmark' ? 'map-stop--landmark' : '',
                isFavourite ? 'map-stop--favourite' : '',
                isSelected ? 'map-stop--selected' : '',
              ]
                .filter(Boolean)
                .join(' ');
              return (
                <g key={stop.id} className={classes} transform={`translate(${stop.coordinates.x} ${stop.coordinates.y})`}>
                  <circle r={size} onClick={() => setSelectedStopId(stop.id)} />
                  {labelledStopIds.has(stop.id) ? (
                    <text x={size + 1} y={0.8} onClick={() => setSelectedStopId(stop.id)}>
                      {stop.name}
                    </text>
                  ) : null}
                </g>
              );
            })}

            {showVehicles && selectedJourney
              ? routeSegments(selectedJourney).map((segment, index) => {
                  if (!segment) return null;
                  if (segment.leg.mode === 'walk' || segment.leg.mode === 'bike') return null;
                  const progress = ((tick + index * 4) % 12) / 12;
                  const x = segment.a.coordinates.x + (segment.b.coordinates.x - segment.a.coordinates.x) * progress;
                  const y = segment.a.coordinates.y + (segment.b.coordinates.y - segment.a.coordinates.y) * progress;
                  return (
                    <g key={`vehicle-${segment.leg.id}`} className="map-vehicle-group">
                      <circle className="map-vehicle" cx={x} cy={y} r={1.6} />
                      <circle className="map-vehicle__dot" cx={x} cy={y} r={0.6} />
                    </g>
                  );
                })
              : null}
          </svg>

          <div className="between wrap">
            <div className="map-legend">
              <span className="map-legend__item">
                <span className="map-legend__dot" /> stop
              </span>
              <span className="map-legend__item">
                <span className="map-legend__swatch" style={{ background: 'var(--accent-primary)' }} /> bus / tram route
              </span>
              <span className="map-legend__item">
                <span className="map-legend__swatch" /> train route
              </span>
              <span className="map-legend__item">
                <span className="map-legend__swatch" style={{ background: 'var(--ink-faint)', height: 2 }} /> walking link
              </span>
            </div>
            <div className="map-pan" aria-label="Pan the map">
              <span />
              <IconButton
                icon="chevronUp"
                label="Pan up"
                variant="surface"
                onClick={() => setPan((current) => clampPan({ x: current.x, y: current.y - 6 }))}
              />
              <span />
              <IconButton
                icon="chevronLeft"
                label="Pan left"
                variant="surface"
                onClick={() => setPan((current) => clampPan({ x: current.x - 6, y: current.y }))}
              />
              <IconButton
                icon="chevronDown"
                label="Pan down"
                variant="surface"
                onClick={() => setPan((current) => clampPan({ x: current.x, y: current.y + 6 }))}
              />
              <IconButton
                icon="chevronRight"
                label="Pan right"
                variant="surface"
                onClick={() => setPan((current) => clampPan({ x: current.x + 6, y: current.y }))}
              />
            </div>
          </div>
        </div>

        <div className="stack" style={{ gap: 'var(--s-4)' }}>
          <Card className="stack">
            <h2 className="t-section">Route on this map</h2>
            {search && journeys.length ? (
              <>
                <p className="t-sm t-muted">
                  Showing options for {stopLabel(search.query.fromStopId)} → {stopLabel(search.query.toStopId)}.
                </p>
                <ul className="stack-2">
                  {journeys.slice(0, 6).map((journey) => (
                    <li key={journey.id}>
                      <button
                        type="button"
                        className="list-row"
                        aria-pressed={journey.id === selectedJourneyId}
                        style={
                          journey.id === selectedJourneyId
                            ? { borderColor: 'var(--accent-primary)', background: 'var(--tint-coral)' }
                            : undefined
                        }
                        onClick={() => {
                          setSelectedJourneyId(journey.id === selectedJourneyId ? null : journey.id);
                          setSelectedStopId(null);
                        }}
                      >
                        <span className="leg-row__marker">
                          <ModeIcon mode={journey.legs[0].mode} size={18} />
                        </span>
                        <span className="stack-1 grow">
                          <span className="t-strong t-sm">
                            {format.time(journey.departure)} – {format.time(journey.arrival)} ·{' '}
                            {format.duration(journey.durationMinutes)}
                          </span>
                          <span className="t-sm t-muted">
                            {journey.transfers} transfer(s) ·{' '}
                            {journey.modes.filter((mode) => mode !== 'walk').join(', ') || 'walking only'}
                          </span>
                        </span>
                        <Icon name={journey.id === selectedJourneyId ? 'check' : 'chevronRight'} size={18} />
                      </button>
                    </li>
                  ))}
                </ul>
                {selectedJourney ? (
                  <div className="row-wrap">
                    <Link to={`/journey/${selectedJourney.id}`} className="btn btn--primary">
                      Journey details
                    </Link>
                    <Button icon="close" onClick={() => setSelectedJourneyId(null)}>
                      Clear route
                    </Button>
                  </div>
                ) : (
                  <p className="t-sm t-faint">Pick an option above to draw its route and vehicle markers.</p>
                )}
              </>
            ) : (
              <EmptyState
                icon="route"
                title="No route to draw yet"
                description="Plan a journey and this map will draw the selected option. You can still explore every stop below."
              >
                <Link to="/" className="btn btn--primary">
                  <Icon name="search" size={16} />
                  Plan a journey
                </Link>
              </EmptyState>
            )}
          </Card>

          <Card className="stack">
            <h2 className="t-section">Selected stop</h2>
            {selectedStop ? (
              <div className="stack-2">
                <div className="row-3">
                  <span className="leg-row__marker">
                    <Icon name="station" size={18} />
                  </span>
                  <div className="stack-1 grow">
                    <span className="t-strong">{selectedStop.name}</span>
                    <span className="t-sm t-muted">
                      {selectedStop.city} · {selectedStop.code} · {selectedStop.region}
                    </span>
                  </div>
                  <IconButton
                    icon="star"
                    label={favouriteStopIds.includes(selectedStop.id) ? 'Remove favourite' : 'Add favourite'}
                    active={favouriteStopIds.includes(selectedStop.id)}
                    variant={favouriteStopIds.includes(selectedStop.id) ? 'butter' : 'surface'}
                    onClick={() => toggleFavourite(selectedStop.id)}
                  />
                </div>
                <div className="row-wrap">
                  {selectedStop.modes
                    .filter((mode) => mode !== 'walk' && mode !== 'bike')
                    .map((mode) => (
                      <span key={mode} className={`mode-badge mode-badge--${mode}`}>
                        <ModeIcon mode={mode} size={13} />
                        {mode}
                      </span>
                    ))}
                  {selectedStop.accessibility.stepFree ? <Pill tone="sage">Step-free</Pill> : <Pill tone="coral">Not step-free</Pill>}
                </div>
                <div className="row-wrap">
                  <Button
                    icon="location"
                    onClick={() => {
                      if (!search) {
                        pushToast('Plan a search first, then use this shortcut', 'warning');
                        return;
                      }
                      startSearch({ ...search.query, fromStopId: selectedStop.id, preferences });
                      navigate('/results');
                    }}
                  >
                    Plan from here
                  </Button>
                  <Button
                    icon="arrowRight"
                    onClick={() => {
                      if (!search) {
                        pushToast('Plan a search first, then use this shortcut', 'warning');
                        return;
                      }
                      startSearch({ ...search.query, toStopId: selectedStop.id, preferences });
                      navigate('/results');
                    }}
                  >
                    Plan to here
                  </Button>
                  <Link to={`/stops/${selectedStop.id}`} className="btn">
                    Stop page
                  </Link>
                  <Link to={`/departures?stop=${selectedStop.id}`} className="btn">
                    Departures
                  </Link>
                </div>
              </div>
            ) : (
              <p className="t-sm t-muted">
                Tap any marker on the map to see the stop, its modes and shortcuts to plan from or to it.
              </p>
            )}
          </Card>

          <Panel className="stack-2">
            <span className="field__label">Map interactions in this prototype</span>
            <ul className="stack-1 t-sm">
              <li>Select a stop on the map or in the list to open its information.</li>
              <li>Choose an option to draw its route with simulated vehicle markers.</li>
              <li>Switch between all stops, stations only and your favourites.</li>
              <li>Zoom and pan with the controls — the schematic canvas moves, not real geography.</li>
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}
