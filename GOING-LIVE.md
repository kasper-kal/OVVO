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
| Cloudflare Worker name | `ovvo-vibecreations` | Decides the public address |
| Public address | `ovvo-vibecreations.<subdomain>.workers.dev` | The subdomain is chosen by Cloudflare |
| Firebase project ID | `ovvo-vibecreations` | Cannot be changed once made |
| Firebase project name | `OVVO` | Display only |
| Firebase sign-in domain | `ovvo-vibecreations.firebaseapp.com` | Leave `authDomain` exactly as given |
| Token name | `OVVO deploy` | Display only |

Rule of thumb: **`ovvo-vibecreations` wherever a machine reads the name**, and plain
**`OVVO`** wherever it is only something a person sees.

## Sign-in

Turned on in Firebase: **Google**, **Email/Password**, and **Email link (passwordless sign-in)**.

All three are the steerer's decision, taken 1 November 2026. More providers can be added at
any time — clicking Done in the console locks nothing, and existing accounts keep working.

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

Nothing secret is ever written into a file in this project, a commit, or a chat message. They
go in **Settings → Secrets**, and the build reads them from there.

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
