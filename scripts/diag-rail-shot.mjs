import { chromium } from 'playwright'
const BASE = process.env.BASE || 'https://ovvo.vibecreations.workers.dev'
const q = Buffer.from(JSON.stringify({ v: 1, f: 'haarlem', t: 'zaandam', d: '2026-11-02', m: 600, tm: 'depart' })).toString('base64')
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 390, height: 1000 }, deviceScaleFactor: 3, colorScheme: process.env.DARK ? 'dark' : 'light' })
await p.goto(`${BASE}/results/${q}`, { waitUntil: 'networkidle' })
for (let i = 0; i < 6; i++) await p.keyboard.press('Escape')
const cards = p.locator('article')
for (let i = 0; i < (await cards.count()); i += 1) {
  if ((await cards.nth(i).locator('.journey-card__leg').count()) >= 3) { await cards.nth(i).locator('.journey-card__link').first().click(); break }
}
await p.waitForSelector('.timeline')
await p.evaluate(() => { document.documentElement.dataset.theme = 'dark' })
await p.waitForTimeout(500)
await p.locator('.timeline').screenshot({ path: process.env.OUT || 'artifacts/rail-final.png' })
await b.close()
