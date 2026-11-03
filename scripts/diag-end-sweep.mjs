/** Does the rail always meet the arrival square? Checked on several journeys, live. */
import { chromium } from 'playwright'
const BASE = process.env.BASE || 'https://ovvo.vibecreations.workers.dev'
const routes = [['haarlem', 'hoofddorp'], ['haarlem', 'zaandam'], ['amsterdam', 'hoofddorp'], ['utrecht', 'haarlem']]
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 390, height: 1200 }, deviceScaleFactor: 3 })
const report = []
for (const [f, t] of routes) {
  for (const m of [315, 600]) {
    const q = Buffer.from(JSON.stringify({ v: 1, f, t, d: '2026-11-02', m, tm: 'depart' })).toString('base64')
    await p.goto(`${BASE}/results/${q}`, { waitUntil: 'networkidle' })
    await p.waitForFunction(() => [...document.styleSheets].some((s) => { try { return [...s.cssRules].length > 50 } catch { return false } })).catch(() => {})
    for (let i = 0; i < 6; i += 1) if (await p.locator('.overlay').count()) { await p.keyboard.press('Escape'); await p.waitForTimeout(200) }
    const cards = p.locator('article')
    const n = await cards.count()
    let opened = false
    for (let i = 0; i < n; i += 1) {
      if ((await cards.nth(i).locator('.journey-card__leg').count()) >= 2) {
        await cards.nth(i).locator('.journey-card__link').first().click()
        opened = true
        break
      }
    }
    if (!opened) continue
    const has = await p.locator('.timeline').count()
    if (!has) continue
    await p.waitForTimeout(400)
    const r = await p.evaluate(() => {
      const end = document.querySelector('.timeline > .timeline__end')
      if (!end) return null
      const prev = end.previousElementSibling
      const er = end.getBoundingClientRect()
      const sq = end.querySelector('.timeline__node--end').getBoundingClientRect()
      const cs = getComputedStyle(end, '::before')
      const top = er.top - parseFloat(cs.top) * -1
      const height = parseFloat(cs.height)
      const connectorBottom = top + height
      return {
        olClass: document.querySelector('.timeline').className,
        squareTop: +sq.top.toFixed(1),
        squareBottom: +sq.bottom.toFixed(1),
        connectorTop: +top.toFixed(1),
        connectorBottom: +connectorBottom.toFixed(1),
        prevBottom: +prev.getBoundingClientRect().bottom.toFixed(1),
        meetsSquare: connectorBottom >= sq.top - 0.5,
        meetsRow: top <= prev.getBoundingClientRect().bottom + 0.5,
        connectorBg: cs.backgroundColor,
      }
    })
    report.push({ route: `${f}->${t} ${m}`, ...r })
    await p.screenshot({ path: `artifacts/endjoin-${f}-${t}.png`, clip: { x: 0, y: (await p.evaluate(() => document.querySelector('.timeline > .timeline__end').getBoundingClientRect().top)) - 70, width: 200, height: 120 } })
    await p.keyboard.press('Escape')
    await p.waitForTimeout(300)
    break
  }
}
console.log(JSON.stringify(report, null, 1))
await b.close()
