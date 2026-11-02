import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { demoYear } from '../lib/wrappedDemo';
import {
  resumeSound,
  scoreTime,
  soundAudible,
  soundDiagnostics,
  startSound,
  stopSound,
  chapterSeconds,
  whenTrackEnds,
} from '../lib/wrappedSound';
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
 * a tap: the cover's Begin is the gesture that starts it, the corner switch starts it without the score.
 */
export function WrappedPage() {
  const { settings, reduceMotion } = useApp();
  const t = useT();
  /* Closing the story returns to the screen it was opened from, not to the home screen. */
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
  const tally = useMemo(() => (demo ? demoYear(year) : realTally), [demo, year, realTally]);
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
  const [copied, setCopied] = useState(false);

  const chapter: Chapter = story[Math.min(index, story.length - 1)];
  const last = index >= story.length - 1;

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
    /*
     * **There is one way to start the score, and this is it.**
     *
     * Begin started a song itself, the switch started one itself, and this effect started one on every
     * chapter change: three doors into the same room, and on the steerer's phone only the switch's door
     * made a sound. They are one door now. Starting the story sets `started`, the switch turns `sound`
     * over, and what is applied here is exactly what the switch has always done.
     */
    if (!sound) {
      stopSound();
      return;
    }
    startSound(chapter.track, story[index + 1]?.track);
  }, [index, sound, chapter.track, story]);

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
      if (last) return;
      /* The cover's piece ending is the story starting, exactly as Begin is. */
      if (index === 0) setStarted(true);
      go(index + 1);
    });
    return () => whenTrackEnds(null);
  }, [go, index, last]);

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
    if (last) return undefined;
    const quiet = Math.max(4000, (chapterSeconds(chapter.track) + 1) * 1000);
    const timer = window.setTimeout(() => {
      if (index === 0) setStarted(true);
      go(index + 1);
    }, quiet);
    return () => window.clearTimeout(timer);
  }, [last, chapter.track, index, go]);

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
  const land = barMs(chapter.track) * 2;

  const count = useCountUp(chapter.count ?? 0, started && !reduceMotion, chapter.id, land);

  /*
   * **The map is framed on the year, not on the country.**
   *
   * The schematic canvas is a hundred units wide because it draws the whole network; a year with nine
   * stations on it was a few dots huddled in one corner of a phone. The frame here is the box those
   * stations actually occupy, padded, so the lines are as large as the page allows and the shape reads
   * as a journey rather than as dust.
   */
  const mapBox = useMemo(() => {
    const points = chapter.map?.stops ?? [];
    if (points.length === 0) return { x: 0, y: 0, w: 100, h: 100 };
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const padX = Math.max(9, (maxX - minX) * 0.16);
    const padY = Math.max(9, (maxY - minY) * 0.16);
    return { x: minX - padX, y: minY - padY, w: maxX - minX + padX * 2, h: maxY - minY + padY * 2 };
  }, [chapter.map]);

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

  /**
   * **The year as one picture, 9:16, ready for a story.**
   *
   * A copied sentence is a link nobody posts. This draws the year on a phone-sized canvas: the pass at
   * the top, the route that kept coming back, and the three numbers a year is actually proud of. It is
   * drawn from the same chapters the deck is reading, so it cannot say anything the deck does not.
   */
  const saveCard = async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const card = story.find((item) => item.kind === 'pass')?.pass;
    const route = story.find((item) => item.kind === 'route')?.route;
    const hoursChapter = story.find((item) => item.id === 'hours');
    const stations = new Set(tally.runs.flatMap((run) => [run.from, run.to])).size;

    /* A bright year, because this card is made to be posted rather than filed. */
    const sky = ctx.createLinearGradient(0, 0, 1080, 1920);
    sky.addColorStop(0, '#ff7a5c');
    sky.addColorStop(0.46, '#ff4f8b');
    sky.addColorStop(1, '#6a4cff');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 1080, 1920);

    /* Orbits behind the type, so the card has depth instead of a flat wash. */
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    [340, 520, 700].forEach((radius, at) => {
      ctx.beginPath();
      ctx.arc(at === 1 ? 860 : 220, at === 2 ? 420 : 560, radius, 0, Math.PI * 2);
      ctx.stroke();
    });

    const font = (weight: number, size: number) =>
      `${weight} ${size}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;

    const write = (
      text: string,
      x: number,
      y: number,
      type: string,
      colour: string,
      max = 900,
      leading = 0,
    ): number => {
      ctx.font = type;
      ctx.fillStyle = colour;
      const rows: string[] = [];
      let line = '';
      for (const word of text.split(' ')) {
        const next = line ? `${line} ${word}` : word;
        if (ctx.measureText(next).width > max && line) {
          rows.push(line);
          line = word;
        } else {
          line = next;
        }
      }
      if (line) rows.push(line);
      rows.forEach((row, at) => ctx.fillText(row, x, y + at * (leading || 60)));
      return y + rows.length * (leading || 60);
    };

    ctx.font = font(800, 30);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('OVVO WRAPPED', 88, 152);

    const yearText = String(year);
    ctx.font = font(800, 44);
    const yearWidth = ctx.measureText(yearText).width;
    rounded(ctx, 992 - yearWidth - 64, 104, yearWidth + 64, 76, 38);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText(yearText, 992 - yearWidth - 32, 158);

    write('YOUR TRAVEL PERSONALITY', 88, 336, font(700, 26), 'rgba(255, 255, 255, 0.72)');
    let y = write(card?.name ?? '', 88, 486, font(800, 112), '#ffffff', 904, 118);
    y = write(card?.evidence ?? '', 88, y + 44, font(500, 40), 'rgba(255, 255, 255, 0.92)', 904, 54);

    if (route) {
      rounded(ctx, 88, 1010, 904, 156, 34);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.24)';
      ctx.fill();
      write(`${route.count} x ${route.from}`, 128, 1074, font(700, 40), '#ffffff', 820, 52);
      write(`to ${route.to}`, 128, 1126, font(500, 34), 'rgba(255, 255, 255, 0.84)', 820, 46);
    }

    const stats: Array<[string, string]> = [
      [String(tally.runs.length), 'JOURNEYS'],
      [String(hoursChapter?.count ?? 0), 'HOURS'],
      [String(stations), 'STATIONS'],
    ];
    stats.forEach(([value, label], at) => {
      const x = 88 + at * 304;
      rounded(ctx, x, 1250, 280, 200, 30);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fill();
      ctx.font = font(800, 74);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(value, x + 32, 1352);
      ctx.font = font(700, 24);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillText(label, x + 32, 1402);
    });

    write('Every number from the journeys I planned in OVVO.', 88, 1776, font(500, 30), 'rgba(255, 255, 255, 0.86)');
    ctx.font = font(800, 34);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('ovvo', 88, 1844);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ovvo-wrapped-${year}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

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
          /*
           * **The look's page is painted in the look.**
           *
           * Its own page colour, its own ink, so the page a traveller chose is the page the chapter is
           * printed on. A photograph of a platform at night was the same picture for everybody; this is
           * the one thing on the page that is only theirs.
           */
          ...(chapter.swatches
            ? { background: chapter.swatches[0], color: chapter.swatches[2] }
            : {}),
        } as CSSProperties
      }
      role="region"
      aria-label={t('OVVO Wrapped {year}', { year })}
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
        if (started && sound) resumeSound(chapter.track, story[index + 1]?.track);
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
      {/* The look's own photograph, behind everything, when that look has one. */}
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

      {/*
        * **The dotted ground, exactly as the first versions drew it.**
        *
        * One-pixel dots three pixels apart: paper grain, not a pattern of discs. It was taken off every
        * chapter when each page got its own surface; this is the one page that asked for it back. It is a
        * child of the stage rather than of the body, because the ground belongs to the whole page: drawn
        * inside the body it started where the words start and stopped where they stop, and the paper shelf
        * at the foot of the page covered the rest.
        */}
      {chapter.id === 'origin' ? <span className="wrapped-grain" aria-hidden="true" /> : null}

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
              <i key={`${item.id}-${index}`} style={{ '--len': `${chapterSeconds(chapter.track)}s` } as CSSProperties} />
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
        {/*
          * **The switch says what a thumb will get, not what is already true.**
          *
          * While the score is playing it reads "Sound off", because that is what pressing it does. The
          * steerer asked for it this way, and he is right that it is the plainer reading: a control that
          * describes its own action needs no legend, and no coloured light beside it either.
          */}
        <button
          type="button"
          className="wrapped-sound"
          aria-label={soundLabel}
          onClick={() => {
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
      </header>

      {/* The keyboard is a reader's way through: arrows, Escape to leave. */}
      <div className="wrapped-scene">
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
              <div className="wrapped-actions" style={{ '--i': 4 } as CSSProperties}>
                <Button
                  variant="accent"
                  size="md"
                  onClick={() => {
                    setStarted(true);
                    /* On by default, so Begin starts the score unless it was muted before the tap. */
                    /*
                     * **One press, one song.**
                     *
                     * Begin used to start the cover's track and hand over to the next chapter's from an
                     * effect, outside the tap. A phone allows the first play and refuses the second, so the
                     * room went quiet a second in and only came back when the switch was tapped again. The
                     * score now opens on the chapter the traveller lands on, in the same gesture.
                     */
                    go(1);
                  }}
                >
                  {t('Begin')}
                </Button>
                {/* The cover asks one thing. The score has its own switch in the corner. */}
              </div>
            </>
          ) : (
            <>
              {chapter.kind === 'pass' ? null : (
                <span className="wrapped-kicker" style={{ '--i': 0 } as CSSProperties}>
                  {t(chapter.kicker)}
                </span>
              )}

              {chapter.kind === 'pass' && chapter.pass ? (
                <div className="wrapped-pass" style={{ '--i': 1 } as CSSProperties}>
                  <p className="wrapped-pass__rail">
                    <span>OVVO Wrapped</span>
                    <span>{year}</span>
                  </p>
                  <h2 className="wrapped-pass__name">{t(chapter.pass.name)}</h2>
                  <p className="wrapped-pass__why">{t(chapter.pass.evidence)}</p>
                  <ul className="wrapped-pass__facts">
                    {chapter.pass.facts.map((fact) => (
                      <li key={fact}>{fact}</li>
                    ))}
                  </ul>
                  <span className="wrapped-pass__stamp" aria-hidden="true">
                    {t('Valid all year')}
                  </span>
                </div>
              ) : null}

              {chapter.kind === 'arc' ? (
                <div className="wrapped-arc" style={{ '--arc': chapter.arc ?? 0, '--i': 1 } as CSSProperties}>
                  <span className="wrapped-arc__spark" aria-hidden="true" />
                  <p className="wrapped-big wrapped-big--in">{count}%</p>
                </div>
              ) : chapter.kind === 'route' || chapter.kind === 'map' || chapter.kind === 'pass' ? null : (
                <p className="wrapped-big" style={{ '--i': 1 } as CSSProperties}>
                  {chapter.kind === 'word' || chapter.count === undefined ? chapter.big : count}
                </p>
              )}

              {chapter.swatches?.length ? (
                <span className="wrapped-swatches" aria-hidden="true">
                  {chapter.swatches.map((colour, at) => (
                    <i key={`${colour}-${at}`} style={{ '--tone': colour, '--i': at } as CSSProperties} />
                  ))}
                </span>
              ) : null}

              {chapter.kind === 'word' && chapter.count !== undefined ? (
                <p className="wrapped-days" style={{ '--i': 2 } as CSSProperties}>
                  {count}
                  <span>{chapter.count === 1 ? t('day') : t('days')}</span>
                </p>
              ) : null}

              {chapter.kind === 'number' && chapter.blocks ? (
                <span className="wrapped-blocks" aria-hidden="true">
                  {Array.from({ length: chapter.blocks }, (_, block) => (
                    <i
                      key={block}
                      style={{ '--i': block, '--h': `${40 + (block % 5) * 12}%` } as CSSProperties}
                    />
                  ))}
                </span>
              ) : null}

              {(chapter.kind === 'number' || chapter.kind === 'word') && chapter.dots ? (
                <span className="wrapped-field" aria-hidden="true">
                  {/* One row of twelve lands on every beat, so the year fills in time with the song
                      rather than all at once behind the number. */}
                  {Array.from({ length: Math.min(chapter.dots, 700) }, (_, dot) => (
                    <i
                      key={dot}
                      style={
                        {
                          '--i': dot,
                          animationDelay: `${Math.floor(dot / 12) * beatMs(chapter.track)}ms`,
                        } as CSSProperties
                      }
                    />
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

              {chapter.kind === 'map' && chapter.map ? (
                <div className="wrapped-map" style={{ '--i': 1 } as CSSProperties}>
                  <svg
                    viewBox={`${mapBox.x} ${mapBox.y} ${mapBox.w} ${mapBox.h}`}
                    preserveAspectRatio="xMidYMid meet"
                    aria-hidden="true"
                    focusable="false"
                  >
                    {chapter.map.stops.map((stop, at) => (
                      <circle
                        key={`stop-${at}`}
                        className="wrapped-map__stop"
                        cx={stop.x}
                        cy={stop.y}
                        r={1.4}
                        style={{ '--i': at } as CSSProperties}
                      />
                    ))}
                    {chapter.map.routes.map((line, at) => {
                      /*
                       * **Every route bends, and none of them bends the same way.**
                       *
                       * Two straight lines between the same stations lie on top of each other, and the
                       * year's seventh route then looks like its second. Each line bows out from the
                       * straight path by a few units, alternating sides, so seven routes read as seven.
                       */
                      const dx = line.x2 - line.x1;
                      const dy = line.y2 - line.y1;
                      const span = Math.hypot(dx, dy) || 1;
                      const bow = (at % 2 === 0 ? 1 : -1) * (2.6 + at * 0.55);
                      const cx = (line.x1 + line.x2) / 2 - (dy / span) * bow;
                      const cy = (line.y1 + line.y2) / 2 + (dx / span) * bow;
                      return (
                        <path
                          key={`route-${at}`}
                          className={`wrapped-map__route${line.count > 1 ? ' is-often' : ''}`}
                          d={`M ${line.x1} ${line.y1} Q ${cx} ${cy} ${line.x2} ${line.y2}`}
                          style={{ '--i': at } as CSSProperties}
                        />
                      );
                    })}
                  </svg>
                  <ul className="wrapped-map__names">
                    {chapter.map.labels.slice(0, 3).map((label) => (
                      <li key={label.name}>{label.name}</li>
                    ))}
                  </ul>
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

              {/* The rail prints its own two stations, and the look prints its own days under its name.
                  Any other word chapter (the travel personality) still needs the sentence that earns it. */}
              {chapter.kind === 'route' ||
              chapter.kind === 'pass' ||
              (chapter.kind === 'word' && chapter.count !== undefined) ? null : (
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
              {/* The year is the example one, and it still says so: on the last page, not the first. */}
              {chapter.demoNote && demo ? (
                <p className="wrapped-demo wrapped-demo--quiet" style={{ '--i': 5 } as CSSProperties}>
                  <strong>{t('Demo year:')}</strong> {t('none of this is real, and none of it is stored.')}
                </p>
              ) : null}
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
              <Button variant="accent" size="sm" icon="bookmark" onClick={() => void saveCard()}>
                {t('Save my year')}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => void share()}>
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
      <span>{label}</span>
      <strong>{numeric ? (counting ? shown : target) : detail}</strong>
    </li>
  );
}

/** A rounded rectangle, drawn the long way so it works in an older safari as well as a new one. */
function rounded(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}
