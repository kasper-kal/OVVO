#!/usr/bin/env node
/**
 * **Keep the local timetable out of the Worker upload.**
 *
 * `public/graph/` is the development fallback: 455 MB of timetable files that the
 * app only needs when it is not reading the published month on GitHub Pages. Vite
 * copies the whole public folder into `dist/`, so without this step a deploy would
 * upload every local day as a Worker static asset.
 *
 * The deploy command runs this after the build and before `wrangler deploy`. A
 * missing `dist/graph` is fine; if the folder is still there after removal, the
 * command fails rather than letting the upload continue.
 */
import { existsSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';

const graph = 'dist/graph';

function sizeOf(dir) {
  return readdirSync(dir, { withFileTypes: true }).reduce((total, entry) => {
    const full = join(dir, entry.name);
    return total + (entry.isDirectory() ? sizeOf(full) : statSync(full).size);
  }, 0);
}

if (!existsSync(graph)) {
  console.log('No local graph in dist; nothing to exclude.');
  process.exit(0);
}

const megabytes = (sizeOf(graph) / 1024 / 1024).toFixed(0);
rmSync(graph, { recursive: true, force: true });

if (existsSync(graph)) {
  console.error(`FAILED: ${graph} is still present after removal; refusing to deploy.`);
  process.exit(1);
}

console.log(`Excluded ${megabytes} MB local timetable graph from the deploy.`);
