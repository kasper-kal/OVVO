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
import { playChapter, startSound, stopSound, whenTrackEnds } from '../lib/wrappedSound';

/** How many dots fly out of the year's total when it lands. */
const BURST = 14;

/**
 * **OVVO Wrapped: the year as a short film, not a report.**
 *
 * Full screen, one idea at a time, and no two chapters laid out the same way. The year's total is an
 * enormous number with rings pushing out of it; the line you kept coming back to is a rail down the
 * screen with a dot running it; your hour is twenty-four bars standing on the floor with one lit and
 * breathing; the share of journeys with no changes is a ring with the number inside it; the longest
 * trip is a line shot across the whole width; the look you wore is one huge word. Colour changes with
 * the chapter, and so does the shape of the page, which is the difference between a story and a
 * slideshow.
 *
 * Movement is the story too. Chapters slide in from the side the traveller came from, the deck
 * follows their thumb while they drag, numbers count, bars grow, the rail draws itself and then runs,
 * and the ring sweeps. Nothing is on a timer: the traveller sets the pace, and stopping to look at a
 * number is not punished by the deck moving on without them.
 *
 * The score is ten licensed pieces, one per chapter (`lib/wrappedSound`), and it never plays before
 * a tap: the cover's Begin is the gesture that starts it, Skip the sound starts the story in
 * silence, and the switch in the corner silences it for the session.
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
  const [dir, setDir] = useState(1);
  const [started, setStarted] = useState(false);
  const [sound, setSound] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [copied, setCopied] = useState(false);

  const chapter: Chapter = story[Math.min(index, story.length - 1)];
  const last = index >= story.length - 1;
  const progress = story.length > 1 ? index / (story.length - 1) : 0;

  /* Which way the story is moving, so a chapter arrives from the side the traveller came from. */
  const go = useCallback(
    (next: number) => {
      const target = Math.max(0, Math.min(story.length - 1, next));
      setDir(target < index ? -1 : 1);
      setIndex(target);
    },
    [index, story.length],
  );
  const step = useCallback((direction: number) => go(index + direction), [go, index]);

  /*
   * Every chapter brings its own piece of music, crossfading in under the one before it.
   *
   * The chapter after this one is handed over as a hint, so it is already on the phone by the time
   * the traveller swipes: the story should never wait for a song.
   */
  useEffect(() => {
    if (!started) return;
    playChapter(chapter.track, story[index + 1]?.track);
  }, [index, started, chapter.track, story]);

  /*
   * **The story keeps time with the music.**
   *
   * Every chapter is scored, so its song is its clock: when the song ends the deck turns the page by
   * itself, which is what makes the story watchable without touching it. Swiping still works and
   * jumps the story ahead of the score; muting stops the clock, because the song is what was doing
   * the counting. A song that will not load never ends, so that chapter waits for a swipe rather
   * than racing past unseen.
   */
  useEffect(() => {
    whenTrackEnds(() => {
      if (!started || last) return;
      go(index + 1);
    });
    return () => whenTrackEnds(null);
  }, [go, index, last, started]);

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
  const [dragX, setDragX] = useState(0);
  const dragStart = useRef(0);

  const count = useCountUp(chapter.count ?? 0, started && !reduceMotion, chapter.id);

  /*
   * **What gets copied is a sentence, not a chapter.**
   *
   * It used to be glued together from a chapter's own line, which is written to sit under a big
   * number ("21") and therefore leaves the number out: the copy read "times from Amsterdam Centraal
   * to Haarlem Station." with nothing in front of it. A share is read on its own, in somebody else's
   * chat, so it says everything it needs in one line.
   */
  const share = async () => {
    const route = story.find((item) => item.kind === 'route');
    const text = route?.route
      ? t('In {year} I planned {count} journeys with OVVO. {times} of them were {from} to {to}.', {
          year,
          count: tally.runs.length,
          times: route.route.count,
          from: route.route.from,
          to: route.route.to,
        })
      : t('In {year} I planned {count} journeys with OVVO.', { year, count: tally.runs.length });
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
      data-chapter={chapter.id}
      style={{ '--progress': progress } as CSSProperties}
      role="region"
      aria-label={t('OVVO Wrapped {year}', { year })}
      onPointerDown={(event) => {
        dragStart.current = event.clientX;
        setDrag(event.clientX);
        setDragX(0);
      }}
      onPointerMove={(event) => {
        if (drag === null) return;
        setDragX(event.clientX - dragStart.current);
      }}
      onPointerUp={(event) => {
        if (drag === null) return;
        const dx = event.clientX - dragStart.current;
        setDrag(null);
        setDragX(0);
        if (Math.abs(dx) < 60) return;
        step(dx < 0 ? 1 : -1);
      }}
      onPointerCancel={() => {
        setDrag(null);
        setDragX(0);
      }}
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
              startSound(chapter.track, story[index + 1]?.track);
              setSound(true);
            }
          }}
        >
          <span>{sound ? t('Sound on') : t('Sound off')}</span>
        </button>
      </header>

      {/* The thumb moves the chapter, not just the result: the deck leans with the drag. */}
      <div
        className={`wrapped-scene${drag !== null ? ' is-dragging' : ''}`}
        style={{ '--drag': reduceMotion ? 0 : dragX } as CSSProperties}
      >
        <div
          className={`wrapped-body wrapped-body--${chapter.kind}`}
          data-chapter={chapter.id}
          data-dir={dir}
          key={chapter.id}
        >
          {chapter.kind === 'cover' ? (
            <>
              <span className="wrapped-orbit" aria-hidden="true" />
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
                  <strong>{t('Demo year:')}</strong> {t('none of this is real, and none of it is stored.')}
                </p>
              ) : null}
              <div className="wrapped-actions" style={{ '--i': 4 } as CSSProperties}>
                <Button
                  variant="accent"
                  size="md"
                  onClick={() => {
                    setStarted(true);
                    startSound(chapter.track, story[1]?.track);
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
            </>
          ) : (
            <>
              <span className="wrapped-kicker" style={{ '--i': 0 } as CSSProperties}>
                {t(chapter.kicker)}
              </span>

              {chapter.kind === 'arc' ? (
                <div className="wrapped-arc" style={{ '--arc': chapter.arc ?? 0, '--i': 1 } as CSSProperties}>
                  <span className="wrapped-arc__spark" aria-hidden="true" />
                  <p className="wrapped-big wrapped-big--in">{count}%</p>
                </div>
              ) : chapter.kind === 'route' ? null : (
                <p className="wrapped-big" style={{ '--i': 1 } as CSSProperties}>
                  {chapter.kind === 'word' || chapter.count === undefined ? chapter.big : count}
                </p>
              )}

              {chapter.kind === 'word' && chapter.count !== undefined ? (
                <p className="wrapped-days" style={{ '--i': 2 } as CSSProperties}>
                  {count}
                  <span>{chapter.count === 1 ? t('day') : t('days')}</span>
                </p>
              ) : null}

              {chapter.kind === 'number' && chapter.dots ? (
                <span className="wrapped-field" aria-hidden="true">
                  {Array.from({ length: Math.min(chapter.dots, 700) }, (_, dot) => (
                    <i key={dot} style={{ '--i': dot } as CSSProperties} />
                  ))}
                </span>
              ) : null}

              {chapter.kind === 'number' ? (
                <>
                  <span className="wrapped-rings" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </span>
                  <span className="wrapped-burst" aria-hidden="true">
                    {Array.from({ length: BURST }, (_, dot) => (
                      <i key={dot} style={{ '--i': dot } as CSSProperties} />
                    ))}
                  </span>
                </>
              ) : null}

              {/*
                * The markers are children of the rail, not of the labels: drawn on the labels they
                * were placed from a different origin and sat four pixels off the line, which is the
                * kind of thing nobody notices until somebody does.
                */}
              {chapter.kind === 'route' && chapter.route ? (
                <div className="wrapped-route" style={{ '--i': 2 } as CSSProperties}>
                  <span className="wrapped-route__rail" aria-hidden="true">
                    <span className="wrapped-route__train" />
                  </span>
                  <span className="wrapped-route__dot wrapped-route__dot--start" aria-hidden="true" />
                  <span className="wrapped-route__dot wrapped-route__dot--end" aria-hidden="true" />
                  <span className="wrapped-route__count">
                    {count}
                    <i>{t(chapter.line)}</i>
                  </span>
                  <span className="wrapped-route__from">{chapter.route.from}</span>
                  <span className="wrapped-route__to">{chapter.route.to}</span>
                </div>
              ) : null}

              {chapter.kind === 'bars' && chapter.bars ? (
                <>
                  <span className="wrapped-ruler" aria-hidden="true">
                    <i>00</i>
                    <i>06</i>
                    <i>12</i>
                    <i>18</i>
                    <i>23</i>
                  </span>
                  <div className="wrapped-bars" style={{ '--i': 1 } as CSSProperties} aria-hidden="true">
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
                </>
              ) : null}

              {chapter.kind === 'stretch' && chapter.route ? (
                <div className="wrapped-stretch" style={{ '--i': 2 } as CSSProperties}>
                  <span className="wrapped-stretch__line" aria-hidden="true" />
                  <span className="wrapped-stretch__dot" aria-hidden="true" />
                  <span className="wrapped-stretch__from">{chapter.route.from}</span>
                  <span className="wrapped-stretch__end">{chapter.route.to}</span>
                </div>
              ) : null}

              {chapter.chips?.length ? (
                <ul className="wrapped-chips">
                  {chapter.chips.map((chip, position) => (
                    <li
                      key={chip.label}
                      className="wrapped-chip"
                      style={{ '--i': position } as CSSProperties}
                    >
                      <span>{chip.label}</span>
                      <strong>{chip.detail}</strong>
                    </li>
                  ))}
                </ul>
              ) : null}

              {chapter.kind === 'word' && chapter.photo ? (
                <img
                  className="wrapped-photo"
                  src={chapter.photo}
                  alt=""
                  aria-hidden="true"
                  onError={(event) => {
                    event.currentTarget.style.display = 'none';
                  }}
                />
              ) : null}

              {/* The rail prints its own two stations, so it has no sentence to add. */}
              {chapter.kind === 'route' ? null : (
                <p className="wrapped-line" style={{ '--i': 3 } as CSSProperties}>
                  {t(chapter.line)}
                </p>
              )}

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
      </div>

      {started || chapter.kind !== 'cover' ? (
        <footer className="wrapped-foot">
          <span className="wrapped-count" aria-live="polite">
            {index + 1} / {story.length}
          </span>

          {last ? (
            <div className="wrapped-actions wrapped-foot__actions">
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
          ) : null}
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
