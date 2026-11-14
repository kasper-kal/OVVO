#!/usr/bin/env node
/**
 * **Real departures for the stops the app already has.**
 *
 *   node scripts/gtfs/build-app-data.mjs
 *
 * The app's stop list is hand-built: 61 stations, halts and landmarks with a schematic map
 * position, facilities and an operator list. Replacing it with 53,612 raw GTFS stops would throw
 * away the approved design and invent city names, facilities and regions the feed does not carry.
 * So the two are joined instead:
 *
 *   - each app stop is matched to the GTFS stops that carry the same name;
 *   - its real departures are read from `stop_times` for the service days the feed covers, with
 *     the real line, headsign, operator and platform;
 *   - a stop that cannot be matched is listed as unmatched and gets **no** board, rather than a
 *     plausible one.
 *
 * Output is a generated TypeScript module, so the app keeps its synchronous board lookup.
 */
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

const CACHE = '.gtfs-cache';
const current = JSON.parse(fs.readFileSync(path.join(CACHE, 'current.json'), 'utf8'));
const archive = path.join(CACHE, current.dataset);
const OUT = 'src/data/generated/boards.ts';
const MAX_PER_STOP_PER_DAY = 250;
const DAYS = 2;

function csvLine(line) {
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
  return cells;
}

function table(member) {
  const child = spawn('unzip', ['-p', archive, member], { stdio: ['ignore', 'pipe', 'inherit'] });
  const lines = readline.createInterface({ input: child.stdout, crlfDelay: Infinity });
  let head = null;
  return (async function* rows() {
    for await (const line of lines) {
      if (line.trim() === '') continue;
      if (!head) {
        head = csvLine(line.replace(/^\uFEFF/, '')).map((name) => name.trim().toLowerCase());
        continue;
      }
      const cells = csvLine(line);
      const row = {};
      head.forEach((name, index) => {
        row[name] = cells[index] ?? '';
      });
      yield row;
    }
  })();
}

/* ---------------------------------------------------------------- the app's stops */

const source = fs.readFileSync('src/data/stops.ts', 'utf8');
const seeds = [...source.matchAll(/\{ id: '([^']+)', name: '([^']+)', city: '([^']+)', code: '([^']+)'/g)].map((m) => ({
  id: m[1],
  name: m[2],
  city: m[3],
  code: m[4],
}));
if (seeds.length < 40) throw new Error(`only ${seeds.length} stops read from src/data/stops.ts — the seed format changed`);

const normalise = (value) =>
  value
    .toLowerCase()
    .replace(/[,'’.()]/g, ' ')
    .replace(/\b(station|centraal|centrum|cs|halte|busstation)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/* ---------------------------------------------------------------- service days */

const dates = [];
for (let index = 0; index < DAYS; index += 1) {
  const day = new Date(Date.now() + index * 86_400_000);
  dates.push(day.toISOString().slice(0, 10).replace(/-/g, ''));
}

const serviceByDate = new Map(dates.map((date) => [date, new Set()]));
for await (const row of table('calendar_dates.txt')) {
  const set = serviceByDate.get(row.date);
  if (set && row.exception_type === '1') set.add(row.service_id);
}
for (const [date, set] of serviceByDate) if (set.size === 0) throw new Error(`no services run on ${date} in this feed`);

/* ---------------------------------------------------------------- reference tables */

const routes = new Map();
for await (const row of table('routes.txt')) {
  routes.set(row.route_id, {
    short: row.route_short_name || '',
    long: row.route_long_name || '',
    type: Number(row.route_type),
    agency: row.agency_id || '',
  });
}

const agencies = new Map();
for await (const row of table('agency.txt')) agencies.set(row.agency_id, row.agency_name);

const MODE_BY_TYPE = { 0: 'tram', 1: 'metro', 2: 'train', 3: 'bus', 4: 'ferry', 5: 'tram', 6: 'bus', 7: 'bus', 11: 'bus', 12: 'bus', 13: 'bus' };

const stops = new Map();
for await (const row of table('stops.txt')) {
  stops.set(row.stop_id, {
    name: row.stop_name,
    parent: row.parent_station || '',
    platform: (row.platform_code || row.stop_code || '').trim(),
  });
}

/* ---------------------------------------------------------------- matching */

const byNormalisedName = new Map();
for (const [stopId, stop] of stops) {
  if (stop.parent) continue; // stations first; their platforms are added once the parent matches
  const key = normalise(stop.name);
  if (!key) continue;
  if (!byNormalisedName.has(key)) byNormalisedName.set(key, []);
  byNormalisedName.get(key).push(stopId);
}

const matchOf = new Map();
const unmatched = [];
for (const seed of seeds) {
  const key = normalise(seed.name);
  let candidates = byNormalisedName.get(key) ?? [];
  if (candidates.length === 0) {
    /* Fall back to shared words: "Zaandam Station" is "Zaandam" in the feed. */
    const words = key.split(' ').filter((word) => word.length > 2);
    candidates = [...byNormalisedName.entries()]
      .filter(([name]) => words.length > 0 && words.every((word) => name.includes(word)))
      .flatMap(([, ids]) => ids);
  }
  if (candidates.length === 0) {
    unmatched.push(seed.id);
    continue;
  }
  const firstWord = key.split(' ')[0];
  const chosen = candidates.find((id) => normalise(stops.get(id).name).includes(firstWord)) ?? candidates[0];
  const group = [chosen, ...[...stops.entries()].filter(([, stop]) => stop.parent === chosen).map(([id]) => id)];
  matchOf.set(seed.id, new Set(group));
}

const gtfsToSeed = new Map();
for (const [seedId, ids] of matchOf) for (const id of ids) gtfsToSeed.set(id, seedId);

/* ---------------------------------------------------------------- trips on those days */

const tripDate = new Map();
const tripIndex = new Map();
for await (const row of table('trips.txt')) {
  for (const [date, services] of serviceByDate) {
    if (services.has(row.service_id)) {
      tripDate.set(row.trip_id, date);
      tripIndex.set(row.trip_id, [row.route_id, row.trip_headsign || '']);
      break;
    }
  }
}

/* ---------------------------------------------------------------- departures */

const boards = new Map();
let rowsRead = 0;
let rowsKept = 0;

for await (const row of table('stop_times.txt')) {
  rowsRead += 1;
  const seedId = gtfsToSeed.get(row.stop_id);
  if (!seedId) continue;
  const date = tripDate.get(row.trip_id);
  if (!date) continue;
  const [route, headsign] = tripIndex.get(row.trip_id) ?? [];
  if (!route) continue;

  const time = row.departure_time || row.arrival_time;
  if (!time) continue;
  const [hours, minutes] = time.split(':').map(Number);
  if (Number.isNaN(hours)) continue;

  if (!boards.has(seedId)) boards.set(seedId, new Map());
  const days = boards.get(seedId);
  if (!days.has(date)) days.set(date, []);
  const list = days.get(date);
  if (list.length >= MAX_PER_STOP_PER_DAY) continue;

  const info = routes.get(route);
  list.push({
    s: hours * 3600 + minutes * 60,
    l: String(info?.short || info?.long || route).slice(0, 12),
    d: String(headsign).slice(0, 40),
    o: String(agencies.get(info?.agency) || info?.agency || '').slice(0, 24),
    m: MODE_BY_TYPE[info?.type] ?? 'bus',
    p: String(stops.get(row.stop_id)?.platform || '').slice(0, 6),
  });
  rowsKept += 1;
}

for (const days of boards.values()) for (const list of days.values()) list.sort((a, b) => a.s - b.s);

const payload = {};
for (const [seedId, days] of boards) {
  payload[seedId] = {};
  for (const [date, list] of days) payload[seedId][date] = list;
}

/* ---------------------------------------------------------------- write */

const header = {
  generatedAt: new Date().toISOString(),
  dataset: current.dataset,
  sha256: current.sha256,
  validity: current.validity,
  days: dates,
  matchedStops: matchOf.size,
  unmatchedStops: unmatched,
  departures: rowsKept,
  capPerStopPerDay: MAX_PER_STOP_PER_DAY,
  note: 'Real scheduled times from the national GTFS feed. Not realtime: no delay is known here.',
};

const banner = ['/* GENERATED by scripts/gtfs/build-app-data.mjs — do not edit.', ...JSON.stringify(header, null, 2).split('\n').map((line) => ' * ' + line), ' */'].join('\n');

const body = [
  '',
  '/** One scheduled departure, exactly as the feed states it. */',
  'export interface RealDeparture {',
  '  /** Seconds after midnight of the service day; after-midnight services exceed 86400. */',
  '  s: number;',
  '  /** Line number or short name. */',
  '  l: string;',
  '  /** Headsign: where this service is going. */',
  '  d: string;',
  '  /** Operator as the feed names it. */',
  '  o: string;',
  '  /** Mode derived from the route type. */',
  '  m: string;',
  '  /** Platform or stop code, when the feed gives one. */',
  '  p: string;',
  '}',
  '',
  'export type RealBoard = RealDeparture[];',
  '',
  'export const BOARDS_GENERATED_AT = ' + JSON.stringify(header.generatedAt) + ';',
  'export const BOARDS_DAYS: string[] = ' + JSON.stringify(dates) + ';',
  'export const BOARDS_UNMATCHED: string[] = ' + JSON.stringify(unmatched) + ';',
  'export const BOARDS: Record<string, Record<string, RealBoard>> = ' + JSON.stringify(payload) + ';',
  '',
].join('\n');

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, banner + '\n' + body);
fs.writeFileSync(path.join(CACHE, 'app-data-report.json'), JSON.stringify({ ...header, rowsRead }, null, 2));

console.log(`stops in the app: ${seeds.length}`);
console.log(`matched to the feed: ${matchOf.size}`);
console.log(`unmatched: ${unmatched.length ? unmatched.join(', ') : 'none'}`);
console.log(`stop_times read: ${rowsRead.toLocaleString('en')} · departures kept: ${rowsKept.toLocaleString('en')}`);
console.log(`days: ${dates.join(', ')} · wrote ${OUT} (${(fs.statSync(OUT).size / 1024).toFixed(0)} KB)`);
console.log(`build hash: ${crypto.createHash('sha256').update(fs.readFileSync(OUT)).digest('hex').slice(0, 12)}`);
