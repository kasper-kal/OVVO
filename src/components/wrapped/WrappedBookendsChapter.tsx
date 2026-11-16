import { useFormat } from '../../lib/useFormat';
import { toIsoDate } from '../../lib/format';
import { useT } from '../../lib/useT';
import type { YearBookend } from '../../lib/wrappedDeck';

/*
 * **The year has a first page and a last page.**
 *
 * Statistics can make a year feel like a pile. Two searches, one at each end, make it feel like a
 * book: where it started, where it finished and the twelve months in between. The date is the day
 * the search was run; the time is the hour the traveller asked to leave, which is the only time the
 * tally actually knows.
 */
export function WrappedBookendsChapter({
  first,
  last,
}: {
  first: YearBookend;
  last: YearBookend;
}) {
  const t = useT();
  const format = useFormat();
  const locale = format.language === 'nl' ? 'nl-NL' : 'en-GB';
  const month = (at: number) => new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(at));
  const date = (at: number) => format.date(toIsoDate(new Date(at)), 'long');

  return (
    <section className="wrapped-bookends" aria-label={t('Your first and last journey')}>
      <p className="wrapped-bookends__lead">
        {t('You started in {month} at {from}. You ended in {month2} at {to}.', {
          month: month(first.at),
          from: first.from,
          month2: month(last.at),
          to: last.to,
        })}
      </p>

      <div className="wrapped-bookends__pair">
        <article className="wrapped-bookend">
          <span className="wrapped-bookend__label">{t('First journey')}</span>
          <span className="wrapped-bookend__date">{date(first.at)}</span>
          <strong className="wrapped-bookend__route">
            {first.from} <i aria-hidden="true">→</i> {first.to}
          </strong>
          <span className="wrapped-bookend__time">
            {t('Wanted to leave at {time}', { time: format.time(first.hour * 60) })}
          </span>
        </article>

        <span className="wrapped-bookends__connector" aria-hidden="true">
          <i />
        </span>

        <article className="wrapped-bookend">
          <span className="wrapped-bookend__label">{t('Last journey')}</span>
          <span className="wrapped-bookend__date">{date(last.at)}</span>
          <strong className="wrapped-bookend__route">
            {last.from} <i aria-hidden="true">→</i> {last.to}
          </strong>
          <span className="wrapped-bookend__time">
            {t('Wanted to leave at {time}', { time: format.time(last.hour * 60) })}
          </span>
        </article>
      </div>
    </section>
  );
}
