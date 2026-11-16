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

if (process.env.BREAK_WORLD) {
  await page.addStyleTag({ content: '.wrapped-world { display: none !important; }' });
}
if (process.env.BREAK_ART) {
  await page.addStyleTag({ content: '.scene-art, .scene-atlas { display: none !important; }' });
}

await page.getByRole('button', { name: /Begin/i }).click();
await page.waitForTimeout(500);

const scenes = [];

for (let i = 0; i < 18; i += 1) {
  if (process.env.SAME_WORLD) {
    await page.evaluate(() => {
      const world = document.querySelector('.wrapped-world');
      if (world) world.dataset.world = 'same';
    });
  }
  const reading = await page.evaluate(() => {
    const body = document.querySelector('.wrapped-body');
    const scene = body?.querySelector('.film-scene--in .scene-page') ?? body?.querySelector('.scene-page');
    if (!body || !scene) return null;
    const frame = scene.getBoundingClientRect();
    const oldVisible = [...body.children].filter((child) => {
      if (child === scene || child.classList.contains('film-stage')) return false;
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
      words: [...scene.querySelectorAll('.scene-word')].filter((el) => getComputedStyle(el).display !== 'none').length,
      bridge: (() => {
        const el = scene.querySelector('.scene-bridge');
        if (!el) return '';
        const style = getComputedStyle(el);
        return style.display === 'none' || style.visibility === 'hidden' ? '' : el.textContent?.trim() ?? '';
      })(),
      cut: Boolean(scene.querySelector('.scene-cut')),
      credits: Boolean(scene.querySelector('.scene-credits')),
      animation: (() => {
        const word = scene.querySelector('.scene-big .scene-word, .scene-year .scene-char');
        return word ? getComputedStyle(word).animationName : 'none';
      })(),
      before: document.querySelectorAll('.issue-page').length,
      pseudo: ['::before', '::after'].filter((pseudo) => {
        const style = getComputedStyle(body, pseudo);
        return style.display !== 'none' && style.content !== 'none' && style.content !== 'normal' && style.content !== '';
      }),
      world: (() => {
        const world = document.querySelector('.wrapped-world');
        if (!world) return false;
        const style = getComputedStyle(world);
        return style.display !== 'none' && style.visibility !== 'hidden' && world.getBoundingClientRect().width > 0;
      })(),
      atlas: Boolean(scene.querySelector('.scene-atlas')),
      art: (() => {
        const art = scene.querySelector('.scene-art, .scene-atlas');
        if (!art) return false;
        const style = getComputedStyle(art);
        return style.display !== 'none' && style.visibility !== 'hidden' && art.getBoundingClientRect().width > 0;
      })(),
      film: Boolean(scene.closest('.film-stage')),
      worldSet: document.querySelector('.wrapped-world')?.getAttribute('data-world') ?? '',
      canvas: Boolean(document.querySelector('.wrapped-world')) || Boolean(scene.querySelector('.scene-photo')),
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
    await page.waitForTimeout(560);
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
  if (!scene.world) failures.push(`${scene.chapter}: no continuous world`);
  if (!scene.canvas) failures.push(`${scene.chapter}: no scene media`);
  if (scene.spilled.length) failures.push(`${scene.chapter}: copy spills (${scene.spilled.slice(0, 3).join(', ')})`);
  if (scene.docWidth > scene.width + 1) failures.push(`${scene.chapter}: document is wider than the viewport`);
  if (scene.height < 400) failures.push(`${scene.chapter}: scene is only ${scene.height}px tall`);
}

const classes = new Set(present.map((scene) => scene.classes));
const bigs = new Set(present.map((scene) => scene.big).filter(Boolean));
const bridges = new Set(present.map((scene) => scene.bridge).filter(Boolean));
const words = present.reduce((total, scene) => total + scene.words, 0);
const worlds = new Set(present.map((scene) => scene.worldSet).filter(Boolean));
const animated = present.filter((scene) => scene.animation && scene.animation !== 'none').length;
const cuts = present.filter((scene) => scene.cut).length;

if (classes.size < 16) failures.push(`only ${classes.size} distinct scenes`);
if (bigs.size < 15) failures.push(`only ${bigs.size} distinct headlines`);
if (bridges.size < 14) failures.push(`only ${bridges.size} story bridges`);
if (words < 100) failures.push(`only ${words} kinetic words`);
if (animated < 15) failures.push(`only ${animated} scenes have kinetic type`);
if (cuts < 16) failures.push(`only ${cuts} scenes have a cut`);
if (worlds.size < 15) failures.push(`only ${worlds.size} distinct 3D worlds`);

for (const scene of present) {
  if (scene.chapter !== 'cover' && !scene.bridge) failures.push(`${scene.chapter}: no story bridge`);
  if (scene.chapter === 'close' && !scene.credits) failures.push(`${scene.chapter}: no closing credits`);
  if (scene.chapter === 'map' && !scene.atlas) failures.push(`${scene.chapter}: no map atlas`);
  if (!scene.film) failures.push(`${scene.chapter}: not inside the film stage`);
  if (!['cover', 'name', 'look'].includes(scene.chapter) && !scene.art) failures.push(`${scene.chapter}: no chapter diagram`);
}

if (failures.length) {
  console.log('WRAPPED SCENES: FAIL');
  for (const failure of failures) console.log(`  - ${failure}`);
  process.exit(1);
}

console.log(
  `WRAPPED SCENES: PASS — ${present.length} full-screen scenes, 0 old layers, ` +
    `${classes.size} distinct scenes, ${bigs.size} distinct headlines, ${worlds.size} distinct 3D worlds, ` +
    `${bridges.size} story bridges, ${words} kinetic words, no copy spills.`,
);
