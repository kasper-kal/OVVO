/**
 * **Contact sheets: fifty styles on one page, so they can be judged against each other.**
 *
 * The sweep photographs each style on its own. That is the wrong shape for a judgement, because a
 * look is only wrong *relative to the others*: five styles with the same square card are obvious
 * side by side and invisible one at a time. This lays the photographs out in a grid with the style
 * name under each, renders that grid in the browser, and screenshots the grid.
 *
 *   node scripts/style-sheets.mjs --page home --cols 5
 *   node scripts/style-sheets.mjs --page settings --cols 5 --thumb 300
 *
 * Sheets land in `.logs/sweep/sheets/<page>-<index>.png`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium, prepareBrowserEnv } from './browser-env.mjs';

prepareBrowserEnv();

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};

const pageName = flag('page', 'home');
const cols = Number(flag('cols', 5));
const thumb = Number(flag('thumb', 260));
const perSheet = Number(flag('per', 25));

const SHOTS = '.logs/sweep/shots';
const OUT = '.logs/sweep/sheets';
fs.mkdirSync(OUT, { recursive: true });

const styles = fs.readdirSync(SHOTS).filter((dir) => fs.existsSync(path.join(SHOTS, dir, `${pageName}.png`))).sort();
const sheets = [];
for (let i = 0; i < styles.length; i += perSheet) sheets.push(styles.slice(i, i + perSheet));

const browser = await chromium.launch({ chromiumSandbox: false, args: ['--no-sandbox', '--disable-gpu'] });
const page = await browser.newPage({ viewport: { width: cols * (thumb + 16) + 16, height: 800 }, deviceScaleFactor: 1 });

for (const [index, group] of sheets.entries()) {
  /*
   * **The photographs are inlined, not linked.** A page built with `setContent` has an opaque
   * origin, so `<img src="file://…">` is blocked and the first sheet came out as fifty broken
   * image icons with the style names underneath. A data URL has no origin to object to.
   */
  const cards = group
    .map((style) => {
      const file = path.join(SHOTS, style, `${pageName}.png`);
      const data = fs.readFileSync(file).toString('base64');
      return `<figure><img src="data:image/png;base64,${data}" width="${thumb}"><figcaption>${style}</figcaption></figure>`;
    })
    .join('');

  const html = `<!doctype html><meta charset="utf-8"><style>
    body{margin:0;background:#f2f2f2;font:12px/1.3 system-ui,sans-serif;color:#111}
    main{display:grid;grid-template-columns:repeat(${cols},${thumb}px);gap:14px;padding:8px}
    figure{margin:0}
    img{display:block;border:1px solid #bbb;background:#fff}
    figcaption{padding-top:3px;font-weight:600}
  </style><main>${cards}</main>`;

  await page.setContent(html, { waitUntil: 'load' });
  await page.waitForTimeout(250);
  const file = path.join(OUT, `${pageName}-${index + 1}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`${file}  ${group.length} styles`);
}

await browser.close();
