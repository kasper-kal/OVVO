import { Link } from 'react-router-dom';
import { useApp } from '../../state/AppState';
import { JOURNEY_LABELS } from '../../data/journeyEngine';
import { modeLabel } from '../../data/preferences';
import { getLine } from '../../data/network';
import { useFormat } from '../../lib/useFormat';
import { Pill } from '../ui/primitives';
import { ResultCard } from '../ui/ResultCard';
import { Icon, ModeIcon } from '../ui/Icons';
import { useT } from '../../lib/useT';
import type { Journey } from '../../data/types';

export function JourneyCard({ journey, highlight = false }: { journey: Journey; highlight?: boolean }) {
  const format = useFormat();
  const t = useT();
  const { search, isJourneySaved, saveJourney } = useApp();
  const saved = isJourneySaved(journey.signature);
  const to = `/journey/${journey.id}`;

  return (
    /*
     * The card is a way in, the way a stop card and an alert card are — because all three are the
     * same component now (`components/ui/ResultCard.tsx`, MATCHING_PLAN rule 4). It lifts under
     * the pointer and pressing anywhere on it opens the journey's own page; the three controls in
     * it — Journey details, Show on map and Favourite — are controls, so a press on them is
     * theirs and not the card's, and the first of them is a real link, which is what a keyboard
     * and a screen reader use.
     *
     * The legs are not listed on this card — only their modes, as one chain. A result answers
     * "which of these shall I take"; the leg-by-leg itinerary, with its times, platforms and the
     * walk between them, is what the journey's own page is for — and it was the one block here
     * behind a disclosure, so it was the one block that had to be opened before it could be read.
     */
    <ResultCard
      as="article"
      to={to}
      className="stack"
      style={{ borderColor: highlight ? 'var(--accent-primary)' : undefined }}
    >
      {/*
        Two lines: the times with the duration, the label and the heart; then the vehicles in the
        order they are taken, with the fare.

        The card used to carry five lines — the times with three pills beside them, the service
        badges on a line of their own, a meta line of four items and a second meta line for the
        occupancy — which is 250px of a phone screen for four facts, and every one of those facts
        was also on the journey's own page. The label and the heart now share the times' line, and
        the chain of modes and the fare share the one below it.
      */}
      <div className="journey-card__head">
        {/*
          A card's own name: eleven identical "Journey details" links in a screen reader's link
          list, and no heading inside any result, so the list could not be skimmed by heading
          either (2.7). The times are the name of a journey — they are what distinguishes one from
          another — so they are the heading, and every control in the card says them too.
        */}
        <h2 className="journey-card__times">
          {/* The card's one real link, and its name: the times. A press anywhere on the card opens
              the same route; this is what a keyboard, a middle-click and a screen reader's link
              list use. */}
          <Link
            to={to}
            className="journey-card__link"
            /*
              Both ends, because two journeys can leave in the same minute — the list held two
              "Journey details for 09:30" links to two different journeys (one arriving 09:54, one
              09:59), which a screen reader's link list cannot tell apart.
            */
            aria-label={t('Journey details: {departure} to {arrival}', {
              departure: format.time(journey.departure),
              arrival: format.time(journey.arrival),
            })}
            onClick={(event) => event.stopPropagation()}
          >
            <span className="journey-card__time">{format.time(journey.departure)}</span>
            <Icon name="arrowRight" size={18} className="journey-card__arrow" />
            <span className="journey-card__time">{format.time(journey.arrival)}</span>
            {/* The journey's own page already draws its duration as `[clock] 51 min`; the card was
                the one place the same fact was a word in a pill with no picture. */}
            <span className="pill">
              <Icon name="clock" size={12} />
              {format.duration(journey.durationMinutes)}
            </span>
          </Link>
        </h2>
        <div className="journey-card__tags">
          {journey.label ? <Pill tone="butter">{t(JOURNEY_LABELS[journey.label])}</Pill> : null}
          {journey.delayMinutes > 0 ? (
            <Pill tone="coral" dot dotTone="coral">
              {t('Delay +{minutes} min', { minutes: journey.delayMinutes })}
            </Pill>
          ) : null}
          {journey.cancelled ? <Pill tone="coral">{t('Cancelled')}</Pill> : null}
          {/*
            The one control a result needs, beside its own name: a heart, the same control the
            journey's page wears. The three full-width buttons that used to close every card —
            Journey details, Show on map, Favourite this journey — repeated three times down a list
            of five options, on a card that is itself the way into the journey.
          */}
          <button
            type="button"
            className="btn btn--bare journey-save journey-card__save"
            aria-pressed={saved}
            aria-label={t('Favourite the {from} to {to} journey', {
              from: format.time(journey.departure),
              to: format.time(journey.arrival),
            })}
            onClick={(event) => {
              event.stopPropagation();
              if (search) saveJourney(journey, search.query, search.windowOffsetMinutes);
            }}
          >
            {/* Filled while the journey is kept — the rule every toggle in the app follows
                (see `pressedIcon` in `components/ui/Icons`), so a saved card is visible as one
                at a glance down the list, not only by its colour. */}
            <Icon name={saved ? 'heartFilled' : 'heart'} size={18} />
          </button>
        </div>
      </div>

      {/*
        **Which vehicles, in the order you take them** — the whole trip as one chain, and the fare.

        This is the line 9292 puts under the times: every leg drawn as its own mode icon, walking
        included, left to right. Ours drew only the *riding* legs ("bus 347") and then said the
        walking twice more in words — "Direct", "12 minute walk" — so a journey that was walk, bus,
        walk read as a bus with a walk attached somewhere, and the transfers count repeated what a
        single badge already showed. Reading the chain is the comparison: one badge is direct, three
        badges are two changes, and a walking badge at either end is how far you carry your own bag.

        What is left is the fare, because price is the one thing the chain cannot say. The other two
        readings that used to sit here — the transfer count and the expected busy-ness — are on the
        journey's own page, where a traveller has already chosen and is asking what the trip is like.
      */}
      <div className="journey-card__meta">
        <span className="journey-card__chain">
          {/* A journey that is one walk is the walk: its own duration pill two lines up already
              says the minutes, so a badge repeating them would be the only thing on the card
              saying nothing new. */}
          {journey.legs.length === 0 || journey.legs.every((leg) => leg.mode === 'walk') ? (
            <span className="pill">{t('Walking only')}</span>
          ) : (
            journey.legs.map((leg, index) => {
              const minutes = leg.arrival - leg.departure;
              const onFoot = leg.mode === 'walk' || leg.mode === 'bike';
              return (
                <span key={leg.id} className="row">
                  {index > 0 ? <Icon name="chevronRight" size={13} className="journey-card__arrow" /> : null}
                  <span className={`mode-badge mode-badge--${leg.mode}`}>
                    <ModeIcon mode={leg.mode} size={13} />
                    {/* A glyph alone is not a word: the mode is said for a screen reader, and the
                        badge itself carries what is worth reading — the line number, or the
                        minutes on foot. */}
                    <span className="sr-only">{t(modeLabel(leg.mode))}</span>
                    {onFoot ? format.duration(minutes) : (getLine(leg.lineId)?.number ?? leg.lineNumber ?? '')}
                  </span>
                </span>
              );
            })
          )}
        </span>
        {/*
          **A journey that costs nothing has no fare row.**

          `Walking only` was followed by a ticket glyph and `€0.00` — a price tag on a walk, which
          is the one number on the card that can only be zero (reported with that line circled:
          "it shouldnt even HAVE a price thingy if its $0"). The chain still says how you travel;
          where there is nothing to pay, the fare says nothing and is not drawn.
        */}
        {journey.fare.eur > 0 ? (
          <span className="row">
            <Icon name="ticket" size={14} />
            €{journey.fare.eur.toFixed(2)}
          </span>
        ) : null}
      </div>

    </ResultCard>
  );
}
