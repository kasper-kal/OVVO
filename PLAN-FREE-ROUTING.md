# Plan — real journeys, with no paid service

## Summary (read this and you have the whole plan)

We build the journey search ourselves and run it on free infrastructure. No Java server, no rented
machine, no card, no trial that ends. The national timetable is already downloaded and checked, and
the three live feeds already decode, so the only missing piece is the search itself.

The plan is one experiment first, then four build steps. The experiment decides the scope: a free
serverless function gets very little processor time per request, so step 0 measures whether one
search across the whole country fits inside it. If it fits, OVVO plans nationwide for free. If it
does not fit, the same code runs on a smaller region and the app says so on screen — real answers
either way, and still free.

Nothing in this plan costs money, and any option that does is out of scope permanently.

## The rule this plan obeys

> **No card anywhere.** Every service must have a permanently free plan.

That is the steerer's rule and it is not a preference to be weighed against convenience. A paid host
is not a fallback, not a recommendation and not something to ask about again.

## What already exists (measured, not assumed)

| Piece | State |
| --- | --- |
| National timetable | Active: 53,612 stops, 608,596 trips, 11,336,204 stop times, valid 14 Nov – 12 Dec 2026 |
| Timetable pipeline | Complete: resolves the newest archive, verifies, validates, keeps the last good copy |
| Stop boards | Real scheduled departures for 53 of the app's 60 stops |
| Live feeds | All three decode: 1,198 vehicles, 4,700 trip updates, 823 alerts, ~12 seconds old |
| Free platform limits | 10 ms processor time and 128 MB memory per request; 100,000 requests a day; static files free and unlimited, 25 MiB each, 20,000 of them |
| Journey planning | Still invented in the browser. This plan replaces it |

## The shape we are building towards

```
GTFS archive ──► graph builder (offline, free) ──► static graph files (free to serve)
                                                          │
browser ──► /api/journey ──► search in the function ──────┘
                │
                └──► typed result the approved UI already understands
```

The graph is built once by a script, not on every request. It is served as ordinary static files,
which are free and unmetered, so no process has to stay warm and nothing has to be rented.

## Step 0 — the experiment that decides the scope (do this first)

**Question:** does one real search fit in 10 ms of processor time and 128 MB of memory?

1. Build a compact graph for one region first — connections sorted by departure, in typed arrays,
   with walking links between stops within 400 m.
2. Write the search (connection scan, the simplest correct algorithm) in plain TypeScript.
3. Run real queries — Utrecht Centraal to Amsterdam Centraal, a cross-country pair, a short hop —
   and measure processor time per query, memory, and the size of the graph each query needs.
4. Repeat with the national graph and the same three queries.

**Outcome A — it fits.** National journeys on the free tier. Continue to step 3 with national data.

**Outcome B — it does not fit.** Two free remedies, tried in this order:

- **Shard the graph.** Load only the region a query touches (a file fetch costs no processor time),
  so one request never scans the whole country.
- **A different free runtime.** Some serverless free tiers allow more time per request and need no
  card. If a free one does, the same code runs there.

**Outcome C — no free arrangement fits.** Then the first release covers a region, chosen by real
usage, and the app states the limit on screen. This is still real data, still free, and is reported
as PARTIAL rather than dressed up as national.

Nothing is built beyond step 0 until its result is written down here.

### Step 0 — result (measured 14 November 2026)

The experiment is done: a real connection-scan search over the real archive, written and run.
Records: `routing/feasibility-region.json`, `routing/feasibility-national.json`,
`routing/feasibility-national-2h.json` and its 3 h and 4 h siblings.

| Scope | Connections | Graph | Journey cost (median) | Answer |
| --- | --- | --- | --- | --- |
| Utrecht region, whole day | 235,292 | 4.7 MiB | 1.7 – 3.1 ms | correct |
| National, whole day | 1,424,045 | 29.9 MiB | 30 – 38 ms | correct |
| National, 2-hour slice | ~120,000 | ~2.5 MiB | **6.8 – 9.5 ms** | correct |
| National, 3-hour slice | ~180,000 | ~3.7 MiB | 8.0 – 11.8 ms | correct |

The journeys it returns are believable against the real timetable: Utrecht Centraal to Amsterdam
Centraal arriving 08:35, Amsterdam to Rotterdam 08:40, Utrecht to Groningen 10:14 — all from an
08:00 departure.

**Conclusion — outcome A, with a condition.** A national search fits inside the free 10 ms budget
when the graph is served in **2-hour slices** and the scan stops as soon as nothing later can arrive
easier. Long journeys do not fit at that window: Utrecht to Groningen needs a 3-hour slice and costs
11.8 ms, which the free tier would terminate.

So the shape is settled: **time-sliced graph files, an adaptive window that starts at 2 hours and
extends only when no answer is found, and a region fallback only if an extension still exceeds the
budget.** Long-distance journeys are the known soft spot and are the first thing step 2 must improve
(a tighter scan that visits only stops the search has actually reached, rather than every connection
in the slice).

This is measured in Node on this machine, not inside a Worker. The Worker figure could be better or
worse; the comparison is the first check of step 2, and it is not called done until it is measured
there.

## Step 1 — the graph builder

A script that turns the verified archive into the files the search reads:

- stops and their coordinates, stations grouped with their platforms;
- every connection (departure, arrival, from stop, to stop, trip) sorted by departure time;
- services per calendar date, including exceptions, so a Sunday and a public holiday differ;
- walking links between stops that are genuinely close, computed from coordinates already in the feed;
- times kept as seconds, so services after midnight (25:10:00) stay in the right order.

The builder refuses to publish a graph that fails its own checks: every stop referenced must exist,
every connection must move forward in time, every date must have a service. A failed build leaves the
previous graph in place, exactly as the timetable pipeline does.

### Step 1 — result (built 15 November 2026)

`npm run gtfs:graph:verify` builds the graph and then reads it back. Current build, from the
verified archive, for Sunday 15 November 2026:

| | |
| --- | --- |
| Stops | 53,612 |
| Trips that day | 76,843 |
| Connections | 1,133,578 |
| Walking links (both directions) | 353,968, being 176,984 pairs within 400 m |
| Slices | 17 files of two hours, 25.0 MiB in total, largest 2.88 MiB |
| Verification | pass: hashes, sort order, slice bounds, forward-moving times, stop references |
| Proof journey | Utrecht Centraal from 08:00 arrives Amsterdam Centraal 08:52 (Sunday timetable) |

Three real faults were found and fixed while building it, each one worth recording because each
would have produced a silently wrong planner:

1. The builder first refused to run at all, because it defaulted to the feed's *first* service day,
   which had passed. It now builds for today, and refuses only when today is outside the feed.
2. `Math.max(...rawDep)` over a million-odd departures overflowed the stack. It is a loop now.
3. The verify pass demanded the exact Saturday arrival time from a Sunday build. It now checks that a
   plausible journey exists; the exact comparison stays in the experiment, where the dates match.

**Timing a request-shaped search**, loading three slices (392,153 connections, 7.48 MiB) from disk in
5 ms and then searching: 10.3 ms and 10.5 ms. That is on the line, not under it. The cause is visible
in the build: a two-hour slice in the middle of the day holds 140,000–150,000 connections, and the
scan still reads all of them. **This is exactly what step 2 must fix** — visit only stops the search
has actually reached instead of every connection in the slice.

Open question for step 1, not yet solved: the graph is built for **one service day**. The feed covers
28 days, so a real deployment needs a graph per day (28 × 17 slices = 476 files, roughly 700 MiB) or
slices that carry their own date. That decision belongs with step 3, where the request states which
day it means.

## Step 2 — the search itself

Connection scan first: one forward pass over departure-sorted connections gives the earliest arrival
for every stop from one origin. That covers "leave at" and, run backwards, "arrive by". It is small,
it is well understood, and it is easy to test. It handles:

- a minimum transfer time at each stop, so a 0-minute change is not offered;
- staying on the same vehicle across stops (no false transfer);
- walking legs between nearby stops;
- a limit on the number of changes, and a limit on total walking.

Preferences are only honoured if the search actually applies them. A setting the search ignores —
step-free routing, bicycle carriage — is not shown as applied; it is reported as not yet supported.

### Step 2 — result (measured 15 November 2026)

A round-based search now exists: `scripts/routing/raptor.mjs`. It stands at stops it has reached,
takes the trips it can catch on each route serving that stop, and jumps along the route. The whole
national pattern set is loaded once, 5,593 patterns and 88,255 stop positions, in about 20 ms of
loading — which costs no processor time on a Worker, because loading is waiting for a file.

**Measured against the exhaustive connection scan, same graph, departing 08:00:**

| Journey | Exhaustive scan | Route search |
| --- | --- | --- |
| Utrecht Centraal → Amsterdam Centraal | 12.1 ms | **3.96 ms** |
| Amsterdam Centraal → Rotterdam Centraal | 11.8 ms | **3.55 ms** |
| Zwolle → Eindhoven | 14.5 ms | **7.71 ms** |
| Utrecht Centraal → Groningen | 15.9 ms | 14.3 ms |
| Rotterdam Centraal → Groningen | 16.5 ms | 17.1 ms |
| Utrecht Centraal → Maastricht | 20.7 ms | 17.8 ms |

**What this means, plainly.** Ordinary journeys are now comfortably under the free 10 ms budget —
by two to three times. Long cross-country journeys are not: they still cost 14–18 ms, because a
journey of two hours genuinely has to consider everywhere reachable within two hours. The budget is
therefore met for the journeys people make most, and not met for the longest ones.

**Two known disagreements** are recorded rather than hidden (`routing/step2-comparison.json`):

- Rotterdam Centraal → Groningen arrives 11:26 here and 11:21 on the exhaustive scan. The route
  search takes the first catchable trips on a route plus the two after them; a connection the scan
  finds is still being missed. Five minutes is a real difference and this is not finished.
- Utrecht Centraal → Maastricht: the scan finds nothing inside its six-hour window, the route search
  finds 11:18. That points at how a station is resolved to the stops beneath it, which is step 3's
  job, not the search's.

Three faults were found and fixed by measuring instead of assuming: the patterns file layout did not
match its reader; the round logic fed only walking improvements into the next round, so a journey
could take one route and then continue only on foot; and a `Set` lookup on every one of ~20,000
improvements cost more than the search itself. Counters in the search now report patterns scanned,
trips examined and stops improved, so the next claim about cost can be checked rather than believed.

**What step 2 does not fix, and what to do about it:** long journeys. Two honest options, both free:
shorten the search with a two-way search that meets in the middle, or accept that the longest
journeys take longer than 10 ms and serve them from a runtime whose free allowance is larger. Neither
is built. What is built is measured and recorded.

### Step 2 again — stations, places, and what is still wrong (measured 15 November 2026)

A station name used to resolve to a single raw stop. It now resolves to a **place**: every platform a
traveller can board from. The feed names stops like `[Utrecht Vaartsche Rijn] OV halte Vondellaan
richting Utrecht Centraal`, so matching on the name sent a journey to a bus stop that merely mentions
the station. And one physical station can arrive as several parent records — Groningen's platforms
sit in six of them — so a place joins station groups within 400 m whose names begin the same way.

| Journey | Exhaustive scan | Route search | Agree? |
| --- | --- | --- | --- |
| Utrecht Centraal → Amsterdam Centraal | 4.4 ms, 08:35 | **1.7 ms**, 08:35 | yes |
| Amsterdam Centraal → Rotterdam Centraal | 5.1 ms, 09:18 | **2.3 ms**, 09:18 | yes |
| Zwolle → Eindhoven | 10.8 ms, 10:15 | **6.4 ms**, 10:14 | yes |
| Rotterdam Centraal → Groningen | 14.3 ms, 11:12 | 12.3 ms, 11:12 | yes |
| Utrecht Centraal → Maastricht | 13.6 ms, 10:36 | 15.7 ms, 10:36 | yes |
| Utrecht Centraal → Groningen | 9.8 ms, **10:12** | 12.8 ms, **10:42** | **no, 30 min late** |

**Fixed by measuring, not guessing:**

1. Station resolution, as above. Utrecht to Maastricht used to find nothing; it now agrees exactly.
2. Only one platform of the origin was ever queued, so a journey could begin on a platform with no
   departures and end there, finding nothing.
3. Only the platform a train stopped at was expanded, so changing trains at a station never happened
   from its other platforms. Two cross-country journeys were an hour and a half late because of it.

**Still not met.** Five of six journeys match the exhaustive scan exactly, and the fast short
journeys are well under the free 10 ms. Three long journeys are not: 12–16 ms. And Utrecht to
Groningen is 30 minutes late at every setting tried — one, three and eight trip candidates per route,
five and eight rounds all return 10:42 — so it is not a tuning problem but a structure the round-based
search does not see, most likely a journey the scan finds through a connection this search never
considers. That is not understood yet, and it is not claimed to be fixed.

The next honest move was thought to be a two-way search that meets in the middle. **It was not built,
because the investigation showed it would not fix the failing journey.**

### What the failing journey actually is

The exhaustive scan's journey was reconstructed leg by leg, and it is not a direct train:

```
08:07  Utrecht Centraal        → 08:20  Amersfoort Centraal     (trip 362)
08:37  Amersfoort Centraal     → 09:11  Zwolle                  (trip 1710)
09:11  Zwolle                  → 09:11  Zwolle, Station         (walk)
09:11  Zwolle, Station         → 09:12  Zwolle                  (walk)
09:16  Zwolle                  → 09:55  Assen                   (trip 1748)
09:55  Assen                   → 10:12  Groningen               (trip 1748)
```

The fast search instead takes the 09:06 from Amersfoort, reaches Zwolle at 09:41, and takes the
09:46 from there: 10:42. So it is **missing one boarding**, not losing to a slow search. A two-way
search would halve the ground covered and would still miss that boarding.

### Ruled out by testing, not by reasoning

| Suspect | Tested | Result |
| --- | --- | --- |
| Too few rounds | 5, 6 and 8 rounds | 10:42 every time |
| Too few candidate trips per route | 1, 3 and 8 | 10:42 every time |
| The 2-minute transfer rule | 0 s and 120 s | 10:42 every time |
| Destination pruning hiding it | pruning switched off | 10:42, and slower |
| Station grouping splitting platforms | places added | Maastricht fixed, Groningen not |

What remains: the fast search never boards trip 1710 at Amersfoort or trip 1748 at Zwolle, and nobody
knows why yet. **The next step is not more tuning.** It is to make the fast search record the path it
took, the way the exhaustive scan now can, so the boarding that fails can be seen directly. Optimising
a search that silently takes a worse train would be optimising the wrong thing.

## Step 3 — the contract between search and screen

`/api/journey` takes origin, destination, date, time, arrival-by or departure-at, and the supported
preferences, and returns itineraries shaped like the `Journey` the approved UI already draws. The
adapter is the only place that knows the search's internal types.

Honest answers, in this order of preference: real itineraries; a specific, explainable failure (no
route at that time, origin unknown, search timed out); and never an invented journey. The search does
not guess a station or make up a departure to fill a screen.

## Step 4 — wire it and make invention impossible

- The results screen reads `/api/journey`. In a production build the invented journeys are gone, not
  hidden: `lib/dataMode` already gates sample data, and journeys join that gate.
- With no engine answer, the screen shows an honest unavailable state, not a plausible timetable.
- Realtime is applied to the result **only** where a live feed names the same trip — a delay is never
  inferred from a route number that looks similar.

## Step 5 — prove it works

- Known journeys with known answers: a direct train, a change, a short bus hop, a late-night service
  after midnight, a date on each side of a daylight-saving change.
- A Sunday and a holiday, to prove the calendar is read.
- A query with no route at all, to prove the empty answer is honest.
- Processor time and memory for each query, recorded in this file, so the scope claim is measured.
- The full app flow: type a place, pick it, press search, see real legs — checked in a browser.

## Step 6 — the map and realtime, in that order

Only after journeys are real: draw the real route geometry, then attach live delays to the trips the
search actually chose.

## What could go wrong, and what happens then

| Risk | Response |
| --- | --- |
| 10 ms is far too little | Shard the graph, then try another free runtime; if neither works, a region with an on-screen limit |
| National graph too large to serve as static files | Split by region and time window; static bandwidth is free and unmetered |
| Search answers slowly under load | Cache per origin/date window in the free edge cache |
| A preference cannot be honoured | Say so in the interface; never pretend it was applied |
| Realtime rate-limits (already observed) | Poll on a schedule with backoff, cache the last good answer, and label its age |

## What I will not do

- No paid host, no trial, no card, ever.
- No invented journeys, departures or delays in a production build.
- No pretending a feature works because a route exists.
- No silent scope change: if the answer becomes regional, the app says so and this file records why.

## Permission needed

I am asking to execute steps 0 to 5. Step 0 comes first and its result decides national versus
regional; I will stop and report that result before building on it.

## What actually ships now (15 Nov 2026)

The browser does the search, so no server function is needed and nothing is paid for.

* `/plan` — type a station, pick a day and a time, and the page returns real journeys: each leg has
  its line, its headsign, both stations, both platforms and the operator, read from the official
  timetable. Departure, arrival, duration and transfers are counted, not estimated.
* The search is the exhaustive connection scan, ported to the browser (`src/planner/graph.ts`).
  Checked against the Node scan on the same day and the same query: Utrecht Centraal → Groningen at
  08:00 gives 08:07 → 10:12, two changes, identical to `scripts/routing/scan.mjs`.
* Two service days are built (`20261115`, `20261116`) and `public/graph/index.json` lists exactly
  the days that exist, so the page can only offer days it can really plan for.
* Departure boards now take a small allowance **per hour** instead of spending a flat 250 per day in
  file order — the old cap filled the morning and silently dropped the evening.
* Walks are modelled as steps of their own, and a walk inside one station is not a leg.

**Live running times.** The national realtime feed is a binary protobuf and sends no CORS headers, so
a page cannot read it. The app now reads it on the server (`shared/live-feed.mjs`, served by the
worker at `/api/live` and by the dev server through the same module) and answers for the exact trips
the page is showing. A delay is drawn beside the planned time, never instead of it, and the page
states when the feed cannot be read rather than assuming a train is on time. `tripIds.txt` in each
day's graph carries the feed's own trip identifiers, which is what makes the join possible.

**The landmark stops.** All 60 stops now have a board. The seven that are landmarks rather than
stations are matched by **distance** — the nearest stop within 600 m — instead of by name, because
no station in the feed carries the name "Vondelpark". Verified by the builder: 60 matched, none
unmatched.
