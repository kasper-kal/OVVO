/**
 * **The Options chip with a count on it, photographed in two styles** — the reported card, and a
 * plain one, so the disc can be looked at rather than only measured.
 */
import { chromium } from 'playwright';

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const link = `http://127.0.0.1:3000/results/${Buffer.from(
  JSON.stringify({ v: 1, f: 'haarlem', t: 'zaandam', d: '2026-11-02', m: 600, tm: 'depart' }),
).toString('base64')}`;

for (const [name, theme, styleId] of [
  ['dark-glass', 'dark', 'avondglas'],
  ['light', 'light', 'cream'],
]) {
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  await page.addInitScript(() => Object.defineProperty(navigator, 'webdriver', { get: () => false }));
  await page.goto('http://127.0.0.1:3000/', { waitUntil: 'networkidle' });
  await page.evaluate(
    ([t, s]) => localStorage.setItem('ov-planner:v1:settings', JSON.stringify({ theme: t, styleId: s, developerMode: false })),
    [theme, styleId],
  );
  await page.goto(link, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  for (let i = 0; i < 6; i += 1) {
    if ((await page.locator('.overlay, [role="dialog"]').count()) === 0) break;
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }
  await page.getByRole('button', { name: 'Options' }).first().click();
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: 'Direct journeys only' }).first().click();
  await page.waitForTimeout(400);
  const chip = page.locator('.results-chip', { hasText: 'Options' }).first();
  const count = await chip.locator('.results-chip__count').count();
  const colours = await chip.locator('.results-chip__count').evaluate((node) => {
    const style = getComputedStyle(node);
    return { fill: style.backgroundColor, ink: style.color };
  }).catch(() => null);
  await chip.screenshot({ path: `artifacts/chip-count-${name}.png` });
  console.log(name, 'count rendered:', count, JSON.stringify(colours));
  await page.close();
}
await browser.close();
