/** The last stretch of the rail into the arrival square, at four times the size. */
import { chromium } from 'playwright'
const q = Buffer.from(JSON.stringify({ v: 1, f: 'haarlem', t: 'zaandam', d: '2026-11-02', m: 600, tm: 'depart' })).toString('base64')
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 390, height: 1200 }, deviceScaleFactor: 4 })
const BASE = process.env.BASE || 'http://127.0.0.1:3000'
await p.goto(`${BASE}/results/` + q, { waitUntil: 'networkidle' })
await p.waitForFunction(() => [...document.styleSheets].some((s) => { try { return [...s.cssRules].length > 50 } catch { return false } }))
for (let i = 0; i < 6; i++) await p.keyboard.press('Escape')
const cards = p.locator('article')
for (let i = 0; i < (await cards.count()); i += 1) {
  if ((await cards.nth(i).locator('.journey-card__leg').count()) >= 3) { await cards.nth(i).locator('.journey-card__link').first().click(); break }
}
await p.waitForSelector('.timeline')
const info = await p.evaluate(() => {
  const ol = document.querySelector('.timeline')
  const end = ol.querySelector('.timeline__end')
  const prev = end.previousElementSibling
  const er = end.getBoundingClientRect()
  const sq = end.querySelector('.timeline__node--end').getBoundingClientRect()
  const cs = getComputedStyle(end, '::before')
  const pcs = getComputedStyle(prev, '::before')
  return {
    olClass: ol.className,
    endTop: +er.top.toFixed(1),
    squareTop: +sq.top.toFixed(1),
    squareH: +sq.height.toFixed(1),
    connector: { top: cs.top, height: cs.height, bg: cs.backgroundColor, content: cs.content },
    prevClass: prev.className,
    prevSeg: { top: pcs.top, bottom: pcs.bottom, bg: pcs.backgroundColor },
    prevBottom: +prev.getBoundingClientRect().bottom.toFixed(1),
    gap: getComputedStyle(ol).gap,
  }
})
console.log(JSON.stringify(info, null, 1))
await p.screenshot({ path: process.env.OUT || 'artifacts/end-join.png', clip: { x: 0, y: info.endTop - 80, width: 220, height: 140 } })
await b.close()
