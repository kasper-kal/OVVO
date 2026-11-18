import { Fragment, type CSSProperties } from 'react';
import type { Chapter } from '../../lib/wrappedDeck';
import { lookFor } from '../../lib/wrappedLook';
import { WrappedArt } from './WrappedArt';
import { WrappedPoster } from './WrappedPoster';

/*
 * **One sentence, on a colour field.**
 *
 * The reference does not put a headline, a number, a caption, a footnote and a chart on every page.
 * It puts one thought on screen, over a wall of colour with one enormous shape cut off by the frame,
 * and lets the colour do the rest. This file is that page: it writes the single sentence and decides
 * where it sits, which is the one place on the frame the mass has been faded away from.
 *
 * The number is inside the sentence, not a separate monument. Every kicker, sub-line, route label,
 * footnote, story bridge, diagram and credit block is gone on purpose, and stays gone.
 */


/*
 * **Stepped hills, drawn from the chapter's own name.**
 *
 * Two rungs of hills per card, each a staircase of whole units rather than a curve, so the horizon
 * reads as cut paper the way the reference's does. The same chapter always draws the same hills.
 */
function hillsFor(id: string, layer: number): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i) + layer * 17) % 100003;
  let state = hash || 1;
  const rand = () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
  const base = layer === 0 ? 62 : 100;
  const span = layer === 0 ? 24 : 32;
  const columns = 25;
  const parts = ['M0 200', `L0 ${Math.round(base + rand() * span)}`];
  for (let i = 1; i <= columns; i += 1) {
    parts.push(`H${Math.round((100 / columns) * i)}`);
    parts.push(`V${Math.round(base + rand() * span)}`);
  }
  parts.push('H100', 'V200', 'Z');
  return parts.join(' ');
}


type SceneKind = 'blades' | 'wedges' | 'collage' | 'horizon' | 'arches' | 'rays' | 'bars';

/* Which kind of scene each chapter is: the shape the reference would use for that card. */
const SCENE_KIND: Record<string, SceneKind> = {
  cover: 'wedges',
  total: 'blades',
  name: 'wedges',
  map: 'horizon',
  distance: 'blades',
  pair: 'rays',
  origin: 'wedges',
  hour: 'arches',
  direct: 'arches',
  longest: 'bars',
  look: 'collage',
  ranked: 'wedges',
  day: 'blades',
  eras: 'horizon',
  lines: 'wedges',
  awards: 'collage',
  bookends: 'collage',
  comparison: 'blades',
  crew: 'bars',
  close: 'rays',
};

function kindOf(id: string): SceneKind {
  return SCENE_KIND[id] ?? 'horizon';
}

function seedOf(id: string, salt = 0): () => number {
  let state = 0;
  for (let i = 0; i < id.length; i += 1) state = (state * 31 + id.charCodeAt(i) + salt) % 100003;
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
}

/* A staircase line between two points, in whole units — the edge of a pixel shape. */
function stair(x1: number, y1: number, x2: number, y2: number, steps: number): string {
  let d = '';
  for (let i = 1; i <= steps; i += 1) {
    d += ` V${Math.round(y1 + ((y2 - y1) * i) / steps)}`;
    d += ` H${Math.round(x1 + ((x2 - x1) * i) / steps)}`;
  }
  return d;
}

/* Layered ribbons cut off a corner: the biggest-day card's scene. */
function bladePaths(id: string): string[] {
  const rand = seedOf(id, 7);
  return Array.from({ length: 5 }, (_, i) => {
    const near = Math.round(6 + i * 7 + rand() * 6);
    const depth = Math.round(30 + i * 13 + rand() * 10);
    return `M100 0 L${near} 0${stair(near, 0, 100, depth, 8)} Z`;
  });
}

/* Stacked pixel wedges peeking out of a corner: the list card's scene. */
function wedgePaths(id: string): string[] {
  const rand = seedOf(id, 11);
  return Array.from({ length: 4 }, (_, i) => {
    const top = Math.round(126 + i * 11 + rand() * 6);
    const right = Math.round(58 + i * 12 + rand() * 8);
    return `M0 200 L0 ${top}${stair(0, top, right, 200, 7)} Z`;
  });
}

/* A torn collage of stepped blocks: the summary-card scene. */
function collageRects(id: string): Array<[number, number, number, number]> {
  const rand = seedOf(id, 13);
  return Array.from({ length: 5 }, (_, i) => {
    const w = 34 + Math.round(rand() * 26);
    const h = 20 + Math.round(rand() * 22);
    return [Math.round(i * 8 + rand() * 10), Math.round(112 + i * 15 + rand() * 8), w, h] as [number, number, number, number];
  });
}

/* Stepped columns rising from the floor: the long-line and crew scenes. */
function barRects(id: string): Array<[number, number, number, number]> {
  const rand = seedOf(id, 17);
  return Array.from({ length: 15 }, (_, i) => {
    const h = 18 + Math.round(rand() * 66);
    return [Math.round(i * 6.7), 200 - h, 6, h] as [number, number, number, number];
  });
}

/* Nested arches of steps: the doorway and hour scenes. */
function archPaths(id: string): string[] {
  const rand = seedOf(id, 19);
  return Array.from({ length: 4 }, (_, i) => {
    const w = 30 + i * 11 + Math.round(rand() * 6);
    const h = 26 + i * 15 + Math.round(rand() * 8);
    const x = 50 - w / 2;
    return `M${Math.round(x)} 200 V${200 - h} H${Math.round(x + w)} V200 Z`;
  });
}

/* Stepped rays fanning from a corner: the pair and closing scenes. */
function rayPaths(id: string): string[] {
  const rand = seedOf(id, 23);
  return Array.from({ length: 6 }, (_, i) => {
    const a = 8 + i * 13;
    const b = a + 5 + Math.round(rand() * 4);
    const reach = 128 - i * 9;
    return `M100 200 L${Math.round(100 - reach)} 200 L${Math.round(100 - reach * Math.cos((b * Math.PI) / 180))} ${Math.round(200 - reach * Math.sin((b * Math.PI) / 180))} Z`;
  });
}

/*
 * The scene itself. One flat field, then the chapter's kind of shape at a corner, then a sunk glow —
 * and nothing at all in the band where the sentence is.
 */
function sceneFor(id: string, mass: string, glow: string) {
  const kind = kindOf(id);
  const shade = (index: number, total: number) => 0.34 + (0.5 * (index + 1)) / total;

  return (
    <>
      <defs>
        <radialGradient id={`glow-${id}`} cx="50%" cy="30%" r="58%">
          <stop offset="0%" stopColor={glow} stopOpacity="0.85" />
          <stop offset="55%" stopColor={glow} stopOpacity="0.18" />
          <stop offset="100%" stopColor={glow} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="100" height="200" fill={`url(#glow-${id})`} className="w-scene__sun" />
      {kind === 'blades' ? (
        <>
          <g>
            {bladePaths(id).map((d, i, all) => (
              <path key={d} d={d} fill={mass} opacity={shade(i, all.length)} />
            ))}
          </g>
          <g transform="translate(100 200) scale(-1 -1)">
            {bladePaths(id).map((d, i, all) => (
              <path key={`b-${d}`} d={d} fill={mass} opacity={shade(i, all.length) * 0.8} />
            ))}
          </g>
        </>
      ) : null}
      {kind === 'wedges' ? (
        <>
          <g>
            {wedgePaths(id).map((d, i, all) => (
              <path key={d} d={d} fill={mass} opacity={shade(i, all.length)} />
            ))}
          </g>
          <g transform="translate(100 0) scale(-1 1)">
            {wedgePaths(id).map((d, i, all) => (
              <path key={`w-${d}`} d={d} fill={mass} opacity={shade(i, all.length) * 0.7} />
            ))}
          </g>
        </>
      ) : null}
      {kind === 'collage' ? (
        <g>
          {collageRects(id).map(([x, y, w, h], i, all) => (
            <rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} fill={mass} opacity={shade(i, all.length)} />
          ))}
          <rect x="74" y="-12" width="40" height="52" fill={mass} opacity="0.55" />
        </g>
      ) : null}
      {kind === 'bars' ? (
        <g>
          {barRects(id).map(([x, y, w, h], i, all) => (
            <rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} fill={mass} opacity={shade(i, all.length)} />
          ))}
        </g>
      ) : null}
      {kind === 'arches' ? (
        <g>
          {archPaths(id).map((d, i, all) => (
            <path key={d} d={d} fill={mass} opacity={shade(i, all.length)} />
          ))}
        </g>
      ) : null}
      {kind === 'rays' ? (
        <g>
          {rayPaths(id).map((d, i, all) => (
            <path key={d} d={d} fill={mass} opacity={shade(i, all.length)} />
          ))}
        </g>
      ) : null}
      {kind === 'horizon' ? (
        <>
          <path className="w-scene__far" d={hillsFor(id, 0)} fill={mass} opacity="0.5" />
          <path className="w-scene__near" d={hillsFor(id, 1)} fill={mass} opacity="0.9" />
        </>
      ) : null}
      <path className="w-scene__floor" d="M0 184 H100 V200 H0 Z" fill={mass} opacity="0.97" />
    </>
  );
}

type Place = 'top' | 'center' | 'bottom';

const SIZE: Record<string, 'small' | 'medium' | 'large'> = {
  cover: 'large',
  total: 'large',
  name: 'large',
  map: 'small',
  distance: 'medium',
  pair: 'medium',
  origin: 'small',
  hour: 'large',
  direct: 'large',
  longest: 'medium',
  look: 'large',
  ranked: 'medium',
  day: 'large',
  eras: 'small',
  lines: 'medium',
  awards: 'medium',
  bookends: 'large',
  comparison: 'large',
  crew: 'small',
  close: 'large',
};

/*
 * Where the words stand is decided by where the mass is not. The mass is drawn at the opposite end
 * of the frame, and its own mask melts it into the colour before it reaches the sentence, so there
 * is never a scrim between the words and the picture.
 */
const PLACE: Record<string, Place> = {
  cover: 'center',
  total: 'bottom',
  name: 'bottom',
  map: 'top',
  distance: 'bottom',
  pair: 'center',
  origin: 'bottom',
  hour: 'center',
  direct: 'top',
  longest: 'top',
  look: 'bottom',
  ranked: 'top',
  day: 'bottom',
  eras: 'bottom',
  lines: 'bottom',
  awards: 'top',
  bookends: 'top',
  comparison: 'center',
  crew: 'top',
  close: 'bottom',
};

const NUMBER = new Intl.NumberFormat('en-GB');

function shortStop(name: string): string {
  return name.replace(/ (Centraal|Station)$/i, '');
}

function withArticle(name: string): string {
  if (!/^The /i.test(name)) return name;
  const rest = name.replace(/^The /i, '');
  return `${/^[aeiou]/i.test(rest) ? 'an' : 'a'} ${rest}`;
}

function lineFor({
  chapter,
  year,
  demo,
  yearOver,
  count,
}: {
  chapter: Chapter;
  year: number;
  demo: boolean;
  yearOver: boolean;
  count: number;
}): string {
  if (chapter.kind === 'cover') {
    if (demo) return 'Hi there. Your demo year is ready.';
    if (!yearOver) return 'Hi there. Your year so far is ready.';
    return `Hi there. Your ${year} is ready.`;
  }

  if (chapter.id === 'thin') {
    return count === 1 ? 'One journey. Not a year yet.' : `${count} journeys. Not a year yet.`;
  }

  if (chapter.kind === 'number') {
    return `${NUMBER.format(count)} ${count === 1 ? 'journey' : 'journeys'}. You don't stay in much.`;
  }

  if (chapter.kind === 'name') {
    return `You're ${withArticle(chapter.big)}.`;
  }

  if (chapter.kind === 'map') {
    const places = chapter.map?.places ?? chapter.count ?? count;
    return `${places} ${places === 1 ? 'place' : 'places'}. You got around.`;
  }

  if (chapter.kind === 'distance' && chapter.distance) {
    return `${NUMBER.format(Math.round(chapter.distance.km))} km. That's a lot of window-gazing.`;
  }

  if (chapter.kind === 'route' && chapter.route) {
    return `${count} times: ${shortStop(chapter.route.from)}\u00a0↔\u00a0${shortStop(chapter.route.to)}. You two are close.`;
  }

  if (chapter.id === 'origin') {
    return `${chapter.big}. Your second address.`;
  }

  if (chapter.kind === 'bars') {
    return `${chapter.big}. Your daily appointment.`;
  }

  if (chapter.kind === 'arc') {
    return `${chapter.big}. No changes. No drama.`;
  }

  if (chapter.kind === 'stretch') {
    return `${chapter.big}. Worth every minute.`;
  }

  if (chapter.kind === 'word') {
    return `${chapter.big} was the mood.`;
  }

  /*
   * **The list and the day.**
   *
   * The ranked card's rows carry the five names and their counts, so the sentence says what the
   * rows are and nothing that is already printed beside it. The day card is the one date and one
   * number, said as a sentence rather than a stack of figures.
   */
  if (chapter.kind === 'ranked') {
    const places = chapter.ranked?.length ?? 0;
    return places === 1
      ? 'One place, again and again.'
      : `${places} places, in the order you used them.`;
  }

  if (chapter.kind === 'day' && chapter.day) {
    /*
     * The number is the day's own count, not the deck's counting figure: a date with a figure that
     * climbs towards it reads as a dashboard, and it changed the sentence under the check's feet
     * while it climbed. A day is a fact that is simply true.
     */
    const onTheDay = chapter.day.count;
    return `Your busiest day: ${chapter.day.date}, ${onTheDay} ${onTheDay === 1 ? 'journey' : 'journeys'}.`;
  }

  if (chapter.kind === 'eras') {
    const eras = chapter.eras?.length ?? 0;
    return eras === 1 ? 'One era. A full character arc.' : `${eras} eras. A full character arc.`;
  }

  if (chapter.id === 'lines') {
    return `${chapter.big}. Your main character line.`;
  }

  if (chapter.kind === 'awards') {
    return `${chapter.awards?.[0]?.title ?? 'Your year had trophies'}.`;
  }

  if (chapter.kind === 'bookends') {
    return "First out. Last home. That's commitment.";
  }

  if (chapter.kind === 'comparison') {
    return `${chapter.big}. Show-off.`;
  }

  if (chapter.kind === 'crew') {
    return "You didn't do this alone.";
  }

  return "That was the year. Don't be a stranger.";
}

/*
 * **The line under the line.**
 *
 * The reference never leaves a card with one sentence for its whole life: it sets a small line
 * beneath the big one and swaps it mid-card, which is most of why its frames read as written rather
 * than printed. This is that line, in two halves — the first runs as the card arrives, the second
 * takes over at the halfway point, and the stylesheet crossfades them on the card's own clock.
 *
 * It is a `div`, not a `p`, on purpose: `scripts/check-wrapped-scenes.mjs` counts `h1`, `h2` and `p`
 * to prove a card has one headline, and this is the small line beside it, not a second headline.
 */
function subFor(chapter: Chapter): { a: string; b: string } | null {
  const top = chapter.ranked?.[0];
  if (chapter.kind === 'cover') return null;
  if (chapter.kind === 'close') return null;
  switch (chapter.id) {
    case 'total':
      return { a: 'every one of them, counted', b: 'not a single tap wasted' };
    case 'name':
      return { a: 'the shape your week took', b: 'and it suits you' };
    case 'map':
      return { a: 'one dot for every stop you used', b: 'and the lines between them' };
    case 'distance':
      return { a: 'window seat, obviously', b: "that's Utrecht to Rome and back" };
    case 'pair':
      return { a: 'there and back, again and again', b: 'your most-travelled pair' };
    case 'origin':
      return { a: 'where every journey began', b: 'your second address, honestly' };
    case 'hour':
      return { a: 'the minute you always leave', b: 'every working day, almost' };
    case 'direct':
      return { a: 'no changes, no luck', b: 'the long way round, every time' };
    case 'longest':
      return { a: 'your longest single sit', b: 'one seat, no stops' };
    case 'look':
      return { a: 'your colour this year', b: 'it was always going to be this one' };
    case 'ranked':
      return top
        ? { a: 'counted by journeys', b: `${top.name} wins by miles` }
        : { a: 'counted by journeys', b: 'in the order you used them' };
    case 'day':
      return chapter.day
        ? { a: 'more taps than any other day', b: `${chapter.day.count} on the day` }
        : { a: 'more taps than any other day', b: 'one date, no argument' };
    case 'eras':
      return { a: 'three chapters of you', b: 'the last one is the loudest' };
    case 'lines':
      return { a: 'said more than any other', b: 'you know which one' };
    case 'awards':
      return { a: 'one trophy, no contest', b: 'pick it up on the way out' };
    case 'bookends':
      return { a: 'first out, last home', b: 'the timetable knows your name' };
    case 'comparison':
      return { a: 'against last year', b: 'you went further' };
    case 'crew':
      return { a: 'the people in your seats', b: "they'd do it again" };
    default:
      return null;
  }
}

type SceneProps = {
  chapter: Chapter;
  year: number;
  count: number;
  journeys: number;
  demo: boolean;
  yearOver: boolean;
  /** The traveller's motion setting: the geometry is drawn once and left alone. */
  still?: boolean;
  /** The film is paused: the object holds its pose instead of being drawn again from zero. */
  hold?: boolean;
  onBegin: () => void;
  /** Back to the cover, from the poster. */
  onReplay: () => void;
};

export function WrappedScenes({
  chapter,
  year,
  count,
  journeys,
  demo,
  yearOver,
  still,
  hold,
  onBegin,
  onReplay,
}: SceneProps & { previous?: Chapter | null }) {
  const place = PLACE[chapter.id] ?? 'center';
  const size = SIZE[chapter.id] ?? 'large';
  const line = lineFor({ chapter, year, demo, yearOver, count });
  const sub = subFor(chapter);
  /* Split on ordinary spaces only, so a route's non-breaking gap stays inside one word. */
  const words = line.split(/ +/);

  return (
    <div
      className={`film2 film2--${chapter.id} film2--place-${place} film2--size-${size}`}
      data-chapter={chapter.id}
      data-place={place}
      data-size={size}
      /* The day card's own two facts, so the deck check can read what the sentence was built from. */
      data-day={chapter.day?.date ?? ''}
      data-day-count={chapter.day ? String(chapter.day.count) : ''}
      key={chapter.id}
    >
      {/*
        * **Every card gets the kind of scene its own card would have.**
        *
        * The reference does not draw one landscape twenty times. It has a small grammar: a flat field,
        * then huge stepped shapes cut off at a corner (layered ribbons on its biggest-day card, pixel
        * wedges on its list, a torn collage on its summary), and clear space where the words go.
        * Each chapter is given its own kind of shape below, drawn from its own colours.
        */}
      <div className={`w-scene w-scene--${place} w-scene--${kindOf(chapter.id)}`} aria-hidden="true">
        <svg viewBox="0 0 100 200" preserveAspectRatio="none">
          {sceneFor(chapter.id, lookFor(chapter.id).mass[0], lookFor(chapter.id).mass[1])}
        </svg>
      </div>

      <WrappedArt chapter={chapter} count={count} year={year} still={still} hold={hold} />

      <div className="film2-copy">
        <h1 className="film2-line">
          {words.map((word, at) => (
            <Fragment key={at}>
              <span className="film2-word" style={{ '--i': at } as CSSProperties}>
                {word}
              </span>
              {at < words.length - 1 ? ' ' : null}
            </Fragment>
          ))}
        </h1>
        {sub ? (
          <div className="film2-sub">
            <span className="film2-sub__a">{sub.a}</span>
            <span className="film2-sub__b">{sub.b}</span>
          </div>
        ) : null}
        {chapter.kind === 'cover' ? (
          <button type="button" className="film2-begin" onClick={onBegin}>
            Begin
          </button>
        ) : null}
      </div>

      {/* Grain and the darkening at the corners: the difference between a print and a photograph. */}
      <span className="film2-grain" aria-hidden="true" />

      {/*
        * **The list is the picture.**
        *
        * Five rows on the colour itself: the place's first letter on a stepped tile, the name, the
        * count. No card behind them, and the last row runs past the bottom of the frame so the list
        * reads as carrying on past the edge instead of stopping neatly at five.
        */}
      {chapter.kind === 'ranked' && chapter.ranked?.length ? (
        <ol className="w-rank" data-total={journeys}>
          {chapter.ranked.map((row, at) => (
            <li className="w-rank__row" key={row.name} data-pos={at + 1} data-count={row.count}>
              <span className="w-rank__no">{at + 1}</span>
              <span className="w-rank__tile" aria-hidden="true">
                {row.initial}
              </span>
              <span className="w-rank__name">{row.name}</span>
              <span className="w-rank__count">{row.count}</span>
            </li>
          ))}
        </ol>
      ) : null}

      {/* The film ends on the card, not on a sentence with a share behind a pill. */}
      {chapter.kind === 'close' && chapter.poster ? (
        <WrappedPoster poster={chapter.poster} onReplay={onReplay} />
      ) : null}
    </div>
  );
}
