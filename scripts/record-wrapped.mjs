import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  recordVideo: { dir: '/tmp/rec', size: { width: 390, height: 844 } },
});
const page = await context.newPage();
await page.goto('http://127.0.0.1:3000/yearbook?demo=1&persona=regular', { waitUntil: 'domcontentloaded' });
await page.locator('.wrapped-stage').waitFor();
await page.waitForTimeout(1500);
const gate = page.locator('.sheet button, .overlay button');
for (let i = 0; i < 4; i += 1) {
  if (!(await gate.count())) break;
  await gate.first().click({ timeout: 3000 }).catch(() => {});
  await page.waitForTimeout(250);
}
await page.waitForTimeout(400);
await page.locator('.film2-begin').click();
const seen = [];
for (let i = 0; i < 18; i += 1) {
  const id = await page.locator('.film2[data-chapter]').first().getAttribute('data-chapter').catch(() => null);
  if (id && seen[seen.length - 1] !== id) seen.push(id);
  await page.waitForTimeout(1450);
  if (i < 17) await page.keyboard.press('ArrowRight');
}
await page.waitForTimeout(2500);
await page.screenshot({ path: '/tmp/rec/last-frame.png' });
console.log('CHAPTERS', seen.length, seen.join(','));
await context.close();
await browser.close();
const [video] = await Promise.all([page.video().path()]);
mkdirSync('artifacts/wrapped-recording', { recursive: true });
console.log('VIDEO', video);
