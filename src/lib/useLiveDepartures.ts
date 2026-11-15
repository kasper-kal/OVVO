import { useEffect, useMemo, useState } from 'react';
import type { Departure } from '../data/types';

/**
 * **Live delays on a departure board.**
 *
 * The timetable gives a scheduled time; the realtime feed gives the delay of the vehicle that is
 * actually coming. This hook asks for the trips the board is showing, and returns the same rows with
 * an expected time. A row the feed does not mention keeps its scheduled time and no delay, which is
 * the truthful reading: nothing is claimed about a vehicle that has not reported.
 *
 * The feed is polled once a minute, which is its own refresh rate.
 */

const REFRESH_MS = 60_000;

interface LiveResponse {
  generatedAt: string | null;
  fetchedAt: string;
  delays: Record<string, number>;
}

export function useLiveDepartures(departures: Departure[]): Departure[] {
  const key = useMemo(
    () =>
      [...new Set(departures.map((departure) => departure.tripId).filter((id): id is string => Boolean(id)))]
        .sort()
        .join(','),
    [departures],
  );

  const [delays, setDelays] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!key) {
      setDelays({});
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const load = async () => {
      try {
        const response = await fetch(`/api/live?trips=${encodeURIComponent(key)}`, {
          signal: controller.signal,
          headers: { accept: 'application/json' },
        });
        if (!response.ok) return;
        const body = (await response.json()) as LiveResponse;
        if (!cancelled) setDelays(body.delays ?? {});
      } catch {
        /* Offline or the feed is down: the board keeps its scheduled times rather than inventing one. */
      }
    };

    void load();
    const timer = window.setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      controller.abort();
      window.clearInterval(timer);
    };
  }, [key]);

  return useMemo(() => {
    if (Object.keys(delays).length === 0) return departures;
    return departures.map((departure) => {
      const seconds = departure.tripId ? delays[departure.tripId] : undefined;
      if (seconds === undefined) return departure;
      const minutes = Math.round(seconds / 60);
      return {
        ...departure,
        expected: departure.planned + minutes,
        delayMinutes: minutes,
        source: 'realtime',
      };
    });
  }, [departures, delays]);
}
