#!/usr/bin/env node
/**
 * **The graph builder — the timetable, turned into something a free function can search.**
 *
 *   node scripts/gtfs/build-graph.mjs            # build
 *   node scripts/gtfs/build-graph.mjs --verify   # build is not trusted until it reads itself back
 *
 * Input is the verified archive the timetable pipeline has already downloaded and checked. Output
 * is static files under `public/graph/`:
 *
 *   manifest.json      what was built, from which feed, and what each file contains
 *   stops.json         the stops a journey can start or end at, with real names and coordinates
 *   walks.bin          walking links between stops within 400 m, both directions
 *   slice-HH.bin       connections departing in a two-hour slice, sorted by departure
 *
 * Two-hour slices exist because of a measurement, not a preference: a national search over a whole
 * day costs about 30 ms of processor time and a free function allows 10. A two-hour slice brings it
 * to roughly 7–9.5 ms. A request fetches only the slices it needs, and fetching a file costs no
 * processor time.
 *
 * A connection is 20 bytes, little-endian: departure stop, arrival stop, departure time, arrival
 * time, trip — all unsigned 32-bit.
 */
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { createScanner } from '../routing/scan.mjs';

const CACHE = '.gtfs-cache';
const OUT_DIR = 'public/graph';
const SLICE_SECONDS = 2 * 3600;
const MIN_TRANSFER_SECONDS = 120;
const WALK_METRES = 400;
const WALK_SPEED = 1.25;
const RECORD_BYTES = 20;
const verify = process.argv.includes('--verify');

const current = JSON.parse(fs.readFileSync(path.join(CACHE, 'current.json'), 'utf8'));
const archive = path.join(CACHE, current.dataset);
/*
 * Build for a day the feed actually covers, today by default. The first version always used the
 * feed's first service day, which was already in the past, and refused to build at all — the right
 * refusal, aimed at the wrong date.
 */
const stamp = (date) => `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
const firstDay = current.validity.from.replace(/-/g, '');
const lastDay = current.validity.until.replace(/-/g, '');
const askedFor = process.argv.find((a) => a.startsWith('--date='))?.slice(7);
const todayStamp = stamp(new Date());
const serviceDate = askedFor ?? (todayStamp >= firstDay && todayStamp <= lastDay ? todayStamp : firstDay);
if (serviceDate < firstDay || serviceDate > lastDay) {
  console.error(`the feed covers ${firstDay} to ${lastDay} and this graph was asked for ${serviceDate}; run npm run gtfs:update`);
  process.exit(1);
}

/* ------------------------------------------------------------------ reading the archive */

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
  stopIndex.set(row.stop_id, stops.length);
  stops.push({ id: row.stop_id, name: row.stop_name, lat: Number(lat.toFixed(6)), lon: Number(lon.toFixed(6)) });
}

/* services running on the target date ------------------------------------ */
const services = new Set();
for await (const row of table('calendar_dates.txt')) {
  if (row.date === serviceDate && row.exception_type === '1') services.add(row.service_id);
}
if (services.size === 0) {
  console.error(`no services run on ${serviceDate}; refusing to build an empty graph`);
  process.exit(1);
}

/* trips ------------------------------------------------------------------ */
const tripIndex = new Map();
for await (const row of table('trips.txt')) {
  if (services.has(row.service_id)) tripIndex.set(row.trip_id, tripIndex.size);
}

/* connections ------------------------------------------------------------ */
const rawFrom = [];
const rawTo = [];
const rawDep = [];
const rawArr = [];
const rawTrip = [];
let stopTimesRead = 0;
let previousTrip = null;
let previousStop = -1;
let previousTime = 0;

for await (const row of table('stop_times.txt')) {
  stopTimesRead += 1;
  const tripNumber = tripIndex.get(row.trip_id);
  if (tripNumber === undefined) {
    previousTrip = null;
    continue;
  }
  const stop = stopIndex.get(row.stop_id);
  const arrival = seconds(row.arrival_time || row.departure_time);
  const departure = seconds(row.departure_time || row.arrival_time);

  if (previousTrip === tripNumber && previousStop >= 0 && stop !== undefined && arrival > previousTime) {
    rawFrom.push(previousStop);
    rawTo.push(stop);
    rawDep.push(previousTime);
    rawArr.push(arrival);
    rawTrip.push(tripNumber);
  }
  previousTrip = tripNumber;
  previousStop = stop ?? -1;
  previousTime = departure;
}

const order = Uint32Array.from({ length: rawDep.length }, (_, index) => index);
const sorted = Array.from(order).sort((a, b) => rawDep[a] - rawDep[b]);

/* walking links between genuinely close stops ----------------------------- */
const walkFrom = [];
const walkTo = [];
const walkSeconds = [];
const cellOf = (value) => Math.floor((value * 1000) / 250);
const grid = new Map();
for (let i = 0; i < stops.length; i += 1) {
  const key = `${cellOf(stops[i].lat)}:${cellOf(stops[i].lon)}`;
  if (!grid.has(key)) grid.set(key, []);
  grid.get(key).push(i);
}
const metresBetween = (a, b) => {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat = (((a.lat + b.lat) / 2) * Math.PI) / 180;
  return Math.hypot(dLat * R, dLon * R * Math.cos(lat));
};
for (let i = 0; i < stops.length; i += 1) {
  const cx = cellOf(stops[i].lat);
  const cy = cellOf(stops[i].lon);
  for (let dx = -1; dx <= 1; dx += 1) {
    for (let dy = -1; dy <= 1; dy += 1) {
      for (const j of grid.get(`${cx + dx}:${cy + dy}`) ?? []) {
        if (j <= i) continue;
        const metres = metresBetween(stops[i], stops[j]);
        if (metres > WALK_METRES) continue;
        const walk = Math.min(65535, Math.max(30, Math.round(metres / WALK_SPEED)));
        walkFrom.push(i, j);
        walkTo.push(j, i);
        walkSeconds.push(walk, walk);
      }
    }
  }
}

/* ------------------------------------------------------------------ writing */

fs.rmSync(OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

const sha = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');

/* Not `Math.max(...rawDep)`: a million-odd arguments overflow the stack. A loop does not. */
let latestDeparture = 0;
for (const departure of rawDep) if (departure > latestDeparture) latestDeparture = departure;
const sliceCount = Math.ceil((latestDeparture + 1) / SLICE_SECONDS);
const buckets = Array.from({ length: sliceCount }, () => []);
for (const source of sorted) buckets[Math.floor(rawDep[source] / SLICE_SECONDS)].push(source);

const slices = [];
for (let index = 0; index < buckets.length; index += 1) {
  const members = buckets[index];
  if (members.length === 0) continue;
  const buffer = Buffer.alloc(members.length * RECORD_BYTES);
  members.forEach((source, position) => {
    const at = position * RECORD_BYTES;
    buffer.writeUInt32LE(rawFrom[source], at);
    buffer.writeUInt32LE(rawTo[source], at + 4);
    buffer.writeUInt32LE(rawDep[source], at + 8);
    buffer.writeUInt32LE(rawArr[source], at + 12);
    buffer.writeUInt32LE(rawTrip[source], at + 16);
  });
  const from = index * SLICE_SECONDS;
  const file = `slice-${String(index).padStart(2, '0')}.bin`;
  fs.writeFileSync(path.join(OUT_DIR, file), buffer);
  slices.push({
    from,
    to: from + SLICE_SECONDS,
    file,
    connections: members.length,
    bytes: buffer.length,
    sha256: sha(buffer),
  });
}

const walks = Buffer.alloc(walkFrom.length * 10);
walkFrom.forEach((value, index) => {
  walks.writeUInt32LE(value, index * 10);
  walks.writeUInt32LE(walkTo[index], index * 10 + 4);
  walks.writeUInt16LE(walkSeconds[index], index * 10 + 8);
});
fs.writeFileSync(path.join(OUT_DIR, 'walks.bin'), walks);

/* ------------------------------------------------------------------ routes, for a faster search
 *
 * The connection scan reads every connection in the slice: about 140,000 in the middle of the day,
 * which is more than a free function's 10 ms allows. A round-based search instead visits *routes*:
 * it stands at a stop it has actually reached, takes the first departure it can catch, and jumps
 * along that route. That is a fraction of the connections, so this is what the graph must carry.
 *
 * A **pattern** is one direction of a line: the order stops are served in. Every trip that serves
 * exactly that order belongs to it, with its own start time and running times. Trips are sorted by
 * start time so the first catchable one can be found without reading them all.
 */
const chains = new Map();
for (let index = 0; index < rawFrom.length; index += 1) {
  const tripNumber = rawTrip[index];
  let chain = chains.get(tripNumber);
  if (!chain) {
    chain = { stops: [rawFrom[index]], times: [rawDep[index]] };
    chains.set(tripNumber, chain);
  }
  chain.stops.push(rawTo[index]);
  chain.times.push(rawArr[index]);
}

const patterns = new Map();
for (const chain of chains.values()) {
  const key = chain.stops.join(',');
  let pattern = patterns.get(key);
  if (!pattern) {
    pattern = { stops: chain.stops, trips: [] };
    patterns.set(key, pattern);
  }
  const start = chain.times[0];
  pattern.trips.push({ start, offsets: chain.times.map((time) => time - start) });
}
const patternList = [...patterns.values()].sort((a, b) => b.trips.length - a.trips.length);
for (const pattern of patternList) pattern.trips.sort((a, b) => a.start - b.start);

/* patterns.bin: a count, where each pattern starts, each pattern's largest running time, then the
 * patterns themselves — stop order, trip count, and per trip a start time and its offsets. */
const patternOffsets = new Uint32Array(patternList.length);
const patternLargest = new Uint32Array(patternList.length);
let patternCursor = 0;
const patternBlobs = patternList.map((pattern, index) => {
  const stopsInPattern = pattern.stops.length;
  let largest = 0;
  for (const trip of pattern.trips) for (const offset of trip.offsets) if (offset > largest) largest = offset;
  patternOffsets[index] = patternCursor;
  patternLargest[index] = largest;
  /* Layout: stop count, stops, trip count, every trip's start time, then every trip's offsets.
   * Start times and offsets are separate blocks on purpose: the search reads start times with a
   * binary search and offsets by position, and interleaving them would make both awkward. */
  /*
   * The largest running time **at each position** is stored, not one figure for the whole pattern.
   * A search asks "which trip is the first I could catch at this stop?", and the answer decides how
   * far back to start looking. Using the pattern's largest time made that start far too early on long
   * routes and turned a fast search into a slow one.
   */
  const largestByPosition = new Uint32Array(stopsInPattern);
  for (const trip of pattern.trips) {
    for (let position = 0; position < stopsInPattern; position += 1) {
      if (trip.offsets[position] > largestByPosition[position]) largestByPosition[position] = trip.offsets[position];
    }
  }
  const size = 4 + stopsInPattern * 4 + stopsInPattern * 4 + 4 + pattern.trips.length * 4 + pattern.trips.length * stopsInPattern * 4;
  const blob = Buffer.alloc(size);
  let at = 0;
  blob.writeUInt32LE(stopsInPattern, at);
  at += 4;
  for (const stop of pattern.stops) {
    blob.writeUInt32LE(stop, at);
    at += 4;
  }
  for (const largest of largestByPosition) {
    blob.writeUInt32LE(largest, at);
    at += 4;
  }
  blob.writeUInt32LE(pattern.trips.length, at);
  at += 4;
  for (const trip of pattern.trips) {
    blob.writeUInt32LE(trip.start, at);
    at += 4;
  }
  for (const trip of pattern.trips) {
    for (const offset of trip.offsets) {
      blob.writeUInt32LE(offset, at);
      at += 4;
    }
  }
  patternCursor += size;
  return blob;
});

const patternHeader = Buffer.alloc(4 + patternList.length * 8);
patternHeader.writeUInt32LE(patternList.length, 0);
for (let index = 0; index < patternList.length; index += 1) {
  patternHeader.writeUInt32LE(patternOffsets[index], 4 + index * 4);
  patternHeader.writeUInt32LE(patternLargest[index], 4 + patternList.length * 4 + index * 4);
}
const patternsBuffer = Buffer.concat([patternHeader, ...patternBlobs]);
fs.writeFileSync(path.join(OUT_DIR, 'patterns.bin'), patternsBuffer);

/* index.bin: for every stop, the patterns that serve it and where along them. A search standing at a
 * stop needs this to know which routes are worth looking at, and nothing else. */
const indexCounts = new Uint32Array(stops.length);
for (const pattern of patternList) for (const stop of pattern.stops) indexCounts[stop] += 1;
const indexCursor = new Uint32Array(stops.length);
let runningTotal = 0;
for (let stop = 0; stop < stops.length; stop += 1) {
  indexCursor[stop] = runningTotal;
  runningTotal += indexCounts[stop];
}
const indexEntries = new Uint32Array(runningTotal * 2);
const indexFill = Uint32Array.from(indexCursor);
patternList.forEach((pattern, patternNumber) => {
  pattern.stops.forEach((stop, position) => {
    const slot = indexFill[stop] += 1;
    indexEntries[(slot - 1) * 2] = patternNumber;
    indexEntries[(slot - 1) * 2 + 1] = position;
  });
});
const indexBuffer = Buffer.alloc(4 + stops.length * 4 + indexEntries.length * 4);
indexBuffer.writeUInt32LE(stops.length, 0);
for (let stop = 0; stop < stops.length; stop += 1) indexBuffer.writeUInt32LE(indexCounts[stop], 4 + stop * 4);
for (let entry = 0; entry < indexEntries.length; entry += 1) {
  indexBuffer.writeUInt32LE(indexEntries[entry], 4 + stops.length * 4 + entry * 4);
}
fs.writeFileSync(path.join(OUT_DIR, 'index.bin'), indexBuffer);

/* A pattern must account for exactly the connections the slices hold, or the two searches would be
 * looking at different timetables. */
let patternConnections = 0;
for (const pattern of patternList) patternConnections += pattern.trips.length * (pattern.stops.length - 1);
if (patternConnections !== rawFrom.length) {
  console.error(`patterns describe ${patternConnections} connections but the slices hold ${rawFrom.length}`);
  process.exit(1);
}

const stopsBuffer = Buffer.from(
  JSON.stringify(stops.map((stop) => [stop.id, stop.name, stop.lat, stop.lon])),
);
fs.writeFileSync(path.join(OUT_DIR, 'stops.json'), stopsBuffer);

const manifest = {
  version: 1,
  builtAt: new Date().toISOString(),
  feed: { dataset: current.dataset, sha256: current.sha256, validity: current.validity, serviceDate },
  stops: { file: 'stops.json', count: stops.length, bytes: stopsBuffer.length, sha256: sha(stopsBuffer) },
  walks: {
    file: 'walks.bin',
    links: walkFrom.length,
    metresCap: WALK_METRES,
    bytes: walks.length,
    sha256: sha(walks),
  },
  slices: { seconds: SLICE_SECONDS, recordBytes: RECORD_BYTES, files: slices },
  patterns: {
    file: 'patterns.bin',
    indexFile: 'index.bin',
    count: patternList.length,
    stopEntries: indexEntries.length / 2,
    bytes: patternsBuffer.length,
    indexBytes: indexBuffer.length,
    sha256: sha(patternsBuffer),
    indexSha256: sha(indexBuffer),
  },
  connections: slices.reduce((sum, slice) => sum + slice.connections, 0),
  trips: tripIndex.size,
  stopTimesRead,
  minTransferSeconds: MIN_TRANSFER_SECONDS,
  graphBytes: slices.reduce((sum, slice) => sum + slice.bytes, 0) + walks.length,
};
/* Written last, so a half-built graph is never mistaken for a complete one. */
fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));

console.log(`graph for ${serviceDate}: ${stops.length.toLocaleString('en')} stops · ${tripIndex.size.toLocaleString('en')} trips · ${manifest.connections.toLocaleString('en')} connections · ${walkFrom.length.toLocaleString('en')} walking links`);
console.log(`${slices.length} slices of ${SLICE_SECONDS / 3600} h, ${(manifest.graphBytes / 1048576).toFixed(1)} MiB total`);
console.log(`${patternList.length.toLocaleString('en')} patterns · ${indexEntries.length.toLocaleString('en')} stop positions · patterns.bin ${(patternsBuffer.length / 1048576).toFixed(1)} MiB · index.bin ${(indexBuffer.length / 1048576).toFixed(1)} MiB`);
for (const slice of slices) {
  const at = `${String(slice.from / 3600).padStart(2, '0')}:00`;
  console.log(`  ${slice.file} ${at} · ${slice.connections.toLocaleString('en')} connections · ${(slice.bytes / 1048576).toFixed(2)} MiB`);
}

/* ------------------------------------------------------------------ reading it back */

if (verify) {
  const read = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'manifest.json'), 'utf8'));
  const readStops = JSON.parse(fs.readFileSync(path.join(OUT_DIR, read.stops.file), 'utf8'));
  const failures = [];

  if (readStops.length !== read.stops.count) failures.push(`stop count ${readStops.length} != manifest ${read.stops.count}`);

  for (const slice of read.slices.files) {
    const buffer = fs.readFileSync(path.join(OUT_DIR, slice.file));
    if (buffer.length !== slice.bytes) failures.push(`${slice.file} is ${buffer.length} bytes, manifest says ${slice.bytes}`);
    if (sha(buffer) !== slice.sha256) failures.push(`${slice.file} hash does not match the manifest`);
    if (buffer.length % RECORD_BYTES !== 0) failures.push(`${slice.file} is not a whole number of connections`);
    let previous = -1;
    for (let at = 0; at < buffer.length; at += RECORD_BYTES) {
      const fromStop = buffer.readUInt32LE(at);
      const toStop = buffer.readUInt32LE(at + 4);
      const departure = buffer.readUInt32LE(at + 8);
      const arrivalTime = buffer.readUInt32LE(at + 12);
      if (fromStop >= read.stops.count || toStop >= read.stops.count) failures.push(`${slice.file} references a stop outside the stop list`);
      if (arrivalTime <= departure) failures.push(`${slice.file} has a connection that does not move forward in time`);
      if (departure < slice.from || departure >= slice.to) failures.push(`${slice.file} has a departure outside its slice`);
      if (departure < previous) failures.push(`${slice.file} is not sorted by departure`);
      previous = departure;
    }
  }

  const walksBuffer = fs.readFileSync(path.join(OUT_DIR, read.walks.file));
  if (sha(walksBuffer) !== read.walks.sha256) failures.push('walks.bin hash does not match the manifest');
  if (walksBuffer.length !== read.walks.links * 10) failures.push('walks.bin is not the length the manifest claims');

  /* One real journey, so the graph is proven to answer and not merely to parse. */
  const searched = createScanner({
    ...loadTwoSlices(read, 8 * 3600, 11 * 3600),
    stopCount: readStops.length,
    tripCount: read.trips,
    minTransferSeconds: read.minTransferSeconds,
  });
  const findStop = (fragment) => readStops.findIndex(([, name]) => name.toLowerCase().includes(fragment) && /centraal/i.test(name));
  const origin = findStop('utrecht centraal');
  const destination = findStop('amsterdam centraal');
  if (origin < 0 || destination < 0) failures.push('the test stations are not in the graph');
  else {
    const answer = searched.search(origin, destination, 8 * 3600, 3 * 3600);
    const clock = (value) => `${String(Math.floor(value / 3600)).padStart(2, '0')}:${String(Math.floor(value / 60) % 60).padStart(2, '0')}`;
    /*
     * The exact arrival differs by service day — Saturday and Sunday do not run the same timetable —
     * so the check is that a real journey exists and is plausible, not that it equals the number the
     * Saturday experiment saw. The experiment's own comparison lives in `scripts/routing/feasibility.mjs`.
     */
    const latestPlausible = 8 * 3600 + 4 * 3600;
    if (!answer) failures.push('Utrecht Centraal to Amsterdam Centraal found no journey in the rebuilt graph');
    else if (answer.seconds <= 8 * 3600 || answer.seconds > latestPlausible) failures.push(`Utrecht to Amsterdam arrives ${clock(answer.seconds)}, which is not a plausible morning journey`);
    else console.log(`verify: Utrecht Centraal → Amsterdam Centraal from 08:00 arrives ${clock(answer.seconds)}`);
  }

  if (failures.length > 0) {
    console.error('\ngraph verification FAILED:');
    for (const failure of failures.slice(0, 20)) console.error(`  - ${failure}`);
    process.exit(1);
  }
  console.log(`verify: ${read.slices.files.length} slices, ${read.walks.links.toLocaleString('en')} walking links, hashes and ordering all check out`);
}

/** Reads the slice files a journey window needs, as typed arrays the scanner understands. */
function loadTwoSlices(manifestData, fromSeconds, toSeconds) {
  const needed = manifestData.slices.files.filter((slice) => slice.to > fromSeconds && slice.from < toSeconds);
  const total = needed.reduce((sum, slice) => sum + slice.connections, 0);
  const from = new Uint32Array(total);
  const to = new Uint32Array(total);
  const dep = new Uint32Array(total);
  const arr = new Uint32Array(total);
  const trip = new Uint32Array(total);
  let at = 0;
  for (const slice of needed) {
    const buffer = fs.readFileSync(path.join(OUT_DIR, slice.file));
    for (let offset = 0; offset < buffer.length; offset += RECORD_BYTES) {
      from[at] = buffer.readUInt32LE(offset);
      to[at] = buffer.readUInt32LE(offset + 4);
      dep[at] = buffer.readUInt32LE(offset + 8);
      arr[at] = buffer.readUInt32LE(offset + 12);
      trip[at] = buffer.readUInt32LE(offset + 16);
      at += 1;
    }
  }
  const walksBuffer = fs.readFileSync(path.join(OUT_DIR, manifestData.walks.file));
  const links = manifestData.walks.links;
  const walkFrom = new Uint32Array(links);
  const walkTo = new Uint32Array(links);
  const walkSeconds = new Uint16Array(links);
  for (let index = 0; index < links; index += 1) {
    walkFrom[index] = walksBuffer.readUInt32LE(index * 10);
    walkTo[index] = walksBuffer.readUInt32LE(index * 10 + 4);
    walkSeconds[index] = walksBuffer.readUInt16LE(index * 10 + 8);
  }
  return { from, to, dep, arr, trip, walkFrom, walkTo, walkSeconds };
}
