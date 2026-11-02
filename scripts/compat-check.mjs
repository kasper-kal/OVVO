/**
 * **The old-browser notice, tested in a real browser.**
 *
 * The check in `index.html` exists for one reason: a browser too old to read the bundle draws
 * nothing at all, and a blank page with no explanation is the worst thing this app can show. So it
 * looks at the browser *before* the bundle arrives and shows a plain notice instead.
 *
 * The danger is the other way round: if the check guesses "too old" about a perfectly good browser,
 * it hides a working app. That is what happened to an automated reviewer, whose sandbox refuses
 * `new Function` by policy rather than for want of syntax.
 *
 * The honest way to test that is a **policy**, not a stubbed global: the page is served with a
 * Content-Security-Policy that omits `unsafe-eval`, which is exactly what such a sandbox does. The
 * test first proves eval really is blocked in that page, so it cannot pass by testing nothing.
 *
 *   node scripts/compat-check.mjs                       against the live site
 *   URL=http://127.0.0.1:3000/ node scripts/compat-check.mjs
 *
 * On this machine Chromium needs its system libraries on the loader path:
 *
 *   LD_LIBRARY_PATH=/workspace/homes/d06ec682935a0dae4f349744/libs/usr/lib/x86_64-linux-gnu \
 *     node scripts/compat-check.mjs
 *
 * `scripts/compat-logic-check.mjs` answers the same questions with no browser at all.
 */

import { chromium } from 'playwright';

const SITE = process.env.URL ?? 'https://ovvo.vibecreations.workers.dev/';

/**
 * A policy with no `unsafe-eval`, which is what a locked-down sandbox sends.
 *
 * Everything the page actually needs is allowed, so a failure here can only be about eval.
 */
const NO_EVAL_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  'font-src https://fonts.gstatic.com data:',
  "img-src 'self' data: blob:",
  'connect-src *',
].join('; ');

const launch = () => chromium.launch();

/**
 * Refuse `new Function` **while the page is still being parsed**, then behave normally.
 *
 * That is the window the compatibility check runs in, and stopping at the end of it matters: an
 * earlier version blocked a fixed number of calls, which damaged the app under test rather than the
 * check, so the case "failed" for a reason that had nothing to do with what it was testing. The
 * ready state is the honest boundary between the inline check and the module bundle, which only
 * runs once parsing has finished.
 *
 * `SyntaxError` is the interesting one: it is the error that means an old browser, so a sandbox
 * that uses it to refuse eval is the sandbox this control test exists for.
 */
const refuseEvalText = (errorName) => `
      (function () {
        var real = window.Function;
        window.Function = function () {
          if (document.readyState === 'loading') {
            throw new ${errorName}('blocked by policy');
          }
          return real.apply(null, arguments);
        };
      })();
    `;

/** Serve the site with an eval-free policy, and prove the policy bit. */
async function withNoEvalPolicy(page, url) {
  await page.route('**/*', async (route) => {
    if (route.request().resourceType() !== 'document') {
      await route.continue();
      return;
    }
    const response = await route.fetch();
    const body = await response.text();
    const meta = `<meta http-equiv="Content-Security-Policy" content="${NO_EVAL_CSP}">`;
    /*
     * A probe written **into the document**, so the policy applies to it. Asking the page for the
     * same answer through DevTools would bypass the policy and always say "allowed".
     */
    const probe =
      '<script>window.__ovvoEvalProbe=(function(){try{new Function("return 1");return "allowed";}catch(error){return "blocked";}})();</script>';
    /*
     * The body has been decoded on the way here, so the original encoding and length headers would
     * describe something that is no longer true. Chromium copes with a wrong length and does not
     * cope with a wrong encoding, which is how a policy can look applied and not be.
     */
    const headers = { ...response.headers() };
    delete headers['content-encoding'];
    delete headers['content-length'];
    headers['content-type'] = 'text/html; charset=utf-8';
    await route.fulfill({
      response,
      body: body.replace('</head>', `${meta}${probe}</head>`),
      headers,
    });
  });
  /*
   * **Proof that the policy actually bit, taken from the page rather than from this script.**
   *
   * Asking the page to run `new Function` from here would prove nothing: a DevTools evaluation
   * bypasses the page's policy, so it answers "allowed" on a page where the app's own script was
   * refused. A `securitypolicyviolation` event, on the other hand, is the browser complaining about
   * something the *document* tried to do, which is exactly the question.
   */
  await page.addInitScript(() => {
    window.__cspViolations = [];
    document.addEventListener('securitypolicyviolation', (event) => {
      window.__cspViolations.push(event.violatedDirective || event.effectiveDirective || 'unknown');
    });
  });

  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  return page.evaluate(() => {
    const meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    const probeAnswer = window.__ovvoEvalProbe;
    return {
      policy: meta ? 'served' : 'missing',
      evalState: probeAnswer === 'blocked' ? 'blocked' : probeAnswer ? 'allowed' : 'unproven',
    };
  });
}

async function check(item) {
  const browser = await launch();
  try {
    const page = await browser.newPage();
    let evalState = 'not tested';
    let policy = 'not needed';

    if (item.noEvalPolicy) {
      const measured = await withNoEvalPolicy(page, item.url ?? SITE);
      evalState = measured.evalState;
      policy = measured.policy;
    } else {
      if (item.before) await page.addInitScript({ content: item.before });
      await page.goto(item.url ?? SITE, { waitUntil: 'domcontentloaded' });
    }

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

    return { ...item, mounted, noticeShown, evalState, policy };
  } finally {
    await browser.close();
  }
}

const cases = [
  { name: 'a normal browser', want: { mounted: true, noticeShown: false } },
  {
    name: '?bypass_compat=1',
    url: `${SITE}?bypass_compat=1`,
    want: { mounted: true, noticeShown: false },
  },
  {
    name: 'eval blocked by policy',
    noEvalPolicy: true,
    want: { mounted: true, noticeShown: false, evalState: 'blocked' },
  },
  {
    name: '?debug=1',
    url: `${SITE}?debug=1`,
    want: { mounted: true, noticeShown: false },
  },
  {
    /*
     * A sandbox that refuses eval by throwing a syntax error used to be indistinguishable from an
     * iPad on iOS 10. The control test is what tells them apart: here every eval is refused while
     * the page is parsed, so there is no evidence about syntax and the app must still start.
     */
    name: 'eval refused as syntax error',
    before: refuseEvalText('SyntaxError'),
    want: { mounted: true, noticeShown: false },
  },
  {
    /* The case the notice is for: a browser that evaluates, but cannot parse this syntax. */
    name: 'cannot parse, eval works',
    before: `
      (function () {
        var real = window.Function;
        window.Function = function () {
          var body = arguments[arguments.length - 1];
          if (typeof body === 'string' && (body.indexOf('...') !== -1 || body.indexOf('catch {') !== -1)) {
            throw new SyntaxError('unsupported syntax');
          }
          return real.apply(null, arguments);
        };
      })();
    `,
    want: { mounted: false, noticeShown: true },
  },
];

let failed = 0;
for (const item of cases) {
  const got = await check(item);
  const ok = Object.entries(item.want).every(([key, value]) => got[key] === value);
  if (!ok) failed += 1;
  console.log(
    `${ok ? 'ok  ' : 'FAIL'} ${got.name.padEnd(24)} app ${got.mounted ? 'mounted    ' : 'not mounted'}  notice ${got.noticeShown ? 'shown ' : 'hidden'}  eval ${got.evalState}  policy ${got.policy}`,
  );
}

if (failed > 0) {
  console.error(`\n${failed} case(s) did not do what the page promises.`);
  process.exit(1);
}
console.log('\nEvery case does what the page promises.');
