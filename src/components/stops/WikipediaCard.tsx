import { useEffect, useState } from 'react';
import { Card } from '../ui/primitives';
import { Icon } from '../ui/Icons';
import { useApp } from '../../state/AppState';
import { useT } from '../../lib/useT';
import {
  cachedWikipediaSummary,
  fetchWikipediaSummary,
  type WikipediaSummary,
} from '../../lib/wikipedia';

/**
 * What this place *is*, from Wikipedia — and **nothing at all when there is nothing to say**.
 *
 * The card was asked for as "a summary of it from Wikipedia if it exists (if it doesn't exist,
 * don't add an empty widget, just don't show the widget)", so it renders `null` in all three
 * empty states: the stop has no article (`data/wikipedia`), Wikipedia answered 404, or the request
 * failed — offline, blocked, slow. There is no placeholder and no "could not load" line, because a
 * card that exists only to say it has no content is the empty widget the request ruled out.
 *
 * The wait is silent for the same reason: the card is extra reading under the timetable, so it
 * appears when it arrives rather than pushing a spinner into the page for something the traveller
 * did not ask for. The session cache (`lib/wikipedia`) means a second visit to the stop draws it
 * straight away.
 */
export function WikipediaCard({ stopId }: { stopId: string }) {
  const { settings, power } = useApp();
  const language = settings.language;
  const t = useT();
  /*
   * **At a tenth of a battery, this card is not asked for at all.**
   *
   * It is the only card in the app that spends a request on somebody else's server, and what comes
   * back is a paragraph of history under a timetable. On a phone with 6% left that is the wrong
   * trade twice over: the bytes come over the radio, and the article brings an image the browser
   * then decodes and holds. The test is in the effect rather than only at the render, because an
   * effect that runs and then draws nothing has still spent the request.
   */
  const superSaving = power.mode === 'super';
  const [summary, setSummary] = useState<WikipediaSummary | null>(() =>
    cachedWikipediaSummary(stopId, language),
  );

  useEffect(() => {
    if (superSaving) return undefined;
    let live = true;
    const known = cachedWikipediaSummary(stopId, language);
    if (known) {
      setSummary(known);
      return () => {
        live = false;
      };
    }
    /* The previous language's paragraph is not this one's: clear it before asking again. */
    setSummary(null);
    fetchWikipediaSummary(stopId, language).then((next) => {
      if (live && next) setSummary(next);
    });
    return () => {
      live = false;
    };
  }, [stopId, language, superSaving]);

  if (superSaving || !summary) return null;

  return (
    <Card className="stack" data-quoted="wikipedia">
      <div className="stack-1">
        {/*
          The card is headed with **the article's own title**, not with the stop's name: the two
          are not always the same — a tram stop on the Dam opens "Dam Square", a ferry pier opens
          nothing at all — and the title is also the first two words of the paragraph below, so
          printing it as a subtitle over the paragraph read as a stutter. "From Wikipedia" is the
          line above, and it is the attribution the paragraph needs.
        */}
        <span className="field__label">{t('From Wikipedia')}</span>
        <h2 className="t-section">{summary.title}</h2>
      </div>
      <p className="t-sm">{summary.extract}</p>
      <div className="row-wrap">
        <a className="btn btn--sm" href={summary.url} target="_blank" rel="noreferrer noopener">
          {/* "Opens another page", not "send this to someone": see `external` in `ui/Icons`. */}
          <Icon name="external" size={15} />
          {t('Read the whole article')}
        </a>
      </div>
    </Card>
  );
}
