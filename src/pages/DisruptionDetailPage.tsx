import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../state/AppState';
import { PageHeader } from '../components/layout/AppShell';
import { DISRUPTIONS, DISRUPTION_TYPE_LABELS, getDisruption } from '../data/disruptions';
import { getLine } from '../data/network';
import { getStop, stopLabel } from '../data/stops';
import { MODE_OPTIONS, modeLabel } from '../data/preferences';
import type { TravelMode } from '../data/types';
import { operatorName } from '../data/operators';
import { severityTone } from './DisruptionsPage';
import { Banner, Button, Card, EmptyState, Panel, Pill } from '../components/ui/primitives';
import { Icon, ModeIcon } from '../components/ui/Icons';
import { useFormat } from '../lib/useFormat';
import { nowMinutes, roundToStep, todayIso } from '../lib/format';

export function DisruptionDetailPage() {
  const { disruptionId } = useParams();
  const navigate = useNavigate();
  const { search, startSearch, preferences, updatePreferences, pushToast } = useApp();
  const format = useFormat();
  const alert = getDisruption(disruptionId);

  if (!alert) {
    return (
      <div className="stack-6">
        <PageHeader title="Alert not found" description="This alert is not in the list." />
        <EmptyState icon="alert" title="Unknown alert" description="Return to the overview to browse the alerts that exist.">
          <Link to="/disruptions" className="btn btn--primary">
            <Icon name="alert" size={16} />
            All alerts
          </Link>
        </EmptyState>
      </div>
    );
  }

  const index = DISRUPTIONS.findIndex((item) => item.id === alert.id);
  const previous = DISRUPTIONS[(index - 1 + DISRUPTIONS.length) % DISRUPTIONS.length];
  const next = DISRUPTIONS[(index + 1) % DISRUPTIONS.length];
  const affectedStops = alert.affectedStopIds.map((id) => getStop(id)).filter(Boolean);
  const affectedLines = alert.affectedLineIds.map((id) => getLine(id)).filter(Boolean);

  const planAround = () => {
    if (!search) {
      pushToast('Plan a journey first, then you can route around an alert', 'warning');
      return;
    }
    const affected = alert.modes as TravelMode[];
    const allowedModes = preferences.allowedModes.filter((mode) => !affected.includes(mode));
    updatePreferences({ allowedModes });
    startSearch({ ...search.query, preferences: { ...preferences, allowedModes } });
    navigate('/results');
  };

  const planBetweenAffected = () => {
    if (alert.affectedStopIds.length < 2) {
      pushToast('This alert affects a single stop — use the stop page instead', 'warning');
      return;
    }
    startSearch({
      fromStopId: alert.affectedStopIds[0],
      toStopId: alert.affectedStopIds[1],
      date: todayIso(),
      time: roundToStep(nowMinutes() + 15, 5),
      timeMode: 'depart',
      preferences,
    });
    navigate('/results');
  };

  return (
    <div className="stack-6">
      <PageHeader
        title={alert.title}
        description={`Alert · ${format.time(alert.startsAt)} – ${format.time(alert.endsAt)} · ${DISRUPTION_TYPE_LABELS[alert.type]}`}
        showTitle
        badge={<Pill tone={severityTone(alert.severity)}>{severityLabel(alert.severity)}</Pill>}
      />

      {/*
        The four tiles were this page's own content, counted. How serious the alert is is the
        chip on the title line; how many stops and services it touches are the counts in those
        cards' headings; and the window is a pill in the card below rather than a tile above it.
      */}

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div className="stack-4">
          <Card className="stack">
            <h2 className="t-section">What is happening</h2>
            <p className="t-body">{alert.description}</p>
            <Banner tone="butter" icon="info" title="Advice">
              {alert.advice}
            </Banner>
            <div className="row-wrap">
              <Pill tone="outline">
                {format.time(alert.startsAt)}–{format.time(alert.endsAt)}
              </Pill>
              <Pill tone="outline">{DISRUPTION_TYPE_LABELS[alert.type]}</Pill>
              {alert.modes.map((mode) => (
                <span key={mode} className={`mode-badge mode-badge--${mode}`}>
                  <ModeIcon mode={mode} size={13} />
                  {/*
                    The mode's *name*, not its key. Every other surface that draws this badge
                    — the alerts list, the stop page, the stops list and the shared
                    `ModeBadge` — already went through `modeLabel`, so this one chip was the
                    only place in the app where a mode read `train` instead of `Train`, in
                    both languages (reported by the capitalisation audit).
                  */}
                  {modeLabel(mode)}
                </span>
              ))}
              {alert.operatorIds.map((operator) => (
                <Pill key={operator} tone="outline">
                  {operatorName(operator)}
                </Pill>
              ))}
            </div>
          </Card>

          <Card className="stack">
            <h2 className="t-section">Affected stops ({affectedStops.length})</h2>
            <ul className="stack-2">
              {affectedStops.map((stop) =>
                stop ? (
                  <li key={stop.id} className="list-row list-row--static list-row--stack">
                    <span className="leg-row__marker">
                      <Icon name="station" size={18} />
                    </span>
                    <span className="stack-1 grow">
                      <Link to={`/stops/${stop.id}`} className="t-strong t-sm tap-target">
                        {stop.name}
                      </Link>
                      <span className="t-sm t-muted">
                        {stop.city} · {stop.code} · {stop.accessibility.stepFree ? 'step-free' : 'stairs only'}
                      </span>
                    </span>
                    <Button
                      size="sm"
                      icon="route"
                      onClick={() => {
                        if (!search) {
                          pushToast('Plan a journey first to use this shortcut', 'warning');
                          return;
                        }
                        startSearch({ ...search.query, toStopId: stop.id, preferences });
                        navigate('/results');
                      }}
                    >
                      Plan to here
                    </Button>
                  </li>
                ) : null,
              )}
            </ul>
          </Card>

          <Card className="stack">
            <h2 className="t-section">Affected services ({affectedLines.length})</h2>
            <ul className="stack-2">
              {affectedLines.map((line) =>
                line ? (
                  <li key={line.id} className="list-row list-row--static list-row--stack">
                    <span className="leg-row__marker">
                      <ModeIcon mode={line.mode} size={18} />
                    </span>
                    <span className="stack-1 grow">
                      <span className="t-strong t-sm">{line.name}</span>
                      <span className="t-sm t-muted">
                        {operatorName(line.operatorId)} · {stopLabel(line.stops[0])} <Icon name="arrowRight" size={12} />{' '}
                        {stopLabel(line.stops[line.stops.length - 1])} · every {line.headway} min
                      </span>
                    </span>
                    {/*
                      A control, not a line of capitalised text. It was `btn--ghost` — no border,
                      no fill — sitting on a row that already has its own tint, so the label read
                      as part of the row rather than as something you can press, which is the
                      reported screenshot. It is now the same pill every other row-level action in
                      the app is (a white surface with the hairline border), with the app's own
                      alert glyph leading it; the row is a `list-row--stack`, so on a phone the
                      pill takes its own line at the row's foot and shows the label centred in it.
                    */}
                    <Link to={`/disruptions?line=${line.id}`} className="btn btn--sm">
                      <Icon name="alert" size={16} />
                      More alerts
                    </Link>
                  </li>
                ) : null,
              )}
            </ul>
          </Card>
        </div>

        <div className="stack-4">
          <Card className="stack">
            <h2 className="t-section">Plan around this alert</h2>
            <p className="t-sm t-muted">
              These actions re-plan your search around the alert.
            </p>
            <Button variant="primary" icon="sliders" onClick={planAround}>
              Avoid {alert.modes.join(', ')} in my search
            </Button>
            {/*
              One primary action, then the ways on and back as pills that hug their labels — the
              row the journey page's Continue panel and the results panel put their links in.
              This was a column of full-width controls, which is the *widget* pattern (a card in
              a grid, where a row of pills has no room), and it made the same link a stretched
              bar here and a 174px pill on the four other screens that offer it — the audit's
              `travel preferences`, five instances in two shapes for one destination (WCAG
              3.2.4).
            */}
            <div className="row-wrap">
              <Button icon="route" onClick={planBetweenAffected}>
                Plan between the affected stops
              </Button>
              {/*
                `Travel preferences`, the name the same destination is given on the four other
                screens that offer it (a widget card, the settings screen, both pickers, and the
                line below this card) — it read "Manage avoidance preferences" here, one concept
                wearing two names. `sliders` is the options/filters/preferences glyph and is
                right here.
              */}
              <Link to="/preferences" className="btn">
                <Icon name="sliders" size={16} />
                Travel preferences
              </Link>
              {/* Bordered, like the other two return links ("Back to planner", "Back to
                  results"): this one alone was drawn borderless inside a row of bordered
                  controls. */}
              <Link to="/disruptions" className="btn">
                <Icon name="arrowLeft" size={16} />
                Back to all alerts
              </Link>
            </div>
            {preferences.allowedModes.length < MODE_OPTIONS.length ? (
              <p className="t-sm t-faint">
                Modes currently left out of your journeys:{' '}
                {MODE_OPTIONS.filter((mode) => !preferences.allowedModes.includes(mode)).join(', ')}. Change this in
                Travel preferences.
              </p>
            ) : null}
          </Card>

          <Panel className="stack-2">
            <span className="field__label">Related screens</span>
            <div className="row-wrap">
              <Link to="/departures" className="btn btn--sm">
                <Icon name="board" size={15} />
                Departure boards
              </Link>
              <Link to="/map" className="btn btn--sm">
                <Icon name="map" size={15} />
                Network map
              </Link>
              {search ? (
                <Link to="/results" className="btn btn--sm">
                  <Icon name="route" size={15} />
                  My results
                </Link>
              ) : null}
            </div>
          </Panel>
        </div>
      </div>

      {/*
        The pager, and the only one: Previous/Next used to sit above the alert, before you
        could read it, and the "Browse other alerts" card repeated them beside it. One row
        under the alert, where you decide whether you want the next one after reading this one.
      */}
      <Panel className="stack-2 pager">
        <span className="field__label">Other alerts</span>
        <div className="row-wrap">
          <Link to={`/disruptions/${previous.id}`} className="btn btn--sm">
            <Icon name="chevronLeft" size={15} />
            <span className="pager__label">{previous.title}</span>
          </Link>
          <Link to={`/disruptions/${next.id}`} className="btn btn--sm">
            <Icon name="chevronRight" size={15} />
            <span className="pager__label">{next.title}</span>
          </Link>
        </div>
      </Panel>
    </div>
  );
}

function severityLabel(severity: string): string {
  if (severity === 'severe') return 'Major disruption';
  if (severity === 'warning') return 'Disruption';
  return 'Information';
}
