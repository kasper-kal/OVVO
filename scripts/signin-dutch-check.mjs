/**
 * **Does the sign-in screen actually speak Dutch?**
 *
 * The dictionary is keyed by the English sentence, so a key that does not match its call site
 * silently falls back to English: the build stays green and the screen stays English. The only
 * honest check is to choose Dutch in Settings, open the screen and read what a traveller reads.
 *
 * Usage: node scripts/signin-dutch-check.mjs [base]
 */
import { chromium } from 'playwright';

const base = process.argv[2] ?? 'http://127.0.0.1:3000';

/*
 * Labels are drawn in capitals by CSS, so what a traveller reads is UPPERCASE while the sentence in
 * the dictionary is not. Compare in one case: this check is about the language, not the capitals.
 */
const WANT = ['Inloggen', 'Doorgaan met Google', 'E-mailadres', 'Terug naar OVVO', 'Nieuw bij OVVO?'];
const ALSO = ['Wachtwoord', 'Wachtwoord vergeten?'];
const SHUN = [
  'Sync your stops and journeys across your devices.',
  'Continue with Google',
  'Forgot password?',
  'Use a sign-in link instead',
  'Back to OVVO',
];
const has = (text, word) => text.toUpperCase().includes(word.toUpperCase());

const browser = await chromium.launch({
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

let failures = 0;
const say = (ok, line) => {
  if (!ok) failures += 1;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${line}`);
};

try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.addInitScript(() => {
    /* Playwright is not an old browser; the compatibility notice must not colour this check. */
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  await page.goto(`${base}/settings`, { waitUntil: 'networkidle' });
  /*
   * Settings may open a question over itself ("Use your location?"). It is not what this check is
   * about, and a dialog that swallows the click would read as a Dutch failure when it is not one.
   */
  const dialog = page.locator('[role="dialog"]');
  if (await dialog.count()) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    if (await dialog.count()) await page.getByRole('button', { name: /not now|later|cancel|no/i }).first().click().catch(() => {});
    await page.waitForTimeout(200);
  }

  await page.getByText('Nederlands', { exact: true }).first().click();
  await page.waitForTimeout(300);

  const chosen = await page.evaluate(() => document.documentElement.lang);
  say(chosen === 'nl', `the interface says its language is nl (got ${JSON.stringify(chosen)})`);

  await page.goto(`${base}/signin`, { waitUntil: 'networkidle' });
  await page.waitForSelector('main');
  const text = await page.evaluate(() => document.body.innerText);

  for (const word of WANT) say(has(text, word), `the sign-in screen says "${word}"`);
  for (const word of SHUN) say(!has(text, word), `it no longer says "${word}"`);

  /*
   * The password field and its "forgot password?" only appear in password mode, so the screen is
   * asked for them rather than assumed to be showing them.
   */
  await page.getByText('Liever een wachtwoord', { exact: false }).first().click();
  await page.waitForTimeout(200);
  const passwordMode = await page.evaluate(() => document.body.innerText);
  for (const word of ALSO) say(has(passwordMode, word), `with a password it says "${word}"`);

  /* The heading is the screen's first line: proof the page is Dutch before anything else. */
  const heading = await page.evaluate(() => document.querySelector('h1')?.textContent?.trim() ?? '');
  say(heading === 'Inloggen', `the heading is "Inloggen" (got ${JSON.stringify(heading)})`);
} finally {
  await browser.close();
}

console.log(failures === 0 ? '\nsign-in Dutch: clean' : `\nsign-in Dutch: ${failures} failing`);
process.exit(failures === 0 ? 0 : 1);
