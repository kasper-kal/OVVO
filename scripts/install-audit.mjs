#!/usr/bin/env node
/*
 * **Is the app actually installable, right now, on this build?**
 *
 * This exists because of the one failure that cannot be seen from inside the site: Chrome reads the
 * manifest and its icons on its own, decides for itself whether the app can be installed, and says
 * nothing on the page when the answer is no. The traveller finds out in Chrome's own menu, where
 * Installeren is greyed out and says "Deze app kan niet worden geïnstalleerd" — and every fix that
 * follows is a guess about a decision the browser never explained.
 *
 * So ask the browser. Chromium exposes that decision over DevTools: `Page.getAppManifest` returns
 * what it read and every complaint about it, and `Page.getInstallabilityErrors` returns the list
 * that greys out that button. Empty on both means the app can be installed; anything else is the
 * reason, in Chrome's own words, before it is a screenshot from a phone.
 *
 * What is checked:
 *
 *   1. the manifest address answers with JSON (not the site's page — a catch-all host does that),
 *   2. what it contains is complete: name, a short name, start_url, scope, a standalone display,
 *      and a 192 and a 512 icon,
 *   3. those icon files really are PNGs of the size they claim,
 *   4. the service worker registers, activates, and ends up in control of the page,
 *   5. Chrome reports no manifest errors and no installability errors,
 *   6. on a healthy host the page keeps the site's own manifest — the rebuilt `blob:` copy in
 *      `lib/manifest` is the rescue, and a rescue that fires every time would install as a Chrome
 *      shortcut rather than an app,
 *   7. and when the manifest address *is* answered with the site's page, the rescue still produces
 *      something Chrome will install.
 *
 * Run it against a built app (the service worker is registered in the build only):
 *
 *   npm run build && npx vite preview --port 4180 &
 *   node scripts/install-audit.mjs http://127.0.0.1:4180
 *
 * or let `npm run verify` do both. LAYOUT-style override: `INSTALL_URL=… node scripts/…`
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, prepareBrowserEnv } from './browser-env.mjs';

const BASE = (process.argv.find((arg) => arg.startsWith('http')) ?? process.env.INSTALL_URL ?? 'http://127.0.0.1:4180').replace(/\/$/, '');
const MANIFEST_URL = '/manifest.json?v=2';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

let failures = 0;
const fail = (label, detail) => {
  failures += 1;
  console.log(`FAIL  ${label}${detail ? `\n      ${detail}` : ''}`);
};
const pass = (label, detail) => console.log(`ok    ${label}${detail ? `   (${detail})` : ''}`);

/** Width and height out of a PNG's IHDR, so a file that lies about its size is caught. */
function pngSize(buffer) {
  if (buffer.length < 24 || buffer.readUInt32BE(12) !== 0x49484452) return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

async function get(url) {
  const response = await fetch(url, { headers: { 'cache-control': 'no-cache' } });
  return { response, body: Buffer.from(await response.arrayBuffer()) };
}

/* ---------------------------------------------------------------- the files */

const REQUIRED = ['name', 'short_name', 'start_url', 'scope', 'display', 'background_color', 'theme_color'];

let manifest = null;
try {
  const { response, body } = await get(`${BASE}${MANIFEST_URL}`);
  if (!response.ok) fail('the manifest address does not answer', `${MANIFEST_URL} → HTTP ${response.status}`);
  else {
    try {
      manifest = JSON.parse(body.toString('utf8'));
      pass('the manifest address answers with JSON', `${body.length} bytes`);
    } catch {
      fail(
        'the manifest address does not answer with JSON',
        `it answered ${JSON.stringify(body.toString('utf8').slice(0, 80))}… — a host that answers every path with the site's page does this`,
      );
    }
  }
} catch (error) {
  fail('the manifest could not be fetched', error.message);
}

if (manifest) {
  const missing = REQUIRED.filter((field) => manifest[field] === undefined || manifest[field] === '');
  if (missing.length) fail('the manifest is missing fields Chrome needs', missing.join(', '));
  else pass('the manifest has every field Chrome needs', REQUIRED.join(', '));

  if (!['standalone', 'fullscreen', 'minimal-ui'].includes(manifest.display)) {
    fail('the display mode does not install as an app', `display: ${String(manifest.display)} — "browser" is a bookmark, not an app`);
  }

  const icons = Array.isArray(manifest.icons) ? manifest.icons : [];
  const sizes = icons.map((icon) => String(icon.sizes));
  for (const wanted of ['192x192', '512x512']) {
    if (!sizes.includes(wanted)) fail(`the manifest has no ${wanted} icon`, `it lists ${sizes.join(', ') || 'none'}`);
    else pass(`the manifest has a ${wanted} icon`);
  }

  for (const icon of icons) {
    if (!icon.src || String(icon.src).startsWith('data:')) continue;
    try {
      const { response, body } = await get(new URL(icon.src, BASE).href);
      if (!response.ok) {
        fail(`the icon ${icon.src} does not download`, `HTTP ${response.status}`);
        continue;
      }
      const size = pngSize(body);
      const claimed = String(icon.sizes ?? '');
      if (!size) fail(`the icon ${icon.src} is not a PNG`, 'Chrome will not draw it, so it does not count as an icon');
      else if (!claimed.split(' ').includes(`${size.width}x${size.height}`)) {
        fail(`the icon ${icon.src} is not the size it claims`, `the file is ${size.width}x${size.height}, the manifest says ${claimed}`);
      } else pass(`the icon ${icon.src} is a real ${size.width}x${size.height} PNG`, `${body.length} bytes`);
    } catch (error) {
      fail(`the icon ${icon.src} could not be fetched`, error.message);
    }
  }
}

/* The built app's own copy of these files, so a host problem cannot hide a source problem. */
for (const file of ['dist/manifest.json', 'dist/sw.js', 'dist/icons/icon-192.png', 'dist/icons/icon-512.png']) {
  if (!fs.existsSync(path.join(ROOT, file))) fail(`the build did not produce ${file}`, 'run npm run build first');
}

/* ------------------------------------------------------------- the browser */

prepareBrowserEnv();
const browser = await chromium.launch({ args: ['--no-sandbox'] });

/** Chrome's own verdict on whatever this page is. */
async function verdict(page, context) {
  const cdp = await context.newCDPSession(page);
  await cdp.send('Page.enable');
  const appManifest = await cdp.send('Page.getAppManifest');
  let installability = { installabilityErrors: [] };
  try {
    installability = await cdp.send('Page.getInstallabilityErrors');
  } catch (error) {
    fail('this browser cannot report installability errors', error.message);
  }
  return { appManifest, errors: installability.installabilityErrors ?? [] };
}

try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.goto(`${BASE}/`, { waitUntil: 'load' });
  /* The worker installs in the background; a controlled page is what Chrome wants to see. */
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), null, { timeout: 20000 }).catch(() => {});

  const state = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    return {
      manifestLink: document.querySelector('link[rel="manifest"]')?.getAttribute('href') ?? null,
      scope: registration?.scope ?? null,
      workerState: registration?.active?.state ?? null,
      controlled: Boolean(navigator.serviceWorker.controller),
    };
  });

  if (!state.manifestLink) fail('the page does not link a manifest', 'nothing on the page declares itself an app');
  else if (state.manifestLink.startsWith('blob:')) {
    fail(
      'the page replaced the site\'s own manifest with a rebuilt copy',
      'the file was not readable, so Chrome is installing a shortcut rather than the app',
    );
  } else pass('the page links the site\'s own manifest', state.manifestLink);

  if (!state.scope) fail('no service worker is registered', 'Chrome will not offer the install prompt without one');
  else if (state.workerState !== 'activated') fail('the service worker never activated', `state: ${state.workerState}`);
  else pass('the service worker is registered and activated', state.scope);

  if (!state.controlled) fail('the service worker does not control the page', 'a hard reload usually fixes it; an unhandled error in it is the other cause');

  const healthy = await verdict(page, context);
  if (healthy.appManifest.errors.length) {
    fail('Chrome complains about the manifest', JSON.stringify(healthy.appManifest.errors));
  } else pass('Chrome reads the manifest without complaint', String(healthy.appManifest.url).slice(0, 60));

  if (healthy.errors.length) {
    fail(
      'Chrome says this app cannot be installed',
      healthy.errors.map((error) => `${error.errorId}${error.errorArguments?.length ? ` ${JSON.stringify(error.errorArguments)}` : ''}`).join('\n      '),
    );
  } else pass('Chrome offers this app for install', 'installability errors: none');

  if (consoleErrors.length) fail('the page logged errors', consoleErrors.slice(0, 5).join('\n      '));

  /*
   * And the rescue: the same visit with the manifest address answered by the site's page, which is
   * what a catch-all host does. The app rebuilds the manifest and icons in the page; if that is not
   * installable either, then on such a host there is no install at all and the banner's guide is
   * the only honest thing left.
   */
  const hostile = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await hostile.route('**/manifest.json**', (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>OVVO</title>' }),
  );
  const hostilePage = await hostile.newPage();
  await hostilePage.goto(`${BASE}/`, { waitUntil: 'load' });
  await hostilePage.waitForFunction(() => Boolean(navigator.serviceWorker.controller), null, { timeout: 20000 }).catch(() => {});
  await hostilePage.waitForTimeout(1500);
  const rescued = await verdict(hostilePage, hostile);
  if (rescued.errors.length) {
    fail(
      'the rebuilt manifest is not installable either',
      rescued.errors.map((error) => `${error.errorId}${error.errorArguments?.length ? ` ${JSON.stringify(error.errorArguments)}` : ''}`).join('\n      '),
    );
  } else pass('the rebuilt manifest installs when the host will not serve the file', 'fallback path is intact');

  await browser.close();
} catch (error) {
  fail('the audit could not run', error.stack ?? error.message);
  await browser.close().catch(() => {});
}

console.log(failures === 0 ? '\ninstall: every check passed' : `\ninstall: ${failures} check(s) failed`);
process.exit(failures === 0 ? 0 : 1);
