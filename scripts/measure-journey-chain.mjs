/**
 * **A long journey chain: how wide it really is, and whether its pieces overlap.**
 *
 * Reported: on a journey card the second line (the chain of badges) runs longer than the first
 * (the times) and its badges overlap each other. This plans from an address, which is the case with
 * a walking leg at each end, and prints each card's line widths, the chain's natural width, how many
 * rows it wrapped to, and every pair of pieces whose boxes overlap.
 *
 * Usage: node scripts/measure-journey-chain.mjs [base]
 */
import { chromium } from 'playwright';

const base = process.argv[2] ?? 'http://127.0.0.1:3000';

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });

const pick = async (page, field, name, match) => {
  await page.locator(field).fill(name);
  const row = page.locator('.picker-row', { hasText: match }).first();
  await row.waitFor({ timeout: 25000 });
  await row.click();
  await page.waitForTimeout(700);
};

try {
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  await page.addInitScript(() => Object.defineProperty(navigator, 'webdriver', { get: () => false }));
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  for (let i = 0; i < 6; i += 1) {
    if ((await page.locator('.overlay, [role="dialog"]').count()) === 0) break;
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }

  await page.locator('.planner-row__btn').first().click();
  await page.waitForSelector('#picker-from', { timeout: 20000 });
  await pick(page, '#picker-from', 'Meeuwenstraat 98', 'Meeuwenstraat');
  await pick(page, '#picker-to', 'Zaandam Station', 'Zaandam Station');
  const plan = page.getByRole('button', { name: 'Plan journey' });
  if (await plan.count()) await plan.first().click();
  await page.waitForSelector('.journey-card__times', { timeout: 20000 });
  await page.waitForTimeout(1200);

  const report = await page.evaluate(() => {
    const out = [];
    for (const card of document.querySelectorAll('article')) {
      const head = card.querySelector('.journey-card__head');
      const meta = card.querySelector('.journey-card__meta');
      const chain = card.querySelector('.journey-card__chain');
      if (!head || !meta || !chain) continue;

      const content = (el) => {
        const style = getComputedStyle(el);
        return el.getBoundingClientRect().width - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      };
      /* The first line's own content: times, the duration pill, the label, minus the heart's slot. */
      const headContent = content(head) - (card.querySelector('.journey-card__save')?.getBoundingClientRect().width ?? 0);

      const pieces = [...chain.children];
      const rects = pieces.map((piece) => piece.getBoundingClientRect());
      const rows = new Set(rects.map((rect) => Math.round(rect.top))).size;
      const natural = rects.reduce((sum, rect) => sum + rect.width, 0) + (pieces.length - 1) * parseFloat(getComputedStyle(chain).columnGap || '0');

      const overlaps = [];
      for (let i = 0; i < rects.length; i += 1) {
        for (let j = i + 1; j < rects.length; j += 1) {
          const a = rects[i];
          const b = rects[j];
          const dx = Math.min(a.right, b.right) - Math.max(a.left, b.left);
          const dy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
          if (dx > 1 && dy > 1) {
            overlaps.push(`${pieces[i].textContent?.trim().slice(0, 12)} × ${pieces[j].textContent?.trim().slice(0, 12)} (${Math.round(dx)}×${Math.round(dy)}px)`);
          }
        }
      }

      out.push({
        times: card.querySelector('.journey-card__times')?.textContent?.trim().replace(/\s+/g, ' ').slice(0, 30),
        headContent: Math.round(headContent),
        chainNatural: Math.round(natural),
        chainRows: rows,
        metaHeight: Math.round(meta.getBoundingClientRect().height),
        pieces: pieces.map((piece) => ({
          tag: piece.tagName.toLowerCase(),
          text: piece.textContent?.trim().slice(0, 14),
          width: Math.round(piece.getBoundingClientRect().width),
          top: Math.round(piece.getBoundingClientRect().top),
        })),
        overlaps,
      });
    }
    return out;
  });

  for (const [index, card] of report.entries()) {
    console.log(
      `${index + 1}. line1 content ${card.headContent} · chain ${card.chainNatural} natural · ${card.chainRows} row(s)` +
        `${card.chainNatural > card.headContent ? '  ← LINE 2 IS LONGER' : ''}`,
    );
    console.log(`   pieces: ${card.pieces.map((piece) => `${piece.tag}(${piece.width})${piece.text ? ` ${JSON.stringify(piece.text)}` : ''}`).join(' | ')}`);
    if (card.overlaps.length) console.log(`   OVERLAP: ${card.overlaps.join('; ')}`);
  }

  const widest = report.reduce((best, card, index) => (card.chainNatural > (report[best]?.chainNatural ?? -1) ? index : best), 0);
  await page.locator('article').nth(widest).screenshot({ path: 'artifacts/journey-chain.png' });
  console.log(`artifacts/journey-chain.png (card ${widest + 1})`);
} finally {
  await browser.close();
}
