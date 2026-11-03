/**
 * **The results list, refreshed.** The same session rule that keeps a journey keeps the list it came
 * from: a reload should show the same journeys, not an empty results page.
 */
import { chromium } from 'playwright';

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
await page.addInitScript(() => Object.defineProperty(navigator, 'webdriver', { get: () => false }));
const link = `http://127.0.0.1:3000/results/${Buffer.from(
  JSON.stringify({ v: 1, f: 'haarlem', t: 'zaandam', d: '2026-11-02', m: 600, tm: 'depart' }),
).toString('base64')}`;
await page.goto(link, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
for (let i = 0; i < 6; i += 1) {
  if ((await page.locator('.overlay').count()) === 0) break;
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
}
const cards = () => page.locator('article').count();
console.log('results before', await cards());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
for (let i = 0; i < 6; i += 1) {
  if ((await page.locator('.overlay').count()) === 0) break;
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
}
console.log('results after ', await cards());
await browser.close();
