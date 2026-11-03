# Real data: what is verified, what runs, and what needs a decision

This file answers one question: **what of `REAL-DATA-PLAN.md` is actually true right now?**
Nothing here is a plan or a promise. Every number below came out of the code in `scripts/` running
against the live sources on **3 November 2026**, and anything not measured is marked so.

## The one decision that needs the steerer

**The journey planner needs a JVM, and the place this app is deployed cannot run one.**

OpenTripPlanner 2.10.0 is a Java program: its own documentation (v2.10.0, *Basic Tutorial*) states
that OTP2 is compatible with **Java 25 or later**, and that it wants "several gigabytes" of memory
for a large input. This app deploys to **Cloudflare Workers** — a JavaScript isolate with no Java
runtime and no long-lived process — so OTP cannot live in the same deployment as the site.

Three ways forward, and I will not take any of them without being told to:

1. **A small always-on server for OTP** (a €4–6/month VPS with 4GB of RAM and 40GB of disk). This
   is the option that matches the plan: real journeys, real data, no maintenance beyond a nightly
   timetable refresh. **It is a paid dependency, so it needs your approval.**
2. **A free container host.** Worth checking, but every free tier I would have to verify sleeps,
   throttles or caps memory below what an OTP graph of the Netherlands needs. If a verified free
   option exists that stays awake, that is the first choice on cost — but it is not verified yet,
   and I will not present it as working until it is.
3. **Stop at the timetable.** Ship stops, lines, platforms and departure boards from the verified
   GTFS inside the Worker (no Java), and say plainly that door-to-door journey planning is not
   available. Honest, free, and less than the plan asks for.

Until one is chosen, the app keeps its current behaviour and **no mock journey is presented as
real** — that is the rule in section P of the plan and it holds today.

## Verified sources

| Source | What was verified | Evidence |
| --- | --- | --- |
| Dutch GTFS, `https://gtfs.ovapi.nl/openov-nl/` | Listing read live; two archives listed, newest `gtfs-openov-nl.zip`, **179M**, last modified **02-Nov-2026 21:20**; download returned **188,146,558 bytes** | `scripts/gtfs-pipeline.mjs` run log |
| Same archive, contents | `agency.txt` 3,239 B · `stops.txt` 4,152,974 B · `routes.txt` 185,500 B · `trips.txt` 48,826,033 B · `stop_times.txt` 815,126,593 B · `calendar_dates.txt` 607,063 B · `shapes.txt` 238,411,258 B · `feed_info.txt`, `licenses.txt`, two `ticketing_*.txt`. **No `calendar.txt`** — the service dates are declared entirely in `calendar_dates.txt` | `unzip -l` + pipeline validation |
| Same archive, measured rows | **41 agencies · 56,215 stops · 3,019 routes · 702,815 trips · 13,800,102 stop times**; service window **2026-11-01 → 2026-12-12**, from `calendar_dates.txt` | `--revalidate --deep` |
| Street network, `https://download.geofabrik.de/europe/netherlands-latest.osm.pbf` | Geofabrik Netherlands extract, **1,409,687,325 bytes**, last modified **03-Nov-2026 05:17 GMT** | `curl -I` |
| OpenTripPlanner | v2.10.0 is the current release in the docs; `otp-shaded-2.10.0.jar` fetched from Maven Central (**191,382,029 bytes**) | `tools/` |
| Java | OTP 2.10.0 requires **Java 25+**; the official Eclipse Temurin 25 JDK was fetched and installed at `tools/jdk` | `tools/jdk/bin/java -version` |

Coverage statement: the feed is national in scope — 41 operators, 56k stops, and stops across the
Netherlands — but I have **not** verified that every Dutch carrier is present, and the window is six
weeks long, so anything outside 1 Nov – 12 Dec 2026 is not in this data.

## The timetable pipeline (working, not a sketch)

`node scripts/gtfs-pipeline.mjs` does the whole job and was run for real:

* reads the **listing** and picks the newest archive by its last-modified stamp, so no filename is
  hard-coded;
* downloads to `incoming/` through a byte counter, and refuses a short read or an archive under
  1MB;
* validates before activating: required files present and non-empty, the exact **columns the
  planner reads** present in each header, at least one data row per file, and a declared service
  window — read from `calendar.txt` or, as here, from `calendar_dates.txt`;
* unpacks into `staging/`, then rotates `current/` → `previous/` and `staging/` → `current/`, so a
  failure at any point leaves the last working timetable in place;
* writes `data/gtfs/manifest.json` (source URL, listing stamp, bytes, SHA-256, retrieval time, file
  sizes, row counts, service window and which file declared it) and appends to
  `data/gtfs/pipeline.log`;
* `--check` validates what is installed without touching the network, `--revalidate` re-proves an
  archive already on disk, `--deep` counts every row (13.8M stop times in ~13s);
* refuses to re-download an archive whose listing stamp has not changed.

`data/` is in `.gitignore`: 179MB of archive, 815MB of stop times and the OSM extract are not Git's
business, and the facts above live in this file instead.

## Milestones, honestly

| # | Milestone | Status | What that means |
| --- | --- | --- | --- |
| 1 | Inspect project and platform | **COMPLETE** | Vite + React SPA on a Cloudflare Worker with D1; `/api/*` is the Worker's own; no Java, no Docker daemon (permission denied), 8 cores, 16GB RAM, 50GB free |
| 2 | Verify data sources | **PARTIAL** | GTFS and OSM verified with measured facts; realtime and geocoding providers not verified yet |
| 3 | Dataset acquisition and validation | **COMPLETE** | The pipeline above, run against the live feed |
| 4 | Routing engine | **BLOCKED** | Java 25 is installed here and the jar and graph inputs are on disk, but the app's host cannot run a JVM. A graph build in this sandbox would prove the data; it cannot serve the site |
| 5 | Real location search | **NOT STARTED** | Needs a provider whose usage policy allows autocomplete; not chosen |
| 6 | Real journey planning in the UI | **BLOCKED** | Depends on 4. The typed adapter and the Worker route are not written yet |
| 7 | Stop pages and departure boards | **NOT STARTED** | Can be done from GTFS alone once the index lives beside the Worker |
| 8 | Preferences and favourites | **PARTIAL** | Stored in this browser today; not yet connected to a real router |
| 9 | Realtime feeds | **NOT STARTED** | Feed inventory not written yet |
| 10 | Disruptions and the real map | **NOT STARTED** | — |
| 11 | Additional 9292-style features | **NOT STARTED** | — |
| 12 | Tests | **PARTIAL** | The UI suite is extensive; there are no real-data integration tests yet, and the pipeline itself has no test |
| 13 | Documentation | **PARTIAL** | This file; operations and limitations documented as far as they are known |

## What I have not done, and will not pretend about

* **No journey on the site comes from real data yet.** The planner still uses its own bundled
  network. Nothing in this turn changed what a traveller sees.
* **No OTP graph has been built yet.** The inputs are on disk and Java is installed; the build is
  the next step and it is long.
* **No realtime data is connected**, and none is claimed.
* Free hosting for OTP is **unverified**. I will not describe a free tier as working until it has
  been exercised.
