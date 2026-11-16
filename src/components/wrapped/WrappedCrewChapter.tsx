import { useId, useMemo, useState } from 'react';
import { Button } from '../ui/primitives';
import { useT } from '../../lib/useT';
import { decodeCrewCode, encodeCrewCode } from '../../lib/wrappedCrew';
import type { CrewSummary } from '../../lib/wrappedDeck';

/*
 * **A group-chat comparison with no profile behind it.**
 *
 * The code is a handful of aggregates: how many journeys, the top line, the traveller name, the
 * theme era and up to five line names. No station, address, account or exact place is encoded.
 * The comparison is decoded in this browser and never sent anywhere, so the friend's year stays
 * theirs too.
 */
export function WrappedCrewChapter({ crew }: { crew: CrewSummary }) {
  const t = useT();
  const inputId = useId();
  const code = useMemo(() => encodeCrewCode(crew), [crew]);
  const [entry, setEntry] = useState('');
  const [friend, setFriend] = useState<CrewSummary | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setMessage(t('Crew code copied'));
    } catch {
      setMessage(t('Could not copy the code'));
    }
  };

  const shareCode = async () => {
    setMessage('');
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({
          title: t('Compare our OVVO Wrapped years'),
          text: t('My OVVO Wrapped crew code: {code}', { code }),
        });
        return;
      }
      await copyCode();
    } catch (shareError) {
      if ((shareError as Error)?.name !== 'AbortError') setMessage(t('Could not share the code'));
    }
  };

  const compare = () => {
    const next = decodeCrewCode(entry);
    if (!next) {
      setError(t('That does not look like an OVVO crew code.'));
      setFriend(null);
      return;
    }
    setError('');
    setEntry('');
    setFriend(next);
  };

  const overlap = friend
    ? [...new Set([crew.topLine, ...crew.lines].filter((line): line is string => Boolean(line)))].filter(
        (line) => friend.lines.includes(line) || friend.topLine === line,
      )
    : [];

  return (
    <section className="wrapped-crew" aria-label={t('Travel crew comparison')}>
      <div className="wrapped-crew__code">
        <span className="wrapped-crew__label">{t('Your crew code')}</span>
        <code>{code}</code>
        <div className="wrapped-crew__actions">
          <Button variant="accent" size="sm" icon="share" onClick={() => void copyCode()}>
            {t('Copy code')}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => void shareCode()}>
            {t('Share code')}
          </Button>
        </div>
      </div>

      <div className="wrapped-crew__entry">
        <label htmlFor={inputId}>{t('Compare with a friend')}</label>
        <div className="wrapped-crew__input-row">
          <input
            id={inputId}
            value={entry}
            onChange={(event) => {
              setEntry(event.target.value);
              setError('');
            }}
            placeholder={t('Paste their crew code')}
            autoComplete="off"
            spellCheck={false}
          />
          <Button size="sm" onClick={compare} disabled={!entry.trim()}>
            {t('Compare')}
          </Button>
        </div>
        {error ? (
          <p className="wrapped-crew__error" role="status">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="wrapped-crew__message" role="status">
            {message}
          </p>
        ) : null}
      </div>

      {friend ? (
        <div className="wrapped-crew__result">
          <div className="wrapped-crew__versus-head" aria-hidden="true">
            <span />
            <strong>{t('You')}</strong>
            <strong>{t('Them')}</strong>
          </div>
          <ul className="wrapped-crew__rows">
            <li>
              <span>{t('Journeys')}</span>
              <strong>{crew.journeys}</strong>
              <strong>{friend.journeys}</strong>
            </li>
            <li>
              <span>{t('Top line')}</span>
              <strong>{crew.topLine ?? t('No line')}</strong>
              <strong>{friend.topLine ?? t('No line')}</strong>
            </li>
            <li>
              <span>{t('Traveller type')}</span>
              <strong>{crew.traveller ?? t('Unnamed')}</strong>
              <strong>{friend.traveller ?? t('Unnamed')}</strong>
            </li>
            <li>
              <span>{t('Theme era')}</span>
              <strong>{crew.era ?? t('No era')}</strong>
              <strong>{friend.era ?? t('No era')}</strong>
            </li>
          </ul>
          <p className="wrapped-crew__overlap">
            <strong>{overlap.length ? t('Shared lines') : t('No overlap yet')}</strong>{' '}
            {overlap.length ? overlap.join(' · ') : t('None in your top five lines.')}
          </p>
        </div>
      ) : null}

      <p className="wrapped-crew__privacy">
        {t('Only journeys, top line, traveller type, theme era and shared line names travel in the code. No addresses or exact home stations.')}
      </p>
    </section>
  );
}
