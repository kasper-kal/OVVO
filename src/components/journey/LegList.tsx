import { Link } from 'react-router-dom';
import { getStop, stopLabel, nearbyStops } from '../../data/stops';
import { getLine } from '../../data/network';
import { operatorName } from '../../data/operators';
import { getDisruption } from '../../data/disruptions';
import { useFormat } from '../../lib/useFormat';
import { Disclosure, Pill } from '../ui/primitives';
import { Icon, ModeIcon } from '../ui/Icons';
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
  const metres = leg.distanceMetres ?? 0;
  return (
    <li className="timeline__rail timeline__rail--dashed">
      <span className="timeline__node timeline__node--muted" />
      <div className="leg-row">
        <span className="leg-row__marker">
          <ModeIcon mode={leg.mode} size={18} />
        </span>
        <div className="stack-1 grow">
          <div className="row-wrap">
            <span className="t-strong t-sm">
              {t(leg.mode === 'bike' ? 'Cycle' : 'Walk')} {format.duration(minutes)}
              {metres ? ` · ${metres} m` : ''}
            </span>
            <Pill tone="outline">{format.time(leg.departure)} – {format.time(leg.arrival)}</Pill>
          </div>
          <p className="t-sm t-muted">
            {stopLabel(leg.fromStopId)} <Icon name="arrowRight" size={13} /> {stopLabel(leg.toStopId)}
          </p>
          {leg.message ? <p className="t-sm t-faint">{leg.message}</p> : null}
        </div>
      </div>
    </li>
  );
}

function RideLegRow({ leg }: { leg: Leg }) {
  const format = useFormat();
  const t = useT();
  const line = getLine(leg.lineId);
  const from = getStop(leg.fromStopId);
  const to = getStop(leg.toStopId);
  const disruption = getDisruption(leg.disruptionId);
  return (
    <li className={`timeline__rail${leg.cancelled ? ' font-bold' : ''}`}>
      <span className="timeline__node timeline__node--accent" />
      <div className="leg-row">
        <span className="leg-row__marker">
          <ModeIcon mode={leg.mode} size={18} />
        </span>
        <div className="stack-2 grow">
          <div className="row-wrap">
            <span className={`mode-badge mode-badge--${leg.mode}`}>
              <ModeIcon mode={leg.mode} size={13} />
              {leg.lineName ?? line?.name ?? t('Service')}
            </span>
            <span className="leg-row__time">
              {format.time(leg.departure)} <Icon name="arrowRight" size={13} /> {format.time(leg.arrival)}
            </span>
            <Pill>{format.duration(leg.arrival - leg.departure)}</Pill>
            {leg.delayMinutes ? (
              <Pill tone="coral" dot dotTone="coral">
                {t('Delay +{minutes} min', { minutes: leg.delayMinutes })}
              </Pill>
            ) : (
              <Pill tone="sage">{t('On time')}</Pill>
            )}
            {leg.cancelled ? <Pill tone="coral">{t('Cancelled')}</Pill> : null}
          </div>

          <div className="stack-1">
            <p className="t-sm">
              <span className="t-strong">{t('From')}</span> {stopLabel(leg.fromStopId)}{' '}
              {from ? <span className="t-faint">· {from.code}</span> : null}
            </p>
            <p className="t-sm">
              <span className="t-strong">{t('To')}</span> {stopLabel(leg.toStopId)}{' '}
              {to ? <span className="t-faint">· {to.code}</span> : null}
            </p>
          </div>

          <div className="row-wrap">
            <PlatformTag platform={leg.platform} label={t('Platform')} />
            <PlatformTag platform={leg.arrivalPlatform} label={t('Arrival platform')} />
            <Pill>{operatorName(leg.operatorId)}</Pill>
            {leg.headsign ? <Pill tone="outline">{t('Direction {headsign}', { headsign: leg.headsign })}</Pill> : null}
            {leg.bikeAllowed ? (
              <Pill tone="outline">
                <Icon name="bike" size={12} />
                {t('Bicycle allowed')}
              </Pill>
            ) : null}
          </div>

          {disruption ? (
            <Link to={`/disruptions/${disruption.id}`} className="pill pill--outline">
              <Icon name="alert" size={13} />
              {disruption.title}
            </Link>
          ) : null}

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
                    <span className="t-sm">{stopLabel(stop.stopId)}</span>
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
          ) : (
            <p className="t-sm t-faint">{t('No intermediate stops on this service.')}</p>
          )}
        </div>
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
        <RideLegRow key={leg.id} leg={leg} />
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
  const arrivalId = journey.legs[journey.legs.length - 1].toStopId;
  return (
    <ol className="timeline">
      {rows}
      <li className="timeline__end">
        <span className="timeline__node timeline__node--end" />
        <span className="stack-1 grow">
          <span className="t-strong t-sm">{stopLabel(arrivalId)}</span>
          <span className="t-sm t-muted">
            {t('Arrive {time}', { time: format.time(journey.arrival) })}
          </span>
        </span>
      </li>
    </ol>
  );
}
