/**
 * Items 16, 10, 2 and 1, measured rather than looked at.
 *
 * Each assertion is one line of a "done when": crowding on every service and *different* between
 * two services in the same journey; a platform that is not settled printed as two in the warning
 * colour; a share sheet with exactly two choices; an alarm whose slider starts at five, whose
 * minus and plus move it, whose Cancel changes nothing and whose Save is kept.
 */
import { chromium, prepareBrowserEnv, browserIsInstalled, MISSING_BROWSER_HELP } from './browser-env.mjs';

prepareBrowserEnv();
if (!browserIsInstalled()) {
  console.error(MISSING_BROWSER_HELP);
  process.exit(2);
}

const base = (process.env.BASE_URL || 'http://127.0.0.1:4182').replace(/\/$/, '');
const journey = `/results/${Buffer.from(
  JSON.stringify({ v: 1, f: 'haarlem', t: 'zwolle', d: '2026-11-02', m: 300, tm: 'depart' }),
).toString('base64url')}`;

let failures = 0;
const check = (ok, label, detail = '') => {
  if (!ok) failures += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  (${detail})` : ''}`);
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
await page.goto(`${base}${journey}`, { waitUntil: 'networkidle' });
for (let i = 0; i < 8; i += 1) {
  const close = page.locator('.overlay button, .sheet button');
  if (!(await close.count())) break;
  await close.first().click({ timeout: 800 }).catch(() => {});
  await page.waitForTimeout(120);
}

/* Walk the first few journeys and look for an unsettled platform in any of them. */
let choiceSeen = null;
let perServiceVariety = null;
for (let index = 0; index < 12; index += 1) {
  /* Count the cards **on the results page**, after arriving: asking before the navigation counted
     them on the journey page the last click had left open, found none, and stopped the walk at the
     first journey — which is how an unsettled platform went unseen in a search that has three. */
  await page.goto(`${base}${journey}`, { waitUntil: 'networkidle' });
  for (let i = 0; i < 8; i += 1) {
    const close = page.locator('.overlay button, .sheet button');
    if (!(await close.count())) break;
    await close.first().click({ timeout: 800 }).catch(() => {});
    await page.waitForTimeout(100);
  }
  if (index >= (await page.locator('.journey-card__link').count())) break;
  await page.locator('.journey-card__link').nth(index).click();
  await page.waitForSelector('.timeline', { timeout: 15000 });

  const shape = await page.evaluate(() => {
    const rides = [...document.querySelectorAll('.timeline__rail--ride:not(.timeline__rail--stop):not(.timeline__rail--change)')];
    const crowding = rides.map((row) => {
      const mark = row.querySelector('.leg-crowding');
      if (!mark) return null;
      const people = mark.querySelectorAll('.leg-crowding__people svg').length;
      for (const level of ['quiet', 'moderate', 'busy', 'unknown']) {
        if (mark.classList.contains(`leg-crowding--${level}`)) return { level, people };
      }
      return { level: 'unnamed', people };
    });
    /* Read every platform, then pick the one that names two berths: the class is a detail, the
       sentence is the fact. */
    const platforms = [...document.querySelectorAll('.timeline__platform')];
    const chosen = platforms.find((node) => / or /.test(node.textContent ?? ''));
    const plain = platforms.find((node) => node !== chosen);
    return {
      crowding,
      platforms: platforms.map((node) => node.textContent.trim()),
      choice: chosen ? [chosen.textContent.trim()] : [],
      choiceClass: chosen ? chosen.className : null,
      choiceColour: chosen ? getComputedStyle(chosen).color : null,
      plainColour: plain ? getComputedStyle(plain).color : null,
    };
  });

  console.log(`   journey ${index + 1}: ${shape.platforms.length} platform(s) — ${shape.platforms.join(', ')}`);
  if (!choiceSeen && shape.choice.length) choiceSeen = { index, ...shape };
  const levels = new Set(shape.crowding.filter(Boolean).map((item) => item.level));
  if (!perServiceVariety && levels.size > 1) perServiceVariety = { index, levels: [...levels] };

  /* Crowding on every service of this journey, with two or three people or a "?". */
  const everyRide = shape.crowding.length > 0 && shape.crowding.every(Boolean);
  if (index === 0) {
    check(everyRide, 'every service carries its own crowding', `${shape.crowding.length} service(s)`);
    const sizes = shape.crowding.map((item) => item.people);
    check(
      sizes.every((count) => count === 2 || count === 3),
      'two or three little people, or a question mark',
      JSON.stringify(sizes),
    );
  }
}

check(Boolean(perServiceVariety), 'two services in one journey can read differently',
  perServiceVariety ? `journey ${perServiceVariety.index + 1}: ${perServiceVariety.levels.join(', ')}` : 'all equal');
check(Boolean(choiceSeen), 'an unsettled platform is printed as two',
  choiceSeen ? choiceSeen.choice[0] : 'none in twelve journeys');
if (choiceSeen) {
  check(/timeline__platform--choice/.test(choiceSeen.choiceClass ?? ''), 'it is the settled-or-not mark', choiceSeen.choiceClass);
  /* The warning colour, not the ordinary platform ink. */
  check(
    choiceSeen.choiceColour !== choiceSeen.plainColour,
    'the two platforms wear the warning colour, not the ordinary ink',
    `${choiceSeen.choiceColour} vs ${choiceSeen.plainColour}`,
  );
}

/* Back to one journey for the alarm and the share sheet. */
await page.goto(`${base}${journey}`, { waitUntil: 'networkidle' });
for (let i = 0; i < 8; i += 1) {
  const close = page.locator('.overlay button, .sheet button');
  if (!(await close.count())) break;
  await close.first().click({ timeout: 800 }).catch(() => {});
  await page.waitForTimeout(100);
}
await page.locator('.journey-card__link').nth(2).click();
await page.waitForSelector('.timeline', { timeout: 15000 });

const alarmButton = page.locator('button[aria-label="Set a departure alarm"]');
check(await alarmButton.count() === 1, 'the alarm control sits in the journey row');
await alarmButton.click();
await page.waitForSelector('.alarm__slider');
const slider = page.locator('.alarm__slider');
check(Number(await slider.inputValue()) === 5, 'the slider starts at five minutes', await slider.inputValue());
await page.locator('button[aria-label="One minute more"]').click();
check(Number(await slider.inputValue()) === 6, 'the plus moves the slider', await slider.inputValue());
/* Nought minutes is not a warning, so the sheet must not offer it. */
check((await slider.getAttribute('min')) === '1', 'the slider cannot reach zero', await slider.getAttribute('min'));
for (let i = 0; i < 8; i += 1) {
  await page.locator('button[aria-label="One minute less"]').click({ timeout: 400 }).catch(() => {});
}
const floored = Number(await slider.inputValue());
check(floored === 1, 'the minus stops at one minute', String(floored));
check(
  await page.locator('button[aria-label="One minute less"]').isDisabled(),
  'the minus is switched off at one minute',
);
for (let i = 0; i < 5; i += 1) await page.locator('button[aria-label="One minute more"]').click();
const leave = (await page.locator('.alarm__leave').textContent()) ?? '';
check(/Leave at \d{1,2}:\d{2}/.test(leave), 'the sheet says when to leave', leave.trim().slice(0, 40));
await page.locator('.modal .btn:not(.btn--primary)').last().click();
check((await alarmButton.textContent())?.trim() === 'Alarm', 'Cancel keeps the journey untouched', (await alarmButton.textContent())?.trim());
await alarmButton.click();
await page.locator('button[aria-label="One minute more"]').click();
await page.locator('.modal .btn--primary').click();
check((await alarmButton.textContent())?.trim() === 'Alarm 6 min', 'Save keeps the setting', (await alarmButton.textContent())?.trim());
/* A reload keeps the journey itself, so the alarm has to be read off the page it is on. */
await page.reload({ waitUntil: 'networkidle' });
await page.waitForSelector('.timeline', { timeout: 15000 });
check((await alarmButton.textContent())?.trim() === 'Alarm 6 min', 'the alarm survives a reload', (await alarmButton.textContent())?.trim());

/* Taking it off again: the journey must be able to have no alarm, and stay that way. */
await alarmButton.click();
await page.waitForSelector('.alarm__slider');
const removeAlarm = page.locator('button[aria-label="Remove the alarm"]');
check((await removeAlarm.count()) === 1, 'a saved alarm can be removed');
await removeAlarm.click();
check(
  (await alarmButton.textContent())?.trim() === 'Alarm',
  'removing it leaves a plain journey',
  (await alarmButton.textContent())?.trim(),
);
await page.reload({ waitUntil: 'networkidle' });
await page.waitForSelector('.timeline', { timeout: 15000 });
check(
  (await alarmButton.textContent())?.trim() === 'Alarm',
  'the removed alarm does not come back on a reload',
  (await alarmButton.textContent())?.trim(),
);
check(
  (await page.evaluate(() => Object.keys(localStorage).some((key) => key.includes('alarm:')))) === false,
  'nothing is left behind in the store',
);

await page.locator('button[aria-label="Share this journey"]').click();
await page.waitForSelector('.share-row');
const rows = await page.locator('.share-row').count();
check(rows === 2, 'the share sheet has exactly two choices', String(rows));
const rowText = await page.locator('.share-row').allTextContents();
check(
  rowText.some((text) => /Share the journey/.test(text)) && rowText.some((text) => /calendar/i.test(text)),
  'the two choices are the journey and the calendar',
  rowText.map((text) => text.split('\n')[0]).join(' / '),
);

await browser.close();
console.log(`batch 3: ${failures} failing check(s)`);
process.exit(failures ? 1 : 0);
