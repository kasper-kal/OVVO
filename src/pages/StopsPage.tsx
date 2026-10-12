import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../state/AppState';
import { PageHeader } from '../components/layout/AppShell';
import { STOPS, boardStops, cities, regions } from '../data/stops';
import { PT_LABEL_ORDER } from '../lib/boardHelpers';
import {
  Button,
  Card,
  Chip,
  DemoBadge,
  EmptyState,
  IconButton,
  Panel,
  Pill,
  Segmented,
  Stat,
} from '../components/ui/primitives';
import { Icon, ModeIcon } from '../components/ui/Icons';
import type { PublicMode } from '../data/types';

export function StopsPage() {
  const navigate = useNavigate();
  const { favouriteStopIds, toggleFavourite, search, startSearch, preferences, pushToast } = useApp();
  const [query, setQuery] = useState('');
  const [modes, setModes] = useState<PublicMode[]>([]);
  const [type, setType] = useState<'any' | 'station' | 'airport' | 'busstop' | 'tramstop' | 'metrostop' | 'ferrystop' | 'landmark'>('any');
  const [region, setRegion] = useState('any');
  const [city, setCity] = useState('any');
  const [favouritesOnly, setFavouritesOnly] = useState(false);
  const [sort, setSort] = useState<'name' | 'city' | 'connections'>('city');

  const results = useMemo(() => {
    const normalised = query.trim().toLowerCase();
    const list = STOPS.filter((stop) => {
      if (normalised && !`${stop.name} ${stop.city} ${stop.code} ${stop.region}`.toLowerCase().includes(normalised)) return false;
      if (modes.length && !modes.some((mode) => stop.modes.includes(mode))) return false;
      if (type !== 'any' && stop.type !== type) return false;
      if (region !== 'any' && stop.region !== region) return false;
      if (city !== 'any' && stop.city !== city) return false;
      if (favouritesOnly && !favouriteStopIds.includes(stop.id)) return false;
      return true;
    });
    return list.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name, 'nl');
      if (sort === 'connections') return b.modes.length - a.modes.length || a.name.localeCompare(b.name, 'nl');
      return a.city.localeCompare(b.city, 'nl') || a.name.localeCompare(b.name, 'nl');
    });
  }, [query, modes, type, region, city, favouritesOnly, favouriteStopIds, sort]);

  const planTo = (stopId: string, direction: 'from' | 'to') => {
    if (!search) {
      pushToast('Plan a journey first, then use these shortcuts', 'warning');
      navigate(`/?${direction}=${stopId}`);
      return;
    }
    startSearch({
      ...search.query,
      ...(direction === 'from' ? { fromStopId: stopId } : { toStopId: stopId }),
      preferences,
    });
    pushToast(direction === 'from' ? 'Origin updated (simulated results)' : 'Destination updated (simulated results)', 'success');
    navigate('/results');
  };

  return (
    <div className="stack" style={{ gap: 'var(--s-6)' }}>
      <PageHeader
        title="Stations & stops"
        description="Every stop in the demonstration network has its own page with facilities, access information, a simulated departure board and example alerts."
        breadcrumbs={[{ label: 'Planner', to: '/' }, { label: 'Stations & stops' }]}
        badge={<DemoBadge />}
        actions={
          <Link to="/departures" className="btn">
            <Icon name="board" size={16} />
            Departure boards
          </Link>
        }
      />

      <div className="grid-4">
        <Stat label="Stops" value={String(STOPS.length)} hint="In the demonstration network" />
        <Stat label="With departure board" value={String(boardStops().length)} hint="Everything but walking landmarks" />
        <Stat label="Your favourites" value={String(favouriteStopIds.length)} hint="Stored in this browser" />
        <Stat label="Regions" value={String(regions().length)} hint="Grouped from the demo data" />
      </div>

      <Card className="stack">
        <div className="grid-2">
          <label className="field">
            <span className="field__label">Search stops</span>
            <input
              className="input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name, city, code or region"
            />
          </label>
          <label className="field">
            <span className="field__label">Region</span>
            <select className="select" value={region} onChange={(event) => setRegion(event.target.value)}>
              <option value="any">All regions</option>
              {regions().map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field__label">City</span>
            <select className="select" value={city} onChange={(event) => setCity(event.target.value)}>
              <option value="any">All cities</option>
              {cities().map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field__label">Sort by</span>
            <Segmented
              ariaLabel="Sort stops"
              value={sort}
              onChange={setSort}
              options={[
                { value: 'city', label: 'City' },
                { value: 'name', label: 'Name' },
                { value: 'connections', label: 'Connections' },
              ]}
            />
          </label>
        </div>

        <div className="row-wrap">
          <span className="field__label">Stop type</span>
          {(['any', 'station', 'airport', 'metrostop', 'tramstop', 'busstop', 'ferrystop', 'landmark'] as const).map((value) => (
            <Chip key={value} selected={type === value} onClick={() => setType(value)}>
              {value === 'any' ? 'All types' : value}
            </Chip>
          ))}
        </div>

        <div className="row-wrap">
          <span className="field__label">Modes at the stop</span>
          {PT_LABEL_ORDER.map((mode) => (
            <Chip
              key={mode}
              selected={modes.includes(mode)}
              onClick={() =>
                setModes((current) => (current.includes(mode) ? current.filter((m) => m !== mode) : [...current, mode]))
              }
            >
              <ModeIcon mode={mode} size={15} />
              {mode}
            </Chip>
          ))}
          <Chip selected={favouritesOnly} icon="star" onClick={() => setFavouritesOnly((value) => !value)}>
            Favourites only
          </Chip>
          <Button
            size="sm"
            variant="ghost"
            icon="refresh"
            onClick={() => {
              setQuery('');
              setModes([]);
              setType('any');
              setRegion('any');
              setCity('any');
              setFavouritesOnly(false);
              setSort('city');
            }}
          >
            Reset filters
          </Button>
        </div>
      </Card>

      <div className="between wrap">
        <span className="t-sm t-muted">{results.length} stops shown of {STOPS.length}</span>
        <span className="t-sm t-faint">Stop data is part of the prototype's demonstration set.</span>
      </div>

      {results.length === 0 ? (
        <EmptyState
          icon="search"
          title="No stops match these filters"
          description="Try a different search term or reset the filters to see the full demonstration list."
        />
      ) : (
        <ul className="grid-2" style={{ gap: 'var(--s-3)', alignItems: 'stretch' }}>
          {results.map((stop) => (
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
                <IconButton
                  icon="star"
                  label={favouriteStopIds.includes(stop.id) ? `Remove ${stop.name} from favourites` : `Add ${stop.name} to favourites`}
                  active={favouriteStopIds.includes(stop.id)}
                  variant={favouriteStopIds.includes(stop.id) ? 'butter' : 'surface'}
                  onClick={() => toggleFavourite(stop.id)}
                />
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
                {stop.accessibility.stepFree ? <Pill tone="sage">Step-free</Pill> : <Pill tone="coral">Stairs only</Pill>}
                {stop.ovFiets ? <Pill tone="outline">OV-fiets</Pill> : null}
              </div>
              <div className="row-wrap">
                <Link to={`/stops/${stop.id}`} className="btn btn--sm">
                  <Icon name="station" size={15} />
                  Stop page
                </Link>
                <Link to={`/departures?stop=${stop.id}`} className="btn btn--sm">
                  <Icon name="board" size={15} />
                  Departures
                </Link>
                <Button size="sm" icon="location" onClick={() => planTo(stop.id, 'from')}>
                  From here
                </Button>
                <Button size="sm" icon="arrowRight" onClick={() => planTo(stop.id, 'to')}>
                  To here
                </Button>
              </div>
            </Card>
          ))}
        </ul>
      )}

      <Panel className="stack-2">
        <span className="field__label">Accessibility information</span>
        <p className="t-sm">
          Each stop page lists step-free access, lifts, tactile paving, staff assistance, low-floor boarding, bicycle
          parking and OV-fiets availability. These are example properties of the demonstration dataset, not verified
          accessibility data.
        </p>
      </Panel>
    </div>
  );
}
