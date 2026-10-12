import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApp } from '../state/AppState';
import { PageHeader } from '../components/layout/AppShell';
import { DISRUPTIONS, DISRUPTION_TYPE_LABELS } from '../data/disruptions';
import { getLine } from '../data/network';
import { getStop, stopLabel } from '../data/stops';
import { operatorName } from '../data/operators';
import { PT_LABEL_ORDER } from '../lib/boardHelpers';
import { Button, Card, Chip, DemoBadge, EmptyState, Panel, Pill, Stat } from '../components/ui/primitives';
import { Icon, ModeIcon } from '../components/ui/Icons';
import { useFormat } from '../lib/useFormat';
import type { Disruption, DisruptionSeverity, DisruptionType, PublicMode } from '../data/types';

const SEVERITY_LABEL: Record<DisruptionSeverity, string> = {
  info: 'Information',
  warning: 'Disruption',
  severe: 'Major disruption',
};

const SEVERITY_TONE: Record<DisruptionSeverity, 'sage' | 'butter' | 'coral'> = {
  info: 'sage',
  warning: 'butter',
  severe: 'coral',
};

export function severityTone(severity: DisruptionSeverity) {
  return SEVERITY_TONE[severity];
}

export function typeLabel(type: DisruptionType) {
  return DISRUPTION_TYPE_LABELS[type];
}

export function DisruptionsPage() {
  const [params, setParams] = useSearchParams();
  const { favouriteStopIds, search, startSearch, preferences, pushToast } = useApp();
  const lineFilter = params.get('line');

  const [types, setTypes] = useState<DisruptionType[]>([]);
  const [severities, setSeverities] = useState<DisruptionSeverity[]>([]);
  const [modes, setModes] = useState<PublicMode[]>([]);
  const [stopQuery, setStopQuery] = useState('');
  const [textQuery, setTextQuery] = useState('');
  const [favouritesOnly, setFavouritesOnly] = useState(false);
  const [sort, setSort] = useState<'severity' | 'time' | 'type'>('severity');

  const results = useMemo(() => {
    const severityRank: Record<DisruptionSeverity, number> = { severe: 0, warning: 1, info: 2 };
    const normalised = textQuery.trim().toLowerCase();
    const stopTerm = stopQuery.trim().toLowerCase();
    return DISRUPTIONS.filter((alert) => {
      if (lineFilter && !alert.affectedLineIds.includes(lineFilter)) return false;
      if (types.length && !types.includes(alert.type)) return false;
      if (severities.length && !severities.includes(alert.severity)) return false;
      if (modes.length && !alert.modes.some((mode) => modes.includes(mode))) return false;
      if (favouritesOnly && !alert.affectedStopIds.some((id) => favouriteStopIds.includes(id))) return false;
      if (stopTerm) {
        const haystack = alert.affectedStopIds.map((id) => stopLabel(id)).join(' ').toLowerCase();
        if (!haystack.includes(stopTerm)) return false;
      }
      if (normalised) {
        const haystack = `${alert.title} ${alert.description} ${alert.advice} ${alert.affectedLineIds.join(' ')}`.toLowerCase();
        if (!haystack.includes(normalised)) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sort === 'time') return a.startsAt - b.startsAt;
      if (sort === 'type') return a.type.localeCompare(b.type);
      return severityRank[a.severity] - severityRank[b.severity];
    });
  }, [types, severities, modes, stopQuery, textQuery, favouritesOnly, sort, lineFilter, favouriteStopIds]);

  const reset = () => {
    setTypes([]);
    setSeverities([]);
    setModes([]);
    setStopQuery('');
    setTextQuery('');
    setFavouritesOnly(false);
    setSort('severity');
    if (lineFilter) setParams({}, { replace: true });
  };

  return (
    <div className="stack" style={{ gap: 'var(--s-6)' }}>
      <PageHeader
        title="Disruptions & service alerts"
        description="Example delays, cancellations, planned works, platform changes, crowding and weather alerts. None of these describes a real situation."
        breadcrumbs={[{ label: 'Planner', to: '/' }, { label: 'Disruptions' }]}
        badge={<DemoBadge label="Example alerts only" />}
        actions={
          <Button icon="refresh" onClick={reset}>
            Reset filters
          </Button>
        }
      />

      <div className="banner banner--coral" role="note">
        <Icon name="alert" size={18} />
        <div className="stack-1 grow">
          <p className="t-strong t-sm">These alerts are invented for the prototype</p>
          <p className="t-sm">
            They exist so the interface can be evaluated. Always check the official operator channels for real travel
            information.
          </p>
        </div>
      </div>

      <div className="grid-4">
        <Stat label="Alerts in the demo set" value={String(DISRUPTIONS.length)} hint="All simulated" />
        <Stat label="Major disruptions" value={String(DISRUPTIONS.filter((a) => a.severity === 'severe').length)} hint="Example severity" />
        <Stat label="Planned works" value={String(DISRUPTIONS.filter((a) => a.type === 'works').length)} hint="Simulated engineering works" />
        <Stat label="Matching filters" value={String(results.length)} hint="Live count" />
      </div>

      <Card className="stack">
        <div className="row-wrap">
          <span className="field__label">Type</span>
          {(Object.keys(DISRUPTION_TYPE_LABELS) as DisruptionType[]).map((type) => (
            <Chip
              key={type}
              selected={types.includes(type)}
              onClick={() => setTypes((current) => (current.includes(type) ? current.filter((t) => t !== type) : [...current, type]))}
            >
              {DISRUPTION_TYPE_LABELS[type]}
            </Chip>
          ))}
        </div>

        <div className="row-wrap">
          <span className="field__label">Severity</span>
          {(Object.keys(SEVERITY_LABEL) as DisruptionSeverity[]).map((severity) => (
            <Chip
              key={severity}
              selected={severities.includes(severity)}
              onClick={() =>
                setSeverities((current) => (current.includes(severity) ? current.filter((s) => s !== severity) : [...current, severity]))
              }
            >
              {SEVERITY_LABEL[severity]}
            </Chip>
          ))}
        </div>

        <div className="row-wrap">
          <span className="field__label">Transport mode</span>
          {PT_LABEL_ORDER.map((mode) => (
            <Chip
              key={mode}
              selected={modes.includes(mode)}
              onClick={() => setModes((current) => (current.includes(mode) ? current.filter((m) => m !== mode) : [...current, mode]))}
            >
              <ModeIcon mode={mode} size={15} />
              {mode}
            </Chip>
          ))}
        </div>

        <div className="grid-2">
          <label className="field">
            <span className="field__label">Filter by affected stop</span>
            <input
              className="input"
              value={stopQuery}
              onChange={(event) => setStopQuery(event.target.value)}
              placeholder="e.g. Utrecht, Schiphol, Blaak"
            />
          </label>
          <label className="field">
            <span className="field__label">Search in alerts</span>
            <input
              className="input"
              value={textQuery}
              onChange={(event) => setTextQuery(event.target.value)}
              placeholder="e.g. platform, ferry, works"
            />
          </label>
        </div>

        <div className="row-wrap">
          <Chip selected={favouritesOnly} icon="star" onClick={() => setFavouritesOnly((value) => !value)}>
            Affecting my favourite locations
          </Chip>
          <span className="field__label">Sort</span>
          <Chip selected={sort === 'severity'} onClick={() => setSort('severity')}>
            Severity
          </Chip>
          <Chip selected={sort === 'time'} onClick={() => setSort('time')}>
            Start time
          </Chip>
          <Chip selected={sort === 'type'} onClick={() => setSort('type')}>
            Type
          </Chip>
          {lineFilter ? (
            <Chip selected icon="close" onClick={() => setParams({}, { replace: true })}>
              Line filter: {getLine(lineFilter)?.name ?? lineFilter}
            </Chip>
          ) : null}
        </div>
      </Card>

      {results.length === 0 ? (
        <EmptyState
          icon="alert"
          title="No example alerts match these filters"
          description="Reset the filters to see the full demonstration set again."
        >
          <Button variant="primary" icon="refresh" onClick={reset}>
            Reset filters
          </Button>
        </EmptyState>
      ) : (
        <ul className="stack" style={{ gap: 'var(--s-3)' }}>
          {results.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </ul>
      )}

      <Panel className="stack-2">
        <span className="field__label">How alerts are used here</span>
        <ul className="stack-1 t-sm">
          <li>Alerts influence the simulated journeys: matching legs show an example delay or cancellation.</li>
          <li>Departure boards mark affected services from this same local dataset.</li>
          <li>The page never claims an alert is a current, real disruption.</li>
          {search ? (
            <li>
              Your current search is {stopLabel(search.query.fromStopId)} → {stopLabel(search.query.toStopId)}.{' '}
              <Link to="/results" className="t-strong">
                Back to results
              </Link>
            </li>
          ) : null}
        </ul>
        <div className="row-wrap">
          <Button
            size="sm"
            icon="route"
            onClick={() => {
              if (!search) {
                pushToast('Plan a journey first to see alerts on it', 'warning');
                return;
              }
              startSearch({ ...search.query, preferences });
              pushToast('Search re-run with the current alerts applied', 'success');
            }}
          >
            Re-run my search with these alerts
          </Button>
        </div>
      </Panel>
    </div>
  );
}

function AlertCard({ alert }: { alert: Disruption }) {
  const format = useFormat();
  return (
    <Card as="li" className="stack-2">
      <div className="between wrap">
        <div className="row-3">
          <span className="leg-row__marker">
            <Icon name="alert" size={18} />
          </span>
          <div className="stack-1">
            <span className="t-strong">{alert.title}</span>
            <span className="t-sm t-muted">
              {format.time(alert.startsAt)} – {format.time(alert.endsAt)} ·{' '}
              {alert.affectedStopIds.length} stop(s) · {alert.affectedLineIds.length} service(s)
            </span>
          </div>
        </div>
        <div className="row-wrap">
          <Pill tone={SEVERITY_TONE[alert.severity]}>{SEVERITY_LABEL[alert.severity]}</Pill>
          <Pill tone="outline">{DISRUPTION_TYPE_LABELS[alert.type]}</Pill>
        </div>
      </div>

      <p className="t-sm t-clamp-2">{alert.description}</p>

      <div className="row-wrap">
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

      <div className="row-wrap">
        {alert.affectedStopIds.slice(0, 4).map((stopId) => (
          <Link key={stopId} to={`/stops/${stopId}`} className="chip">
            <Icon name="station" size={14} />
            {getStop(stopId)?.name ?? stopId}
          </Link>
        ))}
        {alert.affectedStopIds.length > 4 ? (
          <span className="pill">+{alert.affectedStopIds.length - 4} more stops</span>
        ) : null}
      </div>

      <div className="row-wrap">
        <Link to={`/disruptions/${alert.id}`} className="btn btn--primary btn--sm">
          <Icon name="info" size={15} />
          Alert details & advice
        </Link>
        <Link to={`/departures?stop=${alert.affectedStopIds[0]}`} className="btn btn--sm">
          <Icon name="board" size={15} />
          Board at {getStop(alert.affectedStopIds[0])?.name}
        </Link>
      </div>
    </Card>
  );
}
