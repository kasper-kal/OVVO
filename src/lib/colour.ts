/**
 * **The colour maths the Colour screen and the photo sampler share.**
 *
 * These conversions lived in `components/ui/ColorPicker.tsx` while the picker was a sheet. The
 * redesign (`COLOURS_PLAN.md`) turns that sheet into a full screen and gives the photograph its own
 * screen, so the maths moved out of the component: two screens and one library now read the same
 * functions rather than one importing the other.
 *
 * Nothing in here decides whether a colour is readable — the ink ramp in `lib/background.ts` does
 * that, and `inkFor` below asks it rather than re-deriving a second answer.
 */
import { paintFor } from './background';

export type Hsv = { h: number; s: number; v: number };

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** `#rrggbb` (or `#rgb`) to 0–360 / 0–1 / 0–1. Anything unreadable becomes black. */
export function hexToHsv(hex: string): Hsv {
  const channels = readHex(hex);
  if (!channels) return { h: 0, s: 0, v: 0 };
  const [r, g, b] = channels.map((channel) => channel / 255) as [number, number, number];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max === 0 ? 0 : delta / max, v: max };
}

/** 0–360 / 0–1 / 0–1 back to `#rrggbb`, lower case, so two colours compare as strings. */
export function hsvToHex({ h, s, v }: Hsv): string {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
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
  return (
    '#' +
    [r, g, b]
      .map((channel) => Math.round((channel + m) * 255).toString(16).padStart(2, '0'))
      .join('')
  );
}

/** Read a 3- or 6-digit hex into channels, or null if it is not a colour this app can hold. */
export function readHex(value: string): [number, number, number] | null {
  const text = value.trim().toLowerCase();
  const match = text.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/);
  if (!match) return null;
  const digits = match[1];
  const full =
    digits.length === 3
      ? digits
          .split('')
          .map((digit) => digit + digit)
          .join('')
      : digits;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

/** `#rrggbb` from three channels, lower case. */
export function toHex([r, g, b]: [number, number, number]): string {
  return '#' + [r, g, b].map((channel) => channel.toString(16).padStart(2, '0')).join('');
}

/** WCAG relative luminance of a `#rrggbb` colour. */
export function relativeLuminance(hex: string): number {
  const channels = readHex(hex) ?? [0, 0, 0];
  const channel = (value: number) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const [r, g, b] = channels.map(channel) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two `#rrggbb` colours, 1–21. */
export function contrastRatio(a: string, b: string): number {
  const [x, y] = [relativeLuminance(a), relativeLuminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

/**
 * **The ink this colour will actually get, and its measured ratio.**
 *
 * Asked of `lib/background.ts` rather than guessed: the Colour screen shows the consequence of a
 * choice ("a dark colour keeps its colour and gets light text"), and a screen that promised a
 * readable card the app then drew differently would be worse than no promise at all. A card is a
 * step off the colour, so the ratio is measured against the card, not against the colour itself.
 */
export function inkFor(colour: string): { ink: string; surface: string; ratio: number; light: boolean } {
  const paint = paintFor(colour);
  const ratio = contrastRatio(paint.ink, paint.card);
  return { ink: paint.ink, surface: paint.card, ratio, light: paint.inkIsLight };
}
