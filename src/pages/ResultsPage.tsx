import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { searchEntryId, useApp } from '../state/AppState';
import { PageHeader } from '../components/layout/AppShell';
import { SearchForm } from '../components/journey/SearchForm';
import { PreferencesControls } from '../components/journey/PreferencesControls';
import { JourneyCard } from '../components/journey/JourneyCard';
import { DEFAULT_RESULTS_FILTER, endLabel, filterJourneys, sortJourneys, suggestRelaxations } from '../data/journeyEngine';
import { ACCESS_MODES, DEFAULT_PREFERENCES, MODE_OPTIONS, PT_MODES, modeLabel } from '../data/preferences';
import { disruptionsForStop } from '../data/disruptions';
import { Button, Card, Chip, Dialog, EmptyState, Segmented } from '../components/ui/primitives';
import { NoMatches } from '../components/ui/NoMatches';
import { JourneyCardSkeletons } from '../components/ui/Skeletons';
import { Icon, ModeIcon } from '../components/ui/Icons';
import { nowMinutes, parseTimeInput, roundToStep, timeInputValue, todayIso } from '../lib/format';
import { useFormat } from '../lib/useFormat';
import { decodeSearchLink, encodeSearchLink } from '../lib/searchLink';
import { useT } from '../lib/useT';
import { alertWords } from '../lib/disruptionText';
import type { AccessMode } from '../data/preferences';
import type { PublicMode, SortMode } from '../data/types';

/**
 * How far one press of "Earlier" or "Later" moves the window, and how far it may go.
 *
 * Thirty minutes is the step the removed control used and the step the timetable is built on; four
 * hours each way is the clamp the state has always applied (`shiftWindow`). Past the clamp the
 * control is disabled rather than pressed into nothing.
 */
const WINDOW_STEP_MINUTES = 30;
const WINDOW_LIMIT_MINUTES = 240;

/** How long the results screen holds its list's place for a new search, in milliseconds. */
const HOLD_MS = 260;

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: 'best', label: 'Best' },
  { value: 'fastest', label: 'Fastest' },
  { value: 'fewestTransfers', label: 'Fewest transfers' },
  { value: 'leastWalking', label: 'Least walking' },
  { value: 'cheapest', label: 'Cheapest' },
  { value: 'latestDeparture', label: 'Latest departure' },
];

/**
 * Journey results — and the journey's options.
 *
 * The screen is the search itself: the same two-row card as the home planner (tap an end
 * and the full-screen picker opens over the results), then four chips — how you reach the
 * first stop, how you leave the last one, when you travel, and everything else — and then
 * the journeys. Nothing about the search hides behind a "modify" button, because the
 * question and the answer are the same screen in 9292 and separating them only cost the
 * traveller a tap.
 *
 * The when has its own chip because it is the one option people change most; the rest
 * (travel preferences, carriers, result filters) is one disclosure so the list stays the
 * first thing under the card. Sorting is not a search option — it is how you read the
 * list — so it keeps its place directly above the journeys.
 */
/**
 * The hold that is running for a search, and when it ends.
 *
 * Module scope on purpose: the screen is remounted whenever the address changes (the shell opens
 * every screen at its top), and the address is rewritten as soon as the search lands. A hold kept
 * in state alone was restarted by that remount, and by every press of **Earlier** or **Later** — a
 * shimmer over a list that had already been answered. This remembers the hold itself, so a
 * re-mount of the same search continues it and an expired one starts nothing.
 */
let heldSearch: { key: string; until: number } | null = null;

/** Whether a hold for this search is still inside its window (a new search always starts one). */
function holdIsRunning(key: string): boolean {
  return Boolean(key) && (!heldSearch || heldSearch.key !== key || heldSearch.until > Date.now());
}

export function ResultsPage() {
  /* The search the address names, if it names one — `/results/<id>` (`lib/searchLink`). */
  const { searchId } = useParams();
  const navigate = useNavigate();
  const {
    search,
    journeys,
    preferences,
    updatePreferences,
    updateSearchQuery,
    startSearch,
    adoptSearch,
    setSortMode,
    setFilter,
    resetFilter,
    shiftWindow,
    recentSearches,
    keepSearch,
    removeRecentSearch,
    power,
  } = useApp();
  /*
   * Read inside the effect through a ref: the hold belongs to the search, and a battery that
   * crosses a threshold (or a charger going in) must not replay it over a list already there.
   */
  const savingRef = useRef(power.mode !== 'off');
  savingRef.current = power.mode !== 'off';
  const format = useFormat();
  const t = useT();
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [whenOpen, setWhenOpen] = useState(false);
  /* A day that has gone is refused in words, not just by the native control's own validation
     bubble: the app used to store it and re-plan the list for yesterday, silently (23.2). */
  const [dateInvalid, setDateInvalid] = useState(false);
  const [accessSide, setAccessSide] = useState<null | 'from' | 'to'>(null);
  const [nowRef] = useState(() => roundToStep(nowMinutes(), 5));

  /*
   * **The screen holds its list's own shape while a search lands.**
   *
   * The results open in a *planning* state: the head, the search card and the chips paint at once,
   * and the list's place is held by three journey-shaped cards (`ui/Skeletons`). That hold is what
   * keeps a search from reading as a jump cut: the traveller asks for a journey, and the answer
   * arrives in the shape of one, at the height it will stand at, so the real cards replace it
   * without moving anything. It was part of this screen for several rounds and was dropped for a
   * while; it is back on request, and the shape it holds is the refined one (four marks per card,
   * not eleven).
   *
   * It is keyed to the **search**, never to a filter or a sort: those are readings of a list that is
   * already on screen, and a hold over them would be a wait for nothing.
   *
   * Battery saving skips it whole (the effect below): the planner is local and synchronous, so no
   * work is being waited on, and both the hold and the shimmer cost a phone on its last few percent
   * more than the hold is worth.
   */
  /* The ends are named as the traveller named them, for the same reason `searchEntryId` is: an
     address and the station it resolved to are one stop id and two different searches. */
  const searchKey = search
    ? `${search.query.fromLabel ?? search.query.fromStopId}|${search.query.toLabel ?? search.query.toStopId}|${search.query.date}|${search.query.time}|${search.query.timeMode}`
    : '';
  const [planning, setPlanning] = useState(power.mode === 'off' && holdIsRunning(searchKey));
  useEffect(() => {
    if (savingRef.current) {
      /* Saving keeps no hold at all: there is nothing being waited on, and both the wait and the
         shimmer cost a phone on its last few percent more than they are worth. */
      heldSearch = null;
      setPlanning(false);
      return undefined;
    }
    if (!searchKey) {
      setPlanning(false);
      return undefined;
    }
    const now = Date.now();
    if (heldSearch && heldSearch.key === searchKey) {
      /* The same search opening again (its address was rewritten): the hold carries on where it
         was rather than starting over, and when its window has gone the answer is simply there. */
      const left = heldSearch.until - now;
      setPlanning(left > 0);
      if (left <= 0) return undefined;
      const timer = window.setTimeout(() => setPlanning(false), left);
      return () => window.clearTimeout(timer);
    }
    heldSearch = { key: searchKey, until: now + HOLD_MS };
    setPlanning(true);
    const timer = window.setTimeout(() => setPlanning(false), HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [searchKey]);
  /* The battery reading lands after the first render; this ends a hold that started before it was
     known, and never starts one (so plugging in does not replay it over a list that is there). */
  useEffect(() => {
    if (power.mode !== 'off') setPlanning(false);
  }, [power.mode]);

  const visible = useMemo(() => {
    if (!search) return [];
    const filtered = filterJourneys(journeys, search.filter, preferences);
    return sortJourneys(filtered, search.sortMode, preferences);
  }, [search, journeys, preferences]);

  /*
   * **The address is the search.**
   *
   * Two effects, one rule: what is on the screen and what is in the address are the same thing, and
   * they are kept in step in both directions.
   *
   * The first reads the address into the screen — a reload, a bookmark, a pasted link, or the
   * browser's back button. It only acts when the address names a *different* search from the one
   * already open, so arriving on a link cannot throw away a search the traveller is reading, and a
   * re-render cannot adopt twice. `null` from the decoder is not acted on here: the screen says so
   * in words instead (see the empty state below).
   *
   * The second writes the screen back into the address, replacing the entry rather than pushing
   * one. That single line is why sorting, filters, the paged window and a changed end all survive a
   * refresh without a setter being wired to anything: they all change `search`, and this watches
   * `search`. `replace` keeps the history honest — pressing Back still goes to the screen the
   * results were opened from, not through a list you sorted six times.
   */
  /*
   * `writtenByUs` is what stops the two effects fighting.
   *
   * Reading the address and writing the address are opposites, and the first version of this read
   * *every* change of `search` as a disagreement with the address: clicking **Fastest** set the
   * sort, then the reader immediately decoded the old id and set it back to **Best** — the list
   * changed for one frame and reverted, and the address never mentioned the sort at all (measured:
   * 3 checks failing for that one reason). The address is now only read when it was *not* written
   * here, which is exactly the case that matters — a reload, a bookmark, a pasted link, Back.
   */
  const writtenByUs = useRef<string | null>(null);

  useEffect(() => {
    if (!searchId) return;
    if (writtenByUs.current === searchId) return;
    const decoded = decodeSearchLink(searchId);
    if (!decoded) return;
    writtenByUs.current = searchId;
    /* The address carries no preferences on purpose, so the ones in force here are the ones that
       filter the list — a stranger's link cannot overrule anyone's walking limit. */
    adoptSearch({ ...decoded, query: { ...decoded.query, preferences } });
  }, [searchId, preferences, adoptSearch]);

  useEffect(() => {
    if (!search) return;
    const id = encodeSearchLink(search);
    if (id === searchId) return;
    writtenByUs.current = id;
    navigate(`/results/${id}`, { replace: true });
  }, [search, searchId, navigate]);

  if (!search) {
    /* An address that names a search the app cannot read is a different answer from "you have not
       searched yet", and it is not the traveller's fault: say which one it is. */
    const unreadable = Boolean(searchId) && !decodeSearchLink(searchId ?? '');
    return (
      <div className="stack-6">
        <PageHeader
          title={t('Journey results')}
          description={unreadable ? t('This address does not name a search.') : t('No search has been run in this browser yet.')}
          showTitle
        />
        <EmptyState
          icon="search"
          title={unreadable ? t('That search could not be opened') : t('Nothing to show yet')}
          /* The page title above it is an `h1` and there is no section between them, so this is
             `h2` — an `h3` announced a section that does not exist (WCAG 1.3.1). */
          headingLevel={2}
          description={
            unreadable
              ? t('The address is missing a part of the search or names a stop this network does not have. Planning it again takes one step.')
              : t('Plan a journey first: its results will appear here, and this address will bring them back.')
          }
        >
          <Link to="/" className="btn btn--primary">
            <Icon name="search" size={16} />
            {t('Open the journey planner')}
          </Link>
        </EmptyState>
      </div>
    );
  }

  const { query, filter, sortMode } = search;
  /* Whether this exact search is already in this browser's own history — see `keepSearch`. */
  const kept = recentSearches.some((entry) => entry.id === searchEntryId(query));
  const stopAlerts = [...disruptionsForStop(query.fromStopId), ...disruptionsForStop(query.toStopId)].filter(
    (alert, index, list) => list.findIndex((item) => item.id === alert.id) === index,
  );
  const totalJourneys = journeys.length;
  /*
   * The date and time are the **device's own** pickers, by request.
   *
   * They were two of the app's own `<select>`s: a list of fourteen days and a list of 288 five-minute steps. That could be read in the app's format, but it asked the traveller to scroll a
   * list to answer "when", which is the one question a phone already answers with a calendar and
   * a clock. The native `<input type="date">` and `<input type="time">` open the operating
   * system's own pickers, and they need no JavaScript to do it.
   *
   * The cost is real and is stated rather than hidden: a native control draws in the device's
   * locale and format, so it will not follow the app's **Clock format** or **Date format**
   * settings — an American device shows 10/13/2026 and 2:05 PM. That is why the line under the
   * two fields reads the same answer back **in the app's own format** ("Today, 18 Oct · 2:05 pm"
   * with those settings on), so the two can never disagree without the app's version being on
   * the screen beside it. The stored values are unchanged — an ISO date and minutes since
   * midnight — so nothing downstream of this dialog knows which control produced them.
   */
  const whenReadback = `${format.date(query.date, 'long')} · ${format.time(query.time)}`;
  const whenIsNow = query.date === todayIso() && query.time === nowRef && query.timeMode === 'depart';
  const whenLabel = whenIsNow
    ? t('Now')
    : `${query.date === todayIso() ? '' : `${format.date(query.date, 'dayMonth')} · `}${format.time(query.time)}`;

  /**
   * Why did nothing match? The engine re-plans with one setting relaxed at a
   * time, so the empty state can name the cause and offer the fix inline.
   */
  const offModes = MODE_OPTIONS.filter((mode) => !preferences.allowedModes.includes(mode));
  const relaxations = visible.length === 0 ? suggestRelaxations(query, filter) : [];
  const offModeNames = offModes.map(modeLabel).join(' and ').toLowerCase();
  const emptyReason = offModes.length
    ? preferences.allowedModes.includes('walk')
      ? t('Your settings leave out {modes}, so journeys that need it are hidden.', { modes: offModeNames })
      : t(offModes.length === 1
          ? 'Walking is switched off and {modes} is left out, so the planner cannot build an access leg.'
          : 'Walking is switched off and {modes} are left out, so the planner cannot build an access leg.', { modes: offModeNames })
    : t(
        'No mode is switched off, so the walking limit, the transfer limit or a result filter removed every option.',
      );

  /*
   * Measured against the defaults, not against "off": hiding cancelled journeys is the default now,
   * and counting it as a filter made every fresh search announce an option before the traveller had
   * touched one.
   */
  const hasFilters =
    filter.modes.length > 0 ||
    filter.directOnly ||
    filter.delayedOnly ||
    filter.hideCancelled !== DEFAULT_RESULTS_FILTER.hideCancelled ||
    filter.operatorIds.length > 0;

  /** How many options differ from a fresh planner — the count on the Options chip. */
  const optionCount = [
    preferences.allowedModes.length !== DEFAULT_PREFERENCES.allowedModes.length,
    preferences.maxTransfers !== DEFAULT_PREFERENCES.maxTransfers,
    preferences.maxWalkingMinutes !== DEFAULT_PREFERENCES.maxWalkingMinutes,
    preferences.preferFewerTransfers,
    preferences.preferLessWalking,
    hasFilters,
  ].filter(Boolean).length;

  /* No toast: the list is re-planned in front of the traveller, which is the whole feedback. */
  const applyRelaxation = (_label: string, patch: Partial<typeof preferences>) => {
    updatePreferences(patch);
    startSearch({ ...query, preferences: { ...preferences, ...patch } });
  };

  const accessOf = (side: 'from' | 'to'): AccessMode => (side === 'from' ? preferences.accessFrom : preferences.accessTo);

  return (
    <div className="stack-6">
      <PageHeader title={t('Journey results')} showTitle />

      {/* The card, and the two ends in it, are the search. Tapping either row opens the
          full-screen picker over this page. `inheritSearch`: this is the one card that is the
          search on screen — the home screen's card is the next question and starts empty. */}
      <SearchForm inheritSearch />

      <div className="results-bar" data-filter-row>
        {/*
          Every control that shapes this screen, on one line.
          `results-bar` was an auto-fit grid, so at 320 the chips and the sort stacked into **five**
          rows 326.8px tall and no journey was on the first screen of a small phone — the first card
          began 196.6px below the fold (2.4). Then the chips scrolled in a row of their own and the
          sort took the next row, which was two bands where one will do: there are two chips, so
          nothing has to scroll, and the sort is a chip like them.
        */}
        <div className="results-bar__row" role="group" aria-label={t('This search')}>
        {/*
          The two access chips moved to Options. They are settings *of the search* rather than the
          search itself (Start: walking, End: walking), and at 390 they pushed the row past its own
          width — which is why the last chip was drawn cut in half at the screen's edge. What is
          left here is the search's identity, the act that saves it, and the way into everything
          else.
        */}
        <button type="button" className="results-chip" onClick={() => setWhenOpen(true)}>
          <span className="results-chip__key">
            {t(query.timeMode === 'depart' ? 'Leave:' : 'Arrive:')}
          </span>
          <span className="results-chip__value">{whenLabel}</span>
        </button>
        {/*
          Saving the search, at the top of the page with the search it saves, rather than in a
          panel at the very bottom under every journey (the round's ask: "move the SAVE THIS
          SEARCH to somewhere else, somewhere more on the top of the page"). The words are the
          same act on a journey card *and* unmistakably not it: a **saved search** is this pair of
          stops to run again, a **saved journey** is one result with its own times — see the
          Favourite control on each card and the Saved searches widget.
        */}
        <button
          type="button"
          className="results-chip"
          aria-pressed={kept}
          aria-label={t(kept ? 'Saved as a search' : 'Save this search')}
          title={t(kept ? 'Saved as a search' : 'Save this search')}
          onClick={() => (kept ? removeRecentSearch(searchEntryId(query)) : keepSearch(query))}
        >
          {/*
            The word, not just the mark. On its own the bookmark was a 44px circle sitting beside a
            full-width pill, which read as a stray button belonging to no column; with "Save" on it
            it is the same shape as Options underneath and says what it does without a hover title.
          */}
          {/*
            **The bookmark fills when the search is saved.**

            It was a tick when saved — a second, different drawing for the same control, and one
            that says "done" rather than "this is now mine". Every other keeping control in the
            app (a favourite stop's heart, a journey's heart, a pinned board) keeps its own glyph
            and fills it, so this one does too: outline while the search is not kept, solid book
            while it is. The word beside it still reads `Save` / `Saved`, so the state is said in
            words as well.
          */}
          <Icon name={kept ? 'bookmarkFilled' : 'bookmark'} size={15} />
          {t(kept ? 'Saved' : 'Save')}
        </button>

        {/**
          * How to read the list, as one group: the sort and the disclosure.
          *
          * They are the two controls that are not the search, and on a phone they share the second
          * band — which is why they are wrapped rather than left as two loose items in the row: a
          * growing sort took the space on the chips' line and left Options alone on the next one.
          */}
        <div className="results-bar__read">
        {/*
          The sort, in the row (MATCHING_PLAN rule 1) — not in a card of its own above the list.
          A sort is how the list is read, so it sits with the other controls that shape this
          screen, and it is the fourth chip — its visible label is the answer ("Best"), and the words
          the row used to spend on "SORT BY" are the control's accessible name instead.
        */}
        <label className="results-chip results-chip--sort" htmlFor="results-sort">
          {/*
            The name is on the control, not on a `<span>` inside the label: a label's text is every
            text node under it, and this one wraps the select itself — so the span alone would give
            the control the name "Sort by Best Fastest Fewest transfers Least walking…".
          */}
          <select
            id="results-sort"
            className="results-chip__select"
            aria-label={t('Sort by')}
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value as SortMode)}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.label)}
              </option>
            ))}
          </select>
        </label>

        {/*
          Options last: it is the disclosure for everything not on the row, so it closes the row
          on every screen that has one (the stops list and the alerts list wear it in the same
          place). The count is how many settings differ from a fresh planner.
        */}
        <button
          type="button"
          className="results-chip"
          aria-expanded={optionsOpen}
          aria-controls="results-options"
          onClick={() => setOptionsOpen((value) => !value)}
        >
          <Icon name="sliders" size={15} />
          {t('Options')}
          {optionCount ? <span className="results-chip__count">{optionCount}</span> : null}
        </button>
        </div>

        {/*
          Only when it is not all of them. "7 of 7 shown" is a count of the result set by
          itself — it says nothing until the two numbers differ, and when they do the reader
          wants to know which are hidden, not how many.
        */}
        {visible.length !== totalJourneys ? (
          /* A filter changing the list changes this number, and it was silent (2.5). */
          <span className="t-sm t-muted" role="status" aria-live="polite">
            {t('{shown} of {total} shown', { shown: visible.length, total: totalJourneys })}
          </span>
        ) : null}
        </div>
      </div>

      {optionsOpen ? (
        <div id="results-options">
          <Card className="stack">
          {/*
            No heading row. This panel opened with an icon and the words "Search options", which
            read as a control of their own and said nothing the Options chip above and the
            controls below did not already say — the same row the traveller circled on the alerts
            and stations screens. The count is kept: it is the one thing in that row that is not a
            label for what is already visible.
          */}
          {optionCount ? (
            <span className="t-sm t-muted">{t('{count} changed from the defaults', { count: optionCount })}</span>
          ) : null}

          {/* The two access chips, with room here for the answer as well as the question. */}
          <div className="row-wrap">
            <button type="button" className="results-chip" onClick={() => setAccessSide('from')}>
              <span className="results-chip__key">{t('Start:')}</span>
              <Icon name={accessOf('from') === 'bike' ? 'bike' : 'walk'} size={15} />
              {t(accessOf('from') === 'bike' ? 'Bicycle' : 'Walking')}
            </button>
            <button type="button" className="results-chip" onClick={() => setAccessSide('to')}>
              <span className="results-chip__key">{t('End:')}</span>
              <Icon name={accessOf('to') === 'bike' ? 'bike' : 'walk'} size={15} />
              {t(accessOf('to') === 'bike' ? 'Bicycle' : 'Walking')}
            </button>
          </div>

          {/* Without its hint lines: on this screen the controls are a panel of switches,
              each already named, and the explanations belong to the preferences page. */}
          <PreferencesControls preferences={preferences} onChange={updatePreferences} showModes={false} withHints={false} />

          <div className="row-wrap chip-group">
            <span className="field__label">{t('Filter by mode')}</span>
            {PT_MODES.map((mode) => (
              <Chip
                key={mode}
                selected={filter.modes.includes(mode)}
                onClick={() =>
                  setFilter({
                    modes: filter.modes.includes(mode)
                      ? filter.modes.filter((m) => m !== mode)
                      : [...filter.modes, mode as PublicMode],
                  })
                }
              >
                <ModeIcon mode={mode} size={15} />
                {t(modeLabel(mode))}
              </Chip>
            ))}
            {filter.modes.length ? (
              <Button size="sm" variant="ghost" icon="close" onClick={() => setFilter({ modes: [] })}>
                {t('Clear mode filter')}
              </Button>
            ) : null}
          </div>

          <div className="row-wrap">
            <Chip selected={filter.directOnly} onClick={() => setFilter({ directOnly: !filter.directOnly })}>
              {t('Direct journeys only')}
            </Chip>
            <Chip selected={filter.delayedOnly} onClick={() => setFilter({ delayedOnly: !filter.delayedOnly })}>
              {t('With delays')}
            </Chip>
            <Chip selected={filter.hideCancelled} onClick={() => setFilter({ hideCancelled: !filter.hideCancelled })}>
              {t('Hide cancelled')}
            </Chip>
          </div>

          <div className="row-wrap">
            <Button size="sm" variant="ghost" icon="refresh" onClick={resetFilter}>
              {t('Reset all filters')}
            </Button>
          </div>
        </Card>
        </div>
      ) : null}


      {planning ? (
        /*
          The held place, in the list's own columns.

          A ring in an empty card said *wait* and nothing about what was coming, so the answers
          landed as a change of subject on a screen that had been blank. Three cards carrying a
          journey's own measurements — the pair of times, the label, the chain of services, the fare
          — put the answer where the eye already is and keep its height.

          The sentence above them is the plain statement of what is happening; the bars underneath
          are `aria-hidden` and the region is `aria-busy`, so it is spoken once.
        */
        <div className="stack-2" role="status" aria-live="polite" aria-busy="true">
          <p className="t-sm t-muted">
            {t('Working out the options from {from} to {to}.', {
              from: endLabel(query, 'from'),
              to: endLabel(query, 'to'),
            })}
          </p>
          <JourneyCardSkeletons />
        </div>
      ) : visible.length === 0 ? (
        <NoMatches
          title={t('No journeys match your settings')}
          description={
            totalJourneys > 0
              ? t('{total} journeys were planned for this search, but these settings removed all of them.', {
                  total: totalJourneys,
                })
              : t('No journey matches this search with these settings.')
          }
          reason={`${emptyReason}${relaxations.length ? '' : ` ${t('Nothing helps for this search. Try another time or another pair of stops.')}`}`}
          fixes={relaxations.map((suggestion) => ({
            id: suggestion.id,
            label: suggestion.label,
            count: suggestion.journeys,
            onSelect: () => applyRelaxation(suggestion.label, suggestion.patch),
          }))}
        >
          {hasFilters ? (
            <Button variant="primary" icon="refresh" onClick={resetFilter}>
              {t('Reset result filters')}
            </Button>
          ) : null}
          <Link to="/preferences" className="btn">
            <Icon name="sliders" size={16} />
            {t('Adjust travel preferences')}
          </Link>
          <Button
            icon="clock"
            onClick={() => {
              startSearch({ ...query, time: Math.min(1439, query.time + 60), preferences });
            }}
          >
            {t('Try one hour later')}
          </Button>
        </NoMatches>
      ) : (
        <>
          {/*
           * The alerts first, then every journey — the traveller's order, and it reverses the
           * one recorded here before it. The banner used to sit between the first card and the
           * rest (item 8: the answer before its own caveat), which is where the circled block in
           * their screenshot was: "move the alerts affecting this search to on the top of the
           * results, before any other result". A warning about the search is about the search,
           * so it now opens the list, and the card that follows is read in the light of it.
           */}
          {stopAlerts.length > 0 ? (
            /*
              One line, not a banner.

              It was a `hairline` banner: an icon, the heading "Alerts affect this search" on a line
              of its own, and then the alert's title indented beneath it — 96px, three quarters of it
              empty, to say one thing. The heading said what the warning icon and the words "Cancelled
              services" already said, so the alert's own title is the row, and a second alert is a
              quiet "+1" at its end rather than another indented line under a headline.
            */
            <Link
              to={`/disruptions/${stopAlerts[0].id}`}
              className="search-alert"
              aria-label={
                stopAlerts.length === 1
                  ? t('1 alert affects this search: {title}', { title: alertWords(t, stopAlerts[0]).title })
                  : t('{count} alerts affect this search: {title}', {
                      count: stopAlerts.length,
                      title: alertWords(t, stopAlerts[0]).title,
                    })
              }
            >
              <Icon name="alert" size={16} className="search-alert__icon" />
              <span className="search-alert__text">
                {alertWords(t, stopAlerts[0]).title}
                {stopAlerts.length > 1 ? <span className="t-muted"> +{stopAlerts.length - 1}</span> : null}
              </span>
              <Icon name="chevronRight" size={14} className="t-faint" />
            </Link>
          ) : null}

          {/*
            Earlier, between the warning and the first journey.

            The list is a window of departures from the time in the search; these two controls walk
            that window without touching the search itself — "Leave: Now" stays exactly as it was, a
            whole thirty minutes per press, the way paging through a timetable reads. They sit at the
            list's ends because that is where the reader is looking for more: the top of the list is
            where "too late" is, and the bottom is where "nothing after this" is. The control that
            used to do this was removed from the date/time sheet on request; this is the home it was
            said to need.
          */}
          <button
            type="button"
            className="window-step"
            disabled={search.windowOffsetMinutes <= -WINDOW_LIMIT_MINUTES}
            onClick={() => shiftWindow(-WINDOW_STEP_MINUTES)}
          >
            <Icon name="chevronUp" size={12} />
            {t('Earlier')}
          </button>

          <ul className="stack-4">
            {visible.slice(0, 1).map((journey) => (
              <li key={journey.id}>
                <JourneyCard journey={journey} highlight={journey.label === 'fastest'} />
              </li>
            ))}
          </ul>

          {visible.length > 1 ? (
            <ul className="stack-4">
              {visible.slice(1).map((journey) => (
                <li key={journey.id}>
                  <JourneyCard journey={journey} highlight={journey.label === 'fastest'} />
                </li>
              ))}
            </ul>
          ) : null}

          {/* The other end of the same window: later departures, and the search untouched. */}
          <button
            type="button"
            className="window-step"
            disabled={search.windowOffsetMinutes >= WINDOW_LIMIT_MINUTES}
            onClick={() => shiftWindow(WINDOW_STEP_MINUTES)}
          >
            <Icon name="chevronDown" size={12} />
            {t('Later')}
          </button>
        </>
      )}

      {/*
        The "About these results" panel is deleted whole — disclaimer, save control and the four
        buttons to the two stops, the planner and the map. Saving the search moved up to the
        search's own row of chips at the top of the page (it is an act on the search, not on the
        list below it), both stops are named and tappable in the search card, and the map is in
        the navigation. The page now ends with the last journey.
      */}

      {/* How you reach the first stop and leave the last one: two options, so a popup and
          not a screen. */}
      <Dialog
        open={accessSide !== null}
        title={t(accessSide === 'from' ? 'How do you reach the first stop?' : 'How do you leave the last stop?')}
        description={t(
          accessSide === 'from'
            ? 'The planner will not begin your journey with a bicycle leg unless you ask for one.'
            : 'The planner will not end your journey with a bicycle leg unless you ask for one.',
        )}
        onClose={() => setAccessSide(null)}
      >
        <div className="stack-2">
          {ACCESS_MODES.map((mode) => {
            const selected = accessSide ? accessOf(accessSide) === mode.value : false;
            return (
              <button
                key={mode.value}
                type="button"
                className={`access-option${selected ? ' access-option--selected' : ''}`}
                aria-pressed={selected}
                onClick={() => {
                  if (!accessSide) return;
                  updatePreferences(accessSide === 'from' ? { accessFrom: mode.value } : { accessTo: mode.value });
                  setAccessSide(null);
                }}
              >
                <span className="access-option__icon">
                  <Icon name={mode.value === 'bike' ? 'bike' : 'walk'} size={20} />
                </span>
                <span className="stack-1 grow">
                  <span className="t-strong t-sm">{t(mode.label)}</span>
                  <span className="t-sm t-muted">{t(mode.hint)}</span>
                </span>
                {selected ? <Icon name="check" size={18} /> : null}
              </button>
            );
          })}
        </div>
      </Dialog>

      <Dialog
        open={whenOpen}
        title={t('Date and time')}
        description={t('By default a journey is planned from today, right now.')}
        onClose={() => setWhenOpen(false)}
      >
        {/*
         * One question, in **one** bordered group: the day and the time, side by side, opening the
         * device's own calendar and clock (see `whenReadback` above for what that costs and what
         * is done about it).
         *
         * The two are separate inputs rather than one label wrapping both: an implicit label over
         * two controls names them both "When", and these two answers are not the same answer.
         * Each carries its own `aria-label`, so a screen reader says "Date" and "Time".
         */}
        <div className="field field--wide">
          <span className="field__label">{t('When')}</span>
          <div className="when-field__group">
            {/*
              * **Each answer owns its own slot, and the app owns the glyph.**
              *
              * The two fields used to be bare inputs in the group's grid, with the browser's own
              * picker button against the group's inner edge. On a phone two of those stacked either
              * side of the group's divider read as a stray dropdown column fenced into the field — a
              * chevron that belonged to nothing (reported, circled). Chromium and WebKit let us keep
              * that button and draw the mark: the button stays exactly where it was and is made
              * invisible, and the app's own calendar / clock sits under it, so a tap still opens the
              * device's picker. Firefox does not expose the button, so there the browser's glyph
              * stays and ours is not drawn (see `.when-field__glyph` in `components.css`).
              */}
            <div className="when-field__field">
              <input
                id="results-date"
                className="input"
                type="date"
                aria-label={t('Date')}
                value={query.date}
                /* A journey cannot be planned for yesterday; the engine would only ever answer with
                   the departures that already left. */
                min={todayIso()}
                aria-invalid={dateInvalid || undefined}
                aria-describedby={dateInvalid ? 'results-date-error' : undefined}
                onChange={(event) => {
                  const next = event.target.value;
                  if (!next) {
                    setDateInvalid(false);
                    updateSearchQuery({ date: todayIso() });
                    return;
                  }
                  if (next < todayIso()) {
                    setDateInvalid(true);
                    return;
                  }
                  setDateInvalid(false);
                  updateSearchQuery({ date: next });
                }}
              />
              <span className="when-field__glyph" aria-hidden="true">
                <Icon name="calendar" size={18} />
              </span>
            </div>
            <div className="when-field__field">
              <input
                id="results-time"
                className="input"
                type="time"
                aria-label={t('Time')}
                value={timeInputValue(query.time)}
                /* Away from the field's own 1-minute default: every other time in this app is on a
                   5-minute step, and the picker's arrows follow the same step. */
                step={300}
                onChange={(event) => {
                  const next = parseTimeInput(event.target.value);
                  /* Cleared (some browsers allow it): the last real time stands rather than the
                     search silently moving to midnight. */
                  if (next !== null) updateSearchQuery({ time: next });
                }}
              />
              <span className="when-field__glyph" aria-hidden="true">
                <Icon name="clock" size={18} />
              </span>
            </div>
          </div>
          {/* The same answer, in the app's own date and clock format — the settings the native
              control above cannot honour. */}
          <p className="field__hint" aria-live="polite">
            {whenReadback}
          </p>
          {dateInvalid ? (
            <p className="field__error" id="results-date-error" role="alert">
              <Icon name="alert" size={14} />
              {t('A journey cannot be planned for a day that has already gone.')}
            </p>
          ) : null}
        </div>
        <div className="row-wrap">
          {/*
            The app's own switcher, in its compact variant.

            It is the shared `Segmented` — same font, same pill, same 4px gutter — drawn at the
            height of the chip beside it: at its default size the capsule was 54px against the Now
            chip's 44, so the two controls on one line were two different sizes (and the chosen
            half drew a second ring inside the capsule's). The compact variant is the one built for
            this line; it measures 44 to the chip's 44.
          */}
          <Segmented
            size="sm"
            ariaLabel={t('Depart at or arrive by')}
            value={query.timeMode}
            onChange={(value) => updateSearchQuery({ timeMode: value })}
            options={[
              { value: 'depart', label: t('Depart at') },
              { value: 'arrive', label: t('Arrive by') },
            ]}
          />
          {/* "Now" and a clock, not "Today, now": the word after the comma was the date the
              dialog already shows above it. */}
          <Button
            type="button"
            icon="clock"
            onClick={() => updateSearchQuery({ date: todayIso(), time: roundToStep(nowMinutes(), 5), timeMode: 'depart' })}
          >
            {t('Now')}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
