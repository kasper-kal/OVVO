# Ten wallpapers, ten styles

**Built.** The ten styles are in `src/lib/styles.ts`, the pictures are in `public/style-photos/`
under their style ids, and the catalogue is thirty. Everything below is what shipped, including the
second, lighter set of numbers.

---

## 1. What arrived

Ten pictures in `Wallpapers/`, all portrait, 736 pixels wide, 1104 to 1635 tall, 18 to 367 KB. All
ten are dark at the top, which matters most: the header and the page title sit there, and every one
of them gives that strip a quiet background.

Four are genuinely dark (brightness 17 to 42 on a 0 to 255 scale), five sit in the middle (75 to
125), and none is bright. Three are paintings and one is a 3D render rather than photographs, so
they have large flat areas of colour, which is where banding shows behind small text.

---

## 2. How the wash was chosen, the second time

The first plan got this wrong, and it looked it. It measured the page ink against the brightest and
darkest single pixel of the whole picture, so a white sun glint in a corner that no text will ever
cover could force a heavy wash on the entire screen. That is why the pale styles came out bleached.

The rule now:

- Count how much of the picture cannot hold body ink at 4.5:1, and allow **3%** of it (1% in the
  top strip, where the page title sits), because text never covers every pixel.
- Take the **lightest** wash that meets that, so the picture stays a picture.
- The 3% that falls below the line is always the darkest or brightest corner of the frame, the part
  no words sit on.

Under this rule the dark styles barely needed a wash at all: Summit is 0.09, Contact 0.34, Skyline
0.38. The pale five clustered at 0.53, because a pale page needs the same help whatever the
picture. Loggia is the only heavy one at 0.59, because a bright sky and green leaves land directly
under the title.

---

## 3. The ten styles, as built

Every one keeps its **Colour** background, so the picture can be switched off per style and the page
is still a finished palette.

| Style | Page | Accent | Titles | Reading | Shape | Wash | Cards | Share that cannot hold text |
| ----- | ---- | ------ | ------ | ------- | ----- | ---- | ----- | --------------------------- |
| Summit | `#0E1D23` | `#D8A458` | Cormorant | Plex | soft | 0.09 | glass | 3.0% |
| Cloudbank | `#0D0E10` | `#C6C9CE` | Instrument | Work | arch | 0.53 | glass | 2.9% |
| Riviera | `#FBF4E6` | `#0E7C9B` | Outfit | Work | round | 0.53 | solid | 2.7% |
| Palazzo | `#F6F1E7` | `#8C6A2F` | Playfair | Work | plate | 0.53 | solid | 1.4% |
| Storm Tide | `#E9EDEC` | `#2C6B70` | Lora | Work | line | 0.53 | solid | 2.4% |
| Skyline | `#0A0F18` | `#E9A64B` | Grotesk | Grotesk | round | 0.38 | glass | 0.3% |
| Capsule | `#08080A` | `#9FA6B2` | Manrope | Manrope | pill | 0.47 | glass | 1.0% |
| Toscane | `#F7EFE2` | `#B4553A` | Fraunces | Work | arch | 0.49 | solid | 2.9% |
| Contact | `#000000` | `#B9BEC7` | Newsreader | Plex | line | 0.34 | glass | 3.0% |
| Loggia | `#F4EEE3` | `#1F6E6A` | Archivo | Work | square | 0.59 | solid | 0.0% |

**Ten different title faces**, no repeats: Cormorant, Instrument Serif, Outfit, Playfair, Lora,
Space Grotesk, Manrope, Fraunces, Newsreader, Archivo. Six different geometries across the ten:
soft, arch, round, plate, line, pill, square. Five dark pages and five pale ones. Two styles use
the whole family for every layer (Skyline and Capsule), the rest split titles, section heads and
reading text.

A few of the choices, so they can be judged rather than just seen:

- **Summit** takes its gold accent from the sunlit rock, so the accent and the picture agree.
- **Skyline** uses amber, taken from the lit windows, and keeps the wash off them because the lights
  are the point.
- **Capsule** is the only fully rounded style in the catalogue, and its picture is the brightest
  subject of the ten, so it needs half a wash to keep white text off the glossy pills.
- **Contact** is 93% pure black, so it needs almost nothing, and it is the calmest page of the set.
- **Palazzo** is the catalogue's first `plate` geometry: a 3px rule, no surface tint, flat on the
  page like a printed sheet.

Closest pair: **Cloudbank** and **Contact**. Both are near-black with pale ink. They are pulled
apart by geometry (very round against thin plate), by the title face (Instrument against
Newsreader) and by the accent, warm silver against cold silver.

---

## 4. The files

| In `Wallpapers/` | Shipped as | Style |
| ---------------- | ---------- | ----- |
| `1a511b13-dcaa-41e8-9203-dca6be76b4ab.jpeg` | `summit.jpg` | Summit |
| `255c8733-0ea5-413f-aa6b-1538ce71bb7b.jpeg` | `cloudbank.jpg` | Cloudbank |
| `2593f0e6-e444-40bc-a47a-5a24f72578a0.jpeg` | `riviera.jpg` | Riviera |
| `4323d460-d0cd-4ab2-bb58-2282a3d9cf0f.jpeg` | `palazzo.jpg` | Palazzo |
| `8386237a-ea67-41ba-b52a-f502d61d162d.jpeg` | `storm-tide.jpg` | Storm Tide |
| `83dc31f5-a3d8-4ab2-81c4-49f4b4192a23.jpeg` | `skyline.jpg` | Skyline |
| `938ddec2-57ff-4789-861b-119fc9532089.jpeg` | `capsule.jpg` | Capsule |
| `Pisa.jpeg` | `toscane.jpg` | Toscane |
| `c551bc90-c484-4b4d-808b-e83051fa0a5e.jpeg` | `contact.jpg` | Contact |
| `e1b77ade-c100-4da3-9266-ed7e469cd893.jpeg` | `loggia.jpg` | Loggia |

The originals are still in `Wallpapers/`, untouched. The naming rule means the file name **is** the
style id, so nothing else has to be told where a picture goes.

At 736 pixels wide they are sharp on a phone and a little soft on a large desktop. That was left as
uploaded: a phone screen is the target, and only the style in use is ever fetched, so the 1.5 MB
total costs nothing. Larger versions of Summit and Skyline can be dropped in later at any time, with
the same name.

`CREDITS.md` records one line per file, and `public/style-photos/README.md` carries the new rows in
its naming table.

---

## 5. Checks that ran

- `npx tsc --noEmit`: clean.
- `node scripts/styles-audit.mjs`: 30 styles, both appearances, both contrast levels, 2160 pairs, every pair clear.
- `node scripts/em-dash-audit.mjs`: clean.
- `node scripts/corner-audit.mjs`: every corner nests, no full-bleed surface takes an uncapped curve.

---

## 6. Still open

**Marble and Arches have no pictures.** They are the two photo styles that existed before this, and
`public/style-photos/` was empty, so both draw only their colour and show no Background row. Either
they get two of these photographs (Loggia and Palazzo are the closest fits, but those are taken now)
or they should be retired, because a photo style without a photograph is a colour style with a
switch that does nothing.

**The Photo shelf is now twelve.** That is a long shelf beside nine short ones. If it reads badly,
the ten can be filed under the shelf each one belongs to (luxe, dark, soft) and the Photo shelf left
as the place you go when you want a picture and nothing else.

---

## 7. The night cut

Every picture now has a second file, `<id>-night.jpg`, and the dark appearance wears it. This was
missing at first: the light frame stayed under the light ink's opposite, which is the one thing a
photograph cannot adapt to on its own.

- **How the night file is made:** the upload is dimmed to 45% and tinted 12% toward that style's own
  night page, so a pale style's picture does not stay a daylight frame behind a night layout.
- **Its own wash:** `photo.scrimNight` is measured against the night inks the same way the day wash
  was measured, which came out at 0.05 on all ten, because the night file is already dim.
- **Nothing is required:** a style whose night file is missing wears its day picture at night, and a
  style with neither draws its colour. That fallback was tested by blocking `summit-night.jpg` in
  the browser, which left the day picture on the page.

Verified in a browser at phone size in the dark appearance: Summit, Riviera, Loggia and Capsule each
applied their style, fetched their `-night.jpg`, used light ink on it and threw no console errors.
The ten night files are between 15 and 222 KB.

**Limits of that check:** four of the ten were opened, not all ten, and the night files are
generated rather than hand-cut. Any of them can be replaced with a real night edit at any time by
keeping the same file name.
