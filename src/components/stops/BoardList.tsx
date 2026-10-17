import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../state/AppState';
import { getLine } from '../../data/network';
import { operatorName } from '../../data/operators';
import { getStop } from '../../data/stops';
import { useFormat } from '../../lib/useFormat';
import { useT } from '../../lib/useT';
import { EmptyState, IconButton } from '../ui/primitives';
import { Icon } from '../ui/Icons';
import type { Departure } from '../../data/types';
import { plural } from '../../lib/format';
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
  limit = 6,
  emptyHint,
}: {
  departures: Departure[];
  limit?: number;
  emptyHint?: string;
}) {
  /*
   * The rows hold back more of the board, five at a time — a board row is one row, so the rule
   * (see `lib/loadBatch.ts`) is five departures per press, not "the rest of the board at once".
   * `limit` is still how many rows this screen wants to open with: the board page asks for six,
   * the stop page five, a widget four.
   */
  const [grown, setGrown] = useState(limit);
  const format = useFormat();
  const t = useT();
  const navigate = useNavigate();
  const { search, startSearch, preferences } = useApp();

  if (departures.length === 0) {
    return (
      <EmptyState
        icon="board"
        title="No departures right now"
        description={emptyHint ?? 'This stop has no departures in the current window.'}
      />
    );
  }

  const shown = departures.slice(0, grown);
  const hidden = departures.length - shown.length;
  const next = Math.min(ROWS_PER_LOAD, hidden);

  const planTo = (departure: Departure) => {
    if (search) {
      startSearch({ ...search.query, toStopId: departure.destinationStopId, preferences });
    } else {
      startSearch({
        fromStopId: departure.stopId,
        toStopId: departure.destinationStopId,
        date: new Date().toISOString().slice(0, 10),
        time: Math.floor(departure.planned / 5) * 5,
        timeMode: 'depart',
        preferences,
      });
    }
    navigate('/results');
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

              <span className="board-list__platform" title={`Platform ${departure.platform}`}>
                <span className="board-list__platform-label">Platform</span>
                {departure.platform}
              </span>

              <span className="board-list__actions">
                {departure.cancelled && departure.disruptionId ? (
                  <Link
                    className="board-list__alert"
                    to={`/disruptions/${departure.disruptionId}`}
                    aria-label={`Alert for service ${departure.lineNumber}`}
                  >
                    <Icon name="alert" size={15} />
                  </Link>
                ) : null}
                <IconButton
                  icon="route"
                  label={`Plan a journey to ${departure.destinationLabel}`}
                  variant="ghost"
                  onClick={() => planTo(departure)}
                />
              </span>
            </li>
          );
        })}
      </ul>

      {hidden > 0 || grown > limit ? (
        <div className="row-wrap">
          <button
            type="button"
            /* Bordered, like the "Show N more" on the stops list and the alert list: one
               control that extends a list wears one shape. */
            className="btn btn--sm"
            onClick={() => setGrown((current) => (hidden > 0 ? current + ROWS_PER_LOAD : limit))}
          >
            <Icon name={hidden > 0 ? 'chevronDown' : 'chevronUp'} size={15} />
            {hidden > 0 ? `Show ${next} more` : 'Show only the next departures'}
          </button>
          <span className="t-sm t-faint">
            {shown.length} of {plural(departures.length, 'departure')} in this window
          </span>
        </div>
      ) : null}
    </div>
  );
}

export function boardStopLabel(stopId: string): string {
  return getStop(stopId)?.name ?? 'Unknown stop';
}
