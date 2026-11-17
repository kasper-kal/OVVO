import type { CSSProperties, ReactNode } from 'react';
import type { Chapter } from '../../lib/wrappedDeck';

/*
 * **The picture is a field with a mass in it, not a prop on a table.**
 *
 * Every chapter returns the same two layers: a `w-mass` (or three) that runs past the edges of the
 * frame, and, where the chapter is about something you can point at, a small focal layer on top of
 * it. All of the colour, shaping and fading lives in `styles/wrapped-art.css`; this file only decides
 * which masses a chapter has and where a pin or a photograph goes.
 *
 * The rule the drawings follow: nothing sits neatly inside the frame. A mass is always cut off by at
 * least one edge, because a shape you can see all of is a logo, and Wrapped never shows you the whole
 * thing.
 */

type ArtProps = {
  chapter: Chapter;
  count: number;
  year: number;
};

function shortStop(name: string): string {
  return name.replace(/ (Centraal|Station)$/i, '');
}

export function WrappedArt({ chapter }: ArtProps) {
  const id = chapter.id;
  const stops = chapter.map?.stops ?? [];

  let art: ReactNode;

  switch (id) {
    case 'cover':
      art = (
        <>
          <span className="w-mass" />
          <span className="w-mass w-mass--b" />
        </>
      );
      break;

    case 'total':
      art = <span className="w-mass" />;
      break;

    case 'name':
      art = (
        <>
          <span className="w-mass" />
          <span className="w-mass w-mass--b" />
        </>
      );
      break;

    case 'map':
      art = (
        <>
          <span className="w-mass" />
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
        </>
      );
      break;

    case 'distance':
      art = (
        <>
          <span className="w-mass" />
          <span className="w-mass w-mass--b" />
        </>
      );
      break;

    case 'pair':
      art = (
        <>
          <span className="w-mass" />
          <span className="w-mass w-mass--b" />
        </>
      );
      break;

    case 'origin':
      art = <span className="w-mass" />;
      break;

    case 'hour':
      art = <span className="w-mass" />;
      break;

    case 'direct':
      art = <span className="w-mass" />;
      break;

    case 'longest':
      art = (
        <>
          <span className="w-mass" />
          <span className="w-horizon" />
        </>
      );
      break;

    case 'look':
      art = (
        <>
          {chapter.photo ? <img className="w-photo" src={chapter.photo} alt="" /> : null}
          <span className="w-mass" />
        </>
      );
      break;

    case 'eras':
      art = (
        <>
          <span className="w-mass" />
          <span className="w-mass w-mass--b" />
          <span className="w-mass w-mass--c" />
        </>
      );
      break;

    case 'lines':
      art = <span className="w-mass" />;
      break;

    case 'awards':
      art = (
        <>
          <span className="w-mass" />
          <span className="w-mass w-mass--b" />
          <span className="w-mass w-mass--c" />
        </>
      );
      break;

    case 'bookends':
      art = (
        <>
          <span className="w-sun" />
          <span className="w-mass" />
        </>
      );
      break;

    case 'comparison':
      art = (
        <>
          <span className="w-mass" />
          <span className="w-mass w-mass--b" />
        </>
      );
      break;

    case 'crew':
      art = (
        <>
          <span className="w-mass" />
          <span className="w-mass w-mass--b" />
          <span className="w-mass w-mass--c" />
          <span className="w-mass w-mass--d" />
          <span className="w-mass w-mass--e" />
        </>
      );
      break;

    case 'close':
    default:
      art = (
        <>
          <span className="w-mass" />
          <span className="w-stub" />
        </>
      );
      break;
  }

  return (
    <div className={`film2-art film2-art--${id}`} data-art={id} aria-hidden="true">
      {art}
    </div>
  );
}

/* Kept for the pair chapter's captions in other surfaces; the mass itself has no words on it. */
export const wrappedArtStops = (chapter: Chapter) => (chapter.map?.stops ?? []).map((stop) => shortStop(stop.name));
