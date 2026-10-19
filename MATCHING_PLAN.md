# Matching plan — one set of rules for the board, the alerts, the results and the stops

Written **before any code is touched**, as a plan rather than a change. It reads the four list
screens that do the same job — show a list of things, let the traveller narrow it, offer the rest —
and lists every place they answer the same question differently, with the rule that should be one
rule and the measurement that will prove it. **Every rule here has since shipped** — the **Status**
table below carries the evidence for each, and `.logs/matching-check.cjs` is the instrument that
proves them on screen.

The table that follows is the **snapshot from 2026-10-15, before the work** — it is what the plan was
written against, not what the app is now. The Status table is the current reading.

The four screens, and why they are the same screen:

| | Stations & stops | Departure boards | Disruptions | Journey results |
|---|---|---|---|---|
| route | `/stops` | `/departures` | `/disruptions` | `/results` |
| the list is | 61 stops | departures at one stop | 14 alerts | the journeys of a search |
| row of controls | `.stops-filters`: search, sort, Options | **none** — a hero card with a Stop combobox and a Favourites chip row | `.stops-filters`: search, pinned chip, sort, Options | the planner card, then `.results-bar` (Start / End / Leave / Options) — **and the sort in a card of its own** |
| the sort | select, labelled **Sort by** (`Nearest` / City / Name / Connections) | none: a board is in time order | select, labelled **Sort** (Severity / Start time / Type / **Nearest**) | select, labelled **Sort** (Best / Fastest / …) |
| location | sentence under the row: device fix, IP estimate, or "Sorted by City" | **nothing** — the stop choice is the location, and the picker is not distance-ordered | sentence, only while `Nearest` is the active sort | not applicable — nothing here is ordered by distance |
| the first-reach filter | Favourites only — **inside Options** | the Favourites chip row | Affecting my pinned stops — **on the row** | Direct journeys only / With delays — **inside Options** |
| loads | 5 rows × the layout, scroll-armed, "Show N more" | `limit={6}` then "Show 5 more" — **no scroll sentinel** | 5 rows × the layout, scroll-armed, "Show N more" | journeys: all at once (the engine returns a handful); carriers: 5 rows × the layout |
| a card is | `.stop-card` → the card opens the stop page; More; Plan (2-action dialog) | a row in `BoardList` | a card → the card opens the alert page; its own button | a journey card → the card opens the journey page; three actions |
| empty | the list is filtered to nothing → its own box | `EmptyState` twice: "Pick a stop", "No board here" | filtered to nothing → its own box | a card that names the cause and offers the fixes inline |
| its own name | sr-only (the navigation names it) | sr-only | **drawn** (and the navigation names it too) | **drawn** |
| live | computed once per visit | **ticks every 5s**, and says so | static | static |

Everything below is a difference visible in that table.

**The "Today" paragraphs below are a snapshot from 2026-10-15, before rounds 22–32.** Some of what
they describe has since changed — the board's chip row was removed, the stop page took the shell's
history-first back control, and both filtered lists moved onto `EmptyState`. Where a "Today"
paragraph disagrees with **Status**, the status table is the current one.

## Status — measured 2026-10-18

Checked rule by rule against the tree and the running app on **2026-10-18 (third pass)**: **all ten
shipped**, and the instrument the plan promised — `.logs/matching-check.cjs` — exists and passes
**120/120** at 390 / 768 / 1440.

The rule headings below now read **shipped** too. Everything under each one that says *"Today"* or
*"The change"* is the plan as it was written, kept for the reasoning; the status table is the
current reading, and it is the one to believe where a paragraph disagrees with it.

| rule | state | evidence on this date |
|---|---|---|
| 1 · one filter row | **shipped** | `[data-filter-row]` on all four routes: `.stops-filters` on `/stops` and `/disruptions` (search, first-reach chip, `Sort by`, Options), the same row on `/departures` holding the stop field, and `.results-bar` on `/results` — the search's four chips, then `Sort by`, then Options last. The sort's own `Card` is gone |
| 2 · one location answer | **shipped** | `rankStops(query, favouriteStopIds, { origin, limit })`; the empty field is favourites then the **nearest** stops, and `POPULAR_STOP_IDS` is deleted. The full-screen picker's "Popular stops" section is gone with it; with no origin it says *Turn on location to see what is closest* |
| 3 · one batch rule | **shipped** | `BoardList` opens on `ROWS_PER_LOAD` (five), grows five at a time, watches a sentinel armed by a scroll and keeps the `Show 5 more` button; `/results` is documented as a list that fits (the engine returns a screenful for a search) |
| 4 · one card that is a way in | **shipped** | `components/ui/ResultCard.tsx`: the stop card, the alert card and the journey card all render it, with `ResultCardLink` as the one real link; a press on any control inside stays the control's |
| 5 · one header rule | **shipped** | all four list screens pass `showTitle`; `matching-check` asserts the `h1` text on each at three widths |
| 6 · one empty state | **shipped** | `components/ui/NoMatches.tsx` is the one "nothing matches" card: it names what removed the list and offers working fixes as chips. `/stops`, `/disruptions` and `/results` use it; the board keeps `EmptyState` for "nothing yet" |
| 7 · one way back | **shipped** | `useHeaderBack` (`AppShell.tsx`): a stop asks the history then falls back to `/stops`, an alert returns to `/disruptions`, a journey asks the history then falls back to `/results` |
| 8 · one URL-state rule | **shipped** | `/stops` reads and writes `region`, `city`, `type`, `modes`, `favourites` and `sort` in the query string; the typed search and the grown batch stay in component state, which is the rule's own second half. Measured: set a type, reload, same list; Back, previous list |
| 9 · one vocabulary | **shipped** | `Sort by` in all three places; and the interface literals outside the dictionary are **0** (`.logs/i18n-scan.cjs`: only `OV-fiets`, a product name, and `Promise`, a TypeScript generic) |
| 10 · one live-data rule | **shipped** | only the board ticks (`BOARD_REFRESH_SECONDS`) and it says its interval on screen |

---

## Rule 1 — One filter row, four slots, in one order — **shipped**

**Today.** `.stops-filters` is a real component-in-CSS (a grid: search on its own line on a phone,
the sort and the Options chip on the last one). `/stops` and `/disruptions` use it. `/results` uses
a different shape for the same job (a chip bar of four, then a card that contains the sort alone).
`/departures` used a third (a hero card with a combobox and a chip row; the chip row has since
been removed, so what is left is the combobox and still no filter row).

**The rule.** One row, in one order, on every screen that lists something:

1. **the search slot** — a text field where the list can be typed into (`Search stops`,
   `Search in alerts`), or the control that *is* the search (`Stop` on the board);
2. **the first-reach filter** — the single filter people reach for first, as a chip (`Affecting my
   pinned stops`, `Favourites only`, `Direct journeys only`), on the row and not in Options;
3. **the sort** — a labelled `select`, always in this slot, never in a card of its own;
4. **Options** — the chip with the changed-count, and **only when there is something behind it**
   (`/departures` has nothing to hide, so it gets no Options chip rather than an empty one).

**The change.** `/results`' sort moves out of its own card into the row (its four chips stay where
they are: they are the *search's* controls — how you reach the first stop, how you leave the last,
when you travel — not filters on the list). `/departures` gains the row: the Stop combobox becomes
slot 1 and the Favourites chip row becomes slot 2, in the same card, using the same class.

**Proved by.** `.logs/matching-check.cjs` (new, phase 1): on all four routes, at 390 / 768 / 1440,
assert the row exists, its children's slots in order, that exactly one `select` is in it, that the
Options chip is present exactly when `#<page>-options` exists, and that no control in the row
shares an edge (the round-12 rule).

---

## Rule 2 — One location answer, and the same sentence about it — **shipped**

**Today.** `nearestOrigin` in `AppState` is already the single answer (device fix, else the cached
IP estimate, else nothing), and `/stops` and `/disruptions` both sort by it and both say which one
they used. But `/departures` ignores it twice: the Favourites chip row — since removed, the board now stacks one card per pinned stop — was in **pin order**, and the
stop picker's shortlist (`rankStops` in `lib/stopSearch.ts`) offers pins first and then six
hard-coded big stations — `POPULAR_STOP_IDS`, which is exactly the kind of sample-data fact the
board page was cleaned of in round 11, wearing a different coat. `/results` has no distance order
at all: the Start/End chips say *how* you reach the ends, never *which* end is nearest.

**The rule.** Every list that can be ordered by distance is ordered by `nearestOrigin`, offers
`Nearest` in the sort slot, is disabled when there is no origin (never a `Nearest` that silently
does something else), and carries the same sentence in the same place when it is in use:
*"Nearest first, from your device location."* / *"Nearest first, from an approximate IP location — it
can be off by a lot."*

**The change.** `rankStops(query, pinnedStopIds, { origin })` learns the origin, so the empty-field
shortlist becomes pins, then the nearest stops, and `POPULAR_STOP_IDS` retires — one rule for the
planner's picker, the board's combobox and the full-screen picker. The board's Favourites row
was to order nearest-first when an origin exists (its *order* changes; its *contents* stay the
traveller's own pins); with that row gone, the rule belongs to the board's stop picker. `/results` gains nothing: its ends are not a distance list, and inventing an
order there would be the opposite of this rule.

**Proved by.** Seeding the three states (a device fix, only an IP estimate, neither) and asserting,
on every screen: the order of the first five items, that `Nearest` is present/disabled, and the
sentence's exact words — the same measurement the round-9 check already makes for `/stops`.

---

## Rule 3 — One batch rule, one way to more — **shipped**

**Today.** `lib/loadBatch.ts` is the rule (`5 × what the layout puts side by side`, sentinel armed
by a scroll, a real "Show N more" button underneath) and `/stops` and `/disruptions` both use it.
Two lists still do something else: `BoardList` opens on a literal `limit={6}` (its own first
screenful) and has no sentinel, so a board grows only by pressing; and the journey list on
`/results` holds nothing back at all (right today, because a search returns 9–11 journeys).

**The rule.** A list that holds items back holds back **five rows**, uses the same button, and can
be grown by scrolling as well as by pressing. A list that holds nothing back is a list that fits —
and the moment it can exceed a screen or two, it uses the hook rather than a number.

**The change.** `BoardList`'s `limit` becomes the measured batch (`6` was "one screenful" decided by
hand); it gains the sentinel and the scroll arming; the button keeps saying `Show 5 more` where the
layout puts one row to a line. `/results` keeps planning everything (the honest state) but gains a
note in the code and a check that fails if a search can return more journeys than a batch — so
"all at once" stays a fact about the engine, not an oversight.

**Proved by.** Extending `.logs/round10-check.cjs` to the board and to `/results`: what opens, what
one press adds, and what a scroll adds, at three widths.

---

## Rule 4 — One card that is a way in — **shipped**

**Today.** Three copies of one idea, and they agree by discipline rather than by construction: a
`.stop-card`, an alert card and a journey card are each a `Card as="article"` with an `onClick` to
the detail route, one real link inside as the accessible path, `stopPropagation` on their own
buttons, and a hover/press lift. Rounds 9, 11 and 12 arrived at that shape one screen at a time,
which is why they are three implementations.

**The rule.** One component (`components/ui/ResultCard.tsx`): the card body is the way in, the card
contains exactly one real link, the controls inside stop their clicks, and the lift is the app's
own hover/press transform — so a fourth list cannot invent a fourth behaviour.

**The change.** Extract it, put the three cards on it, and keep their *contents* exactly as they
are (the stop card's board slice, the alert's severity chip, the journey's times and actions).

**Proved by.** Round 11's hover-and-click assertions applied to all three card families through the
one selector, plus the ui-audit's contrast/target/clipped-text sweep on every route.

---

## Rule 5 — One header rule — **shipped**

**Today.** The rule already exists: a screen whose name the navigation already gives it draws an
sr-only `h1`, and every other screen draws its name (`showTitle`). `/results` and `/disruptions`
draw theirs although the navigation names both. `/stops` and the board page itself do not draw theirs; a single line's board does.

**The rule.** Pick one and apply it to all four: **a list screen always draws its own name** — the
traveller arriving from a link, a bookmark or Back has to be told where they are, and the menu is
not on screen on a phone — with at most one action beside it (plus the history Back on a detail
screen).

**Proved by.** The existing drawn-name assertion in `.logs/fix-verify.cjs`, extended to the board.

---

## Rule 6 — One empty state, and one "why is it empty" — **shipped**

**Today.** Four different answers: `EmptyState` for "nothing here" (board), a hand-built card with
the reason and the relaxation chips (results), and filtered-to-nothing boxes on `/stops` and
`/disruptions` in their own words.

**The rule.** Two states, two shapes: **nothing yet** (`EmptyState`: an icon, a name, a sentence,
one action) and **nothing matches** (a card that names which setting removed the list, with the
fixes as chips you can press, the way `/results` already does). Same place on every screen: under
the filter row.

**Proved by.** A check that filters each list to nothing deliberately and asserts the shape and
that each offered fix actually restores items.

---

## Rule 7 — One way back (already the rule, two screens behind) — **shipped**

**Today.** The shell remembers each history entry's scroll position, and the map and the journey
page use `HistoryBackButton`. The stop page used to link to a fixed list; it now takes the shell's history-first back control,
and the alert page still returns to the fixed list.

**The rule.** Every detail screen gets its way back from the history, with the fixed route only as
the fallback for a pasted link, and the traveller's place in the list behind it is restored.

**Proved by.** The round-12 measurement (leave at *n* px, come back at *n* px) repeated for the
stop and alert pages.

---

## Rule 8 — One URL-state rule — **shipped**

**Today.** `/disruptions` reads `?stop=` and `?line=`, `/departures` reads `?stop=`, `/stops` keeps
every filter in component state, `/results` keeps its search in memory (deliberately: a search is
not a bookmark).

**The rule.** A filter that changes **which list you are looking at** lives in the URL (so Back,
refresh and sharing work), and state that is only about *this visit* (a typed query, a batch that
was grown) does not. The stops list's region/city/type/modes and the alerts' severity/type/mode
should therefore be in the URL on the same terms as `?stop=` already is.

**Proved by.** Set each filter, reload, assert the list is the same list; press Back, assert the
previous filter set comes back.

---

## Rule 9 — One vocabulary — **shipped**

**Today.** `Sort by` on `/stops`, `Sort` on `/disruptions` and `/results`; `Show 5 more` /
`Show {count} more` / `Show fewer`; "Nearest first, from your device location." vs
"{n} alerts affect {stop}"; `More` on a stop card vs a `Filter` chip.

**The rule.** One label per idea, in the dictionary, in both languages: **Sort by**, **Options**,
**Show N more** / **Show fewer**, the two location sentences, **Nothing matches**, **No board
here**. The capitalisation audit already enforces the *shape* of these strings; this rule is about
them being the *same* string.

**Proved by.** `scripts/caps-audit.mjs` (which walks every route in both languages) plus a small
check that no screen carries a one-off variant of these labels.

---

## Rule 10 — One live-data rule — **shipped**

**Today.** The board ticks every 5 seconds and says so; the stop cards take a three-departure slice
of the same generator, computed once; the alerts and the stops are static; the results are planned
per search.

**The rule.** Exactly one screen is live (the board), it says its interval on screen, and every
other screen states the window its figures belong to rather than pretending to be live. Nothing
ticks in the background of a screen that does not say it does.

**Proved by.** The existing "the board ticks" assertion, plus a check that no other route mutates
its list over ~12 seconds.

---

## Phases

| Phase | What lands | Why this order | Proof |
|---|---|---|---|
| 1 | Rule 1 (the row on all four screens), Rule 9 (the labels) | The row is the thing every other rule hangs off, and it is visible | `matching-check.cjs`, round9/10/11 checks, `ui-audit` |
| 2 | Rule 2 (one location rule, incl. `rankStops` and the board's Favourites order) | It touches the same row the phase-1 work just settled | the three-state seeding check |
| 3 | Rule 3 (the board's batch and sentinel, the results' guard) | Mechanical, and it needs the row to be final | round10 extended |
| 4 | Rule 4 (the shared card), Rule 5 (the header), Rule 6 (the two empty states) | Structural changes with no behaviour change — cheapest to review together | round11 extended, `fix-verify` |
| 5 | Rule 7 (stop and alert pages), Rule 8 (filters in the URL), Rule 10 (the live rule) | The long tail: each is small, each has its own check | round12 extended, a reload/Back check |

Each phase ends the way every round here ends: `tsc` and the build clean, then `render-check`,
`class-audit`, `icon-audit`, `caps-audit`, `ui-audit` in light/en + dark/en + dark/nl, the earlier
rounds' checks, `fix-verify`, the acceptance suite, and the phase's own new check — with any older
assertion that the change invalidates **rewritten to the new rule, never relaxed**.

**Where the phases stand (2026-10-18, second pass):** all five phases are done. Phases 1–4 (the
row, the vocabulary, the location rule, the batch, the shared card, the header, the empty states)
landed together, because the row is what each of them hangs off; phase 5's URL rule and the two
earlier rules (the header, the empty state) came with them. The one thing no phase listed — the
board drawing its own name — was added with rule 5, since it is the same rule.

**The proof exists:** `.logs/matching-check.cjs` walks the four routes at 390, 768 and 1440 and
checks the row (and its slot order), the drawn name, the URL round-trip (set, reload, Back), the
"nothing matches" card and its fix, the board's batch and button, and the one-link card — **120 of
120 checks pass**.

## Questions the plan opened, and how the work answered them

**All three were answered by the work rather than in prose**, and the answers are in the Status
table above: the board gets no Options panel (nothing hides behind one, so it has three slots in
its row and no fourth); the results screen's four chips stay in the row *and* are the search's
controls, with only the sort joining them as a list control; and the stops list does draw its own
name — a phone has no menu on screen, and a stop reached from a link has to be told where it is.

1. **Does the board get an Options panel at all?** It has nothing to hide today. If not, it is the
   one screen with three slots in the row and no fourth — which the rule allows, but it is the
   first thing a reader will ask about.
2. **Do the results screen's four chips count as "the filter row"?** The plan says no (they are the
   *search's* controls) and moves only the sort into the row. The alternative — one row containing
   the search's chips *and* the list's filters — would make `/results` and `/disruptions` identical
   at a glance.
3. **Should the stops list really draw its own name?** It is the one screen where the navigation
   entry and the page name are the same words, which is the argument for leaving it sr-only.
