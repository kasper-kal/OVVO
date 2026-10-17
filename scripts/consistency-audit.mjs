/**
 * A consistency audit: what the *same* action looks like and where it sits, read out of a real
 * browser on every screen, so drift is a number rather than an opinion.
 *
 * Why this file exists. Three rounds in a row the same class of defect was reported by eye —
 * "the back button is in a different place with every menu", then "the pin is at the top right
 * sometimes and the top left others". Each time it was fixed on the screens named and each time
 * it came back somewhere else, because nothing measured the *rule*. A screenshot cannot see a
 * rule; an inventory can:
 *
 *   1. every control on every screen is recorded — its accessible name, the glyphs it draws, its
 *      shape (box, radius, border, fill) and its place (which landmark it sits in, which row of
 *      that landmark, which side of it);
 *   2. controls are grouped by the **action** they perform, so *Pin Haarlem* and *Unpin Zaandam*
 *      are one action with n instances rather than n unrelated strings;
 *   3. an action whose instances do not all share one signature is printed as a finding, with the
 *      instances that disagree.
 *
 * The standards the findings are judged against are the ones that actually apply:
 *   - W3C COGA, "Use icons that help the user" — one glyph, one meaning
 *     https://www.w3.org/WAI/WCAG2/supplemental/patterns/o1p07-icons-used/
 *   - WCAG 2.2 SC 3.2.3 Consistent Navigation — repeated controls in the same relative order
 *     https://www.w3.org/WAI/WCAG22/Understanding/consistent-navigation.html
 *   - WCAG 2.1 SC 3.2.4 Consistent Identification — the same function, identified the same way;
 *     its own example is a save control that uses a disk icon on one page and a checkmark on
 *     another https://www.w3.org/WAI/WCAG21/Understanding/consistent-identification.html
 *   - NN/g heuristic #4, Consistency and standards — "Ensure consistency in the placement of form
 *     fields and buttons" https://www.nngroup.com/articles/consistency-and-standards/
 *
 * Run:   node scripts/consistency-audit.mjs [origin] [--gate]
 *
 * Without `--gate` it reports and exits 0 — the findings are the output, and this is a research
 * instrument for a live product.
 *
 * With `--gate` it exits 1 when the app has *drifted*, and it decides that on two rules:
 *
 *   1. **one action, one glyph per state** (W3C COGA). Mechanical and never exempt: if two
 *      instances of the same action, in the same pressed state, draw different glyphs, that is
 *      the defect this audit was written for — `pin` and `×` for one toggle, `route` and
 *      `arrowLeft` for one way back. Nothing to judge.
 *   2. **every remaining finding is a decision on the record.** An action whose instances still
 *      disagree in shape or place must be named in `DELIBERATE` below with the reason, or the
 *      gate fails. That is what `--gate` was missing: the first version failed on *any*
 *      disagreement, so the deliberate differences the traveller asked for (a text-only `Plan`
 *      on a stop card, an obsidian submit in a picker) made it red forever and it gated nothing.
 *      Now a new disagreement fails it, and the ones it tolerates are the ones written down.
 *
 * Place is reported but not gated, on purpose: a control in a page head, one in a card's foot and
 * one in a dialog's footer cannot occupy the same place, and WCAG 3.2.3 — the clause about
 * repeated controls — is about their *relative order*, which this instrument does not measure.
 */
const ORIGIN = process.argv.find((arg) => arg.startsWith('http')) ?? 'http://127.0.0.1:3000';
const GATE = process.argv.includes('--gate');
const WIDTH = Number(process.env.CONSISTENCY_WIDTH ?? 390);

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.error('this audit needs a browser: npm i -D playwright && npx playwright install chromium');
  process.exit(2);
}

/* ------------------------------------------------------------------ what an action is */

/**
 * The action a control performs, derived from its accessible name.
 *
 * Order matters: the first pattern that matches wins, and the patterns are written so that the
 * *distinguishing* word decides. `Plan from here` and `Plan return journey` are the search-planning
 * action; `Pin Haarlem` and `Unpin Zaandam` are one toggle with two states; a name that matches
 * nothing is its own action (`other`), which keeps unknown controls out of the findings instead of
 * inventing a group for them.
 *
 * The first version grouped by verb, and four groups were really four *functions* wearing one verb:
 * a `×` that clears a field and a `Remove all stored data` that destroys the app's data were both
 * `dismiss`; `Favourite` (keep this journey) and `Keep this search` (keep this search) were both
 * `save something`; `Transport preferences` and `Settings` were both `options`; `Customise home`
 * (edit this screen) and `Options` (filter this list) were both `options` too, which is how it came
 * to report two glyphs — `sliders` and `settings` — for one action. WCAG 3.2.4 is about the *same*
 * function, so grouping by verb manufactured findings out of unrelated controls. They are separate
 * actions now, and `Customise home` draws its own glyph (see `Icons.tsx`).
 */
const ACTION_RULES = [
  [/^(un)?pin\b/, 'pin a stop'],
  [/^back\b|^all alerts$/, 'go back'],
  /* Two different destinations: a journey on the map, and the map itself. */
  [/^network map$/, 'show the network map'],
  [/^(show on map|show this stop|choose on the map)$/, 'show on the map'],
  [/^(plan|from here|to here)\b/, 'plan a journey'],
  [/^(more|open the full board|departure boards?|board)$/, 'open the board'],
  /* Destructive, and its own function: five `×` controls clear something; this one erases. */
  [/^(remove|delete)\b/, 'remove stored data'],
  /*
   * Three functions, three actions. Round 16 split `dismiss` off from the destructive
   * `Remove all stored data`; this round splits what was left, because the two ends of the group
   * are not the same function either: a `×` that empties the field it sits in, a button that
   * clears a *set* of filters, and a `×` that closes a surface (the plan dialog, a message).
   * WCAG 3.2.4 names the *same* function, and `Close` closing a dialog and `Clear stop` emptying
   * an input are two. The filter-clearing buttons are not in the walk today (they only exist with
   * a filter set); they are named here so that when one arrives it is judged against each other,
   * not against a field.
   */
  [/^clear\b.*\bfilters?\b|^clear\b.*\bmode filter\b/, 'clear the filters'],
  [/^clear\b/, 'clear a field'],
  [/^(close|dismiss)\b/, 'close a dialog'],
  [/^search\b|^find\b/, 'search'],
  [/^reverse\b/, 'reverse the ends'],
  [/^zoom in$/, 'zoom in'],
  [/^zoom out$/, 'zoom out'],
  [/^centre\b/, 'centre the map'],
  [/^use my current location$/, 'locate me'],
  [/^(keep this search|kept)$/, 'keep a search'],
  [/^(un)?favourite(d)?$/, 'save a journey'],
  [/^(save|star|heart)\b/, 'save something'],
  /*
   * Two functions again: `Options` opens the filter panel that is over the list, and `Travel
   * preferences` is a link to the preferences screen. Both were `options`, so the group reported
   * a tinted chip against a white pill as one action in two shapes.
   */
  [/^(travel preferences|change travel|manage avoidance|preferences)\b/, 'travel preferences'],
  [/^(options|other options)$/, 'options'],
  [/^settings$/, 'open settings'],
  [/^customise\b/, 'customise home'],
  [/^refresh\b/, 'refresh'],
  [/^share\b/, 'share'],
  [/^show (fewer|\d+ more)$/, 'show more results'],
];

/**
 * Findings that are decisions, not drift — the gate lets these through and fails on anything else.
 *
 * One line per action, naming the standard's clause and *why* the instances disagree, so that
 * `--gate` is a check with a stated boundary rather than a number that is red on purpose. An entry
 * here is a claim the traveller can contradict; nothing is here to make a count go down.
 */
const DELIBERATE = new Map([
  ['pin a stop', 'one glyph, and trailing in every landmark it appears in: a page head, a card head, a list row and a picker row are four containers. The picker’s rows past the fold read `offscreen` rather than `foot` — they are past the dialog’s own edge, which is a scroll position, not a second place'],
  ['plan a journey', 'a control that names its own object: an icon-only row button in a board, a bordered pill in a page head or a panel foot, a text-only `Plan` on a stop card (asked for by name), and the picker’s obsidian submit'],
  ['open the board', 'a card whose heading row is the narrowest in the app says `Board`, a list says `Open the full board` (asked for by name), and the board’s own page is `Departure boards`'],
  ['save a journey', 'a journey card’s pill and the journey page’s pill are the same control in two containers; the journey page’s was obsidian and is not any more'],
  /* A finding at 390 and not at 320 — the two widths this audit runs at disagree about it, which
     is the caveat the register's own note below is about. Kept, not deleted. */
  ['show the network map', 'the map screen as a destination, named for itself rather than for a journey; it sits in the head of the alert page’s card at 390 and in the head of its panel at 320'],
  ['show on the map', 'a journey’s own map link in the card or the journey page — one function, two containers'],
  ['go back', 'a bare arrow in a bar (page level, 44px disc) versus a labelled return link in content (a bordered pill); the shape follows the container the audit already agreed on'],
  ['show more results', 'the same bordered pill, at the foot of a page on the two long lists and at the foot of a card on the stop page and the board'],
  ['dismiss', 'five × controls, all 44×44, round, trailing in their own row — one signature per row it clears'],
  ['options', 'the options/filters glyph, always labelled, in the filter bar of the three lists that have one'],
  ['travel preferences', 'one destination named for its context: four `Travel preferences` links in a card’s own action row, and the alert page’s single full-width `Manage avoidance preferences` at the foot of its card, with nothing to sit beside'],
]);

/**
 * The action a control performs.
 *
 * Only the **label** decides — an `aria-label` when there is one, else the control's first few
 * words — and only when that label is short enough to be a label. A first pass matched the whole
 * text of the control, which turned an alert's title (`Cancelled services — …`) into a "dismiss"
 * and the map picker's own description ("…until the pin sits on the stop you want") into "pin a
 * stop": both were defects in the instrument, not in the app, and a finding nobody can act on is
 * worse than no finding.
 */
function actionOf(label) {
  const text = label.trim().toLowerCase();
  if (!text || text.length > 40) return `ungrouped: ${label}`;
  for (const [pattern, action] of ACTION_RULES) if (pattern.test(text)) return action;
  return `ungrouped: ${label}`;
}

/* ------------------------------------------------------------------ reading a screen */

/**
 * Every control on the screen, with the two things an inconsistency is made of — what it draws and
 * where it sits.
 *
 * `landmark` is the nearest thing that can hold a control and has a name in the interface: a page
 * head, a card, a panel, a labelled row, the app's bar, the dock, a dialog. `row` is the control's
 * own parent class, which is what makes "*in the top row*" or "*in the footer*" measurable without
 * guessing from pixels: a card's first row and its last row are the two positions a control can
 * occupy, and everything else is the body.
 */
const READ_CONTROLS = () => {
  const LANDMARKS = [
    ['page head', '.page-head'],
    ['card', '.card'],
    ['panel', '.panel'],
    ['dialog', '[role=dialog]'],
    ['app bar', '.app-header__inner'],
    ['dock', '.app-dock'],
    ['sidebar', '.app-sidebar'],
    ['list row', '.list-row'],
    ['field', '.field'],
    /*
     * The app's own field rows, under the two names it gives them: `input-group` wraps a text
     * field with its glyph, `planner-row` is one From/To row of the planner card and of the
     * picker. They are `field` under a different class name, and a control that clears a field
     * belongs to the *field it clears* — that is its place, not the card or the dialog the field
     * happens to sit in. It was the last thing `clear a field` needed: five `×` controls, one
     * glyph, one shape, all trailing, and the report was reading the container they were in.
     */
    ['field row', '.input-group'],
    ['field row', '.planner-row'],
  ];
  const landmarkOf = (el) => {
    let node = el.parentElement;
    while (node && node !== document.body) {
      for (const [name, selector] of LANDMARKS) if (node.matches(selector)) return { name, node };
      node = node.parentElement;
    }
    return { name: 'page', node: document.querySelector('main') ?? document.body };
  };
  const short = (value, limit = 46) => (value.length > limit ? `${value.slice(0, limit - 1)}…` : value);
  const out = [];
  const seen = new Set();
  for (const el of document.querySelectorAll('main button, main a[href], main [role=button], main [role=switch], header.app-header button, header.app-header a[href], .app-dock a[href]')) {
    if (seen.has(el)) continue;
    seen.add(el);
    const box = el.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) continue;
    /* A control inside another control is the outer one's label, not a control of its own. */
    if (el.parentElement?.closest('button, a[href]')) continue;
    const style = getComputedStyle(el);
    const { name: landmark, node: root } = landmarkOf(el);
    const rootBox = root.getBoundingClientRect();
    const middle = rootBox.left + rootBox.width / 2;
    const text = (el.getAttribute('aria-label') ?? el.textContent ?? '').replace(/\s+/g, ' ').trim();
    /* The label an action is recognised by: the accessible name if the control has one (all the
       icon-only ones do), else the first six words — never a whole sentence. */
    const label = (el.getAttribute('aria-label') ?? text.split(' ').slice(0, 6).join(' ')).trim();
    const icons = [...el.querySelectorAll('[data-icon]')].map((icon) => icon.getAttribute('data-icon'));
    /*
     * Which row of the landmark a control sits in: its **first row of content** (`head`), its
     * **last** (`foot`), or the middle of it (`body`) — read off the landmark's own children.
     *
     * This used to be a fraction of the landmark's *box*: the top 28% was the head, the bottom 28%
     * the foot. That proxy broke in exactly the two ways the register's limits named. A control
     * past the landmark's own edge read `foot`, so a list growing by a row moved a control's
     * signature while nothing moved or changed shape (round 16 patched that to `offscreen`). And a
     * row that is the only row of a short panel read `head` on one screen and `foot` in a longer
     * panel of the same kind on another, which is how the same `Network map` pill — 133×44, one
     * glyph, trailing, in the last row of both panels — came out as two places.
     *
     * `offscreen` is gone with the fraction rule: being outside a box is a scroll position, not a
     * place, and the box is still recorded on every instance. A landmark whose content is longer
     * than its box no longer moves a signature when the list in it grows, because a row's place is
     * its order among the landmark's rows, not the pixels it happens to occupy today.
     */
    const row = el.parentElement;
    const rows = [...root.children].filter((child) => child.getBoundingClientRect().height > 1);
    const band = !rows.length || row === root
      ? 'body'
      : row === rows[0]
        ? 'head'
        : row === rows[rows.length - 1]
          ? 'foot'
          : 'body';
    out.push({
      name: text,
      label,
      icons,
      action: null,
      classes: el.className,
      kind: el.getAttribute('aria-label') && !(el.textContent ?? '').trim() ? 'icon only' : 'labelled',
      /* The real box, kept in the JSON so nothing measured is lost (the signature uses the height). */
      box: `${Math.round(box.width)}x${Math.round(box.height)}`,
      pressed: el.getAttribute('aria-pressed'),
      disabled: el.hasAttribute('disabled'),
      landmark,
      row: short(el.parentElement?.className ?? ''),
      /*
       * The side a control is on, in the landmark it sits in: left, right — or no side at all.
       *
       * `centre` and `stretch` are not decoration. A control centred in its landmark used to fall
       * through to `right` because its midpoint landed a fraction of a pixel past the middle: the
       * two lists' "Show 5 more" (centred in the page) were reported as being on the right, and
       * that alone was a finding against the two card-foot ones. A control that *spans* its
       * landmark had no side to report either — a card's odd action takes the whole width by
       * design (`journey-card__actions`), so its midpoint is the landmark's middle, which the same
       * rule read as `right`. Both are the artifact the width-as-shape bug was: reading a
       * coincidence of the box as a decision.
       */
      side: rootBox.width && box.width / rootBox.width >= 0.85
        ? 'stretch'
        : Math.abs(box.left + box.width / 2 - middle) <= Math.max(8, rootBox.width * 0.02)
          ? 'centre'
          : box.left + box.width / 2 < middle
            ? 'left'
            : 'right',
      /* The landmark's first and last rows: where a control is "in the head" or "in the foot". */
      band,
      /*
       * The visible box, not the declared one: a ring can be a border, an outline or a shadow, and
       * the first version of this read only the border — which reported a bare glyph where the
       * screenshots show a circle, because the circle is a shadow on the raised surface.
       */
      /*
       * The signature's first element is the **height**, not the box.
       *
       * A pill's width is what its label says, not how it looks: `Show 5 more` is 132px and
       * `Show 1 more` is 128px, `Plan from here` is 147 and `Plan to here` is 129, and the first
       * version read every one of those as a different shape and reported one control as three.
       * Height, radius, border, fill and the glyph are the identification; the width is the text.
       * The measured box is still recorded on every instance (`box`), so nothing is hidden.
       */
      shape: [
        `h${Math.round(box.height)}`,
        `r${style.borderRadius}`,
        style.borderTopWidth !== '0px' && style.borderTopColor !== 'rgba(0, 0, 0, 0)' ? `border ${style.borderTopColor}` : 'no border',
        style.boxShadow !== 'none' ? `shadow ${style.boxShadow.replace(/\s+/g, ' ').slice(0, 34)}` : 'no shadow',
        style.outlineStyle !== 'none' ? `outline ${style.outlineWidth} ${style.outlineColor}` : 'no outline',
        style.backgroundColor !== 'rgba(0, 0, 0, 0)' ? `fill ${style.backgroundColor}` : 'no fill',
      ].join(' · '),
      glyphSize: el.querySelector('[data-icon]')?.getAttribute('width') ?? '',
    });
  }
  return out;
};

/**
 * The glyphs that are *not* controls: a pin drawn inside a widget row, a marker in a suggestion,
 * the alert triangle in a banner. They are half of the "one glyph, one meaning" question — a
 * glyph can drift by being a control on one screen and a decoration on the next.
 */
const READ_GLYPHS = () => {
  const LANDMARKS = [
    ['page head', '.page-head'], ['card', '.card'], ['panel', '.panel'], ['app bar', '.app-header__inner'],
    ['list row', '.list-row'], ['field', '.field'], ['dialog', '[role=dialog]'],
  ];
  const landmarkOf = (el) => {
    let node = el.parentElement;
    while (node && node !== document.body) {
      for (const [name, selector] of LANDMARKS) if (node.matches(selector)) return name;
      node = node.parentElement;
    }
    return 'page';
  };
  const out = [];
  for (const icon of document.querySelectorAll('main [data-icon]')) {
    if (icon.closest('button, a[href], [role=button], [role=switch]')) continue;
    const box = icon.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) continue;
    out.push({
      glyph: icon.getAttribute('data-icon'),
      size: icon.getAttribute('width') ?? '',
      landmark: landmarkOf(icon),
      row: String(icon.parentElement?.className ?? '').slice(0, 34),
    });
  }
  return out;
};

/* ------------------------------------------------------------------ the walk */

/** A configured browser: pins and a default stop, so the pinned states are on screen too. */
const STORAGE = {
  version: 2,
  theme: 'light',
  language: 'en',
  timeFormat: '24h',
  dateFormat: 'long',
  density: 'comfortable',
  highContrast: false,
  reduceMotion: true,
  defaultTimeMode: 'depart',
  defaultOriginStopId: 'utrecht-centraal',
};

const browser = await chromium.launch({
  chromiumSandbox: false,
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--hide-scrollbars'],
});
const context = await browser.newContext({ viewport: { width: WIDTH, height: 900 }, deviceScaleFactor: 1 });
await context.addInitScript(
  ([settings, pins, widgets]) => {
    window.localStorage.setItem('ov-planner:v1:settings', JSON.stringify(settings));
    window.localStorage.setItem('ov-planner:v1:location-consent', '"denied"');
    /* Two pinned stops, and the widgets that *list* pins put on the home screen. Both halves
       matter to this audit: the widget rows draw a pin that is not a control, and they unpin with
       a labelled button rather than the toggle — which is exactly the kind of drift it looks for. */
    window.localStorage.setItem('ov-planner:v1:favourites', JSON.stringify(pins));
    window.localStorage.setItem('ov-planner:v1:home-widgets', JSON.stringify(widgets));
  },
  [STORAGE, ['haarlem', 'zaandam'], ['planner', 'pinned-stops', 'alerts-at-pins', 'next-departures', 'quick-actions']],
);
const page = await context.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(String(error)));

const instances = [];
const standalone = [];
/** Records a screen's controls and its non-control glyphs. */
const capture = async (screen) => {
  const found = await page.evaluate(READ_CONTROLS);
  for (const control of found) instances.push({ screen, ...control, action: actionOf(control.label) });
  for (const glyph of await page.evaluate(READ_GLYPHS)) standalone.push({ screen, ...glyph });
  return found;
};

const go = async (route) => {
  await page.goto(`${ORIGIN}/#${route}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);
  for (const label of ['Not now', 'No thanks', 'Deny', 'Dismiss', 'Got it']) {
    const button = page.locator('[role=dialog] button, [role=dialog] a').filter({ hasText: new RegExp(label, 'i') });
    if (await button.count()) {
      await button.first().click().catch(() => {});
      break;
    }
  }
  await page.waitForTimeout(200);
};

/* A search first: the results screen, a journey page and the map's own "back to the results" all
   need one, and the planner's own states are reachable from the home screen afterwards. */
await go('/');
await page.locator('.planner-row__btn').first().click();
await page.locator('#picker-from').click();
await page.locator('#picker-from').fill('Haarlem');
await page.waitForTimeout(320);
await page.locator('.picker__list .picker-row:not(.picker-row--action)').first().click();
await page.locator('#picker-to').click();
await page.locator('#picker-to').fill('Gouda');
await page.waitForTimeout(320);
await page.locator('.picker__list .picker-row:not(.picker-row--action)').first().click();
await page.waitForTimeout(1500);
const journeyHref = await page.locator('main a[href*="/journey/"]').first().getAttribute('href');

for (const route of ['/', '/stops', '/stops/haarlem', '/departures', '/disruptions', '/disruptions/d-cancel-schiphol', '/results', journeyHref.replace(/^#/, ''), '/map', '/preferences', '/settings']) {
  await go(route);
  await capture(`${route}`);
}

/* The stop picker: the planner's suggestion rows carry a pin toggle of their own. */
await go('/');
await page.locator('.planner-row__btn').first().click();
await page.waitForTimeout(600);
await capture('the stop picker');
/* …and inside it, the map picker: its sheet names the chosen stop with a pin. */
await page.locator('.picker-row').filter({ hasText: 'Choose on the map' }).first().click();
await page.waitForTimeout(800);
await capture('the map picker');

/* The stop page's own two-choice question, which is where "Plan from here" lives. */
await go('/stops/haarlem');
await page.getByRole('button', { name: /^Plan$/ }).first().click().catch(() => {});
await page.waitForTimeout(500);
await capture('the stop page’s plan dialog');

/* ------------------------------------------------------------------ the report */

const byAction = new Map();
for (const instance of instances) {
  if (!byAction.has(instance.action)) byAction.set(instance.action, []);
  byAction.get(instance.action).push(instance);
}

/**
 * One control's signature: the glyphs it draws, its shape, and its place.
 *
 * The place is the **landmark, the row of it and the side** — and not the class name of the row's
 * parent, which is what it used to be. A class name is not a place: `.input-group`,
 * `.planner-row--to` and `.modal__head` are where a control is built, not where a traveller sees
 * it, and five `×` controls that are identical in every painted respect were reported as five
 * signatures because they were built in five containers. `row` is still measured and is printed
 * beside the signature below, so nothing is lost; it is simply not part of what "the same place"
 * means. Two controls agree when they are in the same kind of landmark, in the same row of it, on
 * the same side of it, drawn the same way.
 */
const signature = (control) =>
  `${control.kind} ${control.icons.join('+') || 'no icon'} · ${control.shape} · ${control.landmark} ${control.band} ${control.side}`;

const SCREENS = new Set(instances.map((i) => i.screen)).size;
const lines = [];
const findings = [];
lines.push(`# Consistency audit — every repeated control and every glyph, ${WIDTH}px`);
lines.push('');
lines.push(`${instances.length} controls and ${standalone.length} non-control glyphs over ${SCREENS} screens.`);
lines.push('');
lines.push('A finding is an action whose instances do not share one signature — the glyphs, the shape');
lines.push('and the place. The standards are W3C COGA (one glyph, one meaning), WCAG 3.2.3 and 3.2.4,');
lines.push('and NN/g heuristic 4; each finding names the clause it breaks.');
lines.push('');
for (const [action, list] of [...byAction].sort((a, b) => b[1].length - a[1].length)) {
  if (action.startsWith('ungrouped:')) continue;
  const groups = new Map();
  for (const instance of list) {
    if (!groups.has(signature(instance))) groups.set(signature(instance), []);
    groups.get(signature(instance)).push(instance);
  }
  lines.push(`## ${action} — ${list.length} instance(s), ${groups.size} signature(s)`);
  lines.push('');
  lines.push('| # | how it looks and where it sits | screen | control |');
  lines.push('|---|--------------------------------|--------|---------|');
  let index = 0;
  for (const [sig, members] of [...groups].sort((a, b) => b[1].length - a[1].length)) {
    index += 1;
    /* The container each instance is built in is printed beside the signature: it is not part of
       what "the same place" means (see `signature`), but a reader judging a finding needs it. */
    const containers = [...new Set(members.map((m) => String(m.row).trim()))].filter(Boolean).join('` / `');
    lines.push(`| ${index} | \`${sig}\`${containers ? ` <br><span class="where">in \`${containers}\`</span>` : ''} | ${[...new Set(members.map((m) => m.screen))].join('<br>')} | ${[...new Set(members.map((m) => JSON.stringify(m.name)))].filter(Boolean).join('<br>')} |`);
  }
  lines.push('');
  if (groups.size > 1) {
    const sameGlyph = new Set(list.map((instance) => instance.icons.join('+'))).size === 1;
    findings.push({ action, signatures: groups.size, instances: list.length, sameGlyph, explained: DELIBERATE.has(action) });
    lines.push(sameGlyph
      ? `**Finding.** One action, one glyph, **${groups.size} different shapes/places** — WCAG 3.2.4 (the same function identified the same way) and NN/g 4 (\`Ensure consistency in the placement of form fields and buttons\`).`
      : `**Finding.** One action, **${new Set(list.map((i) => i.icons.join('+'))).size} different glyphs** and ${groups.size} shapes/places — W3C COGA (one glyph, one meaning), WCAG 3.2.4.`);
    lines.push('');
  }
}

/* ---------------------------------------------------------------- one glyph, one meaning */

const glyphMeanings = new Map();
for (const instance of instances) {
  for (const glyph of instance.icons) {
    if (!glyphMeanings.has(glyph)) glyphMeanings.set(glyph, { actions: new Set(), places: new Set() });
    if (!instance.action.startsWith('ungrouped:')) glyphMeanings.get(glyph).actions.add(instance.action);
  }
}
for (const glyph of standalone) {
  if (!glyphMeanings.has(glyph.glyph)) glyphMeanings.set(glyph.glyph, { actions: new Set(), places: new Set() });
  glyphMeanings.get(glyph.glyph).places.add(`${glyph.landmark} ${glyph.row} @${glyph.size}px`);
}

lines.push('## One glyph, one meaning');
lines.push('');
lines.push('W3C COGA: "Use icons that help the user" — a glyph should carry a single meaning.');
lines.push('Every glyph below is listed with the actions it is a control for and the places it is drawn');
lines.push('as a plain marker. A glyph with more than one action, or one that is both a control and a');
lines.push('marker, is a finding.');
lines.push('');
lines.push('| glyph | is the control for | drawn as a marker in |');
lines.push('|-------|--------------------|----------------------|');
const glyphFindings = [];
for (const [glyph, { actions, places }] of [...glyphMeanings].sort((a, b) => b[1].actions.size - a[1].actions.size)) {
  if (actions.size + (places.size ? 1 : 0) < 2) continue;
  lines.push(`| \`${glyph}\` | ${[...actions].sort().join('<br>') || '—'} | ${[...places].sort().join('<br>') || '—'} |`);
  if (actions.size > 1 || (actions.size === 1 && places.size)) {
    glyphFindings.push({ glyph, actions: [...actions].sort(), markers: [...places].sort() });
  }
}
lines.push('');

/* ------------------------------------------------------- what the gate allows, and what fails */

/**
 * One action, one glyph **per state**. The mechanical half of the rule, and the half `--gate`
 * never exempts: `pin` and `×` for one toggle, `route` and `arrowLeft` for one way back, `sliders`
 * and `settings` for one destination. Grouped by `aria-pressed` so that a shown state is allowed
 * its own drawing — `bookmark` and `check`, `pin` and a filled `pin` — and only same-state
 * disagreement counts.
 */
const glyphDrift = [];
for (const [action, list] of byAction) {
  if (action.startsWith('ungrouped:')) continue;
  const byState = new Map();
  for (const instance of list) {
    const state = instance.pressed ?? 'rest';
    if (!byState.has(state)) byState.set(state, new Set());
    byState.get(state).add(instance.icons.join('+') || 'no icon');
  }
  for (const [state, glyphs] of byState) {
    if (glyphs.size > 1) glyphDrift.push({ action, state, glyphs: [...glyphs] });
  }
}

const unexplained = findings.filter((finding) => !finding.explained);
/*
 * An entry that no longer matches a finding is a standing permission nobody re-read: it would
 * quietly allow the action to drift again. Those are printed rather than left in — with one
 * caveat, which the register itself hit: this audit runs at **two widths**, and whether an action
 * has a finding can flip between them (`keep a search` and `show the network map` each have one at
 * one width and not the other). So an entry not matching *this* width's findings is a hint to
 * check the other run, not an instruction.
 */
const dead = [...DELIBERATE.keys()].filter((action) => !findings.some((finding) => finding.action === action));
lines.push('## Findings the gate allows, and why');
lines.push('');
lines.push('Every line here is a decision on the record. `--gate` fails on a finding that is not');
lines.push('listed, so a new disagreement cannot arrive quietly, and the exemptions below are the only');
lines.push('differences the app is allowed to keep.');
lines.push('');
lines.push('| action | instances | signatures | why the instances disagree |');
lines.push('|---|---|---|---|');
for (const finding of findings.filter((item) => item.explained).sort((a, b) => b.signatures - a.signatures)) {
  lines.push(`| ${finding.action} | ${finding.instances} | ${finding.signatures} | ${DELIBERATE.get(finding.action)} |`);
}
lines.push('');
if (unexplained.length) {
  lines.push('### Unexplained — these fail `--gate`');
  lines.push('');
  for (const finding of unexplained) {
    lines.push(`* **${finding.action}**: ${finding.instances} instance(s), ${finding.signatures} signatures`);
  }
  lines.push('');
}
if (dead.length) {
  lines.push('### In the register but not a finding at this width — check the other width before deleting');
  lines.push('');
  for (const action of dead) lines.push(`* ${action}`);
  lines.push('');
}
if (glyphDrift.length) {
  lines.push('### One action drawn with more than one glyph in one state — these fail `--gate`');
  lines.push('');
  for (const drift of glyphDrift) {
    lines.push(`* **${drift.action}** (${drift.state === 'rest' ? 'at rest' : drift.state}): ${drift.glyphs.join(' / ')}`);
  }
  lines.push('');
}

const fs = await import('node:fs');
fs.writeFileSync('.logs/consistency-audit.md', `${lines.join('\n')}\n`);
fs.writeFileSync('.logs/consistency-audit.json', JSON.stringify({ width: WIDTH, instances, standalone, findings, glyphFindings, glyphDrift, deliberate: Object.fromEntries(DELIBERATE) }, null, 1));

console.log(`${instances.length} controls and ${standalone.length} glyphs over ${SCREENS} screens → .logs/consistency-audit.md`);
for (const finding of findings.sort((a, b) => b.signatures - a.signatures)) {
  console.log(`  place: ${finding.action}: ${finding.instances} instance(s), ${finding.signatures} signatures${finding.explained ? ' (a decision on the record)' : ' — UNEXPLAINED'}`);
}
for (const finding of glyphFindings) {
  console.log(`  glyph: ${finding.glyph} — ${finding.actions.join(' / ') || 'no action'}${finding.markers.length ? ` + ${finding.markers.length} marker place(s)` : ''}`);
}
for (const drift of glyphDrift) {
  console.log(`  DRIFT: ${drift.action} (${drift.state}): ${drift.glyphs.join(' / ')}`);
}
for (const action of dead) console.log(`  register: \`${action}\` is not a finding at this width — check the other width before deleting it`);
if (errors.length) console.log(`page errors: ${errors.length}`);
await browser.close();

/* The gate: one glyph per action per state, and no finding that is not a decision on the record. */
const failures = unexplained.length + glyphDrift.length;
if (GATE) {
  console.log(failures
    ? `${failures} unexplained finding(s) — the app has drifted from the rules in CONSISTENCY-AUDIT.md`
    : `0 unexplained findings: ${findings.length} difference(s), every one of them on the record`);
}
process.exit(GATE && failures ? 1 : 0);
