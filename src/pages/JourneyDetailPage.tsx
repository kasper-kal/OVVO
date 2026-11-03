import { Fragment, useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../state/AppState';
import { PageHeader } from '../components/layout/AppShell';
import { LegList } from '../components/journey/LegList';
import { JourneyThumbnail } from '../components/journey/JourneyThumbnail';
import { ShareSheet } from '../components/journey/ShareSheet';
import { DepartureAlarm } from '../components/journey/DepartureAlarm';
import { StopLink } from '../components/stops/StopLink';
import { findJourneyById } from '../data/journeyEngine';
import { stopLabel } from '../data/stops';
import { getDisruption } from '../data/disruptions';
import { Button, EmptyState } from '../components/ui/primitives';
import { Icon, ModeIcon } from '../components/ui/Icons';
import { useFormat } from '../lib/useFormat';
import { useT } from '../lib/useT';
import { plural } from '../lib/format';
import { usePageTitle } from '../lib/usePageTitle';
import { alertWords } from '../lib/disruptionText';

export function JourneyDetailPage() {
  const { journeyId } = useParams();
  const navigate = useNavigate();
  const {
    findJourney,
    search,
    searchHistory,
    preferences,
    startSearch,
    isJourneySaved,
    saveJourney,
    savedJourneys,
  } = useApp();
  const format = useFormat();
  const t = useT();
  const found = findJourney(journeyId);
  /*
   * **A refreshed journey is rebuilt from its search, not lost with the tab.**
   *
   * Journeys are made per search and kept in memory, so reloading the page emptied the list and the
   * traveller was shown "This journey could not be restored" for a journey they were reading a
   * second earlier. Their searches survive a reload (they are written to this browser), and a
   * journey can be rebuilt from the search that made it — `findJourneyById` is the engine's own
   * way of doing that, written for saved journeys. So the page asks the history for the same
   * journey before it says it is gone.
   */
  const rebuilt = useMemo(() => {
    if (found || !journeyId) return null;
    for (const entry of searchHistory) {
      const sameJourney = findJourneyById(entry.query, journeyId);
      if (sameJourney) return { journey: sameJourney, query: entry.query };
    }
    return null;
  }, [found, journeyId, searchHistory]);
  const journey = found ?? rebuilt?.journey ?? undefined;
  /*
   * The rebuilt journey puts the journey back on screen at once; this puts the search behind it
   * back too, so Return, Map and Save act on this pair rather than on nothing.
   */
  useEffect(() => {
    if (!rebuilt || search) return;
    startSearch(rebuilt.query);
  }, [rebuilt, search, startSearch]);
  const saved = journey ? isJourneySaved(journey.signature) : false;
  /* The search this journey came out of: the last one **run**, not the last one kept. A kept
     search may be from weeks ago, and offering it here as "the search you were looking at" would
     name a journey that is not on the screen. */
  const lastSearch = searchHistory[0] ?? null;
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

  const disruptions = journey.disruptionIds.map((id) => getDisruption(id)).filter(Boolean);
  return (
    <div className="journey-page stack-6">
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
          journey.transfers === 0
            ? t('direct')
            : plural(journey.transfers, t('transfer'), t('transfers'))
        }`}
        /* The small map beside the title, with its arrow into the map screen (item 4). */
        actions={<JourneyThumbnail journey={journey} />}
        showTitle
      />

      {/*
        **The chain of modes, then the number of changes.** 9292 opens a journey with the vehicles
        you will actually take — walk, bus, train, train, walk — so the shape of the trip is read
        before any time is: two trains and two walks, without opening a single leg. The glyphs are
        the same ones the rail prints per leg, and the count of changes is in words because a
        screen reader should not have to guess what a multiplication sign means.
      */}
      <div className="journey-modes">
        <span className="journey-modes__chain" aria-hidden="true">
          {/* A dot between the vehicles, the way 9292 separates them: walk · bus · train. */}
          {journey.legs.map((leg, index) => (
            <Fragment key={leg.id}>
              {index > 0 ? <span className="journey-modes__dot" /> : null}
              <ModeIcon mode={leg.mode} size={16} />
            </Fragment>
          ))}
        </span>
        {/*
          **The changes as 9292 writes them: a figure, a multiplication sign and a swap glyph.**
          The sentence stays for a screen reader, which would otherwise hear the sign read out as
          "times"; what is printed is the figure and the symbol.
        */}
        <span className="journey-modes__count">
          <span className="sr-only">
            {journey.transfers === 0
              ? t('Direct')
              : plural(journey.transfers, t('transfer'), t('transfers'))}
          </span>
          <span aria-hidden="true">{journey.transfers} ×</span>
          <span className="journey-modes__swap" aria-hidden="true">
            <Icon name="swap" size={15} />
          </span>
        </span>
      </div>

      {/* The date, the length and the price, in one line under the two ends: 9292's own head. */}
      <p className="journey-meta">
        <span>{format.date(search?.query.date ?? '')}</span>
        <span aria-hidden="true">·</span>
        <span>{t('Travel time {span}', { span: format.span(journey.durationMinutes) })}</span>
        {journey.fare.eur > 0 ? (
          <>
            <span aria-hidden="true">·</span>
            {/*
              **The price is a word in the line, not a pill on top of it.** It sat in its own pale
              badge, and a pale badge on a pale page reads as a lighter patch laid over the words
              beside it: on white the "52 min" appeared to be running underneath it. The price is
              one more fact in the same sentence, bold because it is the one that costs money.
            */}
            <span className="journey-meta__price">
              €{journey.fare.eur.toFixed(2)}
              {/* The marker is decoration: a screen reader reads the note below, not a star. */}
              <span aria-hidden="true">*</span>
            </span>
          </>
        ) : null}
      </p>

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
        {/* **No Return button.** The reverse of a pair is the results screen's own swap, next to the
            two ends it swaps; a RETURN pill here was the third copy of that act (he crossed it out:
            "theres already a Reverse button on the Journey results page"). Reversing is still one
            press away — on the results screen this journey was chosen from. */}
        {/* **No Map button.** The thumbnail in the title line is already the way to the map, and it
            says so with its own arrow; a pill called MAP under it was a second door to the same room
            (he crossed it out). The map is still reachable from here, from every leg's own map glyph,
            and at the map screen itself. */}
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
        {/* The alarm and the share sheet, beside the journey's other controls (items 1 and 2). */}
        <DepartureAlarm journey={journey} />
        <ShareSheet journey={journey} date={search?.query.date ?? ''} />
      </div>

      {/*
        The four tiles that opened this page — departure, arrival, duration, transfers — were
        the journey card you just tapped, restated before you could read the journey. Departure
        and arrival are in the title line and again on every leg; duration, transfers and the
        walk are rows of the summary card.
      */}

      {/*
        **An alert is a line, not a pink block.** The banner filled a third of the first screen with
        a heading, a sentence and a second sentence that only said "read the details", above a
        journey that had not started yet. 9292 gives a notice one row; so does this.
      */}
      {disruptions.map((alert) =>
        alert ? (
          <Link key={alert.id} to={`/disruptions/${alert.id}`} className="journey-alert">
            <Icon name="alert" size={16} />
            <span className="t-sm t-strong grow">{alertWords(t, alert).title}</span>
            <Icon name="chevronRight" size={14} className="journey-alert__chevron" />
          </Link>
        ) : null,
      )}

      {/*
        **The journey is the page, not a card on it.**
        
        The rail sat inside a bordered, rounded card with a heading and a status pill in its corner,
        so the first thing the eye met was a container and the last thing was another card. 9292
        draws the journey straight onto the screen: a title, then the line. The heading, the card's
        edge and its padding are gone, and with them the journey-level "On time · Delay" pill, which
        the late service already says in its own coral words.
      */}
      <div className="journey-rail">
        <LegList journey={journey} />
      {/*
        **The journey's numbers are one grey line under the rail.** They were a second card,
        with its own heading and six pills, sitting beside the journey card: two cards of the
        same journey on one screen, which is the thing 9292 never does. Every fact is still
        here — price, length, changes, walking, how full, and the bicycle — as the sentence
        under a timetable.
      */}
      {/*
        **The three-fact line at the foot is gone, as 9292 has none.** The walking is said on the
        walk rows, which carry their own minutes; how full a service is belongs on the service. The
        bicycle has no home in 9292 and is one fact worth keeping, so it stays as one quiet line.
      */}
      {/* The bicycle rule is on each service now, where it is decided; a page-level line said one
          thing about a journey made of two trains (he asked why it was here and not under the
          train). */}
      {/*
        **The star beside the price means something, so it says what.** 9292 marks its fare with an
        asterisk and prints the reason in small type under the journey; a price that is a modelled
        fare rather than a sold ticket should say so in the same breath.
      */}
      {journey.fare.eur > 0 ? (
        <p className="t-xs t-faint journey-note">
          {/*
            **The marker needs its footnote, and the footnote needs its marker.** The price carried a
            star and this line explained it without one, so the page showed a footnote marker with
            nothing to match it — "Why is there a footnktr marker but no footnotr". A marker with no
            twin is worse than no marker: it tells the reader something is being left out.
          */}
          <span aria-hidden="true">* </span>
          {t('Fares, occupancy, delays and platforms are indicative.')}
        </p>
      ) : null}
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
