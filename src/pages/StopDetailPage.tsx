import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../state/AppState';
import { PageHeader } from '../components/layout/AppShell';
import { BoardList } from '../components/stops/BoardList';
import {
  customStopName,
  getStop,
  hasBoard,
  nearbyStops,
  stopLabel,
  walkMinutesBetween,
} from '../data/stops';
import { getLine, linesAtStop } from '../data/network';
import { operatorName } from '../data/operators';
import { disruptionsForStop } from '../data/disruptions';
import { boardForStop } from '../data/departures';
import { useMinuteNow } from '../lib/useMinuteNow';
import { Button, Card, EmptyState, IconButton, Pill } from '../components/ui/primitives';
import { PlanStopDialog } from '../components/stops/PlanStopDialog';
import { Icon, ModeIcon } from '../components/ui/Icons';
import { useFormat } from '../lib/useFormat';
import { useT } from '../lib/useT';
import { stopTypeLabel } from '../lib/format';
import { modeLabel } from '../data/preferences';

export function StopDetailPage() {
  const { stopId } = useParams();
  const navigate = useNavigate();
  const {
    favouriteStopIds,
    toggleFavourite,
    boardStopIds,
    toggleBoardStop,
    search,
    startSearch,
    preferences,
  } = useApp();
  const format = useFormat();
  const t = useT();
  const stop = getStop(stopId);

  if (!stop) {
    return (
      <div className="stack-6">
        <PageHeader title="Unknown stop" description="This stop is not in the network." />
        <EmptyState icon="station" title="Stop not found" description="Pick a stop from the full list instead.">
          <Link to="/stops" className="btn btn--primary">
            <Icon name="station" size={16} />
            All stations & stops
          </Link>
        </EmptyState>
      </div>
    );
  }

  const isFavourite = favouriteStopIds.includes(stop.id);
  const onBoard = boardStopIds.includes(stop.id);
  const lines = linesAtStop(stop.id);
  /*
   * The minute the browser is actually in, re-read on the minute (see `useMinuteNow`). It used to
   * be `nowMinutes() - 1`, which put the board and the "showing from" line one minute behind the
   * clock — the defect reported as "the website often has the time wrong".
   */
  const minutes = useMinuteNow();
  const board = boardForStop(stop.id, { fromMinutes: minutes, limit: 6, tick: 0 });
  const alerts = disruptionsForStop(stop.id);
  const nearby = useMemo(() => nearbyStops(stop.id, 4), [stop.id]);
  /* The head's Plan button asks the same question the stop cards do (see `PlanStopDialog`). */
  const [planOpen, setPlanOpen] = useState(false);

  const planTo = (direction: 'from' | 'to') => {
    if (!search) {
      /*
       * Nothing planned yet, so there is no other end to attach this to — the same answer the
       * stop cards give: open the planner with this stop in the row that was chosen. No toast,
       * because the planner's filled row is the message.
       */
      navigate(`/?${direction === 'from' ? 'from' : 'to'}=${stop.id}`);
      return;
    }
    startSearch({ ...search.query, ...(direction === 'from' ? { fromStopId: stop.id } : { toStopId: stop.id }), preferences });
    navigate('/results');
  };

  return (
    <div className="stack-6">
      <PageHeader
        /*
         * The traveller's name for this stop when they gave it one, with the official name kept
         * in the description beneath — a page that says only "Work" cannot be checked against a
         * timetable, and a page that says only "Herengracht 12" is not the name they chose.
         */
        title={customStopName(stop.id) ?? stop.name}
        description={`${customStopName(stop.id) ? `${stop.name} · ` : ''}${stop.city} · ${stop.region} · stop code ${stop.code}`}
        actions={
          <>
            {/*
              Two controls, two different questions — this page is the one place both are offered,
              so their names say which is which (the glyphs alone are a heart and a pin, which is
              the whole point of the split):

                - the **heart** is a favourite — "I use this place", which leads the stop lists
                  and the search results;
                - the **pin** puts this stop's board on the departure screen.

              Both are trailing, after Plan, in the row that names the stop: `actions` is the
              head's trailing group, so being last in it is being trailing (the audit measured
              this control on the left before).
            */}
            <Button size="sm" icon="route" onClick={() => setPlanOpen(true)}>
              Plan
            </Button>
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
              onClick={() => toggleFavourite(stop.id)}
            />
            <IconButton
              icon="pin"
              label={t(
                onBoard
                  ? 'Unpin {stop} from the departure board'
                  : 'Pin {stop} to the departure board',
                { stop: customStopName(stop.id) ?? stop.name },
              )}
              active={onBoard}
              className="glyph-toggle"
              onClick={() => toggleBoardStop(stop.id)}
            />
          </>
        }
      />

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div className="stack-4">
          <Card className="stack">
            <div className="between wrap">
              <h2 className="t-section">Stop information</h2>
              <div className="row-wrap">
                {stop.modes.map((mode) => (
                  <span key={mode} className={`mode-badge mode-badge--${mode}`}>
                    <ModeIcon mode={mode} size={13} />
                    {modeLabel(mode)}
                  </span>
                ))}
              </div>
            </div>
            {/*
              The one sentence that says what the two glyphs in the head do, on the page that
              offers both. A heart is a favourite (a place you use — it leads your lists); a pin
              is a promise to the departures screen (its board is on that page). Neither is the
              other, so neither is described as the other.
            */}
            <p className="t-sm t-faint">
              <Icon name="heart" size={13} /> {t('Favourite stops lead your stop lists.')}{' '}
              <Icon name="pin" size={13} />
              {t('Pinned stops have their board on the departure board page.')}
            </p>
            <dl className="dl">
              <dt>Type</dt>
              <dd>{stopTypeLabel(stop.type)}</dd>
              <dt>City</dt>
              <dd>{stop.city}</dd>
              <dt>Region</dt>
              <dd>{stop.region}</dd>
              <dt>Platforms / stops</dt>
              <dd>{stop.platforms.join(', ')}</dd>
              <dt>Facilities</dt>
              <dd>{stop.facilities.join(', ')}</dd>
              <dt>Bicycle</dt>
              <dd>
                {stop.bikeParking ? 'Secure bicycle parking' : 'No bicycle parking listed'}
                {stop.ovFiets ? ' · OV-fiets rental available' : ''}
              </dd>
              {/*
                Accessibility is a row of this table, not a second block of its own: it is one
                more fact about the place, and it is a fact about *boarding*, so a walking
                landmark does not claim it at all — "step-free, lift available" says nothing
                about a museum entrance (see `hasBoard` in `data/stops`).
              */}
              {hasBoard(stop) ? (
                <>
                  <dt>Accessibility</dt>
                  <dd className="row-wrap">
                    <Pill tone={stop.accessibility.stepFree ? 'sage' : 'coral'}>
                      {stop.accessibility.stepFree ? 'Step-free access' : 'Stairs only'}
                    </Pill>
                    <Pill tone={stop.accessibility.lift ? 'sage' : 'outline'}>
                      {stop.accessibility.lift ? 'Lift' : 'No lift'}
                    </Pill>
                    <Pill tone={stop.accessibility.tactilePaving ? 'sage' : 'outline'}>
                      {stop.accessibility.tactilePaving ? 'Tactile paving' : 'No tactile paving'}
                    </Pill>
                    <Pill tone={stop.accessibility.assistance ? 'sage' : 'outline'}>
                      {stop.accessibility.assistance ? 'Staff assistance' : 'No staff assistance'}
                    </Pill>
                    <Pill tone={stop.accessibility.lowFloorBoarding ? 'sage' : 'outline'}>
                      {stop.accessibility.lowFloorBoarding ? 'Low-floor boarding' : 'Not low-floor'}
                    </Pill>
                  </dd>
                </>
              ) : null}
            </dl>
          </Card>

          {hasBoard(stop) ? (
          <Card className="stack">
            <div className="stack-1">
              <h2 className="t-section">Next departures</h2>
              <span className="t-sm t-muted">Showing from {format.time(minutes)} — the current time in this browser</span>
            </div>
            {/*
              The way **on** from this card, at the start of its own line under the line that names
              the board — not in the trailing group `.card-actions` builds for the controls that
              belong at the card's right edge (the keep-a-stop pin, a dismiss). A link that is the
              next step reads as an action of the card, and it was reported as being on the wrong
              side of one; it is the same words and the same glyph the home widget's copy of this
              control uses.
            */}
            <div className="row-wrap">
              <Link to={`/departures?stop=${stop.id}`} className="btn btn--sm">
                <Icon name="board" size={15} />
                Open the full board
              </Link>
            </div>
            <BoardList departures={board} limit={5} />
          </Card>
          ) : null}

          <Card className="stack">
            <h2 className="t-section">Alerts at this stop</h2>
            {alerts.length === 0 ? (
              <p className="t-sm t-muted">No alerts affect this stop right now.</p>
            ) : (
              <ul className="stack-2">
                {alerts.map((alert) => (
                  <li key={alert.id} className="list-row list-row--static">
                    <span className="leg-row__marker">
                      <Icon name="alert" size={18} />
                    </span>
                    <span className="stack-1 grow">
                      <span className="t-strong t-sm">{alert.title}</span>
                      <span className="t-sm t-muted t-clamp-2">{alert.description}</span>
                    </span>
                    <Link to={`/disruptions/${alert.id}`} className="btn btn--sm">
                      Details
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="stack-4">
          <Card className="stack">
            <div className="between">
              <h2 className="t-section">Position on the map</h2>
              <Link to={`/map?stop=${stop.id}`} className="btn btn--sm">
                <Icon name="map" size={15} />
                Open map
              </Link>
            </div>
            {/*
              Same 100-unit canvas and stop radius as the map module so the local
              view is drawn at the intended scale, and labels flip to the left of a
              stop when they would otherwise run off the canvas.
            */}
            <svg
              className="map-canvas"
              viewBox="0 0 100 100"
              role="img"
              aria-label={`Schematic local view of ${stop.name} and the stops around it`}
            >
              <rect x="0" y="0" width="100" height="100" className="map-water" />
              <path className="map-land" d="M5 5 L95 3 L95 95 L5 95 Z" />
              {nearby.slice(0, 5).map((neighbour) => {
                const nx = 50 + (neighbour.coordinates.x - stop.coordinates.x) * 5.5;
                const ny = 50 + (neighbour.coordinates.y - stop.coordinates.y) * 5.5;
                const anchorEnd = nx < 50;
                return (
                  <g key={neighbour.id}>
                    <line className="map-route--walk" x1={50} y1={50} x2={nx} y2={ny} />
                    <g
                      className="map-stop"
                      transform={`translate(${nx} ${ny})`}
                      onClick={() => navigate(`/stops/${neighbour.id}`)}
                    >
                      <circle r={1.2} />
                      <text x={anchorEnd ? -3 : 3} y={0.8} textAnchor={anchorEnd ? 'end' : 'start'}>
                        {neighbour.name.replace(`${neighbour.city}, `, '')}
                      </text>
                    </g>
                  </g>
                );
              })}
              <g className="map-stop map-stop--selected" transform="translate(50 50)">
                <circle r={1.9} />
                <text x={4} y={0.8}>
                  {customStopName(stop.id) ?? stop.name.replace(`${stop.city}, `, '')}
                </text>
              </g>
            </svg>
          </Card>

          <Card className="stack">
            <h2 className="t-section">Lines calling here</h2>
            {lines.length === 0 ? (
              <p className="t-sm t-muted">
                This is a walking landmark: it is reached on foot from the nearest stop rather than by a service.
              </p>
            ) : (
              <ul className="stack-2">
                {lines.map((line) => (
                  <li key={line.id} className="list-row list-row--static">
                    <span className="leg-row__marker">
                      <ModeIcon mode={line.mode} size={18} />
                    </span>
                    <span className="stack-1 grow">
                      <span className="t-strong t-sm">
                        {line.name} <span className="t-faint">· every {line.headway} min</span>
                      </span>
                      <span className="t-sm t-muted">
                        {operatorName(line.operatorId)} ·{' '}
                        {getLine(line.id)?.stops
                          .slice(0, 1)
                          .map((id) => stopLabel(id))
                          .join('')}{' '}
                        <Icon name="arrowRight" size={12} />{' '}
                        {stopLabel(getLine(line.id)?.stops[getLine(line.id)!.stops.length - 1])}
                      </span>
                    </span>
                    <Link to={`/disruptions?line=${line.id}`} className="btn btn--sm btn--ghost">
                      Alerts
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="stack">
            <h2 className="t-section">Nearby stops</h2>
            {nearby.length === 0 ? (
              <p className="t-sm t-muted">No other stop is within walking distance.</p>
            ) : (
              <ul className="stack-2">
                {nearby.slice(0, 6).map((neighbour) => (
                  <li key={neighbour.id} className="list-row list-row--static">
                    <span className="stack-1 grow">
                      <Link to={`/stops/${neighbour.id}`} className="t-strong t-sm tap-target">
                        {neighbour.name}
                      </Link>
                      <span className="t-sm t-muted">
                        {walkMinutesBetween(stop, neighbour)} min walk · {neighbour.modes.filter((m) => m !== 'walk' && m !== 'bike').join(', ') || 'walking only'}
                      </span>
                    </span>
                    <IconButton icon="chevronRight" label={`Open ${neighbour.name}`} onClick={() => navigate(`/stops/${neighbour.id}`)} />
                  </li>
                ))}
              </ul>
            )}
          </Card>

        </div>
      </div>

      {/*
        The head's one Plan button, asking the two-choice question the stop cards ask. What
        used to sit here — a pair of PLAN FROM HERE / PLAN TO HERE buttons at the head, and a
        Shortcuts panel repeating them lower down — was the same two actions, three times.
      */}
      <PlanStopDialog
        stop={planOpen ? stop : null}
        onClose={() => setPlanOpen(false)}
        onPlan={(direction) => {
          planTo(direction);
          setPlanOpen(false);
        }}
      />
    </div>
  );
}
