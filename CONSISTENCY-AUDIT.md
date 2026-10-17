# Consistency audit — everything still inconsistent

> "Why do you keep being so inconsistent?? Sometimes the 'pin location' icon is at the top right of
> the widget, sometimes at the top left, sometimes inside a widget etc. And this issue keeps
> happening, not just with the pin location icon. Acknowledge it and do some research on everything
> thats still INCONSISTENT"

The complaint is correct, and the fault is the method, not the screens: three rounds in a row a
consistency defect was reported by eye — the back button in a different place per menu, then the
pin — and each time it was fixed **on the screens named**, with nothing measuring the *rule*. A
screenshot cannot see a rule. So this round is not another patch: it is an instrument that reads
every control on every screen, groups those controls by the **action** they perform, and prints the
ones that do not agree with each other about how they look and where they sit.

## Method

`scripts/consistency-audit.mjs` (`node scripts/consistency-audit.mjs [origin] [--gate]`) drives a
real browser through **14 screens** — the eleven routes, the stop picker, the map picker and the stop
page's plan dialog — at 320 and 390, with two stops pinned and the pin-listing widgets on the home
screen so their own states are in the inventory. On each screen it records, for every control:

* the **label** (accessible name, or the first few words) and the **action** that label performs;
* the **glyphs** it draws (`data-icon`) and their sizes;
* its **shape**: box, radius, border, shadow, outline, fill;
* its **place**: the landmark it sits in (page head, card, panel, dialog, app bar, dock, list row,
  field), which row of that landmark (head, body, foot), and which side of it (left, right).

327 controls and 147 non-control glyphs at 390; 321 and 147 at 320. Findings and the full tables:
`.logs/consistency-audit-390.md`, `.logs/consistency-audit-320.md`.

The standards each finding is judged against — verified, with the passages that actually exist:

| Source | What it says | Used for |
|---|---|---|
| [W3C COGA, *Use icons that help the user*](https://www.w3.org/WAI/WCAG2/supplemental/patterns/o1p07-icons-used/) | an icon should convey **a single meaning** | one glyph, one meaning |
| [WCAG 2.1 SC 3.2.4 Consistent Identification](https://www.w3.org/WAI/WCAG21/Understanding/consistent-identification.html) | the same function must be identified the same way; its own example is *"a save control [that] uses a floppy-disk icon on one page and a checkmark on another"* | one action, one appearance |
| [WCAG 2.2 SC 3.2.3 Consistent Navigation](https://www.w3.org/WAI/WCAG22/Understanding/consistent-navigation.html) | repeated controls occur **in the same relative order** each time | one action, one place |
| [NN/g heuristic 4, Consistency and standards](https://www.nngroup.com/articles/consistency-and-standards/) | *"Ensure consistency in the placement of form fields and buttons"*; decide primary/secondary placement and use the pattern consistently | placement drift |
| [USWDS, Icon](https://designsystem.digital.gov/components/icon/) | an icon must always mean the same thing — its example is an envelope used for both email and a mailing address | glyph meaning drift |
| [Material Symbols FILL axis](https://developers.google.com/fonts/docs/material_symbols) · [Apple SF Symbols](https://developer.apple.com/sf-symbols/) | a **saved** state is shown by a glyph that fills, and *save* is a bookmark; a *place* is a pin/marker; *show the map* is a map; *locate me* is a crosshair/viewfinder | the fix for the pin |
| [WCAG 2.2 SC 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) / [2.5.5](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html) | 24×24 minimum (AA), 44×44 (AAA) — the **target**, not the glyph | why bare glyphs are fine |

## Findings, as the audit reported them

*Everything in this section is the state of the app on 16 October, before any of it was
changed — it is the list the instrument produced, kept as it was produced. What was then done
about it is the section after it.*

### 1. The reported one: the pin toggle is in five places, and "unpin" has two different controls

Same action (`pinnedStopIds` toggled by `togglePin`), measured:

| Where it appears | Screen | Control | Landmark / row / side |
|---|---|---|---|
| Between the plan control and the title's own row | an alert… no: the **stop page** | `pin` 44×44 toggle | page head · head · left |
| Beside the stop's name | **stops list** cards (5 instances) | `pin` 44×44 toggle | card · head · right |
| Beside the stop's name | **departure board** card | `pin` 44×44 toggle | card · head · **right at 390, left at 320** (the row wraps, and the control's midpoint crosses the card's centre) |
| Right of a suggestion row | **stop picker** | `pin` 44×44 toggle | dialog · body · right |
| Row end, in the widgets that list pins | **home** (pinned stops, alerts at pins) | a **labelled "Unpin" pill with a `close` (×) glyph**, 85×44 | list row · head · right |

So the same action is a bare pin in four places — left of a page head, right of three other rows —
and a labelled × pill in a fifth. WCAG 3.2.4's own example is exactly this shape of defect.

The same glyph also means something else in two places: a **place marker** in the map picker's
sheet (20px) and in the pinned widget rows (15px). W3C COGA, USWDS: one glyph, one meaning.

### 2. One glyph, several meanings

| glyph | is the control for | also drawn as |
|---|---|---|
| `route` | plan a journey · **"Back to results"** · **"Other options"** | — |
| `location` (crosshair) | **"Centre the network"** (map picker) · **"Plan from here" / "From here"** | — |
| `sliders` | options · **"Plan return journey"** | — |
| `close` (×) | dismiss/clear · **unpin** | — |
| `pin` | pin a stop | 3 marker places |
| `board` | open the board | 1 marker (a pill) |
| `arrowRight` / `swap` | plan a journey (to here) · reverse the ends | 3 markers each — decorative in a time row / leg marker, **not** a finding |

The last row is named as *not* a finding on purpose: a glyph drawn inside a row as decoration (a
mode, a time, a leg marker) is not claiming a meaning. The five above are controls, and a control's
glyph is a promise.

### 3. Same action, different place — the other repeated controls

| Action | Instances | Signatures | Where they disagree |
|---|---|---|---|
| pin a stop | 15 | 5 | see above |
| plan a journey | 51 | 14 | a bordered "Plan" pill in the page head (stop page, `/stops`), bare circular "Plan a journey to X" buttons in card head/body/foot, "Plan from here" (crosshair) vs "Plan to here" (arrowRight), "Plan return journey" (sliders), "Plan journey" (obsidian, in the picker) |
| options | 15 | 7 | "Options" with sliders (bordered, card foot right) vs **no glyph at all** (results bar, page head right); "Other options" (**route** glyph); "Customise home" (**borderless**, page foot right); "Travel preferences" / "Manage avoidance preferences" / "Settings" |
| open the board | 15 | 6 | "More" (borderless, card foot left), "Open the full board" (bordered pill, card head left) **and the same words as plain 16px text** on the home widget, "Departure boards" (page head left, card body left, panel head left) |
| go back | 8 | 5 | the two *page-level* arrows agree exactly (app bar / picker bar, 44×44, round, left) — the fix from last round holds; the three *return links* do not: "Back to results" (`route` glyph, panel body), "Back to all alerts" (arrowLeft, card foot right), "Back to planner" (arrowLeft, panel foot left) |
| show on the map | 9 | 3 | "Show on map" (card foot right) vs "Network map" (panel head right, panel foot right) — one action, two names, three places |
| save something | 9 | 3 | "Favourite" (card foot right, white) / "Keep this search" (panel head left, white) / "Favourite this journey" (card foot left, **obsidian primary**) |
| show more results | 5 | 3 | "Show 5 more" (page foot right, bordered) vs "Show 5 more" (card foot left, **borderless**) vs "Show 1 more" (card foot left, borderless) |
| dismiss | 6 | 6 | the five × controls all agree (44×44, round, right of their row); "Remove all stored data" is a destructive **trash** pill and is a different action that this grouping caught by its verb |
| refresh / reverse / zoom / centre | 1 each | 1 | single instance — nothing to agree with, listed for completeness |

### 4. Same concept, different words

Not a placement defect but the same class of drift, and it makes the other findings worse: the
inventory shows one concept wearing five names — **board**: *More*, *Open the full board*,
*Departure boards*; **options**: *Options*, *Other options*, *Customise home*, *Travel preferences*,
*Manage avoidance preferences*; **map**: *Show on map*, *Network map*; **plan**: *Plan*, *Plan
journey*, *Plan a journey to X*, *Plan between the affected stops*. WCAG 3.2.4's *"the same search
function should not be labelled 'Search' on some pages and 'Find' on others"*.

## The pin, in detail (the screen you photographed)

* The stop page puts the pin **left of the page's own actions**, at 12,96 — the first thing in the
  page head. Your first image is this, exactly.
* The departure board card puts the same control on the **right of the card's heading row**, beside
  the *Stop page* pill — your second image.
* The stops list puts it at the **top-right corner of each card**, with no pill beside it — your
  third image.
* The widgets that list pinned stops do not use the toggle at all: they draw a 15px pin as a
  **marker** and offer a labelled **Unpin** pill with an ×.

One more measurement about the third image and the second: at **320px** the board card's pin reads
`left` where at 390 it reads `right`, because the heading row wraps and the control's midpoint ends
up left of the card's centre. The same control changes sides with the viewport.

**The ring in your first two images.** *Re-measured after the change, at rest, hovered, and after a
real click on the control: background `rgba(0, 0, 0, 0)`, border `1px rgba(0, 0, 0, 0)`, no shadow,
no painted outline — the control still paints nothing in any state.* In this tree the toggle paints
nothing at rest — measured at
320 and 390, in light and dark, at rest and after a touch tap: `border 1px transparent · no shadow ·
no outline · no fill`. Tapped or tabbed it shows its **focus ring**, which is coral (`2px solid
rgb(255,126,103)`), not the thin grey circle in your screenshots. The grey circle is the *hover*
paint a hairline-bordered ghost button has, and on a phone that paint sticks to the last thing
tapped — which is the defect the `.pin-toggle` rule exists to remove (its comment in
`styles/components.css` says so). That rule is **uncommitted work in this tree**, so a bundle built
before it shows exactly the ring you photographed, on the element you tapped and not on the ones you
did not. A hard reload on the preview settles it in a second; the *placement* findings above
reproduce in both builds, so they stand either way.

## The rules, as applied

Every line below is now the rule the code follows — one line per control, one glyph and one place
each. The pin line changed from the first draft on the traveller's own instruction: a *drawing pin*
that fills, not a bookmark.

| Control | One glyph | One place | Done |
|---|---|---|---|
| **keep a stop** | `pin` — the **drawing pin** (Lucide's `Pin`), filled while kept | the trailing control of the row that names the stop: page head, card head, list row, picker row | yes |
| **a place on the map** | `mapPin` — the teardrop, marker only, never a control | the map picker's sheet | yes |
| **show on the map** | `map` | it names *which* thing goes on the map, so two words are kept — "Show on map" for a journey, "Network map" for the screen | yes |
| **use my location** | `location` (crosshair) | the two *use my location* controls only | yes |
| **back / return** | `arrowLeft` | the bar's left column; a return link is a bordered pill wherever it sits | yes |
| **open the board** | `board` | the row it belongs to; "Open the full board", or "Board" in a card's foot, where the row is the narrowest in the app | yes |
| **options / filters** | `sliders` | trailing end of the row it filters, always with a label | yes |
| **arrange the home screen** | `layout` | the foot of the home page, where the widgets it arranges are | yes |
| **plan a journey** | `route` | it names its own object — "Plan", "Plan from here", "Plan to here", "Plan a journey to X", "Plan return journey" | yes |
| **more (n)** | `chevronDown` | the foot of the list it extends, bordered everywhere | yes |
| **dismiss / clear** | `close` | never for a non-dismiss action | yes |

### What each finding turned into

1. **The pin.** The control is Lucide's drawing pin, and a kept stop is that pin **filled** —
   `Icon name="pin"` in `Icons.tsx`, filled by the existing `.pin-toggle[aria-pressed='true'] .icon`
   rule. The teardrop keeps its meaning as a **place** and is renamed `mapPin`, drawn on the map
   picker's sheet only. The five ways the same action looked became one: the stop page's head, a
   stop card's head, the departure board card's head, the picker row, and the kept-stops widget —
   which used to offer a **labelled × pill** and now offers the same pin toggle, trailing. Its
   redundant 15px pin marker is gone too (every row in that widget is a kept stop).
2. **One glyph, one meaning.** `route` no longer means *back* ("Back to results" in two places,
   "Other options" on the journey page) nor *options*; `location` no longer means *plan from here*
   (two places) nor *centre the network* (the map picker's recentre has `focus` now); `sliders` no
   longer means *plan return journey*; `close` no longer means *unpin*; `board` no longer means
   *a platform* (that tag is `platform`).
3. **One action, one place.** The pin is trailing on all four surfaces **at 320 as well as 390**
   (`.card-actions` holds a card's action group at the trailing edge when the head wraps, and
   `.page-head__actions` does the same for a page head, which is why the stop page's pin reads
   `right` now instead of `left`); the return links are all `arrowLeft` bordered pills; the
   "Show N more" control is bordered everywhere; the kept-stops widget's unpin is the pin toggle.
4. **One concept, one word.** "More" on a stop card is "Board"; "Other options" is "Back to
   results"; "Map" on the journey page is "Show on map"; "Favourite this journey" is
   "Favourite"/"Favourited", the same two states the journey card uses; "From here" in the
   widget is "Plan from here"; the home board widget's plain text link is a real control.

## Before and after, measured

Same instrument, same 14 screens, same two widths. `audit-before-390.json` / `audit-after-390.json`
(and `-320`) in `.logs/` hold both runs.

| | before | after |
|---|---|---|
| **glyphs that mean more than one thing** | **8** (`route`, `location`, `close`, `sliders`, `board`, `pin`, `arrowRight`, `swap`) | **1** (`swap`, a decorative pair of arrows in a leg row — named as *not* a finding in the standards table itself) |
| actions drawn with **more than one glyph** | `pin a stop`, `go back`, `open the board`, `options`, `plan a journey`… | **none** |
| **`pin a stop`** | 15 instances, 5 signatures, two glyphs (`pin` and `close`) | 15 instances, **4 signatures, one glyph, all `right`** — identical at 320 and 390 |
| **`go back`** | 8 instances, 2 glyphs | one glyph (`arrowLeft`) |
| **`open the board`** | 2 glyphs | one glyph (`board`) |
| **`plan a journey`** | 4 glyphs | one glyph (`route`) |
| **`options`** | 4 glyphs | 2 — `sliders` for anything that opens the options/filters, `settings` for the Settings screen itself |
| **`show more results`** | 3 shapes (one borderless) | 2 shapes, both bordered, differing only in which container's foot they are in |

After the stop picker gained its four sections (the closest-stops work, 16 Oct) the same instrument
reports **350 controls and 162 glyphs, 1 glyph finding** — and `pin a stop` at **26 instances and 5
signatures**. The extra instances are the ten closest-stop rows, each with the same trailing pin. The
fifth signature is the instrument, not the app: `band` is a control's position inside the landmark's
box, and this landmark is a dialog exactly one viewport tall (844px, so its band lines fall at 236
and 608) whose list is now taller than that — the pins past y=608 read `foot` (9), the three above it
read `body`. Measured, not guessed: the picker's pins run from y=379 to y=1124. **The glyph and the
side did not change: all twenty-six are `pin`, and every one of them is `right`.** The band rule is
named in the limits below, because a landmark taller than the screen is exactly where it stops
meaning "the head or the foot of the thing you are looking at". (The totals wobble a little between
runs — the clock, the board and expanded lists are live data — so the two runs here read 349/148 and
350/162.)

The counts still above zero are mostly the instrument's own label-grouping: *options* is one group
holding five different destinations (Settings, Travel preferences, Customise home, Manage avoidance
preferences, the results filters), and *dismiss* is one group holding five × controls and a
destructive trash pill, grouped by their verb. Those are named as deliberate rather than fixed:
they are different functions, and WCAG 3.2.4 is about the *same* function.

The one thing the numbers get *worse* on is honest to name: `go back` and `show on the map` each
gained an instance, because the journey page's "Back to results" and "Show on map" were previously
counted in other groups (`options`, `ungrouped`). Their glyphs converged; their places did not get
fewer.

What the audit still reports, and why it is left: `plan a journey` (51 instances) keeps its shape
differences because a control in a page head, one in a card's foot and one in a dialog's footer
cannot be the same box; `show on the map` keeps two names because a link to *the map screen* and a
link to *this journey, on the map* are two functions; `save something` keeps "Favourite" for a
journey and "Keep this search" for a search. Each is written down here rather than papered over.

### Round 16: what was still wrong, and what the gate does now

The list above is the *judgement* half of the audit, and it was right about the app — but four of
the groups it was judging were not actions at all, and two of its measurements were reading the
data rather than the design. That is why `--gate` could never pass. Both halves were fixed.

**Wrong in the instrument (no app change):**

* **Four groups were four functions wearing one verb.** `dismiss` held five `×` controls *and* the
destructive `Remove all stored data`; `save something` held `Favourite` (keep this journey) *and*
`Keep this search`; `options` held `Options` (a filter panel over the list) *and* `Travel
preferences` (a link to the preferences screen) *and* `Customise home` *and* `Settings`. WCAG 3.2.4
is about the **same** function, so grouping by verb manufactured findings out of unrelated
controls. The rule list is 24 entries now instead of 18, and what it reports is functions: 11
differences at 390, each one a shape or a place that the register below names.
* **A pill's width was read as part of its shape.** `Show 5 more` is 132px and `Show 1 more` is
  128px; `Plan from here` is 147 and `Plan to here` is 129. Every one of those was a separate
  "shape", so one control was reported as three. The signature's first element is the **height**
  now — width is what the label says. The measured box is still on every instance in the JSON.
* **A control past its landmark's own edge was read as `foot`.** The stop picker's dialog is 900px
  and its rows run to y=1129 inside a scrolling body, so nine pins read `foot` and a list growing by
  a row moved an action's signature while nothing moved. It reads `offscreen` now. (Making a
  *scrolling* landmark unbanded — the obvious fix — was tried and thrown away: it made the same
  `Back to results` read `body` in one panel and `scroll` in another because only one of them
  overflowed. That is a difference in the content, not in the design.)

**Wrong in the app (fixed, and measured on it):**

* the stop page's plan dialog put a **solid** `Plan from here` beside a **ghost** `Plan to here` —
  one question asked in two materials. Both ends are the white bordered pill the departure board's
  own pair already used (`.logs/round16-check.cjs`, both `44px · r9999px · 1px rgb(232, 230, 223) ·
  fill rgb(255, 255, 255)`);
* the journey page's `Favourite` was the app's **only obsidian** Favourite, so the same control on
  this journey's own card was a white pill and here it was the loudest thing on the page. It is the
  same pill in both places now;
* `Customise home` was the second thing wearing `sliders`, the options/filters glyph, which is why
  the audit reported two glyphs for one action. It draws `layout` — the grid it arranges. Nothing
  else about it changed (still text-only, still at the foot, by request).

**The gate.** `--gate` used to exit 1 whenever an action's instances disagreed, and the deliberate
differences the traveller had asked for by name made that permanent. It now fails on two things and
nothing else, and both are written into the script:

1. **one action, one glyph per state** (W3C COGA) — never exempt. `pin` and `×` for one toggle,
   `route` and `arrowLeft` for one way back, `sliders` and `settings` for one destination: all
   mechanical, all caught. Grouped by `aria-pressed`, so a shown state keeps its own drawing;
2. **every remaining finding is a decision on the record** — the `DELIBERATE` map in
   `scripts/consistency-audit.mjs`, one entry per action with the reason, printed in the report. A
   new disagreement under a new action fails the gate; the tolerated ones are the ones written down.
   An entry that stops matching the run is printed as a candidate for deletion rather than left in,
   because a standing permission nobody re-reads is how the drift comes back — with the one caveat
   the register itself ran into: the audit runs at two widths, and whether `show the network map`
   has a finding flips between 390 and 320, so that line is a hint to compare the two runs, not an
   instruction.

Checked against the defect rather than only against the fix: with a second glyph planted on one
`open the board` control (`board` → `refresh`) the audit reports **`DRIFT: open the board (rest):
board / refresh`, 1 unexplained finding, exit 1**; removed, **0 unexplained, exit 0**. Run on the
final code: `.logs/round16-audit-390.out` and `-320.out`, **11 and 10 differences, all on the
record, exit 0 at both widths**. `round16-check.cjs` measures the three fixes through the interface
(**9/9**), and `tsc`, `build`, `class-audit` (332), `icon-audit`, `render-check`, `caps-audit`,
`ui-audit` (light/en and dark/en), `fix-verify` (47/47), `round5` (33/33) and `round8` all pass on
the changed code.

## Limits of this audit

* Actions are grouped by **label**, so a differently-worded control can hide in `ungrouped` — the
  script prints those separately rather than inventing a group for them. "Journey details" and
  "My results" sit there today. Round 16 split four groups that were grouping by *verb* instead
  (see above), which is the same caveat from the other side: the rules are written by hand, and a
  control whose label leads with the wrong word will still land in the wrong action.
* The walk reaches 14 screens. States behind a button (a dialog opened from a dialog, a picker
  opened from a map picker) are not all in it yet; each one added is a place drift can hide.
* Two signatures can differ for a good reason (a *from* control and a *to* control are a pair). The
  findings above are the ones that survive that check, and each is named with the place it disagrees
  with, so the disagreement can be judged rather than trusted. Since the parameters are shape *and*
  place, "fewer signatures" is not the only thing that means "better" — a control that moved from
  an invisible row to a bordered one can add a signature and still be the right answer.
* The instrument cannot tell a *deliberate* difference from drift. That judgement is in the tables
  above, and the ones I judged deliberate are labelled as such.* **`band` no longer claims a row for a control the landmark does not contain.** Fixed in round 16
  (`offscreen`); the reasoning, including the fix that was tried and thrown away, is in that section
  above. What it still cannot do is tell "the head of this list" from "the row you have scrolled to":
  for a landmark whose content is longer than its box, the reading is about the box, and the order of
  the rows is in `row` and in the instance order, not in `band`.
* **The `DELIBERATE` map is a decision register, not a proof.** Eleven differences are tolerated by
  name at 390 and ten at 320, each with a reason a reader can contradict. A wrong entry is worse
  than a red gate, because the gate stops failing; the entries are short, they name the clause, and
  none of them was written to make a count go down.
* **The audit needs a browser, and a restored sandbox has none.** Playwright's Chromium needs a
dozen system libraries and there is no root here, so `.logs/playwright-libs.sh` fetches them as
`.deb` packages into `$HOME/syslibs` (plus a fontconfig file, without which the browser dies on the
first repaint) and exports `LD_LIBRARY_PATH`/`FONTCONFIG_FILE`. `source` it before any browser
check; the audits and probes were run through it.
