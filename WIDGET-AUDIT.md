# Widget audit — is this worth a place on someone's home screen?

Asked for directly: *"audit every widget and ask yourself if anyone would use the widget … also find
widgets that just simply aren't good but people would use if they were good."*

So this is not a review of the code — the code is sound and every widget renders. It is the question
the catalogue has never been asked: **does this earn the space it takes from the first screen?**

Measured, not asserted. `.logs/widget-audit.cjs` puts **all 17 widgets** on one home screen twice —
once on a **fresh browser** (nothing stored) and once **seeded** with six favourites, three board
pins, two kept journeys, two kept searches, a default origin and a chosen board stop — then records
each widget's rendered text, its card's size, how many controls it holds, and a screenshot
(`.logs/home-fresh-full.png`, `.logs/home-seeded-full.png`, `.logs/widget-{fresh,seeded}-*.png`).
Every number below comes from that run.

## The headline: the catalogue is 17 widgets, and the good one is switched off

At 390px wide in a 900px window (the audit's own viewport) the whole catalogue is **4115px of
widget card once it holds something — 4.6 windows of scrolling, on a 4621px page — and 3233px with
every widget empty**. The **five widgets that are on by default** account for **1067px** of it on a
fresh browser, and **1417px** once they have data:

| default widget | height | what that height does for the traveller |
|---|---|---|
| `planner` | 173px | the app's one job: plan a journey |
| `map` | **563px** | two thirds of the window on the whole country, five labels, none of them yours — the largest card in the catalogue |
| `favourited-journeys` | 83px | *"Nothing favourited yet."* |
| `recent-searches` | 83px | *"Nothing kept yet — keep a search from its results to put it here."* |
| `preferences-summary` | 165px | restates what you already chose in Settings |

**331px of the default home screen is an empty apology (83 + 83px) or a settings echo (165px), and
the largest card is a map of the Netherlands.** The one widget that shows live, personal, actionable
information — `next-departures`, the departure board at a stop of your own — is **not** in
`DEFAULT_HOME_WIDGETS` at all. That single fact is the audit.

## The rule this audit judges by

Every widget passes or fails one test, which is the same test the project already applies to data
("no invented facts"):

> **A widget either holds something of the traveller's, or it does something for them. A widget that
> neither contains your trip nor acts on it is a page of the app pretending to be your home screen.**

Four widgets contain nothing of the traveller's *and* offer no control at all — `mode-activity`,
`lines-here`, `operators` and `about` measured **0 controls each in both passes**. (Four more measure
0 in the fresh pass — `favourited-journeys`, `recent-searches`, `alerts-at-pins` and `pinned-stops` —
but those have nothing to offer *because* they hold nothing yet, which is an empty state rather than
a missing action; all four gain controls the moment they have data.) The four permanent ones can only
be read, and what they say is about the demonstration network, not about the journey you are taking.

## Every widget, judged

| # | widget | what it renders (measured) | cost | verdict |
|---|---|---|---|---|
| 1 | `planner` | From / To, 2 controls | 173px | **Keep** — the app's reason to exist; required, default |
| 2 | `next-departures` | The station this card is **tied to** (chosen once, in the card itself), 4 rows, code + modes, "Open the full board", **5 controls** — and **no field**, so a glance never searches. Untied it is one sentence and the search box: **159px, 1 control** | 386px bound / 159px unbound | **Keep, and make it a default** — the only widget with your own station, live times and an action, and now the only one that needs no input to read. 386px is still a lot: 2–3 rows would carry the same message |
| 3 | `pinned-stops` "Favourite stops" | 4 of your hearted stops, each a link + "Plan from here" + a heart = **12 controls in 327px** | 327px | **Keep, trim** — "Plan from here" per row is three controls of chrome for a list that is itself a shortcut; the heart is for removal and belongs behind a long-press or on the stop page |
| 4 | `alerts-at-pins` | 4 alerts that touch your stops, 4 controls | 144px | **Keep** — the personal half of the alerts idea, and the only alerts card whose contents are yours |
| 4b | `next-departures`, untied | One sentence (*"Pick one station for this card…"*) and the stop field **itself**, in the card | 159px | the state a fresh card is met in: the question is asked once, where it is answered — no button whose only job was to reveal a search box, and no overlay |
| 5 | `favourited-journeys` | Your saved journeys, Plan + unfavourite each | 212px / 83px empty | **Keep, merge** — see below |
| 6 | `recent-searches` | Searches you kept, Repeat + delete + clear all | 304px / 83px empty | **Keep, merge** — two default widgets for two lists of the same thing (journeys you have run) is one list with a heading |
| 7 | `map` | Mode chips + the network drawn to scale, 5 busiest-stop labels (Alkmaar, Zwolle, Den Haag Centraal, Rotterdam Centraal, Eindhoven Centraal), 6 controls | **563px** | **Fix** — it is the biggest card on the screen and, on a phone, it is a picture: nothing on it is your stop unless you arrived from one. Its full screen (`/map`) already exists and is linked from a journey's results, from an alert and from the not-found page — it is a view *of a journey*, not a place in the navigation. Either the widget draws *your* world (your stops, your origin, the nearest few to you) or it should be a one-line teaser that opens `/map` |
| 8 | `alerts` | "2 major / 5 disruptions / 7 information" + the first three alert titles on the network, 3 controls | 155px | **Fix** — network-wide news, and the first three of the list the Disruptions page shows in full; the count is already on the dock's Disruptions item. Keep it only as the personal version (`alerts-at-pins`) with a way out to the full list |
| 9 | `right-now` | A large clock, "Re-run my search from now", 1 control | 188px | **Fix** — a clock the operating system already draws, at the top of a 188px card, and the one useful control ("re-run from now") is behind a warning toast until you have searched. Fold the re-run into the planner or the board and delete the clock face |
| 10 | `stop-search` | "Find a stop" field + three chips: Amsterdam Centraal, Rotterdam Centraal, Amsterdam Zuid — **the busiest stops in the demonstration network** | 266px | **Fix** — the field is fine (it is the planner's own picker), the three chips are a fact about demo data that no traveller has a relationship with, and they contradict this project's own rule that nothing suggests a stop the traveller did not choose |
| 11 | `preferences-summary` | Pills: "Modes: Walking, Biking, Train…", "Walking up to 20 min", "Max 2 transfers" + change link | 165px | **Cut (or one line)** — nobody reads their preferences as a home screen; they need them *applied*. A default-on settings echo is 165px of the first screen |
| 12 | `quick-actions` | Four buttons: Departure boards, Stations & stops, Travel preferences, Settings | 163px | **Cut** — three of the four are already in the dock menu (Home, Stations & stops, Departure boards, Disruptions, Settings). It is navigation, on top of navigation, and the last thing the home screen needs |
| 13 | `mode-activity` | "Train 16 services · Bus 12 · Tram 6 · Metro 5 · Ferry 2", **0 controls** | 164px | **Cut** — a count of the sample network. Nothing to do with it, nothing personal in it, nothing to tap |
| 14 | `lines-here` | Six line names at "Busiest sample stop: Amsterdam Centraal", **0 controls** | 208px | **Cut** — a timetable for a stop the traveller never chose, in a city they may not be in, with no way to act on it |
| 15 | `operators` | Nine operators: "NS · Nederlandse Spoorwegen" + mode glyphs, **0 controls** | 265px | **Cut** — the largest of the widgets with nothing to do, and the one named first in the report that asked for this audit. It is a credits list, not a home screen |
| 16 | `local-data` "Stored on this device" | Four counts (favourites / board pins / journeys / searches) + "Remove all stored data" | 196px | **Cut** — Settings already carries *Remove all stored data* with its confirmation. The counts describe the app to itself |
| 17 | `about` | Three bullet points of prose + the display settings ("comfortable · 24-hour clock · dd-mm-yyyy") | 236px | **Cut** — an About page that has been given a place on the home screen; it even refers to "the map widget on your home screen" |

## What that adds up to

**Cut seven:** `operators`, `mode-activity`, `lines-here`, `local-data`, `about`, `quick-actions`,
`preferences-summary`. Together they are **1397px** — 1.6 windows at 900px — and none of them holds
anything of the traveller's. Four of the seven are also the entire reason the catalogue needs an "About"
category; the category goes with them.

**Fix five:** `map` (draw my world, or become a teaser — it is 563px today), `alerts` (personal
alerts, not network news), `right-now` (drop the clock, keep the re-run somewhere it can be reached),
`stop-search` (drop the three demo chips; the field can stay), `pinned-stops` (one control per row,
not three).

**Merge one:** `favourited-journeys` + `recent-searches` → one "Your journeys" widget, sections for
saved and kept. Two default-on cards that are empty on day one and list the same kind of thing.

**Catalogue after: 9 widgets** (`planner`, `next-departures`, `pinned-stops`, `alerts-at-pins`,
`alerts`, `your-journeys`, `map`, `stop-search`, `right-now`) and **~1400px lighter**.

**Defaults after:** `planner`, `next-departures`, `pinned-stops` — a journey planner, the board at
your stop, and your stops. Not a map of the country, not a settings echo, and not two empty lists
explaining themselves on first run.

## Widgets that should exist (suggested; six are still unbuilt)

Asked for at the same time as the audit: *"add suggested widgets to add (that dont exist yet)"*. Each
idea below is written **only** out of data this app already computes, in keeping with the project's
rule that nothing is drawn that nobody has (`no invented data`); none of them existed when this was written, and one has since been built.

**Status, 2026-10-18 (second pass): all seven are built.** The seventh — *alerts on the journeys
you saved* — was R105 rebuilding the `alerts` card as exactly that; the other six are in the
catalogue now, and each was written only out of data the app already computes, as this audit
required. They are measured in both states — the empty state that says where its contents come
from, and the seeded state that draws the fact — by `.logs/widgets-six.cjs` (**23/23**).

| suggested widget | what it shows | built from (already in the app) | why it earns a card | rough size |
|---|---|---|---|---|
| **Your commute** — tied to one saved journey, exactly as the next-departures card is tied to one station | *Utrecht Centraal → Rotterdam Centraal · next at 17:30 · leave in 6 min* | `savedJourneys[].query`, the board's own departure times (`boardForStop`), and the walk leg's minutes (`journey.walkMinutes`, `walkMinutesBetween`) | the card that answers the question a commuter actually has in the morning, and the only one that can say **when to leave** rather than only when the train goes | ~380px |
| **Stops near you** | *Amsterdam, Museumplein · 180 m · next tram 17:33*, three or four rows | `nearestOrigin` (device fix, else the approximate one), `distanceFromPosition`, `formatDistance`, `boardForStop` | the one card that is useful while walking, and the honest fix for a map widget that currently draws the whole country | ~300px |
| **Alerts on the journeys you saved** — **built**, as the `alerts` card (R105) | the alert that touches a journey you kept: *your 17:30 to Rotterdam Centraal is cancelled* | `disruptionsForLeg(lineId, fromStopId, toStopId)`, `savedJourneys` | personal, actionable, and the real replacement for the network-wide `alerts` card — a commuter cares about *their* 17:30, not that there are 7 information notices nationally | ~150px |
| **Accessibility at your stations** | *Step-free: yes · lift: no · low-floor boarding: yes*, per favourite | `stop.accessibility.stepFree`, `lowFloorBoarding`, `stop.facilities` | for a traveller who needs it this is the difference between a journey and a wasted one, and the data is already there and static | ~180px |
| **What it costs** | the fare of your saved or planned journey, and the trade-off: *fastest €9.40 · cheapest €6.20* | `journey.fare` (`fareFor`), the results' own sort modes by fare and duration | money is the second question after time, and the engine already ranks on both | ~150px |
| **Last service home** | *Last Intercity to Rotterdam Centraal: 00:12*, plus the next two | `boardForStop` (the generator runs past midnight deliberately) and a saved journey for the direction | the one timetable fact people look up late, and nothing on the home screen answers it today | ~180px |
| **A second tied card — several Next departures, each tied to its own station** | two boards side by side: home and work | the binding already exists (`widgetStations`, keyed per widget id); the catalogue allows one instance per id today | "where I leave from" and "where I arrive" are two places, and forcing one card to serve both is why the card kept wanting a picker | 386px each |

What none of them is — and what the seven cuts have in common: a widget that only **counts** or
**lists the network** (`operators`, `mode-activity`, `lines-here`), a widget whose content is the
same for every traveller (`alerts` as it stands, `about`), or a widget that describes the app to
itself (`local-data`). A card earns its place by holding something of yours or doing something for
you.

## The six suggested cards, built

The audit's own list of what it would build, and what each one became in the catalogue:

| suggested widget | what it is now | empty | with data |
|---|---|---|---|
| **Your commute** | `commute` (Yours): the journey you keep most, counted down — the next service on its own line and **when to leave** (the departure minus the walk the planner measured) | *"Heart the journey you take every morning and this card counts down to it."* | `Amsterdam Centraal → Utrecht Centraal · Next 11:00 · leave in 22 min` + Plan |
| **Stops near you** | `nearby-stops` (Travel information): the closest stops **that have a board**, how far, and the next departure — and it names which answer it is using (device fix or approximate) | *"Turn on location and the stops around you appear here."* (or the approximate-IP sentence, when that is the fix in force) | `Utrecht Centraal 20 m · next at 11:05`, `Utrecht Vaartsche Rijn 1.4 km · next at 10:52` |
| **Accessibility at your stations** | `facilities` (Yours) — **renamed**, and the reason is an order later than this audit: *"get rid of ALL accessibility descriptions EVERYWHERE"*. A widget is not exempt from a rule about every surface, so the card lists `stop.facilities` — the fact the data really holds — per hearted stop | *"Heart a stop and its facilities are listed here."* | `Utrecht Centraal · Toilets · Kiosk · Bicycle parking · Lift · Ticket machine · Taxi rank` |
| **What it costs** | `cost` (Plan): the quickest option and the cheapest one side by side, read from the journeys the app is already holding — it re-plans nothing | *"Plan a journey and its fare appears here beside its time."* | `Fastest 11:00 → 11:24 · 24 min · €13.20` |
| **Last service home** | `last-service` (Travel information): the last three services from the origin of your first kept journey, and the minute it read them | *"Heart the journey home and this card knows its last service."* | `Alkmaar · 800 23:38` … `Read at 10:38, the same minute the board uses.` |
| **A second tied board** | `second-board` (Travel information): the same card as next-departures, bound to **its own** station (`widgetStations` is keyed per widget id) | asks for its station in the card itself (`#second-board-stop`) | tied to `rotterdam-centraal`: `Rotterdam Centraal · from 10:38` + rows |

The catalogue is **fifteen cards** — three on a fresh home screen, twelve addable, under *Plan /
Travel information / Yours* — and `.logs/widget-audit-2.cjs` asserts all twelve by name, so a
missing card is a red check rather than a silent gap.

## Executed

The audit was then executed, and this is the catalogue it left. Nothing in the judgements above was
softened to make the work smaller; the one place reality differed from the estimate is called out at
the end.

**Cut seven.** `operators`, `mode-activity`, `lines-here`, `local-data`, `about`, `quick-actions` and
`preferences-summary` are gone from `src/widgets/registry.tsx`, and their bodies with them — the
file took **458 lines** of new code and gave up **580**, a net **122 lines** lighter. The **About** category went with them: the catalogue is grouped *Plan /
Travel information / Yours*. A stored layout that still names a cut id is left alone in storage and
simply draws nothing (`HomePage` renders only ids that still have a widget), so returning a card
later would return it to its place rather than to the end.

**Merge one.** `favourited-journeys` + `recent-searches` → **`your-journeys`**, one card with a
*Saved journeys* section (Plan + heart-with-confirmation per row) and a *Saved searches* section
(Repeat + per-row delete + delete-all), both empty states in one sentence. A stored layout naming
either old id is folded into it on load, at the first one's position and only once
(`migrateHomeWidgets`, `src/widgets/defaults.ts`) — measured: `planner, favourited-journeys,
quick-actions, map, recent-searches` loads as `planner, your-journeys, quick-actions, map`.

**Fix five, each as the audit asked.**

| widget | what it is now | measured |
|---|---|---|
| `map` | draws **your** world: the five stops it marks are your hearted stops first, then the nearest to you, and only then the busiest junctions; a line under the drawing names them in words that cannot collide. Eight columns, so the drawing is capped at 480px square | seeded: `Utrecht Centraal` and `Amsterdam Centraal` are marked on the drawing and named under it (*"Your stops: Utrecht Centraal · Amsterdam Centraal"*). The two busiest stations have no legal text-label spot at 390px — which is why the word line exists — so the canvas carries the junction names and the line carries yours. A fresh browser still gets junctions, because a map with no names is worse |
| `alerts` | **Alerts on your journeys** — `disruptionForLeg` over every leg of every saved journey, each row naming the journey it is about, plus *All alerts* | seeded: *"Signalling fault — delays around Utrecht Centraal"* / *"Amsterdam Centraal → Utrecht Centraal"*; the network counts are gone |
| `right-now` | **Re-run from now** — the clock face is gone; one button and one line saying what will be re-run | no `\d\d:\d\d` anywhere in the card |
| `stop-search` | the field alone; the three demo chips are gone | 0 chips, 1 input |
| `pinned-stops` | one link per row — no per-row *Plan from here*, no per-row heart | 2 rows = 2 links, 0 buttons |

**Defaults.** `planner`, `next-departures`, `pinned-stops` — the planner, the board at a station of
your own, and your stops. The board arrives **untied** and asks for its station in the card itself
(one sentence, one field, no button whose only job was to reveal a field, no overlay).

**The numbers after.** A fresh home screen is **624px of card** (three standard-tier cards) where the
five defaults were **1067px**; all nine cards with data are **2570px** where seventeen were
**4115px**, on a **1930px page** that was **4621px**. The audit asked for ~1400px lighter and got
**1545px**.

**Where the estimate was wrong, said plainly.** The audit sized the untied departures card at
**159px** and the tied one at 386px. The cards now carry R88's height floor — 132 / 208 / 312px per
tier — so a short card is **208px** at standard whatever it holds: the untied board *is* the question,
and it is drawn at 208px, not 159. The saving is real, but it comes from the three defaults rather
than from squeezing this card below the app's own minimum. The audit's judgement (*make it a
default*) was right; its pixel estimate for the empty state was not.

## Verified

`.logs/widget-audit.cjs` exit 0 — 2 passes (fresh, seeded) × 17 widgets, no `pageerror` on either.
The audit is measurement only: **no application code was changed for it.** The execution is measured
by `.logs/widget-audit-2.cjs` — **30/30**, fresh / catalogue / all-nine-seeded / migration, with
screenshots in `.logs/widget-audit-2/` — and by `.logs/widget-audit-3.cjs` — **6/6**, the two Dutch
empty states and the journey page's saved-journeys link landing on the merged card and flashing it.
With them: `tsc` clean, `npm run build` clean, `class-audit` **384/384**, `caps-audit` exit 0 (**18
screens × 2 languages, 778 strings**), and `consistency-audit` exit 0 on that round's code (**308 controls, 184 glyphs,
14 screens**; its pre-existing UNEXPLAINED *remove stored data* line and the *go back* drift were
unchanged). **Correction, 2026-10-18:** that script now exits **1** at both 390 and 320 — 307
controls, 178 glyphs — on the same two lines, which turn out to be grouping artefacts rather than
drift; see the dated section at the end of `CONSISTENCY-AUDIT.md`.

Two things it leans on, both of which came out of the audit itself: `next-departures` is now tied to
**one station of the traveller's own** instead of watching a stop it was handed (`USER-FIXES.md`
orders 92–93), and the seeded pass above measures that tied card (386px) rather than the field it
used to carry (501px).
