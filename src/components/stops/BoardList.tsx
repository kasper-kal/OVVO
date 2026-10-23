import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getLine } from '../../data/network';
import { operatorName } from '../../data/operators';
import { getStop } from '../../data/stops';
import { useFormat } from '../../lib/useFormat';
import { useT } from '../../lib/useT';
import { EmptyState, IconButton } from '../ui/primitives';
import { Icon } from '../ui/Icons';
import type { Departure } from '../../data/types';
import { ROWS_PER_LOAD } from '../../lib/loadBatch';

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
  limit = ROWS_PER_LOAD,
  emptyHint,
}: {
  departures: Departure[];
  /** Only a widget passes this: a card is not a list screen and shows the rows it has room for. */
  limit?: number;
  emptyHint?: string;
}) {
  /*
   * The rows hold back more of the board, five at a time — a board row is one row, so the rule
   * (see `lib/loadBatch.ts`) is five departures per press, not "the rest of the board at once".
   *
   * This is the same rule the two long lists use (`useLoadOnScroll`), applied to rows instead of
   * cards: the batch is `ROWS_PER_LOAD`, the sentinel loads the next batch once the page has been
   * scrolled, and the button underneath is still a real button that promises the number it adds.
   * A board used to open on a literal `6` and grow only by pressing (MATCHING_PLAN rule 3).
   */
  const [grown, setGrown] = useState(limit);
  const format = useFormat();
  const t = useT();
  const navigate = useNavigate();

  const shown = departures.slice(0, grown);
  const hidden = departures.length - shown.length;
  const next = Math.min(ROWS_PER_LOAD, hidden);
  const expanded = grown > limit;
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [hasScrolled, setHasScrolled] = useState(false);
  /*
   * A press of "Show 5 more" is five rows, not ten.
   *
   * The button and the scroll sentinel both add `ROWS_PER_LOAD`, and the press left the sentinel
   * in view — so at 1440 the first press went 5 → 10 and the second, with the sentinel firing as
   * well, 10 → 20 under a label that promises five (6.2). The sentinel is stood down for a moment
   * after a press: the button answers the press, and a *scroll* is what may pull more.
   */
  const sentinelPausedUntil = useRef(0);

  /* The sentinel is armed by a scroll, the way the two long lists are: without it a tall window
     can hold a batch and the sentinel at once and pull the whole board in unbidden. */
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mark = () => setHasScrolled(true);
    window.addEventListener('scroll', mark, { once: true, passive: true });
    return () => window.removeEventListener('scroll', mark);
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || hidden <= 0 || !hasScrolled || typeof IntersectionObserver === 'undefined') {
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting) && Date.now() > sentinelPausedUntil.current) {
          setGrown((current) => current + ROWS_PER_LOAD);
        }
      },
      { rootMargin: '400px 0px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hidden, hasScrolled, shown.length]);

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
   * A row's plan action names that departure's destination and nothing else.
   *
   * It used to run a search on the spot — carrying the session's other end with it when there
   * was one, and inventing a departure time from the row when there was not — so the traveller
   * was dropped on results for a journey they never described (F28). Now the row fills the TO
   * and opens the planner on the FROM.
   */
  const planTo = (departure: Departure) => {
    navigate(`/?to=${departure.destinationStopId}&pick=from`);
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
                {delayed ? (
                  <span className="board-list__delta">
                    <span className="strike">{format.time(departure.planned)}</span>
                    <span className="delay">+{departure.delayMinutes}</span>
                  </span>
                ) : null}
              </span>

              <span className="board-list__main">
                <span className="board-list__destination">{departure.destinationLabel}</span>
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

              {/* A ferry's platform is a word ("Pier 1"), and the compact rule prefixes a bare
                  `P` for the numbers — so it rendered "PPier 1" at 320/390/768 (5.8, 6.5). A
                  named platform takes the value alone and no prefix. */}
              <span
                className={`board-list__platform${/^\d/.test(departure.platform) ? '' : ' board-list__platform--named'}`}
                title={t('Platform {platform}', { platform: departure.platform })}
              >
                <span className="board-list__platform-label">{t('Platform')}</span>
                {departure.platform}
              </span>

              <span className="board-list__actions">
                {departure.cancelled && departure.disruptionId ? (
                  <Link
                    className="board-list__alert"
                    to={`/disruptions/${departure.disruptionId}`}
                    aria-label={t('Alert for service {line}', { line: departure.lineNumber })}
                  >
                    <Icon name="alert" size={15} />
                  </Link>
                ) : null}
                <IconButton
                  icon="route"
                  /* Five identical names on a ferry board told a screen reader nothing about which
                     departure each one plans (6.9). The time is what tells them apart. */
                  label={t('Plan a journey to {stop} at {time}', {
                    stop: departure.destinationLabel,
                    time: format.time(departure.expected),
                  })}
                  variant="ghost"
                  onClick={() => planTo(departure)}
                />
              </span>
            </li>
          );
        })}
      </ul>

      {hidden > 0 || expanded ? (
        <div className="row-wrap list-foot">
          {/* The loader's marker lives *inside* this row, absolutely. As a child of the column it
              was a flex item of its own and cost a second gap: the list and the button sat 24px
              apart when there was more to load and 12px apart when there was not. */}
          {hidden > 0 ? <div ref={sentinelRef} aria-hidden="true" /> : null}
          <button
            type="button"
            /* Bordered, like the "Show N more" on the stops list and the alert list: one
               control that extends a list wears one shape. */
            className="btn btn--sm"
            onClick={() => {
              /* "Show only the next departures" resets without the sentinel immediately
                 reloading the five it just hid (6.2, second half). */
              sentinelPausedUntil.current = Date.now() + 1200;
              setGrown((current) => (hidden > 0 ? current + ROWS_PER_LOAD : limit));
            }}
          >
            <Icon name={hidden > 0 ? 'chevronDown' : 'chevronUp'} size={15} />
            {hidden > 0
              ? t('Show {count} more', { count: next })
              : t('Show only the next departures')}
          </button>
          <span className="t-sm t-faint">
            {/*
             * **The count, not the count's noun.** This passed `plural(…, 'departure')`, which is
             * already the phrase "20 departures", into a sentence that supplies the word itself —
             * so every board read *"5 of 20 departures departures in this window"* (seen on a
             * 1440 board the audits never looked at, because no measurement in this project reads
             * a sentence). The noun belongs to the translated string, where a language that orders
             * or inflects it differently can own it.
             */}
            {t('{shown} of {total} departures in this window', {
              shown: shown.length,
              total: departures.length,
            })}
          </span>
        </div>
      ) : null}
    </div>
  );
}

export function boardStopLabel(stopId: string): string {
  return getStop(stopId)?.name ?? stopId;
}
