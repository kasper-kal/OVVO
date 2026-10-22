import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../components/layout/AppShell';
import { DISRUPTIONS, DISRUPTION_TYPE_LABELS, getDisruption } from '../data/disruptions';
import { getLine } from '../data/network';
import { getStop, stopLabel } from '../data/stops';
import { modeLabel } from '../data/preferences';
import { operatorName } from '../data/operators';
import { severityTone } from './DisruptionsPage';
import { Banner, Card, EmptyState, Panel, Pill } from '../components/ui/primitives';
import { Icon, ModeIcon } from '../components/ui/Icons';
import { useFormat } from '../lib/useFormat';
import { useT } from '../lib/useT';
import { usePageTitle } from '../lib/usePageTitle';

export function DisruptionDetailPage() {
  const { disruptionId } = useParams();
  const format = useFormat();
  const t = useT();
  const alert = getDisruption(disruptionId);
  usePageTitle(alert ? alert.title : t('Alert not found'));

  if (!alert) {
    return (
      <div className="stack-6">
        <PageHeader title={t('Alert not found')} description={t('This alert is not in the list.')} showTitle />
        <EmptyState
          icon="alert"
          headingLevel={2}
          title={t('Unknown alert')}
          description={t('Return to the overview to browse the alerts that exist.')}
        >
          {/* The shell's own back arrow already goes to the same list under the name "All
              alerts"; this button said it a second time (8.5). */}
          <Link to="/disruptions" className="btn btn--primary">
            <Icon name="alert" size={16} />
            {t('See all alerts')}
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

  return (
    <div className="stack-6">
      <PageHeader
        title={alert.title}
        description={`${t('Alert')} · ${format.time(alert.startsAt)} – ${format.time(alert.endsAt)} · ${t(DISRUPTION_TYPE_LABELS[alert.type])}`}
        showTitle
        badge={<Pill tone={severityTone(alert.severity)}>{severityLabel(alert.severity, t)}</Pill>}
      />

      {/*
        The four tiles were this page's own content, counted. How serious the alert is is the
        chip on the title line; how many stops and services it touches are the counts in those
        cards' headings; and the window is a pill in the card below rather than a tile above it.
      */}

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div className="stack-4">
          <Card className="stack">
            <h2 className="t-section">{t('What is happening')}</h2>
            <p className="t-body">{alert.description}</p>
            <Banner tone="butter" icon="info" title={t('Advice')}>
              {alert.advice}
            </Banner>
            <div className="row-wrap">
              <Pill tone="outline">
                {format.time(alert.startsAt)}–{format.time(alert.endsAt)}
              </Pill>
              <Pill tone="outline">{t(DISRUPTION_TYPE_LABELS[alert.type])}</Pill>
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
            <h2 className="t-section">{t('Affected stops ({count})', { count: affectedStops.length })}</h2>
            <ul className="stack-2">
              {affectedStops.map((stop) =>
                stop ? (
                  <li key={stop.id} className="list-row list-row--static list-row--stack">
                    <span className="leg-row__marker">
                      <Icon name="station" size={18} />
                    </span>
                    <span className="stack-1 grow">
                      {/* `alignSelf` so the link is as wide as its name, not as wide as the
                          column: half a row's empty space used to open the stop (8.4). */}
                      <Link
                        to={`/stops/${stop.id}`}
                        className="t-strong t-sm tap-target"
                        style={{ alignSelf: 'flex-start' }}
                      >
                        {stop.name}
                      </Link>
                      {/* The `step-free` / `stairs only` fragment is deleted with every other
                          visible accessibility claim (F19). */}
                      <span className="t-sm t-muted">
                        {stop.city} · {stop.code}
                      </span>
                    </span>
                    {/* One end, then the other: this fills the TO and opens the FROM picker
                        (F28). `navigate` from the import line below is the whole handler. */}
                    {/* A link, not a `<button>` that navigates: four "Plan to here" buttons told
                        a screen reader nothing about which stop each one plans, and a button
                        cannot be opened in a new tab (8.3). */}
                    <Link
                      to={`/?to=${stop.id}&pick=from`}
                      className="btn btn--sm"
                      aria-label={t('Plan to {stop}', { stop: stop.name })}
                    >
                      <Icon name="route" size={16} />
                      {t('Plan to here')}
                    </Link>
                  </li>
                ) : null,
              )}
            </ul>
          </Card>

          <Card className="stack">
            <h2 className="t-section">{t('Affected services ({count})', { count: affectedLines.length })}</h2>
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
                        {stopLabel(line.stops[line.stops.length - 1])} ·{' '}
                        {t('every {minutes} min', { minutes: line.headway })}
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
                    <Link
                      to={`/disruptions?line=${line.id}`}
                      className="btn btn--sm"
                      aria-label={t('More alerts for {line}', { line: line.name })}
                    >
                      <Icon name="alert" size={16} />
                      {t('More alerts')}
                    </Link>
                  </li>
                ) : null,
              )}
            </ul>
          </Card>
        </div>

        {/*
          "Plan around this alert" is deleted whole — heading, sentence, "Avoid <modes> in my
          search", "Plan between the affected stops", "Travel preferences" and "Back to all
          alerts" ("Remove this widget", 2026-10-17t20-57-06). Nothing is stranded by it: the
          section that used to be its column is gone with it, every affected stop above still
          carries its own way to plan, and the way back is the shell's own arrow.
        */}
      </div>

      {/*
        The pager, and the only one: Previous/Next used to sit above the alert, before you
        could read it, and the "Browse other alerts" card repeated them beside it. One row
        under the alert, where you decide whether you want the next one after reading this one.
      */}
      <Panel className="stack-2 pager">
        <span className="field__label">{t('Other alerts')}</span>
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

/* The screen's own name for how bad it is: it was three English literals on a page whose every
   other chip was translated (8.2). */
function severityLabel(severity: string, t: (key: string) => string): string {
  if (severity === 'severe') return t('Major disruption');
  if (severity === 'warning') return t('Disruption');
  return t('Information');
}
