#!/usr/bin/env node
/**
 * **Lay the built days out as the month the app downloads.**
 *
 *   node scripts/gtfs/publish-site.mjs [source=public/graph] [dest=dist-timetable]
 *
 * Each file is gzipped on its own and keeps the same path with `.gz` added, because the browser
 * fetches one day at a time and should not have to download the whole month to plan one journey.
 * GitHub Pages allows a published site of 1 GB; a month is about 400 MB this way, so the script
 * refuses to publish rather than let the site grow past the limit silently.
 *
 * The site is data only. It answers `/graph/...`; it is not the app.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { createGzip } from 'node:zlib';

const source = path.resolve(process.argv[2] ?? 'public/graph');
const dest = path.resolve(process.argv[3] ?? 'dist-timetable');
const LIMIT = 1024 * 1024 * 1024;

if (!fs.existsSync(path.join(source, 'index.json'))) {
  console.error(`FAILED: ${source}/index.json is missing, build the days first`);
  process.exit(1);
}

fs.rmSync(dest, { recursive: true, force: true });
fs.mkdirSync(dest, { recursive: true });

let files = 0;

async function compress(from, to) {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  await pipeline(fs.createReadStream(from), createGzip({ level: 9 }), fs.createWriteStream(to));
  files += 1;
  return fs.statSync(to).size;
}

async function walk(dir, relative = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    const from = path.join(dir, entry.name);
    const next = path.join(relative, entry.name);
    if (entry.isDirectory()) {
      await walk(from, next);
    } else if (!entry.name.endsWith('.gz')) {
      await compress(from, path.join(dest, 'graph', `${next}.gz`));
    }
  }
}

await walk(source);

/* Count what was actually written, not what was read. */
const used = (function measure(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).reduce((total, entry) => {
    const full = path.join(dir, entry.name);
    return total + (entry.isDirectory() ? measure(full) : fs.statSync(full).size);
  }, 0);
})(path.join(dest, 'graph'));

fs.writeFileSync(
  path.join(dest, 'index.html'),
  `<!doctype html>
<meta charset="utf-8">
<title>OVVO timetable</title>
<style>body{font:16px/1.5 system-ui,sans-serif;max-width:40rem;margin:4rem auto;padding:0 1.25rem;color:#1b1b1b}</style>
<h1>OVVO timetable</h1>
<p>This site publishes the official Dutch public transport timetable that OVVO plans with, rebuilt every night.</p>
<p>The files under <code>/graph/</code> are gzipped. The app reads them; there is nothing to click here.</p>`,
);
fs.writeFileSync(path.join(dest, '.nojekyll'), '');

const megabytes = (used / 1024 / 1024).toFixed(0);
console.log(`${files} files · ${megabytes} MB compressed → ${dest}`);

if (used > LIMIT) {
  console.error(`FAILED: ${megabytes} MB is over GitHub Pages' 1 GB limit`);
  process.exit(1);
}
if (used > LIMIT * 0.95) {
  console.warn(`WARNING: ${megabytes} MB is within 5% of GitHub Pages' 1 GB limit`);
}
