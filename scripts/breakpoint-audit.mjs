/**
 * The breakpoint audit: which widths the stylesheet is allowed to branch on.
 *
 * The rule (`src/styles/base.css`, "the one breakpoint") is one line — **mobile under 720px,
 * desktop from 720px** — and the defects it exists to stop are the ones that came from every
 * component inventing its own width: the home grid kept two half cards at a 390px phone because
 * its floor was 360, the stop picker capped its list as if every screen were a phone up to 640,
 * and the page head changed shape at 641. Each of those was a reasonable local decision and
 * together they were a page that was half mobile and half desktop at every width between the
 * numbers.
 *
 * So the rule is not a comment people are asked to remember; it is this file. It reads every
 * `@media` width out of `src/styles/*.css` and fails when a query is not one of:
 *
 *   mode     `max-width: 719px` / `min-width: 720px` — the one breakpoint, both halves written so
 *            no width can fall between them.
 *   tier     `min-width: 1040px` — the sidebar replaces the dock. The page is already desktop at
 *            720; this only decides how the navigation is drawn.
 *   density  `max-width: 560/559`, `400/379px` — a control redrawn to fit inside mobile mode (the
 *            departures row's four cells, the colour sheet's column count, the date field's
 *            split). Same screen, smaller measurements; never a different layout.
 *
 * A new width is therefore a deliberate act: it has to be added to `ALLOWED` below with a reason
 * next to it, which is exactly the argument the rule asks for. `719` and `720` must both exist —
 * a stylesheet that only had one side would leave the other side to a default, and the default is
 * what the old bugs were made of.
 *
 * Run:   node scripts/breakpoint-audit.mjs
 * Exit:  0 when every width is one of the three, 1 when one is not.
 */
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const STYLE_DIR = join(ROOT, 'src/styles');

/**
 * Every width a query may use, and why. `kind` is only for the report: the gate asks whether the
 * width is listed at all.
 */
const ALLOWED = new Map([
  [719, { kind: 'mode', why: 'mobile: every width below 720 is the phone layout' }],
  [720, { kind: 'mode', why: 'desktop: 720 and up is the desktop layout' }],
  [1039, { kind: 'tier', why: 'tier: the sidebar is hidden below 1040 (the other half of 1040)' }],
  [1040, { kind: 'tier', why: 'the sidebar replaces the dock; the page is desktop from 720' }],
  [560, { kind: 'density', why: 'departures row: four cells at their narrowest' }],
  [559, { kind: 'density', why: 'colour sheet: six columns rather than eight' }],
  [430, { kind: 'density', why: 'results bar: the sort takes the second line rather than squeezing the chips' }],
  [400, { kind: 'density', why: 'date field: the two selects stack' }],
  [379, { kind: 'density', why: 'colour sheet at 320: four columns keep the 44px target' }],
  [1024, { kind: 'density', why: 'map widget: stop names step down to 1.9 units where the plate is widest' }],
]);

/* `@media (max-width: 719px)` and `@media screen and (min-width: 720px)` alike: read the width
   and which side of it the block applies to. A `range` query (`width <= 719px`) would parse as
   neither and is reported rather than passed, because it cannot be checked against the rule. */
const QUERY = /@media[^{]*?\((max|min)-width:\s*([\d.]+)px\)/g;

const files = (await readdir(STYLE_DIR)).filter((name) => name.endsWith('.css')).sort();
const findings = [];
const widths = new Map();

for (const file of files) {
  const css = await readFile(join(STYLE_DIR, file), 'utf8');
  const lines = css.split('\n');
  for (const match of css.matchAll(QUERY)) {
    const [query, side, raw] = match;
    const width = Number(raw);
    const line = css.slice(0, match.index).split('\n').length;
    /* The line the query sits on, so a finding can be opened rather than searched for. */
    const text = lines[line - 1]?.trim() ?? query.trim();
    const entry = ALLOWED.get(width);
    widths.set(width, (widths.get(width) ?? 0) + 1);
    if (!entry) {
      findings.push({ file, line, text, width, side, why: 'not one of the allowed widths' });
    } else if (width === 719 && side !== 'max') {
      findings.push({ file, line, text, width, side, why: '719 is the mobile side: max-width only' });
    } else if (width === 720 && side !== 'min') {
      findings.push({ file, line, text, width, side, why: '720 is the desktop side: min-width only' });
    } else if (width === 1039 && side !== 'max') {
      findings.push({ file, line, text, width, side, why: '1039 is the far side of the tier: max-width only' });
    } else if (width === 1040 && side !== 'min') {
      findings.push({ file, line, text, width, side, why: '1040 is the near side of the tier: min-width only' });
    }
  }
  /* A range query has no `max-`/`min-` prefix, so the pattern above misses it. It is still a
     width decision, so it is named rather than silently skipped. */
  for (const [index, line] of lines.entries()) {
    if (/@media[^{]*\(\s*width\s*[<>=]/.test(line)) {
      findings.push({
        file,
        line: index + 1,
        text: line.trim(),
        width: Number.NaN,
        side: 'range',
        why: 'range queries cannot be checked against the one breakpoint; use max-width/min-width',
      });
    }
  }
}

for (const width of [719, 720]) {
  if (!widths.has(width)) {
    findings.push({
      file: 'src/styles/base.css',
      line: 0,
      text: `@media (${width === 719 ? 'max' : 'min'}-width: ${width}px)`,
      width,
      side: width === 719 ? 'max' : 'min',
      why: 'one half of the one breakpoint is missing, so the other side falls to a default',
    });
  }
}

const inventory = [...widths.entries()]
  .sort((a, b) => a[0] - b[0])
  .map(([width, count]) => `${width}px × ${count} (${ALLOWED.get(width)?.kind ?? 'UNLISTED'})`)
  .join(', ');

console.log(`breakpoint audit — ${files.length} stylesheets`);
console.log(`widths in use: ${inventory}`);

if (findings.length === 0) {
  console.log('ok: mobile < 720, desktop ≥ 720, and nothing else decides a mode');
  process.exit(0);
}

console.error(`\n${findings.length} breakpoint${findings.length === 1 ? '' : 's'} outside the rule:`);
for (const finding of findings) {
  const where = finding.line ? `${finding.file}:${finding.line}` : finding.file;
  console.error(`  ${where}  ${finding.text}`);
  console.error(`    ${finding.width}px — ${finding.why}`);
}
process.exit(1);
