/*
 * **What colour each chapter is.**
 *
 * The stage paints `--ground` across the whole frame, the words take `--ink`, and the lit mass in
 * `WrappedMasses` is built from `mass`. Keeping the three in one place means the field, the
 * sentence and the object cannot disagree about which chapter it is, and it is the file to open
 * when a chapter looks wrong rather than a stylesheet.
 *
 * **Every chapter belongs to one of four families** - hot, acid, cold and paper - and the order is
 * solved so that no two neighbours share one. A deck of twenty cards that alternates temperature
 * reads as a sequence; two hot cards in a row read as one long card, which is what made the old
 * pass feel like the same page over and over.
 *
 * The ink is chosen against the part of the field the words actually sit on, not against the whole
 * gradient: the sentence is centred, or near the top, or near the bottom, and the stop under it is
 * the one that has to carry the contrast. Every pair here clears 7:1 where the words land, and the
 * check measures that from the rendered page with the words taken away.
 */

export type Family = 'hot' | 'acid' | 'cold' | 'paper';

export type Look = {
  /** Which of the four colour worlds this chapter belongs to. Neighbours must differ. */
  family: Family;
  /** The colour field behind everything: a gradient, edge to edge. */
  ground: string;
  /** The colour the sentence is set in, chosen against the stop the words sit on. */
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

/*
 * The order is the deck's own order, and the families run H A H C H A P C P A C H A H C H C H:
 * every neighbour differs. Move a chapter, change a family, and the check fails by name.
 */
const LOOK: Record<string, Look> = {
  cover: {
    family: 'hot',
    /* Mid stop is deep maroon: the sentence sits in the middle, and cream needs a dark stop there. */
    ground: 'linear-gradient(170deg, #ff2d0a 0%, #7a0034 54%, #3a0020 100%)',
    ink: '#fff7ea',
    mass: ['#3a0014', '#ffb000'],
  },
  total: {
    family: 'acid',
    /*
     * **Dark stage, lit object.**
     *
     * This card is the one-chapter lab: the reference puts a single lit body in a dark room and cuts it
     * with the frame, so the ground is near-black with the lime only where the light falls. A bright
     * lime field behind a lime object is the one thing that cannot read as lit.
     */
    ground: 'radial-gradient(120% 90% at 50% 34%, #3f7d05 0%, #1b3405 44%, #070a04 100%)',
    ink: '#f6ffe0',
    mass: ['#1c3b00', '#c8ff1f'],
  },
  name: {
    family: 'hot',
    /* The field's middle is now dark enough for cream; it used to be bright pink under dark ink. */
    ground: 'linear-gradient(160deg, #e02a00 0%, #8a0038 58%, #4a0024 100%)',
    ink: '#fff7ea',
    mass: ['#3a0020', '#ffc400'],
  },
  map: {
    family: 'cold',
    ground: 'linear-gradient(180deg, #1a00b0 0%, #0040c8 50%, #00709e 100%)',
    ink: '#f4ffff',
    mass: ['#00107a', '#7cf9ff'],
  },
  distance: {
    family: 'hot',
    ground: 'linear-gradient(150deg, #ff4a00 0%, #7a0058 48%, #24007a 100%)',
    ink: '#fff7ea',
    mass: ['#24007a', '#ffb000'],
  },
  pair: {
    family: 'acid',
    /* Lime field, deep red form: the two ends of a journey, not a warning card. */
    ground: 'linear-gradient(180deg, #e2ff6a 0%, #86e000 58%, #3d9e00 100%)',
    ink: '#0a2000',
    mass: ['#8a0000', '#ff5a2f'],
  },
  origin: {
    family: 'paper',
    ground: 'linear-gradient(180deg, #fff6e2 0%, #ffe3bd 58%, #ffc98a 100%)',
    ink: '#2a0a00',
    /* Deep red: the loud form a paper chapter needs, now that the body is a skyline at the top and
       the sentence keeps the cream field at the bottom to itself. */
    mass: ['#a01500', '#ff8a00'],
  },
  hour: {
    family: 'cold',
    ground: 'linear-gradient(200deg, #1e007a 0%, #5000a8 44%, #a8005e 100%)',
    ink: '#fff7ea',
    mass: ['#2a0064', '#ff2d9b'],
  },
  direct: {
    family: 'paper',
    /* Cream field, navy form: the calm chapter, and a cold break between two saturated neighbours. */
    ground: 'linear-gradient(180deg, #fff8e8 0%, #ffe8c8 50%, #ffd9a8 100%)',
    ink: '#0a1a3a',
    mass: ['#001a8a', '#00a8d6'],
  },
  longest: {
    family: 'acid',
    ground: 'linear-gradient(180deg, #fbffe4 0%, #d9ff4a 52%, #7ecf00 100%)',
    ink: '#142000',
    mass: ['#0f5c00', '#d9ff00'],
  },
  look: {
    family: 'cold',
    /* A deep violet mat, not near-black: the old field was a tint of black, which is not a world. */
    ground: 'linear-gradient(180deg, #1c0038 0%, #3a0070 55%, #5a0090 100%)',
    ink: '#fff7ea',
    mass: ['#3a0055', '#ff2d75'],
    photo: true,
  },
  ranked: {
    /*
     * A deep forest field, not the lime of the year's totals: the list is read at a glance, and a
     * dark page with cream type is what makes five rows feel like a ranking rather than a table.
     */
    family: 'acid',
    ground: 'linear-gradient(180deg, #04140a 0%, #05701f 52%, #00b832 100%)',
    ink: '#f4ffe6',
    /*
     * A deep teal rather than the field's own green. The first pass used a forest green that the key
     * light lifted to almost exactly the field's colour where the slabs meet it, so parts of the
     * object were invisible - invisible enough that a pixel diff of the card with the object and
     * without it found no change there at all.
     */
    mass: ['#07241c', '#e6ff6a'],
  },
  day: {
    /* Cream paper with one bright gold form: a single date is a thing printed on a page. */
    family: 'paper',
    ground: 'linear-gradient(180deg, #fff6e0 0%, #ffe7c4 54%, #ffd39c 100%)',
    ink: '#2a0a00',
    mass: ['#ffe08a', '#ffb000'],
  },
  eras: {
    /*
     * Cream, not near-black. The sentence sits in the lower third, where the field has already gone
     * dark red and the slabs are darker still; dark ink there was 2.5:1 against its own ground.
     */
    family: 'hot',
    /*
     * **Straight down, and deep by the time the words arrive.**
     *
     * A diagonal field left the lower right still bright orange under the sentence, and cream on it
     * measured 4.4:1. The field now runs down the frame and reaches its deep red by 72 percent, so wherever
     * the words land they are on dark: cream reads at 9:1 there, and the pale top stays the warm dawn the
     * wall of marks sits in.
     */
    ground: 'linear-gradient(180deg, #ffd7b0 0%, #ff5a1f 40%, #860c00 72%, #5e0700 100%)',
    ink: '#fff7ea',
    mass: ['#5a0500', '#ffb37a'],
  },
  lines: {
    family: 'acid',
    ground: 'linear-gradient(180deg, #b6ff3a 0%, #00e89a 50%, #00807a 100%)',
    ink: '#04140f',
    mass: ['#004a3d', '#00ff9d'],
  },
  awards: {
    /* The words sit at the top, so the top stop is lifted until near-black ink clears 7:1 on it. */
    family: 'hot',
    ground: 'linear-gradient(180deg, #ffb84a 0%, #d81f00 52%, #6a0800 100%)',
    ink: '#140800',
    mass: ['#b32400', '#ffe27a'],
  },
  bookends: {
    family: 'cold',
    ground: 'linear-gradient(180deg, #7ac8ff 0%, #9a7bff 48%, #ff3d7f 100%)',
    ink: '#12021f',
    mass: ['#2a0055', '#ffb000'],
  },
  comparison: {
    family: 'hot',
    ground: 'linear-gradient(180deg, #c41510 0%, #6a0000 100%)',
    ink: '#fff7ea',
    mass: ['#00873a', '#d9ff3a'],
  },
  crew: {
    family: 'cold',
    ground: 'linear-gradient(180deg, #2a00a8 0%, #1a4ae0 52%, #00a8cc 100%)',
    ink: '#f4f8ff',
    mass: ['#12004a', '#7a5bff'],
  },
  close: {
    family: 'hot',
    /* The last card is ember, not blue: it ends the story warm instead of matching the crew's blue. */
    ground: 'linear-gradient(0deg, #4a000e 0%, #b81400 55%, #ff5a00 100%)',
    ink: '#fff7ea',
    mass: ['#2a0008', '#ffb000'],
  },
};

const FALLBACK = LOOK.cover;

export function lookFor(id: string): Look {
  return LOOK[id] ?? FALLBACK;
}

/** The deck's order, so the family rotation can be checked without walking the page. */
export function lookOrder(): { id: string; family: Family }[] {
  return Object.entries(LOOK).map(([id, look]) => ({ id, family: look.family }));
}
