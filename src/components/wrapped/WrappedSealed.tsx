import { useMemo } from 'react';
import { Button } from '../ui/primitives';
import { useT } from '../../lib/useT';
import { tallyFor } from '../../lib/wrapped';

/*
 * **December is the waiting room, not the reveal.**
 *
 * The real story still opens on 1 January at 00:00:01 and not a second earlier. This card only says
 * that something is waiting, counts down to the same door and gives one harmless fact from the
 * unfinished year. It deliberately does not show the total, the best route, the nameplate or any
 * other chapter: the year is not over yet, so there is nothing complete to review.
 */
export function WrappedSealed({ now, onBack }: { now: Date; onBack: () => void }) {
  const t = useT();
  const year = now.getFullYear();
  const tally = useMemo(() => tallyFor(year), [year]);
  const months = new Set(tally.runs.map((run) => new Date(run.at).getMonth())).size;
  const target = new Date(year + 1, 0, 1, 0, 0, 1).getTime();
  const left = Math.max(0, target - now.getTime());
  const days = Math.floor(left / 86_400_000);
  const hours = Math.floor((left % 86_400_000) / 3_600_000);
  const minutes = Math.floor((left % 3_600_000) / 60_000);
  const seconds = Math.floor((left % 60_000) / 1000);

  const units = [
    { value: days, label: days === 1 ? t('day') : t('days') },
    { value: hours, label: t('hours') },
    { value: minutes, label: t('minutes') },
    { value: seconds, label: t('seconds') },
  ];

  return (
    <div className="wrapped-sealed">
      <div className="wrapped-sealed__envelope" aria-hidden="true">
        <span className="wrapped-sealed__flap" />
        <span className="wrapped-sealed__seal">OVVO</span>
      </div>

      <p className="wrapped-sealed__kicker">{t('OVVO Wrapped {year}', { year })}</p>
      <h1 className="wrapped-sealed__title">{t('Sealed until January')}</h1>
      <p className="wrapped-sealed__teaser">
        {months > 0
          ? months === 1
            ? t('You planned journeys in 1 month this year. The rest is sealed until January.')
            : t('You planned journeys in {months} months this year. The rest is sealed until January.', {
                months,
              })
          : t('Your year is still being written. The rest is sealed until January.')}
      </p>

      <div className="wrapped-sealed__countdown" aria-label={t('Time until Wrapped opens')}>
        {units.map((unit) => (
          <span key={unit.label}>
            <strong>{String(unit.value).padStart(2, '0')}</strong>
            <em>{unit.label}</em>
          </span>
        ))}
      </div>

      <p className="wrapped-sealed__note">
        {t('The real year opens on 1 January, just after midnight. Nothing is revealed before then.')}
      </p>

      <Button variant="ghost" onClick={onBack}>
        {t('Back')}
      </Button>
    </div>
  );
}
