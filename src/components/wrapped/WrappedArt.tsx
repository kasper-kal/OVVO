import type { CSSProperties } from 'react';
import type { Chapter } from '../../lib/wrappedDeck';
import { WrappedMasses } from './WrappedMasses';

/*
 * **The picture is a field with a lit mass in it, not a prop on a table.**
 *
 * Every chapter has three layers now: the colour field, one canvas of real geometry
 * (`WrappedMasses`), and a small focal layer over it - the thing the chapter is actually about.
 * The reference never shows a form and nothing else: there is always a sleeve, a photo or a short
 * list sitting on the colour, and that second object is what tells the eye where to look.
 *
 * Here the focal layer is drawn, never photographed, because OVVO has no photographs of its
 * stations: a stack of tickets for a counting chapter, a rail with two ends for the pair, and a
 * small stepped mosaic everywhere else. It carries no words, so the one-sentence rule holds.
 */

type ArtProps = {
  chapter: Chapter;
  count: number;
  year: number;
  still?: boolean;
};

function shortStop(name: string): string {
  return name.replace(/ (Centraal|Station)$/i, '');
}

/** Which drawn object the focal layer uses. */
function focalKind(chapter: Chapter): 'tickets' | 'rail' | 'mosaic' {
  if (chapter.id === 'pair' || chapter.kind === 'route') return 'rail';
  if (chapter.kind === 'number' || chapter.kind === 'bars') return 'tickets';
  return 'mosaic';
}

export function WrappedArt({ chapter, still }: ArtProps) {
  const id = chapter.id;
  const stops = chapter.map?.stops ?? [];
  const kind = focalKind(chapter);

  return (
    <div className={`film2-art film2-art--${id}`} data-art={id} aria-hidden="true">
      {id === 'look' && chapter.photo ? <img className="w-photo" src={chapter.photo} alt="" /> : null}

      {/*
        * **Something to look at, on every card.** The map keeps its pins and the look keeps its
        * photograph; every other chapter gets the drawn object that suits it. It sits where the
        * sentence is not, so it can never be the reason a line is hard to read.
        */}
      {id === 'map' ? (
        <span className="w-pins">
          {(stops.length
            ? stops.slice(0, 12)
            : Array.from({ length: 9 }, (_, i) => ({ x: 18 + ((i * 23) % 68), y: 20 + ((i * 31) % 62) }))
          ).map((stop, i) => (
            <span
              className="w-pin"
              style={{ left: `${stop.x}%`, top: `${stop.y}%`, '--i': i } as CSSProperties}
              key={`${stop.x}-${stop.y}-${i}`}
            />
          ))}
        </span>
      ) : null}

      {/* The ranked chapter's own five rows are the thing to look at, so it gets no second object. */}
      {id !== 'look' && id !== 'ranked' ? (
        <span className={`w-focal w-focal--${kind}`} data-focal={kind}>
          <i />
          <i />
          <i />
        </span>
      ) : null}

      <WrappedMasses chapter={chapter} still={still} />
    </div>
  );
}

/* Kept for the pair chapter's captions in other surfaces; the mass itself has no words on it. */
export const wrappedArtStops = (chapter: Chapter) => (chapter.map?.stops ?? []).map((stop) => shortStop(stop.name));
