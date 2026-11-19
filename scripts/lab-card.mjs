/*
 * **The one-chapter lab, photographed.**
 *
 * The counting card is being rebuilt on its own until it is right, so this shoots that one card and
 * nothing else: six frames across its ten seconds, held still enough to compare with the reference and
 * far enough apart to see whether the picture moves. It also writes the headline and the object's pixel
 * size into the log, so a frame that looks wrong can be named instead of described.
 *
 *   node scripts/lab-card.mjs            phone frame (the reference's shape)
 *   WIDE=1 node scripts/lab-card.mjs     laptop frame (what the deck check watches)
 */
import { chromium } from 'playwright';
import fs from 'node:fs';

const OUT = 'artifacts/lab';
fs.mkdirSync(OUT, { recursive: true });

const wide = process.env.WIDE === '1';
const viewport = wide ? { width: 1440, height: 900 } : { width: 430, height: 932 };
const tag = wide ? 'wide' : 'phone';
const BASE = 'http://127.0.0.1:3000/yearbook?demo=1';

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const page = await browser.newPage({ viewport });
page.on('pageerror', (error) => console.log('PAGE ERROR', error.message));

await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.locator('.wrapped-stage').waitFor();
await page.waitForTimeout(700);

/*
 * The demo opens a use-your-location sheet over the film, and its backdrop puts a grey veil across the
 * card: every frame shot through it was a picture of the veil, not of the body. It is dismissed first.
 */
for (const label of ['Not now', 'NOT NOW', 'Allow location']) {
  const button = page.getByRole('button', { name: label, exact: false });
  if (await button.count()) {
    await button.first().click().catch(() => {});
    await page.waitForTimeout(350);
    break;
  }
}
const sheetOpen = page.locator('.sheet, .overlay').first();
if (await sheetOpen.count()) await sheetOpen.locator('button').first().click().catch(() => {});
await page.waitForTimeout(450);

/* One chapter on: the cover is card zero, the counting card is the first beat. */
await page.keyboard.press('ArrowRight');
await page.waitForTimeout(500);

const chapter = await page.evaluate(() => document.querySelector('.film2')?.dataset.chapter ?? '');
if (chapter !== 'total') {
  console.log(`LAB: expected the counting card, got "${chapter}"`);
  await browser.close();
  process.exit(1);
}

const frames = [];
for (let i = 0; i < 6; i += 1) {
  const at = await page.evaluate(() => document.querySelector('.film2')?.dataset.chapter ?? '');
  if (at !== 'total') break;
  const file = `${OUT}/${tag}-${String(i).padStart(2, '0')}.png`;
  await page.screenshot({ path: file });
  frames.push(file);
  await page.waitForTimeout(1300);
}

const state = await page.evaluate(() => {
  const film = document.querySelector('.film2');
  const line = film?.querySelector('.film2-line');
  const after = film?.querySelector('.film2-after');
  const lineRect = line?.getBoundingClientRect();
  const afterRect = after?.getBoundingClientRect();
  const frame = film?.getBoundingClientRect();
  return {
    chapter: film?.dataset.chapter,
    place: film?.dataset.place,
    line: line?.textContent?.trim(),
    lineBox: lineRect ? [Math.round(lineRect.width), Math.round(lineRect.height)] : null,
    afterOpacity: after ? getComputedStyle(after).opacity : null,
    lineOpacity: line ? getComputedStyle(line).opacity : null,
    share: Boolean(film?.querySelector('.w-focal')),
    frame: frame ? [Math.round(frame.width), Math.round(frame.height)] : null,
    steps: document.querySelector('.w-mass')?.dataset.steps,
  };
});

console.log('LAB:', tag, JSON.stringify(state), `${frames.length} frames`);
await browser.close();
