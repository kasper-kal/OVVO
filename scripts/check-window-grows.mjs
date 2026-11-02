/**
 * **Earlier and Later must add journeys, not swap the list.**
 *
 * Plans a real journey, then presses Later and Earlier and counts the cards each time. A press that
 * replaces the list shows a different count going up and down; a press that pages it only grows.
 *
 * Usage: node scripts/check-window-grows.mjs [base]
 */
import { chromium } from 'playwright';

const base = process.argv[2] ?? 'http://127.0.0.1:3000';
let failures = 0;
const say = (ok, line) => {
  if (!ok) failures += 1;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${line}`);
};

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });

try {
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  await page.addInitScript(() => Object.defineProperty(navigator, 'webdriver', { get: () => false }));
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  /*
   * A first visit to the real site opens the location question over the planner, and a press the
   * dialog covers never lands — measured on the deployed build, where the planner rows exist and
   * the click still waited forever. The wait is for that dialog to arrive; the loop then puts it
   * away, so the check runs the same on a fresh browser as on a warm one.
   */
  await page.waitForTimeout(1200);
  for (let i = 0; i < 6; i += 1) {
    if ((await page.locator('.overlay, [role="dialog"]').count()) === 0) break;
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }

  const pick = async (field, name) => {
    await page.locator(field).fill(name);
    const row = page.locator('.picker-row', { hasText: name }).first();
    await row.waitFor({ timeout: 20000 });
    await row.click();
    await page.waitForTimeout(400);
  };

  await page.locator('.planner-row__btn').first().click();
  await page.waitForSelector('#picker-from', { timeout: 20000 });
  await pick('#picker-from', 'Haarlem Station');
  await pick('#picker-to', 'Zaandam Station');
  const plan = page.getByRole('button', { name: 'Plan journey' });
  if (await plan.count()) await plan.first().click();
  await page.waitForSelector('.results-bar', { timeout: 20000 });
  await page.waitForTimeout(900);

  /* The card's own heading: one per journey, and nothing else on the page has it. */
  const cards = () => page.locator('.journey-card__times').count();

  const first = await cards();
  say(first > 0, `the list starts with ${first} journeys`);

  /*
   * Four presses of each end. A window is an hour, so one press can land entirely inside the hour
   * already on screen and add nothing — the rule being checked is that a press never *takes* a
   * journey away, and that walking far enough always finds more.
   */
  const walk = async (label) => {
    const counts = [first];
    for (let i = 0; i < 4; i += 1) {
      await page.getByRole('button', { name: label }).first().click();
      await page.waitForTimeout(600);
      counts.push(await cards());
    }
    const monotone = counts.every((count, index) => index === 0 || count >= counts[index - 1]);
    say(monotone, `${label} never hides a journey: ${counts.join(' → ')}`);
    say(counts[counts.length - 1] > counts[0], `${label} finds more beyond the first window: ${counts[0]} → ${counts[counts.length - 1]}`);
    return counts[counts.length - 1];
  };

  await walk('Later');
  const afterEarlier = await walk('Earlier');

  /* One card per departure: no journey may be counted twice by paging over it again. */
  const ids = await page.evaluate(() =>
    [...document.querySelectorAll('.journey-card__times')].map((card) => card.textContent?.trim().slice(0, 40)),
  );
  say(new Set(ids).size === ids.length, `no journey is drawn twice (${ids.length} cards, ${new Set(ids).size} distinct)`);

  /* The sort still works on the bigger list rather than throwing the extra pages away. */
  await page.locator('#results-sort').selectOption('fastest');
  await page.waitForTimeout(500);
  const sorted = await cards();
  say(sorted >= afterEarlier, `sorting keeps the accumulated list: ${afterEarlier} → ${sorted}`);
} finally {
  await browser.close();
}

if (failures) console.log(`${failures} check(s) failed`);
process.exitCode = failures ? 1 : 0;
