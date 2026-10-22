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
import { Button, Card, EmptyState, IconButton } from '../components/ui/primitives';
import { PlanStopDialog } from '../components/stops/PlanStopDialog';
import { Icon, ModeIcon } from '../components/ui/Icons';
import { useFormat } from '../lib/useFormat';
import { usePageTitle } from '../lib/usePageTitle';
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
  } = useApp();
  const format = useFormat();
  const t = useT();
  const stop = getStop(stopId);
  usePageTitle(stop ? customStopName(stop.id) ?? stop.name : t('Unknown stop'));

  /*
   * **Every hook runs before the unknown-stop branch.**
   *
   * This page returned its fallback before `useMinuteNow`/`useMemo`/`useState` had run, so a hash
   * change from a real stop to an unknown one rendered fewer hooks than the previous render and
   * unmounted the app ("Rendered fewer hooks than expected", 5.1) — and back again threw the
   * mirror error. The guard is data, not control flow: the values below are computed for a stop
   * that may not exist, and the fallback is drawn after them.
   */
  const minutes = useMinuteNow();
  const nearby = useMemo(() => (stop ? nearbyStops(stop.id, 4) : []), [stop?.id]);
  const board = useMemo(
    () => (stop ? boardForStop(stop.id, { fromMinutes: minutes, limit: 6, tick: 0 }) : []),
    [stop?.id, minutes],
  );
  const alerts = stop ? disruptionsForStop(stop.id) : [];
  const lines = stop ? linesAtStop(stop.id) : [];
  /* The head's Plan button asks the same question the stop cards do (see `PlanStopDialog`). */
  const [planOpen, setPlanOpen] = useState(false);

  if (!stop) {
    return (
      <div className="stack-6">
        <PageHeader title={t('Unknown stop')} description={t('This stop is not in the network.')} showTitle />
        {/* The fallback is a page's answer, so it is a level below the H1 — it was an `h3` under
            an `h1` with no `h2` between them (5.1, 12.3). */}
        <EmptyState
          icon="station"
          headingLevel={2}
          title={t('Stop not found')}
          description={t('Pick a stop from the full list instead.')}
        >
          <Link to="/stops" className="btn btn--primary">
            <Icon name="station" size={16} />
            {t('All stations & stops')}
          </Link>
        </EmptyState>
      </div>
    );
  }

  const isFavourite = favouriteStopIds.includes(stop.id);
  const onBoard = boardStopIds.includes(stop.id);

  /*
   * One end, then the other. This used to reuse whatever search was in the session when there was
   * one — carrying its other end into the new query and landing on the results — which is the
   * "it auto-fills the from" in the round's report. `pick` opens the picker on the end that is
   * still missing, and the results are never reached without both ends being answered here (F28).
   */
  const planTo = (direction: 'from' | 'to') => {
    navigate(`/?${direction}=${stop.id}&pick=${direction === 'from' ? 'to' : 'from'}`);
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
        /* On a phone the name is drawn above the controls, so the head is one block at the
           margin instead of three buttons alone in a row (F18). Wide screens keep the trailing
           row they had. */
        mobileTitle
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
              {t('Plan')}
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

      {/*
        A nickname is the traveller's name for the place, not a replacement for what the place is
        called: the official name and stop code used to survive only as a 1×1 sr-only line, so a
        page headed "Work" never said which station it was (5.2).
      */}
      {customStopName(stop.id) ? (
        <p className="t-sm t-muted">
          {stop.name} · {stop.city} · {t('stop code {code}', { code: stop.code })}
        </p>
      ) : null}

      {/* `stop-columns`: at two columns the page used to be two fixed stacks, and the shorter one
          ended 792px above the longer at 1440 — a blank half-page under Alerts (5.4). A balanced
          flow fills both columns by height, and each card stays whole. */}
      <div className="grid-2 stop-columns" style={{ alignItems: 'start' }}>
        <div className="stack-4">
          <Card className="stack">
            <div className="between wrap">
              <h2 className="t-section">{t('Stop information')}</h2>
              <div className="row-wrap">
                {stop.modes.map((mode) => (
                  <span key={mode} className={`mode-badge mode-badge--${mode}`}>
                    <ModeIcon mode={mode} size={13} />
                    {t(modeLabel(mode))}
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
              <dt>{t('Type')}</dt>
              <dd>{t(stopTypeLabel(stop.type))}</dd>
              <dt>{t('City')}</dt>
              <dd>{stop.city}</dd>
              <dt>{t('Region')}</dt>
              <dd>{stop.region}</dd>
              <dt>{t('Platforms / stops')}</dt>
              <dd>{stop.platforms.join(', ')}</dd>
              <dt>{t('Facilities')}</dt>
              <dd>{stop.facilities.join(', ')}</dd>
              <dt>{t('Bicycle')}</dt>
              <dd>
                {stop.bikeParking ? t('Secure bicycle parking') : t('No bicycle parking listed')}
                {stop.ovFiets ? t(' · OV-fiets rental available') : ''}
              </dd>
              {/*
                The Accessibility row is deleted, by name: "get rid of ALL accesibility
                descriptions EVERYWHERE" (2026-10-17t20-49-20). Step-free, lift, tactile paving,
                staff assistance and low-floor boarding were five claims this page made about a
                traveller it does not know; the row is gone rather than restyled, and so is the
                claim in every other surface that drew one (the stop card's Step-free pill, the
                journey card's chip, each leg's Step-free pill, the transfer lines and the alert
                page's affected-stop meta). Hidden accessibility — `aria` names, roles, alt text —
                stays, because it is not a description on the page and removing it would break
                controls for a screen reader without changing anything visible.
              */}
            </dl>
          </Card>

          {hasBoard(stop) ? (
          <Card className="stack">
            <div className="stack-1">
              <h2 className="t-section">{t('Next departures')}</h2>
              <span className="t-sm t-muted">
                {t('Showing from {time} — the current time in this browser', { time: format.time(minutes) })}
              </span>
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
                {t('Open the full board')}
              </Link>
            </div>
            <BoardList departures={board} />
          </Card>
          ) : null}

          <Card className="stack">
            <h2 className="t-section">{t('Alerts at this stop')}</h2>
            {alerts.length === 0 ? (
              <p className="t-sm t-muted">{t('No alerts affect this stop right now.')}</p>
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
                    {/* Five links called "Details" told a screen reader nothing about which alert
                        each one opens (5.9). */}
                    <Link
                      to={`/disruptions/${alert.id}`}
                      className="btn btn--sm"
                      aria-label={t('Details of {alert}', { alert: alert.title })}
                    >
                      {t('Details')}
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
              <h2 className="t-section">{t('Position on the map')}</h2>
              <Link to={`/map?stop=${stop.id}`} className="btn btn--sm">
                <Icon name="map" size={15} />
                {t('Open map')}
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
              aria-label={t('Schematic local view of {stop} and the stops around it', { stop: stop.name })}
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
            <h2 className="t-section">{t('Lines calling here')}</h2>
            {/*
              The branch was on `lines.length === 0`, so the two served stations with no through
              service — Enschede and Eindhoven Strijp-S — were both described as walking landmarks
              (5.7). A station is a station: it says it has no lines right now, and only a landmark
              gets the landmark's sentence.
            */}
            {lines.length === 0 ? (
              <p className="t-sm t-muted">
                {stop.type === 'landmark'
                  ? t(
                      'This is a walking landmark: it is reached on foot from the nearest stop rather than by a service.',
                    )
                  : t('No service calls at this station right now.')}
              </p>
            ) : (
              <ul className="stack-2">
                {lines.map((line) => (
                  /*
                   * The whole row opens that line's own board, not just the chevron (F21): the
                   * stretch link covers the row, the `Alerts` pill sits above it, and the row
                   * lifts like every other interactive surface (F22 — it is no longer
                   * `list-row--static`).
                   */
                  <li key={line.id} className="list-row list-row--link">
                    <Link
                      to={`/departures?line=${line.id}&stop=${stop.id}`}
                      className="list-row__stretch"
                      aria-label={t('{line} departures at {stop}', { line: line.name, stop: stop.name })}
                    />
                    <span className="leg-row__marker">
                      <ModeIcon mode={line.mode} size={18} />
                    </span>
                    <span className="stack-1 grow">
                      <span className="t-strong t-sm">
                        {line.name}{' '}
                        <span className="t-faint">{t('· every {minutes} min', { minutes: line.headway })}</span>
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
                    {/* `xs`: the row is a link now, so this pill is the one labelled control in it and
                        the route text needs the width more than the word does. */}
                    <Link to={`/disruptions?line=${line.id}`} className="btn btn--xs btn--ghost list-row__control">
                      {t('Alerts')}
                    </Link>
                    <Icon name="chevronRight" size={16} className="list-row__chevron" />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="stack">
            <h2 className="t-section">{t('Nearby stops')}</h2>
            {nearby.length === 0 ? (
              <p className="t-sm t-muted">{t('No other stop is within walking distance.')}</p>
            ) : (
              <ul className="stack-2">
                {nearby.slice(0, 6).map((neighbour) => (
                  /* One target, the whole row (F21): a real link stretched over it, so keyboard,
                     middle-click and "open in new tab" keep working, and the chevron is the
                     affordance rather than the only hit area. */
                  <li key={neighbour.id} className="list-row list-row--link">
                    <Link
                      to={`/stops/${neighbour.id}`}
                      className="list-row__stretch"
                      aria-label={t('Open {stop}', { stop: neighbour.name })}
                    />
                    <span className="stack-1 grow">
                      <span className="t-strong t-sm">{neighbour.name}</span>
                      <span className="t-sm t-muted">
                        {t('{minutes} min walk', { minutes: walkMinutesBetween(stop, neighbour) })} ·{' '}
                        {neighbour.modes.filter((m) => m !== 'walk' && m !== 'bike').map((mode) => t(modeLabel(mode))).join(', ') ||
                          t('walking only')}
                      </span>
                    </span>
                    <Icon name="chevronRight" size={16} className="list-row__chevron" />
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
