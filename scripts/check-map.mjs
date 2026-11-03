/**
 * Items 11, 13 and 14, measured.
 *
 * 11: the ride row names the street of the stop you board at, and the street is the map's own answer
 *     for that stop (compared with `src/data/stop-streets.json`, not with itself).
 * 13: every walk carries a link, it opens the map with the line **dashed** and tiles that actually
 *     loaded, and Navigeer steps along the real streets.
 * 14: every ride carries the glyph, it opens that leg and no other with the row's two times, and
 *     Navigeer steps station by station.
 */
import { readFileSync } from 'node:fs';
import { chromium, prepareBrowserEnv, browserIsInstalled, MISSING_BROWSER_HELP } from './browser-env.mjs';

prepareBrowserEnv();
if (!browserIsInstalled()) {
  console.error(MISSING_BROWSER_HELP);
  process.exit(2);
}

const base = (process.env.BASE_URL || 'http://127.0.0.1:4185').replace(/\/$/, '');
const streets = JSON.parse(readFileSync('src/data/stop-streets.json', 'utf8'));
const b64 = (payload) => Buffer.from(JSON.stringify(payload)).toString('base64url');
const rideTrip = `/results/${b64({ v: 1, f: 'haarlem', t: 'zwolle', d: '2026-11-02', m: 300, tm: 'depart' })}`;
/*
 * A walk only appears where the plan has one, so the check looks through several pairs rather than
 * assuming the first pair it thought of plans a walk at all.
 */
const walkTrips = [
  /* An address is where a walk actually begins: the traveller's own street, then the walk to the
     stop it is planned from (`fl` names it, `fa` is the distance the device measured). */
  { v: 1, f: 'haarlem', t: 'zwolle', fl: 'Rijksstraatweg 9, Haarlem', fa: 1400, d: '2026-11-02', m: 300, tm: 'depart' },
  { v: 1, f: 'amsterdam-centraal', t: 'utrecht-centraal', fl: 'Prinsengracht 267, Amsterdam', fa: 900, d: '2026-11-02', m: 300, tm: 'depart' },
  { v: 1, f: 'rotterdam-centraal', t: 'den-haag-centraal', fl: 'Blaak 3, Rotterdam', fa: 700, d: '2026-11-02', m: 300, tm: 'depart' },
  { v: 1, f: 'haarlem', t: 'zwolle', tl: 'Oosterstraat 1, Zwolle', ta: 800, d: '2026-11-02', m: 300, tm: 'depart' },
].map((payload) => `/results/${b64(payload)}`);

let failures = 0;
const check = (ok, label, detail = '') => {
  if (!ok) failures += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  (${detail})` : ''}`);
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
const dismiss = async () => {
  for (let i = 0; i < 8; i += 1) {
    const close = page.locator('.overlay button, .sheet button');
    if (!(await close.count())) break;
    await close.first().click({ timeout: 800 }).catch(() => {});
    await page.waitForTimeout(80);
  }
};
const openJourney = async (url, index = 0) => {
  /* `networkidle` never settles once the map and its route are fetching, so wait for the cards. */
  await page.goto(`${base}${url}`, { waitUntil: 'domcontentloaded' });
  try {
    await page.waitForSelector('.journey-card__link', { timeout: 12000 });
  } catch {
    return false;
  }
  await dismiss();
  if (index >= (await page.locator('.journey-card__link').count())) return false;
  await page.locator('.journey-card__link').nth(index).click();
  await page.waitForSelector('.timeline', { timeout: 15000 });
  return true;
};

/* ---------------------------------------------------------------- item 11: the street */
await openJourney(rideTrip);
const firstRide = page.locator('.timeline__rail--ride').filter({ has: page.locator('.leg-map') }).first();
const streetText = (await firstRide.locator('.timeline__street').first().textContent())?.trim() ?? '';
const boardedStop = (await firstRide.locator('.timeline__station').first().textContent())?.trim() ?? '';
check(streetText.length > 0, 'the ride names the street you board at', streetText);
check(
  streetText === streets.haarlem?.street,
  "the street is the map's own answer for Haarlem",
  `${streetText} vs ${streets.haarlem?.street}`,
);

/* ---------------------------------------------------------------- item 14: the ride glyph */
const rideCount = await page.locator('.leg-map').count();
const rideRows = await page.locator('.timeline__rail--ride .leg-service').count();
check(rideCount > 0, 'every ride carries the map glyph', `${rideCount} glyph(s), ${rideRows} service row(s)`);
check(rideCount === rideRows, 'one glyph per service, no more', `${rideCount} vs ${rideRows}`);

const legDeparture = (await firstRide.locator('.timeline__time').first().textContent())?.trim() ?? '';
await page.locator('.leg-map').first().click();
await page.waitForSelector('.street-map__canvas');
await page.waitForTimeout(1800);
const tiles = await page.locator('.street-map__canvas img.leaflet-tile-loaded').count();
check(tiles > 0, 'the street tiles actually load', `${tiles} tile(s)`);
const lines = await page.locator('.street-map__canvas path.leaflet-interactive').count();
check(lines > 0, 'the ride is drawn on the map', `${lines} line(s)`);
const sheetTimes = (await page.locator('.street-map__times .row').textContent())?.trim() ?? '';
const times = sheetTimes.match(/\d{1,2}:\d{2}/g) ?? [];
check(
  times[0] === legDeparture && times.length === 2 && times[1] > times[0],
  'the two times under the map are the leg\'s own, departure first',
  `${sheetTimes} vs the row\'s ${legDeparture}`,
);
const firstTitle = (await page.locator('.modal h2, .modal [role="heading"]').first().textContent())?.trim() ?? '';
check(/Haarlem/.test(firstTitle), 'it opens the leg you clicked', firstTitle);
await page.locator('.street-map__navigate button:has-text("Navigeer")').click();
await page.waitForSelector('.street-map__step');
const firstStep = (await page.locator('.street-map__step').textContent())?.trim() ?? '';
check(/Step 1 of/.test(firstStep), 'Navigeer starts at the first step', firstStep.split('\n')[0]);
const next = page.locator('button[aria-label="Next step"]');
const canNext = await next.isEnabled();
if (canNext) {
  await next.click();
  const second = (await page.locator('.street-map__step').textContent())?.trim() ?? '';
  check(/Step 2 of/.test(second), 'Navigeer steps forward', second.split('\n')[0]);
} else {
  check(false, 'Navigeer can step forward', 'the next button was disabled');
}
await page.keyboard.press('Escape');
await page.waitForTimeout(300);

/* ---------------------------------------------------------------- item 13: the walk link */
let walkLinks = 0;
let walkWhere = '';
for (const trip of walkTrips) {
  if (!(await openJourney(trip))) continue;
  walkLinks = await page.locator('.leg-map-link').count();
  if (walkLinks > 0) {
    walkWhere = trip;
    break;
  }
}
const walkLink = page.locator('.leg-map-link').first();
check(walkLinks > 0, 'a walk carries its own map link', `${walkLinks} link(s)`);
if (walkLinks > 0) {
  await walkLink.click();
  await page.waitForSelector('.street-map__canvas');
  await page.waitForTimeout(2500);
  const dashed = await page
    .locator('.street-map__canvas path.leaflet-interactive')
    .evaluateAll((paths) => paths.map((path) => path.getAttribute('stroke-dasharray') ?? ''));
  check(
    dashed.some((value) => value.trim().length > 0),
    'the walk is drawn as a dashed line',
    dashed.join(' | ') || 'no lines',
  );
  const walkTiles = await page.locator('.street-map__canvas img.leaflet-tile-loaded').count();
  check(walkTiles > 0, 'the walk map has real tiles', `${walkTiles} tile(s)`);
  const sketch = await page.locator('.street-map__notice').count();
  check(sketch === 0, 'the walk is the real route, not the straight sketch', sketch ? 'a notice is shown' : 'no notice');
  const ends = (await page.locator('.street-map__ends').textContent())?.replace(/\s+/g, ' ').trim() ?? '';
  check(
    /Rijksstraatweg|Haarlem/.test(ends) && /Haarlem Station|Zwolle/.test(ends),
    'the two ends are named, with their streets',
    ends.slice(0, 90),
  );
  /* Navigeer's own controls appear when it is switched on, which is the order a traveller meets
     them in: the button first, then the steps it opens. */
  const walkStepsStreet = (await page.locator('.street-map__navigate button').first().textContent())?.trim() ?? '';
  check(/Navigeer/.test(walkStepsStreet), 'the walk offers Navigeer', walkStepsStreet);
  await page.locator('.street-map__navigate button').first().click();
  await page.waitForSelector('.street-map__step');
  const controls = await page.locator('button[aria-label="Next step"]').count();
  check(controls === 1, 'a walk can be steered street by street', `${controls} control(s)`);
  const firstWalkStep = (await page.locator('.street-map__step').textContent())?.trim() ?? '';
  const total = Number(firstWalkStep.match(/of (\d+)/)?.[1] ?? '0');
  const walkNext = page.locator('button[aria-label="Next step"]');
  if (total > 1 && (await walkNext.isEnabled())) {
    await walkNext.click();
    const secondWalkStep = (await page.locator('.street-map__step').textContent())?.trim() ?? '';
    check(
      /Step 2 of/.test(secondWalkStep),
      'the walk steps forward along the streets',
      `${firstWalkStep.split('\n')[0]} then ${secondWalkStep.split('\n')[0]}`,
    );
  } else {
    /* A walk that follows one street has one step: there is nowhere to step to, and saying so is
       the honest result rather than failing a route for being short. */
    check(
      total === 1 && /Step 1 of 1/.test(firstWalkStep),
      'a one-street walk says it is one step',
      firstWalkStep.split('\n')[0],
    );
  }
}


/*
 * **One door to the map.**
 *
 * The journey page carried a MAP pill under its controls and a thumbnail of the route in its title
 * line, and both opened the same map — he crossed the pill out: "Map button is useless, the circles
 * button does the same". Exactly one control may answer to "Show on map", and it has to be the
 * thumbnail, because that is the one that shows where the journey goes before you press it.
 */
{
  const doorPage = await browser.newPage({ viewport: { width: 390, height: 900 } });
  await doorPage.goto(`${base}${rideTrip}`, { waitUntil: 'networkidle' });
  /* The install banner and any first-visit sheet sit over the list; the same dismissal every other
     probe in this file uses before it presses anything. */
  for (let i = 0; i < 8; i += 1) {
    const close = doorPage.locator('.overlay button, .sheet button');
    if (!(await close.count())) break;
    await close.first().click({ timeout: 800 }).catch(() => {});
    await doorPage.waitForTimeout(120);
  }
  await doorPage.waitForSelector('.journey-card__link', { timeout: 20000 });
  await doorPage.locator('.journey-card__link').first().click();
  await doorPage.waitForSelector('.timeline', { timeout: 15000 });
  const doors = await doorPage.evaluate(() => {
    const named = [...document.querySelectorAll('[aria-label="Show on map"]')];
    const pills = [...document.querySelectorAll('a.btn, button.btn')].filter(
      (el) => el.textContent.trim() === 'Map',
    );
    return {
      total: named.length,
      thumbs: named.filter((el) => el.classList.contains('journey-thumb')).length,
      pills: pills.length,
    };
  });
  check(doors.total === 1, 'the journey offers exactly one way to the map', `${doors.total} control(s)`);
  check(doors.thumbs === 1, 'and that way is the thumbnail in the title line', `${doors.thumbs} thumbnail(s)`);
  check(doors.pills === 0, 'there is no second Map button', `${doors.pills} pill(s)`);
  /*
   * **A marker must have its footnote.** The price wears a star; the line that explains it has to
   * carry the same star, or the page tells the reader something is being left out and never says
   * what. He circled the lone star: "Why is there a footnote marker but no footnote".
   */
  const starNote = await doorPage.evaluate(() => {
    const price = document.querySelector('.journey-meta__price');
    const note = document.querySelector('.journey-note');
    const noteText = (note?.textContent ?? '').trim();
    return {
      starred: price ? price.textContent.includes('*') : false,
      note: noteText.slice(0, 48),
      noteHasStar: noteText.startsWith('*'),
    };
  });
  check(starNote.starred, 'the price wears its marker', String(starNote.starred));
  check(starNote.noteHasStar, 'and the footnote carries the same marker', starNote.note || '(no note)');
  /*
   * **The bicycle rule belongs to the service, not to the journey.** It was one quiet line at the
   * foot of the page — "Bicycle allowed" under a trip made of two trains — and he asked why it was
   * there and not under the train. Each ride row now says it, and the page no longer summarises it.
   */
  const bike = await doorPage.evaluate(() => ({
    /*
     * A service row, and only a service row: the rail also draws the change between two services and
     * every intermediate stop as `--ride` rows, and counting those is how the first run of this check
     * read "2 marks for 4 services" when both services had one.
     */
    rides: document.querySelectorAll(
      'li.timeline__rail--ride:not(.timeline__rail--change):not(.timeline__rail--stop)',
    ).length,
    marks: document.querySelectorAll('.leg-bike').length,
    texts: [...document.querySelectorAll('.leg-bike')].map((el) => el.textContent.trim()),
    journeyLevel: [...document.querySelectorAll('p')].some((el) =>
      /^(Bicycle allowed|No bicycle)$/.test(el.textContent.trim()),
    ),
  }));
  check(
    bike.rides > 0 && bike.marks === bike.rides,
    'every service states its own bicycle rule',
    `${bike.marks} mark(s) for ${bike.rides} service(s)`,
  );
  check(
    bike.texts.every((text) => /bicycle/i.test(text)),
    'each mark says the rule in words',
    bike.texts.join(' / ') || '(none)',
  );
  check(
    !bike.journeyLevel,
    'and the page does not state it once for the whole journey',
    bike.journeyLevel ? 'a journey-level line exists' : 'none',
  );

  /*
   * **Nothing from a service may appear after the change that ends it.** He photographed an opened
   * Sprinter whose stops were printed below "9 min transfer time" — the train appeared to finish
   * before the transfer it was still travelling towards. Every opened list must be read before the
   * change row, and between a change and the next service there must be no stop at all.
   */
  const order = await doorPage.evaluate(() => {
    const tokens = [...document.querySelectorAll('.timeline > li')].map((el) => {
      if (el.matches('.timeline__rail--stop')) return 'stop';
      if (el.matches('.timeline__rail--change')) return 'change';
      if (el.matches('.timeline__rail--ride')) return 'ride';
      return 'other';
    });
    const misplaced = [];
    tokens.forEach((token, index) => {
      if (token !== 'change') return;
      for (let i = index + 1; i < tokens.length && tokens[i] !== 'ride'; i += 1) {
        if (tokens[i] === 'stop') {
          misplaced.push(index);
          break;
        }
      }
    });
    return { tokens, misplaced, stops: tokens.filter((token) => token === 'stop').length };
  });
  check(
    order.stops > 0,
    'the opened journey shows its stops, so the order can be read',
    `${order.stops} stop row(s)`,
  );
  check(
    order.misplaced.length === 0,
    'no stop of a service is printed after the change that ends it',
    order.misplaced.length
      ? `misplaced after change row ${order.misplaced.join(', ')}`
      : order.tokens.join(' '),
  );
  /*
   * **And the reverse belongs on the results screen, where the pair is.** A RETURN pill here was a
   * third copy of the same act — he crossed it out: "theres already a Reverse button on the Journey
   * results page". The journey page must offer none, and the results screen must still have one.
   */
  const returnDoors = await doorPage.evaluate(
    () =>
      [...document.querySelectorAll('button, a')].filter((el) => {
        const name = (el.getAttribute('aria-label') ?? el.textContent ?? '').trim();
        return /plan return journey|^return$/i.test(name);
      }).length,
  );
  check(returnDoors === 0, 'the journey page offers no Return button of its own', `${returnDoors} control(s)`);
  await doorPage.goto(`${base}${rideTrip}`, { waitUntil: 'networkidle' });
  for (let i = 0; i < 8; i += 1) {
    const close = doorPage.locator('.overlay button, .sheet button');
    if (!(await close.count())) break;
    await close.first().click({ timeout: 800 }).catch(() => {});
    await doorPage.waitForTimeout(120);
  }
  const swaps = await doorPage.evaluate(() => ({
    byClass: document.querySelectorAll('.planner-swap').length,
    named: [...document.querySelectorAll('[aria-label]')].filter((el) =>
      /swap|reverse/i.test(el.getAttribute('aria-label') ?? ''),
    ).length,
  }));
  check(
    swaps.byClass + swaps.named > 0,
    'the results screen still has the reverse for the pair',
    `${swaps.byClass} swap control(s), ${swaps.named} named`,
  );
  await doorPage.close();
}

await browser.close();
console.log(`map: ${failures} failing check(s)`);
process.exit(failures ? 1 : 0);
