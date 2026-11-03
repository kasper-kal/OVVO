import { chromium } from 'playwright';
const payload = { v: 1, f: 'haarlem', t: 'zwolle', d: '2026-11-02', m: 300, tm: 'depart' };
const b64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto(`http://127.0.0.1:3000/results/${b64}`, { waitUntil: 'networkidle' });
for (let i = 0; i < 8; i += 1) {
  const close = page.locator('.overlay button, .sheet button');
  if (!(await close.count())) break;
  await close.first().click({ timeout: 800 }).catch(() => {});
  await page.waitForTimeout(120);
}
await page.locator('.journey-card__link').nth(2).click();
await page.waitForSelector('.journey-modes', { timeout: 15000 });
await page.waitForTimeout(400);
const rows = await page.evaluate(() =>
  [...document.querySelectorAll('.timeline > li')].map((li) => ({
    cls: li.className.replace('timeline__rail ', '').replace('timeline__node ', ''),
    time: li.querySelector('.timeline__time')?.textContent?.trim() ?? '',
    text: li.innerText.replace(/\n/g, ' | ').trim().slice(0, 80),
  })),
);
console.log(JSON.stringify(rows, null, 1));
await browser.close();
