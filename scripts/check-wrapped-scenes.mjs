/*
 * **Is it still a film, or did it become a report again?**
 *
 * The reference is one black stage, one object that keeps changing, one sentence, and a share
 * on the beat. This check walks every chapter and rejects the things that turned the old
 * yearbook back into a slide deck: a kicker, a footnote, a story bridge, a diagram, a chapter
 * count, a second copy block, or a beat with no share.
 *
 * It is not a taste check. It can prove the grammar is present, not that the object is beautiful.
 */

import { chromium } from 'playwright';

const BASE = process.env.YEARBOOK_URL ?? 'http://127.0.0.1:3000/yearbook?demo=1&persona=regular';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const pageErrors = [];
page.on('pageerror', (error) => pageErrors.push(error.message));

await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.locator('.wrapped-stage').waitFor();
await page.waitForTimeout(450);

const overlays = page.locator('.overlay button, .sheet button');
for (let i = 0; i < 3; i += 1) {
  if (await overlays.count()) await overlays.first().click().catch(() => {});
  await page.waitForTimeout(120);
}
await page.reload({ waitUntil: 'domcontentloaded' });
await page.locator('.wrapped-stage').waitFor();
await page.waitForTimeout(700);

const cover = page.locator('.film2--cover');
if (!(await cover.isVisible().catch(() => false))) {
  console.log('WRAPPED FILM: FAIL — the cover is not a film page');
  process.exit(1);
}

if (process.env.NO_SHARE) {
  await page.addStyleTag({ content: '.film2-share { display: none !important; }' });
}
if (process.env.NO_ART) {
  await page.addStyleTag({ content: '.film2-art { display: none !important; }' });
}
if (process.env.NO_LINE) {
  await page.addStyleTag({ content: '.film2-line { display: none !important; }' });
}
if (process.env.OLD_CHROME) {
  await page.evaluate(() => {
    const note = document.createElement('span');
    note.className = 'scene-kicker';
    note.textContent = 'The old kicker';
    document.querySelector('.wrapped-stage')?.append(note);
  });
}

await page.locator('.film2-begin').click();
await page.waitForTimeout(520);

/* A still object is the old failure wearing a new surface: two frames must differ. */
const motionBefore = await page.screenshot();
await page.waitForTimeout(760);
const motionAfter = await page.screenshot();
const moving = !motionBefore.equals(motionAfter);

const scenes = [];
for (let i = 0; i < 18; i += 1) {
  if (process.env.SAME_SHAPE) {
    await page.evaluate(() => {
      const art = document.querySelector('.film2-art');
      if (art) art.dataset.art = 'same';
    });
  }

  const reading = await page.evaluate(() => {
    const film = document.querySelector('.film2');
    const stage = document.querySelector('.wrapped-stage');
    const line = film?.querySelector('.film2-line');
    const copy = film?.querySelector('.film2-copy');
    const share = document.querySelector('.film2-share');
    const art = film.querySelector('.film2-art');
    const artStyle = art ? getComputedStyle(art) : null;
    const artRect = art?.getBoundingClientRect();
    const sound = document.querySelector('.wrapped-sound');
    if (!film || !stage || !line) return null;

    const filmRect = film.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();
    const lineRect = line.getBoundingClientRect();
    const shareRect = share?.getBoundingClientRect();
    const legacy = stage.querySelectorAll(
      '.scene-kicker, .scene-foot, .scene-bridge, .scene-art, .scene-atlas, .scene-list, .scene-versus, .scene-route, .scene-credits, .wrapped-chapter',
    ).length;
    const oldLayers = document.querySelectorAll('.scene-page, .issue-page, .film-scene').length;
    const tags = [...film.querySelectorAll('h1, h2, p')].filter((node) => {
      const style = getComputedStyle(node);
      return style.display !== 'none' && style.visibility !== 'hidden';
    }).length;

    return {
      chapter: film.dataset.chapter ?? '',
      place: film.dataset.place ?? '',
      shape: art?.dataset.art ?? '',
      artVisible: Boolean(
        art && artStyle && artStyle.display !== 'none' && artStyle.visibility !== 'hidden' &&
          (artRect?.width ?? 0) > 0 && (artRect?.height ?? 0) > 0,
      ),
      line: line.textContent?.trim() ?? '',
      share: Boolean(share && shareRect && shareRect.width > 0 && shareRect.height > 0),
      soundRight: sound?.getBoundingClientRect().right ?? 0,
      viewport: window.innerWidth,
      tags,
      legacy,
      oldLayers,
      film: [filmRect.width, filmRect.height],
      stage: [stageRect.width, stageRect.height],
      lineRect: [lineRect.left, lineRect.top, lineRect.right, lineRect.bottom],
      clipped: line.scrollWidth > line.clientWidth + 1,
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      black: getComputedStyle(stage).backgroundColor,
    };
  });

  scenes.push(reading ?? { chapter: `index-${i}`, missing: true });
  if (i < 17) {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(460);
  }
}

await browser.close();

const failures = [];
const present = scenes.filter((scene) => !scene.missing);
if (present.length !== scenes.length) failures.push(`${scenes.length - present.length} page(s) had no film page`);
if (pageErrors.length) failures.push(`page errors: ${pageErrors.slice(0, 2).join(' / ')}`);
if (!moving) failures.push('the object is still inside a chapter');

for (const scene of present) {
  if (scene.oldLayers) failures.push(`${scene.chapter}: old scene layer is still in the document`);
  if (scene.legacy) failures.push(`${scene.chapter}: old label, footnote, diagram or credit block is back`);
  if (!scene.artVisible) failures.push(`${scene.chapter}: its scene object is missing or hidden`);
  if (scene.tags !== 1) failures.push(`${scene.chapter}: ${scene.tags} copy blocks, expected one sentence`);
  if (!scene.line) failures.push(`${scene.chapter}: no sentence`);
  if (scene.chapter !== 'cover' && !scene.share) failures.push(`${scene.chapter}: no share on the beat`);
  if (scene.soundRight > scene.viewport + 1) failures.push(`${scene.chapter}: the sound control is off screen`);
  if (scene.clipped) failures.push(`${scene.chapter}: the sentence is clipped`);
  if (scene.overflow) failures.push(`${scene.chapter}: document is wider than the viewport`);
  if (scene.film[0] < scene.stage[0] - 1 || scene.film[1] < scene.stage[1] - 1) {
    failures.push(`${scene.chapter}: the page is not full screen`);
  }
  if (scene.black !== 'rgb(5, 5, 6)') failures.push(`${scene.chapter}: the stage is not black (${scene.black})`);
}

const lines = new Set(present.map((scene) => scene.line));
const shapes = new Set(present.map((scene) => scene.shape).filter(Boolean));
const places = new Set(present.map((scene) => scene.place).filter(Boolean));
const shares = present.filter((scene) => scene.share).length;

if (lines.size < 16) failures.push(`only ${lines.size} distinct sentences`);
if (shapes.size < 16) failures.push(`only ${shapes.size} distinct shapes`);
if (places.size < 3) failures.push(`only ${places.size} text placements`);

if (failures.length) {
  console.log('WRAPPED FILM: FAIL');
  for (const failure of failures) console.log(`  - ${failure}`);
  process.exit(1);
}

console.log(
  `WRAPPED FILM: PASS — ${present.length} black stages, ${lines.size} sentences, ` +
    `${shapes.size} moving shapes, ${shares} shares, no old labels or diagrams, no spills.`,
);
