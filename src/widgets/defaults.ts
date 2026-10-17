/**
 * The home-screen layout defaults. Kept in its own module (with no imports) so
 * the app state can read it without importing the widget components.
 */

/** Widgets shown on a fresh home screen, in this order. */
export const DEFAULT_HOME_WIDGETS: string[] = [
  'planner',
  'map',
  'favourited-journeys',
  'recent-searches',
  'preferences-summary',
];

/** Widgets that cannot be removed — the home screen would stop being useful. */
export const REQUIRED_WIDGETS: string[] = ['planner'];
