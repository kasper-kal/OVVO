/*
 * Record the yearbook hands-off at phone size, so it can be cut at a tenth of a second and looked at
 * the way the reference is looked at.
 */
import { chromium } from 'playwright';
import { mkdirSync, rmSync } from 'node:fs';

const dir = process.argv[2] || '/tmp/rec';
/*
 * **How long a card is held before the next swipe.**
 *
 * 2.2 seconds was shorter than the film's own heartbeat: a card exchanges its composition every 2.4 seconds,
 * so a recording that swiped sooner than that could not contain a single exchange, and the measurement said
 * the film never changed composition when the instrument was what never saw it change. Five seconds shows
 * two exchanges a card, which is what a person watching the film actually sees.
 */
const hold = Number(process.env.HOLD_MS || 2200);
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  recordVideo: { dir, size: { width: 390, height: 844 } },
});
const page = await context.newPage();
await page.goto('http://127.0.0.1:3000/yearbook?demo=1&persona=regular', { waitUntil: 'domcontentloaded' });
await page.locator('.wrapped-stage').waitFor();
const gate = page.locator('.sheet button, .overlay button');
for (let i = 0; i < 4; i += 1) {
  if (!(await gate.count())) break;
  await gate.first().click({ timeout: 2500 }).catch(() => {});
  await page.waitForTimeout(200);
}
await page.locator('.film2-begin').click();
for (let i = 0; i < 20; i += 1) {
  await page.waitForTimeout(hold);
  await page.keyboard.press('ArrowRight');
}
await page.waitForTimeout(500);
await context.close();
await browser.close();
console.log('recorded');
