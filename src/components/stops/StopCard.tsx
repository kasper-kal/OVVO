import { Link } from 'react-router-dom';
import { customStopName, formatDistance, hasBoard } from '../../data/stops';
import { modeLabel } from '../../data/preferences';
import { stopTypeLabel } from '../../lib/format';
import { useFormat } from '../../lib/useFormat';
import { useT } from '../../lib/useT';
import { Button, IconButton, Pill } from '../ui/primitives';
import { ResultCard, ResultCardLink } from '../ui/ResultCard';
import { Icon, ModeIcon } from '../ui/Icons';
import type { Departure, Stop } from '../../data/types';

/**
 * **One stop, as the stops list draws it.**
 *
 * It lives here rather than inside `StopsPage` because there are now two places that have to draw
 * the same card: the list itself, and the skeleton gallery (`pages/SkeletonDemoPage`), where a held
 * card is only worth looking at beside the card that replaces it. A second copy of these forty
 * lines in the lab would be a copy that could drift from the real one, and the whole point of the
 * comparison is that it cannot.
 *
 * The card is the way into the stop page — no STOP PAGE button in it — because `ResultCard` draws
 * the press, the one real link and the lift for the stop card, the alert card and the journey card
 * (MATCHING_PLAN rule 4). Its controls stop the press reaching the card.
 */
export function StopCard({
  stop,
  departures,
  distance,
  isFavourite,
  onToggleFavourite,
  onPlan,
}: {
  stop: Stop;
  departures: Departure[];
  /** Straight-line distance in metres, or null when the app has no position. */
  distance: number | null;
  isFavourite: boolean;
  onToggleFavourite: () => void;
  onPlan: () => void;
}) {
  const t = useT();
  const format = useFormat();
  const name = customStopName(stop.id) ?? stop.name;
  /* The services the card draws as chips — walking and cycling are not chips anywhere. */
  const modes = stop.modes.filter((mode) => mode !== 'walk' && mode !== 'bike');

  return (
    <ResultCard as="li" to={`/stops/${stop.id}`} className="stack-2 stop-card">
      {/* `stop-card__head` and `stop-card__meta` are shared with the held card
          (`ui/Skeletons.tsx`), which draws this row from the same name and the same meta line:
          the heart stays on the first line and the meta is one line, so the hold and the card it
          becomes are the same height at every width. */}
      <div className="between wrap stop-card__head">
        <div className="stack-1">
          <ResultCardLink to={`/stops/${stop.id}`}>{name}</ResultCardLink>
          <span className="t-sm t-muted stop-card__meta">
            {customStopName(stop.id) ? `${stop.name} · ` : ''}
            {stop.city} · {stop.code} · {stopTypeLabel(stop.type)}
            {/* A straight line, not a travel time, and only when we have a position. */}
            {distance !== null ? ` · ${formatDistance(distance)}` : ''}
          </span>
        </div>
        {/* `card-actions` so this control is held at the trailing edge at 320 too — the same group
            the departure board's card head uses. */}
        <div className="card-actions">
          <IconButton
            icon="heart"
            label={t(isFavourite ? 'Remove {stop} from favourites' : 'Add {stop} to favourites', { stop: name })}
            active={isFavourite}
            className="glyph-toggle"
            onClick={(event) => {
              event.stopPropagation();
              onToggleFavourite();
            }}
          />
        </div>
      </div>

      {/*
        The badge row exists only when there is a badge in it. Rendered empty — which it was for a
        landmark, whose only modes are walking and cycling — it was still a flex item, and a flex
        item costs a gap on each side: the card's rows sat 16px apart instead of 8, on exactly the
        stops that have least to say. `Skeletons.tsx` holds the row with the same condition, so the
        held card and this one still agree.
      */}
      {modes.length || stop.ovFiets ? (
        <div className="row-wrap">
          {modes.map((mode) => (
            <span key={mode} className={`mode-badge mode-badge--${mode}`}>
              <ModeIcon mode={mode} size={13} />
              {modeLabel(mode)}
            </span>
          ))}
          {/* The Step-free / Stairs-only pill is deleted with every other visible accessibility
              claim (F19). */}
          {stop.ovFiets ? <Pill tone="outline">OV-fiets</Pill> : null}
        </div>
      ) : null}

      {departures.length ? (
        <ul className="stop-card__board">
          {departures.map((departure) => (
            <li key={departure.id} className="stop-card__departure">
              <span className={`t-mono-num${departure.cancelled ? ' strike' : ''}`}>
                {format.time(departure.cancelled ? departure.planned : departure.expected)}
              </span>
              <span className="grow">{departure.destinationLabel}</span>
              {departure.delayMinutes > 0 && !departure.cancelled ? (
                <span className="delay">+{departure.delayMinutes}</span>
              ) : null}
              {departure.cancelled ? (
                <span className="delay">{t('Cancelled')}</span>
              ) : (
                /* `P6`, not a bare `6`: a lone digit at the end of a row reads as a stray number. */
                <span className="t-sm t-faint" title={`${t('Platform')} ${departure.platform}`}>
                  P{departure.platform}
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="row-wrap">
        {/*
          Two actions, both smaller than the buttons this row used to carry: Board is the way to
          that stop's own board, and Plan asks which end of the journey this stop is instead of
          offering two buttons that assume the answer. Both are text-only — no pill, no border —
          because the card already draws a surface and two white capsules inside it read as the
          card's furniture rather than as the two things you can do with the stop.
        */}
        {hasBoard(stop) ? (
          <Link
            to={`/departures?stop=${stop.id}`}
            className="btn btn--xs btn--ghost"
            onClick={(event) => event.stopPropagation()}
          >
            <Icon name="board" size={14} />
            {t('Board')}
          </Link>
        ) : null}
        <Button
          size="xs"
          variant="ghost"
          icon="route"
          onClick={(event) => {
            event.stopPropagation();
            onPlan();
          }}
        >
          {t('Plan')}
        </Button>
      </div>
    </ResultCard>
  );
}
