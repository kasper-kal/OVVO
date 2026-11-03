/** The rail in the dark appearance: the walk's joins, the glyph column, and the arrival square. */
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'https://ovvo.vibecreations.workers.dev';
const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const page = await browser.newPage({ viewport: { width: 390, height: 1000 }, deviceScaleFactor: 3, colorScheme: 'dark' });
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
await page.waitForTimeout(300);
const info = await page.evaluate(() => {
  const ol = document.querySelector('.timeline');
  const ink = (el) => {
    const r = document.createRange();
    r.selectNodeContents(el);
    const b = r.getBoundingClientRect();
    return b.height ? b : el.getBoundingClientRect();
  };
  const first = ol.querySelector(':scope > li');
  const glyph = first.querySelector('.timeline__mode svg').getBoundingClientRect();
  const time = ink(first.querySelector('.timeline__time'));
  const ride = ol.querySelector('.timeline__rail--ride');
  const walk = ride.cloneNode(true);
  walk.className = 'timeline__rail timeline__rail--dashed';
  const walkBody = walk.querySelector('div');
  if (walkBody) walkBody.innerHTML = '<span class="t-sm t-muted">Walk 37 min \u00b7 2970 m</span>';
  ol.prepend(walk);
  const wGlyph = walk.querySelector('.timeline__mode svg').getBoundingClientRect();
  const wText = ink(walk.querySelector('.t-sm'));
  const wRow = walk.getBoundingClientRect();
  const nextRing = walk.nextElementSibling.querySelector('.timeline__node').getBoundingClientRect();
  const cs = getComputedStyle(walk, '::before');
  const end = ol.querySelector('.timeline__node--end');
  return {
    serviceGlyphCx: +(glyph.x + glyph.width / 2).toFixed(1),
    clockCx: +(time.x + time.width / 2).toFixed(1),
    serviceGlyphCy: +(glyph.y + glyph.height / 2).toFixed(1),
    clockCy: +(time.y + time.height / 2).toFixed(1),
    walkGlyphCy: +(wGlyph.y + wGlyph.height / 2).toFixed(1),
    walkWordsCy: +(wText.y + wText.height / 2).toFixed(1),
    walkRailTop: cs.top,
    walkRailBottom: cs.bottom,
    rowH: +wRow.height.toFixed(1),
    nextRingTopInWalk: +(nextRing.y - wRow.y).toFixed(1),
    endBg: getComputedStyle(end).backgroundColor,
    pageBg: getComputedStyle(document.body).backgroundColor,
    themeAttr: document.documentElement.dataset.theme,
  };
});
console.log(JSON.stringify(info, null, 1));
await page.locator('.timeline').screenshot({ path: process.env.OUT || 'artifacts/dark-rail.png' });
await browser.close();
