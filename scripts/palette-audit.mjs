/**
 * **The header's alerts entry, in every palette a traveller can build.**
 *
 * Every other colour check in this folder runs the app's own cream canvas, and that is the hole
 * this file was written for: a tinted page is a different set of surfaces, and a control measured on
 * one of them says nothing about the other. Two real faults lived in it.
 *
 *   • the alert count's outline was `color-mix(ink 32%)`, which is fine when the pill is painted in
 *     the accent — and is the *only* edge there is when the pill happens to be painted the page's
 *     own colour. There it measured **1.35:1**, a count you could not see (reported from a
 *     screenshot with a periwinkle page: "what a contrast issue").
 *   • in a split palette the pill's fill came from the widgets' colour while its label was chosen
 *     for the accent's cut, so an ivory widget colour drew an ivory pill holding ivory digits —
 *     **1.00:1**, a badge with no number in it.
 *
 * Both are fixed (`lib/background.ts`, `styles/base.css`), and this is the instrument that keeps
 * them fixed. It asserts, in each palette, on the paint rather than on the declaration:
 *
 *   1. the count's digits are at least **4.5:1** against the pill (11px bold is small text);
 *   2. the pill's **boundary** is at least **3:1** against the page — either its fill or its ring,
 *      because a fill that equals the page is allowed exactly as long as the ring still reads;
 *   3. the warning triangle is at least **3:1** against the page (WCAG's non-text minimum).
 *
 * Run:   node scripts/palette-audit.mjs [origin]
 * Needs: playwright + a dev server on :3000, and it calls `ensureAppFont` before measuring, so the
 * numbers describe the type the traveller actually sees (`scripts/font-guard.mjs`).
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import { ensureAppFont } from './font-guard.mjs';

const ORIGIN = process.argv[2] ?? 'http://127.0.0.1:3000';

/* ------------------------------------------------------------------ contrast */

const lin = (channel) => {
  const s = channel / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const luminance = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const asRgb = (css) => {
  const match = String(css).match(/rgba?\(([^)]+)\)/);
  if (!match) return null;
  const parts = match[1].split(/[ ,/]+/).filter(Boolean).map(Number);
  return { rgb: parts.slice(0, 3), alpha: parts.length > 3 ? parts[3] : 1 };
};

/* ------------------------------------------------------------------ palettes */

/** A fresh browser's settings, with the three colour fields each palette changes. */
const SETTINGS = {
  version: 8,
  language: 'en',
  timeFormat: '24h',
  dateFormat: 'long',
  density: 'comfortable',
  highContrast: false,
  reduceMotion: false,
  selectionColor: 'coral',
  selectionCustom: '',
  selectionColorDark: 'coral',
  selectionCustomDark: '',
  background: 'cream',
  backgroundColour: '#FCFBFA',
  backgroundColourDark: '#1b2430',
  backgroundImage: '',
  backgroundImageSource: '',
  backgroundCrop: null,
  cardTreatment: 'solid',
  primaryColour: '',
  primaryColourDark: '',
  defaultTimeMode: 'depart',
  defaultOriginStopId: null,
};

/**
 * One entry per shape of palette, not per colour: the default canvas in both appearances, a tinted
 * page with the widgets following it (the case the outline bug lived in), a tinted page with a
 * different colour for the widgets (the case the label bug lived in), the accent carried by the
 * widgets, high contrast, and two dark pages.
 */
const PALETTES = [
  { label: 'light · default cream', patch: { theme: 'light' } },
  { label: 'dark · default', patch: { theme: 'dark' } },
  { label: 'light · periwinkle page, widgets follow', patch: { theme: 'light', background: 'colour', backgroundColour: '#DDE3F7', primaryColour: '' } },
  { label: 'light · periwinkle page, ivory widgets', patch: { theme: 'light', background: 'colour', backgroundColour: '#DDE3F7', primaryColour: '#FCFBFA' } },
  { label: 'light · sage page, ivory widgets', patch: { theme: 'light', background: 'colour', backgroundColour: '#E3EBDC', primaryColour: '#FCFBFA' } },
  { label: 'light · near-white page, ivory widgets', patch: { theme: 'light', background: 'colour', backgroundColour: '#F7F4EE', primaryColour: '#FCFBFA' } },
  { label: 'light · blue page, coral widgets', patch: { theme: 'light', background: 'colour', backgroundColour: '#DCE7F7', primaryColour: '#FF7E67' } },
  { label: 'light · green page, green widgets', patch: { theme: 'light', background: 'colour', backgroundColour: '#DDEBDD', primaryColour: '#7FB069' } },
  { label: 'light · high contrast, periwinkle', patch: { theme: 'light', highContrast: true, background: 'colour', backgroundColour: '#DDE3F7', primaryColour: '#FCFBFA' } },
  { label: 'dark · navy page, ivory widgets', patch: { theme: 'dark', background: 'colour', backgroundColour: '#1b2430', primaryColour: '#FCFBFA', primaryColourDark: '#2A2A28' } },
  { label: 'dark · navy page, widgets follow', patch: { theme: 'dark', background: 'colour', backgroundColour: '#1b2430', primaryColour: '' } },
];

/* ------------------------------------------------------------------ the walk */

const MIN_TEXT = 4.5;
const MIN_GRAPHIC = 3;

const browser = await chromium.launch({ chromiumSandbox: false, args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--hide-scrollbars'] });
const rows = [];
const failures = [];

for (const palette of PALETTES) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await context.addInitScript(
    ([settings]) => {
      localStorage.clear();
      localStorage.setItem('ov-planner:v1:settings', JSON.stringify(settings));
      localStorage.setItem('ov-planner:v1:location-consent', '"denied"');
    },
    [{ ...SETTINGS, ...palette.patch }],
  );
  const page = await context.newPage();
  await page.goto(ORIGIN + '/', { waitUntil: 'networkidle' });
  await ensureAppFont(page);
  await page.waitForTimeout(250);

  const read = await page.evaluate(() => {
    const behind = (el) => {
      for (let node = el; node; node = node.parentElement) {
        const match = String(getComputedStyle(node).backgroundColor).match(/rgba?\(([^)]+)\)/);
        if (!match) continue;
        const parts = match[1].split(/[ ,/]+/).filter(Boolean).map(Number);
        if ((parts[3] ?? 1) > 0.99) return parts.slice(0, 3);
      }
      return [255, 255, 255];
    };
    const count = document.querySelector('.app-header__alert-count');
    const icon = document.querySelector('.app-header__alerts svg');
    if (!count || !icon) return null;
    const colour = (value) => {
      const match = String(value).match(/rgba?\(([^)]+)\)/);
      return match ? match[1].split(/[ ,/]+/).filter(Boolean).map(Number).slice(0, 3) : null;
    };
    const countStyle = getComputedStyle(count);
    return {
      page: behind(count.parentElement),
      icon: colour(getComputedStyle(icon).color),
      fill: colour(countStyle.backgroundColor),
      ink: colour(countStyle.color),
    };
  });

  if (!read) {
    failures.push(`${palette.label}: no alert count in the header`);
    await context.close();
    continue;
  }

  /*
   * The ring is a `color-mix`, so it is read off the paint: one CSS pixel in from the pill's left
   * edge, at half its height. Its computed value is not a colour a script can do arithmetic on.
   */
  const png = (await page.locator('.app-header__alert-count').screenshot()).toString('base64');
  const ring = await page.evaluate(
    async ([data, dpr]) => {
      const image = new Image();
      image.src = 'data:image/png;base64,' + data;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0);
      const pixel = ctx.getImageData(Math.round(dpr), Math.round(canvas.height / 2), 1, 1).data;
      return Array.from(pixel).slice(0, 3);
    },
    [png, 2],
  );

  const digits = contrast(read.ink, read.fill);
  const fillEdge = contrast(read.fill, read.page);
  const ringEdge = contrast(ring, read.page);
  const boundary = Math.max(fillEdge, ringEdge);
  const iconEdge = contrast(read.icon, read.page);

  const ok = digits >= MIN_TEXT && boundary >= MIN_GRAPHIC && iconEdge >= MIN_GRAPHIC;
  rows.push({
    label: palette.label,
    ok,
    digits: digits.toFixed(2),
    fillEdge: fillEdge.toFixed(2),
    ringEdge: ringEdge.toFixed(2),
    iconEdge: iconEdge.toFixed(2),
    colours: `fill rgb(${read.fill.join(', ')}) · ink rgb(${read.ink.join(', ')}) · ring rgb(${ring.join(', ')}) · page rgb(${read.page.join(', ')})`,
  });

  if (!ok) {
    failures.push(
      `${palette.label}: digits ${digits.toFixed(2)}:1 (needs ${MIN_TEXT}), boundary ${boundary.toFixed(2)}:1 (needs ${MIN_GRAPHIC}), triangle ${iconEdge.toFixed(2)}:1 (needs ${MIN_GRAPHIC})`,
    );
    mkdirSync('.logs', { recursive: true });
    await (await page.$('.app-header__alerts')).screenshot({
      path: `.logs/palette-audit-${palette.label.replace(/[^a-z]+/gi, '-')}.png`,
    });
  }
  await context.close();
}
await browser.close();

/* ------------------------------------------------------------------ report */

const lines = [
  '# Alert count and warning mark, per palette',
  '',
  `Measured on ${new Date().toISOString().slice(0, 10)} at 390px, digits against the pill, the pill's`,
  `boundary (its fill or its ring) against the page, and the triangle against the page.`,
  '',
  '| palette | digits | fill edge | ring edge | triangle | verdict |',
  '| --- | --- | --- | --- | --- | --- |',
  ...rows.map((row) => `| ${row.label} | ${row.digits}:1 | ${row.fillEdge}:1 | ${row.ringEdge}:1 | ${row.iconEdge}:1 | ${row.ok ? 'pass' : '**fail**'} |`),
  '',
  ...rows.map((row) => `- ${row.label} — ${row.colours}`),
];
mkdirSync('.logs', { recursive: true });
writeFileSync('.logs/palette-audit.md', lines.join('\n') + '\n');

for (const row of rows) {
  console.log(
    `${row.ok ? 'PASS' : 'FAIL'}  ${row.label.padEnd(42)} digits ${row.digits}:1 · edge ${Math.max(Number(row.fillEdge), Number(row.ringEdge)).toFixed(2)}:1 · triangle ${row.iconEdge}:1`,
  );
}
console.log(`\nreport: .logs/palette-audit.md`);
if (failures.length) {
  console.log(`\n${failures.length} palette(s) fail:`);
  for (const failure of failures) console.log(`  ${failure}`);
  process.exit(1);
}
console.log('OK — the count is readable and the warning mark is visible in every palette.');
