#!/usr/bin/env node
/*
 * **Where the page sits after a reset, and after every other move between screens.**
 *
 * A screen that arrives scrolled down is the kind of fault that is invisible to a build and
 * invisible to a type checker: nothing is broken, everything is one line off, and the app reads as
 * careless. It has happened here (a reset landing on a home screen slightly down the page), so it is
 * checked rather than trusted.
 *
 * Four moves, each a thing a traveller does:
 *
 *   1. a reset, from a Settings screen scrolled well down: the home screen must be at its top,
 *      including after the first-visit location question is answered and closed;
 *   2. a sheet cancelled on a scrolled screen: that screen keeps its position;
 *   3. a link to another screen: the new one starts at its top;
 *   4. the back button: the screen you left is where you left it.
 *
 * Run against the dev server (`npm run dev`) or the live site:
 *
 *   npm run check:scroll
 *   SCROLL_URL=https://ovvo.onrender.com npm run check:scroll
 *
 * Playwright is a dev dependency already, and a device profile is used so the page is a phone.
 */
import { chromium, devices } from 'playwright';

const URL = process.env.SCROLL_URL ?? 'http://127.0.0.1:3000';

let failures = 0;
const check = (ok, label, detail = '') => {
  if (!ok) failures += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `   [${detail}]` : ''}`);
};

const position = (page) =>
  page.evaluate(() => ({ y: Math.round(window.scrollY), path: location.pathname }));

const tap = async (page, label) => {
  const button = page.getByRole('button', { name: label, exact: true }).first();
  await button.scrollIntoViewIfNeeded();
  await button.tap();
};

const browser = await chromium.launch();
const context = await browser.newContext({ ...devices['Pixel 7'] });
await context.addInitScript(() =>
  localStorage.setItem('ov-planner:v1:location-consent', JSON.stringify('denied')),
);
const page = await context.newPage();

/* 1. The reset, from a scrolled Settings screen. */
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

const locationOpen = await page.evaluate(() => Boolean(document.querySelector('[role="dialog"]')));
if (locationOpen) {
  await page.evaluate(() => {
    const button = [...document.querySelectorAll('[role="dialog"] button')].find((node) =>
      /not now/i.test(node.textContent ?? ''),
    );
    button?.click();
  });
  await page.waitForTimeout(700);
  const afterQuestion = await position(page);
  check(afterQuestion.y === 0, 'and the first-visit question does not move it', JSON.stringify(afterQuestion));
}

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
