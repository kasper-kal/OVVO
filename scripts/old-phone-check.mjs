#!/usr/bin/env node
/*
 * **Does what ships still run on an iPhone that stopped at iOS 14?**
 *
 * This app is drawn entirely by JavaScript, so a browser that cannot parse the bundle shows a
 * white page and says nothing — no error, no message, nothing to retry. That is what an iPhone
 * that can no longer update saw before the build was aimed at Safari 14, and the reason this
 * check exists: the targeting is one line in `vite.config.ts`, and a line is easy to lose.
 *
 * Three questions, each of which has been answered wrong at some point:
 *
 *   1. **Is the build aimed low enough?** `build.target` and `build.cssTarget` must both name
 *      `ios14`. esbuild is what turns newer syntax into older syntax; without the target it
 *      leaves the bundle in a shape iOS 14 cannot read.
 *   2. **Does the code call anything iOS 14 does not have?** `AbortSignal.timeout()` did: it threw
 *      before the request was made, so the encyclopaedia card and the "near me" estimate silently
 *      never appeared on the phones that needed them most.
 *   3. **Is there a fallback for every style iOS 14 drops?** `color-mix()` (Safari 16.2) and `dvh`
 *      (Safari 15.4) are thrown away whole by an older parser: a dropped `background` is a
 *      transparent card, a dropped `--skeleton-fill` is a loading screen with nothing on it.
 *
 * Run `npm run build` first: the scan reads the bundle and the stylesheet that came out of it.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const problems = [];
const fail = (message) => problems.push(message);

/* ------------------------------------------------------------------ 1. the target */

const config = readFileSync(join(ROOT, 'vite.config.ts'), 'utf8');
for (const key of ['target', 'cssTarget']) {
  const line = new RegExp(`${key}:\\s*\\[([^\\]]*)\\]`).exec(config);
  if (!line) {
    fail(`vite.config.ts: \`build.${key}\` is not set — Vite's default stops at Safari 16.4.`);
  } else if (!line[1].includes("'ios14'")) {
    fail(`vite.config.ts: \`build.${key}\` does not name 'ios14' (it is ${line[1].trim()}).`);
  }
}

/* ------------------------------------------------------------------ 2. the bundle */

const assets = join(ROOT, 'dist', 'assets');
if (!existsSync(assets)) {
  fail('no build to check: run `npm run build` first.');
} else {
  /*
   * Calls that iOS 14 does not have, each with what to use instead. The list is short on purpose:
   * only things this app could plausibly reach for, and only where the absence is silent.
   */
  const forbidden = [
    ['AbortSignal.timeout', 'AbortSignal.timeout() — Safari 16', 'lib/timeoutSignal.ts'],
    ['structuredClone(', 'structuredClone() — Safari 15.4', 'a JSON round-trip or a hand-written copy'],
    ['Object.hasOwn(', 'Object.hasOwn() — Safari 15.4', 'Object.prototype.hasOwnProperty.call()'],
    ['requestIdleCallback(', 'requestIdleCallback() — not in Safari at all', 'setTimeout()'],
    ['Array.fromAsync(', 'Array.fromAsync() — Safari 17.4', 'a loop'],
    ['.findLast(', 'Array.prototype.findLast() — Safari 15.4', 'a reverse loop'],
    ['.toSorted(', 'Array.prototype.toSorted() — Safari 16', 'slice().sort()'],
    ['.toReversed(', 'Array.prototype.toReversed() — Safari 16', 'slice().reverse()'],
    ['.toSpliced(', 'Array.prototype.toSpliced() — Safari 16', 'slice() then splice()'],
    ['URL.canParse(', 'URL.canParse() — Safari 17', 'new URL() in a try/catch'],
    ['URL.parse(', 'URL.parse() — Safari 18', 'new URL() in a try/catch'],
    ['crypto.randomUUID(', 'crypto.randomUUID() — Safari 15.4', 'lib/random.ts'],
    ['Object.groupBy(', 'Object.groupBy() — Safari 17.4', 'a reduce into an object'],
    ['Map.groupBy(', 'Map.groupBy() — Safari 17.4', 'a loop into a Map'],
    ['checkVisibility(', 'Element.checkVisibility() — Safari 17.4', 'offsetParent !== null'],
  ];
  /* A class static block is Safari 16.4 and esbuild leaves it in place; a private field `#x` is
     Safari 14.1, which is inside the range this app claims — it is reported so nobody is surprised
     by an iPhone 14.0 answering with nothing. */
  const syntax = [
    [/\bstatic\s*\{/, 'a class static block — Safari 16.4'],
    [/#[a-zA-Z_$][\w$]*\s*(=|;)/, 'a private class field — Safari 14.1'],
  ];

  const bundles = readdirSync(assets).filter((name) => name.endsWith('.js'));
  if (bundles.length === 0) fail('dist/assets holds no JavaScript: the build did not finish.');
  for (const name of bundles) {
    const code = readFileSync(join(assets, name), 'utf8');
    for (const [needle, what, instead] of forbidden) {
      if (code.includes(needle)) fail(`dist/assets/${name} uses ${what}. Use ${instead}.`);
    }
    for (const [pattern, what] of syntax) {
      if (pattern.test(code)) fail(`dist/assets/${name} contains ${what}.`);
    }
  }

  /*
   * **The stylesheet has to keep both versions.** The fallback was written once as a second
   * declaration in the same rule and the minifier deleted it — the build looked fine and the glass
   * was still transparent on an old phone. It survives inside `@supports`, so the built file must
   * still contain those blocks *and* the mixes they stand behind.
   */
  const sheets = readdirSync(assets).filter((name) => name.endsWith('.css'));
  if (sheets.length === 0) fail('dist/assets holds no stylesheet.');
  for (const name of sheets) {
    const css = readFileSync(join(assets, name), 'utf8');
    if (!css.includes('color-mix(')) {
      fail(`dist/assets/${name} has no color-mix() left: the fallbacks replaced the real values.`);
    }
    if (!css.includes('@supports not (color:color-mix(') && !css.includes('@supports not (color: color-mix(')) {
      fail(`dist/assets/${name} has no @supports fallback block left: the minifier removed it.`);
    }
  }
}

/* ------------------------------------------------------------------ 3. the styles */

/* The properties declared inside each kind of `@supports not (…)` block, per stylesheet. */
function fallbackProperties(text, condition) {
  const properties = new Set();
  let index = 0;
  while ((index = text.indexOf(condition, index)) !== -1) {
    const open = text.indexOf('{', index);
    if (open === -1) break;
    let depth = 0;
    let end = open;
    for (; end < text.length; end += 1) {
      if (text[end] === '{') depth += 1;
      if (text[end] === '}') {
        depth -= 1;
        if (depth === 0) break;
      }
    }
    const body = text.slice(open + 1, end);
    for (const match of body.matchAll(/(--[a-zA-Z0-9-]+|[a-zA-Z-]+)\s*:/g)) properties.add(match[1]);
    index = end;
  }
  return properties;
}

const styles = join(ROOT, 'src', 'styles');
for (const file of readdirSync(styles).filter((name) => name.endsWith('.css'))) {
  const text = readFileSync(join(styles, file), 'utf8');
  const path = `src/styles/${file}`;
  const mixed = fallbackProperties(text, '@supports not (color: color-mix(');
  const sized = fallbackProperties(text, '@supports not (height: 88dvh)');
  const lines = text.split('\n');
  /* Decoration, not reading: a dropped hairline highlight or a dropped tint on an underline's
     colour changes how something looks and nothing about what can be read. Everything else — every
     surface, every border, every size — needs its plain value. */
  const decoration = new Set(['box-shadow', 'text-decoration-color']);
  lines.forEach((line, index) => {
    const declaration = /^\s*(--[a-zA-Z0-9-]+|[a-zA-Z-]+)\s*:\s*(.+)$/.exec(line);
    if (!declaration) return;
    const [, property, value] = declaration;
    if (decoration.has(property)) return;
    if (/color-mix\(/.test(value) && !mixed.has(property)) {
      fail(`${path}:${index + 1}  ${property} is mixed, with no value for a browser that cannot mix.`);
    }
    if (/\bdvh\b/.test(value) && !sized.has(property)) {
      fail(`${path}:${index + 1}  ${property} uses dvh, with no vh value for a browser that lacks it.`);
    }
  });
}

/* ------------------------------------------------------------------ verdict */

if (problems.length === 0) {
  console.log('iOS 14: the build, the bundle and the styles are all within reach.');
  process.exit(0);
}
for (const problem of problems) console.log(`fail  ${problem}`);
console.log(`\n${problems.length} problem${problems.length === 1 ? '' : 's'} for iOS 14.`);
process.exit(1);
