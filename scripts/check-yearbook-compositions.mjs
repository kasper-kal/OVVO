/**
 * **The yearbook is eighteen compositions, not one template with eighteen palettes.**
 *
 * The visual-pass regression was real: every chapter shared a gradient ground, a glass card and
 * the same small kicker over a giant left heading, so different words arrived as the same page. This
 * check reads the rendered deck at desktop width and insists on two things:
 *
 *   1. the shared decoration has not come back — no stage gradient and no glass surface;
 *   2. the compositions are actually different — at least fourteen distinct body/section structures
 *      and at least eight different heading measures across the seventeen chapters.
 *
 * It is a structural gate, not a taste test. The contact sheets remain the place to judge whether a
 * composition is good.
 */
import { chromium, prepareBrowserEnv, browserIsInstalled, MISSING_BROWSER_HELP } from './browser-env.mjs';

prepareBrowserEnv();
if (!browserIsInstalled()) {
  console.error(MISSING_BROWSER_HELP);
  process.exit(2);
}

const BASE = (process.env.BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

try {
  await page.goto(`${BASE}/yearbook?demo=1&persona=regular`, { waitUntil: 'domcontentloaded' });
  await page.locator('.wrapped-stage').waitFor();
  await page.waitForTimeout(700);

  for (let i = 0; i < 4; i += 1) {
    const close = page.locator('.overlay button, .sheet button');
    if (!(await close.count())) break;
    await close.first().click({ timeout: 1000 }).catch(() => {});
    await page.waitForTimeout(150);
  }
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('.wrapped-stage').waitFor();
  await page.waitForTimeout(800);

  const read = () =>
    page.evaluate(() => {
      const stage = document.querySelector('.wrapped-stage');
      const body = document.querySelector('.wrapped-body');
      if (!stage || !body) return null;
      const style = getComputedStyle(body);
      const box = body.getBoundingClientRect();
      const primary = body.querySelector(
        '.wrapped-map, .wrapped-distance, .wrapped-route, .wrapped-eras, .wrapped-awards, .wrapped-bookends, .wrapped-comparison, .wrapped-crew, .wrapped-arc, .wrapped-stretch, .wrapped-bars, .wrapped-months, .wrapped-chips',
      );
      const primaryStyle = primary ? getComputedStyle(primary) : null;
      const heading =
        body.querySelector('.wrapped-big, .wrapped-title, .wrapped-map__big') ?? null;
      const headingBox = heading ? heading.getBoundingClientRect() : null;
      const glass = [...body.querySelectorAll('*')].filter((el) => {
        const s = getComputedStyle(el);
        return s.backdropFilter && s.backdropFilter !== 'none';
      }).length;
      const fullWidth = [...body.querySelectorAll(
        '.wrapped-distance, .wrapped-eras, .wrapped-awards, .wrapped-bookends, .wrapped-comparison, .wrapped-crew',
      )].map((el) => ({
        className: String(el.className).split(' ')[0],
        pct: Math.round((el.getBoundingClientRect().width / body.clientWidth) * 100),
      }));

      return {
        id: body.dataset.chapter,
        stageImage: getComputedStyle(stage).backgroundImage,
        glass,
        fullWidth,
        display: style.display,
        columns: style.gridTemplateColumns,
        areas: style.gridTemplateAreas,
        maxWidth: style.maxWidth,
        primary: primaryStyle
          ? `${primary.className}:${primaryStyle.display}:${primaryStyle.gridTemplateColumns}:${primaryStyle.flexDirection}`
          : 'none',
        headingWidth: headingBox ? Math.round(headingBox.width) : 0,
        headingX: headingBox ? Math.round(headingBox.x - box.x) : 0,
      };
    });

  const chapters = [];
  chapters.push(await read());
  await page.getByRole('button', { name: /^Begin$/ }).click();
  await page.waitForTimeout(700);

  for (let pageNo = 2; pageNo <= 18; pageNo += 1) {
    chapters.push(await read());
    if (pageNo < 18) {
      await page.keyboard.press('ArrowRight');
      await page.waitForFunction(
        (n) => document.querySelector('.wrapped-chapter')?.textContent?.trim().startsWith(String(n).padStart(2, '0')),
        pageNo + 1,
        { timeout: 5000 },
      );
      await page.waitForTimeout(650);
    }
  }

  const failures = [];
  const gradients = chapters.filter((c) => c.stageImage && c.stageImage !== 'none');
  if (gradients.length) {
    failures.push(`shared stage imagery returned on ${gradients.map((c) => c.id).join(', ')}`);
  }

  const glassChapters = chapters.filter((c) => c.glass > 0);
  if (glassChapters.length) {
    failures.push(`glass surfaces returned on ${glassChapters.map((c) => c.id).join(', ')}`);
  }

  const structures = new Set(
    chapters.map((c) =>
      [c.display, c.columns, c.areas, c.maxWidth, c.primary, c.headingX].join('|'),
    ),
  );
  if (structures.size < 14) {
    failures.push(`only ${structures.size} distinct composition structure(s) across ${chapters.length} chapters`);
  }

  const headingMeasures = new Set(chapters.map((c) => c.headingWidth).filter(Boolean));
  if (headingMeasures.size < 8) {
    failures.push(`only ${headingMeasures.size} distinct heading width(s) across ${chapters.length} chapters`);
  }

  const namedAreas = chapters.filter((c) => c.areas && c.areas !== 'none').length;
  if (namedAreas < 6) {
    failures.push(`only ${namedAreas} chapter(s) use a named grid composition`);
  }

  const narrow = chapters.flatMap((c) =>
    c.fullWidth.filter((section) => section.pct < 75).map((section) => `${c.id}:${section.className} at ${section.pct}%`),
  );
  if (narrow.length) {
    failures.push(`a full-width piece shrank back into a column (${narrow.join(', ')})`);
  }

  if (failures.length) {
    console.error(`YEARBOOK COMPOSITIONS: FAIL — ${failures.join('; ')}`);
    process.exitCode = 1;
  } else {
    console.log(
      `YEARBOOK COMPOSITIONS: PASS — ${chapters.length} chapters, ${structures.size} distinct structures, ${headingMeasures.size} heading measures, ${namedAreas} named grid compositions, no shared stage gradients or glass.`,
    );
  }
} finally {
  await browser.close();
}
