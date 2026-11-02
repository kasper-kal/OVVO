# OVVO without me

Everything needed to run, move or rebuild OVVO **without Freebuff**. Nothing at this site lives in
Freebuff: it is a folder of code on GitHub, a Worker and a database at Cloudflare, and a sign-in
project at Google. Freebuff is only the desk where the code was written.

Keep this file and your `.env` note together. Between the two of them you have everything.

---

## 1. Where each piece lives

| Piece | Where | What it is |
| --- | --- | --- |
| Code | https://github.com/kasper-kal/OVVO | A normal git repository on a GitHub account |
| The site | Cloudflare, Worker named `ovvo` | https://ovvo.vibecreations.workers.dev |
| The database | Cloudflare D1, named `ovvo` | Holds one row per signed-in traveller |
| Sign-in | Google Firebase, project `ovvo-vibecreations` | Google, email+password, email link |
| Deploying | `wrangler`, run from a copy of the repository | Puts the code and the database together |

Nothing here is paid. Cloudflare's free Worker and D1 plans and Firebase's free Spark plan cover
this site at its size. None of them pause when unused.

**A custom domain was deliberately not used.** The address is the free `workers.dev` one, and there
is no DNS record, no domain bill and no renewal to forget.

---

## 2. The fast version: how to change something

On any computer with Node installed:

```bash
git clone https://github.com/kasper-kal/OVVO.git
cd OVVO
npm ci                      # installs exactly the versions in package-lock.json
# create .env (see section 3), then:
npm run dev                 # the site on http://localhost:3000
npm run deploy              # builds and puts it live
```

That is the whole loop: change a file, `npm run deploy`, look at the live address.

---

## 3. The `.env` file

Not in git, and it must stay that way. **Nine names**, all of them listed here. Six are public; two
are credentials; one is just a note.

```
APP_URL=https://ovvo.vibecreations.workers.dev

CLOUDFLARE_ACCOUNT_ID=3e26a32b9147263801a9c32a05e99349
CLOUDFLARE_API_TOKEN=<the token; you have this in your protected note>

VITE_FIREBASE_PROJECT_ID=ovvo-vibecreations
VITE_FIREBASE_API_KEY=<from Firebase>
VITE_FIREBASE_AUTH_DOMAIN=ovvo-vibecreations.firebaseapp.com
VITE_FIREBASE_STORAGE_BUCKET=ovvo-vibecreations.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=454638608003
VITE_FIREBASE_APP_ID=1:454638608003:web:7b15bd9be71177751585b6
```

- The **six Firebase values are public**. Google gives them to every browser that loads the site,
  and they are useless without the project. They are copied into the built code at build time.
- The **Cloudflare token is a credential**. It can deploy and delete. Never in the repository,
  never in a commit, never in a chat.
- The **account ID is not secret** — it is an account number, not a key.

Where the six Firebase values come from, if they are ever lost: Firebase console, project
`ovvo-vibecreations`, the gear icon, **Project settings**, scroll to **Your apps**, the web app, and
**SDK setup and configuration → Config**. If the web app is gone, add one again; the values change
and the six lines in `.env` are replaced with the new ones, then redeploy.

---

## 4. The Cloudflare token

Made at **dash.cloudflare.com → My Profile → API Tokens → Create Token → Custom token**, with three
permissions:

- **Workers Scripts** — Edit
- **D1** — Edit
- **Account Settings** — Read

Scoped to the account, nothing else. That is the whole token. If it is ever lost, make a new one
the same way and replace one line in `.env`.

**On your own computer you do not need a token at all.** `npx wrangler login` opens a browser and
authorises the tool once; after that `npm run deploy` just works. The token exists because the
machine I work on has no browser to log in with.

---

## 5. Deploying by hand, command by command

```bash
set -a; . ./.env; set +a        # put the two Cloudflare values in the environment
npm run build                   # typecheck, the audits, then the files in dist/
npx wrangler deploy             # uploads dist/ and worker/, attaches the database
```

`wrangler.jsonc` is the file that ties it together and it is worth knowing by name:

- `name: "ovvo"` — the Worker, and therefore the first half of the address.
- `assets.directory: "./dist"` — what was built.
- `d1_databases` — the binding called `DB`, and the database id.
- `vars.FIREBASE_PROJECT_ID` — the one non-secret value the Worker itself needs.

The other way to deploy, which needs no token and no computer: connect the GitHub repository to
Cloudflare (**Workers & Pages → ovvo → Settings → Build**) so that a push to `main` deploys itself.
It is optional; the manual command is what works today.

---

## 6. The database

- Name `ovvo`, id `ba996f68-d067-46b6-8ea4-3dc05ce38acc`, region WNAM (Western North America).
- One table, `travel_sync`, defined in **`schema.sql`** at the top of the repository.
- One row per signed-in traveller: their user id, their email, a document of everything they saved,
  a revision number, and when it last changed.

Reading it:

```bash
set -a; . ./.env; set +a
npx wrangler d1 execute ovvo --remote --command "SELECT uid, email, rev, updated_at FROM travel_sync"
```

Applying the schema to a fresh database:

```bash
npx wrangler d1 create ovvo        # prints an id
# put that id in wrangler.jsonc under d1_databases[0].database_id
npm run db:init                    # applies schema.sql to the live database
```

**What is stored is what the traveller saved**: favourites, saved journeys, search history, the
board they pinned, their own names for stops, their home-screen widgets and their settings. It is
one document of a few kilobytes, not a profile and not a log of where they went.

Deleting a traveller's server copy: the account card in Settings has a control for it, and it is
the only thing that removes a row except deleting the row yourself with the command above.

---

## 7. Sign-in

Firebase console: **console.firebase.google.com/project/ovvo-vibecreations**

Three ways in, all switched on under **Authentication → Sign-in method**:

1. **Google** — no setup beyond the consent screen, which is already configured and in production.
2. **Email/Password** — with reset mail sent by Firebase itself.
3. **Email link (passwordless)** — the mail contains a link back to
   `https://ovvo.vibecreations.workers.dev/auth/finish`, which is a page of ours.

**Authentication → Settings → Authorized domains** must list the site's host name. It currently
does. If the address ever changes, that list is the single line to update — the sign-in window
travels through Firebase's own addresses too, so those two entries stay.

The mails (reset, verification, sign-in link) are now sent through **Brevo** from
`ovvo.vibecreations@outlook.com`, because Firebase's own default sender is a shared
`firebaseapp.com` address that lands in spam. Changing the wording is in **Authentication →
Templates**; changing the sender is Brevo's, and the site says the address on its "check your
email" page so a traveller knows what to look for.

**How the server trusts a sign-in:** it does not call Google on every request. The browser sends a
signed token, and `worker/auth.js` checks the signature against Google's published keys, plus the
project it was issued for and its expiry. No secret is stored on the server, so there is no secret
to leak or rotate.

---

## 8. What happens if something is lost

- **This computer, or Freebuff disappearing:** nothing happens to the site. It is served by
  Cloudflare from its own copy, and the code is on GitHub.
- **The `.env` note:** only two things are hard to get back — the token (make a new one, five
  minutes) and the Firebase apiKey (copy it from the console again). Everything else is written in
  this file.
- **A laptop that dies:** clone the repository on another one and continue. `package-lock.json`
  pins every version, so it builds the same.
- **Firebase deleted:** the site still loads, but signing in stops. Sign-in is the only thing that
  depends on it, and nothing else in the app breaks.
- **Cloudflare account deleted:** the site goes down, the database goes with it, and the code is
  still safe on GitHub. A new Worker plus `npm run db:init` is a rebuild, not a loss.

---

## 9. Checks worth running before a deploy

```bash
npm run typecheck     # TypeScript, no build
npm run build         # the above plus the audits and the real build
```

Two more, for the parts that are easy to break silently:

```bash
node scripts/keep.mjs --check     # anything unsaved in the project
npx wrangler d1 execute ovvo --remote --command "SELECT COUNT(*) FROM travel_sync"
```

After a deploy, these three answer "is it really up":

```bash
curl -s https://ovvo.vibecreations.workers.dev/api/health            # {"ok":true}
curl -s -o /dev/null -w "%{http_code}\n" https://ovvo.vibecreations.workers.dev/   # 200
curl -s -o /dev/null -w "%{http_code}\n" https://ovvo.vibecreations.workers.dev/api/me   # 401
```

A 401 there is correct: it means the API refuses to answer without a sign-in.

---

## 10. Known gaps, said plainly

- Sign-in screens and the account card are **English only**; the rest of the app follows the
  language setting.
- The Firebase library adds about 230 kB (gzipped) to the bundle, because every screen ships in one
  file by design.
- No custom domain, by choice.
- OVVO Wrapped is **planned, not built**. Nothing in the app pretends otherwise.
