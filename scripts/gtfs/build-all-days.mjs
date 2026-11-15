#!/usr/bin/env node
/**
 * **Build the timetable for the next few service days.**
 *
 *   node scripts/gtfs/build-all-days.mjs [days=2]
 *
 * The feed covers 28 days but one day's graph is about 25–60 MB, so the app is given a small window
 * of days that it can plan for, and says which days it has. Each day is built by the same, verified
 * builder; this only runs it and then refreshes the index the app reads.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const count = Number(process.argv[2] ?? 2);
const current = JSON.parse(fs.readFileSync('.gtfs-cache/current.json', 'utf8'));
const first = current.validity.from.replace(/-/g, '');
const last = current.validity.until.replace(/-/g, '');
const start = new Date();
const stamp = (date) => `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;

let built = 0;
for (let offset = 0; offset < count; offset += 1) {
  const date = stamp(new Date(start.getTime() + offset * 86400000));
  if (date < first || date > last) {
    console.log(`skipping ${date}: outside the feed's validity`);
    continue;
  }
  console.log(`building ${date}…`);
  execFileSync(process.execPath, ['scripts/gtfs/build-graph.mjs', `--date=${date}`], {
    env: { ...process.env, GRAPH_OUT: `public/graph/${date}` },
    stdio: 'inherit',
  });
  built += 1;
}
execFileSync(process.execPath, ['scripts/gtfs/graph-index.mjs'], { stdio: 'inherit' });
console.log(`built ${built} day(s)`);
