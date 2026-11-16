import { useFormat } from '../../lib/useFormat';
import { useT } from '../../lib/useT';
import type { ChapterDistance } from '../../lib/wrappedDeck';

/*
 * **A distance with its method on the sleeve.**
 *
 * This is the one chapter where a big number could become a green claim, so it refuses to make
 * one. The distance is straight-line and planned, the car comparison is a simple per-kilometre
 * estimate, and the note says both things plainly. OVVO never saw the traveller board, so it does
 * not pretend to know a measured saving.
 */
export function WrappedDistanceChapter({ data }: { data: ChapterDistance }) {
  const t = useT();
  const { language } = useFormat();
  const locale = language === 'nl' ? 'nl-NL' : 'en-GB';
  const km = new Intl.NumberFormat(locale, {
    maximumFractionDigits: data.km < 100 ? 1 : 0,
  }).format(data.km);
  const car = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(data.carKg);
  const transit = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(data.transitKg);
  const avoided = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(data.avoidedKg);
  const scale = Math.max(1, data.carKg);
  const transitWidth = Math.max(2, Math.min(100, (data.transitKg / scale) * 100));

  return (
    <section className="wrapped-distance" aria-label={t('Planned distance and emissions estimate')}>
      <div className="wrapped-distance__hero">
        <p className="wrapped-distance__big">
          {km} <span>{t('km planned')}</span>
        </p>
        <p className="wrapped-distance__label">
          {t('Straight-line distance between the stops OVVO could place.')}
        </p>
      </div>

      <div className="wrapped-distance__bars" aria-label={t('Estimated emissions comparison')}>
        <div className="wrapped-distance__bar">
          <div className="wrapped-distance__bar-head">
            <span>{t('By car')}</span>
            <strong>{car} kg CO2e</strong>
          </div>
          <i style={{ width: '100%' }} aria-hidden="true" />
        </div>
        <div className="wrapped-distance__bar is-transit">
          <div className="wrapped-distance__bar-head">
            <span>{t('By public transport')}</span>
            <strong>{transit} kg CO2e</strong>
          </div>
          <i style={{ width: `${transitWidth}%` }} aria-hidden="true" />
        </div>
      </div>

      <p className="wrapped-distance__saved">
        <strong>{avoided} kg CO2e</strong>{' '}
        {t('less than driving, if these planned trips had replaced car journeys.')}
      </p>

      <div className="wrapped-distance__notes">
        <p>
          {t('Counted {known} of {total} journeys, the ones with both stops known to OVVO.', {
            known: data.knownRuns,
            total: data.totalRuns,
          })}
        </p>
        <p>
          {t('Illustration only: petrol car at 170 g CO2e per km; public transport at 50 g per passenger-km, straight-line. OVVO did not see you travel, so this is not a measured saving.')}
        </p>
      </div>
    </section>
  );
}
