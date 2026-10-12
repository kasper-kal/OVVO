import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../state/AppState';
import { BackButton, PageHeader } from '../components/layout/AppShell';
import { DISRUPTIONS, DISRUPTION_TYPE_LABELS, getDisruption } from '../data/disruptions';
import { getLine } from '../data/network';
import { getStop, stopLabel } from '../data/stops';
import { operatorName } from '../data/operators';
import { severityTone } from './DisruptionsPage';
import { Banner, Button, Card, DemoBadge, EmptyState, Panel, Pill, Stat } from '../components/ui/primitives';
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
      <div className="stack" style={{ gap: 'var(--s-6)' }}>
        <PageHeader title="Alert not found" description="This example alert is not part of the demonstration dataset." breadcrumbs={[{ label: 'Disruptions', to: '/disruptions' }]} />
        <EmptyState icon="alert" title="Unknown alert" description="Return to the overview to browse the example alerts that exist.">
          <Link to="/disruptions" className="btn btn--primary">
            <Icon name="alert" size={16} />
            All example alerts
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
    const avoided = [...new Set([...preferences.avoidedModes, ...alert.modes])];
    updatePreferences({ avoidedModes: avoided });
    startSearch({ ...search.query, preferences: { ...preferences, avoidedModes: avoided } });
    pushToast(`Simulated results re-planned while avoiding ${alert.modes.join(', ')}`, 'success');
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
    pushToast('Alternative journey planned (simulated)', 'success');
    navigate('/results');
  };

  return (
    <div className="stack" style={{ gap: 'var(--s-6)' }}>
      <PageHeader
        title={alert.title}
        description={`Example alert · ${format.time(alert.startsAt)} – ${format.time(alert.endsAt)} · ${DISRUPTION_TYPE_LABELS[alert.type]}`}
        breadcrumbs={[{ label: 'Planner', to: '/' }, { label: 'Disruptions', to: '/disruptions' }, { label: 'Alert details' }]}
        badge={<DemoBadge label="Simulated alert" />}
        actions={
          <>
            <BackButton to="/disruptions" label="All alerts" />
            <Button icon="chevronLeft" onClick={() => navigate(`/disruptions/${previous.id}`)}>
              Previous alert
            </Button>
            <Button icon="chevronRight" onClick={() => navigate(`/disruptions/${next.id}`)}>
              Next alert
            </Button>
          </>
        }
      />

      <div className="banner banner--coral" role="note">
        <Icon name="alert" size={18} />
        <div className="stack-1 grow">
          <p className="t-strong t-sm">Demonstration alert — not a real disruption</p>
          <p className="t-sm">
            The text below is written for the prototype. It is not connected to any operator, feed or current event.
          </p>
        </div>
      </div>

      <div className="grid-4">
        <Stat label="Severity" value={severityLabel(alert.severity)} hint="Example severity level" />
        <Stat label="Affected stops" value={String(alert.affectedStopIds.length)} hint="Each has its own page" />
        <Stat label="Affected services" value={String(alert.affectedLineIds.length)} hint="Simulated lines" />
        <Stat label="Window" value={`${format.time(alert.startsAt)}–${format.time(alert.endsAt)}`} hint="In the demo day" />
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div className="stack" style={{ gap: 'var(--s-4)' }}>
          <Card className="stack">
            <h2 className="t-section">What is happening (simulated)</h2>
            <p className="t-body">{alert.description}</p>
            <Banner tone="butter" icon="info" title="Advice in this example">
              {alert.advice}
            </Banner>
            <div className="row-wrap">
              <Pill tone={severityTone(alert.severity)}>{severityLabel(alert.severity)}</Pill>
              <Pill tone="outline">{DISRUPTION_TYPE_LABELS[alert.type]}</Pill>
              {alert.modes.map((mode) => (
                <span key={mode} className={`mode-badge mode-badge--${mode}`}>
                  <ModeIcon mode={mode} size={13} />
                  {mode}
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
            <h2 className="t-section">Affected stops</h2>
            <ul className="stack-2">
              {affectedStops.map((stop) =>
                stop ? (
                  <li key={stop.id} className="list-row list-row--static">
                    <span className="leg-row__marker">
                      <Icon name="station" size={18} />
                    </span>
                    <span className="stack-1 grow">
                      <Link to={`/stops/${stop.id}`} className="t-strong t-sm">
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
            <h2 className="t-section">Affected services</h2>
            <ul className="stack-2">
              {affectedLines.map((line) =>
                line ? (
                  <li key={line.id} className="list-row list-row--static">
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
                    <Link to={`/disruptions?line=${line.id}`} className="btn btn--sm btn--ghost">
                      More alerts
                    </Link>
                  </li>
                ) : null,
              )}
            </ul>
          </Card>
        </div>

        <div className="stack" style={{ gap: 'var(--s-4)' }}>
          <Card className="stack">
            <h2 className="t-section">Plan around this alert</h2>
            <p className="t-sm t-muted">
              These actions run the prototype's own planner. Nothing is sent to an operator or a live system.
            </p>
            <div className="stack-2">
              <Button variant="primary" icon="sliders" onClick={planAround}>
                Avoid {alert.modes.join(', ')} in my search
              </Button>
              <Button icon="route" onClick={planBetweenAffected}>
                Plan between the affected stops
              </Button>
              <Link to="/preferences" className="btn">
                <Icon name="sliders" size={16} />
                Manage avoidance preferences
              </Link>
              <Link to="/disruptions" className="btn btn--ghost">
                <Icon name="arrowLeft" size={16} />
                Back to all alerts
              </Link>
            </div>
            {preferences.avoidedModes.length ? (
              <p className="t-sm t-faint">
                Currently avoided modes: {preferences.avoidedModes.join(', ')}. Change this in Travel preferences.
              </p>
            ) : null}
          </Card>

          <Card className="stack">
            <h2 className="t-section">Browse other example alerts</h2>
            <ul className="stack-2">
              {[previous, next].map((other) => (
                <li key={other.id}>
                  <Link to={`/disruptions/${other.id}`} className="list-row">
                    <span className="leg-row__marker">
                      <Icon name="alert" size={18} />
                    </span>
                    <span className="stack-1 grow">
                      <span className="t-strong t-sm">{other.title}</span>
                      <span className="t-sm t-muted">
                        {severityLabel(other.severity)} · {DISRUPTION_TYPE_LABELS[other.type]}
                      </span>
                    </span>
                    <Icon name="chevronRight" size={18} />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          <Panel className="stack-2">
            <span className="field__label">Related prototype screens</span>
            <div className="row-wrap">
              <Link to="/departures" className="btn btn--sm">
                <Icon name="board" size={15} />
                Departure boards
              </Link>
              <Link to="/map" className="btn btn--sm">
                <Icon name="map" size={15} />
                Illustrative map
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
    </div>
  );
}

function severityLabel(severity: string): string {
  if (severity === 'severe') return 'Major disruption';
  if (severity === 'warning') return 'Disruption';
  return 'Information';
}
