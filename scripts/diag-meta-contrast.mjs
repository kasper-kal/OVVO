/** The journey's one line of facts: what sits on what, and how far apart the two colours are. */
import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://127.0.0.1:3000'
const q = Buffer.from(JSON.stringify({ v: 1, f: 'haarlem', t: 'zaandam', d: '2026-11-02', m: 600, tm: 'depart' })).toString('base64')
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 390, height: 1200 }, deviceScaleFactor: 3 })
await p.goto(`${BASE}/results/${q}`, { waitUntil: 'networkidle' })
await p.waitForFunction(() => [...document.styleSheets].some((s) => { try { return [...s.cssRules].length > 50 } catch { return false } }))
for (let i = 0; i < 6; i += 1) if (await p.locator('.overlay').count()) { await p.keyboard.press('Escape'); await p.waitForTimeout(150) }
const cards = p.locator('article')
await cards.first().locator('.journey-card__link').first().click()
await p.waitForSelector('.journey-meta')
if (process.env.DARK) { await p.emulateMedia({ colorScheme: 'dark' }); await p.evaluate(() => { document.documentElement.dataset.theme = 'dark' }) }
await p.waitForTimeout(300)
const out = await p.evaluate(() => {
  const lum = ([r, g, b]) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
  }
  const parse = (s) => (s.match(/[\d.]+/g) || []).slice(0, 3).map(Number)
  const ratio = (a, b) => {
    const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x)
    return +((l1 + 0.05) / (l2 + 0.05)).toFixed(2)
  }
  const pageBg = parse(getComputedStyle(document.body).backgroundColor)
  const meta = document.querySelector('.journey-meta')
  const kids = [...meta.children].map((el) => {
    const cs = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    const bg = cs.backgroundColor === 'rgba(0, 0, 0, 0)' ? pageBg : parse(cs.backgroundColor)
    return {
      text: el.textContent,
      left: +r.left.toFixed(1), right: +r.right.toFixed(1), top: +r.top.toFixed(1), bottom: +r.bottom.toFixed(1),
      color: cs.color, bg: `rgb(${bg.join(', ')})`,
      ratio: ratio(parse(cs.color), bg),
      fontSize: cs.fontSize, weight: cs.fontWeight,
    }
  })
  const overlaps = []
  for (let i = 1; i < kids.length; i += 1) if (kids[i].left < kids[i - 1].right - 0.5) overlaps.push(`${kids[i - 1].text} / ${kids[i].text}`)
  return { pageBg: `rgb(${pageBg.join(', ')})`, kids, overlaps, metaRight: +meta.getBoundingClientRect().right.toFixed(1), width: innerWidth }
})
console.log(JSON.stringify(out, null, 1))
await p.locator('.page-head').screenshot({ path: process.env.OUT || 'artifacts/meta-light.png' }).catch(() => {})
await b.close()
