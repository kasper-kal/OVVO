# OV Planner — stage 1 frontend prototype

An independent Dutch public transport journey planner concept, built as a **frontend
prototype only**. Every timetable, delay, platform, fare and alert in this app is
**simulated demonstration data**: there is no live transport feed, no routing engine,
no geocoding service and no production backend.

## Run it

```bash
npm install          # install from the lockfile (dependencies are not pre-installed)
npm run dev          # Vite dev server on http://localhost:3000
npm run build        # typecheck (tsc --noEmit) + production build into dist/
npm run typecheck
```

The app is a single-page React app. Routing uses a hash router, so a refresh or a deep
link works on any static host.

## Screens

| Route | Screen |
| --- | --- |
| `/` | Journey planner (search form, autocomplete, reverse, simulated location, preferences, validation) |
| `/results` | Journey results (sorting, filters, earlier/later browsing, inline legs, save, map) |
| `/journey/:id` | Journey details (full leg timeline, transfers, platforms, delays, occupancy) |
| `/map` | Illustrative schematic map (stops, route, vehicle markers, zoom/pan, stop info) |
| `/stops`, `/stops/:id` | Stations & stops list and stop pages (facilities, access, board, alerts, nearby stops) |
| `/departures` | Departure boards (stop picker, mode/line/destination filters, auto-refresh) |
| `/disruptions`, `/disruptions/:id` | Example alerts with filters, detail, advice, navigation |
| `/favourites` | Favourite locations |
| `/journeys` | Saved journeys |
| `/recent` | Recent searches |
| `/preferences` | Travel preferences with a live preview of their effect |
| `/settings` | Display settings, planner defaults and local data management |

Desktop uses a sidebar; mobile uses the floating obsidian dock plus an “All sections”
sheet. Every visible control performs a real action — nothing is a decorative link.

## Architecture

```
src/
  data/        demonstration data + the simulated planner (no UI, no React)
    types.ts        domain vocabulary (stops, legs, journeys, alerts, departures)
    stops.ts        stop list, illustrative coordinates, walking-time model
    network.ts      service lines, headways, service windows, walking links
    operators.ts    operators
    disruptions.ts  example alerts
    departures.ts   simulated departure boards + filtering
    journeyEngine.ts RAPTOR-style local planner, fares, delays, occupancy
    preferences.ts  preference model, defaults and option lists
  lib/         formatting, deterministic PRNG, localStorage, board helpers
  state/       single app provider: settings, preferences, favourites, saved
               journeys, recent searches, current search, toasts
  components/  ui primitives, layout shell, journey and stop modules
  pages/       one module per screen
  styles/      design tokens + base + components + map modules
scripts/       dev-only checks (see below)
```

The data layer is deliberately isolated: swapping `src/data` for real services would not
require redesigning the screens. Nothing in `src/components` or `src/pages` knows where
the journeys come from.

## Design system

The interface follows **Warm Tactile Minimalism v2.4** as specified in `DESIGN.pdf`:

* 70/20/10 colour balance on the warm canvas `#FCFBFA`, obsidian structure `#18181B`,
  sunset coral accent `#FF7E67`, with sage, butter and coral tints.
* Zero-blur depth: elevation is hairline borders (`#E8E6DF`) plus surface-fill contrast
  (L0 canvas → L1 ivory → L2 white → L3 obsidian). No `box-shadow` with a blur radius
  exists in the stylesheet.
* Squircle geometry with the nested-radius formula (`R_inner = R_outer − padding`):
  32/16, 28/12, 20/8, plus full capsule pills.
* Type scale and tracking from the manual (display 800/−0.02em, section 700/−0.01em,
  body 400/1.35, pill labels 700/+0.01em) on the `Plus Jakarta Sans` stack.
* Spring motion: press `scale(.97)` 120ms, hover `translateY(−2px) scale(1.02)` 240ms
  and a damped spring rest, all disabled by the “Reduce motion” setting.
* Minimum 44×44px touch targets, machine-readable `[OCR Visual Transcode]` blocks in the
  style modules, and the micro-UI signatures that apply here (avatar stacks with −8px
  overlap and 2px white rings, presence dots `#22C55E`, bezier sparklines in coral with a
  butter focal point).

Settings and preferences are stored in `localStorage` (`ov-planner:v1:*`). No account,
cookie or server-side storage is used.

## Dev-only checks

```bash
# simulated planner + departure boards smoke test
npx esbuild scripts/smoke-engine.ts --bundle --format=esm --platform=node \
  --outfile=/tmp/smoke.mjs && node /tmp/smoke.mjs

# server-side render of every page (catches runtime errors a build cannot)
npx esbuild scripts/render-check.ts --bundle --format=cjs --platform=node \
  --outfile=/tmp/render.cjs --loader:.css=empty && node /tmp/render.cjs
```

Both scripts run outside the app bundle; no extra dependency is required beyond esbuild
(already present through Vite).

## Status

Stage 1 (UI) only. Real transport data, real routing, geocoding, accounts and any
backend work are explicitly out of scope and have not been started.
