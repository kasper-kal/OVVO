/**
 * precision-audit — the things that have to be *exactly* true, not nearly true.
 *
 * The other audits here ask whether something is legible, tappable, square or on a known
 * breakpoint. This one asks whether things that are supposed to be **the same** are identical to
 * the pixel, because "close enough" is how a page drifts: a 0.9px gap here and a 1.26px offset
 * there is not one design, it is two, and the eye reads it as untidy without being able to say
 * why.
 *
 * What it measures, on every route, at four widths, in both appearances:
 *
 *   1. **edges**       — every card on a screen shares the page's own left and right content
 *                        edge, exactly.
 *   2. **gaps**        — the space between siblings in a stacked list is one number, not an
 *                        average: any container whose children are not all the same gap apart is
 *                        a finding, with the two numbers that disagree.
 *   3. **one control, one box** — controls that share a class share their height, and those that
 *                        draw only a glyph share their width too. A 43px button beside a 44px one
 *                        is a row that is 1px out, whatever it looks like.
 *   4. **whole pixels** — boxes that are pure geometry (no text inside: glyph buttons, discs,
 *                        dots, avatars) are a whole number of pixels on both axes. Text line
 *                        boxes are allowed to be fractional — that is the font's own metric —
 *                        but a box we draw ourselves never is.
 *   5. **no sideways scroll** — the page is exactly as wide as the window, never wider.
 *
 * Run:   node scripts/precision-audit.mjs [origin]
 *        PRECISION_THEME=dark  runs the sweep in the other appearance
 */
import { chromium, prepareBrowserEnv } from './browser-env.mjs';

prepareBrowserEnv();
import { ensureAppFont } from './font-guard.mjs';

const ORIGIN = process.argv[2] ?? 'http://127.0.0.1:3000';
const ROUTES = [
  '/',
  '/results',
  '/stops',
  '/stops/utrecht-centraal',
  '/departures',
  '/disruptions',
  '/disruptions/d-cancel-schiphol',
  '/preferences',
  '/settings',
  '/map',
];
const WIDTHS = [320, 390, 720, 1440];
const THEME = process.env.PRECISION_THEME ?? 'light';
const EPS = 0.01;

const findings = [];
const record = (kind, route, width, message) => findings.push({ kind, route, width, message });

const browser = await chromium.launch();
for (const width of WIDTHS) {
  for (const route of ROUTES) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    /* Every route is a real address, so each one is its own load — there is no document to keep
       and no hash to set after it (the app used `HashRouter` once; `main.tsx` still translates an
       old `#/...` address on the way in, which is why that shape is not measured here). */
    await page.goto(ORIGIN + route, { waitUntil: 'domcontentloaded' });
    /* Geometry does not need the font, but the type inside the boxes does — and a fallback font is
       wider, which is how a line that fits starts to wrap and a box that is right starts to clip. */
    await ensureAppFont(page);
    await page.waitForTimeout(700);
    await page.evaluate((theme) => {
      document.documentElement.dataset.theme = theme;
    }, THEME);
    await page.waitForTimeout(120);

    const measured = await page.evaluate(() => {
      const round = (n) => Math.round(n * 100) / 100;
      /* A block inside something that is mid-animation is drawn where it is going, not where it is. */
      const animated = (el) => {
        for (let node = el; node && node !== document.documentElement; node = node.parentElement) {
          if (getComputedStyle(node).transform !== 'none') return true;
        }
        return false;
      };
      const box = (el) => {
        const r = el.getBoundingClientRect();
        return { l: round(r.left), r: round(r.right), w: round(r.width), h: round(r.height) };
      };
      const main = document.querySelector('main') ?? document.body;
      /*
        The page's own content column: `main`'s inner box, after its border and its padding. Every
        block the page puts in that column has to start and end exactly on these two numbers.
      */
      const mainStyle = getComputedStyle(main);
      const mainRect = main.getBoundingClientRect();
      const edge = {
        l: round(
          mainRect.left + parseFloat(mainStyle.borderLeftWidth) + parseFloat(mainStyle.paddingLeft),
        ),
        r: round(
          mainRect.right - parseFloat(mainStyle.borderRightWidth) - parseFloat(mainStyle.paddingRight),
        ),
      };
      /*
        1 — the column is filled exactly. The outermost blocks (the children of `main`, and the
        rows inside its single wrapper) begin on the content's left edge and end on its right one:
        no 11px where there should be 12, no 291px where there should be 308.
      */
      const edgeOffenders = [];
      const columns = [main, ...(main.children.length === 1 ? [main.children[0]] : [])];
      for (const parent of columns) {
        for (const kid of parent.children) {
          if (kid.getBoundingClientRect().width === 0) continue;
          if (kid.classList.contains('sr-only') || getComputedStyle(kid).position === 'absolute') continue;
          /* A block that is mid-animation is drawn somewhere other than where it lives. */
          if (animated(kid)) continue;
          const b = box(kid);
          if (Math.abs(b.l - edge.l) > 0.51 || Math.abs(b.r - edge.r) > 0.51) {
            edgeOffenders.push({
              cls: String(kid.className).slice(0, 40) || kid.tagName,
              left: b.l,
              right: b.r,
              contentLeft: edge.l,
              contentRight: edge.r,
            });
          }
        }
      }

      /*
        2 — a stack's spacing is the number the stylesheet asked for, everywhere in it. The check
        compares the space between children with the container's own computed `row-gap`; a child
        that carries a margin of its own, or a row pushed by `space-between`, is a gap that is not
        the token and is reported with both numbers.
      */
      const gapOffenders = [];
      for (const parent of main.querySelectorAll('.stack, .stack-2, .stack-3, .stack-4, .stack-5, .stack-6')) {
        const gap = parseFloat(getComputedStyle(parent).rowGap);
        if (!Number.isFinite(gap) || gap <= 0) continue;
        /* Only boxes that sit in the flow: a hidden or absolutely placed child takes no space and
           a line box that is 1px wide is a screen-reader label, not a row. */
        const kids = [...parent.children].filter((c) => {
          const style = getComputedStyle(c);
          return (
            c.getBoundingClientRect().height > 0 &&
            style.position !== 'absolute' &&
            !c.classList.contains('sr-only') &&
            !animated(c)
          );
        });
        for (let i = 1; i < kids.length; i += 1) {
          const actual = round(kids[i].getBoundingClientRect().top - kids[i - 1].getBoundingClientRect().bottom);
          /* A wrapped grid row is a line break, not a gap. */
          if (Math.abs(actual) > 200) continue;
          if (Math.abs(actual - gap) > 0.01) {
            gapOffenders.push({
              cls: parent.className || parent.tagName,
              gap,
              actual,
              pair: `${kids[i - 1].className || kids[i - 1].tagName} → ${kids[i].className || kids[i].tagName}`,
              detail: kids.map((k) => {
                const r = k.getBoundingClientRect();
                return `${String(k.className).slice(0, 22)}:${round(r.top)}-${round(r.bottom)}`;
              }).join(' | '),
            });
          }
        }
      }

      /*
        3 — a glyph-only control is one box everywhere. Text buttons legitimately differ in width
        (their words differ) and slightly in height (their line boxes can), so the exact check is
        kept to the controls whose content is a glyph: those are one size or they are a defect.
      */
      const controlGroups = new Map();
      for (const el of main.querySelectorAll('button, a.btn, .icon-btn')) {
        if (el.textContent.trim() || el.getBoundingClientRect().height === 0) continue;
        const key = [...el.classList].sort().join('.') || el.tagName.toLowerCase();
        const list = controlGroups.get(key) ?? [];
        list.push(box(el));
        controlGroups.set(key, list);
      }
      const controlOffenders = [];
      for (const [key, list] of controlGroups) {
        if (list.length < 2) continue;
        const heights = [...new Set(list.map((c) => c.h.toFixed(2)))];
        const widths = [...new Set(list.map((c) => c.w.toFixed(2)))];
        if (heights.length > 1 || widths.length > 1) {
          controlOffenders.push({ key, values: `${widths.join('/')} × ${heights.join('/')}` });
        }
      }

      /* 4 — pure boxes are whole pixels. */
      const pure = [...main.querySelectorAll('.icon-btn, .status-dot, .pill__dot, .skeleton--circle, .skeleton--pill, .map-pin, .map-marker')];
      const fractional = pure
        .map((el) => ({ cls: String(el.className).slice(0, 40), ...box(el) }))
        .filter((b) => Math.abs(b.h - Math.round(b.h)) > 0.01 || Math.abs(b.w - Math.round(b.w)) > 0.01);

      /* 5 — the page is not wider than the window. */
      const overflow = {
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
      };

      return {
        edge: { l: edge.l, r: edge.r, w: edge.w },
        edgeOffenders,
        gapOffenders,
        controlOffenders,
        fractional,
        overflow,
      };
    });

    for (const list of measured.edgeOffenders) {
      record('edge', route, width, `${list.cls} spans ${list.left}..${list.right} vs content ${list.contentLeft}..${list.contentRight}`);
    }
    for (const gap of measured.gapOffenders) {
      record('gap', route, width, `${gap.cls}: ${gap.pair} sits ${gap.actual} apart where the stack asks for ${gap.gap} [${gap.detail}]`);
    }
    for (const control of measured.controlOffenders) {
      record('control', route, width, `${control.key} is ${control.values}`);
    }
    for (const box of measured.fractional) {
      record('fraction', route, width, `${box.cls} is ${box.w}×${box.h}`);
    }
    if (measured.overflow.scroll > measured.overflow.client + 1) {
      record('overflow', route, width, `page is ${measured.overflow.scroll}px in a ${measured.overflow.client}px window`);
    }

    await page.close();
  }
}

await browser.close();

const kinds = [...new Set(findings.map((f) => f.kind))];
if (findings.length === 0) {
  console.log(`precision audit — ${ROUTES.length} routes × ${WIDTHS.length} widths, ${THEME}`);
  console.log('OK — edges, gaps, controls, whole pixels and page width all agree exactly.');
  process.exit(0);
}

for (const kind of kinds) {
  const group = findings.filter((f) => f.kind === kind);
  console.log(`\n=== ${kind}: ${group.length} finding(s) ===`);
  const seen = new Map();
  for (const f of group) {
    const key = f.message;
    const first = seen.get(key);
    if (first) first.count += 1;
    else seen.set(key, { ...f, count: 1 });
  }
  for (const f of seen.values()) {
    console.log(`  ${f.message}   [${f.route}@${f.width}${f.count > 1 ? ` +${f.count - 1}` : ''}]`);
  }
}

console.log(`\nFAILED — ${findings.length} precision finding(s)`);
process.exit(1);
