#!/usr/bin/env node
/**
 * **The list of built service days.**
 *
 *   node scripts/gtfs/graph-index.mjs
 *
 * Every day the graph builder has produced lives in `public/graph/<yyyymmdd>/`. This reads their
 * manifests and writes `public/graph/index.json`, which is how the app knows which days it can plan
 * for, instead of guessing or silently planning a day that was never built.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'public/graph';
const days = [];

for (const entry of fs.readdirSync(ROOT, { withFileTypes: true })) {
  if (!entry.isDirectory() || !/^\d{8}$/.test(entry.name)) continue;
  const manifestPath = path.join(ROOT, entry.name, 'manifest.json');
  if (!fs.existsSync(manifestPath)) continue;
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  days.push({
    date: entry.name,
    stops: manifest.stations?.count ?? 0,
    connections: manifest.connections,
    trips: manifest.trips,
  });
}

days.sort((a, b) => (a.date < b.date ? -1 : 1));
fs.writeFileSync(path.join(ROOT, 'index.json'), JSON.stringify({ builtAt: new Date().toISOString(), days }, null, 2));
console.log(`${days.length} day(s): ${days.map((day) => day.date).join(', ')}`);
