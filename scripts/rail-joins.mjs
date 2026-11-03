import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

/*
 * **Every join on the rail, measured instead of looked at.**
 *
 * A connector that starts just below its mark, or ends just short of the next one, leaves a sliver of
 * page that reads as a gap. Each earlier fix was one rule in one place while the others kept their own
 * arithmetic. This script draws the journey and records, for every ride row, the column its connector
 * occupies and the rows it should cover; `rail-joins.py` reads the pixels and fails on any
 * page-coloured row inside one.
 */
const payload = { v: 1, f: 'haarlem', t: 'zwolle', d: '2026-11-02', m: 300, tm: 'depart' };
const b64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
mkdirSync('artifacts/rail-joins', { recursive: true });

const browser = await chromium.launch();
const runs = [];

for (const width of [390, 320]) {
  for (const theme of ['light', 'dark']) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 3 });
    await page.goto(`http://127.0.0.1:3000/results/${b64}`, { waitUntil: 'networkidle' });
    for (let i = 0; i < 8; i += 1) {
      const close = page.locator('.overlay button, .sheet button');
      if (!(await close.count())) break;
      await close.first().click({ timeout: 800 }).catch(() => {});
      await page.waitForTimeout(120);
    }
    await page.locator('.journey-card__link').nth(2).click();
    await page.waitForSelector('.timeline', { timeout: 15000 });
    if (theme === 'dark') await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
    await page.waitForTimeout(400);

    const rail = await page.evaluate(() => {
      const main = document.querySelector('.app-main');
      const mainBox = main.getBoundingClientRect();
      const rows = [];
      document.querySelectorAll('.timeline > li').forEach((li) => {
        const rect = li.getBoundingClientRect();
        const node = li.querySelector('.timeline__node');
        const nodeBox = node ? node.getBoundingClientRect() : null;
        rows.push({
          cls: li.className,
          top: rect.top - mainBox.top,
          bottom: rect.bottom - mainBox.top,
          nodeCol: nodeBox ? nodeBox.left - mainBox.left + nodeBox.width / 2 : null,
        });
      });
      return {
        bg: getComputedStyle(document.documentElement).backgroundColor,
        rows,
      };
    });
    const gap = await page.evaluate(
      () => parseFloat(getComputedStyle(document.querySelector('.timeline')).getPropertyValue('--timeline-gap')) || 32,
    );
    const name = `artifacts/rail-joins/${width}-${theme}.png`;
    await page.screenshot({ path: name, fullPage: true });
    runs.push({ name, width, theme, bg: rail.bg, gap, rows: rail.rows });
    await page.close();
  }
}

writeFileSync('artifacts/rail-joins/geometry.json', JSON.stringify(runs, null, 1));
console.log('geometry written for', runs.length, 'runs');
await browser.close();
