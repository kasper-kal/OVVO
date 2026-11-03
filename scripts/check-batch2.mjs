import { chromium } from 'playwright';

const payload = { v: 1, f: 'haarlem', t: 'zwolle', d: '2026-11-02', m: 300, tm: 'depart' };
const b64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
const browser = await chromium.launch();

async function open(viewport) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 2 });
  await page.goto(`http://127.0.0.1:3000/results/${b64}`, { waitUntil: 'networkidle' });
  for (let i = 0; i < 8; i += 1) {
    const close = page.locator('.overlay button, .sheet button');
    if (!(await close.count())) break;
    await close.first().click({ timeout: 800 }).catch(() => {});
    await page.waitForTimeout(100);
  }
  await page.locator('.journey-card__link').nth(2).click();
  await page.waitForSelector('.journey-modes', { timeout: 15000 });
  await page.waitForTimeout(500);
  return page;
}

const report = (page) =>
  page.evaluate(() => {
    const box = (el) => (el ? el.getBoundingClientRect() : null);
    const platform = document.querySelector('.timeline__rail .timeline__platform');
    const station = document.querySelector('.timeline__rail .timeline__station');
    const price = document.querySelector('.journey-meta__price');
    const thumb = document.querySelector('.journey-thumb');
    return {
      changeRows: [...document.querySelectorAll('.timeline__rail--change')].map((li) => li.innerText.replace(/\n/g, ' ').trim()),
      badges: [...document.querySelectorAll('.leg-line-badge')].map((b) => `${b.textContent}:${getComputedStyle(b).backgroundColor}`),
      serviceWords: [...document.querySelectorAll('.leg-service')].map((b) => b.innerText.trim()),
      stopRows: document.querySelectorAll('.timeline__rail--stop').length,
      stopRowsWithPlatform: [...document.querySelectorAll('.timeline__rail--stop')].filter((li) => /Platform/.test(li.innerText)).length,
      stopNode: (() => { const n = document.querySelector('.timeline__node--stop'); return n ? `${getComputedStyle(n).width}/${getComputedStyle(n).borderTopWidth}` : null; })(),
      platformRightGap: platform && station ? Math.round(box(platform).right - box(station).right) : null,
      platformAtEdge: platform ? Math.round(platform.getBoundingClientRect().right) : null,
      thumb: thumb ? `${Math.round(thumb.getBoundingClientRect().width)}x${Math.round(thumb.getBoundingClientRect().height)}` : null,
      thumbHref: thumb ? thumb.getAttribute('href') : null,
      priceChip: price ? `${getComputedStyle(price).borderTopLeftRadius}/${getComputedStyle(price).backgroundColor}` : null,
      openLists: document.querySelectorAll('.timeline__rail--stop').length > 0,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });

const page = await open({ width: 390, height: 844 });
console.log('390 light', JSON.stringify(await report(page), null, 1));
await page.screenshot({ path: 'artifacts/batch2-390-light.png' });
await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
await page.waitForTimeout(300);
console.log('390 dark', JSON.stringify(await report(page), null, 1));
await page.screenshot({ path: 'artifacts/batch2-390-dark.png' });
await page.close();

const small = await open({ width: 320, height: 700 });
console.log('320', JSON.stringify(await report(small), null, 1));
await small.screenshot({ path: 'artifacts/batch2-320.png' });
await browser.close();
