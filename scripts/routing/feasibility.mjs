#!/usr/bin/env node
/**
 * **Step 0 — does a real search fit in a free function?**
 *
 *   node scripts/routing/feasibility.mjs --region     # Utrecht area only
 *   node scripts/routing/feasibility.mjs --national   # the whole country
 *
 * This is the experiment the plan says must come before any building. It reads the verified
 * archive, makes the connections a journey search needs (departure stop, arrival stop, times,
 * trip), writes a plain connection-scan search over them, and measures what one query costs in
 * processor time and memory.
 *
 * It measures the *search*, not the data loading: on a Worker the graph is a file fetched over the
 * network, and waiting for it does not count against processor time. What counts is the scan.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { createScanner } from './scan.mjs';

const CACHE = '.gtfs-cache';
const current = JSON.parse(fs.readFileSync(path.join(CACHE, 'current.json'), 'utf8'));
const archive = path.join(CACHE, current.dataset);
const national = process.argv.includes('--national');
const REGION = { minLat: 51.95, maxLat: 52.25, minLon: 4.8, maxLon: 5.35 };
const DATE = process.argv.find((a) => /^--date=/.test(a))?.slice(7) ?? current.validity.from.replace(/-/g, '');
const MIN_TRANSFER_SECONDS = 120;
/* How far past the requested departure the scan is allowed to read. 0 means the whole day. */
const WINDOW_HOURS = Number(process.argv.find((a) => a.startsWith('--window='))?.slice(9) ?? 0);
const WINDOW_SECONDS = WINDOW_HOURS > 0 ? WINDOW_HOURS * 3600 : 24 * 3600;
const WALK_METRES = 400;
const WALK_SPEED = 1.25; // metres per second

/* ------------------------------------------------------------------ reading GTFS */

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

const seconds = (value) => {
  const [h, m, s] = value.split(':').map(Number);
  return h * 3600 + m * 60 + (s || 0);
};

/* stops ------------------------------------------------------------------ */
const stops = [];
const stopIndex = new Map();
for await (const row of table('stops.txt')) {
  const lat = Number(row.stop_lat);
  const lon = Number(row.stop_lon);
  if (!lat || !lon) continue;
  if (!national && (lat < REGION.minLat || lat > REGION.maxLat || lon < REGION.minLon || lon > REGION.maxLon)) continue;
  stopIndex.set(row.stop_id, stops.length);
  stops.push({ id: row.stop_id, name: row.stop_name, lat, lon });
}

/* services on the chosen date -------------------------------------------- */
const services = new Set();
for await (const row of table('calendar_dates.txt')) {
  if (row.date === DATE && row.exception_type === '1') services.add(row.service_id);
}

/* trips ------------------------------------------------------------------ */
const tripIndex = new Map();
for await (const row of table('trips.txt')) {
  if (services.has(row.service_id)) {
    tripIndex.set(row.trip_id, tripIndex.size);
    if (tripIndex.size > 2_000_000) throw new Error('trip index is implausible');
  }
}

/* connections ------------------------------------------------------------ */
const from = [];
const to = [];
const dep = [];
const arr = [];
const trip = [];
let rowsRead = 0;

let previousTrip = null;
let previousStop = -1;
let previousTime = 0;

for await (const row of table('stop_times.txt')) {
  rowsRead += 1;
  const tripNumber = tripIndex.get(row.trip_id);
  if (tripNumber === undefined) {
    previousTrip = null;
    continue;
  }
  const stop = stopIndex.get(row.stop_id);
  const arrival = seconds(row.arrival_time || row.departure_time);
  const departure = seconds(row.departure_time || row.arrival_time);

  if (previousTrip === tripNumber && previousStop >= 0 && stop !== undefined && arrival > previousTime) {
    from.push(previousStop);
    to.push(stop);
    dep.push(previousTime);
    arr.push(arrival);
    trip.push(tripNumber);
  }
  previousTrip = tripNumber;
  previousStop = stop ?? -1;
  previousTime = departure;
}

const order = new Uint32Array(from.length);
for (let i = 0; i < order.length; i += 1) order[i] = i;
const sorted = Array.from(order).sort((a, b) => dep[a] - dep[b]);

const C = {
  from: new Uint32Array(sorted.length),
  to: new Uint32Array(sorted.length),
  dep: new Int32Array(sorted.length),
  arr: new Int32Array(sorted.length),
  trip: new Uint32Array(sorted.length),
};
sorted.forEach((source, index) => {
  C.from[index] = from[source];
  C.to[index] = to[source];
  C.dep[index] = dep[source];
  C.arr[index] = arr[source];
  C.trip[index] = trip[source];
});

/* walking links between genuinely close stops ----------------------------- */
const walkFrom = [];
const walkTo = [];
const walkSeconds = [];
const grid = new Map();
const cell = (value) => Math.floor(value * 1000 / 250); // 250 m cells
for (let i = 0; i < stops.length; i += 1) {
  const key = `${cell(stops[i].lat)}:${cell(stops[i].lon)}`;
  if (!grid.has(key)) grid.set(key, []);
  grid.get(key).push(i);
}
const metresBetween = (a, b) => {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat = ((a.lat + b.lat) / 2 * Math.PI) / 180;
  return Math.hypot(dLat * R, dLon * R * Math.cos(lat));
};
for (let i = 0; i < stops.length; i += 1) {
  const cx = cell(stops[i].lat);
  const cy = cell(stops[i].lon);
  for (let dx = -1; dx <= 1; dx += 1) {
    for (let dy = -1; dy <= 1; dy += 1) {
      for (const j of grid.get(`${cx + dx}:${cy + dy}`) ?? []) {
        if (j <= i) continue;
        const metres = metresBetween(stops[i], stops[j]);
        if (metres > WALK_METRES) continue;
        const walk = Math.max(30, Math.round(metres / WALK_SPEED));
        walkFrom.push(i, j);
        walkTo.push(j, i);
        walkSeconds.push(walk, walk);
      }
    }
  }
}

/* ------------------------------------------------------------------ the search */

const STOP_COUNT = stops.length;
const INF = 2 ** 30;

/*
 * The search itself is imported, not copied: `scripts/routing/scan.mjs` is the one implementation,
 * used here, by the graph builder and (from step 2) by the app. An experiment that measured a
 * different algorithm from the one that ships would measure nothing useful.
 */
const scanner = createScanner({
  ...C,
  walkFrom: Uint32Array.from(walkFrom),
  walkTo: Uint32Array.from(walkTo),
  walkSeconds: Uint16Array.from(walkSeconds),
  stopCount: STOP_COUNT,
  tripCount: tripIndex.size,
  minTransferSeconds: MIN_TRANSFER_SECONDS,
});

function search(origin, destination, startTime) {
  const found = scanner.search(origin, destination, startTime, WINDOW_SECONDS);
  return found ? found.seconds : null;
}

const findStop = (fragment) => {
  const needle = fragment.toLowerCase();
  const hit = stops
    .map((stop, index) => ({ stop, index }))
    .filter(({ stop }) => stop.name.toLowerCase().includes(needle) && /centraal|station|cs/i.test(stop.name))
    .sort((a, b) => a.stop.name.length - b.stop.name.length)[0];
  return hit;
};

const origin = findStop('Utrecht Centraal');

/* A region run can only test stops inside the region, so the pairs follow the scope rather than
 * being fixed: the same script has to be able to answer for one province and for the country. */
const planned = national
  ? [
      ['Utrecht Centraal → Amsterdam Centraal', 'Amsterdam Centraal'],
      ['Amsterdam Centraal → Rotterdam Centraal', 'Rotterdam Centraal'],
      ['Utrecht Centraal → Groningen', 'Groningen'],
    ]
  : [
      ['Utrecht Centraal → Amersfoort', 'Amersfoort'],
      ['Utrecht Centraal → Hilversum', 'Hilversum'],
      ['Utrecht Centraal → Woerden', 'Woerden'],
    ];

if (!origin) {
  console.error('could not find Utrecht Centraal in this scope');
  process.exit(1);
}

const queries = planned
  .map(([label, destination]) => [label, origin, findStop(destination), 8 * 3600])
  .filter(([, , destination]) => {
    if (!destination) console.log(`(skipping a pair: no stop matching that name in this scope)`);
    return Boolean(destination);
  });

if (queries.length === 0) {
  console.error('no test pairs could be found in this scope');
  process.exit(1);
}

const results = [];
for (const [label, a, b, start] of queries) {
  const timings = [];
  let answer = null;
  for (let run = 0; run < 5; run += 1) {
    const began = process.hrtime.bigint();
    answer = search(a.index, b.index, start);
    timings.push(Number(process.hrtime.bigint() - began) / 1e6);
  }
  timings.sort((x, y) => x - y);
  results.push({
    query: label,
    origin: a.stop.name,
    destination: b.stop.name,
    medianMs: Number(timings[2].toFixed(2)),
    bestMs: Number(timings[0].toFixed(2)),
    arrival: answer === null ? null : `${String(Math.floor(answer / 3600)).padStart(2, '0')}:${String(Math.floor(answer / 60) % 60).padStart(2, '0')}`,
  });
}

const graphBytes = C.dep.length * (4 * 5) + (walkFrom.length * 4 + walkSeconds.length * 4);

const report = {
  measuredAt: new Date().toISOString(),
  scope: national ? 'national' : 'region',
  date: DATE,
  stops: stops.length,
  trips: tripIndex.size,
  connections: C.dep.length,
  walkingLinks: walkFrom.length / 2,
  graphBytes,
  graphMiB: Number((graphBytes / 1048576).toFixed(1)),
  stopTimesRead: rowsRead,
  windowHours: WINDOW_HOURS,
  results,
  budget: { freeCpuMsPerRequest: 10, freeMemoryMb: 128 },
  note: 'Measured in Node on this machine. A Worker is a different engine, so these are the best available estimate, not a Worker measurement.',
};

fs.mkdirSync('routing', { recursive: true });
const out = `routing/feasibility-${report.scope}${WINDOW_HOURS ? `-${WINDOW_HOURS}h` : ''}.json`;
fs.writeFileSync(out, JSON.stringify(report, null, 2));

console.log(`scope: ${report.scope} · date ${DATE}`);
console.log(`stops ${stops.length.toLocaleString('en')} · trips ${tripIndex.size.toLocaleString('en')} · connections ${C.dep.length.toLocaleString('en')} · walk links ${(walkFrom.length / 2).toLocaleString('en')}`);
console.log(`graph ${report.graphMiB} MiB · stop_times read ${rowsRead.toLocaleString('en')}`);
for (const r of results) console.log(`  ${r.query}: arrive ${r.arrival ?? 'NO ROUTE'} · median ${r.medianMs} ms · best ${r.bestMs} ms`);
console.log(`wrote ${out}`);
