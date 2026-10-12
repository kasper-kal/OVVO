import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../state/AppState';
import { PageHeader } from '../components/layout/AppShell';
import { PreferencesControls } from '../components/journey/PreferencesControls';
import { filterJourneys, sortJourneys } from '../data/journeyEngine';
import { stopLabel } from '../data/stops';
import { Button, Card, DemoBadge, EmptyState, Panel, Pill, Stat } from '../components/ui/primitives';
import { Icon } from '../components/ui/Icons';
import { useFormat } from '../lib/useFormat';

export function PreferencesPage() {
  const navigate = useNavigate();
  const { preferences, updatePreferences, resetPreferences, journeys, search, startSearch, pushToast } = useApp();
  const format = useFormat();

  const preview = useMemo(() => {
    if (!search) return null;
    const filtered = filterJourneys(journeys, { ...search.filter }, preferences);
    const sorted = sortJourneys(filtered, search.sortMode, preferences);
    return {
      total: journeys.length,
      matching: filtered.length,
      best: sorted[0],
    };
  }, [journeys, preferences, search]);

  return (
    <div className="stack" style={{ gap: 'var(--s-6)' }}>
      <PageHeader
        title="Travel preferences"
        description="These preferences shape the simulated search results: the planner respects them, the results list filters by them and the ordering changes with them."
        breadcrumbs={[{ label: 'Planner', to: '/' }, { label: 'Travel preferences' }]}
        badge={<DemoBadge label="Stored on this device" />}
        actions={
          <>
            <Button icon="refresh" onClick={() => { resetPreferences(); pushToast('Preferences reset to the prototype defaults'); }}>
              Reset to defaults
            </Button>
            {search ? (
              <Button
                variant="primary"
                icon="route"
                onClick={() => {
                  startSearch({ ...search.query, preferences });
                  pushToast('Results re-generated with these preferences', 'success');
                  navigate('/results');
                }}
              >
                Apply and view results
              </Button>
            ) : (
              <Link to="/" className="btn btn--primary">
                <Icon name="search" size={16} />
                Plan a journey
              </Link>
            )}
          </>
        }
      />

      {preview ? (
        <Card className="stack">
          <div className="between wrap">
            <div className="stack-1">
              <h2 className="t-section">Effect on your current search</h2>
              <span className="t-sm t-muted">
                {stopLabel(search!.query.fromStopId)} → {stopLabel(search!.query.toStopId)} ·{' '}
                {format.date(search!.query.date)} {format.time(search!.query.time)}
              </span>
            </div>
            <div className="row-wrap">
              <Pill tone="sage">{preview.matching} of {preview.total} journeys allowed</Pill>
              {preview.best ? (
                <Pill tone="butter">
                  Best now: {format.time(preview.best.departure)} → {format.time(preview.best.arrival)} ·{' '}
                  {format.duration(preview.best.durationMinutes)}
                </Pill>
              ) : (
                <Pill tone="coral">No journey matches these preferences</Pill>
              )}
            </div>
          </div>
          {preview.best ? (
            <div className="grid-3">
              <Stat label="Transfers" value={String(preview.best.transfers)} hint="In the best option" />
              <Stat label="Walking" value={`${preview.best.walkMinutes} min`} hint="Access and transfer walks" />
              <Stat label="Modes" value={preview.best.modes.filter((mode) => mode !== 'walk').join(', ') || 'walking'} hint="Used by the best option" />
            </div>
          ) : (
            <Panel variant="coral">
              <span className="t-sm">
                No simulated journey satisfies the current combination of modes, walking, transfers and accessibility
                requirements for this search. Loosen one requirement to see options again.
              </span>
            </Panel>
          )}
        </Card>
      ) : (
        <EmptyState
          icon="sliders"
          title="No active search to preview"
          description="Preferences are always saved, but the live effect can only be previewed once you have a search. Plan a journey to see it here."
        >
          <Link to="/" className="btn btn--primary">
            <Icon name="search" size={16} />
            Plan a journey
          </Link>
        </EmptyState>
      )}

      <Card hero className="stack">
        <h2 className="t-section">All preferences</h2>
        <PreferencesControls preferences={preferences} onChange={updatePreferences} />
      </Card>

      <Panel className="stack-2">
        <span className="field__label">Where each preference is applied</span>
        <ul className="stack-1 t-sm">
          <li>Allowed and avoided modes: filter the simulated journeys, including their connections.</li>
          <li>Maximum walking time and transfers: the planner will not propose options beyond the limits.</li>
          <li>Accessibility switches: only journeys whose stops meet the requirement are listed.</li>
          <li>Fewer transfers / less walking: change how the planner ranks and weights its options.</li>
          <li>Bicycle choice: adds a bicycle access leg or shows bicycle information on services.</li>
        </ul>
      </Panel>
    </div>
  );
}
