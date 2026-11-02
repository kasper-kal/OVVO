/**
 * What does the stop picker show for an address query? A dump, for reproducing a long chain.
 *
 * Usage: node scripts/debug-picker-address.mjs [base]
 */
import { chromium } from 'playwright';

const base = process.argv[2] ?? 'http://127.0.0.1:3000';
const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });

try {
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  await page.addInitScript(() => Object.defineProperty(navigator, 'webdriver', { get: () => false }));
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  for (let i = 0; i < 6; i += 1) {
    if ((await page.locator('.overlay, [role="dialog"]').count()) === 0) break;
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }
  await page.locator('.planner-row__btn').first().click();
  await page.waitForSelector('#picker-from', { timeout: 20000 });
  await page.locator('#picker-from').fill('Meeuwenstraat 98');
  await page.waitForTimeout(4000);

  const dump = await page.evaluate(() => ({
    rows: [...document.querySelectorAll('.picker__item')].map((row) => ({
      className: row.className,
      text: (row.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 70),
    })),
    status: [...document.querySelectorAll('[role="status"]')].map((node) => (node.textContent ?? '').trim().slice(0, 90)),
    list: Boolean(document.querySelector('#picker-list')),
  }));
  console.log(JSON.stringify(dump, null, 2));
  await page.screenshot({ path: 'artifacts/picker-address-debug.png' });
} finally {
  await browser.close();
}
