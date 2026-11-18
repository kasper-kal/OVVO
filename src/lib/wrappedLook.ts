/*
 * **What colour each chapter is.**
 *
 * The stage paints `--ground` across the whole frame, the words take `--ink`, and the lit mass in
 * `WrappedMasses` is built from `mass`. Keeping the three in one place means the field, the
 * sentence and the object cannot disagree about which chapter it is, and it is the file to open
 * when a chapter looks wrong rather than a stylesheet.
 *
 * The order is deliberate: hot, acid, cold, paper, and round again, so two chapters side by side
 * are never the same temperature. The mass is always a different value from its own field - either
 * much deeper or a clear opposite - because a lit surface the same colour as the wall behind it has
 * nothing to shade against.
 */

export type Look = {
  /** The colour field behind everything: a gradient, edge to edge. */
  ground: string;
  /** The colour the sentence is set in, chosen against the field, not against the mass. */
  ink: string;
  /**
   * The two colours the chapter's geometry is made of, deep first.
   *
   * These are read by the WebGL masses, not by CSS: a surface that is lit needs a colour it can
   * shade, so a mass is never the same brightness as the field behind it.
   */
  mass: [string, string];
  /** True when the chapter is a photograph and the field is only the mat around it. */
  photo?: boolean;
};

const LOOK: Record<string, Look> = {
  cover: {
    ground: 'linear-gradient(170deg, #ff3b18 0%, #ff0060 54%, #a8006b 100%)',
    ink: '#fff7ea',
    mass: ['#8a0026', '#ffb000'],
  },
  total: {
    ground: 'linear-gradient(180deg, #f2ff8a 0%, #c6ff00 46%, #7ecf00 100%)',
    ink: '#04140b',
    mass: ['#006633', '#b6ff00'],
  },
  name: {
    /* The field ends in bright pink, so the sentence is ink, not paper: 6.9:1 instead of 3.6:1. */
    ground: 'linear-gradient(160deg, #ff8a00 0%, #ff2d75 58%, #c4006b 100%)',
    ink: '#2a0014',
    mass: ['#4a0026', '#ffc400'],
  },
  map: {
    ground: 'linear-gradient(180deg, #2b00c8 0%, #0a5cff 50%, #00b8e5 100%)',
    ink: '#f4ffff',
    mass: ['#001a8a', '#7cf9ff'],
  },
  distance: {
    ground: 'linear-gradient(150deg, #ff7a00 0%, #b0007a 48%, #3d00b8 100%)',
    ink: '#fff7ea',
    mass: ['#3d00b8', '#ffb000'],
  },
  pair: {
    ground: 'linear-gradient(180deg, #ff3b2f 0%, #e00000 58%, #8a0000 100%)',
    ink: '#fff7ea',
    mass: ['#00a34a', '#b6ff3a'],
  },
  origin: {
    ground: 'linear-gradient(180deg, #fff6e2 0%, #ffe3bd 58%, #ffc98a 100%)',
    ink: '#2a0a00',
    mass: ['#a01500', '#ff8a00'],
  },
  hour: {
    ground: 'linear-gradient(200deg, #2a00a8 0%, #7a00c8 44%, #ff2d9b 100%)',
    ink: '#fff7ea',
    mass: ['#3d008a', '#ff2d9b'],
  },
  direct: {
    ground: 'linear-gradient(180deg, #0038c8 0%, #0090ff 50%, #00e5ff 100%)',
    ink: '#f2fdff',
    mass: ['#001a8a', '#7cf9ff'],
  },
  longest: {
    ground: 'linear-gradient(180deg, #fbffe4 0%, #d9ff4a 52%, #7ecf00 100%)',
    ink: '#142000',
    mass: ['#0f5c00', '#d9ff00'],
  },
  look: {
    ground: 'linear-gradient(180deg, #14000b 0%, #250012 100%)',
    ink: '#fff7ea',
    mass: ['#4a0066', '#ff2d75'],
    photo: true,
  },
  eras: {
    /*
     * Cream, not near-black. The sentence sits in the lower third, where the field has already gone
     * dark red and the slabs are darker still; dark ink there was 2.5:1 against its own ground.
     */
    ground: 'linear-gradient(160deg, #ffd7b0 0%, #ff5a1f 54%, #a01500 100%)',
    ink: '#fff7ea',
    mass: ['#5a0500', '#ffb37a'],
  },
  lines: {
    ground: 'linear-gradient(180deg, #b6ff3a 0%, #00e89a 50%, #00807a 100%)',
    ink: '#04140f',
    mass: ['#004a3d', '#00ff9d'],
  },
  awards: {
    /* The words sit at the orange end; dark ink reads on it, white did not (3.3:1). */
    ground: 'linear-gradient(180deg, #ff6a00 0%, #e02400 52%, #8a0d00 100%)',
    ink: '#2a1000',
    mass: ['#b32400', '#ffe27a'],
  },
  bookends: {
    ground: 'linear-gradient(180deg, #7ac8ff 0%, #9a7bff 48%, #ff3d7f 100%)',
    ink: '#12021f',
    mass: ['#2a0055', '#ffb000'],
  },
  comparison: {
    ground: 'linear-gradient(180deg, #ff2418 0%, #c40000 100%)',
    ink: '#fff7ea',
    mass: ['#00873a', '#d9ff3a'],
  },
  crew: {
    ground: 'linear-gradient(180deg, #3a00c8 0%, #2b6bff 52%, #00d4ff 100%)',
    ink: '#f4f8ff',
    mass: ['#1a0055', '#7a5bff'],
  },
  close: {
    ground: 'linear-gradient(0deg, #001a8a 0%, #0072ff 50%, #00e0ff 100%)',
    ink: '#f2fdff',
    mass: ['#001a66', '#00e5ff'],
  },
};

const FALLBACK = LOOK.cover;

export function lookFor(id: string): Look {
  return LOOK[id] ?? FALLBACK;
}
