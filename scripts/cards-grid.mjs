/* Temporary: every card at phone size, held still. Deleted after use. */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

mkdirSync('/tmp/cards', { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto('http://127.0.0.1:3000/yearbook?demo=1&persona=regular', { waitUntil: 'domcontentloaded' });
await page.locator('.wrapped-stage').waitFor();
const gate = page.locator('.sheet button, .overlay button');
for (let i = 0; i < 4; i += 1) {
  if (!(await gate.count())) break;
  await gate.first().click({ timeout: 2500 }).catch(() => {});
  await page.waitForTimeout(200);
}
await page.locator('.film2-begin').click();
const order = [];
for (let i = 0; i < 20; i += 1) {
  await page.waitForTimeout(500);
  await page.locator('.wrapped-pause').click().catch(() => {});
  await page.waitForTimeout(350);
  const id = await page.locator('.film2[data-chapter]').first().getAttribute('data-chapter');
  order.push(id);
  await page.screenshot({ path: `/tmp/cards/${String(i).padStart(2, '0')}-${id}.png` });
  await page.locator('.wrapped-pause').click().catch(() => {});
  await page.keyboard.press('ArrowRight');
}
console.log(order.join(','));
await browser.close();
