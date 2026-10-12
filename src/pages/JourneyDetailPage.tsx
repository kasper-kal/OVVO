import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../state/AppState';
import { BackButton, PageHeader } from '../components/layout/AppShell';
import { LegList } from '../components/journey/LegList';
import { JOURNEY_LABELS } from '../data/journeyEngine';
import { getStop, stopLabel } from '../data/stops';
import { operatorName } from '../data/operators';
import { getLine } from '../data/network';
import { getDisruption } from '../data/disruptions';
import {
  AvatarStack,
  Banner,
  Button,
  Card,
  DemoBadge,
  EmptyState,
  Meter,
  Panel,
  Pill,
  Sparkline,
  Stat,
} from '../components/ui/primitives';
import { Icon, ModeIcon } from '../components/ui/Icons';
import { useFormat } from '../lib/useFormat';

export function JourneyDetailPage() {
  const { journeyId } = useParams();
  const navigate = useNavigate();
  const { findJourney, search, preferences, startSearch, isJourneySaved, saveJourney, savedJourneys, pushToast } = useApp();
  const format = useFormat();
  const journey = findJourney(journeyId);
  const saved = journey ? isJourneySaved(journey.signature) : false;

  if (!journey) {
    return (
      <div className="stack" style={{ gap: 'var(--s-6)' }}>
        <PageHeader
          title="Journey no longer in this session"
          description="The demonstration planner regenerates journeys per search, so this option is not available right now."
          breadcrumbs={[{ label: 'Planner', to: '/' }, { label: 'Journey details' }]}
        />
        <EmptyState
          icon="route"
          title="This journey could not be restored"
          description="Re-run the search to generate the simulated options again, or open one of your saved journeys."
        >
          <Link to="/" className="btn btn--primary">
            <Icon name="search" size={16} />
            Plan a new journey
          </Link>
          <Link to="/journeys" className="btn">
            <Icon name="bookmark" size={16} />
            Saved journeys ({savedJourneys.length})
          </Link>
          {search ? (
            <Button
              icon="refresh"
              onClick={() => {
                startSearch({ ...search.query, preferences });
                pushToast('Search re-run');
                navigate('/results');
              }}
            >
              Re-run my last search
            </Button>
          ) : null}
        </EmptyState>
      </div>
    );
  }

  const from = getStop(journey.legs[0].fromStopId);
  const to = getStop(journey.legs[journey.legs.length - 1].toStopId);
  const rideLegs = journey.legs.filter((leg) => leg.mode !== 'walk' && leg.mode !== 'bike');
  const operators = [...new Set(journey.operatorIds)].map((id) => operatorName(id));
  const disruptions = journey.disruptionIds.map((id) => getDisruption(id)).filter(Boolean);
  const transfers = journey.legs
    .filter((leg) => leg.mode !== 'walk' && leg.mode !== 'bike')
    .slice(0, -1)
    .map((leg, index) => ({ leg, next: journey.legs[journey.legs.indexOf(leg) + 1], index }));

  return (
    <div className="stack" style={{ gap: 'var(--s-6)' }}>
      <PageHeader
        title={`${stopLabel(journey.legs[0].fromStopId)} → ${stopLabel(journey.legs[journey.legs.length - 1].toStopId)}`}
        description={`${format.date(search?.query.date ?? '')} · departs ${format.time(journey.departure)} · arrives ${format.time(
          journey.arrival,
        )} · ${journey.transfers === 0 ? 'direct' : `${journey.transfers} transfer(s)`}`}
        breadcrumbs={[{ label: 'Planner', to: '/' }, { label: 'Results', to: '/results' }, { label: 'Journey details' }]}
        badge={<DemoBadge />}
        actions={
          <>
            <BackButton to="/results" label="Back to results" />
            {search ? (
              <Button
                icon="sliders"
                onClick={() => {
                  startSearch({ ...search.query, fromStopId: journey.legs[journey.legs.length - 1].toStopId, toStopId: journey.legs[0].fromStopId, preferences });
                  pushToast('Return journey planned with simulated data', 'success');
                  navigate('/results');
                }}
              >
                Plan return journey
              </Button>
            ) : null}
          </>
        }
      />

      <div className="grid-4">
        <Stat label="Departure" value={format.time(journey.departure)} hint={from?.name} />
        <Stat label="Arrival" value={format.time(journey.arrival)} hint={to?.name} />
        <Stat label="Duration" value={format.duration(journey.durationMinutes)} hint={`${journey.legs.length} legs`} />
        <Stat label="Transfers" value={String(journey.transfers)} hint={`${journey.walkMinutes} min walking`} />
      </div>

      {disruptions.length ? (
        <Banner tone="coral" icon="alert" title="Example alerts on this journey">
          <div className="stack-2">
            {disruptions.map((alert) =>
              alert ? (
                <Link key={alert.id} to={`/disruptions/${alert.id}`} className="t-sm">
                  <span className="t-strong">{alert.title}</span> — read the simulated details and advice
                </Link>
              ) : null,
            )}
          </div>
        </Banner>
      ) : null}

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <Card className="stack">
          <div className="between wrap">
            <h2 className="t-section">Complete journey</h2>
            <div className="row-wrap">
              {journey.label ? <Pill tone="butter">{JOURNEY_LABELS[journey.label]}</Pill> : null}
              {journey.delayMinutes ? (
                <Pill tone="coral" dot dotTone="coral">
                  Example delay +{journey.delayMinutes} min
                </Pill>
              ) : (
                <Pill tone="sage">On time (simulated)</Pill>
              )}
            </div>
          </div>
          <LegList journey={journey} />
        </Card>

        <div className="stack" style={{ gap: 'var(--s-4)' }}>
          <Card className="stack">
            <h2 className="t-section">Journey summary</h2>
            <dl className="dl">
              <dt>Operator(s)</dt>
              <dd>{operators.length ? operators.join(', ') : 'Walking only'}</dd>
              <dt>Services</dt>
              <dd>
                {rideLegs.length
                  ? rideLegs.map((leg) => getLine(leg.lineId)?.name ?? leg.lineName).join(' · ')
                  : 'No public transport needed'}
              </dd>
              <dt>Modes</dt>
              <dd className="row-wrap">
                {journey.modes.map((mode) => (
                  <span key={mode} className="mode-badge">
                    <ModeIcon mode={mode} size={13} />
                    {mode}
                  </span>
                ))}
              </dd>
              <dt>Fare</dt>
              <dd>
                €{journey.fare.eur.toFixed(2)} <span className="t-faint">· {journey.fare.label}</span>
              </dd>
              <dt>Step-free</dt>
              <dd>{journey.stepFree ? 'Yes — no stairs on this option' : 'Not on this option'}</dd>
              <dt>Bicycle</dt>
              <dd>{journey.bikeAllowed ? 'Bicycle can be taken on board (simulated)' : 'Bicycle not possible on this option'}</dd>
            </dl>
            <div className="row-wrap">
              <Button
                variant="primary"
                icon={saved ? 'check' : 'bookmark'}
                onClick={() => search && saveJourney(journey, search.query, search.windowOffsetMinutes)}
              >
                {saved ? 'Saved — remove' : 'Save this journey'}
              </Button>
              <Link to={`/map?journey=${journey.id}`} className="btn">
                <Icon name="map" size={16} />
                Map
              </Link>
              <Button
                icon="share"
                onClick={() => {
                  const text = `OV Planner (demo): ${stopLabel(journey.legs[0].fromStopId)} → ${stopLabel(
                    journey.legs[journey.legs.length - 1].toStopId,
                  )} ${format.time(journey.departure)}–${format.time(journey.arrival)}`;
                  if (navigator.clipboard?.writeText) {
                    navigator.clipboard.writeText(text).then(
                      () => pushToast('Summary copied to the clipboard', 'success'),
                      () => pushToast('Copying is blocked by the browser', 'warning'),
                    );
                  } else {
                    pushToast('Clipboard is unavailable in this browser', 'warning');
                  }
                }}
              >
                Copy summary
              </Button>
            </div>
          </Card>

          <Card className="stack">
            <h2 className="t-section">Transfers</h2>
            {transfers.length === 0 ? (
              <p className="t-sm t-muted">This is a direct journey — no transfers at all.</p>
            ) : (
              <ul className="stack-2">
                {transfers.map(({ leg }) => {
                  const stop = getStop(leg.toStopId);
                  return (
                    <li key={leg.id} className="list-row list-row--static">
                      <span className="leg-row__marker">
                        <Icon name="swap" size={18} />
                      </span>
                      <span className="stack-1 grow">
                        <span className="t-strong t-sm">Change at {stop?.name}</span>
                        <span className="t-sm t-muted">
                          {stop?.accessibility.stepFree ? 'Step-free transfer' : 'Not step-free'} ·{' '}
                          {stop?.accessibility.assistance ? 'staff assistance available' : 'no staff assistance listed'}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card className="stack">
            <h2 className="t-section">Expected occupancy (simulated)</h2>
            <Meter value={journey.occupancyHistory.reduce((a, b) => a + b, 0) / journey.occupancyHistory.length} />
            <Sparkline values={journey.occupancyHistory} label="Simulated occupancy across the day" />
            <div className="between">
              <AvatarStack
                people={[
                  { initials: 'JD', tone: 'sage' },
                  { initials: 'AK', tone: 'butter' },
                  { initials: 'MR', tone: 'coral' },
                ]}
                extra={journey.occupancy === 'busy' ? 14 : 6}
              />
              <Pill>
                {journey.occupancy === 'busy'
                  ? 'Expected busy'
                  : journey.occupancy === 'moderate'
                    ? 'Expected fairly busy'
                    : 'Expected quiet'}
              </Pill>
            </div>
            <p className="t-sm t-faint">
              Invented numbers, generated with the demonstration data. Real crowding information is not part of this
              stage.
            </p>
          </Card>

          <Panel className="stack-2">
            <span className="field__label">Continue</span>
            <div className="row-wrap">
              <Link to="/results" className="btn btn--primary">
                <Icon name="route" size={16} />
                Other options
              </Link>
              <Link to="/disruptions" className="btn">
                <Icon name="alert" size={16} />
                All example alerts
              </Link>
              <Link to={`/stops/${journey.legs[0].fromStopId}`} className="btn">
                <Icon name="station" size={16} />
                {from?.name} page
              </Link>
              <Link to={`/stops/${journey.legs[journey.legs.length - 1].toStopId}`} className="btn">
                <Icon name="station" size={16} />
                {to?.name} page
              </Link>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
