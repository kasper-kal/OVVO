/** Puts a real walk row at the top of the rail in the live page and measures its gutter. */
import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const page = await browser.newPage({ viewport: { width: 360, height: 900 }, deviceScaleFactor: 3 });
await page.addInitScript(() => {
  Object.defineProperty(navigator, 'webdriver', { get: () => false });
  localStorage.setItem('ovv:theme', 'dark');
});
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
const result = await page.evaluate(() => {
  const ol = document.querySelector('.timeline');
  const ride = ol.querySelector('.timeline__rail--ride');
  const walk = ride.cloneNode(true);
  walk.className = 'timeline__rail timeline__rail--dashed';
  const glyph = walk.querySelector('.timeline__mode');
  if (!glyph) return { error: 'no glyph in clone' };
  const body = walk.querySelector('div');
  if (body) {
    body.innerHTML = '<span class="t-sm t-muted">Walk 37 min \u00b7 2970 m</span>';
  }
  ol.prepend(walk);
  const b = (el) => {
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
  };
  const row = b(walk);
  const time = b(walk.querySelector('.timeline__time'));
  const mode = b(glyph.querySelector('svg') || glyph);
  const overlapY = Math.max(0, Math.min(row.y + row.h, Math.max(time.y + time.h, mode.y + mode.h)) - Math.max(row.y, Math.max(time.y, mode.y)));
  return {
    row,
    time,
    mode,
    timeAndGlyphOverlap: Math.min(time.y + time.h, mode.y + mode.h) - Math.max(time.y, mode.y) > 0,
    glyphInsideRow: mode.y + mode.h <= row.y + row.h + 1,
    overlapY,
  };
});
console.log(JSON.stringify(result));
const before = await page.evaluate(() => {
  const li = document.querySelector('.timeline__rail--dashed');
  const s = getComputedStyle(li, '::before');
  return { top: s.top, bottom: s.bottom, height: s.height, bg: s.backgroundImage.slice(0, 80), pos: s.backgroundPosition, rowH: li.getBoundingClientRect().height };
});
console.log('DASHED::BEFORE', JSON.stringify(before));
await page.locator('.timeline').screenshot({ path: process.env.OUT || 'artifacts/rail-walk.png' });
await browser.close();
