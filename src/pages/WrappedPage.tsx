import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useHistoryBack } from '../components/layout/AppShell';
import { useApp } from '../state/AppState';
import { Button, Dialog } from '../components/ui/primitives';
import { Icon } from '../components/ui/Icons';
import { useT } from '../lib/useT';
import { appNow } from '../lib/format';
import { clearTally, tallyFor, yearOf } from '../lib/wrapped';
import { buildStory, type Chapter } from '../lib/wrappedDeck';
import { lookFor } from '../lib/wrappedLook';
import { demoYear, isDemoVariant, type DemoVariant } from '../lib/wrappedDemo';
import { WrappedShareDialog } from '../components/wrapped/WrappedShareDialog';
import { WrappedDemoDirector } from '../components/wrapped/WrappedDemoDirector';
import { WrappedSealed } from '../components/wrapped/WrappedSealed';
import { WrappedScenes } from '../components/wrapped/WrappedScenes';
import {
  resumeSound,
  scoreTime,
  soundAudible,
  soundDiagnostics,
  startSound,
  stopSound,
  trackSeconds,
  whenTrackEnds,
} from '../lib/wrappedSound';
import { barMs, beatAt, beatMs } from '../lib/wrappedBeats';
import { playYearbookEffect, preloadYearbookEffects, type YearbookEffect } from '../lib/yearbookEffects';

/*
 * **A chapter's sound, and the moment its picture lands.**
 *
 * The sound is not the chapter's clock; the score is. This only catches the page's own gesture: the
 * map pin lands, the name arrives, the trophy cards deal. Keeping the table outside the component
 * makes the cue map readable beside the chapter ids it names.
 */
const CHAPTER_EFFECTS: Partial<Record<string, YearbookEffect>> = {
  total: 'stat-tick',
  name: 'name-reveal',
  map: 'map-pin',
  distance: 'distance-whoosh',
  origin: 'rail-chime',
  hour: 'clock-chime',
  direct: 'stat-tick',
  longest: 'distance-whoosh',
  look: 'camera-shutter',
  ranked: 'board-stamp',
  day: 'clock-chime',
  eras: 'era-advance',
  lines: 'board-stamp',
  awards: 'trophy-triumph',
  bookends: 'board-stamp',
  comparison: 'comparison-two-tone',
  crew: 'crew-connect',
  close: 'yearbook-close',
};

/*
 * **The route traveller's clock.**
 *
 * Page 6's moving dot is not a decorative train: it is the traveller, and the two station markers
 * are empty rings that it fills when it arrives. The CSS animation starts after 1.2s and lasts 7.6s;
 * these are the points where it reaches the top, the bottom, and the top again. The bell belongs to
 * those arrivals, not to the page entrance, so the times are kept beside the cue table.
 */
const ROUTE_TRAVELLER = {
  delayMs: 1200,
  durationMs: 7600,
  topAt: 0.03,
  bottomAt: 0.408,
  returnTopAt: 0.947,
} as const;

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
 * a tap: the cover's Begin is the gesture that starts it, the corner switch starts it without the score.
 */
/**
 * **Wrapped is a new-year door, and it is shut until midnight.**
 *
 * The story is a review of a finished year, so it opens on 1 January at 00:01 and closes when
 * January ends. Opening `/wrapped` in November used to show last year's story as if it were still
 * the season — the page was never gated, only its invitation was. The gate is here rather than in
 * the router so the closed screen still wears the app's own chrome and has a way back.
 */
export function WrappedGate() {
  const t = useT();
  const leave = useHistoryBack('/');
  /* December is the only month that needs a ticking clock, so the gate only wakes for it. */
  const [now, setNow] = useState(() => appNow());
  useEffect(() => {
    if (now.getMonth() !== 11) return undefined;
    const id = window.setInterval(() => setNow(appNow()), 1000);
    return () => window.clearInterval(id);
  }, [now.getMonth()]);
  /*
   * **The example deck is not the season.**
   *
   * `?demo=1` is a made-up year built in memory, and the developer panel links straight to it so
   * the story can be worked on in November. It must stay reachable on any date and in any build;
   * the real year below is the part that is gated to January.
   */
  const demo = new URLSearchParams(window.location.search).get('demo') === '1';
  /*
   * **00:00:01, not midnight.**
   *
   * The gate used to be "is it January", which opened at 00:00:00 — a second before the moment the
   * steerer named. The comparison is against the first second of 1 January, so 23:59:59 and
   * 00:00:00 are both still closed and 00:00:01 opens.
   */
  const opening = new Date(now.getFullYear(), 0, 1, 0, 0, 1).getTime();
  if ((now.getMonth() === 0 && now.getTime() >= opening) || demo) return <WrappedPage />;
  if (now.getMonth() === 11) return <WrappedSealed now={now} onBack={leave} />;

  return (
    <div className="stack-4" style={{ maxWidth: 560, margin: '12vh auto 0' }}>
      <h1 className="t-h1">{t('OVVO Yearbook')}</h1>
      <p className="t-muted">
        {t('The Yearbook opens on 1 January, just after midnight. It looks back at the whole year, every journey, once the year is over.')}
      </p>
      <div>
        <Button onClick={leave}>{t('Back')}</Button>
      </div>
    </div>
  );
}

export function WrappedPage() {
  const { settings, reduceMotion, suspendBatterySaving } = useApp();
  /*
   * **The story is exempt from the phone's saving modes.**
   *
   * At 20% the app stills every animation, and at 10% it also removes shadows and switches the
   * appearance. That is the right trade for a departure board; it is the wrong one for a deck
   * whose motion and colour are the year. The deck asks for the exception before its first paint
   * and gives it back when it closes, so the app's own saving mode is untouched everywhere else.
   */
  useLayoutEffect(() => {
    suspendBatterySaving(true);
    return () => suspendBatterySaving(false);
  }, [suspendBatterySaving]);
  const t = useT();
  /* Closing the story returns to the screen it was opened from, not to the home screen. */
  const leave = useHistoryBack('/');
  const [params] = useSearchParams();
  const askedForDemo = params.get('demo') === '1';
  /*
   * **The visual workshop.**
   *
   * `?bare=1` takes the words, the share, the score and the effects off the page and stops the
   * deck turning itself, so the colour and the form can be judged on their own. Nothing is
   * deleted: the same chapters, the same numbers, the same navigation. It is the mode the next
   * art pass is built in, and it is never the mode a traveller sees.
   */
  const bare = params.get('bare') === '1';
  const requestedVariant = params.get('persona');
  const [demoVariant, setDemoVariant] = useState<DemoVariant>(() =>
    isDemoVariant(requestedVariant) ? requestedVariant : 'regular',
  );
  const now = appNow();

  /*
   * **Which year, and never half of one.**
   *
   * The deck used to wrap whatever year the calendar said, so a traveller opening it in July saw a
   * few months of journeys presented as the whole year, with the year still running. The wrapped
   * season opens on 1 January, when the year being wrapped is the one just ended; at every other
   * time of year the newest finished year is the one before, which is the only year a review can
   * honestly be of. December used to open the running year early, and half a year is not a year.
   */
  const year = useMemo(() => {
    const named = Number(params.get('year'));
    if (Number.isInteger(named) && named > 2000) return named;
    const thisYear = yearOf(now.getTime());
    return thisYear - 1;
  }, [params, now]);

  /*
   * **A year that has not closed says so.**
   *
   * In the season the year being wrapped is still running until midnight on the thirty-first, so the
   * cover carries one quiet line that the story is the year so far. Nothing else in the deck changes:
   * every figure is still the tally's own.
   */
  const yearOver = now.getTime() >= new Date(year + 1, 0, 1).getTime();

  /*
   * **An empty year opens the example year, and says so.**
   *
   * The steerer's own 2026 holds nothing yet, so the honest two-card deck was the only thing he ever
   * saw, and he asked for the deck he liked instead of it. So: no journeys in the real year, and the
   * plain address shows the demo year — with the cover's "Demo year: none of this is real" line on it,
   * so nothing pretends to be his. A year with journeys in it still shows his own, untouched.
   */
  const realTally = useMemo(() => tallyFor(year), [year]);
  const demo = askedForDemo || realTally.runs.length === 0;
  const tally = useMemo(
    () => (demo ? demoYear(year, demoVariant) : realTally),
    [demo, year, realTally, demoVariant],
  );
  const previousTally = useMemo(
    () =>
      demo
        ? demoYear(year - 1, demoVariant, true)
        : tallyFor(year - 1),
    [demo, year, demoVariant],
  );
  const story = useMemo(
    () => buildStory({ year, tally, previous: previousTally, language: settings.language }),
    [year, tally, previousTally, settings.language],
  );

  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [started, setStarted] = useState(false);
  /* The score is on by default: Begin plays it unless the traveller has muted it first. */
  const [sound, setSound] = useState(true);
  const [confirmClear, setConfirmClear] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareTarget, setShareTarget] = useState<string | null>(null);
  const [director, setDirector] = useState(false);
  /* The scene that is leaving, kept on screen under the new one for one film cut. */
  const [previous, setPrevious] = useState<Chapter | null>(null);
  const previousTimer = useRef(0);

  /*
   * **Every page hands its words out one piece at a time.**
   *
   * Each chapter used to arrive as one block: the label, the number, the sentence and the rows all
   * appeared in the same frame behind the page's own entrance, which is what made ten different
   * layouts read as one wall of text ten times. The pieces are placed in a queue now (the `--i` each
   * one already carries), and a page marks itself as dealt once it has painted, so the label, then
   * the number, then the sentence and the rows arrive in that order. The stylesheet does the rest,
   * and the setting for reduced motion skips the queue entirely.
   */
  const [dealt, setDealt] = useState(false);

  const chapter: Chapter = story[Math.min(index, story.length - 1)];
  const last = index >= story.length - 1;
  /*
   * **The chapter's colour, in one place.**
   *
   * The stage paints `--ground` and sets the sentence in `--ink`, so the chrome, the progress dots
   * and the words all agree with the field they are sitting on. `lib/wrappedLook` owns the pairs.
   */
  const look = lookFor(chapter.id);

  /*
   * **A page gets one entrance and one sound, not one of each per re-render.**
   *
   * `soundRef` keeps the latest switch value without making the cue effect rerun when the traveller
   * mutes the score. The chapter id is the key: going back to a chapter is a new turn, but a render
   * that leaves it alone is not.
   */
  const soundRef = useRef(sound);
  const lastCue = useRef<string | null>(null);
  useEffect(() => {
    soundRef.current = sound;
  }, [sound]);
  useEffect(() => {
    if (started && !bare) preloadYearbookEffects();
  }, [bare, started]);
  useEffect(() => {
    if (bare || !started) {
      lastCue.current = null;
      return undefined;
    }
    const previous = lastCue.current;
    lastCue.current = chapter.id;
    if (!soundRef.current) return undefined;

    /* The first chapter after Begin is the start, not a page turn. */
    if (!previous) {
      playYearbookEffect('begin');
    } else if (previous !== chapter.id) {
      playYearbookEffect('page-turn');
    }

    const cue = CHAPTER_EFFECTS[chapter.id];
    if (!cue) return undefined;
    const timers: number[] = [];
    const at = cue === 'trophy-triumph' ? 500 : cue === 'yearbook-close' ? 550 : 380;
    timers.push(
      window.setTimeout(() => {
        if (soundRef.current) playYearbookEffect(cue);
      }, at),
    );

    /* Count pages get a short run of ticks, not one tick for a number that keeps climbing. */
    if (cue === 'stat-tick') {
      [600, 780, 960].forEach((delay) => {
        timers.push(
          window.setTimeout(() => {
            if (soundRef.current) playYearbookEffect('stat-tick');
          }, delay),
        );
      });
    }

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [bare, chapter.id, started]);

  /*
   * **The bell rings at the stations, not at the page turn.**
   *
   * The traveller rests at each end before it turns around. Schedule the cue for those arrivals; the
   * timer is cleaned up when the story moves on, and muting leaves the next arrival silent.
   */
  useEffect(() => {
    if (bare || !started || reduceMotion || chapter.id !== 'pair') return undefined;
    const { delayMs, durationMs, topAt, bottomAt, returnTopAt } = ROUTE_TRAVELLER;
    const firstTop = delayMs + durationMs * topAt;
    const firstBottom = delayMs + durationMs * bottomAt;
    const returnTop = delayMs + durationMs * returnTopAt;
    const arrivals = [firstTop, firstBottom, returnTop];
    for (let cycle = 1; cycle < 8; cycle += 1) {
      arrivals.push(firstBottom + cycle * durationMs, returnTop + cycle * durationMs);
    }
    const timers = arrivals.map((at) =>
      window.setTimeout(() => {
        if (soundRef.current) playYearbookEffect('rail-chime');
      }, at),
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [bare, chapter.id, started, reduceMotion]);

  /*
   * **The corner switch tells the truth about the speaker, on every page.**
   *
   * The score is on by default, but a phone may refuse to play before a tap, so "on by default" and "making
   * a sound" are two different things. The cover used to read "Sound on" while the story's music was already
   * armed — the first page asking for a press the second page never asks for. The switch now follows the
   * speaker: while music is sounding it says "Sound off", and while it is silent it says "Sound on" and starts
   * the score in the tap that presses it.
   */
  const [audible, setAudible] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setAudible(soundAudible()), 300);
    return () => window.clearInterval(id);
  }, []);

  const soundLabel = sound && audible ? t('Sound off') : t('Sound on');

  /* Which way the story is moving, so a chapter arrives from the side the traveller came from. */
  const go = useCallback(
    (next: number) => {
      const target = Math.max(0, Math.min(story.length - 1, next));
      if (target !== index) {
        setPrevious(chapter);
        window.clearTimeout(previousTimer.current);
        previousTimer.current = window.setTimeout(() => setPrevious(null), 920);
      }
      setDir(target < index ? -1 : 1);
      setIndex(target);
    },
    [chapter, index, story.length],
  );
  const step = useCallback((direction: number) => go(index + direction), [go, index]);

  useEffect(() => () => window.clearTimeout(previousTimer.current), []);

  /*
   * Every chapter brings its own piece of music, crossfading in under the one before it.
   *
   * The chapter after this one is handed over as a hint, so it is already on the phone by the time
   * the traveller swipes: the story should never wait for a song.
   */
  useEffect(() => {
    /*
     * **There is one way to start the score, and this is it.**
     *
     * Begin started a song itself, the switch started one itself, and this effect started one on every
     * chapter change: three doors into the same room, and on the steerer's phone only the switch's door
     * made a sound. They are one door now. Starting the story sets `started`, the switch turns `sound`
     * over, and what is applied here is exactly what the switch has always done.
     */
    if (bare || !sound) {
      stopSound();
      return;
    }
    startSound(chapter.track, story[index + 1]?.track);
  }, [bare, index, sound, chapter.track, story]);

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
      /* A workshop stays on the chapter being worked on. */
      if (last || director) return;
      /* The cover's piece ending is the story starting, exactly as Begin is. */
      if (index === 0) setStarted(true);
      go(index + 1);
    });
    return () => whenTrackEnds(null);
  }, [go, index, last, director]);

  /*
   * **The story turns itself in silence too.**
   *
   * The song is the clock, and it asks for the next chapter half a second before it ends. But a phone
   * that refuses to play the first track has no clock at all, and neither has a muted deck: the story
   * stopped dead on a finished chapter and waited to be swiped. This is the clock for both. It fires a
   * second after the chapter's song would have ended, so when the music is playing it is always the
   * music that turns the page and this never gets there first.
   */
  useEffect(() => {
    if (bare || last || director) return undefined;
    const quiet = Math.max(4000, (trackSeconds(chapter.track) + 1) * 1000);
    const timer = window.setTimeout(() => {
      if (index === 0) setStarted(true);
      go(index + 1);
    }, quiet);
    return () => window.clearTimeout(timer);
  }, [bare, last, chapter.track, index, go, director]);

  /* Two frames: one to paint the pieces hidden, one to start them. */
  useEffect(() => {
    setDealt(false);
    let second = 0;
    const first = window.requestAnimationFrame(() => {
      second = window.requestAnimationFrame(() => setDealt(true));
    });
    return () => {
      window.cancelAnimationFrame(first);
      window.cancelAnimationFrame(second);
    };
  }, [chapter.id]);

  /* A report on the score, for a phone that cannot be debugged from here. */
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
        /* Escape is the same door as the X, so it returns the same way. */
        leave();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [leave, step]);

  /* Closing the deck closes the score with it; nothing keeps playing behind another screen. */
  useEffect(() => () => stopSound(), []);

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
  /* The count is a flourish, not a wait: land it inside two seconds. */
  const land = Math.min(2000, barMs(chapter.track) * 2);

  const count = useCountUp(chapter.count ?? 0, started && !reduceMotion, chapter.id, land);

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
      if (sound) playYearbookEffect('share-confirmation');
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className={`wrapped-stage wrapped-stage--${chapter.tone}${reduceMotion ? ' is-still' : ''}${
        onBeat ? ' is-beat' : ''
      }${bare ? ' is-bare' : ''}`}
      data-chapter={chapter.id}
      /* The colour world, and whether its field carries a real chroma, read by the deck's check. */
      data-family={look.family}
      data-mass={look.mass.join(',')}
      style={
        {
          '--beat-ms': `${beatMs(chapter.track)}ms`,
          '--bar-ms': `${barMs(chapter.track)}ms`,
          '--beat-phase': `${armed && beat ? beat.beatPhase : 0}ms`,
          '--bar-phase': `${armed && beat ? beat.barPhase : 0}ms`,
          '--ground': look.ground,
          '--ink': look.ink,
          /* The focal layer is drawn in the form's own accent, not in the ink: a grey smudge is not
             something to look at. */
          '--accent': look.mass[1],
          /* The look's own photograph, for the chapter that sets its name inside it. */
          ...(chapter.photo ? { '--look-photo': `url(${chapter.photo})` } : {}),
        } as CSSProperties
      }
      role="region"
      aria-label={t('OVVO Yearbook {year}', { year })}
      /*
        * **A tap, not a swipe.**
        *
        * The deck asked for a horizontal drag to move on, which is a gesture nobody discovers and one
        * that a scroll-happy thumb fights. Now the page itself is two buttons: the left half goes back,
        * the right half of the middle goes forward. Anything that is really a control - the close
        * button, the sound switch, Begin, the actions on the cover and the closing page, the bar at the
        * top - is left alone, so a tap on a button is still a tap on that button.
        */
      /* Every touch repairs a score that never started. */
      onPointerDown={() => {
        if (!bare && started && sound) resumeSound(chapter.track, story[index + 1]?.track);
      }}
      onClick={(event) => {
        const target = event.target as HTMLElement | null;
        if (target?.closest('button, a, input, textarea, select, [role="button"], .wrapped-progress')) return;
        const forward = event.clientX >= window.innerWidth / 2;
        /* The cover is where the story is asked to begin, so its right half starts it. */
        if (!started) {
          if (!forward) return;
          setStarted(true);
          go(1);
          return;
        }
        step(forward ? 1 : -1);
      }}
    >
      {/*
        * **Where you are, in ten pieces.**
        *
        * A story needs a map at the top: one segment per chapter, the ones behind you filled, and the
        * chapter you are on filling as its song plays, so the bar is the story's own clock rather than a
        * decoration that says the same thing twice. It is not a control: the page itself is.
        */}
      <nav className="wrapped-progress" aria-hidden="true">
        {story.map((item, at) => (
          <span
            key={item.id}
            className={`wrapped-progress__seg${at < index ? ' is-done' : ''}${at === index ? ' is-now' : ''}`}
          >
            {/*
              * **The chapter you are on fills, whether or not it is audible.**
              *
              * The bar used to wait for Begin, and it still had to be asked for when the sound was off, so a
              * muted story showed a clock that had stopped while the story itself was still running. The song
              * is the clock either way: muted, the deck keeps the same count, so the segment fills on the cover
              * and on every chapter, heard or not.
              */}
            {at === index ? (
              <i key={`${item.id}-${index}`} style={{ '--len': `${trackSeconds(chapter.track)}s` } as CSSProperties} />
            ) : null}
          </span>
        ))}
      </nav>

      {showDiagnostics ? (
        <div className="wrapped-diag" aria-live="polite">
          {diagnostics.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </div>
      ) : null}

      <header className="wrapped-top">
        <button type="button" className="wrapped-close" onClick={leave} aria-label={t('Close')}>
          <Icon name="close" size={20} />
        </button>
        {demo ? (
          askedForDemo ? (
            <button
              type="button"
              className="wrapped-demo-mark"
              aria-label={t('Open the Demo Director')}
              onClick={() => setDirector(true)}
            >
              {t('Demo')}
            </button>
          ) : (
            <span className="wrapped-demo-mark" aria-label={t('Demo year')}>
              {t('Demo')}
            </span>
          )
        ) : null}
        {/*
          * **The switch says what a thumb will get, not what is already true.**
          *
          * While the score is playing it reads "Sound off", because that is what pressing it does. The
          * steerer asked for it this way, and he is right that it is the plainer reading: a control that
          * describes its own action needs no legend, and no coloured light beside it either.
          */}
        {bare ? null : (
        <button
          type="button"
          className="wrapped-sound"
          aria-label={soundLabel}
          onClick={() => {
            /* The switch is a control, so it answers before it changes the state. */
            playYearbookEffect('sound-toggle');
            /* "Sound off" mutes what is playing; "Sound on" starts it, in this tap, on any page. */
            if (sound && audible) {
              setSound(false);
              return;
            }
            setSound(true);
            resumeSound(chapter.track, story[index + 1]?.track);
          }}
        >
          <span>{soundLabel}</span>
        </button>
        )}
      </header>

      {/* The keyboard is a reader's way through: arrows, Escape to leave. */}
      <div className="wrapped-scene">

        <div
          className={`wrapped-body wrapped-body--${chapter.kind}${dealt ? ' is-dealt' : ''}`}
          data-chapter={chapter.id}
          data-index={String(index + 1).padStart(2, '0')}
          data-dir={dir}
        >
          <WrappedScenes
            chapter={chapter}
            previous={previous}
            year={year}
            count={count}
            journeys={tally.runs.length}
            demo={demo}
            yearOver={yearOver}
            still={reduceMotion}
            onBegin={() => {
              setStarted(true);
              go(1);
            }}
          />
        </div>
      </div>

      {!bare && started && chapter.kind !== 'cover' ? (
        <div className="film2-dock">
          <button
            type="button"
            className="film2-share"
            onClick={() => {
              setShareTarget(null);
              setShareOpen(true);
            }}
          >
            <Icon name="share" size={15} /> {t('Share this story')}
          </button>

          {last ? (
            <div className="film2-end-actions">
              <button type="button" className="film2-action" onClick={() => void share()}>
                {copied ? t('Copied') : t('Copy my year')}
              </button>
              <button type="button" className="film2-action" onClick={() => go(0)}>
                {t('Start again')}
              </button>
              {demo ? null : (
                <button type="button" className="film2-action" onClick={() => setConfirmClear(true)}>
                  {t('Empty this year')}
                </button>
              )}
            </div>
          ) : null}
        </div>
      ) : null}

      {cleared ? (
        <p className="wrapped-toast" role="status">
          <Icon name="check" size={14} /> {t('The year has been emptied.')}
        </p>
      ) : null}

      <WrappedShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        initialCardId={shareTarget ?? undefined}
        year={year}
        demo={demo}
        soundOn={sound}
        story={story}
        tally={tally}
      />

      {askedForDemo ? (
        <WrappedDemoDirector
          open={director}
          onClose={() => setDirector(false)}
          story={story}
          index={index}
          variant={demoVariant}
          onJump={(at) => {
            setStarted(at > 0);
            go(at);
            setDirector(false);
          }}
          onVariant={(next) => {
            setDemoVariant(next);
            setIndex(0);
            setDir(1);
            setStarted(false);
          }}
        />
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

