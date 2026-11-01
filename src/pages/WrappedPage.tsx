import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../state/AppState';
import { PageHeader } from '../components/layout/AppShell';
import { Button, Card, Dialog } from '../components/ui/primitives';
import { Icon } from '../components/ui/Icons';
import { useT } from '../lib/useT';
import { appNow } from '../lib/format';
import { clearTally, tallyFor, yearOf } from '../lib/wrapped';
import { buildDeck } from '../lib/wrappedDeck';
import { demoYear } from '../lib/wrappedDemo';

/**
 * **OVVO Wrapped: the year, as a deck rather than a report.**
 *
 * One card at a time, one number and one sentence, in whatever look the traveller is wearing — so
 * the Christmas look gets a Christmas-coloured year. Swipe, tap, or the arrow keys move through it;
 * the dots at the foot are a position and a way back, not a menu.
 *
 * It reads `lib/wrapped` (what the year actually holds) and `lib/wrappedDeck` (what each card says),
 * and it writes nothing of its own except the one control that empties the year. `?demo=1` reads a
 * made-up year instead, built in memory by `lib/wrappedDemo`, so the deck can be looked at in
 * November without touching what really happened.
 */
export function WrappedPage() {
  const { settings, reduceMotion } = useApp();
  const t = useT();
  const [params] = useSearchParams();
  const demo = params.get('demo') === '1';
  const now = appNow();

  /*
   * Which year the address is about: the one it names, or the year a card would be offered for
   * today. In the first week of January that is the year that just ended, which is the whole point
   * of opening it then.
   */
  const year = useMemo(() => {
    const named = Number(params.get('year'));
    if (Number.isInteger(named) && named > 2000) return named;
    if (now.getMonth() === 0) return yearOf(now.getTime()) - 1;
    return yearOf(now.getTime());
  }, [params, now]);

  const tally = useMemo(() => (demo ? demoYear(year) : tallyFor(year)), [demo, year]);
  const cards = useMemo(
    () => buildDeck({ year, tally, language: settings.language }),
    [year, tally, settings.language],
  );

  const [index, setIndex] = useState(0);
  const card = cards[Math.min(index, cards.length - 1)];
  const last = index >= cards.length - 1;
  const [confirmClear, setConfirmClear] = useState(false);
  const [cleared, setCleared] = useState(false);

  const step = (direction: 1 | -1) => {
    setIndex((current) => Math.max(0, Math.min(cards.length - 1, current + direction)));
  };

  return (
    <div className="stack-6">
      <PageHeader
        title={t('OVVO Wrapped')}
        description={
          demo
            ? t('A made-up year, for looking at the deck. Nothing here is yours.')
            : t('Your {year} in journeys you planned.', { year })
        }
        showTitle
      />

      {demo ? (
        <p className="t-sm t-muted" role="note">
          {t('Demo year: ')}
          <strong>{t('none of this is real')}</strong>
          {t(', and none of it is stored.')}
        </p>
      ) : null}

      <div
        className={`wrapped${reduceMotion ? ' wrapped--still' : ''}`}
        role="group"
        aria-roledescription={t('card deck')}
        aria-label={t('OVVO Wrapped, {year}', { year })}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight') {
            event.preventDefault();
            step(1);
          } else if (event.key === 'ArrowLeft') {
            event.preventDefault();
            step(-1);
          }
        }}
      >
        <Card
          key={card.id}
          className="wrapped__card"
          variant={card.tone === 'ink' ? 'obsidian' : 'raised'}
          aria-live="polite"
        >
          <span className="wrapped__kicker">{t(card.kicker)}</span>
          <span className="wrapped__big">{card.big}</span>
          <p className="wrapped__line">{t(card.line)}</p>
          {card.note ? <p className="wrapped__note">{t(card.note)}</p> : null}
        </Card>

        <div className="wrapped__dots" aria-label={t('Cards')}>
          {cards.map((item, position) => (
            <button
              key={item.id}
              type="button"
              className="wrapped__dot"
              aria-current={position === index ? 'true' : undefined}
              aria-label={t('Card {number} of {total}', { number: position + 1, total: cards.length })}
              onClick={() => setIndex(position)}
            />
          ))}
        </div>

        <div className="row-wrap wrapped__controls">
          <Button size="sm" onClick={() => step(-1)} disabled={index === 0}>
            {t('Back')}
          </Button>
          <Button size="sm" onClick={() => step(1)} disabled={last}>
            {t('Next')}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setIndex(cards.length - 1)} disabled={last}>
            {t('Skip to the end')}
          </Button>
        </div>
      </div>

      {last ? (
        <Card className="stack">
          <h2 className="t-section">{t('This year is yours')}</h2>
          <p className="t-sm t-muted">
            {t(
              'It lives with your saved stops and journeys, so it follows your OVVO ID to another device. Emptying it cannot be undone.',
            )}
          </p>
          {cleared ? (
            <p className="t-sm" role="status">
              <Icon name="check" size={14} /> {t('The year has been emptied.')}
            </p>
          ) : (
            <div className="row-wrap">
              <Button icon="trash" size="sm" disabled={demo} onClick={() => setConfirmClear(true)}>
                {t('Empty this year')}
              </Button>
              {demo ? <span className="t-sm t-muted">{t('Nothing to empty in a demo year.')}</span> : null}
            </div>
          )}
        </Card>
      ) : null}

      <Dialog
        open={confirmClear}
        title={t('Empty {year}?', { year })}
        description={t(
          'Every journey, board and look this year is deleted from your tally. What is already saved, your stops and journeys, stays.',
        )}
        onClose={() => setConfirmClear(false)}
        footer={
          <>
            <Button
              variant="accent"
              icon="trash"
              onClick={() => {
                clearTally();
                setCleared(true);
                setConfirmClear(false);
                setIndex(0);
              }}
            >
              {t('Empty the year')}
            </Button>
            <Button variant="ghost" onClick={() => setConfirmClear(false)}>
              {t('Keep it')}
            </Button>
          </>
        }
      />
    </div>
  );
}
