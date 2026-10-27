#!/usr/bin/env node
/*
 * **The family of faults that keeps happening, checked instead of hoped for.**
 *
 * Every one of these has been reported here, and none of them can be caught by a type checker or a
 * build: nothing throws, the code is valid, the page is simply wrong by a few pixels or a control
 * is behind something. They are all the same question asked in different places:
 *
 *   *does the page fit, is everything on it reachable, and does it start where it should?*
 *
 * So this walks the real screens at real phone widths and asks that question of every interactive
 * control on each one:
 *
 *   1. **No sideways overflow.** The document is never wider than the window, which is the visible
 *      symptom of a row that refused to wrap.
 *   2. **No control is covered.** Every visible button, link and field is hit-tested with
 *      `elementFromPoint` at the end of the page, where the fixed dock and the home-screen offer
 *      float. If something else answers, a thumb would press that instead.
 *   3. **Every screen starts at its top.** A direct load of an address is not a mid-page screen.
 *   4. **Nothing is thrown.** A page error or a console error fails the screen.
 *
 * Run against the dev server, or the live site:
 *
 *   npm run check:layout
 *   LAYOUT_URL=https://ovvo.onrender.com npm run check:layout
 *
 * Widths are the ones that broke here: 320 (the narrowest phone still in use), 390 (a current
 * iPhone) and 412 (a current Android).
 */
import { chromium, prepareBrowserEnv } from './browser-env.mjs';

/* The browser's system libraries and fonts, set here rather than sourced by hand: see
   `browser-env.mjs` for why that step kept being missed. */
prepareBrowserEnv();

const BASE = process.env.LAYOUT_URL ?? 'http://127.0.0.1:3000';
const WIDTHS = [320, 390, 412];
const ROUTES = ['/', '/stops', '/stops/utrecht-centraal', '/departures', '/disruptions', '/map', '/preferences', '/settings'];

let failures = 0;
const fail = (label, detail) => {
  failures += 1;
  console.log(`FAIL  ${label}${detail ? `   [${detail}]` : ''}`);
};

/** Every control a thumb could aim at, with what is actually on top of its middle. */
const probe = () =>
  ({
    /* Read from the page, not from the DOM in Node. */
  });
void probe;

const inspect = (page) =>
  page.evaluate(() => {
    const insideOverlay = (node) => Boolean(node.closest('[role="dialog"], .overlay, .fullscreen'));
    const controls = [...document.querySelectorAll('button, a[href], input, select, textarea, [tabindex="0"]')]
      .filter((node) => !insideOverlay(node))
      .filter((node) => {
        if (node.closest('.skip-link')) return false;
        /*
         * Closed disclosure content is laid out but not drawn: "All 54 stops on this map" is a
         * `<details>` with fifty-four links inside it, and Chrome keeps their boxes so it can
         * open the panel instantly. They have a position on the screen, they are invisible, and
         * nothing can be pressed there — so they were reported as unreachable controls on the map
         * screen at every width. `checkVisibility` is the browser's own answer to "is this drawn".
         */
        if (node.closest('details:not([open])')) return false;
        if (typeof node.checkVisibility === 'function' && !node.checkVisibility()) return false;
        const rect = node.getBoundingClientRect();
        if (rect.width < 1 || rect.height < 1) return false;
        const style = getComputedStyle(node);
        if (style.visibility === 'hidden' || style.display === 'none' || Number(style.opacity) === 0) return false;
        return true;
      });

    const covered = [];
    for (const node of controls) {
      const rect = node.getBoundingClientRect();
      /*
       * The middle of the control, and only if that middle is actually on the screen.
       *
       * This used to be clamped into the viewport, which turned every control the scroll had
       * carried off the top into one with a centre at y=1 — under the sticky header, every time.
       * The first run of this audit reported 493 failures and almost all of them were that: the
       * header "covering" a button that was simply not on the screen any more. A control whose
       * centre is outside the window cannot be pressed at that point because there is no such
       * point, so it is not evidence of anything.
       */
      const x = rect.x + rect.width / 2;
      const y = rect.y + rect.height / 2;
      if (x < 0 || y < 0 || x > window.innerWidth || y > window.innerHeight) continue;
      const top = document.elementFromPoint(x, y);
      if (!top) continue;
      if (node === top || node.contains(top)) continue;
      /* A label wrapping its own field, or a hit area that is a child of the control. */
      if (top.contains(node)) continue;

      /*
       * **Floating chrome is not a defect; unreachable content is.**
       *
       * A sticky header and the floating dock always have the page passing underneath them — that
       * is what sticky means, and reporting it turned this audit into 493 lines nobody could act
       * on. What matters is whether the traveller can get to the control anyway: scroll a little
       * and anything under the header comes out. The one arrangement that cannot be escaped is a
       * control under the *bottom* chrome while the page is already scrolled as far as it goes,
       * because from there the only scrolling left moves it further behind. That is the failure,
       * and it is what a missing bottom padding looks like.
       */
      const floating = (() => {
        for (let each = top; each && each !== document.documentElement; each = each.parentElement) {
          const position = getComputedStyle(each).position;
          if (position === 'fixed' || position === 'sticky') return each;
        }
        return null;
      })();
      /*
       * And "scrolled as far as it goes" is a question about every scroller the control sits in,
       * not just the page. The map screen does not scroll at all: the map and its stop list fill
       * the phone, and the list has its own scrollbar, so the page being at its end says nothing
       * about whether that link can be brought up the screen. A panel with room left is not a
       * failure, and this is the line that tells the two apart.
       */
      const stillScrollable = (() => {
        for (let each = node.parentElement; each && each !== document.documentElement; each = each.parentElement) {
          const style = getComputedStyle(each);
          if (!/(auto|scroll)/.test(style.overflowY)) continue;
          if (each.scrollHeight - each.clientHeight - each.scrollTop > 2) return true;
        }
        return false;
      })();
      const atBottom =
        Math.ceil(scrollY + innerHeight) >= document.documentElement.scrollHeight - 2 && !stillScrollable;
      const bottomChrome = floating && floating.getBoundingClientRect().top > innerHeight / 2;
      if (floating && !(atBottom && bottomChrome)) continue;

      covered.push({
        control:
          (node.getAttribute('aria-label') ?? node.textContent ?? node.tagName).replace(/\s+/g, ' ').trim().slice(0, 40),
        top: `${top.tagName.toLowerCase()}.${(top.className || '').toString().split(' ')[0]}`,
        floating: floating ? `${floating.tagName.toLowerCase()}.${(floating.className || '').toString().split(' ')[0]}` : 'page content',
        y: Math.round(y),
      });
    }

    return {
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      scrollY: Math.round(window.scrollY),
      covered,
      controls: controls.length,
    };
  });

const browser = await chromium.launch();

for (const width of WIDTHS) {
  const context = await browser.newContext({ viewport: { width, height: 720 }, hasTouch: true });
  await context.addInitScript(() =>
    localStorage.setItem('ov-planner:v1:location-consent', JSON.stringify('denied')),
  );
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error).slice(0, 120)));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text().slice(0, 120));
  });

  for (const route of ROUTES) {
    const label = `${width}px ${route}`;
    const before = failures;
    await page.goto(`${BASE}${route}`, { waitUntil: 'load' });
    await page.waitForTimeout(700);

    const top = await inspect(page);
    if (top.scrollY !== 0) fail(`${label}: does not start at its top`, `scrollY ${top.scrollY}`);
    if (top.overflow > 1) fail(`${label}: is wider than the window`, `${top.overflow}px`);
    if (top.controls === 0) fail(`${label}: no controls found, the check would pass by doing nothing`);

    /* The end of the page is where a fixed bar can sit on top of the last thing. */
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(400);
    const bottom = await inspect(page);
    for (const item of bottom.covered) {
      fail(
        `${label}: "${item.control}" cannot be reached`,
        item.floating === 'page content'
          ? `spot: ${item.top} sits over it at y ${item.y}`
          : `the page is scrolled to its end and ${item.floating} still covers it at y ${item.y} — missing bottom space`,
      );
    }

    if (errors.length) {
      fail(`${label}: errors in the console`, errors.slice(0, 2).join(' | '));
      errors.length = 0;
    }

    /* Named, so a run that passed 24 screens looks like one. */
    if (failures === before) console.log(`ok    ${label}`);
  }

  await context.close();
}

await browser.close();
console.log(`\n${failures} failure(s).`);
process.exit(failures ? 1 : 0);
