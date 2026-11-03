/**
 * **A journey's own page, photographed, with its height** — so a change that removes noise can be
 * checked by how much shorter the page got, not by how it feels.
 *
 * Usage: node scripts/shot-journey-detail.mjs before|after
 */
import { chromium } from 'playwright';

const label = process.argv[2] ?? 'shot';
const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
await page.addInitScript(() => Object.defineProperty(navigator, 'webdriver', { get: () => false }));
const link = `http://127.0.0.1:3000/results/${Buffer.from(
  JSON.stringify({ v: 1, f: 'haarlem', t: 'zaandam', d: '2026-11-02', m: 600, tm: 'depart' }),
).toString('base64')}`;
await page.goto(link, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
for (let i = 0; i < 6; i += 1) {
  if ((await page.locator('.overlay, [role="dialog"]').count()) === 0) break;
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
}
/* The first journey with a change in it, so a transfer is on the page. */
const cards = page.locator('article');
const count = await cards.count();
let opened = false;
for (let i = 0; i < count; i += 1) {
  const chain = await cards.nth(i).locator('.journey-card__leg').count();
  if (chain >= 3) {
    await cards.nth(i).locator('.journey-card__link').first().click();
    opened = true;
    break;
  }
}
if (!opened) await cards.first().locator('.journey-card__link').first().click();
await page.waitForSelector('.timeline', { timeout: 20000 });
await page.waitForTimeout(800);
const shape = await page.evaluate(() => ({
  height: Math.round(document.documentElement.scrollHeight),
  pills: document.querySelectorAll('.timeline .pill, .timeline .mode-badge').length,
  cards: document.querySelectorAll('.card').length,
}));
await page.screenshot({ path: `artifacts/journey-detail-${label}.png`, fullPage: true });
console.log(label, JSON.stringify(shape));
await browser.close();
