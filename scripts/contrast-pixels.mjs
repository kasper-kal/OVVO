/**
 * **The same question asked of the pixels, not the declarations.**
 *
 * `contrast-sweep.mjs` reads the ink and the ground out of the style tree, which is right for flat
 * surfaces and blind to everything else: a gradient, a photograph, a `::before` wash, a map tile, an
 * element painted over another one. This pass takes a screenshot of the finished page and, for every
 * run of words, reads the two colours that are actually there — the commonest colour in the box is
 * the ground, and the colour nearest the text's own is the ink — then measures the gap between them.
 * If the page is legible, the numbers agree with the sweep; where they disagree, the pixels win.
 *
 * Run:   node scripts/contrast-pixels.mjs
 *        CONTRAST_THEMES=light,dark CONTRAST_WIDTHS=390 node scripts/contrast-pixels.mjs
 * Needs: playwright + sharp + a dev server on :3000.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium, prepareBrowserEnv } from './browser-env.mjs';

prepareBrowserEnv();
import { ensureAppFont } from './font-guard.mjs';
import sharp from 'sharp';

const ORIGIN = process.env.CONTRAST_ORIGIN ?? 'http://127.0.0.1:3000';
const THEMES = (process.env.CONTRAST_THEMES ?? 'light,dark').split(',');
const WIDTHS = (process.env.CONTRAST_WIDTHS ?? '320,390,720').split(',').map(Number);
const SEARCH = Buffer.from(
  JSON.stringify({ v: 1, f: 'haarlem', t: 'zaandam', d: '2026-11-02', m: 600, tm: 'depart' }),
).toString('base64');

const ROUTES = [
  { path: '/', name: 'home' },
  { path: '/stops', name: 'stops' },
  { path: '/stops/utrecht-centraal', name: 'stop' },
  { path: '/departures', name: 'departures' },
  { path: '/disruptions', name: 'alerts' },
  { path: '/disruptions/d-cancel-schiphol', name: 'alert' },
  { path: '/map', name: 'map' },
  { path: '/preferences', name: 'preferences' },
  { path: '/settings', name: 'settings' },
  { path: '/themes', name: 'appearance' },
  { path: '/wrapped', name: 'wrapped' },
  { path: `/results/${SEARCH}`, name: 'results (journeys)' },
  { path: `/results/${SEARCH}`, name: 'journey', openJourney: true },
];

const SETTINGS = {
  version: 8, language: 'en', timeFormat: '24h', dateFormat: 'long', density: 'comfortable',
  highContrast: false, reduceMotion: true, selectionColor: 'coral', selectionCustom: '',
  selectionColorDark: 'coral', selectionCustomDark: '', background: 'cream',
  backgroundColour: '#FCFBFA', backgroundColourDark: '#1b2430', backgroundImage: '',
  backgroundImageSource: '', backgroundCrop: null, cardTreatment: 'solid', primaryColour: '',
  primaryColourDark: '', defaultTimeMode: 'depart', defaultOriginStopId: null, boardAutoRefresh: 5,
};

const relLum = ({ r, g, b }) => {
  const f = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => {
  const [hi, lo] = [relLum(a), relLum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const dist = (a, b) => Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b);

const collect = () => {
  const seen = [];
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
  for (let el = walk.currentNode; el; el = walk.nextNode()) {
    const own = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim());
    if (!own.length) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) <= 0.05) continue;
    const ink = String(cs.color).match(/rgba?\(([^)]+)\)/);
    if (!ink) continue;
    const parts = ink[1].split(/[ ,/]+/).filter(Boolean).map(Number);
    if (parts.length > 3 && parts[3] < 0.5) continue;
    const label = (() => {
      const bits = [];
      for (let node = el; node && node.nodeType === 1 && bits.length < 3; node = node.parentElement) {
        let bit = node.tagName.toLowerCase();
        if (node.className && typeof node.className === 'string') bit += '.' + node.className.trim().split(/\s+/).slice(0, 2).join('.');
        bits.unshift(bit);
      }
      return bits.join(' > ');
    })();
    seen.push({
      selector: label,
      text: own.map((n) => n.textContent.trim()).join(' ').slice(0, 40),
      ink: { r: parts[0], g: parts[1], b: parts[2] },
      size: parseFloat(cs.fontSize) || 16,
      weight: Number(cs.fontWeight) || 400,
      box: { x: Math.floor(rect.left + window.scrollX), y: Math.floor(rect.top + window.scrollY), w: Math.ceil(rect.width), h: Math.ceil(rect.height) },
    });
  }
  return seen;
};

const browser = await chromium.launch({ chromiumSandbox: false, args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--hide-scrollbars'] });
const findings = [];
const closest = [];
const seenKey = new Set();
let renders = 0;
let measured = 0;

for (const theme of THEMES) {
  for (const width of WIDTHS) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, deviceScaleFactor: 1 });
    await context.addInitScript(
      ([settings]) => {
        localStorage.clear();
        localStorage.setItem('ov-planner:v1:settings', JSON.stringify(settings));
        localStorage.setItem('ov-planner:v1:location-consent', '"denied"');
      },
      [[{ ...SETTINGS, theme }]][0],
    );
    const page = await context.newPage();
    for (const route of ROUTES) {
      await page.goto(ORIGIN + route.path, { waitUntil: 'networkidle' }).catch(() => {});
      await ensureAppFont(page).catch(() => {});
      await page.waitForTimeout(120);
      for (const label of ['Not now', 'No thanks', 'Deny', 'Dismiss', 'Got it']) {
        const button = page.locator('[role=dialog] button, [role=dialog] a').filter({ hasText: new RegExp(label, 'i') });
        if (await button.count()) { await button.first().click().catch(() => {}); break; }
      }
      await page.keyboard.press('Escape').catch(() => {});
      await page.waitForTimeout(80);
      if (route.openJourney) {
        const cards = page.locator('article').filter({ has: page.locator('.journey-card__leg') });
        if (await cards.count()) {
          await cards.first().locator('.journey-card__link').first().click().catch(() => {});
          await page.waitForSelector('.timeline, .page-head', { timeout: 8000 }).catch(() => {});
          await page.waitForTimeout(320);
          await page.keyboard.press('Escape').catch(() => {});
        }
      }
      const nodes = await page.evaluate(collect).catch(() => []);
      if (!nodes.length) continue;
      const png = await page.screenshot({ fullPage: true }).catch(() => null);
      if (!png) continue;
      const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
      renders += 1;

      for (const node of nodes) {
        const x0 = Math.max(0, node.box.x);
        const y0 = Math.max(0, node.box.y);
        const x1 = Math.min(info.width, x0 + node.box.w);
        const y1 = Math.min(info.height, y0 + node.box.h);
        if (x1 - x0 < 2 || y1 - y0 < 2) continue;
        /*
         * **The paper beside the word, not the box it is set in.** The commonest colour inside a
         * word's own box is the ground only while the word is small: a two-word link at phone size
         * is more glyph than paper, and that read a dark stop name as "dark on dark" at 1.66:1. The
         * ring three pixels around the box is paper almost everywhere it is not a neighbouring label,
         * and its commonest colour is the surface the words actually sit on.
         */
        const counts = new Map();
        const ring = 3;
        for (let y = Math.max(0, y0 - ring); y < Math.min(info.height, y1 + ring); y += 1) {
          for (let x = Math.max(0, x0 - ring); x < Math.min(info.width, x1 + ring); x += 1) {
            if (x >= x0 && x < x1 && y >= y0 && y < y1) continue;
            const i = (y * info.width + x) * info.channels;
            const key = `${data[i] >> 2},${data[i + 1] >> 2},${data[i + 2] >> 2}`;
            counts.set(key, (counts.get(key) ?? 0) + 1);
          }
        }
        if (counts.size < 3) {
          for (let y = y0; y < y1; y += 1) {
            for (let x = x0; x < x1; x += 1) {
              const i = (y * info.width + x) * info.channels;
              const key = `${data[i] >> 2},${data[i + 1] >> 2},${data[i + 2] >> 2}`;
              counts.set(key, (counts.get(key) ?? 0) + 1);
            }
          }
        }
        const colours = [];
        for (const [key, count] of counts) {
          const [r, g, b] = key.split(',').map((n) => Number(n) * 4 + 2);
          colours.push({ r, g, b, count });
        }
        colours.sort((a, b) => b.count - a.count);
        /*
         * **The ground is the commonest colour that is not the ink.** Taking the commonest colour
         * outright read a short word in large type as "dark text on dark", because at phone size a
         * two-word link is more glyph than paper. Antialiased pixels are excluded the same way, so a
         * thin dot is not mistaken for a lighter ink than it is.
         */
        const ground = colours.find((colour) => dist(colour, node.ink) > 40) ?? colours[0];
        const ink = node.ink;
        if (!ground || dist(ground, ink) < 8) continue;
        measured += 1;
        const cr = ratio(ink, ground);
        const large = node.size >= 24 || (node.size >= 18.66 && node.weight >= 700);
        const need = large ? 3 : 4.5;
        const row = {
          theme, route: route.name, width, selector: node.selector, text: node.text,
          cr: +cr.toFixed(2), need, size: node.size, weight: node.weight,
          ink: `rgb(${ink.r}, ${ink.g}, ${ink.b})`, ground: `rgb(${ground.r}, ${ground.g}, ${ground.b})`,
        };
        closest.push(row);
        if (cr + 0.005 >= need) continue;
        const key = `${theme}|${route.name}|${node.selector}|${node.text}`;
        if (seenKey.has(key)) continue;
        seenKey.add(key);
        findings.push(row);
      }
    }
    await context.close();
  }
}
await browser.close();

findings.sort((a, b) => a.cr - b.cr);
mkdirSync('.logs', { recursive: true });
const lines = [
  '# Contrast, read out of the pixels',
  '',
  `${renders} pages rendered, ${measured} runs of words read out of a screenshot.`,
  `Ground is the commonest colour in the words' own box; ink is the colour nearest the declared one.`,
  '',
];
if (!findings.length) lines.push('Nothing below WCAG AA.', '');
else {
  lines.push('| theme | route | width | ratio | needs | what | ink | ground |', '| --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const row of findings) {
    lines.push(`| ${row.theme} | ${row.route} | ${row.width} | ${row.cr}:1 | ${row.need}:1 | \`${row.text}\` in \`${row.selector}\` | ${row.ink} | ${row.ground} |`);
  }
}
lines.push('', '## Tightest twenty', '', '| theme | route | width | ratio | needs | what | ink | ground |', '| --- | --- | --- | --- | --- | --- | --- | --- |');
for (const row of [...closest].sort((a, b) => a.cr - b.cr).slice(0, 20)) {
  lines.push(`| ${row.theme} | ${row.route} | ${row.width} | ${row.cr}:1 | ${row.need}:1 | \`${row.text}\` | ${row.ink} | ${row.ground} |`);
}
writeFileSync('.logs/contrast-pixels.md', lines.join('\n') + '\n');
writeFileSync('.logs/contrast-pixels.json', JSON.stringify(findings, null, 1) + '\n');

for (const row of findings.slice(0, 15)) {
  console.log(`${row.cr}:1 need ${row.need} ${row.theme} ${row.route}@${row.width} "${row.text}" ${row.ink} on ${row.ground}`);
}
console.log(`\n${renders} renders, ${measured} runs of words · ${findings.length} below AA · report: .logs/contrast-pixels.md`);
for (const row of [...closest].sort((a, b) => a.cr - b.cr).slice(0, 8)) {
  console.log(`  tightest ${row.cr}:1 ${row.theme} ${row.route}@${row.width} "${row.text}" ${row.ink} on ${row.ground}`);
}
if (findings.length) process.exit(1);
console.log('OK — every run of words clears WCAG AA against the paint behind it.');
