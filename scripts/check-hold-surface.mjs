/**
 * **Which pixels does a long press belong to?**
 *
 * Holding the home screen's background opens customising. Holding a widget must do nothing: a
 * widget is what a traveller presses to use it, and opening an arranging mode from it was reported
 * as wrong. This walks three presses with a real mouse hold: the background, a card's body, and a
 * card's title.
 *
 * Usage: node scripts/check-hold-surface.mjs [base]
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
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  await page.addInitScript(() => Object.defineProperty(navigator, 'webdriver', { get: () => false }));

  const reload = async () => {
    await page.goto(base, { waitUntil: 'networkidle' });
    for (let i = 0; i < 3; i += 1) {
      if ((await page.locator('.overlay').count()) === 0) break;
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
    }
    await page.waitForTimeout(300);
  };

  const editing = () => page.locator('.widget-grid--editing').count().then((n) => n > 0);

  const hold = async (x, y) => {
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.waitForTimeout(1300);
    await page.mouse.up();
    await page.waitForTimeout(400);
  };

  await reload();
  say(!(await editing()), 'the screen starts out of customising');

  /*
   * A real patch of background, found rather than guessed: at 390 the page column is cards from
   * top to bottom, so a hard-coded "gutter" point lands on a card and the check then measures the
   * wrong pixel. The scan walks the shell's upper band and takes the first point that is the shell
   * itself: not a card, not a control, not the sidebar, the dock or a dialog.
   */
  const spot = await page.evaluate(() => {
    const shell = document.querySelector('.app-shell');
    if (!shell) return null;
    const width = Math.min(window.innerWidth, 430);
    for (let y = 2; y < 140; y += 3) {
      for (let x = 2; x < width - 2; x += 6) {
        const el = document.elementFromPoint(x, y);
        if (!el || !el.closest('.app-shell')) continue;
        if (el.closest('.widget, .app-sidebar, .app-dock, .overlay, .home-menu, [role="dialog"], [role="menu"]')) continue;
        if (el.closest('button, a, input, select, textarea, [role="button"], label')) continue;
        return { x, y };
      }
    }
    return null;
  });
  say(Boolean(spot), `there is background to hold (${spot ? `${spot.x},${spot.y}` : 'none found'})`);
  if (spot) {
    await hold(spot.x, spot.y);
    say(await editing(), 'holding the background opens customising');
  }

  await reload();
  say(!(await editing()), 'and a fresh screen is out of it again');

  /* The card's own body: the paragraph inside it, not a control. */
  const cardPoint = await page.evaluate(() => {
    const card = document.querySelector('.widget__card');
    if (!card) return null;
    const line = card.querySelector('.widget__body p, .widget__body span') ?? card.querySelector('.widget__body');
    const box = (line ?? card).getBoundingClientRect();
    return { x: Math.round(box.left + 12), y: Math.round(box.top + box.height - 6) };
  });
  if (!cardPoint) {
    say(false, 'there is a card to press');
  } else {
    const onCard = await page.evaluate(
      ({ x, y }) => {
        const el = document.elementFromPoint(x, y);
        return el ? (el.closest('.widget') ? 'widget' : 'surface') : 'nothing';
      },
      cardPoint,
    );
    say(onCard === 'widget', `the card point is inside a widget (${onCard})`);
    await hold(cardPoint.x, cardPoint.y);
    say(!(await editing()), 'holding a widget does not open customising');
  }

  /* The header's Edit is the other way in, and it must still work. */
  await reload();
  await page.getByRole('button', { name: /^edit$/i }).first().click({ force: true });
  await page.waitForTimeout(500);
  say(await editing(), 'the Edit control still opens it');
} finally {
  await browser.close();
}

console.log(failures === 0 ? '\nhold surface: clean' : `\nhold surface: ${failures} failing`);
process.exit(failures === 0 ? 0 : 1);
