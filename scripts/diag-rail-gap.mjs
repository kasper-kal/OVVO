import { chromium } from 'playwright';
const payload = { v: 1, f: 'haarlem', t: 'zwolle', d: '2026-11-02', m: 300, tm: 'depart' };
const b64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
await page.goto(`http://127.0.0.1:3000/results/${b64}`, { waitUntil: 'networkidle' });
for (let i = 0; i < 8; i += 1) {
  const close = page.locator('.overlay button, .sheet button');
  if (!(await close.count())) break;
  await close.first().click({ timeout: 800 }).catch(() => {});
  await page.waitForTimeout(120);
}
await page.locator('.journey-card__link').nth(2).click();
await page.waitForSelector('.timeline', { timeout: 15000 });
await page.waitForTimeout(400);
const facts = await page.evaluate(() => {
  const li = document.querySelector('.timeline > li');
  const node = li.querySelector('.timeline__node');
  const pseudo = getComputedStyle(li, '::before');
  const liBox = li.getBoundingClientRect();
  const nodeBox = node.getBoundingClientRect();
  return {
    liClass: li.className,
    liTop: Math.round(liBox.top),
    pseudoTop: pseudo.top,
    pseudoBottom: pseudo.bottom,
    pseudoHeight: pseudo.height,
    pseudoBg: pseudo.backgroundColor,
    pseudoWidth: pseudo.width,
    nodeTop: Math.round(nodeBox.top - liBox.top),
    nodeBottom: Math.round(nodeBox.bottom - liBox.top),
    nodeSize: Math.round(nodeBox.width),
    nodeBorder: getComputedStyle(node).borderTopWidth,
    rowGapVar: getComputedStyle(li).getPropertyValue('--timeline-gap'),
  };
});
console.log(JSON.stringify(facts, null, 1));
const box = await page.locator('.timeline > li').first().boundingBox();
await page.screenshot({ path: 'artifacts/rail-gap.png', clip: { x: 0, y: box.y - 8, width: 220, height: 70 } });
await browser.close();
