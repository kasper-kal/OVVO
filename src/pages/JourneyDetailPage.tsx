import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../state/AppState';
import { PageHeader } from '../components/layout/AppShell';
import { LegList } from '../components/journey/LegList';
import { JOURNEY_LABELS } from '../data/journeyEngine';
import { getStop, stopLabel } from '../data/stops';
import { operatorName } from '../data/operators';
import { getLine } from '../data/network';
import { getDisruption } from '../data/disruptions';
import { Banner, Button, Card, EmptyState, Panel, Pill } from '../components/ui/primitives';
import { Icon, ModeIcon } from '../components/ui/Icons';
import { useFormat } from '../lib/useFormat';
import { plural } from '../lib/format';
import { modeLabel } from '../data/preferences';

export function JourneyDetailPage() {
  const { journeyId } = useParams();
  const navigate = useNavigate();
  const { findJourney, search, preferences, startSearch, isJourneySaved, saveJourney, savedJourneys } = useApp();
  const format = useFormat();
  const journey = findJourney(journeyId);
  const saved = journey ? isJourneySaved(journey.signature) : false;

  if (!journey) {
    return (
      <div className="stack-6">
        <PageHeader
          title="Journey no longer in this session"
          description="Journeys are generated per search, so this option is not available right now."
        />
        <EmptyState
          icon="route"
          title="This journey could not be restored"
          description="Re-run the search to see the options again, or open one of your favourited journeys."
        >
          <Link to="/" className="btn btn--primary">
            <Icon name="search" size={16} />
            Plan a new journey
          </Link>
          <Link to="/?widget=favourited-journeys" className="btn">
            <Icon name="bookmark" size={16} />
            Favourited journeys ({savedJourneys.length})
          </Link>
          {search ? (
            <Button
              icon="refresh"
              onClick={() => {
                startSearch({ ...search.query, preferences });
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
    <div className="stack-6">
      <PageHeader
        title={`${stopLabel(journey.legs[0].fromStopId)} → ${stopLabel(journey.legs[journey.legs.length - 1].toStopId)}`}
        description={`${format.date(search?.query.date ?? '')} · departs ${format.time(journey.departure)} · arrives ${format.time(
          journey.arrival,
        )} · ${journey.transfers === 0 ? 'direct' : plural(journey.transfers, 'transfer')}`}
        showTitle
      />

      {/*
        The four tiles that opened this page — departure, arrival, duration, transfers — were
        the journey card you just tapped, restated before you could read the journey. Departure
        and arrival are in the title line and again on every leg; duration, transfers and the
        walk are rows of the summary card.
      */}

      {disruptions.length ? (
        <Banner tone="coral" icon="alert" title="Alerts on this journey">
          <div className="stack-2">
            {disruptions.map((alert) =>
              alert ? (
                <Link key={alert.id} to={`/disruptions/${alert.id}`} className="t-sm">
                  <span className="t-strong">{alert.title}</span> — read the details and advice
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
                  Delay +{journey.delayMinutes} min
                </Pill>
              ) : (
                <Pill tone="sage">On time</Pill>
              )}
            </div>
          </div>
          <LegList journey={journey} />
        </Card>

        <div className="stack-4">
          <Card className="stack">
            <h2 className="t-section">Journey summary</h2>
            <dl className="dl">
              <dt>{operators.length > 1 ? 'Operators' : 'Operator'}</dt>
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
                    {modeLabel(mode)}
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
              <dd>{journey.bikeAllowed ? 'Bicycle can be taken on board' : 'Bicycle not possible on this option'}</dd>
              <dt>Duration</dt>
              <dd>
                {format.duration(journey.durationMinutes)} ·{' '}
                {journey.transfers === 0 ? 'direct' : plural(journey.transfers, 'transfer')} ·{' '}
                {plural(journey.legs.length, 'leg')} · {journey.walkMinutes} min walking
              </dd>
            </dl>
            {/*
              The same three controls as the journey card this page was opened from, in the same
              layout — `journey-card__actions`, the even two-column grid with the odd action taking
              the full width — and in the same order, with `Favourite` last.

              It was a plain wrapping row, so the same `Favourite` that spans the width of a
              journey card sat hugging the left edge here, and `Show on map` sat on the other side
              of the card than it does there (the audit's `save a journey` and `show on the map`:
              one instance out of eight, in each case, on this page alone). A traveller reading a
              journey and then going back to the list should find the same control in the same
              place; the container is the same card foot, so the layout is the same layout.
            */}
            <div className="row-wrap journey-card__actions">
              {search ? (
                <Button
                  /* `route`: planning the journey back is planning. It wore `sliders`, which
                     is the options glyph, and the audit caught the clash. */
                  icon="route"
                  onClick={() => {
                    startSearch({ ...search.query, fromStopId: journey.legs[journey.legs.length - 1].toStopId, toStopId: journey.legs[0].fromStopId, preferences });
                    navigate('/results');
                  }}
                >
                  Plan return journey
                </Button>
              ) : null}
              {/* The same words the journey card uses for the same destination, and the same
                  column it takes there. */}
              <Link to={`/map?journey=${journey.id}`} className="btn">
                <Icon name="map" size={16} />
                Show on map
              </Link>
              {/*
                The same control as the one on this journey's own card, in the same words and the
                same two states ("Favourite" / "Favourited" with `aria-pressed`): it used to read
                "Favourite this journey" here and "Favourite" there, which is the same function
                identified two ways (WCAG 3.2.4). It was then the app's only obsidian Favourite, so
                the *same* control was a white pill on that card and the loudest thing on this page
                — and it was the first of the row here, where on the card it is last and spans it.
                Nothing on this page is *the* action: it is a journey you are reading, not a form
                you are filling in. So: the same pill, in the same place.
              */}
              <Button
                icon={saved ? 'check' : 'bookmark'}
                aria-pressed={saved}
                onClick={() => search && saveJourney(journey, search.query, search.windowOffsetMinutes)}
              >
                {saved ? 'Favourited' : 'Favourite'}
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

          {/*
            The expected level and a meter for it, and nothing else. A row of invented travellers
            and a per-hour busy-ness chart sat under this; neither measured anything, so both are
            deleted rather than restyled (see the same card on the results screen).
          */}
          <Card className="stack">
            <h2 className="t-section">Expected occupancy</h2>
            {/*
              The words, not a bar and the words. A full-width meter and the pill beside it
              drew the same fact twice, and the bar carried no scale to read it against.
            */}
            <div className="row-wrap">
              <Pill>
                {journey.occupancy === 'busy'
                  ? 'Expected busy'
                  : journey.occupancy === 'moderate'
                    ? 'Expected fairly busy'
                    : 'Expected quiet'}
              </Pill>
            </div>
          </Card>

          <Panel className="stack-2">
            <span className="field__label">Continue</span>
            {/* One way on, and the two stops as a line of links rather than two more buttons. */}
            <div className="row-wrap">
              {/*
                Going back to the list of journeys, said as going back — it wore `route` (the
                plan-a-journey glyph) and called itself "Other options", two names for what the
                alerts screen calls "Back to results" with a left arrow.
              */}
              <Link to="/results" className="btn">
                <Icon name="arrowLeft" size={16} />
                Back to results
              </Link>
            </div>
            <span className="t-sm t-muted">
              Stops on this journey:{' '}
              <Link to={`/stops/${journey.legs[0].fromStopId}`} className="t-strong tap-target">
                {from?.name}
              </Link>
              {' · '}
              <Link
                to={`/stops/${journey.legs[journey.legs.length - 1].toStopId}`}
                className="t-strong tap-target"
              >
                {to?.name}
              </Link>
            </span>
          </Panel>
        </div>
      </div>
    </div>
  );
}
