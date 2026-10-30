/**
 * **The strict audit.** Twenty styles, ten pages, eleven questions a generous audit never asked:
 * text contrast, non-text contrast (icons and control edges), text clipped by its own box, a child
 * spilling its card, touch targets, concentric corners, the type scale, overlapping controls,
 * accessible names, heading order and duplicate ids, and anything the page threw.
 *
 *   node scripts/strict-audit.mjs                        # all styles
 *   node scripts/strict-audit.mjs --styles tram,terminal # a slice
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium, prepareBrowserEnv } from './browser-env.mjs';

prepareBrowserEnv();

const ORIGIN = process.env.ORIGIN ?? 'http://127.0.0.1:3000';
const OUT = '.logs/strict';
const PAGES = [
  ['home', '/'], ['stops', '/stops'], ['stop', '/stops/utrecht-centraal'],
  ['departures', '/departures'], ['disruptions', '/disruptions'], ['results', '/results'],
  ['preferences', '/preferences'], ['settings', '/settings'], ['styles', '/styles'], ['map', '/map'],
];

const SRC = fs.readFileSync('src/lib/styles.ts', 'utf8');
const GROUPS = new Set(['basic','luxe','modern','editorial','dutch','dark','reading','soft','loud','technical','photo']);
const ALL = [...SRC.matchAll(/^    id: '([a-z0-9-]+)',$/gm)].map((m) => m[1]).filter((id) => !GROUPS.has(id));

const args = process.argv.slice(2);
const flag = (n) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : undefined; };
const styles = flag('styles') ? flag('styles').split(',').map((s) => s.trim()).filter(Boolean) : ALL;

const settings = (styleId) => ({
  version: 10, theme: 'light', language: 'en', timeFormat: '24h', dateFormat: 'long',
  density: 'comfortable', highContrast: false, reduceMotion: true, styleId, photoColourOnly: [],
  selectionColor: 'coral', selectionCustom: '', selectionColorDark: 'coral', selectionCustomDark: '',
  background: 'cream', backgroundColour: '#FCFBFA', backgroundColourDark: '#1b2430',
  backgroundImage: '', backgroundImageSource: '', backgroundCrop: null, cardTreatment: 'solid',
  primaryColour: '', primaryColourDark: '', defaultTimeMode: 'depart', defaultOriginStopId: 'utrecht-centraal',
});

const AUDIT = String.raw`(() => {
  const out = [];
  const add = (kind, severity, detail) => out.push({ kind, severity, detail });
  const num = (v) => { const m = String(v).match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p[3] === undefined ? 1 : p[3] }; };
  const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
  const over = (f, b) => ({ r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a), a: 1 });
  const behind = (el) => {
    const layers = [];
    for (let n = el; n; n = n.parentElement) { const bg = num(getComputedStyle(n).backgroundColor); if (!bg || bg.a === 0) continue; layers.push(bg); if (bg.a >= 0.999) break; }
    const page = num(getComputedStyle(document.body).backgroundColor) || { r: 255, g: 255, b: 255, a: 1 };
    let s = { r: page.r, g: page.g, b: page.b, a: 1 };
    for (let i = layers.length - 1; i >= 0; i -= 1) s = over(layers[i], s);
    return s;
  };
  const hidden = (el) => !!el.closest('.skip-link, .sr-only, .visually-hidden, [hidden], [aria-hidden="true"]');
  const cls = (el) => String(el.className || el.tagName).slice(0, 44);
  const faces = new Set(), sizes = new Set(), edges = [], interactive = [];

  for (const el of document.querySelectorAll('body *')) {
    const box = el.getBoundingClientRect();
    const st = getComputedStyle(el);
    if (hidden(el)) continue;
    if (st.display === 'none' || st.visibility === 'hidden' || Number(st.opacity) === 0) continue;
    if (box.width <= 2 || box.height <= 2) continue;
    if (st.clip !== 'auto' || st.clipPath !== 'none') continue;

    const text = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim().length > 1).map((n) => n.textContent.trim()).join(' ');

    if (text) {
      const size = parseFloat(st.fontSize);
      faces.add(st.fontFamily.split(',')[0].replace(/["']/g, '').trim());
      sizes.add(Math.round(size));
      const fg = num(st.color);
      if (fg) {
        const bg = behind(el);
        const value = ratio(over(fg, bg), bg);
        const large = size >= 24 || (size >= 18.66 && Number(st.fontWeight) >= 700);
        const min = large ? 3 : 4.5;
        if (value < min) add('text-contrast', value < 3 ? 'critical' : 'high', value.toFixed(2) + ':1 below ' + min + ' — "' + text.slice(0, 32) + '" ' + Math.round(size) + 'px .' + cls(el));
      }
    }

    if (['hidden', 'clip'].includes(st.overflowX) && st.textOverflow !== 'ellipsis' && el.scrollWidth > el.clientWidth + 1) {
      add('clipped', 'critical', (el.textContent || '').trim().slice(0, 28) + ' cut by ' + (el.scrollWidth - el.clientWidth) + 'px .' + cls(el));
    }

    const parent = el.parentElement;
    if (parent && parent !== document.body && st.position !== 'fixed' && st.position !== 'absolute') {
      const pb = parent.getBoundingClientRect(), ps = getComputedStyle(parent);
      const innerRight = pb.right - parseFloat(ps.paddingRight || '0');
      if (box.right > innerRight + 2 && ps.overflowX === 'visible' && pb.width > 0) {
        add('spill-card', 'high', (text || cls(el)).slice(0, 28) + ' sticks ' + Math.round(box.right - innerRight) + 'px out of .' + cls(parent));
      }
    }

    const isControl = el.tagName === 'BUTTON' || el.tagName === 'A' || el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.getAttribute('role') === 'button';
    if (isControl) {
      /*
       * **The name a browser would compute, not only the text directly inside.** This read `text`,
       * which is the element's own text nodes, so a button whose label sits in a child span (a
       * switch, a style tile) counted as having nothing to announce. A button's accessible name is
       * its whole subtree, which is what `innerText` gives.
       */
      const label = (el.getAttribute('aria-label') || text || (el.innerText || '').replace(/\s+/g, ' ').trim() || '').trim();
      if (!el.classList.contains('stop-link')) {
        const bg = behind(el);
        if (parseFloat(st.borderTopWidth || '0') > 0 && st.borderTopStyle !== 'none') {
          const bc = num(st.borderTopColor);
          const ownBg = num(st.backgroundColor) || { a: 0 };
        if (bc && bc.a > 0.05 && ownBg.a < 0.5) { const v = ratio(over(bc, bg), bg); if (v < 1.4) edges.push(cls(el) + ' ' + v.toFixed(2) + ':1'); }
        }
        const icon = el.querySelector('svg');
        if (icon && !text && !el.classList.contains('app-header__brand') && !String(st.backgroundImage).includes('url')) { const ic = num(getComputedStyle(icon).color || st.color); if (ic) { const v = ratio(over(ic, bg), bg); if (v < 3) add('icon-contrast', 'high', v.toFixed(2) + ':1 icon .' + cls(el)); } }
        if (box.width < 40 || box.height < 40) add('target', 'high', (label || cls(el)).slice(0, 24) + ' ' + Math.round(box.width) + 'x' + Math.round(box.height) + ' .' + cls(el));
      }
      interactive.push({ box, el, label: label.slice(0, 22) });
      if ((el.tagName === 'BUTTON' || el.tagName === 'A' || el.getAttribute('role') === 'button') && !label && !el.getAttribute('aria-labelledby') && !el.querySelector('svg') && !el.querySelector('img')) add('no-name', 'critical', 'control with nothing to announce .' + cls(el));
    }

    const r = parseFloat(st.borderTopLeftRadius || '0');
    if (r > 0 && parent && parent !== document.body) {
      const pr = parseFloat(getComputedStyle(parent).borderTopLeftRadius || '0');
      if (pr > 0) {
        const gap = Math.max(0, box.left - parent.getBoundingClientRect().left);
        const expected = Math.max(0, pr - gap);
        if (r < 100 && pr < 100 && r < Math.min(box.width, box.height) / 2 - 0.5 && Math.abs(r - expected) > 10) add('corner', 'medium', cls(el) + ' r' + Math.round(r) + ' in .' + cls(parent) + ' r' + Math.round(pr));
      }
    }
  }

  if (faces.size > 3) add('type-scale', 'medium', faces.size + ' faces: ' + [...faces].join(', '));
  if (sizes.size > 9) add('type-scale', 'medium', sizes.size + ' sizes: ' + [...sizes].sort((a, b) => a - b).join(','));

  const dockEl = document.querySelector('.app-dock');
  const dockBox = dockEl ? dockEl.getBoundingClientRect() : null;
  const hitsDock = (b) => !!dockBox && b.right > dockBox.left && b.left < dockBox.right && b.bottom > dockBox.top && b.top < dockBox.bottom;

  for (let i = 0; i < interactive.length; i += 1) {
    for (let j = i + 1; j < interactive.length; j += 1) {
      const a = interactive[i], b = interactive[j];
      if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
      if (a.el.parentElement !== b.el.parentElement) continue;
      /*
       * **A stretched row link is not an overlapping control.** `.list-row__stretch` is painted
       * `inset: 0` on purpose so the whole row is the target, and `.list-row__control` sits above
       * it at `z-index: 2`, so the button is the thing the finger reaches and the link owns the
       * rest of the row. Measuring those two as a collision reported 200 healthy rows as broken.
       */
      if ([a.el, b.el].some((el) => el.classList.contains('list-row__stretch') || el.classList.contains('list-row__control'))) continue;
      if (hitsDock(a.box) || hitsDock(b.box)) continue;
      const w = Math.min(a.box.right, b.box.right) - Math.max(a.box.left, b.box.left);
      const h = Math.min(a.box.bottom, b.box.bottom) - Math.max(a.box.top, b.box.top);
      if (w > 4 && h > 4) {
        const small = Math.min(a.box.width * a.box.height, b.box.width * b.box.height) || 1;
        if ((w * h) / small > 0.35) add('overlap', 'critical', (a.label || '?') + ' over ' + (b.label || '?') + ' ' + Math.round((w * h) / small * 100) + '%');
      }
    }
  }

  const seen = new Set();
  for (const el of document.querySelectorAll('[id]')) { if (seen.has(el.id)) add('duplicate-id', 'high', '#' + el.id + ' twice'); seen.add(el.id); }

  /*
   * **A visually hidden heading is still a heading.** `hidden()` drops anything clipped, which is
   * how a screen-reader-only `h1` disappeared from the outline and made Home look like it started
   * at `h2`. The heading order is a document fact, not a screenshot one.
   */
  const hs = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) => Number(h.tagName[1]));
  if (hs.length && !hs.includes(1)) add('heading', 'medium', 'no h1; starts at h' + hs[0]);
  for (let i = 1; i < hs.length; i += 1) if (hs[i] - hs[i - 1] > 1) add('heading', 'medium', 'h' + hs[i - 1] + ' then h' + hs[i]);

  /* `alt=""` is the correct answer for a decorative image, so only a missing attribute is a fault. */
  for (const img of document.querySelectorAll('img')) if (img.getAttribute('alt') === null) add('image-alt', 'high', (img.getAttribute('src') || '').slice(-28) + ' no alt');

  if (document.scrollingElement.scrollWidth > window.innerWidth + 1) add('page-overflow', 'critical', (document.scrollingElement.scrollWidth - window.innerWidth) + 'px past the screen');
  if (edges.length) add('invisible-edge', 'high', edges.slice(0, 4).join(' · '));
  return out;
})()`;

const DOCK = String.raw`(() => {
  const dock = document.querySelector('.app-dock');
  if (!dock) return [];
  const d = dock.getBoundingClientRect();
  const out = [];
  for (const el of document.querySelectorAll('button, a[href], [role=button]')) {
    if (el.closest('.app-dock, .app-sheet, .overlay, .map, .leaflet-container, [class*="map"]') || el.classList.contains('stop-link')) continue;
    const b = el.getBoundingClientRect();
    if (b.width === 0 || b.height === 0) continue;
    const w = Math.min(b.right, d.right) - Math.max(b.left, d.left);
    const h = Math.min(b.bottom, d.bottom) - Math.max(b.top, d.top);
    if (w > 4 && h > 4) out.push({ kind: 'under-dock', severity: 'critical', detail: ((el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 22) || 'control') + ' sits under the dock at the end of the page' });
  }
  return out;
})()`;

fs.mkdirSync(path.join(OUT, 'shots'), { recursive: true });
const file = path.join(OUT, 'findings.jsonl');
fs.writeFileSync(file, '');

const browser = await chromium.launch({ chromiumSandbox: false, args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--hide-scrollbars'] });
let shots = 0;
const started = Date.now();

for (const styleId of styles) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  await ctx.addInitScript((v) => {
    localStorage.setItem('ov-planner:v1:settings', JSON.stringify(v));
    localStorage.setItem('ov-planner:v1:location-consent', '"denied"');
  }, settings(styleId));
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.message).slice(0, 130)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 130)); });

  for (const [name, route] of PAGES) {
    try {
      await page.goto(ORIGIN + route, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(650);
      await page.evaluate(() => document.querySelector('.install-banner__close')?.click());
      const b = page.locator('[role=dialog] button, .overlay button').filter({ hasText: /^(not now|niet nu)$/i });
      if (await b.count()) await b.first().click({ timeout: 1200 }).catch(() => {});
      await page.waitForTimeout(300);

      const found = await page.evaluate(AUDIT);
      fs.mkdirSync(path.join(OUT, 'shots', styleId), { recursive: true });
      await page.screenshot({ path: path.join(OUT, 'shots', styleId, name + '.png') });

      await page.evaluate(() => window.scrollTo(0, document.scrollingElement.scrollHeight));
      await page.waitForTimeout(280);
      const dock = await page.evaluate(DOCK);
      await page.evaluate(() => window.scrollTo(0, 0));

      const rows = [...found, ...dock];
      if (errors.length) rows.push({ kind: 'errors', severity: 'critical', detail: errors.slice(0, 2).join(' · ') });
      for (const row of rows) fs.appendFileSync(file, JSON.stringify({ styleId, page: name, ...row }) + '\n');
      shots += 1;
    } catch (error) {
      fs.appendFileSync(file, JSON.stringify({ styleId, page: name, kind: 'audit-failed', severity: 'critical', detail: String(error).slice(0, 110) }) + '\n');
    }
  }
  await ctx.close();
  console.log(styleId + ' done');
}

await browser.close();
console.log('\n' + shots + ' screens in ' + Math.round((Date.now() - started) / 1000) + 's → ' + file);
