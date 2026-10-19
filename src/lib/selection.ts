/**
 * The colour selected text is painted with, and the ink that keeps it readable.
 *
 * Two things are being solved here, and only one of them is taste.
 *
 * **Which colour.** The traveller picks one of the palette's own five or their own: five because
 * every one of them is a colour the interface already uses (the palette's coral, butter, sage,
 * obsidian, running green), so a selection can never advertise a hue this app does not have — the
 * same rule the settings page's palette row follows. A named colour is the colour **its name
 * says**: coral resolves through `--palette-coral`, not through `--accent-primary`, because that
 * one is the traveller's tint once a background colour is in force and a chip labelled Coral that
 * paints blue is a lie (reported as exactly that).
 *
 * **Which ink on it.** A selection is *text on a colour*, so the second half is a contrast
 * question, not a preference: a pale custom colour under near-white ink is unreadable, and so is
 * obsidian on obsidian. `inkFor` measures the chosen colour against the app's two inks and picks
 * the one that wins, which is why a black custom colour gets light text without anyone being
 * asked a second question. It reports a **token** (`var(--on-dark)`) rather than a colour, so
 * the hex values stay in `tokens.css` where the design system keeps them — including under the
 * raised-contrast switch, which is free to strengthen an ink without this file knowing.
 *
 * The chosen colour is written to `<html>` as the two custom properties `tokens.css` declares
 * (`--selection-bg`, `--selection-ink`), so `::selection` — which is written once, in `base.css`
 * — needs no knowledge of this at all.
 */

export type SelectionChoice = 'coral' | 'butter' | 'sage' | 'obsidian' | 'green' | 'custom';

export interface SelectionSwatch {
  key: Exclude<SelectionChoice, 'custom'>;
  /** The row's word. Short: the swatch beside it is the colour, not the name. */
  label: string;
  /** The token the swatch *is*, so the row cannot pick a colour the app has no name for. */
  token: string;
}

/**
 * The five offered colours, in the order the palette itself uses them.
 *
 * The chip that offers one and the selection it produces both resolve *this* token, so the swatch
 * on screen and the colour behind the text cannot disagree — and none of the five is
 * `--accent-primary`, because the traveller's tint overwrites that one and a named colour must not
 * move with it.
 */
export const SELECTION_SWATCHES: SelectionSwatch[] = [
  { key: 'coral', label: 'Coral', token: '--palette-coral' },
  { key: 'butter', label: 'Butter', token: '--accent-secondary' },
  { key: 'sage', label: 'Sage', token: '--tint-sage' },
  { key: 'obsidian', label: 'Obsidian', token: '--struct-main' },
  { key: 'green', label: 'Green', token: '--active-green' },
];

/** The two inks the app owns, as tokens. One of them always clears 4.5:1 on any colour below. */
const INK_DARK = 'var(--struct-main)';
const INK_LIGHT = 'var(--on-dark)';

type Rgb = [number, number, number];

/**
 * Read a CSS colour into channels.
 *
 * Tokens are hex, and the traveller's own colour arrives from `ui/ColourScreen` as hex, so those
 * two are the real cases; `rgb()`/`rgba()` are accepted because a resolved custom property can
 * come back that way in some engines and a parser that only understood one of them would fail
 * silently and pick the wrong ink.
 */
export function parseColor(value: string): Rgb | null {
  const text = value.trim().toLowerCase();
  const hex = text.match(/^#([0-9a-f]{3,8})$/);
  if (hex) {
    const digits = hex[1];
    if (digits.length === 3 || digits.length === 4) {
      const [r, g, b] = digits.split('').map((digit) => parseInt(digit + digit, 16));
      return [r, g, b];
    }
    if (digits.length === 6 || digits.length === 8) {
      return [
        parseInt(digits.slice(0, 2), 16),
        parseInt(digits.slice(2, 4), 16),
        parseInt(digits.slice(4, 6), 16),
      ];
    }
    return null;
  }
  const rgb = text.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  return null;
}

/** WCAG relative luminance — the number contrast is actually computed from. */
export function luminance([r, g, b]: Rgb): number {
  const channel = (value: number) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG contrast ratio between two colours; 21:1 is black on white. */
export function contrast(a: Rgb, b: Rgb): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [light, dark] = la >= lb ? [la, lb] : [lb, la];
  return (light + 0.05) / (dark + 0.05);
}

function tokenValue(token: string): string {
  if (typeof document === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(token).trim();
}

/**
 * The ink for a given selection colour: whichever of the app's two is more readable on it.
 *
 * Reading the ink values out of the document rather than hard-coding them means the raised-contrast
 * switch and the dark appearance are both honoured — an ink that changes there changes here too.
 */
export function inkFor(background: string): string {
  const bg = parseColor(background);
  const dark = parseColor(tokenValue('--struct-main'));
  const light = parseColor(tokenValue('--on-dark'));
  if (!bg || !dark || !light) return INK_DARK;
  return contrast(bg, light) > contrast(bg, dark) ? INK_LIGHT : INK_DARK;
}

/**
 * The colour a choice actually resolves to, as a browser-ready CSS colour.
 *
 * A named choice resolves *through its token*, so it follows the appearance (a colour that is
 * re-declared in dark resolves there), and `custom` is the traveller's own value if it parses.
 * Returns `''` when nothing resolves — an impossible state on a loaded page, and one that must
 * not become a colour literal in this file: the caller simply leaves the property alone.
 */
export function selectionColor(choice: SelectionChoice, custom: string): string {
  if (choice === 'custom') {
    /*
     * A custom slot with no colour in it — the traveller pressed Custom and closed the device's
     * picker without choosing — falls back to the palette's first colour rather than to nothing.
     * "Custom, but not yet" must not turn the page's selection into the browser's default blue,
     * which is the one colour this app does not own.
     */
    return parseColor(custom) ? custom.trim() : tokenValue(SELECTION_SWATCHES[0].token);
  }
  const swatch = SELECTION_SWATCHES.find((entry) => entry.key === choice) ?? SELECTION_SWATCHES[0];
  return tokenValue(swatch.token);
}

/**
 * Paint the selection: two custom properties on `<html>`, the pair `tokens.css` declares.
 *
 * Inline properties, not a class or a stylesheet: the colour can be any value the device's colour
 * picker hands us, so it cannot be enumerated in a stylesheet, and the one place the selection is
 * *drawn* (`::selection` in `base.css`) stays the one place it is drawn.
 */
export function applySelection(choice: SelectionChoice, custom: string): void {
  if (typeof document === 'undefined') return;
  const background = selectionColor(choice, custom);
  const root = document.documentElement;
  if (!background) {
    root.style.removeProperty('--selection-bg');
    root.style.removeProperty('--selection-ink');
    return;
  }
  root.style.setProperty('--selection-bg', background);
  root.style.setProperty('--selection-ink', inkFor(background));
}
