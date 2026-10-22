import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../state/AppState';
import { PageHeader } from '../components/layout/AppShell';
import { LegList } from '../components/journey/LegList';
import { JOURNEY_LABELS } from '../data/journeyEngine';
import { getStop, stopLabel } from '../data/stops';
import { operatorName } from '../data/operators';
import { getLine } from '../data/network';
import { getDisruption } from '../data/disruptions';
import { Banner, Button, Card, EmptyState, Pill } from '../components/ui/primitives';
import { Icon, ModeIcon } from '../components/ui/Icons';
import { useFormat } from '../lib/useFormat';
import { useT } from '../lib/useT';
import { plural } from '../lib/format';
import { usePageTitle } from '../lib/usePageTitle';

export function JourneyDetailPage() {
  const { journeyId } = useParams();
  const navigate = useNavigate();
  const { findJourney, search, preferences, startSearch, isJourneySaved, saveJourney, savedJourneys } = useApp();
  const format = useFormat();
  const t = useT();
  const journey = findJourney(journeyId);
  const saved = journey ? isJourneySaved(journey.signature) : false;
  const { recentSearches } = useApp();
  const lastSearch = recentSearches[0] ?? null;
  usePageTitle(
    journey
      ? `${journey.legs[0].fromLabel ?? stopLabel(journey.legs[0].fromStopId)} → ${
          journey.legs[journey.legs.length - 1].toLabel ??
          stopLabel(journey.legs[journey.legs.length - 1].toStopId)
        }`
      : t('Journey no longer in this session'),
  );

  if (!journey) {
    return (
      <div className="stack-6">
        <PageHeader
          title={t('Journey no longer in this session')}
          description={t('Journeys are generated per search, so this option is not available right now.')}
        />
        <EmptyState
          icon="route"
          title={t('This journey could not be restored')}
          description={t(
            'Re-run the search to see the options again, or open one of your favourited journeys.',
          )}
        >
          <Link to="/" className="btn btn--primary">
            <Icon name="search" size={16} />
            {t('Plan a new journey')}
          </Link>
          <Link to="/?widget=your-journeys" className="btn">
            <Icon name="bookmark" size={16} />
            {t('Favourited journeys ({count})', { count: savedJourneys.length })}
          </Link>
          {search ? (
            <Button
              icon="refresh"
              onClick={() => {
                startSearch({ ...search.query, preferences });
                navigate('/results');
              }}
            >
              {t('Re-run my last search')}
            </Button>
          ) : lastSearch ? (
            /*
             * A journey link opened twice has no session search behind it — the search lives in
             * memory and only the results list is generated from it — so the recovery the page
             * offered never appeared (9.7). The recent-search history is the one record of that
             * search this browser keeps, and re-running it is exactly what the traveller wants.
             */
            <Button
              icon="refresh"
              onClick={() => {
                startSearch({ ...lastSearch.query, preferences });
                navigate('/results');
              }}
            >
              {t('Re-run {from} → {to}', {
                from: lastSearch.query.fromLabel ?? stopLabel(lastSearch.query.fromStopId),
                to: lastSearch.query.toLabel ?? stopLabel(lastSearch.query.toStopId),
              })}
            </Button>
          ) : null}
        </EmptyState>
      </div>
    );
  }

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
        /*
         * The glyph, not the character: `→` in a heading is a text arrow drawn in whatever face
         * the heading happens to use, at whatever weight and whatever side bearing it has, so the
         * one direction this app means was drawn two different ways here and on every leg row
         * below it ("ugly arrow, replace with icon instead of text", 2026-10-17t20-36-48). It is
         * the same `arrowRight` glyph the leg rows and the line rows use (F16).
         */
        title={
          <>
            {journey.legs[0].fromLabel ?? stopLabel(journey.legs[0].fromStopId)}
            <Icon name="arrowRight" size={18} className="page-head__arrow" />
            {journey.legs[journey.legs.length - 1].toLabel ??
              stopLabel(journey.legs[journey.legs.length - 1].toStopId)}
          </>
        }
        description={`${format.date(search?.query.date ?? '')} · ${t('departs {time}', { time: format.time(journey.departure) })} · ${t('arrives {time}', { time: format.time(journey.arrival) })} · ${
          journey.transfers === 0 ? t('direct') : plural(journey.transfers, t('transfer'))
        }`}
        showTitle
      />

      {/*
        The journey's own actions, in their own row under the head — not three pills squeezed into
        the foot of the summary card ("looks awkwardly squeezed in", 2026-10-17t20-30-01). At a
        phone width each one takes the full width of the row, so no label wraps inside its button;
        on a wide screen the row is a wrapping line of pills again, exactly where it was in the
        card. Nothing else on this page repeats them.
      */}
      <div className="journey-actions">
        {search ? (
          <Button
            icon="route"
            onClick={() => {
              /*
               * The two ends swap, and so does everything that names them: an end that was an
               * address keeps its address when it becomes the destination, and the distance
               * between that address and the stop swaps with it. Without the labels a return
               * from Haarlem to "Rijksstraatweg 9, Haarlem" would have arrived at "Haarlem" —
               * a journey to the station the traveller was standing at.
               */
              startSearch({
                ...search.query,
                fromStopId: journey.legs[journey.legs.length - 1].toStopId,
                toStopId: journey.legs[0].fromStopId,
                fromLabel: search.query.toLabel,
                toLabel: search.query.fromLabel,
                fromAccessMetres: search.query.toAccessMetres,
                toAccessMetres: search.query.fromAccessMetres,
                preferences,
              });
              navigate('/results');
            }}
          >
            {t('Plan return journey')}
          </Button>
        ) : null}
        <Link to={`/map?journey=${journey.id}`} className="btn">
          <Icon name="map" size={16} />
          {t('Show on map')}
        </Link>
        {/*
          The same control as the one on this journey's card: a heart, filled while the journey is
          kept, with the two labels the card uses (`Favourite this journey` / `Favourited`). It
          used to be a bookmark that swapped to a tick here and read "Favourite" — the same
          function wearing a third face on the one screen that is about the journey itself.
        */}
        <button
          type="button"
          className="btn journey-save"
          aria-pressed={saved}
          onClick={() => search && saveJourney(journey, search.query, search.windowOffsetMinutes)}
        >
          <Icon name="heart" size={16} />
          {saved ? t('Favourited') : t('Favourite this journey')}
        </button>
      </div>

      {/*
        The four tiles that opened this page — departure, arrival, duration, transfers — were
        the journey card you just tapped, restated before you could read the journey. Departure
        and arrival are in the title line and again on every leg; duration, transfers and the
        walk are rows of the summary card.
      */}

      {disruptions.length ? (
        <Banner tone="coral" icon="alert" title={t('Alerts on this journey')}>
          <div className="stack-2">
            {disruptions.map((alert) =>
              alert ? (
                <Link
                  key={alert.id}
                  to={`/disruptions/${alert.id}`}
                  className="t-sm alert-link alert-link--banner"
                >
                  <span className="t-strong">{alert.title}</span>
                  <span>{t('— read the details and advice')}</span>
                </Link>
              ) : null,
            )}
          </div>
        </Banner>
      ) : null}

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <Card className="stack">
          <div className="between wrap">
            <h2 className="t-section">{t('Complete journey')}</h2>
            <div className="row-wrap">
              {journey.label ? <Pill tone="butter">{t(JOURNEY_LABELS[journey.label])}</Pill> : null}
              {journey.delayMinutes ? (
                <Pill tone="coral" dot dotTone="coral">
                  {t('Delay +{count} min', { count: journey.delayMinutes })}
                </Pill>
              ) : journey.cancelled ? (
                /* A cancelled service read "On time" here and on its own leg, while the results
                   card for the same journey read "Cancelled" (9.4). */
                <Pill tone="coral">{t('Cancelled')}</Pill>
              ) : (
                <Pill tone="sage">{t('On time')}</Pill>
              )}
            </div>
          </div>
          <LegList journey={journey} />
        </Card>

        <div className="stack-4">
          <Card className="stack">
            <h2 className="t-section">{t('Journey summary')}</h2>
            {/*
              Drawn, not described: the seven-row definition list it replaces read as a
              paragraph of sentences ("EXTREMLY text heavy, replace with mostly icons",
              2026-10-17t20-33-24). Every fact is still here, in the app's own chip idiom — the
              same `mode-badge` the services wore on the journey card, and `Pill`s with the same
              glyphs the card's own meta row uses (`ticket`, `walk`, `swap`, `station`). Nothing
              reads as a sentence any more, and each chip is one line at 378px.
            */}
            <div className="row-wrap journey-facts">
              {rideLegs.length === 0 ? (
                <Pill tone="outline">{t('Walking only')}</Pill>
              ) : (
                rideLegs.map((leg) => (
                  <span key={leg.id} className={`mode-badge mode-badge--${leg.mode}`}>
                    <ModeIcon mode={leg.mode} size={13} />
                    {getLine(leg.lineId)?.name ?? leg.lineName ?? t('Service')}
                  </span>
                ))
              )}
              {operators.length ? (
                <Pill tone="outline">
                  <Icon name="station" size={12} />
                  {operators.join(' · ')}
                </Pill>
              ) : null}
              <Pill tone="outline">
                <Icon name="ticket" size={12} />€{journey.fare.eur.toFixed(2)}{' '}
                <span className="t-faint">{t(journey.fare.label)}</span>
              </Pill>
              <Pill>
                <Icon name="clock" size={12} />
                {format.duration(journey.durationMinutes)}
              </Pill>
              <Pill>
                <Icon name="swap" size={12} />
                {journey.transfers === 0 ? t('Direct') : plural(journey.transfers, t('transfer'))} ·{' '}
                {plural(journey.legs.length, t('leg'))}
              </Pill>
              <Pill tone="outline">
                <Icon name="walk" size={12} />
                {journey.walkMinutes} {t('min walking')}
              </Pill>
              {/* A plain yes/no, kept short and kept: absence of the chip is what would hide the
                  answer, not the answer itself. */}
              <Pill tone={journey.bikeAllowed ? 'sage' : 'outline'}>
                <Icon name="bike" size={12} />
                {journey.bikeAllowed ? t('Bicycle allowed') : t('No bicycle')}
              </Pill>
            </div>
          </Card>

          <Card className="stack">
            <h2 className="t-section">{t('Transfers')}</h2>
            {transfers.length === 0 ? (
              <p className="t-sm t-muted">{t('This is a direct journey — no transfers at all.')}</p>
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
                        {/*
                          The "step-free transfer · staff assistance" line is deleted with every
                          other visible accessibility claim (F19). What is left is the fact that
                          belongs to a transfer: where to change.
                        */}
                        <span className="t-strong t-sm">{t('Change at {stop}', { stop: stop?.name ?? '' })}</span>
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
            <h2 className="t-section">{t('Expected occupancy')}</h2>
            {/*
              The words, not a bar and the words. A full-width meter and the pill beside it
              drew the same fact twice, and the bar carried no scale to read it against.
            */}
            <div className="row-wrap">
              <Pill>
                {journey.occupancy === 'busy'
                  ? t('Expected busy')
                  : journey.occupancy === 'moderate'
                    ? t('Expected fairly busy')
                    : t('Expected quiet')}
              </Pill>
            </div>
          </Card>
        </div>
      </div>

      {/*
        This page used to close with a "Continue" panel: a "Back to results" link and the two
        ends of the journey as a line of links. All three are already here — the shell puts a
        back arrow in every screen's top row, and both stops are named in the page title and
        linked again in the leg list — so the panel was a nav row wearing a card.
      */}
    </div>
  );
}
