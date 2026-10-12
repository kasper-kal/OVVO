import type { TimeWindow, TravelMode } from '../data/types';

export function pad(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

/** "14:05" (24-hour) or "2:05 pm" (12-hour) depending on the user setting. */
export function formatMinutes(minutes: number, hour12 = false): string {
  const normalised = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const h = Math.floor(normalised / 60);
  const m = normalised % 60;
  if (!hour12) return `${pad(h)}:${pad(m)}`;
  const suffix = h < 12 ? 'am' : 'pm';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${pad(m)} ${suffix}`;
}

export function formatDuration(minutes: number): string {
  const total = Math.max(1, Math.round(minutes));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr`;
  return `${h} hr ${m} min`;
}

export function todayIso(): string {
  return toIsoDate(new Date());
}

export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function addDaysIso(iso: string, days: number): string {
  const date = fromIsoDate(iso);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

export function fromIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Date label honouring the "date format" setting. */
export function formatDate(iso: string, style: 'short' | 'long' | 'dayMonth' = 'long'): string {
  const date = fromIsoDate(iso);
  const today = new Date();
  const isToday = toIsoDate(today) === iso;
  const isTomorrow = addDaysIso(toIsoDate(today), 1) === iso;
  const short = `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
  const dayMonth = `${date.getDate()} ${MONTHS[date.getMonth()].slice(0, 3)}`;
  if (style === 'dayMonth') return isToday ? 'Today' : dayMonth;
  if (style === 'short') return short;
  if (isToday) return `Today, ${dayMonth}`;
  if (isTomorrow) return `Tomorrow, ${dayMonth}`;
  return `${DAYS[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

export function nowMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

export function roundToStep(minutes: number, step = 5): number {
  return Math.round(minutes / step) * step;
}

export function clampTime(minutes: number): number {
  return Math.max(0, Math.min(1439, Math.round(minutes)));
}

export function timeWindowLabel(window: TimeWindow, hour12 = false): string {
  return `${formatDate(window.date, 'short')} ${formatMinutes(window.minutes, hour12)}`;
}

export function relativeMinutes(planned: number, expected: number): string {
  const diff = expected - planned;
  if (diff <= 0) return 'on time';
  return `+${diff} min`;
}

export const MODE_LABELS: Record<TravelMode, string> = {
  walk: 'Walk',
  bike: 'Bicycle',
  train: 'Train',
  bus: 'Bus',
  tram: 'Tram',
  metro: 'Metro',
  ferry: 'Ferry',
};

export const MODE_ICONS: Record<TravelMode, string> = {
  walk: '🚶',
  bike: '🚲',
  train: '🚆',
  bus: '🚌',
  tram: '🚊',
  metro: 'Ⓜ',
  ferry: '⛴',
};
