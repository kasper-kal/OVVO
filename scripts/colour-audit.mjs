#!/usr/bin/env node
/*
 * **Every colour a traveller can choose, measured — not just the one the app ships with.**
 *
 * The Colours screen offers a page colour, a widget colour and a selection colour, each appearance
 * keeping its own, plus a raised-contrast switch. Those settings re-derive every ink and every
 * surface from one hex (`lib/background`), so the number of *combinations* the app can draw is far
 * larger than the number of stylesheets — and the contrast check, which ran in the default palette,
 * had only ever seen one of them. That is how a coral page in the dark appearance came to paint a
 * light pink chip and put cream glyphs on it at **2.54:1**: nothing in the repository measured a
 * palette nobody had chosen yet.
 *
 * This walks a set of palettes — the default, a vivid one, a pale one, a dark one, a widget-only
 * one, a split one, and raised contrast — in both appearances, through `scripts/ui-audit.mjs`,
 * which is the same measurement every screen already gets. Nothing here re-implements contrast; if
 * a palette fails, the failure is the audit's own, with its own numbers.
 *
 *   npm run check:colours                    (a built app served on 4180, or pass an origin)
 *   node scripts/colour-audit.mjs http://127.0.0.1:4180
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepareBrowserEnv } from './browser-env.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = (process.argv.find((arg) => arg.startsWith('http')) ?? process.env.COLOUR_URL ?? 'http://127.0.0.1:4180').replace(/\/$/, '');

/*
 * The routes a palette is measured on. Not every screen: a palette is a set of surfaces, and these
 * are the ones that carry all of them — a card, a board row, a chip row, a sheet's chrome, the
 * drawing, a result list. Six screens per palette keeps the sweep to a couple of minutes; the whole
 * app in one palette is what `npm run verify`'s own ui-audit does.
 */
const ROUTES = '/,/stops,/departures,/disruptions,/settings,/map,/results';

const PALETTES = [
  { label: 'default', env: {} },
  { label: 'page coral', env: { BACKGROUND: 'colour', COLOUR: '#ff375f' } },
  { label: 'page pale blue', env: { BACKGROUND: 'colour', COLOUR: '#dfe8f2' } },
  { label: 'page navy', env: { BACKGROUND: 'colour', COLOUR: '#123456' } },
  { label: 'widgets coral', env: { PRIMARY: '#ff375f' } },
  { label: 'widgets green', env: { PRIMARY: '#1b6b3a' } },
  { label: 'split navy + coral', env: { BACKGROUND: 'colour', COLOUR: '#123456', PRIMARY: '#ff375f' } },
  { label: 'raised contrast', env: { HIGH_CONTRAST: '1' } },
];

/* Before any child starts, so every one of them inherits the browser's libraries. */
prepareBrowserEnv();

const run = (palette, appearance) =>
  new Promise((resolve) => {
    const env = {
      ...process.env,
      UI_AUDIT_THEME: appearance,
      UI_AUDIT_WIDTHS: '390',
      UI_AUDIT_ROUTES: ROUTES,
      UI_AUDIT_BACKGROUND: palette.env.BACKGROUND ?? 'cream',
      UI_AUDIT_COLOUR: palette.env.COLOUR ?? '',
      UI_AUDIT_BACKGROUND_DARK: palette.env.COLOUR ?? '',
      UI_AUDIT_PRIMARY: palette.env.PRIMARY ?? '',
      UI_AUDIT_HIGH_CONTRAST: palette.env.HIGH_CONTRAST ?? '0',
    };
    const child = spawn(process.execPath, [path.join(ROOT, 'scripts/ui-audit.mjs'), ORIGIN], {
      cwd: ROOT,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    child.stdout.on('data', (chunk) => (output += chunk));
    child.stderr.on('data', (chunk) => (output += chunk));
    child.on('close', (code) => resolve({ code, output }));
  });

const failures = [];
let index = 0;

async function worker() {
  for (;;) {
    const job = index;
    index += 1;
    const palette = PALETTES[Math.floor(job / 2)];
    if (!palette) return;
    const appearance = job % 2 === 0 ? 'light' : 'dark';
    const label = `${palette.label} (${appearance})`;
    const { code, output } = await run(palette, appearance);
    const lines = output
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('x ') || line.startsWith('FAIL'));
    if (code === 0) console.log(`ok    ${label}`);
    else {
      failures.push({ label, lines });
      console.log(`FAIL  ${label}`);
      for (const line of lines.slice(0, 8)) console.log(`        ${line}`);
    }
  }
}

console.log(`colour audit — ${PALETTES.length} palettes x 2 appearances, ${ORIGIN}\n`);
await Promise.all([0, 1, 2, 3].map(worker));

console.log(
  failures.length === 0
    ? '\ncolours: every palette clears every check'
    : `\ncolours: ${failures.map((failure) => failure.label).join(', ')} failed`,
);
process.exit(failures.length === 0 ? 0 : 1);
