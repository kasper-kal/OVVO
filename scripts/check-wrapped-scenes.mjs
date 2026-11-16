/*
 * **Did the film actually replace the print issue?**
 *
 * The reference is a full-screen motion piece. This check walks the eighteen scenes and asserts the
 * deck is the scene renderer, not the old chapter/issue layer, and that every scene is full-height,
 * distinct, animated in one of the five grounds (or a photograph) and free of spilled copy.
 *
 * It is not a taste check. It cannot say whether a ribbon is beautiful; it can say whether the deck
 * is still a poster pretending.
 */

import { chromium } from 'playwright';

const BASE = process.env.YEARBOOK_URL ?? 'http://127.0.0.1:3000/yearbook?demo=1&persona=regular';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.locator('.wrapped-stage').waitFor();
await page.waitForTimeout(500);

const overlays = page.locator('.overlay button, .sheet button');
for (let i = 0; i < 3; i += 1) {
  if (await overlays.count()) await overlays.first().click().catch(() => {});
  await page.waitForTimeout(140);
}
await page.reload({ waitUntil: 'domcontentloaded' });
await page.locator('.wrapped-stage').waitFor();
await page.waitForTimeout(700);

const cover = page.locator('.scene-page--cover');
if (!(await cover.isVisible().catch(() => false))) {
  console.log('WRAPPED SCENES: FAIL — the cover is not a scene');
  process.exit(1);
}

await page.getByRole('button', { name: /Begin/i }).click();
await page.waitForTimeout(500);

const scenes = [];

for (let i = 0; i < 18; i += 1) {
  const reading = await page.evaluate(() => {
    const body = document.querySelector('.wrapped-body');
    const scene = body?.querySelector('.scene-page');
    if (!body || !scene) return null;
    const frame = scene.getBoundingClientRect();
    const oldVisible = [...body.children].filter((child) => {
      if (child === scene) return false;
      const style = getComputedStyle(child);
      return style.display !== 'none' && style.visibility !== 'hidden' && child.getBoundingClientRect().width > 0;
    });
    const spilled = [...scene.querySelectorAll('*')].filter((el) => {
      let node = el;
      while (node && node !== scene) {
        const style = getComputedStyle(node);
        if (style.position === 'absolute' || style.transform !== 'none') return false;
        node = node.parentElement;
      }
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && (rect.bottom > frame.bottom + 6 || rect.right > frame.right + 6 || rect.left < frame.left - 6);
    }).map((el) => String(el.className || el.tagName).slice(0, 32));

    return {
      chapter: body.dataset.chapter ?? '',
      classes: scene.className,
      motion: scene.dataset.motion ?? '',
      big: scene.querySelector('.scene-big, .scene-year')?.textContent?.trim() ?? '',
      before: document.querySelectorAll('.issue-page').length,
      pseudo: ['::before', '::after'].filter((pseudo) => {
        const style = getComputedStyle(body, pseudo);
        return style.display !== 'none' && style.content !== 'none' && style.content !== 'normal' && style.content !== '';
      }),
      canvas: Boolean(scene.querySelector('canvas')) || Boolean(scene.querySelector('.scene-photo')),
      height: scene.clientHeight,
      docWidth: document.documentElement.scrollWidth,
      width: window.innerWidth,
      oldVisible: oldVisible.map((child) => child.className || child.tagName),
      spilled,
    };
  });

  scenes.push(reading ?? { chapter: `index-${i}`, missing: true });

  if (i < 17) {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(260);
  }
}

await browser.close();

const failures = [];
const present = scenes.filter((item) => !item.missing);
if (present.length !== scenes.length) failures.push(`${scenes.length - present.length} page(s) had no scene`);

for (const scene of present) {
  if (scene.oldVisible.length) failures.push(`${scene.chapter}: old layer visible (${scene.oldVisible.join(', ')})`);
  if (scene.before) failures.push(`${scene.chapter}: ${scene.before} old issue page(s) still in the document`);
  if (scene.pseudo.length) failures.push(`${scene.chapter}: old printed layer still painted (${scene.pseudo.join(', ')})`);
  if (!scene.canvas) failures.push(`${scene.chapter}: no moving ground or photograph`);
  if (scene.spilled.length) failures.push(`${scene.chapter}: copy spills (${scene.spilled.slice(0, 3).join(', ')})`);
  if (scene.docWidth > scene.width + 1) failures.push(`${scene.chapter}: document is wider than the viewport`);
  if (scene.height < 400) failures.push(`${scene.chapter}: scene is only ${scene.height}px tall`);
}

const classes = new Set(present.map((scene) => scene.classes));
const bigs = new Set(present.map((scene) => scene.big).filter(Boolean));
const modes = new Set(present.map((scene) => scene.motion));

if (classes.size < 16) failures.push(`only ${classes.size} distinct scenes`);
if (bigs.size < 15) failures.push(`only ${bigs.size} distinct headlines`);
if (modes.size < 5) failures.push(`only ${modes.size} moving grounds`);

if (failures.length) {
  console.log('WRAPPED SCENES: FAIL');
  for (const failure of failures) console.log(`  - ${failure}`);
  process.exit(1);
}

console.log(
  `WRAPPED SCENES: PASS — ${present.length} full-screen scenes, 0 old layers, ` +
    `${classes.size} distinct scenes, ${bigs.size} distinct headlines, ${modes.size} moving grounds, no copy spills.`,
);
