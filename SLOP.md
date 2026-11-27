# SLOP.md

The VibeBrass field guide to what not to do.

This copy belongs to OVVO. The rules are company-wide. The local audit at section 5 is specific to this repository.

This is not a mood board and it is not a list of things that are unfashionable. It is a list of patterns that make work look generated, careless or dishonest. Read it before you add a section, a card, a label or a sentence.

The short version: if a stranger could swap the product name and the page would still make sense, it is slop. If a pattern is there because every other site has it, it is slop. If a sentence sounds like it was written to fill space, it is slop.

## 1. The one question

Every page, card, label and sentence has to answer one question:

> What does this tell the reader that only this product can tell them?

If the answer is nothing, it is slop. Slop is not the same as ugly. Ugly can be a decision. Slop is the absence of a decision: the default font, the default card, the default claim, the default rhythm.

The second question is the swap test:

> If I changed the product name, would this still make sense?

If yes, the page is generic. Generic is the raw material of slop. The fix is not more decoration. The fix is a fact, a place, a constraint, a number, a name or a trade-off.

## 2. The visual tells

The research is consistent across large samples. These are not one person's taste. They are measured patterns.

| Tell | Share of sites | Source |
| --- | --- | --- |
| A default typeface | 57% | Anti Web Slop, 509 sites |
| Template dark mode | 35% | Anti Web Slop, 509 sites |
| No image for sharing | 28% | Anti Web Slop, 509 sites |
| The same rounded corners | 27% | Anti Web Slop, 509 sites |
| Google Fonts as the whole voice | 26% | Anti Web Slop, 509 sites |
| Uppercase kickers | 22% | Anti Web Slop, 509 sites |
| No images of its own | 21% | Anti Web Slop, 509 sites |
| Identical card grids | 20% | Anti Web Slop, 509 sites |
| Scroll fade-ins | 20% | Anti Web Slop, 509 sites |
| Lucide icons | 19% | Anti Web Slop, 509 sites |

A second sample of 120 AI-built pages found the same shapes at higher rates:

| Tell | Share of pages | Source |
| --- | --- | --- |
| Icon feature cards | 63% | Build to Launch, 120 pages |
| Lucide-only icons | 63% | Build to Launch, 120 pages |
| shadcn defaults | 61% | Build to Launch, 120 pages |
| Inter | 60% | Build to Launch, 120 pages |
| One accent word in the headline | 52% | Build to Launch, 120 pages |
| Centred hero | 51% | Build to Launch, 120 pages |
| Pill above the headline | 51% | Build to Launch, 120 pages |
| Scroll fade | 51% | Build to Launch, 120 pages |
| AI-style icons | 47% | Build to Launch, 120 pages |
| Tiny uppercase labels | 42% | Build to Launch, 120 pages |

One tell is not a crime. Ten tells together are a signature. The job is not to avoid every item on this list. The job is to know why you are using it.

### 2.1 Colour

Do not:

- Use a purple, indigo or violet gradient as the default "tech" surface.
- Put a gradient inside the text.
- Use neon on near-black as the default because dark mode looks premium.
- Add glow orbs, blurred blobs or aurora backgrounds behind a hero.
- Make every card glass, whether or not something moves under it.
- Use warm cream as the default tasteful surface for every product.
- Use the same accent on every button, icon, link, border, chart and badge.
- Use more than three surface colours and more than two accents on one page.
- Use red, amber and green as decoration when they do not mean error, warning and success.
- Ship dark mode as an inverted colour swap with no contrast check.

Do:

- Choose the palette from the product's own world: a place, a material, a photograph, a screen.
- Keep one accent. If a second colour is needed, make it a neutral or a semantic colour with a job.
- Measure contrast against the actual surface. Do not estimate.
- Keep the brand paper for the company. Let product surfaces keep their own canvas.
- Use a gradient only when it describes something real, such as a spectrum, a map or a photograph.

### 2.2 Type

Do not:

- Use Inter, Plus Jakarta Sans, Space Grotesk, Instrument Serif or Fraunces as the whole voice.
- Put one italic serif word inside a bold sans headline and call it editorial.
- Use six faces on one page.
- Set body text with negative tracking.
- Set functional labels at 8px, 9px or 10px.
- Put a tracked uppercase kicker above every heading.
- Set body copy in all caps.
- Give every heading the same size and weight.
- Combine a serif italic, small caps and section numbers to manufacture heritage.
- Centre body paragraphs.
- Use a display face for a table, a form or a paragraph longer than a line.

Do:

- Choose one display face, one text face and, only if the product needs it, one mono face.
- Use 11px as the absolute floor for functional text. Use 12px where the label is read. Use 16px for body.
- Use sentence case. Uppercase is for short labels, not for sentences.
- Use one italic accent per page at most. One accent is a voice. Ten are a costume.
- Use three weights at most. If the hierarchy needs a fourth, the layout is not doing its job.
- Test the type at 390 before you test it at 1440.

### 2.3 Layout

Do not:

- Build a centred hero with a pill above the `h1`, two buttons, a logo row and a product mockup.
- Repeat three identical feature cards with an icon, a title and two lines.
- Build a bento grid with numbers that do not mean anything.
- Number sections 01, 02, 03, 04 when there is no order.
- Put an eyebrow above every section.
- Put a 3px side-tab border on a notice.
- Put a border and a shadow on the same card.
- Nest cards inside cards.
- Build a stat strip with four numbers and no context.
- Draw a two-axis grid behind a hero because it looks technical.
- Add a marquee.
- Add an infinite logo carousel.
- Put a blurred sticky header on a static page.
- Draw a fake dashboard with invented metrics.
- Make the whole page one column of centred sections with the same rhythm.

Do:

- One idea per section. Let the section end when the idea ends.
- Vary the shape with the content. A list is a list. A table is a table. A picture is a picture.
- Use a number only when it answers a question or gives an order.
- Use a grid only when the content is a grid: a map, a catalogue, a schedule, a comparison.
- Use one edge per surface. A border or a shadow, not both.
- Use a card only when the content is a discrete object. Do not use a card as a page wrapper.
- Test the page at 390 and 1440. If it only works at one width, it is not finished.

### 2.4 Components

Do not:

- Put a pill above the headline because the template has one.
- Use pill buttons for everything.
- Use toggle switches as decoration.
- Use a segmented control with three options when one is enough.
- Use tabs that hide the only content on the page.
- Use an accordion for three short paragraphs.
- Put a tooltip on a label that already says what it means.
- Add a badge with a dot for "live" when nothing is live.
- Use emoji as icons.
- Use untouched Lucide icons at 24px and call it an icon system.
- Ship shadcn defaults with no token changes.
- Use a toast for a state that should be inline.
- Use a modal for a sentence.

Do:

- Use the simplest control that does the job.
- Use native controls where they are good enough.
- Use one icon set. Draw the icons or choose them for the product.
- Use a badge only when the state changes what the reader does.
- Keep a state where the reader is looking. Do not move it to a toast.
- Make every interactive target at least 44px on a phone.

### 2.5 Motion

Do not:

- Fade everything up on scroll.
- Put a spring, bounce or elastic easing on every sheet and toast.
- Add a cursor glow.
- Add parallax for its own sake.
- Animate a number counter on view.
- Make text type itself.
- Add a blinking cursor.
- Add a pulsing status dot.
- Autoplay video with sound.
- Animate a page that has no state change to explain.

Do:

- Use motion to explain a change: where something came from, where it went, what is now selected.
- Keep UI motion between 150ms and 250ms.
- Use ease-out. Spring is for one deliberate playful moment, not the default.
- Respect `prefers-reduced-motion`.
- Keep one deliberate motion moment per page. The rest should be quiet.

### 2.6 Imagery

Do not:

- Use stock photographs of people at laptops.
- Use AI-generated people with smooth faces and no context.
- Use 3D blobs, spheres or abstract shapes as the only visual.
- Use a fake app screenshot with fake numbers.
- Put a "live" dot on a drawing.
- Hotlink an image you do not own.
- Bake text into an image where it cannot reflow.
- Use an image that has nothing to do with the product because it is the right colour.

Do:

- Show the real product, the real place, the real texture or the real person.
- If it is a drawing, label it as a drawing.
- If it is a mockup, say so.
- Own the file. Put it in the repository.
- Write alt text that says what the image shows, not what it is called.

### 2.7 Metadata and the unglamorous parts

Do not:

- Ship a page with the title "Home".
- Ship with no description.
- Ship with no `og:image`.
- Ship with no canonical URL.
- Ship with no favicon.
- Ship with no `lang`.
- Ship with no focus state.
- Ship with no reduced-motion path.
- Ship with no 44px target.
- Ship with no alt text.
- Ship with no 404 page.
- Ship with no loading state.
- Ship with no empty state.
- Ship with no error state.

Do:

- Write the title and description as if they are the only thing a reader will see.
- Make a 1200x630 share image. Test it in a real share preview.
- Add the canonical URL.
- Add the icon and the manifest.
- Add the language.
- Make focus visible and make it match the brand.
- Add reduced motion.
- Make the targets big enough for a thumb.
- Write the alt text.
- Design the 404, the loading state, the empty state and the error state.

## 3. The copy tells

Copy is where slop is easiest to spot and hardest to excuse. A visual pattern can be a deliberate reference. A sentence that fits any product is a decision not to write.

### 3.1 The em dash rule: zero

The character U+2014 is banned in VibeBrass work. That is the mark that is usually called the em dash. Do not use it in UI copy, documentation, comments, commit messages, tests, README files, PDF exports, social posts or this file.

There is no "one is fine" exception. There is no "it is grammatical" exception. There is no "the source had one" exception. If you need to name the character, write "em dash" or "U+2014". Do not paste the glyph.

Why the rule exists:

- Pangram measured 2 em dashes per 10,000 words in human text and 17 per 10,000 words in AI text. That is about 10 times more often. The study is at https://www.pangram.com/signs-of-ai-writing.
- Adam Dunkels makes a related point in "It Isn't The Emdashes, It's The Words": the mark is less important than the vocabulary and the rhythm around it. The original title uses the character; this file does not. The article is at https://dunkels.com/adam/signs-your-text-was-written-by-an-ai.
- Jef van de Graaf argues that the em dash itself is not an AI tell, and that the real signal is overuse. That is a fair correction. The house rule is not a claim that the mark proves a machine wrote the text. It is a house rule, and overuse is exactly the habit we are removing. The article is at https://jefvandegraaf.com/signs-of-ai-writing.
- Graphite's 2026 study found that use varies by model: some models now use the mark less than humans, some use it at the human rate, and some have almost stopped. The mark is not a reliable detector. The rule is still zero because the founder wants it, because it is easy to check, and because it forces a better sentence. The study is at https://graphite.io/five-percent/research/ai-tells.
- The Conversation and FIU both describe the overuse pattern and the difficulty of detection. Detection is not the point. The point is the house style. The articles are at https://theconversation.com/too-many-em-dashes-weird-words-like-delves-spotting-text-written-by-chatgpt-is-still-more-art-than-science-259629 and https://news.fiu.edu/2026/why-does-ai-use-so-many-em-dashes-an-expert-explains.

What to use instead:

- A comma, if the clause is short.
- A colon, if the second part explains the first.
- A full stop, if the second part is a sentence.
- Brackets, if the aside is truly an aside.
- Two sentences, if the thought has two steps.

A hyphen is for compounds: "a 12px label", "a one-line fix". An en dash is for ranges, but in this house we write "11 to 12px" or "11-12px" with a hyphen. The em dash is for nothing.

Do not replace the character with a spaced hyphen or a double hyphen. That keeps the same rhythm and changes the key. Rewrite the sentence.

Before and after:

- Bad: "The app is fast [em dash] really fast [em dash] on any phone."
- Good: "The app is fast on any phone."
- Bad: "One line [em dash] the whole country."
- Good: "One line. The whole country."
- Bad: "It is not a feature [em dash] it is a platform."
- Good: "It is a platform."
- Bad: "Three themes [em dash] light, dark and cream."
- Good: "Three themes: light, dark and cream."
- Bad: "We built it for one person [em dash] the founder [em dash] and that is the point."
- Good: "We built it for one person: the founder. That is the point."

How to check:

```
grep -rn $'\u2014' .
```

The command above contains the escape sequence, not the glyph. It finds every U+2014 in the tree. If your shell does not support `$'...'`, use the Python scan in section 8.

### 3.2 The negation pivot

Do not write:

- "It is not X. It is Y."
- "Not a feature. A platform."
- "Not just a tool. A way of working."
- "This is not another dashboard."
- "We are not like the others."

Why it is slop: it invents a strawman, flatters the product and says nothing about what the product does. It is one of the most common generated rhythms.

Fix: say what it is. If the contrast matters, say who it is for and what it replaces. "A transit planner for the Netherlands" is stronger than "not another travel app".

### 3.3 The staccato triplet

Do not write:

- "Fast. Private. Yours."
- "Plan, compare, go."
- "Built for teams. Built for speed. Built for you."
- Three one-word sentences in a row.

Why it is slop: it sounds decisive and says little. It is a rhythm, not a thought. It is also one of the patterns in Pangram's data: triads appear about four times more often in AI text.

Fix: write one sentence with a subject and a verb. If the product is fast, say how fast and for what. If it is private, say what is not collected. Let the reader feel the pace from the content.

### 3.4 The rule of three

Do not:

- Use three adjectives because three sounds complete.
- Use three benefits because the template has three cards.
- Use three steps because three is a safe number.
- Use three examples when there are two.

Why it is slop: three is the safest shape in copy. It is often the shape of a thought that has not been finished. If there are two, use two. If there are four, use four. If the third item is only there for rhythm, cut it.

### 3.5 Generic claims

Do not use these words as the substance of a sentence:

- seamless, effortless, powerful, robust, scalable, secure, world-class, enterprise-grade, next-generation, cutting-edge, revolutionary, game-changing, state-of-the-art, best-in-class, industry-leading
- unlock, elevate, empower, supercharge, streamline, leverage, utilize, foster, enable, deliver, drive, transform, reimagine, revolutionize
- in today's fast-paced world, in the digital age, at the end of the day, when it comes to, it is worth noting, it is important to note, needless to say, let's dive in, in conclusion
- we believe, our mission, we are passionate
- trusted by teams at, loved by thousands, built for the modern team
- everything you need, all in one place
- AI-powered, as a feature

Why it is slop: these words fit any product. They are the sound of no decision. A reader cannot check them, picture them or remember them.

Fix: a number, a place, a name, a constraint, a trade-off, or a sentence a customer would actually say. "61 key stops, 41 services, 10 operators" is stronger than "seamless nationwide coverage". "Works offline" is stronger than "powerful".

### 3.6 Hedging and filler

Do not write:

- can help, may allow, is designed to, aims to, seeks to, we strive to
- it is important to, it should be noted that
- simply, just, easily
- and more, etc., and so on

Why it is slop: it weakens the sentence and hides the claim. "Can help" is not a promise. "Simply" is a warning that the next step is not simple.

Fix: say what it does. If it does not always do it, say when. If the list is long, give the categories instead of "and more".

### 3.7 The model voice

Do not write:

- Certainly, Great question, I hope this helps, Let me know if you need anything else
- As an AI
- Here is a breakdown
- In summary, Overall
- delve, tapestry, realm, landscape, testament, pivotal, crucial, intricate, meticulous, vibrant, holistic, synergy, paradigm, embark, endeavor, multifaceted, catalyze, juxtapose, nuanced

Why it is slop: these are the fingerprints of a model, not a person. They are the words that appear when the writer has no specific thing to say.

Fix: write the sentence you would say out loud. Read it back. If you would not say it to a colleague, cut it.

### 3.8 Structure tells

Do not:

- Make every paragraph exactly three sentences.
- Make every sentence the same length.
- Give every section a heading, a lede, three bullets and a call to action.
- Start every bullet with a verb.
- Make every heading a question.
- End every page with "Ready to get started?".
- Bold every other phrase.
- Use emoji bullets.
- Put Markdown in plain text.
- Add a "TL;DR" to a page with no long text.
- Use a table for two facts.
- Quote a person who does not exist.

Why it is slop: the shape is doing the work the content should do. A page with the same rhythm in every section is a template with the words changed.

Fix: vary the length. Let one section be one sentence. Let one section be a list because it is a list. Let one section be a picture. Read the page aloud and listen for the metronome.

### 3.9 The honesty test

Before a sentence ships, ask:

- Can I name the person, the place, the number, the date or the constraint?
- Is the product live, or am I drawing it?
- Is the board connected, or am I drawing a live dot on it?
- Is this a real customer, or a logo I did not ask?
- Is this a real metric, or a number I invented for the layout?

If the answer is "I made it up for the layout", delete it. The brand landing gets this right: what is live is live, what is built has no address, the board is recorded and not connected, and the sand drawing is a drawing. That is the opposite of slop.

## 4. The house rules

- Palette: brand paper for the company. Product surfaces keep their own canvas. One accent. Measure contrast. No gradient text. No purple default.
- Type: one display, one text, one mono. 11px floor. 16px body. Sentence case. One italic accent at most.
- Spacing: 4, 8, 12, 16, 24, 32, 48, 64. No 5px. No cramped padding. No nested cards.
- Breakpoints: 390, 720, 1040, 1440. Test both ends. No desktop-only sheet.
- Copy: no em dash. No negation pivot. No staccato triplet. No rule of three for its own sake. No generic claim. No fake data. No invented product. No fake live state.
- Motion: 150ms to 250ms. Ease-out. Respect reduced motion. One deliberate moment.
- Metadata: title, description, canonical, `og:image` at 1200x630, Twitter card, icon, manifest, `lang`.
- Accessibility: 4.5:1 for body, 3:1 for large text, 44px targets, visible focus, alt text, heading order, no colour-only meaning.
- Performance: no 3MB hero, no blocking font, no layout shift, no autoplay.
- The delete rule: if you cannot say why it is there, delete it.

## 5. Local audit: OVVO

OVVO is the transit app. The audit found 172 detector anti-patterns, but most of them are in the design sheets, not the shipped app. The app findings are O1 to O6, with O7 cleared. The design-sheet findings are OD1 to OD4. The token system is real. The problem is the layer above it: the theme grid, the card accents, the spring motion and the share card.

### 5.1 The state

| Surface | Count | What remains |
| --- | --- | --- |
| OVVO app | 172 detector anti-patterns | 48 overused-font hits; 6 app findings; most of the count is in the design artifacts |
| Design sheets | OD1 to OD4 | Theme labels at 1.1:1 to 1.3:1; corner labels at 3.4:1 and 10px; a 9px share-card name at 2.7:1; a cream share card |

### 5.2 Do not bring back

| Tell | Where it was | Why it is slop | What to do instead |
| --- | --- | --- | --- |
| 4px, 5px and 6px top accent borders on rounded cards | `wrapped-extras.css:2520`, `:3110`, `:3158` | A thick stripe on a rounded corner is a default "featured" treatment. It fights the radius. | Use a hairline, a background tint, or nothing. |
| Four spring easings | `components.css:5202`, `:5407`, `tokens.css:322`, `:344` | Bounce on a settings sheet or a toast makes the UI feel toy-like. | ease-out-quart, quint or expo. Keep spring for one deliberate moment. |
| Wrapped gradients and glows outside Wrapped | Home, Plan, Settings | The effect belongs to one annual feature. Outside it, it is costume. | Keep it inside Wrapped. |
| "Network at a glance" | `src/lib/i18n.ts:849` | "At a glance" is a generic dashboard phrase. | "Network overview" or "The network". |
| 28 theme cards in one uniform grid, as the whole page | Theme catalogue | A catalogue is allowed a grid, but the grid is not a hierarchy. | Give the selected theme more space, or group the shelves more clearly. |
| Plus Jakarta as the only voice | `src/styles/tokens.css:289`, `src/lib/styles.ts:48-53` | It is the most common face in the research, and it carries 48 hits. | One distinctive display face, one text face. Keep Jakarta only as a fallback. |
| 9px `OVVO`, `#8e8e93` on `#e9e9eb` at 2.7:1, a nested card, and the name three times | `design/share-card/index.html:284`, `:321` | The share card is the first impression and it has the smallest type. | 11px floor, 4.5:1, one card, the name once. |
| Theme labels in black on dark tiles at 1.1:1 to 1.3:1 | `design/style-scenes.html:140-590` | The label disappears on its own theme. | Make the label ink follow the theme surface, or put every label on a fixed light strip. |
| `#8a8478` on `#f7f5ef` at 3.4:1, 46 low-contrast instances, 49 labels at 10px | `design/corners-gallery.html:133` | The gallery is a reference sheet, so the labels have to be readable. | Darken the ink, raise it to 11px, and re-check every tile. |
| Cream share card | `design/share-card/index.html` | `rgb(247,245,239)` is the default tasteful AI surface. | Use the app canvas, or a colour taken from the card image. |

### 5.3 What is deliberate and should stay

- The documented token system, the measured contrast comments and the zero-blur elevation rule.
- 44px targets and reduced-motion support.
- The build that audits text, styles, corners, classes and breakpoints.
- 28 themes as a real product feature. A theme picker is allowed to be a catalogue.
- The app's own canvas and the settings sheets as product UI. They are not marketing pages.
- The large colour field in the picker. It is the tool.
- Wrapped's gradients and glows inside Wrapped. That is an art direction for one feature, not a default.

### 5.4 What is still open

O1 to O6, OD1 to OD4, the 28-theme contrast sweep, and the share card. O7 is cleared.

### 5.5 The evidence

`review/colours-after/colour-screen.png` and `review/colours-after/colours-photo-390-top.png` show the settings sheet:

- The 1440 shot is clean and spacious, but the uppercase `COLOURS`, `SPECTRUM` and `HEX VALUE` labels are the same tracked kicker pattern the brand pages removed. The page also leaves a large empty field below the hex input.
- The 390 shot shows the OVVO mark sitting behind the settings card at the top. The mark is clipped by the card. That is a real overlap at 390.
- The mobile shot also shows the pill toggles, the segmented Cream/Colour/Photo control, the glass "GLASS" button and the bottom navigation. These are functional in the app. They are not a template for a marketing page.
- I looked at both images. They are a settings sheet, not a full app walkthrough.

### 5.6 What was not checked

- All 28 themes, one by one.
- The actual share-card render.
- The app at 720 and 1040.
- The keyboard path through the theme picker.
- The contrast of the theme labels after the OS dark mode is applied.

## 6. The pre-ship checklist

Copy:

- [ ] No U+2014 anywhere. Run the scan in section 8.
- [ ] No negation pivot. Say what it is.
- [ ] No staccato triplet. Write a sentence.
- [ ] No rule of three for its own sake.
- [ ] No generic claim. Name a number, a place, a person or a constraint.
- [ ] No invented metric and no fake live state.
- [ ] Read it aloud. If you would not say it, cut it.

Type:

- [ ] One display, one text, one mono.
- [ ] No functional text below 11px.
- [ ] Body at 16px.
- [ ] Sentence case, except short labels.
- [ ] One italic accent at most.
- [ ] No negative tracking on body text.

Colour:

- [ ] One accent.
- [ ] No gradient text.
- [ ] No purple default.
- [ ] Contrast measured against the real surface.
- [ ] No glass on a static card.
- [ ] No cream by accident.

Layout:

- [ ] No kicker above a heading.
- [ ] No 01 to 04 without an order.
- [ ] No three identical cards.
- [ ] No border and shadow on the same surface.
- [ ] No nested cards.
- [ ] No stat strip without context.
- [ ] No decorative grid.
- [ ] No marquee.
- [ ] Checked at 390 and 1440.

Components:

- [ ] One icon set.
- [ ] No emoji icons.
- [ ] No fake live dot.
- [ ] No pill for everything.
- [ ] Native controls where possible.
- [ ] 44px targets.

Motion:

- [ ] 150ms to 250ms.
- [ ] Ease-out.
- [ ] Reduced motion respected.
- [ ] No bounce on sheets.
- [ ] No cursor glow.
- [ ] No parallax for its own sake.

Imagery:

- [ ] Real product, real place or real texture.
- [ ] Drawing labelled as a drawing.
- [ ] Files owned by the repository.
- [ ] 1200x630 share image.
- [ ] Alt text.

Metadata:

- [ ] Title.
- [ ] Description.
- [ ] Canonical.
- [ ] Open Graph.
- [ ] Twitter card.
- [ ] Icon.
- [ ] Manifest.
- [ ] `lang`.

Accessibility:

- [ ] 4.5:1 body.
- [ ] Visible focus.
- [ ] Heading order.
- [ ] Keyboard path.
- [ ] No colour-only meaning.

Performance:

- [ ] No 3MB hero.
- [ ] No blocking font.
- [ ] No layout shift.
- [ ] No autoplay.

The final question: if I changed the product name, would this page still make sense? If yes, it is slop.

## 7. Sources

- Impeccable slop catalogue: https://impeccable.style/slop
- Impeccable docs: https://impeccable.style/docs
- Anti Web Slop, 509 sites measured: https://antiwebslop.com/en/guides/what-gives-away-ai-generated-websites
- Build to Launch, 120 AI-built pages measured: https://buildtolaunch.substack.com/p/fix-ai-slop-website-design
- Paralect, 21 signs of AI slop in design: https://www.paralect.com/blog/signs-of-ai-slop-in-design
- Carlo D'Agnolo, 30 AI design slop indicators: https://carlodagnolo.com/resources/posts/ai-design-tells
- Sophie Evans, how to tell if a website was made by AI: https://www.sophie-evans.com/blog/spot-an-ai-website
- SCALR, 20 signs a website was made by AI: https://scalr.sg/blog/20-signs-a-website-was-made-by-ai
- InterfaceKit, what makes a website look AI-generated: https://blog.interfacekit.io/what-makes-a-website-look-ai-generated
- Sailop, AI slop field guide: https://sailop.com/blog/ai-slop-2026-state-of-the-ai-generated-web
- Pangram, 9 signs of AI writing, with em dash rates: https://www.pangram.com/signs-of-ai-writing
- Adam Dunkels, "It Isn't The Emdashes, It's The Words": https://dunkels.com/adam/signs-your-text-was-written-by-an-ai
- Jef van de Graaf, 41 signs of AI writing, including the case against the em dash as a tell: https://jefvandegraaf.com/signs-of-ai-writing
- Graphite, AI tells and model-by-model em dash rates: https://graphite.io/five-percent/research/ai-tells
- The Conversation, on em dash overuse and detection: https://theconversation.com/too-many-em-dashes-weird-words-like-delves-spotting-text-written-by-chatgpt-is-still-more-art-than-science-259629
- FIU News, why AI uses em dashes: https://news.fiu.edu/2026/why-does-ai-use-so-many-em-dashes-an-expert-explains

## 8. How to check this file

This file is ASCII only. That is deliberate. It makes the em dash ban mechanical, not a matter of memory.

Run this from the repository root:

```
python3 - <<'PY'
from pathlib import Path

bad = []
for path in Path('.').rglob('*'):
    if not path.is_file() or '.git' in path.parts:
        continue
    try:
        text = path.read_text(encoding='utf-8')
    except (UnicodeDecodeError, OSError):
        continue
    for number, line in enumerate(text.splitlines(), 1):
        for column, character in enumerate(line, 1):
            if ord(character) > 127:
                bad.append((path, number, column, hex(ord(character))))
                break

if bad:
    for item in bad:
        print(f'{item[0]}:{item[1]}:{item[2]} {item[3]}')
    raise SystemExit(1)
print('ASCII only')
PY
```

For this file alone:

```
python3 - <<'PY'
from pathlib import Path

text = Path('SLOP.md').read_text(encoding='utf-8')
bad = [(i, hex(ord(c))) for i, c in enumerate(text) if ord(c) > 127]
if bad:
    print(bad[:20])
    raise SystemExit(1)
print('SLOP.md is ASCII only')
PY
```

For a direct search for the banned character:

```
grep -rn $'\u2014' .
```

Then:

```
git diff --check
```

If the repository has the detector, run it:

```
npx impeccable detect .
```

The detector is a second opinion, not the rule. A page can pass the detector and still be slop. The questions in section 1 and the checklist in section 6 are the rule.
