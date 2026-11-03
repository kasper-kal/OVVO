/** Measures, per row, where the ring, the glyph and each line of words actually sit. */
import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const page = await browser.newPage({ viewport: { width: 360, height: 900 }, deviceScaleFactor: 2 });
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
const data = await page.evaluate(() => {
  const ol = document.querySelector('.timeline');
  const rows = [...ol.querySelectorAll(':scope > li')].slice(0, 4).map((li) => {
    const self = li.getBoundingClientRect();
    const rel = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: +(r.top - self.top).toFixed(1), h: +r.height.toFixed(1), c: +(r.top - self.top + r.height / 2).toFixed(1) };
    };
    const lines = [...li.querySelectorAll('.timeline__station, .t-sm, .leg-service')]
      .slice(0, 3)
      .map((el) => ({ t: el.textContent.trim().slice(0, 18), ...rel(el) }));
    return {
      cls: li.className.split(' ').pop(),
      h: +self.height.toFixed(1),
      node: rel(li.querySelector('.timeline__node')),
      glyph: rel(li.querySelector('.timeline__mode svg')),
      lines,
      rail: (() => { const s = getComputedStyle(li, '::before'); return { top: s.top, bottom: s.bottom, h: s.height, bgPos: s.backgroundPosition }; })(),
    };
  });
  return { gap: getComputedStyle(ol).rowGap, rows };
});
console.log(JSON.stringify(data, null, 1));
await browser.close();
