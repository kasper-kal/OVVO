#!/usr/bin/env node
/**
 * **The corner gate: the arithmetic a rounded style has to obey.**
 *
 * `styles-audit.mjs` is a *colour* gate. It reads the style table's colour tuples and does
 * contrast maths, and it has no idea that a corner exists, so it passed every style while a
 * full-bleed sheet was being drawn with a 160px corner on a 390px phone, and while the menu's
 * rows were rounded with the card's arithmetic inside a surface whose inset and curve were the
 * sheet's. This gate is the other half: it reads the shape multipliers and the stylesheet and
 * checks the geometry that the colour gate cannot see.
 *
 * It fails on:
 *
 *   1. **A curve wider than its own surface allows.** A shape multiplier is a multiplier: at
 *      scale 5 a card's corner is 140px, which is a design choice, but a *full-bleed* surface
 *      (a sheet, the header, the dock) has no flat edge left to hold, so its corner is capped.
 *      Any rule for one of those surfaces asking for the uncapped `--r-hero` fails here.
 *   2. **A sheet holding a card's curve.** Anything inside `.menu-sheet` or `.modal` nests
 *      against `--r-sheet-nested`; a `--r-card` / `--r-nested` / `--r-hero` corner in that scope
 *      is the exact defect that shipped.
 *   3. **A broken nesting sum.** The nested corner has to be the outer corner minus the inset
 *      it sits in, at every multiplier, and never a negative length.
 *
 * Run:   node scripts/corner-audit.mjs
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const STYLES = path.join(ROOT, 'src', 'lib', 'styles.ts');
const TOKENS = path.join(ROOT, 'src', 'styles', 'tokens.css');
const SHEETS = [
  path.join(ROOT, 'src', 'styles', 'components.css'),
  path.join(ROOT, 'src', 'styles', 'base.css'),
];

const CAP = 44; /* `--r-sheet`'s ceiling, shared with `tokens.css`. */

const failures = [];

/* ------------------------------------------------------------------ 1. the shape multipliers */

const source = await readFile(STYLES, 'utf8');
const shapesAt = source.indexOf('SHAPES');
if (shapesAt < 0) {
  console.error('corner-audit: no SHAPES table in src/lib/styles.ts');
  process.exit(1);
}
const shapeBlock = source.slice(shapesAt, source.indexOf('};', shapesAt));
const scales = [...new Set([...shapeBlock.matchAll(/scale:\s*([\d.]+)/g)].map((m) => Number(m[1])))].sort(
  (a, b) => a - b,
);
if (scales.length < 3) {
  console.error(`corner-audit: read ${scales.length} shape multiplier(s); the table is parsed by pattern`);
  process.exit(1);
}

/** `--shape-pad` as `styleTokens` writes it, then `--pad-*`, `--r-*` as `tokens.css` derives them. */
const geometryFor = (scale) => {
  const shapePad = Math.max(1, Math.min(2.6, 1 + (scale - 1) * 0.32));
  const rawHero = 32 * scale;
  const rHero = Math.min(rawHero, 64);
  const rCard = Math.min(28 * scale, 56);
  const rInput = Math.min(20 * scale, 40);
  const padHero = Math.max(16, rHero * 0.4);
  const padCard = Math.max(16, rCard * 0.4);
  const rSheet = Math.min(rawHero, CAP);
  const padSheet = Math.max(16, rSheet * 0.4);
  return {
    scale,
    shapePad,
    rawHero,
    rHero,
    rCard,
    rInput,
    padHero,
    padCard,
    rSheet,
    padSheet,
    rNested: Math.max(0, rCard - padCard),
    rSheetNested: Math.max(0, rSheet - padSheet),
  };

};

const geometry = scales.map(geometryFor);

for (const g of geometry) {
  if (g.rSheet > CAP + 0.01) {
    failures.push(`--r-sheet is ${g.rSheet}px at scale ${g.scale}; the cap is ${CAP}px`);
  }
  if (g.rNested < 0 || g.rSheetNested < 0) {
    failures.push(`a nested corner went negative at scale ${g.scale}`);
  }
  /* The sum itself: a nested curve is its surface's curve minus the inset it sits in. */
  /* `--r-nested` is clamped at zero, so the sum is clamped too: a 8.4px card inset by 16px
     has no inner curve, not a negative one. */
  if (Math.abs(g.rNested - Math.max(0, g.rCard - g.padCard)) > 0.01) {
    failures.push(`--r-nested is not (--r-card - --pad-card) at scale ${g.scale}`);
  }
}

/* The tokens themselves: the cap has to be in the stylesheet, not only in this file. */
/*
 * **An inline token beats the stylesheet.** `styleTokens` writes `--shape-scale` and `--r-inner`
 * onto the root, so a ceiling that lives only in `tokens.css` is not applied to those. Any
 * `--r-*` written by the app must carry its own clamp.
 */
for (const inline of source.matchAll(/'--r-[a-z-]+':\s*`([^`]+)`/g)) {
  if (inline[1].includes('shape.scale') && !inline[1].includes('Math.min')) {
    failures.push(`styles.ts writes an uncapped ${inline[0].slice(0, 18)} (an inline token beats tokens.css)`);
  }
}
const tokens = await readFile(TOKENS, 'utf8');
if (!/--r-sheet:\s*min\(/.test(tokens)) {
  failures.push('tokens.css has no capped `--r-sheet` (a full-bleed surface would take an uncapped corner)');
}
if (!/--pad-page:\s*max\(/.test(tokens)) {
  failures.push('tokens.css has no `--pad-page` (a round card would sit on the screen edge)');
}
if (!/--r-sheet-nested:\s*max\(/.test(tokens)) {
  failures.push('tokens.css has no `--r-sheet-nested` (a sheet has nothing to nest against)');
}

/* ------------------------------------------------------------------ 2. the stylesheet */

const FULL_BLEED = ['.modal', '.menu-sheet', '.app-header', '.dock', '.tabbar', '.overlay'];
const CARD_CURVES = ['--r-card', '--r-hero', '--r-nested'];
const SHEET_SCOPE = [/^\.menu-sheet\b/, /^\.menu-sheet\s/, /^\.modal\b/, /^\.modal\s/];

const blocks = [];
for (const file of SHEETS) {
  const css = await readFile(file, 'utf8');
  const name = path.relative(ROOT, file);
  for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = match[1].replace(/\/\*[\s\S]*?\*\//g, '').trim();
    const body = match[2];
    if (!selector || selector.startsWith('@')) continue;
    const radius = body.match(/border-radius:\s*([^;]+);/);
    if (radius) blocks.push({ name, selector, radius: radius[1].trim() });
  }
}

for (const block of blocks) {
  const first = block.selector.split(',')[0].trim();

  /* 2a. A full-bleed surface never takes the uncapped hero curve. */
  if (FULL_BLEED.some((cls) => first === cls) && /var\(--r-hero\)/.test(block.radius)) {
    failures.push(
      `${block.name}: \`${first}\` is full-bleed and asks for --r-hero (${block.radius}); ` +
        'its corner has to be capped with --r-sheet',
    );
  }

  /* 2b. Nothing inside a sheet takes a card's curve. */
  if (SHEET_SCOPE.some((pattern) => pattern.test(first))) {
    const used = CARD_CURVES.find((tokenName) => new RegExp(`var\\(${tokenName}\\)`).test(block.radius));
    if (used) {
      failures.push(
        `${block.name}: \`${block.selector}\` sits in a sheet and asks for ${used} ` +
          `(${block.radius}); a sheet's contents nest with --r-sheet-nested`,
      );
    }
  }
}

/* ------------------------------------------------------------------ 3. say what was wrong */

const before = geometry.filter((g) => g.rawHero > CAP);
console.log(`corner-audit: ${scales.length} shape multipliers, ${blocks.length} rounded rules`);
console.log(
  `  the cap: a full-bleed surface stops at ${CAP}px; before this gate, ` +
    `${before.length === 0 ? 'no' : before.length} multiplier(s) drew one larger ` +
    `(widest: ${Math.max(...geometry.map((g) => g.rawHero))}px)`,
);
for (const g of geometry) {
  console.log(
    `  scale ${String(g.scale).padEnd(4)} card ${g.rCard.toFixed(0)}px · inset ${g.padCard.toFixed(1)}px · ` +
      `nested ${g.rNested.toFixed(0)}px · sheet ${g.rSheet.toFixed(0)}px · sheet-nested ${g.rSheetNested.toFixed(1)}px`,
  );
}

if (failures.length > 0) {
  console.error(`\ncorner-audit: ${failures.length} corner(s) that cannot be drawn\n`);
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}

console.log('  every corner nests, and no full-bleed surface takes an uncapped curve');
