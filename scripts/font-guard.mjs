/**
 * **A screenshot, or any measurement of type, is only worth something if the browser is drawing the
 * app's own font.**
 *
 * `index.html` asks Google Fonts for Plus Jakarta Sans. A browser that cannot reach it does not
 * complain — it draws the page in whatever sans it has — and every number and every picture taken
 * from that page is then about a font the traveller never sees. That is not hypothetical: the
 * Playwright WebKit build on this VM has no TLS ("TLS support is not available"), so it silently
 * fell back to Liberation Sans, whose ascent and descent are lopsided. Every word's ink sat about
 * **4.5px above** the middle of its line box, and a screenshot of a perfectly aligned row of chips
 * looked broken — reported as "the save icon and Save text isn't on the same level". Chromium here
 * has TLS and was unaffected, which is why the same row looked right in one engine and wrong in the
 * other.
 *
 * `ensureAppFont(page)` closes that hole for every instrument:
 *
 *   1. it injects a cached copy of the *same* stylesheet when the browser has no faces at all, so a
 *      browser that cannot fetch it still draws the real thing;
 *   2. it asks the layout for every weight the interface draws with and waits for them;
 *   3. it **throws** if the family is still not loaded, naming the cause and the fix.
 *
 * A run that cannot be honest fails, instead of producing a plausible-looking picture or a set of
 * numbers that quietly describe the wrong font. Call it once per navigation, before measuring text
 * or taking a screenshot:
 *
 *   import { ensureAppFont } from './font-guard.mjs';
 *   await page.goto(url, { waitUntil: 'networkidle' });
 *   await ensureAppFont(page);
 *
 * Geometry — boxes, gaps, target sizes, colours — does not depend on the font. Type and anything
 * judged by eye does.
 */
import fs from 'node:fs';
import path from 'node:path';

const FAMILY = 'Plus Jakarta Sans';
/** The five weights `index.html` asks for; the interface draws with 400 up to 800. */
const WEIGHTS = ['400', '500', '600', '700', '800'];
const CSS_URL =
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap';
/** A desktop user agent, so Google answers with `.woff2` and not with a legacy format. */
const UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

const DEFAULT_CACHE = path.join('node_modules', '.cache', 'plus-jakarta-sans.css');

/**
 * The same stylesheet the page asks for, with each font file inlined, so it can be injected into a
 * page whose browser cannot fetch anything. Cached on disk: it is 400 kB of base64 and does not
 * change between runs.
 */
export async function localFontCss({ url = CSS_URL, cache = DEFAULT_CACHE, refresh = false } = {}) {
  /* A machine with no network keeps a copy and points `FONT_CSS_FILE` at it. */
  const pinned = process.env.FONT_CSS_FILE;
  if (!refresh && pinned && fs.existsSync(pinned)) return fs.readFileSync(pinned, 'utf8');
  if (!refresh && fs.existsSync(cache)) return fs.readFileSync(cache, 'utf8');
  const css = await (await fetch(url, { headers: { 'User-Agent': UA } })).text();
  if (!/@font-face/.test(css)) throw new Error(`the font stylesheet at ${url} has no @font-face rules`);
  const files = [...new Set([...css.matchAll(/https:\/\/[^)]*\.woff2/g)].map((match) => match[0]))];
  let out = css;
  for (const file of files) {
    const response = await fetch(file);
    if (!response.ok) throw new Error(`could not download ${file}: ${response.status}`);
    const body = Buffer.from(await response.arrayBuffer());
    out = out.split(file).join(`data:font/woff2;base64,${body.toString('base64')}`);
  }
  fs.mkdirSync(path.dirname(cache), { recursive: true });
  fs.writeFileSync(cache, out);
  return out;
}

const faces = (page) =>
  page.evaluate((family) =>
    Array.from(document.fonts)
      .filter((face) => face.family.replace(/["']/g, '').trim().toLowerCase() === family.toLowerCase())
      .map((face) => `${face.weight} ${face.style} ${face.status}`),
  FAMILY);

/**
 * The one refusal, so every path says the same thing: what is wrong, what it would cost, and how to
 * fix it.
 */
function fallbackError(detail, seen) {
  return new Error(
    [
      `${FAMILY} is not loaded in this browser, so the page is being drawn in a fallback font.`,
      'Anything measured or photographed now would describe the wrong font.',
      '',
      detail,
      `Faces seen: ${seen && seen.length ? seen.join(', ') : 'none at all'}.`,
      'Fix: let the browser reach fonts.googleapis.com, or keep a copy of the stylesheet and point',
      'FONT_CSS_FILE at it (ensureAppFont reads that first), or pre-warm the cache with:',
      '  node -e "import(\'./scripts/font-guard.mjs\').then(m => m.localFontCss())"',
      'Diagnosis in this project: the WebKit build here has no TLS, so it can never fetch Google',
      'Fonts by itself — it needs the injected copy.',
    ].join('\n'),
  );
}

/**
 * Draws the page in the app's font, or says why it cannot.
 *
 * @returns {{ injected: boolean, faces: string[] }} what had to be done, and what the browser ended
 *   up holding — useful in a transcript, so a reader can see the picture was honest.
 */
export async function ensureAppFont(page, options = {}) {
  const before = await faces(page);
  let injected = false;

  if (before.length === 0) {
    /* No face at all: this browser never received the stylesheet's fonts. Inject the same ones. */
    /* An explicit `css: ''` means "inject nothing" — that is how the refusal itself is tested. */
    let css = 'css' in options ? options.css : '';
    if (!('css' in options)) {
      try {
        css = await localFontCss(options);
      } catch (error) {
        throw fallbackError(`…and no copy could be fetched to inject: ${error.message}`, before);
      }
    }
    /* `addStyleTag` refuses an empty string, and a caller may pass one to test the refusal path. */
    await page.addStyleTag({ content: css && css.trim() ? css : '/* no font stylesheet to inject */' });
    injected = true;
  }

  /* Ask for the weights the interface draws with, then wait: a face is only usable once loaded. */
  await page.evaluate(
    async ([family, weights]) => {
      await Promise.all(weights.map((weight) => document.fonts.load(`${weight} 13.5px "${family}"`)));
      await document.fonts.ready;
    },
    [FAMILY, WEIGHTS],
  );

  const after = await faces(page);
  const loaded = after.filter((face) => face.endsWith('loaded'));
  if (loaded.length === 0) throw fallbackError('The page still holds no loaded face for it after waiting.', after);
  return { injected, faces: loaded };
}
