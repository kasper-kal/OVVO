/**
 * **One command that looks at everything, and remembers what it saw.**
 *
 * `ui-audit` runs, passes, and the app still looks wrong — so this does not call it, trust it or
 * repeat its rules. It is a second, independent pair of eyes that asks questions the other
 * instruments never ask:
 *
 *   1. **near-miss alignment** — siblings of the same class whose left edge differs by between half
 *      a pixel and eight. That is the defect a person sees as "this one is off" and a screenshot
 *      cannot quantify: the third card is at 18px while the two above it are at 16px.
 *   2. **icon on its text's line** — an icon beside a word, where the two optical centres differ by
 *      more than 1.5px. This is the bug that made a walker read as sitting down.
 *   3. **nested corners** — a padded box with a radius, holding a child with its own radius, where
 *      `outer − padding ≠ inner`. The formula is the project's own; drift from it is visible as a
 *      corner that is tighter or looser than the surface it sits in.
 *   4. **effective tap area** — the real hit area, probed outward with `elementFromPoint`, so a
 *      target grown by a pseudo-element counts and a paint box does not. A link that is a word in a
 *      sentence (`.stop-link`) is exempt by `AGENTS.md` rule 8: it is sized by its line, and
 *      padding it would put a square over the words beside it.
 *   5. **clipped text** — words wider or taller than a box that hides overflow.
 *   6. **the page scrolling sideways**, and any **runtime error** thrown while it loads.
 *
 * Every finding is a measurement with numbers, fingerprinted into `audit/findings.jsonl` — a
 * tracked file — so a defect is reported once, and its fix is proven by re-running the same command.
 * If a run finds nothing new, it says so; if it finds something new, it exits 1.
 *
 *   node scripts/look.mjs --sample          # 3 themes × 2 languages × 2 widths × 3 screens
 *   node scripts/look.mjs --styles=tram     # one theme, the quick loop while working
 *   node scripts/look.mjs --from=0 --to=9   # a slice of all themes
 *   node scripts/look.mjs --full            # every theme × appearance × language × width × screen
 *   node scripts/look.mjs --report          # print the register, measure nothing
 *
 * **A run is not a proof the app is right.** It is a proof that these six rules hold in these
 * states, and the register records which states were looked at. What it cannot see: taste, whether
 * a colour is pleasant, whether a layout feels calm, whether the words are right. Those still need
 * a person — but a person should be *steering*, not finding a 2px offset for the fortieth time.
 */
import './browser-path.mjs';
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const ORIGIN = process.env.LOOK_ORIGIN ?? 'http://127.0.0.1:3000';
const REGISTER = 'audit/findings.jsonl';
const REPORT = 'audit/register.md';

/* ------------------------------------------------------------------ the matrix */

function themeIds() {
  const source = fs.readFileSync('src/lib/styles.ts', 'utf8');
  const start = source.indexOf('const ALL_STYLES');
  const body = start === -1 ? source : source.slice(start, source.indexOf('\n];', start));
  const retiredStart = source.indexOf('const RETIRED_STYLE_IDS');
  const retiredEnd = source.indexOf(']);', retiredStart);
  const retired = new Set(
    [...source.slice(retiredStart, retiredEnd).matchAll(/'([^']+)'/g)].map((found) => found[1]),
  );
  const ids = [...body.matchAll(/^\s{2,4}id: '([^']+)'/gm)]
    .map((m) => m[1])
    .filter((id) => !retired.has(id));
  if (ids.length === 0) throw new Error('could not read any theme id from src/lib/styles.ts');
  return ids;
}

/* Every screen the router can reach. The three-screen version of this list was the reason a whole
 * sweep could come back "clean" while fourteen screens were never opened at all. */
const ROUTES = [
  ['home', '/'],
  ['results', '/results'],
  ['stops', '/stops'],
  ['stop', '/stops/utrecht-centraal'],
  ['boards', '/departures'],
  ['alerts', '/disruptions'],
  ['alert', '/disruptions/demo-1'],
  ['settings', '/settings'],
  ['prefs', '/preferences'],
  ['themes', '/themes'],
  ['wrapped', '/wrapped'],
  ['map', '/map'],
  ['signin', '/signin'],
  ['notfound', '/no-such-screen'],
];
const WIDTHS = [320, 390, 720, 1440];
const APPEARANCES = ['light', 'dark'];
const LANGUAGES = ['en', 'nl'];
const SAMPLE_THEMES = ['tram', 'obsidian', 'navy-gold'];
const SAMPLE_WIDTHS = [390, 1440];

const args = process.argv.slice(2);
const reportOnly = args.includes('--report');
const full = args.includes('--full');
const explicit = args.find((a) => a.startsWith('--styles='))?.slice('--styles='.length);
const from = Number(args.find((a) => a.startsWith('--from='))?.slice(7) ?? 0);
const to = Number(args.find((a) => a.startsWith('--to='))?.slice(5) ?? Number.NaN);

const allThemes = themeIds();
const themes = explicit
  ? explicit.split(',').map((s) => s.trim()).filter(Boolean)
  : full || !Number.isNaN(to)
    ? allThemes.slice(from, (Number.isNaN(to) ? allThemes.length - 1 : to) + 1)
    : SAMPLE_THEMES.filter((id) => allThemes.includes(id));

const states = reportOnly
  ? []
  : themes.flatMap((styleId) =>
      (full ? APPEARANCES : ['light']).flatMap((appearance) =>
        LANGUAGES.flatMap((language) =>
          (full ? WIDTHS : SAMPLE_WIDTHS).flatMap((width) =>
            ROUTES.map(([name, route]) => ({
              styleId,
              appearance,
              language,
              width,
              name,
              route,
            })),
          ),
        ),
      ),
    );

const settingsFor = ({ styleId, appearance, language }) => ({
  version: 10,
  theme: appearance,
  language,
  timeFormat: '24h',
  dateFormat: 'long',
  density: 'comfortable',
  highContrast: false,
  reduceMotion: true,
  styleId,
  photoColourOnly: [],
  selectionColor: 'coral',
  selectionCustom: '',
  selectionColorDark: 'coral',
  selectionCustomDark: '',
  showDemoBadges: false,
});

/* ------------------------------------------------------------------ the measurement */

function measure() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const result = { overflowX: Math.max(0, document.scrollingElement.scrollWidth - vw), alignment: [], icons: [], corners: [], targets: [], clipped: [] };

  const hidden = (el) => {
    const cs = getComputedStyle(el);
    return cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0';
  };
  const skip = (el) => el.closest('.sr-only, .skip-link, [hidden], [aria-hidden="true"], .map, .review-layer');

  const all = [...document.querySelectorAll('body *')].filter((el) => !hidden(el) && !skip(el));

  for (const el of all) {
    const cs = getComputedStyle(el);
    const box = el.getBoundingClientRect();
    if (box.width <= 1 || box.height <= 1) continue;

    const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);

    /* 1. clipped text — but a line clamp is a **decision**, not a defect: `t-clamp-2` says "two
     * lines, then an ellipsis". Reporting it would teach everyone to ignore this list. */
    const clamped = cs.webkitLineClamp && cs.webkitLineClamp !== 'none';
    if (hasText && !clamped && cs.overflow === 'hidden' && (el.scrollWidth - el.clientWidth > 2 || el.scrollHeight - el.clientHeight > 2)) {
      result.clipped.push({ text: el.textContent.trim().replace(/\s+/g, ' ').slice(0, 40), cls: String(el.className).slice(0, 30) });
    }

    /* 2. nested corner arithmetic: outer − padding should equal inner */
    const radius = parseFloat(cs.borderTopLeftRadius) || 0;
    const pad = parseFloat(cs.paddingLeft) || 0;
    const child = el.firstElementChild;
    if (radius >= 12 && pad >= 8 && child && !hidden(child)) {
      const childBox = child.getBoundingClientRect();
      const inner = parseFloat(getComputedStyle(child).borderTopLeftRadius) || 0;
      const spans = childBox.width >= box.width - pad * 2 - 2;
      /* A circle — an avatar, a dot — is not a nested corner; `radius: 50%` never follows the
       * outer-minus-padding formula and never should. */
      const circular = inner >= Math.min(childBox.width, childBox.height) / 2 - 1;
      /* A click-anywhere stretch layer is laid over the row's padding on purpose, radius and all.
       * It is not a surface inside a surface, so the formula does not describe it. */
      const overlay = getComputedStyle(child).position === 'absolute';
      if (inner > 0 && !circular && !overlay && spans && Math.abs(radius - pad - inner) > 1.5) {
        result.corners.push({
          outer: Math.round(radius),
          pad: Math.round(pad),
          inner: Math.round(inner),
          cls: String(el.className).slice(0, 30),
        });
      }
    }

    /* 3. icon beside a word: optical centres should agree */
    if (el instanceof SVGElement || el.classList.contains('icon')) {
      const parent = el.parentElement;
      /* The word beside an icon is a text node in some places and a <span> in others; both are the
       * same line of type, so both are measured the same way. */
      let target = parent && [...parent.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
      if (!target) {
        const sibling = el.nextElementSibling ?? el.previousElementSibling;
        /* Inside a flex row a <span> computes as `block`, so "is it inline" is the wrong question.
         * "Is it one short line of type" is the right one — that is what shares a baseline. */
        if (sibling) {
          const sb = sibling.getBoundingClientRect();
          const size = parseFloat(getComputedStyle(sibling).fontSize) || 16;
          if (sibling.textContent.trim().length > 1 && sibling.textContent.trim().length <= 48 && sb.height > 0 && sb.height <= size * 2.2) target = sibling;
        }
      }
      if (target) {
        let tb;
        if (target.nodeType === 3) {
          const range = document.createRange();
          range.selectNodeContents(target);
          tb = range.getBoundingClientRect();
        } else {
          tb = target.getBoundingClientRect();
        }
        if (tb.height > 0) {
          /* Only a **pair**: the word has to be the one on the icon's own line — beside it
           * horizontally, sharing most of its height. Without this, a marker at the top of a map
           * and a label at the bottom are "6px apart on one axis" and 127px apart on the other. */
          const gap = Math.max(tb.left, box.left) - Math.min(tb.right, box.right);
          const overlap = Math.min(tb.bottom, box.bottom) - Math.max(tb.top, box.top);
          const beside = gap <= 14 && gap >= -4 && overlap >= box.height * 0.4;
          const d = Math.abs((box.top + box.bottom) / 2 - (tb.top + tb.bottom) / 2);
          if (beside && d > 1.5) result.icons.push({ off: Math.round(d * 10) / 10, word: target.textContent.trim().slice(0, 24) });
        }
      }
    }
  }

  /* 4. near-miss alignment between siblings of the same class */
  for (const parent of all) {
    const groups = new Map();
    for (const kid of parent.children) {
      if (hidden(kid) || skip(kid)) continue;
      const key = String(kid.className || kid.tagName);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(kid);
    }
    for (const [key, kids] of groups) {
      if (kids.length < 3) continue;
      /* Only a **stack** has one expected left edge. Three cards in a row sit at three different
       * lefts by design, so comparing them would flag every horizontal list on the site. */
      const boxes = kids.map((k) => k.getBoundingClientRect());
      let stacked = 0;
      let pairs = 0;
      for (let i = 0; i < boxes.length; i += 1) {
        for (let j = i + 1; j < boxes.length; j += 1) {
          pairs += 1;
          if (boxes[i].bottom <= boxes[j].top + 1 || boxes[j].bottom <= boxes[i].top + 1) stacked += 1;
        }
      }
      if (pairs === 0 || stacked / pairs < 0.8) continue;
      const lefts = boxes.map((b) => Math.round(b.left * 10) / 10);
      const counts = new Map();
      for (const l of lefts) counts.set(l, (counts.get(l) ?? 0) + 1);
      const [mode] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
      const odd = lefts.filter((l) => Math.abs(l - mode) > 0.5 && Math.abs(l - mode) < 8);
      if (odd.length) result.alignment.push({ cls: key.slice(0, 30), at: mode, off: [...new Set(odd.map((l) => Math.round((l - mode) * 10) / 10))].slice(0, 4) });
    }
  }

  /* 5. effective tap area, probed outward — 44px, with a word inside a sentence exempt */
  const hit = (el, x, y) => {
    const t = document.elementFromPoint(x, y);
    return !!t && (t === el || el.contains(t));
  };
  for (const el of document.querySelectorAll('button, a, select, [role="button"], input[type="checkbox"], input[type="radio"]')) {
    if (el.tagName === 'A' && el.classList.contains('stop-link')) continue;
    if (hidden(el) || skip(el)) continue;
    const b = el.getBoundingClientRect();
    if (b.width < 2 || b.height < 2) continue;
    if (b.bottom < 0 || b.top > vh) continue;
    if (b.width >= 44 && b.height >= 44) continue;
    const cx = b.left + b.width / 2;
    const cy = b.top + b.height / 2;
    const wide = hit(el, cx - 21.5, cy) && hit(el, cx + 21.5, cy);
    const tall = hit(el, cx, cy - 21.5) && hit(el, cx, cy + 21.5);
    if (!wide || !tall) {
      result.targets.push({
        name: (el.getAttribute('aria-label') || el.textContent.trim() || el.tagName).replace(/\s+/g, ' ').slice(0, 30),
        w: Math.round(b.width),
        h: Math.round(b.height),
        area: `${wide ? 'wide' : 'narrow'} ${tall ? 'tall' : 'short'}`,
      });
    }
  }

  return result;
}

/* ------------------------------------------------------------------ the register */

const readRegister = () =>
  fs.existsSync(REGISTER)
    ? fs
        .readFileSync(REGISTER, 'utf8')
        .split('\n')
        .filter(Boolean)
        .map((line) => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter(Boolean)
    : [];

const fingerprint = (f) => [f.kind, f.screen, f.styleId, f.appearance, f.width, f.language, f.detail].join('|');

function writeReport() {
  const open = readRegister();
  const byKind = new Map();
  for (const f of open) {
    if (!byKind.has(f.kind)) byKind.set(f.kind, []);
    byKind.get(f.kind).push(f);
  }
  const lines = [
    '# Visual defect register',
    '',
    'Written by `scripts/look.mjs`. Every line was measured in a real browser, not reported by a person.',
    '**Do not edit by hand.** Fix the defect and re-run the same command: a finding that is no longer',
    'reproduced stops appearing. A finding that is wanted gets `status: deliberate` and a reason.',
    '',
    `Open findings: **${open.length}** across ${byKind.size} kinds.`,
    '',
  ];
  for (const [kind, findings] of [...byKind.entries()].sort((a, b) => b[1].length - a[1].length)) {
    lines.push(`## ${kind} — ${findings.length}`, '');
    const seen = new Set();
    for (const f of findings) {
      const shape = `${f.screen} · ${f.styleId} · ${f.language} · ${f.width}px · ${f.detail}`;
      if (seen.has(shape)) continue;
      seen.add(shape);
      lines.push(`- ${shape}`);
    }
    lines.push('');
  }
  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  fs.writeFileSync(REPORT, lines.join('\n'));
}

if (reportOnly) {
  writeReport();
  console.log(fs.readFileSync(REPORT, 'utf8'));
  process.exit(0);
}

/* ------------------------------------------------------------------ does the instrument see?
 *
 * A detector that reports "clean" is only believable if it also reports dirt. This loads the home
 * screen, breaks one thing per rule on purpose, and fails loudly if any rule stays quiet. An audit
 * that cannot fail is decoration.
 */
if (args.includes('--selftest')) {
  const probe = await chromium.launch({ chromiumSandbox: false, args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'] });
  const tab = await probe.newPage({ viewport: { width: 390, height: 844 } });
  await tab.goto(ORIGIN + '/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await tab.waitForTimeout(700);
  const before = await tab.evaluate(measure);
  await tab.evaluate(() => {
    /* A fixture, not a hunt through the app: each rule is shown dirt of exactly the shape it claims
     * to detect. If a rule cannot see this, it could never see the real thing. */
    const fixture = document.createElement('div');
    fixture.id = 'look-selftest';
    fixture.style.cssText = 'position:fixed;left:0;top:0;width:260px;z-index:99999;opacity:0.02;background:#fff';
    fixture.innerHTML = `
      <div class="st-card">a</div>
      <div class="st-card" style="margin-left:2px">b</div>
      <div class="st-card">c</div>
      <div class="st-box" style="border-radius:20px;padding:12px"><div style="border-radius:2px;height:20px;background:#eee"></div></div>
      <button style="width:20px;height:18px;min-width:0;min-height:0"></button>
      <p style="max-width:40px;overflow:hidden;white-space:nowrap;margin:0">A sentence far too long for the box it is in</p>
      <div style="display:flex;align-items:flex-start"><svg width="16" height="16" style="transform:translateY(5px)"></svg><span>label</span></div>`;
    document.body.append(fixture);
  });
  await tab.waitForTimeout(300);
  const after = await tab.evaluate(measure);
  const beforeCount = { clipped: before.clipped.length, alignment: before.alignment.length, icons: before.icons.length, corners: before.corners.length, targets: before.targets.length };
  const afterCount = { clipped: after.clipped.length, alignment: after.alignment.length, icons: after.icons.length, corners: after.corners.length, targets: after.targets.length };
  const rules = [
    ['clipped', after.clipped.length > before.clipped.length],
    ['alignment', after.alignment.length > before.alignment.length],
    ['icons', after.icons.length > before.icons.length],
    ['corners', after.corners.length > before.corners.length],
    ['targets', after.targets.length > before.targets.length],
  ];
  for (const [name, fired] of rules) console.log(`${fired ? 'sees' : 'BLIND TO'}  ${name}  (${beforeCount[name]} → ${afterCount[name]})`);
  await probe.close();
  const blind = rules.filter(([, fired]) => !fired);
  console.log(blind.length === 0 ? '\nthe instrument sees all five rules fire' : `\n${blind.length} rule(s) never fired — the instrument is not trustworthy`);
  process.exit(blind.length === 0 ? 0 : 1);
}

/* ------------------------------------------------------------------ the sweep */

const known = new Set(readRegister().map(fingerprint));
const fresh = [];
const browser = await chromium.launch({
  chromiumSandbox: false,
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--hide-scrollbars'],
});

const started = Date.now();
let looked = 0;
const kinds = new Map();
const add = (state, kind, detail) => {
  const finding = { screen: state.name, route: state.route, styleId: state.styleId, appearance: state.appearance, language: state.language, width: state.width, kind, detail, at: new Date().toISOString().slice(0, 10), status: 'open' };
  kinds.set(kind, (kinds.get(kind) ?? 0) + 1);
  const key = fingerprint(finding);
  if (known.has(key)) return;
  known.add(key);
  fresh.push(finding);
};

/* One context per theme+language (settings live in storage), then widths and screens reuse it. */
for (const styleId of [...new Set(states.map((s) => s.styleId))]) {
  for (const language of [...new Set(states.map((s) => s.language))]) {
    const first = states.find((s) => s.styleId === styleId && s.language === language);
    if (!first) continue;
    const context = await browser.newContext({ viewport: { width: first.width, height: 900 }, deviceScaleFactor: 1 });
    await context.addInitScript((value) => {
      window.localStorage.setItem('ov-planner:v1:settings', JSON.stringify(value));
      window.localStorage.setItem('ov-planner:v1:location-consent', '"denied"');
    }, settingsFor(first));
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e.message).slice(0, 110)));

    for (const state of states.filter((s) => s.styleId === styleId && s.language === language)) {
      errors.length = 0;
      try {
        await page.setViewportSize({ width: state.width, height: state.width < 720 ? 844 : 900 });
        await page.goto(ORIGIN + state.route, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(400);
        const sheet = page.locator('[role=dialog] button, .overlay button').filter({ hasText: /^(not now|niet nu)$/i });
        if (await sheet.count()) await sheet.first().click({ timeout: 900 }).catch(() => {});
        await page.waitForTimeout(250);

        const data = await page.evaluate(measure);
        if (data.overflowX > 1) add(state, 'the page scrolls sideways', `${data.overflowX}px`);
        for (const c of data.clipped) add(state, 'text is cut off inside its box', `"${c.text}" .${c.cls}`);
        for (const a of data.alignment) add(state, 'siblings of one class do not line up', `.${a.cls} at ${a.at}, off ${a.off.join('/')}px`);
        for (const i of data.icons) add(state, 'an icon is off its text line', `${i.off}px beside "${i.word}"`);
        for (const c of data.corners) add(state, 'a nested corner does not use the formula', `.${c.cls} ${c.outer}−${c.pad}≠${c.inner}`);
        for (const t of data.targets) add(state, 'a control has no 44px tap area', `${t.name} ${t.w}x${t.h} ${t.area}`);
        for (const e of new Set(errors)) add(state, 'a runtime error was thrown', e);

        looked += 1;
        const found = data.clipped.length + data.alignment.length + data.icons.length + data.corners.length + data.targets.length + errors.length;
        console.log(
          `${String(looked).padStart(3)} ${state.styleId.padEnd(12)} ${state.name.padEnd(6)} ${String(state.width).padStart(4)} ${state.language}` +
            (found ? ` · clip ${data.clipped.length} align ${data.alignment.length} icon ${data.icons.length} corner ${data.corners.length} target ${data.targets.length} err ${errors.length}` : ' · clean'),
        );
      } catch (error) {
        console.log(`${state.styleId.padEnd(12)} ${state.name.padEnd(6)} ${String(state.width).padStart(4)} FAILED ${String(error).slice(0, 60)}`);
      }
    }
    await context.close();
  }
}

await browser.close();

if (fresh.length > 0) {
  fs.mkdirSync(path.dirname(REGISTER), { recursive: true });
  fs.appendFileSync(REGISTER, fresh.map((f) => JSON.stringify(f)).join('\n') + '\n');
}
writeReport();

console.log(
  `\nlooked at ${looked} screens in ${Math.round((Date.now() - started) / 1000)}s · ${themes.length} theme(s) · ${states.length} states` +
    `\n${fresh.length} new finding(s), ${readRegister().length} in the register → ${REPORT}`,
);
process.exit(fresh.length > 0 ? 1 : 0);
