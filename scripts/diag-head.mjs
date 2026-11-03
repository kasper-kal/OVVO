/** The journey head (modes, travel time, fare star) and the stop beads, light and dark. */
import { chromium } from 'playwright'
const BASE = 'http://127.0.0.1:3000'
const q = Buffer.from(JSON.stringify({ v: 1, f: 'haarlem', t: 'zwolle', d: '2026-11-02', m: 300, tm: 'depart' })).toString('base64')
const b = await chromium.launch()

async function open(dark) {
  const p = await b.newPage({ viewport: { width: 390, height: 1600 }, deviceScaleFactor: 3, colorScheme: dark ? 'dark' : 'light' })
  p.setDefaultTimeout(15000)
  await p.goto(`${BASE}/results/${q}`, { waitUntil: 'networkidle' })
  await p.waitForFunction(() => [...document.styleSheets].some((s) => { try { return [...s.cssRules].length > 50 } catch { return false } }))
  for (let i = 0; i < 6; i += 1) if (await p.locator('.overlay').count()) { await p.keyboard.press('Escape'); await p.waitForTimeout(120) }
  await p.locator('article').first().locator('.journey-card__link').first().click()
  await p.waitForSelector('.timeline')
  return p
}

for (const dark of [false, true]) {
  const p = await open(dark)
  const out = await p.evaluate(() => {
    const meta = document.querySelector('.journey-meta')?.innerText
    const modes = document.querySelector('.journey-modes')?.innerText
    const note = document.querySelector('.journey-note')?.innerText
    const doc = document.documentElement
    return { meta, modes, note, overflow: doc.scrollWidth - doc.clientWidth }
  })
  console.log(dark ? 'DARK' : 'LIGHT', JSON.stringify(out))
  await p.screenshot({ path: dark ? 'artifacts/head-dark.png' : 'artifacts/head-light.png', clip: { x: 0, y: 0, width: 390, height: 620 } })
  const svc = p.locator('.leg-service')
  const n = await svc.count()
  for (let i = 0; i < n; i += 1) { await svc.nth(i).click(); await p.waitForTimeout(150) }
  await p.waitForTimeout(300)
  const bead = await p.evaluate(() => {
    const nodes = [...document.querySelectorAll('.timeline__node--stop')]
    if (!nodes.length) return 'no beads'
    const c = getComputedStyle(nodes[0])
    return `${c.width} ${c.borderColor} ${c.backgroundColor}`
  })
  console.log('  bead', bead, 'beads', await p.locator('.timeline__node--stop').count())
  const clip = await p.evaluate(() => {
    const nodes = [...document.querySelectorAll('.timeline__node--stop')]
    const r = nodes[nodes.length - 1].getBoundingClientRect()
    return { x: 0, y: Math.max(0, r.top - 90), width: 200, height: 180 }
  })
  await p.screenshot({ path: dark ? 'artifacts/beads-dark.png' : 'artifacts/beads-light.png', clip })
  // Narrowest phone: nothing may stick out sideways after the smaller clock.
  await p.setViewportSize({ width: 320, height: 1200 })
  await p.waitForTimeout(300)
  const narrow = await p.evaluate(() => {
    const d = document.documentElement
    return { overflow: d.scrollWidth - d.clientWidth }
  })
  console.log('  320px overflow', JSON.stringify(narrow))
  await p.close()
}
await b.close()
