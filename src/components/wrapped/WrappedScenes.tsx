import { Fragment, type CSSProperties } from 'react';
import type { Chapter } from '../../lib/wrappedDeck';
import { lookFor } from '../../lib/wrappedLook';
import { WrappedArt } from './WrappedArt';
import { WrappedField } from './WrappedField';
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


/* Which rendered loop each chapter plays: its colour family decides. */
const LOOP: Record<string, string> = {
  cover: 'magenta', total: 'magenta', name: 'magenta', map: 'blue', distance: 'magenta',
  pair: 'magenta', origin: 'blue', hour: 'blue', direct: 'blue', longest: 'magenta',
  look: 'green', ranked: 'amber', day: 'magenta', eras: 'green', lines: 'blue',
  awards: 'amber', bookends: 'amber', comparison: 'magenta', crew: 'amber', close: 'magenta',
};

function loopFor(id: string): string {
  return LOOP[id] ?? 'magenta';
}

type Place = 'top' | 'center' | 'bottom';

/*
 * **Which way the plate behind the words goes.**
 *
 * Half the deck is cream type on a dark field and half is near-black type on a pale one, so one plate
 * colour cannot serve both. The ink itself decides: a light ink gets a dark plate, a dark ink a pale one.
 * That is what lets the wall carry on through the sentence instead of being cut away above it.
 */
function inkIsLight(hex: string): boolean {
  const value = parseInt(hex.replace('#', ''), 16);
  const channels = [(value >> 16) & 255, (value >> 8) & 255, value & 255].map((channel) => {
    const share = channel / 255;
    return share <= 0.03928 ? share / 12.92 : ((share + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2] > 0.35;
}

const SIZE: Record<string, 'small' | 'medium' | 'large'> = {
  cover: 'large',
  total: 'medium',
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
  total: 'center',
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
 * than printed. This is that line, in two halves, the first runs as the card arrives, the second
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
  const lightInk = inkIsLight(lookFor(chapter.id).ink);
  /*
   * **The one-chapter lab.**
   *
   * The counting card is being rebuilt first, on its own, until it is right: the screen is one glossy
   * shape sitting in the middle of the frame instead of a wall of repeated marks over it. The wall stays
   * on the other nineteen cards until this one has been judged and approved.
   */
  const noWall = chapter.id === 'total';
  const line = lineFor({ chapter, year, demo, yearOver, count });
  const sub = subFor(chapter);
  /*
   * Split on ordinary spaces only, so a route's non-breaking gap stays inside one word. The counting
   * card's sentence is two sentences, laid out by the same builder and swapped halfway through.
   */
  const lineNode = (text: string) => {
    const words = text.split(/ +/);
    return (
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
    );
  };
  const headline = lineNode(line);
  /* "146 journeys. You don't stay in much." becomes the fact, then the feeling. */
  const [fact, ...rest] = line.split('. ');
  const feeling = rest.join('. ');

  return (
    <div
      className={`film2 film2--${chapter.id} film2--place-${place} film2--size-${size}`}
      data-chapter={chapter.id}
      data-place={place}
      data-size={size}
      data-ink={lightInk ? 'light' : 'dark'}
      /* The film is paused: a held frame must hold the wall too, or the pause only half works. */
      data-hold={hold ? '1' : undefined}
      /* The day card's own two facts, so the deck check can read what the sentence was built from. */
      data-day={chapter.day?.date ?? ''}
      data-day-count={chapter.day ? String(chapter.day.count) : ''}
      key={chapter.id}
    >
      {/*
        * **The backdrop is a render, not a drawing.**
        *
        * Each kind of card, ribbons, wedges, collage, columns, arches, rays, ridges, is a small scene
        * built and lit in Blender (`scripts/render-backdrops.py`) and rendered portrait. It comes in
        * grey on white and is multiplied into the chapter's own field here, so one render serves every
        * card and a backdrop can never disagree with the colour it sits on.
        */}
      {/* A dark ground under the colour: the reference is a dark film with bright light in it. */}
      <div className={`w-scene w-scene--${place} w-shade`} aria-hidden="true" />

      <video
        className={`w-scene w-scene--${place} w-backdrop`}
        src={`/wrapped-loops/${loopFor(chapter.id)}0001-0060.webm`}
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
      />

      {/*
        * **The wall the card is made of.**
        *
        * A motif repeated across the whole frame, marching every frame and exchanged for another motif
        * every 2.4 seconds. Without this a card was one picture for ten seconds, which is the one thing
        * the reference never does.
        */}
      {noWall ? null : <WrappedField chapter={chapter.id} place={place} />}

      {/* Darkened above the loop, not under it: the loop was painting over the shade. */}
      <div className={`w-scene w-scene--${place} w-shade`} aria-hidden="true" />

      <WrappedArt chapter={chapter} count={count} year={year} still={still} hold={hold} />

      {/*
        * **The buckle in the field where the words stand.**
        *
        * It has to be a layer of its own, not a child of the copy: the deck check measures the field with the
        * words hidden, and a plate inside the copy went with them, so every reading was of the bare field. It
        * sits above the wall and below the sentence, and it carries the ink's own opposite colour.
        */}
      <div className="w-plate" aria-hidden="true" />

      <div className="film2-copy">
        {/*
          * **The headline changes once, the way the reference's does.**
          *
          * Wrapped does not leave one sentence up for a whole card: it sets the fact, then swaps it for
          * the feeling halfway through ("Hi there" becomes "Life moves fast"). The counting card is the
          * first to do it. The swap sits inside the copy block as a plain element, not a second `h1`,
          * because the deck's rule is one headline and the check counts them.
          */}
        {chapter.id === 'total' ? (
          <div className="film2-head">
            {lineNode(rest.length ? `${fact}.` : line)}
            {rest.length ? <div className="film2-after">{feeling}</div> : null}
          </div>
        ) : (
          headline
        )}
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
