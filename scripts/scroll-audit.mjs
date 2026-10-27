#!/usr/bin/env node
/*
 * **Where the page sits after a reset, and after every other move between screens.**
 *
 * A screen that arrives scrolled down is the kind of fault that is invisible to a build and
 * invisible to a type checker: nothing is broken, everything is one line off, and the app reads as
 * careless. It has happened here more than once (a reset landing on a home screen slightly down the
 * page), so it is checked rather than trusted.
 *
 * Five moves, each a thing a traveller does:
 *
 *   0. **the reset, on a phone short enough for the home screen to be taller than it, with the
 *      first-visit location question answered rather than skipped** — the case that matters, and the
 *      case this file was blind to until it happened again. Two things hid it: the audit ran on a
 *      412x915 phone, where the home screen is shorter than the screen and therefore cannot be
 *      scrolled at all; and it preset the location consent, so the question a reset deliberately
 *      brings back never appeared. The question is what gave the offset back: a sheet remembers the
 *      position it was opened over, and the reset navigated the screen out from under it;
 *   1. the reset from a scrolled Settings screen;
 *   2. a sheet cancelled on a scrolled screen: that screen keeps its position;
 *   3. a link to another screen: the new one starts at its top;
 *   4. the back button: the screen you left is where you left it.
 *
 * Run against the dev server (`npm run dev`) or the live site:
 *
 *   npm run check:scroll
 *   SCROLL_URL=https://ovvo.onrender.com npm run check:scroll
 *
 * Playwright is a dev dependency already, and device profiles are used so the pages are phones.
 */
import { chromium, devices } from 'playwright';

const URL = process.env.SCROLL_URL ?? 'http://127.0.0.1:3000';

let failures = 0;
const check = (ok, label, detail = '') => {
  if (!ok) failures += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `   [${detail}]` : ''}`);
};

const position = (page) =>
  page.evaluate(() => ({
    y: Math.round(window.scrollY),
    path: location.pathname,
    /* How far the screen can scroll at all: a page with no room to move cannot show this fault. */
    room: Math.round(document.documentElement.scrollHeight - window.innerHeight),
  }));

const tap = async (page, label, exact = true) => {
  const button = page.getByRole('button', { name: label, exact }).first();
  await button.scrollIntoViewIfNeeded();
  await button.tap();
};

/** The sheet's own text button, not the × that carries the same name as an `aria-label`. */
const tapQuestion = (page, label) =>
  page.evaluate((label) => {
    const dialog = document.querySelector('[role="dialog"]');
    const button = [...(dialog?.querySelectorAll('button') ?? [])].find(
      (node) => (node.textContent ?? '').trim() === label,
    );
    button?.click();
    return Boolean(button);
  }, label);

const browser = await chromium.launch();

/* ---------------------------------------------------------------- 0. the short phone, with the question */

/*
 * 360x640, which is the screen this fault is visible on: the home screen is 845px tall there, so it
 * has 205px of room to be scrolled into. On the 412x915 profile below it has none, which is exactly
 * why the first version of this file passed while the fault was live.
 */
const short = await browser.newContext({
  viewport: { width: 360, height: 640 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
});
/* No preset consent on purpose: a reset wipes it, and the question that comes back is the mover. */
const small = await short.newPage();
await small.goto(`${URL}/settings`, { waitUntil: 'load' });
await small.waitForTimeout(1400);
/* A first visit to any screen asks about location, and the sheet holds the page still while it is
   open, so the question is answered before anything else is measured. */
if (await small.evaluate(() => Boolean(document.querySelector('[role="dialog"]')))) {
  await tapQuestion(small, 'Not now');
  await small.waitForTimeout(700);
}
await small.mouse.wheel(0, 1400);
await small.waitForTimeout(500);
const smallScrolled = await position(small);
check(smallScrolled.y > 300, 'a short phone can scroll Settings down', String(smallScrolled.y));

await tap(small, 'Reset the app');
await small.waitForTimeout(700);
await tap(small, 'Reset everything');
await small.waitForTimeout(1200);
const asked = await position(small);
check(
  asked.path === '/' && asked.room > 0,
  'the reset arrives on a home screen with room to be scrolled',
  JSON.stringify(asked),
);

const question = await small.evaluate(() => Boolean(document.querySelector('[role="dialog"]')));
check(question, 'and the first-visit question is asked again on it');

const answered = await tapQuestion(small, 'Not now');
check(answered, 'the question is answered the way a traveller answers it');
await small.waitForTimeout(1200);
const settled = await position(small);
check(
  settled.y === 0,
  'answering it leaves the home screen at its top',
  JSON.stringify(settled),
);
await short.close();

/* ---------------------------------------------------------------- 1 to 4. the Pixel, as before */

const context = await browser.newContext({ ...devices['Pixel 7'] });
await context.addInitScript(() =>
  localStorage.setItem('ov-planner:v1:location-consent', JSON.stringify('denied')),
);
const page = await context.newPage();

await page.goto(`${URL}/settings`, { waitUntil: 'load' });
await page.waitForTimeout(1200);
await page.mouse.wheel(0, 1100);
await page.waitForTimeout(500);
const scrolled = await page.evaluate(() => Math.round(window.scrollY));
check(scrolled > 300, 'Settings can be scrolled down', String(scrolled));

await tap(page, 'Reset the app');
await page.waitForTimeout(700);
await tap(page, 'Reset everything');
await page.waitForTimeout(1200);
const reset = await position(page);
check(reset.path === '/' && reset.y === 0, 'the reset arrives on the home screen at its top', JSON.stringify(reset));

/* 2. A sheet cancelled on a scrolled screen. */
await page.goto(`${URL}/settings`, { waitUntil: 'load' });
await page.waitForTimeout(1200);
await page.mouse.wheel(0, 700);
await page.waitForTimeout(500);
await tap(page, 'Reset the app');
await page.waitForTimeout(600);
/* Read *after* the tap: pressing a control at the foot of a page scrolls it into view, and that is
   the test's own movement, not the app's. The position the sheet must give back is this one. */
const before = (await position(page)).y;
check(before > 300, 'the confirmation is open on a scrolled screen', String(before));
await tap(page, 'Cancel');
await page.waitForTimeout(700);
const kept = await position(page);
check(Math.abs(kept.y - before) <= 4, 'a cancelled sheet leaves the screen where it was', `${before} to ${kept.y}`);

/* 3. A link to another screen starts at the top. */
await page.mouse.wheel(0, 900);
await page.waitForTimeout(500);
await page.evaluate(() => {
  document.querySelector('a[href="/stops"]')?.click();
});
await page.waitForTimeout(900);
const arrived = await position(page);
check(arrived.path === '/stops' && arrived.y === 0, 'a new screen starts at its top', JSON.stringify(arrived));

/* 4. Back returns to where that screen was left. */
await page.mouse.wheel(0, 500);
await page.waitForTimeout(400);
const leftAt = (await position(page)).y;
await page.evaluate(() => {
  document.querySelector('a[href="/disruptions"]')?.click();
});
await page.waitForTimeout(900);
await page.goBack({ waitUntil: 'load' });
await page.waitForTimeout(1000);
const back = await position(page);
check(
  back.path === '/stops' && Math.abs(back.y - leftAt) <= 10,
  'going back returns to the position that screen was left at',
  `${JSON.stringify(back)} left at ${leftAt}`,
);

await context.close();
await browser.close();

console.log(`\n${failures} failure(s).`);
process.exit(failures ? 1 : 0);
