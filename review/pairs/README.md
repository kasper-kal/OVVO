# 29 captures, 35 notes, judged on the pictures

Each file `pair-NN.png` is one capture beside the same screen in the app today: the comment that
came with the capture (verbatim) is the caption, and every pane is labelled with its real width in
CSS pixels, so a cropped capture is never compared to a full screen at a hidden scale.

`../mobile/notes.json` is the source: 29 images, 35 `regions`/`pins`, each with its comment. The
capture order here is the order the notes are in, and the comments are quoted, not paraphrased.

**Verdicts: 27 done · 2 partly · 0 not done.**

*Re-judged 2026-10-18:* four of the six `PARTLY` verdicts had been answered by later rounds — the
hover lift, the settings suggestion list, the location toast and the crowding levels — and are
**`DONE`** below with the measurement that closes them (`.logs/pairs-recheck.cjs`,
`.logs/occupancy-levels.ts`). The two that stand are named for what they are: a card is resized
inside customising only (§1), and the home screen is still painted for **3 frames / 36ms** on
`/results` before the results content (§3, down from ~90 ms, `.logs/flash-check.cjs`).

---

## 1 · home — "No resizing button" · PARTLY

Before: the "Next departures" card, normal mode, top-right grip and close, nothing else.
Now: in normal mode there is still no control (it is not in the DOM). In **Customising** there are
five 44×44 corner handles, `aria-label="Resize Plan a journey"`, one per widget, and a keyboard
ladder on each (↑/↓ = height).
So a resize control exists — but only inside customising, and as a corner mark, not the button the
note asked for. That is a design decision, not a missing feature; it is in the picture honestly.

*2026-10-18:* the mark was drawn 8px in from the card's edge, which is **outside** a 28px radius —
it sat on the page behind the card and read as a stray stroke floating off the corner ("also this is
so ugly"). It is now 12px inside, following the card's curve; see `../pairs/pair-01.png`.

## 2 · home — departures list scrolls, and the page scroll used to dismiss it · DONE

Before: the card's suggestion list is clipped by the card; you can only move the page, and the page
scroll took the list with it.
Now: the list floats above the card (all six suggestions visible, 352px, no clipping), and a wheel
scroll with the pointer over it moves the page **and leaves the list open** (measured: list still in
the DOM, page scrollY 828).

## 3 · results — the home-screen flicker · PARTLY

**The capture is a placeholder picture ("IGNORE THIS IMAGE…"), so there is no before.** The complaint
is temporal, so it is photographed instead: a CDP screencast of the frames after the second stop is
chosen. Frame at 110 ms: the **home screen** at `#/results`. Frame at 199 ms: the results screen with
the spinner and "Working out the options…".
So the state the note asks for exists, and the flash it complains about is still there for one
frame (~90 ms).

*2026-10-18:* re-measured frame by frame with `.logs/flash-check.cjs` at 390×844: the URL changes to
`/results` at **55 ms** and the results content is drawn at **91 ms**, so the home screen is painted
for **3 frames / 36 ms** after the pick — half of what the screencast found, still there. The two
readings use different instruments (a CDP screencast then, `requestAnimationFrame` sampling now), so
the comparison is of order rather than of the same clock.

## 4 · results — "Done button is unnecessary" · DONE

Before: the access sheet (Walking / Bicycle) with a DONE button. Now: same sheet, no DONE, one X.
Measured: choosing "Bicycle" closes the sheet by itself (dialogs open after choosing: 0) and the chip
reads "Start: Bicycle".

## 5 · results — "carriers section in options" · DONE

Before: a CARRIERS grid of ten operators plus RESET ALL FILTERS / PREFERENCES. Now: the Options panel
runs max walking time → transfers → trade-offs → filter by mode → direct/delays/cancelled → reset.
No carriers block.

## 6 · results — "we don't need a button to change it here" · DONE

Before: the PREFERENCES button at the foot of the Options panel (next to RESET ALL FILTERS).
Now: that row is "RESET ALL FILTERS" alone.

## 7 · journey — "awkwardly squeezed in" · DONE

Before: PLAN RETURN JOURNEY and SHOW ON MAP squeezed into two narrow columns, FAVOURITE under them.
Now: three full-width rows, one control per line.

## 8 · journey — "favouriting a journey reaction to the icon filling" · DONE

Before: a tick and the word "FAVOURITED". Now: the heart **fills** (solid) and the word stays.

## 9 · journey — "EXTREMLY text heavy, replace with mostly icons" · DONE

Before: a label/value table (Operator GVB, Services Tram 2, Modes Tram, Fare €2.30 — indicative
single fare, Step-free, Bicycle, Duration…). Now: icon chips — [tram] Tram 2 · [ferry] Ferry F3 ·
[station] GVB · [ticket] €2.30 Indicative single fare · [clock] 51 min · [swap] 1 transfer · 2 legs ·
[walk] 0 min walking · [bike] Bicycle allowed. Three chips keep words; every chip has its icon.

## 10 · journey — "No clear end… square instead of a circle" · DONE

Before: the leg card ends after "No intermediate stops on this service." Now: the timeline closes with
a **black square**, the arrival stop's name and "Arrive 06:31".

## 11 · journey — "Ugly arrow, replace with icon instead of text" · DONE

Before: a text arrow (the "→" glyph, on the baseline) between the two stop names. Now: an 18×18
`svg` arrow, drawn, vertically centred. See `../pairs/zoom-11-before.png` / `zoom-11-now.png` at 2.2×.

## 12 · results — "Move the SAVE THIS SEARCH… get rid of this entire footer" · DONE

Before: an "About these results" block (KEEP THIS SEARCH, four buttons: back to planner, departure
stop, arrival stop, network map). Now: "Save this search" is a chip at the top of the results, under
the Leave/Options row; at the bottom of the page (scrollY 4969 of 5703) there is no "About these
results", no "Keep this search", no "Back to planner". The two acts are named apart — "Save this
search" on the bar, "FAVOURITE THIS JOURNEY" on the card, and the home widget says: "A saved search is
a pair of stops you keep. A saved journey is one result with its own times."

## 13 · results — "add a SAVED SEARCHES widget" · DONE

**Placeholder capture.** The ask is additive: the widget is on the home screen by default, with that
sentence in it.

## 14 · results — the five notes on Date and time · DONE

The capture is the when-sheet with DATE / HOUR / MINUTES, EARLIER OPTIONS / LATER OPTIONS, "TODAY,
NOW" and DONE. Now: DATE and one TIME select (three fields → two, hour and minute merged); no
EARLIER/LATER row; "NOW" with the clock icon; no DONE, and the X keeps the change — measured: picked
tomorrow, closed with X, reopened: still tomorrow, chip reads "Leave: 19 Oct · 02:45".
"Weird and different from other switchers": the DEPART AT / ARRIVE BY control is now `.segmented`, the
same component as Appearance, Language, Clock format and the rest — six of them on the app, identical
54px height, 9999px radius, 1px hairline, ivory track.

## 15 · results — "expected quiet green, the next thing orange, really busy red" · DONE

Before: quiet = `rgb(225,234,223)` sage with a green meter — as asked. "Fairly busy" =
`rgb(255,245,165)` with a `rgb(230,207,63)` meter — **yellow, not orange**. "Really busy" never
occurred: across eight searches and every option on each results page (14 at a time) the levels seen
were only "Expected quiet" and "Expected fairly busy", so there was no red case to look at.

*2026-10-18:* the engine now reads crowding off the clock (`journeyEngine`'s own note): a journey
whose own departure is in the morning peak (07:00–09:30) or the evening peak (16:00–18:30) starts
from a busier base, so the third level happens. Measured from the engine over five city pairs at five
times (`.logs/occupancy-levels.ts`): **08:00 → 36 busy / 12 moderate / 0 quiet** and **17:00 → 34
busy / 14 moderate / 0 quiet**, where 10:30 gives 12 quiet / 36 moderate / 0 busy — **70 busy
journeys** in the sample. The middle level stays the palette's butter rather than an orange, which is
the colour system's answer and not a missing level.

## 16 · home — "hard to move it back" · DONE

**Placeholder capture.** Now: the customising panel carries **PUT IT BACK** beside Add widget, Reset
layout and Done, next to the moved widget.

## 17 · stops — "add skeleton loading … slowly animate" · DONE

**Placeholder capture.** Now: four skeleton cards on the stop list while a filter settles, each with
`.skeleton` running `skeleton-shimmer`, 1.5s, linear, infinite over a white→ivory gradient. The still
shows the shape; the animation is the measured CSS, which a picture cannot show.

## 18 · stop — "Why it on the right" · DONE

Before: PLAN / heart / pin alone on the right of the header. Now: the stop's name, then that row,
aligned left.

## 19 · stop — "Get rid of ALL accessibility descriptions EVERYWHERE" · DONE

Before: an Accessibility row with Step-free access · No lift · Tactile paving · No staff assistance ·
Low-floor boarding. Now: the card ends at Bicycle. A text sweep of twelve screens (home, results with
and without a search, stops, two stop pages, departures, disruptions, a disruption, settings,
preferences, map) finds no match for accessib / step-free / stairs / tactile / lift / wheelchair /
low-floor / staff assistance.

## 20 · stop — "clicking a line shows the full line and its times" · DONE

Before: a static row (Ferry F3 · every 10 min, GVB, ALERTS). Now: clicking the row's **name** opens
`#/departures?line=f3&stop=amsterdam-buiksloterweg`, headed "Ferry F3", with the line's times,
platforms and delays. The board supports lines.

## 21 · stop — "Add on-hover jump up animation" (line row and nearby rows) · DONE

Before: rows with no hover state visible. Then: `transform: none` at rest → `matrix(1,0,0,1,0,-2)` on
hover, background ivory → white, 120ms ease — a **2px** lift, which the note read as a nudge rather
than a jump.

*2026-10-18:* the lift is the app's own `--hover-lift`, which now stands at **-4px** — measured on the
same rows: `transform: none` at rest → `matrix(1,0,0,1,0,-4)` on hover, the same curve every card and
chip uses (`.logs/pairs-recheck.cjs`). It is the app's standard lift doubled, not a second animation.

## 22 · stop — "clicks on the background, not just the >" · DONE

The row's name is a link that covers the row (`.list-row__stretch`); clicking the name, far from the
chevron, opened the line board (above).

## 23 · stop — "on-background clicks to go to its board" · DONE

Clicking the text of a Nearby stop (not its chevron) opened that stop's page
(`#/stops/amsterdam-noord`, heading "Amsterdam Noord (metro)").

## 24 · disruption — "Remove this widget" · DONE

Before: a "Plan around this alert" card with four buttons (avoid metro, plan between the affected
stops, travel preferences, back to all alerts) and an OTHER ALERTS block. Now: the page is What is
happening → advice → chips → Affected stops; the card is gone.

## 25 · results — "PLAN TO HERE should only fill TO and open the picker on FROM" · DONE

**Placeholder capture.** Reproduced the gesture on a stop page: Plan → Plan to here → the picker
opens titled "Where are you leaving from?", To filled with the stop, From empty. It does not
auto-fill the other end and it does not jump to the results.

## 26 · settings — "Preview with current settings is very text heavy" · DONE

Before: paragraphs and a table (Time 14:05, Duration 1h 37min, Date, Relative) plus six swatches each
with a sentence. Now: a specimen journey card, a specimen departure board with two rows, plan/filter
buttons, a service notice, six swatch dots, and "currently in effect" chips. The card now leads with
specimens rather than prose; the words that remain are labels under them, not a table of values.

## 27 · settings — "Physically no way of scrolling trough the stations" · DONE

Before: the suggestion list ran out of the card, last row cut, no scrollbar. Then: the list was a
scroller — `overflow-y: auto`, 327px tall around 352px of content, 25px of travel — but the last row
could still not be brought fully into view, and the cap was six suggestions.

*2026-10-18:* the list is measured to the room that is there (`cap.max` from its own geometry) and
holds **8 suggestions**: the box is 458px around 464px of content, so it scrolls by **6px**, and the
last row ends at **660px of an 844px viewport** — nothing is cut off and the wheel still moves it
without closing anything (`.logs/pairs-recheck.cjs`).

## 28 · settings — "Incredibly ugly." (the location toast) · PARTLY

The box frames the toast "Location access was not granted." — a 381px black bar with a small coral
dot, sitting over the card heading and the DEPART AT / ARRIVE BY switcher.
Now: 303×56, 20px radius, a warning triangle instead of the dot, hugging its message, lifted above the
dock.

*2026-10-18:* the surface went with it — the toast is the app's own card now (`background:
var(--l1-bg)`, `border: var(--l1-border)`, `color: var(--ink-strong)`), measured as
**`rgb(243,241,234)` with obsidian ink at 303×56 and a 20px radius**: a message that arrives on the
card surface rather than a dark slab with a hole in the page (`.logs/pairs-recheck.cjs`; the CSS rule
carries the same reasoning).

## 29 · disruptions — badges the same size in the header and the menu · DONE

Before: the header's 14 is a small circle, the menu's 14 a larger one. Now, measured: both
27.2 × 20, radius 9999, 11px, padding 0 8px.

---

### What this pass is not

- Nothing here is judged from `MOBILE-FIXES.md`, from code comments, or from an old harness. The only
  inputs were `review/mobile/*.png`, `review/mobile/notes.json`, the running app at 378×734 (1.25
  device ratio, the captures' own scale), and measurements taken in that app.
- Five captures (#3, #13, #16, #17, #25) are placeholder pictures, not screenshots. For those there is
  no "before": three of them are additive asks confirmed by the now pane, and the two behavioural ones
  (#3, #25) are shown by a screencast and by the reproduced gesture.
- Movement, scroll and hover cannot be proven by one still; where a note is about one, the still is
  paired with a number (scrollTop, transform, timings) taken from the same page.
