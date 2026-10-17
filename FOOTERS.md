# Footers — what each one is and what happened to it

A "footer" here means the card that closes a page and holds actions, not the `footer=` prop on
`Dialog`, which belongs to the dialogue.

| # | Page → footer | Contents | Decision |
|---|---|---|---|
| 1 | Departure boards → **About this board** | Four lines describing the board: which clock the times use, that platforms and delays are per departure, the refresh cadence, pin-vs-favourite | **Removed.** Nothing in it was a fact about a departure, and the board's own header already prints the refresh cadence |
| 2 | Results → **About these results** | Disclaimer, *Keep this search*, Back to planner, Departure stop, Arrival stop, Network map | **Kept for now — still to be decided.** See below |
| 3 | Journey detail → **Continue** | Back to results, the two stops as links | **Removed.** The shell's back arrow already returns; both stops are in the title and the leg list |
| 4 | Alert detail → **Related screens** | Departure boards, Network map, My results | **Removed.** One is in the sidebar; none of the three is advice about the alert |
| 5 | Alert detail → **Other alerts** | Previous / next alert with titles | **Kept.** The only way to read the next alert without going back to the list |
| 6 | Disruptions → **Alerts on your journey** | How many of these alerts touch the stops at the ends of the search planned this session, plus Back to results and a re-run button | **Removed.** The list is network-wide and has no business knowing a journey; the `search` it read is in-memory only (`AppState` starts it at `null`), so the panel could not mean the same thing twice |
| 7 | Home → **customising bar** | "Customise home"; in mode: Add widget, Reset layout, Done | **Kept.** Mode-only, and the only route into adding or arranging widgets |
| 8 | Preferences → foot of **All preferences** | Reset to defaults | **Kept.** Belongs to the form it resets, not to the page |
| 9 | Settings → **Preview with current settings** | Readings only, no controls | **Kept.** Last card of content, not a summary of actions |
| 10 | Not found → **EmptyState** | Back to the planner, Network map | **Kept.** The map link is the only route to `/map` from that screen |

## 2 — Results → "About these results": still on the list

Four different things share one card, which is why it was not cut with the others:

1. `Fares, occupancy, delays and platforms are indicative.` — a disclaimer, and the only place
   the app admits the data is simulated.
2. **Keep this search** — a stateful control. Searching no longer writes to recent searches by
   itself, so this button is the *only* way to keep one. Removing the card would remove it.
3. `Back to planner` — duplicated by Home in the sidebar and by the shell's back arrow.
4. `Departure stop` / `Arrival stop` / `Network map` — the two stop links repeat names already
   printed on every journey card; the map link is the only route to `/map` from this screen.

The likely shape is to keep (1) and (2), drop (3), and move the map link into the journey cards'
own "Show on map" affordance, which already exists. That is a design decision rather than a
deletion, so it waits.
