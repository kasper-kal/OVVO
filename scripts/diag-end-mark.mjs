/** The journey's last mark: is the line reaching it, and is the mark itself clean? */
import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://127.0.0.1:3000'
const q = Buffer.from(JSON.stringify({ v: 1, f: 'haarlem', t: 'zaandam', d: '2026-11-02', m: 390, tm: 'depart' })).toString('base64')
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 390, height: 1500 }, deviceScaleFactor: 10, colorScheme: process.env.DARK ? 'dark' : 'light' })
await p.goto(`${BASE}/results/${q}`, { waitUntil: 'networkidle' })
await p.waitForFunction(() => [...document.styleSheets].some((s) => { try { return [...s.cssRules].length > 50 } catch { return false } }))
for (let i = 0; i < 6; i += 1) if (await p.locator('.overlay').count()) { await p.keyboard.press('Escape'); await p.waitForTimeout(120) }
await p.locator('article').first().locator('.journey-card__link').first().click()
await p.waitForSelector('.timeline__end')
const out = await p.evaluate(() => {
  const end = document.querySelector('.timeline__end')
  const cb = getComputedStyle(end, '::before')
  const square = end.querySelector('.timeline__node')
  const sq = square.getBoundingClientRect()
  const endBox = end.getBoundingClientRect()
  const rideRow = [...document.querySelectorAll('.timeline__rail--ride')].pop()
  const rideSeg = getComputedStyle(rideRow, '::before')
  const rr = rideRow.getBoundingClientRect()
  return {
    end: { top: +endBox.top.toFixed(1), h: +endBox.height.toFixed(1), overflow: getComputedStyle(end).overflow },
    square: { left: +sq.left.toFixed(1), top: +sq.top.toFixed(1), w: +sq.width.toFixed(1), h: +sq.height.toFixed(1), bg: getComputedStyle(square).backgroundColor, radius: getComputedStyle(square).borderRadius },
    connector: { content: cb.content, width: cb.width, height: cb.height, left: cb.left, top: cb.top, bg: cb.backgroundColor, display: cb.display, zIndex: cb.zIndex },
    rideSegment: { bottom: rideSeg.bottom, top: rideSeg.top, rideRowBottom: +rr.bottom.toFixed(1) },
    gapLineToSquare: +((sq.top) - (rr.bottom + 35)).toFixed(1),
  }
})
console.log(JSON.stringify(out, null, 1))
const clip = await p.evaluate(() => {
  const end = document.querySelector('.timeline__end')
  const r = end.getBoundingClientRect()
  window.scrollTo(0, window.scrollY + r.top - 90)
  const r2 = end.getBoundingClientRect()
  return { x: 0, y: Math.max(0, r2.top - 40), width: 150, height: 80 }
})
await p.waitForTimeout(250)
await p.screenshot({ path: process.env.OUT || 'artifacts/end-mark.png', clip })
await b.close()
