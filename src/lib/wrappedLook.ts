/*
 * **What colour each chapter is.**
 *
 * The stage paints `--ground` across the whole frame and the words take `--ink`. Keeping the pair
 * in one place means the sentence, the chrome and the mass cannot disagree about which chapter it
 * is, and it is the file to open when a chapter looks wrong rather than a stylesheet.
 *
 * The order is deliberate: hot, acid, cold, paper, and round again, so two chapters side by side
 * are never the same temperature.
 */

export type Look = {
  /** The colour field behind everything: a gradient, edge to edge. */
  ground: string;
  /** The colour the sentence is set in, chosen against the field, not against the mass. */
  ink: string;
  /** True when the chapter is a photograph and the field is only the mat around it. */
  photo?: boolean;
};

const LOOK: Record<string, Look> = {
  cover: { ground: 'linear-gradient(170deg, #ff3b18 0%, #ff0060 54%, #a8006b 100%)', ink: '#fff7ea' },
  total: { ground: 'linear-gradient(180deg, #f2ff8a 0%, #c6ff00 46%, #7ecf00 100%)', ink: '#04140b' },
  name: { ground: 'linear-gradient(160deg, #ff8a00 0%, #ff2d75 58%, #c4006b 100%)', ink: '#fff7ea' },
  map: { ground: 'linear-gradient(180deg, #2b00c8 0%, #0a5cff 50%, #00b8e5 100%)', ink: '#f4ffff' },
  distance: { ground: 'linear-gradient(150deg, #ff7a00 0%, #b0007a 48%, #3d00b8 100%)', ink: '#fff7ea' },
  pair: { ground: 'linear-gradient(180deg, #ff3b2f 0%, #e00000 58%, #8a0000 100%)', ink: '#fff7ea' },
  origin: { ground: 'linear-gradient(180deg, #fff6e2 0%, #ffe3bd 58%, #ffc98a 100%)', ink: '#2a0a00' },
  hour: { ground: 'linear-gradient(200deg, #2a00a8 0%, #7a00c8 44%, #ff2d9b 100%)', ink: '#fff7ea' },
  direct: { ground: 'linear-gradient(180deg, #0038c8 0%, #0090ff 50%, #00e5ff 100%)', ink: '#f2fdff' },
  longest: { ground: 'linear-gradient(180deg, #fbffe4 0%, #d9ff4a 52%, #7ecf00 100%)', ink: '#142000' },
  look: { ground: 'linear-gradient(180deg, #14000b 0%, #250012 100%)', ink: '#fff7ea', photo: true },
  eras: { ground: 'linear-gradient(160deg, #ffd7b0 0%, #ff5a1f 54%, #a01500 100%)', ink: '#2a0800' },
  lines: { ground: 'linear-gradient(180deg, #b6ff3a 0%, #00e89a 50%, #00807a 100%)', ink: '#04140f' },
  awards: { ground: 'linear-gradient(180deg, #ff6a00 0%, #e02400 52%, #8a0d00 100%)', ink: '#fff7ea' },
  bookends: { ground: 'linear-gradient(180deg, #7ac8ff 0%, #9a7bff 48%, #ff3d7f 100%)', ink: '#12021f' },
  comparison: { ground: 'linear-gradient(180deg, #ff2418 0%, #c40000 100%)', ink: '#fff7ea' },
  crew: { ground: 'linear-gradient(180deg, #3a00c8 0%, #2b6bff 52%, #00d4ff 100%)', ink: '#f4f8ff' },
  close: { ground: 'linear-gradient(0deg, #001a8a 0%, #0072ff 50%, #00e0ff 100%)', ink: '#f2fdff' },
};

const FALLBACK = LOOK.cover;

export function lookFor(id: string): Look {
  return LOOK[id] ?? FALLBACK;
}
