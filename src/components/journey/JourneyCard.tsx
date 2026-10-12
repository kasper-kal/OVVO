import { Link } from 'react-router-dom';
import { useApp } from '../../state/AppState';
import { JOURNEY_LABELS } from '../../data/journeyEngine';
import { getLine } from '../../data/network';
import { operatorName } from '../../data/operators';
import { stopLabel } from '../../data/stops';
import { useFormat } from '../../lib/useFormat';
import { AvatarStack, Card, Disclosure, Meter, Pill, Sparkline } from '../ui/primitives';
import { Icon, ModeIcon } from '../ui/Icons';
import { LegList } from './LegList';
import type { Journey } from '../../data/types';

const OCCUPANCY_TEXT: Record<Journey['occupancy'], string> = {
  quiet: 'Expected quiet',
  moderate: 'Expected fairly busy',
  busy: 'Expected busy',
};

const OCCUPANCY_TONE: Record<Journey['occupancy'], 'sage' | 'butter' | 'coral'> = {
  quiet: 'sage',
  moderate: 'butter',
  busy: 'coral',
};

export function JourneyCard({ journey, highlight = false }: { journey: Journey; highlight?: boolean }) {
  const format = useFormat();
  const { search, isJourneySaved, saveJourney, settings } = useApp();
  const saved = isJourneySaved(journey.signature);
  const operators = [...new Set(journey.operatorIds)].map((id) => operatorName(id));
  const rideLegs = journey.legs.filter((leg) => leg.mode !== 'walk' && leg.mode !== 'bike');
  const legSummary = `${journey.legs.length} legs · ${journey.transfers} transfer${journey.transfers === 1 ? '' : 's'}`;

  return (
    <Card as="article" className="stack" style={{ borderColor: highlight ? 'var(--accent-primary)' : undefined }}>
      <div className="between wrap">
        <div className="journey-card__times">
          <span className="journey-card__time">{format.time(journey.departure)}</span>
          <Icon name="arrowRight" size={18} className="journey-card__arrow" />
          <span className="journey-card__time">{format.time(journey.arrival)}</span>
          <span className="pill">{format.duration(journey.durationMinutes)}</span>
        </div>
        <div className="row-wrap">
          {journey.label ? <Pill tone="butter">{JOURNEY_LABELS[journey.label]}</Pill> : null}
          {journey.transfers === 0 ? <Pill tone="sage">Direct</Pill> : null}
          {journey.delayMinutes > 0 ? (
            <Pill tone="coral" dot dotTone="coral">
              Example delay +{journey.delayMinutes} min
            </Pill>
          ) : null}
          {journey.cancelled ? <Pill tone="coral">Cancelled in this simulation</Pill> : null}
        </div>
      </div>

      <div className="journey-card__chain">
        {rideLegs.length === 0 ? (
          <span className="pill">Walking only</span>
        ) : (
          rideLegs.map((leg, index) => (
            <span key={leg.id} className="row">
              {index > 0 ? <Icon name="chevronRight" size={13} className="journey-card__arrow" /> : null}
              <span className="mode-badge">
                <ModeIcon mode={leg.mode} size={13} />
                {getLine(leg.lineId)?.number ?? leg.lineNumber ?? ''}
              </span>
            </span>
          ))
        )}
      </div>

      <div className="journey-card__meta">
        <span className="row">
          <Icon name="swap" size={14} />
          {journey.transfers === 0 ? 'No transfers' : `${journey.transfers} transfer${journey.transfers === 1 ? '' : 's'}`}
        </span>
        <span className="row">
          <Icon name="walk" size={14} />
          {journey.walkMinutes} min walking
        </span>
        <span className="row">
          <Icon name="ticket" size={14} />
          €{journey.fare.eur.toFixed(2)}
        </span>
        {operators.length ? (
          <span className="row">
            <Icon name="station" size={14} />
            {operators.join(' · ')}
          </span>
        ) : null}
        {journey.stepFree ? (
          <span className="row">
            <Icon name="accessibility" size={14} />
            Step-free
          </span>
        ) : null}
        {journey.bikeAllowed ? (
          <span className="row">
            <Icon name="bike" size={14} />
            Bicycle allowed
          </span>
        ) : null}
      </div>

      <div className="grid-2">
        <div className="panel stack-2">
          <div className="between">
            <span className="field__label">Simulated occupancy</span>
            <Pill tone={OCCUPANCY_TONE[journey.occupancy]}>{OCCUPANCY_TEXT[journey.occupancy]}</Pill>
          </div>
          <Meter value={journey.occupancyHistory.reduce((a, b) => a + b, 0) / journey.occupancyHistory.length} tone={OCCUPANCY_TONE[journey.occupancy]} />
          <div className="between">
            <AvatarStack
              people={[
                { initials: 'JD', tone: 'sage' },
                { initials: 'AK', tone: 'butter' },
                { initials: 'MR', tone: 'coral' },
              ]}
              extra={journey.occupancy === 'busy' ? 14 : journey.occupancy === 'moderate' ? 8 : 3}
            />
            <span className="t-sm t-muted">simulated travellers</span>
          </div>
        </div>
        <div className="panel stack-1">
          <span className="field__label">Expected busy-ness by hour</span>
          <Sparkline values={journey.occupancyHistory} label="Simulated occupancy trend across the day" />
          <span className="t-sm t-faint">Illustrative trend, generated with the demonstration data.</span>
        </div>
      </div>

      <div className="row-wrap">
        <Link to={`/journey/${journey.id}`} className="btn btn--primary">
          <Icon name="route" size={16} />
          Journey details
        </Link>
        <Link to={`/map?journey=${journey.id}`} className="btn">
          <Icon name="map" size={16} />
          Show on map
        </Link>
        <button
          type="button"
          className="btn"
          aria-pressed={saved}
          onClick={() => search && saveJourney(journey, search.query, search.windowOffsetMinutes)}
        >
          <Icon name={saved ? 'check' : 'bookmark'} size={16} />
          {saved ? 'Saved' : 'Save journey'}
        </button>
        {settings.showDemoBadges ? <Pill tone="butter">Simulated journey</Pill> : null}
      </div>

      <Disclosure title="Journey legs" summary={legSummary} id={`journey-${journey.id}`}>
        {rideLegs.length === 0 ? (
          <p className="t-sm t-muted">
            This whole journey is a {journey.walkMinutes} minute walk from {stopLabel(journey.legs[0].fromStopId)} to{' '}
            {stopLabel(journey.legs[journey.legs.length - 1].toStopId)}. No ticket needed.
          </p>
        ) : null}
        <LegList journey={journey} />
      </Disclosure>
    </Card>
  );
}
