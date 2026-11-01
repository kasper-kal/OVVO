/**
 * Build the "OVVO on a real account" setup guide as a PDF.
 *
 * This is the document the steerer follows by hand in the Cloudflare and Firebase dashboards, so it
 * is written in his words: what to click, where it lives, what to copy, and what never goes into a
 * chat. The page is served from `public/` through the running dev server so the real faces load,
 * then printed with Chromium, exactly like the theme list.
 *
 * **Cloudflare comes first on purpose.** The workers.dev address is needed by Firebase before
 * Firebase can allow it, and an earlier version asked for that address in part 5 and only explained
 * where it comes from in part 6 — a box he could not fill without scrolling past the answer. Now the
 * account and the address are part 1, and everything Firebase does with it comes after.
 *
 * Nothing in here is generated from the app: it documents dashboards, not code.
 */
import { readFile, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const fontsCss = await readFile(path.join(ROOT, 'src/styles/fonts.css'), 'utf8');

/* ------------------------------------------------------------------ pieces */

const step = (number, title, body) => `
  <section class="step">
    <div class="step__num">${number}</div>
    <div class="step__body">
      <h3>${title}</h3>
      ${body}
    </div>
  </section>`;

/* The label and the sentence are the only two flex children: the sentence goes inside one <em>, so
   a bold word or a <code> span in the middle of it cannot become a column of its own. Without the
   wrapper, "You do not need to create a Google OAuth client" printed as four ragged columns. */
const said = (text) => `<em>${text}</em>`;
const where = (text) => `<p class="where"><span>Where</span>${said(text)}</p>`;
const copyIt = (text) => `<p class="copy"><span>Copy this</span>${said(text)}</p>`;
const warn = (text) => `<p class="warn"><span>Careful</span>${said(text)}</p>`;

const part = (number, title, lede, body) => `
  <section class="part">
    <header class="part__head">
      <span class="part__kicker">Part ${number}</span>
      <h2>${title}</h2>
      ${lede ? `<p class="part__lede">${lede}</p>` : ''}
    </header>
    ${body}
  </section>`;

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<title>OVVO on a real account</title>
<style>
${fontsCss}
@page { size: A4; margin: 15mm 14mm 17mm; }
* { box-sizing: border-box; }
html, body { margin: 0; }
body {
  font-family: 'Inter', system-ui, sans-serif;
  color: #18181b;
  background: #fff;
  font-size: 9.6pt;
  line-height: 1.5;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
p { margin: 0 0 2.4mm; }
h2 { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 17pt; line-height: 1.12; letter-spacing: -0.02em; margin: 0 0 1.6mm; }
h3 { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 11pt; line-height: 1.2; margin: 0 0 1.6mm; }

.cover { display: flex; flex-direction: column; min-height: 250mm; page-break-after: always; }
.cover__mark { display: grid; grid-template-columns: repeat(2, 12mm); gap: 1.3mm; margin-bottom: 12mm; }
.cover__mark span { height: 12mm; background: #18181b; color: #fff; display: grid; place-items: center; font-weight: 800; font-size: 13.5pt; letter-spacing: 0.02em; }
.cover h1 { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 36pt; line-height: 1.03; letter-spacing: -0.03em; margin: 0 0 4.5mm; }
.cover p.lede { font-size: 11.1pt; color: #4a4a50; max-width: 138mm; margin: 0 0 8mm; }
.cover__facts { display: flex; gap: 14mm; margin-bottom: 8mm; }
.cover__fact b { display: block; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 17pt; font-weight: 700; line-height: 1.1; }
.cover__fact span { font-size: 8.1pt; text-transform: uppercase; letter-spacing: 0.08em; color: #66666d; }
.cover__list { list-style: none; margin: 0; padding: 0; border-top: 0.4mm solid #18181b; }
.cover__list li { display: flex; gap: 4mm; padding: 1.5mm 0; border-bottom: 0.2mm solid #e8e3d8; font-size: 8.7pt; }
.cover__list i { font-style: normal; font-family: 'IBM Plex Mono', monospace; font-size: 7.8pt; color: #8a8a90; width: 8mm; flex: none; }
.cover__note { margin-top: auto; border-top: 0.3mm solid #cdc7b8; padding-top: 3mm; font-size: 8pt; color: #66666d; }

.part { page-break-inside: avoid; margin: 0 0 7mm; padding-top: 1mm; }
.part__head { border-top: 0.8mm solid #18181b; padding-top: 3mm; margin-bottom: 4mm; }
.part__kicker { font-size: 7.4pt; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #8a8a90; }
.part__lede { color: #55555c; margin: 0; max-width: 150mm; }

.step { display: flex; gap: 4mm; padding: 2.6mm 0; border-bottom: 0.2mm solid #ece7dc; page-break-inside: avoid; }
.step:last-child { border-bottom: 0; }
.step__num { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 10.5pt; color: #18181b; width: 6mm; flex: none; }
.step__body { flex: 1; min-width: 0; }
.step__body p:last-child { margin-bottom: 0; }

.where, .copy, .warn { display: flex; gap: 2.6mm; align-items: baseline; font-size: 8.9pt; margin: 1.6mm 0 0; }
.where span, .copy span, .warn span {
  flex: none; width: 21mm; font-size: 6.9pt; font-weight: 700; letter-spacing: 0.09em; text-transform: uppercase;
  color: #66666d;
}
.where em, .copy em, .warn em { font-style: normal; flex: 1; min-width: 0; }
.where { color: #3f3f45; }
.copy { color: #18181b; }
.copy span { color: #2e6b3f; }
.warn { color: #18181b; }
.warn span { color: #8a3a2e; }
.copy code, .where code, .warn code { font-family: 'IBM Plex Mono', monospace; font-size: 8.2pt; background: #f4f1e9; border: 0.2mm solid #e4dfd1; border-radius: 1mm; padding: 0.2mm 1mm; }

.big { font-family: 'IBM Plex Mono', monospace; font-size: 10px; background: #f4f1e9; border: 0.2mm solid #e4dfd1; border-radius: 2mm; padding: 2.4mm 3mm; margin: 1.6mm 0 0; }

.form { border: 0.4mm solid #18181b; border-radius: 3mm; padding: 4mm 4.5mm; margin-top: 3mm; page-break-inside: avoid; }
.form h3 { margin-bottom: 1mm; }
.form p { color: #55555c; margin-bottom: 2.5mm; }
.paste { font-family: 'IBM Plex Mono', monospace; font-size: 8pt; line-height: 1.8; background: #f7f5ee; border: 0.2mm solid #e4dfd1; border-radius: 2mm; padding: 3mm 3.5mm; white-space: pre; margin-top: 2mm; }

.check { list-style: none; margin: 0; padding: 0; }
.check li { display: flex; gap: 3mm; padding: 1.5mm 0; border-bottom: 0.2mm solid #ece7dc; font-size: 9pt; }
.check li::before { content: ''; width: 3.4mm; height: 3.4mm; border: 0.35mm solid #18181b; border-radius: 0.8mm; flex: none; margin-top: 0.7mm; }

.err { border-left: 0.9mm solid #18181b; padding: 1mm 0 1mm 3mm; margin: 0 0 3mm; page-break-inside: avoid; }
.err b { display: block; font-family: 'IBM Plex Mono', monospace; font-size: 8.4pt; }
.err span { color: #55555c; }
.colophon { margin-top: 6mm; border-top: 0.3mm solid #cdc7b8; padding-top: 3mm; font-size: 7.8pt; color: #66666d; display: flex; justify-content: space-between; }
</style></head>
<body>

<div class="cover">
  <div class="cover__mark"><span>OV</span><span>VO</span></div>
  <h1>Getting OVVO<br />onto a real account.</h1>
  <p class="lede">Everything I need from you, in the order you need it. Cloudflare first, because it gives you the address Firebase has to be told about. Firebase second, because it needs that address. Nothing here costs money and nothing needs a card.</p>
  <div class="cover__facts">
    <div class="cover__fact"><b>11</b><span>parts</span></div>
    <div class="cover__fact"><b>30 min</b><span>of your time</span></div>
    <div class="cover__fact"><b>2</b><span>free accounts</span></div>
  </div>
  <ul class="cover__list">
    <li><i>1</i><span>Make a Cloudflare account and claim your workers.dev address. First, because everything else asks for it.</span></li>
    <li><i>2</i><span>Copy the account ID and make one scoped token, the only secret in this guide.</span></li>
    <li><i>3</i><span>Make a Firebase project, so a traveller can sign in with an email or a Google account.</span></li>
    <li><i>4</i><span>Register the web app and copy six public values, which is all I need from Firebase.</span></li>
    <li><i>5</i><span>Turn on email and password sign-in.</span></li>
    <li><i>6</i><span>Turn on Google sign-in and publish the consent screen, so strangers are allowed in.</span></li>
    <li><i>7</i><span>Allow the address from part 1 to start a sign-in.</span></li>
    <li><i>8</i><span>Send me the values in one paste, and put the one secret where secrets go.</span></li>
    <li><i>9</i><span>Check it works before I build on it.</span></li>
    <li><i>10</i><span>The failures this setup actually produces, and what fixes each one.</span></li>
    <li><i>11</i><span>What happens after that, and what I promise about your year.</span></li>
  </ul>
  <div class="cover__note">OVVO · setup guide · written for the steerer, not for the code</div>
</div>

${part(
  1,
  'Claim your address on Cloudflare',
  'This is first because two later parts ask for your workers.dev address, and you cannot type an address into Firebase before it exists. Ten minutes here and every later part has its value ready. No card, and nothing to pay.',
  step(
    '1.1',
    'Make the account',
    `${where('https://dash.cloudflare.com/sign-up — an email and a password is all it asks for.')}
     <p>Confirm the email they send you, then sign in to the dashboard.</p>`,
  ) +
    step(
      '1.2',
      'Find your subdomain',
      `${where('In the left sidebar, click <b>Workers &amp; Pages</b>. On the right of that page, in a panel headed with your account name, there is a line called <b>Your subdomain</b> with a <b>Change</b> link beside it.')}
       <p>If you have never used Cloudflare, it will say you need to choose one. Click <b>Change</b>, type a name you are happy to see in public — <b>yourname</b> is good — and save it.</p>
       ${warn('A subdomain can be changed later, but that changes the address, and the address is what Firebase is told to trust. Pick it once, now, and leave it.')}`,
    ) +
    step(
      '1.3',
      'Write down your address',
      `<p>Our app on Cloudflare is called <b>ovvo</b>, and a Cloudflare app's public address is its name in front of your subdomain. So yours will be:</p>
       <div class="big">https://ovvo.<i>your-subdomain</i>.workers.dev</div>
       <p>If you choose the subdomain <code>ovvo</code>, the address becomes <code>https://ovvo.ovvo.workers.dev</code>. That is correct, just ugly. Choosing your own name avoids it.</p>
       ${copyIt('Write the whole address down where you can find it in part 7. Nothing needs to be deployed for the address to be yours.')}`,
    ) +
    step(
      '1.4',
      'Copy the account ID',
      `${where('The same panel on <b>Workers &amp; Pages</b> shows <b>Account ID</b> with a copy icon: a long string of letters and numbers.')}
       ${copyIt('The account ID is <b>not</b> a secret. It goes in the paste in part 8.')}`,
    ),
)}

${part(
  2,
  'Make the deploy token',
  'One token, three permissions, and the only secret in the whole guide. It lets me put the site and the database up without you having to run anything.',
  step(
    '2.1',
    'Find the token page',
    `${where('Click your profile icon, top right, then <b>Profile</b>, then <b>API tokens</b> in the left menu. On the newer dashboard it is <b>Manage Account</b> → <b>Account API tokens</b>.')}
     <p>Click <b>Create Token</b>, then at the bottom of the template list click <b>Create Custom Token</b>, and name it <b>OVVO deploy</b>.</p>`,
  ) +
    step(
      '2.2',
      'Give it exactly three permissions',
      `<p>Under <b>Permissions</b>, add these three rows one at a time, each with <b>Account</b> as the scope and your account chosen under <b>Include</b>:</p>
       <p><b>Workers Scripts → Edit</b>, then <b>D1 → Edit</b>, then <b>Account Settings → Read</b>.</p>
       <p>Those three cover the whole of what I need: the site itself, the database that will hold the year, and the account details that tie them together. You do not run any commands at any point, and you never need to open a terminal.</p>
       ${warn('The ready-made "Edit Cloudflare Workers" template does <b>not</b> include D1. If you pick it, the deploy fails later with a permission error that looks unrelated, so build the custom token instead.')}`,
    ) +
    step(
      '2.3',
      'Copy it once, and put it where secrets go',
      `<p>Click <b>Continue to summary</b>, then <b>Create Token</b>. The value is shown <b>once</b> and starts with <code>cfut_</code>.</p>
       <p>Paste it into this project under <b>Settings → Secrets</b>, as a secret named <code>CLOUDFLARE_API_TOKEN</code>. Add <code>CLOUDFLARE_ACCOUNT_ID</code> there too, with the account ID from part 1.</p>
       ${warn('Never paste the token into a chat message, a document, a screenshot or a code file. If it lands somewhere it should not, delete it in the token list and make a new one; nothing is lost by that.')}`,
    ),
)}

${part(
  3,
  'Make the Firebase project',
  'Firebase is Google\'s sign-in service. The free plan is permanent, needs no card, and covers far more travellers than this site will ever have. One project serves development, the preview and the live site.',
  step(
    '3.1',
    'Sign in to the Firebase console',
    `${where('https://console.firebase.google.com — sign in with the Google account you want to own OVVO. Not a work or school account: those can be closed by an administrator and take the project with them.')}`,
  ) +
    step(
      '3.2',
      'Create the project',
      `<p>Click <b>Create a project</b>, or <b>Add project</b> at the top.</p>
       <p>Type a name. <b>OVVO</b> is fine; the name is only what you see in the console.</p>
       ${copyIt('Click the pencil beside the auto-generated <b>project ID</b> and set it to something clean, for example <code>ovvo-app</code>. It appears in a public web address later and <b>cannot be changed afterwards</b>.')}`,
    ) +
    step(
      '3.3',
      'Turn Analytics off',
      `<p>The next screen offers Google Analytics. It is optional and we do not use it, so switch it <b>off</b>.</p>
       <p>Accept the terms if asked, click <b>Create project</b>, wait, then <b>Continue</b>.</p>
       ${warn('Do not click anything offering to "upgrade" the project. The paid platform changes the free limits from generous to three thousand people a day.')}`,
    ),
)}

${part(
  4,
  'Register the web app and copy six values',
  'The only thing I need out of Firebase. All six are public by design: they name the project, they do not unlock it, and Firebase says so in its own documentation.',
  step(
    '4.1',
    'Add a web app',
    `<p>On the project overview page, click the <b>web</b> icon (a small screen with a bracket, labelled <code>&lt;/&gt;</code>).</p>
     <p>Give it a nickname, for example <b>OVVO web</b>. Leave the Firebase Hosting checkbox <b>unticked</b>: we are not using their hosting.</p>
     <p>Click <b>Register app</b>.</p>`,
  ) +
    step(
    '4.2',
    'Copy the config block',
    `<p>The next screen shows a block beginning <code>const firebaseConfig = {</code>. Copy it into a note, or leave the tab open.</p>
     ${copyIt('The six values I need: <code>apiKey</code>, <code>authDomain</code>, <code>projectId</code>, <code>storageBucket</code>, <code>messagingSenderId</code> and <code>appId</code>.')}`,
  ) +
    step(
    '4.3',
    'If you lose it, it is always here',
    `${where('Gear icon → <b>Project settings</b> → <b>General</b> tab → scroll to <b>Your apps</b> → your web app → <b>SDK setup and configuration</b> → <b>Config</b>. The same block, at any time, forever.')}`,
  ) +
    step(
    '4.4',
    'Two of the values do double duty',
    `<p><code>projectId</code> is also on that General tab, in the top pane, labelled <b>Project ID</b>.</p>
     <p><code>authDomain</code> is normally <code>your-project-id.firebaseapp.com</code>. Keep it exactly as Firebase gave it. Changing it to your own address breaks Google sign-in until extra Google Cloud setup is done, and we do not need that trade.</p>`,
  ),
)}

${part(
  5,
  'Turn on email and password',
  'The sign-in that works with nothing but an address and a password, and the one that has to work on a new phone after a forgotten password.',
  step(
    '5.1',
    'Open Authentication',
    `${where('Left sidebar → <b>Security</b> → <b>Authentication</b>. Some consoles show <b>Build</b> → <b>Authentication</b>. It is the item called Authentication either way.')}`,
  ) +
    step(
    '5.2',
    'Enable the provider',
    `<p>Open the <b>Sign-in method</b> tab. In the provider list click <b>Email/Password</b>, turn its toggle on, then click <b>Save</b>.</p>
     <p>Leave <b>Email link (passwordless sign-in)</b> off for now.</p>`,
  ) +
    step(
    '5.3',
    'Do not add anything else',
    `<p>Ignore phone, anonymous and the rest. Every provider you switch on is another way in and another thing to keep right.</p>
     <p>Firebase sends its own password reset and verification emails on the free plan, so no email service and no domain are needed for that.</p>`,
  ),
)}

${part(
  6,
  'Turn on Google sign-in',
  'One tap with the Google account already on the phone. This part has the most hidden steps, so it has the most detail.',
  step(
    '6.1',
    'Enable the provider',
    `<p>Still in <b>Authentication</b> → <b>Sign-in method</b>, click <b>Google</b> and turn its toggle on.</p>
     <p>It asks for a <b>project public-facing name</b> (type <b>OVVO</b>) and a <b>support email</b> (pick yours).</p>
     <p>Click <b>Save</b>.</p>
     ${copyIt('You do <b>not</b> need to create a Google OAuth client. Firebase keeps its own for you, which is why part 4 says to leave <code>authDomain</code> alone.')}`,
  ) +
    step(
    '6.2',
    'Set up the consent screen once',
    `${where('https://console.cloud.google.com — the same project is there under the name you gave it. Open the menu and choose <b>Google Auth platform</b>. If it says it is not configured yet, click <b>Get Started</b>.')}`,
  ) +
    step(
    '6.3',
    'Fill in the four things it asks for',
    `<p><b>App name:</b> OVVO. <b>User support email:</b> your address. Click <b>Next</b>.</p>
     <p><b>Audience:</b> choose <b>External</b>. That sounds public, and it is: anyone with a Google account, not only people inside an organisation. Click <b>Next</b>.</p>
     <p><b>Contact information:</b> your address again. Click <b>Next</b>.</p>
     <p>Tick the box agreeing to the user data policy, click <b>Continue</b>, then <b>Create</b>.</p>`,
  ) +
    step(
    '6.4',
    'Publish it',
    `<p>On the <b>Audience</b> page you will see <b>Publishing status: Testing</b>. Click <b>Publish app</b> and confirm.</p>
     <p>While it says Testing, only a hundred named test accounts can sign in and their sign-ins expire after seven days.</p>
     ${warn('Publishing with only the basic profile and email scopes does <b>not</b> need Google\'s review, so it works immediately. Only the name and logo on the consent screen may lag, which is cosmetic.')}`,
  ),
)}

${part(
  7,
  'Allow your address to start a sign-in',
  'Firebase refuses to begin a sign-in from an address it does not know, even a perfectly good one. The address you need is the one you wrote down in part 1.3.',
  step(
    '7.1',
    'Find the list',
    `${where('<b>Authentication</b> → <b>Settings</b> tab → scroll to <b>Authorized domains</b>. It is the Settings tab, not the Sign-in method tab; older guides get this wrong.')}`,
  ) +
    step(
    '7.2',
    'Add your address',
    `<p>Click <b>Add domain</b> and type the host name only: no <code>https://</code> in front, no slash at the end, no path.</p>
     ${copyIt('From part 1.3, <code>ovvo.your-subdomain.workers.dev</code> goes in the box. If your address is <code>https://ovvo.ovvo.workers.dev</code>, you type <code>ovvo.ovvo.workers.dev</code>.')}
     <p>If the address I deploy to ever turns out to differ from this one, I tell you, and you change this single line. Nothing else in Firebase has to change.</p>`,
  ) +
    step(
    '7.3',
    'Add localhost',
    `<p>Click <b>Add domain</b> again and add <code>localhost</code>, on its own.</p>
     <p>Projects made after April 2025 no longer include it, and without it nothing works on your own machine while I am building.</p>`,
  ) +
    step(
    '7.4',
    'Leave the two Firebase addresses alone',
    `<p>You will see <code>your-project-id.firebaseapp.com</code> and <code>your-project-id.web.app</code> already listed. Do not remove them: the sign-in window travels through them even when it opens from our address.</p>`,
  ),
)}

${part(
  8,
  'What to send me',
  'One message, one paste block. Your address comes first, because it is what I need to start building. Everything below is safe to send.',
  `<div class="form">
     <h3>Copy this, fill it in, send it</h3>
     <p>Leave a line blank if you have not done that part yet. I will tell you what is missing rather than guessing.</p>
     <div class="paste">workers.dev address (part 1.3):

Cloudflare account ID (part 1.4):

Cloudflare token saved in Secrets?  yes / no

Firebase project ID:

Firebase apiKey:

Firebase authDomain:

Firebase storageBucket:

Firebase messagingSenderId:

Firebase appId:

Email + password turned on?         yes / no

Google turned on?                   yes / no

Consent screen published?           yes / no

Address added to Firebase?          yes / no</div>
   </div>
   ${warn('The Cloudflare token does not go in this block. It lives only in Settings → Secrets, and I can see that it is there without ever seeing its value.')}`,
)}

${part(
  9,
  'Check it before I build on it',
  'Five minutes now saves a confusing afternoon later. Do these once the paste is sent; I will run the same checks from my side.',
  `<ul class="check">
     <li>On Cloudflare, <b>Workers &amp; Pages</b> shows your subdomain, and it matches the address you sent.</li>
     <li>The token exists in the token list and is called OVVO deploy.</li>
     <li>Under this project's Settings → Secrets, both names appear with a value set.</li>
     <li>In <b>Authentication → Sign-in method</b>, Email/Password and Google both show as Enabled.</li>
     <li>In <b>Authentication → Settings → Authorized domains</b>, your address and <code>localhost</code> are both listed.</li>
     <li>In the Google console, <b>Google Auth platform → Audience</b> says <b>In production</b>, not Testing.</li>
     <li>The address you typed into Firebase is character for character the one on the first line of your paste.</li>
     <li>In Firebase, <b>Project settings → General</b> still shows your web app and the config block opens.</li>
   </ul>
   <p style="margin-top:3mm">Then, once I have the first version up, the real test is four actions on your own phone: sign in with an email and password, sign out, sign in with Google, and confirm the year on screen is still the same year.</p>`,
)}

${part(
  10,
  'If something goes wrong',
  'These are the failures this setup actually produces, what they look like, and what fixes them. None of them is a broken build.',
  `<div class="err"><b>auth/unauthorized-domain</b><span>The sign-in refuses to start and names the address. Part 7 was skipped, or the address was typed with <code>https://</code> in front of it. Add the bare host name.</span></div>
   <div class="err"><b>Error 400: origin_mismatch</b><span>The Google window opens and then blocks. That one belongs to a Google OAuth client, which we deliberately do not use. It appears only if <code>authDomain</code> was changed in the Firebase config; put back the <code>firebaseapp.com</code> value from part 4.</span></div>
   <div class="err"><b>The popup opens and closes, or the browser blocks it</b><span>Google sign-in from a site that is not hosted by Firebase has to use the popup, and some browsers are strict about it. A second click usually works; if it never does, I add a small proxy in the worker so the redirect route works too.</span></div>
   <div class="err"><b>A reset email never arrives</b><span>On the free plan the mail comes from a <code>firebaseapp.com</code> address and spam filters are wary of it. Check spam before assuming the setup is wrong. If it becomes a habit, the fix is a mail domain, the one thing in this plan that costs money.</span></div>
   <div class="err"><b>Your workers.dev page errors for the first minute</b><span>Cloudflare's own documentation says a brand-new workers.dev address can throw 523 errors for about a minute after the first deploy. Wait and reload; it is not a bad deploy.</span></div>`,
)}

${part(
  11,
  'After that',
  'So you know what you are waiting for, and what I will not do with any of it.',
  `<p><b>What I build next.</b> The site and a small API on Cloudflare, a database table for the year, the dated tally underneath the Wrapped, and an account card in Settings rather than in the top row. The whole app keeps working signed out.</p>
   <p><b>What the database holds.</b> Dated events: a journey planned, a board opened, a stop hearted, a theme worn. They belong to an account and nobody else can read them, because every query is filtered by the signed-in account on the server.</p>
   <p><b>What it never holds.</b> Your name, your email, your location, your password. Firebase keeps the account; the database keeps the year and only the identifier Firebase gives it.</p>
   <p><b>The controls that go with it.</b> One to forget a year, one to delete everything the account holds, and a plain sentence in Settings saying what leaves the device.</p>
   <p><b>The honest limit.</b> A year can only be counted from the day the tally starts. The first December will be a short year, and the card will say so rather than dressing up three journeys as a life.</p>
   <div class="colophon"><span>OVVO · setup guide</span><span>Written for the steerer</span></div>`,
)}

</body></html>`;

await writeFile(path.join(ROOT, 'public/__firebase-guide.html'), html, 'utf8');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1000, height: 1400 } });
const errors = [];
page.on('pageerror', (error) => errors.push(String(error)));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});

await page.goto('http://127.0.0.1:3000/__firebase-guide.html', { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(800);

const loaded = await page.evaluate(() =>
  [...document.fonts].filter((face) => face.status === 'loaded').map((face) => face.family),
);
console.log('fonts loaded:', [...new Set(loaded)].sort().join(', ') || 'none');
if (errors.length) console.log('page errors:', errors.slice(0, 4).join(' | '));

/* A step taller than one printed page gets cut in half by the printer, and a cover taller than the
   page pushes its own colophon onto a page of its own. Measure both at the printed width (A4 less
   the 15mm and 17mm margins, and the 14mm sides) before anything is printed. */
await page.emulateMedia({ media: 'print' });
await page.setViewportSize({ width: 688, height: 1055 });
await page.waitForTimeout(400);

const tall = await page.evaluate(() => {
  const limit = 1000;
  return [...document.querySelectorAll('.part, .step, .form, .err')]
    .map((node) => [node.className, Math.round(node.getBoundingClientRect().height)])
    .filter(([, height]) => height > limit);
});
console.log('blocks taller than a page:', tall.length ? JSON.stringify(tall) : 'none');

const coverOverflow = await page.evaluate(() => {
  const cover = document.querySelector('.cover');
  return cover ? Math.round(cover.scrollHeight - cover.clientHeight) : 0;
});
console.log('cover overflow (px):', coverOverflow);

const parts = await page.locator('.part').count();
const steps = await page.locator('.step').count();
const coverLines = await page.locator('.cover__list li').count();
console.log('parts:', parts, '| steps:', steps, '| cover lines:', coverLines);

await page.pdf({
  path: path.join(ROOT, 'OVVO-firebase-setup.pdf'),
  format: 'A4',
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: '<div></div>',
  footerTemplate:
    '<div style="width:100%;font:7.5pt Inter,sans-serif;color:#8a8a90;padding:0 14mm;display:flex;justify-content:space-between;"><span>OVVO · setup guide</span><span class="pageNumber"></span></div>',
  margin: { top: '15mm', bottom: '17mm', left: '14mm', right: '14mm' },
});

await browser.close();
if (!process.env.GUIDE_KEEP_HTML) await unlink(path.join(ROOT, 'public/__firebase-guide.html'));
console.log('pdf written: OVVO-firebase-setup.pdf');
