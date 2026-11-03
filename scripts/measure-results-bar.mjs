/**
 * **The four controls above the journeys, measured side by side.**
 *
 * Reported: the sort chip ("Best") looks unlike the three beside it. This plans a real journey
 * (the results screen has nothing to measure without one) and prints each control's shape, fill and
 * box, so the difference is a measurement rather than an impression.
 *
 * Usage: node scripts/measure-results-bar.mjs [base] [theme]
 */
import { chromium } from 'playwright';

const base = process.argv[2] ?? 'http://127.0.0.1:3000';
const theme = process.argv[3] ?? 'dark';

const closeOverlays = async (page) => {
  for (let i = 0; i < 4; i += 1) {
    if ((await page.locator('.overlay').count()) === 0) break;
    await page.keyboard.press('Escape');
    await page.waitForTimeout(150);
  }
};

const pickStop = async (page, field, name) => {
  await page.locator(field).fill(name);
  const row = page.locator('.picker-row', { hasText: name }).first();
  await row.waitFor({ timeout: 20000 });
  await row.click();
  await page.waitForTimeout(400);
};

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });

try {
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
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
  await closeOverlays(page);

  await page.locator('.planner-row__btn').first().click();
  await page.waitForSelector('#picker-from', { timeout: 20000 });
  await pickStop(page, '#picker-from', 'Haarlem Station');
  await pickStop(page, '#picker-to', 'Zaandam Station');
  const plan = page.getByRole('button', { name: 'Plan journey' });
  if (await plan.count()) await plan.first().click();
  await page.waitForSelector('.results-bar', { timeout: 20000 });
  await page.waitForTimeout(800);

  const rows = await page.evaluate(() => {
    const bar = document.querySelector('.results-bar');
    const out = [];
    for (const chip of bar.querySelectorAll('.results-chip')) {
      const cs = getComputedStyle(chip);
      const rect = chip.getBoundingClientRect();
      const inner = chip.querySelector('.results-chip__select');
      const innerCs = inner ? getComputedStyle(inner) : null;
      out.push({
        text: (chip.textContent ?? '').trim().slice(0, 24),
        tag: chip.tagName.toLowerCase(),
        radius: cs.borderRadius,
        background: cs.backgroundColor,
        border: `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`,
        height: Math.round(rect.height),
        width: Math.round(rect.width),
        font: `${cs.fontSize} / ${cs.fontWeight}`,
        selectRadius: innerCs?.borderRadius ?? null,
        selectBackground: innerCs?.backgroundColor ?? null,
        selectFont: innerCs ? `${innerCs.fontSize} / ${innerCs.fontWeight}` : null,
        selectPadding: innerCs?.padding ?? null,
      });
    }
    return out;
  });

  console.log(`theme ${theme}`);
  for (const row of rows) console.log(JSON.stringify(row));

  await page.screenshot({ path: `artifacts/results-${theme}.png` });
  console.log(`artifacts/results-${theme}.png`);
} finally {
  await browser.close();
}
