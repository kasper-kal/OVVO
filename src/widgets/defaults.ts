/**
 * The home-screen layout defaults. Kept in its own module (with no imports) so
 * the app state can read it without importing the widget components.
 */

/**
 * What a fresh home screen holds — chosen by the widget audit (`WIDGET-AUDIT.md`), not by the
 * catalogue's age.
 *
 * The old default was *planner, map, favourited-journeys, recent-searches, preferences-summary*,
 * and on a fresh browser it measured **1067px**: 331px of it two empty lists apologising for
 * themselves, 165px a restatement of settings the traveller had just chosen, and 563px a map of
 * the whole country on which not one label was theirs. The three cards that replace them are the
 * three that hold something of the traveller's or do something for them:
 *
 *   • **planner** — the app's one job.
 *   • **next-departures** — the board at a station of your own, tied once and then read at a
 *     glance. It was in the catalogue and switched off, which was the audit's whole finding.
 *   • **pinned-stops** — the stops you hearted, one tap each.
 *
 * `next-departures` arrives **untied**, asking for its station in the card itself (one sentence and
 * one field), because a home screen cannot invent which station the traveller leaves from. That is
 * 159px of question rather than 386px of someone else's timetable.
 */
export const DEFAULT_HOME_WIDGETS: string[] = ['planner', 'next-departures', 'pinned-stops'];

/** Widgets that cannot be removed — the home screen would stop being useful. */
export const REQUIRED_WIDGETS: string[] = ['planner'];

/**
 * Widget ids whose card became another card.
 *
 * A stored layout can name a card that has been cut. The home screen already draws only the ids
 * that still have a widget (`widgetById`), so a cut id is a slot that draws nothing rather than a
 * broken card and needs no help here. A **merged** id is different, because dropping it would lose
 * the traveller's card: `favourited-journeys` and `recent-searches` are folded into
 * `your-journeys` — at the position the first of them held, and only once, because two cards
 * showing the same list is worse than one.
 */
export const MERGED_WIDGETS: Record<string, string> = {
  'favourited-journeys': 'your-journeys',
  'recent-searches': 'your-journeys',
};

/** Brought forward from a stored layout: merged ids become their replacement, duplicates dropped. */
export function migrateHomeWidgets(stored: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of stored) {
    const next = MERGED_WIDGETS[id] ?? id;
    if (seen.has(next)) continue;
    seen.add(next);
    out.push(next);
  }
  return out;
}
