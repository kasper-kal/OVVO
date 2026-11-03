/** Is there a journey anywhere in the sandbox with a real walk leg, so the row's own fitting runs? */
import { chromium } from 'playwright'
const pairs = [['haarlem','zaandam'],['amsterdam','utrecht'],['rotterdam','den-haag'],['haarlem','amsterdam'],['utrecht','amersfoort'],['leiden','den-haag']]
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 390, height: 1200 } })
for (const [f, t] of pairs) {
  const q = Buffer.from(JSON.stringify({ v: 1, f, t, d: '2026-11-02', m: 600, tm: 'depart' })).toString('base64')
  await p.goto(`http://127.0.0.1:3000/results/${q}`, { waitUntil: 'networkidle' })
  for (let i = 0; i < 6; i += 1) if (await p.locator('.overlay').count()) { await p.keyboard.press('Escape'); await p.waitForTimeout(120) }
  const cards = p.locator('article')
  for (let i = 0; i < Math.min(await cards.count(), 8); i += 1) {
    await cards.nth(i).click()
    await p.waitForTimeout(400)
    if (await p.locator('.timeline').count()) break
    await p.goBack(); await p.waitForTimeout(300)
  }
  const rows = await p.evaluate(() => [...document.querySelectorAll('.timeline__rail--dashed')].map((el) => ({ extra: el.style.getPropertyValue('--dash-extra') || null, h: +el.getBoundingClientRect().height.toFixed(1) })))
  console.log(f, '->', t, JSON.stringify(rows))
  await p.goBack()
}
await b.close()
