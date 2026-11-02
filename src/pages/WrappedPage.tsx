import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useHistoryBack } from '../components/layout/AppShell';
import { useApp } from '../state/AppState';
import { Button, Dialog } from '../components/ui/primitives';
import { useT } from '../lib/useT';
import { appNow } from '../lib/format';
import { clearTally, tallyFor, yearOf } from '../lib/wrapped';
import { buildStory, type Chapter } from '../lib/wrappedDeck';
import { demoYear } from '../lib/wrappedDemo';
import { Fold } from '../components/wrapped/Fold';
import { drawCard, shareCard } from '../lib/wrappedCard';
import {
  pauseScore,
  playAct,
  resumeScore,
  soundAudible,
  soundDiagnostics,
  startAct,
  stopSound,
} from '../lib/wrappedSound';
import '../styles/wrapped-film.css';

/**
 * **OVVO Wrapped: one object, one black ground, one sentence.**
 *
 * The rebuild in `WRAPPED-REBUILD.md`. Every page is the same frame of type on top of the Fold, and
 * the film changes by folding the object into a new pose rather than by sliding a slide. The colour
 * changes at act boundaries only, the music runs by act, and the share belongs to the page it is on.
 */
export function WrappedPage() {
  const { settings, reduceMotion } = useApp();
  const t = useT();
  const leave = useHistoryBack('/');
  const [params] = useSearchParams();
  const askedForDemo = params.get('demo') === '1';
  const now = appNow();

  const year = useMemo(() => {
    const named = Number(params.get('year'));
    if (Number.isInteger(named) && named > 2000) return named;
    if (now.getMonth() === 0) return yearOf(now.getTime()) - 1;
    return yearOf(now.getTime());
  }, [params, now]);

  const realTally = useMemo(() => tallyFor(year), [year]);
  const demo = askedForDemo || realTally.runs.length === 0;
  const tally = useMemo(() => (demo ? demoYear(year) : realTally), [demo, year, realTally]);
  const story = useMemo(
    () => buildStory({ year, tally, language: settings.language }),
    [year, tally, settings.language],
  );

  const [index, setIndex] = useState(0);
  const [prev, setPrev] = useState<Chapter | null>(null);
  const [started, setStarted] = useState(false);
  const [sound, setSound] = useState(true);
  const [paused, setPaused] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [audible, setAudible] = useState(false);

  const chapter: Chapter = story[Math.min(index, story.length - 1)];
  const left = useRef(0);

  useEffect(() => {
    const id = window.setInterval(() => setAudible(soundAudible()), 300);
    return () => window.clearInterval(id);
  }, []);

  const soundLabel = sound && audible ? t('Sound off') : t('Sound on');

  const go = useCallback(
    (next: number) => {
      const target = Math.max(0, Math.min(story.length - 1, next));
      if (target === index) return;
      setPrev(chapter);
      setIndex(target);
      setPaused(false);
    },
    [chapter, index, story.length],
  );

  /* The pose that just left fades under the one arriving, then is taken off the page. */
  useEffect(() => {
    if (!prev) return undefined;
    const id = window.setTimeout(() => setPrev(null), 640);
    return () => window.clearTimeout(id);
  }, [prev]);

  /*
   * **The page's own clock.**
   *
   * The song used to be the clock, which cut a piece every six seconds. Now the hold belongs to the
   * page and the music runs underneath it, by act. Pausing keeps what was left instead of starting
   * the page again.
   */
  useEffect(() => {
    left.current = chapter.hold ?? 0;
  }, [chapter.id, chapter.hold]);

  useEffect(() => {
    if (!started || paused || !chapter.hold) return undefined;
    const startAt = performance.now();
    const id = window.setTimeout(() => go(index + 1), Math.max(600, left.current));
    return () => {
      window.clearTimeout(id);
      left.current = Math.max(300, left.current - (performance.now() - startAt));
    };
  }, [started, paused, chapter.hold, index, go]);

  /* The score follows the act, never the page. */
  useEffect(() => {
    if (!sound) {
      stopSound();
      return;
    }
    if (!started) return;
    playAct(chapter.act);
  }, [sound, started, chapter.act]);

  useEffect(() => () => stopSound(), []);

  const toggleSound = () => {
    if (sound && audible) {
      setSound(false);
      stopSound();
      return;
    }
    setSound(true);
    startAct(chapter.act);
    setAudible(true);
  };

  const togglePause = () => {
    const next = !paused;
    setPaused(next);
    if (next) pauseScore();
    else resumeScore();
  };

  const shareChapter = async () => {
    if (!chapter.share) return;
    const blob = await drawCard({
      year,
      sentence: chapter.sentence,
      caption: chapter.caption,
      act: chapter.act,
    });
    if (blob) {
      await shareCard(blob, `ovvo-wrapped-${year}.png`, chapter.share);
      return;
    }
    try {
      await navigator.clipboard.writeText(chapter.share);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  const copyYear = async () => {
    const text =
      story.find((item) => item.id === 'total')?.share ??
      `My ${year} in OVVO.`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  const saveYear = async () => {
    const closing = story[story.length - 1];
    const blob = await drawCard({
      year,
      sentence: closing?.sentence ?? `That was ${year}.`,
      caption: closing?.caption ?? 'Every number here is yours.',
      act: closing?.act ?? 1,
    });
    if (blob) await shareCard(blob, `ovvo-wrapped-${year}.png`, `My ${year} in OVVO.`);
  };

  /* The keyboard is a reader's way through: arrows, space to pause, Escape to leave. */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        if (!started) {
          setStarted(true);
          startAct(1);
          go(1);
          return;
        }
        go(index + 1);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        go(index - 1);
      } else if (event.key === ' ') {
        event.preventDefault();
        togglePause();
      } else if (event.key === 'Escape') {
        leave();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const showDiagnostics = useMemo(
    () => typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('sound') === 'debug',
    [],
  );
  const [diagnostics, setDiagnostics] = useState<string[]>([]);
  useEffect(() => {
    if (!showDiagnostics) return undefined;
    const tick = () => setDiagnostics(soundDiagnostics());
    tick();
    const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
  }, [showDiagnostics]);

  const landed = useCountUp(chapter.figure?.value ?? 0, started && !reduceMotion, chapter.id, 900);

  const enter = () => {
    setStarted(true);
    setPaused(false);
    startAct(1);
    go(1);
  };

  const pose = chapter.pose;

  return (
    <div
      className={`wr-film${reduceMotion ? ' is-still' : ''}${paused ? ' is-paused' : ''}`}
      data-act={chapter.act}
      data-chapter={chapter.id}
      role="region"
      aria-label={t('OVVO Wrapped {year}', { year })}
      onPointerDown={() => {
        if (started && sound) resumeScore();
      }}
      onClick={(event) => {
        const target = event.target as HTMLElement | null;
        if (target?.closest('button, a, .wr-progress, [role="button"]')) return;
        if (!started) {
          if (event.clientX < window.innerWidth / 2) return;
          enter();
          return;
        }
        go(event.clientX >= window.innerWidth / 2 ? index + 1 : index - 1);
      }}
    >
      {prev ? (
        <Fold
          pose={prev.pose}
          wear={prev.wear}
          map={prev.map}
          hours={prev.hours}
          leaving
        />
      ) : null}
      <Fold pose={pose} wear={chapter.wear} map={chapter.map} hours={chapter.hours} />
      <span className="wr-scrim" aria-hidden="true" />

      <nav className="wr-progress" aria-hidden="true">
        {story.map((item, at) => (
          <span
            key={item.id}
            className={`wr-progress__seg${at < index ? ' is-done' : ''}${at === index ? ' is-now' : ''}`}
          >
            {at === index && chapter.hold ? (
              <i
                key={`${item.id}-${index}-${paused}`}
                style={{ animationDuration: `${chapter.hold}ms` } as CSSProperties}
              />
            ) : null}
          </span>
        ))}
      </nav>

      <header className="wr-chrome">
        <span className="wr-mark">OVVO</span>
        <div className="wr-controls">
          <button
            type="button"
            className="wr-icon"
            aria-label={paused ? t('Play the story') : t('Pause the story')}
            onClick={togglePause}
          >
            {paused ? (
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M8 5.5v13a1 1 0 0 0 1.5.87l10-6.5a1 1 0 0 0 0-1.74l-10-6.5A1 1 0 0 0 8 5.5Z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <rect x="7" y="5" width="3.6" height="14" rx="1.2" />
                <rect x="13.4" y="5" width="3.6" height="14" rx="1.2" />
              </svg>
            )}
          </button>
          <button type="button" className="wr-icon" aria-label={soundLabel} onClick={toggleSound}>
            {sound && audible ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <path d="M4 9.5h3.2L12 5.6v12.8L7.2 14.5H4z" fill="currentColor" stroke="none" />
                <path d="M16 9a4.4 4.4 0 0 1 0 6" />
                <path d="M18.6 6.6a8 8 0 0 1 0 10.8" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <path d="M4 9.5h3.2L12 5.6v12.8L7.2 14.5H4z" fill="currentColor" stroke="none" />
                <path d="m16.4 9.4 5.2 5.2M21.6 9.4l-5.2 5.2" />
              </svg>
            )}
          </button>
          <button type="button" className="wr-icon" aria-label={t('Close')} onClick={leave}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
      </header>

      {prev ? (
        <div className="wr-frame is-leaving" aria-hidden="true">
          <div className="wr-frame__inner">
            <p className="wr-sentence">{prev.sentence}</p>
            <p className="wr-caption">{prev.caption}</p>
          </div>
        </div>
      ) : null}

      <div className="wr-frame">
        <div className="wr-frame__inner">
          {chapter.id === 'cover' ? (
            <>
              <p className="wr-eyebrow">{t('OVVO Wrapped')}</p>
              <p className="wr-year">{year}</p>
              <p className="wr-caption">{t(chapter.caption)}</p>
              <button type="button" className="wr-start" onClick={enter}>
                {t('Begin')}
              </button>
            </>
          ) : (
            <>
              <p className="wr-sentence">{sentenceWithFigure(t(chapter.sentence), chapter, landed)}</p>
              <p className="wr-caption">{t(chapter.caption)}</p>

            </>
          )}
        </div>
      </div>

      {/* The closing actions live below the frame, so they can never sit on the sentence. */}
      {chapter.id === 'close' ? (
        <div className="wr-close-actions">
          <button type="button" className="wr-btn" onClick={() => void saveYear()}>
            {t('Save my year')}
          </button>
          <button type="button" className="wr-btn wr-btn--ghost" onClick={() => void copyYear()}>
            {copied ? t('Copied') : t('Copy my year')}
          </button>
          <button type="button" className="wr-btn wr-btn--ghost" onClick={() => go(0)}>
            {t('Start again')}
          </button>
          {demo ? null : (
            <button type="button" className="wr-btn wr-btn--quiet" onClick={() => setConfirmClear(true)}>
              {t('Empty this year')}
            </button>
          )}
        </div>
      ) : null}

      {chapter.share && chapter.id !== 'close' ? (
        <button type="button" className="wr-share" onClick={() => void shareChapter()}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3.6v11" />
            <path d="m8 7.2 4-3.6 4 3.6" />
            <path d="M5.2 12.4v6.2a1.8 1.8 0 0 0 1.8 1.8h10a1.8 1.8 0 0 0 1.8-1.8v-6.2" />
          </svg>
          {copied ? t('Copied') : t('Share this story')}
        </button>
      ) : null}

      {cleared ? (
        <p className="wr-toast" role="status">
          {t('The year has been emptied.')}
        </p>
      ) : null}

      {showDiagnostics ? (
        <div className="wr-diag" aria-live="polite">
          {diagnostics.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </div>
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
 * **The figure is counted, but it stays inside the sentence.**
 *
 * The reference never puts a giant number over a label: the number is a word in the sentence, so the
 * eye reads one thought. This finds the figure's own text in the sentence and replaces it with the
 * live count, keeping whatever follows it, including a percent sign.
 */
function sentenceWithFigure(sentence: string, chapter: Chapter, value: number): ReactNode {
  const figure = chapter.figure;
  if (!figure) return sentence;
  const token = String(figure.value);
  const at = sentence.indexOf(token);
  if (at < 0) return sentence;
  return (
    <>
      {sentence.slice(0, at)}
      <span className="wr-fig">
        {value}
        {figure.suffix ?? ''}
      </span>
      {sentence.slice(at + token.length)}
    </>
  );
}

/** A number that arrives rather than appearing, eased so it slows as it lands. */
function useCountUp(target: number, active: boolean, key: string, duration = 900): number {
  const [value, setValue] = useState(active ? 0 : target);
  useEffect(() => {
    if (!active) {
      setValue(target);
      return undefined;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, active, key, duration]);
  return value;
}
