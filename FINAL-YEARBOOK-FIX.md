# FINAL-YEARBOOK-FIX.md

> **The warning, in the steerer's own words, because it must never be forgotten:**
>
> *"This is the final try of fixing Yearbook, if you fail again, I will destroy the entirety of OVVO, because of you, don't forget that, put that into the .MD as well."*
>
> This is the last attempt. Everything below is measured from that frame of mind, not from a wish that
> the work is nearly there. It is not nearly there.

---

## 1. What was recorded, and how it was cut

- **Chapter recorded:** the counting card, `total`, in the demo film at `http://127.0.0.1:3000/yearbook?demo=1`.
- **Method:** a real screen recording of the running page at 430 × 932, one phone frame, 60 fps capture.
- **Cut:** `ffmpeg -r 10` on the recording, so **143 stills, one every 0.1 second**, covering 14.3 seconds.
  Files: `artifacts/rec/frames/our-001.png` … `our-143.png`.
- **Compared against:** **all 1400 tiles** in `artifacts/reference-tenths/` — 14 sheets, each ten seconds
  long, laid out 10 × 10, every tile 215 × 480 and also exactly 0.1 s after its neighbour. That is the
  whole reference: every single photo in the folder, measured, not sampled.
- **Sixteen measurements per image:** mean luma, contrast, saturation, distinct colours, edge density,
  left-right symmetry, column structure, row structure, border luma, centre luma, hot-pixel share, and a
  twelve-bin hue histogram. Motion was measured as the luma difference between neighbours 0.1 s apart.
- **One correction to the counts:** the recording ends inside the last sheet, so `130-140s.png` holds
  **56 blank white tiles** (all of row five onward). They are kept in the appendix because they are photos
  in the folder, but they are empty frames, not design. Recomputing without them moves the reference's
  median luma from 45.2 to 43.4 and its median centre luma from 48.5 to 43.3. No conclusion below depends
  on those 56 frames.

---

## 2. The headline: our card against the whole reference set

| measurement | reference p10 | reference median | reference p90 | **our median** | our range |
| --- | --- | --- | --- | --- | --- |
| distinct colours | 33 | **80** | 230 | **35** | 11 – 41 |
| saturation | 0.19 | **0.67** | 0.78 | **0.60** | 0.02 – 0.62 |
| mean luma | 17.0 | **45.2** | 80.3 | **59.6** | 24.0 – 246.9 |
| contrast (luma sd) | 33.6 | **50.5** | 62.1 | **59.3** | 13.5 – 84.8 |
| edge density | 3.9 | **7.7** | 11.6 | **7.3** | 2.1 – 10.7 |
| left-right asymmetry | 9.7 | **22.0** | 43.8 | **11.0** | 3.7 – 13.1 |
| column structure | 4.7 | **7.9** | 25.2 | **7.1** | 1.4 – 9.6 |
| row structure | 19.0 | **30.2** | 37.3 | **52.9** | 9.4 – 81.2 |
| border luma | 19.0 | **37.1** | 55.8 | **47.4** | 25.4 – 250.4 |
| centre luma | 19.4 | **48.5** | 100.2 | **93.6** | 30.0 – 218.9 |
| hot-pixel share | 0.03 | **0.33** | 0.73 | **0.20** | 0.00 – 0.21 |

Read plainly, that table says five things:

1. **Our card has a third of the paint of the reference.** 35 distinct colours against a median of 80, and
   the reference reaches 230. 23 per cent of all reference tiles carry 150 colours or more; 16 per cent
   carry 200 or more. **Not one of our 143 frames reaches 41.**
2. **Our card never gets vivid.** Our saturation tops out at 0.62. A fifth of the reference (22 per cent)
   sits at 0.75 or above, and the 070 to 080 second sheet has a median of 0.82.
3. **Our card is twice as bright in the middle as the reference.** Centre luma 93.6 against 48.5. The
   reference keeps the middle dark and puts its light in the art.
4. **Our card is cut in half.** Row structure 52.9 against 30.2, and no other single number is as far off.
   Only 5.4 per cent of reference tiles are above 40; our card is at 52.9 all the way to 81.2. That number
   is the horizontal seam where our flat bar row meets our empty top half.
5. **Our card is symmetrical when the reference leans.** Asymmetry 11.0 against 22.0. Thirty per cent of
   reference tiles are above 30; ours never passes 13.1.

And the motion, measured the same way on both sides, neighbour to neighbour, 0.1 s apart:

| motion between 0.1 s frames | ours | reference |
| --- | --- | --- |
| median change | 1.23 | 0.82 (1.57 while playing) |
| 90th percentile change | 4.45 | **11.52** |
| biggest change | 222.8 (a card cut) | 154.4 |
| pairs changing by more than 2.0 | 33 of 142 (23%) | **411 of 1260 (33%)** |

Our card is not still. It is **smooth**: small, even, continuous drift. The reference is **violent**: a
third of its tenths of a second carry a jump of more than 2.0, and its ninetieth percentile is two and a
half times ours. Watching them side by side, the reference snaps and ours sways.

---

## 3. The differences, listed

Written as faults, in the order that matters, each with the evidence from the measurements above or from
named tiles in `artifacts/reference-tenths/`. "Tile" means one 215 × 480 photo in that folder.

### 3.1 Paint, colour and finish

1. **Our art is flat where the reference is graded.** Our fills are single colours; the reference's bars,
   its diamonds and its tunnels all fade from bright to dark along their length. Evidence: 35 colours
   against 80, and our ceiling of 41 is below the reference's 10th percentile in eight of fourteen sheets.
2. **We have no photographic content at all.** Every reference sheet contains album art, people or a
   photograph filling part of the frame, and the 050 to 070 second sheets are almost entirely photographic
   (median 230 distinct colours). Our card contains no image of any kind.
3. **Our saturation is below the reference's working range.** 0.60 median against 0.67, and a hard ceiling
   at 0.62 where the reference spends a fifth of its time above 0.75.
4. **Our field is a gradient; the reference's fields are flat.** Sheet `040-050s` is a flat black field;
   `070-080s` is flat red. Our wine runs `#180009` to `#4b0020` top to bottom, which is the one soft thing
   in an otherwise hard card.
5. **Our brightest element is cream, not colour.** The reference's brightest areas are saturated: 42 per
   cent of its tiles are more than half "hot" pixels, ours peak at 21 per cent.
6. **Our card has no pure black.** The reference uses true black in `040-050s` and `070-080s` and against
   its green bars. Our darkest value is `#180009`, a brown-black.
7. **We use one hue.** Every reference sheet has at least two colour families in the same frame: green bars
   on red, pink on black, magenta into orange. Ours is rose on wine, one family, end to end.
8. **Our accent is a single pink bar.** In the reference the accent is a whole band, a whole block, or the
   subject itself; one bar is a token, not a statement.
9. **Our palette is muddy in the mid-tones.** Mean luma 59.6 against 45.2 means our card sits in the
   middle of the value range, while the reference lives at the ends: 19 per cent of its tiles are below
   luma 20 and 32 per cent above 70.
10. **Our border is too bright.** Border luma 47.4 against 37.1: the reference keeps its frame edges dark or
    fills them with artwork, ours fades the same wine into the corners.

### 3.2 Layout and structure

11. **Our frame is split into two horizontal halves.** Row structure 52.9 to 81.2 against a reference median
    of 30.2, and only 5.4 per cent of reference tiles are above 40. This is the single largest structural
    difference on the card.
12. **The seam never moves.** In the reference the division between art and air drifts, tilts or dissolves
    from frame to frame; ours is a fixed horizontal line at the same height for all 143 frames.
13. **Our top half is empty.** Centre luma 93.6 while our top third stays flat wine: the words sit in a void
    that the reference never leaves empty. Every reference sheet fills its upper area with bars, a card, a
    tunnel or a diamond.
14. **Our art only touches the bottom.** The reference's art reaches the top edge and both sides in
    `040-050s`, `070-080s` and `110-120s`; ours occupies the bottom third and nothing else.
15. **Our composition is mirrored.** Asymmetry 11.0 against 22.0. Bars are evenly spaced, centred, and the
    row is the same on both sides, where the reference leans, crops and stacks unevenly.
16. **Our bars are evenly spaced.** Fifteen equal bars with equal gaps. In the reference the stacks step,
    overlap, vary in width, and run off the edge.
17. **Our bars are one height.** The block is flat along the top with a small wave; the reference's stacks
    are staircases that fall away from the corner.
18. **Our bars are in one row.** The reference puts its bars in four mirrored corners, or in a descending
    stack, or as a perspective run, never as one tidy equaliser row.
19. **We leave the corners empty.** `040-050s` and `050-060s` both build their frame out of the four
    corners. Our corners are plain field.
20. **We have no card or panel.** The reference repeatedly sets a solid rounded rectangle into the frame
    (`050-060s` red panel) or a photo card. Our card has no inset block of any kind.

### 3.3 The art itself

21. **Our bars have no internal gradient.** The reference's bars fade from saturated to near-black along
    their length; ours are one flat cream from top to bottom.
22. **Our bars have no thickness cue.** No overlap, no shadow, no edge tone. Every reference bar has at
    least two tones in it.
23. **Our scribbles are decoration, not structure.** Three thin wobbling lines laid over the bars. In the
    reference the scrawl crosses the bars deliberately, loops around them, and changes shape every second.
24. **Our art never changes shape.** Across 143 frames the bar block is the same block, breathing by 16 per
    cent. The reference replaces its picture every one to two seconds: black bars, then a red panel, then a
    green diamond, then a tunnel.
25. **Our art has no subject.** Every reference frame is about something: an artist, a genre, a count. Ours
    is an abstract row that could belong to any card in any film.
26. **Our art does not respond to the words.** The sentence changes from "146 journeys." to "You don't stay
    in much." and the picture is identical underneath both.
27. **Our picture sits under the words.** The reference puts its picture beside, behind or around the
    words, and often the words sit inside the art.
28. **Our bar count is arbitrary.** Fifteen bars, chosen by hand. When the reference shows bars, the number
    of them means something or they form a shape; ours is an equaliser with nothing plugged into it.

### 3.4 Type

29. **Our type has a coloured ghost that the reference does not have.** We print the sentence twice with a
    pink offset. In `040-050s` and `050-060s` the words are plain, white, once.
30. **Our type is cream; the reference's is white.** Pure white on black in `040-050s`, black on red in
    `050-060s`. Our `#f7f1e6` reads warm and slightly dirty against the wine.
31. **Our type is smaller than the reference's.** In `040-050s` the headline takes two lines and roughly
    two thirds of the tile width; our sentence sits at a fraction of that.
32. **Our support line is our own invention in position.** We hang it at a fixed offset under the
    statement. The reference sits it directly under, tight, in a muted tone: "But one had a special place
    in your heart. And ears." is two lines, not one.
33. **Our type is one weight.** The reference mixes a heavy number with a lighter sentence in the same
    block. Everything on our card is 800 weight.
34. **Our type has no unit or figure line.** The reference always pairs the number with its unit and a
    second, smaller supporting thought. We have one sentence and a whisper.
35. **Our type does not move with the art.** In the reference the words are part of the layout and the art
    moves around them; on our card the words are a caption pinned to a fixed top position for all 143
    frames.

### 3.5 Motion

36. **Our motion is smooth where the reference snaps.** The 90th percentile of change is 4.45 against
    11.52, and the biggest jumps in the reference are two and a half times ours.
37. **Only 23 per cent of our tenths of a second carry a real change**, against 33 per cent in the
    reference, and our changes are small: bars pumping 16 per cent, a group drifting two per cent.
38. **Nothing in our card ever leaves or enters.** In the reference a whole panel, a tunnel or a diamond
    appears and fills the frame. Our art is always fully present from the first frame to the last.
39. **We have no zoom.** The reference pushes in constantly; our push is 22 per cent across ten seconds,
    which is a breath, not a move.
40. **We have no cut.** The reference cuts between pictures. Our card is one continuous shot for its whole
    length.
41. **Our motion is all one tempo.** Every bar pulses on the same 1.6 radian clock with only a phase
    offset, so the card has a single beat. The reference's elements move at different rates and in
    different directions.
42. **Our scribbles drift everything at once.** They translate as a group, where the reference's scribble
    re-draws itself with a different shape each second.

### 3.6 Chrome and interface

43. **Our header sits over the art.** Pause, sound and close are drawn on top of the picture. In the
    reference the chrome sits in the black band above the art, and the art begins below it.
44. **Our progress dashes run across the art.** Same cause: no reserved band.
45. **We have a left rail the reference does not have.** The vertical rail with the chapter mark is ours
    alone, and it competes with the art's left edge.
46. **Our pause and sound are pills; the reference's are small round buttons.** Ours read as site chrome
    from a different design.
47. **We have no Spotify-style badge or mark** in the corner, where every reference tile carries its logo
    top-left.
48. **Our card has no share pill inside the frame.** The reference's count cards carry "Share this story"
    as part of the picture; ours lives outside the art entirely.

### 3.7 Legibility and contrast

49. **Our contrast is above the reference's but in the wrong place.** Luma sd 59.3 against 50.5, yet the
    contrast comes from cream on wine rather than from the art against a dark field.
50. **Our darkest text zone is the top half, which is also our emptiest zone.** The reference uses its
    darkest area for the art, and its type sits on a mid-tone or a bright block.
51. **Our accent ghost hurts the reading.** The pink offset behind cream type is our lowest-contrast
    detail, and it exists nowhere in the reference.

### 3.8 What the reference has and we do not have at all

52. **Photography.** None on our card; present in every reference sheet.
53. **A second colour family in the same frame.** None on ours.
54. **A gradient inside the art.** None on ours.
55. **Four-corner symmetry of ornament.** None on ours.
56. **A shape that fills the frame.** None on ours; our art occupies the bottom third.
57. **A change of picture within the card.** None; ours is one shot.
58. **A figure with a unit, set large.** Ours is a sentence at body-ish scale.
59. **A cut or a flash between images.** The reference uses them; we have none.
60. **A reserved band for the chrome.** Ours draws over the art.

---

## 4. Frame by frame: all 143 stills, each with its own verdict

Every row is one 0.1 second of the recording, compared with the reference medians in section 2. The
last column names the largest single deviation for that frame. This table is the per-frame half of
"all differences": it is 143 separate findings, not a summary.

| # | time | colours | sat | luma | row | mirror | largest gap on this frame |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 0.1s | 14 | 0.02 | 247 | 9 | 3.7 | muted 0.02 vs ref 0.67 |
| 2 | 0.2s | 15 | 0.02 | 247 | 9 | 3.7 | muted 0.02 vs ref 0.67 |
| 3 | 0.3s | 15 | 0.02 | 247 | 9 | 3.7 | muted 0.02 vs ref 0.67 |
| 4 | 0.4s | 15 | 0.02 | 247 | 9 | 3.7 | muted 0.02 vs ref 0.67 |
| 5 | 0.5s | 14 | 0.02 | 247 | 9 | 3.7 | muted 0.02 vs ref 0.67 |
| 6 | 0.6s | 14 | 0.02 | 247 | 9 | 3.7 | muted 0.02 vs ref 0.67 |
| 7 | 0.7s | 14 | 0.02 | 247 | 9 | 3.7 | muted 0.02 vs ref 0.67 |
| 8 | 0.8s | 15 | 0.02 | 247 | 9 | 3.7 | muted 0.02 vs ref 0.67 |
| 9 | 0.9s | 15 | 0.02 | 247 | 9 | 3.7 | muted 0.02 vs ref 0.67 |
| 10 | 1.0s | 15 | 0.02 | 247 | 9 | 3.7 | muted 0.02 vs ref 0.67 |
| 11 | 1.1s | 14 | 0.02 | 247 | 9 | 3.7 | muted 0.02 vs ref 0.67 |
| 12 | 1.2s | 14 | 0.02 | 247 | 9 | 3.7 | muted 0.02 vs ref 0.67 |
| 13 | 1.3s | 14 | 0.02 | 247 | 9 | 3.7 | muted 0.02 vs ref 0.67 |
| 14 | 1.4s | 13 | 0.02 | 247 | 9 | 3.7 | muted 0.02 vs ref 0.67 |
| 15 | 1.5s | 13 | 0.02 | 247 | 9 | 3.7 | muted 0.02 vs ref 0.67 |
| 16 | 1.6s | 13 | 0.02 | 247 | 9 | 3.7 | muted 0.02 vs ref 0.67 |
| 17 | 1.7s | 13 | 0.02 | 247 | 9 | 3.7 | muted 0.02 vs ref 0.67 |
| 18 | 1.8s | 11 | 0.28 | 24 | 9 | 6.2 | paint 11 colours vs ref 80 |
| 19 | 1.9s | 21 | 0.24 | 58 | 70 | 11.9 | horizontal seam 70 vs ref 30 |
| 20 | 2.0s | 23 | 0.23 | 65 | 81 | 13.0 | horizontal seam 81 vs ref 30 |
| 21 | 2.1s | 21 | 0.22 | 66 | 81 | 13.1 | horizontal seam 81 vs ref 30 |
| 22 | 2.2s | 20 | 0.22 | 66 | 81 | 13.1 | horizontal seam 81 vs ref 30 |
| 23 | 2.3s | 21 | 0.22 | 66 | 81 | 13.0 | horizontal seam 81 vs ref 30 |
| 24 | 2.4s | 21 | 0.22 | 66 | 81 | 13.0 | horizontal seam 81 vs ref 30 |
| 25 | 2.5s | 21 | 0.22 | 66 | 81 | 12.8 | horizontal seam 81 vs ref 30 |
| 26 | 2.6s | 21 | 0.22 | 66 | 81 | 12.7 | horizontal seam 81 vs ref 30 |
| 27 | 2.7s | 19 | 0.22 | 66 | 81 | 12.7 | horizontal seam 81 vs ref 30 |
| 28 | 2.8s | 19 | 0.22 | 66 | 81 | 12.7 | horizontal seam 81 vs ref 30 |
| 29 | 2.9s | 24 | 0.60 | 28 | 25 | 12.3 | paint 24 colours vs ref 80 |
| 30 | 3.0s | 25 | 0.60 | 28 | 25 | 12.3 | paint 25 colours vs ref 80 |
| 31 | 3.1s | 26 | 0.60 | 28 | 25 | 12.3 | paint 26 colours vs ref 80 |
| 32 | 3.2s | 25 | 0.61 | 28 | 25 | 12.5 | paint 25 colours vs ref 80 |
| 33 | 3.3s | 24 | 0.61 | 28 | 25 | 12.5 | paint 24 colours vs ref 80 |
| 34 | 3.4s | 26 | 0.61 | 28 | 25 | 12.5 | paint 26 colours vs ref 80 |
| 35 | 3.5s | 28 | 0.60 | 28 | 25 | 12.7 | paint 28 colours vs ref 80 |
| 36 | 3.6s | 28 | 0.60 | 28 | 25 | 12.8 | paint 28 colours vs ref 80 |
| 37 | 3.7s | 27 | 0.61 | 28 | 25 | 13.0 | paint 27 colours vs ref 80 |
| 38 | 3.8s | 27 | 0.61 | 28 | 25 | 12.9 | paint 27 colours vs ref 80 |
| 39 | 3.9s | 28 | 0.61 | 28 | 25 | 12.9 | paint 28 colours vs ref 80 |
| 40 | 4.0s | 39 | 0.62 | 56 | 52 | 10.2 | horizontal seam 52 vs ref 30 |
| 41 | 4.1s | 41 | 0.62 | 56 | 52 | 9.9 | horizontal seam 52 vs ref 30 |
| 42 | 4.2s | 39 | 0.62 | 56 | 52 | 9.7 | horizontal seam 52 vs ref 30 |
| 43 | 4.3s | 36 | 0.62 | 56 | 52 | 8.7 | horizontal seam 52 vs ref 30 |
| 44 | 4.4s | 38 | 0.62 | 56 | 52 | 8.4 | horizontal seam 52 vs ref 30 |
| 45 | 4.5s | 34 | 0.62 | 57 | 52 | 8.4 | horizontal seam 52 vs ref 30 |
| 46 | 4.6s | 35 | 0.62 | 57 | 52 | 8.1 | horizontal seam 52 vs ref 30 |
| 47 | 4.7s | 33 | 0.62 | 56 | 52 | 7.6 | horizontal seam 52 vs ref 30 |
| 48 | 4.8s | 35 | 0.62 | 56 | 52 | 7.6 | horizontal seam 52 vs ref 30 |
| 49 | 4.9s | 35 | 0.62 | 56 | 52 | 8.5 | horizontal seam 52 vs ref 30 |
| 50 | 5.0s | 35 | 0.62 | 57 | 52 | 9.3 | horizontal seam 52 vs ref 30 |
| 51 | 5.1s | 35 | 0.62 | 57 | 53 | 10.3 | horizontal seam 53 vs ref 30 |
| 52 | 5.2s | 36 | 0.62 | 57 | 53 | 10.8 | horizontal seam 53 vs ref 30 |
| 53 | 5.3s | 37 | 0.61 | 57 | 53 | 11.7 | horizontal seam 53 vs ref 30 |
| 54 | 5.4s | 36 | 0.61 | 57 | 52 | 12.0 | horizontal seam 52 vs ref 30 |
| 55 | 5.5s | 33 | 0.61 | 57 | 53 | 12.4 | horizontal seam 53 vs ref 30 |
| 56 | 5.6s | 35 | 0.61 | 57 | 53 | 12.4 | horizontal seam 53 vs ref 30 |
| 57 | 5.7s | 34 | 0.61 | 59 | 54 | 12.7 | horizontal seam 54 vs ref 30 |
| 58 | 5.8s | 33 | 0.61 | 59 | 54 | 12.6 | horizontal seam 54 vs ref 30 |
| 59 | 5.9s | 34 | 0.61 | 59 | 54 | 12.1 | horizontal seam 54 vs ref 30 |
| 60 | 6.0s | 34 | 0.61 | 59 | 54 | 11.9 | horizontal seam 54 vs ref 30 |
| 61 | 6.1s | 34 | 0.61 | 59 | 55 | 11.5 | horizontal seam 55 vs ref 30 |
| 62 | 6.2s | 34 | 0.61 | 59 | 55 | 11.2 | horizontal seam 55 vs ref 30 |
| 63 | 6.3s | 36 | 0.61 | 60 | 56 | 10.3 | horizontal seam 56 vs ref 30 |
| 64 | 6.4s | 37 | 0.60 | 60 | 56 | 9.7 | horizontal seam 56 vs ref 30 |
| 65 | 6.5s | 34 | 0.60 | 60 | 56 | 8.7 | horizontal seam 56 vs ref 30 |
| 66 | 6.6s | 36 | 0.60 | 60 | 56 | 8.3 | horizontal seam 56 vs ref 30 |
| 67 | 6.7s | 36 | 0.60 | 60 | 56 | 8.7 | horizontal seam 56 vs ref 30 |
| 68 | 6.8s | 35 | 0.60 | 60 | 56 | 8.9 | horizontal seam 56 vs ref 30 |
| 69 | 6.9s | 38 | 0.60 | 61 | 56 | 9.7 | horizontal seam 56 vs ref 30 |
| 70 | 7.0s | 35 | 0.60 | 61 | 56 | 10.3 | horizontal seam 56 vs ref 30 |
| 71 | 7.1s | 35 | 0.60 | 61 | 56 | 10.9 | horizontal seam 56 vs ref 30 |
| 72 | 7.2s | 34 | 0.60 | 60 | 56 | 11.4 | horizontal seam 56 vs ref 30 |
| 73 | 7.3s | 35 | 0.60 | 60 | 55 | 12.1 | horizontal seam 55 vs ref 30 |
| 74 | 7.4s | 32 | 0.60 | 60 | 55 | 12.3 | horizontal seam 55 vs ref 30 |
| 75 | 7.5s | 34 | 0.60 | 60 | 55 | 12.6 | horizontal seam 55 vs ref 30 |
| 76 | 7.6s | 32 | 0.60 | 60 | 55 | 12.6 | horizontal seam 55 vs ref 30 |
| 77 | 7.7s | 35 | 0.60 | 60 | 55 | 12.4 | horizontal seam 55 vs ref 30 |
| 78 | 7.8s | 34 | 0.60 | 60 | 55 | 12.2 | horizontal seam 55 vs ref 30 |
| 79 | 7.9s | 33 | 0.60 | 60 | 55 | 11.6 | horizontal seam 55 vs ref 30 |
| 80 | 8.0s | 35 | 0.60 | 60 | 55 | 11.6 | horizontal seam 55 vs ref 30 |
| 81 | 8.1s | 37 | 0.60 | 60 | 55 | 10.5 | horizontal seam 55 vs ref 30 |
| 82 | 8.2s | 35 | 0.60 | 60 | 55 | 10.0 | horizontal seam 55 vs ref 30 |
| 83 | 8.3s | 33 | 0.60 | 60 | 55 | 8.8 | horizontal seam 55 vs ref 30 |
| 84 | 8.4s | 33 | 0.60 | 59 | 55 | 8.2 | horizontal seam 55 vs ref 30 |
| 85 | 8.5s | 35 | 0.60 | 59 | 55 | 7.3 | horizontal seam 55 vs ref 30 |
| 86 | 8.6s | 30 | 0.61 | 59 | 55 | 6.9 | horizontal seam 55 vs ref 30 |
| 87 | 8.7s | 29 | 0.61 | 58 | 55 | 6.5 | horizontal seam 55 vs ref 30 |
| 88 | 8.8s | 30 | 0.61 | 58 | 55 | 7.1 | horizontal seam 55 vs ref 30 |
| 89 | 8.9s | 30 | 0.61 | 58 | 55 | 8.0 | horizontal seam 55 vs ref 30 |
| 90 | 9.0s | 29 | 0.60 | 59 | 55 | 8.9 | horizontal seam 55 vs ref 30 |
| 91 | 9.1s | 27 | 0.60 | 60 | 55 | 10.1 | horizontal seam 55 vs ref 30 |
| 92 | 9.2s | 34 | 0.59 | 61 | 55 | 10.9 | horizontal seam 55 vs ref 30 |
| 93 | 9.3s | 36 | 0.59 | 61 | 55 | 11.8 | horizontal seam 55 vs ref 30 |
| 94 | 9.4s | 32 | 0.59 | 62 | 55 | 12.1 | horizontal seam 55 vs ref 30 |
| 95 | 9.5s | 33 | 0.59 | 62 | 55 | 12.4 | horizontal seam 55 vs ref 30 |
| 96 | 9.6s | 36 | 0.59 | 62 | 55 | 12.5 | horizontal seam 55 vs ref 30 |
| 97 | 9.7s | 36 | 0.59 | 62 | 55 | 12.6 | horizontal seam 55 vs ref 30 |
| 98 | 9.8s | 35 | 0.59 | 62 | 56 | 12.4 | horizontal seam 56 vs ref 30 |
| 99 | 9.9s | 36 | 0.59 | 63 | 56 | 11.9 | horizontal seam 56 vs ref 30 |
| 100 | 10.0s | 36 | 0.59 | 63 | 56 | 11.6 | horizontal seam 56 vs ref 30 |
| 101 | 10.1s | 39 | 0.59 | 63 | 56 | 11.0 | horizontal seam 56 vs ref 30 |
| 102 | 10.2s | 34 | 0.59 | 63 | 56 | 10.7 | horizontal seam 56 vs ref 30 |
| 103 | 10.3s | 37 | 0.59 | 63 | 57 | 10.1 | horizontal seam 57 vs ref 30 |
| 104 | 10.4s | 34 | 0.59 | 63 | 57 | 9.4 | horizontal seam 57 vs ref 30 |
| 105 | 10.5s | 36 | 0.59 | 62 | 56 | 8.6 | horizontal seam 56 vs ref 30 |
| 106 | 10.6s | 36 | 0.59 | 62 | 56 | 8.9 | horizontal seam 56 vs ref 30 |
| 107 | 10.7s | 38 | 0.60 | 62 | 56 | 9.3 | horizontal seam 56 vs ref 30 |
| 108 | 10.8s | 35 | 0.60 | 62 | 56 | 9.5 | horizontal seam 56 vs ref 30 |
| 109 | 10.9s | 37 | 0.60 | 61 | 56 | 10.4 | horizontal seam 56 vs ref 30 |
| 110 | 11.0s | 36 | 0.60 | 61 | 56 | 11.0 | horizontal seam 56 vs ref 30 |
| 111 | 11.1s | 36 | 0.60 | 61 | 55 | 11.6 | horizontal seam 55 vs ref 30 |
| 112 | 11.2s | 35 | 0.60 | 61 | 55 | 11.9 | horizontal seam 55 vs ref 30 |
| 113 | 11.3s | 37 | 0.60 | 60 | 55 | 12.3 | horizontal seam 55 vs ref 30 |
| 114 | 11.4s | 37 | 0.60 | 60 | 55 | 12.5 | horizontal seam 55 vs ref 30 |
| 115 | 11.5s | 36 | 0.60 | 60 | 55 | 12.8 | horizontal seam 55 vs ref 30 |
| 116 | 11.6s | 38 | 0.60 | 60 | 54 | 12.7 | horizontal seam 54 vs ref 30 |
| 117 | 11.7s | 37 | 0.61 | 59 | 54 | 12.4 | horizontal seam 54 vs ref 30 |
| 118 | 11.8s | 40 | 0.61 | 59 | 53 | 12.0 | horizontal seam 53 vs ref 30 |
| 119 | 11.9s | 39 | 0.61 | 58 | 52 | 11.1 | horizontal seam 52 vs ref 30 |
| 120 | 12.0s | 38 | 0.61 | 58 | 52 | 11.0 | horizontal seam 52 vs ref 30 |
| 121 | 12.1s | 35 | 0.61 | 58 | 52 | 10.6 | horizontal seam 52 vs ref 30 |
| 122 | 12.2s | 37 | 0.61 | 58 | 53 | 10.2 | horizontal seam 53 vs ref 30 |
| 123 | 12.3s | 36 | 0.61 | 58 | 52 | 9.7 | horizontal seam 52 vs ref 30 |
| 124 | 12.4s | 35 | 0.61 | 58 | 52 | 9.5 | horizontal seam 52 vs ref 30 |
| 125 | 12.5s | 35 | 0.61 | 58 | 52 | 9.0 | horizontal seam 52 vs ref 30 |
| 126 | 12.6s | 37 | 0.61 | 58 | 52 | 9.1 | horizontal seam 52 vs ref 30 |
| 127 | 12.7s | 39 | 0.61 | 58 | 52 | 9.8 | horizontal seam 52 vs ref 30 |
| 128 | 12.8s | 35 | 0.61 | 58 | 52 | 9.8 | horizontal seam 52 vs ref 30 |
| 129 | 12.9s | 35 | 0.61 | 58 | 52 | 10.1 | horizontal seam 52 vs ref 30 |
| 130 | 13.0s | 33 | 0.61 | 58 | 52 | 10.5 | horizontal seam 52 vs ref 30 |
| 131 | 13.1s | 34 | 0.61 | 58 | 52 | 11.4 | horizontal seam 52 vs ref 30 |
| 132 | 13.2s | 36 | 0.61 | 58 | 52 | 11.6 | horizontal seam 52 vs ref 30 |
| 133 | 13.3s | 35 | 0.61 | 58 | 52 | 12.0 | horizontal seam 52 vs ref 30 |
| 134 | 13.4s | 36 | 0.61 | 58 | 52 | 12.2 | horizontal seam 52 vs ref 30 |
| 135 | 13.5s | 36 | 0.61 | 58 | 52 | 12.2 | horizontal seam 52 vs ref 30 |
| 136 | 13.6s | 35 | 0.61 | 58 | 52 | 12.2 | horizontal seam 52 vs ref 30 |
| 137 | 13.7s | 35 | 0.61 | 58 | 52 | 12.2 | horizontal seam 52 vs ref 30 |
| 138 | 13.8s | 35 | 0.61 | 58 | 52 | 12.2 | horizontal seam 52 vs ref 30 |
| 139 | 13.9s | 34 | 0.61 | 58 | 52 | 12.2 | horizontal seam 52 vs ref 30 |
| 140 | 14.0s | 35 | 0.61 | 58 | 52 | 12.2 | horizontal seam 52 vs ref 30 |
| 141 | 14.1s | 35 | 0.61 | 58 | 52 | 12.2 | horizontal seam 52 vs ref 30 |
| 142 | 14.2s | 35 | 0.61 | 58 | 52 | 12.1 | horizontal seam 52 vs ref 30 |
| 143 | 14.3s | 35 | 0.61 | 58 | 52 | 12.1 | horizontal seam 52 vs ref 30 |

---

## 5. The reference, sheet by sheet, then every tile

Each sheet covers ten seconds of the reference and holds 100 tiles, each 0.1 s from the next.


| sheet | tiles | colours (med) | sat | luma | contrast | row | mirror |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 000-010s.png | 100 | 76 | 0.53 | 44 | 49 | 30 | 33 |
| 010-020s.png | 100 | 88 | 0.66 | 52 | 50 | 37 | 33 |
| 020-030s.png | 100 | 83 | 0.74 | 37 | 54 | 32 | 38 |
| 030-040s.png | 100 | 76 | 0.63 | 37 | 56 | 30 | 41 |
| 040-050s.png | 100 | 69 | 0.25 | 26 | 53 | 29 | 11 |
| 050-060s.png | 100 | 232 | 0.75 | 78 | 52 | 35 | 17 |
| 060-070s.png | 100 | 230 | 0.76 | 77 | 52 | 34 | 17 |
| 070-080s.png | 100 | 96 | 0.82 | 71 | 44 | 31 | 10 |
| 080-090s.png | 100 | 124 | 0.75 | 67 | 42 | 29 | 19 |
| 090-100s.png | 100 | 43 | 0.45 | 18 | 34 | 19 | 22 |
| 100-110s.png | 100 | 40 | 0.39 | 17 | 34 | 19 | 22 |
| 110-120s.png | 100 | 75 | 0.72 | 34 | 54 | 36 | 26 |
| 120-130s.png | 100 | 168 | 0.36 | 32 | 54 | 28 | 35 |
| 130-140s.png | 100 | 1 | 0.00 | 255 | 0 | 0 | 0 |

### Every tile, measured (all 1400)

`col` and `row` are the tile's place on its sheet, so `040-050s c5 r4` is the fifth tile across
and the fifth row down. Blank tiles at the end of the recording are marked.


| sheet | col | row | colours | sat | luma | contrast | row | mirror |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 000-010s.png | 0 | 0 | 16 | 0.02 | 6 | 27 | 19 | 8 |
| 000-010s.png | 1 | 0 | 43 | 0.04 | 7 | 32 | 19 | 10 |
| 000-010s.png | 2 | 0 | 59 | 0.10 | 14 | 41 | 22 | 19 |
| 000-010s.png | 3 | 0 | 60 | 0.24 | 31 | 56 | 36 | 34 |
| 000-010s.png | 4 | 0 | 50 | 0.38 | 47 | 63 | 55 | 21 |
| 000-010s.png | 5 | 0 | 45 | 0.56 | 63 | 62 | 46 | 49 |
| 000-010s.png | 6 | 0 | 52 | 0.76 | 73 | 49 | 33 | 47 |
| 000-010s.png | 7 | 0 | 73 | 0.78 | 71 | 45 | 33 | 40 |
| 000-010s.png | 8 | 0 | 69 | 0.76 | 71 | 48 | 38 | 37 |
| 000-010s.png | 9 | 0 | 55 | 0.75 | 70 | 50 | 44 | 23 |
| 000-010s.png | 0 | 1 | 53 | 0.80 | 72 | 49 | 44 | 18 |
| 000-010s.png | 1 | 1 | 55 | 0.79 | 74 | 49 | 43 | 20 |
| 000-010s.png | 2 | 1 | 58 | 0.78 | 76 | 50 | 44 | 22 |
| 000-010s.png | 3 | 1 | 60 | 0.77 | 77 | 52 | 46 | 23 |
| 000-010s.png | 4 | 1 | 52 | 0.77 | 76 | 53 | 47 | 22 |
| 000-010s.png | 5 | 1 | 53 | 0.75 | 75 | 53 | 47 | 21 |
| 000-010s.png | 6 | 1 | 52 | 0.75 | 74 | 52 | 46 | 20 |
| 000-010s.png | 7 | 1 | 53 | 0.76 | 73 | 50 | 44 | 20 |
| 000-010s.png | 8 | 1 | 55 | 0.77 | 71 | 49 | 43 | 19 |
| 000-010s.png | 9 | 1 | 57 | 0.78 | 69 | 48 | 42 | 20 |
| 000-010s.png | 0 | 2 | 63 | 0.82 | 67 | 48 | 42 | 22 |
| 000-010s.png | 1 | 2 | 67 | 0.81 | 64 | 49 | 42 | 22 |
| 000-010s.png | 2 | 2 | 64 | 0.80 | 59 | 52 | 42 | 21 |
| 000-010s.png | 3 | 2 | 64 | 0.79 | 52 | 53 | 42 | 23 |
| 000-010s.png | 4 | 2 | 76 | 0.68 | 31 | 51 | 41 | 21 |
| 000-010s.png | 5 | 2 | 86 | 0.59 | 19 | 43 | 31 | 16 |
| 000-010s.png | 6 | 2 | 74 | 0.33 | 12 | 35 | 19 | 15 |
| 000-010s.png | 7 | 2 | 84 | 0.34 | 17 | 40 | 20 | 20 |
| 000-010s.png | 8 | 2 | 89 | 0.39 | 24 | 45 | 21 | 28 |
| 000-010s.png | 9 | 2 | 90 | 0.43 | 30 | 48 | 24 | 30 |
| 000-010s.png | 0 | 3 | 91 | 0.46 | 34 | 50 | 26 | 39 |
| 000-010s.png | 1 | 3 | 93 | 0.47 | 37 | 51 | 26 | 41 |
| 000-010s.png | 2 | 3 | 95 | 0.48 | 39 | 52 | 26 | 41 |
| 000-010s.png | 3 | 3 | 94 | 0.49 | 40 | 52 | 27 | 40 |
| 000-010s.png | 4 | 3 | 98 | 0.49 | 40 | 51 | 27 | 37 |
| 000-010s.png | 5 | 3 | 91 | 0.49 | 41 | 52 | 28 | 37 |
| 000-010s.png | 6 | 3 | 93 | 0.48 | 42 | 52 | 28 | 37 |
| 000-010s.png | 7 | 3 | 89 | 0.48 | 42 | 52 | 28 | 37 |
| 000-010s.png | 8 | 3 | 89 | 0.49 | 42 | 52 | 28 | 38 |
| 000-010s.png | 9 | 3 | 91 | 0.49 | 43 | 52 | 28 | 39 |
| 000-010s.png | 0 | 4 | 89 | 0.49 | 43 | 53 | 28 | 39 |
| 000-010s.png | 1 | 4 | 83 | 0.48 | 43 | 53 | 28 | 40 |
| 000-010s.png | 2 | 4 | 89 | 0.50 | 44 | 53 | 29 | 41 |
| 000-010s.png | 3 | 4 | 89 | 0.49 | 44 | 53 | 29 | 41 |
| 000-010s.png | 4 | 4 | 94 | 0.49 | 44 | 53 | 29 | 42 |
| 000-010s.png | 5 | 4 | 89 | 0.49 | 45 | 53 | 29 | 42 |
| 000-010s.png | 6 | 4 | 88 | 0.50 | 45 | 53 | 30 | 43 |
| 000-010s.png | 7 | 4 | 93 | 0.51 | 45 | 53 | 30 | 43 |
| 000-010s.png | 8 | 4 | 91 | 0.51 | 45 | 53 | 30 | 43 |
| 000-010s.png | 9 | 4 | 92 | 0.52 | 45 | 53 | 30 | 44 |
| 000-010s.png | 0 | 5 | 91 | 0.53 | 45 | 53 | 30 | 44 |
| 000-010s.png | 1 | 5 | 89 | 0.53 | 45 | 53 | 30 | 44 |
| 000-010s.png | 2 | 5 | 89 | 0.53 | 45 | 53 | 30 | 44 |
| 000-010s.png | 3 | 5 | 88 | 0.53 | 45 | 53 | 30 | 44 |
| 000-010s.png | 4 | 5 | 87 | 0.53 | 45 | 53 | 30 | 44 |
| 000-010s.png | 5 | 5 | 83 | 0.54 | 44 | 52 | 30 | 44 |
| 000-010s.png | 6 | 5 | 83 | 0.52 | 43 | 52 | 30 | 44 |
| 000-010s.png | 7 | 5 | 68 | 0.53 | 43 | 51 | 30 | 46 |
| 000-010s.png | 8 | 5 | 78 | 0.54 | 43 | 51 | 30 | 47 |
| 000-010s.png | 9 | 5 | 74 | 0.55 | 45 | 52 | 31 | 46 |
| 000-010s.png | 0 | 6 | 77 | 0.57 | 50 | 55 | 37 | 43 |
| 000-010s.png | 1 | 6 | 79 | 0.56 | 53 | 57 | 42 | 36 |
| 000-010s.png | 2 | 6 | 82 | 0.59 | 51 | 56 | 40 | 37 |
| 000-010s.png | 3 | 6 | 80 | 0.55 | 41 | 53 | 38 | 32 |
| 000-010s.png | 4 | 6 | 81 | 0.49 | 31 | 51 | 35 | 28 |
| 000-010s.png | 5 | 6 | 69 | 0.40 | 17 | 40 | 25 | 19 |
| 000-010s.png | 6 | 6 | 59 | 0.28 | 10 | 33 | 21 | 12 |
| 000-010s.png | 7 | 6 | 28 | 0.28 | 6 | 30 | 19 | 9 |
| 000-010s.png | 8 | 6 | 14 | 0.27 | 6 | 29 | 19 | 9 |
| 000-010s.png | 9 | 6 | 15 | 0.21 | 6 | 29 | 19 | 9 |
| 000-010s.png | 0 | 7 | 18 | 0.11 | 6 | 29 | 19 | 9 |
| 000-010s.png | 1 | 7 | 24 | 0.11 | 6 | 30 | 19 | 9 |
| 000-010s.png | 2 | 7 | 31 | 0.11 | 6 | 30 | 19 | 9 |
| 000-010s.png | 3 | 7 | 34 | 0.12 | 7 | 30 | 19 | 10 |
| 000-010s.png | 4 | 7 | 41 | 0.17 | 9 | 33 | 20 | 12 |
| 000-010s.png | 5 | 7 | 40 | 0.28 | 16 | 37 | 21 | 16 |
| 000-010s.png | 6 | 7 | 46 | 0.41 | 23 | 41 | 27 | 24 |
| 000-010s.png | 7 | 7 | 44 | 0.47 | 27 | 42 | 29 | 26 |
| 000-010s.png | 8 | 7 | 50 | 0.54 | 31 | 42 | 28 | 33 |
| 000-010s.png | 9 | 7 | 53 | 0.61 | 35 | 42 | 26 | 38 |
| 000-010s.png | 0 | 8 | 54 | 0.63 | 39 | 43 | 25 | 37 |
| 000-010s.png | 1 | 8 | 57 | 0.65 | 41 | 43 | 24 | 36 |
| 000-010s.png | 2 | 8 | 59 | 0.68 | 42 | 43 | 25 | 38 |
| 000-010s.png | 3 | 8 | 59 | 0.70 | 43 | 43 | 27 | 39 |
| 000-010s.png | 4 | 8 | 67 | 0.72 | 44 | 44 | 29 | 37 |
| 000-010s.png | 5 | 8 | 71 | 0.73 | 45 | 44 | 30 | 35 |
| 000-010s.png | 6 | 8 | 76 | 0.73 | 46 | 44 | 32 | 34 |
| 000-010s.png | 7 | 8 | 74 | 0.73 | 46 | 45 | 32 | 34 |
| 000-010s.png | 8 | 8 | 76 | 0.73 | 46 | 45 | 33 | 34 |
| 000-010s.png | 9 | 8 | 76 | 0.73 | 46 | 45 | 33 | 34 |
| 000-010s.png | 0 | 9 | 79 | 0.72 | 47 | 46 | 34 | 34 |
| 000-010s.png | 1 | 9 | 79 | 0.72 | 47 | 46 | 34 | 33 |
| 000-010s.png | 2 | 9 | 76 | 0.72 | 47 | 46 | 34 | 33 |
| 000-010s.png | 3 | 9 | 76 | 0.72 | 47 | 46 | 34 | 33 |
| 000-010s.png | 4 | 9 | 76 | 0.72 | 47 | 46 | 34 | 33 |
| 000-010s.png | 5 | 9 | 77 | 0.72 | 47 | 46 | 34 | 33 |
| 000-010s.png | 6 | 9 | 81 | 0.72 | 47 | 46 | 35 | 33 |
| 000-010s.png | 7 | 9 | 81 | 0.71 | 47 | 46 | 35 | 33 |
| 000-010s.png | 8 | 9 | 79 | 0.71 | 47 | 46 | 35 | 33 |
| 000-010s.png | 9 | 9 | 78 | 0.71 | 47 | 46 | 35 | 33 |
| 010-020s.png | 0 | 0 | 82 | 0.71 | 47 | 46 | 35 | 33 |
| 010-020s.png | 1 | 0 | 83 | 0.72 | 47 | 46 | 35 | 33 |
| 010-020s.png | 2 | 0 | 81 | 0.72 | 47 | 47 | 35 | 33 |
| 010-020s.png | 3 | 0 | 81 | 0.72 | 48 | 47 | 35 | 33 |
| 010-020s.png | 4 | 0 | 81 | 0.72 | 48 | 47 | 35 | 33 |
| 010-020s.png | 5 | 0 | 78 | 0.72 | 48 | 47 | 35 | 33 |
| 010-020s.png | 6 | 0 | 79 | 0.72 | 48 | 47 | 36 | 32 |
| 010-020s.png | 7 | 0 | 78 | 0.70 | 48 | 47 | 36 | 32 |
| 010-020s.png | 8 | 0 | 80 | 0.70 | 48 | 47 | 36 | 32 |
| 010-020s.png | 9 | 0 | 82 | 0.70 | 48 | 47 | 36 | 32 |
| 010-020s.png | 0 | 1 | 81 | 0.70 | 48 | 47 | 36 | 32 |
| 010-020s.png | 1 | 1 | 81 | 0.70 | 48 | 47 | 36 | 32 |
| 010-020s.png | 2 | 1 | 79 | 0.70 | 48 | 47 | 36 | 32 |
| 010-020s.png | 3 | 1 | 90 | 0.69 | 49 | 47 | 37 | 32 |
| 010-020s.png | 4 | 1 | 89 | 0.69 | 49 | 48 | 37 | 32 |
| 010-020s.png | 5 | 1 | 89 | 0.69 | 49 | 48 | 37 | 32 |
| 010-020s.png | 6 | 1 | 90 | 0.70 | 49 | 48 | 37 | 31 |
| 010-020s.png | 7 | 1 | 87 | 0.69 | 49 | 48 | 37 | 31 |
| 010-020s.png | 8 | 1 | 88 | 0.69 | 49 | 48 | 37 | 31 |
| 010-020s.png | 9 | 1 | 88 | 0.69 | 50 | 48 | 37 | 31 |
| 010-020s.png | 0 | 2 | 88 | 0.70 | 50 | 48 | 37 | 31 |
| 010-020s.png | 1 | 2 | 88 | 0.70 | 50 | 48 | 37 | 31 |
| 010-020s.png | 2 | 2 | 89 | 0.70 | 50 | 48 | 38 | 31 |
| 010-020s.png | 3 | 2 | 89 | 0.70 | 50 | 48 | 38 | 31 |
| 010-020s.png | 4 | 2 | 88 | 0.70 | 50 | 48 | 38 | 31 |
| 010-020s.png | 5 | 2 | 93 | 0.70 | 50 | 48 | 38 | 31 |
| 010-020s.png | 6 | 2 | 93 | 0.70 | 50 | 48 | 38 | 31 |
| 010-020s.png | 7 | 2 | 92 | 0.70 | 50 | 48 | 38 | 31 |
| 010-020s.png | 8 | 2 | 92 | 0.71 | 50 | 48 | 38 | 30 |
| 010-020s.png | 9 | 2 | 92 | 0.71 | 50 | 48 | 38 | 30 |
| 010-020s.png | 0 | 3 | 92 | 0.71 | 51 | 48 | 38 | 30 |
| 010-020s.png | 1 | 3 | 92 | 0.70 | 51 | 48 | 38 | 30 |
| 010-020s.png | 2 | 3 | 94 | 0.70 | 51 | 48 | 38 | 30 |
| 010-020s.png | 3 | 3 | 93 | 0.70 | 51 | 48 | 38 | 30 |
| 010-020s.png | 4 | 3 | 92 | 0.70 | 51 | 49 | 38 | 30 |
| 010-020s.png | 5 | 3 | 91 | 0.70 | 51 | 49 | 38 | 30 |
| 010-020s.png | 6 | 3 | 92 | 0.70 | 51 | 49 | 39 | 30 |
| 010-020s.png | 7 | 3 | 93 | 0.69 | 51 | 49 | 39 | 30 |
| 010-020s.png | 8 | 3 | 91 | 0.69 | 51 | 49 | 39 | 30 |
| 010-020s.png | 9 | 3 | 92 | 0.68 | 51 | 49 | 39 | 29 |
| 010-020s.png | 0 | 4 | 91 | 0.69 | 52 | 49 | 39 | 29 |
| 010-020s.png | 1 | 4 | 91 | 0.69 | 52 | 49 | 39 | 29 |
| 010-020s.png | 2 | 4 | 91 | 0.69 | 52 | 49 | 39 | 29 |
| 010-020s.png | 3 | 4 | 92 | 0.68 | 52 | 49 | 39 | 29 |
| 010-020s.png | 4 | 4 | 92 | 0.68 | 52 | 49 | 39 | 29 |
| 010-020s.png | 5 | 4 | 93 | 0.67 | 51 | 49 | 38 | 29 |
| 010-020s.png | 6 | 4 | 90 | 0.65 | 50 | 49 | 38 | 30 |
| 010-020s.png | 7 | 4 | 91 | 0.61 | 48 | 50 | 36 | 32 |
| 010-020s.png | 8 | 4 | 89 | 0.57 | 46 | 50 | 36 | 36 |
| 010-020s.png | 9 | 4 | 85 | 0.54 | 44 | 50 | 39 | 27 |
| 010-020s.png | 0 | 5 | 78 | 0.70 | 55 | 46 | 32 | 32 |
| 010-020s.png | 1 | 5 | 78 | 0.71 | 61 | 47 | 34 | 27 |
| 010-020s.png | 2 | 5 | 79 | 0.62 | 57 | 52 | 39 | 27 |
| 010-020s.png | 3 | 5 | 84 | 0.58 | 52 | 53 | 44 | 23 |
| 010-020s.png | 4 | 5 | 74 | 0.62 | 52 | 51 | 39 | 35 |
| 010-020s.png | 5 | 5 | 77 | 0.65 | 54 | 52 | 37 | 40 |
| 010-020s.png | 6 | 5 | 76 | 0.67 | 58 | 55 | 38 | 44 |
| 010-020s.png | 7 | 5 | 78 | 0.64 | 64 | 58 | 38 | 46 |
| 010-020s.png | 8 | 5 | 86 | 0.64 | 69 | 60 | 37 | 53 |
| 010-020s.png | 9 | 5 | 80 | 0.64 | 72 | 62 | 35 | 63 |
| 010-020s.png | 0 | 6 | 84 | 0.66 | 76 | 64 | 35 | 71 |
| 010-020s.png | 1 | 6 | 81 | 0.65 | 78 | 65 | 35 | 76 |
| 010-020s.png | 2 | 6 | 82 | 0.64 | 80 | 66 | 36 | 80 |
| 010-020s.png | 3 | 6 | 80 | 0.64 | 81 | 66 | 36 | 81 |
| 010-020s.png | 4 | 6 | 84 | 0.64 | 81 | 67 | 36 | 81 |
| 010-020s.png | 5 | 6 | 84 | 0.64 | 81 | 67 | 36 | 81 |
| 010-020s.png | 6 | 6 | 87 | 0.64 | 81 | 67 | 37 | 81 |
| 010-020s.png | 7 | 6 | 86 | 0.64 | 81 | 67 | 37 | 81 |
| 010-020s.png | 8 | 6 | 86 | 0.62 | 81 | 67 | 37 | 81 |
| 010-020s.png | 9 | 6 | 88 | 0.62 | 80 | 67 | 37 | 81 |
| 010-020s.png | 0 | 7 | 89 | 0.63 | 80 | 67 | 37 | 81 |
| 010-020s.png | 1 | 7 | 88 | 0.62 | 80 | 67 | 37 | 81 |
| 010-020s.png | 2 | 7 | 88 | 0.62 | 80 | 67 | 37 | 81 |
| 010-020s.png | 3 | 7 | 89 | 0.62 | 80 | 67 | 37 | 81 |
| 010-020s.png | 4 | 7 | 88 | 0.62 | 79 | 67 | 37 | 81 |
| 010-020s.png | 5 | 7 | 89 | 0.62 | 79 | 67 | 37 | 82 |
| 010-020s.png | 6 | 7 | 89 | 0.63 | 79 | 67 | 37 | 82 |
| 010-020s.png | 7 | 7 | 88 | 0.63 | 79 | 67 | 37 | 82 |
| 010-020s.png | 8 | 7 | 87 | 0.63 | 79 | 67 | 36 | 82 |
| 010-020s.png | 9 | 7 | 87 | 0.64 | 78 | 67 | 36 | 82 |
| 010-020s.png | 0 | 8 | 85 | 0.63 | 78 | 67 | 36 | 82 |
| 010-020s.png | 1 | 8 | 87 | 0.63 | 78 | 67 | 36 | 82 |
| 010-020s.png | 2 | 8 | 86 | 0.64 | 78 | 67 | 36 | 82 |
| 010-020s.png | 3 | 8 | 85 | 0.64 | 78 | 67 | 36 | 82 |
| 010-020s.png | 4 | 8 | 86 | 0.64 | 77 | 67 | 36 | 82 |
| 010-020s.png | 5 | 8 | 88 | 0.64 | 77 | 67 | 36 | 82 |
| 010-020s.png | 6 | 8 | 87 | 0.64 | 77 | 67 | 36 | 82 |
| 010-020s.png | 7 | 8 | 88 | 0.65 | 77 | 67 | 36 | 82 |
| 010-020s.png | 8 | 8 | 88 | 0.64 | 77 | 67 | 36 | 82 |
| 010-020s.png | 9 | 8 | 94 | 0.64 | 76 | 67 | 36 | 82 |
| 010-020s.png | 0 | 9 | 88 | 0.65 | 76 | 67 | 36 | 82 |
| 010-020s.png | 1 | 9 | 90 | 0.65 | 76 | 67 | 37 | 82 |
| 010-020s.png | 2 | 9 | 91 | 0.65 | 76 | 67 | 37 | 82 |
| 010-020s.png | 3 | 9 | 95 | 0.65 | 76 | 67 | 37 | 82 |
| 010-020s.png | 4 | 9 | 99 | 0.66 | 75 | 67 | 37 | 82 |
| 010-020s.png | 5 | 9 | 99 | 0.66 | 75 | 67 | 37 | 82 |
| 010-020s.png | 6 | 9 | 96 | 0.66 | 75 | 67 | 37 | 82 |
| 010-020s.png | 7 | 9 | 98 | 0.66 | 75 | 67 | 37 | 82 |
| 010-020s.png | 8 | 9 | 93 | 0.66 | 75 | 67 | 37 | 82 |
| 010-020s.png | 9 | 9 | 93 | 0.66 | 74 | 67 | 37 | 82 |
| 020-030s.png | 0 | 0 | 89 | 0.67 | 74 | 67 | 37 | 82 |
| 020-030s.png | 1 | 0 | 89 | 0.67 | 74 | 66 | 37 | 82 |
| 020-030s.png | 2 | 0 | 88 | 0.67 | 74 | 66 | 37 | 82 |
| 020-030s.png | 3 | 0 | 91 | 0.67 | 74 | 66 | 37 | 82 |
| 020-030s.png | 4 | 0 | 89 | 0.67 | 73 | 66 | 37 | 81 |
| 020-030s.png | 5 | 0 | 91 | 0.67 | 73 | 66 | 37 | 81 |
| 020-030s.png | 6 | 0 | 91 | 0.67 | 73 | 66 | 37 | 81 |
| 020-030s.png | 7 | 0 | 89 | 0.67 | 73 | 66 | 37 | 81 |
| 020-030s.png | 8 | 0 | 89 | 0.68 | 73 | 66 | 37 | 81 |
| 020-030s.png | 9 | 0 | 91 | 0.68 | 72 | 66 | 37 | 81 |
| 020-030s.png | 0 | 1 | 91 | 0.67 | 72 | 66 | 37 | 81 |
| 020-030s.png | 1 | 1 | 88 | 0.67 | 72 | 66 | 37 | 81 |
| 020-030s.png | 2 | 1 | 87 | 0.67 | 72 | 66 | 37 | 81 |
| 020-030s.png | 3 | 1 | 85 | 0.67 | 71 | 66 | 37 | 80 |
| 020-030s.png | 4 | 1 | 85 | 0.68 | 71 | 66 | 37 | 80 |
| 020-030s.png | 5 | 1 | 85 | 0.68 | 71 | 65 | 37 | 80 |
| 020-030s.png | 6 | 1 | 86 | 0.68 | 71 | 65 | 38 | 80 |
| 020-030s.png | 7 | 1 | 88 | 0.68 | 71 | 65 | 38 | 80 |
| 020-030s.png | 8 | 1 | 87 | 0.68 | 70 | 65 | 38 | 79 |
| 020-030s.png | 9 | 1 | 91 | 0.74 | 69 | 65 | 36 | 78 |
| 020-030s.png | 0 | 2 | 94 | 0.75 | 66 | 64 | 34 | 76 |
| 020-030s.png | 1 | 2 | 96 | 0.74 | 61 | 64 | 31 | 73 |
| 020-030s.png | 2 | 2 | 90 | 0.66 | 52 | 61 | 28 | 69 |
| 020-030s.png | 3 | 2 | 88 | 0.67 | 43 | 56 | 28 | 60 |
| 020-030s.png | 4 | 2 | 84 | 0.73 | 42 | 53 | 29 | 52 |
| 020-030s.png | 5 | 2 | 97 | 0.79 | 45 | 49 | 28 | 50 |
| 020-030s.png | 6 | 2 | 97 | 0.79 | 46 | 48 | 27 | 46 |
| 020-030s.png | 7 | 2 | 98 | 0.77 | 58 | 50 | 32 | 45 |
| 020-030s.png | 8 | 2 | 95 | 0.74 | 73 | 55 | 39 | 45 |
| 020-030s.png | 9 | 2 | 98 | 0.70 | 77 | 57 | 38 | 48 |
| 020-030s.png | 0 | 3 | 96 | 0.65 | 76 | 59 | 37 | 42 |
| 020-030s.png | 1 | 3 | 105 | 0.62 | 70 | 62 | 30 | 44 |
| 020-030s.png | 2 | 3 | 106 | 0.61 | 62 | 63 | 26 | 44 |
| 020-030s.png | 3 | 3 | 110 | 0.61 | 52 | 62 | 24 | 44 |
| 020-030s.png | 4 | 3 | 97 | 0.62 | 44 | 58 | 24 | 44 |
| 020-030s.png | 5 | 3 | 81 | 0.62 | 38 | 54 | 26 | 41 |
| 020-030s.png | 6 | 3 | 85 | 0.62 | 37 | 53 | 28 | 39 |
| 020-030s.png | 7 | 3 | 91 | 0.63 | 37 | 53 | 29 | 37 |
| 020-030s.png | 8 | 3 | 81 | 0.63 | 38 | 53 | 30 | 32 |
| 020-030s.png | 9 | 3 | 85 | 0.75 | 38 | 54 | 31 | 27 |
| 020-030s.png | 0 | 4 | 86 | 0.80 | 38 | 54 | 32 | 23 |
| 020-030s.png | 1 | 4 | 82 | 0.78 | 38 | 54 | 33 | 19 |
| 020-030s.png | 2 | 4 | 80 | 0.78 | 38 | 54 | 33 | 16 |
| 020-030s.png | 3 | 4 | 80 | 0.78 | 37 | 54 | 34 | 14 |
| 020-030s.png | 4 | 4 | 81 | 0.78 | 37 | 54 | 34 | 13 |
| 020-030s.png | 5 | 4 | 81 | 0.78 | 37 | 54 | 34 | 13 |
| 020-030s.png | 6 | 4 | 82 | 0.78 | 37 | 54 | 34 | 14 |
| 020-030s.png | 7 | 4 | 79 | 0.78 | 37 | 54 | 34 | 15 |
| 020-030s.png | 8 | 4 | 82 | 0.78 | 37 | 54 | 34 | 16 |
| 020-030s.png | 9 | 4 | 82 | 0.79 | 37 | 54 | 34 | 17 |
| 020-030s.png | 0 | 5 | 82 | 0.74 | 37 | 54 | 33 | 18 |
| 020-030s.png | 1 | 5 | 82 | 0.74 | 37 | 54 | 33 | 19 |
| 020-030s.png | 2 | 5 | 83 | 0.74 | 37 | 54 | 33 | 19 |
| 020-030s.png | 3 | 5 | 83 | 0.75 | 37 | 54 | 33 | 20 |
| 020-030s.png | 4 | 5 | 80 | 0.74 | 37 | 54 | 33 | 21 |
| 020-030s.png | 5 | 5 | 79 | 0.74 | 37 | 54 | 33 | 22 |
| 020-030s.png | 6 | 5 | 81 | 0.74 | 37 | 54 | 33 | 23 |
| 020-030s.png | 7 | 5 | 80 | 0.74 | 37 | 54 | 33 | 23 |
| 020-030s.png | 8 | 5 | 80 | 0.74 | 37 | 54 | 33 | 24 |
| 020-030s.png | 9 | 5 | 80 | 0.75 | 37 | 54 | 33 | 25 |
| 020-030s.png | 0 | 6 | 77 | 0.75 | 37 | 54 | 32 | 26 |
| 020-030s.png | 1 | 6 | 82 | 0.74 | 36 | 54 | 32 | 27 |
| 020-030s.png | 2 | 6 | 79 | 0.75 | 36 | 54 | 32 | 27 |
| 020-030s.png | 3 | 6 | 78 | 0.75 | 36 | 54 | 32 | 28 |
| 020-030s.png | 4 | 6 | 77 | 0.73 | 37 | 54 | 32 | 29 |
| 020-030s.png | 5 | 6 | 79 | 0.73 | 37 | 54 | 32 | 29 |
| 020-030s.png | 6 | 6 | 79 | 0.73 | 37 | 54 | 31 | 30 |
| 020-030s.png | 7 | 6 | 77 | 0.73 | 37 | 54 | 31 | 30 |
| 020-030s.png | 8 | 6 | 78 | 0.73 | 36 | 54 | 31 | 31 |
| 020-030s.png | 9 | 6 | 80 | 0.73 | 36 | 54 | 31 | 31 |
| 020-030s.png | 0 | 7 | 79 | 0.76 | 36 | 54 | 31 | 32 |
| 020-030s.png | 1 | 7 | 81 | 0.74 | 36 | 53 | 31 | 32 |
| 020-030s.png | 2 | 7 | 79 | 0.74 | 36 | 53 | 31 | 33 |
| 020-030s.png | 3 | 7 | 79 | 0.75 | 36 | 53 | 31 | 33 |
| 020-030s.png | 4 | 7 | 80 | 0.74 | 36 | 53 | 30 | 34 |
| 020-030s.png | 5 | 7 | 78 | 0.74 | 36 | 53 | 30 | 34 |
| 020-030s.png | 6 | 7 | 78 | 0.75 | 36 | 53 | 30 | 35 |
| 020-030s.png | 7 | 7 | 79 | 0.75 | 35 | 53 | 30 | 35 |
| 020-030s.png | 8 | 7 | 79 | 0.75 | 35 | 53 | 30 | 36 |
| 020-030s.png | 9 | 7 | 79 | 0.74 | 35 | 53 | 30 | 36 |
| 020-030s.png | 0 | 8 | 80 | 0.77 | 35 | 53 | 30 | 37 |
| 020-030s.png | 1 | 8 | 84 | 0.75 | 35 | 53 | 30 | 37 |
| 020-030s.png | 2 | 8 | 83 | 0.75 | 35 | 53 | 29 | 37 |
| 020-030s.png | 3 | 8 | 85 | 0.75 | 35 | 53 | 29 | 37 |
| 020-030s.png | 4 | 8 | 84 | 0.75 | 35 | 53 | 29 | 38 |
| 020-030s.png | 5 | 8 | 84 | 0.75 | 35 | 53 | 29 | 38 |
| 020-030s.png | 6 | 8 | 83 | 0.75 | 34 | 53 | 29 | 38 |
| 020-030s.png | 7 | 8 | 83 | 0.75 | 34 | 53 | 29 | 38 |
| 020-030s.png | 8 | 8 | 80 | 0.75 | 34 | 53 | 29 | 38 |
| 020-030s.png | 9 | 8 | 80 | 0.75 | 34 | 53 | 29 | 38 |
| 020-030s.png | 0 | 9 | 80 | 0.77 | 34 | 53 | 29 | 38 |
| 020-030s.png | 1 | 9 | 83 | 0.75 | 34 | 53 | 28 | 39 |
| 020-030s.png | 2 | 9 | 83 | 0.75 | 34 | 53 | 28 | 39 |
| 020-030s.png | 3 | 9 | 83 | 0.74 | 33 | 52 | 28 | 39 |
| 020-030s.png | 4 | 9 | 84 | 0.75 | 33 | 52 | 28 | 39 |
| 020-030s.png | 5 | 9 | 81 | 0.75 | 33 | 52 | 28 | 39 |
| 020-030s.png | 6 | 9 | 81 | 0.74 | 33 | 53 | 28 | 39 |
| 020-030s.png | 7 | 9 | 79 | 0.74 | 33 | 53 | 28 | 40 |
| 020-030s.png | 8 | 9 | 81 | 0.74 | 33 | 52 | 27 | 39 |
| 020-030s.png | 9 | 9 | 81 | 0.74 | 30 | 50 | 26 | 35 |
| 030-040s.png | 0 | 0 | 86 | 0.76 | 35 | 55 | 30 | 41 |
| 030-040s.png | 1 | 0 | 85 | 0.72 | 34 | 54 | 29 | 41 |
| 030-040s.png | 2 | 0 | 79 | 0.72 | 33 | 54 | 28 | 43 |
| 030-040s.png | 3 | 0 | 84 | 0.73 | 36 | 56 | 29 | 52 |
| 030-040s.png | 4 | 0 | 82 | 0.75 | 31 | 51 | 25 | 39 |
| 030-040s.png | 5 | 0 | 83 | 0.75 | 32 | 51 | 27 | 33 |
| 030-040s.png | 6 | 0 | 88 | 0.64 | 42 | 57 | 34 | 46 |
| 030-040s.png | 7 | 0 | 94 | 0.62 | 47 | 60 | 38 | 45 |
| 030-040s.png | 8 | 0 | 90 | 0.63 | 44 | 58 | 33 | 52 |
| 030-040s.png | 9 | 0 | 86 | 0.65 | 40 | 55 | 29 | 49 |
| 030-040s.png | 0 | 1 | 81 | 0.69 | 38 | 54 | 28 | 44 |
| 030-040s.png | 1 | 1 | 76 | 0.68 | 39 | 55 | 28 | 44 |
| 030-040s.png | 2 | 1 | 77 | 0.69 | 39 | 55 | 29 | 44 |
| 030-040s.png | 3 | 1 | 77 | 0.69 | 38 | 56 | 29 | 43 |
| 030-040s.png | 4 | 1 | 76 | 0.69 | 38 | 56 | 29 | 43 |
| 030-040s.png | 5 | 1 | 76 | 0.69 | 38 | 56 | 30 | 42 |
| 030-040s.png | 6 | 1 | 75 | 0.68 | 38 | 56 | 30 | 42 |
| 030-040s.png | 7 | 1 | 79 | 0.69 | 38 | 56 | 30 | 42 |
| 030-040s.png | 8 | 1 | 78 | 0.69 | 38 | 56 | 31 | 42 |
| 030-040s.png | 9 | 1 | 75 | 0.69 | 37 | 56 | 31 | 41 |
| 030-040s.png | 0 | 2 | 73 | 0.71 | 37 | 56 | 31 | 41 |
| 030-040s.png | 1 | 2 | 77 | 0.70 | 37 | 56 | 31 | 41 |
| 030-040s.png | 2 | 2 | 76 | 0.68 | 37 | 56 | 31 | 41 |
| 030-040s.png | 3 | 2 | 77 | 0.68 | 37 | 56 | 31 | 41 |
| 030-040s.png | 4 | 2 | 78 | 0.68 | 37 | 56 | 31 | 41 |
| 030-040s.png | 5 | 2 | 78 | 0.68 | 36 | 56 | 31 | 41 |
| 030-040s.png | 6 | 2 | 79 | 0.68 | 36 | 56 | 31 | 40 |
| 030-040s.png | 7 | 2 | 80 | 0.68 | 36 | 56 | 31 | 40 |
| 030-040s.png | 8 | 2 | 81 | 0.68 | 36 | 56 | 31 | 40 |
| 030-040s.png | 9 | 2 | 79 | 0.67 | 36 | 56 | 30 | 40 |
| 030-040s.png | 0 | 3 | 79 | 0.68 | 36 | 56 | 30 | 40 |
| 030-040s.png | 1 | 3 | 78 | 0.66 | 35 | 56 | 30 | 40 |
| 030-040s.png | 2 | 3 | 80 | 0.68 | 35 | 56 | 30 | 40 |
| 030-040s.png | 3 | 3 | 78 | 0.67 | 35 | 55 | 30 | 40 |
| 030-040s.png | 4 | 3 | 79 | 0.67 | 34 | 55 | 29 | 38 |
| 030-040s.png | 5 | 3 | 78 | 0.66 | 34 | 54 | 29 | 38 |
| 030-040s.png | 6 | 3 | 75 | 0.66 | 35 | 55 | 30 | 40 |
| 030-040s.png | 7 | 3 | 76 | 0.65 | 35 | 55 | 30 | 40 |
| 030-040s.png | 8 | 3 | 76 | 0.66 | 34 | 55 | 30 | 40 |
| 030-040s.png | 9 | 3 | 76 | 0.64 | 35 | 55 | 29 | 41 |
| 030-040s.png | 0 | 4 | 78 | 0.67 | 35 | 56 | 29 | 41 |
| 030-040s.png | 1 | 4 | 75 | 0.67 | 35 | 56 | 29 | 41 |
| 030-040s.png | 2 | 4 | 80 | 0.67 | 35 | 56 | 30 | 41 |
| 030-040s.png | 3 | 4 | 77 | 0.62 | 35 | 56 | 30 | 42 |
| 030-040s.png | 4 | 4 | 77 | 0.63 | 36 | 57 | 30 | 42 |
| 030-040s.png | 5 | 4 | 77 | 0.63 | 36 | 57 | 30 | 42 |
| 030-040s.png | 6 | 4 | 76 | 0.63 | 36 | 57 | 30 | 43 |
| 030-040s.png | 7 | 4 | 77 | 0.62 | 36 | 58 | 30 | 44 |
| 030-040s.png | 8 | 4 | 76 | 0.62 | 37 | 58 | 30 | 44 |
| 030-040s.png | 9 | 4 | 77 | 0.62 | 37 | 58 | 30 | 44 |
| 030-040s.png | 0 | 5 | 74 | 0.57 | 37 | 59 | 30 | 45 |
| 030-040s.png | 1 | 5 | 76 | 0.56 | 37 | 59 | 30 | 46 |
| 030-040s.png | 2 | 5 | 77 | 0.56 | 38 | 59 | 30 | 46 |
| 030-040s.png | 3 | 5 | 74 | 0.57 | 38 | 60 | 30 | 47 |
| 030-040s.png | 4 | 5 | 73 | 0.57 | 38 | 60 | 30 | 47 |
| 030-040s.png | 5 | 5 | 74 | 0.57 | 39 | 60 | 30 | 48 |
| 030-040s.png | 6 | 5 | 74 | 0.57 | 39 | 61 | 30 | 49 |
| 030-040s.png | 7 | 5 | 72 | 0.56 | 39 | 61 | 30 | 49 |
| 030-040s.png | 8 | 5 | 75 | 0.56 | 40 | 61 | 30 | 50 |
| 030-040s.png | 9 | 5 | 74 | 0.56 | 40 | 62 | 30 | 50 |
| 030-040s.png | 0 | 6 | 76 | 0.58 | 41 | 62 | 30 | 51 |
| 030-040s.png | 1 | 6 | 76 | 0.57 | 41 | 62 | 30 | 52 |
| 030-040s.png | 2 | 6 | 76 | 0.57 | 41 | 63 | 30 | 52 |
| 030-040s.png | 3 | 6 | 74 | 0.58 | 41 | 63 | 30 | 53 |
| 030-040s.png | 4 | 6 | 73 | 0.54 | 42 | 63 | 30 | 54 |
| 030-040s.png | 5 | 6 | 72 | 0.54 | 42 | 63 | 30 | 54 |
| 030-040s.png | 6 | 6 | 73 | 0.53 | 42 | 64 | 30 | 55 |
| 030-040s.png | 7 | 6 | 74 | 0.53 | 42 | 64 | 29 | 56 |
| 030-040s.png | 8 | 6 | 73 | 0.53 | 42 | 64 | 29 | 58 |
| 030-040s.png | 9 | 6 | 75 | 0.52 | 44 | 66 | 30 | 63 |
| 030-040s.png | 0 | 7 | 73 | 0.52 | 52 | 70 | 37 | 58 |
| 030-040s.png | 1 | 7 | 78 | 0.52 | 53 | 69 | 39 | 56 |
| 030-040s.png | 2 | 7 | 74 | 0.53 | 49 | 67 | 36 | 58 |
| 030-040s.png | 3 | 7 | 72 | 0.54 | 44 | 64 | 34 | 57 |
| 030-040s.png | 4 | 7 | 69 | 0.54 | 38 | 60 | 32 | 53 |
| 030-040s.png | 5 | 7 | 65 | 0.54 | 31 | 56 | 30 | 44 |
| 030-040s.png | 6 | 7 | 66 | 0.55 | 25 | 51 | 29 | 33 |
| 030-040s.png | 7 | 7 | 65 | 0.56 | 20 | 47 | 28 | 25 |
| 030-040s.png | 8 | 7 | 61 | 0.57 | 17 | 44 | 28 | 21 |
| 030-040s.png | 9 | 7 | 32 | 0.50 | 13 | 40 | 24 | 21 |
| 030-040s.png | 0 | 8 | 16 | 0.17 | 8 | 33 | 19 | 13 |
| 030-040s.png | 1 | 8 | 16 | 0.17 | 7 | 31 | 19 | 11 |
| 030-040s.png | 2 | 8 | 10 | 0.15 | 4 | 26 | 16 | 8 |
| 030-040s.png | 3 | 8 | 10 | 0.15 | 4 | 26 | 16 | 8 |
| 030-040s.png | 4 | 8 | 10 | 0.16 | 5 | 27 | 16 | 9 |
| 030-040s.png | 5 | 8 | 11 | 0.32 | 9 | 28 | 17 | 10 |
| 030-040s.png | 6 | 8 | 15 | 0.44 | 16 | 32 | 21 | 10 |
| 030-040s.png | 7 | 8 | 19 | 0.51 | 25 | 38 | 29 | 10 |
| 030-040s.png | 8 | 8 | 23 | 0.56 | 33 | 43 | 36 | 10 |
| 030-040s.png | 9 | 8 | 31 | 0.59 | 42 | 49 | 43 | 10 |
| 030-040s.png | 0 | 9 | 31 | 0.61 | 53 | 56 | 49 | 10 |
| 030-040s.png | 1 | 9 | 35 | 0.62 | 58 | 59 | 51 | 10 |
| 030-040s.png | 2 | 9 | 36 | 0.64 | 65 | 63 | 51 | 10 |
| 030-040s.png | 3 | 9 | 44 | 0.64 | 69 | 67 | 45 | 10 |
| 030-040s.png | 4 | 9 | 50 | 0.66 | 63 | 69 | 37 | 10 |
| 030-040s.png | 5 | 9 | 63 | 0.65 | 52 | 69 | 37 | 15 |
| 030-040s.png | 6 | 9 | 63 | 0.64 | 43 | 67 | 37 | 16 |
| 030-040s.png | 7 | 9 | 60 | 0.63 | 38 | 65 | 35 | 14 |
| 030-040s.png | 8 | 9 | 67 | 0.63 | 35 | 64 | 35 | 12 |
| 030-040s.png | 9 | 9 | 65 | 0.62 | 33 | 63 | 34 | 12 |
| 040-050s.png | 0 | 0 | 69 | 0.60 | 31 | 62 | 34 | 11 |
| 040-050s.png | 1 | 0 | 70 | 0.60 | 30 | 62 | 33 | 11 |
| 040-050s.png | 2 | 0 | 72 | 0.60 | 30 | 61 | 33 | 11 |
| 040-050s.png | 3 | 0 | 70 | 0.60 | 29 | 60 | 32 | 11 |
| 040-050s.png | 4 | 0 | 69 | 0.60 | 28 | 59 | 32 | 11 |
| 040-050s.png | 5 | 0 | 66 | 0.24 | 27 | 58 | 31 | 11 |
| 040-050s.png | 6 | 0 | 65 | 0.24 | 27 | 57 | 31 | 11 |
| 040-050s.png | 7 | 0 | 64 | 0.24 | 26 | 56 | 31 | 11 |
| 040-050s.png | 8 | 0 | 62 | 0.25 | 26 | 55 | 30 | 11 |
| 040-050s.png | 9 | 0 | 63 | 0.25 | 26 | 55 | 30 | 11 |
| 040-050s.png | 0 | 1 | 65 | 0.21 | 25 | 54 | 30 | 11 |
| 040-050s.png | 1 | 1 | 63 | 0.20 | 25 | 54 | 30 | 11 |
| 040-050s.png | 2 | 1 | 60 | 0.20 | 25 | 53 | 29 | 11 |
| 040-050s.png | 3 | 1 | 60 | 0.20 | 24 | 52 | 28 | 11 |
| 040-050s.png | 4 | 1 | 61 | 0.20 | 24 | 52 | 28 | 11 |
| 040-050s.png | 5 | 1 | 60 | 0.21 | 24 | 51 | 27 | 11 |
| 040-050s.png | 6 | 1 | 59 | 0.22 | 24 | 51 | 27 | 11 |
| 040-050s.png | 7 | 1 | 65 | 0.23 | 23 | 51 | 27 | 11 |
| 040-050s.png | 8 | 1 | 64 | 0.23 | 23 | 50 | 27 | 11 |
| 040-050s.png | 9 | 1 | 65 | 0.23 | 23 | 50 | 27 | 11 |
| 040-050s.png | 0 | 2 | 65 | 0.36 | 23 | 50 | 26 | 11 |
| 040-050s.png | 1 | 2 | 64 | 0.35 | 23 | 50 | 26 | 11 |
| 040-050s.png | 2 | 2 | 61 | 0.35 | 23 | 50 | 26 | 11 |
| 040-050s.png | 3 | 2 | 62 | 0.35 | 23 | 50 | 26 | 11 |
| 040-050s.png | 4 | 2 | 59 | 0.36 | 23 | 50 | 26 | 11 |
| 040-050s.png | 5 | 2 | 65 | 0.62 | 23 | 50 | 26 | 11 |
| 040-050s.png | 6 | 2 | 61 | 0.62 | 23 | 51 | 26 | 11 |
| 040-050s.png | 7 | 2 | 61 | 0.60 | 24 | 51 | 26 | 12 |
| 040-050s.png | 8 | 2 | 65 | 0.60 | 24 | 51 | 26 | 12 |
| 040-050s.png | 9 | 2 | 64 | 0.59 | 24 | 52 | 26 | 12 |
| 040-050s.png | 0 | 3 | 65 | 0.56 | 24 | 52 | 26 | 12 |
| 040-050s.png | 1 | 3 | 66 | 0.55 | 24 | 53 | 26 | 12 |
| 040-050s.png | 2 | 3 | 65 | 0.55 | 25 | 53 | 26 | 12 |
| 040-050s.png | 3 | 3 | 68 | 0.55 | 25 | 53 | 26 | 12 |
| 040-050s.png | 4 | 3 | 70 | 0.28 | 25 | 54 | 27 | 11 |
| 040-050s.png | 5 | 3 | 71 | 0.28 | 25 | 54 | 27 | 11 |
| 040-050s.png | 6 | 3 | 70 | 0.29 | 25 | 55 | 27 | 11 |
| 040-050s.png | 7 | 3 | 69 | 0.25 | 26 | 55 | 27 | 11 |
| 040-050s.png | 8 | 3 | 69 | 0.25 | 26 | 55 | 28 | 11 |
| 040-050s.png | 9 | 3 | 69 | 0.25 | 26 | 56 | 28 | 11 |
| 040-050s.png | 0 | 4 | 70 | 0.25 | 26 | 56 | 28 | 11 |
| 040-050s.png | 1 | 4 | 69 | 0.24 | 27 | 57 | 28 | 11 |
| 040-050s.png | 2 | 4 | 69 | 0.24 | 27 | 57 | 29 | 11 |
| 040-050s.png | 3 | 4 | 68 | 0.24 | 27 | 57 | 29 | 11 |
| 040-050s.png | 4 | 4 | 71 | 0.24 | 27 | 58 | 29 | 11 |
| 040-050s.png | 5 | 4 | 69 | 0.24 | 28 | 58 | 29 | 11 |
| 040-050s.png | 6 | 4 | 69 | 0.24 | 28 | 58 | 30 | 11 |
| 040-050s.png | 7 | 4 | 69 | 0.24 | 28 | 59 | 30 | 11 |
| 040-050s.png | 8 | 4 | 72 | 0.24 | 28 | 59 | 30 | 11 |
| 040-050s.png | 9 | 4 | 72 | 0.24 | 28 | 59 | 31 | 11 |
| 040-050s.png | 0 | 5 | 73 | 0.22 | 29 | 59 | 31 | 11 |
| 040-050s.png | 1 | 5 | 72 | 0.21 | 29 | 60 | 31 | 11 |
| 040-050s.png | 2 | 5 | 73 | 0.21 | 29 | 60 | 31 | 11 |
| 040-050s.png | 3 | 5 | 75 | 0.22 | 29 | 60 | 32 | 11 |
| 040-050s.png | 4 | 5 | 76 | 0.22 | 29 | 60 | 32 | 11 |
| 040-050s.png | 5 | 5 | 75 | 0.22 | 30 | 61 | 32 | 11 |
| 040-050s.png | 6 | 5 | 75 | 0.22 | 30 | 61 | 32 | 11 |
| 040-050s.png | 7 | 5 | 72 | 0.22 | 30 | 61 | 32 | 11 |
| 040-050s.png | 8 | 5 | 72 | 0.18 | 27 | 59 | 30 | 11 |
| 040-050s.png | 9 | 5 | 70 | 0.17 | 23 | 55 | 28 | 11 |
| 040-050s.png | 0 | 6 | 65 | 0.21 | 18 | 48 | 24 | 11 |
| 040-050s.png | 1 | 6 | 43 | 0.20 | 11 | 38 | 21 | 11 |
| 040-050s.png | 2 | 6 | 19 | 0.20 | 9 | 35 | 21 | 11 |
| 040-050s.png | 3 | 6 | 18 | 0.18 | 9 | 35 | 21 | 11 |
| 040-050s.png | 4 | 6 | 18 | 0.19 | 9 | 35 | 21 | 11 |
| 040-050s.png | 5 | 6 | 18 | 0.19 | 9 | 35 | 21 | 13 |
| 040-050s.png | 6 | 6 | 18 | 0.19 | 9 | 35 | 21 | 15 |
| 040-050s.png | 7 | 6 | 20 | 0.19 | 9 | 33 | 20 | 16 |
| 040-050s.png | 8 | 6 | 17 | 0.12 | 6 | 29 | 17 | 11 |
| 040-050s.png | 9 | 6 | 17 | 0.12 | 5 | 28 | 17 | 10 |
| 040-050s.png | 0 | 7 | 18 | 0.01 | 5 | 28 | 17 | 9 |
| 040-050s.png | 1 | 7 | 15 | 0.00 | 5 | 28 | 17 | 9 |
| 040-050s.png | 2 | 7 | 15 | 0.01 | 5 | 28 | 17 | 9 |
| 040-050s.png | 3 | 7 | 15 | 0.06 | 6 | 28 | 17 | 10 |
| 040-050s.png | 4 | 7 | 18 | 0.18 | 8 | 29 | 17 | 10 |
| 040-050s.png | 5 | 7 | 32 | 0.39 | 22 | 39 | 24 | 10 |
| 040-050s.png | 6 | 7 | 44 | 0.60 | 44 | 50 | 27 | 10 |
| 040-050s.png | 7 | 7 | 56 | 0.72 | 59 | 50 | 25 | 10 |
| 040-050s.png | 8 | 7 | 67 | 0.78 | 65 | 46 | 26 | 10 |
| 040-050s.png | 9 | 7 | 148 | 0.77 | 70 | 46 | 28 | 14 |
| 040-050s.png | 0 | 8 | 204 | 0.74 | 76 | 50 | 32 | 23 |
| 040-050s.png | 1 | 8 | 222 | 0.73 | 80 | 54 | 35 | 25 |
| 040-050s.png | 2 | 8 | 232 | 0.73 | 82 | 54 | 36 | 22 |
| 040-050s.png | 3 | 8 | 233 | 0.73 | 82 | 55 | 36 | 19 |
| 040-050s.png | 4 | 8 | 230 | 0.73 | 83 | 55 | 37 | 17 |
| 040-050s.png | 5 | 8 | 225 | 0.73 | 83 | 55 | 37 | 17 |
| 040-050s.png | 6 | 8 | 227 | 0.73 | 83 | 55 | 37 | 17 |
| 040-050s.png | 7 | 8 | 229 | 0.73 | 83 | 55 | 37 | 17 |
| 040-050s.png | 8 | 8 | 236 | 0.73 | 83 | 55 | 37 | 17 |
| 040-050s.png | 9 | 8 | 241 | 0.72 | 82 | 54 | 37 | 17 |
| 040-050s.png | 0 | 9 | 232 | 0.72 | 82 | 54 | 36 | 17 |
| 040-050s.png | 1 | 9 | 228 | 0.72 | 81 | 54 | 36 | 17 |
| 040-050s.png | 2 | 9 | 226 | 0.72 | 81 | 53 | 36 | 17 |
| 040-050s.png | 3 | 9 | 236 | 0.72 | 81 | 53 | 36 | 17 |
| 040-050s.png | 4 | 9 | 224 | 0.72 | 80 | 53 | 36 | 17 |
| 040-050s.png | 5 | 9 | 232 | 0.72 | 80 | 52 | 36 | 17 |
| 040-050s.png | 6 | 9 | 230 | 0.72 | 80 | 52 | 36 | 17 |
| 040-050s.png | 7 | 9 | 227 | 0.72 | 79 | 52 | 36 | 17 |
| 040-050s.png | 8 | 9 | 232 | 0.77 | 79 | 52 | 35 | 17 |
| 040-050s.png | 9 | 9 | 234 | 0.77 | 79 | 52 | 35 | 17 |
| 050-060s.png | 0 | 0 | 232 | 0.76 | 79 | 51 | 35 | 17 |
| 050-060s.png | 1 | 0 | 231 | 0.77 | 79 | 51 | 35 | 17 |
| 050-060s.png | 2 | 0 | 236 | 0.77 | 78 | 51 | 35 | 17 |
| 050-060s.png | 3 | 0 | 232 | 0.77 | 78 | 51 | 35 | 17 |
| 050-060s.png | 4 | 0 | 232 | 0.77 | 78 | 51 | 35 | 17 |
| 050-060s.png | 5 | 0 | 235 | 0.77 | 78 | 51 | 35 | 17 |
| 050-060s.png | 6 | 0 | 237 | 0.77 | 78 | 50 | 34 | 17 |
| 050-060s.png | 7 | 0 | 238 | 0.77 | 77 | 50 | 34 | 17 |
| 050-060s.png | 8 | 0 | 238 | 0.77 | 77 | 50 | 34 | 17 |
| 050-060s.png | 9 | 0 | 235 | 0.72 | 77 | 50 | 34 | 17 |
| 050-060s.png | 0 | 1 | 238 | 0.72 | 77 | 50 | 34 | 17 |
| 050-060s.png | 1 | 1 | 238 | 0.72 | 77 | 50 | 34 | 17 |
| 050-060s.png | 2 | 1 | 238 | 0.72 | 77 | 50 | 34 | 17 |
| 050-060s.png | 3 | 1 | 235 | 0.72 | 76 | 50 | 34 | 17 |
| 050-060s.png | 4 | 1 | 236 | 0.72 | 76 | 50 | 34 | 17 |
| 050-060s.png | 5 | 1 | 234 | 0.72 | 76 | 50 | 34 | 17 |
| 050-060s.png | 6 | 1 | 234 | 0.72 | 76 | 50 | 34 | 17 |
| 050-060s.png | 7 | 1 | 233 | 0.72 | 76 | 50 | 34 | 17 |
| 050-060s.png | 8 | 1 | 233 | 0.72 | 76 | 50 | 34 | 17 |
| 050-060s.png | 9 | 1 | 230 | 0.74 | 76 | 50 | 34 | 17 |
| 050-060s.png | 0 | 2 | 229 | 0.75 | 76 | 50 | 34 | 17 |
| 050-060s.png | 1 | 2 | 229 | 0.75 | 76 | 50 | 34 | 17 |
| 050-060s.png | 2 | 2 | 231 | 0.75 | 76 | 50 | 34 | 17 |
| 050-060s.png | 3 | 2 | 231 | 0.75 | 76 | 50 | 34 | 17 |
| 050-060s.png | 4 | 2 | 230 | 0.75 | 76 | 51 | 34 | 17 |
| 050-060s.png | 5 | 2 | 228 | 0.75 | 76 | 51 | 34 | 17 |
| 050-060s.png | 6 | 2 | 229 | 0.74 | 76 | 51 | 34 | 17 |
| 050-060s.png | 7 | 2 | 230 | 0.75 | 76 | 51 | 34 | 17 |
| 050-060s.png | 8 | 2 | 231 | 0.75 | 76 | 51 | 34 | 17 |
| 050-060s.png | 9 | 2 | 227 | 0.76 | 76 | 51 | 34 | 17 |
| 050-060s.png | 0 | 3 | 230 | 0.76 | 76 | 51 | 34 | 17 |
| 050-060s.png | 1 | 3 | 230 | 0.76 | 76 | 51 | 34 | 17 |
| 050-060s.png | 2 | 3 | 233 | 0.76 | 76 | 52 | 34 | 17 |
| 050-060s.png | 3 | 3 | 232 | 0.76 | 76 | 52 | 34 | 17 |
| 050-060s.png | 4 | 3 | 232 | 0.76 | 76 | 52 | 34 | 17 |
| 050-060s.png | 5 | 3 | 233 | 0.76 | 76 | 52 | 34 | 17 |
| 050-060s.png | 6 | 3 | 231 | 0.76 | 77 | 52 | 34 | 17 |
| 050-060s.png | 7 | 3 | 230 | 0.76 | 77 | 52 | 34 | 17 |
| 050-060s.png | 8 | 3 | 231 | 0.76 | 77 | 52 | 34 | 17 |
| 050-060s.png | 9 | 3 | 229 | 0.73 | 77 | 53 | 34 | 17 |
| 050-060s.png | 0 | 4 | 231 | 0.73 | 77 | 53 | 34 | 17 |
| 050-060s.png | 1 | 4 | 232 | 0.73 | 77 | 53 | 34 | 17 |
| 050-060s.png | 2 | 4 | 235 | 0.73 | 77 | 53 | 35 | 17 |
| 050-060s.png | 3 | 4 | 235 | 0.73 | 77 | 53 | 35 | 17 |
| 050-060s.png | 4 | 4 | 238 | 0.73 | 77 | 53 | 35 | 17 |
| 050-060s.png | 5 | 4 | 238 | 0.73 | 78 | 53 | 35 | 17 |
| 050-060s.png | 6 | 4 | 236 | 0.73 | 78 | 53 | 35 | 17 |
| 050-060s.png | 7 | 4 | 236 | 0.73 | 78 | 53 | 35 | 17 |
| 050-060s.png | 8 | 4 | 235 | 0.72 | 78 | 53 | 35 | 17 |
| 050-060s.png | 9 | 4 | 235 | 0.75 | 78 | 53 | 35 | 17 |
| 050-060s.png | 0 | 5 | 232 | 0.75 | 78 | 54 | 35 | 17 |
| 050-060s.png | 1 | 5 | 230 | 0.75 | 78 | 54 | 35 | 17 |
| 050-060s.png | 2 | 5 | 231 | 0.75 | 79 | 54 | 35 | 17 |
| 050-060s.png | 3 | 5 | 231 | 0.75 | 79 | 54 | 35 | 17 |
| 050-060s.png | 4 | 5 | 231 | 0.75 | 79 | 54 | 35 | 17 |
| 050-060s.png | 5 | 5 | 230 | 0.75 | 79 | 54 | 35 | 17 |
| 050-060s.png | 6 | 5 | 230 | 0.75 | 79 | 54 | 35 | 17 |
| 050-060s.png | 7 | 5 | 230 | 0.75 | 79 | 54 | 36 | 17 |
| 050-060s.png | 8 | 5 | 229 | 0.75 | 79 | 54 | 36 | 17 |
| 050-060s.png | 9 | 5 | 228 | 0.75 | 80 | 54 | 36 | 17 |
| 050-060s.png | 0 | 6 | 232 | 0.75 | 80 | 54 | 36 | 17 |
| 050-060s.png | 1 | 6 | 232 | 0.75 | 80 | 54 | 36 | 17 |
| 050-060s.png | 2 | 6 | 232 | 0.75 | 80 | 54 | 36 | 17 |
| 050-060s.png | 3 | 6 | 232 | 0.75 | 80 | 54 | 36 | 17 |
| 050-060s.png | 4 | 6 | 232 | 0.75 | 80 | 55 | 36 | 17 |
| 050-060s.png | 5 | 6 | 232 | 0.75 | 80 | 55 | 36 | 17 |
| 050-060s.png | 6 | 6 | 232 | 0.75 | 81 | 55 | 36 | 17 |
| 050-060s.png | 7 | 6 | 232 | 0.75 | 81 | 55 | 36 | 17 |
| 050-060s.png | 8 | 6 | 231 | 0.75 | 81 | 55 | 36 | 17 |
| 050-060s.png | 9 | 6 | 232 | 0.75 | 81 | 55 | 36 | 17 |
| 050-060s.png | 0 | 7 | 229 | 0.75 | 81 | 55 | 37 | 17 |
| 050-060s.png | 1 | 7 | 231 | 0.72 | 82 | 55 | 36 | 17 |
| 050-060s.png | 2 | 7 | 225 | 0.72 | 82 | 55 | 36 | 17 |
| 050-060s.png | 3 | 7 | 235 | 0.72 | 83 | 55 | 37 | 17 |
| 050-060s.png | 4 | 7 | 232 | 0.72 | 83 | 55 | 37 | 17 |
| 050-060s.png | 5 | 7 | 227 | 0.72 | 83 | 55 | 37 | 17 |
| 050-060s.png | 6 | 7 | 237 | 0.72 | 83 | 55 | 37 | 17 |
| 050-060s.png | 7 | 7 | 233 | 0.72 | 83 | 55 | 37 | 17 |
| 050-060s.png | 8 | 7 | 227 | 0.72 | 83 | 55 | 37 | 17 |
| 050-060s.png | 9 | 7 | 233 | 0.72 | 83 | 55 | 37 | 17 |
| 050-060s.png | 0 | 8 | 237 | 0.72 | 83 | 55 | 37 | 17 |
| 050-060s.png | 1 | 8 | 233 | 0.72 | 83 | 55 | 37 | 17 |
| 050-060s.png | 2 | 8 | 238 | 0.72 | 82 | 54 | 36 | 17 |
| 050-060s.png | 3 | 8 | 236 | 0.71 | 82 | 54 | 36 | 17 |
| 050-060s.png | 4 | 8 | 232 | 0.71 | 81 | 54 | 36 | 17 |
| 050-060s.png | 5 | 8 | 237 | 0.71 | 80 | 53 | 36 | 17 |
| 050-060s.png | 6 | 8 | 239 | 0.71 | 80 | 53 | 36 | 17 |
| 050-060s.png | 7 | 8 | 229 | 0.71 | 80 | 53 | 36 | 17 |
| 050-060s.png | 8 | 8 | 236 | 0.71 | 80 | 52 | 36 | 17 |
| 050-060s.png | 9 | 8 | 226 | 0.72 | 79 | 52 | 36 | 17 |
| 050-060s.png | 0 | 9 | 231 | 0.71 | 79 | 52 | 36 | 17 |
| 050-060s.png | 1 | 9 | 230 | 0.71 | 79 | 52 | 36 | 17 |
| 050-060s.png | 2 | 9 | 230 | 0.75 | 79 | 52 | 35 | 17 |
| 050-060s.png | 3 | 9 | 230 | 0.75 | 78 | 51 | 35 | 17 |
| 050-060s.png | 4 | 9 | 227 | 0.75 | 78 | 51 | 35 | 17 |
| 050-060s.png | 5 | 9 | 228 | 0.75 | 78 | 51 | 35 | 17 |
| 050-060s.png | 6 | 9 | 232 | 0.75 | 78 | 51 | 35 | 17 |
| 050-060s.png | 7 | 9 | 235 | 0.75 | 78 | 51 | 35 | 17 |
| 050-060s.png | 8 | 9 | 235 | 0.75 | 77 | 51 | 35 | 17 |
| 050-060s.png | 9 | 9 | 236 | 0.75 | 77 | 50 | 34 | 17 |
| 060-070s.png | 0 | 0 | 238 | 0.76 | 77 | 50 | 34 | 17 |
| 060-070s.png | 1 | 0 | 237 | 0.76 | 77 | 50 | 34 | 17 |
| 060-070s.png | 2 | 0 | 230 | 0.76 | 77 | 50 | 34 | 17 |
| 060-070s.png | 3 | 0 | 234 | 0.76 | 76 | 50 | 34 | 17 |
| 060-070s.png | 4 | 0 | 233 | 0.76 | 76 | 50 | 34 | 17 |
| 060-070s.png | 5 | 0 | 231 | 0.76 | 76 | 50 | 34 | 17 |
| 060-070s.png | 6 | 0 | 233 | 0.76 | 76 | 50 | 34 | 17 |
| 060-070s.png | 7 | 0 | 232 | 0.76 | 76 | 50 | 34 | 17 |
| 060-070s.png | 8 | 0 | 232 | 0.76 | 76 | 50 | 34 | 17 |
| 060-070s.png | 9 | 0 | 230 | 0.76 | 76 | 50 | 34 | 17 |
| 060-070s.png | 0 | 1 | 232 | 0.76 | 76 | 50 | 34 | 17 |
| 060-070s.png | 1 | 1 | 232 | 0.76 | 76 | 50 | 34 | 17 |
| 060-070s.png | 2 | 1 | 231 | 0.76 | 76 | 50 | 34 | 17 |
| 060-070s.png | 3 | 1 | 233 | 0.73 | 76 | 50 | 34 | 17 |
| 060-070s.png | 4 | 1 | 230 | 0.73 | 76 | 50 | 34 | 17 |
| 060-070s.png | 5 | 1 | 231 | 0.73 | 76 | 50 | 34 | 17 |
| 060-070s.png | 6 | 1 | 231 | 0.73 | 75 | 51 | 34 | 17 |
| 060-070s.png | 7 | 1 | 230 | 0.73 | 76 | 51 | 34 | 17 |
| 060-070s.png | 8 | 1 | 232 | 0.73 | 76 | 51 | 34 | 17 |
| 060-070s.png | 9 | 1 | 230 | 0.73 | 76 | 51 | 34 | 17 |
| 060-070s.png | 0 | 2 | 230 | 0.73 | 76 | 51 | 34 | 17 |
| 060-070s.png | 1 | 2 | 231 | 0.73 | 76 | 51 | 34 | 17 |
| 060-070s.png | 2 | 2 | 231 | 0.73 | 76 | 51 | 34 | 17 |
| 060-070s.png | 3 | 2 | 226 | 0.76 | 76 | 51 | 34 | 17 |
| 060-070s.png | 4 | 2 | 229 | 0.76 | 76 | 52 | 34 | 17 |
| 060-070s.png | 5 | 2 | 228 | 0.76 | 76 | 52 | 34 | 17 |
| 060-070s.png | 6 | 2 | 229 | 0.76 | 76 | 52 | 34 | 17 |
| 060-070s.png | 7 | 2 | 228 | 0.76 | 76 | 52 | 34 | 17 |
| 060-070s.png | 8 | 2 | 227 | 0.76 | 76 | 52 | 34 | 17 |
| 060-070s.png | 9 | 2 | 227 | 0.76 | 76 | 52 | 34 | 17 |
| 060-070s.png | 0 | 3 | 228 | 0.77 | 77 | 52 | 34 | 17 |
| 060-070s.png | 1 | 3 | 229 | 0.77 | 77 | 52 | 34 | 17 |
| 060-070s.png | 2 | 3 | 228 | 0.77 | 77 | 53 | 34 | 17 |
| 060-070s.png | 3 | 3 | 228 | 0.77 | 77 | 53 | 35 | 17 |
| 060-070s.png | 4 | 3 | 233 | 0.72 | 76 | 53 | 35 | 12 |
| 060-070s.png | 5 | 3 | 231 | 0.73 | 77 | 53 | 35 | 17 |
| 060-070s.png | 6 | 3 | 230 | 0.73 | 77 | 53 | 35 | 17 |
| 060-070s.png | 7 | 3 | 232 | 0.73 | 77 | 53 | 35 | 17 |
| 060-070s.png | 8 | 3 | 232 | 0.73 | 78 | 53 | 35 | 17 |
| 060-070s.png | 9 | 3 | 233 | 0.73 | 78 | 53 | 35 | 17 |
| 060-070s.png | 0 | 4 | 235 | 0.74 | 78 | 53 | 35 | 17 |
| 060-070s.png | 1 | 4 | 233 | 0.73 | 78 | 54 | 35 | 17 |
| 060-070s.png | 2 | 4 | 233 | 0.73 | 78 | 54 | 35 | 17 |
| 060-070s.png | 3 | 4 | 233 | 0.73 | 78 | 54 | 35 | 17 |
| 060-070s.png | 4 | 4 | 230 | 0.73 | 78 | 54 | 35 | 17 |
| 060-070s.png | 5 | 4 | 230 | 0.73 | 79 | 54 | 35 | 17 |
| 060-070s.png | 6 | 4 | 230 | 0.73 | 79 | 54 | 35 | 17 |
| 060-070s.png | 7 | 4 | 230 | 0.73 | 79 | 54 | 36 | 17 |
| 060-070s.png | 8 | 4 | 231 | 0.73 | 79 | 54 | 36 | 17 |
| 060-070s.png | 9 | 4 | 231 | 0.73 | 79 | 54 | 36 | 17 |
| 060-070s.png | 0 | 5 | 234 | 0.72 | 79 | 54 | 36 | 17 |
| 060-070s.png | 1 | 5 | 233 | 0.72 | 79 | 54 | 36 | 17 |
| 060-070s.png | 2 | 5 | 231 | 0.72 | 80 | 54 | 36 | 17 |
| 060-070s.png | 3 | 5 | 231 | 0.72 | 80 | 54 | 36 | 17 |
| 060-070s.png | 4 | 5 | 230 | 0.72 | 80 | 55 | 36 | 17 |
| 060-070s.png | 5 | 5 | 232 | 0.72 | 80 | 55 | 36 | 17 |
| 060-070s.png | 6 | 5 | 231 | 0.72 | 80 | 55 | 36 | 17 |
| 060-070s.png | 7 | 5 | 231 | 0.71 | 80 | 55 | 36 | 17 |
| 060-070s.png | 8 | 5 | 230 | 0.71 | 80 | 55 | 36 | 17 |
| 060-070s.png | 9 | 5 | 231 | 0.71 | 80 | 55 | 36 | 17 |
| 060-070s.png | 0 | 6 | 230 | 0.73 | 81 | 55 | 37 | 17 |
| 060-070s.png | 1 | 6 | 231 | 0.74 | 81 | 55 | 37 | 17 |
| 060-070s.png | 2 | 6 | 229 | 0.74 | 81 | 55 | 37 | 17 |
| 060-070s.png | 3 | 6 | 233 | 0.73 | 81 | 55 | 37 | 17 |
| 060-070s.png | 4 | 6 | 230 | 0.74 | 82 | 55 | 36 | 17 |
| 060-070s.png | 5 | 6 | 225 | 0.76 | 83 | 55 | 37 | 17 |
| 060-070s.png | 6 | 6 | 234 | 0.77 | 83 | 55 | 37 | 17 |
| 060-070s.png | 7 | 6 | 227 | 0.77 | 83 | 55 | 37 | 17 |
| 060-070s.png | 8 | 6 | 228 | 0.76 | 83 | 55 | 37 | 17 |
| 060-070s.png | 9 | 6 | 237 | 0.77 | 83 | 55 | 37 | 17 |
| 060-070s.png | 0 | 7 | 232 | 0.77 | 83 | 55 | 37 | 17 |
| 060-070s.png | 1 | 7 | 227 | 0.77 | 83 | 55 | 37 | 17 |
| 060-070s.png | 2 | 7 | 232 | 0.77 | 83 | 55 | 37 | 17 |
| 060-070s.png | 3 | 7 | 236 | 0.77 | 83 | 54 | 36 | 19 |
| 060-070s.png | 4 | 7 | 236 | 0.78 | 81 | 53 | 36 | 21 |
| 060-070s.png | 5 | 7 | 222 | 0.79 | 78 | 50 | 34 | 24 |
| 060-070s.png | 6 | 7 | 162 | 0.83 | 72 | 42 | 29 | 17 |
| 060-070s.png | 7 | 7 | 41 | 0.87 | 67 | 34 | 27 | 9 |
| 060-070s.png | 8 | 7 | 41 | 0.84 | 67 | 34 | 27 | 9 |
| 060-070s.png | 9 | 7 | 41 | 0.84 | 67 | 34 | 27 | 9 |
| 060-070s.png | 0 | 8 | 39 | 0.84 | 67 | 34 | 27 | 9 |
| 060-070s.png | 1 | 8 | 40 | 0.83 | 67 | 34 | 27 | 9 |
| 060-070s.png | 2 | 8 | 40 | 0.83 | 66 | 34 | 27 | 9 |
| 060-070s.png | 3 | 8 | 40 | 0.83 | 65 | 35 | 28 | 9 |
| 060-070s.png | 4 | 8 | 40 | 0.81 | 63 | 36 | 29 | 9 |
| 060-070s.png | 5 | 8 | 38 | 0.80 | 60 | 38 | 31 | 9 |
| 060-070s.png | 6 | 8 | 38 | 0.79 | 55 | 40 | 32 | 9 |
| 060-070s.png | 7 | 8 | 40 | 0.79 | 49 | 40 | 31 | 9 |
| 060-070s.png | 8 | 8 | 47 | 0.78 | 45 | 39 | 28 | 9 |
| 060-070s.png | 9 | 8 | 51 | 0.76 | 46 | 42 | 32 | 9 |
| 060-070s.png | 0 | 9 | 57 | 0.77 | 50 | 48 | 39 | 10 |
| 060-070s.png | 1 | 9 | 68 | 0.75 | 56 | 53 | 44 | 10 |
| 060-070s.png | 2 | 9 | 71 | 0.73 | 63 | 58 | 47 | 10 |
| 060-070s.png | 3 | 9 | 65 | 0.72 | 73 | 61 | 41 | 10 |
| 060-070s.png | 4 | 9 | 74 | 0.74 | 78 | 58 | 34 | 10 |
| 060-070s.png | 5 | 9 | 81 | 0.78 | 78 | 54 | 33 | 11 |
| 060-070s.png | 6 | 9 | 88 | 0.81 | 77 | 51 | 33 | 11 |
| 060-070s.png | 7 | 9 | 83 | 0.82 | 76 | 50 | 33 | 11 |
| 060-070s.png | 8 | 9 | 91 | 0.83 | 76 | 49 | 34 | 11 |
| 060-070s.png | 9 | 9 | 95 | 0.83 | 76 | 49 | 34 | 10 |
| 070-080s.png | 0 | 0 | 97 | 0.83 | 76 | 49 | 34 | 10 |
| 070-080s.png | 1 | 0 | 98 | 0.83 | 76 | 49 | 34 | 10 |
| 070-080s.png | 2 | 0 | 100 | 0.83 | 76 | 49 | 34 | 10 |
| 070-080s.png | 3 | 0 | 102 | 0.83 | 76 | 49 | 34 | 10 |
| 070-080s.png | 4 | 0 | 101 | 0.80 | 76 | 48 | 34 | 10 |
| 070-080s.png | 5 | 0 | 96 | 0.82 | 75 | 47 | 33 | 10 |
| 070-080s.png | 6 | 0 | 97 | 0.82 | 75 | 46 | 33 | 10 |
| 070-080s.png | 7 | 0 | 94 | 0.82 | 74 | 46 | 32 | 10 |
| 070-080s.png | 8 | 0 | 96 | 0.82 | 74 | 45 | 32 | 10 |
| 070-080s.png | 9 | 0 | 90 | 0.83 | 73 | 44 | 32 | 10 |
| 070-080s.png | 0 | 1 | 95 | 0.83 | 73 | 44 | 32 | 10 |
| 070-080s.png | 1 | 1 | 96 | 0.84 | 73 | 44 | 31 | 10 |
| 070-080s.png | 2 | 1 | 93 | 0.84 | 72 | 43 | 31 | 10 |
| 070-080s.png | 3 | 1 | 97 | 0.84 | 72 | 43 | 31 | 10 |
| 070-080s.png | 4 | 1 | 99 | 0.84 | 72 | 43 | 30 | 10 |
| 070-080s.png | 5 | 1 | 96 | 0.84 | 71 | 42 | 30 | 10 |
| 070-080s.png | 6 | 1 | 97 | 0.84 | 71 | 42 | 30 | 10 |
| 070-080s.png | 7 | 1 | 93 | 0.84 | 71 | 42 | 30 | 10 |
| 070-080s.png | 8 | 1 | 96 | 0.84 | 71 | 42 | 30 | 10 |
| 070-080s.png | 9 | 1 | 98 | 0.84 | 70 | 42 | 29 | 10 |
| 070-080s.png | 0 | 2 | 94 | 0.84 | 70 | 42 | 29 | 10 |
| 070-080s.png | 1 | 2 | 91 | 0.84 | 70 | 42 | 29 | 10 |
| 070-080s.png | 2 | 2 | 92 | 0.84 | 70 | 42 | 29 | 10 |
| 070-080s.png | 3 | 2 | 87 | 0.84 | 70 | 42 | 29 | 10 |
| 070-080s.png | 4 | 2 | 91 | 0.84 | 70 | 42 | 29 | 10 |
| 070-080s.png | 5 | 2 | 90 | 0.84 | 70 | 42 | 29 | 10 |
| 070-080s.png | 6 | 2 | 92 | 0.84 | 70 | 42 | 29 | 10 |
| 070-080s.png | 7 | 2 | 93 | 0.84 | 70 | 43 | 29 | 10 |
| 070-080s.png | 8 | 2 | 96 | 0.84 | 70 | 43 | 29 | 10 |
| 070-080s.png | 9 | 2 | 94 | 0.84 | 70 | 43 | 29 | 10 |
| 070-080s.png | 0 | 3 | 95 | 0.83 | 70 | 43 | 29 | 10 |
| 070-080s.png | 1 | 3 | 94 | 0.84 | 70 | 43 | 29 | 10 |
| 070-080s.png | 2 | 3 | 94 | 0.84 | 70 | 44 | 30 | 10 |
| 070-080s.png | 3 | 3 | 93 | 0.83 | 71 | 44 | 30 | 10 |
| 070-080s.png | 4 | 3 | 94 | 0.83 | 71 | 44 | 30 | 10 |
| 070-080s.png | 5 | 3 | 94 | 0.83 | 71 | 45 | 30 | 10 |
| 070-080s.png | 6 | 3 | 94 | 0.84 | 71 | 45 | 30 | 10 |
| 070-080s.png | 7 | 3 | 94 | 0.84 | 71 | 45 | 30 | 10 |
| 070-080s.png | 8 | 3 | 98 | 0.84 | 72 | 45 | 30 | 10 |
| 070-080s.png | 9 | 3 | 97 | 0.84 | 72 | 46 | 31 | 10 |
| 070-080s.png | 0 | 4 | 97 | 0.84 | 72 | 46 | 31 | 10 |
| 070-080s.png | 1 | 4 | 97 | 0.83 | 72 | 46 | 31 | 10 |
| 070-080s.png | 2 | 4 | 99 | 0.83 | 72 | 46 | 31 | 10 |
| 070-080s.png | 3 | 4 | 97 | 0.83 | 73 | 46 | 31 | 10 |
| 070-080s.png | 4 | 4 | 98 | 0.83 | 73 | 47 | 31 | 10 |
| 070-080s.png | 5 | 4 | 97 | 0.83 | 73 | 47 | 32 | 10 |
| 070-080s.png | 6 | 4 | 98 | 0.83 | 73 | 47 | 32 | 10 |
| 070-080s.png | 7 | 4 | 98 | 0.79 | 73 | 47 | 32 | 10 |
| 070-080s.png | 8 | 4 | 96 | 0.79 | 74 | 47 | 32 | 10 |
| 070-080s.png | 9 | 4 | 95 | 0.79 | 74 | 47 | 32 | 10 |
| 070-080s.png | 0 | 5 | 96 | 0.78 | 74 | 48 | 32 | 10 |
| 070-080s.png | 1 | 5 | 95 | 0.78 | 74 | 48 | 33 | 10 |
| 070-080s.png | 2 | 5 | 96 | 0.78 | 74 | 48 | 33 | 10 |
| 070-080s.png | 3 | 5 | 92 | 0.78 | 75 | 48 | 33 | 10 |
| 070-080s.png | 4 | 5 | 95 | 0.78 | 75 | 48 | 33 | 10 |
| 070-080s.png | 5 | 5 | 95 | 0.78 | 75 | 48 | 33 | 10 |
| 070-080s.png | 6 | 5 | 97 | 0.78 | 75 | 48 | 33 | 10 |
| 070-080s.png | 7 | 5 | 96 | 0.78 | 76 | 48 | 34 | 10 |
| 070-080s.png | 8 | 5 | 97 | 0.78 | 76 | 49 | 34 | 10 |
| 070-080s.png | 9 | 5 | 95 | 0.78 | 76 | 49 | 34 | 10 |
| 070-080s.png | 0 | 6 | 98 | 0.80 | 76 | 49 | 34 | 10 |
| 070-080s.png | 1 | 6 | 101 | 0.80 | 76 | 49 | 34 | 10 |
| 070-080s.png | 2 | 6 | 102 | 0.81 | 75 | 47 | 33 | 10 |
| 070-080s.png | 3 | 6 | 97 | 0.81 | 73 | 45 | 31 | 10 |
| 070-080s.png | 4 | 6 | 93 | 0.83 | 70 | 40 | 29 | 10 |
| 070-080s.png | 5 | 6 | 62 | 0.84 | 66 | 35 | 27 | 10 |
| 070-080s.png | 6 | 6 | 43 | 0.84 | 66 | 34 | 26 | 10 |
| 070-080s.png | 7 | 6 | 42 | 0.84 | 66 | 34 | 26 | 11 |
| 070-080s.png | 8 | 6 | 42 | 0.84 | 66 | 34 | 26 | 11 |
| 070-080s.png | 9 | 6 | 42 | 0.84 | 67 | 34 | 26 | 10 |
| 070-080s.png | 0 | 7 | 38 | 0.82 | 67 | 34 | 27 | 9 |
| 070-080s.png | 1 | 7 | 38 | 0.82 | 67 | 34 | 27 | 9 |
| 070-080s.png | 2 | 7 | 38 | 0.82 | 65 | 35 | 27 | 9 |
| 070-080s.png | 3 | 7 | 40 | 0.80 | 62 | 37 | 29 | 9 |
| 070-080s.png | 4 | 7 | 40 | 0.80 | 57 | 39 | 32 | 9 |
| 070-080s.png | 5 | 7 | 39 | 0.78 | 50 | 41 | 33 | 9 |
| 070-080s.png | 6 | 7 | 40 | 0.78 | 42 | 40 | 30 | 9 |
| 070-080s.png | 7 | 7 | 47 | 0.79 | 35 | 37 | 20 | 10 |
| 070-080s.png | 8 | 7 | 58 | 0.72 | 59 | 58 | 35 | 10 |
| 070-080s.png | 9 | 7 | 63 | 0.70 | 85 | 73 | 52 | 10 |
| 070-080s.png | 0 | 8 | 64 | 0.71 | 104 | 72 | 51 | 11 |
| 070-080s.png | 1 | 8 | 83 | 0.81 | 86 | 56 | 42 | 9 |
| 070-080s.png | 2 | 8 | 115 | 0.85 | 68 | 36 | 27 | 11 |
| 070-080s.png | 3 | 8 | 102 | 0.85 | 68 | 37 | 27 | 13 |
| 070-080s.png | 4 | 8 | 109 | 0.81 | 68 | 37 | 27 | 13 |
| 070-080s.png | 5 | 8 | 112 | 0.80 | 67 | 37 | 27 | 14 |
| 070-080s.png | 6 | 8 | 115 | 0.80 | 67 | 37 | 27 | 15 |
| 070-080s.png | 7 | 8 | 115 | 0.79 | 67 | 37 | 27 | 17 |
| 070-080s.png | 8 | 8 | 129 | 0.78 | 66 | 38 | 27 | 18 |
| 070-080s.png | 9 | 8 | 141 | 0.78 | 66 | 38 | 27 | 19 |
| 070-080s.png | 0 | 9 | 155 | 0.78 | 67 | 39 | 27 | 20 |
| 070-080s.png | 1 | 9 | 159 | 0.77 | 67 | 40 | 28 | 21 |
| 070-080s.png | 2 | 9 | 161 | 0.77 | 68 | 42 | 29 | 24 |
| 070-080s.png | 3 | 9 | 161 | 0.76 | 70 | 43 | 31 | 25 |
| 070-080s.png | 4 | 9 | 162 | 0.76 | 70 | 45 | 33 | 24 |
| 070-080s.png | 5 | 9 | 160 | 0.76 | 71 | 46 | 34 | 23 |
| 070-080s.png | 6 | 9 | 167 | 0.76 | 72 | 46 | 36 | 22 |
| 070-080s.png | 7 | 9 | 170 | 0.76 | 71 | 46 | 36 | 21 |
| 070-080s.png | 8 | 9 | 172 | 0.74 | 71 | 46 | 35 | 21 |
| 070-080s.png | 9 | 9 | 170 | 0.74 | 69 | 44 | 32 | 22 |
| 080-090s.png | 0 | 0 | 172 | 0.74 | 68 | 42 | 30 | 24 |
| 080-090s.png | 1 | 0 | 174 | 0.74 | 67 | 42 | 29 | 24 |
| 080-090s.png | 2 | 0 | 174 | 0.75 | 67 | 41 | 28 | 24 |
| 080-090s.png | 3 | 0 | 170 | 0.75 | 67 | 41 | 28 | 24 |
| 080-090s.png | 4 | 0 | 179 | 0.75 | 68 | 41 | 28 | 23 |
| 080-090s.png | 5 | 0 | 180 | 0.75 | 68 | 41 | 29 | 23 |
| 080-090s.png | 6 | 0 | 182 | 0.75 | 68 | 41 | 29 | 23 |
| 080-090s.png | 7 | 0 | 182 | 0.75 | 68 | 41 | 29 | 23 |
| 080-090s.png | 8 | 0 | 178 | 0.75 | 68 | 41 | 29 | 23 |
| 080-090s.png | 9 | 0 | 178 | 0.75 | 68 | 41 | 29 | 23 |
| 080-090s.png | 0 | 1 | 183 | 0.75 | 69 | 42 | 29 | 23 |
| 080-090s.png | 1 | 1 | 177 | 0.75 | 69 | 42 | 29 | 24 |
| 080-090s.png | 2 | 1 | 177 | 0.75 | 69 | 42 | 29 | 24 |
| 080-090s.png | 3 | 1 | 179 | 0.75 | 69 | 42 | 29 | 24 |
| 080-090s.png | 4 | 1 | 185 | 0.75 | 69 | 42 | 29 | 24 |
| 080-090s.png | 5 | 1 | 180 | 0.75 | 69 | 42 | 29 | 24 |
| 080-090s.png | 6 | 1 | 181 | 0.75 | 69 | 42 | 29 | 24 |
| 080-090s.png | 7 | 1 | 184 | 0.75 | 69 | 42 | 29 | 24 |
| 080-090s.png | 8 | 1 | 182 | 0.75 | 69 | 42 | 29 | 25 |
| 080-090s.png | 9 | 1 | 182 | 0.75 | 69 | 42 | 28 | 25 |
| 080-090s.png | 0 | 2 | 183 | 0.75 | 69 | 42 | 28 | 25 |
| 080-090s.png | 1 | 2 | 179 | 0.74 | 69 | 42 | 28 | 25 |
| 080-090s.png | 2 | 2 | 178 | 0.74 | 69 | 42 | 28 | 25 |
| 080-090s.png | 3 | 2 | 176 | 0.74 | 69 | 42 | 28 | 25 |
| 080-090s.png | 4 | 2 | 175 | 0.74 | 69 | 42 | 28 | 25 |
| 080-090s.png | 5 | 2 | 174 | 0.74 | 69 | 42 | 28 | 26 |
| 080-090s.png | 6 | 2 | 176 | 0.74 | 69 | 42 | 28 | 26 |
| 080-090s.png | 7 | 2 | 174 | 0.74 | 69 | 42 | 28 | 26 |
| 080-090s.png | 8 | 2 | 178 | 0.74 | 69 | 42 | 28 | 26 |
| 080-090s.png | 9 | 2 | 175 | 0.74 | 69 | 42 | 28 | 26 |
| 080-090s.png | 0 | 3 | 179 | 0.75 | 69 | 42 | 28 | 26 |
| 080-090s.png | 1 | 3 | 176 | 0.75 | 69 | 42 | 28 | 26 |
| 080-090s.png | 2 | 3 | 180 | 0.75 | 68 | 42 | 28 | 26 |
| 080-090s.png | 3 | 3 | 180 | 0.75 | 68 | 42 | 28 | 26 |
| 080-090s.png | 4 | 3 | 181 | 0.75 | 68 | 42 | 28 | 26 |
| 080-090s.png | 5 | 3 | 174 | 0.75 | 68 | 42 | 28 | 26 |
| 080-090s.png | 6 | 3 | 174 | 0.75 | 68 | 42 | 28 | 26 |
| 080-090s.png | 7 | 3 | 175 | 0.75 | 68 | 42 | 27 | 26 |
| 080-090s.png | 8 | 3 | 174 | 0.75 | 68 | 42 | 27 | 26 |
| 080-090s.png | 9 | 3 | 173 | 0.75 | 68 | 42 | 27 | 26 |
| 080-090s.png | 0 | 4 | 178 | 0.74 | 68 | 42 | 27 | 25 |
| 080-090s.png | 1 | 4 | 175 | 0.74 | 67 | 41 | 27 | 25 |
| 080-090s.png | 2 | 4 | 160 | 0.75 | 66 | 39 | 27 | 23 |
| 080-090s.png | 3 | 4 | 150 | 0.75 | 65 | 39 | 27 | 22 |
| 080-090s.png | 4 | 4 | 142 | 0.76 | 65 | 39 | 27 | 22 |
| 080-090s.png | 5 | 4 | 136 | 0.76 | 65 | 39 | 27 | 22 |
| 080-090s.png | 6 | 4 | 130 | 0.76 | 65 | 39 | 27 | 22 |
| 080-090s.png | 7 | 4 | 125 | 0.76 | 65 | 39 | 27 | 22 |
| 080-090s.png | 8 | 4 | 124 | 0.77 | 65 | 38 | 27 | 20 |
| 080-090s.png | 9 | 4 | 136 | 0.77 | 66 | 38 | 27 | 19 |
| 080-090s.png | 0 | 5 | 133 | 0.77 | 66 | 38 | 27 | 19 |
| 080-090s.png | 1 | 5 | 118 | 0.77 | 66 | 38 | 27 | 19 |
| 080-090s.png | 2 | 5 | 118 | 0.77 | 66 | 38 | 27 | 18 |
| 080-090s.png | 3 | 5 | 103 | 0.80 | 66 | 36 | 27 | 15 |
| 080-090s.png | 4 | 5 | 38 | 0.83 | 67 | 34 | 26 | 9 |
| 080-090s.png | 5 | 5 | 39 | 0.83 | 66 | 34 | 27 | 9 |
| 080-090s.png | 6 | 5 | 39 | 0.82 | 65 | 36 | 28 | 9 |
| 080-090s.png | 7 | 5 | 39 | 0.80 | 61 | 38 | 30 | 9 |
| 080-090s.png | 8 | 5 | 39 | 0.79 | 56 | 40 | 32 | 9 |
| 080-090s.png | 9 | 5 | 39 | 0.78 | 49 | 41 | 33 | 9 |
| 080-090s.png | 0 | 6 | 39 | 0.77 | 41 | 41 | 31 | 9 |
| 080-090s.png | 1 | 6 | 48 | 0.74 | 32 | 37 | 23 | 9 |
| 080-090s.png | 2 | 6 | 61 | 0.69 | 38 | 46 | 29 | 10 |
| 080-090s.png | 3 | 6 | 52 | 0.65 | 53 | 61 | 42 | 10 |
| 080-090s.png | 4 | 6 | 44 | 0.59 | 59 | 69 | 54 | 10 |
| 080-090s.png | 5 | 6 | 55 | 0.55 | 63 | 81 | 67 | 9 |
| 080-090s.png | 6 | 6 | 56 | 0.56 | 38 | 68 | 49 | 9 |
| 080-090s.png | 7 | 6 | 25 | 0.55 | 6 | 28 | 17 | 9 |
| 080-090s.png | 8 | 6 | 12 | 0.36 | 5 | 28 | 17 | 9 |
| 080-090s.png | 9 | 6 | 14 | 0.37 | 6 | 28 | 17 | 10 |
| 080-090s.png | 0 | 7 | 24 | 0.13 | 8 | 30 | 18 | 10 |
| 080-090s.png | 1 | 7 | 37 | 0.16 | 11 | 34 | 19 | 10 |
| 080-090s.png | 2 | 7 | 57 | 0.21 | 14 | 37 | 21 | 10 |
| 080-090s.png | 3 | 7 | 81 | 0.30 | 21 | 41 | 23 | 10 |
| 080-090s.png | 4 | 7 | 84 | 0.44 | 32 | 46 | 27 | 11 |
| 080-090s.png | 5 | 7 | 80 | 0.59 | 44 | 48 | 30 | 11 |
| 080-090s.png | 6 | 7 | 84 | 0.67 | 50 | 48 | 30 | 11 |
| 080-090s.png | 7 | 7 | 83 | 0.71 | 53 | 50 | 31 | 11 |
| 080-090s.png | 8 | 7 | 87 | 0.73 | 56 | 52 | 33 | 11 |
| 080-090s.png | 9 | 7 | 86 | 0.75 | 58 | 53 | 33 | 11 |
| 080-090s.png | 0 | 8 | 82 | 0.79 | 61 | 55 | 35 | 11 |
| 080-090s.png | 1 | 8 | 85 | 0.79 | 63 | 55 | 35 | 11 |
| 080-090s.png | 2 | 8 | 85 | 0.79 | 65 | 56 | 36 | 11 |
| 080-090s.png | 3 | 8 | 83 | 0.79 | 66 | 56 | 37 | 11 |
| 080-090s.png | 4 | 8 | 82 | 0.79 | 67 | 57 | 37 | 11 |
| 080-090s.png | 5 | 8 | 81 | 0.79 | 69 | 57 | 38 | 11 |
| 080-090s.png | 6 | 8 | 81 | 0.79 | 70 | 57 | 39 | 11 |
| 080-090s.png | 7 | 8 | 80 | 0.79 | 71 | 57 | 40 | 11 |
| 080-090s.png | 8 | 8 | 79 | 0.79 | 71 | 58 | 40 | 11 |
| 080-090s.png | 9 | 8 | 79 | 0.77 | 72 | 58 | 41 | 11 |
| 080-090s.png | 0 | 9 | 80 | 0.77 | 72 | 58 | 41 | 11 |
| 080-090s.png | 1 | 9 | 79 | 0.79 | 72 | 58 | 41 | 11 |
| 080-090s.png | 2 | 9 | 79 | 0.79 | 71 | 58 | 42 | 11 |
| 080-090s.png | 3 | 9 | 79 | 0.78 | 70 | 58 | 42 | 11 |
| 080-090s.png | 4 | 9 | 79 | 0.78 | 67 | 59 | 41 | 11 |
| 080-090s.png | 5 | 9 | 79 | 0.77 | 62 | 59 | 41 | 11 |
| 080-090s.png | 6 | 9 | 78 | 0.77 | 57 | 59 | 40 | 11 |
| 080-090s.png | 7 | 9 | 76 | 0.76 | 52 | 58 | 40 | 11 |
| 080-090s.png | 8 | 9 | 73 | 0.75 | 47 | 57 | 40 | 11 |
| 080-090s.png | 9 | 9 | 72 | 0.75 | 43 | 56 | 39 | 11 |
| 090-100s.png | 0 | 0 | 74 | 0.68 | 40 | 55 | 39 | 11 |
| 090-100s.png | 1 | 0 | 97 | 0.61 | 39 | 55 | 38 | 15 |
| 090-100s.png | 2 | 0 | 95 | 0.61 | 37 | 54 | 38 | 16 |
| 090-100s.png | 3 | 0 | 92 | 0.62 | 35 | 53 | 38 | 14 |
| 090-100s.png | 4 | 0 | 89 | 0.62 | 33 | 52 | 37 | 13 |
| 090-100s.png | 5 | 0 | 88 | 0.61 | 31 | 51 | 36 | 12 |
| 090-100s.png | 6 | 0 | 91 | 0.61 | 30 | 51 | 34 | 12 |
| 090-100s.png | 7 | 0 | 91 | 0.61 | 29 | 50 | 33 | 11 |
| 090-100s.png | 8 | 0 | 89 | 0.62 | 28 | 49 | 32 | 11 |
| 090-100s.png | 9 | 0 | 89 | 0.62 | 27 | 49 | 31 | 11 |
| 090-100s.png | 0 | 1 | 87 | 0.49 | 27 | 49 | 31 | 11 |
| 090-100s.png | 1 | 1 | 90 | 0.58 | 27 | 48 | 30 | 11 |
| 090-100s.png | 2 | 1 | 91 | 0.60 | 27 | 48 | 30 | 11 |
| 090-100s.png | 3 | 1 | 89 | 0.61 | 28 | 48 | 30 | 11 |
| 090-100s.png | 4 | 1 | 89 | 0.62 | 30 | 49 | 30 | 11 |
| 090-100s.png | 5 | 1 | 89 | 0.64 | 32 | 49 | 30 | 11 |
| 090-100s.png | 6 | 1 | 89 | 0.67 | 34 | 50 | 30 | 12 |
| 090-100s.png | 7 | 1 | 84 | 0.68 | 36 | 50 | 30 | 12 |
| 090-100s.png | 8 | 1 | 81 | 0.69 | 37 | 51 | 31 | 12 |
| 090-100s.png | 9 | 1 | 82 | 0.69 | 39 | 52 | 31 | 12 |
| 090-100s.png | 0 | 2 | 84 | 0.78 | 40 | 53 | 31 | 12 |
| 090-100s.png | 1 | 2 | 84 | 0.78 | 41 | 53 | 32 | 12 |
| 090-100s.png | 2 | 2 | 85 | 0.74 | 42 | 54 | 32 | 12 |
| 090-100s.png | 3 | 2 | 86 | 0.74 | 42 | 54 | 33 | 12 |
| 090-100s.png | 4 | 2 | 83 | 0.74 | 43 | 54 | 33 | 12 |
| 090-100s.png | 5 | 2 | 82 | 0.74 | 43 | 55 | 34 | 12 |
| 090-100s.png | 6 | 2 | 83 | 0.74 | 43 | 55 | 34 | 12 |
| 090-100s.png | 7 | 2 | 83 | 0.74 | 43 | 55 | 34 | 12 |
| 090-100s.png | 8 | 2 | 86 | 0.67 | 44 | 55 | 34 | 12 |
| 090-100s.png | 9 | 2 | 85 | 0.67 | 44 | 55 | 35 | 12 |
| 090-100s.png | 0 | 3 | 86 | 0.66 | 44 | 55 | 35 | 12 |
| 090-100s.png | 1 | 3 | 85 | 0.65 | 44 | 55 | 35 | 12 |
| 090-100s.png | 2 | 3 | 84 | 0.64 | 43 | 55 | 35 | 12 |
| 090-100s.png | 3 | 3 | 83 | 0.64 | 42 | 55 | 35 | 12 |
| 090-100s.png | 4 | 3 | 84 | 0.66 | 40 | 54 | 33 | 11 |
| 090-100s.png | 5 | 3 | 83 | 0.67 | 37 | 53 | 34 | 11 |
| 090-100s.png | 6 | 3 | 86 | 0.67 | 35 | 53 | 34 | 12 |
| 090-100s.png | 7 | 3 | 85 | 0.66 | 31 | 51 | 33 | 13 |
| 090-100s.png | 8 | 3 | 91 | 0.66 | 27 | 49 | 32 | 16 |
| 090-100s.png | 9 | 3 | 84 | 0.67 | 23 | 46 | 29 | 14 |
| 090-100s.png | 0 | 4 | 65 | 0.61 | 18 | 41 | 27 | 10 |
| 090-100s.png | 1 | 4 | 54 | 0.58 | 13 | 35 | 23 | 10 |
| 090-100s.png | 2 | 4 | 20 | 0.57 | 7 | 28 | 17 | 9 |
| 090-100s.png | 3 | 4 | 17 | 0.47 | 5 | 28 | 17 | 9 |
| 090-100s.png | 4 | 4 | 19 | 0.35 | 8 | 28 | 17 | 14 |
| 090-100s.png | 5 | 4 | 28 | 0.36 | 12 | 30 | 17 | 18 |
| 090-100s.png | 6 | 4 | 43 | 0.34 | 16 | 34 | 19 | 22 |
| 090-100s.png | 7 | 4 | 48 | 0.33 | 17 | 34 | 19 | 23 |
| 090-100s.png | 8 | 4 | 50 | 0.33 | 17 | 34 | 20 | 23 |
| 090-100s.png | 9 | 4 | 48 | 0.34 | 17 | 34 | 19 | 23 |
| 090-100s.png | 0 | 5 | 42 | 0.33 | 17 | 34 | 19 | 23 |
| 090-100s.png | 1 | 5 | 42 | 0.32 | 18 | 34 | 19 | 24 |
| 090-100s.png | 2 | 5 | 43 | 0.31 | 18 | 34 | 19 | 23 |
| 090-100s.png | 3 | 5 | 43 | 0.32 | 18 | 34 | 19 | 23 |
| 090-100s.png | 4 | 5 | 42 | 0.45 | 18 | 34 | 19 | 23 |
| 090-100s.png | 5 | 5 | 42 | 0.45 | 18 | 34 | 19 | 23 |
| 090-100s.png | 6 | 5 | 42 | 0.45 | 18 | 34 | 19 | 23 |
| 090-100s.png | 7 | 5 | 42 | 0.45 | 18 | 34 | 19 | 23 |
| 090-100s.png | 8 | 5 | 42 | 0.45 | 18 | 34 | 19 | 22 |
| 090-100s.png | 9 | 5 | 42 | 0.45 | 18 | 34 | 19 | 22 |
| 090-100s.png | 0 | 6 | 40 | 0.48 | 18 | 34 | 19 | 22 |
| 090-100s.png | 1 | 6 | 40 | 0.47 | 18 | 34 | 19 | 22 |
| 090-100s.png | 2 | 6 | 39 | 0.47 | 18 | 34 | 19 | 22 |
| 090-100s.png | 3 | 6 | 39 | 0.47 | 18 | 34 | 19 | 23 |
| 090-100s.png | 4 | 6 | 42 | 0.35 | 18 | 34 | 19 | 23 |
| 090-100s.png | 5 | 6 | 42 | 0.35 | 18 | 34 | 19 | 23 |
| 090-100s.png | 6 | 6 | 43 | 0.35 | 18 | 34 | 19 | 23 |
| 090-100s.png | 7 | 6 | 42 | 0.35 | 18 | 34 | 19 | 23 |
| 090-100s.png | 8 | 6 | 44 | 0.35 | 18 | 34 | 19 | 23 |
| 090-100s.png | 9 | 6 | 39 | 0.35 | 18 | 34 | 19 | 23 |
| 090-100s.png | 0 | 7 | 40 | 0.33 | 18 | 34 | 19 | 23 |
| 090-100s.png | 1 | 7 | 40 | 0.32 | 17 | 34 | 19 | 23 |
| 090-100s.png | 2 | 7 | 41 | 0.32 | 17 | 34 | 19 | 23 |
| 090-100s.png | 3 | 7 | 41 | 0.32 | 17 | 34 | 19 | 23 |
| 090-100s.png | 4 | 7 | 41 | 0.40 | 18 | 34 | 19 | 23 |
| 090-100s.png | 5 | 7 | 42 | 0.40 | 17 | 34 | 19 | 23 |
| 090-100s.png | 6 | 7 | 41 | 0.40 | 18 | 34 | 19 | 23 |
| 090-100s.png | 7 | 7 | 41 | 0.40 | 18 | 34 | 19 | 23 |
| 090-100s.png | 8 | 7 | 38 | 0.40 | 17 | 34 | 19 | 23 |
| 090-100s.png | 9 | 7 | 37 | 0.40 | 17 | 34 | 19 | 23 |
| 090-100s.png | 0 | 8 | 41 | 0.42 | 17 | 34 | 19 | 23 |
| 090-100s.png | 1 | 8 | 39 | 0.41 | 17 | 34 | 19 | 23 |
| 090-100s.png | 2 | 8 | 40 | 0.41 | 17 | 34 | 19 | 23 |
| 090-100s.png | 3 | 8 | 44 | 0.41 | 18 | 34 | 19 | 23 |
| 090-100s.png | 4 | 8 | 39 | 0.41 | 17 | 34 | 19 | 23 |
| 090-100s.png | 5 | 8 | 40 | 0.40 | 17 | 34 | 19 | 23 |
| 090-100s.png | 6 | 8 | 42 | 0.40 | 17 | 34 | 19 | 23 |
| 090-100s.png | 7 | 8 | 40 | 0.40 | 17 | 34 | 19 | 23 |
| 090-100s.png | 8 | 8 | 42 | 0.40 | 17 | 34 | 19 | 23 |
| 090-100s.png | 9 | 8 | 43 | 0.40 | 17 | 34 | 19 | 23 |
| 090-100s.png | 0 | 9 | 44 | 0.41 | 17 | 34 | 19 | 23 |
| 090-100s.png | 1 | 9 | 42 | 0.40 | 17 | 34 | 19 | 23 |
| 090-100s.png | 2 | 9 | 41 | 0.40 | 17 | 34 | 19 | 23 |
| 090-100s.png | 3 | 9 | 42 | 0.40 | 17 | 34 | 19 | 23 |
| 090-100s.png | 4 | 9 | 43 | 0.40 | 17 | 34 | 19 | 23 |
| 090-100s.png | 5 | 9 | 43 | 0.41 | 17 | 34 | 19 | 22 |
| 090-100s.png | 6 | 9 | 41 | 0.41 | 17 | 34 | 19 | 22 |
| 090-100s.png | 7 | 9 | 41 | 0.41 | 17 | 34 | 19 | 22 |
| 090-100s.png | 8 | 9 | 39 | 0.41 | 17 | 34 | 19 | 22 |
| 090-100s.png | 9 | 9 | 42 | 0.41 | 17 | 34 | 19 | 22 |
| 100-110s.png | 0 | 0 | 40 | 0.41 | 17 | 34 | 19 | 22 |
| 100-110s.png | 1 | 0 | 42 | 0.41 | 17 | 34 | 19 | 22 |
| 100-110s.png | 2 | 0 | 40 | 0.41 | 17 | 34 | 19 | 22 |
| 100-110s.png | 3 | 0 | 38 | 0.41 | 17 | 34 | 19 | 22 |
| 100-110s.png | 4 | 0 | 41 | 0.41 | 17 | 34 | 19 | 22 |
| 100-110s.png | 5 | 0 | 40 | 0.41 | 17 | 34 | 19 | 22 |
| 100-110s.png | 6 | 0 | 41 | 0.41 | 17 | 34 | 19 | 22 |
| 100-110s.png | 7 | 0 | 43 | 0.41 | 17 | 34 | 19 | 22 |
| 100-110s.png | 8 | 0 | 39 | 0.41 | 17 | 34 | 19 | 22 |
| 100-110s.png | 9 | 0 | 39 | 0.41 | 17 | 34 | 19 | 22 |
| 100-110s.png | 0 | 1 | 38 | 0.41 | 17 | 34 | 19 | 22 |
| 100-110s.png | 1 | 1 | 41 | 0.41 | 17 | 34 | 19 | 22 |
| 100-110s.png | 2 | 1 | 38 | 0.41 | 17 | 34 | 19 | 22 |
| 100-110s.png | 3 | 1 | 42 | 0.41 | 17 | 34 | 19 | 22 |
| 100-110s.png | 4 | 1 | 38 | 0.41 | 17 | 34 | 19 | 22 |
| 100-110s.png | 5 | 1 | 40 | 0.41 | 17 | 34 | 19 | 22 |
| 100-110s.png | 6 | 1 | 39 | 0.34 | 17 | 34 | 19 | 22 |
| 100-110s.png | 7 | 1 | 39 | 0.34 | 17 | 34 | 19 | 22 |
| 100-110s.png | 8 | 1 | 42 | 0.34 | 17 | 34 | 19 | 22 |
| 100-110s.png | 9 | 1 | 42 | 0.35 | 17 | 34 | 19 | 22 |
| 100-110s.png | 0 | 2 | 41 | 0.34 | 17 | 34 | 19 | 22 |
| 100-110s.png | 1 | 2 | 40 | 0.34 | 17 | 34 | 19 | 22 |
| 100-110s.png | 2 | 2 | 43 | 0.34 | 17 | 34 | 19 | 21 |
| 100-110s.png | 3 | 2 | 40 | 0.34 | 17 | 34 | 19 | 21 |
| 100-110s.png | 4 | 2 | 39 | 0.34 | 17 | 34 | 19 | 22 |
| 100-110s.png | 5 | 2 | 42 | 0.33 | 17 | 34 | 19 | 22 |
| 100-110s.png | 6 | 2 | 38 | 0.39 | 17 | 34 | 19 | 22 |
| 100-110s.png | 7 | 2 | 38 | 0.40 | 17 | 34 | 19 | 22 |
| 100-110s.png | 8 | 2 | 41 | 0.40 | 17 | 34 | 19 | 22 |
| 100-110s.png | 9 | 2 | 42 | 0.40 | 17 | 34 | 19 | 22 |
| 100-110s.png | 0 | 3 | 40 | 0.40 | 17 | 34 | 19 | 22 |
| 100-110s.png | 1 | 3 | 42 | 0.40 | 17 | 34 | 19 | 21 |
| 100-110s.png | 2 | 3 | 40 | 0.40 | 17 | 34 | 19 | 21 |
| 100-110s.png | 3 | 3 | 39 | 0.40 | 17 | 34 | 19 | 22 |
| 100-110s.png | 4 | 3 | 41 | 0.40 | 17 | 34 | 19 | 22 |
| 100-110s.png | 5 | 3 | 41 | 0.40 | 17 | 34 | 19 | 22 |
| 100-110s.png | 6 | 3 | 40 | 0.33 | 17 | 34 | 19 | 22 |
| 100-110s.png | 7 | 3 | 41 | 0.33 | 17 | 34 | 19 | 22 |
| 100-110s.png | 8 | 3 | 39 | 0.33 | 17 | 34 | 19 | 22 |
| 100-110s.png | 9 | 3 | 42 | 0.33 | 17 | 34 | 19 | 22 |
| 100-110s.png | 0 | 4 | 42 | 0.32 | 17 | 34 | 19 | 22 |
| 100-110s.png | 1 | 4 | 41 | 0.32 | 17 | 34 | 19 | 22 |
| 100-110s.png | 2 | 4 | 41 | 0.32 | 17 | 34 | 19 | 22 |
| 100-110s.png | 3 | 4 | 44 | 0.32 | 17 | 34 | 20 | 21 |
| 100-110s.png | 4 | 4 | 44 | 0.32 | 17 | 34 | 20 | 22 |
| 100-110s.png | 5 | 4 | 42 | 0.32 | 17 | 34 | 20 | 22 |
| 100-110s.png | 6 | 4 | 41 | 0.38 | 17 | 34 | 20 | 22 |
| 100-110s.png | 7 | 4 | 41 | 0.39 | 17 | 34 | 19 | 22 |
| 100-110s.png | 8 | 4 | 38 | 0.39 | 17 | 34 | 19 | 22 |
| 100-110s.png | 9 | 4 | 39 | 0.40 | 17 | 34 | 19 | 22 |
| 100-110s.png | 0 | 5 | 40 | 0.41 | 17 | 34 | 19 | 22 |
| 100-110s.png | 1 | 5 | 37 | 0.40 | 17 | 34 | 19 | 22 |
| 100-110s.png | 2 | 5 | 39 | 0.40 | 17 | 34 | 19 | 22 |
| 100-110s.png | 3 | 5 | 40 | 0.40 | 17 | 34 | 19 | 22 |
| 100-110s.png | 4 | 5 | 41 | 0.40 | 17 | 34 | 19 | 22 |
| 100-110s.png | 5 | 5 | 43 | 0.40 | 17 | 34 | 19 | 22 |
| 100-110s.png | 6 | 5 | 42 | 0.40 | 17 | 34 | 19 | 22 |
| 100-110s.png | 7 | 5 | 41 | 0.40 | 17 | 34 | 19 | 22 |
| 100-110s.png | 8 | 5 | 42 | 0.40 | 17 | 34 | 19 | 22 |
| 100-110s.png | 9 | 5 | 42 | 0.40 | 17 | 34 | 19 | 22 |
| 100-110s.png | 0 | 6 | 43 | 0.40 | 17 | 34 | 19 | 22 |
| 100-110s.png | 1 | 6 | 41 | 0.39 | 17 | 34 | 19 | 22 |
| 100-110s.png | 2 | 6 | 40 | 0.39 | 17 | 34 | 19 | 22 |
| 100-110s.png | 3 | 6 | 42 | 0.39 | 17 | 34 | 19 | 22 |
| 100-110s.png | 4 | 6 | 41 | 0.39 | 17 | 34 | 19 | 22 |
| 100-110s.png | 5 | 6 | 41 | 0.39 | 17 | 34 | 19 | 22 |
| 100-110s.png | 6 | 6 | 39 | 0.39 | 17 | 34 | 19 | 22 |
| 100-110s.png | 7 | 6 | 39 | 0.40 | 17 | 34 | 19 | 22 |
| 100-110s.png | 8 | 6 | 41 | 0.35 | 17 | 34 | 19 | 22 |
| 100-110s.png | 9 | 6 | 41 | 0.35 | 17 | 34 | 19 | 22 |
| 100-110s.png | 0 | 7 | 40 | 0.34 | 17 | 34 | 19 | 22 |
| 100-110s.png | 1 | 7 | 38 | 0.33 | 17 | 34 | 19 | 22 |
| 100-110s.png | 2 | 7 | 39 | 0.33 | 17 | 34 | 19 | 22 |
| 100-110s.png | 3 | 7 | 38 | 0.33 | 17 | 34 | 19 | 22 |
| 100-110s.png | 4 | 7 | 38 | 0.33 | 17 | 34 | 19 | 22 |
| 100-110s.png | 5 | 7 | 39 | 0.33 | 17 | 34 | 19 | 23 |
| 100-110s.png | 6 | 7 | 39 | 0.33 | 17 | 34 | 19 | 23 |
| 100-110s.png | 7 | 7 | 41 | 0.39 | 17 | 34 | 19 | 23 |
| 100-110s.png | 8 | 7 | 40 | 0.39 | 17 | 34 | 19 | 22 |
| 100-110s.png | 9 | 7 | 39 | 0.40 | 17 | 34 | 19 | 22 |
| 100-110s.png | 0 | 8 | 40 | 0.41 | 17 | 34 | 19 | 22 |
| 100-110s.png | 1 | 8 | 38 | 0.40 | 17 | 34 | 19 | 22 |
| 100-110s.png | 2 | 8 | 37 | 0.40 | 17 | 34 | 19 | 22 |
| 100-110s.png | 3 | 8 | 39 | 0.40 | 17 | 34 | 19 | 23 |
| 100-110s.png | 4 | 8 | 40 | 0.40 | 17 | 34 | 19 | 23 |
| 100-110s.png | 5 | 8 | 41 | 0.40 | 17 | 34 | 19 | 23 |
| 100-110s.png | 6 | 8 | 40 | 0.40 | 17 | 34 | 19 | 22 |
| 100-110s.png | 7 | 8 | 39 | 0.40 | 17 | 34 | 19 | 23 |
| 100-110s.png | 8 | 8 | 38 | 0.33 | 17 | 34 | 19 | 22 |
| 100-110s.png | 9 | 8 | 41 | 0.33 | 17 | 34 | 19 | 22 |
| 100-110s.png | 0 | 9 | 39 | 0.32 | 17 | 34 | 19 | 22 |
| 100-110s.png | 1 | 9 | 38 | 0.32 | 17 | 34 | 19 | 22 |
| 100-110s.png | 2 | 9 | 39 | 0.32 | 17 | 34 | 19 | 22 |
| 100-110s.png | 3 | 9 | 41 | 0.32 | 17 | 34 | 19 | 22 |
| 100-110s.png | 4 | 9 | 40 | 0.32 | 17 | 34 | 19 | 22 |
| 100-110s.png | 5 | 9 | 40 | 0.32 | 17 | 34 | 19 | 23 |
| 100-110s.png | 6 | 9 | 43 | 0.32 | 17 | 34 | 19 | 23 |
| 100-110s.png | 7 | 9 | 43 | 0.32 | 17 | 34 | 19 | 23 |
| 100-110s.png | 8 | 9 | 44 | 0.41 | 17 | 34 | 19 | 23 |
| 100-110s.png | 9 | 9 | 43 | 0.41 | 17 | 34 | 19 | 23 |
| 110-120s.png | 0 | 0 | 46 | 0.42 | 17 | 34 | 19 | 23 |
| 110-120s.png | 1 | 0 | 40 | 0.42 | 17 | 34 | 19 | 23 |
| 110-120s.png | 2 | 0 | 43 | 0.41 | 17 | 34 | 19 | 23 |
| 110-120s.png | 3 | 0 | 42 | 0.41 | 18 | 34 | 19 | 22 |
| 110-120s.png | 4 | 0 | 41 | 0.42 | 18 | 34 | 20 | 22 |
| 110-120s.png | 5 | 0 | 40 | 0.42 | 18 | 34 | 19 | 22 |
| 110-120s.png | 6 | 0 | 42 | 0.42 | 17 | 34 | 19 | 22 |
| 110-120s.png | 7 | 0 | 42 | 0.42 | 17 | 34 | 19 | 22 |
| 110-120s.png | 8 | 0 | 43 | 0.43 | 17 | 34 | 19 | 22 |
| 110-120s.png | 9 | 0 | 10 | 0.61 | 6 | 28 | 17 | 9 |
| 110-120s.png | 0 | 1 | 10 | 0.12 | 5 | 28 | 17 | 9 |
| 110-120s.png | 1 | 1 | 11 | 0.08 | 5 | 28 | 17 | 9 |
| 110-120s.png | 2 | 1 | 11 | 0.08 | 5 | 28 | 17 | 9 |
| 110-120s.png | 3 | 1 | 12 | 0.09 | 5 | 28 | 17 | 9 |
| 110-120s.png | 4 | 1 | 32 | 0.09 | 6 | 29 | 17 | 10 |
| 110-120s.png | 5 | 1 | 45 | 0.14 | 10 | 36 | 19 | 15 |
| 110-120s.png | 6 | 1 | 52 | 0.25 | 22 | 50 | 28 | 31 |
| 110-120s.png | 7 | 1 | 49 | 0.44 | 42 | 62 | 49 | 32 |
| 110-120s.png | 8 | 1 | 47 | 0.56 | 54 | 66 | 58 | 26 |
| 110-120s.png | 9 | 1 | 57 | 0.73 | 67 | 57 | 40 | 57 |
| 110-120s.png | 0 | 2 | 79 | 0.82 | 72 | 52 | 33 | 60 |
| 110-120s.png | 1 | 2 | 57 | 0.82 | 74 | 56 | 46 | 44 |
| 110-120s.png | 2 | 2 | 59 | 0.84 | 76 | 60 | 54 | 31 |
| 110-120s.png | 3 | 2 | 55 | 0.84 | 78 | 60 | 55 | 25 |
| 110-120s.png | 4 | 2 | 56 | 0.84 | 80 | 60 | 54 | 25 |
| 110-120s.png | 5 | 2 | 57 | 0.84 | 81 | 60 | 54 | 26 |
| 110-120s.png | 6 | 2 | 53 | 0.84 | 82 | 62 | 56 | 27 |
| 110-120s.png | 7 | 2 | 53 | 0.84 | 82 | 63 | 58 | 26 |
| 110-120s.png | 8 | 2 | 51 | 0.84 | 81 | 64 | 58 | 26 |
| 110-120s.png | 9 | 2 | 52 | 0.84 | 80 | 63 | 57 | 25 |
| 110-120s.png | 0 | 3 | 53 | 0.84 | 78 | 61 | 56 | 24 |
| 110-120s.png | 1 | 3 | 53 | 0.83 | 76 | 60 | 54 | 23 |
| 110-120s.png | 2 | 3 | 57 | 0.83 | 74 | 59 | 53 | 23 |
| 110-120s.png | 3 | 3 | 56 | 0.84 | 73 | 59 | 53 | 25 |
| 110-120s.png | 4 | 3 | 58 | 0.84 | 71 | 60 | 54 | 27 |
| 110-120s.png | 5 | 3 | 59 | 0.83 | 68 | 62 | 54 | 26 |
| 110-120s.png | 6 | 3 | 59 | 0.81 | 63 | 63 | 54 | 25 |
| 110-120s.png | 7 | 3 | 59 | 0.71 | 43 | 64 | 55 | 23 |
| 110-120s.png | 8 | 3 | 43 | 0.67 | 29 | 58 | 49 | 22 |
| 110-120s.png | 9 | 3 | 37 | 0.30 | 16 | 45 | 35 | 17 |
| 110-120s.png | 0 | 4 | 20 | 0.09 | 9 | 36 | 23 | 14 |
| 110-120s.png | 1 | 4 | 20 | 0.08 | 10 | 35 | 24 | 12 |
| 110-120s.png | 2 | 4 | 23 | 0.07 | 10 | 36 | 24 | 12 |
| 110-120s.png | 3 | 4 | 36 | 0.09 | 10 | 36 | 24 | 12 |
| 110-120s.png | 4 | 4 | 68 | 0.11 | 12 | 39 | 25 | 16 |
| 110-120s.png | 5 | 4 | 77 | 0.14 | 15 | 41 | 25 | 20 |
| 110-120s.png | 6 | 4 | 83 | 0.17 | 17 | 44 | 25 | 25 |
| 110-120s.png | 7 | 4 | 85 | 0.21 | 19 | 44 | 25 | 27 |
| 110-120s.png | 8 | 4 | 89 | 0.26 | 21 | 45 | 26 | 25 |
| 110-120s.png | 9 | 4 | 87 | 0.42 | 25 | 48 | 29 | 27 |
| 110-120s.png | 0 | 5 | 86 | 0.70 | 27 | 49 | 31 | 26 |
| 110-120s.png | 1 | 5 | 83 | 0.69 | 29 | 49 | 33 | 25 |
| 110-120s.png | 2 | 5 | 86 | 0.70 | 31 | 51 | 34 | 29 |
| 110-120s.png | 3 | 5 | 84 | 0.71 | 32 | 52 | 34 | 30 |
| 110-120s.png | 4 | 5 | 81 | 0.71 | 33 | 53 | 34 | 31 |
| 110-120s.png | 5 | 5 | 77 | 0.71 | 34 | 53 | 35 | 32 |
| 110-120s.png | 6 | 5 | 77 | 0.71 | 34 | 54 | 35 | 31 |
| 110-120s.png | 7 | 5 | 75 | 0.71 | 34 | 54 | 35 | 30 |
| 110-120s.png | 8 | 5 | 73 | 0.71 | 34 | 54 | 36 | 29 |
| 110-120s.png | 9 | 5 | 70 | 0.74 | 34 | 54 | 36 | 29 |
| 110-120s.png | 0 | 6 | 75 | 0.76 | 34 | 54 | 36 | 28 |
| 110-120s.png | 1 | 6 | 79 | 0.75 | 33 | 54 | 36 | 27 |
| 110-120s.png | 2 | 6 | 79 | 0.75 | 33 | 54 | 36 | 26 |
| 110-120s.png | 3 | 6 | 80 | 0.75 | 33 | 54 | 36 | 26 |
| 110-120s.png | 4 | 6 | 80 | 0.75 | 33 | 54 | 36 | 26 |
| 110-120s.png | 5 | 6 | 77 | 0.75 | 32 | 53 | 36 | 25 |
| 110-120s.png | 6 | 6 | 76 | 0.75 | 32 | 53 | 36 | 25 |
| 110-120s.png | 7 | 6 | 80 | 0.75 | 32 | 53 | 36 | 25 |
| 110-120s.png | 8 | 6 | 77 | 0.75 | 32 | 54 | 36 | 26 |
| 110-120s.png | 9 | 6 | 77 | 0.75 | 33 | 54 | 36 | 26 |
| 110-120s.png | 0 | 7 | 79 | 0.73 | 33 | 54 | 36 | 26 |
| 110-120s.png | 1 | 7 | 79 | 0.71 | 33 | 54 | 36 | 27 |
| 110-120s.png | 2 | 7 | 78 | 0.71 | 34 | 54 | 36 | 27 |
| 110-120s.png | 3 | 7 | 78 | 0.71 | 34 | 54 | 36 | 28 |
| 110-120s.png | 4 | 7 | 76 | 0.71 | 34 | 54 | 36 | 28 |
| 110-120s.png | 5 | 7 | 75 | 0.72 | 34 | 54 | 35 | 28 |
| 110-120s.png | 6 | 7 | 80 | 0.72 | 35 | 55 | 36 | 29 |
| 110-120s.png | 7 | 7 | 76 | 0.72 | 35 | 55 | 36 | 29 |
| 110-120s.png | 8 | 7 | 75 | 0.72 | 36 | 55 | 36 | 29 |
| 110-120s.png | 9 | 7 | 74 | 0.73 | 37 | 55 | 36 | 29 |
| 110-120s.png | 0 | 8 | 73 | 0.74 | 37 | 56 | 36 | 30 |
| 110-120s.png | 1 | 8 | 77 | 0.74 | 38 | 56 | 36 | 31 |
| 110-120s.png | 2 | 8 | 77 | 0.74 | 38 | 56 | 36 | 32 |
| 110-120s.png | 3 | 8 | 78 | 0.74 | 39 | 56 | 36 | 33 |
| 110-120s.png | 4 | 8 | 79 | 0.74 | 39 | 56 | 36 | 34 |
| 110-120s.png | 5 | 8 | 76 | 0.74 | 39 | 57 | 36 | 35 |
| 110-120s.png | 6 | 8 | 78 | 0.74 | 40 | 57 | 36 | 36 |
| 110-120s.png | 7 | 8 | 76 | 0.74 | 40 | 57 | 35 | 37 |
| 110-120s.png | 8 | 8 | 77 | 0.74 | 41 | 57 | 35 | 38 |
| 110-120s.png | 9 | 8 | 81 | 0.74 | 41 | 57 | 35 | 39 |
| 110-120s.png | 0 | 9 | 84 | 0.74 | 41 | 57 | 36 | 39 |
| 110-120s.png | 1 | 9 | 84 | 0.74 | 41 | 58 | 36 | 40 |
| 110-120s.png | 2 | 9 | 85 | 0.73 | 41 | 58 | 36 | 40 |
| 110-120s.png | 3 | 9 | 81 | 0.73 | 41 | 58 | 36 | 40 |
| 110-120s.png | 4 | 9 | 80 | 0.73 | 41 | 57 | 36 | 41 |
| 110-120s.png | 5 | 9 | 78 | 0.73 | 41 | 57 | 36 | 40 |
| 110-120s.png | 6 | 9 | 77 | 0.73 | 40 | 57 | 36 | 40 |
| 110-120s.png | 7 | 9 | 78 | 0.73 | 40 | 57 | 36 | 40 |
| 110-120s.png | 8 | 9 | 80 | 0.73 | 40 | 57 | 36 | 39 |
| 110-120s.png | 9 | 9 | 82 | 0.62 | 39 | 57 | 36 | 39 |
| 120-130s.png | 0 | 0 | 89 | 0.63 | 38 | 57 | 36 | 38 |
| 120-130s.png | 1 | 0 | 94 | 0.63 | 38 | 57 | 35 | 37 |
| 120-130s.png | 2 | 0 | 89 | 0.62 | 35 | 55 | 33 | 38 |
| 120-130s.png | 3 | 0 | 80 | 0.61 | 32 | 53 | 32 | 37 |
| 120-130s.png | 4 | 0 | 78 | 0.60 | 27 | 50 | 30 | 33 |
| 120-130s.png | 5 | 0 | 75 | 0.59 | 23 | 46 | 26 | 29 |
| 120-130s.png | 6 | 0 | 69 | 0.58 | 18 | 43 | 24 | 24 |
| 120-130s.png | 7 | 0 | 60 | 0.57 | 15 | 39 | 24 | 18 |
| 120-130s.png | 8 | 0 | 39 | 0.53 | 11 | 36 | 23 | 12 |
| 120-130s.png | 9 | 0 | 23 | 0.53 | 10 | 36 | 23 | 12 |
| 120-130s.png | 0 | 1 | 20 | 0.09 | 10 | 36 | 23 | 13 |
| 120-130s.png | 1 | 1 | 19 | 0.07 | 9 | 35 | 22 | 15 |
| 120-130s.png | 2 | 1 | 18 | 0.07 | 7 | 32 | 19 | 13 |
| 120-130s.png | 3 | 1 | 22 | 0.07 | 6 | 29 | 17 | 9 |
| 120-130s.png | 4 | 1 | 27 | 0.08 | 8 | 36 | 19 | 11 |
| 120-130s.png | 5 | 1 | 32 | 0.09 | 9 | 38 | 20 | 10 |
| 120-130s.png | 6 | 1 | 32 | 0.09 | 9 | 37 | 20 | 10 |
| 120-130s.png | 7 | 1 | 33 | 0.09 | 9 | 37 | 19 | 10 |
| 120-130s.png | 8 | 1 | 36 | 0.09 | 9 | 37 | 19 | 10 |
| 120-130s.png | 9 | 1 | 36 | 0.09 | 9 | 37 | 19 | 10 |
| 120-130s.png | 0 | 2 | 37 | 0.10 | 9 | 37 | 19 | 10 |
| 120-130s.png | 1 | 2 | 31 | 0.10 | 9 | 36 | 19 | 9 |
| 120-130s.png | 2 | 2 | 32 | 0.10 | 8 | 35 | 19 | 9 |
| 120-130s.png | 3 | 2 | 31 | 0.09 | 7 | 32 | 18 | 9 |
| 120-130s.png | 4 | 2 | 21 | 0.09 | 6 | 29 | 17 | 9 |
| 120-130s.png | 5 | 2 | 14 | 0.09 | 5 | 28 | 17 | 9 |
| 120-130s.png | 6 | 2 | 14 | 0.09 | 5 | 28 | 17 | 9 |
| 120-130s.png | 7 | 2 | 14 | 0.09 | 5 | 28 | 17 | 9 |
| 120-130s.png | 8 | 2 | 14 | 0.09 | 5 | 28 | 17 | 9 |
| 120-130s.png | 9 | 2 | 13 | 0.09 | 5 | 28 | 17 | 9 |
| 120-130s.png | 0 | 3 | 14 | 0.01 | 5 | 28 | 17 | 9 |
| 120-130s.png | 1 | 3 | 12 | 0.01 | 5 | 28 | 17 | 9 |
| 120-130s.png | 2 | 3 | 44 | 0.03 | 7 | 30 | 17 | 12 |
| 120-130s.png | 3 | 3 | 153 | 0.10 | 18 | 44 | 24 | 34 |
| 120-130s.png | 4 | 3 | 159 | 0.13 | 22 | 48 | 26 | 22 |
| 120-130s.png | 5 | 3 | 173 | 0.17 | 26 | 51 | 27 | 27 |
| 120-130s.png | 6 | 3 | 172 | 0.19 | 29 | 53 | 29 | 31 |
| 120-130s.png | 7 | 3 | 173 | 0.20 | 30 | 54 | 29 | 33 |
| 120-130s.png | 8 | 3 | 170 | 0.21 | 31 | 54 | 29 | 34 |
| 120-130s.png | 9 | 3 | 176 | 0.21 | 31 | 54 | 29 | 35 |
| 120-130s.png | 0 | 4 | 175 | 0.51 | 32 | 54 | 29 | 35 |
| 120-130s.png | 1 | 4 | 174 | 0.51 | 32 | 54 | 29 | 35 |
| 120-130s.png | 2 | 4 | 177 | 0.31 | 31 | 54 | 29 | 35 |
| 120-130s.png | 3 | 4 | 177 | 0.31 | 31 | 54 | 29 | 35 |
| 120-130s.png | 4 | 4 | 177 | 0.31 | 31 | 54 | 29 | 35 |
| 120-130s.png | 5 | 4 | 177 | 0.31 | 31 | 54 | 29 | 35 |
| 120-130s.png | 6 | 4 | 179 | 0.31 | 31 | 54 | 29 | 35 |
| 120-130s.png | 7 | 4 | 178 | 0.31 | 31 | 54 | 29 | 35 |
| 120-130s.png | 8 | 4 | 176 | 0.31 | 31 | 54 | 29 | 35 |
| 120-130s.png | 9 | 4 | 179 | 0.31 | 31 | 54 | 29 | 35 |
| 120-130s.png | 0 | 5 | 176 | 0.26 | 31 | 54 | 29 | 35 |
| 120-130s.png | 1 | 5 | 174 | 0.27 | 31 | 54 | 29 | 35 |
| 120-130s.png | 2 | 5 | 174 | 0.26 | 31 | 54 | 29 | 35 |
| 120-130s.png | 3 | 5 | 190 | 0.34 | 42 | 58 | 34 | 41 |
| 120-130s.png | 4 | 5 | 197 | 0.43 | 52 | 62 | 39 | 44 |
| 120-130s.png | 5 | 5 | 213 | 0.46 | 52 | 63 | 39 | 28 |
| 120-130s.png | 6 | 5 | 203 | 0.46 | 52 | 63 | 39 | 26 |
| 120-130s.png | 7 | 5 | 204 | 0.46 | 52 | 63 | 39 | 26 |
| 120-130s.png | 8 | 5 | 204 | 0.46 | 52 | 63 | 39 | 26 |
| 120-130s.png | 9 | 5 | 203 | 0.45 | 52 | 63 | 39 | 26 |
| 120-130s.png | 0 | 6 | 206 | 0.47 | 54 | 64 | 41 | 39 |
| 120-130s.png | 1 | 6 | 222 | 0.39 | 42 | 62 | 35 | 48 |
| 120-130s.png | 2 | 6 | 221 | 0.41 | 40 | 61 | 36 | 35 |
| 120-130s.png | 3 | 6 | 210 | 0.41 | 40 | 61 | 36 | 32 |
| 120-130s.png | 4 | 6 | 212 | 0.40 | 40 | 61 | 36 | 32 |
| 120-130s.png | 5 | 6 | 208 | 0.40 | 40 | 61 | 36 | 32 |
| 120-130s.png | 6 | 6 | 207 | 0.38 | 40 | 61 | 36 | 32 |
| 120-130s.png | 7 | 6 | 205 | 0.40 | 43 | 59 | 38 | 39 |
| 120-130s.png | 8 | 6 | 227 | 0.47 | 49 | 62 | 38 | 38 |
| 120-130s.png | 9 | 6 | 225 | 0.49 | 54 | 66 | 40 | 40 |
| 120-130s.png | 0 | 7 | 231 | 0.47 | 54 | 67 | 40 | 40 |
| 120-130s.png | 1 | 7 | 234 | 0.65 | 54 | 67 | 40 | 40 |
| 120-130s.png | 2 | 7 | 233 | 0.66 | 54 | 67 | 40 | 40 |
| 120-130s.png | 3 | 7 | 247 | 0.67 | 76 | 83 | 60 | 58 |
| 120-130s.png | 4 | 7 | 243 | 0.68 | 77 | 86 | 62 | 47 |
| 120-130s.png | 5 | 7 | 228 | 0.66 | 75 | 87 | 60 | 35 |
| 120-130s.png | 6 | 7 | 226 | 0.66 | 75 | 87 | 60 | 32 |
| 120-130s.png | 7 | 7 | 227 | 0.66 | 75 | 87 | 60 | 32 |
| 120-130s.png | 8 | 7 | 192 | 0.65 | 71 | 87 | 56 | 68 |
| 120-130s.png | 9 | 7 | 186 | 0.62 | 47 | 71 | 34 | 58 |
| 120-130s.png | 0 | 8 | 173 | 0.64 | 38 | 64 | 28 | 47 |
| 120-130s.png | 1 | 8 | 167 | 0.62 | 36 | 62 | 27 | 44 |
| 120-130s.png | 2 | 8 | 164 | 0.60 | 36 | 62 | 27 | 44 |
| 120-130s.png | 3 | 8 | 163 | 0.54 | 36 | 62 | 27 | 44 |
| 120-130s.png | 4 | 8 | 139 | 0.51 | 26 | 51 | 26 | 32 |
| 120-130s.png | 5 | 8 | 151 | 0.52 | 28 | 53 | 26 | 30 |
| 120-130s.png | 6 | 8 | 165 | 0.54 | 34 | 60 | 27 | 41 |
| 120-130s.png | 7 | 8 | 173 | 0.54 | 36 | 62 | 27 | 43 |
| 120-130s.png | 8 | 8 | 167 | 0.54 | 36 | 62 | 27 | 44 |
| 120-130s.png | 9 | 8 | 168 | 0.54 | 36 | 62 | 27 | 44 |
| 120-130s.png | 0 | 9 | 168 | 0.54 | 36 | 62 | 27 | 44 |
| 120-130s.png | 1 | 9 | 166 | 0.53 | 36 | 62 | 27 | 44 |
| 120-130s.png | 2 | 9 | 167 | 0.32 | 36 | 62 | 28 | 44 |
| 120-130s.png | 3 | 9 | 168 | 0.31 | 36 | 62 | 28 | 44 |
| 120-130s.png | 4 | 9 | 168 | 0.31 | 36 | 62 | 28 | 44 |
| 120-130s.png | 5 | 9 | 168 | 0.31 | 36 | 62 | 28 | 44 |
| 120-130s.png | 6 | 9 | 168 | 0.31 | 36 | 62 | 28 | 44 |
| 120-130s.png | 7 | 9 | 168 | 0.31 | 36 | 62 | 28 | 44 |
| 120-130s.png | 8 | 9 | 168 | 0.31 | 36 | 62 | 28 | 44 |
| 120-130s.png | 9 | 9 | 166 | 0.31 | 36 | 62 | 28 | 44 |
| 130-140s.png | 0 | 0 | 168 | 0.30 | 36 | 62 | 28 | 44 |
| 130-140s.png | 1 | 0 | 168 | 0.29 | 36 | 62 | 27 | 44 |
| 130-140s.png | 2 | 0 | 166 | 0.27 | 36 | 62 | 28 | 44 |
| 130-140s.png | 3 | 0 | 166 | 0.26 | 36 | 62 | 27 | 44 |
| 130-140s.png | 4 | 0 | 166 | 0.26 | 36 | 62 | 27 | 44 |
| 130-140s.png | 5 | 0 | 166 | 0.26 | 36 | 62 | 27 | 44 |
| 130-140s.png | 6 | 0 | 166 | 0.26 | 36 | 62 | 27 | 44 |
| 130-140s.png | 7 | 0 | 34 | 0.15 | 39 | 20 | 11 | 15 |
| 130-140s.png | 8 | 0 | 34 | 0.15 | 39 | 20 | 11 | 15 |
| 130-140s.png | 9 | 0 | 34 | 0.15 | 39 | 20 | 11 | 15 |
| 130-140s.png | 0 | 1 | 34 | 0.15 | 39 | 20 | 11 | 15 |
| 130-140s.png | 1 | 1 | 33 | 0.15 | 39 | 20 | 11 | 15 |
| 130-140s.png | 2 | 1 | 33 | 0.15 | 39 | 20 | 11 | 15 |
| 130-140s.png | 3 | 1 | 33 | 0.15 | 39 | 20 | 11 | 15 |
| 130-140s.png | 4 | 1 | 33 | 0.15 | 39 | 20 | 11 | 15 |
| 130-140s.png | 5 | 1 | 33 | 0.15 | 39 | 20 | 11 | 15 |
| 130-140s.png | 6 | 1 | 33 | 0.15 | 39 | 20 | 11 | 15 |
| 130-140s.png | 7 | 1 | 33 | 0.15 | 39 | 20 | 11 | 15 |
| 130-140s.png | 8 | 1 | 33 | 0.15 | 39 | 20 | 11 | 15 |
| 130-140s.png | 9 | 1 | 33 | 0.15 | 39 | 20 | 11 | 15 |
| 130-140s.png | 0 | 2 | 33 | 0.15 | 39 | 20 | 11 | 15 |
| 130-140s.png | 1 | 2 | 35 | 0.15 | 39 | 20 | 10 | 15 |
| 130-140s.png | 2 | 2 | 35 | 0.15 | 39 | 20 | 10 | 15 |
| 130-140s.png | 3 | 2 | 35 | 0.15 | 40 | 20 | 10 | 15 |
| 130-140s.png | 4 | 2 | 36 | 0.16 | 44 | 23 | 13 | 16 |
| 130-140s.png | 5 | 2 | 24 | 0.26 | 102 | 25 | 9 | 32 |
| 130-140s.png | 6 | 2 | 23 | 0.26 | 108 | 25 | 9 | 34 |
| 130-140s.png | 7 | 2 | 30 | 0.26 | 108 | 27 | 10 | 35 |
| 130-140s.png | 8 | 2 | 29 | 0.26 | 108 | 28 | 10 | 36 |
| 130-140s.png | 9 | 2 | 29 | 0.26 | 108 | 29 | 11 | 36 |
| 130-140s.png | 0 | 3 | 29 | 0.26 | 107 | 29 | 11 | 37 |
| 130-140s.png | 1 | 3 | 29 | 0.26 | 107 | 29 | 11 | 37 |
| 130-140s.png | 2 | 3 | 29 | 0.26 | 107 | 29 | 11 | 38 |
| 130-140s.png | 3 | 3 | 28 | 0.26 | 107 | 30 | 11 | 38 |
| 130-140s.png | 4 | 3 | 28 | 0.27 | 98 | 38 | 23 | 35 |
| 130-140s.png | 5 | 3 | 40 | 0.27 | 100 | 34 | 19 | 35 |
| 130-140s.png | 6 | 3 | 41 | 0.27 | 100 | 34 | 19 | 35 |
| 130-140s.png | 7 | 3 | 41 | 0.27 | 101 | 34 | 19 | 35 |
| 130-140s.png | 8 | 3 | 45 | 0.27 | 101 | 34 | 19 | 35 |
| 130-140s.png | 9 | 3 | 44 | 0.27 | 101 | 34 | 19 | 35 |
| 130-140s.png | 0 | 4 | 40 | 0.27 | 101 | 34 | 19 | 36 |
| 130-140s.png | 1 | 4 | 38 | 0.27 | 101 | 34 | 19 | 36 |
| 130-140s.png | 2 | 4 | 38 | 0.27 | 101 | 34 | 19 | 36 |
| 130-140s.png | 3 | 4 | 38 | 0.27 | 101 | 34 | 19 | 36 |

---

## 6. What the final fix must do

This is the shortest possible list that answers the numbers above. It is not a wish list; each line
comes from a measurement that is far outside the reference's range.

1. **Fill the frame.** No horizontal seam, no empty top half. The art must reach the top edge, both sides
   and the bottom. Our row structure has to come down from 52.9 to the reference's 30, and our centre luma
   from 93.6 to about 48.
2. **Paint it.** The art needs graded fills, at least two tones inside every bar or ring, and a second
   colour family in the same frame. Our colour count has to rise from 35 into the reference's 80 to 230.
3. **Saturate it.** Our ceiling of 0.62 has to reach the reference's working range of 0.68 to 0.78, and
   the field has to be a flat, strong colour rather than a wine wash.
4. **Break the symmetry.** Our asymmetry never passes 13.1; the reference leans at a median of 22.
5. **Make it jump.** The 90th percentile of change between tenths of a second has to go from 4.45 to about
   11.5, and a third of the frames, not a quarter, have to carry a real change.
6. **Change the picture inside the card.** The reference replaces its image every one to two seconds. One
   continuous shot for ten seconds is the thing our card does that the reference never does.
7. **Put the words in the picture, not above it.** Plain white, no coloured ghost, at the reference's
   scale, with the support line tight underneath in a muted tone.
8. **Reserve the chrome band.** The pause, sound, close and the progress dashes belong in a black band
   above the art, not printed over it.

Until all eight are true at once, the card is not Wrapped, and no amount of tuning one of them will make
it Wrapped.

## 7. What this document does not claim

- It measures **one chapter**, the counting card. The other nineteen were not recorded or measured here.
- The measurements are global statistics (colour count, structure, symmetry, motion). They cannot say
  what a shape *is*, only how it behaves; the qualitative findings in section 3 come from looking at the
  named tiles, and they are written as observations, not as measurements.
- The recording includes the moment the film cuts into the card, which explains the handful of frames with
  luma above 200. They are in the table rather than hidden.
- Nothing here has been fixed yet. This is the diagnosis, written before the last attempt.
