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
import {
  playChapter,
  scoreProgress,
  scoreTime,
  startSound,
  stopSound,
  whenTrackEnds,
} from '../lib/wrappedSound';
import { cardData, shareCardImage, type CardData } from '../lib/wrappedCard';
import { barMs, beatAt, beatMs } from '../lib/wrappedBeats';

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
 * Ten chapters, not ten pages. The progress bar went, because a bar across the top is a document; the
 * count stayed, because a traveller wants to know how far in they are. Each chapter carries its own
 * number in its own type, and each one enters its own way — a wipe, a rise from the floor, a deal, a
 * zoom, a cut.
 *
 * Movement is the story too, and it runs on the song rather than beside it: the cover's dot goes
 * round its ring once a bar, the year's journeys fill in on the beat, the rail's train steps down it,
 * the tickets lift in turn, the hours light one after another, the dial turns, the long haul's dot
 * patrols its line and the board catches a little light. Each of those is one hand-written animation
 * timed from the tempo measured in the audio, so it is smooth instead of a twitch per beat, and two
 * chapters are left deliberately still.
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
  /* The score is on by default: Begin plays it unless the traveller has muted it first. */
  const [sound, setSound] = useState(true);
  const [confirmClear, setConfirmClear] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [shareState, setShareState] = useState<'idle' | 'busy' | 'done'>('idle');

  const chapter: Chapter = story[Math.min(index, story.length - 1)];
  const last = index >= story.length - 1;

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

  /*
   * **Where the song is, read once and then left to the browser.**
   *
   * `--beat-ms` and `--bar-ms` are this chapter's measured tempo, and `--phase` is how far into a
   * beat the music already was when the chapter arrived, so its animations open in step instead of
   * from zero. The engine is not asked again: the stylesheet's animations run on their own, which is
   * the difference between movement and a page twitching twice a second.
   */
  const beat = useBeatAnchor(started && sound, chapter.track, chapter.id);
  const armed = beat !== null && beat.key === chapter.id;
  const onBeat = armed && !reduceMotion;
  const land = barMs(chapter.track) * 2;

  const count = useCountUp(chapter.count ?? 0, started && !reduceMotion, chapter.id, land);

  /*
   * **The share is the card, not the words.**
   *
   * It used to copy a sentence to the clipboard, which nobody pastes anywhere. The last screen now
   * draws the year as a 1080-wide picture and hands that to the phone's share sheet, with a download
   * behind it for a browser that cannot share files. The figures are the ones the chapters printed,
   * so the picture and the screen never disagree.
   */
  const card = useMemo(() => cardData(story, year), [story, year]);

  const shareYear = async () => {
    if (shareState === 'busy') return;
    setShareState('busy');
    try {
      await shareCardImage(card);
      setShareState('done');
      window.setTimeout(() => setShareState('idle'), 2800);
    } catch {
      setShareState('idle');
    }
  };

  /* The segment for this chapter fills with the song; written to the node, never through state. */
  const progress = useRef<HTMLElement | null>(null);
  useSegmentFill(progress, started && !last);

  return (
    <div
      className={`wrapped-stage wrapped-stage--${chapter.tone}${reduceMotion ? ' is-still' : ''}${
        onBeat ? ' is-beat' : ''
      }`}
      data-chapter={chapter.id}
      style={
        {
          '--beat-ms': `${beatMs(chapter.track)}ms`,
          '--bar-ms': `${barMs(chapter.track)}ms`,
          '--beat-phase': `${armed && beat ? beat.beatPhase : 0}ms`,
          '--bar-phase': `${armed && beat ? beat.barPhase : 0}ms`,
        } as CSSProperties
      }
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
        if (Math.abs(dx) >= 60) {
          step(dx < 0 ? 1 : -1);
          return;
        }
        /*
         * **A tap is a tap to move.**
         *
         * Every story a traveller has ever held moves on a tap: the right of the screen goes on, the
         * left goes back. The deck only listened for a swipe, so a tap did nothing and the story felt
         * stuck between the two. The cover is the exception, because Begin is the gesture that starts
         * the score and a tap that skips it would start the story in silence.
         */
        if (chapter.kind === 'cover') return;
        const target = event.target;
        if (target instanceof Element && target.closest('button, a, input, select, textarea, [role="button"]')) {
          return;
        }
        step(event.clientX < window.innerWidth * 0.28 ? -1 : 1);
      }}
      onPointerCancel={() => {
        setDrag(null);
        setDragX(0);
      }}
    >
      {/*
        * Ten segments: how long the story is, how far in you are, and how much of this chapter's song
        * is left. The old deck removed the count when it removed the progress bar, which left the
        * story with no sense of its own length.
        */}
      <nav className="wrapped-progress" ref={progress} aria-hidden="true">
        {story.map((item, which) => (
          <i
            key={item.id}
            className={which < index ? 'is-done' : which === index ? 'is-now' : undefined}
          />
        ))}
      </nav>

      {/* One continuous light under every chapter: it drifts and breathes for as long as the chapter runs. */}
      <span className="wrapped-aurora" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>

      {/* The look's own photograph, behind everything, when that look has one. */}
      {chapter.kind === 'word' && chapter.photo ? (
        <span className="wrapped-photo-wrap" aria-hidden="true">
          <img
            className="wrapped-photo"
            src={chapter.photo}
            alt=""
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
          />
        </span>
      ) : null}

      <header className="wrapped-top">
        <button type="button" className="wrapped-close" onClick={() => navigate('/')} aria-label={t('Close')}>
          <Icon name="close" size={20} />
        </button>
        {/*
          * **The switch says what is true, with a light that cannot be misread.**
          *
          * It used to name the tap instead, reading "Sound off" while the score was playing. Read as a
          * state, that made a traveller tap it -- which silenced the music -- and then Begin started the
          * story in silence, because the score had been turned off before the first screen. The words
          * now describe the score, the light beside them shows it, and `aria-pressed` says it out loud.
        */}
        <button
          type="button"
          className="wrapped-sound"
          aria-pressed={sound}
          aria-label={sound ? t('Sound on') : t('Sound off')}
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
          <i className="wrapped-sound__led" aria-hidden="true" />
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
                    /* On by default, so Begin starts the score unless it was muted before the tap. */
                    /*
                     * **The score starts on the chapter you land on.**
                     *
                     * Begin used to start the cover's track and then turn the page, whose effect started
                     * the first chapter's track a moment later: two songs fetched, one faded out before a
                     * note of it was heard, and a race for the same two players. One press, one song.
                     */
                    if (sound) startSound(story[1]?.track ?? chapter.track, story[2]?.track);
                    go(1);
                  }}
                >
                  {t('Begin')}
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
                  {/* The same twenty-four columns as the pillars, so no label floats off its hour. */}
                  <span className="wrapped-ruler" aria-hidden="true">
                    {[0, 6, 12, 18, 23].map((hour) => (
                      <i key={hour} style={{ gridColumnStart: hour + 1 } as CSSProperties}>
                        {String(hour).padStart(2, '0')}
                      </i>
                    ))}
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
                    <Chip
                      key={chip.label}
                      label={chip.label}
                      detail={chip.detail}
                      index={position}
                      counting={chapter.id === 'lines'}
                      rowDelay={position * barMs(chapter.track)}
                    />
                  ))}
                </ul>
              ) : null}

              {/* The rail prints its own two stations, and the look prints its own days. */}
              {chapter.kind === 'route' || chapter.kind === 'word' ? null : (
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

              {/* The last screen is the thing you can send, laid out the way the shared picture is. */}
              {chapter.kind === 'close' ? <SummaryCard data={card} /> : null}
            </>
          )}
        </div>
      </div>

      {started || chapter.kind !== 'cover' ? (
        <footer className="wrapped-foot">
          {chapter.kind === 'cover' ? null : (
            <span
              className="wrapped-chapter"
              role="status"
              aria-label={t('Chapter {n} of {total}', { n: index + 1, total: story.length })}
            >
              {String(index + 1).padStart(2, '0')} / {story.length}
            </span>
          )}

          {last ? (
            <div className="wrapped-actions wrapped-foot__actions">
              <Button variant="accent" size="sm" icon="bookmark" onClick={() => void shareYear()}>
                {shareState === 'done' ? t('Saved') : t('Share my year')}
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
function useCountUp(target: number, active: boolean, key: string, duration = 850): number {
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

/**
 * **Where the song is, sampled once per chapter.**
 *
 * The measure is taken at the moment the music is genuinely playing, not when the chapter mounted: a
 * page laid down a frame early would open its animations a frame out of step. What comes back is how
 * far into a beat the track already was, in milliseconds, which the stylesheet turns into a negative
 * delay so every animation starts in phase.
 *
 * It is deliberately not a loop. Asking the audio where it is sixty times a second and re-timing the
 * page from the answer is what made the first version stutter: every sample landed a few milliseconds
 * from the last, and the movement chased the error instead of riding the music.
 */
function useBeatAnchor(
  active: boolean,
  track: Chapter['track'],
  key: string,
): { key: string; beatPhase: number; barPhase: number } | null {
  const [anchor, setAnchor] = useState<{ key: string; beatPhase: number; barPhase: number } | null>(null);
  useEffect(() => {
    if (!active) {
      setAnchor(null);
      return undefined;
    }
    let frame = 0;
    let stop = false;
    const find = () => {
      if (stop) return;
      const at = scoreTime();
      if (at && at.track === track && at.seconds > 0.04) {
        const { index, phase } = beatAt(track, at.seconds);
        const beat = beatMs(track);
        setAnchor({
          key,
          beatPhase: phase * beat,
          /* Which beat of the bar we are in, so a movement can tick a quarter turn per beat. */
          barPhase: ((index % 4) + phase) * beat,
        });
        return;
      }
      frame = requestAnimationFrame(find);
    };
    frame = requestAnimationFrame(find);
    return () => {
      stop = true;
      cancelAnimationFrame(frame);
    };
  }, [active, track, key]);
  return anchor;
}

/**
 * **A board row that counts its own number.**
 *
 * The board's counts used to be printed and left there, so the one chapter about lines did not count
 * anything while every other chapter's figure climbed. Each row now counts up on its own bar, one row
 * after another, so the board fills in time with the music instead of arriving finished. A row that
 * is not a number (a name, a platform) is printed as it always was.
 */
function Chip({
  label,
  detail,
  index,
  counting,
  rowDelay,
}: {
  label: string;
  detail: string;
  index: number;
  counting: boolean;
  rowDelay: number;
}) {
  const target = Number(detail);
  const numeric = Number.isFinite(target) && detail.trim() !== '';
  /* A counting row starts at zero; a printed row starts at its number. */
  const [shown, setShown] = useState(counting && numeric ? 0 : numeric ? target : 0);

  useEffect(() => {
    if (!counting || !numeric) {
      setShown(numeric ? target : 0);
      return undefined;
    }
    let frame = 0;
    let started = 0;
    const tick = (now: number) => {
      if (!started) started = now;
      const progress = Math.min(1, (now - started) / 620);
      setShown(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    const timer = window.setTimeout(() => {
      frame = requestAnimationFrame(tick);
    }, rowDelay);
    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [counting, numeric, target, rowDelay]);

  return (
    <li className="wrapped-chip" style={{ '--i': index } as CSSProperties}>
      <span className="wrapped-chip__rank">{String(index + 2).padStart(2, '0')}</span>
      <span className="wrapped-chip__name">{label}</span>
      <strong>{numeric ? (counting ? shown : target) : detail}</strong>
    </li>
  );
}

/**
 * **The segment fills with the song.**
 *
 * Reading the audio sixty times a second and putting the answer in React state would re-render the
 * whole story sixty times a second. This writes one custom property straight onto the node instead,
 * which is a single style write, and the stylesheet does the rest.
 */
function useSegmentFill(ref: { current: HTMLElement | null }, active: boolean): void {
  useEffect(() => {
    if (!active) return undefined;
    let frame = 0;
    const tick = () => {
      const node = ref.current;
      if (node) {
        const percent = scoreProgress();
        node.style.setProperty('--p', percent === null ? '0' : percent.toFixed(4));
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, ref]);
}

/**
 * **The card you can send.**
 *
 * The same four figures the chapters printed, on the same dark ground, laid out in the shape of the
 * picture the share button draws. What the traveller sees on the last screen is a preview of what
 * lands in their camera roll, rather than a goodbye paragraph with a button under it.
 */
function SummaryCard({ data }: { data: CardData }) {
  return (
    <div className="wrapped-card">
      <span className="wrapped-card__brand">OVVO Wrapped {data.year}</span>
      <span className="wrapped-card__tag">{data.archetype}</span>
      {data.route ? (
        <span className="wrapped-card__rail">
          <i />
          <b>{data.route.from}</b>
          <b>{data.route.to}</b>
        </span>
      ) : null}
      <ul className="wrapped-card__stats">
        {data.stats.map((stat) => (
          <li key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
