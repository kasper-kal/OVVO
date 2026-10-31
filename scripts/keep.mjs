#!/usr/bin/env node
// Keep every piece of finished work in one command.
//
//   node scripts/keep.mjs --save "why this change is worth keeping"
//   node scripts/keep.mjs                      same, with an automatic message
//   node scripts/keep.mjs --check              what is unsaved, including files git ignores
//   node scripts/keep.mjs --push               send the saves to the remote on their own
//   node scripts/keep.mjs --list               the last fifteen saves
//   node scripts/keep.mjs --restore <path>     bring the newest saved copy of a file back
//   node scripts/keep.mjs --restore <path> --from <sha>   reach further back
//
// Git already holds the app source, so `git add -A` covers it. Working files that
// live in folders git ignores are added by force, because those are exactly the
// files a stray overwrite destroys and leaves no history of.

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Files and folders that git ignores but that are not throwaway.
const ALWAYS_INCLUDED = ['.logs/mock/index.html', '.logs/mock/scenes.html'];

// Folders git ignores that can still hold work worth keeping.
const WATCHED_FOLDERS = ['.logs', 'shots', 'artifacts'];
const WORK_FILE = /\.(html?|md|json|tsx?|jsx?|css|svg|mjs)$/;

function git(args, options = {}) {
  return execFileSync('git', args, { encoding: 'utf8', ...options });
}

function stamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function save(message) {
  try {
    git(['rev-parse', '--git-dir'], { stdio: 'pipe' });
  } catch {
    console.error('Not inside a git repository, so nothing can be kept.');
    process.exit(1);
  }
  git(['add', '-A'], { stdio: 'pipe' });
  for (const path of ALWAYS_INCLUDED) {
    if (existsSync(path)) git(['add', '-f', path], { stdio: 'pipe' });
  }
  const staged = git(['diff', '--cached', '--name-only']).trim();
  if (!staged) {
    console.log('Nothing new to keep: the saved copy already matches the workspace.');
    return;
  }
  const files = staged.split('\n');
  const subject = message?.trim() || `Keep the work from ${stamp()}`;
  git(['commit', '-q', '-m', subject], { stdio: 'inherit' });
  const sha = git(['rev-parse', '--short', 'HEAD']).trim();
  console.log(`Saved ${files.length} file${files.length === 1 ? '' : 's'} as ${sha}: ${subject}`);
  for (const file of files.slice(0, 12)) console.log(`  ${file}`);
  if (files.length > 12) console.log(`  and ${files.length - 12} more`);
  push();
}

/** Send the saves to the remote: a commit that never leaves this workspace can be lost with it. */
function push() {
  let remote = '';
  try {
    remote = git(['remote']).trim().split('\n').filter(Boolean)[0] || '';
  } catch {
    remote = '';
  }
  if (!remote) {
    console.log('No git remote is configured, so the save stays in this workspace only.');
    return;
  }
  try {
    git(['push', '-q', '-u', remote, 'HEAD'], { stdio: 'pipe' });
    console.log(`Pushed to ${remote}.`);
  } catch (error) {
    const detail = String(error.stderr || error.message || '').trim().split('\n').pop();
    console.log(`Saved, but the push failed: ${detail}`);
    process.exitCode = 1;
  }
}

function list() {
  const out = git(['log', '--format=%h  %ad  %s', '--date=short', '-15']).trimEnd();
  console.log(out || 'No saves yet.');
}

function restore(path, from) {
  if (!path) {
    console.error('Name the file or folder to bring back, for example: --restore .logs/mock/index.html');
    process.exit(1);
  }
  const sha = from || git(['log', '-1', '--format=%H', '--', path]).trim();
  if (!sha) {
    console.error(`No save holds ${path} yet.`);
    process.exit(1);
  }
  git(['checkout', sha, '--', path], { stdio: 'inherit' });
  const short = git(['rev-parse', '--short', sha]).trim();
  console.log(`Restored ${path} from save ${short}.`);
}

function walk(dir, found = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, found);
    else found.push(full);
  }
  return found;
}

/** Report anything sitting unsaved, including ignored files that would be skipped. */
function check() {
  const dirty = git(['status', '--porcelain']).trim();
  console.log(dirty ? `Unsaved changes in tracked files:\n${dirty}` : 'Nothing unsaved in tracked files.');
  const lastSave = Number(git(['log', '-1', '--format=%ct']).trim() || 0) * 1000;
  const atRisk = [];
  for (const folder of WATCHED_FOLDERS) {
    if (!existsSync(folder)) continue;
    for (const file of walk(folder)) {
      if (!WORK_FILE.test(file)) continue;
      if (ALWAYS_INCLUDED.includes(file)) continue;
      if (statSync(file).mtimeMs > lastSave) atRisk.push(file);
    }
  }
  if (!atRisk.length) {
    console.log('No ignored working file has changed since the last save.');
    return;
  }
  console.log('These ignored files changed since the last save and would NOT be kept:');
  for (const file of atRisk.slice(0, 12)) console.log(`  ${file}`);
  if (atRisk.length > 12) console.log(`  and ${atRisk.length - 12} more`);
  console.log('Add the ones that matter to ALWAYS_INCLUDED in scripts/keep.mjs, or move them into a tracked folder.');
  process.exitCode = 1;
}

const args = process.argv.slice(2);
const flag = args[0];

if (flag === '--list') list();
else if (flag === '--check') check();
else if (flag === '--push') push();
else if (flag === '--restore') {
  const path = args[1];
  const fromIndex = args.indexOf('--from');
  restore(path, fromIndex === -1 ? undefined : args[fromIndex + 1]);
} else if (flag === '--save') save(args.slice(1).join(' '));
else if (flag) {
  console.error(`Unknown option ${flag}. Use --save, --push, --check, --list or --restore <path> [--from <sha>].`);
  process.exit(1);
} else save();
