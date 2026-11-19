import { Fragment, type CSSProperties } from 'react';
import type { Chapter } from '../../lib/wrappedDeck';
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


type SceneKind = 'blades' | 'wedges' | 'collage' | 'horizon' | 'arches' | 'rays' | 'bars';

/*
 * Which kind of backdrop each chapter gets: the shape the reference would use for that card. The
 * plates themselves are rendered in `scripts/render-backdrops.py`.
 */
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
        * **The backdrop is a render, not a drawing.**
        *
        * Each kind of card — ribbons, wedges, collage, columns, arches, rays, ridges — is a small scene
        * built and lit in Blender (`scripts/render-backdrops.py`) and rendered portrait. It comes in
        * grey on white and is multiplied into the chapter's own field here, so one render serves every
        * card and a backdrop can never disagree with the colour it sits on.
        */}
      <div
        className={`w-scene w-scene--${place} w-backdrop w-backdrop--${kindOf(chapter.id)}`}
        style={{ backgroundImage: `url(/wrapped-scenes/${kindOf(chapter.id)}.png)` }}
        aria-hidden="true"
      />

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
