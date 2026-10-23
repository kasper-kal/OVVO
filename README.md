# OVVO

An independent Dutch public transport journey planner. The interface is complete and
functional; the data layer ships with this build's own network data and is isolated
behind the same shapes a live timetable source uses, so it can be swapped without
touching a single screen.

The name is **OVVO** and the mark is a 2x2 checkerboard: O and V over V and O. The
artwork's outline lives in `src/components/ui/Icons.tsx` as three paths (`BRAND_INK`) in a
1024-unit box and is written to `public/favicon.svg` by the same paths — the mark is drawn,
not rastered, so it is crisp at 16px and at 256px and its two colours come from the palette.
There is no app bar: `<BrandMark />` sits alone and centred in the top row, and it says the
name by itself — no wordmark — while the alerts entry keeps the top-right corner it has
always had, with nothing painted behind it and nothing pinned in front of the page: the row
scrolls away with everything else, so there is no band over the content and no logo sitting on
a heading. The alerts count is one scroll from the top on a long page (the All sections sheet
and the sidebar carry the rest of the navigation). The old `ov-planner:v1:` `localStorage` prefix is
deliberately unchanged: renaming it would discard settings, favourites and recent searches for no
benefit.

## Run it

```bash
npm install          # install from the lockfile (dependencies are not pre-installed)
npm run dev          # Vite dev server on http://localhost:3000
npm run build        # typecheck (tsc --noEmit) + production build into dist/
npm run typecheck
```

The app is a single-page React app. Routing uses a hash router, so a refresh or a deep
link works on any static host.

### Previewing from another hostname

Vite refuses requests whose `Host` header is neither localhost nor an IP unless the host
is whitelisted, which shows up as `403 Blocked request. This host (...) is not allowed.`
The preview hostname for a cloud workspace changes whenever the workspace is restored, so
it is passed in at launch rather than written into the repository:

```bash
npm run dev:preview -- pv-<workspace-id>.style.dev   # wraps scripts/dev-preview.sh
```

`scripts/dev-preview.sh` exports `PREVIEW_HOST` for that one hostname; `vite.config.ts`
reads it into `server.allowedHosts` and the script starts Vite on `0.0.0.0:3000`. (Vite 8
no longer honours `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS`, which is why the hostname
goes through the config.)

The same variable can instead be pinned in **`.env.local`**, which Vite loads itself and
`.gitignore` excludes (`*.local`) — so nothing temporary lands in the repository:

```bash
# .env.local
PREVIEW_HOST=pv-<workspace-id>.style.dev
```

With that file in place, plain `npm run dev` already allows the preview hostname; after a
restore, replace the one value and restart. Without it the server stays localhost-only,
which is the right default for a checkout that is not behind a preview proxy.

The live site is served from Render by `npm run preview`, which checks the same header and
refused it until its own address was named. `vite.config.ts` therefore also allows
`ovvo.onrender.com` and whatever `RENDER_EXTERNAL_HOSTNAME` holds (Render sets that per
service, so a pull-request preview on `ovvo-pr-<n>.onrender.com` needs no edit), plus a
comma-separated `ALLOWED_HOSTS` for anywhere else. Each host is named individually: the
allow-list is never `true`, so an unknown `Host` still gets a 403.

## Screens

| Route | Screen |
| --- | --- |
| `/` | Home: a widget grid (journey planner, next departures at your station, your favourite stops, the network map, and your saved journeys) |
| `/results` | Journey results: the search card itself, with Start / End / Leave / Options, then sorting, filters and the journeys |
| `/journey/:id` | Journey details (full leg timeline, transfers, platforms, delays, occupancy) |
| `/stops`, `/stops/:id` | Stations & stops list and stop pages (facilities, access, board, alerts, nearby stops) |
| `/departures` | Departure board for one stop — stop picker, next departures, self-refreshing every 5 seconds by default |
| `/disruptions`, `/disruptions/:id` | Service alerts with filters, detail, advice, navigation |
| `/preferences` | Travel preferences with a live preview of their effect |
| `/settings` | Display settings, location access, planner defaults and local data management |

No route scrolls sideways: every screen is checked for horizontal overflow from 320px up.

**One width decides which site you get: mobile under 720px, desktop from 720px.**
`@media (max-width: 719px)` and `@media (min-width: 720px)` are the only queries that may
decide a mode, and `scripts/breakpoint-audit.mjs` fails the build when another width
appears outside the two named exceptions — `1040px`, where the sidebar replaces the dock
(the page is already desktop at 720, this only changes how navigation is drawn), and the
four density steps (`560`/`559`, `400`/`379`) that redraw a cramped control *inside* mobile
rather than switching layout. The rule is written out in `src/styles/base.css` (“the one
breakpoint”) and the boundary is measured: `scripts/ui-audit.mjs` runs every route at both
**719** and **720**, because the defects this rule replaced were all found in the gap
between two local widths — a home grid that kept two half cards at 390px, a stop picker
that capped its list as a phone up to 640px, a page head that changed shape at 641px.

Desktop uses a sidebar; mobile uses the floating obsidian dock plus an “All sections”
sheet. Every visible control performs a real action — nothing is a decorative link.

There is no full-screen page for favourited journeys or recent searches: both are managed
inside the same home-screen card, **Your journeys** — a filled heart per journey (with an
“are you sure?” confirmation before it is unfavourited) and a per-row cross plus a
delete-all button for the search history.

The home screen is a 12-column widget grid. Customising it is deliberately out of the way:
a small, muted “Customise home” control sits at the very foot of the page. Only then does
each removable widget show the same remove × in the same top-right slot of its card, and
only then does the **Add widget** catalogue (9 widgets, grouped Plan / Travel information /
Yours) become reachable. The planner widget is required and never shows a remove
control; the layout lives in this browser. With customising off, none of that chrome is
rendered at all.

The catalogue is what the widget audit (`WIDGET-AUDIT.md`) left: a card has to hold
something of the traveller’s or do something for them. Seventeen cards became nine — the
network counts, the operator list, the About card, the settings echo, the navigation
duplicate and the “stored on this device” card were cut, the two lists of journeys were
merged into **Your journeys**, and the alerts card became the alerts that touch a journey
you saved. A fresh browser opens with **Plan a journey**, **Next departures** (untied: it
asks for one station in the card itself) and **Favourite stops** — the three cards that
answer the question a traveller arrives with.

The planner widget is the compact two-row card described under *Design invariants* below:
From and To with a rail beside them and nothing else. Tapping either row opens the
full-screen picker, choosing the first end moves you to the other, and choosing the second
runs the search and opens the results — the flow the card is copied from.

The home screen's **Network map** widget draws the network itself: every stop is placed
on the map module's 0–100 canvas from its schematic position, each line is drawn between
the stops it calls at, and the mode chooser (All routes, Bus, Train, Tram, Metro, Ferry)
filters which services are shown. A corridor shared by several services is drawn once per
mode — forty-one services over a handful of corridors used to paint the network near-black.
Stops open their own page, and a handful of junctions are named: a name takes the first of
six positions (beside its dot, then above, then below, leaning inwards) whose box clears
every dot and every name already placed. The names are the traveller’s own where they have
any — the stops they hearted, then the stops nearest them — and only a traveller who has
chosen nothing and shared no location gets the busiest junctions. The card is eight columns
because the drawing is capped at 480px square; the line under it names those stops in words
that cannot collide. Every “map” link in the app jumps to that widget and highlights what
was asked for.

## Location

The app asks once, on the first visit, whether it may use the device location. The answer
is stored (`ov-planner:v1:location-consent`) and the question never returns by itself;
Settings can switch it back on, and the browser's own permission is always the final say.

When a position is available, **From** and **To** each lead their suggestion menu with
“Use my current location”. That resolves the fix to the nearest stop *that has services*
(walking-only landmarks are skipped), fills the field with “Current location”, and shows
the resolved stop and its distance underneath. The stop list carries real WGS84
coordinates (`geo` in `src/data/stops.ts`) next to the schematic canvas position the map
draws on, so the match is a true great-circle distance rather than a guess on the canvas.

## Architecture

```
src/
  data/        network data + the planner (no UI, no React)
    types.ts        domain vocabulary (stops, legs, journeys, alerts, departures)
    stops.ts        stop list, schematic canvas + real WGS84 positions, walking model
    network.ts      service lines, headways, service windows, walking links
    operators.ts    operators
    disruptions.ts  service alerts
    departures.ts   departure boards + filtering
    journeyEngine.ts RAPTOR-style local planner, fares, delays, occupancy
    preferences.ts  preference model, defaults and option lists
  lib/         formatting, deterministic PRNG, localStorage, board helpers
  state/       single app provider: settings, preferences, favourites, saved
               journeys, recent searches, current search, location, toasts
  components/  ui primitives, layout shell, journey, stop and location modules
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
  style modules, and the micro-UI signatures that apply here (presence dots `#22C55E`, the
  occupancy meter's butter/sage/coral tones).
  The manual also specifies avatar stacks and coral bezier sparklines; both were built and
  both are **deleted** — they were the two places that drew data nobody had (three invented
  traveller initials beside a count, and a random per-hour series), so the occupancy module
  is now the level pill and its meter only.

### Invariants the stylesheets keep

A consistency pass (see `DESIGN_DECISIONS.md` R33) enforced these, and they are what the
audits check:

* **One place for colour.** `src/styles/tokens.css` is the only file in the project that
  contains a hex value; every tint ships its background, hairline border and ink together
  (`--tint-coral`, `--tint-coral-border`, `--tint-coral-ink`). No component invents a shade.
* **No raw sizes.** Font sizes come from the type scale (`--fs-pill` 11, `--fs-sm` 12,
  `--fs-body` 13.5, `--fs-section` 16, `--fs-h2` 19, `--fs-h1` 24, `--fs-display` 29) and
  every gap, padding and margin is a step on the 4px rhythm (`--s-1` … `--s-12`). The only
  px values outside the scale are optical nudges (the range thumb, `.sr-only`) and SVG
  user units.
* **A page is named once, and not on screen.** Each route renders its name and description as
  `sr-only` — assistive technology, the document outline and reader mode get them; the screen
  does not. There is no breadcrumb line either (`PageHeader` has no such prop, and the
  `.breadcrumbs` rules are gone). Where you are is carried by the navigation, which highlights
  the section you are in, and by the mark at the top. What a page header still draws is that
  page's own actions.
* **One rhythm per role.** `--s-6` (24px) between the sections of a page (`.stack-6`),
  `--s-4` (16px) between the items of a column or card list (`.stack-4`), `--s-3` inside a
  card (`.stack`), `--s-2`/`--s-1` inside a label group. Pages do not set their own gap.
  A control's name sits one 8px step above it — the same step in `.field` and in
  `.combobox`, so a label is never closer to its box in one place than another — and a
  chip group is separated from the surface it drives (the map) by 16px, twice the 8px
  between its own rows.
* **Concentric nesting.** A surface that sits on a parent's padding line takes
  `R_outer − padding` (28 → 12 at the card's 16px inset). The one documented exception is
  the form input scale (`--r-input` 20px), which the manual defines as its own squircle
  family.
* **The planner is one card, and it holds nothing else.** The two ends are a From button and a To
  button inside a single 106px card, with a rail in the left gutter — a hollow ring at the departure
  end, a line, a filled square at the arrival end — and a hairline between the rows that starts where
  the text does. The card carries no field boxes (the card is the box, so a row is the target), no
  date, no preferences and no search button: the second stop is the search. The rail's two nodes are
  centred on the two row centres *by construction*: the rows are `--planner-row` (52px) each, the
  hairline is a 0-blur inset shadow rather than a border so it cannot add half a pixel, and each node
  is anchored `row/2` from its own edge — measured identical to the pixel at 320/360/390/768/1440px,
  in the empty, filled and error states. What is missing on an error is answered on the rail itself —
  the ring or the square turns coral — rather than by tinting the whole card. The reverse control is
  **not** here: two rows a thumb apart can be re-picked, and swapping them is a job for the picker
  screen, where it sits between the two fields of the card the way a finished 9292 search leaves it.
  The destination's placeholder is checked at every width like every other field: at 320px it ends
  inside the field with room to spare, because the row no longer reserves space for a swap control.
* **Typing lives on the screen built for it.** Tapping a row opens the full-screen picker — back
  arrow, centred title, the same card made editable, the reverse control, `Use my current location`
  and `Choose on the map`, then the ranked stop list with a heart per row (a favourite, which leads every stop list — a pin belongs to the departure board instead). The caret lands in the
  row that was tapped, so a phone keyboard is up before the screen has settled; picking the first end
  moves to the other one, and picking the second runs the search. Both the picker and the inline
  combobox that other screens still use rank stops through one function (`rankStops`), so the two can
  never disagree about what a query matches.
* **The map picks by pin, not by dot.** `Choose on the map` opens the network at full size: the map
  slides under a pin fixed at the centre of the screen, and the stop nearest the pin is the one named
  and offered. The drawing (and the geometry behind it) comes from `src/data/map.ts`, shared with the
  home map widget, so dropping a real basemap in later is a change to the map surface alone.
* **Chip groups have one shape.** A group of chips named by the item in front of it stacks
  the name on its own line below the two-column breakpoint and lays the chips out in even
  columns, so a wrapped chip row never rags around its name.
* **A segmented control holds two or three short options, and fits the column it is in.** It
  is a flex item, so it shrinks (`min-width: 0`, `max-width: 100%`) instead of dragging the
  page sideways: the journey sort was six options in a segmented control and measured 503px
  inside a 332px column — 142px of document overflow at 390px, 212px at 320px — and once it
  did fit the column it still could not sit on one line, so squeezing it into rows turned the
  control into a 150px blob. Six options are a list, so they are a labelled select (the way
  the stops list sorts itself), with the "N of M shown" count beside it.
* **A tag that can wrap gets room to breathe.** A 24px capsule carries no vertical padding of
  its own, so the one tag long enough to wrap — the modes line of the preferences summary —
  sat against its top and bottom edges with its text running into the rounded ends. In that
  list a tag takes one 8px step of vertical padding and a 12px inline inset: the single line
  reads as it did, the wrapped one has air and clears the ends.
* **The icons are a library's, not ours.** Every glyph comes from **Lucide**
  (`lucide-react`, ISC) — 24-unit grid, 2-unit stroke, round caps — and one, `walk`, from
  **Tabler Icons** (MIT), because Lucide has no walking figure at all (a standing person and a
  pair of footprints is what it offers) and a journey planner cannot do without one; its path
  data is copied into `Icons.tsx` with its attribution rather than adding a second dependency
  for one glyph. The app's names are kept and mapped onto the library's shapes (`station` → a
  building, `board` → a monitor, `location` → a crosshair, `ferry` → a ship, `metro` → the
  tunnel train), so no call site changed. What was here before was hand-drawn path data, and it
  is exactly where the gear with the off-centre hub, the sprawled walker, the low-slung bicycle
  and a walking figure that read as sitting came from: a build, a type check and a class audit
  are all blind to a glyph drawn half a unit off its own centre, and a measurement that only
  checks the *box* cannot see it either — the library places its ink a little above the box
  centre on purpose, to sit with a text line. So the audit that guards icons now measures them
  against the text they sit beside, not against box symmetry (`scripts/icon-audit.mjs`), and
  `scripts/icon-sheet.mjs` prints the whole set at every size it is drawn at, so a mapping can
  be looked at rather than argued about. One stroke weight at every size (Lucide's 2 units on a
  24 grid is 1.0px at 16px and 0.75px at 12px, which stays legible); `heartFilled` is the
  filled drawing.
* **An icon is square, whatever its row does.** It is a flex item almost everywhere here, and
  flex items shrink: when a row ran short of space the *width* collapsed while the height held,
  so a glyph was drawn squashed rather than smaller — the favourites star at size 15 rendered
  11.66 × 15 and the departure-board button 14.72 × 15, on a screen whose own layout was
  otherwise right, which is why a screenshot and a build both missed it. `.icon` is `flex: none`
  now, and the audit asserts each icon's box is square and a whole number of pixels.
* **A row inside a line of text is aligned to the text's middle, not its baseline.** The mode
  glyphs under a stop name on the departures board sat ~3px high (train −2.59px, tram/bus/ferry
  −3.00px, metro −3.40px against the label) because an inline-flex box takes its baseline from
  its first item, and an `svg`'s bottom edge is its baseline. `vertical-align: middle` puts the
  box on the line's optical centre, the same rule plain icons get.
* **Secondary ink is a contrast decision, not a taste one.** The two secondary tones used to
  fail the thing they exist for: the faint tone measured **2.45–3.02:1** across the card
  surfaces and the tints, at 11–12px, against the WCAG AA requirement of 4.5:1 — and it was
  the tone every placeholder, hint line, stop subtitle and platform label was set in. Both
  tones were taken down to values that clear **4.5:1 on white, ivory, sage, coral and butter**
  (`--ink-muted: #5f5f66`, `--ink-faint: #66666d`, still ordered strong > muted > faint). The
  focal coral is a *background* colour: as ink it is 2.49:1 on white, under the 3:1 non-text
  minimum, so an empty state's glyph is drawn in `--accent-primary-ink` (#d9533a, 4.0:1) —
  the same hue, dark enough to be read.
* **A target is 44×44 as measured, not as declared.** Three claims were wrong: the header's
  alerts entry said "36px of paint, 44px of target" but the transparent 1px border ate 2px of
  the pseudo-element's box, so the target was **42px**; the circular icon buttons were
  declared `width: 44px` and a tight flex row squeezed them to **21/26/39px wide against a
  44px height**, so they were ovals with a target under the mark (`flex: none` now); and the
  skip link was **18px tall** when it appeared. A text link that is its own control takes
  `.tap-target`, and no longer does that mean only the results page: the stop names, the
  neighbouring stops and the board's alert link take it too.
* **A touch target is 44×44, including the ones that are only text.** A text link that is
  its own control (`.tap-target`) keeps its type size and grows its hit area with a
  pseudo-element instead of adding a row of height; the header's alerts entry does the same
  on 36px of paint; and the compact segmented variant's buttons fill their 44px capsule
  instead of sitting 32px inside it, which was the only control in the app under the mark
  with a band above and below that looked tappable and was not.
* **No list repeats the same trip.** A journey with no service in it is offered once, not
  once per departure offset: the whole-way trip is added by the planner itself (on foot, or
  on a bicycle when both ends asked for one) and the search no longer walks the single link
  from the origin straight to the destination. That link repeated the same foot journey at
  five-minute intervals — 8 of 14 options on one measured pair — and where it was much
  faster than every service it replaced the services altogether.
* **Nothing scrolls sideways.** A pill is `min-height` with wrapping text rather than a
  fixed 24px `nowrap` line: the preferences summary lists every mode, and at 320px that one
  pill used to be wider than its card and dragged the whole page 29px sideways.
* **One name per thing.** Modes and stop types come from a single table (`MODE_LABELS`,
  `STOP_TYPE_LABELS` in `src/lib/format.ts`) and reach the screen through `modeLabel()` /
  `stopTypeLabel()`; the data layer's own values (`metrostop`, `walk`) are never printed.
  Chip labels are sentence case, group names above chips are uppercase `.field__label`,
  and nothing repeats a group name in a different case.
* **No undefined variables.** Every `var(--…)` in the CSS and TSX resolves to a token in
  `tokens.css`; a typo used to fail silently.
* **Every style module is imported.** `map.css` is only useful through the entry point;
  it was once dropped from `main.tsx` and the stop page's map silently rendered as an
  unstyled black rectangle.

Settings, preferences, pins, favourited journeys, recent searches, the widget layout and
the location answer are stored in `localStorage` (`ov-planner:v1:*`). No account, cookie or
server-side storage is used.

**Two things leave the browser**, both of them to place the traveller on the list of stops, and
neither of them with a key, an account or anything of the traveller's own in it.

*Turning a position into a place name.* "Use my current location" resolves the device position
to a street address through **OpenStreetMap's Nominatim** (`src/lib/reverseGeocode.ts`) — one
request per tap, asked for one point, credited where the address is shown. If the lookup fails,
or the app is offline, the row falls back to the nearest stop, which is what it did before the
lookup existed.

*Finding roughly where the traveller is when the device will not say.* The stops list sorts
nearest-first, and when there is no device fix it uses a coarse country/city-level estimate from
the public IP, so it asks for one on load: **`ipwho.is`**, then **`freeipapi.com`** as a second
provider (`src/lib/approximateLocation.ts`), first answer wins, any failure silent. The estimate is
cached in `localStorage` for **a day** rather than re-asked per visit, and the screen says which
of the two it is using — *"from an approximate IP location — it can be off by a lot"* — because
an estimate presented as a measurement is a different kind of lie from no estimate at all. With
the device's own fix the estimate is ignored; with neither, the list sorts by city and says so.

The device's position is not stored anywhere else, and nothing else is sent.

## Dev-only checks

```bash
# planner + departure boards smoke test
npx esbuild scripts/smoke-engine.ts --bundle --format=esm --platform=node \
  --outfile=/tmp/smoke.mjs && node /tmp/smoke.mjs

# server-side render of every page (catches runtime errors a build cannot)
npx esbuild scripts/render-check.ts --bundle --format=cjs --platform=node \
  --outfile=/tmp/render.cjs --loader:.css=empty && node /tmp/render.cjs

# every class name used in the markup has a rule (catches a typo, which otherwise fails
# silently: `.stack-3`, `.row-2`, `.status-dot--sage` and `.t-h3` all shipped dead)
node scripts/class-audit.mjs

# every icon, on every route and width, read out of a real browser: square, a whole pixel,
# named, weighted, and sitting on the optical centre of the text beside it. Needs a browser
# (Playwright is a dev dependency; one command fetches the Chromium it drives):
#   npx playwright install chromium
# and a dev server on :3000 (or pass an origin). In a restored sandbox Playwright's Chromium
# exits 127 for a dozen missing system libraries and there is no root to install them, so
# `source .logs/playwright-libs.sh` first: it fetches them as .deb packages into $HOME/syslibs,
# writes the fontconfig file the browser needs to repaint, and exports LD_LIBRARY_PATH and
# FONTCONFIG_FILE. Every browser check and probe below goes through it
node scripts/icon-audit.mjs

# the consistency audit: every control on every screen — its glyphs, its shape, the landmark
# and row it sits in and the side of it — grouped by the *action* it performs, so the same action
# wearing a different shape or place on another screen is printed as a finding. The signature is
# height, radius, border, fill and glyph (a pill's width is what its label says, so it is recorded
# but not judged), and a control past its landmark's own edge reads `offscreen` rather than `foot`.
# Report mode is the default (findings are the output, exit 0). `--gate` fails on two things: one
# action drawn with two glyphs in one state (never exempt — `pin` and `×` for one toggle is what
# this audit exists for), and any difference that is not a decision on the record. Those decisions
# are the `DELIBERATE` map in the script itself, one entry per action with its reason, printed in
# the report. The standards each finding cites — W3C COGA, WCAG 3.2.3/3.2.4, NN/g 4 — and the rules
# the app follows (one glyph, one place, one word per control; a *kept* stop is a drawing pin that
# fills; `Customise home` arranges the grid and does not filter it) are in CONSISTENCY-AUDIT.md,
# with the before/after runs in .logs/audit-before-*.json
node scripts/consistency-audit.mjs [origin] [--gate]

# every text and icon against the surface it sits on (WCAG AA, 4.5:1 body / 3:1 large and
# icons), every control's *effective* target found by probing points (so a pseudo-element's
# growth counts and a paint box does not), any text wider or taller than its own box, and
# the header's two promises — that the row *sticks* (scrolled 400px, its top is still at 0)
# and that it *paints nothing* (no background, image or shadow while stuck). Both are
# behavioural, so both are measured; run UI_AUDIT_THEME=dark and UI_AUDIT_LANGUAGE=nl to
# audit the other appearance and the longer language
node scripts/ui-audit.mjs

# the dashed enclosure, as paint: screenshots the empty box from a real browser and walks its
# straight edge and its four corner arcs per position (PIL), because "the corners got done" is a
# claim about pixels, not about CSS
node .logs/empty-ring-check.cjs

# the chunk rule, on every list that holds items back: what loads must equal five times what
# the layout puts side by side, and one press must add exactly one batch — measured at 390,
# 900 and 1440 on the stops grid, the board page's favourites row, the results screen's
# carrier row and the departure rows themselves
node .logs/round10-check.cjs

# every piece of interface text that does not start with a capital letter. Walks 18 screens
# and states in both languages (text nodes, placeholders, aria-labels), then scans the rest of
# the Dutch dictionary and the JSX literals the walk cannot reach; sorts each hit into label /
# sentence / tail-of-a-sentence / code, because only the first two are defects. Needs a dev
# server on :3000 (or CAPS_URL). Exits 1 on a lowercase label or sentence, so it gates.
node scripts/caps-audit.mjs

# the one-colour theme, as behaviour (R108): cream is the default and Reset returns to it, a tint
# paints the page's wash, every widget card and the sidebar and flips the card's ink when it is
# dark, glass blurs and stays translucent over a photo, the solid treatment paints the tint, the
# eyedropper takes a pixel out of the stored wallpaper, the choice survives a reload and nothing
# overflows a 390px phone. Exits 1 on a failure.
node .logs/tint-check.cjs

# the same theme as *contrast*, route by route: it resolves the nearest painted surface behind
# every text node (compositing translucent layers, and over a photo against a black *and* a white
# wallpaper, because a wallpaper is unknown) and reports any pair under 4.5:1. 5 tints × 2
# appearances + 4 photo cases × 10 routes — the instrument that found the map's labels at 1.11:1
# on a dark tint and iOS blue at 4.34:1 under its own ink
node .logs/tint-contrast.cjs

# the icon set as a page to look at: every name at every size it is drawn at, rendered from
# the same components the app renders -> .shots/r57/icon-set.html
node scripts/icon-sheet.mjs
```

The first three run outside the app bundle and need nothing beyond esbuild (already present
through Vite). The browser audits (`icon-audit`, `ui-audit`, `caps-audit`, `precision-audit`)
need Playwright. It is a **dev dependency** now, so `npm ci` brings it and one command brings
the browser it drives:

    npx playwright install chromium

It is still not part of the app: nothing in `src/` imports it, and it is not in the bundle.
The browser audits are checks, not something that ships.

The browser audits are the ones that earn their keep: everything fixed in R55, R56, R57 and R58 was
found by one of them and by nothing else, and `caps-audit` (R70) was built for the one question
no other instrument asked — what the interface says when read as English sentences rather than
as layout, and `.logs/round10-check.cjs` (R73) for the one number the interface promises about
itself: how many items a list loads, which is five rows' worth and is read off the layout rather
than declared — and it found two live defects on its first honest run, after being proved able to
fail against three strings planted on purpose — ~7,700 text and icon nodes read for contrast and 625
controls probed for target size per run (`ui-audit`), plus 3537 icons checked for shape, size
and alignment (`icon-audit`), across 11 routes at 320/390/768/1024/1440.

Layout, colour and geometry claims in this file and in `DESIGN_DECISIONS.md` are measured
in a real browser (Playwright Chromium against the dev server) at 320/360/390/430/768/1024/
1440px — including every icon, read out of the DOM on every route (`scripts/icon-audit.mjs`,
3537 icon instances over 11 routes × 5 widths (320/390/768/1024/1440), each checked against the text it sits beside): horizontal overflow per route and per overlay, every control's effective hit area
(probed by point, so a pseudo-element's target counts and a paint box does not), the sort
control's options on screen and the dialogs' fields, widget-grid rows without holes, the
planner card's rail-to-row alignment and its folded/open heights, the label rhythm of a
control and its box,
and the map's names — which must keep
real air from every stop dot, a pad apart from each other and clear of the corridors they
sit among (measured in the canvas' own 0–100 units, from screen rectangles: `getBBox()` is
relative to a name's own `<g transform>` and cannot tell whether two names collide). Playwright is a dev dependency, so those
runs need `npm ci` and `npx playwright install chromium`, but they stay out of the app bundle. Three things about the environment: the VM needs
system fonts (`/usr/share/fonts` plus a fontconfig) — without them Chromium's renderer
crashes on any nested form field — and it needs the usual Chromium shared libraries.

The third is DNS. `index.html` loads the Google font as a **blocking** stylesheet, so on a VM
whose external DNS is dead nothing settles: `page.goto(..., 'load')` times out before a browser
audit measures anything, and the failure looks like a broken page rather than a broken network.
Chromium has its own resolver, so `/etc/hosts` is not the lever even when it is writable; the
launch argument is, and a `NODE_OPTIONS` preload can add it without touching any audit:
`--host-resolver-rules=MAP fonts.googleapis.com 127.0.0.1,MAP fonts.gstatic.com 127.0.0.1,
MAP ipwho.is 127.0.0.1,MAP freeipapi.com 127.0.0.1`. The font hosts then refuse instantly and
the audits measure the layout on the **fallback face** — which is what the app looks like
offline, and not a weakened check: targets, contrast, clipping and overlap are all measured, only
the glyphs differ. (The two IP providers are in the list so the estimate fails in microseconds
instead of hanging for its own timeout; checks that *want* an estimate stub it themselves.)

## Appearance and language

The interface is written in **two languages** and drawn in **two appearances**, both chosen in
`/settings` and both stored in this browser.

* **Appearance:** System (default, follows the device live), Light, Dark. Dark is a full token
  override in `styles/tokens.css` applied as `data-theme` on `<html>` — not a filter, and not a
  second set of components. The structural obsidian and the accents are deliberately the same in
  both, because they are the dock, the primary button and the 10% of the palette that carries
  meaning.
* **Text selection:** five colours the palette owns, or the traveller's own from the device's
  colour picker (`Settings → Text selection`). The ink on the highlight is not chosen: `lib/selection.ts`
  measures the colour and picks whichever of the app's two inks has more contrast, so a dark colour
  gets light text. The pair is written to `<html>` as `--selection-bg` / `--selection-ink`, the two
  properties `tokens.css` already declared.
* **Language:** English (default) and Nederlands. `src/lib/i18n.ts` holds the dictionary and
  `translate()`; `src/lib/useT.ts` is the hook. Keys are the English sentence itself, so a line
  that has not been translated yet falls back to English rather than to an identifier, and the
  dictionary reads as a list of sentences. Dates, durations and toasts follow the setting too —
  weekday and month names come from `Intl`, and `pushToast` translates centrally.

The **interface** is translated. The demonstration data is not, and neither is the longer prose
on `/disruptions`, `/journey/:id` and the preferences controls: stop names, line numbers and
carrier names are the timetable talking, and translating a station name would be a lie about a
real place.

### Battery

The app reads the device's battery with the **Battery Status API** (`navigator.getBattery`) and
saves power on its own, in two steps, with nothing to switch on and nothing stored:

* **At 20% or less — saving.** Every transition and animation is cut to a single step (they still
  reach their end state, they just do not travel), the spinner and the skeleton bars stand still,
  the results screen and the stops list stop holding their place with a fake wait, and a deep
  link scrolls instead of gliding.
* **At 10% or less — super saving.** The above, plus: no frosted glass and no shadows, no request
  spent on the IP location estimate, and a home screen that keeps only the cards that answer
  *when does the bus go* — the planner, the next-departures card and the hearted stops — with one
  line saying so. Leaving customising, or plugging the phone in, restores the whole interface.

`src/lib/power.ts` holds the rule (`powerModeFor`: 20% and 10% in, two points above each out, and
charging is always off) and `styles/base.css` is where the reduction is drawn, from one attribute
on `<html>` — `<html data-power>` — the same shape as the motion switch. Settings shows the mode
and the level as a reading, not a control.

**The API is Chromium's.** Safari does not implement it and Firefox removed it, so there no mode
ever starts and the full interface is what is drawn; Settings says *Not reported* rather than
pretending a mode is on. Because the modes only ever subtract, a browser without the API loses
nothing but the saving.

## Status

The interface is feature-complete for the current design. The remaining work to make it
production is data: pointing `src/data` at real timetable, alert and geocoding sources,
and giving the map widget a geographic basemap (coastline and water) behind the network it
already draws. Accounts and server-side storage are not started.

Scheduling a journey uses the device's own date and time pickers (`<input type="date">` and
`<input type="time">` in the results screen's *When* dialog). A native control draws in the
device's locale, so it does not follow the app's Clock format / Date format settings; the same
answer is printed under the fields in the app's own format, and the stored value (an ISO date and
minutes since midnight) is unaffected either way. The second language covers the interface rather than the data; **85 interface strings are still
English in Dutch** (`DESIGN_DECISIONS.md` P5), concentrated in the alerts list, the stop page, the
journey page and the preference controls.
