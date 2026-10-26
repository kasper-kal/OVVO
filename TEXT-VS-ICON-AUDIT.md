# Where the interface still writes a word where it owns a glyph

An audit, not a fix. Ordered by how often the same word is repeated on screen, because a word that
appears ten times costs ten times a word that appears once.

**What was measured.** Every route was opened on the running app at 390 and at 1440, with a real
Haarlem → Gouda search behind `/results` and `/journey/:id`, two pinned boards, two favourites and a
device location. For each screen the walk recorded every short label (48 characters or fewer) that
holds its own text, grouped by class, together with whether a glyph is drawn inside it. The probe is
`.logs/text-groups.cjs`; the raw reading is `/tmp/text-groups.json`. Every count below is from that
reading, not from memory.

**The question being asked.** Not "is there text" — a paragraph is allowed to be a paragraph — but
"is this a *label* that the app already has a picture for, printed as a word instead". The mode
badges (`Train`, `Bus`, `Walking`, `Biking`) and the facility badges on a stop page are the
standard: a glyph and one word, the same shape every time.

## The findings, repeated-most first

### 1. The departure board prints the word `PLATFORM` on every row — 16 rows

`components/stops/BoardList.tsx` renders `<span class="board-list__platform-label">Platform</span>`
beside the number. Ten rows on the board screen, six on a station's next-departures card.

The app already owns the picture: `platform` is Lucide's `TrainTrack`, and it is drawn on the
journey page's stop rows (`components/journey/LegList.tsx:16`). The board is the one place a
platform number is read most and the one place it is spelled out.

Its own stylesheet already half-admits the word is disposable: below a 420px container the label is
`font-size: 0` with a `::before` that supplies a bare `P`. So the word is already replaced by a
letter when space is short — the glyph is the same move, done properly.

**Should read:** `[platform glyph] 4` — the `title` and the accessible name keep the words.

### 2. A stop's row spells out its type and its distance — 6 rows, 61 stops

`components/stops/StopCard.tsx:58` and `:60` join four facts into one line:

    Amsterdam · ASC · Station · 40 m
    Amsterdam · ABW · Ferry stop · 440 m
    Amsterdam · AAF · Landmark · 1.2 km

Two of those four facts have pictures in the vocabulary already: the stop type is the stop's own
mode glyph (`station`, `tram`, `metro`, `bus`, `ferry`, `walk` — the same six the mode badges use),
and a distance is a walk (`walk`) or a place (`location`).

**Should read:** `Amsterdam · ASC · [station glyph] · [walk glyph] 40 m`, with the code kept as
text — it is the one fact here with no picture and the one a traveller types.

This affects the Stations & stops list, the planner's suggestion list and the search results, since
they share the card.

### 3. A stop page's two lists write their facts as words — 16 + 6 rows

On `/stops/amsterdam-centraal`:

- **Lines calling here** — every row ends `· every 30 min` (16 rows). The app already draws a
  `clock` glyph elsewhere (a journey's duration chip); a headway is a clock.
- **Nearby stops** — every row reads `126 min walk · Train, Metro, Bus` (6 rows). That is a `walk`
  glyph, a number and up to four mode words that are already badges two screens away.

**Should read:** the clock glyph before the headway, the walk glyph before the minutes, and the
modes as the mode badges the rest of the app uses rather than a comma-separated list.

### 4. An alert's affected stops are announced with a word and a stray colon — 5 rows

`pages/DisruptionsPage.tsx:446` prints `Affected stops (3) :` — faint label, then the names. The
space before the colon is a small typographic fault on top of the word.

The names themselves must stay: they are links to the stops, and an alert that does not say where it
is is not an answer. The *label* is the part with a picture — a stop is the `station` or `mapPin`
glyph, and the count is a number.

**Should read:** `[station glyph] 3 · Schiphol Airport · Haarlem · …` with no stray colon.

### 5. An alert page's head is four text pills — 4 rows

`pages/DisruptionDetailPage.tsx` draws the window (`08:00 – 12:00`), the severity
(`Major disruption`), the delay (`Delay +8 min`) and, on the journey page, the direction
(`Direction Den Haag Centraal`). Four outline pills, no glyph in any of them, while the journey
summary two screens away draws the same kind of fact as `[clock] 51 min` and `[swap] 1 transfer`.

**Should read:** `[clock] 08:00 – 12:00`, `[alert] Major disruption`, `[alert] +8 min`,
`[arrowRight] Den Haag Centraal`.

### 6. A result card's duration is a pill with no clock — 4 rows

`.pill` holding `1 hr 21 min` on each result card. The journey page's own duration chip carries a
clock. Same fact, two shapes.

**Should read:** the clock glyph and the duration, as the journey page already does.

### 7. Settings is the most word-heavy screen in the app — 15 segmented buttons, 12 label + hint blocks

377 words at 390, and no glyph anywhere in the controls. There are five segmented controls, and
four of them name a thing the vocabulary already draws: appearance (`System` / `Light` / `Dark` →
monitor / sun / moon), clock format (`24-hour` → the clock), date format (`Descriptive` → the
calendar) and density (`Compact` → the layout grid). Language stays words — a flag is not a
language.

The hint sentences under each row are content and should stay: they are the only place the app
explains what a switch does.

**Should read:** glyph + word in the four visual segmented controls; hints untouched.

**Reversed — this one was wrong, and the owner said so.** The glyphs were added, and the reading was
the mistake: a glyph beside a word that already means the same is a second thing to read, not a
saving. Two of the four were worse than that, because both halves of a control drew the *same*
picture — two clocks for "24-hour" and "12-hour", two grids for "Comfortable" and "Compact" — so the
picture carried no information at all, and "Descriptive" and "dd-mm-yyyy" shared a calendar for a
format nothing could show as a picture. The rule the app keeps now is *words, or pictures; never
both*, and the shared control enforces it by type (`ui/primitives` `Segmented` takes a label and
nothing else). A control that needs a picture is a toolbar, a map or an action, and is not this.

### 8. The map page lists 54 stop names as text — 54 rows, 6 chips

`widgets/registry.tsx:514` puts every drawn stop in a `<details>` list of plain names — a text
duplicate of what the map itself draws. The route filter chips (`All routes`, …) are six words with
no glyph, while the same six categories wear mode badges on a stop page.

**Should read:** the chips as mode badges; the list is a fallback for a map that cannot be read, so
its names should stay words — it is the *chips* that are text where a glyph belongs.

### 9. Travel preferences — 2 rows that could carry a picture

`Prefer fewer transfers` (a `swap` glyph) and `Prefer less walking` (a `walk` glyph). The rest of the
page is sliders, menus and hint sentences, which is the right material for that page.

### 10. Home's two cards that ask a question

`next-departures` untied says *"Pick one station for this card…"* and `pinned-stops` empty says
*"Heart a stop from its page…"*. Both are empty states and both are sentences on purpose. Noted and
**not** a finding: an empty state that says only a picture is a riddle.

## What is already right, and should be the reference

- The **mode badges** and the **facility badges** — glyph, one word, one shape, every time.
- The **journey summary chips** — `[ticket] €2.30`, `[clock] 51 min`, `[swap] 1 transfer`,
  `[walk] 8 min walking`, `[bike] Bicycle allowed`. This is the best row in the app and the pattern
  the rest should copy.
- The **board row's actions** — a pin, a heart, a details link: pictures, no words.
- The **dock and the header** — three drawn glyphs and a mark.

## What must stay words, and why

- Every **sentence**: alert advice, the settings hints, the empty states, the offline bar. A glyph
  cannot carry a sentence, and replacing one with a picture is how an interface becomes a riddle.
- Every **name**: a stop, a place, a line, an operator. These are the timetable talking.
- Every **number that has no picture**: a platform number, a count, a price. The glyph goes *beside*
  the number, it does not replace it.
- **Headings.** A section named `Affected stops (3)` is a heading, and its job is to be read.

## The cost, screen by screen

Words in `main` against glyphs drawn in it, at 390. A low glyph count beside a high word count is
where this audit found its work.

| screen | words | glyphs |
|---|---|---|
| a stop's page | 559 | 87 |
| Settings | 377 | 14 |
| Disruptions (list) | 213 | 13 |
| Travel preferences | 155 | 10 |
| Stations & stops (list) | 154 | 26 |
| Journey detail | 151 | 30 |
| An alert's page | 109 | 14 |
| Home | 61 | 2 |
| Results | 59 | 21 |
| Departure boards | 47 | 4 |
| Network map | 30 | 1 |

The stop page's ratio is the worst of the long pages, and it is the page this round has been working
on. Settings is the worst of the short ones: 377 words and fourteen glyphs, most of them in the two
sample cards rather than in the controls.

## Order I would fix them in

1, 2, 3 — every row on three of the four screens a traveller uses most, with glyphs that already
exist and no new drawing needed.

Then 4, 5, 6 — one row each, same material.

Then 7 and 8, which are design decisions about a control's shape rather than a label's.

## What was done — all nine

Every finding above is fixed, and each one kept its words where the words are the content: a glyph
sits *beside* the name or the number and never replaces it, and every glyph that replaced a word
leaves an `sr-only` label so a screen reader still hears the word.

1. **The board's platform.** `BoardList` draws the `platform` glyph and its number; the word survives
   as the `title` and the accessible name. The old `font-size: 0` / `P` fallback is gone with it.
2. **A stop's row.** The type is the stop's mode glyph and the distance is a `walk`, with
   `Amsterdam · ASC` and the metres still text.
3. **A stop page's two lists.** `[clock] every 30 min` on every line row, and `[walk] 40 min ·` a
   chain of mode glyphs on every nearby row.
4. **An alert's affected stops.** `[station] 3 ·` with the names still links, and no stray colon.
5. **An alert page's head.** The window, severity, delay and direction carry `clock`, `alert` and
   `arrowRight` in the same shape as the journey summary chips.
6. **A result card's duration.** The `clock` glyph, as the journey page already drew it.
7. **Settings.** ~~Appearance, clock format, date format and density carry a glyph in each
   segment.~~ **Reversed:** all five are words only, as the language control always was. See the
   note in finding 7 above.
8. **The map page.** The six route chips are mode badges now; the `<details>` list stays words on
   purpose, because it is the fallback for a map that cannot be read.
9. **Travel preferences.** `swap` on "fewer transfers" and `walk` on "less walking".

Two readings confirm the two things this kind of change breaks if nobody looks:

- `scripts/icon-audit.mjs` — **OK**, every glyph square, at a whole pixel and within 1.5px of the
  x-height centre of its label. It failed first: the type marks on the stop card sat 1.0–1.8px high,
  and the mode chain on a stop page's nearby row sat 1.8–2.3px low. Both were alignment, not craft:
  `.icon--inline` is a fifth of an em down now, and the chain sits on the baseline because an
  inline-flex box aligns by its bottom edge.
- `scripts/ui-audit.mjs` — **OK**, no contrast, target, clipping, header or wrapped-capsule failures.
  Its two contrast findings were the new map chips: bus `2.49:1` and metro `2.42:1` on the white
  chip, where a glyph needs 3:1. Each chip's glyph is now its route colour mixed two parts to one
  with the theme's ink — same hue and same key to the map, readable in both appearances.
