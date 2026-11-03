/** Draws a guide line through the centre of every mark and line of words, and photographs the rail. */
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://127.0.0.1:3000';
const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const page = await browser.newPage({ viewport: { width: 390, height: 1200 }, deviceScaleFactor: 3 });
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
await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
await page.waitForTimeout(250);
const box = await page.evaluate(() => {
  const ol = document.querySelector('.timeline');
  const ride = ol.querySelector('.timeline__rail--ride');
  const walk = ride.cloneNode(true);
  walk.className = 'timeline__rail timeline__rail--dashed';
  const body = walk.querySelector('div');
  if (body) body.innerHTML = '<span class="t-sm t-muted">Walk 37 min \u00b7 2970 m</span>';
  ol.prepend(walk);
  const layer = document.createElement('div');
  layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;font:600 6px/1 system-ui;color:#e5484d';
  const mark = (el, label) => {
    if (!el) return;
    const r = el.getBoundingClientRect();
    const line = document.createElement('div');
    line.style.cssText = `position:fixed;left:${r.left - 4}px;top:${r.top + r.height / 2}px;width:130px;height:1px;background:#e5484d`;
    const tag = document.createElement('span');
    tag.textContent = label;
    tag.style.cssText = `position:fixed;left:${r.left + 128}px;top:${r.top + r.height / 2 - 4}px;color:#e5484d`;
    layer.append(line, tag);
  };
  const rows = [...ol.querySelectorAll(':scope > li')];
  mark(rows[0].querySelector('.timeline__time'), 'clock');
  mark(rows[0].querySelector('.timeline__mode svg'), 'walk icon');
  mark(rows[0].querySelector('.t-sm'), 'walk amount');
  mark(rows[1].querySelector('.timeline__node'), 'ring');
  mark(rows[1].querySelector('.timeline__station'), 'station');
  mark(rows[1].querySelector('.leg-service'), 'service');
  mark(rows[1].querySelector('.timeline__mode svg'), 'service icon');
  document.body.append(layer);
  const b = ol.getBoundingClientRect();
  return { x: b.x, y: b.y, width: b.width, height: b.height };
});
await page.screenshot({ path: 'artifacts/centres.png', clip: box });
console.log('box', JSON.stringify(box));
await browser.close();
