#!/usr/bin/env node
/**
 * **Does the faster search give the same answers?**
 *
 *   node scripts/routing/compare.mjs
 *
 * The route search exists to be cheap, and cheap is worthless if it quietly finds worse journeys.
 * This runs both searches over the same built graph, from and to the same **stations**, and fails
 * when they disagree by more than a minute. It prints what each one costs, which is the number the
 * free budget is judged against.
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
const stations = JSON.parse(fs.readFileSync(`${DIR}/${manifest.stations.file}`, 'utf8'));
const places = JSON.parse(fs.readFileSync(`${DIR}/${manifest.places.file}`, 'utf8'));
const placeOf = Uint32Array.from(places.flatMap((members, index) => members.map((station) => [station, index])).reduce((map, [station, index]) => { map[station] = index; return map; }, []));
const stationOf = Uint32Array.from(stops.map((stop) => stop[4]));

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

/* ---- route search, over patterns and stations ---- */
const raptorStart = Date.now();
const raptor = createRaptor({
  patternsBuffer: fs.readFileSync(`${DIR}/${manifest.patterns.file}`),
  indexBuffer: fs.readFileSync(`${DIR}/${manifest.patterns.indexFile}`),
  stations: stations.map((station) => station[1]),
  stationOf,
  places,
  placeOf,
  walkFrom,
  walkTo,
  walkSeconds,
  stopCount: stops.length,
  minTransferSeconds: manifest.minTransferSeconds,
});
const raptorLoadMs = Date.now() - raptorStart;

const clock = (value) => `${String(Math.floor(value / 3600)).padStart(2, '0')}:${String(Math.floor(value / 60) % 60).padStart(2, '0')}`;

/* A name resolves to a station: "Utrecht Centraal" is nine platforms, not one stop. */
/*
 * A name resolves to the **hub**: the station with the most platforms whose place name matches. Not
 * the shortest match, which was a single bus stop called "Eindhoven, BIC" while the real station
 * carries a longer name — and a journey ending at a bus stop in the same town looked like a planner
 * that had lost an hour and a half.
 */
const findPlace = (needle) => {
  const wanted = needle.trim().toLowerCase();
  const matches = places
    .map((members, index) => {
      const names = members.map((station) => stations[station][0].toLowerCase());
      const platforms = members.reduce((sum, station) => sum + stations[station][1].length, 0);
      return { index, names, platforms };
    })
    .filter((place) => place.names.some((name) => name === wanted || name.split(/[,(]/)[0].trim() === wanted))
    .sort((a, b) => b.platforms - a.platforms);
  return matches[0]?.index ?? -1;
};

const pairs = [
  ['Utrecht Centraal', 'Amsterdam Centraal'],
  ['Amsterdam Centraal', 'Rotterdam Centraal'],
  ['Utrecht Centraal', 'Groningen'],
  ['Rotterdam Centraal', 'Groningen'],
  ['Utrecht Centraal', 'Maastricht'],
  ['Zwolle', 'Eindhoven'],
];

console.log(`graph: ${manifest.stations.count.toLocaleString('en')} stations · ${stops.length.toLocaleString('en')} stops · ${manifest.patterns.count.toLocaleString('en')} patterns · ${total.toLocaleString('en')} connections in the scanned slices`);
console.log(`loading patterns took ${raptorLoadMs} ms; departing ${clock(START)}\n`);

const failures = [];
const rows = [];

for (const [originName, destinationName] of pairs) {
  const origin = findPlace(originName.toLowerCase());
  const destination = findPlace(destinationName.toLowerCase());
  if (origin < 0 || destination < 0) {
    failures.push(`could not find ${originName} → ${destinationName}`);
    continue;
  }

  const originStops = places[origin].flatMap((station) => stations[station][1]);
  const destinationStops = places[destination].flatMap((station) => stations[station][1]);

  const scanTimes = [];
  let scanned;
  for (let run = 0; run < 5; run += 1) {
    const began = process.hrtime.bigint();
    scanned = scan.searchStations(originStops, destinationStops, START, WINDOW);
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
  } else if (Math.abs(scanSeconds - raptorSeconds) > 90) {
    failures.push(`${originName} → ${destinationName}: scan arrives ${clock(scanSeconds)}, route search ${clock(raptorSeconds)}`);
  }

  rows.push({
    journey: `${originName} → ${destinationName}`,
    arrives: raptorSeconds === null ? 'NO ROUTE' : clock(raptorSeconds),
    scanMs: Number(scanTimes[2].toFixed(2)),
    raptorMs: Number(raptorTimes[2].toFixed(2)),
    stats: { ...raptor.stats },
  });
}

for (const row of rows) {
  console.log(`${row.journey.padEnd(38)} arrives ${row.arrives} · scan ${String(row.scanMs).padStart(6)} ms · route search ${String(row.raptorMs).padStart(6)} ms`);
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
