# OVVO Wrapped, rebuilt as a film

**Status:** specification. Nothing here is built yet.
**Supersedes:** sections 24 and 24b of `src/styles/components.css`, the current chapter model in `src/lib/wrappedDeck.ts`, and the eight-cards-at-most note in `AGENTS.md` (that note was a plan for a dashboard deck; this is a film).
**Reference:** `Music/Spotify_Wrapped_Frames.zip`, 230 frames, 720 x 1608, a seven minute phone recording of Spotify Wrapped 2024, read in order. Frame numbers below refer to `frame_001.jpg` to `frame_232.jpg`.

---

## 0. The one sentence this document exists to enforce

Spotify built **one moving object with a sentence on top of it**.
OVVO Wrapped built **twelve slides with an entrance animation**.
Every rule below follows from that difference. If a change makes the object weaker or the sentence longer, it is the wrong change.

---

## 1. What the reference actually does, frame by frame

This is evidence, not taste. Each line was read off the frames.

| Frames | What happens |
| --- | --- |
| 001 to 017 | Real Spotify page, in the phone browser. Portrait 720 x 1608. |
| 018 to 038 | Full screen takeover, black. One folded magenta ribbon spins in from nothing, then a Spotify mark assembles out of the ribbon and settles. No words for about four seconds. |
| 039 to 068 | A loading state, then the ribbon scene again, because the phone reloaded it. |
| 069 to 099 | Ribbon unfolds out of black, colour field floods in, mark assembles. |
| 100 to 130 | Sentence one: "Hi there", caption "It's that time of year again. Wrapped's ready. Are you?". Holds about fifteen seconds. The ribbon never stops folding underneath. |
| 131 to 159 | Sentence two: "Life moves fast", caption "Luckily we took notes.". The same object, new fold, new framing. |
| 160 to 190 | First figure: "You listened for 7,145 minutes this year", caption "And you made each one count.", and a share pill appears at the bottom. The ribbon has folded into a stepped stack that fills the lower half. |
| 191 to 220 | "Your biggest listening day was October 24th with 340 minutes", caption "Where do you find the time?". The ribbon has become two diagonal blades leaving a black diamond of empty space for the text. |
| 221 to 232 | The colour changes to green for a new act: "You listened to 273 artists". Ribbon becomes a green waveform with a black gap in the middle. |

Six laws can be lifted straight out of that sequence.

**Law 1. The page is black. Always.** Frames 018, 105, 161, 205 and 229 all read `rgb(0,0,0)` around the content, and the phone's own chrome fades away. Colour never floods the page as a background wash. It belongs to an object.

**Law 2. The object changes, the page does not.** The ribbon is full bleed, roughly 140 percent of the screen width, cropped on all sides, and it is in a different fold on every card. It is the only thing that makes the cards different from each other.

**Law 3. The object never stops.** Frames 100 to 130 are one card holding for fifteen seconds, and the fold is visibly different at 105, 115 and 125. The stillness people feel in a bad deck is not the length of the card, it is the object stopping.

**Law 4. The sentence is centred and short.** Measured on frame 205: side margin about 9 percent, headline about 7.8 percent of the screen width (30px on a 390 wide phone), line height 1.14, three lines maximum, one dim caption below at about 3.6 percent (14 to 15px). The block sits slightly above centre, its middle at about 51 percent of the screen height.

**Law 5. The figure lives inside the sentence.** Never a giant number with a label under it. "You listened for 7,145 minutes this year." The figure is the same size and colour as the words around it, because the sentence is the thing being read.

**Law 6. The share is on the page.** A pill, bottom centre, on every figure page (frames 161, 205, 229). Not one control on the last page.

Two supporting details matter as much as the laws:

- **Colour changes at acts, not at pages.** Magenta for the opening and the minutes, green for the artists. Between pages inside an act, the hue holds and only the fold changes.
- **The copy is a person talking.** "Luckily we took notes." "Where do you find the time?" Every card has one small joke or question. None of them explain the chart.

---

## 2. What OVVO Wrapped is doing wrong, measured

These are the faults this rebuild must fix, each with the thing in the current code that causes it.

1. **The ground is plum fog, not black.** `.wrapped-stage[data-chapter]` paints four radial gradients and a conic aurora blurred by 72px at 50 percent opacity. Measured on `artifacts/rb-total.png`, the text sits on roughly `#3a1f3f`, which is neither black nor a colour. It reads as a template gradient and it flattens contrast.
2. **There is no object.** Every page's subject is a number, a ring, a bar or a chip. Nothing on screen is a thing.
3. **The motion is an entrance, not movement.** `wr-enter` runs 620ms with an 80ms stagger, so the page is fully settled by about 1.2 seconds and then stands still for five. That is why it feels dead at six seconds even though it is "animated".
4. **Twelve pages, one layout.** Spaced kicker, huge figure, one line under it, same left edge, twelve times. The page variety claimed in the comments is not visible in the screenshots.
5. **The figure is orphaned.** "146" then "journeys planned in OVVO" makes the eye read a digit and then hunt for its meaning. The reference never does this once.
6. **Gradient text everywhere.** Every big number is clipped into the same coral to violet gradient, so the "one brand colour" rule became one gradient repeated twelve times, and white lost its power.
7. **The map is a knot.** Seven routes bow into the same centre, the station names are boxed chips with underlines, and the graticule makes it look like graph paper.
8. **The look page is paint chips.** Four rectangles of colour to represent a theme is the exact thing the steerer called absurd, and it is still there.
9. **The lines page is a database log.** `23 stops hearted, 0 boards pinned` in a row of mono figures.
10. **The chrome shouts.** A circled X, a "Sound off" text pill, twelve dashes, and "02 / 12" all compete with the content. The reference uses one thin bar and three icons.
11. **The music restarts every page.** `startSound(chapter.track)` on each chapter change means the song is cut every six seconds, which is the audio and visual disconnect the steerer heard.
12. **The deck turns on a timer that ignores its own page.** Flat 4.2 to 6.6 seconds, whether the card needs three seconds or nine, and the number lands wherever it lands in the song.

---

## 3. The new system

Three things, and nothing else on screen.

**A ground.** `#000000`. Not near black, not ink with a glow. True black on every card, so the object is the only source of light and the type is the only source of white.

**An object, called the Fold.** A full bleed folded ribbon in the act's hue, generated once as static SVG path data and crossfaded between six poses. It carries the colour, the depth and the motion of the whole film. It is the only continuously moving thing.

**A frame of type.** One centred column, sentence first, caption under it. The figure is inside the sentence. No kicker on figure pages, no giant number, no label, no ring, no chart beside it. When a card needs a chart, the chart is the Fold (hours become bars, routes become rails), not a second element.

Everything else is chrome, and chrome is three icons and a two pixel bar.

### 3.1 What is deliberately gone

| Gone | Why |
| --- | --- |
| The aurora and vignette pseudo elements | They are the fog. |
| Gradient clipped text | One hue per act, white type, the hue belongs to the object. |
| The kicker on figure pages | The sentence already says what the card is. |
| "02 / 12" | The progress bar says it, quieter. |
| The "Sound off" text pill | Becomes an icon with an aria label. |
| Rings, burst, orbit, grain, dot field | Decoration standing in for an idea. |
| Chips, tally rows, swatch squares | Lists pretending to be visuals. |
| Rings and arcs as the only visual | Replaced by the Fold posing. |
| Per page music start | Music runs by act. |
| The `lines` chapter | Weakest fact in the year, and it was a table. |
| The `origin` chapter as its own card | Its fact folds into the map caption. |

---

## 4. Tokens

Defined once, on `.wrapped-stage`, and used everywhere. Hex values are literal so no `color-mix` support is needed.

```css
.wrapped-stage {
  --wr-void: #000000;
  --wr-text: #ffffff;
  --wr-text-dim: rgba(255, 255, 255, 0.72);
  --wr-text-faint: rgba(255, 255, 255, 0.5);
  --wr-chrome: rgba(255, 255, 255, 0.12);
  --wr-chrome-line: rgba(255, 255, 255, 0.22);

  /* Act I, the year itself. */
  --act-1-light: #ff8a6b;
  --act-1-mid: #ff3b2f;
  --act-1-deep: #8c0f1e;

  /* Act II, the habit. */
  --act-2-light: #ff8fc0;
  --act-2-mid: #ff2d87;
  --act-2-deep: #7a0c3b;

  /* Act III, the time. */
  --act-3-light: #b9a2ff;
  --act-3-mid: #7b4bff;
  --act-3-deep: #2c1470;
}
```

The stage sets `--act-light`, `--act-mid` and `--act-deep` from `data-act="1|2|3"`:

```css
.wrapped-stage[data-act='1'] { --act-light: var(--act-1-light); --act-mid: var(--act-1-mid); --act-deep: var(--act-1-deep); }
.wrapped-stage[data-act='2'] { --act-light: var(--act-2-light); --act-mid: var(--act-2-mid); --act-deep: var(--act-2-deep); }
.wrapped-stage[data-act='3'] { --act-light: var(--act-3-light); --act-mid: var(--act-3-mid); --act-deep: var(--act-3-deep); }
```

Three hues inside one brand family, on one black ground, is the unified palette. A page never introduces a fourth colour, and a page never paints its own background.

### 4.1 Type

```css
.wrapped-stage {
  --wr-sans: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
  --wr-head: 800;
  --wr-head-size: clamp(28px, 7.9vw, 40px);
  --wr-head-leading: 1.14;
  --wr-head-track: -0.02em;
  --wr-cap-size: clamp(14px, 3.9vw, 16px);
  --wr-cap-leading: 1.45;
  --wr-col: min(84vw, 340px);
}
```

Rules that are not negotiable:

- The sentence is **at most 9 words** and **at most 3 lines** at 390px width.
- The caption is **at most 12 words**, one sentence.
- The figure inside the sentence gets `font-variant-numeric: tabular-nums` and `font-weight: 900`. It does **not** change size, colour or gradient.
- No uppercase except the wordmark. No letter spacing above `0.16em` anywhere. No mono font.
- Everything in the type column is centred. Nothing on the page is left aligned.

### 4.2 Spacing, measured from frame 205

```
top chrome:      24px from top, 20px from each side
progress bar:     4px from the top edge, 3px tall, 10 segments, 4px gaps
sentence block:  centre at 51vh, column 84vw, max 340px
caption:         18px below the sentence, colour --wr-text-dim
share pill:      bottom 30px, centred, 44px tall, radius 999px
wordmark:        20px tall, top left, never redrawn
```

The stage owns no padding. The type column is positioned by the flex centring of `.wr-frame`, not by per chapter offsets. If a chapter needs the text to move up or down, it uses `--wr-shift: -6vh` on `.wr-frame`, and nothing else.

### 4.3 Contrast and scrim

Text sits on black or on the Fold. When the Fold passes behind the words, a scrim protects the type:

```css
.wr-scrim {
  position: fixed;
  left: 50%;
  top: 51%;
  width: 130vw;
  height: 62vh;
  transform: translate(-50%, -50%);
  pointer-events: none;
  background: radial-gradient(closest-side, rgba(0, 0, 0, 0.62), rgba(0, 0, 0, 0.28) 62%, transparent 100%);
}
```

No `backdrop-filter` anywhere in the deck. It is the most expensive thing available and it was already responsible for a frosted pass that looked like glass on a phone and like mud on a laptop.

---

## 5. The Fold: the one object

### 5.1 What it is

A ribbon of folded paper, the same object through the whole film, rendered as flat SVG panels with gradients that fake the fold. It is not a 3D engine, it is not a CSS cube, and it is not a generated canvas. It is six hand authored poses of one band, saved as static path data in `src/components/wrapped/Fold.tsx`, so the phone has nothing to compute.

It reads as a physical object because of three details, all of which are required:

1. **Panels, not curves.** Each fold is a separate polygon with a hard edge and a black gap of 6 to 14px to the next one.
2. **A gradient per panel, rotated.** The gradient angle turns by 9 degrees per panel, so the same hue reads as lit from a moving source.
3. **A hairline of light on one long edge** of every panel, `rgba(255,255,255,0.22)`, 1px, so the paper has a thickness.

### 5.2 Geometry

One band, parameters per pose:

```ts
export interface Pose {
  id: 'tunnel' | 'fan' | 'wall' | 'slice' | 'lane' | 'burst';
  hinge: number;   // 0..1, where the fold gathers, as a fraction of the viewport height
  tilt: number;    // degrees, the rotation of the whole band
  fold: number;    // 3..6 panels
  spread: number;  // 0.35..1.4, how far the band opens
  lean: number;    // -1..1, horizontal drift of the fold
  twist: number;   // -1..1, how much the band turns on itself panel to panel
}
```

Panel `i` of `n` is one quad plus one bevel, generated by this function and then frozen into the file:

```ts
const H = 844; // viewBox height
const W = 390; // viewBox width
const cx = W / 2;

function panel(i: number, n: number, p: Pose) {
  const t0 = i / n;
  const t1 = (i + 0.78) / n;          // 0.22 of a panel is the black gap
  const bow = (t: number) => Math.sin(Math.PI * (t + p.lean * 0.18)) * p.spread * 120;
  const y = (t: number) => (p.hinge + (t - 0.5) * 1.7) * H;
  const xl = (t: number) => cx - p.spread * 190 - bow(t) + p.twist * i * 9;
  const xr = (t: number) => cx + p.spread * 190 + bow(t) + p.twist * i * 9;
  return `M ${xl(t0)} ${y(t0)} L ${xr(t0)} ${y(t0)} L ${xr(t1)} ${y(t1)} L ${xl(t1)} ${y(t1)} Z`;
}
```

Every panel also gets a bevel quad, 10px wide along the right edge, filled with the deep stop at 40 percent opacity. That is what makes the fold read as a fold rather than as a stripe.

### 5.3 The six poses

| Pose | hinge | tilt | fold | spread | lean | twist | Used by |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `tunnel` | 0.50 | -8 | 5 | 1.15 | 0.20 | 0.55 | cover, close |
| `fan` | 0.46 | 14 | 4 | 0.95 | -0.40 | 0.30 | total, hours |
| `wall` | 0.55 | -18 | 6 | 1.35 | 0.00 | -0.20 | pair, longest |
| `slice` | 0.42 | 26 | 3 | 1.20 | 0.55 | 0.70 | direct, look |
| `lane` | 0.60 | 0 | 4 | 0.70 | -0.15 | 0.10 | map |
| `burst` | 0.48 | -26 | 3 | 1.40 | 0.30 | 1.00 | close |

### 5.4 Motion

Two animations run at once, and they never share a clock with the others.

**Drift.** The whole pose drifts and slowly turns, 9 to 14 seconds, `ease-in-out`, `alternate infinite`. Distinct per pose so no two pages breathe together:

```css
.wr-fold { animation: wr-drift-a 11s ease-in-out infinite alternate; }
.wr-fold[data-pose='fan'] { animation: wr-drift-b 13.5s ease-in-out infinite alternate; }
.wr-fold[data-pose='wall'] { animation: wr-drift-c 9.8s ease-in-out infinite alternate; }
.wr-fold[data-pose='slice'] { animation: wr-drift-d 12.2s ease-in-out infinite alternate; }
.wr-fold[data-pose='lane'] { animation: wr-drift-e 14.4s ease-in-out infinite alternate; }
.wr-fold[data-pose='burst'] { animation: wr-drift-f 10.6s ease-in-out infinite alternate; }

@keyframes wr-drift-a {
  from { transform: translate3d(-3%, 2%, 0) rotate(-4deg) scale(1.04); }
  to   { transform: translate3d(2%, -3%, 0) rotate(3deg) scale(1.10); }
}
```

Each of the six keyframe sets must move on **both** axes and change rotation by at least 5 degrees, so a still screenshot cannot tell you where in the loop it is.

**Fold.** A second animation on the panels themselves, `clip-path` or `translate` on the group, 18 to 26 seconds, so the ribbon appears to be refolding slowly in place:

```css
.wr-fold__panels { animation: wr-refold 22s ease-in-out infinite alternate; transform-origin: 50% 50%; }
@keyframes wr-refold {
  from { transform: rotateX(0deg) rotateY(-6deg) skewY(-1.5deg); }
  to   { transform: rotateX(4deg) rotateY(8deg) skewY(2.5deg); }
}
```

**Pose change.** On a page turn, the outgoing pose fades out over 560ms while scaling to 1.06, the incoming fades in from 0 with a 900ms scale from 1.10 to 1. Their opacity curves overlap for 220ms. There is no slide, no wipe and no page flip, because the reference never slides: the object folds away.

**Beat hit.** Once per page, the Fold gets a single 220ms scale pulse of 1.03 at the moment the figure lands, driven by `--beat-ms` from the running track. One hit, not a loop, and it is skipped under reduced motion.

### 5.5 Performance budget for the Fold

- Transform and opacity only. No filters, no blur, no shadows on the SVG.
- The glow behind a route (see the map) is three stacked strokes at decreasing opacity, never `feGaussianBlur`.
- The Fold is one composited layer: `will-change: transform` on the pose wrapper, removed on `is-still`.
- Target: no frame over 32ms in a three second trace with 4x CPU throttling on a 390 x 844 viewport.

---

## 6. The story

Ten screens. Acts group them, and the act colour changes only at a boundary.

```
Act I   1 cover      2 total      3 pair
Act II  4 hour       5 direct     6 longest
Act III 7 map        8 look       9 hours      10 close
```

Copy below is the **real** wording. `{token}` markers are filled from the tally. Every sentence is fixed, none is written in the component.

### 6.1 Page 1, cover (Act I, pose `tunnel`)

- Sentence: `OVVO Wrapped` (small, 13px, tracking 0.18em, above)
- Big: `{year}`
- Caption: `Your year, in motion.`
- Action: `Begin`
- Hold: none, waits for the tap.
- Motion: the Fold unfolds from a single line at the centre out to full bleed over 1.6s, then drifts. The year scales from 0.96 to 1 over 700ms on the bar.
- No progress bar, no close label, no sound text.

### 6.2 Page 2, total (Act I, pose `fan`)

- Sentence: `You planned {runs} journeys this year.`
- Caption: `Every one of them started with a search.`
- Figure: `{runs}` inside the sentence, tabular.
- Hold: 5200ms for the demo year.
- Motion: the number counts from 0 to 146 over 900ms, easing out, landing on a bar. The Fold's panels spread apart on each of the first four beats, then settle.
- Share: yes. Text: `I planned {runs} journeys in OVVO in {year}.`

Demo copy: "You planned 146 journeys this year." / "Every one of them started with a search."

### 6.3 Page 3, pair (Act I, pose `wall`)

- Sentence: `{count} times, {from} to {to}.`
- Caption: `The line you kept coming back to.`
- Hold: 5000ms.
- Motion: the Fold's panels align into five parallel rails for 700ms before settling back into the wall, so the object becomes the route for a moment. No separate rail element.
- Share: yes. Text: `{count} of my {runs} journeys in {year} were {from} to {to}.`

Demo copy: "21 times, Amsterdam Centraal to Haarlem." / "The line you kept coming back to."

### 6.4 Page 4, hour (Act II, pose `fan`, mirrored)

- Sentence: `{hour} is your hour. {n} journeys left in it.`
- Caption: `The city has a schedule. So, apparently, do you.`
- Hold: 5000ms.
- Motion: the Fold's hinge slides from 0.3 to 0.6 and back, like a clock hand, once per bar.
- Share: yes. Text: `My year in OVVO kept starting at {hour}. {n} journeys left in that hour.`

Demo copy: "08:00 is your hour. 34 journeys left in it." / "The city has a schedule. So, apparently, do you."

This page replaces both the old hour page and the old persona page. The persona name becomes the caption's voice, not a separate card: when the strongest habit is the peak hour, the caption reads as above; when it is night travel, `Evening is when the city is yours.`; when it is the same pair, `One journey, known by heart.`; otherwise `No single habit owns this year.` The rule stays: the persona is evidence first and a name never appears as a badge.

### 6.5 Page 5, direct (Act II, pose `slice`)

- Sentence: `{pct}% of your journeys went straight through.`
- Caption: `{direct} of {runs}, with no changes at all.`
- Hold: 5000ms.
- Motion: the Fold's three panels slide into one continuous blade over 800ms, so the shape says "no changes" without a dial.
- Share: yes. Text: `{pct}% of my OVVO journeys in {year} had no changes.`

Demo copy: "47% of your journeys went straight through." / "68 of 146, with no changes at all."

### 6.6 Page 6, longest (Act II, pose `wall`, stretched)

- Sentence: `Your longest trip took {duration}.`
- Caption: `{from} to {to}, with {changes} changes.`
- Hold: 5200ms.
- Motion: the Fold stretches vertically by 18 percent over the hold and drifts faster, one pose only, so the page physically feels longer.
- Share: yes. Text: `My longest OVVO trip in {year}: {from} to {to}, {duration}.`

Demo copy: "Your longest trip took 1h 49m." / "Amsterdam Zuid to Utrecht Centraal, with 2 changes."

### 6.7 Page 7, map (Act III, pose `lane`)

- Sentence: `{routes} routes. {stations} stations. One year.`
- Caption: `Most of it began at {topOrigin}.`
- Hold: 6000ms.
- Motion: the map **is** the Fold. The seven routes draw on over 900ms, staggered 110ms, then the whole figure drifts. Stations pulse once when their route arrives.
- Share: yes. Text: `My {year} in OVVO: {routes} routes across {stations} stations.`

Demo copy: "7 routes. 9 stations. One year." / "Most of it began at Utrecht Centraal."

Map drawing rules, which fix the knot:

1. Frame the year, not the country: bounding box of used stops, padded 14 percent.
2. No graticule. It made the page look like graph paper.
3. No bowing every route by index. Curvature is `0.10 * span` for the busiest route, `0.16` for the second, and `0.22` for the rest, alternating side, so lines separate by weight rather than by decoration.
4. Route stroke: `rgba(255,255,255,0.28)`, 1.5px. The busiest route is `--act-mid` at 3px with two under-strokes at 7px and 14px and 0.18 and 0.08 opacity for the glow.
5. Stops: 3px white dot plus a 7px ring in `--act-mid`.
6. Labels: three, no boxes, 12px, `--wr-text-dim`, offset 16px perpendicular from the stop, with a 10px leader line at `rgba(255,255,255,0.25)`. Placed on the three stops furthest from the centroid so they do not collide.
7. Station names are never chips and never underlined on this page.

### 6.8 Page 8, look (Act III, pose `slice`, wearing the look)

- Sentence: `You wore {look} for {days} days.`
- Caption: `Long enough to call it a uniform.`
- Hold: 5200ms.
- Motion: the Fold's gradient stops are replaced by the look's own four colours, in order, one per panel edge, so the object **is** the theme. The pose rotates 90 degrees across the hold.
- Share: yes. Text: `I wore {look} for {days} days of {year}.`

Demo copy: "You wore Nostalgia for 96 days." / "Long enough to call it a uniform."

This replaces the swatch band entirely. A theme is not four paint chips; it is the colour of the object behind the sentence.

### 6.9 Page 9, hours (Act III, pose `fan`)

- Sentence: `{hours} hours on the move.`
- Caption: `About {films} films, if the train Wi-Fi holds.`
- Hold: 5600ms.
- Motion: the Fold splits into 24 vertical bands of unequal height, the tallest at the peak hour, and the bands breathe in order once, 40ms apart, then hold still while the group drifts. This replaces the block skyline and the dot field.
- Share: yes. Text: `{hours} hours in transit with OVVO in {year}. About {films} films.`

Demo copy: "156 hours on the move." / "About 98 films, if the train Wi-Fi holds."

### 6.10 Page 10, close (Act I, pose `burst`)

- Sentence: `That was {year}.`
- Caption: `Every number here is yours. See you next December.`
- Hold: none. Stays until the traveller leaves.
- Actions: `Save my year` (primary), `Copy my year` (ghost), `Start again` (ghost). The empty-the-year control moves into a small text button at the bottom, not a row of equals.
- Motion: the Fold opens outward from the centre and settles, slower than every other pose.
- Share: no, because the two actions above it are the share.
- The hearts and boards line lives here as the caption's second clause when either is non zero: `23 stops hearted along the way.` No mono, no two-column row.

---

## 7. Chrome

Three zones, nothing else.

```html
<header class="wr-chrome">
  <span class="wr-mark">OVVO</span>
  <span class="wr-dots" aria-hidden="true"><!-- 10 segments --></span>
  <div class="wr-controls">
    <button class="wr-icon" data-action="pause" aria-label="Pause the story">…</button>
    <button class="wr-icon" data-action="sound" aria-label="Sound off">…</button>
    <button class="wr-icon" data-action="close" aria-label="Close">…</button>
  </div>
</header>
```

- The mark is the existing OVVO wordmark, unmodified, 20px tall, 50 percent opacity. It is not redrawn or relettered here.
- The progress segments sit **below** the mark on their own line, 4px from the top edge. Done segments are `rgba(255,255,255,0.5)`, the current one fills left to right over the chapter's hold, upcoming are `rgba(255,255,255,0.16)`.
- Icons are 40px circles, `background: rgba(255,255,255,0.1)`, white glyph, no text labels.
- The sound control always names its action in the aria label, never on screen. It reads `Sound off` when audible and `Sound on` when not.
- Pausing freezes the hold timer, the Fold (`animation-play-state: paused`) and the score. Resuming continues from where it stopped, it does not restart the page.
- No page counter, no chapter title in the chrome, no "Sound off" pill, no "02 / 12".

---

## 8. Timing and transitions

- Each chapter declares `hold` in the story data, 4200 to 6200ms, written on the page above.
- The hold starts when the sentence finishes entering, not when the route changes.
- The last 520ms of the hold is the exit: sentence out in 200ms (`opacity 0`, `translateY(-10px)`), object crossfade starts, next sentence enters 180ms after the object starts, 480ms line reveal.
- The progress segment fills across the whole hold, including the exit, so the bar and the page agree.
- A swipe or tap cuts the remaining hold and transitions immediately. The tap rule stays: left half back, right half forward, controls excluded.
- Auto-advance does not depend on the audio ending. The clock is the page's own. The music runs by act underneath (section 9).

Every page must show visible movement for the **entire** hold. The measurable test: three screenshots 500ms apart during the hold differ by at least 0.5 percent of pixels in the object region.

---

## 9. Sound

The current score restarts a track on every chapter, which is why the beat and the page disagree. Three changes:

1. **Music runs by act.** On entering Act I, start `luxury-anthem`; when it ends, chain `electro-dance` with a 700ms crossfade, and alternate within the act. Act II alternates `afrobeat` and `hip-hop-anthem`. Act III alternates `melodic-trap` and `dark-trap`. The close plays `acoustic` once.
2. **A page turn never starts or stops a track.** The only sound tied to a page is the single Fold pulse on the beat, and it is silent.
3. **The station bell rings at act boundaries only**, not on every page. Two notes every six seconds was a doorbell, not a score.

The beat data in `src/lib/wrappedBeats.ts` stays exactly as it is, because it was measured from the files. The Fold's beat pulse and the figure's landing both read `beatMs(act.track)`.

New interfaces in `src/lib/wrappedSound.ts`:

```ts
export function playAct(act: 1 | 2 | 3 | 'close'): void;
export function pauseScore(): void;
export function resumeScore(): void;
export function actSeconds(act: 1 | 2 | 3): number; // for the progress bar when muted
```

`chapterSeconds` and the per-track cut logic leave `WrappedPage` entirely. The page clock is `chapter.hold`.

---

## 10. Sharing

A share control appears on pages 2 to 9, bottom centre, and nowhere else. Tapping it opens the existing card generator, rebuilt:

**Card, 1080 x 1920**

```
background      #000
fold            the current pose, act hue, drawn at the top and bottom edges only, 380px tall each, cropped
sentence        the page's own sentence, white, 92px, weight 800, max 860px wide, centred at y 940
caption         the page's own caption, rgba(255,255,255,0.72), 44px, centred 40px below
wordmark        OVVO, 44px, bottom left, 88px margin
year            2026, 44px, bottom right, same baseline
```

- One card per page, drawn from the same data as the page, so it cannot say anything the deck does not.
- The old card's three stat boxes and orbits are gone. Boxes on a card look like a form.
- Per page share text is listed in section 6 and is used for the clipboard copy.
- `navigator.share` is used when available, with the file attached; the clipboard and the download are the fallbacks.

---

## 11. Reduced motion

`prefers-reduced-motion` and the app's own setting both land here:

- No drift, no refold, no beat pulse. The Fold sits at its pose.
- Sentences appear with a 220ms opacity fade and no movement.
- Auto-advance still runs, because the story has to be readable without a swipe. The pause control still works.
- The progress fill remains, because it is information.

---

## 12. Data and honesty rules

Unchanged from the tally, restated because this rebuild touches every figure:

- Every number comes from `YearTally` and nothing else.
- No comparison with other travellers, no invented average, no "top 3 percent".
- Between 1 and 4 journeys, the deck is the two card honest version it already has, with this document's ground, type and Fold. It does not get padded to ten pages.
- The demo year is used only when the real year is empty, and the close says so in the caption, not as a legal note on a cover.
- The look page prints the look's own four colours, taken from `StyleDef.light`, and never invents a fifth.

---

## 13. Files and the order of work

Each step ends with a build and a screenshot pass. Do not start step 3 before step 2 is verified on a phone sized viewport.

**Step 1. The Fold.**
- New: `src/components/wrapped/Fold.tsx` (six poses, frozen path data, `data-pose`, `data-act`).
- New: `src/styles/wrapped-film.css`, imported after `components.css`.
- Test: mount every pose at 390 x 844, screenshot, confirm panels, gaps, hairline, gradient rotation and no filter in the DOM.

**Step 2. The frame.**
- Rewrite `.wrapped-stage`, `.wr-frame`, `.wr-sentence`, `.wr-caption`, `.wr-scrim`, `.wr-chrome`.
- Delete sections 24 and 24b from `components.css`.
- Test: contrast of the sentence over the brightest pose is at least 7:1.

**Step 3. The story data.**
- Rewrite `src/lib/wrappedDeck.ts` to the ten chapters and the `Chapter` shape below.
- Delete `chips`, `hearts`, `boards`, `dots`, `blocks`, `swatches`, `arc`, `bars`, `map.labels` boxes, and the `lines` and `origin` chapters.
- Test: a script that asserts ten chapters, each with `hold` between 4200 and 6200, a sentence of at most 9 words and no duplicate figure across pages.

**Step 4. The page.**
- Rewrite `WrappedPage.tsx` render: chrome, frame, Fold, share pill, pause.
- Remove the aurora, orbit, rings, burst, grain, dial, rail, stretch, chips, tally, blocks.
- Test: every page screenshot, every page share, tap zones, keyboard, reduced motion.

**Step 5. The map.**
- New geometry rules from section 6.7 inside the Fold's `lane` pose. No separate map component.
- Test: 7 routes visible and separated at 390 wide, 3 labels placed without collision, no graticule in the DOM.

**Step 6. The sound.**
- `playAct`, `pauseScore`, `resumeScore`, act chaining, bell at act boundaries.
- Test: `?sound=debug` shows the act track changing at act boundaries only, and never at a page turn.

**Step 7. The card.**
- Rebuild the canvas card to section 10 and move it to `src/lib/wrappedCard.ts`.
- Test: download every page's card, open at 1080 x 1920, confirm the sentence matches the page.

**Step 8. Cleanup.**
- Remove the old CSS block, the now unused chapter fields, and any test that asserted the old layout.
- Run the em dash audit through `npm run build`, the target size audit, and the full deck screenshots.
- `node scripts/keep.mjs --save "Wrapped rebuilt as one object, one black ground and one sentence per page"`.

### 13.1 The `Chapter` shape

```ts
export type Act = 1 | 2 | 3;

export interface Chapter {
  id: 'cover' | 'total' | 'pair' | 'hour' | 'direct' | 'longest' | 'map' | 'look' | 'hours' | 'close';
  act: Act;
  pose: Pose['id'];
  /** The sentence, with {tokens} already resolved. At most 9 words. */
  sentence: string;
  /** One line under it, at most 12 words. */
  caption: string;
  /** The figure inside the sentence, when there is one, so it can be counted up. */
  figure?: { value: number; from?: number; suffix?: string };
  /** How long the page stands, in milliseconds, 4200 to 6200. Never set on cover or close. */
  hold?: number;
  /** The share text for this page, already resolved. Absent means no share control. */
  share?: string;
  /** The look's four colours, on the look page only. */
  wear?: [string, string, string, string];
  /** The map's routes and stops, on the map page only. */
  map?: { routes: MapRoute[]; stops: MapStop[]; labels: MapLabel[] };
}
```

---

## 14. Acceptance

A build is not finished until every line below can be shown.

**Look**
1. Every page's background is `#000000` outside the Fold. Sample three pixels per page.
2. No element on any page uses gradient clipped text. Grep for `background-clip: text`.
3. The sentence is centred, at most 3 lines at 390 x 844, and at most 9 words.
4. The figure is inside the sentence on every page that has one.
5. No page has a kicker above the sentence except the cover.
6. No page has a boxed list, a chip row, a swatch square, a dial or a ring.

**Motion**
7. Three screenshots 500ms apart differ by at least 0.5 percent in the object region on every page.
8. Each pose has a distinct drift duration, and no two pages share a keyframe name.
9. A page turn is an object crossfade with no slide or wipe.
10. Reduced motion shows zero continuous animations and zero transform on the Fold.

**Pacing**
11. Every hold is between 4200 and 6200ms.
12. The progress bar's current segment reaches full exactly when the page turns.
13. No page needs a swipe to finish reading its own sentence.

**Truth**
14. Every figure on every page matches `YearTally`. Check by comparing the demo deck against `demoYear(2026)`.
15. No duplicate figure across pages.
16. The empty year still gets two honest cards and no invented filler.

**Chrome and control**
17. Three icons, one mark, one bar. No text control labels on screen.
18. Tapping the left half goes back, the right half forward, and a control tap does neither.
19. Pause stops the hold, the Fold and the score, and resume continues instead of restarting.
20. A share control exists on pages 2 to 9 and nowhere else.

**Sound**
21. The track changes at act boundaries only, shown in `?sound=debug`.
22. Muted, the story still advances on its own and the bar still fills.

**Performance**
23. No frame above 32ms in a three second trace at 4x CPU throttle.
24. No `backdrop-filter`, no SVG `feGaussianBlur`, no box shadow on the Fold.

---

## 15. Things this document decides so nobody argues later

- **Ten screens, not twelve.** The lines page and the origin page are cut. The hour page absorbs the persona.
- **One object, six poses.** No page invents a new visual system.
- **Three act hues on black.** No page owns a background colour.
- **The sentence is the layout.** No giant number, no label, no chart beside the text.
- **The chart is the Fold when a chart is needed.** Hours become 24 bands, routes become rails, the look becomes the gradient.
- **The share is on the page.** Every page with a figure.
- **Music by act.** A page turn never restarts a song.
- **The map stays schematic.** There is no coastline or city geometry in this app, and a fake one is worse than an honest diagram. The fix for the map is separation, labels and weight, not invented terrain.
- **The wordmark is untouched.** It is used small, at 50 percent opacity, and it is never redrawn for this deck.

## 16. Known risks

- **The Fold is the whole design.** If the six poses read as stripes rather than folds, the film fails. Budget the most time here, and check it on a real phone before building the pages on top of it.
- **A centred sentence leaves a lot of black.** The reference earns that emptiness with a very large, very bright object. A small or dim Fold will make the page look unfinished rather than composed.
- **Act chaining assumes the files loop cleanly.** They are 13 to 20 second pieces; the chain points must be checked by ear, which cannot be done in this workspace. Flag it for the steerer.
- **Ten pages of long holds is a four minute film.** If it drags on a phone, the answer is a shorter hold and a faster fold, never a smaller object.
