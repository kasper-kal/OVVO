/**
 * **The two faults a picture can show and a number has to confirm.**
 *
 * The sweep measures text contrast, spills past the screen edge, corners and type size. It cannot
 * see either of the things the contact sheets made obvious:
 *
 *   1. **Content clipped inside its own box.** Settings' density control is wider than the card's
 *      inner width, so "COMFORTABLE" is cut off mid-word. The element never passes the screen edge,
 *      so the overflow check says nothing. A box whose own content is wider than the box is clipped
 *      has the same fault, and it is measurable.
 *   2. **A control under the floating dock.** The board's "Show all" button sits under the dock at
 *      the bottom of the page. Nothing is off screen; something is on top of something else.
 *
 * Both are reported for every style, so the finding is "fifty of fifty" rather than "I saw it once".
 *
 *   node scripts/style-fault-probe.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium, prepareBrowserEnv } from './browser-env.mjs';

prepareBrowserEnv();

const ORIGIN = process.env.ORIGIN ?? 'http://127.0.0.1:3000';
const OUT = '.logs/sweep';
const SOURCE = fs.readFileSync('src/lib/styles.ts', 'utf8');
const GROUPS = new Set(['basic', 'luxe', 'modern', 'editorial', 'dutch', 'dark', 'reading', 'soft', 'loud', 'technical', 'photo']);
const STYLES = [...SOURCE.matchAll(/^    id: '([a-z0-9-]+)',$/gm)].map((m) => m[1]).filter((id) => !GROUPS.has(id));

const PAGES = [
  ['settings', '/settings'],
  ['departures', '/departures'],
];

const PROBE = `(() => {
  const dock = document.querySelector('.app-dock');
  const dockBox = dock ? dock.getBoundingClientRect() : null;

  const clipped = [];
  for (const el of document.querySelectorAll('body *')) {
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') continue;
    /* Only text a sighted reader is meant to read: an sr-only label is a 1px box holding a full
       sentence for a screen reader, which looks exactly like text cut off by its container and is
       the opposite of a fault. */
    if (el.closest('.sr-only, .visually-hidden, .skip-link, [aria-hidden="true"]')) continue;
    const hides = ['hidden', 'clip'].includes(style.overflowX);
    if (!hides) continue;
    // An ellipsis is a decision, not an accident; a cut mid-word is the fault.
    if (style.textOverflow === 'ellipsis' || style.webkitLineClamp !== 'none') continue;
    if (el.scrollWidth > el.clientWidth + 1) {
      const text = (el.textContent || '').trim().slice(0, 34);
      clipped.push({ text, cls: String(el.className).slice(0, 40), hiddenPx: el.scrollWidth - el.clientWidth });
    }
  }

  const under = [];
  if (dockBox) {
    for (const el of document.querySelectorAll('button, a[href], [role=button]')) {
      if (el.closest('.app-dock, .app-sheet, .overlay')) continue;
      /* A station name inside a row is sized by its line and exempt (AGENTS.md rule 8). */
      if (el.classList.contains('stop-link')) continue;
      const box = el.getBoundingClientRect();
      if (box.width === 0 || box.height === 0) continue;
      const overlaps =
        box.left < dockBox.right && box.right > dockBox.left && box.top < dockBox.bottom && box.bottom > dockBox.top;
      if (overlaps) under.push({ label: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 30), cls: String(el.className).slice(0, 40) });
    }
  }

  return { clipped: clipped.slice(0, 6), under: under.slice(0, 6) };
})()`;

const browser = await chromium.launch({ chromiumSandbox: false, args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'] });
const file = path.join(OUT, 'faults.jsonl');
fs.writeFileSync(file, '');

for (const styleId of STYLES) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  await context.addInitScript((id) => {
    localStorage.setItem(
      'ov-planner:v1:settings',
      JSON.stringify({ version: 10, theme: 'light', language: 'en', styleId: id, reduceMotion: true, defaultOriginStopId: 'utrecht-centraal' }),
    );
    localStorage.setItem('ov-planner:v1:location-consent', '"denied"');
  }, styleId);
  const page = await context.newPage();

  for (const [name, route] of PAGES) {
    try {
      await page.goto(ORIGIN + route, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(700);
      await page.evaluate(() => document.querySelector('.install-banner__close')?.click());
      await page.waitForTimeout(250);
      // The page is scrolled to the bottom, which is where a dock overlaps content.
      await page.evaluate(() => window.scrollTo(0, document.scrollingElement.scrollHeight));
      await page.waitForTimeout(400);
      const data = await page.evaluate(PROBE);
      fs.appendFileSync(file, JSON.stringify({ styleId, page: name, ...data }) + '\n');
      console.log(`${styleId.padEnd(18)} ${name.padEnd(12)} clipped ${data.clipped.length} under-dock ${data.under.length}`);
    } catch (error) {
      fs.appendFileSync(file, JSON.stringify({ styleId, page: name, failed: String(error).slice(0, 120) }) + '\n');
    }
  }

  await context.close();
}

await browser.close();
console.log(`\n→ ${file}`);
