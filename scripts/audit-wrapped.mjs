/**
 * One-off visual audit of every Wrapped chapter at four viewport states and two moments.
 *
 * This does not replace `scripts/screen.mjs`; it is a wider look at the deck that the fixed app gate
 * does not frame. The output is under artifacts/wrapped-audit.
 */
import { chromium, prepareBrowserEnv, browserIsInstalled, MISSING_BROWSER_HELP } from './browser-env.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';

prepareBrowserEnv();
if (!browserIsInstalled()) {
  console.error(MISSING_BROWSER_HELP);
  process.exit(2);
}

const BASE = process.env.BASE_URL || 'http://127.0.0.1:3000';
const OUT = 'artifacts/wrapped-audit';
mkdirSync(OUT, { recursive: true });

const STATES = [
  { id: 'phone', width: 360, height: 800 },
  { id: 'small', width: 320, height: 568 },
  { id: 'tablet', width: 768, height: 1024 },
  { id: 'desktop', width: 1440, height: 900 },
];

const MEASURE = () => {
  const root = document.documentElement;
  const stage = document.querySelector('.wrapped-stage');
  const body = document.querySelector('.wrapped-body');
  const foot = document.querySelector('.wrapped-foot');
  const top = document.querySelector('.wrapped-top');
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const rect = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), right: Math.round(r.right), bottom: Math.round(r.bottom) };
  };
  const label = (el) => {
    const cls = String(el.className?.baseVal ?? el.className ?? '').split(/\s+/).filter(Boolean).slice(0, 2).join('.');
    return el.tagName.toLowerCase() + (cls ? '.' + cls : '');
  };
  const visible = (el) => {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity) !== 0 && r.width > 0 && r.height > 0;
  };
  const ownText = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
  const clippedBy = (el) => {
    for (let n = el; n && n !== root; n = n.parentElement) {
      const s = getComputedStyle(n);
      if (/hidden|clip|auto|scroll/.test(s.overflowX + s.overflowY)) return n === body ? 'body' : label(n);
    }
    return null;
  };
  const faults = [];

  if (root.scrollWidth > root.clientWidth + 1) {
    faults.push({ kind: 'page-overflow', key: 'page', detail: `${root.scrollWidth} in ${root.clientWidth}` });
  }
  if (body && body.scrollHeight > body.clientHeight + 1) {
    faults.push({ kind: 'body-overflow', key: 'body', detail: `${body.scrollHeight} in ${body.clientHeight}; overflow ${getComputedStyle(body).overflowY}` });
  }

  const seen = new Set();
  document.querySelectorAll('body *').forEach((el) => {
    if (!visible(el)) return;
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    if (s.position === 'fixed') return;
    if (el.closest('.sr-only') || el.closest('.wrapped-progress') || el.closest('.wrapped-top')) return;
    const clip = clippedBy(el);
    if (r.right > vw + 1 && !clip) {
      const key = label(el);
      if (!seen.has(`right:${key}`)) {
        seen.add(`right:${key}`);
        faults.push({ kind: 'past-right', key, detail: `${r.right} of ${vw}; ${Math.round(r.width)} wide` });
      }
    }
    if (r.left < -1 && !clip) {
      const key = label(el);
      if (!seen.has(`left:${key}`)) {
        seen.add(`left:${key}`);
        faults.push({ kind: 'past-left', key, detail: `${r.left}` });
      }
    }
  });

  document.querySelectorAll('body *').forEach((el) => {
    if (!visible(el) || el.closest('.sr-only') || !ownText(el)) return;
    const s = getComputedStyle(el);
    if (!/hidden|clip/.test(s.overflowX + s.overflowY)) return;
    const dx = el.scrollWidth - el.clientWidth;
    const dy = el.scrollHeight - el.clientHeight;
    if (dx <= 1 && dy <= 1) return;
    const key = label(el);
    if (seen.has(`text:${key}`)) return;
    seen.add(`text:${key}`);
    faults.push({ kind: 'clipped-text', key, detail: dx > 1 ? `${dx}px across` : `${dy}px down` });
  });

  if (foot && body) {
    const fr = foot.getBoundingClientRect();
    const br = body.getBoundingClientRect();
    const candidates = [...body.querySelectorAll('p, h1, h2, h3, li, strong, span')].filter((el) => visible(el) && ownText(el));
    candidates.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom > fr.top + 1 && r.top < fr.bottom - 1) {
        const key = label(el);
        if (!seen.has(`foot:${key}`)) {
          seen.add(`foot:${key}`);
          faults.push({ kind: 'under-footer', key, detail: `text at ${Math.round(r.top)}-${Math.round(r.bottom)}, footer ${Math.round(fr.top)}-${Math.round(fr.bottom)}` });
        }
      }
    });
    if (br.bottom > fr.top + 1 && body.scrollHeight <= body.clientHeight + 1) {
      faults.push({ kind: 'body-under-footer', key: 'body', detail: `body ends ${Math.round(br.bottom)}, footer starts ${Math.round(fr.top)}` });
    }
  }

  const smallControls = [];
  document.querySelectorAll('button, a[href], [role="button"]').forEach((el) => {
    if (!visible(el) || el.closest('.wrapped-progress') || el.closest('.sr-only')) return;
    const r = el.getBoundingClientRect();
    if (r.width < 43.5 || r.height < 43.5) smallControls.push({ key: label(el), w: Math.round(r.width), h: Math.round(r.height), text: (el.textContent || '').trim().slice(0, 40) });
  });

  return {
    viewport: { width: vw, height: vh },
    page: document.title,
    chapter: body?.getAttribute('data-chapter') ?? null,
    chapterText: document.querySelector('.wrapped-chapter')?.textContent?.trim() ?? null,
    stage: rect(stage), body: rect(body), top: rect(top), foot: rect(foot),
    bodyScroll: body ? { scrollHeight: body.scrollHeight, clientHeight: body.clientHeight, scrollTop: body.scrollTop, overflowY: getComputedStyle(body).overflowY } : null,
    faults,
    smallControls,
  };
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const browser = await chromium.launch();
const manifest = [];
let total = 0;

for (const state of STATES) {
  mkdirSync(`${OUT}/${state.id}`, { recursive: true });
  const context = await browser.newContext({ viewport: { width: state.width, height: state.height }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(String(error)));

  await page.goto(`${BASE}/wrapped?demo=1&persona=regular`, { waitUntil: 'domcontentloaded' });
  /* A first visit opens the location question before the story. It is not a Wrapped chapter. */
  for (let i = 0; i < 4; i += 1) {
    const close = page.locator('.overlay button, .sheet button');
    if (!(await close.count())) break;
    await close.first().click({ timeout: 1000 }).catch(() => {});
    await sleep(150);
  }
  /* The first cover shot should be the entrance, not a page that had to wait for a dialog. */
  await page.reload({ waitUntil: 'domcontentloaded' });
  await sleep(90);

  const snap = async (pageNo, id, moment) => {
    const file = `${OUT}/${state.id}/${String(pageNo).padStart(2, '0')}-${id}-${moment}.png`;
    await page.screenshot({ path: file, animations: 'allow' });
    total += 1;
    return file;
  };

  const measurements = [];
  let coverEntry = await snap(1, 'cover', 'entry');
  await sleep(1450);
  let coverSettled = await snap(1, 'cover', 'settled');
  const coverMeasure = await page.evaluate(MEASURE);
  coverMeasure.pageNo = 1;
  coverMeasure.id = 'cover';
  coverMeasure.entry = coverEntry;
  coverMeasure.settled = coverSettled;
  measurements.push(coverMeasure);

  await page.getByRole('button', { name: /^Begin$/ }).click();
  await page.waitForFunction(() => document.querySelector('.wrapped-chapter')?.textContent?.trim().startsWith('02'), { timeout: 5000 });
  await sleep(90);

  const chapters = [];
  for (let pageNo = 2; pageNo <= 18; pageNo += 1) {
    const body = await page.evaluate(() => ({
      id: document.querySelector('.wrapped-body')?.getAttribute('data-chapter'),
      footer: document.querySelector('.wrapped-chapter')?.textContent?.trim() ?? null,
    }));
    if (!body.footer?.startsWith(String(pageNo).padStart(2, '0'))) {
      throw new Error(`Expected page ${pageNo}, got ${body.footer}`);
    }
    const entry = await snap(pageNo, body.id, 'entry');
    await sleep(1450);
    const settled = await snap(pageNo, body.id, 'settled');
    const measured = await page.evaluate(MEASURE);
    measured.pageNo = pageNo;
    measured.id = body.id;
    measured.entry = entry;
    measured.settled = settled;
    measurements.push(measured);
    chapters.push({ pageNo, id: body.id });
    if (pageNo < 18) {
      await page.keyboard.press('ArrowRight');
      await page.waitForFunction((n) => document.querySelector('.wrapped-chapter')?.textContent?.trim().startsWith(String(n).padStart(2, '0')), pageNo + 1, { timeout: 5000 });
      await sleep(90);
    }
  }

  writeFileSync(`${OUT}/${state.id}-measurements.json`, JSON.stringify({ state, chapters, consoleErrors, measurements }, null, 2));
  manifest.push({ state, chapters, consoleErrors, shots: total });
  await context.close();
}

await browser.close();
writeFileSync(`${OUT}/manifest.json`, JSON.stringify({ base: BASE, at: new Date().toISOString(), total, states: manifest }, null, 2));
console.log(`WRAPPED AUDIT: ${total} shots in ${OUT}; ${STATES.length} states; 18 chapters; 2 moments each.`);
