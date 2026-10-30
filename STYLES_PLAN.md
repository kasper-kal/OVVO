# STYLES_PLAN

Status: **planning only. Nothing here is built yet.**

---

## 1. What was said, verbatim

The brief:

> We will add a MASSIVE change to "Colours" currently if your able to choose from anything, there will deffo be issues, mostly contrast issues. Which is why we will be replacing Colours with "Styles" im thinking ~20 premade styles, different fonts, different colours, etc. No, we will NOT do this yet, but we WILL he planning it now.

On this file:

> Make sure to create a file and put my answers in it verbatim + turn them into an action plan.

The answers:

> 1. How DARE you make me repeat myself, i said 20, MINIMUM. 2. What do you mean? 3. No, not system stacks only. 4. Yes, it does, were gonna get rid of it. 5. What do you mean? 6. Yes. 7. I want one Navy blue + gold with a luxury font, etc. A light blue colour, #DFE8F2 to be exact with a poppy, modern font, and a lot more. Give me ideas and ill tell you yes or no

And on photographs:

> I also want some styles with photos as a background (with a super battery saving mode failover) summarized the 40 options for me.

> With "i also want some styles with a photo" i meant that the photo is tied to the style. With "were gonna get rid of photo backgrounds" i meant that users Arent able to add photos themselves. Instead theyre tied to the style.

---

## 2. What "Colours" is today

Three rows in Settings, each opening a screen or a sheet: the page's background (cream, a colour of your choosing, or a photograph you supply), the primary colour every widget is painted with, and the colour selected text is painted with. Each row offers swatches, a saturation pad, a hue slider, a hex field, the device's own colour dialog, and (when a photo exists) a sampler that pulls a colour out of the picture. Every answer is stored twice, once for light and once for dark, and the ink ramp has to make readable text out of whatever was chosen.

That last part is the source of the contrast complaints: an ink ramp can only do so much with a mid grey, and the map, the tinted pills, the hairlines and the accent inks each need a different amount of contrast from the same colour.

---

## 3. The shape of the replacement

**Settings > Styles**, top level, replacing the Colours card. **Twenty styles at the very least.** A style is a whole answer, not a colour: page, cards, accent and its ink, hairlines, tinted pills, selection colour, a font pairing, and optionally a photograph, in both appearances. There is no picker behind it.

The rule that ends the contrast problem: **the traveller picks a look, so every ink is authored for the surface it sits on instead of being calculated from a colour somebody chose.**

### 3.1 What a style owns

| Token group | What the style decides |
| --- | --- |
| Canvas | page colour for light and dark |
| Surfaces | card, raised card, sidebar |
| Structure | main ink, secondary ink, muted ink, faint ink |
| Edges | hairline, hairline-strong |
| Accent | accent colour, accent ink (readable on the surface), accent hover, accent border |
| Tints | sage, butter and coral tint backgrounds and their inks |
| Selection | the colour selected text is painted with, and the ink on it |
| Type | the display face and the UI face, and heading tracking |
| Chrome | `theme-color` for the browser and the installed app |
| Photo | optionally: an image, a scrim, a card treatment, and the solid colour it falls back to, which is a background in its own right |

Not in a style: geometry. Radius, spacing, density and motion stay the app's own, unless question A in section 7 says otherwise.

### 3.2 Photographs come with a style, and are never uploaded

**Changed by the order: nearly every style carries both a photograph and its own colour, not ten.** The folder is `public/style-photos/`, the file is named after the style id, and the Background row appears on every style except **Contrast** and **Night AA**, which stay flat as the plainest reading answer. The paragraphs below still describe how a photograph behaves; read "a style that has one" wherever they say "the ten".

Confirmed: a photo belongs to the style. The traveller cannot add one, crop one, or sample a colour out of one any more. So the photo is authored like every other token: the style names its image, the scrim that keeps the ink readable over it, the card treatment (glass or tinted), and the solid colour the page becomes when the image cannot be drawn.

The subject of a photograph is **atmosphere, not a place**. A luxury look wants a sculpture in raking light with a lit arch above it, not a picture of a station. The picture sets the mood the ink sits on; the ink, the scrim and the fallback colour are authored around it.

What that removes: the file picker, the crop screen, the two stored copies of the image, the crop rectangle, the "from your photo" sampler, and the card treatment as a user setting (it becomes part of the style). What it keeps: `--app-bg-image` and the drawing path, now pointed at a file that ships with the app instead of one in storage.

**The failover, in the order it applies:**

1. **Super saving (10% and under)**: no image at all. Not fetched, not drawn, not held in memory. The page is the style's fallback colour, the cards are solid, and the ink is the same authored ink. This is the point of a saving mode, and a full-bleed photograph is the most expensive thing the interface can draw.
2. **The image was never downloaded and there is no network**: the fallback colour, exactly as in super saving.
3. **A device that measured as slow**: the fallback colour, same reasoning, without waiting for the battery to fall.
4. **Everything else**: the photograph, with its scrim, and its cards in the style's own treatment.

Nothing about the layout changes in any of those four cases. The header, the cards and the text sit where they always sit; only what is painted behind them changes. A traveller who switches to super saving mid-session sees the photograph leave and nothing move.

**And every photo style can be worn as its colour instead.** A style that can only ever be a photograph is a style you cannot use in a dark room, on a train, or on a screen you would rather keep quiet. So all ten carry two backgrounds: the photograph, and their own solid colour. The traveller picks.

- **Where it lives**: on the Styles screen, selecting a photo style brings one extra row underneath, **Background**, with two segments: **Photograph** and **Colour**. That is the whole control. There is no colour picker, because both answers belong to the style.
- **Remembered per style**: Marble set to Colour stays colour when you visit Arches and come back. Stored as a small list of style ids whose photograph is switched off.
- **The saving modes win**: super saving, a missing image with no network, and a device measured as slow all force the colour background whatever the switch says, and the row says why rather than quietly disagreeing with itself.
- **Both variants are audited**, so the colour version is not the version nobody looked at: the photograph is checked against its scrim, and the colour is checked as a plain palette.

**What a photo style ships**: one AVIF with a WebP fallback, 1600px on the long edge, budget about 150KB per style. It is fetched only when that style is in force, never preloaded, and cached by the service worker so the second visit costs nothing.

### 3.3 Fonts are downloaded, not borrowed from the device

Confirmed: not system stacks only. So:

- Each style names a **display face** and a **UI face**, picked from a shortlist of roughly ten families, so forty-eight styles do not mean forty-eight downloads.
- Self-hosted `woff2`, subset to Latin and Latin Extended (Dutch needs the accents), `font-display: swap`, cached by the service worker.
- **Only the chosen style's two faces are fetched.**
- The cost is measured on a throttled CPU before this ships. If a pairing pushes the first screen past the budget, that pairing changes.
- A local fallback stack sits behind every `@font-face`, so a browser that refuses the download still draws the right shape of page.

### 3.4 What happens to the old settings

- `styleId` is added. A browser that has never chosen a style gets the default.
- A browser that had customised colours or a photograph gets the style closest to what it chose, worked out once during migration by colour distance, so nobody's page changes on the day this ships.
- The old colour and photo fields stay in storage **untouched for one version**, so a rollback loses nothing. Nothing reads them.

### 3.5 What gets removed

- The hex field, the saturation pad, the hue slider, the selection swatches, the custom selection colour, "Pick your own".
- The Background colour row and the Primary colour row.
- The user photo flow: file picker, crop screen, source copy, crop rectangle, sampler, the card treatment control.
- `ColourScreen`, `PhotoScreen`, `PhotoCropScreen`, `lib/photoCrop.ts`, and the parts of `lib/background.ts` and `lib/colour.ts` that only served a colour somebody chose.

### 3.6 Where the images come from

This is a personal site with one user, and it will be hosted locally once testing is done, so copyright is not the question here. The real questions are where a file comes from, and how it gets into the repo.

**Three ways in, in the order I would use them:**

1. **A picture you have in mind.** If you see the image and it fits the style, that file is the style. Nothing beats a picture chosen on purpose.
2. **Free stock, downloaded once.** Unsplash and Pexels are the practical source for mood and texture photography: stone, fabric, smoke, out of focus lights, architecture in low light. I fetch the file, convert it, and commit it.
3. **A photo style ships without its photo.** Until a real file exists it draws its fallback colour, and its preview in the picker shows that colour. Nothing is invented, and nothing points at a hotlinked URL.

**The rules, so this cannot rot:**

- **Every image is a file in the repo**, never a link to somebody else's server. A hotlinked background breaks when that server changes, and the service worker cannot cache a file it was never given.
- **One line per file in CREDITS.md**: where it came from, when it was fetched, and which style uses it. Not for legal reasons, for the practical one: any of them can then be swapped without hunting through the code.
- **A build check**: styles-audit fails if a photo style names a file that is not in the repo. A missing image is a build error, never a page with a hole in it.
- **One size, one conversion**: 1600px on the long edge, AVIF with a WebP behind it, budget about 150KB per style, converted once and committed. Nothing is resized at runtime.


**What I checked, rather than assumed:** a 1600 by 900 photograph downloads in one request (64KB for a JPEG at that size, so the 150KB budget is real), and this workspace has no image converter installed, so `sharp` joins the dev dependencies when phase 2 starts, or the conversion is done once on this machine and the output committed. Either way nothing is resized in the browser.

### 3.7 How a picture gets into a style

The handoff, in four steps, so neither of us has to guess:

1. **You search Pinterest** with one of the term sets below, and pick the picture.
2. **You send me the file.** Original, any size. Portrait helps on a phone, but landscape is fine, because I crop for the screen it is drawn on.
3. **I do the rest**: crop to 1600px on the long edge, convert to AVIF with WebP behind it, sample the brightest and the darkest corners, set the scrim from those samples, pick the ink and the fallback colour, and put one line in CREDITS.md.
4. **I show it to you in the preview** on the home screen, the boards and settings, in light and dark, and only then does it become that style's photograph.

What makes a picture good for this, in one line each: no text in it, no faces looking at the camera, a clear dark side and light side rather than even grey, and enough resolution that 1600px is not a stretch.

**Search terms per style.**

- **Marble**: neoclassical sculpture black and white, marble statue dark aesthetic, sculpture chiaroscuro photography, plaster bust moody lighting.
- **Arches**: baroque dome ceiling dark, architectural arches shadow black and white, cathedral ceiling low angle, stone arcade chiaroscuro.
- **Plaster**: plaster bust side light, white sculpture studio light, alabaster statue soft light, antique bust minimal background.
- **Silk**: dark silk fabric folds, satin drapery dark aesthetic, charcoal fabric texture, velvet curtain low light.
- **Ember**: smoke texture black background, burnt paper texture macro, ember glow dark texture, charcoal texture warm.
- **Frost**: white marble veins close up, calacatta marble texture, pale stone texture minimal, alabaster surface macro.
- **Graphite**: brutalist concrete architecture black and white, concrete wall hard light, monolith architecture minimal, concrete staircase brutalist.
- **Lacquer**: black gloss reflection photography, piano black surface light streak, lacquer texture dark gold, black marble gloss macro.
- **Bokeh**: city lights bokeh night, night street bokeh dark aesthetic, headlights bokeh long exposure, blurred lights city rain.
- **Grain**: paper texture close up macro, linen weave texture macro, letterpress paper grain, cream paper fibre.

---

## 4. How the contrast problem is solved for good

This is the point of the change, so it is a gate, not a promise.

1. **Authored pairs.** Every ink is written against the surface it is drawn on. No ink is computed from a user colour at runtime.
2. **A build gate.** `scripts/styles-audit.mjs` walks every style, both appearances, and every pair the interface draws (body ink on card, muted ink on canvas, accent ink on accent, tint ink on tint, hairline on card, dock ink, map ink) and fails the build on any pair under **4.5:1 for text** and **3:1 for large text, icons and edges**.
3. **Photo styles are measured twice.** Each names a scrim, and the audit composites the ink against that scrim over the brightest and the darkest sampled points of the image; if either sample fails, the scrim changes, not the ink. The same style is then measured as its colour variant, as a plain palette, because both are backgrounds the traveller can actually wear.
4. **A rendered gate.** Every style on six screens at 390 and 1440 in both languages, reading computed colours from the live DOM, so a component that hard-codes a hex is caught too.
5. **A `Contrast` style** ships as the AAA answer, and `highContrast` still stacks on top of any style.

---

## 5. Action plan

**Phase 0: decisions** (section 7)

**Phase 1: the registry, no UI**
- `src/lib/styles.ts`: the `Style` type, every style, `tokensFor(style, appearance)`, and the photo fields.
- Point the CSS variables at the active style so every screen draws from the registry.
- `scripts/styles-audit.mjs`, wired into `npm run build`.

**Phase 2: the settings surface**
- `Settings > Styles` at top level, replacing the Colours card: a grid of preview cards (page, card, accent, the style's own type, its name, and a sliver of its photograph if it has one), grouped, the current one marked.
- Selecting applies instantly.
- A photo style brings one extra row: **Background**, Photograph or Colour, remembered per style.
- Names and one-line descriptions in English and Dutch.

**Phase 3: removal and migration**
- Delete the colour rows and the user photo flow listed in 3.5.
- `migrateSettings` maps old colours and old photos to the nearest style once, and bumps `SETTINGS_VERSION`.
- Update every audit and screenshot script that names a colour or photo setting.

**Phase 4: verify**
- The full rendered gate, every style, both appearances, six screens, two languages.
- The four failover cases on a photo style: super saving, no network, slow device, normal. The page must not move between them.
- Both backgrounds of every photo style, the image and the colour the switch gives, through the full rendered gate.
- Super saving draws no image and makes no request for one.
- The installed app's theme colour follows the style.
- The old phone check (iOS 10 syntax, throttled CPU) still passes with the new fonts, and the font and image costs are measured, not assumed.

---

## 6. Risks

- **A lot of styles is a lot of palettes.** Every style is another pair of appearances to author, name and eyeball at 390.
- **The map and the pills** derive their ink from the tint today; each style needs authored values for them or they drift.
- **Fonts and photographs are now a cost**, roughly 150KB each per style, fetched only when used.
- **Photo styles are the hardest to keep readable**, because a photograph has a light corner and a dark corner.
- **Migration is visible**: somebody with a custom blue page lands on the nearest style.

---

## 7. Decisions taken, and the two still open

### Taken

1. **Twenty is a floor, not a target.**
2. **Fonts are real, downloaded fonts.**
3. **Photographs belong to styles.** No uploads, no cropping, no sampling.
4. **Styles replaces the Colours card in place, as a top level section.**
5. **Every photo style can also be worn as its colour.** One switch, remembered per style, and the saving modes still force the colour.

### Still open

**A. Does a style change the app's shape as well as its colour and type?**
Shape means the corner roundness, the space between rows and the shadows. Today the app has one geometry written into the stylesheet: 28px cards, 4px spacing steps, 44px targets, no shadows. Allowing shape means three or four more settings per style per appearance, and a second thing to eyeball on every screen. Recommendation: colour, type and photograph only.

**B. Does one control stay outside the style?**
An escape hatch would be one setting that survives whatever style is picked, for example an accent-only override. Without one, the traveller picks a style and changes nothing about it, which is what kills the contrast problem, because every colour on screen then belongs to an authored pair. The accessibility switches (high contrast, reduce motion, density) stay outside either way. Recommendation: no escape hatch.

---

## 8. Style candidates, waiting on a yes or no

Light appearance's page and accent unless noted. Font pairs are display plus interface.

**Luxe**

1. **Navy and Gold**. Page `#F4F1EA`, accent `#0F1B2D`, gold `#C8A96A`. Cormorant Garamond with Inter.
2. **Emerald and Brass**. Page `#F2F4EF`, accent `#0E3B2E`, brass `#B08D3C`. Playfair Display with Inter.
3. **Oxblood**. Page `#F3E9DC`, accent `#6B1F2A`. Lora with Work Sans.
4. **Midnight Silk**. Page `#12101A`, accent `#D6C7A1`. Instrument Serif with Inter.
5. **Bordeaux**. Page `#F7EFE9`, accent `#3A121C`, gold `#C9A227`. Cormorant Garamond with Figtree.
6. **Pearl**. Page `#FAF7F2`, accent `#1F2933`, silver `#9AA5B1`. Fraunces with Inter.

**Modern and poppy**

7. **Poppy Blue**. Page `#DFE8F2` exactly, ink `#0F1D2B`, accent `#FF4D2E`. Space Grotesk with Inter.
8. **Ultraviolet**. Page `#F1ECFF`, accent `#5B21B6`. Manrope with Inter.
9. **Cyber Teal**. Page `#E3FBFA`, accent `#00726C`. Space Grotesk with Inter.
10. **Citrus Pop**. Page `#FFF7D6`, accent `#E2571E`. Bricolage Grotesque with Outfit.
11. **Bubblegum**. Page `#FFE9F1`, accent `#C2185B`. Sora with Inter.
12. **Electric**. Page `#F2FFE9`, accent `#2F7A00`. Outfit with Inter.

**Editorial**

13. **Broadsheet**. Page `#FAF8F3`, accent `#9B1B1B`. Newsreader with Inter.
14. **Salon**. Page `#FFFDF8`, accent `#8C6A3F`. Libre Baskerville with Work Sans.
15. **Monocle**. Page `#F6F3EA`, accent `#1F4E5F`. Instrument Serif with Figtree.
16. **Literair**. Page `#FBF7EF`, accent `#2F4858`. Fraunces with Work Sans.

**Dutch and retro**

17. **Spoorboekje**. Page `#F7EFD9`, accent `#B33A2B`. Archivo with Inter.
18. **Rijksmuseum**. Page `#F2E9D8`, accent `#1B3A5C`, gold `#B08D3C`. Cormorant Garamond with Inter.
19. **1974**. Page `#F3E3C3`, accent `#C2410C`. Oswald with Inter.
20. **Station Sign**. Page `#FBF7EF`, accent `#003399`. Archivo with IBM Plex Sans.
21. **Polder**. Page `#E7EFE4`, accent `#2F6B4F`. Work Sans with Inter.
22. **Tram**. Page `#FFFFFF`, accent `#FF7E67`. Plus Jakarta Sans, which is the app today.

**Dark first**

23. **Nightbus**. Page `#0E1116`, accent `#FFB020`. IBM Plex Sans with Inter.
24. **Obsidian**. Page `#0B0B0C`, accent `#8FB8FF`. Inter.
25. **Deep Sea**. Page `#071A22`, accent `#37D3C4`. Sora with Inter.
26. **Ink**. Page `#141210`, accent `#E8E2D6`. Newsreader with Inter.

**Built for reading**

27. **Contrast**. Page `#FFFFFF`, ink `#000000`, accent `#0033CC`. Inter, AAA everywhere.
28. **Sunlight**. Page `#FFFDF0`, ink `#14110F`, accent `#7A1F00`. Archivo with Inter.
29. **Night AA**. Page `#000000`, ink `#FFFFFF`, accent `#FFD400`. Inter.

**Soft**

30. **Sage**. Page `#EEF3EC`, accent `#5A7A58`. Figtree with Inter.
31. **Linen**. Page `#F7F2EA`, accent `#A9734F`. Lora with Work Sans.
32. **Mist**. Page `#EDF1F5`, accent `#4A6C8C`. Manrope with Inter.
33. **Blush**. Page `#FDF0ED`, accent `#B4485C`. Fraunces with Inter.

**Loud**

34. **Vermilion**. Page `#FFF6F2`, accent `#E13B1A`. Bricolage Grotesque with Inter.
35. **Klein Blue**. Page `#F0F3FF`, accent `#002FA7`. DM Sans with Inter.
36. **Mustard**. Page `#FFFBEB`, accent `#A16207`. Outfit with Inter.
37. **Forest**. Page `#F2F7F1`, accent `#14532D`. Work Sans with Inter.

**Technical**

38. **Terminal**. Page `#0C0F0C`, accent `#7DFF8A`. IBM Plex Mono with IBM Plex Sans.
39. **Blueprint**. Page `#F4F7FB`, accent `#1D4ED8`. IBM Plex Sans with Inter.
40. **Signal**. Page `#FAF7F0`, accent `#C2410C`. Archivo with Inter.

**With a photograph** (each one also names the solid colour it becomes in super saving). The picture is atmosphere, not scenery: it sets the mood the ink sits on, and the style owns the scrim that keeps that ink readable over it. Each of these ten can also be worn as its colour, and the fallback below is exactly what that looks like.

41. **Marble**. A neoclassical sculpture in near black and white, arched stone above it, ivory ink, glass cards. Falls back to `#101010`. Cormorant Garamond with Inter.
42. **Arches**. A domed ceiling at the edge of darkness, gold accent, light ink. Falls back to `#0E0F12`. Playfair Display with Inter.
43. **Plaster**. A pale bust in side light, grey stone, dark ink on tinted cards. Falls back to `#E9E6E1`. Instrument Serif with Inter.
44. **Silk**. Dark fabric in folds, deep page, silver accent. Falls back to `#14131A`. Fraunces with Inter.
45. **Ember**. Smoke and burnt texture, amber accent, warm ink. Falls back to `#191310`. Playfair Display with Inter.
46. **Frost**. Pale marble veined with grey, cool page, slate ink. Falls back to `#EEF0F2`. Cormorant Garamond with Work Sans.
47. **Graphite**. Concrete architecture in hard light, steel accent. Falls back to `#1A1C1E`. Archivo with IBM Plex Sans.
48. **Lacquer**. High gloss black with one streak of light, gold accent. Falls back to `#0B0B0C`. Cormorant Garamond with Inter.
49. **Bokeh**. City lights out of focus at night, deep page, cool accent. Falls back to `#0B0F14`. Space Grotesk with Inter.
50. **Grain**. Paper fibre close up, warm page, a letterpress feel. Falls back to `#F4EFE6`. Fraunces with Inter.

The shortlist of families is what keeps the downloads sane: about ten families across fifty styles, so a browser fetches two font files and at most one image for the style it is using.

---

## 9. Where the answers live

Section 1 holds every answer word for word. Section 7 holds what each one means for the build. Section 8 is waiting on yes or no.
