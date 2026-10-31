/**
 * **What is falling behind the cards today.**
 *
 * Two things decide it, and only one of them can win: the calendar and the weather. The calendar is
 * exact — a date and an hour, read on the device — so it always answers, and it outranks the sky
 * (a white Christmas still shows its own snow rather than the rain outside). The weather is a guess
 * from a free forecast, so it is only asked when the calendar says nothing.
 *
 * The forecast is Open-Meteo: no key, no account, one request for the current hour. It is asked for
 * the rain *chance*, because the steerer's rule is a floor rather than an amount — at 20% or less
 * nothing falls, however grey the sky looks.
 *
 * The coordinates are only taken when the traveller has already granted location, so this never
 * opens a prompt of its own for a decoration. Without it the answer is Utrecht, which is a fair
 * middle for a Dutch planner.
 */

/** What the page can show behind its cards. `null` — nothing falls. */
export type Mood = 'rain' | 'snow' | 'fireworks' | 'lights' | 'christmas' | 'pepernoten';

/** Nothing falls at or below this chance, in percent. */
export const RAIN_FLOOR = 20;

const HOME = { latitude: 52.0894, longitude: 5.1106 };
const CACHE_KEY = 'ovvo:weather';
const CACHE_MS = 20 * 60 * 1000;

/**
 * **The calendar's own days.**
 *
 * New year is the one window that crosses midnight, so it is written as two: from ten in the evening
 * on the last day until two in the morning on the first. Sinterklaas is the evening of the fifth,
 * Christmas Eve is lit from six, Christmas Day is its own quieter mix, and the small hours of the
 * twenty-sixth keep the lights on for the drive home.
 */
export function calendarMood(now: Date = new Date()): Mood | null {
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const hour = now.getHours();

  if ((month === 12 && day === 31 && hour >= 22) || (month === 1 && day === 1 && hour < 2)) {
    return 'fireworks';
  }
  if (month === 12 && day === 5 && hour >= 18 && hour < 20) return 'pepernoten';
  if (month === 12 && day === 24 && hour >= 18) return 'lights';
  if (month === 12 && day === 25) return 'christmas';
  if (month === 12 && day === 26 && hour < 2) return 'lights';
  return null;
}

function readCache(): 'rain' | 'snow' | null {
  try {
    const raw = window.sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at: number; weather: string | null };
    if (!parsed || Date.now() - parsed.at > CACHE_MS) return null;
    return parsed.weather === 'rain' || parsed.weather === 'snow' ? parsed.weather : null;
  } catch {
    return null;
  }
}

function writeCache(weather: 'rain' | 'snow' | null): void {
  try {
    window.sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), weather }));
  } catch {
    /* A full or blocked store only costs a second request later. */
  }
}

/** The device's own position, and only when it has already been allowed. */
function here(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve(HOME);
      return;
    }
    let settled = false;
    const answer = (value: { latitude: number; longitude: number }) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    const timer = window.setTimeout(() => answer(HOME), 4000);
    const take = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          window.clearTimeout(timer);
          answer({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        },
        () => {
          window.clearTimeout(timer);
          answer(HOME);
        },
        { timeout: 4000, maximumAge: 600_000 },
      );
    };
    const permission = navigator.permissions?.query?.({ name: 'geolocation' as PermissionName });
    if (!permission) {
      /* With no way to ask quietly, the prompt is not worth a decoration. */
      window.clearTimeout(timer);
      answer(HOME);
      return;
    }
    permission
      .then((status) => {
        if (status.state === 'granted') take();
        else {
          window.clearTimeout(timer);
          answer(HOME);
        }
      })
      .catch(() => {
        window.clearTimeout(timer);
        answer(HOME);
      });
  });
}

const SNOW_CODES = [71, 73, 75, 77, 85, 86];
const RAIN_CODES = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99];

function classify(chance: number, code: number): 'rain' | 'snow' | null {
  if (!Number.isFinite(chance) || chance <= RAIN_FLOOR) return null;
  if (SNOW_CODES.includes(code)) return 'snow';
  if (RAIN_CODES.includes(code)) return 'rain';
  return null;
}

/**
 * **The sky over the traveller, for the hour they are standing in.**
 *
 * One request, cached for twenty minutes in the tab's own storage: the answer changes by the hour,
 * and a page that re-asked on every screen would be a decoration costing a radio wake-up the app
 * does not need. Any failure — offline, blocked, a shape that changed — is simply "nothing falls",
 * which is also the state before the answer arrives.
 */
export async function readWeather(): Promise<'rain' | 'snow' | null> {
  const cached = readCache();
  if (cached) return cached;

  try {
    const { latitude, longitude } = await here();
    const url =
      'https://api.open-meteo.com/v1/forecast' +
      `?latitude=${latitude.toFixed(3)}&longitude=${longitude.toFixed(3)}` +
      '&hourly=precipitation_probability,weather_code&forecast_days=1&timezone=auto';
    const response = await fetch(url, { headers: { accept: 'application/json' } });
    if (!response.ok) return null;
    const data = (await response.json()) as {
      hourly?: { precipitation_probability?: number[]; weather_code?: number[] };
    };
    const hour = new Date().getHours();
    const chance = Number(data.hourly?.precipitation_probability?.[hour] ?? 0);
    const code = Number(data.hourly?.weather_code?.[hour] ?? 0);
    const weather = classify(chance, code);
    writeCache(weather);
    return weather;
  } catch {
    return null;
  }
}
