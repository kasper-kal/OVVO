/**
 * **Where the journey rail stops fitting.** At 360px wide the card runs off the right edge and the
 * gutter glyphs sit outside the card. This measures the boxes rather than guessing.
 */
import { chromium } from 'playwright';

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const width = Number(process.env.WIDTH ?? 360);
const page = await browser.newPage({ viewport: { width, height: 780 } });
await page.addInitScript(() => Object.defineProperty(navigator, 'webdriver', { get: () => false }));

async function dismissOverlays() {
  for (let i = 0; i < 6; i += 1) {
    if ((await page.locator('.overlay').count()) === 0) return;
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
  }
}

const link = `http://127.0.0.1:3000/results/${Buffer.from(
  JSON.stringify({ v: 1, f: 'haarlem', t: 'zaandam', d: '2026-11-02', m: 600, tm: 'depart' }),
).toString('base64')}`;
await page.goto(link, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
await dismissOverlays();
const cards = page.locator('article');
let opened = false;
for (let i = 0; i < (await cards.count()); i += 1) {
  if ((await cards.nth(i).locator('.journey-card__leg').count()) >= 3) {
    await cards.nth(i).locator('.journey-card__link').first().click();
    opened = true;
    break;
  }
}
if (!opened) await cards.first().locator('.journey-card__link').first().click();
await page.waitForSelector('.timeline', { timeout: 20000 });
await page.waitForTimeout(700);
await dismissOverlays();

const report = await page.evaluate(() => {
  const box = (selector) => {
    const el = document.querySelector(selector);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width) };
  };
  const wide = [...document.querySelectorAll('body *')]
    .filter((el) => el.getBoundingClientRect().right > window.innerWidth + 1)
    .slice(0, 8)
    .map((el) => `${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ').slice(0, 2).join('.')} right=${Math.round(el.getBoundingClientRect().right)}`);
  const header = document.querySelector('.app-header');
  const headerStyle = header ? getComputedStyle(header) : null;
  const off = (selector) => {
    const el = document.querySelector(selector);
    if (!el) return null;
    const parent = el.offsetParent;
    const cs = getComputedStyle(el);
    return {
      offsetParent: parent ? `${parent.tagName.toLowerCase()}.${(parent.className || '').toString().split(' ')[0]}` : null,
      left: cs.left,
      top: cs.top,
      position: cs.position,
    };
  };
  const row = document.querySelector('.timeline__rail');
  return {
    row: box('.timeline__rail'),
    rowPaddingLeft: row ? getComputedStyle(row).paddingLeft : null,
    timelinePaddingLeft: getComputedStyle(document.querySelector('.timeline')).paddingLeft,
    timeCss: off('.timeline__time'),
    modeCss: off('.timeline__mode'),
    viewport: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    card: box('.card'),
    timeline: box('.timeline'),
    time: box('.timeline__time'),
    mode: box('.timeline__mode'),
    header: box('.app-header'),
    headerBackground: headerStyle?.backgroundColor,
    headerPosition: headerStyle?.position,
    wide,
  };
});
console.log(JSON.stringify(report, null, 1));
console.log('times', JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('.timeline__time')].map((el) => ({ text: el.textContent, clipped: el.scrollWidth > el.clientWidth + 1 })))));
await page.screenshot({ path: 'artifacts/rail-fit.png', fullPage: true });
await page.evaluate(() => window.scrollTo(0, 260));
await page.waitForTimeout(400);
await page.screenshot({ path: 'artifacts/rail-fit-scrolled.png', fullPage: false });
await browser.close();
