/*
 * The reason the offline strip can be believed.
 *
 * The strip says "OVVO still works — your journeys, boards and saved stops are all here", and until
 * now that was true only until somebody reloaded: a cold load with no network showed the browser's
 * own error page, because a page the browser has never been given cannot be drawn from nowhere. The
 * app is entirely local (no server, no API of its own), so the whole thing is one shell plus a few
 * data modules, and keeping them on the device is enough to make the promise true on a reload.
 *
 * Two behaviours, and they are deliberately different:
 *
 * - **A navigation** is network-first. Fresh markup is worth one request when there is a network;
 *   the cached copy is the answer when there is not. A successful response replaces the cached one,
 *   so a new build is picked up on the next online load rather than being pinned forever.
 * - **Everything else same-origin** is cache-first with a background fill. The bundles are
 *   content-hashed by the build, so a cached hit is the right hit; the fonts and the favicon do not
 *   change either. Nothing here is live data — live times never existed on this app — so there is
 *   nothing to keep fresh.
 *
 * Cross-origin requests (the Google font files, the IP estimate) are left to the network and to
 * their own caches: they are not this app's to store, and a stale font is not worth a stale estimate
 * of where somebody is.
 */
const CACHE = 'ovvo-shell-v1';
const SHELL = ['/', '/index.html', '/favicon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      /* `reload` so the install cannot be satisfied by an older copy in the HTTP cache. */
      .then((cache) => cache.addAll(SHELL.map((url) => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put('/index.html', copy));
          }
          return response;
        })
        .catch(() => caches.match('/index.html').then((hit) => hit || caches.match('/'))),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((hit) => {
      if (hit) return hit;
      return fetch(request).then((response) => {
        if (response.ok && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    }),
  );
});
