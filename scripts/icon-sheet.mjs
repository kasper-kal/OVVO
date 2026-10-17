/**
 * Prints the icon set as a page you can judge: every name in the app's vocabulary, drawn at
 * every size the app draws it at.
 *
 * Reading the set out of `src/components/ui/Icons.tsx` rather than from a list typed here
 * matters — the mappings drift, and a sheet that lists yesterday's glyphs is how a wrong
 * mapping stays wrong. The SVGs come from rendering the same Lucide components the app
 * renders, so the sheet cannot disagree with the interface.
 *
 * Run:   node scripts/icon-sheet.mjs            -> .shots/r57/icon-set.html
 * Open:  <dev server>/shots/r57/icon-set.html
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as Lucide from 'lucide-react';

const source = readFileSync('src/components/ui/Icons.tsx', 'utf8');
const block = source.slice(source.indexOf('const GLYPHS = {'), source.indexOf('} satisfies Record<string, ComponentType<LucideProps>>'));
const pairs = [...block.matchAll(/^\s{2}([A-Za-z]+): (\w+),$/gm)].map(([, name, glyph]) => ({ name, glyph }));

const SIZES = [13, 14, 15, 16, 18, 20, 24, 32];
/** The stroke widths the app gives each band of sizes (see the Icon component). */
const stroke = (size) => (size <= 15 ? 2 : 2);

/**
 * One glyph is not Lucide's: `walk` is Tabler's walking figure, hand-written in the icon
 * module. Its path data is read out of that file so the sheet shows the same figure the app
 * draws rather than an unrelated question mark.
 */
const walkPaths = [...source.matchAll(/<path d="([^"]+)" \/>/g)].map(([, d]) => d);

const cell = (glyph, size, className = '') => {
  if (glyph === 'Walk') {
    const markup = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke(size)}" stroke-linecap="round" stroke-linejoin="round">${walkPaths
      .map((d) => `<path d="${d}"/>`)
      .join('')}</svg>`;
    return `<span class="cell ${className}" title="walk @ ${size}px">${markup}</span>`;
  }
  const Component = Lucide[glyph] ?? Lucide.HelpCircle;
  const markup = renderToStaticMarkup(
    createElement(Component, { size, strokeWidth: stroke(size), 'aria-hidden': 'true', ...(glyph === 'Heart' ? { fill: '#1c1c1e' } : {}) }),
  );
  return `<span class="cell ${className}" title="${glyph} @ ${size}px">${markup}</span>`;
};

const FILLED = new Set(['heartFilled']);
const rows = pairs
  .map(({ name, glyph }) => `<tr><th>${name}<small>${glyph}</small></th>${SIZES.map((size) => `<td>${cell(glyph, size, FILLED.has(name) ? 'filled' : '')}</td>`).join('')}</tr>`)
  .join('\n');

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>OVVO icon set</title>
<style>
  body { margin: 0; padding: 24px; background: #fcfbfa; color: #1c1c1e;
         font: 13px/1.4 ui-sans-serif, system-ui, sans-serif; }
  h1 { font-size: 15px; margin: 0 0 4px; }
  p { margin: 0 0 18px; color: #66666d; }
  table { border-collapse: collapse; }
  th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .06em;
       padding: 8px 14px 8px 0; vertical-align: middle; width: 190px; }
  th small { display: block; text-transform: none; letter-spacing: 0; color: #94949a; font-weight: 400; }
  td { padding: 4px 0; }
  .cell { display: inline-grid; place-items: center; width: 44px; height: 44px; }
  .cell svg { display: block; }
  .cell.filled svg { fill: #1c1c1e; }
  tr:nth-child(odd) { background: #f7f5f0; }
  footer { margin-top: 20px; color: #66666d; }
</style></head>
<body>
<h1>OVVO icon set — ${pairs.length} names, Lucide (ISC)</h1>
<p>Every glyph the app can draw, at every size it draws it. Columns: ${SIZES.map((s) => `${s}px`).join(', ')}. The small grey name under each row is the library's own glyph name.</p>
<table>${rows}</table>
<footer>Size in the app: 13px mode glyphs on the departure board, 14–16px inline with text, 18–20px in list rows, 24–32px in empty states and dialogs.</footer>
</body></html>`;

mkdirSync('.shots/r57', { recursive: true });
writeFileSync('.shots/r57/icon-set.html', html);
console.log(`wrote .shots/r57/icon-set.html — ${pairs.length} icons x ${SIZES.length} sizes`);
