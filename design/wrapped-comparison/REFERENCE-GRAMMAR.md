# What the reference actually does, read off all 1,344 frames

Every tenth of a second of `VID_20261102_013903_1.mp4` (134.4 s, 60 fps, 8,064 frames) was cut out and
laid in order on one sheet: `artifacts/wrapped-visuals/reference-every-100ms.png`. 32 frames per row,
so one row is 3.2 seconds. This is what is on it.

## The grammar

1. **A field of many copies, never one object.** Every scene is a motif repeated dozens of times across
   the whole frame: stripes, chevrons, diamonds, fans, arches, flowers, wave lines. The motif is the
   picture, and the picture is made of the same mark over and over.
2. **The field moves every single frame.** At a tenth of a second the motif has always shifted: it
   marches sideways, ripples, or scales. Nothing is ever held still, not even during a text card.
3. **The motif is replaced every two to four seconds.** Stripes become fans, fans become columns,
   columns become stars, stars become chevrons, chevrons become sails, sails become diamonds, diamonds
   become flowers, flowers become arches, arches become waves. The shape changes; the colour does not.
4. **Colour is full-bleed and changes wholesale between chapters.** Hot pink, then green on black, then
   red, then blue, then amber on black, then grey and white. Each block owns the entire frame.
5. **Type is small and lives inside the field.** Big statements are rare; most frames are a wall of
   small lines with a number set inside the graphic.
6. **Photographs arrive as small squares in a grid**, never as a full-bleed picture: album art in rows,
   a contact sheet of blue images, a pink grid of photo tiles.

## The timeline, read off the sheet

| Seconds | What is on screen |
| --- | --- |
| 0 to 3 | Black, then pink blades sweeping in, then thin vertical pink stripes filling the frame |
| 3 to 6 | Pink fan and flower bursts on white and on black |
| 6 to 13 | Pink gradient fields with a tilted top edge, stacks of fat pink columns marching |
| 13 to 19 | A radial star or pinwheel, then chevron waves, then curly knots on black |
| 19 to 22 | Diagonal sails on black with lines of white type |
| 22 to 26 | Type cards: near-black field, a flame shape at the edge, small text |
| 26 to 32 | Green concentric wave lines, then rows of green diamonds on black |
| 32 to 48 | Red field, green pixel flowers, small album squares, rows of numbers |
| 48 to 52 | Green wave band cut across the red field |
| 52 to 58 | Red field, a long list of tiny white rows |
| 58 to 64 | A black tunnel, then blue arches and blue neon columns |
| 64 to 74 | Black with a dense amber wall of small type |
| 74 to 80 | Cyan liquid waves, then blue chevrons |
| 80 to 90 | Blue chevrons and dot fields, filled panels and a ring chart |
| 90 to 100 | A contact sheet of blue photographs, then blue wave panels |
| 100 to 120 | Grey and white: minimal cards, rows of small type |
| 120 to 134 | Pink photo-tile grid, then the closing cards |

## What this means for the Yearbook

The deck does not have a backdrop problem or a modelling problem. It has a **structure** problem.

Ours is **one object in front of one shape**. The reference is **a field of dozens of repeated marks
that moves every frame and is exchanged for another field every few seconds**. No amount of Blender
modelling fixes that, because a single beautiful object is still a single object.

The rebuild is therefore: each chapter gets a **motif** (chevron, fan, diamond, arch, stripe, wave,
flower, tunnel), repeated across the whole card as an SVG pattern, drifting and rippling continuously,
with the copies changing every few seconds inside the chapter, and the type set small inside the field.
The 3D mass stops being the subject and becomes one element in the field, if it survives at all.
