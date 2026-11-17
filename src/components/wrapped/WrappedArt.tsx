import type { CSSProperties } from 'react';
import type { Chapter } from '../../lib/wrappedDeck';
import { WrappedMasses } from './WrappedMasses';

/*
 * **The picture is a field with a lit mass in it, not a prop on a table.**
 *
 * Every chapter now has the same two layers: one canvas of real geometry (`WrappedMasses`), and,
 * where the chapter is about something you can point at, a small focal layer over it - the map's lit
 * pins, or the photograph the look chapter is built on.
 *
 * Nothing sits neatly inside the frame. The canvas is larger than the page and is clipped by
 * `.film2-art`, and the geometry inside it is composed to run past the edges, because a shape you
 * can see all of is a logo and Wrapped never shows you the whole thing.
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

export function WrappedArt({ chapter, still }: ArtProps) {
  const id = chapter.id;
  const stops = chapter.map?.stops ?? [];

  return (
    <div className={`film2-art film2-art--${id}`} data-art={id} aria-hidden="true">
      {id === 'look' && chapter.photo ? <img className="w-photo" src={chapter.photo} alt="" /> : null}

      <WrappedMasses chapter={chapter} still={still} />

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
    </div>
  );
}

/* Kept for the pair chapter's captions in other surfaces; the mass itself has no words on it. */
export const wrappedArtStops = (chapter: Chapter) => (chapter.map?.stops ?? []).map((stop) => shortStop(stop.name));
