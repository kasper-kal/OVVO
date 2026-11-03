/** The whole rail of a journey with a change, so every mark can be seen. */
import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://127.0.0.1:3000'
const q = Buffer.from(JSON.stringify({ v: 1, f: 'haarlem', t: 'zaandam', d: '2026-11-02', m: 390, tm: 'depart' })).toString('base64')
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 390, height: 1600 }, deviceScaleFactor: 4, colorScheme: process.env.DARK ? 'dark' : 'light' })
await p.goto(`${BASE}/results/${q}`, { waitUntil: 'networkidle' })
await p.waitForFunction(() => [...document.styleSheets].some((s) => { try { return [...s.cssRules].length > 50 } catch { return false } }))
for (let i = 0; i < 6; i += 1) if (await p.locator('.overlay').count()) { await p.keyboard.press('Escape'); await p.waitForTimeout(120) }
const cards = p.locator('article')
let best = -1
for (let i = 0; i < Math.min(await cards.count(), 12); i += 1) {
  const legs = await cards.nth(i).locator('.journey-card__leg').count()
  if (legs >= 3) { best = i; break }
}
if (best < 0) best = 0
await cards.nth(best).locator('.journey-card__link').first().click()
await p.waitForSelector('.timeline__node')
const rows = await p.evaluate(() => [...document.querySelectorAll('.timeline > li')].map((li) => {
  const n = li.querySelector('.timeline__node')
  const r = n ? n.getBoundingClientRect() : null
  return { cls: li.className, node: n ? n.className : null, w: r ? +r.width.toFixed(1) : null, h: r ? +r.height.toFixed(1) : null }
}))
console.log(JSON.stringify(rows))
const clip = await p.evaluate(() => {
  const ol = document.querySelector('.timeline')
  const a = ol.getBoundingClientRect()
  window.scrollTo(0, window.scrollY + a.top - 60)
  const a2 = ol.getBoundingClientRect()
  const rows = [...document.querySelectorAll('.timeline__rail, .timeline__end')]
  const last = rows[rows.length - 1].getBoundingClientRect()
  return { x: 0, y: Math.max(0, a2.top - 8), width: 200, height: Math.min(700, Math.ceil(last.bottom + 8 - a2.top)) }
})
await p.waitForTimeout(250)
await p.screenshot({ path: process.env.OUT || 'artifacts/rail-transfer.png', clip })
await b.close()
