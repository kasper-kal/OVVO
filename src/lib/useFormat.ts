import { useMemo } from 'react';
import { useApp } from '../state/AppState';
import { formatDate, formatDuration, formatMinutes, relativeMinutes } from './format';

/** All presentation of times and dates goes through this hook so Settings apply everywhere. */
export function useFormat() {
  const { settings } = useApp();
  const hour12 = settings.timeFormat === '12h';
  const shortDates = settings.dateFormat === 'short';
  return useMemo(
    () => ({
      hour12,
      time: (minutes: number) => formatMinutes(minutes, hour12),
      duration: (minutes: number) => formatDuration(minutes),
      date: (iso: string, style: 'long' | 'dayMonth' = 'long') =>
        shortDates ? formatDate(iso, 'short') : formatDate(iso, style),
      relative: (planned: number, expected: number) => relativeMinutes(planned, expected),
    }),
    [hour12, shortDates],
  );
}
