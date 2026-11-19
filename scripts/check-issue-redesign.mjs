/*
 * **Is this the new issue, or the old deck wearing a new coat?**
 *
 * The yearbook was rebuilt as a printed transit annual. The old chapter renderer is still in the page
 * for its data and navigation, but it must never be visible again. This check walks all eighteen
 * pages at desktop and asserts three things:
 *
 * 1. an `.issue-page` is the visible page on every chapter;
 * 2. no old direct child of `.wrapped-body` is visible beside it;
 * 3. the pages have distinct layouts and headlines, and none spills out of its frame.
 *
 * It is deliberately not a taste check. It cannot tell you whether the cover is good. It can tell you
 * whether the redesign was actually switched on.
 */

import { chromium } from 'playwright';

const BASE = process.env.YEARBOOK_URL ?? 'http://127.0.0.1:3000/yearbook?demo=1&persona=regular';
const CHROMIUM_ARGS = ['--no-sandbox', '--disable-dev-shm-usage'];

const browser = await chromium.launch({ headless: true, args: CHROMIUM_ARGS });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.locator('.wrapped-stage').waitFor();
await page.waitForTimeout(500);

/* Dismiss the app's first-run sheet if it is in the way. */
const overlays = page.locator('.overlay button, .sheet button');
for (let i = 0; i < 3; i += 1) {
  if (await overlays.count()) await overlays.first().click().catch(() => {});
  await page.waitForTimeout(140);
}
await page.reload({ waitUntil: 'domcontentloaded' });
await page.locator('.wrapped-stage').waitFor();
await page.waitForTimeout(700);

const cover = page.locator('.issue-page--cover');
if (!(await cover.isVisible().catch(() => false))) {
  console.log('ISSUE REDESIGN: FAIL, the cover is not an issue page');
  process.exit(1);
}

await page.getByRole('button', { name: /OPEN THE ISSUE|Begin/i }).click();
await page.waitForTimeout(500);

const pages = [];

for (let i = 0; i < 18; i += 1) {
  const reading = await page.evaluate(() => {
    const body = document.querySelector('.wrapped-body');
    const issue = body?.querySelector('.issue-page');
    if (!body || !issue) return null;
    const visibleOld = [...body.children].filter((child) => {
      if (child === issue) return false;
      const style = getComputedStyle(child);
      return style.display !== 'none' && style.visibility !== 'hidden' && child.getBoundingClientRect().width > 0;
    });
    const heading =
      issue.querySelector('.issue-head h1')?.textContent?.trim() ||
      issue.querySelector('.issue-cover__issue')?.textContent?.trim() ||
      '';
    const frame = issue.getBoundingClientRect();
    const spilled = [...issue.querySelectorAll('*')].filter((el) => {
      let node = el;
      while (node && node !== issue) {
        const s = getComputedStyle(node);
        if (s.position === 'absolute' || s.transform !== 'none') return false;
        node = node.parentElement;
      }
      const r = el.getBoundingClientRect();
      return r.width > 0 && (r.bottom > frame.bottom + 5 || r.right > frame.right + 5 || r.left < frame.left - 5);
    }).map((el) => String(el.className || el.tagName).slice(0, 32));
    return {
      chapter: body.dataset.chapter ?? '',
      classes: issue.className,
      heading,
      background: getComputedStyle(document.querySelector('.wrapped-stage')).backgroundColor,
      height: issue.clientHeight,
      docWidth: document.documentElement.scrollWidth,
      width: window.innerWidth,
      oldVisible: visibleOld.map((child) => child.className || child.tagName),
      spilled,
    };
  });

  if (!reading) {
    pages.push({ chapter: `index-${i}`, missing: true });
  } else {
    pages.push(reading);
  }

  if (i < 17) {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(260);
  }
}

await browser.close();

const failures = [];
const present = pages.filter((item) => !item.missing);

if (present.length !== pages.length) {
  failures.push(`${pages.length - present.length} page(s) had no .issue-page`);
}

for (const item of present) {
  if (item.oldVisible.length) {
    failures.push(`${item.chapter}: old layer still visible (${item.oldVisible.join(', ')})`);
  }
  if (item.spilled.length) {
    failures.push(`${item.chapter}: content spills past the frame (${item.spilled.slice(0, 3).join(', ')})`);
  }
  if (item.docWidth > item.width + 1) {
    failures.push(`${item.chapter}: document is ${item.docWidth - item.width}px wider than the viewport`);
  }
  if (item.height < 400) {
    failures.push(`${item.chapter}: page is only ${item.height}px tall`);
  }
}

const classes = new Set(present.map((item) => item.classes));
const headings = new Set(present.map((item) => item.heading).filter(Boolean));
const backgrounds = new Set(present.map((item) => item.background));

if (classes.size < 14) failures.push(`only ${classes.size} distinct page layouts`);
if (headings.size < 15) failures.push(`only ${headings.size} distinct headlines`);
if (backgrounds.size < 5) failures.push(`only ${backgrounds.size} page colours`);

if (failures.length) {
  console.log('ISSUE REDESIGN: FAIL');
  for (const failure of failures) console.log(`  - ${failure}`);
  process.exit(1);
}

console.log(
  `ISSUE REDESIGN: PASS, ${present.length} issue pages, 0 old layers visible, ` +
    `${classes.size} distinct layouts, ${headings.size} distinct headlines, ${backgrounds.size} page colours, no page overflow.`,
);
