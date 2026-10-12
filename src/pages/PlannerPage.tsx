import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../state/AppState';
import { SearchForm } from '../components/journey/SearchForm';
import { PageHeader } from '../components/layout/AppShell';
import { Button, Card, DemoBadge, DemoNotice, EmptyState, IconButton, Panel, Pill, SectionHeading, Stat } from '../components/ui/primitives';
import { Icon } from '../components/ui/Icons';
import { NETWORK } from '../data/network';
import { DISRUPTIONS } from '../data/disruptions';
import { STOPS, getStop, stopLabel } from '../data/stops';
import { nowMinutes, roundToStep, todayIso } from '../lib/format';
import { useFormat } from '../lib/useFormat';

const POPULAR: { from: string; to: string; tagline: string }[] = [
  { from: 'amsterdam-centraal', to: 'utrecht-centraal', tagline: 'Direct Intercity, every 30 minutes (simulated)' },
  { from: 'schiphol-airport', to: 'rotterdam-centraal', tagline: 'Airport to city centre with Intercity 900 (simulated)' },
  { from: 'groningen', to: 'zwolle', tagline: 'North to the IJssel line (simulated)' },
  { from: 'den-haag-centraal', to: 'eindhoven-centraal', tagline: 'Randstad to Brabant (simulated)' },
  { from: 'amsterdam-centraal', to: 'amsterdam-museumplein', tagline: 'City tram connection (simulated)' },
  { from: 'rotterdam-erasmusbrug', to: 'dordrecht', tagline: 'Waterbus across the delta (simulated)' },
];

export function PlannerPage() {
  const navigate = useNavigate();
  const { startSearch, preferences, recentSearches, favouriteStopIds, removeRecentSearch, pushToast } = useApp();
  const format = useFormat();

  const planPopular = (fromId: string, toId: string) => {
    startSearch({
      fromStopId: fromId,
      toStopId: toId,
      date: todayIso(),
      time: roundToStep(nowMinutes() + 10, 5),
      timeMode: 'depart',
      preferences,
    });
    pushToast(`Simulated journeys generated for ${stopLabel(fromId)} → ${stopLabel(toId)}`, 'success');
    navigate('/results');
  };

  return (
    <div className="stack" style={{ gap: 'var(--s-6)' }}>
      <PageHeader
        title="Where are you travelling today?"
        description="Plan a journey across the Dutch network demonstration. Everything on this page is generated locally from clearly labelled example data."
        badge={<DemoBadge />}
        actions={
          <>
            <Link to="/map" className="btn">
              <Icon name="map" size={16} />
              Illustrative map
            </Link>
            <Link to="/departures" className="btn">
              <Icon name="board" size={16} />
              Departure boards
            </Link>
          </>
        }
      />

      <DemoNotice />

      <div className="grid-4">
        <Stat label="Stops in the demo network" value={String(STOPS.length)} hint="Stations, stops and landmarks" />
        <Stat label="Simulated services" value={String(NETWORK.length)} hint="Train, metro, tram, bus and ferry" />
        <Stat label="Example alerts" value={String(DISRUPTIONS.length)} hint="None of them are real" />
        <Stat label="Interchanges" value={String(new Set(NETWORK.flatMap((line) => line.stops)).size)} hint="Every stop has a page" />
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <Card hero className="stack" as="div">
          <SectionHeading
            title="Journey planner"
            description="Origin, destination, date and time — with preferences and validation."
            icon="search"
          />
          <SearchForm />
        </Card>

        <div className="stack" style={{ gap: 'var(--s-4)' }}>
          <Card className="stack">
            <SectionHeading title="Popular demonstration journeys" icon="route" description="One tap fills the planner and runs the search." />
            <ul className="stack-2">
              {POPULAR.map((item) => (
                <li key={`${item.from}-${item.to}`}>
                  <button type="button" className="list-row" onClick={() => planPopular(item.from, item.to)}>
                    <span className="leg-row__marker">
                      <Icon name="route" size={18} />
                    </span>
                    <span className="stack-1 grow">
                      <span className="t-strong t-sm">
                        {stopLabel(item.from)} <Icon name="arrowRight" size={13} /> {stopLabel(item.to)}
                      </span>
                      <span className="t-sm t-muted">{item.tagline}</span>
                    </span>
                    <Icon name="chevronRight" size={18} />
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="stack">
            <SectionHeading
              title="Recent searches"
              description="Stored in this browser only."
              icon="history"
              action={
                recentSearches.length ? (
                  <Link to="/recent" className="btn btn--ghost btn--sm">
                    Manage
                  </Link>
                ) : null
              }
            />
            {recentSearches.length === 0 ? (
              <EmptyState
                icon="history"
                title="No searches yet"
                description="Run a search and it will appear here so you can repeat it in one tap."
              />
            ) : (
              <ul className="stack-2">
                {recentSearches.slice(0, 4).map((entry) => (
                  <li key={entry.id} className="list-row list-row--static">
                    <span className="stack-1 grow">
                      <span className="t-strong t-sm">
                        {stopLabel(entry.query.fromStopId)} <Icon name="arrowRight" size={13} />{' '}
                        {stopLabel(entry.query.toStopId)}
                      </span>
                      <span className="t-sm t-muted">
                        {format.date(entry.query.date, 'dayMonth')} · {format.time(entry.query.time)} ·{' '}
                        {entry.query.timeMode === 'depart' ? 'depart at' : 'arrive by'}
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
                    <IconButton icon="trash" label="Remove this search" onClick={() => removeRecentSearch(entry.id)} />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="stack">
            <SectionHeading title="Favourite locations" description="Starred stops appear here and in the planner." icon="star" />
            {favouriteStopIds.length === 0 ? (
              <EmptyState
                icon="star"
                title="No favourite locations"
                description="Open a station or stop page and use the star to keep it close."
              >
                <Link to="/stops" className="btn btn--primary">
                  Browse stops
                </Link>
              </EmptyState>
            ) : (
              <div className="row-wrap">
                {favouriteStopIds.map((stopId) => (
                  <Link key={stopId} to={`/stops/${stopId}`} className="chip" data-selected="false">
                    <Icon name="star" size={15} />
                    {stopLabel(stopId)}
                  </Link>
                ))}
              </div>
            )}
          </Card>

          <Panel variant="sage" className="stack-2">
            <div className="row">
              <Icon name="info" size={18} />
              <span className="t-strong t-sm">What this stage does not do</span>
            </div>
            <p className="t-sm">
              No live transport feeds, no real routing engine, no external geocoding and no device location. The
              planner runs a small local search over the demonstration network so the interface can be evaluated
              end to end.
            </p>
            <div className="row-wrap">
              <Pill tone="outline">Frontend prototype</Pill>
              <Pill tone="outline">{getStop('amsterdam-centraal')?.region} demo set</Pill>
              <Link to="/settings" className="pill pill--obsidian">
                Settings
              </Link>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
