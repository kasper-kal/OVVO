/**
 * A picture of the stop picker, light and dark, for checking the two action discs by eye.
 *
 * Usage: node scripts/shot-picker.mjs [base]
 */
import { chromium } from 'playwright';

const base = process.argv[2] ?? 'http://127.0.0.1:3000';
const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });

try {
  for (const theme of ['light', 'dark']) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.addInitScript((t) => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      const key = 'ov-planner:v1:settings';
      let settings = {};
      try {
        settings = JSON.parse(localStorage.getItem(key) ?? '{}');
      } catch {
        settings = {};
      }
      settings.theme = t;
      localStorage.setItem(key, JSON.stringify(settings));
    }, theme);
    await page.goto(base + '/', { waitUntil: 'networkidle' });
    for (let i = 0; i < 3; i += 1) {
      if ((await page.locator('.overlay').count()) === 0) break;
      await page.keyboard.press('Escape');
      await page.waitForTimeout(150);
    }
    await page.locator('.planner-row__btn').first().click();
    await page.waitForSelector('.picker-row--action .picker-row__marker', { timeout: 15000 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: `artifacts/picker-${theme}.png` });
    console.log(`artifacts/picker-${theme}.png`);
    await page.close();
  }
} finally {
  await browser.close();
}
