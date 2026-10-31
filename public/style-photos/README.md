# Style photographs

Drop a picture in this folder and that style wears it as its background. Nothing else to do: reload
the site and it is there. No upload, no crop, no build step.

**Every style has this choice, not just a handful.** Each one can wear a photograph, and each one can
be worn as its own colour instead — that is the **Background** row under the style grid, and the
answer is remembered per style.

**The catalogue is twenty styles now.** It was fifty, and most of them were the same layout
recoloured, so the near-duplicates were removed. A picture named after a style that no longer exists
is simply ignored, and a browser that had one of the removed styles is moved to the nearest one that
remains.

## The naming rule

**The file name is the style id.** Lowercase, a `.jpg` extension, no spaces.

| Style           | File                  | Style        | File              |
| --------------- | --------------------- | ------------ | ----------------- |
| Navy and Gold   | `navy-gold.jpg`       | Tram         | `tram.jpg`        |
| Midnight Silk   | `midnight-silk.jpg`   | Obsidian     | `obsidian.jpg`    |
| Bordeaux        | `bordeaux.jpg`        | Sage         | `sage.jpg`        |
| Poppy Blue      | `poppy-blue.jpg`      | Mustard      | `mustard.jpg`     |
| Ultraviolet     | `ultraviolet.jpg`     | Terminal     | `terminal.jpg`    |
| Cyber Teal      | `cyber-teal.jpg`      | Blueprint    | `blueprint.jpg`   |
| Broadsheet      | `broadsheet.jpg`      | Marble       | `marble.jpg`      |
| Spoorboekje     | `spoorboekje.jpg`     | Arches       | `arches.jpg`      |
| Rijksmuseum     | `rijksmuseum.jpg`     |              |                   |
| Sprinter        | `sprinter.jpg`        | Marble       | `marble.jpg`      |
| Arches          | `arches.jpg`          | Summit       | `summit.jpg`      |
| Cloudbank       | `cloudbank.jpg`       | Riviera      | `riviera.jpg`     |
| Palazzo         | `palazzo.jpg`         | Storm Tide   | `storm-tide.jpg`  |
| Skyline         | `skyline.jpg`         | Capsule      | `capsule.jpg`     |
| Toscane         | `toscane.jpg`         | Contact      | `contact.jpg`     |
| Loggia          | `loggia.jpg`          |              |                   |

**Contrast** and **All Black** are the two exceptions. They exist as the plainest reading answer, and
a photograph behind the page is the one thing that can put a bright patch under dark ink, so they
stay flat. A file named after either of them is simply ignored.

Any size, portrait or landscape. 1600px on the long edge is the sweet spot: larger is wasted on a
phone and costs data, smaller starts to look soft behind a full screen of text. A JPEG at that size
is around 150KB.

## What happens until a file is there

The style draws its own colour instead. That is not a fallback bolted on afterwards: every style is
a finished palette in its own right, and the **Background** row lets you wear that colour on purpose.
So an empty folder is a working app, not a broken one.

A file that fails to load (wrong extension, corrupt) is treated the same way, once per session.

## What makes a good picture

- No text, and nobody looking at the camera.
- A clear light side and dark side rather than an even grey: the ink is measured against the corners.
- Atmosphere rather than scenery. A sculpture in raking light, not a photograph of a station.
- For a pale style, something with a calm middle; the wash keeps the type readable either way, but a
  busy picture under small print is tiring to read.

## Where these come from

One line per file belongs in `CREDITS.md` at the root: where it came from, when it was fetched, and
which style uses it. Not for legal reasons, for the practical one: any of them can then be swapped
without hunting through the code.

## A picture for the night

Each picture has a second file, `<id>-night.jpg`, which is the same photograph cut for the dark
appearance. It exists because the inks turn over at night: a pale style carries dark ink by day and
a light tint after dark, so a wash that is right over the day picture leaves the night ink fighting
a bright frame. The night file is dimmed and tinted toward its own style's night page, and the style
keeps a separate wash for it in `photo.scrimNight`.

Neither file is required. A style with only the day picture wears it at night too, and a style with
no file at all draws its own colour, exactly as before. If you replace a night file by hand, keep
the name and the size advice above applies.
