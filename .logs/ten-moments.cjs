const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e)));
  await page.goto('http://127.0.0.1:3000/wrapped?demo=1', { waitUntil: 'load', timeout: 90000 });
  await page.waitForTimeout(1500);
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(300);
  const nn = page.getByRole('button', { name: 'Not now', exact: true }).last();
  if (await nn.count()) { await nn.click().catch(() => {}); await page.waitForTimeout(300); }

  const gaps = [250, 550, 700, 900, 1200];
  for (let i = 1; i <= 10; i++) {
    if (i === 2) await page.getByRole('button', { name: 'Begin', exact: true }).first().click();
    if (i > 2) await page.keyboard.press('ArrowRight');
    for (let m = 1; m <= 5; m++) {
      await page.waitForTimeout(gaps[m - 1]);
      await page.screenshot({ path: `artifacts/ch-${String(i).padStart(2, '0')}-m${m}.png` });
    }
    const info = await page.evaluate(() => {
      const b = document.querySelector('.wrapped-body');
      return (b ? b.dataset.chapter : '?') + ' :: ' + (b ? b.innerText.replace(/\n+/g, ' | ').slice(0, 200) : '');
    });
    console.log(`CH ${i} ${info}`);
  }
  console.log('errors:', errs.length ? errs.slice(0, 5) : 'none');
  console.log('shots:', (await require('fs')).readdirSync('artifacts').filter((f) => /^ch-\d\d-m\d\.png$/.test(f)).length);
  await browser.close();
})();
