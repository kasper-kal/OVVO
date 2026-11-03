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

function PlatformTag({ platform, label }: { platform?: string; label: string }) {
  if (!platform) return null;
  return (
    <Pill>
      {/* A platform, not the board: `board` is the departure screen's monitor and a control
          that opens it. */}
      <Icon name="platform" size={12} />
      {label} {platform}
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
  /*
   * **The stops on this service open in a sheet of their own.** They used to unfold inside the
   * leg, which pushed every service below them down the rail and turned the journey into an
   * accordion; 9292 keeps the journey the same height and opens the stops over it, so a traveller
   * can see where they are between two stations without losing the line they are reading. The
   * disclosure also meant the list was invisible until someone guessed it was there.
   */
  const [stopsOpen, setStopsOpen] = useState(false);
  const stops = leg.intermediateStops ?? [];
  const serviceName = leg.lineName ?? line?.name ?? t('Service');
  return (
    <li className={`timeline__rail timeline__rail--ride${leg.cancelled ? ' font-bold' : ''}`}>
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
          {/*
            No duration pill beside the times. "05:00 → 05:26" already says how long the ride is,
            and the same length was printed a third time in the summary card; 9292's own journey
            screen prints the times and nothing else here.
          */}
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
          {/*
            The bicycle is a fact about the whole journey, and the summary card says it once. Said
            again on every leg it was three more pills down the rail for one answer.
          */}
        </div>

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
          with its time and platform, and where you get off. The two ends of the *ride* carry the
          two words that answer "how far am I", so a glance at the list says which end of it you
          are travelling.
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
