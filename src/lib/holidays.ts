import { styleById, type StyleDef } from './styles';

/**
 * **The four days the app dresses for, and when the next one is.**
 *
 * The Styles page keeps its Holidays shelf at the bottom all year. This is the one thing that
 * changes with the calendar: three weeks before a holiday, that shelf is announced at the top of
 * the page, because a look for a day that is three weeks away is worth finding without scrolling,
 * and a look for a day that is four months away is not.
 *
 * The dates are the Dutch ones, which are the ones the four styles are about: Sinterklaas on
 * 5 December, Christmas on 25 December, New Year on 1 January, and Easter, which moves. Easter is
 * the Gregorian Easter Sunday, computed rather than typed in, because a table of dates is a table
 * that runs out.
 *
 * Nothing here reads the clock for itself: `upcomingHoliday` takes the moment it is asked about,
 * so the reading can be checked against a dozen different days without waiting for one of them.
 */

/** How many days ahead a holiday starts being announced. */
export const UPCOMING_WINDOW_DAYS = 21;

interface HolidayRule {
  styleId: string;
  fixed?: { month: number; day: number };
  easter?: boolean;
}

/*
 * Kept in calendar order, which is also the order the year draws them: New Year, Easter, Halloween,
 * Sinterklaas, Christmas. The reader below takes the soonest, so the order is documentation rather
 * than logic.
 */
const RULES: HolidayRule[] = [
  { styleId: 'new-year', fixed: { month: 0, day: 1 } },
  { styleId: 'easter', easter: true },
  { styleId: 'halloween', fixed: { month: 9, day: 31 } },
  { styleId: 'sinterklaas', fixed: { month: 11, day: 5 } },
  { styleId: 'christmas', fixed: { month: 11, day: 25 } },
];

/** The Gregorian Easter Sunday for a year, as a date at local midnight. */
export function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

/** The day a rule falls on in a year, at local midnight. */
function holidayDate(rule: HolidayRule, year: number): Date {
  if (rule.easter) return easterSunday(year);
  return new Date(year, rule.fixed!.month, rule.fixed!.day);
}

export interface UpcomingHoliday {
  style: StyleDef;
  /** The holiday itself, at local midnight. */
  date: Date;
  /** Whole days from today to the holiday: 0 is today, 1 is tomorrow. */
  days: number;
}

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The next holiday, when it is within the window, or `null` when the page should not announce one.
 *
 * "Within three weeks" means today or any of the next twenty one days. A holiday that has just
 * passed is not returned: the day after Sinterklaas the page goes quiet rather than pointing at a
 * party that is over.
 */
export function upcomingHoliday(now: Date = new Date()): UpcomingHoliday | null {
  const today = startOfDay(now);
  let soonest: UpcomingHoliday | null = null;

  for (const rule of RULES) {
    for (const year of [today.getFullYear(), today.getFullYear() + 1]) {
      const date = holidayDate(rule, year);
      const days = Math.round((date.getTime() - today.getTime()) / DAY_MS);
      if (days < 0 || days > UPCOMING_WINDOW_DAYS) continue;
      if (!soonest || days < soonest.days) {
        soonest = { style: styleById(rule.styleId), date, days };
      }
    }
  }

  return soonest;
}
