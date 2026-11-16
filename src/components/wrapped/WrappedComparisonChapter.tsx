import { useT } from '../../lib/useT';
import type { YearComparison } from '../../lib/wrappedDeck';

/*
 * **A year measured against the one before it.**
 *
 * The counts are the traveller's own, and so are the station names. Nothing is compared with another
 * person here; the only other year is the one they already kept. That is the point of the chapter:
 * the history is the reward, not a leaderboard.
 */
export function WrappedComparisonChapter({ data }: { data: YearComparison }) {
  const t = useT();
  const thisYear = data.previousYear + 1;
  const newNames = data.newStations.join(' · ');

  return (
    <section className="wrapped-comparison" aria-label={t('Year over year comparison')}>
      <div className="wrapped-comparison__counts">
        <div className="wrapped-comparison__year is-current">
          <span>{thisYear}</span>
          <strong>{data.journeys}</strong>
          <em>{data.journeys === 1 ? t('journey') : t('journeys')}</em>
        </div>
        <span className="wrapped-comparison__link" aria-hidden="true" />
        <div className="wrapped-comparison__year">
          <span>{data.previousYear}</span>
          <strong>{data.previousJourneys}</strong>
          <em>{data.previousJourneys === 1 ? t('journey') : t('journeys')}</em>
        </div>
      </div>

      <div className="wrapped-comparison__stats">
        <div className="wrapped-comparison__stat">
          <span>{t('New stations')}</span>
          <strong>{data.newStationCount}</strong>
          <em>{newNames || t('None this year.')}</em>
        </div>
        <div className="wrapped-comparison__stat">
          <span>{t('Returning favourites')}</span>
          <strong>{data.returningStations}</strong>
          <em>{t('stops you used both years')}</em>
        </div>
        <div className="wrapped-comparison__stat is-theme">
          <span>{t('A theme that survived')}</span>
          <strong>{data.survivedThemes.length || '0'}</strong>
          <em>
            {data.survivedThemes.length
              ? data.survivedThemes.join(' · ')
              : t('No look lasted both years.')}
          </em>
        </div>
      </div>
    </section>
  );
}
