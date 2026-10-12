import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../state/AppState';
import { getStop } from '../../data/stops';
import { getLine } from '../../data/network';
import { operatorName } from '../../data/operators';
import { useFormat } from '../../lib/useFormat';
import { EmptyState, IconButton, Pill } from '../ui/primitives';
import { Icon, ModeIcon } from '../ui/Icons';
import type { Departure } from '../../data/types';

/**
 * [OCR Visual Transcode - Departure Board Row]
 * ROW: L1 #F3F1EA fill, 1px #E8E6DF, R12 | LINE_BADGE: capsule, min 44x44 target
 * PLANNED: #6F6F75 | DELAYED: #8F3423 | CANCELLED_ROW: #FFE8E5
 */
export function DepartureTable({
  departures,
  onSelectStop,
  emptyHint,
}: {
  departures: Departure[];
  onSelectStop?: (stopId: string) => void;
  emptyHint?: string;
}) {
  const format = useFormat();
  const navigate = useNavigate();
  const { search, startSearch, preferences, pushToast } = useApp();

  if (departures.length === 0) {
    return (
      <EmptyState
        icon="board"
        title="No departures match these filters"
        description={emptyHint ?? 'Loosen the filters above to see the simulated departures for this stop again.'}
      />
    );
  }

  return (
    <div className="board-scroll">
      <table className="board">
        <caption className="sr-only">Simulated departure times</caption>
        <thead>
          <tr>
            <th scope="col">Service</th>
            <th scope="col">Destination</th>
            <th scope="col">Planned</th>
            <th scope="col">Expected</th>
            <th scope="col">Platform</th>
            <th scope="col">Status</th>
            <th scope="col" style={{ textAlign: 'right' }}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {departures.map((departure) => {
            const line = getLine(departure.lineId);
            return (
              <tr key={departure.id} data-state={departure.cancelled ? 'cancelled' : undefined}>
                <td>
                  <span className={`mode-badge mode-badge--${departure.mode}`}>
                    <ModeIcon mode={departure.mode} size={13} />
                    {departure.lineNumber}
                  </span>
                  <span className="t-sm t-faint" style={{ marginLeft: 'var(--s-2)' }}>
                    {line?.name}
                  </span>
                </td>
                <td>
                  <div className="stack-1">
                    <span className="t-strong t-sm">{departure.destinationLabel}</span>
                    <span className="t-sm t-faint">
                      {operatorName(departure.operatorId)} · {getStop(departure.stopId)?.city ?? 'Unknown stop'}
                    </span>
                  </div>
                </td>
                <td className="t-mono-num">{format.time(departure.planned)}</td>
                <td className="t-mono-num">
                  {departure.delayMinutes ? (
                    <span className="row">
                      <span className="strike">{format.time(departure.planned)}</span>
                      <span className="delay">{format.time(departure.expected)}</span>
                    </span>
                  ) : (
                    format.time(departure.expected)
                  )}
                </td>
                <td>{departure.platform}</td>
                <td>
                  {departure.cancelled ? (
                    <Pill tone="coral">Cancelled (simulated)</Pill>
                  ) : departure.delayMinutes ? (
                    <Pill tone="coral" dot dotTone="coral">
                      Example delay +{departure.delayMinutes} min
                    </Pill>
                  ) : (
                    <Pill tone="sage">On time (simulated)</Pill>
                  )}
                  {departure.accessible ? (
                    <span className="t-sm t-muted row" style={{ marginTop: 'var(--s-1)' }}>
                      <Icon name="accessibility" size={13} />
                      accessible
                    </span>
                  ) : null}
                </td>
                <td>
                  <div className="board__row-action">
                    {departure.disruptionId ? (
                      <Link
                        className="btn btn--sm btn--ghost"
                        to={`/disruptions/${departure.disruptionId}`}
                        aria-label={`Open the simulated alert for service ${departure.lineNumber}`}
                      >
                        <Icon name="alert" size={15} />
                        Alert
                      </Link>
                    ) : null}
                    <IconButton
                      icon="route"
                      label={`Plan a journey to ${departure.destinationLabel}`}
                      variant="surface"
                      onClick={() => {
                        const destination = departure.destinationStopId;
                        if (search) {
                          startSearch({ ...search.query, toStopId: destination, preferences });
                          pushToast(`Planning a journey to ${departure.destinationLabel} (simulated)`, 'success');
                        } else {
                          startSearch({
                            fromStopId: departure.stopId,
                            toStopId: destination,
                            date: new Date().toISOString().slice(0, 10),
                            time: Math.floor(departure.planned / 5) * 5,
                            timeMode: 'depart',
                            preferences,
                          });
                          pushToast(`Planning a journey to ${departure.destinationLabel} (simulated)`, 'success');
                        }
                        navigate('/results');
                      }}
                    />
                    <IconButton
                      icon="station"
                      label="Open the destination stop page"
                      variant="surface"
                      onClick={() => onSelectStop?.(departure.destinationStopId)}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
