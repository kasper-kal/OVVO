/**
 * **The old-browser notice, tested in a real browser instead of argued about.**
 *
 * The check in `index.html` exists for one reason: a browser too old to read the bundle draws
 * nothing at all, and a blank page with no explanation is the worst thing this app can show. So it
 * looks at the browser *before* the bundle arrives and shows a plain notice instead.
 *
 * The danger is the other way round: if the check ever guesses "too old" about a perfectly good
 * browser, it hides a working app. That is exactly what happened in an automated runner, where eval
 * is blocked by policy rather than absent, and the check could not tell the difference.
 *
 * This proves the four answers in Chromium:
 *
 *   1. a normal browser                     → app mounts, notice hidden
 *   2. `?bypass_compat=1`                   → app mounts, notice never looked at
 *   3. eval blocked by policy (EvalError)   → inconclusive, so app mounts, notice hidden
 *   4. syntax it cannot parse (SyntaxError) → notice shown, which is the case it is for
 *
 *   node scripts/compat-check.mjs                       against the live site
 *   URL=http://127.0.0.1:3000/ node scripts/compat-check.mjs
 */

import { chromium } from 'playwright';

const SITE = process.env.URL ?? 'https://ovvo.vibecreations.workers.dev/';

/**
 * Block the first two `new Function` calls with a chosen error, then behave normally.
 *
 * Two, because the check makes two: object spread and the nameless catch. Only the first calls are
 * faked so the app itself is untouched — if it happened to use `Function` later, it still could.
 *
 * Written as **text rather than a function**, because it has to run inside the browser before the
 * page's own scripts do. A function handed to Playwright loses everything around it, which is how
 * a test can end up silently testing nothing.
 */
const blockEval = (errorName) => `
      (function () {
        var real = window.Function;
        var remaining = 2;
        window.Function = function () {
          if (remaining > 0) {
            remaining -= 1;
            throw new ${errorName}('blocked by policy');
          }
          return real.apply(null, arguments);
        };
      })();
    `;

async function check(name, { url = SITE, before } = {}) {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    if (before) await page.addInitScript({ content: before });
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    let mounted = true;
    try {
      await page.waitForSelector('#root > *', { timeout: 20000 });
    } catch {
      mounted = false;
    }

    const noticeShown = await page.evaluate(() => {
      const notice = document.getElementById('too-old');
      if (!notice) return false;
      return getComputedStyle(notice).display !== 'none';
    });

    return { name, mounted, noticeShown };
  } finally {
    await browser.close();
  }
}

const cases = [
  {
    name: 'a normal browser',
    options: {},
    want: { mounted: true, noticeShown: false },
  },
  {
    name: '?bypass_compat=1',
    options: { url: `${SITE}${SITE.includes('?') ? '&' : '?'}bypass_compat=1` },
    want: { mounted: true, noticeShown: false },
  },
  {
    name: 'eval blocked by policy',
    options: { before: blockEval('EvalError') },
    want: { mounted: true, noticeShown: false },
  },
  {
    name: 'syntax it cannot parse',
    options: { before: blockEval('SyntaxError') },
    want: { mounted: false, noticeShown: true },
  },
];

const results = [];
for (const item of cases) {
  const result = await check(item.name, item.options);
  const ok = result.mounted === item.want.mounted && result.noticeShown === item.want.noticeShown;
  results.push({ ...result, ok });
  console.log(
    `${ok ? 'ok  ' : 'FAIL'} ${result.name.padEnd(26)} app ${result.mounted ? 'mounted' : 'not mounted'.padEnd(11)}  notice ${result.noticeShown ? 'shown' : 'hidden'}`,
  );
}

if (results.some((result) => !result.ok)) {
  console.log('\nThe notice and the app disagree with what the page promises.');
  process.exit(1);
}
console.log('\nAll four answers are the ones the page promises.');
