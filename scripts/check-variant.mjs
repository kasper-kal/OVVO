/**
 * **Does the board variant control behave like a number?**
 *
 * The developer panel used to print "Variant · N" in a field label with two buttons under it that
 * could only go forward by one or jump back to zero: a number you could read but not type, and no
 * way back down. The number is the control now, so this walks it: start, plus, minus, typed, reset,
 * and finally whether a different number actually draws different rows.
 *
 * Usage: node scripts/check-variant.mjs [base]
 */
import { chromium } from 'playwright';

const base = process.argv[2] ?? 'http://127.0.0.1:3000';

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
let failures = 0;
const say = (ok, line) => {
  if (!ok) failures += 1;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${line}`);
};

try {
  const page = await browser.newPage({ viewport: { width: 390, height: 1200 } });
  await page.addInitScript(() => {
    /* Playwright is not an old browser. */
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    /*
     * The developer panel is closed unless developer mode is on, and AppState merges what it finds
     * over the defaults, so this one flag is enough to open the door.
     */
    try {
      const key = 'ov-planner:v1:settings';
      const current = JSON.parse(window.localStorage.getItem(key) ?? '{}');
      current.developerMode = true;
      window.localStorage.setItem(key, JSON.stringify(current));
    } catch {
      /* storage unavailable: the rest of the walk will say so */
    }
  });

  const clearOverlays = async () => {
    for (let i = 0; i < 4; i += 1) {
      if ((await page.locator('.overlay').count()) === 0) return;
      await page.keyboard.press('Escape');
      await page.waitForTimeout(250);
    }
  };

  await page.goto(`${base}/developer`, { waitUntil: 'networkidle' });
  await clearOverlays();
  say(/developer/.test(page.url()), `the developer panel opens (${page.url()})`);

  const field = page.locator('input[type=number]').first();
  if ((await field.count()) === 0) {
    say(false, 'there is a number field for the variant');
    throw new Error('no number field');
  }
  const read = () => field.inputValue();

  say((await read()) === '0', 'it starts at 0');
  await page.getByRole('button', { name: /next variant/i }).first().click({ force: true });
  await page.waitForTimeout(250);
  say((await read()) === '1', `the plus steps it up (${await read()})`);
  await page.getByRole('button', { name: /previous variant/i }).first().click({ force: true });
  await page.waitForTimeout(250);
  say((await read()) === '0', `the minus steps it back (${await read()})`);

  await field.fill('7');
  await page.waitForTimeout(350);
  say((await read()) === '7', 'typing a number works: the number is the control');

  await page.getByRole('button', { name: /the first roll/i }).first().click({ force: true });
  await page.waitForTimeout(250);
  say((await read()) === '0', 'The first roll returns to 0');

  /* A number that changes nothing is worse than no control, so the board is asked. */
  const firstRow = async (value) => {
    await page.goto(`${base}/developer`, { waitUntil: 'networkidle' });
    await clearOverlays();
    await page.locator('input[type=number]').first().fill(String(value));
    await page.waitForTimeout(350);
    /* A board needs a stop; without one the screen is an empty state and proves nothing. */
    await page.goto(`${base}/departures?stop=haarlem`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    return page
      .locator('.board-list')
      .first()
      .innerText()
      .catch(() => '');
  };
  const three = await firstRow(3);
  const nine = await firstRow(9);
  say(
    three.length > 0 && three !== nine,
    `a different number draws different rows (${three.replace(/\s+/g, ' ').trim()} vs ${nine.replace(/\s+/g, ' ').trim()})`,
  );
} finally {
  await browser.close();
}

console.log(failures === 0 ? '\nvariant control: clean' : `\nvariant control: ${failures} failing`);
process.exit(failures === 0 ? 0 : 1);
