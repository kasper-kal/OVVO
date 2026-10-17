import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../state/AppState';
import { PageHeader } from '../components/layout/AppShell';
import {
  STOPS,
  cities,
  customStopName,
  distanceFromPosition,
  formatDistance,
  hasBoard,
  regions,
} from '../data/stops';
import { boardForStop } from '../data/departures';
import { PT_LABEL_ORDER } from '../lib/boardHelpers';
import { useMinuteNow } from '../lib/useMinuteNow';
import { useLoadOnScroll } from '../lib/loadBatch';
import { stopTypeLabel } from '../lib/format';
import { useFormat } from '../lib/useFormat';
import { modeLabel } from '../data/preferences';
import {
  Button,
  Card,
  Chip,
  EmptyState,
  IconButton,
  Pill,
  SkeletonCards,
} from '../components/ui/primitives';
import { PlanStopDialog } from '../components/stops/PlanStopDialog';
import { Icon, ModeIcon } from '../components/ui/Icons';
import { useT } from '../lib/useT';
import type { PublicMode, Stop } from '../data/types';

type StopsSort = 'nearest' | 'city' | 'name' | 'connections';
type StopTypeFilter = 'any' | Stop['type'];

export function StopsPage() {
  const navigate = useNavigate();
  const { favouriteStopIds, toggleFavourite, nearestOrigin } = useApp();
  const t = useT();
  const format = useFormat();

  const [query, setQuery] = useState('');
  /* Visible at once: the search, the sort and the count. Everything else lives in Options. */
  const [sort, setSort] = useState<StopsSort>('nearest');
  /*
   * Nearest-first is the default and the point of the sort, but it needs an origin. With none —
   * no device fix and no estimate — the select falls back to the city order it used to have,
   * rather than showing a selected option that cannot be honoured.
   */
  const nearestSort = sort === 'nearest' && nearestOrigin !== null;
  const activeSort: Exclude<StopsSort, 'nearest'> | 'nearest' = nearestSort ? 'nearest' : sort === 'nearest' ? 'city' : sort;
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [modes, setModes] = useState<PublicMode[]>([]);
  const [type, setType] = useState<StopTypeFilter>('any');
  const [region, setRegion] = useState('any');
  const [city, setCity] = useState('any');
  const [favouritesOnly, setFavouritesOnly] = useState(false);
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
   * The list's settling state (F17). The data is local, so a filter change is instant and there
   * was never anything on screen to say work was happening — the ask is for an animated
   * placeholder, and a placeholder needs a moment to be a placeholder. 360ms is long enough to
   * read as a shimmer and short enough not to be in the way; it is restarted by any change to
   * the filters, and it starts on first paint, which is the same brief wait on a cold open.
   */
  const [settling, setSettling] = useState(true);
  const filterKey = `${query}|${modes.join(',')}|${type}|${region}|${city}|${favouritesOnly}|${sort}|${resetBatch}`;
  useEffect(() => {
    setSettling(true);
    const timer = window.setTimeout(() => setSettling(false), 360);
    return () => window.clearTimeout(timer);
  }, [filterKey]);

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

  const openCard = (stop: Stop) => navigate(`/stops/${stop.id}`);

  return (
    <div className="stack-6">
      <PageHeader
        title={t('Stations & stops')}
        description={t(
          'Every stop has its own page with facilities, access information, a departure board and alerts.',
        )}
        actions={
          <Link to="/departures" className="btn">
            <Icon name="board" size={16} />
            {t('Departure boards')}
          </Link>
        }
      />

      <Card className="stack">
        <div className="stops-filters">
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
              onChange={(event) => setSort(event.target.value as StopsSort)}
            >
              <option value="nearest" disabled={!nearestOrigin}>
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
          {activeSort !== 'nearest' || !nearestOrigin
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
                <select className="select" value={region} onChange={(event) => setRegion(event.target.value)}>
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
                <select className="select" value={city} onChange={(event) => setCity(event.target.value)}>
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
              {(['any', 'station', 'airport', 'metrostop', 'tramstop', 'busstop', 'ferrystop', 'landmark'] as const).map((value) => (
                <Chip key={value} selected={type === value} onClick={() => setType(value)}>
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
                  onClick={() =>
                    setModes((current) => (current.includes(mode) ? current.filter((m) => m !== mode) : [...current, mode]))
                  }
                >
                  <ModeIcon mode={mode} size={15} />
                  {modeLabel(mode)}
                </Chip>
              ))}
              <Chip selected={favouritesOnly} icon="heart" onClick={() => setFavouritesOnly((value) => !value)}>
                {t('Favourites only')}
              </Chip>
              <Button
                size="sm"
                variant="ghost"
                icon="refresh"
                onClick={() => {
                  setQuery('');
                  setModes([]);
                  setType('any');
                  setRegion('any');
                  setCity('any');
                  setFavouritesOnly(false);
                  setSort('nearest');
                }}
              >
                {t('Clear filters')}
              </Button>
            </div>
          </div>
        ) : null}
      </Card>

      {/* The count is a reading of a list that exists, so it appears with the list, not over the
          placeholders. */}
      {settling ? null : (
        <div className="between wrap">
          <span className="t-sm t-muted">
            {t('{shown} of {total} stops', { shown: shown.length, total: results.length })}
          </span>
        </div>
      )}

      {/* One `aria-busy` region around whichever of the three states is up, so a screen reader is
          told the list is working rather than read a placeholder that is hidden on purpose. */}
      <div className="stack-4" aria-busy={settling || undefined}>
      {settling ? (
        <SkeletonCards count={4} />
      ) : results.length === 0 ? (
        <EmptyState
          icon="search"
          title={t('No stops match these filters')}
          description={t('Clear the filters to see the whole network again.')}
        />
      ) : (
        <>
          <ul ref={gridRef} className="grid-2 stops-grid">
            {shown.map((stop) => {
              const departures = departuresFor(stop);
              const distance = distanceTo(stop);
              const isFavourite = favouriteStopIds.includes(stop.id);
              return (
                <Card
                  as="li"
                  key={stop.id}
                  className="stack-2 stop-card"
                  /*
                   * The card is the way into the stop page — no STOP PAGE button in it. The name
                   * is still a real link, so a keyboard and a screen reader have one (and a
                   * middle-click and a "open in new tab" work); the card's own click is the
                   * pointer's convenience on top of it. Everything inside that means something
                   * else — the pin, More, Plan — stops the click from reaching the card.
                   */
                  onClick={() => openCard(stop)}
                >
                  <div className="between wrap">
                    <div className="stack-1">
                      <Link
                        to={`/stops/${stop.id}`}
                        className="t-strong tap-target"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {customStopName(stop.id) ?? stop.name}
                      </Link>
                      <span className="t-sm t-muted">
                        {customStopName(stop.id) ? `${stop.name} · ` : ''}
                        {stop.city} · {stop.code} · {stopTypeLabel(stop.type)}
                        {/* A straight line, not a travel time, and only when we have a position. */}
                        {distance !== null ? ` · ${formatDistance(distance)}` : ''}
                      </span>
                    </div>
                    {/* `card-actions` so this control is held at the trailing edge at 320 too —
                        the same group the departure board's card head uses. */}
                    <div className="card-actions">
                      <IconButton
                        icon="heart"
                        label={t(
                          isFavourite
                            ? 'Remove {stop} from favourites'
                            : 'Add {stop} to favourites',
                          { stop: customStopName(stop.id) ?? stop.name },
                        )}
                        active={isFavourite}
                        className="glyph-toggle"
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleFavourite(stop.id);
                        }}
                      />
                    </div>
                  </div>

                  <div className="row-wrap">
                    {stop.modes
                      .filter((mode) => mode !== 'walk' && mode !== 'bike')
                      .map((mode) => (
                        <span key={mode} className={`mode-badge mode-badge--${mode}`}>
                          <ModeIcon mode={mode} size={13} />
                          {modeLabel(mode)}
                        </span>
                      ))}
                    {/* The Step-free / Stairs-only pill is deleted with every other visible
                        accessibility claim (F19). */}
                    {stop.ovFiets ? <Pill tone="outline">OV-fiets</Pill> : null}
                  </div>

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
                            /*
                              `P6`, not a bare `6`: a lone digit at the end of a row reads as a
                              stray number. The board spells the word out; a card has room for a
                              letter, and a title for anyone who wants the word.
                            */
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
                      Two actions, both smaller than the buttons this row used to carry: More is
                      the way to that stop's own board, and Plan asks which end of the journey
                      this stop is instead of offering two buttons that assume the answer.

                      Both are text-only — no pill, no border — because the card already draws a
                      surface and two white capsules inside it read as the card's furniture
                      rather than as the two things you can do with the stop.
                    */}
                    {hasBoard(stop) ? (
                      <Link
                        to={`/departures?stop=${stop.id}`}
                        className="btn btn--xs btn--ghost"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <Icon name="board" size={14} />
                        {/*
                         * "More" named nothing. The action is *open this stop's departure
                         * board*, so it says the thing it opens — the same words the stop page
                         * uses for the same destination. Short, because the card's foot is the
                         * narrowest row in the app; the audit groups it with "Open the full
                         * board" either way, on the glyph and the destination.
                         */}
                        {t('Board')}
                      </Link>
                    ) : null}
                    <Button
                      size="xs"
                      variant="ghost"
                      icon="route"
                      onClick={(event) => {
                        event.stopPropagation();
                        setPlanStop(stop);
                      }}
                    >
                      {t('Plan')}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </ul>

          {hasMore ? (
            <>
              <div ref={sentinelRef} className="list-sentinel" aria-hidden="true" />
              <div className="row-wrap" style={{ justifyContent: 'center' }}>
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
