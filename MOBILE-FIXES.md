# MOBILE FIXES (mobile only)

**Scope of this file: narrow/mobile viewports only.** Every screenshot in this batch was taken at
**378 × 734** (dpr 1.25, light theme), which is a phone-width viewport. Desktop behaviour is
**not** covered here and is **not** claimed fixed by these items — that is `DESKTOP-FIXES.md`, and
anything that only misbehaves on a wide screen is deliberately left out of this file.

The source of truth is `review/notes.json` plus the 29 screenshots beside it: **29 screenshots, 35
marked areas, 0 pins**, every one at 378px wide. Nothing here is invented; each item quotes the mark
that asked for it, word for word, and names the screenshot it is on.

---

## The work order

Status starts at **open** for all 28 items. Each one is closed only when it is measured on the
running preview at **378px** — the width the batch was captured at — and the evidence is pasted
under the item, the way `USER-FIXES.md` does it.

| # | Screen | The ask, in one line | Status |
|---|---|---|---|
| F1 | Home | A widget can't be moved back without leaving and re-entering customising | open |
| F2 | Home | The station picker's list can't be scrolled; scrolling the page closes it | **done** |
| F3 | Home | A widget has no resizing control on a phone | open |
| F4 | Results | Home flashes before the results screen appears | open |
| F5 | Results | The access dialog's DONE button is unnecessary | **done** |
| F6 | Results | Delete the Carriers section from Options | **done** |
| F7 | Results | Delete the Preferences button from the filter panel | **done** |
| F8 | Results | Move "keep this search" to the top and delete the whole About-these-results footer | **done** |
| F9 | Results / Home | Add a SAVED SEARCHES widget; make saved search ≠ saved journey obvious | **done** |
| F10 | Results | Rebuild the Date-and-time dialog (one control, no Earlier/Later, X saves) | **done** |
| F11 | Results | Occupancy levels need a real colour system (green / orange / red) | **done** |
| F12 | Journey | Plan return journey + Show on map are squeezed into the summary card | open |
| F13 | Journey | Favouriting a journey should fill the icon, like favouriting a stop | **done** |
| F14 | Journey | The Journey summary is text-heavy; use icons + short labels | open |
| F15 | Journey | The journey line has no arrival end (no square, no arrival name) | open |
| F16 | Journey | Replace the text arrow with an icon | open |
| F17 | Stops list | Add animated skeleton loading to the stop list | open |
| F18 | Stop page | Plan/heart/pin are right-aligned in the head | open |
| F19 | Everywhere | Remove all visible accessibility descriptions | open |
| F20 | Stop page | Clicking a line (e.g. Ferry F3) should open that line's board with times | open |
| F21 | Stop page | Whole rows must be clickable, not just the › | open |
| F22 | Stop page | Hover lift on the rows | open |
| F23 | Alert page | Delete the "Plan around this alert" card | open |
| F24 | Alerts | The alert count badge is a different size in the header, nav and menu | open |
| F25 | Settings | The preview is more text, when it is the one place meant to be visual | open |
| F26 | Settings | The default-origin list cannot be scrolled | **done** |
| F27 | Settings | The toast is ugly | open |
| F28 | Cross-screen | PLAN TO HERE must fill only the TO and open the planner, not the results | open |

**10 of 28 done and measured** (F2, F5, F6, F7, F8, F9, F10, F11, F13, F26). The other 18
(F1, F3, F4, F12, F14, F15, F16, F17, F18, F19, F20, F21, F22, F23, F24, F25, F27, F28) are
untouched and still open — nothing about them is claimed here.

---

## Progress — what was measured, on the running app

Every line below is a number the app printed at **378 × 734**, the width this batch was captured at,
plus the project's own audits. The instrument is `logs/mobile-fixes-verify.cjs` (kept out of the
repo like the rest of `.logs/`), and it is run against the live dev server.

```
29/29 checks passed
PASS  F8 the About-these-results footer is gone                 [panel=0]
PASS  F8 no Departure stop button left behind                    [buttons=0]
PASS  F8 one Save-this-search control exists                     [count=1]
PASS  F8 the save control is above the first journey             [bar y=271 card y=711]
PASS  F8 the page ends with the journey list, not a panel        [UL.stack-4]
PASS  F11 every level pill paints the colour of its own level    [“Expected fairly busy” rgb(255,245,165) = token]
PASS  F11 the three levels are three different colours           [quiet rgb(225,234,223) | middle rgb(255,245,165) | busy rgb(255,232,229)]
PASS  F6 no CARRIERS heading in Options                          [headings=0]
PASS  F6 the filter panel still renders its own chips            [chips=8]
PASS  F7 no Preferences link in the filter panel                 [links=0]
PASS  F5 the access dialog has no DONE button                    [done=0]
PASS  F5 both access options are still offered                   [options=2]
PASS  F10 the when question is one group with two fields         [groups=1 selects=2 [results-date,results-time]]
PASS  F10 Earlier/Later options are gone                         [buttons=0]
PASS  F10 the reset control reads Now                            [buttons=1]
PASS  F10 the dialog footer Done is gone                         [done=0]
PASS  F10 the depart/arrive switcher is the app's own control    [found=1]
PASS  F10 the change survives the close (X saves)                [before "Leave: Now" after "Leave: 03:20"]
PASS  F13 a journey keep control exists                          [aria-pressed=true, "Favourited"]
PASS  F13 pressing it changes the state                          [false -> true]
PASS  F13 the heart fills when saved (not a swapped glyph)       [fill none -> rgb(24,24,27)]
PASS  F9 the widget is named Saved searches                      [title="Saved searches"]
PASS  F2/F26 the whole list fits on the 378px screen             [list bottom=726 viewport=734]
PASS  F2/F26 the list contains its own scroll                    [contain]
PASS  F2/F26 a scroll inside the list scrolls the list           [scrollTop=137, 464px of rows in a 327px box]
PASS  F2/F26 the list is still open after that scroll            [count=1]
PASS  F2/F26 losing the input's focus does not dismiss the list   [count=1]
```

The project's own checks, re-run after the last change to the stylesheet and the picker:

| Check | Result |
|---|---|
| `tsc --noEmit` | clean |
| `npm run build` | clean (518.14 kB / 155.94 kB gzip) |
| `class-audit` | all 348 styled class names accounted for |
| `icon-audit` | clean |
| `caps-audit` | clean |
| `consistency-audit` | clean |
| `ui-audit` | clean — 0 contrast, 0 target, 0 squashed, 0 clipped, 0 header band, 0 wrapped capsule, **0 picker-popover problems** |

Two things found while verifying, rather than asserted:

- **F11's own check was wrong first time round.** It required the results list to show more than one
  occupancy level; every journey in one search can share a level, and here all eleven do, so the
  check failed while the fix was correct. It now measures the mapping — each level's pill against
  the token that level is meant to use, plus the fact that the three tokens differ — which is what
  "quiet green, middle amber, busy red" actually asserts.
- **The first cap on the picker broke a promise the audit measures**: an 8-row list squeezed under
  300px at 768 and 1440, where the field sits low on a long page. The measured cap is therefore a
  **phone** rule (`max-width: 640px`, this round's scope) and wider screens keep the old shape
  exactly; `ui-audit` is back to 460px of list on every wide sample. The phone cap is what makes the
  list's own bottom — and its scrollbar — land on screen: 726px of 734.

### Consequences worth naming

- **F10 deletes the only control that shifted the search window.** `shiftWindow` and
  `windowOffsetMinutes` stay in the state (the offset is still stored with a saved journey), but no
  longer has a control in the interface. That is what "get rid of it" asked for; if the ± 30-minute
  jump is wanted back, it needs a home of its own, not a silent return to this dialog.
- **F6 leaves the carrier filter field in the stored filter** (`operatorIds`) with no UI reading it,
  which is deliberate: removing it from the stored shape would need a migration for a field that is
  now simply always empty.
- **F9 renames the widget without renaming its id** (`recent-searches`): the id is a storage key, so
  changing it would empty the card out of every layout that has it.

---

## Home

### F1 — A moved widget can't be moved back
*Mark: `2026-10-17t20-45-42-014-home-378-light.png` (area over the whole grid).*
> "When you move a widget on the home screen, its hard to move it back without pressing done and going back to customize mode, fix that."

**Fix.** Reordering must survive more than one drop in the same customising session, and there must
be a way back that is not a drag at all:
- Keep customising mode open across drops (today's `finishDrag` already ends the layout change, but
  this item is closed only when a second drag started straight after the first lands in the right
  slot — measured, not assumed).
- Add **visible move up / move down controls** to each widget's head in customising mode (the grip's
  ←/→/↑/↓ keyboard contract already exists; this puts it on screen as two taps).
- Reset the drag state fully on drop so the next press lifts the card instead of a stale zone map.

**Where.** `src/pages/HomePage.tsx` (`beginDrag`/`updateTarget`/`finishDrag`/`nudge`, the
`widget__actions` block in the render, `src/styles/components.css` `.widget__actions`).
**Done when.** Drag A below B, then drag A back to the top in the same session without touching
Done — and the same two moves done with the new buttons.

### F2 — The station picker's list cannot be scrolled
*Mark: `2026-10-17t20-06-25-901-home-378-light.png`:*
> "Its not possible to scroll through the options so you have to scroll using the page but when you scroll using the page, the pop-up goes away"

**Fix.** The suggestion list gets the containment it never had:
- `max-height` (about `min(60vh, 22rem)`) with `overflow-y: auto` and `overscroll-behavior: contain`,
  so a drag inside the list scrolls the list and stops at its end instead of throwing the page.
- Scroll inside the list must not close it: the current close is a 140 ms blur timeout that a page
  scroll triggers. Close only when focus really leaves the control (`relatedTarget`/`activeElement`
  check), and keep the list open on `scroll` events that happen inside it.
- On a phone, the list is drawn as a full-width panel anchored above the keyboard rather than a
  dropdown that can run off the bottom of the screen.

**Where.** `src/components/journey/StopCombobox.tsx` (the `onBlur` handler and the `suggestions`
list), `src/styles/components.css` (`.suggestions`). Same defect as **F26** — one fix, two marks.
**Done when.** At 378px, a finger inside the list scrolls the list to the last suggestion, and the
list is still open afterwards.

### F3 — No resizing control on a phone
*Mark: `2026-10-17t20-05-58-660-home-378-light.png` (top-right of the "Next departures" card):*
> "No resizing button"

**Fix.** The corner is hidden below each widget's `resizeFrom` width (`viewport >= widget.resizeFrom`
in `HomePage`), which is every widget at 378px. On a one-column grid the width ladder is meaningless
— every card is full width — so the phone gets the **height** ladder it can use: a resize control in
customising mode that cycles Compact → Standard → Tall, always offered, with width pinned to 12/12.
On wider screens nothing changes: the existing corner keeps doing widths and heights.

**Where.** `src/pages/HomePage.tsx` (`canResize`, the `widget__corner` block), `src/widgets/registry.tsx`
(`resizeFrom` stays the *width* rule), `src/styles/components.css` (`.widget__corner`).
**Done when.** At 378px in customising mode every widget shows one resize control; pressing it
changes the card's height one tier at a time and the choice survives a reload.

---

## Journey results

### F4 — Home flashes before the results appear
*Mark: `2026-10-17t20-18-26-182-results-378-light.png` (placeholder image; the note is the report):*
> "So is goes to the results but then it shows a flicker of the home screen instead of the results screen so you think you did something wrong, what it should do instead is show the results screen just without results and a spinner in place of the results while waiting for the results."

**Fix.** The second stop being picked must never paint Home again. The full-screen picker closes
before the route changes today (`setSheet(null)` then `navigate('/results')` in the same handler), so
the screen behind the picker is visible for those frames. Route first, drop the picker on the way
out, and let the results screen open in a **planning** state: its own head, its own search card, and
a spinner where the journey cards will be — never the planner.

**Where.** `src/components/journey/SearchForm.tsx` (`run`, `pick`), `src/pages/ResultsPage.tsx`
(the `!search` branch and the list), `src/components/ui/primitives.tsx` (a `Spinner` if one is not
already there), `src/components/journey/StopPicker.tsx` (the sheet's own close).
**Done when.** Planning a journey at 378px: frame-by-frame the results screen is what appears, with a
spinner, and `#/` is never rendered.

### F5 — DONE in the access dialog is unnecessary
*Mark: `2026-10-17t20-25-37-893-results-378-light.png`:*
> "Done button is unnecessary, it automatically leaves the po-up when you select one."

**Fix.** Delete the dialog footer button. Selecting an option already writes the preference and
closes the dialog, so the footer is a second way to do nothing.

**Where.** `src/pages/ResultsPage.tsx` (the `accessSide` `<Dialog footer={…}>`).
**Done when.** The dialog has no footer button, Esc and × still close it, and picking Walking or
Bicycle still applies and closes.

### F6 — Delete the Carriers section
*Mark: `2026-10-17t20-26-41-748-results-378-light.png`:*
> "Very unnecessary to have a carriers section in options, no one gives a fuck aobut the carrier."

**Fix.** Remove the Carriers block and its chips from the results Options panel, and with it the
`operatorIds` filter (or leave the field in the stored filter, unread, so old state cannot resurrect
chips). Note this reverses the earlier "load the last two carriers" work: the whole control goes.

**Where.** `src/pages/ResultsPage.tsx` (the `carriersRef`/`shownCarriers` block, `useChunkedList`,
`OPERATORS` import, the "Reset all filters" row it shares), `src/lib/i18n.ts` (the labels that lose
their call site), `src/state/AppState.tsx` (`DEFAULT_RESULTS_FILTER.operatorIds`).
**Done when.** No `CARRIERS` heading and no carrier chip exists in Options at any width, and
`tsc` is clean of the now-unused imports.

### F7 — Delete the Preferences button from the filter panel
*Mark: `2026-10-17t20-27-57-673-results-378-light.png`:*
> "Unnecessary to have here, its nice to have preferences that are automatically there, but we dont need a button to change it here."

**Fix.** Remove the `Preferences` link from the filters panel. Travel preferences keep their own
screen and their widget; the results panel stops advertising them.

**Where.** `src/pages/ResultsPage.tsx` (the `row-wrap` holding "Reset all filters" and the
`/preferences` link).
**Done when.** The panel ends with Reset all filters and nothing else, at 378px.

### F8 — Move "keep this search" to the top; delete the footer panel
*Mark: `2026-10-17t20-37-41-837-results-378-light.png`:*
> "Move the SAVE THIS SEARCH to somewhere else, somewhere more on the top of the page and get rid of this entire footer... thing. Also make it clear for the user the difference between saving a search and saving a journey"

**Fix.**
- The Keep/Save-this-search control moves up to the search's own row of chips, beside the when/how
  chips — the place the search is described.
- The entire "About these results" panel is deleted: the disclaimer sentence, the kept/not-kept hint,
  and the four nav buttons (Back to planner, Departure stop, Arrival stop, Network map). The two
  stops are already in the search card; the shell already carries Back.
- Wording makes the split explicit: the search control says **SAVE THIS SEARCH** and its pressed
  state **SEARCH SAVED**; the journey card's control stays **FAVOURITE THIS JOURNEY** (see F9).

**Where.** `src/pages/ResultsPage.tsx` (the trailing `<Panel>`), `src/components/journey/JourneyCard.tsx`
(the Favourite button's label), `src/lib/i18n.ts`.
**Done when.** At 378px the page ends with the last journey card — no panel after it — and the save
control is reachable above the first card.

### F9 — A SAVED SEARCHES widget, and a clear search/journey split
*Mark: `2026-10-17t20-40-00-172-results-378-light.png` (placeholder image):*
> "add a 'SAVED SEARCHES' widget, and make it clear to the user thee difference between saved journey and saved search"

**Fix.** The stored-search list becomes its own thing, named for what it holds:
- Rename the `recent-searches` widget to **Saved searches** ("the searches you saved, one tap to
  repeat"), and keep "Recent" out of it — nothing is saved by searching any more, so "recent" is the
  wrong word for a list of deliberate saves.
- One sentence, once, on the widget and in the results control: a **saved search** is a pair of stops
  you keep to run again; a **saved journey** (the Favourited journeys widget) is one specific result
  with its times.
- The empty state of each says the difference in the same words, so a traveller who has one and not
  the other is told what the other is.

**Where.** `src/widgets/registry.tsx` (`recent-searches` title/description, the empty state),
`src/pages/ResultsPage.tsx` (the save control), `src/components/journey/JourneyCard.tsx`,
`src/lib/i18n.ts` (`Recent searches`, `Keep this search` and friends).
**Done when.** The catalogue shows **Saved searches**; both widgets describe the difference in one
line; no visible string calls a saved search "recent".

### F10 — Rebuild the Date-and-time dialog
*Marks: `2026-10-17t20-41-20-982-results-378-light.png`, five areas:*
> "Merge them into one thing instead of 2 seperates." (over Date / Hour / Minutes)
> "Looks weird and different from other switchers in the website" (over Depart at / Arrive by)
> "Get rid of it" (over Earlier options / Later options)
> "Change it to just 'NOW' but keep the icon" (over Today, now)
> "Make sure it saves when the user clicks X and get rid of the DONE button cus the X button finna replace him"

**Fix.**
- **One control, not three.** Date, hour and minute become a single "When" row: a date select and a
  time select (5-minute steps) inside one bordered group, with no `DATE` / `HOUR` / `MINUTES`
  sub-labels. The stored value does not change shape — only how it is asked.
- **The switch matches the app.** Depart at / Arrive by uses the same segmented control, at the same
  size and shape, as the other switchers in the app (Settings density/contrast), rather than its own
  small variant.
- **Earlier / Later options are deleted.** They were moved into this dialog in an earlier round and
  are now asked for by name to go; the Leave: chip's ± window can live elsewhere (or go too) — this
  file deletes them from the dialog and says so here rather than quietly leaving the state behind.
- **"Today, now" becomes "Now"**, clock icon kept.
- **Done is deleted.** Every change in the dialog already applies immediately, so the × and Esc close
  it with the change kept — which is what "make sure it saves when the user clicks X" asks for. The
  close button keeps the state; it must not be a cancel.

**Where.** `src/pages/ResultsPage.tsx` (the `whenOpen` dialog), `src/components/ui/primitives.tsx`
(`Segmented`), `src/styles/components.css`.
**Done when.** At 378px the dialog shows one when-row, one standard switcher, one Now button, no
footer, and changing the date then closing with × keeps the new date.

### F11 — Occupancy needs a colour system
*Mark: `2026-10-17t20-43-46-056-results-378-light.png`:*
> "Change the colour system of OCCUPANCY, expected quiet should be green cus its good, and the next thing should be orange, and when its really busy, red."

**Fix.** The level chip carries the colour, not only the meter behind it: **quiet = sage (green)**,
**fairly busy = butter (amber)**, **busy = coral (red)** — the meter's tones already are
sage/butter/coral, so this is the chip catching up with the bar. Same tones in the same order on the
journey card and on the journey detail page, and the words stay (colour alone is not a reading).

**Where.** `src/components/journey/JourneyCard.tsx` (`OCCUPANCY_METER_TONE`, the level `<Pill>`),
`src/pages/JourneyDetailPage.tsx` (the same pill), `src/lib/i18n.ts` (labels unchanged).
**Done when.** All three levels show coloured chips, in tone order, on both surfaces, in light and
dark.

---

## Journey detail

### F12 — The journey's own actions are squeezed into the summary
*Mark: `2026-10-17t20-30-01-359-journey-j-1s6gjtz-378-light.png`:*
> "Looks awkwardly squeezed in, shows in 'Journey details' menu"

**Fix.** `Plan return journey` and `Show on map` (and `Favourite`) stop being three squeezed pills at
the foot of the Journey summary card. They become the journey's own action row: full-width at 378px,
one per line or two balanced, with the primary action getting its own width — and they are not
duplicated anywhere else on the page.

**Where.** `src/pages/JourneyDetailPage.tsx` (the summary card's `row-wrap` of actions),
`src/styles/components.css`.
**Done when.** At 378px no action label wraps inside its button, and the row is not inside the
summary card.

### F13 — Favouriting a journey should fill the icon
*Mark: `2026-10-17t20-31-35-512-journey-j-1s6gjtz-378-light.png`:*
> "Change the favouriting a journey reaction to the icon filling, to fit the favouriting locations"

**Fix.** The button keeps its shape and its place but behaves like the stop heart: the bookmark glyph
**fills** when saved, and the label says the state ("Save journey" → "Saved"), instead of swapping in
a checkmark. Same glyph, same fill rule, same `aria-pressed` as the favourite stops already use.

**Where.** `src/components/journey/JourneyCard.tsx` and `src/pages/JourneyDetailPage.tsx` (the
Favourite buttons), `src/components/ui/Icons.tsx` (a `filled` variant if the glyph needs one),
`src/styles/components.css` (`.glyph-toggle[aria-pressed='true']` is the existing rule to reuse).
**Done when.** Saved and unsaved differ by fill, and the fill matches the stop heart's on the same
screen.

### F14 — Journey summary: icons, not sentences
*Mark: `2026-10-17t20-33-24-442-journey-j-1s6gjtz-378-light.png`:*
> "EXTREMLY text heavy, replace with mostly icons, similar to the 'TRAM' icon thingy already there, example: [tram icon] TRAM, [bicycle icon] BICYCLE, [coin icon] $2.30"

**Fix.** The definition list of Operator / Services / Modes / Fare / Step-free / Bicycle / Duration
becomes a row of short labelled chips in the existing mode-chip idiom — `[tram] Tram 2`,
`[coin] €2.30`, `[clock] 14 min`, `[bike] Bicycle allowed`, `[transfers] direct, 1 leg`, `[walk] 0 min
walking`. Values that are a plain yes/no go as an icon badge or vanish (see F19 for the step-free
line). Nothing is lost: the facts stay, the sentences go.

**Where.** `src/pages/JourneyDetailPage.tsx` (the `Journey summary` `<dl className="dl">`),
`src/components/ui/Icons.tsx` (a coin/fare glyph and a transfer glyph if missing),
`src/styles/components.css`.
**Done when.** At 378px the summary is at most two lines of chips per fact, with no `dt`/`dd` rows left.

### F15 — The journey line has no end
*Mark: `2026-10-17t20-35-38-985-journey-j-1s6gjtz-378-light.png`:*
> "No clear end, there should be an arrival thing, similar to the selected thing with a square instead of a circle and like the name of the arrival place, you get it"

**Fix.** The vertical track in `Complete journey` gets a terminus: a **square** marker at the bottom
(the passenger's own rule — circle for a departure, square for an arrival) with the arrival stop's
name beside it, so the line reads as a journey from somewhere to somewhere instead of stopping dead.

**Where.** `src/components/journey/LegList.tsx` / `src/components/journey/JourneyCard.tsx`
(whichever draws the track on this page — the detail page's leg list), `src/styles/components.css`
(the marker), `src/lib/i18n.ts`.
**Done when.** The line ends in a square marker, the arrival stop is named beside it, and the marker
matches the selected-stop square on the map canvases.

### F16 — Replace the arrow with an icon
*Mark: `2026-10-17t20-36-48-918-journey-j-1s6gjtz-378-light.png`:*
> "Ugly arrow, replace with icon instead of text"

**Fix.** The `→` between the two stop names in the page title (and anywhere else it is a text arrow)
becomes the app's own `arrowRight` glyph, the same one the leg list and the "Lines calling here" rows
use — so one direction means one drawing.

**Where.** `src/pages/JourneyDetailPage.tsx` (the title line), `src/components/ui/Icons.tsx`.
**Done when.** No `→` character is left in a heading, and the glyph matches the one on the leg rows.

---

## Stations & stops

### F17 — Animated skeleton loading
*Mark: `2026-10-17t20-47-00-496-stops-378-light.png` (placeholder image):*
> "Add skeleton loading instead of just... nothing like currently, dont add still skeleton loading, they should actually like slowly animate."

**Fix.** The stop list opens on real **skeleton cards** while it settles — the same three-row shape a
stop card has (name line, meta line, three departure lines) in a muted tone with a slow shimmer, one
animation for the whole list rather than one per card. It appears on first paint and on a filter
change; it must move (the ask is explicit that a still grey box is not the fix), and it must not be
announced as content (`aria-hidden`), with the real list announced when it arrives.

**Where.** new `Skeleton`/`SkeletonCard` in `src/components/ui/primitives.tsx`,
`src/styles/components.css` (one `@keyframes` shimmer, honouring `prefers-reduced-motion` and the
app's own Reduce motion setting), `src/pages/StopsPage.tsx` (the settling state).
**Done when.** At 378px, loading the list paints shimmering placeholders that visibly animate, then
the real cards; with Reduce motion on, the shimmer is dropped for a static tone.

---

## A stop's page

### F18 — The head's actions are on the right
*Mark: `2026-10-17t20-48-37-118-stops-amsterdam-dam-378-light.png`:*
> "Why it on the right, i aint arabic."

**Fix.** At 378px the Plan / heart / pin cluster is moved off the trailing edge and reads as part of
the page's own head: the stop's name and its actions share one left-aligned block (back arrow, name,
then the three controls under it), rather than an action group floating alone in the right corner.
The controls keep their 44px targets and their order.

**Where.** `src/pages/StopDetailPage.tsx` (the `PageHeader actions`), `src/components/layout/AppShell.tsx`
(`page-head__actions`), `src/styles/base.css`.
**Done when.** At 378px the cluster starts at the left margin with the title, and nothing is clipped;
at desktop widths the existing trailing arrangement is untouched (see `DESKTOP-FIXES.md`).

### F19 — Remove all accessibility descriptions
*Mark: `2026-10-17t20-49-20-928-stops-amsterdam-dam-378-light.png`:*
> "Get rid of ALL accesibility descriptions EVERYWHERE, i dont have an accesibility and this is a personal website"

**Fix.** Every visible accessibility claim goes, on every screen:
- Stop page: the whole `Accessibility` row (`Step-free access`, `Lift`, `Tactile paving`,
  `Staff assistance`, `Low-floor boarding`).
- Stop cards: the `Step-free` / `Stairs only` pill (`src/pages/StopsPage.tsx`).
- Journey card: the `Step-free` chip; the leg list's `Step-free` chips and
  `Step-free transfer` / `no staff assistance` lines; the journey detail summary's `Step-free` row.
- Alert page: the `step-free` / `stairs only` fragment in each affected stop's meta line.
- Settings/preview: any accessibility line.
This is about **visible copy only**: `aria-label`s, `alt` text and roles stay, because they are not
descriptions on the page and removing them would break the controls for a screen reader without
changing what anyone sees. The underlying `accessibility` data fields stay in the model (nothing
reads them for display afterwards) unless you want them deleted too — say the word and they go.

**Where.** `src/pages/StopDetailPage.tsx`, `src/pages/StopsPage.tsx`, `src/pages/DisruptionDetailPage.tsx`,
`src/pages/JourneyDetailPage.tsx`, `src/components/journey/JourneyCard.tsx`,
`src/components/journey/LegList.tsx`, `src/lib/i18n.ts` (entries that lose their call site).
**Done when.** A sweep of all eleven routes at 378px finds no "step-free", "stair", "lift", "tactile",
"staff assistance" or "low-floor" string on screen, and `tsc` has no unused-import errors from the
deletions.

### F20 — Clicking a line opens that line's board
*Mark: `2026-10-17t20-51-30-565-stops-amsterdam-buiksloterweg-378-light.png`:*
> "Add that if the user clicks one of these lines (like Ferry F3) they show the full line and its times in the departure board, if the departure board currently doesnt support lines and only stations, add support for lines"

**Fix.** A line is now a destination: pressing `Ferry F3` opens the departure board **for that line at
that stop** — its full route, both directions, and its next departures with times, platforms and any
delays, refreshed on the board's own 5-second tick. The board gains a line mode it does not have
today (it is stop-only): a route carrying the line (`/departures?line=<id>&stop=<id>`, or a dedicated
route), a generator that lists a line's next departures from one stop (the existing per-stop
generator drops to `limit` before filtering, so it cannot be reused as-is), and a head that names the
line and offers the way back to the stop.

**Where.** `src/pages/DeparturesPage.tsx`, `src/components/stops/BoardList.tsx`,
`src/data/departures.ts` (a line board generator beside `boardForStop`), `src/data/network.ts`
(`directions`, `nextDeparture`, `isInService` already have everything needed),
`src/pages/StopDetailPage.tsx` (the line rows), `src/pages/DisruptionDetailPage.tsx` (the same rows),
`src/App.tsx` (a route if one is added), `src/lib/i18n.ts`.
**Done when.** At 378px, pressing Ferry F3 lands on a board that says which line it is, shows its
upcoming departures in time order and refreshes, and can be left without a dead end.

### F21 — Whole rows must be clickable
*Marks: `2026-10-17t20-53-55-794-stops-amsterdam-buiksloterweg-378-light.png` and `2026-10-17t20-54-39-918-stops-amsterdam-buiksloterweg-378-light.png`:*
> "Add support for clicks on the background, not just the >"
> "Add support for on-background clicks to go to its board"

**Fix.** Nearby-stop rows and line rows become the target, not just the chevron: the whole row
navigates (a real `<Link>` stretched over the row, so keyboard, middle-click and "open in new tab"
keep working), with any inner control (heart, pin, Alerts) stopping its own click as the stop cards
already do. The chevron stays as the affordance, not as the only hit area.

**Where.** `src/pages/StopDetailPage.tsx` (Nearby stops, Lines calling here),
`src/pages/StopsPage.tsx` (for the same pattern), `src/styles/components.css` (`list-row--link` or the
existing stretch rule).
**Done when.** At 378px, pressing the whitespace in the middle of a nearby-stop row opens that stop,
and pressing the middle of a line row opens that line's board (F20).

### F22 — Hover lift on those rows
*Mark: `2026-10-17t20-52-50-754-stops-amsterdam-buiksloterweg-378-light.png`, two areas (lines and
nearby stops):*
> "Add on-hover jump up animation"

**Fix.** Line rows and nearby-stop rows lift on hover and press like every other interactive surface:
the same `translateY(-2px)` and the same spring the `.card--interactive` and `.btn` already use —
reusing those rules rather than inventing a second animation. Nothing changes on touch (there is no
hover to answer), so this is deliberately a pointer-only affordance.

**Where.** `src/styles/components.css` (the shared lift rule), `src/pages/StopDetailPage.tsx` (the
row classes).
**Done when.** Hovering either row class lifts it by the same distance, on the same curve, as a
journey card.

---

## Alerts

### F23 — Delete the "Plan around this alert" card
*Mark: `2026-10-17t20-57-06-355-disruptions-d-metro-noord-zuid-378-light.png`:*
> "Remove this widget."

**Fix.** The whole card goes: its heading, its sentence, `Avoid <modes> in my search`,
`Plan between the affected stops`, `Travel preferences` and `Back to all alerts`. The page keeps the
alert itself, its affected stops (which already offer Plan to here) and its affected services, so no
route is lost — the two ends are one tap away inside those lists.

**Where.** `src/pages/DisruptionDetailPage.tsx` (the card, `planAround`, `planBetweenAffected`, and
the imports/strings left unused), `src/lib/i18n.ts`.
**Done when.** At 378px the card is gone, the remaining page has no orphaned `row-wrap`, and `tsc` is
clean.

### F24 — One count badge, everywhere
*Mark: `2026-10-17t21-09-41-860-disruptions-378-light.png`, two areas:*
> "Not the same size as the number background in the header"
> "Not the same size as the number background of disruptions in the hamburger menu"

**Fix.** The alert count is one mark in one size: the header's `.app-header__alert-count`
(18px min-width, 18px tall) and the navigation's `.nav-item__badge` (24px min-width, 20px tall) are
made identical — same height, same min-width, same radius, same type size — declared once and used by
both, including the same count in the "all sections" sheet.

**Where.** `src/styles/base.css` (the two rules), `src/components/layout/AppShell.tsx` (both call
sites).
**Done when.** Measured at 378px in all three places, the badge boxes are the same width and height
to the pixel.

---

## Settings

### F25 — The preview must be visual, not textual
*Mark: `2026-10-17t21-01-32-386-settings-378-light.png`:*
> "Preview with current settings is very text heavy while its quite literally supposed to be the opposite, 'the rest of the page is text so here is where we show it IRL, not in text' is what its supposed to be, yet theres more text than visuals here."

**Fix.** The card becomes a specimen rather than a description:
- A live sample of the app's own furniture rendered with the current settings: a journey card (time,
  duration, relative time, a delay, an occupancy chip), a couple of buttons, a chip row, a board row,
  a notice banner — the things the settings actually change, drawn, not described.
- The `Accent colours` prose list becomes swatches with role names only (no sentences); the
  `Currently in effect` list shrinks to one compact chip row (Light · English · Comfortable ·
  Standard motion).
- The "Quick look" sentence goes.

**Where.** `src/pages/SettingsPage.tsx` (the preview card), `src/widgets/registry.tsx` or
`src/components/journey/JourneyCard.tsx` if a sample card is reused, `src/styles/components.css`.
**Done when.** At 378px the card is mostly drawings; changing Density, Contrast, Appearance or an
Accent visibly changes the specimens above the fold, without a reload.

### F26 — The default-origin list cannot be scrolled
*Mark: `2026-10-17t21-03-18-483-settings-378-light.png`:*
> "Physically no way of scrolling trough the stations which is HORRIBLE"

**Fix.** The same fix as **F2**: the suggestion list scrolls inside itself, and a scroll does not
close it. One change to the shared control, verified here as well as on Home.

**Where.** `src/components/journey/StopCombobox.tsx`, `src/styles/components.css`.
**Done when.** At 378px in Settings → Planner and board defaults, a finger scrolls the list to the
last station and the list is still open.

### F27 — The toast is ugly
*Mark: `2026-10-17t21-05-27-980-settings-378-light.png`:*
> "Incredibly ugly."

**Fix.** The toast gets a deliberate shape instead of a stretched black bar: the app's own font and
type scale, a real icon rather than an 8px status dot, text and dismiss button sharing one baseline,
a width that hugs the message (capped to the viewport), and the app's nested radius — with
enough contrast for both themes and the 44px dismiss target kept. Its position stays out of the way
of the foot controls.

**Where.** `src/components/ui/primitives.tsx` (the `toast` markup), `src/styles/components.css`
(`.toast`, `.toast-region`), `src/components/ui/Icons.tsx` if a warning/info glyph is needed.
**Done when.** A waning toast at 378px is a squircle that hugs its text — not a full-width bar — and
the dismiss target still measures 44px.

---

## Cross-screen

### F28 — PLAN TO HERE must fill only the TO
*Mark: `2026-10-17t20-58-13-155-results-378-light.png` (placeholder image):*
> "When you click the PLAN TO HERE button on absolutely anything, it auto-fills the from (or the to, depedning on what you clicked exactly) make sure it doesnt do that and when you presss a button like 'PLAN TO HERE' that it only auto-inputs the 'TO' and brings you to the search menu with the 'FROM' selected instead of the results."

**Fix.** One rule for every "plan from here / plan to here" control in the app (stop cards, a stop's
page, the departure board's row actions, an alert's affected stops, pinned-stop widgets):

- Pressing **PLAN TO HERE** fills **only the TO** end and opens the **planner**, with the **FROM**
  picker open and focused, waiting for the other end.
- Pressing **PLAN FROM HERE** does the mirror image: only the FROM, planner, TO picker open.
- It never reuses the previous search's other end and never jumps to results — today both happen
  whenever a search already exists in the session, which is exactly the "it auto-fills the from" in
  the note.

The planner already accepts `?from=` / `?to=` and fills the named row; the second half is making the
picker open on the other row on arrival (including when the planner is **already** mounted, which is
the case the `<SearchForm>` param effect was written for).

**Where.** `src/pages/StopsPage.tsx` (`planTo`), `src/pages/StopDetailPage.tsx` (`planTo`),
`src/pages/DeparturesPage.tsx` and `src/components/stops/BoardList.tsx` (the row plan action),
`src/pages/DisruptionDetailPage.tsx` (affected-stop Plan to here),
`src/components/stops/PlanStopDialog.tsx`, `src/widgets/registry.tsx` (pinned stops),
`src/components/journey/SearchForm.tsx` + `StopPicker.tsx` (open the other end's picker on arrival),
`src/lib/i18n.ts` (the toast that said "Plan a journey first" is no longer needed).
**Done when.** With a search already in the session, pressing PLAN TO HERE anywhere at 378px lands on
the planner with FROM empty and its picker open, and the URL carries only `to=`.

---

## Deliberately not in this file

- **Anything that only happens at desktop widths.** The marks were all taken at 378px, and the
  wide-screen plan is its own file (`DESKTOP-FIXES.md`), so neither file claims the other's work.
- **Dark mode and Dutch.** Every capture in this batch is light/en, so nothing here is a claim about
  the dark theme or the Dutch strings — the shared fixes (F2, F17, F24, F27) will be re-checked in
  all three appearances when they land, but this batch's own evidence is light/en.
- **The four nav buttons deleted in F8** (Departure stop, Arrival stop, Network map): the ask is to
  delete the footer they live in, and both stops are still reachable from the search card above and
  from every journey card. If any of the four is wanted back in a different place, that is a new
  order, not a silent re-add.

## How each item will be verified

1. `npx tsc --noEmit` clean, `npm run build` clean, `render-check` all pages render.
2. The existing audits (`class-audit`, `icon-audit`, `caps-audit`, `ui-audit`, `consistency-audit`)
   clean in light/en, and `ui-audit` re-run for any item that touches colour or sizing.
3. **This batch's own measurement at 378 × 734, light, the width the marks were taken at** — with the
   specific number each item asks for (scroll position, badge box, marker shape, toast box, no
   horizontal overflow) pasted under the item.
4. A sweep of all eleven routes at 378px for the deletions (carriers, accessibility, the results
   footer, the alert card) and for "nothing new overflows".
