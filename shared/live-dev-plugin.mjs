/**
 * The same `/api/live` route, served by the dev server.
 *
 * `vite dev` does not run the worker, so without this the live delays would exist only after a
 * deploy and could not be checked here. This imports the **same** module the worker uses, so a
 * successful local check is a check of the real reading code, not of a stand-in.
 */
import { liveDelays } from './live-feed.mjs';

export default function liveFeedPlugin() {
  return {
    name: 'ovvo-live-feed',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const url = new URL(request.url ?? '/', 'http://localhost');
        if (url.pathname !== '/api/live') {
          next();
          return;
        }

        const trips = (url.searchParams.get('trips') ?? '')
          .split(',')
          .map((id) => id.trim())
          .filter(Boolean);

        try {
          const live = await liveDelays(trips);
          response.statusCode = 200;
          response.setHeader('content-type', 'application/json; charset=utf-8');
          response.setHeader('cache-control', 'no-store');
          response.end(JSON.stringify(live));
        } catch (error) {
          response.statusCode = 503;
          response.setHeader('content-type', 'application/json; charset=utf-8');
          response.end(
            JSON.stringify({
              error: 'live-feed-unavailable',
              message: error instanceof Error ? error.message : 'the live feed could not be read',
            }),
          );
        }
      });
    },
  };
}
