/** Opens the DEPLOYED site, walks to a journey, and reads the rail as it is really served. */
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'https://ovvo.vibecreations.workers.dev';
const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await page.addInitScript(() => Object.defineProperty(navigator, 'webdriver', { get: () => false }));
async function esc() {
  for (let i = 0; i < 6; i += 1) {
    if ((await page.locator('.overlay').count()) === 0) return;
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }
}
const link = `${BASE}/results/${Buffer.from(
  JSON.stringify({ v: 1, f: 'haarlem', t: 'zaandam', d: '2026-11-02', m: 600, tm: 'depart' }),
).toString('base64')}`;
await page.goto(link, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
await esc();
const cards = page.locator('article');
for (let i = 0; i < (await cards.count()); i += 1) {
  if ((await cards.nth(i).locator('.journey-card__leg').count()) >= 3) {
    await cards.nth(i).locator('.journey-card__link').first().click();
    break;
  }
}
await page.waitForSelector('.timeline', { timeout: 20000 });
await page.waitForTimeout(600);
await esc();
const data = await page.evaluate(() => {
  const ol = document.querySelector('.timeline');
  const ink = (el) => {
    // the box the letters actually fill, not the line box
    const r = document.createRange();
    r.selectNodeContents(el);
    const b = r.getBoundingClientRect();
    return b.height ? b : el.getBoundingClientRect();
  };
  const rows = [...ol.querySelectorAll(':scope > li')].map((li) => {
    const self = li.getBoundingClientRect();
    const rel = (b) => (b ? { c: +(b.top - self.top + b.height / 2).toFixed(1), h: +b.height.toFixed(1) } : null);
    const node = li.querySelector('.timeline__node');
    const glyph = li.querySelector('.timeline__mode');
    const station = li.querySelector('.timeline__station, .t-sm');
    const time = li.querySelector('.timeline__time');
    return {
      cls: li.className.split(' ').slice(-1)[0],
      h: +self.height.toFixed(1),
      ring: rel(node && node.getBoundingClientRect()),
      glyphInk: rel(glyph && ink(glyph)),
      stationInk: rel(station && ink(station)),
      timeInk: rel(time && ink(time)),
      rail: (() => { const s = getComputedStyle(li, '::before'); return `${s.top} / ${s.bottom}`; })(),
      dashed: li.classList.contains('timeline__rail--dashed'),
    };
  });
  return { gap: getComputedStyle(ol).rowGap, rows };
});
console.log(JSON.stringify(data, null, 1));
await page.locator('.timeline').screenshot({ path: process.env.OUT || 'artifacts/live-rail.png' });
await browser.close();
