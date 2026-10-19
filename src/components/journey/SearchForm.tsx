import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../../state/AppState';
import { getStop } from '../../data/stops';
import { StopPicker } from './StopPicker';
import { MapPicker } from './MapPicker';
import { Icon } from '../ui/Icons';
import { nowMinutes, roundToStep, todayIso } from '../../lib/format';
import { useT } from '../../lib/useT';
import type { Stop } from '../../data/types';
import type { SearchQuery } from '../../data/journeyEngine';

type Side = 'from' | 'to';

/**
 * The planner card: two rows and a rail, and nothing else.
 *
 * The card asks one question — where from, where to — so it holds one answer per row and
 * no other control at all. There is no search button and no date or time here: the second
 * stop *is* the search, and the journey's when, how and which carriers are answered on the
 * results screen, where they apply to something you can already see.
 *
 * Both rows are buttons, not fields: typing happens on the full-screen picker, which is
 * the screen built for it. This keeps the card readable, tappable and 106px tall.
 */
export function SearchForm({
  onSearch,
  inheritSearch = false,
}: {
  onSearch?: () => void;
  /**
   * Whether this card **is** the search on screen, or the next question.
   *
   * On the results screen the card is the question the list answers, so it shows the two ends that
   * were asked — that is `inheritSearch`. The home screen is the *next* question: it opened holding
   * the last search's ends (and its date and time), so a journey planned once was still sitting in
   * the planner afterwards, and a pair a refused pick had left there came back with the traveller.
   * The home card starts empty instead: no ends, no address, and "now" — nothing the traveller
   * searched for before is on the screen they start from.
   */
  inheritSearch?: boolean;
}) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { search, startSearch, preferences, pushToast, settings } = useApp();
  const t = useT();

  /*
   * `?pick=` marks a hand-over from a "Plan … here" control: the URL answers one end and the
   * traveller answers the other. In that case the card must not borrow the remaining end from the
   * search still in the session, nor from the default origin — an empty row with its picker open
   * is the whole point of the hand-over (F28).
   */
  const pickParam = params.get('pick');
  const handOver = pickParam === 'from' || pickParam === 'to';

  const defaults = useMemo(() => {
    /* Only this search's own card borrows its ends (see `inheritSearch`). */
    const base = inheritSearch ? search?.query : undefined;
    const fallbackOrigin = settings.defaultOriginStopId ? getStop(settings.defaultOriginStopId) : undefined;
    const fromParam = getStop(params.get('from') ?? undefined);
    const toParam = getStop(params.get('to') ?? undefined);
    return {
      from: fromParam ?? (handOver ? null : getStop(base?.fromStopId) ?? fallbackOrigin ?? null),
      to: toParam ?? (handOver ? null : getStop(base?.toStopId) ?? null),
    };
  }, [params, search, settings.defaultOriginStopId, handOver, inheritSearch]);

  /**
   * A new pair keeps the when of the search on screen (changing only the destination should not
   * silently move the departure time), unless that search is in the past, which the planner cannot
   * serve — and on a card that is not the search's own, "the search on screen" is none of them: a
   * fresh question is asked with now.
   */
  const when = useMemo(() => {
    const base = inheritSearch ? search?.query : undefined;
    const usable = base && base.date >= todayIso() ? base : null;
    return {
      date: usable?.date ?? todayIso(),
      time: usable?.time ?? roundToStep(nowMinutes(), 5),
      timeMode: usable?.timeMode ?? settings.defaultTimeMode,
    };
  }, [search, settings.defaultTimeMode, inheritSearch]);

  const [from, setFrom] = useState<Stop | null>(defaults.from);
  const [to, setTo] = useState<Stop | null>(defaults.to);

  /*
   * A `?from=`/`?to=` that arrives while this card is already on screen has to be applied.
   *
   * The card lives on the home route and every link that fills one of its rows is *on* the home
   * route, so React Router keeps the component mounted and `useState(defaults.from)` — which only
   * ever runs once — never sees the new parameter. The row stayed empty while the URL said
   * `?from=utrecht-centraal`; the same trap as a `?stop=` that changes on a mounted board.
   * Params are the only trigger: a stop chosen on this card does not change them, and is not
   * clobbered by them.
   */
  const paramFrom = params.get('from');
  const paramTo = params.get('to');
  /*
   * An address "use my current location" resolved to, per end. Kept beside the stop rather
   * than inside it: the journey is planned from the stop, and the traveller named the
   * address. Both are shown where the pair is shown, and both travel with the search.
   */
  const [labels, setLabels] = useState<{ from?: string; to?: string }>({
    from: inheritSearch ? search?.query.fromLabel : undefined,
    to: inheritSearch ? search?.query.toLabel : undefined,
  });
  /*
   * …and how far that address is from the stop it resolved to, per end. It is what says an end
   * is a *place* rather than a stop, which is the difference between an address and the station
   * it happens to sit nearest: a journey has two places, not two stop ids (see
   * `planAccessJourney`). Kept beside the label, and cleared with it.
   */
  const [access, setAccess] = useState<{ from?: number; to?: number }>({
    from: inheritSearch ? search?.query.fromAccessMetres : undefined,
    to: inheritSearch ? search?.query.toAccessMetres : undefined,
  });
  const [errors, setErrors] = useState<{ from?: string; to?: string }>({});
  const [sheet, setSheet] = useState<{ kind: 'pick' | 'map'; side: Side } | null>(null);

  useEffect(() => {
    if (paramFrom !== null) {
      const stop = getStop(paramFrom);
      if (stop) setFrom(stop);
    }
    if (paramTo !== null) {
      const stop = getStop(paramTo);
      if (stop) setTo(stop);
    }
    /* A hand-over that arrives on an already-mounted card clears the end it did not name, so the
       previous search's stop cannot stand in for the traveller's answer. */
    if (!handOver) return;
    if (paramFrom === null) {
      setFrom(null);
      setLabels((current) => ({ ...current, from: undefined }));
      setAccess((current) => ({ ...current, from: undefined }));
    }
    if (paramTo === null) {
      setTo(null);
      setLabels((current) => ({ ...current, to: undefined }));
      setAccess((current) => ({ ...current, to: undefined }));
    }
    setErrors({});
  }, [paramFrom, paramTo, handOver]);

  /*
   * `?pick=from|to` opens the picker on the end that is still missing.
   *
   * A "Plan to here" anywhere in the app now answers one end and hands the other to the
   * traveller: it fills **only** the end that was named, lands here, and opens the picker for the
   * *other* end ("when you press a button like 'PLAN TO HERE' that it only auto-inputs the 'TO'
   * and brings you to the search menu with the 'FROM' selected instead of the results"). Before
   * this, a search already in the session was quietly reused — its other end was carried into the
   * new query and the screen jumped to results — which is the "it auto-fills the from" in the
   * report.
   */
  useEffect(() => {
    if (pickParam === 'from' || pickParam === 'to') setSheet({ kind: 'pick', side: pickParam });
  }, [pickParam]);

  const run = (
    origin: Stop,
    destination: Stop,
    named: { from?: string; to?: string } = labels,
    distances: { from?: number; to?: number } = access,
  ) => {
    const query: SearchQuery = {
      fromStopId: origin.id,
      toStopId: destination.id,
      fromLabel: named.from,
      toLabel: named.to,
      fromAccessMetres: distances.from,
      toAccessMetres: distances.to,
      date: when.date,
      time: when.time,
      timeMode: when.timeMode,
      preferences,
    };
    /*
     * Route first, close the sheet on the way out (F4).
     *
     * The sheet covers the screen, so closing it before the route moved left the planner — the
     * home screen — visible for the frames in between: the reported "flicker of the home screen"
     * that made the traveller think the press had failed. Now the destination is chosen first and
     * the next screen paints under the closing overlay, where it has always been.
     *
     * No toast: the results screen is the answer to the question that was just asked.
     */
    startSearch(query);
    navigate('/results');
    setSheet(null);
    onSearch?.();
  };

  /**
   * One end was chosen. Completing the pair is the search; two equal stops are the one
   * answer the planner has to refuse, and there is no search button left to catch it.
   */
  /**
   * One end was chosen. **Completing the pair is the search, whatever answered it.**
   *
   * This used to depend on where the answer came from: the list ran the search, the map did
   * not, and the traveller was returned to the picker with a "Plan journey" button instead.
   * That is the report this rule is written against — "sometimes the results dont always show
   * when you put in 2 locations both from and to, sometimes pressing the plan journey button is
   * necessary" — because a pair filled from the map left them on the picker with two stops and
   * no journey. Two ends and no search is now impossible: the pick that supplies the second one
   * plans, and the picker only stays open while one end is still missing, which is when there is
   * genuinely nothing to plan yet.
   */
  const pick = (side: Side, stop: Stop, label?: string, accessMetres?: number) => {
    const nextFrom = side === 'from' ? stop : from;
    const nextTo = side === 'to' ? stop : to;
    const nextLabels = { ...labels, [side]: label };
    const nextAccess = { ...access, [side]: accessMetres };
    setLabels(nextLabels);
    setAccess(nextAccess);
    /*
     * Two ends on one stop is refused **only when both ends are stops**. An address that
     * resolves to the destination's own station is a route, not a duplicate: "Rijksstraatweg 9,
     * Haarlem" → "Haarlem" is the walk (or cycle) from that address to that station, and the
     * engine plans it from the distance the picker measured. Refusing it told the traveller
     * their address *was* the station.
     */
    const sameStop = nextFrom && nextTo && nextFrom.id === nextTo.id;
    const bothEndsAreStops = !nextLabels.from && !nextLabels.to;
    if (sameStop && bothEndsAreStops) {
      setErrors({ to: t('Origin and destination must be different stops') });
      pushToast('Origin and destination must be different stops', 'warning');
      if (side === 'from') setFrom(stop);
      else setTo(stop);
      return;
    }
    if (side === 'from') setFrom(stop);
    else setTo(stop);
    setErrors({});
    if (nextFrom && nextTo) run(nextFrom, nextTo, nextLabels, nextAccess);
  };

  const clear = (side: Side) => {
    if (side === 'from') setFrom(null);
    else setTo(null);
    setLabels((current) => ({ ...current, [side]: undefined }));
    setAccess((current) => ({ ...current, [side]: undefined }));
    setErrors({});
  };

  const reverse = () => {
    setFrom(to);
    setTo(from);
    setLabels((current) => ({ from: current.to, to: current.from }));
    setAccess((current) => ({ from: current.to, to: current.from }));
    setErrors({});
  };

  const renderRow = (side: Side) => {
    const value = side === 'from' ? from : to;
    return (
      <div className={`planner-row${side === 'to' ? ' planner-row--to' : ''}`}>
        <button
          type="button"
          className={`planner-row__btn${value ? '' : ' planner-row__btn--empty'}`}
          aria-haspopup="dialog"
          onClick={() => setSheet({ kind: 'pick', side })}
        >
          {/*
            The row is named by its own text when it is empty and by the stop in it when it is
            not, so the screen-reader name is only needed in the second case — as two spans it
            read "From From". "From: station, stop or landmark" was the field telling the
            traveller what a stop is, in a card whose two rows are the only two things on it.
          */}
          {value ? <span className="sr-only">{side === 'from' ? t('From') : t('To')}</span> : null}
          {value ? labels[side] ?? value.name : t(side === 'from' ? 'From' : 'To')}
        </button>
      </div>
    );
  };

  const error = errors.from ?? errors.to;

  return (
    <div className="planner">
      <div className={`planner-card${error ? ' planner-card--invalid' : ''}`}>
        <span className="planner-rail" aria-hidden="true">
          <span className={`planner-rail__node planner-rail__node--from${errors.from ? ' planner-rail__node--invalid' : ''}`} />
          <span className={`planner-rail__node planner-rail__node--to${errors.to ? ' planner-rail__node--invalid' : ''}`} />
        </span>
        <div className="planner-rows">
          {renderRow('from')}
          {renderRow('to')}
        </div>
      </div>

      {error ? (
        <p className="field__error" role="alert">
          <Icon name="alert" size={14} />
          {error}
        </p>
      ) : null}

      {sheet?.kind === 'pick' ? (
        <StopPicker
          side={sheet.side}
          from={from}
          to={to}
          fromLabel={labels.from}
          toLabel={labels.to}
          error={error}
          onPick={pick}
          onClear={clear}
          onReverse={reverse}
          onOpenMap={(side) => setSheet({ kind: 'map', side })}
          onPlan={() => {
            if (from && to) run(from, to);
          }}
          onClose={() => setSheet(null)}
        />
      ) : null}

      {sheet?.kind === 'map' ? (
        <MapPicker
          side={sheet.side}
          centreOn={sheet.side === 'from' ? from : to}
          onPick={(side, stop) => {
            pick(side, stop);
            /* Back to the picker, not out of it: the map answered one row, and the other row
               (or the pin beside it) is the next thing the traveller is looking for. When that
               row was the last one missing, `pick` has already planned the pair and this sheet
               is gone — which is the point: two ends, a journey on screen. */
            setSheet((current) => (current ? { kind: 'pick', side } : current));
          }}
          onClose={() => setSheet({ kind: 'pick', side: sheet.side })}
        />
      ) : null}
    </div>
  );
}
