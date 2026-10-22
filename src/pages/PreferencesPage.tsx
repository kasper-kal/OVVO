import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../state/AppState';
import { PageHeader } from '../components/layout/AppShell';
import { PreferencesControls } from '../components/journey/PreferencesControls';
import { endLabel, filterJourneys, sortJourneys } from '../data/journeyEngine';
import { Button, Card, Pill } from '../components/ui/primitives';
import { Icon } from '../components/ui/Icons';
import { useFormat } from '../lib/useFormat';
import { useT } from '../lib/useT';
import { usePageTitle } from '../lib/usePageTitle';

export function PreferencesPage() {
  const { preferences, updatePreferences, resetPreferences, journeys, search } = useApp();
  const format = useFormat();
  const t = useT();
  usePageTitle(t('Travel preferences'));

  const preview = useMemo(() => {
    if (!search) return null;
    const filtered = filterJourneys(journeys, { ...search.filter }, preferences);
    const sorted = sortJourneys(filtered, search.sortMode, preferences);
    return {
      total: journeys.length,
      matching: filtered.length,
      best: sorted[0],
    };
  }, [journeys, preferences, search]);

  return (
    <div className="stack-6">
      {/*
        One action at the head, and it is a way on rather than a way to save: every control on
        this page applies as you touch it, so an APPLY button acted on settings that were
        already applied, and a RESET sat above the list it undoes. Reset is at the foot of the
        list now, where the thing it reverses has already been read.
      */}
      <PageHeader
        title={t('Travel preferences')}
        description={t(
          'These preferences shape your search results: the planner respects them, the results list filters by them and the ordering changes with them.',
        )}
        showTitle
        actions={
          search ? (
            <Link to="/results" className="btn btn--primary">
              <Icon name="route" size={16} />
              {t('See the results')}
            </Link>
          ) : (
            <Link to="/" className="btn btn--primary">
              <Icon name="search" size={16} />
              {t('Plan a journey')}
            </Link>
          )
        }
      />

      {preview ? (
        <Card className="stack">
          <div className="between wrap">
            <div className="stack-1">
              <h2 className="t-section">{t('Effect on your current search')}</h2>
              <span className="t-sm t-muted">
                {endLabel(search!.query, 'from')} → {endLabel(search!.query, 'to')} ·{' '}
                {format.date(search!.query.date)} {format.time(search!.query.time)}
              </span>
            </div>
            <div className="row-wrap">
              <Pill tone="sage" role="status">
                {t('{matching} of {total} journeys allowed', {
                  matching: preview.matching,
                  total: preview.total,
                })}
              </Pill>
              {preview.best ? (
                <Pill tone="butter">
                  {t('Best now: {departure} → {arrival}', {
                    departure: format.time(preview.best.departure),
                    arrival: format.time(preview.best.arrival),
                  })}{' '}
                  · {format.duration(preview.best.durationMinutes)}
                </Pill>
              ) : (
                <Pill tone="coral">{t('No journey matches these preferences')}</Pill>
              )}
            </div>
          </div>
          {/* The two pills above are the summary; the three tiles that used to sit under them —
              transfers, walking, modes — said the same three facts a second time. */}
        </Card>
      ) : (
        <p className="t-sm t-muted">{t('Plan a journey to preview these settings.')}</p>
      )}

      <Card hero className="stack">
        <h2 className="t-section">{t('All preferences')}</h2>
        <PreferencesControls preferences={preferences} onChange={updatePreferences} />
        <div className="row-wrap">
          {/* No toast: every control in the panel visibly snaps back to its default. */}
          <Button icon="refresh" onClick={resetPreferences}>
            {t('Reset to defaults')}
          </Button>
        </div>
      </Card>

    </div>
  );
}
