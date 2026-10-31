/**
 * **A style is a whole answer, not a colour.**
 *
 * This is the replacement for the Colours card (`STYLES_PLAN.md`). The old model let the traveller
 * choose a hex for the page, a hex for every widget and a hex for selected text, and then had to
 * *derive* readable ink out of whatever arrived. An ink ramp can only do so much with a mid grey,
 * and the complaints were always the same shape: a chip whose outline vanished, a label 4.3:1 on
 * its own badge, a dark tint that had to be lightened before it could be painted.
 *
 * Here every ink is authored against the surface it is drawn on. A style names its page, its card,
 * its ink and its accent; the muted and faint steps, the hairlines and the accent's readable cut
 * are *measured* off those four rather than invented, and `scripts/styles-audit.mjs` walks every
 * style in both appearances and fails on any pair under the line. Nothing on this screen can make
 * the interface unreadable, because there is nothing on this screen but finished looks.
 *
 * **The photograph is part of the style, and it is a file in the repo.** `public/style-photos/`
 * holds at most one file per photo style, named after its id — `marble.jpg`, `arches.jpg` and so
 * on. Nothing is uploaded, cropped or sampled; a missing file is not an error, it is the style
 * wearing its own colour, which every photo style can do on purpose anyway (the **Background** row
 * on the Styles card). See `public/style-photos/README.md` for the naming rule.
 */

import { contrastRatio, hexToHsv, hsvToHex, readHex, relativeLuminance, toHex } from './colour';

export type Appearance = 'light' | 'dark';

/* ------------------------------------------------------------------ the lettering */

/**
 * The families a style may name, with the stack that draws the page when the file has not arrived.
 *
 * Each style names a **display** face (headings) and a **UI** face (everything else), so forty-eight
 * styles do not mean forty-eight downloads: `scripts/fetch-fonts.mjs` pulls one `woff2` per family,
 * self-hosted, and the stack behind each one is a local face of the same shape — a serif behind a
 * serif, a mono behind a mono — so a browser that refuses the download still draws the right page.
 */
export const FONT_STACKS = {
  cormorant: "'Cormorant Garamond', 'Iowan Old Style', Georgia, 'Times New Roman', serif",
  playfair: "'Playfair Display', 'Iowan Old Style', Georgia, 'Times New Roman', serif",
  instrument: "'Instrument Serif', 'Iowan Old Style', Georgia, 'Times New Roman', serif",
  lora: "'Lora', 'Iowan Old Style', Georgia, 'Times New Roman', serif",
  fraunces: "'Fraunces', Georgia, 'Times New Roman', serif",
  newsreader: "'Newsreader', 'Iowan Old Style', Georgia, 'Times New Roman', serif",
  grotesk: "'Space Grotesk', 'Helvetica Neue', Arial, system-ui, sans-serif",
  archivo: "'Archivo', 'Helvetica Neue', Arial, system-ui, sans-serif",
  manrope: "'Manrope', 'Helvetica Neue', Arial, system-ui, sans-serif",
  outfit: "'Outfit', 'Helvetica Neue', Arial, system-ui, sans-serif",
  jakarta: "'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
  plex: "'IBM Plex Sans', 'Helvetica Neue', Arial, system-ui, sans-serif",
  mono: "'IBM Plex Mono', 'SFMono-Regular', Menlo, Consolas, monospace",
  work: "'Work Sans', 'Helvetica Neue', Arial, system-ui, sans-serif",
  figtree: "'Figtree', 'Helvetica Neue', Arial, system-ui, sans-serif",
  inter: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
} as const;

export type FontId = keyof typeof FONT_STACKS;

/** The family each downloaded `woff2` covers, for `scripts/fetch-fonts.mjs` and `fonts.css`. */
export const FONT_FAMILIES: Record<FontId, string> = {
  cormorant: 'Cormorant Garamond',
  playfair: 'Playfair Display',
  instrument: 'Instrument Serif',
  lora: 'Lora',
  fraunces: 'Fraunces',
  newsreader: 'Newsreader',
  grotesk: 'Space Grotesk',
  archivo: 'Archivo',
  manrope: 'Manrope',
  outfit: 'Outfit',
  jakarta: 'Plus Jakarta Sans',
  plex: 'IBM Plex Sans',
  mono: 'IBM Plex Mono',
  work: 'Work Sans',
  figtree: 'Figtree',
  inter: 'Inter',
};

/* ------------------------------------------------------------------ the shape of a style */

export type StyleGroupId =
  | 'basic'
  | 'luxe'
  | 'modern'
  | 'editorial'
  | 'dutch'
  | 'dark'
  | 'reading'
  | 'soft'
  | 'loud'
  | 'technical'
  | 'photo';

export interface StyleGroup {
  id: StyleGroupId;
  label: string;
  labelNl: string;
  note: string;
  noteNl: string;
}

export const STYLE_GROUPS: StyleGroup[] = [
  /* The shelves the picker draws. Every one still holds at least one style after the catalogue was
     cut from fifty to twenty, so no shelf is an empty heading. */
  {
    id: 'basic',
    label: 'Basic',
    labelNl: 'Basis',
    note: 'The default look, and the plainest reading answer.',
    noteNl: 'De standaardlook, en het rustigste leesantwoord.',
  },
  {
    id: 'luxe',
    label: 'Luxe',
    labelNl: 'Luxe',
    note: 'Dark, deep, and printed on good paper.',
    noteNl: 'Donker, diep en gedrukt op goed papier.',
  },
  {
    id: 'modern',
    label: 'Modern',
    labelNl: 'Modern',
    note: 'Strong colour, big shapes, flat and confident.',
    noteNl: 'Sterke kleur, grote vormen, vlak en zelfverzekerd.',
  },
  {
    id: 'editorial',
    label: 'Editorial',
    labelNl: 'Redactioneel',
    note: 'Like a newspaper: serif headlines, quiet rules.',
    noteNl: 'Zoals een krant: schreefkoppen, rustige lijnen.',
  },
  {
    id: 'dutch',
    label: 'Dutch',
    labelNl: 'Nederlands',
    note: 'Signs, timetables and museums: the graphic language of the country.',
    noteNl: 'Borden, spoorboekjes en musea: de grafische taal van het land.',
  },
  {
    id: 'dark',
    label: 'Dark',
    labelNl: 'Donker',
    note: 'Night surfaces for a phone held in the dark.',
    noteNl: 'Nachtelijke vlakken voor een telefoon in het donker.',
  },
  {
    id: 'reading',
    label: 'Reading',
    labelNl: 'Lezen',
    note: 'Maximum contrast, no decoration.',
    noteNl: 'Maximaal contrast, geen versiering.',
  },
  {
    id: 'soft',
    label: 'Soft',
    labelNl: 'Zacht',
    note: 'Pale, quiet colour that stays out of the way.',
    noteNl: 'Lichte, rustige kleur die uit de weg blijft.',
  },
  {
    id: 'loud',
    label: 'Loud',
    labelNl: 'Uitgesproken',
    note: 'One strong colour, used without apology.',
    noteNl: 'Eén sterke kleur, zonder excuses.',
  },
  {
    id: 'technical',
    label: 'Technical',
    labelNl: 'Technisch',
    note: 'Rules, grids and monospace: a diagram you can read.',
    noteNl: 'Lijnen, rasters en monospace: een diagram dat je kunt lezen.',
  },
  {
    id: 'photo',
    label: 'Photo',
    labelNl: 'Foto',
    note: 'A photograph behind the page, with a colour to fall back on.',
    noteNl: 'Een foto achter de pagina, met een kleur als terugval.',
  },
];

/** Page, card, ink, accent — the four a style authors. Everything else is measured from these. */
type Quad = [string, string, string, string];

export interface StylePhoto {
  /**
   * How hard the canvas colour is laid over the picture, as a fraction. A dark photograph with
   * cream ink needs less than a bright one with dark ink, which is why it belongs to the style.
   */
  scrim: number;
  /**
   * **The wash for the night cut of the picture.**
   *
   * A photograph is made for one set of inks. Under a pale page it carries dark ink; under the
   * same style's night page that ink has turned over to a light tint and the picture underneath
   * has not changed, so the wash that was right at noon is wrong at midnight. This is the wash
   * measured against `<id>-night.jpg` and the night inks, and it falls back to `scrim` for a style
   * that wants one number for both.
   */
  scrimNight?: number;
  /** Cards that show the picture through glass, or solid cards in the style's own tint. */
  glass: boolean;
}

/**
 * **Nearly every style can wear a photograph, and every one of those can be worn as its colour.**
 *
 * The plan started with ten photo styles and the order was blunt about it: not a small shelf of
 * special looks, but the same picture-or-colour choice on almost every style. So the photograph is
 * not a property of a handful — `public/style-photos/<id>.jpg` is looked for on every style, and the
 * **Background** row appears on every style that has somewhere to put a picture.
 *
 * Two are deliberately left out. **Contrast** and **Night AA** exist as the answer to "make it as
 * readable as you can", and a photograph behind the page is the one thing that can put a bright
 * patch under dark ink. They stay flat, and the Styles card has no Background row for them rather
 * than a switch that cannot keep its promise.
 *
 * The ten that authored their own scrim and card treatment keep them; every other style gets the
 * defaults below, chosen from its own page: a dark page keeps its cards translucent, a pale page
 * gets solid cards and a slightly heavier wash, because the ink on a pale page is the dark one.
 */
const PHOTO_FREE = new Set(['contrast', 'night-aa']);

export function stylePhotograph(style: StyleDef): StylePhoto | null {
  if (PHOTO_FREE.has(style.id)) return null;
  if (style.photo) return style.photo;
  const dark = relativeLuminance(style.light[0]) < 0.35;
  return { scrim: dark ? 0.52 : 0.6, glass: dark };
}

/** The wash in force in the appearance on screen. */
export function photoScrim(picture: StylePhoto, appearance: Appearance): number {
  return appearance === 'dark' ? picture.scrimNight ?? picture.scrim : picture.scrim;
}


/**
 * **A style's shape, not only its colours.**
 *
 * Forty of the styles were the same furniture repainted: same 28px cards, same 1px hairline, same
 * solid surfaces. A look is not only a palette, it is the geometry that palette is cut into, so
 * every style now names a shape and the shape decides four things at once:
 *
 * - `scale`, which every radius token is multiplied by, so cards, inputs, chips and inner panels
 *   grow or square off together and keep their concentric corners;
 * - `line`, the weight of every border the interface draws;
 * - `tint`, how far the second surface is pulled off the card, which is what makes a style read as
 *   flat paper or as stacked cards;
 * - `hair`, the contrast a hairline is derived to, so a square style draws a visible rule and a
 *   soft one draws the faint edge it always had.
 *
 * Default (`tram`) is `soft`, which is exactly the values this file used before shapes existed, so
 * the app's own look did not move.
 */
export type ShapeId = 'soft' | 'square' | 'round' | 'pill' | 'line' | 'plate' | 'arch';

interface Shape {
  /** Multiplier for every radius token (`--shape-scale`). */
  scale: number;
  /** The weight of every border (`--line-width`). */
  line: string;
  /** How much ink is mixed into the surface standing next to the card. */
  tint: number;
  /** The contrast a hairline is derived to, on the card and on the page. */
  hair: number;
  /**
   * **How solid a card is.** A card is a pane of the style's own surface laid over the page; at 1
   * it hides the page, below it the page's colour shows through, which is what makes a stack of
   * cards read as glass rather than as paper. The transparency is drawn from the page's own colour,
   * so a card that lets the page through still has that colour under its ink.
   */
  glass: number;
  /**
   * **How far a card sits above the page.** A card is flat paper in a printed style and a lifted
   * pane in a soft one, and until now every style drew it at exactly the same height: nothing. The
   * sweep found fifty styles that read as one layout recoloured, and a shadow is the cheapest honest
   * axis — it changes the material of a card without moving a single pixel of it.
   */
  shadow: string;
}

const SHAPES: Record<ShapeId, Shape> = {
  /* The app's own look: the values this file used before shapes existed, and no shadow — Default
     must not move by a pixel. */
  soft: { scale: 1, line: '1px', tint: 0.055, hair: 1.7, glass: 1, shadow: 'none' },
  /* Print: square corners, a rule you can see, flat on the page. */
  square: { scale: 0, line: '2px', tint: 0.02, hair: 2.2, glass: 1, shadow: 'none' },
  /* A friendly radius, with cards just off the page. */
  round: { scale: 1.45, line: '1px', tint: 0.08, hair: 1.55, glass: 0.96, shadow: '0 1px 2px -1px rgb(0 0 0 / 0.10)' },
  /* Capsules for every control, cards lifted and see-through. */
  pill: { scale: 5, line: '1px', tint: 0.1, hair: 1.45, glass: 0.92, shadow: '0 8px 20px -12px rgb(0 0 0 / 0.34), 0 1px 2px -1px rgb(0 0 0 / 0.10)' },
  /* A thin plate: nearly square, a heavy outline, almost no surface tint, flat. */
  line: { scale: 0.3, line: '2px', tint: 0.015, hair: 2.3, glass: 1, shadow: 'none' },
  /* A printed sheet: no tint at all, a 3px rule, flat page and flat card. */
  plate: { scale: 0.5, line: '3px', tint: 0, hair: 2.5, glass: 1, shadow: 'none' },
  /* Drawn: the roundest corners, and the most see-through cards, floating highest. */
  arch: { scale: 2.2, line: '1px', tint: 0.11, hair: 1.5, glass: 0.88, shadow: '0 14px 34px -18px rgb(0 0 0 / 0.40), 0 1px 3px -1px rgb(0 0 0 / 0.12)' },
};

/** Where a style does not name a shape, its group decides. */
const SHAPE_BY_GROUP: Record<StyleGroupId, ShapeId> = {
  basic: 'soft',
  luxe: 'line',
  modern: 'round',
  editorial: 'soft',
  dutch: 'square',
  dark: 'round',
  reading: 'square',
  soft: 'pill',
  loud: 'pill',
  technical: 'square',
  photo: 'round',
};

/**
 * **Every style's shape, one line each.**
 *
 * A group is a shelf, not a mould: the shapes are spread across the catalogue so no shelf is seven
 * of one geometry, and the order is chosen so two neighbours on the shelf are never the same
 * shape. Default is `soft`, which is the geometry the app always drew.
 */
/**
 * **Every style's shape, one line each.**
 *
 * The first pass cycled seven shapes evenly and half the catalogue came out square: nine `square`,
 * eight `line` and eight `plate`. Corners are the first thing a look is judged by, so the curved
 * geometries now carry the catalogue and the near-square ones are the exception, used where the
 * style is genuinely a printed sheet or a rules-and-borders design.
 */
const SHAPE_OVERRIDES: Record<string, ShapeId> = {
  'navy-gold': 'soft',
  'midnight-silk': 'soft',
  'bordeaux': 'arch',
  'poppy-blue': 'pill',
  'ultraviolet': 'line',
  'cyber-teal': 'soft',
  'broadsheet': 'soft',
  'spoorboekje': 'soft',
  'rijksmuseum': 'arch',
  'station-sign': 'pill',
  'tram': 'soft',
  'obsidian': 'square',
  'contrast': 'round',
  'night-aa': 'arch',
  'sage': 'pill',
  'mustard': 'soft',
  'terminal': 'round',
  'blueprint': 'square',
  'marble': 'round',
  'arches': 'pill',
};

/** The shape a style draws, for anything that previews it (the picker's swatches). */
export function styleShape(style: StyleDef): Shape {
  const id = style.shape ?? SHAPE_OVERRIDES[style.id] ?? SHAPE_BY_GROUP[style.group] ?? 'soft';
  return SHAPES[id];
}


/**
 * **The middle layer, style by style.** Absent means the style's interface face, which is what every
 * style drew before this map existed, so Default is unchanged.
 */
/**
 * **A face sets its own size, weight, leading and tracking.**
 *
 * Every style used to wear Default's type settings: 29px, weight 800, `-0.58px` tracking and 1.2
 * leading. Those numbers were tuned by hand for Plus Jakarta Sans, a geometric sans with a large
 * x-height that wants to be set heavy and tight. A Cormorant Garamond at weight 800 is a slab,
 * Instrument Serif at 800 is a bruise, and a serif's smaller x-height at the same size reads as a
 * weak title next to Default's. That, more than any colour, is why the styles felt "off" beside a
 * page that had been perfected for weeks.
 *
 * So the display face carries its own four numbers, and only the faces that need them are listed.
 * Anything absent (Jakarta, Inter, Plex, Mono, Work) keeps the app's original values, which is why
 * Default does not move by a pixel.
 */
/**
 * **Section headings are a size, not a miniature title.**
 *
 * The display face is also used one level down, for the name of a card or a group, at 16px. A serif
 * set at 16px reads as thin and small beside Default's bold Inter, which is half of why a styled
 * page felt weaker than the default one. The serif sub-faces therefore get a little more size and
 * their own weight; the sans ones keep the original values and Default keeps all of them.
 */
const SUB_TYPE: Partial<Record<FontId, { size: string; weight: string }>> = {
  cormorant: { size: '18px', weight: '700' },
  instrument: { size: '18px', weight: '400' },
  playfair: { size: '17.5px', weight: '700' },
  lora: { size: '17px', weight: '700' },
  fraunces: { size: '17.5px', weight: '700' },
  newsreader: { size: '18px', weight: '700' },
};

/**
 * **A display face carries its own four numbers.**
 *
 * A serif and a wide sans cannot share one size, weight and leading: Cormorant Garamond at 800 is a
 * slab, Instrument Serif at 800 is a bruise, and a serif's smaller x-height at the same size reads
 * as a weak title beside Default's. Only the faces that need their own numbers are listed; a face
 * that is absent keeps the app's original values, which is why Default does not move by a pixel.
 */
const DISPLAY_TYPE: Partial<Record<FontId, { size: string; weight: string; leading: string; tracking: string }>> = {
  /* Serifs with a small x-height: larger, lighter, and opened up rather than squeezed. */
  cormorant: { size: '32.5px', weight: '600', leading: '1.06', tracking: '0em' },
  instrument: { size: '33px', weight: '400', leading: '1.05', tracking: '0em' },
  playfair: { size: '31px', weight: '700', leading: '1.1', tracking: '0em' },
  lora: { size: '30px', weight: '700', leading: '1.15', tracking: '-0.005em' },
  fraunces: { size: '31px', weight: '600', leading: '1.08', tracking: '0em' },
  newsreader: { size: '31.5px', weight: '600', leading: '1.1', tracking: '0em' },
  /* Sans faces with a wide, low body: keep the size, drop the 800, breathe the leading. */
  grotesk: { size: '29px', weight: '700', leading: '1.15', tracking: '-0.015em' },
  archivo: { size: '29px', weight: '800', leading: '1.15', tracking: '-0.015em' },
  outfit: { size: '30px', weight: '700', leading: '1.12', tracking: '-0.01em' },
  manrope: { size: '29px', weight: '800', leading: '1.12', tracking: '-0.02em' },
  figtree: { size: '29px', weight: '800', leading: '1.2', tracking: '-0.02em' },
};

/**
 * **The three supporting tints, derived from the accent.**
 *
 * Coral, sage and butter were constants in `tokens.css`, so every style's badges, alerts and
 * highlights were the same three pale colours whatever page they sat on — the largest part of "the
 * styles are all the same". They are now hues carried around the accent's own hue (same hue, plus
 * 120 degrees, plus 55), each mixed into the card and inked to a measured 4.9:1, so a Klein Blue
 * style gets blue-family tags and a Mustard one gets warm ones, and every label still reads.
 */

export interface StyleDef {
  id: string;
  name: string;
  nameNl: string;
  group: StyleGroupId;
  /** The light appearance, and the colour variant of a photo style. */
  light: Quad;
  /** The dark appearance. Absent means "the night cut of `light`" (`nightOf`). */
  night?: Quad;
  /**
   * **The tokens this style refuses to have derived.**
   *
   * Default is not a designed look, it is the interface the app has always drawn. Its palette is
   * the one in `tokens.css`, and a derivation cannot reproduce it by construction: the second
   * surface was a *warm* ivory (`#f3f1ea`) while the cards were white, the bar was obsidian
   * (`#18181b`), the hairlines were warm grey and the map had its own sage water. Mixed from
   * white and obsidian, all of that comes out neutral grey, which is what the first version of
   * this screen shipped and what was reported as "you changed the colours on Default".
   *
   * So this style writes the old values out, appearance by appearance, and they are applied last so
   * nothing derived can win over them. Raised contrast skips them, because that switch has to keep
   * strengthening whichever look is on screen.
   *
   * The two waiting-block tokens are deliberately absent: the old ones were `color-mix()`, and an
   * inline `color-mix()` cannot be replaced by the no-`color-mix()` fallback in `tokens.css`, which
   * would leave an old WebKit with no colour in its skeletons at all.
   */
  pinned?: { light?: Record<string, string>; dark?: Record<string, string> };
  /** Geometry, weight and surface depth; absent means the group's own. */
  shape?: ShapeId;
  /** The page's own name, and any heading that is a title. */
  display: FontId;
  /**
   * **Section and card headings.** A look with a serif title and a sans subtitle is a different
   * look from one set entirely in the same face, so the middle layer is its own font rather than
   * inheriting the body's. Required: every style names all three, and `styles-audit` fails a style
   * that draws the whole page in one family.
   */
  sub: FontId;
  /** **Everything you read a sentence in**: body text, labels, buttons and fields. */
  body: FontId;
  ui: FontId;
  /**
   * A style's own scrim and card treatment, for the ten that authored one. Absent means the
   * defaults in `stylePhotograph`, which nearly every style uses (`public/style-photos/<id>.jpg`).
   */
  photo?: StylePhoto;
}

const MAX = '#FFFFFF';
const DEEP = '#0B0B0C';

/* ------------------------------------------------------------------ the styles */

/**
 * Fifty styles, authored in one place.
 *
 * The order is the order the picker draws them, grouped by `group`. `tram` is the app's own look —
 * the cream page, white cards, obsidian ink and the coral accent — so it is the default and
 * nobody's page changes on the day this ships.
 */
export const STYLES: StyleDef[] = [
  /* ------------------------------------------------------------------ luxe */
  /* Navy is the page and gold is the accent: two colours in the name should be two on the screen. */
  {
    id: 'navy-gold',
    name: 'Navy and Gold',
    nameNl: 'Navy en goud',
    group: 'luxe',
    light: ['#121d29', '#1b2e45', '#F4F1EA', '#c0a171'],
    photo: { scrim: 0.44, scrimNight: 0.02, glass: true },
    /* The same face as Midnight Silk: the owner prefers it to Cormorant here, and the two styles
       were already sharing the same reading face, so the whole of Navy's type now matches. */
    sub: 'cormorant',
    display: 'instrument',
    body: 'work',
    ui: 'inter',
  },
  {
    id: 'midnight-silk',
    name: 'Midnight Silk',
    nameNl: 'Middernachtzijde',
    group: 'luxe',
    light: ['#1A1410', '#2A211A', '#F3EADC', '#CBAE7E'],
    photo: { scrim: 0.43, scrimNight: 0.02, glass: true },
    display: 'instrument',
    body: 'work',
    sub: 'lora',
    ui: 'inter',
  },
  {
    id: 'bordeaux',
    name: 'Bordeaux',
    nameNl: 'Bordeaux',
    group: 'luxe',
    light: ['#291116', '#4c1a24', '#F7EFE9', '#D8B46A'],
    photo: { scrim: 0.02, scrimNight: 0.02, glass: true },
    display: 'cormorant',
    body: 'work',
    sub: 'playfair',
    ui: 'figtree',
  },
  /* ------------------------------------------------------------------ modern */
  {
    id: 'poppy-blue',
    name: 'Poppy Blue',
    nameNl: 'Klaproosblauw',
    group: 'modern',
    light: ['#c9dbf0', '#e6f0fa', '#0F2A44', '#e25138'],
    photo: { scrim: 0.5, scrimNight: 0.06, glass: false },
    display: 'grotesk',
    body: 'figtree',
    sub: 'outfit',
    ui: 'inter',
  },
  {
    id: 'ultraviolet',
    name: 'Ultraviolet',
    nameNl: 'Ultraviolet',
    group: 'modern',
    light: ['#dccef7', '#f1eaff', '#241247', '#5935b5'],
    photo: { scrim: 0.57, scrimNight: 0.02, glass: false },
    display: 'manrope',
    body: 'plex',
    sub: 'grotesk',
    ui: 'inter',
  },
  {
    id: 'cyber-teal',
    name: 'Cyber Teal',
    nameNl: 'Cyberteal',
    group: 'modern',
    light: ['#bde2e9', '#e2f8fa', '#05322F', '#065f70'],
    photo: { scrim: 0.52, scrimNight: 0.02, glass: false },
    display: 'grotesk',
    body: 'figtree',
    sub: 'manrope',
    ui: 'inter',
  },
  /* ------------------------------------------------------------------ editorial */
  {
    id: 'broadsheet',
    name: 'Broadsheet',
    nameNl: 'Krant',
    group: 'editorial',
    light: ['#eae4dc', '#fbfaf6', '#141110', '#8b603a'],
    photo: { scrim: 0.45, scrimNight: 0.02, glass: false },
    display: 'newsreader',
    body: 'work',
    sub: 'lora',
    ui: 'inter',
  },
  /* ------------------------------------------------------------------ dutch */
  {
    id: 'spoorboekje',
    name: 'Spoorboekje',
    nameNl: 'Spoorboekje',
    group: 'dutch',
    light: ['#F1E1B8', '#FBF2D9', '#2A1C10', '#B33A2B'],
    display: 'archivo',
    body: 'work',
    sub: 'grotesk',
    ui: 'inter',
  },
  {
    id: 'rijksmuseum',
    name: 'Rijksmuseum',
    nameNl: 'Rijksmuseum',
    group: 'dutch',
    light: ['#d8dfba', '#f6f6dd', '#14243A', '#1d3d68'],
    photo: { scrim: 0.48, scrimNight: 0.02, glass: false },
    display: 'cormorant',
    body: 'work',
    sub: 'lora',
    ui: 'inter',
  },
  {
    id: 'station-sign',
    name: 'Station Sign',
    nameNl: 'Stationsbord',
    group: 'dutch',
    light: ['#120f29', '#1f2a73', '#EEF3FA', '#f2b562'],
    photo: { scrim: 0.36, scrimNight: 0.02, glass: true },
    display: 'archivo',
    body: 'work',
    sub: 'outfit',
    ui: 'plex',
  },
  {
    id: 'tram',
    name: 'Default',
    nameNl: 'Standaard',
    group: 'basic',
    light: ['#FCFBFA', '#FFFFFF', '#18181B', '#FF7E67'],
    /*
     * **The app's own dark appearance, written out rather than derived.**
     *
     * Every other style lets `nightOf` cut its night, but this one is not every other style: its
     * colours are the app's own tokens, and those were fixed long before the picker existed. The
     * derived cut tinted the near-white cream and produced a warm grey page, so somebody who had
     * never chosen a style still opened a different app at night. These four are the values in
     * `tokens.css` under `[data-theme='dark']`: canvas `#121211`, raised surface `#232220`, ink
     * `#f7f6f3` and the coral, which the dark theme never changed.
     *
     * The ink is the old `--ink-strong`, not the old body ink, because `styleTokens` derives a
     * softer body from the ink it is given: authored as `#dedcd6` the body came back at `#c8c6c0`,
     * a dimmer page than the app had ever drawn. Authored as the strong ink, the derived body lands
     * on the old `#dedcd6` and the headings keep the old `#f7f6f3`.
     */
    night: ['#121211', '#232220', '#F7F6F3', '#FF7E67'],
    /*
     * The app as it was, token for token, read off the previous build and from `tokens.css`. Every
     * value here was measured in a browser against commit 48f1e46 before it was written down.
     */
    pinned: {
      light: {
        '--canvas-base': '#fcfbfa',
        '--surface-alt': '#f3f1ea',
        '--surface-raised': '#ffffff',
        '--l1-bg': '#f3f1ea',
        '--l1-border': '1px solid #cdc7b8',
        '--l2-bg': '#ffffff',
        '--l2-border': '1px solid #cdc7b8',
        '--l3-bg': '#18181b',
        '--l3-border': '1px solid #2d3b2d',
        '--struct-main': '#18181b',
        '--struct-secondary': '#2d3b2d',
        '--ink-strong': '#18181b',
        '--ink': '#3f3f45',
        '--ink-muted': '#5f5f66',
        '--ink-faint': '#66666d',
        '--border-hairline': '#cdc7b8',
        '--hairline-on-dark': '#2d3b2d',
        '--on-dark': '#fcfbfa',
        '--on-dark-muted': '#b9b9be',
        '--accent-primary': '#ff7e67',
        '--accent-primary-ink': '#d9533a',
        '--accent-primary-border': '#e9694f',
        '--accent-primary-hover': '#ff9077',
        '--accent-fill': '#ff7e67',
        '--on-accent': '#18181b',
        '--accent-on-dock': '#ff7e67',
        '--on-dock-accent': '#18181b',
        /* The old accent as ink, which is the coral darkened until it reads on cream. */
        '--focus-ring': '#d9533a',
        /*
         * **The map's accent is left derived.** The old map drew coral route lines on ivory land at
         * 2.2:1, which is a line you cannot follow; deriving it darkens the coral until it reads.
         * Land, water, ink and the stop marks stay the old map's own.
         */
        '--map-ink': '#18181b',
        '--map-land': '#f3f1ea',
        '--map-water': '#e1eadf',
        '--map-stop-fill': '#ffffff',
        '--map-stop-stroke': '#2d3b2d',
        '--chrome-surface': '#ffffff',
        '--chrome-surface-alt': '#f3f1ea',
        '--chrome-border': '#cdc7b8',
        '--chrome-ink': '#3f3f45',
        '--chrome-ink-strong': '#18181b',
        '--chrome-ink-muted': '#5f5f66',
        '--chrome-ink-faint': '#66666d',
        '--page-border': '#cdc7b8',
        /* 62%, as the old theme had it, in the `rgba()` form an old WebKit can parse. */
        '--app-bg-wash': 'rgba(252, 251, 250, 0.62)',
      },
      dark: {
        '--canvas-base': '#121211',
        '--surface-alt': '#1b1a18',
        '--surface-raised': '#232220',
        '--l1-bg': '#1b1a18',
        '--l1-border': '1px solid #4a463c',
        '--l2-bg': '#232220',
        '--l2-border': '1px solid #4a463c',
        '--l3-bg': '#29282a',
        '--l3-border': '1px solid #3b3a3d',
        '--struct-main': '#18181b',
        '--struct-secondary': '#2d3b2d',
        '--ink-strong': '#f7f6f3',
        '--ink': '#dedcd6',
        '--ink-muted': '#b8b5ae',
        '--ink-faint': '#a5a29b',
        '--border-hairline': '#4a463c',
        '--hairline-on-dark': '#3b3a3d',
        '--on-dark': '#fcfbfa',
        '--on-dark-muted': '#b9b9be',
        '--accent-primary': '#ff7e67',
        '--accent-primary-ink': '#ff9c87',
        '--accent-primary-border': '#e9694f',
        '--accent-primary-hover': '#ff9077',
        '--accent-fill': '#ff7e67',
        '--on-accent': '#18181b',
        '--accent-on-dock': '#ff7e67',
        '--on-dock-accent': '#18181b',
        /* The old accent as ink, which is the coral darkened until it reads on cream. */
        '--focus-ring': '#d9533a',
        /*
         * **The map's accent is left derived.** The old map drew coral route lines on ivory land at
         * 2.2:1, which is a line you cannot follow; deriving it darkens the coral until it reads.
         * Land, water, ink and the stop marks stay the old map's own.
         */
        '--map-ink': '#f2f0ec',
        '--map-land': '#1e1d1b',
        '--map-water': '#1a2420',
        '--map-stop-fill': '#232220',
        '--map-stop-stroke': '#9fa8a0',
        '--chrome-surface': '#232220',
        '--chrome-surface-alt': '#1b1a18',
        '--chrome-border': '#4a463c',
        '--chrome-ink': '#dedcd6',
        '--chrome-ink-strong': '#f7f6f3',
        '--chrome-ink-muted': '#b8b5ae',
        '--chrome-ink-faint': '#a5a29b',
        '--page-border': '#4a463c',
        /* 70%, the old dark wash, again in `rgba()` for an old WebKit. */
        '--app-bg-wash': 'rgba(18, 18, 17, 0.7)',
      },
    },
    display: 'jakarta',
    body: 'inter',
    sub: 'figtree',
    ui: 'inter',
  },

  /* ------------------------------------------------------------------ dark first */
  {
    id: 'obsidian',
    name: 'Obsidian',
    nameNl: 'Obsidiaan',
    group: 'dark',
    light: ['#111112', '#17171a', '#F2F0EC', '#8FB8FF'],
    photo: { scrim: 0.02, scrimNight: 0.02, glass: true },
    display: 'inter',
    body: 'plex',
    sub: 'grotesk',
    ui: 'inter',
  },
  /* ------------------------------------------------------------------ reading */
  {
    id: 'contrast',
    name: 'Contrast',
    nameNl: 'Contrast',
    group: 'reading',
    light: ['#FFFFFF', '#FFFFFF', '#000000', '#0033CC'],
    display: 'inter',
    body: 'work',
    sub: 'archivo',
    ui: 'inter',
  },
  {
    id: 'night-aa',
    name: 'Night AA',
    nameNl: 'Nacht AA',
    group: 'reading',
    light: ['#000000', '#0E0E0E', '#FFFFFF', '#FFD400'],
    display: 'inter',
    body: 'work',
    sub: 'archivo',
    ui: 'inter',
  },

  /* ------------------------------------------------------------------ soft */
  {
    id: 'sage',
    name: 'Sage',
    nameNl: 'Salie',
    group: 'soft',
    light: ['#d1e1d2', '#eff6ee', '#1B2A1B', '#54704e'],
    photo: { scrim: 0.52, scrimNight: 0.02, glass: false },
    display: 'figtree',
    body: 'work',
    sub: 'newsreader',
    ui: 'inter',
  },
  /* ------------------------------------------------------------------ loud */
  {
    id: 'mustard',
    name: 'Mustard',
    nameNl: 'Mosterd',
    group: 'loud',
    light: ['#f7dba6', '#fff2cf', '#2A1E02', '#a36c11'],
    photo: { scrim: 0.02, scrimNight: 0.02, glass: false },
    display: 'outfit',
    body: 'work',
    sub: 'fraunces',
    ui: 'inter',
  },
  /* ------------------------------------------------------------------ technical */
  {
    id: 'terminal',
    name: 'Terminal',
    nameNl: 'Terminal',
    group: 'technical',
    light: ['#111310', '#151a14', '#B8FFC0', '#98de67'],
    photo: { scrim: 0.23, scrimNight: 0.02, glass: true },
    display: 'mono',
    body: 'plex',
    sub: 'grotesk',
    ui: 'plex',
  },
  {
    id: 'blueprint',
    name: 'Blueprint',
    nameNl: 'Blauwdruk',
    group: 'technical',
    light: ['#D6E2F5', '#EAF1FB', '#0B1A33', '#1D4ED8'],
    display: 'plex',
    body: 'work',
    sub: 'mono',
    ui: 'inter',
  },
  /* ------------------------------------------------------------------ photographs */
  {
    id: 'marble',
    name: 'Marble',
    nameNl: 'Marmer',
    group: 'photo',
    light: ['#ebe3d8', '#f6f2ed', '#181513', '#C9BFA9'],
    display: 'cormorant',
    body: 'work',
    sub: 'lora',
    ui: 'inter',
    photo: { scrim: 0.02, scrimNight: 0.18, glass: false },
  },
  {
    id: 'arches',
    name: 'Arches',
    nameNl: 'Bogen',
    group: 'photo',
    light: ['#1e1c22', '#24242c', '#EDE8DF', '#b08c61'],
    display: 'playfair',
    body: 'lora',
    sub: 'cormorant',
    ui: 'inter',
    photo: { scrim: 0.51, scrimNight: 0.02, glass: true },
  },

  /*
   * **Ten styles that came out of the wallpapers folder.**
   *
   * One picture, one style. The wash on each is the *lightest* that keeps the page readable, which
   * is not the same rule the first plan used: that one measured the brightest and darkest single
   * pixel of the whole picture, so a white sun glint under no text at all could force a heavy wash
   * and bleach the picture. This one counts how much of the picture cannot hold body ink at 4.5:1
   * and holds 4.5:1 in the middle of the strip where the title sits, never dropping below 3:1, the
   * floor for large text, because words never cover every pixel. The result is pictures that still look like photographs, and the darkest corners
   * of each one, which no words sit on, are the part that falls below the line.
   *
   * The palettes are read off the pictures themselves, and no two of the ten share a title face or
   * a geometry with their neighbour, so the shelf is ten looks rather than one look in ten tints.
   */
  {
    id: 'summit',
    name: 'Summit',
    nameNl: 'Top',
    group: 'photo',
    light: ['#142429', '#17313a', '#F4EFE4', '#be9f69'],
    display: 'cormorant',
    sub: 'work',
    body: 'plex',
    ui: 'plex',
    shape: 'soft',
    /* A dark picture under dark ink: almost nothing has to be laid over it. */
    photo: { scrim: 0.02, scrimNight: 0.02, glass: true },
  },
  {
    id: 'cloudbank',
    name: 'Cloudbank',
    nameNl: 'Wolkenbank',
    group: 'photo',
    light: ['#111214', '#1a1c1f', '#F6F6F4', '#C6C9CE'],
    display: 'instrument',
    sub: 'manrope',
    body: 'work',
    ui: 'work',
    shape: 'arch',
    /* White cloud on black is the brightest subject in the set, so it takes the heaviest wash. */
    photo: { scrim: 0.43, scrimNight: 0.02, glass: true },
  },
  {
    id: 'riviera',
    name: 'Riviera',
    nameNl: 'Riviera',
    group: 'photo',
    light: ['#f1f4df', '#fffff7', '#0C2A36', '#0f5c91'],
    display: 'outfit',
    sub: 'fraunces',
    body: 'work',
    ui: 'work',
    shape: 'round',
    /* Solid cards: small print on a busy sea through glass is tiring, whatever the wash. */
    photo: { scrim: 0.43, scrimNight: 0.02, glass: false },
  },
  {
    id: 'palazzo',
    name: 'Palazzo',
    nameNl: 'Paleis',
    group: 'photo',
    light: ['#f1e3e0', '#fdf7f3', '#2A2118', '#987942'],
    display: 'playfair',
    sub: 'archivo',
    body: 'work',
    ui: 'work',
    shape: 'plate',
    photo: { scrim: 0.39, scrimNight: 0.02, glass: false },
  },
  {
    id: 'storm-tide',
    name: 'Storm Tide',
    nameNl: 'Springvloed',
    group: 'photo',
    light: ['#e0e6e8', '#fafcfc', '#122730', '#375f6f'],
    display: 'lora',
    sub: 'work',
    body: 'plex',
    ui: 'work',
    shape: 'line',
    photo: { scrim: 0.42, scrimNight: 0.02, glass: false },
  },
  {
    id: 'skyline',
    name: 'Skyline',
    nameNl: 'Skyline',
    group: 'photo',
    light: ['#0f101e', '#141727', '#F5F1E8', '#E9A64B'],
    display: 'grotesk',
    sub: 'manrope',
    body: 'inter',
    ui: 'grotesk',
    shape: 'round',
    /* The city lights are the point of the picture, so the wash stays off them. */
    photo: { scrim: 0.13, scrimNight: 0.02, glass: true },
  },
  {
    id: 'capsule',
    name: 'Capsule',
    nameNl: 'Capsule',
    group: 'photo',
    light: ['#0d0d10', '#141418', '#FFFFFF', '#9FA6B2'],
    display: 'manrope',
    sub: 'grotesk',
    body: 'inter',
    ui: 'manrope',
    shape: 'pill',
    photo: { scrim: 0.33, scrimNight: 0.02, glass: true },
  },
  {
    id: 'toscane',
    name: 'Toscane',
    nameNl: 'Toscane',
    group: 'photo',
    light: ['#f3e0dd', '#fff7f2', '#33261B', '#b26954'],
    display: 'fraunces',
    sub: 'figtree',
    body: 'work',
    ui: 'work',
    shape: 'arch',
    photo: { scrim: 0.36, scrimNight: 0.02, glass: false },
  },
  {
    id: 'contact',
    name: 'Contact',
    nameNl: 'Contact',
    group: 'photo',
    light: ['#080707', '#0f0f0f', '#F2F0EC', '#B9BEC7'],
    display: 'newsreader',
    sub: 'archivo',
    body: 'plex',
    ui: 'plex',
    shape: 'line',
    /* 93% of this picture is pure black, so it needs the least help of any of them. */
    photo: { scrim: 0.02, scrimNight: 0.02, glass: true },
  },
  {
    id: 'loggia',
    name: 'Loggia',
    nameNl: 'Loggia',
    group: 'photo',
    light: ['#ede6db', '#fcf8f1', '#1F2A26', '#2c6862'],
    display: 'archivo',
    sub: 'cormorant',
    body: 'work',
    ui: 'work',
    shape: 'square',
    /* A bright sky and green leaves directly under the page title: the heaviest of the pale five. */
    photo: { scrim: 0.54, scrimNight: 0.02, glass: false },
  },
];

/** The app's own look — the cream page, white cards, obsidian ink and coral. */
export const DEFAULT_STYLE_ID = 'tram';

export function styleById(id: string | undefined): StyleDef {
  return STYLES.find((style) => style.id === id) ?? STYLES.find((style) => style.id === DEFAULT_STYLE_ID)!;
}

/* ------------------------------------------------------------------ colour arithmetic */

function rgbOf(hex: string): [number, number, number] {
  return readHex(hex) ?? [0, 0, 0];
}

/** `a` moved `t` of the way to `b`. */
export function mixHex(a: string, b: string, t: number): string {
  const x = rgbOf(a);
  const y = rgbOf(b);
  /*
   * **Rounded, and that is not a detail.** `toHex` writes whole channels and a mix hands it
   * fractions, so the channel came out as `"f2.4b85…"` — a string that is not a colour. The
   * browser drops every declaration that uses it, so `--ink`, `--l1-bg`, `--l3-bg` and
   * `--accent-primary` became *no value at all* and the page fell back to Times on cream. One
   * missing `Math.round` cost the whole palette, on every style.
   */
  return toHex([
    Math.round(x[0] + (y[0] - x[0]) * t),
    Math.round(x[1] + (y[1] - x[1]) * t),
    Math.round(x[2] + (y[2] - x[2]) * t),
  ]);
}

/**
 * Move `ink` **away** from `surface` until it clears `target`.
 *
 * The direction is decided by which end of the ramp the surface has room in, so the same function
 * darkens an ink on a pale card and lightens it on a dark one — which is the whole of the two
 * appearances, and the reason one authored palette can serve both without a second set of numbers.
 */
function toward(ink: string, surface: string, target: number): string {
  if (contrastRatio(ink, surface) >= target) return ink;
  const away = contrastRatio(MAX, surface) >= contrastRatio(DEEP, surface) ? MAX : DEEP;
  let out = ink;
  for (let step = 0.06; step <= 1.0001; step += 0.06) {
    out = mixHex(ink, away, step);
    if (contrastRatio(out, surface) >= target) return out;
  }
  return away;
}

/**
 * Move `ink` **toward** `surface` as far as it can while still clearing `target`.
 *
 * This is how the muted and faint steps stay soft instead of being one fixed grey: on a strong ink
 * they sit well off the surface, on a delicate one they cannot move far, and either way they clear
 * the line on the card they are actually drawn on.
 */
function soften(ink: string, surface: string, target: number): string {
  let best = ink;
  for (let step = 0.04; step <= 1.0001; step += 0.04) {
    const candidate = mixHex(ink, surface, step);
    if (contrastRatio(candidate, surface) < target) break;
    best = candidate;
  }
  return best;
}

/**
 * The ink a filled control carries: the style's own, white, or near-black — whichever reads best.
 *
 * It used to compare only the style's ink against white, so a *pale* fill could be handed the
 * style's cream ink at 1.02:1 (cream on cream) because cream beat white by a hair, while the one
 * colour that would have read on it, near-black, was never considered. Three candidates, measured.
 */
function inkOn(surface: string, preferred: string): string {
  return [preferred, MAX, DEEP].reduce((best, candidate) =>
    contrastRatio(candidate, surface) > contrastRatio(best, surface) ? candidate : best,
  );
}

/**
 * The accent **as a fill behind text**, and the label on it.
 *
 * A ring only answers to 3:1, but a label answers to 4.5:1, and one hue can clear the first and
 * miss the second — the app's own coral is 2.49:1 under white and 7.1:1 under obsidian, and a
 * mid-tone like iOS blue is 4.34:1 under black. So the fill is the authored accent unless its best
 * label cannot read on it, in which case it moves in lightness (hue and saturation untouched)
 * until it can. Returns the accent itself for anything that already works, which is most of them.
 */
export function fillPair(accent: string, preferredInk: string): { fill: string; ink: string } {
  const candidates: string[] = [accent];
  for (let step = 0.08; step <= 0.8; step += 0.08) {
    candidates.push(mixHex(accent, MAX, step));
    candidates.push(mixHex(accent, DEEP, step));
  }
  for (const candidate of candidates) {
    const ink = inkOn(candidate, preferredInk);
    /*
     * 4.7 rather than 4.6. The arithmetic used to round in its own favour, so a fill measured here
     * at 4.6 could reach a browser at 4.48; with the curve corrected in `lib/colour.ts` and this
     * margin, the label clears the 4.5 line with room for the last digit.
     */
    if (contrastRatio(ink, candidate) >= 4.7) return { fill: candidate, ink };
  }
  return { fill: accent, ink: inkOn(accent, preferredInk) };
}

/**
 * The dock's active pill: a fill that is **visible on the bar** and carries a label you can read.
 *
 * Two floors at once, which is what the previous attempt missed: a cut chosen only for its label
 * could be darkened until it vanished into the dark bar (the gold pill came out `#7c6a44` on
 * `#0F1B2D`). So the search looks for a candidate that clears 3:1 against the bar *and* 4.6:1 for
 * its own label, trying the accent itself first and then the same colour lifted and deepened.
 */
function pillPair(accent: string, bar: string, preferredInk: string): { fill: string; ink: string } {
  const candidates: string[] = [accent];
  for (let step = 0.08; step <= 0.8; step += 0.08) {
    candidates.push(mixHex(accent, MAX, step));
    candidates.push(mixHex(accent, DEEP, step));
  }
  let best = { fill: accent, ink: inkOn(accent, preferredInk) };
  let bestScore = -Infinity;
  for (const candidate of candidates) {
    const ink = inkOn(candidate, preferredInk);
    /* The pill carries a **glyph**, not a word, so the floor is the 3:1 of an icon rather than
       the 4.5:1 of text. Holding it to the text line was impossible for a muted accent: sage and
       clay cannot be light enough for the dark bar *and* dark enough for a 4.5:1 label. */
    const glyph = contrastRatio(ink, candidate);
    const onBar = contrastRatio(candidate, bar);
    if (glyph >= 3.2 && onBar >= 3.1) return { fill: candidate, ink };
    const score = Math.min(glyph / 3.2, onBar / 3.1);
    if (score > bestScore) {
      bestScore = score;
      best = { fill: candidate, ink };
    }
  }
  return best;
}

/** A hairline on `surface`: the ink at a low mix, lifted until it is a line you can see. */
function edge(surface: string, ink: string, target: number): string {
  let out = mixHex(surface, ink, 0.14);
  for (let step = 0.14; step <= 0.62; step += 0.03) {
    out = mixHex(surface, ink, step);
    if (contrastRatio(out, surface) >= target) break;
  }
  return out;
}

/** A `#rrggbb` at an alpha, as `rgba(...)` — no `color-mix`, which an old WebKit drops entirely. */
function wash(hex: string, alpha: number): string {
  const [r, g, b] = rgbOf(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/* ------------------------------------------------------------------ the night cut */

/**
 * **The dark appearance of a style that did not author one.**
 *
 * The page takes the same hue down to near black, the card lifts a step off it, the ink turns over
 * to a light tint of the authored one, and the accent is the same accent lifted only as far as it
 * needs to be seen on the new card. A style that wants a different night than this can say so with
 * its own `night` — the ten dark-first styles author theirs, because their page is *already* dark
 * and a derived night would flatten them into the same near-black.
 */
function nightOf([canvas, , ink, accent]: Quad): Quad {
  const { h, s } = hexToHsv(canvas);
  /*
   * **The night cut keeps the style's own hue.** It used to be the page mixed 88% toward near-black
   * for every style, so light and dark were two different apps: a pink page became the same grey as
   * a green one the moment the sun went down. The hue survives, its saturation is lifted (a pastel's
   * 18% is invisible at 11% brightness) and only the depth changes.
   */
  /*
   * **The depth follows the page it came from.** One shared brightness for every style put two
   * different pages on the same dark colour, so at night several styles were the same page again,
   * which is the "too similar" complaint moved to the dark. A light page keeps a little more of its
   * brightness in the cut, a deep one keeps a little less.
   */
  const { v: sourceValue } = hexToHsv(canvas);
  const depth = 0.075 + Math.min(1, sourceValue) * 0.085;
  const tint = (value: number) => hsvToHex({ h, s: Math.min(0.55, s * 1.6 + 0.1), v: value });
  const page = tint(depth);
  const card = tint(depth + 0.06);
  const light = mixHex(ink, MAX, 0.88);
  const lit = toward(accent, card, 3.4);
  return [page, card, light, lit];
}

/** The four authored colours in force in `appearance`. */
export function stylePalette(
  style: StyleDef,
  appearance: Appearance,
): { canvas: string; card: string; ink: string; accent: string } {
  const quad = appearance === 'dark' ? style.night ?? nightOf(style.light) : style.light;
  return { canvas: quad[0], card: quad[1], ink: quad[2], accent: quad[3] };
}

/* ------------------------------------------------------------------ the tokens */

export interface StyleTokenOptions {
  highContrast?: boolean;
}

/**
 * Every custom property a style writes, for one appearance.
 *
 * The names are the app's existing ones — `--canvas-base`, `--l2-bg`, `--ink`, `--accent-fill` and
 * the rest — so a component that already reads a token follows the style without knowing styles
 * exist. Two of them are new: `--font-display` (headings) and `--app-bg-wash` computed without
 * `color-mix`, because an iOS 14 WebKit drops a declaration that uses it and would then paint no
 * photograph at all.
 */
/** `#rrggbb` and an alpha to an `rgba()` the browser will paint as a card. */
function rgbaOf(hex: string, alpha: number): string {
  const text = hex.replace('#', '');
  const full = text.length === 3 ? text.split('').map((digit) => digit + digit).join('') : text;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function styleTokens(
  style: StyleDef,
  appearance: Appearance,
  options: StyleTokenOptions = {},
): Record<string, string> {
  const { canvas, card, ink, accent } = stylePalette(style, appearance);
  const raised = Boolean(options.highContrast);
  const shape = styleShape(style);
  /*
   * **Default keeps the arithmetic it always had.**
   *
   * Every knob added for the other styles (the surface tint, a hairline derived against both
   * surfaces, quieter inks lifted against the second surface, the supporting tints, a translucent
   * card) also moved Default's own values by a shade, which is the same mistake as before: a look
   * that is meant to stay put must be skipped, not recomputed. The check is the style's id, not
   * `DEFAULT_STYLE_ID`, so it cannot quietly point at a different style later.
   */
  const preserveDefault = style.id === 'tram';

  const alt = mixHex(card, ink, preserveDefault ? 0.055 : shape.tint);
  const strong = raised ? toward(ink, card, 13) : ink;
  const body = toward(soften(ink, card, raised ? 11 : 9.2), card, raised ? 9 : 7);
  /*
   * **Both surfaces, not just the card.** The quieter inks were measured against the card, and a
   * shape that pulls the second surface further off the card (a pill or a round style tints it
   * harder) then dropped them to 4.44:1 on that surface. They are derived against the card and
   * then lifted again until they read on the surface beside it, so a deeper tint cannot cost a
   * label its contrast.
   */
  /*
   * **The quieter inks hold the readable line, not the bare minimum.** This targeted 4.8:1 and
   * 4.5:1 against a solid card, and the sweep then found ten styles at 3.6–4.0:1 on the small
   * caption under a control, because the card they are drawn on is translucent (`shape.glass`)
   * and the layer underneath is the page. A target with no room in it cannot survive a translucent
   * pane. The targets are now 5.8 and 5.2, which leaves the ramp the fault needed and still keeps
   * faint quieter than muted. Default keeps its old arithmetic untouched.
   */
  const muted = preserveDefault
    ? toward(soften(ink, card, raised ? 7.4 : 5.8), card, raised ? 7 : 4.8)
    : toward(toward(soften(ink, card, raised ? 7.4 : 5.8), card, raised ? 7 : 5.8), alt, raised ? 7 : 5.8);
  const faint = preserveDefault
    ? toward(soften(ink, card, raised ? 5.8 : 4.7), card, raised ? 5.4 : 4.5)
    : toward(toward(soften(ink, card, raised ? 5.8 : 4.7), card, raised ? 5.4 : 5.2), alt, raised ? 5.4 : 5.2);
  /*
   * **A line has to be visible on both surfaces it is drawn between.** The hairline is derived from
   * the card but is also used on the page, and on 1974 those are two different creams: the line
   * measured 1.16:1 on the page while the gate only ever asked about the card. 1.7 on the card
   * leaves it above the floor on the page as well.
   */
  /*
   * **A line is drawn on the page as well as on the card.** The weight now comes from the shape, and
   * a line derived only against the card fell to 1.16:1 where it crossed a warmer page (1974). It is
   * derived against the card and then strengthened against the page, so every shape's rule clears
   * the floor on both.
   */
  const hairline = preserveDefault
    ? edge(card, ink, raised ? 3 : 1.7)
    : toward(edge(card, ink, raised ? 3 : shape.hair), canvas, raised ? 3 : shape.hair);
  const pageHairline = preserveDefault
    ? edge(canvas, ink, raised ? 3 : 1.7)
    : toward(edge(canvas, ink, raised ? 3 : shape.hair), card, raised ? 3 : shape.hair);

  /*
   * **The dock is always the dark bar**, whichever page it sits under.
   *
   * It used to be "the ink, pushed almost all the way to black" — right on a pale page, wrong on a
   * dark one: on Navy's card the ink is ivory, so mixing 95% toward it turned the bar *white*, and
   * the pill on it came out gold on cream, 4.45:1. A dark page gets a bar one step below the card.
   */
  const palePage = relativeLuminance(card) >= 0.35;
  const dock = palePage ? mixHex(card, ink, 0.95) : mixHex(card, DEEP, 0.5);
  const dockInk = toward('#FCFBFA', dock, 4.7);
  const dockBorder = edge(dock, dockInk, raised ? 3 : 1.6);

  const ring = toward(accent, card, 3.2);
  const pair = fillPair(accent, ink);
  /*
   * The pill in the dock is a **fill and a label chosen together**, not a fill and then whatever
   * ink is closest: `fillPair` searches for a cut that its own label can read on, so the pair
   * cannot come out at 4.45:1 through rounding.
   */
  const dockPill = pillPair(accent, dock, dockInk);

  const mapLand = alt;
  const mapWater = appearance === 'dark' ? mixHex(canvas, '#7BA37A', 0.12) : mixHex(card, '#7BA37A', 0.18);

  const picture = stylePhotograph(style);

  const tokens: Record<string, string> = {
    /* Surfaces */
    '--canvas-base': canvas,
    '--surface-alt': alt,
    '--surface-raised': card,
    '--l1-bg': alt,
    '--l2-bg': card,
    /* The card as a pane: opaque for a printed style, see-through for a glassy one. */
    '--card-fill': preserveDefault ? card : rgbaOf(card, shape.glass),
    '--l3-bg': dock,
    '--l3-border': `${shape.line} solid ${dockBorder}`,
    /*
     * **The structural obsidian does not follow the ink.** It is the fill of a primary action,
     * whose label is always light — so on a dark page it was set to the style's ivory ink and the
     * INSTALL button became ivory text on an ivory pill. It is a *dark plate* in every style: the
     * ink itself on a pale page (exactly today's obsidian), and near-black in the page's own hue
     * on a dark one, which is what the dark theme already does.
     */
    '--struct-main': palePage ? strong : mixHex(card, DEEP, 0.55),
    /*
     * **The mark keeps its own inks.** `--brand-ink` is `var(--struct-main)`, so a dark style
     * turned it ivory on the white tile and the OVVO logo disappeared into its own ground. The
     * tile is a fixed white plate with obsidian artwork in every appearance, so both halves are
     * written here rather than left to follow the palette.
     */
    '--brand-tile': '#FFFFFF',
    '--brand-ink': '#18181B',
    '--struct-secondary': mixHex(palePage ? strong : mixHex(card, DEEP, 0.55), alt, 0.4),
    '--on-dark': dockInk,
    '--on-dark-muted': mixHex(dockInk, dock, 0.26),
    '--hairline-on-dark': dockBorder,

    /* Structure */
    '--ink-strong': strong,
    '--ink': body,
    '--ink-muted': muted,
    '--ink-faint': faint,
    '--border-hairline': hairline,

    /*
     * **Delay and cancellation ink, derived against this style's own card.**
     *
     * `.delay` painted `var(--coral-ink)`, one fixed red for all fifty styles: `#8f3423` in the light
     * theme. On a pale style that is 7:1; on a dark style it is dark red on near-black, and the
     * sweep measured **1.03:1** on Station Sign and forty screens below 3:1. A colour that carries
     * meaning cannot be one constant across fifty palettes, so it is derived the same way every
     * other ink here is: from the red, towards the card, until it clears 4.6:1 — and again against
     * the second surface, which is what a translucent card exposes. Default is skipped, because its
     * own red already clears the line and nothing about Default may move.
     */
    ...(preserveDefault ? {} : { '--coral-ink': toward(toward('#C2452F', card, 4.6), alt, 4.6) }),

    /* The material of a card: flat paper in a printed shape, a lifted pane in a soft one. */
    '--card-shadow': shape.shadow,

    /* The inner radius is the outer one less the inset, so the two curves stay concentric. */
    ...(preserveDefault
      ? {}
      : {
          /*
           * The same pair the stylesheet derives: the card's capped corner, inset by four tenths
           * of itself. Written inline because Default keeps its old inner radius, and an inline
           * token beats `tokens.css`, so this is the one place the ceiling has to be repeated.
           */
          '--r-inner': `${Math.max(0, Math.round(Math.min(28 * shape.scale, 56) - Math.max(16, Math.min(28 * shape.scale, 56) * 0.4)))}px`,
        }),

    /* Geometry and weight, read by `tokens.css` for every radius and every border */
    '--shape-scale': String(shape.scale),
    /*
     * **A rounder card holds its content further in.** The corner curve reaches inwards, so a card
     * with a 40px radius needs more inset than one with 12px or its first line sits on the curve.
     * Default is left at 1 and its inner radius is left as it always was, so nothing about the
     * app's own look moves.
     */
    '--shape-pad': String(Math.max(1, Math.min(2.6, 1 + (shape.scale - 1) * 0.32))),
    '--line-width': shape.line,

    /* Accent, and the two cuts it needs to be drawn on the cards, the map and the dock */
    /* The signature colour exactly as authored: the dock, the focus ring, the marks. The *ink* cut
       is the one that has to clear 3:1 on a card, so it is the only one that moves. */
    '--accent-primary': accent,
    '--accent-primary-ink': ring,
    /*
     * **The focus ring is its own cut.** A ring answers to 3:1 on the surface it is drawn on, and
     * two accents do not meet that on their own cards: Default's coral is 2.49:1 on white and Poppy
     * Blue's orange is 2.87:1 on its pale blue. This is the accent moved in lightness only, and
     * moved again until it clears 3:1 on the page, so the marker is visible wherever focus lands.
     */
    '--focus-ring': toward(toward(accent, card, 3.2), canvas, 3.2),
    '--accent-fill': pair.fill,
    '--on-accent': pair.ink,
    '--accent-primary-border': mixHex(pair.fill, pair.ink, 0.16),
    '--accent-primary-hover': mixHex(pair.fill, pair.ink, 0.1),
    '--map-accent': toward(accent, mapLand, 3.2),
    '--accent-on-dock': dockPill.fill,
    '--on-dock-accent': dockPill.ink,

    /* Selected text is the style's accent, the same pair its filled controls wear */
    '--selection-bg': pair.fill,
    '--selection-ink': pair.ink,

    /* The map's own palette, which cannot inherit the cards' inks */
    '--map-ink': body,
    '--map-land': mapLand,
    '--map-water': mapWater,
    '--map-stop-fill': card,
    '--map-stop-stroke': muted,

    /* Waiting */
    '--skeleton-fill': mixHex(card, ink, 0.12),
    '--skeleton-sheen': mixHex(card, ink, 0.04),

    /* Dialogs and sheets, which are their own layer above the page */
    '--chrome-surface': card,
    '--chrome-surface-alt': alt,
    '--chrome-border': hairline,
    '--chrome-ink': body,
    '--chrome-ink-strong': strong,
    '--chrome-ink-muted': muted,
    '--chrome-ink-faint': faint,

    /* The photograph's wash, computed as rgb() so an old WebKit keeps its paint */
    '--app-bg-wash': wash(canvas, picture ? photoScrim(picture, appearance) : 0.55),
    '--page-border': pageHairline,

    /* Lettering: the title face, the section face and the reading face */
    /*
     * The display face's own four numbers, and only for a face that asked for them: Default has no
     * entry, so its type is the untouched original and its tokens fall through to `tokens.css`.
     */
    ...(style.id === DEFAULT_STYLE_ID || !DISPLAY_TYPE[style.display]
      ? {}
      : {
          '--display-size': DISPLAY_TYPE[style.display]!.size,
          '--display-weight': DISPLAY_TYPE[style.display]!.weight,
          '--display-leading': DISPLAY_TYPE[style.display]!.leading,
          '--display-tracking': DISPLAY_TYPE[style.display]!.tracking,
        }),

    /* The section face's own size and weight, for the serif sub-faces only. */
    ...(style.id === DEFAULT_STYLE_ID || !SUB_TYPE[style.sub]
      ? {}
      : {
          '--section-size': SUB_TYPE[style.sub]!.size,
          '--section-weight': SUB_TYPE[style.sub]!.weight,
        }),

    '--font-stack': FONT_STACKS[style.body],
    '--font-body': FONT_STACKS[style.body],
    '--font-sub': FONT_STACKS[style.sub],
    '--font-display': FONT_STACKS[style.display],
  };

  /*
   * **The pinned values, applied last so nothing derives over them.** Only Default has any, and
   * they are the app's own old palette (see `StyleDef.pinned`). Raised contrast skips them, because
   * that switch must be able to strengthen the look that is on screen.
   */
  const pinned = raised ? undefined : style.pinned?.[appearance];
  if (pinned) Object.assign(tokens, pinned);

  return tokens;
}

/* ------------------------------------------------------------------ the photograph */

/**
 * Where a style's photograph lives, if the traveller has put one there.
 *
 * **Two files, one picture.** `<id>.jpg` is the day picture and `<id>-night.jpg` is the same
 * picture cut for the night appearance. Both are optional and missing one is not an error: a style
 * with only the day file wears it at night too, and a style with no file at all draws its own
 * colour, which every photo style can do on purpose.
 */
export function stylePhotoPath(id: string, appearance: Appearance = 'light'): string {
  return appearance === 'dark' ? `/style-photos/${id}-night.jpg` : `/style-photos/${id}.jpg`;
}

/**
 * **What the last look at a style's photograph found.**
 *
 * The Background row used to show the traveller's *intention*: "Photograph" was selected while the
 * folder held nothing and the app drew the colour, which is the same lie the motion switch told. The
 * painting code already probes the file; it now writes its answer here, and the picker reads it, so
 * the row can describe what is on the screen rather than what was hoped for.
 */
export const stylePhotoStatus = new Map<string, 'present' | 'missing'>();

/**
 * Photographs that were asked for and were not there, so no screen asks twice in a session.
 *
 * Keyed by **address**, not by style: the day file and its night cut miss separately, and a style
 * whose night cut is missing must still be able to wear its day picture.
 */
const missingPhotos = new Set<string>();

export interface ApplyStyleOptions {
  style: StyleDef;
  appearance: Appearance;
  highContrast?: boolean;
  /** The style wants its photograph and the saving modes allow it. */
  photo?: boolean;
}

/**
 * Paint a style: every token, the lettering, and the photograph if there is one.
 *
 * A photograph is **never a hole in the page**. The style's own canvas is written first, so the
 * moment `data-background` says `photo` the page already has a colour underneath; then the file is
 * asked for, and a 404 quietly puts the page back on that colour. That is why the folder can be
 * empty: ten styles that can wear a picture are ten styles that can be worn as their colour until
 * somebody drops the file in, and nothing else about the page changes either way.
 */
export function applyStyle({ style, appearance, highContrast, photo }: ApplyStyleOptions): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const tokens = styleTokens(style, appearance, { highContrast });
  for (const [property, value] of Object.entries(tokens)) root.style.setProperty(property, value);

  root.dataset.style = style.id;

  const { canvas } = stylePalette(style, appearance);
  root.style.setProperty('--app-bg-colour', canvas);
  root.style.setProperty('--app-bg-position', 'center');

  const picture = stylePhotograph(style);
  const dayUrl = stylePhotoPath(style.id, 'light');
  const url = stylePhotoPath(style.id, appearance);
  /* Losing the night cut leaves the day picture; only losing both leaves the colour. */
  const gone = missingPhotos.has(url) && missingPhotos.has(dayUrl);
  const wantsPhoto = Boolean(photo) && Boolean(picture) && !gone;
  if (!wantsPhoto) {
    root.dataset.background = 'colour';
    delete root.dataset.surface;
    root.style.removeProperty('--app-bg-image');
    return;
  }

  root.dataset.background = 'photo';
  if (!picture || !picture.glass) delete root.dataset.surface;
  else root.dataset.surface = 'glass';
  root.style.setProperty('--app-bg-image', `url("${url}")`);

  /* The check, so a missing file is the colour and not a blank wash. */
  const giveUp = () => {
    stylePhotoStatus.set(style.id, 'missing');
    if (root.dataset.style !== style.id) return;
    root.dataset.background = 'colour';
    delete root.dataset.surface;
    root.style.removeProperty('--app-bg-image');
  };
  const probe = new Image();
  probe.onload = () => {
    stylePhotoStatus.set(style.id, 'present');
  };
  probe.onerror = () => {
    missingPhotos.add(url);
    /*
     * **A night cut that is not there is the day picture.** The night file changes only the wash
     * under the same photograph, so a style whose night cut has not been made yet wears its day
     * picture at night rather than dropping to a flat colour.
     */
    if (url === dayUrl || missingPhotos.has(dayUrl)) {
      giveUp();
      return;
    }
    const second = new Image();
    second.onload = () => {
      stylePhotoStatus.set(style.id, 'present');
      if (root.dataset.style !== style.id) return;
      if (root.dataset.background !== 'photo') return;
      root.style.setProperty('--app-bg-image', 'url("' + dayUrl + '")');
    };
    second.onerror = () => {
      missingPhotos.add(dayUrl);
      giveUp();
    };
    second.src = dayUrl;
  };
  probe.src = url;
}

/* ------------------------------------------------------------------ migration */

/** Turn a colour into the style it is nearest to, so a customised browser lands somewhere sane. */
export function nearestStyleId(from: { page?: string; accent?: string }): string {
  const page = from.page ? rgbOf(from.page) : null;
  const accent = from.accent ? rgbOf(from.accent) : null;
  if (!page && !accent) return DEFAULT_STYLE_ID;
  const distance = (a: [number, number, number], b: [number, number, number]) =>
    Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
  let best = DEFAULT_STYLE_ID;
  let bestScore = Number.POSITIVE_INFINITY;
  for (const style of STYLES) {
    if (style.photo) continue;
    const [canvas, , , hue] = style.light;
    const score =
      (page ? distance(page, rgbOf(canvas)) : 0) + (accent ? distance(accent, rgbOf(hue)) * 1.5 : 0);
    if (score < bestScore) {
      bestScore = score;
      best = style.id;
    }
  }
  return best;
}
