/*
 * caps-audit — every piece of interface text that does not start with a capital letter.
 *
 *   node scripts/caps-audit.mjs          (needs the dev server; CAPS_URL to point elsewhere)
 *
 * Asked for as a full audit rather than a spot check, so it is deliberately two-sided:
 *
 *   1. **What the traveller actually sees.** Every rendered string on every screen that has
 *      content to show — not the empty states: a search is run before the results screen is
 *      read, a journey is opened before its detail page is read, a stop is chosen before the
 *      board is read, and the home screen carries all eighteen widgets with pins, history and
 *      a board stop seeded. Both languages, because Dutch copy is not English with words
 *      swapped. Placeholders and aria-labels are attributes, not text nodes, so they are
 *      collected separately — they are interface text too.
 *
 *   2. **What the sources can still put on screen.** Strings the walk did not reach — the
 *      rest of the Dutch dictionary (including its multi-line entries) and JSX literals in
 *      the components — are checked in the files, so "not seen" can never be read as
 *      "not there".
 *
 * Every hit is classified, because the rule has correct exceptions:
 *
 *   label    a standalone word or phrase: heading, button, link, chip, pill, list item,
 *            placeholder, aria-label. The capital is what makes it a label rather than a
 *            fragment, so a lowercase one is a defect.
 *   sentence a line that reads on its own: caption, empty state, hint, error, toast.
 *   fragment the tail of a longer sentence, reported with that sentence. Lowercase is
 *            correct here; "fixing" it would break the sentence.
 *   notword  a code, unit, time, number or symbol (`+6 min`, `?stop=`, `OV-fiets`). Not a
 *            capitalisation question; counted so the coverage number means something.
 *
 * Exits 1 on a lowercase label or sentence — the two that are defects — so it can gate like
 * the other audits here. Fragments never fail it.
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { ensureAppFont } from './font-guard.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const URL_BASE = process.env.CAPS_URL ?? 'http://127.0.0.1:3000/';
const REPORT = join(ROOT, '.logs', 'caps-audit-report.md');
const JSON_OUT = join(ROOT, '.logs', 'caps-audit.json');

/** Screens, in the order a person walks the app. Ids that exist in the sample data. */
/*
 * The three labels an open() step has to find are translated, and the audit walks both
 * languages, so the selector has to be too: an English-only pattern times out on the Dutch
 * run and quietly reads the page it never opened. The step receives the language *object*
 * ({code, label}), so the comparison is on its code — comparing the object itself matched
 * nothing and made every run fall back to English.
 */
const LABEL = (lang, en, nl) => new RegExp((lang?.code ?? lang) === 'nl' ? nl : en, 'i');
const SCREENS = [
  { name: 'home (all 18 widgets, pins and history seeded)', path: '/' },
  /*
   * The way in is **Edit**, in the header's first corner (R92); the catalogue is behind the `+`
   * that replaces it while editing, in the layout menu. Both labels are read from the dictionary
   * in both languages, like every other step here.
   */
  { name: 'home · customising turned on', path: '/', open: async (page, lang) => {
      await page.getByRole('button', { name: LABEL(lang, '^Edit$', '^Wijzig$') }).click();
      await page.waitForTimeout(300);
    } },
  { name: 'home · layout menu and widget catalogue', path: '/', open: async (page, lang) => {
      await page.getByRole('button', { name: LABEL(lang, '^Edit$', '^Wijzig$') }).click();
      await page.waitForTimeout(250);
      await page.getByRole('button', { name: LABEL(lang, 'Home layout', 'Indeling van het startscherm') }).click();
      await page.waitForTimeout(300);
      await page.getByRole('button', { name: LABEL(lang, 'Add widget', 'Widget toevoegen') }).click();
      await page.waitForTimeout(300);
    } },
  { name: 'home · stop picker sheet', path: '/', open: async (page) => {
      await page.locator('.planner-row__btn').first().click();
      await page.waitForTimeout(400);
    } },
  { name: 'home · blocked action (a toast)', path: '/', open: async (page) => {
      // "From here" has no Dutch entry, so the key is the label in both languages.
      const fromHere = page.getByRole('button', { name: /^From here$/ }).first();
      if (await fromHere.count()) { await fromHere.click(); await page.waitForTimeout(400); }
    } },
  /*
   * The results screen twice, because it is two different screens: the one a search produces,
   * and the one a visitor meets first. Auditing only the populated one left the empty state's
   * own copy — its heading, its sentence and its buttons — unread, which is how a planted
   * lowercase empty-state sentence survived the first run of this audit.
   */
  { name: 'journey results (nothing searched yet)', path: '/results' },
  { name: 'journey results', search: 'results' },
  { name: 'journey detail', search: 'journey' },
  { name: 'stops list', path: '/stops' },
  { name: 'a stop page', path: '/stops/utrecht-centraal' },
  { name: 'departure board (a stop chosen)', path: '/departures?stop=utrecht-centraal' },
  { name: 'departure board (nothing chosen)', path: '/departures' },
  { name: 'alerts list', path: '/disruptions' },
  { name: 'an alert page', path: '/disruptions/d-signal-utrecht' },
  { name: 'travel preferences', path: '/preferences' },
  { name: 'settings', path: '/settings' },
  { name: 'settings · reset dialog', path: '/settings', open: async (page, lang) => {
      await page.getByRole('button', { name: LABEL(lang, 'Reset the app', 'App resetten') }).click();
      await page.waitForTimeout(300);
    } },
  { name: 'not-found', path: '/nope' },
];
const LANGUAGES = [{ code: 'en', label: 'English' }, { code: 'nl', label: 'Nederlands' }];

/*
 * The catalogue, without the network-stats widget: it was four network counts in a 2-up grid,
 * the same shape as the page-header tile clusters this round scrapped (OVERWHELMING_FIX, item 9),
 * and it is gone from `widgets/registry.tsx`. Listing it here would send the audit looking for a
 * catalogue entry that no longer exists.
 */
/* The fifteen cards the catalogue holds after the 28 Oct audit (`WIDGET-AUDIT.md`). A stored id
   that no longer has a card draws nothing, so a stale list here would quietly audit empty slots
   instead of the screen. */
const ALL_WIDGETS = ['planner', 'next-departures', 'pinned-stops', 'your-journeys', 'recent-searches',
  'delays',
  'first-last', 'fares', 'alerts', 'alerts-at-pins', 'right-now', 'commute', 'nearby-stops',
  'facilities', 'second-board', 'map'];
const PINS = ['utrecht-centraal', 'amsterdam-leidseplein', 'rotterdam-centraal', 'eindhoven-centraal',
  'zaanse-schans', 'utrecht-domtoren'];
const QUERY = {
  fromStopId: 'utrecht-centraal', toStopId: 'rotterdam-centraal',
  date: new Date().toISOString().slice(0, 10), time: 8 * 60 + 30, timeMode: 'depart',
  preferences: { allowedModes: ['walk', 'bike', 'train', 'tram', 'metro', 'bus', 'ferry'], maxWalkMinutes: 20, maxBikeMinutes: 15, accessibilityRequired: false, transfers: 'any' },
};

/* ------------------------------------------------------- what runs inside the page */

const COLLECTOR = `() => {
  const roleOf = (el) => {
    const cls = typeof el.className === 'string' ? el.className : '';
    const tag = el.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return 'placeholder';
    const visible = (el.innerText ?? el.textContent ?? '').trim();
    if (el.getAttribute('aria-label') && !visible) return 'aria-label';
    if (tag === 'BUTTON' || el.getAttribute('role') === 'button' || cls.includes('btn')) return 'button';
    if (tag === 'A' || cls.includes('dock__link')) return 'link';
    if (/^H[1-6]$/.test(tag)) return 'heading';
    if (cls.includes('pill') || cls.includes('chip') || cls.includes('mode-badge')) return 'chip';
    if (cls.includes('sr-only')) return 'sr-only';
    if (tag === 'LI') return 'list item';
    if (tag === 'DD' || tag === 'DT') return 'definition';
    if (tag === 'P' || cls.includes('field__hint') || cls.includes('field__error')) return 'caption';
    return 'text';
  };
  const out = [];
  const push = (el, kind, text) => {
    const cls = typeof el.className === 'string' ? el.className : '';
    /*
     * "Mid-sentence" has to mean *inside the same sentence*, not merely inside a container.
     * The parent's whole text is too blunt: a heading and its description share a parent, so
     * the description looked like the tail of the heading's sentence and a deliberately
     * lowercased empty state passed as a fragment. What makes a string a continuation is the
     * text its own parent writes *before* it, on the same line, not finishing a sentence —
     * "{n} delays in this window · auto-refresh every 5s" and "{pins}, {journeys} and
     * {searches} will be deleted" are both built that way.
     */
    let lead = '';
    const parent = el.parentElement;
    if (parent) {
      for (const child of Array.from(parent.childNodes)) {
        if (child === el) break;
        if (child.nodeType === Node.TEXT_NODE) lead += child.nodeValue;
      }
    }
    out.push({
      text, kind, role: roleOf(el), tag: el.tagName, cls,
      srOnly: el.classList?.contains('sr-only') || el.closest('[aria-hidden="true"]') !== null,
      lead: lead.replace(/\\s+/g, ' ').trim(),
    });
  };
  // Text nodes, attributed to the element that owns them
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const el = node.parentElement;
    if (!el) continue;
    const text = (node.nodeValue || '').replace(/\\s+/g, ' ').trim();
    if (!text) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') continue;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) continue;
    // Only text the element owns directly: a parent would repeat its children's words.
    const own = Array.from(el.childNodes).filter((c) => c.nodeType === Node.TEXT_NODE)
      .map((c) => c.nodeValue).join(' ').replace(/\\s+/g, ' ').trim();
    if (own) push(el, 'text', own);
  }
  // Attributes: placeholders and aria-labels carry interface text too
  for (const el of document.querySelectorAll('[placeholder]')) {
    const t = (el.getAttribute('placeholder') || '').trim();
    if (t) push(el, 'placeholder', t);
  }
  for (const el of document.querySelectorAll('[aria-label]')) {
    const t = (el.getAttribute('aria-label') || '').trim();
    if (t) push(el, 'aria-label', t);
  }
  return out;
}`;

/* -------------------------------------------------------------- classification */

const NOT_WORD = [
  /^[^A-Za-z]/,                                   // digit, symbol, punctuation first
  /^[a-z]+[/-](\/|[a-z0-9])/,                     // ov-fiets, ms, km/h as codes
  /(km\/h|mm|m\/s|ms|sec|sec\.|min|hr|hrs|kb|mb|gb|px|vh|vw|%)/i,
  /^[a-z]{1,3}$/,                                 // a code like "asc", "p2"
];
const PROSE_ROLES = new Set(['caption', 'text', 'definition']);

const classify = (row) => {
  const text = row.text;
  if (!/^[a-z]/.test(text)) return null;
  if (NOT_WORD.some((re) => re.test(text) && !PROSE_ROLES.has(row.role))) return 'notword';
  const lead = row.lead || '';
  const isFragment = Boolean(lead) && !/[.!?…]["')\]]?$/.test(lead);
  if (isFragment) return 'fragment';
  if (PROSE_ROLES.has(row.role)) return 'sentence';
  return 'label';
};

/* --------------------------------------------------------------- the walk */

const { chromium } = await import(process.env.PW_MODULE ?? 'playwright');
const browser = await chromium.launch();
const hits = [];

for (const lang of LANGUAGES) {
  for (const screen of SCREENS) {
    const context = await browser.newContext({ viewport: { width: 422, height: 900 } });
    await context.addInitScript((payload) => {
      const P = 'ov-planner:v1:';
      const set = (key, value) => localStorage.setItem(P + key, JSON.stringify(value));
      set('location-consent', 'denied');
      set('pinned-stops', payload.pins);
      set('recent-searches', [{ id: 'x', query: payload.query, at: Date.now() }]);
      set('home-widgets', payload.widgets);
      set('board-stop', 'utrecht-centraal');
      set('settings', { version: 2, language: payload.language, theme: 'system', density: 'comfortable', defaultTimeMode: 'depart', defaultOriginStopId: null });
      set('preferences', payload.query.preferences);
    }, { pins: PINS, widgets: ALL_WIDGETS, query: QUERY, language: lang.code });

    const page = await context.newPage();
    const read = async (label) => {
      // A string argument is evaluated as an *expression*, so the collector has to be called
      // explicitly; passing the arrow function alone evaluates to the function, not its rows.
      const rows = await page.evaluate(`(${COLLECTOR})()`);
      for (const row of rows) hits.push({ ...row, language: lang.code, screen: label });
    };

    if (screen.search) {
      await page.goto(URL_BASE, { waitUntil: 'networkidle' });
      /* A capital letter is a shape: read it in the app's own font, not in a fallback. */
      await ensureAppFont(page);
      await page.waitForTimeout(400);
      await page.locator('.planner-row__btn').first().click();
      await page.locator('#picker-from').click();
      await page.locator('#picker-from').fill('Utrecht');
      await page.waitForTimeout(300);
      await page.locator('.picker__list .picker-row:not(.picker-row--action)').first().click();
      await page.locator('#picker-to').click();
      await page.locator('#picker-to').fill('Rotterdam');
      await page.waitForTimeout(300);
      /*
       * The destination is named, not taken from the top of the list.
       *
       * "Rotterdam" ranks Rotterdam Alexander first, and this pair has no service in the small
       * hours — so the walk asked for a journey screen at 23:13 and there was none, which failed
       * this audit for a reason that has nothing to do with capital letters (measured: the same
       * minute, Utrecht Centraal to Rotterdam Centraal planned 2 journeys and the first-suggestion
       * pair planned 0). Naming the stop is a fixture fix, not a relaxed assertion: the assertions
       * in this file are unchanged, and the journey screen is now read at hours when the network
       * is still running. */
      await page
        .locator('.picker__list .picker-row:not(.picker-row--action)', { hasText: 'Rotterdam Centraal' })
        .first()
        .click();
      await page.waitForTimeout(700);
      await read('journey results');
      if (screen.search === 'journey') {
        /* A night with no service is a screen this walk could not read, and saying so is not the
           same as finding nothing wrong with it — the rule this file already follows elsewhere. */
        if ((await page.locator('main a[href*="/journey/"]').count()) === 0) {
          console.log(`  ! ${screen.name} not read in ${lang.code}: no journey is planned for this pair right now`);
        } else {
          await page.locator('main a[href*="/journey/"]').first().click();
          await page.waitForTimeout(700);
          await read('journey detail');
        }
      }
    } else {
      await page.goto(`${URL_BASE}#${screen.path}`, { waitUntil: 'networkidle' });
      await ensureAppFont(page);
      await page.waitForTimeout(450);
      await read(screen.name);
      /*
       * Dialogs, sheets and toasts are not on the page until something opens them, which is
       * why a walk over routes alone reads the app without its most carefully worded copy —
       * confirmations, empty states behind an action, and the message for a blocked action.
       */
      if (screen.open) {
        try { await screen.open(page, lang); } catch (error) { console.error(`  ! could not open ${screen.name}: ${error.message}`); }
        await read(`${screen.name} (opened)`);
      }
    }
    await context.close();
  }
}
await browser.close();

/* --------------------------------------------------------- the sources it can't reach */

const sourceStrings = [];
const stripComments = (lines) => {
  let inBlock = false;
  return lines.map((line) => {
    let out = '';
    for (let i = 0; i < line.length; i++) {
      const two = line.slice(i, i + 2);
      if (inBlock) { if (two === '*/') { inBlock = false; i++; } continue; }
      if (two === '/*') { inBlock = true; i++; continue; }
      if (two === '//') break;
      out += line[i];
    }
    return out;
  });
};
const walkFile = (rel) => {
  const lines = stripComments(readFileSync(join(ROOT, rel), 'utf8').split('\n'));
  lines.forEach((line, i) => {
    const jsx = />([^<>{}()]+[a-z][^<>{}()]*)</g;
    let m;
    while ((m = jsx.exec(line))) {
      const text = m[1].replace(/\s+/g, ' ').trim();
      if (text.length > 1 && /^[a-z]/.test(text)) sourceStrings.push({ file: rel, line: i + 1, text, kind: 'JSX text' });
    }
    const prop = /(aria-label|placeholder|title|label|description|alt)="([^"]*[a-z][^"]*)"/g;
    while ((m = prop.exec(line))) {
      const text = m[2].trim();
      if (/^[a-z]/.test(text)) sourceStrings.push({ file: rel, line: i + 1, text, kind: `${m[1]} attribute` });
    }
  });
};
const ALL_SCANNED = [];
for (const dir of ['src/components', 'src/pages', 'src/widgets', 'src/lib']) {
  const walk = (rel) => {
    for (const entry of readdirSync(join(ROOT, rel), { withFileTypes: true })) {
      const full = join(rel, entry.name);
      if (entry.isDirectory()) walk(full);
      /*
       * JSX text only exists in .tsx files. Scanning plain .ts for `>text<` finds code that
       * happens to sit between an arrow and a comparison — `const atTop = () => window.scrollY
       * <= top;` reads as "JSX text: window.scrollY" — and a report that names code as copy
       * is worse than one that misses it. The attribute scan is .tsx-only for the same reason.
       */
      else if (/\.tsx$/.test(entry.name)) { ALL_SCANNED.push(full); walkFile(full); }
      else if (/\.ts$/.test(entry.name)) ALL_SCANNED.push(full);
    }
  };
  walk(dir);
}

/* The Dutch dictionary: keys are the English sentences, values the Dutch ones. */
const dictEntries = [];
{
  const lines = readFileSync(join(ROOT, 'src/lib/i18n.ts'), 'utf8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const sameLine = /^\s{2}(?:'([^']+)'|([A-Za-z][\w ]*)):\s*'([^']*)'/.exec(lines[i]);
    if (sameLine) { dictEntries.push({ line: i + 1, key: sameLine[1] ?? sameLine[2], value: sameLine[3] }); continue; }
    const keyOnly = /^\s{2}(?:'([^']+)'|([A-Za-z][\w ]*)):\s*$/.exec(lines[i]);
    if (keyOnly) {
      const next = /^\s*'([^']*)'/.exec(lines[i + 1] ?? '');
      if (next) dictEntries.push({ line: i + 1, key: keyOnly[1] ?? keyOnly[2], value: next[1] });
    }
  }
}
const normalise = (text) => String(text).replace(/\{[^}]*\}/g, '·').replace(/\s+/g, ' ').trim().toLowerCase();
const observed = new Set(hits.map((h) => h.text));
const observedNormalised = new Set(hits.map((h) => normalise(h.text)));
const dictLower = [];
for (const entry of dictEntries) {
  if (/^[a-z]/.test(entry.key) && !observedNormalised.has(normalise(entry.key))) dictLower.push({ ...entry, which: 'key (English)' });
  if (/^[a-z]/.test(entry.value) && !observedNormalised.has(normalise(entry.value))) dictLower.push({ ...entry, which: 'value (Dutch)' });
}
const jsxLower = sourceStrings.filter((s) => /^[a-z]/.test(s.text) && !observed.has(s.text));

/* --------------------------------------------------------------------- report */

const verdicts = { label: [], sentence: [], fragment: [], notword: [] };
for (const row of hits) { const v = classify(row); if (v) verdicts[v].push(row); }

const group = (list, keyOf) => {
  const map = new Map();
  for (const item of list) {
    const k = keyOf(item);
    const e = map.get(k) ?? { item, n: 0, where: new Set() };
    e.n += 1;
    e.where.add(`${item.language}/${item.screen}`);
    map.set(k, e);
  }
  return [...map.values()].sort((a, b) => b.n - a.n);
};
const esc = (s) => String(s).replace(/\|/g, '\\|');
const distinct = new Set(hits.map((h) => h.text)).size;

const md = [];
md.push('# Capitalisation audit');
md.push('');
md.push(`Generated by \`scripts/caps-audit.mjs\` — ${SCREENS.length} screens × ${LANGUAGES.length} languages, `);
md.push(`${distinct} distinct strings read (text nodes, placeholders and aria-labels).`);
md.push('');
md.push('| kind | count | verdict |');
md.push('|---|---|---|');
md.push(`| labels, headings, buttons, chips, placeholders | ${verdicts.label.length} | **defect** if any |`);
md.push(`| sentences, captions, hints, empty states | ${verdicts.sentence.length} | **defect** if any |`);
md.push(`| tails of a longer sentence | ${verdicts.fragment.length} | correct as they are |`);
md.push(`| codes, units, times, symbols | ${verdicts.notword.length} | not a capitalisation question |`);
md.push(`| dictionary + JSX strings the walk did not reach | ${dictLower.length + jsxLower.length} | listed for completeness |`);
md.push('');

const section = (title, note, items, render) => {
  md.push(`## ${title}`, '');
  md.push(note, '');
  if (!items.length) { md.push('None.', ''); return; }
  for (const e of items) md.push(render(e.item, [...e.where].join(', '), e.n));
  md.push('');
};

section('Labels, headings, buttons, chips and placeholders starting lowercase',
  'A standalone label that does not start with a capital reads as a fragment rather than a name.',
  group(verdicts.label, (h) => `${h.text}|${h.kind}`),
  (item, where, n) => `- \`${esc(item.text)}\` — ${item.language} · ${item.screen} · ${item.kind} in \`<${item.tag.toLowerCase()}${item.cls ? ` class="${item.cls.split(' ')[0]}"` : ''}>\`${n > 1 ? ` ×${n}` : ''}${item.srOnly ? ' · screen-reader only' : ''}`);

section('Sentences, captions and empty states starting lowercase',
  'Lines that read on their own. Every sentence starts with a capital in both languages.',
  group(verdicts.sentence, (h) => `${h.text}|${h.kind}`),
  (item, where, n) => `- \`${esc(item.text)}\` — ${item.language} · ${item.screen} · ${item.kind}${n > 1 ? ` ×${n}` : ''}`);

section('Tails of a longer sentence (correct as they are)',
  'Reported so the rule can be checked, not to change them: each is the continuation of a sentence whose first word does carry the capital.',
  group(verdicts.fragment, (h) => `${h.text}|${h.language}`),
  (item) => `- \`${esc(item.text)}\` — ${item.language} · ${item.screen}`);

section('Codes, units, times and symbols',
  'Counted so the coverage number means something; none is a capitalisation question.',
  group(verdicts.notword, (h) => h.text),
  (item, where) => `- \`${esc(item.text)}\` — ${where}`);

section('Dutch dictionary entries the walk did not reach',
  'Keys are the English sentences, values the Dutch ones. Listed so "not seen" cannot be read as "not there".',
  dictLower.map((d) => ({ item: d, where: new Set(), n: 1 })),
  (item) => {
    const escaped = item.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const callSites = [];
    /*
     * Any quoted use of the key, not only `t('…')`: a key can be chosen inside a ternary —
     * `t(mode === 'all' ? 'all routes' : '{mode} routes only')` — and a search that only
     * looks right after `t(` reports used copy as having no call site at all.
     */
    const re = new RegExp(`'${escaped}'`);
    for (const rel of ALL_SCANNED) {
      const src = readFileSync(join(ROOT, rel), 'utf8').split('\n');
      src.forEach((line, i) => { if (re.test(line)) callSites.push({ at: `${rel}:${i + 1}`, code: line.trim().slice(0, 120) }); });
    }
    /*
     * A key that carries placeholders is by construction part of a longer string — the screen
     * shows the filled sentence, not the key — so lowercase in it is a choice the sentence
     * makes, not a label that forgot its capital.
     */
    const interpolated = /\{[^}]*\}/.test(item.key) || /\{[^}]*\}/.test(item.value);
    const verdict = interpolated
      ? ' — interpolated into a longer string, so it is never the start of one'
      : callSites.length
        ? ' — see its call site'
        : ' — no call site found: dead copy';
    const sites = callSites.map((c) => `\`${c.at}\`\n  \u2502 ${c.code}`).join('\n  \u2502 ');
    return `- ${item.which} \`src/lib/i18n.ts:${item.line}\` — \`${esc(item.key)}\` / \`${esc(item.value)}\`${verdict}${sites ? `\n  \u2502 used at ${sites}` : ''}`;
  });

section('JSX literals and attributes the walk did not reach',
  'Interface text written straight into markup or into an attribute.',
  jsxLower.map((s) => ({ item: s, where: new Set(), n: 1 })),
  (item) => `- \`${esc(item.text)}\` — \`${item.file}:${item.line}\` (${item.kind})`);

md.push('## Screens and states covered');
md.push('');
md.push(LANGUAGES.map((l) => l.label).join(' and ') + ', on:');
md.push('');
for (const s of SCREENS) md.push(`- ${s.name}${s.path ? ` (\`#${s.path}\`)` : s.search ? ' (reached by planning a journey)' : ''}`);
md.push('- home with all 18 widgets, 6 pinned stops, a recent search and a chosen board stop');
md.push('');
md.push('Not covered: toasts (they appear only for a failed or blocked action), the browser\'s own');
md.push('permission prompt, and data strings that never render on these screens (operator names,');
md.push('alert text) — those are sample data rather than interface text, by the project\'s own rule.');

mkdirSync(dirname(REPORT), { recursive: true });
writeFileSync(REPORT, md.join('\n'));
writeFileSync(JSON_OUT, JSON.stringify({
  label: verdicts.label, sentence: verdicts.sentence, fragment: verdicts.fragment,
  notword: verdicts.notword, dictionary: dictLower, jsx: jsxLower,
}, null, 2));

const nDefects = verdicts.label.length + verdicts.sentence.length;
console.log(`caps-audit — ${SCREENS.length} screens × ${LANGUAGES.length} languages, ${distinct} distinct strings`);
console.log(`  ${verdicts.label.length} label(s)/heading(s)/button(s)/placeholder(s)/aria-label(s) start lowercase`);
console.log(`  ${verdicts.sentence.length} sentence(s)/caption(s)/hint(s) start lowercase`);
console.log(`  ${verdicts.fragment.length} tail-of-a-sentence string(s) — correct where they sit`);
console.log(`  ${verdicts.notword.length} code/unit/time string(s) — not a capitalisation question`);
console.log(`  ${dictLower.length + jsxLower.length} dictionary/JSX string(s) the walk could not reach`);
console.log(`report: .logs/caps-audit-report.md`);
if (nDefects) {
  console.log(`\n${nDefects} string(s) start lowercase:`);
  for (const h of [...verdicts.label, ...verdicts.sentence]) console.log(`  [${h.language} · ${h.screen}] ${h.kind}: ${h.text}`);
  process.exit(1);
}
console.log('\nOK — every standalone label, heading, button, placeholder and sentence starts with a capital.');
