# The Wrapped visual reset

**The short answer:** our page is a black stage with a small object and a sentence on it. Wrapped is
a wall of colour with a giant object half out of frame and a sentence lying on top of the colour. No
amount of redrawing the object fixes that, because the stage, the size and the light are the
difference. So we take the words, the music and the effects off the page for a while and rebuild the
picture underneath them.

---

## 1. What the reference actually does

Read off the twelve capture sheets (`artifacts/wrapped-reference/sheets/`):

1. **Colour is the page.** A saturated field, edge to edge: red into magenta, green into lime, blue
   into cyan, or flat red with a green form on it. There is no black page behind the card.
2. **One enormous form, cropped by the frame.** It is 60 to 120 per cent of the card wide, enters
   from a corner or an edge, and is always cut off by the card. It is never a small prop centred in a
   generous margin.
3. **The form is 3D.** Ribbons, staircases, folded shells, columns of steps. Depth comes from stacked
   facets and gradients, not from a drawing of an object with an outline.
4. **A second layer.** Somewhere there is always a focal square (a sleeve, a photo) or a small list,
   sitting on the colour. The form alone is never the whole card.
5. **The type is still.** Short line centred, longer line left, white or black on flat colour, plain
   bold sans. A sub-line at roughly a third of the headline. No word-by-word entrance, no glow behind
   it, no scrim.
6. **The data is a list, not a diagram.** Numbered rows, tiny labels, no boxes, no axis, no chart
   frame. The list is set in the same colour world as the rest.
7. **The end card is a poster.** Photo, two columns of small stats, a share pill, replay. That is the
   thing people screenshot.
8. **Movement belongs to the form.** Slow rotation, morphing, a stack building. The words do not
   move.

## 2. Why ours does not read as Wrapped

| The reference | Ours today |
| --- | --- |
| A colour field, edge to edge | `#050506` on all 18 chapters |
| Form bigger than the frame, cropped | Prop at roughly a quarter of the frame, inside it |
| Type sits on flat colour | Type sits on a scrim, a glow and a black hole |
| Type is still | Every word rises in sequence |
| Two layers: form plus photo or list | Form plus sentence, nothing else |
| Depth from facets and gradients | Flat shapes with outlines and shadows |

Those six rows are the whole gap. It is not a colour tweak.

## 3. The workshop: `?bare=1`

The user's idea, and it is the right one. Add `&bare=1` to a yearbook address and the page becomes
the picture alone:

- the sentence, the share dock, the sound switch, the Begin button, the scrim, the glow and the photo
  shade all come off;
- the score, the effects and the automatic page turn are switched off, so a chapter stays put until
  it is clicked or an arrow key is pressed;
- the close button and the progress dots stay, so you can move around and leave.

Open `http://127.0.0.1:3000/yearbook?demo=1&persona=regular&bare=1`.

Nothing is deleted. Turn the flag off and the story is exactly the story it was.

## 4. The system to build

Four layers, in this order, on every chapter:

**Layer 0, the ground.** One hue per chapter, as a two-stop gradient across the whole frame. It is a
colour, not a tint of black. Four colour families rotate so no two neighbours match: hot (red,
magenta, orange), acid (green, lime, yellow), cold (blue, cyan, violet), and paper (cream or white
with a strong hue form on it).

**Layer 1, the mega-form.** A single 3D mass built from stacked CSS facets, conic and linear
gradients, and a slight blur where it turns away. It is sized 60 to 120 per cent of the frame and
always cropped by at least one edge. Each chapter gets a different silhouette: a ribbon, a staircase,
a column, a folded shell, a stepped diamond, a tunnel, a wing.

**Layer 2, the focal layer.** The thing the chapter is actually about: the photo for the artist-like
chapter, a ticket stack for the total, a numbered list for the top-things chapter, a route line for
the pair. It sits on the colour, not in a card.

**Layer 3, the words.** One sentence, unchanged, back on top at the end. It gets its legibility from
a flat area of the composition, not from a scrim. That is the last thing we put back, not the first.

Rules that follow from the reference:

- no black stage anywhere except where black *is* the chapter's colour;
- nothing is centred politely: the form is off-balance and cropped, the type is where the flat colour
  is;
- depth is facets and gradients, never outlines or soft drop shadows;
- motion lives in the form (slow rotation, drifting facets), and the type is still;
- the palette is loud on purpose. If it looks tasteful and quiet, it is wrong.

## 5. Colour map

| Order | Chapter | Ground | Mega-form |
| --- | --- | --- | --- |
| 1 | Cover | red to magenta | a ribbon shell turning into frame |
| 2 | Total journeys | acid green to lime | a stack of tickets as one stepped column |
| 3 | Your name | orange to pink | a folded badge cut off at the corner |
| 4 | Map | blue to cyan | a stepped grid rising from one edge |
| 5 | Distance | magenta to violet | a long folded ribbon running off both sides |
| 6 | Pair / route | hot red | a stepped diamond, dark green, top and bottom |
| 7 | Origin | cream with red | a slab totem cropped at the top |
| 8 | Hour | deep violet to pink | a tunnel of rings |
| 9 | Direct | cyan to blue | a wing of stacked steps |
| 10 | Longest | lime on cream | a folded road going over the horizon |
| 11 | The look | black with one hot colour | the photo full bleed, one shape behind it |
| 12 | Eras | peach to red | three slabs at different depths |
| 13 | Lines | green to teal | a column of steps like a departure board |
| 14 | Awards | gold to orange | three discs stacked in depth |
| 15 | Bookends | dawn blue to pink | a horizon of steps |
| 16 | Comparison | red and lime | two stepped blocks facing each other |
| 17 | Crew | violet to blue | a ring of upright slabs |
| 18 | Close | one deep blue | the poster: photo, list, share |

The colour families are already close to the tint table in `WrappedScenes.tsx`; the change is that
they become the *ground*, not a glow.

## 6. Order of work

1. **Cover only, in bare mode.** Build the ground, the ribbon and the crop. Nothing else. Look at it at
   1440 and at 390. Change nothing else in the deck.
2. **Total only.** The second proof, because it carries the number and proves the system works twice.
3. **The sentence goes back on** those two chapters and has to be readable on the colour without a
   scrim. If it is not, the composition is wrong, not the type.
4. **Then in batches of four or five**, cold family, then acid, then paper, then the odd ones. Each
   batch gets looked at before the next starts.
5. **The close card last**, as a poster with the small two-column list, because that is the screenshot.

Every step stays in the `freebuff/...` branch, is saved with `node scripts/keep.mjs --save`, and gets
pushed.

## 7. What "close enough" means, in checks

The existing check proves grammar, not beauty. These are the measurable things that separate the two
worlds, and they can be added to `scripts/check-wrapped-scenes.mjs` as a new `VISUAL=1` pass:

- no chapter's stage background is `rgb(5, 5, 6)`;
- the art layer covers at least 85 per cent of the frame's area;
- at least one edge of the mega-form is cropped by the frame;
- the largest form's bounding box is at least 55 per cent of the frame's short side;
- no visible `.film2-scrim` or `.film2-glow`;
- the type has no per-word stagger left;
- at 360 × 800 nothing clips and there is no sideways scroll.

The check is only trusted after it is shown to fail on the current build (it will: every chapter is
black and every prop is small).

## 8. What does not change

One human sentence per chapter. A share on every beat. Fixed navigation. Real numbers from the
tally. The OVVO logo, untouched. The story order. The words themselves.

## 9. Where this got to

Steps 1 to 5 are built. All eighteen chapters now paint a full-bleed colour field, carry a mass that
is cut by the frame and melted into the field before the words, and keep the focal layer where the
chapter has one (the map's pins, the photograph, the awards, the crew, the closing ring). The
sentence went back on in the same pass rather than later, because a picture you cannot read on is
not finished: it is set in the chapter's `--ink`, dead still, with no plate behind it.

The checks in section 7 are live in `scripts/check-wrapped-scenes.mjs`, with three deliberate
breaks (`FLAT=1`, `NO_MASS=1`, `WORD_ANIM=1`). `scripts/shots-wrapped.mjs` renders all eighteen
chapters in both modes at 1440 and 390 and lays them into contact sheets, which is how the pass was
judged; its output is not a claim about the live site.

The honest gap that is left: the masses are gradient-and-facet shapes, not modelled objects. They
read as Wrapped's surfaces at a glance, but they do not have the true turning volume of a rendered
ribbon. Closing that means either heavier layered CSS per mass or a 3D layer, and it is the next
piece of work, not a tweak.
