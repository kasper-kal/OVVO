import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../state/AppState';
import { Button, Dialog } from '../components/ui/primitives';
import { Icon } from '../components/ui/Icons';
import { useT } from '../lib/useT';
import { appNow } from '../lib/format';
import { clearTally, tallyFor, yearOf } from '../lib/wrapped';
import { buildStory, type Chapter } from '../lib/wrappedDeck';
import { demoYear } from '../lib/wrappedDemo';
import { chime, startSound, stopSound } from '../lib/wrappedSound';

/**
 * **OVVO Wrapped: the year as a short film, not a report.**
 *
 * Full screen, one idea at a time, each chapter in its own colour with its own visual: a route that
 * draws itself, twenty-four bars with one hour lit, an arc that fills to the share of journeys that
 * needed no change. Numbers count up as they arrive, the deck advances on a swipe, a tap, the arrow
 * keys or the arrow at the foot, and a progress line at the top says how much of the year is left.
 *
 * Ten chapters is about two and a half minutes of reading, which is the length of a story rather
 * than the length of a form. Nothing is on a timer: the traveller sets the pace, and stopping to
 * look at a number is not punished by the deck moving on without them.
 *
 * Sound is synthesised (`lib/wrappedSound`), never a recording, and never before a tap: the cover's
 * button is the gesture that starts it, and the switch beside it silences it for the session.
 */
export function WrappedPage() {
  const { settings, reduceMotion } = useApp();
  const t = useT();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const demo = params.get('demo') === '1';
  const now = appNow();

  const year = useMemo(() => {
    const named = Number(params.get('year'));
    if (Number.isInteger(named) && named > 2000) return named;
    if (now.getMonth() === 0) return yearOf(now.getTime()) - 1;
    return yearOf(now.getTime());
  }, [params, now]);

  const tally = useMemo(() => (demo ? demoYear(year) : tallyFor(year)), [demo, year]);
  const story = useMemo(
    () => buildStory({ year, tally, language: settings.language }),
    [year, tally, settings.language],
  );

  const [index, setIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [sound, setSound] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [copied, setCopied] = useState(false);

  const chapter: Chapter = story[Math.min(index, story.length - 1)];
  const last = index >= story.length - 1;
  const progress = story.length > 1 ? index / (story.length - 1) : 0;

  const go = useCallback(
    (next: number) => {
      setIndex(Math.max(0, Math.min(story.length - 1, next)));
    },
    [story.length],
  );
  const step = useCallback(
    (direction: number) => {
      setIndex((current) => {
        const next = Math.max(0, Math.min(story.length - 1, current + direction));
        return next;
      });
    },
    [story.length],
  );

  /* Every chapter announces itself once, quietly, in the score rather than in the layout. */
  useEffect(() => {
    if (!started) return;
    chime(index);
  }, [index, started]);

  /* The keyboard is a reader's way through: arrows, Escape to leave. */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        step(1);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        step(-1);
      } else if (event.key === 'Escape') {
        navigate('/');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate, step]);

  /* Closing the deck closes the score with it; nothing keeps playing behind another screen. */
  useEffect(() => () => stopSound(), []);

  const [drag, setDrag] = useState<number | null>(null);
  const dragStart = useRef(0);

  const count = useCountUp(chapter.count ?? 0, started && !reduceMotion, chapter.id);

  const share = async () => {
    const route = story.find((item) => item.kind === 'route');
    const text = t('In {year} I planned {count} journeys with OVVO.{route}', {
      year,
      count: tally.runs.length,
      route: route?.line ? ` ${route.line}` : '',
    });
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className={`wrapped-stage wrapped-stage--${chapter.tone}${reduceMotion ? ' is-still' : ''}`}
      style={{ '--progress': progress } as CSSProperties}
      role="region"
      aria-label={t('OVVO Wrapped {year}', { year })}
      onPointerDown={(event) => {
        dragStart.current = event.clientX;
        setDrag(event.clientX);
      }}
      onPointerUp={(event) => {
        if (drag === null) return;
        const dx = event.clientX - dragStart.current;
        setDrag(null);
        if (Math.abs(dx) < 60) return;
        step(dx < 0 ? 1 : -1);
      }}
      onPointerCancel={() => setDrag(null)}
    >
      <span className="wrapped-grain" aria-hidden="true" />
      <span className="wrapped-blob wrapped-blob--a" aria-hidden="true" />
      <span className="wrapped-blob wrapped-blob--b" aria-hidden="true" />

      <header className="wrapped-top">
        <button type="button" className="wrapped-close" onClick={() => navigate('/')} aria-label={t('Close')}>
          <Icon name="close" size={20} />
        </button>
        <div className="wrapped-track" aria-hidden="true">
          <span className="wrapped-track__fill" />
        </div>
        <button
          type="button"
          className="wrapped-sound"
          aria-pressed={sound}
          onClick={() => {
            if (sound) {
              stopSound();
              setSound(false);
            } else {
              startSound();
              setSound(true);
            }
          }}
        >
          <span>{sound ? t('Sound on') : t('Sound off')}</span>
        </button>
      </header>

      <div className="wrapped-body" key={chapter.id}>
        {chapter.kind === 'cover' ? (
          <div className="wrapped-cover">
            <span className="wrapped-kicker" style={{ '--i': 0 } as CSSProperties}>
              {t(chapter.kicker)}
            </span>
            <h1 className="wrapped-title" style={{ '--i': 1 } as CSSProperties}>
              {chapter.big}
            </h1>
            <p className="wrapped-line" style={{ '--i': 2 } as CSSProperties}>
              {t(chapter.line)}
            </p>
            {demo ? (
              <p className="wrapped-demo" style={{ '--i': 3 } as CSSProperties}>
                <strong>{t('Demo year')}</strong> {t('none of this is real, and none of it is stored.')}
              </p>
            ) : null}
            <div className="wrapped-actions" style={{ '--i': 4 } as CSSProperties}>
              <Button
                variant="accent"
                size="md"
                onClick={() => {
                  setStarted(true);
                  startSound();
                  setSound(true);
                  go(1);
                }}
              >
                {t('Begin')}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => go(1)}>
                {t('Skip the sound')}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <span className="wrapped-kicker" style={{ '--i': 0 } as CSSProperties}>
              {t(chapter.kicker)}
            </span>
            <p className="wrapped-big" style={{ '--i': 1 } as CSSProperties}>
              {chapter.count !== undefined ? count : chapter.big}
            </p>
            <p className="wrapped-line" style={{ '--i': 2 } as CSSProperties}>
              {t(chapter.line)}
            </p>
            {chapter.kind === 'route' && chapter.route ? (
              <div className="wrapped-route" style={{ '--i': 3 } as CSSProperties}>
                <span className="wrapped-route__dot" />
                <span className="wrapped-route__line" aria-hidden="true" />
                <span className="wrapped-route__dot wrapped-route__dot--end" />
                <span className="wrapped-route__from">{chapter.route.from}</span>
                <span className="wrapped-route__to">{chapter.route.to}</span>
              </div>
            ) : null}
            {chapter.kind === 'bars' && chapter.bars ? (
              <div className="wrapped-bars" style={{ '--i': 3 } as CSSProperties} aria-hidden="true">
                {chapter.bars.map((value, hour) => (
                  <span
                    key={hour}
                    className={`wrapped-bars__bar${hour === chapter.peak ? ' is-peak' : ''}`}
                    style={
                      {
                        height: `${Math.max(4, (value / Math.max(1, ...(chapter.bars ?? [1]))) * 100)}%`,
                        '--i': hour,
                      } as CSSProperties
                    }
                  />
                ))}
              </div>
            ) : null}
            {chapter.kind === 'arc' ? (
              <div
                className="wrapped-arc"
                style={{ '--arc': chapter.arc ?? 0, '--i': 3 } as CSSProperties}
                aria-hidden="true"
              />
            ) : null}
            {chapter.chips?.length ? (
              <ul className="wrapped-chips" style={{ '--i': 3 } as CSSProperties}>
                {chapter.chips.map((chip) => (
                  <li key={chip.label} className="wrapped-chip">
                    <span>{chip.label}</span>
                    <strong>{chip.detail}</strong>
                  </li>
                ))}
              </ul>
            ) : null}
            {chapter.hearts || chapter.boards ? (
              <p className="wrapped-aside" style={{ '--i': 4 } as CSSProperties}>
                {t('{hearts} stops hearted, {boards} boards pinned.', {
                  hearts: chapter.hearts ?? 0,
                  boards: chapter.boards ?? 0,
                })}
              </p>
            ) : null}
            {chapter.note ? (
              <p className="wrapped-note" style={{ '--i': 4 } as CSSProperties}>
                {t(chapter.note)}
              </p>
            ) : null}
          </>
        )}
      </div>

      {started || chapter.kind !== 'cover' ? (
        <footer className="wrapped-foot">
          <button
            type="button"
            className="wrapped-step"
            onClick={() => step(-1)}
            disabled={index === 0}
            aria-label={t('Previous chapter')}
          >
            <Icon name="chevronLeft" size={20} />
          </button>

          {last ? (
            <div className="wrapped-actions">
              <Button variant="accent" size="sm" icon="bookmark" onClick={() => void share()}>
                {copied ? t('Copied') : t('Copy my year')}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => go(0)}>
                {t('Start again')}
              </Button>
              {demo ? null : (
                <Button variant="ghost" size="sm" icon="trash" onClick={() => setConfirmClear(true)}>
                  {t('Empty this year')}
                </Button>
              )}
            </div>
          ) : (
            <button
              type="button"
              className="wrapped-step wrapped-step--next"
              onClick={() => step(1)}
              aria-label={t('Next chapter')}
            >
              <Icon name="chevronRight" size={20} />
            </button>
          )}

          <span className="wrapped-count" aria-live="polite">
            {index + 1} / {story.length}
          </span>
        </footer>
      ) : null}

      {cleared ? (
        <p className="wrapped-toast" role="status">
          <Icon name="check" size={14} /> {t('The year has been emptied.')}
        </p>
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
                go(0);
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

/**
 * **A number that arrives rather than appearing.**
 *
 * Over just under a second, eased so it slows as it lands: the eye follows the count and reads the
 * final figure as the end of a movement. It runs again for each chapter (keyed on `id`), because a
 * figure that arrived once and stayed would be the same number nine times.
 *
 * Reduced motion gets the answer immediately, which is the whole point of the setting.
 */
function useCountUp(target: number, active: boolean, key: string): number {
  const [value, setValue] = useState(active ? 0 : target);
  useEffect(() => {
    if (!active) {
      setValue(target);
      return undefined;
    }
    let frame = 0;
    const start = performance.now();
    const duration = 850;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, active, key]);
  return value;
}
