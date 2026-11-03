#!/usr/bin/env node
/**
 * **The timetable pipeline: fetch the real Dutch GTFS, prove it is whole, then swap it in.**
 *
 * The app cannot plan a journey without a timetable, and a timetable that is half downloaded is
 * worse than an old one: it looks like data and answers questions wrongly. So this script never
 * writes into the live folder. It downloads to `incoming/`, unpacks into `staging/`, checks the
 * files it actually got against the fields the planner reads, and only when every check passes does
 * it move the previous timetable to `previous/` and the new one to `current/`. A failed download, a
 * failed unzip, a missing file or a bad header leaves `current/` exactly as it was and exits non
 * zero, so a scheduled run that hits a broken night is a red log line and not a broken planner.
 *
 * Nothing here is committed: `data/` is in `.gitignore`. The manifest (source URL, listing
 * timestamp, archive size and SHA-256, retrieval time, file sizes, declared service dates and the
 * row counts measured) is written next to the data and summarised by hand in `REAL-DATA-STATUS.md`.
 *
 *   node scripts/gtfs-pipeline.mjs            # fetch the newest archive and activate it if valid
 *   node scripts/gtfs-pipeline.mjs --check    # validate what is installed; download nothing
 *   node scripts/gtfs-pipeline.mjs --deep     # also count every row of stop_times (slow)
 *
 * Where the archive format or the fields differ from what the planner expects, the check fails and
 * says which field: guessing at a column name is how a planner starts inventing times.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { appendFile, mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';

const LISTING = process.env.GTFS_LISTING ?? 'https://gtfs.ovapi.nl/openov-nl/';
const ROOT = path.resolve(process.cwd(), 'data/gtfs');
const INCOMING = path.join(ROOT, 'incoming');
const STAGING = path.join(ROOT, 'staging');
const CURRENT = path.join(ROOT, 'current');
const PREVIOUS = path.join(ROOT, 'previous');
const MANIFEST = path.join(ROOT, 'manifest.json');
const LOG = path.join(ROOT, 'pipeline.log');

const args = new Set(process.argv.slice(2));
const deep = args.has('--deep');
const checkOnly = args.has('--check');
const revalidate = args.has('--revalidate');

/** The fields the planner actually reads. A file without them is not usable, whatever its name. */
const REQUIRED = {
  'agency.txt': ['agency_id', 'agency_name'],
  'stops.txt': ['stop_id', 'stop_name', 'stop_lat', 'stop_lon'],
  'routes.txt': ['route_id', 'route_type'],
  'trips.txt': ['route_id', 'service_id', 'trip_id'],
  'stop_times.txt': ['trip_id', 'arrival_time', 'departure_time', 'stop_id', 'stop_sequence'],
};
const CALENDARS = ['calendar.txt', 'calendar_dates.txt'];

let logLines = [];
const log = (line) => {
  const stamped = `${new Date().toISOString()} ${line}`;
  logLines.push(stamped);
  console.log(stamped);
};

/** `unzip` is the ordinary reader; `bsdtar` reads the same archive where it is the one installed. */
function zipReader() {
  try {
    execFileSync('unzip', ['-v'], { stdio: 'ignore' });
    return 'unzip';
  } catch {
    try {
      execFileSync('bsdtar', ['--version'], { stdio: 'ignore' });
      return 'bsdtar';
    } catch {
      throw new Error('neither unzip nor bsdtar is installed: cannot read the archive');
    }
  }
}

/** The listing, read as facts rather than as a page: name, last modification, size in bytes. */
async function readListing() {
  const response = await fetch(LISTING, { headers: { 'user-agent': 'OVVO timetable pipeline' } });
  if (!response.ok) throw new Error(`listing answered ${response.status}`);
  const html = await response.text();
  const rows = [...html.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map((match) => match[1]);
  const entries = [];
  for (const row of rows) {
    const href = /href="([^"]+)"/.exec(row)?.[1];
    if (!href || href.startsWith('?') || href.includes('/')) continue;
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((match) =>
      match[1].replace(/<[^>]+>/g, '').trim(),
    );
    const modified = cells.find((cell) => /^\d{2}-\w{3}-\d{4} \d{2}:\d{2}$/.test(cell));
    const size = cells.find((cell) => /^[\d.]+[KMGT]?$/.test(cell) && cell !== '-');
    if (!href.endsWith('.zip') || !modified) continue;
    entries.push({ name: href, modified, size: size ?? '?', url: new URL(href, LISTING).href });
  }
  if (!entries.length) throw new Error('the listing names no .zip archive; the page format has changed');
  const newest = entries.sort((a, b) => new Date(b.modified) - new Date(a.modified))[0];
  return { entries, newest };
}

const sha256 = async (file) =>
  createHash('sha256').update(await readFile(file)).digest('hex');

async function download(entry) {
  await mkdir(INCOMING, { recursive: true });
  const target = path.join(INCOMING, entry.name);
  const part = `${target}.part`;
  log(`downloading ${entry.url} (listing says ${entry.size}, ${entry.modified})`);
  const response = await fetch(entry.url, { headers: { 'user-agent': 'OVVO timetable pipeline' } });
  if (!response.ok || !response.body) throw new Error(`download answered ${response.status}`);
  const expected = Number(response.headers.get('content-length') ?? 0);
  let written = 0;
  const counter = new TransformStream({
    transform(chunk, controller) {
      written += chunk.byteLength;
      controller.enqueue(chunk);
    },
  });
  await pipeline(Readable.fromWeb(response.body.pipeThrough(counter)), createWriteStream(part));
  if (expected && written !== expected) throw new Error(`short download: ${written} of ${expected} bytes`);
  const bytes = written || (await stat(part)).size;
  if (bytes < 1024 * 1024) throw new Error(`archive is only ${bytes} bytes: refusing it`);
  await rename(part, target);
  log(`downloaded ${bytes} bytes to ${path.relative(process.cwd(), target)}`);
  return { file: target, bytes, sha256: await sha256(target) };
}

/** Entries with their uncompressed sizes, so a missing or empty file is caught before unzipping. */
function listZip(reader, archive) {
  const output =
    reader === 'unzip'
      ? execFileSync('unzip', ['-l', archive], { maxBuffer: 8 * 1024 * 1024 }).toString()
      : execFileSync('bsdtar', ['-tvf', archive], { maxBuffer: 8 * 1024 * 1024 }).toString();
  const sizes = new Map();
  for (const line of output.split('\n')) {
    const parts = line.trim().split(/\s+/);
    const name = parts.at(-1);
    if (!name?.endsWith('.txt')) continue;
    const numeric = parts.filter((part) => /^\d+$/.test(part)).map(Number);
    // unzip -l: length, date, time, name. bsdtar -tvf: mode, owner, size, date, time, name.
    const size = reader === 'unzip' ? numeric[0] : Math.max(...numeric);
    sizes.set(path.basename(name), size ?? 0);
  }
  return sizes;
}

/**
 * **The first lines of one member, and only those.**
 *
 * `unzip -p` writes the whole member, and stop_times is gigabytes: capturing that output to slice
 * three lines off it would kill the process it is meant to protect. The reader is piped into `head`
 * instead, so the archive is decompressed until the pipe closes and not one byte further.
 */
function head(reader, archive, member, lines = 3) {
  const command =
    reader === 'unzip' ? `unzip -p ${JSON.stringify(archive)} ${member}` : `bsdtar -xOf ${JSON.stringify(archive)} ${member}`;
  try {
    const output = execFileSync('sh', ['-c', `${command} | head -n ${lines}`], {
      maxBuffer: 8 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return output.toString('utf8').split('\n');
  } catch (error) {
    throw new Error(`cannot read ${member} from the archive: ${error.message}`);
  }
}

function countRows(reader, archive, member) {
  const output =
    reader === 'unzip'
      ? execFileSync('sh', ['-c', `unzip -p ${JSON.stringify(archive)} ${member} | wc -l`], {
          maxBuffer: 4 * 1024 * 1024,
        })
      : execFileSync('sh', ['-c', `bsdtar -xOf ${JSON.stringify(archive)} ${member} | wc -l`], {
          maxBuffer: 4 * 1024 * 1024,
        });
  return Math.max(0, Number(output.toString().trim()) - 1);
}

/** Everything a failure would hide: absent files, empty files, wrong columns, no service dates. */
function validateArchive(reader, archive) {
  const sizes = listZip(reader, archive);
  const problems = [];
  const facts = { files: {}, rows: {} };

  for (const [name, fields] of Object.entries(REQUIRED)) {
    const size = sizes.get(name);
    if (!size) {
      problems.push(`${name} is missing or empty`);
      continue;
    }
    facts.files[name] = size;
    const [header] = head(reader, archive, name, 1);
    const columns = (header ?? '').split(',').map((column) => column.replace(/^\uFEFF/, '').trim());
    const missing = fields.filter((field) => !columns.includes(field));
    if (missing.length) problems.push(`${name} has no ${missing.join(', ')}`);
    const [firstRow] = head(reader, archive, name, 2).slice(1);
    if (!firstRow || firstRow.trim() === '') problems.push(`${name} has a header and no rows`);
  }

  if (!CALENDARS.some((name) => sizes.get(name))) {
    problems.push('neither calendar.txt nor calendar_dates.txt is present: no service dates');
  }

  /* Service dates are read from the calendar's own declared window, not guessed from today. */
  if (sizes.get('calendar.txt')) {
    facts.files['calendar.txt'] = sizes.get('calendar.txt');
    const rows = head(reader, archive, 'calendar.txt', 4000).slice(1);
    const starts = rows.map((row) => row.split(',')[8]).filter((value) => /^\d{8}$/.test(value ?? ''));
    const ends = rows.map((row) => row.split(',')[9]).filter((value) => /^\d{8}$/.test(value ?? ''));
    if (!starts.length || !ends.length) problems.push('calendar.txt declares no service window');
    else facts.serviceWindow = { first: starts.sort()[0], last: ends.sort().at(-1) };
  }

  /*
   * **The window can live in the exceptions instead of the calendar.** This feed ships its dates in
   * `calendar_dates.txt`, and reading only `calendar.txt` reported a window of "?–?" on a timetable
   * that is perfectly usable. The dates are read from whichever file declares them, and the manifest
   * says which one answered.
   */
  if (!facts.serviceWindow && sizes.get('calendar_dates.txt')) {
    facts.files['calendar_dates.txt'] = sizes.get('calendar_dates.txt');
    const rows = head(reader, archive, 'calendar_dates.txt', 400000).slice(1);
    /* `service_id,date,exception_type`: the date is the second column, not the third. */
    const dates = rows
      .map((row) => row.split(',')[1])
      .filter((value) => /^\d{8}$/.test(value ?? ''))
      .sort();
    if (!dates.length) problems.push('calendar_dates.txt declares no dates');
    else facts.serviceWindow = { first: dates[0], last: dates.at(-1), source: 'calendar_dates.txt' };
  }

  if (deep) {
    for (const name of Object.keys(REQUIRED)) {
      if (sizes.get(name)) facts.rows[name] = countRows(reader, archive, name);
    }
    if (!facts.rows['stop_times.txt']) problems.push('stop_times.txt holds no rows');
  } else {
    // A cheap count on the small files still says the archive is a timetable and not a placeholder.
    for (const name of ['agency.txt', 'stops.txt', 'routes.txt', 'trips.txt']) {
      if (sizes.get(name)) facts.rows[name] = countRows(reader, archive, name);
    }
  }

  return { problems, facts };
}

async function unpack(reader, archive) {
  await rm(STAGING, { recursive: true, force: true });
  await mkdir(STAGING, { recursive: true });
  if (reader === 'unzip') execFileSync('unzip', ['-q', '-o', archive, '-d', STAGING], { stdio: 'inherit' });
  else execFileSync('bsdtar', ['-xf', archive, '-C', STAGING], { stdio: 'inherit' });
  log(`unpacked into ${path.relative(process.cwd(), STAGING)}`);
}

/** The swap, done so that a stop between the two renames leaves a readable `current/` or none. */
async function activate(manifest) {
  await rm(PREVIOUS, { recursive: true, force: true });
  try {
    await stat(CURRENT);
    await rename(CURRENT, PREVIOUS);
    log('the previous timetable is kept in previous/');
  } catch {
    log('there was no previous timetable to keep');
  }
  await rename(STAGING, CURRENT);
  await writeFile(path.join(CURRENT, 'manifest.json'), JSON.stringify(manifest, null, 2));
  await writeFile(MANIFEST, JSON.stringify(manifest, null, 2));
  log('the new timetable is active');
}

async function checkInstalled() {
  const manifest = JSON.parse(await readFile(MANIFEST, 'utf8'));
  const missing = [];
  for (const [name, size] of Object.entries(manifest.facts.files)) {
    const file = path.join(CURRENT, name);
    const actual = await stat(file).catch(() => null);
    if (!actual || actual.size !== size) missing.push(`${name} (${actual ? actual.size : 'missing'} of ${size})`);
  }
  if (missing.length) {
    log(`FAIL ${missing.join(', ')}`);
    process.exit(1);
  }
  log(
    `OK ${manifest.archive.name}: ${manifest.facts.files['stop_times.txt']} bytes of stop_times, ` +
      `service window ${manifest.facts.serviceWindow?.first ?? '?'}–${manifest.facts.serviceWindow?.last ?? '?'}`,
  );
}

async function main() {
  await mkdir(ROOT, { recursive: true });
  if (checkOnly) return checkInstalled();

  const reader = zipReader();
  const { entries, newest } = await readListing();
  log(`listing holds ${entries.length} archive(s); newest is ${newest.name} (${newest.modified})`);

  if (revalidate) {
    const existing = path.join(INCOMING, newest.name);
    const onDisk = await stat(existing).catch(() => null);
    if (!onDisk) {
      log('nothing to revalidate: the archive is not on disk');
      process.exitCode = 1;
      return;
    }
    log(`revalidating ${path.relative(process.cwd(), existing)} without downloading it again`);
    const { problems, facts } = validateArchive(reader, existing);
    if (problems.length) {
      log(`FAIL ${problems.join('; ')}`);
      process.exitCode = 1;
      return;
    }
    await unpack(reader, existing);
    await activate({
      source: LISTING,
      archive: { name: newest.name, url: newest.url, modified: newest.modified, listingSize: newest.size, bytes: onDisk.size, sha256: await sha256(existing) },
      retrievedAt: new Date().toISOString(),
      facts,
      rowsMeasured: deep ? 'every file' : 'the small files; stop_times by size only',
    });
    log(`service window ${facts.serviceWindow?.first ?? '?'}–${facts.serviceWindow?.last ?? '?'} (${facts.serviceWindow?.source ?? 'none'})`);
    await appendFile(LOG, logLines.join('\n') + '\n').catch(() => {});
    return;
  }

  const installed = await readFile(MANIFEST, 'utf8')
    .then((text) => JSON.parse(text))
    .catch(() => null);
  if (installed?.archive?.name === newest.name && installed?.archive?.modified === newest.modified) {
    log('the newest archive is already installed: nothing to download');
    return checkInstalled();
  }

  try {
    const downloaded = await download(newest);
    const { problems, facts } = validateArchive(reader, downloaded.file);
    if (problems.length) throw new Error(`the archive is not usable: ${problems.join('; ')}`);
    await unpack(reader, downloaded.file);
    const manifest = {
      source: LISTING,
      archive: {
        name: newest.name,
        url: newest.url,
        modified: newest.modified,
        listingSize: newest.size,
        bytes: downloaded.bytes,
        sha256: downloaded.sha256,
      },
      retrievedAt: new Date().toISOString(),
      facts,
      rowsMeasured: deep ? 'every file' : 'the small files; stop_times by size only',
    };
    await activate(manifest);
    for (const [name, size] of Object.entries(facts.files)) log(`  ${name}: ${size} bytes`);
    log(`service window ${facts.serviceWindow?.first ?? '?'}–${facts.serviceWindow?.last ?? '?'}`);
    log('OK activated');
  } catch (error) {
    log(`FAIL ${error.message}`);
    log('the installed timetable is untouched');
    process.exitCode = 1;
  } finally {
    await appendFile(LOG, logLines.join('\n') + '\n').catch(() => {});
  }
}

await main();
