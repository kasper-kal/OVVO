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
- **Firebase Authentication for sign-in.** Google's sign-in service. Cardless, permanently
  free at our size, and it sends its own password reset and verification mail from
  `firebaseapp.com`, which is why no domain is needed.
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
