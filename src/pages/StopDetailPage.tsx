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
import { WikipediaCard } from '../components/stops/WikipediaCard';
import { facilityIcon, Icon, ModeIcon } from '../components/ui/Icons';
import { useFormat } from '../lib/useFormat';
import { usePageTitle } from '../lib/usePageTitle';
import { useT } from '../lib/useT';
import { alertWords } from '../lib/disruptionText';
import { modeLabel } from '../data/preferences';

export function StopDetailPage() {
  const { stopId } = useParams();
  const navigate = useNavigate();
  const { favouriteStopIds, toggleFavourite } = useApp();
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
  /*
   * The card shows **six** departures — the next six things that leave from here — and exactly
   * six: the board is generated at that length and the list is given the same number as its cap,
   * so there is nothing left over to promise and no "show more" row to press. The full timetable
   * is one press away through "Open the full board" above the rows.
   */
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

  /*
   * One end, then the other. This used to reuse whatever search was in the session when there was
   * one — carrying its other end into the new query and landing on the results — which is the
   * "it auto-fills the from" in the round's report. `pick` opens the picker on the end that is
   * still missing, and the results are never reached without both ends being answered here (F28).
   */
  const planTo = (direction: 'from' | 'to') => {
    navigate(`/?${direction}=${stop.id}&pick=${direction === 'from' ? 'to' : 'from'}`);
  };

  /*
   * **The local map, worked out before it is drawn.**
   *
   * The drawing is the app's own 0–100 canvas, zoomed 5.5× around this stop so it reaches the
   * stops next door rather than the whole country — the zoom this card always used for its dots.
   *
   * What it draws now is **one arm per line that calls here**, from this stop to the next stop on
   * that line, in the line's own mode colour. Drawing each line's *whole* run — which is what the
   * first version of this card did — turned the canvas into a starburst of corridors crossing each
   * other with every name printed over its neighbour's; an arm is the one fact a map of a station
   * has to answer — which way do I leave from here, and what is the next stop doing it.
   *
   * An arm per *stop*, not per line: four services that all head for Amsterdam Amstel leave in the
   * same direction, and four lines drawn on top of each other is one line drawn four times.
   */
  const LOCAL_SCALE = 5.5;
  const toLocal = (point: { x: number; y: number }) => ({
    x: 50 + (point.x - stop.coordinates.x) * LOCAL_SCALE,
    y: 50 + (point.y - stop.coordinates.y) * LOCAL_SCALE,
  });

  /*
   * An arm whose next stop is further away than the frame reaches is drawn **to the edge** and
   * given neither dot nor name: the line leaving the picture is the honest drawing of "this way,
   * and on out of sight", while a dot parked on the border would read as a stop on the border.
   */
  const clipToFrame = (point: { x: number; y: number }) => {
    const dx = point.x - 50;
    const dy = point.y - 50;
    const limits: number[] = [];
    if (dx > 0) limits.push(46 / dx);
    else if (dx < 0) limits.push(-46 / dx);
    if (dy > 0) limits.push(46 / dy);
    else if (dy < 0) limits.push(-46 / dy);
    const t = Math.min(...limits);
    return t >= 1 ? { ...point, inside: true } : { x: 50 + dx * t, y: 50 + dy * t, inside: false };
  };

  const arms = new Map<
    string,
    {
      place: NonNullable<ReturnType<typeof getStop>>;
      point: { x: number; y: number; inside: boolean };
      modes: string[];
    }
  >();
  for (const line of lines) {
    const index = line.stops.indexOf(stop.id);
    if (index < 0) continue;
    for (const neighbourId of [line.stops[index - 1], line.stops[index + 1]]) {
      const place = getStop(neighbourId);
      if (!place) continue;
      const arm = arms.get(place.id) ?? { place, point: clipToFrame(toLocal(place.coordinates)), modes: [] };
      if (!arm.modes.includes(line.mode)) arm.modes.push(line.mode);
      arms.set(place.id, arm);
    }
  }

  /*
   * A station with no service — two of them in this network — would otherwise draw an empty sea
   * and a dot. For those the card falls back to what it used to show: the stops within walking
   * distance, joined by the walk dashes, so the card is never a blank map.
   */
  const hasLines = arms.size > 0;
  if (!hasLines) {
    for (const neighbour of nearby) {
      arms.set(neighbour.id, {
        place: neighbour,
        point: clipToFrame(toLocal(neighbour.coordinates)),
        modes: ['walk'],
      });
    }
  }

  /*
   * Which arms get a name. The nearest first, in a box the size the name will actually paint, and
   * a name that would land on one already placed is left off — an unlabelled dot is read as "a
   * stop", and two names printed on top of each other are read as neither.
   */
  const nameWidth = (text: string) => text.length * 1.7;
  const stationName = customStopName(stop.id) ?? stop.name.replace(`${stop.city}, `, '');
  const placedBoxes: { left: number; right: number; top: number; bottom: number }[] = [
    { left: 54, right: 54 + nameWidth(stationName), top: 47, bottom: 53 },
  ];
  const overlaps = (a: typeof placedBoxes[number], b: typeof placedBoxes[number]) =>
    a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
  const labelledArms = [...arms.values()]
    .filter((arm) => arm.point.inside)
    .sort((a, b) => Math.hypot(a.point.x - 50, a.point.y - 50) - Math.hypot(b.point.x - 50, b.point.y - 50))
    .filter((arm) => {
      const label = arm.place.name.replace(`${arm.place.city}, `, '');
      const left = arm.point.x >= 50 ? arm.point.x + 3 : arm.point.x - 3 - nameWidth(label);
      const box = { left, right: left + nameWidth(label), top: arm.point.y - 2.2, bottom: arm.point.y + 2.2 };
      if (box.left < 1 || box.right > 99) return false;
      if (placedBoxes.some((other) => overlaps(box, other))) return false;
      placedBoxes.push(box);
      return true;
    });

  /*
   * **The card keeps two facts, and they are the two a traveller cannot see elsewhere.**
   *
   * It used to print six rows and a two-sentence legend about what the heart and the pin in the
   * head do — Type, City, Region, Platforms, Facilities and Bicycle, most of them repeating the
   * badges above or the line under the page's name, and the legend teaching glyphs that are
   * already labelled for a screen reader. It read as a form.
   *
   * What is left is the number you need before you walk in (which platform) and the list you need
   * once you are there. City, region and stop code stay, as one quiet line: the page head's own
   * description is `sr-only` everywhere (see `PageHeader`), so dropping the City and Region rows
   * would have taken that line off the screen entirely.
   *
   * Platforms are printed as a range when they run 1–10 rather than as ten numbers with commas,
   * and the bicycle facts are folded into the facilities where they belong: "Bicycle parking" was
   * already in that list, so the row that repeated it only added a second place to read it.
   *
   * The facilities themselves are badges with glyphs rather than a dotted sentence — see the list
   * below — and each word is translated in `lib/i18n`, which the joined line never was.
   */
  const platformNumbers = stop.platforms.map((value) => Number(value));
  const runsInOrder = platformNumbers.every(
    (value, index) => Number.isInteger(value) && (index === 0 || value === platformNumbers[index - 1] + 1),
  );
  const platformLabel =
    stop.platforms.length > 1 && runsInOrder
      ? `${stop.platforms[0]}–${stop.platforms[stop.platforms.length - 1]}`
      : stop.platforms.join(' · ');

  const facilities = [...stop.facilities];
  if (stop.bikeParking && !facilities.includes('Bicycle parking')) facilities.push('Bicycle parking');
  if (stop.ovFiets) facilities.push('OV-fiets');

  return (
    <div className="stack-6">
      <PageHeader
        /*
         * The traveller's name for this stop when they gave it one, with the official name kept
         * in the description beneath — a page that says only "Work" cannot be checked against a
         * timetable, and a page that says only "Herengracht 12" is not the name they chose.
         */
        title={customStopName(stop.id) ?? stop.name}
        description={`${customStopName(stop.id) ? `${stop.name} · ` : ''}${stop.city} · ${stop.region} · ${t('stop code {code}', { code: stop.code })}`}
        /* On a phone the name is drawn above the controls, so the head is one block at the
           margin instead of three buttons alone in a row (F18). Wide screens keep the trailing
           row they had. */
        mobileTitle
        actions={
          <>
            {/*
              **The heart is the only keep-control on this page.** Marking a place is a favourite —
              "I use this place", which leads the stop lists and the search results — and it is
              trailing, after Plan, in the row that names the stop.

              The **pin** that used to sit beside it is gone: putting a stop's board on the
              departure screen is done on that screen and nowhere else (reported: "there shouldnt be
              a pin button ANYWHERE except the Departure boards tab"). A stop page is a place to
              read a timetable and plan from, not a second place to manage boards.
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
            {/* The only place on the page where the city, the region and the stop code are
                written out: the head's description is for screen readers alone. */}
            <p className="t-sm t-faint">
              {stop.city} · {stop.region} · {t('stop code {code}', { code: stop.code })}
            </p>
            <dl className="dl dl--inline">
              <dt>{t('Platforms')}</dt>
              <dd>{platformLabel}</dd>
            </dl>
            {/*
              **Every facility is a badge with its own glyph.**

              It used to be one line of words joined by dots — "Toilets · Kiosk · Bicycle parking ·
              Lift · Ticket machine · Taxi rank" — which is a list you read word by word to find
              the one thing you came for. As badges, "is there a lift" is a shape to spot. The
              glyph is drawn `aria-hidden` (see `Icon`), so a screen reader still hears the same
              words in the same order it heard before.

              It is a block of its own rather than the second row of the definition list above, and
              that is a measurement, not a preference: a value wide enough to span both columns of
              `.dl` hands its width back to the label column, so "Platforms" pushed its number
              300px away and the row read as two unrelated things at opposite edges of the card.
              Laid out under its own label, the badge row gets the card's whole width.

              The platforms row is one line for the same reason (`dl--inline`): a two-column grid
              whose first track is `minmax(96px, auto)` will stretch that track whenever some wide
              value is placed in it, and this card has had one. A flex row has no track to stretch,
              so the number stays a fixed `--s-2` from its word at every width.
            */}
            <div className="stack-2">
              <p className="t-sm t-muted">{t('Facilities')}</p>
              <ul className="facility-list">
                {facilities.map((facility) => {
                  const glyph = facilityIcon(facility);
                  return (
                    <li key={facility} className="facility-badge">
                      {glyph ? <Icon name={glyph} size={13} /> : null}
                      {t(facility)}
                    </li>
                  );
                })}
              </ul>
            </div>
          </Card>

          {hasBoard(stop) ? (
          <Card className="stack">
            <div className="stack-1">
              <h2 className="t-section">{t('Next departures')}</h2>
              <span className="t-sm t-muted">
                {t('Showing from {time}, the current time in this browser', { time: format.time(minutes) })}
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
            <BoardList departures={board} limit={6} />
          </Card>
          ) : null}

          <Card className="stack">
            <h2 className="t-section">{t('Alerts at this stop')}</h2>
            {alerts.length === 0 ? (
              <p className="t-sm t-muted">{t('No alerts affect this stop right now.')}</p>
            ) : (
              <ul className="stack-2">
                {alerts.map((alert) => {
                  /* The alert's own words in the page's language (`lib/disruptionText`). */
                  const words = alertWords(t, alert);
                  return (
                  <li key={alert.id} className="list-row list-row--static">
                    <span className="leg-row__marker">
                      <Icon name="alert" size={18} />
                    </span>
                    <span className="stack-1 grow">
                      <span className="t-strong t-sm">{words.title}</span>
                      <span className="t-sm t-muted t-clamp-2">{words.description}</span>
                    </span>
                    {/* Five links called "Details" told a screen reader nothing about which alert
                        each one opens (5.9). */}
                    <Link
                      to={`/disruptions/${alert.id}`}
                      className="btn btn--sm"
                      aria-label={t('Details of {alert}', { alert: words.title })}
                    >
                      {t('Details')}
                    </Link>
                  </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        <div className="stack-4">
          {/* No arms and nothing within walking distance is an empty plate: the card is not drawn
              rather than drawn as a sea with one dot in it. */}
          {arms.size ? (
          <Card className="stack">
            <div className="between">
              <h2 className="t-section">{t('Position on the map')}</h2>
              <Link to={`/map?stop=${stop.id}`} className="btn btn--sm">
                <Icon name="map" size={15} />
                {t('Open map')}
              </Link>
            </div>
            {/*
              **The station's own corner of the network.**

              This card used to draw the stops around the station and the walk between them — a
              picture of the streets' absence. It now draws what a map of a station is for: every
              line that calls here, leaving towards the next stop it calls at, in that mode's own
              colour.

              The alternative was a live street-map frame (OpenStreetMap's embed). It was built and
              looked at, and then taken out: the frame brought its own chrome — a two-line credit,
              a donate link and zoom buttons — into the middle of a card, it left an empty plate
              offline, and its tiles kept the page's network busy long after the page had drawn,
              which the repo's `ui-audit` waits for on every route. The app's own drawing answers
              the question, works with the connection off, and does not need a licence credit.
            */}
            <svg
              className="map-canvas"
              viewBox="0 0 100 100"
              role="img"
              aria-label={t('Local map of {stop}: the next stop on each line that calls here', {
                stop: stop.name,
              })}
            >
              <rect x="0" y="0" width="100" height="100" className="map-water" />
              <path className="map-land" d="M5 5 L95 3 L95 95 L5 95 Z" />
              {[...arms.values()].map((arm) => (
                <line
                  key={`arm-${arm.place.id}`}
                  className={`map-route map-route--${arm.modes[0]}`}
                  x1={50}
                  y1={50}
                  x2={arm.point.x}
                  y2={arm.point.y}
                />
              ))}
              {[...arms.values()]
                .filter((arm) => arm.point.inside)
                .map((arm) => (
                  <g
                    key={arm.place.id}
                    className="map-stop"
                    transform={`translate(${arm.point.x.toFixed(1)} ${arm.point.y.toFixed(1)})`}
                    onClick={() => navigate(`/stops/${arm.place.id}`)}
                  >
                    <circle r={1.2} />
                  </g>
                ))}
              {labelledArms.map((arm) => {
                const label = arm.place.name.replace(`${arm.place.city}, `, '');
                const anchorEnd = arm.point.x < 50;
                return (
                  <g
                    key={`label-${arm.place.id}`}
                    className="map-stop"
                    transform={`translate(${arm.point.x.toFixed(1)} ${arm.point.y.toFixed(1)})`}
                    onClick={() => navigate(`/stops/${arm.place.id}`)}
                  >
                    <text x={anchorEnd ? -3 : 3} y={0.8} textAnchor={anchorEnd ? 'end' : 'start'}>
                      {label}
                    </text>
                  </g>
                );
              })}
              <g className="map-stop map-stop--selected" transform="translate(50 50)">
                <circle r={1.9} />
                <text x={4} y={0.8}>
                  {stationName}
                </text>
              </g>
            </svg>
            <p className="t-sm t-faint">
              {hasLines
                ? t('Each arm is the next stop on a line that calls here, in that mode’s colour.')
                : t('No line calls here right now, so this shows the stops within walking distance.')}
            </p>
          </Card>
          ) : null}

          <WikipediaCard stopId={stop.id} />

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
                        {/* A headway is a clock: the app draws one for a journey's duration, so the
                            one fact every line row carries gets the same picture.

                            The phrase may wrap. It was `nowrap` as one unit, and at 280px the
                            column it sits in is 35px narrower than "every 30 min", so the words
                            were drawn out of the box and over the platform beside it. */}
                        <span className="t-faint">
                          <Icon name="clock" size={12} className="icon--inline" />{' '}
                          {t('every {minutes} min', { minutes: line.headway })}
                        </span>
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
                    <Link
                      to={`/disruptions?line=${line.id}`}
                      className="btn btn--xs btn--ghost list-row__control"
                      /* One "Alerts" per line row is the same name three times over, each going
                         to a different line's alerts. */
                      aria-label={t('Alerts: {line}', { line: line.name })}
                    >
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
                      {/*
                        **Minutes on foot are a footprint, and the modes are their glyphs.**

                        The row read `126 min walk · Train, Metro, Bus` — the same two kinds of fact
                        the journey card draws as a walk glyph and a chain of mode badges. Each mode
                        keeps its name in an `sr-only` span, so the line is still spoken as words.
                      */}
                      <span className="t-sm t-muted">
                        <Icon name="walk" size={12} className="icon--inline" />
                        <span className="sr-only">{t(modeLabel('walk'))}</span>{' '}
                        {t('{count} min', { count: walkMinutesBetween(stop, neighbour) })} ·{' '}
                        {neighbour.modes.filter((m) => m !== 'walk' && m !== 'bike').length ? (
                          <span className="mode-chain">
                            {neighbour.modes
                              .filter((m) => m !== 'walk' && m !== 'bike')
                              .map((mode) => (
                                <span key={mode}>
                                  <ModeIcon mode={mode} size={13} />
                                  <span className="sr-only">{t(modeLabel(mode))}</span>
                                </span>
                              ))}
                          </span>
                        ) : (
                          t('walking only')
                        )}
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
