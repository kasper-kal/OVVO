import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../state/AppState';
import { PageHeader } from '../components/layout/AppShell';
import { DepartureTable } from '../components/stops/DepartureTable';
import { getStop, nearbyStops, stopLabel, walkMinutesBetween } from '../data/stops';
import { getLine, linesAtStop } from '../data/network';
import { operatorName } from '../data/operators';
import { disruptionsForStop } from '../data/disruptions';
import { boardForStop } from '../data/departures';
import { nowMinutes } from '../lib/boardHelpers';
import { Button, Card, DemoBadge, EmptyState, IconButton, Panel, Pill, Stat } from '../components/ui/primitives';
import { Icon, ModeIcon } from '../components/ui/Icons';
import { useFormat } from '../lib/useFormat';

export function StopDetailPage() {
  const { stopId } = useParams();
  const navigate = useNavigate();
  const { favouriteStopIds, toggleFavourite, search, startSearch, preferences, pushToast } = useApp();
  const format = useFormat();
  const stop = getStop(stopId);

  if (!stop) {
    return (
      <div className="stack" style={{ gap: 'var(--s-6)' }}>
        <PageHeader title="Unknown stop" description="This stop is not part of the demonstration network." breadcrumbs={[{ label: 'Stops', to: '/stops' }]} />
        <EmptyState icon="station" title="Stop not found" description="Pick a stop from the full list instead.">
          <Link to="/stops" className="btn btn--primary">
            <Icon name="station" size={16} />
            All stations & stops
          </Link>
        </EmptyState>
      </div>
    );
  }

  const favourite = favouriteStopIds.includes(stop.id);
  const lines = linesAtStop(stop.id);
  const fromMinutes = Math.max(0, nowMinutes() - 1);
  const board = boardForStop(stop.id, { fromMinutes, limit: 6, tick: 0 });
  const boardTotal = boardForStop(stop.id, { fromMinutes, limit: 30, tick: 0 });
  const alerts = disruptionsForStop(stop.id);
  const nearby = useMemo(() => nearbyStops(stop.id, 4), [stop.id]);

  const planTo = (direction: 'from' | 'to') => {
    if (!search) {
      pushToast('Plan a journey first, then use these shortcuts', 'warning');
      navigate(`/?${direction === 'from' ? 'from' : 'to'}=${stop.id}`);
      return;
    }
    startSearch({ ...search.query, ...(direction === 'from' ? { fromStopId: stop.id } : { toStopId: stop.id }), preferences });
    pushToast('Simulated results updated for this stop', 'success');
    navigate('/results');
  };

  return (
    <div className="stack" style={{ gap: 'var(--s-6)' }}>
      <PageHeader
        title={stop.name}
        description={`${stop.city} · ${stop.region} · stop code ${stop.code} (example identifier)`}
        breadcrumbs={[{ label: 'Stations & stops', to: '/stops' }, { label: stop.name }]}
        badge={<DemoBadge />}
        actions={
          <>
            <Button
              variant={favourite ? 'butter' : 'surface'}
              icon="star"
              onClick={() => toggleFavourite(stop.id)}
              aria-pressed={favourite}
            >
              {favourite ? 'Favourite location' : 'Add to favourites'}
            </Button>
            <Button icon="location" onClick={() => planTo('from')}>
              Plan from here
            </Button>
            <Button icon="arrowRight" onClick={() => planTo('to')}>
              Plan to here
            </Button>
          </>
        }
      />

      <div className="grid-4">
        <Stat label="Services" value={String(lines.length)} hint="Lines calling at this stop" />
        <Stat label="Departures today" value={String(boardTotal.length)} hint="In the generated window" />
        <Stat label="Example alerts" value={String(alerts.length)} hint="Simulated, never real" />
        <Stat label="Step-free" value={stop.accessibility.stepFree ? 'Yes' : 'No'} hint={stop.accessibility.lift ? 'Lift available' : 'No lift listed'} />
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div className="stack" style={{ gap: 'var(--s-4)' }}>
          <Card className="stack">
            <div className="between wrap">
              <h2 className="t-section">Stop information</h2>
              <div className="row-wrap">
                {stop.modes.map((mode) => (
                  <span key={mode} className={`mode-badge mode-badge--${mode}`}>
                    <ModeIcon mode={mode} size={13} />
                    {mode}
                  </span>
                ))}
              </div>
            </div>
            <dl className="dl">
              <dt>Type</dt>
              <dd>{stop.type}</dd>
              <dt>City</dt>
              <dd>{stop.city}</dd>
              <dt>Region</dt>
              <dd>{stop.region}</dd>
              <dt>Platforms / stops</dt>
              <dd>{stop.platforms.join(', ')}</dd>
              <dt>Facilities</dt>
              <dd>{stop.facilities.join(', ')}</dd>
              <dt>Bicycle</dt>
              <dd>
                {stop.bikeParking ? 'Secure bicycle parking' : 'No bicycle parking listed'}
                {stop.ovFiets ? ' · OV-fiets rental available' : ''}
              </dd>
            </dl>
            <h3 className="t-section" style={{ marginTop: 'var(--s-2)' }}>
              Accessibility (example data)
            </h3>
            <div className="row-wrap">
              <Pill tone={stop.accessibility.stepFree ? 'sage' : 'coral'}>
                {stop.accessibility.stepFree ? 'Step-free access' : 'Stairs only'}
              </Pill>
              <Pill tone={stop.accessibility.lift ? 'sage' : 'outline'}>{stop.accessibility.lift ? 'Lift' : 'No lift'}</Pill>
              <Pill tone={stop.accessibility.tactilePaving ? 'sage' : 'outline'}>
                {stop.accessibility.tactilePaving ? 'Tactile paving' : 'No tactile paving'}
              </Pill>
              <Pill tone={stop.accessibility.assistance ? 'sage' : 'outline'}>
                {stop.accessibility.assistance ? 'Staff assistance' : 'No staff assistance'}
              </Pill>
              <Pill tone={stop.accessibility.lowFloorBoarding ? 'sage' : 'outline'}>
                {stop.accessibility.lowFloorBoarding ? 'Low-floor boarding' : 'Not low-floor'}
              </Pill>
            </div>
          </Card>

          <Card className="stack">
            <div className="between wrap">
              <div className="stack-1">
                <h2 className="t-section">Simulated departure board</h2>
                <span className="t-sm t-muted">Showing from {format.time(fromMinutes)} — the current time in this browser</span>
              </div>
              <Link to={`/departures?stop=${stop.id}`} className="btn btn--sm">
                <Icon name="board" size={15} />
                Full board & filters
              </Link>
            </div>
            <DepartureTable departures={board} onSelectStop={(id) => navigate(`/stops/${id}`)} />
          </Card>

          <Card className="stack">
            <h2 className="t-section">Example alerts at this stop</h2>
            {alerts.length === 0 ? (
              <p className="t-sm t-muted">No simulated alerts affect this stop in the prototype dataset.</p>
            ) : (
              <ul className="stack-2">
                {alerts.map((alert) => (
                  <li key={alert.id} className="list-row list-row--static">
                    <span className="leg-row__marker">
                      <Icon name="alert" size={18} />
                    </span>
                    <span className="stack-1 grow">
                      <span className="t-strong t-sm">{alert.title}</span>
                      <span className="t-sm t-muted t-clamp-2">{alert.description}</span>
                    </span>
                    <Link to={`/disruptions/${alert.id}`} className="btn btn--sm">
                      Details
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <p className="t-sm t-faint">None of these alerts describe a real, current situation.</p>
          </Card>
        </div>

        <div className="stack" style={{ gap: 'var(--s-4)' }}>
          <Card className="stack">
            <div className="between">
              <h2 className="t-section">Position on the prototype map</h2>
              <Link to="/map" className="btn btn--sm">
                <Icon name="map" size={15} />
                Open map
              </Link>
            </div>
            <svg className="map-canvas" viewBox="0 0 40 40" role="img" aria-label="Schematic local view of this stop">
              <rect x="0" y="0" width="40" height="40" className="map-water" />
              <path className="map-land" d="M2 2 L38 1 L38 38 L2 38 Z" />
              {nearby.slice(0, 5).map((neighbour) => {
                const dx = neighbour.coordinates.x - stop.coordinates.x;
                const dy = neighbour.coordinates.y - stop.coordinates.y;
                return (
                  <g key={neighbour.id}>
                    <line
                      className="map-route--walk"
                      x1={20}
                      y1={20}
                      x2={20 + dx * 2.2}
                      y2={20 + dy * 2.2}
                    />
                    <g
                      className="map-stop"
                      transform={`translate(${20 + dx * 2.2} ${20 + dy * 2.2})`}
                      onClick={() => navigate(`/stops/${neighbour.id}`)}
                    >
                      <circle r={1.4} />
                      <text x={2} y={0.8}>
                        {neighbour.name}
                      </text>
                    </g>
                  </g>
                );
              })}
              <g className="map-stop map-stop--selected" transform="translate(20 20)">
                <circle r={2.2} />
                <text x={3} y={0.8}>
                  {stop.name}
                </text>
              </g>
            </svg>
            <p className="t-sm t-faint">
              Schematic local view drawn on the prototype's own canvas — not geographically accurate and not based on
              real map tiles.
            </p>
          </Card>

          <Card className="stack">
            <h2 className="t-section">Lines calling here</h2>
            {lines.length === 0 ? (
              <p className="t-sm t-muted">
                This is a walking landmark: it is reached on foot from the nearest stop rather than by a service.
              </p>
            ) : (
              <ul className="stack-2">
                {lines.map((line) => (
                  <li key={line.id} className="list-row list-row--static">
                    <span className="leg-row__marker">
                      <ModeIcon mode={line.mode} size={18} />
                    </span>
                    <span className="stack-1 grow">
                      <span className="t-strong t-sm">
                        {line.name} <span className="t-faint">· every {line.headway} min</span>
                      </span>
                      <span className="t-sm t-muted">
                        {operatorName(line.operatorId)} ·{' '}
                        {getLine(line.id)?.stops
                          .slice(0, 1)
                          .map((id) => stopLabel(id))
                          .join('')}{' '}
                        <Icon name="arrowRight" size={12} />{' '}
                        {stopLabel(getLine(line.id)?.stops[getLine(line.id)!.stops.length - 1])}
                      </span>
                    </span>
                    <Link to={`/disruptions?line=${line.id}`} className="btn btn--sm btn--ghost">
                      Alerts
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="stack">
            <h2 className="t-section">Nearby stops</h2>
            {nearby.length === 0 ? (
              <p className="t-sm t-muted">No other stop lies within walking distance in the demonstration layout.</p>
            ) : (
              <ul className="stack-2">
                {nearby.slice(0, 6).map((neighbour) => (
                  <li key={neighbour.id} className="list-row list-row--static">
                    <span className="stack-1 grow">
                      <Link to={`/stops/${neighbour.id}`} className="t-strong t-sm">
                        {neighbour.name}
                      </Link>
                      <span className="t-sm t-muted">
                        {walkMinutesBetween(stop, neighbour)} min walk (simulated) · {neighbour.modes.filter((m) => m !== 'walk' && m !== 'bike').join(', ') || 'walking only'}
                      </span>
                    </span>
                    <IconButton icon="chevronRight" label={`Open ${neighbour.name}`} onClick={() => navigate(`/stops/${neighbour.id}`)} />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Panel className="stack-2">
            <span className="field__label">Shortcuts</span>
            <div className="row-wrap">
              <Button size="sm" icon="route" onClick={() => planTo('from')}>
                From this stop
              </Button>
              <Button size="sm" icon="route" onClick={() => planTo('to')}>
                To this stop
              </Button>
              <Link to={`/departures?stop=${stop.id}`} className="btn btn--sm">
                <Icon name="board" size={15} />
                Departures
              </Link>
              <Link to="/disruptions" className="btn btn--sm">
                <Icon name="alert" size={15} />
                All alerts
              </Link>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
