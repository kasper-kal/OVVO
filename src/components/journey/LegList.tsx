import { useLayoutEffect, useRef, useState } from 'react';
import { getLine } from '../../data/network';
import { operatorName } from '../../data/operators';
import { getDisruption } from '../../data/disruptions';
import { alertLine } from '../../lib/disruptionText';
import { useFormat } from '../../lib/useFormat';
import { Icon, ModeIcon } from '../ui/Icons';
import { StopLink } from '../stops/StopLink';
import { useT } from '../../lib/useT';
import type { Journey, Leg } from '../../data/types';

/*
 * **The rail is a timetable.** The time in the gutter, the mode's own glyph under it, the station in
 * bold on the line, then the service, the direction it is pointed in and the platform, in words.
 * There are no pills: a chip for the platform, a chip for the arrival platform, a chip for the
 * direction and a chip for the bicycle made a three-change journey twenty-one boxes tall.
 *
 * **The service name is the control.** Tapping "Bus 347" opens the stops it calls at, right here on
 * the rail, each with its own time and a small ring on the line — the question "which stops are
 * between here and there" is a question about this line, so the answer belongs under this line. The
 * separate "1 stop in between" link said the same thing twice, in a second place, and is gone.
 */


/*
 * **A walk's dashes are fitted to its stretch, not cut off by it.**
 *
 * The rail draws a walk as a repeating pattern, and a pattern cannot know how tall the row it is
 * drawing in happens to be. Left alone it ended on a half-length dash and with a cramped gap before
 * it — a row is not a whole number of dashes tall, and there is no reason it would be.
 *
 * So the row measures itself and adds the one to eleven pixels that make its stretch a whole number
 * of dash-and-gap cycles. Those spare pixels run past the next circle's edge, and the circle's own
 * fill hides them. The visible result is simple: a full dash leaving the circle above, a full dash
 * arriving at the circle below, and the same space between every pair.
 */
/* One cycle of the walk's pattern: five pixels of dash, seven of space (the same numbers the style
   declares). The row's own fit adds the leftover that makes its stretch a whole number of cycles. */
const CYCLE = 12;

/*
 * **Two or three little people, or a question mark.**
 *
 * 9292 draws the crowding of each service under its name: two people when it is quiet, three when
 * it is full, and a question mark when nobody has counted. The app said it once, at the foot of the
 * page, about the whole journey — so a packed second train and an empty first one read the same.
 * The picture is drawn from the service's own reading (`Leg.occupancy`) and the words are kept for
 * a screen reader, which cannot count silhouettes.
 */
const CROWDING_WORDS = {
  quiet: 'Quiet',
  moderate: 'Fairly busy',
  busy: 'Busy',
  unknown: 'Crowding unknown',
} as const;

function CrowdingMark({ level }: { level: Leg['occupancy'] }) {
  const t = useT();
  if (!level) return null;
  if (level === 'unknown') {
    return (
      <span className="leg-crowding leg-crowding--unknown">
        <span className="leg-crowding__unknown" aria-hidden="true">?</span>
        <span className="sr-only">{t(CROWDING_WORDS.unknown)}</span>
      </span>
    );
  }
  const people = level === 'busy' ? 3 : 2;
  const filled = level === 'quiet' ? 0 : level === 'moderate' ? 1 : people;
  return (
    <span className={`leg-crowding leg-crowding--${level}`}>
      <span className="sr-only">{t(CROWDING_WORDS[level])}</span>
      <span className="leg-crowding__people" aria-hidden="true">
        {Array.from({ length: people }, (_, index) => (
          <Icon key={index} name="users" size={13} strokeWidth={index < filled ? 2.4 : 1.3} />
        ))}
      </span>
    </span>
  );
}

/*
 * **One platform, or two in the warning colour.**
 *
 * A station that has not settled which berth a service leaves from says so: 9292 prints
 * "Platform 5 or 6" in red, which is a different instruction from "Platform 5" — watch the board
 * rather than walk to one. The words are built here, not in the engine, so the sentence follows the
 * page's language.
 */
function Platform({ value, alt }: { value?: string; alt?: string }) {
  const t = useT();
  if (!value) return null;
  if (alt) {
    return (
      <span className="timeline__platform timeline__platform--choice">
        {t('Platform {a} or {b}', { a: value, b: alt })}
      </span>
    );
  }
  return (
    <span className="timeline__platform">
      {t('Platform')} {value}
    </span>
  );
}

function useFittedDashes() {
  const ref = useRef<HTMLLIElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const fit = () => {
      const cs = getComputedStyle(el);
      const gap = parseFloat(cs.getPropertyValue('--timeline-gap')) || 32;
      const node = parseFloat(cs.getPropertyValue('--rail-node')) || 14;
      /* From the circle above's foot to the circle below's head: the whole stretch this row draws. */
      const length = el.getBoundingClientRect().height + gap - node;
      /*
       * The pattern is drawn half a cycle late (see the style), so it ends on a dash at the next
       * circle only when the length is a whole number of cycles. The leftover is what makes it so,
       * and it hides under that circle.
       */
      const extra = ((-(length % CYCLE) % CYCLE) + CYCLE) % CYCLE;
      el.style.setProperty('--dash-extra', `${extra.toFixed(2)}px`);
    };
    fit();
    const watcher = new ResizeObserver(fit);
    watcher.observe(el);
    return () => watcher.disconnect();
  }, []);
  return ref;
}

function WalkLegRow({ leg, origin }: { leg: Leg; origin?: React.ReactNode }) {
  const format = useFormat();
  const t = useT();
  const minutes = leg.arrival - leg.departure;
  /*
   * The alert on this leg, read from the record rather than from a sentence built once in the
   * engine: a stored English line stayed English on a Dutch page.
   */
  const alert = leg.disruptionId ? getDisruption(leg.disruptionId) : undefined;
  const metres = leg.distanceMetres ?? 0;
  const railRef = useFittedDashes();
  return (
    <li ref={railRef} className="timeline__rail timeline__rail--dashed">
      <span className="timeline__time">{format.time(leg.departure)}</span>
      <span className="timeline__mode">
        <ModeIcon mode={leg.mode} size={18} />
      </span>
      <span className="timeline__node timeline__node--muted" />
      <div className="stack-1">
        {/*
          **A walk that starts the journey names where it starts.**
          *
          * The first row of a journey from an address is a walk, and it had nothing beside its ring:
          * the traveller's own street was named in the title and then never appeared on the line, so
          * the rail began with a bare circle at 04:23 and an amount. Every other mark on the line
          * names a place; this one now does too, and only this one — a walk between two stations is
          * still one quiet line, because the stations above and below it are already named.
        */}
        {origin ? (
          <span className="row-wrap">
            <span className="timeline__station">{origin}</span>
          </span>
        ) : null}
        <span className="t-sm t-muted">
          {t(leg.mode === 'bike' ? 'Cycle' : 'Walk')} ± {format.duration(minutes)}
          {metres ? ` (${metres} m)` : ''}
        </span>
        {alert ? <p className="t-sm t-faint">{alertLine(t, alert)}</p> : null}
      </div>
    </li>
  );
}

function RideLegRow({
  leg,
  stopsOpen,
  onToggleStops,
}: {
  leg: Leg;
  stopsOpen: boolean;
  onToggleStops: () => void;
}) {
  const format = useFormat();
  const t = useT();
  const line = getLine(leg.lineId);
  const stops = leg.intermediateStops ?? [];
  const serviceName = leg.lineName ?? line?.name ?? t('Service');
  /*
   * **The carrier is part of the service's name.** 9292 prints "NS Intercity" rather than
   * "Intercity", so the traveller knows whose train it is before they board it. The name is only
   * prefixed when the carrier is a real one and the name does not already say it, so a saved
   * journey with "NS Intercity 500" written out does not read "NS NS …".
   */
  /*
   * **The number leaves the name and becomes a badge of its own.** 9292 prints "Connexxion Bus" and
   * then the line number in a coloured badge, so the service and its number are read as two things:
   * who runs it, and which one you get on. A night service gets its own colour.
   */
  const carrier = operatorName(leg.operatorId ?? line?.operatorId);
  const badgeNumber = leg.lineNumber ?? line?.number ?? '';
  const nameWithoutNumber =
    badgeNumber && serviceName.endsWith(badgeNumber)
      ? serviceName.slice(0, -badgeNumber.length).trim()
      : serviceName;
  const nameCarrier =
    carrier && carrier !== 'Onbekend' && !nameWithoutNumber.startsWith(carrier) ? carrier : '';
  const serviceLabel = [nameCarrier, nameWithoutNumber, badgeNumber].filter(Boolean).join(' ');
  const badge = badgeNumber ? (
    <span
      className={`leg-line-badge leg-line-badge--${leg.mode}${line?.nightOnly ? ' leg-line-badge--night' : ''}`}
    >
      {badgeNumber}
    </span>
  ) : null;
  const serviceWords = (
    <>
      {nameCarrier ? `${nameCarrier} ` : ''}
      {nameWithoutNumber}
    </>
  );
  return (
    <li className={`timeline__rail timeline__rail--ride${leg.cancelled ? ' font-bold' : ''}`}>
      {/* The time you board, in the gutter, exactly where a paper timetable prints it. */}
      <span className="timeline__time">{format.time(leg.departure)}</span>
      {/* Under the time, the way you travel: a bus, a tram, a train, a boat. */}
      <span className="timeline__mode">
        <ModeIcon mode={leg.mode} size={18} />
      </span>
      <span className="timeline__node timeline__node--accent" />
      <div className="stack-1">
        {/*
          **The platform sits beside the station, in the accent, as one word.** It was a grey sentence
          of its own — "Platform 1 · Arrival platform 2" — which is two facts and a line of height
          per service; 9292 prints the platform the traveller actually stands on at the right of the
          station name and nothing else.
        */}
        <span className="row-wrap">
          <span className="timeline__station">
            {leg.fromLabel ?? <StopLink stopId={leg.fromStopId} />}
          </span>
          <Platform value={leg.platform} alt={leg.platformAlt} />
        </span>

        <div className="row-wrap">
          {stops.length ? (
            <button
              type="button"
              className="leg-service"
              aria-expanded={stopsOpen}
              aria-label={t('Show the stops on {line}', { line: serviceLabel })}
              onClick={onToggleStops}
            >
              {serviceWords}
              {badge}
              <Icon name="chevronRight" size={13} className="leg-service__chevron" />
            </button>
          ) : (
            /* A service that calls nowhere in between has nothing to open, so it is not a button. */
            <span className="leg-service leg-service--static">
              {serviceWords}
              {badge}
            </span>
          )}
          {/*
            The delay is printed on the service that is late, in the colour the app uses for late
            things — not in a pill, and not again on the card's heading.
          */}
          {leg.delayMinutes ? <span className="delay t-sm">+{leg.delayMinutes} min</span> : null}
          {leg.cancelled ? <span className="delay t-sm">{t('Cancelled')}</span> : null}
        </div>

        {/* How full this service is expected to be, under its own name. */}
        <CrowdingMark level={leg.occupancy} />

        {/* The headsign is the direction this service is pointed in, in its own grey line. */}
        {leg.headsign ? (
          <p className="t-sm t-muted">
            {t('Direction')} <StopLink stopId={leg.headsignStopId} label={leg.headsign} />
          </p>
        ) : null}

      </div>
    </li>
  );
}

export function LegList({ journey }: { journey: Journey }) {
  const format = useFormat();
  const t = useT();
  const rows: React.ReactNode[] = [];
  const lastRide = [...journey.legs].reverse().find((leg) => leg.mode !== 'walk' && leg.mode !== 'bike');
  /* Which services have their stops open. A leg is addressed by its id, so a re-render keeps it. */
  /*
   * **Every service opens with the journey.** 9292's opened journey has all of its legs open at
   * once, so the shape of the trip is read without a tap per service; a journey with nothing to
   * show still opens closed, because there is nothing to open.
   */
  const [openStops, setOpenStops] = useState<string[]>(() =>
    journey.legs.filter((leg) => leg.mode !== 'walk' && leg.mode !== 'bike').map((leg) => leg.id),
  );
  const toggleStops = (id: string) =>
    setOpenStops((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );

  /*
   * **A change is a row, printed on both sides of the walk between two services.** 9292 writes the
   * minutes you wait once as you get off and once as you get on, so a change reads as a place in the
   * journey rather than as a gap with nothing in it. The wait is the space between the two rides and
   * is already known, so nothing new has to be stored.
   */
  const isRide = (item: Leg) => item.mode !== 'walk' && item.mode !== 'bike';
  const previousRide = (index: number) =>
    [...journey.legs.slice(0, index)].reverse().find((item) => isRide(item));
  /*
   * The next ride, whether or not a walk stands between them: a change that is only a wait has no
   * walk to print, and 9292 still writes the minutes you wait on the line.
   */
  const changeAfter = (index: number) => {
    if (!isRide(journey.legs[index])) return undefined;
    return journey.legs.slice(index + 1).find((item) => isRide(item));
  };
  const changeRow = (key: string, minutes: number) => (
    <li key={key} className="timeline__rail timeline__rail--ride timeline__rail--change">
      <span className="timeline__mode">
        <ModeIcon mode="walk" size={18} />
      </span>
      <span className="timeline__node timeline__node--change" />
      <div className="stack-1">
        <span className="t-sm t-muted">
          {t('{count} min transfer time', { count: Math.max(0, minutes) })}
        </span>
      </div>
    </li>
  );

  journey.legs.forEach((leg, legIndex) => {
    if (isRide(leg) && legIndex > 0 && !isRide(journey.legs[legIndex - 1])) {
      const before = previousRide(legIndex);
      if (before) rows.push(changeRow(`change-in-${leg.id}`, leg.departure - before.arrival));
    }
    rows.push(
      leg.mode === 'walk' || leg.mode === 'bike' ? (
        <WalkLegRow
          key={leg.id}
          leg={leg}
          /* The first leg owns the journey's start, so its row is the one that names it. */
          /*
           * **The first row says where the journey starts, and only that.** A journey that begins
           * at an address printed that address beside the ring, which is the one row on the rail
           * that is not a stop and read as a second title. 9292 calls it the starting point and
           * leaves the place to the heading; a journey that begins at a stop still names the stop,
           * because that is what the row is about.
           */
          origin={
            journey.legs[0] === leg
              ? leg.fromLabel
                ? t('Starting point')
                : <StopLink stopId={leg.fromStopId} />
              : undefined
          }
        />
      ) : (
        <RideLegRow
          key={leg.id}
          leg={leg}
          stopsOpen={openStops.includes(leg.id)}
          onToggleStops={() => toggleStops(leg.id)}
        />
      ),
    );

    const after = changeAfter(legIndex);
    if (after) rows.push(changeRow(`change-out-${leg.id}`, after.departure - leg.arrival));

    /*
     * **The stops in between, on the rail.** One row per stop, its time in the gutter and a small
     * ring on the line, tucked tight under the service so a ride of twenty stops still reads as one
     * ride and the width of the page does not move.
     */
    if (openStops.includes(leg.id) && leg.mode !== 'walk' && leg.mode !== 'bike') {
      (leg.intermediateStops ?? []).forEach((stop) => {
        rows.push(
          <li
            key={`stop-${leg.id}-${stop.stopId}`}
            className="timeline__rail timeline__rail--ride timeline__rail--stop"
          >
            <span className="timeline__time">{format.time(stop.arrival)}</span>
            <span className="timeline__node timeline__node--stop" />
            <span className="row-wrap">
              <span className="t-sm">
                <StopLink stopId={stop.stopId} />
              </span>
              {/* A stop in an opened list carries its name and nothing else, as 9292 draws it:
                  a platform beside every stop turns one service into twenty little station rows. */}
            </span>
          </li>,
        );
      });
    }
  });

  /*
   * The line had no end: it stopped dead under the last leg, so a journey read as a list of
   * events rather than as somewhere to somewhere. The terminus is the traveller's own rule — a
   * circle for a departure, a **square** for an arrival — with the arrival stop named beside it and
   * its time in the gutter, so the rail finishes at a place and not at a hyphen.
   */
  const lastLeg = journey.legs[journey.legs.length - 1];
  const arrivalId = lastLeg.toStopId;
  /*
   * The connector into the arrival square is the last leg's mode, the same as the row above it,
   * so a journey with no service in it is one dashed line from the departure circle to the square.
   */
  const endsOnFoot = lastLeg.mode === 'walk' || lastLeg.mode === 'bike';
  return (
    <ol className={`timeline${endsOnFoot ? ' timeline--dashed-end' : ''}`}>
      {rows}
      <li className="timeline__end">
        <span className="timeline__time">{format.time(journey.arrival)}</span>
        <span className="timeline__node timeline__node--end" />
        <span className="stack-1 grow">
          <span className="row-wrap">
            <span className="timeline__station">
              {lastLeg.toLabel ?? <StopLink stopId={arrivalId} />}
            </span>
            {/*
              The platform a traveller steps onto is the arrival end's own fact, so it sits beside
              the arrival name — as a phrase in the same grey line, not a chip.
            */}
            {lastRide === lastLeg ? (
              <Platform value={lastLeg.arrivalPlatform} alt={lastLeg.arrivalPlatformAlt} />
            ) : null}
          </span>
        </span>
      </li>
    </ol>
  );
}
