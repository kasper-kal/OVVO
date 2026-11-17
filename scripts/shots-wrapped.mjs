import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = 'http://127.0.0.1:3000/yearbook?demo=1&persona=regular';
const OUT = '/tmp/shots';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

async function walk(url, prefix, w, h) {
  await page.setViewportSize({ width: w, height: h });
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.locator('.wrapped-stage').waitFor();
  await page.waitForTimeout(400);
  const overlays = page.locator('.overlay button, .sheet button');
  for (let i = 0; i < 3; i += 1) {
    if (await overlays.count()) await overlays.first().click().catch(() => {});
    await page.waitForTimeout(120);
  }
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('.wrapped-stage').waitFor();
  await page.waitForTimeout(400);
  const files = [];
  for (let i = 0; i < 18; i += 1) {
    await page.waitForTimeout(360);
    const file = `${OUT}/${prefix}-${String(i).padStart(2, '0')}.png`;
    await page.screenshot({ path: file });
    files.push(file);
    if (i < 17) await page.keyboard.press('ArrowRight');
  }
  return files;
}

async function sheet(files, name, cols, w, h) {
  const imgs = files
    .map((f) => `<img src="data:image/png;base64,${fs.readFileSync(f).toString('base64')}" style="width:${w}px;height:${h}px;object-fit:cover;display:block">`)
    .join('');
  const html = `<body style="margin:0;background:#151515;display:grid;grid-template-columns:repeat(${cols},${w}px);gap:3px">${imgs}</body>`;
  const file = `${OUT}/${name}.html`;
  fs.writeFileSync(file, html);
  const p = await browser.newPage({ viewport: { width: cols * (w + 3), height: Math.ceil(files.length / cols) * (h + 3) } });
  await p.goto(`file://${file}`);
  await p.waitForTimeout(300);
  await p.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  await p.close();
}

const bare = await walk(`${BASE}&bare=1`, 'bare', 1440, 900);
await sheet(bare, 'sheet-bare', 6, 300, 188);

const full = await walk(BASE, 'full', 1440, 900);
await sheet(full, 'sheet-full', 6, 300, 188);

const mobBare = await walk(`${BASE}&bare=1`, 'mob-bare', 390, 844);
await sheet(mobBare, 'sheet-mob-bare', 6, 190, 411);

const mob = await walk(BASE, 'mob-full', 390, 844);
await sheet(mob, 'sheet-mob-full', 6, 190, 411);

await browser.close();
console.log('SHOTS: done', bare.length, full.length, mobBare.length, mob.length);
