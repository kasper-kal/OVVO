/**
 * **Every station name that has a page, and is not a link to it.**
 *
 * A station name is the one piece of text in the app that always *means* a place with a page of its
 * own, so wherever it is printed as a word rather than as a control it is a link (`StopLink`,
 * `components/stops/StopLink.tsx`). The rule travelled surface by surface — the board's destination,
 * a journey leg, an alert's line of stops — and that is exactly how a surface gets missed: nothing
 * was checking.
 *
 * This walks every route at two widths and reports each station name printed as ordinary text:
 *
 *   • a name that is the whole of its own text node and is not inside a link → **a finding**;
 *   • a name inside a control (`button`, `label`, `select`, an option, a tab, a combobox) → not a
 *     finding: the words *are* the control, and a link inside a button is a second control inside
 *     the first;
 *   • a name inside a row that a stretched link covers (`li.list-row--link` with a
 *     `a.list-row__stretch`) → not a finding: the whole row is the way in, which is a bigger
 *     target than the word would be;
 *   • a name inside a longer sentence (`Cancelled services — Schiphol Airport to Haarlem`) →
 *     reported as **embedded**, separately, because turning it into a link means splitting the
 *     sentence, which is a decision per screen rather than a rule;
 *   • a name in a stop page's own `h1`, painted into a map drawing, or quoted from Wikipedia → not
 *     a finding, and the reason is printed with the count (`SKIP` below).
 *
 * Run:   node scripts/stop-link-audit.mjs [origin]
 * Needs: playwright + a dev server on :3000 (it reads the stop list from the app's own module, so it
 * cannot drift from `data/stops.ts`).
 */
import { chromium, prepareBrowserEnv } from './browser-env.mjs';

prepareBrowserEnv();
import { ensureAppFont } from './font-guard.mjs';

const ORIGIN = process.argv[2] ?? 'http://127.0.0.1:3000';
const WIDTHS = [390, 1440];
const ROUTES = [
  '/',
  '/results',
  '/journey/j1',
  '/stops',
  '/stops/utrecht-centraal',
  '/departures',
  '/disruptions',
  '/disruptions/d1',
  '/preferences',
  '/settings',
  '/map',
];

/**
 * Names that are printed as plain text on purpose.
 *
 * One entry per place, with the reason — the same shape `consistency-audit.mjs` uses for the
 * differences it tolerates, because "it is allowed because I said so" is how a rule rots.
 */
const DELIBERATE = {
  '/map': {
    '.map-sheet__title': 'the sheet names the stop it is offering; the Select button under it is the control',
  },
  '/settings': {
    '.board-list__row': 'the specimen board: its two rows show what a board looks like, and are examples rather than places',
  },
  /* On every route: two places where ordinary text happens to spell a stop's name. */
  '*': {
    '[data-quoted]': 'a passage quoted from Wikipedia, with the article’s own link beside it',
    '.stop-card__meta': 'the city and code on a stop card’s own meta line: a city has no page here, and the card’s name above it is already the way to the stop',
  },
};

const SETTINGS = {
  version: 8,
  theme: 'light',
  language: 'en',
  timeFormat: '24h',
  dateFormat: 'long',
  density: 'comfortable',
  highContrast: false,
  reduceMotion: false,
  selectionColor: 'coral',
  selectionCustom: '',
  selectionColorDark: 'coral',
  selectionCustomDark: '',
  background: 'cream',
  backgroundColour: '#FCFBFA',
  backgroundColourDark: '#FCFBFA',
  backgroundImage: '',
  backgroundImageSource: '',
  backgroundCrop: null,
  cardTreatment: 'solid',
  primaryColour: '',
  primaryColourDark: '',
  defaultTimeMode: 'depart',
  defaultOriginStopId: null,
};

/** The collector, run inside the page: every visible station name and what it is inside. */
const COLLECT = async () => {
  const stops = await import('/src/data/stops.ts');
  const names = new Set();
  for (const stop of stops.STOPS) {
    names.add(stop.name);
    names.add(stops.stopLabel(stop.id));
    const custom = stops.customStopName(stop.id);
    if (custom) names.add(custom);
  }
  const CONTROL = 'button, [role="button"], label, select, option, input, textarea, [role="combobox"], [role="option"], [role="tab"], [role="radio"], [role="checkbox"], [role="switch"]';

  const visible = (el) => {
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    const rect = el.getBoundingClientRect();
    if (rect.width < 1 && rect.height < 1) return false;
    /* `sr-only` text is for a reader, not a place on the screen a thumb could reach. */
    if (style.clipPath !== 'none' && rect.width <= 1) return false;
    if (el.classList.contains('sr-only')) return false;
    return true;
  };

  const describable = (el) =>
    el.tagName.toLowerCase() +
    (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : '') +
    (el.getAttribute('data-testid') ? `[${el.getAttribute('data-testid')}]` : '') +
    (el.hasAttribute('data-quoted') ? '[data-quoted]' : '');

  const out = [];
  const walker = document.createTreeWalker(document.querySelector('main') ?? document.body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent;
    if (!text || !text.trim()) continue;
    const parent = node.parentElement;
    if (!parent || !visible(parent)) continue;
    const trimmed = text.trim();
    const exact = names.has(trimmed);
    const embedded = [...names]
      .filter((name) => name.length > 3 && trimmed.includes(name) && trimmed !== name)
      .sort((a, b) => b.length - a.length)[0];
    if (!exact && !embedded) continue;
    const control = parent.closest(CONTROL);
    const link = parent.closest('a');
    /* A row-wide link: the row is one target, and the word inside it is part of that target. */
    const row = parent.closest('li.list-row');
    const stretch = row ? row.querySelector('a.list-row__stretch') : null;
    /*
     * Three places where the plain words are the answer, not a miss:
     *   • a stop page's own `h1` — a link to the page you are on is a control that does nothing;
     *   • text inside an `svg` — a name painted into a drawing, not type a thumb can select;
     *   • a quoted passage (`[data-quoted]`) — handled through `DELIBERATE['*']`.
     */
    const skip = parent.closest('svg')
      ? 'painted into a drawing'
      : location.pathname.startsWith('/stops/') && parent.closest('h1')
        ? 'the page naming itself'
        : null;
    out.push({
      text: trimmed.slice(0, 60),
      name: exact ? trimmed : embedded,
      kind: exact ? 'name' : 'embedded',
      skip,
      viaRow: Boolean(stretch),
      inLink: Boolean(link) || Boolean(stretch),
      linkTo: link ? link.getAttribute('href') : stretch ? stretch.getAttribute('href') : null,
      inControl: control ? control.tagName.toLowerCase() + (control.getAttribute('role') ? `[role=${control.getAttribute('role')}]` : '') : null,
      parent: describable(parent),
      ancestors: (() => {
        const chain = [];
        for (let el = parent; el && chain.length < 5; el = el.parentElement) chain.push(describable(el));
        return chain.join(' < ');
      })(),
    });
  }
  return out;
};

const browser = await chromium.launch({ chromiumSandbox: false, args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--hide-scrollbars'] });
const findings = [];
const embedded = [];
const skipped = [];
let checked = 0;
let linked = 0;

for (const width of WIDTHS) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
  await context.addInitScript(
    ([settings]) => {
      const P = 'ov-planner:v1:';
      const set = (key, value) => localStorage.setItem(P + key, JSON.stringify(value));
      set('settings', settings);
      set('location-consent', 'denied');
      set('pinned-stops', ['haarlem', 'zaandam']);
      set('board-stop', 'utrecht-centraal');
      set('home-widgets', ['planner', 'pinned-stops', 'alerts-at-pins', 'next-departures', 'your-journeys']);
      const today = new Date().toISOString().slice(0, 10);
      set('recent-searches', [
        { id: 'probe', at: Date.now(), query: { fromStopId: 'utrecht-centraal', toStopId: 'amsterdam-centraal', date: today, time: 600, timeMode: 'depart' } },
      ]);
    },
    [SETTINGS],
  );
  const page = await context.newPage();
  for (const route of ROUTES) {
    await page.goto(`${ORIGIN}${route}`, { waitUntil: 'networkidle' });
    await ensureAppFont(page);
    await page.waitForTimeout(300);
    for (const label of ['Not now', 'No thanks', 'Deny', 'Dismiss', 'Got it']) {
      const button = page.locator('[role=dialog] button, [role=dialog] a').filter({ hasText: new RegExp(label, 'i') });
      if (await button.count()) {
        await button.first().click().catch(() => {});
        break;
      }
    }
    await page.waitForTimeout(150);
    const rows = await page.evaluate(COLLECT);
    for (const row of rows) {
      checked += 1;
      if (row.inLink) {
        linked += 1;
        continue;
      }
      if (row.inControl) continue;
      if (row.skip) {
        skipped.push({ route, where: row.skip, text: row.text });
        continue;
      }
      const tolerated =
        (DELIBERATE[route] && Object.keys(DELIBERATE[route]).find((selector) => row.ancestors.includes(selector))) ||
        (DELIBERATE['*'] && Object.keys(DELIBERATE['*']).find((selector) => row.ancestors.includes(selector)));
      const record = { route, width, ...row, tolerated: tolerated ? DELIBERATE[route]?.[tolerated] ?? DELIBERATE['*'][tolerated] : null };
      if (tolerated) skipped.push({ route, where: record.tolerated, text: row.text });
      else if (row.kind === 'embedded') embedded.push(record);
      else findings.push(record);
    }
  }
  await context.close();
}
await browser.close();

const byPlace = (list) => {
  const groups = new Map();
  for (const row of list) {
    const key = `${row.route} @${row.width} — ${row.ancestors.split(' < ').slice(0, 3).join(' < ')}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  return groups;
};

console.log(`\nstation names read: ${checked}, already inside a link: ${linked}`);

if (skipped.length) {
  const reasons = new Map();
  for (const row of skipped) reasons.set(row.where, (reasons.get(row.where) ?? 0) + 1);
  console.log('\n=== plain on purpose');
  for (const [reason, count] of reasons) console.log(`  ${count} — ${reason}`);
}

if (embedded.length) {
  console.log(`\n=== a station name inside a sentence (a decision per screen, not a rule) — ${embedded.length}`);
  for (const [place, rows] of byPlace(embedded)) console.log(`  ${place}\n      “${rows[0].text}”`);
}

if (findings.length) {
  console.log(`\n=== printed as plain text, with no link — ${findings.length}`);
  for (const [place, rows] of byPlace(findings)) console.log(`  ${place}\n      “${rows[0].text}”`);
  console.log('\nFAIL — a station name that has a page is not a way to it.');
  process.exit(1);
}

console.log('\nOK — every station name printed as text is a link to its page, or the words of a control.');
