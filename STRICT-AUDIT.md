# Strict audit: twenty styles, ten pages, two hundred screens

The first sweep asked whether anything was unreadable. This one asked eleven harder questions of every
visible element on every screen, and it found **1257 problems in 200 screens**. Nothing here is a
guess: each line came from a browser measurement, and the picture of every screen is in
`.logs/strict/shots/<style>/<page>.png`.

Re-run it with:

```
node scripts/strict-audit.mjs            # 200 screens, about 7 minutes
```

| severity | count |
|---|---|
| critical | 660 |
| high | 456 |
| medium | 141 |

Per page: **stop** 320, **styles** 420, **settings** 127, **home** 80, and 20 on each of the other
six (a header target and a missing alt, everywhere).

---

## 1. The style tiles and switches announce nothing · CRITICAL · 460 findings

- **400** on `/styles`: all twenty tiles, in all twenty styles, are buttons inside a `radiogroup` with
  no text, no `aria-label` and no `title`. A screen reader reaches a button called nothing, twenty
  times, and the only way to know which look you are choosing is to see the swatch.
- **60** on `/settings`: three `.switch` controls per screen with nothing to announce. The label is
  drawn beside them but not attached.

This is the largest single fault in the app and it is invisible in every screenshot, which is exactly
why the earlier audits missed it.

## 2. A departure row and its own alert link sit on the same pixels · CRITICAL · 200 findings

On the stop page, every departure row reports **100% overlap** with its alert link: `Intercity 800
departure` and `Alerts: Intercity 800` occupy the same box, in all twenty styles, ten rows per
screen. Two links cannot share the same pixels — one of them is unreachable, and it is the row
(200 of 200). This needs a look at the markup, not the colour.

## 3. Small text still misses the line · HIGH · 36 findings

The 11px mode badge (`Tram`, 4.08:1) and the sage pill (`UTC`, 4.08:1) on nine styles. It is the same
family reported as partly fixed in `STYLE-SWEEP-FINDINGS.md`, now pinned to the exact elements and
counted: **36 screens, worst 3.62:1 on Cyber Teal**.

## 4. One image on every screen has no alt text · HIGH · 200 findings

The mark in the header is drawn as an inline data-URL image with no `alt`. Two hundred screens, one
image each. Decorative or not, it needs `alt=""` at the very least.

## 5. The header's two controls are 36px tall · HIGH · 220 findings

`Edit` 50 × 36 and the alerts pill 70 × 36, on every screen of every style. Measured again after the
change that raised them was reverted at your request. Recorded as a fact, not a task.

## 6. Rounded markers inside rounded rows are not concentric · MEDIUM · 101 findings

`leg-row__marker` (a 12px corner) sits inside `.list-row` (a 12px corner) with 12px of padding, so the
two curves do not relate: the marker's radius should be the row's minus the inset. It appears 91
times on the stop page. This is the kind of detail the eye reads as "sloppy" without being able to
name it.

## 7. Heading structure · MEDIUM · 40 findings

- **Every home screen starts at `h2`** and has no `h1` (20 findings).
- **`/styles` goes `h1` then `h3`**, skipping a level (20 findings).

---

## What the strict audit did **not** find

Worth stating, because a strict audit that only lists problems is not evidence of anything:

- **No text clipped by its own box** — 0 across 200 screens.
- **No child spilling its card** — 0.
- **No page wider than the screen** — 0.
- **No control under the floating dock at the end of a page** — 0.
- **No invisible control edges, no unreadable icons, no duplicate ids** — 0 once the checks stopped
  counting transparent borders and the brand's own white plate as faults.
- **No console or page errors** — 0.

## Where this audit is still weak

- **One appearance, one width.** Light, colour background, 390px. Dark and the photo styles are not in
  these 200 screens, and finding 3 is the sort of thing that gets worse in dark.
- **One seeded state.** One origin stop, no favourites, an empty board, an empty results page.
- **Screenshots are of the top of each page.** The end of every page was measured for the dock, but
  not photographed, so the pictures do not show what the numbers measured there.
- **`corner` (101) and `overlap` (200) are measurements that need a human eye** before they are called
  bugs or dismissed as intentional. The pictures are in `.logs/strict/shots/` and the sheets that put
  all twenty styles side by side are in `.logs/sweep/sheets/`.

## The order I would take them in

1. **Finding 1**, the 460 controls that announce nothing. It is a screen-reader bug on every screen.
2. **Finding 2**, the 200 overlapping links: one of the two is dead.
3. **Finding 3**, the last 36 contrast misses.
4. **Finding 4**, the alt text: two hundred screens, one attribute.
5. **Findings 6 and 7**, the corners and the headings.
6. **Finding 5** stays as an observation unless you say otherwise.


---

## What was done about these, and which ones were not faults

The audit is only worth something if it survives being checked, so every finding was reproduced in a
browser before anything was changed. Four were real. Three were the *checker* lying, and are recorded
here rather than quietly deleted.

### Fixed

**Finding 3, the small text on the sage tint.** Real, and the cause was not the size. `.pill--sage`
(``UTC``, ``Expected quiet``) and `.mode-badge--tram` were painted in `--struct-secondary`, a style
token that moves with the page, on top of `--tint-sage`, a colour that never moves. So the label's
readability depended on which style happened to be on: 3.62:1 on Cyber Teal, 4.08:1 on Poppy Blue,
13.8:1 on Obsidian. The tint now has an ink of its own, `--tint-sage-ink`, darkened from `#5a7a58` to
`#41603f` (**5.74:1** on the tint), and both the badge and the pill use it. A fixed surface needs a
fixed ink.

**Finding 6, the concentric corners.** Real. `.leg-row__marker` took the same radius as the row it
sits in while being inset by that row's padding, so the two curves fought. It is now the row's radius
less the inset.

**Finding 7, the heading order, half of it.** `/styles` really did go `h1` then `h3`: the shelf names
are `h2` now. Home's `h1` was already there, but as a screen-reader-only heading, and the checker
dropped anything visually hidden before reading the outline.

### Not faults, and the checker now says so

**Finding 1, the 460 controls that "announce nothing".** The check read only the text directly inside
an element, so a switch whose label lives in a child span, and a tile whose name is in a `span`,
counted as mute. A browser computes the name from the whole subtree, and every one of them already
had a name. The check uses that now, and nothing in the app had to change.

**Finding 2, the 200 "overlapping" links.** A `.list-row__stretch` link is painted `inset: 0` on
purpose, so the entire row is the target, and the alert button sits above it at `z-index: 2` so the
finger reaches the button. Clicking it in a browser opens `/disruptions`, which was also verified.
The overlap check now skips that pair, which is the documented pattern rather than a collision.

**Finding 4, the missing `alt`.** The image in question is the install banner's icon and it already
carries `alt=""`, which is the correct answer for a decorative picture. The check treated an empty
`alt` as a missing one; it now only flags an image with no `alt` attribute at all.

### Left alone on purpose

**Finding 5, the 36px header controls.** Recorded as a fact, as asked, after the change that raised
them was reverted. Nothing was done to it.

### Re-checked

The same six checks were run again in a browser over 3 styles and 5 pages each (Cyber Teal, Poppy
Blue and Navy and Gold, on Home, Styles, Settings, Stops and a stop page), with the corrected
checker:

| check | findings |
| --- | --- |
| controls with no name | 0 |
| images without an `alt` attribute | 0 |
| heading order | 0 |
| sage text under 4.5:1 | 0 |
| non-concentric corners | 0 |
| overlapping controls | 0 |

**Limits.** That is a 15-screen sample, not the full 200-screen run (which takes about seven minutes
and is over this runner's command limit). The type gate, the style gate, the em-dash gate and the
corner gate all pass.
