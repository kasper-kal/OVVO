import type { CSSProperties } from 'react';
import type { Chapter } from '../../lib/wrappedDeck';

/*
 * **One sentence. One object. Black around both.**
 *
 * The reference does not put a headline, a number, a caption, a footnote and a chart on every
 * page. It puts one thought on screen, next to one object that keeps changing shape, and lets
 * the rest of the screen stay black. This file is that page. The moving object is in
 * `WrappedWorld`; this file writes the single sentence and decides whether it sits above,
 * below or through the object.
 *
 * The number is inside the sentence, not a separate monument. The old kicker, sub-line, route
 * label, footnote, story bridge, diagram, list and credit block are gone on purpose.
 */

type Place = 'top' | 'center' | 'bottom';

const PLACE: Record<string, Place> = {
  cover: 'center',
  total: 'bottom',
  name: 'center',
  map: 'bottom',
  distance: 'top',
  pair: 'center',
  origin: 'bottom',
  hour: 'top',
  direct: 'center',
  longest: 'top',
  look: 'bottom',
  eras: 'bottom',
  lines: 'center',
  awards: 'bottom',
  bookends: 'top',
  comparison: 'center',
  crew: 'bottom',
  close: 'center',
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

const TINT: Record<string, [string, string]> = {
  cover: ['#ff2d75', '#ff7a00'],
  total: ['#7dff00', '#00e676'],
  name: ['#ff4b1f', '#ffb000'],
  map: ['#ff2d55', '#ff8a00'],
  distance: ['#0a7cff', '#00d4ff'],
  pair: ['#ff2d75', '#ff4b2b'],
  origin: ['#ff4b1f', '#ffb000'],
  hour: ['#ffb000', '#ff2d75'],
  direct: ['#5a2bff', '#00d9ff'],
  longest: ['#ff1744', '#ffb000'],
  look: ['#ffb000', '#ff2d75'],
  eras: ['#ffb000', '#ff4b2b'],
  lines: ['#00e676', '#b6ff00'],
  awards: ['#ff1744', '#ffb000'],
  bookends: ['#0057ff', '#00c2ff'],
  comparison: ['#00e676', '#b6ff00'],
  crew: ['#5a2bff', '#00d9ff'],
  close: ['#0066ff', '#00e5ff'],
};

function lineFor({
  chapter,
  year,
  journeys,
  demo,
  yearOver,
}: {
  chapter: Chapter;
  year: number;
  journeys: number;
  demo: boolean;
  yearOver: boolean;
}): string {
  const count = chapter.count ?? journeys;

  if (chapter.kind === 'cover') {
    if (demo) return 'Hi there. Your demo year is ready.';
    if (!yearOver) return 'Hi there. Your year so far is ready.';
    return `Hi there. Your ${year} is ready.`;
  }

  if (chapter.id === 'thin') {
    return count === 1 ? 'One journey. Not a year yet.' : `${count} journeys. Not a year yet.`;
  }

  if (chapter.kind === 'number') {
    return `${count} ${count === 1 ? 'journey' : 'journeys'}. One year of leaving.`;
  }

  if (chapter.kind === 'name') {
    return `You're ${withArticle(chapter.big)}.`;
  }

  if (chapter.kind === 'map') {
    const places = chapter.map?.places ?? count;
    return `${places} ${places === 1 ? 'place' : 'places'}. One shape.`;
  }

  if (chapter.kind === 'distance' && chapter.distance) {
    return `${NUMBER.format(Math.round(chapter.distance.km))} km. The long way round.`;
  }

  if (chapter.kind === 'route' && chapter.route) {
    return `${chapter.route.count} times: ${shortStop(chapter.route.from)} ↔ ${shortStop(chapter.route.to)}.`;
  }

  if (chapter.id === 'origin') {
    return `${chapter.big} knew you by name.`;
  }

  if (chapter.kind === 'bars') {
    return `${chapter.big}. Your hour.`;
  }

  if (chapter.kind === 'arc') {
    return `${chapter.big}. No changes.`;
  }

  if (chapter.kind === 'stretch') {
    return `The long haul: ${chapter.big}.`;
  }

  if (chapter.kind === 'word') {
    return `${chapter.big} was the mood.`;
  }

  if (chapter.kind === 'eras') {
    const eras = chapter.eras?.length ?? 0;
    return eras === 1 ? 'One era. One traveller.' : `${eras} eras. One traveller.`;
  }

  if (chapter.id === 'lines') {
    return `${chapter.big} carried your year.`;
  }

  if (chapter.kind === 'awards') {
    return `${chapter.awards?.[0]?.title ?? 'Your year had trophies'}.`;
  }

  if (chapter.kind === 'bookends') {
    return 'First out. Last home.';
  }

  if (chapter.kind === 'comparison') {
    return `${chapter.big}. You vs. you.`;
  }

  if (chapter.kind === 'crew') {
    return 'A year is better shared.';
  }

  return `That was the year. ${journeys} ${journeys === 1 ? 'journey' : 'journeys'}, all yours.`;
}

type SceneProps = {
  chapter: Chapter;
  year: number;
  count: number;
  journeys: number;
  demo: boolean;
  yearOver: boolean;
  onBegin: () => void;
};

export function WrappedScenes({
  chapter,
  year,
  count: _count,
  journeys,
  demo,
  yearOver,
  onBegin,
}: SceneProps & { previous?: Chapter | null }) {
  const place = PLACE[chapter.id] ?? 'center';
  const [from, to] = TINT[chapter.id] ?? TINT.cover;
  const line = lineFor({ chapter, year, journeys, demo, yearOver });

  return (
    <div
      className={`film2 film2--${chapter.id} film2--place-${place}`}
      data-chapter={chapter.id}
      data-place={place}
      style={{ '--accent': from, '--accent-2': to } as CSSProperties}
      key={chapter.id}
    >
      {chapter.photo ? (
        <>
          <img className="film2-photo" src={chapter.photo} alt="" aria-hidden="true" />
          <span className="film2-photo-shade" aria-hidden="true" />
        </>
      ) : null}

      <span className="film2-glow" aria-hidden="true" />
      <span className="film2-scrim" aria-hidden="true" />

      <div className="film2-copy">
        <h1 className="film2-line">{line}</h1>
        {chapter.kind === 'cover' ? (
          <button type="button" className="film2-begin" onClick={onBegin}>
            Begin
          </button>
        ) : null}
      </div>
    </div>
  );
}
