# Style sweep: fifty styles, ten pages, five hundred photographs

This file tracks what the sweep found. Every claim below is either a measurement written by
`scripts/style-sweep.mjs` (`.logs/sweep/metrics.jsonl`) or a picture in `.logs/sweep/shots/`, and the
contact sheets that group them are in `.logs/sweep/sheets/`.

Status key: **OPEN** means found and not fixed. **FIXED** means changed and re-measured.

## The fix pass, and what the re-measurement says

Every open finding was worked on, and the thirty styles that failed were photographed and measured
again (300 more screens). The numbers below are from that second measurement, not from intent.

| what | before | after |
|---|---|---|
| screens below 3:1, unreadable | 40 of 500 | **0 of 500** |
| screens below 4.5:1, under AA | 96 of 500 | **52 of 500** |
| header controls under 44px | 2 on all 50 styles | 0 while the rule existed, then **reverted on request** (see finding 7) |
| screens spilling past the edge | 0 | 0 |

The delay and cancellation text was the worst fault in the app and it is gone: the worst of those
screens now measures 4.66:1 where it measured 1.03:1.

What still stands below 4.5:1 is a narrower thing: ten styles draw small 11px labels (a mode chip
reading "Tram", a timezone note reading "UTC") at 3.6–4.0:1. That is a second, smaller ink family
with its own surface, and it has not been fixed yet — it is finding 2 below, moved from OPEN to
**PARTLY FIXED** rather than quietly dropped.

---

## The catalogue: fifty became twenty

The sweep's central finding was that about forty of the fifty styles were one layout recoloured, and
the answer to that is subtraction, not more decoration. **Thirty styles were removed; twenty stay.**
The test for keeping one was that a person could tell it from every other style in a list of names:
its palette, its shape and its lettering all have to differ, not just its corner radius.

The twenty, in the order the picker draws them:

- **Basic** — Tram (the default, untouched)
- **Luxe** — Navy and Gold, Midnight Silk, Bordeaux
- **Modern** — Poppy Blue, Ultraviolet, Cyber Teal
- **Editorial** — Broadsheet
- **Dutch** — Spoorboekje, Rijksmuseum, Station Sign
- **Dark** — Obsidian
- **Reading** — Contrast, Night AA
- **Soft** — Sage
- **Loud** — Mustard
- **Technical** — Terminal, Blueprint
- **Photo** — Marble, Arches

Removed: Emerald and Brass, Oxblood, Pearl, Citrus Pop, Bubblegum, Electric, Salon, Monocle,
Literair, 1974, Polder, Nightbus, Deep Sea, Ink, Sunlight, Linen, Mist, Blush, Vermilion, Klein Blue,
Forest, Signal, Plaster, Silk, Ember, Frost, Graphite, Lacquer, Bokeh, Grain.

What that costs and does not cost:

- **Nobody's page breaks.** A browser holding a removed style is moved to the nearest remaining one
  by colour distance, which is the same path that already carried people from the old colour
  settings into styles.
- **Every group shelf still holds at least one style**, so the picker draws no empty headings. The
  eleven group entries were rebuilt when the cut accidentally took them with it.
- **The photograph list follows the catalogue.** `public/style-photos/README.md` now names twenty
  files, and a picture named after a removed style is ignored.
- **A smaller download.** The style catalogue is in the main bundle, so thirty palettes are gone from
  what every phone reads at startup.

Re-measured after the cut, twenty styles on ten pages (200 screens):

| | |
|---|---|
| screens below 3:1 | **0** |
| screens below 4.5:1 | 18, all of them the 11px `Tram` chip and `UTC` note (finding 2) |
| header controls under 44px | 2 — Edit and the alerts pill are 48 × 36 and 69 × 36 again, by request |
| screens spilling past the edge | **0** |
| text under 11px | 40, down from 100 |

The styles that were cut were never photographed again, so their old sheets are gone with their
folders: `.logs/sweep/sheets/home-*.png` now shows the twenty that remain.

## What was captured

| | |
|---|---|
| styles | 50 (every style in `src/lib/styles.ts`, the eleven group ids excluded) |
| pages per style | 10: home, stops, stop detail, departures, disruptions, results, preferences, settings, styles, map |
| photographs | **500**, at 390 × 844 CSS pixels, device scale 2, light appearance, no photo background |
| size | 59 MB in `.logs/sweep/shots/<style>/<page>.png` (ignored by git) |
| measurements | 500 rows in `.logs/sweep/metrics.jsonl` |
| contact sheets | fifty styles side by side, per page, in `.logs/sweep/sheets/` |

Every screen was photographed **after** the location sheet and the install banner were closed, so a
dimmed page is never mistaken for a dark style. Reduced motion was on, so a mid-animation frame is
not mistaken for a broken layout.

The sweep was run twice. The first pass counted text a sighted reader never sees (screen-reader
labels, a skip-link parked off to the left) and reported Station Sign's settings screen at 1.03:1 on
a perfectly readable screen. The second pass skips hidden, clipped and 1px elements, and the numbers
below are from it: `spilling: 0` where the first pass claimed 500.

How to read it again:

```
node scripts/style-sweep.mjs          # 500 photographs, about 17 minutes
node scripts/style-report.mjs         # the summary below, from the measurements
node scripts/style-sheets.mjs --page home --cols 4 --thumb 300 --per 18
```

---

## The findings

### 1. Delay and cancellation text is unreadable on twenty styles · FIXED and re-measured

`.delay` in `src/styles/components.css` paints its text with `var(--coral-ink)`, one fixed token for
all fifty styles. On a pale style that red is fine. On a dark style it is dark red on near-black.

Measured worst screen per style, out of 500:

```
1.03:1  station-sign    1.04:1  emerald-brass   1.07:1  literair      1.26:1  oxblood
1.35:1  bordeaux        1.42:1  silk            1.42:1  graphite      1.47:1  arches
1.49:1  deep-sea        1.51:1  marble          1.54:1  navy-gold     1.57:1  bokeh
1.65:1  ember           1.71:1  obsidian        1.75:1  nightbus      1.85:1  ink
1.85:1  terminal        1.86:1  night-aa        1.86:1  lacquer       1.88:1  midnight-silk
```

That is **40 of 500 screens below 3:1**, and they are the same fault twice per style: the `+3`
delay on a board row (settings) and `Cancelled` (stops). Text needs 4.5:1 to be comfortably read.

Evidence: `.logs/sweep/shots/emerald-brass/stops.png` and `.logs/sweep/shots/station-sign/settings.png`.

The cause is that this one token is not derived against the surface it is drawn on, which is the
opposite of how `src/lib/styles.ts` handles every other ink in the app.

### 2. A second family of muted captions misses the 4.5:1 line · PARTLY FIXED · severity: high

96 of 500 screens have their worst text below 4.5:1. Beyond the twenty above, these ten styles sit
between 3.6 and 4.0, which is legible but under the line:

```
3.62 cyber-teal   3.79 pearl    3.80 blush     3.82 monocle   3.90 forest
3.94 linen        3.96 ultraviolet 3.98 sage   3.99 plaster   3.99 frost
```

The text is the small muted caption under a control ("Light, dark or the device setting", "Nearest
first, from an approximate IP location"), so it is the type people skip rather than the type they
cannot use. It is still under AA and it is a style-by-style decision, not a page fault.

### 3. The cut-off density row is the dock, not the card · CLOSED, not a fault

At full size, `.logs/sweep/shots/tram/settings.png` shows `COMFORTABL` ending mid-word at the card's
right edge, and every style does the same in `.logs/sweep/sheets/settings-1.png`. It looks exactly
like a control wider than its card, and that is what I wrote here first.

It is not. The cut is at the dock's left edge, not the card's: the floating dock passes over the
density row at that scroll position. The counting probe measured a hundred page bottoms across all
fifty styles and found **0 of 50 clipped** and **0 of 50 controls under the dock** on both the
settings and departures pages, because the page has the bottom room to scroll clear.

So this is the dock doing its job while a page is part-way through being read. Worth knowing only
because it looks like a layout break in a screenshot, and it is not one.

### 4. Settings repeats its own heading · FIXED

Every settings screen prints **Appearance** as a section heading and then **APPEARANCE** as the label
of the first field inside it. Two labels, one word, one above the other. Same shape on the Display
block, which luckily reads **CLOCK FORMAT** instead.

### 5. The `SHOW ALL` pill under the dock is the same thing · CLOSED, not a fault

`.logs/sweep/sheets/departures-1.png` shows the `SHOW ALL` pill half hidden behind the dock on every
style. Same cause as 3: it is a mid-scroll position, not a missing bottom margin. Scrolled to the
end, the pill clears the dock on all fifty styles (measured: 0 of 50 under the dock).

### 6. Fifty styles, one layout · ADDRESSED BY CUTTING THE CATALOGUE TO TWENTY

Laid side by side (`.logs/sweep/sheets/home-1.png`, `home-2.png`, `home-3.png`) the truth is plain:
about forty of the fifty are the same three cards, the same dock, the same type scale and the same
spacing, recoloured. What changes between them is the palette, the two fonts, and a corner radius
that is often a few pixels apart and invisible at phone size.

The styles that genuinely differ in shape are the exceptions: **blueprint** and **station-sign**
(square, ruled), **terminal** (dark, mono, flat), **poppy-blue** (pill controls), **mustard** and
**sunlight** (warmer, rounder). The rest would be hard to tell apart in a list of names.

This is not a bug with a line number. It is the geometry being driven by one multiplier and one
spacing rule, so a style can only be "the same thing at a different radius".

**Answered by subtraction rather than decoration.** The thirty near-duplicates are gone and twenty
remain, each of which a person can tell from the others by palette, shape, lettering and material
(see *The catalogue: fifty became twenty* above). One axis was added as well — a card is now flat
paper in the printed styles and a lifted pane in the soft ones — but the cut is what answers this
finding, not the shadow.

### 7. Small targets in the header · MEASURED, FIXED, THEN REVERTED ON REQUEST

This was fixed in the same pass as the rest: the header's Edit button and alerts pill were raised
from 36px to the 44px touch floor and measured at 48 × 44 and 69 × 44, on every style.

**That change has been reverted, on request.** It was two edits in `src/styles/base.css`: the pill's
`height` went from `36px` to `var(--target-min)`, and a rule raised the header's buttons to the same
floor. Both are gone, and the measurement is back to what it was: Edit 48 × 36, alerts pill 69 × 36.

The finding itself still stands as a fact — those two controls are 36px tall — but the decision to
change them is not mine to make. It is left here as an open observation, not a fixed item.

`Edit` is 50 × 36 and the alerts pill is 70 × 36. Both are under the 44px comfortable target. They
are the only two controls on every screen that are, and they are the two most tapped.

### 8. Tiny type on every page · FIXED

One 10px piece of text per page, 100 screens' worth. Under 11px on a 390px screen is a caption
nobody reads.

### 9. Nothing spills past the screen edge · CLOSED, this is the good news

**0 of 500 screens** pushes content past 390px, across all fifty styles. The horizontal-overflow
fault that used to appear in the audits does not reproduce here at phone width.

---

## What this sweep cannot say

- **Dark appearance and the photo backgrounds were not swept.** Every photograph is light
  appearance, colour background. A second pass with `theme: 'dark'` and one with a photograph is
  the obvious next sweep, and finding 1 is exactly the kind of fault that gets worse in dark.
- **Only 390px wide.** Tablet and desktop widths are not in these 500.
- **The content is one seeded state**: one origin stop configured, no favourites, an empty Tussendoor
  board, the results page with no search. A full board, a long disruption list and a journey detail
  are not photographed.
- **The dock, mid-scroll, is not one of the findings.** It was measured, it was two findings in the
  first version of this file, and the measurement overturned both. A screenshot taken at an
  arbitrary scroll position will keep producing this false alarm, so the counts here are taken at
  the page bottom.

## Order I would fix them in

1. Finding 1: one token in one rule, and it makes delay text unreadable on forty screens.
2. Finding 6: the sameness, which is the reason the styles were rebuilt in the first place.
3. Finding 4: the repeated Appearance heading, which is a two-line deletion.
4. Finding 2, then 7 and 8.
