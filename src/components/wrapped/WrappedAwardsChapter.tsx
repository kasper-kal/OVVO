import { IconButton } from '../ui/primitives';
import { useT } from '../../lib/useT';
import type { YearAward } from '../../lib/wrappedDeck';

/*
 * **A yearbook page, not another report.**
 *
 * Each award is a tiny true story with a number attached, so it can be read in a second and
 * repeated to a friend. The share button is per award rather than one button for the page: the
 * superlative somebody recognises is the one they want to send.
 */
export function WrappedAwardsChapter({
  awards,
  onShare,
}: {
  awards: YearAward[];
  onShare: (cardId: string) => void;
}) {
  const t = useT();

  return (
    <section className="wrapped-awards" aria-label={t('Your trophies')}>
      <div className="wrapped-awards__grid">
        {awards.map((award) => (
          <article className="wrapped-award" key={award.id}>
            <div className="wrapped-award__top">
              <span className="wrapped-award__stat">{award.stat}</span>
              <span className="wrapped-award__label">{t(award.statLabel)}</span>
            </div>
            <h2 className="wrapped-award__title">{t(award.title)}</h2>
            <p className="wrapped-award__line">{t(award.line)}</p>
            <IconButton
              icon="share"
              label={t('Share this award')}
              onClick={() => onShare(`award-${award.id}`)}
            />
          </article>
        ))}
      </div>
    </section>
  );
}
