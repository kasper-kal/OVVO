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

/*
 * `STILL_MOTION=1` pins every object's clock at zero (`?stillmotion=1`), which is the deck as it was
 * before the film was given something to do: a picture per card instead of a film per card. It is the
 * break that proves the motion score below is measuring motion and not a drifting grain.
 */
const BASE =
  (process.env.YEARBOOK_URL ?? 'http://127.0.0.1:3000/yearbook?demo=1&persona=regular') +
  (process.env.STILL_MOTION ? '&stillmotion=1' : '');
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

/*
 * **How many chapters the deck has, read from the deck.**
 *
 * The walk used to count to seventeen because seventeen was right on the day it was written. Two
 * chapters were added in phase 3, and a hard-coded number would have quietly stopped walking the
 * end of the film. The progress dashes are one per chapter, so the page is asked instead.
 */
const chapterCount = await page.locator('.wrapped-progress__seg').count();

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
/* Phase 2's breaks: one ink everywhere, and a field with no colour in it at all. */
if (process.env.SAME_INK) {
  await page.addStyleTag({ content: '.film2-line { color: #ffffff !important; }' });
}
if (process.env.DIM) {
  await page.addStyleTag({
    content: '.wrapped-stage[data-chapter] { background: linear-gradient(180deg, #1a1a1a, #050505) !important; }',
  });
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
const readScene = async () => {
  const scene = await page.evaluate(() => {
    const film = document.querySelector('.film2');
    const stage = document.querySelector('.wrapped-stage');
    const line = film?.querySelector('.film2-line');
    /* The closing card carries its own share on the poster, so the beat's share is either one. */
    const share = document.querySelector('.film2-share, .w-poster__share');
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
    /*
     * **The field has to be a colour, and it has to be its own colour.**
     *
     * Every stop of the gradient is read and reduced to two numbers the eye actually notices: how
     * much colour is in it (the gap between the largest and smallest channel) and how light it is.
     * A tint of black scores near zero on the first and is not a world; two neighbours with the same
     * family read as one long card, so the family is read too.
     */
    const stops = (getComputedStyle(stage).backgroundImage.match(/rgba?\([^)]+\)/g) ?? []).map((entry) =>
      (entry.match(/\d+(\.\d+)?/g) ?? ['0', '0', '0']).slice(0, 3).map(Number),
    );
    const chromaOf = ([r, g, b]) => Math.max(r, g, b) - Math.min(r, g, b);
    const lightOf = ([r, g, b]) => (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
    const hexChroma = (hex) => {
      const value = parseInt(hex.replace('#', ''), 16);
      const r = (value >> 16) & 255;
      const g = (value >> 8) & 255;
      const b = value & 255;
      return Math.max(r, g, b) - Math.min(r, g, b);
    };
    const massColours = (stage.dataset.mass ?? '').split(',').filter((entry) => entry.startsWith('#'));

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
      family: stage.dataset.family ?? '',
      chroma: stops.length ? Math.max(...stops.map(chromaOf)) : 0,
      light: stops.length ? Math.max(...stops.map(lightOf)) : 0,
      massChroma: massColours.length ? Math.max(...massColours.map(hexChroma)) : 0,
      focal: film.querySelectorAll('.w-focal, .w-pins, .w-photo, .w-rank').length,
      /*
       * **The list, read as a list.**
       *
       * Every row's number, its name, its count and where its bottom lands: the ordering, the
       * arithmetic and the cut are all read off the page rather than rebuilt from the deck's data.
       */
      rank: (() => {
        const list = film.querySelector('.w-rank');
        if (!list) return null;
        const frameRect = film.getBoundingClientRect();
        const rows = [...list.querySelectorAll('.w-rank__row')].map((row) => {
          const rect = row.getBoundingClientRect();
          return {
            pos: Number(row.dataset.pos ?? 0),
            count: Number(row.dataset.count ?? -1),
            name: row.querySelector('.w-rank__name')?.textContent?.trim() ?? '',
            tile: row.querySelector('.w-rank__tile')?.textContent?.trim() ?? '',
            top: rect.top,
            bottom: rect.bottom,
          };
        });
        return { rows, total: Number(list.dataset.total ?? 0), frameBottom: frameRect.bottom };
      })(),
      day: film.dataset.day ?? '',
      dayCount: Number(film.dataset.dayCount ?? 0),
      /* The closing poster: which colourway is on screen, and whether it fits in the frame. */
      poster: (() => {
        const card = film.querySelector('.w-poster');
        if (!card) return null;
        const rect = card.getBoundingClientRect();
        const shareRect = card.querySelector('.w-poster__share')?.getBoundingClientRect();
        return {
          colour: card.dataset.poster ?? '',
          share: Boolean(shareRect && shareRect.width > 0),
          replay: Boolean(card.querySelector('.w-poster__replay')),
          arrows: card.querySelectorAll('.w-poster__arrow').length,
          shareHeight: shareRect ? Math.round(shareRect.height) : 0,
          inside:
            rect.top >= -1 &&
            rect.left >= -1 &&
            rect.right <= window.innerWidth + 1 &&
            rect.bottom <= window.innerHeight + 1,
        };
      })(),
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

  /* The one break that lives in the reader rather than the page: every chapter in one family. */
  if (scene && process.env.SAME_GROUND) scene.family = 'hot';
  return scene;
};

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

/*
 * **Where the object actually is, read from its own canvas.**
 *
 * Two page screenshots with the mass hidden and the mass shown is how this was measured before, and
 * it is honest for an object that is nothing like its field. It stops being honest when a lit face
 * of the body happens to land on the field's own colour: the pixel is unchanged, so the diff says
 * the object is not there, and the ranked chapter's crop came and went between runs for exactly
 * that reason. The canvas is the object: its alpha channel has no field, no grain and no DOM layers
 * over it, so the box of everything it drew is the body's extent, mapped into the frame.
 */
const objectAlphaBox = async ([frameLeft, frameTop, frameWidth, frameHeight]) =>
  page.evaluate(
    async ([left, top, width, height]) => {
      const canvas = document.querySelector('.film2 .w-canvas');
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const image = new Image();
      image.src = canvas.toDataURL();
      await image.decode();
      if (!image.width || !image.height) return null;
      const work = document.createElement('canvas');
      work.width = image.width;
      work.height = image.height;
      const context = work.getContext('2d');
      context.drawImage(image, 0, 0);
      const { data } = context.getImageData(0, 0, work.width, work.height);
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (let y = 0; y < work.height; y += 1) {
        for (let x = 0; x < work.width; x += 1) {
          if (data[(y * work.width + x) * 4 + 3] > 12) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      if (!Number.isFinite(minX)) return null;
      /* Canvas pixels to frame fractions, so a body can run past the frame and still be measured. */
      const toX = (value) => (rect.left + (value / work.width) * rect.width - left) / width;
      const toY = (value) => (rect.top + (value / work.height) * rect.height - top) / height;
      return [toX(minX), toY(minY), toX(maxX), toY(maxY)];
    },
    [frameLeft, frameTop, frameWidth, frameHeight],
  );

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
/* How far each card's picture moved in a tenth of a second, 0–255 per channel. */
const motionScores = [];
/*
 * **The floor is a proof of life, not a speed limit.**
 *
 * A frozen canvas measures exactly nought (`STILL_MOTION=1` proves it), and the quietest real card —
 * the ranking, whose bars are wide and shallow — measures between a third and one. The floor sits
 * above nought and below every card that turns. How fast the film moves is the recording's job to
 * answer, not this file's: `design/wrapped-comparison/REVIEW-2026-11-18.md` measures it at 0.1s.
 */
const MOTION_FLOOR = Number(process.env.MOTION_FLOOR ?? 0.1);

/* The cover first, before Begin: the walk used to start after it and never measured it at all. */
const coverScene = await readScene();
if (coverScene) judgeObject(coverScene, await objectAlphaBox(coverScene.filmBox));
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
/*
 * **A tenth of a second, which is the reference's own beat.**
 *
 * The old test asked whether two frames 700ms apart were different at all, so a card that swayed one
 * pixel passed. Read against the recording, our cards moved at about half the reference's rate and a
 * third of them barely moved at all. This measures the mean change per channel across a tenth of a
 * second of the canvas — the picture, without the grain over it — and holds every card to a floor.
 */
/* A declaration, not a const: the walk calls it before this line is reached. */
function filmFrame() {
  return page.evaluate(() => {
    const source = document.querySelector('.film2 .w-canvas');
    if (!source) return null;
    const small = document.createElement('canvas');
    small.width = 24;
    small.height = 52;
    const context = small.getContext('2d');
    if (!context) return null;
    context.drawImage(source, 0, 0, small.width, small.height);
    return Array.from(context.getImageData(0, 0, small.width, small.height).data);
  });
}

/* The pause button holds the picture without moving it; a second press lets it go again. */
async function holdFrame(hold) {
  const button = page.locator('.wrapped-pause');
  if (!(await button.count())) return;
  const paused = await page.evaluate(
    () => document.querySelector('.wrapped-pause')?.getAttribute('aria-pressed') === 'true' ||
      document.querySelector('.wrapped-pause')?.dataset.paused === '1',
  );
  if (hold === paused) return;
  await button.click({ timeout: 4000 }).catch(() => {});
  await page.waitForTimeout(140);
}

async function sampleMotion(name) {
  await page.waitForTimeout(1250);
  const first = await filmFrame();
  await page.waitForTimeout(100);
  const second = await filmFrame();
  if (!first || !second) {
    stillChapters.push(name);
    return;
  }
  let sum = 0;
  for (let i = 0; i < first.length; i += 4) {
    sum += Math.abs(first[i] - second[i]) + Math.abs(first[i + 1] - second[i + 1]) + Math.abs(first[i + 2] - second[i + 2]);
  }
  const mean = sum / (first.length * 0.75);
  motionScores.push({ name, mean: Math.round(mean * 100) / 100 });
  if (mean < MOTION_FLOOR) stillChapters.push(`${name} (moved ${Math.round(mean * 100) / 100} of ${MOTION_FLOOR})`);
}

for (let i = 0; i < chapterCount - 1; i += 1) {
  if (process.env.SAME_SHAPE) {
    await page.evaluate(() => {
      const art = document.querySelector('.film2-art');
      if (art) art.dataset.art = 'same';
    });
  }

  /*
   * **Composition is measured on a held frame.**
   *
   * A card that turns for its whole life has no single pose, and sampling the crop and the contrast
   * at whatever instant the walk arrives gave two different answers on two runs — the object could
   * be mid-sway over the sentence on one and clear of it on the next. Pause holds the picture where
   * it stands, so these two rules measure the composition the card settles into. Motion is measured
   * after the hold is released, one tenth of a second at a time.
   */
  await holdFrame(true);
  const scene = await readScene();
  if (scene) judgeObject(scene, await objectAlphaBox(scene.filmBox));
  scenes.push(scene);
  await holdFrame(false);
  if (scene) await sampleMotion(scene.chapter);

  if (i < chapterCount - 2) {
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

    /* 7:1, not 4.5:1: the weakest card was passing the small-text bar on a headline nobody could read. */
    if (ratio < 7) {
      contrastFailures.push(`${scene.chapter}: the sentence is ${ratio.toFixed(1)}:1 on its field, under 7:1`);
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
    const share = document.querySelector('.film2-share, .w-poster__share');
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
      /* The closing poster is the one piece that could hang out of a small phone. */
      posterInside: (() => {
        const card = document.querySelector('.w-poster');
        if (!card) return true;
        const rect = card.getBoundingClientRect();
        return (
          rect.top >= -1 &&
          rect.left >= -1 &&
          rect.right <= window.innerWidth + 1 &&
          rect.bottom <= window.innerHeight + 1
        );
      })(),
    };
  });

const phonePages = [await readPhone()];
await page.locator('.film2-begin').click();
await page.waitForTimeout(420);

for (let i = 0; i < chapterCount - 1; i += 1) {
  phonePages.push(await readPhone());
  if (i < chapterCount - 2) {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(430);
  }
}

const judgePhone = (pages, width) => {
  for (const phone of pages) {
    if (!phone) {
      phoneFailures.push(`${width}px: a chapter had no film page`);
      continue;
    }
    if (phone.clipped) phoneFailures.push(`${width}px ${phone.chapter}: the sentence is clipped`);
    if (phone.overflow) phoneFailures.push(`${width}px ${phone.chapter}: the page scrolls sideways`);
    if (!phone.lineInside) phoneFailures.push(`${width}px ${phone.chapter}: the sentence leaves the screen`);
    if (!phone.shareInside && phone.chapter !== 'cover') {
      phoneFailures.push(`${width}px ${phone.chapter}: the share is off screen`);
    }
    if (!phone.soundInside) phoneFailures.push(`${width}px ${phone.chapter}: the sound control is off screen`);
    if (phone.artArea < 0.85) {
      phoneFailures.push(`${width}px ${phone.chapter}: the art covers ${Math.round(phone.artArea * 100)}% of the frame`);
    }
    if (!phone.posterInside) phoneFailures.push(`${width}px ${phone.chapter}: the poster hangs out of the frame`);
  }
};
judgePhone(phonePages, 360);

/*
 * **320 is the smallest phone the app supports, and the deck is one card taller than it was.**
 *
 * The poster, the dashes across the top and the rail are all new furniture on a 320-wide screen, so
 * the same walk is done again at the narrowest width: nothing clipped, nothing sideways, the poster
 * inside the frame.
 */
await page.setViewportSize({ width: 320, height: 568 });
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

const smallPages = [await readPhone()];
await page.locator('.film2-begin').click();
await page.waitForTimeout(420);
for (let i = 0; i < chapterCount - 1; i += 1) {
  smallPages.push(await readPhone());
  if (i < chapterCount - 2) {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(430);
  }
}
judgePhone(smallPages, 320);

/*
 * **The map, the hold, and the end.**
 *
 * Three things phase 4 promised and none of them is a picture: one dash per chapter across the top
 * with a rail down the left, a pause that actually holds a chapter still and lets it go again, and a
 * closing poster that carries its own Share and Replay instead of a pill. Each is read from the page
 * and each has a break that makes it fail: `NO_PAUSE=1` swallows the pause button's own click, which
 * is exactly the deck as it was before this phase.
 */
const progressFailures = [];
const pauseFailures = [];
const posterFailures = [];

await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.locator('.wrapped-stage').waitFor();
await page.waitForTimeout(400);
const lifelines = page.locator('.overlay button, .sheet button');
for (let i = 0; i < 3; i += 1) {
  if (await lifelines.count()) await lifelines.first().click().catch(() => {});
  await page.waitForTimeout(120);
}
await page.locator('.film2-begin').click().catch(() => {});
await page.waitForTimeout(520);
for (let i = 0; i < 4; i += 1) {
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(420);
}

const progress = await page.evaluate(() => {
  const nav = document.querySelector('.wrapped-progress');
  const segments = [...document.querySelectorAll('.wrapped-progress__seg')];
  const rail = document.querySelector('.wrapped-rail');
  if (!nav) return null;
  return {
    dashes: segments.length,
    top: Math.round(nav.getBoundingClientRect().top),
    filled: segments.filter((segment) => segment.classList.contains('is-now')).length,
    railHeight: rail ? Math.round(rail.getBoundingClientRect().height) : 0,
    railFill: rail ? Math.round(rail.querySelector('i').getBoundingClientRect().height) : 0,
  };
});

if (!progress) progressFailures.push('the deck has no progress map');
else {
  if (progress.dashes !== scenes.length) {
    progressFailures.push(`progress: ${progress.dashes} dashes for ${scenes.length} chapters`);
  }
  if (progress.top > 90) progressFailures.push(`progress: the dashes sit ${progress.top}px down, not across the top`);
  if (progress.filled !== 1) progressFailures.push(`progress: ${progress.filled} dashes are marked as the one you are on`);
  if (progress.railHeight < 60) progressFailures.push(`progress: the rail down the left is ${progress.railHeight}px tall`);
  if (!(progress.railFill > 0 && progress.railFill <= progress.railHeight)) {
    progressFailures.push('progress: the rail does not fill with the story');
  }
}

/* The hold: ten seconds still, then moving again within two seconds of letting go. */
const canvasFrame = () => page.evaluate(() => document.querySelector('.film2 .w-canvas')?.toDataURL() ?? '');
const pauseControl = page.locator('.wrapped-pause');
if (!(await pauseControl.count())) {
  pauseFailures.push('the header has no pause control beside the sound switch');
} else {
  if (process.env.NO_PAUSE) {
    /* The deck before this phase: a button that looks like a control and changes nothing. */
    await page.evaluate(() => {
      document
        .querySelector('.wrapped-pause')
        ?.addEventListener('click', (event) => event.stopPropagation(), true);
    });
  }
  await pauseControl.click();
  await page.waitForTimeout(300);
  const heldFrame = await canvasFrame();
  await page.waitForTimeout(10000);
  const afterHold = await canvasFrame();
  if (!heldFrame || heldFrame !== afterHold) {
    pauseFailures.push('the object moved while the card was held for ten seconds');
  }
  await pauseControl.click();
  await page.waitForTimeout(1600);
  const movedFrame = await canvasFrame();
  await page.waitForTimeout(800);
  const laterFrame = await canvasFrame();
  if (!movedFrame || movedFrame === laterFrame) {
    pauseFailures.push('the object did not move again within two seconds of resuming');
  }
}

/* The end: the poster, its own Share and Replay, and three colourways that come back round. */
for (let i = 0; i < chapterCount; i += 1) {
  if (await page.locator('.film2--close').count()) break;
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(210);
}
await page.waitForTimeout(700);

const poster = await page.evaluate(() => {
  const card = document.querySelector('.w-poster');
  if (!card) return null;
  const rect = card.getBoundingClientRect();
  const shareRect = card.querySelector('.w-poster__share')?.getBoundingClientRect();
  return {
    colour: card.dataset.poster ?? '',
    share: Boolean(shareRect && shareRect.width > 0),
    shareHeight: shareRect ? Math.round(shareRect.height) : 0,
    replay: Boolean(card.querySelector('.w-poster__replay')),
    arrows: card.querySelectorAll('.w-poster__arrow').length,
    dockPill: Boolean(document.querySelector('.film2-dock .film2-share')),
    inside:
      rect.top >= -1 &&
      rect.left >= -1 &&
      rect.right <= window.innerWidth + 1 &&
      rect.bottom <= window.innerHeight + 1,
  };
});

if (!poster) posterFailures.push('the closing chapter has no poster');
else {
  if (!poster.share) posterFailures.push('the poster has no share of its own');
  if (poster.shareHeight < 44) posterFailures.push(`the poster's share is ${poster.shareHeight}px tall`);
  if (!poster.replay) posterFailures.push('the poster has no Replay from beginning');
  if (poster.arrows !== 2) posterFailures.push(`the poster has ${poster.arrows} arrows for three colourways`);
  if (!poster.inside) posterFailures.push('the poster does not fit inside the frame');
  if (poster.dockPill) posterFailures.push('the closing card still fetches its share from a pill');

  const colours = [poster.colour];
  for (let i = 0; i < 3; i += 1) {
    await page.locator('.w-poster__arrow').last().click();
    await page.waitForTimeout(180);
    colours.push(await page.locator('.w-poster').getAttribute('data-poster'));
  }
  if (new Set(colours.slice(0, 3)).size !== 3) {
    posterFailures.push(`the poster has ${new Set(colours.slice(0, 3)).size} colourways, expected three (${colours.join(',')})`);
  }
  if (colours[3] !== colours[0]) {
    posterFailures.push(`paging three times did not come back to the first colourway (${colours.join(',')})`);
  }
}

/*
 * **The card you send has to print the list you watched.**
 *
 * The share sheet is opened on the ranked chapter and asked what it was handed, in order. The
 * card's own rows are the only thing it draws, so this compares the two channels instead of two
 * pictures: `SHARE_MISMATCH=1` reopens the sheet with `?shareorder=reverse`, which hands the same
 * five backwards, and the run must catch it.
 */
const shareUrl = process.env.SHARE_MISMATCH ? `${BASE}&shareorder=reverse` : BASE;
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(shareUrl, { waitUntil: 'domcontentloaded' });
await page.locator('.wrapped-stage').waitFor();
await page.locator('.film2-begin').click().catch(() => {});
await page.waitForTimeout(420);
for (let i = 0; i < chapterCount; i += 1) {
  if (await page.locator('.film2--ranked').count()) break;
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(200);
}
await page.locator('.film2-share').click().catch(() => {});
await page.waitForTimeout(760);
const shareRankHanded =
  (await page
    .locator('[data-share-rank]')
    .first()
    .getAttribute('data-share-rank')
    .catch(() => null)) ?? '';

await browser.close();

const failures = [
  ...bareFailures,
  ...contrastFailures,
  ...phoneFailures,
  ...progressFailures,
  ...pauseFailures,
  ...posterFailures,
];
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
  if (!scene.focal) failures.push(`${scene.chapter}: there is nothing to look at but the form`);
  if (!scene.family) failures.push(`${scene.chapter}: the chapter has no colour family`);
  if (scene.light < 60 && scene.chroma < 50) failures.push(`${scene.chapter}: the field is a tint of black`);
  if (scene.family !== 'paper' && scene.chroma < 70) {
    failures.push(`${scene.chapter}: the field is washed out (chroma ${scene.chroma})`);
  }
  if (scene.family === 'paper' && (scene.light < 200 || scene.massChroma < 70)) {
    failures.push(
      `${scene.chapter}: a paper field needs a light ground and a loud form (light ${Math.round(scene.light)}, form ${scene.massChroma})`,
    );
  }
  if (scene.scrims) failures.push(`${scene.chapter}: a scrim or glow is back over the picture`);
  if (scene.stagger !== 'none') failures.push(`${scene.chapter}: the words are performing again (${scene.stagger})`);
  if (scene.artArea < 0.85) {
    failures.push(`${scene.chapter}: the art covers ${Math.round(scene.artArea * 100)}% of the frame`);
  }
}

/*
 * **Phase 3's two chapters, on trial.**
 *
 * A ranked list is only a ranking if the rows are in order and the numbers are possible; a day
 * chapter is only worth a card if the day holds more than one journey and the sentence carries both
 * the date and the count it was built from. The last row must also run past the bottom of the frame,
 * which is what makes five rows read as the head of a longer list. `SHUFFLE=1` reverses the rows
 * after they are read, the way a deck that sorted nothing would look.
 */
const ids = present.map((scene) => scene.chapter);
const where = (id) => ids.indexOf(id);
const rankedScene = present.find((scene) => scene.chapter === 'ranked') ?? null;
const dayScene = present.find((scene) => scene.chapter === 'day') ?? null;
let rank = rankedScene?.rank ?? null;
if (process.env.SHUFFLE && rank) rank = { ...rank, rows: [...rank.rows].reverse() };

if (!rankedScene || !rank) {
  failures.push('the deck has no ranked list, so there is nothing to screenshot');
} else {
  const { rows, total, frameBottom } = rank;
  if (rows.length !== 5) failures.push(`ranked: ${rows.length} rows, expected five`);
  const sum = rows.reduce((running, row) => running + row.count, 0);
  rows.forEach((row, at) => {
    if (row.pos !== at + 1) failures.push(`ranked: row ${at + 1} is numbered ${row.pos}`);
    if (!row.name) failures.push(`ranked: row ${at + 1} has no name`);
    if (!row.tile) failures.push(`ranked: row ${at + 1} has no tile to look at`);
    if (!(row.count > 0)) failures.push(`ranked: row ${at + 1} carries no count`);
    if (row.bottom <= row.top) failures.push(`ranked: row ${at + 1} has no height`);
    if (at > 0) {
      const before = rows[at - 1];
      const ordered =
        row.count < before.count || (row.count === before.count && row.name > before.name);
      if (!ordered) {
        failures.push(
          `ranked: row ${at + 1} (${row.name}, ${row.count}) is not below row ${at} (${before.name}, ${before.count})`,
        );
      }
    }
  });
  /* A stop counts once for each journey it ended, so five stops cannot pass twice the year. */
  if (sum > 2 * total) {
    failures.push(`ranked: the five rows add up to ${sum} appearances, more than both ends of ${total} journeys`);
  }
  if (rows.length && rows[rows.length - 1].bottom <= frameBottom) {
    failures.push('ranked: the last row ends inside the frame, so the list looks complete');
  }
  if (rows.length && rows[0].top >= frameBottom) failures.push('ranked: the list starts below the frame');
  if (where('ranked') <= where('look')) failures.push('ranked: the list does not follow the look');
  if (where('eras') >= 0 && where('ranked') >= where('eras')) {
    failures.push('ranked: the list is not before the eras');
  }
}

if (!dayScene) {
  failures.push('the deck has no busiest-day chapter');
} else {
  const held = dayScene.dayCount;
  if (!(held >= 2)) failures.push(`day: the busiest day holds ${held} journey(s), which is not a story`);
  if (!dayScene.day) failures.push('day: the chapter carries no date');
  if (!dayScene.line.includes(String(held))) failures.push(`day: the sentence leaves the count out (${dayScene.line})`);
  if (dayScene.day && !dayScene.line.includes(dayScene.day)) {
    failures.push(`day: the sentence leaves the date out (${dayScene.line})`);
  }
  if (rank && held > rank.total) failures.push(`day: ${held} journeys on one day, out of ${rank.total} in the year`);
  if (where('ranked') >= 0 && where('day') < where('ranked')) failures.push('day: the single day comes before the list');
}

const shownList = rank ? rank.rows.map((row) => `${row.name}:${row.count}`).join('|') : '';
if (!shareRankHanded) failures.push('the share sheet carries no ranked card');
else if (shareRankHanded !== shownList) {
  failures.push(`the share card prints a different list (${shareRankHanded}) from the film (${shownList})`);
}

const lines = new Set(present.map((scene) => scene.line));
const shapes = new Set(present.map((scene) => scene.shape).filter(Boolean));
const places = new Set(present.map((scene) => scene.place).filter(Boolean));
const shares = present.filter((scene) => scene.share).length;
const grounds = new Set(present.map((scene) => scene.ground));
const weakest = Math.min(...present.map((scene) => scene.contrast ?? 0));
const families = present.map((scene) => scene.family);

/* Two neighbours in one colour world read as one long card, so the rotation has to hold. */
for (let i = 1; i < families.length; i += 1) {
  if (families[i] && families[i] === families[i - 1]) {
    failures.push(`${present[i].chapter}: shares its colour family (${families[i]}) with ${present[i - 1].chapter}`);
  }
}
if (families.some((family) => !family)) failures.push('a chapter did not report its colour family');

/* The floor follows the deck: two fewer than its chapter count, so a lost chapter is caught. */
const floor = Math.max(16, chapterCount - 2);
if (grounds.size < floor) failures.push(`only ${grounds.size} colour fields of ${chapterCount} chapters`);
if (lines.size < floor) failures.push(`only ${lines.size} distinct sentences of ${chapterCount} chapters`);
if (shapes.size < floor) failures.push(`only ${shapes.size} distinct shapes of ${chapterCount} chapters`);
if (places.size < 3) failures.push(`only ${places.size} text placements`);

if (failures.length) {
  console.log('WRAPPED FILM: FAIL');
  for (const failure of failures) console.log(`  - ${failure}`);
  process.exit(1);
}

const fewestSteps = Math.min(...present.map((scene) => scene.steps));
const weakestMotion = motionScores.length ? Math.min(...motionScores.map((entry) => entry.mean)) : 0;
const strongestMotion = motionScores.length ? Math.max(...motionScores.map((entry) => entry.mean)) : 0;

console.log(
  `WRAPPED FILM: PASS — ${present.length} colour fields, ${grounds.size} grounds, ${shapes.size} masses, ` +
    `${lines.size} still sentences (weakest ${weakest.toFixed(1)}:1 on its own field), ${shares} shares, ` +
    `every object cut on two edges and built of steps (fewest ${fewestSteps}), ` +
    `every card moving in a tenth of a second (weakest ${weakestMotion}, strongest ${strongestMotion}, floor ${MOTION_FLOOR}), ` +
    `${new Set(families).size} colour families with no two neighbours sharing one and every ink over 7:1, ` +
    'something to look at on every card, ' +
    `five ranked rows in order and cut by the bottom of the frame, one busiest day with its date and count, ` +
    'the share card printing the same five in the same order, ' +
    `one dash per chapter across the top and a rail down the left, a pause that holds the picture for ten seconds and lets it go, ` +
    'a closing poster with three colourways and its own Share and Replay, ' +
    `no scrim, no old labels or diagrams, no spills, ${chapterCount} phone pages fit 360x800 and 320x568, and bare=1 shows the picture alone.`,
);
