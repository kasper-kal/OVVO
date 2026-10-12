import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../state/AppState';
import { PageHeader } from '../components/layout/AppShell';
import { StopCombobox } from '../components/journey/StopCombobox';
import { getStop, stopLabel } from '../data/stops';
import { disruptionsForStop } from '../data/disruptions';
import { Button, Card, DemoBadge, Dialog, EmptyState, Panel, Pill, Stat } from '../components/ui/primitives';
import { Icon, ModeIcon } from '../components/ui/Icons';
import type { Stop } from '../data/types';

export function FavouritesPage() {
  const navigate = useNavigate();
  const { favouriteStopIds, toggleFavourite, search, startSearch, preferences, pushToast } = useApp();
  const [picker, setPicker] = useState<Stop | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const stops = favouriteStopIds.map((id) => getStop(id)).filter((stop): stop is Stop => Boolean(stop));

  const planTo = (stopId: string, direction: 'from' | 'to') => {
    if (!search) {
      navigate(`/?${direction}=${stopId}`);
      pushToast('Opened the planner with this stop pre-filled', 'default');
      return;
    }
    startSearch({ ...search.query, ...(direction === 'from' ? { fromStopId: stopId } : { toStopId: stopId }), preferences });
    pushToast('Simulated results updated', 'success');
    navigate('/results');
  };

  return (
    <div className="stack" style={{ gap: 'var(--s-6)' }}>
      <PageHeader
        title="Favourite locations"
        description="Starred stops live in this browser only. They appear as quick fill options in the planner and as departure-board shortcuts."
        breadcrumbs={[{ label: 'Planner', to: '/' }, { label: 'Favourite locations' }]}
        badge={<DemoBadge label="Stored on this device" />}
        actions={
          favouriteStopIds.length ? (
            <Button icon="trash" onClick={() => setConfirmClear(true)}>
              Remove all favourites
            </Button>
          ) : null
        }
      />

      <div className="grid-4">
        <Stat label="Favourite stops" value={String(stops.length)} hint="Kept after a refresh" />
        <Stat label="With step-free access" value={String(stops.filter((stop) => stop.accessibility.stepFree).length)} hint="Example data" />
        <Stat
          label="With example alerts"
          value={String(stops.filter((stop) => disruptionsForStop(stop.id).length > 0).length)}
          hint="Simulated alerts at the stop"
        />
        <Stat label="Storage" value="This browser" hint="No account, no server" />
      </div>

      <Card className="stack">
        <h2 className="t-section">Add a location</h2>
        <StopCombobox
          id="favourite-picker"
          label="Find a stop to keep"
          value={picker}
          onSelect={(stop) => {
            setPicker(stop);
            if (stop) {
              if (!favouriteStopIds.includes(stop.id)) toggleFavourite(stop.id);
              else pushToast('This stop is already one of your favourites');
              setPicker(null);
            }
          }}
          placeholder="Search stations, stops and landmarks"
        />
      </Card>

      {stops.length === 0 ? (
        <EmptyState
          icon="star"
          title="No favourite locations yet"
          description="Use the star button on any stop page, departure board or map marker to keep it here."
        >
          <Link to="/stops" className="btn btn--primary">
            <Icon name="station" size={16} />
            Browse stations & stops
          </Link>
          <Link to="/map" className="btn">
            <Icon name="map" size={16} />
            Pick one on the map
          </Link>
        </EmptyState>
      ) : (
        <ul className="grid-2" style={{ gap: 'var(--s-3)' }}>
          {stops.map((stop) => {
            const alerts = disruptionsForStop(stop.id);
            return (
              <Card as="li" key={stop.id} className="stack-2">
                <div className="between wrap">
                  <div className="stack-1">
                    <Link to={`/stops/${stop.id}`} className="t-strong">
                      {stop.name}
                    </Link>
                    <span className="t-sm t-muted">
                      {stop.city} · {stop.code} · {stop.type}
                    </span>
                  </div>
                  <Button
                    variant="butter"
                    size="sm"
                    icon="star"
                    onClick={() => toggleFavourite(stop.id)}
                    aria-label={`Remove ${stop.name} from favourites`}
                  >
                    Favourite
                  </Button>
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
                  {stop.accessibility.stepFree ? <Pill tone="sage">Step-free</Pill> : <Pill tone="coral">Not step-free</Pill>}
                  {alerts.length ? <Pill tone="coral">{alerts.length} example alert(s)</Pill> : null}
                </div>

                <div className="row-wrap">
                  <Button size="sm" icon="location" onClick={() => planTo(stop.id, 'from')}>
                    Plan from here
                  </Button>
                  <Button size="sm" icon="arrowRight" onClick={() => planTo(stop.id, 'to')}>
                    Plan to here
                  </Button>
                  <Link to={`/departures?stop=${stop.id}`} className="btn btn--sm">
                    <Icon name="board" size={15} />
                    Departures
                  </Link>
                  <Link to={`/stops/${stop.id}`} className="btn btn--sm">
                    <Icon name="station" size={15} />
                    Stop page
                  </Link>
                </div>

                {alerts.length ? (
                  <div className="row-wrap">
                    {alerts.slice(0, 2).map((alert) => (
                      <Link key={alert.id} to={`/disruptions/${alert.id}`} className="pill pill--coral">
                        <Icon name="alert" size={13} />
                        {alert.title}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </Card>
            );
          })}
        </ul>
      )}

      <Panel className="stack-2">
        <span className="field__label">Where favourites are used</span>
        <ul className="stack-1 t-sm">
          <li>Quick fill buttons in the journey planner (origin or destination).</li>
          <li>Filter "favourites only" on the stops list and on the disruption overview.</li>
          <li>Shortcut chips on the departure-board page.</li>
        </ul>
      </Panel>

      <Dialog
        open={confirmClear}
        title="Remove all favourite locations?"
        description="This clears the favourites stored in this browser. Saved journeys and recent searches are not touched."
        onClose={() => setConfirmClear(false)}
        footer={
          <>
            <Button
              variant="accent"
              icon="trash"
              onClick={() => {
                favouriteStopIds.forEach((id) => toggleFavourite(id));
                setConfirmClear(false);
                pushToast('All favourite locations removed');
              }}
            >
              Yes, remove all
            </Button>
            <Button variant="ghost" onClick={() => setConfirmClear(false)}>
              Keep favourites
            </Button>
          </>
        }
      >
        <p className="t-sm">{stopLabel(stops[0]?.id)} and {Math.max(0, stops.length - 1)} other stop(s) will be removed.</p>
      </Dialog>
    </div>
  );
}
