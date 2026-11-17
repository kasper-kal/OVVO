import { Fragment, type CSSProperties } from 'react';
import type { Chapter } from '../../lib/wrappedDeck';
import { WrappedArt } from './WrappedArt';

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

type SceneProps = {
  chapter: Chapter;
  year: number;
  count: number;
  journeys: number;
  demo: boolean;
  yearOver: boolean;
  /** The traveller's motion setting: the geometry is drawn once and left alone. */
  still?: boolean;
  onBegin: () => void;
};

export function WrappedScenes({
  chapter,
  year,
  count,
  demo,
  yearOver,
  still,
  onBegin,
}: SceneProps & { previous?: Chapter | null }) {
  const place = PLACE[chapter.id] ?? 'center';
  const size = SIZE[chapter.id] ?? 'large';
  const line = lineFor({ chapter, year, demo, yearOver, count });
  /* Split on ordinary spaces only, so a route's non-breaking gap stays inside one word. */
  const words = line.split(/ +/);

  return (
    <div
      className={`film2 film2--${chapter.id} film2--place-${place} film2--size-${size}`}
      data-chapter={chapter.id}
      data-place={place}
      data-size={size}
      key={chapter.id}
    >
      <WrappedArt chapter={chapter} count={count} year={year} still={still} />

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
        {chapter.kind === 'cover' ? (
          <button type="button" className="film2-begin" onClick={onBegin}>
            Begin
          </button>
        ) : null}
      </div>
    </div>
  );
}
