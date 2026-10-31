#!/usr/bin/env node
// Build the "in real life" page: every style's own page, with one card sitting on it.
//
// The colours are not invented here. They are the app's own tokens, dumped from
// `src/lib/styles.ts` by running that file through Node, so a style that changes in the app
// changes on this page the next time it is built. The corner each card wears comes from
// `design/corners.json`, and the pairing comes from the plan at the foot of the corner gallery.
//
//   node scripts/style-scenes.mjs        rebuild .logs/mock/scenes.html
//
// The page holds two switches: light or dark, and the style's colour or its photograph.

import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, symlinkSync, writeFileSync } from 'node:fs';

const PAGE = '.logs/mock/scenes.html';
const TOKENS = '.logs/style-tokens.json';
const SHAPES = 'design/corners.json';
const PHOTOS = 'public/style-photos';
const VIEW_W = 440;
const VIEW_H = 280;

/* ---------------------------------------------------------------- the plan, from the gallery */

const DEMOS = [
  { n: 1, caption: 'One. Cut corners.', styles: ['navy-gold', 'terminal'] },
  { n: 2, caption: 'Two. Top and bottom pinched to a point.', styles: ['midnight-silk', 'blueprint'] },
  { n: 3, caption: 'Three. A square step at every corner.', styles: ['bordeaux', 'marble'] },
  { n: 4, caption: 'Four. The sides pinch in from top to bottom.', styles: ['poppy-blue', 'arches'] },
  { n: 5, caption: 'Five. Pinched on all four sides.', styles: ['ultraviolet', 'summit'] },
  { n: 6, caption: 'Six. A scoop taken out of every corner.', styles: ['cyber-teal', 'cloudbank'] },
  { n: 7, caption: 'Seven. Deeper cut corners.', styles: ['broadsheet', 'riviera'] },
  { n: 8, caption: 'Eight. Two hollow bands, one slightly bigger.', styles: ['spoorboekje', 'palazzo'] },
  { n: 9, caption: 'Nine. Cut corners with a pinched top and bottom.', styles: ['rijksmuseum', 'storm-tide'] },
];

/* The style rows under the plan name a shape, not a corner, so each is given the corner that
   reads closest to that shape. This is the one place a choice was made rather than read off the
   page, and it is the list to change if a pairing looks wrong. */
const SHAPE_ROWS = [
  { shape: 'Soft', styles: ['station-sign', 'skyline'], n: 1 },
  { shape: 'Square', styles: ['tram', 'capsule'], n: 3 },
  { shape: 'Round', styles: ['obsidian', 'toscane'], n: 6 },
  { shape: 'Pill', styles: ['contrast', 'contact'], n: 5 },
  { shape: 'Line', styles: ['night-aa', 'loggia'], n: 8 },
  { shape: 'Plate', styles: ['sage'], n: 2 },
  { shape: 'Arch', styles: ['mustard'], n: 7 },
];

/* ---------------------------------------------------------------- the app's own tokens */

function dumpTokens() {
  mkdirSync('.logs/tokens', { recursive: true });
  for (const file of readdirSync('src/lib').filter((name) => name.endsWith('.ts'))) {
    copyFileSync(`src/lib/${file}`, `.logs/tokens/${file}`);
  }
  for (const file of readdirSync('.logs/tokens').filter((name) => name.endsWith('.ts'))) {
    const path = `.logs/tokens/${file}`;
    const fixed = readFileSync(path, 'utf8').replace(/from '\.\/([A-Za-z0-9_-]+)'/g, "from './$1.ts'");
    writeFileSync(path, fixed);
  }
  writeFileSync(
    '.logs/tokens/dump.mts',
    [
      "import { STYLES, styleTokens, stylePhotograph } from './styles.ts';",
      "import { writeFileSync } from 'node:fs';",
      'const rows = STYLES.map((s) => ({',
      '  id: s.id, name: s.name, group: s.group, shape: s.shape ?? null,',
      "  light: styleTokens(s, 'light'), dark: styleTokens(s, 'dark'),",
      '  photo: stylePhotograph(s),',
      '}));',
      `writeFileSync('${TOKENS}', JSON.stringify(rows, null, 1));`,
      'console.log(rows.length);',
      '',
    ].join('\n'),
  );
  execFileSync('node', ['.logs/tokens/dump.mts'], { stdio: 'pipe' });
}

dumpTokens();
const styles = JSON.parse(readFileSync(TOKENS, 'utf8'));
const byId = new Map(styles.map((style) => [style.id, style]));
const corners = new Map(JSON.parse(readFileSync(SHAPES, 'utf8')).cards.map((card) => [card.n, card]));
const photos = new Set(readdirSync(PHOTOS).filter((name) => name.endsWith('.jpg')));

/* ---------------------------------------------------------------- helpers */

const esc = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const has = (style, appearance) => photos.has(appearance === 'dark' ? `${style}-night.jpg` : `${style}.jpg`);

function vars(style, appearance) {
  const token = style[appearance];
  const source = has(style.id, appearance) ? `photos/${appearance === 'dark' ? `${style.id}-night.jpg` : `${style.id}.jpg`}` : 'none';
  return [
    `--canvas:${token['--canvas-base']}`,
    `--card:${token['--card-fill'] ?? token['--l2-bg']}`,
    `--line:${token['--border-hairline']}`,
    `--line-width:${token['--line-width'] ?? '1px'}`,
    `--ink-strong:${token['--ink-strong']}`,
    `--ink:${token['--ink']}`,
    `--ink-muted:${token['--ink-muted']}`,
    `--ink-faint:${token['--ink-faint']}`,
    `--accent:${token['--accent-fill']}`,
    `--on-accent:${token['--on-accent']}`,
    `--wash:${token['--app-bg-wash']}`,
    `--photo:${source === 'none' ? 'none' : `url(${source})`}`,
    `--font-display:${token['--font-display']}`,
    `--font-body:${token['--font-body']}`,
  ].join(';');
}

function tile(styleId, cornerNumber, note) {
  const style = byId.get(styleId);
  const corner = corners.get(cornerNumber);
  if (!style || !corner) throw new Error(`Missing style ${styleId} or corner ${cornerNumber}`);
  const id = `s-${style.id}`;
  /* A style is colour-only when the plan forbids a picture, or when no file exists for it. */
  const photoFree = style.photo === null || (!has(style.id, 'light') && !has(style.id, 'dark'));
  return [
    `<article class="tile${photoFree ? ' no-photo' : ''}" id="${id}" data-name="${esc(style.name)}">`,
    '  <div class="scene">',
    '    <div class="paper"></div>',
    '    <div class="photo"></div>',
    `    <svg class="card" viewBox="0 0 ${VIEW_W} ${VIEW_H}" role="img" aria-label="${esc(style.name)}, ${esc(corner.caption)}">`,
    `      <defs><clipPath id="clip-${style.id}"><path d="${corner.path}"/></clipPath></defs>`,
    `      <path class="card-fill" d="${corner.path}"/>`,
    `      <g clip-path="url(#clip-${style.id})"><path class="card-line" d="${corner.path}"/></g>`,
    '      <text class="eyebrow" x="64" y="100">VOLGENDE TRET</text>',
    '      <text class="title" x="64" y="136">Amsterdam Zuid</text>',
    '      <text class="subt" x="64" y="156">Utrecht Centraal · spoor 4</text>',
    '      <rect class="chip" x="64" y="174" width="78" height="26" rx="13"/>',
    '      <text class="chip-label" x="103" y="191" text-anchor="middle">Direct</text>',
    '      <text class="time" x="376" y="191" text-anchor="end">09:12</text>',
    '    </svg>',
    '  </div>',
    `  <p class="meta"><b>${esc(style.name)}</b><span>${esc(note)}${photoFree ? ' · colour only' : ''}</span></p>`,
    '</article>',
  ].join('\n');
}

/* ---------------------------------------------------------------- the page */

const tiles = [];
const demoList = [];

for (const demo of DEMOS) {
  demoList.push(
    `<li><b>${esc(demo.caption)}</b><span class="chips">${demo.styles
      .map((id) => `<a class="chip-link" href="#s-${id}">${esc(byId.get(id).name)}</a>`)
      .join('')}</span></li>`,
  );
  for (const id of demo.styles) tiles.push(tile(id, demo.n, `Demo ${['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'][demo.n - 1]} · corner ${demo.n}`));
}

const shapeList = [];
for (const row of SHAPE_ROWS) {
  shapeList.push(
    `<li><b>${esc(row.shape)}</b><span class="chips">${row.styles
      .map((id) => `<a class="chip-link" href="#s-${id}">${esc(byId.get(id).name)}</a>`)
      .join('')}</span></li>`,
  );
  for (const id of row.styles) tiles.push(tile(id, row.n, `${row.shape} · corner ${row.n}`));
}

const styleRules = [];
for (const style of styles) {
  styleRules.push(`[data-appearance="light"] #s-${style.id} { ${vars(style, 'light')} }`);
  styleRules.push(`[data-appearance="dark"] #s-${style.id} { ${vars(style, 'dark')} }`);
}

const html = `<!doctype html>
<html lang="en" data-appearance="light" data-wallpaper="colour">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>OVVO · thirty styles, one card</title>
<style>
  :root { color-scheme: light }
  * { box-sizing: border-box }
  body { margin: 0; background: #f7f5ef; color: #18181b; font-family: 'Inter', system-ui, sans-serif }
  main { max-width: 1080px; margin: 0 auto; padding: 48px 24px 72px }
  h1 { margin: 0 0 6px; font: 800 26px/1.15 'Plus Jakarta Sans', Inter, sans-serif; letter-spacing: -0.02em }
  .lede { margin: 0; max-width: 60ch; font-size: 13px; line-height: 1.5; color: #5f5f66 }
  .switches { display: flex; flex-wrap: wrap; gap: 10px; margin: 16px 0 2px }
  .switch { display: inline-flex; padding: 3px; border: 1px solid #cdc7b8; border-radius: 999px; background: #fff }
  .switch button { appearance: none; border: 0; background: none; cursor: pointer; padding: 7px 16px; border-radius: 999px;
    font: 600 12px/1 'Inter', system-ui, sans-serif; color: #5f5f66 }
  .switch button[aria-pressed="true"] { background: #18181b; color: #fff }
  h2 { margin: 26px 0 8px; font: 800 15px/1.2 'Plus Jakarta Sans', Inter, sans-serif }
  ul.plan { list-style: none; margin: 0; padding: 0; columns: 3; column-gap: 20px }
  ul.plan li { break-inside: avoid; padding: 5px 0; border-top: 1px solid #e6e1d6 }
  ul.plan b { display: block; font-size: 10.5px; font-weight: 600; line-height: 1.25 }
  .chips { display: block; margin-top: 3px }
  .chip-link { display: inline-block; margin: 1px 3px 1px 0; padding: 1px 8px; border: 1px solid #cdc7b8; border-radius: 999px;
    font-size: 10px; color: #3a3a3f; text-decoration: none }
  .chip-link:hover { border-color: #18181b }
  .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 22px; margin-top: 26px }
  .tile { margin: 0 }
  .scene { position: relative; overflow: hidden; border: 1px solid #e2ddd1; border-radius: 2px; padding: 34px 30px; background: var(--canvas) }
  .paper { position: absolute; inset: 0; background: var(--canvas) }
  .photo { position: absolute; inset: 0; background-image: linear-gradient(var(--wash), var(--wash)), var(--photo);
    background-size: cover; background-position: center }
  [data-wallpaper="colour"] .photo { display: none }
  .no-photo .photo { display: none }
  .card { position: relative; display: block; width: 100%; height: auto }
  .card-fill { fill: var(--card) }
  .card-line { fill: none; stroke: var(--line); stroke-width: var(--line-width); stroke-linejoin: miter }
  .eyebrow { fill: var(--ink-faint); font-family: var(--font-body); font-size: 8.5px; letter-spacing: 0.14em }
  .title { fill: var(--ink-strong); font-family: var(--font-display); font-size: 24px; font-weight: 800; letter-spacing: -0.02em }
  .subt { fill: var(--ink-muted); font-family: var(--font-body); font-size: 11.5px }
  .chip { fill: var(--accent) }
  .chip-label { fill: var(--on-accent); font-family: var(--font-body); font-size: 10.5px; font-weight: 600 }
  .time { fill: var(--ink-muted); font-family: var(--font-body); font-size: 11px; font-weight: 600 }
  .meta { display: flex; align-items: baseline; gap: 8px; margin: 8px 2px 0 }
  .meta b { font-size: 12.5px }
  .meta span { font-size: 10.5px; color: #8a8478 }
  @media (max-width: 720px) { .grid { grid-template-columns: 1fr } ul.plan { columns: 1 } }
${styleRules.map((rule) => `  ${rule}`).join('\n')}
</style>
</head>
<body>
<main>
  <h1>Thirty styles, one card</h1>
  <p class="lede">Every style's own page, with one card on it. The card wears the corner the plan pairs with that style, and the colours are the app's own tokens. Switch the appearance, and switch the background between the style's colour and its photograph.</p>
  <div class="switches">
    <div class="switch" role="group" aria-label="Appearance">
      <button type="button" data-set="appearance" data-value="light" aria-pressed="true">Light</button>
      <button type="button" data-set="appearance" data-value="dark" aria-pressed="false">Dark</button>
    </div>
    <div class="switch" role="group" aria-label="Background">
      <button type="button" data-set="wallpaper" data-value="colour" aria-pressed="true">Colour</button>
      <button type="button" data-set="wallpaper" data-value="photo" aria-pressed="false">Photo</button>
    </div>
  </div>

  <h2>The demos</h2>
  <ul class="plan">${demoList.join('')}</ul>

  <h2>The shape rows</h2>
  <ul class="plan">${shapeList.join('')}</ul>

  <div class="grid">
    ${tiles.join('\n    ')}
  </div>
</main>
<script>
  for (const button of document.querySelectorAll('.switch button')) {
    button.addEventListener('click', () => {
      const set = button.dataset.set;
      const group = button.closest('.switch');
      for (const sibling of group.querySelectorAll('button')) sibling.setAttribute('aria-pressed', String(sibling === button));
      document.documentElement.dataset[set] = button.dataset.value;
    });
  }
</script>
</body>
</html>
`;

mkdirSync('.logs/mock', { recursive: true });
writeFileSync(PAGE, html);
mkdirSync('design', { recursive: true });
writeFileSync('design/style-scenes.html', html);
mkdirSync('.logs/mock/photos', { recursive: true });
for (const name of readdirSync(PHOTOS).filter((entry) => entry.endsWith('.jpg'))) {
  copyFileSync(`${PHOTOS}/${name}`, `.logs/mock/photos/${name}`);
}
console.log(`${tiles.length} tiles written to ${PAGE}`);
