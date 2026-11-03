/**
 * **The only way a screenshot leaves this workspace.**
 *
 * Every fault the steerer has reported was visible in a picture I sent him and not in the sentence I
 * wrote above it: the shot was treated as proof of what I meant to build, framed on the part I was
 * pleased with, and never read. Promising to look harder does not fix that, because the looking is the
 * step that gets skipped. So the frame is no longer mine to choose: this script renders a fixed set of
 * screens at two widths and both appearances, measures every one of them, writes the pictures, and
 * prints a verdict. A picture and its verdict now come out of the same run, and the rule in AGENTS.md
 * is that no shot is sent without the verdict line from the run that made it.
 *
 * Faults are compared against `design/screen-baseline.json`, which lists the ones already known and
 * logged in `DEFECTS.md`. A gate that is always red gets ignored, which is the same failure by another
 * route; this one stays honest by failing only on a fault that is *new*.
 *
 *   node scripts/screen.mjs            # measure, write shots, exit 1 on a new fault
 *   node scripts/screen.mjs --accept   # take the current faults as known (only when approved)
 */
import { chromium, prepareBrowserEnv, browserIsInstalled, MISSING_BROWSER_HELP } from './browser-env.mjs';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';

prepareBrowserEnv();
if (!browserIsInstalled()) {
  console.error(MISSING_BROWSER_HELP);
  process.exit(2);
}

const base = (process.env.BASE_URL || 'http://127.0.0.1:4181').replace(/\/$/, '');
const accept = process.argv.includes('--accept');
const BASELINE = 'design/screen-baseline.json';
const OUT = 'artifacts/screen';
mkdirSync(OUT, { recursive: true });

const journey = `/results/${Buffer.from(
  JSON.stringify({ v: 1, f: 'haarlem', t: 'zwolle', d: '2026-11-02', m: 300, tm: 'depart' }),
).toString('base64url')}`;

/* The surfaces are listed here, once, and not chosen per answer. `journey` walks the real flow. */
const SURFACES = [
  { name: 'home', path: '/' },
  { name: 'results', path: journey },
  { name: 'journey', path: journey, journey: true },
  { name: 'stops', path: '/stops' },
  { name: 'departures', path: '/departures' },
  { name: 'map', path: '/map' },
];

/** A short, stable name for an element, so a fault can be matched against the baseline. */
const LABEL = `(el) => {
  const cls = String(el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className || '')
    .split(/\\s+/).filter(Boolean).slice(0, 2).join('.');
  return el.tagName.toLowerCase() + (cls ? '.' + cls : '');
}`;

const MEASURE = (labelSource) => {
  const label = eval(labelSource);
  const faults = [];
  const width = window.innerWidth;
  const root = document.documentElement;

  /* 1. The page itself. A document wider than its window is the fault behind every sideways scroll. */
  if (root.scrollWidth > root.clientWidth + 1) {
    faults.push({ kind: 'page-overflow', key: 'page', detail: root.scrollWidth + 'px in ' + root.clientWidth });
  }

  const clipped = (el) => {
    for (let node = el; node && node !== root; node = node.parentElement) {
      const s = getComputedStyle(node);
      if (/hidden|auto|scroll/.test(s.overflowX + s.overflowY)) return true;
    }
    return false;
  };

  /* 2. Anything painted past the right edge and not clipped by an ancestor. */
  const seen = new Set();
  document.querySelectorAll('body *').forEach((el) => {
    const box = el.getBoundingClientRect();
    if (!box.width || !box.height) return;
    const s = getComputedStyle(el);
    if (s.visibility === 'hidden' || s.display === 'none' || Number(s.opacity) === 0) return;
    /* Screen-reader-only text is clipped *on purpose*: flagging it would make the gate noise. */
    if (el.closest('.sr-only')) return;
    if (s.position === 'fixed') return;
    /* Parked off to the left until it is focused (the skip link) is deliberate, not an overflow. */
    if (box.left < -1) return;
    if (box.right <= width + 1) return;
    if (clipped(el)) return;
    const name = label(el);
    if (seen.has(name)) return;
    seen.add(name);
    faults.push({
      kind: 'past-edge',
      key: name,
      detail: 'right ' + Math.round(box.right) + ' of ' + width,
    });
  });

  /* 3. Text the box hides: bigger content inside `overflow: hidden`, which is a word cut in half. */
  const textSeen = new Set();
  document.querySelectorAll('body *').forEach((el) => {
    if (el.closest('.sr-only')) return;
    const s = getComputedStyle(el);
    if (!/hidden/.test(s.overflowX + s.overflowY)) return;
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!own) return;
    const dx = el.scrollWidth - el.clientWidth;
    const dy = el.scrollHeight - el.clientHeight;
    if (dx <= 1 && dy <= 1) return;
    const name = label(el);
    if (textSeen.has(name)) return;
    textSeen.add(name);
    faults.push({ kind: 'clipped-text', key: name, detail: (dx > 1 ? dx + 'px across' : dy + 'px down') });
  });

  return faults;
};

const browser = await chromium.launch();
const shots = [];
const all = [];

for (const surface of SURFACES) {
  for (const width of [390, 320]) {
    for (const theme of ['light', 'dark']) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 2 });
      await page.goto(`${base}${surface.path}`, { waitUntil: 'networkidle' });
      for (let i = 0; i < 8; i += 1) {
        const close = page.locator('.overlay button, .sheet button');
        if (!(await close.count())) break;
        await close.first().click({ timeout: 800 }).catch(() => {});
        await page.waitForTimeout(120);
      }
      if (surface.journey) {
        await page.locator('.journey-card__link').nth(2).click();
        await page.waitForSelector('.timeline', { timeout: 15000 });
      }
      if (theme === 'dark') {
        await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
      }
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'auto' }));
      await page.waitForTimeout(350);

      const faults = await page.evaluate(MEASURE, LABEL);
      const file = `${OUT}/${surface.name}-${width}-${theme}.png`;
      await page.screenshot({ path: file, fullPage: true });
      for (const fault of faults) all.push({ ...fault, surface: surface.name, width, theme });
      shots.push({ file, surface: surface.name, width, theme, faults: faults.length });
      await page.close();
    }
  }
}

await browser.close();

const known = existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, 'utf8')) : [];
const keyOf = (f) => `${f.surface} ${f.width} ${f.kind} ${f.key}`;
const fresh = all.filter((f) => !known.includes(keyOf(f)));

for (const fault of all) {
  const tag = known.includes(keyOf(fault)) ? 'known' : 'NEW  ';
  console.log(`${tag} ${fault.surface} ${fault.width} ${fault.theme}  ${fault.kind}: ${fault.key} (${fault.detail})`);
}

writeFileSync(`${OUT}/manifest.json`, JSON.stringify({ at: new Date().toISOString(), shots, faults: all }, null, 1));

if (accept) {
  writeFileSync(BASELINE, JSON.stringify([...new Set(all.map(keyOf))].sort(), null, 1) + '\n');
  console.log(`SCREEN: baseline now holds ${new Set(all.map(keyOf)).size} known fault(s), 0 new. (logged in DEFECTS.md)`);
  process.exit(0);
}

console.log(`SCREEN: ${fresh.length} new fault(s), ${all.length - fresh.length} known, ${shots.length} shot(s) in ${OUT}`);
process.exit(fresh.length ? 1 : 0);
