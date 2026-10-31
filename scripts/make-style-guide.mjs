/**
 * Build the style list PDF from the app's own definitions.
 *
 * Reads `src/lib/styles.ts` (the catalogue, the font stacks, the authored quartets), renders the
 * pages with the real faces and the real hexes, and prints them with Chromium. Nothing here is
 * transcribed by hand: a colour or face that changes in the app changes in this file.
 */
import { readFile, writeFile, readdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const raw = await readFile(path.join(ROOT, 'src/lib/styles.ts'), 'utf8');
/* Two entries can share a line, written `},  {`; give each its own so the block reader below sees
   both of them. Without this, Toscane was silently missing from the printed list. */
const source = raw.replace(/},\s*\{/g, '},\n  {');

/* ---------------------------------------------------------------- the data */

const stacks = Object.fromEntries(
  [...source.matchAll(/^ {2}([a-z]+): "([^"]+)",$/gm)].map((m) => [m[1], m[2]]),
);

const groups = Object.fromEntries(
  [...source.matchAll(/id: '([a-z]+)',\s*\n\s*label: '([^']+)',[\s\S]*?note: '([^']+)',/g)].map((m) => [
    m[1],
    { label: m[2], note: m[3] },
  ]),
);

const styles = [];
for (const match of source.matchAll(/\n  \{\n([\s\S]*?)\n  \},/g)) {
  const block = match[1];
  const id = block.match(/id: '([^']+)'/)?.[1];
  if (!id || !/display: '[a-z]+'/.test(block)) continue;
  const quad = [...(block.match(/light: \[([^\]]+)\]/)?.[1] ?? '').matchAll(/'([^']+)'/g)].map((m) => m[1]);
  if (quad.length !== 4) continue;
  styles.push({
    id,
    name: block.match(/name: '([^']+)'/)?.[1] ?? id,
    group: block.match(/group: '([a-z]+)'/)?.[1] ?? 'basic',
    display: block.match(/display: '([a-z]+)'/)?.[1],
    sub: block.match(/sub: '([a-z]+)'/)?.[1],
    body: block.match(/body: '([a-z]+)'/)?.[1],
    quad,
  });
}

const photoDir = path.join(ROOT, 'public/style-photos');
const photos = new Set((await readdir(photoDir)).filter((f) => f.endsWith('.jpg') && !f.includes('-night')));

const family = (stack) => (stack.match(/^'([^']+)'/) || [null, stack])[1];
const esc = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const billion = (hex) => {
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.replace('#', '').slice(i, i + 2), 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const fontsCss = await readFile(path.join(ROOT, 'src/styles/fonts.css'), 'utf8');

/* ---------------------------------------------------------------- the pieces */

const chips = (quad, styleId) =>
  ['Page', 'Card', 'Ink', 'Accent']
    .map(
      (label, index) => `
      <div class="chip">
        <span class="chip__well" style="background:${quad[index]}${billion(quad[index]) > 200 ? ';border-color:#c9c3b6' : ''}"></span>
        <span class="chip__label">${label}</span>
        <span class="chip__hex">${quad[index].toUpperCase()}</span>
      </div>`,
    )
    .join('') + (photos.has(`${styleId}.jpg`) ? `<img class="photo" src="/style-photos/${styleId}.jpg" alt="" />` : '');

const card = (style, index) => `
  <section class="style ${index % 2 === 0 ? 'style--first' : ''}">
    <header class="style__head">
      <h2 class="style__name" style="font-family:${stacks[style.display]}">${esc(style.name)}</h2>
      <span class="style__group">${esc(groups[style.group]?.label ?? style.group)}</span>
    </header>
    <p class="style__note" style="font-family:${stacks[style.body]}">${esc(groups[style.group]?.note ?? '')}</p>
    <div class="faces">
      <div class="face">
        <span class="face__role">Header</span>
        <span class="face__sample face__sample--head" style="font-family:${stacks[style.display]}">Home</span>
        <span class="face__family">${esc(family(stacks[style.display]))}</span>
      </div>
      <div class="face">
        <span class="face__role">Subtitle</span>
        <span class="face__sample face__sample--sub" style="font-family:${stacks[style.sub]}">Next departures</span>
        <span class="face__family">${esc(family(stacks[style.sub]))}</span>
      </div>
      <div class="face">
        <span class="face__role">Body text</span>
        <span class="face__sample face__sample--body" style="font-family:${stacks[style.body]}">Tram 2 to Centraal, four minutes late.</span>
        <span class="face__family">${esc(family(stacks[style.body]))}</span>
      </div>
    </div>
    <div class="palette">${chips(style.quad, style.id)}</div>
  </section>`;

const row = (style) => `<tr>
      <td class="t-name">${esc(style.name)}</td>
      <td>${esc(family(stacks[style.display]))}</td>
      <td>${esc(family(stacks[style.sub]))}</td>
      <td>${esc(family(stacks[style.body]))}</td>
      <td class="t-swatch">${style.quad.map((c) => `<i style="background:${c}"></i>`).join('')}</td>
    </tr>`;
const half = Math.ceil(styles.length / 2);
const tableColumns = [styles.slice(0, half), styles.slice(half)];

const coverStrips = styles
  .map(
    (style) =>
      `<li><span class="strip">${style.quad
        .map((c) => `<i style="background:${c}"></i>`)
        .join('')}</span><b style="font-family:${stacks[style.display]}">${esc(style.name)}</b></li>`,
  )
  .join('');

const allFamilies = new Set(styles.flatMap((s) => [s.display, s.sub, s.body]));

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<title>OVVO style list</title>
<style>
${fontsCss}
@page { size: A4; margin: 14mm 13mm 16mm; }
* { box-sizing: border-box; }
html, body { margin: 0; }
body {
  font-family: 'Inter', system-ui, sans-serif;
  color: #18181b;
  background: #fff;
  font-size: 9.5pt;
  line-height: 1.45;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.page { page-break-after: always; }
.page:last-child { page-break-after: auto; }

.cover { display: flex; flex-direction: column; min-height: 250mm; }
.cover__mark { display: grid; grid-template-columns: repeat(2, 12mm); gap: 1.3mm; margin-bottom: 14mm; }
.cover__mark span { height: 12mm; background: #18181b; color: #fff; display: grid; place-items: center; font-weight: 800; font-size: 13.5pt; letter-spacing: 0.02em; }
.cover h1 { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 39pt; line-height: 1.02; letter-spacing: -0.03em; margin: 0 0 5mm; }
.cover p.lede { font-size: 11.5pt; color: #4a4a50; max-width: 130mm; margin: 0 0 12mm; }
.cover__facts { display: flex; gap: 15mm; margin-bottom: 12mm; }
.cover__fact b { display: block; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 19pt; font-weight: 700; line-height: 1.1; }
.cover__fact span { font-size: 8.2pt; text-transform: uppercase; letter-spacing: 0.08em; color: #66666d; }
.cover__grid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(3, 1fr); gap: 2.8mm 5mm; }
.cover__grid li { display: flex; align-items: center; gap: 2.4mm; font-size: 7.9pt; min-width: 0; }
.cover__grid b { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.strip { display: flex; width: 12.5mm; height: 4.2mm; border-radius: 1.6mm; overflow: hidden; flex: none; border: 0.3mm solid #e6e0d4; }
.strip i { flex: 1; }

h2.page-title { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 21pt; letter-spacing: -0.02em; margin: 0 0 2mm; }
p.page-lede { color: #55555c; margin: 0 0 5.5mm; max-width: 152mm; }
.tables { display: flex; gap: 7mm; align-items: flex-start; }
table { width: 100%; border-collapse: collapse; font-size: 7.4pt; }
th { text-align: left; font-size: 7.4pt; text-transform: uppercase; letter-spacing: 0.08em; color: #66666d; padding: 0 2mm 2mm 0; border-bottom: 0.3mm solid #cdc7b8; font-weight: 700; }
td { padding: 0.9mm 1.6mm 0.9mm 0; border-bottom: 0.2mm solid #ece7dc; vertical-align: middle; }
.t-name { font-weight: 600; }
.t-swatch { width: 18mm; white-space: nowrap; }
.t-swatch i { display: inline-block; width: 2.9mm; height: 2.9mm; border-radius: 0.8mm; margin-right: 0.5mm; border: 0.2mm solid #00000012; }

.style { border-top: 0.5mm solid #18181b; padding: 5mm 0 6mm; page-break-inside: avoid; }
.style--first { border-top-width: 0.9mm; }
.style__head { display: flex; align-items: baseline; justify-content: space-between; gap: 4mm; }
.style__name { font-size: 21pt; font-weight: 700; letter-spacing: -0.01em; margin: 0; line-height: 1.05; }
.style__group { font-size: 7.3pt; text-transform: uppercase; letter-spacing: 0.1em; color: #66666d; font-weight: 700; white-space: nowrap; }
.style__note { color: #5a5a61; margin: 1.6mm 0 3.6mm; font-size: 9pt; }
.faces { display: grid; grid-template-columns: 1fr 1fr 1.15fr; gap: 4mm; margin-bottom: 4.2mm; }
.face { display: flex; flex-direction: column; gap: 0.7mm; min-width: 0; }
.face__role { font-size: 6.8pt; letter-spacing: 0.1em; text-transform: uppercase; color: #8a8a90; font-weight: 700; }
.face__sample { color: #18181b; }
.face__sample--head { font-size: 20pt; line-height: 1.05; }
.face__sample--sub { font-size: 12.5pt; line-height: 1.15; font-weight: 600; }
.face__sample--body { font-size: 9.2pt; line-height: 1.3; color: #3f3f45; }
.face__family { font-size: 7.5pt; color: #66666d; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.palette { display: flex; align-items: flex-end; gap: 3mm; }
.chip { display: flex; flex-direction: column; gap: 0.9mm; width: 23mm; }
.chip__well { height: 11mm; border-radius: 2.2mm; border: 0.3mm solid #00000014; }
.chip__label { font-size: 6.9pt; text-transform: uppercase; letter-spacing: 0.08em; color: #7b7b82; font-weight: 700; }
.chip__hex { font-family: 'IBM Plex Mono', monospace; font-size: 7.3pt; color: #3f3f45; }
.photo { width: 26mm; height: 14mm; object-fit: cover; border-radius: 2.2mm; margin-left: auto; border: 0.3mm solid #00000014; }
.colophon { margin-top: 6mm; border-top: 0.3mm solid #cdc7b8; padding-top: 3mm; font-size: 7.8pt; color: #66666d; display: flex; justify-content: space-between; }
</style></head>
<body>

<div class="page cover">
  <div class="cover__mark"><span>OV</span><span>VO</span></div>
  <h1>The looks,<br />type and colour.</h1>
  <p class="lede">Every OVVO style, with the three faces it draws with and the four colours it is built from. The samples are set in the faces themselves; the hexes are the values the app writes.</p>
  <div class="cover__facts">
    <div class="cover__fact"><b>${styles.length}</b><span>styles</span></div>
    <div class="cover__fact"><b>${allFamilies.size}</b><span>font families</span></div>
    <div class="cover__fact"><b>${photos.size}</b><span>photographs</span></div>
  </div>
  <ul class="cover__grid">${coverStrips}</ul>
</div>

<div class="page">
  <h2 class="page-title">Three faces, every style.</h2>
  <p class="page-lede">Header sets the page title and the look's own name. Subtitle sets section and card headings. Body sets every sentence, label and control. No style borrows a face from its neighbour: each names all three, and the gate fails any style that repeats one.</p>
  <div class="tables">
    ${tableColumns
      .map(
        (column) => `<table>
      <thead><tr><th>Style</th><th>Header</th><th>Subtitle</th><th>Body</th><th>Palette</th></tr></thead>
      <tbody>${column.map(row).join('')}</tbody>
    </table>`,
      )
      .join('')}
  </div>
  <div class="colophon"><span>OVVO style list</span><span>Generated from the app's own catalogue</span></div>
</div>

${(() => {
  const pages = [];
  for (let index = 0; index < styles.length; index += 2) {
    pages.push(`<div class="page">
      ${styles.slice(index, index + 2).map((style, at) => card(style, at)).join('')}
      <div class="colophon"><span>OVVO style list</span><span>${index + 1} to ${Math.min(index + 2, styles.length)} of ${styles.length}</span></div>
    </div>`);
  }
  return pages.join('\n');
})()}

</body></html>`;

await writeFile(path.join(ROOT, 'public/__style-report.html'), html, 'utf8');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1000, height: 1400 } });
const errors = [];
page.on('pageerror', (error) => errors.push(String(error)));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});

await page.goto('http://127.0.0.1:3000/__style-report.html', { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1000);

const loaded = await page.evaluate(() =>
  [...document.fonts].filter((face) => face.status === 'loaded').map((face) => face.family),
);
console.log('fonts loaded:', [...new Set(loaded)].sort().join(', ') || 'none');
console.log('styles rendered:', styles.length, '| groups:', new Set(styles.map((s) => s.group)).size);
if (errors.length) console.log('page errors:', errors.slice(0, 4).join(' | '));
console.log('short of three faces:', styles.filter((s) => new Set([s.display, s.sub, s.body]).size < 3).map((s) => s.id));

/*
 * Measure at the printed width before printing: A4 is 210mm, and a block that spills is a block
 * whose colours get cut in half on paper. 297mm of page less the 14mm and 16mm margins leaves
 * about 1009px at 96dpi.
 */
/*
 * Measure the way the printer will lay it out, not the way the screen does. The screen copy is
 * 794px wide (A4 at 96dpi) with no margins, so a page that fits here can still spill in print,
 * where the side margins leave about 696px: that is how the colour table's colophon ended up alone
 * on a page of its own, with a blank page in front of the first style cards.
 */
await page.emulateMedia({ media: 'print' });
await page.setViewportSize({ width: 696, height: 1123 });
await page.waitForTimeout(400);
const coverOverflow = await page.evaluate(() => {
  const cover = document.querySelector('.cover');
  return cover ? Math.round(cover.scrollHeight - cover.clientHeight) : 0;
});
console.log('cover overflow (px):', coverOverflow);
const heights = await page.evaluate(() =>
  [...document.querySelectorAll('.page')].map((node) => Math.round(node.getBoundingClientRect().height)),
);
const tall = heights.map((h, i) => [i + 1, h]).filter(([, h]) => h > 1009);
console.log('page heights:', heights.join(', '));
console.log('overflowing pages:', tall.length ? JSON.stringify(tall) : 'none');
for (const index of [0, 1, 2, 16]) {
  const node = page.locator('.page').nth(index);
  if (await node.count()) await node.screenshot({ path: `.logs/mock/report-page-${index + 1}.png` });
}

await page.pdf({
  path: path.join(ROOT, 'OVVO-style-list.pdf'),
  format: 'A4',
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: '<div></div>',
  footerTemplate:
    '<div style="width:100%;font:7.5pt Inter,sans-serif;color:#8a8a90;padding:0 13mm;display:flex;justify-content:space-between;"><span>OVVO · style list</span><span class="pageNumber"></span></div>',
  margin: { top: '14mm', bottom: '16mm', left: '13mm', right: '13mm' },
});

await browser.close();
await unlink(path.join(ROOT, 'public/__style-report.html'));
console.log('pdf written: OVVO-style-list.pdf');
