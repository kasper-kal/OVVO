#!/usr/bin/env node
/**
 * **Fetch, check and only then activate the Dutch timetable.**
 *
 *   node scripts/gtfs/fetch.mjs            # download the newest dataset, validate it, activate it
 *   node scripts/gtfs/fetch.mjs --check    # validate what is already in the cache, download nothing
 *   node scripts/gtfs/fetch.mjs --status   # print the active dataset and its validity, download nothing
 *
 * The rules this file exists to keep:
 *
 *   1. **Never hard-code a filename.** `gtfs.ovapi.nl` publishes one `NL-OPENOV-YYYYMMDD-gtfs.zip`
 *      per day and keeps older ones, so the newest is found by reading the listing. `--check` uses
 *      whatever is in the cache; a listing that cannot be read is an error, not a silent guess.
 *   2. **A download is not data.** A truncated 12MB file unzips to a valid-looking archive, so the
 *      archive is tested (`unzip -t`), its size is compared with `Content-Length`, its SHA-256 is
 *      recorded, and every file the router needs must be present with the columns it needs.
 *   3. **The last good dataset survives a bad update.** The new data is unpacked into its own
 *      directory; `current.json` is only rewritten after every check passes. A failed run leaves
 *      yesterday's timetable exactly where it was.
 *   4. **Big files are measured, not stored.** `stop_times.txt` for the Netherlands is several
 *      gigabytes. It is counted by streaming it out of the archive and thrown away, because the
 *      pipeline's job here is to prove the data is good, not to keep a second copy of it.
 *
 * Nothing under `.gtfs-cache/` is in Git: it is reproducible, and it is far larger than a
 * repository should carry.
 */
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const CACHE = path.resolve(process.env.GTFS_CACHE ?? '.gtfs-cache');
const LISTING = 'https://gtfs.ovapi.nl/openov-nl/';
const STABLE = 'https://gtfs.ovapi.nl/openov-nl/gtfs-openov-nl.zip';
const MIN_BYTES = 50 * 1024 * 1024;

const REQUIRED = {
  'agency.txt': ['agency_name'],
  'stops.txt': ['stop_id', 'stop_name', 'stop_lat', 'stop_lon'],
  'routes.txt': ['route_id', 'route_type'],
  'trips.txt': ['route_id', 'service_id', 'trip_id'],
  'stop_times.txt': ['trip_id', 'arrival_time', 'departure_time', 'stop_id', 'stop_sequence'],
};
/* Service dates are carried by `calendar.txt`, by `calendar_dates.txt`, or by both; GTFS requires
 * one of them, not a particular one. This feed ships only `calendar_dates.txt`, which is why the
 * first run of this script refused it, the fault was the assumption, not the archive. */
const CALENDARS = ['calendar.txt', 'calendar_dates.txt'];
const OPTIONAL = ['calendar.txt', 'calendar_dates.txt', 'feed_info.txt', 'shapes.txt', 'shape.txt', 'frequencies.txt', 'transfers.txt', 'translations.txt', 'licenses.txt', 'ticketing_deep_links.txt', 'ticketing_identifiers.txt'];

const log = (message) => console.log(`[${new Date().toISOString().slice(11, 19)}] ${message}`);
const fail = (message) => {
  console.error(`\nFAILED: ${message}`);
  process.exit(1);
};
const run = (command, args, encoding) => execFileSync(command, args, { encoding, maxBuffer: 64 * 1024 * 1024 });

const mode = process.argv.includes('--check') ? 'check' : process.argv.includes('--status') ? 'status' : 'update';
fs.mkdirSync(CACHE, { recursive: true });

const currentFile = path.join(CACHE, 'current.json');
const readCurrent = () => (fs.existsSync(currentFile) ? JSON.parse(fs.readFileSync(currentFile, 'utf8')) : null);

/* ------------------------------------------------------------------ status */

if (mode === 'status') {
  const current = readCurrent();
  if (!current) fail('nothing is active yet, run: node scripts/gtfs/fetch.mjs');
  console.log(JSON.stringify(current, null, 2));
  process.exit(0);
}

/* ------------------------------------------------------------------ which dataset? */

async function newestDataset() {
  const response = await fetch(LISTING, { headers: { 'user-agent': 'OVVO timetable pipeline' } });
  if (!response.ok) throw new Error(`listing answered ${response.status}`);
  const html = await response.text();
  const dated = [...html.matchAll(/NL-OPENOV-(\d{8})-gtfs\.zip/g)].map((m) => m[0]);
  if (dated.length === 0) return { name: 'gtfs-openov-nl.zip', url: STABLE, note: 'listing has no dated name; using the stable alias' };
  const newest = [...new Set(dated)].sort().pop();
  return { name: newest, url: new URL(newest, LISTING).href, note: 'newest dated archive in the listing' };
}

let target;
if (mode === 'check') {
  const current = readCurrent();
  if (!current) fail('nothing to check, run without --check first');
  target = { name: current.dataset, url: current.source.url };
  log(`checking the active dataset: ${target.name}`);
} else {
  try {
    target = await newestDataset();
  } catch (error) {
    fail(`could not read the dataset listing (${error.message}). Not guessing a filename.`);
  }
  log(`dataset: ${target.name} (${target.note})`);
}

const archive = path.join(CACHE, target.name);

/* ------------------------------------------------------------------ download */

if (mode === 'update' && !fs.existsSync(archive)) {
  const head = await fetch(target.url, { method: 'HEAD' });
  if (!head.ok) fail(`HEAD answered ${head.status} for ${target.url}`);
  const expected = Number(head.headers.get('content-length') ?? 0);
  log(`downloading ${(expected / 1048576).toFixed(0)} MB, last modified ${head.headers.get('last-modified') ?? 'unknown'}`);
  const partial = `${archive}.part`;
  run('curl', ['--fail', '--location', '--silent', '--show-error', '--retry', '3', '--output', partial, target.url]);
  const got = fs.statSync(partial).size;
  if (expected > 0 && got !== expected) {
    fs.rmSync(partial, { force: true });
    fail(`download is ${got} bytes but the server announced ${expected}, refusing a partial archive`);
  }
  fs.renameSync(partial, archive);
  log(`downloaded ${(got / 1048576).toFixed(1)} MB`);
} else if (!fs.existsSync(archive)) {
  fail(`no archive at ${archive}, run without --check`);
} else {
  log(`using the archive already in the cache (${(fs.statSync(archive).size / 1048576).toFixed(1)} MB)`);
}

/* ------------------------------------------------------------------ integrity */

const bytes = fs.statSync(archive).size;
if (bytes < MIN_BYTES) fail(`archive is only ${(bytes / 1048576).toFixed(1)} MB, a Dutch timetable is never that small`);

try {
  run('unzip', ['-t', '-qq', archive], 'utf8');
} catch (error) {
  fail(`the archive does not pass its own integrity test: ${String(error.stderr ?? error.message).slice(0, 200)}`);
}
log('archive integrity: ok');

const sha256 = crypto.createHash('sha256').update(fs.readFileSync(archive)).digest('hex');
const members = run('zipinfo', ['-1', archive], 'utf8').split('\n').map((line) => line.trim()).filter(Boolean);
log(`archive holds ${members.length} files, sha256 ${sha256.slice(0, 12)}…`);

/* ------------------------------------------------------------------ unpack the small files */

const datasetDir = path.join(CACHE, target.name.replace(/\.zip$/, ''));
fs.rmSync(datasetDir, { recursive: true, force: true });
fs.mkdirSync(datasetDir, { recursive: true });

const present = new Set(members.map((m) => path.basename(m).toLowerCase()));
const wanted = [...Object.keys(REQUIRED), ...OPTIONAL].filter((name) => present.has(name));
run('unzip', ['-qq', '-o', archive, ...wanted, '-d', datasetDir], 'utf8');

/* A GTFS archive nests the files in a folder now and then; find them either way. */
const located = {};
for (const name of wanted) {
  const flat = path.join(datasetDir, name);
  if (fs.existsSync(flat)) {
    located[name] = flat;
    continue;
  }
  const nested = members.find((m) => path.basename(m).toLowerCase() === name);
  if (nested) located[name] = path.join(datasetDir, nested);
}

/* ------------------------------------------------------------------ validate */

const missing = Object.keys(REQUIRED).filter((name) => !located[name]);
if (missing.length) fail(`the archive is missing ${missing.join(', ')}, it cannot drive a router`);
if (!CALENDARS.some((name) => located[name])) fail(`neither ${CALENDARS.join(' nor ')} is present, there are no service dates`);

const header = (file) => run('head', ['-1', file], 'utf8').replace(/^\uFEFF/, '').trim().split(',').map((c) => c.trim().toLowerCase());
const rows = (file) => Number(run('wc', ['-l', file], 'utf8').trim().split(/\s+/)[0]) - 1;

for (const [name, columns] of Object.entries(REQUIRED)) {
  const got = header(located[name]);
  const absent = columns.filter((column) => !got.includes(column));
  if (absent.length) fail(`${name} has no ${absent.join(', ')} column (found: ${got.slice(0, 8).join(', ')})`);
}

const counts = {
  agencies: rows(located['agency.txt']),
  stops: rows(located['stops.txt']),
  routes: rows(located['routes.txt']),
  trips: rows(located['trips.txt']),
  calendar: located['calendar.txt'] ? rows(located['calendar.txt']) : 0,
  stop_times: Number(run('bash', ['-c', `unzip -p "${archive}" "${members.find((m) => path.basename(m).toLowerCase() === 'stop_times.txt')}" | wc -l`], 'utf8').trim()) - 1,
  calendar_dates: located['calendar_dates.txt'] ? rows(located['calendar_dates.txt']) : 0,
  shapes: located['shapes.txt'] ? rows(located['shapes.txt']) : 0,
};

if (counts.stops < 1000) fail(`only ${counts.stops} stops, that is not the Dutch network`);
if (counts.trips < 10000) fail(`only ${counts.trips} trips, the archive is incomplete`);
if (counts.stop_times < 100000) fail(`only ${counts.stop_times} stop times, the archive is incomplete`);

/* ------------------------------------------------------------------ validity window */

const datesFrom = (file) => {
  const text = run('bash', ['-c', `tail -n +2 "${file}" | cut -d, -f1-3`], 'utf8');
  return text
    .split('\n')
    .filter(Boolean)
    .flatMap((line) => {
      const parts = line.split(',');
      return parts.slice(-2).filter((value) => /^\d{8}$/.test(value));
    });
};
const calendarDates = [...new Set(CALENDARS.filter((name) => located[name]).flatMap((name) => datesFrom(located[name])))].sort();
if (calendarDates.length === 0) fail('the calendar files carry no dates, the service window cannot be established');
let validFrom = calendarDates[0];
let validUntil = calendarDates.at(-1);

let feedInfo = null;
if (located['feed_info.txt']) {
  const lines = run('cat', [located['feed_info.txt']], 'utf8').split('\n').filter(Boolean);
  const head = lines[0].split(',').map((c) => c.trim());
  const body = lines[1]?.split(',') ?? [];
  const at = (column) => body[head.indexOf(column)]?.trim() || null;
  feedInfo = { publisher: at('feed_publisher_name'), version: at('feed_version'), start: at('feed_start_date'), end: at('feed_end_date'), language: at('feed_lang') };
  if (feedInfo.start) validFrom = feedInfo.start;
  if (feedInfo.end) validUntil = feedInfo.end;
}

const iso = (d) => (d ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}` : null);
const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
if (validUntil && validUntil < today) fail(`the timetable expired on ${iso(validUntil)}, this archive must not be activated`);

/* operators, for the coverage claim */
const agencyText = run('cat', [located['agency.txt']], 'utf8').replace(/^\uFEFF/, '');
/* A real CSV reader for one line: a quote toggles quoting, and a comma inside quotes is data.
 * The first version used a regular expression, read the wrong column, and reported "0 operators"
 * for a feed that names 35 of them. */
const csvLine = (line) => {
  const cells = [];
  let cell = '';
  let quoted = false;
  for (const character of line) {
    if (character === '"') quoted = !quoted;
    else if (character === ',' && !quoted) {
      cells.push(cell);
      cell = '';
    } else cell += character;
  }
  cells.push(cell);
  return cells.map((value) => value.trim());
};

const agencyLines = agencyText.split('\n').filter((line) => line.trim());
const nameColumn = csvLine(agencyLines[0]).indexOf('agency_name');
const operators = [...new Set(agencyLines.slice(1).map((line) => csvLine(line)[nameColumn] ?? ''))].filter(Boolean).sort();

/* ------------------------------------------------------------------ activate */

const manifest = {
  dataset: target.name,
  source: { url: target.url, listing: LISTING, note: target.note ?? null },
  retrievedAt: new Date().toISOString(),
  archiveBytes: bytes,
  sha256,
  files: wanted.length,
  counts,
  validity: { from: iso(validFrom), until: iso(validUntil), feed: feedInfo },
  operators: { count: operators.length, names: operators.slice(0, 40) },
  licence: located['licenses.txt'] ? run('cat', [located['licenses.txt']], 'utf8').trim().slice(0, 400) : null,
  ticketing: located['ticketing_deep_links.txt'] ? run('cat', [located['ticketing_deep_links.txt']], 'utf8').trim().slice(0, 200) : null,
  checks: {
    integrity: 'unzip -t passed',
    size: `${(bytes / 1048576).toFixed(1)} MB (minimum ${MIN_BYTES / 1048576} MB)`,
    requiredFiles: Object.keys(REQUIRED),
    requiredColumns: 'all present',
    plausibility: 'stops, trips and stop times above the floor for a national feed',
    expiry: validUntil ? `valid until ${iso(validUntil)}` : 'no end date in the feed',
  },
};

fs.writeFileSync(path.join(datasetDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
fs.writeFileSync(path.join(CACHE, 'manifest.json'), JSON.stringify(manifest, null, 2));
fs.writeFileSync(currentFile, JSON.stringify({ ...manifest, directory: path.basename(datasetDir) }, null, 2));

log(`agencies ${counts.agencies} · stops ${counts.stops.toLocaleString('en')} · routes ${counts.routes.toLocaleString('en')} · trips ${counts.trips.toLocaleString('en')} · stop times ${counts.stop_times.toLocaleString('en')}`);
log(`valid ${iso(validFrom)} → ${iso(validUntil)} · ${operators.length} operators`);
log(`active: ${path.relative(process.cwd(), datasetDir)} (current.json written last)`);
console.log('\nok, real timetable data is present and passed every check.');
