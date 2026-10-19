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
  /** The accent: the tint's hue, moved in lightness until it clears 3:1 on the card. */
  accent: string;
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
    return { card: mix(page, towards, 0.14), alt: mix(page, towards, 0.28) };
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
  if (assess(tint).ok) return finish(tint);
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
function borderFor(ink: Rgb, surface: Rgb): Rgb {
  return soften(ink, surface, 1.5);
}

/** The ink ramp for a surface: the winning ink, then its three softer steps. */
function inkRamp(surface: Rgb): {
  strong: string;
  ink: string;
  muted: string;
  faint: string;
  light: boolean;
} {
  const { dark, light } = inkEnds();
  const useLight = !darkInkWins(surface);
  const base = useLight ? light : dark;
  const muted = soften(base, surface, 6);
  const faint = soften(base, surface, 4.6);
  return {
    strong: toHex(base),
    ink: toHex(base),
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
export function paintFor(colour: string): TintPaint {
  const tint = parseColor(colour) ?? ([223, 232, 242] as Rgb);
  const canvas = parseColor(tokenValue('--canvas-base')) ?? ([252, 251, 250] as Rgb);
  const pageInk = parseColor(tokenValue('--ink')) ?? ([63, 63, 69] as Rgb);
  const mapLand = parseColor(tokenValue('--map-land')) ?? parseColor(tokenValue('--surface-alt')) ?? canvas;

  /*
   * The page, the card and the panel, then the ramps off the hardest of the three. The accent is
   * measured against the panel for the same reason; the map keeps its own cut, measured against the
   * map's land.
   */
  const { page, card, alt: cardAlt, worst, inkIsLight } = tintTiers(tint);
  const ramp = inkRamp(worst);
  const cardInk = parseColor(ramp.ink) ?? pageInk;
  const accent = accentOn(tint, cardAlt);
  const accentInk = inkRamp(accent);
  const mapAccent = accentOn(tint, mapLand);
  /* The dock is obsidian in every mode, so its active pill needs a cut measured against *that*. */
  const dockAccent = accentOn(tint, inkEnds().dark);
  const dockInk = inkRamp(dockAccent);
  const coralBase = parseColor(tokenValue('--coral-ink')) ?? ([143, 52, 35] as Rgb);
  const sageBase = parseColor(tokenValue('--tint-sage-ink')) ?? ([90, 122, 88] as Rgb);
  const butterBase = parseColor(tokenValue('--tint-butter-ink')) ?? ([201, 162, 39] as Rgb);

  return {
    page: toHex(page),
    card: toHex(card),
    cardAlt: toHex(cardAlt),
    inkStrong: ramp.strong,
    ink: ramp.ink,
    inkMuted: ramp.muted,
    inkFaint: ramp.faint,
    inkIsLight,
    border: toHex(borderFor(cardInk, cardAlt)),
    pageBorder: toHex(borderFor(cardInk, page)),
    accent: toHex(accent),
    accentBorder: toHex(mix(accent, tint, 0.18)),
    accentHover: toHex(mix(accent, cardInk, 0.12)),
    mapAccent: toHex(mapAccent),
    dockAccent: toHex(dockAccent),
    onDockAccent: dockInk.ink,
    onAccent: accentInk.ink,
    coralInk: toHex(semanticInk(coralBase, worst)),
    sageInk: toHex(semanticInk(sageBase, worst)),
    butterInk: toHex(semanticInk(butterBase, worst)),
  };
}

/** The properties this module owns, so a mode change can put every one of them back. */
const DYNAMIC_PROPERTIES = [
  '--app-bg-colour',
  '--app-bg-image',
  '--card-surface',
  '--card-surface-alt',
  '--card-border',
  '--page-border',
  '--card-ink',
  '--card-ink-strong',
  '--card-ink-muted',
  '--card-ink-faint',
  '--accent-primary',
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
  /* The widgets' cut of the accent, which a split palette hands to the cards (see above). */
  '--card-accent',
  '--card-accent-border',
  '--card-accent-hover',
  '--card-accent-ink',
  '--card-on-accent',
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

  const pagePaint = pageChoice ? paintFor(pageChoice) : null;
  const widgetPaint = primaryChoice ? paintFor(primaryChoice) : null;
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
  root.style.setProperty('--on-accent', splitAccent ? inkRamp(splitAccent).ink : paint.onAccent);

  if (splitCardAccent) {
    root.style.setProperty('--card-accent', toHex(splitCardAccent));
    root.style.setProperty('--card-accent-border', toHex(mix(splitCardAccent, primaryRgb, 0.18)));
    root.style.setProperty(
      '--card-accent-hover',
      toHex(mix(splitCardAccent, parseColor(paint.ink) ?? primaryRgb, 0.12)),
    );
    root.style.setProperty('--card-accent-ink', toHex(splitCardAccent));
    root.style.setProperty('--card-on-accent', inkRamp(splitCardAccent).ink);
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
  if (file.size > BACKGROUND_IMAGE_MAX_BYTES) throw new Error('That image is too large — try one under 12 MB.');
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
