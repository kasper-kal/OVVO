import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../state/AppState';
import { PageHeader } from '../components/layout/AppShell';
import { STOPS, cities, distanceFromPosition, hasBoard, regions } from '../data/stops';
import { boardForStop } from '../data/departures';
import { PT_LABEL_ORDER } from '../lib/boardHelpers';
import { useMinuteNow } from '../lib/useMinuteNow';
import { useLoadOnScroll } from '../lib/loadBatch';
import { stopTypeLabel } from '../lib/format';
import { modeLabel } from '../data/preferences';
import { Button, Card, Chip } from '../components/ui/primitives';
import { PlanStopDialog } from '../components/stops/PlanStopDialog';
import { NoMatches } from '../components/ui/NoMatches';
import { StopCard } from '../components/stops/StopCard';
import { StopCardSkeletons } from '../components/ui/Skeletons';
import { Icon, ModeIcon } from '../components/ui/Icons';
import { useT } from '../lib/useT';
import type { PublicMode, Stop } from '../data/types';

type StopsSort = 'nearest' | 'city' | 'name' | 'connections';
type StopTypeFilter = 'any' | Stop['type'];

export function StopsPage() {
  const navigate = useNavigate();
  const { favouriteStopIds, toggleFavourite, nearestOrigin, approximateLocationPending } = useApp();
  const t = useT();

  const [query, setQuery] = useState('');
  /*
   * Every filter that changes **which** list is on screen lives in the URL (MATCHING_PLAN rule 8):
   * the region, the city, the stop type, the modes, the favourites-only chip and the sort. Back,
   * refresh and a shared link then all mean the same list, on the same terms `?stop=` already has
   * on the alerts list. What stays in component state is only about *this visit*: the typed
   * query (a half-typed name is not a bookmark) and the batch the list has grown to.
   */
  const [params, setParams] = useSearchParams();
  const writeParams = useCallback(
    (patch: Record<string, string | null>) => {
      setParams((current) => {
        const next = new URLSearchParams(current);
        for (const [key, value] of Object.entries(patch)) {
          if (value === null || value === '' || value === 'any') next.delete(key);
          else next.set(key, value);
        }
        return next;
      });
    },
    [setParams],
  );
  const sortParam = params.get('sort');
  const sort: StopsSort =
    sortParam === 'city' || sortParam === 'name' || sortParam === 'connections' ? sortParam : 'nearest';
  /* Visible at once: the search, the sort and the count. Everything else lives in Options. */
  /*
   * **The one real wait on this screen: where you are.**
   *
   * Nearest-first is the default order, and it cannot be computed before a position exists — the
   * device's own fix may have been refused, and the approximate estimate is a request. While that
   * request is in flight the list used to fall back to city order and then re-order itself under
   * the traveller's thumb, which reads as the list moving by itself. So the cards are held instead,
   * in the grid they will land in, and the line under the filters says what the wait is for. It is
   * a hold over real work, and it lasts exactly as long as that work does.
   */
  const positionPending = sort === 'nearest' && nearestOrigin === null && approximateLocationPending;
  /*
   * Nearest-first needs an origin, but *asking for one* is not the same as not having one: while
   * the answer is on its way the select stays on Nearest rather than showing City for the length
   * of the request and changing itself afterwards. With no estimate coming at all — refused,
   * unavailable, or not asked for — it falls back to the city order it used to have, rather than
   * showing a selected option that cannot be honoured.
   */
  const nearestSort = sort === 'nearest' && (nearestOrigin !== null || positionPending);
  const activeSort: Exclude<StopsSort, 'nearest'> | 'nearest' = nearestSort ? 'nearest' : sort === 'nearest' ? 'city' : sort;
  const [optionsOpen, setOptionsOpen] = useState(false);
  const modesParam = params.get('modes');
  const modes = useMemo<PublicMode[]>(() => {
    const parsed = (modesParam ?? '')
      .split(',')
      .filter((mode): mode is PublicMode => (PT_LABEL_ORDER as string[]).includes(mode));
    return PT_LABEL_ORDER.filter((mode) => parsed.includes(mode));
  }, [modesParam]);
  const typeParam = params.get('type');
  const stopTypes: StopTypeFilter[] = [
    'any',
    'station',
    'airport',
    'metrostop',
    'tramstop',
    'busstop',
    'ferrystop',
    'landmark',
  ];
  const type: StopTypeFilter = stopTypes.includes((typeParam ?? 'any') as StopTypeFilter)
    ? ((typeParam ?? 'any') as StopTypeFilter)
    : 'any';
  const region = params.get('region') ?? 'any';
  const city = params.get('city') ?? 'any';
  const favouritesOnly = params.get('favourites') === '1';
  const toggleMode = (mode: PublicMode) => {
    const next = (modes.includes(mode) ? modes.filter((m) => m !== mode) : [...modes, mode]).filter((m) =>
      PT_LABEL_ORDER.includes(m),
    );
    writeParams({ modes: next.length ? PT_LABEL_ORDER.filter((m) => next.includes(m)).join(',') : null });
  };
  const clearFilters = () => {
    setQuery('');
    writeParams({ region: null, city: null, type: null, modes: null, favourites: null, sort: null });
  };
  /* The card's Plan button opens this rather than deciding for the traveller. */
  const [planStop, setPlanStop] = useState<Stop | null>(null);

  const hiddenFilters =
    Number(modes.length > 0) +
    Number(type !== 'any') +
    Number(region !== 'any') +
    Number(city !== 'any') +
    Number(favouritesOnly);

  const results = useMemo(() => {
    const normalised = query.trim().toLowerCase();
    const list = STOPS.filter((stop) => {
      if (normalised && !`${stop.name} ${stop.city} ${stop.code} ${stop.region}`.toLowerCase().includes(normalised)) return false;
      if (modes.length && !modes.some((mode) => stop.modes.includes(mode))) return false;
      if (type !== 'any' && stop.type !== type) return false;
      if (region !== 'any' && stop.region !== region) return false;
      if (city !== 'any' && stop.city !== city) return false;
      if (favouritesOnly && !favouriteStopIds.includes(stop.id)) return false;
      return true;
    });
    if (activeSort === 'nearest' && nearestOrigin) {
      const { lat, lon } = nearestOrigin;
      return list.sort((a, b) => {
        const favourite = Number(favouriteStopIds.includes(b.id)) - Number(favouriteStopIds.includes(a.id));
        if (favourite) return favourite;
        /* Favourites still lead — the rule every stop list in the app follows — and inside
           each group the closest is first. */
        return distanceFromPosition(a, lat, lon) - distanceFromPosition(b, lat, lon);
      });
    }
    return list.sort((a, b) => {
      const favourite = Number(favouriteStopIds.includes(b.id)) - Number(favouriteStopIds.includes(a.id));
      if (favourite) return favourite;
      if (activeSort === 'name') return a.name.localeCompare(b.name, 'nl');
      if (activeSort === 'connections') return b.modes.length - a.modes.length || a.name.localeCompare(b.name, 'nl');
      return a.city.localeCompare(b.city, 'nl') || a.name.localeCompare(b.name, 'nl');
    });
  }, [query, modes, type, region, city, favouritesOnly, favouriteStopIds, activeSort, nearestOrigin]);

  /* A distance to show on each card, but only when there is something to measure from. */
  const distanceTo = useCallback(
    (stop: Stop) => (nearestOrigin ? distanceFromPosition(stop, nearestOrigin.lat, nearestOrigin.lon) : null),
    [nearestOrigin],
  );

  /* ------------------------------------------------------- the batch, per layout */
  /*
   * Five rows deep, read off the grid itself (the rule, and the measurement, live in
   * `lib/loadBatch.ts`): a phone laying one card out loads five, a wide screen laying three out
   * loads fifteen. Nothing here hard-codes either number.
   *
   * The hook also carries the sentinel the loader watches and the scroll that arms it, so this
   * screen and the alerts list grow their lists by the same rule rather than by two copies of it.
   */
  const { ref: gridRef, shown, next, hasMore, loadMore, reset: resetBatch, sentinelRef } =
    useLoadOnScroll(results, '.stop-card');

  /* A new question starts at the top of the list, not three screens into the old answer. */
  useEffect(() => {
    resetBatch();
  }, [query, modes, type, region, city, favouritesOnly, sort, resetBatch]);

  /* --------------------------------------------------------------- the board slice */
  /*
   * Three departures per card, taken from the same generator the board uses. A card is a glimpse,
   * not a live board — the board page is one tap away for the real thing — but the glimpse has to
   * be of *now*: this read the clock once, when the page opened, so a list left open for ten
   * minutes went on offering departures that had already left (the same minute-behind defect the
   * boards had). It re-reads on the minute with everything else.
   */
  /*
   * **No hold over the search or the filters — only over the position.**
   *
   * There used to be a 360ms "settling" state here, restarted by every filter change *and by every
   * keystroke in the search field*, so typing a stop name blanked the results and held four
   * placeholder cards in their place for a third of a second per letter. Nothing was loading: the
   * search is a filter over an array in memory. That one is gone and the list answers immediately;
   * the only hold left on this screen is `positionPending` above, over a request that is running.
   */

  const fromMinutes = useMinuteNow();
  const departuresFor = useCallback(
    (stop: Stop) =>
      hasBoard(stop)
        ? boardForStop(stop.id, { fromMinutes, limit: 3 }).sort((a, b) => a.expected - b.expected)
        : [],
    [fromMinutes],
  );

  /*
   * One end, then the other — never a search that is already in the session.
   *
   * With a search on screen this used to carry its other end into the new query and jump to the
   * results, which is the "it auto-fills the from" in the report (F28). The named end is filled,
   * and `pick` opens the picker on the end that is still missing, so the pair is answered by the
   * traveller rather than borrowed from the last journey.
   */
  const planTo = (stopId: string, direction: 'from' | 'to') => {
    navigate(`/?${direction}=${stopId}&pick=${direction === 'from' ? 'to' : 'from'}`);
  };

  return (
    <div className="stack-6">
      <PageHeader
        title={t('Stations & stops')}
        description={t(
          'Every stop has its own page with facilities, access information, a departure board and alerts.',
        )}
        /* Every list screen draws its own name (MATCHING_PLAN rule 5): a phone has no menu on
           screen, and a stop reached from a link has to be told where it is. */
        showTitle
        /* No action beside the name. There was one — a `Departure boards` button in the head —
           and it was a second way to a screen the navigation and the home screen already offer,
           sitting where the eye is looking for the page's own name (reported with it crossed out).
           A list's head names the list; the boards are reached from the navigation, the dock's
           board entry, and each stop's own *Board* row. */
      />

      <Card className="stack">
        <div className="stops-filters" data-filter-row>
          <label className="field grow">
            <span className="field__label">{t('Search stops')}</span>
            <input
              className="input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('Name, city, code or region')}
              aria-label={t('Search stops')}
            />
          </label>

          <label className="field" htmlFor="stops-sort">
            <span className="field__label">{t('Sort by')}</span>
            <select
              id="stops-sort"
              className="select"
              value={activeSort}
              onChange={(event) => writeParams({ sort: event.target.value === 'nearest' ? null : event.target.value })}
            >
              <option value="nearest" disabled={!nearestOrigin && !positionPending}>
                {t('Nearest')}
              </option>
              <option value="city">{t('City')}</option>
              <option value="name">{t('Name')}</option>
              <option value="connections">{t('Connections')}</option>
            </select>
          </label>

          {/* The same chip the results screen uses for its own options panel, on purpose: one
              pattern for "there is more to this question than what you can see". */}
          <button
            type="button"
            className="results-chip results-chip--filters"
            aria-expanded={optionsOpen}
            aria-controls="stops-options"
            onClick={() => setOptionsOpen((value) => !value)}
          >
            <Icon name="sliders" size={16} />
            {t('Options')}
            {hiddenFilters ? <span className="results-chip__count">{hiddenFilters}</span> : null}
          </button>
        </div>

        {/*
          Which location the order came from, said plainly. An IP estimate can be a hundred
          kilometres out, so it is never presented as a device fix — and when there is no
          location at all, the line says what the list is doing instead.
        */}
        <p className="t-sm t-faint stops-origin">
          {positionPending
            ? t('Finding where you are, so the list can be nearest-first…')
            : activeSort !== 'nearest' || !nearestOrigin
            ? t('Sorted by {sort}. Turn on location for nearest-first.', {
                sort: t(
                  activeSort === 'name' ? 'Name' : activeSort === 'connections' ? 'Connections' : 'City',
                ),
              })
            : nearestOrigin.source === 'device'
              ? t('Nearest first, from your device location.')
              : t('Nearest first, from an approximate IP location — it can be off by a lot.')}
        </p>

        {optionsOpen ? (
          <div id="stops-options" className="stack">
            {/*
              No "Filter options" heading row — the circled one. An icon and two words above the
              filters read as a control of their own and said nothing the Options chip above did
              not already say. The only thing that row carried that is not a label for what is
              visible below it is the count, and the count is what is left.
            */}
            {hiddenFilters ? (
              <span className="t-sm t-muted">{t('{count} changed from the defaults', { count: hiddenFilters })}</span>
            ) : null}

            <div className="grid-2">
              <label className="field">
                <span className="field__label">{t('Region')}</span>
                <select className="select" value={region} onChange={(event) => writeParams({ region: event.target.value })}>
                  <option value="any">{t('All regions')}</option>
                  {regions().map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span className="field__label">{t('City')}</span>
                <select className="select" value={city} onChange={(event) => writeParams({ city: event.target.value })}>
                  <option value="any">{t('All cities')}</option>
                  {cities().map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="row-wrap chip-group">
              <span className="field__label">{t('Stop type')}</span>
              {stopTypes.map((value) => (
                <Chip key={value} selected={type === value} onClick={() => writeParams({ type: value })}>
                  {value === 'any' ? t('All types') : t(stopTypeLabel(value))}
                </Chip>
              ))}
            </div>

            <div className="row-wrap chip-group">
              <span className="field__label">{t('Modes at the stop')}</span>
              {PT_LABEL_ORDER.map((mode) => (
                <Chip
                  key={mode}
                  selected={modes.includes(mode)}
                  onClick={() => toggleMode(mode)}
                >
                  <ModeIcon mode={mode} size={15} />
                  {modeLabel(mode)}
                </Chip>
              ))}
              <Chip
                selected={favouritesOnly}
                icon="heart"
                onClick={() => writeParams({ favourites: favouritesOnly ? null : '1' })}
              >
                {t('Favourites only')}
              </Chip>
              <Button
                size="sm"
                variant="ghost"
                icon="refresh"
                onClick={clearFilters}
              >
                {t('Clear filters')}
              </Button>
            </div>
          </div>
        ) : null}
      </Card>

      <div className="between wrap">
        <span className="t-sm t-muted">
          {t('{shown} of {total} stops', { shown: shown.length, total: results.length })}
        </span>
      </div>

      <div className="stack-4">
      {results.length === 0 ? (
        <NoMatches
          title={t('No stops match these filters')}
          description={t('Nothing in the network matches what is switched on here.')}
          reason={
            query.trim()
              ? t('Nothing matches “{query}” with these filters.', { query: query.trim() })
              : t('The region, city, stop type, modes or favourites-only filter removed every stop.')
          }
          fixLabel={
            query.trim() && !hiddenFilters
              ? t('Clear the search to see the whole network again')
              : undefined
          }
          fixes={[
            ...(query.trim()
              ? [{ id: 'query', label: t('Search the whole network'), onSelect: () => setQuery('') }]
              : []),
            ...(hiddenFilters || sort !== 'nearest'
              ? [{ id: 'filters', label: t('Clear filters'), onSelect: clearFilters }]
              : []),
          ]}
        />
      ) : positionPending ? (
        /*
          The hold, in the grid the cards will land in, as many as one batch puts there — and
          each one drawn to the shape of the stop it stands in for, so the cards do not change
          height when the position arrives.
        */
        <StopCardSkeletons
          cards={shown.map((stop) => ({ stop, departures: departuresFor(stop) }))}
        />
      ) : (
        <>
          <ul ref={gridRef} className="grid-2 stops-grid">
            {shown.map((stop) => {
              const departures = departuresFor(stop);
              const distance = distanceTo(stop);
              const isFavourite = favouriteStopIds.includes(stop.id);
              return (
                <StopCard
                  key={stop.id}
                  stop={stop}
                  departures={departures}
                  distance={distance}
                  isFavourite={isFavourite}
                  onToggleFavourite={() => toggleFavourite(stop.id)}
                  onPlan={() => setPlanStop(stop)}
                />
              );
            })}
          </ul>

          {hasMore ? (
            <>
              <div className="row-wrap list-foot" style={{ justifyContent: 'center' }}>
                {/* The marker sits in the row, absolutely, so it is neither a flex item of the
                    column (which cost a second gap: 24px between the list and its button where
                    the stack asked for 12) nor an item of the row (which would push the centred
                    button off centre by half a gap). */}
                <div ref={sentinelRef} className="list-sentinel" aria-hidden="true" />
                <Button size="sm" icon="chevronDown" onClick={loadMore}>
                  {t('Show {count} more', { count: next })}
                </Button>
              </div>
            </>
          ) : null}
        </>
      )}
      </div>

      <PlanStopDialog
        stop={planStop}
        onClose={() => setPlanStop(null)}
        onPlan={(direction) => {
          if (planStop) planTo(planStop.id, direction);
          setPlanStop(null);
        }}
      />
    </div>
  );
}
