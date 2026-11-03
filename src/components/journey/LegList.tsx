import { useState } from 'react';
import { getStop, stopLabel, nearbyStops } from '../../data/stops';
import { getLine } from '../../data/network';
import { getDisruption } from '../../data/disruptions';
import { alertLine } from '../../lib/disruptionText';
import { useFormat } from '../../lib/useFormat';
import { Dialog, Pill } from '../ui/primitives';
import { Icon, ModeIcon } from '../ui/Icons';
import { StopLink } from '../stops/StopLink';
import { useT } from '../../lib/useT';
import type { Journey, Leg } from '../../data/types';

/*
 * **The rail is a timetable, not a stack of cards.**
 *
 * Every leg used to carry a row of pills — the platform, the arrival platform, the direction and a
 * bicycle — so a three-change journey printed twenty-one chips down one column and read as a form.
 * 9292 prints the same journey as a timetable: the time in a gutter on the left, the station in
 * bold on the line, the service in one coloured badge, and the rest as small grey sentences. The
 * times answer "when", the rail answers "which way", and the grey line answers "what do I need to
 * know at this platform". Nothing is boxed twice.
 */

function WalkLegRow({ leg }: { leg: Leg }) {
  const format = useFormat();
  const t = useT();
  const minutes = leg.arrival - leg.departure;
  /*
   * The alert on this leg, read from the record rather than from a sentence built once in the
   * engine: a stored English line stayed English on a Dutch page.
   */
  const alert = leg.disruptionId ? getDisruption(leg.disruptionId) : undefined;
  const metres = leg.distanceMetres ?? 0;
  return (
    <li className="timeline__rail timeline__rail--dashed">
      <span className="timeline__time">{format.time(leg.departure)}</span>
      <span className="timeline__node timeline__node--muted" />
      <div className="stack-1">
        {/* One grey sentence, the shape 9292 gives a walk: how long, how far, from where to where. */}
        <span className="t-strong t-sm">
          <ModeIcon mode={leg.mode} size={13} /> {t(leg.mode === 'bike' ? 'Cycle' : 'Walk')}{' '}
          {format.duration(minutes)}
          {metres ? ` · ${metres} m` : ''}
        </span>
        <p className="t-sm t-muted">
          {/* An end that is an address keeps its words and gets no link: there is no page for a
              street, and a walk from a doorstep is named by the address, not by a station. */}
          {leg.fromLabel ?? <StopLink stopId={leg.fromStopId} />} <Icon name="arrowRight" size={12} />{' '}
          {leg.toLabel ?? <StopLink stopId={leg.toStopId} />}
        </p>
        {alert ? <p className="t-sm t-faint">{alertLine(t, alert)}</p> : null}
      </div>
    </li>
  );
}

function RideLegRow({ leg, isLastRide }: { leg: Leg; isLastRide: boolean }) {
  const format = useFormat();
  const t = useT();
  const line = getLine(leg.lineId);
  /*
   * **The stops on this service open in a sheet of their own.** They used to unfold inside the
   * leg, which pushed every service below them down the rail and turned the journey into an
   * accordion; 9292 keeps the journey the same height and opens the stops over it, so a traveller
   * can see where they are between two stations without losing the line they are reading.
   */
  const [stopsOpen, setStopsOpen] = useState(false);
  const stops = leg.intermediateStops ?? [];
  const serviceName = leg.lineName ?? line?.name ?? t('Service');
  const platforms = [
    leg.platform ? `${t('Platform')} ${leg.platform}` : null,
    !isLastRide && leg.arrivalPlatform ? `${t('Arrival platform')} ${leg.arrivalPlatform}` : null,
  ].filter(Boolean);
  return (
    <li className={`timeline__rail timeline__rail--ride${leg.cancelled ? ' font-bold' : ''}`}>
      {/* The time you board, in the gutter, exactly where a paper timetable prints it. */}
      <span className="timeline__time">{format.time(leg.departure)}</span>
      <span className="timeline__node timeline__node--accent" />
      <div className="stack-2">
        <span className="timeline__station">
          {leg.fromLabel ?? <StopLink stopId={leg.fromStopId} />}
        </span>

        <div className="row-wrap">
          <span className={`mode-badge mode-badge--${leg.mode}`}>
            <ModeIcon mode={leg.mode} size={13} />
            {serviceName}
          </span>
          {/*
            The delay is printed on the service that is late, in the colour the app uses for late
            things — not in a pill, and not again on the card's heading.
          */}
          {leg.delayMinutes ? <span className="delay t-sm">+{leg.delayMinutes} min</span> : null}
          {leg.cancelled ? <span className="delay t-sm">{t('Cancelled')}</span> : null}
        </div>

        {/* The headsign is the direction this service is pointed in, in its own grey line. */}
        {leg.headsign ? (
          <p className="t-sm t-muted">
            <Icon name="arrowRight" size={12} /> {t('Direction')}{' '}
            <StopLink stopId={leg.headsignStopId} label={leg.headsign} />
          </p>
        ) : null}

        {/*
          Where you stand and where you get off, in words: "Platform 1 · Arrival platform 2". A
          traveller reads this at the platform, so it stays on the service that owns it — the
          arrival platform of the last service is printed beside the arrival station instead.
        */}
        {platforms.length ? <p className="t-sm t-muted">{platforms.join(' · ')}</p> : null}

        <button
          type="button"
          className="leg-stops"
          aria-label={t('Show the stops on {line}', { line: serviceName })}
          onClick={() => setStopsOpen(true)}
        >
          <Icon name="route" size={13} />
          {stops.length === 0
            ? t('Board to alight')
            : stops.length === 1
              ? t('1 stop in between')
              : t('{count} stops in between', { count: stops.length })}
          <Icon name="chevronRight" size={14} className="leg-stops__chevron" />
        </button>

        {/*
          The sheet is the leg's own line, stop by stop: where you get on, every stop it calls at
          with its time and platform, and where you get off. The two ends of the ride carry the two
          words that answer "how far am I", so a glance at the list says which end you are on.
        */}
        <Dialog
          open={stopsOpen}
          onClose={() => setStopsOpen(false)}
          title={serviceName}
          description={`${format.time(leg.departure)} → ${format.time(leg.arrival)} · ${t('{duration} ride', {
            duration: format.duration(leg.arrival - leg.departure),
          })}`}
        >
          <ol className="stack-2">
            <li className="between">
              <span className="row-wrap">
                <span className="t-strong t-sm">
                  {leg.fromLabel ?? <StopLink stopId={leg.fromStopId} />}
                </span>
                <Pill tone="butter">{t('Board')}</Pill>
                {leg.platform ? (
                  <Pill tone="outline">
                    <Icon name="platform" size={12} />
                    {t('Platform')} {leg.platform}
                  </Pill>
                ) : null}
              </span>
              <span className="t-sm t-mono-num t-muted">{format.time(leg.departure)}</span>
            </li>
            {stops.map((stop) => (
              <li key={stop.stopId} className="between">
                {/* Every stop the service calls at is a place with a page, as in the rail itself. */}
                <span className="t-sm">
                  <StopLink stopId={stop.stopId} />
                </span>
                <span className="row">
                  <span className="t-sm t-muted t-mono-num">{format.time(stop.arrival)}</span>
                  {stop.platform ? (
                    <Pill tone="outline">{t('Platform {platform}', { platform: stop.platform })}</Pill>
                  ) : null}
                </span>
              </li>
            ))}
            <li className="between">
              <span className="row-wrap">
                <span className="t-strong t-sm">
                  {leg.toLabel ?? <StopLink stopId={leg.toStopId} />}
                </span>
                <Pill tone="sage">{t('Get off')}</Pill>
                {leg.arrivalPlatform ? (
                  <Pill tone="outline">
                    <Icon name="platform" size={12} />
                    {t('Arrival platform')} {leg.arrivalPlatform}
                  </Pill>
                ) : null}
              </span>
              <span className="t-sm t-mono-num t-muted">{format.time(leg.arrival)}</span>
            </li>
          </ol>
        </Dialog>
      </div>
    </li>
  );
}

/** Transfer rows between two consecutive ride legs, including the walking link. */
function transferBetween(previous: Leg, next: Leg) {
  const sameStop = previous.toStopId === next.fromStopId;
  const wait = next.departure - previous.arrival;
  const shortWalk = !sameStop ? nearbyStops(previous.toStopId, 6).find((stop) => stop.id === next.fromStopId) : undefined;
  const stop = getStop(sameStop ? next.fromStopId : previous.toStopId);
  return { sameStop, wait, shortWalk, stop };
}

export function LegList({ journey }: { journey: Journey }) {
  const format = useFormat();
  const t = useT();
  const rows: React.ReactNode[] = [];
  const lastRide = [...journey.legs].reverse().find((leg) => leg.mode !== 'walk' && leg.mode !== 'bike');
  const lastRideId = lastRide?.id;
  journey.legs.forEach((leg, index) => {
    const previous = journey.legs[index - 1];
    if (previous) {
      const transfer = transferBetween(previous, leg);
      if (previous.mode !== 'walk' && previous.mode !== 'bike' && leg.mode !== 'walk' && leg.mode !== 'bike') {
        /*
         * **A change is a small grey line on the rail, not a butter pill across it.** The rail is
         * already drawn through the wait — the leg above stops at the change and the leg below
         * starts there — so the only thing left to say is how long the wait is, and the words for
         * it are the smallest ones on the screen.
         */
        rows.push(
          <li key={`transfer-${leg.id}`} className="timeline__rail timeline__transfer">
            <span className="timeline__node timeline__node--transfer" />
            <span className="t-sm t-muted">
              {transfer.sameStop
                ? t('Change here · {duration} wait', {
                    duration: format.duration(Math.max(1, transfer.wait)),
                  })
                : t('Change here · a short walk to {stop}', { stop: stopLabel(leg.fromStopId) })}
            </span>
          </li>,
        );
      }
    }
    rows.push(
      leg.mode === 'walk' || leg.mode === 'bike' ? (
        <WalkLegRow key={leg.id} leg={leg} />
      ) : (
        <RideLegRow key={leg.id} leg={leg} isLastRide={leg.id === lastRideId} />
      ),
    );
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
            {lastRide === lastLeg && lastLeg.arrivalPlatform ? (
              <span className="t-sm t-muted">
                {t('Arrival platform')} {lastLeg.arrivalPlatform}
              </span>
            ) : null}
          </span>
        </span>
      </li>
    </ol>
  );
}
