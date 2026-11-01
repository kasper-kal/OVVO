import { Link } from 'react-router-dom';
import { Card } from '../ui/primitives';
import { Icon } from '../ui/Icons';
import { useApp } from '../../state/AppState';
import { useT } from '../../lib/useT';
import { useDev } from '../../lib/dev';
import { appNow } from '../../lib/format';
import { tallyFor } from '../../lib/wrapped';

/**
 * **When the year is worth opening.**
 *
 * From 20 December the card appears on the home screen, and in the first week of January it is the
 * year that has just ended — so somebody who opens OVVO on 2 January is offered 2026 rather than an
 * empty 2027. Outside those weeks there is no card at all: the year is kept, and Settings still
 * knows about it, but the home screen does not shout about a story that is not being told yet.
 *
 * The app's own clock is what is read (`appNow`), which is what makes the developer panel's date
 * field able to show this card: set the clock to 31 December and the invitation is simply there.
 */
export function seasonFor(now: Date): { year: number; opening: boolean } | null {
  const month = now.getMonth();
  const day = now.getDate();
  if (month === 11 && day >= 20) return { year: now.getFullYear(), opening: false };
  if (month === 0 && day <= 7) return { year: now.getFullYear() - 1, opening: true };
  return null;
}

export function WrappedInvite({ place = 'home' }: { place?: 'home' | 'settings' }) {
  /* Subscribed, so moving the panel's clock redraws this card instead of waiting for a reload. */
  useDev();
  const t = useT();
  const { settings } = useApp();
  const season = seasonFor(appNow());
  if (!season) return null;

  const tally = tallyFor(season.year);
  const count = tally.runs.length;
  const to = `/wrapped?year=${season.year}`;

  return (
    <Card className={`stack wrapped-invite wrapped-invite--${place}`}>
      <div className="row-3">
        <span className="empty__icon" style={{ width: 40, height: 40, borderRadius: 'var(--r-compact)' }}>
          <Icon name="star" size={20} />
        </span>
        <div className="stack-1">
          <h2 className="t-section">
            {t('OVVO Wrapped {year}', { year: season.year })}
          </h2>
          <p className="t-sm t-muted">
            {count === 0
              ? t('Your year in journeys, counted as you go. Nothing has been written down yet.')
              : count === 1
                ? t('1 journey planned this year. Open it and see.')
                : t('{count} journeys planned this year. Open it and see.', { count })}
          </p>
        </div>
      </div>
      <div className="row-wrap">
        <Link className="btn btn--accent" to={to}>
          <Icon name="star" size={16} />
          {settings.language === 'nl' ? 'Open je jaar' : 'Open your year'}
        </Link>
      </div>
    </Card>
  );
}
