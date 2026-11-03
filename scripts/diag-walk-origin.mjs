/** A journey that starts on foot: the address on the ring's line, the amount on the middle of the dashes. */
import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://127.0.0.1:3000'
const q = Buffer.from(JSON.stringify({ v: 1, f: 'haarlem', t: 'zaandam', d: '2026-11-02', m: 600, tm: 'depart' })).toString('base64')
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 390, height: 1200 }, deviceScaleFactor: 3 })
await p.goto(`${BASE}/results/${q}`, { waitUntil: 'networkidle' })
await p.waitForFunction(() => [...document.styleSheets].some((s) => { try { return [...s.cssRules].length > 50 } catch { return false } }))
for (let i = 0; i < 6; i += 1) if (await p.locator('.overlay').count()) { await p.keyboard.press('Escape'); await p.waitForTimeout(150) }
const cards = p.locator('article')
for (let i = 0; i < (await cards.count()); i += 1) {
  if ((await cards.nth(i).locator('.journey-card__leg').count()) >= 3) { await cards.nth(i).locator('.journey-card__link').first().click(); break }
}
await p.waitForSelector('.timeline')
const out = await p.evaluate(() => {
  const ol = document.querySelector('.timeline')
  const ride = ol.querySelector('.timeline__rail--ride')
  const walk = ride.cloneNode(true)
  walk.className = 'timeline__rail timeline__rail--dashed'
  walk.querySelector('div.stack-1').innerHTML =
    '<span class="row-wrap"><span class="timeline__station">Meeuwenstraat 98, Haarlem</span></span>' +
    '<span class="t-sm t-muted">Walk 37 min · 2970 m</span>'
  ol.prepend(walk)
  const mid = (el) => { const r = el.querySelector('.timeline__node').getBoundingClientRect(); return r.top + r.height / 2 }
  const next = walk.nextElementSibling
  const lineMid = (mid(walk) + mid(next)) / 2
  const amount = walk.querySelector('div.stack-1 > span.t-sm').getBoundingClientRect()
  const glyph = walk.querySelector('.timeline__mode').getBoundingClientRect()
  const name = walk.querySelector('.timeline__station').getBoundingClientRect()
  return {
    lineMid: +lineMid.toFixed(1),
    nameMid: +(name.top + name.height / 2).toFixed(1),
    amountOff: +((amount.top + amount.bottom) / 2 - lineMid).toFixed(1),
    glyphOff: +(glyph.top + glyph.height / 2 - lineMid).toFixed(1),
    rowH: +walk.getBoundingClientRect().height.toFixed(1),
  }
})
console.log(JSON.stringify(out, null, 1))
const clip = await p.evaluate(() => {
  const walk = document.querySelector('.timeline > li')
  const r = walk.getBoundingClientRect()
  return { y: Math.max(0, r.top - 10), h: Math.ceil(r.height + 20) }
})
await p.screenshot({ path: process.env.OUT || 'artifacts/walk-origin.png', clip: { x: 0, y: clip.y, width: 390, height: clip.h } })
await b.close()
