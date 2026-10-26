/**
 * **The page's colour and the widgets' colour are two decisions — and the cream is still one of
 * them.**
 *
 * The app has been drawn on cream (`--canvas-base`, `#FCFBFA`) since the first round, and it
 * stays the default: `cream` is a choice in this model rather than the absence of one, so a
 * traveller who never opens the settings gets exactly the canvas the app has always had, and one
 * who has been here since then does not lose it by touching nothing.
 *
 * **The page** has three answers, one at a time:
 *
 *   • **cream** — the app's own canvas, untouched;
 *   • **colour** — the traveller's own colour, from the screen in `components/ui/ColourScreen.tsx`;
 *   • **photo** — a picture of theirs, kept on this device.
 *
 * **The widgets' colour** is `primaryColour`: the cards, the panels and fields inside them, the
 * sidebar, and the accent that draws the active navigation entry, the focus ring, the marks and the
 * map's highlight. Empty means **follow the background** — the page's colour when the page has one,
 * and the app's own surfaces and coral when it does not — which is exactly what the interface did
 * before the two were separated, so the default changes nothing for anyone.
 *
 * **Two colours, one at a time or both.** When the widgets follow the background the whole
 * interface answers to one choice, the way it always has. When they do not, the page keeps its
 * ground and its own readable ink and the widgets take theirs — `[data-surface='split']` in
 * `styles/components.css` — which is the only genuinely new drawing in that model, and the reason
 * each is **derived into a small palette** of its own rather than copied everywhere: a card painted
 * the same hex as the page behind it would have no edge:
 *
 *   • the **page** *is* the colour chosen, moved only in lightness if nothing could be read on
 *     it;
 *   • a **card** is the page moved 12% toward its ink, and a **panel inside it** 24%, so the
 *     surfaces stack by tone rather than by a second colour;
 *   • the **ink on a card** is whichever of the app's two inks wins on that tint. A dark tint
 *     keeps its dark card and gets light text (the traveller's choice, not a softened colour),
 *     and the whole ramp — strong, body, muted, faint — is derived from it, each step moved as
 *     far toward the surface as it can go while still clearing its contrast target;
 *   • the **accent** is the same hue with its lightness moved until it clears 3:1 against the
 *     card (the map uses its own cut, measured against the map's land), so an active entry and a
 *     focus ring remain visible whatever colour was chosen.
 *
 * Two things stay their own colour, because they are language rather than decoration: the
 * semantic tints (a delay's coral, a success's sage, a disruption's red) and the obsidian tier.
 * On a dark card those inks are flipped to their light cuts, so a delay figure is still readable
 * there — see `[data-card-ink='light']` in `styles/components.css`.
 *
 * **Over a photo** the cards have two treatments, and the choice is the traveller's:
 *
 *   • **glass** — translucent, blurred and saturated, with a light hairline: the picture shows
 *     through, the way iOS draws Liquid Glass. The page behind still carries the canvas wash, so
 *     headings outside the cards keep their contrast.
 *   • **colour** — the tint, exactly as above, with the picker's **eyedropper** to take a colour
 *     out of the wallpaper itself.
 *
 * A photo is stored as a **data URL**, which means it lives in this browser's storage and nowhere
 * else — no upload, no account, nothing to leak. That also means it must be small: a modern phone
 * photo is 4–8 MB, and `localStorage` is a few megabytes in total shared with every other setting.
 * `readImageFile` therefore decodes the file and redraws it bounded to 1600px on its long edge as
 * a JPEG, which is a few hundred kilobytes, before anything is stored. The original file is never
 * kept, and the size limit is stated on the card rather than silently dropping the choice.
 */

import { contrast, parseColor } from './selection';
import { cropFocus, type CropRect } from './photoCrop';

/** Which of the three page backgrounds is in force. */
export type BackgroundChoice = 'cream' | 'colour' | 'photo';

/** What the cards are made of when the page is a photo. */
export type CardTreatment = 'glass' | 'colour';

/** The longest edge a stored photo is redrawn to, in CSS pixels. */
export const BACKGROUND_IMAGE_MAX_EDGE = 1600;

/**
 * The longest edge the **uncropped** copy is kept at (`backgroundImageSource`).
 *
 * Larger than the baked image on purpose: the source exists so a crop can be redone on the whole
 * picture rather than on a crop of a crop, so it has to hold the detail a tight frame will need.
 * 2048 is the point where the extra pixels stop being visible on the screens this app is drawn on
 * and start being storage the rest of the settings have to share.
 */
export const BACKGROUND_SOURCE_MAX_EDGE = 2048;

/** The largest file the card will accept, in bytes. A phone photo is larger; the crop is not. */
export const BACKGROUND_IMAGE_MAX_BYTES = 12 * 1024 * 1024;

/** Where the choices and their values live, in the settings object. */
export interface BackgroundSettings {
  background: BackgroundChoice;
  /** The **page's** colour, `#rrggbb`; painted in `colour` mode and unused on cream. */
  backgroundColour: string;
  /** The stored photo as a data URL, when `background` is `photo`. */
  backgroundImage: string;
  /** The whole picture and the frame that was taken from it (`lib/photoCrop.ts`). */
  backgroundImageSource?: string;
  backgroundCrop?: CropRect | null;
  /** Glass or the tint, over a photo. Ignored in the other two modes. */
  cardTreatment: CardTreatment;
  /**
   * The **widgets'** colour: the cards, the panels, the sidebar and the accent. `''` follows the
   * background (see the file's note) — the behaviour of every version before this setting existed.
   */
  primaryColour: string;
  /** Which colour selected text is painted with, and its own hex when it is `custom`. */
  selectionColour?: string;
  selectionCustom?: string;
  /**
   * Raised contrast, which the derived ink ramp has to *know about* rather than be colouring over.
   *
   * The tinted palette writes `--ink`, `--ink-muted`, `--ink-faint` and the hairlines on `:root`
   * from `styles/components.css`, and that file loads after `tokens.css` — so a static
   * `[data-contrast='high']` block loses on source order the moment a page colour exists, and the
   * switch stopped doing anything (reported). The ramp is therefore built at two strengths here.
   */
  highContrast?: boolean;
}

/** A colour that works on the cream canvas and is nobody's favourite: a soft warm blue. */
export const DEFAULT_BACKGROUND_COLOUR = '#dfe8f2';

/** The treatment a fresh photo background starts on: the picture visible through the card. */
export const DEFAULT_CARD_TREATMENT: CardTreatment = 'glass';

/**
 * The swatches the picker offers first, in the iOS system-colour order.
 *
 * They are the colours of a phone's own tint picker — coral through pink, then the neutrals — so
 * the row is recognisable before the spectrum is touched. The muted tints at the end are this
 * app's own calm ground, and `#fcfbfa` is here as *Cream*, so the app's canvas is one press away
 * inside the picker too.
 */
export const BACKGROUND_SWATCHES = [
  '#ff7e67',
  '#ff9f0a',
  '#ffd60a',
  '#30d158',
  '#63e6e2',
  '#64d2ff',
  '#0a84ff',
  '#5e5ce6',
  '#bf5af2',
  '#ff375f',
  '#a2845e',
  '#8e8e93',
  '#e6efe6',
  '#dfe8f2',
  '#ffd9d1',
  '#18181b',
  '#fcfbfa',
] as const;

type Rgb = [number, number, number];

/** One derived palette for one chosen tint. Every value is a `#rrggbb` string. */
export interface TintPaint {
  /** The page's ground: the chosen colour itself. */
  page: string;
  /** A card's surface: the tint itself. */
  card: string;
  /** A panel or field inside a card: the tint one step toward its ink. */
  cardAlt: string;
  /** The card's ink ramp, each step as readable as it can be. */
  inkStrong: string;
  ink: string;
  inkMuted: string;
  inkFaint: string;
  /** True when the card's ink had to be the light one. */
  inkIsLight: boolean;
  /**
   * A card's edge, the tint's ink softened toward the card until it is visible but still a hairline.
   *
   * **This was the missing value.** The first version of the palette derived the page, the card, the
   * ink and the accent but no border at all, so every control kept the cream theme's `#e8e6df` in
   * every mode: measured 1.05:1 on a yellow page, 1.09:1 on a blue one, and 6.03:1 on a dark green
   * one — the same rule drawing an invisible edge in one place and a cream line in another. A border
   * has to come from the surface it sits on, exactly like the ink does.
   */
  border: string;
  /** The page's own edge, measured against the page rather than the card. */
  pageBorder: string;
  /**
   * **The navigation bar's own step off the page — smaller than a card's.**
   *
   * The sidebar was painted with a card's surface, which is 12% of the way to the ink and further
   * when the page needed lifting to carry that step. Beside a page of the same colour the bar read
   * as a *lightened* slab rather than as the bar (reported: "Make the Nav bar lightening less, just
   * less lightening"), so the chrome gets its own tier: a third of the card's step. It is still a
   * step — a bar with no edge would be a hole — just not a card's.
   */
  nav: string;
  /** The row inside the bar, one step above it. */
  navAlt: string;
  /** The bar's edge, measured on the bar. */
  navBorder: string;
  /** The accent: the tint's hue, moved in lightness until it clears 3:1 on the card. */
  accent: string;
  /**
   * The accent **as a fill behind text** — a badge count, an accent button, a chip.
   *
   * A ring or a mark needs 3:1; a label needs 4.5:1, and a hue can clear the first and miss the
   * second (the app's own `#dfe8f2` page derived `#4e80b7`, whose best ink measured **4.3:1** on
   * the alert badge, the nav count and *Remove all stored data*). The fill is the same hue moved
   * in lightness until the winning ink clears 4.5:1, so the accent stays the accent and its text
   * is readable.
   */
  accentFill: string;
  accentBorder: string;
  accentHover: string;
  /** The accent cut measured against the map's land, for routes and markers. */
  mapAccent: string;
  /** The accent cut measured against the obsidian dock, for the active navigation entry. */
  dockAccent: string;
  /** The ink to draw on that dock cut. */
  onDockAccent: string;
  /** The ink to draw on the accent. */
  onAccent: string;
  /** The meaning-carrying inks, re-measured against the cards rather than the theme's surface. */
  coralInk: string;
  sageInk: string;
  butterInk: string;
}

function tokenValue(token: string): string {
  if (typeof document === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(token).trim();
}

function toHex([r, g, b]: Rgb): string {
  return (
    '#' +
    [r, g, b]
      .map((channel) => Math.round(Math.min(255, Math.max(0, channel))).toString(16).padStart(2, '0'))
      .join('')
  );
}

function mix(a: Rgb, b: Rgb, t: number): Rgb {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

/**
 * Move `ink` toward `surface` as far as it can go while still clearing `target` contrast.
 *
 * This is what makes a card's small print as soft as the colour allows: a fixed muted ink would
 * either wash out on a strong tint or be needlessly heavy on a pale one, and neither is a reading
 * of the chosen colour. `target` is 4.6 for the faint step rather than 4.5 so rounding can never
 * land just under the line.
 */
function soften(ink: Rgb, surface: Rgb, target: number): Rgb {
  let best = ink;
  for (let step = 1; step <= 30; step += 1) {
    const candidate = mix(ink, surface, step / 30);
    if (contrast(candidate, surface) < target) break;
    best = candidate;
  }
  return best;
}

/** The two inks the app owns, whichever the appearance. */
function inkEnds(): { dark: Rgb; light: Rgb } {
  return {
    dark: parseColor(tokenValue('--struct-main')) ?? ([24, 24, 27] as Rgb),
    light: parseColor(tokenValue('--on-dark')) ?? ([252, 251, 250] as Rgb),
  };
}

/** True when the *dark* ink is the better of the two on this surface. */
function darkInkWins(surface: Rgb): boolean {
  const { dark, light } = inkEnds();
  return contrast(surface, dark) >= contrast(surface, light);
}

/**
 * **The page is the colour; the cards are steps off it.**
 *
 * One colour, everything — which means the wallpaper itself carries the chosen colour rather than a
 * wash of it. A wash was the first attempt and it was wrong: `#ff375f` at 14% over cream is a pale
 * pink page, so the wallpaper looked untouched and the order ("you didn't even change the wallpaper
 * colour") was fair.
 *
 * Surfaces therefore stack by *tone*, not by tint: the card is the page moved 12% toward its own
 * ink and a panel inside it 24%, so a card still reads as a card without a second colour. The ink
 * comes first and everything else follows from it, because a colour this strong cannot be painted
 * until something can be read on it: a mid-tone with no readable ink — iOS blue is 4.34:1 under
 * black — is moved in **lightness only** (hue and saturation untouched) until the ink clears the
 * line on the *panel*, the tier with the least room. A colour that already clears it is used exactly
 * as chosen, which is the whole of "keep it and flip the text".
 */
function tintTiers(tint: Rgb): {
  page: Rgb;
  card: Rgb;
  alt: Rgb;
  ink: Rgb;
  worst: Rgb;
  inkIsLight: boolean;
} {
  const { dark, light } = inkEnds();
  const inkFor = (surface: Rgb) => (contrast(surface, light) > contrast(surface, dark) ? light : dark);
  const stepsFor = (page: Rgb) => {
    /*
     * The card is a step *off* the page, and which way is a question about the page: a vivid or dark
     * colour is lifted toward white (so a card reads as raised, the way a tinted widget does), while
     * a page already near white cannot be lifted and is deepened toward the ink instead.
     */
    const towards = luminanceOf(page) > 0.82 ? inkFor(page) : light;
    /*
     * **A fixed 14% is not a step on every colour.** It is a readable one on a dark or muted page,
     * but 14% of the way from `#ff375f` to white is `#ff5275` — **1.10:1** against the page it is
     * meant to sit on, so the cards, the sidebar and the page drew as one flat pink field and the
     * hierarchy disappeared (seen in the round that reviewed the palette on a vivid page). The same
     * mix is now the *start*, and the tier is lifted until it is a step that can be seen (cards
     * **1.22:1**, the panel tier off them **1.45:1** above the page), leaving every colour that
     * already reached those numbers exactly where it was.
     */
    const liftTo = (start: number, target: number) => {
      let colour = mix(page, towards, start);
      for (let extra = 0.02; extra <= 0.6 && contrast(page, colour) < target; extra += 0.02) {
        colour = mix(page, towards, Math.min(1, start + extra));
      }
      return colour;
    };
    /*
     * **A card step may not cost the ink that sits on it.**
     *
     * The lift is what makes a card visible off a vivid page, and it was free to run until the step
     * was 1.22:1 — on `#1B4D3E` that landed at rgb(90,126,115), where the page's own light ink
     * measured **4.35:1**: a card you can see and cannot read. Since the page is now painted
     * exactly as chosen, the step is the only thing that can move, so it gives way: a smaller step
     * that still carries the ink wins over a bigger one that does not.
     */
    const ink = inkFor(page);
    const keepInk = (colour: Rgb) => {
      let out = colour;
      for (let back = 0; back <= 0.8 && contrast(out, ink) < 4.8; back += 0.04) {
        out = mix(colour, page, back);
      }
      return out;
    };
    return { card: keepInk(liftTo(0.14, 1.22)), alt: keepInk(liftTo(0.28, 1.45)) };
  };
  const assess = (page: Rgb) => {
    const { card, alt } = stepsFor(page);
    const ink = inkFor(page);
    const worst = [page, card, alt].reduce((a, b) => (contrast(b, ink) < contrast(a, ink) ? b : a));
    return { ink, worst, card, alt, ok: contrast(worst, ink) >= 4.8 };
  };
  const finish = (page: Rgb) => {
    const { ink, worst, card, alt } = assess(page);
    return { page, card, alt, ink, worst, inkIsLight: contrast(page, light) > contrast(page, dark) };
  };
  /*
   * **The page is the colour the traveller chose; only the cards are allowed to move.**
   *
   * This used to require 4.8:1 on the *worst* of the page and both card tiers, so a colour that was
   * perfectly readable on the page but tight on a lighter card was darkened to fix the card — and
   * `#1B4D3E`, the very hex the traveller typed into *Match colours*, came out painted as
   * `rgb(23, 64, 52)` while the row above it said `#1B4D3E` (reported twice: "a hex that is shown
   * but not painted is a lie"). The ink on a surface is derived from that surface
   * (`inkRamp(worst)`), so a card tier that needs a softer ink gets one; the page has no such
   * escape, so it is measured on its own and left exactly as chosen whenever an ink can be read on
   * it. Only a true mid-tone — where neither of the app's inks clears the line — is moved, and then
   * in lightness alone.
   */
  if (contrast(tint, inkFor(tint)) >= 4.8) return finish(tint);
  const lighten = darkInkWins(tint);
  const hsl = rgbToHsl(tint);
  for (let step = 1; step <= 24; step += 1) {
    const t = step / 24;
    const l = lighten ? hsl.l + (1 - hsl.l) * t : hsl.l * (1 - t);
    const candidate = hslToRgb({ ...hsl, l });
    if (assess(candidate).ok) return finish(candidate);
  }
  return finish(tint);
}

/** WCAG relative luminance, for the one decision the steps need (is this page near white?). */
function luminanceOf([r, g, b]: Rgb): number {
  const channel = (value: number) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/**
 * A hairline for a surface: the ink softened toward it until it is clearly visible.
 *
 * 1.5:1 rather than the 1.2:1 of the cream theme's own `#e8e6df`, because a border is the *only*
 * cue that an outlined chip or field is a control, and on a mid-tone tint a 1.2:1 line is simply
 * not there. It is deliberately not 3:1: WCAG's non-text minimum is about identifying a component,
 * and these controls also carry a fill and a label; a 3:1 hairline around every button is a
 * different interface (hard grey outlines), not a repaired one. The measured value is in
 * `USER-FIXES.md`, and every tint is above the floor.
 */
function borderFor(ink: Rgb, surface: Rgb, target = 1.5): Rgb {
  return soften(ink, surface, target);
}

/**
 * The edge raised contrast draws, against the 1.5:1 the tint normally settles for.
 *
 * A hairline is the only cue that an outlined chip, field or card is a thing at all, so "raised"
 * has to be a line you can find rather than a nudge. It is **3:1** — WCAG's non-text minimum, the
 * same floor the app holds a ring or an icon to — because a step the traveller cannot see is the
 * exact defect being repaired. (2.6:1 was measured and read as a nudge, which it was.)
 */
const RAISED_EDGE = 3;

/**
 * The ink ramp for a surface: the winning ink, then its three softer steps.
 *
 * **Two ramps, because raised contrast used to vanish here.** The tinted palette derives its own
 * inks, and those properties land on `:root` from `styles/components.css`, which is imported after
 * `tokens.css` — so `:root[data-surface='tint']` beat `:root[data-contrast='high']` on source order
 * and the switch did nothing at all once a page colour was chosen. It was worse than nothing: the
 * *unraised* tinted ramp went straight to the maximum-contrast ink, so a tinted page already looked
 * like raised contrast while the switch said off. Both halves are fixed here, by deriving the ramp
 * from the setting rather than colouring over it:
 *
 *   default — body ink at **10:1** (the cream theme's own `#3f3f45` measures 9.9:1), muted 5.4:1,
 *             faint 4.8:1, hairline 1.5:1 — the calm interface;
 *   raised  — body ink at the *maximum* the surface allows, muted 7.5:1, faint 6:1, hairline 2.6:1
 *             — the step a traveller asks for when they ask for it.
 */
function inkRamp(surface: Rgb, raised = false): {
  strong: string;
  ink: string;
  muted: string;
  faint: string;
  light: boolean;
} {
  const { dark, light } = inkEnds();
  const useLight = !darkInkWins(surface);
  const base = useLight ? light : dark;
  /*
   * Raised goes to the **extreme** ink, not to "a bit darker than base". The first version moved
   * #3f3f45 to #18181b — a real change on paper and almost nothing on a screen, which is what
   * "the raised contrast issue is NOT fixed" was about. Pure black (or pure white on a dark
   * surface) against the calm 10:1 default is a step nobody can miss.
   */
  const extreme: Rgb = useLight ? [255, 255, 255] : [0, 0, 0];
  const ink = raised ? extreme : soften(base, surface, 10);
  const muted = soften(base, surface, raised ? 7.5 : 5.4);
  const faint = soften(base, surface, raised ? 6 : 4.8);
  return {
    strong: toHex(raised ? extreme : base),
    ink: toHex(ink),
    muted: toHex(muted),
    faint: toHex(faint),
    light: useLight,
  };
}

/**
 * A semantic ink (a delay's coral, a "cleared" sage, a butter mark) re-read against the card.
 *
 * Those inks mean something and keep their hue, but their lightness was chosen for the theme's own
 * surface: the coral that reads on cream is 2.2:1 on a blue widget. Only the lightness moves, in the
 * direction that raises the contrast, so a delay is still coral on every tint — just a coral that
 * can be read.
 */
function semanticInk(base: Rgb, surface: Rgb, target = 4.6): Rgb {
  if (contrast(base, surface) >= target) return base;
  const lighten = !darkInkWins(surface);
  const hsl = rgbToHsl(base);
  for (let step = 1; step <= 24; step += 1) {
    const t = step / 24;
    const l = lighten ? hsl.l + (1 - hsl.l) * t : hsl.l * (1 - t);
    const candidate = hslToRgb({ ...hsl, l });
    if (contrast(candidate, surface) >= target) return candidate;
  }
  const { dark, light } = inkEnds();
  return contrast(surface, dark) >= contrast(surface, light) ? dark : light;
}

function rgbToHsl([r, g, b]: Rgb): { h: number; s: number; l: number } {
  const channels = [r / 255, g / 255, b / 255];
  const max = Math.max(...channels);
  const min = Math.min(...channels);
  const delta = max - min;
  const l = (max + min) / 2;
  let h = 0;
  if (delta !== 0) {
    if (max === channels[0]) h = ((channels[1] - channels[2]) / delta) % 6;
    else if (max === channels[1]) h = (channels[2] - channels[0]) / delta + 2;
    else h = (channels[0] - channels[1]) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = delta === 0 || l === 0 || l === 1 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  return { h, s: Number.isFinite(s) ? s : 0, l };
}

function hslToRgb({ h, s, l }: { h: number; s: number; l: number }): Rgb {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

/**
 * How dark a chosen colour may be and still keep the dock's active pill exactly as it was picked.
 *
 * The dock is obsidian in every appearance, so a colour's lightness has to be measured against
 * near-black rather than against the page. The pill used to be *always* lifted to 3:1 on that
 * ground, which meant a bright coral arrived as a coral nobody had chosen. The rule now is the
 * traveller's: the exact hex, untouched, until it is too close to the dock to be seen at all —
 * black, navy, a deep bottle green — where it is lightened only as far as the app's 3:1 non-text
 * floor, one step at a time, keeping the hue and saturation. **2.5:1** is the threshold: above it
 * a fill is a shape you can find on the dock (the app's own coral is 7.1:1, a mid blue 4.3:1, a
 * deep navy 1.4:1), below it the pill would be a slightly darker black on a black bar.
 */
const DOCK_PILL_MIN = 2.5;

/**
 * The accent for a surface: the tint's own hue, with its lightness moved until it clears 3:1.
 *
 * Mixing toward black or white would grey the colour out — a yellow tint would arrive as olive.
 * Moving lightness in HSL keeps the hue and saturation the traveller chose, which is what makes
 * the dock's active entry and the focus ring still read as *their* colour rather than as a
 * different one. 3:1 is the non-text minimum the app audits for an icon or a ring.
 */
function accentOn(source: Rgb, against: Rgb): Rgb {
  const hsl = rgbToHsl(source);
  /* Move away from the surface it has to be seen on: darker on a light one, lighter on a dark one. */
  const lighten = !darkInkWins(against);
  let candidate = hslToRgb(hsl);
  for (let step = 1; step <= 24; step += 1) {
    const l = lighten
      ? Math.min(1, hsl.l + (1 - hsl.l) * (step / 16))
      : Math.max(0, hsl.l - hsl.l * (step / 16));
    candidate = hslToRgb({ ...hsl, l });
    if (contrast(candidate, against) >= 3.05) return candidate;
  }
  return candidate;
}

/** Every colour one chosen tint produces, read against the appearance in force. */
export function paintFor(colour: string, raised = false): TintPaint {
  const tint = parseColor(colour) ?? ([223, 232, 242] as Rgb);
  const canvas = parseColor(tokenValue('--canvas-base')) ?? ([252, 251, 250] as Rgb);
  const pageInk = parseColor(tokenValue('--ink')) ?? ([63, 63, 69] as Rgb);
  const mapLand = parseColor(tokenValue('--map-land')) ?? parseColor(tokenValue('--surface-alt')) ?? canvas;

  /*
   * The page, the card and the panel, then the ramps off the hardest of the three. The accent is
   * measured against the panel for the same reason; the map keeps its own cut, measured against the
   * map's land.
   */
  /*
   * **Every surface keeps its own step, matched palette or not.**
   *
   * The matched state used to paint the page, the cards and the panels all with the one HEX. On a
   * real screen that is a page with no edges: a card is only a card because its fill differs from
   * the ground, so the only thing left to draw the boundary was the hairline — measured at the
   * 1.5:1 floor and reported as *"some colours, some edges get super ugly and way too obvious"*.
   * Matching is three **settings**, not one flat pixel: the page is the colour exactly, and the
   * cards and panels are the steps off it they have always been.
   */
  const tiers = tintTiers(tint);
  const page = tiers.page;
  const card = tiers.card;
  const cardAlt = tiers.alt;
  const worst = tiers.worst;
  const inkIsLight = tiers.inkIsLight;
  const ramp = inkRamp(worst, raised);
  const cardInk = parseColor(ramp.ink) ?? pageInk;
  /*
   * **The accent has to be seen on the page and on both card tiers**, not on the panel alone.
   *
   * It was cut against `cardAlt`, the darkest of the three, and drawn everywhere: on the page (the
   * focus ring), on the card (a switch, a mark, the empty state's glyph) and on a panel. A pink page
   * measured the empty-state glyph at **2.78:1** on the card — the non-text floor is 3:1 — because
   * the cut was measured on the tier below the one it was painted on. Asking `accentAcross` for a
   * cut that clears all three is what the split palette already did for its two surfaces.
   */
  const accent = accentAcross(tint, [page, card, cardAlt]);
  /*
   * **The fill behind a label is the traveller's colour; the ring's cut is a different promise.**
   *
   * The accent is the same hue with its lightness moved until it clears 3:1, and that cut was used
   * *behind text* — the alert count, the nav badge, an accent button. Black asked for as the
   * primary colour has no mark that clears 3:1 on a black page, so the cut came out grey: a grey
   * pill on a cream header where the traveller had chosen black and could see no trace of it
   * (reported, with the screenshot of the count beside the alert triangle). A fill only has to
   * carry its label, so it is the colour itself, moved only when nothing readable could sit on it.
   */
  const accentFill = buttonPaint(tint);
  const mapAccent = accentOn(tint, mapLand);
  /*
   * The dock is obsidian in every mode, so its active pill is measured against *that* — and then
   * left alone unless it is too dark to find (see `DOCK_PILL_MIN`).
   */
  const dockDark = inkEnds().dark;
  const dockAccent = contrast(tint, dockDark) >= DOCK_PILL_MIN ? tint : accentOn(tint, dockDark);
  const dockInk = inkRamp(dockAccent);
  const coralBase = parseColor(tokenValue('--coral-ink')) ?? ([143, 52, 35] as Rgb);
  const sageBase = parseColor(tokenValue('--tint-sage-ink')) ?? ([90, 122, 88] as Rgb);
  const butterBase = parseColor(tokenValue('--tint-butter-ink')) ?? ([201, 162, 39] as Rgb);

  const nav = mix(page, card, 0.34);
  return {
    page: toHex(page),
    card: toHex(card),
    cardAlt: toHex(cardAlt),
    nav: toHex(nav),
    navAlt: toHex(mix(nav, card, 0.5)),
    navBorder: toHex(borderFor(cardInk, nav, raised ? RAISED_EDGE : 1.5)),
    inkStrong: ramp.strong,
    ink: ramp.ink,
    inkMuted: ramp.muted,
    inkFaint: ramp.faint,
    inkIsLight,
    /* The hairline is drawn on the **card**, so it is measured there: with a real step between the
       tiers, a border cut against the panel arrived at 1.26:1 on the surface it sits on. */
    border: toHex(borderFor(cardInk, card, raised ? RAISED_EDGE : 1.5)),
    pageBorder: toHex(borderFor(cardInk, page, raised ? RAISED_EDGE : 1.5)),
    accent: toHex(accent),
    accentFill: accentFill.bg,
    accentBorder: toHex(mix(accent, tint, 0.18)),
    accentHover: toHex(mix(accent, cardInk, 0.12)),
    mapAccent: toHex(mapAccent),
    dockAccent: toHex(dockAccent),
    onDockAccent: dockInk.ink,
    onAccent: accentFill.ink,
    coralInk: toHex(semanticInk(coralBase, worst, raised ? 6 : 4.6)),
    sageInk: toHex(semanticInk(sageBase, worst, raised ? 6 : 4.6)),
    butterInk: toHex(semanticInk(butterBase, worst, raised ? 6 : 4.6)),
  };
}

/**
 * One button colour, made readable.
 *
 * The traveller picks the fill; the label is *derived*, not offered — the same rule the tint
 * palette follows. A mid-tone that has no readable ink (iOS blue is 4.3:1 under black) is moved in
 * **lightness only**, away from the ink, until the label clears 4.5:1; a colour that already clears
 * it is used exactly as chosen, which is what "pick one colour for every button" should mean.
 */
export function buttonPaintFor(colour: string): {
  bg: string;
  border: string;
  hover: string;
  ink: string;
  /** WCAG ratio between the label and the fill, so a preview can state what it measured. */
  ratio: number;
  /** True when the label had to be the light cut. */
  light: boolean;
} {
  return buttonPaint(parseColor(colour) ?? inkEnds().dark);
}

function buttonPaint(colour: Rgb): {
  bg: string;
  border: string;
  hover: string;
  ink: string;
  ratio: number;
  light: boolean;
} {
  const { dark, light } = inkEnds();
  const inkFor = (surface: Rgb) => (contrast(surface, light) >= contrast(surface, dark) ? light : dark);
  let base = colour;
  let ink = inkFor(base);
  if (contrast(base, ink) < 4.5) {
    const hsl = rgbToHsl(base);
    /* Move the fill away from the ink it is carrying: dark ink wants a lighter fill. */
    const lift = ink === dark;
    for (let step = 1; step <= 24; step += 1) {
      const t = step / 24;
      const l = lift ? Math.min(1, hsl.l + (1 - hsl.l) * t) : Math.max(0, hsl.l * (1 - t));
      const candidate = hslToRgb({ ...hsl, l });
      const candidateInk = inkFor(candidate);
      if (contrast(candidate, candidateInk) >= 4.6) {
        base = candidate;
        ink = candidateInk;
        break;
      }
    }
  }
  return {
    bg: toHex(base),
    /* The edge and the hover are steps off the fill toward its own ink, so they belong to the
       colour rather than to a second one. */
    border: toHex(mix(base, ink, 0.28)),
    hover: toHex(mix(base, ink, 0.14)),
    ink: toHex(ink),
    ratio: contrast(base, ink),
    light: ink === light,
  };
}

/** The properties this module owns, so a mode change can put every one of them back. */
const DYNAMIC_PROPERTIES = [
  '--app-bg-colour',
  '--app-bg-image',
  '--card-surface',
  '--card-surface-alt',
  '--nav-surface',
  '--nav-surface-alt',
  '--nav-border',
  '--card-border',
  '--page-border',
  '--card-ink',
  '--card-ink-strong',
  '--card-ink-muted',
  '--card-ink-faint',
  '--accent-primary',
  '--accent-fill',
  '--accent-primary-border',
  '--accent-primary-hover',
  '--accent-primary-ink',
  '--on-accent',
  '--map-accent',
  '--accent-on-dock',
  '--on-dock-accent',
  '--card-coral-ink',
  '--card-sage-ink',
  '--card-butter-ink',
  /* The page's own ramp, which only a split palette needs (see `applyBackground`). */
  '--page-surface',
  '--page-surface-alt',
  '--page-ink',
  '--page-ink-strong',
  '--page-ink-muted',
  '--page-ink-faint',
  /* The widgets' cut of the accent and its fill, which a split palette hands to the cards. */
  '--card-accent',
  '--card-accent-fill',
  '--card-accent-border',
  '--card-accent-hover',
  '--card-accent-ink',
  '--card-on-accent',
  /* Match colours: every button, and the chrome the page's colour is carried into. */
  '--btn-bg',
  '--btn-bg-hover',
  '--btn-border',
  '--btn-ink',
  '--chrome-surface',
  '--chrome-surface-alt',
  '--chrome-border',
  '--chrome-ink',
  '--chrome-ink-strong',
  '--chrome-ink-muted',
  '--chrome-ink-faint',
];

/**
 * The accent cut that has to be seen on **two** surfaces rather than one.
 *
 * A one-colour palette measures its accent against one surface and that is the whole question: the
 * accent draws inside the widgets and nowhere else the traveller reads. A split palette draws it on
 * cards *and* on the page, and each of those is two surfaces — the ground and the step above it —
 * so a cut that clears the one it was measured against can arrive dim on the other (measured: green
 * widgets under a blue page put the widgets' cut at **2.66:1** on the page's ground). Every surface
 * a cut will be drawn on is offered here; the candidate that clears 3:1 on all of them best wins.
 */
function accentAcross(colour: Rgb, surfaces: Rgb[]): Rgb {
  const candidates = surfaces.map((surface) => accentOn(colour, surface));
  const score = (candidate: Rgb) =>
    Math.min(...surfaces.map((surface) => contrast(candidate, surface)));
  return candidates.reduce((best, candidate) => (score(candidate) > score(best) ? candidate : best));
}

/**
 * Paint the choices: one attribute for the page's mode, one for the cards', and the derived
 * palette in custom properties.
 *
 * Attributes rather than classes, because the stylesheet has to know *which shape* a mode is —
 * a photo is a layer under a wash, glass is a card that blurs what is behind it — and a property
 * for every value, because the tint can be any hex the picker hands over and cannot be
 * enumerated in a stylesheet. Cream removes every derived property, so the canvas and the cards
 * return to the tokens `tokens.css` declares rather than to a copy of them kept here. Called
 * again on every appearance change, since the same tint has a different readable ink, cards and
 * accent in dark.
 */
export function applyBackground(settings: BackgroundSettings): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  /*
   * The page's own colour exists in `colour` mode only: on cream the page is the app's canvas, and
   * over a photo the page is the picture.
   */
  const pageChoice = settings.background === 'colour' ? settings.backgroundColour.trim() : '';
  const chosenPrimary = settings.primaryColour.trim();
  /*
   * **Following the background means the page's colour, or nothing at all.**
   *
   * The rule is one sentence and it used to take three: `chosenPrimary || pageChoice || (photo ?
   * backgroundColour : '')`. That last fallback painted the widgets with a colour that was nowhere on
   * screen — the page colour remembered from before the photo was chosen — so a photograph with
   * **Follow the background** selected drew blue widgets for a reason nobody could see (reported as
   * "why doesn't cream give me cream? the primary colour just overrides it"). A photo has no colour
   * of its own, so following it now paints nothing and the app's own surfaces and coral stand; a
   * cream page has no colour either, and a colour page follows itself. One meaning per mode.
   */
  const primaryChoice = chosenPrimary || pageChoice;
  /*
   * **Glass needs something to be glass over.** With Photo selected but no picture chosen yet,
   * the attribute used to be set anyway: the cards became a 58% cream pane over the cream canvas,
   * with a white hairline on it, so the card surface *and its rounded corners* vanished and the
   * section read as a flat list (reported: "corners must never be deleted, no matter what my
   * settings are"). No picture means no glass — the app's own cards stand until there is one.
   */
  const glass =
    settings.background === 'photo' &&
    settings.cardTreatment === 'glass' &&
    Boolean(settings.backgroundImage);

  root.dataset.background = settings.background;
  for (const property of DYNAMIC_PROPERTIES) root.style.removeProperty(property);
  delete root.dataset.surface;
  delete root.dataset.cardInk;
  delete root.dataset.buttons;
  delete root.dataset.chrome;

  /*
   * Glass is a property of the *page*, not of a colour. Set before the early return below so a
   * photograph with **Follow the background** — which now paints no colour at all — still gets the
   * translucent cards it asked for.
   */
  if (glass) root.dataset.surface = 'glass';

  if (settings.background === 'photo' && settings.backgroundImage) {
    root.style.setProperty('--app-bg-image', `url("${settings.backgroundImage}")`);
    /*
     * The crop's own centre, so the subject the traveller framed stays in view when another screen
     * re-crops the baked image with `cover` — a desktop's 16:9 crop on a 9:16 phone, for instance.
     * No crop means no movement: the whole picture is centred, as it always was.
     */
    if (settings.backgroundCrop) {
      const focus = cropFocus(settings.backgroundCrop);
      root.style.setProperty('--app-bg-position', `${focus.x}% ${focus.y}%`);
    } else {
      root.style.removeProperty('--app-bg-position');
    }
  }

  /* Neither colour is in force: the app's own page, surfaces and coral, untouched. */
  if (!pageChoice && !primaryChoice) return;

  const raised = Boolean(settings.highContrast);
  /*
   * **One exact HEX, three slots** — the state *Match colours* writes. While it holds, the palette
   * is flat: the page, the cards, the panels and the buttons are the colour itself (no page
   * lightening, no card step), because the traveller asked for one value and the pixel has to be
   * that value. Any of the three drifting apart ends the flat state again.
   */
  const pagePaint = pageChoice ? paintFor(pageChoice, raised) : null;
  const widgetPaint = primaryChoice ? paintFor(primaryChoice, raised) : null;
  /*
   * **The page's colour follows the traveller into the pop-ups.** A dialog, a sheet and the two
   * full-screen pickers used to be painted from the cream theme on every background, so the colour
   * somebody chose disappeared the moment anything opened over it. They now take the page's own card
   * tier and its measured ink ramp — the same values the cards beside the page use, so every pixel
   * of the overlay is a surface the palette already proved readable. Cream and photo keep the
   * theme's own surfaces: there is either no colour to carry or a picture that does that job.
   */
  if (pagePaint) {
    root.dataset.chrome = 'page';
    root.style.setProperty('--chrome-surface', pagePaint.card);
    root.style.setProperty('--chrome-surface-alt', pagePaint.cardAlt);
    root.style.setProperty('--chrome-border', pagePaint.border);
    root.style.setProperty('--chrome-ink', pagePaint.ink);
    root.style.setProperty('--chrome-ink-strong', pagePaint.inkStrong);
    root.style.setProperty('--chrome-ink-muted', pagePaint.inkMuted);
    root.style.setProperty('--chrome-ink-faint', pagePaint.inkFaint);
  }
  const pagePainting = pagePaint as TintPaint;
  /* One of the two always exists: `primaryChoice` follows `pageChoice` when it is not chosen. */
  const paint = widgetPaint ?? pagePainting;
  const primaryRgb = parseColor(primaryChoice) ?? ([223, 232, 242] as Rgb);
  /*
   * `split` is the one new shape in this model: the page keeps its own colour **and** its own ink
   * while the widgets take a different colour. When the two choices are equal — the default "follow
   * the background" included — nothing splits and the palette is the single colour's, as before.
   */
  const split =
    Boolean(pagePaint) &&
    Boolean(widgetPaint) &&
    primaryChoice.toLowerCase() !== pageChoice.toLowerCase();

  if (settings.background === 'colour' && pagePaint) {
    root.style.setProperty('--app-bg-colour', pagePaint.page);
  }

  /*
   * The accent is the traveller's in every mode, including glass — it draws the active entry, the
   * ring, the switch track and the map. Only the card *surface* waits for the treatment.
   *
   * **A split palette keeps two cuts of it, because it is drawn on two surfaces.**
   * `--accent-primary` is the page's cut, which answers to the page's ground and the step above it;
   * the widgets' cut is handed over as `--card-accent`, and the split rule in
   * `styles/components.css` applies that inside cards, panels and the sidebar. One cut for both was
   * measured at **2.66:1** on a blue page under green widgets — under the 3:1 this app holds a ring
   * to — and the answer is two cuts rather than a compromise that is dim on both. A one-colour
   * palette has one surface to answer to, which is what `paintFor` already did, unchanged.
   */
  const splitAccent = split
    ? accentAcross(primaryRgb, [
        parseColor(pagePainting.page) ?? primaryRgb,
        parseColor(pagePainting.card) ?? primaryRgb,
      ])
    : null;
  const splitCardAccent = split
    ? accentAcross(primaryRgb, [
        parseColor(paint.card) ?? primaryRgb,
        parseColor(paint.cardAlt) ?? primaryRgb,
      ])
    : null;
  const accent = splitAccent ? toHex(splitAccent) : paint.accent;

  root.style.setProperty('--accent-primary', accent);
  // (the matched palette's flat surfaces are written below, with the other card properties)
  /*
   * **A filled control's label and its fill are one colour's pair, or the label is not there.**
   *
   * In a split palette the fill used to be taken from the widgets' colour ("the one its cards
   * wear") while the label was the ink chosen for the accent's own cut. Those are two different
   * colours, so with a periwinkle page and an ivory card colour the alert count in the header came
   * out as an ivory pill holding ivory digits — measured **1.00:1**, a badge with no number in it
   * (reported from the traveller's own screenshot). Both halves now come from the accent's cut
   * across the page and the cards, which is the colour these controls are actually painted with,
   * and `buttonPaint` has already chosen and measured the label against that same fill.
   */
  const splitButton = splitAccent ? buttonPaint(splitAccent) : null;
  root.style.setProperty('--accent-fill', splitButton ? splitButton.bg : paint.accentFill);
  root.style.setProperty(
    '--accent-primary-border',
    splitAccent ? toHex(mix(splitAccent, primaryRgb, 0.18)) : paint.accentBorder,
  );
  root.style.setProperty(
    '--accent-primary-hover',
    splitAccent
      ? toHex(mix(splitAccent, parseColor(paint.ink) ?? primaryRgb, 0.12))
      : paint.accentHover,
  );
  root.style.setProperty('--accent-primary-ink', accent);
  root.style.setProperty('--on-accent', splitButton ? splitButton.ink : paint.onAccent);

  if (splitCardAccent) {
    root.style.setProperty('--card-accent', toHex(splitCardAccent));
    root.style.setProperty('--card-accent-border', toHex(mix(splitCardAccent, primaryRgb, 0.18)));
    root.style.setProperty(
      '--card-accent-hover',
      toHex(mix(splitCardAccent, parseColor(paint.ink) ?? primaryRgb, 0.12)),
    );
    root.style.setProperty('--card-accent-ink', toHex(splitCardAccent));
    /* The in-card accent has the same two cuts: the ring's and the label's — and, as above, the
       label is chosen for the fill it is actually drawn on, not for a second colour. */
    const splitCardButton = buttonPaint(splitCardAccent);
    root.style.setProperty('--card-accent-fill', splitCardButton.bg);
    root.style.setProperty('--card-on-accent', splitCardButton.ink);
  }
  root.style.setProperty('--map-accent', paint.mapAccent);
  root.style.setProperty('--accent-on-dock', paint.dockAccent);
  root.style.setProperty('--on-dock-accent', paint.onDockAccent);

  if (glass) return;

  /* The page's own ramp, which only the split shape reads — see `[data-surface='split']` in
     `styles/components.css`. A one-colour palette replaces these with the cards' own values. */
  if (split && pagePaint) {
    root.style.setProperty('--page-surface', pagePaint.card);
    root.style.setProperty('--page-surface-alt', pagePaint.cardAlt);
    root.style.setProperty('--page-ink', pagePaint.ink);
    root.style.setProperty('--page-ink-strong', pagePaint.inkStrong);
    root.style.setProperty('--page-ink-muted', pagePaint.inkMuted);
    root.style.setProperty('--page-ink-faint', pagePaint.inkFaint);
  }

  /*
   * Three shapes of the same palette, and the difference is *what the page is*:
   *
   *   • `tint` — the page is the colour and the widgets follow it, so the ramp replaces the page's
   *     own ink as well;
   *   • `cards` — the page is a photograph (or the app's cream), so the page keeps the theme's ink
   *     and only the cards, the panels and the sidebar take the widgets' colour. Scoping the ramp to
   *     the root there would put dark text on a dark photograph, which the contrast sweep caught on
   *     the first run;
   *   • `split` — the page is the colour and the widgets are another, so the page takes its own ramp
   *     (above) and the cards take theirs (below).
   */
  root.dataset.surface = split ? 'split' : pagePaint ? 'tint' : 'cards';
  root.dataset.cardInk = paint.inkIsLight ? 'light' : 'dark';
  root.style.setProperty('--card-border', paint.border);
  root.style.setProperty('--page-border', paint.pageBorder);
  root.style.setProperty('--card-coral-ink', paint.coralInk);
  root.style.setProperty('--card-sage-ink', paint.sageInk);
  root.style.setProperty('--card-butter-ink', paint.butterInk);
  root.style.setProperty('--card-surface', paint.card);
  root.style.setProperty('--card-surface-alt', paint.cardAlt);
  root.style.setProperty('--nav-surface', paint.nav);
  root.style.setProperty('--nav-surface-alt', paint.navAlt);
  root.style.setProperty('--nav-border', paint.navBorder);
  root.style.setProperty('--card-ink', paint.ink);
  root.style.setProperty('--card-ink-strong', paint.inkStrong);
  root.style.setProperty('--card-ink-muted', paint.inkMuted);
  root.style.setProperty('--card-ink-faint', paint.inkFaint);
}

/**
 * Read a file into a bounded JPEG data URL.
 *
 * Resized on a canvas rather than stored raw (see the file's note): a 1600px long edge is more than
 * any card, dock or page edge this app draws, and it is the difference between a background a phone
 * can keep and one that fills the storage the rest of the settings live in. `createImageBitmap` is
 * used when it exists and an `<img>` otherwise — the same decode, one API older.
 *
 * Rejects with a sentence rather than an error code: the card shows what went wrong, and the only
 * two things that can go wrong are the file not being an image and the file being too large.
 */
export async function readImageFile(
  file: File,
  maxEdge = BACKGROUND_IMAGE_MAX_EDGE,
): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('That file is not an image.');
  if (file.size > BACKGROUND_IMAGE_MAX_BYTES) throw new Error('That image is too large. Try one under 12 MB.');
  const bitmap = await decode(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('This browser cannot resize an image.');
  context.drawImage(bitmap, 0, 0, width, height);
  if ('close' in bitmap && typeof bitmap.close === 'function') bitmap.close();
  return canvas.toDataURL('image/jpeg', 0.82);
}

interface Decoded {
  width: number;
  height: number;
  close?: () => void;
}

async function decode(file: File): Promise<Decoded & CanvasImageSource> {
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(file);
    return bitmap as ImageBitmap;
  }
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('That image could not be read.'));
      image.src = url;
    });
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}
