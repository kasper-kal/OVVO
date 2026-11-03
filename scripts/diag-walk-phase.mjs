/** A walk row rendered by the real stylesheet, measured pixel by pixel. */
import { chromium } from 'playwright'
const q = Buffer.from(JSON.stringify({ v: 1, f: 'haarlem', t: 'zwolle', d: '2026-11-02', m: 300, tm: 'depart' })).toString('base64')
const b = await chromium.launch()
for (const dark of [false, true]) {
  const p = await b.newPage({ viewport: { width: 390, height: 1400 }, deviceScaleFactor: 10, colorScheme: dark ? 'dark' : 'light' })
  await p.goto(`http://127.0.0.1:3000/results/${q}`, { waitUntil: 'networkidle' })
  await p.waitForFunction(() => [...document.styleSheets].some((s) => { try { return [...s.cssRules].length > 50 } catch { return false } }))
  for (let i = 0; i < 6; i += 1) if (await p.locator('.overlay').count()) { await p.keyboard.press('Escape'); await p.waitForTimeout(120) }
  await p.locator('article').first().locator('.journey-card__link').first().click()
  await p.waitForSelector('.timeline')
  const box = await p.evaluate(() => {
    /* The first station row, redrawn as a walk: same rail, same marks, the dashed style. */
    const li = document.querySelector('.timeline > li')
    li.classList.remove('timeline__rail--ride', 'timeline__rail--stop')
    li.classList.add('timeline__rail--dashed')
    li.style.height = '190px'
    const cs = getComputedStyle(li)
    const gap = parseFloat(cs.getPropertyValue('--timeline-gap')) || 32
    const node = parseFloat(cs.getPropertyValue('--rail-node')) || 14
    const length = li.getBoundingClientRect().height + gap - node
    const extra = ((-(length % 12) % 12) + 12) % 12
    li.style.setProperty('--dash-extra', `${extra.toFixed(2)}px`)
    const r = li.getBoundingClientRect()
    /* The rail's own column: the node sits at the row's left edge, seven pixels in. */
    return { x: Math.max(0, r.left - 4), y: r.top + window.scrollY, w: 40, h: r.height + 24, length, extra }
  })
  console.log(dark ? 'DARK' : 'LIGHT', JSON.stringify(box))
  await p.screenshot({ path: dark ? 'artifacts/walk-phase-dark.png' : 'artifacts/walk-phase.png', clip: { x: box.x, y: box.y, width: box.w, height: box.h } })
  await p.close()
}
await b.close()
