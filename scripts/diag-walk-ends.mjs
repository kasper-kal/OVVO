/** The whole dashed stretch, both circles included, so the first and last dash can be judged. */
import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://127.0.0.1:3000'
const q = Buffer.from(JSON.stringify({ v: 1, f: 'haarlem', t: 'zaandam', d: '2026-11-02', m: 600, tm: 'depart' })).toString('base64')
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 390, height: 1400 }, deviceScaleFactor: 4, colorScheme: process.env.DARK ? 'dark' : 'light' })
await p.goto(`${BASE}/results/${q}`, { waitUntil: 'networkidle' })
for (let i = 0; i < 6; i += 1) if (await p.locator('.overlay').count()) { await p.keyboard.press('Escape'); await p.waitForTimeout(150) }
const cards = p.locator('article')
for (let i = 0; i < (await cards.count()); i += 1) {
  if ((await cards.nth(i).locator('.journey-card__leg').count()) >= 3) { await cards.nth(i).locator('.journey-card__link').first().click(); break }
}
await p.waitForSelector('.timeline')
const clip = await p.evaluate(() => {
  const ol = document.querySelector('.timeline')
  const ride = ol.querySelector('.timeline__rail--ride')
  const walk = ride.cloneNode(true)
  walk.className = 'timeline__rail timeline__rail--dashed'
  walk.querySelector('div.stack-1').innerHTML =
    '<span class="timeline__station t-md">Meeuwenstraat 98</span><span class="t-sm t-muted">Walk 37 min · 2970 m</span>'
  ol.prepend(walk)
  /* The same fitting the row does itself (useFittedDashes): whole dash cycles, leftover under the circle. */
  const cs = getComputedStyle(walk)
  const gap = parseFloat(cs.getPropertyValue('--timeline-gap')) || 32
  const node = parseFloat(cs.getPropertyValue('--rail-node')) || 14
  const len = walk.getBoundingClientRect().height + gap - node
  const extra = (((5 - (len % 12)) % 12) + 12) % 12
  walk.style.setProperty('--dash-extra', `${extra.toFixed(2)}px`)
  window.__fit = { len: +len.toFixed(1), extra: +extra.toFixed(2) }
  const a = walk.getBoundingClientRect()
  const b = ol.children[1].getBoundingClientRect()
  window.scrollTo(0, window.scrollY + a.top - 40)
  const a2 = walk.getBoundingClientRect()
  const b2 = ol.children[1].getBoundingClientRect()
  return { x: 0, y: Math.max(0, a2.top - 6), width: 170, height: Math.min(320, Math.ceil(b2.top + 24 - a2.top + 12)) }
})
await p.waitForTimeout(200)
await p.screenshot({ path: process.env.OUT || 'artifacts/walk-ends.png', clip: await p.evaluate((c) => {
  const ol = document.querySelector('.timeline')
  const a = ol.children[0].getBoundingClientRect()
  const b = ol.children[1].getBoundingClientRect()
  return { x: 0, y: Math.max(0, a.top - 6), width: 170, height: Math.min(340, Math.ceil(b.top + 26 - a.top + 10)) }
}, clip) })
const px = await p.evaluate(() => {
  const walk = document.querySelector('.timeline > li')
  const seg = getComputedStyle(walk, '::before')
  const row = walk.getBoundingClientRect()
  const real = [...document.querySelectorAll('.timeline__rail--dashed')].map((el) => ({
    extra: el.style.getPropertyValue('--dash-extra') || null,
    h: +el.getBoundingClientRect().height.toFixed(1),
  }))
  return { top: seg.top, bottom: seg.bottom, h: +row.height.toFixed(1), fit: window.__fit, realDashedRows: real }
})
console.log(JSON.stringify(px))
await b.close()
