# OVVO audit — one file, 32 sections

One page per message. This single file is both the plan and the results log: section 1 is Page 1,
section 32 is the last pop-up. Pages 1–12 never change number, so “Page 1” always means Home. The
pop-ups were renumbered on 2026-10-20 so the finished ones come first (13–21) and everything still to
audit follows in one block (22–32) — no finding was altered, only its number. Audits find; they do
not fix. Fixes get a separate pass once the findings are approved.

**Status legend:** `not started` · `in progress` · `done` · `blocked` (with the reason written in the
section). A run that turns out to be invalid is kept and marked, never deleted.

## Progress at a glance

| # | Page | Route | Status | Findings |
|---|---|---|---|---|
| 1 | Home | `/` | **done** | 5 |
| 2 | Journey results | `/results` | **done** | 7 |
| 3 | Network map | `/map` | **done** | 5 |
| 4 | Stations & stops | `/stops` | **done** | 6 |
| 5 | Stop detail | `/stops/:stopId` | **done** | 10 |
| 6 | Departure boards | `/departures` | **done** | 10 |
| 7 | Disruptions | `/disruptions` | **done** | 6 |
| 8 | Alert detail | `/disruptions/:id` | **done** | 7 |
| 9 | Journey detail | `/journey/:journeyId` | **done** | 8 |
| 10 | Travel preferences | `/preferences` | **done** | 8 |
| 11 | Settings | `/settings` | **done** | 13 |
| 12 | Not found | `*` | **done** | 6 |

The twelve pages are tracked above. The other twenty sections are **pop-ups** — sheets, dialogues and
full-screen screens — and they have a table of their own, because a pop-up is audited where it is
opened from, at three widths, and does not belong in a list of routes.

### Pop-ups at a glance

| # | Pop-up | Opened from | Status | Findings | Audited with |
|---|---|---|---|---|---|
| 13 | Plan with *stop* | Plan buttons on Stations & stops | **done** | 3 | Page 4, 2026-10-19 · re-confirmed on Page 5 |
| 14 | Match colours | Settings → Colours | **done** | 4 | Page 11, 2026-10-20 |
| 15 | Remove all locally stored data? | Settings | **done** | 3 | Page 11, 2026-10-20 |
| 16 | Background | Settings → Colours | **done** | 2 | Page 11, 2026-10-20 |
| 17 | Widgets | Settings → Colours | **done** | 1 | Page 11, 2026-10-20 |
| 18 | Text selection | Settings → Colours | **done** | 1 | Page 11, 2026-10-20 |
| 19 | Custom colour | inside 16 and 17 | **done** | 5 | its own pass, 2026-10-20 (opened with Page 11) |
| 20 | All sections | dock, mobile only · also on every page at ≤1039px | **done** | 5 | its own pass, 2026-10-20 |
| 21 | Use your location? | first visit · also on every page until answered | **done** | 5 | its own pass, 2026-10-20 |
| 22 | How do you reach the first / leave the last stop? | Results | **done** | 5 | its own pass, 2026-10-20 |
| 23 | Date and time | Results | **done** | 5 | its own pass, 2026-10-20 (also measured as 2.1) |
| 24 | Add a widget | Home, while customising | **done** | 6 | its own pass, 2026-10-20 |
| 25 | Unfavourite this journey? | saved-journeys widget | **done** | 6 | its own pass, 2026-10-20 |
| 26 | Delete all saved searches? | journeys widget | **done** | 5 | its own pass, 2026-10-20 |
| 27 | Choose a stop | planner rows and pickers | **done** | 7 | its own pass, 2026-10-20 |
| 28 | Choose a stop on the map | stop picker | **done** | 10 | its own pass, 2026-10-20 |
| 29 | Photo | inside 17 in photo mode — 16 has no such row | **done** | 10 | its own pass, 2026-10-20 |
| 30 | Crop photo | the photo screen, and 16's own Crop | **done** | 9 | its own pass, 2026-10-20 |
| 31 | Home layout menu | **+** while customising | **done** | 6 | its own pass, 2026-10-21 |
| 32 | Stop suggestions | Departures, Settings, next-departures card | **done** | 7 | its own pass, 2026-10-21 (also the Find-a-stop widget) |

**Twenty done (13–32) — every section has now had its own pass.** A pop-up is marked done only when its own section
carries its size at 320/390/1440, its focus placement, its trap, its Escape and its focus return — the
five audited there have a pointer table of measurements (11.1–11.19), and 19–32 now have their own.

---

## What this audit cannot verify

This file measures a Chromium render, not a person using the app on a phone. The list below is what
no run in this file can establish, and the check that belongs to you (or to a later device pass).
Every page section repeats the relevant codes under **Not verifiable here**, and the pop-up category
carries one shared line. **Not measured** is kept for things the harness could have done but did
not, so the two are never confused.

| Code | Limit | What the audit cannot see | What you should check |
|---|---|---|---|
| **L1** | Screen reader | Spoken announcements, reading order, verbosity, whether a dialog is announced; only DOM roles/attributes and the accessibility tree are inspected | VoiceOver (iOS) and NVDA (Windows): Home, the Plan sheet, the no-match state, a filtered list |
| **L2** | Real devices, notches and keyboards | Safe-area insets, camera cutouts, browser chrome, the on-screen keyboard, OS text size, iOS/Android rendering | iPhone Safari and Android Chrome at 320/390: header, bottom sheet, search with the keyboard open, 200% text |
| **L3** | Touch and gestures | Long-press, swipe, pinch, drag momentum, haptics, fat-finger accuracy; only synthetic mouse/pointer input exists | Long-press Home, swipe the dock, pinch and drag the map and pickers, tap every 44px control |
| **L4** | Other browser engines | WebKit, Gecko, Samsung Internet; native select/date controls; engine-specific layout and scrolling | Safari (macOS/iOS) and Firefox: all 12 pages, both appearances |
| **L5** | Performance and battery | Core Web Vitals, frame timing, memory, thermals, low-end hardware, installed page weight | Lighthouse on mobile; a mid-range Android; a 10-minute board refresh; battery-saver mode |
| **L6** | Live network and data | Production APIs, offline/flaky/3G, refresh over real time, server behaviour, rate limits beyond the IP lookup | Throttle to Slow 3G and offline; leave a board open for 10 minutes; compare with live 9292 data |
| **L7** | Install and OS integration | Add-to-home-screen, standalone mode, deep links from other apps, share sheet, notifications | Install on iOS/Android, open a shared `#/stops/...` link cold, check standalone safe areas |
| **L8** | People, content and trust | Comprehension, wording in context, native Dutch quality, usability with disabled travellers, visual taste | Five short user tests; a native Dutch review; testing with a keyboard/switch/screen-reader user |

**The short version for you:** the audit is strong on geometry, contrast, focus order, copy and
state logic in Chromium. It is **not** evidence for L1–L8. Those eight are the checks to run on real
devices before calling a screen finished — and if a screen is not listed below yet, its section
still carries the line for the run that will audit it.

---

## Protocol

**Widths:** 320, 360, 390, 430, 768, 1024, 1280, 1440, 1920 — every state at every width.
**Heights:** 500, 700 and 900, plus the page at its **full scroll height**.
**Density:** DPR 1, 2 and 3.
**Languages:** English and Dutch, in full at 320 and 1440, spot-checked elsewhere.
**Method:** Playwright against the live preview; states seeded through `localStorage`
(`ov-planner:v1:*`); every result PASS/FAIL with the measured number and the element it belongs to.
Screenshots under `.logs/`.

**The eleven counts** — the same set on every section:

1. **Layout & alignment** — page rail, card edges, inner padding, row middle lines, grid columns and gaps.
2. **Spacing** — every computed padding/margin/gap against the 4px scale; off-scale values listed.
3. **Typography** — size, weight, line-height, tracking, colour per role; truncation, long words, heading order.
4. **Colour & contrast** — every text and icon against the surface it is actually painted on, both appearances.
5. **Controls** — rendered size, 44px effective target, hover/focus/pressed/disabled; every control pressed, its consequence recorded.
6. **States** — empty, loading, error, no data, long content, energy saver.
7. **Heights & overflow** — horizontal overflow, full document height per width, clipping, dock over content, sticky header at both scroll extremes.
8. **Pop-ups** — opened at 320/390/1440; size, position, overflow, focus trap, Escape, focus return.
9. **Language & appearance parity** — geometry light vs dark and EN vs NL, so only content-length differences remain.
10. **Keyboard** — tab order, visible focus, arrow-key reorder, dialogue focus behaviour.
11. **Console & network** — errors, failed requests, React warnings, layout warnings.

A section may mark a count **not applicable** only with the reason (for example: no async state on
this screen, so no loading state exists).

**Every section states its blind spots.** A section is not complete without a **Not verifiable
here** line naming the L-codes above and one page-specific check, kept separate from **Not
measured** (things the harness could have done but did not). This applies to pop-ups too. A future
run that forgets the line leaves the section incomplete, even if every number is right.

---

# PAGES

## 1. Home — `/`

**Status:** done — findings recorded, no fixes made. Five things were not measured; see “Not measured” below.
**Pop-ups opened here:** 20, 21, 24, 27, 31, 32
**States:** fresh browser (location sheet open) · location denied · location allowed · default layout ·
customising · mid-drag · layout menu open · Add a widget open · every widget added at Small / Medium /
Large · empty home · energy saver (save) · super saver · light · dark · English · Dutch.
**Checks:** 1–11.

**Not verifiable here:** L1 screen reader · L2 real device/notch/keyboard · L3 touch · L4
Safari/Firefox · L5 performance · L6 live network · L7 install · L8 user testing (definitions at the
top). **This page especially:** L1 for the location sheet and the dialogs, L3 for press-and-hold
customising. **You should check:** VoiceOver on the location sheet, and a real long-press at 390.

### Run log

| Run | Date | Scope | Outcome |
|---|---|---|---|
| 1 | 2026-10-19 | geometry, states, short viewports, energy saver | **invalidated** |
| 2 | 2026-10-19 | corrected keys; 9 widths, 3 heights, all-widgets, empty, dark, NL, saver, six pop-ups, controls, keyboard, type | **complete — 5 findings** |

**Why run 1 is void:** the seeding used camelCase keys (`homeWidgets`, `locationConsent`) while the
app stores `home-widgets` and `location-consent`. The “every widget” and “empty home” states never
applied (the default three widgets stayed), the location sheet was never suppressed, and the printed
summary read `.left`/`.right` from a box that exposes `.l`/`.r`. The captured raw data was partly
valid, but every state row is void and will be re-run with the corrected keys.

#### Not measured (stated, not passed)

- **Contrast (4)** — not recomputed here; `scripts/ui-audit.mjs` covers Home in light/en, dark/en and dark/nl at four widths and exits 0. Cited, not repeated.
- **Hover, pressed and disabled appearance (5)** — only the resting state and the click consequence were measured.
- **Map picker (27)** — the door exists inside 26 but was not opened in this run.
- **Granted location (6)** — only the fresh and denied states were exercised.
- **Filled saved-journeys / favourites widgets (6)** — the catalogue was drawn empty, so the 12-control sweep above under-represents those cards.

### Findings

| # | Count | Finding | Measurement | Verdict |
|---|---|---|---|---|
| 1.1 | 8, 10 | **No dialog takes focus when it opens, and the location sheet's focus is not contained.** `role="dialog" aria-modal="true"` is declared, but the active element stays on the page behind. With the location sheet open, the first **Tab** moves to the skip link and then through Edit → the logo link → alerts → the planner's From button — none inside the sheet. The other two dialogs let focus in on the first Tab but do not trap it: All sections escapes at tab 7 to the dev Review-notes button, Add a widget escapes at tab 16 to Home. Escape closes every dialog; All sections returns focus to its trigger when Escape is pressed immediately, but that is the only one checked for return. | focusInside=false at open on 13, 14, 19 at 320/390/1440. Tab sequences recorded in `.logs/p1-behaviour.out`, `.logs/p1-trap.out` | **FAIL** |
| 1.2 | 5 | **“Re-run my search from now” does nothing when there is no recent search.** The button renders in the `right-now` card on an empty home and, pressed on its own, produces no navigation, no overlay, no text change and no pressed-state change. Either the control should not be drawn without a search to re-run, or it should say why. | Pressed in a fresh context at 390 with all 15 widgets: url `''` → `''`, main text length 1921 → 1921, overlays 0 → 0. `.logs/p1-behaviour.out` | **FAIL** |
| 1.3 | 10 | **The suggestion list is operable by keyboard but not announced.** ArrowDown moves `aria-selected` from option 0 to option 1, and Enter chooses it; the input's `aria-activedescendant` stays `null` throughout, so assistive tech is not told which option is active. | 4 Utrecht options; `aria-selected` true→false/false→true; `aria-activedescendant` `null` before and after ArrowDown | **FAIL (minor)** |
| 1.4 | 11 | **Every home load requests `https://ipwho.is/` and receives 429.** It is the documented first provider with a `freeipapi.com` fallback, so the app behaves; the cost is a failed external request and a console error on first paint (and a dependency on a third party before the screen is settled). | `429 https://ipwho.is/` on every one of the 9 width runs and every state run; the fallback is attempted but not measured to succeed in this run | **NOTE** |
| 1.5 | 5, 6 | **Scope note, not a defect:** an all-widgets home exposes only **12** pressable controls, because most cards are empty until they hold the traveller's data. The press-every-control sweep therefore covers 12, not every control the catalogue can draw. The 12 are the From/To pickers (open 26), three nearby-stop links, six map chips (“All routes” was already selected, so its no-change is correct) and the dead control in 1.2. | `.logs/p1-behaviour.out` | **SCOPE** |

#### Verified to hold

- **Rail (1):** at every width 320–1920, cards end on the rail's right edge and the header's Edit and alerts end on its left/right (e.g. 390: 12..378; 1440: 52..1388). Card content inset is **17px** (1px border + 16px padding) across all 15 widgets.
- **Grid:** one, two or three cards per row according to each widget's declared span (12 / 6 / 4), never more than the rail; column and row gaps measure **16px** throughout (768: 12..376 + 392..756; 1440 span-4: 336..676, 692..1032, 1048..1388).
- **No horizontal overflow** at any width or state, including all 15 widgets at 320 in Dutch (`docOverflow 0`).
- **No text clipping** at 320 in default, all-widgets or Dutch, except the intentionally clipped `.sr-only` nodes; no off-scale padding/margin/gap among the measured components.
- **Every control probed at 390 and 1440 has a 44px effective target** (`0` under-size) in the all-widgets state.
- **States:** empty home draws its empty card; super saver keeps the 3 essential cards and states that 12 will return; save keeps all 15; page heights 3361px (390, all widgets) and 2062px (1440, all widgets); dock clears the last card by 13.7–13.9px at full scroll; header stays at top 0 at both extremes.
- **Pop-ups:** all six fit the viewport at 320/390/1440; Escape closes 20, 21, 24, 27; the layout menu hangs **8px** under the pill (menu top 64, pill bottom 56) with two rows; the suggestion list matches the field wrapper (29..361 at 390) rather than the inner `<input>` (64..308), which is correct.
- **Language:** Dutch keeps the same geometry and zero overflow at 390 and 1440; only `.sr-only` content differs.

---

## 2. Journey results — `/results`

**Status:** done — findings recorded, no fixes made. Five things were not measured; see “Not measured” below.
**Pop-ups opened here:** 22, 23
**States:** no search; 11 results; filters open; options panel open; long journey list; no results;
saved-search control; sort changes; plan-while-working; 320×568 and 390×844 first screens; light;
dark; energy saver; English; Dutch.

**Checks:** 1–11. Specifics: card list rhythm and row centres inside each journey card; the results
header's controls against the page rail; filter chips vs card edges; truncation of long stop names;
the “try one hour later” rows.

**Not verifiable here:** L1 screen reader · L2 real device/notch/keyboard · L3 touch · L4
Safari/Firefox · L5 performance · L6 live network · L7 install · L8 user testing (definitions at the
top). **This page especially:** L1 for the result count and the no-match card, L2 for the keyboard
open over the planner, L6 for live journey times. **You should check:** VoiceOver after a filter
empties the list, and a 320×568 phone with the keyboard open.

### Run log

| Run | Date | Scope | Outcome |
|---|---|---|---|
| 1 | 2026-10-19 | 9 widths × 900 high, plus 320×568 and 390×844 folds; 11 results; options, filters, no-match, empty, loading, save, sort; dialogs 22/23 at 320/390/1440; light/dark/NL/saver; console and network | **complete — 7 findings** |

**The result count is pinned, deliberately.** The search window is “now”, so an unclocked pass
measured 9 journeys at the four phone widths and 10 at the wider ones — the same query run either
side of a five-minute boundary, not a layout difference. The recorded run fixes the clock at
**2026-10-19 10:00** with Playwright’s `clock.setFixedTime`, which gives **11 journeys** at every
width. All numbers below are from that run. Raw data: `.logs/p2-audit.json`; probes:
`.logs/p2-controls.out`, `p2-actions.out`, `p2-dock.out`, `p2-final.out`, `p2-probe.out`, `p2-planning.out`, `p2-focus.out`.

### Findings

| # | Count | Finding | Measurement | Verdict |
|---|---|---|---|---|
| 2.1 | 5, 8, 10 | **Dialogs 22 and 23 never take focus, never trap it, and leave the page behind scrollable.** `role="dialog" aria-modal="true"` is declared, but the active element stays on the chip that opened the dialog and the first Tab moves to the next control *behind* it. A wheel over the open dialog scrolls the document. | At 320/390/1440 `focusInside=false` on open for both dialogs; all 14 recorded tabs are outside the dialog, starting with the next results chip. With 18 open, `mouse.wheel(0,500)` moved `scrollY` 0 → 500 and focus stayed on “Leave: Now”. Closing with the X drops focus to `<body>` — the next Tab lands on the dock’s “Home” link, not on the chip that opened it; Escape closes but focus never left the trigger. Panels: 17 → 320×300.9 / 390×260 / 560×227.6; 18 → 320×318.1 / 390×301.9 / 560×257.9; `scrollHeight == clientHeight`, no document overflow. | **FAIL** |
| 2.2 | 5 | **The two alert links’ expanded tap areas overlap, so the bottom of the first alert opens the second one.** `.tap-target::after` reaches 14px above and below each link while the two rows are 8px apart. | At 390: links at y 498.8–531.2 and 539.2–571.6 (gap 8.0px); the second link’s hit area starts at 525.2. `elementFromPoint` at y 529.2 — 2px above the first link’s bottom — returns **“Platform changes at Amsterdam Centraal”**. At 768 the single-line link is 16.2px tall, so the overlap is 6px of a 16px target. `.logs/p2-controls.out` | **FAIL** |
| 2.3 | 5, 7 | **The floating dock covers controls at the bottom of a short screen.** At 320×568 it sits over the sort almost completely; at 768×844 it covers the first card’s favourite button. | 320×568: dock 502–556, sort 501.6–545.6 (44 of 44px covered), Options 553.6–597.6 (top 2.4px covered). 768×844: dock 778–832, “Favourite this journey” 773.4–817.4 (38.6 of 44px covered). 390×844: no overlap at rest. `.logs/p2-dock.out` | **FAIL** |
| 2.4 | 1, 7 | **On 320px the results bar is five rows tall, and no journey is on the first screen of a small phone.** The bar’s chips stop sharing a row below 360 and the sort takes a row of its own. | Bar height: **326.8px** at 320, **170.8** at 360/390/430, **118.8** at 768, **66.8** at 1024+. First card top: **764.6** (320), 608.6 (390), 524.2 (768), 472.2 (1024+). At 320×568 the first card starts **196.6px below the fold** — the initial screen is head, planner, five chip rows, sort and dock only. | **FAIL** |
| 2.5 | 6, 10 | **The loading card declares `aria-busy` but the attribute is dropped, and neither the result count nor the no-match card is announced.** `Card` forwards only `class`/`style`/`onClick`, so the ARIA prop never reaches the DOM. When a filter empties the list, nothing is announced either. | Planning card rendered as `<section class="card planning">` — attributes `[class]` only, height 150.4px; its `role="status"` still reads “Planning your journey”. No-match card: `role=null`, `aria-live=null`, headings `[]`, title is a `SPAN`; “0 of 11 shown” has no `aria-live`; the only live region on the page is the empty toast region. `.logs/p2-controls.out`, `.logs/p2-planning.out` | **FAIL (minor)** |
| 2.6 | 5, 10 | **The sort is the one control whose focus is a 1px border colour instead of the shared 2px coral ring.** `.select:focus` sets `outline: none` and a border colour, overriding the global `:focus-visible` rule. | Rest border `rgb(205,199,184)`, focused `rgb(24,24,27)`; `outline: none 3px` in both; chips/buttons/links get `solid 2px rgb(255,126,103)`. The border change is visible, so this is a consistency failure rather than an invisible focus. `.logs/p2-controls.out` | **FAIL (minor)** |
| 2.7 | 3, 5, 10 | **Every result repeats three context-free control names, and a card has no heading of its own.** A screen reader’s link list is eleven identical entries and the page has one H1 only. | “Journey details” ×11, “Show on map” ×11, “Favourite this journey” ×11; `main` headings = `[H1 “Journey results”]`; cards are `<article>` with the times in spans. `.logs/p2-controls.out` | **FAIL (minor)** |
| 2.8 | 4, 9 | **Contrast, dark and Dutch pass.** 77 leaf text samples per width, none under 4.5:1 (3:1 for large); dark and NL change no geometry except text length. | 0 failures at 320/390/768/1024/1440/1920 and in dark-390/dark-1440/nl-320/nl-1440. Page height dark 390 = **4629** (light 4629), dark 1440 = **4084** (light 4084). NL 1440 = 4084; NL 320 = **5127** vs 5087 EN (+40px), one card 394.6 vs 370.4 (+24.2) and every other card identical. `.logs/p2-audit.json` | **PASS** |
| 2.9 | 1, 2, 7 | **One rail, one rhythm, no overflow, sticky head.** Every block starts and ends on the content column; no element leaves it at any width; no off-scale spacing outside the planner rail’s centring offsets. | `main`, planner, cards and bar share x and right edge at every width (x 12 at 320–1024, 296 at 1280, 336 at 1440, 576 at 1920); card gap 16px inside a list and 24px between sections; document `scrollWidth == clientWidth` at all nine widths and in the dark/NL/no-match states; header `position: sticky`, y=0 at both scroll extremes; last card clears the dock by 13.7–14.3px at the page end. Off-scale values: only the rail nodes’ −7/−5px centring margins (the hidden `.sr-only` boxes’ −1px and native `<option>` padding were excluded as non-layout). | **PASS** |
| 2.10 | 11 | **No application console errors or failed assets.** The one failed request is the external approximate-location lookup, which the app survives. | 0 React warnings/errors; 0 failed local assets; `429 https://ipwho.is/` once on the 320 run, with the page fully drawn and no overflow. The dev Review button was excluded throughout. `.logs/p2-audit.json` | **PASS (noted)** |
| 2.11 | 5 | **The controls do what they say.** Sort, filters, saving, the options disclosure and both dialogs were pressed and their consequence recorded. | Latest departure moves the first card 08:00 → 09:00 (11 cards); Direct journeys only 11 → 9; Save this search `aria-pressed` false → true, 1 stored, then back to 0; Options `aria-expanded=true` and the next Tab lands on the walking slider; Start chip Walking → Bicycle; When → Arrive by changes “Leave:” to “Arrive:”, Now resets; overlay click and X close both close; Escape closes. `.logs/p2-actions.out`, `p2-controls.out` | **PASS** |
| 2.12 | 6 | **The empty and no-match states are present and read correctly.** No search, and a filter that removes all 11, each have their own answer and a way out. | No search at 320/1440: “No search has been run in this browser yet.”, the planner CTA, document height 900, no overflow. Ferry filter: “0 of 11 shown”, “11 journeys were planned for this search…”, both “Reset all filters” and “Reset result filters”, “Adjust travel preferences” and “Try one hour later”. | **PASS** |

### Not measured (stated, not passed)

- **Hover, pressed and disabled appearance for every control (5).** Only a chip’s states were read (hover: border darkens and `scale(1.02024)` with a −4px lift; pressed: `scale(0.97)`), plus the card lift seen as a hovered card’s 4px `translateY` — which is also why a 20px gap appears between the first two cards when the pointer rests over the second; the un-hovered gap is 24px.
- **Contrast over a photo background (4).** The 77 samples are on the default cream/obsidian surfaces; elements painted over a user photo were skipped, not passed.
- **Tab order from the document’s first element (10).** The recorded order starts at the From row because the session’s focus is in `main` after planning; the header’s own order was not re-recorded here.
- **The loading card at DPR 2 and 3 (6).** Geometry was read at DPR 1 only; the 150.4px card and its 260ms window were captured in one run.
- **Motion timing (5, 6).** Only start and end states were measured; no frame timing.

---

## 3. Network map — `/map`

**Status:** done — findings recorded, no fixes made. Six things were not measured; see “Not measured” below.
**Pop-ups opened here:** none (28 opens from the stop picker, not here).
**States:** with a search; without one; a journey's stops highlighted; a stop highlighted; every
mode filter; wide and narrow canvas; 500px-tall viewport; dark; Dutch; every width at 900 high.

**Checks:** 1–11. Specifics: map canvas size at every width, labels legible, controls over the
canvas, pin targets, the way back, the canvas against the page rail.

**Not verifiable here:** L1 screen reader · L2 real device/notch/keyboard · L3 touch · L4
Safari/Firefox · L5 performance · L6 live network · L7 install · L8 user testing (definitions at the
top). **This page especially:** L1 for the map’s single `role="img"` description, L3 for pinch,
pan and tapping a 3–4px dot. **You should check:** VoiceOver on the canvas, and a real pinch at 390.

### Run log

| Run | Date | Scope | Outcome |
|---|---|---|---|
| 1 | 2026-10-19 | 9 widths × 900, plus 390×500 and 768×500; all-routes and five mode filters; journey and stop highlight at 390/1440; dark-390/1440; nl-320/1440; keyboard, console, network | **complete — 5 findings** |

Raw data: `.logs/p3-audit.json`; probes `.logs/p3-probe2.out`, `p3-util.out`, `p3-audit.cjs` output.
Screenshots: `.logs/p3-{320,390,768,1440}.png`, `p3-stop-{390,1440}.png`, `p3-dark-{390,1440}.png`,
`p3-short-768x500.png`, `p3-modes-390.png`.

### Findings

| # | Count | Finding | Measurement | Verdict |
|---|---|---|---|---|
| 3.1 | 1, 7 | **The map screen is a 16:9 plate at every width — including phones — and the square drawing fills only ~37% of it.** `NetworkMap` always adds `map-canvas--widget`, so the widget’s `aspect-ratio: 16/9` wins over the screen’s phone-square rule. The drawing is letterboxed with empty plate on both sides. | Aspect `16 / 9` at all nine widths. Canvas: 262×147.4 (320), 332×186.8 (390), 372×209.3 (430), 710×399.4 (768), 966×543.4 (1024), 1018×572.6 (1440/1920). Network width: 95.6/262 (36.5%), 121.5/332 (36.6%), 261.1/710 (36.8%), 355.9/966 (36.8%), 375.1/1018 (36.8%); at 390 the empty plate is 98.7px left + 111.8px right, at 1440 301.2 + 341.6. | **FAIL** |
| 3.2 | 3 | **Names render at 3.78–4.8px on phones — unreadable — and only five of 54 stops are named. Amsterdam and Utrecht are never among them, even when they are the selected journey.** | Rendered label font: **3.78px** (320), 4.8 (390), 5.39 (430), 10.33 (768), 14.08 (1024), 14.84 (1440/1920); 9.05 at 768×500. All-routes labels: Rotterdam Centraal, Den Haag Centraal, Zwolle, Alkmaar, Eindhoven Centraal (5 of 54); the journey’s selected stops are Utrecht Centraal and Amsterdam Centraal (`g.map-stop--selected` titles) and neither is labelled. Bus labels do include both; mode filters change the five. | **FAIL** |
| 3.3 | 5, 10 | **The 54 stop dots are clickable but 2.9–4.15px across on phones, unreachable by keyboard, and absent from the accessibility tree.** The SVG is a single `role="img"`, so its children are presentational; the map offers no list, zoom or pan to reach a stop another way. | Dot diameter: **2.91px** (320), 3.69 (390), 4.14 (430), 7.95 (768), 10.83 (1024), 11.41 (1440/1920). `0` focusable stops in the canvas; 16-tab run goes skip → back → logo → alerts → six chips → dock, never a stop. Pointer click on a dot does navigate (`#/stops/maastricht`). Accessible name is only “Network map: all routes, 54 stops”; `0` controls inside the canvas. | **FAIL** |
| 3.4 | 5, 7 | **On a 500px-tall viewport the floating dock sits over the map and covers stop dots that then cannot be tapped.** | At 390×500: canvas 321.8–508.5, dock 434–488, **6 of 54** dots under the dock. At 768×500: canvas 269.8–619.8, dock 434–488, **7** dots under it. At 390×844 and 1024×900: **0**. The dock is fixed, so those dots stay covered at every scroll position. | **FAIL** |
| 3.5 | 7 | **At 1024×900 the page is 10px taller than the viewport, so that one width gains a scrollbar; every other width fits exactly.** | Document height **910** at 1024×900 against 900 at 320/360/390/430/768/1280/1440/1920 (same 900 viewport). At 1024 the map card ends at 830.2 and the shell's 80px dock reserve makes the document 910; at 1280 the sidebar replaces the dock, the reserve disappears, and the 673.6 card ends inside a 900 page. | **FAIL (minor)** |
| 3.6 | 4, 9 | **Contrast, dark and Dutch pass.** The drawing’s ink is measured against its own land and water, and both appearances and both languages keep the same geometry. | Label ink `rgb(63,63,69)` on land `rgb(243,241,234)` = **9.25:1**, on water `rgb(225,234,223)` = **8.48:1**; routes `rgb(24,24,27)` on land = **15.68:1**; dark labels **12.28:1** / **11.63:1**. Canvas identical in dark (332×186.8 / 1018×572.6) and NL (262×147.4 / 1018×572.6); page 900 at both. 0 label overlaps and 0 labels outside the canvas at every width. | **PASS** |
| 3.7 | 5 | **The mode filters work and say what they changed.** Six chips, all 44px high; 3 rows at ≤430 and 2 rows from 768; the selected chip is filled; the SVG’s accessible name and stop count update with the mode. | Bus 28 stops / 5 labels; Train 39/5; Tram 13/5; Metro 10/5; Ferry 4/4; All 54/5. Aria examples: “Network map: Bus routes only, 28 stops” … “Network map: all routes, 54 stops”. | **PASS** |
| 3.8 | 6 | **The journey and stop states exist and highlight the right things.** | At 390: “Showing your journey — Amsterdam Centraal → Utrecht Centraal” card 366×131.1, 1 coral route, 2 selected dots; “Showing this stop — Utrecht Centraal” 366×100.8, 1 selected dot. At 1440 both cards 1052 wide (100.8 high). Their links are 44px tall (“Journey details” 147.7×44, “Stop page” 112×44). No search state has no “Showing” card. No loading or error state exists — the map is local data, no async fetch. | **PASS** |
| 3.9 | 11 | **No application console errors or failed assets.** The only failed request is the external approximate-location lookup, which the page survives. | 0 React warnings/errors, 0 failed local assets; `429 https://ipwho.is/` once. No horizontal overflow at any width (`scrollWidth == clientWidth` 320–1920). | **PASS (noted)** |
| 3.10 | 1, 2 | **One rail and one rhythm.** Page head, card, chip grid and canvas share the content column; there is no horizontal overflow, and the card’s inner inset is constant. | Content x=12 at 320–1024, 296 at 1280, 336 at 1440, 576 at 1920; canvas sits 17px inside the card’s left and right edges (16px padding + 1px border) at every width; card width 296/366/744/1000/972/1052; chip gap 8px, card padding 16px. | **PASS** |
| 3.11 | 10 | **The controls that do exist are keyboard-reachable with the shared focus ring.** | Skip link → back 44×44 → logo 56×56 → alerts 67×36 (its `::after` expands the target to 48 high) → six chips 162×44 with `solid 2px rgb(255,126,103)` → dock. No control inside the map. | **PASS** |

### Not measured (stated, not passed)

- **Pan and zoom (5).** The map screen has no pan or zoom controls and no drag gesture; there was nothing to test. The stop picker (27) has them, and is not this screen.
- **Pins (5).** The map screen draws stop dots, not pins; “every pin selected” belongs to 27 and was not exercised here.
- **Loading, error and empty states (6).** The map reads local data synchronously; these states do not exist. The “Showing” cards are the only variants.
- **Hover and pressed appearance of a dot (5, 10).** The native `<title>` tooltip was not captured, and it is unreachable on touch.
- **DPR 2 and 3, and 1920×1080 (1, 3).** Geometry was read at DPR 1 and 900 high; 1920×1080 was not run separately.
- **User text scaling / browser zoom (3).** Labels are SVG user units; page zoom at 150–200% was not measured.

---

## 4. Stations & stops — `/stops`

**Status:** done — findings recorded, no fixes made. Six things were not measured; see “Not
measured” below.
**Pop-ups opened here:** 13 (audited in its own section)
**States:** full list (61); search; Options open with type/mode/region filters; favourites and
favourites-only; no matches; nearest-first with and without a location; long custom names; long
list and Show more; loading skeleton; light; dark; English; Dutch; short viewports.

**Checks:** 1–11. Specifics: row heights and centres, the heart column, filter row wrapping, the
count line, list truncation, empty-result state, keyboard order and focus, pop-up 13.

**Not verifiable here:** L1 screen reader · L2 real device/notch/keyboard · L3 touch · L4
Safari/Firefox · L5 performance · L6 live network · L7 install · L8 user testing (definitions at the
top). **This page especially:** L1 for the Plan sheet and the no-match state, L2 for the sheet’s
bottom edge on a notched phone, L6 because the default “Nearest” order comes from an IP estimate.
**You should check:** VoiceOver in pop-up 13, and the sheet on an iPhone with a home indicator.

### Run log

| Run | Date | Scope | Outcome |
|---|---|---|---|
| 1 | 2026-10-19 | 9 widths × 900 high; 320/390/768/1440 short heights; search, options, favourites, no match, no location, long name, long list, skeleton; pop-up 13 at 320/390/1440; keyboard, contrast, dark, NL, console, network | **complete — 6 findings** |

**What the numbers are measured against.** The clock is fixed at **2026-10-19 10:00** with
`clock.setFixedTime`, so the departure rows and the 61-stop count do not move between runs. The
nine-width run uses the live IP estimate, which in this sandbox resolves about **8,700km** away
(see 4.7); the state, parity and dialog runs seed the estimate at **Utrecht (52.0907, 5.1214)** or
block both lookups, so the list under test is the same one every time. Raw data:
`.logs/p4-audit.json`, `p4-audit2.json`, `p4-parity.json`; probes: `p4-batch.cjs`, `p4-heights.cjs`,
`p4-dock-exact.cjs`, `p4-controls.cjs`, `p4-dialog-sizes.cjs`, `p15-320.cjs`.

### Findings

| # | Count | Finding | Measurement | Verdict |
|---|---|---|---|---|
| 4.1 | 5, 8, 10 | **Pop-up 13 never takes focus, never traps it, never gives it back, and the page behind still scrolls.** `role="dialog" aria-modal="true"` is declared, but the active element stays on the Plan button that opened it; the first Tab lands on the next stop card’s link *behind* the sheet. Escape closes without returning focus, and X or an overlay tap drops focus to `<body>`. A wheel over the open sheet moves the document. | At 320/390/1440 `focusInside=false`; first Tab → “Alkmaar” (a card link behind) at 320 and 1440. Wheel 300px with the sheet open: `scrollY` 220 → 520 at both widths; `body` computed `overflow: visible`. After Escape focus is “Board” (a card link), after X/overlay `<body>`. Sheet: 320×231.8 at 320 (bottom 898.7 of 900), 390×138.9, 560×138.9 centred at 1440; `scrollHeight == clientHeight`. `.logs/p4-audit.json`, `.logs/p4-dialog-sizes.cjs` | **FAIL** |
| 4.2 | 5, 7 | **The fixed dock sits over card controls at rest on short screens and at 1024.** The page scrolls, so they are reachable later, but at first paint they are covered. | 390×700: dock **634–688**, the first card’s Plan button **659.4–703.4** — **28.6 of 44px** covered. 390×500: dock 434–488, first card’s name link 480.7–498.9 — 7.3px covered. 1024×900: two card controls (“Board”, “Plan”) under the dock at scroll 0. 390×900 and all wider sidebar widths: **0** covered at scroll 0 and **0** at page end. `.logs/p4-heights.cjs`, `.logs/p4-dock-exact.cjs`, `.logs/p4-audit.json` | **FAIL** |
| 4.3 | 1, 3 | **A long or custom stop name breaks the card head: the heart drops below the name and meta, and the dialog names the stop differently.** At 320 the name is two lines (262×36.4), the meta is two lines (32.4) and ends at 566.9; the heart sits at **y 578.9**, on a row of its own, so the top-right of the card is empty, the mode chips start at 630.9 and the card is **376.4** high against **259.6** for a normal card. The distance wraps between the number and its unit (“810” / “m”). The dialog title uses the base name: the card reads **“Work”**, the sheet **“Plan with Utrecht Centraal”**. | 320: link 262×36.4 at y 494; meta 262×32.4 at y 534.5–566.9; heart 44×44 at x 247, y 578.9–622.9; modes y 630.9; card 296×376.4. Custom-name card at 390 shows the same dropped heart. Card “Work” → sheet title “Plan with Utrecht Centraal”. `.logs/p4-audit2.json`, `.logs/p4-custom-dialog.cjs` | **FAIL (minor)** |
| 4.4 | 3, 6, 10 | **The no-match state is not announced or headed, and its instruction describes filters when only a search is on.** The title is a `SPAN` in a card with no role and no live region, so the count going to 0 and the card appearing are silent; “0 of 0 stops” is drawn above it. The fix is labelled “Switch one of these back on and the list fills up again”, but the only thing switched on is the query “zzzz” — nothing is filtered. | `role=null`, `aria-live=null`, headings `[]`, title element `SPAN`; count line “0 of 0 stops”; card fixes `[“Search the whole network”]`; pressing it clears the query and restores 5 cards. Copy: “SWITCH ONE OF THESE BACK ON AND THE LIST FILLS UP AGAIN”. `.logs/p4-audit.json` | **FAIL (minor)** |
| 4.5 | 5, 10 | **The search field and sort select are the two controls that lose the shared focus ring.** `.input:focus` / `.select:focus` set `outline: none` and change only the 1px border, overriding the global 2px coral `:focus-visible` ring that every button and link keeps. | Focused input: `outline: none 3px`, border 1px `rgb(60,58,58)`, `box-shadow: none`; a focused card link: `solid 2px`, offset 2px. Sort select uses the same rule. This repeats 2.6 on this screen. `.logs/p4-audit2.json` | **FAIL (minor)** |
| 4.6 | 1, 8 | **The bottom sheet ignores the bottom safe area, and the header ignores the top one.** `viewport-fit=cover` is set, but `.modal` has no `env(safe-area-inset-bottom)` while the dock and toasts do; the sheet ends **1.3px** above the viewport bottom. The header’s controls start 20px from the top with no top inset. Not reproduced on a notched device. | Sheet bottom 898.7 at 320 and 390 (viewport 900); `.modal` padding fixed; `.app-header` controls top 20; `.app-dock` uses `max(12px, env(safe-area-inset-bottom))`. `.logs/p4-audit2.json`, CSS. | **NOTE** |
| 4.7 | 5, 6 | **“Nearest” is the default sort even when the IP estimate is thousands of kilometres away, so the first screen is an arbitrary five stops.** The distance line is honest about it, and the list really is ordered by distance — from the data centre. | Fresh 390/1440 load: first five Leeuwarden **8,742km**, Alkmaar 8,744, Haarlem 8,761, Zaanse Schans 8,762, Zaandam 8,765; origin line “Nearest first, from an approximate IP location — it can be off by a lot.” With the estimate seeded at Utrecht the order is Domtoren **10m**, Utrecht Centraal 810m, Vaartsche Rijn 1.3km. `.logs/p4-audit.json`, `.logs/p4-parity.json` | **NOTE** |
| 4.8 | 6 | **The loading skeleton is always four cards, whatever the column count.** At 1024 it is one row plus one orphan while the first batch is fifteen. The wait is 360ms, so this is polish rather than a defect. | `.skeleton-grid` children: **4** at 390, 768 and 1024; settled cards 5/10/15; `aria-busy=true` while loading, count line hidden. `.logs/p4-audit.json`, `.logs/p4-audit2.json` | **NOTE** |
| 4.9 | 1, 2, 7 | **One rail, one grid, no overflow, no clipping.** Cards, filter card and page head share the content column at every width; row heights inside a row are equal; the heart column is one x. | Columns **1/1/1/1/2/3/3/3/3** at 320/360/390/430/768/1024/1280/1440/1920; cards **5/5/5/5/10/15/15/15/15**; document heights **1996/1996/1996/1967/1872/1872/1874/1824/1824**. Rail x 12..378 at 390, 336..1388 at 1440; grid 296/366/406/744/1000/972/1052/1052 wide with card widths 296/366/406/364/322.7/313.3/340/340; content inset 17px; grid gap 16px. At 390 five rows, each **259.6** high; heart x **317** in every row. 0 clipped text nodes and `scrollWidth == clientWidth` at all nine widths, in dark and NL. `.logs/p4-audit.json`, `.logs/p4-parity.json` | **PASS** |
| 4.10 | 4, 9 | **Contrast, dark and Dutch pass, and the geometry is identical.** | 0 text/background pairs under 4.5:1 (3:1 large) across **7** combinations: 320/390/1440 light-EN, 390/1440 dark-EN, 320/1440 light-NL (14–15 distinct styles each). Placeholder 5.7:1 light, 6.24:1 dark. With one fixed origin: 320 EN/NL **1906/1906** high, 390 light/dark **1874/1874**, 1440 light/NL/dark **1856/1856**, identical card heights. `.logs/p4-audit2.json`, `.logs/p4-parity.json` | **PASS** |
| 4.11 | 3, 5 | **Every control pressed did what it says.** | Sort → `?sort=name` and connections order changes to Amsterdam Centraal first, Nearest drops the param; heart `aria-pressed` false → true and `favourites` stores `["den-bosch"]`; card opens `#/stops/den-bosch`, back returns to `#/stops`; Board opens `#/departures?stop=den-bosch`; Options: Station → 45 results, +Tram → 3, region → 0, Clear filters → 61; search “Utrecht” → 6 results, “SHOW 1 MORE” → 6 of 6; favourites-only 2 → unheart → 1, stored 1; pop-up buttons 44px (320 footer stacks, 154.5 and 137.3 wide); Plan from here → `?from=…&pick=to`, Plan to here → `?to=…&pick=from`. `.logs/p4-controls.cjs`, `.logs/p4-batch.cjs`, `.logs/p4-audit.json` | **PASS** |
| 4.12 | 6, 10 | **The states and the tab order exist and read correctly.** | Skeleton → list (5 of 61, busy cleared); empty state with a working fix; favourites-only; no-location gives City order, a disabled Nearest option and “Sorted by City. Turn on location for nearest-first.”, no distances; long list 5 → 10 with Show more, and the sentinel carries it on to 20 when the bottom is reached. Tab order: skip → logo → alerts → Departure boards → search → sort → Options → card link → heart → Board → Plan → next card; 44px targets (the 18.2px name link expands to 46px via `.tap-target::after`); dock clears the last control at page end. `.logs/p4-audit.json`, `.logs/p4-audit2.json` | **PASS** |
| 4.13 | 11 | **No application console errors or failed assets.** The only failed request is the external IP lookup, which the app survives through its second provider. | 0 React warnings/errors, 0 failed local assets; `429 https://ipwho.is/` once and `freeipapi.com` then supplies the estimate; no overflow at any width. The dev Review button was excluded. `.logs/p4-audit.json` | **PASS (noted)** |

### Verified to hold

- **Filter card:** 220.1 high at 320–430 (search, sort + Options, origin line) and 125 at 768+, where search and sort share one row; `Options` carries `aria-expanded` and `aria-controls`, and its count appears only when a hidden filter is on (1 after Station, 2 after region).
- **Count line:** “5 of 61 stops” at the phone batch, “10 of 61” at 768, “15 of 61” at 1024+, and “0 of 0” only in the no-match state; the number is the shown batch, not the total (the Show-more label names the rest: “SHOW 1 MORE” for 6 matches).
- **No-match fix:** “Search the whole network” clears the query and restores five cards; with a hidden filter it also offers “Clear filters”.
- **No location:** `sort=city`, `Nearest` disabled, no distance suffix, first five ’s-Hertogenbosch, Alkmaar, Almere Centrum, Amersfoort Centraal, Amstelveen Busstation.
- **Favourites:** hearts lead the list; unhearting inside favourites-only removes the card and leaves the stored list at one.
- **Show more:** 5 → 10 at 390, 15 → 30 at 1440; the sentinel also loads the next batch when scrolled to, so the button is a second way to the same batch, not the only one.
- **Long list:** all 61 stops reachable; page grows to 3,252px at 390 and 3,268px at 1440 without overflow; the dock clears the last control at page end.

### Not measured (stated, not passed)

- **DPR 2 and 3 (1, 3).** Geometry was read at DPR 1; the protocol’s 2×/3× pass was not run.
- **Hover, pressed and disabled appearance (5).** Only resting, focused and click consequences were captured; the disabled Nearest option was read, not painted.
- **Every state at 500/700 high (1, 7).** Short viewports were measured on the base list at 390/768/1440, not on search, favourites or the dialog.
- **Energy saver (6).** The skeleton’s no-placeholder branch was not exercised; the battery state was not mocked.
- **1920×1080 (1).** 1920 was run at 900 high only.
- **User text scaling / browser zoom (3).** 150–200% zoom was not measured.

---

## 5. Stop detail — `/stops/:stopId`

**Status:** done — findings recorded, no fixes made. Ten issues; six things were not measured.
**Pop-ups opened here:** 13 (recorded as 13.1 and re-confirmed on this page)
**Instances:** 61; all 61 swept at 390 and 1440 for document height, overflow, clipping, heading
coverage, board rows, facilities and map labels. Eight have no board (six landmarks plus Enschede
and Eindhoven Strijp-S); 20 have no nearby stop; 35 have no alerts.
**States:** with facilities (61/61); without facilities (none in the data, so not applicable); with
and without alerts; full and empty board; pinned and unpinned; long and custom name; missing stop id
(cold load, history and client transition); light; dark; English; Dutch; 320–1920 wide.

**Checks:** 1–11. Specifics: page-head title on a phone vs desktop, the three head controls, the
facilities rows, the departure list, the map/plan controls, missing-id fallback and pop-up 13.

**Not verifiable here:** L1 screen reader · L2 real device/notch/keyboard · L3 touch · L4
Safari/Firefox · L5 performance · L6 live network · L7 install · L8 user testing (definitions at the
top). **This page especially:** L1 for the facilities and board reading order, L3 for the map dots
and Plan controls. **You should check:** VoiceOver on a stop with facilities and on the empty-board
station, and a real tap on the map dots.

### Run log

| Run | Date | Scope | Outcome |
|---|---|---|---|
| 1 | 2026-10-19 | 61 instances at 390/1440; nine widths on Amsterdam; short viewport; unknown cold/history/client transitions; pop-up 13; keyboard, contrast, dark, NL, console; map, lines, board and empty-station states | **complete — 10 findings** |

**What the numbers are measured against.** Every layout number is taken after
`document.fonts.ready`; the 768 page is **2,573px** once the webfont has settled (a 500ms-only read
before it settled gave 2,767px, so the later number is the reported one). The board's relative times
are not frozen, so row labels move between runs; heights, counts and targets do not. Raw data:
`.logs/p5-sweep.json` (61 pages × 390/1440), `p5-interactions.json`, `p5-contrast.json`,
`p5-heights.json`; screenshots `p5-amsterdam-390.png`, `p5-dark-390.png`, `p5-custom-390.png`,
`p5-empty-station-390.png`, `p5-landmark-390.png`, `p5-hooks-crash.png`.

### Findings

| # | Count | Finding | Measurement | Verdict |
|---|---|---|---|---|
| 5.1 | 6, 11 | **Both directions into and out of an unknown stop unmount the app.** From a valid stop, changing the hash to `#/stops/does-not-exist` throws “Rendered fewer hooks than expected” and leaves `<main>` empty; from a cold unknown page, opening a valid stop throws “Rendered more hooks than during the previous render” and blanks again. A cold unknown load does render the fallback, with H1 “Unknown stop” and a working All stations & stops button — the state exists, the transition to it does not. The fallback’s empty-state title is also an H3, skipping from H1. | `pageerror` “Rendered fewer hooks…” valid→unknown and “Rendered more hooks…” unknown→valid; `bodyLength` 87, no `<main>`; cold fallback text “This stop is not in the network…”; headings H1 Unknown stop, H3 Stop not found. `.logs/p5-interactions.json`, `.logs/p5-hooks-crash.png` | **FAIL** |
| 5.2 | 3, 10 | **At 720px and up the page loses its H1, and a custom name leaves no visible official name.** `.page-head--mobile-title .page-head__title` is `display:none`, so the document’s only H1 is gone at 720/1024/1440/1920 and the generic document title remains “OVVO — Dutch public transport journey planner”. With the stored name “Work”, the phone H1 reads Work, while “Utrecht Centraal · Utrecht · stop code UTC” is a **1×1 sr-only** line. Nothing visible identifies the station on desktop, and nothing visible carries the official name at all when a nickname is set. | 390: H1 block, 366×20.8 at y96; 720/1440: H1 `display:none`, 0×0; `document.title` unchanged at every width. Custom 390: H1 “Work”; description `.sr-only`, 1×1. `.logs/p5-contrast.json`, `.logs/p5-interactions.json`, `.logs/p5-custom-390.png` | **FAIL** |
| 5.3 | 3, 7 | **The map is smallest on a tablet and its labels are 6–10px.** At 768 the plate is **330×248**, labels **6px**, dots **5.9px** — smaller than the 390 phone map. At 390 it is 332×332 with 9px labels and 7.9px dots; at 1440, 484×363 with 10px labels and 8.7px dots. Fourteen label pairs overlap across the 61 pages (two on the worst page); Rotterdam Blaak/Markthal overlaps by 26.6×6.0 at 1440 and Rotterdam Centraal/Schiedam Centrum by 12.4×10.0. | 768: map 330×248, label 12×6, dot 5.9; 390: 332×332, 15×9, 7.9; 1440: 484×363, 17×10, 8.7; 14 overlap pairs at 390 and 14 at 1440, maximum 2 per page, 0 clipped labels. `.logs/p5-sweep.json`, `.logs/p5-contrast.json` | **FAIL** |
| 5.4 | 1, 3, 7 | **The two-column grid balances by source order rather than by weight, and the line list collapses at 320 in Dutch.** The short column ends **792px** above the long one at 1440 (1,339 vs 2,131) and **877px** above at 768 (1,452 vs 2,329), leaving a blank half-page under Alerts. At 320 the Dutch lines card is **2,821.2px** for 16 rows — **135.3px** per row with only **60px** of text — against 2,238.5px (102.9 row, 84.3 text) in English; the page grows from 4,984 to **5,567px**. | 1440: left 1,339, right 2,131; 768: left 1,452, right 2,329; 320 NL line card 2,821.2, 16 rows × 135.3, text 60; EN 2,238.5, 102.9, 84.3. `.logs/p5-contrast.json`, `.logs/p5-sweep.json` | **FAIL** |
| 5.5 | 5, 7 | **The fixed dock sits over page controls at first paint on short screens.** At 390×700 the dock is **634–688** and covers the 44px “Open the full board” control at **652–696**; at 720×900 it overlaps four controls (two line rows and two Plan actions), and at 768/1024×900 three. The page scrolls, so they are reachable later, but they are covered when the page opens. | 390×700: dock 634–688, link 652 h44. 720×900: dock 834–888, four rows at 756/809/851/870. 768/1024×900: three controls. 1440×900: no dock. `.logs/p5-interactions.json` | **FAIL** |
| 5.6 | 9, 10 | **Four visible or spoken strings stay English on the Dutch page.** The primary head action reads **PLAN**, the map door reads **OPEN MAP**, the map’s `aria-label` is “Schematic local view of Amsterdam Centraal and the stops around it”, and every nearby `aria-label` is “Open …”. `Plan` and `Position on the map` have Dutch translations in `i18n`, but the rendered strings are literals. | NL 320 and 1440: buttons “PLAN”, link “OPEN MAP”, SVG aria English, nearby aria “Open Amsterdam, Dam”; doc 5,567 at 320 vs 4,984 EN (content length, not geometry); 2,344 vs 2,327 at 1440. `.logs/p5-contrast.json`, `.logs/p5-light-nl-320.png` | **FAIL (minor)** |
| 5.7 | 3, 6 | **Two served stations are described as walking landmarks.** Enschede and Eindhoven Strijp-S are type **Station**, yet both Lines cards say “This is a walking landmark: it is reached on foot from the nearest stop rather than by a service” and both boards say “No departures right now”. Enschede additionally says “No other stop is within walking distance”, while Strijp-S lists Eindhoven Centraal at “17 min walk”. The branch is on `lines.length === 0`, not on stop type. | Enschede: type Station, facilities present, boardRows 0, nearby 0, copy “walking landmark”; Strijp-S: type Station, boardRows 0, nearby “17 min walk”. `.logs/p5-interactions.json`, `.logs/p5-empty-station-390.png` | **FAIL (minor)** |
| 5.8 | 3 | **Ferry platforms render as “PPier 1”.** At 320/390/768 the platform label is `font-size:0` and its `::before` supplies a `P`, while the value is already “Pier 1” and the flex gap is 0, so the sighted text is **PPier 1** or **PPier 2**. At 1440 the label is visible as “PLATFORM Pier 1”; the `title` is always correct. | 320/390/768: label 0px, 7×14.8, `::before` “P”, gap 0 → PPier 2 on the sampled row; 1440: 11px “PLATFORM Pier 2”. `.logs/p5-board-390.png` | **FAIL (minor)** |
| 5.9 | 10 | **Five board links are all named “Details”.** The tab order passes five identical links with no `aria-label`, so the link list cannot say which journey each one opens. | Five `A` elements, text “DETAILS”, aria null; all five reached in the recorded tab sequence, before “Open map”. `.logs/p5-interactions.json` | **FAIL (minor)** |
| 5.10 | 5, 8, 10 | **Pop-up 13 still never takes or traps focus, and the page behind scrolls.** At 390 the active element stays on the Plan button that opened it; the first Tab lands on the heart **behind** the sheet; a 300px wheel moves `scrollY` 0 → 300; Escape leaves focus on the heart rather than the trigger. This repeats 13.1; 320 and 1440 were recorded there with the same result. | `focusInside=false`, active `BUTTON:Plan`, first Tab label “Remove Amsterdam Centraal…”, scroll 0→300, Escape focus “Remove Amsterdam Centraal”. Sheet 390×138.9 at y759.9. `.logs/p5-interactions.json`, 13.1 | **FAIL** |
| 5.11 | 3, 6, 10 | **The page keeps its six sections and its heading order on a phone, and the content states exist.** | At 390: H1 plus six H2 in order — Stop information, Next departures, Alerts at this stop, Position on the map, Lines calling here, Nearby stops. Facilities present on **61/61**; board rows on 53/61 (8 empty: 6 landmarks plus the two stations in 5.7); nearby present on 41/61 (20 empty); alerts on 26/61 (35 empty). Page 4’s H1 is intact at 390/1440. `.logs/p5-sweep.json` | **PASS** |
| 5.12 | 1, 7 | **One rail, one grid, no horizontal overflow and no clipped text.** | Nine widths: 320/360/390/430/768/1024/1280/1440/1920; `scrollWidth == clientWidth` at every one; 0 clipped text at 390/1440 across **61/61**; one column to 430 and two from 768; rail x12 at 390, x336 at 1440; cards 296/336/366/406/364/492/478/518/518; gaps 16. Document heights 4,984/4,359/4,138/3,902/2,573/2,373/2,323/2,327/2,327. `.logs/p5-sweep.json`, `.logs/p5-contrast.json` | **PASS** |
| 5.13 | 4, 9 | **Contrast, dark and the map’s own colours hold, and the dark geometry is identical.** | 0 text/background failures in seven combinations (20–21 samples each): 320/390/1440 light-EN, 390/1440 dark-EN, 320/1440 light-NL. Map label 9.25:1 on land and 8.48:1 on water in light; 12.28:1 and 11.63:1 in dark. Dark page heights 4,138 at 390 and 2,327 at 1440, the same as light. The Dutch page is longer by content (5.4, 5.6), not by a rule change. | `.logs/p5-contrast.json` | **PASS** |
| 5.14 | 5, 6, 10, 11 | **Every measured control does what it says, and the valid-stop console is clean.** | Plan opens 15 (focus failure recorded in 5.10); heart 44×44, `aria-pressed` false→true and stores the id; pin 44×44, true and stores it; both survive reload; Open the full board → `#/departures?stop=…`; Alerts → `#/disruptions?line=…`; line row → `#/departures?line=…&stop=…`; nearby → the stop; Open map → `#/map?stop=…`; a map dot → its stop. Plan 79.5×44, heart/pin 44; every measured tab stop has a solid 2px ring. 0 console errors on valid stops; the only page errors are 5.1. | `.logs/p5-interactions.json` | **PASS (exceptions 5.1, 5.10)** |

### Verified to hold

- **Page head on a phone:** H1 **366×20.8** at y96; Plan **79.5×44**, heart and pin **44×44**, all on the start edge; at 720+ the controls return to the trailing edge (the H1 is hidden — 5.2).
- **Board:** five rows at Amsterdam; line rows **70.6** high at 390 and **62** at 1440; the line card is **1,510** high at 390 and **1,213** at 1440. The board door, per-row Details, Alerts and line rows all navigate correctly.
- **Map at 390:** six stop dots, one selected, 0 clipped labels; the map door and each dot navigate to a stop. At 1440 the plate is 484×363; at 1920 it stays 484×363 (the grid’s 1,052 maximum).
- **Empty states:** the six landmarks have no board and the “walking landmark” line; Enschede and Strijp-S expose the wrong copy (5.7) but their page shell, facilities, map and nearby sections still render.
- **Unknown, cold:** the fallback carries an H1, a sentence, and a 44px CTA that reaches `#/stops`; only the client transition crashes (5.1).
- **Page 4:** the index H1 and its list are unchanged at 390 and 1440.

### Not measured (stated, not passed)

- **DPR 2 and 3 (1, 3).** All geometry was read at DPR 1.
- **Hover, pressed and disabled appearance (5).** Resting, focused and click consequences only.
- **Every state at 500/700 high (1, 7).** The dock was measured at 390×700 and 720/768/1024×900; other states were not shortened.
- **1920×1080 (1).** 1920 was measured at 1080 only; 360/430/1024/1280 were base geometry only, not dark, Dutch or short.
- **Full tab order from the skip link (10).** The sequence was sampled from the head controls through the line list; it did not run from the skip link to the last nearby link.
- **User text scaling and browser zoom (3).** 150–200% was not measured.

---

## 6. Departure boards — `/departures`

**Status:** done — findings recorded, no fixes made. Ten issues; six things were not measured.
**Pop-ups opened here:** 32 only (stop suggestions). **13 is not reachable here:** the page’s Plan
buttons navigate to the planner; no control opens the Plan-with-stop sheet. 32 is an inline listbox,
not a dialog, so its trap/return checks do not apply; it has its own section now.
**States:** no stop chosen; one board; three boards; default origin; 20 rows; empty board (Enschede);
line board; an address asked for by URL; ferry; cancelled row at end of service; search open and
no-match; pinned/unpinned; light; dark; English; Dutch; 320–1920 wide.

**Checks:** 1–11. Specifics: board rows' line/number/time columns, the refresh control, the
“show more” control, and whether a 5-second refresh moves anything while it updates.

**Not verifiable here:** L1 screen reader · L2 real device/notch/keyboard · L3 touch · L4
Safari/Firefox · L5 performance · L6 live network · L7 install · L8 user testing (definitions at the
top). **This page especially:** L1 for a refresh that changes rows, L6 for the 5-second live cycle.
**You should check:** leave a board open for ten minutes with VoiceOver and a real connection.

### Run log

| Run | Date | Scope | Outcome |
|---|---|---|---|
| 1 | 2026-10-19 | 63 state×width loads (7 states × 320/360/390/430/768/1024/1280/1440/1920); one/three/line/empty/default/empty-board/address/ferry; 20-row batches, scroll sentinel and reset; 12s auto-refresh and manual refresh; search at 320/390/719/720/1440; short viewports; contrast/dark/NL; cancelled row at 23:50; controls, keyboard, console | **complete — 10 findings** |

**What the numbers are measured against.** Every layout number is taken after
`document.fonts.ready`. The auto-refresh check installs a fixed clock, runs **12,000ms**, and counts
every mutation under the board card; the manual check reveals the control and presses it. The
cancelled row is measured at **23:50 UTC**, where the board holds a cancellation. Raw data:
`.logs/p6-sweep.json` (63 loads), `p6-probe.json`, `p6-refresh.json`, `p6-many.json`,
`p6-search.json`, `p6-contrast.json`, `p6-controls.json`, `p6-ui-audit-2350.out`; screenshots
`p6-one-390.png`, `p6-three-390.png`, `p6-ferry-390.png`, `p6-landmark-390.png`,
`p6-emptyBoard-390.png`, `p6-cancelled-390-light-en.png`, `p6-search-390.png`.

### Findings

| # | Count | Finding | Measurement | Verdict |
|---|---|---|---|---|
| 6.1 | 5, 6, 7 | **The board never auto-refreshes, and the only refresh control is hidden behind a pull gesture.** Every board says “auto-refresh every 5s”, but 12 seconds of a fixed clock produced **0 mutations** under the card and an identical text snapshot; the only timer is the minute clock, so the list changes at most once a minute. The manual control is **0px high and inert** at load (`y96`), appears only after a **40px upward wheel at the top** (44px, card moves 334→402), and does not exist at all on the line board. Pressing it does work: **17 mutations** and a changed set of rows. | Auto: 0 mutations/12,000ms, text identical; label “auto-refresh every 5s”. Initial `.board-refresh` 0×0, `inert=true`; after two 20px wheel-ups at top, 44px and `inert=false`; after a 40px downward wheel it hides again. Line board: no `.board-refresh`; 0 mutations/12s. Manual: 17 mutations, rows reorder. `.logs/p6-refresh.json`, `.logs/p6-ui-audit-2350.out` | **FAIL** |
| 6.2 | 5, 7 | **“Show 5 more” can add 10, and “Show only the next departures” does not reset.** At 1440 the first press goes 5→10; the second, with the scroll sentinel also firing, goes 10→**20** — a press labelled SHOW 5 MORE adds ten rows. At 20 the button changes to SHOW ONLY THE NEXT DEPARTURES, but pressing it leaves **20 rows** (the sentinel immediately reloads the five just hidden). The same reset fails at 390. | 1440: 5→10→20; after the second press the label is SHOW ONLY THE NEXT DEPARTURES, and after pressing that the rows stay 20 after 400ms. 390: same; initial 5, two presses to 20 with the sentinel. `.logs/p6-many.json` | **FAIL** |
| 6.3 | 5, 7 | **The fixed dock covers board controls at first paint.** At 390×900 the dock is **834–888** and sits over the “SHOW 5 MORE” button (**842.8–886.8**, 44px). At 430×900 it covers the alerts link (850–866) and both Plan buttons (882–926); at 768×900 the Plan-to button is 33px covered; at 1024 the alerts link is 5px covered; at 390×500 the Stop page link is 14px covered. The page scrolls, so they are reachable later. | 390×900: dock 834–888, button 842.8–886.8. 430×900: alert 850–866, Plan 882–926. 768×900: Plan-to 855–899. 1024×900: alert 823–839. 390×500: Stop page 404–448 under dock 434–488. `.logs/p6-sweep.json` | **FAIL** |
| 6.4 | 5, 6 | **An address asked for by URL is silently pinned, then the page says no stops are pinned.** `?stop=utrecht-domtoren` stores **`["utrecht-domtoren"]`** in `board-stops` and the old `board-stop`, keeps “Utrecht, Domtoren” in the field, and draws **“No stops pinned to the board”** with “Pin a stop…”. It survives a reload. The translated “No board here” and walking-destination copy exist in `i18n` but are not used. | Storage `["utrecht-domtoren"]`, legacy `"utrecht-domtoren"`; H1 Departure boards then H3 No stops pinned; copy “Pin a stop and its departures appear here…”. `.logs/p6-landmark-390.png`, `.logs/p6-probe.json` | **FAIL** |
| 6.5 | 3 | **Ferry platforms render as “PPier 1”.** At 320/390 the board is narrower than 420px, the platform label is `font-size:0` and its `::before` supplies a `P`, while the value is already “Pier 1” and the gap is 0. At 768/1440 the label reads “PLATFORM Pier 1”. | 320: platform column 38px, label 0px, `::before` “P”, text “Pier 1” → PPier 1; 390: same; 768/1440: 11px label. Screenshot `p6-ferry-390.png`. | **FAIL (minor)** |
| 6.6 | 10 | **The combobox moves its highlight but never tells assistive tech which option is active.** Type “Utrecht”, press ArrowDown: `aria-selected` moves from option 0 to 1, Enter chooses it, but the input’s `aria-activedescendant` stays **null** and no option id is referenced. | 4 options at 320/390/719/720/1440; selected 0→1; `aria-activedescendant=null` before and after; Enter selects Utrecht Lunetten. Listbox 242px high, 56px options. `.logs/p6-search.json` | **FAIL (minor)** |
| 6.7 | 10 | **The board’s search field loses the shared focus ring.** Focused `#board-stop` has `outline:none` and `box-shadow:none`; `.input-group:focus-within` changes only the 1px border. Every button and link in the same tab order keeps a solid 2px ring. Repeats 4.5. | Input outline `none 3px`, shadow none; group border only; refresh button and card links `solid 2px`. `.logs/p6-search.json`, CSS `.input-group .input-group__field:focus` | **FAIL (minor)** |
| 6.8 | 9, 10 | **The search popover speaks English on the Dutch page.** Suggestion meta lines read “Utrecht · UTC · **station**” (the raw type, not `stopTypeLabel`); the clear button is “**Clear** halte aan het bord toevoegen”; the no-match title is “**No stops match** “zzzz””. The visible page around it is Dutch (“Vertrektijden”, “SPOOR”, “automatisch verversen elke 5 s”). | NL 390: option meta “Utrecht Centraal Utrecht · UTC · station”; clear aria “Clear halte aan het bord toevoegen”; no-match “No stops match “zzzz””. `.logs/p6-search.json` | **FAIL (minor)** |
| 6.9 | 10 | **Repeated board rows produce identically named Plan buttons.** The button names the destination only, never the time or platform. The ferry board has five “Plan a journey to Dordrecht”; the Utrecht board has two “Plan a journey to Amsterdam Centraal”. A screen reader’s button list cannot say which departure each one belongs to. | Five identical `Plan a journey to Dordrecht` at 390; two identical `Plan a journey to Amsterdam Centraal` on the default-origin board; names have no time/platform. `.logs/p6-probe.json`, `.logs/p6-ferry-390.png` | **FAIL (minor)** |
| 6.10 | 3 | **The no-board state skips a heading level.** It draws H1 “Departure boards” straight to H3 “No stops pinned to the board”, with no H2. The same state is reached with an address (6.4). Enschede’s empty board is H2 then H3, so only the no-board state skips. | Headings `H1:Departure boards`, `H3:No stops pinned to the board`; no H2. `.logs/p6-sweep.json` | **FAIL (minor)** |
| 6.11 | 1, 3, 7 | **One rail, no horizontal overflow and no clipped text across every state and width.** | 63 state×width loads (7 states × 320/360/390/430/768/1024/1280/1440/1920): `scrollWidth == clientWidth` at every one, 0 clipped text. H1 21px and visible at every width. One board 1,161/1,109/1,076/1,023/996/996/948/948/948 high; three boards 2,723/2,521/2,342/2,289/2,209/2,209/2,161/2,161/2,161; line board 1,050/1,050/1,005/957/900/900/900/900/900; empty board 917 at 320 then 900; ferry 1,242/1,116/1,076/1,076/996/996/948/948/948. Board rows 61px (ferry 71.6 at 320; cancelled 75.6); card 738 at 320 and 582 at 1024+. `.logs/p6-sweep.json` | **PASS** |
| 6.12 | 4, 5, 9 | **Contrast, dark, Dutch geometry and the cancelled row hold.** | 0 contrast failures in seven combinations (13 styles each): 320/390/1440 light-EN, 390/1440 dark-EN, 320/1440 light-NL. `UI_AUDIT_CLOCK=2026-10-15T23:50:00Z` exits **0**: 0 contrast, 0 effective-target, 0 clipped across 12 routes × 6 widths, including the cancelled row. Cancelled alert link **44×44**, “Cancelled” in EN and “Rit vervalt” in NL, aria “Alert for service N851” / “Storing voor dienst N851”. Dark document heights **1,076** at 390 and **948** at 1440, identical to light; NL 320 is 1,193 vs 1,161 (content, not geometry). `.logs/p6-contrast.json`, `.logs/p6-ui-audit-2350.out` | **PASS** |
| 6.13 | 5, 6, 10 | **Every page-specific control behaves, apart from 6.1 and 6.2.** | Empty CTA “Choose stops” focuses `#board-stop` and opens its list; Stop page → `#/stops/amsterdam-centraal`; unpin → `board-stops: []`, board removed, H3 empty state; Plan from here → `#/?from=…&pick=to`; Plan to here → `#/?to=…&pick=from`; alerts → `#/disruptions?stop=…`; a row plan → `#/?to=utrecht-centraal&pick=from`; line board Stop page → the stop. Unpinning, the 4-state Show more label, and the manual refresh all have consequences. All measured tab stops carry a 2px ring (the search field is 6.7). `.logs/p6-controls.json`, `.logs/p6-many.json` | **PASS (exceptions 6.1, 6.2)** |
| 6.14 | 11 | **No application errors.** The only console failure is the global `ipwho.is` 429 already recorded as 1.4; the board itself raises none. | 0 page errors on every valid state; 0 application console errors; `429 https://ipwho.is/` once per load. `.logs/p6-probe.json` | **PASS (noted)** |

### Verified to hold

- **Header and page:** H1 “Departure boards” 366×21 at 390 and 1,052×21 at 1440, visible at every width; the hero card is 169 high with a board and 109 with none; the line board is H1 “Intercity 800”, H2 “Next departures from Amsterdam Centraal”, H2 “Route”.
- **Board rows:** 61px at 390/1440, 71.6 on the 320 ferry, 75.6 on the cancelled row; time, destination, line/operator and platform all stay inside their cells at 320 (time 45, main 135, platform 14, action 44).
- **Cancelled row:** strikethrough destination, “Cancelled”/“Rit vervalt” on its own line, 44×44 alert with a translated name; the board is 4 rows at 23:50 with one cancellation.
- **Empty board:** Enschede draws H2 Enschede and H3 “No departures right now”, with the board header and 5s line still present; the page is 900 high at 390+.
- **Line board:** five rows and a 16-departure window; H1 visible, Route card 246 high at 320 and 149 at 1440, no overflow.
- **Search:** open list is 74px with one option and 242px with four; 56px rows; Escape closes; Enter adds the stop and keeps the previous board; no-match text and hint render.

### Not measured (stated, not passed)

- **DPR 2 and 3 (1, 3).** Geometry at DPR 1 only.
- **Hover, pressed and disabled appearance (5).** Resting, focused and click consequences only; no control on this page is disabled.
- **Every state at 500/700 high (1, 7).** One board was measured at 390×500 and 390×700; the empty, three-board, line and ferry states were 900 high.
- **1920×1080 (1).** 1920 was 900 high; 360/430/1024/1280 were base geometry only, not dark, Dutch or short.
- **Full tab order from the skip link (10).** Sampled from the field through the board rows; it did not run to the last Plan button.
- **The 10-minute live cycle and real network (L6).** Auto-refresh was measured for 12 seconds on a fixed clock, not ten minutes on a real feed.

---

## 7. Disruptions — `/disruptions`

**Status:** done — findings recorded, no fixes made. Six issues (five to fix, one content note); eight
things were not measured.
**Pop-ups opened here:** none. 13 is not reachable: an alert card opens a detail route, and Options
is an inline disclosure, not a dialog.
**Instances:** 14 alerts; all 14 loaded at 390 and 1440; the nine-width base sweep covers the first
five.
**States:** base; all 14; every type, severity and mode filter individually; affected-stop filter;
search and search with no match; favourites-only with and without favourites; valid and invalid line
filter; reset; three sorts; Options open, closed and with selected chips; long titles; light; dark;
English; Dutch; 320–1920 wide.

**Checks:** 1–11. Specifics: the filter chips, Options disclosure, alert cards' severity marks, list
rhythm, empty filter state, card/detail navigation.

**Not verifiable here:** L1 screen reader · L2 real device/notch/keyboard · L3 touch · L4
Safari/Firefox · L5 performance · L6 live network · L7 install · L8 user testing (definitions at the
top). **This page especially:** L1 for the unannounced no-match card, and L6 for live disruption
data — every alert here is static demo content. **You should check:** VoiceOver on the no-match
state and on a severity pill, and a real disruption feed.

### Run log

| Run | Date | Scope | Outcome |
|---|---|---|---|
| 1 | 2026-10-19 | nine widths base (320/360/390/430/768/1024/1280/1440/1920); all 14 at 390/1440; 14 filter chips one at a time; stop/search/favourites/line states; reset; three sorts; Options at 320/390; 16 contrast states; light/dark/NL; keyboard, duplicate links, console | **complete — 6 findings** |

**What the numbers are measured against.** Every layout number is taken after
`document.fonts.ready`. The page is the 14 static demo alerts in `src/data/disruptions.ts`; no live
feed was involved. The nine-width base sweep and the 14-card sweep are separate runs, so “1,732px at
320” is the first five cards and “3,491px at 390” is all 14. Raw data: `.logs/p7-base.json` (9
widths), `p7-list.json` (filters, options, sorts), `p7-details.out`, `p7-filters.out`,
`p7-contrast.json` (16 state×appearance combinations), `p7-controls.out`, `p7-ui-audit.out`;
screenshots `p7-base-390.png`, `p7-options-320.png`, `p7-no-match-390.png`,
`p7-bad-line-390.png`, `p7-full-390.png`, `p7-390-dark-en-all.png`,
`p7-1440-light-en-base.png`, `p7-nl-options-390.png`, `p7-390-light-en-selected.png`.

### Findings

| # | Count | Finding | Measurement | Verdict |
|---|---|---|---|---|
| 7.1 | 5, 7 | **The fixed dock covers card controls at 320/390/430, and with Options open it covers the Ferry chip and the stop field.** The page scrolls, so they are reachable later, but they are covered when the page opens. | 390: dock **834–888**, the first card's title link **871–907** — **17 of 36px** covered. 430: title 855–873, **18px** covered. 320: the first Details link 793–837 (3px) and the next title 887 (1px). Options open at 320/390: panel **371–935**, dock covers the **Ferry** chip 812–856 (22px) and the “Filter by affected stop” label/input 868–935; panel **563.4** high, document 2,258 at 390. 0 hits at 768+. `.logs/p7-base.json`, `.logs/p7-details.out` | **FAIL** |
| 7.2 | 3, 6, 10 | **The no-match card is not announced or headed, and it names filters that are not on.** The title is a `SPAN` in a card with no role and no live region, so the list going to 0 is silent. “The type, severity, mode or affected-stop filter…” is shown when only a search is on, and again when only favourites-only is on; only the invalid-line state names the right filter. | Search “zzzz”: 5→0, card `role=null`, `aria-live=null`, headings only `H1:Disruptions & service alerts`, title element `SPAN`; no count line. Favourites-only with no favourites: 0, same copy. Bad line: correct line sentence, fixes `Reset filters` and `Clear the line filter`; clearing the line restores 5, and Reset restores 5 in the search state. `.logs/p7-details.out`, `.logs/p7-controls.out`, `.logs/p7-filters.out` | **FAIL (minor)** |
| 7.3 | 5, 10 | **Search and Sort by lose the shared focus ring.** `.input:focus` and `.select:focus` set `outline: none` and change nothing else, so the two controls a keyboard lands on first after the skip link have no visible focus. | Focused search: `outline: none 3px`, `box-shadow: none`, border `1px rgb(205,199,184)`; focused sort: the same border; both identical before and after focus. A focused filter chip is `solid 2px`. Repeats 4.5 and 6.7. `.logs/p7-filters.out` | **FAIL (minor)** |
| 7.4 | 10 | **Every card has two links to the same alert, and the second is identically named on all cards.** The title link is unique; the primary action below it repeats “ALERT DETAILS & ADVICE” and the same `href`, so a screen reader's link list cannot tell the actions apart and the keyboard visits each alert twice. | Five cards → **10** links, two per `href`; “ALERT DETAILS & ADVICE” appears **5** times. Tab order: title → details → next title → details. At 14 cards the same component gives **28** links with **14** identical details links. `.logs/p7-controls.out` | **FAIL (minor)** |
| 7.5 | 9 | **The filter chips stay English on the Dutch page.** The page shell and the sort are Dutch, but the six type chips, three severity chips and five mode chips are not. “Trein” and “Veerboot” already exist in `i18n`; the call site renders `modeLabel()` raw, and the type/severity labels have no translation entries. | NL 390: H1 “Storingen en reisinformatie”, labels “TYPE / ERNST / VERVOERSWIJZE / FILTER OP GETROFFEN HALTE”; chips “Delay, Cancelled, Planned works, Platform change, Busy, Weather”, “Information, Disruption, Major disruption”, “Train, Metro, Tram, Bus, Ferry”. Card pills are translated: “Grote storing”, “Storing”. `.logs/p7-nl-options-390.png`, `.logs/p7-details.out` | **FAIL (minor)** |
| 7.6 | 9 | **Every alert's title and advice stay English on the Dutch page.** This is demo content rather than UI chrome, but it is the bulk of what a Dutch visitor reads on this screen; only the severity and the action are translated. | NL 390 card: “Cancelled services — Schiphol Airport to Haarlem”, “Take bus 347 from Schiphol Airport to Haarlem…”; action “DETAILS EN ADVIES”; pill “Grote storing”. All 14 alert objects carry English `title`, `description` and `advice`. `.logs/p7-nl-options-390.png`, `src/data/disruptions.ts` | **NOTE** |
| 7.7 | 1, 2, 7 | **One rail, no horizontal overflow and no clipped titles; the two states that grow are the list and Options.** | Nine widths 320–1920: documents **1,732/1,716/1,683/1,650/1,254/1,254/1,206/1,206/1,206**; `scrollWidth == clientWidth` at every one. Filter row **202** high at 320–430 and **67** from 768; cards **219/202/186** at the phone widths and **150.2** at 768+. All 14: **3,491** at 390 and **2,608** at 1440, no overflow. Titles never exceed **2 lines** at 320/390/430 (210/280/320 wide); the one 320 “clipped” node is the deliberate two-line advice clamp. Options is 563.4 at 390 and 619.4 with two filters. `.logs/p7-base.json`, `.logs/p7-contrast.json` | **PASS** |
| 7.8 | 3, 6 | **All 14 alerts load, and every severity appears with its own text and tone.** | Two “Show 5 more” presses: 5→10→14 at 390 and 1440, no third press. Pills: **2** coral/Major disruption, **5** butter/Disruption, **7** sage/Information; all 14 have a text label, not colour alone. The Information filter's first batch is five of the seven. `.logs/p7-list.json`, `.logs/p7-details.out`, `.logs/p7-filters.out` | **PASS** |
| 7.9 | 4, 9 | **Contrast, dark, Dutch and selected chips hold.** | 0 failures across **16** state×appearance combinations (7–12 distinct text/background pairs each): 320/390/1440 light-EN, 390/1440 dark-EN, 320/1440 light-NL, all 14 at 390/1440 light and 390 dark, Options light/dark, selected chips light, no-match light/dark. Dark heights are identical to light: **1,683** at 390 and **1,206** at 1440; all 14 is **3,491** in both. UI audit at 10:00 exits **0**: 0 contrast, 0 effective-target, 0 clipped across 12 routes × 6 widths (3,820 text/icon nodes, 983 controls). `.logs/p7-contrast.json`, `.logs/p7-ui-audit.out` | **PASS** |
| 7.10 | 5, 6, 10 | **Every measured page control works, including the line filter and both resets.** | Title, card body and Details all open `#/disruptions/d-cancel-schiphol`; back returns to five. `?line=ic-800`: 3 cards, badge “Line filter: Intercity 800”, clearing it → 5. `?line=nope`: no-match, “Clear the line filter” → 5. Search “zzzz” → Reset → 5 and an empty field. Each of the 14 filter chips sets `aria-pressed=true` and changes the list; Options `aria-expanded=true`, panel 563.4, first Tab “Delay”, closing removes the panel. Show 5 more 5→14 in two presses; Sort by Time and Type reorder the first batch. `.logs/p7-controls.out`, `.logs/p7-filters.out`, `.logs/p7-list.json` | **PASS (exception 7.4)** |
| 7.11 | 11 | **No application errors on the nine base loads.** The all-14, Options and no-match loads were not instrumented for console errors. | `pageerror` 0 and console errors 0 at all nine widths; 429 messages were excluded by the harness. `.logs/p7-base.json` | **PASS (limited)** |

### Verified to hold

- **Filter card:** 202 high at 320–430 (search, favourites, sort + Options) and 67 at 768+; the search field is 262/332 wide, Options 98, every chip 44 high; Options carries `aria-expanded` and `aria-controls`, and its count appears only when a hidden filter is on (1 after any one chip or the stop field).
- **Cards:** 219/202/186 at 320 and 150.2 at 768+; 5/5/5/5/5/5/5/5/5 shown at the nine widths before “Show more”; all 14 reachable in two presses. The title is one real link, and a press anywhere else on the card opens the same route.
- **Severity:** 2 coral “Major disruption”, 5 butter “Disruption”, 7 sage “Information”; text is always present beside the colour.
- **Long titles:** the longest first-batch title is two lines at 320 (210 wide), 390 (280) and 430 (320); no title is truncated.
- **Line filter:** valid line gives 3 cards and a chip that clears it; invalid line gives the no-match card with the correct reason and a second fix.
- **Empty states:** search “zzzz”, favourites-only with no favourites and an invalid line all reach the same card; Reset and Clear restore five.
- **Options:** open at 320/390 adds 563.4px below the filter row and pushes the list down, rather than overlaying it; selected chips add the “2 changed from the defaults / Reset filters” row (619.4 with two filters).
- **All 14:** no horizontal overflow at 390/1440; the page grows to 3,491 and 2,608; dark has the same heights; the last card ends above the end of the document.
- **Dock:** no coverage at 768, 1024, 1280, 1440 or 1920 at 900 high.

### Not measured (stated, not passed)

- **DPR 2 and 3 (1, 3).** Geometry at DPR 1 only.
- **Hover and pressed appearance (5).** Resting, focused and click consequences only; no control here has a disabled state.
- **Every state at 500/700 high (1, 7).** All page-7 runs were 900 high; no 500/700 viewport was used, so the dock was not measured there.
- **1920×1080 (1).** 1920 was 900 high; 360/430/1024/1280 were base geometry only, not dark, Dutch or short.
- **Full tab order (10).** The sequence was sampled from the skip link through the five cards and “Show 5 more”; the 14-card full order and the Options panel's 14 chips were not walked end to end.
- **320 in the dense states (6).** All 14, Options with selected chips and no-match were measured at 390/1440, not 320.
- **Dark selected chips (4).** Selected chips were measured in light only; dark was measured on the base, all-14, Options and no-match states.
- **Search at widths other than 390 (7).** Search and no-match geometry were read at 390 only.

---

## 8. Alert detail — `/disruptions/:id`

**Status:** done — findings recorded, no fixes made. Seven issues (six to fix, one content note); seven
things were not measured.
**Pop-ups opened here:** 13 — reachable: “Plan to here” opens the stop picker full-screen
(“Where are you leaving from?”) with the stop already in the To row. Already audited with Page 4;
not re-audited here.
**Instances:** 14; all 14 loaded at 390 and 1440, six of them at 320/430 for the longest titles.
**States:** four stops and four services; one stop and one service; severe and information
severities; the longest title; the longest body; the shortest alert; not found; light; dark;
English; Dutch; 320–1920 wide.

**Checks:** 1–11. Specifics: the header and its severity pill, the “What is happening” card and its
advice banner, the affected-stops and affected-services rows, the pager, the page’s heading order
and its control names.

**Not verifiable here:** L1 screen reader · L2 real device/notch/keyboard · L3 touch · L4
Safari/Firefox · L5 performance · L6 live network · L7 install · L8 user testing (definitions at the
top). **This page especially:** L1 for a long alert read end to end and for the four identically
named “Plan to here” buttons, and L6 for live disruption data — all 14 alerts are static demo
content. **You should check:** VoiceOver through one long alert, and a real disruption feed.

### Run log

| Run | Date | Scope | Outcome |
|---|---|---|---|
| 1 | 2026-10-20 | nine widths on the four-stop alert; one-stop alert at 320/390/1440; all 14 at 390/1440; six long titles at 320/430; 390×500/700, 430×500, 768×700; not found; 15 contrast/appearance combinations; keyboard and hit areas; pager; console | **complete — 7 findings** |

**What the numbers are measured against.** Every layout number is taken after
`document.fonts.ready`. Alert content is the 14 static demo alerts in `src/data/disruptions.ts`, so
no live feed was involved. Dark was measured through the app’s own stored setting, not the OS
preference alone. Raw data: `.logs/p8-base.json` (nine widths, one-stop alert, all 14, short
viewports, not found), `p8-contrast.json` (15 state×appearance combinations, 12–13 distinct text
styles each), `p8-controls.json` / `p8-controls.out` (tab order, names, structure, consequences,
Dutch), `p8-probe.json` / `p8-probe.out` (hit areas, pager, sticky header, console); screenshots
`p8-390-light-en-base.png`, `p8-320-light-en-base.png`, `p8-1440-light-en-base.png`,
`p8-390-dark-en-base.png`, `p8-390-light-nl-base.png`, `p8-1440-light-nl-base.png`,
`p8-390-cancel.png`, `p8-320-works.png`, `p8-not-found-390.png`, `p8-plan-to-390.png`.

### Findings

| # | Count | Finding | Measurement | Verdict |
|---|---|---|---|---|
| 8.1 | 5, 7 | **The fixed dock covers the affected-stops controls at 320, 360, 390, 430, 768 and 1024.** It sits over the third and fourth stop rows of the four-stop alert, and over the services card’s “More alerts” further down. The page scrolls, so they are reachable, and the dock clears the pager at the page end. | 320/360: a “PLAN TO HERE” **26.8 of 44px** covered (816.8–860.8 under dock 834–888). 390: third Plan button **10.6** and “’s-Hertogenbosch” **15.6 of 16.2**. 430: “’s-Hertogenbosch” **16.2**. 768/1024: a “MORE ALERTS” **28.8** (859.2–903.2). 390×700: a stop name **10.6** and a Plan button **9.4**; 768×700: a stop name **16.2** and a Plan button **43.6 of 44**. 390×500 and 430×500: none. 1280/1440/1920: dock hidden. `.logs/p8-base.json`, `.logs/p8-contrast.json`, `.logs/p8-390-light-en-base.png` | **FAIL** |
| 8.2 | 9 | **The Dutch page keeps English chrome: both list headings, both pills, every Plan button, the service meta and the page’s own screen-reader description.** Only the card’s H2, the advice label, “More alerts” and the page frame are translated, so one screen mixes “Wat er aan de hand is” and “Advies” with “Affected stops (4)” and “PLAN TO HERE” — and the translated key for the button already exists in `i18n`. | NL 390: `lang=nl`, H2s `Wat er aan de hand is` / **`Affected stops (4)`** / **`Affected services (4)`**; pills **`Disruption`**, **`Delay`**; buttons **`Plan to here` ×4**; row meta **`NS · Maastricht  Alkmaar · every 30 min`**; sr-only description **`Alert · 07:00 – 22:00 · Delay`**. The list page’s own pills are translated (“Grote storing”, “Storing”), so this page drifts from 7.5. `Plan to here` has an entry at `src/lib/i18n.ts:148` that the call site does not use; `Affected stops`/`Affected services` have no entries at all. `.logs/p8-390-light-nl-base.png`, `src/pages/DisruptionDetailPage.tsx` | **FAIL** |
| 8.3 | 10 | **Four “Plan to here” buttons and four “More alerts” links share one name each.** A screen reader’s button list reads “Plan to here” four times with no stop, and its link list reads “More alerts” four times with no line, so neither can say which row it belongs to. The Plan buttons are `<button>`s that navigate, so they also cannot be middle-clicked or opened in a new tab. | 4 × `Plan to here` (one per affected stop) and 4 × `More alerts` (one per affected service); names carry no stop, line, time or platform. Tab order: stop → Plan → stop → Plan … Repeats 6.9 and 7.4. `.logs/p8-controls.json` | **FAIL (minor)** |
| 8.4 | 5 | **A stop name’s link is as wide as its column, so the empty half of the row opens the stop.** The text is 95px wide and the link is 254px at 390 and **798.7px at 1440**; the tap target grows a further 14px above and below the text. Nothing looks pressable across that width, and the row already has its own Plan button. | Link vs text: 320 **184 / 95**, 390 **254 / 95**, 768 **490.7 / 95**, 1440 **798.7 / 95**; hit area 44.2 high (16.2 plus 14 either side). No overlap with the Plan button at 320/390 (34px clear); at 1440 the button sits 20px above the link’s bottom edge, beside it rather than under it, so the two do not collide. `.logs/p8-probe.json` | **FAIL (minor)** |
| 8.5 | 3, 10 | **The not-found state skips a heading level and names both of its links the same.** It draws H1 “Alert not found” straight to H3 “Unknown alert”, and the shell’s back arrow is named “All alerts” — the same name as the card’s button, which goes to the same place. | `/disruptions/nope`: headings `H1:Alert not found`, `H3:Unknown alert`; links named “All alerts” twice (`aria-label` on the back disc, text on the primary button), both `#/disruptions`. Page 900 high, no overflow, the CTA works. Repeats 6.10. `.logs/p8-base.json`, `.logs/p8-controls.out` | **FAIL (minor)** |
| 8.6 | 3 | **Nothing names the alert in the tab, the history or a bookmark.** `document.title` stays “OVVO — Dutch public transport journey planner” on all 14 alerts, so every alert opened in a tab carries the app’s own name and no way to tell one from another. | EN and NL 390: `document.title` unchanged while the H1 is the alert’s title. App-wide (Page 5 records the same on the stop page), recorded here because this page’s title is the only thing that identifies it; no `document.title` write exists in `src`. `.logs/p8-controls.out` | **FAIL (minor)** |
| 8.7 | 9 | **Every alert’s own title, description and advice stay English on the Dutch page.** Demo content rather than UI chrome, but it is most of what a Dutch visitor reads: only the card heading, the advice label and the action are translated around it. | NL 390: “Signalling fault — delays around Utrecht Centraal”, “A signalling fault is causing delays of 5 to 10 minutes…”, “Allow 15 minutes extra travel time…”; pager titles “Lift out of service at Almere Centrum”, “Platform changes at Amsterdam Centraal”. All 14 objects carry English `title`, `description` and `advice`. Repeats 7.6. `.logs/p8-390-light-nl-base.png`, `src/data/disruptions.ts` | **NOTE** |
| 8.8 | 1, 2, 7 | **One rail, no horizontal overflow, no clipped titles and no clipped body text, across every alert and width.** The page grows only with its rows. | Nine widths on the four-stop alert: documents **2,063/2,030/1,966/1,834/1,266/1,266/1,218/1,200/1,200**; `scrollWidth == clientWidth` at every one; H1 41.6 (two lines) at 320–430 and 20.8 at 1024+, visible at all nine; the only “clipped” node is the deliberate `.sr-only` description (1px). All 14: **1,084–1,966 at 390** and **900–1,200 at 1440**, no overflow, no clipped node but that one. Titles: two lines at 320 for five of six long ones and **three lines (62.4px)** for “Engineering works — Rotterdam Blaak closed to trams”; one to two at 430; none truncated. Cards at 390: 268.2 / 546.8 / 708.1; rows 114 on a phone and 62–178.6. `.logs/p8-base.json`, `.logs/p8-contrast.json` | **PASS** |
| 8.9 | 3, 6 | **All 14 alerts load, each with its stops and services, and each severity keeps its own text and tone.** | 14/14 at 390 and 1440. Stop counts **1–4**, service counts **1–4**; 35 stop rows and 29 service rows across the 14 alerts. Pills: “Major disruption” ×2 (coral), “Disruption” ×5 (butter), “Information” ×7 (sage) — always with text, never colour alone. Every alert is `H1 → H2 → H2 → H2` with no skipped level. `.logs/p8-base.json`, `.logs/p8-contrast.json` | **PASS** |
| 8.10 | 4, 9 | **Contrast, dark and Dutch geometry hold.** | 0 failures across **15** state×appearance combinations (12–13 distinct text/background pairs each): 320/390/1440 light-EN, 390/1440 dark-EN, 320/1440 light-NL, the severe alert light and dark, the longest and shortest alerts, dark-NL, and the not-found state light and dark. Dark document heights are identical to light: **1,966** at 390 and **1,200** at 1440; NL 320 and NL 1440 are identical to EN. `.logs/p8-contrast.json` | **PASS** |
| 8.11 | 5, 6 | **Every control on this page does what it says.** | `Plan to here` → `#/?to=utrecht-centraal&pick=from` and the picker opens (“Where are you leaving from?”); stop name → `#/stops/utrecht-centraal`; back returns to the alert; `More alerts` (Intercity 800) → `#/disruptions?line=ic-800` with **3** cards; the pager wraps: previous → `d-lift-almere`, next → `d-platform-amsterdam`; not-found CTA → `#/disruptions`. No disabled control exists on this page. `.logs/p8-controls.out`, `.logs/p8-plan-to-390.png` | **PASS** |
| 8.12 | 5, 7, 10, 11 | **Keyboard, targets, sticky header and console hold.** | 22 tab stops from the skip link: skip → back → mark → alerts → four stop names and four Plan buttons alternating → four More alerts → two pager links → three dock items. Every one carries the shared **2px coral** ring (`rgb(255,126,103)`), including the 16.2px stop names whose `.tap-target::after` gives **44.2px** of hit area. Sticky header at **0** at the top and at the page end; the dock clears the last pager link at the page end (0px covered at 320/390/1440). `pageerror` 0 and application console errors 0 at 320/390/1440 (the `ipwho.is` 429 excluded). `.logs/p8-controls.json`, `.logs/p8-probe.json` | **PASS** |

### Verified to hold

- **Header:** H1 is the alert’s title — two lines at 320–430, one from 1024 — with the severity pill on its line at 390 (76.1×24 “Disruption”, 301.9–378 at y104.8); back disc 44×44 named “All alerts”.
- **“What is happening”:** card 268.2 high at 390 and 197.4 at 1440; description, advice banner (78.6 high at 390) and one row of pills — `07:00–22:00`, the type, one mode badge per mode, one operator pill per operator.
- **Affected stops:** 114-high rows at 320/390 (marker, name, city · code, full-width Plan pill) and 62 at 1440; one to four rows per alert; the name link and the Plan button are separate controls with 34px between them on a phone.
- **Affected services:** 62–178.6-high rows; mode glyph, line name, `operator · first → last · every N min`, then the “More alerts” pill (306×44 at 390, 128.2×44 at 1440).
- **Pager:** “Other alerts” last in the page; two 44-high pills wrapping their titles to two lines at 320 (29.7px of label inside 44) and one line at 390+; wraps around from the first alert to the last and back.
- **Not found:** 900 high, no overflow, one H1, a working CTA, and both appearances at 0 contrast failures.
- **Dock:** no coverage at 1280/1440/1920, and nothing covered at 390×500 or 430×500.

### Not measured (stated, not passed)

- **DPR 2 and 3 (1, 3).** Geometry at DPR 1 only.
- **Hover and pressed appearance (5).** Resting, focused and click consequences only; no control on this page has a disabled state.
- **Every state at 500/700 high (1, 7).** The four-stop alert was measured at 390×500, 390×700, 430×500 and 768×700; the other 13 alerts were 900 high only.
- **1920×1080 (1).** 1920 was 900 high; 360/430/1024/1280 were base geometry only, not dark, Dutch or short.
- **The full tab order at 320 and 1440 (10).** It was walked end to end at 390 only.
- **The 13 other alerts at 320 (7).** Six long-title alerts were measured there for the H1; the rest were 390/1440.
- **Zero-stop and zero-service states (6).** They do not exist: every one of the 14 alerts has at least one stop and one service, so those cards’ empty form was never reached.

---

## 9. Journey detail — `/journey/:journeyId`

**Status:** done — findings recorded, no fixes made. Eight issues (seven to fix, one note); seven
things were not measured.
**Pop-ups opened here:** none. 13 is not reachable from this page: “Plan return journey” goes back
to the results list, and the intermediate-stops control is an inline disclosure, not a dialog.
**Instances:** 11 results for the audited search; five journey shapes were opened — direct, one
transfer, two transfers, a cancelled leg, and walking-only — and the direct one was measured at all
nine widths.
**States:** on time; delayed; cancelled leg; one and two transfers; three intermediate stops, closed
and open; walking-only; alighting on the same stop; light; dark; English; Dutch; not restored;
320–1920 wide.

**Checks:** 1–11. Specifics: the leg list’s vertical line and its markers, the alignment of times and
places, the transfer rows, the summary chips and the three journey actions.

**Not verifiable here:** L1 screen reader · L2 real device/notch/keyboard · L3 touch · L4
Safari/Firefox · L5 performance · L6 live network · L7 install · L8 user testing (definitions at the
top). **This page especially:** L1 for the order of legs, a delay and a cancellation, and L6 for
live times — every journey is generated from static demo data. **You should check:** VoiceOver
through two changes and one cancellation, and a real journey from the live feed.

### Run log

| Run | Date | Scope | Outcome |
|---|---|---|---|
| 1 | 2026-10-20 | nine widths, three journey shapes; cancelled, two-transfer and walking-only states at 390/1440; disclosure open; four short viewports; 14 contrast/appearance combinations; rail geometry; hit areas; dock; keyboard and consequences; console | **complete — 8 findings** |

**What the numbers are measured against.** Every layout number is taken after
`document.fonts.ready`. Journeys are generated per search, so each measurement is made by planning
Amsterdam Centraal → Utrecht Centraal with the clock fixed at **2026-10-20 10:00 +02:00** and then
opening a card from the results list; the cancelled journey comes from Schiphol Airport → Haarlem and
the walking-only one from Utrecht Centraal → Utrecht Vaartsche Rijn. The page cannot be reloaded
into the same journey (see 9.7), so every load is a fresh plan. Raw data: `.logs/p9-base.json` (nine
widths, transfer and walking-only at every width, short viewports, not restored),
`p9-contrast.json` (14 state×appearance combinations, 16–18 distinct text styles each),
`p9-probe.json` / `p9-probe.out` (rail segments, disclosure, console), `p9-controls.json` (tab order,
names, consequences), `p9-states.json` / `p9-states2.cjs` output (which states exist, dock coverage
in the cancelled state); screenshots `p9-390-direct.png`, `p9-1440-direct.png`,
`p9-390-transfer.png`, `p9-430-transfer-wrapped.png`, `p9-390-walk.png`, `p9-390-cancelled-open.png`,
`p9-390-not-restored.png`, `p9-rail-gap.png`, `p9-bicycle-pill.png`, and the 12 `p9-<state>.png`
full-page shots from the contrast run.

### Findings

| # | Count | Finding | Measurement | Verdict |
|---|---|---|---|---|
| 9.1 | 7 | **The fixed dock covers controls on a short screen, and the ones it covers are the two smallest targets on the page.** At 320 it covers the top 14.5px of the intermediate-stops control; at 390×700 it covers the alert link in the banner completely; at 768 it covers a leg’s alert pill completely. At the page end the dock clears the last card, so nothing is unreachable. | 320×900: “1 intermediate stop” **14.5 of 44px** (804.5–848.5 under dock 834–888). 390×700: banner alert link **24 of 24** (642.7–666.7 under 634–688). 768×900: a leg alert pill **24 of 24** (857.3–881.3 under 834–888). 390×500, 430×500, 320×568: none. 1280+: dock hidden. Page end at 390: dock 834–888, last card bottom **819.7**, 0px covered. `.logs/p9-base.json`, `.logs/p9-states2.cjs`, `.logs/p9-probe.json` | **FAIL** |
| 9.2 | 5 | **The two ways into an alert are 32.4px and 24px tall — under the app’s own 44px mark, and the smallest controls on this page.** The banner’s link is a bare line of text and the leg’s is a capsule, both opening the same article; neither has an expanded hit area, while every button beside them is 44px. | 390: banner link **310×32.4** (y346) and leg pill **256×24** (y642.7); 320: **240×32.4** and **186×24**; 1440: **996×16.2** and **408×24**. Two alerts on the transfer journey give **four** under-size targets. Everything else on the page is 44px (three actions, the disclosure, the dock). No `.tap-target` on either link. `.logs/p9-base.json`, `.logs/p9-controls.json`, `.logs/p9-390-transfer.png` | **FAIL** |
| 9.3 | 9 | **The Dutch page keeps English chrome: all three actions, most of the summary chips, the journey’s labels and the page’s own description.** Headings, leg labels, platform and direction pills and the alert banner are translated, so one screen mixes “Volledige reis” with “PLAN RETURN JOURNEY”. The keys for the actions, `Fastest`, `On time`, `Expected busy`, `Show on map` and `Bicycle allowed` already exist in `i18n`. | NL 390: actions **`Plan return journey` / `Show on map` / `Favourite this journey`**; summary **`Fastest`**, **`€13.20 Indicative single fare`**, **`Direct · 1 leg`**, **`0 min walking`**, **`No bicycle`**, **`Expected busy`**; description **`Vandaag, 20 okt · departs 08:30 · arrives 08:54 · direct`**. Translated around them: `Volledige reis`, `Reisoverzicht`, `Overstappen`, `Verwachte drukte`, `Op tijd`, `Spoor 1`, `Richting Maastricht`, `Storingen op deze reis`. `src/lib/i18n.ts` has `Show on map`, `Favourite this journey`, `Fastest`, `On time`, `Expected busy`, `Bicycle allowed`; the call sites use literals. `.logs/p9-contrast.json`, `.logs/p9-1440-light-nl-direct.png` | **FAIL** |
| 9.4 | 3, 6 | **A cancelled service is labelled “On time”, twice.** The journey’s status chip reads “On time” and the cancelled leg carries its own “On time” pill immediately beside “Cancelled”, so the same screen says both. The results card for the same journey reads “Cancelled” and no status pill, so the detail page is the one that disagrees with itself. | Schiphol Airport → Haarlem, cancelled journey: pills in order `Fastest`, **`On time`**, `Bus 347`, `26 min`, **`On time`**, **`Cancelled`**, `Platform 3` … ; the Complete journey card’s text is “…26 minOn timeCancelled…”. The banner above it reads “Cancelled services — Schiphol Airport to Haarlem”, and the results card’s pills are `26 min`, `Fastest`, `Direct`, `Cancelled`, `347`, `Expected busy` — no “On time” anywhere. `.logs/p9-contrast.json`, `.logs/p9-390-light-en-cancelled.png`, `src/components/journey/LegList.tsx` | **FAIL** |
| 9.5 | 1, 2 | **The rail breaks at every transfer: a 76px gap in the line, bridged by nothing.** The line under the first leg stops 10px above the row, the transfer pill sits in a row of its own, and the next leg’s line starts 10px below its own top — so the journey’s single line reads as two separate rails, where the terminus is deliberately bridged (F15). | Rails at 320/390/430/768/1440: first line ends at row bottom − 10, next line begins at its top + 10, **gap 76px** at every width (10px of line above the row’s edge, a 12px list gap, the 24px transfer row, its 8px bottom margin plus the next 12px list gap, then 10px before the next line). The terminus bridge is 20px (`top: -12px`, height 20) and closes its own 12px gap. Screenshot `p9-rail-gap.png` shows the line stopping above “Transfer · 1 min at Amsterdam Zuid” and resuming at the next node. `.logs/p9-rail.json`, `src/styles/components.css` `.timeline__rail::before` | **FAIL (minor)** |
| 9.6 | 6 | **The walking-only journey walks 8,000 m in 15 minutes — 32 km/h.** The leg and the summary agree with each other, so the arithmetic is the tell: no pedestrian covers eight kilometres in a quarter of an hour. The same journey prices the walk at €0.00 with “Walking only” as the fare label. | Walking-only (Utrecht Centraal → Utrecht Vaartsche Rijn): leg “**Walk 15 min · 8000 m**”, 08:00 – 08:15; summary “Walking only”, “**€0.00 Walking only**”, “15 min”, “Direct · 1 leg”, “**15 min walking**”, “Bicycle allowed”. 8000 m / 15 min = 8.9 m/s. `.logs/p9-states2.cjs`, `.logs/p9-390-walk.png` | **FAIL (minor)** |
| 9.7 | 3, 6 | **A journey link cannot be opened twice: a reload, a new tab or a bookmark lands on a dead end, with no way to bring the search back.** The page is generated per search and only the journey list lives in memory, so the route resolves to an empty state — and because the search itself is not restored, the “Re-run my last search” action the code offers never appears. | Reload of `#/journey/j-7365bi`: H1 “Journey no longer in this session”, then **H3** “This journey could not be restored” (no H2), 900 high, **two** links (“Plan a new journey”, “Favourited journeys (0)”), **zero** buttons. A cold load of the same URL behaves identically. `.logs/p9-base.json`, `.logs/p9-controls.out` | **FAIL (minor)** |
| 9.8 | 3 | **Nothing names the journey in the tab, the history or a bookmark.** `document.title` stays “OVVO — Dutch public transport journey planner” on every journey, so all 11 results opened in tabs are indistinguishable. | EN 390: `document.title` unchanged while the H1 is “Amsterdam Centraal Utrecht Centraal”. App-wide (recorded as 8.6 on the alert page); no `document.title` write exists in `src`. `.logs/p9-controls.json` | **NOTE** |
| 9.9 | 1, 2, 7 | **One rail, no horizontal overflow, no clipped text, and a page that grows only with its legs.** | Nine widths on a direct journey: documents **1,369/1,235/1,207/1,207/900/900/900/900/900**, `scrollWidth == clientWidth` at every one, H1 41.6 (two lines) at 320 and 20.8 from 360, visible at all nine; the only “clipped” node is the deliberate `.sr-only` description. Leg rows: **302.8** at 320, **222.6** at 360–768, **190.6** at 1024–1280, **158.6** at 1440+. Transfers: **1,839/1,660/1,628/1,551/1,051/987/971/907/907**; walking-only **985/924/900**; cancelled **1,393/1,237/900/900**; two transfers **1,615** at 390 and **910** at 1440; no overflow and no clipped text in any of them. Cards at 390: 340.9 / 148.8 / 83 / 90.8; at 1440 the left card is 518×276.9 with the other three stacked beside it. `.logs/p9-base.json`, `.logs/p9-contrast.json`, `.logs/p9-states2.cjs` | **PASS** |
| 9.10 | 4, 9 | **Contrast, dark and Dutch geometry hold.** | 0 failures across **14** state×appearance combinations (16–18 distinct text/background pairs each): 320/390/1440 light-EN, 390/1440 dark-EN, 320/1440 light-NL, transfer light and dark, cancelled light/dark/open, long light/dark, and the open disclosure. Dark document heights equal light: **1,207** at 390 and **900** at 1440. Dutch at 320 is **1,320** against 1,369 EN — 49px shorter content, not geometry; NL at 1440 is 900 in both. `.logs/p9-contrast.json` | **PASS** |
| 9.11 | 5, 6 | **Every control does what it says, including the intermediate-stops disclosure.** | Banner link and leg pill both open `#/disruptions/d-signal-utrecht`, and back returns to the journey. “Favourite this journey” → `aria-pressed="true"`, label “Favourited”, one entry written to `saved-journeys`. “Show on map” → `#/map?journey=j-7365bi`. “Plan return journey” → `#/results` with the ends swapped, 10 cards, first 08:00–08:24 Intercity 800. Disclosure **254×44**, `aria-expanded` false → true, `aria-controls` resolving to an `OL` of one row (“Hoofddorp 08:26 Platform 5”, 45 high, document +45), and closes again. `.logs/p9-controls.json`, `.logs/p9-390-cancelled-open.png` | **PASS** |
| 9.12 | 5, 7, 10, 11 | **Keyboard, focus rings, sticky header and console hold.** | Nine tab stops recorded from the actions: Plan return → Show on map → Favourite → banner alert → leg alert → three dock items — every one with the shared **2px coral** ring (`rgb(255,126,103)`); the header was not in the sequence because the run started with focus inside `main`. Sticky header at **0** at the top and at the page end; the dock clears the last card there (819.7 against 834). `pageerror` 0 and application console errors 0 on every load (the `ipwho.is` 429 excluded). `.logs/p9-controls.json`, `.logs/p9-probe.out` | **PASS** |

### Verified to hold

- **Header:** H1 is the two places around the app’s own arrow glyph; its computed accessible name is “Amsterdam Centraal Utrecht Centraal” (the icon contributes no text, the name algorithm inserts the space); the description is one `sr-only` line (“Today, 20 Oct · departs 08:30 · arrives 08:54 · direct”).
- **Actions:** three 44px controls under the head — full width (366) stacked at 320/390, and 187.1 / 142.2 / 201.4 wide in one row at 1440.
- **Leg rows:** marker 40×40, line badge, departure and arrival times, duration pill, status pill, platform pills, operator, direction; “From/To” lines with the stop code; a “Bicycle allowed” capsule that measures 121.7×24 with its label on one line (checked at 2× — it does not wrap).
- **Intermediate stops:** a 44px disclosure with the count in its label; opening it lists every intermediate stop with its time and platform; “No intermediate stops on this service.” when there are none.
- **Transfers card:** “This is a direct journey — no transfers at all.” on a direct journey, and “Change at Amsterdam Zuid” on the one-transfer one, matching the “Transfer · 1 min at Amsterdam Zuid” pill on the rail.
- **Summary:** mode badges per ride, operators, fare and its label, duration, “Direct · 1 leg” or “1 transfer · 2 legs”, walking minutes, bicycle, occupancy.
- **Walking-only:** no ride legs, “Walking only” in place of the mode badges, one walk row and the terminus, document 924 at 390.
- **Not restored:** 900 high, no overflow, one H1, both escapes work.

### Not measured (stated, not passed)

- **DPR 2 and 3 (1, 3).** Geometry at DPR 1 only, apart from the 2× crops used to check one pill.
- **Hover and pressed appearance (5).** Resting, focused and click consequences only; no control on this page has a disabled state.
- **Every state at 500/700 high (1, 7).** Only the direct journey was measured short (390×500, 390×700, 430×500, 768×700, 320×568); the cancelled, transfer and walking-only states were 900 high.
- **1920×1080 (1).** 1920 was 900 high; 360/430/1024/1280 were base geometry only, not dark, Dutch or short.
- **The header in the tab order (10).** The recorded sequence starts at the actions because focus began inside `main`; the skip link, back arrow, mark and alerts entry were not walked here.
- **The other six results of the search (6).** Five journey shapes were opened; the six that were not share their components, but their own delays and alerts were not read.
- **The restored state (6).** There is no way to restore a journey, so the only state after a reload is the dead end measured in 9.7.

---

## 10. Travel preferences — `/preferences`

**Status:** done — findings recorded, no fixes made. Eight issues (six to fix, two notes); six
things were not measured.
**Pop-ups opened here:** none. The page is a single card of inline controls; “Reset to defaults” acts
at once, with no confirmation dialogue.
**Instances:** 20, all on one page: seven mode chips, a walking slider, a transfers menu, two
switches, a reset button and the header action, plus the preview card that only exists when a search
does.
**States:** every mode on; one off; all off; walking 5, 20 and 45 (“No limit”); transfers 0, 2 and no
limit; both switches on; defaults changed; reset; with a search; without one; after a reload; light;
dark; English; Dutch; 320–1920 wide.

**Checks:** 1–11. Specifics: the seven mode chips, the walking slider and the three numbers under it,
the transfers menu, the two trade-off switches, the preview card with its two pills, the reset at the
foot of the card, and the header action that changes with the presence of a search.

**Not verifiable here:** L1 screen reader · L2 real device/notch/keyboard · L3 touch · L4
Safari/Firefox · L5 performance · L6 live network · L7 install · L8 user testing (definitions at the
top). **This page especially:** L1 for the chip group and for what a preference change announces, L2
for OS text size on the slider’s numbers, L8 for whether “No limit” reads truthfully. **You should
check:** VoiceOver across the seven chips and the two switches, 200% text, and the dark warning panel
(10.2) on a phone.

### Run log

| Run | Date | Scope | Outcome |
|---|---|---|---|
| 1 | 2026-10-20 | nine widths, search and no-search; all-modes-off; 13 contrast/appearance combinations; keyboard order and names; range keys; select focus; dock at six viewports × three states; console | **complete — 8 findings** |
| 2 | 2026-10-20 | consequences on the results list, persistence across a reload, and the storage keys; replaces the discarded first attempt, whose init script cleared storage on every document and whose header selector was wrong | **supersedes the consequence and persistence checks of run 1; confirms 10.8** |

**What the numbers are measured against.** Every layout number is taken after
`document.fonts.ready`. A search is Amsterdam Centraal → Utrecht Centraal with the clock fixed at
**2026-10-20 10:00 +02:00** (11 journeys); the page is then opened from the results list, or loaded
cold when no search is wanted. Storage is seeded once and the page reloaded, because an init script
that reseeds on every document silently resets the very preferences a reload test is measuring. Raw
data: `.logs/p10-base.json` / `p10-base.out` (nine widths, search at 390/1440, five short viewports),
`p10-contrast.json` (13 state×appearance combinations, 11–13 sampled pairs each), `p10-controls.json`
(range keys, select focus, tab order, all-modes-off, storage), `p10-focus-nl.json` (full tab order
and the Dutch page), `p10-dock.json` (18 probes), `p10-results-effect.out` (results after 0
transfers and after all modes off), `p10-search-persist.out` (what a reload keeps). Screenshots
`p10-390-light-en-nosearch.png`, `p10-390-search.png`, `p10-1440-light-en-nosearch.png`,
`p10-1440-light-en-search.png`, `p10-390-dark-en-nosearch.png`, `p10-390-light-nl-search.png`,
`p10-390-light-en-nomodes.png`, `p10-390-dark-en-nomodes.png`, `p10-range-focus.png`,
`p10-390-results-nomodes.png`.

### Findings

| # | Count | Finding | Measurement | Verdict |
|---|---|---|---|---|
| 10.1 | 10, 5 | **The transfers menu is the only control on the page with no focus indicator.** Tabbing from the slider onto it draws no ring, no shadow and no border change, in either appearance — every other stop on the page gets the shared 2px coral ring. The cause is one rule: `.select:focus { outline: none; border-color: var(--struct-main) }` outranks the `:where(…):focus-visible` ring (0,1,0 against 0,2,0), and the border it promises is not painted either. The same rule governs every `.input` and `.textarea` in the app, so the fix belongs there; only this select was measured. | 390 light, keyboard Tab from the slider: `:focus-visible` **true**, `outline: none 3px rgb(24,24,27)`, `border rgb(205,199,184)` — identical to its resting border — `box-shadow: none`. 390 dark: same, `border rgb(74,70,60)`. Neighbours in the same sequence draw `solid 2px rgb(255,126,103)` at 2px offset: skip link 166×44, back 44×44, mark 56×56, alerts 67.2×36, action 151.5×44, seven chips 162×44, range 332×44, two switches 332×52.6 and 332×44, reset 167.9×44. `.logs/p10-focus-nl.json`, `.logs/p10-controls.json`, `src/styles/components.css:961` | **FAIL** |
| 10.2 | 4, 9 | **The “no transport mode” warning is unreadable in the dark appearance: 1.17:1.** The pale coral panel keeps its cream-pink fill in dark — it is the one tint that must — but its 12px line inherits the dark theme’s light ink, so text and panel are the same lightness. The rule that pins dark ink on these panels only fires under `[data-surface='tint']`, and this page has no `data-surface` at all (no background has been chosen), so nothing pins it. Light is fine: same panel, dark ink. | 390 dark, all seven modes off: panel `rgb(255,232,229)` on a `rgb(35,34,32)` card, text **`rgb(222,220,214)` at 12px → 1.17:1** (needs 4.5). 390 light, same state: **0 failures** in 13 sampled pairs. The other 12 combinations — 320/390/1440 light, 390/1440 dark, 320/1440 NL, search at 390/1440/1440-dark/390-NL, 390 dark with a search — all pass. `src/styles/components.css:174-181` (`[data-surface='tint'] .panel--coral`), `src/styles/tokens.css` (`--tint-coral` stays `#ffe8e5` in dark). `.logs/p10-contrast.json`, `.logs/p10-390-dark-en-nomodes.png`, `.logs/p10-390-light-en-nomodes.png` | **FAIL** |
| 10.3 | 9 | **Dutch keeps English in the page’s own furniture: the section heading, the header action, the reset, the whole preview card and three of five transfer options.** The H1, every control label, the hints, the switches and the chips are translated, so one screen reads “Reisvoorkeuren” above “All preferences”. Two of the strings already exist in the dictionary and are not called at their call sites; the preview pills and the middle three transfer options have no key at all. | NL 390: H1 `Reisvoorkeuren`, paragraphs `Vervoerswijzen` / `Afwegingen` / `Geldt voor lopen naar, tussen en na de ritten.`, chips `Trein Bus Tram Metro Veerboot Lopen Fietsen` — then **`All preferences`**, header action **`Plan a journey`**, **`Reset to defaults`**, transfers **`Maximum 1 transfer` / `Maximum 2 transfers` / `Maximum 3 transfers`** between `Geen overstappen` and `Geen limiet`. NL with a search: **`11 of 11 journeys allowed`**, **`Best now: 08:30 → 08:54 · 24 min`** (document 1,270 against 1,241 EN). `src/lib/i18n.ts:177` has `'All preferences': 'Alle voorkeuren'` and `:174` `'Reset to defaults': 'Terug naar standaard'`; `src/pages/PreferencesPage.tsx` writes both as literals. `.logs/p10-focus-nl.json`, `.logs/p10-contrast.json` | **FAIL** |
| 10.4 | 2, 10 | **The seven mode chips and the two switches have no group name.** “Transport modes” and “Trade-offs” are plain label paragraphs, not legends or a labelled group, so the controls that follow are announced as seven loose toggle buttons and two loose switches with nothing saying what they belong to — even though the page’s whole argument is that these are one answer to one question. | `main`: **0** `fieldset`s, **0** `[role=group]`; the chip container is `div.row-wrap.chip-group` with `role` null and no `aria-labelledby`; seven `button.chip` at `aria-pressed`, all in the tab order, each 162×44 at 390. Visible headings exist for both groups (`Transport modes`, `Trade-offs`), so the missing piece is association, not wording. `.logs/p10-focus-nl.json`, `src/components/journey/PreferencesControls.tsx` | **FAIL (minor)** |
| 10.5 | 10 | **Turning the last mode off changes the page’s verdict in silence.** The warning panel has no role and no live region, and neither do the two preview pills, so the only thing a screen reader hears is the chip it pressed. The consequence — “0 of 11 journeys allowed”, “No journey matches these preferences” — is visible only. Recovery is seven more presses, one per chip: there is no “all modes” control, and the reset that would undo it in one sits at the foot of an 814px card. | The document’s only live region is the toast, `[aria-live=polite].toast-region`, and it stays empty through the change; the warning is `div.panel.panel--coral` with `role` null; both pills carry no role. 390: chips go `true×7 → false×7`, pills become `0 of 11 journeys allowed` / `No journey matches these preferences`, document grows 1,241 → 1,267. `.logs/p10-controls.json`, `.logs/p10-contrast.json` | **FAIL (minor)** |
| 10.6 | 7 | **The fixed dock covers controls on arrival at several sizes.** At 390 the “Prefer fewer transfers” switch sits almost entirely under it, at 430 the transfers menu does, and at 768×700 one switch is fully hidden. Scrolling brings each back, and at the page end the dock clears the last card, so nothing is unreachable — the cost is that a control is hidden exactly where the eye lands. | 390×900, no search: switch **47.3 of 52.6** under dock 834–888 (840.7–893.3). 430×900: menu **38.5 of 44** (828.5–872.5). 768×700 with a search: switch **44 of 44** (640.1–684.1 under 634–688); with none, switch 7.3 and reset **34.7 of 44**. 390×700: slider 8.4. 320×900: 2.3; 390×900 with a search: menu 11.3; all-modes-off at 320: slider 6.2, at 430: menu 1.5. 390 page end: last card bottom **1,018.3** against the dock’s 1,032 → **0px covered**; 320: 1,054.8 against 1,086. 1280+: dock hidden. `.logs/p10-dock.json`, `.logs/p10-base.json` | **FAIL (minor)** |
| 10.7 | 2 | **The slider’s visible label is not its accessible name.** The field reads “Maximum walking time”; the input is named “Maximum walking minutes”, and the visible label is a paragraph rather than a `<label>`, so the two only meet by eye. Nothing is broken for a sighted keyboard user — the value is announced by the native range — but a speech-input user saying the visible words does not hit the control. | Visible: `Maximum walking time` in `p.field__label`; input `aria-label="Maximum walking minutes"`, no `id`/`for` pair anywhere in the field. Values announced by the native control: 5–45, step 5. `.logs/p10-focus-nl.json`, `src/components/journey/PreferencesControls.tsx:84-91` | **NOTE** |
| 10.8 | 6 | **The preview card depends on a search that only lives in memory, so a reload replaces it with an instruction.** Reloading `/preferences` leaves the page 143px shorter with H1 and “All preferences” only — the sentence “Plan a journey to preview these settings.” takes the card’s place. The preferences themselves survive, so the page is honest about what it lost; what it lost is the app’s session (the same hole 2.x records for the results list). | Before reload at 390: 1,241 high, three headings (`H1:Travel preferences`, `H2:Effect on your current search`, `H2:All preferences`), pills `11 of 11 journeys allowed` / `Best now: 08:30 → 08:54 · 24 min`. After: **1,098**, two headings, no pills, paragraph `Plan a journey to preview these settings.`. Surviving the same reload: range `5`, menu `0`, first switch `aria-checked=true`. No `search` key exists in storage; keys present are `preferences`, `settings`, `favourites`, `saved-journeys`, `recent-searches` (`[]`), `home-widgets`, `board-stops`, `stop-names`, `location-*`. `.logs/p10-search-persist.out`, `.logs/p10-consequence2.out` | **NOTE** |
| 10.9 | 1, 8 | **No overflow and no clipped text; the page is one card that grows only downwards.** | Nine widths, no search: documents **1,152 / 1,136 / 1,098 / 1,098 / 900 / 900 / 900 / 900 / 900**; `scrollWidth == clientWidth` at all nine; 0 clipped nodes anywhere (the only `.sr-only` line is deliberate). Card: 296 wide at 320 (from y233), 366 at 390, 744 at 768, 1,052 at 1440 (y204.2, 510.1 high), centred from 1280. Chips: four rows of two up to 430 (127 wide at 320, 162 at 390, 182 at 430), one row of seven from 768 (81.6 min, natural 77.3–99.8 at 1440). Slider and menu: 262 / 302 / 332 / 372 wide stacked to 430, then side by side from 768 (347 and 347, later 501 and 501). Switches 262 / 332 / 710 / 1,018 wide; reset 167.9×44 at every width. With a search at 390: 1,241 high, preview card 159.2 and controls card 814.1. `.logs/p10-base.json` | **PASS** |
| 10.10 | 4, 9 | **Contrast, dark and Dutch geometry hold everywhere except the one panel in 10.2.** | 13 state×appearance combinations, 11–13 distinct text/background pairs each, **1 failing pair** (the dark all-modes-off panel, 1.17:1 — 10.2); 12 combinations clean. Dark document heights equal light: **1,098** (no search), **900** (1440), **1,241** (search), **1,267** (all modes off). Dutch at 320 is **1,136** against 1,152 EN — shorter content, not geometry; NL at 1440 is 900 in both. `.logs/p10-contrast.json` | **PASS** |
| 10.11 | 5, 6 | **Every control does what it says, and the preferences reach the results.** | Chips flip `aria-pressed`; slider: three ArrowLeft 20 → **5** with the line reading “5 minutes”, Home → 5, End → **45** with “No limit”, and the value written to `preferences` in storage; menu 2 → 0; first switch → `aria-checked=true`. Header action with a search: “See the results” → `#/results`; without one: “Plan a journey” → `#/`. Consequence: 0 transfers → preview **9 of 11 journeys allowed** and the results list **9 cards**; all modes off → preview **0 of 11** and the results page **“0 of 11 shown · No journeys match your settings”** with “ADJUST TRAVEL PREFERENCES”. Reset → `20 / 2 / false / false` and the default JSON in storage. Preferences survive a reload (10.8). `.logs/p10-controls.json`, `.logs/p10-results-effect.out`, `.logs/p10-consequence2.out` | **PASS** |
| 10.12 | 10, 11 | **Keyboard order, focus rings, sticky header and console hold.** | 16 stops in order: skip link → back → mark → alerts → header action → seven chips → slider → menu → two switches → reset → dock — all with the coral ring except the menu (10.1); all inside `main` are at least 44 high, and the header’s alerts entry keeps its 48px `::after` target (3.11). Reset is reachable on every width (y 1,010.8 at 320, 957.3 at 390/430, 653.3 from 768). `pageerror` 0 and application console errors 0 on every load (the `ipwho.is` 429 excluded). `.logs/p10-focus-nl.json`, `.logs/p10-results-effect.out` | **PASS** |

### Verified to hold

- **Header:** H1 “Travel preferences” at 20.8 high, visible at all nine widths, with the description as a single `sr-only` line; the pill action sits beside it at 390 (151.5×44) and to its right at 1440.
- **Mode chips:** seven, every one 44 high, each with a mode glyph and its own name; the hint about short cycle links appears only while Biking is on, and disappears when it is switched off.
- **Slider:** `min 5 / max 45 / step 5`, 44 high, its three numbers reading “5 min”, the current value and “45 min”; at 45 the middle number becomes “No limit”.
- **Transfers menu:** five options — None, 1, 2, 3, “No limit” — 44 high, native, with its own hint line.
- **Switches:** each a `button[role=switch]` with label and description, 52.6 high when the description wraps at 390 and 44 from 768.
- **Preview card:** only with a search; “{n} of {total} journeys allowed” in sage and “Best now: {departure} → {arrival} · {duration}” in butter, with the searched date and time above them, and a coral “No journey matches these preferences” when nothing survives.
- **Empty search:** “Plan a journey to preview these settings.” in place of the card, and the header action becomes “Plan a journey” pointing at `#/`.
- **Reassurance:** the line under the chips says every mode starts on and unselected ones are left out, and the all-off warning names the consequence rather than the control.
- **Heading order:** H1 → H2 → H2 with no skip, with or without a search.
- **Storage:** one key, `ov-planner:v1:preferences`, holding modes, walking, transfers and both switches.

### Not measured (stated, not passed)

- **DPR 2 and 3 (1, 3).** Geometry at DPR 1 only.
- **Hover and pressed appearance (5).** Resting, focused and click consequences only; no control here has a disabled state.
- **1920×1080 in dark or Dutch (1).** 1920 was base geometry only; 768 and 1024 were not run in dark or NL.
- **Text at 200% and OS text size (2, 9).** No zoom pass; the slider’s three numbers are the likeliest to wrap.
- **The dock at 500/700 high in every state (7).** 390×500, 390×700, 430×500 and 768×700 were run without a search; with a search only 390×700 and 768×700.
- **The tab order through the header with a search present (10).** The recorded sequence starts at the skip link on a cold page without one; the order was not re-walked after a search existed.

---

## 11. Settings — `/settings`

**Status:** done — findings recorded, no fixes made. Thirteen issues (nine to fix, four notes); seven
things were not measured.
**Pop-ups opened here:** 14 Match colours · 15 Remove all stored data · 16 Background · 17 Widgets ·
18 Text selection · 19 Custom colour (opened from 16 and measured as a stacked screen, its own
controls not pressed). 29 Photo and 30 Crop are reachable from 16 in photo mode and were not opened.
**Instances:** 36 focusable elements on a fresh load, 33 of them in `main` (38 stops once the fixed
dock is in view and the origin list has opened): seven segmented groups (15 buttons), three switches,
three colour rows, the Match colours button, the origin combobox and its eight suggestion rows, two
link buttons, the header action, the Remove-everything button, the specimen's two buttons (11.9) —
plus one rename field per favourite stop.
**States:** every appearance (light, dark, System following the device both ways); English and
Dutch, switched live; clock 12h/24h; date long/short; compact and comfortable density; raised
contrast; reduced motion; two favourites and none; one name given and none; a page colour; a photo;
the reset dialogue; dark at 320–1440; 320–1920 wide.

**Checks:** 1–11. Specifics: the header action, the seven segment groups, three switches, three
colour rows with their swatch/label/value/chevron, the Match colours button, the reset flow, the
origin combobox and its suggestion list, the rename rows, and every pop-up this page opens.

**Not verifiable here:** L1 screen reader · L2 real device/notch/keyboard · L3 touch · L4
Safari/Firefox · L5 performance · L6 live network · L7 install · L8 user testing (definitions at the
top). **This page especially:** L1 for whether a segment's pressed state and the reset dialogue are
announced, L2 for the fixed dock over a real keyboard, L3 for the swatch grid under a thumb, L4 for
the native colour input that "Pick your own" opens, L7 for a cold deep link into `/settings`.
**You should check:** VoiceOver through a segment group and through the reset dialogue, 200% text on
the rename rows, `Match colours` on the phone and browser where it was reported dead (11.12), and
whether the location sheet appearing straight after "Remove everything" reads as a second question
or as the app forgetting (11.11).

### Run log

| Run | Date | Scope | Outcome |
|---|---|---|---|
| 1 | 2026-10-20 | nine widths, light/EN; dark, NL, compact, raised, favourites, page colour and photo at 390 and 1440; card, row, segment and control geometry; dock overlap; console | **complete — geometry and states** |
| 2 | 2026-10-20 | every control pressed, storage read after each, reload, reset to defaults, remove-all dialog, location switch | **partly invalid — six steps clicked nothing** |
| 3 | 2026-10-20 | the same controls selected by position rather than by English label: appearance (including System following the device), language, clock, date, density, both display switches, default search type, reset, remove-all, location on/off | **supersedes run 2 — all fourteen consequences recorded** |
| 4 | 2026-10-20 | the five pop-ups at 320/390/1440: size, focus, Tab escape, Escape, focus return, background scroll, contrast, swatches | **complete — 14, 15, 16, 17, 18** |
| 5 | 2026-10-20 | typed hex; Escape from two stacked screens; photo mode inside 16; Match colours with a colour in force; real-pointer hit tests at six widths; the full tab order; the rename rows; the origin field's focus | **complete — 11.3, 11.5, 11.7, 11.8, 11.9, 11.12 confirmed** |

**What the numbers are measured against.** Every layout number is taken after `document.fonts.ready`,
with the clock fixed at **2026-10-20 10:00 +02:00**. Storage is seeded once and the document is
reloaded, because a hash change (`#/` → `#/settings`) is not a page load: the store keeps the state
it read before the seed, which made the first geometry pass show favourites, compact density and
photo mode all at exactly the default height. Raw data: `.logs/p11-base.json` (23 runs: nine widths
plus seven states at 390 and 1440), `p11-contrast.json` (12 state×appearance combinations),
`p11-controls2.json` (fourteen controls pressed, storage after each), `p11-popups.json` (15
pop-up runs), `p11-popups2.json` (typed hex, stacked Escape, photo mode, with-colour trigger, the
"Colours for" control), `p11-dead-trigger.json` (36 hit tests), `p11-keyboard.json` (four tab
walks), `p11-names.json` (rename rows in both languages). Screenshots: `p11-320-light-en.png`,
`p11-390-light-en.png`, `p11-1440-light-en.png`, `p11-390-dark.png`, `p11-1440-dark.png`,
`p11-390-nl.png`, `p11-390-nl-compact.png`, `p11-390-compact.png`, `p11-390-raised.png`,
`p11-390-favourites.png`, `p11-390-colour-page.png`, `p11-390-photo.png`,
`p11-1440-photo-background.png`, `p11-390-match-typed-hex.png`, `p11-390-colours-for-dark.png`,
`p11-320-remove-dialog.png`, `p11-1440-remove-dialog.png`, `p11-320-selection.png`,
`p11-390-widgets.png`, `p11-390-names-en.png`, `p11-390-origin-focus-light.png`,
`p11-390-origin-focus-dark.png`, `p11-390-after-remove-all.png`, `p11-390-location-on.png`,
`p11-390-dark-tab.png`.

**Why run 2 is kept and marked.** Six of its steps — clock, date, density, both display switches
and the default search type — looked their control up by its English `aria-label` and its English
text *after* switching the interface to Dutch, so they found nothing, clicked nothing, and recorded
"no change". That is a probe fault, not a product one, and run 3 repeats those six by position. Run
2's reset and remove-all steps used selectors that do not depend on language and were re-confirmed
in run 3. (Run 2 also mistook `Annuleren` for `Annuleer`, which made a working Cancel button look
unreachable. One `e`; the button was never at fault.)

### Findings

| # | Count | Finding | Measurement | Verdict |
|---|---|---|---|---|
| 11.1 | 8, 10 | **None of the five pop-ups takes focus, keeps it, or gives it back.** Open any of them and the caret is still on `<body>`; Tab walks the page *behind* the overlay from the skip link onwards; Escape closes the dialogue and leaves focus on the body (or, for the full-screen screens, on whatever page control happened to hold it). The dialog is announced as a dialogue and is `aria-modal="true"`, so a screen reader is told the rest of the page is inert while the keyboard is free to wander through it. | 14 at 320/390/1440: `activeElement` `BODY`, 10 of 10 Tab presses land outside the dialog (skip link → OVVO → alerts → Reset to defaults → System → Light). 15: `BODY`, 8 of 8 outside. 16/17/18: `BODY`, 8 of 8 outside on 16. After Escape: `BODY` (14), a `segmented__btn` (15 at 320/390), a nav item (15/16 at 1440). `src/components/ui/primitives.tsx:530` (Dialog), `src/components/ui/FullScreen.tsx` (its own note says it is not trapped). `.logs/p11-popups.json`, `.logs/p11-keyboard.json` | **FAIL** |
| 11.2 | 7, 8 | **The page keeps scrolling underneath every overlay.** With the Match colours dialogue open, one wheel gesture moves the document 500px; with the Background screen covering the whole viewport, 400px. `body` never stops scrolling (`overflow: visible`) and nothing sets `overscroll-behavior`, so a page opened, dismissed and closed has moved under the finger. | 14 at 390 and 1440: `scrollY` 0 → **500** while open. 16 at 320/390/1440: `scrollY` 0 → **400** while the screen is open (`p11-popups2.json`). 15: `getComputedStyle(document.body).overflow` = `visible`. `.logs/p11-popups.json`, `.logs/p11-popups2.json` | **FAIL** |
| 11.3 | 5, 6 | **Escape in a stop-name field saves the text it promises to discard.** Typing over a stored name and pressing Escape puts the stored name back on screen — and writes the abandoned draft to storage, where it wins on the next load. The handler sets the draft back and then blurs, and blur is what commits; the commit still reads the old draft. | Stored `Work`; typed `WorkXYZ`; Escape: the field reads **`Work`**, `stop-names` reads **`{"amsterdam-centraal":"WorkXYZ"}`**; after a reload the field reads `WorkXYZ`. Enter commits correctly (`{"…":"Work"}`), the "Use the official name" button clears it (`{}`), and a name survives a reload. Both languages. `src/pages/SettingsPage.tsx:91-99`. `.logs/p11-names.json` | **FAIL** |
| 11.4 | 1, 3 | **Settings has no visible title at any width, and on a phone the first thing on the page is a reset button.** The H1 is a 1×1 `sr-only` box at 320 through 1920, so the page opens on "RESET TO DEFAULTS" with nothing above it saying where you are. A desktop rail names the section; a phone has a three-icon dock and the All sections sheet, neither of which says "Settings". | H1 "Settings" **1×1** at all nine widths; header action 167.9×44 at y96 (x140.1 at 320). Tabbing from the skip link at 390 lands on Reset to defaults as the first thing in `main` (stop 4). `src/components/layout/AppShell.tsx:195` (`showTitle` defaults to `false`; Preferences passes it, Settings does not). `.logs/p11-base.json`, `.logs/p11-keyboard.json` | **FAIL** |
| 11.5 | 5, 6 | **Typing a hex repaints every button in colours nobody typed.** The field applies as soon as `readHex` accepts the text, and a four-character `#63e` is a valid shorthand — so the third keystroke of `#63E6E2` turns every button `#6633ee`, and a fourth, fifth and sixth keystroke repaint it again. Anyone who pauses on the way to their colour leaves the app on a colour they never saw named. | Typed `#63E6` keystroke by keystroke: stored **`#63e`**, preview **`#6633ee`**; completed to `#63E6E2`: stored `#63e6e2`, preview `#63e6e2`, line "The labels take dark ink — 11.8:1", the page's Plan journey button `rgb(99, 230, 226)`. `#ZZZZZZ` changes nothing; blur restores the stored value. `src/components/ui/ColourSettings.tsx` (Match colours hex field). `.logs/p11-popups2.json`, `.logs/p11-390-match-typed-hex.png` | **FAIL (minor)** |
| 11.6 | 7, 10 | **The fixed dock covers controls — including the one the keyboard just moved to.** On arrival at the page one switch is 46.5px of its 52.6px behind the dock at 320, 360, 390 and 768, and two are clipped at 1024; tabbing to the switches at 390 puts 47 of 53, 33 of 44 and 46 of 53 pixels behind it, because the browser scrolls a focused control to the viewport's bottom edge and the dock sits on top of it. Nothing sets `scroll-padding-bottom`. | Dock at 390: 150×54 at y834. "Raised contrast" 332×52.6 at y827.9 → **46.5 covered** (320/360/390/768); 1024: 37.9 of 44, and "Reduce motion" 4.1 of 44. At 1024 the geometry run also clips two switches. Keyboard at 390: 47/53, 33/44, 46/53; at 320 "Use my location" **54 of 69**. 1280 and up: no dock, 0 covered. `.logs/p11-base.json`, `.logs/p11-keyboard.json`, `.logs/p11-390-light-en.png` | **FAIL (minor)** |
| 11.7 | 10 | **The origin field is the one stop that draws no focus ring, and in dark its focus frame goes black.** `.input-group .input-group__field:focus { outline: none }` leaves a 1px border on the wrapper as the whole affordance, and that border is `--struct-main` — `#18181b` in dark, darker than the dark card, so focus makes the field *less* visible. Every other stop on the page draws the shared 2px coral ring. | 390 light: focused border `1px solid rgb(24,24,27)` against `rgb(205,199,184)` at rest, input outline `none 3px`. 390 dark: `rgb(74,70,60)` at rest → **`rgb(24,24,27)`** focused, on a `#232220` card. `src/styles/components.css:995-1012`; the same `:focus { outline: none }` family is `components.css:960-966` (the `.select`/`.input` rule behind 10.1). `.logs/p11-origin-focus.cjs`, `.logs/p11-390-origin-focus-dark.png` | **FAIL (minor)** |
| 11.8 | 10 | **Tabbing past the origin field costs eight presses.** Focusing the field opens its suggestion list, and the eight suggestion rows are real buttons in the tab order — so the next control after the field is twenty stops away from the one before it. Arrow keys would be the ordinary route through a listbox; nothing keeps Tab out of it. | Focus → `aria-expanded=true`, `[role=listbox]` present, 8 `button.suggestion` at 314×56. Stops at 390: … 27 `INPUT.input-group__field` → 28 "Leeuwarden" → 29 "Alkmaar" → 30 "Haarlem" → 31 "Zaanse Schans" → 32 "Zaandam" → 33 "Amsterdam Sloterdijk" → 34 "Groningen Noord" → 35 "Volendam, Centrum" → 36 "Check the board". `src/components/journey/StopCombobox.tsx`. `.logs/p11-tab-all.cjs` | **FAIL (minor)** |
| 11.9 | 5, 10 | **The preview's own buttons are focusable, enabled and do nothing.** The specimen card's source says "nothing here is a control — changing a setting above re-draws it", but *Plan journey* and *Filters* are real buttons in the tab order. Tabbing to the end of the page reaches them, Enter does nothing, and the page does not move — the exact "dead button" the Match colours report described, on the same screen. | Both `BUTTON`, `disabled=false`, `tabIndex=0`, named "Plan journey" and "Filters"; a real click and an Enter press each leave `location.hash` at `#/settings`, with no toast, no dialogue and no navigation. Tab walk at 390: stop **38** is "Plan journey" ("Filters" next). `src/pages/SettingsPage.tsx` (Preview with current settings). `.logs/p11-specimen-buttons.cjs` | **FAIL** |
| 11.10 | 3, 9 | **Dutch keeps one English accessible name, and the reset's arithmetic is ungrammatical in both languages.** The Date format group is still announced as "Date format" in Dutch (its `ariaLabel` is a literal where its neighbours call `t()`), and the remove-all sentence prints the raw count beside a plural noun: "1 stops pinned to the board", "1 favourited journeys", "1 haltes vastgezet op het bord", "1 favoriete reizen". | NL 390: segment names **`Weergave, Taal, Kloknotatie, Date format, Dichtheid, Kleuren voor, Standaard zoekwijze`**. EN 390 dialog: "2 favourite stops, **1 stops pinned to the board**, **1 favourited journeys** and 1 recent searches will be deleted." NL: "1 favoriete haltes, **1 haltes vastgezet op het bord**, **1 favoriete reizen** en 1 recente zoekopdrachten". `src/pages/SettingsPage.tsx` (`ariaLabel="Date format"`, `{count} {t('…')}`). `.logs/p11-controls2.json`, `.logs/p11-popups.json` | **NOTE** |
| 11.11 | 6, 8 | **"Remove everything" finishes by immediately asking for your location.** The confirmation empties the store, resets settings, shows "All locally stored data has been removed" — and in the same frame re-opens the first-visit "Use your location?" sheet, because clearing the consent sets it to `unknown`. It is correct by construction and reads as the app having forgotten in order to ask again. | After confirm: `board-stops []`, `favourites []`, `saved-journeys []`, `recent-searches []`, `stop-names {}`, `widget-stations {}`, `location-consent "unknown"`, preferences at default, `settings` key deleted; toast present; open dialogues: **`["Use your location?"]`**. `.logs/p11-controls2.json`, `.logs/p11-390-after-remove-all.png` | **NOTE** |
| 11.12 | 5, 8 | **The twice-reported dead "Match colours" trigger could not be reproduced.** At six widths the button is where it looks, nothing is painted over it, and a real pointer click opens the dialogue every time — with no colour set and with one already in force. Whatever the report saw, it is not a hit target, a covered button or a stale colour. | 320, 360, 390, 430, 768, 1440: `elementFromPoint` at the button's centre returns the button itself, `underDock=false`, Playwright's actionability check passes, `[role=dialog]` "Match colours" opens (320×561 at y339, 390×563 at y337, 560×565 at y168). Same with `buttonColour: '#1f6feb'` stored, where the row reads "Match coloursEvery button · #1F6FEB". `.logs/p11-dead-trigger.json`, `.logs/p11-popups2.json` | **NOTE** |
| 11.13 | 5, 9 | **The colour you choose is not always the colour painted, and the row and the dialogue print different hexes for it.** `buttonPaintFor` nudges a fill that cannot carry readable ink; the row keeps showing the chosen value while the dialogue shows the adjusted one. Defensible as a rule, but one setting currently has two values on one screen and neither says which is which. | Chosen `#1F6FEB` → row "Every button · **#1F6FEB**", dialogue "**#1568EA** … The labels take light ink — 4.8:1", page buttons paint `rgb(21,104,234)`. Default `#FF7E67` is unchanged (7.1:1). `src/components/ui/ColourSettings.tsx`, `src/lib/background.ts` (`buttonPaintFor`). `.logs/p11-popups.json`, `.logs/p11-popups2.json` | **NOTE** |
| 11.14 | 1, 7 | **No horizontal overflow and no clipped text; the page is two columns that each grow downwards.** | Nine widths: documents **3,245 / 3,173 / 3,052 / 2,923 / 2,383 / 2,258 / 2,210 / 2,193 / 2,193**; `scrollWidth == clientWidth` at all nine; **0 clipped nodes** anywhere (the only `.sr-only` line is the deliberate description). Cards: 296 wide at 320, 366 at 390, 364×2 columns at 768, 518×2 from 1280 (Appearance 858.1 and 833.3 high, Preview 668.8 and 632.8). Rows 262/332/484 wide, 44–45 high, swatch 28×28, chevron 16 at the row's right edge. Segments: 7 groups, 15 buttons, every one 44 high, the widest 218.3 (Date format) — no group wraps at 320. Rename field 262×50 at 320. `.logs/p11-base.json` | **PASS** |
| 11.15 | 4, 9 | **Contrast holds in every state sampled, including the tint, the dark appearance and raised contrast.** | 12 combinations (320/390/1440 light, 390/1440 dark, 320/1440 NL, both raised-contrast, both page-colour `#63e6e2`, compact), **26 distinct text/background pairs each (25 on the tint), 0 failing pairs**. Dark documents equal light: 3,052 and 2,193. NL is taller by content only: 3,121 at 390, 2,210 at 1440. Pop-ups: 5–6 pairs each at 320/390/1440 in both appearances, **0 fails** (14's own line reports its measured ratio, "dark ink — 7.1:1"). `.logs/p11-contrast.json`, `.logs/p11-popups.json` | **PASS** |
| 11.16 | 5, 6 | **Every control does what it says, and everything survives a reload.** | Appearance light/dark/System: `data-theme` follows, and under System it follows the device (`light → dark` when the device flips). Language: the page turns Dutch in place (`Weergave`, `TERUG NAAR STANDAARD`, `Dichtheid`, `Standaard zoekwijze`) and `lang="nl"`. Clock 12h: the hint reads "2:05 pm". Date short: "20-10-2026". Density compact: 3,121 → **3,017**, `data-density=compact`. Raised contrast: `data-contrast=high`, ink `#3f3f45 → #1f1f23`, faint `#66666d → #5f5f66`. Reduce motion: `data-motion=reduced`. Default search type → `arrive`. Default origin: typing "Utrecht" and picking the second row stores `utrecht-lunetten` and the field reads "Utrecht Lunetten". Location: switch shows on while it asks, ends `granted` with "Allowed for this browser…", and off writes `denied`. Reload: all of the above kept. Reset to defaults: all eight settings back, language English, favourites left alone. `.logs/p11-controls2.json`, `.logs/p11-names.json` | **PASS** |
| 11.17 | 8 | **Every pop-up fits, with nothing to scroll and nothing under 44px.** | 14: **320×561** at y339, **390×563** at y337, **560×565** at y168 centred; `scrollWidth 318/388/558` = `clientWidth`; 17 swatches **44 / 53 / 59**; Close 44×44. 15: **320×293** at y607, **390×252** at y648, **560×203** at y348; no internal scroll (`scrollHeight == clientHeight` at all three); Remove everything 181×44, Cancel 82×44. 16/17/18: the full viewport at all three widths; Done 59×44, Back 44×44; 16's three sources 74×44; 17's two rows 296/366/620×44; 18's six rows 296–1,416×44–45. Photo mode inside 16: body 828 of 828, nothing clipped, last control bottom 436. Escape from two stacked screens closes **one level at a time** (Background + Background colour → Background → none). `.logs/p11-popups.json`, `.logs/p11-popups2.json` | **PASS** |
| 11.18 | 10 | **The keyboard order is the page's order, and every stop but one draws the coral ring — in both appearances.** | 38 stops recorded at 390: skip link → OVVO → alerts → Reset to defaults → 15 segment buttons → 3 switches → 3 colour rows → Match colours → origin field → 8 suggestions → Check the board → Travel preferences → Plan journey → dock. 1440 adds the five rail entries before `main`. Every stop **except the origin field (11.7)** draws `solid 2px rgb(255,126,103)` at 2px offset, light and dark; `main` stops are 44 high or more. Escape closes every overlay; Done closes 16/17/18; the close button is 44×44. `.logs/p11-keyboard.json`, `.logs/p11-tab-all.cjs` | **PASS** |
| 11.19 | 11 | **The console is clean on every load and in every state.** | `pageerror` 0 and application console errors 0 across 23 geometry runs, 12 contrast runs, 14 control steps and 15 pop-up runs (the `ipwho.is` 429 excluded by the same rule every section uses). No React warnings, no layout warnings. `.logs/p11-base.json`, `.logs/p11-controls2.json`, `.logs/p11-popups.json` | **PASS** |

### Verified to hold

- **Header:** the description is a single `sr-only` line; the Reset to defaults action is 167.9×44 at y96 and stays on one line at 320, where it is the only thing in the head (11.4 is the finding, not this).
- **Appearance card:** three segments (System/Light/Dark) plus two switches and a battery reading that is a reading, not a control — "Charging · 100%" with one sentence under it and no pill.
- **Colours card:** three rows — Background, Widgets, Text selection — each with a 28×28 swatch, a name, the value it holds and a chevron, and the Match colours button with its own sentence that changes once a colour is in force.
- **"Colours for" control:** says it only picks which palette is being edited, and adds a second sentence once it is pointing at the appearance the app is not wearing; the document grows 40px at 390 to make room.
- **Location card:** the switch shows on while the browser is being asked and settles on the answer, with a sentence underneath that names the state in words.
- **Names card:** one field per favourite, labelled with the stop's official name and city, a placeholder in the page's language, "Shown as {name}" once named, and "Use the official name" to clear it.
- **Planner and board defaults:** default search type, the origin combobox with its own hint, and two links to the board and to preferences.
- **Preview specimen:** the app's own furniture drawn with the settings in force — 14:05 → 15:42 with "1 hr 37 min", a coral delay pill, "Tram 2 · Today, 20 Oct · +6 min", three tone pills, a two-row departure board with a strikethrough and +3, a primary and a secondary button, a butter notice, six accent swatches with the name of what each means, and five "Currently in effect" pills.
- **Reset button at the foot:** "Remove all stored data" in accent coral, 44 high, opening a dialogue that names exactly what will go and how many of each.
- **Storage:** one key for settings, and every write is the whole object; the remove-all path deletes the key and the value flows are listed in 11.11.

### Not measured (stated, not passed)

- **DPR 2 and 3 (1, 3).** Geometry at DPR 1 only.
- **Hover and pressed appearance (5).** Resting, focused and pressed-through consequences only; the dock's own pressed state and the swatches' hover were not captured.
- **1920×1080 in dark or Dutch (1).** 1920 was base geometry in light English; 768 and 1024 were not run in dark or NL.
- **Text at 200% and OS text size (2, 9).** No zoom pass; the rename rows and the reset sentence are the likeliest to wrap.
- **Contrast over a photo (4).** With `background: photo` the cards are glass over an image, and a ratio cannot be computed from computed styles; the 12 combinations above are the opaque ones.
- **Pop-up 29 Photo and 30 Crop (8).** They are reachable from 16 in photo mode and were not opened; 19's own controls have since been pressed and recorded in its section.
- **The tab order with 15, 17 and 18 open (10).** 14 and 16 were walked; for 15/17/18 only the focus placement and the Escape result were measured.

---

## 12. Not found — `*`

**Status:** done — findings recorded, no fixes made. Six issues (three to fix, three notes); six
things were not measured.
**Pop-ups opened here:** none. The location question can open over this screen on a first visit and is
section 21's; it was suppressed here so the page could be measured.
**Instances:** the page has two actions of its own — Back to the planner and Network map — plus the
shell's back arrow, which appears here by rule (a screen you opened from nowhere has a way back). The
skip link, the mark, the alerts entry and the navigation are the shell's, and one of them is 12.1.
**States:** a cold dead link with nothing behind it; a dead link followed from inside the app; Back to
the screen it came from; forward to the dead route again; the header arrow with history and without;
320–1920 wide; 500, 700 and 900 high; light, dark, raised contrast; English and Dutch; and the three
sibling "not here" screens (unknown stop, unknown alert, lost journey) for comparison.

**Checks:** 1–11. Specifics: the H1 and the empty state's own title, the dashed ring and its icon, the
two actions and where they go, the header arrow's destination when there is nothing behind it, the
history across a dead link, the heading order, and whether a screen reader is told anything at all.

**Not verifiable here:** L1 screen reader · L2 real device/notch/keyboard · L3 touch · L4
Safari/Firefox · L5 performance · L6 live network · L7 install · L8 user testing (definitions at the
top). **This page especially:** L1 for whether the 404 is announced at all (the DOM says nothing is —
12.2 — but that is not the same as hearing it), L2 for the back arrow beside a notch, L7 for a cold
deep link into a static deployment (12.6). **You should check:** open a dead link from another app on a
phone and listen to the first announcement, and press Tab then Enter on "Skip to main content" in a
real browser — 12.1 is the finding that surprised me most.

### Run log

| Run | Date | Scope | Outcome |
|---|---|---|---|
| 1 | 2026-10-20 | nine widths, light/EN; dark, NL and raised at 390 and 1440; 320×500, 390×500, 390×700, 768×700; geometry, clipping, dock overlap, console | **complete — geometry and states** |
| 2 | 2026-10-20 | the page reached cold and from inside the app; Back, forward, both actions; keyboard order; contrast in six combinations; ten route edges (trailing slash, capitalised path, unknown stop/alert/journey, query on results) | **partly invalid, then complete** — see below |
| 3 | 2026-10-20 | a truly cold entry (history index 0), the header arrow's fallback, the skip link, the four sibling "not here" screens, focus and scroll after an in-app navigation | **complete — six findings** |

**Why run 2 is kept and marked.** Its first attempt seeded storage *after* the app had mounted, so the
location sheet opened over the page and swallowed the click on the first action; Playwright reported a
30-second timeout on a link it could see. The seed now writes storage and reloads, and the run repeats
cleanly from there. (The probe also had a call bug in its contrast sampler — it built the measuring
function and never called it — fixed before any number above was recorded.)

**What the numbers are measured against.** Every layout number is taken after `document.fonts.ready`
with the clock fixed at **2026-10-20 10:00 +02:00**, on `#/this-page-does-not-exist` unless a run says
otherwise. Storage is seeded and reloaded. Raw data: `.logs/p12-base.json` (17 runs: nine widths, three
states at two widths, four short viewports), `p12-behaviour.json` (cold load, in-app reach, actions,
keyboard, six contrast combinations, ten route edges), `p12-edge.json` (cold history, skip link, back
arrow, the three sibling screens), plus `.logs/p12-focus.cjs` for the focus-and-scroll probe.
Screenshots: `p12-320-light-en.png`, `p12-390-light-en.png`, `p12-1440-light-en.png`,
`p12-390-dark.png`, `p12-1440-dark.png`, `p12-390-nl.png`, `p12-1440-nl.png`, `p12-390-raised.png`,
`p12-390x500.png`, `p12-390x700.png`, `p12-768x700.png`, `p12-390-tab.png`, `p12-390-cold.png`,
`p12-contrast-390-light-en.png`, `p12-contrast-390-dark-en.png`.

### Findings

| # | Count | Finding | Measurement | Verdict |
|---|---|---|---|---|
| 12.1 | 7, 10 | **The skip link does not skip — it navigates to `#main` and lands the traveller on this very page.** The shell's first control is `<a href="#main">`, and the hash *is* the route in this app, so pressing Enter on it does not move focus into `main`: it sends the router to a path called `main`, which matches nothing and renders "Page not found". A keyboard user's first Tab and Enter destroys the screen they were reading. Reproduced on Home as well, so the cause is the shell, not this page; `main` also has no `tabindex="-1"`, so even a working fragment would move the scroll position rather than the focus. | On this page: skip link 166×44 at the top of the tab order; Enter → `location.hash` **`#main`**, screen still "Page not found", `activeElement` **`BODY`**, next Tab lands on "Back to the planner". On Home: Enter → hash **`#main`**, H1 **"Page not found"**, focus `BODY`. `main` is `id="main"` with `tabindex` null, `role` null, `aria-live` null. `src/components/layout/AppShell.tsx:315`, `:411`. `.logs/p12-edge.json`, `.logs/p12-behaviour.json` | **FAIL** |
| 12.2 | 1, 10 | **A dead link swaps the screen in silence: focus is dropped on `<body>` and nothing is announced.** Following a bad link from inside the app scrolls to the top (correct) and replaces the page, but the element that had focus is gone, focus lands on the document body, and the only live region in the app is the toast — which stays empty. `main` has no `tabindex`, no landmark role and no `aria-live`, and the H1 is never focused or announced. A screen-reader user is moved to a new screen without being told, and a keyboard user starts tabbing from the top of the document again. | From `#/stops` scrolled to 600 with a link focused (`A.btn "Departure boards"`), following `#/dead-end`: `scrollY` **600 → 0**, `activeElement` **`BODY`**, `main.ariaLive` null, live regions on the page: **`polite:toast-region`** only. Cold load of a dead link: `activeElement` **`BODY`**. `.logs/p12-focus.cjs`, `.logs/p12-edge.json` | **FAIL** |
| 12.3 | 1, 3 | **The page's own title is smaller than the title under it, and the heading levels skip a step.** The H1 "Page not found" is 16px; the empty state's title "Nothing here" is an `<h3>` at 19px, so the subordinate sentence is drawn larger than the page's name and read second. The same pattern is on all four "not here" screens, because the shared empty state always renders its title as an `h3` under a page that always starts at `h1`. | H1 16px/700, H3 19px/700, description 12px/400; heading list on this page: **`H1:Page not found`, `H3:Nothing here`** — no `h2`. Siblings: `H1:Unknown stop` + `H3:Stop not found`; `H1:Alert not found` + `H3:Unknown alert`; `H1:Journey no longer in this session` + `H3:This journey could not be restored`. `src/pages/NotFoundPage.tsx`, `src/components/ui/primitives.tsx:434`. `.logs/p12-base.json`, `.logs/p12-edge.json` | **FAIL** |
| 12.4 | 3, 9 | **Every screen has the same document title, so a tab, a bookmark and a history entry cannot tell a 404 from anything else.** `document.title` is "OVVO — Dutch public transport journey planner" on the not-found page, on Home, on Settings and on the results list. The page says "Page not found" on its own H1 and nowhere a person looking at ten tabs can see it. | `document.title` = `"OVVO — Dutch public transport journey planner"` on all six contrast runs, on the cold load, and on the route-edge runs (`/settings`, `/stops/…`, `/results?x=1`, `/nowhere/deeper/still`). `index.html`, `src/components/layout/AppShell.tsx` (no title effect). `.logs/p12-behaviour.json` | **NOTE** |
| 12.5 | 3, 9 | **Four screens say "this is not here" in four different ways, and the global one is the only one that cannot name what is missing.** The stop, alert and journey screens each say what was not found and offer the list it belongs to; the catch-all says "Nothing here" and points at the navigation. That is defensible for an unknown route — there is nothing to name — but the four together read like four decisions rather than one, down to the wording of the heading and the button. | `Page not found` / `Nothing here` / "Use the navigation for the planner, results, stops and departure boards." / **Back to the planner**, **Network map**. `Unknown stop` / `Stop not found` / "Pick a stop from the full list instead." / **All stations & stops**. `Alert not found` / `Unknown alert` / "Return to the overview to browse the alerts that exist." / **All alerts**. `Journey no longer in this session` / `This journey could not be restored` / … / **Plan a new journey**, **Favourited journeys (0)**. `.logs/p12-edge.json` | **NOTE** |
| 12.6 | 7 | **A dead route never leaves the app: the document is served 200 and only the fragment changes.** That is what hash routing means, and it is why 12.2 exists — there is no navigation event for a screen reader to announce and no status code for a crawler or a link preview to read. A visitor whose bookmark is stale sees the right screen; a search engine sees the shell. | `GET /` with the preview host → **200**; the dead route loads the same document and only `location.hash` changes; no request in any run returned 404 except the excluded IP lookup (429). `.logs/p12-behaviour.json` | **NOTE** |
| 12.7 | 1, 7 | **The page is a header and one bordered block, and it holds at every width without overflow or clipping.** | Nine widths, light/EN: `scrollWidth == clientWidth` at all nine, **0 clipped nodes**, no horizontal overflow; document **900** at every width and height down to 700 (the shell's minimum), and **522** at 320/390×500 — 22px of scroll, nothing hidden. H1 "Page not found" 20.8 high at 320 (one line). Empty state: 296×301.1 at 320, 366×301.1 at 390, 744×232.9 at 768, 1,052×232.9 from 1280; icon 56×56; dashed ring the same box as the state. Actions: stacked at 320/390 (y313.9 and y365.9, 186.1×44 and 142.2×44), side by side from 768 (y297.7). No card, no grid — the block sits on the canvas. `.logs/p12-base.json` | **PASS** |
| 12.8 | 4, 9 | **Contrast and language hold in every state sampled.** | Six combinations (390/1440 light, 390/1440 dark, 320/1440 NL), **5 distinct text/background pairs each, 0 failing pairs**; document 900 in all six. Dark matches light. Dutch is fully translated: `Pagina niet gevonden`, `Hier is niets`, "Gebruik de navigatie voor de planner, resultaten, haltes en vertrektijden.", `TERUG NAAR DE PLANNER`, `NETWERKKAART` — heading sizes and the empty state are unchanged (301.1 high at 390). Raised contrast keeps the same geometry. `.logs/p12-behaviour.json`, `.logs/p12-base.json` | **PASS** |
| 12.9 | 5, 6 | **Both actions go where they say, history behaves, and the back arrow on a cold link is not a dead end.** | **Back to the planner** → `#/`, H1 "Home"; **Network map** → `#/map`, H1 "Network map"; Back from the 404 returns to the screen it came from (`#/` Home) and forward returns to the dead route. A cold dead link has history index 0, and the header arrow then uses its `/` fallback: `#/no-such-page` → `#/`, H1 "Home" — so the one control on a pasted bad link always goes somewhere. The 404's H1 and both actions are visible without scrolling at 900, and at 500 high the actions still sit above the dock. `.logs/p12-behaviour.json`, `.logs/p12-edge.json` | **PASS** |
| 12.10 | 10 | **The keyboard order is the page's order, every stop draws the coral ring, and the dock covers nothing.** | Eight stops at 390: skip link → **Back** (44×44, the shell arrow) → mark (56×56) → alerts (67×36) → **Back to the planner** (186×44) → **Network map** (142×44) → two dock items (44×44); every one draws `solid 2px rgb(255,126,103)`. No `aria-current` is claimed by the rail, which is correct for a route the navigation does not contain. Dock: 150×54 at y834–888 at 390 and y434–488 at 500 high; **0 controls under it** at every width and height run. `.logs/p12-behaviour.json`, `.logs/p12-base.json` | **PASS** |
| 12.11 | 11 | **The console is clean and the only failed request is the IP lookup every page excludes.** | `pageerror` 0 and application console errors 0 across 17 geometry runs, 3 behaviour runs, 10 route edges and 6 contrast runs; the only response ≥400 was `429 https://ipwho.is/`. No React warnings, no layout warnings. `.logs/p12-base.json`, `.logs/p12-behaviour.json` | **PASS** |

### Verified to hold

- **The page names itself:** "Page not found" is a visible H1 at every width, unlike Settings (11.4), and the sentence "This page does not exist." is the header's `sr-only` description.
- **The block itself:** a dashed coral ring drawn as one rounded stroke, a coral info disc 56×56, "Nothing here" at 19px, one sentence at 12px, and the two actions centred beneath — the two buttons stack under 768 and sit side by side from it.
- **Where it points:** the copy sends the traveller to the navigation and offers the planner and the network map, the two things a dead link most often meant to reach.
- **Reached from a dead link, it keeps the failure contained:** the shell stays, the dock stays, the location state and the appearance are untouched, and Back returns to where the reader actually was.
- **The three specific "not here" screens exist and work** — unknown stop, unknown alert and a journey that is no longer in the session each name the missing thing and offer the list it belongs to (12.5 is about their wording, not their existence).
- **Route edges:** `/planner` redirects to Home; `/settings/` with a trailing slash still renders Settings; `/Settings` with a capital still renders Settings; `/stops/` renders the list; `/results?x=1` renders the results page with its own empty state.

### Not measured (stated, not passed)

- **DPR 2 and 3 (1, 3).** Geometry at DPR 1 only.
- **Hover and pressed appearance (5).** Resting, focused and pressed-through states only.
- **1920 in dark or Dutch, and 1024 in either (1).** 1920 was base geometry in light English.
- **Text at 200% and OS text size (2, 9).** No zoom pass; the empty state's sentence is the likeliest to wrap.
- **A first visit with the location sheet over this screen (8).** Consent was seeded as answered so the page itself could be measured; section 21 owns that sheet.
- **The HTTP status a static host would return for a deep path (L7).** This harness serves the SPA from Vite, where every path returns 200; 12.6 records what the app does, not what a deployment would.

---

# POP-UPS

Each pop-up is measured at 320, 390 and 1440: width and height, position against the trigger, whether
it overflows the viewport, its own scroll behaviour, focus placement, trap, Escape, and focus return.
Counts 1–11 apply to the pop-up's contents; count 8 is the pop-up itself.

**Order:** the finished pop-ups are numbered first (13–19) and the ones still to audit follow in one
block (20–32). Only the numbers moved on 2026-10-20; no finding changed.

**Not verifiable here (all pop-ups):** L1 screen reader · L2 real device/notch/keyboard · L3 touch ·
L4 Safari/Firefox · L5 performance · L6 live network · L7 install · L8 user testing (definitions at
the top). **Every pop-up especially:** L1 for whether its title and actions are announced, L2 for its
bottom edge and the keyboard, L3 for swipe/back dismissal. **You should check:** open each one on a
real phone with VoiceOver, then dismiss it with a swipe and with the system back gesture. Section 13
repeats the line with its own specifics; every other pop-up section will carry it when its audit
runs.

## 13. Plan with *stop*

**Status:** done — audited with Page 4 on 2026-10-19, no fixes made.
**Opened from:** Plan buttons on Stations & stops (Page 4).
**Run log:** one run, 320/390/1440, light/EN, 900 high; opened from the first card in each order.

**Not verifiable here:** L1 screen reader · L2 real device/notch/keyboard · L3 touch · L4
Safari/Firefox · L5 performance · L6 live network · L7 install · L8 user testing (definitions at the
top). **This sheet especially:** L1 for whether the title and two choices are announced, L2 for the
bottom edge beside a home indicator, L3 for a swipe-to-dismiss gesture. **You should check:**
VoiceOver on open and close, and the sheet on a notched iPhone.

**Findings (full detail in 4.1, 4.3 and 4.6):**

| # | Count | Finding | Measurement | Verdict |
|---|---|---|---|---|
| 13.1 | 5, 8, 10 | **No initial focus, no trap, no focus return, and the page behind scrolls.** Same Dialog component as 2.1/22/23. | At 320/390/1440 `focusInside=false`; first Tab lands on a card link behind; wheel moves `scrollY` 220 → 520; Escape leaves focus on “Board”, X/overlay on `<body>`. | **FAIL** |
| 13.2 | 1, 3 | **The title uses the stored stop name, not the traveller’s name for it.** | Card “Work” opens “Plan with Utrecht Centraal”. | **FAIL (minor)** |
| 13.3 | 1, 8 | **The sheet sits on the viewport bottom with no safe-area inset.** | Bottom 898.7 of 900 at 320/390; `.modal` has no `env(safe-area-inset-bottom)`. | **NOTE** |

**Verified to hold:** title “Plan with ’s-Hertogenbosch” fits at 320; sheet **320×231.8** at 320 and **560×138.9** centred at 1440; `scrollHeight == clientHeight` (no internal scroll); Close 44×44; “Plan from here” and “Plan to here” both 44 high, stacked at 320 (154.5 and 137.3 wide) and side by side at 390; both choices navigate correctly (`?from=…&pick=to` and `?to=…&pick=from`); Escape, X and an overlay tap all close it.

**Not measured:** 1920 only; the screen-reader, notch and touch checks are L1–L3 above.

## 14. Match colours

**Status:** done — audited with Page 11 on 2026-10-20, no fixes made.
**Opened from:** Settings → Colours. **Run:** 320/390/1440, light and dark; opened with no colour and
with `#1F6FEB` in force; 17 swatches; the hex field typed; Stop matching; Escape.

| # | Count | Finding | Measurement | Verdict |
|---|---|---|---|---|
| 14.1 | 8, 10 | **No initial focus, no trap, no focus return, and the page scrolls behind it.** (11.1, 11.2) | `activeElement` `BODY`; 10/10 Tab presses land behind; wheel moves `scrollY` 0 → 500; Escape leaves focus on `BODY`. | **FAIL** |
| 14.2 | 5, 6 | **A half-typed hex repaints every button.** (11.5) | `#63E6` → stored `#63e`, preview `#6633ee`. | **FAIL (minor)** |
| 14.3 | 5, 9 | **The chosen hex and the painted hex differ, and the row and the dialogue disagree.** (11.13) | Row `#1F6FEB`, dialogue `#1568EA` at 4.8:1. | **NOTE** |
| 14.4 | 5, 8 | **The reported dead trigger is not reproduced.** (11.12) | Hit-test and real click pass at 320/360/390/430/768/1440. | **NOTE** |

**Verified to hold:** opens at 320×561, 390×563 and 560×565; 17 swatches at 44/53/59 with `aria-pressed`
following the choice; the preview and the "light/dark ink — n:1" line are measured by the same function
the buttons are painted from; a swatch turns every page button at once; Stop matching clears the colour.
**Not measured:** the device's own colour picker behind "Pick your own" (L4), and its hover/pressed states.

## 15. Remove all locally stored data?

**Status:** done — audited with Page 11 on 2026-10-20, no fixes made.
**Opened from:** Settings. **Run:** 320/390/1440, light; EN and NL copy; cancel and confirm.

| # | Count | Finding | Measurement | Verdict |
|---|---|---|---|---|
| 15.1 | 8, 10 | **No initial focus, no trap, no focus return; the page behind scrolls.** (11.1, 11.2) | `activeElement` `BODY`; 8/8 Tab presses behind; Escape leaves focus on `BODY` or a segment button. | **FAIL** |
| 15.2 | 3, 9 | **The counts are printed ungrammatically in both languages.** (11.10) | "1 stops pinned to the board", "1 haltes vastgezet op het bord". | **NOTE** |
| 15.3 | 6, 8 | **Confirming re-opens the location sheet at once.** (11.11) | Open dialogues after confirm: `["Use your location?"]`. | **NOTE** |

**Verified to hold:** 320×293 at y607, 390×252 at y648, 560×203 at y348; no internal scroll; Close
44×44, Remove everything 181×44, Cancel 82×44; Cancel leaves everything; confirm empties every value
(`favourites []`, `board-stops []`, `saved-journeys []`, `recent-searches []`, `stop-names {}`,
`widget-stations {}`, `location-consent "unknown"`, preferences default, `settings` key deleted) and
shows "All locally stored data has been removed".
**Not measured:** the sentence at 200% text (L2).

## 16. Background

**Status:** done — audited with Page 11 on 2026-10-20, no fixes made.
**Opened from:** Settings → Colours. **Run:** 320/390/1440; Default → Colour → photo; 19 opened over
it; Escape twice; Done; photo mode.

| # | Count | Finding | Measurement | Verdict |
|---|---|---|---|---|
| 16.1 | 8, 10 | **No initial focus, no trap, no focus return.** (11.1) | `activeElement` `BODY`; 8/8 Tab presses reach the page behind. | **FAIL** |
| 16.2 | 7, 8 | **The page behind scrolls under the screen.** (11.2) | Wheel with it open: `scrollY` 0 → 400. | **FAIL** |

**Verified to hold:** the full viewport at all three widths; Done 59×44, Back 44×44; three sources
Default/Colour/Photo with `aria-pressed`; Colour adds the page-colour row and stores `background:
colour`; photo mode shows Replace/Crop/Remove and the Glass/Colour treatment, body 828 of 828 with
nothing clipped; Escape closes one level at a time (Background + Background colour → Background →
none); Done closes the screen.
**Not measured:** 29 Photo and 30 Crop, reachable from here and not opened; the glass-over-photo
contrast (L4/L8).

## 17. Widgets

**Status:** done — audited with Page 11 on 2026-10-20, no fixes made.
**Opened from:** Settings → Colours. **Run:** 320/390/1440, Default background, then 19 over it.

| # | Count | Finding | Measurement | Verdict |
|---|---|---|---|---|
| 17.1 | 8, 10 | **No initial focus and no trap.** (11.1) | `activeElement` `BODY`; the page's own controls keep the tab order. | **FAIL** |

**Verified to hold:** full viewport; rows 296/366/620×44–45 — "Follow the background · App default"
with `aria-pressed="true"` and a tick, and "Choose a colour" with its swatch; the hint under them names
what "follow" means in this state; the colour row opens "Widgets' colour" over the screen, not instead
of it.
**Not measured:** the photo path into 29 from here; hover and pressed states.

## 18. Text selection

**Status:** done — audited with Page 11 on 2026-10-20, no fixes made.
**Opened from:** Settings → Colours. **Run:** 320/390/1440; five swatches and Custom; one chosen.

| # | Count | Finding | Measurement | Verdict |
|---|---|---|---|---|
| 18.1 | 8, 10 | **No initial focus and no trap.** (11.1) | `activeElement` `BODY`. | **FAIL** |

**Verified to hold:** six rows at 44–45 high, each 296/366/1,416 wide with its swatch painted
(`Coral #ff7e67`, `Butter #fff5a5`, `Sage #e1eadf`, `Obsidian #18181b`, `Green #22c55e`, `Custom`);
`aria-pressed` moves to the chosen row and the page's own row reads "Text selection · Butter" without a
reload; the ink sentence is present under the list.
**Not measured:** the device colour dialog behind Custom (L4), and whether selection ink is legible on
each swatch under a real text selection (L4/L8).

## 19. Custom colour

**Status:** done — audited with Page 11 on 2026-10-20, no fixes made.
**Opened from:** inside 16 (Background → Colour → the Page colour row) and inside 17 (Choose a colour),
with no photo and with one. **Run:** 320/390/1440 in light; 390 with a dark page colour (`#101820`,
because the screen's chrome follows the page colour); EN and NL; every control pressed; a hex typed,
the screen closed and the page reloaded.

**Not verifiable here:** L1 screen reader · L2 real device/notch/keyboard · L3 touch · L4
Safari/Firefox · L5 performance · L6 live network · L7 install · L8 user testing (definitions at the
top). **This screen especially:** L1 for whether the screen, the pad's value and the ink sentence are
announced; L2 for the pad under a thumb; L3 for dragging the pad and the hue strip. **You should
check:** VoiceOver across the grid, the pad and the hue strip, and one drag on the pad on a phone.

| # | Count | Finding | Measurement | Verdict |
|---|---|---|---|---|
| 19.1 | 8, 10 | **The screen takes no focus, does not keep it and does not give it back.** `aria-modal="true"` is declared, but the caret is still on the Settings row that opened it; the 22 stops inside are Back, Done, the 17 swatches, the pad, the hue strip and the hex field, and press **23** leaves for the planner's “Use my location” switch behind. Done and Escape close only the picker — the Background screen stays, as the brief asks — but focus lands on `<body>` rather than on the row that opened it, and after Escape it is on a suggestion row in the page behind. (11.1, 11.2) | `activeElement` on open: `BUTTON.settings-row “Colour#DFE8F2”`; tab walk 1 Back · 2 Done · 3–19 the swatches · 20 the pad · 21 the hue range · 22 the hex field · **23 the switch behind**; after Done: `BODY`, screens `["Background"]`; after Escape: `BODY`, `["Background"]`, then the page’s suggestion list. | **FAIL** |
| 19.2 | 5, 6 | **Three characters repaint every button, and the field rewrites what was typed.** `readHex` accepts a 3-digit shorthand, so `#63E` — the third keystroke of a six-digit value — resolves to `#6633ee` and is applied at once, and the field then shows `#6633EE` while the traveller is still typing. The component’s own comment promises the opposite (“a half-typed hex cannot repaint anything”). This is 11.5 again, in the screen that replaced it. | Typed one character at a time: `#`, `#6`, `#63` leave `#5fcfff`; **`#63E` stores `#6633ee`**, field `#6633EE`; `#63E6` leaves the stored colour at `#6633ee`; `#123456` applies correctly. | **FAIL** |
| 19.3 | 5 | **The hue strip is 26px tall.** It is the only control that sets hue by touch, and it is less than half the app’s 44px mark; the thumb is 26×26 and the label adds no padding. | 320/390/1440: input **280/350/604 × 26**; thumb 26; the label **26** high. | **FAIL** |
| 19.4 | 1, 7 | **At 320 the six swatches do not fit their tracks.** The grid is six 40px columns with an 8px gap; each swatch is `min-height: 44` with `aspect-ratio: 1`, so every tile is 44 wide, the gaps collapse to 4px and the sixth tile’s right edge sits 4px past the grid’s own edge. 390 and 1440 are exact. | 320: grid **280** wide, tracks **40**, tiles **44×44**, gap between tiles **4**, last tile right **304** vs grid right **300**, grid `scrollWidth 284 / clientWidth 280`; 390: 51.7 tiles in 51.7 tracks; 1440: 68.5 in 68.5. | **NOTE** |
| 19.5 | 7 | **With a photo, the hex field ends below the fold at 390.** The “From your photo” row adds 80px, the body scrolls 10px and the field’s bottom sits 34px under the viewport edge. Without the row the screen fits exactly. | 390 with a photo: body **838/828**, hex bottom **861.8**; without: **828/828**. | **NOTE** |

**Verified to hold:** the full viewport at all three widths with a 620px column centred from 768 (x418
at 1440); the title one line at 320 in both languages; Done **59.5×44** (NL “Klaar” 62.6×44) and Back
**44×44** at the top; 17 swatches, one `aria-pressed`, the chosen one outlined, **44 / 51.7 / 68.5**;
the 96×96 preview with the hex at **16.35:1** (**11.49:1** on a dark page colour), the saturation and
ink lines at 12px **5.48:1** light and **7.63:1** dark, labels at 11px **7.57 / 9.96:1**; the ink
sentence is derived, not typed — a chosen `#64D2FF` reads “dark ink — 12.6:1”, and `#FF7E67` on the
widgets’ screen reads 8.7:1; the pad **220** high with `role="slider"` and `aria-valuetext`, ArrowRight
moving it 8% → 63% and repainting live; the hue range 212 → 213 on ArrowRight; a swatch writing the
setting and moving `aria-pressed`; `#123456` painting the page `rgb(18,52,86)`, stored, and surviving
a reload; Done keeping the screen beneath it (`["Background"]`) and Escape closing one level only;
no horizontal overflow at any width and nothing clipped but the deliberate `.sr-only` spans; the
console clean apart from the IP lookup’s 429.

**Not measured:** the photo sampler behind “From your photo” (29’s own screen), the device colour
dialog, hover and pressed states (L3/L4), and text at 200%.

## 20. All sections

**Status:** done — its own pass on 2026-10-20, no fixes made.
**Opened from:** the dock's third button, on every page at ≤1039px — Home, Stations & stops, Departure
boards, Disruptions and Settings. **Run:** the sheet at 320×500, 360×640, 390×900, 768×900 and
1024×900, plus 320×400 for the short-phone case; the dock itself at 320/360/390/430/768/1024/1039 and
1040/1280/1440; EN and NL; light and dark; every row followed, Escape and the scrim used, the tab walk
taken from the open sheet.

**Not verifiable here:** L1 screen reader · L2 real device/notch/keyboard · L3 touch · L4
Safari/Firefox · L5 performance · L6 live network · L7 install · L8 user testing (definitions at the
top). **This sheet especially:** L1 for whether the sheet is announced when it opens and what the walk
actually sounds like — 20.1 is DOM-only; L2 for whether the home indicator really sits over the last
row — 20.3 measures the CSS, not the phone; L3 for a thumb dragging the scrim — 20.2 was a wheel.
**You should check:** VoiceOver — open the sheet, walk it, close it on the scrim — and one thumb-drag
on the scrim on a phone.

| # | Count | Finding | Measurement | Verdict |
|---|---|---|---|---|
| 20.1 | 8, 10 | **The sheet takes no focus, keeps none and gives none back.** `role="dialog"` and `aria-modal="true"` are declared and the sheet is painted over the page, but the caret stays on the dock button that opened it, so the first Tab lands on Close instead of inside a screen that has already been announced as modal. The six stops that follow are the whole of the sheet: press **7** leaves for the page and never returns. Escape closes it and focus is back on the dock button — only because it had never moved — while a click on the scrim drops focus on `<body>`. The trigger says nothing about what it does: no `aria-haspopup`, no `aria-expanded`. This is 11.1 again, as it was in 18.1 and 19.1. | `activeElement` on open `BUTTON.app-dock__item “All sections”` (`inDialog: false`); walk **1** Close · **2** Home · **3** Stations & stops · **4** Departure boards · **5** Disruptions · **6** Settings · **7 the review overlay's button** · **8 `BODY`** · 9 skip link · 10 Edit · 11 the mark · 12 the alert count · 13 From · 14 To; Escape: closed, focus on the dock button; scrim click: closed, `BODY`; trigger `aria-haspopup` **null**, `aria-expanded` **null**. | **FAIL** |
| 20.2 | 7, 8 | **The page scrolls under the scrim.** Nothing locks the document while the sheet is open, so a wheel — or a thumb drag, L3 — over the scrim moves the page behind it while the sheet stays where it is. | 390×844 on `/settings`, document 3,052 tall and unchanged across the run: three 300px wheel steps over the scrim moved `scrollY` **0 → 900** with the sheet still at top **429** / bottom **844**; `body` `overflow: visible`. | **NOTE** |
| 20.3 | 7 | **The sheet ignores the safe area.** The dock is the only thing in the stylesheet that reads `env(safe-area-inset-bottom)` (`bottom: max(12px, env(…))`, base.css:714); the overlay has `padding: 0` and the panel 16px all round, so on a phone with a home indicator the last row is drawn across it. | 390×900: last row (Settings) bottom **883** of **900** — 17px above the physical edge; `.modal` padding `16px`, `.overlay` padding `0px`, both bottom values the same. | **NOTE** |
| 20.4 | 1, 3 | **The group titles hang 13px left of the icons, and they are not headings.** The three part labels sit flush with the panel's own edge while every row's icon starts 13px in and its text 43px in; the sidebar, with the same label and the same rows, insets them by 8px. The accessibility tree agrees that they are labels and nothing more: each part is a `paragraph` followed by an unnamed `list`, so the sheet's only heading is its title. | Sheet: group label x **17**, row icon x **30**, row text x **60**. Sidebar at 1440: `.nav-group__title` x **69** + its 8px padding = **77**, icon **82**, text **112**. `ariaSnapshot`: `paragraph: Home` / `list:` with no name. | **NOTE** |
| 20.5 | 4 | **In dark the dock is nearly the colour of the page.** The fill is rgb(41,40,42) on a rgb(18,18,17) page — **1.28:1** — and its 1px border is 1.66:1, where the same fill on the light page is 17.14:1. The icons inside stay legible; what is lost is the edge that says where the dock ends and the page resumes. | Dark: fill **1.28:1** on the page, border **1.66:1**; light: fill **17.14:1**. Icons idle **9.07:1** light / **7.51:1** dark, active **7.11:1** in both. | **NOTE** |

**Verified to hold:** the dock is **150×54** at 320/360/390/430/768/1024/1039, centred to within **0.00px**
(x85/105/120/140/309/437/444.5), with three **44×44** items 4px apart in a 4px pad, 12px above the bottom
edge, and it does not move (y **634** before and after a 600px scroll) while `.app-body` reserves
**80px** for it; the active item is coral with ink at **7.11:1**, the idle icons **9.07:1**, and all
three show the app's **2px** coral ring at **2px** offset on Tab. The three entries carry `aria-label`
and `title` inside `nav aria-label="Quick navigation"` (NL: Start, Borden, Alle onderdelen). **On
desktop the expectation holds and is not flagged:** at 1040/1280/1440 `.app-dock` is `display: none`,
the All-sections button measures **0×0**, 26 Tabs at 1440 never reach it, `[role=dialog]` is not in the
document at all, and the sidebar is present. The sheet is **320** wide and bottom-anchored under 720
(top **85.47** in a 500-tall viewport, top **485.39** in a 900-tall one), **560×414.53** and centred from
768 (x **104**, y **242.73**), with radius **32 32 0 0** below 720 and **32** all round from it, padding
**16**, `max-height 88vh`; its content fits without scrolling at all five sizes (**413/413**) and
scrolls properly at 320×400 (**413** in **350**, **63px** of travel, last row bottom **382.53** inside
the sheet). The head is a **19px/24.7/-0.19** title that never wraps — one line at 320 in both
languages (**230** wide, NL “Alle onderdelen”, with the close at **259** + **44** inside 320) — and a
**44×44** close. Five rows **44** high in three groups are exactly the sidebar's five entries in the
same order, the current one marked `aria-current="page"` on all five pages and bold (**700** against
**500**), and the count is a **27.23×20** pill at 11px whose right edge lands on the row's content edge
(**360** against **361**, the 1px being the row's own border) with its centre-line **0.00px** off the
label's — **14**, agreeing with the header's 14, at **7.11:1**. Contrast: title **17.72:1**, group
labels **6.33:1**, row labels **15.68:1** current and **10.46:1** other, close **10.46:1**; dark title
**14.71:1**, dark group labels **7.77:1**. States: a row's hover paints `#f3f1ea` with the hairline
border and its press scales **0.97**; the dock's hover lifts it **4px** at **1.02** and its press is
**0.97**. Escape closes, a scrim click closes, a click inside the panel does not, and following a row
goes to `#/departures`, closes the sheet and leaves that dock icon current. With the sheet open the
dock is under the scrim rather than beside it — `elementFromPoint` at its centre is the sheet's own
label — so nothing is tapped twice. No horizontal overflow at any width; console clean apart from the
IP lookup's 429.

**Not measured:** text at 200%, the sheet over a photo or a dark page colour, and the review overlay's
own floating button — dev-only (`import.meta.env.DEV`), and the first stop outside the sheet in 20.1's
walk; the app's own stops follow it.

## 21. Use your location?

**Status:** done — its own pass on 2026-10-20, no fixes made.
**Opened from:** the first visit, with nothing stored. **Also on:** every route until answered — measured
on all nine (`/`, `/departures`, `/stops`, `/disruptions`, `/settings`, `/preferences`, `/map`,
`/results`, and a route that does not exist). **Run:** 320×500, 360×640, 390×844, 430×900, 768×900 and
1024×900; EN and NL; light and dark; “Not now”, Allow with the browser refusing, Allow with the browser
granting, the wait before either, Escape, a tap on the scrim, a tap inside the sheet, and a reload plus
a second tab after each answer.

**Not verifiable here:** L1 screen reader · L2 real device/notch/keyboard · L3 touch · L4
Safari/Firefox · L5 performance · L6 live network · L7 install · L8 user testing (definitions at the
top). **This sheet especially:** L1 for whether it is announced as a modal and where a screen reader
starts — 21.1 is the DOM's tab order, not a voice; L2 for the home indicator under the buttons (21.5
measures the CSS, not the phone); L4 for how Safari words the permission prompt this sheet sits in
front of; L8 for whether “Not stored” is read as covering the position itself (21.4). **You should
check:** VoiceOver — land on the app, walk to the sheet, answer it — and one refusal in Safari.

| # | Count | Finding | Measurement | Verdict |
|---|---|---|---|---|
| 21.1 | 8, 10 | **The gate takes no focus and is last in the tab order.** `aria-modal="true"` is declared and the page behind is painted over, yet nothing is focused on open and the sheet's three controls are the **last** stops in the document: eighteen presses walk the page behind the scrim first — the skip link, Edit, the mark, the alert count, From, To, the station field and its suggestion rows, the dock — and only then Close, Allow and Not now. Escape closes it and leaves focus on `<body>`; there is no `aria-describedby`, so the sentence under the title is not part of the dialog's description either. This is 11.1 again, and the worst placement of it so far (20.1 at least started on the button that opened it). | `activeElement` on open **`BODY`**; walk 1 skip link · 2 Edit · 3 the mark · 4 the alert count · 5 From · 6 To · 7 the station field · 8–12 suggestion rows · … · **19 Close · 20 Allow location · 21 Not now**, all before it marked `OUTSIDE`; Escape: closed, focus `BODY`; `aria-label` “Use your location?”, `aria-describedby` **null**. | **FAIL** |
| 21.2 | 6, 8 | **A tap outside answers “no” for good, and a scroll outside moves the page.** Dismissing and answering are the same act: a tap on the scrim or Escape stores `denied`, the sheet never returns — not on the next page, not after a reload, not in a second tab — and the only road back to the question is Settings’ “Remove all locally stored data”, which resets the answer to `unknown`. The scrim also does not hold the page still underneath. | Scrim tap at (195, 8): closed, `location-consent` **`"denied"`**, no sheet after reload and none in a second tab; Escape the same; a tap on the sheet's own heading leaves it `"unknown"`. On `/settings` (3,068 tall): three 300px wheel steps over the scrim moved `scrollY` **0 → 900**, `body` `overflow: visible`. | **NOTE** |
| 21.3 | 5, 6 | **Allowing changes nothing on screen.** With the permission granted and a position set, the sheet closes, `granted` is stored and the fix is written — and the page behind is exactly as it was: From still says “From”, To still says “To”, no toast, no confirmation. The only feedback is the sheet disappearing, so a traveller cannot tell a success from a refusal. The component's own comment says a granted request “fills the end of the journey with the address, which is the feedback”. | Permission granted, position 52.3702, 4.8952: `location-consent` **`"granted"`**, `location-fix` **`{"lat":52.3702,"lon":4.8952,"accuracy":25,…}`**, sheet **gone**, toast **null**, planner rows **["From","To"]** after 3s. Refused: `"denied"`, toast “Location access was not granted.” | **NOTE** |
| 21.4 | 3 | **“Not stored” while the position is stored.** The sheet's one privacy sentence reads “Sent once to OpenStreetMap to name the street. Not stored.” — true of the street name, and read by most people as covering the position, which is kept: lat, lon, accuracy and the time of the fix sit in this browser's storage for good and are what “Current location” reuses later. | Body copy 58 chars, 2 lines at 320–390. After allowing: `ov-planner:v1:location-fix` = `{"lat":52.3702,"lon":4.8952,"accuracy":25,"at":…}`. | **NOTE** |
| 21.5 | 7 | **The two answers sit 17px from the bottom edge.** On a phone the sheet is flush with the viewport floor and pads 16px all round; the only thing in the stylesheet that reads `env(safe-area-inset-bottom)` is the dock (base.css:714). These are the only two ways to answer the question, and on a device with a home indicator both pills are inside it. Same cause as 20.3. | 390×844: buttons bottom **827** of **844**; 320×500: **483** of **500**; `.modal` padding `16px`, `.overlay` `0px`, both bottom values the same. | **NOTE** |

**Verified to hold:** the sheet appears on all **nine** routes tried, including `/results` and a route
that does not exist, and on none of them once answered. **Both answers persist:** “Not now” stores
`"denied"` and the sheet is gone after a reload, on `/stops`, on `/settings` and in a second tab;
Allow stores `"granted"` and behaves the same. Geometry: **320×203.44** and bottom-anchored under 720
(top **296.56** in a 500-tall viewport, **656.75** in a 844-tall one), **560×171.06** and centred from
768 (x **104**, y **364.47**), radius **32 32 0 0** below 720 and **32** all round from it, padding
**16**, `max-height 88vh`, and nothing scrolls at any size (**201/201**, **169/169**). The title is one
line at every width in both languages (**230** wide at 320, with the close at **259** + **44** inside
320) — EN “Use your location?”, NL “Je locatie gebruiken?” — the description is **58** chars and takes
two lines at 320–390 and one from 430, the body **58** chars and two lines at 320–360, one at 390 and
up, and neither is clipped. The close is **44×44**; the footer is margin-top **16**, gap **8**, and the
two buttons **161.55×44** and **89.78×44** stay on one line inside 286 at 320 with **43.67** to spare
(NL **168.77** and **76.78**, right edge **270.55**), labels on one line. Waiting is honest: the primary
reads “Requesting…” and is disabled while Close and “Not now” stay usable. A refusal closes the sheet,
stores `"denied"` and raises a warning toast **303×56** at y **700** — above the dock, 13.5px ink,
`role="status"`, `aria-live="polite"`. Contrast: title **17.72:1**, description and body **6.33:1**,
the primary's ink on obsidian **17.14:1**, ghost and close **10.46:1**; dark **14.71:1** and **7.77:1**
on rgb(35,34,32). No horizontal overflow; console clean apart from the IP lookup's 429.

**Not measured:** text at 200%, the ten-second timeout behind “Requesting…” (the geolocation call was
stubbed so the wait could be seen at all, and a stub never times out), and the operating system's own
permission prompt — L4, and the only place that prompt can be judged.

## 22. How do you reach the first / leave the last stop?

**Status:** done — its own pass on 2026-10-20, no fixes made.
**Opened from:** the `Start:` and `End:` chips in the results bar. **Run:** 320×500, 360×640,
390×844, 430×900, 768×900, 1024×900, 1440×900 and 1920×900; EN and NL; light and dark; both titles;
Walking and Bicycle chosen; Escape with focus still on the chip and from inside the sheet; a tap on
the scrim; a tap inside the sheet; the close button; the answer by keyboard alone; a reload; and two
kinds of search — station to station, and an address to a station.

**Not verifiable here:** L1 screen reader · L2 real device/notch/keyboard · L3 touch · L4
Safari/Firefox · L5 performance · L6 live network · L7 install · L8 user testing (definitions at the
top). **This sheet especially:** L1 for whether “Walking, toggle button, pressed” is heard as one
choice of two (22.4 is the DOM, not the voice); L2 for the home indicator under the last row (22.5
measures the CSS); L4 for how Safari draws a two-answer dialogue; L8 for whether “Start:” beside an
18px walking glyph reads as “I walk to the first stop”. **You should check:** VoiceOver — open the
sheet, answer it — and one answer on a phone.

| # | Count | Finding | Measurement | Verdict |
|---|---|---|---|---|
| 22.1 | 8, 10 | **The sheet takes no focus, is last in the tab order, and lets go of the keyboard.** Opening it moves nothing: focus stays on the `Start:` chip *behind* the scrim. It declares `aria-modal="true"`, yet its three controls are the last on the page — **34** controls come first (the other chip, the when chip, Save, Sort, Options, the two alert links and three per journey card) — and the press after the last row leaves the sheet for the dock’s Home link. Escape from inside closes it and drops focus on `<body>`; Escape with focus still on the chip does land back on the chip, which is the one case that works. `aria-describedby` is null, so the sentence under the title is not the dialog’s description either. This is the shared `ui/primitives` `Dialog`, so 23–32 inherit it. | `activeElement` on open **`BUTTON.results-chip` “Start:Walking”**, `inDialog false`; **45** focusable elements on the page; the sheet’s own stops are **35 Close · 36 Walking · 37 Bicycle** of the 38 walked, **34 before them**; press 38 = `A:Home` in the dock; Escape at 35 → closed, focus **`BODY`**; Enter on 37 after 37 presses → closed, focus **`BODY`**, `accessFrom "bike"`; `aria-modal="true"`, `aria-describedby` **null**. | **FAIL** |
| 22.2 | 5, 6 | **On a station-to-station search the answer cannot do anything, and nothing says so.** Both chips are offered on every search, but an access leg exists only when an end came from an address (`fromAccessMetres`); Amsterdam Centraal → Utrecht Centraal has none, so choosing Bicycle stores the preference, swaps the chip’s glyph, and leaves the list untouched — no toast, no line, no journey that begins on a bicycle. The sheet’s own sentence promises the opposite (“The planner will not begin your journey with a bicycle leg unless you ask for one”), and nothing tells the traveller that this search has no leg to change. | Station search: **9** cards before and after; the first card reads `17:00 17:31 31 min · No transfers · 0 minute walk · €13.20 · NS` both times; the journey’s own page has one leg, the Intercity 800, and no cycle leg; the choice is stored (`accessFrom "bike"`). | **NOTE** |
| 22.3 | 3, 6 | **Where the answer does work, the result card cannot show it.** With an address at the departure end the list does re-plan — the first card moves from 17:48→18:31 to 16:55→17:31 — yet its access figure stays **“0 minute walk”** and no bicycle appears on the card: the card counts walk legs only (`journeyEngine.ts:469`), so a journey that now starts on a bicycle reads as a walk of zero minutes, and nothing draws the bike leg. The ride is legible one tap further, on the journey’s own page. The word “Bicycle” reaches the screen as a **1×1 clipped span**; both chips’ visible label stays “Start:” / “End:”, so the whole answer is an 18px glyph. | Address search, 14 cards: first `17:48 18:31 43 min · 1 transfer · €14.80 · GVB · NS` → `16:55 17:31 36 min · No transfers · €13.20 · NS`; second `17:16 18:02` → `17:55 18:31`; meta `["1 transfer","0 minute walk","€14.80","GVB · NS"]` → `["No transfers","0 minute walk","€13.20","NS"]`, with **14** “minute walk” rows across 14 cards and none a bicycle; journey page first leg `Cycle 3 min · 5657 m 16:55 – 16:58`; the only `bicycl`/`cycl` element on the results screen after choosing it is `SPAN.sr-only` **1×1**, the chip’s visible text **“Start:”** before and after. | **NOTE** |
| 22.4 | 5, 10 | **One single-choice question, exposed as two independent toggles.** The two answers are ordinary buttons with `aria-pressed`, not a radio group, so a screen reader reads “Walking, toggle button, pressed” and “Bicycle, toggle button, not pressed” — two switches that could both be on, rather than one choice — and pressing the row that is already chosen closes the sheet having changed nothing. | `role="button"` ×2, `aria-pressed` **true / false**, `[role=radiogroup]` **0**, `[role=radio]` **0**; the chosen row is also drawn: bg `rgb(243,241,234)`, border `rgb(24,24,27)`, **2** svgs against **1** on the other row (the extra is the check). | **NOTE** |
| 22.5 | 7 | **The last row sits 17px from the floor and the page scrolls under the scrim.** The sheet is flush with the viewport bottom and pads 16px all round; `env(safe-area-inset-bottom)` is read nowhere in `.modal` (the dock is the only place that reads it, base.css:714), so on a phone with a home indicator the second answer is inside it. The scrim does not hold the page still either: wheel over it and the results scroll behind. | 390×844: last row bottom **827** of **844**; 320×500: **483** of **500**; `.modal` padding **16px**, overlay padding **0px**. On `/results` (3,868 tall): three 300px wheel steps moved `scrollY` **0 → 900**, `body` and `html` both `overflow: visible`. | **NOTE** |

**Verified to hold:** the two titles — “How do you reach the first stop?” and “How do you leave the
last stop?” — with the same geometry, the second sentence mirroring the first, and the dialog’s own
label equal to its title. Geometry: **320×300.88** and bottom-anchored at 320 (y **199.13**),
**360×284.69**, **390×260** at 390 and 430, **560×227.63** at 768/1024/1440/1920 and centred (y
**336.19** in 900), radius **32 32 0 0** below 720 and **32** from it, padding **16**, `max-width 560`,
`max-height 88vh`, and nothing scrolls at any size (**299/299** at 320, **258/258** at 390,
**226/226** from 768). The title is **19px/24.7**, two lines at 320 and 360 (**230** and **270** wide)
and one from 390; the **82**-character description takes two lines to 430 and one from 768
(**470×16.19**); row one **286×78.56** and row two the same at 320, **356×62.38** and **356×78.56** at
390, **526×62.38** from 768; the disc **32×32** on its own white ground inside the chosen row, the
close **44×44**; rows in one column, padding **12**, gap **12**, radius **16**, `min-height 44`. The
chips are **44** tall and **296** wide (stacked one per row) at 320, **164** at 360, **179** at 390,
**199** at 430, **180** at 768, **160** at 1024, **168.66** at 1440 and 1920, in **12px/600** with the
key in the muted ink. The answer is kept: after a reload the chip still reads `Start:Bicycle`, and
once a search is run again the Bicycle row is the pressed one (`aria-pressed="true"`, tinted, two
glyphs) while Walking is plain; `accessFrom` is stored. Dismissing writes nothing — scrim tap, close
button and Escape all leave the preference exactly as it was — and a tap on the sheet’s own heading
keeps it open. The scrim covers **390×844** at z **90** over 62% obsidian. NL: “Hoe kom je bij de
eerste halte?”, “De planner begint je reis niet met een fietsstuk, tenzij je daarom vraagt.”, chips
“Vertrek:Lopen” and “Aankomst:Lopen” **296×44**, rows **286×62.38** and **286×78.56**. Contrast: title
**17.72:1**, description **6.33:1**, row label **15.68:1**, row hint **5.6:1**, the disc’s glyph
**17.72:1**, close **10.46:1**, chip key **5.6:1**, chip glyph **15.68:1**; dark **14.71 / 7.77 /
16.09 / 8.5** on rgb(35,34,32), rows on rgb(27,26,24), page rgb(18,18,17). No horizontal overflow at
any width; console clean apart from the IP lookup’s 429.

**Not measured:** text at 200%, and the device position behind the address search (L6) — the fixture
granted the permission and used the one real Nominatim answer.

**Seen on the way (not counted here, and not part of 22’s fixes).** The cycle leg reads “Cycle 3 min ·
5657 m” — 113 km/h: the distance is the schematic grid, where one unit is 4,000 m (`stops.ts:422`) and
Dam→Centraal is √2 units, while the minutes come from the walk network, so the pair cannot both be
right (Page 9’s territory). And the empty results screen promises the results “will appear here and
survive a refresh”; they do not — `/results` after a reload is “No search has been run in this browser
yet” with **0** chips, because the search lives in `useState` only (`AppState.tsx:278`). That is why
the answer above had to be re-checked through a second search rather than by reloading.

## 23. Date and time

**Status:** done — its own pass on 2026-10-20, no fixes made.
**Opened from:** the `Leave:` / `Arrive:` chip in the results bar. **Run:** 320×500, 360×640,
390×844, 430×900, 768×900, 1024×900, 1440×900 and 1920×900; EN and NL; light and dark; the chip in
its “Leave:” and its “Arrive:” state; a day that has gone, typed digit by digit as well as set; a
day three days out; a time off the five-minute step; a cleared time field; the “Now” shortcut;
Depart at and Arrive by; Escape from the date field and from the time field; the close button; the
scrim; a tap on the sheet’s own heading; a reload after answering.

**Not verifiable here:** L1 screen reader · L2 real device/notch/keyboard · L3 touch · L4
Safari/Firefox · L5 performance · L6 live network · L7 install · L8 user testing (definitions at the
top). **This sheet especially:** L1 for whether “Depart at, toggle button, pressed” is heard as one
choice of two (23.5 is the DOM, not the voice) and whether the `aria-live` line is spoken twice over
the field that changed; L2 for the operating system’s date and clock popups over a large phone and
for the home indicator under the last row (23.4 is the CSS); L4 for how Safari and Firefox draw
`<input type="date">` and `<input type="time">` and in which format — this run’s browser is en-US,
which is why its own fields read 10/20/2026 and 05:55 PM under a 24-hour app. **You should check:**
VoiceOver on both fields, and one date picked from the real iOS calendar wheel.

| # | Count | Finding | Measurement | Verdict |
|---|---|---|---|---|
| 23.1 | 5, 8, 10 | **The sheet takes no focus, is last in the tab order, and lets go of the keyboard.** Opening it moves nothing: focus stays on the `Leave:` chip *behind* the scrim. It declares `aria-modal="true"` and names itself “Date and time”, yet **32** Tab presses walk the page behind — Save this search, Sort, Options, the two alert links and three controls on each of nine cards — before Close. Its own six controls are stops **33–44** (the two native fields are four stops each: month, day, year, picker), and the press after them leaves the sheet for the dock’s Home link. Escape from either field closes it and drops focus on `<body>`; so does the close button. `aria-describedby` is null, so the sentence under the title is not the dialog’s description either. Same shared `Dialog` as 22.1 and 13.1, and already recorded for this sheet as 2.1. | `activeElement` on open **`BUTTON.results-chip` “Leave:Now”**, `inDialog false`; **51** focusables, **6** of them in the sheet, with only the dock’s three links after them; walk **33 Close · 34–37 `input[date]` · 38–41 `input[time]` · 42 Depart at · 43 Arrive by · 44 Now**, then **45–47** the dock (Home, Boards, All sections); Escape at 34 → closed, focus **`BODY`**; Escape at 38 → closed, focus **`BODY`**; Enter on the chip then three Tabs → `BUTTON.results-chip` “Options”, still outside; `aria-label` “Date and time”, `aria-describedby` **null**. | **FAIL** |
| 23.2 | 5, 6 | **A day that has already gone is accepted, and the list is re-planned for it.** The date field carries `min` = today and the browser knows the answer is wrong — its own `validationMessage` reads “Value must be 10/20/2026 or later.” — but the app stores it: the chip behind becomes “19 Oct · 17:55”, the line under the fields reads “Monday 19 October · 17:55”, and the nine cards are rebuilt to depart at 18:30 **yesterday**, presented as the answer — typing the day in digit by digit behaves the same. Nothing on the screen says anything: no `aria-invalid`, no error line, no toast, and the field is drawn exactly as a valid one — only the same focus ring. The code’s own comment (“A journey cannot be planned for yesterday; the engine would only ever answer with the departures that already left”) is the promise this breaks. | Set to `2026-10-19`: `validity.rangeUnderflow` **true**, `:invalid` **true**, `validationMessage` “Value must be 10/20/2026 or later.”; `aria-invalid` **null**, `.field__error` **false**, toast **null**; chip `Leave:` “19 Oct · 17:55”; hint `Monday 19 October · 17:55`; **9** cards, first `18:30 → 18:54`. Typing `10192026` into the focused field lands on the same `2026-10-19` and the same stored search — chip “19 Oct · 18:00”, **11** cards — with the same silence. | **FAIL (minor)** |
| 23.3 | 5, 6 | **Every change is applied behind the scrim, and the sheet never says so — and “Now” does not finish the question.** There is no footer and no Done: the sheet’s last row is the switcher and Now, each of them re-plans the list at once, invisibly, and the sheet stays open — including Now, which *is* a complete answer (“plan from this minute”) and still leaves the traveller to find the X, the scrim or Escape before nine journeys can be seen. The traveller cannot tell a change that landed from one that did not. | With the sheet open the list went **9 → 10** cards on a date three days out, **10 → 11** on Arrive by, and back to **9** on Now, while the sheet stayed open (`open true`) every time; the sheet contains no count, no “updated” and no Done — closing is the 44×44 “Close”, Escape, or the scrim. | **NOTE** |
| 23.4 | 7 | **The last row sits 17px from the floor and the page scrolls under the scrim.** The sheet is flush with the viewport bottom and pads 16px all round; `env(safe-area-inset-bottom)` is read nowhere in `.modal` (the dock is the only place that reads it, base.css:714), so on a phone with a home indicator the Now button is inside it. The scrim does not hold the page still either: wheel over it and the results scroll behind. Same cause as 22.5. | 320×500: last row bottom **483** of **500**; 390×844: **827** of **844**; `.modal` padding **16px**, overlay padding **0px**. On `/results` (3,748 tall): three 300px wheel steps moved `scrollY` **0 → 900**, `body` and `html` both `overflow: visible`. | **NOTE** |
| 23.5 | 5, 10 | **One question answered two ways at once.** Depart at and Arrive by are two independent `aria-pressed` buttons, not a radio pair, so a screen reader hears two switches that could both be on rather than one of two; pressing the one already chosen changes nothing. Same as 22.4, one step better for having a group name. | `role="group"` labelled “Depart at or arrive by”; `aria-pressed` **true / false**; `[role=radiogroup]` **0**, `[role=radio]` **0**; pressing Depart at while pressed leaves it pressed and the search untouched. | **NOTE** |

**Verified to hold:** the title reads “Date and time” with the description “By default a journey is
planned from today, right now.” (**54** chars), and the sheet’s own name is that title rather than
the sentence under it. Geometry: **320×318.09** and bottom-anchored at 320 (y **181.91**), **360×318.09**,
**390×301.91**, **430×257.91**, **560×257.91** and centred from 768 (y **321.05** in 900), radius
**32 32 0 0** below 720 and **32** from it, padding **16**, `max-width 560`, `max-height 88vh`
(**440** in a 500-tall viewport), and nothing scrolls at any size (**316/316** at 320, **300/300** at
390, **256/256** from 430). The day and the time share **one** frame — **286×90** at 320 and
**356×90** at 390 stacked under 400px, **396×46** (229.83 + 164.16) at 430 and **526×46** (305.66 +
218.33) from 768 — 1px rgb(205,199,184), radius **20**, no inner border, the platform’s own calendar
and clock glyphs kept, and neither field clips its value at any width (`clientWidth` =
`scrollWidth`). Both fields are **13.5px/500** tabular, **17.72:1**, and their focus is the **2px
inset** obsidian ring even on a click. The label is “When”, **11px/700** uppercase at **0.11px**
tracking and **6.33:1**; the line under the fields is **12px**, **21** chars, one line, **5.7:1**
(**6.24** dark), `aria-live="polite"`, and it reads the same answer back in the app’s own date and
clock format beside the device’s: today 17:55 → “Today, 20 Oct · 17:55”, 19 Oct → “Monday 19 October
· 17:55”, 23 Oct → “Friday 23 October · 22:05”. Clearing the time field leaves the last real time
standing (back to 17:55), so the search cannot silently move to midnight, and a time off the
five-minute step is kept and read back exactly (14:03 stays 14:03 — the step is a hint to the
picker’s arrows, not a rule). The shortcut works: Now returns the date, the five-minute step and
Depart at (“2026-10-20”, “17:55”, pressed true/false), the chip behind reads “Leave: Now” and the
list returns to 9. Arrive by flips the pressed pill and the chip’s key to “Arrive:”, and the engine
answers with arrivals — first card **22:00 → 22:26**, 11 cards. The switcher is **182×54** holding
two **84×44** pills in **11px/700**, radius **9999**, the pressed one white at **17.72:1** and the
plain one **5.6:1**; Now is **87.34×44** with a clock at **17.72:1**; Close is **44×44** at
**10.46:1** (**11.59** dark). The scrim covers the viewport at z **90** in 62% obsidian; a tap on it
closes, a tap on the sheet’s own heading does not. NL at 320: “Datum en tijd” (**230** wide, one
line), “Standaard wordt een reis gepland vanaf vandaag, nu meteen.” (**58** chars, two lines), the
label “Wanneer”, the hint “Vandaag, 20 okt · 17:55”, “Vertrek om” **98.11** and “Aankomst voor”
**128.44** beside “Nu” **74.23×44** — the row takes two lines (**106**) and the sheet is
**370.09** tall, 52 more than English, with nothing clipped. Dark: modal rgb(35,34,32) on page
rgb(18,18,17), every pair **14.71 / 7.77 / 7.77 / 6.24 / 14.71 / 14.71 / 8.5 / 14.71 / 11.59 /
8.5 / 16.09**. No horizontal overflow at any of the eight widths; console clean apart from the IP
lookup’s 429.

**Not measured:** text at 200% (L2). The operating system’s own calendar and clock are **L4** and
were not seen at all — headless Chromium draws no popup, so their size, their Escape-to-dismiss and
whether a past day can be *picked* there (the `min` should grey it out) are unchecked; this run
typed into the fields, which is what the app’s state reacts to. And the answer could not be
followed across a reload: `/results` after one has no search at all (“No search has been run in this
browser yet”, **0** cards), because the search lives in `useState` only — 22’s note.

**Seen on the way (not counted here, and not part of 23’s fixes).** The app’s clock is 24-hour
(“Today, 20 Oct · 17:55”) while the device’s field beside it reads “05:55 PM” — the trade-off the
code names, with the readback as the mitigation, and on a Dutch phone the pair would agree. And the
description explains the *default* (“By default a journey is planned from today, right now.”) rather
than what the two controls in the sheet do, which is the question a traveller opening it has.

## 24. Add a widget

**Status:** done — its own pass on 2026-10-20, no fixes made.
**Opened from:** Home → `Edit` → the `+` (Home layout) → **Add widget**; and the two-second hold
instead of `Edit`. **Run:** 320×500, 360×640, 390×844, 430×900, 768×900, 1024×900, 1440×900 and
1920×900; EN and NL; light and dark; both ways into customising; all twelve Add presses in one
sheet; a press while the list is scrolled; Done with nothing added and with everything added;
Escape, the ×, the scrim and Done as four different exits; a reload after a layout change; **Reset
to the default layout** from inside the sheet; a wheel over the sheet, past its end, and over the
strip above it; a press on a row’s own text.

**Not verifiable here:** L1 screen reader · L2 real device/notch/keyboard · L3 touch · L4
Safari/Firefox · L5 performance · L6 live network · L7 install · L8 user testing (definitions at the
top). **This sheet especially:** L1 for whether twelve buttons called “Add” are distinguishable in a
screen reader’s list (24.4 is the DOM, not the voice) and whether the vanishing row is announced;
L2 for a phone’s thumb starting the two-second hold and for 88vh under a browser’s own chrome; L3
for a real one-thumb press after the list has moved (24.3); L4 for iOS Safari’s rubber-banding
inside a sheet that scrolls itself; L8 for whether “Reset to the default layout” in an add list
reads as the destructive act it is. **You should check:** VoiceOver through the catalogue, and one
Reset on a layout you care about.

*The “sizes” this section was written to audit no longer exist: every card is the width its widget
declares and as tall as its content, and the sheet holds no size control at all — the words Small,
Medium and Large appear nowhere in it. That part of the brief is **not applicable** rather than
unchecked.*

| # | Count | Finding | Measurement | Verdict |
|---|---|---|---|---|
| 24.1 | 8, 10 | **The sheet takes no focus, is not trapped, and lets go of the keyboard.** Opening it moves nothing: at 390 focus is on `<body>` and at 1440 it is still on the sidebar’s “Departure boards” link *behind* the scrim. Its fifteen controls are stops **13–27** of the page’s **31** focusables — twelve come first, the dock’s three links and the dev Review-notes button after — and the press after Done leaves for the dev button, then `<body>`, then the page from its skip link. Escape, the ×, the scrim and Done all close it and all drop focus on `<body>`. `aria-describedby` is null. Same shared `ui/primitives` `Dialog` as 22.1 and 23.1. | `activeElement` on open **`BODY`** at 390 and **`A.nav-item` “Departure boards”** at 1440, both `inDialog false`; **31** focusables at 390 with the sheet at **13–27**, **33** at 1440 with the sheet at **18–32**; after Done: **`BUTTON` “Review notes”**, then **`BODY`**, then `A` “Skip to main content”; Escape from an Add button → closed, focus **`BODY`**, mode **still on (2 grips)**; the × and the scrim the same; `role="dialog" aria-modal="true" aria-label="Add a widget"`, `aria-describedby` **null**. | **FAIL** |
| 24.2 | 7, 8 | **The sheet’s own head scrolls away with the list, and its Done is more than a screen below the first fold.** The sheet is the scroll container, so the title and the 44×44 close travel up out of view with the twelve rows: at 320 the box is **440** tall against **1,332** of content, Done sits **1,273** in, and **894** of scroll is needed to reach it; at 390 it is **742.72** against **1,203**, Done **1,144** in, **462** of scroll. Scrolled to the bottom there is no title and no close on screen — the last visible thing above the rows is the category “YOURS” — and the only visible way out is the 60px strip above the sheet, or Escape. | 320×500: modal **320×440** at y **60**, `scrollHeight 1332 / clientHeight 438`, Done `offsetTopInModal` **1,273.41**, `reachable false`; at the end `scrollTop 894` and the title’s y **−817**. 390×844: **390×742.72** at y **101**, `1203 / 741`, Done **1,143.91**, `reachable false`; at the end `scrollTop 462`, title y **−343.72**. 1440×900: **560×792**, `1126 / 790`, Done **1,066.84** — still below the fold. `.modal { max-height: 88vh; overflow-y: auto }`. | **FAIL (minor)** |
| 24.3 | 5, 10 | **Every Add moves the list under the finger.** The row disappears from under the pointer and nothing holds the scroll position, so the content below steps up by that row’s height: a press at one point adds one widget and leaves a *different* widget’s Add button under the same thumb, which makes a second press add something the traveller never chose. The last Add also shrinks the sheet (332 → 226) and drops its top edge 106px while the pointer is still in it. | With the list scrolled **320px**, pressed “Find a stop”’s Add at (323, **265**): the row went, `scrollTop` stayed **320**, and `elementFromPoint(323,265)` then resolved to “**Stops near you**”; the count went 11 → 10. Twelfth Add: sheet **390×332** at y **512** → **390×226** at y **618**, home behind 14 → 15 cards, and the sentence “Every widget in the catalogue is already on your home screen.” | **FAIL (minor)** |
| 24.4 | 5, 6, 10 | **Nothing announces an addition, twelve buttons are all called “Add”, and two controls are called “Done” at once.** Adding is silent: no toast, no live region anywhere in the dialog, no “Added”, the count line simply drops 12 → 11, and the card that appeared is behind the scrim. Each row’s Add button has no `aria-label` and no `aria-describedby`, so the sheet offers **twelve** identically named buttons with the row’s title unlinked beside them. At the same time the header’s **Done** (ends customising) is still on screen above the sheet beside the sheet’s own **Done** (ends both), with nothing to tell them apart — and closing with Escape, the × or the scrim *keeps* customising while Done ends it, which no line on the sheet says. | After one Add: toasts **null**, dialog still open, count “**11 widgets available.**”, home behind 3 → 4 cards, stored `["planner","next-departures","pinned-stops","right-now"]`; `[aria-live]` inside the dialog **0**; Add `aria-label` **null**, `aria-describedby` **null**, `getByRole('button', { name: 'Add' }).count()` = **12**; category labels are `SPAN.field__label`, and the sheet’s only heading is `H2: Add a widget`; `getByRole('button', { name: 'Done' }).count()` = **2** (header pill + footer); Escape/×/strip leave **2 grips**, Done leaves **0**. | **NOTE** |
| 24.5 | 5, 6 | **“Reset to the default layout” sits at the foot of the add list, and wipes the layout without a word.** A destructive, layout-wide action is the last row of a list of additions: pressing it takes fifteen cards back to three, returns all twelve rows, closes nothing, raises no toast and offers no undo, and the sheet is still open on the layout it just replaced. It is also the **14th** of the sheet’s 15 stops, so a keyboard walk lands on it one press before Done. | All fifteen added (`stored` list of 15 ids), then Reset: home **15 → 3** cards, rows **0 → 12**, toast **null**, dialog **still open**, `stored ["planner","next-departures","pinned-stops"]`; the button is **261.42×44** (NL) and reaches at **1,605.72** into a 438-tall box at 320 — below Done’s own scroll, and before the footer in DOM order. | **NOTE** |
| 24.6 | 7, 8 | **Below 720 the sheet is the whole width, so the scrim is a strip — and the page behind scrolls under it.** The only visible exit from a full-height list is the band above the sheet: **101px** in a 390×844 window, **60px** in a 320×500 one — and the header is **80** tall, so in the 320 window that band is the bottom of the header and no page surface at all. A wheel over that band scrolls the page behind while the sheet stays open; the page is not held still (`body` and `html` both `overflow: visible`). Same cause as 22.5 and 23.4. | 390: sheet y **101**, strip **101**; 320: sheet y **60**, strip **60**; `.app-header` **80** tall in both, and a tap at (160, 20) at 320 closes the sheet. At 320 (page behind 703 tall): four 300px wheel steps over the strip moved `scrollY` **0 → 203** with the sheet open and its own `scrollTop` still **0**; over the sheet itself `scrollTop` went **0 → 894** (its end) with `scrollY` unchanged; `body`/`html` `visible`. A tap on the theme’s own title (y **131**) or a group label (y **214**) does not close it. | **NOTE** |

**Verified to hold:** the title reads “Add a widget” at **19px/24.7**, one line at every width (**230**
wide at 320, **300** at 390, **470** from 768), and the close is **44×44** at **10.46:1**. Geometry:
**320×440** and bottom-anchored at 320 (y **60**), **360×563.19**, **390×742.72**, **430×792**,
**560×792** at 768/1024/1440/1920 and centred (y **54** in 900), radius **32 32 0 0** below 720 and
**32** from it, padding **16**, `max-width 560`, `max-height 88vh`. The count line is “12 widgets
available.” in **12px**, **6.33:1**, **286** wide at 320 and **526** from 768. The three groups are
“Plan · Travel information · Yours” — **11px/700**, uppercase, **0.11px** tracking, **6.33:1** — and
the twelve rows keep the catalogue’s own order: **Plan** (Re-run from now, What it costs, Network
map), **Travel information** (Alerts on your journeys, Alerts at your favourite stops, Find a stop,
Stops near you, Last service home, A second departure board), **Yours** (Your journeys, Your
commute, Facilities at your stations). Rows are **286×86.75** at 320, **326×70.56** at 360,
**356×70.56** at 390, **396×70.56** at 430 and **526×62** from 768, padding **8 12**, gap **12**,
radius **12**, on rgb(243,241,234) over white with a 1px rgb(205,199,184) hairline; the title is
**12px/600** at **15.68:1**, the description **12px** at **5.04:1** taking three lines at 320, two at
390 and one from 768. The Add pill is **74.34×44** at every width — its own height is the 44px
target, no `::after` — in **11px/700** uppercase, **17.72:1**, radius **9999**, padding **0 12**.
Pressing it takes the row away, drops the count by one and adds the card to the home screen behind
(3 → 4), and pressing all twelve leaves **15** cards, **0** rows, **0** group labels, the sentence
“Every widget in the catalogue is already on your home screen.”, and a sheet that settles at
**224×224** with Done reachable at y **783** in 844. The layout is written at once
(`["planner","next-departures","pinned-stops","right-now"]`) and survives a reload (4 cards, the
fourth “Re-run from now”), and Reset takes it back to 3. Done closes the sheet **and** the mode
(0 grips, header “Edit”); Escape, the × and the scrim close only the sheet (2 grips, mode on); Done
with nothing added ends the mode all the same. A press on a row’s own text adds nothing. The scrim
covers the window at z **90** in 62% obsidian, and taps on its strip close. The second way in works:
a 2,300ms hold opens the mode and the same twelve rows. NL at 320: “Een widget toevoegen” (**230**
wide, one line), “12 widgets beschikbaar.”, “Plannen · Reisinformatie · Van jou”, “Toevoegen”, rows
**102.94** and **86.75** tall, the sheet **440** tall over **1,665** of content (333 more than
English), “Klaar” **70.56×44** and “Terug naar de standaardindeling” **261.42×44**. Dark: modal
rgb(35,34,32) on page rgb(18,18,17), rows rgb(27,26,24) — **14.71 / 7.77 / 7.77 / 16.09 / 6.82 /
14.71 / 14.71 / 14.71 / 11.59**. No horizontal overflow at any of the eight widths; console clean
apart from the IP lookup’s 429.

**Not measured:** text at 200% (L2). The hold entry was measured only for whether it opens the
sheet, not for how a phone feels under the thumb.

**Seen on the way (not counted here, and not part of 24’s fixes).** A fresh home screen offers
**Reset to the default layout** as an enabled control that can only do nothing — the layout is
already the default — and the count line names only what is left (“12 widgets available.”), never
how many there are: fifteen.

## 25. Unfavourite this journey?

**Status:** done — its own pass on 2026-10-20, no fixes made.
**Opened from:** Home → the filled heart at the right of a row in the **Your journeys** widget's
**Saved journeys** list. **Run:** 320×500, 360×640, 390×844, 430×900, 768×900, 1024×900,
1440×900 and 1920×900; EN and NL; light and dark; the first row and the second; the last journey
in the widget; two journeys on the same pair of stops saved at 08:30 and 18:00; Escape, the ×, the
scrim, Cancel and Yes as five different exits; Escape from the heart behind the scrim and from the
page's own skip link; a press where the heart is while the sheet is open; a keyboard walk through
the dialogue and past it; the empty state after the last removal.

**Not verifiable here:** L1 screen reader · L2 real device/notch/keyboard · L3 touch · L4
Safari/Firefox · L5 performance · L6 live network · L7 install · L8 user testing (definitions at the
top). **This sheet especially:** L1 for whether the heart announces its own change of state as the
question opens (25.3 is the DOM and the pixels, not the voice) and whether “Amsterdam Centraal
Utrecht Centraal” is heard as one journey or two names run together — the arrow between them is an
icon, so the text has no separator at all; L2 for the 17px under Yes on a phone with a home
indicator (25.6); L3 for a thumb on a 44px heart beside a 175px Yes; L8 for whether “the search
itself is untouched” tells a traveller what they are about to lose (25.5). **You should check:**
VoiceOver on the heart and on the dialogue, and one long-press on a row's date to see whether the
row can be told apart before it is opened.

| # | Count | Finding | Measurement | Verdict |
|---|---|---|---|---|
| 25.1 | 8, 10 | **The question never takes the keyboard, never keeps it, and never gives it back.** Opening it moves nothing: focus stays on the heart *behind* the scrim — the very row being questioned — at 320, 390 and 1440. With two journeys saved its three controls are stops **14–16** of **20**, and Tab from the heart visits the *other* row's Plan and heart before it reaches Close; with one journey saved they are reached first. Every exit — Escape, the ×, the scrim, Cancel and Yes — leaves focus on `<body>`, and nothing behind is made inert (`[inert]` **0**), so the page's skip link, header, dock and the whole card stay in the tab order while the question is up. `aria-describedby` is null, so the sentence under the title is not the dialogue's description either. Same shared `ui/primitives` `Dialog` as 22.1, 23.1 and 24.1. | `activeElement` on open **`BUTTON.btn` “Amsterdam Centraal to Utrecht Centraal — waiting for confirmation”**, `inDialog` **false** at 320, 390, 768 and 1440; **20** focusables with the dialogue at **14–16**, **13** of them before it; walk with two rows: **Plan · Unfavourite Rotterdam… · Close · Yes · Cancel**, then **Home · Boards · All sections** (1440: **Review notes**, then `<body>`, then the skip link); walk with one row: **Close · Yes · Cancel**, then the page; after Escape **`BODY`**, after the × **`BODY`**, after the scrim **`BODY`**, after Cancel **`BODY`**, after Yes **`BODY`**; `role="dialog" aria-modal="true" aria-label="Unfavourite this journey?"`, `aria-labelledby` **null**, `aria-describedby` **null**. | **FAIL** |
| 25.2 | 5, 6 | **The question cannot say which journey it is about.** Two saved journeys on the same pair of stops — today 08:30 and today 18:00 — are a legal and ordinary pair, and the widget draws two rows on purpose. Their rows read “Today · 08:30” and “Today · 18:00”; the two dialogues are identical word for word and name only the route, so the traveller is asked to confirm the removal of a journey the sheet does not identify. Yes then removes exactly one of the two — the one whose heart was pressed — and the list behind is the only thing that ever said which. | Rows: “Amsterdam Centraal Utrecht Centraal **Today · 08:30** Plan” and “… **Today · 18:00** Plan”; dialogue text for the 08:30 journey and for the 18:00 journey **identical** (`textContent` equal, body line “Amsterdam Centraal Utrecht Centraal” in both, **1,667** characters of HTML in both); no date, no time, no “Today” anywhere in the dialogue. Removing the second one left **sv-1** stored and the row “Amsterdam Centraal Utrecht Centraal Today · 08:30”. | **FAIL** |
| 25.3 | 5, 10 | **Pressing the heart empties it before the question is answered.** The press flips `aria-pressed` from **true** to **false** and swaps the glyph from the filled heart to the outline one, so the row behind the scrim already shows the journey as not favourited while Yes and Cancel are both still unanswered — the control contradicts the question it just asked. Answering No puts both back (pressed true, filled again), so nothing is lost; what is wrong is the order of the two facts on screen, and a screen reader hears “not pressed” about a journey that is still saved. | Before: `aria-pressed` **true**, `fill` **`currentColor`** (filled). While open: **false**, `fill` **`none`** (outline) — at 320, 390 and 1440 alike. After Escape or Cancel: **true**, **`currentColor`**. Label meanwhile: “Amsterdam Centraal to Utrecht Centraal — waiting for confirmation”. | **FAIL (minor)** |
| 25.4 | 5, 6 | **The removal is silent, final, and takes the answer with it.** Yes deletes the row, closes the sheet and says nothing: no toast, no live region inside the dialogue, no undo, and focus on `<body>` rather than anywhere in the card that is left. When it was the last journey the whole list becomes the widget's empty state in the same instant, so what the traveller sees afterwards is a card explaining what a saved journey is — not that one has just gone. | Yes on the first of two: rows **2 → 1**, `stored` `["sv-1","sv-2"] → ["sv-2"]`, card text “Your journeys Saved journeys Rotterdam Centraal Den Haag Centraal Today · 10:20 Plan”; toasts **none**; `[aria-live]`/`[role=status]` in the dialogue **0** (page **2**); focus **`BODY`**. Last one: rows **1 → 0**, `stored` **`[]`**, `.widget-empty` **1**, card text “Your journeys A saved search is a pair of stops you keep. A saved journey is one result with its own times…”. | **NOTE** |
| 25.5 | 6, 8 | **The sentence under the title explains a search the traveller may never have saved.** “It disappears from this widget; the search itself is untouched.” names the *search* as the thing that survives — but the row being removed is a saved **journey**, and with no saved search stored the pair is held nowhere after Yes: the two ends, the date and the time are gone with the row. The app elsewhere is careful to keep the two species apart by name (“Save this search” against “Save this journey”, and the widget's own empty state explaining both), so the one sentence that should say what is lost blurs them. | After Yes with `recent-searches` empty: `stored` **1 → 0**, `searches` **`[]`**, nothing on the card or the page names the pair; the empty state that follows explains the difference between the two kinds rather than what was just removed. Dialogue description measured at **12px/16.2**, two lines at 320–430, one from 768, **6.33:1**. | **NOTE** |
| 25.6 | 7 | **The two answers sit 17px from the floor, and the sheet reads no safe-area inset.** Below 720 the sheet is flush with the viewport bottom and pads 16 all round (plus a 1px border), so the destructive answer ends 17px above the floor — inside the home indicator on a phone that has one. `.modal` reads no `env(safe-area-inset-bottom)` at all; the only place the app reads it is the dock. Same cause as 23.4. | 320×500: sheet **320×187.25** at y **312.75**, Yes bottom **483** of **500**; 390×844: sheet at y **656.75**, Yes bottom **827** of **844**; steps top **17** / bottom **17** (16px `--pad-hero` + 1px border); `.overlay` padding **0** below 720; `safe-area` in `src/`: **base.css:714** (dock) and the dev ReviewLayer only. | **NOTE** |

**Verified to hold:** the title reads “Unfavourite this journey?” at **19px/24.7**, weight **700**,
**−0.19px** tracking, **17.72:1**, one line at every width in English (**NL** takes two lines at 320,
**49.38** tall); the description “It disappears from this widget; the search itself is untouched.”
is **12px/16.2** at **6.33:1**, two lines at 320–430 and one from 768; the route line under it is
**12px/16.2** at **10.46:1** and one line even for “Amsterdam Bijlmer ArenA Den Haag Centraal”
(**16.19** at 320). Geometry: **320×187.25** bottom-anchored at 320 (y **312.75**), **360×187.25**
(y **452.75**), **390×187.25** (y **656.75**), **430×187.25** (y **712.75**), then **560×171.06** and
centred at 768/1024/1440/1920 (y **364.47** in 900, x **104 / 232 / 440 / 680**), radius **32 32 0 0**
below 720 and **32** from it, padding **16** plus a 1px `--l2-border`, `max-width 560`,
`max-height 88vh` (**440** in the 500-tall window, **742.72** at 390), and nothing scrolls at any
size (**185/185** at 320–430, **169/169** from 768). The blocks are the 4px scale: head margin-bottom
**12**, gap **12**, route margin-top **16**, footer margin-top **16**, footer gap **8**, and the
measured steps are **17 / 0 / 4 / 16 / 16 / 17**. The three controls are **Yes, unfavourite it**
**175.03×44** on rgb(255,126,103) with a 1px rgb(233,105,79) border, ink rgb(24,24,27) at
**7.11:1**; **Cancel** **80.2×44**, bare, **10.46:1**; **Close** **44×44** at **17** from the right,
**10.46:1**; all three radius **9999** (Close **50%**), **11px/700** uppercase, and the two answers
share one 8px gap. Keyboard focus is the app's **2px coral ring at 2px offset**, measured on Close,
Yes and Cancel from real Tab presses. Every exit closes and keeps the journey except Yes: Escape
(closes, stored **2**), the × (**2**), the scrim (**2**), Cancel (**2**), Yes (**1**). Escape works
from the heart behind the scrim and from the page's skip link as well, because the listener is on
`window`. The trigger is **44×44** with label “Unfavourite Amsterdam Centraal to Utrecht Centraal”
and `aria-pressed="true"`; a press where it sits while the sheet is open lands on the scrim and
dismisses the question rather than pressing anything behind it. The scrim is `position: fixed`,
`inset: 0`, z **90**, 62% obsidian, and covers the viewport at every width. The dialogue is rendered
inside the widget's own card (`.modal` → `.overlay` → `.widget__body` → `.card`) with no transformed
ancestor, so the fixed overlay is not clipped. NL at 320: “Deze reis uit favorieten halen?”,
“Het verdwijnt uit dit blok; de zoekopdracht zelf blijft ongewijzigd.”, “Ja, uit favorieten halen”
**203.75×44**, “Annuleren” **101.52×44** — the pair no longer fits on one line (203.75 + 8 + 101.52
in 286) and stacks, so the sheet grows to **320×263.94** at y **236.06** with nothing clipped; at
1440 it is one line again and **560×171.06**. Dark: modal rgb(35,34,32), title **14.71**, description
**7.77**, route **11.59**, Close and Cancel **11.59**, Yes **7.11** on the same coral with a
rgb(233,105,79) border. No horizontal overflow at any of the eight widths; console clean apart from
the IP lookup's **429**.

**Not measured:** text at 200% (L2), any touch (L3), and how a screen reader announces a dialogue
that opens without moving focus (L1). iOS Safari was not run (L4), so the 17px under Yes is a
measurement, not a verdict on a real home indicator.

**Seen on the way (not counted here, and not part of 25's fixes).** The pending heart's label
changes to “… — waiting for confirmation”, which is the clearest sentence in the whole interaction.
And at 320 in Dutch the safe answer ends up *below* the destructive one, because the footer wraps
rather than shrinking either pill.

## 26. Delete all saved searches?

**Status:** done — its own pass on 2026-10-20, no fixes made.
**Opened from:** Home → the **Your journeys** widget's **Saved searches** list → **Delete all saved
searches**, the bare button with the bin under the list. **Run:** 320×500, 360×640, 390×844,
430×900, 768×900, 1024×900, 1440×900 and 1920×900; EN and NL; light and dark; three saved searches
(two rows and “1 more, not shown at this size”) and exactly one; a widget holding saved journeys
beside the searches, and one holding nothing but searches; Escape, the ×, the scrim, Cancel and Yes
as five different exits; a keyboard walk through the dialogue and past it; the storage read before
and after every choice.

**Not verifiable here:** L1 screen reader · L2 real device/notch/keyboard · L3 touch · L4
Safari/Firefox · L5 performance · L6 live network · L7 install · L8 user testing (definitions at the
top). **This sheet especially:** L1 for whether “1 saved searches” is spoken as written (26.2 is the
rendered text) and whether the whole group disappearing is announced at all (26.3); L2 for the 17px
under Yes on a phone with a home indicator; L3 for a thumb on a 44px bin under a list of rows; L8
for whether a button called “Delete all saved searches” under a two-row list is read as clearing the
list or the card. **You should check:** VoiceOver on the trigger and on the count line, and one
deletion on a browser whose searches you actually use.

| # | Count | Finding | Measurement | Verdict |
|---|---|---|---|---|
| 26.1 | 8, 10 | **The question takes no focus, keeps none, and gives none back.** Opening it leaves focus on the trigger *behind* the scrim — “Delete all saved searches”, still in the card, `inDialog` false at every width. Its three controls are stops **19–21** of **25**, and Tab after them leaves for the dock's Home link (320/390) or the dev Review notes button (1440/1920) rather than circling; nothing behind is made inert (`[inert]` **0**). Escape, the ×, the scrim, Cancel and Yes all drop focus on `<body>`, and the trigger itself is removed by Yes, so there is no element left to return to. `aria-describedby` is null while the two-sentence description sits under the title. Same shared `ui/primitives` `Dialog` as 22.1, 23.1, 24.1 and 25.1. | `activeElement` on open **`BUTTON.btn` “Delete all saved searches”**, `inDialog` **false** at 320, 390, 768 and 1440; **25** focusables with the dialogue at **19–21**; walk **Close · Yes, delete them · Cancel**, then **Home · Boards · All sections** (1440: **Review notes**, then `<body>`, then the skip link); after Escape **`BODY`**, after the × **`BODY`**, after the scrim **`BODY`**, after Cancel **`BODY`**, after Yes **`BODY`**; `role="dialog" aria-modal="true" aria-label="Delete all saved searches?"`, `aria-describedby` **null**, `aria-labelledby` **null**. | **FAIL** |
| 26.2 | 3, 6 | **One saved search produces “1 saved searches will be removed.”** The count line is a single stored string with a fixed plural, so the only wording in the sheet that names the number is ungrammatical exactly when the number is one — which is the commonest case, since the trigger only appears when there is at least one search and a fresh browser usually has one or two. Dutch has the same fault (“1 bewaarde zoekopdrachten worden verwijderd.”). The rest of the sentence is right: the number matches storage in both cases. | With one search stored: **“1 saved searches will be removed.”** (EN, 320 and 390) and **“1 bewaarde zoekopdrachten worden verwijderd.”** (NL, 390). With three: “3 saved searches will be removed.”, matching `recent-searches` length **3**. Source: `'{count} saved searches will be removed.'` — one key, no singular. | **FAIL** |
| 26.3 | 5, 6 | **The deletion is silent, and takes away the very button that asked.** Yes empties the list, removes the whole **Saved searches** group — heading, rows, “3 stored in this browser”, the trim note and the trigger itself — and says nothing: no toast, no live region inside the dialogue, no undo. When the widget held nothing else, the entire card becomes its empty state in the same instant, so the last thing on screen explains what a saved search is rather than that three have just gone. Focus lands on `<body>` with no element to return to. | Yes with three searches and two journeys: `recent-searches` `3 → []`, groups `["Saved journeys","Saved searches"] → ["Saved journeys"]`, `clearBtn` **null**, rows still **2** (the journeys), toasts **none**, `[aria-live]`/`[role=status]` in the dialogue **0** (page **2**), focus **`BODY`**. Yes with one search and no journeys: groups **`[]`**, `.widget-empty` **1**, card text “Your journeys A saved search is a pair of stops you keep…” | **NOTE** |
| 26.4 | 3, 8 | **The same act is stated three times before either button.** Title (“Delete all saved searches?”), then a description that explains it in a sentence, then a count line that repeats it with the number — **three** statements of one deletion, and at 320 the sheet is **228.13** tall for a two-option question whose answer is one word. The count line is the only one that adds a fact; the description's useful half is the list of what stays, which arrives wrapped around the repetition. | 320×500: sheet **320×228.13**; title **49.38** (2 lines), description **48.56** (3 lines), count **16.19** (1 line) — **114.13** of copy above the buttons. 390: title one line, description still **48.56**. 430 and above: description **32.38** (2 lines), sheet **187.25**. | **NOTE** |

| 26.5 | 5 | **The destructive answer is the emphasised one, and the safe one is the plain word.** Yes is filled coral with a bin, **158.64×44**, first in the footer; Cancel is a bare **80.2×44** label after it and Close is a 44×44 glyph in the far corner, so the largest and brightest target in the sheet is the one that deletes — and it is the first stop the keyboard reaches after Close. Nothing in the dialogue says the act cannot be undone. The same treatment as 15 and 25, so it is the app's own pattern rather than an accident of this sheet. | Yes **158.64×44** on rgb(255,126,103) with a bin at x **17**; Cancel **80.2×44** transparent at x **183.64**; footer gap **8**; Close **44×44** at x **259** (320). Focus order after open: **Close → Yes → Cancel**. The count line says “3 saved searches will be removed.”; the words “undo” and “cannot be undone” appear nowhere in the dialogue. | **NOTE** |

**Verified to hold:** the title reads “Delete all saved searches?” at **19px/24.7**, weight **700**,
**−0.19px** tracking, **17.72:1**; the description “Every saved search is removed from this browser.
Pins, saved journeys and preferences stay as they are.” is **12px/16.2** at **6.33:1**; the count
line is the same **12px/16.2** at **10.46:1**. Geometry: **320×228.13** bottom-anchored at 320
(y **271.88**), **360×203.44** (y **436.56**), **390×203.44** (y **640.56**), **430×187.25**
(y **712.75**), then **560×187.25** centred at 768/1024/1440/1920 (y **356.38** in 900, x **104 /
232 / 440 / 680**), radius **32 32 0 0** below 720 and **32** from it, padding **16** plus a 1px
border, `max-width 560`, `max-height 88vh` (**440**, **742.72** and **792** in the three window
heights), and nothing scrolls at any size (**226/226** at 320, **201/201** at 360 and 390,
**185/185** from 430). Three controls, all **44** tall: **Yes, delete them** **158.64×44** with the
bin glyph, on rgb(255,126,103) with a 1px rgb(233,105,79) border and ink rgb(24,24,27) at
**7.11:1**; **Cancel** **80.2×44**, bare, **10.46:1**; **Close** **44×44** at **17** from the right,
**10.46:1**; radius **9999** (Close **50%**), **11px/700** uppercase, answers **8** apart. The
keyboard ring is the app's **2px coral at 2px offset**, measured on all three from real Tab presses.
The trigger is **213.84×44**, sits beside the line “**3 stored in this browser**” and the trim note
“1 more, not shown at this size”, and the number in the dialogue agrees with storage in both cases.
What the description promises is true, measured: after Yes, `saved-journeys` is untouched (**2**),
`favourites` still `["utrecht-centraal"]`, `board-stops` still `["amsterdam-centraal"]`, and
`preferences` still carries `maxTransfers 1`. Every other exit keeps all three searches (Escape **3**,
× **3**, scrim **3**, Cancel **3**). The scrim is `position: fixed`, `inset: 0`, z **90**, 62%
obsidian, and covers the viewport at every width. NL at 320: “Alle bewaarde zoekopdrachten
verwijderen?” over **3** lines (**74.06**), a description over **4**, “3 bewaarde zoekopdrachten
worden verwijderd.”, “Ja, verwijder ze” **154.39×44** and “Annuleren” **101.52×44** on one line, the
sheet **320×269** at y **231** with nothing clipped (**267/267**); at 390 the Dutch sheet is
**390×228.13**, and at 1440 **560×187.25** with a one-line title. Dark: modal rgb(35,34,32), title
**14.71**, description **7.77**, count **11.59**, Close and Cancel **11.59**, Yes **7.11** on the
same coral with a rgb(233,105,79) border. No horizontal overflow at any of the eight widths;
console clean apart from the IP lookup's **429**.

**Not measured:** text at 200% (L2), any touch (L3), and how a screen reader reads a group that
vanishes under it (L1). iOS Safari was not run (L4).

**Seen on the way (not counted here, and not part of 26's fixes).** The trigger is the only control
in the widget drawn as a bare bin, and it sits one line under the count it acts on — a safe place
for it, since the press opens a question rather than deleting. And the card that empties shows the
same “A saved search is a pair of stops you keep…” paragraph 25 ends on, which is the second time in
two sections that the copy after a deletion explains the species rather than the loss.

## 27. Choose a stop

**Status:** done — its own pass on 2026-10-20, no fixes made.
**Opened from:** Home → the planner card's **From** or **To** row. **Run:** 320×500, 360×640,
390×844, 430×900, 768×900, 1024×900, 1440×900 and 1920×900; EN and NL; light and dark; a device fix
in Amsterdam with two favourites, and no fix at all (the IP estimate); the field empty, typing (“utr”,
“Amsterdam”), and a query that matches nothing; one end picked, both ends picked, and the same stop
for both; clear, swap, a heart, the map door and back; Escape and the back arrow; a forward and a
backward keyboard walk from the field that opens focused.

**Not verifiable here:** L1 screen reader · L2 real device/notch/keyboard · L3 touch · L4
Safari/Firefox · L5 performance · L6 live network · L7 install · L8 user testing (definitions at the
top). **This screen especially:** L1 for the whole field — 27.2 is the DOM’s claim, not the voice, and
a combobox with no options is heard as exactly that; L2 for the on-screen keyboard, which this screen
raises by focusing a field on open, so the height it covers and whether the list stays usable above it
are unchecked, and for 200% text, which would matter most at 320 where the body already scrolls
**1,204** in **428**; L3 for a thumb on rows 64 tall with a 44px heart at the end of each; L4 for iOS
Safari’s own scrolling inside a fixed full-height container. **You should check:** VoiceOver through
the field and five results, and one pick on a phone with the keyboard up.

*Two things this section was written to audit do not exist. There is **no recent-searches list** in
the picker — the sections are the two actions, your favourites and the closest stops — and there is
**no Done**: a pick is applied the moment it is tapped, and the screen's only exits are the back
arrow and Escape. Both are **not applicable** rather than unchecked.*

| # | Count | Finding | Measurement | Verdict |
|---|---|---|---|---|
| 27.1 | 8, 10 | **The screen is modal in name only.** It declares `aria-modal="true"` over the whole viewport, yet nothing behind it is made inert and the keyboard walks straight out of it at both ends: after the **28**th press inside it Tab lands on the dock behind (Home, Boards, All sections, then the dev Review notes button), and Shift+Tab from the From field goes back arrow first and then into the card *underneath* (its To and From rows). It starts well — the caret is in the row that was tapped, so a phone's keyboard is up before the screen has settled — but Escape and the back arrow both close it and leave focus on `<body>`, not on the planner row that opened it. | `activeElement` on open **`INPUT#picker-from`**, `inScreen` **true** (and `#picker-to` when the To row opened it); **45** focusables, **30** in the screen, first at **12**; forward walk: **28** presses inside, then **`A` Home · `A` Boards · `BUTTON` All sections · `BUTTON` Review notes**; backward: `BUTTON` Back (inside) → `BUTTON` “To” (**outside**) → `BUTTON` “From” (**outside**); Escape → closed, focus **`BODY`**; back arrow → closed, focus **`BODY`**; `[inert]` **0**. | **FAIL** |
| 27.2 | 5, 10 | **The field says it is a combobox and offers no options.** The `<input>` carries `role="combobox"`, `aria-autocomplete="list"`, `aria-controls="picker-list"` and a literal `aria-expanded="true"`, but the list it controls is a plain `<ul>` (a plain `<div>` when nothing is typed) with no listbox role, its rows are ordinary buttons inside `<li>`s with no `role="option"`, and `aria-activedescendant` is null and never set. ArrowDown and ArrowUp do nothing at all, Enter does nothing, and there is no way to reach a result from the field except tabbing through every row — five of them for “utr”, up to fourteen for an empty field. A screen-reader user is told there is a combobox with no options under it. | Typing “utr”: list is a **`UL`** with **5** items and **0** `[role=option]`; empty field: list is a **`DIV`** with **14** items and **0** options; `role` **combobox**, `aria-expanded` **“true”** (a string, always), `aria-controls` **picker-list**, `aria-activedescendant` **null**; ArrowDown twice leaves `activeElement` on **`INPUT#picker-from`** and `aria-activedescendant` **null**; Enter leaves the planner untouched (`From`, `To`) and the screen open. | **FAIL** |
| 27.3 | 5, 6 | **The same stop for both ends is refused in words, kept anyway, and then planned.** Choosing the stop already in the other row raises “Origin and destination must be different stops” — and fills the row with it all the same, so both ends now name Utrecht Centraal. That unlocks **Plan journey**, and pressing it goes to the results screen, which finds **no journeys at all** and explains the emptiness as the walking limit, the transfer limit or a filter (“No mode is switched off, so …”) — none of which is the reason. The one thing the picker knows about this pair is the one thing the results screen never hears. | From = Utrecht Centraal, then To = the same stop: rows `FromUtrecht Centraal` / `ToUtrecht Centraal`, toast **“Origin and destination must be different stops”**, `.picker__plan` **“Plan journey”** **366×44** at y **1,282**; pressing it → `#/results`, **0** `.result-card`s, body text “…No journeys match your settings… the walking limit, the transfer limit or a result filter removed every option.” | **FAIL** |
| 27.4 | 5, 6 | **Typing in a field silently empties the stop already chosen behind the screen.** The picker says it owns nothing, but every keystroke in a field whose end is already chosen calls the parent's clear — so one Backspace in the From field (after From was set to Utrecht Centraal) empties the planner's From *behind the screen*, and closing leaves it empty with no message. Editing a value you just picked is the ordinary way to correct a typo, and it costs the whole pick. | From = Utrecht Centraal → planner rows `FromUtrecht Centraal`, `To`; one **Backspace** in that field → **`From`, `To`** (both empty) while the screen stays open; **Escape** → closed, still `From`, `To`. The field's own change handler calls `onClear(side)` whenever that end is non-null. | **FAIL (minor)** |
| 27.5 | 4 | **The two action rows are the faintest names on the screen, and in the dark appearance they fall under AA.** “Use my current location” and “Choose on the map” are the only sage labels in the picker: **4.66:1** on cream, which only just clears 4.5, and **3.89:1** on the dark page — below the 4.5 an 13.5px label needs. Their own description lines are **6.13** and **9.16** in the same two appearances, so the label is lighter than the sentence under it, while every stop's name is **17.14** / **17.34**. The colour is carrying “this is an action, not a stop”, and carrying it past legibility in one appearance. | Light: action name rgb(90,122,88) on rgb(252,251,250) = **4.66**, meta rgb(95,95,102) = **6.13**, stop name rgb(24,24,27) = **17.14**. Dark: action name on rgb(18,18,17) = **3.89**, meta rgb(184,181,174) = **9.16**, stop name rgb(247,246,243) = **17.34**, section **9.16**, field ink **16.09**. | **NOTE** |
| 27.6 | 3, 8 | **“Suggestions” heads everything, and is the only heading that does.** The label sits above the body whatever the body holds: over the two actions, your favourites and the closest stops when the field is empty, and over the search results when it is not — so it names neither the actions (which are not suggestions), nor the favourites (which are not suggestions either), and the two sections that do have their own names (“Favourite stops”, “Closest stops”) come after it. When typing, the sections *are* suggestions and the label is right by accident. | Empty field: the labels in order are **Suggestions · Favourite stops · Closest stops**, with `Use my current location` and `Choose on the map` directly under the first; typing “utr”: **Suggestions** only, **5** rows under it. The label is **11px/700** uppercase, **0.11px** tracking, **14.84** tall, **6.13:1** (**9.16** dark). | **NOTE** |
| 27.7 | 1, 7 | **On a desktop the screen is one 1,360-wide column, and the field is 1,238 of it.** The picker is capped at the app's `--shell-max` and centred, but nothing inside narrows it, so the From field runs almost the width of a 1440 window and the card it sits in is wider than the same card on Home (**1,018**) — a search field 1,238px wide with its label pinned to the left edge and the value starting under it. The pattern is consistent (it is the shell cap other screens use) but a picker is a column of four sections, not a page. | 1440×900: `.picker` **1,360**, `.planner-card` **1,360**, `#picker-from` **1,238**, body **1,182/828** (354 of scroll); Home's own planner card at the same width **1,018×106**. 320×500: picker **296**, field **174**, body **1,204/428** (776 of scroll); 390: **366** and **244**, body **1,182/772** (410). | **NOTE** |

**Verified to hold:** the screen is `position: fixed`, `inset: 0`, z **100**, on `--l0-bg`
(rgb(252,251,250); rgb(18,18,17) dark) at every width; the bar is **72** tall (padding **20 12 8**),
the back arrow **44×44** at (12, 20) on a phone and (52, 20) at 1440, and the title — “Where are you
leaving from?” / “Where do you want to go?” — is **16px/700** at **17.14:1**, one line from 360 and
two lines at 320 (**43.19**), changing with the row in focus. The body pads **0 12 24** and scrolls
(**1,204/428** at 320, **1,182/772** at 390, **1,182/828** at 1440). The card is **296×106**,
**366×106** and **1,360×106**, radius **20**, on rgb(243,241,234); the two fields are **52** tall and
**13.5px/600**; the swap control is **44×44** (“Reverse origin and destination”, title “Reverse
journey”) and really swaps the two values (“”, “Utrecht Centraal” after one press); the clear disc is
**44×44** (“Clear the departure stop”), empties its end and puts the caret back in the field. Rows are
**64** tall (**70.59** for the two action rows at 320, where their meta wraps), name **13.5px/600**,
meta **12px/400**, separated by a 1px hairline, and each carries a **44×44** heart whose label flips
between “Add {stop} to favourites” and “Remove {stop} from favourites”; pressing one moved a stop out
of Favourites into Closest, leaving the lists at **2 / 1 / 10**. With a fix in Amsterdam and two
favourites the panel holds **14** rows in **3** sections and **41–45** focusables across the app. The
map door opens “Choose a stop on the map” and its back arrow returns to the picker with the caret in
`#picker-from`. A first pick leaves the screen open, moves the caret to the other field and retitles
it; a second, different pick closes it, runs the search and lands on `#/results` with **8** cards.
The back arrow keeps a pick made before it (To Utrecht Centraal survives), only closing. “zzzz” gives
“No stops match “zzzz”” and “Search by station, stop or landmark name, or use your location.”, with
**0** rows. With no device fix the panel falls back to the IP estimate and says so: “From an
approximate IP location — it can be off by a lot.” NL: “Waar vertrek je?”, “Suggesties”, “Favoriete
haltes”, “Dichtstbijzijnde haltes”, “Mijn huidige locatie gebruiken”, “Kies op de kaart”, “Vanaf je
apparaatlocatie.”, body **1,204/428** at 320. Focus rings are the app's **2px coral at 2px offset**,
measured on a row from a real Tab press. No horizontal overflow at any of the eight widths; console
clean apart from the IP lookup's **429**.

**Not measured:** text at 200% (L2), any touch or on-screen keyboard (L3 — the screen focuses a field
on open, so the keyboard's height is exactly what was not seen), the screen-reader voice of a
combobox with no options (L1, 27.2 is the DOM), and iOS Safari (L4).

**Seen on the way (not counted here, and not part of 27's fixes).** With a complete pair the screen
also shows **Plan journey** — **366×44** at y **1,185** in a 1,181-tall body — **341** below the bottom of a 844-tall
window, **385** of scroll to bring it fully into view — so the one remaining action is a full screen
of scrolling away. And the picker has no cancel: a pick
is written the moment it is tapped, so a wrong tap is undone by clearing and starting again rather
than by leaving.

## 28. Choose a stop on the map

**Status:** done — its own pass on 2026-10-20, no fixes made.
**Opened from:** the stop picker's **Choose on the map** row (27). **Run:** 320×500, 320×568,
360×640, 390×844, 430×900, 768×900, 1024×900, 1440×900 and 1920×900; EN and NL; light and dark; a
device fix in Amsterdam with two favourites; the map opened with neither end chosen, and again from
a row that already held Utrecht Centraal so it opens centred on it; a 200px drag, a wheel zoom, both
zoom buttons by pointer and by keyboard, recentre; a search that matches five stops, a landmark
search and a pick from the list; a pick confirmed, Escape, and the back arrow as three exits; a
keyboard walk from the first Tab to past the screen.

**Not verifiable here:** L1 screen reader · L2 real device/notch/keyboard · L3 touch · L4
Safari/Firefox · L5 performance · L6 live network · L7 install · L8 user testing (definitions at the
top). **This screen especially:** L3 for the thing the screen exists for — the drag is a synthetic
pointer sequence here, so momentum, two-finger pan and pinch-zoom were never exercised, and 28.2 is a
pointer defect found with a mouse rather than a thumb; L1 for a `role="application"` region that has
no focusable element to enter (28.8), and for the drawing, which announces “Network map, 61 stops”
and nothing about the stop chosen; L2 for the search field, which raises the on-screen keyboard
directly above a sheet that already reaches the bottom edge at 320; L4 for iOS Safari's
`touch-action: none` inside a fixed, full-height container. **You should check:** one real finger
drag and a pinch at 390, and VoiceOver on the map after a drag — whether the changed stop is
announced at all.

| # | Count | Finding | Measurement | Verdict |
|---|---|---|---|---|
| 28.1 | 8, 10 | **The screen is modal in name only, and the same shared shell as 22–27.** It declares `role="dialog" aria-modal="true"` over the whole viewport and opens with focus on `<body>` — not on the screen, and not on the map. Inside there are **six** focusables; the seventh Tab leaves for the dock behind (Home, Boards, All sections) and then the dev Review notes button, and nothing behind is made inert. Every exit lands focus in the stop picker underneath — Escape, the back arrow and the confirm all leave it in `#picker-from`, the field of the picker, never on the “Choose on the map” row that opened this screen, so the one place a keyboard user came from is the one place they cannot return to. `FullScreen` is shared with 27 and documents “The container is not focus-trapped”; 27.1 and 28.1 are the same defect on two screens. | `activeElement` on open **`BODY`**; in-screen focusables **6**: Back · Centre the network · Zoom in · Zoom out · INPUT · Select this stop, then **`A` Home**, **`A` Boards**, **`BUTTON` All sections**, **`BUTTON` Review notes**, `<body>`, skip link; `[inert]` **0**; after Escape **`INPUT#picker-from`**, after the back arrow **`INPUT#picker-from`**, after Select this stop **`INPUT#picker-from`** with the planner reading `FromUtrecht Centraal`; `aria-label` **“Choose a stop on the map”**, `aria-labelledby` **null**, `aria-describedby` **null**. | **FAIL** |
| 28.2 | 5, 10 | **The two zoom buttons do nothing when clicked or tapped.** Both sit inside the draggable surface, and the surface captures the pointer on `pointerdown` for the drag; the `pointerup` that follows is delivered to the surface, so the button never receives a `click`. A real mouse press at the button's own centre produced **1** `pointerdown`, **0** `pointerup`, **0** `click` and a viewBox that did not move; the wheel zooms (**100 → 112**) and a keyboard Enter or Space on the same button zooms (**100 → 71.43 → 51.02**), so the handler is fine and the pointer is what breaks. The screen's only way out of a too-zoomed map is therefore keyboard-only, on a screen built for a thumb. A synthetic `.click()` also works, which is why this survives a DOM test. | Real mouse press on “Zoom in” at 390: viewBox **`0 0 100 100` → `0 0 100 100`**, events on the button `{down: 1, up: 0, click: 0}`; the same press on “Zoom out”: **unchanged**, `{down: 1, up: 0, click: 0}`; `element.click()` on the same two → **`14.29 14.29 71.43 71.43`** and **`-12.5 -12.5 125 125`**; Enter → **`14.29 …`**, Space → **`24.49 24.49 51.02 51.02`**; wheel at the map centre → **`-26.91 -6.00 112.00 112.00`** with the page still at scroll **0**. | **FAIL** |
| 28.3 | 1, 5 | **The pin names one place and points at another.** The reticle is centred on the surface with `top: 50%; translate(-50%, -50%)`, so its *middle* sits on the measured point and its **16px** tail hangs below it — **2.79** canvas units at 390 — while the stop that is named is wherever the drawing put it. Opened from a row holding Utrecht Centraal the dot is placed exactly at the surface centre, **(195, 359)**, and the tip is still at **375**: over ground, below the stop. Opened with neither end chosen, the view is centred on canvas **(50, 50)** where no stop is drawn at all — the nearest dot is **6.6** units away and Gouda, the stop the sheet names, is at **(44.94, 45.45)**, **51px** from the tip, with the map's highlighted dot the only thing marking it. Tip to the chosen dot: **34.5px** at 320, **51** at 390, **120.7** at 768, **162** at 1440 (the last of those is 28.4's 130px band). The map's own label — the only description a screen reader gets — says “the stop nearest the pin is chosen”; what is chosen is the stop nearest the *centre of the view*, which is not where the pin's tip is. | Pin **22×32** (dot **22**, tail **2×10**), `top: 50%` `translate(-50%,-50%)`; at 390 tip **(195, 375)** against a surface centre of **(195, 359)**; centred open: dot **(195, 359)**, tip **(195, 375)**; unset open: viewBox **`0 0 100 100`**, chosen dot **(166.1, 333)**, nearest dot to the tip **(42.92, 47.47)**; `aria-label` **“Network map. Drag to move the map; the stop nearest the pin is chosen.”** | **FAIL** |
| 28.4 | 1, 3, 7 | **The drawing does not fill the surface it is given, and its type is sized in canvas units.** From 768 the surface is **630** tall while the SVG is capped at **500** by `.map-canvas`'s desktop rule (`aspect-ratio: 4/3`, `max-height: min(500px, 58vh)`), so **130px** of empty ground sits under the drawing and above the sheet; and because the square viewBox is sliced into a **1,416×500** box, only **35.3** of the 100 canvas units are visible vertically at 1440 — two thirds of the network is cropped, and the pin that never moves is over a part of the drawing the chosen stop is nowhere near. The stop name is declared at **2.6px** in canvas units, so it renders at **7.7px** at 320, **14.9** at 390, **19.3** at 768 and **36.8** at 1440: too small to read on the narrowest phone, three times the app's body size on a desktop. | 768: surface **744×630**, canvas **744×500**; 1440: surface **1,416×630**, canvas **1,416×500**, dead band **130**; 1920: surface **1,896×630**, canvas **1,896×500**. Label box **49×18** at 390, **63.6×24** at 768, **121.3×46** at 1440; computed font-size **2.6px** at every width. | **FAIL** |
| 28.5 | 5, 10 | **The search field has no name, and a pick takes the keyboard away with it.** `aria-label`, `role` and `aria-labelledby` are all null; the only name is the placeholder “Search for a stop”, which vanishes the moment anything is typed. Choosing a result is otherwise right — the view recentres on the stop, the field empties and the list closes — but the same handler calls `dismissKeyboard()`, which drops focus on `<body>`, so a keyboard user who has just picked a stop has no focus left inside the screen and Tabs back in from the top of the app. | Typing “Utrecht”: **5** rows (Utrecht Centraal, Lunetten, Overvecht, Vaartsche Rijn, Domtoren); after the first: viewBox **`-0.94 -15.61 112 112`**, chosen **Utrecht Centraal**, query **“”**, matches **0**, `activeElement` **`BODY`**, field `aria-label` **null**, `role` **null**, `label` **null**, placeholder **“Search for a stop”**. | **FAIL (minor)** |
| 28.6 | 9, 3 | **In Dutch the one control in the header is still English.** `FullScreen` hard-codes `label="Back"` while the title, the recentre control, the field and the confirm all translate — so the top-left corner of a Dutch screen is announced as “Back” and the only Dutch word near it is the title beneath. The same component carries 27, so the Dutch picker has the same English control and 27 did not catch it. | NL at 320 and 1440: title **“Kies een halte op de kaart”**, search **“Zoek een halte”**, confirm **“Deze halte kiezen”**, recentre **“Netwerk centreren”**, back **“Back”**. Source: `label="Back"` with no `t()`. | **FAIL (minor)** |
| 28.7 | 7 | **At 320×500 the confirm is 66px below the fold.** The sheet keeps its 158px whatever the map does, and from 320 the surface is already at its 320px floor, so the stack is taller than a short window: the button sits at y **522–566** in a 500-tall viewport. The body does scroll (**494** of content in **428**), so it is reachable — but the action that finishes the screen is the one thing a narrow, short window hides. At 320×568 it fits with 2px to spare, so only the short cases pay. | 320×500: sheet **408–566**, Select this stop **522–566**, body **494/428** `overflow-y: auto`, after `scrollIntoView` the button sits at **456–500** and is fully visible; 320×568: sheet **408–566**, document height **568**, nothing scrolls. | **NOTE** |
| 28.8 | 10 | **To a keyboard the map is a picture.** The surface carries `role="application"` but no `tabindex`, so `.focus()` on it leaves focus where it was and ArrowRight/ArrowDown change nothing; the drag never appears in the Tab walk and there is no key that pans. The only keyboard route to the drawing is the two zoom buttons — which is also the only pair of controls 28.2 breaks for pointers, so the two input methods have opposite holes. | Surface `role="application"`, `tabindex` **null**, focus attempt leaves `activeElement` on `BUTTON.btn.btn--icon-circle`; ArrowRight + ArrowDown leave the viewBox at **`24.49 24.49 51.02 51.02`**; walk: Back · Centre the network · Zoom in · Zoom out · INPUT · Select this stop. | **NOTE** |
| 28.9 | 5, 6 | **You can drag until nearly half the surface is empty.** The view's centre is clamped to the drawing's 0–100 range, but the view is a 100-unit square, so at the default zoom the box can run from **−50** to **50** and show ground where there is no network, with the sheet still naming whatever stop happens to be nearest. Nothing stops the drag at the drawing's edge, and nothing recentres it except the header's own control. | 200px drag at 390: viewBox **`0 0 100 100` → `-20.91 0 100 100`**, chosen Gouda → **Schiedam Centrum**; recentre → **`0 0 100 100`**; clamp is `Math.min(100, Math.max(0, …))` on the centre, not on the box. | **NOTE** |
| 28.10 | 1 | **On a desktop the screen is one 1,416-wide column.** The search field is **1,368** of it, the chosen row **1,416** and the confirm **1,416**, the same shell-width pattern as 27.7: a column of two controls drawn at the width of a page. It is consistent with the app's other screens, but it is the reason the map's square drawing is being stretched into a letterbox in the first place (28.4). | 1440×900: `.map-picker__sheet` **1,416**, search field **1,368**, chosen **1,416×44**, confirm **1,416×44**; 390: **366**, **318**, **366**, **366**. | **NOTE** |

**Verified to hold:** the screen is `position: fixed`, `inset: 0`, z **100**, on `--l0-bg`
(rgb(252,251,250); rgb(18,18,17) dark) at every width, with no horizontal overflow at any of the nine
sizes and no duplicate ids. The bar is **72** tall (padding **20 12 8**), the back arrow **44×44** at
(12, 20) on a phone, (52, 20) at 1440 and (292, 20) at 1920, the recentre disc **44×44** at the other
edge, and the title — “Choose a stop on the map” / “Kies een halte op de kaart” — is **16px/700** at
**17.14:1** (**17.34** dark), one line from 360 and two at 320 (**43.19**). The surface is **296×320**
at 320, **366×574** at 390, **744×630** at 768 and **1,416×630** at 1440, radius `--r-input`, on
`--l1-bg`, `touch-action: none`, `role="application"` with the network's own label; the drawing holds
**62** `.map-stop` groups (**61** stops plus the chosen name), circles **1.1** units with the chosen
one **1.9** and the sheet's **22×32** pin over them. Dragging really moves the map and the name
follows the drag: **`0 0 100 100` → `-20.91 0 100 100`**, Gouda → **Schiedam Centrum**. The wheel
zooms both ways (**100 → 112**, **100 → 89.29**) without scrolling the page, recentre restores **`0 0 100 100`**, and
the zoom buttons work from the keyboard (Enter **100 → 71.43**, Space **→ 51.02**). The sheet is
**158** tall with a **16** gap, its search **44** (**13.5px**, ink **16.09** on rgb(243,241,234); dark
rgb(27,26,24) at **16.09**), the chosen row **44** with the name **13.5px/600** at **17.14**
(**17.34** dark) and the meta **12px/400** at **6.33** (**9.16**), and the confirm **44** tall,
**11px/700** uppercase, on white with ink at **17.14** (**14.71** on rgb(35,34,32) dark). Search
“Utrecht” gives five stops and “Domtoren” finds the landmark; a pick recentres and highlights it; the
confirm writes the pick and returns to the picker, which retitles itself and leaves the caret in
`#picker-from`; the back arrow discards the map's own pick (planner still `From`, `To`) and Escape
closes only this screen, leaving the picker open. NL and dark change nothing in the geometry, and the
console is clean apart from the IP lookup's **429**.

**Not measured:** text at 200% (L2), any real touch, drag momentum or pinch (L3), density above DPR 1,
and iOS Safari or Firefox (L4).

**Seen on the way (not counted here, and not part of 28's fixes).** With neither end chosen the map
opens on Gouda whatever the traveller's location — the view is the canvas's own middle, not the stop
nearest the device fix the rest of the app is using — so the first thing the screen offers a traveller
in Amsterdam is a stop an hour away. (With one end set it does the right thing and centres on that
stop.) And the chosen stop is marked twice, a bigger dot in the drawing and the pin above it, without
either mark agreeing with the other — the visual half of 28.3.

## 29. Photo

**Status:** done — its own pass on 2026-10-20, no fixes made.
**Opened from:** the widgets picker's **From your photo** row, inside 17 — the plan said inside 16
*and* 17, and 16 has no such row (`colour-screen__photo` count **0**; it owns the file door and the
Crop door instead). **Run:** 320×500, 320×568, 360×640, 390×844, 390×700, 430×900, 768×900,
1024×900, 1440×900, 1440×700 and 1920×900, plus 390 at DPR 2 and 3; EN and NL; light and dark; a
1,200×300 upload, a 400×400 four-quadrant fixture and a 300×1,200 portrait; sampling at every
quadrant centre and all four corners, the loupe at each edge and in the stage's empty ground, a
21-move sweep and the pointer away; ArrowRight, ArrowDown and Shift+ArrowRight; Escape, the back
arrow and Done; the crop door, Escape from it, and a saved frame; a file that is not a picture; a
stored picture that will not decode; a keyboard walk from the first Tab to past the screen.

**Not verifiable here:** L1 screen reader · L2 real device/notch/keyboard · L3 touch · L4
Safari/Firefox · L5 performance · L6 live network · L7 install · L8 user testing (definitions at the
top). **This screen especially:** L3 for the gesture the screen is built on — sampling is a synthetic
pointer sequence here, so a real thumb, drag momentum and pinch were never exercised; L1 for the
loupe, which is `aria-hidden` and whose only voice is the live region (29.10), and for the screen
saying nothing about the photograph, whose `alt` is empty; L2 for 200% text in a foot that already
wraps to two lines at 390; L4 for iOS Safari's `touch-action: none` inside a fixed full-height
container and for `EyeDropper`, which exists in Chromium only. **You should check:** one real finger
drag and a pinch at 390, and VoiceOver across a drag — whether the stream of hexes is tolerable.

| # | Count | Finding | Measurement | Verdict |
|---|---|---|---|---|
| 29.1 | 8, 10 | **The screen is modal in name only, and the page behind wins both races.** It opens with focus on `<body>`, over a Widgets screen that is itself a `role="dialog" aria-modal="true"` — two modal dialogs at once — with no inert region anywhere and **five** focusables inside. The sixth Tab leaves for the Settings page behind (a location switch in `MAIN.app-main`), and one wheel over the photograph scrolls that page from **862 to 1,462** underneath the sampler's own copy. Every exit — Escape, the back arrow, Done — lands focus on `BODY`; none returns it to the `From your photo` row, which is gone (the picker closes on the way in), so a keyboard user is put back at the top of the document. `FullScreen` is shared with 27 and 28 and documents “The container is not focus-trapped”; 27.1, 28.1 and 29.1 are one defect on three screens. | `activeElement` on open **`BODY`**; focusables **5**: Back · Done · the stage · Eyedropper · Crop, then **`BUTTON.switch`** in `SECTION.card` in `MAIN.app-main` (a Settings switch); `[inert]` **0**; two dialogs, `aria-label` **“Widgets”** and **“From your photo”**, both `aria-modal="true"`; page scroll **862 → 1,462** with one wheel of 600 over the stage; after Escape, after the back arrow and after Done: **`BODY`**, screens **`[“Widgets”]`**. | **FAIL** |
| 29.2 | 1, 7 | **The photograph is not sized for the screen it is on.** The stage takes every pixel the body has and the `<img>` is only ever its own pixels capped by that box, so the picture is drawn at **29%** of the stage's height at 320×500, **15%** at 390, and **41%** at 1440 — where the 1,200×300 source is not even upscaled to the 1,416 width it has. A portrait upload is the extreme: 300×1,200 drawn **62.9×251.6** at 320×500, a 63px sliver in a 296-wide screen with 233px of empty ground on either side. The empty space is the screen's largest feature at every size, and it is why 29.3 matters: the pointer can be 111px away from the picture and still be inside the thing it is sampling. | Stage **296×251.63 / 366×595.63 / 744×723.81 / 1,416×723.81 / 1,896×723.81** at 320 / 390 / 768 / 1440 / 1920; picture **296×74 / 366×91.5 / 744×186 / 1,200×300 / 1,200×300** — 29.4%, 15.4%, 25.7%, 41.4% of the height; portrait **62.9×251.6** in **296×251.63**; `.photo-screen__picture` is `max-width: 100%; max-height: 100%` with no `width`, and the stage is `flex: 1 1 auto`. | **FAIL** |
| 29.3 | 1, 5 | **The loupe leaves the screen at three of its four edges, and samples ground it is not over.** The 112px disc is anchored `translate(-50%, calc(-100% - 18px))` — above the pointer, so a finger never covers the pixel — but nothing keeps it inside the window. At the picture's left edge its left is **−42**, its hex chip **−25.93**; at the right edge its right is **432** on a 390-wide window, chip **417.7**; and at the top of the portrait upload its top is **−48**, so **48 of the 112px** disc, crosshair included, is above the window at the one point a thumb starts on. Only the bottom edge is safe. In the stage's empty band the same thing happens to the colour: the pointer is 111px above the picture, the loupe's top is **−46**, and the reading still updates to **#65C816** — the picture's own top row — because `pixelAt` clamps `fy` to 0 rather than returning nothing. | Left edge: loupe `x −42`, chip `x −25.93`; right edge: loupe `right 432`, chip `right 417.7`; portrait top: loupe `(104, −48, 112, 112)`; empty ground above: loupe `y −46`, hex **#65C816** with the picture top at **194.81**; loupe **112×112**, `border: 2px solid #fff`, chip 20.22 tall under the disc. | **FAIL** |
| 29.4 | 10 | **One arrow press is one source pixel.** `step()` moves by `1` (`10` with Shift) in the **canvas's** pixels, and the canvas is the photograph at up to 2,048px, so on the 1,200-wide upload — drawn 366 wide — ArrowRight shifted the loupe **0.61px** and Shift+ArrowRight **3.36px** (ten pixels). Crossing a 2,048-wide photograph therefore takes **2,048** presses, **205** with Shift held, and nothing on screen says how far a press goes. The keyboard route does work from nothing (the first press starts at the canvas centre), and the stage's ring is the app's own: 2px coral at 2px offset. | Loupe x **139.45 → 140.06** (ArrowRight) **→ 143.42** (Shift+ArrowRight), picture 366 wide from a 1,200px source; hexes **#0003F2 → #0002F9 → #0000FE**; focus ring `outline: 2px solid rgb(255,126,103)`, offset **2px**. | **FAIL (minor)** |
| 29.5 | 1, 5 | **The foot's two actions rag to opposite edges, and swap sides with the width.** It is `flex-wrap` with a `grow` text block, so at 320 and 360 both buttons share the second line (12 and 148.59, 44 tall each) while at 390 and 430 the Eyedropper is pushed to the **right** of the first line (253.41–378) and Crop wraps alone to the **left** of the second, **58px** lower at x **12**; from 768 both are back on one line at the right (1,208.39 and 1,344.98 at 1440). Two controls that sit together at one width stand at opposite ends of the screen at the next. | 320×568: Eyedropper `12,467.63,124.59×44` · Crop `148.59,467.63,83.02×44`; 390×844: Eyedropper `253.41,685.63` · Crop `12,743.63`; foot **104** tall at ≤430, **48** at ≥768; `.photo-screen__foot` `align-items: center; flex-wrap: wrap`. | **NOTE** |
| 29.6 | 5, 6 | **Done writes a colour nobody sampled.** Opened from a picker whose primary colour is empty — the Widgets screen's row reads *Follow the background* — the foot already shows **#FF7E67**, and Done stores `#ff7e67`: an explicit choice that unticks the follow-the-background row, made without one sample. The hint directly above the button reads “Done keeps the colour”, which is exactly what it does not do, and the screen closes before anything shows that a setting changed. | With the loupe never shown: foot **#FF7E67**, hint “Drag the picture to sample, or use the arrow keys. Done keeps the colour.”, `primaryColour` **`""`** before, **`#ff7e67`** after one Done; the sampler is then gone, and only the Widgets screen's row would show it. | **FAIL (minor)** |
| 29.7 | 9 | **Three strings stay English on a Dutch screen.** The stage's only name is `aria-label="Tap or drag the photo to take its colour"` — no `t()` around it and no such key in `lib/i18n.ts` — so the one element a screen reader lands on is English while the title, the hint, the ink line, *Pipet*, *Bijsnijden* and *Klaar* all translate. The back arrow is `label="Back"` with no `t()` (28.6's defect, the same shared `FullScreen`). And a refused file reports **“The source image could not be decoded.”** in English on a Dutch screen, because that sentence is the browser decoder's own and `t()` falls back to its argument; the app's own wording (“That image could not be read.” / “Die afbeelding kon niet worden gelezen.”) is in the dictionary and is used by the sampler itself. | NL 390: title **“Uit je foto”**, done **“Klaar”**, buttons **“Pipet”**, **“Bijsnijden”**, hint **“Sleep over de foto om te prikken, of gebruik de pijltjestoetsen. Klaar bewaart de kleur.”**, stage **“Tap or drag the photo to take its colour”**, back **“Back”**; NL refused file: **“The source image could not be decoded.”** | **FAIL (minor)** |
| 29.8 | 6, 11 | **A refused file is silent to a screen reader.** The error is a `.field__error` paragraph with no `role` and no live region around it, so the one outcome of the file door that matters — the picture you chose was not used — is announced to nobody. Everything else about the refusal is right: the previous photograph survives (**6,299** bytes before and after), the three photo buttons stay, and both a text file and a text buffer claiming `image/png` produce the same sentence. The door itself is the platform's: `accept="image/*"`, no `capture`, so a phone offers its own Library/Camera choice and the page never asks for the camera directly. | `.field__error` text **“The source image could not be decoded.”**, `role` **null**, no `[aria-live]` ancestor; `backgroundImage` length **6,299 → 6,299**; `input[type=file]` `accept="image/*"`, `capture` **null**, `tabIndex` **−1**, `aria-label` **“Choose a background photo”**, drawn **1×1**, opened by the **174×44** “Replace the photo” button. | **NOTE** |
| 29.9 | 6, 11 | **The sampler's own error state is a dead end.** A stored picture that will not decode shows “That image could not be read.” — translated, in 12px ink, unannounced — while the `<img>` collapses to **0×0** and the foot keeps describing a colour from a picture that is not there. Both **Crop** (which opens the crop screen over nothing) and **Done** (which writes `#ff7e67`) stay enabled, and the only route to another photograph is three screens back through 17 and 16: this screen offers no “choose another photo”. | Error at **(111.3, 369.7, 167.4×16.2)** in a **366×595.63** stage, `rgb(63,63,69)` at 12px, `role` **null**, no live region; picture box **0×0**, `naturalWidth` **0**; NL **“Die afbeelding kon niet worden gelezen.”**; Done still enabled → `primaryColour` **`#ff7e67`**, screens **`[“Widgets”]`**. | **FAIL (minor)** |
| 29.10 | 10, 1 | **The live region is the screen's whole description, and it never stops.** The hex is announced from an `sr-only` `aria-live="polite"` span as **#ff7e67** — lower case, where the visible value is **#FF7E67** — and it fires on every change: **3** times across a 21-move sweep of a four-band fixture, which on a real photograph is every move, so a drag becomes a stream of colour names with no rate limit. The picture is `alt=""`, the stage's name describes the gesture rather than the photograph, and the stage is the only focusable thing in it, so nothing else tells a screen reader what is on screen at all. | `[aria-live]` text **“#ff7e67”**, visible hex **“#FF7E67”**; 21 mouse moves across the picture → **3** mutations of the live span; `<img alt="">`; stage `role="group"`, `aria-label` the gesture, `aria-describedby` **null**; the loupe `aria-hidden="true"`. | **NOTE** |
**Verified to hold:** the screen is `position: fixed`, `inset: 0`, z **100**, on `--l0-bg`
(rgb(252,251,250); rgb(18,18,17) dark), with no horizontal overflow in any of the seventeen runs
(nine widths, two 700-tall windows, 390 at DPR 2 and 3, dark at 390 and 1440, Dutch at 320 and
1440) and no duplicate ids — four `id`s in the document at 320, 390 and 1440, none of them repeated,
and none inside the screen. The bar is **72** tall
(padding **20 12 8**), the back arrow **44×44** at (12, 20) on a phone, (52, 20) at 1440 and (292, 20)
at 1920, and the title — “From your photo” / “Uit je foto” — is **16px/700** at **17.14:1** (**17.34**
dark), one line, **128.39×21.59**. Done is **58.94×44** with its right edge on the bar's own padding
(308 = 320 − 12; 1,388 = 1,440 − 52), **62.94** wide as *Klaar*. The body is **320×428** at 320×500 up
to **1,440×828**, `overflow: hidden` and no padding (`fullscreen--flush`), and the stack still fits
the shortest window: foot **104** at y **339.63–443.63**, hint **451.63–484** in 500. The foot holds a
**48×48** swatch, the hex at **13.5px/600** and **17.14** (**17.34** dark), the ink line at **12px** and
**5.51** (**7.36** dark), and the hint at **12px** and **5.51**; Eyedropper is **124.59×44** and Crop
**83.02×44** (NL **80.39** and **111.59**), both over the 44px mark. The stage is `tabIndex={0}`,
`role="group"`, `touch-action: none`, `cursor: crosshair`, and its ring is the app's **2px coral at
2px offset**. Sampling is right: the four quadrant centres read **#FE0000**, **#00FF01**, **#0000FE**,
**#FFFFFF** (within **1** of the fixture's own values, which is the JPEG's), the chip always matches
the foot's hex, all four corners of the picture read the quadrant they are in, and both a hover sweep
and a press-and-drag sample. The loupe hides when the pointer leaves. Escape and the back arrow keep
the colour in force (`primaryColour` still `""`, and after a sample the stored value stays `#65c712`),
and Done writes it (`#65c712`) and closes. The crop door opens “Crop the photo” as a third screen at
z **100** over a sampler that stays mounted (`elementFromPoint` at the sampler's centre returns
`.crop-screen__preview`), Escape closes only the crop and keeps the sampled **#65C712**, and a saved
frame re-decodes the picture under the still-open sampler (**139×300**). NL, dark and DPR 2 and 3
change no geometry, and the console is clean apart from the IP lookup's **429** in every run.

**Not measured:** text at 200% (L2), any real touch, drag momentum or pinch (L3), the two native
pickers themselves — a headless run never opens the file chooser or `EyeDropper` (`'EyeDropper' in
window` is **true** here, which is why the button is drawn) — and iOS Safari or Firefox (L4).

**Seen on the way (not counted here, and not part of 29's fixes).** 16 has no `From your photo` row,
so the sampler is reachable only from 17 and the plan's own route (“inside 16 and 17”) is half true;
the Background screen's hint “Crop it to choose what the page shows” points at the crop, and nothing
on that screen mentions the sampler at all. The picture is drawn with `border-radius: 16px`, so the
“whole photograph, uncropped” loses a 16px corner at each corner. Leaving the picture keeps the last
sampled colour in the foot (**#C6FFC8** with the pointer at (2, 2)), and after a crop is saved the
foot still shows the pre-crop colour while the picture beneath it is the new one — the two halves of
the screen disagree until the next sample.

## 30. Crop photo

**Status:** done — its own pass on 2026-10-20, no fixes made.
**Opened from:** the sampler's **Crop** foot button (29) and, for the page's own picture, the
Background screen's **Crop** button (16); both open the same screen over the same source. **Run:**
320×500, 320×568, 360×640, 390×700, 390×844, 430×900, 768×900, 1024×900, 1440×700, 1440×900 and
1920×900, plus 390 at DPR 2 and 3, dark at 390 and 1440 and Dutch at 320 and 1440; a 1,200×300
four-band upload; the three frame chips; a 40px drag, a wheel both ways, both zoom buttons, Reset,
the arrow keys and `+`; the frame saved as a square and reopened; Escape, the back arrow and Save;
a picture that will not decode; a keyboard walk from the first Tab to past the screen.

**Not verifiable here:** L1 screen reader · L2 real device/notch/keyboard · L3 touch · L4
Safari/Firefox · L5 performance · L6 live network · L7 install · L8 user testing (definitions at the
top). **This screen especially:** L3 for the two gestures it is built on — a drag is a mouse
sequence here and the pinch was never exercised, and the pinch is the only interaction that
resizes the frame (30.3); L2 for 200% text on a screen whose preview is already 1.4 screens tall;
L4 for `touch-action: none` and `box-shadow: 0 0 0 9999px` inside a clipped stage on iOS Safari; L1
for whether a frame change is announced at all (30.9). **You should check:** one real drag and a
two-finger pinch at 390 — on this build you will be dragging a photograph that is not on screen
(30.1) — and VoiceOver after a frame chip.

| # | Count | Finding | Measurement | Verdict |
|---|---|---|---|---|
| 30.1 | 1, 7 | **On a phone the photograph is not on the screen at all.** The stage is a shrinkable flex item (`flex: 0 1 auto; min-height: 0`) inside a scrolling column, so it is squeezed to **0** tall to make room for the controls — **366×0** at 390, **296×0** at 320, **406×0** at 430 — while the canvas it holds is still **366×91.5**, laid out from y **34.25**, i.e. under the header. `overflow: hidden` on the stage then clips every pixel of it: **0 of 91.5** visible, and nothing in that band is hit-testable — points down the canvas's own box return `fullscreen__title`, `fullscreen__bar`, `crop-screen`, `field__label`, `segmented__btn`. A 40px drag at the frame's centre therefore changes nothing (left stays **44.2239%**), and a wheel scrolls the screen **0 → 216** and carries the canvas to y **−181.8**, further away. At 768 the stage keeps **140.13** of the canvas's **186**, so 46px of the picture — and one edge of the frame — is cut off. What a phone shows is the chips, two zoom buttons, a percentage and the preview: a crop screen whose subject is invisible and untouchable, and the only way to change the frame is the keyboard (30.8). | 390: stage `12,80,366×0`, canvas `12,34.25,366×91.5`, `visiblePixels` **0**, `elementFromPoint` at the canvas centre → **`crop-screen`**; drag → frame `left` **44.2239% → 44.2239%**; wheel 300 → `scrollTop` **0 → 216**, canvas y **34.25 → −181.8**. 320: stage `296×0`, canvas `296×74`, `visiblePixels` **0**, wheel → `scrollTop` **0 → 230**. 768: stage `744×140.13`, canvas `744×186`, `visiblePixels` **140.1**. | **FAIL** |
| 30.2 | 1, 7 | **The “As it will look” preview is a page-shaped box, and on a phone that is 1.4 screens tall.** The preview takes the page's aspect (`width / height`), so at 390 it is **366×792.05** — a 1:2.16 portrait box whose bottom is at **1,043.73** in an 844-tall window — and at 320 **296×462.5** (bottom **714.19** in 500). It is what 30.1 is caused by: the column gives the preview its height and the stage is what shrinks. The screen scrolls **216px** at 390 and **230** at 320 to reach the end of it, and on a desktop the same box is **420×262.5** at 1440 (correctly page-shaped, and the picture above it is a 300px band with **172px** of empty space between them) — so the one control that is honest about the result is the thing that costs the photograph its room. | Preview `366×792.05` at 390 (`aspect-ratio: 0.462085 / 1`), `296×462.5` at 320, `420×262.5` at 768 and 1440, `420×196.88` at 1920; `.crop-screen` scroll **988/772** at 390, **658/428** at 320, **828/828** from 768; gap from the stage's bottom to the preview's top at 1440: **551.69 − 380 = 171.69**. | **FAIL** |
| 30.3 | 5 | **There are no handles on the frame, and the two controls that resize it are the only ones under 44px.** The frame is `pointer-events: none` with a fixed shape — it cannot be dragged or resized, the picture moves under it — so the plan's “handles and targets at 320” has nothing to measure: resizing is the zoom pair or the keyboard, and both zoom buttons draw **42×44** (`btn--sm` with an `sr-only` label and no width), 2px short of the app's own minimum, beside chips at **97.53 / 66.11 / 72.77 × 44**, Reset at **84×44** and Save at **55.03×44**. The cursor says `grab`, which promises a handle the frame does not have. | `.crop-screen__frame` `pointer-events: **none**`, `border: 2px solid #fff`, `outline: 1px solid rgba(0,0,0,0.35)`, `box-shadow: 0 0 0 9999px rgba(0,0,0,0.42)`; Zoom out / Zoom in **42×44** at every width; Reset **84×44**; This screen / Phone / Square **97.53 / 66.11 / 72.77 × 44**. | **FAIL (minor)** |
| 30.4 | 5, 6 | **A saved frame comes back exactly, and the chip that made it does not.** Saving a Square (25% wide, 1:1, drawn `582,80,300×300`) and reopening draws **the same frame** at `582,80,300×300` with `25% of the picture` — and the chips read **This screen: true**, Phone: false, Square: false, because the screen resets `frame` to `'screen'` on every open and the frame is never stored. The lit chip is then a lie about the state, and pressing it re-frames to the page's shape and silently changes the crop the traveller came back to keep. `onSave(rect, frame)` does pass the frame and both call sites ignore it. | Reopen: frame `left 38.5%`, `width 25%`, `height 100%`, box `582,80,300×300`, `aria-pressed` **[This screen: true, Phone: false, Square: false]`, stored `{x:0.385, y:0, w:0.25, h:1}`; the square save baked **300×300** (ratio **1.000**) and the sampler's picture became **300×300**. | **FAIL (minor)** |
| 30.5 | 6 | **A picture that will not decode opens 30 as a blank screen with a 100% claim and a working Save.** Reached from 16 with a corrupt stored image, the crop shows a **0×0** picture and canvas, a **1,416×0** stage, the share line reading **“100% of the picture”**, a preview with no background at all (`background-size` empty), no error text anywhere, and Save enabled — so the one action left is the one that cannot work (it closes the crop and reports the failure back on 16). There is no state here that says the picture is unreadable. | `.crop-screen__picture` box **0×0**, `naturalWidth` **0**; stage **1,416×0**; canvas **0×0**; share **“100% of the picture”**; preview **420×262.5** with `style.backgroundSize` **“”**; `.crop-screen__error` **null**; Save `disabled` **false**. | **FAIL (minor)** |
| 30.6 | 5, 7 | **The wheel zooms without taking the scroll.** `onWheel` calls `zoom()` and never `preventDefault`, so the same gesture also scrolls the crop screen: at 390 `scrollTop` goes **0 → 216** and the canvas is pushed from y **34.25** to **−181.8**; at 320, **0 → 230**. On a desktop it is harmless (the column does not scroll — **828/828** at 1440 and 768), and wheel-down is a no-op on a frame already at full height (`zoomCrop` caps `h` at 1 and recomputes `w` from it), so the wheel reads as broken until it is rolled the other way — the direction it does work in (40% → 27.91% × 69.77% at 1440) is the one nobody tries first. | `wheel(0, 300)` at 390 → `scrollTop` **216**, frame unchanged; at 320 → **230**; at 1440 and 768 → **0**; `zoom(exp(240 × 0.0015))` = **1.43** leaves the frame at `40% × 100%`; the other direction is the one that works — `wheel(0, −240)` at 1440 took it **40% × 100% → 27.91% × 69.77%** (left 30% → 36.05%, share 40% → 19%) with `scrollTop` still **0**. | **NOTE** |
| 30.7 | 9 | **The back arrow is English on a Dutch screen.** The title, the chips, the share line, the canvas's own instruction and the Save all translate — “Foto bijsnijden”, “Dit scherm / Telefoon / Vierkant”, “14% van de foto”, “Sleep om de foto te verplaatsen; knijp of gebruik het wiel om te zoomen”, “Bewaren” — and the arrow beside the title is `label="Back"` with no `t()`. It is `FullScreen`'s, so it is 28.6 and 29.7 as well: the one control that is wrong in Dutch is wrong on every screen that shares the shell. | NL 320 and 1440: title **“Foto bijsnijden”**, save **“Bewaren”** (81.5×44), chips **“Dit scherm”**, **“Telefoon”**, **“Vierkant”**, share **“14% van de foto”**, canvas **“Sleep om de foto te verplaatsen; knijp of gebruik het wiel om te zoomen”**, back **“Back”**. | **FAIL (minor)** |
| 30.8 | 8, 10 | **It opens with focus on the button behind it, and the keyboard leaves through the page.** The screen is a third `role="dialog" aria-modal="true"` over the sampler and the widgets screen, with **0** `[inert]` regions, and on open `activeElement` is the sampler's own **Crop** button — outside the new screen. Nine stops are inside (Back · Save · canvas · This screen · Phone · Square · Zoom out · Zoom in · Reset) and the **tenth** leaves for the Settings page behind (“Use my location”); Escape then closes the crop and leaves focus on that Settings **switch**, while the back arrow and Save drop it on `BODY`. Nothing returns to the Crop button that opened it. | On open `activeElement` **`BUTTON.btn`**, `inCrop` **false**, three dialogs, `[inert]` **0**; walk 1–9 in screen, **10 → “Use my locationFills in the nearest stop”** (`in: false`); after Escape **`BUTTON.switch`** (a Settings switch), after the back arrow **`BODY`**, after Save **`BODY`**. | **NOTE** |
| 30.9 | 10, 1 | **Nothing says the frame moved.** The share line changes on every drag and every chip — “12% of the picture”, “25%”, “40%” — with no `aria-live` on it, the frame is `aria-hidden=\"true\"`, the preview is `aria-hidden=\"true\"`, and the canvas's name promises *“Drag to move the picture; pinch or use the wheel to zoom”*: on a phone the drag is dead (30.1), the wheel scrolls (30.6), the pinch was never measurable here, and the arrow keys and `+`/`-` that do work are not mentioned anywhere. A screen reader user gets a group with instructions that do not work and no report of the result. | `.row-wrap .t-faint` **“12% of the picture”**, no `[aria-live]`; `.crop-screen__frame` and `.crop-screen__preview` `aria-hidden=\"true\"`; canvas `role=\"group\"`, `aria-label` the drag/pinch/wheel sentence, `aria-describedby` **null**; `ArrowRight` **30% → 31%**, `Shift+ArrowDown` no change (the frame is full height), `+` **40%×100% → 33.33%×83.33%**. | **NOTE** |
**Verified to hold:** the screen is `position: fixed`, `inset: 0`, z **100**, on `--l0-bg`
(rgb(252,251,250); rgb(18,18,17) dark), with no horizontal overflow in any of the seventeen runs
(eleven widths, dark at 390 and 1440, Dutch at 320 and 1440, DPR 2 and 3). The bar is **72** tall
(padding **20 12 8**), the back arrow **44×44** at (12, 20) and (52, 20) at 1440, the title
(**16px/700**) **17.14:1** (**17.34** dark), and **Save** is the app's accent pill — rgb(255,126,103)
under obsidian ink at **7.11:1**, 11px/700, **55.03×44** (**81.5** wide as *Bewaren*). The frame chips
are **44** tall at every width (**97.53 / 66.11 / 72.77**), pressed ink **17.72** on white and
unpressed **5.6** on rgb(243,241,234); the share line is 12px at **5.51** (**7.36** dark) and the
*As it will look* label 11px at **6.13** (**9.16** dark). The frame is **2px white** with a **1px
rgba(0,0,0,0.35)** outline and **42%** dimming outside it, and it tracks the pointer exactly: a 40px
drag to the right moved it **−40px** (left **30% → 26.667%** of a 1,200px picture). Zoom in takes the
frame **40%×100% → 32%×80%**, Reset restores **40%×100%**, and the three chips draw **1.6**, **0.563**
and **1.000** frames. The canvas takes the app's ring from the keyboard — **2px coral at 2px offset**,
measured after a real Tab — and `ArrowRight` moves the frame **1%** of the picture (**30% → 31%**)
while `+` tightens it to **33.33%×83.33%**. The preview is derived, not decorated: at 320 its
`background-size` is **`100% 100%, 1850px 462.5px`** and its position **`0px 0px, −777px 0px`** for a
frame whose centre is at 50% of a 1,200px picture. Save bakes the frame's own shape — a square frame
produced a **300×300** image and the sampler's picture became **300×300** — and reopening draws the
saved frame at the same box (**582, 80, 300×300**, `25% of the picture`). Escape and the back arrow
write nothing (`backgroundCrop` **null** before and after a square frame had been chosen and
discarded). Dutch translates every string but the arrow, dark and DPR 2 and 3 change no geometry, and
the console is clean apart from the IP lookup's **429** in every run.

**Not measured:** text at 200% (L2), any real touch, pinch or drag momentum (L3), a pixel comparison
of the preview against the page's own painting — the preview's geometry and the baked image's shape
were checked, the page's drawing was not — and iOS Safari or Firefox (L4).

**Seen on the way (not counted here, and not part of 30's fixes).** The frame the screen opens on is
“This screen”, and on a landscape photograph that is **11.55%** of the picture wide — a 12% slice,
which is correct cover maths and a severe first answer: the preview shows one colour band of a
four-band test picture, and the traveller's first act is to zoom out. The stage's clipping is what
makes 30.1 read as a deliberate layout rather than a breakage: the picture, the frame and the dim are
all clipped together, so the phone screen looks like a header, three rows of controls and a preview,
with no hole where anything is missing. And 16's **Crop** button and 29's **Crop** button open this
same screen on different sources (the page's picture and the widgets' picture), so one fix lands in
both.

## 31. Home layout menu

**Status:** done — its own pass on 2026-10-21, no fixes made.
**Opened from:** Home → the header's **Edit** pill → the same pill, now a **+**, in the corner a
phone's home screen keeps it. It is one control with two faces: the first press enters customising,
the second opens the panel. **Run:** 320×500, 320×568, 360×640, 390×700, 390×844, 430×900,
768×900, 1024×900, 1440×700, 1440×900 and 1920×900, plus 390 at DPR 2 and 3, dark at 390 and
1440 and Dutch at 320 and 1440; two rows and three (after a keyboard reorder); a home of one, two
and three cards; the Tab path from the document's first control to the panel and round it; Escape,
the scrim and all three rows as exits; a window resized while it is open; the wheel over the scrim;
a reset that removes a card holding a chosen station.

**Not verifiable here:** L1 screen reader · L2 real device/notch/keyboard · L3 touch · L4
Safari/Firefox · L5 performance · L6 live network · L7 install · L8 user testing (definitions at the
top). **This sheet especially:** L1 for a `role="dialog"` that traps the keyboard and never says
`aria-modal` — whether the page behind is offered as available (31.1) — and for the row that
vanishes after a reset; L2 for 200% text in 44px rows whose labels are two words long; L3 for a
thumb on 44px rows under a blurred scrim, and on the 49×36 pill that opens them (31.4); L4 for two
stacked `backdrop-filter`s (the scrim's 8px under the panel's 24px) on iOS Safari; L5 for what those
two blurs cost a phone while the page scrolls beneath them (31.5). **You should check:** VoiceOver
on the `+` and inside the panel, and one **Reset layout** on a home you have arranged — whether the
third row disappearing, and the layout changing, are announced at all.

| # | Count | Finding | Measurement | Verdict |
|---|---|---|---|---|
| 31.1 | 8, 10 | **It traps the keyboard properly, then gives the focus back to nobody.** Opening from the `+` puts focus on the first row and the cycle is real — Add widget → Reset layout → Put it back → Add widget, and Shift+Tab from the first wraps to the last — but every exit drops focus on `<body>`: Escape, a press on the scrim, and each of the three rows, because each one closes the panel before acting. The `+` that opened it is still on screen with `aria-expanded` back to **false** and is never focused again, so the keyboard's next Tab starts from the document's first control (the pill is the **second** stop from the top). The panel declares `role="dialog"` with **no** `aria-modal` and nothing behind it is made inert — the reverse of 22–30, which declare a modal and never trap. Choosing Add widget then hands the keyboard to the catalogue with nothing focused: `activeElement` is `BODY` and the sheet it just opened is skipped. | `activeElement` on open **`BUTTON.list-row` “Add widget”** at 390, 1440 and with three rows; walk **Add widget → Reset layout → Put it back → Add widget**, Shift+Tab from the first → **Put it back**; after Escape **`BODY`**, after the scrim **`BODY`**, after Add widget **`BODY`**, after Reset layout **`BODY`**, after Put it back **`BODY`**; `aria-expanded` **true → false**; `[inert]` **0**; `body` overflow **visible**; **18** focusables with **2** in the panel at 390 (**20** / **2** at 1440); after Add widget the **390×742.72** sheet is open at y **101.28** and `activeElement` is **`BODY`** — its first Tab is **Close**. | **FAIL** |
| 31.2 | 5, 6 | **Reset layout throws the arrangement away, and the undo with it.** Seeded with three cards of the traveller's own choosing and a station chosen for two of them, one press of the middle row writes the default three, deletes the station belonging to the card it removes — a chosen station is not a layout preference and does not survive the card going — and clears the move history, so the **Put it back** that was a row lower is gone in the same instant and the arrangement is no longer recoverable by any control in the app. It asks nothing first, and it says nothing afterwards: the only confirmation is the page's one `aria-live` region (“Layout reset”), with no toast and nothing visible, so a sighted traveller watches their cards be replaced without being told why. Add widget is directly above it and Put it back directly below, all three 44 tall and 2 apart. | Seeded `home-widgets` **[planner, next-departures, second-board]** and `widget-stations` **{next-departures: utrecht-centraal, second-board: amsterdam-centraal}** → after one press: widgets **[planner, next-departures, pinned-stops]**, stations **{next-departures}** only, cards redrawn **3**, menu closed, customising still on, toasts **none**, live region **“Layout reset”**; reopening the panel shows **2** rows (Put it back gone). The same press at 320, and in Dutch at 320 where the live region says **“Indeling hersteld”**; the row sits at y **119–163** with Add widget **73–117** and Put it back **165–209**. | **FAIL (minor)** |
| 31.3 | 10 | **Resizing the window with the panel open moves the keyboard back to the top of it.** The panel re-places correctly on a resize — it is still **8** under the pill and still clamped inside the window — but the focus effect is keyed on the placed position, so every re-place focuses the first row again: Tab from Add widget to **Reset layout**, then 390 → 320, and the caret is on **Add widget**. The same at 1440 → 1024. A keyboard user who rotated a phone or dragged a window wide loses the row they had reached. | Focus on **`BUTTON` “Reset layout”** → `setViewportSize(320×500)` → focus **`BUTTON` “Add widget”**, panel **296×154** at **(12, 64)**, gap **8**; 1440×900 → 1024×900 the same (**Reset layout** → **Add widget**), panel at **(52, 64)**. | **FAIL (minor)** |
| 31.4 | 5 | **The only way into the panel is the smallest target on the screen, and it carries the panel's own name.** The pill is **49.06×36** — 8px short of the app's 44 and the only control here under it — with an 18px glyph inside a 36-tall oval, and while customising that glyph is all it shows (the word is on the other face). Its accessible name is `Home layout` — the panel's `aria-label` is the same string — so the button and the dialogue it opens are announced identically, and the name arrives only once the mode is on (before that the pill is “Edit”, with the title “Or press and hold the home screen”). | Trigger **49.06×36** at (12, 20) at 320–1024, (52, 20) at 1440, (292, 20) at 1920; **60.44×36** in Dutch; faces **23.06×16.19** (word) and **18×18** (glyph at 27.53, 29); `aria-label` **“Home layout”**, panel `aria-label` **“Home layout”** (Dutch **“Indeling van het startscherm”** on both), `title` **“Home layout”**; the rows below it are **44** tall. | **NOTE** |
| 31.5 | 7, 8 | **The page keeps scrolling under the scrim.** The scrim blocks every press and blurs what is behind it, but it does not take the wheel: at 320×500 a wheel over it scrolled the home screen **203px** while the panel stayed at top **64** — the header is sticky, so the 8px gap survives and the panel looks anchored while the cards slide underneath it. Nothing inside the panel needed the gesture (three rows is the most it can hold and it never scrolls), so the only thing the wheel moved was the page the scrim was supposed to be holding still. | 320×500: `scrollY` **0 → 203** (body **703**), panel top **64 → 64**, pill y **20 → 20**, gap **8 → 8**; 390×700: **0 → 3** (body **703**); `body` `overflow: visible`, panel `overflow-y: auto` with **152/152** (3 rows) and **106/106** (2 rows). | **NOTE** |
| 31.6 | 4, 5 | **Three different acts are drawn as one kind of row, and the undo wears the back arrow.** Add widget, Reset layout and Put it back are identical in width, height, ink, weight and glyph size — **282×44** (**278** at 320), 13.5px/400, an 18px glyph 13 from the row's edge — so the act that discards the arrangement cannot be told from the act that grows it, and it sits between the two that are safe. The undo's glyph is `arrowLeft`, the arrow the header uses for “back” on every other screen, under a row that says “Put it back”: the one row that undoes something reads as the one row that leaves the screen. No colour, weight or ordering separates them; only the third row's presence does. | All rows **282×44** at 360+ (**278×44** at 320), `padding: 8px 12px`, radius **12**, gap **12**, icon **18×18** at **13** from the row's left edge, label **13.5px/400** **18.225**; ink rgb(24,24,27) light / rgb(247,246,243) dark for all three; hover a **7%** ink wash; focus ring **2px coral at 2px offset**; icons `plus`, `refresh`, `arrowLeft`. | **NOTE** |

**Verified to hold:** the panel is `position: fixed`, z **56** over a scrim at z **55**, and hangs
exactly **8** under the pill in all seventeen runs (top **64**, pill bottom **56**) with its left edge
on the pill's own left — **12** at 320–1024, **52** at 1440, **292** at 1920 — **300** wide (**296**
at 320, the `min(300px, 100vw − 24px)` clamp, 12 from both edges there). It fits the window at
every size (`inViewport` true; bottom **172**, **218** with the third row), never scrolls inside
(**106/106**, **152/152**) and never reaches its `max-height: 460px` because three rows is the most
it holds: **108** tall for two, **154** for three, the same **108/154** in Dutch (**296×154** at
320). No horizontal overflow in any run (`scrollWidth` = the viewport from 320 to 1920). Rows are
**282×44** (**278** at 320) with padding **8 12**, radius **12**, a **12** gap and an 18px glyph
**13** inside; the label is 13.5px/400 with **18.225** leading, hover is a **7%** ink wash, and the
ring from a real Tab is the app's **2px coral at 2px offset**. The panel is
`color(srgb 1 1 1 / 0.78)` under `blur(24px) saturate(1.4)` in light and
`color(srgb 0.137 0.133 0.125 / 0.78)` in dark, radius **28**, a 1px rgb(205,199,184) /
rgb(74,70,60) border and a two-part shadow; the scrim is `inset: -1px -1px -96px` (a **392×941** box
at 390, **1442×997** at 1440), 28% of the page's own canvas with `blur(8px) saturate(1.08)`, and it
covers the dock (z **50**): `elementFromPoint` at the dock's centre returns `.home-menu__scrim`, and
at each row's centre returns that row's own `span.grow`. Because the panel is 78% opaque over a
blurred photograph its contrast moves with the picture: sampled on the paired background the row ink
is **17.3:1** in light and **14.5:1** in dark, **14.4** and **10.9** on the hovered row. Opening puts
the caret on the first row; Tab and Shift+Tab wrap through two and three rows; Escape closes it and
`aria-expanded` returns to **false**; a press anywhere on the scrim closes it; with `reduceMotion`
the panel and the scrim are both `animation: none`. **Add widget** closes the panel and opens *Add a
widget* (**390×742.72**, y **101.28**) with customising still on and storage untouched; **Put it
back** undoes exactly one move per press — two keyboard moves, two presses, and the cards are back
at `planner, next-departures, pinned-stops` — and the row is gone when the history is. **Escape** and
the scrim write nothing. Dutch translates every string — *Widget toevoegen*, *Indeling herstellen*,
*Zet terug* — and dark and DPR 2 and 3 change no geometry. The console is clean apart from the IP
lookup's **429** in every run.

**Not measured:** text at 200% (L2), any touch (L3), whether a card under a live press really refuses
the menu (the code refuses it; not exercised), and iOS Safari or Firefox (L4).

**Seen on the way (not counted here, and not part of 31's fixes).** The `+` cannot be pressed a
second time to close the panel: the scrim lies over it — Playwright refuses the click (“`.home-menu__scrim` …
intercepts pointer events”) and `elementFromPoint` at the pill's centre returns the scrim — so the
second press closes the menu by hitting the scrim rather than the button. One control with two faces
is therefore really three states — Edit, + closed, + “open” — and the closed and the open face are
drawn identically, so the panel is the only sign it is open. Page 1 already measured this gap with
two rows (8 under the pill, top 64); this pass adds the third row, the left clamp and Dutch. And the
reorder that **Put it back** restores can only be made with the panel shut (a drag, or the arrow keys
on a card), so the undo is always one open-and-close away from the mistake it fixes while the row
that destroys the arrangement sits between them.

## 32. Stop suggestions

**Status:** done — its own pass on 2026-10-21, no fixes made.
**Opened from:** the three fields that share one component (`StopCombobox`): Settings → **Default
origin** (`#settings-origin`), Departures → **Add a stop to the board** (`#board-stop`), and the
next-departures card's own station field (`#next-departures-stop`, whose visible label is hidden
because the sentence above it asks the question). A fourth instance the plan's line omits was audited
with them — the **Find a stop** widget (`#widget-stop-search`) — because its list is the only one of
the four that is fully usable, and that difference is 32.1. **Run:** 320×500, 320×568, 360×640,
390×700, 390×844, 430×900, 768×900, 1024×900, 1440×700, 1440×900 and 1920×900 on Settings, plus
Departures, the next-departures card and the Find-a-stop widget at 320, 390 and 1440; dark at 390 and
1440, DPR 2 at 390, Dutch at 320 on Settings and Departures; “amst” (eight results), an empty field,
and “zzzz” (none); the keyboard through the field, into the list and out of it; a press on a row that
is painted under other content; and the same Settings screen again with `cardTreatment: 'colour'`.

**Not verifiable here:** L1 screen reader · L2 real device/notch/keyboard · L3 touch · L4
Safari/Firefox · L5 performance · L6 live network · L7 install · L8 user testing (definitions at the
top). **This sheet especially:** L1, because `aria-activedescendant` is null throughout, so nothing
in the DOM says which row the arrows are on (32.3) — whether the moved `aria-selected` is announced
at all is the voice's business; L2 for the on-screen keyboard over a list capped to the room below
the field (212px at 320×500) and for 200% text in 56px two-line rows; L3 for a thumb on 56px rows,
most of which are behind another surface (32.1); L4 for `backdrop-filter` stacking in iOS Safari,
where the cause of 32.1 is the same by specification; L5 for a 58vh list repainted while a phone
scrolls the page under it. **You should check:** VoiceOver on the field and one arrow press, and one
press on the third result on Settings at 390.

| # | Count | Finding | Measurement | Verdict |
|---|---|---|---|---|
| 32.1 | 7, 8 | **Most of the list is painted underneath the page.** With glass cards — the default whenever a photo is chosen — every `.card` carries `backdrop-filter`, which makes each card a stacking context of its own, so the list's `z-index: 30` cannot lift it above the card that follows: on Settings at 390 only the **first three of eight** rows are the topmost thing at their own centre. The fourth is behind the next card's heading (`h2.t-section`), the fifth behind that card's journey times, the sixth behind the page's own hint, the seventh behind the dock (`a.app-dock__item`, z **50**) and the eighth is clipped by the list's own box. A press on one of those rows closes the list and chooses nothing (pressing the 4th row: list closed, field still **“amst”**, focus **`BODY`**). On Departures at 320 **none of the four visible rows is on top** — the empty-state card that follows covers the entire list, so typing “amst” draws nothing at all — and at 390 six of eight are behind that card. On the next-departures card at 390, three of eight; on the Find-a-stop widget, **eight of eight**, because it is the last card in its column. The proof of the cause is the same screen with `cardTreatment: 'colour'` (no blur on the cards): **six of eight** rows are then on top. | Settings 390×844: list box **332×383.59 at (29, 452.41)**; rows 461–517, 517–573 and 573–629 on the list; 629 → **`h2.t-section`**, 685 → **`div.journey-card__times`**, 741 → **`span.t-sm.t-muted`** (the page's), 797 → **`a.app-dock__item`** (dock **150×54 at (120, 778)**), 853 → off screen. Departures 320×500: list **264×255.36 at (29, 236.64)**, **0/4** rows on top (all under `section.card.stack`, `.empty__icon`, `h3.t-h2`). Departures 390: **2/8**. Card 390: **3/8** (behind the *next* widget's card, its label and its input). Find widget 390: **8/8**. Colour cards, same Settings screen: **6/8**. Ancestors of the list: `.combobox__field` (relative, z auto) → `.combobox` → `section.card.stack`, whose computed `backdrop-filter` is `blur(26px) saturate(170%)`. | **FAIL** |
| 32.2 | 10 | **The first ArrowDown skips the first stop.** The list opens with the first row already active, and `ArrowDown` both opens and *increments*, so the first press moves the highlight from row 1 to row 2 and Enter commits the second result. On an empty field over the whole network, one press went from **Leeuwarden** to **Alkmaar** and Enter wrote `defaultOriginStopId: 'alkmaar'` — the top-ranked suggestion is unreachable by pressing down once, and nothing on screen says the highlight began at the first row. | List open by focus: **rows 8, active 0** (“Leeuwarden”); one **`ArrowDown`** → **active 1** (“Alkmaar”); **`Enter`** → field **“Alkmaar”**, `settings.defaultOriginStopId` **“alkmaar”**, hint **“ALK Train, Bus, Walking”**, list closed, focus **`INPUT`**. | **FAIL (minor)** |
| 32.3 | 5, 10 | **Escape stops working as soon as the keyboard is in the list, and the arrow's row is never announced.** Each of the eight suggestions is its own Tab stop, and the key handler lives on the input only: from a suggestion button, Escape leaves the list open with its row still active. `aria-activedescendant` is **null** at every step — typing, arrow, arrow, arrow — while `aria-selected` moves from row to row, so the combobox never names the option its arrows are on, and eight `aria-selected` options in one listbox describe a multi-select the control does not have. The Tab walk is field → clear → eight suggestions, most of which are painted behind the card (32.1), so the keyboard's only way through a list it cannot see is eight presses. | Escape from the input: list closed, `aria-expanded` **false**, text kept; Escape from a suggestion button: list **still open**, row 2 still `aria-selected="true"`. `aria-activedescendant` **null** after typing, after two ArrowDowns and after ArrowUp. Tab sequence: **`INPUT#settings-origin` → `BUTTON` “Clear default origin” → 8 × `BUTTON` suggestion**; **8** buttons inside the list, **45** focusables on the page. `role="listbox"` with `aria-selected` on every `li`. | **FAIL** |
| 32.4 | 5, 10 | **A duplicate id on the Find-a-stop widget leaves its field without a name and its label without a target.** The widget's own `<section>` is `id="widget-stop-search"` and the field inside it takes the same id, so `document.getElementById('widget-stop-search')` returns the section; the `<label for="widget-stop-search">Find a stop</label>` points at that section, and the input's `labels` collection is empty. Pressing the visible words moves focus to `<body>`, and the field carries no `aria-label` — only a placeholder, which is not a name — so the one field on the home screen built to find stops is announced with nothing but “Search 61 stations, stops and landmarks”. | Two elements with `id="widget-stop-search"`: **`SECTION.widget.widget--span-4`** and **`INPUT`**; `input.labels` **[]**; `label[for]` → **widget-stop-search** (“Find a stop”); clicking it → `activeElement` **`BODY#`**; input `aria-label` **null**, `placeholder` **“Search 61 stations, stops and landmarks”**. | **FAIL** |
| 32.5 | 5, 6 | **The empty state is a listbox with no options.** Typing “zzzz” draws `<ul role="listbox">` whose only child is a plain `<li>` with no role, so the control announces an empty listbox and the sentence inside it — “No stops match “zzzz” / Search by station, stop or landmark name.” — belongs to no option; the field still reports `aria-expanded="true"`. | Empty: `role` **listbox**, `aria-label` **“Default origin suggestions”**, `[role="option"]` **0**, one `li` with `role` **null**, text **“No stops match “zzzz” Search by station, stop or landmark name.”**; on Departures the second line is **“Only a station or stop has a departure board.”** | **NOTE** |
| 32.6 | 4, 5 | **The active row is 1.13:1 from the list it sits in.** Hover and keyboard use the same fill — `--l1-bg`, rgb(243,241,234) on the white panel — and there is no other mark: no bar, ring, weight change or tick. The two lines are legible (17.72:1 and 6.33:1), so the words are fine; the only thing saying which row Enter will take is a wash a bright screen cannot show. | List **rgb(255,255,255)**, active row **rgb(243,241,234)** → **1.13:1**; name **13.5px/600** at **17.72** on the list and **15.68** on the active fill, meta **12px/400** at **6.33** and **5.6**; hover moved the wash to the third row and `[data-active]` with it; row radius **12**. | **NOTE** |
| 32.7 | 7 | **On a desktop the list runs past the fold, and its scrollbar with it.** The phone cap measures the room under the field, but from 720 up the cap is the stylesheet's flat `min(58vh, 460px)`: at 1024×900 the list's box ends at **1123** — 223 below the window — and at 1440×900 at **1171**, 271 below. The fourth to eighth results and the list's own scrollbar are off screen until the page itself is scrolled, which is the complaint the phone cap was written to answer (2026-10-17t20-06-25); the page does scroll (2,464 tall at 1440), so nothing is unreachable, but the list reads as three rows. | 1024×900: list **458×460 at (29, 663.28)**, bottom **1123.28**; 1440×900: **484×460 at (29, 711.28)**, bottom **1171.28**; 1440×700: **484×460 at (29, 511.28)**, bottom **971.28**; inline `max-height` **460px** on all three; document height **2,464**. | **NOTE** |

**Verified to hold:** the list is `position: absolute` inside `.combobox__field` — **5** below the
field's box (274.91 → 279.91 measured) — as wide as that wrapper rather than the input (**264** vs
**176** at 320, **332** vs **244** at 390, **484** vs **396** at 1440, **982** vs **894** on
Departures at 1440, the wrapper rule Page 1 recorded), left-aligned with it, radius **12**, a 1px
rgb(205,199,184) border, `var(--l2-bg)` (rgb(255,255,255) light, rgb(35,34,32) dark), padding **8**,
and `z-index: 30` beneath the header's **40** and the dock's **50**. On phones it caps itself to the
room it has — an inline `max-height` of **212.09** at 320×500, **246.09** at 320×568, **282.28** at
360×640, **312.41** and **383.59** at 390, **411.53** at 430 — and hangs upwards when the room below
is smaller (**up** at 390×700 and at 320 in Dutch, box top **8**); from 720 up it is the flat
`min(58vh, 460px)` (**460**). Rows are `li[role="option"]` wrapping a `.suggestion` button **56**
tall (**72.63** where a name wraps at 320), padding **8 12**, radius **12**, gap **12**; the name is
13.5px/600, the second line 12px/400 “city · code · type”, the favourite heart 13px and up to three
17px mode icons at the right. The input is `role="combobox"` with `aria-expanded` true/false,
`aria-controls` pointing at the real list, `aria-autocomplete="list"`; the list is `role="listbox"`
named “Default origin suggestions” (“Standaard vertrekpunt suggestions”, “Halte aan het bord
toevoegen suggestions” on Departures) and exactly one option carries `aria-selected="true"`, moving
with the pointer as well as the arrows. Typing “amst” gives the same eight stops in all four
instances and the list scrolls **464/458**; a chosen row commits — field **“Alkmaar”**, storage
**`alkmaar`**, hint **“ALK Train, Bus, Walking”**, list closed, focus kept in the field — and a press
anywhere outside the field's box closes the list. Dark, DPR 2, Dutch and the four instances change no
geometry. Console clean apart from the IP lookup's **429** in every run.

**Not measured:** text at 200% (L2), any touch (L3), a screen reader's voice (L1), and iOS Safari or
Firefox (L4).

**Seen on the way (not counted here, and not part of 32's fixes).** On Departures at 1440 the field
runs the width of the page, so the list is **982** wide and a row's mode icons sit some **900px** to
the right of the name they describe. And the z-order that 32.1 depends on is fixed: a list at z **30**
can never cover the header (**40**) or the dock (**50**), so the dock crosses the last two rows on
Settings at 390 whatever card the field sits in. The plan lists three places for this control; there
are four, and the fourth is the only one where the list is entirely pressable — the symptom changes
with where the field happens to sit, which is why one fix (a list that is not trapped in a card)
would read as fixed on Home and unchanged on Departures.

---

## Run-method caveats

The environment limits are the **L1–L8** list at the top; these three are about how the numbers are
taken, not about what the harness cannot see.

- Seeds are storage-level, not user gestures, except where the gesture is the thing under test.
- A true mid-drag state may not be reproducible headlessly; if not, it is marked **not measured**,
  never passed.
- Contrast and 44px targets are also measured by `scripts/ui-audit.mjs` across all routes; where that
  suite already covers a pair, this file cites it rather than inventing a second number.
