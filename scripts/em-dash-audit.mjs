/*
 * No em dashes in anything the traveller reads.
 *
 * The dash was removed from every string once, by hand, across 55 files. A one-off clean-up only
 * lasts until the next sentence, so this is the gate: it runs as part of `npm run build` and fails
 * the build, naming the file, the line and the text, if one comes back.
 *
 * **Only text is checked.** A comment is not on screen, and the stylesheets and the audit scripts
 * are not read by anybody using the app, so those are left alone. What is checked is `index.html`
 * (its title and description are the browser tab's own words) and every `.ts`/`.tsx` under `src/`,
 * with comments stripped first so a dash in a note about this rule does not fail the build.
 *
 *   node scripts/em-dash-audit.mjs
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const EM_DASH = '\u2014';
const root = new URL('..', import.meta.url).pathname;

/**
 * The source with its comments removed, keeping every newline so line numbers still hold.
 *
 * A character walk rather than a regex: `'https://…'` holds a `//`, and a regular expression that
 * strips line comments would swallow the rest of that string along with any dash after it. Quotes
 * are tracked so a `//` inside a string is text, and a `/*` inside a string is text too.
 */
function withoutComments(source) {
  let out = '';
  let quote = null;
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    const next = source[i + 1];
    if (quote) {
      out += char;
      if (char === '\\') {
        out += next ?? '';
        i += 1;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }
    if (char === '/' && next === '/') {
      while (i < source.length && source[i] !== '\n') i += 1;
      out += '\n';
      continue;
    }
    if (char === '/' && next === '*') {
      i += 2;
      while (i < source.length && !(source[i] === '*' && source[i + 1] === '/')) {
        if (source[i] === '\n') out += '\n';
        i += 1;
      }
      i += 1;
      continue;
    }
    if (char === "'" || char === '"' || char === '`') quote = char;
    out += char;
  }
  return out;
}

/** The same for HTML: the notes in `index.html` are comments too, and the traveller reads none of
 *  them. Only the markup between them is the browser tab's words and the note's own sentences. */
function withoutHtmlComments(source) {
  return source.replace(/<!--[\s\S]*?-->/g, (comment) => comment.replace(/[^\n]/g, ''));
}

const files = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full);
    else if (/\.(tsx?|jsx?)$/.test(name)) files.push(full);
  }
};
walk(join(root, 'src'));
files.push(join(root, 'index.html'));

const hits = [];
for (const file of files) {
  const source = readFileSync(file, 'utf8');
  const text = file.endsWith('.html') ? withoutHtmlComments(source) : withoutComments(source);
  text.split('\n').forEach((line, index) => {
    if (line.includes(EM_DASH)) hits.push({ file: file.replace(root, ''), line: index + 1, text: line.trim() });
  });
}

if (hits.length) {
  console.error(`\n${hits.length} em dash${hits.length === 1 ? '' : 'es'} in on-screen text:\n`);
  for (const hit of hits) console.error(`  ${hit.file}:${hit.line}  ${hit.text}`);
  console.error('\nUse a comma, a colon or a full stop instead. See scripts/em-dash-audit.mjs.\n');
  process.exit(1);
}

console.log(`em-dash audit: clean (${files.length} files, no em dashes in on-screen text)`);
