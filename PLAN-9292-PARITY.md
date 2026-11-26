# The plan: 9292 parity

**One file, from 26 November 2026.** At the steerer's order this file now holds what were two:
`PLAN-9292-PARITY.md`, the journey page's twenty items, and `PLAN-9292-DATA-PARITY.md`, the data and
the journeys' fourteen steps. Nothing in either was reworded, merged or dropped, each part is
carried whole, with the day it was last read against the code still written inside it, because a
status is only worth what the day it was checked is worth.

**Part One** is the page: the twenty things the steerer wrote, word for word, each with what to
build, where, how big, and how it is known to be done. **Part Two** is everything underneath the
page: what the app knows, what it can work out, and the fourteen steps between that and 9292.

---

## Where it stands today

Read against the code in the OVVO repository on **26 November 2026**.

- **Part One: seventeen of the twenty are in the code.** Items 1–6, 8–17 and 20 are built; item 18
  (every leg opened at once) is open; items 7 (the price chip) and 19 (the marks in an opened list)
  were not confirmed either way, so they count as open until somebody looks at them on a screen.
- **Part Two: seven of the fourteen are confirmed in the code**: 1, 2, 3, 5, 6, 8 and 12. The other
  seven (4, 7, 9, 10, 11, 13 and 14) have never had their **Done when** line run, so they stay open
  whatever the files look like.
- **Two defects Part Two names are still there, checked again today.** `src/lib/useDisruptions.ts`
  still returns the simulated list unconditionally, so a production build still shows invented
  alerts; and `src/data/generated/boards.ts` still carries `"generatedAt": "2026-11-15…"` from the
  14 November archive while the published month is rebuilt every night.
- **One thing that reads like a contradiction and is not.** Items 13 and 14 shipped on OpenStreetMap
  foot routing (`src/lib/streetMap.ts`), so a **walk** follows real streets. Step 7 is about the
  **ride's** line, drawn from `shapes.txt`, which is still read by nothing, so a train's line on the
  map is still a path from stop to stop.

---
## Part One · The journey page, closer to 9292

The twenty items below are the spec, word for word as the steerer wrote them. Nothing in them is to be
softened, reworded, merged or skipped. Each one gets a plan under it saying what has to be built, how
big it is, and how we know it is done.

Sizes, measured twice rather than guessed. Six of the **S** items were built and checked in four
minutes, so one **S** is about forty seconds. Then six **M** items, with these numbers being
corrected in the same go, took six minutes, so one **M** is about a minute. Both batches were built
together, which is faster than the same items one at a time, and that is why the first guesses were
so far out. The scale that follows from the two measurements: **S** under a minute · **M** about a
minute · **L** a few minutes · **XL** ten minutes or more. The two exceptions are 13 and 14, which
need a street map the app does not have: those are counted in hours, and no batch will shorten
them.

---

### The top row

#### 1. Departure alarm
**9292's clock opens a departure alarm: a slider with minus and plus, set to warn you five minutes before you have to leave, and Cancel / Save under it. It tells you when to go. OVVO has no such control.**

- **Build:** a clock control in the journey's top row, opening a sheet that holds a slider with a minus and a plus, the warning set to five minutes to begin with, and Cancel / Save under it. Saving works out the minute you have to leave (the first leg's departure minus the walk to it minus the warning) and sets a reminder for it.
- **Where:** the top row, beside the journey's own controls; the sheet over the page.
- **Size:** M, a few minutes: a sheet, a slider and a reminder.
- **Done when:** the slider moves in whole minutes, the plus and minus match the slider, Cancel changes nothing, Save keeps the setting on the journey, and the reminder fires at the minute shown.

#### 2. Share
**9292's share button offers exactly two things: share the journey advice, and save it to your calendar. OVVO has neither.**

- **Build:** one share control that opens exactly two choices. *Share the journey* hands the journey to the phone's own share sheet, and copies the link where there is no share sheet. *Save it to your calendar* writes a calendar entry with the two ends, the departure and the arrival, which any calendar app opens.
- **Where:** the top row.
- **Size:** L, a quarter of an hour: two choices, and a calendar file that opens cleanly.
- **Done when:** the sheet shows exactly those two lines, sharing produces a working link to this journey, and the calendar file opens in a calendar with the right times and places.

#### 3. Alert counter
**OVVO shows a red "14" badge in the top row. 9292 has nothing like it.**

- **Build:** remove the badge from the top row. The alerts keep their own places: the journey's alert row, and the alerts page.
- **Where:** the top row.
- **Size:** S, under a minute.
- **Done when:** no counter sits in the top row on any screen, and the alerts are still reachable where they were.

---

### Under the title

#### 4. Map thumbnail
**9292 has a small route map with an expand arrow in the top right. OVVO has no map preview there.**

- **Build:** a small map beside the title with the journey's route drawn on it, and the expand arrow in its corner, opening the map screen on this journey. The thumbnail draws the same map the map screen does, so when the street map arrives with items 13 and 14 the thumbnail shows streets too.
- **Where:** the head, top right of the title block.
- **Size:** M, a few minutes: a small drawing and the arrow into the map.
- **Done when:** the thumbnail draws this journey and not another, the arrow opens the map on the same journey, and it is legible at 320px.

#### 5. Separators between the mode glyphs
**9292 puts a dot between each one. OVVO uses plain spacing.**

- **Build:** a small muted dot between each pair of glyphs in the chain.
- **Where:** under the title.
- **Size:** S, under a minute.
- **Done when:** every pair of glyphs has a dot between it, and the chain does not wrap on a phone.

#### 6. The change count
**9292 writes "2 ×" with a swap glyph. OVVO writes "1 transfer" in words.**

- **Build:** print the figure, the multiplication sign and the swap glyph, exactly as 9292 does. The full sentence stays underneath for screen readers, so the sign is never read out as "times".
- **Where:** under the title, at the right of the mode chain.
- **Size:** S, under a minute.
- **Done when:** a journey with two changes reads "2 ×" with the swap glyph, a direct journey reads "0 ×", and a screen reader hears the sentence.

#### 7. The price
**9292 puts it in a pale rounded chip. OVVO prints it as bold ink. Both carry a star.**

- **Build:** the price goes back into a pale rounded chip, as 9292 has it. The chip sits on the meta line with the date and the length, and the star stays with the amount.
- **Where:** the meta line under the title.
- **Size:** S, under a minute.
- **Done when:** the chip is a rounded pale block around the price only, nothing beside it looks shaded by it, and the star is inside the chip.

---

### The rail: times and platforms

#### 8. Time weight
**9292 uses ordinary weight. OVVO prints the times bold.**

- **Build:** the times on the rail go back to ordinary weight.
- **Where:** every time in the rail's gutter.
- **Size:** S, under a minute.
- **Done when:** the times are ordinary weight, still numeral-aligned, and the rows do not change height.

#### 9. Platform position
**9292 pushes it to the far right edge of the row. OVVO puts it right after the station name.**

- **Build:** the platform is pushed to the right edge of its row, on the departure rows, the arrival row and the stop rows. A long station name wraps rather than pushing the platform off the page.
- **Where:** every row on the rail.
- **Size:** S, under a minute: the check at two widths is the longer half.
- **Done when:** the platform sits at the right edge on all three kinds of row, at 320px and 390px, in light and dark, with no page overflow and no clipped name.

#### 10. Two possible platforms
**9292 can print two in red when it is unsure. OVVO always shows one.**

- **Build:** when a service's platform is not yet settled, print both in the warning colour ("Platform 5 or 6") as 9292 does at Schiphol. Stops already list their platforms; a journey needs a way to say a platform is not decided.
- **Where:** the rail's departure rows and the arrival row.
- **Size:** M, a few minutes: a journey has to be able to say a platform is not settled.
- **Done when:** a journey with an unsettled platform shows two in red, a settled one shows one as today, and the stops list does not have to be edited by hand.

---

### The rail: places

#### 11. Stop or station
**9292 names the stop you stand at, with its street or building. OVVO names the station.**

- **Build:** the rail names the stop the ride actually leaves from, with its street or building, as 9292 does. A ride starts at the boarding stop, and the walk to it is split off the front of the journey.
- **Where:** every ride row's departure, and the arrival row's end.
- **Size:** L, a quarter of an hour: the biggest data change of the twenty.
- **Done when:** a bus journey begins at the bus stop by name, a train journey begins at the station, the walk to the stop is its own row with its own minutes, and the times still add up.

#### 12. The first row
**9292 calls it only the starting point. OVVO prints the address itself.**

- **Build:** the first row says only that this is where the journey starts, with no address beside it.
- **Where:** the first row of the rail.
- **Size:** S, under a minute.
- **Done when:** the first row carries the words for the starting point, the time, and the walk under it, and no address.

---

### The rail: services and walks

#### 13. The route link
**9292 gives every walk a link that opens it on the map, with the dashed line drawn along the real streets. OVVO has no walking route view.**

- **Build:** every walk gets the link, opening that walk on the map with the dashed line **along the real streets**. Our map today is a drawing of the network with no streets on it, so this item brings in a real street map: tiles behind the drawing, a walking route between the two points, and the dashed line laid on that route.
- **Where:** the walk rows, and the map.
- **Size:** XL, half an hour or more: the street map is also what 14 and 4 stand on.
- **Done when:** the link opens the walk, the line follows real streets between the two ends, and it still draws when the network is slow.

#### 14. A map button on every ride
**9292 ends each ride row with a blue map glyph that opens that leg on the map: the route drawn, a "Navigeer" button, and the leg's two times under it. OVVO has nothing per leg.**

- **Build:** the blue glyph at the end of every ride row, opening that leg alone: the route drawn on the street map, a **Navigeer** button, and the leg's two times under it. Navigeer walks the route step by step, from the point you are at.
- **Where:** every ride row, and the map.
- **Size:** XL on top of 13: one leg on the map, and the step by step.
- **Done when:** every ride row has the glyph, it opens that leg and no other, the two times under it match the row, and Navigeer steps along the route.

#### 15. Operator and line badge
**9292 writes the operator before the service and puts the line number in a coloured badge: pink for bus 3, purple for the night bus. OVVO keeps the number inside the name, with no badge.**

- **Build:** the operator stays in front of the name, and the number comes out of the name into a coloured badge of its own. One colour per mode, a separate one for a night service.
- **Where:** the service line of every ride row.
- **Size:** M, a few minutes: split the name, colour the badge in both appearances.
- **Done when:** "NS Intercity" keeps its operator, the number sits in a badge, and a night bus reads in its own colour in both themes.

#### 16. Crowding per service
**9292 shows two or three little people under each service, with a "?" when it is unknown. OVVO says it once at the foot of the page.**

- **Build:** two or three little people under each service, and a "?" where we do not know. Busy-ness is recorded once per journey today, so each ride gets its own figure first; otherwise every service would show the same faces, which is worse than the line at the foot.
- **Where:** the service line of every ride row.
- **Size:** M, a few minutes, plus each ride getting its own figure.
- **Done when:** each service carries its own faces, an unknown one shows "?", and the foot no longer says busy-ness.

---

### The rail: changes and opened stops

#### 17. The change itself
**9292 gives a change its own row with a walking figure and the minutes you wait, printed both before and after. OVVO prints nothing on the rail for a change.**

- **Build:** a row of its own between the two services, with the walking figure and the minutes you wait, printed once arriving and once setting off, as 9292 does. The wait is already known from the two legs.
- **Where:** the rail, at every change.
- **Size:** S, under a minute: the wait is already in the two legs.
- **Done when:** a journey with a change shows the row, the minutes are the difference between the two legs, and a direct journey shows no row.

#### 18. Opening
**9292 opens every leg at once. OVVO opens one service at a time.**

- **Build:** the opened page starts with every service expanded.
- **Where:** the opened list on the rail.
- **Size:** S, under a minute: one default changes.
- **Done when:** arriving with the stops open opens all of them, and a two-train journey is checked for length before it is kept.

#### 19. The marks in an opened list
**9292 draws stops smaller and thinner, most stop rows carry no platform, and station rows stay heavier than stop rows. OVVO shows a platform on every stop row, in the same small text as the station.**

- **Build:** smaller, thinner marks for stops; no platform beside a stop; and the stations left visibly heavier than the stops around them, so the line still reads as one service.
- **Where:** the opened list on the rail.
- **Size:** S, under a minute: a smaller mark, and no platform on a stop.
- **Done when:** in an opened list the stop marks are thinner than the station marks, no stop row carries a platform, and the stations read heavier than the stops.

---

### The foot and the shell

#### 20. The facts line
**OVVO closes with "37 min walking · Expected fairly busy · Bicycle allowed". 9292 has no such line; it says walking and crowding per leg.**

- **Build:** the line goes. The walking is said on the walk rows, which already carry their minutes; the crowding moves onto each service with item 16. The bicycle keeps one short line of its own under the rail, because 9292 has no place for it and the fact is worth keeping.
- **Where:** the foot of the page.
- **Size:** S, under a minute.
- **Done when:** the three-fact line is gone, the walking and crowding are read on the legs, and the bicycle is still said once, quietly.

---

### The order to build it in

1. **The quick ones together:** 3, 5, 6, 8, 12, 20.
2. **The head:** 7, then 9 with the phone-width check, then 4.
3. **The rail's own look:** 17, 15, 19, 18.
4. **What a journey knows:** 16, 10, 11.
5. **The two features:** 2, then 1.
6. **The street map, then the two views on it:** 13 and 14.

Each group is built, checked at a phone width in both themes, deployed and pushed before the next one starts.

### Two notes, so nothing is discovered late

- **The alarm in item 1 is a browser reminder.** It fires while the page is open in a tab. The calendar entry from item 2 is the one that alarms with the site closed, so the alarm sheet offers that as the way to be sure.
- **Items 13 and 14 need a real street map.** That is a service the app does not have yet, and it costs money; it is the only part of this plan that cannot be built from what the app already holds.

### State on 26 November 2026

Re-read against the code rather than against the list below. Four items that were open when this file
was last updated are now built:

- **4. Map thumbnail**: `src/components/journey/JourneyThumbnail.tsx`, drawn from the same canvas the
  map screen uses, with its own arrow into the map.
- **9. Platform position** and **10. Two possible platforms**: `src/components/journey/LegList.tsx`,
  where the platform is beside the station on every row and an unsettled berth is printed "Platform 6
  or 7" in the warning colour.
- **15. Operator and line badge**: `LegList.tsx` splits the operator from the line number and puts the
  number in its own coloured badge.
- **17. The change itself**: `LegList.tsx` prints the wait as a row of its own between two services.

One is still open: **18. Opening.** A service opens one at a time; `stopsOpen` belongs to the service,
not to the journey, so arriving at a journey does not open every leg.

Two were not confirmed today: **7. The price** (no pale chip class was found in `JourneyCard.tsx`)
and **19. The marks in an opened list**. Treat those as open until they are looked at on a screen.

So: thirteen items are listed as done below, four more are in the code, one is open, and two are
unconfirmed.

### Done so far

Built, checked and deployed (the twenty items above are untouched by this list):

- **3. Alert counter**: gone from the top row, on every screen. The count is still the link's own
  accessible name, so a screen reader hears how many alerts there are.
- **5. Separators between the mode glyphs**: a small dot between each pair.
- **6. The change count**: the figure, the multiplication sign and the swap glyph, with the words
  kept for a screen reader.
- **8. Time weight**: the times are ordinary weight again, still numeral-aligned.
- **12. The first row**: a journey that begins at an address now says only that this is the
  starting point; a journey that begins at a stop still names the stop.
- **20. The facts line**: the three-fact line is gone; the bicycle stays as one quiet line.
- **16. Crowding per service**: each service draws its own two or three little people, or a "?" where
  nobody has counted; the foot no longer mentions it.
- **10. Two possible platforms**: an unsettled berth reads "Platform 6 or 7" in the warning colour,
  while a settled one is ordinary ink.
- **2. Share**: exactly two choices: share the journey, or save it to the calendar.
- **1. Departure alarm**: a slider with minus and plus from five minutes, Cancel and Save, and the
  minute you have to leave worked out from the journey.
- **11. Stop or station**: the ride names the stop you board at with the street the map gives for that
  exact place (`scripts/geocode-stops.mjs`, OpenStreetMap), and the arrival row names its own street.
- **13. The route link**: every walk carries a link that opens it on a real street map, the line
  routed along the streets and dashed, with Navigeer stepping street by street.
- **14. A map button on every ride**: the blue glyph at the end of each ride opens that leg alone on
  the street map, with its route, its two times and Navigeer.
## Part Two · The data and the journeys, closer to 9292

**Version 2, 18 November 2026.** The first version of this file was written from the repository's own
documents as well as its code, and several of those documents have gone stale, one of them was two
weeks old and described a feed half the size of the real one. The steerer called that out, correctly.
This version is built from **the code as it is checked out today** and **the live sources as they
answered today**, and every number below says which of the two it came from. Where something could
not be checked, it says so instead of quoting a document.

`PLAN-9292-PARITY.md` is about the journey **page**. This file is about the half underneath it: what

*Merged 26 November 2026: both are now Parts of this one file. The sentence above still reads true. Part One is the page, this part is what is underneath it.*
OVVO **knows**, and what it can **work out**.

---

### How every number in this file was checked

All of it run on **18 November 2026**, in this workspace, against the real repository and the real
internet. Nothing below is quoted from another `.md` file.

| Check | How | Result |
| --- | --- | --- |
| The archive the feed offers today | `curl -I https://gtfs.ovapi.nl/openov-nl/gtfs-openov-nl.zip` | HTTP 200, **269,701,619 bytes**, last modified **17 Nov 2026 15:29** |
| Step-free data | counted the `wheelchair_boarding` column | **2,730 of 56,853** stop rows have any value |
| What is inside it | downloaded it and counted the rows | 56,853 stops · 1,089,068 trips · 2,822 routes · 42 agencies · calendar dates **16 Nov 2026 → 11 Dec 2027** · `shapes.txt` **345,822,458 bytes** · **no `fare_attributes.txt` at all** |
| What the app actually plans with | `https://kasper-kal.github.io/OVVO/graph/index.json.gz` | built **17 Nov 2026 12:09**, **26 days**: 17 Nov → 12 Dec, **42,937 places** (the index counts stations) and **122,372 trips** and **2,000,205 connections** in a day |
| One day's manifest | `…/graph/20261118/manifest.json.gz` | built 11:52, source `NL-OPENOV-20261117-gtfs.zip`, validity 17 Nov → 12 Dec, **48,827 raw stops**, **42,937 places**, 122,471 trips, **17 slices** of two hours |
| Is the month rebuilt by itself | `gh run list --workflow timetable.yml` | **three successes**: 15 Nov (20m25s), 16 Nov (26m37s), 17 Nov (22m36s) |
| The app is alive | `https://app.ovvo.us.ci/api/health` | `{"ok":true}`, HTTP 200 |
| The live feed really answers | `…/api/live?trips=` at 02:09 UTC | **10,678 trips known**, 8 late nationally, feed stamped 02:08:26 |
| The three realtime feeds | `curl -I` each | `tripUpdates.pb` 2,525,742 B · `vehiclePositions.pb` 26,821 B · `alerts.pb` 367,620 B, all stamped **18 Nov 02:08** |
| The place lookup | `…/api/lookup/address`, `…/api/lookup/place` | both HTTP 200 with JSON |
| How many places a traveller can pick from | counted the seeds in `src/data/stops.ts` | **61** |
| What the boards hold | the generated header in `src/data/generated/boards.ts` | **60 matched stops**, 17,832 departures, **two days** (15–16 Nov), 250 departures a stop a day, dataset `NL-OPENOV-20261114` |

---

### What the first version of this file got wrong

Said plainly, because a plan built on stale numbers is worse than no plan.

1. **It said the timetable was built by hand, a week at a time, by an agent in a sandbox.** It is
   not. `.github/workflows/timetable.yml` fetches the archive, builds **28 days**, gzips them and
   publishes them to GitHub Pages **every night at 03:17**, and it has succeeded three nights running.
   The step that was written to build this ("a month of timetable, rebuilt without a person") already
   exists. Step 12 below is rewritten to what is genuinely missing.
2. **It said the planner is cut off at 12 December 2026.** The feed's *service* calendar runs to
   **11 December 2027**, and the published month is rebuilt nightly, so the calendar moves forward on
   its own. What is true is narrower: only **26 of the 28 requested days** are being published, and
   nobody has said why the last two are missing.
3. **It repeated "53,612 stops, 608,596 trips, 11.3 million stop times".** Those were measured on the
   **14 November** archive. Today's archive holds **56,853 stops and 1,089,068 trips**: the national
   feed has roughly **doubled** in trips since the figures the documents quote.
4. **It repeated "1,133,578 connections" and the search timings built on it.** A day now carries
   **2,000,205 connections**, so every cost measured in `PLAN-FREE-ROUTING.md`: the 3.96 ms and the
   12–16 ms: was measured on a graph about **half** this size. None of those timings can be quoted
   as current. That is why step 13 begins with measuring again.
5. **It said the invented alerts sit behind the sample-data switch "where they already belong".** They
   do not. `src/lib/useDisruptions.ts` returns `DISRUPTIONS` unconditionally, and
   `src/data/disruptions.ts` says in its own opening line that every alert in it is a simulated
   example. **The live site is showing invented disruptions as if they were real news.** That is a
   defect, not a plan step, and it is written up below.
6. **It said the app's own board data and the published timetable are the same timetable.** They are
   not: the boards were generated on **15 November** from the **14 November** archive, while the
   published graph was rebuilt on **17 November** from the **17 November** archive.

Two things the first version got right, which the code confirms: the picker really does search only
the app's own 61 places, and the realtime decoder really does read nothing but a delay per trip.

---

### Two defects found while checking, neither fixed here

Named because the plan must not quietly build on top of them. This file is a plan; fixing product
code is a separate request.

- **Invented disruptions are served in production.** `useDisruptions()` and `disruptions()` return the
  demonstration list in every build, including the deployed one, and the list's own opening comment
  says every alert in it is simulated. A traveller reading it is being told something untrue about
  today's network. The cheapest honest fix is the switch that `src/data/departures.ts` already uses
  (`SAMPLE_DATA_ALLOWED`), so that a production build shows no alert until a real source is connected
, which is what step 9 connects.
- **The boards are three days behind the graph.** The published month is rebuilt nightly from the
  newest archive; the boards shipped inside the app are regenerated only when somebody runs the
  builder by hand, and were last run on 15 November. Step 12 folds the two into one nightly job.

---

### What the steerer has accepted, in his words

On 18 November 2026 he wrote that he **acknowledges and accepts** that these four are not coming:

- **e-tickets**
- **OV-chipkaart balance**
- **subscription advice**
- **operator crowding data**

All four need something no free source offers: a commercial agreement with the carriers, a
traveller's own payment account, or a count of passengers only the operator holds. None of the
fourteen steps depends on them, and none pretends to stand in for one.

---

### The two rules every step obeys

1. **No card, ever.** Every source below is free and needs no account.
2. **No invention.** A missing delay is said to be missing; a missing fare is left empty; a search
   with no answer says so. `src/lib/dataMode.ts` is the switch that enforces the second rule on
   everything that consults it, and the defect above is what happens where something does not.

---

### Where OVVO actually stands today

**Real, working, and checked today.**

- **The national timetable is in, and it is national.** The archive the app was built from is the
  17 November one: 42 agencies, 56,853 stops, 1,089,068 trips, service dates to 11 December 2027.
- **The month is built and published every night, by itself**: 26 days, gzipped, on GitHub Pages,
  free for a public repository. The app fetches one day at a time and keeps it on the device
  (`src/planner/graph.ts`).
- **The search is real and runs in the browser** over that graph. It returns up to four journeys,
  and it already handles the small hours by searching the previous service day as well, which is why
  a 03:00 bus is found (`planRealJourneys`).
- **Boards are real for 60 stops**: 17,832 scheduled departures over two days, each row carrying the
  feed's own trip id, and a stop the feed knows is never answered with an invented time
  (`boardForStop` in `src/data/departures.ts`).
- **Live delays are real** for the trips a board or a journey is showing: the worker reads the
  national feed and answers on `/api/live`, which returned **10,678 known trips** when asked today.
- **The streets are real**: OpenStreetMap tiles and OpenStreetMap's foot router, from the browser,
  no key (`src/lib/streetMap.ts`).
- **The place lookup works in production**: `/api/lookup/address` and `/api/lookup/place` both
  answered 200 today, through the app's own worker, with the edge caching the reply.

**Not real, and what the fourteen steps are about.**

- **A traveller can pick from 61 places.** `src/components/journey/StopPicker.tsx` and
  `src/lib/stopSearch.ts` search `STOPS`; one published day holds **42,937 places** (48,827 raw
  stops). The data is already published and already cached, the picker simply never looks at it.
  **This is the biggest gap in the product.**
- **The search leaves at a time; it cannot arrive by one.** `planRealJourneys(day, origin,
  destination, startMinutes)`.
- **The preferences are not applied.** Modes, walking, changes, step-free and bicycle are stored and
  the search reads none of them.
- **The alerts are invented**, and shown, which is the defect above. The real feed (`alerts.pb`,
  367,620 bytes today) is read by nothing.
- **The line is not drawn where it runs.** `shapes.txt` is 345,822,458 bytes of real geometry and is
  read by nothing.
- **Fares are impossible from the feed**, and now that is a measurement rather than an opinion: the
  archive contains **no `fare_attributes.txt`** and **no `fare_rules.txt`**: only two `ticketing_*`
  files of 36 and 73 bytes.
- **Long journeys were measured on a graph half the size of today's**, so whether they still fit the
  free allowance is **unknown until re-measured**.
- **The month publishes 26 days, not 28**, and nothing watches the job that does it.

**One sentence for the gap.** OVVO can plan a real journey between the 61 places it chose, leaving at
a time you pick, with real times, real platforms and real live delays once you are on it; 9292 plans
between any two addresses in the country, either leaving or arriving, with real alerts, a fare, the
line drawn where it runs, and another way round when your train is cancelled.

---

### How the sizes are given

The UI plan measured its sizes in minutes, twice, and those numbers are real; they do not transfer to
pipeline work. So: **S** an afternoon, **M** a day or two, **L** most of a week, **XL** a week or more:
every one an estimate, corrected in this file in the same turn it proves wrong.

---

### State on 26 November 2026

This file was written on 18 November and carries no status column, so it is read here against the
code in the repository today:

- **1 and 2 (every place, a board for every stop)**: `src/data/stops.ts` holds 70 entries with
  `src/data/stop-streets.json` beside it, and every stop has a page (`StopDetailPage.tsx`).
- **3. Arriving by a time**: `arriveBy` is handled in `src/pages/ResultsPage.tsx`.
- **5. An address, a postcode or a place**: `StopPicker.tsx` and `LegList.tsx` both geocode, and the
  stops carry street names.
- **6. Door to door**: walks are legs of their own in `LegList.tsx`.
- **8. Live delays**: the live feed is read on the server and drawn beside the planned time.
- **12. The nightly month**: `scripts/gtfs-pipeline.mjs` and `scripts/gtfs/` build the days;
  `scripts/exclude-local-graph.mjs` keeps the local graph out of the build.

The rest of the fourteen were not re-measured on 26 November 2026, and this file's own test is a
**Done when** line that has to be run, so they stay open until somebody runs them. What has changed
since 18 November is that the search itself ships: `PLAN-FREE-ROUTING.md` is the record of that, and
the journey planner is real rather than a plan.

### The fourteen steps

#### 1. Every place in the country, in the picker

**9292:** any stop, station, village, street or landmark. **OVVO:** 61 places.

**Build.** A place index generated from the same graph the search reads: every stop, station and
grouped place (`placesOf` in `src/planner/graph.ts`) with name, town and position, built by the
nightly job so it can never drift from the timetable. The picker keeps `rankStops` as its only
ranking function, so the short list and the full list cannot disagree.
**Where.** A new step beside `scripts/gtfs/build-app-data.mjs`; the loader in `src/lib/stopSearch.ts`;
the picker and combobox read the index and fall back to `STOPS`.
**Data.** Already published. Nothing new is downloaded.
**Size.** L: the build is small; the work is every screen that assumes a stop is one of 61.
**Done when.** A stop outside the 61 is found, plans a journey, and every leg opens. Checked with a
deliberately obscure stop, not Utrecht.

**The risk, named.** Tens of thousands of places is megabytes on a phone. Measure the file; if it is
heavy, shard by first letter and fetch the shard being typed into.

#### 2. A board for every stop, not sixty

**9292:** every stop in the country has a board. **OVVO:** 60 stops, two days, 250 departures a stop.

**Build.** Boards generated per stop and per day into static files fetched when a stop opens, instead
of one 1.6 MB TypeScript module holding all of them: 26 KB a stop cannot become 43,000 stops in one
file. Generated by the nightly job, from the same archive as the graph, so the board and the planner
can never be describing different timetables.
**Where.** `scripts/gtfs/build-app-data.mjs` becomes a sharded builder; the board hook reads a shard.
**Size.** L.
**Done when.** A stop outside the 60 opens with real departures and real trip ids, the live delays
join to them, and the deployed site stays inside the host's file limits.

**The constraint that shapes it.** Static assets are capped at **20,000 files**, so one file a stop is
not allowed. Shard by the first letters of the stop id, and fetch the shard on demand.

#### 3. Leaving at a time, and arriving by one

**9292:** both. **OVVO:** leaving only.

**Build.** The same search run backwards over the same graph: start at the destination at the arrival
time and walk the connections in reverse. *Leave at* / *Arrive by* above the time, remembered per
search. The small-hours rule already in `planRealJourneys` has to hold in both directions.
**Size.** M: the scan is the easy half; proving it agrees with the forward search on ten known
journeys is the half that matters.
**Done when.** "Arrive by 09:00 in Amsterdam" returns only journeys that arrive at or before 09:00,
and the same journey found forwards and backwards has the same legs.

#### 4. Preferences that are actually applied, or said not to be

**9292:** honours them. **OVVO:** stores them and ignores them.

**Build.** Apply what the graph supports with no new data: allowed modes, maximum changes, walking
speed and longest walk, bicycle. Step-free stays **not supported** and says so, measured today, only
**2,730 of 56,853 stop rows** carry a `wheelchair_boarding` value at all, so a step-free claim would
rest on a column that is 95% blank.
**Size.** M.
**Done when.** Trains off returns no trains; at most one change returns at most one; every preference
the search ignores is shown as unsupported with a reason.

#### 5. An address, a postcode, or a place: not only a station

**9292:** door number to door number. **OVVO:** stops only, though the lookup behind it already runs.

**Build.** Forward search that turns what was typed into a place: the stop index first, then an
address or landmark, then the nearest stop with services, with the distance stated and which of the
two the traveller got. The worker already answers `/api/lookup/address` and `/api/lookup/place`
(checked today, 200), and the edge caches it; what is missing is the picker using it and the result
becoming a journey end.
**Data.** OpenStreetMap's Nominatim, free, no key, **with its usage policy honoured**: one request a
second, no per-keystroke autocomplete, answers cached, attribution shown.
**Size.** L.
**Done when.** A street and number in a town with no station among the 61 plans a journey, the walk to
the stop is its own leg with its own minutes, and the attribution is on screen.

#### 6. Door to door: the walk at both ends

**9292:** door to platform, platform to door. **OVVO:** walks between stops within 400 m.

**Build.** The first and last walk as real foot routes from the address to the boarding stop, timed by
the router rather than a straight line, folded into the departure minute so the alarm and the leave-by
minute are right.
**Where.** `src/lib/streetMap.ts` already routes and caches; the ends must use it.
**Size.** L.
**Done when.** A journey from an address starts with a timed walk that follows streets and is
included in the total.

#### 7. The line, where the line actually runs

**9292:** the real track and road. **OVVO:** a path through the stops; `shapes.txt` unread.

**Build.** Read `shapes.txt` in the graph builder, keep one decimated polyline per pattern, draw it
under the journey and on the journey's map. At 345,822,458 bytes it is the largest file in the archive
and must never reach a phone whole: decimate in the build, not in the browser.
**Size.** M.
**Done when.** A train's line follows the railway and a bus's follows the roads it is timetabled on,
checked against the same journey in 9292.

#### 8. Live delays on the journey, and the platform change and the cancellation too

**9292:** a cancelled train is cancelled on screen. **OVVO:** a delay in seconds, per trip, nothing
else: the decoder in `shared/live-feed.mjs` reads the trip id, its start date, its route and the
delay, and skips every other field.

**Build.** Decode the rest of what the feed already carries for each stop of each trip: a skipped
stop, a cancelled trip, and a platform that differs from the timetable's. Draw each where it belongs,
and never infer one from a similar-looking service number.
**Size.** M.
**Done when.** A cancelled trip shows as cancelled and not on time; a skipped stop is not offered as a
place to get off; a platform the feed moves is moved on screen with the timetable's still visible.

#### 9. Real service alerts, instead of the invented ones

**9292:** what is wrong today on the line you are looking at. **OVVO:** a simulated list, shown in
production, which is the defect above.

**Build.** First make the honest state true: with no real source, a production build shows **no**
alerts. Then read `alerts.pb` (367,620 bytes today), decode the header, the period and what each alert
is about (a stop, a line, a trip) and show those. An alert the feed does not name is not shown; a
feed that cannot be read says so.
**Size.** L.
**Done when.** The disruptions screen lists only alerts the feed is carrying, an expired one
disappears, a journey shows the alerts touching its own stops and lines, and a build with the feed
unreachable shows an honest empty state rather than a simulated one.

#### 10. Plan it again when the leg is cancelled

**9292:** another way when yours falls over. **OVVO:** shows the delay and stops.

**Build.** When a leg is cancelled or a change becomes impossible, search again from the stop you are
standing at, at the minute you are standing there, and offer the alternatives above the broken
journey.
**Size.** L.
**Done when.** A journey with a cancelled leg offers at least one alternative that does not use it,
and says plainly when there is none.

#### 11. A price, if there is an honest one to show

**9292:** the fare before you travel. **Not one of the four he accepted**, so it stays in scope, with
a condition.

**Build, and stop where the truth stops.**

1. Confirmed today: the archive has **no `fare_attributes.txt` and no `fare_rules.txt`**. There is no
   fare in the timetable and computing one from it is impossible by construction.
2. Then look for a published, machine-readable tariff: the national OV-chipkaart rate and each
   carrier's own published rates (NS publishes its own). Verify the date of the rate and the distance
   rule.
3. If a published rule exists, compute per leg and label it as computed, with source and date, and say
   when the journey crosses carriers.
4. If none can be verified, **show nothing** and say fares are not available. That is a finished
   outcome, not a failure.

**Size.** M to find out; L to build properly.
**Done when.** Either a fare appears with its source and date, or the page says fares are unavailable
, and no number anywhere is a guess dressed as a price.

#### 12. The nightly month: keep it honest, and fold the boards into it

**This step already exists and runs.** `.github/workflows/timetable.yml` fetches, verifies, builds 28
days, gzips and publishes to GitHub Pages at 03:17 every night; three runs are recorded, the longest
26m37s. What is missing is smaller and more dangerous than what the first version of this file
imagined.

**Build.**

1. **Find the two missing days.** The job asks for 28 and publishes **26** (17 Nov → 12 Dec). Nobody
   has written down why; the build must say, per day, whether it built and if not why, and fail when a
   day inside the feed's window is missing.
2. **Fold the boards in.** The 60-stop board file is generated by hand and is currently three days
   behind the graph. One nightly job, one archive, both outputs, one timestamp.
3. **Watch it.** A failed night must reach a human: a failed Action is free to notify, and a
   `builtAt` older than 36 hours should make the app say its timetable is stale rather than plan from
   it silently.
4. **Say the window.** The app should say which days it can plan, and say plainly that a day past the
   window is not available.

**Size.** M.
**Done when.** Thirty consecutive nights pass with no hand on it, the built day count equals the days
the feed supports, the boards carry the same archive hash as the graph, and a deliberately broken run
fails loudly and leaves the previous month serving.

#### 13. Long journeys: measure again, then find the miss, then the cost

**9292:** answers a cross-country journey correctly and quickly. **OVVO:** unknown today, and that is
the honest position.

**Build, in this order.**

1. **Re-measure first.** Every timing in `PLAN-FREE-ROUTING.md` was taken on a graph of 1,133,578
   connections; a day today holds **2,000,205**. Re-run the ten golden journeys and record the real
   cost before any optimisation is planned. The free allowance is 10 ms of processor time per
   request.
2. **Find the miss.** The known disagreement: Utrecht Centraal → Groningen arriving 30 minutes late
   against the reference search: was narrowed by elimination and never found. Make the fast search
   record the path it took, leg by leg, the way the reference scan does, and compare the two on that
   one journey. A recording shows a missed boarding in one run where tuning failed five times.
3. **Then the cost**, only once the answer is right: a two-way search that meets in the middle, or a
   scan that visits only what it has reached. If neither fits, the longest journeys run on a free
   runtime with a bigger allowance and this file says so.

**Where.** `src/planner/graph.ts` and `scripts/routing/raptor.mjs`, which must stay in step.
**Size.** L, open-ended until the recording exists.
**Done when.** The golden journeys agree with the reference search, that Groningen journey included,
and today's processor cost for each is written into this file.

#### 14. The vehicles, on the map

**9292:** where the bus actually is. **OVVO:** nowhere; `vehiclePositions.pb` (26,821 bytes at 02:08
today) is read by nothing.

**Build.** Read the vehicle feed, match each vehicle to a trip the app is showing by the feed's own
trip id, draw it on the map with its age stated. A vehicle the feed does not name is not drawn; a feed
gone quiet shows the last known position with the minute it was seen.
**Size.** M.
**Done when.** Opening the map on a live journey shows the vehicle moving, and a stale feed shows age
rather than motion.

---

### The order to do it in

By what a traveller notices first, not by what is easiest.

0. **The two defects**, first, because they are small and they are currently telling travellers
   something untrue: production showing invented alerts, and boards three days behind the graph.
1. **The picker and the boards**: 1, then 2. Until these are done most of the country cannot use the
   app, and every later step improves something most people cannot reach.
2. **The question itself**: 3, then 4.
3. **What is happening now**: 8, then 9, then 10.
4. **From a door**: 6, then 5.
5. **The picture**: 7.
6. **The price**: 11, only as far as a verified source goes.
7. **Keeping it alive**: 12. It runs, so this is the smallest step here and the one that protects
   everything else.
8. **The hard two**: 13, then 14.

Each group is built, checked at a phone width in both themes, deployed and pushed before the next
starts. No step is a rewrite: each adds a source or a capability to code that exists.

---

### How we will know it is at parity

By sitting with 9292 and OVVO side by side and comparing twelve things:

1. A journey between two villages, neither among the 61.
2. A journey from a street address to a street address.
3. The same journey asked for by arrival time.
4. A Sunday, and a public holiday.
5. After midnight, and across the clock change.
6. A board at a small stop at 07:00.
7. A board at a large station at 07:00, row by row for platform and time.
8. A journey on a line with a live delay, against the operator's own app.
9. A journey with a cancellation.
10. A journey whose line has an alert against it.
11. A long cross-country journey, timed with a stopwatch in both.
12. The same journey planned twice, a minute apart, to watch the live data move.

When all twelve answer the same way, the data and the planning are at parity. Anything that still
differs is written into this file with the reason.

---

### What will still be missing when all fourteen are done

- **The four he accepted**: e-tickets, OV-chipkaart balance, subscription advice, operator crowding.
- **9292's own data.** 9292 is a carrier-owned company with data and agreements OVVO will never hold;
  its `Reisadvies API` is licensed and forbids use without approval, so it is not a source and will
  not be scraped.
- **Selling a journey**, international or otherwise. Times can be planned where a free feed covers
  them; a ticket cannot be sold.
- **A day past the feed's window.** Honest unavailable, not quietly extended.

---

### What this costs

Nothing. Every source named here is free and needs no account: the national timetable and its three
realtime feeds, OpenStreetMap's tiles, foot router and geocoder, GitHub Pages for the month, and the
repository's own free Actions allowance for the nightly build.

The only real cost is **weight on the traveller's phone**, measured rather than assumed: a published
day is 17 slices of two hours, about 2.6 MB gzipped for one middle slice checked today, and a
repeat search on the same day costs nothing because the day is kept on the device.

---

### What this plan will not do

- No paid service, no card, no trial.
- No scraping 9292 or any carrier's private interface.
- No invented delay, platform, alert, fare or journey in a production build.
- No preference shown as applied when the search ignored it.
- No step ticked because its screen exists: a step is done when its **Done when** line has been run
  and passed, and this file records the run.
