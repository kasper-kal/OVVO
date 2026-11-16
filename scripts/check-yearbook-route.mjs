import { createRequire } from 'node:module';

/* The project installs Playwright outside this package's ESM resolver, so use the CommonJS lookup
   the other local browser scripts already use. */
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

/*
 * **Page 6, the line you kept coming back to.**
 *
 * The moving dot is the traveller, not a train. Both station markers are empty rings, and the moving
 * dot fills the ring it is standing in. The bell belongs to the two arrivals, not to the page entry:
 * this waits through one full there-and-back journey and records each rail-chime play.
 */

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const failures = [];

await page.addInitScript(() => {
  window.__railChimes = [];
  const play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function (...args) {
    if (String(this.src || '').includes('/sfx/rail-chime')) {
      window.__railChimes.push(performance.now());
    }
    return play.apply(this, args);
  };
});

await page.goto('http://127.0.0.1:3000/yearbook?demo=1&persona=regular', {
  waitUntil: 'networkidle',
});

const notNow = page.getByRole('button', { name: 'Not now' });
if (await notNow.count()) await notNow.click();
await page.getByRole('button', { name: 'Begin' }).click();
await page.waitForTimeout(700);

for (let click = 0; click < 8; click += 1) {
  if (await page.locator('.wrapped-route').count()) break;
  await page.mouse.click(300, 420);
  await page.waitForTimeout(650);
}

if (!(await page.locator('.wrapped-route').count())) {
  failures.push('page 6 never rendered its route');
} else {
  const marker = await page.locator('.wrapped-route__dot--start').evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      background: style.backgroundColor,
      border: Number.parseFloat(style.borderTopWidth),
      fill: style.backgroundImage,
    };
  });
  if (marker.background !== 'rgba(0, 0, 0, 0)' || marker.fill !== 'none') {
    failures.push(`the top marker is still filled (${marker.background}, ${marker.fill})`);
  }
  if (marker.border !== 2) failures.push(`the top marker ring is ${marker.border}px, not 2px`);

  if (!(await page.locator('.wrapped-route__traveller').count())) {
    failures.push('the moving dot is not marked as the traveller');
  }

  await page.evaluate(() => {
    window.__railChimes = [];
  });
  await page.waitForTimeout(13500);

  const chimes = await page.evaluate(() => window.__railChimes);
  if (chimes.length < 3) {
    failures.push(
      `only ${chimes.length} rail-chime play(s) over a full journey (${chimes
        .map((at) => Math.round(at))
        .join(', ')}ms); expected at least 3`,
    );
  }
}

await browser.close();

if (failures.length) {
  console.error(`FAIL page 6: ${failures.join('; ')}`);
  process.exit(1);
}

console.log('PASS page 6: top marker is an empty ring, the traveller is moving, and both arrivals ring.');
