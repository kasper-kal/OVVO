/**
 * **Two Plan buttons where one — and the choice — would do.**
 *
 * A stop offered as the end of a journey used to be answered by two controls side by side: *Plan
 * from here* and *Plan to here*. The app settled that question once, in one place: a stop gets
 * **one** Plan control, and it opens `PlanStopDialog` — "is this where you leave from, or where are
 * you going?". The stop page and the stop cards were changed; the departure board was not, and the
 * pair sat at the foot of every board through four rounds of audits, because nothing was looking for
 * it.
 *
 * This walks every screen and fails on any visible pair of sibling Plan controls — one that names a
 * "from" end and one that names a "to" end — outside a dialog. The two buttons **inside** the
 * dialog are the answer to the question and are exactly what this looks for the absence of, so a
 * dialog's own controls do not count.
 *
 * Run:   node scripts/plan-pair-audit.mjs [origin]
 * Needs: playwright + a dev server on :3000.
 */
import { chromium, prepareBrowserEnv } from './browser-env.mjs';

prepareBrowserEnv();
import { ensureAppFont } from './font-guard.mjs';

const ORIGIN = process.argv[2] ?? 'http://127.0.0.1:3000';

const ROUTES = [
  '/',
  '/stops',
  '/stops/haarlem',
  '/stops/utrecht-centraal',
  '/departures',
  '/departures?stop=utrecht-centraal',
  '/departures?line=sp-4000&stop=haarlem',
  '/map',
  '/map?stop=haarlem',
  '/disruptions',
  '/preferences',
  '/settings',
];

/** Every control on the screen that offers an end of a journey, with which end it names. */
const READ_PAIRS = () => {
  const FROM = /^plan (from|vanaf)/i;
  const TO = /^plan (to|naar)/i;
  const out = [];
  for (const el of document.querySelectorAll('main a, main button')) {
    if (el.closest('[role=dialog]')) continue;
    const box = el.getBoundingClientRect();
    if (box.width < 1 || box.height < 1) continue;
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') continue;
    const text = (el.textContent ?? '').trim();
    const end = FROM.test(text) ? 'from' : TO.test(text) ? 'to' : null;
    if (!end) continue;
    out.push({
      end,
      text,
      where: (() => {
        const chain = [];
        for (let node = el.parentElement; node && chain.length < 4; node = node.parentElement) {
          const cls = typeof node.className === 'string' ? node.className.trim().split(/\s+/)[0] : '';
          chain.push(node.tagName.toLowerCase() + (cls ? `.${cls}` : ''));
        }
        return chain.join(' < ');
      })(),
    });
  }
  return out;
};

const SETTINGS = {
  version: 8, theme: 'light', language: 'en', timeFormat: '24h', dateFormat: 'long',
  density: 'comfortable', highContrast: false, reduceMotion: true,
  selectionColor: 'coral', selectionCustom: '', selectionColorDark: 'coral', selectionCustomDark: '',
  background: 'cream', backgroundColour: '#FCFBFA', backgroundColourDark: '#FCFBFA',
  backgroundImage: '', backgroundImageSource: '', backgroundCrop: null, cardTreatment: 'solid',
  primaryColour: '', primaryColourDark: '', defaultTimeMode: 'depart', defaultOriginStopId: null,
};

const browser = await chromium.launch({
  chromiumSandbox: false,
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--hide-scrollbars'],
});
const findings = [];

for (const width of [390, 1440]) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
  await context.addInitScript(
    ([settings]) => {
      const P = 'ov-planner:v1:';
      const set = (key, value) => localStorage.setItem(P + key, JSON.stringify(value));
      set('settings', settings);
      set('location-consent', 'denied');
      set('favourites', ['haarlem']);
      set('pinned-stops', ['haarlem']);
      set('board-stop', 'utrecht-centraal');
      set('last-stop', 'haarlem');
      const today = new Date().toISOString().slice(0, 10);
      set('recent-searches', [
        { id: 'probe', at: Date.now(), query: { fromStopId: 'utrecht-centraal', toStopId: 'amsterdam-centraal', date: today, time: 600, timeMode: 'depart' } },
      ]);
    },
    [SETTINGS],
  );
  const page = await context.newPage();
  for (const route of ROUTES) {
    await page.goto(`${ORIGIN}${route}`, { waitUntil: 'domcontentloaded' });
    await ensureAppFont(page);
    await page.waitForTimeout(350);
    const controls = await page.evaluate(READ_PAIRS);
    const ends = new Set(controls.map((control) => control.end));
    if (ends.has('from') && ends.has('to')) {
      findings.push({ route, width, controls });
    }
  }
  await context.close();
}

await browser.close();

if (findings.length) {
  console.log(`\n=== two Plan buttons instead of one and a choice — ${findings.length} place(s)`);
  const seen = new Set();
  for (const finding of findings) {
    const key = `${finding.route} ${finding.controls.map((c) => c.text).join(' + ')}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const where = finding.controls[0].where;
    console.log(`  ${finding.route} @${finding.width} — ${finding.controls.map((c) => `“${c.text}”`).join(' + ')}\n      in ${where}`);
  }
  console.log('\nFAIL — one stop, one Plan control, and the dialog asks which end.');
  process.exit(1);
}

console.log('\nOK — no screen offers a stop with a pair of Plan buttons; one control asks the question.');
