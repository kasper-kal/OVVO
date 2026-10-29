import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../state/AppState';
import { HeaderButton, PageHeader, useHeaderControl } from '../components/layout/AppShell';
import { BoardList } from '../components/stops/BoardList';
import { StopCombobox } from '../components/journey/StopCombobox';
import { StopLink } from '../components/stops/StopLink';
import { PlanStopDialog } from '../components/stops/PlanStopDialog';
import { customStopName, getStop, hasBoard, stopLabel } from '../data/stops';
import { boardForLine, boardForStop } from '../data/departures';
import { directions, getLine } from '../data/network';
import { operatorName } from '../data/operators';
import { STORAGE_KEYS, writeStored } from '../lib/storage';
import { disruptionsForStop } from '../data/disruptions';
import { useMinuteNow } from '../lib/useMinuteNow';
import { Button, Card, EmptyState, Pill } from '../components/ui/primitives';
import { Icon, ModeIcon } from '../components/ui/Icons';
import { useFormat } from '../lib/useFormat';
import { useT } from '../lib/useT';
import { useOnline } from '../lib/useOnline';
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
    boardStopIds,
    isOnBoard,
    toggleBoardStop,
    setBoardStops,
    power,
  } = useApp();
  /*
   * **At a tenth of a battery, a board moves when it is asked to.**
   *
   * Five seconds is a cadence for a screen somebody is watching, and it is still the right cadence
   * at 80%, where a redraw is free. At 6% the same redraw is a re-render and a repaint twelve times
   * a minute, for rows whose times come from data this app already has on the device: nothing new
   * arrives, so nothing is saved by asking. The buttons stay exactly where they are (the Refresh
   * control in the bar, and the minute's own tick for the times), and the sentence under each board
   * says which of the two behaviours it is living with rather than promising five seconds it is not
   * doing.
   */
  const manualRefresh = power.mode === 'super';
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
  /* A board that cannot hear about a delay is a timetable, and it says so rather than pretending. */
  const online = useOnline();
  const [tick, setTick] = useState(0);
  /*
   * **One Plan control per board, and the choice behind it.**
   *
   * The foot of every board held two pills side by side — *Plan from here* and *Plan to here* —
   * which is the same question the stop page and the stop cards answer with **one** button and
   * `PlanStopDialog` ("is this where you leave from, or where you are going?"). The board kept the
   * pair through four rounds of audits because nothing was looking for it; now this page asks the
   * question the way the rest of the app does, and the pairs cannot come back (see
   * `scripts/plan-pair-audit.mjs`).
   */
  const [planStop, setPlanStop] = useState<Stop | null>(null);

  /*
   * **The board refreshed itself once a minute at best, while saying every 5 seconds.**
   *
   * `tick` existed but nothing incremented it on a timer, so the only thing that moved the rows was
   * `useMinuteNow`, and a twelve-second measurement produced zero mutations under a line that
   * promised five (6.1). The interval is the same constant the label prints, so the sentence and
   * the behaviour cannot drift apart again.
   */
  useEffect(() => {
    if (manualRefresh) return undefined;
    let timer = 0;
    const start = () => {
      window.clearInterval(timer);
      timer = window.setInterval(() => setTick((value) => value + 1), BOARD_REFRESH_SECONDS * 1000);
    };
    /*
     * **Five seconds is a cadence for a screen somebody is watching.** A board left open in the
     * background refreshed twelve times a minute for nobody, and a refresh is a re-render and a
     * repaint — the most expensive kind of work this app does. Hidden, the timer stops; on the way
     * back it ticks once at once, so the times on the board are current before the first frame the
     * traveller sees, and then resumes its five seconds.
     */
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        window.clearInterval(timer);
        timer = 0;
        return;
      }
      setTick((value) => value + 1);
      start();
    };
    start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [manualRefresh]);

  /*
   * **One refresh, in the corner a detail screen puts its way back.**
   *
   * It was one glyph per board, parked at the end of the sentence that says the board refreshes
   * itself — so a screen with three boards carried three copies of one page-level action, and the
   * corner where every other screen keeps its own control was empty. Asked for by name: "move the
   * Refresh button to the place of the back button on other pages".
   *
   * The page registers it with the shell (see `useHeaderControl`) and takes it away when it
   * unmounts, so the corner belongs to the bar and the button keeps the bar's own 44px disc and its
   * 20px step. It refreshes every board on the screen, which is what it always did — the line
   * board's own copy went with it.
   */
  const setHeaderControl = useHeaderControl();
  useEffect(() => {
    setHeaderControl(
      <HeaderButton
        icon="refresh"
        label={t('Refresh departures')}
        onClick={() => setTick((value) => value + 1)}
      />,
    );
    return () => setHeaderControl(null);
  }, [setHeaderControl, t]);

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
   * **The field holds nothing, ever.**
   *
   * It used to be filled with the stop that had just been added — or the one a `?stop=` link named,
   * or the default origin — so that "the control confirms what it just did" and its hint line could
   * carry that stop's code and modes. That confirmation is the wrong shape for an *add* control: the
   * stop is already on the page as the board underneath, so the screen said the same station twice
   * and the filled box sat under the words *Add a stop to the board*, reading as a search that had
   * been left behind (reported: "why does the old station stay in the search box when its already
   * pinned"). The board a `?stop=` link names is pinned and drawn; the field has nothing left to
   * say. Choosing a stop still pins it beside the others, and the × that a typed word brings still
   * only clears the field — it never unpins anything.
   */

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

  /*
   * A line is a destination too (F20): `?line=f3&stop=amsterdam-buiksloterweg` — the link a
   * "Lines calling here" row opens — is that service's own board at that stop, not the stop's
   * board with a filter on it. It answers the same question the stop board does (when does the
   * next one leave, from which platform, is it late) for one line, in both directions, and it
   * names the whole route so the traveller can see where that line goes.
   */
  const requestedLineId = params.get('line');
  const line = getLine(requestedLineId ?? undefined);
  const lineStop = getStop(params.get('stop') ?? undefined);
  const lineBoard = useMemo(
    () =>
      line && lineStop && line.stops.includes(lineStop.id)
        ? boardForLine(line.id, lineStop.id, { fromMinutes: minutes, limit: 16, tick })
        : [],
    [line, lineStop, minutes, tick],
  );

  if (line && lineStop && line.stops.includes(lineStop.id)) {
    return (
      <div className="stack-6">
        <PageHeader
          title={line.name}
          description={`${lineStop.name} · ${operatorName(line.operatorId)} · every ${line.headway} min`}
          showTitle
        />

        <Card className="stack">
          <div className="between wrap">
            <div className="stack-1">
              {/*
                The stop this line's board is at, as the way to its page.

                This head used to end in a **Stop page** button of its own, and so did every
                board's head below: four boards, four buttons, all saying the one word the stop's
                own name can say. A station's name is the way to its page everywhere else in this
                app (`StopLink`), so it is here too, underlined — and the head keeps only the one
                control that has no word for what it does.
              */}
              <h2 className="t-section">
                {t('Next departures from')} <StopLink stopId={lineStop.id} label={lineStop.name} />
              </h2>
              <span className="t-sm t-muted">
                {manualRefresh
                  ? t('Updates only when you tap Refresh')
                  : t('auto-refresh every {seconds}s', { seconds: BOARD_REFRESH_SECONDS })}
              </span>
            </div>
          </div>
          <BoardList
            departures={lineBoard}
            emptyHint={t('This line has no departures left today at this stop.')}
          />
        </Card>

        <Card className="stack">
          <h2 className="t-section">{t('Route')}</h2>
          {directions(line).map((dir) => {
            const terminus = dir.stops[dir.stops.length - 1];
            return (
              <div key={dir.index} className="stack-1">
                <span className="field__label">
                  {t('Towards')} <StopLink stopId={terminus} label={stopLabel(terminus)} />
                </span>
                {/* Every stop on the route is a station's own name in a line, so every one of them
                    is the way to that station's page — the same word-link a board row uses. */}
                <div className="row-wrap">
                  {dir.stops.map((stopId, index) => (
                    <span key={stopId} className="row row--inline">
                      {index > 0 ? <Icon name="chevronRight" size={12} /> : null}
                      <StopLink
                        stopId={stopId}
                        label={stopLabel(stopId)}
                        className={stopId === lineStop.id ? 't-sm t-strong' : 't-sm t-muted'}
                      />
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </Card>
      </div>
    );
  }

  return (
    <div className="stack-6">
      {/*
        No refresh at the top of the page.

        There was one, and it was always there: a lone glyph on a row of its own between the app's
        header and the page's name, refreshing *a page of boards* while every card under it already
        said "auto-refresh every 5 seconds". It had started as a 0px row revealed by an upward
        wheel at the top, and the fix for that being undiscoverable was to show it permanently — the
        ask was for it to be found, not for a control that never has nothing to do. A refresh
        belongs to the board it refreshes, so it sits in each board's own head, beside that
        sentence (see the stop card's header, and the line board's, which already had it).
      */}

      {/* Every list screen draws its own name (MATCHING_PLAN rule 5): a phone has no menu on
          screen, and the traveller arriving from a link has to be told where they are. */}
      <PageHeader
        title={t('Departure boards')}
        description={t('Every stop you pin, one board each.')}
        showTitle
      />

      {/*
        **One** way to put a stop on this page: the search box. It is where the action belongs —
        you name the stop, and it becomes a board — and it does it for as many stops as you like,
        one after another, without a second control that pins a different way. “Choose stops” in the
        empty state below is a signpost to this field, not a second picker.
      */}
      <Card hero className="stack">
        {/*
          The first slot of the filter row (MATCHING_PLAN rule 1): on this screen the control
          that *is* the search is the stop field — the board's list is chosen by naming a stop.
          It wears the same row class as the stops list and the alerts list, so the row starts in
          the same place on every screen. There is no sort (a board is in time order by its own
          nature) and no Options chip, because nothing here hides behind one.
        */}
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
        <div className="stops-filters" data-filter-row>
          <StopCombobox
            id="board-stop"
            label={t('Add a stop to the board')}
            /* Nothing is ever chosen here: the choice becomes a board, and the box goes back to
               asking. `clearAfterPick` is what stops the pick writing its own name into it. */
            value={null}
            clearAfterPick
            onSelect={(next) => next && changeStop(next)}
            placeholder={t('Search a station or stop')}
            filter={hasBoard}
            emptyHint={t('Only a station or stop has a departure board.')}
          />
        </div>
      </Card>

      {boards.length === 0 ? (
        <Card className="stack">
          {/*
            An address or a landmark has no board, and `?stop=` pins it all the same — so the page
            said "No stops pinned to the board" over a field holding "Utrecht, Domtoren" (6.4).
            The two are different facts: nothing is pinned, or the thing you asked for cannot have
            a board. This is the second one, and it names it.
          */}
          <EmptyState
            icon="board"
            headingLevel={2}
            title={
              requested && getStop(requested) && !hasBoard(getStop(requested)!)
                ? t('No board here')
                : t('No stops pinned to the board')
            }
            description={
              requested && getStop(requested) && !hasBoard(getStop(requested)!)
                ? t('{stop} is a walking destination: no bus, tram, metro, train or ferry calls there, so there are no departures to list. Pick a station or stop above.', {
                    stop: getStop(requested)!.name,
                  })
                : t(
                    'Pin a stop and its departures appear here. You can pin several at once: they are the boards this page shows, not your favourites.',
                  )
            }
          >
            <Button variant="primary" icon="search" onClick={focusSearch}>
              {t('Choose stops')}
            </Button>
          </EmptyState>
        </Card>
      ) : null}

      {boards.map(({ stop, departures, alerts, delayed }) => (
        <Card key={stop.id} className="stack">
          {/*
            **The head is the stop's name and nothing else.** It used to carry a pin on its trailing
            edge, filled because a board is a pinned stop; see the note on the remove control at the
            foot of this card for why it is not there any more.
          */}
          <div className="stack-1">
              <h2 className="t-section">
                <StopLink stopId={stop.id} label={customStopName(stop.id) ?? stop.name} />
              </h2>
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

          <div className="between wrap">
            <div className="row-wrap">
              <span className="field__label">
                {t('Next departures · from {time}', { time: format.time(minutes) })}
              </span>
              {/* Offline, the board is the timetable — it says so where the times are, not only in
                  the strip at the top of the page. */}
              {online ? null : (
                <Pill tone="coral" dot dotTone="coral">
                  {t('Not live')}
                </Pill>
              )}
            </div>
            {/* The sentence on its own now: the glyph that used to sit at the end of it is the
                screen's one refresh, in the bar's start corner (see the `useHeaderControl` note at
                the top of this file). */}
            <span className="t-sm t-faint">
              {delayed
                ? t(delayed === 1 ? '{count} delay in this window · ' : '{count} delays in this window · ', {
                    count: delayed,
                  })
                : ''}
              {manualRefresh
                ? t('Updates only when you tap Refresh')
                : t('auto-refresh every {seconds}s', { seconds: BOARD_REFRESH_SECONDS })}
            </span>
          </div>

          <BoardList departures={departures} />

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
            The planning shortcut belongs to the board it names: with several boards on this
            page, "this stop" has to mean a particular stop — so the button carries the stop's name
            for a screen reader, and the dialog it opens names the stop too.

            This row used to carry a 4px step of its own, because the alerts link above it was a
            `tap-target` reaching 14px outside its box and it took the button's top 2px with it.
            That link owns its 44px now and its overlay is `inset: 0`, so the step is gone and every
            gap in this card is the card's own 12px, top to bottom.
          */}
          <div className="row-wrap">
            {/* `route`, not the crosshair: this plans a journey, it does not locate anyone. */}
            <Button
              size="sm"
              icon="route"
              aria-label={t('Plan a journey with {stop}', { stop: customStopName(stop.id) ?? stop.name })}
              onClick={() => setPlanStop(stop)}
            >
              {t('Plan')}
            </Button>
            {/*
              **Taking a board away is said in words, at the board's own foot.**

              It was a filled pin in the card's head, trailing the stop's name. A board *is* a
              pinned stop, so that glyph was permanently in its "kept" state: it read as a badge
              stuck to the name rather than as a control, and a pin whose press removes the board
              means the opposite of what a pin means everywhere else in the app (the pin that adds a
              board lives in the picker). The action belongs with the board's other action, and it
              says what it does.
            */}
            <Button
              size="sm"
              variant="ghost"
              icon="close"
              aria-label={t('Remove {stop} from the board', {
                stop: customStopName(stop.id) ?? stop.name,
              })}
              onClick={() => toggleBoardStop(stop.id)}
            >
              {t('Remove from the board')}
            </Button>
          </div>
        </Card>
      ))}

      {/*
        The board's one Plan button, asking the two-choice question every other surface asks
        (`PlanStopDialog`): "from" fills the FROM and opens the picker on the TO, "to" does the
        mirror image, and neither reuses a search already in the session (F28).
      */}
      <PlanStopDialog
        stop={planStop}
        onClose={() => setPlanStop(null)}
        onPlan={(direction) => {
          if (!planStop) return;
          navigate(`/?${direction}=${planStop.id}&pick=${direction === 'from' ? 'to' : 'from'}`);
          setPlanStop(null);
        }}
      />

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
