# PLAN-LIVE-DATA.md

**Status: not started. Nothing in this file has been built.** Trigger: say **Start Phase N**.

**Written 28 November 2026**, after reading the code in this repository, not from a summary. It
replaces the idea, still standing in the company's portfolio record, that OVVO runs on data built
into the build. It does not. Journeys, timetables and live delays are already real.

---

## The short version

OVVO already plans real journeys from the national Dutch timetable, and already shows real live
delays inside a journey. Four things are not true yet, and this plan makes them true, in this order:

1. The disruptions screen still shows an invented list, even in a production build.
2. The stop boards are a file committed by hand, so they can fall behind the timetable silently.
3. A board shows the scheduled time only, with no delay, while the journey screen next to it shows
   one.
4. Seven places on the map have no real board, and the longest journeys run over the free-time budget.

Then the official portal paperwork, which costs nothing and removes the one dependency that has no
contract behind it.

---

## What is already real, measured from this repository on 28 November 2026

| Piece | State | Where |
| --- | --- | --- |
| National timetable | Real, from the OVAPI feed, downloaded and validated, 28 days at a time | `scripts/gtfs/fetch.mjs` |
| Journey planning | Real, in the browser, over a graph built from that timetable | `src/planner/realSearch.ts`, `src/pages/ResultsPage.tsx` |
| Live delays in a journey | Real, read by the Worker from the national feed, 25 second cache, a 429 falls back to the last good answer | `worker/live.js`, `shared/live-feed.mjs` |
| Stop boards | Real scheduled departures for 53 of the app's 60 stops, spread across the day rather than stopped at 250 | `src/data/generated/boards.ts` |
| Nightly timetable refresh | A scheduled workflow that rebuilds the month and publishes it as static files | `.github/workflows/timetable.yml` |
| Nothing fake in a production build | Sample boards are refused outside a development run | `src/lib/dataMode.ts` |

So this is not a "make it real" plan. It is a "make the last parts honest and keep them fresh" plan.

---

## Status checklist

- [ ] Phase 1: No invented alert survives a production build
- [ ] Phase 2: The boards refresh themselves
- [ ] Phase 3: Live delays on the boards
- [ ] Phase 4: Every place on the map has an honest board
- [ ] Phase 5: The long journey fits the budget
- [ ] Phase 6: The official footing and a proven fallback
- [ ] Phase 7: The ride's line on the map

---

## Phase map

| Phase | Repository | What it fixes | Done test |
| --- | --- | --- | --- |
| 1 | OVVO | `useDisruptions` returns the built-in list in production | A production build shows an honest empty state, and a check fails if the list comes back |
| 2 | OVVO | `boards.ts` is a hand-run file with a 15 November stamp | The published boards carry the current archive's date and hash, and a stale board fails a check |
| 3 | OVVO | Boards show no delay while journeys do | A real delayed service shows its delay on a stop board, and a feed failure says so instead of showing zero |
| 4 | OVVO | 7 of 60 places have no board | Every place either has a real board or is labelled as not a stop |
| 5 | OVVO | Long journeys exceed 10 ms; two known wrong answers | The golden journeys agree with the exhaustive scan, and the Worker measurement is under budget |
| 6 | OVVO | All data comes through one volunteer service | The portal agreement is signed and the fallback feed is proved once |
| 7 | OVVO | A ride's line is drawn stop to stop | A train leg follows its real shape, with the ODbL attribution it requires |

---

## Phase 1: No invented alert survives a production build

**The fault, read in the code:** `src/lib/useDisruptions.ts` imports `DISRUPTIONS` from
`src/data/disruptions` and returns it for every visitor. The only conditions are two developer
switches. There is no production gate, so a live visitor sees invented alerts today.

| # | Change | Done test |
| --- | --- | --- |
| 1.1 | `useDisruptions` reads the real alert feed through the Worker, and returns an empty list with a reason when the feed cannot be read | With the network off, the screen says alerts are unavailable, and shows no alert |
| 1.2 | The built-in list moves behind `dataMode`, so it exists only in a development run | A production build has no path that can return a built-in alert |
| 1.3 | Every screen that lists an alert uses the same source | The header count, the alerts page and the journey alert row agree in one screenshot |
| 1.4 | A check that fails on purpose | Delete the gate and watch the check fail, then put it back and watch it pass |

**Phase check:** `npm run build` passes, and the new check reports the production build clean. The
new route answers with a real alert from `alerts.pb`, quoted with its age.

**Needs him:** nothing. **Size:** moderate, one Worker route and three screens.

---

## Phase 2: The boards refresh themselves

**The fault, read in the code:** `boards.ts` is generated by `build-app-data.mjs`, run by hand, and
its own header still says `generatedAt: 2026-11-15`. The nightly workflow rebuilds the month of
journey data but never touches the boards, so the two can disagree for weeks with nothing on screen
to say so.

| # | Change | Done test |
| --- | --- | --- |
| 2.1 | The nightly workflow runs `build-app-data.mjs` and commits the result | A scheduled run changes the file's stamp without a human |
| 2.2 | The stamp carries the archive name, its hash and the date it was built, and the app shows the date | The board's foot names the timetable it came from |
| 2.3 | The app refuses a board whose stamp is older than the timetable it is served with | A deliberately stale board shows an honest unavailable state instead of a week-old board |
| 2.4 | The check fails on purpose | Age the stamp by hand and watch the build fail |

**Phase check:** two consecutive nightly runs produce two different stamps, and the board foot shows
the newer one. `npm run build` passes.

**Needs him:** nothing. **Size:** small.

---

## Phase 3: Live delays on the boards

**The gap:** `worker/live.js` already answers live delays for a list of trip ids, with a 25 second
cache and a fallback when the feed rate-limits. The journey screen uses it. The board does not, so a
board and the journey beside it can disagree about the same train.

| # | Change | Done test |
| --- | --- | --- |
| 3.1 | A board asks for the trips it is showing, in one request | One request per board view, never one per row |
| 3.2 | A row shows a delay, a cancellation, or nothing. Never a made-up zero | A cancelled service reads as cancelled, not as on time |
| 3.3 | When the feed cannot be read, the board says it is showing scheduled times only | Pull the network and watch the sentence appear |
| 3.4 | The cache is honoured, so a busy board cannot rate-limit the feed | Repeated views inside 25 seconds make one upstream request |

**Phase check:** a real delayed service, found from the feed, shows its delay on the board, quoted
with the feed's age. A 429 leaves the board scheduled and labelled, not blank.

**Needs him:** nothing. **Size:** moderate.

---

## Phase 4: Every place on the map has an honest board

**The gap, measured:** 53 of 60 places matched a real stop. The seven that did not are Vondelpark,
Anne Frank House, Binnenhof, Erasmusbrug, Markthal, Domtoren and the Buiksloterweg ferry. Six are
landmarks, which are not stops in the feed at all; the ferry differs only by its name in the feed.

| # | Change | Done test |
| --- | --- | --- |
| 4.1 | The ferry is matched by its real name in the feed | The ferry shows its real departures |
| 4.2 | A landmark shows the nearest real stops instead of an empty board | Opening the Anne Frank House offers real stops within walking distance |
| 4.3 | No place ever shows an empty board with no explanation | Every board with no rows says why in one line |

**Phase check:** all 60 places answer, and the ones that are not stops say what they are instead.
Both widths looked at.

**Needs him:** which is right for a landmark, nearest stops or a plain "this is not a stop". One
line from him settles it. **Size:** small.

---

## Phase 5: The long journey fits the budget

**The gap, measured on 15 November 2026:** ordinary journeys cost 3.5 to 8 ms, comfortably inside
the free 10 ms per request. The longest do not: Utrecht to Maastricht 17.8 ms, Rotterdam to Groningen
17.1 ms. Two answers also disagree with the exhaustive scan: Rotterdam to Groningen arrives five
minutes later here, and Utrecht to Maastricht was not found by the scan at all.

| # | Change | Done test |
| --- | --- | --- |
| 5.1 | The scan visits only stops it has reached, so a long journey costs proportionally less | The four long pairs come under budget |
| 5.2 | A station resolves to its platforms the same way in both methods | Utrecht to Maastricht agrees between the two |
| 5.3 | The last catchable trip rule is corrected so no connection is skipped | Rotterdam to Groningen agrees to the minute |
| 5.4 | The budget is measured in the Worker, not only in Node | The number is quoted from a deployed run |

**Phase check:** `npm run check:journeys` passes on a fixed list of pairs, and the Worker figures are
written into this file with the date they were taken.

**Needs him:** nothing. **Size:** the largest phase, and the one most likely to need a second round.

---

## Phase 6: The official footing and a proven fallback

**Why:** every feed today comes from OVAPI, one volunteer service with no contract. The data behind
it is CC0, released by the carriers through the national portal, and access to the portal is free
after a short form and a signature. That gives OVVO an official footing and somewhere to go if the
volunteer service stops.

| # | Change | Done test |
| --- | --- | --- |
| 6.1 | Record the source, licence, date checked, and the one line about not representing the carriers | Four lines in `REAL-DATA.md`, and a note in the repository README |
| 6.2 | Sign the portal agreement | Access confirmed with a development and a production credential |
| 6.3 | One setting chooses the feed base, with OVAPI as the default | A single line switches the app to the portal feed |
| 6.4 | Prove the fallback once, on a real board | The board answers from the second source, and the log says which was used |

**Phase check:** the app runs on its default source, and a recorded run shows the fallback answering.
The licence and the date are written down where the next person will look.

**Needs him:** his name and email on the portal form, and a yes to signing. **Size:** small, mostly
waiting.

---

## Phase 7: The ride's line on the map

**The gap:** a train's line is still drawn from stop to stop, while a walk already follows real
streets. The route shapes are already in the timetable file and are read by nothing.

| # | Change | Done test |
| --- | --- | --- |
| 7.1 | The graph carries each trip's shape, reduced so it stays inside the file budget | The line follows the track, not the crow |
| 7.2 | The shape licence is honoured | The ODbL attribution required for route shapes appears where the map does |

**Phase check:** one intercity leg and one bus leg are followed on the map and look right at both
widths, with the attribution visible.

**Needs him:** nothing. **Size:** moderate, and safely last.

---

## Phase rules

1. One phase per turn. Finish it, check it, tick it, stop.
2. A phase is done when its done test has been run, not when the file is written.
3. Nothing invented is ever shown to make a screen look complete. No delay, no alert, no board row.
4. No paid service, ever. Every step here runs on what is already free.
5. Both widths are looked at for anything a traveller sees.
6. A check that has not been broken on purpose is not trusted yet.
7. The portfolio record is corrected the same day a phase changes what is true about OVVO.
