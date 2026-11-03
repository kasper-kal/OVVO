import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getLine } from '../../data/network';
import { operatorName } from '../../data/operators';
import { getStop } from '../../data/stops';
import { useFormat } from '../../lib/useFormat';
import { useT } from '../../lib/useT';
import { EmptyState, IconButton } from '../ui/primitives';
import { PlanStopDialog } from './PlanStopDialog';
import { StopLink } from './StopLink';
import { Icon } from '../ui/Icons';
import type { Departure, Stop } from '../../data/types';

/**
 * [OCR Visual Transcode - Departure Row]
 * ROW: transparent, 1px #E8E6DF separator, H=56 | TIME: tabular mono, ink-strong
 * DESTINATION: 14px ink | PLATFORM: 12px ink-muted | DELAY: coral +N
 *
 * One calm list instead of a seven-column table: time, where it goes, which
 * platform. Everything else is secondary.
 */
export function BoardList({
  departures,
  limit,
  emptyHint,
}: {
  departures: Departure[];
  /** Only a widget passes this: a card is not a list screen and shows the rows it has room for. */
  limit?: number;
  emptyHint?: string;
}) {
  /*
   * **A board shows the departures in its window, and asks nothing.**
   *
   * It used to hold rows back: five at a time, behind a "Show 5 more" button, with a scroll
   * sentinel behind that. The button was the defect the steerer named — a board is a short list
   * of what leaves next, in a window of twenty, and a tap to see the last ten of them is a tax on
   * reading the screen the traveller already opened. The whole window is drawn; there is no
   * batching, no sentinel and no press.
   *
   * The rows per load rule (`lib/loadBatch.ts`) is for lists that are long because the network is
   * big — stops, alerts. A board is long because a day is long, and the window is already the
   * answer to that.
   *
   * A widget still passes `limit`, because a card is not a list screen: there it shows the rows it
   * has room for and nothing else.
   */
  const format = useFormat();
  const t = useT();
  const navigate = useNavigate();

  const shown = limit === undefined ? departures : departures.slice(0, limit);

  if (departures.length === 0) {
    return (
      <EmptyState
        icon="board"
        title={t('No departures right now')}
        description={emptyHint ?? t('This stop has no departures in the current window.')}
      />
    );
  }

  /*
   * **A row's plan action asks the same question every other Plan in the app asks.**
   *
   * It used to jump straight into the planner with that departure's destination filled in and the
   * picker already open on the other end — no question, and no way to say "actually I am going
   * *from* there". A route glyph that plans now opens the two-choice dialog the station page and
   * the stop cards open (`PlanStopDialog`), about the station this departure goes to, and the two
   * answers do what they do everywhere else: fill that end and open the picker for the other one.
   *
   * The row itself still knows nothing about journeys — the dialog is the app's one owner of that
   * question, so a board cannot grow a second, quieter way to plan.
   */
  const [planStop, setPlanStop] = useState<Stop | null>(null);
  const askToPlan = (departure: Departure) => {
    setPlanStop(getStop(departure.destinationStopId) ?? null);
  };
  const chooseEnd = (direction: 'from' | 'to') => {
    if (!planStop) return;
    navigate(`/?${direction}=${planStop.id}&pick=${direction === 'from' ? 'to' : 'from'}`);
    setPlanStop(null);
  };

  return (
    <div className="stack-3">
      <ul className="board-list">
        {shown.map((departure) => {
          const line = getLine(departure.lineId);
          const delayed = departure.delayMinutes > 0;
          return (
            <li key={departure.id} className="board-list__row" data-cancelled={departure.cancelled || undefined}>
              <span className="board-list__time">
                <span className="t-mono-num">{format.time(departure.cancelled ? departure.planned : departure.expected)}</span>
                {/*
                  **A delay, said in words.** Drawn, the second line is the booked time struck
                  through and "+10" beside it; spoken, that was "18:10 18:00 plus 10" — two times
                  and a number with nothing saying what any of them meant, on the screen people
                  read at a stop. The picture is now hidden from assistive tech and the sentence
                  beside it is spoken: "scheduled 18:00 · 10 min late".
                */}
                {delayed ? (
                  <span className="board-list__delta">
                    <span className="strike" aria-hidden="true">
                      {format.time(departure.planned)}
                    </span>
                    <span className="delay" aria-hidden="true">
                      +{departure.delayMinutes}
                    </span>
                    <span className="sr-only">
                      {t('scheduled {time} · {count} min late', {
                        time: format.time(departure.planned),
                        count: departure.delayMinutes,
                      })}
                    </span>
                  </span>
                ) : null}
              </span>

              {/*
                **The alert for a cancelled service lives at the end of the line it explains.**

                It used to be a third control in the row's action cluster, beside the plan button —
                and a row is a grid whose last column is sized by its contents, so that one row was
                48px wider at the end than every other row, and the platform number in front of it
                moved 48px left. Reserving the space for every row fixed the line-up and left a
                thumb's width of nothing on every row that had no alert, which is worse to look at
                than the jump was.

                This cell is the row's one flexible column — everything right of it is anchored to
                the right edge — so an icon in here costs the destination a little text width and
                moves nothing. The rows above and below keep their platform numbers and plan buttons
                in exactly the same place, and a board with no cancellations carries no empty slot.
              */}
              <span className="board-list__main">
                <span className="board-list__line">
                  {/*
                    Where this service goes, as a way to that station's page. It is the one word on
                    the row that names a place — the time, the platform and the line are facts about
                    *this* stop — so it is the row's link, and the row keeps its own plan button.
                  */}
                  <span className="board-list__destination">
                    <StopLink stopId={departure.destinationStopId} label={departure.destinationLabel} />
                  </span>
                {/*
                  The same word the journey card and the leg list use, from the same entry: it was
                  a literal here, so a cancelled departure read `cancelled` — lowercase and English
                  on the Dutch board (reported by the capitalisation audit).

                  It is a **sibling** of the destination, not a child of it, and that is the fix
                  for a second defect the audit found in it: the destination is clamped to two
                  lines and hides its overflow, so a long name plus this word needed three lines
                  and the word was cut off — measured at 320 in a 92px column and at 768 in a 64px
                  one (both "Rotterdam CentraalCancelled"). Outside the clamp there is nothing to
                  cut: the word wraps as its own line in the row's main column, which the row is
                  already free to grow into.
                */}
                  {departure.cancelled ? <span className="board-list__cancelled">{t('Cancelled')}</span> : null}
                  <span className="t-sm t-faint">
                    {line ? `${line.name} · ` : ''}
                    {operatorName(departure.operatorId)}
                  </span>
                </span>
                {departure.cancelled && departure.disruptionId ? (
                  <Link
                    className="board-list__alert"
                    to={`/disruptions/${departure.disruptionId}`}
                    aria-label={t('Alert for service {line}', { line: departure.lineNumber })}
                  >
                    <Icon name="alert" size={15} />
                  </Link>
                ) : null}
              </span>

              {/*
                **The word "PLATFORM", ten times a board, replaced by the platform's own glyph.**

                It was spelled out on every row and, below a 420px container, replaced by a bare
                `P` — which is the stylesheet admitting the word is disposable. The app already
                draws a platform (`platform`, Lucide's TrainTrack) on a journey's stop rows; this is
                the same fact on the surface it is read most, so it wears the same picture.

                The word is still *spoken*: the `sr-only` span keeps the accessible name the `title`
                gave, and a ferry's "Pier 1" now needs no prefix rule at all — the glyph says where
                the number belongs.
              */}
              <span
                className="board-list__platform"
                title={t('Platform {platform}', { platform: departure.platform })}
              >
                <Icon name="platform" size={13} className="board-list__platform-icon" />
                <span className="sr-only">{t('Platform')}</span>
                {departure.platform}
              </span>

              <span className="board-list__actions">
                <IconButton
                  icon="route"
                  /* Five identical names on a ferry board told a screen reader nothing about which
                     departure each one plans (6.9). The destination is what tells them apart. */
                  label={t('Plan a journey with {stop}', { stop: departure.destinationLabel })}
                  variant="ghost"
                  onClick={() => askToPlan(departure)}
                />
              </span>
            </li>
          );
        })}
      </ul>

      <PlanStopDialog stop={planStop} onClose={() => setPlanStop(null)} onPlan={chooseEnd} />

      {/*
        The count is all that is left of the foot: no button, and no "of" to fill in, because
        nothing is being held back any more. A widget passes `limit` and gets no foot at all.
      */}
      {limit === undefined ? (
        <div className="row-wrap list-foot">
          <span className="t-sm t-faint">
            {t('{total} departures in this window', { total: departures.length })}
          </span>
        </div>
      ) : null}
    </div>
  );
}

export function boardStopLabel(stopId: string): string {
  return getStop(stopId)?.name ?? stopId;
}
