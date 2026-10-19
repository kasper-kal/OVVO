/**
 * Icons are Lucide (`lucide-react`, ISC) — the library's own geometry, not ours.
 *
 * This is the third set in this file's history and the last, for a reason worth writing down:
 * the first was hand-drawn path data here, which is where the gear with the off-centre hub and
 * the sprawled walker came from; the second was Phosphor, whose filled outlines are drawn for
 * larger sizes and read heavy at the 13–15px this app uses them at. Lucide is the idiom the
 * rest of the interface was already built in — 24-unit grid, a 2-unit stroke, round caps — it
 * is what the original chevrons, the magnifier, the heart and the star were copied from, and
 * its line weight scales down without going fat or muddy.
 *
 * Every glyph is Lucide's now, with one exception that is deliberate: the three navigation
 * glyphs — `home`, `board` and `menu` — are the app's own drawings, kept in `NAV_GLYPHS`
 * below. They were the three hand-drawn icons from the first set that the traveller asked to
 * keep, and the sweep to Lucide took them out with the rest. A sweep is not a reason to lose
 * something that was working: those three are drawn on the same 24-unit grid with the same
 * round caps, at the 1.75 stroke the set was drawn in, and they are the only three glyphs that
 * sit side by side in the dock, where the difference between a Lucide house and this one is
 * the difference the traveller actually looks at.
 *
 * `walk` is Lucide's `Footprints`: Tabler's mid-stride figure was legible at 24px and a
 * scratch at the 13–15px this app uses it at.
 *
 * The names on the left are this app's vocabulary, so no call site changed: `station` is a
 * building (Lucide has no station), `board` is a monitor (the live departures screen),
 * `location` is a crosshair ("use my current location"), `metro` is the tunnel train,
 * `ferry` is a ship, `swap` is a pair of arrows, `heartFilled` is the heart, filled.
 *
 * Two of them are deliberately a pair and are the only names this file owns that a library
 * does not: `pin` is the drawing pin (the control that keeps a stop) and `mapPin` is the
 * teardrop (a place drawn on the map). See `pin` in `GLYPHS` for why they are two glyphs.
 */
import { useId } from 'react';
import type { ComponentType, ReactNode } from 'react';
import type { LucideProps } from 'lucide-react';
import {
  Accessibility,
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  Bike,
  Bookmark,
  Building2,
  Bus,
  Footprints,
  GripVertical,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Crop,
  Crosshair,
  Focus,
  Funnel,
  Heart,
  History,
  House,
  Info,
  LayoutGrid,
  List,
  Map,
  Minus,
  Monitor,
  Pin,
  Pipette,
  Plus,
  RefreshCw,
  Route,
  Search,
  Settings,
  Share2,
  Ship,
  SlidersHorizontal,
  Star,
  Ticket,
  TrainFront,
  TrainFrontTunnel,
  TrainTrack,
  TramFront,
  Trash2,
  TriangleAlert,
  Users,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type { TravelMode } from '../../data/types';

/**
 * **A place on the map** — Lucide's `MapPin` teardrop, drawn as one compound path so that its
 * hole survives the fill.
 *
 * Lucide's own `MapPin` is a teardrop plus a separate `<circle>`, and `fill: currentColor`
 * fills that circle too: a marker that is filled came out as a solid blob with its hole closed
 * up (reported, with two images). Here the circle is a second subpath of the same `d`, and the
 * path carries `fill-rule: evenodd`, which punches it out of the teardrop. Stroked and unfilled
 * it is Lucide's drawing to the unit.
 *
 * This is the **marker** half of the pair. It belongs to the map — the picker's sheet, a pin on
 * the canvas — and it is never a control (see `pin` below for why the two were split).
 */
const MAP_PIN_PATH =
  'M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0Z' +
  'M15 10a3 3 0 1 0-6 0a3 3 0 1 0 6 0Z';

function MapPinGlyph({ size = 20, strokeWidth = 2, className, ...rest }: LucideProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      <path d={MAP_PIN_PATH} fillRule="evenodd" clipRule="evenodd" />
    </svg>
  );
}

/** This app's icon vocabulary -> the glyph that means the same thing. */
const GLYPHS = {
  accessibility: Accessibility,
  alert: TriangleAlert,
  arrowLeft: ArrowLeft,
  arrowRight: ArrowRight,
  bike: Bike,
  board: Monitor,
  bookmark: Bookmark,
  bus: Bus,
  calendar: CalendarDays,
  check: Check,
  chevronDown: ChevronDown,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  chevronUp: ChevronUp,
  clock: Clock,
  /*
   * **Frame a picture** — Lucide's `Crop`, the two corner brackets a cropper is drawn with. The
   * crop screen is the only place it appears, and that is what it means there.
   */
  crop: Crop,
  close: X,
  ferry: Ship,
  filter: Funnel,
  /*
   * "Fit the whole network in view" — the map picker's recentre control.
   *
   * It used to be drawn with `location`, the same crosshair the two *use my location* controls
   * use, and the audit caught it: one glyph, two meanings (W3C COGA). A crosshair says "where
   * am I", which this control never asks; it only moves the drawing.
   */
  focus: Focus,
  /*
   * **Drag a widget** — Lucide's `GripVertical`, the two columns of dots every reorderable list
   * has used for forty years. Decorative only: on the home screen's customising mode the whole
   * card is the handle, so this says where to take hold rather than being a target of its own.
   */
  grip: GripVertical,
  heart: Heart,
  heartFilled: Heart,
  history: History,
  home: House,
  info: Info,
  location: Crosshair,
  /*
   * **Arrange the home screen** — Lucide's `LayoutGrid`, the tiles themselves.
   *
   * "Customise home" wore `sliders` — the options/filters glyph — and the audit grouped it with
   * *Options*, *Travel preferences* and *Manage avoidance preferences* because of the verb. Two
   * different functions were drawing one glyph (W3C COGA, one glyph, one meaning): `sliders`
   * filters what is in front of you, this opens the grid you are standing in and lets you add
   * and remove blocks. The grid is what it changes, so the grid is what it draws.
   */
  layout: LayoutGrid,
  map: Map,
  menu: List,
  metro: TrainFrontTunnel,
  mapPin: MapPinGlyph,
  minus: Minus,
  /*
   * **Keep a stop** — Lucide's `Pin`, the drawing pin, not the teardrop above it.
   *
   * The teardrop spent two rounds meaning two things at once: *where something is* (a marker
   * on a map) and *this one is mine* (a button the traveller presses). A glyph that is both a
   * label and a marker is a promise made twice (W3C COGA, "Use icons that help the user";
   * USWDS' own example is an envelope used for both email and a mailing address), and the
   * traveller said so: "changing the pin icon to an actual pin that fills when you click it"
   * to make the two tell themselves apart. So:
   *
   *   - `mapPin` (teardrop) = **a place**, drawn on the map only;
   *   - `pin` (drawing pin) = **the control that keeps a stop**, filled while it is kept, the
   *     way Material Symbols' FILL axis and Apple's `pin.fill` show a held state.
   *
   * A drawing pin also says *held* rather than *located*, which is the action's real name:
   * the stop is not being pointed at, it is being pinned to the traveller's own list.
   */
  pin: Pin,
  /*
   * **Take a colour out of the screen** — Lucide's `Pipette`. It was drawn with `location` (the
   * crosshair) in the first version of the sampler, which meant "where am I" was standing in for
   * "sample this pixel". The eyedropper draws the thing, not the intent.
   */
  pipette: Pipette,
  /*
   * A platform is not the departure board, and it was wearing that screen's monitor glyph
   * (`Platform 5` in a leg's stop row). Lucide's `TrainTrack` is the platform itself.
   */
  platform: TrainTrack,
  plus: Plus,
  refresh: RefreshCw,
  route: Route,
  search: Search,
  settings: Settings,
  share: Share2,
  sliders: SlidersHorizontal,
  star: Star,
  station: Building2,
  swap: ArrowUpDown,
  ticket: Ticket,
  train: TrainFront,
  tram: TramFront,
  trash: Trash2,
  users: Users,
  walk: Footprints,
  zoomIn: ZoomIn,
  zoomOut: ZoomOut,
} satisfies Record<string, ComponentType<LucideProps>>;

export type IconName = keyof typeof GLYPHS;

/**
 * The three navigation glyphs, drawn here rather than taken from a library.
 *
 * These are the app's own drawings from the first icon set — the ones the traveller asked
 * to keep when the rest were replaced. Same 24-unit grid, same round caps as the Lucide
 * glyphs beside them, at the 1.75 unit stroke the set was drawn in, so they sit in a nav
 * row without a seam.
 */
const NAV_GLYPHS: Partial<Record<IconName, ReactNode>> = {
  /* A door with a pitched roof; the tile is the door, not the house. */
  home: <path d="M4 11l8-6.5 8 6.5v8a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 19v-8z" />,
  /* The departures screen: a framed board with two lines of times on it. */
  board: (
    <>
      <rect x="4" y="5" width="16" height="14" rx="4" />
      <path d="M8 9.5h8M8 13h5" />
    </>
  ),
  /* All sections. */
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
};

/** Glyphs that are the filled drawing by definition. */
const FILLED = new Set<IconName>(['heartFilled']);

/** The stroke the hand-drawn navigation set was drawn in, and its default. */
const NAV_STROKE = 1.75;

export function Icon({
  name,
  size = 20,
  className,
  strokeWidth,
}: {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  const classes = className ? `icon ${className}` : 'icon';
  const drawn = NAV_GLYPHS[name];
  if (drawn) {
    return (
      <svg
        className={classes}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth ?? NAV_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
        data-icon={name}
        aria-hidden="true"
        focusable="false"
      >
        {drawn}
      </svg>
    );
  }
  const Glyph = GLYPHS[name];
  return (
    <Glyph
      size={size}
      strokeWidth={strokeWidth ?? 2}
      data-icon={name}
      className={classes}
      aria-hidden="true"
      focusable="false"
      {...(FILLED.has(name) ? { fill: 'currentColor' } : {})}
    />
  );
}

export const MODE_ICON_NAME: Record<TravelMode, IconName> = {
  walk: 'walk',
  bike: 'bike',
  train: 'train',
  bus: 'bus',
  tram: 'tram',
  metro: 'metro',
  ferry: 'ferry',
};

export function ModeIcon({ mode, size = 16 }: { mode: TravelMode; size?: number }) {
  return <Icon name={MODE_ICON_NAME[mode]} size={size} />;
}

/**
 * The OVVO mark, straight from the artwork's own outline: three filled paths in a 1024
 * unit box — the two black tiles with the V's cut out of them, and the two rings — drawn
 * in the source file's own orientation (`translate(0 1024) scale(0.1 -0.1)`). Only the ink
 * is stored as paths: the white diagonals are the mark's own background, painted beneath
 * them from the palette (`--brand-tile` and `--brand-ink`) instead of from a raster.
 */
const BRAND_INK = [
  'M5120 7680 l0 -2560 -2560 0 -2560 0 0 -2560 0 -2560 2560 0 2560 0 0 2560 0 2560 2560 0 2560 0 0 2560 0 2560 -2560 0 -2560 0 0 -2560z m1692 1605 c10 -27 46 -120 79 -207 32 -86 68 -178 80 -205 11 -26 50 -124 86 -218 35 -93 87 -226 114 -295 146 -373 204 -524 234 -605 18 -49 60 -157 92 -240 33 -82 84 -213 113 -290 29 -77 60 -155 69 -173 l17 -33 71 188 c67 178 175 456 276 713 25 63 73 187 107 275 108 280 250 646 305 785 29 74 72 186 96 248 l43 112 401 0 c221 0 404 -3 407 -6 3 -3 -9 -40 -27 -82 -18 -42 -63 -151 -99 -242 -37 -91 -96 -235 -131 -320 -91 -222 -323 -788 -425 -1040 -80 -195 -184 -451 -385 -940 -39 -96 -118 -289 -175 -427 l-103 -253 -373 0 c-363 0 -374 1 -384 20 -6 11 -41 95 -79 187 -38 93 -110 269 -161 393 -51 124 -123 299 -160 390 -37 91 -124 303 -193 471 -69 168 -164 400 -210 515 -115 284 -246 602 -262 639 -7 17 -44 109 -83 205 -38 96 -97 241 -131 322 -33 80 -61 151 -61 157 0 8 122 10 416 9 l416 -3 20 -50z m-5105 -5252 c40 -98 130 -324 201 -503 72 -179 144 -359 160 -400 57 -140 334 -835 382 -955 83 -211 115 -285 122 -285 4 0 10 10 13 23 9 29 113 299 215 557 45 113 117 296 160 406 43 111 135 343 203 515 69 173 169 428 223 567 l99 252 393 0 c371 0 394 -1 389 -17 -3 -10 -50 -126 -105 -258 -55 -132 -139 -337 -187 -455 -48 -118 -141 -345 -207 -505 -65 -159 -136 -333 -158 -385 -21 -52 -72 -176 -113 -275 -41 -99 -102 -250 -137 -335 -35 -85 -107 -261 -160 -390 -54 -129 -139 -337 -190 -462 l-93 -228 -357 0 -358 0 -10 28 c-12 33 -143 350 -277 672 -54 129 -110 267 -125 305 -15 39 -73 180 -129 315 -107 258 -135 327 -251 610 -40 96 -112 272 -160 390 -49 118 -145 352 -214 520 -68 168 -140 342 -159 388 l-35 82 397 0 397 0 71 -177z',
  'M2384 9380 c-255 -25 -533 -114 -737 -236 -250 -150 -485 -402 -612 -654 -172 -342 -230 -742 -165 -1126 23 -131 91 -346 148 -465 203 -421 617 -748 1093 -862 163 -39 271 -52 449 -52 468 1 875 155 1188 450 306 289 479 656 524 1114 28 287 -42 649 -176 916 -246 487 -698 811 -1256 899 -123 20 -340 27 -456 16z m424 -699 c40 -12 113 -41 161 -66 321 -160 511 -477 528 -876 22 -515 -261 -940 -700 -1053 -333 -86 -663 6 -898 251 -376 390 -380 1090 -10 1485 138 147 288 233 481 274 98 20 343 12 438 -15z',
  'M7478 4259 c-600 -58 -1125 -419 -1374 -943 -111 -236 -152 -409 -161 -679 -11 -340 31 -553 163 -834 110 -235 315 -481 526 -634 203 -146 467 -256 723 -300 170 -29 453 -32 623 -5 631 98 1144 515 1345 1093 194 555 108 1178 -222 1620 -369 496 -964 745 -1623 682z m404 -674 c193 -40 352 -129 494 -277 122 -127 199 -270 252 -467 22 -86 25 -116 26 -276 0 -156 -3 -193 -23 -275 -91 -370 -351 -647 -697 -742 -106 -29 -382 -32 -487 -5 -222 56 -432 202 -556 385 -273 405 -242 1011 70 1358 136 151 317 257 509 298 89 20 320 20 412 1z',
];

/**
 * The mark's shape is the artwork's own: a 1024-unit square rounded by 256 units — a quarter of
 * its side, which is the 14px the mark's 56px tile used to round itself by — and it is rounded
 * *inside* the drawing, by a mask over the whole of it, rather than by the element.
 *
 * That is the whole of why the corners used to carry a pale line on the top-right and bottom-left.
 * The ink reaches the edge of the box, so a rounded corner has to cut it, and the mark's ground is
 * white with the ink on top of it. Cut the element instead (`overflow: hidden` with a
 * `border-radius`, or a `clip-path`) and each of the two is cut on its own: white painted to the
 * corner's antialiasing, then ink painted onto that, so a quarter of every half-covered corner
 * pixel stays white. Measured on the corner's arc: 80 of 255 where the ink and the page are 18 and
 * 24 — a hairline along the two corners the ink reaches, and nothing at the two the white reaches.
 *
 * A mask over a group, unlike a clip, is applied to the group's finished paint, so the white and
 * the ink composite first and the arc is cut once: the corner is then ink to page.
 */
const BRAND_TILE_RADIUS = 256;

export function BrandMark({ size = 28, className }: { size?: number; className?: string }) {
  /* One id per instance: the mask is referenced by url(), and the mark is not the only thing that
     may be drawn into a page. React's own id is namespaced but not URL-safe, so it is reduced. */
  const maskId = `brand-tile-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 1024 1024"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <mask id={maskId}>
          <rect width="1024" height="1024" rx={BRAND_TILE_RADIUS} fill="#fff" />
        </mask>
      </defs>
      <g mask={`url(#${maskId})`}>
        {/* The artwork's four tiles: two are ink (`BRAND_INK`), the other two are this, its own
            ground, in the palette's `--brand-tile`. It also fills the V's cut out of the ink. */}
        <rect className="brand-mark__tile" width="1024" height="1024" />
        <g className="brand-mark__ink" transform="translate(0 1024) scale(0.1 -0.1)">
          {BRAND_INK.map((d, index) => (
            <path key={index} d={d} />
          ))}
        </g>
      </g>
    </svg>
  );
}
