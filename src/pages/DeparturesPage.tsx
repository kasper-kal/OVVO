import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../state/AppState';
import { PageHeader } from '../components/layout/AppShell';
import { BoardList } from '../components/stops/BoardList';
import { StopCombobox } from '../components/journey/StopCombobox';
import { customStopName, getStop, hasBoard } from '../data/stops';
import { boardForStop } from '../data/departures';
import { STORAGE_KEYS, writeStored } from '../lib/storage';
import { disruptionsForStop } from '../data/disruptions';
import { useMinuteNow } from '../lib/useMinuteNow';
import { Button, Card, EmptyState, IconButton } from '../components/ui/primitives';
import { Icon, ModeIcon } from '../components/ui/Icons';
import { useFormat } from '../lib/useFormat';
import { useT } from '../lib/useT';
import { useRevealOnScrollUp } from '../lib/useRevealOnScrollUp';
import type { Stop } from '../data/types';

/**
 * Departure boards — every stop you pin, one list each.
 *
 * The previous version was a single board with a stop picker, and the only "keep" control on it
 * was the pin that meant *favourite*. That pin now has its own glyph (the heart) and its own list
 * (the stop lists and the search), and this screen uses the pin for what it always described: a
 * stop whose board is on this page. The board holds as many of those as the traveller pins — the
 * dialog pins several at once — because somebody who commutes through two stations wants both
 * boards in the morning, not one and a link.
 *
 * The word "favourite" still appears here, in the picker, where it is useful: favourites are
 * listed first and marked with the heart, so the two lists can be told apart where they meet.
 */

/**
 * How often the board re-reads the clock.
 *
 * A constant, not a setting: the board is a live screen, and the interval it was offered with
 * — off, 5, 15, 30 or 60 seconds — was a five-option control that wrapped into two rows
 * inside its own capsule on a phone (the fifth shape of the same defect this app keeps
 * growing). Nobody wants a departure board that updates slower than the departures do.
 */
const BOARD_REFRESH_SECONDS = 5;

export function DeparturesPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    settings,
    search,
    startSearch,
    preferences,
    boardStopIds,
    isOnBoard,
    toggleBoardStop,
    setBoardStops,
    pushToast,
  } = useApp();
  const format = useFormat();
  const t = useT();

  /*
   * The clock, in the browser's own time, re-read on the minute (see `useMinuteNow`).
   *
   * It used to be `Math.max(0, nowMinutes() - 1)`: every board on this screen started a minute
   * in the past, so a departure that had already left was listed as upcoming and the "from"
   * line named a minute that had gone. That subtraction is gone, and the tick is aligned to :00
   * rather than to whenever the page happened to mount.
   */
  const minutes = useMinuteNow();
  const [tick, setTick] = useState(0);
  /* The board's refresh waits to be reached for: reach up for it, scroll down and it leaves. */
  const refreshRevealed = useRevealOnScrollUp();

  /*
   * A `?stop=` is the traveller asking for a stop — from an alert, a stop page, a widget's
   * "open the full board" — so following one pins that stop to the board (it does not replace
   * the others) and is remembered as the stop they last chose.
   */
  const requestedStop = params.get('stop');
  const requested = requestedStop ? getStop(requestedStop)?.id : undefined;

  useEffect(() => {
    if (!requested) return;
    writeStored(STORAGE_KEYS.boardStop, requested);
    if (!boardStopIds.includes(requested)) setBoardStops([...boardStopIds, requested]);
  }, [requested, boardStopIds, setBoardStops]);

  /*
   * The stops whose boards this page shows, read from the pins and filtered to the ones a board
   * exists for: a pinned landmark or address is a walking destination, and a board cannot be
   * drawn for a museum. The test is `hasBoard`, the same one the picker uses, so the two cannot
   * disagree about what a board is.
   */
  const pinnedStops = useMemo(
    () =>
      boardStopIds
        .map((id) => getStop(id))
        .filter((candidate): candidate is Stop => candidate !== undefined && hasBoard(candidate)),
    [boardStopIds],
  );

  /*
   * With nothing pinned, the board still opens on the default origin the traveller set in
   * Settings — that stop's board, shown once, **not** quietly added to the pins. It is the one
   * candidate that is the traveller's own statement of where they travel from, and the card's
   * pin control starts empty so pinning it stays one tap away. A favourite is not consulted
   * here: hearting a place does not put a board on this page.
   */
  const defaultStop = useMemo(() => {
    if (boardStopIds.length) return null;
    const candidate = getStop(settings.defaultOriginStopId ?? undefined);
    return candidate && hasBoard(candidate) ? candidate : null;
  }, [boardStopIds, settings.defaultOriginStopId]);

  const shownStops = pinnedStops.length ? pinnedStops : defaultStop ? [defaultStop] : [];

  const boards = useMemo(
    () =>
      shownStops.map((stop) => {
        const departures = boardForStop(stop.id, { fromMinutes: minutes, limit: 20, tick });
        return {
          stop,
          departures,
          alerts: disruptionsForStop(stop.id),
          delayed: departures.filter((departure) => departure.delayMinutes > 0).length,
        };
      }),
    [shownStops, minutes, tick],
  );

  /*
   * What the field holds: the stop that was added last (or the one the URL asked for, or the
   * default origin), so the control confirms what it just did and carries that stop's own code and
   * modes in the hint line beneath it — the line every other picker in the app puts under a chosen
   * stop. The field is still an **add**: choosing any stop pins it beside the others, and clearing
   * it (×) leaves the boards alone.
   */
  const fieldStop = useMemo(() => {
    const candidate = requested ?? boardStopIds[boardStopIds.length - 1];
    return (candidate ? getStop(candidate) : defaultStop) ?? null;
  }, [requested, boardStopIds, defaultStop]);

  const changeStop = (stop: Stop) => {
    if (!isOnBoard(stop.id)) toggleBoardStop(stop.id);
    writeStored(STORAGE_KEYS.boardStop, stop.id);
    setParams({}, { replace: true });
  };

  /**
   * “Choose stops” is a signpost, not a second way to pin: it brings the search box into view and
   * puts the caret in it, which is the one control that adds a board. Saying the same instruction
   * once, in the place it is read first, is what stops the page from having two competing actions.
   */
  const focusSearch = () => {
    const input = document.getElementById('board-stop') as HTMLInputElement | null;
    input?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    input?.focus({ preventScroll: true });
  };

  return (
    <div className="stack-6">
      {/*
        The board's refresh, and the page's only action — the first row of the page, which the
        page only grows a row for when it is reached for.

        Hidden, it is not a reserved-empty row: it is no box and no gap, so the board sits
        exactly where it sat before the control existed. Revealed, it is a 44px row of its own,
        in the flow, pushing the page down by its height — the pull has nothing left to scroll,
        so the page makes room for the thing that was asked for instead (see
        `useRevealOnScrollUp`). It is at the top because the gesture that summons it only exists
        at the top: mid-board, an upward scroll is just a scroll.

        `inert` while it is away: the row is collapsed and clipped, and a control that cannot be
        seen must not be reachable by tab or by a screen reader either.
      */}
      <div
        className={`board-refresh${refreshRevealed ? ' board-refresh--shown' : ''}`}
        inert={!refreshRevealed}
      >
        <IconButton
          icon="refresh"
          label={t('Refresh departures')}
          className="board-refresh__btn"
          onClick={() => setTick((value) => value + 1)}
        />
      </div>

      <PageHeader
        title={t('Departure boards')}
        description={t('Every stop you pin, one board each.')}
      />

      {/*
        **One** way to put a stop on this page: the search box. It is where the action belongs —
        you name the stop, and it becomes a board — and it does it for as many stops as you like,
        one after another, without a second control that pins a different way. “Choose stops” in the
        empty state below is a signpost to this field, not a second picker.
      */}
      <Card hero className="stack">
        {/*
         * One heading shorter than it was, and no line that says nothing.
         *
         * The card used to stack a section heading, a status line and the field's label 4px
         * apart over a control whose placeholder asks its own question. The heading said nothing
         * the page title does not, so it is gone; the small label the field wears stays, because
         * "add a stop to the board" is what this control *does* and the placeholder only says
         * how to use it. The count in between now speaks only when it has something to count —
         * with nothing pinned and no default origin the card is the label and the field, and the
         * empty state below explains what pinning is for.
         */}
        {defaultStop || pinnedStops.length > 0 ? (
          <span className="t-sm t-muted">
            {defaultStop
              ? t('Showing your default origin')
              : pinnedStops.length === 1
                ? t('{count} stop pinned to the board', { count: pinnedStops.length })
                : t('{count} stops pinned to the board', { count: pinnedStops.length })}
          </span>
        ) : null}
        <StopCombobox
          id="board-stop"
          label={t('Add a stop to the board')}
          value={fieldStop}
          onSelect={(next) => next && changeStop(next)}
          placeholder={t('Search a station or stop')}
          filter={hasBoard}
          emptyHint={t('Only a station or stop has a departure board.')}
        />
      </Card>

      {boards.length === 0 ? (
        <Card className="stack">
          <EmptyState
            icon="board"
            title={t('No stops pinned to the board')}
            description={t(
              'Pin a stop and its departures appear here. You can pin several at once — they are the boards this page shows, not your favourites.',
            )}
          >
            <Button variant="primary" icon="search" onClick={focusSearch}>
              {t('Choose stops')}
            </Button>
          </EmptyState>
        </Card>
      ) : null}

      {boards.map(({ stop, departures, alerts, delayed }) => (
        <Card key={stop.id} className="stack">
          <div className="between wrap">
            <div className="stack-1">
              <h2 className="t-section">{customStopName(stop.id) ?? stop.name}</h2>
              <span className="t-sm t-muted">
                {customStopName(stop.id) ? `${stop.name} · ` : ''}
                {stop.city} · {stop.code} ·{' '}
                {stop.modes
                  .filter((mode) => mode !== 'walk' && mode !== 'bike')
                  .map((mode) => (
                    <span key={mode} className="row row--inline">
                      <ModeIcon mode={mode} size={13} />
                    </span>
                  ))}
              </span>
            </div>
            {/*
              The pin is the trailing control of the row that names the stop — pinned boards are
              what this page is, so the control that removes one belongs to its own heading,
              filled while the board is here (which it always is, on this page).
            */}
            <div className="card-actions">
              <Link to={`/stops/${stop.id}`} className="btn btn--sm">
                <Icon name="station" size={15} />
                {t('Stop page')}
              </Link>
              <IconButton
                icon="pin"
                label={
                  isOnBoard(stop.id)
                    ? t('Unpin {stop} from the departure board', {
                        stop: customStopName(stop.id) ?? stop.name,
                      })
                    : t('Pin {stop} to the departure board', {
                        stop: customStopName(stop.id) ?? stop.name,
                      })
                }
                active={isOnBoard(stop.id)}
                className="glyph-toggle"
                onClick={() => toggleBoardStop(stop.id)}
              />
            </div>
          </div>

          <div className="between wrap">
            <span className="field__label">
              {t('Next departures · from {time}', { time: format.time(minutes) })}
            </span>
            <span className="t-sm t-faint">
              {delayed
                ? t(delayed === 1 ? '{count} delay in this window · ' : '{count} delays in this window · ', {
                    count: delayed,
                  })
                : ''}
              {t('auto-refresh every {seconds}s', { seconds: BOARD_REFRESH_SECONDS })}
            </span>
          </div>

          <BoardList departures={departures} limit={6} />

          {alerts.length ? (
            <Link to={`/disruptions?stop=${stop.id}`} className="row t-sm tap-target board-alerts">
              <Icon name="alert" size={15} />
              {t(alerts.length === 1 ? '{count} alert affects {stop}' : '{count} alerts affect {stop}', {
                count: alerts.length,
                stop: customStopName(stop.id) ?? stop.name,
              })}
              <Icon name="chevronRight" size={14} />
            </Link>
          ) : null}

          {/*
            The planning shortcuts belong to the board they name: with several boards on this
            page, "from here" has to mean a particular stop.

            The 4px step above the row is not decoration. The alerts link above it is a
            `tap-target`, whose hit area reaches 14px beyond its own box; a card's 12px gap left
            the buttons' top 2px inside the link's overlay, so a press on the very top of "Plan from
            here" hit the link instead (measured: the 44×44 probe at the button's top edge landed on
            `a.row.tap-target`). One small step of separation is what makes both targets real — the
            same fix, for the same reason, as the board's "Show N more" row.
          */}
          <div className="row-wrap" style={{ marginTop: 'var(--s-1)' }}>
            <Button
              size="sm"
              /* `route`, not the crosshair: this plans a journey, it does not locate anyone. */
              icon="route"
              onClick={() => {
                if (!search) {
                  pushToast('Plan a journey first to use this shortcut', 'warning');
                  return;
                }
                startSearch({ ...search.query, fromStopId: stop.id, preferences });
                navigate('/results');
              }}
            >
              {t('Plan from here')}
            </Button>
            <Button
              size="sm"
              /* Same glyph as "Plan from here" beside it — the pair is one action, and the
                 words say which end of the journey this stop is. */
              icon="route"
              onClick={() => {
                if (!search) {
                  pushToast('Plan a journey first to use this shortcut', 'warning');
                  return;
                }
                startSearch({ ...search.query, toStopId: stop.id, preferences });
                navigate('/results');
              }}
            >
              {t('Plan to here')}
            </Button>
          </div>
        </Card>
      ))}

      {/*
        The "About this board" panel that used to close this page is gone: four lines of the
        software describing itself (which clock the times use, that the board ticks, what a pin
        means) on a screen whose only job is to show departures. Nothing in it was a fact about
        a departure, and the page above it already says everything it said — the refresh cadence
        is printed in the board's own header line, and pin-versus-favourite is asked and answered
        in the picker that sets them.
      */}

    </div>
  );
}
