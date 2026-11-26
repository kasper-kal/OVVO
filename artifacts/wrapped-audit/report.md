# OVVO Wrapped: eighteen compositions

**SCREEN: WRAPPED AUDIT: 144 shots, 4 states, 18 chapters, 2 moments. No clipped-text, page-overflow or under-footer fault at 360x800, 320x568, 768x1024 or 1440x900.**

The shared visual pass is gone. It made every chapter the same soft gradient, the same glass card and the same small kicker over a giant left heading. The deck now gives each chapter its own structure:

- the cover is a year poster;
- the total is a number and a month chart split across the page;
- the name is a centred plate;
- the map is an atlas spread, copy on the left and the network on the right;
- distance is two measures side by side;
- the rail runs the full height of the page;
- the origins are a ticket wall;
- the hour is a wide night graph;
- straight through is a centred dial;
- the long haul is a timetable with the route beside the duration;
- the look is the photograph;
- the eras are a vertical timeline;
- the lines are a dark departure board;
- the awards are a certificate spread;
- the bookends are two large tickets;
- the comparison is a ledger;
- the crew page is a boarding pass and a form;
- the close is a quiet book page.

No chapter carries a stage gradient or a glass surface. Only the look keeps its photograph wash, because the words sit on the picture. The page is allowed to be a different shape, not just a different colour.

## The checks

- `node scripts/check-yearbook-compositions.mjs` reads the rendered deck at 1440x900. It prints **PASS: 18 chapters, 18 distinct structures, 15 heading measures, 7 named grid compositions, no shared stage gradients or glass.** Injecting one shared stage gradient makes the same check fail on every chapter and exit 1.
- `node scripts/audit-wrapped.mjs` records the four viewports and the two moments. The 360, 768 and 1440 runs are clean. The final 320 run, after the small-screen type fixes, is clean as well: no body overflow, no clipped text, no page overflow and no text under the footer.
- `npm run build` passes, including the type, style, class, corner and breakpoint audits.

The old `artifacts/wrapped-audit/contact-*.jpg` sheets may show the previous pass; the individual chapter shots and the measurements are the current run.
