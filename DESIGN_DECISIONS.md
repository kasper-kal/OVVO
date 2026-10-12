# OV Planner — design decision log

Short record of design decisions, kept current during the UI finetuning phase.
Status values: **approved** (do not revisit), **pending** (proposed, awaiting your
verdict), **baseline** (stage 1 implementation, not yet reviewed by you).

## Approved by you

| # | Decision | Scope | Date |
| --- | --- | --- | --- |
| — | _nothing approved yet_ | — | — |

## Refinement round 1 — implemented, awaiting your verdict

| # | Change | Requested |
| --- | --- | --- |
| R1 | App bar reduced from a 78px block (logo tile + two-line title + butter pill + filled button) to a 53px obsidian capsule: 28px mark, single-line wordmark, 22px outlined "Demo data" chip, ghost info button | "header much and much too big and overwhelming" |
| R2 | Planner page now leads with the search form: page title reduced to one 24px heading with the description under it, the four stat cards removed, popular journeys / recent searches / favourites moved below the form in a quiet two-column block, dataset facts compressed into one muted line at the end of the page | "journey planner should be the first thing the user sees, and it shouldn't be this overwhelming" |
| R3 | Planner page lost its coloured blocks: the butter notice banner, the sage "what this stage does not do" panel and the ivory quick-fill panel are gone; the demo label is now a hairline "Simulated data" pill plus one sentence | "too much bright colours and stuff" |
| R4 | Mode badges no longer use solid fills: train became ivory/hairline (was solid obsidian), bus became coral tint (was solid coral). Mode is still identifiable at a glance, but as light tints | "too much bright colours" |
| R5 | Journey cards and journey detail keep only semantic colour — metric highlight (butter), delay/cancellation (coral) and occupancy meter — while "Direct", occupancy, service and alert chips became neutral hairline chips | "too much bright colours" |
| R6 | Icons inside sentences now flow inline, fixing arrow glyphs that were forcing awkward line breaks (route labels, breadcrumbs, journey summaries) across several screens | layout bug found while re-checking R2 |

## Baseline (stage 1, not yet approved)

| # | Decision | Scope |
| --- | --- | --- |
| B1 | Warm Tactile Minimalism v2.4 applied literally: 70/20/10 palette, zero-blur hairline elevation, squircle radii with nested formula, spring motion, 44px touch targets, OCR transcode blocks | whole app |
| B2 | Home canvas `#FCFBFA`, obsidian `#18181B` header and mobile dock, coral `#FF7E67` as the single focal accent, butter `#FFF5A5` for highlights/badges, sage `#E1EADF` for positive status | whole app |
| B3 | Desktop navigation = white L2 sidebar card; mobile navigation = obsidian floating capsule dock plus an "All sections" sheet | app shell |
| B4 | Journey results = one card per option with time pair, duration pill, mode chain, meta row, occupancy module and inline expandable leg timeline | results |
| B5 | Map is a schematic drawing on the prototype's own canvas (no tiles), with zoom/pan controls and collision-avoided labels | map |
| B6 | All simulated figures carry a "Simulated data" / "Example" badge, plus explanatory notices on data screens | whole app |
| B7 | English interface copy with Dutch place and operator names | whole app |

## Pending proposals

| # | Proposal | Waiting on |
| --- | --- | --- |
| P1 | How far to take the palette reduction — see open question Q1 | your answer |
| P2 | Next screen or element to refine | your instruction |

## Open questions

| # | Question | Asked |
| --- | --- | --- |
| Q1 | Is the current colour level right, or should the remaining tints (butter highlights, sage/butter/coral tints, coral accent) be reduced further — and should anything stay colour-coded? | round 1 report |
