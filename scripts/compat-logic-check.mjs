/**
 * **The old-browser notice, tested without a browser at all.**
 *
 * The check in `index.html` decides whether to show that notice before the app's own bundle is
 * anywhere near running. Getting it wrong in one direction shows a blank page to an old phone;
 * getting it wrong in the other hides a perfectly good app from an automated runner, a locked-down
 * webview, or anything else whose sandbox refuses `new Function`.
 *
 * This reads the **real script out of `index.html`** and runs it against five environments, with
 * only the handful of browser objects it touches stubbed. No Chromium, no network, nothing to
 * install: it runs anywhere Node runs, which is the point, because the environment that broke was
 * not one this machine can open.
 *
 *   node scripts/compat-logic-check.mjs
 *
 * `scripts/compat-check.mjs` does the same four answers in a browser when one is available; this
 * is the version that always is.
 */

import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

/* The check is the inline script that mentions the bypass flag. */
const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
  .map((match) => match[1])
  .find((body) => body.includes('bypass_compat'));

if (!script) {
  console.error('Could not find the compatibility check in index.html.');
  process.exit(1);
}

/**
 * Run the page's own script once, in a world that behaves like one of the five.
 *
 * Everything the script touches is here and nothing else: `window.location.search`, the two
 * elements by id, `HTMLScriptElement`, and `Function`.
 */
function run({ search = '', FunctionImpl, hasModules = true }) {
  const notice = { style: { display: 'none' } };
  let splashRemoved = false;

  const context = vm.createContext({
    window: { location: { search } },
    document: {
      getElementById(id) {
        if (id === 'too-old') return notice;
        if (id === 'splash') return { parentNode: { removeChild: () => (splashRemoved = true) } };
        return null;
      },
    },
    HTMLScriptElement: { prototype: hasModules ? { noModule: true } : {} },
    Function: FunctionImpl,
  });

  vm.runInContext(script, context, { timeout: 2000 });

  return { noticeShown: notice.style.display !== 'none', splashRemoved };
}

/*
 * A `Function` that refuses the way a policy would. Written as an explicit if, because
 * `throw new name === 'SyntaxError' ? ...` compares a constructed object with a string (operator
 * precedence), so the first version of this threw the wrong error and quietly tested nothing.
 */
const blocked = (name) =>
  function BlockedFunction() {
    if (name === 'SyntaxError') throw new SyntaxError('blocked');
    throw new EvalError('blocked');
  };

const cases = [
  {
    name: 'a normal browser',
    world: {},
    want: { noticeShown: false, splashRemoved: false },
  },
  {
    name: '?bypass_compat=1',
    world: { search: '?bypass_compat=1' },
    want: { noticeShown: false, splashRemoved: false },
  },
  {
    name: '?compat=off',
    world: { search: '?compat=off&utm=x' },
    want: { noticeShown: false, splashRemoved: false },
  },
  {
    name: 'eval blocked by policy',
    world: { FunctionImpl: blocked('EvalError') },
    want: { noticeShown: false, splashRemoved: false },
  },
  {
    name: 'no module support',
    world: { hasModules: false },
    want: { noticeShown: true, splashRemoved: true },
  },
  {
    name: 'syntax it cannot parse',
    world: { FunctionImpl: blocked('SyntaxError') },
    want: { noticeShown: true, splashRemoved: true },
  },
];

let failed = 0;
for (const item of cases) {
  const got = run(item.world);
  const ok =
    got.noticeShown === item.want.noticeShown && got.splashRemoved === item.want.splashRemoved;
  if (!ok) failed += 1;
  console.log(
    `${ok ? 'ok  ' : 'FAIL'} ${item.name.padEnd(24)} notice ${got.noticeShown ? 'shown ' : 'hidden'}  splash ${got.splashRemoved ? 'removed' : 'kept   '}`,
  );
}

if (failed > 0) {
  console.error(`\n${failed} case(s) did not do what the page promises.`);
  process.exit(1);
}
console.log('\nEvery case does what the page promises.');
