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

## The AUDIT-PLAN pass (2026-10-22)

`AUDIT-PLAN.md` carries **131 findings marked FAIL**. Audits find and do not fix, so that file is a
*pre-fix* record: most of these were closed in the rounds above (the shared `lib/useOverlay` for every
overlay's focus, trap, return and scroll lock; the shared 2px coral focus ring on `.input`,
`.select` and `.input-group`; the translation of every page's chrome). What follow are the ones that
were still open on 2026-10-22, how each was found, and what was measured after.

| # | What was still wrong | What changed | Measured after |
|---|---|---|---|
| **27.3** | The stop already answering the other end was refused in words and **kept**, so both rows named Utrecht Centraal, `Plan journey` appeared, and the results screen found nothing and blamed the walking limit | `StopPicker.choose()` refuses the pick itself and says why, the way the search form does | picking the other row's stop: rows stay `From Utrecht Centraal / To`, no plan bar, toast `Origin and destination must be different stops` |
| **27.4** | One Backspace in a field emptied the stop already chosen **behind the screen** | typing corrects the field only; the pick survives until another stop is chosen or the field's own × is pressed | after Backspace: `From Utrecht Centraal` still on the card |
| **28.2** | The map picker's zoom pair did nothing to a press: the surface captured the pointer on `pointerdown`, so the button never got its `click` | a press that starts on the zoom controls is left to them | real mouse press: viewBox `0 0 100 100` → `-15 -15 130 130` |
| **28.3** | The pin named one place and pointed 51–162px away: it was centred (`translate(-50%,-50%)`) so its 16px tail hung below the measured point | anchored by its tip (`translate(-50%,-100%)`) | pin tip `195,359` = surface centre `195,359` |
| **28.4** | From 768 the picker's canvas was capped at 500px inside a 630px surface (130px of dead ground), and the chosen stop's name was 7.7px on a phone and 36.8px on a desktop | the picker's canvas fills its surface; the label is sized in canvas units from the measured surface so it renders at 12px at any width and zoom | canvas `366×574` in surface `366×574`; label renders **12px** |
| **28.5** | The map picker's search field had no name (placeholder only), and a pick dropped the keyboard on `<body>` | `aria-label` on the field; a pick hands focus to the confirm control | field name `Search for a stop`; focus after a pick on `BUTTON "Select this stop"`, inside the screen |
| **32.1** | Suggestion lists painted **under** the cards that follow: a glass card is its own stacking context, so the list's `z-index: 30` could not leave it (on Departures at 320 none of four rows was on top) | the card holding an open list is lifted above its siblings (`.card:has(.suggestions)`) | 8 of 8 suggestion rows are the topmost thing at their own centre |
| **29.4** | One arrow press moved the photo sampler by one **source** pixel (sub-pixel on screen), so the keyboard appeared dead | a press moves one pixel of the picture as drawn, converted into canvas pixels | fixed in `PhotoScreen.step()` |
| **9.3** | The Dutch journey page kept English: `Arrive 16:15` and `Indicative single fare` | both keys added to the Dutch dictionary | NL journey text: `Aankomst 16:15`, `€2.90 Indicatief enkel ticket`; no English left |

**Verified:** `tsc` clean, `build` clean, `class-audit` **438**, `caps-audit` clean, `breakpoint-audit`
clean, `ui-audit` clean (0 contrast, 0 target, 0 clipped, 0 band, 0 top-edge), `consistency-audit`
exit 0, `render-check` all pages, the engine smoke. The pass's own instruments:
`.logs/audit-open-fixes.cjs` **16/16** and `.logs/journey-simplify-check.cjs` **19/19**.

**Still open, recorded rather than claimed:** the photo sampler's framing (29.2 the picture is capped
by its own pixels rather than the screen), its loupe leaving the stage at three edges (29.3) and its
empty-colour Done (29.6), the sampler's dead-end error state (29.9), the crop screen's saved-frame
chip (30.4) and its corrupt-image path (30.5), and the dock covering a control at first paint on
some sizes (2.3, 3.4, 4.2, 5.5, 6.3, 7.1, 8.1, 9.1, 10.6). The dock was measured again at
390×900 and 768×700: it covers one switch on Travel preferences and one alert card on Disruptions,
nothing on Departures or Stations. Hiding the bar whenever it covers something was implemented and
**withdrawn the same day** — it made the app's main navigation disappear on two screens at first
paint, which is a worse trade than a control the page can scroll to.

## The results screen, again — 22 Oct (density round)

The report was that the results page still read as overwhelming beside 9292's, with four specific
examples: the sort control on a line of its own, the alert banner, and the result card. Measured at
390×844 before and after, with a real Haarlem → Hoofddorp search on the live preview.

| # | What was still wrong | What changed | Measured after |
|---|---|---|---|
| **33.1** | The sort was a labelled field — "SORT BY" in small caps, then a bordered select the width of the page — on a row under the chips, so the phone opened with **three stacked bands of controls** before a journey | the sort is the fourth chip: its own text is the answer ("Best"), its label is the select's accessible name, and its chevron is two 5px gradients in `currentColor` so it turns over in dark | all four controls on **one 44px row**, 4 items at 390 and 360, `scrollWidth = clientWidth` (no sideways overflow) |
| **33.2** | The alert was a `hairline` banner: icon, the heading "Alerts affect this search", then the alert's title indented beneath — **96px, three quarters of it empty** | the alert's own title is the row, with the warning icon and a "+1" when there is more than one | **44px**, one line, still a 44px target and still the first thing above the list |
| **33.3** | A result card carried **five rows** — times + three pills, the service badges, a meta line of four items, then the occupancy on a second meta line — 250px for four facts | three rows: the times with the label and the heart, the services with the fare and the crowding on one line | **116px** per card (was ~250), no wrapping at 390 in en or nl; the operator name left the card for the journey page (it made the line wrap, and it does not help choose between two options) |
| **33.4** | The held place did not match the card it stood in for (four rows, `--s-2` gaps), so the list still jumped when the journeys arrived | the skeleton wears the card's own head/tags/meta and its gaps | skeleton **114px** vs card **116px** |

**Verified:** `tsc` clean, `build` clean, `class-audit` **447**, `caps-audit` clean,
`breakpoint-audit` clean, `render-check` all pages, `icon-audit` clean, `consistency-audit` exit 0,
`ui-audit` 0 contrast / 0 target / 0 header problems in light-en and dark-nl.

**Still open, recorded rather than claimed:** `ui-audit` reports **one** clipping at 320 on
`/settings` — `span.settings-row__value` holding "App default" at 70px inside a 68px box. It is a
`text-overflow: ellipsis` row on another screen and nothing in this round touches it; measured
directly on a settled page the same element is **67px in 67px**, so the 2px is the audit's own pass
landing before the web font swapped. Not fixed here, and not claimed as clean.

## The map's answer, and the loading skeleton — 22 Oct

| # | What was wrong | What changed | Measured after |
|---|---|---|---|
| **34.1** | Choosing a stop **on the map** returned to the picker on the end it had just answered: the From row held the stop, the caret was in it, and the screen still asked "Where are you leaving from?" — a stop picked from the list never did this | `SearchForm`'s map hand-over flips to the end that is still missing, the same way `StopPicker.choose` does; when the map supplied the second end, `pick` has already planned and closed the sheet | fresh planner → From on the map → dialog reads **"Where do you want to go?"**, `document.activeElement` is `picker-to`, From holds the picked stop, To is empty |
| **34.2** | The loading skeleton was three cards of thick moving slabs: the whole 26px of a time, 24px of each pill and 44px of the heart button filled with a gradient running across it continuously | the slot keeps its height, the ink is an **8px line** down the middle of it, and one narrow band of 110° stripes crosses the line and is gone by 72% of a 3.6s cycle | `::before` is 8px tall; `::after` is one 45%-wide striped band animating `skeleton-stripes 3.6s infinite`; the card still stands **114px** tall against the real card's 116, so the list does not jump |

**Verified:** `tsc` clean, `build` clean, `class-audit` 447, `caps-audit` clean, `breakpoint-audit`
clean, `render-check` all pages, `icon-audit` clean, `consistency-audit` exit 0, `ui-audit`
**0 contrast** problems in light-en and dark-nl (the pale line is not flagged). The one clipping
finding at 320 on `/settings` is the same pre-existing one recorded above, and still open.

## The When dialog's two controls — 22 Oct

| # | What was wrong | What changed | Measured after |
|---|---|---|---|
| **35.1** | "Depart at / Arrive by" stood **54px** tall beside a **44px** "Now" chip: a 44px thumb inside 4px of padding plus the capsule's own 1px ring — 10px taller, and the chosen half drew a *second* hairline 4px inside the capsule's, which is what made it look thicker as well as taller | the dialog uses the compact `Segmented` (`size="sm"`), which is now exactly `--target-min`: 38px thumb, 2px padding, 1px ring, and the chosen half is marked by its surface rather than by a border of its own. The 38px thumb's effective target is grown to 46 by an `::after`, the same trick `.tap-target` uses | capsule **44 × 181.2**, Now **44 × 87.1**, identical top and bottom (783 → 827) in light-en and dark-nl; the 44px probe hits each thumb from all four sides at 390 |

**Verified:** `tsc` clean, `build` clean, `class-audit` 447, `caps-audit` clean, `breakpoint-audit`
clean, `render-check` all pages, `icon-audit` clean, `consistency-audit` exit 0, `ui-audit` 0 contrast
and **0 target** problems in light-en and dark-nl. The one clipping finding at 320 on `/settings`
is the same pre-existing one, still open.

## The skeleton, third attempt — 22 Oct

| # | What was wrong | What changed | Measured after |
|---|---|---|---|
| **36.1** | The "thin lines" were not a skeleton: an 8px hairline drawn down the middle of a 26px or 44px slot, with a striped band on each bar — five pale dashes drifting in a card, aligned to nothing, and the stripes were more texture than shape | the bars fill their slots again — a skeleton is read as the *shape* of what is coming — but the fill is the hairline **mixed into the card's surface** (never the hairline itself, which is the grey slab the first version was), and the motion is one soft band crossing the whole card, clipped by it, one pass every 2.4s with most of the cycle still | bars **26 / 24 / 12** in their own rows, card **114px** against the real card's 116; fill `rgb(232, 229, 222)` light and `rgb(51, 48, 43)` dark; the band is `skeleton-sweep 2.4s` travelling from −55px to +400px across a 366px card |
| **36.2** | The held place for the heart was a 44px **disc**, which reads as an avatar on a card that has none | the bar in that slot is a rounded square, like the button it stands in for | same 44 × 44 slot, `border-radius: 8px` |

Both readings are tokens now (`--skeleton-fill`, `--skeleton-sweep`) because the light that reads on a
pale bar is not the light that reads on a dark one: 90% white in light, 10% in dark.

**Verified:** `tsc` clean, `build` clean, and the gate below (class-audit 447, caps, breakpoint, icon,
render all clean, consistency exit 0, `ui-audit` 0 contrast / 0 target). The one clipping finding at
320 on `/settings` is still the same pre-existing one.

## The results bar, corrected — 22 Oct

The report was that the sort "could easily fit on the same row **on wide displays**". It was built
as one row at *every* width, which is a phone row with four controls crushed into it. 33.1 above is
corrected here rather than rewritten: the sort becoming a chip is what stands, the single row is not.

| # | What was wrong | What changed | Measured after |
|---|---|---|---|
| **37.1** | Four controls on one 390px line, which is what "squashed" looked like | the sort and Options travel as one group, so a phone has two bands — the two search chips, then the sort and Options beneath them — and the merge to one row happens from **720** up, the breakpoint this app already calls desktop | 390: **2 bands**, items at their own widths (99 / 44 / 139 / 96); 430: 1 row, natural widths; 720 and 1440: **1 row**, same four widths; no sideways overflow at any of the four |

Nothing stretches now: the sort sits at its own 139px instead of filling the band, so it is the same
size of chip as the two beside it. `tsc` clean, `build` clean, gate green apart from the pre-existing
320 `/settings` clipping recorded above.

## Earlier and Later — 22 Oct

| # | What was asked | What was built | Measured |
|---|---|---|---|
| **38.1** | An **Earlier** button above the top result and a **Later** button under the last one, which page the *window* of departures without touching the search's "Leave at" | the two controls call the state's own `shiftWindow(±30)`, which the state has always clamped to ±240; they are full-width ghost rows with a chevron, so they read as the ends of the list rather than as another card. Position: alert row → **Earlier** → first card … last card → **Later** | alert at **391**, Earlier **459**, first card **527**, last card **1119**, Later **1259**; chip still reads **"Leave: Now"** after every press |
| **38.2** | — | the labels are translated (`Eerder` / `Later`) and the disabled state is the state's own limit, not a dead press | 8 presses of Earlier: 18:45 → **17:15** → **15:45** → **14:45**, then disabled; 8 of Later: 20:15 → 21:45 → 22:45, then disabled; the list keeps five cards at both ends |

Both directions were pressed in the browser at 390 and 1440, in light-en and dark-nl. `tsc` clean,
`build` clean, class-audit 448, caps, breakpoint, icon, render and consistency all clean, `ui-audit`
0 contrast / 0 target. The 320 `/settings` clipping is the same pre-existing finding.

## A typo in the From field — 22 Oct

Reported with `Rijkss` typed into the full-screen From picker and "No stops match" under it, although
the panel's own line promises "station, stop, street address or landmark".

| # | What was wrong | What changed | Measured after |
|---|---|---|---|
| **39.1** | `rankStops` compared substrings only, so one extra letter at the end of a word ended the search — the exact state a field is in while it is being typed into | when nothing matches as written, the same search runs once more allowing **one typo** (two from eight letters on): a letter added, dropped or typed as its neighbour, whole-word or on the beginning of a word. The pass is last, never a competitor to the query that was typed, and a query under four letters is not corrected at all | `Rijkss` → **Rijksmuseum**; `Rijksmusem` → **Rijksmuseum**; `Amsterdm` → 8 Amsterdam stops, Centraal first; `Utrech Centraal` → **Utrecht Centraal**; `zzzzzz` still says no stops match; `ri` still returns what contains "ri" |

Both callers learn it at once (`StopCombobox` on the board, `StopPicker`, and the map picker), because
there is one search: `Rijkss` in the board's field is filtered by that field's own rule (a board needs
a stop that can be boarded, and `Rijksmuseum` is a landmark), while `Amsterdm` there returns the same
seven stations.

`tsc` clean, `build` clean, `render-check` all pages, and `.logs/typo-probe.cjs` (the eight queries
above, read out of the running app at 390) plus `.logs/typo-combobox.cjs` for the inline field.

## The address row's second line — 22 Oct

Sent back as "Unnecessary…" with the grey line under each address suggestion circled.

| # | What was there | What changed | Measured after |
|---|---|---|---|
| **39.2** | `Address · 320 m from Amsterdam, Museumplein` under every address row — one line saying that a place is a place (the teardrop already says it), repeating the town the row's own name carries, and offering the walk to the stop as something to weigh while choosing an end | the line is gone; an address row is its name and the teardrop, on the same 64px row as everything else. The distance still travels with the pick (`accessMetres`), which is what the journey needs it for | `Rijks` → three rows, each **64px**: `Rijksmuseum / Amsterdam · ARM · Landmark`, `Museumstraat 2, Amsterdam`, `Rijksweg, Helvoirt`; choosing `Museumstraat 2` fills From, opens To, and the walk distance is still on the pick |

The dictionary entry that line used is removed with it. `tsc` clean, `build` clean, `render-check`
all pages, `i18n-scan` unchanged (the same three known literals and five known keys), and
`.logs/address-row.cjs` for the measurement above.

## The board's pin, put back — 22 Oct

| # | What I broke | What changed | Measured after |
|---|---|---|---|
| **40.1** | The pin on each board card was replaced by a bare minus in the round that applied "no pin button anywhere except the departure boards tab" — read as "this card does not need one", which took the pin off the **one** screen the rule was keeping it for | the pin is the card's trailing control again: `pin`, filled and `aria-pressed` while the board is here, labelled **Unpin {stop} from the departure board**, and pressing it is what takes the board off the page. The minus glyph and its dictionary entry are gone | two boards pinned → two pins, both `aria-pressed="true"`; pressing the first leaves **1 stop pinned to the board** and the second card; `board-stops` loses only that id. The stop page still has **no** pin control, which is what the rule asked for |

`tsc` clean, `build` clean, `render-check` all pages, `.logs/board-pin3.cjs` for the readings above.

## The button beside the list's name — 22 Oct

| # | What was there | What changed | Measured after |
|---|---|---|---|
| **41.1** | A `Departure boards` button in the Stations & stops head — a second way to a screen the navigation, the dock and every stop card's *Board* row already offer, drawn where the eye looks for the page's own name (sent back crossed out) | the head is the name and nothing else; the `actions` slot is empty on `/stops` | head links **0**, head text `Stations & stops` at **21px**, first card at **141**; the board is still one tap away — dock `Boards`, sidebar `Departure boards`, and each card's `Board` — and `/departures` renders its own name unchanged |

`tsc` clean, `build` clean, `render-check` all pages, `.logs/stops-head2.cjs` for the readings above.

## The refresh, into the bar's corner — 22 Oct

| # | Where it was | What changed | Measured after |
|---|---|---|---|
| **42.1** | One refresh glyph inside every board card, at the end of the sentence "auto-refresh every 5s" (plus its own copy on the line board) — so three boards carried three copies of one page-level action, and the corner every other screen keeps its own control in stood empty | the screen registers **one** refresh with the shell (`useHeaderControl`), which draws it in the start corner of the bar — the place the way back occupies on every other screen — in the arrow's own 44px disc (`HeaderButton`, sharing `BACK_ARROW`). The in-card glyphs are gone, and the sentences stay | corner control `Refresh departures`, **44 × 44 at (12, 20)**, one per screen; **0** refresh buttons inside `main` on the boards page and on the line board; a press changes the board (the delay line and rows change); a stop page still shows its **Back** arrow, so a page control never displaces the navigation |

`tsc` clean, `build` clean, `render-check` all pages, and `.logs/refresh-slot2.cjs` / `.logs/refresh-line.cjs`
for the readings above.

## The header paints nothing again — 22 Oct

| # | What I had put there | What changed | Measured after |
|---|---|---|---|
| **43.1** | A canvas fade behind the sticky header (`::before`, switched on by a `data-scrolled` flag the shell set after 4px of scrolling, made of frost over a photograph) — a compromise for the card travelling under the mark, and a band across the top of the screen, which is exactly what the header is not allowed to be | the paint is gone: no `::before`, no `data-scrolled`, no frost, no state or scroll listener in the shell. The row is clear at every scroll position and over every background, as it was asked to be | computed header at the top, at **600px** of scroll, and with `data-background="photo"`: `background rgba(0,0,0,0)`, `background-image none`, `::before content none`, `backdrop-filter none`, no `data-scrolled` attribute — the cards and their `BOARD · PLAN` rows pass under the mark untouched |

The trade-off is the one that produced the fade: content does travel under the mark and the alerts
badge now, because nothing is behind them. That is the clear header that was asked for, and the
choice is recorded here rather than silently re-made.

`tsc` clean, `build` clean, `render-check` all pages, and `.logs/header-clear.cjs` /
`.logs/header-scroll2.cjs` for the readings above.

## No price on a journey that costs nothing — 22 Oct

| # | What was drawn | What changed | Measured after |
|---|---|---|---|
| **44.1** | A ticket glyph and `€0.00` after `Walking only` on the result card, and the same fare pill on the journey's own page — a price tag for a walk, the one number that can only be zero (sent back with that line circled) | both lines are drawn only when the fare is above zero; a free journey says how you travel and nothing about money | the walk `Amsterdam, Museumplein → Rijksmuseum` card reads **`08:00 → 08:01 · 1 min · Fastest · Walking only`** with **no `€`** anywhere on the card, and its journey page's facts read `Walking only · 1 min · Direct · 1 leg · 1 min walking · Expected quiet · Bicycle allowed` — no `€`. Paid journeys are untouched: `€2.30` on the tram card and `€2.30 · Indicative single fare` on its page |

`tsc` clean, `build` clean, `render-check` all pages, and `.logs/fare-zero2.cjs` / `.logs/fare-zero3.cjs`
for the readings above. The home screen's "what it costs" widget still prints the fare of the cheapest
journey it finds; that one is a price display by definition and was left alone.

## The alert's way back asks the history — 22 Oct

| # | What it did | What changed | Measured after |
|---|---|---|---|
| **45.1** | An alert's page had a **fixed** back link to `/disruptions`, so the arrow went to the alerts list whatever door you came through — reported as results → warning → back, and back landing on Disruptions instead of the search | the alert page asks the history like every other detail screen (`HistoryBackButton fallback="/disruptions"`), so the arrow returns to the screen the alert was opened from; the alerts list is only the fallback for a pasted link. Its name is **Back**, because "All alerts" promised a destination it no longer always goes to. `BackButton` — the fixed-link variant, whose only user this was — is deleted | results → `d-signal-utrecht` → back: **`/#/results`**; alerts list → `d-cancel-schiphol` → back: **`/#/disruptions`**; a pasted alert link in a fresh tab → back: **`/#/disruptions`**, arrow named `Back` in all three |

`tsc` clean, `build` clean, `render-check` all pages, `.logs/alert-back.cjs` for the three paths.

## The suggestion list, out of the header and whole — 22 Oct

| # | What was wrong | What changed | Measured after |
|---|---|---|---|
| **46.1** | With a phone keyboard up, the inline stop field's list hung **upward through the sticky header**: the bar's own stacking order is above the list's, so the rows ran under the mark, the Edit pill and the alerts badge. Its height was the exact pixels of room, so the last row was cut across its second line and the first at the top — a panel that reads as broken though it scrolls (sent back with that screenshot) | the room above is measured from the **bar's bottom edge**, not the viewport's top, so the list never enters the band it would be drawn behind; and the cap is a **whole number of the rows this list draws** (the row height is measured, since a long name makes it taller) plus the panel's own 18px of padding and borders — no half rows at either end | 390×430 (keyboard): list **below** the field, top 253 against input bottom 249, height 130 = **2 whole rows**, bar bottom 76 untouched. 390×520: list **above**, top 129 against bar bottom 76, height 242 = **4 whole rows**. 390×844: below, 354 = **6 whole rows**. No overlap with the field at any of the three (−4px gap) |

`tsc` clean, `build` clean, `render-check` all pages, `.logs/combobox-up.cjs` for the three readings.

## The bottom navigation stays — 22 Oct

| # | What it did | What changed | Measured after |
|---|---|---|---|
| **47.1** | The dock slid out of the way on a downward scroll and came back on an upward one (the fix for it sitting over a result's controls), so the navigation moved under the thumb and was missing on exactly the long screens that want it | the hide is gone: no scroll listener, no `app-dock--yielded` class or rule, no slide transition. The bar is fixed in place at every scroll position, and the page still reserves its band (`.app-body` bottom padding is `--dock-h`), so nothing is buried under it | dock at **top 778 / bottom 832** of an 844 viewport at the top of the page, after scrolling **1108px** down, and after a scroll back up — `opacity 1`, `pointer-events auto`, no modifier class. At the end of `/stops`, `/disruptions` and `/departures` the last content ends at 756 / 573 / 756 against the dock's 778: clear of it by 22px or more |

`tsc` clean, `build` clean, `render-check` all pages, `.logs/dock-always.cjs` and `.logs/dock-clear.cjs`
for the readings above.

## The hold hint on one line — 22 Oct

| # | What it looked like | What changed | Measured after |
|---|---|---|---|
| **48.1** | The "Keep holding to customise" pill broke after three words, with the grid glyph stranded beside two lines of text and the capsule stopping dead at half the screen — a fixed box centred with `left: 50%` and no `right` is sized against the room from that offset to the edge, which is 50vw (sent back as "Looks weird…") | the pill asks for its sentence's own width (`width: max-content`) and keeps `max-width` as the guard, so it is one line on every phone and only wraps if a translation genuinely exceeds the screen | English at 390: pill **200 × 32**, text **153px on one line**; Dutch at 390: **240 × 32**, one line; Dutch at **320**: **240 × 32**, one line inside a 288px allowance — and it sits clear above the dock at every width |

`tsc` clean, `build` clean, `render-check` all pages, `.logs/hold-hint.cjs` and `.logs/hold-debug.cjs`
for the readings.

## The dock's coral tab settles back down — 22 Oct

| # | What it looked like | What changed | Measured after |
|---|---|---|---|
| **49.1** | The coral disc marking the current dock tab stayed **up** — 4px above its seat and 2% larger, poking out of the bar's top edge — for as long as the screen was open, and it came back only when something else was touched. It was the `:hover` lift: a phone has no hover, but the browser applies `:hover` on a tap and keeps it on the element until the next touch (sent back as the coral thing "should go back down after 0.4 second instead of on-tap", then "turn that 0.4 into 1.5", then "change that 1.5 to 1") | the hover lift is behind `@media (hover: hover) and (pointer: fine)`, so a finger can never leave it stuck on, and the tab now lifts **deliberately** for **1s** (`.app-dock__item.is-lifted`, put on by `MobileDock` on `pointerdown` and cleared by a timer that is also cleared on unmount): the press is answered with the same little jump, and the disc is back in its seat a second later whether or not anything else is touched. Declared before `:active`, so a finger still down shows the press and the lift begins when it comes off; the existing motion tokens flatten it all under reduced motion | at rest the transform is **`none`** on every tab; after a tap the pressed tab reads `matrix(1.02, …, -4)` and is **still lifted at 0.9s**, then **`none`** at **1.4s** with the coral `rgb(255, 126, 103)` still on the current tab and the bar unshaken at **y 778**; the menu tab lifts and settles the same way and its sheet still opens |

| **49.2** | The way **down** had no motion at all: taking the lift off handed the transform back to the item's press transition — 120ms on a curve that starts at full speed — so the disc snapped back (sent back as "it doesnt move down smoothly, it moves down… Ugly, 0 animation") | the lift now ends in a **`settling` phase of its own**: `MobileDock` swaps `is-lifted` for `is-settling` at the 1s mark, and that class carries `transform var(--t-spring) var(--ease-out)` — 320ms, easing out of the lift — before the class is cleared, so the tab glides to its seat instead of falling into it. `--t-spring` is the motion switch's own token, so reduced motion and the off power mode still come straight down | sampled every 40ms through the settle: **-4.00 → -1.72 → -0.88 → -0.29 → -0.13 → -0.03 → -0.01 → 0.00**, computed transition `transform 0.32s cubic-bezier(0.22, 1, 0.36, 1)`, and the tab ends at rest with no class on it |

`tsc` clean, `build` clean, class-audit **447** clean, `.logs/dock-settle.cjs` and
`.logs/dock-settle-glide.cjs` for the readings.

## The traveller's canvas, in the overlays — 23 Oct

Sent back with two screenshots circled: the From/To card sitting as a cream lozenge inside a glass
plan card, and "Where are you leaving from?" drawn on flat cream with no sign of the photograph the
traveller had chosen — *"Pull the background and the colour to MORE places, like here."*

| # | What it looked like | What changed | Measured after |
|---|---|---|---|
| **50.1** | The two full-screen pickers were painted `--l0-bg`, so the one place the app stopped being the traveller's was the place they were looking at: a photograph behind the home screen became flat cream the moment a stop field was opened, and a page colour became the theme's canvas | `.fullscreen` now carries the same two canvas declarations `<body>` does — the page colour in colour mode, and the photograph under the canvas wash in photo mode, with the crop's own centre and `background-attachment: fixed` so the picture stays still while the picker's list scrolls over it, exactly as it does behind a page | photo + glass at 390: `.fullscreen` computes `linear-gradient(wash), url("data:image/jpeg…")`, attachment **fixed, fixed**; colour mode: **rgb(207, 224, 255)** — the page's own colour, not the cream |
| **50.2** | The From/To card (`--l1-bg`) was never repainted by the glass rules, which only knew `.card` and `.panel`: inside the home plan card it was the cream lozenge in the screenshot, and in the picker it would have been the same lozenge on the photograph. On a page whose widgets had a colour of their own it kept the *page's* tier, so the picker's only form was the one thing that did not take the traveller's colour | the card takes the glass recipe where cards are glass — 58% canvas, blurred and saturated, both edges, 74% where it is a pane inside a glass card, the heavier smoke fill in dark — and it is now part of the widget-colour groups (`cards`, `split`, `tint`), so it is a card wherever it is drawn. The coral invalid edge still outranks the glass hairline | glass: card **`color(… 0.98 … / 0.58)`** with **`blur(26px) saturate(1.7)`**, and **0.74** inside the plan card; dark: **/ 0.70** with ink **rgb(222, 220, 214)**; page colour + widgets colour: picker card **rgb(60, 111, 188)** — identical to the home plan card's |

`tsc` clean, `build` clean, class-audit **448** clean, `.logs/canvas-picker.cjs`,
`.logs/colour-screen-canvas.cjs` and `.logs/canvas-picker-photo-dark.png` for the readings.
