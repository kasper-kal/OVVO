import { useMemo } from 'react';
import { useApp } from '../state/AppState';
import { formatDate, formatDuration, formatMinutes, relativeMinutes } from './format';

/**
 * All presentation of times and dates goes through this hook so Settings apply everywhere —
 * the clock format, the date format and the language all arrive here and nowhere else.
 */
export function useFormat() {
  const { settings } = useApp();
  const hour12 = settings.timeFormat === '12h';
  const shortDates = settings.dateFormat === 'short';
  const language = settings.language;
  return useMemo(
    () => ({
      hour12,
      language,
      time: (minutes: number) => formatMinutes(minutes, hour12),
      duration: (minutes: number) => formatDuration(minutes, language),
      date: (iso: string, style: 'long' | 'dayMonth' = 'long') =>
        shortDates ? formatDate(iso, 'short', language) : formatDate(iso, style, language),
      relative: (planned: number, expected: number) => relativeMinutes(planned, expected),
      /** A count and its noun, in the language the interface is in. */
      plural: (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`,
    }),
    [hour12, shortDates, language],
  );
}
