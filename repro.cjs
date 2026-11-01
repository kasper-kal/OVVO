const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const [name, viewport] of [['tall', { width: 430, height: 932 }], ['keyboard', { width: 430, height: 620 }]]) {
    const p = await b.newPage({ viewport, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await p.addInitScript(() => {
      Object.defineProperty(navigator, 'geolocation', {
        value: { getCurrentPosition() {}, watchPosition() { return 0; }, clearWatch() {} },
      });
    });
    await p.goto('http://127.0.0.1:3000/', { waitUntil: 'load', timeout: 60000 });
    await p.evaluate(() => { localStorage.setItem('ov-planner:v1:settings', JSON.stringify({ developerMode: true })); });
    await p.goto('http://127.0.0.1:3000/settings', { waitUntil: 'load', timeout: 60000 });
    await p.waitForTimeout(1200);
    if (await p.locator('[role="dialog"]').count()) {
      await p.keyboard.press('Escape');
      await p.waitForTimeout(400);
      if (await p.locator('[role="dialog"]').count()) {
        await p.locator('.scrim, .overlay').first().click({ position: { x: 5, y: 5 }, force: true }).catch(() => {});
        await p.waitForTimeout(400);
      }
    }
    console.log(name, 'dialog still up:', await p.locator('[role="dialog"]').count());
    const field = p.locator('input[placeholder*="station" i]').first();
    await field.scrollIntoViewIfNeeded();
    await field.click();
    await field.type('Haarlem', { delay: 30 });
    await p.waitForTimeout(1400);
    const info = await p.evaluate(() => {
      const list = document.querySelector('.suggestions');
      const card = list && list.closest('.card');
      const box = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), h: Math.round(r.height) }; };
      const rows = list ? Array.from(list.querySelectorAll('.suggestion')) : [];
      return {
        vh: window.innerHeight,
        list: box(list), maxHeight: list && getComputedStyle(list).maxHeight,
        padBottom: list && getComputedStyle(list).paddingBottom,
        scrollH: list && list.scrollHeight, clientH: list && list.clientHeight,
        rows: rows.length, firstRow: box(rows[0]), lastRow: box(rows[rows.length - 1]),
        rowsClipped: list && list.scrollHeight > list.clientHeight,
        card: box(card),
        listClass: list && list.className,
      };
    });
    console.log(name, JSON.stringify(info));
    await p.screenshot({ path: `artifacts/repro-${name}.png` });
    await p.close();
  }
  await b.close();
})();
