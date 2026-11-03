# The plan: the journey page, closer to 9292

The twenty items below are the spec, word for word as the steerer wrote them. Nothing in them is to be
softened, reworded, merged or skipped. Each one gets a plan under it saying what has to be built, how
big it is, and how we know it is done.

Sizes: **S** ten minutes · **M** an hour · **L** half a day · **XL** a day or more.

---

## The top row

### 1. Departure alarm
**9292's clock opens a departure alarm: a slider with minus and plus, set to warn you five minutes before you have to leave, and Cancel / Save under it. It tells you when to go. OVVO has no such control.**

- **Build:** a clock control in the journey's top row, opening a sheet that holds a slider with a minus and a plus, the warning set to five minutes to begin with, and Cancel / Save under it. Saving works out the minute you have to leave — the first leg's departure minus the walk to it minus the warning — and sets a reminder for it.
- **Where:** the top row, beside the journey's own controls; the sheet over the page.
- **Size:** L.
- **Done when:** the slider moves in whole minutes, the plus and minus match the slider, Cancel changes nothing, Save keeps the setting on the journey, and the reminder fires at the minute shown.

### 2. Share
**9292's share button offers exactly two things: share the journey advice, and save it to your calendar. OVVO has neither.**

- **Build:** one share control that opens exactly two choices. *Share the journey* hands the journey to the phone's own share sheet, and copies the link where there is no share sheet. *Save it to your calendar* writes a calendar entry with the two ends, the departure and the arrival, which any calendar app opens.
- **Where:** the top row.
- **Size:** XL, both choices.
- **Done when:** the sheet shows exactly those two lines, sharing produces a working link to this journey, and the calendar file opens in a calendar with the right times and places.

### 3. Alert counter
**OVVO shows a red "14" badge in the top row. 9292 has nothing like it.**

- **Build:** remove the badge from the top row. The alerts keep their own places: the journey's alert row, and the alerts page.
- **Where:** the top row.
- **Size:** S.
- **Done when:** no counter sits in the top row on any screen, and the alerts are still reachable where they were.

---

## Under the title

### 4. Map thumbnail
**9292 has a small route map with an expand arrow in the top right. OVVO has no map preview there.**

- **Build:** a small map beside the title with the journey's route drawn on it, and the expand arrow in its corner, opening the map screen on this journey. The thumbnail draws the same map the map screen does, so when the street map arrives with items 13 and 14 the thumbnail shows streets too.
- **Where:** the head, top right of the title block.
- **Size:** M, or an hour on top of the work in 13 and 14.
- **Done when:** the thumbnail draws this journey and not another, the arrow opens the map on the same journey, and it is legible at 320px.

### 5. Separators between the mode glyphs
**9292 puts a dot between each one. OVVO uses plain spacing.**

- **Build:** a small muted dot between each pair of glyphs in the chain.
- **Where:** under the title.
- **Size:** S.
- **Done when:** every pair of glyphs has a dot between it, and the chain does not wrap on a phone.

### 6. The change count
**9292 writes "2 ×" with a swap glyph. OVVO writes "1 transfer" in words.**

- **Build:** print the figure, the multiplication sign and the swap glyph, exactly as 9292 does. The full sentence stays underneath for screen readers, so the sign is never read out as "times".
- **Where:** under the title, at the right of the mode chain.
- **Size:** S.
- **Done when:** a journey with two changes reads "2 ×" with the swap glyph, a direct journey reads "0 ×", and a screen reader hears the sentence.

### 7. The price
**9292 puts it in a pale rounded chip. OVVO prints it as bold ink. Both carry a star.**

- **Build:** the price goes back into a pale rounded chip, as 9292 has it. The chip sits on the meta line with the date and the length, and the star stays with the amount.
- **Where:** the meta line under the title.
- **Size:** S.
- **Done when:** the chip is a rounded pale block around the price only, nothing beside it looks shaded by it, and the star is inside the chip.

---

## The rail: times and platforms

### 8. Time weight
**9292 uses ordinary weight. OVVO prints the times bold.**

- **Build:** the times on the rail go back to ordinary weight.
- **Where:** every time in the rail's gutter.
- **Size:** S.
- **Done when:** the times are ordinary weight, still numeral-aligned, and the rows do not change height.

### 9. Platform position
**9292 pushes it to the far right edge of the row. OVVO puts it right after the station name.**

- **Build:** the platform is pushed to the right edge of its row, on the departure rows, the arrival row and the stop rows. A long station name wraps rather than pushing the platform off the page.
- **Where:** every row on the rail.
- **Size:** M.
- **Done when:** the platform sits at the right edge on all three kinds of row, at 320px and 390px, in light and dark, with no page overflow and no clipped name.

### 10. Two possible platforms
**9292 can print two in red when it is unsure. OVVO always shows one.**

- **Build:** when a service's platform is not yet settled, print both in the warning colour — "Platform 5 or 6" — as 9292 does at Schiphol. Stops already list their platforms; a journey needs a way to say a platform is not decided.
- **Where:** the rail's departure rows and the arrival row.
- **Size:** L.
- **Done when:** a journey with an unsettled platform shows two in red, a settled one shows one as today, and the stops list does not have to be edited by hand.

---

## The rail: places

### 11. Stop or station
**9292 names the stop you stand at, with its street or building. OVVO names the station.**

- **Build:** the rail names the stop the ride actually leaves from, with its street or building, as 9292 does. A ride starts at the boarding stop, and the walk to it is split off the front of the journey.
- **Where:** every ride row's departure, and the arrival row's end.
- **Size:** XL, because it touches every journey the app makes.
- **Done when:** a bus journey begins at the bus stop by name, a train journey begins at the station, the walk to the stop is its own row with its own minutes, and the times still add up.

### 12. The first row
**9292 calls it only the starting point. OVVO prints the address itself.**

- **Build:** the first row says only that this is where the journey starts, with no address beside it.
- **Where:** the first row of the rail.
- **Size:** S.
- **Done when:** the first row carries the words for the starting point, the time, and the walk under it, and no address.

---

## The rail: services and walks

### 13. The route link
**9292 gives every walk a link that opens it on the map, with the dashed line drawn along the real streets. OVVO has no walking route view.**

- **Build:** every walk gets the link, opening that walk on the map with the dashed line **along the real streets**. Our map today is a drawing of the network with no streets on it, so this item brings in a real street map: tiles behind the drawing, a walking route between the two points, and the dashed line laid on that route.
- **Where:** the walk rows, and the map.
- **Size:** XL, because the street map is the foundation for 13, 14 and 4.
- **Done when:** the link opens the walk, the line follows real streets between the two ends, and it still draws when the network is slow.

### 14. A map button on every ride
**9292 ends each ride row with a blue map glyph that opens that leg on the map — the route drawn, a "Navigeer" button, and the leg's two times under it. OVVO has nothing per leg.**

- **Build:** the blue glyph at the end of every ride row, opening that leg alone: the route drawn on the street map, a **Navigeer** button, and the leg's two times under it. Navigeer walks the route step by step, from the point you are at.
- **Where:** every ride row, and the map.
- **Size:** XL on top of 13.
- **Done when:** every ride row has the glyph, it opens that leg and no other, the two times under it match the row, and Navigeer steps along the route.

### 15. Operator and line badge
**9292 writes the operator before the service and puts the line number in a coloured badge — pink for bus 3, purple for the night bus. OVVO keeps the number inside the name, with no badge.**

- **Build:** the operator stays in front of the name, and the number comes out of the name into a coloured badge of its own. One colour per mode, a separate one for a night service.
- **Where:** the service line of every ride row.
- **Size:** M.
- **Done when:** "NS Intercity" keeps its operator, the number sits in a badge, and a night bus reads in its own colour in both themes.

### 16. Crowding per service
**9292 shows two or three little people under each service, with a "?" when it is unknown. OVVO says it once at the foot of the page.**

- **Build:** two or three little people under each service, and a "?" where we do not know. Busy-ness is recorded once per journey today, so each ride gets its own figure first; otherwise every service would show the same faces, which is worse than the line at the foot.
- **Where:** the service line of every ride row.
- **Size:** L.
- **Done when:** each service carries its own faces, an unknown one shows "?", and the foot no longer says busy-ness.

---

## The rail: changes and opened stops

### 17. The change itself
**9292 gives a change its own row with a walking figure and the minutes you wait, printed both before and after. OVVO prints nothing on the rail for a change.**

- **Build:** a row of its own between the two services, with the walking figure and the minutes you wait, printed once arriving and once setting off, as 9292 does. The wait is already known from the two legs.
- **Where:** the rail, at every change.
- **Size:** M.
- **Done when:** a journey with a change shows the row, the minutes are the difference between the two legs, and a direct journey shows no row.

### 18. Opening
**9292 opens every leg at once. OVVO opens one service at a time.**

- **Build:** the opened page starts with every service expanded.
- **Where:** the opened list on the rail.
- **Size:** M.
- **Done when:** arriving with the stops open opens all of them, and a two-train journey is checked for length before it is kept.

### 19. The marks in an opened list
**9292 draws stops smaller and thinner, most stop rows carry no platform, and station rows stay heavier than stop rows. OVVO shows a platform on every stop row, in the same small text as the station.**

- **Build:** smaller, thinner marks for stops; no platform beside a stop; and the stations left visibly heavier than the stops around them, so the line still reads as one service.
- **Where:** the opened list on the rail.
- **Size:** M.
- **Done when:** in an opened list the stop marks are thinner than the station marks, no stop row carries a platform, and the stations read heavier than the stops.

---

## The foot and the shell

### 20. The facts line
**OVVO closes with "37 min walking · Expected fairly busy · Bicycle allowed". 9292 has no such line; it says walking and crowding per leg.**

- **Build:** the line goes. The walking is said on the walk rows, which already carry their minutes; the crowding moves onto each service with item 16. The bicycle keeps one short line of its own under the rail, because 9292 has no place for it and the fact is worth keeping.
- **Where:** the foot of the page.
- **Size:** S.
- **Done when:** the three-fact line is gone, the walking and crowding are read on the legs, and the bicycle is still said once, quietly.

---

## The order to build it in

1. **The quick ones together:** 3, 5, 6, 8, 12, 20.
2. **The head:** 7, then 9 with the phone-width check, then 4.
3. **The rail's own look:** 17, 15, 19, 18.
4. **What a journey knows:** 16, 10, 11.
5. **The two features:** 2, then 1.
6. **The street map, then the two views on it:** 13 and 14.

Each group is built, checked at a phone width in both themes, deployed and pushed before the next one starts.

## Two notes, so nothing is discovered late

- **The alarm in item 1 is a browser reminder.** It fires while the page is open in a tab. The calendar entry from item 2 is the one that alarms with the site closed, so the alarm sheet offers that as the way to be sure.
- **Items 13 and 14 need a real street map.** That is a service the app does not have yet, and it costs money; it is the only part of this plan that cannot be built from what the app already holds.

## Done so far

Built, checked and deployed (the twenty items above are untouched by this list):

- **3. Alert counter** — gone from the top row, on every screen. The count is still the link's own
  accessible name, so a screen reader hears how many alerts there are.
- **5. Separators between the mode glyphs** — a small dot between each pair.
- **6. The change count** — the figure, the multiplication sign and the swap glyph, with the words
  kept for a screen reader.
- **8. Time weight** — the times are ordinary weight again, still numeral-aligned.
- **12. The first row** — a journey that begins at an address now says only that this is the
  starting point; a journey that begins at a stop still names the stop.
- **20. The facts line** — the three-fact line is gone; the bicycle stays as one quiet line.
