# Real data: what is verified, what is built, what is blocked

Last updated: 14 November 2026. Every number in this file was measured in this workspace on this
date; nothing here is an estimate from memory. Commands that produce each number are given, so any
line can be re-checked rather than trusted.

## The short answer

The timetable is real: the national Dutch feed is downloaded, checked and active, with 11.3 million
scheduled stop times. Realtime is real and openly reachable. **The routing engine is blocked**, and
real journey planning cannot be finished without a decision only the steerer can make, that is the
one thing this report asks for.

The journey planner in the app is still the prototype. It has **not** been replaced by real routing,
and it is not pretending to be: this file says so plainly rather than letting a working UI imply a
working backend.

## 1. Timetable: verified and active

| What | Measured value |
| --- | --- |
| Archive | `NL-OPENOV-20261114-gtfs.zip` |
| URL | `https://gtfs.ovapi.nl/openov-nl/` (the listing; the name is read from it, not assumed) |
| Size | 163,035,838 bytes (155.5 MB) |
| Last modified | Sat, 14 Nov 2026 07:34:00 GMT |
| SHA-256 | `b0fc93b09537…` (full value in `.gtfs-cache/current.json`) |
| Files | 12, including `agency`, `stops`, `routes`, `trips`, `stop_times`, `calendar_dates`, `shapes`, `transfers`, `feed_info`, `licenses` |
| Agencies | 35 |
| Stops | 53,612 |
| Routes | 2,492 |
| Trips | 608,596 |
| Stop times | 11,336,204 |
| Valid | 2026-11-14 → 2026-12-12 |
| Publisher | OVapi, feed version `gtransit_chb:1.0.3:9689`, language `nl` |

Two facts that were assumptions until they were checked:

- **There is no `calendar.txt`.** This feed carries its service dates only in `calendar_dates.txt`.
  That is legal GTFS (one of the two files is required, not a particular one) but the first run of
  the pipeline refused the archive over it. The pipeline was wrong, not the feed.
- **The licence is not one licence.** `licenses.txt` says the default tables are **CC0-1.0**, the
  `shapes` table is **ODbL-1.0** (attribution required, share-alike for derived databases), and
  `ticketing_identifiers` is **CC-BY-NC-ND-4.0** (non-commercial, no derivatives). So route geometry
  may be drawn with attribution, and the ticketing table may not be used commercially.

## 2. Street network: verified, not yet downloaded

| What | Measured value |
| --- | --- |
| URL | `https://download.geofabrik.de/europe/netherlands-latest.osm.pbf` |
| Size | 1,411,372,072 bytes (1.41 GB) |
| Last modified | Sat, 14 Nov 2026 00:33:19 GMT |
| Licence | ODbL-1.0 (attribution required) |

It is reachable and current. It was **not** downloaded: nothing here can build a graph from it yet
(see section 4), and 1.41 GB of data that cannot be used would only take space.

## 3. Realtime: verified reachable, not yet parsed

All three answer `200` with no key and no signup, measured 14 November 2026:

| Feed | URL | Size at check |
| --- | --- | --- |
| Vehicle positions | `https://gtfs.ovapi.nl/nl/vehiclePositions.pb` | 181,503 bytes |
| Service alerts | `https://gtfs.ovapi.nl/nl/alerts.pb` | 442,300 bytes |
| Trip updates | `https://gtfs.ovapi.nl/nl/tripUpdates.pb` | 2,304,490 bytes |

What is **not** verified, and therefore not claimed: which operators are actually inside those
files, how fresh each message is, whether every trip can be matched to the scheduled timetable, and
whether the terms permit a public site to poll them. Those questions are the next piece of work, and
they need the payloads parsed, not just fetched.

## 4. The blocker: the routing engine

OpenTripPlanner 2.10 is the intended engine. Its own documentation states that "its server component
runs on any platform with a Java virtual machine", and that it builds its network from GTFS and
OpenStreetMap. That has three consequences measured here:

| Requirement | This environment |
| --- | --- |
| A Java runtime | **No `java` at all**; no root, so none can be installed |
| RAM for a national graph | 3.9 GB total, 3.3 GB free on 2 cores |
| A long-running server process | Cloudflare Workers (where OVVO lives) runs no JVM and no daemon; it is request-scoped |
| Disk for graph + data | 8.5 GB free; GTFS unpacks to ~0.9 GB, the OSM extract is 1.41 GB before graph-building |

A Java process cannot run inside a Cloudflare Worker under any configuration. So the engine has to
live somewhere else, and every free tier of a persistent host (typically 256 MB–1 GB) is an order of
magnitude below what a national Dutch graph needs to build and serve.

**The plan is free, and only free.** OVVO has one rule about this, set by the steerer: no card
anywhere, no service that has to be paid for, ever. So a paid host is not an option and must not be
proposed again: not as a "recommendation", not as a fallback, not with a price beside it.

That leaves exactly one shape, and it is the one that fits the platform OVVO already uses:

- **Run the routing ourselves, on a free tier.** A round-based search (RAPTOR) over the timetable,
  written by us in JavaScript, inside a serverless function rather than a JVM. The graph is built
  once by the pipeline and shipped as static data, so nothing has to stay warm and no process has to
  live on a server we pay for. Free static bandwidth serves the graph; the function only searches.
- **Scope follows from the limits, not from a bill.** Free serverless functions give little CPU and
  memory per request. That is what decides whether the whole country fits in one search or whether
  the first release covers a region and says so on screen. Either way the answer is real, and either
  way it is free.

What is genuinely blocked today is not money: it is that the RAPTOR implementation, the graph build
and the free-tier feasibility test have not been written yet. That is the work, and it costs
nothing but time.

## 5. What is built and working

`scripts/gtfs/fetch.mjs`: a repeatable timetable pipeline, run for real:

```
npm run gtfs:update     # download the newest dataset, validate it, activate it
npm run gtfs:check      # validate what is already cached, download nothing
npm run gtfs:status     # print the active dataset, its counts and its validity
```

It resolves the newest dated archive by reading the listing (no hard-coded filename, with the stable
alias only as a fallback and only when the listing has no dated name), compares the download against
`Content-Length`, tests the archive with `unzip -t`, records its SHA-256, requires every file and
column a router needs, refuses an archive that has expired or that is implausibly small, and only
then writes `current.json`. A failure at any step leaves the previous dataset active.

`stop_times.txt` is 674 MB compressed and several gigabytes open, so it is counted by streaming it
out of the archive and never unpacked. Archives and unpacked data live in `.gtfs-cache/`, which is
in `.gitignore` and never in Git.

Measured: 54 seconds for a cold run including the 155.5 MB download; 16 seconds to re-validate the
cached archive.

## 6. Feature matrix

Statuses are exactly: COMPLETE, PARTIAL, BROKEN, NOT STARTED, BLOCKED, UNVERIFIED.

| Feature | Status | Evidence / reason |
| --- | --- | --- |
| Timetable acquisition and validation | **COMPLETE** | Real archive active; counts above; failure paths tested by the first two runs, which correctly refused the feed |
| Timetable freshness and last-good retention | **COMPLETE** | `current.json` written last; expired archives refused |
| Street-network source | **UNVERIFIED** | URL, size and licence confirmed; not downloaded, not graph-tested |
| Routing engine (OTP 2.10) | **BLOCKED** | No JVM, no persistent process, RAM below a national graph |
| Real journey planning | **BLOCKED** | Needs the engine; nothing is faked in its place |
| Location search | **PARTIAL** | Real Nominatim through `/api/lookup/address`, already live and cached at the edge. House-number parsing, ranking and limit behaviour not yet tested |
| Stop pages and departure boards | **NOT STARTED** | Needs a timetable query layer; data is present but not yet indexed |
| Realtime feed inventory | **PARTIAL** | Endpoints and sizes measured; payloads not parsed, coverage and freshness unknown |
| Realtime applied to journeys | **NOT STARTED** | Depends on the engine |
| Disruptions from real alerts | **NOT STARTED** | `alerts.pb` is reachable; nothing wired |
| Real map | **NOT STARTED** | The map is still the illustrative one |
| Preferences and favourites | **PARTIAL** | Stored locally today; not yet applied to any real routing request |
| Automated tests for the new work | **NOT STARTED** | The pipeline was exercised by hand; no test file yet |

## 7. What happens next

Blocked work stays blocked until the hosting decision in section 4. Everything else in the brief that
does not depend on the engine can proceed in this order, and none of it needs a paid service:

1. Index the timetable for stop pages and departure boards.
2. Parse the three realtime feeds and record what they actually contain.
3. Connect the disruption screen to real alerts.
4. Build the internet-facing `/api/journey` contract and typed adapter, so the engine is a drop-in
   behind a tested boundary rather than a rewrite.
5. Turn the mention of a mock in production into a hard error, so demo data cannot leak.

## 8. Round two: stops, boards and realtime, same day

This section supersedes the matrix in section 6 where the two disagree; section 6 is left as it was
written, so the record shows what was true before this round.

### Stop pages and departure boards now use the real timetable

The app's stop list is hand-built: 61 stations and landmarks with a schematic map position,
facilities and operators, and replacing it with 53,612 raw GTFS stops would have thrown away the
approved design to gain nothing the traveller can see. So the two are **joined**:

| What | Measured |
| --- | --- |
| Stops in the app | 60 (one seed has no coordinate pair, so it is not a map stop) |
| Matched to a real GTFS stop | **53** |
| Unmatched | 7: Vondelpark, Anne Frank House, Binnenhof, Erasmusbrug, Markthal, Domtoren, Buiksloterweg ferry. Six are landmarks, which are not stops in the feed at all; the ferry's name differs in the feed |
| Real departures generated | 17,457, for the next two service days |
| Per stop, per day | capped at 250; the cap is filled in file order, so it is a spread across the day rather than a complete board |
| Generated module | `src/data/generated/boards.ts`, 1,259 KB, holds the feed's name and SHA-256 |
| Build time | 21 seconds over the cached archive |

Each row carries the real line number, the real headsign, the operator name and the platform the
feed gives, and **no delay**, because a scheduled time is not a prediction. `boardForStop` returns
the real rows when the feed has them; a stop with no real rows gets an empty board, never an
invented one.

**The 250 cap is a real limitation, not a detail.** At a station with 1,400 departures a day, the
traveller sees 250 of them; the ones missing are dropped silently, and there is no way to tell from
the screen. The fix is per-hour thinning (keep the next few from each hour instead of a flat cap),
which keeps a full day in the same number of rows. Until then the board is real but not complete,
and this file says so rather than letting the screen imply otherwise.

### Realtime is parsed and inventoried

`scripts/realtime/probe.mjs` decodes all three feeds by hand (no dependency, no schema tool) and
writes `realtime/inventory.json`. Measured at 14 November 2026, 23:0x UTC:

| Feed | Bytes | Entities | Named trips | Named routes | Age |
| --- | --- | --- | --- | --- | --- |
| Vehicle positions | 164,408 | 1,198 | 1,193 | 503 | 12 s |
| Trip updates | 2,269,402 | 4,700 | 4,700 | 628 | 13 s |
| Service alerts | 442,300 | 823 | 0 (by design) | 0 | 13 s |

An alert names no trip: it carries selectors for a route, a stop or an agency, and the probe counts
those separately. Every feed was fresh to within 13 seconds, which is the first real evidence that
these are live and not an archived snapshot.

**Operational finding: the feeds rate-limit.** Three runs in quick succession answered `429` on all
three URLs, and only cleared after several minutes. Any integration must cache, back off and poll on
a schedule: a page that fetched on every view would be blocked. That is measured behaviour, not a
warning from a document.

### Prototype data can no longer look real

Two changes, both small and both structural:

- **One switch.** `src/lib/dataMode.ts` decides whether sample data may be generated at all. In a
development run it may; in a production build it may **not**, unless the build is made with
`VITE_ALLOW_DEMO=1` on purpose. A screen with no real source now shows nothing rather than
something plausible.
- **One label.** Every board whose rows are invented now says *"Sample times, not a live feed"* in
its foot. Before this, a generated board and a real one were the same pixels.

### Revised matrix

| Feature | Status | Evidence |
| --- | --- | --- |
| Timetable acquisition, validation, last-good | **COMPLETE** | Section 1; failure paths exercised |
| Stop pages and departure boards | **PARTIAL** | 53 of 60 stops serve real scheduled departures; the 7 landmarks have none; line boards cannot yet be answered from the feed |
| Realtime feed inventory | **COMPLETE** | Three feeds parsed, counted, aged; `realtime/inventory.json` |
| Realtime applied to boards or journeys | **NOT STARTED** | Needs trip matching to the timetable and the engine |
| Prototype data labelled and gated | **COMPLETE** for boards | `lib/dataMode`, board foot label, production build refuses sample boards |
| Prototype journeys | **PARTIAL** | Still generated in development and still unlabelled on the results screen; gating them needs an honest unavailable state on that screen first |
| Disruptions from real alerts | **NOT STARTED** | Feed parsed; nothing wired to the screen |
| Routing engine, real journeys | **BLOCKED** | Section 4 |
| Real map | **NOT STARTED** | Unchanged |

### Commands this round added

```
node scripts/gtfs/build-app-data.mjs   # regenerate real boards for the app's stops (21 s)
node scripts/realtime/probe.mjs        # fetch, parse and inventory the three feeds
node scripts/realtime/probe.mjs --report   # print the last inventory, fetch nothing
```
