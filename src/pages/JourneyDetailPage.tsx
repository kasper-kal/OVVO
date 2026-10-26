import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../state/AppState';
import { PageHeader } from '../components/layout/AppShell';
import { LegList } from '../components/journey/LegList';
import { StopLink } from '../components/stops/StopLink';
import { JOURNEY_LABELS } from '../data/journeyEngine';
import { getStop, stopLabel } from '../data/stops';
import { getDisruption } from '../data/disruptions';
import { Banner, Button, Card, EmptyState, Pill } from '../components/ui/primitives';
import { Icon } from '../components/ui/Icons';
import { useFormat } from '../lib/useFormat';
import { useT } from '../lib/useT';
import { plural } from '../lib/format';
import { usePageTitle } from '../lib/usePageTitle';
import { alertWords } from '../lib/disruptionText';

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
          /* Directly under the page's `h1`, so `h2`; see the same note in `ResultsPage`. */
          headingLevel={2}
          description={t(
            'Re-run the search to see the options again, or open one of your favourited journeys.',
          )}
        >
          {/* `route`, not `search`: reaching the planner is one action, and every other control
              in the app that offers it wears the route glyph (the consistency register groups them
              and `--gate` fails when one of them draws a different mark). */}
          <Link to="/" className="btn btn--primary">
            <Icon name="route" size={16} />
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

  /*
   * **The heading as a sentence, for the name a screen reader reads.**
   *
   * Drawn, the title is the two ends with a glyph between them; spoken, that glyph says nothing, and
   * the page was announced as "Utrecht CentraalAmsterdam Centraal" — two place names run together,
   * the first thing a screen-reader traveller hears on arriving (`AppShell` reads the heading out).
   * The word lives in the heading's own `aria-label` rather than in a hidden span inside it, so the
   * visible title is unchanged and no lowercase fragment of a sentence lands in the markup.
   */
  const fromWords = journey.legs[0].fromLabel ?? stopLabel(journey.legs[0].fromStopId);
  const toWords =
    journey.legs[journey.legs.length - 1].toLabel ?? stopLabel(journey.legs[journey.legs.length - 1].toStopId);

  const rideLegs = journey.legs.filter((leg) => leg.mode !== 'walk' && leg.mode !== 'bike');
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
            {/* The two ends of the trip, each a way to its station's page — the most prominent
                station names on the screen, and the first thing anyone reads. An address end keeps
                its words and gets no link. */}
            {journey.legs[0].fromLabel ?? <StopLink stopId={journey.legs[0].fromStopId} />}
            <Icon name="arrowRight" size={18} className="page-head__arrow" />
            {journey.legs[journey.legs.length - 1].toLabel ?? (
              <StopLink stopId={journey.legs[journey.legs.length - 1].toStopId} />
            )}
          </>
        }
        /* The same two ends, in a sentence — see `fromWords` above. */
        titleLabel={t('{from} to {to}', { from: fromWords, to: toWords })}
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
      {/*
        **One row, three short words.** This was three full-width pills stacked down the phone,
        ~170px of the first screen given to actions before the journey itself — part of why the
        page read as overwhelming next to 9292, whose journey screen is a header of icons. The
        full sentence is still each control's accessible name; what is printed is the verb.
      */}
      <div className="journey-actions">
        {search ? (
          <Button
            icon="route"
            aria-label={t('Plan return journey')}
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
            {t('Return')}
          </Button>
        ) : null}
        <Link to={`/map?journey=${journey.id}`} className="btn" aria-label={t('Show on map')}>
          <Icon name="map" size={16} />
          {t('Map')}
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
          aria-label={saved ? t('Favourited') : t('Favourite this journey')}
          onClick={() => search && saveJourney(journey, search.query, search.windowOffsetMinutes)}
        >
          {/* The fill is the state, exactly as it is on the card this page was opened from. */}
          <Icon name={saved ? 'heartFilled' : 'heart'} size={16} />
          {saved ? t('Saved') : t('Save')}
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
                  <span className="t-strong">{alertWords(t, alert).title}</span>
                  <span>{t('Read the details and advice')}</span>
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
            {/*
              No line badge and no operator chip: both are printed, at full size, in the journey
              above this card — the same two facts twice on one screen was half of what made it
              feel crowded. What is left is what the journey *is*: its price, its length, how many
              changes, how much walking, how full, and whether a bicycle may come.
            */}
            <div className="row-wrap journey-facts">
              {rideLegs.length === 0 ? (
                <Pill tone="outline">{t('Walking only')}</Pill>
              ) : null}
              {/* A fare of nothing is not a fact about the trip — see the fare row on the journey
                  card, which drops the same line for the same reason. */}
              {journey.fare.eur > 0 ? (
                <Pill tone="outline">
                  <Icon name="ticket" size={12} />€{journey.fare.eur.toFixed(2)}{' '}
                  <span className="t-faint">{t(journey.fare.label)}</span>
                </Pill>
              ) : null}
              <Pill>
                <Icon name="clock" size={12} />
                {format.duration(journey.durationMinutes)}
              </Pill>
              <Pill>
                <Icon name="swap" size={12} />
                {journey.transfers === 0 ? t('Direct') : plural(journey.transfers, t('transfer'))} ·{' '}
                {plural(journey.legs.length, t('leg'))}
              </Pill>
              {/* A walk chip that says "0 min walking" answers a question nobody asked, and reads
                  as a promise the journey does not make. No walk, no chip. */}
              {journey.walkMinutes > 0 ? (
                <Pill tone="outline">
                  <Icon name="walk" size={12} />
                  {journey.walkMinutes} {t('min walking')}
                </Pill>
              ) : null}
              {/* The expected level, where the rest of the journey's facts live — it had a card of
                  its own with a heading and one pill in it. */}
              <Pill>
                <Icon name="users" size={12} />
                {journey.occupancy === 'busy'
                  ? t('Expected busy')
                  : journey.occupancy === 'moderate'
                    ? t('Expected fairly busy')
                    : t('Expected quiet')}
              </Pill>
              {/* A plain yes/no, kept short and kept: absence of the chip is what would hide the
                  answer, not the answer itself. */}
              <Pill tone={journey.bikeAllowed ? 'sage' : 'outline'}>
                <Icon name="bike" size={12} />
                {journey.bikeAllowed ? t('Bicycle allowed') : t('No bicycle')}
              </Pill>
            </div>
          </Card>

          {/*
            **No transfers, no transfers card.** A whole card with a heading and one sentence
            saying nothing happens is the clearest example of the page describing itself — the
            summary already says “Direct · 1 leg”. The card exists only when there is a change to
            name.
          */}
          {transfers.length ? (
          <Card className="stack">
            <h2 className="t-section">{t('Transfers')}</h2>
            {
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
            }
          </Card>
          ) : null}

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
