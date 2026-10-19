# What I changed — the nine items, in one line each

**Status, 2026-10-18:** all nine are still in the code. The *Going back* section at the end is the
only part of this file that is still operational; the rest is the record of that round.

All nine are done, plus the page names (item A). Nothing else was touched: no data, no routing, no
preferences, no behaviour beyond what each line says.

| # | Screen | What changed |
|---|---|---|
| 1 | Alerts list | The four number tiles are gone and the count moved into the `Filters · 14 alerts` line. Only Search, Sort and an Options chip are visible; Type, Severity, Transport mode, affected stop and pinned-only live inside Options. Each alert card ends in one button (`Alert details & advice`), not two. |
| 2 | Station page | The four tiles are gone. `Plan from here` / `Plan to here` are replaced by one small **Plan** button in the head that opens the same two-choice dialog the stop cards use. The accessibility pills are now a row of the Stop information table, not a block of their own. |
| 3 | Place page (address) | No tiles, and no step-free or lift claim: that is a boarding fact and a walking landmark has no boarding. |
| 4 | Travel preferences | The three tiles under the preview pills are gone (the pills are the summary). With no search, the big dashed box is one sentence. `Reset to defaults` moved to the foot of the list; `Apply and view results` is gone — the head keeps one link, to the planner or to your results. |
| 5 | Journey detail | The four tiles are gone; duration, transfers and the walk are rows of the Journey summary instead. One way back at the head; `Plan return journey` became one of the journey's own actions; occupancy is the words alone, no bar. |
| 6 | Alert page | The four tiles are gone. Severity is a chip on the title line, the window is a pill in the card, and the stop/service counts are the card headings — `Affected stops (4)`. `All alerts` stays at the head; Previous/Next are a pager under the alert. |
| 7 | Settings | The `About OVVO` number block is gone; one line at the foot says `Prototype · sample data · React, TypeScript and Vite.` One browse link instead of two, the install hint moved out of the way of the danger button, and `Remove all stored data` stands alone. |
| 8 | Journey results | `7 of 7 shown` only appears when it is not all of them. The alerts banner sits below the first journey instead of above it. `Earlier options` / `Later options` moved into the day-and-time dialog the `Leave:` chip opens. |
| 9 | Home | `Customise home` moved from the very bottom of the page to the head, at the top. The `Network at a glance` stats widget is out of the catalogue. |
| A | Six screens | The alerts list, an alert's page, journey results, journey detail, travel preferences and not-found now draw their own name as a line at the top. Home, Stations & stops, Departure boards and Settings keep theirs off screen — the navigation already names those. |

Kept as they were: the departure board, the three empty screens, the map, the dock, the badges.

## Second batch (your follow-up list)

| Your request | What was done |
|---|---|
| Move `Customise home` back | It is at the foot of the home page again, under every widget, exactly where it was before the first round. The empty state's sentence says "at the foot of the page" again too. |
| `Affecting my pinned stops` out of Options | It sits on the visible row of the alerts list, beside the search, the sort and the Options chip. Options now holds Type, Severity, Transport mode and the affected-stop field — and `Reset filters`, which moved in with the filters it clears. |
| Delete two blocks from Settings | `Locally stored data` (the counts manifest) and the foot panel (build line, browse link, install hint) are both gone. **Kept:** the `Remove all stored data` button, on its own at the foot — it was reachable only from inside the manifest, so I did not delete the only way to clear your data without being asked. Say the word and it goes. |
| The alert cards are still overwhelming | A card is now: title, when it applies, one severity chip, one line of **what to do** (the advice, not the description), and one action. The type pill, the description, the mode badges, the operator pills and the stop chips are gone — the detail page has all of it. |
| Location sorting with IP failover on the alerts list | `Nearest` is a new sort option. It uses the app's existing origin rule — device fix first, approximate IP estimate when location was refused — and the closest alert is the one whose nearest affected stop is closest. When neither is available the option is not offered, and while it is in use the page says which answer it came from, the same honest line the stops list shows. |
| Drop `Filters · 14 alerts` | The line is gone; the list itself shows how many there are. |
| No background on `More` / `Plan` | Both are text-only on the station cards — no pill, no border — so they read as the two things you can do rather than as furniture. |
| Animate the `Options` chip | It now presses and lifts like every other control (`.btn`, `.chip`): the same hover lift and press scale, on the alerts list, on Stations & stops and on the results chips. |

## Third batch (your follow-up list)

| Your request | What was done |
|---|---|
| The little jump-up animation on the cards, both lists | `.card--interactive` — the class `Card` adds to any card given an `onClick` — now lifts like every other control: `translateY(-2px)` on the same `240ms cubic-bezier(0.34, 1.56, 0.64, 1)` curve the buttons and chips use (that overshoot is the jump), with the base `.card` spring carrying the return to rest and the existing press kept. One rule, so both lists move the same way — measured on the live app, not read out of the stylesheet. |
| Pressing an alert card opens the alert | The card is a way in, the way a stop card is: press anywhere on it and the alert's own page opens **full screen** — that is the page it was already going to, now reachable without aiming at the button. The button is still there and still says what it does, and both it and the title (now a real link) stop their clicks from reaching the card, so nothing navigates twice. |
| The stops list's scroll-to-load rule on the alerts list | Both lists now use one rule — `useLoadOnScroll` in `lib/loadBatch.ts` — so the alerts list opens on five rows, brings the next five on a scroll, and shows a real `Show 5 more` button that says the number it will add. Nothing arrives before a scroll, and the stops list's own copy of that logic is gone rather than duplicated. |
| The alerts page back in the menu | `Disruptions` is in the navigation again, in Travel information, in the hamburger menu and the desktop sidebar, carrying the same 14 the header shows. It keeps drawing its own name on screen as well — a menu entry is a way in, and a list with filters over it still has to say what it is. |
| “What's even useful about this thing?” (the panel at the foot) | Honest answer: **two of its three bullets were the app describing itself** (“Alerts are applied to your journeys”, “Departure boards mark the affected services”) — not one fact about these fourteen alerts — and the button re-ran the search it had just run, so nothing visible changed. It now answers the question a list of fourteen alerts actually raises: **`3 of these 14 alerts touch your journey`**, by the same rule the results screen applies to its alerts banner (a stop at either end of the search you have planned). With no search the panel is not drawn at all. `Back to results` and the re-run button are both still there — but they are also the same journey to the same screen, so one of them can go if you want it gone. |

## Fourth batch (your follow-up list)

| Your request | What was done |
|---|---|
| The stop panel (`Where are you leaving from?` / `Where do you want to go?`), in four parts and in this order: 1 use my current location, 2 choose on the map, 3 pinned locations, 4 closest locations | The four are now four **sections** with their own headings, in that order, and they are the whole panel until something is typed: `Use my current location` and `Choose on the map` are the two rows that are not searches, then **`Pinned stops`**, then **`Closest stops`**. The two places are not yet labelled before this change: the familiar station shortlist sat in one undifferentiated `Suggestions` list with the pins at its top, which is why item 3 looked present and item 4 was missing. |
| Closest locations, according to location, with IP failover | `Closest stops` measures from `nearestOrigin` — the app's one rule for "nearest me", which every other screen already uses: **the device's own fix wins, and the approximate IP estimate is the failover**. Each row says how far it is (`Hoofddorp · HDD · 11 km`) instead of what kind of stop it is, because the distance is the fact that put it in the list, and the line under the list names which answer was used (`From your device location.` / `From an approximate IP location — it can be off by a lot.`) — an IP estimate is never presented as a device fix. |
| Only the top 10, and only before typing | `CLOSEST_LIMIT = 10`; the list is the ten nearest, and a stop already shown in the pins above is left out of it (one row twice in one panel is noise). Typing replaces all four sections with the search results exactly as before — same `rankStops`, same rows, same order — verified against the pre-change output for the query "rot": five Rotterdam matches, no sections. |
| — (found while doing it) | With no position at all — device refused *and* both IP providers blocked — the fourth section would have been empty. It is `Popular stops` with the familiar six big stations, and one honest line: `Turn on location to see what is closest.` While the IP estimate is still in flight the section waits (`approximateLocationPending`, new in the app state) rather than showing that fallback and swapping itself out half a second later. |

Measured on the live app in all four cases (`.logs/picker-sections.cjs`, screenshots in
`.logs/picker-panel-*.png`): a device fix at Haarlem gives Hoofddorp 11 km, Schiphol 12 km,
Amsterdam Sloterdijk 13 km… and says `From your device location.`; the same browser with no device
fix but the IP estimate at Amsterdam gives Amsterdam, Dam **370 m**, Anne Frank House **940 m**,
Amsterdam Centraal **1.0 km**… and says so; no position at all gives `Popular stops`; typing "rot"
gives the unchanged five Rotterdam results.

## Fifth batch (your follow-up list)

| Your request | What was done |
|---|---|
| Give the `MORE ALERTS` buttons a background — they should look like the other pills (the `PLAN TO HERE` one) | They are now the same pill as every other row-level action: the alert page's affected-service rows ended in a `btn--ghost` — no border, no fill — sitting on a row that already carries its own tint, so the label read as part of the row rather than as something to press. It is `btn btn--sm` now (a white surface with the hairline border), with the app's own alert glyph leading it, and the label is the same upper-case pill text every other control in that row style uses. Measured against the `PLAN TO HERE` pill in the same kind of row: **both 306×44, radius 9999px, border `1px rgb(232, 230, 223)`, fill `rgb(255, 255, 255)`, glyph 16px, and the four edge probes of the 44px target all answer** (`.logs/more-alerts-probe.cjs`, screenshot `.logs/more-alerts-after.png`). The alert glyph is a *marker* in nine other places and is now inside this one control; it stays a single-meaning glyph for the audit because "an alert" is what the triangle means in both — W3C COGA's one-glyph-one-meaning is about a glyph claiming two different things, not about the same thing appearing twice.

## Sixth batch (your follow-up list)

| Your request | What was done |
|---|---|
| The back button, the top of the OVVO logo and the disruptions button — all in the header, all at the same height, on all pages (and: the logo stays as it looked, the back button and the disruptions entry go back to their original sizes) | **The one thing that has to agree is where they start.** All three now begin at **top 20** — one line drawn above the row touches all of them; one drawn below it does not have to, because their heights are their own (the logo's 56px square, the arrow's 44px disc, the alerts entry's 36px pill: middles at 48, 42 and 38). Measured on every route at 320/390/768/1440 (`.logs/header-heights.cjs`, screenshots `.logs/header-*-*.png`). The cause was structural: nothing in that row *was* the line, so each item had its own private step — 8px on the way back, 16px on the mark, 4px on the alerts entry — which measured **top 12**, **top 20** and **top 8**. The fix is two values: both other items now take the mark's own 16px step, and **nothing else about either control changed** — the arrow keeps its 44px disc, the alerts entry keeps its 36px pill, its 8px padding and the `::after` patch that keeps its target at 44px, the logo keeps its 56px tile and 14px corner, and the row keeps its 80px height. **I got there the wrong way twice, and both are recorded because both were mine:** first I shrank the logo to 44px, then I grew the other two to 56px — neither was asked for, and the second also changed the size of the alerts entry's hover background. The logo is back to being not merely the same size but the same **pixels** — its own 56×56 square differs in **0 of 3136 pixels** from a capture taken before any of this work began (`.logs/r8-cancelled-en.png` at 07:09 against `.logs/header-after-1x.png`). **And it cannot drift again unseen:** `ui-audit` reads the three drawn boxes on every route and width and fails if their **tops** stop agreeing (their heights and bottoms differ on purpose; target size is measured separately, per control). Checked against the defect rather than only against the fix: with the old per-item steps planted back it reports **44 hits, 2 distinct, exit 1**; removed, **0 hits, exit 0** — and it caught a false positive in itself on the way, the empty 0px way-back wrapper on a page that has no way back. Verified on the final code: `tsc` clean, build clean, `render-check` 11/11, `class-audit` 331/331, `caps-audit` clean, `ui-audit` clean (0 contrast, 0 target, 0 clipped, 0 band, **0 top-edge**), and the consistency audit reads the page's arrow and the pickers' arrows as one shape again (`44x44 · r50%`), differing only by the bar they sit in. |
## Seventh batch (your follow-up list)

| Your request | What was done |
|---|---|
| The temporary magenta line (delete it with the next request, whatever it is) | **Deleted in full, first thing this round** — the `TEMP-LINE-START`/`TEMP-LINE-END` comment block and the `.app-header::before` rule it fenced, checked by grep: no `TEMP-LINE`, no `ff00aa`, no `.app-header::before` left in `src/styles/base.css`. Nothing else in that file was part of the instrument, and no other file carried any part of it. |
| "Open the full board" on the wrong side of the card | It was inside `.card-actions` — the group whose `margin-inline-start: auto` holds controls at the card's **trailing** edge, which is what the keep-a-stop pin needs and what a link that is the *way on* from a card does not. It now starts its own line, directly under the line that names the board. Measured at 390px: the pill's left edge is **29px**, exactly where the card's title starts, and the trailing control it was sitting next to (the pin) is untouched at the card's right edge (334→378 in a card ending at 378). The desktop card head on `/departures` still holds its "Stop page" link beside the pin — not reported, and the pin needs that edge; say the word and that link moves left too. |
| A back button on the "Stations & stops" full-screen menu, while so many pages miss one | Both halves of that are one missing rule, and the rule is: **the arrow belongs to a screen you opened *from* a tab, never to the tab itself.** Three screens had it (`/disruptions/:id`, `/journey/:id`, `/map`) and eight did not; my first pass gave it to every screen but Home, which put one on the four tabs, and that was corrected the same day. The tabs are exactly the entries the navigation names — Home, Stations & stops, Departure boards, Disruptions, Settings — matched exactly, so `/stops` is a tab and `/stops/haarlem` is a stop opened out of it. Measured in the browser: **five tabs with no arrow**, and **seven screens with one** — a stop's page, an alert's page ("All alerts"), journey results, a journey, travel preferences, the network map and the not-found screen — each at `top 20`, on the same line as the logo and the alerts entry. The full-screen **stop picker and map picker keep their own arrow**, because they are screens with their own bar rather than menus that dismiss (the dock's "All sections" sheet is the menu, and it closes with its ×), which is the same reason the app bar has one. Where each arrow goes is decided in `useHeaderBack` alone: an alert's page names its parent ("All alerts"), everything else asks the history first so it returns to the screen you came from, and falls back when there is nothing to ask — a stop page to the stops list, a journey to the results, the map to the results when a search exists, everything else to Home. |

## The leftover list from the consistency audit

Not a follow-up list of yours: this is *"what the audit still reports, and why it is left"* plus
its own limits, worked through. Three real defects, and four things that were wrong with the
instrument rather than the app — which is why `--gate` had never passed.

| # | What was wrong | What was done |
|---|---|---|
| 1 | The stop page's plan dialog asked one question with a **solid** `Plan from here` beside a **ghost** `Plan to here` | Both ends are the white bordered pill the departure board's own pair already used. Measured: both `44px · r9999px · 1px rgb(232, 230, 223) · fill rgb(255, 255, 255)` |
| 2 | The journey page's `Favourite` was the app's **only obsidian** Favourite, so the same control on this journey's own card was a white pill and here it was the loudest thing on the page (WCAG 3.2.4) | The same `.btn` in both places. Nothing on that page is *the* action — it is a journey you are reading, not a form you are filling in |
| 3 | `Customise home` wore `sliders` — the options/filters glyph — so the audit read *one* action with *two* glyphs (W3C COGA) | It draws `layout` now: the grid it arranges. Nothing else about it changed — still text-only, still at the foot, by request |
| 4 | The audit grouped by **verb**, so four "actions" were four functions: `dismiss` held five `×` controls *and* the destructive trash pill, `save something` held `Favourite` and `Keep this search`, `options` held the filter chip *and* the preferences link *and* `Customise home` *and* `Settings` | The rule list is 24 entries instead of 18. Those are separate actions — WCAG 3.2.4 is about the *same* function |
| 5 | A pill's **width** was read as part of its shape, so `Show 5 more` (132px) and `Show 1 more` (128px) were two shapes and one control was reported as three | The signature's first element is the **height**. Width is what the label says; the measured box is still on every instance in the JSON |
| 6 | A control past its landmark's own edge read `foot`, so a list growing by a row moved an action's signature while nothing moved | It reads `offscreen`. (Making a *scrolling* landmark unbanded was tried and thrown away: it made the same `Back to results` read `body` in one panel and `scroll` in another because only one of them overflowed — a difference in the content, not the design) |
| 7 | **`--gate` was red on purpose** and gated nothing | It fails on two things now: one action drawn with two glyphs in one state (mechanical, never exempt), and any difference that is not a decision on the record — the `DELIBERATE` map in the script, one entry per action with its reason, printed in the report. **11 differences at 390 and 10 at 320, all on the record, exit 0**; a second glyph planted on one `open the board` control gives `DRIFT: open the board (rest): board / refresh`, exit 1 |

**The four verdicts that are not defects** — `plan a journey`'s shapes (a page head, a card foot and a
dialog footer cannot be the same box, and the text-only `Plan` on a stop card is what you asked
for), `show on the map` against `show the network map` (a journey on the map and the map itself),
`Favourite` against `Keep this search` (a journey and a search), `Customise home` against `Options`
(arranging a screen and filtering a list) — are now four *actions* rather than four findings, and
what is left of each is a named entry in the register above, not a number nobody can act on.

Verified on the live app: `.logs/round16-audit-390.out` / `-320.out` (both exit 0),
`.logs/round16-check.cjs` **9/9** through the interface, `tsc` clean, `build` clean, `class-audit`
**332**, `icon-audit` clean, `render-check` 12/12, `caps-audit` clean, `ui-audit` clean in light/en
and dark/en, `fix-verify` **47/47**, `round5` **33/33**, `round8` clean.

## The checks

`tsc`, `npm run build`, `class-audit`, `render-check`, `icon-audit`, `caps-audit`, `ui-audit`
(light/en, dark/en, dark/nl), rounds 4–10, round 11, round 12, the empty-ring check, the acceptance
suite and the instruments from both earlier rounds all pass. Two old checks had to be **rewritten,
not relaxed**, in the first round, because they asserted the layout it scrapped: the stop page's
four tiles / two Plan buttons / Shortcuts panel, and the alerts list's `Board here` button. They
assert the new shape, and each round's own instrument measures it on the live app —
`.logs/fix-verify.cjs` (**47/47**) for the first two batches, `.logs/round11-check.cjs` (17/17) and
`.logs/round12-check.cjs` (27/27) for the two after them. One assertion inside `fix-verify` was
**adapted, not relaxed**, in round 12: it required the journey page's head control to read "back to
results" and now requires that one control to be the history's, labelled *Back*, and to lead back
to the list the journey was opened from.

## Going back

    bash /workspace/homes/d06ec682935a0dae4f349744/ov-restore-point/revert.sh --dry-run
    bash /workspace/homes/d06ec682935a0dae4f349744/ov-restore-point/revert.sh

That undoes the **second batch**, and the two after it land on the third as well — `pre-round2…`
is the last whole-tree snapshot taken before either. The third batch has its own six-file revert,
because no before-snapshot was taken when it started and it needed none:

    bash /workspace/homes/d06ec682935a0dae4f349744/ov-restore-point/revert-round3.sh --dry-run
    bash /workspace/homes/d06ec682935a0dae4f349744/ov-restore-point/revert-round3.sh

Its pre-batch contents live in `ov-restore-point/pre-round3/` and were rebuilt from the edits
themselves (`.logs/make-pre-round3.cjs`), so it restores exactly the six files this batch touched —
verified by byte comparison, by the batch's own names having gone from the source, and by `tsc`,
tested end to end on a copy before being handed over. To go all the way back:

    OV_ARCHIVE=/workspace/homes/d06ec682935a0dae4f349744/ov-restore-point/pre-fix-20261015-183624.tar.gz \
      bash /workspace/homes/d06ec682935a0dae4f349744/ov-restore-point/revert.sh

Neither touches Git (nothing was committed) and neither needs the app restarted.

The archive is `pre-fix-20261015-183624.tar.gz`: **1051 files**, sha256
`573bc8f6821c5eef6bef2800cf1e1d663874f063408bd373360e1de51b41e480`, taken and then verified by
extracting it into a scratch directory and byte-comparing the result against the live tree with
`diff -r` (clean). It holds everything except `node_modules/`, `dist/` and `.git/` — so it contains
this working tree exactly as it stood, including the untracked `.logs/` measurements and the planning
documents. `revert.sh` restores every archived file and removes the files the round added, working
from that file list rather than from a blanket "delete untracked files", because `.logs/` and the
planning documents are untracked *and* are part of the state being restored.
