const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:3000/wrapped?demo=1', { waitUntil: 'load', timeout: 90000 });
  await page.waitForTimeout(1200);
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(300);
  const nn = page.getByRole('button', { name: 'Not now', exact: true }).last();
  if (await nn.count()) { await nn.click().catch(() => {}); await page.waitForTimeout(300); }
  const look = async (label) => page.evaluate((label) => {
    const b = document.querySelector('.wrapped-body');
    if (!b) return label + ' no body';
    const bed = b.querySelectorAll('.wrapped-field--bed i').length;
    const dots = b.querySelectorAll('[class*="dot"]').length;
    const out = [];
    b.querySelectorAll('p, h1, h2, span, li, button, div').forEach((el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      if (cs.position === 'absolute' || cs.position === 'fixed') return;
      if (r.height > 0 && (r.bottom > 842 || r.top < 2)) out.push(`${el.className || el.tagName}:${Math.round(r.top)}-${Math.round(r.bottom)}`);
    });
    return `${label} chapter=${b.dataset.chapter} bedDots=${bed} dotEls=${dots} scrollH=${b.scrollHeight} nearEdge=${out.slice(0, 4).join(',') || 'none'}`;
  }, label);
  const rows = [];
  rows.push(await look('cover'));
  await page.getByRole('button', { name: 'Begin', exact: true }).first().click();
  await page.waitForTimeout(2500);
  rows.push(await look('ch2'));
  for (let i = 3; i <= 10; i++) { await page.keyboard.press('ArrowRight'); await page.waitForTimeout(2200); rows.push(await look('ch' + i)); }
  console.log(rows.join('\n'));
  await browser.close();
})();
