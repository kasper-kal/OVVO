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
