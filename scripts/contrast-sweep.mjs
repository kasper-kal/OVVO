/**
 * **Every word and every icon, on every screen, in every appearance, at every width.**
 *
 * `ui-audit.mjs` measures contrast on the routes it is given, in one appearance, and it is the gate
 * for the ordinary run. This is the deep one, written for the question "are there contrast issues
 * left and right?" — it does not trust a single surface:
 *
 *   • **Six appearances.** Light, dark, light raised, dark raised, and two pages the traveller
 *     paints themselves (a tinted canvas with widgets following it, and a tinted canvas holding a
 *     different widget colour). The high-contrast flag re-derives every ink, so it is measured
 *     rather than assumed.
 *   • **Every route**, plus the two screens that need a real search to exist at all: the results
 *     list with journey cards on it, and a journey's detail page, opened the way a traveller opens
 *     it. A pasted `/journey/j1` on a cold browser only ever renders its empty state, which is why
 *     that screen's own type was never in front of a contrast check.
 *   • **Four widths**, including 320 and 720 — the two sides of the one breakpoint, where a size
 *     class can change a threshold from 4.5:1 to 3:1.
 *
 * What it asks of each node: the painted colour of the words against the painted colour *behind*
 * them. The ground is composited through the ancestor chain — every translucent layer, in order —
 * and when the chain reaches a gradient or a photograph the answer is read out of the rendered
 * pixels instead of the declarations, because a `linear-gradient` has no colour to do arithmetic
 * on. The mode of a small screenshot of the node's own box is the ground: the glyphs are a minority
 * of the pixels they sit in, so the commonest colour is what is behind them.
 *
 * Thresholds are WCAG AA: 4.5:1 for body text, 3:1 for large text (24px, or 18.66px bold) and for
 * icons, which are graphics and answer to the 3:1 rule.
 *
 * Run:   node scripts/contrast-sweep.mjs                 (the whole matrix, a quarter of an hour)
 *        CONTRAST_THEMES=light,dark CONTRAST_ROUTES=/ CONTRAST_WIDTHS=390   (a quick look)
 * Needs: playwright + sharp + a dev server on :3000.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium, prepareBrowserEnv } from './browser-env.mjs';

prepareBrowserEnv();
import { ensureAppFont } from './font-guard.mjs';
import sharp from 'sharp';

const ORIGIN = process.env.CONTRAST_ORIGIN ?? 'http://127.0.0.1:3000';
const WIDTHS = (process.env.CONTRAST_WIDTHS ?? '320,390,720,1440').split(',').map(Number).filter(Boolean);
const THEMES = (process.env.CONTRAST_THEMES ?? 'light,dark,light-hc,dark-hc,tint,tint-split,photo,glass').split(',');
const ONLY = process.env.CONTRAST_ROUTES ? process.env.CONTRAST_ROUTES.split(',') : null;

/** A search the app really performs, used for the two screens that only exist after one. */
const SEARCH = Buffer.from(
  JSON.stringify({ v: 1, f: 'haarlem', t: 'zaandam', d: '2026-11-02', m: 600, tm: 'depart' }),
).toString('base64');

/**
 * Each appearance is the settings a traveller's device would hold: the theme, the raised flag, and
 * the page colour. `tint` is the periwinkle page with the widgets following it; `tint-split` is the
 * same page holding ivory widgets, which is the combination that once drew an ivory badge on ivory.
 */
/* A gradient from warm stone to slate: light at one end, dark at the other, like a real photograph. */
const PHOTO =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#efe3d2"/><stop offset="0.45" stop-color="#8d7c68"/><stop offset="1" stop-color="#33414f"/></linearGradient></defs><rect width="900" height="1400" fill="url(#g)"/></svg>',
  );

const APPEARANCES = {
  light: { theme: 'light', highContrast: false, background: 'cream', backgroundColour: '#FCFBFA', primaryColour: '' },
  dark: { theme: 'dark', highContrast: false, background: 'cream', backgroundColour: '#FCFBFA', primaryColour: '' },
  'light-hc': { theme: 'light', highContrast: true, background: 'cream', backgroundColour: '#FCFBFA', primaryColour: '' },
  'dark-hc': { theme: 'dark', highContrast: true, background: 'cream', backgroundColour: '#FCFBFA', primaryColour: '' },
  tint: { theme: 'light', highContrast: false, background: 'colour', backgroundColour: '#DDE3F7', primaryColour: '' },
  /*
   * **A photograph, which is the one ground the style tree cannot reason about.** The page puts a
   * wash over it, so the ink is mixed against a colour nobody chose; these two appearances are that
   * case, one with solid cards and one with glass, drawn on a test picture the sweep builds itself.
   */
  photo: { theme: 'light', highContrast: false, background: 'photo', backgroundImage: PHOTO, primaryColour: '', cardTreatment: 'solid' },
  glass: { theme: 'light', highContrast: false, background: 'photo', backgroundImage: PHOTO, primaryColour: '', cardTreatment: 'glass' },
  'tint-split': { theme: 'light', highContrast: false, background: 'colour', backgroundColour: '#DDE3F7', primaryColour: '#FCFBFA' },
};

const SETTINGS = {
  version: 8,
  language: 'en',
  timeFormat: '24h',
  dateFormat: 'long',
  density: 'comfortable',
  reduceMotion: true,
  selectionColor: 'coral',
  selectionCustom: '',
  selectionColorDark: 'coral',
  selectionCustomDark: '',
  backgroundColourDark: '#1b2430',
  backgroundImage: '',
  backgroundImageSource: '',
  backgroundCrop: null,
  cardTreatment: 'solid',
  primaryColourDark: '',
  defaultTimeMode: 'depart',
  defaultOriginStopId: null,
  boardAutoRefresh: 5,
};

const ROUTES = [
  { path: '/', name: 'home' },
  { path: '/results', name: 'results (empty)' },
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
  { path: '/signin', name: 'sign in' },
  { path: '/nope', name: 'not found' },
  { path: `/results/${SEARCH}`, name: 'results (journeys)' },
  { path: `/results/${SEARCH}`, name: 'journey', openJourney: true },
];

const CONTRAST_FLOOR = 4.5;
const GRAPHIC_FLOOR = 3;

const toRgba = (css) => {
  const match = String(css ?? '').match(/rgba?\(([^)]+)\)/);
  if (!match) return null;
  const parts = match[1].split(/[ ,/]+/).filter(Boolean).map(Number);
  if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) return null;
  return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
};
const over = (top, bottom) => ({
  r: top.r * top.a + bottom.r * (1 - top.a),
  g: top.g * top.a + bottom.g * (1 - top.a),
  b: top.b * top.a + bottom.b * (1 - top.a),
  a: 1,
});
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
const css = ({ r, g, b }) => `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;

const readNodes = () => {
  const visible = (el) => {
    const rect = el.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return false;
    const cs = getComputedStyle(el);
    return cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0.05;
  };
  const label = (el) => {
    const bits = [];
    for (let node = el; node && node.nodeType === 1 && bits.length < 4; node = node.parentElement) {
      let bit = node.tagName.toLowerCase();
      if (node.className && typeof node.className === 'string') bit += '.' + node.className.trim().split(/\s+/).slice(0, 2).join('.');
      bits.unshift(bit);
    }
    return bits.join(' > ');
  };
  const paper = toRgbaLocal(getComputedStyle(document.documentElement).backgroundColor);
  const out = [];
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
  for (let el = walk.currentNode; el; el = walk.nextNode()) {
    if (!visible(el)) continue;
    if (el.closest('svg')) continue;
    const own = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim());
    const isIcon = el.tagName.toLowerCase() === 'svg' || (el.getAttribute('role') === 'img' && !own.length);
    if (!own.length && !isIcon) continue;
    /* An icon inside a labelled control carries the control's own colour; read it off the svg. */
    const text = isIcon ? (el.dataset.icon ?? 'icon') : own.map((n) => n.textContent.trim()).join(' ');
    const cs = getComputedStyle(el);
    const ink = toRgbaLocal(isIcon ? cs.color : cs.color);
    if (!ink) continue;
    /* The ground: every translucent layer from here outwards, until one is opaque. */
    let ground = null;
    let art = false;
    const chain = [];
    for (let node = el; node; node = node.parentElement) {
      const style = getComputedStyle(node);
      chain.push(node);
      if (style.backgroundImage && style.backgroundImage !== 'none') { art = true; break; }
      const paint = toRgbaLocal(style.backgroundColor);
      if (paint && paint.a > 0.001) {
        ground = ground ? over(ground, paint) : paint;
        if (ground.a >= 0.999) break;
      }
    }
    if (!ground) ground = paper ?? { r: 255, g: 255, b: 255, a: 1 };
    const rect = el.getBoundingClientRect();
    out.push({
      selector: label(el),
      text: text.slice(0, 40),
      icon: isIcon,
      ink: { r: ink.r, g: ink.g, b: ink.b },
      inkAlpha: ink.a,
      ground: { r: ground.r, g: ground.g, b: ground.b },
      art,
      size: parseFloat(cs.fontSize) || 16,
      weight: Number(cs.fontWeight) || 400,
      box: { x: Math.round(rect.left), y: Math.round(rect.top), w: Math.round(rect.width), h: Math.round(rect.height) },
    });
  }
  return out;

  function toRgbaLocal(value) {
    const match = String(value ?? '').match(/rgba?\(([^)]+)\)/);
    if (!match) return null;
    const parts = match[1].split(/[ ,/]+/).filter(Boolean).map(Number);
    if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) return null;
    return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
  }
};

const browser = await chromium.launch({ chromiumSandbox: false, args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--hide-scrollbars'] });
const findings = [];
const closest = [];
const seen = new Set();
const checked = { pages: 0, nodes: 0 };

for (const theme of THEMES) {
  const look = APPEARANCES[theme];
  if (!look) continue;
  for (const width of WIDTHS) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, deviceScaleFactor: 1 });
    await context.addInitScript(
      ([settings, consent]) => {
        localStorage.clear();
        localStorage.setItem('ov-planner:v1:settings', JSON.stringify(settings));
        localStorage.setItem('ov-planner:v1:location-consent', JSON.stringify(consent));
      },
      [[{ ...SETTINGS, ...look }, 'denied']][0],
    );
    const page = await context.newPage();
    for (const route of ROUTES) {
      if (ONLY && !ONLY.some((part) => route.name === part || route.path === part)) continue;
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
      const nodes = await page.evaluate(readNodes).catch(() => []);
      if (!nodes.length) continue;
      checked.pages += 1;
      checked.nodes += nodes.length;
      /* The ground read out of the pixels, for anything painted over a gradient or a photograph. */
      let shot = null;
      if (nodes.some((n) => n.art)) {
        shot = await sharp(await page.screenshot({ fullPage: true })).raw().toBuffer({ resolveWithObject: true }).catch(() => null);
      }
      const pageBox = await page.evaluate(() => ({ y: window.scrollY, x: window.scrollX, h: document.documentElement.scrollHeight }));
      for (const node of nodes) {
        let ground = node.ground;
        if (node.art && shot) ground = sample(node, shot, pageBox) ?? ground;
        const ink = node.inkAlpha < 1 ? over({ ...node.ink, a: node.inkAlpha }, ground) : node.ink;
        const cr = ratio(ink, ground);
        const large = node.size >= 24 || (node.size >= 18.66 && node.weight >= 700);
        const need = node.icon || large ? GRAPHIC_FLOOR : CONTRAST_FLOOR;
        closest.push({ theme, route: route.name, width, selector: node.selector, text: node.text, icon: node.icon, cr: +cr.toFixed(2), need, ink: css(ink), ground: css(ground) });
        if (cr + 0.005 >= need) continue;
        const key = `${theme}|${route.name}|${node.selector}|${node.text}`;
        if (seen.has(key)) continue;
        seen.add(key);
        findings.push({
          theme, width, route: route.name, path: route.path, selector: node.selector, text: node.text,
          icon: node.icon, cr: +cr.toFixed(2), need, size: node.size, weight: node.weight,
          ink: css(ink), ground: css(ground), sampled: node.art,
        });
      }
    }
    await context.close();
  }
}
await browser.close();

function sample(node, shot, pageBox) {
  const { data, info } = shot;
  const x0 = Math.max(0, node.box.x);
  const y0 = Math.max(0, node.box.y + pageBox.y);
  const x1 = Math.min(info.width, x0 + Math.max(1, node.box.w));
  const y1 = Math.min(info.height, y0 + Math.max(1, node.box.h));
  const counts = new Map();
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      const i = (y * info.width + x) * info.channels;
      const key = `${data[i]},${data[i + 1]},${data[i + 2]}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  let best = null;
  for (const [key, count] of counts) if (!best || count > best.count) best = { key, count };
  if (!best) return null;
  const [r, g, b] = best.key.split(',').map(Number);
  return { r, g, b };
}

/* ------------------------------------------------------------------ the report */

const order = (a, b) => a.theme.localeCompare(b.theme) || a.route.localeCompare(b.route) || a.cr - b.cr;
findings.sort(order);
const byTheme = {};
for (const finding of findings) {
  byTheme[finding.theme] ??= { count: 0, rows: [] };
  byTheme[finding.theme].count += 1;
  byTheme[finding.theme].rows.push(finding);
}

mkdirSync('.logs', { recursive: true });
const lines = [
  '# Contrast sweep — every screen, every appearance, every width',
  '',
  `Measured ${new Date().toISOString().slice(0, 16).replace('T', ' ')} on ${ORIGIN}.`,
  `${checked.pages} page renders, ${checked.nodes} text and icon nodes measured.`,
  `Thresholds: ${CONTRAST_FLOOR}:1 body, ${GRAPHIC_FLOOR}:1 large text and icons.`,
  '',
];
for (const [theme, group] of Object.entries(byTheme)) {
  lines.push(`## ${theme} — ${group.count} below AA`, '');
  lines.push('| route | width | ratio | needs | what | ink | ground |');
  lines.push('| --- | --- | --- | --- | --- | --- | --- |');
  for (const row of group.rows) {
    lines.push(`| ${row.route} | ${row.width} | ${row.cr}:1 | ${row.need}:1 | ${row.icon ? 'icon' : 'text'} \`${row.text}\` in \`${row.selector}\` | ${row.ink} | ${row.ground}${row.sampled ? ' (sampled)' : ''} |`);
  }
  lines.push('');
}
if (!findings.length) lines.push('Nothing below AA anywhere in the matrix.', '');
lines.push('## Closest to the floor — the tightest twenty, whatever their verdict', '');
lines.push('| theme | route | width | ratio | needs | what | ink | ground |');
lines.push('| --- | --- | --- | --- | --- | --- | --- | --- |');
for (const row of [...closest].sort((a, b) => a.cr - b.cr).slice(0, 20)) {
  lines.push(`| ${row.theme} | ${row.route} | ${row.width} | ${row.cr}:1 | ${row.need}:1 | ${row.icon ? 'icon' : 'text'} \`${row.text}\` | ${row.ink} | ${row.ground} |`);
}
lines.push('');
const REPORT = process.env.CONTRAST_REPORT ?? '.logs/contrast-sweep.md';
writeFileSync(REPORT, lines.join('\n') + '\n');
writeFileSync(REPORT.replace(/\.md$/, '.json'), JSON.stringify(findings, null, 1) + '\n');

for (const [theme, group] of Object.entries(byTheme)) {
  console.log(`${theme}: ${group.count} below AA`);
  for (const row of group.rows.slice(0, 12)) {
    console.log(`  ${row.cr}:1 need ${row.need} ${row.route}@${row.width} ${row.icon ? 'icon' : 'text'} "${row.text}" ${row.ink} on ${row.ground}`);
  }
  if (group.count > 12) console.log(`  … ${group.count - 12} more in .logs/contrast-sweep.md`);
}
console.log('\nClosest to the floor:');
for (const row of [...closest].sort((a, b) => a.cr - b.cr).slice(0, 10)) {
  console.log(`  ${row.cr}:1 need ${row.need} ${row.theme} ${row.route}@${row.width} ${row.icon ? 'icon' : 'text'} "${row.text}" ${row.ink} on ${row.ground}`);
}
console.log(`\n${checked.pages} renders, ${checked.nodes} nodes measured · report: ${REPORT}`);
if (findings.length) process.exit(1);
console.log('OK — every word and icon clears WCAG AA in every appearance, on every screen, at every width.');
