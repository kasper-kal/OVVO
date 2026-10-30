/**
 * **The browser every check needs, on a machine that has no browser libraries.**
 *
 * Two things go wrong on a fresh sandbox, and both of them read like a test failure:
 *
 *   1. Chromium exits 127 with `libnspr4.so: cannot open shared object file`, because a restored
 *      container has none of the system libraries a browser wants and no root to install them;
 *   2. it then dies on its first repaint without fontconfig (`SkFontMgr_FontConfigInterface.cpp:163
 *      Not implemented`), because there is no `/etc/fonts` either.
 *
 * `scripts/browser-env.sh` solves both by unpacking the .debs into `$HOME/syslibs`. What it cannot
 * do is export them into a process that has already started, so every check here went wrong until
 * somebody remembered to source it first — which is exactly the kind of step that gets skipped and
 * then blamed on the site. This module does it from inside Node instead, before Playwright spawns
 * anything, so `node scripts/…` works on its own.
 *
 * Import this instead of `playwright` directly:
 *
 *   import { chromium, prepareBrowserEnv } from './browser-env.mjs';
 *   prepareBrowserEnv();
 *   const browser = await chromium.launch();
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

/*
 * **First, before `playwright` is imported below.** Playwright fixes which folder it looks in when
 * its module loads, so the variable has to be set by a module that runs before that import — doing
 * it inside `prepareBrowserEnv()` was too late, which is why the browser was still reported missing
 * with the fix in place. See `browser-path.mjs`.
 */
import './browser-path.mjs';

export { chromium, firefox, webkit, devices } from 'playwright';

const HOME = process.env.HOME ?? '';

/**
 * Point the browser at the unpacked libraries, if this machine needed them.
 *
 * A machine with a normal set of system libraries is left alone: nothing is set when `$HOME/syslibs`
 * is not there, because `LD_LIBRARY_PATH` over a working system is its own way to break a browser.
 */
export function prepareBrowserEnv() {
  if (!HOME) return false;

  const syslibs = path.join(HOME, 'syslibs');
  if (!fs.existsSync(path.join(syslibs, 'usr/lib/x86_64-linux-gnu'))) return false;

  const libPath = [path.join(syslibs, 'usr/lib/x86_64-linux-gnu'), path.join(syslibs, 'lib/x86_64-linux-gnu')]
    .filter((dir) => fs.existsSync(dir))
    .join(':');
  const existing = process.env.LD_LIBRARY_PATH;
  process.env.LD_LIBRARY_PATH = existing ? `${libPath}:${existing}` : libPath;

  const fonts = path.join(syslibs, 'fonts.conf');
  if (fs.existsSync(fonts)) process.env.FONTCONFIG_FILE = fonts;

  return true;
}

/**
 * Is Playwright's browser actually installed here?
 *
 * Not the same question as "is playwright in node_modules": a restored workspace keeps the package
 * and loses `$HOME/.cache/ms-playwright`, and the error that follows is eight lines about a path
 * that does not exist. One line here is better.
 */
export function browserIsInstalled() {
  try {
    const require = createRequire(import.meta.url);
    const { registry } = require('playwright-core/lib/server/registry');
    return Boolean(registry.findExecutable('chromium')?.executablePath());
  } catch {
    return fs.existsSync(path.join(HOME, '.cache', 'ms-playwright'));
  }
}

/** The sentence to print when it is not, rather than a stack trace. */
export const MISSING_BROWSER_HELP = [
  'This check needs a browser on this machine, and there is not one:',
  '',
  '  npx playwright install chromium --with-deps   # or, without root:',
  '  npx playwright install chromium && bash scripts/browser-env.sh',
  '',
  '(`browser-env.sh` unpacks the system libraries into $HOME/syslibs and the browser finds them',
  'through this module, so nothing has to be sourced by hand.)',
].join('\n');
