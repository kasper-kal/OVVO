/**
 * **The sweep, turned into a list of suspects.**
 *
 * Reads `.logs/sweep/metrics.jsonl` and prints the faults worth looking at, worst first, grouped the
 * way they are fixed: a contrast fault belongs to a style, an overflow belongs to a page.
 *
 *   node scripts/style-report.mjs            # the summary
 *   node scripts/style-report.mjs --style x  # one style, every page
 */
import fs from 'node:fs';

const rows = fs
  .readFileSync('.logs/sweep/metrics.jsonl', 'utf8')
  .split('\n')
  .filter(Boolean)
  .map((line) => {
    try {
      return JSON.parse(line);
    } catch {
      return null;
    }
  })
  .filter(Boolean);


/*
 * A style can be swept twice: once in the first pass and again after a measurement was corrected.
 * The later row wins, so a re-check replaces its own earlier result instead of counting twice.
 */
const latest = new Map();
for (const row of rows) latest.set(`${row.styleId}/${row.page}`, row);
const rows2 = [...latest.values()];

const ok = rows2.filter((r) => !r.failed);
const failed = rows2.filter((r) => r.failed);

/** A text fault is the worst single piece of type on the screen. */
const rank = (r) => r.worstText?.[0]?.value ?? 99;

const lowContrast = ok.filter((r) => rank(r) < 4.5).sort((a, b) => rank(a) - rank(b));
const badContrast = ok.filter((r) => rank(r) < 3).sort((a, b) => rank(a) - rank(b));
const spills = ok.filter((r) => (r.docOverflowX ?? 0) > 0 || (r.overflows?.length ?? 0) > 0);
const tinyType = ok.filter((r) => (r.tiny ?? 0) > 0);
const smallTargets = ok.filter((r) => (r.smallTargets ?? 0) > 0);
const noCorners = ok.filter((r) => (r.radii?.length ?? 0) <= 1);

const byStyle = new Map();
for (const r of ok) {
  const worst = byStyle.get(r.styleId) ?? { styleId: r.styleId, worst: 99, pages: 0, spills: 0, tiny: 0 };
  byStyle.set(r.styleId, {
    ...worst,
    worst: Math.min(worst.worst, rank(r)),
    pages: worst.pages + 1,
    spills: worst.spills + ((r.overflows?.length ?? 0) > 0 ? 1 : 0),
    tiny: worst.tiny + (r.tiny ?? 0),
  });
}

const styles = [...byStyle.values()].sort((a, b) => a.worst - b.worst);

console.log(`photographs: ${ok.length} ok, ${failed.length} failed`);
console.log(`styles covered: ${byStyle.size}, pages per style: ${ok.length && byStyle.size ? (ok.length / byStyle.size).toFixed(1) : 0}`);
console.log(`\nbelow 4.5:1 (text): ${lowContrast.length}   below 3:1 (unreadable): ${badContrast.length}`);
console.log(`spilling: ${spills.length}   tiny type: ${tinyType.length}   small targets: ${smallTargets.length}`);
console.log(`styles with only one corner value: ${noCorners.length}\n`);

if (process.argv.includes('--style')) {
  const id = process.argv[process.argv.indexOf('--style') + 1];
  for (const r of rows.filter((x) => x.styleId === id)) {
    console.log(`\n${r.page}: ${r.failed ? 'FAILED ' + r.failed : `worst ${rank(r)}:1 "${r.worstText?.[0]?.text ?? ''}" radii ${(r.radii ?? []).join(' ')}`}`);
    if (r.smallTargetList?.length) console.log(`  small targets: ${r.smallTargetList.join(' · ')}`);
    if (r.overflows?.length) console.log(`  spills: ${r.overflows.join(' · ')}`);
    if (r.errors?.length) console.log(`  page errors: ${r.errors.join(' · ')}`);
  }
} else {
  console.log('--- the ten worst screens (text contrast) ---');
  for (const r of badContrast.concat(lowContrast).slice(0, 10)) {
    console.log(`${String(rank(r)).padStart(5)}:1  ${r.styleId.padEnd(18)} ${r.page.padEnd(12)} "${r.worstText?.[0]?.text ?? ''}" ${r.worstText?.[0]?.size ?? ''}px`);
  }

  console.log('\n--- spills ---');
  for (const r of spills.slice(0, 12)) console.log(`${r.styleId.padEnd(18)} ${r.page.padEnd(12)} ${(r.overflows ?? []).join(' · ') || 'doc ' + r.docOverflowX}`);

  console.log('\n--- small targets (first six pages) ---');
  for (const r of smallTargets.slice(0, 6)) console.log(`${r.styleId.padEnd(18)} ${r.page.padEnd(12)} ${(r.smallTargetList ?? []).join(' · ')}`);

  console.log('\n--- per style, worst text on any page ---');
  for (const s of styles) console.log(`${String(s.worst).padStart(5)}:1  ${s.styleId.padEnd(18)} pages ${s.pages} spills ${s.spills} tiny ${s.tiny}`);
}

if (failed.length) {
  console.log('\n--- failed ---');
  for (const r of failed) console.log(`${r.styleId.padEnd(18)} ${r.page.padEnd(12)} ${r.failed}`);
}
