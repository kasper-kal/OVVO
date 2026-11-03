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

## The rule that keeps this file honest

When he reports something new, its row is written here *first*, then the check, then the fix. Nothing is
reported as fixed on the strength of a screenshot.
