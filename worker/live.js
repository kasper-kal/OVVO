/**
 * `/api/live`: live running times, asked for by trip.
 *
 * The browser cannot reach the national realtime feed (binary protobuf, no CORS), so the worker
 * reads it and answers with just the few trips the page is showing. Everything comes from the feed;
 * if the feed cannot be read the route says so with a 503 rather than inventing a delay.
 */

import { liveDelays } from '../shared/live-feed.mjs';

export async function liveRoute(url) {
  const trips = (url.searchParams.get('trips') ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);

  try {
    const live = await liveDelays(trips);
    return new Response(JSON.stringify(live), {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        /* Live means live: a cached minute-old delay is a wrong delay. */
        'cache-control': 'no-store',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'live-feed-unavailable', message: error instanceof Error ? error.message : 'the live feed could not be read' }),
      { status: 503, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } },
    );
  }
}
