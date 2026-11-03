/** A journey with a change: what does the rail do where one leg hands over to the next? */
import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://127.0.0.1:3000'
const q = Buffer.from(JSON.stringify({ v: 1, f: 'haarlem', t: 'zaandam', d: '2026-11-02', m: 390, tm: 'depart' })).toString('base64')
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 390, height: 2000 }, deviceScaleFactor: 6, colorScheme: process.env.DARK ? 'dark' : 'light' })
p.setDefaultTimeout(8000)
await p.goto(`${BASE}/results/${q}`, { waitUntil: 'networkidle' })
await p.waitForFunction(() => [...document.styleSheets].some((s) => { try { return [...s.cssRules].length > 50 } catch { return false } }))
for (let i = 0; i < 6; i += 1) if (await p.locator('.overlay').count()) { await p.keyboard.press('Escape'); await p.waitForTimeout(120) }
const cards = p.locator('article')
const n = await cards.count()
let picked = -1
for (let i = 0; i < n; i += 1) {
  if ((await cards.nth(i).locator('.journey-card__leg').count()) >= 2) { picked = i; break }
}
console.log('cards', n, 'picked', picked)
if (picked < 0) { console.log('no transfer journey'); await b.close(); process.exit(0) }
await cards.nth(picked).locator('.journey-card__link').first().click()
await p.waitForSelector('.timeline__node')
const rows = await p.evaluate(() => [...document.querySelectorAll('.timeline > li')].map((li) => {
  const n = li.querySelector('.timeline__node')
  const r = n ? n.getBoundingClientRect() : null
  const lr = li.getBoundingClientRect()
  return { cls: li.className.replace('timeline__rail ', ''), node: n ? n.className.replace('timeline__node ', '') : null, top: r ? +(r.top - lr.top).toFixed(1) : null, h: r ? +r.height.toFixed(1) : null, w: r ? +r.width.toFixed(1) : null, rowH: +lr.height.toFixed(1), text: li.innerText.replace(/\n/g, ' | ').slice(0, 60) }
}))
console.log(JSON.stringify(rows, null, 1))
const clip = await p.evaluate(() => {
  const ol = document.querySelector('.timeline')
  const a = ol.getBoundingClientRect()
  window.scrollTo(0, window.scrollY + a.top - 60)
  const a2 = ol.getBoundingClientRect()
  const end = document.querySelector('.timeline__end').getBoundingClientRect()
  return { x: 0, y: Math.max(0, a2.top - 8), width: 190, height: Math.min(760, Math.ceil(end.bottom + 10 - a2.top)) }
})
await p.waitForTimeout(250)
await p.screenshot({ path: process.env.OUT || 'artifacts/transfer-rail.png', clip })
await b.close()
