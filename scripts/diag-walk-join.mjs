/** How far a walk's dashes sit from the circle above and the circle below, in pixels. */
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import sharp from 'sharp'
const BASE = process.env.BASE || 'http://127.0.0.1:3000'
const SCALE = 4
const q = Buffer.from(JSON.stringify({ v: 1, f: 'haarlem', t: 'zaandam', d: '2026-11-02', m: 600, tm: 'depart' })).toString('base64')
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 390, height: 1200 }, deviceScaleFactor: SCALE })
await p.goto(`${BASE}/results/${q}`, { waitUntil: 'networkidle' })
await p.waitForFunction(() => [...document.styleSheets].some((s) => { try { return [...s.cssRules].length > 50 } catch { return false } }))
for (let i = 0; i < 6; i += 1) if (await p.locator('.overlay').count()) { await p.keyboard.press('Escape'); await p.waitForTimeout(150) }
const cards = p.locator('article')
for (let i = 0; i < (await cards.count()); i += 1) {
  if ((await cards.nth(i).locator('.journey-card__leg').count()) >= 3) { await cards.nth(i).locator('.journey-card__link').first().click(); break }
}
await p.waitForSelector('.timeline')
if (process.env.DARK) await p.evaluate(() => { document.documentElement.dataset.theme = 'dark' })
await p.emulateMedia({ colorScheme: process.env.DARK ? 'dark' : 'light' })
await p.waitForTimeout(300)
const geom = await p.evaluate(() => {
  const lis = [...document.querySelectorAll('.timeline > li')]
  const ride = lis.find((r) => r.classList.contains('timeline__rail--ride'))
  const walk = ride.cloneNode(true)
  walk.className = 'timeline__rail timeline__rail--dashed'
  walk.querySelector('div.stack-1').innerHTML = '<span class="t-sm t-muted">Walk 6 min · 420 m</span>'
  lis[1].before(walk)
  const ringA = walk.querySelector('.timeline__node').getBoundingClientRect()
  const ringB = lis[1].querySelector('.timeline__node').getBoundingClientRect()
  const words = walk.querySelector('.timeline__iconish, div.stack-1 > span').getBoundingClientRect()
  const mode = walk.querySelector('.timeline__mode').getBoundingClientRect()
  return {
    cx: ringA.left + ringA.width / 2,
    ringABottom: ringA.bottom,
    ringBTop: ringB.top,
    wordsMid: words.top + words.height / 2,
    modeMid: mode.top + mode.height / 2,
    dotToDotMid: (ringA.top + ringA.height / 2 + ringB.top + ringB.height / 2) / 2,
  }
})
const y0 = Math.max(0, Math.floor(geom.ringABottom - 8))
const height = Math.ceil(geom.ringBTop - y0 + 8)
await p.screenshot({ path: 'artifacts/walk-join-measured.png', clip: { x: Math.max(0, geom.cx - 14), y: y0, width: 28, height } })
await p.screenshot({ path: process.env.OUT || 'artifacts/walk-join-crop.png', clip: { x: 0, y: Math.max(0, geom.ringABottom - 30), width: 260, height: Math.ceil(geom.ringBTop - geom.ringABottom + 60) } })
await b.close()
const img = await sharp('artifacts/walk-join-measured.png').raw().toBuffer({ resolveWithObject: true })
const { data, info } = img
const colFrom = Math.floor((14 - 2) * SCALE)
const colTo = Math.floor((14 + 2) * SCALE)
const rows = []
for (let y = 0; y < info.height; y += 1) {
  let kind = 'bg'
  for (let x = colFrom; x < colTo; x += 1) {
    const i = (y * info.width + x) * info.channels
    const [r, g, bl] = [data[i], data[i + 1], data[i + 2]]
    const lum = (r + g + bl) / 3
    if (lum < 120) kind = 'ink'
    else if (lum < 235 && kind === 'bg') kind = 'dash'
  }
  rows.push(kind)
}
const firstDashIdx = rows.findIndex((k) => k === 'dash')
const lastDashIdx = rows.length - 1 - [...rows].reverse().findIndex((k) => k === 'dash')
const toCss = (i) => +(y0 + i / SCALE).toFixed(1)
console.log(JSON.stringify({
  ringABottom: +geom.ringABottom.toFixed(1),
  ringBTop: +geom.ringBTop.toFixed(1),
  dotToDotMid: +geom.dotToDotMid.toFixed(1),
  wordsMid: +geom.wordsMid.toFixed(1),
  modeMid: +geom.modeMid.toFixed(1),
  firstDash: firstDashIdx < 0 ? null : toCss(firstDashIdx),
  lastDash: lastDashIdx < 0 ? null : toCss(lastDashIdx),
  gapUnderTopRing: firstDashIdx < 0 ? null : +(toCss(firstDashIdx) - geom.ringABottom).toFixed(1),
  gapAboveBottomRing: lastDashIdx < 0 ? null : +(geom.ringBTop - toCss(lastDashIdx) - 1 / SCALE).toFixed(1),
}, null, 1))
