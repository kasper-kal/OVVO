/** Every rail row's words and glyph against the middle of its own line, dot to dot. */
import { chromium } from 'playwright'
const BASE = process.env.BASE || 'https://ovvo.vibecreations.workers.dev'
const ROUTE = process.env.ROUTE || 'haarlem|zaandam'
const [f, t] = ROUTE.split('|')
const q = Buffer.from(JSON.stringify({ v: 1, f, t, d: '2026-11-02', m: 600, tm: 'depart' })).toString('base64')
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1000, height: 1400 }, deviceScaleFactor: 2 })
await p.goto(`${BASE}/results/${q}`, { waitUntil: 'networkidle' })
for (let i = 0; i < 6; i++) await p.keyboard.press('Escape')
await p.evaluate(() => { document.documentElement.dataset.theme = 'dark' })
const cards = p.locator('article')
for (let i = 0; i < (await cards.count()); i += 1) {
  if ((await cards.nth(i).locator('.journey-card__leg').count()) >= 3) {
    await cards.nth(i).locator('.journey-card__link').first().click()
    break
  }
}
await p.waitForSelector('.timeline', { timeout: 20000 })
await p.waitForTimeout(400)
const out = await p.evaluate(() => {
  const rows = [...document.querySelectorAll('.timeline > li')]
  const mid = (r) => {
    const n = r.querySelector('.timeline__node')
    if (!n) return null
    const b = n.getBoundingClientRect()
    return b.top + b.height / 2
  }
  const res = []
  for (let i = 0; i < rows.length - 1; i += 1) {
    const r = rows[i]
    if (r.classList.contains('timeline__rail--stop')) continue
    const stack = r.querySelector(':scope > div.stack-1')
    if (!stack) continue
    const words = [...stack.children].slice(1)
    if (!words.length) continue
    const boxes = words.map((k) => k.getBoundingClientRect())
    const top = Math.min(...boxes.map((x) => x.top))
    const bot = Math.max(...boxes.map((x) => x.bottom))
    const icon = r.querySelector('.timeline__mode')?.getBoundingClientRect()
    const a = mid(r)
    const c = mid(rows[i + 1])
    if (a == null || c == null) continue
    const lineMid = (a + c) / 2
    const wordsMid = (top + bot) / 2
    res.push({
      kind: r.classList.contains('timeline__rail--dashed') ? 'walk' : 'ride',
      text: r.innerText.replace(/\n/g, ' / ').slice(0, 34),
      lineMid: +lineMid.toFixed(1),
      wordsMid: +wordsMid.toFixed(1),
      wordsOff: +(wordsMid - lineMid).toFixed(1),
      iconOff: icon ? +(icon.top + icon.height / 2 - lineMid).toFixed(1) : null,
    })
  }
  return res
})
console.log(JSON.stringify(out, null, 1))
await p.locator('.timeline').screenshot({ path: process.env.OUT || 'artifacts/centre-rows.png' })
await b.close()
