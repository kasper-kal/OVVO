import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../state/AppState';
import { PageHeader } from '../components/layout/AppShell';
import { stopLabel } from '../data/stops';
import { Button, Card, DemoBadge, Dialog, EmptyState, Panel, Pill, Stat } from '../components/ui/primitives';
import { Icon } from '../components/ui/Icons';
import { useFormat } from '../lib/useFormat';

export function RecentSearchesPage() {
  const navigate = useNavigate();
  const { recentSearches, removeRecentSearch, clearRecentSearches, startSearch, preferences, pushToast, favouriteStopIds } = useApp();
  const format = useFormat();
  const [query, setQuery] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  const results = useMemo(() => {
    const normalised = query.trim().toLowerCase();
    if (!normalised) return recentSearches;
    return recentSearches.filter((entry) =>
      `${stopLabel(entry.query.fromStopId)} ${stopLabel(entry.query.toStopId)}`.toLowerCase().includes(normalised),
    );
  }, [recentSearches, query]);

  return (
    <div className="stack" style={{ gap: 'var(--s-6)' }}>
      <PageHeader
        title="Recent searches"
        description="The last searches you ran in this browser. Repeat one with a single tap — the results are regenerated from the demonstration data."
        breadcrumbs={[{ label: 'Planner', to: '/' }, { label: 'Recent searches' }]}
        badge={<DemoBadge label="Stored on this device" />}
        actions={
          recentSearches.length ? (
            <Button icon="trash" onClick={() => setConfirmClear(true)}>
              Clear history
            </Button>
          ) : null
        }
      />

      <div className="grid-4">
        <Stat label="Stored searches" value={String(recentSearches.length)} hint="Maximum of twelve" />
        <Stat
          label="With favourites"
          value={String(
            recentSearches.filter(
              (entry) => favouriteStopIds.includes(entry.query.fromStopId) || favouriteStopIds.includes(entry.query.toStopId),
            ).length,
          )}
          hint="Involving a starred stop"
        />
        <Stat label="Storage" value="This browser" hint="No account needed" />
        <Stat label="Most recent" value={recentSearches[0] ? new Date(recentSearches[0].at).toLocaleTimeString() : '—'} hint="Local time" />
      </div>

      <Card className="stack">
        <label className="field">
          <span className="field__label">Filter history</span>
          <input
            className="input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter by stop or city"
          />
        </label>
      </Card>

      {recentSearches.length === 0 ? (
        <EmptyState
          icon="history"
          title="No recent searches"
          description="Run a search from the planner and it will be listed here for quick reuse."
        >
          <Link to="/" className="btn btn--primary">
            <Icon name="search" size={16} />
            Open the journey planner
          </Link>
        </EmptyState>
      ) : results.length === 0 ? (
        <EmptyState
          icon="search"
          title="No stored search matches that filter"
          description="Clear the filter field to see your full history again."
        >
          <Button icon="close" onClick={() => setQuery('')}>
            Clear filter
          </Button>
        </EmptyState>
      ) : (
        <ul className="stack" style={{ gap: 'var(--s-3)' }}>
          {results.map((entry) => (
            <Card as="li" key={entry.id} className="stack-2">
              <div className="between wrap">
                <div className="stack-1">
                  <span className="t-strong">
                    {stopLabel(entry.query.fromStopId)} <Icon name="arrowRight" size={14} />{' '}
                    {stopLabel(entry.query.toStopId)}
                  </span>
                  <span className="t-sm t-muted">
                    {format.date(entry.query.date)} · {format.time(entry.query.time)} ·{' '}
                    {entry.query.timeMode === 'depart' ? 'depart at' : 'arrive by'} · searched{' '}
                    {new Date(entry.at).toLocaleString()}
                  </span>
                </div>
                <div className="row-wrap">
                  <Pill tone="outline">{entry.query.preferences.allowedModes.length} modes</Pill>
                  {entry.query.preferences.avoidedModes.length ? <Pill tone="coral">avoiding {entry.query.preferences.avoidedModes.join(', ')}</Pill> : null}
                </div>
              </div>
              <div className="row-wrap">
                <Button
                  size="sm"
                  variant="primary"
                  icon="search"
                  onClick={() => {
                    startSearch({ ...entry.query, preferences });
                    pushToast('Search repeated with current preferences', 'success');
                    navigate('/results');
                  }}
                >
                  Repeat search
                </Button>
                <Button
                  size="sm"
                  icon="swap"
                  onClick={() => {
                    startSearch(
                      { ...entry.query, fromStopId: entry.query.toStopId, toStopId: entry.query.fromStopId, preferences },
                    );
                    pushToast('Reversed search repeated', 'success');
                    navigate('/results');
                  }}
                >
                  Reverse and repeat
                </Button>
                <Button size="sm" variant="ghost" icon="trash" onClick={() => removeRecentSearch(entry.id)}>
                  Remove
                </Button>
              </div>
            </Card>
          ))}
        </ul>
      )}

      <Panel className="stack-2">
        <span className="field__label">Privacy of this prototype</span>
        <p className="t-sm">
          Search history, favourites, saved journeys and preferences are kept in this browser's local storage. Nothing
          is uploaded, and there is no account or server component in this stage.
        </p>
        <div className="row-wrap">
          <Link to="/settings" className="btn btn--sm">
            <Icon name="settings" size={15} />
            Manage stored data
          </Link>
          <Link to="/preferences" className="btn btn--sm">
            <Icon name="sliders" size={15} />
            Travel preferences
          </Link>
        </div>
      </Panel>

      <Dialog
        open={confirmClear}
        title="Clear search history?"
        description="Every stored search is removed from this browser. Favourites, saved journeys and preferences are kept."
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
              Yes, clear history
            </Button>
            <Button variant="ghost" onClick={() => setConfirmClear(false)}>
              Cancel
            </Button>
          </>
        }
      >
        <p className="t-sm">{recentSearches.length} stored search(es) will be removed.</p>
      </Dialog>
    </div>
  );
}
