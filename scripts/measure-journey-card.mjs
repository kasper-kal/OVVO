/**
 * **The two lines of a journey card, and the space around every arrow in its chain.**
 *
 * Reported twice: the card's second line ran longer than the first, and the gap between an arrow and
 * the badge beside it was not the same on both sides. This opens a results link at a chosen time,
 * then for every card prints the content width of each line, the space before and after each arrow
 * (in the order the arrows appear), and any pair of pieces whose boxes overlap.
 *
 * Usage: MINUTE=480 WIDTHS=390,320 node scripts/measure-journey-card.mjs
 */
import { chromium } from 'playwright';

const base = process.env.BASE ?? 'http://127.0.0.1:3000';
const minute = Number(process.env.MINUTE ?? 480);
const widths = (process.env.WIDTHS ?? '390,320').split(',').map(Number);
const query = { v: 1, f: 'haarlem', t: 'zaandam', d: '2026-11-02', m: minute, tm: 'depart' };
const link = `${base}/results/${Buffer.from(JSON.stringify(query)).toString('base64')}`;

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });

try {
  for (const width of widths) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.addInitScript(() => Object.defineProperty(navigator, 'webdriver', { get: () => false }));
    await page.goto(link, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    for (let i = 0; i < 6; i += 1) {
      if ((await page.locator('.overlay, [role="dialog"]').count()) === 0) break;
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }
    await page.waitForSelector('.journey-card__times', { timeout: 20000 });
    await page.waitForTimeout(600);

    const report = await page.evaluate(() => {
      const out = [];
      for (const card of document.querySelectorAll('article')) {
        const head = card.querySelector('.journey-card__head');
        const meta = card.querySelector('.journey-card__meta');
        const chain = card.querySelector('.journey-card__chain');
        if (!head || !meta || !chain) continue;

        const gap = (el) => parseFloat(getComputedStyle(el).columnGap || '0');
        const times = head.querySelector('.journey-card__times');
        const headPieces = [...(times?.children ?? [])];
        const line1 =
          headPieces.reduce((sum, piece) => sum + piece.getBoundingClientRect().width, 0) +
          (headPieces.length - 1) * gap(times);

        const legs = [...chain.querySelectorAll('.journey-card__leg')];
        const badges = legs.map((leg) => leg.querySelector('.mode-badge')).filter(Boolean);
        const chainWidth = legs.reduce((sum, leg) => sum + leg.getBoundingClientRect().width, 0);
        const fare = [...meta.children].filter((child) => child !== chain);
        const fareWidth = fare.reduce((sum, piece) => sum + piece.getBoundingClientRect().width, 0) + fare.length * gap(meta);
        const line2 = chainWidth + fareWidth;

        /* Space on each side of every arrow: [before, after], in the order the arrows are drawn. */
        const arrows = legs.map((leg, index) => {
          const arrow = leg.querySelector(':scope > svg');
          const badge = leg.querySelector('.mode-badge');
          if (index === 0 || !arrow || !badge) return null;
          const a = arrow.getBoundingClientRect();
          const b = badges[index - 1].getBoundingClientRect();
          const n = badge.getBoundingClientRect();
          return [Math.round(a.left - b.right), Math.round(n.left - a.right)];
        }).filter(Boolean);

        const rects = [...legs, ...fare].map((piece) => piece.getBoundingClientRect());
        const overlaps = [];
        for (let i = 0; i < rects.length; i += 1) {
          for (let j = i + 1; j < rects.length; j += 1) {
            const dx = Math.min(rects[i].right, rects[j].right) - Math.max(rects[i].left, rects[j].left);
            const dy = Math.min(rects[i].bottom, rects[j].bottom) - Math.max(rects[i].top, rects[j].top);
            if (dx > 1 && dy > 1) overlaps.push(`${Math.round(dx)}px`);
          }
        }

        out.push({
          times: times?.textContent?.trim().replace(/\s+/g, ' ').slice(0, 24),
          line1: Math.round(line1),
          line2: Math.round(line2),
          rows: new Set(badges.map((badge) => Math.round(badge.getBoundingClientRect().top))).size,
          arrows,
          overlaps,
        });
      }
      return out;
    });

    let longer = 0;
    let uneven = 0;
    let wrapped = 0;
    for (const card of report) {
      if (card.line2 > card.line1) longer += 1;
      if (card.arrows.some(([before, after]) => before !== after)) uneven += 1;
      if (card.rows > 1) wrapped += 1;
      console.log(
        `  ${card.times} · line1 ${card.line1} · line2 ${card.line2}${card.line2 > card.line1 ? ' LONGER' : ''}` +
          ` · rows ${card.rows} · arrows ${JSON.stringify(card.arrows)}${card.overlaps.length ? ` OVERLAP ${card.overlaps.join(',')}` : ''}`,
      );
    }
    console.log(
      `width ${width}: ${report.length} cards · ${longer} longer · ${wrapped} wrapped · ${uneven} with an uneven arrow gap` +
        ` · ${report.reduce((sum, card) => sum + card.overlaps.length, 0)} overlapping pieces`,
    );

    const widest = report.reduce((best, card, index) => (card.line2 > (report[best]?.line2 ?? -1) ? index : best), 0);
    await page.locator('article').nth(widest).screenshot({ path: `artifacts/journey-card-${width}.png` });
    await page.close();
  }
} finally {
  await browser.close();
}
