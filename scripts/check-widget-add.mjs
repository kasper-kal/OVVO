/**
 * **Is the widget catalogue's add control a plus, and does it still say which widget it adds?**
 *
 * The word "Add" sat beside a plus on twelve rows in a list whose rows already name themselves, and
 * the steerer asked for the word to go. What must not go with it is the name: twelve buttons all
 * called "Add" was already a fault (24.4), so the plus keeps an accessible name that carries the
 * widget's own title.
 *
 * Usage: node scripts/check-widget-add.mjs [base]
 */
import { chromium } from 'playwright';

const base = process.argv[2] ?? 'http://127.0.0.1:3000';

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
let failures = 0;
const say = (ok, line) => {
  if (!ok) failures += 1;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${line}`);
};

try {
  const page = await browser.newPage({ viewport: { width: 390, height: 1200 } });
  await page.addInitScript(() => Object.defineProperty(navigator, 'webdriver', { get: () => false }));

  const clearOverlays = async () => {
    for (let i = 0; i < 3; i += 1) {
      if ((await page.locator('.overlay').count()) === 0) return;
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
    }
  };

  await page.goto(base, { waitUntil: 'networkidle' });
  await clearOverlays();

  /* Customising first: the catalogue only opens while the home screen can be changed. The
     header's own word for it is "Edit". */
  const customise = page.getByRole('button', { name: /^edit$|aanpassen|bewerken/i }).first();
  if (await customise.count()) {
    await customise.click({ force: true });
    await page.waitForTimeout(400);
  }
  /* The catalogue lives behind "Home layout" and then "Add widget". */
  await clearOverlays();
  await page.getByRole('button', { name: /home layout|indeling/i }).first().click({ force: true });
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: /^add widget$|widget toevoegen/i }).first().click({ force: true });
  await page.waitForTimeout(600);

  const adds = page.getByRole('button', { name: /^Add / });
  const count = await adds.count();
  say(count >= 10, `every row has an add button (${count} of them)`);

  const names = await adds.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('aria-label') ?? ''));
  say(
    new Set(names).size === names.length,
    `no two add buttons share a name (${names[0] ?? 'none'} …)`,
  );
  const visible = await adds.evaluateAll((nodes) => nodes.map((node) => (node.textContent ?? '').trim()));
  say(
    visible.every((text) => text.length === 0),
    'the buttons hold no word, only the plus',
  );
  const plusOnly = await adds.evaluateAll((nodes) => nodes.every((node) => Boolean(node.querySelector('svg'))));
  say(plusOnly, 'each one draws a glyph');

  /* And the press still adds something, so the control was not emptied on the way. */
  const before = await page.locator('.modal').innerText();
  const beforeCount = Number((before.match(/(\d+)\s+widget/i) ?? [])[1] ?? -1);
  await adds.first().click({ force: true });
  await page.waitForTimeout(600);
  const after = await page.locator('.modal').innerText().catch(() => '');
  const afterCount = Number((after.match(/(\d+)\s+widget/i) ?? [])[1] ?? -1);
  say(beforeCount > 0 && afterCount === beforeCount - 1, `pressing one adds a widget (${beforeCount} → ${afterCount} left)`);
} finally {
  await browser.close();
}

console.log(failures === 0 ? '\nwidget add: clean' : `\nwidget add: ${failures} failing`);
process.exit(failures === 0 ? 0 : 1);
