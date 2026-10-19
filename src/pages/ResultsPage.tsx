import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { searchEntryId, useApp } from '../state/AppState';
import { PageHeader } from '../components/layout/AppShell';
import { SearchForm } from '../components/journey/SearchForm';
import { PreferencesControls } from '../components/journey/PreferencesControls';
import { JourneyCard } from '../components/journey/JourneyCard';
import { filterJourneys, sortJourneys, suggestRelaxations } from '../data/journeyEngine';
import { ACCESS_MODES, DEFAULT_PREFERENCES, MODE_OPTIONS, PT_MODES, modeLabel } from '../data/preferences';
import { disruptionsForStop } from '../data/disruptions';
import { Banner, Button, Card, Chip, Dialog, EmptyState, Segmented, Spinner } from '../components/ui/primitives';
import { NoMatches } from '../components/ui/NoMatches';
import { Icon, ModeIcon } from '../components/ui/Icons';
import { nowMinutes, parseTimeInput, roundToStep, timeInputValue, todayIso } from '../lib/format';
import { useFormat } from '../lib/useFormat';
import { useT } from '../lib/useT';
import type { AccessMode } from '../data/preferences';
import type { PublicMode, SortMode } from '../data/types';

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
export function ResultsPage() {
  const {
    search,
    journeys,
    preferences,
    updatePreferences,
    updateSearchQuery,
    startSearch,
    setSortMode,
    setFilter,
    resetFilter,
    recentSearches,
    keepSearch,
    removeRecentSearch,
    power,
  } = useApp();
  /*
   * Read inside the effect through a ref: the wait belongs to the search, and a battery that
   * crosses a threshold (or a charger going in) must not replay the spinner over a list that is
   * already there. See the planning note below for why the wait exists at all.
   */
  const savingRef = useRef(power.mode !== 'off');
  savingRef.current = power.mode !== 'off';
  const format = useFormat();
  const t = useT();
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [whenOpen, setWhenOpen] = useState(false);
  const [accessSide, setAccessSide] = useState<null | 'from' | 'to'>(null);
  const [nowRef] = useState(() => roundToStep(nowMinutes(), 5));

  /*
   * The results screen opens in a **planning** state (F4).
   *
   * The report is about what is on screen while the answer is being worked out: "it goes to the
   * results but then it shows a flicker of the home screen instead of the results screen ... what
   * it should do instead is show the results screen just without results and a spinner in place of
   * the results while waiting". So the page paints its own head and its own search card at once,
   * and the list's place is held by a spinner until the journeys are there. The window is short
   * because the engine is local — long enough to be seen, never long enough to be waited on — and
   * it is keyed to the search itself, not to a filter or a sort, which are readings of the list
   * that is already on screen.
   */
  const [planning, setPlanning] = useState(power.mode === 'off');
  /* The ends are named as the traveller named them, for the same reason `searchEntryId` is: an
     address and the station it resolved to are one stop id and two different searches. */
  const searchKey = search
    ? `${search.query.fromLabel ?? search.query.fromStopId}|${search.query.toLabel ?? search.query.toStopId}|${search.query.date}|${search.query.time}|${search.query.timeMode}`
    : '';
  useEffect(() => {
    /*
     * Battery saving skips the held place entirely. The spinner exists to make a 260ms window
     * legible, and both the window and the spinning cost something the last few percent of a
     * battery should not pay: there is no work being waited on (the engine is local), so the
     * answer is simply there on the first paint.
     */
    if (savingRef.current) {
      setPlanning(false);
      return undefined;
    }
    setPlanning(true);
    const timer = window.setTimeout(() => setPlanning(false), 260);
    return () => window.clearTimeout(timer);
  }, [searchKey]);
  /* The reading lands after the first render; this ends a wait that started before it was known,
     and never starts one (so plugging in does not replay the spinner over a list that is there). */
  useEffect(() => {
    if (power.mode !== 'off') setPlanning(false);
  }, [power.mode]);

  const visible = useMemo(() => {
    if (!search) return [];
    const filtered = filterJourneys(journeys, search.filter, preferences);
    return sortJourneys(filtered, search.sortMode, preferences);
  }, [search, journeys, preferences]);

  if (!search) {
    return (
      <div className="stack-6">
        <PageHeader title={t('Journey results')} description={t('No search has been run in this browser yet.')} showTitle />
        <EmptyState
          icon="search"
          title={t('Nothing to show yet')}
          description={t('Plan a journey first — the results of your search will appear here and survive a refresh.')}
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

  const hasFilters =
    filter.modes.length > 0 ||
    filter.directOnly ||
    filter.delayedOnly ||
    filter.hideCancelled ||
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
        <button type="button" className="results-chip" onClick={() => setAccessSide('from')}>
          <span className="results-chip__key">{t('Start:')}</span>
          <Icon name={accessOf('from') === 'bike' ? 'bike' : 'walk'} size={18} />
          <span className="sr-only">{t(accessOf('from') === 'bike' ? 'Bicycle' : 'Walking')}</span>
        </button>
        <button type="button" className="results-chip" onClick={() => setAccessSide('to')}>
          <span className="results-chip__key">{t('End:')}</span>
          <Icon name={accessOf('to') === 'bike' ? 'bike' : 'walk'} size={18} />
          <span className="sr-only">{t(accessOf('to') === 'bike' ? 'Bicycle' : 'Walking')}</span>
        </button>
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
          onClick={() => (kept ? removeRecentSearch(searchEntryId(query)) : keepSearch(query))}
        >
          <Icon name={kept ? 'check' : 'bookmark'} size={15} />
          <span className="results-chip__value">
            {t(kept ? 'Saved as a search' : 'Save this search')}
          </span>
        </button>

        {/*
          The sort, in the row (MATCHING_PLAN rule 1) — not in a card of its own above the list.
          A sort is how the list is read, so it sits with the other controls that shape this
          screen; the four chips before it are the *search's* controls and stay where they are.
        */}
        <label className="field results-bar__sort" htmlFor="results-sort">
          <span className="field__label">{t('Sort by')}</span>
          <select
            id="results-sort"
            className="select"
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

        {/*
          Only when it is not all of them. "7 of 7 shown" is a count of the result set by
          itself — it says nothing until the two numbers differ, and when they do the reader
          wants to know which are hidden, not how many.
        */}
        {visible.length !== totalJourneys ? (
          <span className="t-sm t-muted">
            {t('{shown} of {total} shown', { shown: visible.length, total: totalJourneys })}
          </span>
        ) : null}
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
        <Card className="planning" aria-busy="true">
          <Spinner label={t('Planning your journey')} />
          <p className="t-sm t-muted">
            {t('Working out the options from {from} to {to}.', {
              from: query.fromLabel ?? query.fromStopId,
              to: query.toLabel ?? query.toStopId,
            })}
          </p>
        </Card>
      ) : (
      <>
      {visible.length === 0 ? (
        <NoMatches
          title={t('No journeys match your settings')}
          description={
            totalJourneys > 0
              ? t('{total} journeys were planned for this search, but these settings removed all of them.', {
                  total: totalJourneys,
                })
              : t('No journey matches this search with these settings.')
          }
          reason={`${emptyReason}${relaxations.length ? '' : ` ${t('Nothing helps for this search — try another time or another pair of stops.')}`}`}
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
            <Banner tone="hairline" icon="alert" title={t('Alerts affect this search')}>
              <div className="stack-2">
                {stopAlerts.slice(0, 2).map((alert) => (
                  <Link key={alert.id} to={`/disruptions/${alert.id}`} className="t-sm tap-target alert-link">
                    <span className="t-strong">{alert.title}</span>
                    <span className="t-muted">{t('— view details')}</span>
                  </Link>
                ))}
              </div>
            </Banner>
          ) : null}

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
        </>
      )}
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
            <input
              id="results-date"
              className="input"
              type="date"
              aria-label={t('Date')}
              value={query.date}
              /* A journey cannot be planned for yesterday; the engine would only ever answer with
                 the departures that already left. */
              min={todayIso()}
              onChange={(event) => updateSearchQuery({ date: event.target.value || todayIso() })}
            />
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
          </div>
          {/* The same answer, in the app's own date and clock format — the settings the native
              control above cannot honour. */}
          <p className="field__hint" aria-live="polite">
            {whenReadback}
          </p>
        </div>
        <div className="row-wrap">
          {/*
            The app's own switcher, not a small one of its own: it measured and drew differently
            from every other segmented control on the site ("looks weird and different from other
            switchers in the website"), so it is the shared `Segmented` at its default size.
          */}
          <Segmented
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
