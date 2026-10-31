import { useEffect, useRef, useState } from 'react';
import { getStop, stopLabel, nearbyStops } from '../../data/stops';
import { getLine } from '../../data/network';
import { getDisruption } from '../../data/disruptions';
import { alertLine } from '../../lib/disruptionText';
import { useFormat } from '../../lib/useFormat';
import { Disclosure, Pill } from '../ui/primitives';
import { Icon, ModeIcon } from '../ui/Icons';
import { StopLink } from '../stops/StopLink';
import { useT } from '../../lib/useT';
import type { Journey, Leg } from '../../data/types';

/**
 * **The conductor's punch.**
 *
 * Five taps on a platform tag stamp every platform on the journey with a punch mark, the way a
 * ticket gets checked. Nothing says so, nothing is saved, and the tags stay ordinary pills: a tap
 * on one does what a tap on a pill has always done, which is nothing.
 */
const PUNCH_EVENT = 'ovvo:punch';

function usePunched(): boolean {
  const [punched, setPunched] = useState(false);
  useEffect(() => {
    const stamp = () => setPunched(true);
    window.addEventListener(PUNCH_EVENT, stamp);
    return () => window.removeEventListener(PUNCH_EVENT, stamp);
  }, []);
  return punched;
}

function PlatformTag({ platform, label }: { platform?: string; label: string }) {
  const punched = usePunched();
  const taps = useRef(0);
  if (!platform) return null;
  return (
    <Pill>
      {/* A platform, not the board: `board` is the departure screen's monitor and a control
          that opens it. */}
      <span
        className={`platform-tag${punched ? ' is-punched' : ''}`}
        onClick={() => {
          taps.current += 1;
          if (taps.current >= 5) window.dispatchEvent(new Event(PUNCH_EVENT));
        }}
      >
        <Icon name="platform" size={12} />
        {label} {platform}
      </span>
    </Pill>
  );
}

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
      <span className="timeline__node timeline__node--muted" />
      <div className="leg-row">
        <span className="leg-row__marker">
          <ModeIcon mode={leg.mode} size={16} />
        </span>
        <div className="stack-1 grow">
          <div className="row-wrap">
            <span className="t-strong t-sm">
              {t(leg.mode === 'bike' ? 'Cycle' : 'Walk')} {format.duration(minutes)}
              {metres ? ` · ${metres} m` : ''}
            </span>
            <Pill tone="outline">{format.time(leg.departure)} – {format.time(leg.arrival)}</Pill>
          </div>
          {/*
            A walk's two ends are stations too, so they are links like every other named stop on
            this page. An end that is an address keeps its words and gets no link: there is no page
            for a street, and a walk from a doorstep is named by the address, not by a station.
          */}
          <p className="t-sm t-muted">
            {leg.fromLabel ?? <StopLink stopId={leg.fromStopId} />} <Icon name="arrowRight" size={13} />{' '}
            {leg.toLabel ?? <StopLink stopId={leg.toStopId} />}
          </p>
          {alert ? <p className="t-sm t-faint">{alertLine(t, alert)}</p> : null}
        </div>
      </div>
    </li>
  );
}

function RideLegRow({ leg, isLastRide }: { leg: Leg; isLastRide: boolean }) {
  const format = useFormat();
  const t = useT();
  const line = getLine(leg.lineId);
  return (
    <li className={`timeline__rail${leg.cancelled ? ' font-bold' : ''}`}>
      <span className="timeline__node timeline__node--accent" />
      <div className="stack-2">
        {/*
          Where this service is boarded — the same words, weight and rail the arrival end uses.
          The "From Haarlem Station · HLM / To Hoofddorp Station · HDD" pair said the same thing
          twice, put both ends of the journey inside one service's block, and left the departure
          unnamed at the top of the journey where it belongs.
        */}
        <span className="timeline__station">
          {leg.fromLabel ?? <StopLink stopId={leg.fromStopId} />}
        </span>

        <div className="row-wrap">
          <span className={`mode-badge mode-badge--${leg.mode}`}>
            <ModeIcon mode={leg.mode} size={13} />
            {leg.lineName ?? line?.name ?? t('Service')}
          </span>
          <span className="leg-row__time">
            {format.time(leg.departure)} <Icon name="arrowRight" size={13} /> {format.time(leg.arrival)}
          </span>
          <Pill>
            <Icon name="clock" size={12} />
            {format.duration(leg.arrival - leg.departure)}
          </Pill>
          {leg.delayMinutes ? (
            <Pill tone="coral" dot dotTone="coral">
              {t('Delay +{minutes} min', { minutes: leg.delayMinutes })}
            </Pill>
          ) : null}
          {/*
            One status per leg, and a cancelled leg is never also "On time": the same reading
            the journey summary above the rail makes (9.4). "On time" itself is not printed per
            leg — the card's own head already says it once, and a line of green beside every
            service is the noise that made the screen feel busy.
          */}
          {leg.cancelled ? <Pill tone="coral">{t('Cancelled')}</Pill> : null}
        </div>

        {/*
          The departure platform is this service's. The arrival platform is the fact of the place
          this leg ends at: on the last ride it is printed beside the arrival name below, and at an
          interchange it stays here, because the stop a traveller changes at is where they need it.
        */}
        <div className="row-wrap">
          <PlatformTag platform={leg.platform} label={t('Platform')} />
          {isLastRide ? null : <PlatformTag platform={leg.arrivalPlatform} label={t('Arrival platform')} />}
          {/* The operator is on the journey's summary and on the stop's own board; a chip per leg
              here only repeated the line's name in a third place. */}
          {/* The direction of travel is the arrow the leg's own times wear; the headsign beside it
              is the destination it points at. The bike pill next door already has its picture. */}
          {leg.headsign ? (
            <Pill tone="outline">
              <Icon name="arrowRight" size={12} />
              {/* The terminus the service is headed for is a station like any other: the words
                  keep their pill, and the name inside it is the way to its page. */}
              {t('Direction')} <StopLink stopId={leg.headsignStopId} label={leg.headsign} />
            </Pill>
          ) : null}
          {leg.bikeAllowed ? (
            <Pill tone="outline">
              <Icon name="bike" size={12} />
              {t('Bicycle allowed')}
            </Pill>
          ) : null}
        </div>

        {leg.intermediateStops?.length ? (
          <Disclosure
            title={t(
              leg.intermediateStops.length === 1 ? '{count} intermediate stop' : '{count} intermediate stops',
              { count: leg.intermediateStops.length },
            )}
            id={`leg-${leg.id}`}
          >
            <ol className="stack-2">
              {leg.intermediateStops.map((stop) => (
                <li key={stop.stopId} className="between">
                  {/* The stops passed through are places with pages too — this is the list a
                      traveller reads when they wonder whether a stop is the one they want. */}
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
            </ol>
          </Disclosure>
        ) : null}
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
        rows.push(
          <li key={`transfer-${leg.id}`} className="row-wrap" style={{ margin: '0 0 var(--s-2) var(--s-6)' }}>
            <Pill tone="butter">
              <Icon name="swap" size={13} />
              {transfer.sameStop
                ? t('Transfer · {duration} at {stop}', {
                    duration: format.duration(Math.max(1, transfer.wait)),
                    stop: stopLabel(previous.toStopId),
                  })
                : t('Transfer via walk to {stop}', { stop: stopLabel(leg.fromStopId) })}
            </Pill>
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
   * events rather than as somewhere to somewhere ("no clear end, there should be an arrival
   * thing, similar to the selected thing with a square instead of a circle", 2026-10-17t20-35-38).
   * The terminus is the traveller's own rule — a circle for a departure, a **square** for an
   * arrival — with the arrival stop named beside it and its time, so the rail finishes at a place
   * and not at a hyphen. Same 16px box as every other node, so the rail's width is unchanged.
   */
  const lastLeg = journey.legs[journey.legs.length - 1];
  const arrivalId = lastLeg.toStopId;
  /*
   * The connector into the arrival square is the last leg's mode, the same as the row above it,
   * so a journey with no service in it is one dashed line from the departure circle to the square.
   * It was solid whatever came above it, which left a walking-only plan dashed and then finished
   * with a solid stub under the square — a line that broke and resumed for no reason.
   */
  const endsOnFoot = lastLeg.mode === 'walk' || lastLeg.mode === 'bike';
  return (
    <ol className={`timeline${endsOnFoot ? ' timeline--dashed-end' : ''}`}>
      {rows}
      <li className="timeline__end">
        <span className="timeline__node timeline__node--end" />
        <span className="stack-1 grow">
          {/* The platform a traveller steps onto is the arrival end's own fact, so it sits beside
              the arrival name — not in the boarding service's chip row, 400px earlier. Only when the
              journey ends at the service itself: after a final walk, the platform belongs to the
              stop the walk left from, not to the door it reaches. */}
          <span className="row-wrap">
            <span className="timeline__station">
              {lastLeg.toLabel ?? <StopLink stopId={arrivalId} />}
            </span>
            {lastRide === lastLeg ? (
              <PlatformTag platform={lastLeg.arrivalPlatform} label={t('Arrival platform')} />
            ) : null}
          </span>
          <span className="t-sm t-muted">
            {t('Arrive {time}', { time: format.time(journey.arrival) })}
          </span>
        </span>
      </li>
    </ol>
  );
}
