/**
 * Reads every icon the app renders, in a real browser, on every route.
 *
 * This exists because the icon defects that kept shipping were invisible to every other
 * check here. A build and a type check cannot see a glyph drawn off its own centre; a
 * screenshot at 3x cannot see a 15px icon squashed to 11.66px wide, because the *height*
 * is right and only the width moved. Both were live in the app and both were reported by
 * eye, not by us.
 *
 * What it asserts, for every `svg[data-icon]` (the set is Lucide, plus Tabler's walk):
 *   1. it is square                — a flex row that runs short must not shrink one axis only
 *   2. it is drawn at a whole pixel — a fractional size rasterises blurred
 *   3. it carries a known name and a stroke
 *   4. it sits on the optical centre of the text beside it (within TOLERANCE px)
 *      — the library places a glyph's ink a little above the box centre on purpose, to sit
 *        with a text line, so the check is against the *text*, not against box symmetry.
 *
 * Run it against a dev server:   node scripts/icon-audit.mjs [origin]
 * It needs playwright:           npm i -D playwright && npx playwright install chromium
 */
const ORIGIN = process.argv[2] ?? 'http://127.0.0.1:3000';
const ROUTES = ['/', '/results', '/journey/j1', '/stops', '/stops/utrecht-centraal', '/departures',
  '/disruptions', '/disruptions/d1', '/preferences', '/settings', '/nope'];
const WIDTHS = [320, 390, 768, 1024, 1440];
/* Tolerance against the x-height centre of a line of text (a read baseline), and the looser
   one used when the only reference is a chip's line box: a line box carries the descender
   space, so its centre sits ~1px below the optical centre and an icon placed exactly right
   reads slightly low against it. */
const TOLERANCE = 1.5;
const TOLERANCE_BOX = 2.2;

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.error('this audit needs a browser: npm i -D playwright && npx playwright install chromium');
  process.exit(2);
}

const browser = await chromium.launch({ chromiumSandbox: false, args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--hide-scrollbars'] });
const instances = [];
const failures = [];

for (const width of WIDTHS) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  const appErrors = [];
  page.on('pageerror', (e) => appErrors.push(e.message));
  for (const route of ROUTES) {
    await page.goto(`${ORIGIN}/#${route}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(150);
    const found = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      /**
       * The element that actually holds the text beside an icon. Walking up matters: the icon
       * is usually a flex item and its parent a flex row, and a baseline probe placed in a flex
       * row measures the row, not the text.
       */
      const textHolder = (svg) => {
        for (let el = svg.parentElement, hops = 0; el && hops < 4; hops += 1, el = el.parentElement) {
          const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
          if (!hasText) continue;
          const display = getComputedStyle(el).display;
          if (display.includes('flex') || display.includes('grid')) continue;
          return el;
        }
        return null;
      };

      /**
       * How far below its line box's top edge a baseline sits, for one font and line-height.
       * Calibrated offscreen on a stand-in with the same font: a zero-height inline-block sets
       * its bottom edge on the baseline, so the distance from the box top to its top edge is the
       * half-leading plus the ascent. This is read rather than calculated — canvas font metrics
       * disagreed with the layout by 5–8px and turned correct lines into failures.
       */
      const baselines = new Map();
      const baselineOffset = (holder) => {
        const style = getComputedStyle(holder);
        const key = `${style.fontStyle} ${style.fontWeight} ${style.fontSize}/${style.lineHeight} ${style.fontFamily}`;
        if (baselines.has(key)) return baselines.get(key);
        const host = document.createElement('div');
        host.style.cssText = `position:absolute;left:-9999px;top:0;white-space:nowrap;font:${style.fontStyle} ${style.fontWeight} ${style.fontSize}/${style.lineHeight} ${style.fontFamily}`;
        host.textContent = 'Hx';
        document.body.appendChild(host);
        const probe = document.createElement('span');
        probe.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
        host.insertBefore(probe, host.firstChild);
        const offset = probe.getBoundingClientRect().top - host.getBoundingClientRect().top;
        host.remove();
        baselines.set(key, offset);
        return offset;
      };

      /**
       * The optical centre of the line the icon is on: the baseline of that line less half its
       * x-height. The line is chosen by vertical overlap with the icon, because an icon can sit
       * on a wrapped line (`NS · Maastricht → Alkmaar` wraps at 320px, putting the arrow alone
       * on line two) and a probe inserted before it can itself land on the line above, which is
       * how this audit first reported a correct layout as 16px out.
       */
      const textCentre = (holder, svg) => {
        const box = svg.getBoundingClientRect();
        const offset = baselineOffset(holder);
        const style = getComputedStyle(holder);
        ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        const xHeight = ctx.measureText('x').actualBoundingBoxAscent;
        if (!xHeight) return null;
        const range = document.createRange();
        let best = null;
        for (const node of holder.childNodes) {
          if (node.nodeType !== 3 || !node.textContent.trim()) continue;
          range.selectNodeContents(node);
          for (const rect of range.getClientRects()) {
            if (rect.height <= 0) continue;
            const centre = rect.top + offset - xHeight / 2;
            const gap = Math.abs((rect.top + rect.height / 2) - (box.top + box.height / 2));
            if (!best || gap < best.gap) best = { gap, centre };
          }
        }
        return best ? best.centre : null;
      };

      /**
       * The text beside an icon in a chip whose holder is itself flex or grid: its label's line
       * box centre. `align-items: baseline` in such a chip aligns the svg by its bottom edge,
       * which is the failure this catches.
       */
      const textCentreFromBox = (holder) => {
        const range = document.createRange();
        const rects = [];
        for (const node of holder.childNodes) {
          if (node.nodeType !== 3 || !node.textContent.trim()) continue;
          range.selectNodeContents(node);
          rects.push(...range.getClientRects());
        }
        const boxes = rects.filter((r) => r.height > 0);
        if (!boxes.length) return null;
        const top = Math.min(...boxes.map((r) => r.top));
        const bottom = Math.max(...boxes.map((r) => r.bottom));
        return (top + bottom) / 2;
      };

      /** The text beside an icon whose holder is a flex/grid chip: that chip's label's line box. */
      const textCentreInRow = (svg) => {
        for (let el = svg.parentElement, hops = 0; el && hops < 3; hops += 1, el = el.parentElement) {
          const display = getComputedStyle(el).display;
          if (!display.includes('flex') && !display.includes('grid')) continue;
          const centre = textCentreFromBox(el);
          if (centre !== null) return centre;
        }
        return null;
      };

      const out = [];
      for (const svg of document.querySelectorAll('svg[data-icon]')) {
        const box = svg.getBoundingClientRect();
        if (!box.width) continue;
        const ink = svg.getBBox();
        const holder = textHolder(svg);
        const fromBox = holder === null;
        const where = holder ? `${holder.tagName.toLowerCase()}.${holder.className}` : (svg.parentElement ? `${svg.parentElement.tagName.toLowerCase()}.${svg.parentElement.className}` : '?');
        const centre = holder ? textCentre(holder, svg) : textCentreInRow(svg);
        out.push({
          name: svg.dataset.icon,
          stroke: svg.getAttribute('stroke-width'),
          width: +box.width.toFixed(3),
          height: +box.height.toFixed(3),
          inkCentre: +(box.top + ((ink.y + ink.height / 2) / 24) * box.height).toFixed(2),
          textCentre: centre === null ? null : +centre.toFixed(2),
          fromBox,
          where,
          html: (holder ?? svg.parentElement)?.outerHTML.slice(0, 160),
          line: holder && svg.parentElement !== holder ? 'holder' : svg.parentElement === holder ? 'same' : 'nested',
          inkOffsetY: +(12 - (ink.y + ink.height / 2)).toFixed(2),
        });
      }
      return out;
    });
    for (const icon of found) {
      instances.push({ route, width, ...icon });
      if (Math.abs(icon.width - icon.height) > 0.01) failures.push(`${route} @${width}: ${icon.name} is ${icon.width}x${icon.height} — not square`);
      if (Math.abs(icon.width - Math.round(icon.width)) > 0.01) failures.push(`${route} @${width}: ${icon.name} drawn at ${icon.width}px — not a whole pixel`);
      if (!icon.name || icon.name === '?') failures.push(`${route} @${width}: an icon with no name`);
      if (!icon.stroke) failures.push(`${route} @${width}: ${icon.name} with no stroke width`);
      if (icon.textCentre !== null) {
        const limit = icon.fromBox ? TOLERANCE_BOX : TOLERANCE;
        const delta = Math.abs(icon.inkCentre - icon.textCentre);
        if (delta > limit) failures.push(`${route} @${width}: ${icon.name}@${icon.width}px sits ${(icon.inkCentre - icon.textCentre).toFixed(2)}px off its label (limit ${limit}px; holder ${icon.line}: ${icon.html}`);
      }
    }
    void appErrors;
  }
  await context.close();
}
await browser.close();

const groups = new Map();
for (const i of instances) {
  const key = `${i.name}@${i.width}`;
  const g = groups.get(key) ?? { name: i.name, size: i.width, stroke: i.stroke, n: 0, offsets: [], vsText: [] };
  g.n += 1;
  g.offsets.push(i.inkOffsetY);
  if (i.textCentre !== null) g.vsText.push(i.inkCentre - i.textCentre);
  groups.set(key, g);
}
const rows = [...groups.values()].sort((a, b) => b.n - a.n);

console.log(`${instances.length} icons read across ${ROUTES.length} routes x ${WIDTHS.length} widths; ${rows.length} name@size pairs\n`);
console.log('name              size  stroke   n     ink centre vs its box (24 units)    vs the text beside it');
for (const g of rows) {
  const off = (g.offsets.reduce((s, v) => s + v, 0) / g.offsets.length).toFixed(1);
  const vs = g.vsText.length ? (g.vsText.reduce((s, v) => s + v, 0) / g.vsText.length).toFixed(2) + 'px' : '—';
  console.log(`${g.name.padEnd(16)} ${String(g.size).padStart(4)}  ${g.stroke.padEnd(7)} ${String(g.n).padStart(4)}  ${off.padStart(17)}  ${vs.padStart(22)}`);
}
if (failures.length) {
  console.log(`\nFAILED — ${failures.length} problem(s):`);
  for (const f of failures) console.log('  ' + f);
  process.exit(1);
}
console.log(`\nOK — every icon is square, at a whole pixel, named and weighted, and within ${TOLERANCE}px of its label's optical centre.`);
