import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApp } from '../state/AppState';
import { PageHeader } from '../components/layout/AppShell';
import { DISRUPTIONS, DISRUPTION_TYPE_LABELS } from '../data/disruptions';
import { getLine } from '../data/network';
import { distanceFromPosition, getStop, stopLabel } from '../data/stops';
import { PT_LABEL_ORDER } from '../lib/boardHelpers';
import { useLoadOnScroll } from '../lib/loadBatch';
import { Button, Card, Chip, Pill } from '../components/ui/primitives';
import { NoMatches } from '../components/ui/NoMatches';
import { ResultCard, ResultCardLink } from '../components/ui/ResultCard';
import { StopLink } from '../components/stops/StopLink';
import { Icon, ModeIcon } from '../components/ui/Icons';
import { useFormat } from '../lib/useFormat';
import { useT } from '../lib/useT';
import type { Disruption, DisruptionSeverity, DisruptionType, PublicMode } from '../data/types';
import { modeLabel } from '../data/preferences';

const SEVERITY_LABEL: Record<DisruptionSeverity, string> = {
  info: 'Information',
  warning: 'Disruption',
  severe: 'Major disruption',
};

const SEVERITY_TONE: Record<DisruptionSeverity, 'sage' | 'butter' | 'coral'> = {
  info: 'sage',
  warning: 'butter',
  severe: 'coral',
};

export function severityTone(severity: DisruptionSeverity) {
  return SEVERITY_TONE[severity];
}

export function typeLabel(type: DisruptionType) {
  return DISRUPTION_TYPE_LABELS[type];
}

export function DisruptionsPage() {
  const t = useT();
  const [params, setParams] = useSearchParams();
  const { favouriteStopIds, nearestOrigin } = useApp();
  const lineFilter = params.get('line');
  const stopParam = params.get('stop');

  const [types, setTypes] = useState<DisruptionType[]>([]);
  const [severities, setSeverities] = useState<DisruptionSeverity[]>([]);
  const [modes, setModes] = useState<PublicMode[]>([]);
  const [stopQuery, setStopQuery] = useState(() => (stopParam ? stopLabel(stopParam) : ''));
  const [textQuery, setTextQuery] = useState('');
  const [favouritesOnly, setFavouritesOnly] = useState(false);
  const [sort, setSort] = useState<'severity' | 'time' | 'type' | 'nearest'>('severity');
  /* Visible at once: the search, the pinned-only chip, the sort and the Options chip. */
  const [optionsOpen, setOptionsOpen] = useState(false);
  /*
   * Nearest-first needs something to measure from, and the app has one answer for where that is:
   * the device fix when the traveller allowed it, the approximate IP estimate when they did not
   * (see `nearestOrigin` in AppState). With neither, the option is not offered and the order stays
   * the severity order rather than showing a choice that cannot be honoured.
   */
  const nearestSort = sort === 'nearest' && nearestOrigin !== null;
  const activeSort: Exclude<typeof sort, 'nearest'> | 'nearest' = nearestSort
    ? 'nearest'
    : sort === 'nearest'
      ? 'severity'
      : sort;

  const results = useMemo(() => {
    const severityRank: Record<DisruptionSeverity, number> = { severe: 0, warning: 1, info: 2 };
    const normalised = textQuery.trim().toLowerCase();
    const stopTerm = stopQuery.trim().toLowerCase();
    return DISRUPTIONS.filter((alert) => {
      if (lineFilter && !alert.affectedLineIds.includes(lineFilter)) return false;
      if (types.length && !types.includes(alert.type)) return false;
      if (severities.length && !severities.includes(alert.severity)) return false;
      if (modes.length && !alert.modes.some((mode) => modes.includes(mode))) return false;
      if (favouritesOnly && !alert.affectedStopIds.some((id) => favouriteStopIds.includes(id))) return false;
      if (stopTerm) {
        const haystack = alert.affectedStopIds.map((id) => stopLabel(id)).join(' ').toLowerCase();
        if (!haystack.includes(stopTerm)) return false;
      }
      if (normalised) {
        const haystack = `${alert.title} ${alert.description} ${alert.advice} ${alert.affectedLineIds.join(' ')}`.toLowerCase();
        if (!haystack.includes(normalised)) return false;
      }
      return true;
    }).sort((a, b) => {
      if (activeSort === 'time') return a.startsAt - b.startsAt;
      if (activeSort === 'type') return a.type.localeCompare(b.type);
      if (activeSort === 'nearest' && nearestOrigin) {
        /* An alert is as near as the nearest stop it affects; the closest alert leads. */
        const { lat, lon } = nearestOrigin;
        const distanceTo = (alert: Disruption) =>
          Math.min(
            ...alert.affectedStopIds.map((id) => {
              const stop = getStop(id);
              return stop ? distanceFromPosition(stop, lat, lon) : Number.POSITIVE_INFINITY;
            }),
          );
        return distanceTo(a) - distanceTo(b);
      }
      return severityRank[a.severity] - severityRank[b.severity];
    });
  }, [types, severities, modes, stopQuery, textQuery, favouritesOnly, activeSort, lineFilter, favouriteStopIds, nearestOrigin]);

  /** True while any filter is off its default, which is when a reset has something to do. */
  const filtered = Boolean(
    types.length || severities.length || modes.length || stopQuery.trim() || textQuery.trim() || favouritesOnly || lineFilter,
  );

  /**
   * How many of the filters behind Options are off their defaults — the count on the chip,
   * the same one the stops list and the results screen put there. The search and the sort are
   * not counted: they are the two controls that stay on screen.
   */
  const hiddenFilters = [
    types.length > 0,
    severities.length > 0,
    modes.length > 0,
    stopQuery.trim().length > 0,
  ].filter(Boolean).length;

  const reset = () => {
    setTypes([]);
    setSeverities([]);
    setModes([]);
    setStopQuery('');
    setTextQuery('');
    setFavouritesOnly(false);
    setSort('severity');
    if (lineFilter) setParams({}, { replace: true });
  };

  /*
   * The list grows the way the stops list does — five rows at a time, the next batch on a scroll
   * — from the same rule in `lib/loadBatch.ts`, measured off this list's own layout rather than
   * hard-coded. A new question starts at the top of the list, not three screens into the old
   * answer, which is what the reset on every filter change is for.
   */
  const { ref: listRef, shown, next, hasMore, loadMore, reset: resetBatch, sentinelRef } =
    useLoadOnScroll(results, '.card--interactive');

  useEffect(() => {
    resetBatch();
  }, [types, severities, modes, stopQuery, textQuery, favouritesOnly, sort, lineFilter, resetBatch]);

  return (
    <div className="stack-6">
      <PageHeader
        title={t('Disruptions & service alerts')}
        description={t(
          'Delays, cancellations, planned works, platform changes, crowding and weather alerts across the network.',
        )}
        showTitle
      />

      <Card className="stack">
        {/*
          The search, the pinned-only chip, the sort and one Options chip — the same things
          Stations & stops puts on screen, in the same order. Type, severity, mode and the affected
          stop live inside Options, and Reset filters lives in there with them, beside the filters
          it clears.

          No count line above any of it: "Filters · 14 alerts" was a label for the controls
          directly under it, and the number is what the list itself already shows.
        */}
        <div className="stops-filters" data-filter-row>
          {/*
            `e.g.` is never capitalised, so the example placeholder read as a lowercase start —
            the capitalisation audit's one honest exception at the time. Written as words, the
            capital is real and the rule has nothing left to except.
          */}
          <label className="field grow">
            <span className="field__label">{t('Search in alerts')}</span>
            <input
              className="input"
              value={textQuery}
              onChange={(event) => setTextQuery(event.target.value)}
              placeholder={t('For example: platform, ferry, works')}
              aria-label={t('Search in alerts')}
            />
          </label>

          {/*
            Favourites-only stays out here on purpose — it is the filter people reach for first —
            while everything else sits inside Options.
          */}
          <Chip selected={favouritesOnly} icon="heart" onClick={() => setFavouritesOnly((value) => !value)}>
            {t('Affecting my favourites')}
          </Chip>

          <label className="field" htmlFor="alerts-sort">
            <span className="field__label">{t('Sort by')}</span>
            <select
              id="alerts-sort"
              className="select"
              value={activeSort}
              onChange={(event) => setSort(event.target.value as 'severity' | 'time' | 'type' | 'nearest')}
            >
              <option value="severity">{t('Severity')}</option>
              <option value="time">{t('Start time')}</option>
              <option value="type">{t('Type')}</option>
              {/* Offered only when there is something to measure from (see `nearestOrigin`). */}
              <option value="nearest" disabled={!nearestOrigin}>
                {t('Nearest')}
              </option>
            </select>
          </label>

          {/* The same chip the stops list and the results screen use, on purpose: one pattern for
              "there is more to this question than what you can see". */}
          <button
            type="button"
            className="results-chip results-chip--filters"
            aria-expanded={optionsOpen}
            aria-controls="alerts-options"
            onClick={() => setOptionsOpen((value) => !value)}
          >
            <Icon name="sliders" size={16} />
            {t('Options')}
            {hiddenFilters ? <span className="results-chip__count">{hiddenFilters}</span> : null}
          </button>
        </div>

        {lineFilter ? (
          <div className="row-wrap">
            <Chip selected icon="close" onClick={() => setParams({}, { replace: true })}>
              {t('Line filter: {line}', { line: getLine(lineFilter)?.name ?? lineFilter })}
            </Chip>
          </div>
        ) : null}

        {/*
          Which answer the order came from, said plainly, and only while it is in use — the rule
          the stops list already follows: an IP estimate is never presented as a device fix.
        */}
        {activeSort === 'nearest' && nearestOrigin ? (
          <p className="t-sm t-faint stops-origin">
            {nearestOrigin.source === 'device'
              ? t('Nearest first, from your device location.')
              : t('Nearest first, from an approximate IP location, which can be off by a lot.')}
          </p>
        ) : null}

        {optionsOpen ? (
          <div id="alerts-options" className="stack">
            {/*
              No "Filter options" heading row. It was an icon and two words above the filters,
              which read as a control of their own and said nothing the Options chip above did not
              already say — the row the traveller circled here, on the stops list and on the
              results screen. What stays is what was on the right of it: how many filters differ
              from the defaults, and the control that clears them.
            */}
            {hiddenFilters || filtered ? (
              <div className="row-wrap">
                {hiddenFilters ? (
                  <span className="t-sm t-muted">
                    {t('{count} changed from the defaults', { count: hiddenFilters })}
                  </span>
                ) : null}
                {filtered ? (
                  <Button size="sm" variant="ghost" icon="refresh" onClick={reset}>
                    {t('Reset filters')}
                  </Button>
                ) : null}
              </div>
            ) : null}

            <div className="row-wrap chip-group">
              <span className="field__label">{t('Type')}</span>
              {(Object.keys(DISRUPTION_TYPE_LABELS) as DisruptionType[]).map((type) => (
                <Chip
                  key={type}
                  selected={types.includes(type)}
                  onClick={() => setTypes((current) => (current.includes(type) ? current.filter((t) => t !== type) : [...current, type]))}
                >
                  {DISRUPTION_TYPE_LABELS[type]}
                </Chip>
              ))}
            </div>

            <div className="row-wrap chip-group">
              <span className="field__label">{t('Severity')}</span>
              {(Object.keys(SEVERITY_LABEL) as DisruptionSeverity[]).map((severity) => (
                <Chip
                  key={severity}
                  selected={severities.includes(severity)}
                  onClick={() =>
                    setSeverities((current) => (current.includes(severity) ? current.filter((s) => s !== severity) : [...current, severity]))
                  }
                >
                  {SEVERITY_LABEL[severity]}
                </Chip>
              ))}
            </div>

            <div className="row-wrap chip-group">
              <span className="field__label">{t('Transport mode')}</span>
              {PT_LABEL_ORDER.map((mode) => (
                <Chip
                  key={mode}
                  selected={modes.includes(mode)}
                  onClick={() => setModes((current) => (current.includes(mode) ? current.filter((m) => m !== mode) : [...current, mode]))}
                >
                  <ModeIcon mode={mode} size={15} />
                  {modeLabel(mode)}
                </Chip>
              ))}
            </div>

            <label className="field">
              <span className="field__label">{t('Filter by affected stop')}</span>
              <input
                className="input"
                value={stopQuery}
                onChange={(event) => setStopQuery(event.target.value)}
                placeholder={t('For example: Utrecht, Schiphol, Blaak')}
                aria-label={t('Filter by affected stop')}
              />
            </label>
          </div>
        ) : null}

      </Card>

      {results.length === 0 ? (
        <NoMatches
          title={t('No alerts match these filters')}
          description={t('The network has alerts; these filters removed all of them.')}
          reason={
            lineFilter
              ? t('The line filter is on, which is the filter that cannot be cleared from Options.')
              : t('The type, severity, mode or affected-stop filter removed every alert.')
          }
          fixLabel={
            /* With only a search or favourites-only on, no filter was switched off: the card was
               telling the traveller to switch back on something that was never on (7.2). */
            !lineFilter && !hiddenFilters && favouritesOnly
              ? t('Show every alert again, not only the ones you kept')
              : undefined
          }
          fixes={[
            { id: 'reset', label: t('Reset filters'), onSelect: reset },
            ...(lineFilter
              ? [{ id: 'line', label: t('Clear the line filter'), onSelect: () => setParams({}, { replace: true }) }]
              : []),
          ]}
        />
      ) : (
        <>
          <ul ref={listRef} className="stack-4">
            {shown.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </ul>

          {/*
            The foot of the list, watched by the loader, and the button for a browser without
            an observer or a scroll to make — the button is a real button rather than a
            decoration, exactly as it is on Stations & stops.
          */}
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
      )}      {/*
        The list ends where a list ends. This page used to close with an "Alerts on your journey"
        panel: how many of these alerts touched the stops at either end of the search the
        traveller had planned in this session, two sentences explaining that rule, a link back
        to the results and a button that re-ran the search it had just run. Deleted on the
        traveller's instruction, and it was the right call twice over: the count is a fact about
        a *different* screen's question — the alerts list is a network-wide list and knows
        nothing about anybody's journey — and the search it read lives only in memory
        (`AppState`'s `search` starts null on every load), so the panel could not be trusted to
        mean the same thing twice.
      */}


    </div>
  );
}

function AlertCard({ alert }: { alert: Disruption }) {
  const t = useT();
  const format = useFormat();
  const to = `/disruptions/${alert.id}`;
  return (
    /*
     * The card is the way into the alert — the same component, the same lift and the same one
     * real link as a stop card and a journey card (`components/ui/ResultCard.tsx`,
     * MATCHING_PLAN rule 4). The title is the link; the action below it is a control, so the two
     * cannot navigate twice.
     */
    <ResultCard as="li" to={to} className="stack-2">
      <div className="between wrap">
        <div className="row-3">
          <span className="leg-row__marker">
            <Icon name="alert" size={18} />
          </span>
          <div className="stack-1">
            <ResultCardLink to={to}>{alert.title}</ResultCardLink>
            <span className="t-sm t-muted">
              {format.time(alert.startsAt)} – {format.time(alert.endsAt)}
            </span>
          </div>
        </div>
        <Pill tone={SEVERITY_TONE[alert.severity]}>{t(SEVERITY_LABEL[alert.severity])}</Pill>
      </div>

      {/*
        What to do, not what is happening: the advice line, and the detail page carries the rest.
        The card used to add the description, a mode badge per mode, a pill per operator and a chip
        per affected stop — nine or ten things to read on a row whose only question is "what do I
        do about this?"
      */}
      <p className="t-sm t-clamp-2">{alert.advice}</p>

      {/*
        Which stops this alert touches, and each one a way to its page.

        The card used to draw a chip per affected stop, and the chips were cut for making a row
        answer nine questions at once. This is the same fact in one line of words, which is what it
        always was: the stops are named because an alert that does not say where it is *is* not an
        answer to "does this affect my journey?". The line is the count the alert's own page prints
        ("Affected stops (2)") followed by the names, so the two screens cannot drift apart.

        A stop's name here is the only thing on the card that leaves for somewhere other than the
        alert; the card's own press handles that for every control inside it already
        (`components/ui/ResultCard.tsx`), so a tap on a name goes to the stop and nowhere else.
      */}
      {alert.affectedStopIds.length ? (
        <p className="t-sm t-muted">
          {/*
            **A stop is a glyph; its word is only spoken.**

            This read `Affected stops (3) :` — a label, then a stray space before a colon, on every
            alert card. The count and the names are the fact; the label is the category, so it takes
            the station's glyph and keeps its words in an `sr-only` span. The names themselves stay
            words: each one is a link to that stop.
          */}
          <span className="t-faint">
            <Icon name="station" size={12} className="icon--inline" /> {alert.affectedStopIds.length}
            <span className="sr-only">
              {' '}
              {t('Affected stops ({count})', { count: alert.affectedStopIds.length })}
            </span>
            {' · '}
          </span>
          {alert.affectedStopIds.map((stopId, index) => (
            <span key={stopId}>
              {index > 0 ? ' · ' : ''}
              <StopLink stopId={stopId} />
            </span>
          ))}
        </p>
      ) : null}

      {/*
        One action per card. The board for an affected stop is one tap away on the alert's own
        page (and on the stop's page); a second button here made the eye choose twice per row.
      */}
      <div className="row-wrap">
        <Link
          to={to}
          className="btn btn--primary btn--sm"
          /*
            "Alert details & advice" on every card is one name repeated down the whole list, each
            going to a different alert — indistinguishable in a screen reader's link list. The
            visible words lead the name; the alert's own title tells the five apart.
          */
          aria-label={t('Alert details & advice: {title}', { title: alert.title })}
          onClick={(event) => event.stopPropagation()}
        >
          <Icon name="info" size={15} />
          {t('Alert details & advice')}
        </Link>
      </div>
    </ResultCard>
  );
}
