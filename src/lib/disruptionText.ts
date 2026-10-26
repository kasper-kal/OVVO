import type { Disruption } from '../data/types';

type Translate = (key: string, vars?: Record<string, string | number>) => string;

/**
 * **An alert's own three sentences, in the interface's language.**
 *
 * The alerts live in `data/disruptions.ts`, which is demonstration timetable data, so they are
 * written once in English. What the traveller reads them in is the screen's business, and every
 * screen that prints an alert goes through here rather than reading `.title` straight off the
 * record — otherwise a Dutch page shows Dutch around English words.
 *
 * Nothing else about an alert is translated: the place names, line numbers, carrier names and
 * times inside these sentences are the timetable talking, and they are the same words in both
 * languages because they are the names of real places.
 */
export function alertWords(t: Translate, alert: Disruption) {
  return {
    title: t(alert.title),
    description: t(alert.description),
    advice: t(alert.advice),
  };
}

/** One line for a leg that an alert touches: the alert's title, in the chosen language. */
export function alertLine(t: Translate, alert: Disruption): string {
  return t('Alert: {title}', { title: t(alert.title) });
}
