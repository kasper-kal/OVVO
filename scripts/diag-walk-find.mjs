/** Finds a journey that starts or contains a walk, and measures that row's gutter. */
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
const pairs = [
  { f: 'haarlem', t: 'haarlem-schalkwijk' },
  { f: 'amsterdam-centraal', t: 'amsterdam-muiderpoort' },
  { f: 'zaandam', t: 'zaandam-kogerveld' },
  { f: 'utrecht-centraal', t: 'utrecht-vaartsche-rijn' },
  { f: 'haarlem', t: 'zaandam' },
];
for (const pair of pairs) {
  const link = `http://127.0.0.1:3000/results/${Buffer.from(
    JSON.stringify({ v: 1, f: pair.f, t: pair.t, d: '2026-11-02', m: 600, tm: 'depart' }),
  ).toString('base64')}`;
  await page.goto(link, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await esc();
  const cards = page.locator('article');
  for (let i = 0; i < Math.min(await cards.count(), 8); i += 1) {
    if ((await cards.nth(i).locator('.journey-card__leg').count()) < 2) continue;
    await cards.nth(i).locator('.journey-card__link').first().click();
    await page.waitForSelector('.timeline', { timeout: 20000 });
    await page.waitForTimeout(400);
    await esc();
    if ((await page.locator('.timeline__rail--dashed').count()) > 0) {
      const box = await page.locator('.timeline__rail--dashed').first().evaluate((li) => {
        const r = (sel) => {
          const el = li.querySelector(sel);
          if (!el) return null;
          const b = el.getBoundingClientRect();
          return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) };
        };
        const self = li.getBoundingClientRect();
        return {
          row: { y: Math.round(self.y), h: Math.round(self.height) },
          time: r('.timeline__time'),
          mode: r('.timeline__mode svg'),
          node: r('.timeline__node'),
          text: li.textContent.trim().slice(0, 40),
        };
      });
      console.log(pair.f, '->', pair.t, 'card', i, JSON.stringify(box));
      await page.locator('.timeline').screenshot({ path: 'artifacts/rail-walk.png' });
      await browser.close();
      process.exit(0);
    }
    await page.goBack({ waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await esc();
  }
}
console.log('no journey with a walk found');
await browser.close();
