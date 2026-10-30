/**
 * **Every style, every page, photographed and measured.**
 *
 * This is the sweep that was never possible here until the browser was made to work: fifty styles
 * times ten screens, at phone size, each one photographed and each one measured in the same pass so
 * a picture and a number describe the same screen.
 *
 *   node scripts/style-sweep.mjs                # all fifty styles, all pages
 *   node scripts/style-sweep.mjs --from 0 --to 9 # a slice, so it fits in one command
 *   node scripts/style-sweep.mjs --styles tram,terminal
 *
 * Pictures land in `.logs/sweep/shots/<style>/<page>.png` and the measurements are appended to
 * `.logs/sweep/metrics.jsonl`, one line per photograph, so a run can be sliced and resumed without
 * losing what earlier slices already measured.
 *
 * What is measured, and why each one is on the list:
 *
 * - **contrast**: the worst text on the screen, against the surface it actually sits on. This is the
 *   fault that a style palette can cause and that no static check can see, because the surface is
 *   decided at paint time by whichever parent has a solid fill.
 * - **overflow**: anything wider than the screen, or sticking out of its own box. This is the fault
 *   that puts a scrollbar on a phone.
 * - **corners**: every radius in use, so a style that says it has a shape can be caught not using it.
 * - **tiny type**: anything under 11px, which on a 390px screen is a caption nobody can read.
 * - **small targets**: buttons under 40px, except the inline text links that AGENTS.md exempts.
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium, prepareBrowserEnv } from './browser-env.mjs';

prepareBrowserEnv();

const ORIGIN = process.env.ORIGIN ?? 'http://127.0.0.1:3000';
const OUT = '.logs/sweep';
const SHOTS = path.join(OUT, 'shots');

const PAGES = [
  ['home', '/'],
  ['stops', '/stops'],
  ['stop', '/stops/utrecht-centraal'],
  ['departures', '/departures'],
  ['disruptions', '/disruptions'],
  ['results', '/results'],
  ['preferences', '/preferences'],
  ['settings', '/settings'],
  ['styles', '/styles'],
  ['map', '/map'],
];

const SOURCE = fs.readFileSync('src/lib/styles.ts', 'utf8');
/** The catalogue, in the order it is written, without the eleven group ids. */
const GROUPS = new Set(['basic', 'luxe', 'modern', 'editorial', 'dutch', 'dark', 'reading', 'soft', 'loud', 'technical', 'photo']);
const ALL_STYLES = [...SOURCE.matchAll(/^    id: '([a-z0-9-]+)',$/gm)].map((m) => m[1]).filter((id) => !GROUPS.has(id));

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const explicit = flag('styles');
const from = Number(flag('from') ?? 0);
const to = flag('to') !== undefined ? Number(flag('to')) : ALL_STYLES.length - 1;
const styles = explicit ? explicit.split(',').map((s) => s.trim()).filter(Boolean) : ALL_STYLES.slice(from, to + 1);

const baseSettings = (styleId) => ({
  version: 10,
  theme: 'light',
  language: 'en',
  timeFormat: '24h',
  dateFormat: 'long',
  density: 'comfortable',
  highContrast: false,
  reduceMotion: true,
  styleId,
  photoColourOnly: [],
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
  defaultOriginStopId: 'utrecht-centraal',
});

fs.mkdirSync(SHOTS, { recursive: true });

const measure = `(() => {
  const parse = (value) => {
    const m = String(value).match(/rgba?\\(([^)]+)\\)/);
    if (!m) return null;
    const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p[3] === undefined ? 1 : p[3] };
  };
  const lum = ({ r, g, b }) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (a, b) => {
    const l1 = lum(a), l2 = lum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };
  const over = (fg, bg) => ({
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  });
  /** The colour actually painted behind an element: the nearest ancestor with a fill, over the page. */
  const behind = (el) => {
    const layers = [];
    for (let node = el; node; node = node.parentElement) {
      const bg = parse(getComputedStyle(node).backgroundColor);
      if (!bg || bg.a === 0) continue;
      layers.push(bg);
      if (bg.a >= 0.999) break;
    }
    const page = parse(getComputedStyle(document.body).backgroundColor) ?? { r: 255, g: 255, b: 255, a: 1 };
    let stack = { r: page.r, g: page.g, b: page.b, a: 1 };
    for (let i = layers.length - 1; i >= 0; i -= 1) stack = over(layers[i], stack);
    return stack;
  };

  const worst = [];
  let tiny = 0;
  let smallTargets = 0;
  const radii = new Set();
  const overflows = [];
  const tinyList = [];

  const viewport = window.innerWidth;
  for (const el of document.querySelectorAll('body *')) {
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) continue;
    const box = el.getBoundingClientRect();
    if (box.width === 0 && box.height === 0) continue;

    /*
     * **Text nobody can see is not text with bad contrast.** The first pass counted the label a
     * screen reader reads and the skip-link waiting off to the left, and reported Station Sign's
     * settings screen at 1.03:1 when the screen in front of you is perfectly readable. A hidden
     * label has no size, is clipped, or sits in a wrapper that says so; all three are skipped here.
     */
    if (el.closest('.skip-link, .sr-only, .visually-hidden, [hidden], [aria-hidden="true"]')) continue;
    if (style.clip !== 'auto' || style.clipPath !== 'none') continue;
    if (box.width <= 2 || box.height <= 2) continue;

    /*
     * Only a real spill counts: a skip-link parked off to the left until it is focused, a map tile
     * that is meant to be panned, and anything deliberately off-canvas are not faults.
     */
    if (!el.closest('.map, .leaflet-container, .skip-link, [aria-hidden=true]')) {
      if (box.right > viewport + 1.5) overflows.push(String(el.className).slice(0, 60) + ' w=' + Math.round(box.width) + ' r=' + Math.round(box.right));
      else if (box.left < -1.5 && box.right > 0) overflows.push(String(el.className).slice(0, 60) + ' left=' + Math.round(box.left));
    }

    if (style.borderTopLeftRadius !== '0px') radii.add(style.borderTopLeftRadius);

    const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
    if (hasText) {
      const size = parseFloat(style.fontSize);
      if (size < 11) tiny += 1;
      const fg = parse(style.color);
      if (fg) {
        const bg = behind(el);
        const value = ratio(over(fg, bg), bg);
        worst.push({ text: el.textContent.trim().slice(0, 40), value: Number(value.toFixed(2)), size: Math.round(size), cls: String(el.className).slice(0, 40) });
      }
    }

    if ((el.tagName === 'BUTTON' || el.tagName === 'A') && !el.classList.contains('stop-link')) {
      if (box.width < 40 || box.height < 40) {
        smallTargets += 1;
        if (smallTargets <= 6) tinyList.push((el.getAttribute('aria-label') || el.textContent.trim() || el.tagName).slice(0, 30) + ' ' + Math.round(box.width) + 'x' + Math.round(box.height));
      }
    }
  }

  worst.sort((a, b) => a.value - b.value);

  return {
    worstText: worst.slice(0, 4),
    belowThree: worst.filter((w) => w.value < 3).length,
    tiny,
    smallTargets,
    smallTargetList: tinyList,
    radii: [...radii].slice(0, 12),
    overflows: [...new Set(overflows)].slice(0, 6),
    docOverflowX: Math.max(0, document.scrollingElement.scrollWidth - window.innerWidth),
    height: document.scrollingElement.scrollHeight,
  };
})()`;

const browser = await chromium.launch({
  chromiumSandbox: false,
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--hide-scrollbars'],
});

const metricsFile = path.join(OUT, 'metrics.jsonl');
const started = Date.now();
let shot = 0;

for (const styleId of styles) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const settings = baseSettings(styleId);
  await context.addInitScript((value) => {
    window.localStorage.setItem('ov-planner:v1:settings', JSON.stringify(value));
    window.localStorage.setItem('ov-planner:v1:location-consent', '"denied"');
  }, settings);

  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e.message).slice(0, 160)));

  for (const [name, route] of PAGES) {
    try {
      await page.goto(ORIGIN + route, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(600);
      // The location sheet and the install banner sit over the page; both are closed first.
      for (const label of [/^(not now|niet nu)$/i, /^(allow location|sta locatie toe)$/i]) {
        const button = page.locator('[role=dialog] button, .overlay button').filter({ hasText: label });
        if (await button.count()) { await button.first().click({ timeout: 1500 }).catch(() => {}); }
      }
      await page.evaluate(() => {
        const close = document.querySelector('.install-banner__close, .overlay .btn--ghost');
        if (close) close.click();
      }).catch(() => {});
      await page.waitForTimeout(500);

      const data = await page.evaluate(measure);
      const dir = path.join(SHOTS, styleId);
      fs.mkdirSync(dir, { recursive: true });
      await page.screenshot({ path: path.join(dir, `${name}.png`), fullPage: false });
      shot += 1;

      fs.appendFileSync(
        metricsFile,
        JSON.stringify({ styleId, page: name, route, ...data, errors: pageErrors.slice(-2) }) + '\n',
      );
      const worst = data.worstText[0]?.value ?? 99;
      console.log(`${String(shot).padStart(3)} ${styleId.padEnd(18)} ${name.padEnd(12)} contrast ${String(worst).padStart(5)} overflow ${data.overflows.length} radii ${data.radii.length}`);
    } catch (error) {
      fs.appendFileSync(metricsFile, JSON.stringify({ styleId, page: name, route, failed: String(error).slice(0, 160) }) + '\n');
      console.log(`${styleId.padEnd(18)} ${name.padEnd(12)} FAILED ${String(error).slice(0, 80)}`);
    }
  }

  await context.close();
}

await browser.close();
console.log(`\n${shot} photographs in ${Math.round((Date.now() - started) / 1000)}s → ${SHOTS}`);
