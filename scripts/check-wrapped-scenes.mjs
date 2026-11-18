/*
 * **Is it still a film, or did it become a report again?**
 *
 * The reference is one colour field, one enormous mass cut off by the frame, one sentence, and a
 * share on the beat. This check walks every chapter and rejects the things that turned the old
 * yearbook back into a slide deck: a kicker, a footnote, a story bridge, a diagram, a chapter count,
 * a second copy block, a black stage, a prop-sized shape, a scrim - and it measures the sentence
 * against the colour it actually sits on, with the words hidden.
 *
 * It is not a taste check. It can prove the surface and the grammar are present, not that the shape
 * is beautiful.
 */

import { chromium } from 'playwright';
import fs from 'node:fs';

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
if (process.env.FLAT) {
  await page.addStyleTag({ content: '.wrapped-stage[data-chapter] { background: #050506 !important; }' });
}
if (process.env.NO_MASS) {
  await page.addStyleTag({ content: '.w-mass { display: none !important; }' });
}
if (process.env.WORD_ANIM) {
  await page.addStyleTag({ content: '.film2-word { animation: film-word-x 1s infinite !important; }' });
}
if (process.env.LOW_CONTRAST) {
  await page.addStyleTag({ content: '.film2-line { color: #ffffff !important; }' });
}
if (process.env.HUGE_TYPE) {
  await page.addStyleTag({ content: '.film2-line { font-size: 190px !important; line-height: 1 !important; }' });
}
if (process.env.OLD_CHROME) {
  await page.evaluate(() => {
    const note = document.createElement('span');
    note.className = 'scene-kicker';
    note.textContent = 'The old kicker';
    document.querySelector('.wrapped-stage')?.append(note);
  });
}

/*
 * **One reading of the chapter that is on screen.**
 *
 * Every rectangle is page-space: a tapped Begin can leave the page scrolled, and a rectangle that
 * silently carried the scroll offset put the contrast sampler one chapter out of step.
 */
const readScene = () =>
  page.evaluate(() => {
    const film = document.querySelector('.film2');
    const stage = document.querySelector('.wrapped-stage');
    const line = film?.querySelector('.film2-line');
    const share = document.querySelector('.film2-share');
    const art = film.querySelector('.film2-art');
    const artStyle = art ? getComputedStyle(art) : null;
    const artRect = art?.getBoundingClientRect();
    const sound = document.querySelector('.wrapped-sound');
    if (!film || !stage || !line) return null;

    window.scrollTo(0, 0);
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

    const mass = film.querySelector('.w-mass');
    const word = film.querySelector('.film2-word');

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
      /* The field is a gradient, so the colour lives in the image, not the background colour. */
      ground: getComputedStyle(stage).backgroundImage,
      steps: Number(mass?.dataset.steps ?? 0),
      noWebgl: Boolean(mass?.hasAttribute('data-fallback')),
      filmBox: [filmRect.left, filmRect.top, filmRect.width, filmRect.height],
      scrims: film.querySelectorAll('.film2-scrim, .film2-glow, .film2-photo-shade').length,
      stagger: word ? getComputedStyle(word).animationName : 'none',
      /* The field has to be the page, not a panel behind a prop: the art layer covers the frame. */
      artArea: artRect ? (artRect.width * artRect.height) / (filmRect.width * filmRect.height) : 0,
      /* Kept for the contrast pass, which reads the field with the words taken away. */
      ink: getComputedStyle(line).color,
    };
  });

/*
 * **Where the object is on screen, measured from the picture.**
 *
 * Two shots of the same chapter, one with the mass hidden, and the bounding box of the pixels that
 * changed is the object's real extent. This replaced a box the renderer published itself: that number
 * was correct, but the moment it was written kept landing before the film's own entrance had settled,
 * so the check read an older frame. A diff of two pictures has no such moment, and it is a
 * measurement of what the eye sees rather than of what the code intended.
 */
const objectBox = async ([left, top, width, height]) => {
  const clip = {
    x: Math.max(0, left),
    y: Math.max(0, top),
    width: Math.max(8, Math.min(width, 2000)),
    height: Math.max(8, Math.min(height, 2000)),
  };
  const withObject = await page.screenshot({ clip });
  await page.evaluate(() => {
    const mass = document.querySelector('.film2 .w-mass');
    if (mass) mass.style.visibility = 'hidden';
  });
  await page.waitForTimeout(140);
  const withoutObject = await page.screenshot({ clip });
  await page.evaluate(() => {
    const mass = document.querySelector('.film2 .w-mass');
    if (mass) mass.style.visibility = '';
  });

  return page.evaluate(
    async ([a, b]) => {
      const load = async (data) => {
        const image = new Image();
        image.src = data;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0);
        return context.getImageData(0, 0, canvas.width, canvas.height);
      };
      const first = await load(a);
      const second = await load(b);
      let left = Infinity;
      let top = Infinity;
      let right = -Infinity;
      let bottom = -Infinity;
      for (let y = 0; y < first.height; y += 1) {
        for (let x = 0; x < first.width; x += 1) {
          const i = (y * first.width + x) * 4;
          const delta = Math.max(
            Math.abs(first.data[i] - second.data[i]),
            Math.abs(first.data[i + 1] - second.data[i + 1]),
            Math.abs(first.data[i + 2] - second.data[i + 2]),
          );
          if (delta > 10) {
            if (x < left) left = x;
            if (x > right) right = x;
            if (y < top) top = y;
            if (y > bottom) bottom = y;
          }
        }
      }
      if (!Number.isFinite(left)) return null;
      return [left / first.width, top / first.height, right / first.width, bottom / first.height];
    },
    [`data:image/png;base64,${withObject.toString('base64')}`, `data:image/png;base64,${withoutObject.toString('base64')}`],
  );
};

const judgeObject = (scene, box) => {
  if (!scene) return;
  if (!box) {
    scene.massEdges = 0;
    return;
  }
  /* A box that reaches the edge of the clipped film is a box the picture has cut. */
  scene.mass = box;
  scene.massEdges = [box[0] <= 0.004, box[1] <= 0.004, box[2] >= 0.996, box[3] >= 0.996].filter(Boolean).length;
  if (process.env.MASS_DEBUG) {
    console.log(
      'MASS',
      scene.chapter,
      'box',
      box.map((value) => value.toFixed(3)).join(','),
      'edges',
      scene.massEdges,
      'film',
      scene.film.map((value) => Math.round(value)).join('x'),
    );
  }
  /*
   * No separate size test: once the picture has clipped the body, the visible extent is capped by
   * the frame, so "how big is it" is answered by how many edges it reaches instead.
   */
};

/* Filled by the motion sampler below, which the cover reaches before its own definition. */
const stillChapters = [];

/* The cover first, before Begin: the walk used to start after it and never measured it at all. */
const coverScene = await readScene();
if (coverScene) judgeObject(coverScene, await objectBox(coverScene.filmBox));
const scenes = [coverScene];
if (coverScene) await sampleMotion(coverScene.chapter);

await page.locator('.film2-begin').click();
await page.waitForTimeout(520);

/* A still object is the old failure wearing a new surface: two frames must differ. */
const motionBefore = await page.screenshot();
await page.waitForTimeout(760);
const motionAfter = await page.screenshot();
const moving = !motionBefore.equals(motionAfter);

/*
 * **Every chapter has to move, not just one.**
 *
 * A screenshot taken twice on the same chapter, after the entry has finished, is a pixel test of the
 * body's own clock: an object that has been frozen reads as a still picture of a card, which is the
 * thing this pass exists to end. Two 800ms frames stay well inside the short book's page timer.
 */
/* A function declaration, not a const: the cover is sampled before this line is reached. */
async function sampleMotion(name) {
  await page.waitForTimeout(700);
  const first = await page.evaluate(() => document.querySelector('.film2 .w-canvas')?.toDataURL() ?? '');
  await page.waitForTimeout(700);
  const second = await page.evaluate(() => document.querySelector('.film2 .w-canvas')?.toDataURL() ?? '');
  /* The canvas alone: a screenshot also carries the grain, which drifted even with the mass frozen. */
  if (!first || first === second) stillChapters.push(name);
}

for (let i = 0; i < 17; i += 1) {
  if (process.env.SAME_SHAPE) {
    await page.evaluate(() => {
      const art = document.querySelector('.film2-art');
      if (art) art.dataset.art = 'same';
    });
  }

  const scene = await readScene();
  if (scene) judgeObject(scene, await objectBox(scene.filmBox));
  scenes.push(scene);
  if (scene) await sampleMotion(scene.chapter);

  if (i < 16) {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(460);
  }
}

/*
 * **The workshop mode has to actually be bare.**
 *
 * The art pass is judged with the words, the share and the score off the page, so this proves the
 * mode puts them away and still leaves the picture and the way through the deck.
 */
const bareFailures = [];
await page.goto(`${BASE}${BASE.includes('?') ? '&' : '?'}bare=1`, { waitUntil: 'domcontentloaded' });
await page.locator('.wrapped-stage').waitFor();
await page.keyboard.press('ArrowRight');
await page.waitForTimeout(520);

const bareState = await page.evaluate(() => {
  const shown = (node) => Boolean(node && getComputedStyle(node).display !== 'none');
  return {
    marked: document.querySelector('.wrapped-stage')?.classList.contains('is-bare') ?? false,
    copy: shown(document.querySelector('.film2-copy')),
    dock: shown(document.querySelector('.film2-dock')),
    sound: Boolean(document.querySelector('.wrapped-sound')),
    art: shown(document.querySelector('.film2-art')),
    nav: Boolean(document.querySelector('.wrapped-progress')),
  };
});

if (!bareState.marked) bareFailures.push('bare=1 did not mark the stage');
if (bareState.copy) bareFailures.push('bare=1 still shows the sentence');
if (bareState.dock) bareFailures.push('bare=1 still shows the share dock');
if (bareState.sound) bareFailures.push('bare=1 still renders the sound switch');
if (!bareState.art) bareFailures.push('bare=1 hid the art as well as the words');
if (!bareState.nav) bareFailures.push('bare=1 removed the way through the deck');

/*
 * **The words have to be readable on the field, not on a plate.**
 *
 * In the stripped mode the sentence is gone, so the rectangle it occupies is pure field and mass.
 * That rectangle is sampled from a screenshot for every chapter and compared with the sentence's own
 * colour. Under 4.5:1 the composition has put something behind the words that they cannot sit on,
 * and the chapter is wrong - not the type.
 */
const srgb = (value) => {
  const channel = value / 255;
  return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
};
const luminance = ([r, g, b]) => 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
const parseColour = (value) => (value.match(/\d+(\.\d+)?/g) ?? ['0', '0', '0']).slice(0, 3).map(Number);
const contrastOf = (a, b) => {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

const sampleField = async (buffer) =>
  page.evaluate(async (url) => {
    const image = new Image();
    image.src = url;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0);
    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    let r = 0;
    let g = 0;
    let b = 0;
    let count = 0;
    for (let i = 0; i < data.length; i += 4) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      count += 1;
    }
    return [r / count, g / count, b / count];
  }, `data:image/png;base64,${buffer.toString('base64')}`);

await page.goto(`${BASE}${BASE.includes('?') ? '&' : '?'}bare=1`, { waitUntil: 'domcontentloaded' });
await page.locator('.wrapped-stage').waitFor();
await page.waitForTimeout(520);

const contrastFailures = [];
const walked = scenes.filter((scene) => !scene.missing);

for (let i = 0; i < walked.length; i += 1) {
  const scene = walked[i];

  if (scene.lineRect) {
    const [left, top, right, bottom] = scene.lineRect;
    const clip = {
      x: Math.max(0, left),
      y: Math.max(0, top),
      width: Math.max(4, Math.min(right, 1440) - Math.max(0, left)),
      height: Math.max(4, Math.min(bottom, 900) - Math.max(0, top)),
    };
    await page.evaluate(() => window.scrollTo(0, 0));
    const shot = await page.screenshot({ clip });
    const field = await sampleField(shot);
    const ratio = contrastOf(parseColour(scene.ink), field);
    scene.contrast = Math.round(ratio * 10) / 10;

    if (process.env.CONTRAST_DEBUG) {
      fs.mkdirSync('artifacts/wrapped-visuals', { recursive: true });
      fs.writeFileSync(`artifacts/wrapped-visuals/contrast-${scene.chapter}.png`, shot);
      console.log(
        scene.chapter,
        'ink', scene.ink,
        'field', field.map((value) => Math.round(value)).join(','),
        'rect', scene.lineRect.map((value) => Math.round(value)).join(','),
        'ratio', ratio.toFixed(2),
      );
    }

    if (ratio < 4.5) {
      contrastFailures.push(`${scene.chapter}: the sentence is ${ratio.toFixed(1)}:1 on its field`);
    }
  }

  if (i < walked.length - 1) {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(420);
  }
}

/*
 * **The phone is its own frame.**
 *
 * A mass that is cropped on a laptop can be a stripe on a phone, and a sentence that fits at 1440 can
 * run out of a 360px screen. This walk measures the same things at 360x800: nothing clipped, nothing
 * sideways, the sentence and the controls inside the viewport, the art still covering the page.
 */
const phoneFailures = [];
await page.setViewportSize({ width: 360, height: 800 });
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.locator('.wrapped-stage').waitFor();
await page.waitForTimeout(400);
for (let i = 0; i < 3; i += 1) {
  if (await overlays.count()) await overlays.first().click().catch(() => {});
  await page.waitForTimeout(100);
}
await page.reload({ waitUntil: 'domcontentloaded' });
await page.locator('.wrapped-stage').waitFor();
await page.waitForTimeout(450);

const readPhone = () =>
  page.evaluate(() => {
    const film = document.querySelector('.film2');
    const line = film?.querySelector('.film2-line');
    const share = document.querySelector('.film2-share');
    const sound = document.querySelector('.wrapped-sound');
    const art = film?.querySelector('.film2-art');
    if (!film || !line) return null;
    window.scrollTo(0, 0);
    const filmRect = film.getBoundingClientRect();
    const lineRect = line.getBoundingClientRect();
    const artRect = art?.getBoundingClientRect();
    const shareRect = share?.getBoundingClientRect();
    const soundRect = sound?.getBoundingClientRect();
    return {
      chapter: film.dataset.chapter ?? '',
      clipped: line.scrollWidth > line.clientWidth + 1,
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      lineInside:
        lineRect.left >= -1 &&
        lineRect.right <= window.innerWidth + 1 &&
        lineRect.top >= -1 &&
        lineRect.bottom <= window.innerHeight + 1,
      shareInside: shareRect ? shareRect.bottom <= window.innerHeight + 1 && shareRect.right <= window.innerWidth + 1 : false,
      soundInside: soundRect ? soundRect.right <= window.innerWidth + 1 : true,
      artArea: artRect ? (artRect.width * artRect.height) / (filmRect.width * filmRect.height) : 0,
    };
  });

const phonePages = [await readPhone()];
await page.locator('.film2-begin').click();
await page.waitForTimeout(420);

for (let i = 0; i < 17; i += 1) {
  phonePages.push(await readPhone());
  if (i < 16) {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(430);
  }
}

for (const phone of phonePages) {
  if (!phone) {
    phoneFailures.push('phone: a chapter had no film page');
    continue;
  }
  if (phone.clipped) phoneFailures.push(`phone ${phone.chapter}: the sentence is clipped`);
  if (phone.overflow) phoneFailures.push(`phone ${phone.chapter}: the page scrolls sideways`);
  if (!phone.lineInside) phoneFailures.push(`phone ${phone.chapter}: the sentence leaves the screen`);
  if (!phone.shareInside && phone.chapter !== 'cover') phoneFailures.push(`phone ${phone.chapter}: the share is off screen`);
  if (!phone.soundInside) phoneFailures.push(`phone ${phone.chapter}: the sound control is off screen`);
  if (phone.artArea < 0.85) phoneFailures.push(`phone ${phone.chapter}: the art covers ${Math.round(phone.artArea * 100)}% of the frame`);
}

await browser.close();

const failures = [...bareFailures, ...contrastFailures, ...phoneFailures];
const present = scenes.filter((scene) => !scene.missing);
if (present.length !== scenes.length) failures.push(`${scenes.length - present.length} page(s) had no film page`);
if (pageErrors.length) failures.push(`page errors: ${pageErrors.slice(0, 2).join(' / ')}`);
if (!moving) failures.push('the object is still inside a chapter');
for (const name of stillChapters) failures.push(`${name}: the object does not move on its own clock`);

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
  if (!scene.ground || !scene.ground.includes('gradient')) {
    failures.push(`${scene.chapter}: the stage is not a colour field`);
  }
  if (scene.noWebgl) failures.push(`${scene.chapter}: WebGL did not start, so the object is a fallback`);
  if (!scene.mass) failures.push(`${scene.chapter}: no object could be seen on the page`);
  if (scene.mass && scene.massEdges < 2) {
    failures.push(`${scene.chapter}: the object is cut by ${scene.massEdges} edge(s), expected two`);
  }
  if (scene.steps < 5) failures.push(`${scene.chapter}: the body is not built of steps (${scene.steps})`);
  if (scene.scrims) failures.push(`${scene.chapter}: a scrim or glow is back over the picture`);
  if (scene.stagger !== 'none') failures.push(`${scene.chapter}: the words are performing again (${scene.stagger})`);
  if (scene.artArea < 0.85) {
    failures.push(`${scene.chapter}: the art covers ${Math.round(scene.artArea * 100)}% of the frame`);
  }
}

const lines = new Set(present.map((scene) => scene.line));
const shapes = new Set(present.map((scene) => scene.shape).filter(Boolean));
const places = new Set(present.map((scene) => scene.place).filter(Boolean));
const shares = present.filter((scene) => scene.share).length;
const grounds = new Set(present.map((scene) => scene.ground));
const weakest = Math.min(...present.map((scene) => scene.contrast ?? 0));

if (grounds.size < 16) failures.push(`only ${grounds.size} colour fields`);
if (lines.size < 16) failures.push(`only ${lines.size} distinct sentences`);
if (shapes.size < 16) failures.push(`only ${shapes.size} distinct shapes`);
if (places.size < 3) failures.push(`only ${places.size} text placements`);

if (failures.length) {
  console.log('WRAPPED FILM: FAIL');
  for (const failure of failures) console.log(`  - ${failure}`);
  process.exit(1);
}

const fewestSteps = Math.min(...present.map((scene) => scene.steps));

console.log(
  `WRAPPED FILM: PASS — ${present.length} colour fields, ${grounds.size} grounds, ${shapes.size} masses, ` +
    `${lines.size} still sentences (weakest ${weakest.toFixed(1)}:1 on its own field), ${shares} shares, ` +
    `every object cut on two edges and built of steps (fewest ${fewestSteps}), every chapter moving on its own clock, ` +
    'no scrim, no old labels or diagrams, no spills, 18 phone pages fit 360x800, and bare=1 shows the picture alone.',
);
