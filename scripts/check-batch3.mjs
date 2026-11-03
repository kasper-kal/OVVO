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

/*
 * **Something else writes the store too.** The account sync adopts the server's copy and a second
 * tab writes what it has, so a removed value can be handed straight back — which is the report: the
 * alarm came back after leaving the page and returning. The deletion is now remembered, so a copy
 * of the store that still holds the alarm does not become the truth.
 */
const journeyId = await page.evaluate(() => window.location.pathname.split('/').pop());
await page.evaluate((id) => {
  window.localStorage.setItem(`ov-planner:v1:alarm:${id}`, JSON.stringify({ minutes: 5, leaveBy: 355 }));
}, journeyId);
await page.reload({ waitUntil: 'networkidle' });
await page.waitForSelector('.timeline', { timeout: 15000 });
check(
  (await alarmButton.textContent())?.trim() === 'Alarm',
  'a copy of the store put back in the browser does not bring the alarm back',
  (await alarmButton.textContent())?.trim(),
);
await alarmButton.click();
await page.waitForSelector('.alarm__slider');
await page.locator('.modal .btn--primary').click();
await page.waitForTimeout(200);
check(
  (await alarmButton.textContent())?.trim() === 'Alarm 5 min',
  'and the alarm can be set again afterwards',
  (await alarmButton.textContent())?.trim(),
);

/*
 * **A due alarm is news, not a box in the row.** He photographed the journey page with an alarm two
 * minutes out: a pink paragraph "Time to leave for your journey, 8:44" sitting between Alarm and
 * Share, and the two buttons stretched to the block's height and turned into circles. The reminder
 * is now said in the toast region, which lives outside the layout, so the row is unchanged by it.
 */
await page.evaluate((id) => {
  const clock = new Date();
  const now = clock.getHours() * 60 + clock.getMinutes();
  window.localStorage.setItem(`ov-planner:v1:alarm:${id}`, JSON.stringify({ minutes: 2, leaveBy: now }));
}, journeyId);
await page.reload({ waitUntil: 'networkidle' });
await page.waitForSelector('.timeline', { timeout: 15000 });
await page.waitForTimeout(700);
const due = await page.evaluate(() => {
  const row = document.querySelector('.journey-actions');
  const kids = row ? [...row.children] : [];
  const heights = kids.map((el) => Math.round(el.getBoundingClientRect().height));
  return {
    tags: kids.map((el) => el.tagName),
    rowHeight: row ? Math.round(row.getBoundingClientRect().height) : 0,
    tallest: heights.length ? Math.max(...heights) : 0,
    box: document.querySelector('.journey-alarm-line') !== null,
    toast: document.querySelector('.toast-region')?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
  };
});
check(
  due.tags.length > 0 && due.tags.every((tag) => tag === 'BUTTON'),
  'a due alarm adds no box to the button row',
  due.tags.join(' / '),
);
check(
  due.rowHeight <= 60 && due.tallest <= 60,
  'and the row keeps its own height, so no button is stretched into a circle',
  `${due.rowHeight}px row, tallest child ${due.tallest}px`,
);
check(!due.box, 'the pink paragraph is gone from the page', due.box ? 'still there' : 'gone');
check(
  /Time to leave for your journey/.test(due.toast),
  'the reminder is said, in the toast',
  due.toast.slice(0, 48) || '(no toast)',
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

/*
 * **The way back is a button of this app, not the browser's.** It was a bare `<button>` styled as an
 * underlined word, so the engine drew a square edge inside a sheet where every other control is a
 * pill — he circled it: "Why is this button square". Shape, height and underline are read here, so
 * the next square is caught by a number.
 */
const backLook = await page.evaluate(() => {
  const back = [...document.querySelectorAll('.modal button')].find((el) => el.textContent.trim() === 'Back');
  if (!back) return null;
  const style = getComputedStyle(back);
  return {
    radius: style.borderTopLeftRadius,
    h: Math.round(back.getBoundingClientRect().height),
    underline: style.textDecorationLine,
  };
});
check(Boolean(backLook), 'the calendar sheet has a way back');
if (backLook) {
  check(parseFloat(backLook.radius) >= 20, "the way back is the app's pill, not a square", `corner ${backLook.radius}`);
  check(backLook.h >= 44, "and it is the app's 44px target", `${backLook.h}px`);
  check(backLook.underline === 'none', 'it is a button, not an underlined word', backLook.underline);
}
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

/*
 * **The walk's own row, on a journey that has one.** These two checks were written against a
 * stop-to-stop journey first, which has no walk at all, so they failed on a page that was correct
 * while the real fault went unmeasured. An address search is where a walk exists; the gutter and the
 * link are both measured here, on that page.
 */
const addressTrip = `/results/${Buffer.from(
  JSON.stringify({ v: 1, f: 'haarlem', t: 'zwolle', fl: 'Rijksstraatweg 9, Haarlem', fa: 1400, d: '2026-11-02', m: 300, tm: 'depart' }),
).toString('base64url')}`;
await page.goto(`${base}${addressTrip}`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.journey-card__link', { timeout: 20000 });
for (let i = 0; i < 8; i += 1) {
  const close = page.locator('.overlay button, .sheet button');
  if (!(await close.count())) break;
  await close.first().click({ timeout: 800 }).catch(() => {});
  await page.waitForTimeout(80);
}
await page.locator('.journey-card__link').first().click();
await page.waitForSelector('.timeline', { timeout: 15000 });

const walkLinkBox = await page.evaluate(() => {
  const link = document.querySelector('.leg-map-link');
  if (!link) return null;
  const cs = getComputedStyle(link);
  const rect = link.getBoundingClientRect();
  return {
    borderWidth: parseFloat(cs.borderTopWidth) + parseFloat(cs.borderLeftWidth),
    background: cs.backgroundColor,
    height: Math.round(rect.height),
  };
});
check(Boolean(walkLinkBox), 'a walk carries its map link');
if (walkLinkBox) {
  check(walkLinkBox.borderWidth === 0, 'the walk link has no box around it', `${walkLinkBox.borderWidth}px of border`);
  check(
    walkLinkBox.background === 'rgba(0, 0, 0, 0)' || walkLinkBox.background === 'transparent',
    'the walk link has no fill',
    walkLinkBox.background,
  );
  check(walkLinkBox.height <= 22, 'the walk link is the height of its line', `${walkLinkBox.height}px tall`);
}

const walkGutter = await page.evaluate(() => {
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
check(walkGutter.length === 0, 'no clock or figure sits on another on a walk journey', walkGutter.join(', ') || 'clean');

/*
 * **One control, one look.** The same "Depart at / Arrive by" is drawn in the Date and time sheet
 * and in Settings; it shipped at two heights and with a ring in only one of them. This reads both
 * and compares them, so the next divergence is caught by a number rather than by his eye.
 */
const segmentedStyle = async (selector, opener) => {
  if (opener) {
    await opener();
    await page.waitForTimeout(400);
  }
  return page.evaluate((sel) => {
    const wrap = document.querySelector(sel);
    if (!wrap) return null;
    const cs = getComputedStyle(wrap);
    const pressed = wrap.querySelector('.segmented__btn[aria-pressed="true"]');
    const other = wrap.querySelector('.segmented__btn[aria-pressed="false"]');
    const ps = pressed ? getComputedStyle(pressed) : null;
    return {
      pad: cs.padding,
      gap: cs.gap,
      h: Math.round(wrap.getBoundingClientRect().height),
      pressedBg: ps?.backgroundColor ?? null,
      pressedBorder: ps ? `${ps.borderTopWidth} ${ps.borderTopColor}` : null,
      pressedH: pressed ? Math.round(pressed.getBoundingClientRect().height) : null,
      secondH: other ? Math.round(other.getBoundingClientRect().height) : null,
    };
  }, selector);
};

const closeSheets = async () => {
  for (let i = 0; i < 8; i += 1) {
    const close = page.locator('.overlay button, .sheet button');
    if (!(await close.count())) break;
    await close.first().click({ timeout: 800 }).catch(() => {});
    await page.waitForTimeout(80);
  }
};

const compare = await browser.newPage({ viewport: { width: 390, height: 900 } });
const clearOverlays = async () => {
  for (let i = 0; i < 8; i += 1) {
    const close = compare.locator('.overlay button, .sheet button');
    if (!(await close.count())) break;
    await close.first().click({ timeout: 800 }).catch(() => {});
    await compare.waitForTimeout(100);
  }
};
const measureSegmented = async (selector) =>
  compare.evaluate((sel) => {
    const wrap = document.querySelector(sel);
    if (!wrap) return null;
    const cs = getComputedStyle(wrap);
    const pressed = wrap.querySelector('.segmented__btn[aria-pressed="true"]');
    const ps = pressed ? getComputedStyle(pressed) : null;
    return {
      pad: cs.padding,
      gap: cs.gap,
      h: Math.round(wrap.getBoundingClientRect().height),
      pressedBg: ps?.backgroundColor ?? null,
      pressedBorder: ps ? `${ps.borderTopWidth} ${ps.borderTopColor}` : null,
      pressedH: pressed ? Math.round(pressed.getBoundingClientRect().height) : null,
    };
  }, selector);

await compare.goto(`${base}${journey}`, { waitUntil: 'domcontentloaded' });
await compare.waitForSelector('.results-chip', { timeout: 20000 });
await clearOverlays();
await compare.waitForTimeout(600);
await compare.locator('.results-chip').first().click();
await compare.waitForSelector('.street-map, .modal, [role="dialog"]', { timeout: 12000 }).catch(() => {});
const sheetSegmented = await measureSegmented('[aria-label="Depart at or arrive by"]');

await compare.goto(`${base}/settings`, { waitUntil: 'domcontentloaded' });
await compare.waitForTimeout(800);
await clearOverlays();
const settingsSegmented = await measureSegmented('[aria-label="Default search type"]');
await compare.close();

check(Boolean(sheetSegmented) && Boolean(settingsSegmented), 'both places draw the same choice');
if (sheetSegmented && settingsSegmented) {
  check(
    sheetSegmented.h === settingsSegmented.h,
    'the same switch is the same height everywhere',
    `${sheetSegmented.h}px in the sheet, ${settingsSegmented.h}px in settings`,
  );
  check(
    sheetSegmented.pressedH === settingsSegmented.pressedH && sheetSegmented.pad === settingsSegmented.pad,
    'the chosen half is the same size everywhere',
    `${sheetSegmented.pressedH}px / pad ${sheetSegmented.pad} vs ${settingsSegmented.pressedH}px / pad ${settingsSegmented.pad}`,
  );
  check(
    sheetSegmented.pressedBg === settingsSegmented.pressedBg,
    'the chosen half is filled the same everywhere',
    `${sheetSegmented.pressedBg} vs ${settingsSegmented.pressedBg}`,
  );
  check(
    sheetSegmented.pressedBorder === settingsSegmented.pressedBorder,
    'the chosen half is ringed the same everywhere',
    `${sheetSegmented.pressedBorder} vs ${settingsSegmented.pressedBorder}`,
  );
}


/*
 * **Colour, not only geometry — and the field, not only the switch.**
 *
 * The size check above passed while he was still looking at a white tab in a dark sheet, because it
 * compared one appearance and four numbers. The switch is now read in **both** appearances, on the
 * capsule, the thumb, its ring and its ink, and the day and time field is read beside it: one mark
 * per answer, the platform's own picker button removed, and a stacked group that is a box rather
 * than a stadium.
 */
const openSheet = async (theme) => {
  const sheetPage = await browser.newPage({ viewport: { width: 390, height: 900 } });
  if (theme === 'dark') await sheetPage.emulateMedia({ colorScheme: 'dark' });
  await sheetPage.goto(`${base}${journey}`, { waitUntil: 'domcontentloaded' });
  await sheetPage.waitForSelector('.results-chip', { timeout: 20000 });
  for (let i = 0; i < 8; i += 1) {
    const close = sheetPage.locator('.overlay button, .sheet button');
    if (!(await close.count())) break;
    await close.first().click({ timeout: 800 }).catch(() => {});
    await sheetPage.waitForTimeout(100);
  }
  await sheetPage.waitForTimeout(400);
  await sheetPage.locator('.results-chip').first().click();
  await sheetPage.locator('[aria-label="Depart at or arrive by"]').waitFor({ timeout: 12000 });
  if (theme === 'dark') await sheetPage.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
  await sheetPage.waitForTimeout(300);
  return sheetPage;
};

const lookOf = (target, selector) => target.evaluate((sel) => {
  const seg = document.querySelector(sel);
  if (!seg) return null;
  const pressed = seg.querySelector('.segmented__btn[aria-pressed="true"]');
  if (!pressed) return null;
  const ps = getComputedStyle(pressed);
  const cs = getComputedStyle(seg);
  const group = document.querySelector('.when-field__group');
  const glyph = document.querySelector('.when-field__glyph');
  const input = document.querySelector('#results-date');
  const box = glyph && glyph.getBoundingClientRect();
  return {
    h: Math.round(seg.getBoundingClientRect().height),
    thumbH: Math.round(pressed.getBoundingClientRect().height),
    capsule: cs.backgroundColor,
    bg: ps.backgroundColor,
    ring: `${ps.borderTopWidth} ${ps.borderTopColor}`,
    ink: ps.color,
    groupRadius: group ? parseFloat(getComputedStyle(group).borderTopLeftRadius) : null,
    glyphTag: glyph ? glyph.tagName : null,
    glyphBox: box ? `${Math.round(box.width)}x${Math.round(box.height)}` : null,
    pickerButton: input ? getComputedStyle(input).appearance : null,
  };
}, selector);

const looks = {};
for (const theme of ['light', 'dark']) {
  const sheetPage = await openSheet(theme);
  const sheetLook = await lookOf(sheetPage, '[aria-label="Depart at or arrive by"]');
  await sheetPage.locator('[aria-label="Depart at or arrive by"] .segmented__btn').nth(1).click();
  await sheetPage.waitForTimeout(500);
  const stillOpen = (await sheetPage.locator('[aria-label="Depart at or arrive by"]').count()) > 0;
  await sheetPage.close();

  const settingsPage = await browser.newPage({ viewport: { width: 390, height: 900 } });
  if (theme === 'dark') await settingsPage.emulateMedia({ colorScheme: 'dark' });
  await settingsPage.goto(`${base}/settings`, { waitUntil: 'domcontentloaded' });
  await settingsPage.waitForTimeout(500);
  if (theme === 'dark') await settingsPage.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
  await settingsPage.waitForTimeout(400);
  const settingsLook = await lookOf(settingsPage, '[aria-label="Default search type"]');
  await settingsPage.close();
  looks[theme] = { sheetLook, settingsLook, stillOpen };
}

for (const theme of ['light', 'dark']) {
  const { sheetLook, settingsLook } = looks[theme];
  check(Boolean(sheetLook) && Boolean(settingsLook), `both switches are drawn in the ${theme} appearance`);
  if (!sheetLook || !settingsLook) continue;
  check(
    sheetLook.h === settingsLook.h && sheetLook.thumbH === settingsLook.thumbH,
    `the switch is the same size in the ${theme} appearance`,
    `${sheetLook.h}px/${sheetLook.thumbH}px vs ${settingsLook.h}px/${settingsLook.thumbH}px`,
  );
  check(
    sheetLook.capsule === settingsLook.capsule &&
      sheetLook.bg === settingsLook.bg &&
      sheetLook.ring === settingsLook.ring &&
      sheetLook.ink === settingsLook.ink,
    `the switch paints the same colours in the ${theme} appearance`,
    `capsule ${sheetLook.capsule} thumb ${sheetLook.bg} vs capsule ${settingsLook.capsule} thumb ${settingsLook.bg}`,
  );
}

const sheetLight = looks.light.sheetLook;
if (sheetLight) {
  check(
    sheetLight.glyphTag === 'BUTTON' && sheetLight.glyphBox === '44x44',
    'each day and time answer has one mark, 44px',
    `${sheetLight.glyphTag} ${sheetLight.glyphBox}`,
  );
  check(
    sheetLight.pickerButton === 'none',
    "the platform's own picker button is removed, not faded",
    String(sheetLight.pickerButton),
  );
  check(
    sheetLight.groupRadius !== null && sheetLight.groupRadius <= 24,
    'a stacked day and time group is a box, not a stadium',
    `${sheetLight.groupRadius}px corner`,
  );
}
check(looks.dark.stillOpen === true, 'choosing a side leaves the sheet open', looks.dark.stillOpen ? 'still open' : 'it closed');

await browser.close();
console.log(`batch 3: ${failures} failing check(s)`);
process.exit(failures ? 1 : 0);
