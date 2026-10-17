/**
 * Every class name used in the markup must have a rule in the stylesheets.
 *
 * This exists because four dead class names shipped and failed silently: `.stack-3`
 * (the map's chip grid sat flush against the canvas and BoardList lost its gap),
 * `.row-2` (icon + text rows fell back to no gap), `.status-dot--sage` (the location
 * dialog's dots lost their colour) and `.t-h3` (a widget clock fell back to its
 * parent's size). A typo in a class name is invisible in a build and in a type check,
 * so this is the only thing that catches it.
 *
 * Run: node scripts/class-audit.mjs
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const css = readdirSync(join(root, 'src/styles'))
  .filter((f) => f.endsWith('.css'))
  .map((f) => readFileSync(join(root, 'src/styles', f), 'utf8'))
  .join('\n');
const styled = new Set([...css.matchAll(/\.([a-zA-Z][a-zA-Z0-9_-]*)/g)].map((m) => m[1]));

/** Class names that are structural hooks only: they carry no styles by design. */
const HOOKS = new Set([]);

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) yield* walk(path);
    else if (path.endsWith('.tsx')) yield path;
  }
}

/** Every class-name-looking string in a className value. Template expressions are dropped. */
function* classStrings(source) {
  for (const match of source.matchAll(/className=(?:"([^"]*)"|\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\})/g)) {
    if (match[1] !== undefined) {
      yield match[1];
      continue;
    }
    const body = match[2] ?? '';
    for (const literal of body.matchAll(/'([^']*)'|"([^"]*)"|`([^`]*)`/g)) {
      const text = (literal[1] ?? literal[2] ?? literal[3] ?? '').replace(/\$\{[^}]*\}/g, ' ');
      if (text.trim()) yield text;
    }
  }
}

const misses = [];
for (const file of walk(join(root, 'src'))) {
  const source = readFileSync(file, 'utf8');
  for (const value of classStrings(source)) {
    /* `mode-badge--${mode}` arrives here as the fragment `mode-badge--`: a token cut
       short by an interpolation is not a class name, so it is dropped. */
    const tokens = value
      .split(/\s+/)
      .filter((t) => /^[a-z][a-z0-9_-]*$/.test(t) && !/[-_]$/.test(t));
    /* A quoted word with no hyphen is as likely to be a variant value ("sm", "surface")
       as a class, and every real class name here is either styled or hyphenated. */
    const looksLikeClasses = tokens.some((t) => styled.has(t) || t.includes('-') || t.includes('_'));
    if (!looksLikeClasses) continue;
    for (const token of tokens) {
      if (styled.has(token) || HOOKS.has(token)) continue;
      misses.push(`${file.slice(root.length + 1)}  ${token}`);
    }
  }
}

if (misses.length) {
  console.log(`${misses.length} class name(s) with no rule:\n  ${misses.join('\n  ')}`);
  process.exit(1);
}
console.log(`All ${styled.size} styled class names are accounted for.`);
