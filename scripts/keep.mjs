#!/usr/bin/env node
// Keep every piece of finished work in one command.
//
//   node scripts/keep.mjs --save "why this change is worth keeping"
//   node scripts/keep.mjs                      same, with an automatic message
//   node scripts/keep.mjs --list               the last fifteen saves
//   node scripts/keep.mjs --restore <path>     bring the newest saved copy of a file back
//   node scripts/keep.mjs --restore <path> --from <sha>   reach further back
//
// Git already holds the app source, so `git add -A` covers it. Working files that
// live in folders git ignores are added by force, because those are exactly the
// files a stray overwrite destroys and leaves no history of.

import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

// Files and folders that git ignores but that are not throwaway.
const ALWAYS_INCLUDED = ['.logs/mock/index.html'];

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

const args = process.argv.slice(2);
const flag = args[0];

if (flag === '--list') list();
else if (flag === '--restore') {
  const path = args[1];
  const fromIndex = args.indexOf('--from');
  restore(path, fromIndex === -1 ? undefined : args[fromIndex + 1]);
} else if (flag === '--save') save(args.slice(1).join(' '));
else if (flag) {
  console.error(`Unknown option ${flag}. Use --save, --list or --restore <path> [--from <sha>].`);
  process.exit(1);
} else save();
