/**
 * Which state draws a white thumb on a dark sheet, and what the fields draw now.
 */
import { chromium, prepareBrowserEnv, browserIsInstalled, MISSING_BROWSER_HELP } from './browser-env.mjs';
import { mkdirSync } from 'node:fs';
prepareBrowserEnv();
if (!browserIsInstalled()) { console.error(MISSING_BROWSER_HELP); process.exit(2); }
const base = (process.env.BASE_URL || 'http://127.0.0.1:4188').replace(/\/$/, '');
const journey = `/results/${Buffer.from(JSON.stringify({ v: 1, f: 'haarlem', t: 'zwolle', d: '2026-11-02', m: 300, tm: 'depart' })).toString('base64url')}`;
mkdirSync('artifacts/diag', { recursive: true });
const browser = await chromium.launch();

const open = async (attrs) => {
  const page = await browser.newPage({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 3 });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto(`${base}${journey}`, { waitUntil: 'networkidle' });
  for (let i = 0; i < 8; i += 1) {
    const close = page.locator('.overlay button, .sheet button');
    if (!(await close.count())) break;
    await close.first().click({ timeout: 800 }).catch(() => {});
    await page.waitForTimeout(100);
  }
  await page.waitForSelector('.results-chip', { timeout: 20000 });
  await page.waitForTimeout(400);
  await page.locator('.results-chip').first().click();
  await page.locator('[aria-label="Depart at or arrive by"]').waitFor({ timeout: 10000 });
  await page.evaluate((a) => { for (const [k, v] of Object.entries(a)) document.documentElement.dataset[k] = v; }, attrs);
  await page.waitForTimeout(350);
  return page;
};

const read = (page) => page.evaluate(() => {
  const seg = document.querySelector('[aria-label="Depart at or arrive by"]');
  const pressed = seg.querySelector('.segmented__btn[aria-pressed="true"]');
  const ps = getComputedStyle(pressed);
  const modal = seg.closest('.modal, .sheet, [role="dialog"]');
  const group = document.querySelector('.when-field__group');
  const glyph = document.querySelector('.when-field__glyph');
  const input = document.querySelector('#results-date');
  return {
    theme: document.documentElement.dataset.theme,
    surface: document.documentElement.dataset.surface ?? '-',
    chrome: document.documentElement.dataset.chrome ?? '-',
    capsule: getComputedStyle(seg).backgroundColor,
    pressedBg: ps.backgroundColor,
    pressedInk: ps.color,
    modalBg: modal ? getComputedStyle(modal).backgroundColor : null,
    groupRadius: group ? getComputedStyle(group).borderRadius : null,
    glyph: glyph ? `${glyph.tagName} ${Math.round(glyph.getBoundingClientRect().width)}x${Math.round(glyph.getBoundingClientRect().height)}` : null,
    appearance: input ? getComputedStyle(input).appearance ?? getComputedStyle(input).webkitAppearance : null,
  };
});

for (const [name, attrs] of [
  ['dark', { theme: 'dark' }],
  ['dark+glass', { theme: 'dark', surface: 'glass' }],
  ['dark+tint', { theme: 'dark', surface: 'tint' }],
  ['dark+cards', { theme: 'dark', surface: 'cards' }],
  ['light+glass', { theme: 'light', surface: 'glass' }],
  ['light', { theme: 'light' }],
]) {
  const page = await open(attrs);
  console.log(name.padEnd(12), JSON.stringify(await read(page)));
  if (name === 'dark') {
    await page.locator('[aria-label="Depart at or arrive by"]').screenshot({ path: 'artifacts/diag/switch-dark.png' });
    await page.locator('.when-field__group').screenshot({ path: 'artifacts/diag/group-dark.png' });
  }
  if (name === 'light') {
    await page.locator('.when-field__group').screenshot({ path: 'artifacts/diag/group-light.png' });
    await page.locator('[aria-label="Depart at or arrive by"]').screenshot({ path: 'artifacts/diag/switch-light.png' });
  }
  await page.close();
}
await browser.close();
