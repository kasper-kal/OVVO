/**
 * **What the little count on the Options chip is drawn in, in every style.**
 *
 * The count is `--struct-main` behind `--on-dark` — the same pair a primary button wears. This asks
 * every style, in both appearances, what that pair actually resolves to, and does the same for the
 * accent pair, so a fill can be chosen that is legible in all of them rather than in the one that
 * was on screen.
 *
 * Usage: node scripts/measure-chip-count.mjs [base]
 */
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const base = process.argv[2] ?? 'http://127.0.0.1:3000';
const source = readFileSync('src/lib/styles.ts', 'utf8');
const styles = [...source.matchAll(/^    id: '([a-z0-9-]+)'/gm)].map((match) => match[1]);

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
await page.addInitScript(() => Object.defineProperty(navigator, 'webdriver', { get: () => false }));

const read = () =>
  page.evaluate(() => {
    const probe = document.createElement('div');
    document.body.append(probe);
    const luminance = (colour) => {
      const [r, g, b] = colour.match(/\d+(\.\d+)?/g).slice(0, 3).map((value) => {
        const channel = Number(value) / 255;
        return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const pair = (fill, ink) => {
      probe.style.background = `var(${fill})`;
      probe.style.color = `var(${ink})`;
      const computed = getComputedStyle(probe);
      const a = luminance(computed.backgroundColor);
      const b = luminance(computed.color);
      return {
        fill: computed.backgroundColor,
        ink: computed.color,
        contrast: Math.round(((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)) * 100) / 100,
      };
    };
    const result = {
      count: pair('--struct-main', '--on-dark'),
      accent: pair('--accent-fill', '--on-accent'),
      /* A badge has to stand off the chip it sits in, and the chip is drawn in `--l1-bg`. */
      accentOnChip: pair('--l1-bg', '--accent-fill'),
      /* What the badge actually wears now: the ink as the disc, the surface colour as the number. */
      badge: pair('--ink-strong', '--l1-bg'),
      badgeOnChip: pair('--l1-bg', '--ink-strong'),
    };
    probe.remove();
    return result;
  });

const rows = [];
for (const appearance of ['light', 'dark']) {
  for (const styleId of styles) {
    await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(
      ([theme, style]) => {
        localStorage.setItem('ov-planner:v1:settings', JSON.stringify({ theme, styleId: style, developerMode: false }));
      },
      [appearance, styleId],
    );
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(220);
    const got = await read();
    rows.push({ appearance, styleId, ...got });
  }
}

for (const row of rows) {
  const { count, accent } = row;
  const flag = row.badgeOnChip.contrast < 3 || row.badge.contrast < 4.5 ? ' FAIL' : '';
  console.log(
    `${row.appearance.padEnd(5)} ${row.styleId.padEnd(14)}${flag}` +
      ` · badge ink ${row.badge.contrast}:1 · badge disc ${row.badgeOnChip.contrast}:1`,
  );
}

const badInk = rows.filter((row) => row.badge.contrast < 4.5);
const badDisc = rows.filter((row) => row.badgeOnChip.contrast < 3);
console.log(
  `\n${rows.length} style/appearance pairs · ${badInk.length} badge numbers under 4.5 · ${badDisc.length} badge discs under 3:1 against their chip`,
);
await browser.close();
