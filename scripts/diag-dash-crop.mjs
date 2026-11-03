/** A very close crop of one walk segment, to see whether the dashes are really there. */
import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const page = await browser.newPage({ viewport: { width: 360, height: 900 }, deviceScaleFactor: 4 });
await page.addInitScript(() => Object.defineProperty(navigator, 'webdriver', { get: () => false }));
async function esc() {
  for (let i = 0; i < 6; i += 1) {
    if ((await page.locator('.overlay').count()) === 0) return;
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }
}
const link = `http://127.0.0.1:3000/results/${Buffer.from(
  JSON.stringify({ v: 1, f: 'haarlem', t: 'zaandam', d: '2026-11-02', m: 600, tm: 'depart' }),
).toString('base64')}`;
await page.goto(link, { waitUntil: 'networkidle' });
await page.waitForTimeout(900);
await esc();
const cards = page.locator('article');
for (let i = 0; i < (await cards.count()); i += 1) {
  if ((await cards.nth(i).locator('.journey-card__leg').count()) >= 3) {
    await cards.nth(i).locator('.journey-card__link').first().click();
    break;
  }
}
await page.waitForSelector('.timeline', { timeout: 20000 });
await page.waitForTimeout(400);
await esc();
const box = await page.evaluate(() => {
  const ol = document.querySelector('.timeline');
  const ride = ol.querySelector('.timeline__rail--ride');
  const walk = ride.cloneNode(true);
  walk.className = 'timeline__rail timeline__rail--dashed';
  const body = walk.querySelector('div');
  if (body) body.innerHTML = '<span class="t-sm t-muted">Walk 37 min</span>';
  ol.prepend(walk);
  const r = walk.getBoundingClientRect();
  return { x: r.x - 8, y: r.y + 10, width: 40, height: r.height + 30 };
});
await page.screenshot({ path: 'artifacts/dash-crop.png', clip: box });
console.log('crop', JSON.stringify(box));
await browser.close();
