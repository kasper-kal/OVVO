# How your steerer works

**A briefing for an agent starting on any of his projects.**

This file is about a person, not a codebase. It names no product, no language, no framework, no file
path and no repository. Copy it into any project and it still holds. Its case history is drawn from
other projects and is marked as evidence at the end, for exactly that reason — precedents about
behaviour, not instructions about your code.

It is also written so that **one prompt is enough**. If you were handed this file and nothing else,
you have the standard, the definitions, the audit doctrine, the browser method and the definition of
done. Do not ask him to explain the brief twice; read §3, run the instruments you have (§7), and work
the loop in §8.

Read §1 to §4 before you write a line of code. Read §10 when you need to know how bad it gets when
these rules are ignored.

---

## 0. How to use this file

Three jobs, in this order:

1. **Find out what is true now.** Run every check the project has. A statement about the project that
   is not backed by a command's output is a guess, and guesses are what this file exists to stop.
2. **Fix the class of defect, not the named screen.** Every order is one instance of a rule (§3). Fix
   the rule, then prove the other instances moved.
3. **Report numbers, limits and the running product** in the shape of §9.

Fixed vocabulary, used throughout:

| word | meaning |
|---|---|
| **order** | anything he writes, including a complaint, a question with an implied answer, or a sentence that sounds like thinking out loud. All of it is binding. |
| **finding** | a measured defect: a number, an element, a count. Never an adjective. |
| **instrument** | a committed script that measures a rule and can fail. A screenshot is not an instrument. |
| **gate** | an instrument that exits non-zero on a finding, so "green" is a fact rather than an opinion. |
| **signature** | the measured properties that make two instances of one control comparable (§3.1). |
| **drift** | two instances of the same action with different signatures, without a written reason. |
| **deliberate** | a difference that is a decision on the record, in the project's exemption register, with its reason printed. |
| **overwhelming** | a screen explaining itself: any block that repeats what another block already says (§3.6). |
| **sticked** | his word for anything touching something it should be separated from, overlapping, crowded, ragged or clipped (§3.5). |
| **green** | the command ran after the last edit, exited 0, and printed its pass line. Not "it built". |

Two standing constraints that are easy to miss and expensive to break:

* **Never redesign the product's logo or wordmark** unless he asks, and if he asks, ask him to confirm
  twice before touching it.
* **Never use a structured question tool.** He answers in prose. Ask in your message, in plain text,
  and keep it to one question.

---

## 1. The relationship

One person steers. He is not a designer, not a developer, and not a customer with a ticket queue. He
is the owner, the daily user, and the acceptance test, all at once — and he is the only one.

That single fact explains everything else:

* **He is the spec.** A specification document is not the authority in his projects; his sentences
  are. When he says "the corners are gone with some colour settings", the requirement is that the
  corners survive every colour setting, and it is a requirement from that moment, forever.
* **He uses the thing every day.** He is not reviewing screenshots of a staging build. He notices
  that a glyph sits 2px high, that one card's inner corner differs from the next, that a control says
  "Metro" on one screen and "metro" on another, that two elements are touching without a gap, that a
  switch reads off while the setting is on. Assume he will notice, because he does.
* **He has been burned.** Every harsh message in the history is attached to something he asked for
  and did not get. Search the project's decision log before you decide anything; the odds are good
  your "new" decision is a decision he already made, and re-breaking it is the worst outcome
  available to you.

---

## 2. How strict he is

**Stricter than any spec you have worked to, and stricter than the product currently is.** Until a
measurement says otherwise, assume the tolerance is zero.

**a. He gives orders, not tickets.** Every sentence he writes is binding, including the ones that
sound like thinking out loud, and including the ones that arrive as a complaint rather than an
instruction. A message that says *"get rid of X and replace it with Y — WHICH I ASKED FOR BEFORE AND
YOU DIDN'T DO"* is one order with two halves, and the complaint is the important half: the order was
already given and already ignored. Your job starts with finding out why it did not take effect.

**b. A correction outranks everything, and it is retroactive.** When he says a feature "stopped
making a difference" or is "on while it says it's off", the answer is not a patch on the surface. It
is: find which change caused it, name that change, undo the mechanism, and prove by measurement that
the behaviour is back to what it was. A correction does not amend a decision — it kills it, and every
later decision that leaned on it has to be re-checked.

**c. Silence is a failure; so is asking for permission twice.** He does not want a proposal, a plan,
or a question he did not ask. He wants the thing done, verified, and reported with the number that
proves it. If you are blocked, name the blocker in one sentence. Never hand authorised work back with
"say the word" — it was authorised when he asked.

**d. Do not improve what he did not name.** This is the trap for capable agents. A helpful extra row,
a "better" label, a tidier layout, a smarter default — each of those is how a project ends up with
nine rounds of *"everything is inconsistent"*. Make the smallest change that satisfies the order, and
leave every other value exactly where it was measured.

**e. The same defect reported twice is your fault.** If he reports a class of defect a second time,
the first fix was done screen-by-screen and the method was wrong. Build the instrument, then fix the
rule (§5, §8).

---

## 3. What inconsistency is

### 3.0 The definition

> **One concept, one name, one glyph, one shape, one place, one word per thing — in every state, at
> every width, in every appearance and in every language the product ships.**

An inconsistency is **two or more instances of the same function whose measurable signature differs,
or two different functions that a user cannot tell apart.** It is not a matter of taste and it is not
"polish": it makes the user learn the same idea twice, and that is what he is reacting to when he
writes in capitals.

Two steps, both required, before you call anything a defect:

1. **Is it the same function?** Not the same verb, not the same word, not the same visual weight —
   the same *thing the user is trying to do*. "Keep a journey" and "keep a search" are both saving
   something; they are two functions. "Close this panel" and "empty this field" are both a cross; two
   functions. Grouping by verb manufactures findings, which is worse than missing one. (WCAG 3.2.4
   names the *same* function; W3C's COGA guidance names one glyph, one meaning.)
2. **Does the signature agree — and if not, is the disagreement written down?** If it agrees, no
   finding. If it disagrees, it is either drift (fix it) or deliberate (in the register, with a
   reason, §4.4). There is no third option, and "it looks fine to me" is not one either.

An inconsistency also exists **between a claim and the behaviour**: a switch that says off while the
setting is on, a count that says 40 while 38 render, a badge that promises alerts while the list is
empty. That class is the gravest (§2b, §3.2 A12).

### 3.1 The signature (what you actually compare)

Two instances of one action are comparable on seven properties. Measure them; do not eyeball them.

| property | how it is read |
|---|---|
| **glyph** | every icon inside the control, by name, in order |
| **shape** | height, corner radius, border width and style, fill |
| **ink** | the computed colour of the label and of the glyph, as a role, not a literal |
| **label pattern** | icon-only vs label vs icon+label; and the label's *word*, per state |
| **place** | the landmark it sits in (page head, card, panel, labelled row, app bar, navigation, dialog), the row of that landmark (first, body, last), and the side (leading, trailing, centre) |
| **state coverage** | the same control in empty / filled / error / disabled / loading / pressed, compared to *itself* in the other states |
| **container response** | what it does at the narrowest supported width, and whether it changes side or shape with width |

A pill's **width** is recorded but never judged, because it is what its label says. Everything else
in the shape row is judged.

### 3.2 The fourteen axes

Each axis: what the defect looks like, the instrument that finds it, the pass condition, and the
judgement that separates a real finding from a false one. The letters are stable; use them in findings
and in the decision log (`A3: one label table, 41 instances`).

**A1 — Placement drift.**
One action in several positions. *Real case:* a toggle at the top-right of one card, the top-left of
the next, in a footer row on a third, and flipping sides with viewport width. **Instrument:** group
every control by the action it performs and print the landmark/row/side per instance. **Pass:** one
landmark+row+side per action, except registered decisions. **Trap:** a page-head control and a
dialog-footer control cannot occupy the same place; when the *container* forces the difference, it is
a decision to register, not a defect to "fix" by forcing one global position.

**A2 — Name drift.**
One function called several things ("Show on map" / "Network map"; "Save" / "Keep this" /
"Favourite"). **Instrument:** the same grouping, reading accessible names and visible labels; plus a
capitalisation/wording walk. **Pass:** one phrase per function, everywhere, in every language.
**Judgement:** a label may name its context ("Plan from here" vs "Plan the return") if the object is
genuinely different — but the verb and the shape must not drift.

**A3 — Case drift.**
`metro`, `Metro` and `METRO` for the same class of label; a group name in sentence case where every
other group name is uppercase; a button in Title Case among sentence-case buttons. **Instrument:** a
walk of every standalone label, heading, button, placeholder and accessible name, in every language;
plus the single label tables that turn data values into words. **Pass:** every standalone label and
sentence starts with a capital; group names share one treatment; no control echoes a raw enum. **False
positive:** the tail of a sentence, a time, a code, a unit — these are not capitalisation questions
and must not fail the walk.

**A4 — Glyph drift.**
One icon meaning two things, or two icons meaning one thing. *Real case:* a toggle drawn as a pin on
one screen and as a cross on another; a way back drawn as a route glyph in one bar and an arrow in
another. **Instrument:** the mechanical rule — same action, same state, two glyphs = failure; it is
never exempt. **Pass:** one glyph set per action per state. **Related:** a control with no glyph where
its siblings have one, or a glyph whose meaning is not the action.

**A5 — Shape and geometry drift.**
A 12px inner corner next to a 16px one; two controls on one row measured to different heights; a
small button inside a capsule of its own size; one card padded 16px and the next 12px; a nested
surface whose radius does not follow the concentric rule. **Instrument:** the layout audit (targets, declared-square,
clipping) plus the signature's shape row. **Pass:** one value per role, from the project's scale, with
nesting radii = outer − padding. **Trap:** density variants exist and change values *together*; a
single control shrinking alone is drift even inside another density.

**A6 — Word drift.**
"1 items", "2 item(s)", "Operator(s)", "1 legs", "1 stops shown of 61". **Instrument:** the wording
walk plus a search of every count site for the project's plural helper. **Pass:** every count goes
through one helper; no parenthesised plural anywhere; no raw data value printed at a person.

**A7 — Raw data printed.**
`metrostop`, `null`, `draft`, `train` in a chip that should say `Train`. **Instrument:** the rendered
text walk and the label tables; grep for the enum values. **Pass:** every enum is mapped through one
table to a human label, in every language.

**A8 — Glyph geometry.**
An icon squashed on one axis by a tight flex row (15px wide, 11.66px tall), a fractional size, a glyph
drawn off its own centre, an icon not on the optical centre of the text beside it. **Instrument:** read
every rendered icon — square, a whole number of pixels, named and weighted, and within ~1.5px of the
text's optical centre (~2.2px when the reference is a line box, which carries descender space).
**Pass:** all four, on every screen and width.

**A9 — Sticking and spacing.**
Anything touching something it should be separated from: a chip row flush against the canvas it
labels, a pill flush under the search box, two buttons with no gap, an icon crowded into a title.
**Instrument:** the dead-name audit first (a class name with no rule is the usual cause), then a
measured gap — 0px is always a defect — at the narrowest width. **Pass:** the intended gap exists; a
gap that is "almost" (1–2px) is a broken rhythm and also a defect. **Judgement:** a hairline separator
is not a gap; a deliberate flush edge is registered, not fixed.

**A10 — Overlap and crowding.**
A hit area crossing a neighbour by 2px; a chip group ragging around its label; a segmented control
splitting an option across two lines; a pill wrapping mid-word; a label on a drawing sitting on a
mark. **Instrument:** the effective-target probe, the wrapped-capsule and clipped-text checks, and
`elementFromPoint` in any new probe. **Pass:** no overlap of interactive boxes; no option split across
rows; no clipped text; real air between a label and the marks it sits among. **Trap:** measure in
**screen** coordinates. A box read inside a transformed group is not a screen box and will happily
report "no overlap" on a collision.

**A11 — Colour and contrast drift.**
Two secondary ink tones that look similar and measure differently; the same "muted" idea at 2.45:1 in
one place and 4.9:1 in another; a semantic colour (delay, cleared, advice) copied from a light surface
onto a dark card at 2.2:1. **Instrument:** the contrast sweep — every text and icon against the
surface it actually sits on, WCAG AA (4.5:1 body, 3:1 large text and icons) — in every appearance and
on every background mode. **Pass:** AA on every pair that actually occurs. **Rule:** one token per
role; a semantic hue may change *lightness* per surface, never identity.

**A12 — The claim and the behaviour.**
A setting that says it is off while it is on; a control whose pressed state and stored state disagree;
a count that does not match the rows; a "saved" toast that saved nothing; a switch whose label names
the opposite of what it does. **Instrument:** a behavioural probe — set it, read the storage, reload,
read the UI and the storage again. **Pass:** label, visual state, stored value and effect all agree
after a reload. **This is the worst class in any project.** A lie is worse than a missing feature,
because he trusted it.

**A13 — Repetition (overwhelmingness).** See §3.6.

**A14 — Language parity.**
A string that exists in one language and falls back in the other; a longer translation that breaks a
layout that fits in the shorter one; a message in one language and its button in the other; an audit
step that opens a screen by a label that only exists in one language. **Instrument:** every walk runs
in every shipped language. **Pass:** every user-visible string goes through the dictionary, each
language reads as its own language, and every screen still measures the same at the narrowest width
with the longer words.

### 3.3 The two questions that decide a borderline case

Ask them in this order, and write the answer down before you edit:

1. **Which instance is right?** Not "which looks better": which one matches the rule already on the
   record (a decision-log entry, a token, the shared component, the more numerous instances). If the
   project has no rule, the answer is **build the rule** — usually by fixing the shared component or
   token so there is nothing left to choose per screen.
2. **Is the difference doing work?** A difference is deliberate only if a user can name what it buys
   them (a page-head pill versus a text-only action inside a card's own row; a solid submit inside a
   picker). "It was easier" is not a reason. If it is doing work, register it with that reason in one
   line. If it is not, fix it.

When two instances disagree and neither is obviously right, **the majority is not the authority and
neither is the newest** — the shared component is. Change the component, let all instances move, and
re-run.

### 3.4 What is *not* an inconsistency

Do not "fix" these. Each is a false positive that has already cost a round somewhere:

* **Responsive difference.** At the narrowest width a control may become full-width, move under its
  label, or stack. That is the same rule responding to the same breakpoint — as long as it is the
  *same* breakpoint, and it is measured at the narrowest width as well as in the middle.
* **Density difference.** A compact density changes paddings, radii and sometimes column counts
  *together*. One value moving alone is drift even inside the other density.
* **Container-forced size.** A button in a dialog footer may be full-width where the same action in a
  card head is a pill. Register the container, judge the control.
* **Content length.** A pill is as wide as its label; a name may wrap where another does not. Width is
  recorded, not judged.
* **The platform's own control.** A native select, a file input, a colour input: its internal geometry
  is the operating system's. The frame around it is still judged.
* **A deliberately different function.** A cross that closes and a cross that clears are two
  functions; a heart that favourites a place and a pin that puts its board on another screen are two
  ideas with two storage slots. Do not merge them to make a count go down.

### 3.5 The "sticked" family, with numbers

His word covers five measurable things. Check them at the narrowest width first, then the middle, then
desktop:

| defect | measurement | pass |
|---|---|---|
| touching | gap between sibling boxes, from screen rects | > 0, and equal to the intended step |
| overlap | intersection of any two interactive boxes | 0px in both axes |
| crowding | chip/pill group: does each option keep its own line, and does the group share one edge? | one line per option where the design says so; no ragged mid-word break |
| ragged | rows of unequal height in a grid of cards | equal heights per row, no hole |
| clipped | `scrollWidth > clientWidth` (or the vertical equivalent) while overflow is hidden | never |

A zero gap is almost never a design choice. In practice it has always been a **class name with no
matching rule** — the intended gap silently evaluated to nothing. Run the dead-name audit before you
add a margin.

### 3.6 Overwhelmingness

The most-repeated complaint, usually in capitals. The tell is always the same: **a screen explaining
itself.**

A dashboard of stats above the controls that set those same numbers. A "current settings" summary
directly under the settings. A banner warning about demo data that a header chip already announced. A
heading, a description, a helper line and a caption for one field. Three cards repeating one fact.

Four tests, each mechanical enough to write down:

1. **Repeat test.** Does this block say something another visible block already says? → delete the
   block, not the layout.
2. **Count test.** How many controls, and how many characters of helper text, does the screen carry in
   its *simplest* state? Write the number before and after. (Real case: one card went from eleven
   controls and 288 characters of hints to three rows that open the screens behind them.)
3. **Question test.** What one question does this screen answer? Anything that is not the answer is
   chrome.
4. **Chrome ratio.** Title, description, helper line, caption and footnote for one field? One of them
   survives; the rest go.

The fix is **deletion, not restructuring**. Colour only where it carries meaning (state, warning,
error); everything else is ink on surface. Quiet by default, one accent on the thing that matters.

**Edge case:** a *summary widget* the user chose to put on their own home screen is not a restatement
— they can remove it. A summary directly beneath the controls that set it is.

---

## 4. How strict the audits are

### 4.1 Zero tolerance, enforced by exit codes

There is no "close enough", no "minor", no severity to triage. Every instrument exits non-zero on a
finding, so a defect cannot be rounded down to a note. Report the number; never round "works at
desktop" up to "works".

### 4.2 A gate is only a gate if you have seen it fail

The founding lesson, learned the hard way:

> **A screenshot cannot see a rule.** Three rounds in a row a consistency defect was reported by eye
> and fixed **on the screens he named**, and the same defect reappeared on the next screen. The fault
> was the method, not the screens.

So before you trust any check — including one you just wrote:

1. **Plant the bug.** Reintroduce the defect (an out-of-rule media query, a raw enum label, a 32px
   button, the wrong glyph for an action, a label measured in the wrong coordinate space).
2. **Run the check and watch it turn red**, with the instance named.
3. **Revert the plant and watch it turn green.**
4. **Quote both runs** when the check is new or newly changed.

A real incident: a suite reported "no label overlaps" on a drawing where a label sat directly on a
mark, because it compared boxes from two coordinate spaces. It passed on the failure case. A check
that has never failed is an ornament.

### 4.3 Coverage is a product, not a sample

An audit means enumerating the axes and testing the product of them:

* **screens** — every route **plus every overlay and state**: dialogs, sheets, popovers, full-screen
  pickers, empty states, error states, the not-found screen.
* **widths** — the narrowest phone your users have, the middle, *both sides of every breakpoint* (a
  round that samples 390 and 768 skips the band the bugs live in), and desktop.
* **appearances** — light, dark, and the system default. Contrast is the one thing a token override
  breaks silently.
* **languages** — every one the product ships, because a copied string breaks a layout that fits in
  the source language.
* **background modes** — whatever the product allows behind its surfaces: plain, tinted, translucent
  over imagery.
* **states** — empty, filled, invalid, disabled, loading, error, offline, pressed, focused.
* **time** — anything driven by a clock (departures, "in 3 minutes", day boundaries). Freeze it, or the
  defect is only visible in the last hour of service.

If a check cannot reach a state, **seed it** (§5.4) or write a probe that walks to it. Never audit an
empty state and call the screen measured.

### 4.4 Exemptions have a home, and it is not a comment

The only place a difference may be tolerated is the project's **exemption register**: one entry per
action, naming the rule and *why* the instances differ, printed in the report. An entry is a claim he
can contradict; nothing goes in it to make a count go down. When an order removes the reason, the entry
is deleted in the same change.

Anywhere else — a lint suppression, an `!important`, an inline style, a skipped test "for now" — is not
an exemption; it is the defect wearing a hat.

### 4.5 Numbers before and after, and the regression rule

* **Before** you touch shared machinery (colour, contrast, spacing, typography, radii, breakpoints,
  the header row, the minimum target size), **write down what it measures now.**
* **After**, re-measure it. **A number that moved without an order is a regression you introduced**,
  and it is the most serious class of defect in these projects, because it breaks something he had
  already accepted.
* The report he respects is a **count**, not an adjective: `56 → 0` hardcoded colours, `430/430` names
  accounted for, `15 instances in 5 shapes → 15 in 1 shape`, `2.45:1 → 4.91:1`.

### 4.6 Vacuity: a check that measured nothing has failed

Every instrument must prove it saw the thing it judges. A coverage rule asserted against zero
instances is a pass that means nothing. Count what you judged, print the count, and treat zero as a
failure unless zero is genuinely the answer — and say which.

### 4.7 The honesty ladder

Every statement you make is one of four things. Only the first two may be reported as done:

1. **Measured** — an instrument's number, from the build you are delivering.
2. **Mechanically checked** — a gate passed, after the last edit.
3. **Seen** — you looked at it. Useful, never a verdict.
4. **Assumed** — you did not look. Say so.

A build that passes is not a page that renders. A route that returns 200 is not a screen that works. A
sign-in flow that redirects is not a completed sign-in. Name blocked or skipped checks in one line,
without a euphemism.

---

## 5. The Playwright method

This is how browser instruments in these projects are built, and how you build the next one. Read it
before you write your first selector.

### 5.1 Why a browser

A build, a type check and a screenshot all miss the same three things: the *layout* a browser computes,
the *surface* a text is actually painted on, and the *hit area* a finger actually gets. A browser
instrument reads the DOM the way the user's device does. Playwright is a local tool in these projects,
not a dependency of the product.

### 5.2 Environment

* **Install the browser, not just the library.** A restored machine often has the module and not the
  binary, or the binary and not the shared libraries. Symptoms read like test failures and are not:
  an exit code 127 with `libnspr4.so: cannot open shared object file` is missing system libraries; a
  crash on first paint with `SkFontMgr … Not implemented` is missing fontconfig and a font family.
* **No root?** Fetch the `.deb` files and unpack them into a user directory, then point
  `LD_LIBRARY_PATH` at it; write a minimal fontconfig file and export `FONTCONFIG_FILE`. Cache what
  you downloaded — the package lists of a restored machine do not survive, and a check that installs
  from the network is a check that fails on a plane.
* **No DNS?** A page whose blocking stylesheet comes from a font host will never settle: `goto` times
  out before the audit measures anything, and it looks like a broken page. Give Chromium its own
  resolver (`--host-resolver-rules=MAP font.example 127.0.0.1,…`) so those hosts refuse instantly. The
  page then measures on the **fallback face**. That is not a weakened check — targets, contrast,
  clipping and overlap are all measured, only the glyphs differ — but the report must say so.

### 5.3 Launch, viewport, routes

```js
const browser = await chromium.launch({
  chromiumSandbox: false,
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--hide-scrollbars'],
});
const context = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 2 });
const page = await context.newPage();
page.on('pageerror', (error) => appErrors.push(error.message));
```

* `deviceScaleFactor: 2` so a fractional size or a blurred glyph has a chance to show.
* **Never assume a URL renders a state.** A deep link into a detail screen routinely renders its
  "not found" or empty state in a fresh browser; that is how an audit measured an empty screen for
  weeks while believing it measured content. Navigate the product's own way in.
* Wait for `domcontentloaded`, then settle, or wait for the specific element you are about to measure.
  Prefer the thing itself over `networkidle`, which is unreliable when a font or tracker is blocked.
* **Dismiss first-run prompts** at the start of every walk, or every screen is measured through a
  scrim.
* Capture page errors and console errors on every route. A screen that throws is not a screen.

### 5.4 Seed the state instead of clicking to it

Whatever the product persists — local storage, a session store, IndexedDB — seed it **before** the
first navigation, with the app's own key and shape:

```js
await context.addInitScript(() => {
  localStorage.setItem('the-app:settings', JSON.stringify({ theme: 'dark', language: 'nl' }));
});
```

Rules: seed only what you are studying; never seed a state the product cannot reach by itself; and
seed for the *narrow* axes (appearance, language, a saved item) while still *walking* for the states
that need a real interaction (§5.5).

### 5.5 Reach the real screens

Half of any product is behind a click: pickers, map screens, confirmation dialogs, the results of a
search, a chosen item. The pattern is always the same — do the interaction, then capture the screen as
a screen of its own:

```js
await page.getByRole('button', { name: /^Search$/ }).click();
await page.getByRole('textbox').first().fill('…');
await page.waitForTimeout(320);                       // the suggestion list settles
await page.locator('.suggestion').first().click();
```

Selectors prefer role and accessible name over class names, because a class is a build detail and a
role is what a person operates. **When a label is translated, the selector must be translated too** —
an English-only pattern times out on the other language and silently reads the page it never opened.

### 5.6 The primitives

Everything measured in these audits is one of these. Use them rather than inventing a heuristic.

```js
// 1. Geometry, always in screen coordinates
const r = el.getBoundingClientRect();

// 2. Paint, from computed style (never from what the stylesheet says it should be)
const cs = getComputedStyle(el);
cs.color; cs.backgroundColor; cs.borderTopWidth; cs.borderTopLeftRadius; cs.fontSize;

// 3. The surface a text actually sits on: walk up until something paints, compositing
//    translucency; over imagery, measure against both a black and a white backdrop,
//    because the picture is unknown.

// 4. Contrast, WCAG 2.x relative luminance
const lum = (c) => { /* sRGB → linear → 0.2126R + 0.7152G + 0.0722B */ };
const ratio = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
// body text ≥ 4.5:1 · large text (≥24px, or ≥18.66px bold) and icons ≥ 3:1

// 5. The EFFECTIVE target: probe points outward from the centre, because a
//    pseudo-element can grow a hit area and a paint box proves nothing
for (let dx = 0; dx <= 30; dx++) {
  const hit = document.elementFromPoint(cx - dx, cy);
  if (!(hit === el || el.contains(hit))) break;
}
// pass: the probed box meets the project's minimum, and every control that does not
// is overlapped by another target that does

// 6. Text's optical centre, for icon alignment: measureText on a canvas, using
//    actualBoundingBoxAscent/Descent and the font of the text holder

// 7. Clipping: scrollWidth > clientWidth (or the vertical pair) while overflow is hidden
```

### 5.7 The traps that have already produced false greens

Each of these shipped a green run on a broken screen. Read them as a checklist before trusting a new
probe.

1. **Coordinate spaces.** A box read inside a transformed group (an SVG `<g transform>`, a CSS
   `scale`) is not a screen box. Compare screen rectangles, or convert once, explicitly.
2. **The paint box is not the hit box.** A 21px icon button whose pseudo-element grows the target to
the project's minimum passes a `getBoundingClientRect` check and is still unpressable. Probe with
`elementFromPoint`.
3. **A pseudo-element is not in the DOM.** A `::before` that carries the visible dot, gap or radius is
   invisible to a query; read `getComputedStyle(el, '::before')` when the rule lives there.
4. **A class name with no rule.** The markup is right, the stylesheet has no such selector, the gap is
   zero. The browser will not tell you a name is dead; a text-level audit of markup against the
   stylesheet will.
5. **A scrim, a transition or a sticky header over the thing.** Measure after the animation, without a
   dialog over it, and with the element scrolled into view.
6. **A route that rendered its empty state.** See §5.3. If only the empty state is reachable, say so.
7. **A vacuous loop.** `for (const el of [])` is a pass. Count what you judged and fail on zero.
8. **The clock.** A board's cancelled row, an "expires today" badge, a "late" state: they exist only
   at some hours. Freeze the clock when the defect depends on it.
9. **An icon-only control has no label.** The nearest text a walk upwards finds belongs to another
   block, so the glyph is measured against a heading it has nothing to do with — one audit reported a
   refresh disc "101px off its label" that way. Skip alignment for an icon whose own control holds no
   text, and count the skips.
10. **A block comment written where the markup expects an expression is text.** It renders, every text
    walk reads it, and it can become the "label" beside an icon. It has shipped: a page carried a block
    of source commentary as a text node until an audit tripped over it. (In JSX: `{/* … */}`.)
11. **A portal needs a document.** Rendering a dialog into `document.body` during render throws where
    there is none, so a server-render check fails on every page with `document is not defined` while
    the build and the browser are green. Portal only when a document exists, and return the same
    markup inline otherwise.

### 5.8 The report shape

Every instrument prints: what it covered (`12 routes × 6 widths`, `18 screens × 2 languages`,
`430 names`), then each finding as a **distinct signature** with a count and where it was seen
(`x3 · .toggle 44×44 r50% pin · [/stops@390 /stops/x@390 +1]`), then a pass line or `FAILED — …` and a
non-zero exit. Aggregating by signature is what turns 300 identical hits into one finding he can act
on. Write the full report to a file so the next agent can diff runs instead of re-deriving them.

### 5.9 Writing a new instrument (skeleton)

```js
/**
 * What rule this measures, in one sentence.
 * Why the rule exists (the incident, with its numbers).
 * Run: node <path> [origin]
 * Exit: 0 clean, 1 findings, 2 no browser.
 */
const ORIGIN = process.argv[2] ?? 'http://127.0.0.1:PORT';
let chromium; try { ({ chromium } = await import('playwright')); } catch { process.exit(2); }
const WIDTHS = [/* narrowest, middle, both sides of every breakpoint, desktop */];

for (const width of WIDTHS) { /* seed, go, walk states, evaluate, collect */ }
// dedupe by signature, print count + where, fail on any finding or on zero coverage
```

Then plant a defect and prove it fails (§4.2). A new instrument that has never been red is not
committed as a gate.

### 5.10 Screenshots

Screenshots are for **him** and for **you**, never for a verdict. They are how you notice that there
is something to measure, and how you show what changed. A claim in a reply must still be backed by a
number; "looks good in the screenshot" is the exact failure these projects were built to stop. Where a
screenshot is the only evidence available (a crop, a drawing, a gradient), say that, and say what it
cannot prove.

---

## 6. What the project must be held to

Read the project's own design system before changing anything. If it has none, **that absence is the
first finding**, and building one is the fix — not the next round of eyeballing.

Where a project does have one, these are the promises it must keep. Each is measurable, and each has
an incident behind it in §10.

* **Tokens, not literals.** One file (or one layer) owns colours, spacing, radii and type. A literal in
  a component is a future inconsistency, and a count of them (`56 → 0`) is a legitimate deliverable.
* **One scale.** Spacing on a grid; a type scale, not raw sizes; radii that nest concentrically
  (`inner = outer − padding`); one elevation model.
* **One breakpoint per mode.** A single width decides mobile vs desktop, with both halves written so no
  width falls between them. Any other width is a *density* adjustment, written down with its reason. A
  component inventing its own width is how a page ends up half mobile and half desktop at 1200px.
* **Minimum target size.** Whatever the project states, measured as an **effective** area, at the
  narrowest width.
* **WCAG AA everywhere it actually applies.** Every text and icon against its real surface, in every
  appearance and on every background mode.
* **One component per concept.** A row, a pill, a chip group, a dialog, a back control, a picker: one
  implementation, one class family, one behaviour. If you are about to write a second one, you are
  about to create placement and shape drift.
* **One label table.** Every enum maps to a human word through one table; no screen formats its own.
* **Every count goes through one plural helper.** No `item(s)`.
* **Every string goes through the dictionary.** In every language, and every walk runs in every
  language.
* **State honesty.** A control's label, its visual state, its stored value and its effect agree — after
  a reload.
* **No demo vocabulary in a product that is not a demo.** "Simulated", "example", "prototype",
  "invented", "coming soon" are content defects when the thing works.
* **Overlays behave.** Initial focus, a real focus trap, Escape, focus return to the opener, and a
  locked document — from one shared implementation, not a copy per dialog.
* **The top row is one row.** One top edge, one content rail, nothing painted across it that the design
  did not ask for.

---

## 7. The runbook

A project of this kind should have these instruments. Run all of them before you report anything; add
the ones that are missing (§5.9), because an axis with no instrument is an axis he will report.

**Static — no browser:**
1. **Type check.** Silence is the pass.
2. **Build.** Must finish clean; a build is still not a screen.
3. **Server render of every page**, if the framework allows it: catches a runtime throw that a build
   cannot see.
4. **Dead-name audit**: every class or style hook used in markup has a rule.
5. **Breakpoint audit**: every width in the stylesheets is on the allowed list, with a reason.
6. **Pure-logic smoke test**: the engine the product's screens sit on (routing, pricing, searches)
   produces sane output for fixed cases.

**Behavioural — a browser:**
7. **Layout audit**: contrast, effective targets, clipped text, declared-square elements, the header
   row, popovers and capsules, at every width, in every appearance, on every background mode.
8. **Icon audit**: every rendered icon is square, a whole pixel, named and weighted, and on the optical
   centre of its text.
9. **Consistency audit**: every control on every screen, grouped by the action it performs, with one
   glyph/shape/place per action and the exemptions printed.
10. **Wording audit**: every standalone label, heading, button, placeholder and accessible name, in
    every language, for capitalisation and raw vocabulary.
11. **Behavioural probes** for the promises that matter to him: the colour system, the batch rule on
    lists, a switch that must survive a reload.

If a probe in the repository is stale — a selector for a control that no longer exists, a screen that
moved — **do not bend the product to satisfy it**. Re-point it, prove it can fail, or retire it and
say so. A probe that cannot run proves nothing, and a stale selector is not a product failure.

**Start the product and look at it.** Every website change ends with the app running at the address he
uses, on its real origin, with a host allow-list that accepts that origin. Confirm the listener, fetch
the page with the origin's own Host header, and show it to him. A 403 from a host allow-list is not a
running preview.

**What each instrument cannot prove** is as important as what it can:

| instrument | proves | does **not** prove |
|---|---|---|
| type check / build | types, imports, bundle | that any screen renders |
| server render | no throw on first paint | layout, contrast, interaction |
| dead-name audit | every name has a rule | that the rule looks right |
| breakpoint audit | no width outside the rule | that the layout at that width is good |
| laying audit | contrast, targets, clipping, header row, popovers | wording, glyph identity, placement across screens |
| icon audit | shape, size, name, weight, optical centre | that the glyph means the right thing |
| consistency audit | one action, one glyph/shape/place | contrast, wording, whether the place is *good* |
| wording audit | capitalisation and raw vocabulary | whether the sentence is helpful |

The gap between two instruments is where defects live. That is why they overlap, why you run all of
them, and why a defect found by eye gets an instrument before it gets a fix.

---

## 8. When you have one order

The loop. It works for "the corners are gone" and for "everything is inconsistent".

1. **Read the order twice.** Separate the request from the complaint. The complaint names a class; the
   request names an instance.
2. **Search the record.** The decision log, the audit register, the fix notes. Was this already
   decided? If yes, find why it regressed instead of deciding again.
3. **Reproduce it with an instrument**, not with a click. If none can see it, write one — then plant
   the bug and watch it fail.
4. **Name the rule.** One sentence: "the same action is drawn with one glyph per state", "a control's
   name sits one step above it", "no block repeats another block".
5. **Count the instances.** Every screen, every width, every appearance, every language. The count is
   your before-number.
6. **Fix the shared thing.** The component, the token, the class rule, the label table, the hook. If you
   fix per screen, the next screen is the next report.
7. **Re-run the whole suite**, not only the instrument that found it. A shared fix moves everything.
8. **Compare counts.** `before → after`, and re-measure the previously accepted values.
9. **Sweep the states you did not name**: the narrowest width, dark, the other language, empty, error,
   overlay, keyboard.
10. **Name the limits**, one line each, with the reason. Do not soften them.
11. **Start the product** and look at the screens you changed yourself — then say what the look proved
    and what the measurement proved.
12. **Reply in the shape of §9: short.**

If two orders conflict, the newer one wins and the older decision is deleted, not left as a comment. If
an order is genuinely ambiguous in a way that changes the outcome, ask **one** plain-text question and
stop; otherwise decide, implement, and state the reading you took.

---

## 9. Definition of done, and the reply

An order is closed only when all of these hold:

1. Done **exactly** as worded, on **every** screen the rule touches — not just the one in the message.
2. Verified in a real browser at **every width that matters**, in **every appearance**, in **every
   language** if words changed, and on **every background mode** if colour changed.
3. The whole suite is green **after** the last edit, with the pass lines quoted.
4. Before and after numbers, plus the re-measure of previously accepted values showing nothing else
   moved.
5. Anything not achieved named as a limit in one line, without a euphemism.
6. The product is running and visible to him, for anything with a UI.
7. The reply is short.
8. The voice is his: thank him, address him as **sir**, apologise for what you got wrong in one
   sentence, stay kind. Even when the message is criticism. Even when you think you were right.

The reply shape, in order, and nothing else:

```
<sentence: what was wrong, named plainly, apologised for once>
<what changed, per item, with the measured before → after>
<the checks: each command and the count or pass line>
<limits: one line each>
<the product: running, and where>
```

No wall of headings for a small fix. No "as I mentioned above". No claim you did not run.

---

## 10. Case history (another project — evidence only)

Kept separate on purpose. Your project has none of these files. Read them as precedents about
**behaviour**, not as instructions about your codebase.

| What happened | What it teaches |
|---|---|
| A pin toggle was reported "in different places". It was fixed on the named screens; the next screen was reported a week later. Then an instrument grouped all 327 controls by the action they perform — and found the same action in **15 instances, 5 different shapes**, one of them flipping sides with viewport width | Fixing screens does not fix rules. Build the instrument before the next report, not after. |
| A "current preferences" summary sat directly beneath the controls that set those preferences, and was deleted when he said "get rid of all this" | Overwhelmingness is always addition. Delete the restatement. |
| One widget's spacing was zero. The cause was a class name with no rule, so the intended gap silently evaluated to nothing. A committed audit now fails the build on any class in the markup with no rule | "Sticked" is a missing rule, not a spacing value. Instrument the class layer. |
| An audit reported "no label overlaps" on a map where a label sat on a station dot, because it compared boxes from different coordinate spaces | A check that passes on the failure case is not a check. Make it fail once on purpose. |
| A raised-contrast mode was worked on in one round; a later round changed colour machinery for an unrelated complaint ("the corners are gone"); the contrast mode silently became "on by default while saying it is off" | Shared colour/contrast logic is load-bearing. Record its measurements before touching it, and re-measure after. This is why a corrected decision kills the old one retroactively. |
| 56 hardcoded colours, 3 undefined custom properties, 6 off-scale type sizes and 24 inline spacing overrides were replaced by tokens and two shared rhythm classes, and the count printed as `56 → 0` | The report he respects is a before/after count, not an adjective. |
| One screen labelled a single control two different ways, three screens printed raw enum values and `Operator(s)`, and two screens drew the same back control as a pill in one place and a bare arrow in another | One concept, one name, one glyph — and the label table is the single source, not the call sites. |
| An agent fixed the reported defect, ran the type check and the build, told him it was done, and the defect was still visible in the screenshot he sent back | A build is not a screen. Do not claim done until an instrument measured the thing he named. |
| A settings screen explained one colour with three differently shaped sample tiles in a row; he answered with a screenshot of the swatch that already showed it | Second explanations are the defect. Show the thing, not a diagram of the thing. |
| A block comment written without its expression wrapper shipped as a **text node**: the source commentary was in the DOM and became the "label" an audit aligned an icon against | A text walk sees source that leaked into the page. The wrong label produces the wrong finding — fix the leak, then re-judge. |
| A dialog was portalled onto the document during render, so every page failed a server render with "document is not defined" while the build and the browser were green | A build is not a screen, and a browser is not a server. Render only where the target exists. |
| A breakpoint gate failed on two media widths that had been added with no reason beside them; the fix was to write the reason into the register, not to change the layout | A width is a deliberate act. The gate is a conversation, not a wall — and the answer is a reason, not a workaround. |

---

## 11. Five sentences to remember

* **A screenshot cannot see a rule** — so measure the rule, and commit the instrument.
* **If a block repeats what another says, delete it** — overwhelmingness is always addition.
* **One action, one name, one glyph, one shape, one place** — every "inconsistent" report is that
  sentence failing somewhere you have not looked yet.
* **Fix the component, not the screen** — a fix that names a screen will be reported again on the next
  one.
* **A number that moved without an order is a regression** — record before, re-measure after, and never
  round a pass up.
