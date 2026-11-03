import { chromium } from 'playwright';

const payload = { v: 1, f: 'haarlem', t: 'zwolle', d: '2026-11-02', m: 300, tm: 'depart' };
const b64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
const url = `http://127.0.0.1:3000/results/${b64}`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle' });
for (let i = 0; i < 8; i += 1) {
  const close = page.locator('.overlay button, .overlay [aria-label*="lose"], .sheet button');
  if (!(await close.count())) break;
  await close.first().click({ timeout: 1000 }).catch(() => {});
  await page.waitForTimeout(120);
}
const card = page.locator('.journey-card__link').first();
if (await card.count()) await card.click();
await page.waitForSelector('.journey-modes', { timeout: 15000 });
await page.waitForTimeout(600);

const out = await page.evaluate(() => {
  const q = (sel) => document.querySelector(sel);
  const css = (sel, prop) => {
    const el = q(sel);
    return el ? getComputedStyle(el)[prop] : null;
  };
  return {
    headerCount: document.querySelectorAll('.app-header__alert-count').length,
    dots: document.querySelectorAll('.journey-modes__dot').length,
    glyphs: document.querySelectorAll('.journey-modes__chain svg').length,
    countText: q('.journey-modes__count')?.innerText.trim() ?? null,
    swapGlyph: document.querySelectorAll('.journey-modes__swap svg').length,
    timeWeight: css('.timeline__time', 'fontWeight'),
    firstRowName: q('.timeline__rail .timeline__station')?.innerText.trim() ?? null,
    firstRowTime: q('.timeline__rail .timeline__time')?.innerText.trim() ?? null,
    factsLine: q('.journey-facts-line')?.innerText.trim() ?? null,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    priceText: q('.journey-meta__price')?.innerText.trim() ?? null,
  };
});
console.log(JSON.stringify(out, null, 2));
await page.screenshot({ path: 'artifacts/plan-batch1.png', fullPage: false });
await browser.close();
