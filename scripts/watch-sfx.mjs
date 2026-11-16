#!/usr/bin/env node
/**
 * Watch the sound-effects drop folder and put every file in its Yearbook slot.
 *
 * WAV files are trimmed, padded and normalized by `scripts/fit-sfx.py`; MP3 files are copied as-is
 * and the browser's MP3 fallback plays them. A processed source is moved into `imported/` so the
 * same file is never imported twice.
 *
 * Run: node scripts/watch-sfx.mjs
 * One pass: node scripts/watch-sfx.mjs --once
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, renameSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const DROP = 'sound-effects';
const IMPORTED = path.join(DROP, 'imported');
const PUBLIC = 'public/sfx';

/* The names the player uses. Keep this list in step with src/lib/yearbookEffects.ts. */
const EFFECTS = new Set([
  'begin',
  'page-turn',
  'share-confirmation',
  'sound-toggle',
  'stat-tick',
  'name-reveal',
  'map-pin',
  'rail-chime',
  'distance-whoosh',
  'clock-chime',
  'camera-shutter',
  'era-advance',
  'board-stamp',
  'trophy-triumph',
  'comparison-two-tone',
  'crew-connect',
  'yearbook-close',
]);

/* Friendly spellings and the old tape name, so a generated file still lands in the right slot. */
const ALIASES = {
  start: 'begin',
  'page_turn': 'page-turn',
  'pageturn': 'page-turn',
  'share': 'share-confirmation',
  'share-confirm': 'share-confirmation',
  toggle: 'sound-toggle',
  tick: 'stat-tick',
  name: 'name-reveal',
  pin: 'map-pin',
  'rail-bell': 'rail-chime',
  whoosh: 'distance-whoosh',
  clock: 'clock-chime',
  shutter: 'camera-shutter',
  'film-advance': 'era-advance',
  'tape-reel': 'era-advance',
  tapereel: 'era-advance',
  stamp: 'board-stamp',
  trophy: 'trophy-triumph',
  'two-tone': 'comparison-two-tone',
  connection: 'crew-connect',
  close: 'yearbook-close',
};

const pending = new Map();
const failed = new Set();

function stamp() {
  return new Date().toISOString().slice(11, 19);
}

function log(line) {
  console.log(`[${stamp()}] ${line}`);
}

function effectOf(file) {
  const base = path
    .basename(file, path.extname(file))
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  const mapped = ALIASES[base] ?? base;
  return EFFECTS.has(mapped) ? mapped : null;
}

function uniqueDestination(name) {
  const base = path.basename(name, path.extname(name));
  const ext = path.extname(name);
  let candidate = path.join(IMPORTED, `${base}${ext}`);
  let index = 2;
  while (existsSync(candidate)) {
    candidate = path.join(IMPORTED, `${base}-${index}${ext}`);
    index += 1;
  }
  return candidate;
}

function importOne(file, effect) {
  const source = path.join(DROP, file);
  const extension = path.extname(file).toLowerCase();
  const wav = path.join(PUBLIC, `${effect}.wav`);
  const mp3 = path.join(PUBLIC, `${effect}.mp3`);

  if (extension === '.wav') {
    const result = spawnSync('python3', ['scripts/fit-sfx.py', source, effect], {
      encoding: 'utf8',
    });
    if (result.status !== 0) {
      const reason = (result.stderr || result.stdout || 'fit failed').trim();
      log(`FAILED ${file}: ${reason}`);
      failed.add(file);
      return;
    }
    if (existsSync(mp3)) {
      /* A WAV is the one the player prefers; do not leave an older MP3 to shadow it. */
      renameSync(mp3, path.join(IMPORTED, `${effect}-old.mp3`));
    }
    log(result.stdout.trim());
  } else {
    copyFileSync(source, mp3);
    if (existsSync(wav)) {
      /* The stand-in WAV would win over the newly dropped MP3, so move it out of the way. */
      renameSync(wav, path.join(IMPORTED, `${effect}-stand-in.wav`));
    }
    log(`${effect}: MP3 copied without trimming; use WAV if the length needs fitting`);
  }

  mkdirSync(IMPORTED, { recursive: true });
  renameSync(source, uniqueDestination(file));
  pending.delete(file);
}

function scan() {
  if (!existsSync(DROP)) return;
  mkdirSync(IMPORTED, { recursive: true });
  for (const file of readdirSync(DROP)) {
    if (file.startsWith('.') || file === path.basename(IMPORTED)) continue;
    const source = path.join(DROP, file);
    let size;
    try {
      if (!statSync(source).isFile()) continue;
      size = statSync(source).size;
    } catch {
      continue;
    }
    if (!/\.(wav|mp3)$/i.test(file)) continue;
    if (failed.has(file)) continue;
    const effect = effectOf(file);
    if (!effect) {
      log(`SKIP ${file}: unknown name; use one of the names in sound-effects/README.md`);
      failed.add(file);
      continue;
    }
    /* Wait for a copy to finish before reading it. */
    if (pending.get(file) !== size) {
      pending.set(file, size);
      continue;
    }
    try {
      importOne(file, effect);
    } catch (error) {
      log(`FAILED ${file}: ${error instanceof Error ? error.message : String(error)}`);
      failed.add(file);
    }
  }
}

if (process.argv.includes('--once')) {
  scan();
  setTimeout(scan, 1600);
  setTimeout(() => process.exit(0), 2200);
} else {
  log('Watching sound-effects/ for WAV and MP3 files.');
  scan();
  setInterval(scan, 1500);
}
