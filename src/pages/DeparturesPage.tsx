import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../state/AppState';
import { PageHeader } from '../components/layout/AppShell';
import { DepartureTable } from '../components/stops/DepartureTable';
import { boardStops, getStop, stopLabel } from '../data/stops';
import { boardForStop, busiestStops, filterDepartures } from '../data/departures';
import { disruptionsForStop } from '../data/disruptions';
import { nowMinutes, PT_LABEL_ORDER } from '../lib/boardHelpers';
import type { PublicMode } from '../data/types';
import { Button, Card, Chip, DemoBadge, EmptyState, IconButton, Panel, Stat } from '../components/ui/primitives';
import { Icon, ModeIcon } from '../components/ui/Icons';
import { useFormat } from '../lib/useFormat';

export function DeparturesPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { settings, favouriteStopIds, toggleFavourite, search, startSearch, preferences, pushToast } = useApp();
  const format = useFormat();

  const requestedStop = params.get('stop');
  const initialStop =
    (requestedStop && getStop(requestedStop)?.id) ||
    settings.defaultOriginStopId ||
    busiestStops(1)[0] ||
    boardStops()[0].id;

  const [stopId, setStopId] = useState(initialStop);
  const [tick, setTick] = useState(0);
  const [modeFilter, setModeFilter] = useState<PublicMode[]>([]);
  const [lineQuery, setLineQuery] = useState('');
  const [destinationQuery, setDestinationQuery] = useState('');
  const [delayedOnly, setDelayedOnly] = useState(false);
  const [hideCancelled, setHideCancelled] = useState(false);
  const [accessibleOnly, setAccessibleOnly] = useState(false);
  const [countdown, setCountdown] = useState<number>(settings.boardAutoRefresh);

  const stop = getStop(stopId);
  const fromMinutes = useMemo(() => Math.max(0, nowMinutes() - 1), [tick]);
  const rawBoard = useMemo(
    () => boardForStop(stopId, { fromMinutes, limit: 30, tick }),
    [stopId, fromMinutes, tick],
  );

  const board = useMemo(() => {
    const filtered = filterDepartures(rawBoard, {
      fromMinutes,
      modeFilter,
      lineQuery,
      destinationQuery,
    });
    return filtered
      .filter((departure) => (delayedOnly ? departure.delayMinutes > 0 || departure.cancelled : true))
      .filter((departure) => (hideCancelled ? !departure.cancelled : true))
      .filter((departure) => (accessibleOnly ? departure.accessible : true));
  }, [rawBoard, modeFilter, lineQuery, destinationQuery, delayedOnly, hideCancelled, accessibleOnly, fromMinutes]);

  useEffect(() => {
    setCountdown(settings.boardAutoRefresh);
    if (!settings.boardAutoRefresh) return undefined;
    const timer = window.setInterval(() => {
      setCountdown((value) => {
        if (value <= 1) {
          setTick((current) => current + 1);
          return settings.boardAutoRefresh;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [settings.boardAutoRefresh]);

  const alerts = disruptionsForStop(stopId);
  const delayedCount = rawBoard.filter((departure) => departure.delayMinutes > 0).length;
  const cancelledCount = rawBoard.filter((departure) => departure.cancelled).length;

  const selectStop = (nextStopId: string) => {
    setStopId(nextStopId);
    setParams({ stop: nextStopId }, { replace: true });
  };

  return (
    <div className="stack" style={{ gap: 'var(--s-6)' }}>
      <PageHeader
        title="Departure boards"
        description="Simulated departure times generated from the prototype's own network data. Filters below search that local list."
        breadcrumbs={[{ label: 'Planner', to: '/' }, { label: 'Departure boards' }]}
        badge={<DemoBadge label="Simulated departures" />}
        actions={
          <>
            <Button icon="refresh" onClick={() => { setTick((value) => value + 1); pushToast('Board re-simulated'); }}>
              Refresh board
            </Button>
            {stop ? (
              <Link to={`/stops/${stop.id}`} className="btn">
                <Icon name="station" size={16} />
                Stop page
              </Link>
            ) : null}
          </>
        }
      />

      <Card className="stack">
        <div className="between wrap">
          <div className="stack-1">
            <label className="field__label" htmlFor="board-stop">
              Choose a stop
            </label>
            <select
              id="board-stop"
              className="select"
              value={stopId}
              onChange={(event) => selectStop(event.target.value)}
              style={{ minWidth: 280 }}
            >
              {[...boardStops()]
                .sort((a, b) => a.city.localeCompare(b.city, 'nl') || a.name.localeCompare(b.name, 'nl'))
                .map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.city} — {entry.name} ({entry.code})
                  </option>
                ))}
            </select>
          </div>
          <div className="row-wrap">
            <span className="field__label">Busiest in this demo</span>
            {busiestStops(4).map((id) => (
              <Chip key={id} selected={id === stopId} onClick={() => selectStop(id)}>
                {stopLabel(id)}
              </Chip>
            ))}
          </div>
          {favouriteStopIds.length ? (
            <div className="row-wrap">
              <span className="field__label">Favourites</span>
              {favouriteStopIds.slice(0, 5).map((id) => (
                <Chip key={id} selected={id === stopId} icon="star" onClick={() => selectStop(id)}>
                  {stopLabel(id)}
                </Chip>
              ))}
            </div>
          ) : null}
        </div>

        <div className="grid-4">
          <Stat label="Departures shown" value={String(board.length)} hint={`of ${rawBoard.length} in this window`} />
          <Stat label="Example delays" value={String(delayedCount)} hint="In the generated window" />
          <Stat label="Example cancellations" value={String(cancelledCount)} hint="In the generated window" />
          <Stat
            label="Auto refresh"
            value={settings.boardAutoRefresh ? `${settings.boardAutoRefresh}s` : 'Off'}
            hint={settings.boardAutoRefresh ? `Next in ${countdown}s` : 'Change this in Settings'}
          />
        </div>

        <div className="row-wrap">
          <span className="field__label">Modes</span>
          {PT_LABEL_ORDER.map((mode) => (
            <Chip
              key={mode}
              selected={modeFilter.includes(mode)}
              onClick={() =>
                setModeFilter((current) =>
                  current.includes(mode) ? current.filter((item) => item !== mode) : [...current, mode],
                )
              }
            >
              <ModeIcon mode={mode} size={15} />
              {mode}
            </Chip>
          ))}
          {modeFilter.length ? (
            <Button size="sm" variant="ghost" icon="close" onClick={() => setModeFilter([])}>
              Clear modes
            </Button>
          ) : null}
        </div>

        <div className="grid-2">
          <label className="field">
            <span className="field__label">Filter by service number or line</span>
            <input
              className="input"
              value={lineQuery}
              onChange={(event) => setLineQuery(event.target.value)}
              placeholder="e.g. 800, tram, RS30"
            />
          </label>
          <label className="field">
            <span className="field__label">Filter by destination</span>
            <input
              className="input"
              value={destinationQuery}
              onChange={(event) => setDestinationQuery(event.target.value)}
              placeholder="e.g. Utrecht, Schiphol"
            />
          </label>
        </div>

        <div className="row-wrap">
          <Chip selected={delayedOnly} onClick={() => setDelayedOnly((value) => !value)}>
            Only delayed or cancelled
          </Chip>
          <Chip selected={hideCancelled} onClick={() => setHideCancelled((value) => !value)}>
            Hide cancelled
          </Chip>
          <Chip selected={accessibleOnly} onClick={() => setAccessibleOnly((value) => !value)}>
            Accessible boarding only
          </Chip>
          <Button
            size="sm"
            variant="ghost"
            icon="refresh"
            onClick={() => {
              setModeFilter([]);
              setLineQuery('');
              setDestinationQuery('');
              setDelayedOnly(false);
              setHideCancelled(false);
              setAccessibleOnly(false);
            }}
          >
            Reset all board filters
          </Button>
        </div>
      </Card>

      {stop ? (
        <Card className="stack">
          <div className="between wrap">
            <div className="row-3">
              <span className="leg-row__marker">
                <Icon name="board" size={18} />
              </span>
              <div className="stack-1">
                <span className="t-strong">{stop.name}</span>
                <span className="t-sm t-muted">
                  {stop.city} · {stop.code} · {stop.region} · board from {format.time(fromMinutes)} (current time in this
                  browser)
                </span>
              </div>
            </div>
            <div className="row-wrap">
              {stop.modes
                .filter((mode) => mode !== 'walk' && mode !== 'bike')
                .map((mode) => (
                  <span key={mode} className={`mode-badge mode-badge--${mode}`}>
                    <ModeIcon mode={mode} size={13} />
                    {mode}
                  </span>
                ))}
              <IconButton
                icon="star"
                label={favouriteStopIds.includes(stop.id) ? 'Remove favourite location' : 'Add favourite location'}
                active={favouriteStopIds.includes(stop.id)}
                variant={favouriteStopIds.includes(stop.id) ? 'butter' : 'surface'}
                onClick={() => toggleFavourite(stop.id)}
              />
              <Button
                size="sm"
                icon="location"
                onClick={() => {
                  if (!search) {
                    pushToast('Plan a journey first to use this shortcut', 'warning');
                    return;
                  }
                  startSearch({ ...search.query, fromStopId: stop.id, preferences });
                  navigate('/results');
                }}
              >
                Plan from here
              </Button>
              <Button
                size="sm"
                icon="arrowRight"
                onClick={() => {
                  if (!search) {
                    pushToast('Plan a journey first to use this shortcut', 'warning');
                    return;
                  }
                  startSearch({ ...search.query, toStopId: stop.id, preferences });
                  navigate('/results');
                }}
              >
                Plan to here
              </Button>
            </div>
          </div>

          {alerts.length ? (
            <div className="row-wrap">
              <span className="field__label">Example alerts at this stop</span>
              {alerts.map((alert) => (
                <Link key={alert.id} to={`/disruptions/${alert.id}`} className="pill pill--coral">
                  <Icon name="alert" size={13} />
                  {alert.title}
                </Link>
              ))}
            </div>
          ) : null}

          <DepartureTable departures={board} onSelectStop={(id) => navigate(`/stops/${id}`)} />

          <p className="t-sm t-faint">
            The board reflects the current time in your browser and is regenerated each time you refresh or the
            auto-refresh interval elapses. Every entry is simulated demonstration data.
          </p>
        </Card>
      ) : (
        <EmptyState icon="board" title="Choose a stop" description="Select a stop above to see its simulated departure board." />
      )}

      <Panel className="stack-2">
        <span className="field__label">How this board works</span>
        <ul className="stack-1 t-sm">
          <li>Departures are generated from the prototype's own service lines and headways.</li>
          <li>Delays, cancellations and platforms are deliberately invented examples so the interface can be tested.</li>
          <li>Filters and the search fields run entirely against this local demonstration list.</li>
          <li>Auto-refresh can be set to off, 30 or 60 seconds in Settings.</li>
        </ul>
      </Panel>
    </div>
  );
}
