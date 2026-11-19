import { useId } from 'react';

/*
 * **The field, not the object.**
 *
 * Read off every tenth of a second of the reference, the thing that makes it Wrapped is not a colour and
 * not a brightness: it is a wall of *many repeated marks* that the frame is made of, and the wall is
 * *exchanged for a different wall* every two to four seconds. Stripes become fans, fans become chevrons,
 * chevrons become arches. The colour stays; the mark and the way it travels change.
 *
 * Ours had one rendered loop per card, so a card was one picture for its whole life and nothing inside it
 * ever changed composition. This is that missing grammar, drawn flat and in vector because that is what
 * the reference is: a pattern tile repeated thirty times across the frame, marching one whole tile every
 * second and a half, and three of them taking turns on a 7.2 second clock so the mark itself is swapped
 * every 2.4 seconds.
 *
 * The whole thing is a stylesheet clock. Nothing here is timed in JavaScript, so it cannot drift, cannot
 * queue up behind a slow frame, and keeps running while the film is paused.
 */

type Mark = 'stripes' | 'chevrons' | 'fans' | 'diamonds' | 'arches' | 'waves' | 'flowers' | 'rays';

/** The motifs the reference actually uses, in the order its own film exchanges them. */
const MARKS: Mark[] = ['chevrons', 'fans', 'stripes', 'diamonds', 'arches', 'waves', 'flowers', 'rays'];

/**
 * The tile the mark is repeated on.
 *
 * 74 by 92 puts five columns and nine rows of the mark across a phone, which is the density the reference
 * holds: dozens of copies, never a handful. Both numbers are odd on purpose, so the repeat never lines up
 * with the frame's own edges and the wall never reads as a few big icons.
 */
export const TILE_W = 67;
export const TILE_H = 84;

/* The marks are drawn in a 74 by 92 box and scaled onto the repeat, so the tile can be resized without
   redrawing eleven shapes and forgetting one. */
const DESIGN_W = 74;
const DESIGN_H = 92;

/**
 * **Three motifs per chapter, and no two neighbours share a trio.**
 *
 * The seed is the chapter id, so a chapter keeps the same three marks on every visit, and the stride of
 * three through an eight-mark list means the three can never repeat each other inside one card.
 */
function marksFor(id: string): Mark[] {
  const seed = [...id].reduce((total, letter) => total + letter.charCodeAt(0), 0);
  return [0, 1, 2].map((beat) => MARKS[(seed + beat * 3) % MARKS.length]);
}

/*
 * **Every mark is drawn inside its tile, and every mark that crosses an edge crosses it at the same
 * height on both sides.**
 *
 * The first pass had strokes and arcs running past the tile, and an SVG pattern clips at the tile, so
 * the fans came out as flat bands with a hard seam every 74 pixels. A mark that enters the left edge at
 * one height and leaves the right edge at the same height continues into the next tile instead, and the
 * seam disappears.
 */
function MarkShape({ mark }: { mark: Mark }) {
  switch (mark) {
    /* Four fat vertical bars, full height: they run off the top and bottom, so the wall reads as stripes. */
    case 'stripes':
      return (
        <g>
          <rect x="2" y="0" width="15" height={TILE_H} />
          <rect x="39" y="0" width="15" height={TILE_H} />
        </g>
      );

    /* A solid chevron band. The arms leave each side edge at the same height, so the zigzag runs on. */
    case 'chevrons':
      return <path d="M0 78 L37 44 L74 78 L74 56 L37 22 L0 56 Z" />;

    /* Concentric scallops on the bottom edge, the fan row the reference opens its pink block with. */
    case 'fans':
      return (
        <g fill="none" strokeWidth="9">
          <path d="M0 93 A37 37 0 0 1 74 93" />
          <path d="M11 93 A26 26 0 0 1 63 93" />
          <path d="M22 93 A15 15 0 0 1 52 93" />
        </g>
      );

    /* One solid diamond, point to point with its neighbours, like the reference's green block. */
    case 'diamonds':
      return <path d="M37 4 L70 46 L37 88 L4 46 Z" />;

    /* A round-topped arch, open at the bottom, the doorway the reference cuts in its blue block. */
    case 'arches':
      return (
        <g>
          <path d="M7 92 V46 A30 30 0 0 1 67 46 V92 H51 V46 A14 14 0 0 0 23 46 V92 Z" />
        </g>
      );

    /* One full period of a thick wave, entering and leaving at the same height. */
    case 'waves':
      return (
        <g fill="none" strokeWidth="11">
          <path d="M0 46 Q18.5 16 37 46 T74 46" />
        </g>
      );

    /* The pixel flower: five separated petals, the shape the reference's green block is made of. */
    case 'flowers':
      return (
        <g>
          {[0, 1, 2, 3, 4].map((petal) => {
            const angle = (petal / 5) * Math.PI * 2 - Math.PI / 2;
            return (
              <circle
                key={petal}
                cx={37 + Math.cos(angle) * 13}
                cy={46 + Math.sin(angle) * 13}
                r="8.5"
              />
            );
          })}
          <circle cx="37" cy="46" r="5.5" />
        </g>
      );

    /* A pinwheel of eight spokes, fully inside the tile. */
    default:
      return (
        <g strokeWidth="5" strokeLinecap="butt">
          {Array.from({ length: 8 }, (_, spoke) => {
            const angle = (spoke / 8) * Math.PI * 2;
            return (
              <line
                key={spoke}
                x1={37 + Math.cos(angle) * 7}
                y1={46 + Math.sin(angle) * 7}
                x2={37 + Math.cos(angle) * 31}
                y2={46 + Math.sin(angle) * 31}
              />
            );
          })}
        </g>
      );
  }
}

/**
 * **The field.**
 *
 * Three pattern walls stacked in the frame, each holding one motif, each repeating it across the whole
 * card, and each visible for one third of a 7.2 second clock. The exchange is a hard cut, not a fade,
 * because the reference's is a cut.
 */
export function WrappedField({ chapter, place }: { chapter: string; place: string }) {
  const marks = marksFor(chapter);
  /* Ids must be unique while two chapters are on screen through a transition, and the colon useId
     returns is not safe inside a url() reference. */
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');

  return (
    <div className={`w-scene w-scene--${place} w-field`} aria-hidden="true" data-beats={marks.join(' ')}>
      {marks.map((mark, beat) => (
        <span className={`w-field__beat w-field__beat--${beat + 1}`} key={`${mark}-${beat}`}>
          <svg className="w-field__svg" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern
                id={`mark-${uid}-${beat}`}
                width={TILE_W}
                height={TILE_H}
                patternUnits="userSpaceOnUse"
              >
                <g
                  className="w-field__mark"
                  data-mark={mark}
                  transform={`scale(${TILE_W / DESIGN_W} ${TILE_H / DESIGN_H})`}
                >
                  <MarkShape mark={mark} />
                </g>
              </pattern>
            </defs>
            {/*
             * One tile wider and taller than the frame on every side, so the march can move a whole
             * tile in any direction without ever reaching an edge.
             */}
            <rect
              className="w-field__tile"
              data-beat={beat + 1}
              x={-TILE_W}
              y={-TILE_H}
              width={390 + TILE_W * 2}
              height={844 + TILE_H * 2}
              fill={`url(#mark-${uid}-${beat})`}
            />
          </svg>
          {/*
           * **The dark beat.**
           *
           * The reference does not only change its mark every few seconds, it changes the light: a wall of
           * bright marks, then a near-black wall, then a coloured one. Without the wash all three beats sat
           * at one brightness and the exchange read as a pattern changing rather than as the card turning
           * over.
           */}
          {beat === 1 ? <i className="w-field__wash" /> : null}
        </span>
      ))}
    </div>
  );
}
