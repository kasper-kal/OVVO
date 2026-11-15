#!/usr/bin/env node
/**
 * **Saved journeys with known answers.**
 *
 *   node scripts/routing/golden.mjs            (needs the dev server on :3000)
 *
 * Every fault found while building the planner would have been caught by a handful of journeys whose
 * answers are already known: a journey starting at the wrong station, a leg leaving before the
 * previous one arrived, an after-midnight search answering with the first morning train. These cases
 * are fixed facts about the timetable, so they can be checked on every save.
 *
 * The page is driven in a real browser because the search runs in the browser — checking a copy of
 * it in Node would test the copy, not the thing the traveller uses.
 */
import { chromium } from 'playwright';

const PAGE = process.env.PLAN_URL ?? 'http://localhost:3000/plan';

/** What the exhaustive Node scan found for these queries, and what the page must say too. */
const CASES = [
  {
    name: 'Sunday morning, Utrecht Centraal → Groningen',
    from: 'Utrecht Centraal',
    to: 'Groningen',
    day: '20261115',
    time: '08:00',
    expect: { departure: '08:07', arrival: '10:12', transfers: 2 },
  },
  {
    name: 'After midnight, the previous service day is searched',
    from: 'Amsterdam, Station Bijlmer ArenA',
    to: 'Amsterdam, Centraal Station',
    day: '20261115',
    time: '02:40',
    /* A journey must exist at all: before the look-back this answered with the first morning train. */
    expect: { earliestBefore: '05:00' },
  },
  {
    name: 'Midday, Amsterdam Centraal → Rotterdam Centraal',
    from: 'Amsterdam Centraal',
    to: 'Rotterdam Centraal',
    day: '20261116',
    time: '12:00',
    expect: { hasJourney: true },
  },
];

const failures = [];
const notes = [];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });

const client = await page.context().newCDPSession(page);
await client.send('Network.enable');
let graphBytes = 0;
const requestUrls = new Map();
client.on('Network.requestWillBeSent', (event) => requestUrls.set(event.requestId, event.request.url));
client.on('Network.dataReceived', (event) => {
  const url = requestUrls.get(event.requestId) ?? '';
  if (url.includes('/graph/')) graphBytes += event.dataLength;
});

await page.goto(PAGE, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1500);
await page.keyboard.press('Escape').catch(() => {});
await page.evaluate(() => document.querySelectorAll('.overlay').forEach((element) => element.remove()));

/* The day list is part of the promise: the page must know the week it can plan for. */
const dayOptions = await page.locator('#plan-day option').count();
if (dayOptions < 7) failures.push(`day list offers ${dayOptions} days, expected a week`);

const pick = async (field, name) => {
  const input = page.locator(`#station-${field}`);
  await input.fill(name);
  await page.waitForTimeout(600);
  const options = page.locator('[role=listbox] li button');
  const count = await options.count();
  for (let index = 0; index < count; index += 1) {
    const text = (await options.nth(index).innerText()).split('\n')[0].trim();
    if (text !== name) continue;
    await options.nth(index).click();
    return true;
  }
  if (count > 0) {
    await options.first().click();
    return (await input.inputValue()) === name;
  }
  return false;
};

for (const testCase of CASES) {
  await page.goto(PAGE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  await page.keyboard.press('Escape').catch(() => {});
  await page.evaluate(() => document.querySelectorAll('.overlay').forEach((element) => element.remove()));

  if (!(await pick('From', testCase.from)) || !(await pick('To', testCase.to))) {
    failures.push(`${testCase.name}: a station could not be picked`);
    continue;
  }
  await page.selectOption('#plan-day', testCase.day);
  await page.waitForTimeout(2000);
  await page.locator('#plan-time').fill(testCase.time);
  await page.getByRole('button', { name: /^Search$/ }).click();
  await page.waitForTimeout(9000);

  const lines = (await page.locator('body').innerText()).split('\n').map((line) => line.trim()).filter(Boolean);
  const journeys = lines.filter((line) => /^\d\d:\d\d → \d\d:\d\d/.test(line));
  const first = journeys[0] ?? '';

  if (testCase.expect.hasJourney && journeys.length === 0) {
    failures.push(`${testCase.name}: no journey at all`);
    continue;
  }
  if (testCase.expect.departure && !first.startsWith(`${testCase.expect.departure} → ${testCase.expect.arrival}`)) {
    failures.push(`${testCase.name}: expected ${testCase.expect.departure} → ${testCase.expect.arrival}, page said "${first}"`);
  }
  if (testCase.expect.transfers !== undefined) {
    const counters = lines.join(' ');
    if (!counters.includes(`${testCase.expect.transfers} transfer`)) {
      failures.push(`${testCase.name}: expected ${testCase.expect.transfers} transfers`);
    }
  }
  if (testCase.expect.earliestBefore) {
    const departure = first.slice(0, 5);
    if (!departure || departure >= testCase.expect.earliestBefore) {
      failures.push(`${testCase.name}: expected a departure before ${testCase.expect.earliestBefore}, page said "${first}"`);
    }
  }
  notes.push(`${testCase.name}: ${first || 'no journey'}`);
}

/* What one search actually downloads from the timetable. */
notes.push(`timetable bytes downloaded by these searches: ${(graphBytes / 1048576).toFixed(1)} MiB`);

await browser.close();

for (const note of notes) console.log(`· ${note}`);
if (failures.length > 0) {
  console.error(`\n${failures.length} saved journey(s) failed:`);
  for (const failure of failures) console.error(`  ✗ ${failure}`);
  process.exit(1);
}
console.log(`\nAll ${CASES.length} saved journeys answered as expected.`);
