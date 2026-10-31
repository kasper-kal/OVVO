#!/usr/bin/env node
/**
 * **The style gate.**
 *
 * Every style is a promise that a page looks finished and reads easily. `lib/styles.ts` authors
 * four colours per appearance and measures the rest, and this walks the same arithmetic over the
 * same tokens, so what it checks is what the app writes.
 *
 * It fails the build on:
 *   • text under **4.5:1** (body, strong, muted and faint ink on the page and the card, the label
 *     on an accent fill, the label on the dock's accent pill, the map's ink on its land)
 *   • marks under **3:1** (the focus ring on the card and the page, the accent fill on the card,
 *     the map's accent on its land)
 *   • a hairline under **1.2:1** on either surface it is drawn between
 *
 * **Three things this gate used to get wrong, all of them fixed here:**
 *
 *   1. It reduced the night with its own grey formula while the app tints the night from the page's
 *      hue. For Poppy Blue it audited `#212328` while the app drew `#11171c`, so a passing gate was
 *      a statement about a page nobody saw. `nightOf` below is now the app's own, depth included.
 *   2. It ignored `pinned`. Default's real colours are the app's old tokens, written out, and the
 *      gate audited derived ones instead. The pinned tables are parsed and applied last now.
 *   3. It used the 0.03928 lightness curve while browsers use 0.04045, which let two accent fills
 *      pass here at 4.6 and measure 4.47 in a browser. The curve is the browser's.
 *
 * The arithmetic is still a second copy rather than an import, on purpose: a gate that asks the
 * thing being tested whether it is right is not a gate. The two are kept line for line alike, and
 * `scripts/styles-deep-audit.cjs` measures the rendered page the other way round.
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SOURCE = path.join(ROOT, 'src', 'lib', 'styles.ts');

/* ------------------------------------------------------------------ the same arithmetic */

const rgb = (hex) => {
  const value = hex.replace('#', '');
  const full = value.length === 3 ? value.split('').map((c) => c + c).join('') : value;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
};

const hex = ([r, g, b]) =>
  '#' +
  [r, g, b]
    .map((channel) => Math.round(Math.min(255, Math.max(0, channel))).toString(16).padStart(2, '0'))
    .join('');

const mix = (a, b, t) => {
  const x = rgb(a);
  const y = rgb(b);
  return hex([x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t]);
};

const luminance = (colour) => {
  const channel = (value) => {
    const c = value / 255;
    /* 0.04045: the curve browsers use, see the note in `src/lib/colour.ts`. */
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const [r, g, b] = rgb(colour);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

const contrast = (a, b) => {
  const x = luminance(a);
  const y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

const MAX = '#FFFFFF';
const DEEP = '#0B0B0C';

const toward = (ink, surface, target) => {
  if (contrast(ink, surface) >= target) return ink;
  const away = contrast(MAX, surface) >= contrast(DEEP, surface) ? MAX : DEEP;
  let out = ink;
  for (let step = 0.06; step <= 1.0001; step += 0.06) {
    out = mix(ink, away, step);
    if (contrast(out, surface) >= target) return out;
  }
  return away;
};

const soften = (ink, surface, target) => {
  let best = ink;
  for (let step = 0.04; step <= 1.0001; step += 0.04) {
    const candidate = mix(ink, surface, step);
    if (contrast(candidate, surface) < target) break;
    best = candidate;
  }
  return best;
};

const inkOn = (surface, preferred) =>
  [preferred, MAX, DEEP].reduce((best, candidate) =>
    contrast(candidate, surface) > contrast(best, surface) ? candidate : best,
  );

const fillPair = (accent, preferredInk) => {
  const candidates = [accent];
  for (let step = 0.08; step <= 0.8; step += 0.08) {
    candidates.push(mix(accent, MAX, step));
    candidates.push(mix(accent, DEEP, step));
  }
  for (const candidate of candidates) {
    const ink = inkOn(candidate, preferredInk);
    if (contrast(ink, candidate) >= 4.7) return { fill: candidate, ink };
  }
  return { fill: accent, ink: inkOn(accent, preferredInk) };
};

const pillPair = (accent, bar, preferredInk) => {
  const candidates = [accent];
  for (let step = 0.08; step <= 0.8; step += 0.08) {
    candidates.push(mix(accent, MAX, step));
    candidates.push(mix(accent, DEEP, step));
  }
  let best = { fill: accent, ink: inkOn(accent, preferredInk) };
  let bestScore = -Infinity;
  for (const candidate of candidates) {
    const ink = inkOn(candidate, preferredInk);
    const glyph = contrast(ink, candidate);
    const onBar = contrast(candidate, bar);
    if (glyph >= 3.2 && onBar >= 3.1) return { fill: candidate, ink };
    const score = Math.min(glyph / 3.2, onBar / 3.1);
    if (score > bestScore) {
      bestScore = score;
      best = { fill: candidate, ink };
    }
  }
  return best;
};

const edge = (surface, ink, target) => {
  let out = mix(surface, ink, 0.14);
  for (let step = 0.14; step <= 0.62; step += 0.03) {
    out = mix(surface, ink, step);
    if (contrast(out, surface) >= target) break;
  }
  return out;
};

const hexToHsv = (value) => {
  const [r, g, b] = rgb(value).map((channel) => channel / 255);
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
};

const hsvToHex = ({ h, s, v }) => {
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
  return hex([(r + m) * 255, (g + m) * 255, (b + m) * 255]);
};

/** The app's night cut, hue and depth included. */
const nightOf = ([canvas, , ink, accent]) => {
  const { h, s, v } = hexToHsv(canvas);
  const depth = 0.075 + Math.min(1, v) * 0.085;
  const tint = (value) => hsvToHex({ h, s: Math.min(0.55, s * 1.6 + 0.1), v: value });
  const page = tint(depth);
  const card = tint(depth + 0.06);
  return [page, card, mix(ink, MAX, 0.88), toward(accent, card, 3.4)];
};

/* ------------------------------------------------------------------ read the registry */

const source = await readFile(SOURCE, 'utf8');
const registryStart = source.indexOf('export const STYLES');
const registry = source.slice(registryStart);

/* A comment may sit between any two fields, so each gap allows a block comment. */
const gap = String.raw`(?:\s*\/\*[\s\S]*?\*\/)?\s*\n\s*`;
const entryPattern = new RegExp(
  `id:\\s*'([^']+)',${gap}name:\\s*'([^']+)',${gap}nameNl:\\s*'[^']*',${gap}group:\\s*'([^']+)',${gap}light:\\s*\\[([^\\]]+)\\](?:,${gap}night:\\s*\\[([^\\]]+)\\])?`,
  'g',
);

/**
 * The `pinned` tables a style may carry, as `{ light: {...}, dark: {...} }`.
 *
 * Not a regex over nested braces: a small counter finds the block's end, then each `'--token':
 * 'value'` line is read under whichever appearance was opened last. Anything that is not a colour
 * (a border shorthand, an rgba wash) is kept as written and simply never used by a colour check.
 */
const readPinned = (slice) => {
  const at = slice.indexOf('pinned:');
  if (at < 0) return null;
  const open = slice.indexOf('{', at);
  if (open < 0) return null;
  let depth = 0;
  let end = open;
  for (let index = open; index < slice.length; index += 1) {
    if (slice[index] === '{') depth += 1;
    if (slice[index] === '}') {
      depth -= 1;
      if (depth === 0) {
        end = index;
        break;
      }
    }
  }
  const block = slice.slice(open, end + 1);
  const out = { light: {}, dark: {} };
  let mode = null;
  for (const line of block.split('\n')) {
    if (/\blight:\s*\{/.test(line)) mode = 'light';
    if (/\bdark:\s*\{/.test(line)) mode = 'dark';
    const pair = line.match(/'(--[a-z0-9-]+)':\s*'([^']+)'/i);
    if (pair && mode) out[mode][pair[1]] = pair[2];
  }
  return out;
};

const styles = [];
let match;
while ((match = entryPattern.exec(registry))) {
  const tuple = (text) => [...text.matchAll(/'([^']+)'/g)].map((found) => found[1]);
  const idIndex = registry.indexOf(`id: '${match[1]}'`);
  const nextIndex = registry.indexOf("\n    id: '", idIndex + 1);
  const slice = registry.slice(idIndex, nextIndex > 0 ? nextIndex : registry.length);
  styles.push({
    id: match[1],
    name: match[2],
    group: match[3],
    light: tuple(match[4]),
    night: match[5] ? tuple(match[5]) : null,
    pinned: readPinned(slice),
    faces: {
      display: slice.match(/display:\s*'([a-z-]+)'/)?.[1] ?? null,
      sub: slice.match(/sub:\s*'([a-z-]+)'/)?.[1] ?? null,
      body: slice.match(/body:\s*'([a-z-]+)'/)?.[1] ?? null,
    },
  });
}

/*
 * **Three faces, named by the style itself.**
 *
 * The faces used to live in two tables keyed by style id, and the catalogue was renamed around
 * them: eleven styles fell through to the UI face, so their subtitle tier was their body tier, and
 * two styles drew every word in one family. A look that names one face looks like no look at all.
 * The gate now reads the style blocks, so every style must name a display, a subtitle and a body
 * face, and at least two of them must differ.
 */
const faceless = styles.filter((style) => !style.faces.display || !style.faces.sub || !style.faces.body);
const monotone = styles.filter(
  (style) => style.faces.display && new Set([style.faces.display, style.faces.sub, style.faces.body]).size < 2,
);
if (faceless.length > 0 || monotone.length > 0) {
  console.error('\nstyles-audit: every style must name three faces\n');
  for (const style of faceless) console.error(`  ${style.id}: display ${style.faces.display}, subtitle ${style.faces.sub}, body ${style.faces.body}`);
  for (const style of monotone) console.error(`  ${style.id}: one face for the whole page`);
  process.exit(1);
}

if (styles.length < 20) {
  console.error(`styles-audit: found ${styles.length} styles in ${path.relative(ROOT, SOURCE)}`);
  console.error('The registry is parsed by pattern; a reformatted table stops this gate silently.');
  process.exit(1);
}

/* ------------------------------------------------------------------ the tokens the app writes */

const tokensFor = (style, appearance, raised) => {
  const quad = appearance === 'dark' ? style.night ?? nightOf(style.light) : style.light;
  const [canvas, card, ink, accent] = quad;

  const alt = mix(card, ink, 0.055);
  const strong = raised ? toward(ink, card, 13) : ink;
  const body = toward(soften(ink, card, raised ? 11 : 9.2), card, raised ? 9 : 7);
  const muted = toward(soften(ink, card, raised ? 7.4 : 5.8), card, raised ? 7 : 4.8);
  const faint = toward(soften(ink, card, raised ? 5.8 : 4.7), card, raised ? 5.4 : 4.5);
  const hairline = edge(card, ink, raised ? 3 : 1.7);
  const pageHairline = edge(canvas, ink, raised ? 3 : 1.7);

  const palePage = luminance(card) >= 0.35;
  const dock = palePage ? mix(card, ink, 0.95) : mix(card, DEEP, 0.5);
  const dockInk = toward('#FCFBFA', dock, 4.7);
  const pair = fillPair(accent, ink);
  const dockPill = pillPair(accent, dock, dockInk);
  const mapLand = alt;

  const tokens = {
    '--canvas-base': canvas,
    '--l1-bg': alt,
    '--l2-bg': card,
    '--l3-bg': dock,
    '--ink': body,
    '--ink-strong': strong,
    '--ink-muted': muted,
    '--ink-faint': faint,
    '--border-hairline': hairline,
    '--page-border': pageHairline,
    '--on-dark': dockInk,
    '--on-dark-muted': mix(dockInk, dock, 0.26),
    '--accent-primary': accent,
    '--accent-fill': pair.fill,
    '--on-accent': pair.ink,
    '--accent-on-dock': dockPill.fill,
    '--on-dock-accent': dockPill.ink,
    '--map-ink': body,
    '--map-land': mapLand,
    '--map-accent': toward(accent, mapLand, 3.2),
    '--focus-ring': toward(toward(accent, card, 3.2), canvas, 3.2),
  };

  /* Pinned values win, exactly as `styleTokens` applies them: last, and not under raised contrast. */
  if (!raised && style.pinned?.[appearance]) Object.assign(tokens, style.pinned[appearance]);
  return tokens;
};

/* ------------------------------------------------------------------ the pairs */

const TEXT = [
  ['--ink', '--canvas-base'],
  ['--ink', '--l2-bg'],
  ['--ink', '--l1-bg'],
  ['--ink-strong', '--l2-bg'],
  ['--ink-strong', '--canvas-base'],
  ['--ink-muted', '--l2-bg'],
  ['--ink-muted', '--canvas-base'],
  ['--ink-faint', '--l2-bg'],
  ['--on-accent', '--accent-fill'],
  ['--on-dark', '--l3-bg'],
  ['--on-dark-muted', '--l3-bg'],
  ['--map-ink', '--map-land'],
];

const MARKS = [
  /*
   * **The dock's pill carries a glyph, not a word.** Its floor is the 3:1 (and the app's own 3.2
   * margin) of an icon, which is what the pill is for. Holding it to the 4.5 of text made three
   * styles fail on a rule the interface does not actually break.
   */
  ['--on-dock-accent', '--accent-on-dock', 3.2],
  ['--map-accent', '--map-land', 3],
  ['--focus-ring', '--l2-bg', 3],
  ['--focus-ring', '--canvas-base', 3],
  ['--border-hairline', '--l2-bg', 1.2],
  ['--border-hairline', '--canvas-base', 1.2],
];

const isColour = (value) => /^#[0-9a-f]{3,6}$/i.test(String(value || '').trim());

const failures = [];
const worst = [];
let checkedPairs = 0;
let skippedPinned = 0;

for (const style of styles) {
  for (const appearance of ['light', 'dark']) {
    for (const raised of [false, true]) {
      const tokens = tokensFor(style, appearance, raised);
      const label = appearance + (raised ? ' (raised contrast)' : '');

      for (const [fg, bg] of TEXT) {
        if (!isColour(tokens[fg]) || !isColour(tokens[bg])) {
          skippedPinned += 1;
          continue;
        }
        checkedPairs += 1;
        const ratio = contrast(tokens[fg], tokens[bg]);
        if (ratio + 0.001 < 4.5) {
          failures.push({ style, label, pair: `${fg} on ${bg}`, ratio, floor: 4.5, fg: tokens[fg], bg: tokens[bg] });
        }
      }

      for (const [fg, bg, floor] of MARKS) {
        if (!isColour(tokens[fg]) || !isColour(tokens[bg])) {
          skippedPinned += 1;
          continue;
        }
        checkedPairs += 1;
        const ratio = contrast(tokens[fg], tokens[bg]);
        if (ratio + 0.001 < floor) {
          failures.push({ style, label, pair: `${fg} on ${bg}`, ratio, floor, fg: tokens[fg], bg: tokens[bg] });
        }
      }

      if (!raised) {
        const ratios = [
          ...TEXT.map(([fg, bg]) => (isColour(tokens[fg]) && isColour(tokens[bg]) ? contrast(tokens[fg], tokens[bg]) : Infinity)),
          ...MARKS.map(([fg, bg]) => (isColour(tokens[fg]) && isColour(tokens[bg]) ? contrast(tokens[fg], tokens[bg]) : Infinity)),
        ];
        worst.push({ style, label, ratio: Math.min(...ratios) });
      }
    }
  }
}

worst.sort((a, b) => a.ratio - b.ratio);

if (failures.length > 0) {
  console.error(`\nstyles-audit: ${failures.length} pair(s) under the line\n`);
  for (const failure of failures) {
    console.error(
      `  ${failure.style.id} (${failure.label}) ${failure.pair}: ${failure.ratio.toFixed(2)}:1 ` +
        `under ${failure.floor}:1  ${failure.fg} on ${failure.bg}`,
    );
  }
  process.exit(1);
}

const tightest = worst[0];
console.log(`styles-audit: ${styles.length} styles x 2 appearances x 2 contrasts, every pair clear`);
console.log(`  pairs checked: ${checkedPairs}${skippedPinned ? `, skipped ${skippedPinned} non-colour value(s)` : ''}`);
console.log(
  `  tightest: ${tightest.style.id} (${tightest.label}) at ${tightest.ratio.toFixed(2)}:1`,
);
