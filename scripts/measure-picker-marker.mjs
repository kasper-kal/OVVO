/**
 * **The two discs on the stop picker's action rows.**
 *
 * "Use my current location" and "Choose on the map" lead with a 32px circular marker. This prints
 * the marker's fill and glyph ink in three states, beside the page it sits on, so a colour that
 * ignores the theme can be seen rather than guessed at:
 *
 *   light, dark, and the light appearance on a dark tint (the case a theme token alone misses).
 *
 * Usage: node scripts/measure-picker-marker.mjs [base]
 */
import { chromium } from 'playwright';

const base = process.argv[2] ?? 'http://127.0.0.1:3000';

const CASES = [
  { name: 'light', theme: 'light', style: null },
  { name: 'dark', theme: 'dark', style: null },
  /* A style whose *light* palette is already dark, which is where a theme token alone goes wrong. */
  { name: 'nostalgia (dark page, light appearance)', theme: 'light', style: 'nostalgia' },
  { name: 'nostalgia, dark appearance', theme: 'dark', style: 'nostalgia' },
];

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
let failures = 0;

try {
  for (const testCase of CASES) {
    const page = await browser.newPage({
      viewport: { width: 390, height: 900 },
      colorScheme: testCase.theme === 'dark' ? 'dark' : 'light',
    });
    await page.addInitScript(
      ({ theme, style }) => {
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
        const key = 'ov-planner:v1:settings';
        let settings = {};
        try {
          settings = JSON.parse(localStorage.getItem(key) ?? '{}');
        } catch {
          settings = {};
        }
        settings.theme = theme;
        if (style) settings.styleId = style;
        localStorage.setItem(key, JSON.stringify(settings));
      },
      { theme: testCase.theme, style: testCase.style },
    );

    await page.goto(base + '/', { waitUntil: 'networkidle' });
    for (let i = 0; i < 3; i += 1) {
      if ((await page.locator('.overlay').count()) === 0) break;
      await page.keyboard.press('Escape');
      await page.waitForTimeout(150);
    }
    const from = page.locator('.planner-row__btn').first();
    await from.waitFor({ timeout: 15000 });
    await from.click();
    await page.waitForSelector('.picker-row--action .picker-row__marker', { timeout: 15000 });
    await page.waitForTimeout(400);

    const read = await page.evaluate(() => {
      /* A `color-mix()` result comes back as `color(srgb r g b)`, not `rgb()`, so both are read. */
      const parse = (value) => {
        const text = String(value);
        const mix = text.match(/color\(srgb ([^)]+)\)/);
        if (mix) {
          const parts = mix[1].trim().split(/\s+/).map((n) => parseFloat(n) * 255);
          return { r: parts[0], g: parts[1], b: parts[2], a: 1 };
        }
        const m = text.match(/rgba?\(([^)]+)\)/);
        if (!m) return null;
        const parts = m[1].split(',').map((n) => parseFloat(n));
        return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
      };
      const lum = (c) => {
        const f = (v) => {
          const s = v / 255;
          return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
        };
        return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
      };
      const ratio = (a, b) => {
        const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
        return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
      };

      const marker = document.querySelector('.picker-row--action .picker-row__marker');
      if (!marker) return null;
      const glyph = marker.querySelector('svg') ?? marker;
      const screen = marker.closest('.fullscreen') ?? document.body;
      const cs = getComputedStyle(marker);
      const gs = getComputedStyle(glyph);
      const ss = getComputedStyle(screen);
      const fill = parse(cs.backgroundColor);
      const ink = parse(gs.color);
      const ground = parse(ss.backgroundColor) ?? parse(getComputedStyle(document.body).backgroundColor);
      return {
        fill: cs.backgroundColor,
        ink: gs.color,
        ground: ss.backgroundColor,
        inkOnDisc: fill && ink ? ratio(ink, fill) : null,
        discOnGround: fill && ground ? ratio(fill, ground) : null,
        theme: document.documentElement.dataset.theme ?? 'light',
        surface: document.documentElement.dataset.surface ?? '-',
      };
    });

    const ok = read && read.inkOnDisc !== null && read.inkOnDisc >= 4.5;
    if (!ok) failures += 1;
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${testCase.name}`, JSON.stringify(read));
    await page.close();
  }
} finally {
  await browser.close();
}

if (failures) {
  console.log(`${failures} state(s) below 4.5:1 on the disc`);
  process.exitCode = 1;
}
