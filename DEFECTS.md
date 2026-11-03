# The defect ledger

Every fault the steerer has reported, in his words, and how it is caught now. A defect is only called
fixed when its row names a check that fails without the fix. A row that says *not covered* is a defect
that still depends on somebody looking at a picture — that is the honest list of what can still reach
him, and it is the work queue.

| # | The report | Caught by | Proven |
|---|---|---|---|
| 1 | "the line has a gap between the dot and the blue line", over and over | `npm run check:joins` — reads every connector's pixels and fails on a page-coloured row inside one | yes: connectors moved 37px down, 5 runs failed with the rows named, then passed again |
| 2 | content spilling past the right edge, sideways scroll | `npm run screen` — page-overflow and past-edge at 390 and 320 | yes: a 460px page failed 694 checks, then passed again |
| 3 | a word cut in half, a label clipped by its own box | `npm run screen` — clipped-text | yes: a 24px box around a time failed it, then passed again |
| 4 | a pale chip that could not be read (2.25:1 on /map) | `npm run check:colours` | measured; the known failures are listed in `design/screen-baseline.json`'s neighbour `artifacts/` report, not yet zero |
| 5 | a header badge that should not be there | not covered | — |
| 6 | the dot between the mode glyphs, and `1 × ⇅` being wrong | not covered | — |
| 7 | platform text not lined up on the right edge (378/390, 308/320) | not covered | — |
| 8 | the foot line saying more than "Bicycle allowed" | not covered | — |
| 9 | the thumbnail the wrong size, not linking to the map | not covered | — |
| 10 | the price chip's corner radius | partly: `node scripts/corners.mjs` covers card shapes, not the chip | — |
| 11 | a stop bead the wrong size, or carrying a platform | not covered | — |
| 12 | services that were already open, or would not open | not covered | — |
| 13 | a screenshot of mine that showed a fault I did not mention | `npm run screen` — the picture and the verdict now come from one run, and AGENTS.md forbids sending one without the other | yes: the same run prints `SCREEN: …` above the files it wrote |
| 15 | "This is an absolute, absolute MESS": the walk's map link drew a wide grey button across the row, and a change row's walking figure sat on top of the next stop's time | `scripts/check-batch3.mjs`: the gutter collision measure, and the link's own box being a word and not a control | yes: the gutter check failed on the real fault before the fix, and fails again when the rule is removed |
| 14 | a check that said "clean" while the fault was there | the negative-test rule in AGENTS.md: a check that has not been shown to fail on a deliberate break is not a check | yes: the join check did exactly this, was rewritten, and now fails on the break |
| 16 | "even the SWITCH is different then the other switches in the website": the Date and time sheet's DEPART AT / ARRIVE BY was a different object from every other switch — 44px tall with no ring, against 54px with one in Settings | `scripts/check-batch3.mjs`: both switches measured on one page of their own, in four ways — height, the chosen half's own box, its fill, and its ring | yes: appending `.segmented--sm { padding: 6px }` made the same run print **52px in the sheet, 44px in settings** and **pad 6px vs pad 2px**; reverting it prints **44/44**, **38px pad 2px vs 38px pad 2px**, and the same fill and ring in both |
| 17 | "why are those thing rounded, it looks like shit" — the two marks beside each day and time value (a calendar or clock with a chevron jammed into the field's round end), and the sheet closing itself | `scripts/check-batch3.mjs`: one 44px mark per answer, the platform's own picker button removed (`appearance: none`), a stacked group whose corner is 20px rather than a 91px stadium, and choosing a side leaving the sheet open | yes: each of the four was shown to fail on a deliberate break — a second mark restored, the corner set back to 9999px, the picker button left on `auto`, and the sheet's surviving flag removed (the control was gone 15ms after the press and still gone 5s later) |
| 18 | "The departure alarm comes back when you delete it when you leave the page and go back to the page" | `scripts/check-batch3.mjs`: after removing the alarm, a copy of the store is written back into the browser and the screen reloaded — the alarm must stay gone, and setting one again must still work | yes: with the remembered deletion taken out of `readStored`, the same run prints **FAIL a copy of the store put back in the browser does not bring the alarm back (Alarm 5 min)**; with it in place, **Alarm** |
| 19 | "Map button is useless, the circles button does the same" | the journey page has exactly one way to the map — the thumbnail in its title line — and `scripts/check-map.mjs` still reaches the map through it | yes: the check asks for `a.journey-thumb[aria-label="Show on map"]`, so putting the MAP pill back means two controls answering to one name and the count fails |
| 20 | "Useless button, theres already a Reverse button on the Journey results page" | the journey page has no Return control of its own, and `scripts/check-map.mjs` also proves the results screen still carries the reverse for the pair | yes: putting a `<Button>Return</Button>` back makes the same run print **FAIL the journey page offers no Return button of its own (1 control(s))**; without it, **0** |
| 21 | "Why is there a footnktr marker but no footnotr" — the fare's asterisk with no line carrying it | `scripts/check-map.mjs`: the price wears the marker and the footnote line under the journey starts with it | yes: stripping the marker off the footnote line makes the same run print **FAIL and the footnote carries the same marker ("Fares, occupancy, …")**; with it, the line reads **"* Fares, occupancy, delays and platforms are indicative."** |
| 22 | "Why is this button square." — the Back control in the Add to calendar sheet | `scripts/check-batch3.mjs`: the way back inside the sheet is read for its corner, its height and its underline | yes: taking `.btn` off it again makes the same run print **FAIL the way back is the app's pill, not a square (corner 2px)**; with it, **corner 9999px, 44px, underline none** |
| 23 | "Why is bicycle allowed there and not under a specific train" — one page-level bicycle line above a journey of two trains | `scripts/check-map.mjs`: every ride row carries the rule, in words, and no paragraph states it once for the journey | yes: putting the page-level line back makes the same run print **FAIL and the page does not state it once for the whole journey (a journey-level line exists)**; removing a service's mark prints **FAIL every service states its own bicycle rule (1 mark(s) for 2 service(s))** |

| 24 | "Is this a god damn joke?" — an alarm two minutes out printed "Time to leave for your journey, 8:44" as a pink box inside the Save / Alarm / Share row, stretching Alarm and Save to 105px so they read as circles | `scripts/check-batch3.mjs`: with an alarm due now, every child of the button row is a `BUTTON`, the row and its tallest child stay at or under 60px, no `.journey-alarm-line` exists, and the reminder appears in the toast region | yes: putting the paragraph back in the row prints **FAIL a due alarm adds no box to the button row (BUTTON / BUTTON / P / BUTTON)** and **FAIL and the row keeps its own height (105px row, tallest child 105px)** |

## The rule that keeps this file honest

When he reports something new, its row is written here *first*, then the check, then the fix. Nothing is
reported as fixed on the strength of a screenshot.
