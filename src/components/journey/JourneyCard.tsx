import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../state/AppState';
import { JOURNEY_LABELS } from '../../data/journeyEngine';
import { getLine } from '../../data/network';
import { operatorName } from '../../data/operators';
import { useFormat } from '../../lib/useFormat';
import { Card, Meter, Pill } from '../ui/primitives';
import { Icon, ModeIcon } from '../ui/Icons';
import { useT } from '../../lib/useT';
import type { Journey } from '../../data/types';

const OCCUPANCY_TEXT: Record<Journey['occupancy'], string> = {
  quiet: 'Expected quiet',
  moderate: 'Expected fairly busy',
  busy: 'Expected busy',
};

const OCCUPANCY_METER_TONE: Record<Journey['occupancy'], 'sage' | 'butter' | 'coral'> = {
  quiet: 'sage',
  moderate: 'butter',
  busy: 'coral',
};

export function JourneyCard({ journey, highlight = false }: { journey: Journey; highlight?: boolean }) {
  const navigate = useNavigate();
  const format = useFormat();
  const t = useT();
  const { search, isJourneySaved, saveJourney } = useApp();
  const saved = isJourneySaved(journey.signature);
  const operators = [...new Set(journey.operatorIds)].map((id) => operatorName(id));
  const rideLegs = journey.legs.filter((leg) => leg.mode !== 'walk' && leg.mode !== 'bike');
  const to = `/journey/${journey.id}`;

  return (
    /*
     * The card is a way in, the way a stop card and an alert card are: it lifts under the pointer
     * and pressing anywhere on it opens the journey's own page, so the biggest target on the
     * screen is the thing the screen is about. The three controls in it — Journey details, Show
     * on map and Favourite — stop their clicks reaching the card, so nothing navigates twice, and
     * the first of them is a real link, which is what a keyboard and a screen reader use.
     *
     * The legs are not on this card any more. A result answers "which of these shall I take";
     * the leg-by-leg itinerary, with its times, platforms and the walk between them, is what the
     * journey's own page is for — and it was the one block here behind a disclosure, so it was the
     * one block that had to be opened before it could be read.
     */
    <Card
      as="article"
      className="stack"
      style={{ borderColor: highlight ? 'var(--accent-primary)' : undefined }}
      onClick={() => navigate(to)}
    >
      <div className="between wrap">
        <div className="journey-card__times">
          <span className="journey-card__time">{format.time(journey.departure)}</span>
          <Icon name="arrowRight" size={18} className="journey-card__arrow" />
          <span className="journey-card__time">{format.time(journey.arrival)}</span>
          <span className="pill">{format.duration(journey.durationMinutes)}</span>
        </div>
        <div className="row-wrap">
          {journey.label ? <Pill tone="butter">{t(JOURNEY_LABELS[journey.label])}</Pill> : null}
          {journey.transfers === 0 ? <Pill>{t('Direct')}</Pill> : null}
          {journey.delayMinutes > 0 ? (
            <Pill tone="coral" dot dotTone="coral">
              {t('Delay +{minutes} min', { minutes: journey.delayMinutes })}
            </Pill>
          ) : null}
          {journey.cancelled ? <Pill tone="coral">{t('Cancelled')}</Pill> : null}
        </div>
      </div>

      <div className="journey-card__chain">
        {rideLegs.length === 0 ? (
          <span className="pill">{t('Walking only')}</span>
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
          {journey.transfers === 0
            ? t('No transfers')
            : t(journey.transfers === 1 ? '{count} transfer' : '{count} transfers', { count: journey.transfers })}
        </span>
        <span className="row">
          <Icon name="walk" size={14} />
          {t('{count} minute walk', { count: journey.walkMinutes })}
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
            {t('Step-free')}
          </span>
        ) : null}
        {journey.bikeAllowed ? (
          <span className="row">
            <Icon name="bike" size={14} />
            {t('Bicycle allowed')}
          </span>
        ) : null}
      </div>

      {/*
        One occupancy question, answered once: the expected level and a meter for it. There were
        two more things here and both were invented — a row of made-up travellers with initials
        (JD, AK, MR) and a count, and a per-hour busy-ness chart drawn from a random series. They
        were the only places in the app that showed people who do not exist and a figure nothing
        measured, so they are gone rather than restyled; the meter is the same reading the level
        pill names, and the departure board and the stop pages carry the real crowd signal.
      */}
      <div className="panel stack-2">
        <div className="between">
          <span className="field__label">{t('Occupancy')}</span>
          <Pill>{t(OCCUPANCY_TEXT[journey.occupancy])}</Pill>
        </div>
        <Meter
          value={journey.occupancyHistory.reduce((a, b) => a + b, 0) / journey.occupancyHistory.length}
          tone={OCCUPANCY_METER_TONE[journey.occupancy]}
        />
      </div>

      <div className="row-wrap journey-card__actions">
        <Link to={to} className="btn btn--primary" onClick={(event) => event.stopPropagation()}>
          <Icon name="route" size={16} />
          {t('Journey details')}
        </Link>
        {/*
          The map is a screen of its own now (`pages/MapPage.tsx`) rather than the home-screen
          widget: this used to open the home screen with `?widget=map` and leave the traveller
          there, with their journey behind a page they had to find again. The map screen's own way
          back returns to this results list.
        */}
        <Link to={`/map?journey=${journey.id}`} className="btn" onClick={(event) => event.stopPropagation()}>
          <Icon name="map" size={16} />
          {t('Show on map')}
        </Link>
        <button
          type="button"
          className="btn"
          aria-pressed={saved}
          onClick={(event) => {
            event.stopPropagation();
            if (search) saveJourney(journey, search.query, search.windowOffsetMinutes);
          }}
        >
          <Icon name={saved ? 'check' : 'bookmark'} size={16} />
          {saved ? t('Favourited') : t('Favourite')}
        </button>
      </div>
    </Card>
  );
}
