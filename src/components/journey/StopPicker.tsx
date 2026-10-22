import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useApp } from '../../state/AppState';
import {
  STOPS,
  customStopName,
  distanceFromPosition,
  formatDistance,
  getStop,
  hasBoard,
  nearestStop,
  stopLabel,
} from '../../data/stops';
import { stopTypeLabel } from '../../lib/format';
import { rankStops } from '../../lib/stopSearch';
import { ADDRESS_ATTRIBUTION, reverseGeocode } from '../../lib/reverseGeocode';
import { dismissKeyboard } from '../../lib/dismissKeyboard';
import { FullScreen } from '../ui/FullScreen';
import { Button, IconButton } from '../ui/primitives';
import { Icon, ModeIcon } from '../ui/Icons';
import { useT } from '../../lib/useT';
import type { Stop } from '../../data/types';
import type { UserLocation } from '../../state/types';

type Side = 'from' | 'to';

/**
 * How many of the closest stops the panel offers before anything is typed.
 *
 * Ten, and not "the whole network sorted by distance": the panel is an answer to "where am I
 * leaving from", not a browsable directory — it is the field, and the field searches. Ten is
 * also what a phone shows in about a screen and a half, so the list below it stays reachable.
 */
const CLOSEST_LIMIT = 10;

/**
 * The full-screen stop picker.
 *
 * One screen, four parts, in the order the traveller uses them: the same two-row card as the home
 * planner (editable here, with the reverse control back in it), then the two actions that are not
 * searches at all — the device position and the map — then **your own stops**, and then **what is
 * closest to you**. Those four are the order this panel is meant to be read in, and the last two
 * are why the panel is not just a search field: an empty field should offer the answer, not ask
 * the question again.
 *
 * Typing replaces all four with the search results (`rankStops`), which is what the field is for —
 * the sections exist *instead of* an empty result list, never on top of one.
 *
 * It owns nothing: the pair of ends stays in the planner above it, so picking a stop here
 * and picking one there cannot disagree. Whichever end is tapped opens as the active row,
 * with the caret already in it, so the keyboard is up before the screen has settled.
 */
export function StopPicker({
  side,
  from,
  to,
  error,
  fromLabel,
  toLabel,
  onPick,
  onClear,
  onReverse,
  onOpenMap,
  onPlan,
  onClose,
}: {
  side: Side;
  from: Stop | null;
  to: Stop | null;
  /** The address "use my current location" resolved to, when one end has one. */
  fromLabel?: string;
  toLabel?: string;
  error?: string;
  /**
   * `label` is what the traveller was shown for this end when that is not the stop's own name
   * (an address), and `accessMetres` is how far that place is from the stop — the distance that
   * makes it a place rather than the station it sits nearest (see `planAccessJourney`).
   */
  onPick: (side: Side, stop: Stop, label?: string, accessMetres?: number) => void;
  onClear: (side: Side) => void;
  onReverse: () => void;
  onOpenMap: (side: Side) => void;
  /** The pair is complete: plan it without leaving this screen. */
  onPlan: () => void;
  onClose: () => void;
}) {
  const {
    favouriteStopIds,
    isFavourite,
    toggleFavourite,
    userLocation,
    requestLocation,
    pushToast,
    nearestOrigin,
    approximateLocationPending,
  } = useApp();
  const t = useT();
  const [active, setActive] = useState<Side>(side);
  const [queries, setQueries] = useState<Record<Side, string>>({
    from: fromLabel ?? (from ? stopLabel(from.id) : ''),
    to: toLabel ?? (to ? stopLabel(to.id) : ''),
  });
  const [locating, setLocating] = useState(false);
  /*
   * Which suggestion the arrows are on (27.2).
   *
   * The field said `role="combobox"` over a plain list of buttons: no listbox, no options and no
   * `aria-activedescendant`, so a screen reader was told there was a combobox with nothing under
   * it, and the arrows did nothing at all. The list is a listbox now and this is the row the
   * arrows, the highlight and `aria-activedescendant` share.
   */
  const [activeIndex, setActiveIndex] = useState(0);
  const inputs: Record<Side, React.RefObject<HTMLInputElement | null>> = {
    from: useRef<HTMLInputElement>(null),
    to: useRef<HTMLInputElement>(null),
  };

  /* The caret is in the field that was tapped, so a phone keyboard is already up. */
  useEffect(() => {
    inputs[side].current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const query = queries[active];
  const suggestions = rankStops(query, favouriteStopIds, { origin: nearestOrigin });

  /* A new query starts the highlight on the row that ranks first. */
  useEffect(() => {
    setActiveIndex(0);
  }, [query, active]);
  /* The traveller's own favourites, in the order they hearted them. */
  const favouriteStops = useMemo(
    () => favouriteStopIds.map((stopId) => getStop(stopId)).filter((stop): stop is Stop => Boolean(stop)),
    [favouriteStopIds],
  );
  /*
   * The closest **stops** — platforms you can board, not places you can walk to.
   *
   * The list used to be every row in the stop file measured by distance, which put museums,
   * churches and street addresses at the top of a list headed "Closest stops": an address has no
   * platform, no line and no departure board, so "closest" was answering a question this panel
   * does not ask. The test is `hasBoard` — the same one the departure board uses to decide a stop
   * can have a timetable — so a station, bus, tram, metro or ferry stop qualifies and a landmark
   * address does not. Addresses are not lost: one that has been favourited still appears above,
   * under its own section, with the name the traveller gave it.
   *
   * A stop already listed in the favourites above is left out — the same row twice in one panel
   * is noise, and the favourite is the better place for it.
   */
  const closest = useMemo(() => {
    if (!nearestOrigin) return [];
    const { lat, lon } = nearestOrigin;
    return STOPS.map((stop) => ({ stop, metres: distanceFromPosition(stop, lat, lon) }))
      .filter((entry) => hasBoard(entry.stop) && !favouriteStopIds.includes(entry.stop.id))
      .sort((a, b) => a.metres - b.metres)
      .slice(0, CLOSEST_LIMIT);
  }, [nearestOrigin, favouriteStopIds]);
  /*
   * Each field starts holding the stop that is already chosen in it, so its query is not
   * empty when the screen opens — and the two action rows used to be drawn only for an
   * empty query, so they were missing from exactly the case they exist for: one row (the
   * current value) in a full-width list and 80% of the screen empty, with "Use my current
   * location" and "Choose on the map" gone until the field was cleared by hand.
   *
   * The rows stand whenever the field is empty or still holds the value it was opened
   * with. Typing replaces that stop (the field clears it), so a query that is being typed
   * keeps the list to itself, the way it did.
   */
  const openedWith = active === 'from' ? from : to;
  /* The value the field opened with, which is the address the traveller was shown when
     there is one — comparing against the stop's own name hid the two action rows from
     exactly the end that a location had filled in. */
  const openedLabel = (active === 'from' ? fromLabel : toLabel) ?? (openedWith ? stopLabel(openedWith.id) : '');
  const showActions = !query.trim() || query.trim() === openedLabel;
  /* Typing is the one thing that replaces the sections below; see the file's own note. */
  const typing = !showActions;

  /**
   * One stop row, the same shape everywhere in this panel: the mode it serves, its name, one line
   * of meta, and the **heart** trailing — the four sections below differ in *which* stops they
   * hold and what that meta line says, never in how a row looks (the consistency audit's rule for
   * a repeated control).
   *
   * A heart, not the board's pin: this panel is for choosing a From and a To, and what it wants
   * from the traveller is "which places do you use" — a favourite leads those lists everywhere.
   * Pinning is about which boards the departures screen shows, which is not a question this
   * panel asks.
   */
  const stopRow = (stop: Stop, meta: ReactNode, option?: { index: number }) => (
    <li
      key={stop.id}
      className="picker__item"
      id={option ? `picker-option-${option.index}` : undefined}
      role={option ? 'option' : undefined}
      aria-selected={option ? option.index === activeIndex : undefined}
    >
      <button
        type="button"
        className="picker-row"
        /* An option is chosen with the arrows and Enter; the rows are not eight extra tab stops
           between the field and the rest of the screen (27.2). */
        tabIndex={option ? -1 : undefined}
        onMouseEnter={option ? () => setActiveIndex(option.index) : undefined}
        onClick={() => choose(stop)}
      >
        <span className="picker-row__marker">
          {stop.modes.filter((mode) => mode !== 'walk' && mode !== 'bike').length ? (
            <ModeIcon mode={stop.modes.filter((mode) => mode !== 'walk' && mode !== 'bike')[0]} size={18} />
          ) : (
            <Icon name="station" size={18} />
          )}
        </span>
        <span className="stack-1 grow">
          <span className="picker-row__name">{customStopName(stop.id) ?? stop.name}</span>
          <span className="picker-row__meta">{meta}</span>
        </span>
      </button>
      <IconButton
        icon="heart"
        label={t(
          isFavourite(stop.id)
            ? 'Remove {stop} from favourites'
            : 'Add {stop} to favourites',
          { stop: stop.name },
        )}
        active={isFavourite(stop.id)}
        className="glyph-toggle"
        onClick={() => toggleFavourite(stop.id)}
      />
    </li>
  );

  /*
   * A search result says what the place is; a closest stop says how far it is — the fact that put
   * it in the list. A renamed favourite says both: the name the traveller gave it is the row's
   * title, and the official place it stands for leads the meta line, so "Work" is still findable
   * as "Herengracht 12" when that is what they are looking for.
   */
  const official = (stop: Stop) => (customStopName(stop.id) ? `${stop.name} · ` : '');
  const searchMeta = (stop: Stop) =>
    `${official(stop)}${stop.city} · ${stop.code} · ${t(stopTypeLabel(stop.type))}`;
  const distanceMeta = (stop: Stop, metres: number) =>
    `${official(stop)}${stop.city} · ${stop.code} · ${formatDistance(metres)}`;

  const focusSide = (next: Side) => {
    setActive(next);
    window.setTimeout(() => inputs[next].current?.focus(), 0);
  };

  /**
   * One end answered. `label` is what the traveller was shown for it when that is not the
   * stop's own name — today only a device position, which reads as a street address.
   */
  const choose = (stop: Stop, label?: string, accessMetres?: number) => {
    onPick(active, stop, label, accessMetres);
    setQueries((current) => ({ ...current, [active]: label ?? stopLabel(stop.id) }));
    const other: Side = active === 'from' ? 'to' : 'from';
    const otherValue = other === 'from' ? from : to;
    if (!otherValue) {
      /* One end is still missing, so the field for it takes the keyboard straight away — this
         panel stays open on purpose, and the next thing the traveller does is type. */
      focusSide(other);
      return;
    }
    /*
     * Both ends answered: the sheet is closing and the search runs, so the keyboard has nothing
     * left to type into. Left up, it sat over the results the pair had just asked for.
     */
    dismissKeyboard();
  };

  const clearSide = (which: Side) => {
    onClear(which);
    setQueries((current) => ({ ...current, [which]: '' }));
    focusSide(which);
  };

  /**
   * Where the traveller is, asked for again on every tap.
   *
   * This row used to keep a device fix for five minutes and hand it back on the next tap, which
   * is the one thing it must not do for the traveller it exists for — "the adress should be
   * updated every time you click 'Use my current location'. For if your on the go lol." A reused
   * fix pairs an old position with a new intention, and its address is the address of where they
   * were. The device is asked now, every time.
   *
   * The last position this browser kept is still the fallback when the device will not answer at
   * all (a refusal, a timeout, a browser with no geolocation), because a last-known position beats
   * an error for a control whose whole job is "where am I" — and only a tap with nothing at all
   * stored raises anything.
   */
  const useCurrentLocation = () => {
    setLocating(true);
    (async () => {
      let fresh: UserLocation | null = null;
      try {
        fresh = await requestLocation();
      } catch (thrown) {
        if (!userLocation) throw thrown;
      }
      const fix = fresh ?? userLocation;
      if (!fix) throw new Error('Location is unavailable right now');
      const match = nearestStop(fix.lat, fix.lon);
      if (!match) throw new Error('No stop is close enough to your position.');
      /*
       * The address and the stop are two different answers to one tap, and both are needed:
       * the position names where the traveller is, the stop is the only thing a journey can
       * be planned from. The address is looked up first and the stop is the fallback, so a
       * lookup that fails degrades to exactly what this row did before — and it is looked up
       * again for the position that was just read, never reused from the last tap.
       */
      const address = await reverseGeocode(fix);
      /* No toast: the row fills with the address (the traveller's own example of a message
         repeating what the control had already said). The nearest stop it was planned from is
         the stop the results are built from, and the distance to it travels with the answer:
         when that stop is also the destination, that distance *is* the journey. */
      /* Ten-metre steps: the figure is a straight line from a GPS fix, not a route, so the metre
         it happens to land on says more precision than the measurement has. */
      choose(match.stop, address ?? undefined, Math.round(match.metres / 10) * 10);
    })()
      .catch((thrown: unknown) => {
        pushToast(thrown instanceof Error ? thrown.message : 'Location is unavailable right now', 'warning');
      })
      .finally(() => setLocating(false));
  };

  const renderRow = (which: Side) => (
    <div className={`planner-row planner-row--pad${which === 'to' ? ' planner-row--to' : ''}`}>
      <label className="sr-only" htmlFor={`picker-${which}`}>
        {which === 'from' ? t('From') : t('To')}
      </label>
      <input
        id={`picker-${which}`}
        ref={inputs[which]}
        className="planner-row__input"
        type="text"
        autoComplete="off"
        role="combobox"
        aria-expanded={typing}
        aria-controls="picker-list"
        aria-autocomplete="list"
        aria-activedescendant={typing && suggestions.length ? `picker-option-${activeIndex}` : undefined}
        onKeyDown={(event) => {
          if (!typing || suggestions.length === 0) return;
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex((index) => Math.min(index + 1, suggestions.length - 1));
          } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((index) => Math.max(index - 1, 0));
          } else if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
            const stop = suggestions[activeIndex];
            if (!stop) return;
            event.preventDefault();
            choose(stop);
          }
        }}
        /*  The same two words the planner card's rows carry: one name for one question, on the
            card and in the field that answers it. */
        placeholder={t(which === 'from' ? 'From' : 'To')}
        value={queries[which]}
        onFocus={() => setActive(which)}
        onChange={(event) => {
          setActive(which);
          setQueries((current) => ({ ...current, [which]: event.target.value }));
          if ((which === 'from' ? from : to) !== null) onClear(which);
        }}
      />
      {queries[which] ? (
        <IconButton
          icon="close"
          label={t(which === 'from' ? 'Clear the departure stop' : 'Clear the destination')}
          onClick={() => clearSide(which)}
        />
      ) : null}
    </div>
  );

  return (
    <FullScreen title={t(active === 'from' ? 'Where are you leaving from?' : 'Where do you want to go?')} onClose={onClose}>
      <div className="picker">
        <div className="planner-card planner-card--swap">
          <span className="planner-rail" aria-hidden="true">
            <span className="planner-rail__node planner-rail__node--from" />
            <span className="planner-rail__node planner-rail__node--to" />
          </span>
          <div className="planner-rows">
            {renderRow('from')}
            {renderRow('to')}
          </div>
          {/*
            The reverse control, between the two rows and belonging to neither: it used to
            sit inside the From row, below one clear button and above the other, which read
            as a control of that row. Its own column, centred on the card's mid-line, is
            where it always meant to be.
          */}
          <button
            type="button"
            className="planner-swap"
            onClick={() => {
              onReverse();
              setQueries({
                from: to ? stopLabel(to.id) : '',
                to: from ? stopLabel(from.id) : '',
              });
            }}
            aria-label={t('Reverse origin and destination')}
            title={t('Reverse journey')}
          >
            <Icon name="swap" size={18} />
          </button>
        </div>

        {error ? (
          <p className="field__error" role="alert">
            <Icon name="alert" size={14} />
            {error}
          </p>
        ) : null}

        <p className="picker__section">{t('Suggestions')}</p>

        {/*
          Two lists, one slot: what the field offers when nothing is typed, and the search result
          once something is. `typing` is the same condition that used to decide whether the two
          action rows were drawn, so the search behaviour below `suggestions` is untouched.
        */}
        {typing ? (
          <ul className="picker__list" id="picker-list" role="listbox" aria-label={t('Suggestions')}>
            {suggestions.map((stop, index) => stopRow(stop, searchMeta(stop), { index }))}

            {query.trim() && suggestions.length === 0 ? (
              <li className="picker__item picker__empty">
                <span className="picker-row__name">{t('No stops match “{query}”', { query })}</span>
                <span className="picker-row__meta">
                  {t('Search by station, stop or landmark name, or use your location.')}
                </span>
              </li>
            ) : null}
          </ul>
        ) : (
          <div className="stack-4" id="picker-list">
            {/* `stack-4` is the step the picker already used between a section heading and its
                list (16px, 4px of heading margin, 12px of list pull-up), so the four sections sit
                in the same rhythm the single list did. */}
            {/* 1 — the device position. 2 — the map. Neither is a search, so neither is in a
                section of its own: they are the two ways to answer this field without typing. */}
            <ul className="picker__list">
              <li className="picker__item">
                <button
                  type="button"
                  className="picker-row picker-row--action"
                  onClick={useCurrentLocation}
                  disabled={locating}
                >
                  <span className="picker-row__marker">
                    <Icon name="location" size={18} />
                  </span>
                  <span className="stack-1 grow">
                    <span className="picker-row__name">
                      {locating ? t('Finding your location…') : t('Use my current location')}
                    </span>
                    <span className="picker-row__meta">
                      {locating
                        ? t('Waiting for a position fix…')
                        : t('Your street address, planned from the nearest stop.')}
                    </span>
                  </span>
                  <Icon name="chevronRight" size={18} />
                </button>
              </li>
              <li className="picker__item">
                <button type="button" className="picker-row picker-row--action" onClick={() => onOpenMap(active)}>
                  <span className="picker-row__marker">
                    <Icon name="map" size={18} />
                  </span>
                  <span className="stack-1 grow">
                    <span className="picker-row__name">{t('Choose on the map')}</span>
                    <span className="picker-row__meta">
                      {t('Slide the map until the pin sits on the stop you want.')}
                    </span>
                  </span>
                  <Icon name="chevronRight" size={18} />
                </button>
              </li>
            </ul>

            {/* 3 — the traveller's own stops, and nothing else: this is the one section with no
                question behind it. */}
            {favouriteStops.length ? (
              <>
                <p className="picker__section">{t('Favourite stops')}</p>
                <ul className="picker__list">
                  {favouriteStops.map((stop) => stopRow(stop, searchMeta(stop)))}
                </ul>
              </>
            ) : null}

            {/*
              4 — the closest stops, from the one position the app agrees on. The device's own
              fix wins and the approximate IP estimate is the failover, which is `nearestOrigin`:
              the sentence under the list names which one this was, because an IP estimate can be
              a hundred kilometres out and must never read as a device fix (the rule the stops
              list already follows).

              While the IP estimate has not answered yet the section waits rather than announcing
              "popular stops" and swapping itself a moment later.
            */}
            {nearestOrigin ? (
              <>
                <p className="picker__section">{t('Closest stops')}</p>
                <ul className="picker__list">
                  {closest.map(({ stop, metres }) => stopRow(stop, distanceMeta(stop, metres)))}
                </ul>
                <p className="t-sm t-faint stops-origin">
                  {nearestOrigin.source === 'device'
                    ? t('From your device location.')
                    : t('From an approximate IP location — it can be off by a lot.')}
                </p>
              </>
            ) : approximateLocationPending ? null : (
              /*
                No fallback list of big stations: an empty field is the traveller's own
                favourites followed by the **closest** stops, and with no location there is
                nothing to measure "closest" from (MATCHING_PLAN rule 2 — the hard-coded
                shortlist is retired). The line says what is missing and how to get it.
              */
              <p className="t-sm t-faint stops-origin">{t('Turn on location to see what is closest.')}</p>
            )}
          </div>
        )}

        {from && to ? (
          <div className="picker__plan">
            <Button variant="primary" icon="route" block onClick={onPlan}>
              {t('Plan journey')}
            </Button>
          </div>
        ) : null}

        {/* Only while a looked-up address is actually on screen: the licence asks for it
            where the data is shown, not in a footer nobody reads. */}
        {fromLabel || toLabel ? <p className="picker__attribution t-sm t-faint">{ADDRESS_ATTRIBUTION}</p> : null}
      </div>
    </FullScreen>
  );
}
