import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import { useApp } from '../../state/AppState';
import { useT } from '../../lib/useT';
import { styleById, stylePalette } from '../../lib/styles';
import type { EraPhase } from '../../lib/wrappedDeck';

/*
 * **A year of looks, not a list of settings.**
 *
 * The tally already writes one line for every day the app was worn in a look. Read back in order,
 * those lines become phases: a run of the same look is an era, and a different look begins the next
 * one. The timeline gives each era its own colour from the style itself, its dates, and the moment
 * the traveller switched.
 */
export function WrappedEraChapter({ eras }: { eras: EraPhase[] }) {
  const t = useT();
  const { settings, appearance } = useApp();
  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat(settings.language === 'nl' ? 'nl-NL' : 'en-GB', {
        day: 'numeric',
        month: 'short',
      }),
    [settings.language],
  );

  return (
    <section className="wrapped-eras" aria-label={t('Your looks through the year')}>
      <div className="wrapped-eras__rail" aria-hidden="true">
        {eras.map((era) => (
          <span
            key={`${era.id}-${era.start}`}
            style={
              {
                flexGrow: Math.max(1, era.days),
                background: stylePalette(styleById(era.id), appearance).accent,
              } as CSSProperties
            }
          />
        ))}
      </div>

      <ol className="wrapped-eras__list">
        {eras.map((era, index) => {
          const accent = stylePalette(styleById(era.id), appearance).accent;
          return (
            <li className="wrapped-eras__era" key={`${era.id}-${era.start}`}>
              <span className="wrapped-eras__marker" style={{ '--era': accent } as CSSProperties}>
                <i aria-hidden="true" />
              </span>
              <div className="wrapped-eras__copy">
                <span className="wrapped-eras__when">
                  {formatter.format(new Date(era.start))} - {formatter.format(new Date(era.end))}
                </span>
                <strong>{era.name}</strong>
                <span className="wrapped-eras__days">
                  {t('{days} days', { days: era.days })}
                </span>
                <span className="wrapped-eras__switch">
                  {index === 0
                    ? t('Where the year started')
                    : t('Switched on {date}', { date: formatter.format(new Date(era.start)) })}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
