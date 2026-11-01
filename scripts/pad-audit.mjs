/**
 * **A control's own furniture must not sit against its frame.**
 *
 * Three faults, all of them the same shape: something that belongs to a control was drawn with no
 * room around it.
 *
 *   1. **No lane for the platform's picker.** A `date`, `time` or `datetime-local` input carries a
 *      glyph the browser paints at its right end. If the field's right padding is the shared 12px,
 *      that glyph is drawn inside the field's own rounded corner and reads as a mark sliding off
 *      the edge. The lane is a measurement, not a taste: 24px is the least that gives the glyph
 *      its own strip.
 *   2. **A glyph in the corner.** Any icon inside a framed control (card, button, pill, row, field)
 *      whose outer edge is closer than 8px to that control's inner edge has been squeezed there.
 *   3. **Text against the frame.** Ink closer than 6px to the inside of a bordered box reads as
 *      touching the wall. The measured edge is the text's own ink, found with a Range over the text
 *      node, so a line-height's shoulder is not counted as padding that is not there.
 *
 * Text inside a nested control is measured against the innermost frame it sits in, so a pill inside
 * a card is judged by the pill and not twice.
 *
 * Run:   node scripts/pad-audit.mjs [origin]
 * Needs: playwright + a dev server on :3000.
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
  '/developer',
  '/map',
];

const SETTINGS = {
  version: 10,
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
  developerMode: true,
};

const COLLECT = () => {
  const FRAMES = '.card, .input, .select, .textarea, .btn, .pill, .banner, .nav-item, .list-row, .segmented';
  const visible = (el) => {
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 1 && rect.height > 1 && rect.bottom > 0 && rect.top < window.innerHeight * 3;
  };
  const describe = (el) =>
    el.tagName.toLowerCase() +
    (typeof el.className === 'string' && el.className.trim()
      ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.')
      : '');
  const inner = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return {
      left: r.left + parseFloat(s.borderLeftWidth || '0'),
      right: r.right - parseFloat(s.borderRightWidth || '0'),
      top: r.top + parseFloat(s.borderTopWidth || '0'),
      bottom: r.bottom - parseFloat(s.borderBottomWidth || '0'),
    };
  };
  const out = [];

  /* 1. The lane the platform's own picker glyph needs. */
  const PICKERS = 'input[type="date"], input[type="time"], input[type="datetime-local"], input[type="month"], input[type="week"]';
  for (const input of document.querySelectorAll(PICKERS)) {
    if (!visible(input)) continue;
    /* The results screen's day and time fields hide the platform glyph on purpose and draw the
       app's own mark in its place, so the platform's lane is not what they are missing. */
    if (input.closest('.when-field__field')) continue;
    const pad = parseFloat(getComputedStyle(input).paddingRight || '0');
    if (pad < 24) {
      out.push({ kind: 'picker-lane', where: describe(input), detail: `right padding ${Math.round(pad)}px` });
    }
  }

  /*
   * A tag (`span.pill`) is sized by its word and is deliberately snug: 4px either side is the
   * shape of a tag, and measuring it as a container would report every pill in the app forever.
   */
  const isTag = (el) => el.classList.contains('pill');
  /*
   * Two frames this check cannot speak for:
   *   • a tag, sized by its word (above);
   *   • the map card, which is a window over a panned drawing. Its names are placed at map
   *     coordinates, so their rects sit wherever the drawing puts them, not inside the card.
   * A text node that the box clamps (`-webkit-line-clamp`) is laid out at full length and painted
   * only in part, so its range rect is longer than what is on screen and is not measured either.
   */
  const isCanvas = (el) => el.closest('.map-card') !== null;
  const isClamped = (el) => {
    for (let node = el; node; node = node.parentElement) {
      if (getComputedStyle(node).webkitLineClamp && getComputedStyle(node).webkitLineClamp !== 'none') {
        return true;
      }
    }
    return false;
  };

  /*
   * **A header pill and a card are the same frame.** They stand in the same corner of a phone screen,
   * so one colour and one weight between them is the only reading that looks deliberate: a pill in a
   * second outline was reported. The comparison is the point of the check; the values never are.
   */
  const pill = document.querySelector('.app-header__pill');
  const firstCard = document.querySelector('.card');
  if (pill && firstCard && visible(pill) && visible(firstCard)) {
    const p = getComputedStyle(pill);
    const c = getComputedStyle(firstCard);
    if (p.borderTopColor !== c.borderTopColor || p.borderTopWidth !== c.borderTopWidth) {
      out.push({
        kind: 'pill-mismatch',
        where: describe(pill),
        detail: `${p.borderTopWidth} ${p.borderTopColor} against a card's ${c.borderTopWidth} ${c.borderTopColor}`,
      });
    }
  }

  for (const frame of document.querySelectorAll(FRAMES)) {
    if (!visible(frame)) continue;
    if (isTag(frame) || isCanvas(frame)) continue;
    const box = inner(frame);

    /* 2. A glyph pushed into the frame's corner. */
    for (const svg of frame.querySelectorAll('svg')) {
      if (!visible(svg)) continue;
      const r = svg.getBoundingClientRect();
      const gaps = [box.right - r.right, r.left - box.left, r.top - box.top, box.bottom - r.bottom];
      const smallest = Math.min(...gaps);
      if (smallest >= 0 && smallest < 8) {
        out.push({
          kind: 'glyph-close',
          where: describe(frame),
          detail: `${Math.round(smallest)}px from the inner edge`,
        });
      }
    }

    /* 3. Ink against the frame, measured on the text itself. */
    const walker = document.createTreeWalker(frame, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (!node.textContent || !node.textContent.trim()) continue;
      const parent = node.parentElement;
      if (!parent || !visible(parent)) continue;
      /* A name painted into an SVG is a drawing, not type in a box. */
      if (parent.closest('svg')) continue;
      if (isClamped(parent)) continue;
      if (parent.closest(FRAMES) !== frame) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      const r = range.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      range.detach?.();
      const gaps = [r.left - box.left, box.right - r.right, r.top - box.top, box.bottom - r.bottom];
      const smallest = Math.min(...gaps);
      if (smallest < 6) {
        out.push({
          kind: 'ink-close',
          where: describe(frame),
          detail: `${Math.round(smallest)}px, “${node.textContent.trim().slice(0, 40)}”`,
        });
      }
    }
  }
  return out;
};

const browser = await chromium.launch({
  chromiumSandbox: false,
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--hide-scrollbars'],
});
const findings = [];

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
      const today = new Date().toISOString().slice(0, 10);
      set('recent-searches', [
        {
          id: 'probe',
          at: Date.now(),
          query: { fromStopId: 'utrecht-centraal', toStopId: 'amsterdam-centraal', date: today, time: 600, timeMode: 'depart' },
        },
      ]);
    },
    [SETTINGS],
  );
  const page = await context.newPage();
  for (const route of ROUTES) {
    await page.goto(`${ORIGIN}${route}`, { waitUntil: 'networkidle' });
    await ensureAppFont(page);
    await page.waitForTimeout(250);
    const rows = await page.evaluate(COLLECT);
    for (const row of rows) findings.push({ route, width, ...row });
  }
  await context.close();
}
await browser.close();

const groups = new Map();
for (const row of findings) {
  const key = `${row.kind} — ${row.where}`;
  if (!groups.has(key)) groups.set(key, new Map());
  const byRoute = groups.get(key);
  const routeKey = `${row.route} @${row.width}: ${row.detail}`;
  byRoute.set(routeKey, (byRoute.get(routeKey) ?? 0) + 1);
}

console.log(`\n${ROUTES.length} routes × ${WIDTHS.length} widths, ${findings.length} finding(s)`);
for (const [key, routes] of [...groups].sort()) {
  console.log(`\n  ${key}`);
  for (const [route, count] of [...routes].sort()) console.log(`    ${route}${count > 1 ? ` ×${count}` : ''}`);
}
if (findings.length) {
  console.log('\nFAIL — something is drawn against a frame.');
  process.exit(1);
}
console.log('\nOK — every framed control has room for its furniture.');
