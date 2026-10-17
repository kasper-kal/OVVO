import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { searchEntryId, useApp } from '../state/AppState';
import { PageHeader } from '../components/layout/AppShell';
import { SearchForm } from '../components/journey/SearchForm';
import { PreferencesControls } from '../components/journey/PreferencesControls';
import { JourneyCard } from '../components/journey/JourneyCard';
import { filterJourneys, sortJourneys, suggestRelaxations } from '../data/journeyEngine';
import { ACCESS_MODES, DEFAULT_PREFERENCES, MODE_OPTIONS, PT_MODES, modeLabel } from '../data/preferences';
import { disruptionsForStop } from '../data/disruptions';
import { Banner, Button, Card, Chip, Dialog, EmptyState, Segmented } from '../components/ui/primitives';
import { Icon, ModeIcon } from '../components/ui/Icons';
import { addDaysIso, nowMinutes, roundToStep, todayIso } from '../lib/format';
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
  } = useApp();
  const format = useFormat();
  const t = useT();
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [whenOpen, setWhenOpen] = useState(false);
  const [accessSide, setAccessSide] = useState<null | 'from' | 'to'>(null);
  const [nowRef] = useState(() => roundToStep(nowMinutes(), 5));

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
   * The date and time fields are the app's own controls, not the browser's. A native date
   * or time input renders in the operating system's locale and format whatever the "Clock
   * format" and "Date format" settings say, so the dialog used to show 10/13/2026 and
   * 11:15 AM on a page whose own settings promise "Today, 13 Oct" and a 24-hour clock.
   */
  const dateOptions = useMemo(() => {
    const start = todayIso();
    const next = Array.from({ length: 14 }, (_, index) => addDaysIso(start, index));
    return next.includes(query.date) ? next : [query.date, ...next];
  }, [query.date]);
  /*
   * One list of times for the whole day, in five-minute steps, because the dialog now asks the
   * time in one control rather than in an hour select and a minute select — two controls for one
   * answer, which is what the round reported ("merge them into one thing instead of 2 separates").
   * A stored time that is not on the step is kept in the list so it can still be read and left.
   */
  const timeOptions = useMemo(() => {
    const steps = Array.from({ length: 288 }, (_, index) => index * 5);
    return steps.includes(query.time) ? steps : [...steps, query.time].sort((a, b) => a - b);
  }, [query.time]);
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
  const emptyReason = offModes.length
    ? preferences.allowedModes.includes('walk')
      ? `Your settings leave out ${offModes.map(modeLabel).join(' and ').toLowerCase()}, so journeys that need it are hidden.`
      : `Walking is switched off and ${offModes.map(modeLabel).join(' and ').toLowerCase()} ${
          offModes.length === 1 ? 'is' : 'are'
        } left out, so the planner cannot build an access leg.`
    : 'No mode is switched off, so the walking limit, the transfer limit or a result filter removed every option.';

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
          full-screen picker over this page. */}
      <SearchForm />

      <div className="results-bar">
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
        <button
          type="button"
          className="results-chip"
          aria-expanded={optionsOpen}
          aria-controls="results-options"
          onClick={() => setOptionsOpen((value) => !value)}
        >
          {/* The same glyph the Options control wears on the stops and alerts screens: one
              action, one glyph, whether it is a chip or a pill. */}
          <Icon name="sliders" size={15} />
          {t('Options')}
          {optionCount ? <span className="results-chip__count">{optionCount}</span> : null}
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


      <Card className="stack">
        <div className="between wrap">
          {/*
            Sorting is a list of six, not a row of two or three: as a segmented control it
            could not sit on one line on a phone, and squeezing it into rows turned the
            control into a 150px blob (and, before that, pushed the last two options off
            screen). It is a labelled select, the way the stops list sorts its own list.
          */}
          <label className="field" htmlFor="results-sort">
            <span className="field__label">{t('Sort')}</span>
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
      </Card>

      {visible.length === 0 ? (
        <Card className="stack">
          <div className="row-3">
            <span className="leg-row__marker">
              <Icon name="alert" size={18} />
            </span>
            <div className="stack-1">
              <span className="t-strong">{t('No journeys match your settings')}</span>
              <span className="t-sm t-muted">
                {totalJourneys > 0
                  ? t('{total} journeys were planned for this search, but these settings removed all of them.', {
                      total: totalJourneys,
                    })
                  : t('No journey matches this search with these settings.')}
              </span>
              <span className="t-sm t-faint">{emptyReason}</span>
            </div>
          </div>

          {relaxations.length ? (
            <div className="stack-2">
              <span className="field__label">
                {t('Switch one of these back on and the list fills up again')}
              </span>
              <div className="row-wrap">
                {relaxations.map((suggestion) => (
                  <Chip
                    key={suggestion.id}
                    icon="plus"
                    onClick={() => applyRelaxation(suggestion.label, suggestion.patch)}
                  >
                    {suggestion.label}
                    <span className="t-faint"> · {suggestion.journeys}</span>
                  </Chip>
                ))}
              </div>
            </div>
          ) : (
            <p className="t-sm t-faint">
              {t('Nothing helps for this search — try another time or another pair of stops.')}
            </p>
          )}

          <div className="row-wrap">
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
          </div>
        </Card>
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
         * One question, one control. This was three stacked selects — a Date, an Hour and a
         * Minutes — which asked one thing three times and, on a phone, filled the sheet with
         * three dropdowns the traveller had to read as a set ("merge them into one thing instead
         * of 2 separates"). The day and the time are now two fields inside **one** bordered group
         * that is named once, and the time is the whole day in five-minute steps rather than an
         * hour and a minute to add up.
         */}
        <label className="field field--wide" htmlFor="results-date">
          <span className="field__label">{t('When')}</span>
          <span className="when-field__group">
            <select
              id="results-date"
              className="select"
              aria-label={t('Date')}
              value={query.date}
              onChange={(event) => updateSearchQuery({ date: event.target.value })}
            >
              {dateOptions.map((iso) => (
                <option key={iso} value={iso}>
                  {format.date(iso, 'long')}
                </option>
              ))}
            </select>
            <select
              id="results-time"
              className="select"
              aria-label={t('Time')}
              value={query.time}
              onChange={(event) => updateSearchQuery({ time: Number(event.target.value) })}
            >
              {timeOptions.map((minute) => (
                <option key={minute} value={minute}>
                  {format.time(minute)}
                </option>
              ))}
            </select>
          </span>
        </label>
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
