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

/*
 * **Nothing in the gutter may sit on anything else in the gutter.** The change row's walking figure
 * was drawn 64px below its own row and landed on the next stop's time; measuring the boxes catches
 * that, and catches the next thing shaped like it.
 */
const gutter = await page.evaluate(() => {
  const box = (el) => el.getBoundingClientRect();
  const rows = [...document.querySelectorAll('.timeline__rail, .timeline__end')].map((row) => ({
    cls: row.className.replace('timeline__rail', '').trim() || 'end',
    time: row.querySelector('.timeline__time') ? box(row.querySelector('.timeline__time')) : null,
    mode: row.querySelector('.timeline__mode') ? box(row.querySelector('.timeline__mode')) : null,
  }));
  const hits = [];
  for (let i = 0; i < rows.length; i += 1) {
    for (let j = i + 1; j < rows.length; j += 1) {
      for (const a of ['time', 'mode']) {
        for (const b of ['time', 'mode']) {
          const one = rows[i][a];
          const two = rows[j][b];
          if (!one || !two) continue;
          const overlaps =
            one.left < two.right && two.left < one.right && one.top < two.bottom - 1 && two.top < one.bottom - 1;
          if (overlaps) hits.push(`${rows[i].cls}.${a} on ${rows[j].cls}.${b}`);
        }
      }
    }
  }
  return hits;
});
check(gutter.length === 0, 'no time or glyph in the gutter sits on another', gutter.join(', ') || 'clean');

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

/* The walk's map link is a word in a line, not a control with a box around it. */
const linkBox = await page.evaluate(() => {
  const link = document.querySelector('.leg-map-link');
  if (!link) return null;
  const cs = getComputedStyle(link);
  const rect = link.getBoundingClientRect();
  return {
    borderWidth: parseFloat(cs.borderTopWidth) + parseFloat(cs.borderLeftWidth),
    background: cs.backgroundColor,
    height: Math.round(rect.height),
    width: Math.round(rect.width),
  };
});
check(Boolean(linkBox), 'a walk still carries its map link');
if (linkBox) {
  check(linkBox.borderWidth === 0, 'the walk link has no box around it', `${linkBox.borderWidth}px of border`);
  check(
    linkBox.background === 'rgba(0, 0, 0, 0)' || linkBox.background === 'transparent',
    'the walk link has no fill',
    linkBox.background,
  );
  check(linkBox.height <= 22, 'the walk link is the height of its line', `${linkBox.height}px tall`);
}

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
check(rows === 2, 'the share sheet still offers exactly two things', String(rows));
const rowText = await page.locator('.share-row').allTextContents();
check(
  rowText.some((text) => /Share the journey/.test(text)) && rowText.some((text) => /Add to calendar/.test(text)),
  'the two things are the journey and the calendar',
  rowText.map((text) => text.split('\n')[0]).join(' / '),
);

/* Option 4: the calendar row names the calendars instead of handing over a file. */
await page.locator('button[aria-label="Add to calendar"]').click();
await page.waitForSelector('a.share-row');
const calendarNames = await page.locator('.share-row .t-strong').allTextContents();
check(calendarNames.length === 3, 'three calendar names, no more', calendarNames.join(' / '));
check(
  calendarNames.some((name) => /Google/.test(name)) &&
    calendarNames.some((name) => /Outlook/.test(name)) &&
    calendarNames.some((name) => /Apple/.test(name)),
  'the three names are Google, Outlook and Apple',
  calendarNames.join(' / '),
);

const [googleHref, outlookHref] = await page
  .locator('a.share-row')
  .evaluateAll((links) => links.map((link) => link.href));
check(
  /^https:\/\/calendar\.google\.com\/calendar\/render\?action=TEMPLATE/.test(googleHref),
  'the Google row opens its own event editor',
  googleHref.slice(0, 70),
);
check(
  /dates=\d{8}T\d{6}\/\d{8}T\d{6}/.test(googleHref) && googleHref.includes('ctz=Europe'),
  'the Google row carries both times and the timezone',
  googleHref.match(/dates=[^&]+/)?.[0] ?? 'no dates',
);
check(
  /outlook\.live\.com\/calendar\/deeplink\/compose/.test(outlookHref) &&
    outlookHref.includes('rru=addevent') &&
    /startdt=\d{4}-\d{2}-\d{2}T/.test(decodeURIComponent(outlookHref)),
  'the Outlook row opens its own compose form',
  decodeURIComponent(outlookHref).match(/startdt=[^&]+/)?.[0] ?? 'no start',
);
const workHref = await page.locator('a.share-work').getAttribute('href');
check(/outlook\.office\.com/.test(workHref ?? ''), 'a work account has its own line', workHref?.slice(0, 48));

/* The device row: the panel first, and a file only because this browser has no panel. */
const [download] = await Promise.all([
  page.waitForEvent('download', { timeout: 6000 }).catch(() => null),
  page.locator('button.share-row').click(),
]);
check(
  Boolean(download) && download.suggestedFilename() === 'ovvo-journey.ics',
  'the device row is the floor: a file only when nothing can take it',
  download?.suggestedFilename() ?? 'no file at all',
);
const afterDevice = (await page.locator('[role="status"]').last().textContent())?.trim() ?? '';
check(/Saved for your calendar/.test(afterDevice), 'it says what it did', afterDevice);

await browser.close();
console.log(`batch 3: ${failures} failing check(s)`);
process.exit(failures ? 1 : 0);
