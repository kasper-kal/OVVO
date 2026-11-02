# Going live — the record

Every decision and every fact that matters for putting OVVO on a real account goes in this
file. It is the one place to look, so that a choice made in a chat three weeks ago is not
lost. Add to it; do not rewrite history. If something changes, change the line and add the
date.

Last updated: 1 November 2026.

## What we are building

The OVVO site that travellers already use, but on a real account: people can sign in, their
saved journeys and their year follow them to another phone, and nothing is lost when a
browser is cleared.

The steerer is not a programmer and does not want to click through half a dashboard to make
this work. So the setup is a one-off tutorial (see "The tutorial") and every value it produces
is pasted into this project's secrets, not typed into code.

## The shape we chose

- **Cloudflare Workers for the site, the API and the database.** One deploy holds all three,
  it never sleeps, it does not pause for inactivity, and the free plan does not expire.
- **D1 for the database.** It lives inside the same Cloudflare account, so there is no second
  signup and no monthly bill.
- **Firebase Authentication for sign-in.** Google's sign-in service. Cardless and permanently
  free at our size. It sends its own password reset and sign-in link mail from
  `firebaseapp.com`; that shared sender is why those mails land in spam, and fixing it needs a
  domain (see "Why the sign-in mail lands in spam" below). Google sign-in and a password need no
  mail at all, and both work today.
- **No custom domain.** Never. The free address Cloudflare gives us is the address.
- **No card anywhere.** Every service must have a permanently free plan. A free plan with
  limits is fine; a free trial that ends is not.

## Accounts and names

| Thing | Value | Notes |
| --- | --- | --- |
| Cloudflare account | made by the steerer | Account ID still to come — see "Still missing" |
| Cloudflare subdomain | `vibecreations` | The steerer's choice, 1 November 2026. Workers sit under it |
| Cloudflare Worker name | `ovvo` | Decides the first part of the public address |
| Public address | `ovvo.vibecreations.workers.dev` | Worker name, then the subdomain |
| Firebase project ID | `ovvo-vibecreations` | Cannot be changed once made |
| Firebase project name | `OVVO` | Display only |
| Firebase sign-in domain | `ovvo-vibecreations.firebaseapp.com` | Leave `authDomain` exactly as given |
| Token name | `OVVO deploy` | Display only |

Rule of thumb, after the subdomain was settled: **`OVVO`** is the name a person sees,
**`ovvo`** is the short name in front of the address, and **`ovvo-vibecreations`** survives
only as the Firebase project ID, because that one has to be unique across all of Google.

## Sign-in

Turned on in Firebase: **Google**, **Email/Password**, and **Email link (passwordless sign-in)**.

All three are the steerer's decision, taken 1 November 2026. More providers can be added at
any time — clicking Done in the console locks nothing, and existing accounts keep working.

**The Google consent screen is already done.** Found on 1 November 2026 to be in production
already, user type External, no test users, no sign-ins yet. So the whole "set up the consent
screen" part of the tutorial is behind us: there is no Get Started button to look for, and
nothing needs publishing. The "0 users / 100 user cap" on that page does not apply to ordinary
Google sign-in, because we ask only for name and email.

Two consequences to keep in mind when the sign-in screens are built, so they do not surprise
anyone later:

- **Email link needs a page of our own to finish.** The mail contains a link back to the site;
  that page has to read the link and complete the sign-in. Email and password needs no such
  page.
- **Same address, different method.** If someone signs up with a password and later presses
  "Sign in with Google" with the same address, Firebase refuses and says the address already
  belongs to another method. Fixable with account linking; deal with it when it appears.

Some providers cost money and stay off for that reason: Apple needs a paid Apple Developer
account, and phone sign-in costs per message.

## Passkeys (2 November 2026)

Asked for by the steerer: passkeys as a way to sign in, as a second key on an existing account, and
as a way to make a new account with no email and no password.

**Firebase does not offer passkeys on the web.** Its passkey code is written but unreleased and
switched on per project by Google, so there is nothing to switch on in the console and nothing to
call from the page. So OVVO checks passkeys itself: the browser makes the key and shows the face,
fingerprint or PIN, and the Worker checks the signed answer against the public key it stored. The
account is still a Firebase account, so everything that already worked keeps working.

What that needs, and it is the only new thing:

- **Tables `passkey` and `passkey_challenge`** in D1. The public half of each key, the device
  label, the counter, and the five-minute questions. No secret is stored there: the public key
  cannot sign anything.
- **One Worker secret, `FIREBASE_SERVICE_ACCOUNT`.** Firebase will not accept our word for who
  somebody is; it wants a token signed with the project's service account key. Steps below. Until
  that secret is set, `/api/passkey/status` answers `available: false` and the sign-in screen hides
  every passkey button, so nothing offers a door that does not open.
- **The service account key is the most powerful key the project has.** It stays in Worker secrets,
it is never committed, never pasted in chat, and it can be rotated (a new key, a new secret, and
the old key deleted in the console). If it ever leaks, rotate it the same day.

How the three flows work:

- **A new account with a passkey.** Name, then the passkey. No email, so no mail, so nothing to
  land in a spam folder. The account id is made by the Worker.
- **Adding a passkey to an existing account.** Settings, OVVO ID card, **Generate a new Passkey**.
  Five devices at most; each is labelled with the platform it was made on.
- **A new phone.** Sign in with a passkey; the system offers the key it already syncs through
  iCloud or Google, or shows a code for the old phone to approve. That part is the phone's own
  work and needs nothing from us. Then **Generate a new Passkey** on the new phone, so the next
  sign-in is the short way again.

Limits worth naming now:

- **A passkey belongs to the address it was made on.** `ovvo.vibecreations.workers.dev` is the
  address today. Moving to another address means every passkey made before the move stops working,
  and everybody signs in the old way once more.
- **A passkey-only account has no recovery.** If every device holding it is lost and nothing was
  synced, the account cannot be opened. The card says so whenever there is only one passkey.
- **A passkey made before the switch is kept.** The sign-in step is the only part that needs
  the key, so a key already on a device starts working the moment `FIREBASE_SERVICE_ACCOUNT` is
  set, and the card shows it instead of claiming there is none.
- **Tested with a simulated key, not a phone.** Chrome's virtual authenticator made a key, signed
  in with it, and the minted token's signature was checked against the matching public key
  (`.logs/passkey-check.cjs`, all nine checks pass). Firebase itself refused the stand-in token, as
  it must, so the last step can only be proven by the steerer on a real phone.

### Turning passkeys on

1. Firebase console, project `ovvo-vibecreations`, gear, **Project settings**, **Service accounts**.
2. **Generate new private key**. A JSON file downloads. It is the key; do not leave it in a
   downloads folder.
3. In this project, with the file to hand:
   `npx wrangler secret put FIREBASE_SERVICE_ACCOUNT < service-account.json`
4. Delete the downloaded file once the secret is set. `/api/passkey/status` should then answer
   `{"available":true,"max":5}`.

## Why the sign-in mail lands in spam

Asked 2 November 2026. Answer first: the mail is not sent by us and not from our address.
Firebase sends the sign-in link and the password reset itself, from
`noreply@ovvo-vibecreations.firebaseapp.com`. `firebaseapp.com` is Google's and is shared by
every Firebase project in the world, including a great many phishing pages. Gmail cannot check
that the mail came from OVVO, because we own no domain and publish no SPF, DKIM or DMARC record
for one, and Firebase will not sign the mail as us. So the mail is judged on the reputation of a
shared sender, and it loses. Google's own issue tracker has this filed for authentication mail
from `firebaseapp.com` (issuetracker.google.com/issues/253291461).

The routes that would fix it, and what each costs:

| Route | What it gives | What it needs |
| --- | --- | --- |
| Firebase custom email domain (Authentication, Templates, edit, *customize domain*) | From `noreply@<our domain>`, action links on that domain, with the TXT and CNAME records Firebase supplies | A domain we own. The records themselves are free |
| Firebase custom SMTP (a sender such as Postmark or Resend) | The mail leaves through that service, which authenticates it | A domain, and the paid Identity Platform upgrade, which needs a card |
| Mail sent by our own Worker through a sending service | OVVO writes the templates and owns the sender | A domain and an API key. Free at our size, still no card |

**Every route needs a domain**, which the decisions above rule out. Until that changes, some of
this mail will land in spam and no wording in the templates changes it: the sender is what Gmail
is judging. We cannot test a mailbox from the build machine either, so this is documented rather
than measured.

What is true without a domain: **Google sign-in and email with a password need no mail** and are
unaffected. Email link sign-in is the one path that depends on the mail arriving.

## Secrets and values

**There is no Settings → Secrets screen** in the steerer's client. He said so on 1 November 2026,
and he was right; that instruction was mine and it was wrong.

They go in **`.env`** in the project root, which `.gitignore` now excludes. `.env` is a note to
the build on this machine, and **Cloudflare never reads it**: the Firebase values reach the site
by being baked into the built code, and the token never reaches the site at all.

Expected names:

- `CLOUDFLARE_API_TOKEN` — a custom token with three permissions: Workers Scripts Edit,
  D1 Edit, Account Settings Read. Not the ready-made "Edit Cloudflare Workers" template; it
  has no D1.
- `CLOUDFLARE_ACCOUNT_ID`
- Firebase web config: `apiKey`, `authDomain`, `projectId`, `storageBucket`,
  `messagingSenderId`, `appId`.

The Firebase values are public by design — they ship in the page. The Cloudflare token is not;
it can deploy and delete code, so it never leaves the secrets store.

## Still missing from the steerer

- The Cloudflare **account ID** (part 1.4 of the tutorial).
- The **six Firebase values** (part 4 of the tutorial).
- The Cloudflare token, pasted into Settings → Secrets, never into chat.
- **The Firebase service account key for passkeys** — see "Turning passkeys on" above. Until it
  arrives, passkeys stay switched off and the site says so by hiding them.

## The tutorial

`OVVO-firebase-setup.pdf` in this project: fifteen pages, eleven parts, one screen at a time,
written for someone who has never opened either dashboard. It is built from
`scripts/make-firebase-guide.mjs`; do not hand-edit the PDF.

Order matters and is deliberate: **Cloudflare first, then Firebase**, because Firebase asks for
the site's address and it does not exist until the Cloudflare side is named.

## Follow-ups owed once the values arrive

- Verify the token works before using it: a bad token looks exactly like a bad permission.
- Deploy the Worker and open the address before promising the steerer it works.
- Test sign-in on a second device, and with storage cleared, before saying the year survives.
- Then: OVVO Wrapped (planned, not built — see `AGENTS.md`).


**Everything needed to run this without me is in [HANDOVER.md](HANDOVER.md)** — accounts, names, ids, the commands, and what happens if something is lost.

## What is live now (1 November 2026)

- **Address:** https://ovvo.vibecreations.workers.dev. Worker name `ovvo`, account subdomain
  `vibecreations`.
- **One deploy carries everything.** `worker/index.js` answers `/api/*` itself and hands every
  other request to the built site. Config: `wrangler.jsonc`.
- **Database:** Cloudflare D1, name `ovvo`, id `ba996f68-d067-46b6-8ea4-3dc05ce38acc`. One table,
  `travel_sync` (`schema.sql`), one row per signed-in traveller, `rev` for safe two-device saves.
- **Sign-in:** Firebase, three ways: Google, email and password, and a link by email. Screens are
  `/signin` and `/auth/finish` (the page the emailed link lands on).
- **The server checks sign-ins itself.** `worker/auth.js` verifies Firebase's signature against
  Google's published keys, so no server secret exists and the Admin SDK is not needed.
- **Deploying:** `npm run deploy` (build, then `wrangler deploy`). `npm run db:init` applies the
  schema to the live database. The token and account id live in `.env`, which git ignores.
- **How syncing behaves:** the browser's copy always wins; the server only fills in keys this
  device does not have. A save names the revision it was built on, so a second device merges
  instead of erasing.
- **Checked live:** home page renders, `/signin` draws all three methods, Settings shows the
  account card, `/api/health` answers 200, `/api/me` answers 401 without a token, a request from
  another origin is refused with 403, and `travel_sync` exists in the live database.
- **Not checked yet:** a real sign-in end to end, which needs the steerer's own account in a
  browser. That is the next thing to do together.
- **The cost of it:** the Firebase sign-in code adds about 230 kB (gzipped) to the bundle, because
  every screen ships in one file by design. Worth splitting out later if first load is measured to
  suffer on a phone.

## How account data is kept (1 November 2026)

Signed out, every value lives in this browser only — that is unchanged, and the account card says so.

Signed in, the whole store is one document per account in D1 (`travel_sync`), pushed automatically
1.5 seconds after any change and pulled on every page load. **The account is the copy that counts**
once a device has met it: a device that is behind adopts the account's document as it stands, so a
favourite or journey removed on one phone is removed on the other instead of being resurrected by an
old local list. A device that has never synced only has its gaps filled, so the first sign-in can
never empty a phone that was already in use. Two exceptions travel in the document but are never
taken back from it, because they describe the device and not the traveller: `location-consent`,
`location-fix`, `approximate-location` and `install-asked`.

Deleting the account erases that document first, then the account itself.
