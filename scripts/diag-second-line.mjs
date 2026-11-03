/** Where the second line of words and the icon under the clock really sit, per row type. */
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://127.0.0.1:3000';
const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const page = await browser.newPage({ viewport: { width: 390, height: 1000 }, deviceScaleFactor: 3 });
await page.addInitScript(() => Object.defineProperty(navigator, 'webdriver', { get: () => false }));
async function esc() {
  for (let i = 0; i < 6; i += 1) {
    if ((await page.locator('.overlay').count()) === 0) return;
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }
}
const link = `${BASE}/results/${Buffer.from(
  JSON.stringify({ v: 1, f: 'haarlem', t: 'zaandam', d: '2026-11-02', m: 600, tm: 'depart' }),
).toString('base64')}`;
await page.goto(link, { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
await esc();
const cards = page.locator('article');
for (let i = 0; i < (await cards.count()); i += 1) {
  if ((await cards.nth(i).locator('.journey-card__leg').count()) >= 3) {
    await cards.nth(i).locator('.journey-card__link').first().click();
    break;
  }
}
await page.waitForSelector('.timeline', { timeout: 20000 });
await page.waitForTimeout(400);
await esc();
const out = await page.evaluate(() => {
  const ol = document.querySelector('.timeline');
  const ink = (el) => {
    const r = document.createRange();
    r.selectNodeContents(el);
    const b = r.getBoundingClientRect();
    return b.height ? b : el.getBoundingClientRect();
  };
  const rows = [...ol.querySelectorAll(':scope > li')];
  const ride = rows.find((li) => li.classList.contains('timeline__rail--ride'));
  const rt = ride.getBoundingClientRect();
  const centre = (b) => +(b.top - rt.top + b.height / 2).toFixed(1);
  const service = ride.querySelector('.leg-service');
  const clone = ride.cloneNode(true);
  clone.className = 'timeline__rail timeline__rail--dashed';
  const body = clone.querySelector('div');
  if (body) body.innerHTML = '<span class="t-sm t-muted">Walk 37 min</span>';
  ol.prepend(clone);
  const wt = clone.getBoundingClientRect();
  const wCentre = (b) => +(b.top - wt.top + b.height / 2).toFixed(1);
  return {
    rideIconCentre: centre(ride.querySelector('.timeline__mode svg').getBoundingClientRect()),
    rideServiceCentre: service ? centre(ink(service)) : null,
    rideServiceLine: service ? getComputedStyle(service).lineHeight : null,
    rideStationCentre: centre(ink(ride.querySelector('.timeline__station'))),
    rideRingCentre: centre(ride.querySelector('.timeline__node').getBoundingClientRect()),
    clockCentre: centre(ink(ride.querySelector('.timeline__time'))),
    walkIconCentre: wCentre(clone.querySelector('.timeline__mode svg').getBoundingClientRect()),
    walkWordsCentre: wCentre(ink(clone.querySelector('.t-sm'))),
    walkPaddingTop: getComputedStyle(clone.querySelector('div')).paddingTop,
  };
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
