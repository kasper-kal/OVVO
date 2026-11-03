/** The stops inside an opened service: their marks, and the line they sit on. */
import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://127.0.0.1:3000'
const q = Buffer.from(JSON.stringify({ v: 1, f: 'haarlem', t: 'zaandam', d: '2026-11-02', m: 390, tm: 'depart' })).toString('base64')
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 390, height: 1600 }, deviceScaleFactor: 10, colorScheme: process.env.DARK ? 'dark' : 'light' })
p.setDefaultTimeout(12000)
await p.goto(`${BASE}/results/${q}`, { waitUntil: 'networkidle' })
await p.waitForFunction(() => [...document.styleSheets].some((s) => { try { return [...s.cssRules].length > 50 } catch { return false } }))
for (let i = 0; i < 6; i += 1) if (await p.locator('.overlay').count()) { await p.keyboard.press('Escape'); await p.waitForTimeout(120) }
await p.locator('article').first().locator('.journey-card__link').first().click()
await p.waitForSelector('.timeline')
const buttons = p.locator('.leg-service')
console.log('services', await buttons.count())
await buttons.first().click()
await p.waitForTimeout(500)
const info = await p.evaluate(() => {
  const rows = [...document.querySelectorAll('.timeline > li')]
  const measure = (li) => {
    const n = li.querySelector('.timeline__node')
    if (!n) return null
    const r = n.getBoundingClientRect()
    const c = getComputedStyle(n)
    const lr = li.getBoundingClientRect()
    const text = li.querySelector('.timeline__station, .t-sm')
    const tr = text ? text.getBoundingClientRect() : null
    const seg = getComputedStyle(li, '::before')
    return {
      cls: li.className.replace('timeline__rail ', ''),
      node: n.className.replace('timeline__node ', ''),
      size: `${c.width}x${c.height}`,
      border: c.borderWidth,
      bg: c.backgroundColor,
      radius: c.borderRadius,
      nodeTop: +(r.top - lr.top).toFixed(1),
      nodeMidY: +(r.top + r.height / 2 - lr.top).toFixed(1),
      textMidY: tr ? +(tr.top + tr.height / 2 - lr.top).toFixed(1) : null,
      centreX: +(r.left + r.width / 2 - lr.left).toFixed(1),
      segLeft: seg.left,
      segWidth: seg.width,
      rowH: +lr.height.toFixed(1),
    }
  }
  return rows.map(measure).filter(Boolean).slice(0, 9)
})
console.log(JSON.stringify(info, null, 1))
const clip = await p.evaluate(() => {
  const stop = document.querySelector('.timeline__rail--stop')
  const r = stop.getBoundingClientRect()
  window.scrollTo(0, window.scrollY + r.top - 200)
  const r2 = stop.getBoundingClientRect()
  return { x: 0, y: Math.max(0, r2.top - 120), width: 170, height: 200 }
})
await p.waitForTimeout(200)
await p.screenshot({ path: process.env.OUT || 'artifacts/stop-marks.png', clip })
await b.close()
