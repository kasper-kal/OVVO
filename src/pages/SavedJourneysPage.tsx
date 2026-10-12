import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../state/AppState';
import { PageHeader } from '../components/layout/AppShell';
import { getLine } from '../data/network';
import { operatorName } from '../data/operators';
import { stopLabel } from '../data/stops';
import { Button, Card, DemoBadge, Dialog, EmptyState, Panel, Pill, Stat } from '../components/ui/primitives';
import { Icon, ModeIcon } from '../components/ui/Icons';
import { useFormat } from '../lib/useFormat';

export function SavedJourneysPage() {
  const navigate = useNavigate();
  const { savedJourneys, removeSavedJourney, startSearch, preferences, pushToast } = useApp();
  const format = useFormat();
  const [confirmClear, setConfirmClear] = useState(false);

  const totalWalk = savedJourneys.reduce((sum, item) => sum + item.journey.walkMinutes, 0);
  const directCount = savedJourneys.filter((item) => item.journey.transfers === 0).length;

  return (
    <div className="stack" style={{ gap: 'var(--s-6)' }}>
      <PageHeader
        title="Saved journeys"
        description="Journeys you kept while browsing the simulated results. They are stored in this browser and survive a refresh."
        breadcrumbs={[{ label: 'Planner', to: '/' }, { label: 'Saved journeys' }]}
        badge={<DemoBadge label="Stored on this device" />}
        actions={
          savedJourneys.length ? (
            <Button icon="trash" onClick={() => setConfirmClear(true)}>
              Clear saved journeys
            </Button>
          ) : null
        }
      />

      <div className="grid-4">
        <Stat label="Saved journeys" value={String(savedJourneys.length)} hint="Kept after a refresh" />
        <Stat label="Direct options" value={String(directCount)} hint="No transfers" />
        <Stat label="Walking in total" value={format.duration(totalWalk)} hint="Across your saved options" />
        <Stat label="Storage" value="This browser" hint="No account needed" />
      </div>

      {savedJourneys.length === 0 ? (
        <EmptyState
          icon="bookmark"
          title="No saved journeys yet"
          description="Open any option in the results list and use “Save journey” to keep it here for later comparison."
        >
          <Link to="/" className="btn btn--primary">
            <Icon name="search" size={16} />
            Plan a journey
          </Link>
          <Link to="/results" className="btn">
            <Icon name="route" size={16} />
            My current results
          </Link>
        </EmptyState>
      ) : (
        <ul className="stack" style={{ gap: 'var(--s-3)' }}>
          {savedJourneys.map((item) => {
            const journey = item.journey;
            const rideLegs = journey.legs.filter((leg) => leg.mode !== 'walk' && leg.mode !== 'bike');
            return (
              <Card as="li" key={item.id} className="stack-2">
                <div className="between wrap">
                  <div className="stack-1">
                    <span className="t-strong">
                      {stopLabel(journey.legs[0].fromStopId)} <Icon name="arrowRight" size={14} />{' '}
                      {stopLabel(journey.legs[journey.legs.length - 1].toStopId)}
                    </span>
                    <span className="t-sm t-muted">
                      {format.date(item.query.date)} · {format.time(journey.departure)} – {format.time(journey.arrival)} ·{' '}
                      {format.duration(journey.durationMinutes)} · saved {new Date(item.savedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="row-wrap">
                    {journey.transfers === 0 ? <Pill tone="sage">Direct</Pill> : <Pill>{journey.transfers} transfer(s)</Pill>}
                    {journey.delayMinutes ? <Pill tone="coral">Example delay +{journey.delayMinutes} min</Pill> : null}
                    <Pill tone="outline">€{journey.fare.eur.toFixed(2)}</Pill>
                  </div>
                </div>

                <div className="row-wrap">
                  {rideLegs.length ? (
                    rideLegs.map((leg) => (
                      <span key={leg.id} className="mode-badge">
                        <ModeIcon mode={leg.mode} size={13} />
                        {getLine(leg.lineId)?.number ?? leg.lineNumber} · {operatorName(leg.operatorId)}
                      </span>
                    ))
                  ) : (
                    <Pill>Walking only</Pill>
                  )}
                  <Pill tone="outline">{journey.walkMinutes} min walking</Pill>
                </div>

                <div className="row-wrap">
                  <Link to={`/journey/${journey.id}`} className="btn btn--primary btn--sm">
                    <Icon name="route" size={15} />
                    Journey details
                  </Link>
                  <Button
                    size="sm"
                    icon="search"
                    onClick={() => {
                      startSearch({ ...item.query, preferences });
                      pushToast('Search restored from your saved journey', 'success');
                      navigate('/results');
                    }}
                  >
                    Re-run this search
                  </Button>
                  <Link to={`/map?journey=${journey.id}`} className="btn btn--sm">
                    <Icon name="map" size={15} />
                    Map
                  </Link>
                  <Button size="sm" variant="ghost" icon="trash" onClick={() => removeSavedJourney(item.id)}>
                    Remove
                  </Button>
                </div>
              </Card>
            );
          })}
        </ul>
      )}

      <Panel className="stack-2">
        <span className="field__label">About saved journeys</span>
        <p className="t-sm">
          A saved journey keeps a snapshot of the simulated option together with the search that produced it, so it can
          be restored and compared later. Times inside the snapshot are demonstration data and will not change.
        </p>
      </Panel>

      <Dialog
        open={confirmClear}
        title="Clear all saved journeys?"
        description="This removes every saved journey from this browser. Favourites and preferences stay as they are."
        onClose={() => setConfirmClear(false)}
        footer={
          <>
            <Button
              variant="accent"
              icon="trash"
              onClick={() => {
                savedJourneys.forEach((item) => removeSavedJourney(item.id));
                setConfirmClear(false);
              }}
            >
              Yes, clear them
            </Button>
            <Button variant="ghost" onClick={() => setConfirmClear(false)}>
              Cancel
            </Button>
          </>
        }
      >
        <p className="t-sm">{savedJourneys.length} saved journey(s) will be removed.</p>
      </Dialog>
    </div>
  );
}
