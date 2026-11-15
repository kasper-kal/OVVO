#!/usr/bin/env node
/**
 * **Does the faster search give the same answers?**
 *
 *   node scripts/routing/compare.mjs
 *
 * The route search exists to be cheap, and cheap is worthless if it quietly finds worse journeys.
 * So this runs both searches over the same built graph and the same departures, and fails loudly
 * when they disagree by more than a rounding minute. It also prints what each one costs, which is
 * the number the free budget is judged against.
 */
import fs from 'node:fs';
import { createScanner } from './scan.mjs';
import { createRaptor } from './raptor.mjs';

const DIR = 'public/graph';
const RECORD_BYTES = 20;
const START = 8 * 3600;
const WINDOW = 6 * 3600;

const manifest = JSON.parse(fs.readFileSync(`${DIR}/manifest.json`, 'utf8'));
const stops = JSON.parse(fs.readFileSync(`${DIR}/${manifest.stops.file}`, 'utf8'));

/* ---- connection scan, over the slices a request would fetch ---- */
const slices = manifest.slices.files.filter((slice) => slice.to > START && slice.from < START + WINDOW);
const sliceBuffers = slices.map((slice) => fs.readFileSync(`${DIR}/${slice.file}`));
const total = sliceBuffers.reduce((sum, buffer) => sum + buffer.length / RECORD_BYTES, 0);
const csFrom = new Uint32Array(total);
const csTo = new Uint32Array(total);
const csDep = new Uint32Array(total);
const csArr = new Uint32Array(total);
const csTrip = new Uint32Array(total);
let slot = 0;
for (const buffer of sliceBuffers) {
  for (let at = 0; at < buffer.length; at += RECORD_BYTES) {
    csFrom[slot] = buffer.readUInt32LE(at);
    csTo[slot] = buffer.readUInt32LE(at + 4);
    csDep[slot] = buffer.readUInt32LE(at + 8);
    csArr[slot] = buffer.readUInt32LE(at + 12);
    csTrip[slot] = buffer.readUInt32LE(at + 16);
    slot += 1;
  }
}

const walksBuffer = fs.readFileSync(`${DIR}/${manifest.walks.file}`);
const links = manifest.walks.links;
const walkFrom = new Uint32Array(links);
const walkTo = new Uint32Array(links);
const walkSeconds = new Uint16Array(links);
for (let index = 0; index < links; index += 1) {
  walkFrom[index] = walksBuffer.readUInt32LE(index * 10);
  walkTo[index] = walksBuffer.readUInt32LE(index * 10 + 4);
  walkSeconds[index] = walksBuffer.readUInt16LE(index * 10 + 8);
}

const scan = createScanner({
  from: csFrom,
  to: csTo,
  dep: csDep,
  arr: csArr,
  trip: csTrip,
  walkFrom,
  walkTo,
  walkSeconds,
  stopCount: stops.length,
  tripCount: manifest.trips,
  minTransferSeconds: manifest.minTransferSeconds,
});

/* ---- route search, over patterns ---- */
const raptorStart = Date.now();
const raptor = createRaptor({
  patternsBuffer: fs.readFileSync(`${DIR}/${manifest.patterns.file}`),
  indexBuffer: fs.readFileSync(`${DIR}/${manifest.patterns.indexFile}`),
  walkFrom,
  walkTo,
  walkSeconds,
  stopCount: stops.length,
  minTransferSeconds: manifest.minTransferSeconds,
});
const raptorLoadMs = Date.now() - raptorStart;

const clock = (value) => `${String(Math.floor(value / 3600)).padStart(2, '0')}:${String(Math.floor(value / 60) % 60).padStart(2, '0')}`;
const findStop = (needle) => {
  const matches = stops
    .map((stop, index) => ({ index, name: stop[1].toLowerCase() }))
    .filter((stop) => stop.name.includes(needle));
  const central = matches.find((stop) => stop.name.includes('centraal'));
  return (central ?? matches[0])?.index ?? -1;
};

const pairs = [
  ['Utrecht Centraal', 'Amsterdam Centraal'],
  ['Amsterdam Centraal', 'Rotterdam Centraal'],
  ['Utrecht Centraal', 'Groningen'],
  ['Rotterdam Centraal', 'Groningen'],
  ['Utrecht Centraal', 'Maastricht'],
  ['Zwolle', 'Eindhoven'],
];

console.log(`graph: ${manifest.stops.count.toLocaleString('en')} stops · ${manifest.patterns.count.toLocaleString('en')} patterns · ${manifest.patterns.stopEntries.toLocaleString('en')} stop positions · ${total.toLocaleString('en')} connections in the scanned slices`);
console.log(`loading patterns took ${raptorLoadMs} ms; departing ${clock(START)}\n`);

const failures = [];
const rows = [];

for (const [originName, destinationName] of pairs) {
  const origin = findStop(originName.toLowerCase());
  const destination = findStop(destinationName.toLowerCase());
  if (origin < 0 || destination < 0) {
    failures.push(`could not find ${originName} → ${destinationName}`);
    continue;
  }

  const scanTimes = [];
  let scanned;
  for (let run = 0; run < 5; run += 1) {
    const began = process.hrtime.bigint();
    scanned = scan.search(origin, destination, START, WINDOW);
    scanTimes.push(Number(process.hrtime.bigint() - began) / 1e6);
  }

  const raptorTimes = [];
  let routed;
  for (let run = 0; run < 5; run += 1) {
    const began = process.hrtime.bigint();
    routed = raptor.search(origin, destination, START);
    raptorTimes.push(Number(process.hrtime.bigint() - began) / 1e6);
  }

  scanTimes.sort((a, b) => a - b);
  raptorTimes.sort((a, b) => a - b);

  const scanSeconds = scanned ? scanned.seconds : null;
  const raptorSeconds = routed ? routed.seconds : null;

  if (scanSeconds === null && raptorSeconds === null) {
    failures.push(`${originName} → ${destinationName}: both searches found nothing`);
  } else if (scanSeconds === null || raptorSeconds === null) {
    failures.push(`${originName} → ${destinationName}: scan ${scanSeconds === null ? 'nothing' : clock(scanSeconds)}, route search ${raptorSeconds === null ? 'nothing' : clock(raptorSeconds)}`);
  } else if (Math.abs(scanSeconds - raptorSeconds) > 60) {
    failures.push(`${originName} → ${destinationName}: scan arrives ${clock(scanSeconds)}, route search ${clock(raptorSeconds)}`);
  }

  rows.push({
    journey: `${originName} → ${destinationName}`,
    arrives: raptorSeconds === null ? 'NO ROUTE' : clock(raptorSeconds),
    scanMs: Number(scanTimes[2].toFixed(2)),
    raptorMs: Number(raptorTimes[2].toFixed(2)),
  });
}

for (const row of rows) {
  console.log(`${row.journey.padEnd(38)} arrives ${row.arrives} · scan ${String(row.scanMs).padStart(6)} ms · route search ${String(row.raptorMs).padStart(5)} ms`);
}

fs.mkdirSync('routing', { recursive: true });
fs.writeFileSync(
  'routing/step2-comparison.json',
  JSON.stringify({ measuredAt: new Date().toISOString(), departAt: clock(START), scannedConnections: total, raptorLoadMs, rows, failures }, null, 2),
);

if (failures.length > 0) {
  console.error('\nthe two searches disagree:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
console.log('\nboth searches agree on every journey');
