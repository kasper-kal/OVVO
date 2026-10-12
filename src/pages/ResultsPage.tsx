import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../state/AppState';
import { PageHeader } from '../components/layout/AppShell';
import { SearchForm } from '../components/journey/SearchForm';
import { JourneyCard } from '../components/journey/JourneyCard';
import { filterJourneys, sortJourneys } from '../data/journeyEngine';
import { PT_MODES, describePreferences } from '../data/preferences';
import { OPERATORS } from '../data/operators';
import { getStop, stopLabel } from '../data/stops';
import { disruptionsForStop } from '../data/disruptions';
import { Banner, Button, Card, Chip, DemoBadge, EmptyState, IconButton, Panel, Pill, Segmented } from '../components/ui/primitives';
import { Icon, ModeIcon } from '../components/ui/Icons';
import { useFormat } from '../lib/useFormat';
import { MODE_LABELS } from '../lib/format';
import type { PublicMode, SortMode } from '../data/types';

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: 'best', label: 'Best' },
  { value: 'fastest', label: 'Fastest' },
  { value: 'fewestTransfers', label: 'Fewest transfers' },
  { value: 'leastWalking', label: 'Least walking' },
  { value: 'cheapest', label: 'Cheapest' },
  { value: 'latestDeparture', label: 'Latest departure' },
];

export function ResultsPage() {
  const navigate = useNavigate();
  const {
    search,
    journeys,
    preferences,
    updateSearchQuery,
    startSearch,
    shiftWindow,
    setSortMode,
    setFilter,
    resetFilter,
    pushToast,
  } = useApp();
  const format = useFormat();
  const [editing, setEditing] = useState(false);

  const visible = useMemo(() => {
    if (!search) return [];
    const filtered = filterJourneys(journeys, search.filter, preferences);
    return sortJourneys(filtered, search.sortMode, preferences);
  }, [search, journeys, preferences]);

  if (!search) {
    return (
      <div className="stack" style={{ gap: 'var(--s-6)' }}>
        <PageHeader title="Journey results" description="No search has been run in this browser yet." badge={<DemoBadge />} />
        <EmptyState
          icon="search"
          title="Nothing to show yet"
          description="Plan a journey first — the results of your search will appear here and survive a refresh."
        >
          <Link to="/" className="btn btn--primary">
            <Icon name="search" size={16} />
            Open the journey planner
          </Link>
        </EmptyState>
      </div>
    );
  }

  const { query, filter, sortMode, windowOffsetMinutes } = search;
  const from = getStop(query.fromStopId);
  const to = getStop(query.toStopId);
  const stopAlerts = [...disruptionsForStop(query.fromStopId), ...disruptionsForStop(query.toStopId)].filter(
    (alert, index, list) => list.findIndex((item) => item.id === alert.id) === index,
  );
  const totalJourneys = journeys.length;

  const reverse = () => {
    startSearch({ ...query, fromStopId: query.toStopId, toStopId: query.fromStopId, preferences });
    pushToast('Journey reversed — simulated results updated');
  };

  return (
    <div className="stack" style={{ gap: 'var(--s-6)' }}>
      <PageHeader
        title={editing ? 'Modify your search' : 'Journey results'}
        description={
          editing
            ? 'Change any part of the search and run it again.'
            : `${stopLabel(query.fromStopId)} → ${stopLabel(query.toStopId)} on ${format.date(query.date)} at ${format.time(query.time)}, ${
                query.timeMode === 'depart' ? 'departing at or after' : 'arriving at or before'
              } that time.`
        }
        breadcrumbs={[{ label: 'Planner', to: '/' }, { label: 'Results' }]}
        badge={<DemoBadge />}
        actions={
          <>
            <Button icon="sliders" onClick={() => setEditing((value) => !value)}>
              {editing ? 'Close editor' : 'Modify search'}
            </Button>
            <Button icon="swap" onClick={reverse}>
              Reverse
            </Button>
          </>
        }
      />

      {editing ? (
        <Card hero>
          <SearchForm variant="inline" onSearch={() => setEditing(false)} />
        </Card>
      ) : (
        <Card className="stack">
          <div className="between wrap">
            <div className="row-3">
              <span className="leg-row__marker">
                <Icon name="route" size={18} />
              </span>
              <div className="stack-1">
                <span className="t-strong">
                  {stopLabel(query.fromStopId)} <Icon name="arrowRight" size={14} /> {stopLabel(query.toStopId)}
                </span>
                <span className="t-sm t-muted">
                  {format.date(query.date)} · {format.time(query.time)} ·{' '}
                  {query.timeMode === 'depart' ? 'depart at' : 'arrive by'} ·{' '}
                  {windowOffsetMinutes === 0 ? 'standard time window' : `window shifted ${windowOffsetMinutes > 0 ? '+' : ''}${windowOffsetMinutes} min`}
                </span>
              </div>
            </div>
            <div className="row-wrap">
              <Pill tone="sage">{from?.code}</Pill>
              <Pill tone="sage">{to?.code}</Pill>
              <Pill>{totalJourneys} simulated journeys</Pill>
            </div>
          </div>

          <div className="row-wrap">
            {describePreferences(preferences).map((part) => (
              <Pill key={part} tone="outline">
                {part}
              </Pill>
            ))}
            <Link to="/preferences" className="pill pill--obsidian">
              <Icon name="sliders" size={13} />
              Edit preferences
            </Link>
          </div>

          <div className="row-wrap">
            <Button icon="chevronLeft" onClick={() => shiftWindow(-30)}>
              Earlier options
            </Button>
            <Button icon="chevronRight" onClick={() => shiftWindow(30)}>
              Later options
            </Button>
            {windowOffsetMinutes !== 0 ? (
              <Button
                variant="ghost"
                icon="refresh"
                onClick={() => {
                  updateSearchQuery({});
                  pushToast('Time window reset');
                }}
              >
                Reset to {format.time(query.time)}
              </Button>
            ) : null}
            <Button variant="ghost" icon="swap" onClick={reverse}>
              Swap origin and destination
            </Button>
          </div>
          <p className="t-sm t-faint">
            Browsing earlier and later re-runs the local demonstration planner thirty minutes away from the searched
            time.
          </p>
        </Card>
      )}

      {stopAlerts.length > 0 ? (
        <Banner tone="hairline" icon="alert" title="Example alerts affect this search">
          <div className="stack-2">
            {stopAlerts.slice(0, 2).map((alert) => (
              <Link key={alert.id} to={`/disruptions/${alert.id}`} className="t-sm">
                <span className="t-strong">{alert.title}</span> — view simulated details
              </Link>
            ))}
          </div>
        </Banner>
      ) : null}

      <Card className="stack">
        <div className="between wrap">
          <Segmented ariaLabel="Sort journeys" value={sortMode} onChange={setSortMode} options={SORT_OPTIONS} />
          <span className="t-sm t-muted">{visible.length} of {totalJourneys} shown</span>
        </div>

        <div className="row-wrap">
          <span className="field__label">Transport modes</span>
          {PT_MODES.map((mode) => (
            <Chip
              key={mode}
              selected={filter.modes.includes(mode)}
              onClick={() =>
                setFilter({
                  modes: filter.modes.includes(mode)
                    ? filter.modes.filter((m) => m !== mode)
                    : [...filter.modes, mode as PublicMode],
                })
              }
            >
              <ModeIcon mode={mode} size={15} />
              {MODE_LABELS[mode]}
            </Chip>
          ))}
          {filter.modes.length ? (
            <Button size="sm" variant="ghost" icon="close" onClick={() => setFilter({ modes: [] })}>
              Clear mode filter
            </Button>
          ) : null}
        </div>

        <div className="row-wrap">
          <Chip selected={filter.directOnly} onClick={() => setFilter({ directOnly: !filter.directOnly })}>
            Direct journeys only
          </Chip>
          <Chip selected={filter.stepFreeOnly} onClick={() => setFilter({ stepFreeOnly: !filter.stepFreeOnly })}>
            Step-free only
          </Chip>
          <Chip selected={filter.delayedOnly} onClick={() => setFilter({ delayedOnly: !filter.delayedOnly })}>
            With example delays
          </Chip>
          <Chip selected={filter.hideCancelled} onClick={() => setFilter({ hideCancelled: !filter.hideCancelled })}>
            Hide cancelled
          </Chip>
          <Chip selected={filter.operatorIds.length > 0} onClick={() => setFilter({ operatorIds: [] })}>
            {filter.operatorIds.length ? `Operators: ${filter.operatorIds.length}` : 'All operators'}
          </Chip>
        </div>

        <div className="row-wrap">
          <span className="field__label">Operators</span>
          {OPERATORS.slice(0, 8).map((operator) => (
            <Chip
              key={operator.id}
              selected={filter.operatorIds.includes(operator.id)}
              onClick={() =>
                setFilter({
                  operatorIds: filter.operatorIds.includes(operator.id)
                    ? filter.operatorIds.filter((id) => id !== operator.id)
                    : [...filter.operatorIds, operator.id],
                })
              }
            >
              {operator.shortName}
            </Chip>
          ))}
          <Button size="sm" variant="ghost" icon="refresh" onClick={resetFilter}>
            Reset all filters
          </Button>
        </div>
      </Card>

      {visible.length === 0 ? (
        <EmptyState
          icon="filter"
          title="No journeys match the current filters"
          description="The demonstration planner found journeys for this search, but your preferences or filters removed all of them. Loosen a filter, allow another transport mode, or accept more transfers."
        >
          <Button variant="primary" icon="refresh" onClick={resetFilter}>
            Reset result filters
          </Button>
          <Link to="/preferences" className="btn">
            <Icon name="sliders" size={16} />
            Adjust travel preferences
          </Link>
          <Button
            icon="swap"
            onClick={() => {
              startSearch({ ...query, time: Math.min(1439, query.time + 60), preferences });
              pushToast('Search re-run one hour later');
            }}
          >
            Try one hour later
          </Button>
        </EmptyState>
      ) : (
        <ul className="stack" style={{ gap: 'var(--s-4)' }}>
          {visible.map((journey) => (
            <li key={journey.id}>
              <JourneyCard journey={journey} highlight={journey.label === 'fastest'} />
            </li>
          ))}
        </ul>
      )}

      <Panel className="stack-2">
        <div className="row">
          <Icon name="info" size={18} />
          <span className="t-strong t-sm">About these results</span>
        </div>
        <p className="t-sm">
          Results come from a local demonstration planner over {`the prototype's`} own stop list and service data.
          Fares, occupancy, delays and platforms are invented examples — no live transport feed is involved.
        </p>
        <div className="row-wrap">
          <Button size="sm" icon="arrowLeft" onClick={() => navigate('/')}>
            Back to planner
          </Button>
          <Link className="btn btn--sm" to={`/stops/${query.fromStopId}`}>
            <Icon name="station" size={15} />
            Departure stop
          </Link>
          <Link className="btn btn--sm" to={`/stops/${query.toStopId}`}>
            <Icon name="station" size={15} />
            Arrival stop
          </Link>
          <Link className="btn btn--sm" to="/map">
            <Icon name="map" size={15} />
            Map view
          </Link>
          <IconButton icon="info" label="Demo data notice" onClick={() => pushToast('All results in this prototype are simulated demonstration data.')} />
        </div>
      </Panel>
    </div>
  );
}
