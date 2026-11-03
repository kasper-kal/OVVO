/** Measures the first walk row: where its time, glyph and ring actually land. */
import { chromium } from 'playwright';
const dark = process.argv.includes('--dark');
const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const page = await browser.newPage({ viewport: { width: 360, height: 900 }, deviceScaleFactor: 3 });
await page.addInitScript((d) => {
  Object.defineProperty(navigator, 'webdriver', { get: () => false });
  localStorage.setItem('ovv:theme', d ? 'dark' : 'light');
}, dark);
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
await page.waitForTimeout(1000);
await esc();
const cards = page.locator('article');
for (let i = 0; i < (await cards.count()); i += 1) {
  if ((await cards.nth(i).locator('.journey-card__leg').count()) >= 3) {
    await cards.nth(i).locator('.journey-card__link').first().click();
    break;
  }
}
await page.waitForSelector('.timeline', { timeout: 20000 });
await page.waitForTimeout(500);
await esc();
const rows = await page.locator('.timeline > li').evaluateAll((list) =>
  list.slice(0, 3).map((li) => {
    const box = (sel) => {
      const el = li.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
    };
    return {
      cls: li.className,
      li: (() => { const r = li.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; })(),
      time: box('.timeline__time'),
      mode: box('.timeline__mode svg'),
      node: box('.timeline__node'),
      text: li.textContent.trim().slice(0, 40),
    };
  }),
);
console.log(JSON.stringify(rows, null, 2));
await page.locator('.timeline').screenshot({ path: 'artifacts/rail-top.png', clip: undefined });
await browser.close();
