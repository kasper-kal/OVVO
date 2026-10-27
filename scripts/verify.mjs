#!/usr/bin/env node
/*
 * **One command that asks every question this project has been bitten by.**
 *
 * The pattern behind almost every report here is the same: the change was correct, the type checker
 * was happy, the build succeeded, and the thing that was wrong was only visible to a browser. A row
 * that would not wrap. A sheet that did not close. A manifest Chrome quietly refused. Each one was
 * found on a phone, after it shipped, because the check that would have caught it lived in a
 * scratch file under `.logs/` and needed three things set by hand before it would run.
 *
 * So this runs them together, from nothing:
 *
 *   1. `tsc --noEmit`           — the code type-checks.
 *   2. `em-dash-audit`          — no em dash in any text the traveller can read.
 *   3. `vite build`             — the app builds.
 *   4. `install-audit`          — Chrome itself says the built app can be installed.
 *   5. `layout-audit`           — no sideways scroll, nothing covered, every screen starts at its top.
 *   6. `ui-audit`               — contrast, touch targets and clipped text on every route.
 *   7. `colour-audit`           — the same, for every palette the Colours screen can produce.
 *
 * Items 4–6 run against the **built** app, served here on a private port, because that is what a
 * phone gets: the service worker, the hashed bundles, the whole thing. The dev server would hide
 * exactly the class of fault this is for.
 *
 *   npm run verify              everything
 *   npm run verify -- layout    just the layout audit (and the build it needs)
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { preview } from 'vite';
import { prepareBrowserEnv } from './browser-env.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const wanted = process.argv.slice(2).filter((arg) => !arg.startsWith('-'));
const wants = (name) => wanted.length === 0 || wanted.includes(name);

prepareBrowserEnv();

let failures = 0;
const results = [];

function run(label, command, args, extraEnv = {}) {
  return new Promise((resolve) => {
    const started = Date.now();
    const child = spawn(command, args, {
      cwd: ROOT,
      env: { ...process.env, ...extraEnv },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    child.stdout.on('data', (chunk) => (output += chunk));
    child.stderr.on('data', (chunk) => (output += chunk));
    child.on('close', (code) => {
      const seconds = ((Date.now() - started) / 1000).toFixed(1);
      const ok = code === 0;
      if (!ok) failures += 1;
      /* How many individual checks said `ok`, so a pass is a number and not silence: an audit
         that never ran and an audit that found nothing look identical otherwise. */
      const checks = output.split('\n').filter((line) => /^(ok|PASS)\s/.test(line)).length;
      results.push({ label, ok, seconds, checks });
      console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}   ${seconds}s${checks ? `   ${checks} check(s)` : ''}`);
      if (!ok) console.log(output.split('\n').map((line) => `      ${line}`).join('\n'));
      resolve(ok);
    });
  });
}

console.log('OVVO verify\n');

if (wants('types')) await run('types', 'npx', ['tsc', '--noEmit']);
if (wants('text')) await run('text', 'node', ['scripts/em-dash-audit.mjs']);
if (wants('build')) await run('build', 'npx', ['vite', 'build']);

const browserChecks = [
  { name: 'install', file: 'scripts/install-audit.mjs', env: 'INSTALL_URL' },
  { name: 'layout', file: 'scripts/layout-audit.mjs', env: 'LAYOUT_URL' },
  { name: 'ui', file: 'scripts/ui-audit.mjs', env: null },
  /* The palettes last: one palette through the whole ui-audit, then every palette through it. */
  { name: 'colours', file: 'scripts/colour-audit.mjs', env: null },
].filter((check) => wants(check.name));

if (browserChecks.length) {
  /* A port of its own, so a dev server on 3000 is neither disturbed nor silently tested instead. */
  let server;
  for (const port of [4180, 4181, 4182, 4190]) {
    try {
      server = await preview({ root: ROOT, preview: { port, strictPort: true, host: '127.0.0.1' } });
      break;
    } catch {
      /* taken; try the next one */
    }
  }
  if (!server) {
    console.log('FAIL  could not start a server for the browser checks');
    failures += 1;
  } else {
    const origin = server.resolvedUrls?.local?.[0]?.replace(/\/$/, '') ?? 'http://127.0.0.1:4180';
    for (const check of browserChecks) {
      const env = check.env ? { [check.env]: origin } : {};
      await run(check.name, 'node', [check.file, ...(check.env ? [] : [origin])], env);
    }
    await new Promise((resolve) => server.httpServer.close(resolve));
  }
}

console.log(
  '\n' +
    results
      .map((result) => `${result.ok ? 'ok  ' : 'FAIL'}  ${result.label.padEnd(8)} ${result.seconds}s   ${result.checks} check(s)`)
      .join('\n'),
);
console.log(failures === 0 ? '\nverify: everything passed' : `\nverify: ${failures} check(s) failed`);
process.exit(failures === 0 ? 0 : 1);
