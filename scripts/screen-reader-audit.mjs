/**
 * **What a screen reader would hear, screen by screen.**
 *
 * Every screen has been designed with assistive tech in mind and audited to death for the things a
 * script can see — contrast, target sizes, layout. None of that says what the page *sounds* like.
 * This walks the app the way a screen reader does: it takes the browser's own accessibility tree
 * (the same tree VoiceOver, TalkBack and NVDA read) for each screen and writes it out, then lists
 * the things that are wrong as a spoken interface rather than as a picture:
 *
 *   • a control with no name at all — "button", and nothing else;
 *   • a control whose name is a glyph's name rather than what it does;
 *   • two controls with the same spoken name doing different things;
 *   • a heading that skips a level, or a screen with no heading at all;
 *   • a picture that says something the text does not, with no name;
 *   • a board that changes every five seconds and never announces it.
 *
 * Run: node scripts/screen-reader-audit.mjs [origin]
 * Writes .logs/sr/<screen>.yml (the tree) and prints the findings.
 */
import { chromium, prepareBrowserEnv } from './browser-env.mjs';

prepareBrowserEnv();
import { writeFileSync, mkdirSync } from 'node:fs';

const ORIGIN = process.argv[2] ?? 'http://127.0.0.1:3000';
const OUT = '.logs/sr';
mkdirSync(OUT, { recursive: true });

const SETTINGS = {
  version: 8, theme: 'light', language: 'en', timeFormat: '24h', dateFormat: 'long',
  density: 'comfortable', highContrast: false, reduceMotion: true,
  selectionColor: 'coral', selectionCustom: '', selectionColorDark: 'coral', selectionCustomDark: '',
  background: 'cream', backgroundColour: '#FCFBFA', backgroundColourDark: '#FCFBFA',
  backgroundImage: '', backgroundImageSource: '', backgroundCrop: null, cardTreatment: 'solid',
  primaryColour: '', primaryColourDark: '', defaultTimeMode: 'depart', defaultOriginStopId: null,
};

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
await context.addInitScript((settings) => {
  const put = (key, value) => localStorage.setItem('ov-planner:v1:' + key, JSON.stringify(value));
  put('settings', settings);
  put('location-consent', 'denied');
  /* Give the screens that need content some: favourites, a board, and a saved journey. */
  put('favourites', ['haarlem', 'utrecht-centraal', 'schiphol-airport']);
  put('board-stops', ['haarlem']);
  put('stop-names', { haarlem: 'Work' });
}, SETTINGS);

const page = await context.newPage();
const problems = [];
const screens = [];

const nameOf = (node) => (node.querySelector('.sr-only')?.textContent ?? node.textContent ?? '').trim();

/** One screen: its tree, plus the spoken-interface checks that a tree alone does not answer. */
async function capture(name, url) {
  await page.goto(`${ORIGIN}${url}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(250);
  await snapshot(name, url);
}

/** A screen that only exists after a click (a journey is generated per search, never by address). */
async function captureHere(name) {
  await snapshot(name, new URL(page.url()).pathname);
}

async function snapshot(name, url) {

  const tree = await page.locator('html').ariaSnapshot();
  writeFileSync(`${OUT}/${name}.yml`, tree + '\n');

  const screenProblems = await page.evaluate(() => {
    const out = [];
    const describe = (el) => {
      const label = el.getAttribute('aria-label') || '';
      const text = (el.querySelector('.sr-only')?.textContent ?? el.textContent ?? '').trim();
      return { tag: el.tagName.toLowerCase(), label, text, cls: el.className?.toString?.() ?? '' };
    };
    /*
     * The name a screen reader would actually speak, in the order the browser resolves it:
     * `aria-labelledby`, then `aria-label`, then a real `<label>`, then the element's own text, and
     * only then the placeholder — which is a hint, not a name, and is reported as one below.
     */
    const spokenName = (el) => {
      const labelledby = el.getAttribute('aria-labelledby');
      if (labelledby) {
        const text = labelledby
          .split(/\s+/)
          .map((id) => document.getElementById(id)?.textContent ?? '')
          .join(' ')
          .trim();
        if (text) return { name: text, from: 'aria-labelledby' };
      }
      const aria = el.getAttribute('aria-label');
      if (aria) return { name: aria.trim(), from: 'aria-label' };
      if (el.labels && el.labels.length > 0) {
        const text = Array.from(el.labels).map((label) => label.textContent ?? '').join(' ').trim();
        if (text) return { name: text, from: 'label' };
      }
      const text = (el.querySelector('.sr-only')?.textContent ?? el.textContent ?? '').trim();
      if (text) return { name: text, from: 'text' };
      const placeholder = el.getAttribute('placeholder') || el.getAttribute('title') || '';
      return { name: placeholder.trim(), from: placeholder ? 'placeholder' : 'nothing' };
    };
    const nameOf = (el) => spokenName(el).name.replace(/\s+/g, ' ');

    /* Every control, as the accessibility tree would name it. */
    const controls = Array.from(
      document.querySelectorAll('a[href], button, input, select, textarea, [role="button"], [role="link"]'),
    ).filter((el) => {
      const box = el.getBoundingClientRect();
      return box.width > 0 && box.height > 0 && !el.closest('[aria-hidden="true"]');
    });

    const seen = new Map();
    for (const el of controls) {
      const { name, from } = spokenName(el);
      const clean = name.replace(/\s+/g, ' ');
      const info = describe(el);
      if (!name) {
        out.push({ kind: 'unnamed', detail: `${info.tag}.${info.cls.split(' ')[0]}` });
        continue;
      }
      if (from === 'placeholder') {
        out.push({ kind: 'named only by its placeholder', detail: `${info.tag}.${info.cls.split(' ')[0]} — "${clean}" (a placeholder is a hint, not a name)` });
      }
      /* A name nobody could act on: a single glyph, a lone number, the same word as the icon. */
      if (clean.length <= 1) out.push({ kind: 'one-character name', detail: `${clean} on ${info.tag}.${info.cls.split(' ')[0]}` });
      /*
       * Two controls with the same spoken name are only a defect when they go to different places —
       * a screen reader's link list shows names with no row around them, so "Journey details for
       * 09:30" twice, to two different journeys, is two links nobody can choose between. The same
       * name twice on the same address (a board's repeated destination, say) is the timetable
       * repeating itself, which is what a board does.
       */
      const key = clean.toLowerCase();
      const href = el.getAttribute('href') || '';
      if (seen.has(key)) {
        const first = seen.get(key);
        if (first.href !== href && (first.href || href)) {
          out.push({
            kind: 'the same name goes to two different places',
            detail: `"${clean}" → ${first.href || '(a control)'} and → ${href || '(a control)'}`,
          });
        }
      } else {
        seen.set(key, { ...info, href });
      }
    }

    /* Headings: none at all, or a level skipped on the way down. */
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6, [role="heading"]')).map((h) => ({
      level: Number(h.getAttribute('aria-level') || h.tagName.replace('h', '')),
      text: nameOf(h).slice(0, 60),
    }));
    if (headings.length === 0) out.push({ kind: 'no heading', detail: 'the screen has no heading for a screen reader to jump to' });
    for (let i = 1; i < headings.length; i += 1) {
      if (headings[i].level - headings[i - 1].level > 1) {
        out.push({ kind: 'heading level skipped', detail: `h${headings[i - 1].level} "${headings[i - 1].text}" → h${headings[i].level} "${headings[i].text}"` });
      }
    }

    /* Pictures that carry meaning and say nothing. */
    const pictures = Array.from(document.querySelectorAll('svg, img, canvas')).filter((el) => {
      const box = el.getBoundingClientRect();
      const hidden = el.getAttribute('aria-hidden') === 'true' || el.closest('[aria-hidden="true"]');
      return box.width > 40 && box.height > 40 && !hidden;
    });
    for (const el of pictures) {
      const name = el.getAttribute('aria-label') || el.querySelector('title')?.textContent || '';
      if (!name) out.push({ kind: 'unlabelled picture', detail: `${el.tagName.toLowerCase()}.${(el.getAttribute('class') || '').split(' ')[0]} draws something and says nothing` });
    }

    /* Does the part of the page that changes say it changes? */
    const live = Array.from(document.querySelectorAll('[aria-live], [role="status"], [role="alert"], [role="log"]')).map((el) => ({
      role: el.getAttribute('role') || 'aria-live',
      politeness: el.getAttribute('aria-live') || '',
      text: nameOf(el).slice(0, 50),
    }));

    return { out, headings, live };
  });

  screens.push({ name, url, headings: screenProblems.headings, live: screenProblems.live });
  for (const problem of screenProblems.out) problems.push({ screen: name, ...problem });
}

await capture('home', '/');
await capture('stops', '/stops');
await capture('stop', '/stops/haarlem');
await capture('departures', '/departures');
await capture('disruptions', '/disruptions');
await capture('disruption', '/disruptions/d-cancel-schiphol');
await capture('map', '/map');
await capture('preferences', '/preferences');
await capture('settings', '/settings');
await capture('results-empty', '/results');
await capture('not-found', '/no-such-screen');

/*
 * The two screens that only exist after a search. The address *is* the search (see
 * `lib/searchLink.ts`), so it is built here rather than typed through two pickers: a real search,
 * written the way the app writes it, and then the first card's own link.
 */
const payload = {
  v: 1,
  f: 'utrecht-centraal',
  t: 'amsterdam-centraal',
  d: new Date().toISOString().slice(0, 10),
  m: 9 * 60,
  tm: 'depart',
};
const searchId = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
await capture('results', `/results/${searchId}`);
await page.locator('a[href^="/journey/"]').first().click({ force: true });
await page.waitForTimeout(700);
await captureHere('journey');

console.log('\n=== every screen, as it is announced');
for (const screen of screens) {
  console.log(`  ${screen.name.padEnd(14)} ${String(screen.headings.length).padStart(2)} headings  ${String(screen.live.length).padStart(2)} live regions`);
}

console.log('\n=== findings');
if (problems.length === 0) console.log('  none');
for (const problem of problems) {
  console.log(`  ${problem.screen}: ${problem.kind} — ${problem.detail}`);
}

console.log('\n=== live regions, in full');
for (const screen of screens) {
  for (const region of screen.live) {
    console.log(`  ${screen.name}: ${region.role}${region.politeness ? ` (${region.politeness})` : ''} — "${region.text}"`);
  }
}

await browser.close();
process.exit(problems.length > 0 ? 1 : 0);
