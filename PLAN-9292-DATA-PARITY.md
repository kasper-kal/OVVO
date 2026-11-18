# The plan: the data and the journeys, closer to 9292

**Version 2, 18 November 2026.** The first version of this file was written from the repository's own
documents as well as its code, and several of those documents have gone stale — one of them was two
weeks old and described a feed half the size of the real one. The steerer called that out, correctly.
This version is built from **the code as it is checked out today** and **the live sources as they
answered today**, and every number below says which of the two it came from. Where something could
not be checked, it says so instead of quoting a document.

`PLAN-9292-PARITY.md` is about the journey **page**. This file is about the half underneath it: what
OVVO **knows**, and what it can **work out**.

---

## How every number in this file was checked

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

## What the first version of this file got wrong

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
   **14 November** archive. Today's archive holds **56,853 stops and 1,089,068 trips** — the national
   feed has roughly **doubled** in trips since the figures the documents quote.
4. **It repeated "1,133,578 connections" and the search timings built on it.** A day now carries
   **2,000,205 connections**, so every cost measured in `PLAN-FREE-ROUTING.md` — the 3.96 ms and the
   12–16 ms — was measured on a graph about **half** this size. None of those timings can be quoted
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

## Two defects found while checking, neither fixed here

Named because the plan must not quietly build on top of them. This file is a plan; fixing product
code is a separate request.

- **Invented disruptions are served in production.** `useDisruptions()` and `disruptions()` return the
  demonstration list in every build, including the deployed one, and the list's own opening comment
  says every alert in it is simulated. A traveller reading it is being told something untrue about
  today's network. The cheapest honest fix is the switch that `src/data/departures.ts` already uses
  (`SAMPLE_DATA_ALLOWED`), so that a production build shows no alert until a real source is connected
  — which is what step 9 connects.
- **The boards are three days behind the graph.** The published month is rebuilt nightly from the
  newest archive; the boards shipped inside the app are regenerated only when somebody runs the
  builder by hand, and were last run on 15 November. Step 12 folds the two into one nightly job.

---

## What the steerer has accepted, in his words

On 18 November 2026 he wrote that he **acknowledges and accepts** that these four are not coming:

- **e-tickets**
- **OV-chipkaart balance**
- **subscription advice**
- **operator crowding data**

All four need something no free source offers: a commercial agreement with the carriers, a
traveller's own payment account, or a count of passengers only the operator holds. None of the
fourteen steps depends on them, and none pretends to stand in for one.

---

## The two rules every step obeys

1. **No card, ever.** Every source below is free and needs no account.
2. **No invention.** A missing delay is said to be missing; a missing fare is left empty; a search
   with no answer says so. `src/lib/dataMode.ts` is the switch that enforces the second rule on
   everything that consults it — and the defect above is what happens where something does not.

---

## Where OVVO actually stands today

**Real, working, and checked today.**

- **The national timetable is in, and it is national.** The archive the app was built from is the
  17 November one: 42 agencies, 56,853 stops, 1,089,068 trips, service dates to 11 December 2027.
- **The month is built and published every night, by itself** — 26 days, gzipped, on GitHub Pages,
  free for a public repository. The app fetches one day at a time and keeps it on the device
  (`src/planner/graph.ts`).
- **The search is real and runs in the browser** over that graph. It returns up to four journeys,
  and it already handles the small hours by searching the previous service day as well, which is why
  a 03:00 bus is found (`planRealJourneys`).
- **Boards are real for 60 stops** — 17,832 scheduled departures over two days, each row carrying the
  feed's own trip id — and a stop the feed knows is never answered with an invented time
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
  stops). The data is already published and already cached — the picker simply never looks at it.
  **This is the biggest gap in the product.**
- **The search leaves at a time; it cannot arrive by one.** `planRealJourneys(day, origin,
  destination, startMinutes)`.
- **The preferences are not applied.** Modes, walking, changes, step-free and bicycle are stored and
  the search reads none of them.
- **The alerts are invented** — and shown, which is the defect above. The real feed (`alerts.pb`,
  367,620 bytes today) is read by nothing.
- **The line is not drawn where it runs.** `shapes.txt` is 345,822,458 bytes of real geometry and is
  read by nothing.
- **Fares are impossible from the feed**, and now that is a measurement rather than an opinion: the
  archive contains **no `fare_attributes.txt`** and **no `fare_rules.txt`** — only two `ticketing_*`
  files of 36 and 73 bytes.
- **Long journeys were measured on a graph half the size of today's**, so whether they still fit the
  free allowance is **unknown until re-measured**.
- **The month publishes 26 days, not 28**, and nothing watches the job that does it.

**One sentence for the gap.** OVVO can plan a real journey between the 61 places it chose, leaving at
a time you pick, with real times, real platforms and real live delays once you are on it; 9292 plans
between any two addresses in the country, either leaving or arriving, with real alerts, a fare, the
line drawn where it runs, and another way round when your train is cancelled.

---

## How the sizes are given

The UI plan measured its sizes in minutes, twice, and those numbers are real; they do not transfer to
pipeline work. So: **S** an afternoon, **M** a day or two, **L** most of a week, **XL** a week or more
— every one an estimate, corrected in this file in the same turn it proves wrong.

---

## The fourteen steps

### 1. Every place in the country, in the picker

**9292:** any stop, station, village, street or landmark. **OVVO:** 61 places.

**Build.** A place index generated from the same graph the search reads — every stop, station and
grouped place (`placesOf` in `src/planner/graph.ts`) — with name, town and position, built by the
nightly job so it can never drift from the timetable. The picker keeps `rankStops` as its only
ranking function, so the short list and the full list cannot disagree.
**Where.** A new step beside `scripts/gtfs/build-app-data.mjs`; the loader in `src/lib/stopSearch.ts`;
the picker and combobox read the index and fall back to `STOPS`.
**Data.** Already published. Nothing new is downloaded.
**Size.** L — the build is small; the work is every screen that assumes a stop is one of 61.
**Done when.** A stop outside the 61 is found, plans a journey, and every leg opens. Checked with a
deliberately obscure stop, not Utrecht.

**The risk, named.** Tens of thousands of places is megabytes on a phone. Measure the file; if it is
heavy, shard by first letter and fetch the shard being typed into.

### 2. A board for every stop, not sixty

**9292:** every stop in the country has a board. **OVVO:** 60 stops, two days, 250 departures a stop.

**Build.** Boards generated per stop and per day into static files fetched when a stop opens, instead
of one 1.6 MB TypeScript module holding all of them — 26 KB a stop cannot become 43,000 stops in one
file. Generated by the nightly job, from the same archive as the graph, so the board and the planner
can never be describing different timetables.
**Where.** `scripts/gtfs/build-app-data.mjs` becomes a sharded builder; the board hook reads a shard.
**Size.** L.
**Done when.** A stop outside the 60 opens with real departures and real trip ids, the live delays
join to them, and the deployed site stays inside the host's file limits.

**The constraint that shapes it.** Static assets are capped at **20,000 files**, so one file a stop is
not allowed. Shard by the first letters of the stop id, and fetch the shard on demand.

### 3. Leaving at a time, and arriving by one

**9292:** both. **OVVO:** leaving only.

**Build.** The same search run backwards over the same graph: start at the destination at the arrival
time and walk the connections in reverse. *Leave at* / *Arrive by* above the time, remembered per
search. The small-hours rule already in `planRealJourneys` has to hold in both directions.
**Size.** M — the scan is the easy half; proving it agrees with the forward search on ten known
journeys is the half that matters.
**Done when.** "Arrive by 09:00 in Amsterdam" returns only journeys that arrive at or before 09:00,
and the same journey found forwards and backwards has the same legs.

### 4. Preferences that are actually applied, or said not to be

**9292:** honours them. **OVVO:** stores them and ignores them.

**Build.** Apply what the graph supports with no new data: allowed modes, maximum changes, walking
speed and longest walk, bicycle. Step-free stays **not supported** and says so — measured today, only
**2,730 of 56,853 stop rows** carry a `wheelchair_boarding` value at all, so a step-free claim would
rest on a column that is 95% blank.
**Size.** M.
**Done when.** Trains off returns no trains; at most one change returns at most one; every preference
the search ignores is shown as unsupported with a reason.

### 5. An address, a postcode, or a place — not only a station

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

### 6. Door to door: the walk at both ends

**9292:** door to platform, platform to door. **OVVO:** walks between stops within 400 m.

**Build.** The first and last walk as real foot routes from the address to the boarding stop, timed by
the router rather than a straight line, folded into the departure minute so the alarm and the leave-by
minute are right.
**Where.** `src/lib/streetMap.ts` already routes and caches; the ends must use it.
**Size.** L.
**Done when.** A journey from an address starts with a timed walk that follows streets and is
included in the total.

### 7. The line, where the line actually runs

**9292:** the real track and road. **OVVO:** a path through the stops; `shapes.txt` unread.

**Build.** Read `shapes.txt` in the graph builder, keep one decimated polyline per pattern, draw it
under the journey and on the journey's map. At 345,822,458 bytes it is the largest file in the archive
and must never reach a phone whole — decimate in the build, not in the browser.
**Size.** M.
**Done when.** A train's line follows the railway and a bus's follows the roads it is timetabled on,
checked against the same journey in 9292.

### 8. Live delays on the journey, and the platform change and the cancellation too

**9292:** a cancelled train is cancelled on screen. **OVVO:** a delay in seconds, per trip, nothing
else — the decoder in `shared/live-feed.mjs` reads the trip id, its start date, its route and the
delay, and skips every other field.

**Build.** Decode the rest of what the feed already carries for each stop of each trip: a skipped
stop, a cancelled trip, and a platform that differs from the timetable's. Draw each where it belongs,
and never infer one from a similar-looking service number.
**Size.** M.
**Done when.** A cancelled trip shows as cancelled and not on time; a skipped stop is not offered as a
place to get off; a platform the feed moves is moved on screen with the timetable's still visible.

### 9. Real service alerts, instead of the invented ones

**9292:** what is wrong today on the line you are looking at. **OVVO:** a simulated list, shown in
production, which is the defect above.

**Build.** First make the honest state true: with no real source, a production build shows **no**
alerts. Then read `alerts.pb` (367,620 bytes today), decode the header, the period and what each alert
is about — a stop, a line, a trip — and show those. An alert the feed does not name is not shown; a
feed that cannot be read says so.
**Size.** L.
**Done when.** The disruptions screen lists only alerts the feed is carrying, an expired one
disappears, a journey shows the alerts touching its own stops and lines, and a build with the feed
unreachable shows an honest empty state rather than a simulated one.

### 10. Plan it again when the leg is cancelled

**9292:** another way when yours falls over. **OVVO:** shows the delay and stops.

**Build.** When a leg is cancelled or a change becomes impossible, search again from the stop you are
standing at, at the minute you are standing there, and offer the alternatives above the broken
journey.
**Size.** L.
**Done when.** A journey with a cancelled leg offers at least one alternative that does not use it,
and says plainly when there is none.

### 11. A price, if there is an honest one to show

**9292:** the fare before you travel. **Not one of the four he accepted**, so it stays in scope — with
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
— and no number anywhere is a guess dressed as a price.

### 12. The nightly month: keep it honest, and fold the boards into it

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
3. **Watch it.** A failed night must reach a human — a failed Action is free to notify, and a
   `builtAt` older than 36 hours should make the app say its timetable is stale rather than plan from
   it silently.
4. **Say the window.** The app should say which days it can plan, and say plainly that a day past the
   window is not available.

**Size.** M.
**Done when.** Thirty consecutive nights pass with no hand on it, the built day count equals the days
the feed supports, the boards carry the same archive hash as the graph, and a deliberately broken run
fails loudly and leaves the previous month serving.

### 13. Long journeys: measure again, then find the miss, then the cost

**9292:** answers a cross-country journey correctly and quickly. **OVVO:** unknown today, and that is
the honest position.

**Build, in this order.**

1. **Re-measure first.** Every timing in `PLAN-FREE-ROUTING.md` was taken on a graph of 1,133,578
   connections; a day today holds **2,000,205**. Re-run the ten golden journeys and record the real
   cost before any optimisation is planned. The free allowance is 10 ms of processor time per
   request.
2. **Find the miss.** The known disagreement — Utrecht Centraal → Groningen arriving 30 minutes late
   against the reference search — was narrowed by elimination and never found. Make the fast search
   record the path it took, leg by leg, the way the reference scan does, and compare the two on that
   one journey. A recording shows a missed boarding in one run where tuning failed five times.
3. **Then the cost**, only once the answer is right: a two-way search that meets in the middle, or a
   scan that visits only what it has reached. If neither fits, the longest journeys run on a free
   runtime with a bigger allowance and this file says so.

**Where.** `src/planner/graph.ts` and `scripts/routing/raptor.mjs`, which must stay in step.
**Size.** L, open-ended until the recording exists.
**Done when.** The golden journeys agree with the reference search, that Groningen journey included,
and today's processor cost for each is written into this file.

### 14. The vehicles, on the map

**9292:** where the bus actually is. **OVVO:** nowhere; `vehiclePositions.pb` (26,821 bytes at 02:08
today) is read by nothing.

**Build.** Read the vehicle feed, match each vehicle to a trip the app is showing by the feed's own
trip id, draw it on the map with its age stated. A vehicle the feed does not name is not drawn; a feed
gone quiet shows the last known position with the minute it was seen.
**Size.** M.
**Done when.** Opening the map on a live journey shows the vehicle moving, and a stale feed shows age
rather than motion.

---

## The order to do it in

By what a traveller notices first, not by what is easiest.

0. **The two defects**, first, because they are small and they are currently telling travellers
   something untrue: production showing invented alerts, and boards three days behind the graph.
1. **The picker and the boards** — 1, then 2. Until these are done most of the country cannot use the
   app, and every later step improves something most people cannot reach.
2. **The question itself** — 3, then 4.
3. **What is happening now** — 8, then 9, then 10.
4. **From a door** — 6, then 5.
5. **The picture** — 7.
6. **The price** — 11, only as far as a verified source goes.
7. **Keeping it alive** — 12. It runs, so this is the smallest step here and the one that protects
   everything else.
8. **The hard two** — 13, then 14.

Each group is built, checked at a phone width in both themes, deployed and pushed before the next
starts. No step is a rewrite: each adds a source or a capability to code that exists.

---

## How we will know it is at parity

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

## What will still be missing when all fourteen are done

- **The four he accepted**: e-tickets, OV-chipkaart balance, subscription advice, operator crowding.
- **9292's own data.** 9292 is a carrier-owned company with data and agreements OVVO will never hold;
  its `Reisadvies API` is licensed and forbids use without approval, so it is not a source and will
  not be scraped.
- **Selling a journey**, international or otherwise. Times can be planned where a free feed covers
  them; a ticket cannot be sold.
- **A day past the feed's window.** Honest unavailable, not quietly extended.

---

## What this costs

Nothing. Every source named here is free and needs no account: the national timetable and its three
realtime feeds, OpenStreetMap's tiles, foot router and geocoder, GitHub Pages for the month, and the
repository's own free Actions allowance for the nightly build.

The only real cost is **weight on the traveller's phone**, measured rather than assumed: a published
day is 17 slices of two hours, about 2.6 MB gzipped for one middle slice checked today, and a
repeat search on the same day costs nothing because the day is kept on the device.

---

## What this plan will not do

- No paid service, no card, no trial.
- No scraping 9292 or any carrier's private interface.
- No invented delay, platform, alert, fare or journey in a production build.
- No preference shown as applied when the search ignored it.
- No step ticked because its screen exists: a step is done when its **Done when** line has been run
  and passed, and this file records the run.
