/** A zoom on the rail where one row hands over to the next: blue into a ring, dashes into a ring. */
import { chromium } from 'playwright'
const BASE = process.env.BASE || 'https://ovvo.vibecreations.workers.dev'
const q = Buffer.from(JSON.stringify({ v: 1, f: 'haarlem', t: 'zaandam', d: '2026-11-02', m: 600, tm: 'depart' })).toString('base64')
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 390, height: 1200 }, deviceScaleFactor: 4 })
await p.goto(`${BASE}/results/${q}`, { waitUntil: 'networkidle' })
for (let i = 0; i < 6; i++) await p.keyboard.press('Escape')
const cards = p.locator('article')
for (let i = 0; i < (await cards.count()); i += 1) {
  if ((await cards.nth(i).locator('.journey-card__leg').count()) >= 3) { await cards.nth(i).locator('.journey-card__link').first().click(); break }
}
await p.waitForSelector('.timeline')
if (process.env.DARK) await p.evaluate(() => { document.documentElement.dataset.theme = 'dark' })
await p.waitForTimeout(400)
/* First a walk before the second ride, then a zoom on the two joins that touch it. */
const box = await p.evaluate(() => {
  const lis = [...document.querySelectorAll('.timeline > li')]
  const ride = lis.find((r) => r.classList.contains('timeline__rail--ride'))
  const second = lis[1]
  const walk = ride.cloneNode(true)
  walk.className = 'timeline__rail timeline__rail--dashed'
  walk.querySelector('div.stack-1').innerHTML = '<span class="t-sm t-muted">Walk 6 min · 420 m</span>'
  second.before(walk)
  const r = second.getBoundingClientRect()
  const n = second.querySelector('.timeline__node').getBoundingClientRect()
  return { top: r.top, nodeLeft: n.left, nodeTop: n.top }
})
await p.screenshot({
  path: process.env.OUT || 'artifacts/rail-joins.png',
  clip: { x: Math.max(0, box.nodeLeft - 40), y: box.top - 90, width: 120, height: 190 },
})
await b.close()
