import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../state/AppState';
import { SearchForm } from '../components/journey/SearchForm';
import { Button, Card, IconButton, Pill } from '../components/ui/primitives';
import { Icon } from '../components/ui/Icons';
import { NETWORK } from '../data/network';
import { DISRUPTIONS } from '../data/disruptions';
import { STOPS, stopLabel } from '../data/stops';
import { nowMinutes, roundToStep, todayIso } from '../lib/format';
import { useFormat } from '../lib/useFormat';

const POPULAR: { from: string; to: string; tagline: string }[] = [
  { from: 'amsterdam-centraal', to: 'utrecht-centraal', tagline: 'Intercity every 30 min (simulated)' },
  { from: 'schiphol-airport', to: 'rotterdam-centraal', tagline: 'Intercity 900 (simulated)' },
  { from: 'groningen', to: 'zwolle', tagline: 'North to the IJssel line (simulated)' },
  { from: 'den-haag-centraal', to: 'eindhoven-centraal', tagline: 'Randstad to Brabant (simulated)' },
  { from: 'amsterdam-centraal', to: 'amsterdam-museumplein', tagline: 'Amsterdam tram connection (simulated)' },
  { from: 'rotterdam-erasmusbrug', to: 'dordrecht', tagline: 'Waterbus across the delta (simulated)' },
];

/**
 * The planner is the first thing on the page: a short intro, then the search
 * form, then quiet shortcuts. No stat blocks, no coloured banners.
 */
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
    <div className="stack" style={{ gap: 'var(--s-4)' }}>
      <header className="page-head">
        <div className="stack-1">
          <div className="row-wrap">
            <h1 className="t-h1">Plan a journey</h1>
            <Pill tone="outline">Simulated data</Pill>
          </div>
          <p className="t-sm t-muted" style={{ maxWidth: 620 }}>
            Fill in where you are going. Every time, platform and delay in this prototype is generated demonstration
            data.
          </p>
        </div>
      </header>

      <Card hero as="div">
        <SearchForm />
      </Card>

      <div className="grid-2">
        <Card className="stack-2">
          <h2 className="t-section">Popular journeys</h2>
          <ul className="stack-1">
            {POPULAR.map((item) => (
              <li key={`${item.from}-${item.to}`}>
                <button type="button" className="list-row" onClick={() => planPopular(item.from, item.to)}>
                  <span className="stack-1 grow">
                    <span className="t-strong t-sm">
                      {stopLabel(item.from)}{' '}
                      <Icon name="arrowRight" size={13} />{' '}
                      {stopLabel(item.to)}
                    </span>
                    <span className="t-sm t-faint">{item.tagline}</span>
                  </span>
                  <Icon name="chevronRight" size={16} />
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <div className="stack" style={{ gap: 'var(--s-3)' }}>
          <Card className="stack-2">
            <div className="between wrap">
              <h2 className="t-section">Recent searches</h2>
              {recentSearches.length ? (
                <Link to="/recent" className="t-sm t-muted">
                  Manage
                </Link>
              ) : null}
            </div>
            {recentSearches.length === 0 ? (
              <p className="t-sm t-faint">Searches you run are listed here and kept in this browser.</p>
            ) : (
              <ul className="stack-1">
                {recentSearches.slice(0, 4).map((entry) => (
                  <li key={entry.id} className="list-row list-row--static">
                    <span className="stack-1 grow">
                      <span className="t-strong t-sm">
                        {stopLabel(entry.query.fromStopId)} <Icon name="arrowRight" size={13} />{' '}
                        {stopLabel(entry.query.toStopId)}
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
                    <IconButton icon="trash" label="Remove this search" onClick={() => removeRecentSearch(entry.id)} />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="stack-2">
            <div className="between wrap">
              <h2 className="t-section">Favourite locations</h2>
              <Link to="/favourites" className="t-sm t-muted">
                Manage
              </Link>
            </div>
            {favouriteStopIds.length === 0 ? (
              <p className="t-sm t-faint">
                Star a stop on its page and it becomes a one-tap origin or destination here.
              </p>
            ) : (
              <div className="row-wrap">
                {favouriteStopIds.map((stopId) => (
                  <Link key={stopId} to={`/stops/${stopId}`} className="chip">
                    <Icon name="star" size={14} />
                    {stopLabel(stopId)}
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <p className="t-sm t-faint">
        Prototype dataset: {STOPS.length} stops, {NETWORK.length} simulated services and {DISRUPTIONS.length} example
        alerts. No live transport feeds, no routing engine, no geocoding and no device location.
      </p>
    </div>
  );
}
