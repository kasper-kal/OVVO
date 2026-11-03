/** His exact journey: Amsterdam Centraal to Almere, and the last mark on that rail. */
import { chromium } from 'playwright'
const BASE = process.env.BASE || 'http://127.0.0.1:3000'
const targets = ['almere-centrum', 'almere_centrum', 'almere']
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 390, height: 1600 }, deviceScaleFactor: 8, colorScheme: 'light' })
p.setDefaultTimeout(12000)
let opened = false
for (const t of targets) {
  const q = Buffer.from(JSON.stringify({ v: 1, f: 'amsterdam', t, d: '2026-11-02', m: 390, tm: 'depart' })).toString('base64')
  await p.goto(`${BASE}/results/${q}`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(600)
  for (let i = 0; i < 6; i += 1) if (await p.locator('.overlay').count()) { await p.keyboard.press('Escape'); await p.waitForTimeout(120) }
  const n = await p.locator('article').count()
  console.log(t, 'cards', n)
  if (!n) continue
  await p.locator('article').first().locator('.journey-card__link').first().click()
  await p.waitForTimeout(700)
  if (await p.locator('.timeline__end').count()) { opened = true; break }
}
if (!opened) { console.log('no almere journey'); await b.close(); process.exit(0) }
const info = await p.evaluate(() => {
  const end = document.querySelector('.timeline__end')
  const n = end.querySelector('.timeline__node')
  const r = n.getBoundingClientRect()
  const c = getComputedStyle(n)
  const cb = getComputedStyle(end, '::before')
  return {
    cls: n.className,
    box: { w: +r.width.toFixed(1), h: +r.height.toFixed(1), top: +r.top.toFixed(1) },
    css: { width: c.width, height: c.height, radius: c.borderRadius, border: c.borderWidth, bg: c.backgroundColor, overflow: c.overflow },
    connector: { h: cb.height, top: cb.top, w: cb.width, bg: cb.backgroundColor, content: cb.content, left: cb.left },
    text: end.innerText.replace(/\n/g, ' | '),
    ol: document.querySelector('.timeline').className,
  }
})
console.log(JSON.stringify(info, null, 1))
const clip = await p.evaluate(() => {
  const end = document.querySelector('.timeline__end').getBoundingClientRect()
  window.scrollTo(0, window.scrollY + end.top - 130)
  const e2 = document.querySelector('.timeline__end').getBoundingClientRect()
  return { x: 0, y: Math.max(0, e2.top - 100), width: 170, height: 130 }
})
await p.waitForTimeout(200)
await p.screenshot({ path: process.env.OUT || 'artifacts/almere-end.png', clip })
await b.close()
