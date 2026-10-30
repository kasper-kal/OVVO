/**
 * **Where the browser actually is.**
 *
 * Playwright decides which folder to look in when its module loads, so an environment variable set
 * afterwards has no effect: it still names the file it would have used. On this host the browsers
 * live in `$HOME/pw-browsers` and Playwright's default is `$HOME/.cache/ms-playwright`, so this
 * module is imported **first** by `browser-env.mjs`, before `playwright` is, and sets the variable
 * while it still matters.
 *
 * A machine with a normal install is left alone: when the default folder has something in it,
 * nothing is set, because a stray `PLAYWRIGHT_BROWSERS_PATH` over a working install is its own way
 * to break a browser.
 */
import fs from 'node:fs';
import path from 'node:path';

const HOME = process.env.HOME ?? '';

if (HOME && !process.env.PLAYWRIGHT_BROWSERS_PATH) {
  const bundled = path.join(HOME, 'pw-browsers');
  const conventional = path.join(HOME, '.cache', 'ms-playwright');
  if (fs.existsSync(bundled) && !fs.existsSync(conventional)) {
    process.env.PLAYWRIGHT_BROWSERS_PATH = bundled;
  }
}
