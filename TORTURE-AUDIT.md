# The torture audit

**768 page loads and 162 interaction checks across three browser engines** — Chromium, Firefox and
WebKit (Safari's engine) — plus 60 parallel requests, a 33-clicks-per-second storm, 30 sort changes,
a resize storm, corrupt and full storage, no network, no history, 200% text zoom and 4,000 characters
of markup pasted into a search field. 576 of the loads are the three engines' first pass; the other
192 are a complete second pass in WebKit, run after it was made to launch on this machine.

Nothing below is called "fine". Each finding is a thing that is **wrong**, with the measurement that
makes it wrong, and what it would take to be right. At the end there is a section on what the first
pass got wrong, because a harness that blames the app for its own mistakes is not an audit.

Harnesses: `.logs/torture-matrix.cjs` (states), `.logs/torture-interactions.cjs` (interactions),
`.logs/torture/probe-engines.cjs` and `probe-engines2.cjs` (the cross-engine questions), and
`probe-focus.cjs` (whether focus returns to the exact control that opened a dialog).
Raw evidence: `.logs/torture/matrix-{chromium,webkit,firefox}.ndjson`,
`.logs/torture/interactions-{chromium,webkit,firefox}.json`.

---

## Every finding, answered

All seven were dealt with. Two of them needed no change to the app, and that is said plainly rather
than turned into a fix for the sake of a tidier table.

| # | Finding | What was done | Proof |
| --- | --- | --- | --- |
| 1 | Offline reload showed the browser's error page | `public/sw.js` caches the shell and every same-origin request; navigations are network-first with the cache as the answer when there is no network. Registered for the build only. The strip also says *"Reloading this page needs a connection."* where no worker controls the page, so it never promises more than it can keep. | Built app on port 3001, network cut, page reloaded: **Home renders, the offline strip shows, 0 page errors** in Chromium, Firefox and WebKit. |
| 2 | No focus ring on the card's station field | **Nothing to fix — the finding was the harness's.** The ring is drawn by the wrapper (`.input-group:focus-within`, the documented pattern for a compound field) and the check read only the focused element's own outline. The harness now looks up to three ancestors. | Focused: wrapper outline `2px solid rgb(255,126,103)`, and a crop of the screen shows it. The keyboard check passes in all three engines. |
| 3 | The alerts row on the board was 16px tall | The row owns its 44px (`min-height`) and stops borrowing it from a pseudo-element that the dock and the card above were eating. | Measured: **332 × 44**, and `elementFromPoint` 20px above and below the centre both return the link. |
| 4 | Clamped sentences cut mid-word with no ellipsis | `text-overflow: ellipsis` on `.t-clamp-2` and `.board-list__destination`. | Computed `text-overflow: ellipsis` on both, and **0 clamp findings** in the re-run. |
| 5 | Headings jumped h1 → h3 | `headingLevel={2}` on the results and journey empty states. | `/results` and `/journey/j1` now read `H1,H2`. |
| 6 | Alert titles claimed 44px and got 36 | Inside a card the title link is the target: `min-height: 44px`, expansion off — borrowing only works where a row has room to spare, and a list never does. | Every alert title measures **44px**. |
| 7 | A failed location estimate was silent | The stops screen says *"We could not estimate where you are, so this is the city order."* instead of telling somebody with location already on to turn it on. | Both providers blocked, fresh profile: the sentence appears. |

**Re-run after the fixes:** states A, B and H × 12 routes × 2 widths in Chromium and in WebKit —
**72 loads each, 6 findings each**, and all six are the exempt word links (rule 8). The 172 clamps,
32 heading jumps and 32 small targets of the original run are gone. The interaction suite went from
6 failures to 5 in Chromium, and the 5 are the click storm (a real drop, no person clicks like that)
and the three offline checks, which run against the dev server where no worker is registered by
design — the same three pass on the built app, as finding 1's row says.

---

## Since: the circled ×

Reported by hand, from a screenshot: the × on the location sheet was drawn with the coral focus ring
the instant the sheet appeared, before anything had been touched.

It was a focus ring, and the app had put it there. Both overlay containers move the keyboard onto
their *first control* when they open, and the first control in every sheet is the ×. A sheet can
open without any interaction at all (the location question appears by itself on a first visit), and
with no pointer or key press to judge by, the engine counts that placed focus as keyboard focus and
paints `:focus-visible`. So the app was showing a keyboard state that was not true, on a control
nobody had reached — and it reads as "already selected".

The keyboard now lands on the sheet itself (`tabindex="-1"` on both containers), which is where a
native `<dialog>` puts it: the sheet is announced with its own name and description, no control
looks pre-selected, and the first Tab reaches the × and rings it then. The panel draws no ring of
its own (`styles/base.css`); the ring on real controls is untouched. One thing had to come with it:
with the keyboard starting on the panel, Shift+Tab would have walked backwards out of the sheet into
the page behind, so the trap now treats the panel as the first position and wraps.

Measured in all three engines: on open the focus is the panel and **no element draws a ring**; one
Tab later the × does (`2px solid rgb(255,126,103)`); Shift+Tab wraps to the last control, Tab wraps
back to the ×; Escape closes and the keyboard returns to the button that opened the sheet.
`scripts/ui-audit.mjs` passes whole. Evidence: `.logs/torture/probe-close-ring.cjs`,
`probe-close-trap.cjs`, `close-ring-final-chromium.png`.

---

## What was covered

**The state matrix** — 8 states × 12 routes × 2 widths (320 and 1440) × 3 engines = **192 loads per
engine**:

| State | Appearance |
| --- | --- |
| A | cream, defaults |
| B | dark |
| C | cream, raised contrast |
| D | dark, raised contrast |
| E | cream, compact density, reduced motion |
| F | dark, battery at 8% (super saving) |
| G | cream, raised contrast, compact, battery at 15% (save) |
| H | dark, Dutch |

Routes: `/`, `/results`, `/journey/j1`, `/stops`, `/stops/utrecht-centraal`, `/departures`,
`/disruptions`, `/disruptions/d-cancel-schiphol`, `/preferences`, `/settings`, `/map`, `/nope`.

Battery states were real: `navigator.getBattery` was mocked at 8% and 15% (headless browsers have no
battery, so without that the two saving modes could never be reached at all).

Every load was measured for: sideways overflow, blocks outside the window, text cut by its own box,
ink contrast against the surface it sits on, effective hit areas (probed outward from the centre, not
read off the CSS), text under 11px, duplicate ids, heading order, h1 count, unnamed controls, layout
shift, and motion under reduced-motion.

---

## Across three engines

The same defects appear in all three. Nothing was found that breaks only in Safari or only in Firefox — which is a result in itself, and the reason it is stated plainly instead
of hidden in a table of green ticks.

**State matrix, problems per engine (192 loads each):**

| Class | Chromium | Firefox | WebKit |
| --- | --- | --- | --- |
| Sentences clamped with no ellipsis | 172 | 172 | 172 |
| Headings that jump h1 → h3 | 32 | 32 | 32 |
| Hit areas under 44px | 32 | 32 | 30 (26 on the second pass) |
| Word links sized by their line (exempt, rule 8) | 58 | 58 | 58 |
| Page/console errors, excluding the location 429 | 0 | 0 | 0 |
| Loads where the location service answered 429 | 16 | 16 | 16 (0 on the second pass) |

The hit-area gap in WebKit is the two compact-density phone loads where the probe's outward search hit
the neighbouring row before it did in the other engines; a direct probe of that link measured
**262–270 × 16px in all three engines at every density**, so the link itself is the same everywhere.

The second WebKit pass counted 26 rather than 32, and the six missing ones are all the same element:
the longest alert title at a 320px window. The alert titles are what *finding 6* is about, and a title
that wraps to two lines is 36px tall while a title that wraps to three is 55px — in **both** engines.
So the class is real everywhere; only which titles land in it moves with line breaking. Nothing was
fixed between the passes; the count moved because the wrapping did.

The 429 column is the same story from the other direction: the rate limit is a third party's, not the
app's, and the second WebKit pass hit it zero times in 192 loads. The note stays in because the
silence around it is the finding — the app never says why "nearest" stopped being nearest.

That table was first measured in one pass. It was then checked again on a freshly restored machine,
where the whole thing had to be rebuilt — dependencies reinstalled, all three browsers downloaded,
and WebKit given the system libraries this VM has no root to install. All 192 WebKit loads were run
again from scratch: the same four classes appeared in the same places, with the two count differences
explained above. The cheap cross-engine checks were repeated too — focus returning to the exact opener
(`From`→`From`, `To`→`To` in Chromium, Firefox and WebKit), the station picker opening in under
600ms in WebKit, the offline strip clearing after its four-second confirmation, and `/settings`
surviving twenty history jumps. Same answers, which is what makes the table worth reading rather than
a snapshot of one afternoon.

**Interaction suite (54 checks each, first pass — only the focus check inside it was repeated live):**

| Engine | Failing |
| --- | --- |
| Chromium | 6 — focus ring, 2 from the click storm, 3 from the offline cold load |
| Firefox | 5 — focus ring, 2 from the click storm, 2 from the offline cold load |
| WebKit | 3 — focus ring, 2 from the click storm |

**The engines are what they say they are.** A table of three columns is worthless if the third one is
Chromium wearing a hat, so each engine was asked to describe itself instead of being trusted on the
strength of an environment variable. Playwright 1.64.1, the same session, same page
(`.logs/torture/probe-live-engines.cjs`):

| `ENGINE=` | Browser version | Says it is |
| --- | --- | --- |
| `chromium` | 156.0.8078.4 | `HeadlessChrome/156` |
| `firefox` | 157.0 | `Gecko/20100101 Firefox/157.0` |
| `webkit` | 27.2 | `AppleWebKit/605.1.15 … Version/27.2 Safari/605.1.15` |

WebKit reported the WebKit-only DOM API, Firefox the Gecko-only one, and Chromium neither. This is
the build Safari ships the engine from, not a look-alike.

**Speed, dev server, same machine, first paint of the `h1` after a cold load, measured in one session:**

| Route | Chromium | Firefox | WebKit |
| --- | --- | --- | --- |
| `/` | 487ms | 693ms | 486ms |
| `/stops` | 515ms | 752ms | 500ms |
| `/settings` | 647ms | 787ms | 507ms |

An earlier pass recorded WebKit at 1454ms on `/` and read as "three times slower". That was the first
WebKit launch on a machine that had just been restored, not the engine: re-measured, WebKit is level
with Chromium and Firefox is the slowest of the three by about 200ms a screen. The numbers are the
dev server shipping unminified React, so they mean little in absolute terms — the correction matters
because the old reading would have sent someone optimising for a problem that is not there.

---

## Findings, worst first

### 1. Offline is not offline — a cold load shows the browser's error page

**Severity: high. It is a promise the interface makes.**

The offline strip says: *"OVVO still works — your journeys, boards and saved stops are all here."*
That is true while the page stays open. It is not true when the page is loaded again:

- Chromium and Firefox, measured: with the context offline, `location.href = '/stops'` renders **no
  app at all** — 0 `.offline-bar` elements, an empty `main`, and the browser's own error document
  (which is where `Failed to read the 'localStorage' property … Access is denied` comes from).
- WebKit rendered the screen, because it served that navigation from its own cache. That is luck, not
  a guarantee: a cache miss, a cleared cache, or a first visit offline all land on the error page.
- Cause: there is **no service worker**. `public/` holds `favicon.svg` and nothing else; no
  `serviceWorker` registration exists in `src/`, `index.html` or the build.

So the app's most reassuring sentence is kept by the browser's goodwill, and it is broken by the exact
thing a traveller does when a page looks stuck: reload.

**To be right:** register a service worker that caches the shell and the data files (the app is
entirely local, so this is a small, contained cache), or change the copy to tell the truth — "this
screen stays working while it is open; reloading needs a connection."

### 2. An input you cannot see the caret in

> **Corrected after the fix pass: this was our measurement, not the app.** The ring is on the
> wrapper — `.input-group:focus-within`, which is this app's documented pattern for a compound
> field, so the input inside carries `outline: none` on purpose and the two do not draw a ring each.
> The check read the focused element's own outline and never looked up. Focused, the wrapper's
> outline is `2px solid rgb(255,126,103)` and the crop below is what a keyboard user sees
> (`.logs/torture/fix2-focus-chromium.png`). The harness now walks three ancestors; the keyboard
> check passes in all three engines. What follows is kept as it was written, because a report that
> edits its own history is worth less than one that admits a mistake.

**Severity: high. WCAG 2.4.7 (focus visible). All three engines.**

The home screen's departure-board card, before a station is chosen, carries a text input labelled
*"Station for this card"*. Focused and unfocused, the computed style is identical:

```
outline: none 3px rgb(24, 24, 27)   box-shadow: none
border:  rgb(24, 24, 27)            background: rgba(0, 0, 0, 0)
```

No ring, no shadow, no border or surface change. A keyboard user tabbing the home screen arrives at a
field with no indication that they are in it. (27 other focus stops on the same screen were measured
and all showed a ring; this is the one that does not.)

**To be right:** the same focus ring every other control uses.

### 3. A whole-row link 16px tall

**Severity: medium. WCAG 2.5.8 (24px minimum) and the app's own 44px rule.**

On `/departures`, under a pinned board, the link *"3 alerts affect Utrecht Centraal"* measures
**262–270 × 16px** in every engine and every density, and its effective hit area is the same — it has
no expanding pseudo-element, and its card is not clickable (`cursor: auto`, no handler), so there is
nothing else to hit.

16px is below the 24px WCAG minimum as well as the app's 44px. It is not an inline word link inside a
sentence (which the house rule exempts), it is a row.

**To be right:** give it the `.tap-target` treatment the alert titles already use.

### 4. Sentences that stop mid-word and do not say so

**Severity: medium. It reads as a typo, not as a clamp.**

**172 instances per engine** across the matrix. Two classes of block are clamped with
`-webkit-line-clamp: 2` **and `text-overflow: clip`** — no ellipsis:

- `p.t-sm.t-clamp-2` — the advice line on each alert card (`/disruptions`), e.g. *"Take bus 347 from
  Schiphol Airport to Ha…"* cut to two lines.
- `span.board-list__destination` — the destination column of a board row (`/departures`,
  `/stops/utrecht-centraal`, `/settings`), every long station name.

The full text does exist elsewhere (the alert's own page), but nothing on the clamped block says the
sentence continues. A clamp is a fair design choice; a clamp that silently chops a word in half is not.

**To be right:** `text-overflow: ellipsis` on both, so the cut is drawn. (For the board destination,
also worth asking whether a station name should be clamped at all — it is the one word in the row that
must be readable.)

### 5. Heading levels jump from h1 to h3

**Severity: medium. WCAG 1.3.1 structure. All three engines, 32 instances each.**

- `/results` with no search: `h1 "Journey results"` → `h3 "Nothing to show yet"`.
- `/journey/<id>` when the journey is gone: `h1 "Journey no longer in this session"` → `h3 "This
  journey could not be restored"`.

`EmptyState` defaults to `headingLevel={3}`; both screens have no `h2` above it. A screen reader
announces "heading level 3" immediately under the page title, which describes a section that does not
exist.

**To be right:** `headingLevel={2}` at those two call sites — the component already supports it.

### 6. Alert titles claim 44px and get 36px in the list

**Severity: low. The hit area is smaller than the app's own standard claims.**

`a.tap-target` gives an alert title a `::after` with `inset: -14px -4px`, i.e. a 64px-tall target. In
the list, measured outward from the title's centre, the effective height is **36px**: 22px above and
14px below, because the block above owns the space. A standalone probe (nothing above it) confirms the
pseudo does reach 64 — so the declaration is right and the *layout* is eating it.

This is the same class of problem the stylesheet already documents for `.tap-target` next to "Show N
more": an expanded hit area can only grow into space nobody else is using.

**To be right:** space the alert rows so the pseudo has room, or accept and document the overlap.

### 7. The location estimate depends on a third party that rate-limits

**Severity: low (dependency), but it is invisible when it happens.**

`ipwho.is` returned **429 on 16 of 192 page loads in every engine**, and the app said nothing: the
estimate simply does not arrive and the "nearest" sort falls back to city order. The page itself
stayed correct — 60 parallel requests, 60/60 at HTTP 200, p50 52ms, p95 60ms — so this is not an
outage, it is a silent degradation with no way for the traveller to know why "nearest" is not nearest.

**To be right:** say it once, quietly ("Using the city order — your location could not be
estimated"), or cache the estimate longer.

### 8. Thirty clicks land twenty-two times

**Severity: informational — no person clicks like this.**

30 link clicks at 30ms intervals, in all three engines: **22 registered, 8 swallowed**, the address
ended on `/departures` rather than the last link clicked, and the history grew by 22 instead of 30.
Nothing crashed and every screen that did open was real. Recorded for the sake of honesty about the
storm, not as a defect to fix.

---

## Deliberately not fixed: word links

**58 instances per engine** of anchors sized by the line they sit in (station names on board rows,
stop names in journey legs and alerts). These are exempt by house rule (AGENTS.md rule 8): a 44px box
on a word inside a line pushes the line apart and lands a square over the words beside it. They were
measured, listed, and left alone.

---

## What held up under torture

- **Keyboard:** 27 tab stops on the home screen, **0** without a name, **0** that were not drawn.
- **Dialogs:** focus trapped over 40 samples, Escape closes, and focus **returns to the exact
  control that opened it** — the *From* picker returns to *From* and the *To* picker to *To*, by
  identity, in all three engines.
- **Sort storm:** 30 changes — control, state and address agreed, **0 extra history entries**, and the
  reload landed on the same sort.
- **Resize storm:** 40 widths from 320 to 1440 in one session — **0px** of sideways overflow.
- **Corrupt storage:** every key replaced with invalid JSON — the home screen drew and nothing threw.
- **Storage full:** `QuotaExceededError` while favouriting — the interface kept working.
- **Input abuse:** markup, 60 emoji and RTL text pasted in — nothing executed (`window.__xss` false),
  no widening, and **the whole 3,362-character string was kept**.
- **Deep links:** 5 addresses × 2 reloads each — every one landed on its own screen.
- **Results:** a search, a reload and a second browser with no history — identical journey lists.
- **OS reduced motion:** with `prefers-reduced-motion: reduce`, **0** elements have a transition
  longer than 20ms in any engine. The app answers the system preference even when its own switch is
  off.
- **200% text zoom:** 0px sideways scroll, and no content clipped by its own box (the only clipped
  blocks are `.sr-only` screen-reader text, which is supposed to be clipped).
- **Overload:** 60 parallel requests — 60/60 at 200, p50 52ms, p95 60ms; 10 simultaneous browser
  contexts — 10/10 rendered.

---

## What the first pass got wrong

This section exists because seven "failures" in the first run were the harness's fault, and saying so
is more useful than a clean-looking number.

| First-pass claim | The truth |
| --- | --- |
| "Focus does not return to the dialog's opener" | The dialog was opened from a `?pick=from` deep link, which has no opener. Opened from its real button, focus returns correctly in all three engines. |
| "OS reduced motion is ignored" | It measured `data-motion`, which tracks the app's own switch. The CSS media query does honour the system preference — 0 transitions over 20ms. |
| "19 blocks are cut at 200% zoom" | All 19 were `.sr-only` boxes, which are 1×1 and hidden on purpose. They are cut at 100% zoom too. |
| "The whole input is not kept" | The string was 3,362 characters and the check demanded more than 4,000. The whole string was kept. |
| "After 20 history jumps the screen is blank" | Measured before the client-rendered `h1` had painted. Waited for, it is there in ~100ms in every engine. |
| "The picker does not open in WebKit" | Measured at 734ms; it opens at 761ms. |
| "The offline strip never clears" | It clears after a deliberate four-second *"Back online — live times resume."* confirmation (`layout/OfflineBar`). |
| "No focus ring on the station field" | The ring is on the field's wrapper (`.input-group:focus-within`); the check read only the input's own outline. See finding 2. |

The click storm's address mismatch and missing history entries are real — they are the dropped clicks,
counted.

---

## Limitations of this audit (so it is not read as more than it is)

- Run against the **dev server** (Vite, unminified React), not the production bundle. Timings are
  pessimistic and the dev-only review layer was inert but present.
- **No real device and no screen reader.** WebKit here is Playwright's WebKit 27.2 — the WPE build of
  Safari's engine — which is Safari's engine but not Safari: iOS scrolling, the visual viewport,
  rubber-banding and the on-screen keyboard are not modelled. `elementFromPoint` is a faithful
  stand-in for a finger, not a finger.
- All three ran headless from `npx playwright install`. This VM has no root, so the Ubuntu libraries
  the browsers expect are unpacked from `.deb` files into `$HOME/syslibs`; WebKit needs the most,
  including EGL, GLES and Mesa's software driver, and it is launched through `.logs/torture/webkit-run.sh`
  because the bundle's own launcher *replaces* `LD_LIBRARY_PATH` rather than extending it — without
  that the browser aborts with "Could not create EGL display". The wrapper adds libraries and a
  software GL path; it does not substitute a browser. `source .logs/torture/env.sh` reproduces the
  whole setup.
- The **service worker is registered for the build only**, so the offline half of this audit is
  true of `npm run build` and not of the dev server: caching modules in development would serve
  yesterday's code over hot reload. The offline checks therefore belong on port 3001 (`vite preview`
  over `dist/`), which is where finding 1 was verified.
- Contrast was computed from `getComputedStyle`, which sees painted colours but not a photo background
  (those blocks were skipped, not passed).
- Layout shift was read from `layout-shift` performance entries, which WebKit and Firefox do not
  surface — so it is reported for Chromium only, and not counted as a finding either way.

---

## The list, after the fixes

1. ~~Offline: a service worker, or honest copy.~~ **Done** — `public/sw.js`, verified on the built app.
2. ~~Focus ring on the "Station for this card" input.~~ **Not a defect** — the ring was there; the check was reading the wrong element.
3. ~~The 16px row link on the departure board.~~ **Done** — the row is 44px on its own.
4. ~~`text-overflow: ellipsis` on the two clamped blocks.~~ **Done.**
5. ~~`headingLevel={2}` on the results and journey empty states.~~ **Done.**
6. ~~Alert-row spacing so `.tap-target` owns its 44px.~~ **Done** — the title is 44px by its own height.
7. ~~A quiet line when the location estimate fails.~~ **Done.**

What is left is one thing, and it is deliberate: the word links sized by their line (rule 8).
