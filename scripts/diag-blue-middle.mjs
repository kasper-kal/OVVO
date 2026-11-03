/** Is the block of words and its glyph on the middle of the blue/dashed line? */
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://127.0.0.1:3000';
const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const page = await browser.newPage({ viewport: { width: 390, height: 1000 }, deviceScaleFactor: 3 });
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
await page.waitForTimeout(400);
await esc();
const out = await page.evaluate(() => {
  const ol = document.querySelector('.timeline');
  const rows = [...ol.querySelectorAll(':scope > li')].filter((li) =>
    li.classList.contains('timeline__rail--ride') && !li.classList.contains('timeline__rail--stop'));
  const read = (li, label) => {
    const r = li.getBoundingClientRect();
    const cs = getComputedStyle(li, '::before');
    const top = r.top + parseFloat(cs.top);
    const bottom = r.bottom - parseFloat(cs.bottom);
    const kids = [...li.querySelector(':scope > div').children].slice(1);
    const block = kids.length
      ? { top: Math.min(...kids.map((k) => k.getBoundingClientRect().top)), bottom: Math.max(...kids.map((k) => k.getBoundingClientRect().bottom)) }
      : null;
    const icon = li.querySelector('.timeline__mode svg');
    const ir = icon ? icon.getBoundingClientRect() : null;
    return {
      label,
      lineMiddle: +((top + bottom) / 2 - r.top).toFixed(1),
      blockMiddle: block ? +((block.top + block.bottom) / 2 - r.top).toFixed(1) : null,
      iconMiddle: ir ? +(ir.top + ir.height / 2 - r.top).toFixed(1) : null,
      rowH: +r.height.toFixed(1),
    };
  };
  const ride = rows[0];
  const clone = ride.cloneNode(true);
  clone.className = 'timeline__rail timeline__rail--dashed';
  const body = clone.querySelector('div');
  if (body) body.innerHTML = '<span class="t-sm t-muted">Walk 37 min</span>';
  ol.prepend(clone);
  return [read(ride, 'ride'), read(clone, 'walk')];
});
console.log(JSON.stringify(out, null, 1));
await page.locator('.timeline').screenshot({ path: process.env.OUT || 'artifacts/blue-middle.png' });
await browser.close();
