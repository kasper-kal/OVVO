import { useEffect, useState } from 'react';
import { msToNextMinute, nowMinutes } from './format';

/**
 * The current time, in minutes since midnight, kept true to the minute.
 *
 * Two defects live in the naive version this replaces — `Math.max(0, nowMinutes() - 1)` computed
 * once per render, or recomputed on an interval that started when the page did:
 *
 *   1. The clock was read **one minute behind** the browser's own time on the departure board and
 *      the stop page, so a departure that had already left was still listed as upcoming and the
 *      "from {time}" line named a minute that had passed. That offset is gone: every caller reads
 *      the minute the browser is actually in.
 *   2. It was stale between renders. A board whose screen did not change kept the minute it was
 *      first drawn in, so the time on it drifted further behind the longer it was left open.
 *
 * The timer is aligned to the **next whole minute** rather than firing every N seconds from
 * mount: a clock that re-reads at :37 past is wrong for up to 59 seconds at the top of every
 * minute, and a departure due "now" would appear a minute late. Re-armed from the callback, so it
 * stays aligned after a slow tick, a sleeping tab, or a clock that was changed under it.
 */
export function useMinuteNow(): number {
  const [minutes, setMinutes] = useState(() => nowMinutes());

  useEffect(() => {
    let timer = 0;
    const arm = () => {
      timer = window.setTimeout(() => {
        setMinutes(nowMinutes());
        arm();
      }, msToNextMinute());
    };
    const disarm = () => {
      window.clearTimeout(timer);
      timer = 0;
    };
    arm();
    /*
     * **A clock nobody can see does not need to be kept.**
     *
     * The timer re-armed itself every minute for as long as the app was open, whether or not the
     * screen was showing it — a phone with OVVO in the background woke once a minute to re-read a
     * number on a page it could not display, and at a tenth of a battery that is exactly the kind of
     * spending the saving modes exist to stop. Hidden: the timer goes. Visible again: the minute is
     * read once, immediately, so the first paint after the nap is already right, and the clock is
     * re-armed from there.
     *
     * The alternative — checking the clock on every wake — would still be a wake per minute. This is
     * none.
     */
    const onVisible = () => {
      if (document.visibilityState === 'hidden') {
        disarm();
        return;
      }
      setMinutes(nowMinutes());
      disarm();
      arm();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      disarm();
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return minutes;
}
