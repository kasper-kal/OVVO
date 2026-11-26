# OVVO: the deep audit

**Date:** 15 November 2026
**Scope:** every route, both appearances (light and dark), desktop 1440 × 950 and phone 390 × 844, every style, plus the interaction and motion layer.
**Deliverable:** findings and proposed fixes only. No code has been changed for this document.


**State on 26 November 2026:** nine findings in this file are marked fixed. The other seventy-two
carry no fixed mark, and several of those were in fact fixed later without the mark being added here,
the header, the board and the phone work are recorded in `USER-FIXES.md` and `DESIGN_DECISIONS.md`,
not in this file. This audit was not re-run today, so a finding below means "written on 15 November",
not "open now". Where the two disagree, `FIXES-APPLIED.md` and `USER-FIXES.md` are the current record.

---

## 0. The short version

The visual system itself is in good shape: **2,880 palette pairs pass** the contrast arithmetic, **6,124 rendered text nodes** pass WCAG AA in the browser sweep, no page overflows horizontally at 390/719/720/768/1024/1040/1440, no image is broken, and no link is dead. All **40 real styles apply** in both appearances.

What is not in good shape is the **product on top of the visual system**:

1. `/results` and `/plan` were two disconnected planners. **Fixed:** `/plan` now hands its real journeys to `/results`, which draws the same journey cards and opens the same journey page.
2. The planner opened on **2026-11-14**, the oldest built day (yesterday), and the primary action then searched a past day without complaint. **Fixed.**
3. Departure boards and station cards showed **"Onbekend"** instead of destinations, because a timetable destination the app could not match to a stop lost its words and the operator fell back to "Onbekend". **Fixed.**
4. Every station card said it was **8,742–8,773 km away**, and "Nearby stops" claimed the Domtoren was a **40-minute walk** from Utrecht Centraal. **Fixed.**
5. **Wrapped was open in November.** The year it showed (2025) was the last complete one, but the page itself should not be reachable until 1 January at 00:01, when it reviews the year that just ended. **Fixed:** `/wrapped` is now gated, and the invitation no longer appears in December. See §4.8.

The first draft of this report also said the home picker filled the wrong end. **That was the audit's mistake, not the app's**: the script typed into the To field. It is retracted in §4.1.

There are ~30 further visual and interaction defects below. **Fixed since this report:** the install banner is now on the home screen only (G1); pastel chips and severity pills have dark-appearance values (G8, F46); each journey leg is drawn in its own mode's colour (F17); the Settings preview starts from the current time rather than a fixed 14:05 (F58); a real search link now replays the official timetable in any browser instead of falling back to sample data. **Fixed:** Wrapped now opens only from 1 January 00:01 (F23). **Retracted:** the floating 44 px dot is the developer review tool, present only in development builds (G2).

---

## 1. Method and evidence

### 1.1 Automated gates (existing, run today)

| Gate | Result |
| --- | --- |
| `node scripts/styles-audit.mjs` | **Pass**: 40 styles × 2 appearances × 2 contrasts = **2,880 pairs clear**; tightest `nostalgia (light)` at 1.21:1 (hairline limit 1.2) |
| `node scripts/ui-audit.mjs http://127.0.0.1:3000` | **3 findings**, all touch targets: inline station links on `/disruptions/d-cancel-schiphol` at 390/719/720/768. 0 contrast, 0 clipping, 0 header-band/line, 0 wrapped capsules, 0 popover problems. 6,124 text nodes and 1,124 controls measured. |
| `node scripts/breakpoint-audit.mjs` | **Pass**: mobile < 720, desktop ≥ 720, nothing else decides a mode |
| `node scripts/contrast-sweep.mjs` | Did not finish inside 295 s (slow by design); superseded by the rendered style sweep in §1.3 |

The three touch-target findings are the **exempt inline-link case** in the project rules (never give a 44 px target to a link inside running text). They carry `.tap-target`, not `.stop-link`, so the audit cannot recognise them. Fix the classification, not the target: add the `.stop-link` class to those anchors or teach `ui-audit` that `a.tap-target` inside `p` is exempt.

### 1.2 Route sweep

A scripted sweep (`.logs/audit-pages.mjs`) loaded **16 routes** in **both appearances** at **both widths** (**64 screenshots**) and measured, per page:

- horizontal overflow
- broken images (`naturalWidth === 0`)
- buttons with no accessible name
- links with empty/`#` hrefs
- console errors and failed requests
- heading outline, document height
- applied `data-theme` / `data-style`

**Result:** overflow 0 on every route and width; broken images 0; dead links 0; unnamed buttons 0. Console noise is the Cloudflare RUM beacon (`ERR_FAILED`, blocked CORS in this environment) on all pages, plus two real 404s:

- `/api/lookup/summary?lang=en&article=Utrecht_Centraal_station`: **404** on `/stops/utrecht-centraal`
- `/api/passkey/status`: **404** on `/signin`

Both are missing Worker routes in the Vite dev server; the pages render as if the answer were "nothing".

88 screenshots in total are in `artifacts/audit/` (64 route cells + results/journey/edge/theme states).

### 1.3 Every style, rendered

Because 40 styles × 18 pages × 2 appearances is 1,440 full-page states, styles were verified in two layers:

1. **Arithmetic:** `styles-audit` proves every palette pair in every style/appearance/contrast combination.
2. **Rendered:** `.logs/audit-all-styles.mjs` loaded the home page once per style per appearance (80 renders), confirmed `data-style` equals the chosen id and `data-theme` the chosen appearance, and sampled up to 120 visible text/icon nodes per render for composited contrast. **0 nodes below 4.4:1.** All 40 real styles applied; the 14 "applied tram" lines in its log are group ids (`black`, `cream`, `gold`…) matched by the id parser, not styles.

This is stronger than eyeballing 1,440 screenshots for colour, but it does not judge composition. The theme gallery itself was reviewed in Default light, Default dark and **All Black**, and 35 route screenshots were inspected by eye (list in §9).

### 1.4 Interaction probes

Scripted clicks on Preferences, Map, Settings, Stop, Home and Wrapped, plus every theme tile handler observed through the gallery. Results are in §6.

---

## 2. Coverage matrix

Legend: **●** screenshot captured and inspected by eye · **○** captured and machine-checked only · **n/a** not applicable.

| Route | Light desktop | Dark desktop | Light mobile | Dark mobile |
| --- | --- | --- | --- | --- |
| `/` | ● | ● | ● | ○ |
| `/plan` | ● | ● | ● | ○ |
| `/results` (empty) | ● | ● | ○ | ○ |
| `/results/:id` (filled) | ● | ● | ● | ○ |
| `/journey/:id` (filled) | ● | ● | ● | ○ |
| `/journey/:id` (missing) | ● | ● | n/a | n/a |
| `/results/:bad` | ● | ● | n/a | n/a |
| `/wrapped` | ● | ○ | ● | ○ |
| `/map` | ● | ● | ○ | ○ |
| `/stops` | ● | ● | ● | ○ |
| `/stops/utrecht-centraal` | ● | ● | ● | ○ |
| `/departures` | ● | ● | ○ | ○ |
| `/disruptions` | ● | ● | ○ | ○ |
| `/disruptions/d-cancel-schiphol` | ● | ● | ○ | ○ |
| `/preferences` | ● | ○ | ○ | ○ |
| `/settings` | ● | ● | ● | ○ |
| `/themes` | ● | ● | ○ | ○ |
| `/developer` | ● (guard → Settings) | ○ | n/a | n/a |
| `/signin` | ● | ○ | ○ | ○ |
| `/auth/finish` | ● | ● | n/a | n/a |
| `/skeleton` (DEV) | ● | ● | n/a | n/a |
| 404 | ● | ● | ○ | ○ |

Every route was rendered in both appearances at both widths. Dark mobile cells marked ○ were measured but not eyeballed; this is stated again in §9 so it is not mistaken for visual sign-off.

---

## 3. Global findings (affect every page)

### G1: The install banner owns the top of every screen · P1 · visual
**Where:** all pages, both appearances, both widths. Evidence: every screenshot in `artifacts/audit/`.
On a fresh Chromium visit the app draws a 100 px (desktop) / ~150 px (phone) "Add OVVO to your home screen" card **above the page title**, on every route. On phone it is the first 150 px of a 844 px screen (18 % of the viewport) before any content. On `/signin` it is absent, which makes the one page without app chrome look like a different product.

**Fix:** show it once, on `/` only, and after the first meaningful interaction (a completed search) rather than before the first paint; or anchor it to the bottom dock as a dismissible sheet. Keep `Not now` writing the same dismissal key. Never let it push the document content down (it currently reserves space in flow on mobile; desktop floats).

### G2: Floating help button covers content · P1 · visual
**Where:** all pages; proven at 1440 on `/disruptions` (covers the third card's "Disruption" pill), at 390 on `/results` (covers the first card's heart) and `/journey` (sits over the Amsterdam Centraal platform row).
The 44 px coral disc is fixed at the bottom-right with no collision avoidance and no safe-area offset.

**Fix:** move it into the dock on mobile; on desktop offset it from the content column (e.g. `right: max(24px, calc((100vw - 1280px) / 2 + 24px))`) and hide it while a sheet or the dock is present. Add `env(safe-area-inset-bottom)`.

### G3: Empty states are dashed boxes that read as drop zones · P2 · visual
**Where:** `/results` (empty), `/results/:bad`, `/journey/:missing`, `/departures`, 404. All use a 1 px coral **dashed** border on a pale wash. Dashed borders in this app otherwise mean "drop a photo here" (the theme/background upload surfaces). In dark mode the dash is barely visible (see `notfound-dark-desktop.png`).

**Fix:** use the solid card border and surface tokens the rest of the app uses, with the icon in a tinted disc. Reserve dashed outlines for actual drag targets.

### G4: Empty pages hide their `<h1>` · P2 · structure/visual
**Where:** `/results` (empty and unreadable), `/journey/:missing`. The `h1` exists in the DOM (sweep reads it) but is rendered visually hidden, so the first thing on screen is a huge card with no page name. Filled `/results` *does* show "Journey results". 404 *does* show "Page not found".

**Fix:** always render the visible page title; keep the description only when it adds something. Pick one empty-state pattern and use it on all four pages.

### G5: Footer is inconsistent and the email is shouted · P2 · visual/copy
**Where:** visible at the bottom of `/settings` (both appearances); absent from `/results`, `/journey`, `/stops`, `/disruptions` even when they are long. The address renders as `OVVO.VIBECREATIONS@OUTLOOK.COM` in a pill.
**Fix:** give the footer its own layout slot on every page (or remove it from Settings), lowercase the address, add the year/version, and make the mail link `mailto:` with normal casing.

### G6: Mobile dock is three unlabeled glyphs · P2 · usability
**Where:** 390 px, every page. The dock shows Home, a board/ticket glyph, and a menu glyph with no labels; the active item is a coral pill. There is no direct route to Plan, Results, Stops or Settings without opening the menu.
**Fix:** five items with 11 px labels (Home, Plan, Boards, Alerts, More), or keep three but label them. Ensure the active pill animates between positions rather than cross-fading (see §8).

### G7: Date and time formats contradict the chosen settings · P1 · consistency
**Where:** `/plan` (mobile and desktop). With `timeFormat: '24h'` and `dateFormat: 'descriptive'` the planner shows a native time input rendering **12:47 PM** and a native `<select>` rendering **20261114**; other screens show "Today, 15 Nov" and "14:05".
**Fix:** wrap the time control in the app's own segmented 24/12 display, or set `lang`/`step` and format the selected value beside the control; replace the raw `YYYYMMDD` select labels with `formatDay()` ("Sat 14 Nov"). Never expose the storage key as a label.

### G8: Light/dark pastel chips are tuned for one appearance · P2 · visual
**Where:** `/stops` (mode chips: Bus pale pink, Metro pale yellow, OV-fiets outline) and `/disruptions` (severity pills pale pink/yellow). In light they are pleasant; in dark they become the brightest objects on the page and out-shout the titles.
**Fix:** tokens per appearance (`--chip-bus-bg` etc. under `[data-theme='dark']`), lowering lightness/saturation in dark while keeping ≥ 4.5:1 text. Same for severity pills.

---

## 4. Page-by-page findings

### 4.1 `/`: Home
**Light:** no `h1` at all; the page opens with the install banner, then the "Plan a journey" card, then two 300 px cards, then ~250 px of nothing. There is no greeting, no recent searches, no saved journeys, no live status summary, despite the page copy promising "pick up where you left off". The "Edit" button sits alone in the top-left of the header, visually detached from what it edits.
**Dark:** same, plus the two-column cards have equal heights but the right-hand card is half empty.
**Mobile:** the From/To card loses the swap control and shows only two rows; the bottom dock plus install banner consume ~240 px of the 844 px screen.

**F1 · retracted: the picker is correct.** The first draft claimed the From picker filled the To row. That was the audit script's fault: the picker has two inputs (`#picker-from`, `#picker-to`), and the script filled the **last input**, which is To, then reported the result as if it had used From. Re-tested with `#picker-from`: the From row fills, the sheet advances to "Where do you want to go?", and the pair searches when both ends exist. No app change is needed, and no fix is proposed.
*Lesson for the audit harness:* address the picker by id, never by "last input".

**F2 · P1: no page heading.** Add a visible `h1` ("Home" or "Good afternoon") so the document outline starts somewhere. The sweep finds `h1: 0` on this route.

**F3 · P2: "Edit" is an orphan.** Move it into the card it edits or label it "Edit home".

**F4 · P2: empty space.** The lower half of the page is blank; either surface recent searches/favourites here or reduce the card heights.

### 4.2 `/plan`: Plan a journey
**Light/dark:** a single form card with From, To, Day, Leave after, Search, then "Timetable for 20261114 · 21,276 stations". Results render **inline below the form** as cards with times, duration, line pills, price, but no links, no heart, no detail, no filters.

**F5 · fixed: the planner defaulted to yesterday.** It now opens on today's service day (or the next built day), earlier days are disabled, and the raw `20261114` label became `Sat 14 Nov` / `Sun 15 Nov · today`. Verified in the browser: value `20261115`, 14 Nov disabled, status reads `Timetable for Sun 15 Nov`.

**F6 · fixed: one planner, one results screen.** `/plan` computed real journeys and drew them inline, where nothing could open one, save one, or see it on a map. It now converts each real journey into the app's own `Journey` shape, stores the answer for the tab (`planResult`, session storage), and navigates to `/results`. The results screen recognises the search and draws those journeys with the normal cards; each opens `/journey/:id`, including after a reload. The inline list and its duplicate live-delay panel are gone.
*What is deliberately absent:* fare, crowding, bicycle rules and live delays are not in these results, and the screen says so: the timetable has no fare, and inventing one would be the same sin as the old "Onbekend". The demonstration engine's filters/sort do not apply to real results yet; the journey cards and pages do.
*Files:* `src/pages/PlanPage.tsx`, `src/pages/ResultsPage.tsx`, `src/state/AppState.tsx`, `src/data/types.ts`.

**F7 · P1: raw day value and 12-hour time** (see G7).

**F8 · P2: no swap control on mobile.** Desktop shows a reverse button between the fields; at 390 it disappears. Keep it as a 44 px icon button beside the two rows.

**F9 · P2: placeholders look like filled fields.** Both inputs show "Type a station name" at full opacity, so an empty form looks completed; use a muted placeholder and a visible label.

### 4.3 `/results`: Journey results (empty)
**Light/dark:** giant dashed card, hidden heading (G3/G4), copy: *"No search has been run in this browser yet. Journey results. Nothing to show yet. Plan a journey first: its results will appear here, and this address will bring them back."* The promise is false (F6). The card's only CTA goes to `/plan`.
**Mobile:** same, plus the banner and dock.

**F10 · fixed (copy only): the promise was false.** The empty state now says *"A saved search reopens here. New searches start in the planner."* The larger merge (F6) remains open.

**F11 · P2: no recent searches.** The app stores `recentSearches` but the empty results page does not list them; it could offer one-tap re-run.

### 4.4 `/results/:id`: Journey results (filled)
**Light:** search card (From/To, leave time, Save, sort, Options), "7 of 12 shown", an alert strip, EARLIER collapse, 7 cards. **Dark:** cards read well; the "Fastest" badge is pale yellow and very bright.
**Mobile:** the floating "?" covers the first card's heart; "Fastest" wraps onto its own row while on desktop it sits inline.

**F12 · corrected: "4000" is a real line.** It is `Sprinter 4000` in `src/data/network.ts`, not a route id, so the data is right. The *presentation* still reads like an id because the pill shows only the number. A P2 clarity fix, not a P0 data defect: use the line's name (`Sprinter 4000`) for train series, or show number plus mode.

**F13 · P1: past-date search served silently.** The seeded link dated 2 November 2026 (13 days earlier) produced a full list and a "Later" control, with no "this day has passed" notice. The code elsewhere deliberately refuses past days (comment at `ResultsPage.tsx` around the date validation). Direct links bypass it.
*Fix:* validate `query.date` against today on mount; show a banner "This search is for a past date: showing the timetable for that day" and offer "Plan for today".

**F14 · P1: fake live delays on demo data.** Cards show "+9 min", "+3 min", and the header of the journey shows "Delay +3 min", but this results set is generated by the demo engine; the real live feed is used by `/plan` and the boards. Either fetch live for these trips or label the badge as sample.
*Fix:* drive the delay chip from `useLiveDepartures` keyed by trip id, and render nothing when unknown.

**F15 · P2: "7 of 12 shown" with no way to see the other 5** except the LATER collapse below the fold; the count and the control are far apart. Put "Show 5 more" next to the count.

**F16 · P2: hearts sit at the extreme right**, 380 px from the card's information on desktop, and the first one is under the FAB on mobile. Move the heart next to the times or into a card action row.

### 4.5 `/journey/:id`: Journey detail
**Light:** title with station links, "Monday 2 November · 1 hr 5 min · €14.25 Delay +3 min", RETURN / MAP / SAVE, an alert, then the timeline: 10:00 Haarlem P9 → Bus 347 +3 → 10:30 Schiphol P1 → Intercity 900 → 10:45 Amsterdam P4 → Bus 22 → 11:05 Zaandam P1. Footer line "2 transfers · Expected fairly busy · Bicycle allowed".
**Dark:** identical structure, good contrast; the blue timeline reads strongly on black.
**Mobile:** the help FAB sits over the Amsterdam row.

**F17 · P1: the bus leg is drawn in train blue.** **Fixed.** Each ride row now carries its own mode, and the spine and its ring take that mode's colour (a tram leg is measured sage, a bus coral). Walks keep the grey dashes.
*Fix was:* colour each segment by `leg.mode` (the same mapping as the mode chips), including the dot ring.

**F18 · P1: the header delay does not move the arrival.** "+3 min" is shown beside a 65-minute duration computed from scheduled times; the arrival stays 11:05. A delayed journey that still arrives on time is contradictory.
*Fix:* either apply the delay to the last leg's arrival and show `11:08 (+3)`, or move the badge to the affected leg only and drop it from the summary.

**F19 · P2: the page is 60 % empty.** Content ends at ~600 px of a 950 px viewport, with a single narrow column. Nothing follows: no "earlier/later", no ticket, no share, no disruption detail, no "plan the return".
*Fix:* add a right rail on desktop (journey actions, fare breakdown, disruptions on this route) or a bottom section with the next three departures for the same origin/destination.

**F20 · P2: RETURN is ambiguous.** It could mean a return ticket or reverse the journey. Label it "Plan the return" or use a reverse icon.

**F21 · P2: missing features that belong here.** per-leg duration and distance, transfer walking time, platform change warnings per leg, "buy ticket", share, print/agenda export, and a live refresh timestamp. Only the alert strip hints at disruption.

**F22 · P2: restored-journey empty page** (direct link, no session): no visible `h1` (G4), dashed card (G3), "Favourited journeys (0)" offers nothing. Offer the last search when one exists (the code already does on a later branch) the first branch hides it.

### 4.6 `/wrapped`
**Light and dark:** the page always renders its own dark scene, ignoring the chosen appearance. Token strip, "OVVO WRAPPED", **2025**, "Your year in journeys you planned.", "Demo year: none of this is real, and none of it is stored.", BEGIN, Sound on, close.
**Mobile:** nine progress segments, sound button, year, copy, BEGIN: composition is strong; 2025 is wrong for a page opened on 15 November 2026.

**F23 · P1: Wrapped opened outside its season.** The page was reachable in November and showed 2025 as if the season were running. Correct behaviour: it opens on 1 January at 00:01, reviews the year that just ended, and is closed the rest of the year. **Fixed:** the route is gated (a closed screen with the opening time), the December pre-open is gone, and the invitation still appears only in the first week of January. The honest "example year" note on an empty tally stays.
**Fix:** derive the year from the data; replace "Demo year…" with "Your journeys, counted from this device" once real.

**F24 · RETRACTED: no entry point is the design.** The home invitation appears in the first week of January and names the year just ended; the page itself is reachable at `/wrapped`. A permanent link would offer a story that is not being told yet.

**F25 · P2: contrast of the eyebrow and disclaimer.** "OVVO WRAPPED" is ~10 px grey on deep purple; measure and lift to 4.5:1 minimum at that size.

### 4.7 `/map`
**Light/dark:** "Network map", All routes, mode filters (Train/Bus/Tram/Metro/Ferry), a large pale map with 7 labeled nodes, "All 54 stops on this map".
**Problems:**
- **F26 · P1: overlapping labels.** "Utrecht Vaartsche Rijn" is crossed by its own node and the line; "Utrecht Overvecht" is cut by a route line; "Groningen Station" sits on a line. No collision detection.
- **F27 · P1: 47 of 54 stops have no label.** Only the largest stations are named, with no legend explaining the rule.
- **F28 · P2: the canvas is mostly empty.** The graph occupies the middle third; the rest is flat background. Fit the network to the viewport or crop the canvas.
- **F29 · P2: filters look like tabs.** Train/Bus/Tram/Metro/Ferry are multi-select toggles but are styled as a single segmented control; the active state is a dark pill identical to the selected tab pattern.
- **F30 · P2: no zoom/pan, no search, no "my location", no legend** for the line colours ("Each arm is the next stop…" exists only on the station page).

### 4.8 `/stops`: Stations & stops
**Light/dark:** search, Favourites only, Sort by Nearest, Options, "15 of 61 stops", cards in 3 columns, Show 5 more.
**The card is the problem:**
- **F31 · fixed: the IP estimate was on another continent.** The estimate is now only accepted inside a generous Benelux box (lat 49–54.5, lon 2–8.5), both when fetched and when read from yesterday's cache; a cached bad fix is discarded. Verified: no `8xxx km` text on `/stops`, the distance column is gone, and the sort falls back to city order.
- **F32 · P0: most departure rows have no destination.** Leeuwarden shows three bare times and platform letters; Haarlem three bare times; only Groningen/Amsterdam rows name a destination. Same root cause as "Onbekend" on the station board.
- **F33 · P1: empty cards.** "Amsterdam, Anne Frank House" and "Den Haag, Binnenhof" show only PLAN in a 380 × 200 card, leaving 150 px of blank card.
  *Fix:* collapse to a single-line "No departures: plan a journey" row, or omit departures entirely and shrink the card.
- **F34 · P2: a tap icon labels platforms.** The little glyph before "A"/"B" reads as a water tap, not a platform.
- **F35 · P2: "Show 5 more" sits alone** at the bottom centre after a 3-column grid; align it to the grid or state the remaining count ("Show 5 of 46 more").

**Mobile:** distances and missing destinations are worse because there is no room for a destination even when one exists; dock overlays rows mid-scroll.

### 4.9 `/stops/:id`: Station
**Light/dark:** title, PLAN, heart, Stop information (mode chips, platforms, facilities), Next departures, Alerts at this stop, Position on the map, Lines calling here (10 services), Nearby stops.
**Findings:**
- **F36 · fixed: the board lost its destinations.** The timetable carries `d` (headsign) and `l` (service); when `d` did not match one of the app's stop names, the row's destination link rendered nothing (the words were thrown away with the link) and the operator line fell back to `operatorName`'s "Onbekend". Fixed by printing `destinationLabel` without a link when the stop is unknown, mapping feed operator spellings (`NS`, `Arriva`) to the app's operator ids, and printing the feed's service name. A terminus whose headsign is the station itself is filtered out. Verified: four sample rows now read `13:25 Utrecht Centraal · Sprinter · NS`, `13:33 Rotterdam Centraal · Intercity · NS`; "Onbekend" count is 0.
- **F37 · fixed: nearby walking times were canvas guesses.** `walkMinutesBetween` multiplied schematic canvas units by a city factor, which made the Domtoren 40 minutes away. It now measures the real WGS84 distance at 80 m/min. Verified: Domtoren reads **10 min**.
- **F38 · P1: map labels overlap** as on `/map`; "Utrecht Vaartsche Rijn" is unreadable.
- **F39 · P1: "Showing from 12:47, the current time in this browser" clips at 390 px.** The line runs to the edge and is cut mid-word ("browser" truncated by the viewport).
- **F40 · P2: "every 30 min" orphans "min"** onto a second line in every "Lines calling here" card at 390 px. Use a non-breaking space between the number and unit, or a compact "30′".
- **F41 · P2: the section order is odd.** the map sits between alerts and lines; lines (the thing you came for) are fifth. Put Lines before Position on the map.
- **F42 · P2: the star of the page is buried.** "Next departures" is the second card but the primary action (board) is a small outlined pill; the live/delay state is absent from the station board compared with `/plan`.

### 4.10 `/departures`: Departure boards
**Light/dark:** "Departure boards", search, then a dashed empty card: "No stops pinned to the board". Header's left control is a **refresh** icon, not the back arrow used everywhere else.
**Findings:**
- **F43 · P1: the page is empty on first use and gives no suggestions.** "Choose stops" goes to `/stops`, where the card offers BOARD and PLAN but no explicit "pin" affordance; the mental model never connects.
  *Fix:* pre-pin the nearest/favourite station, or show three suggested boards (Utrecht Centraal, Amsterdam Centraal, Rotterdam Centraal) as one-tap chips in the empty state.
- **F44 · P2: refresh icon in the back slot.** At 1440 it sits at x=74 like a back arrow; users will press it expecting to go back. Use the same back arrow and put refresh inside the board header.
- **F45 · P2: no board exists to judge** for tabs/direction/mode; once boards exist, add a per-board direction toggle (departures/arrivals) and a "now/next" header.

### 4.11 `/disruptions`: Disruptions & service alerts
**Light/dark:** search, Affecting my favourites, Severity, Options, five cards, Show 5 more.
**Findings:**
- **F46 · P1: severity pills glare in dark** (pale yellow/pink with black text). See G8.
- **F47 · P2: five identical "ALERT DETAILS & ADVICE" pills** dominate five cards; the whole card is already clickable. Make the title the link and drop the repeated pill, or show it on hover/focus.
- **F48 · P2: the card body stops at 60 % width** leaving a large empty right area below each severity pill. Let the description span the card, or use two columns.
- **F49 · P2: no "active now" grouping.** All five are shown flat; two are future ("08:00–12:00"), one is all-day. Group Active now / Later today / Planned works, with counts.
- **F50 · P2: the affected-stop links are the three UI-audit target failures**; keep them inline, but classify them `.stop-link` so the gate stops flagging them (see §1.1).

### 4.12 `/disruptions/:id`: Alert detail
**Light/dark:** title, Major disruption pill, time, "What is happening", advice, chips (08:00–12:00, Cancelled, Train, Bus, NS, Connexxion), affected stops, affected services, other alerts.
**Findings:**
- **F51 · P2: chip semantics are mixed.** Time, status, three modes and two operators share one visual treatment; a reader cannot tell which are filters and which are facts.
- **F52 · P2: "OTHER ALERTS" is a horizontal strip** with chevrons at both ends; at 1440 it shows two, leaving the arrows looking like decoration. Show all remaining alerts as a short list.
- **F53 · P2: the stop links are 16 px tall inline targets** (exempt, but see F50); the DETAILS buttons elsewhere are 44 px.
- No P0/P1 beyond the global ones: this page is visually the strongest in the app.

### 4.13 `/preferences`: Travel preferences
**Light:** seven mode pills (all selected, dark fill), a sliders card ("Maximum time on a single vehicle" 20 minutes, 5 min/45 min), maximum transfers select ("Maximum 2 transfers"), trade-offs with three switches, reset.
**Findings:**
- **F54 · P1: selected and unselected look the same in a screenshot.** All seven modes are selected, so every pill is dark; after toggling Train off the remaining six stay dark and Train becomes light (good) but nothing (icon, check) marks the on state for a colour-blind or low-vision user.
  *Fix:* add a check glyph or strike-through on the off state, and a `aria-pressed`-driven icon.
- **F55 · P2: the right column is empty** below the transfers select while the left column continues; the page reads as two unrelated halves.
- **F56 · P2: the slider's value is only in the label** ("20 minutes" bold above), not attached to the thumb; add a value bubble or output element.
- **F57 · P2: "Trade-offs" has no explanation** of what is being traded; the switches have no visible on/off words.
- Interaction verified: toggling Train removes it from the pressed set (7 → 6) and persists. No dead controls found here.

### 4.14 `/settings`: Settings
**Light/dark:** OVVO ID, Appearance (theme, language), Display (clock, date, density, contrast, motion, battery), Developer, Themes, Location, Names for your favourites, Planner defaults, Preview, Reset.
**Findings:**
- **F58 · P1: the preview shows a delay that does not affect the arrival.** "14:05 → 15:42, 1 hr 37 min, Delay +4 min". If the 14:05 is delayed 4 minutes the arrival should be 15:46, or the badge belongs to another leg. Either way the sample teaches the wrong thing.
- **F59 · P1: the preview's departure board is blank on mobile** (a 160 px empty box labelled "DEPARTURE BOARD" with a rule and a FILTERS button), while desktop shows two sample rows. A responsive rule hides the rows but keeps the card.
  *Fix:* hide the whole board block at ≤ 560 px, or keep two rows and reduce the padding.
- **F60 · P1: "ACCENT COLOURS" is a legend for a control that no longer exists.** Five swatches with names and a "CURRENTLY IN EFFECT" chip row sit under a dozen settings that do work; the style model replaced per-colour selection. If they are not interactive, they are dead content; if they are, they contradict "Themes".
  *Fix:* remove the section, or turn it into a read-only "colours in this style" list inside the Themes card.
- **F61 · P2: "Raised contrast" and "Reduce motion" switches are 24 × 14 px tracks** at 390 px, with labels touching the track. Their hit areas pass the gate but the controls look disabled.
- **F62 · P2: section spacing collapses after the Appearance card**: "Display" starts with no top margin under "The language of the interface." at 390 px. Card-in-card headings need the same 24 px rhythm as desktop.
- **F63 · P2: "Settings" page hides its own description**, then shows a "RESET TO DEFAULTS" button at the top-right that is visually louder than every setting (solid outline, caps). Make it a text button at the bottom next to "Reset the app".
- **F64 · P2: two resets.** "Reset to defaults" and "Reset the app" (coral) are far apart and both unconfirmed; clarify scope ("Reset settings" vs "Delete everything on this device") and require confirmation for the destructive one.
- **F65 · P2: the footer email is uppercase** (G5) and there is no version/build number, despite a Developer section.
- Interaction verified: high contrast toggles `data-contrast` normal → high. No dead switches found.

### 4.15 `/themes`: Themes
**Light/dark:** "In use: Default", UPCOMING (Sinterklaas, in 20 days), then BLACK/CREAM/GOLD/BLUE/GREEN/WINE & ROSE/HOLIDAYS with 40 tiles + duplicates, each a rounded card with three colour bars and a name.
**Findings:**
- **F66 · P1: Sinterklaas appears twice**: once as UPCOMING and again inside HOLIDAYS. The upcoming row is a single small tile marooned at the left of a full-width card.
  *Fix:* either show upcoming as a banner ("Sinterklaas arrives 5 Dec: preview") that scrolls to the tile, or remove the duplicate from the grid while upcoming.
- **F67 · P1: the selected tile's ring is square in dark.** In light the coral ring follows the card radius; in dark it is an axis-aligned rectangle around a rounded tile (see `themes-dark-desktop.png`, Default). Either an `outline` without radius or a style-specific `--radius` override.
  *Fix:* draw the ring with `box-shadow: 0 0 0 2px var(--accent)` which always follows `border-radius`.
- **F68 · P1: "In use" is nearly invisible in dark.** The full-width bar has the same surface as the page and a black swatch at its left; only the word "Default" identifies it.
  *Fix:* give the bar the raised card surface and a visible border in dark, and show the style's three colours at 32 px rather than 24 px.
- **F69 · P2: no search or filter** for 40 styles; no grouping by brightness; no "light/dark pair" preview; no way to see a style applied without selecting it.
- **F70 · P2: taxonomy is loose**: WINE & ROSE contains "Ultraviolet" (purple) and "Palazzo" (brown); BLACK contains "Arches" (brown). Rename groups by temperature/era or move the tiles.
- **F71 · P2: tile names are underlined**, so every theme looks like a link inside a button; the underline is redundant.
- **F72 · P2: group headings are 11 px caps at ~3.5:1 in dark**; they are structural, so lift them to at least 4.5:1 or make them larger.
- Interaction verified: selecting All Black applies `data-style="night-aa"` immediately and survives a reload. No dead tiles were found among the ones exercised; the full 40-style application was proven programmatically (§1.3). Tile click handlers re-render the grid, so a scripted index walk is unreliable: visual state after each click is the honest check.

### 4.16 `/developer`
The route is guarded: with Developer mode off it renders the Settings page (the "Developer" card is there). That is correct behaviour, not a bug. When enabled, the dev panel (date/battery/connection overrides) appears; it was not exercised in this audit beyond the guard. The guard's redirect gives no explanation ("Why am I on Settings?") add a toast "Turn on Developer mode in Settings" if the user followed a direct link.

### 4.17 `/signin`
**Light:** a brandless column: "Sign in", "Continue with Google", "or", email field with a coral focus ring, "SEND SIGN-IN LINK", "USE A PASSWORD INSTEAD", "Back to OVVO". No logo, no sidebar, no footer; a lone "?" bubble bottom-right.
**Findings:**
- **F73 · P1: the page breaks the shell.** Every other route carries the logo and (desktop) the sidebar; this one floats in white space, so it reads as a third-party page. Add the logo and the same page header.
- **F74 · P1: `/api/passkey/status` 404s in dev**, and the UI silently shows "Use a password instead" as if passkeys were unavailable. In production the Worker answers; in dev the page must either stub the route or say "Passkeys are unavailable in this build".
- **F75 · P2: the email field is focused on load with a coral ring**, which looks like a validation error. Use the neutral focus ring until the user types.
- **F76 · P2: no error state**: submitting with the API missing produces no visible message. Add an inline error and a retry.
- **F77 · P2: "Continue with Google" is a black pill**, the only black button in the app's auth flow, and its label case differs from the coral "SEND SIGN-IN LINK".

### 4.18 `/auth/finish`
Renders the **Sign in** page (h1 "Sign in") with no explanation, so a traveller returning from the identity provider sees the start of the flow again. Add a dedicated "Finishing sign-in…" state with a spinner, a timeout message, and a link back; or redirect to `/` with a toast.

### 4.19 404
"Page not found" + dashed card "Nothing here. Use the navigation for the planner, results, stops and departure boards." Two buttons. Duplicate message (title and card), dashed card (G3), and the copy points at "results" which cannot be reached. Change the card heading to something actionable ("We couldn't find that page") and drop the second line.

### 4.20 `/skeleton` (development only)
"Held places" renders skeleton variants on a bare page. Fine as a lab, but it is reachable by URL in dev builds and looks like a broken page if stumbled on. Gate it behind `?lab=1` as well as DEV, or add a "Skeleton lab" heading and a link back.

---

## 5. Theme system (40 styles × 2 appearances)

### What passed
- All 40 styles apply via `data-style` in both appearances.
- 2,880 palette pairs pass the project's contrast arithmetic (text 4.5, marks 3, hairlines 1.2).
- Rendered sampling of 120 nodes per style/appearance found **0** below 4.4:1.
- Appearance switching is honoured (`data-theme`), and the choice survives reload.
- `All Black` correctly zeroes radii and repaints every surface, including the gallery tiles: the square ring on the selected tile is the one artefact (F67).
- Reduced motion zeroes `--t-press/hover/spring` and disables skeleton/spinner/view transitions.

### What did not
- The gallery's selection, "In use" and duplicate-holiday problems above (F66–F72).
- **The gallery is the only place a style is visible.** There is no preview of a style on a real screen (a mini journey card at 120 × 80 would do), so choosing among 40 is guesswork.
- **Seven group-sized palettes share near-identical canvases**: 38 styles paint a transparent body and rely on a wrapper; only the Default family paints `body`. This is not a bug, but it means screenshot-based regression tools that sample `body` will see three colours, not 40 (worth fixing in the test harness, not the app).
- **The All Black style inherits the lockup unchanged**; the logo is white-on-black and reads well. No logo edit is proposed (and none will be made without two confirmations).

---

## 6. Features that do not exist but should, and controls that do not respond

### Do not respond / behave wrongly
| # | Control | Observed |
| --- | --- | --- |
| 1 | ~~Home From picker~~ | **Retracted**: the picker was correct; the audit typed into `#picker-to` (F1) |
| 2 | `/plan` Search | Runs inline; cannot open a journey, save, filter or share (F6) |
| 3 | `/results` empty CTA | Goes to `/plan`, whose results never arrive here (F10) |
| 4 | `/plan` day select | Defaults to yesterday (F5) |
| 5 | Results date | Accepts a past day with no warning (F13) |
| 6 | Journey delay | Shown but arrival not adjusted (F18) |
| 7 | `/signin` passkey check | 404 swallowed, password fallback shown (F74) |
| 8 | `/auth/finish` | Shows Sign in again (4.18) |
| 9 | `/developer` direct link | Silent redirect to Settings (4.16) |
| 10 | Install banner dismiss | Works in code (writes dismissal, hides), but the banner still occupies the top of every first visit across routes (G1); dismissal was not visually confirmed because headless Chromium only offers the install event intermittently |

### Verified working (so they are not "fixed" by mistake)
- Preferences mode toggles (7 → 6 pressed, state kept).
- Map mode filters (54 → 28 stops).
- Raised contrast (`data-contrast` normal → high).
- Favourite a station (heart `aria-pressed=true`, appears on Home).
- Wrapped sound toggle (Sound on → off).
- Theme selection applies and persists (`night-aa` after reload).
- Sorting, options, severity filters render and change counts (spot-checked).

### Missing features worth planning
1. **Recent searches** on the empty results page (the data already exists).
2. **Pin/unpin a board** from a station card, with the board count in the nav.
3. **Journey actions**: share link, add to calendar, buy ticket, plan return.
4. **Station page**: live departure/arrival toggle, platform filter, "services from this platform".
5. **Map**: zoom/pan, search, geolocation, legend, label collisions.
6. **Themes**: search/filter, live preview, light/dark pair, "surprise me".
7. **Wrapped**: real year and real data, or an honest "preview".
8. **Settings**: export/import settings, version, legal/privacy, sign-out.
9. **Global**: offline indicator exists; add "last updated" on every live surface.
10. **Accessibility**: a skip link exists; add landmark labels and a focus-visible ring audit across styles.

---

## 7. Animation and motion

**Tokens:** `--t-press 120ms`, `--t-hover 240ms`, `--t-spring 320ms`; `[data-motion='reduced']` zeroes all three (tokens.css:379–406) and also disables the spinner, skeleton sheen, dock motion and view transitions.

**What is right**
- No `transition: all` anywhere in `src/styles`.
- Animations are limited to: offline bar (220 ms), style fade (320 ms), spinner (900 ms linear), skeleton breathe (2.6 s) and sheen (1.9 s), sheet spring (320 ms), toast spring.
- `startViewTransition` is used for theme changes and is skipped when `reduceMotion` is on (`AppState.tsx:635–661`).
- Reduced motion is a user setting **and** an OS preference (base.css:1704).

**What is wrong**
- **A1 · P2: three fades compete on a theme change.** The view transition crossfades the root for 320 ms, the incoming style runs `style-fade-in` for 320 ms (base.css:1692), and surfaces carry a **900 ms** background/colour transition (components.css:10371). The result is a slow, muddy ~1 s repaint on surfaces while text snaps.
  *Fix:* remove the 900 ms transition from themed surfaces (or cut to 240 ms), and keep one mechanism: either the view transition or the style fade, not both.
- **A2 · P2: two unrelated long transitions remain**: 520 ms (components.css:7826) and 900 ms (10371). Both are colour-only, so they do not cause layout jank, but they break the 120/240/320 rhythm.
- **A3 · P2: the dock does not move; it re-mounts.** The active pill is drawn per item (`[aria-current='page']`), with `is-lifted/is-settling` classes for press, so switching tabs cross-fades two pills instead of sliding one. On a 3-item dock this reads as a flicker rather than motion.
  *Fix:* a single absolutely-positioned thumb translated with a transform transition (and `will-change: transform`), driven by the active index.
- **A4 · P2: skeletons breathe at 2.6 s** while the sheen passes every 1.9 s: two loops with different periods, so the shimmer never settles into a rhythm and can look like it stutters. Use one period (e.g. 1.8 s) for both, or drop the breathe.
- **Not verified frame-by-frame:** sheet spring easing, toast entrance, theme-tile selection, Wrapped segment fill and the timeline draw. Stills cannot prove easing quality; these need a screen recording in the browser. No claim is made that they are wrong.

---

## 8. Proposed fix order

### Phase 0: unbreak the journey flow (P0)
1. ~~Fix the home picker~~: **retracted, the picker was always correct** (F1).
2. ~~One planner~~: **done**: `/plan` submits to `/results` with the GTFS journeys, and the inline list is deleted (F6).
3. ~~Default the planner to today~~: **done** (F5).
4. ~~Board destinations and operator names~~: **done** (F32, F36); the `4000` badge is a real Sprinter and stays (F12).
5. ~~Distances and walking minutes~~: **done** (F31, F37).

### Phase 1: the worst visual offenders (P1)
6. Install banner: home only, after first search, bottom-anchored on mobile (G1).
7. Help FAB: dock on mobile, content-aware offset on desktop (G2).
8. Pastel chips and severity pills per appearance (G8, F46).
9. Settings preview: delay moves the arrival; hide blank mobile board; remove the dead accent legend (F58–F60).
10. Themes: remove the duplicate Sinterklaas, ring via box-shadow, raise the "In use" surface (F66–F68).
11. Map: label collision + crop/fit; station map too (F26, F38).
12. Journey: per-leg colour, delay applied to arrival, a right rail or next departures (F17–F19).
13. Sign-in: brand chrome, dev stub for `/api/passkey/status`, visible errors (F73–F76).
14. Wrapped: correct year, honest copy, entry point (F23, F24).

### Phase 2: polish and structure (P2)
15. Solid empty-state cards and visible page titles (G3, G4).
16. Mobile dock labels and a sliding thumb (G6, A3).
17. Date/time formatting in the planner (G7).
18. Footer everywhere, lowercase mail, version (G5, F65).
19. Station page hierarchy, orphan "min", clipped "Showing from…" (F39–F42).
20. Disruptions grouping, single details affordance (F47–F49).
21. Motion: one fade, one skeleton period (A1, A2, A4).
22. Preferences check glyphs, slider output, trade-off copy (F54–F57).
23. 404 copy, auth-finish state, developer guard message, skeleton lab gate (4.18–4.20).
24. Add to `ui-audit`: a filled-results fixture, a home-picker interaction check, a "no `Onbekend`, no bare route id" content check, and the `.stop-link` classification for inline station links.

---

## 9. Verification actually performed, and its limits

**Run today:** styles-audit (pass), ui-audit (3 findings), breakpoint-audit (pass), 64-cell route sweep (0 overflow, 0 broken images, 0 dead links, 0 unnamed buttons), 80-render style sweep (all styles applied, 0 low-contrast samples), interaction probes on six pages, targeted search/picker/theme flows, and 88 screenshots.

**Inspected by eye:** 35 route/state screenshots across both appearances and both widths, including every page in light desktop, every page in dark desktop (or its key states), and the complex pages at 390. The matrix in §2 marks what was measured only.

**Not inspected by eye:** dark-mobile cells for `/`, `/plan`, `/results`, `/journey`, `/stops`, `/stops/:id`, `/departures`, `/disruptions`, `/disruptions/:id`, `/preferences`, `/themes`, `/settings`, `/signin`, 404, and light/dark mobile for `/map`, `/wrapped`, `/developer`, `/auth/finish`. These were machine-checked for overflow, broken media, contrast and console errors, not judged for composition.

**Not verified at all:** animation easing frame-by-frame, screen-reader output, real device (iOS/Android) rendering, production Worker behaviour for `/api/passkey/*` and `/api/lookup/*`, install-prompt dismissal persistence, and the populated `/departures` board (no way to pin a stop was found before the flow broke).

No claim is made that the list above is exhaustive of pixel-level imperfections; it is exhaustive of everything found by the screenshots, measurements, code reading and interaction probes described here.

---

## 10. Phase 0: what actually changed

| Change | Where | Verified |
| --- | --- | --- |
| Planner opens on today; earlier days disabled and labelled | `src/pages/PlanPage.tsx` | `value=20261115`, `Sat 14 Nov` disabled, `Sun 15 Nov · today`, status `Timetable for Sun 15 Nov` |
| Results empty-state copy tells the truth | `src/pages/ResultsPage.tsx` | Copy reads "A saved search reopens here. New searches start in the planner." |
| Board destination words survive an unknown stop; operator spellings mapped; service name printed | `src/components/stops/BoardList.tsx`, `src/data/departures.ts` | Rows read `13:33 Rotterdam Centraal · Intercity · NS`; 0 × "Onbekend" |
| Terminating trips no longer shown as departing to their own station | `src/data/departures.ts` | Filtered on `row.d` before mapping |
| IP estimate accepted only inside the Benelux box, including cached fixes | `src/lib/approximateLocation.ts` | `/stops` shows no `8xxx km`, distance column absent |
| Walking minutes from real coordinates at 80 m/min | `src/data/stops.ts` | Domtoren 10 min (was 40) |
| Home picker finding retracted | this document | Re-tested with `#picker-from`: From fills, sheet advances to To |
| One planner: real journeys reach `/results` and open a journey | `PlanPage.tsx`, `ResultsPage.tsx`, `AppState.tsx`, `types.ts` | Search → `/results` with 2 real cards → journey page with timeline → reload keeps both |

**Also in Phase 0:** the one-planner merge (F6). A real search is converted to the app's `Journey` shape, kept for the tab, and drawn on `/results`; the journey page, its reload and the results reload were all exercised (two journeys: 13:38→14:07 and 13:41→14:18, Utrecht Centraal → Amsterdam Centraal).

**Known limit of the merge:** a real result lives in the tab that searched. Opening that `/results/<id>` address in another browser falls back to the demonstration engine, because the GTFS answer is not in the address. Making the link itself reproduce a real search is the next step (encode "real" in the search link and run the graph search on arrival).

## 11. Evidence index

- Screenshots: `artifacts/audit/` (88 files, named `<route>-<theme>-<viewport>.png`; extra states `results-data-*`, `journey-*`, `themes-allblack-dark-desktop.png`, `home-picker-after.png`, `results-unreadable-*`, `journey-missing-*`, `authfinish-*`, `skeleton-*`).
- Route sweep data: `.logs/audit-desktop.json`, `.logs/audit-mobile.json`.
- Style sweep: `.logs/all-styles.log`.
- Interaction probes: `.logs/interactions.log`, `.logs/theme-tiles.log`, `.logs/home-flow.log`, `.logs/home-flow2.log`, `.logs/journey2.log`.
- Existing gates: `scripts/styles-audit.mjs`, `scripts/ui-audit.mjs`, `scripts/breakpoint-audit.mjs`.
- Key source: `src/pages/PlanPage.tsx:156` (default day), `src/pages/ResultsPage.tsx` (empty state + search adoption), `src/pages/JourneyDetailPage.tsx` (restore logic), `src/pages/StopsPage.tsx:146–159` (distance sort), `src/widgets/registry.tsx` (home plan card), `src/components/journey/StopPicker.tsx` (picker sides), `src/App.tsx:122–157` (routes/guards), `src/styles/base.css:1686–1707` (view transition and reduced motion), `src/styles/components.css:10371` (900 ms surface fade).
