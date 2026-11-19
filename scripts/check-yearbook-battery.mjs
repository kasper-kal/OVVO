/**
 * **The Yearbook must survive a phone that is saving power.**
 *
 * At 20% OVVO stills its animations and at 10% it also drops shadows and switches to dark. The
 * deck depends on its own motion and colour, so it asks the app for an exception while it is open.
 * This check uses the developer battery override, the same rule the device feeds, and proves:
 *
 *   • at 15% the deck runs as `data-power="off"` with its designed animation duration;
 *   • at 5% it keeps its normal appearance instead of being forced dark;
 *   • the map's route finishes drawing instead of staying at its hidden `stroke-dashoffset`;
 *   • the rest of the app still enters save mode at 15%, so the exception did not disable saving.
 */
import { chromium } from 'playwright';

const BASE = process.env.APP_URL || 'http://127.0.0.1:3000';
const browser = await chromium.launch({ headless: true });
let failed = false;

function fail(message) {
  failed = true;
  console.log(`FAIL ${message}`);
}

async function openDeck(level, name) {
  const context = await browser.newContext({ viewport: { width: 360, height: 800 } });
  await context.addInitScript((battery) => {
    localStorage.setItem('ov-planner:v1:dev', JSON.stringify({ battery, charging: false }));
  }, level);
  const page = await context.newPage();
  await page.goto(`${BASE}/yearbook?demo=1`, { waitUntil: 'domcontentloaded' });
  await page.locator('.wrapped-stage').waitFor({ timeout: 20000 });
  await page.waitForTimeout(700);
  const notNow = page.getByRole('button', { name: /not now/i });
  if (await notNow.count()) await notNow.first().click();
  await page.waitForTimeout(250);
  const begin = page.getByRole('button', { name: /begin/i });
  if (await begin.count()) await begin.first().click();
  await page.waitForTimeout(900);
  const state = await page.evaluate(() => {
    const root = document.documentElement;
    const body = document.querySelector('.wrapped-body');
    const big = document.querySelector('.wrapped-big');
    return {
      power: root.dataset.power,
      theme: root.dataset.theme,
      chapter: document.querySelector('.wrapped-stage')?.getAttribute('data-chapter'),
      animationDuration: body ? getComputedStyle(body).animationDuration : null,
      bigOpacity: big ? getComputedStyle(big).opacity : null,
      bigText: big?.textContent?.trim().slice(0, 24) ?? '',
    };
  });
  console.log(`${name}: ${JSON.stringify(state)}`);
  if (state.power !== 'off') fail(`${name}: the deck did not opt out (data-power=${state.power})`);
  if (!state.animationDuration || parseFloat(state.animationDuration) < 0.4) {
    fail(`${name}: the deck's entrance was still cut to ${state.animationDuration}`);
  }
  if (state.theme !== 'light') fail(`${name}: the deck was forced into ${state.theme} appearance`);
  if (state.bigOpacity !== '1') fail(`${name}: the headline is not fully visible`);
  if (!state.bigText) fail(`${name}: the first chapter has no headline`);
  return { context, page };
}

const save = await openDeck(0.15, '15%');
for (let step = 0; step < 6; step += 1) {
  const chapter = await save.page.evaluate(() => document.querySelector('.wrapped-stage')?.getAttribute('data-chapter'));
  if (chapter === 'map') break;
  await save.page.evaluate(() => {
    const stage = document.querySelector('.wrapped-stage');
    stage?.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: window.innerWidth - 30, clientY: window.innerHeight / 2 }));
  });
  await save.page.waitForTimeout(650);
}
await save.page.waitForTimeout(2200);
const map = await save.page.evaluate(() => {
  const route = document.querySelector('.wrapped-map__route');
  return {
    chapter: document.querySelector('.wrapped-stage')?.getAttribute('data-chapter'),
    dash: route ? getComputedStyle(route).strokeDashoffset : null,
  };
});
console.log(`map: ${JSON.stringify(map)}`);
if (map.chapter !== 'map') fail(`map: expected the map chapter, saw ${map.chapter}`);
if (map.dash === null || map.dash === '1px' || map.dash === '1') fail(`map: the route stayed hidden (dashoffset=${map.dash})`);
await save.context.close();

const superDeck = await openDeck(0.05, '5%');
await superDeck.context.close();

const lastDeck = await openDeck(0.01, '1%');
await lastDeck.context.close();

const context = await browser.newContext({ viewport: { width: 360, height: 800 } });
await context.addInitScript(() => {
  localStorage.setItem('ov-planner:v1:dev', JSON.stringify({ battery: 0.15, charging: false }));
});
const home = await context.newPage();
await home.goto(BASE, { waitUntil: 'domcontentloaded' });
await home.locator('.app-shell, .home-page, main').first().waitFor({ timeout: 20000 }).catch(() => undefined);
await home.waitForTimeout(900);
const homePower = await home.evaluate(() => document.documentElement.dataset.power);
console.log(`home at 15%: data-power=${homePower}`);
if (homePower !== 'save') fail(`the exception leaked: the home screen is ${homePower} at 15%`);
await context.close();

await browser.close();
if (failed) {
  console.log('YEARBOOK BATTERY: FAIL');
  process.exit(1);
}
console.log('YEARBOOK BATTERY: PASS (deck exempt at 15%, 5% and 1%; other screens still save)');
