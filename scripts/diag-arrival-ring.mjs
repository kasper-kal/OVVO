/** What has happened to the ring on the journey's last row? */
import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://127.0.0.1:3000'
const routes = [
  ['amsterdam', 'almere'],
  ['haarlem', 'zaandam'],
  ['amsterdam', 'groningen'],
  ['utrecht', 'zwolle'],
]
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 390, height: 1500 }, deviceScaleFactor: 6, colorScheme: process.env.DARK ? 'dark' : 'light' })
let done = false
for (const [f, t] of routes) {
  if (done) break
  const q = Buffer.from(JSON.stringify({ v: 1, f, t, d: '2026-11-02', m: 390, tm: 'depart' })).toString('base64')
  await p.goto(`${BASE}/results/${q}`, { waitUntil: 'networkidle' })
  await p.waitForFunction(() => [...document.styleSheets].some((s) => { try { return [...s.cssRules].length > 50 } catch { return false } }))
  for (let i = 0; i < 6; i += 1) if (await p.locator('.overlay').count()) { await p.keyboard.press('Escape'); await p.waitForTimeout(120) }
  const cards = p.locator('article')
  const n = await cards.count()
  console.log(`${f}->${t}: ${n} cards`)
  for (let i = 0; i < Math.min(n, 4); i += 1) {
    await cards.nth(i).locator('.journey-card__link').first().click().catch(() => {})
    await p.waitForTimeout(600)
    if (await p.locator('.timeline').count()) { done = true; break }
    await p.goBack().catch(() => {})
    await p.waitForTimeout(300)
  }
}
if (!done) { console.log('no journey opened'); await b.close(); process.exit(0) }
await p.waitForSelector('.timeline__node')
const out = await p.evaluate(() => {
  const rows = [...document.querySelectorAll('.timeline > li')]
  const all = rows.map((li) => {
    const node = li.querySelector('.timeline__node')
    if (!node) return { classes: li.className, node: null }
    const r = node.getBoundingClientRect()
    const c = getComputedStyle(node)
    const cr = li.getBoundingClientRect()
    return {
      classes: li.className,
      node: node.className,
      w: +r.width.toFixed(1),
      h: +r.height.toFixed(1),
      css: `${c.width}x${c.height}`,
      radius: c.borderRadius,
      bg: c.backgroundColor,
      liOverflow: getComputedStyle(li).overflow,
      rowH: +cr.height.toFixed(1),
      overflowsBelow: +(r.bottom - cr.bottom).toFixed(1),
    }
  })
  const end = document.querySelector('.timeline__end')
  const endBox = end ? end.getBoundingClientRect() : null
  return { rows: all, end: endBox ? { h: +endBox.height.toFixed(1), top: +endBox.top.toFixed(1) } : null }
})
console.log(JSON.stringify(out, null, 1))
const clip = await p.evaluate(() => {
  const rows = [...document.querySelectorAll('.timeline > li')]
  const last = rows[rows.length - 1].getBoundingClientRect()
  window.scrollTo(0, window.scrollY + last.top - 100)
  const l2 = rows[rows.length - 1].getBoundingClientRect()
  return { x: 0, y: Math.max(0, l2.top - 6), width: 130, height: 46 }
})
await p.waitForTimeout(250)
await p.screenshot({ path: process.env.OUT || 'artifacts/arrival-ring.png', clip })
await b.close()
