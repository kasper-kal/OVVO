#!/usr/bin/env node
// Build the "in real life" page: every style's own page, with one card sitting on it.
//
// The colours are not invented here. They are the app's own tokens, dumped from
// `src/lib/styles.ts` by running that file through Node. The shell is not invented either: the
// page links the app's own `tokens.css`, `fonts.css`, `base.css` and `components.css`, so the
// switches are the app's `.segmented` control, the type is the app's type, and the page switches
// appearance the same way the app does.
//
//   node scripts/style-scenes.mjs        rebuild .logs/scenes/index.html
//
// That folder is what the preview serves, so this page is the only thing in it. The corner
// gallery still lives in `.logs/mock/index.html` and is still guarded by `scripts/corners.mjs`.

import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';

const OUT = '.logs/scenes';
const PAGE = `${OUT}/index.html`;
const SAVED = 'design/style-scenes.html';
const TOKENS = '.logs/style-tokens.json';
const SHAPES = 'design/corners.json';
const PHOTOS = 'public/style-photos';
const STYLES_CSS = ['tokens.css', 'fonts.css', 'base.css', 'components.css'];
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

/* The seven "Implemented" rows are the app's shipped card shapes. The plan gives them no corner,
   so they wear the card that already exists in the app: its own radius, drawn from --shape-scale. */
const SHIPPED_ROWS = [
  { shape: 'Soft', styles: ['perron', 'skyline'] },
  { shape: 'Square', styles: ['tram', 'capsule'] },
  { shape: 'Round', styles: ['obsidian', 'toscane'] },
  { shape: 'Pill', styles: ['contrast', 'contact'] },
  { shape: 'Line', styles: ['night-aa', 'loggia'] },
  { shape: 'Plate', styles: ['sage'] },
  { shape: 'Arch', styles: ['mustard'] },
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
const photoFile = (id, appearance) => (appearance === 'dark' ? `${id}-night.jpg` : `${id}.jpg`);
const has = (id, appearance) => photos.has(photoFile(id, appearance));

/** The app's tokens for one style and appearance, written as custom properties. */
function vars(style, appearance) {
  const token = style[appearance];
  const file = has(style.id, appearance) ? photoFile(style.id, appearance) : null;
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
    `--photo:${file ? `url(photos/${file})` : 'none'}`,
    `--font-display:${token['--font-display']}`,
    `--font-body:${token['--font-body']}`,
  ].join(';');
}

/** The app's own token set, for the page shell rather than a tile. */
function shellVars(appearance) {
  const tram = byId.get('tram')[appearance];
  const keys = [
    '--canvas-base', '--surface-alt', '--surface-raised', '--l1-bg', '--l2-bg', '--card-fill',
    '--l1-border', '--l2-border', '--ink-strong', '--ink', '--ink-muted', '--ink-faint',
    '--border-hairline', '--hairline-on-dark', '--accent-primary', '--accent-fill', '--on-accent',
    '--focus-ring', '--font-display', '--font-body', '--font-stack', '--line-width',
    '--display-size', '--display-weight', '--display-leading', '--display-tracking',
    '--section-size', '--section-weight',
  ];
  return keys.filter((key) => tram[key] !== undefined).map((key) => `${key}:${tram[key]}`).join(';');
}

function tile(styleId, cornerNumber, note) {
  const style = byId.get(styleId);
  const corner = cornerNumber === null ? null : corners.get(cornerNumber);
  if (!style || (cornerNumber !== null && !corner)) throw new Error(`Missing style ${styleId} or corner ${cornerNumber}`);
  const radius = Math.min(28 * Number(style.light['--shape-scale'] ?? 1), 56);
  const shipped = radius
    ? `M${radius} 0 H${440 - radius} A${radius} ${radius} 0 0 1 440 ${radius} V${280 - radius} A${radius} ${radius} 0 0 1 ${440 - radius} 280 H${radius} A${radius} ${radius} 0 0 1 0 ${280 - radius} V${radius} A${radius} ${radius} 0 0 1 ${radius} 0 Z`
    : 'M0 0 H440 V280 H0 Z';
  const path = corner ? corner.path : shipped;
  const label = corner ? corner.caption : 'the shipped card';
  const photoFree = style.photo === null || (!has(style.id, 'light') && !has(style.id, 'dark'));
  return [
    `<article class="sc-tile${photoFree ? ' sc-nophoto' : ''}" id="s-${style.id}" data-name="${esc(style.name)}">`,
    '  <div class="sc-scene">',
    '    <div class="sc-paper"></div>',
    '    <div class="sc-photo"></div>',
    `    <svg class="sc-card" viewBox="0 0 ${VIEW_W} ${VIEW_H}" role="img" aria-label="${esc(style.name)}, ${esc(label)}">`,
    `      <defs><clipPath id="clip-${style.id}"><path d="${path}"/></clipPath></defs>`,
    `      <path class="sc-fill" d="${path}"/>`,
    `      <g clip-path="url(#clip-${style.id})"><path class="sc-edge" d="${path}"/></g>`,
    '      <text class="sc-eyebrow" x="64" y="100">VOLGENDE TRET</text>',
    '      <text class="sc-title" x="64" y="136">Amsterdam Zuid</text>',
    '      <text class="sc-sub" x="64" y="156">Utrecht Centraal · spoor 4</text>',
    '      <rect class="sc-pill" x="64" y="174" width="78" height="26" rx="13"/>',
    '      <text class="sc-pill-label" x="103" y="191" text-anchor="middle">Direct</text>',
    '      <text class="sc-time" x="376" y="191" text-anchor="end">09:12</text>',
    '    </svg>',
    '  </div>',
    `  <p class="sc-meta"><b>${esc(style.name)}</b><span>${esc(note)}${photoFree ? ' · colour only' : ''}</span></p>`,
    '</article>',
  ].join('\n');
}

/* ---------------------------------------------------------------- the page */

const tiles = [];
for (const style of styles) tiles.push(tile(style.id, null, 'Shipped card'));

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
<link rel="stylesheet" href="tokens.css">
<link rel="stylesheet" href="fonts.css">
<link rel="stylesheet" href="base.css">
<link rel="stylesheet" href="components.css">
<style>
  /* The page shell wears the app's own tokens, so it changes with the switch like the app does. */
  :root { ${shellVars('light')} }
  [data-appearance="dark"] { ${shellVars('dark')}; color-scheme: dark }
  body { background: var(--canvas-base) }
  .sc-wrap { max-width: 1120px; margin: 0 auto; padding: var(--s-8, 32px) var(--s-5, 20px) 72px }
  .sc-head { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: var(--s-4, 16px) }
  .sc-switches { display: flex; flex-wrap: wrap; gap: var(--s-2, 8px) }
  .sc-lede { margin: var(--s-2, 8px) 0 0; max-width: 62ch; color: var(--ink-muted); font-size: var(--fs-body, 15px); line-height: 1.5 }
  .sc-plan { list-style: none; margin: var(--s-2, 8px) 0 0; padding: 0; columns: 3; column-gap: var(--s-5, 20px) }
  .sc-plan li { break-inside: avoid; padding: var(--s-1, 4px) 0 var(--s-3, 12px); border-top: 1px solid var(--border-hairline) }
  .sc-plan b { display: block; font-size: var(--fs-caption, 12px); font-weight: var(--fw-bold, 700); line-height: 1.3 }
  .sc-chips { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px }
  .sc-chip { display: inline-block; padding: 2px 10px; border: 1px solid var(--border-hairline); border-radius: var(--r-pill, 9999px);
    font-size: var(--fs-pill, 11px); font-weight: var(--fw-bold, 700); letter-spacing: var(--track-pill, 0.01em); text-transform: uppercase;
    color: var(--ink-muted); text-decoration: none; background: var(--l1-bg) }
  .sc-chip:hover { color: var(--ink-strong); border-color: var(--ink-muted) }
  .sc-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--s-5, 20px); margin-top: var(--s-5, 20px) }
  .sc-tile { margin: 0 }
  .sc-scene { position: relative; overflow: hidden; border: 1px solid var(--border-hairline); border-radius: var(--r-card, 28px); padding: var(--s-7, 28px); background: var(--canvas) }
  .sc-paper { position: absolute; inset: 0; background: var(--canvas) }
  .sc-photo { position: absolute; inset: 0; background-image: linear-gradient(var(--wash), var(--wash)), var(--photo);
    background-size: cover; background-position: center }
  [data-wallpaper="colour"] .sc-photo { display: none }
  .sc-nophoto .sc-photo { display: none }
  .sc-card { position: relative; display: block; width: 100%; height: auto }
  .sc-fill { fill: var(--card) }
  .sc-edge { fill: none; stroke: var(--line); stroke-width: var(--line-width); stroke-linejoin: miter }
  .sc-eyebrow { fill: var(--ink-faint); font-family: var(--font-body); font-size: 8.5px; letter-spacing: 0.14em }
  .sc-title { fill: var(--ink-strong); font-family: var(--font-display); font-size: 24px; font-weight: 800; letter-spacing: -0.02em }
  .sc-sub { fill: var(--ink-muted); font-family: var(--font-body); font-size: 11.5px }
  .sc-pill { fill: var(--accent) }
  .sc-pill-label { fill: var(--on-accent); font-family: var(--font-body); font-size: 10.5px; font-weight: 600 }
  .sc-time { fill: var(--ink-muted); font-family: var(--font-body); font-size: 11px; font-weight: 600 }
  .sc-meta { display: flex; align-items: baseline; gap: 8px; margin: var(--s-2, 8px) 2px 0 }
  .sc-meta b { font-size: var(--fs-caption, 13px) }
  .sc-meta span { font-size: var(--fs-pill, 11px); color: var(--ink-faint) }
  h2 { margin: var(--s-8, 32px) 0 var(--s-2, 8px); font-size: var(--section-size, 16px); font-weight: var(--section-weight, 700) }
  @media (max-width: 760px) { .sc-grid, .sc-plan { grid-template-columns: 1fr; columns: 1 } .sc-wrap { padding: 24px 16px 56px } }
${styleRules.map((rule) => `  ${rule}`).join('\n')}
</style>
</head>
<body>
<main class="sc-wrap">
  <div class="sc-head">
    <div>
      <h1>Thirty styles, one card</h1>
      <p class="sc-lede">Every style's own page, with the card that already ships sitting on it, in that style's own colours.</p>
    </div>
    <div class="sc-switches">
      <div class="segmented" role="group" aria-label="Appearance">
        <button type="button" class="segmented__btn" data-set="appearance" data-value="light" aria-pressed="true">Light</button>
        <button type="button" class="segmented__btn" data-set="appearance" data-value="dark" aria-pressed="false">Dark</button>
      </div>
      <div class="segmented" role="group" aria-label="Background">
        <button type="button" class="segmented__btn" data-set="wallpaper" data-value="colour" aria-pressed="true">Colour</button>
        <button type="button" class="segmented__btn" data-set="wallpaper" data-value="photo" aria-pressed="false">Photo</button>
      </div>
    </div>
  </div>

  <div class="sc-grid">
    ${tiles.join('\n    ')}
  </div>
</main>
<script>
  for (const button of document.querySelectorAll('.segmented__btn')) {
    button.addEventListener('click', () => {
      const group = button.closest('.segmented');
      for (const sibling of group.querySelectorAll('.segmented__btn')) sibling.setAttribute('aria-pressed', String(sibling === button));
      document.documentElement.dataset[button.dataset.set] = button.dataset.value;
    });
  }
</script>
</body>
</html>
`;

mkdirSync(OUT, { recursive: true });
mkdirSync(`${OUT}/photos`, { recursive: true });
for (const file of STYLES_CSS) {
  if (existsSync(`src/styles/${file}`)) copyFileSync(`src/styles/${file}`, `${OUT}/${file}`);
}
if (existsSync('public/fonts')) {
  mkdirSync(`${OUT}/fonts`, { recursive: true });
  for (const name of readdirSync('public/fonts')) {
    if (name.endsWith('.woff2')) copyFileSync(`public/fonts/${name}`, `${OUT}/fonts/${name}`);
  }
}
for (const name of readdirSync(PHOTOS).filter((entry) => entry.endsWith('.jpg'))) {
  copyFileSync(`${PHOTOS}/${name}`, `${OUT}/photos/${name}`);
}
writeFileSync(PAGE, html);
mkdirSync('design', { recursive: true });
writeFileSync(SAVED, html);
console.log(`${tiles.length} tiles written to ${PAGE}`);
