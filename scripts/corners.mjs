#!/usr/bin/env node
// Keeper for the corner gallery.
//
// The gallery page lives in .logs (ignored by git), so a stray experiment there
// used to wipe approved shapes with no way back. These three commands make that
// recoverable in one second and catch the kind of silent drift that broke a card
// shape (asymmetric corners) without anyone noticing.
//
//   node scripts/corners.mjs            check the live page against the saved shapes
//   node scripts/corners.mjs --save     save the live page as the approved baseline
//   node scripts/corners.mjs --restore  put the approved baseline back in .logs
//
// Saved files are design/corners.json and design/corners-gallery.html, both
// tracked by git, so the approved shapes also live in history.

import { readFileSync, writeFileSync, copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const PAGE = '.logs/mock/index.html';
const SNAPSHOT = 'design/corners-gallery.html';
const SHAPES = 'design/corners.json';
const W = 440;
const H = 280;

const mode = process.argv[2] || '--check';
let failures = 0;

const fail = (msg) => {
  failures += 1;
  console.log(`FAIL ${msg}`);
};
const ok = (msg) => console.log(`OK   ${msg}`);

const readPaths = (html) => [...html.matchAll(/d="(M[^"]+)"/g)].map((m) => m[1]);
const readCaptions = (html) =>
  [...html.matchAll(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/g)].map((m) =>
    m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(),
  );

/** Turn an absolute SVG path (M/H/V/L/A/Z) into a dense polyline. */
function toPoints(d, perArc = 32) {
  const tokens = d.match(/[MHVLACZ]|-?\d*\.?\d+/g) || [];
  let i = 0;
  let cmd = '';
  let x = 0;
  let y = 0;
  let start = null;
  const points = [];
  const num = () => Number(tokens[i++]);

  while (i < tokens.length) {
    if (/^[MHVLACZ]$/.test(tokens[i])) cmd = tokens[i++];
    if (cmd === 'M') {
      x = num();
      y = num();
      start = [x, y];
      points.push([x, y]);
      cmd = 'L';
    } else if (cmd === 'L') {
      x = num();
      y = num();
      points.push([x, y]);
    } else if (cmd === 'H') {
      x = num();
      points.push([x, y]);
    } else if (cmd === 'V') {
      y = num();
      points.push([x, y]);
    } else if (cmd === 'A') {
      const rx = num();
      const ry = num();
      num(); // rotation
      const largeArc = num();
      const sweep = num();
      const x2 = num();
      const y2 = num();
      points.push(...arcPoints(x, y, rx, ry, largeArc, sweep, x2, y2, perArc));
      x = x2;
      y = y2;
    } else if (cmd === 'Z') {
      if (start) points.push([start[0], start[1]]);
      break;
    } else {
      break;
    }
  }
  return points;
}

/** Endpoint to centre arc conversion, then sampled points (SVG spec F.6.5). */
function arcPoints(x1, y1, rx, ry, largeArc, sweep, x2, y2, n) {
  if (!rx || !ry) return [[x2, y2]];
  const dx2 = (x1 - x2) / 2;
  const dy2 = (y1 - y2) / 2;
  const lam = (dx2 * dx2) / (rx * rx) + (dy2 * dy2) / (ry * ry);
  if (lam > 1) {
    const s = Math.sqrt(lam);
    rx *= s;
    ry *= s;
  }
  const numerator = rx * rx * ry * ry - rx * rx * dy2 * dy2 - ry * ry * dx2 * dx2;
  const denominator = rx * rx * dy2 * dy2 + ry * ry * dx2 * dx2;
  const coef = denominator ? Math.sqrt(Math.max(0, numerator / denominator)) : 0;
  const sign = largeArc === sweep ? -1 : 1;
  const cxp = (sign * coef * (rx * dy2)) / ry;
  const cyp = (sign * coef * (-ry * dx2)) / rx;
  const cx = cxp + (x1 + x2) / 2;
  const cy = cyp + (y1 + y2) / 2;
  const a0 = Math.atan2((dy2 - cyp) / ry, (dx2 - cxp) / rx);
  let delta = Math.atan2((-dy2 - cyp) / ry, (-dx2 - cxp) / rx) - a0;
  if (sweep === 0 && delta > 0) delta -= 2 * Math.PI;
  if (sweep === 1 && delta < 0) delta += 2 * Math.PI;
  const out = [];
  for (let k = 1; k <= n; k += 1) {
    const a = a0 + (delta * k) / n;
    out.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
  }
  return out;
}

/** A path only lists its corners, so fill the straight runs in for measuring. */
function densify(points, step = 2) {
  const out = [];
  for (let i = 0; i < points.length; i += 1) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % points.length];
    out.push([x1, y1]);
    const steps = Math.floor(Math.hypot(x2 - x1, y2 - y1) / step);
    for (let k = 1; k < steps; k += 1) {
      out.push([x1 + ((x2 - x1) * k) / steps, y1 + ((y2 - y1) * k) / steps]);
    }
  }
  return out;
}

const key = (x, y) => `${Math.round(x * 2)}:${Math.round(y * 2)}`;

function keySet(points) {
  const set = new Set();
  for (const [x, y] of points) set.add(key(x, y));
  return set;
}

function has(set, x, y, reach = 1) {
  const cx = Math.round(x * 2);
  const cy = Math.round(y * 2);
  for (let dx = -reach; dx <= reach; dx += 1) {
    for (let dy = -reach; dy <= reach; dy += 1) {
      if (set.has(`${cx + dx}:${cy + dy}`)) return true;
    }
  }
  return false;
}

/** Mirror the outline on the x axis and on the y axis; both must land on itself. */
function mirrorReport(points) {
  const set = keySet(points);
  const missingX = points.filter(([x, y]) => !has(set, W - x, y)).length;
  const missingY = points.filter(([x, y]) => !has(set, x, H - y)).length;
  return { missingX, missingY };
}

/** How far the top, bottom, left and right edges are pulled in at their middle. */
function pinchDepths(points) {
  const nearCentreX = points.filter(([x]) => Math.abs(x - W / 2) <= 2);
  const nearCentreY = points.filter(([, y]) => Math.abs(y - H / 2) <= 2);
  const top = nearCentreX.length ? Math.min(...nearCentreX.map(([, y]) => y)) : 0;
  const bottom = nearCentreX.length ? H - Math.max(...nearCentreX.map(([, y]) => y)) : 0;
  const left = nearCentreY.length ? Math.min(...nearCentreY.map(([x]) => x)) : 0;
  const right = nearCentreY.length ? W - Math.max(...nearCentreY.map(([x]) => x)) : 0;
  return { top, bottom, left, right };
}

/** Where the cut begins, measured inward from each corner along the edges. */
function cutStarts(points) {
  const topLine = points.filter(([, y]) => y < 0.5);
  const bottomLine = points.filter(([, y]) => y > H - 0.5);
  const leftLine = points.filter(([x]) => x < 0.5);
  const rightLine = points.filter(([x]) => x > W - 0.5);
  return {
    topLeft: topLine.length ? Math.min(...topLine.map(([x]) => x)) : null,
    topRight: topLine.length ? W - Math.max(...topLine.map(([x]) => x)) : null,
    bottomLeft: bottomLine.length ? Math.min(...bottomLine.map(([x]) => x)) : null,
    bottomRight: bottomLine.length ? W - Math.max(...bottomLine.map(([x]) => x)) : null,
    leftTop: leftLine.length ? Math.min(...leftLine.map(([, y]) => y)) : null,
    rightTop: rightLine.length ? Math.min(...rightLine.map(([, y]) => y)) : null,
  };
}

function save() {
  if (!existsSync(PAGE)) {
    console.error(`Cannot save: ${PAGE} does not exist.`);
    process.exit(1);
  }
  mkdirSync(dirname(SHAPES), { recursive: true });
  const html = readFileSync(PAGE, 'utf8');
  // A path holding several subpaths is a companion drawing (card 8 carries its
  // own hollow bands), so it is kept apart from the one shape per card.
  const isCompound = (path) => (path.match(/M/g) || []).length > 1;
  const paths = [...new Set(readPaths(html))];
  const captions = readCaptions(html);
  const main = paths.filter((path) => !isCompound(path));
  const extraShapes = paths.filter(isCompound);
  if (main.length !== 9 || captions.length !== 9) {
    console.error(`Cannot save: expected 9 cards, found ${main.length} card shapes and ${captions.length} captions.`);
    process.exit(1);
  }
  const cards = main.map((path, index) => ({ n: index + 1, caption: captions[index], path }));
  writeFileSync(SHAPES, `${JSON.stringify({ viewBox: `0 0 ${W} ${H}`, savedAt: new Date().toISOString(), cards, extraShapes }, null, 2)}\n`);
  copyFileSync(PAGE, SNAPSHOT);
  ok(`saved 9 shapes and ${extraShapes.length} companion path(s) to ${SHAPES}`);
  ok(`saved the page itself to ${SNAPSHOT}`);
}

function restore() {
  if (!existsSync(SNAPSHOT)) {
    console.error(`Cannot restore: ${SNAPSHOT} does not exist. Run --save on a page you trust first.`);
    process.exit(1);
  }
  copyFileSync(SNAPSHOT, PAGE);
  ok(`restored ${PAGE} from the approved copy in ${SNAPSHOT}`);
}

function check() {
  if (!existsSync(SHAPES)) {
    fail(`${SHAPES} is missing. Run --save on a page you trust first.`);
    return;
  }
  if (!existsSync(PAGE)) {
    fail(`${PAGE} is missing. Run --restore to bring it back.`);
    return;
  }
  const saved = JSON.parse(readFileSync(SHAPES, 'utf8'));
  const approved = saved.cards;
  const extras = saved.extraShapes ?? [];
  const html = readFileSync(PAGE, 'utf8');

  // 1. The live page must hold the approved shapes and nothing else.
  const counts = new Map();
  for (const path of readPaths(html)) counts.set(path, (counts.get(path) ?? 0) + 1);
  let drifted = 0;
  for (const card of approved) {
    const seen = counts.get(card.path) ?? 0;
    counts.delete(card.path);
    if (!seen) {
      fail(`card ${card.n} is missing from the page. Run --restore.`);
      drifted += 1;
    }
  }
  for (const path of extras) {
    const seen = counts.get(path) ?? 0;
    counts.delete(path);
    if (!seen) {
      fail('a companion drawing is missing from the page. Run --restore.');
      drifted += 1;
    }
  }
  for (const [path, seen] of counts) {
    fail(`the page holds a shape that is not approved (${seen} times): ${path.slice(0, 60)}...`);
    drifted += 1;
  }
  const figures = (html.match(/<figure/g) || []).length;
  if (figures !== 9) {
    fail(`the page holds ${figures} cards, expected 9`);
    drifted += 1;
  }
  if (!drifted) ok('the page holds the 9 approved shapes and nothing else');

  // 2. Captions must sit with the shape they describe.
  for (const card of approved) {
    const real = html.split(card.caption).length - 1;
    if (!real) fail(`caption for card ${card.n} is missing: "${card.caption}"`);
  }
  if (!failures) ok('every caption is still on the page');

  // 3. Every shape must be symmetrical on both axes.
  for (const card of approved) {
    const points = densify(toPoints(card.path));
    const { missingX, missingY } = mirrorReport(points);
    if (missingX || missingY) {
      fail(`card ${card.n} is not symmetrical: ${missingX} points missing when mirrored across the middle, ${missingY} when mirrored top to bottom`);
    }
  }
  if (!failures) ok('all shapes are symmetrical on both axes');

  // 4. Every pinch must be the same depth, whichever edge it is on.
  const depths = [];
  for (const card of approved) {
    const d = pinchDepths(densify(toPoints(card.path)));
    for (const [side, value] of Object.entries(d)) {
      if (value > 0.5) depths.push({ card: card.n, side, value: Number(value.toFixed(2)) });
    }
  }
  const spread = depths.length
    ? Math.max(...depths.map((d) => d.value)) - Math.min(...depths.map((d) => d.value))
    : 0;
  if (spread > 0.5) {
    const list = depths.map((d) => `card ${d.card} ${d.side} ${d.value}px`).join(', ');
    fail(`pinches differ in depth: ${list}`);
  } else if (depths.length) {
    ok(`every pinch is the same depth (${depths[0].value}px), on ${depths.length} edges`);
  }

  // 5. Cards 6 and 7 are the same corner with a different finish.
  const six = approved.find((c) => c.n === 6);
  const seven = approved.find((c) => c.n === 7);
  if (six && seven) {
    const a = cutStarts(densify(toPoints(six.path)));
    const b = cutStarts(densify(toPoints(seven.path)));
    const differing = Object.keys(a).filter(
      (k) => a[k] !== null && b[k] !== null && Math.abs(a[k] - b[k]) > 0.5,
    );
    if (differing.length) {
      fail(`cards 6 and 7 start their corner cut in different places: ${differing.map((k) => `${k} ${a[k]} vs ${b[k]}`).join(', ')}`);
    } else {
      ok('cards 6 and 7 start their corner cut in the same place on every edge');
    }
  }
}

if (mode === '--save') save();
else if (mode === '--restore') restore();
else check();

if (failures) {
  console.log(`\n${failures} problem${failures === 1 ? '' : 's'} found.`);
  process.exitCode = 1;
} else if (mode === '--check') {
  console.log('\nGallery matches the approved shapes.');
}
