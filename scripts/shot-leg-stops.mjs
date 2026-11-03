/**
 * **The sheet a service opens into** — the stops between boarding and alighting, photographed, so
 * the journey's newest control can be looked at rather than assumed.
 */
import { chromium } from 'playwright';

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
await page.addInitScript(() => Object.defineProperty(navigator, 'webdriver', { get: () => false }));
/* A consent sheet can land on the page before anything is tappable; close it first. */
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
const count = await cards.count();
let opened = false;
for (let i = 0; i < count; i += 1) {
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

/* The rail's two weights, measured where they are drawn. */
const rails = await page.evaluate(() =>
  [...document.querySelectorAll('.timeline__rail')].map((row) => {
    const style = getComputedStyle(row, '::before');
    return {
      ride: row.classList.contains('timeline__rail--ride'),
      width: style.width,
      colour: style.backgroundColor,
      dashed: style.backgroundImage.includes('repeating'),
    };
  }),
);
console.log('rails', JSON.stringify(rails));

await page.locator('.leg-stops').first().click();
await page.waitForSelector('[role="dialog"]', { timeout: 10000 });
await page.waitForTimeout(600);
const shape = await page.evaluate(() => ({
  title: document.querySelector('[role="dialog"] h2')?.textContent,
  description: document.querySelector('[role="dialog"] p')?.textContent,
  rows: document.querySelectorAll('[role="dialog"] ol > li').length,
}));
console.log('sheet', JSON.stringify(shape));
await page.screenshot({ path: 'artifacts/leg-stops-sheet.png' });
await browser.close();
