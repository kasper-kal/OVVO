/**
 * **A service's stops, opened on the rail.** Tapping a bus or a train lists the stops it calls at
 * between boarding and alighting, in line with the timetable — not in a dialog.
 */
import { chromium } from 'playwright';

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const page = await browser.newPage({ viewport: { width: 390, height: 1400 } });
await page.addInitScript(() => Object.defineProperty(navigator, 'webdriver', { get: () => false }));

async function dismissOverlays() {
  for (let i = 0; i < 6; i += 1) {
    if ((await page.locator('.overlay').count()) === 0) return;
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
  }
}

const link = `http://127.0.0.1:3000/results/${Buffer.from(
  JSON.stringify({ v: 1, f: 'haarlem', t: 'zaandam', d: '2026-11-02', m: 600, tm: 'depart' }),
).toString('base64')}`;
await page.goto(link, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
await dismissOverlays();
const cards = page.locator('article');
let opened = false;
for (let i = 0; i < (await cards.count()); i += 1) {
  if ((await cards.nth(i).locator('.journey-card__leg').count()) >= 3) {
    await cards.nth(i).locator('.journey-card__link').first().click();
    opened = true;
    break;
  }
}
if (!opened) await cards.first().locator('.journey-card__link').first().click();
await page.waitForSelector('.timeline', { timeout: 20000 });
await page.waitForTimeout(600);
await dismissOverlays();

const before = await page.locator('.timeline__rail--stop').count();
await page.locator('.leg-service').first().click();
await page.waitForTimeout(700);
const after = await page.evaluate(() => ({
  stopRows: document.querySelectorAll('.timeline__rail--stop').length,
  blank: document.querySelectorAll('.timeline__rail--stop .timeline__time').length,
  dialogs: document.querySelectorAll('[role="dialog"]').length,
  height: Math.round(document.documentElement.scrollHeight),
}));
console.log('stops closed', before, 'open', JSON.stringify(after));
await page.screenshot({ path: 'artifacts/leg-stops-inline.png', fullPage: true });
await browser.close();
