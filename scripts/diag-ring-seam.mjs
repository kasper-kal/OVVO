/** The join between one row's line and the next row's ring: is there a sliver of page between them? */
import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://127.0.0.1:3000'
const NEEDLE = process.env.NEEDLE || 'Amsterdam Centraal'
const q = Buffer.from(JSON.stringify({ v: 1, f: 'haarlem', t: 'zaandam', d: '2026-11-02', m: 600, tm: 'depart' })).toString('base64')
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 390, height: 1200 }, deviceScaleFactor: 4 })
await p.goto(`${BASE}/results/${q}`, { waitUntil: 'networkidle' })
await p.waitForFunction(() => [...document.styleSheets].some((s) => { try { return [...s.cssRules].length > 50 } catch { return false } }))
for (let i = 0; i < 6; i += 1) if (await p.locator('.overlay').count()) { await p.keyboard.press('Escape'); await p.waitForTimeout(150) }
const cards = p.locator('article')
for (let i = 0; i < (await cards.count()); i += 1) {
  if ((await cards.nth(i).locator('.journey-card__leg').count()) >= 3) { await cards.nth(i).locator('.journey-card__link').first().click(); break }
}
await p.waitForSelector('.timeline')
if (process.env.DARK) { await p.emulateMedia({ colorScheme: 'dark' }); await p.evaluate(() => { document.documentElement.dataset.theme = 'dark' }) }
const out = await p.evaluate((needle) => {
  const lis = [...document.querySelectorAll('.timeline > li')]
  const row = lis.find((li) => li.innerText.includes(needle))
  if (!row) return null
  const prev = row.previousElementSibling
  const ring = row.querySelector('.timeline__node').getBoundingClientRect()
  const seg = getComputedStyle(prev, '::before')
  const prevRect = prev.getBoundingClientRect()
  const segBottom = prevRect.bottom - parseFloat(seg.bottom)
  return {
    ringTop: +ring.top.toFixed(2),
    segBottom: +segBottom.toFixed(2),
    overlap: +(segBottom - ring.top).toFixed(2),
    ringLeft: ring.left,
    ringTopRaw: ring.top,
  }
}, NEEDLE)
console.log(JSON.stringify(out, null, 1))
if (out) {
  await p.screenshot({
    path: process.env.OUT || 'artifacts/ring-seam.png',
    clip: { x: Math.max(0, out.ringLeft - 26), y: out.ringTopRaw - 26, width: 90, height: 84 },
  })
}
await b.close()
