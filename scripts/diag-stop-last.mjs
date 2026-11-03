/** His journey: the last stop inside an opened service, and how it meets the arrival row. */
import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://127.0.0.1:3000'
const q = Buffer.from(JSON.stringify({ v: 1, f: 'haarlem', t: 'zwolle', d: '2026-11-02', m: 300, tm: 'depart' })).toString('base64')
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 390, height: 2000 }, deviceScaleFactor: 10, colorScheme: process.env.DARK ? 'dark' : 'light' })
p.setDefaultTimeout(15000)
await p.goto(`${BASE}/results/${q}`, { waitUntil: 'networkidle' })
await p.waitForFunction(() => [...document.styleSheets].some((s) => { try { return [...s.cssRules].length > 50 } catch { return false } }))
for (let i = 0; i < 6; i += 1) if (await p.locator('.overlay').count()) { await p.keyboard.press('Escape'); await p.waitForTimeout(120) }
const cards = p.locator('article')
const n = await cards.count()
console.log('cards', n)
let target = -1
for (let i = 0; i < n; i += 1) {
  const t = await cards.nth(i).innerText()
  if (/06:00/.test(t) && /07:20/.test(t)) { target = i; console.log('card', i, '->07:20 Zwolle'); break }
}
if (target < 0) { console.log('NO 07:20 CARD; texts:'); for (let i = 0; i < Math.min(n, 8); i += 1) console.log('---', i, (await cards.nth(i).innerText()).replace(/\n+/g, ' | ').slice(0, 160)); await b.close(); process.exit(0) }
await cards.nth(target).locator('.journey-card__link').first().click()
await p.waitForSelector('.timeline')
const svc = p.locator('.leg-service')
const sn = await svc.count()
console.log('services', sn)
for (let i = 0; i < sn; i += 1) { await svc.nth(i).click(); await p.waitForTimeout(200) }
await p.waitForTimeout(400)
const info = await p.evaluate(() => {
  const rows = [...document.querySelectorAll('.timeline > li')]
  return rows.map((li) => {
    const node = li.querySelector('.timeline__node')
    const r = node ? node.getBoundingClientRect() : null
    const lr = li.getBoundingClientRect()
    const seg = getComputedStyle(li, '::before')
    const text = li.querySelector('.timeline__station, .t-sm, .t-xs')
    const tr = text ? text.getBoundingClientRect() : null
    return {
      cls: li.className.replace('timeline__rail ', '').slice(0, 46),
      label: (li.innerText || '').replace(/\n+/g, ' / ').slice(0, 46),
      node: node ? `${getComputedStyle(node).width}x${getComputedStyle(node).height} ${getComputedStyle(node).backgroundColor}` : null,
      h: +lr.height.toFixed(1),
      nodeMidY: r ? +(r.top + r.height / 2).toFixed(1) : null,
      textMidY: tr ? +(tr.top + tr.height / 2).toFixed(1) : null,
      centreX: r ? +(r.left + r.width / 2).toFixed(2) : null,
      segLeft: seg.left, segW: seg.width, segTop: seg.top, segBottom: seg.bottom,
    }
  })
})
console.log('--- last stops ---')
console.log(JSON.stringify(info.filter((r) => r.cls.includes('stop')).slice(-3), null, 1))
console.log('--- rows after the last stop ---')
const idx = info.map((r) => r.cls.includes('stop')).lastIndexOf(true)
console.log(JSON.stringify(info.slice(idx, idx + 3), null, 1))
console.log('--- html ---')
console.log(await p.evaluate(() => {
  const rows = [...document.querySelectorAll('.timeline > li')]
  const i = rows.map((li) => li.className.includes('--stop')).lastIndexOf(true)
  return rows.slice(i, i + 2).map((li) => li.outerHTML.slice(0, 700)).join('\n=====\n')
}))
const clip = await p.evaluate(() => {
  const rows = [...document.querySelectorAll('.timeline > li')]
  const i = rows.map((li) => li.className.includes('--stop')).lastIndexOf(true)
  const first = rows[Math.max(0, i - 1)].getBoundingClientRect()
  const last = rows[Math.min(rows.length - 1, i + 1)].getBoundingClientRect()
  return { x: 0, y: Math.max(0, first.top - 40), width: 200, height: Math.min(400, last.bottom - first.top + 80) }
})
await p.waitForTimeout(250)
await p.screenshot({ path: process.env.OUT || 'artifacts/stop-last.png', clip })
await b.close()
