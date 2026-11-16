# OVVO Wrapped: 18 chapters, 4 layouts, 2 moments

SCREEN: WRAPPED AUDIT - 144 shots, 4 states, 18 chapters, 2 moments. 1 severe tablet/desktop yearbook fault, 5 short-phone collisions, 1 content omission, and cross-page demo-badge contrast fault.

## What was captured

- `phone` 360 x 800
- `small` 320 x 568
- `tablet` 768 x 1024
- `desktop` 1440 x 900
- Each chapter was shot at roughly 90 ms after arrival (`entry`) and 1.45 s after arrival (`late`).
- Every shot is the regular demo year (`?demo=1&persona=regular`), so all 18 chapters exist.
- Full-size shots: `artifacts/wrapped-audit/<state>/`
- Contact sheets: `artifacts/wrapped-audit/contact-<state>-<moment>-<1|2>.jpg`
- Browsable gallery: `artifacts/wrapped-audit/index.html`

The first-visit location dialog was dismissed before every capture. Skip-link measurements were ignored: it is parked off-screen on purpose. The three console errors per run are analytics requests blocked on localhost, not Wrapped errors.

## Severe faults

1. **Page 14, yearbook, 768 x 1024: the old squeezed-title bug is back.**
   The share button takes 161 px of a 334 px card. The first award title gets **19 px**, so every letter drops onto its own line. The first two cards are 371 px tall; the second row is 178 px. The body is 909 px in an 874 px space, and the last award lines run under the footer at 966 px.

2. **Page 14, yearbook, 1440 x 900: the same squeeze, less extreme.**
   Award titles get only **61 to 96 px** because every card reserves 161 px for the share button. "Most likely to sprint for the 08:00" becomes five short lines. Cards are 377 px wide in a 1440 px window; the first row is 143 px tall and the second is 93 px, so the four cards do not form an even grid.

3. **Page 14, yearbook, 360 x 800: the fourth card is cut by the footer.**
   The fourth card runs from y=683 to y=803. The body and footer start at y=746, so the last 57 px are hidden until the page is scrolled. The page is scrollable (720 px in 655 px), but there is no cue that the last award is below the fold.

4. **Page 14, yearbook, 320 x 568: only two awards are visible.**
   The body is 740 px in 433 px. The first card ends at 405 px, the second at 549 px under the footer at 521 px, and the last two cards start at 556 px and 700 px. The second card's share button is cut in half on first paint.

5. **Page 15, bookends, 320 x 568: header and footer collisions.**
   The body is 472 px in 433 px. The close button (y=33-77) overlaps the kicker at y=48-63. The footer starts at 521 px and covers the last route at 487-526 and its time at 529-544. The bottom card is cut off.

6. **Page 17, crew, 320 x 568: header and footer collisions.**
   The body is 453 px in 433 px. The close button overlaps "TRAVEL CREW" at y=68-83. The footer starts at 521 px and covers the privacy sentence at 498-540. The last line of the privacy note is hidden.

7. **Page 4, map, 320 x 568: caption under the footer.**
   The body is 449 px in 433 px. The footer starts at 521 px and covers the caption at 502-536. The station labels are also cramped at this width, with "Amsterdam Centraal" and "Amsterdam Zuid" sitting on top of the map's own marks.

8. **Page 10, longest, 320 x 568: station name clipped.**
   The endpoint reads "UTRECHT CENTR..." instead of "UTRECHT CENTRAAL". The measured text is 8 px wider than its box.

## Content missing

9. **Page 13, lines, every layout: two of the four board figures are never shown.**
   The JSX adds four plates: 700, 800, "stops hearted" and "boards pinned". The stylesheet hides `.wrapped-chip:nth-child(n + 3)`, so the hearted-stop and pinned-board totals are absent at 320, 360, 768 and 1440. The page has only the two line-number boxes.

10. **Page 13, lines, phone and tablet: the two visible boxes are mostly empty.**
    The line number sits at the top of a tall bordered box, but the per-line caption is hidden (`.wrapped-chip strong { display: none; }`). The boxes read as blank containers in the scaled contact sheet and leave a large dead area.

## Cross-page faults

11. **The DEMO badge disappears on every dark chapter.**
    Its text is hard-coded to `--ink-strong` (`rgb(24, 24, 27)`), while the Wrapped stage is dark. It is effectively invisible on cover, total, map, distance, pair, hour, direct, look, lines, bookends, crew and close. It is readable on the light chapters (name, origin, longest, eras, awards, comparison). A traveller can be looking at invented data with no visible "Demo" label.

12. **Header controls are below the 44 px touch minimum.**
    The Demo button is 64 x 34 px and the Sound control is 85 x 34 px at every layout. The app-header alerts control is 36 x 36 px. The close button is the only 44 x 44 control.

13. **The chapter counter is extremely quiet.**
    It is 13 px at 62% opacity. On the phone screenshots it is faint; at 768 and 1440 it is also physically small. It is information, not decoration, and it currently reads as fine print.

14. **The cover's first moment is obscured by the OVVO logo.**
    At 90 ms, a dark OVVO tile and a grey wash sit on top of "2025". The tile is gone by the late frame, so this is a transition, but it is the first thing a slow phone will show.

## Page-by-page smaller faults

- **Page 1, cover:** Demo badge invisible; first entrance frame covered by the OVVO loading tile; year at 1440 is a small island in a very large empty page.
- **Page 2, total:** Demo badge invisible; the counter is still climbing at the late frame (119 shown instead of 146), so the number is not stable when the page is read. No layout collision.
- **Page 3, name:** "88 of 146" wraps onto two lines in the narrow figure column at 360. The three column labels are very small. Demo badge is visible.
- **Page 4, map:** At 360 the station labels are close together; at 320 they collide with one another and with map marks. The caption overlaps the footer at 320. Demo badge invisible.
- **Page 5, distance:** The hairline above the notes stops about three quarters of the way across the content, leaving a half-drawn divider. Demo badge invisible. The 10.5 px notes are hard to read on a phone.
- **Page 6, pair:** Demo badge invisible. The route count and its "times" unit are separated by a large distance; this is legible but visually detached.
- **Page 7, origin:** Demo badge invisible; otherwise no collision at 320 or 360.
- **Page 8, hour:** Demo badge invisible. The bars end exactly on the footer line at 320, which reads as clipped even though they are inside the body.
- **Page 9, direct:** Demo badge invisible; counter is still mid-animation at the late frame (38-39% instead of 47%).
- **Page 10, longest:** Demo badge visible on the light page. Endpoint label is clipped at 320 only.
- **Page 11, look:** Demo badge invisible. The title is deliberately low-contrast against the station roof. The day count is very close to the chapter counter at 360, but not clipped.
- **Page 12, eras:** No layout fault. The era legend is small and quiet, which fits the page.
- **Page 13, lines:** Demo badge invisible. The "IC 3100" ticker is cut at both viewport edges at rest ("C3100" on the left, "IC3100" on the right). Two of four totals are hidden at every width. The equalizer has no axis or caption and runs into the footer band.
- **Page 14, awards:** The title squeeze at 768 and 1440, the fourth-card cut at 360, and the two-card first paint at 320 are the main faults. The four share buttons also repeat four times and dominate the card width at every layout. At desktop the cards use only about a quarter of the page width.
- **Page 15, bookends:** Header and footer collisions at 320. At 768 and 1440 a stray 2 px vertical yellow line sits between the two cards, not attached to either. "Wanted to leave at 19:00" is 10 px and very quiet. Demo badge invisible.
- **Page 16, comparison:** No collision at any of the four layouts. The content is small relative to the giant "+32 journeys" at 768 and 1440, but it is legible. Demo badge visible.
- **Page 17, crew:** Header and footer collisions at 320. The crew code is 7 lines of tiny mono type at 320 and still only about 9 px at 1440. The disabled "Share code" label has very low contrast. Demo badge invisible.
- **Page 18, close:** Demo badge invisible. "Share cards" is a muted brick-red button, not the coral used by Begin and the page's other accent, so the primary action looks disabled. "Start again" has no icon while the two actions beside it do. Action labels are 11 px.

## What is not a fault

- The chapter counters show different numbers in different captures because they are count-up animations sampled at different points. The late frame is 1.45 s, not the end of the count-up.
- The first-visit "Use your location?" dialog is app-wide and was dismissed before capture.
- The Cloudflare analytics CORS and 429 console errors come from the local host, not Wrapped.
- The skip link is parked at -9999 px deliberately.

## The next decisions

The clear blockers are the yearbook at 768/1440, the three short-phone pages that paint through the header and footer, the missing line totals, and the invisible demo badge. The smaller typography and divider faults can follow in the same pass once the layout is stable.
