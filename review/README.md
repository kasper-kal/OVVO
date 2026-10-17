# review — screenshots and notes from the design review layer

Temporary. Everything here exists so the traveller can point at the interface instead of
describing it, and so the fix plan can be written against what was actually seen. The plan
written from this batch — every note, in their words — is `../MOBILE-FIXES.md`;
these captures are all phone-width (378px), so that file covers mobile only.

## How a note gets here

1. The floating dot in the bottom-right of the app (dev only) opens the review panel.
2. Add a screenshot: paste it (`Ctrl/⌘+V`), drop an image file on the panel, or — on a phone,
   where neither exists — use **Add a screenshot** and pick it from the photo library.
3. Point at what you mean, two ways:
   - **Pin a spot** and tap the picture to drop a numbered pin — one control, one icon, one word.
   - **Select an area** and drag a box across the picture to mark a whole panel — a card, a row of
     chips, a block that needs to become one thing. The box is drawn over the image the way a
     file manager draws a selection.
   Then type what you think beside its number or its "Area n" label. As many of each per picture as
   you like, no labels or tags.
4. **Save to review/** sends the image and the notes to `review/upload-plugin.mjs`, which writes
   both files here. Nothing leaves the machine.

On a phone the panel fills the screen as a sheet with the picture scrolling between a fixed header
and a footer that holds Save and Discard, so the button that finishes a note is never off-screen.

Pictures larger than 700 KB — which is every 3x phone screenshot — are re-encoded to a JPEG of at
most 1600 px on the long edge before they are sent, because a multi-megabyte POST can stall in the
dev-preview proxy without reaching the dev server. The reduction is recorded in the notes as
`capture`, so the stored picture is never silently different from the one that was taken:

## What is in here

| Path | What it is |
|---|---|
| `<stamp>-<route>-<width>-<theme>.<ext>` | the screenshot, exactly as pasted |
| `notes.json` | one entry per screenshot: where it was taken, on what, and the pins |
| `upload-plugin.mjs` | the dev-server endpoint that writes the two above |
| `upload-plugin.d.mts` | its types, so `vite.config.ts` can import it |

`notes.json` entries carry the whole context the app knows about the person looking at it, because
"the footer is ugly" means something different on a 390px phone in dark mode than on a 1440px
desktop in light:

```json
{
  "image": "2026-10-17t18-42-05-departures-390-dark.jpg",
  "at": "2026-10-17T18:42:05.123Z",
  "route": "/departures",
  "capture": { "sourceBytes": 2841200, "sentBytes": 286400, "reduced": true, "sentWidth": 739, "sentHeight": 1600 },
  "screen": { "width": 390, "height": 844, "availWidth": 390, "availHeight": 844, "colorDepth": 24, "orientation": "portrait-primary" },
  "viewport": { "width": 390, "height": 780, "dpr": 3 },
  "device": { "mobile": true, "touch": true, "platform": "iPhone" },
  "appearance": { "theme": "dark", "contrast": "normal", "density": "comfortable", "language": "en" },
  "pins": [
    { "id": "1792267032819-vfup", "x": 0.814, "y": 0.916, "comment": "the corner mark is enormous and looks stuck on" }
  ],
  "regions": [
    { "id": "1792267040123-ab12", "x": 0.03, "y": 0.42, "w": 0.94, "h": 0.18, "comment": "these three rows are really one control" }
  ]
}
```

`x` and `y` are fractions of the image (0–1), so a pin stays on the thing it points at whatever
size the image is opened at. `regions` carry `w` and `h` as fractions too, so a box keeps covering
the same panel at any size.

Saving has a 20-second limit. If the dev server or its preview proxy does not answer, the panel
says so with the status code and the response it got, instead of waiting forever; the picture and
pins stay in the panel, so the same Save button is the retry.

## Removing it

Delete this folder, the two lines that mount it in `src/App.tsx` and `vite.config.ts`, and
`src/review/`. The production build never contained any of it: the layer is behind
`import.meta.env.DEV` and the endpoint is `apply: 'serve'`.
