/** Does a named walk put its place on the ring's line, and do the dashes start and end on a dash? */
import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://127.0.0.1:3000'
const q = Buffer.from(JSON.stringify({ v: 1, f: 'haarlem', t: 'zaandam', d: '2026-11-02', m: 600, tm: 'depart' })).toString('base64')
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 390, height: 1200 }, deviceScaleFactor: 6, colorScheme: process.env.DARK ? 'dark' : 'light' })
await p.goto(`${BASE}/results/${q}`, { waitUntil: 'networkidle' })
for (let i = 0; i < 6; i += 1) if (await p.locator('.overlay').count()) { await p.keyboard.press('Escape'); await p.waitForTimeout(150) }
const cards = p.locator('article')
for (let i = 0; i < (await cards.count()); i += 1) {
  if ((await cards.nth(i).locator('.journey-card__leg').count()) >= 3) { await cards.nth(i).locator('.journey-card__link').first().click(); break }
}
await p.waitForSelector('.timeline')
const out = await p.evaluate(() => {
  document.documentElement.dataset.theme = new URLSearchParams(location.search).get('dark') ? 'dark' : document.documentElement.dataset.theme
  const ol = document.querySelector('.timeline')
  const ride = ol.querySelector('.timeline__rail--ride')
  const walk = ride.cloneNode(true)
  walk.className = 'timeline__rail timeline__rail--dashed'
  walk.querySelector('div.stack-1').innerHTML =
    '<span class="timeline__station t-md">Meeuwenstraat 98</span><span class="t-sm t-muted">Walk 37 min · 2970 m</span>'
  ol.prepend(walk)
  const box = (el) => { const r = el.getBoundingClientRect(); return { mid: +(r.top + r.height / 2).toFixed(2), top: +r.top.toFixed(1) } }
  const ring = box(walk.querySelector('.timeline__node'))
  const name = box(walk.querySelector('.timeline__station'))
  const amount = box(walk.querySelector('div.stack-1 > :nth-child(2)'))
  const glyphEl = walk.querySelector('.timeline__mode')
  const glyph = glyphEl ? box(glyphEl) : null
  const seg = getComputedStyle(walk, '::before')
  const row = walk.getBoundingClientRect()
  const nextRing = walk.querySelector('.timeline__node')
  return {
    nameOffRing: +(name.mid - ring.mid).toFixed(2),
    amountOffName: +(amount.mid - name.mid).toFixed(1),
    glyphOffAmount: glyph ? +(glyph.mid - amount.mid).toFixed(1) : null,
    seg: { top: seg.top, bottom: seg.bottom, image: seg.backgroundImage.replace(/\s+/g, ' ').slice(0, 120) },
    rowTop: +row.top.toFixed(1),
    dashTop: +(row.top + parseFloat(seg.top)).toFixed(1),
    ringBottom: +(nextRing.getBoundingClientRect().bottom).toFixed(1),
  }
})
console.log(JSON.stringify(out, null, 1))
const clip = await p.evaluate(() => {
  const li = document.querySelector('.timeline > li')
  const r = li.getBoundingClientRect()
  return { x: 0, y: Math.max(0, r.top - 2), width: 190, height: Math.min(140, Math.ceil(r.height + 4)) }
})
await p.screenshot({ path: process.env.OUT || 'artifacts/walk-name.png', clip })
await b.close()
