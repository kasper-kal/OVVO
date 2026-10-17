/**
 * Three things a build, a type check and a screenshot all miss, read out of a real browser on
 * every route and at four widths:
 *
 *   1. contrast        — every text and icon, against the surface it actually sits on, to WCAG
 *                        AA (4.5:1 body, 3:1 large text and icons). Two secondary ink tones used
 *                        to fail everywhere: the faint tone measured 2.45–3.02 across the card
 *                        surfaces and the tints.
 *   2. touch targets   — the *effective* hit area, found by probing points outward from a
 *                        control's centre, so a pseudo-element that grows the target counts and
 *                        a paint box does not. Three circular icon buttons measured 21/26/39px
 *                        wide against a 44px height: a tight flex row had squeezed the width
 *                        only, so they were ovals with a target under the mark.
 *   3. clipped text    — text wider or taller than its own box while the box hides overflow,
 *                        which is how a settings line and a pill label went unread.
 *
 * Run:   node scripts/ui-audit.mjs [origin]      (needs playwright, see README)
 */
const ORIGIN = process.argv[2] ?? 'http://127.0.0.1:3000';
/*
 * `/disruptions/d1` is not an alert, and the page said so: the "Alert not found" empty state is
 * what this audit measured on the two routes below, so the alert page's own content — including
 * the butter "Advice" banner, whose title drew **1.03:1** in the dark appearance and had to be
 * reported from a phone screenshot instead — was never put in front of the contrast check. The
 * id is a real alert from `src/data/disruptions.ts` now.
 *
 * The journey route is the same story in reverse and is left as it is deliberately: a journey is
 * generated per search and exists only in the session that made it, so this page can only render
 * its empty state for a URL pasted into a fresh browser. Its banners are measured by
 * `.logs/round14-check.cjs`, which runs a real search first.
 */
/*
 * `/map` is in the list because it was the one screen that was not: it was reachable only as a home
 * widget until it became a page of its own, and the map's sizing was fixed twice on the strength of
 * a screenshot rather than measured. Its stops are drawn in SVG, so it adds no controls to the
 * target probe, and its names are the only text on the panel — measured against whatever ground the
 * panel paints (`.map-card .map-canvas`), which is the thing this audit is for.
 */
const ROUTES = ['/', '/results', '/journey/j1', '/stops', '/stops/utrecht-centraal', '/departures',
  '/disruptions', '/disruptions/d-cancel-schiphol', '/preferences', '/settings', '/map', '/nope'];
const WIDTHS = [320, 390, 768, 1440];
const MIN_TARGET = 44;
/*
 * `UI_AUDIT_THEME=dark` (or `nl` for the language) runs the whole audit again in the other
 * appearance: contrast is the one thing a token override can silently break, because every
 * ink/surface pair is recombined and only the combinations that actually happen get measured.
 */
const THEME = process.env.UI_AUDIT_THEME ?? '';
const LANGUAGE = process.env.UI_AUDIT_LANGUAGE ?? '';
/*
 * `UI_AUDIT_CLOCK=2026-10-15T23:50:00Z` freezes the page's clock at an hour of the caller's
 * choosing.
 *
 * This exists because two of the checks below — the 44px target and the clipped text — could be
 * reported as clean for a whole evening and then fail at 23:59, and neither answer was about the
 * code: a departure board holds a **cancelled** row only when the timetable has a cancellation in
 * the window, and the last services of the day are the ones that get them (measured: the same two
 * routes, 6 rows and 0 cancellations at 08:30 and at 00:02, 1 cancellation in 4 rows at 23:50). A
 * gate that only sees the defect when the demo data happens to produce it is not a gate, so the
 * hour is an input: the end-of-service run is one command, and the ordinary run stays the default.
 */
const CLOCK = process.env.UI_AUDIT_CLOCK ?? '';
const SETTINGS_STORAGE = {
  version: 2,
  theme: THEME || 'system',
  language: LANGUAGE || 'en',
  boardAutoRefresh: 5,
  timeFormat: '24h',
  dateFormat: 'long',
  density: 'comfortable',
  highContrast: false,
  reduceMotion: false,
  defaultTimeMode: 'depart',
  /*
   * A configured state on purpose: the picker check below measures the hint line under a field
   * *when the field holds a stop*, and the board no longer invents one. With nothing configured
   * there is no hint anywhere and the coverage rule would be asserted against nothing — the
   * vacuity guard at the end of this file exists because that happened once.
   */
  defaultOriginStopId: 'utrecht-centraal',
};

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.error('this audit needs a browser: npm i -D playwright && npx playwright install chromium');
  process.exit(2);
}

const browser = await chromium.launch({ chromiumSandbox: false, args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--hide-scrollbars'] });
const contrast = [];
const targets = [];
const clipped = [];
const counted = { text: 0, controls: 0, covered: 0 };
const squares = [];
const band = [];
const line = [];
const wrapped = [];
const popovers = [];
const popoverSamples = [];

for (const width of WIDTHS) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
  await context.addInitScript(
    ([settings, clock]) => {
      window.localStorage.setItem('ov-planner:v1:settings', JSON.stringify(settings));
      window.localStorage.setItem('ov-planner:v1:location-consent', '"denied"');
      /* The freeze is on `Date` itself, so every generator that asks what time it is gets the
         frozen hour — including the refresh ticker's arithmetic, which keeps working because
         only "now" is fixed and elapsed time still adds up. */
      if (!clock) return;
      const fixed = new Date(clock).getTime();
      const RealDate = Date;
      window.Date = class extends RealDate {
        constructor(...args) {
          if (args.length === 0) super(fixed);
          else super(...args);
        }

        static now() {
          return fixed;
        }
      };
    },
    [SETTINGS_STORAGE, CLOCK],
  );
  const page = await context.newPage();
  for (const route of ROUTES) {
    await page.goto(`${ORIGIN}/#${route}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(140);
    /*
     * Close anything modal first. The location dialog opens on first use and its overlay covers
     * the page, so every control behind it fails a point probe — 189 false failures before this.
     */
    for (const label of ['Not now', 'No thanks', 'Deny', 'Dismiss', 'Got it']) {
      const button = page.locator('[role=dialog] button, [role=dialog] a').filter({ hasText: new RegExp(label, 'i') });
      if (await button.count()) { await button.first().click().catch(() => {}); break; }
    }
    await page.waitForFunction(() => !document.querySelector('[role=dialog], .overlay'), { timeout: 2500 }).catch(() => {});
    await page.waitForTimeout(120);
    /*
     * The inline picker, opened first and closed again.
     *
     * Two things about a popover are promises, and neither is visible in a closed one: it hangs
     * from the field it belongs to, and it covers what that field puts underneath it (the stop's
     * code and modes, `.field__hint`). Anchored to the whole labelled control instead of its
     * input, the list opened *below* the hint line — planted and measured again at **36px**
     * between the input's bottom edge and the list's top (44px where the hint wraps onto two
     * lines at 320px), against **4px** now — leaving "ASC · Train, Tram, Metro, Bus, Ferry,
     * Walking, Biking" sitting above a panel that was supposed to be covering it.
     *
     * It is closed before the rest of the audit runs: an open list legitimately hides the
     * controls beneath it, and measuring the page through it would report them as targets the
     * app has lost.
     */
    let pickerOpen = false;
    const fieldInput = page.locator('.combobox__field input').first();
    if (await fieldInput.count()) {
      /*
       * Bring the field on screen first. This measured wherever the page happened to be, and
       * `elementFromPoint` answers **null** for a point outside the viewport — so a hint line
       * below the fold was reported as "not covered by its popover" when nothing was wrong with
       * it, only with the question (the settings page's default-origin field sits that far down
       * a 900px window). The rule is unchanged and still asserts the same thing: the list hangs
       * from its input and covers the hint under it. It is now asked where the hint can be seen.
       */
      await fieldInput
        .evaluate((el) => el.scrollIntoView({ block: 'center' }))
        .catch(() => {});
      await page.waitForTimeout(80);
      /*
       * Replace the value, do not append to it: on a field that already holds a stop (the board's
       * own picker), typing at the caret produced "Utrecht CentraalA" and the audit measured a
       * no-match panel — 0 rows — while reporting the geometry as fine.
       */
      await fieldInput.fill('A').catch(() => {});
      await page.waitForTimeout(90);
      const geo = await page.evaluate(() => {
        const list = document.querySelector('.combobox .suggestions');
        const group = list && list.closest('.combobox')?.querySelector('.input-group');
        if (!list || !group) return null;
        const g = group.getBoundingClientRect();
        const l = list.getBoundingClientRect();
        const hint = document.querySelector('.combobox .field__hint');
        const out = {
          gap: Math.round(l.top - g.bottom),
          height: Math.round(l.height),
          rows: list.querySelectorAll('[role="option"]').length,
          rowHeight: Math.round(list.querySelector('[role="option"]')?.getBoundingClientRect().height ?? 0),
          hintCovered: null,
        };
        if (hint) {
          const h = hint.getBoundingClientRect();
          const probes = [
            [h.left + 3, h.top + 3], [h.right - 3, h.top + 3],
            [h.left + 3, h.bottom - 3], [h.right - 3, h.bottom - 3],
            [h.left + h.width / 2, h.top + h.height / 2],
          ];
          out.hintCovered = probes.every(([x, y]) => {
            const top = document.elementFromPoint(x, y);
            return !!top && (top === list || list.contains(top));
          });
          out.hintHeight = Math.round(h.height);
        }
        return out;
      });
      if (geo) {
        popoverSamples.push({ route, width, ...geo });
        if (geo.gap > 12 || (geo.hintCovered === false) || (geo.rows >= 6 && geo.height < 300)) popovers.push({ route, width, ...geo });
        pickerOpen = true;
      }
      await page.keyboard.press('Escape').catch(() => {});
      await page.waitForTimeout(90);
    }
    const res = await page.evaluate((MIN_TARGET) => {
      const out = { contrast: [], targets: [], clipped: [], squares: [], band: [], line: [], wrapped: [], counted: { text: 0, controls: 0, covered: 0 } };
      const name = (el) => `${el.tagName.toLowerCase()}.${String(el.className || '').split(' ').filter(Boolean).slice(0, 3).join('.')}`;
      const textOf = (el) => (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 46);
      const hidden = (el) => { const r = el.getBoundingClientRect(); return r.width <= 2 || r.height <= 2 || String(el.className || '').includes('sr-only'); };
      const parse = (v) => { const m = String(v).match(/rgba?\(([^)]+)\)/); if (!m) return null;
        const p = m[1].split(',').map(Number); return { rgb: p.slice(0, 3), a: p.length > 3 ? p[3] : 1 }; };
      const lum = (c) => { const [r, g, b] = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
      const blend = (fg, bg) => fg.rgb.map((v, i) => v * fg.a + bg[i] * (1 - fg.a));
      const bgOf = (el) => { for (let e = el; e; e = e.parentElement) { const cs = getComputedStyle(e);
          const c = parse(cs.backgroundColor); if (c && c.a > 0.02) return c.rgb; if (cs.backgroundImage !== 'none') return null; }
        return [255, 255, 255]; };
      const ratio = (fg, bg) => { const a = lum(blend(fg, bg)), b = lum(bg); const [hi, lo] = a > b ? [a, b] : [b, a];
        return (hi + 0.05) / (lo + 0.05); };

      /*
       * Anything a stylesheet declares square has to *render* square. This is the check that
       * catches a flex row squeezing one axis of a disc or a tile: the access-mode disc was
       * declared 32x32 and drawn 22x32, and both the icons and the round buttons had the same
       * fault. Rules are read out of the stylesheets, so it needs no list of class names.
       */
      /*
       * "Declared square" means an **absolute** pair — `44px` twice, or `aspect-ratio: 1` — and not
       * just two equal strings. `width: 100%; height: 100%` is not a square declaration: it is "fill
       * the parent", which is what the dashed ring's full-bleed SVG says, and reading it as a square
       * flagged nine instances of a thing that was never square (the defect this check exists for is
       * a 32x32 disc drawn 22x32, and a percentage pair cannot produce it — the parent decides both
       * axes). The absolute units are matched explicitly so nothing else slips in.
       */
      const absolute = /^\d*\.?\d+(px|rem|em)$/;
      const squareSelectors = new Set();
      /*
       * ...and a square declaration can be **cancelled on purpose**, which is not the accident this
       * check exists to catch.
       *
       * The map used to be the case: `.map-canvas` declared `aspect-ratio: 1 / 1` and the wide rule
       * cancelled it with `auto`. It no longer declares one at all — the drawing is an
       * `<svg viewBox="0 0 100 100">`, so its own viewBox is the square and the wide rules state
       * 4 / 3 and 16 / 9 for the plate — but the cancellation stays: a rule that writes
       * `aspect-ratio: auto` explicitly is a decision, and an accidental squeeze, which is what
       * this check found three times, never writes one.
       */
      const cancelled = new Set();
      /*
       * Every rule, including the ones inside a media query: `@media` is where a size is stated
       * for one shape of the window, and the map screen's canvas is exactly that (`min-width:
       * 720px`). Reading only the top level of each sheet hid both the cancellation and any square
       * declared inside a query.
       */
      const walk = (rules, visit) => {
        for (const rule of rules) {
          if (rule.cssRules && !rule.selectorText) { walk(rule.cssRules, visit); continue; }
          if (rule.selectorText && rule.style) visit(rule);
        }
      };
      for (const sheet of document.styleSheets) {
        try {
          walk(sheet.cssRules, (rule) => {
            const w = rule.style.width, h = rule.style.height, ar = rule.style.aspectRatio;
            if ((w && h && w === h && absolute.test(w)) || ar === '1' || ar === '1 / 1') squareSelectors.add(rule.selectorText);
            if (ar === 'auto') cancelled.add(rule.selectorText);
          });
        } catch { continue; }
      }
      const cancelledOn = (el) => [...cancelled].some((sel) => el.matches(sel));
      const squares = [];
      for (const sel of squareSelectors) {
        for (const el of document.querySelectorAll(sel)) {
          const cs = getComputedStyle(el);
          if (cs.display === 'none' || cs.visibility === 'hidden') continue;
          if (cancelledOn(el)) continue;
          const r = el.getBoundingClientRect();
          if (r.width < 3 || r.height < 3) continue;
          if (Math.abs(r.width - r.height) > 1) squares.push({ el: name(el), want: cs.width + 'x' + cs.height, got: `${r.width.toFixed(1)}x${r.height.toFixed(1)}` });
        }
      }
      out.squares = squares;
      out.counted.squares = squares.length;

      for (const el of document.querySelectorAll('*')) {
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden' || hidden(el)) continue;
        const rect = el.getBoundingClientRect();
        if (!rect.width || !rect.height) continue;
        const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
        const isIcon = el.tagName.toLowerCase() === 'svg';

        if (hasText || isIcon) {
          out.counted.text += 1;
          const fg = parse(cs.color), bg = bgOf(el);
          if (fg && bg) {
            const size = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight, 10) >= 600;
            const need = isIcon ? 3 : size >= 24 || (bold && size >= 18.66) ? 3 : 4.5;
            const cr = ratio(fg, bg);
            if (cr < need) out.contrast.push({ el: name(el), text: (isIcon ? `${el.dataset.icon ?? ''} in ${name(el.parentElement)}` : textOf(el).slice(0, 34)), cr: +cr.toFixed(2), need,
              size, color: cs.color, bg: `rgb(${bg.map((v) => Math.round(v)).join(',')})` });
          }
        }

        if (hasText || el.children.length === 0) {
          const clamp = cs.webkitLineClamp && cs.webkitLineClamp !== 'none';
          if (cs.overflowX !== 'visible' && el.scrollWidth > Math.ceil(el.clientWidth) + 1 && rect.width > 8)
            out.clipped.push({ el: name(el), text: textOf(el), axis: 'x', scroll: el.scrollWidth, client: el.clientWidth });
          if (cs.overflowY !== 'visible' && !clamp && el.scrollHeight > Math.ceil(el.clientHeight) + 1 && rect.height > 8)
            out.clipped.push({ el: name(el), text: textOf(el), axis: 'y', scroll: el.scrollHeight, client: el.clientHeight });
        }

        if (!el.matches('a[href], button, select, input:not([type=hidden]), textarea, [role=button], [role=checkbox], [role=tab], summary')) continue;
        // a link that is only a word inside a sentence is sized by the sentence, not by us
        const inProse = el.tagName === 'A' && cs.display.startsWith('inline') && el.matches('p a, li a') && !el.className.toString().includes('tap-target');
        if (inProse) continue;
        const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
        // Only controls whose whole probed square is on screen: the viewport edge, or a control
        // scrolled under a sticky bar, cannot be measured and is not a defect.
        const pad = MIN_TARGET / 2 + 1;
        if (cx < pad || cy < pad || cx > innerWidth - pad || cy > innerHeight - pad) continue;
        /*
         * Probe the four edge midpoints of a MIN_TARGET square centred on the control, half a
         * pixel inside its edge: a target of exactly 44 passes, 43 does not, and a target grown
         * by a pseudo-element passes because `elementFromPoint` sees the grown hit area. Walking
         * outward pixel by pixel instead rounds 44 down to 43 and reports false failures.
         */
        const hit = (x, y) => { const t = document.elementFromPoint(x, y); return !!t && (t === el || el.contains(t)); };
        const half = MIN_TARGET / 2 - 0.5;
        const points = [[cx - half, cy], [cx + half, cy], [cx, cy - half], [cx, cy + half]];
        out.counted.controls += 1;
        if (!hit(cx, cy)) { out.counted.covered += 1; continue; }   // a toast or the app's own chrome is over it
        /*
         * A control the app's own fixed chrome happens to cover — a chip scrolled under the dock
         * or the header — is a scroll position, not a small target. Everything else that fails a
         * corner is a real one.
         */
        const underChrome = (x, y) => {
          for (let e = document.elementFromPoint(x, y); e; e = e.parentElement) {
            const p = getComputedStyle(e).position;
            if (p === 'fixed' || p === 'sticky') return true;
          }
          return false;
        };
        const missing = points.filter(([x, y]) => !hit(x, y));
        if (missing.length && !missing.every(([x, y]) => underChrome(x, y)))
          out.targets.push({ el: name(el), text: textOf(el).slice(0, 30), w: +rect.width.toFixed(1), h: +rect.height.toFixed(1),
            corners: `${4 - missing.length}/4` });
      }

      /*
       * The header is two promises at once, and both are behavioural, so both are measured:
       *
       *   1. it **sticks** — scrolled 300px down the page, its box is still at the top of the
       *      viewport. `position: static` fails this by exactly the scroll distance.
       *   2. it **paints nothing** — the row's own computed background, background-image and
       *      box-shadow are all empty while it is stuck. `background: var(--l0-bg)` on the
       *      canvas measures identical to the page and looked like nothing at the top of a
       *      screen, but a white card scrolling under it showed the band immediately.
       *
       * Reading what the row paints, and where it sits once the page has moved, is what makes
       * this survive the next refactor rather than only the last one. The band used to be caught
       * by scanning *everything* that painted across the row's box; that check is gone on
       * purpose — content passing under a sticky header is the header working, not the defect.
       */
      const header = document.querySelector('.app-header');
      if (header) {
        const hcs = getComputedStyle(header);
        if (hcs.position !== 'sticky' && hcs.position !== 'fixed')
          out.band.push({ el: name(header), why: `position ${hcs.position}: the row scrolls away with the page` });
        if (hcs.backgroundColor !== 'rgba(0, 0, 0, 0)' || hcs.backgroundImage !== 'none' || hcs.boxShadow !== 'none')
          out.band.push({ el: name(header), why: `paints ${hcs.backgroundColor} / ${hcs.backgroundImage} / ${hcs.boxShadow.slice(0, 30)}` });
        const restTop = header.getBoundingClientRect().top;
        if (restTop > 8) out.band.push({ el: name(header), why: `starts ${Math.round(restTop)}px down, not at the top of the page` });
        // A layout read after a scroll forces a synchronous style+layout pass, so the stuck
        // position can be measured in the same evaluate. Put the page back where it was.
        const before = window.scrollY;
        window.scrollTo(0, 400);
        const stuckTop = header.getBoundingClientRect().top;
        window.scrollTo(0, before);
        // Only where the page is long enough to scroll past the row: on a short page it cannot
        // be pushed off the top, so there is nothing to prove.
        if (document.documentElement.scrollHeight > innerHeight + 400 && (stuckTop < -1 || stuckTop > 1))
          out.band.push({ el: name(header), why: `scrolled 400px, the row sits at ${Math.round(stuckTop)}px instead of 0` });
      }
      /*
       * The three things in the top row share **one top edge**, and that is a promise the CSS can
       * only keep by accident unless it is measured: the row is a grid, each child can be centred,
       * top-aligned or nudged with its own margin of its own size, and every arrangement looks
       * plausible until the three are compared. It was measured after a complaint ("run one line
       * above all buttons, it hits all of them") and the three were on **three** different top
       * edges: alerts at 8, mark at 20, way back at 12. Nothing here could see it — all three are
       * controls with a legal target and legal contrast, they overlap no text and nothing is
       * clipped.
       *
       * Only the top is asserted, and that is the requirement rather than a weakening of it: the
       * three are deliberately different sizes (the mark's 56px square, the arrow's 44px disc, the
       * alerts entry's 36px pill) so their heights, middles and bottoms differ by design — "one
       * line drawn under them does not have to hit them all". Effective target size is the check
       * above's business, and it already probes every control including this one.
       *
       * A page with no way back is not a pass by absence: the two that exist still have to agree.
       */
      const slots = [['way back', '.app-header__back'], ['the mark', '.app-header__brand'], ['alerts', '.app-header__alerts']];
      const boxes = [];
      for (const [label, selector] of slots) {
        const slot = document.querySelector(selector);
        if (!slot) continue;
        const drawn = slot.querySelector('button, a, .btn') ?? slot;
        const r = drawn.getBoundingClientRect();
        /* The way back is an empty wrapper on a page that has none — a 0px box is not a row item,
           and counting it reported every such page as a row of tops none of them shared. */
        if (r.height < 1) continue;
        boxes.push({ label, top: Math.round(r.top), height: Math.round(r.height) });
      }
      if (boxes.length > 1 && new Set(boxes.map((b) => b.top)).size > 1)
        out.line.push({
          el: 'app-header__inner',
          why: `tops differ — ${boxes.map((b) => `${b.label} top ${b.top} (${b.height}px tall)`).join(' · ')}`,
        });
      /*
       * A segmented control is a capsule for two or three short options, and it has
       * `flex-wrap: wrap` so that a row of options can never drag the page sideways. Those two
       * facts do not survive each other: five options wrapped onto a second row *inside* a 9999px
       * radius, which draws a stadium around both rows (the traveller's screenshot, and "how does
       * this keep happening"). Nothing else here could see it. Overflow is **zero** — it wrapped
       * instead of overflowing; no text is clipped, because every label still fits its own button;
       * no target is small; the contrast is fine. Measured directly, then: more than one row of
       * options inside one capsule is the defect, whatever produced it.
       */
      for (const box of document.querySelectorAll('.segmented')) {
        if (getComputedStyle(box).display === 'none') continue;
        const options = [...box.querySelectorAll('.segmented__btn')];
        if (!options.length) continue;
        const rows = new Set(options.map((btn) => Math.round(btn.getBoundingClientRect().top)));
        if (rows.size > 1) out.wrapped.push({ el: name(box), options: options.length, rows: rows.size, radius: getComputedStyle(box).borderRadius });
      }
      return out;
    }, MIN_TARGET);
    counted.text += res.counted.text; counted.controls += res.counted.controls; counted.covered += res.counted.covered;
    const buckets = { contrast, targets, clipped, squares, band, line, wrapped };
    for (const k of Object.keys(buckets)) for (const r of res[k]) buckets[k].push({ route, width, ...r });
  }
  await context.close();
}
await browser.close();

const report = (list, keyOf, show) => {
  const uniq = new Map();
  for (const r of list) { const k = keyOf(r); const e = uniq.get(k) ?? { r, n: 0, where: [] }; e.n += 1; e.where.push(`${r.route}@${r.width}`); uniq.set(k, e); }
  const rows = [...uniq.values()].sort((a, b) => b.n - a.n);
  console.log(`\n${list.length} hits, ${rows.length} distinct`);
  for (const { r, n, where } of rows.slice(0, 25)) console.log('  x' + String(n).padStart(3), show(r), `[${where.slice(0, 2).join(' ')}${where.length > 2 ? ' +' + (where.length - 2) : ''}]`);
  return rows.length;
};

console.log(`ui-audit — ${ROUTES.length} routes x ${WIDTHS.length} widths — theme ${THEME || 'system'}, language ${LANGUAGE || 'en'}`);
console.log(`${counted.text} text/icon nodes measured for contrast, ${counted.controls} controls probed for target size (${counted.covered} covered by app chrome and skipped)`);
console.log('\n=== contrast below WCAG AA');
const nContrast = report(contrast, (r) => `${r.el}|${r.text}|${r.cr}|${r.bg}`, (r) => `${r.el} ${r.cr}:1 need ${r.need} ${r.size}px ${r.color} on ${r.bg} "${r.text}"`);
console.log('\n=== effective target under ' + MIN_TARGET + 'x' + MIN_TARGET);
const nTargets = report(targets, (r) => `${r.el}|${r.text}|${r.w}x${r.h}`, (r) => `${r.el} ${r.w}x${r.h} "${r.text}"`);
console.log('\n=== elements declared square that do not render square');
const nSquares = report(squares, (r) => `${r.el}|${r.want}|${r.got}`, (r) => `${r.el} declared ${r.want}, drew ${r.got}`);
console.log('\n=== text clipped by its own box');
const nClipped = report(clipped, (r) => `${r.el}|${r.axis}|${r.scroll}|${r.client}`, (r) => `${r.el} ${r.axis}: ${r.scroll} in ${r.client} "${r.text}"`);
console.log('\n=== the header band: anything painted across the top row');
const nBand = report(band, (r) => `${r.el}|${r.why}`, (r) => `${r.el} ${r.why}`);
console.log('\n=== the top row: the way back, the mark and the alerts entry share one top edge');
const nLine = report(line, (r) => `${r.el}|${r.why}`, (r) => `${r.el} ${r.why}`);
console.log('\n=== the picker popover: where it hangs, and what it covers');
if (!popoverSamples.some((r) => r.hintCovered !== null))
  popovers.push({
    route: '(none)',
    width: 0,
    gap: 0,
    height: 0,
    rows: 0,
    rowHeight: 0,
    hintCovered: null,
    vacuous: true,
  });
console.log(`opened and measured ${popoverSamples.length} time(s)` +
  popoverSamples.map((r) => `\n  ${r.route}@${r.width}: ${r.gap}px under its input, ${r.rows} rows of ${r.rowHeight}px in ${r.height}px, hint covered ${r.hintCovered}`).slice(0, 8).join(''));
const nPopovers = report(popovers, (r) => `${r.el ?? ''}|${r.gap}|${r.hintCovered}|${r.height}`, (r) => r.vacuous ? 'nothing with a hint line was ever open: the coverage rule was never measured' : `gap from the input ${r.gap}px, hint covered ${r.hintCovered}, ${r.rows} rows of ${r.rowHeight}px in ${r.height}px`);
console.log('\n=== segmented controls wrapped onto more than one row');
const nWrapped = report(wrapped, (r) => `${r.el}|${r.options}|${r.rows}`, (r) => `${r.el} — ${r.options} options over ${r.rows} rows inside a ${r.radius} capsule`);

if (nContrast + nTargets + nClipped + nSquares + nBand + nLine + nWrapped + nPopovers) { console.log(`\nFAILED — ${nContrast} contrast, ${nTargets} target, ${nSquares} squashed-circle, ${nClipped} clipping, ${nBand} header-band, ${nLine} header-line, ${nWrapped} wrapped-capsule, ${nPopovers} picker-popover problem(s).`); process.exit(1); }  console.log('\nOK — every text and icon clears WCAG AA on the surface it sits on, every control\'s effective target is at least ' + MIN_TARGET + 'x' + MIN_TARGET + ', everything declared square renders square, no text is clipped by its own box, nothing paints a band across the header, the three things in the top row share one top edge, no segmented control has wrapped onto a second row, and every picker popover hangs from its own input and covers the hint line of its own field.');
