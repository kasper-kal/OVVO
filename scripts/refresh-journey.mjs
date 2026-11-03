/**
 * **A journey page, refreshed.** The report: reloading a journey always showed "This journey could
 * not be restored", because journeys live in memory and a reload empties it. This opens a journey,
 * reloads it, and says whether the timetable came back.
 */
import { chromium } from 'playwright';

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
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

const read = async () => ({
  url: page.url(),
  timeline: await page.locator('.timeline').count(),
  stations: await page.locator('.timeline__station').count(),
  actions: await page.locator('.journey-actions button, .journey-actions a').count(),
  lost: await page.getByText('could not be restored').count(),
});

console.log('before refresh', JSON.stringify(await read()));
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await dismissOverlays();
console.log('after refresh ', JSON.stringify(await read()));
await page.screenshot({ path: 'artifacts/journey-refresh.png', fullPage: false });
await browser.close();
