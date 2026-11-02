/**
 * **The two lines of a journey card, at two widths.**
 *
 * Reported: the card's second line (the chain of badges plus the fare) runs longer than the first
 * line (the times) and its badges pile into each other. This plans a real journey, then prints for
 * every card how wide each line's *content* is, how many rows the chain wrapped to, and every pair
 * of pieces whose boxes overlap.
 *
 * Usage: node scripts/measure-journey-card.mjs [from] [to]
 */
import { chromium } from 'playwright';

const from = process.argv[2] ?? 'Haarlem Station';
const to = process.argv[3] ?? 'Zaandam Station';
const base = 'http://127.0.0.1:3000';

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });

const pick = async (page, field, name) => {
  await page.locator(field).fill(name);
  const row = page.locator('.picker-row', { hasText: name }).first();
  await row.waitFor({ timeout: 20000 });
  await row.click();
  await page.waitForTimeout(500);
};

try {
  for (const width of [390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.addInitScript(() => Object.defineProperty(navigator, 'webdriver', { get: () => false }));
    await page.goto(base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1100);
    for (let i = 0; i < 6; i += 1) {
      if ((await page.locator('.overlay, [role="dialog"]').count()) === 0) break;
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }
    await page.locator('.planner-row__btn').first().click();
    await page.waitForSelector('#picker-from', { timeout: 20000 });
    await pick(page, '#picker-from', from);
    await pick(page, '#picker-to', to);
    const plan = page.getByRole('button', { name: 'Plan journey' });
    if (await plan.count()) await plan.first().click();
    await page.waitForSelector('.journey-card__times', { timeout: 20000 });
    await page.waitForTimeout(800);

    const report = await page.evaluate(() => {
      const out = [];
      for (const card of document.querySelectorAll('article')) {
        const head = card.querySelector('.journey-card__head');
        const meta = card.querySelector('.journey-card__meta');
        const chain = card.querySelector('.journey-card__chain');
        if (!head || !meta || !chain) continue;

        const gap = (el) => parseFloat(getComputedStyle(el).columnGap || '0');
        const headPieces = [...(head.querySelector('.journey-card__times')?.children ?? [])];
        const line1 =
          headPieces.reduce((sum, piece) => sum + piece.getBoundingClientRect().width, 0) +
          (headPieces.length - 1) * gap(head.querySelector('.journey-card__times'));

        const badges = [...chain.children];
        const chainWidth =
          badges.reduce((sum, badge) => sum + badge.getBoundingClientRect().width, 0) +
          (badges.length - 1) * gap(chain);
        const fare = [...meta.children].filter((child) => child !== chain);
        const fareWidth = fare.reduce((sum, piece) => sum + piece.getBoundingClientRect().width, 0) + fare.length * gap(meta);
        const line2 = chainWidth + fareWidth;

        /* Rows *of the chain*, by its own pieces: the fare is centred beside it, so counting it
           would say "two rows" for a chain that is one. */
        const rects = [...badges, ...fare].map((piece) => piece.getBoundingClientRect());
        const rows = new Set(badges.map((badge) => Math.round(badge.getBoundingClientRect().top))).size;
        const overlaps = [];
        for (let i = 0; i < rects.length; i += 1) {
          for (let j = i + 1; j < rects.length; j += 1) {
            const dx = Math.min(rects[i].right, rects[j].right) - Math.max(rects[i].left, rects[j].left);
            const dy = Math.min(rects[i].bottom, rects[j].bottom) - Math.max(rects[i].top, rects[j].top);
            if (dx > 1 && dy > 1) overlaps.push(`${Math.round(dx)}px`);
          }
        }
        out.push({
          times: card.querySelector('.journey-card__times')?.textContent?.trim().replace(/\s+/g, ' ').slice(0, 26),
          line1: Math.round(line1),
          line2: Math.round(line2),
          rows,
          metaHeight: Math.round(meta.getBoundingClientRect().height),
          overlaps,
          badges: badges.map((badge) => (badge.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 12)),
        });
      }
      return out;
    });

    let bad = 0;
    console.log(`width ${width}`);
    for (const [index, card] of report.entries()) {
      const longer = card.line2 > card.line1;
      if (longer || card.rows > 1 || card.overlaps.length) bad += 1;
      console.log(
        `  ${index + 1}. line1 ${card.line1} · line2 ${card.line2}${longer ? ' LONGER' : ''} · rows ${card.rows}` +
          ` · badges ${JSON.stringify(card.badges)}${card.overlaps.length ? ` OVERLAP ${card.overlaps.join(',')}` : ''}`,
      );
    }
    console.log(`  ${report.length} cards, ${bad} with a longer, wrapped or overlapping second line`);
    const worst = report.reduce((best, card, index) => (card.line2 > (report[best]?.line2 ?? -1) ? index : best), 0);
    await page.locator('article').nth(worst).screenshot({ path: 'artifacts/journey-card.png' });
    await page.close();
  }
} finally {
  await browser.close();
}
