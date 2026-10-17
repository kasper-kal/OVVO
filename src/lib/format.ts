import type { StopType, TimeWindow, TravelMode } from '../data/types';
import { LOCALE_TAG } from './i18n';
import type { Language } from '../state/types';

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

export function formatDuration(minutes: number, language: Language = 'en'): string {
  const total = Math.max(1, Math.round(minutes));
  const h = Math.floor(total / 60);
  const m = total % 60;
  /* "hr" is the one unit word this app prints, so it is the one that has to travel. */
  const hour = language === 'nl' ? 'uur' : 'hr';
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} ${hour}`;
  return `${h} ${hour} ${m} min`;
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

/*
 * Dates are formatted by `Intl`, not by a table of English names.
 *
 * Weekday and month names are the one part of this app whose language is not ours to write:
 * every locale has its own, its own capitalisation and its own abbreviations, and a hand-kept
 * list of twelve Dutch months would be wrong the first time the interface gained a third
 * language. The pattern (day, then month) stays ours, because that is a design decision.
 */
const TODAY_WORD: Record<Language, string> = { en: 'Today', nl: 'Vandaag' };
const TOMORROW_WORD: Record<Language, string> = { en: 'Tomorrow', nl: 'Morgen' };

function localeDate(date: Date, language: Language, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(LOCALE_TAG[language], options).format(date);
}

/** Date label honouring the "date format" setting, in the chosen language. */
export function formatDate(
  iso: string,
  style: 'short' | 'long' | 'dayMonth' = 'long',
  language: Language = 'en',
): string {
  const date = fromIsoDate(iso);
  const today = new Date();
  const isToday = toIsoDate(today) === iso;
  const isTomorrow = addDaysIso(toIsoDate(today), 1) === iso;
  const short = `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
  const dayMonth = localeDate(date, language, { day: 'numeric', month: 'short' });
  if (style === 'dayMonth') return isToday ? TODAY_WORD[language] : dayMonth;
  if (style === 'short') return short;
  if (isToday) return `${TODAY_WORD[language]}, ${dayMonth}`;
  if (isTomorrow) return `${TOMORROW_WORD[language]}, ${dayMonth}`;
  return localeDate(date, language, { weekday: 'long', day: 'numeric', month: 'long' });
}

export function nowMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

/**
 * Milliseconds until the next whole minute.
 *
 * The interval every clock in the app is armed with, instead of a fixed "every 30 seconds from
 * mount": a board that re-reads the clock at :37 past is wrong at the top of the next minute for
 * up to 59 seconds, which is exactly how a departure reads a minute late. See `useMinuteNow`.
 */
export function msToNextMinute(now: Date = new Date()): number {
  const elapsed = now.getSeconds() * 1000 + now.getMilliseconds();
  return 60_000 - elapsed;
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

/** "1 leg" / "2 legs" — counts should never read as "1 legs" or "2 leg(s)". */
export function plural(count: number, singular: string, pluralForm?: string): string {
  return `${count} ${count === 1 ? singular : (pluralForm ?? `${singular}s`)}`;
}

/**
 * The one name for each mode, used by every chip, badge and list in the app. The
 * access and egress modes are named the same way as the rest: seven modes, seven
 * labels, no special cases.
 */
export const MODE_LABELS: Record<TravelMode, string> = {
  walk: 'Walking',
  bike: 'Biking',
  train: 'Train',
  bus: 'Bus',
  tram: 'Tram',
  metro: 'Metro',
  ferry: 'Ferry',
};

/** Stop types spelled for people; the data's own values (`metrostop`) are not labels. */
export const STOP_TYPE_LABELS: Record<StopType, string> = {
  station: 'Station',
  airport: 'Airport',
  metrostop: 'Metro stop',
  tramstop: 'Tram stop',
  busstop: 'Bus stop',
  ferrystop: 'Ferry stop',
  landmark: 'Landmark',
};

export function stopTypeLabel(type: StopType): string {
  return STOP_TYPE_LABELS[type];
}

export const MODE_ICONS: Record<TravelMode, string> = {
  walk: '🚶',
  bike: '🚲',
  train: '🚆',
  bus: '🚌',
  tram: '🚊',
  metro: 'Ⓜ',
  ferry: '⛴',
};
