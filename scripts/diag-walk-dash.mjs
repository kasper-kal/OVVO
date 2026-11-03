/** Is a walk's dashed line centred on the marks, and can it be seen? */
import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://127.0.0.1:3000'
const q = Buffer.from(JSON.stringify({ v: 1, f: 'haarlem', t: 'zaandam', d: '2026-11-02', m: 600, tm: 'depart' })).toString('base64')
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 390, height: 1200 }, deviceScaleFactor: 6, colorScheme: process.env.DARK ? 'dark' : 'light' })
await p.goto(`${BASE}/results/${q}`, { waitUntil: 'networkidle' })
await p.waitForFunction(() => [...document.styleSheets].some((s) => { try { return [...s.cssRules].length > 50 } catch { return false } }))
for (let i = 0; i < 6; i += 1) if (await p.locator('.overlay').count()) { await p.keyboard.press('Escape'); await p.waitForTimeout(150) }
const cards = p.locator('article')
for (let i = 0; i < (await cards.count()); i += 1) {
  if ((await cards.nth(i).locator('.journey-card__leg').count()) >= 3) { await cards.nth(i).locator('.journey-card__link').first().click(); break }
}
await p.waitForSelector('.timeline')
if (process.env.DARK) { await p.emulateMedia({ colorScheme: 'dark' }); await p.evaluate(() => { document.documentElement.dataset.theme = 'dark' }) }
const out = await p.evaluate(() => {
  const ol = document.querySelector('.timeline')
  const ride = ol.querySelector('.timeline__rail--ride')
  const walk = ride.cloneNode(true)
  walk.className = 'timeline__rail timeline__rail--dashed'
  walk.querySelector('div.stack-1').innerHTML = '<span class="t-sm t-muted">Walk 37 min · 2970 m</span>'
  ol.prepend(walk)
  const seg = getComputedStyle(walk, '::before')
  const row = walk.getBoundingClientRect()
  const node = walk.querySelector('.timeline__node').getBoundingClientRect()
  const rideSeg = getComputedStyle(ride, '::before')
  const segLeft = row.left + parseFloat(seg.left)
  return {
    nodeCentre: +(node.left + node.width / 2 - row.left).toFixed(2),
    dashed: { left: seg.left, width: seg.width, centre: +(segLeft + parseFloat(seg.width) / 2 - row.left).toFixed(2), paint: seg.backgroundImage.slice(0, 70) },
    ride: { left: rideSeg.left, width: rideSeg.width },
    page: getComputedStyle(document.body).backgroundColor,
  }
})
console.log(JSON.stringify(out, null, 1))
const clip = await p.evaluate(() => {
  const walk = document.querySelector('.timeline > li')
  const r = walk.getBoundingClientRect()
  return { y: Math.max(0, r.top + 10), h: Math.min(120, Math.ceil(r.height - 20)) }
})
await p.screenshot({ path: process.env.OUT || 'artifacts/walk-dash.png', clip: { x: 0, y: clip.y, width: 150, height: clip.h } })
await b.close()
